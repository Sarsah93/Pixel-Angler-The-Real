/**
 * @file MarketPriceEvaluator.ts
 * @description 경락 시세 기반 수산물 수매 가격 책정 엔진
 */

import { SEAFOOD_AUCTION_MAPPING, WholesalePriceInfo } from '../types/Economy.js';

export interface PriceEvaluationResult {
  /** 최종 산출된 수매가 (원) */
  finalPrice: number;
  /** kg당 적용된 단가 */
  pricePerKg: number;
  /** 등급 배율 */
  gradeMultiplier: number;
  /** 크기/길이 보정 배율 */
  sizeMultiplier: number;
  /** 실제 API 적용 여부 */
  isRealTimeApiApplied: boolean;
}

/**
 * 실시간 경매 낙찰가 정보(WholesalePriceInfo) 또는 기본 고정 단가를 기준하여
 * 개별 어획물의 실제 어판장 수매가를 연산합니다.
 *
 * @param speciesId - 어종 고유 ID
 * @param lengthCm - 물고기 몸길이 (cm)
 * @param weightGram - 물고기 무게 (g)
 * @param realTimeCache - 농정원 API에서 수집된 시세 정보 캐시 (선택적)
 */
export function evaluateFishSellPrice(
  speciesId: string,
  lengthCm: number,
  weightGram: number,
  realTimeCache?: WholesalePriceInfo
): PriceEvaluationResult {
  const mapping = SEAFOOD_AUCTION_MAPPING[speciesId];
  if (!mapping) {
    // 매핑되지 않은 일반 품목은 g당 10원 기본값 처리
    return {
      finalPrice: Math.round(weightGram * 10),
      pricePerKg: 10000,
      gradeMultiplier: 1.0,
      sizeMultiplier: 1.0,
      isRealTimeApiApplied: false,
    };
  }

  // 1. 기준 단가 (kg당 단가) 결정
  let pricePerKg = mapping.defaultPricePerKg;
  let isRealTimeApiApplied = false;

  if (realTimeCache && realTimeCache.speciesId === speciesId) {
    pricePerKg = realTimeCache.avgPricePerKg;
    isRealTimeApiApplied = true;
  }

  // 2. 등급 보정 (Phaser 게임 상태의 품질이나 무게에 상응하는 등급)
  // 여기서는 중량 대비 평균치 기준으로 등급 가중치 부여
  let gradeMultiplier = 1.0;
  if (realTimeCache) {
    if (realTimeCache.gradeName === '특') gradeMultiplier = 1.25;
    else if (realTimeCache.gradeName === '상') gradeMultiplier = 1.1;
    else if (realTimeCache.gradeName === '보통') gradeMultiplier = 0.9;
  } else {
    // 오프라인/기본 상태일 경우 랜덤성 가미 혹은 특정 무게 기준 보정
    if (weightGram > 1500) gradeMultiplier = 1.2;
    else if (weightGram < 400) gradeMultiplier = 0.85;
  }

  // 3. 크기(길이) 보정 배율
  // 어종별 고유 sizeFactorMultiplier를 크기 오버 스케일 대비 연산
  const sizeMultiplier = 1.0 + (lengthCm * 0.01 * mapping.sizeFactorMultiplier);

  // 4. 최종 가격 연산
  // 가격 = kg당 단가 * 중량(kg) * 등급 가중치 * 크기 가중치
  const weightKg = weightGram / 1000;
  const rawPrice = pricePerKg * weightKg * gradeMultiplier * sizeMultiplier;
  const finalPrice = Math.max(100, Math.round(rawPrice));

  return {
    finalPrice,
    pricePerKg,
    gradeMultiplier,
    sizeMultiplier,
    isRealTimeApiApplied,
  };
}
