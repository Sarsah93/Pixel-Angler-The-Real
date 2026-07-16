/**
 * @file ExternalDataStore.ts
 * @description 공공 OpenAPI 수집 데이터 캐시 싱글톤 (Data Manager)
 *
 * 게임 스타트업(메인 메뉴 진입) 시 ExternalApiService.fetchAll()을 1회 호출해
 * 스냅샷을 메모리에 보관한다. 물리/오라클/상점 엔진은 네트워크 요청 없이
 * 이 캐시만 참조한다 (인게임 루프 병목 방지).
 *
 * 제공 헬퍼:
 *  - getFishingIndexModifier(): 바다낚시지수(1~5) → 입질 확률 P_base 보정 배율
 *  - getWholesaleCache(speciesId): 경락 시세 → evaluateFishSellPrice 캐시 입력
 *  - getMarketPriceFactor(speciesId): 직판장 매입가 배율 (기본 단가 대비)
 *  - getCatchWeights(regionId): 지역 어획량 → 어종 스폰 가중 배율 맵
 *
 * API 실패 시 core 클라이언트가 Mock 폴백을 반환하므로 항상 값이 존재한다.
 */

import {
  ExternalApiService, ExternalDataSnapshot,
  WholesalePriceInfo, SEAFOOD_AUCTION_MAPPING,
  SeaFishingIndexInfo,
  MarineWeatherApiClient, MarineWeatherInfo, MMAF_OFFICES,
  KmaVilageFcstApiClient, KmaWeatherInfo, KMA_GRID_BY_REGION, WeatherKind,
} from '@tra/core';

/**
 * 인증키는 전부 `.env`에서만 읽는다 (2026-07-16 하드코딩 제거).
 *
 * ⚠️ **소스에 키를 하드코딩하지 말 것.** 키가 없으면 각 클라이언트가 Mock으로
 * 폴백하므로 오프라인/키 없는 환경에서도 게임은 정상 구동된다.
 * 필요한 키는 `.env.example` 참고 → `packages/client-pc/.env` 생성.
 */
function envKey(name: string): string | undefined {
  const v = (import.meta.env as Record<string, unknown>)[name];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/** 지역 ID → KOSIS 시도명 접두 매핑 */
const REGION_TO_SIDO: Record<string, string> = {
  gangwon_sokcho: '강원',
  incheon: '인천',
  chungnam_taean: '충남',
  gyeongbuk_pohang: '경북',
  ulsan: '울산',
  busan: '부산',
  gyeongnam_geoje: '경남',
  jeonnam_yeosu: '전남',
  jeju: '제주',
  ulleungdo: '경북',
  dokdo: '경북',
};

/**
 * KOSIS 어종 분류명(C2_NM) → 게임 어종 ID 매칭.
 * 실측 분류명 기준 (2026-07-16 검증 — 가자미류/고등어/넙치류(광어)/농어류/감성돔/
 * 자리돔/참돔/돌돔(줄돔)/방어류/조피볼락(우럭)/기타볼락류/노래미류/숭어류/붕장어/
 * 전갱이류/쥐치류 등 56분류). 한 분류가 여러 게임 어종에 해당하면 모두 가중.
 */
const KOSIS_SPECIES_MATCH: { keywords: string[]; speciesIds: string[] }[] = [
  { keywords: ['감성돔'], speciesIds: ['black_seabream'] },
  { keywords: ['참돔'], speciesIds: ['red_seabream'] },
  { keywords: ['돌돔', '줄돔'], speciesIds: ['stone_beakperch', 'spotted_knifejaw'] },
  { keywords: ['넙치', '광어'], speciesIds: ['flatfish'] },
  // 가자미/도다리류 — 세부 분류를 포괄 분류('가자미')보다 먼저 둘 것 ('강도다리'⊃'도다리')
  { keywords: ['문치가자미'], speciesIds: ['flounder'] },
  { keywords: ['강도다리'], speciesIds: ['starry_flounder'] },
  { keywords: ['도다리'], speciesIds: ['frog_flounder', 'flounder'] },
  { keywords: ['가자미'], speciesIds: ['flounder', 'frog_flounder', 'starry_flounder'] },
  { keywords: ['개서대', '서대'], speciesIds: ['tonguefish'] },
  { keywords: ['고등어'], speciesIds: ['chub_mackerel'] },
  { keywords: ['전갱이'], speciesIds: ['horse_mackerel'] },
  { keywords: ['조피볼락', '우럭'], speciesIds: ['black_rockfish'] },
  { keywords: ['볼락'], speciesIds: ['dark_banded_rockfish', 'golden_rockfish', 'blue_rockfish', 'red_snapper_rockfish'] },
  { keywords: ['방어'], speciesIds: ['yellowtail', 'amberjack'] },
  { keywords: ['농어'], speciesIds: ['sea_bass'] },
  { keywords: ['숭어'], speciesIds: ['striped_mullet', 'redlip_mullet'] },
  { keywords: ['붕장어'], speciesIds: ['conger_eel'] },
  { keywords: ['갯장어', '하모'], speciesIds: ['pike_conger'] },
  { keywords: ['노래미'], speciesIds: ['fat_greenling', 'greenling'] },
  // '말쥐치'⊃'쥐치' — 반드시 말쥐치를 먼저 둘 것
  { keywords: ['말쥐치'], speciesIds: ['black_scraper'] },
  { keywords: ['쥐치'], speciesIds: ['filefish'] },
  { keywords: ['갈치'], speciesIds: ['hairtail'] },
  { keywords: ['복'], speciesIds: ['tiger_puffer', 'fine_puffer'] },
  { keywords: ['망둥어', '망둑'], speciesIds: ['yellowfin_goby'] },
  // ── 신규 어종 (2026-07-16) ──
  { keywords: ['꽁치'], speciesIds: ['pacific_saury'] },
  { keywords: ['눈볼대', '금태'], speciesIds: ['blackthroat_seaperch'] },
  { keywords: ['눈퉁멸'], speciesIds: ['round_herring'] },
  { keywords: ['대구'], speciesIds: ['pacific_cod'] },
  { keywords: ['덕대'], speciesIds: ['korean_pomfret'] },
  { keywords: ['병어'], speciesIds: ['silver_pomfret', 'korean_pomfret'] },
  { keywords: ['도루묵'], speciesIds: ['sandfish'] },
];

/**
 * 지역 ID → 해양기상 관측소 지점코드(mmsi).
 * 현재는 속초(주문진항동방파제등대)만 확정 — 맵 개발 진행에 따라 확장.
 * ※ 동해청 관측소는 수온 센서가 없다(전국 11개소만 수온 관측).
 */
const REGION_TO_MMSI: Record<string, string> = {
  gangwon_sokcho: '994403810', // 주문진항동방파제등대 (풍향·풍속·기온·습도·기압·시정 — 수온 없음)
  busan: '994401579',          // 감천항유도등부표(랜비) — **실측 수온 보유** (감천항 필드와 최적 매칭)
};

/**
 * CORS 우회 프록시 오리진 (dev 전용).
 * NMPNT/MAFRA/KOSIS는 CORS 헤더가 없어 브라우저 직접 호출이 차단된다 —
 * dev에서는 vite 프록시(vite.config.ts server.proxy)를 경유해 실데이터를 받는다.
 * 프로덕션 빌드에는 프록시가 없으므로 원 주소 직행 → 차단 시 Mock 폴백 (배포 시 서버 프록시 필요).
 */
const PROXY_ORIGIN = import.meta.env.DEV ? window.location.origin : undefined;

class ExternalDataStoreManager {
  private service = new ExternalApiService({
    dataGoKrKey: envKey('VITE_DATA_GO_KR_API_KEY'),
    mafraKey: envKey('VITE_MAFRA_API_KEY'),
    kosisKey: envKey('VITE_KOSIS_API_KEY'),
    mafraBaseUrl: PROXY_ORIGIN ? `${PROXY_ORIGIN}/api/mafra/openapi` : undefined,
    kosisBaseUrl: PROXY_ORIGIN ? `${PROXY_ORIGIN}/api/kosis/openapi/Param/statisticsParameterData.do` : undefined,
  });

  /** 해양기상 (국립해양측위정보원) — 실측 수온·시정·염분·유향유속 */
  private marineClient = new MarineWeatherApiClient(
    envKey('VITE_NMPNT_API_KEY'),
    PROXY_ORIGIN ? `${PROXY_ORIGIN}/api/nmpnt` : undefined,
  );

  /** 기상청 단기예보 — 하늘상태·강수·파고 (해양기상 API에 없는 항목) */
  private kmaClient = new KmaVilageFcstApiClient(envKey('VITE_DATA_GO_KR_API_KEY'));

  private _snapshot: ExternalDataSnapshot | null = null;
  private _promise: Promise<void> | null = null;
  /** 전국 관측소 최신 해양기상 (지점코드 → 관측값) */
  private _marine = new Map<string, MarineWeatherInfo>();
  /** 지역별 기상청 현재 기상 (지역 ID → 기상) */
  private _kma = new Map<string, KmaWeatherInfo>();

  get snapshot(): ExternalDataSnapshot | null {
    return this._snapshot;
  }

  /**
   * 스타트업 1회 수집 — 중복 호출 시 진행 중인 Promise를 재사용하므로
   * 어느 씬에서든 안전하게 await 가능. 실패해도 Mock 스냅샷 확보.
   */
  fetchAll(): Promise<void> {
    if (this._snapshot) return Promise.resolve();
    if (this._promise) return this._promise;
    // 해양기상은 독립 API — 실패해도 나머지 수집을 막지 않도록 분리해서 병행
    this._promise = Promise.all([
      this.service.fetchAll().then((snap) => {
        this._snapshot = snap;
        const r = snap.realData;
        console.log(`[ExternalDataStore] 수집 완료 — 낚시지수:${r.fishingIndex ? '실데이터' : 'Mock'}, 경락가:${r.marketPrices ? '실데이터' : 'Mock'}, 어획량:${r.regionalCatch ? '실데이터' : 'Mock'}`);
      }),
      this.marineClient.fetchAllStations()
        .then((list) => {
          this._marine = new Map(list.map((m) => [m.mmsi, m]));
          const wt = list.filter((m) => m.waterTempC !== undefined).length;
          console.log(`[ExternalDataStore] 해양기상 ${list.length}개 관측소 수집 (수온 보유 ${wt}개소)`);
        })
        .catch((e) => { console.warn('[ExternalDataStore] 해양기상 수집 실패 — 건너뜀', e); }),
      this.fetchKmaAll()
        .catch((e) => { console.warn('[ExternalDataStore] 기상청 수집 실패 — 건너뜀', e); }),
    ]).then(() => undefined)
      .finally(() => { this._promise = null; });
    return this._promise;
  }

  /** 전 지역 기상청 현재 기상 수집 — 지역별 실패는 무시하고 나머지를 살린다 */
  private async fetchKmaAll(): Promise<void> {
    const ids = Object.keys(KMA_GRID_BY_REGION);
    const settled = await Promise.allSettled(ids.map(async (id) => {
      const g = KMA_GRID_BY_REGION[id];
      return [id, await this.kmaClient.fetchCurrent({ nx: g.nx, ny: g.ny })] as const;
    }));
    for (const r of settled) if (r.status === 'fulfilled') this._kma.set(r.value[0], r.value[1]);
    console.log(`[ExternalDataStore] 기상청 ${this._kma.size}/${ids.length}개 지역 수집`);
  }

  // ── 4) 해양기상 (국립해양측위정보원 76개 관측소) ────────
  /** 전국 관측소 최신 관측값 전체 */
  getAllMarineWeather(): MarineWeatherInfo[] {
    return [...this._marine.values()];
  }

  /** 지점코드로 관측값 조회 */
  getMarineWeather(mmsi: string): MarineWeatherInfo | undefined {
    return this._marine.get(mmsi);
  }

  /**
   * 지역 ID의 해양기상 (REGION_TO_MMSI 매핑 기준).
   * 매핑이 없는 지역은 undefined — 맵 개발 진행에 따라 매핑을 확장할 것.
   */
  getRegionMarineWeather(regionId: string): MarineWeatherInfo | undefined {
    const mmsi = REGION_TO_MMSI[regionId];
    return mmsi ? this._marine.get(mmsi) : undefined;
  }

  /** 기관(청)별 관측값 — 예: '101' 부산청 */
  getMarineWeatherByOffice(mmaf: string): MarineWeatherInfo[] {
    return this.getAllMarineWeather().filter((m) => m.mmaf === mmaf);
  }

  /** 기관코드 → 기관명 */
  getOfficeName(mmaf: string): string {
    return MMAF_OFFICES[mmaf] ?? '';
  }

  // ── 5) 기상청 단기예보 (하늘상태·강수·파고) ────────────
  /** 지역 ID의 기상청 현재 기상 */
  getKmaWeather(regionId: string): KmaWeatherInfo | undefined {
    return this._kma.get(regionId);
  }

  /**
   * HUD 표시용 날씨 종류.
   *
   * 기상청 SKY/PTY로 맑음·흐림·비·눈을 판정하되,
   * **안개는 기상청 코드에 없으므로** 해양기상 관측소의 시정(HORIZON_VISIBL)으로 보강한다.
   * 강수 중이 아니고 시정 1km 미만이면 안개로 본다.
   */
  getWeatherKind(regionId: string): WeatherKind {
    const kma = this._kma.get(regionId);
    const kind = kma?.kind ?? 'clear';
    // 비/눈이 오는 중이면 안개보다 강수 표시가 우선
    if (kind !== 'clear' && kind !== 'partly' && kind !== 'cloudy') return kind;
    const marine = this.getRegionMarineWeather(regionId);
    if (marine?.visibilityM !== undefined && marine.visibilityM < 1000) return 'fog';
    return kind;
  }

  /**
   * 지역 파고 (m).
   * 해양기상 API는 파고를 **전 관측소 미관측(0/76)** 이므로 기상청 단기예보(WAV)만이 소스다.
   */
  getWaveHeightM(regionId: string): number | undefined {
    return this._kma.get(regionId)?.waveHeightM;
  }

  /**
   * 지역 수온 (°C).
   * 해양기상 실측 수온을 우선하되, 해당 권역에 수온 관측소가 없으면 undefined
   * (수온 관측은 전국 11/76개소뿐 — 동해청(속초)은 전무).
   */
  getWaterTempC(regionId: string): number | undefined {
    return this.getRegionMarineWeather(regionId)?.waterTempC;
  }

  // ── 1) 바다낚시지수 → 입질 확률 보정 ─────────────────
  /** 지수 5단계 → P_base 배율 (1 매우나쁨 0.7 ~ 5 매우좋음 1.4) */
  getFishingIndexModifier(placeName?: string): number {
    const info = this.getFishingIndexInfo(placeName);
    if (!info) return 1.0;
    return [0, 0.7, 0.85, 1.0, 1.2, 1.4][info.indexLevel] ?? 1.0;
  }

  /** 낚시지수 정보 (장소명 부분 일치 우선, 없으면 첫 항목) */
  getFishingIndexInfo(placeName?: string): SeaFishingIndexInfo | undefined {
    const list = this._snapshot?.fishingIndex;
    if (!list || list.length === 0) return undefined;
    if (placeName) {
      const hit = list.find((i) => i.placeName.includes(placeName) || placeName.includes(i.placeName));
      if (hit) return hit;
    }
    return list[0];
  }

  // ── 2) 경락 시세 → 직판장/어판장 가격 ─────────────────
  /** 어종별 실시간 경락 시세 캐시 (evaluateFishSellPrice 입력용) */
  getWholesaleCache(speciesId: string): WholesalePriceInfo | undefined {
    return this._snapshot?.marketPrices.find((p) => p.speciesId === speciesId);
  }

  /**
   * 직판장 매입가 배율 — 오늘 경락가 / 기본 단가 (0.5 ~ 2.0 클램프).
   * 어획물 아이템 판매가에 곱해 동적 시세를 반영한다.
   */
  getMarketPriceFactor(speciesId: string): number {
    const cache = this.getWholesaleCache(speciesId);
    const def = SEAFOOD_AUCTION_MAPPING[speciesId];
    if (!cache || !def || def.defaultPricePerKg <= 0) return 1.0;
    return Math.min(2.0, Math.max(0.5, cache.avgPricePerKg / def.defaultPricePerKg));
  }

  // ── 3) 어획량 통계 → 지역별 어종 스폰 가중치 ──────────
  /**
   * 지역(regionDatabaseId)의 어종 스폰 가중 배율 맵.
   * 해당 시도 어획량 비중이 높은 어종일수록 배율 상승 (0.7 ~ 1.8).
   */
  getCatchWeights(regionId: string): Partial<Record<string, number>> {
    const stats = this._snapshot?.regionalCatch;
    const sido = REGION_TO_SIDO[regionId];
    if (!stats || !sido) return {};

    // 시도 매칭 행만 집계 (총중량 기준 — KosisCatchApiClient에서 사전 필터됨)
    const bySpecies = new Map<string, number>();
    for (const row of stats) {
      if (!row.regionName.startsWith(sido)) continue;
      const match = KOSIS_SPECIES_MATCH.find((m) => m.keywords.some((k) => row.speciesName.includes(k)));
      if (!match) continue;
      for (const id of match.speciesIds) {
        bySpecies.set(id, (bySpecies.get(id) ?? 0) + row.value);
      }
    }
    if (bySpecies.size === 0) return {};

    const max = Math.max(...bySpecies.values());
    const weights: Partial<Record<string, number>> = {};
    bySpecies.forEach((v, id) => {
      weights[id] = 0.7 + (v / max) * 1.1;   // 0.7 ~ 1.8
    });
    return weights;
  }
}

export const ExternalDataStore = new ExternalDataStoreManager();
