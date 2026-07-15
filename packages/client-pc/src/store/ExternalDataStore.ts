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
} from '@tra/core';

/**
 * 공공데이터포털/KOSIS 개발계정 일반 인증키 (dev 승인 키 — 활용신청 승인분).
 * 배포 시 .env(VITE_DATA_GO_KR_API_KEY / VITE_KOSIS_API_KEY)로 이전할 것.
 */
const DEV_SERVICE_KEY = '4b172502e73121ca52a5a6ec4d6496c99ce94a250ddb738a555d6909f35b13e7';

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

/** KOSIS 어종 분류명 → 게임 어종 ID 매칭 (부분 문자열 기준) */
const KOSIS_SPECIES_MATCH: { keywords: string[]; speciesId: string }[] = [
  { keywords: ['감성돔'], speciesId: 'black_seabream' },
  { keywords: ['참돔', '돔류'], speciesId: 'red_seabream' },
  { keywords: ['넙치', '광어'], speciesId: 'flatfish' },
  { keywords: ['가자미'], speciesId: 'flounder' },
  { keywords: ['고등어'], speciesId: 'chub_mackerel' },
  { keywords: ['전갱이'], speciesId: 'horse_mackerel' },
  { keywords: ['볼락', '조피볼락', '우럭'], speciesId: 'black_rockfish' },
  { keywords: ['방어', '부시리'], speciesId: 'amberjack' },
  { keywords: ['붕장어', '장어'], speciesId: 'conger_eel' },
  { keywords: ['쥐노래미', '노래미'], speciesId: 'fat_greenling' },
  { keywords: ['복어'], speciesId: 'tiger_puffer' },
];

class ExternalDataStoreManager {
  private service = new ExternalApiService({
    dataGoKrKey: (import.meta.env.VITE_DATA_GO_KR_API_KEY as string | undefined) ?? DEV_SERVICE_KEY,
    kosisKey: (import.meta.env.VITE_KOSIS_API_KEY as string | undefined) ?? DEV_SERVICE_KEY,
  });

  private _snapshot: ExternalDataSnapshot | null = null;
  private _promise: Promise<void> | null = null;

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
    this._promise = this.service.fetchAll()
      .then((snap) => {
        this._snapshot = snap;
        const r = snap.realData;
        console.log(`[ExternalDataStore] 수집 완료 — 낚시지수:${r.fishingIndex ? '실데이터' : 'Mock'}, 경락가:${r.marketPrices ? '실데이터' : 'Mock'}, 어획량:${r.regionalCatch ? '실데이터' : 'Mock'}`);
      })
      .finally(() => { this._promise = null; });
    return this._promise;
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

    // 시도 매칭 행만 집계 (어획량 항목 우선)
    const bySpecies = new Map<string, number>();
    for (const row of stats) {
      if (!row.regionName.startsWith(sido)) continue;
      if (row.itemName && !row.itemName.includes('어획량') && row.itemName !== '') {
        // 어획금액 등 다른 항목은 제외 (항목명이 비어 있으면 포함)
        if (!row.itemName.includes('생산량')) continue;
      }
      const match = KOSIS_SPECIES_MATCH.find((m) => m.keywords.some((k) => row.speciesName.includes(k)));
      if (!match) continue;
      bySpecies.set(match.speciesId, (bySpecies.get(match.speciesId) ?? 0) + row.value);
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
