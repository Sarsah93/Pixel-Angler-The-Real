/**
 * @file ConsignmentAuction.ts
 * @description 위판(委販) 경매 — 플레이어가 **파는 쪽**인 경매 세션 (147차)
 *
 * ⚠ `AuctionEngine.ts`와 방향이 반대다.
 *   - `AuctionEngine`: 플레이어 = 중매인(사는 쪽). `placeBid(playerCoins)` ·
 *     `calcPlayerAuctionTotal` = 낙찰받은 lot의 총 **비용**.
 *   - 이 파일: 플레이어 = 생산자(파는 쪽). 내 어획을 로트로 올리면
 *     경매사가 호가를 부르고 **중매인 NPC들이 붙는다**. 낙찰가에서 위판 수수료를 떼고 입금.
 *
 *   구매자 측 계약은 한 줄도 고치지 않았다 — 나중에 "경매장에서 사기"를 만들 때 쓸 자리다.
 *   공유하는 것은 개폐장 스케줄(`isAuctionOpen`)과 가격 형성 단위(`AuctionLot`)뿐이다.
 *
 * 설계 원칙
 *   - **평판은 수수료율에만 건다.** 낙찰가에 평판을 곱하면 자유 콘텐츠(시장 가격)에
 *     스토리 진행도가 새어 들어간다 — S22 §13 자유 플레이 보장 규칙.
 *   - 법 판정은 재구현하지 않고 `canSell`을 그대로 경유한다(낚싯대 어획은 영원히 불가,
 *     통발·채집물은 어업인 자격이 있을 때만).
 *   - 난수는 주입 가능(`rng`) — 검증 하네스가 결정적으로 돌릴 수 있어야 한다.
 */

import type {
  AuctionCategory,
  AuctionLot,
  AuctionScheduleRule,
  ConsignmentEvent,
  ConsignmentLot,
  ConsignmentLotResult,
  ConsignmentSession,
  ConsignmentSettlement,
} from '../types/Economy.js';
import { DEFAULT_AUCTION_SCHEDULE } from '../types/Economy.js';
import type { CatchMethod, CatchProvenance, LawVerdict } from '../types/Story.js';
import { canSell } from '../rules/FisheryLaw.js';
import { isAuctionOpen, minutesUntilNextAuction } from './AuctionEngine.js';
import { TUNING } from '../config/tuning.js';

/** 등급 → 가격 배수 (구매자 측 `createAuctionLot`과 같은 표) */
const GRADE_MULT: Record<'특' | '상' | '보통', number> = { 특: 1.2, 상: 1.0, 보통: 0.8 };

// ─────────────────────────────────────────────────────────────
// 1. 출품 자격 — 법 판정
// ─────────────────────────────────────────────────────────────

/**
 * 이 어획물을 위판할 수 있는가. `canSell`을 그대로 쓴다.
 *
 * 실질 규칙(FisheryLaw §3):
 *   - `rod`/`handline` → **영원히 불가**(어업인 자격이 있어도)
 *   - `trap`/`net`/`gather` → 어업인 자격(`reported_fishery`)이 있을 때만
 *   - `commercial` → 어업인 자격 필요
 *   - `bought`/`gift` → 불가(되팔기 금지)
 *   - 불법 포획물(금지체장·금어기·미허용 어구·마을어장)은 무조건 불가
 */
export function canConsign(provenance: CatchProvenance, licenses: readonly string[]): LawVerdict {
  const verdict = canSell(provenance, licenses);
  if (!verdict.allowed) return verdict;
  // 위판 전용 요건 — 위판장은 **생산자 출하** 창구다. 일반 판매(`canSell`)는 구매품
  // 되팔기를 허용하지만(상점 매입), 사온 물건을 경매에 올리는 것은 출하가 아니고
  // 싸게 사서 비싸게 넘기는 재정거래 구멍이 된다.
  if (!provenance.caughtByPlayer) {
    return {
      allowed: false,
      ruleId: 'LAW_SELL_ROD',
      reasonKo: '위판장은 직접 잡은 것만 받습니다 — 사거나 받은 물건은 출하할 수 없습니다.',
      reasonEn: 'The auction house only accepts your own catch — bought or gifted seafood cannot be consigned.',
      alternatives: ['상점에 판매', '직접 소비'],
      alternativesEn: ['Sell at a shop', 'Eat it yourself'],
    };
  }
  return verdict;
}

// ─────────────────────────────────────────────────────────────
// 2. 수수료 — 평판 소비처
// ─────────────────────────────────────────────────────────────

/**
 * 위판 수수료율. 항구 평판이 높을수록 싸진다(평판의 실사용처 — S22 §5).
 * 낙찰가 자체에는 평판을 걸지 않는다.
 *
 * @param harborRep 해당 항구 평판 — **0~100 스케일**(`ReputationState.harbor`). 0 = 신참
 */
export function consignmentFeeRate(harborRep: number, duesCut = 0): number {
  const t = TUNING.auction;
  // 171차 — 수협 조합비를 성실히 내고 있으면 요율을 더 깎아 준다(정기 지출의 대가).
  const rate = t.feeRateBase - harborRep * t.feeRepSlope - Math.max(0, duesCut);
  return Math.max(t.feeRateMin, Math.min(0.5, rate));
}

// ─────────────────────────────────────────────────────────────
// 3. 로트 구성
// ─────────────────────────────────────────────────────────────

export interface ConsignInput {
  sourceItemId: string;
  speciesId: string;
  nameKo: string;
  category: AuctionCategory;
  weightKg: number;
  grade: '특' | '상' | '보통';
  origin: string;
  /** 기준 단가 (원/kg) — 경락 시세 캐시 또는 어종 기본가. 시세 배율을 **또** 곱하지 말 것(39차) */
  basePricePerKg: number;
  method: CatchMethod;
  /** 최저 희망가 (원/kg). 0 = 제한 없음 */
  reservePerKg?: number;
  /** 위판 규격 상자 사용 */
  crated?: boolean;
}

/** 출품 목록 → 위판 로트. 순서가 곧 경매 순서다. */
export function buildConsignmentLots(
  inputs: readonly ConsignInput[],
  rng: () => number = Math.random,
): ConsignmentLot[] {
  const t = TUNING.auction;
  return inputs.map((inp, i) => {
    const gm = GRADE_MULT[inp.grade];
    const crateMult = inp.crated ? t.crateBonus : 1;
    const startPerKg = Math.round(inp.basePricePerKg * gm * t.startFrac);
    const span = Math.max(0, t.npcMaxHigh - t.npcMaxLow);
    const npcMax = Math.round(inp.basePricePerKg * gm * crateMult * (t.npcMaxLow + rng() * span));

    const lot: AuctionLot = {
      lotId: `clot_${inp.speciesId}_${i}_${Math.floor(rng() * 1e9)}`,
      speciesId: inp.speciesId,
      nameKo: inp.nameKo,
      category: inp.category,
      weightKg: inp.weightKg,
      grade: inp.grade,
      origin: inp.origin,
      startPricePerKg: startPerKg,
      // 시작가가 중매인 한도를 넘으면 애초에 아무도 안 붙는다 — 유찰이 정상 결과다
      currentBidPerKg: startPerKg,
      status: 'pending',
      winnerId: null,
      npcMaxBidPerKg: npcMax,
    };
    return {
      lot,
      sourceItemId: inp.sourceItemId,
      method: inp.method,
      reservePerKg: Math.max(0, inp.reservePerKg ?? 0),
      crated: inp.crated ?? false,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// 4. 세션 — 개장 판정 · 진행
// ─────────────────────────────────────────────────────────────

/** 지금 이 카테고리 위판이 열려 있는가 (구매자 측과 같은 스케줄을 쓴다) */
export function isConsignmentOpen(
  category: AuctionCategory,
  gameHour: number,
  gameMinute: number,
  gameWeekday: number,
  schedule: AuctionScheduleRule = DEFAULT_AUCTION_SCHEDULE,
): boolean {
  return isAuctionOpen(category, gameHour, gameMinute, gameWeekday, schedule);
}

/** 다음 개장까지 남은 분 (−1 = 산출 불가) */
export function minutesUntilConsignment(
  gameHour: number,
  gameMinute: number,
  gameWeekday: number,
  schedule: AuctionScheduleRule = DEFAULT_AUCTION_SCHEDULE,
): number {
  return minutesUntilNextAuction(gameHour, gameMinute, gameWeekday, schedule);
}

/**
 * 위판 회차를 연다. 개장 시간이 아니면 `null` — 호출측이 안내 문구를 띄운다.
 */
export function openConsignmentSession(
  category: AuctionCategory,
  lots: ConsignmentLot[],
  gameHour: number,
  gameMinute: number,
  gameWeekday: number,
  harborRep: number,
  schedule: AuctionScheduleRule = DEFAULT_AUCTION_SCHEDULE,
  /** 조합비 납부 중일 때의 수수료 할인폭 (171차 — `coopDuesFeeCut`) */
  duesCut = 0,
): ConsignmentSession | null {
  if (lots.length === 0) return null;
  if (!isConsignmentOpen(category, gameHour, gameMinute, gameWeekday, schedule)) return null;
  return {
    sessionId: `consign_${category}_${gameHour}_${gameMinute}_${lots.length}`,
    category,
    lots,
    index: 0,
    phase: 'idle',
    callElapsedSec: 0,
    tickCooldownSec: 0,
    bidCount: 0,
    feeRate: consignmentFeeRate(harborRep, duesCut),
  };
}

/**
 * 경매 진행 1스텝. 호출측(패널)이 매 프레임 dt를 넣는다.
 *
 * 진행 규칙
 *   1. `idle` → 첫 로트를 올린다(`lotOpen`).
 *   2. `calling` — `bidTickSec`마다 응찰 판정. 중매인 한도(`npcMaxBidPerKg`)에
 *      여유가 많을수록 붙을 확률이 높고, 한도에 가까워지면 잦아들다 멈춘다.
 *      `callSecPerLot`이 지나거나 응찰이 한도에 닿으면 낙찰/유찰 확정.
 *   3. `hammer` — `hammerHoldSec` 동안 결과를 보여주고 다음 로트로.
 *
 * @returns 이 스텝에서 발생한 사건들 (없으면 빈 배열)
 */
export function stepConsignment(
  session: ConsignmentSession,
  dtSec: number,
  rng: () => number = Math.random,
): ConsignmentEvent[] {
  const t = TUNING.auction;
  const out: ConsignmentEvent[] = [];
  if (session.phase === 'settled') return out;

  // 1) 첫 로트 올리기
  if (session.phase === 'idle') {
    const cur = session.lots[session.index];
    if (!cur) { session.phase = 'settled'; out.push({ kind: 'sessionEnd' }); return out; }
    cur.lot.status = 'open';
    session.phase = 'calling';
    session.callElapsedSec = 0;
    session.tickCooldownSec = 0;
    session.bidCount = 0;
    out.push({ kind: 'lotOpen', lotId: cur.lot.lotId, nameKo: cur.lot.nameKo, startPerKg: cur.lot.startPricePerKg });
    return out;
  }

  const cur = session.lots[session.index];
  if (!cur) { session.phase = 'settled'; out.push({ kind: 'sessionEnd' }); return out; }

  // 2) 호가 진행
  if (session.phase === 'calling') {
    session.callElapsedSec += dtSec;
    session.tickCooldownSec -= dtSec;

    while (session.tickCooldownSec <= 0 && session.phase === 'calling') {
      session.tickCooldownSec += Math.max(0.05, t.bidTickSec);
      const lot = cur.lot;
      const headroom = lot.npcMaxBidPerKg - lot.currentBidPerKg;
      if (headroom >= t.bidStepWon) {
        // 남은 여유가 클수록 붙을 확률이 높다 (한도에 닿을수록 잦아든다)
        const p = Math.min(0.92, headroom / Math.max(1, lot.npcMaxBidPerKg - lot.startPricePerKg));
        if (rng() < p) {
          lot.currentBidPerKg += t.bidStepWon;
          session.bidCount++;
          out.push({ kind: 'bid', lotId: lot.lotId, perKg: lot.currentBidPerKg, bidder: `중매인 ${1 + Math.floor(rng() * 6)}번` });
        }
      } else {
        // 더 붙을 여지가 없다 — 즉시 확정
        out.push(...hammerCurrent(session, out));
        return out;
      }
      if (session.callElapsedSec >= t.callSecPerLot) {
        out.push(...hammerCurrent(session, out));
        return out;
      }
    }
    return out;
  }

  // 3) 낙찰 연출 유예 → 다음 로트
  if (session.phase === 'hammer') {
    session.callElapsedSec += dtSec;
    if (session.callElapsedSec >= t.hammerHoldSec) {
      session.index++;
      if (session.index >= session.lots.length) {
        session.phase = 'settled';
        out.push({ kind: 'sessionEnd' });
      } else {
        const next = session.lots[session.index];
        next.lot.status = 'open';
        session.phase = 'calling';
        session.callElapsedSec = 0;
        session.tickCooldownSec = 0;
        session.bidCount = 0;
        out.push({ kind: 'lotOpen', lotId: next.lot.lotId, nameKo: next.lot.nameKo, startPerKg: next.lot.startPricePerKg });
      }
    }
    return out;
  }

  return out;
}

/** 현재 로트를 낙찰/유찰로 확정한다 */
function hammerCurrent(session: ConsignmentSession, _out: ConsignmentEvent[]): ConsignmentEvent[] {
  const cur = session.lots[session.index];
  const lot = cur.lot;
  const events: ConsignmentEvent[] = [];

  // 아무도 안 붙었으면 시작가가 곧 마지막 호가다
  const best = lot.currentBidPerKg;
  const metReserve = cur.reservePerKg <= 0 || best >= cur.reservePerKg;
  // 시작가 그대로(응찰 0)면 성립하지 않은 것으로 본다 — 부르는 사람이 없었다
  const hadBid = session.bidCount > 0;

  if (metReserve && hadBid) {
    lot.status = 'sold';
    lot.winnerId = 'npc_buyer';
    events.push({
      kind: 'sold', lotId: lot.lotId, nameKo: lot.nameKo,
      perKg: best, grossWon: Math.round(best * lot.weightKg),
    });
  } else {
    lot.status = 'unsold';
    lot.winnerId = null;
    events.push({ kind: 'unsold', lotId: lot.lotId, nameKo: lot.nameKo, reservePerKg: cur.reservePerKg, bestPerKg: best });
  }

  session.phase = 'hammer';
  session.callElapsedSec = 0;
  return events;
}

/** 진행 중 세션을 즉시 끝까지 굴린다 (검증 하네스·건너뛰기용) */
export function runConsignmentToEnd(
  session: ConsignmentSession,
  rng: () => number = Math.random,
  maxSteps = 20_000,
): ConsignmentEvent[] {
  const all: ConsignmentEvent[] = [];
  let guard = 0;
  while (session.phase !== 'settled' && guard++ < maxSteps) {
    all.push(...stepConsignment(session, 0.5, rng));
  }
  return all;
}

// ─────────────────────────────────────────────────────────────
// 5. 정산
// ─────────────────────────────────────────────────────────────

/**
 * 낙찰 총액에서 위판 수수료를 떼고 실수령액을 낸다.
 * 유찰 로트는 `returnedItemId`로 되돌려받는다(회수 — 아이템 소모 없음).
 */
export function settleConsignment(session: ConsignmentSession): ConsignmentSettlement {
  const perLot: ConsignmentLotResult[] = session.lots.map((cl) => {
    const lot = cl.lot;
    const sold = lot.status === 'sold';
    const gross = sold ? Math.round(lot.currentBidPerKg * lot.weightKg) : 0;
    return {
      lotId: lot.lotId,
      sourceItemId: cl.sourceItemId,
      nameKo: lot.nameKo,
      weightKg: lot.weightKg,
      hammerPerKg: lot.currentBidPerKg,
      grossWon: gross,
      status: lot.status,
      returnedItemId: sold ? undefined : cl.sourceItemId,
    };
  });

  const grossWon = perLot.reduce((s, r) => s + r.grossWon, 0);
  const feeWon = Math.round(grossWon * session.feeRate);
  return {
    grossWon,
    feeWon,
    netWon: grossWon - feeWon,
    soldLots: perLot.filter((r) => r.status === 'sold').length,
    unsoldLots: perLot.filter((r) => r.status !== 'sold').length,
    perLot,
  };
}
