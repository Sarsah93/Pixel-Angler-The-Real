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
 * dev 승인 인증키 (활용신청 승인분).
 * 배포 시 .env(VITE_DATA_GO_KR_API_KEY / VITE_MAFRA_API_KEY / VITE_KOSIS_API_KEY)로 이전할 것.
 */
const DEV_DATA_GO_KR_KEY = '4b172502e73121ca52a5a6ec4d6496c99ce94a250ddb738a555d6909f35b13e7';
/** 농식품 공공데이터 포털 (data.mafra.go.kr) — 수산물 경락가격 2종 승인 키 */
const DEV_MAFRA_KEY = 'f0b32db77604e2f537cfbcca61428aa124ba9dbfb285021c9aa0171a32cec7ac';
/** KOSIS 국가통계포털 — 실호출 검증 완료 (2026-07-16) */
const DEV_KOSIS_KEY = 'NjVmYzFhOTFiNmNkZTA2YjNkMTZlODhmZmJiYjU2NGE=';

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
  { keywords: ['가자미'], speciesIds: ['flounder'] },
  { keywords: ['고등어'], speciesIds: ['chub_mackerel'] },
  { keywords: ['전갱이'], speciesIds: ['horse_mackerel'] },
  { keywords: ['조피볼락', '우럭'], speciesIds: ['black_rockfish'] },
  { keywords: ['볼락'], speciesIds: ['dark_banded_rockfish', 'golden_rockfish', 'blue_rockfish', 'red_snapper_rockfish'] },
  { keywords: ['방어'], speciesIds: ['yellowtail', 'amberjack'] },
  { keywords: ['농어'], speciesIds: ['sea_bass'] },
  { keywords: ['숭어'], speciesIds: ['striped_mullet', 'redlip_mullet'] },
  { keywords: ['붕장어'], speciesIds: ['conger_eel'] },
  { keywords: ['노래미'], speciesIds: ['fat_greenling', 'greenling'] },
  { keywords: ['쥐치'], speciesIds: ['filefish'] },
  { keywords: ['갈치'], speciesIds: ['hairtail'] },
  { keywords: ['복'], speciesIds: ['tiger_puffer', 'fine_puffer'] },
  { keywords: ['망둥어', '망둑'], speciesIds: ['yellowfin_goby'] },
];

class ExternalDataStoreManager {
  private service = new ExternalApiService({
    dataGoKrKey: (import.meta.env.VITE_DATA_GO_KR_API_KEY as string | undefined) ?? DEV_DATA_GO_KR_KEY,
    mafraKey: (import.meta.env.VITE_MAFRA_API_KEY as string | undefined) ?? DEV_MAFRA_KEY,
    kosisKey: (import.meta.env.VITE_KOSIS_API_KEY as string | undefined) ?? DEV_KOSIS_KEY,
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
