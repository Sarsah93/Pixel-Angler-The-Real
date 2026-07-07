/**
 * @file OceanApiClient.ts
 * @description 국립해양조사원 API 클라이언트 (조위/수온/파고)
 *
 * API: 국립해양조사원 해양 기상 데이터
 * 참고: https://www.khoa.go.kr/oceangrid/khoa/apiService.do
 */

import type { TideInfo } from '../types/Environment.js';
import { calculateTideInfo } from '../simulation/TideCalculator.js';

export class OceanApiClient {
  private readonly apiKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl = 'https://www.khoa.go.kr/api/oceangrid/oceansHeavy/search.do';

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? '';
    this.useMock = !apiKey || apiKey === 'YOUR_KHOA_API_KEY_HERE';
  }

  /**
   * 특정 관측소의 조위 정보 조회
   * @param stationCode 관측소 코드 (예: '1030' = 거제 장승포)
   * @param date 조회 날짜 (기본값: 오늘)
   */
  async fetchTideInfo(stationCode: string, date: Date = new Date()): Promise<TideInfo> {
    if (this.useMock) {
      console.debug('[OceanApiClient] Using calculated tide data (no API key)');
      return calculateTideInfo(date);
    }

    const dateStr = formatDate(date);
    const url = new URL(this.baseUrl);
    url.searchParams.set('ServiceKey', this.apiKey);
    url.searchParams.set('ObsCode', stationCode);
    url.searchParams.set('Date', dateStr);
    url.searchParams.set('ResultType', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn('[OceanApiClient] API 요청 실패, 계산값으로 대체');
      return calculateTideInfo(date);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    return this.parseTideResponse(data, date);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseTideResponse(_data: any, date: Date): TideInfo {
    // TODO: 실제 API 응답 파싱
    // 국립해양조사원 응답 포맷에 맞게 구현 필요
    return calculateTideInfo(date);
  }
}

/** YYYYMMDD 포맷으로 날짜 변환 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** 지역별 조위 관측소 코드 */
export const TIDE_STATION_CODES: Record<string, string> = {
  geoje: '1030',      // 거제 장승포
  yeosu: '1005',      // 여수
  jeju: '1060',       // 제주
  busan: '1020',      // 부산
  tongyeong: '1028',  // 통영
  pohang: '1015',     // 포항
  donghae: '1012',    // 동해
  sokcho: '1010',     // 속초
};
