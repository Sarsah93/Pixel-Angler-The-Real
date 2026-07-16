/**
 * @file KosisCatchApiClient.ts
 * @description KOSIS(국가통계포털) 시도별 어종별 어획량 조회 API 클라이언트
 *
 * End Point: https://kosis.kr/openapi/Param/statisticsParameterData.do
 *  - method=getList, orgId=146, tblId=DT_MLTM_5003049 (어업생산동향 — 시도/어종별)
 *  - itmId=T001+T002, objL1=ALL(시도), objL2=ALL(어종), prdSe=M, newEstPrdCnt=3
 *  - format=json, jsonVD=Y
 *
 * 게임 활용: 시도별 어종 어획량 → 지역별 어종 출현 풀(Pool)/스폰 가중치 조정
 * (FishSpawningOracle의 SpawnContext.catchWeightBySpecies로 공급)
 * API 실패/키 미설정 시 Mock 폴백.
 */

/** 시도별 어종 어획량 통계 행 (정규화) */
export interface RegionalCatchStat {
  /** 시도명 (예: '강원특별자치도', '부산광역시') */
  regionName: string;
  /** 어종명 (KOSIS 분류명 — 예: '넙치류', '고등어류') */
  speciesName: string;
  /** 항목명 (어획량/어획금액 등) */
  itemName: string;
  /** 값 */
  value: number;
  /** 단위 (톤 등) */
  unit: string;
  /** 수록 시점 (YYYYMM) */
  period: string;
}

/** Mock 어획량 통계 (동해권 중심 임의 분포) */
export function getMockRegionalCatch(): RegionalCatchStat[] {
  const rows: [string, string, number][] = [
    ['강원특별자치도', '가자미류', 420], ['강원특별자치도', '넙치류', 180],
    ['강원특별자치도', '고등어류', 150], ['강원특별자치도', '볼락류', 220],
    ['강원특별자치도', '감성돔', 60], ['강원특별자치도', '전갱이류', 130],
    ['경상북도', '가자미류', 380], ['경상북도', '고등어류', 300],
    ['경상북도', '방어류', 210], ['경상북도', '넙치류', 160],
    ['부산광역시', '고등어류', 900], ['부산광역시', '전갱이류', 400],
    ['경상남도', '감성돔', 120], ['경상남도', '넙치류', 340],
    ['전라남도', '참돔', 260], ['전라남도', '감성돔', 180],
  ];
  return rows.map(([regionName, speciesName, value]) => ({
    regionName, speciesName, itemName: '어획량', value, unit: '톤', period: 'mock',
  }));
}

export class KosisCatchApiClient {
  private readonly apiKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl = 'https://kosis.kr/openapi/Param/statisticsParameterData.do';

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? '';
    this.useMock = !apiKey;
  }

  /** 시도별 어종별 어획량 조회 (최근 3개월). 실패 시 Mock 폴백 */
  async fetchRegionalCatch(): Promise<{ items: RegionalCatchStat[]; isRealData: boolean }> {
    if (this.useMock) {
      return { items: getMockRegionalCatch(), isRealData: false };
    }

    try {
      // 실호출 검증(2026-07-16): outputFields를 지정하면 C1_NM/C2_NM(시도/어종명)이
      // 누락되므로 지정하지 않는다. 응답 필드: C1_NM(시도), C2_NM(어종), ITM_NM(총마릿수/총중량),
      // DT(값), UNIT_NM, PRD_DE(YYYYMM)
      const url = new URL(this.baseUrl);
      url.searchParams.set('method', 'getList');
      url.searchParams.set('apiKey', this.apiKey);
      url.searchParams.set('itmId', 'T001 T002 ');
      url.searchParams.set('objL1', 'ALL');
      url.searchParams.set('objL2', 'ALL');
      url.searchParams.set('format', 'json');
      url.searchParams.set('jsonVD', 'Y');
      url.searchParams.set('prdSe', 'M');
      url.searchParams.set('newEstPrdCnt', '3');
      url.searchParams.set('prdInterval', '1');
      url.searchParams.set('orgId', '146');
      url.searchParams.set('tblId', 'DT_MLTM_5003049');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();

      // KOSIS는 성공 시 배열, 오류 시 {err, errMsg} 객체 반환
      if (!Array.isArray(data)) throw new Error(String(data?.errMsg ?? 'KOSIS 오류 응답'));

      const items: RegionalCatchStat[] = [];
      for (const row of data) {
        const value = Number(row?.DT);
        if (!Number.isFinite(value)) continue;
        const regionName = String(row?.C1_NM ?? '');
        const speciesName = String(row?.C2_NM ?? '');
        const itemName = String(row?.ITM_NM ?? '');
        // 합계 행 제외 + 총중량(kg) 항목만 사용 (마릿수는 어종 간 비교 왜곡)
        if (regionName === '합계' || speciesName === '합계') continue;
        if (itemName && !itemName.includes('중량')) continue;
        items.push({
          regionName,
          speciesName,
          itemName,
          value,
          unit: String(row?.UNIT_NM ?? ''),
          period: String(row?.PRD_DE ?? ''),
        });
      }
      if (items.length === 0) throw new Error('empty rows');
      return { items, isRealData: true };
    } catch (e) {
      console.warn('[KosisCatchApiClient] API 실패 — Mock 폴백:', e);
      return { items: getMockRegionalCatch(), isRealData: false };
    }
  }
}
