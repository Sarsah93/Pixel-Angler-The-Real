/**
 * @file CraftingStore.ts
 * @description 제작 판정·소비·지급 엔진 (129차 P7)
 *
 * core `CRAFT_BLUEPRINTS`(무엇을 먹고 무엇이 나오는가) + `CraftOutputs`(산출 템플릿) 사이를 잇는다.
 * 성공률·재료 절약은 전부 스킬 효과 키로 읽는다 — **하드코딩 배수 금지**(§3 규칙).
 *
 * ⚠ 스킬 효과 모드 함정: `craft_success`·`craft_material`·`medic_quality` 는 **mult 모드**라
 *   `skillMult` 로 읽는다. add 모드 키(`craft_batch` 등)를 skillMult 로 읽으면 조용히 1이 나온다.
 */

import {
  CRAFT_BLUEPRINTS, craftSuccessRate, materialSaveChance, TUNING, activityXp, getSkillById,
  type CraftBlueprint, type CraftMaterial, type CraftStation,
} from '@tra/core';
import { InventoryStore, type InvItem } from './InventoryStore.js';
import { GameState } from './GameState.js';
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
  /** 잠금 사유 (스킬 미달·산출 템플릿 없음·인벤 공간 부족) */
  reason: string | null;
  /** 현재 재료로 만들 수 있는 최대 횟수 */
  maxQty: number;
}

/** 제작 실행 결과 */
export interface CraftResult {
  attempted: number;
  succeeded: number;
  failed: number;
  /** 실패분에서 아낀 재료 수(연출·안내용) */
  savedMaterials: number;
  outputName: string;
  outputQty: number;
  /** 산출을 인벤에 못 넣은 횟수 (칸 부족) */
  dropped: number;
}

/** 인벤토리 아이템이 이 재료에 해당하는가 (itemId | speciesId | byproductKind) */
function matches(i: InvItem, m: CraftMaterial): boolean {
  if (m.itemId) return i.id === m.itemId;
  if (m.speciesId) return i.speciesId === m.speciesId;
  if (m.byproductKind) return i.byproductKind === m.byproductKind;
  return false;
}

function haveCount(m: CraftMaterial): number {
  return InventoryStore.items
    .filter((i) => matches(i, m))
    .reduce((a, i) => a + i.qty, 0);
}

/** 재료 1종을 qty개 소비 — 여러 인스턴스에 걸쳐 차감한다 */
function consume(m: CraftMaterial, qty: number): void {
  let left = qty;
  // 스택이 작은 것부터 털어 인벤 칸을 먼저 비운다
  const pool = InventoryStore.items.filter((i) => matches(i, m)).sort((a, b) => a.qty - b.qty);
  for (const i of pool) {
    if (left <= 0) break;
    const take = Math.min(i.qty, left);
    InventoryStore.removeQty(i.id, take);
    left -= take;
  }
}

class CraftingStoreManager {
  /** 위치별 도면 목록 (잠긴 것도 포함 — 목록에는 보이고 실행만 막힌다) */
  blueprints(station: CraftStation): CraftBlueprint[] {
    return CRAFT_BLUEPRINTS.filter((b) => b.station === station);
  }

  /** 도면이 스킬 조건을 만족하는가 */
  unlocked(bp: CraftBlueprint): boolean {
    if (!bp.requiresSkill) return true;
    return GameState.skillRank(bp.requiresSkill.id) >= bp.requiresSkill.rank;
  }

  /** 성공률 (스킬 반영, 0~0.99) */
  successRate(bp: CraftBlueprint): number {
    return craftSuccessRate(bp, GameState.skillMult('craft_success'));
  }

  /** 재료 절약 확률 (0~0.6) — 봉돌은 전용 스킬이 추가로 붙는다 */
  saveChance(bp: CraftBlueprint): number {
    const base = GameState.skillMult('craft_material');
    const extra = bp.group === 'sinker' ? GameState.skillMult('sinker_material') : 1;
    return materialSaveChance(base * extra);
  }

  check(bp: CraftBlueprint, qty = 1): CraftCheck {
    const materials = bp.materials.map((m) => {
      const have = haveCount(m);
      const need = m.qty * qty;
      return { material: m, have, need, ok: have >= need };
    });
    const maxQty = bp.materials.length === 0 ? 0
      : Math.min(...bp.materials.map((m) => Math.floor(haveCount(m) / m.qty)));
    let reason: string | null = null;
    if (!this.unlocked(bp)) {
      // ⚠ 내부 스킬 id(craft_paint 등)를 그대로 띄우지 않는다 — 유저가 해석해야 하는 UI는 금지(§4).
      const req = bp.requiresSkill!;
      const name = getSkillById(req.id)?.nameKo ?? req.id;
      reason = `스킬 잠김 — [${name}] ${req.rank}랭크 필요`;
    } else if (!craftOutputTemplate(bp.outputId)) {
      reason = '산출 아이템 정의 없음 (데이터 오류)';
    } else if (materials.some((m) => !m.ok)) {
      reason = '재료 부족';
    }
    return { ok: reason === null, materials, reason, maxQty };
  }

  /**
   * 제작 실행. 1회씩 성공 롤 → 성공이면 산출 지급, 실패면 재료 일부만 소모
   * (`TUNING.craft.failMaterialPct`). 재료 절약은 **소모하지 않을 확률**로 모델링한다 —
   * 소수점 재료가 생기지 않게 하기 위해서다.
   */
  craft(bp: CraftBlueprint, qty = 1, rng: () => number = Math.random): CraftResult {
    const tpl = craftOutputTemplate(bp.outputId);
    const out: CraftResult = {
      attempted: 0, succeeded: 0, failed: 0, savedMaterials: 0,
      outputName: tpl?.name ?? bp.outputId, outputQty: 0, dropped: 0,
    };
    if (!tpl) return out;
    const rate = this.successRate(bp);
    const save = this.saveChance(bp);
    const failPct = TUNING.craft.failMaterialPct;

    for (let n = 0; n < qty; n++) {
      if (!this.check(bp, 1).ok) break;
      out.attempted++;
      const success = rng() < rate;
      // 재료 소모 — 실패 시 일부만. 절약 스킬은 항목별 롤.
      for (const m of bp.materials) {
        const base = success ? m.qty : Math.ceil(m.qty * failPct);
        let use = 0;
        for (let k = 0; k < base; k++) {
          if (rng() < save) out.savedMaterials++;
          else use++;
        }
        if (use > 0) consume(m, use);
      }
      if (success) {
        out.succeeded++;
        if (InventoryStore.addItem({ ...tpl }, bp.outputQty)) out.outputQty += bp.outputQty;
        else out.dropped++;
        // XP는 반드시 activityXp → grantXp 경유 (124차 규칙). 도면의 xp는 **난이도 가중**이라
        // craftBase(15) 기준으로 환산한다 — F8 슬라이더 하나로 제작 XP 전체가 같이 움직인다.
        GameState.grantXp(activityXp('craft', bp.xp / TUNING.xp.craftBase));
      } else {
        out.failed++;
      }
    }
    // 제작은 몸을 쓴다 — 행동 비용(§4-2 costCraft)은 시도 횟수에 비례
    if (out.attempted > 0) GameState.applyVitalsAction('craft', out.attempted);
    return out;
  }
}

export const CraftingStore = new CraftingStoreManager();
