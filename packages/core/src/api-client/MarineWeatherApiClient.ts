/**
 * @file MarineWeatherApiClient.ts
 * @description 해양수산부 국립해양측위정보원 해양기상 정보 API 클라이언트
 *
 * 전국 76개 관측소(13개 기관)의 실측 해양기상을 수집한다.
 *
 * 엔드포인트 (실호출 검증 2026-07-16):
 *   최신    http://marineweather.nmpnt.go.kr:8001/openWeatherNow.do
 *   날짜별  http://marineweather.nmpnt.go.kr:8001/openWeatherDate.do
 *   공통 파라미터: serviceKey(인증키) · resultType(json) · mmaf(기관코드) ·
 *                  mmsi(지점코드, **필수**, 콤마 구분) · dataType(1|2)
 *   날짜별 추가: date(YYYYMMDD)
 *
 * ⚠️ 주의사항 (실측 확인):
 *  1. **HTTP 전용 (포트 8001)** — HTTPS 미지원. HTTPS 배포 시 프록시 필요
 *     (MAFRA 경락가 API와 동일한 제약).
 *  2. **mmaf(기관코드)와 mmsi(지점코드) 둘 다 필수** — 하나라도 빠지면 HTTP 400
 *     `{"status":"ERROR","message":"mmaf가 없습니다."}`. 한 요청의 mmsi는 모두
 *     같은 mmaf 소속이어야 하므로, 전 지역 수집은 **기관 단위로 나눠 호출**한다
 *     (13회 = 13개 기관, 최대 16지점/요청. 실측 전부 200 OK).
 *  3. **파고/파향은 전 관측소 미관측(0/76)** — WAVE_HEIGTH는 항상 '미제공'.
 *     파고가 필요하면 KHOA 또는 바다낚시지수 API를 쓸 것.
 *  4. **수온은 11/76 관측소만** 관측. 동해청(속초 권역)은 수온 관측소가 없다.
 *  5. **강수·운량 필드가 없음** — 비/맑음/흐림 판정 불가. 기상청 단기예보 API 별도 필요.
 *  6. 에러도 HTTP 400 + `result.status='ERROR'`로 오므로 **HTTP 상태만 보지 말 것**.
 *  7. 모든 값이 문자열. `dataType=2`는 결측을 '미제공'/'데이터없음'/'-' 센티널로 표기.
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

import { MARINE_STATIONS, MMAF_OFFICES } from '../db-schema/MarineStations.js';

/** API 원본 응답 행 (모든 값 문자열, dataType=1이면 결측 필드는 아예 없음) */
export interface NmpntWeatherRow {
  DATETIME?: string;
  MMAF_CODE?: string;
  MMAF_NM?: string;
  MMSI_CODE?: string;
  MMSI_NM?: string;
  WIND_DIRECT?: string;
  WIND_SPEED?: string;
  SURFACE_CURR_DRC?: string;
  SURFACE_CURR_SPEED?: string;
  WAVE_DRC?: string;
  /** 원본 API의 오탈자 — HEIGHT가 아니라 HEIGTH가 맞다 */
  WAVE_HEIGTH?: string;
  AIR_TEMPERATURE?: string;
  HUMIDITY?: string;
  AIR_PRESSURE?: string;
  WATER_TEMPER?: string;
  SALINITY?: string;
  HORIZON_VISIBL?: string;
  TIDE_SPEED?: string;
  TIDE_DIRECT?: string;
  TIDE_TENDENCY?: string;
  LATITUDE?: string;
  LONGITUDE?: string;
}

interface NmpntResponse {
  result?: {
    status?: string;
    message?: string;
    recordset?: NmpntWeatherRow[];
  };
}

/** 정규화된 해양기상 관측값 — 결측은 undefined */
export interface MarineWeatherInfo {
  /** 지점코드 */
  mmsi: string;
  /** 지점명 */
  stationName: string;
  /** 기관코드 */
  mmaf: string;
  /** 기관명 */
  officeName: string;
  /** 관측 시각 (KST) */
  observedAt: Date;
  /** 풍향 (deg, 0~360) */
  windDirectionDeg?: number;
  /** 풍속 (m/s) */
  windSpeedMs?: number;
  /** 기온 (°C) */
  airTempC?: number;
  /** 수온 (°C) — 11개 관측소만 제공 */
  waterTempC?: number;
  /** 습도 (%) */
  humidityPct?: number;
  /** 기압 (hPa) */
  airPressureHpa?: number;
  /** 시정 (m) — 23개 관측소만 제공 */
  visibilityM?: number;
  /** 염분 (psu) */
  salinityPsu?: number;
  /** 표면 유향 (deg) */
  surfaceCurrentDirDeg?: number;
  /** 표면 유속 (m/s) */
  surfaceCurrentSpeedMs?: number;
  /** 위도 */
  lat?: number;
  /** 경도 */
  lon?: number;
}

/** dataType=2 결측 센티널 — 이 값들은 관측값이 아니다 */
const MISSING_SENTINELS = new Set(['미제공', '데이터없음', '-', '']);

/** 문자열 → 숫자 (센티널/비수치는 undefined). '.1'처럼 앞자리 없는 소수도 처리 */
function num(v: string | undefined): number | undefined {
  if (v === undefined || MISSING_SENTINELS.has(v.trim())) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** YYYYMMDDHH24MISS → Date (KST 기준 로컬 시각으로 해석) */
export function parseNmpntDateTime(s: string | undefined): Date | undefined {
  if (!s || s.length < 14) return undefined;
  const y = Number(s.slice(0, 4));
  const mo = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  const h = Number(s.slice(8, 10));
  const mi = Number(s.slice(10, 12));
  const se = Number(s.slice(12, 14));
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return undefined;
  return new Date(y, mo - 1, d, h, mi, se);
}

/** 원본 행 → 정규화 (관측 시각이 없으면 버림) */
function normalize(row: NmpntWeatherRow): MarineWeatherInfo | undefined {
  const observedAt = parseNmpntDateTime(row.DATETIME);
  const mmsi = row.MMSI_CODE;
  if (!observedAt || !mmsi) return undefined;
  return {
    mmsi,
    stationName: row.MMSI_NM ?? mmsi,
    mmaf: row.MMAF_CODE ?? '',
    officeName: row.MMAF_NM ?? MMAF_OFFICES[row.MMAF_CODE ?? ''] ?? '',
    observedAt,
    windDirectionDeg: num(row.WIND_DIRECT),
    windSpeedMs: num(row.WIND_SPEED),
    airTempC: num(row.AIR_TEMPERATURE),
    waterTempC: num(row.WATER_TEMPER),
    humidityPct: num(row.HUMIDITY),
    airPressureHpa: num(row.AIR_PRESSURE),
    visibilityM: num(row.HORIZON_VISIBL),
    salinityPsu: num(row.SALINITY),
    surfaceCurrentDirDeg: num(row.SURFACE_CURR_DRC),
    surfaceCurrentSpeedMs: num(row.SURFACE_CURR_SPEED),
    lat: num(row.LATITUDE),
    lon: num(row.LONGITUDE),
  };
}

export class MarineWeatherApiClient {
  private readonly apiKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl = 'http://marineweather.nmpnt.go.kr:8001') {
    this.apiKey = apiKey ?? '';
    this.useMock = !apiKey;
    this.baseUrl = baseUrl;
  }

  /** 공통 호출 — result.status를 반드시 확인(에러도 HTTP 400으로 옴) */
  private async call(path: string, params: Record<string, string>): Promise<NmpntWeatherRow[]> {
    const url = new URL(`${this.baseUrl}/${path}`);
    url.searchParams.set('serviceKey', this.apiKey);
    url.searchParams.set('resultType', 'json');
    // dataType=2 — 미관측/결측이 센티널로 구분되어 온다(normalize에서 제거)
    url.searchParams.set('dataType', '2');
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString());
    const data = (await res.json()) as NmpntResponse;
    const status = data?.result?.status;
    if (status === 'NOT_FOUND') return [];
    if (status !== 'OK') {
      throw new Error(`NMPNT ${status ?? res.status}: ${data?.result?.message ?? 'unknown'}`);
    }
    return Array.isArray(data.result?.recordset) ? data.result!.recordset! : [];
  }

  /**
   * 지정 지점들의 최신 관측값.
   * @param mmaf 기관코드 — 필수. mmsiList는 모두 이 기관 소속이어야 한다.
   */
  async fetchNow(mmaf: string, mmsiList: string[]): Promise<MarineWeatherInfo[]> {
    if (mmsiList.length === 0) return [];
    const rows = await this.call('openWeatherNow.do', { mmaf, mmsi: mmsiList.join(',') });
    return rows.map(normalize).filter((r): r is MarineWeatherInfo => r !== undefined);
  }

  /**
   * 지정 지점들의 특정 날짜 관측값 (10분 간격, 내림차순 — 하루 약 143건/지점).
   * @param mmaf 기관코드 — 필수.
   */
  async fetchByDate(mmaf: string, mmsiList: string[], date: Date): Promise<MarineWeatherInfo[]> {
    if (mmsiList.length === 0) return [];
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const rows = await this.call('openWeatherDate.do', { mmaf, mmsi: mmsiList.join(','), date: ymd });
    return rows.map(normalize).filter((r): r is MarineWeatherInfo => r !== undefined);
  }

  /**
   * 전국 76개 관측소 최신값 일괄 수집 (지점당 최신 1건).
   * mmaf가 필수이므로 **기관 단위 13회 호출**로 나눈다 — 일부 기관이 실패해도 나머지는 살린다.
   * 키 미설정/전체 실패 시 Mock 폴백.
   */
  async fetchAllStations(): Promise<MarineWeatherInfo[]> {
    if (this.useMock) return this.mockAll();

    // 기관코드별로 지점 묶기 (한 요청의 mmsi는 동일 mmaf 소속이어야 함)
    const byOffice = new Map<string, string[]>();
    for (const st of MARINE_STATIONS) {
      const list = byOffice.get(st.mmaf) ?? [];
      list.push(st.mmsi);
      byOffice.set(st.mmaf, list);
    }

    const settled = await Promise.allSettled(
      [...byOffice.entries()].map(([mmaf, list]) => this.fetchNow(mmaf, list)),
    );
    const all: MarineWeatherInfo[] = [];
    for (const r of settled) if (r.status === 'fulfilled') all.push(...r.value);

    // 전 청크 실패 → 네트워크/키 문제로 보고 Mock 폴백
    if (all.length === 0) return this.mockAll();

    // 지점별 최신 1건만 남김
    const latest = new Map<string, MarineWeatherInfo>();
    for (const info of all) {
      const prev = latest.get(info.mmsi);
      if (!prev || info.observedAt > prev.observedAt) latest.set(info.mmsi, info);
    }
    return [...latest.values()];
  }

  /**
   * 결정적 Mock — 오프라인/키 미설정 시에도 게임이 정상 구동되도록.
   * 지점코드 해시 시드로 하루 동안 고정된 값을 만든다.
   */
  private mockAll(): MarineWeatherInfo[] {
    const now = new Date();
    const daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    return MARINE_STATIONS.map((st) => {
      let h = daySeed;
      for (let i = 0; i < st.mmsi.length; i++) h = (h * 31 + st.mmsi.charCodeAt(i)) >>> 0;
      const r = (n: number) => ((h = (h * 1664525 + 1013904223) >>> 0) % n);
      return {
        mmsi: st.mmsi,
        stationName: st.name,
        mmaf: st.mmaf,
        officeName: MMAF_OFFICES[st.mmaf] ?? '',
        observedAt: now,
        windDirectionDeg: st.sensors.wd ? r(360) : undefined,
        windSpeedMs: st.sensors.ws ? Math.round((r(120) / 10) * 10) / 10 : undefined,
        airTempC: st.sensors.at ? 8 + r(220) / 10 : undefined,
        waterTempC: st.sensors.wt ? 10 + r(150) / 10 : undefined,
        humidityPct: st.sensors.hu ? 40 + r(55) : undefined,
        airPressureHpa: st.sensors.ap ? 995 + r(25) : undefined,
        visibilityM: st.sensors.vis ? 500 + r(19500) : undefined,
        salinityPsu: st.sensors.sal ? 25 + r(120) / 10 : undefined,
        surfaceCurrentDirDeg: st.sensors.cur ? r(360) : undefined,
        surfaceCurrentSpeedMs: st.sensors.cur ? r(30) / 10 : undefined,
      };
    });
  }
}
