/**
 * @file WeatherApiClient.ts
 * @description 기상청 API 클라이언트 (기상청 날씨 허브)
 *
 * API: 기상청 단기예보 / 현재날씨 조회
 * 참고: https://apihub.kma.go.kr/
 */

import type { WeatherData } from '../types/Environment.js';
import { getMockWeatherData } from './mock/mockWeather.js';
import { getWindDirectionLabel } from '../simulation/WeatherModel.js';

export class WeatherApiClient {
  private readonly apiKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl = 'https://apihub.kma.go.kr/api/typ02';

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? '';
    this.useMock = !apiKey || apiKey === 'YOUR_KMA_API_KEY_HERE';
  }

  /**
   * 좌표 기반 현재 날씨 조회
   * @param lat 위도
   * @param lon 경도
   */
  async fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    if (this.useMock) {
      console.debug('[WeatherApiClient] Using mock weather data');
      return getMockWeatherData();
    }

    // TODO: 기상청 격자 좌표 변환 (위경도 → 격자 XY) 필요
    // 기상청 API는 위경도 직접 사용이 아닌 격자 좌표 사용
    const gridCoord = latLonToGrid(lat, lon);

    const url = new URL(`${this.baseUrl}/obs/asos/api`);
    url.searchParams.set('authKey', this.apiKey);
    url.searchParams.set('lat', String(gridCoord.nx));
    url.searchParams.set('lon', String(gridCoord.ny));

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn('[WeatherApiClient] API 요청 실패, Mock 데이터로 대체');
      return getMockWeatherData();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    return this.parseWeatherResponse(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseWeatherResponse(data: any): WeatherData {
    // TODO: 실제 API 응답 파싱
    const windDeg = data?.windDir ?? 0;
    return getMockWeatherData({
      temperatureC: data?.temperature ?? 20,
      windSpeedMs: data?.windSpeed ?? 3,
      windDirectionDeg: windDeg,
      windDirectionLabel: getWindDirectionLabel(windDeg),
    });
  }
}

/** 위경도 → 기상청 격자 변환 (Lambert 투영) */
function latLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}
