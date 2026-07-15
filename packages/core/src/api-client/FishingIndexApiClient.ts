/**
 * @file FishingIndexApiClient.ts
 * @description 해양수산부 국립해양조사원 바다낚시지수 조회 API 클라이언트
 *
 * End Point: https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2
 * 요청 변수: serviceKey, type(json/xml), reqDate(YYYYMMDD), gubun(갯바위/선상),
 *            pageNo, numOfRows(최대 300), include, exclude, placeName
 * 제공: 전국 주요 낚시 포인트의 어종별 수온/물때/파고를 종합한 바다낚시 가능 정도
 *       5단계 지수 (현재 일자 기준 7일간 예측)
 *
 * 게임 활용: 낚시지수 → 기본 입질 확률(P_base) 보정, 수온/파고 정보 표시.
 * API 실패/키 미설정 시 Mock 데이터 폴백 (개발 안정성).
 */

/** 낚시 장소 구분 */
export type FishingIndexGubun = '갯바위' | '선상';

/** 바다낚시지수 포인트 정보 (게임 소비용 정규화 스키마) */
export interface SeaFishingIndexInfo {
  /** 포인트/장소명 */
  placeName: string;
  /** 갯바위/선상 */
  gubun: FishingIndexGubun;
  /** 예측 일자 (YYYYMMDD) */
  date: string;
  /** 낚시지수 5단계 (1 매우나쁨 ~ 5 매우좋음) */
  indexLevel: 1 | 2 | 3 | 4 | 5;
  /** 지수 라벨 (매우좋음/좋음/보통/나쁨/매우나쁨) */
  indexLabel: string;
  /** 수온 (°C, 제공 시) */
  waterTempC?: number;
  /** 파고 (m, 제공 시) */
  waveHeightM?: number;
  /** 물때 정보 텍스트 (제공 시) */
  tideLabel?: string;
  /** 대상 어종명 (제공 시 — 예: '감성돔') */
  targetFishName?: string;
}

/** 지수 라벨 → 5단계 레벨 */
function labelToLevel(label: string): 1 | 2 | 3 | 4 | 5 {
  if (label.includes('매우') && label.includes('좋')) return 5;
  if (label.includes('좋')) return 4;
  if (label.includes('보통')) return 3;
  if (label.includes('매우') && label.includes('나쁨')) return 1;
  if (label.includes('나쁨')) return 2;
  return 3;
}

/** Mock 데이터 (API 미연동/실패 시 — 계절 기반 수온) */
export function getMockFishingIndex(gubun: FishingIndexGubun, reqDate: string): SeaFishingIndexInfo[] {
  const month = parseInt(reqDate.slice(4, 6), 10) || 7;
  const waterTemp = 12 + Math.sin(((month - 2) / 12) * Math.PI * 2) * 8 + 6;
  const places = gubun === '갯바위'
    ? ['속초항', '동명항', '영일만', '구조라']
    : ['속초 앞바다', '포항 앞바다'];
  return places.map((placeName) => ({
    placeName,
    gubun,
    date: reqDate,
    indexLevel: 3 as const,
    indexLabel: '보통',
    waterTempC: Math.round(waterTemp * 10) / 10,
    waveHeightM: 0.5,
    tideLabel: undefined,
  }));
}

export class FishingIndexApiClient {
  private readonly serviceKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl = 'https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2';

  constructor(serviceKey?: string) {
    this.serviceKey = serviceKey ?? '';
    this.useMock = !serviceKey;
  }

  /**
   * 바다낚시지수 조회 — placeName 미지정 시 전체 포인트.
   * 실패 시 Mock 폴백.
   */
  async fetchFishingIndex(
    gubun: FishingIndexGubun = '갯바위',
    reqDate?: string,
    placeName?: string,
  ): Promise<{ items: SeaFishingIndexInfo[]; isRealData: boolean }> {
    const date = reqDate ?? formatYmd(new Date());
    if (this.useMock) {
      return { items: getMockFishingIndex(gubun, date), isRealData: false };
    }

    try {
      const url = new URL(this.baseUrl);
      // 공공데이터포털: 디코딩 키를 URLSearchParams로 인코딩해 전달
      url.searchParams.set('serviceKey', this.serviceKey);
      url.searchParams.set('type', 'json');
      url.searchParams.set('reqDate', date);
      url.searchParams.set('gubun', gubun);
      url.searchParams.set('pageNo', '1');
      url.searchParams.set('numOfRows', '100');
      if (placeName) url.searchParams.set('placeName', placeName);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();

      const rawItems: unknown[] = extractItems(data);
      const items = rawItems
        .map((raw) => this.parseItem(raw, gubun, date))
        .filter((v): v is SeaFishingIndexInfo => v !== null);

      if (items.length === 0) throw new Error('empty items');
      return { items, isRealData: true };
    } catch (e) {
      console.warn('[FishingIndexApiClient] API 실패 — Mock 폴백:', e);
      return { items: getMockFishingIndex(gubun, date), isRealData: false };
    }
  }

  /**
   * 응답 항목 파싱 — 실측 응답 필드 기준 (2026-07-15 검증):
   *  seafsPstnNm(장소) / predcYmd(예측일) / predcNoonSeCd(오전·오후) /
   *  seafsTgfshNm(대상 어종) / tdlvHrCn(물때) / minWvhgt·maxWvhgt(파고) /
   *  minWtem·maxWtem(수온) / minWspd·maxWspd(풍속) / totalIndex(지수 라벨)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseItem(raw: any, gubun: FishingIndexGubun, date: string): SeaFishingIndexInfo | null {
    if (!raw || typeof raw !== 'object') return null;
    const pick = (...keys: string[]): unknown => {
      for (const k of keys) {
        if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') return raw[k];
      }
      return undefined;
    };
    /** min/max 쌍 평균 (한쪽만 있으면 그 값) */
    const avgOf = (minKey: string, maxKey: string): number | undefined => {
      const mn = Number(raw[minKey]);
      const mx = Number(raw[maxKey]);
      if (Number.isFinite(mn) && Number.isFinite(mx)) return Math.round(((mn + mx) / 2) * 100) / 100;
      if (Number.isFinite(mn)) return mn;
      if (Number.isFinite(mx)) return mx;
      return undefined;
    };

    const placeName = String(pick('seafsPstnNm', 'placeName', 'pointNm') ?? '');
    if (!placeName) return null;

    const labelRaw = pick('totalIndex', 'fishingIdx', 'idxNm');
    const label = typeof labelRaw === 'string' ? labelRaw : '보통';
    const numericLevel = typeof labelRaw === 'number'
      ? (Math.min(5, Math.max(1, Math.round(labelRaw))) as 1 | 2 | 3 | 4 | 5)
      : labelToLevel(label);

    return {
      placeName,
      gubun,
      date: String(pick('predcYmd', 'fcstDate') ?? date).replace(/-/g, ''),
      indexLevel: numericLevel,
      indexLabel: typeof labelRaw === 'string' ? label : levelToLabel(numericLevel),
      waterTempC: avgOf('minWtem', 'maxWtem'),
      waveHeightM: avgOf('minWvhgt', 'maxWvhgt'),
      tideLabel: pick('tdlvHrCn', 'mul') as string | undefined,
      targetFishName: pick('seafsTgfshNm') as string | undefined,
    };
  }
}

function levelToLabel(level: number): string {
  return ['', '매우나쁨', '나쁨', '보통', '좋음', '매우좋음'][level] ?? '보통';
}

/** Date → YYYYMMDD */
export function formatYmd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** 공공데이터포털 공통 응답에서 item 배열 추출 (response.body.items.item 변형 대응) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractItems(data: any): unknown[] {
  const item = data?.response?.body?.items?.item
    ?? data?.body?.items?.item
    ?? data?.items?.item
    ?? data?.items
    ?? data?.item;
  if (Array.isArray(item)) return item;
  if (item && typeof item === 'object') return [item];
  return [];
}
