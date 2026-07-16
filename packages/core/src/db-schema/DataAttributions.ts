/**
 * @file DataAttributions.ts
 * @description 공공데이터·외부 API 출처 표기 (저작권 고지)
 *
 * 공공데이터포털 이용약관 및 공공누리(KOGL) 제1유형은 **출처 표시**를 의무화한다.
 * 게임에서 사용하는 모든 외부 데이터의 제공기관·서비스명·라이선스를 여기에 모아두고,
 * CreditsScene이 이 목록을 렌더한다.
 *
 * **새 API를 연동하면 반드시 이 목록에 추가할 것.** (출처 미표기는 약관 위반)
 *
 * 순수 데이터 — 렌더링/브라우저 API 없음.
 */

/** 라이선스 유형 */
export type DataLicense =
  | 'KOGL-1'        // 공공누리 제1유형 (출처표시)
  | 'KOGL-2'        // 공공누리 제2유형 (출처표시 + 상업적 이용금지)
  | 'KOGL-3'        // 공공누리 제3유형 (출처표시 + 변경금지)
  | 'KOGL-4'        // 공공누리 제4유형 (출처표시 + 상업적금지 + 변경금지)
  | 'PublicData'    // 공공데이터포털 이용약관
  | 'Custom';       // 개별 약관

export const LICENSE_LABEL: Record<DataLicense, string> = {
  'KOGL-1': '공공누리 제1유형 (출처표시)',
  'KOGL-2': '공공누리 제2유형 (출처표시 · 상업적 이용금지)',
  'KOGL-3': '공공누리 제3유형 (출처표시 · 변경금지)',
  'KOGL-4': '공공누리 제4유형 (출처표시 · 상업적금지 · 변경금지)',
  'PublicData': '공공데이터포털 이용약관',
  'Custom': '제공기관 개별 약관',
};

/** 출처 항목 */
export interface DataAttribution {
  /** 제공 기관 */
  provider: string;
  /** 서비스/데이터셋 명 */
  service: string;
  /** 게임 내 사용처 (플레이어에게 보이는 설명) */
  usage: string;
  /** 라이선스 유형 */
  license: DataLicense;
  /** 출처 URL */
  url?: string;
}

/**
 * 게임에서 사용하는 외부 데이터 출처 전체 목록.
 * 표시 순서 = 배열 순서.
 */
export const DATA_ATTRIBUTIONS: DataAttribution[] = [
  {
    provider: '기상청',
    service: '단기예보 조회서비스 (VilageFcstInfoService_2.0)',
    usage: '하늘상태 · 강수형태 · 강수확률 · 기온 · 풍속 · 파고',
    license: 'PublicData',
    url: 'https://www.data.go.kr/data/15084084/openapi.do',
  },
  {
    provider: '해양수산부 국립해양측위정보원',
    service: '해양기상 정보',
    usage: '전국 76개 관측소의 실측 수온 · 시정 · 염분 · 표면 유향유속 · 풍향풍속',
    license: 'PublicData',
    url: 'https://marineweather.nmpnt.go.kr',
  },
  {
    provider: '해양수산부 국립해양조사원',
    service: '바다낚시지수 (fcstFishing)',
    usage: '해역별 낚시 적합 지수 → 입질 확률 보정',
    license: 'PublicData',
    url: 'https://www.data.go.kr/data/1509890/openapi.do',
  },
  {
    provider: '해양수산부 국립해양조사원',
    service: '연안정보도 (수심)',
    usage: '실측 연안 수심 프로필 → 캐스팅 거리별 수심 산출',
    license: 'PublicData',
    url: 'https://www.khoa.go.kr',
  },
  {
    provider: '농림수산식품교육문화정보원',
    service: '수산물 도매시장 경락가격 정보',
    usage: '어종별 실시간 시세 → 어판장 수매가 산정',
    license: 'PublicData',
    url: 'https://data.mafra.go.kr',
  },
  {
    provider: '통계청 (KOSIS 국가통계포털)',
    service: '시도별 · 어종별 어획량 통계',
    usage: '지역별 어종 출현 빈도 가중',
    license: 'PublicData',
    url: 'https://kosis.kr',
  },
];

/** 제공기관별 그룹 (중복 기관 묶어 표시) */
export function groupAttributionsByProvider(): { provider: string; items: DataAttribution[] }[] {
  const map = new Map<string, DataAttribution[]>();
  for (const a of DATA_ATTRIBUTIONS) {
    const list = map.get(a.provider) ?? [];
    list.push(a);
    map.set(a.provider, list);
  }
  return [...map.entries()].map(([provider, items]) => ({ provider, items }));
}
