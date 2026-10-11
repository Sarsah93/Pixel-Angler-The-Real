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
  ORACLE_FISH_DB, calculateTideInfo,
  WORLD_NODE_DATABASE, REGION_AREA_NODES,
  mpRng, mpTimeSlot, SESSION_WEATHER_SLOT_MS, encodeWeatherCard, type SessionWeatherCard,
  isProduceMarketSnapshot, setProduceMarket,
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

/** 지역 ID → 바다낚시지수 지명 매칭 키워드 (앞선 키워드 우선) */
const REGION_TO_INDEX_KEYWORDS: Record<string, string[]> = {
  gangwon_sokcho: ['속초', '고성', '양양', '강릉'],
  busan: ['감천', '부산', '태종대', '영도', '송도', '다대포', '기장'],
};

/** 오라클 서식 지형 → 표시 라벨 */
const HABITAT_LABEL: Record<string, string> = {
  reef: '여밭·암초', sand: '모래', mud: '진흙', mixed: '혼합 지형', open: '외양 회유', structure: '구조물',
};

/** 오라클 수심층 → 표시 라벨 */
const LAYER_LABEL: Record<string, string> = {
  surface: '상층', mid: '중층', bottom: '저층',
};

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
  { keywords: ['볼락'], speciesIds: ['blue_rockfish', 'golden_rockfish', 'red_snapper_rockfish'] },
  { keywords: ['방어'], speciesIds: ['yellowtail', 'amberjack', 'greater_amberjack'] },
  { keywords: ['농어'], speciesIds: ['sea_bass'] },
  { keywords: ['숭어'], speciesIds: ['striped_mullet', 'redlip_mullet'] },
  { keywords: ['붕장어'], speciesIds: ['conger_eel'] },
  { keywords: ['갯장어', '하모'], speciesIds: ['pike_conger'] },
  { keywords: ['노래미'], speciesIds: ['fat_greenling', 'greenling'] },
  // '말쥐치'⊃'쥐치' — 반드시 말쥐치를 먼저 둘 것
  { keywords: ['말쥐치'], speciesIds: ['black_scraper'] },
  { keywords: ['쥐치'], speciesIds: ['filefish'] },
  { keywords: ['갈치'], speciesIds: ['hairtail'] },
  // '까치복'⊃'복' — 반드시 까치복을 먼저. '복'은 복섬/자주복 등 소형·참복류로.
  { keywords: ['까치복'], speciesIds: ['yellowfin_puffer'] },
  { keywords: ['복'], speciesIds: ['tiger_puffer', 'grass_puffer', 'yellowfin_puffer'] },
  { keywords: ['망둥어', '망둑'], speciesIds: ['yellowfin_goby'] },
  // ── 신규 어종 (2026-07-16) ──
  { keywords: ['꽁치'], speciesIds: ['pacific_saury'] },
  // ── 신규 어종 (2026-07-25) ──
  { keywords: ['양태'], speciesIds: ['bartail_flathead'] },
  { keywords: ['성대'], speciesIds: ['bluefin_searobin'] },
  { keywords: ['먹장어', '곰장어'], speciesIds: ['hagfish'] },
  { keywords: ['학꽁치'], speciesIds: ['halfbeak'] },
  { keywords: ['보리멸'], speciesIds: ['northern_whiting'] },
  { keywords: ['눈볼대', '금태'], speciesIds: ['blackthroat_seaperch'] },
  { keywords: ['눈퉁멸'], speciesIds: ['round_herring'] },
  { keywords: ['대구'], speciesIds: ['pacific_cod'] },
  { keywords: ['덕대'], speciesIds: ['korean_pomfret'] },
  { keywords: ['병어'], speciesIds: ['silver_pomfret', 'korean_pomfret'] },
  { keywords: ['도루묵'], speciesIds: ['sandfish'] },
  // ── 루어/지깅 중대형 + 두족류 (2026-07-20) — '갑오징어'⊃'오징어' 순서 준수
  { keywords: ['삼치'], speciesIds: ['spanish_mackerel'] },
  { keywords: ['갑오징어'], speciesIds: ['cuttlefish'] },
  // 한치(창꼴뚜기) 전용 — 아래 '오징어' 항목도 '한치'를 갖고 있으므로 반드시 앞에 둔다 (선착순 매칭)
  { keywords: ['한치', '창꼴뚜기'], speciesIds: ['swordtip_squid'] },
  { keywords: ['오징어'], speciesIds: ['squid', 'cuttlefish', 'swordtip_squid'] },
  // '대문어'⊃'문어' — 대문어 키워드를 먼저 두되 speciesIds는 참문어/대문어 공통 매칭
  { keywords: ['대문어', '피문어'], speciesIds: ['giant_octopus', 'octopus'] },
  { keywords: ['문어'], speciesIds: ['octopus', 'giant_octopus'] },
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

/**
 * 236차 — 농산물 시세 스냅샷 주소. GitHub Actions(「농산물 시세 스냅샷」)가 하루 한 번 KAMIS 소매가를 받아
 * `data-snapshots` 브랜치에 올린다(정적 배포의 브라우저는 KAMIS를 직접 못 부른다 — CORS). `.env`로 바꿀 수 있다.
 * 첫 실행 전에는 404 — 내장 시세 곡선으로 돌아간다(오류 아님).
 */
const PRODUCE_MARKET_URL = envKey('VITE_PRODUCE_MARKET_URL')
  ?? 'https://raw.githubusercontent.com/Sarsah93/Pixel-Angler-The-Real/data-snapshots/kamis/produce.json';
/** 마지막으로 받은 스냅샷(못 받은 날 · 오프라인에 쓴다 — 조사일이 열흘을 넘기면 core가 버린다) */
const PRODUCE_MARKET_CACHE_KEY = 'tra_produce_market_v1';

/** 홈타운 날씨 후보(실데이터가 없는 동네 — 세션 공용 시드 × 1시간 슬롯으로 고른다) */
const HOMETOWN_WEATHER_OPTS: WeatherKind[] = ['clear', 'partly', 'cloudy', 'rain', 'shower', 'fog'];

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
  /** 236차 — 농산물 시세는 세션에 한 번만 받는다(시작을 기다리게 하지 않는다) */
  private _marketTried = false;
  /** 전국 관측소 최신 해양기상 (지점코드 → 관측값) */
  private _marine = new Map<string, MarineWeatherInfo>();
  /** 지역별 기상청 현재 기상 (지역 ID → 기상) */
  private _kma = new Map<string, KmaWeatherInfo>();
  /** 홈타운 랜덤 날씨 캐시 — 실데이터가 없는 홈타운은 방문마다 무작위(방문 중 안정) */
  private _hometownWeather?: WeatherKind;
  /**
   * 234차 — 세션 정본 날씨(지역 → 1시간 슬롯 → 카드). 멀티에서 그 슬롯에 먼저 실데이터를 받은 사람의 카드다.
   * 있으면 아래 날씨 조회가 **내 실데이터 대신 이 카드**를 돌려준다 — 모두가 같은 하늘 · 같은 보일링 스케줄.
   * 직전 슬롯 것도 남긴다(보일링 스케줄이 직전 슬롯까지 계산한다).
   */
  private _sessionWx = new Map<string, Map<number, SessionWeatherCard>>();
  /** 234차 — 실황(기상청 · 해양기상)을 마지막으로 **받아 낸** 1시간 슬롯 / 받으러 간 슬롯(실패해도 그 시간엔 다시 안 간다) */
  private _liveSlot = -1;
  private _liveTriedSlot = -1;
  private _liveFetching: Promise<boolean> | null = null;

  /**
   * 홈타운 날씨 재추첨 — RegionFieldScene(hometown) 진입 시 1회 호출.
   *
   * 145차: **시드를 받는다.** 구 구현은 방문마다 `Math.random()`이라 같은 세션의 두 사람이
   * 같은 시각에 서로 다른 하늘을 봤고, 날씨가 피딩 활성도에 들어가므로 보일링 스케줄까지 갈렸다.
   * 시드를 주지 않으면(싱글) 종전대로 무작위.
   */
  rerollHometownWeather(seed?: number): void {
    const r = seed === undefined ? Math.random() : mpRng(seed)();
    this._hometownWeather = HOMETOWN_WEATHER_OPTS[Math.floor(r * HOMETOWN_WEATHER_OPTS.length)];
  }

  /**
   * 234차 — 홈타운 날씨 시드(1시간 슬롯 → 시드). `WeatherSync`가 세운다(세션 공용 시드).
   * 있으면 지난 슬롯의 홈타운 날씨도 다시 계산할 수 있다 — 보일링 스케줄이 직전 슬롯까지 본다.
   */
  hometownSeedFor: ((slot: number) => number) | null = null;

  get snapshot(): ExternalDataSnapshot | null {
    return this._snapshot;
  }

  /**
   * 스타트업 1회 수집 — 중복 호출 시 진행 중인 Promise를 재사용하므로
   * 어느 씬에서든 안전하게 await 가능. 실패해도 Mock 스냅샷 확보.
   */
  fetchAll(): Promise<void> {
    if (!this._marketTried) { this._marketTried = true; void this.fetchProduceMarket(); }   // 236차 — 기다리지 않는다
    if (this._snapshot) return Promise.resolve();
    if (this._promise) return this._promise;
    // 해양기상은 독립 API — 실패해도 나머지 수집을 막지 않도록 분리해서 병행
    const liveSlot = mpTimeSlot(Date.now(), SESSION_WEATHER_SLOT_MS);   // 234차 — 이 시간의 실황이다
    this._liveTriedSlot = liveSlot;
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
        .then((n) => { if (n > 0) this._liveSlot = liveSlot; })
        .catch((e) => { console.warn('[ExternalDataStore] 기상청 수집 실패 — 건너뜀', e); }),
    ]).then(() => undefined)
      .finally(() => { this._promise = null; });
    return this._promise;
  }

  /**
   * 236차 — 농산물 시세 스냅샷(KAMIS 소매가 하루치)을 받아 core에 넣는다.
   * 못 받으면 지난번 받아 둔 것을 쓰고, 그것도 없거나 오래됐으면 내장 시세 곡선(주간 출렁임)으로 돈다.
   */
  private async fetchProduceMarket(): Promise<void> {
    let snap: unknown = null;
    try {
      const res = await fetch(PRODUCE_MARKET_URL, { cache: 'no-cache', signal: AbortSignal.timeout(8000) });
      if (res.ok) snap = await res.json();
    } catch { /* 망 문제 · 첫 실행 전 — 아래 저장분으로 */ }
    if (isProduceMarketSnapshot(snap)) {
      try { localStorage.setItem(PRODUCE_MARKET_CACHE_KEY, JSON.stringify(snap)); } catch { /* 저장 공간 없음 — 이번 세션만 쓴다 */ }
    } else {
      try {
        const raw = localStorage.getItem(PRODUCE_MARKET_CACHE_KEY);
        snap = raw ? JSON.parse(raw) : null;
      } catch { snap = null; }
    }
    const n = setProduceMarket(isProduceMarketSnapshot(snap) ? snap : null, Date.now());
    console.log(`[ExternalDataStore] 농산물 시세 — ${n > 0 && isProduceMarketSnapshot(snap) ? `${snap.regday} 소매가로 ${n}개 작물` : '없음(내장 시세 곡선)'}`);
  }

  /** 전 지역 기상청 현재 기상 수집 — 지역별 실패는 무시하고 나머지를 살린다. 받아 낸 지역 수를 돌려준다(234차) */
  private async fetchKmaAll(): Promise<number> {
    const ids = Object.keys(KMA_GRID_BY_REGION);
    const settled = await Promise.allSettled(ids.map(async (id) => {
      const g = KMA_GRID_BY_REGION[id];
      return [id, await this.kmaClient.fetchCurrent({ nx: g.nx, ny: g.ny })] as const;
    }));
    let got = 0;
    for (const r of settled) if (r.status === 'fulfilled') { this._kma.set(r.value[0], r.value[1]); if (!r.value[1].mock) got++; }
    console.log(`[ExternalDataStore] 기상청 ${got}/${ids.length}개 지역 수집`);
    return got;
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
    const base = this.rawMarine(regionId);
    const c = this.sessionCard(regionId);
    if (!base || !c) return base;
    // 234차 — 정본 카드가 있으면 바람 · 기온 · 수온 · 시정은 카드 값(관측소 고유 값은 그대로)
    return {
      ...base, windSpeedMs: c.windMs, windDirectionDeg: c.windDeg, airTempC: c.airC ?? base.airTempC,
      waterTempC: c.waterC, visibilityM: c.visM,
    };
  }

  private rawMarine(regionId: string): MarineWeatherInfo | undefined {
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
  /** 지역 ID의 기상청 현재 기상 — 234차: 세션 정본 카드가 있으면 그 값(기온 · 바람 · 강수 · 파고 · 날씨 종류)이 이긴다 */
  getKmaWeather(regionId: string): KmaWeatherInfo | undefined {
    const base = this._kma.get(regionId);
    const c = this.sessionCard(regionId);
    if (!c) return base;
    return {
      ...(base ?? {}),
      grid: base?.grid ?? { nx: KMA_GRID_BY_REGION[regionId]?.nx ?? 0, ny: KMA_GRID_BY_REGION[regionId]?.ny ?? 0 },
      observedAt: base?.observedAt ?? new Date(),
      kind: c.kind, tempC: c.airC, windSpeedMs: c.windMs, windDirectionDeg: c.windDeg,
      rain1hMm: c.rainMm, waveHeightM: c.waveM,
    };
  }

  /**
   * HUD 표시용 날씨 종류.
   *
   * 기상청 SKY/PTY로 맑음·흐림·비·눈을 판정하되,
   * **안개는 기상청 코드에 없으므로** 해양기상 관측소의 시정(HORIZON_VISIBL)으로 보강한다.
   * 강수 중이 아니고 시정 1km 미만이면 안개로 본다.
   */
  getWeatherKind(regionId: string): WeatherKind {
    // 홈타운은 실데이터가 없으므로 랜덤(방문 중 안정 — rerollHometownWeather로 갱신)
    if (regionId === 'hometown') {
      if (!this._hometownWeather) this.rerollHometownWeather();
      return this._hometownWeather!;
    }
    // 234차 — 세션 정본 카드가 이긴다
    const c = this.sessionCard(regionId);
    if (c) return c.kind;
    return this.localWeatherKind(regionId);
  }

  /**
   * 234차 — 그 시각(슬롯)의 날씨 종류. 정본 카드가 그 슬롯에 있으면 그것, 없으면 지금 날씨.
   * 보일링 스케줄처럼 「슬롯 시작 시각의 값」을 물어야 하는 공용 추첨이 쓴다.
   */
  weatherKindAt(regionId: string, atMs: number): WeatherKind {
    if (regionId === 'hometown') {
      const seed = this.hometownSeedFor?.(mpTimeSlot(atMs, SESSION_WEATHER_SLOT_MS));
      if (seed !== undefined) return HOMETOWN_WEATHER_OPTS[Math.floor(mpRng(seed)() * HOMETOWN_WEATHER_OPTS.length)];
      return this.getWeatherKind(regionId);
    }
    const c = this.sessionCard(regionId, atMs);
    if (c) return c.kind;
    return this.getWeatherKind(regionId);
  }

  /** 내 실데이터만으로 본 날씨 종류(정본 카드 무시) — 카드를 만들 때 · 카드가 없을 때 */
  private localWeatherKind(regionId: string): WeatherKind {
    const kma = this._kma.get(regionId);
    const kind = kma?.kind ?? 'clear';
    // 비/눈이 오는 중이면 안개보다 강수 표시가 우선
    if (kind !== 'clear' && kind !== 'partly' && kind !== 'cloudy') return kind;
    const marine = this.rawMarine(regionId);
    if (marine?.visibilityM !== undefined && marine.visibilityM < 1000) return 'fog';
    return kind;
  }

  /**
   * 지역 파고 (m).
   * 해양기상 API는 파고를 **전 관측소 미관측(0/76)** 이므로 기상청 단기예보(WAV)만이 소스다.
   */
  getWaveHeightM(regionId: string): number | undefined {
    const c = this.sessionCard(regionId);
    if (c) return c.waveM;
    return this._kma.get(regionId)?.waveHeightM;
  }

  /**
   * 지역 수온 (°C).
   * 해양기상 실측 수온을 우선하되, 해당 권역에 수온 관측소가 없으면 undefined
   * (수온 관측은 전국 11/76개소뿐 — 동해청(속초)은 전무).
   */
  getWaterTempC(regionId: string): number | undefined {
    const c = this.sessionCard(regionId);
    if (c) return c.waterC;
    return this.rawMarine(regionId)?.waterTempC;
  }

  // ── 234차 세션 정본 날씨 ─────────────────────────────
  /** 그 시각(슬롯)의 정본 카드 */
  private sessionCard(regionId: string, atMs = Date.now()): SessionWeatherCard | undefined {
    return this._sessionWx.get(regionId)?.get(mpTimeSlot(atMs, SESSION_WEATHER_SLOT_MS));
  }

  /** 정본 카드를 받아 둔다 — 바뀌었으면 true(필드가 연출 · 스케줄을 다시 그린다) */
  setSessionWeather(regionId: string, slot: number, card: SessionWeatherCard): boolean {
    let m = this._sessionWx.get(regionId);
    if (!m) { m = new Map(); this._sessionWx.set(regionId, m); }
    const prev = m.get(slot);
    m.set(slot, card);
    for (const k of [...m.keys()]) if (k < slot - 2) m.delete(k);
    return !prev || encodeWeatherCard(prev) !== encodeWeatherCard(card);
  }

  /** 멀티를 떠나면 정본을 걷는다 — 있었으면 true */
  clearSessionWeather(): boolean {
    const had = this._sessionWx.size > 0;
    this._sessionWx.clear();
    return had;
  }

  /**
   * 내 실데이터로 만든 카드 — **이번 시간에 받은 기상청 실황이 있을 때만**(낡은 값 · 빈 값으로 남의 하늘을 덮지 않게).
   * 바람 · 기온은 기상청이 없으면 관측소 값으로 메운다(조회 쪽과 같은 순서).
   */
  localWeatherCard(regionId: string, now = Date.now()): SessionWeatherCard | null {
    if (regionId === 'hometown' || !this.liveIsFresh(now)) return null;
    const kma = this._kma.get(regionId);
    if (!kma || kma.mock) return null;   // 만든 값(키 없음 · 실패)은 남의 실데이터를 덮지 않는다
    const marine = this.rawMarine(regionId);
    return {
      kind: this.localWeatherKind(regionId),
      windMs: kma.windSpeedMs ?? marine?.windSpeedMs,
      windDeg: kma.windDirectionDeg ?? marine?.windDirectionDeg,
      waveM: kma.waveHeightM,
      airC: kma.tempC ?? marine?.airTempC,
      rainMm: kma.rain1hMm,
      waterC: marine?.waterTempC,
      visM: marine?.visibilityM,
    };
  }

  /** 실황이 이번 1시간 것인가 */
  liveIsFresh(now = Date.now()): boolean {
    return this._liveSlot === mpTimeSlot(now, SESSION_WEATHER_SLOT_MS);
  }

  /**
   * 234차 — 실황(기상청 · 해양기상)을 **한 시간에 한 번** 다시 받는다(싱글도 — 구: 켤 때 한 번뿐이라 몇 시간 놀면 낡은 날씨).
   * 시세 · 어획량 · 지수는 그대로 둔다. 내 실데이터 날씨 종류가 바뀌었으면 true.
   */
  refreshLiveWeather(now = Date.now()): Promise<boolean> {
    const slot = mpTimeSlot(now, SESSION_WEATHER_SLOT_MS);
    if (this._liveTriedSlot === slot || this._promise) return Promise.resolve(false);
    if (this._liveFetching) return this._liveFetching;
    this._liveTriedSlot = slot;
    const before = new Map([...this._kma.keys()].map((id) => [id, this.localWeatherKind(id)]));
    let gotKma = false;
    this._liveFetching = Promise.all([
      this.marineClient.fetchAllStations()
        .then((list) => { if (list.length) this._marine = new Map(list.map((m) => [m.mmsi, m])); })
        .catch(() => { /* 지난 값을 그대로 쓴다 */ }),
      this.fetchKmaAll().then((n) => { gotKma = n > 0; }).catch(() => { /* 지난 값을 그대로 쓴다 */ }),
    ]).then(() => {
      // 받아 낸 시간만 「이번 시간 실황」이다 — 실패하면 이 시간엔 정본을 올리지 않는다(남의 것을 따른다)
      if (gotKma) this._liveSlot = slot;
      return [...this._kma.keys()].some((id) => before.get(id) !== this.localWeatherKind(id));
    }).finally(() => { this._liveFetching = null; });
    return this._liveFetching;
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
  /**
   * 어종별 실시간 경락 시세 캐시 (evaluateFishSellPrice 입력용).
   * tier(활어/선어) 지정 시 해당 구분 시세를 우선 반환하고, 구분이 없는(단일) 시세면
   * 활어·선어 동일 적용 (사용자 규칙 2026-07-25 — "구분 없으면 동일").
   */
  getWholesaleCache(speciesId: string, tier?: 'live' | 'fresh'): WholesalePriceInfo | undefined {
    const rows = this._snapshot?.marketPrices.filter((p) => p.speciesId === speciesId) ?? [];
    if (rows.length === 0) return undefined;
    if (tier) {
      // 구분 있는 경우: tier 일치 우선 / 없으면 tier 미지정(공통) 행 / 그래도 없으면 아무거나
      return rows.find((p) => p.tier === tier) ?? rows.find((p) => p.tier === undefined) ?? rows[0];
    }
    return rows[0];
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

  // ── 6) 메인 메뉴 하단 정보 티커용 데이터 ──────────────

  /** 서비스 중(출조 구역 보유) 지역 ID 목록 */
  getServicedRegionIds(): string[] {
    return Object.keys(REGION_AREA_NODES);
  }

  /** 지역 표시 이름 (전국 지도 노드 기준 — 예: '강원 속초') */
  getRegionName(regionId: string): string {
    return WORLD_NODE_DATABASE.find((n) => n.id === regionId || n.regionDatabaseId === regionId)?.name
      ?? regionId;
  }

  /** 지역의 바다낚시지수 (지명 키워드 매칭 — 없으면 첫 항목 폴백) */
  getRegionFishingIndex(regionId: string): SeaFishingIndexInfo | undefined {
    const list = this._snapshot?.fishingIndex;
    if (!list || list.length === 0) return undefined;
    for (const k of REGION_TO_INDEX_KEYWORDS[regionId] ?? []) {
      const hit = list.find((i) => i.placeName.includes(k));
      if (hit) return hit;
    }
    return list[0];
  }

  /**
   * 실데이터 합성 7단계 낚시 등급.
   *
   * 바다낚시지수(5단계) 원점수에 실황 기상(파고/풍속/강수·안개)을 가감해
   * 최적/좋음/양호/보통/나쁨/매우나쁨/최악 7단계로 세분화한다.
   * 지수·기상 전부 실데이터 기반 (수집 실패 시 Mock 폴백값으로 동일 산식).
   */
  getFishingGrade(regionId: string): { label: string; score: number; placeName?: string } {
    const idx = this.getRegionFishingIndex(regionId);
    // 지수 1~5 → 15/32.5/50/67.5/85 기저 점수
    let score = idx ? 15 + (idx.indexLevel - 1) * 17.5 : 50;

    const kma = this._kma.get(regionId);
    const wave = kma?.waveHeightM ?? idx?.waveHeightM;
    if (wave !== undefined) {
      if (wave >= 2.5) score -= 20;
      else if (wave >= 1.5) score -= 12;
      else if (wave >= 1.0) score -= 5;
      else score += 4;
    }
    const wind = kma?.windSpeedMs ?? this.getRegionMarineWeather(regionId)?.windSpeedMs;
    if (wind !== undefined) {
      if (wind >= 12) score -= 16;
      else if (wind >= 8) score -= 8;
      else if (wind <= 4) score += 3;
    }
    const kind = this.getWeatherKind(regionId);
    if (kind === 'rain' || kind === 'shower' || kind === 'sleet') score -= 12;
    else if (kind === 'snow') score -= 8;
    else if (kind === 'fog') score -= 6;
    else if (kind === 'cloudy') score -= 2;

    score = Math.max(0, Math.min(100, score));
    const label = score >= 85 ? '최적'
      : score >= 70 ? '좋음'
      : score >= 55 ? '양호'
      : score >= 40 ? '보통'
      : score >= 25 ? '나쁨'
      : score >= 12 ? '매우나쁨'
      : '최악';
    return { label, score: Math.round(score), placeName: idx?.placeName };
  }

  /**
   * 지역 선호(거래량) 상위 경락 시세 — 전국 거래량 × 지역 어획 가중으로 랭킹.
   * changePct = 당일 경락가의 기본 단가 대비 변동률 (%).
   */
  getTopMarketMovers(regionId: string, n = 5): {
    name: string; pricePerKg: number; changePct: number; volumeKg: number;
  }[] {
    const prices = this._snapshot?.marketPrices ?? [];
    const weights = this.getCatchWeights(regionId);
    return prices
      .map((p) => {
        const def = SEAFOOD_AUCTION_MAPPING[p.speciesId];
        const changePct = def && def.defaultPricePerKg > 0
          ? Math.round((p.avgPricePerKg / def.defaultPricePerKg - 1) * 100)
          : 0;
        return { p, changePct, score: p.totalVolumeKg * (weights[p.speciesId] ?? 1.0) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((x) => ({
        name: x.p.itemName, pricePerKg: Math.round(x.p.avgPricePerKg),
        changePct: x.changePct, volumeKg: Math.round(x.p.totalVolumeKg),
      }));
  }

  /** 지역(시도) 어획량 상위 어종 — KOSIS 최신 수록 시점 기준 */
  getRegionTopCatch(regionId: string, n = 5): {
    speciesName: string; value: number; unit: string; period: string;
  }[] {
    const stats = this._snapshot?.regionalCatch;
    const sido = REGION_TO_SIDO[regionId];
    if (!stats || !sido) return [];
    const rows = stats.filter((r) => r.regionName.startsWith(sido));
    if (rows.length === 0) return [];
    const latest = rows.reduce((m, r) => (r.period > m ? r.period : m), rows[0].period);
    return rows
      .filter((r) => r.period === latest && r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, n)
      .map((r) => ({ speciesName: r.speciesName, value: Math.round(r.value), unit: r.unit || '톤', period: latest }));
  }

  /**
   * 지역 선호 어종 입질 전망 (서식 환경별).
   *
   * 실데이터 조합: 바다낚시지수 배율(0.7~1.4) × KOSIS 어획 가중(0.7~1.8)
   * × 물때 활성도(오라클 1~15물) × 야간 보정(현재 시각) → 퍼센트 클램프.
   */
  getRegionBiteOutlook(regionId: string, n = 4): {
    name: string; habitatLabel: string; layerLabel: string; pct: number;
  }[] {
    const weights = this.getCatchWeights(regionId);
    const idx = this.getRegionFishingIndex(regionId);
    const idxMod = idx ? [0, 0.7, 0.85, 1.0, 1.2, 1.4][idx.indexLevel] ?? 1.0 : 1.0;
    const tide = calculateTideInfo(new Date());
    const hour = new Date().getHours();
    const night = hour >= 20 || hour < 5;

    const ranked = Object.entries(weights)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .map(([id, w]) => ({ spec: ORACLE_FISH_DB.find((s) => s.speciesId === id), w: w ?? 1 }))
      .filter((x): x is { spec: (typeof ORACLE_FISH_DB)[number]; w: number } => !!x.spec);

    const tideIdx = Math.max(0, Math.min(14, Math.round(tide.tidePhase) - 1));
    return ranked.slice(0, n).map(({ spec, w }) => {
      const act = spec.tideActivity[tideIdx] ?? 0.5;
      const nb = night ? Math.min(spec.nightBonus ?? 1.0, 1.6) : 1.0;
      const pct = Math.max(3, Math.min(92, Math.round(34 * idxMod * w * (0.45 + act) * nb)));
      return {
        name: spec.nameKo,
        habitatLabel: HABITAT_LABEL[spec.habitat[0]] ?? spec.habitat[0],
        layerLabel: LAYER_LABEL[spec.preferredLayers[0]] ?? spec.preferredLayers[0],
        pct,
      };
    });
  }

  // ── 7) API 연동 상태 요약 (메인 메뉴 표시용) ──────────
  /**
   * 소스별 실데이터/Mock 상태 목록.
   * 스냅샷이 아직 없으면(수집 전) live=false + '수집 중' 상세로 표기된다.
   */
  getApiStatusList(): { name: string; live: boolean; detail: string }[] {
    const r = this._snapshot?.realData;
    const kmaTotal = Object.keys(KMA_GRID_BY_REGION).length;
    return [
      {
        name: '바다낚시지수 (해양조사원)',
        live: r?.fishingIndex ?? false,
        detail: r ? (r.fishingIndex ? `${this._snapshot?.fishingIndex.length ?? 0}건` : 'Mock') : '수집 중',
      },
      {
        name: '수산물 경락가 (MAFRA)',
        live: r?.marketPrices ?? false,
        detail: r ? (r.marketPrices ? `${this._snapshot?.marketPrices.length ?? 0}어종` : 'Mock') : '수집 중',
      },
      {
        name: '어획량 통계 (KOSIS)',
        live: r?.regionalCatch ?? false,
        detail: r ? (r.regionalCatch ? `${this._snapshot?.regionalCatch.length ?? 0}행` : 'Mock') : '수집 중',
      },
      {
        name: '해양기상 (해양측위정보원)',
        live: this._marine.size > 0,
        detail: this._marine.size > 0 ? `${this._marine.size}개 관측소` : (r ? 'Mock' : '수집 중'),
      },
      {
        name: '기상청 단기예보',
        live: this._kma.size > 0,
        detail: this._kma.size > 0 ? `${this._kma.size}/${kmaTotal}개 지역` : (r ? 'Mock' : '수집 중'),
      },
    ];
  }
}

export const ExternalDataStore = new ExternalDataStoreManager();
// 234차 — dev 하네스용(정본 날씨 · 실황 갱신 검증). 배포 빌드에는 붙지 않는다
if (import.meta.env.DEV) (globalThis as unknown as { __EXT?: unknown }).__EXT = ExternalDataStore;
