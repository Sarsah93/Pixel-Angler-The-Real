/**
 * @file AuctionEngine.ts
 * @description 수산시장 경매 엔진
 *
 * 게임 내 시간 기반으로 경매 개폐장 여부를 판단하고,
 * 세션 생성 / 입찰 처리 / NPC 경쟁 시뮬레이션을 수행합니다.
 *
 * 경매 일정 (기본):
 *   선어·어류·패류  01:00 ~ 03:00  (월~토)
 *   활어            03:00 ~ 07:00  (월~토)
 *   일요일 새벽     미개장
 */

import type {
  AuctionCategory,
  AuctionLot,
  AuctionLotStatus,
  AuctionSession,
  AuctionBidResult,
  AuctionScheduleRule,
} from '../types/Economy.js';
import { DEFAULT_AUCTION_SCHEDULE } from '../types/Economy.js';

// ─────────────────────────────────────────────────────────────
// 경매 개폐장 판단 유틸
// ─────────────────────────────────────────────────────────────

/**
 * 현재 게임 내 시간에 경매가 열려있는지 확인합니다.
 *
 * @param gameHour     - 게임 내 현재 시 (0~23)
 * @param gameMinute   - 게임 내 현재 분 (0~59)
 * @param gameWeekday  - 게임 내 현재 요일 (0=일요일 ~ 6=토요일)
 * @param schedule     - 경매 일정 규칙 (기본값: DEFAULT_AUCTION_SCHEDULE)
 * @returns 현재 진행 중인 AuctionCategory 배열. 빈 배열이면 미개장.
 */
export function getActiveAuctionCategories(
  gameHour: number,
  gameMinute: number,
  gameWeekday: number,
  schedule: AuctionScheduleRule = DEFAULT_AUCTION_SCHEDULE
): AuctionCategory[] {
  // 휴무 요일 체크
  if (schedule.closedOnWeekdays.includes(gameWeekday)) return [];

  const nowMinutes = gameHour * 60 + gameMinute;
  const active: AuctionCategory[] = [];

  for (const window of schedule.timeWindows) {
    const startMin = window.startHour * 60 + window.startMinute;
    const endMin   = window.endHour   * 60 + window.endMinute;

    if (nowMinutes >= startMin && nowMinutes < endMin) {
      for (const cat of window.categories) {
        if (!active.includes(cat)) active.push(cat);
      }
    }
  }

  return active;
}

/**
 * 특정 카테고리의 경매가 지금 열려있는지 단순 불리언으로 반환합니다.
 */
export function isAuctionOpen(
  category: AuctionCategory,
  gameHour: number,
  gameMinute: number,
  gameWeekday: number,
  schedule: AuctionScheduleRule = DEFAULT_AUCTION_SCHEDULE
): boolean {
  return getActiveAuctionCategories(gameHour, gameMinute, gameWeekday, schedule).includes(category);
}

/**
 * 현재 게임 내 시간을 기준으로 다음 경매 개장까지 남은 게임 내 분을 반환합니다.
 * 이미 개장 중이면 0을 반환합니다.
 */
export function minutesUntilNextAuction(
  gameHour: number,
  gameMinute: number,
  gameWeekday: number,
  schedule: AuctionScheduleRule = DEFAULT_AUCTION_SCHEDULE
): number {
  const nowMin = gameHour * 60 + gameMinute;
  const isClosed = schedule.closedOnWeekdays.includes(gameWeekday);

  let earliestStart = Infinity;

  for (const window of schedule.timeWindows) {
    const startMin = window.startHour * 60 + window.startMinute;
    const endMin   = window.endHour   * 60 + window.endMinute;

    if (!isClosed && nowMin >= startMin && nowMin < endMin) return 0; // 이미 개장 중

    // 오늘 아직 시작 안 된 경매 (휴무 요일이 아닐 때)
    if (!isClosed && startMin > nowMin) {
      earliestStart = Math.min(earliestStart, startMin - nowMin);
    }
  }

  // 오늘 남은 경매가 없으면 내일(다음 영업일) 첫 경매까지의 분 계산
  if (earliestStart === Infinity) {
    const minutesLeftToday = 24 * 60 - nowMin;
    let daysAhead = 1;
    while (daysAhead < 8) {
      const nextDay = (gameWeekday + daysAhead) % 7;
      if (!schedule.closedOnWeekdays.includes(nextDay) && schedule.timeWindows.length > 0) {
        const firstWindow = schedule.timeWindows.reduce((a, b) =>
          (a.startHour * 60 + a.startMinute) < (b.startHour * 60 + b.startMinute) ? a : b
        );
        return minutesLeftToday + (daysAhead - 1) * 24 * 60 + firstWindow.startHour * 60 + firstWindow.startMinute;
      }
      daysAhead++;
    }
  }

  return earliestStart === Infinity ? -1 : earliestStart;
}

// ─────────────────────────────────────────────────────────────
// 경매 세션 생성
// ─────────────────────────────────────────────────────────────

/** Lot 생성 파라미터 */
export interface LotGenerationParams {
  speciesId: string;
  nameKo: string;
  category: AuctionCategory;
  weightKg: number;
  grade: '특' | '상' | '보통';
  origin: string;
  basePricePerKg: number;
}

/**
 * 단일 AuctionLot를 생성합니다.
 * NPC 최대 입찰가는 시장 변동성을 반영해 기준가의 80~140% 사이에서 랜덤 설정됩니다.
 */
export function createAuctionLot(params: LotGenerationParams, lotIndex: number): AuctionLot {
  const gradeMultiplier = params.grade === '특' ? 1.2 : params.grade === '상' ? 1.0 : 0.8;
  const startPrice = Math.round(params.basePricePerKg * gradeMultiplier * 0.7); // 시작가는 기준가의 70%

  // NPC들의 경쟁 한도 (기준가 대비 80~140%)
  const npcVariance = 0.8 + Math.random() * 0.6;
  const npcMax = Math.round(params.basePricePerKg * gradeMultiplier * npcVariance);

  return {
    lotId: `lot_${params.speciesId}_${lotIndex}_${Date.now()}`,
    speciesId: params.speciesId,
    nameKo: params.nameKo,
    category: params.category,
    weightKg: params.weightKg,
    grade: params.grade,
    origin: params.origin,
    startPricePerKg: startPrice,
    currentBidPerKg: startPrice,
    status: 'pending',
    winnerId: null,
    npcMaxBidPerKg: npcMax,
  };
}

/**
 * 지정된 날짜·요일·카테고리에 대한 경매 세션을 생성합니다.
 * lots 리스트는 호출자가 직접 주입하거나 추후 DB에서 로드합니다.
 *
 * @param gameDate  - 게임 내 날짜 문자열 (YYYY-MM-DD)
 * @param weekday   - 요일 (0=일요일)
 * @param category  - 경매 카테고리
 * @param lots      - 사전 생성된 AuctionLot 배열
 * @param schedule  - 경매 일정 규칙
 */
export function createAuctionSession(
  gameDate: string,
  weekday: number,
  category: AuctionCategory,
  lots: AuctionLot[],
  schedule: AuctionScheduleRule = DEFAULT_AUCTION_SCHEDULE
): AuctionSession | null {
  // 휴무 요일이면 세션 생성 안 함
  if (schedule.closedOnWeekdays.includes(weekday)) return null;

  const window = schedule.timeWindows.find((w) => w.categories.includes(category));
  if (!window) return null;

  return {
    sessionId: `${gameDate}_${category}`,
    category,
    gameDate,
    weekday,
    openAtHour: window.startHour,
    closeAtHour: window.endHour,
    lots: lots.map((lot) => ({ ...lot, status: 'pending' as AuctionLotStatus })),
    currentLotIndex: 0,
    isCompleted: false,
  };
}

// ─────────────────────────────────────────────────────────────
// 경매 진행 — 입찰 & NPC 경쟁
// ─────────────────────────────────────────────────────────────

/** 입찰 최소 단위 증분 (원/kg) */
const BID_INCREMENT = 500;

/**
 * 플레이어가 특정 Lot에 입찰합니다.
 *
 * @param session           - 현재 경매 세션
 * @param lotId             - 입찰하려는 lot ID
 * @param playerBidPerKg    - 플레이어가 제시하는 입찰가 (원/kg)
 * @param playerCoins       - 플레이어 보유 코인 (원)
 * @param gameHour          - 현재 게임 내 시
 * @param gameMinute        - 현재 게임 내 분
 * @param gameWeekday       - 현재 게임 내 요일
 * @returns AuctionBidResult
 */
export function placeBid(
  session: AuctionSession,
  lotId: string,
  playerBidPerKg: number,
  playerCoins: number,
  gameHour: number,
  gameMinute: number,
  gameWeekday: number
): AuctionBidResult {
  // 경매 개장 시간 체크
  if (!isAuctionOpen(session.category, gameHour, gameMinute, gameWeekday)) {
    return { success: false, newBidPerKg: 0, failReason: 'auction_closed', isLeading: false };
  }

  const lot = session.lots.find((l) => l.lotId === lotId);
  if (!lot || lot.status === 'sold' || lot.status === 'withdrawn') {
    return { success: false, newBidPerKg: lot?.currentBidPerKg ?? 0, failReason: 'auction_closed', isLeading: false };
  }

  // 최소 입찰가 미달 체크
  const minRequired = lot.currentBidPerKg + BID_INCREMENT;
  if (playerBidPerKg < minRequired) {
    return { success: false, newBidPerKg: lot.currentBidPerKg, failReason: 'bid_too_low', isLeading: false };
  }

  // 플레이어 보유 자금 체크 (총 낙찰 시 지불 금액 기준)
  const totalCost = playerBidPerKg * lot.weightKg;
  if (totalCost > playerCoins) {
    return { success: false, newBidPerKg: lot.currentBidPerKg, failReason: 'insufficient_funds', isLeading: false };
  }

  // 입찰 적용
  lot.currentBidPerKg = playerBidPerKg;
  lot.winnerId = 'player';
  lot.status = 'open';

  // NPC 자동 대응 입찰 (플레이어 입찰가가 NPC 한도 이하면 NPC가 재입찰)
  const npcCounter = simulateNpcCounterBid(lot, playerBidPerKg);

  if (npcCounter !== null) {
    // NPC가 더 높게 입찰함
    lot.currentBidPerKg = npcCounter;
    lot.winnerId = `npc_buyer_${Math.floor(Math.random() * 5) + 1}`;
    return { success: true, newBidPerKg: npcCounter, isLeading: false };
  }

  return { success: true, newBidPerKg: playerBidPerKg, isLeading: true };
}

/**
 * NPC 자동 카운터 입찰 시뮬레이션
 * 플레이어 입찰가가 npcMaxBidPerKg 미만이면 NPC가 반응합니다.
 *
 * @returns NPC의 카운터 입찰가, 또는 NPC가 포기하면 null
 */
export function simulateNpcCounterBid(
  lot: AuctionLot,
  playerBidPerKg: number
): number | null {
  if (playerBidPerKg >= lot.npcMaxBidPerKg) {
    // NPC 한도 초과 — NPC 포기
    return null;
  }

  // NPC는 플레이어보다 BID_INCREMENT만큼 높게 입찰
  const npcBid = playerBidPerKg + BID_INCREMENT;

  // NPC 한도 내에서만 입찰
  return npcBid <= lot.npcMaxBidPerKg ? npcBid : null;
}

/**
 * 경매 세션의 현재 lot을 낙찰/유찰 처리하고 다음 lot으로 진행합니다.
 * 마지막 lot 처리 후 isCompleted = true로 설정합니다.
 *
 * @returns 낙찰된 lot (플레이어 낙찰 시), 또는 null
 */
export function advanceAuctionSession(session: AuctionSession): AuctionLot | null {
  if (session.isCompleted) return null;

  const lot = session.lots[session.currentLotIndex];
  if (!lot) return null;

  // 현재 lot 상태 확정
  if (lot.status === 'open' || lot.status === 'pending') {
    if (lot.winnerId !== null) {
      lot.status = 'sold';
    } else {
      lot.status = 'unsold';
    }
  }

  const wonLot = lot.status === 'sold' && lot.winnerId === 'player' ? lot : null;

  // 다음 lot으로 이동
  session.currentLotIndex += 1;
  if (session.currentLotIndex >= session.lots.length) {
    session.isCompleted = true;
  } else {
    session.lots[session.currentLotIndex].status = 'open';
  }

  return wonLot;
}

/**
 * 세션에서 플레이어가 낙찰받은 모든 lot의 총 비용을 계산합니다.
 */
export function calcPlayerAuctionTotal(session: AuctionSession): number {
  return session.lots
    .filter((l) => l.status === 'sold' && l.winnerId === 'player')
    .reduce((sum, l) => sum + l.currentBidPerKg * l.weightKg, 0);
}
