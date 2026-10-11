/**
 * @file CraftingStore.ts
 * @description 제작 판정 · 시간 큐 · 세이브 (129차 P7 → 222차 시간이 걸리는 제작)
 *
 * core `CRAFT_BLUEPRINTS`(무엇을 먹고 무엇이 나오는가) + `CraftRules`(시간 · 품질 · 취소 · 숙련) +
 * `CraftOutputs`(산출 템플릿)를 잇는다. 성공률 · 재료 절약은 스킬 효과 키로 읽는다(하드코딩 배수 금지).
 *
 * 222차 — 제작은 **시간이 걸린다**(사용자 확정 기획):
 *  - 줄(lane) 둘: **맨손**(1줄) · **작업대**(1줄). 줄마다 지금 1건 + 「인내심」 스킬이면 예약 2건.
 *  - 1개를 시작할 때 그 개의 재료를 먼저 치른다(`paid`). 끝나면 성공 굴림 → 성공이면 산출(+품질 덤),
 *    실패면 재료 하나하나를 `lossChance`로 잃고 나머지는 돌려준다.
 *  - 맨손 줄은 **손이 비어 있을 때만** 나아간다 — 씬이 `tick(now, handFree)`로 알려 준다(낚시 · 손질 중 멈춤).
 *    틱 간격이 2초를 넘으면(씬 정지 · 1인칭 낚시 · 접속 끊김) 그 사이는 세지 않는다.
 *  - 작업대 줄은 자리를 떠나도 돈다(벽시계). 접속을 끊은 동안은 최대 `TUNING.craft.benchOfflineCapH`시간까지.
 *  - 「중지」 = 지금 1개를 마저 만들고 멈춤(잃는 것 없음). 「취소」 = 지금 1개를 버린다 —
 *    진행 25% 이하면 재료 전부 · 50% 이하면 절반(재료 단위마다 50%) · 그 위면 전부 잃는다.
 *  - 가방에 자리가 없으면 시작 전에 막는다. 그래도 넘치면(진행 중 가방이 참) **제작 보관함**에 쌓아 둔다(사라지지 않음).
 *  - 분야 숙련(손재주) = 갈래별 제작 경험. 성공률 · 시간 · 품질을 조금씩 돕는다.
 *
 * 223차 — **도면을 얻어야 만든다**(`bp.learn`). 처음부터 아는 도면(learn 없음)은 그대로 —
 *  상점 도면 종이를 읽거나(`readPaper`), 만든 물건을 분해하다(`scrap`) 짜임새를 깨친다.
 *  모르는 도면은 목록에 나오지 않는다(R2). 분해는 재료 일부만 돌려준다(`craftScrapReturn`).
 *
 * ⚠ 스킬 효과 모드 함정: `craft_success`·`craft_material`·`medic_quality` 는 **mult 모드**라
 *   `skillMult` 로 읽는다. add 모드 키(`craft_batch` 등)는 `skillBonus` 로 읽는다.
 */

import {
  CRAFT_BLUEPRINTS, getBlueprint, materialSaveChance, TUNING, getSkillById, skillsOfCategory,
  craftModifiers, craftSuccessFinal, craftUnitMs, craftLossChance, rollCraftQuality, craftCancelRefund,
  craftMasteryLevel, craftMasteryGain, dexterityScore,
  craftLevelBonus, craftScrapReturn, craftScrapLearnChance, blueprintsByOutput, CRAFT_SCRAP_GROUPS,
  type CraftBlueprint, type CraftMaterial, type CraftStation, type CraftGroup, type CraftModifiers, type CraftQuality,
} from '@tra/core';
import { InventoryStore, type InvItem, type InvItemTemplate } from './InventoryStore.js';
import { GameState } from './GameState.js';
import { StoryStore } from './StoryStore.js';
import { craftOutputTemplate } from '../data/CraftOutputs.js';

/** 재료 1항목의 보유/필요 현황 */
export interface CraftMaterialStatus {
  material: CraftMaterial;
  have: number;
  need: number;
  ok: boolean;
}

/** 제작 가능 여부 판정 결과 */
export interface CraftCheck {
  ok: boolean;
  /** 재료 현황 (부족분은 ok:false) */
  materials: CraftMaterialStatus[];
  /** 막힌 까닭(레벨 · 스킬 · 자리 · 재료 · 가방) */
  reason: string | null;
  /** 현재 재료로 만들 수 있는 최대 횟수 */
  maxQty: number;
  /** 조건(레벨 · 스킬 · 작업대)이 안 맞는가 — 목록 회색 */
  locked: boolean;
}

/** 줄 — 맨손 / 작업대(고급 포함) */
export type CraftLane = 'hand' | 'bench';
export const laneOf = (s: CraftStation): CraftLane => (s === 'hand' ? 'hand' : 'bench');

/** 치른 재료 한 묶음(돌려줄 때 같은 물건으로) */
interface PaidMat { tpl: InvItemTemplate; qty: number }

/** 제작 한 건(같은 도면 n개) */
export interface CraftJob {
  id: string;
  bpId: string;
  lane: CraftLane;
  qty: number;
  /** 끝낸 개수(성공 + 실패) */
  done: number;
  ok: number;
  fail: number;
  /** 품질 덤으로 더 얻은 개수 · 좋음 · 훌륭함 */
  bonus: number;
  good: number;
  great: number;
  xp: number;
  /** 실패로 잃은 재료 단위 수 · 공구 관리로 아낀 수 */
  lost: number;
  saved: number;
  /** 보관함으로 간 산출 개수 */
  stored: number;
  /** 지금 1개 시간 · 진행(ms) */
  unitMs: number;
  progressMs: number;
  /** 지금 1개를 위해 치른 재료(없으면 아직 시작 전) */
  paid: PaidMat[] | null;
  /** 지금 것만 마치고 멈춤 */
  stopAfterUnit: boolean;
  /** 마지막 진행 계산 시각 */
  lastMs: number;
}

/** 끝난 건의 결과(결과 창 · 로그) */
export interface CraftReport {
  bpId: string;
  name: string;
  outputName: string;
  ok: number;
  fail: number;
  bonus: number;
  good: number;
  great: number;
  xp: number;
  lost: number;
  stored: number;
  reason: 'done' | 'stopped' | 'nomat' | 'cancel';
  /** 취소로 돌려받은 / 잃은 재료 단위 */
  refunded?: number;
  forfeited?: number;
}

/** 제작 보관함 한 칸(가방이 차서 못 넣은 산출) */
export interface CraftStored { tpl: InvItemTemplate; qty: number }

export interface CraftingSaveState {
  jobs: CraftJob[];
  storage: CraftStored[];
  reports: CraftReport[];
  mastery: Partial<Record<CraftGroup, number>>;
  crafted: string[];
  /** 223차 — 얻어서 아는 도면(처음부터 아는 것은 넣지 않는다) */
  known?: string[];
}

/** 223차 — 분해 결과 */
export interface CraftScrapResult {
  ok: boolean;
  reason?: string;
  bpName?: string;
  /** 돌려받은 재료(이름 · 개수) */
  returned: { name: string; qty: number }[];
  /** 이번에 도면을 깨쳤는가 */
  learned: boolean;
}

/** 인벤토리 아이템이 이 재료에 해당하는가 (itemId | speciesId | byproductKind) */
function matches(i: InvItem, m: CraftMaterial): boolean {
  if (i.slot < 0) return false;   // 쓰고 있는 장비는 재료로 집지 않는다
  if (m.itemId) return i.id === m.itemId;
  if (m.speciesId) return i.speciesId === m.speciesId;
  if (m.byproductKind) return i.byproductKind === m.byproductKind;
  return false;
}

function haveCount(m: CraftMaterial): number {
  return InventoryStore.items.filter((i) => matches(i, m)).reduce((a, i) => a + i.qty, 0);
}

/** 재료 1종을 qty개 꺼낸다 — 꺼낸 물건의 모양을 남긴다(되돌려줄 때 같은 물건으로) */
function takeOut(m: CraftMaterial, qty: number): PaidMat[] {
  let left = qty;
  const out: PaidMat[] = [];
  const pool = InventoryStore.items.filter((i) => matches(i, m)).sort((a, b) => a.qty - b.qty);
  for (const i of pool) {
    if (left <= 0) break;
    const take = Math.min(i.qty, left);
    const { slot: _s, qty: _q, ...tpl } = i;
    out.push({ tpl: { ...tpl, equipped: false }, qty: take });
    InventoryStore.removeQty(i.id, take);
    left -= take;
  }
  return out;
}

/** 산출이 쌓이는 물건인가(같은 id로 수량만 늘어남) — 장비 · 도구는 한 자루씩 */
function stackable(tpl: InvItemTemplate): boolean {
  return !(tpl.equippable || tpl.tool || tpl.category === 'gear');
}

const QUALITY_RANK: Record<CraftQuality, number> = { normal: 0, good: 1, great: 2 };

class CraftingStoreManager {
  private jobs: CraftJob[] = [];
  private storage: CraftStored[] = [];
  private reports: CraftReport[] = [];
  private mastery: Partial<Record<CraftGroup, number>> = {};
  private crafted = new Set<string>();
  private known = new Set<string>();
  private seq = 0;
  private listeners = new Set<(r: CraftReport | null) => void>();

  // ── 조회 ─────────────────────────────────────────
  /** 위치별 도면 목록 — 작업대는 고급(공구 세트) 도면까지 함께 보인다 */
  blueprints(station: CraftStation): CraftBlueprint[] {
    const known = CRAFT_BLUEPRINTS.filter((b) => this.knows(b.id));
    if (station === 'hand') return known.filter((b) => b.station === 'hand');
    return known.filter((b) => b.station !== 'hand');
  }

  // ── 223차 — 도면 얻기 ───────────────────────────────
  /** 이 도면을 아는가(얻는 길이 없는 도면은 처음부터 안다) */
  knows(bpId: string): boolean {
    const bp = getBlueprint(bpId);
    if (!bp) return false;
    return !bp.learn || this.known.has(bpId);
  }

  /** 얻어서 아는 도면 수 · 얻을 수 있는 도면 수 */
  learnedCount(): { learned: number; total: number } {
    const total = CRAFT_BLUEPRINTS.filter((b) => !!b.learn).length;
    return { learned: this.known.size, total };
  }

  /** 도면을 깨친다 — 새로 알게 됐으면 true */
  learn(bpId: string): boolean {
    const bp = getBlueprint(bpId);
    if (!bp?.learn || this.known.has(bpId)) return false;
    this.known.add(bpId);
    GameState.markDirty();
    this.emit(null);
    return true;
  }

  /** 도면 종이 읽기 — 한 장을 쓰고 도면을 안다. 이미 알면 종이를 남긴다 */
  readPaper(item: InvItem): { ok: boolean; message: string } {
    const bp = item.blueprintId ? getBlueprint(item.blueprintId) : undefined;
    if (!bp) return { ok: false, message: '읽을 수 없는 종이다' };
    if (this.knows(bp.id)) return { ok: false, message: `이미 아는 도면이다 — ${bp.nameKo}` };
    InventoryStore.removeQty(item.id, 1);
    this.learn(bp.id);
    return { ok: true, message: `도면을 익혔다 — ${bp.nameKo}` };
  }

  /** 이 물건을 분해할 수 있는가 — 만드는 도면이 있고 분해하는 갈래여야 한다 */
  scrapTarget(item: InvItem): CraftBlueprint | null {
    if (item.slot < 0 || item.equipped || item.bound || item.category === 'quest') return null;
    const bps = blueprintsByOutput(item.id).filter((b) => CRAFT_SCRAP_GROUPS.includes(b.group));
    // 분해로 깨치는 도면을 먼저 — 같은 물건을 여러 도면이 만들면 배울 것이 있는 쪽
    return bps.find((b) => b.learn?.via === 'scrap') ?? bps[0] ?? null;
  }

  /** 분해 — 물건 1개를 풀어 재료 일부를 돌려받고, 분해로 깨치는 도면이면 확률로 안다 */
  scrap(item: InvItem, rng: () => number = Math.random): CraftScrapResult {
    const bp = this.scrapTarget(item);
    if (!bp) return { ok: false, reason: '분해할 수 없는 물건이다', returned: [], learned: false };
    if (!InventoryStore.removeQty(item.id, 1)) return { ok: false, reason: '물건이 없다', returned: [], learned: false };
    const returned: { name: string; qty: number }[] = [];
    for (const line of craftScrapReturn(bp, rng)) {
      const m = bp.materials[line.index];
      const tpl = m.itemId ? craftOutputTemplate(m.itemId) : null;
      if (!tpl) continue;
      this.give(tpl, line.qty);
      returned.push({ name: m.nameKo, qty: line.qty });
    }
    let learned = false;
    if (!this.knows(bp.id) && rng() < craftScrapLearnChance(bp, this.dexterity())) learned = this.learn(bp.id);
    this.mastery[bp.group] = this.masteryXp(bp.group) + craftMasteryGain(bp, false);
    GameState.applyVitalsAction('craft', 1);
    GameState.markDirty();
    this.emit(null);
    return { ok: true, bpName: bp.nameKo, returned, learned };
  }

  /** 스킬 조건 */
  unlocked(bp: CraftBlueprint): boolean {
    if (!bp.requiresSkill) return true;
    return GameState.skillRank(bp.requiresSkill.id) >= bp.requiresSkill.rank;
  }

  /** 고급 작업대 = 작업대 + 로드 빌딩 공구 세트(가방) */
  hasAdvancedTools(): boolean {
    return !!InventoryStore.find('workshop_pro_tools');
  }

  /** 분야 숙련 XP · 레벨 */
  masteryXp(g: CraftGroup): number { return this.mastery[g] ?? 0; }
  masteryLevel(g: CraftGroup): number { return craftMasteryLevel(this.masteryXp(g)); }

  /** 손재주 — 분야 숙련 + 배운 제작 기술 숙련 + 레벨 몫(core `dexterityScore`) */
  dexterity(): number {
    const mastery: Partial<Record<CraftGroup, number>> = {};
    for (const g of Object.keys(this.mastery) as CraftGroup[]) mastery[g] = this.masteryLevel(g);
    const prof = skillsOfCategory('crafting')
      .filter((d) => d.proficiency && GameState.skillRank(d.id) > 0)
      .map((d) => GameState.profLevelOf(d.id));
    return dexterityScore({ mastery, craftSkillProf: prof, level: GameState.player.level ?? 1 });
  }

  /** 지금 손 상태 → 배수 */
  modifiers(bp: CraftBlueprint): CraftModifiers {
    const v = GameState.vitals;
    const lvBonus = craftLevelBonus(GameState.player.level ?? 1, bp.minLevel ?? 0);
    return craftModifiers(this.masteryLevel(bp.group), {
      fatigue: v.maxFatigue > 0 ? v.fatigue / v.maxFatigue : 0,
      injured: GameState.hasStatus('bleed') || GameState.hasStatus('fracture'),
      ill: GameState.hasStatus('chill') || GameState.hasStatus('cold') || GameState.hasStatus('flu'),
      drunk: false,
    }, lvBonus);
  }

  /** 성공률 (스킬 · 숙련 · 손 상태, 0.05~0.99) */
  successRate(bp: CraftBlueprint): number {
    return craftSuccessFinal(bp, GameState.skillMult('craft_success'), this.modifiers(bp));
  }

  /** 1개 시간(ms) */
  unitMs(bp: CraftBlueprint): number { return craftUnitMs(bp, this.modifiers(bp)); }

  /** 실패 시 재료 하나를 잃을 확률 */
  lossChance(bp: CraftBlueprint): number {
    return craftLossChance(bp, GameState.skillMult('craft_material'));
  }

  /** 성공 시 재료를 아낄 확률 (0~0.6) — 봉돌은 전용 스킬이 추가로 붙는다 */
  saveChance(bp: CraftBlueprint): number {
    const base = GameState.skillMult('craft_material');
    const extra = bp.group === 'sinker' ? GameState.skillMult('sinker_material') : 1;
    return materialSaveChance(base * extra);
  }

  /** 1개당 XP(처음 만드는 도면은 3배) */
  xpOf(bp: CraftBlueprint): number { return this.crafted.has(bp.id) ? bp.xp : bp.xp * 3; }

  /** 줄마다 담을 수 있는 건수(지금 1 + 인내심 예약) */
  laneCap(): number { return 1 + Math.max(0, Math.round(GameState.skillBonus('craft_batch'))); }

  laneJobs(lane: CraftLane): CraftJob[] { return this.jobs.filter((j) => j.lane === lane); }
  activeJob(lane: CraftLane): CraftJob | undefined { return this.laneJobs(lane)[0]; }
  allJobs(): readonly CraftJob[] { return this.jobs; }
  storageList(): readonly CraftStored[] { return this.storage; }

  /** 산출 1번이 들어갈 자리가 있는가 */
  private roomFor(tpl: InvItemTemplate): boolean {
    if (InventoryStore.find(tpl.id)) return true;
    return InventoryStore.freeSlotCount(tpl.category) > 0;
  }

  /**
   * 제작 가능 여부. `at` = 지금 열린 자리(맨손 창 · 작업대 창) — 작업대 도면은 작업대에서만.
   */
  check(bp: CraftBlueprint, qty = 1, at: CraftStation = bp.station): CraftCheck {
    if (!this.knows(bp.id)) {
      return { ok: false, materials: [], reason: '모르는 도면이다', maxQty: 0, locked: true };
    }
    const materials = bp.materials.map((m) => {
      const have = haveCount(m);
      const need = m.qty * qty;
      return { material: m, have, need, ok: have >= need };
    });
    const maxQty = bp.materials.length === 0 ? 0
      : Math.min(...bp.materials.map((m) => Math.floor(haveCount(m) / m.qty)));
    const lvl = GameState.player.level ?? 1;
    let reason: string | null = null;
    let locked = false;
    const tpl = craftOutputTemplate(bp.outputId);
    if (bp.minLevel && lvl < bp.minLevel) {
      locked = true;
      reason = `레벨 ${bp.minLevel} 이상`;
    } else if (!this.unlocked(bp)) {
      // ⚠ 내부 스킬 id(craft_paint 등)를 그대로 띄우지 않는다(R1)
      const req = bp.requiresSkill!;
      const name = getSkillById(req.id)?.nameKo ?? req.id;
      locked = true;
      reason = `스킬 [${name}] ${req.rank}단계 필요`;
    } else if (bp.station !== 'hand' && at === 'hand') {
      locked = true;
      reason = bp.station === 'advanced' ? '작업대에서 로드 빌딩 공구 세트로 만든다' : '작업대에서 만든다';
    } else if (bp.station === 'advanced' && !this.hasAdvancedTools()) {
      locked = true;
      reason = '로드 빌딩 공구 세트가 있어야 한다';
    } else if (!tpl) {
      reason = '산출 아이템 정의 없음 (데이터 오류)';
    } else if (materials.some((m) => !m.ok)) {
      reason = '재료가 모자라다';
    } else if (!this.roomFor(tpl)) {
      reason = '가방에 자리가 없다';
    }
    return { ok: reason === null, materials, reason, maxQty, locked };
  }

  // ── 시작 · 중지 · 취소 ───────────────────────────────
  /**
   * 제작 시작(줄 끝에 붙인다). 줄이 비어 있으면 바로 1개째 재료를 치르고 돈다.
   * @returns 실패 까닭(null = 시작함)
   */
  start(bp: CraftBlueprint, qty: number, at: CraftStation): string | null {
    const chk = this.check(bp, 1, at);
    if (!chk.ok) return chk.reason ?? '만들 수 없다';
    const lane = laneOf(bp.station);
    if (this.laneJobs(lane).length >= this.laneCap()) {
      return lane === 'hand' ? '손이 비지 않았다 — 지금 것을 마치고 하자' : '작업대가 비지 않았다';
    }
    const now = Date.now();
    const job: CraftJob = {
      id: `cj${now.toString(36)}${(this.seq++).toString(36)}`, bpId: bp.id, lane,
      qty: Math.max(1, Math.min(qty, Math.max(1, chk.maxQty))),
      done: 0, ok: 0, fail: 0, bonus: 0, good: 0, great: 0, xp: 0, lost: 0, saved: 0, stored: 0,
      unitMs: this.unitMs(bp), progressMs: 0, paid: null, stopAfterUnit: false, lastMs: now,
    };
    this.jobs.push(job);
    if (this.activeJob(lane) === job) this.payUnit(job, bp);
    GameState.markDirty();
    this.emit(null);
    return null;
  }

  /** 지금 1개 진행(0~1) */
  progressOf(job: CraftJob): number {
    return job.unitMs > 0 ? Math.min(1, job.progressMs / job.unitMs) : 0;
  }

  /** 남은 시간(ms) — 지금 것 + 남은 개수 */
  remainingMs(job: CraftJob): number {
    const left = job.stopAfterUnit ? 0 : Math.max(0, job.qty - job.done - 1);
    return Math.max(0, job.unitMs - job.progressMs) + left * job.unitMs;
  }

  /** 중지 — 지금 1개는 마저 만든다 */
  stop(jobId: string): void {
    const j = this.jobs.find((x) => x.id === jobId);
    if (!j) return;
    if (!j.paid) { this.finish(j, 'stopped'); return; }   // 예약만 된 건 바로 뺀다
    j.stopAfterUnit = true;
    GameState.markDirty();
    this.emit(null);
  }

  /** 취소 — 지금 1개를 버린다(진행에 따라 재료 전부 · 절반 · 없음을 돌려받는다) */
  cancel(jobId: string, rng: () => number = Math.random): { refunded: number; forfeited: number } {
    const j = this.jobs.find((x) => x.id === jobId);
    if (!j) return { refunded: 0, forfeited: 0 };
    let refunded = 0, forfeited = 0;
    if (j.paid) {
      const pct = craftCancelRefund(this.progressOf(j));
      for (const p of j.paid) {
        let back = 0;
        for (let k = 0; k < p.qty; k++) if (pct >= 1 || (pct > 0 && rng() < pct)) back++;
        if (back > 0) this.give(p.tpl, back);
        refunded += back;
        forfeited += p.qty - back;
      }
      j.paid = null;
    }
    this.finish(j, 'cancel', { refunded, forfeited });
    return { refunded, forfeited };
  }

  /** 보관함 → 가방(들어가는 만큼) */
  claimStorage(): number {
    let moved = 0;
    for (const s of [...this.storage]) {
      if (InventoryStore.addItem(s.tpl, s.qty)) {
        moved += s.qty;
        this.storage.splice(this.storage.indexOf(s), 1);
      }
    }
    if (moved > 0) GameState.markDirty();
    return moved;
  }

  // ── 진행 ─────────────────────────────────────────
  /**
   * 씬 update가 부른다. `handFree` = 손이 비었는가(낚시 · 손질 · 요리 중이면 false).
   * @returns 이번 틱에 끝난 건들
   */
  tick(now: number, handFree: boolean, rng: () => number = Math.random): CraftReport[] {
    const out: CraftReport[] = [];
    for (const lane of ['hand', 'bench'] as CraftLane[]) {
      let guard = 0;
      while (guard++ < 64) {
        const j = this.activeJob(lane);
        if (!j) break;
        if (!j.paid) {
          const bp = getBlueprint(j.bpId);
          if (!bp || !this.payUnit(j, bp)) { out.push(this.finish(j, 'nomat')); continue; }
        }
        let dt = Math.max(0, now - j.lastMs);
        j.lastMs = now;
        if (lane === 'hand') {
          if (!handFree || dt > 2000) dt = 0;
        } else if (dt > 60_000) {
          dt = Math.min(dt, TUNING.craft.benchOfflineCapH * 3600_000);   // 접속을 끊은 동안
        }
        j.progressMs += dt;
        const before = out.length;
        while (j.paid && j.progressMs >= j.unitMs) {
          j.progressMs -= j.unitMs;
          const r = this.completeUnit(j, rng);
          if (r) { out.push(r); break; }
        }
        if (out.length === before) break;   // 이 줄은 아직 진행 중 — 다음 줄로
        // 끝난 건이 있으면 다음 건이 바로 이어진다(같은 틱에 lastMs를 now로)
        const nx = this.activeJob(lane);
        if (nx) nx.lastMs = now;
      }
    }
    if (out.length) GameState.markDirty();
    return out;
  }

  /** 다음 1개 재료를 치른다 — 모자라면 false */
  private payUnit(j: CraftJob, bp: CraftBlueprint): boolean {
    if (bp.materials.some((m) => haveCount(m) < m.qty)) return false;
    const paid: PaidMat[] = [];
    for (const m of bp.materials) paid.push(...takeOut(m, m.qty));
    j.paid = paid;
    j.unitMs = this.unitMs(bp);
    j.progressMs = 0;
    return true;
  }

  /** 1개 완료 — 건이 끝나면 보고를 돌려준다 */
  private completeUnit(j: CraftJob, rng: () => number): CraftReport | null {
    const bp = getBlueprint(j.bpId);
    const tpl = bp ? craftOutputTemplate(bp.outputId) : null;
    const paid = j.paid ?? [];
    j.paid = null;
    if (!bp || !tpl) return this.finish(j, 'nomat');
    const success = rng() < this.successRate(bp);
    if (success) {
      // 공구 관리 — 성공해도 재료 몇 개는 아낀다(돌려받음)
      const save = this.saveChance(bp);
      for (const p of paid) {
        let back = 0;
        for (let k = 0; k < p.qty; k++) if (rng() < save) back++;
        if (back > 0) { this.give(p.tpl, back); j.saved += back; }
      }
      const q = rollCraftQuality(rng, this.modifiers(bp).qualityBonus);
      let n = bp.outputQty;
      const out: InvItemTemplate = { ...tpl };
      if (q !== 'normal') {
        if (q === 'good') j.good++; else j.great++;
        if (stackable(tpl)) { const extra = QUALITY_RANK[q]; n += extra; j.bonus += extra; }   // 덤 1 · 2개
        else out.craftQuality = q;                                                            // 장비 — 버티는 힘
      }
      this.giveCrafted(out, n, j);
      j.ok++;
      const xp = this.xpOf(bp);
      j.xp += xp;
      this.crafted.add(bp.id);
      // XP는 activityXp 경유(숙련도 · 하루 기록 · activity 이벤트 — 153차)
      GameState.addActivityXp('craft', xp / TUNING.xp.craftBase);
      StoryStore.emitActionSource('craft', 'craft-complete');
      StoryStore.emitActionOrigin(`craft:${bp.group}`);   // 235차 — 「채비를 스무 번 묶어 보인다」 = 채비 갈래 완성
    } else {
      // 실패 — 재료 하나하나를 lossChance로 잃고 나머지는 돌려받는다
      const loss = this.lossChance(bp);
      for (const p of paid) {
        let back = 0;
        for (let k = 0; k < p.qty; k++) if (rng() >= loss) back++;
        if (back > 0) this.give(p.tpl, back);
        j.lost += p.qty - back;
      }
      j.fail++;
    }
    this.mastery[bp.group] = this.masteryXp(bp.group) + craftMasteryGain(bp, success);
    GameState.applyVitalsAction('craft', 1);   // 손을 쓴다 — 피로 · 허기
    j.done++;
    if (j.stopAfterUnit) return this.finish(j, 'stopped');
    if (j.done >= j.qty) return this.finish(j, 'done');
    // 남은 진행(틱 사이 · 오프라인 몫)은 다음 1개로 넘긴다 — payUnit이 0으로 되돌리므로 보관했다가 다시 넣는다
    const carry = j.progressMs;
    if (!this.payUnit(j, bp)) return this.finish(j, 'nomat');
    j.progressMs = carry;
    return null;
  }

  /** 산출 넣기 — 가방이 차면 보관함 */
  private giveCrafted(tpl: InvItemTemplate, n: number, j: CraftJob): void {
    const ex = InventoryStore.find(tpl.id);
    if (ex && tpl.craftQuality && QUALITY_RANK[tpl.craftQuality] > QUALITY_RANK[ex.craftQuality ?? 'normal']) {
      ex.craftQuality = tpl.craftQuality;   // 같은 장비가 겹치면 더 좋은 쪽을 남긴다
    }
    if (!InventoryStore.addItem(tpl, n)) { this.stash(tpl, n); j.stored += n; }
  }

  /** 재료 돌려주기 — 가방이 차면 보관함 */
  private give(tpl: InvItemTemplate, n: number): void {
    if (!InventoryStore.addItem(tpl, n, { silent: true })) this.stash(tpl, n);
  }

  private stash(tpl: InvItemTemplate, n: number): void {
    const s = this.storage.find((x) => x.tpl.id === tpl.id);
    if (s) s.qty += n; else this.storage.push({ tpl: { ...tpl }, qty: n });
  }

  private finish(j: CraftJob, reason: CraftReport['reason'], extra: { refunded?: number; forfeited?: number } = {}): CraftReport {
    // 못 쓴 재료(시작 전 건 · 중지)는 돌려준다
    if (j.paid && reason !== 'cancel') { for (const p of j.paid) this.give(p.tpl, p.qty); j.paid = null; }
    this.jobs.splice(this.jobs.indexOf(j), 1);
    const bp = getBlueprint(j.bpId);
    const tpl = bp ? craftOutputTemplate(bp.outputId) : null;
    const r: CraftReport = {
      bpId: j.bpId, name: bp?.nameKo ?? j.bpId, outputName: tpl?.name ?? j.bpId,
      ok: j.ok, fail: j.fail, bonus: j.bonus, good: j.good, great: j.great, xp: j.xp, lost: j.lost, stored: j.stored,
      reason, ...extra,
    };
    // 다음 예약 건 — 재료를 치르고 이어 간다
    const next = this.activeJob(j.lane);
    if (next && !next.paid) {
      const nbp = getBlueprint(next.bpId);
      next.lastMs = Date.now();
      if (!nbp || !this.payUnit(next, nbp)) this.finish(next, 'nomat');
    }
    if (j.done > 0 || reason === 'cancel') {
      this.reports.push(r);
      if (this.reports.length > 8) this.reports.shift();
    }
    GameState.markDirty();
    this.emit(r);
    return r;
  }

  // ── 결과 알림 ───────────────────────────────────────
  /** 아직 안 본 결과(결과 창이 꺼내 간다) */
  takeReports(): CraftReport[] { const r = this.reports; this.reports = []; return r; }
  hasReports(): boolean { return this.reports.length > 0; }

  onChange(fn: (r: CraftReport | null) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(r: CraftReport | null): void { for (const f of this.listeners) f(r); }

  // ── 세이브 ───────────────────────────────────────────
  serialize(): CraftingSaveState {
    return {
      jobs: this.jobs.map((j) => ({ ...j, paid: j.paid ? j.paid.map((p) => ({ tpl: { ...p.tpl }, qty: p.qty })) : null })),
      storage: this.storage.map((s) => ({ tpl: { ...s.tpl }, qty: s.qty })),
      reports: [...this.reports],
      mastery: { ...this.mastery },
      crafted: [...this.crafted],
      known: [...this.known],
    };
  }

  deserialize(s: CraftingSaveState | undefined): void {
    this.jobs = (s?.jobs ?? []).filter((j) => !!getBlueprint(j.bpId));
    this.storage = s?.storage ?? [];
    this.reports = s?.reports ?? [];
    this.mastery = s?.mastery ?? {};
    this.crafted = new Set(s?.crafted ?? []);
    // 223차 — 구세이브는 known이 없다(처음부터 아는 도면만 쓰던 때라 잃는 것 없음)
    this.known = new Set((s?.known ?? []).filter((id) => !!getBlueprint(id)?.learn));
  }

  resetAll(): void {
    this.jobs = []; this.storage = []; this.reports = []; this.mastery = {}; this.crafted = new Set(); this.known = new Set();
  }
}

export const CraftingStore = new CraftingStoreManager();

// dev 검증용 전역 — 하네스가 게임과 같은 인스턴스를 쓰게(verify-render 스킬)
if (import.meta.env.DEV) (globalThis as unknown as { __CRAFT?: unknown }).__CRAFT = CraftingStore;
