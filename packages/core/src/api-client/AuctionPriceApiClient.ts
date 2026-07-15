/**
 * @file AuctionPriceApiClient.ts
 * @description 농림수산식품교육문화정보원(농정원) 도매시장 경락가격 조회 API 클라이언트
 *
 * 참고 자료: 루트의 `농림수산식품교육문화정보원_경락가격 가격 조회_20230911.csv`
 *  → 이 CSV는 가격 데이터가 아니라 도매시장/법인/부류/품목 코드 매핑 테이블이다.
 *    (수산부류: 66 활 어패류, 71 냉동 해면류, 77 신선 갑각류, 81 신선 해면어류 등)
 *
 * 우선 수산물 품목만 연동해 직판장 시세에 적용한다.
 * 어종별 품목 코드는 `SEAFOOD_AUCTION_MAPPING`(types/Economy.ts)을 사용하고,
 * 결과는 `WholesalePriceInfo`로 정규화해 `evaluateFishSellPrice`에 캐시로 공급한다.
 *
 * End Point는 활용신청 승인 문서 기준으로 교체 가능하도록 생성자 주입 지원.
 * API 실패/키 미설정 시 일자 기반 결정적 Mock 시세 폴백 (하루 동안 가격 고정).
 */

import { SEAFOOD_AUCTION_MAPPING, WholesalePriceInfo } from '../types/Economy.js';
import { extractItems } from './FishingIndexApiClient.js';

/** 기본 End Point (승인 문서의 실제 경로로 교체 예정 — 생성자에서 주입 가능) */
const DEFAULT_BASE_URL = 'https://apis.data.go.kr/B190001/whlslMrktAuctionPriceService/getAuctionPriceList';

/** 일자+품목 기반 결정적 의사 난수 (하루 동안 시세 고정) */
function dailySeedRandom(dateYmd: string, key: string): number {
  let h = 2166136261;
  const s = dateYmd + key;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Mock 시세 — 기본 단가에 일자별 ±25% 변동 (결정적) */
export function getMockWholesalePrices(dateYmd: string): WholesalePriceInfo[] {
  return Object.entries(SEAFOOD_AUCTION_MAPPING).map(([speciesId, def]) => {
    const wobble = 0.75 + dailySeedRandom(dateYmd, speciesId) * 0.5;   // 0.75 ~ 1.25
    const avg = Math.round(def.defaultPricePerKg * wobble);
    return {
      speciesId,
      itemName: speciesId,
      breedName: '자연산',
      gradeName: wobble > 1.1 ? '특' : wobble > 0.95 ? '상' : '보통',
      tradeWeightKg: 1,
      avgPricePerKg: avg,
      maxPricePerKg: Math.round(avg * 1.2),
      minPricePerKg: Math.round(avg * 0.8),
      totalVolumeKg: 500 + Math.round(dailySeedRandom(dateYmd, speciesId + 'v') * 3000),
      auctionDate: new Date(),
    };
  });
}

export class AuctionPriceApiClient {
  private readonly serviceKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl: string;

  constructor(serviceKey?: string, baseUrl?: string) {
    this.serviceKey = serviceKey ?? '';
    this.useMock = !serviceKey;
    this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
  }

  /**
   * 수산물 경락가격 일괄 조회 — SEAFOOD_AUCTION_MAPPING 품목 코드 기준.
   * 실패 시 결정적 Mock 시세 폴백.
   */
  async fetchSeafoodPrices(dateYmd: string): Promise<{ items: WholesalePriceInfo[]; isRealData: boolean }> {
    if (this.useMock) {
      return { items: getMockWholesalePrices(dateYmd), isRealData: false };
    }

    try {
      const results: WholesalePriceInfo[] = [];
      // 품목 코드별 조회 (수산 품목만 — 트래픽 절약 위해 순차 대신 병렬)
      const entries = Object.entries(SEAFOOD_AUCTION_MAPPING);
      const settled = await Promise.allSettled(entries.map(async ([speciesId, def]) => {
        const url = new URL(this.baseUrl);
        url.searchParams.set('serviceKey', this.serviceKey);
        url.searchParams.set('_type', 'json');
        url.searchParams.set('pageNo', '1');
        url.searchParams.set('numOfRows', '5');
        url.searchParams.set('delngDe', dateYmd);          // 거래 일자
        url.searchParams.set('prdlstCd', def.itemCode);    // 품목 코드 (CSV 매핑 테이블 기준)

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await response.json();
        const raw = extractItems(data)[0] as Record<string, unknown> | undefined;
        if (!raw) return null;

        const num = (v: unknown): number => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };
        const avg = num(raw['avrgPric'] ?? raw['avgPrice'] ?? raw['sbidPric']);
        if (avg <= 0) return null;

        const info: WholesalePriceInfo = {
          speciesId,
          itemName: String(raw['prdlstNm'] ?? speciesId),
          breedName: String(raw['spciesNm'] ?? ''),
          gradeName: String(raw['gradNm'] ?? '보통'),
          tradeWeightKg: num(raw['delngQy'] ?? 1) || 1,
          avgPricePerKg: avg,
          maxPricePerKg: num(raw['mxmmPric']) || avg,
          minPricePerKg: num(raw['mummPric']) || avg,
          totalVolumeKg: num(raw['delngQy']),
          auctionDate: new Date(),
        };
        return info;
      }));

      for (const s of settled) {
        if (s.status === 'fulfilled' && s.value) results.push(s.value);
      }
      if (results.length === 0) throw new Error('no price rows');
      return { items: results, isRealData: true };
    } catch (e) {
      console.warn('[AuctionPriceApiClient] API 실패 — Mock 시세 폴백:', e);
      return { items: getMockWholesalePrices(dateYmd), isRealData: false };
    }
  }
}
