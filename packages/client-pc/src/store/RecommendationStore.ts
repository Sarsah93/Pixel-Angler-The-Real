/**
 * @file RecommendationStore.ts
 * @description 채비/장비 추천 컨텍스트 조립 + 아이템 매칭 (추천 마크)
 *
 * 현재 게임 상태(지역·낚시터 지형·물때·대상어종)로 core의 채비 추천
 * (getRigRecommendation)을 호출하고, 인벤토리/상점 아이템이 추천에
 * 부합하는지(= '추천' 마크 표시 여부)를 판정한다.
 */

import {
  getRigRecommendation, RigRecommendation, RigRecoContext,
  REGION_AREA_NODES, getAreaNodeById, calculateTideInfo,
} from '@tra/core';
import { GameState } from './GameState.js';
import { ExternalDataStore } from './ExternalDataStore.js';
import { InvItem, isWeightSinker, isBaitItem } from './InventoryStore.js';

/** 낚싯대 미끼 이름 → BaitKey 매핑 (오라클 baitPreference 키와 일치) */
function baitKeyOf(item: InvItem): string | undefined {
  const n = item.name;
  if (n.includes('혼무시')) return 'worm_king';
  if (n.includes('지렁이')) return 'worm_blue';
  if (n.includes('크릴')) return 'krill';
  if (n.includes('빵') || n.includes('떡밥')) return 'bread';
  if (n.includes('생선') || n.includes('오징어')) return 'fishcut';
  if (n.includes('옥수수')) return 'corn';
  if (n.includes('게') || n.includes('소라')) return 'crab';
  if (n.includes('성게')) return 'urchin';
  if (n.includes('조개') || n.includes('개불')) return 'shellfish';
  return undefined;
}

/** 찌 이름에서 호수 추출 (예: '구멍찌 0.8호' → 0.8) */
function floatHoOf(item: InvItem): number | undefined {
  const m = item.name.match(/(\d+(?:\.\d+)?)\s*호/);
  return m ? Number(m[1]) : undefined;
}

class RecommendationStoreManager {
  /** 현재 낚시터 area id로 region id 역매핑 */
  private regionOfSpot(spotId: string | null): string {
    if (spotId) {
      for (const [regionId, nodes] of Object.entries(REGION_AREA_NODES)) {
        if (nodes.some((n) => n.id === spotId || n.fieldMapId === spotId)) return regionId;
      }
    }
    return 'gangwon_sokcho';
  }

  /** 현재 게임 상태 → 추천 컨텍스트 */
  buildContext(): RigRecoContext {
    const spotId = GameState.currentSpotId;
    const regionId = this.regionOfSpot(spotId);
    const area = spotId ? getAreaNodeById(spotId) : undefined;
    const snagRisk = area?.snagRisk ?? 'mid';
    const depthM = area?.depthRangeM ? (area.depthRangeM[0] + area.depthRangeM[1]) / 2 : 8;
    const tidePhase = calculateTideInfo().tidePhase;
    const hour = new Date().getHours();

    // 대상어종: 지역 어획 가중 상위 (KOSIS/스폰 가중) — 없으면 지역 대표
    const weights = ExternalDataStore.getCatchWeights(regionId);
    let targetSpeciesIds = Object.entries(weights)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .slice(0, 4)
      .map(([id]) => id);
    if (targetSpeciesIds.length === 0) {
      targetSpeciesIds = ['black_seabream', 'flatfish', 'rockfish'];
    }

    return {
      regionId, snagRisk, tidePhase, depthM,
      isNight: hour >= 20 || hour < 5,
      targetSpeciesIds,
    };
  }

  /** 현재 추천 (매 호출 시 최신 상태로 산출 — 값이 가벼워 캐시 불필요) */
  get(): RigRecommendation {
    return getRigRecommendation(this.buildContext());
  }

  // ── 아이템별 추천 여부 (소켓/상점 '추천' 마크) ──────────
  /** 무게추 봉돌 추천 여부 — 종류 일치 + 호수 범위 내 */
  isSinkerRecommended(item: InvItem, reco: RigRecommendation): boolean {
    if (!isWeightSinker(item) || !reco.sinkerKind || !reco.sinkerHoRange) return false;
    if (item.sinkerKind !== reco.sinkerKind) return false;
    const ho = item.sinkerHo ?? 0;
    return ho >= reco.sinkerHoRange[0] && ho <= reco.sinkerHoRange[1];
  }

  /** 찌 추천 여부 — 추천 호수 ±0.3 이내 */
  isFloatRecommended(item: InvItem, reco: RigRecommendation): boolean {
    if (reco.floatHo === undefined || !item.name.includes('구멍찌')) return false;
    const ho = floatHoOf(item);
    return ho !== undefined && Math.abs(ho - reco.floatHo) <= 0.3;
  }

  /** 미끼 추천 여부 — 추천 BaitKey 목록에 포함 */
  isBaitRecommended(item: InvItem, reco: RigRecommendation): boolean {
    if (!isBaitItem(item)) return false;
    const key = baitKeyOf(item);
    return key !== undefined && reco.baitKeys.includes(key as never);
  }

  /** 아이템 전반 추천 여부 (상점 그리드용 — 종류 자동 판별) */
  isItemRecommended(item: InvItem, reco: RigRecommendation): boolean {
    return this.isSinkerRecommended(item, reco)
      || this.isFloatRecommended(item, reco)
      || this.isBaitRecommended(item, reco);
  }
}

export const RecommendationStore = new RecommendationStoreManager();
