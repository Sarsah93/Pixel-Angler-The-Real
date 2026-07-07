/**
 * @file PublicDataClient.ts
 * @description 공공데이터포털 바다 낚시터 API 클라이언트
 *
 * API: 해양수산부 바다낚시 관련 정보
 * 참고: https://www.data.go.kr/
 *
 * USE_MOCK_DATA=true 환경에서는 Mock 데이터를 반환합니다.
 */

import type { FishingSpotInfo } from '../types/Environment.js';
import { getMockFishingSpots, getMockSpotById } from './mock/mockFishingSpots.js';

export class PublicDataClient {
  private readonly apiKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl = 'https://api.data.go.kr/openapi';

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? '';
    this.useMock = !apiKey || apiKey === 'YOUR_PUBLIC_DATA_API_KEY_HERE';
  }

  /**
   * 전체 낚시터 목록 조회
   * @param pageNo 페이지 번호 (1부터 시작)
   * @param numOfRows 페이지 당 항목 수
   */
  async fetchFishingSpots(pageNo: number = 1, numOfRows: number = 20): Promise<FishingSpotInfo[]> {
    if (this.useMock) {
      console.debug('[PublicDataClient] Using mock data for fishing spots');
      return getMockFishingSpots();
    }

    // TODO: 실제 API 연동
    // 공공데이터 API 엔드포인트 및 파라미터는 API 발급 후 문서 확인 필요
    const url = new URL(`${this.baseUrl}/fishingSpot/getList`);
    url.searchParams.set('serviceKey', this.apiKey);
    url.searchParams.set('pageNo', String(pageNo));
    url.searchParams.set('numOfRows', String(numOfRows));
    url.searchParams.set('resultType', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`PublicDataClient: API 요청 실패 (${response.status})`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    // TODO: 실제 API 응답 파싱 (API 문서 확인 후 구현)
    return this.parseSpotApiResponse(data);
  }

  /**
   * 낚시터 ID로 상세 정보 조회
   */
  async fetchSpotById(id: string): Promise<FishingSpotInfo | null> {
    if (this.useMock) {
      return getMockSpotById(id) ?? null;
    }

    // TODO: 실제 API 연동
    const url = new URL(`${this.baseUrl}/fishingSpot/getDetail`);
    url.searchParams.set('serviceKey', this.apiKey);
    url.searchParams.set('spotId', id);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    return this.parseSpotApiResponse(data)[0] ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseSpotApiResponse(_data: any): FishingSpotInfo[] {
    // TODO: 실제 API 응답 구조에 맞게 파싱 구현
    // 현재는 Mock 데이터로 대체
    return getMockFishingSpots();
  }
}
