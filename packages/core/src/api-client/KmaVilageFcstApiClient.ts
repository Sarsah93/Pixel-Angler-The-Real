/**
 * @file KmaVilageFcstApiClient.ts
 * @description 기상청 단기예보 조회서비스(VilageFcstInfoService_2.0) 클라이언트
 *
 * 해양기상 API(MarineWeatherApiClient)에 없는 **하늘상태·강수·파고**를 담당한다.
 * 두 API의 역할 분담:
 *   - 기상청(이 파일)  : 하늘상태(SKY) · 강수형태(PTY) · 강수확률(POP) · 파고(WAV) · 기온 · 풍속
 *   - 국립해양측위정보원 : 실측 수온 · 시정(안개) · 염분 · 표면 유향유속
 *
 * 엔드포인트: https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0
 *   - getUltraSrtNcst 초단기실황 — 현재 실측값. **SKY(하늘상태) 없음**, PTY는 있음.
 *       base_time = 매시 정시(HH00), API 제공 매시 10분 이후.
 *   - getVilageFcst   단기예보   — SKY·PTY·POP·WAV·TMP 등. 3일치.
 *       base_time = 0200·0500·0800·1100·1400·1700·2000·2300 (1일 8회), 각 +10분 이후 제공.
 *
 * ⚠️ 주의:
 *  1. 현재 하늘상태(맑음/흐림)는 **실황에 없으므로 단기예보의 현재시각 슬롯**에서 읽는다.
 *  2. `+900 이상 / -900 이하`는 **결측(Missing)** — 관측장비가 없는 해양이거나 결측.
 *  3. 인증키는 URL 인코딩된 키를 쓸 것. URLSearchParams가 자동 인코딩하므로
 *     **디코딩된 원본 키**를 생성자에 넣어야 이중 인코딩되지 않는다.
 *  4. 에러가 HTTP 200 + `resultCode !== '00'`으로 오므로 HTTP 상태만 보지 말 것.
 *  5. HTTPS 지원 — 프록시 불필요 (MAFRA/NMPNT와 달리).
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

/** 하늘상태(SKY) 코드 — 맑음(1), 구름많음(3), 흐림(4) */
export type SkyCode = 1 | 3 | 4;

/**
 * 강수형태(PTY) 코드
 *  - 단기예보: 없음(0), 비(1), 비/눈(2), 눈(3), 소나기(4)
 *  - 초단기:   위 + 빗방울(5), 빗방울눈날림(6), 눈날림(7)
 */
export type PtyCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 게임 표시용 날씨 상태 (HUD 아이콘) */
export type WeatherKind =
  | 'clear'        // 맑음
  | 'partly'       // 구름많음
  | 'cloudy'       // 흐림
  | 'rain'         // 비
  | 'sleet'        // 비/눈
  | 'snow'         // 눈
  | 'shower'       // 소나기
  | 'fog';         // 안개 (시정 기반 — 기상청 코드엔 없음, 해양기상 시정으로 판정)

/** 기상청 응답 아이템 (실황/예보 공통 — 필드 유무만 다름) */
export interface KmaFcstItem {
  baseDate: string;
  baseTime: string;
  category: string;
  /** 실황값 (getUltraSrtNcst) */
  obsrValue?: string;
  /** 예보값 (getVilageFcst / getUltraSrtFcst) */
  fcstValue?: string;
  /** 예보일자 */
  fcstDate?: string;
  /** 예보시각 */
  fcstTime?: string;
  nx?: number;
  ny?: number;
}

interface KmaResponse {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: {
      items?: { item?: KmaFcstItem[] };
      totalCount?: number;
    };
  };
}

/** 격자 좌표 */
export interface KmaGrid {
  nx: number;
  ny: number;
}

/** 정규화된 현재 기상 */
export interface KmaWeatherInfo {
  /** 격자 */
  grid: KmaGrid;
  /** 기준 시각 */
  observedAt: Date;
  /** 하늘상태 코드 (단기예보 기준 — 실황엔 없음) */
  sky?: SkyCode;
  /** 강수형태 코드 (실황 우선) */
  pty?: PtyCode;
  /** 게임 표시용 날씨 종류 */
  kind: WeatherKind;
  /** 기온 (°C) */
  tempC?: number;
  /** 습도 (%) */
  humidityPct?: number;
  /** 풍속 (m/s) */
  windSpeedMs?: number;
  /** 풍향 (deg) */
  windDirectionDeg?: number;
  /** 1시간 강수량 (mm) — 0이면 강수없음 */
  rain1hMm?: number;
  /** 강수확률 (%) — 단기예보만 */
  popPct?: number;
  /** 파고 (m) — 단기예보만. 해양기상 API엔 없는 값이라 여기서만 얻을 수 있다 */
  waveHeightM?: number;
}

/** 결측 판정 — +900 이상 / -900 이하는 Missing */
function isMissing(n: number): boolean {
  return !Number.isFinite(n) || n >= 900 || n <= -900;
}

/** 문자열 → 숫자 (결측/비수치는 undefined) */
function num(v: string | undefined): number | undefined {
  if (v === undefined || v === null || v.trim() === '') return undefined;
  const n = Number(v);
  return isMissing(n) ? undefined : n;
}

/**
 * 강수량 문자열 → mm.
 * 기상청은 '강수없음' / '1mm 미만' / '30.0~50.0mm' / '50.0mm 이상' 같은 범주 문자열을 준다.
 * '-', null, 0 은 강수없음.
 */
export function parsePrecipitation(v: string | undefined): number {
  if (!v || v === '-' || v === '강수없음' || v === '0') return 0;
  if (v.includes('미만')) return 0.5;          // '1mm 미만'
  if (v.includes('이상')) return 50;           // '50.0mm 이상'
  const m = v.match(/([\d.]+)/);               // '6.2mm' / '30.0~50.0mm' → 첫 수치
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** SKY/PTY → 게임 날씨 종류. PTY(강수)가 SKY(하늘)보다 우선한다. */
export function resolveWeatherKind(sky: SkyCode | undefined, pty: PtyCode | undefined): WeatherKind {
  switch (pty) {
    case 1: return 'rain';
    case 2: return 'sleet';
    case 3: return 'snow';
    case 4: return 'shower';
    case 5: return 'rain';    // 빗방울
    case 6: return 'sleet';   // 빗방울눈날림
    case 7: return 'snow';    // 눈날림
    default: break;           // 0(없음) 또는 미상 → 하늘상태로
  }
  switch (sky) {
    case 1: return 'clear';
    case 3: return 'partly';
    case 4: return 'cloudy';
    default: return 'clear';
  }
}

/** 날씨 종류 → 한국어 라벨 */
export const WEATHER_LABEL: Record<WeatherKind, string> = {
  clear: '맑음',
  partly: '구름많음',
  cloudy: '흐림',
  rain: '비',
  sleet: '비/눈',
  snow: '눈',
  shower: '소나기',
  fog: '안개',
};

/** YYYYMMDD */
function ymd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 초단기실황 base_date/base_time 산출.
 * 매시 정시 생성 + 10분 이후 제공 → 정각~10분 사이엔 이전 시각을 써야 한다.
 */
export function ultraSrtNcstBase(now: Date): { baseDate: string; baseTime: string } {
  const d = new Date(now);
  if (d.getMinutes() < 10) d.setHours(d.getHours() - 1);
  return { baseDate: ymd(d), baseTime: `${String(d.getHours()).padStart(2, '0')}00` };
}

/** 단기예보 발표시각 (1일 8회) */
const VILAGE_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];

/**
 * 단기예보 base_date/base_time 산출.
 * 발표시각 +10분 이후 제공 → 현재 시각보다 이전인 가장 최근 발표시각을 고른다.
 */
export function vilageFcstBase(now: Date): { baseDate: string; baseTime: string } {
  const d = new Date(now);
  // 제공 지연 10분을 빼서 판단 (02:05는 아직 02시 발표분이 없음 → 전날 23시)
  d.setMinutes(d.getMinutes() - 10);
  const h = d.getHours();
  let pick = -1;
  for (const bh of VILAGE_BASE_HOURS) if (bh <= h) pick = bh;
  if (pick < 0) {
    // 02시 이전 → 전날 23시 발표분
    d.setDate(d.getDate() - 1);
    pick = 23;
  }
  return { baseDate: ymd(d), baseTime: `${String(pick).padStart(2, '0')}00` };
}

export class KmaVilageFcstApiClient {
  private readonly apiKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0') {
    this.apiKey = apiKey ?? '';
    this.useMock = !apiKey;
    this.baseUrl = baseUrl;
  }

  /** 공통 호출 — resultCode를 반드시 확인(에러도 HTTP 200으로 옴) */
  private async call(op: string, params: Record<string, string>): Promise<KmaFcstItem[]> {
    const url = new URL(`${this.baseUrl}/${op}`);
    // serviceKey는 URLSearchParams가 인코딩하므로 디코딩된 원본 키를 넣는다
    url.searchParams.set('serviceKey', this.apiKey);
    url.searchParams.set('dataType', 'JSON');
    url.searchParams.set('numOfRows', '1000');
    url.searchParams.set('pageNo', '1');
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString());
    const text = await res.text();
    let data: KmaResponse;
    try {
      data = JSON.parse(text) as KmaResponse;
    } catch {
      // 키 오류 등은 XML 에러 문서로 오기도 한다
      throw new Error(`KMA 응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 160)}`);
    }
    const code = data.response?.header?.resultCode;
    if (code !== '00') {
      throw new Error(`KMA ${code}: ${data.response?.header?.resultMsg ?? 'unknown'}`);
    }
    return data.response?.body?.items?.item ?? [];
  }

  /** 초단기실황 (현재 실측 — SKY 없음) */
  async fetchUltraSrtNcst(grid: KmaGrid, now = new Date()): Promise<KmaFcstItem[]> {
    const { baseDate, baseTime } = ultraSrtNcstBase(now);
    return this.call('getUltraSrtNcst', {
      base_date: baseDate, base_time: baseTime, nx: String(grid.nx), ny: String(grid.ny),
    });
  }

  /** 단기예보 (SKY·POP·WAV 포함, 3일치) */
  async fetchVilageFcst(grid: KmaGrid, now = new Date()): Promise<KmaFcstItem[]> {
    const { baseDate, baseTime } = vilageFcstBase(now);
    return this.call('getVilageFcst', {
      base_date: baseDate, base_time: baseTime, nx: String(grid.nx), ny: String(grid.ny),
    });
  }

  /**
   * 현재 기상 종합 — 실황(PTY/기온/풍속) + 단기예보(SKY/POP/파고)를 합친다.
   * 하늘상태는 실황에 없으므로 예보의 현재시각 슬롯에서 가져온다.
   * 실패/키 미설정 시 결정적 Mock 폴백.
   */
  async fetchCurrent(grid: KmaGrid, now = new Date()): Promise<KmaWeatherInfo> {
    if (this.useMock) return this.mock(grid, now);

    const [ncstR, fcstR] = await Promise.allSettled([
      this.fetchUltraSrtNcst(grid, now),
      this.fetchVilageFcst(grid, now),
    ]);
    if (ncstR.status === 'rejected' && fcstR.status === 'rejected') return this.mock(grid, now);

    const info: KmaWeatherInfo = { grid, observedAt: now, kind: 'clear' };

    // 1) 실황 — category별 obsrValue
    if (ncstR.status === 'fulfilled') {
      for (const it of ncstR.value) {
        const v = it.obsrValue;
        switch (it.category) {
          case 'T1H': info.tempC = num(v); break;
          case 'REH': info.humidityPct = num(v); break;
          case 'WSD': info.windSpeedMs = num(v); break;
          case 'VEC': info.windDirectionDeg = num(v); break;
          case 'PTY': info.pty = num(v) as PtyCode | undefined; break;
          case 'RN1': info.rain1hMm = parsePrecipitation(v); break;
        }
      }
    }

    // 2) 단기예보 — 현재 시각에 가장 가까운(=현재 이후 첫) 슬롯
    if (fcstR.status === 'fulfilled') {
      const slot = this.nearestSlot(fcstR.value, now);
      for (const it of fcstR.value) {
        if (it.fcstDate !== slot.date || it.fcstTime !== slot.time) continue;
        const v = it.fcstValue;
        switch (it.category) {
          case 'SKY': info.sky = num(v) as SkyCode | undefined; break;
          case 'POP': info.popPct = num(v); break;
          case 'WAV': info.waveHeightM = num(v); break;
          // 실황이 실패했을 때만 예보값으로 보완
          case 'TMP': if (info.tempC === undefined) info.tempC = num(v); break;
          case 'WSD': if (info.windSpeedMs === undefined) info.windSpeedMs = num(v); break;
          case 'VEC': if (info.windDirectionDeg === undefined) info.windDirectionDeg = num(v); break;
          case 'PTY': if (info.pty === undefined) info.pty = num(v) as PtyCode | undefined; break;
        }
      }
    }

    info.kind = resolveWeatherKind(info.sky, info.pty);
    return info;
  }

  /** 예보 목록에서 현재 시각 이후 가장 이른 슬롯 (없으면 첫 슬롯) */
  private nearestSlot(items: KmaFcstItem[], now: Date): { date: string; time: string } {
    const nowKey = `${ymd(now)}${String(now.getHours()).padStart(2, '0')}00`;
    const keys = [...new Set(items
      .filter((i) => i.fcstDate && i.fcstTime)
      .map((i) => `${i.fcstDate}${i.fcstTime}`))].sort();
    const hit = keys.find((k) => k >= nowKey) ?? keys[0] ?? nowKey;
    return { date: hit.slice(0, 8), time: hit.slice(8, 12) };
  }

  /** 결정적 Mock — 격자+날짜 시드로 하루 동안 고정 */
  private mock(grid: KmaGrid, now: Date): KmaWeatherInfo {
    let h = (now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()) >>> 0;
    h = (h * 31 + grid.nx * 397 + grid.ny) >>> 0;
    const r = (n: number) => ((h = (h * 1664525 + 1013904223) >>> 0) % n);
    const sky = ([1, 3, 4] as SkyCode[])[r(3)];
    const pty = (r(10) < 7 ? 0 : ([1, 2, 3, 4] as PtyCode[])[r(4)]) as PtyCode;
    return {
      grid,
      observedAt: now,
      sky,
      pty,
      kind: resolveWeatherKind(sky, pty),
      tempC: 5 + r(250) / 10,
      humidityPct: 40 + r(55),
      windSpeedMs: r(120) / 10,
      windDirectionDeg: r(360),
      rain1hMm: pty === 0 ? 0 : r(50) / 10,
      popPct: r(100),
      waveHeightM: r(30) / 10,
    };
  }
}
