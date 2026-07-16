/**
 * @file ExternalApiService.ts
 * @description 정부/공공기관 OpenAPI 통합 수집 매니저
 *
 * 연동 API (확장 가능 구조 — 새 API는 클라이언트 추가 후 fetchAll에 합류):
 *  1) 해양수산부 국립해양조사원 바다낚시지수 → 입질 확률(P_base) 보정
 *  2) 농정원 도매시장 경락가격 (수산물) → 직판장/어판장 시세
 *  3) KOSIS 시도별 어종별 어획량 → 지역별 어종 스폰 가중치
 *
 * 사용 패턴 (네트워크 병목 방지):
 *  - 게임 스타트업/타이틀 진입 시 fetchAll() 1회 호출
 *  - 결과 스냅샷을 클라이언트 싱글톤(ExternalDataStore)에 캐시
 *  - 물리/오라클 엔진은 캐시만 참조 (인게임 루프에서 네트워크 호출 금지)
 *  - API 실패/트래픽 초과 시 각 클라이언트가 Mock 기본값으로 폴백해 정상 구동
 *
 * 순수 TS (fetch 표준 API만 사용) — 렌더링/DOM 없음.
 */

import { FishingIndexApiClient, SeaFishingIndexInfo, FishingIndexGubun, formatYmd } from './FishingIndexApiClient.js';
import { MafraAuctionApiClient } from './MafraAuctionApiClient.js';
import { KosisCatchApiClient, RegionalCatchStat } from './KosisCatchApiClient.js';
import type { WholesalePriceInfo } from '../types/Economy.js';

/** API 인증키 묶음 (+ 브라우저 CORS 우회 프록시 baseUrl) */
export interface ExternalApiKeys {
  /** 공공데이터포털 (data.go.kr) 일반 인증키 — 바다낚시지수 */
  dataGoKrKey?: string;
  /** 농식품 공공데이터 포털 (data.mafra.go.kr) 인증키 — 수산물 경락가격 */
  mafraKey?: string;
  /** KOSIS 국가통계포털 인증키 */
  kosisKey?: string;
  /**
   * MAFRA 경락가 API baseUrl 교체 (기본: http://211.237.50.150:7080/openapi).
   * MAFRA는 HTTP 전용 + CORS 헤더 없음 → 브라우저에서는 프록시 필수.
   */
  mafraBaseUrl?: string;
  /**
   * KOSIS API baseUrl 교체 (기본: https://kosis.kr/openapi/...).
   * kosis.kr은 CORS 헤더가 없어 브라우저 직접 호출이 차단된다.
   */
  kosisBaseUrl?: string;
}

/** 통합 수집 스냅샷 — 클라이언트 캐시(ExternalDataStore)에 보관 */
export interface ExternalDataSnapshot {
  /** 바다낚시지수 (갯바위 기준 전 포인트) */
  fishingIndex: SeaFishingIndexInfo[];
  /** 수산물 경락 시세 (speciesId 정규화) */
  marketPrices: WholesalePriceInfo[];
  /** 시도별 어종별 어획량 */
  regionalCatch: RegionalCatchStat[];
  /** 각 데이터가 실 API에서 왔는지 여부 */
  realData: { fishingIndex: boolean; marketPrices: boolean; regionalCatch: boolean };
}

export class ExternalApiService {
  private readonly fishingIndexClient: FishingIndexApiClient;
  private readonly auctionClient: MafraAuctionApiClient;
  private readonly kosisClient: KosisCatchApiClient;

  constructor(keys: ExternalApiKeys = {}) {
    // 바다낚시지수(apis.data.go.kr)는 CORS 허용이라 프록시 불필요
    this.fishingIndexClient = new FishingIndexApiClient(keys.dataGoKrKey);
    this.auctionClient = keys.mafraBaseUrl
      ? new MafraAuctionApiClient(keys.mafraKey, keys.mafraBaseUrl)
      : new MafraAuctionApiClient(keys.mafraKey);
    this.kosisClient = keys.kosisBaseUrl
      ? new KosisCatchApiClient(keys.kosisKey, keys.kosisBaseUrl)
      : new KosisCatchApiClient(keys.kosisKey);
  }

  /** 바다낚시지수 단건 조회 (수동 갱신용) */
  async getSeaFishingIndex(gubun: FishingIndexGubun = '갯바위', placeName?: string): Promise<SeaFishingIndexInfo[]> {
    const { items } = await this.fishingIndexClient.fetchFishingIndex(gubun, undefined, placeName);
    return items;
  }

  /** 수산물 경락 시세 단건 조회 (MAFRA 경락가격 — 2023년 동월동일 계절 시세) */
  async getFishWholesalePrices(): Promise<WholesalePriceInfo[]> {
    const { items } = await this.auctionClient.fetchSeafoodPrices(new Date());
    return items;
  }

  /** 시도별 어획량 단건 조회 */
  async getFishCatchByRegion(): Promise<RegionalCatchStat[]> {
    const { items } = await this.kosisClient.fetchRegionalCatch();
    return items;
  }

  /**
   * 전체 API 일괄 수집 (게임 스타트업 1회 호출).
   * 개별 실패는 각 클라이언트의 Mock 폴백으로 처리되어 항상 스냅샷을 반환한다.
   */
  async fetchAll(): Promise<ExternalDataSnapshot> {
    const now = new Date();
    const [idx, prices, kosis] = await Promise.all([
      this.fishingIndexClient.fetchFishingIndex('갯바위', formatYmd(now)),
      this.auctionClient.fetchSeafoodPrices(now),
      this.kosisClient.fetchRegionalCatch(),
    ]);

    return {
      fishingIndex: idx.items,
      marketPrices: prices.items,
      regionalCatch: kosis.items,
      realData: {
        fishingIndex: idx.isRealData,
        marketPrices: prices.isRealData,
        regionalCatch: kosis.isRealData,
      },
    };
  }
}
