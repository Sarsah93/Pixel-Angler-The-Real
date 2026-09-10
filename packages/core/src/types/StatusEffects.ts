/**
 * @file StatusEffects.ts
 * @description 상태이상 11종 — 정의·진행 체인·틱 판정 (125차 — PROGRESSION_SURVIVAL_SPEC v2 §5)
 *
 * 시간 단위는 전부 **활동 시간**(Vitals와 동일 규약 — 오프라인·일시정지 중 정지).
 * 이 모듈은 순수 계산만 하고 보관·직렬화는 client `GameState.statuses`가 맡는다.
 * 기절(faint)·사망은 FSM(§6, P4)이 소비하므로 여기서는 **부여/해제 대상 상태**로만 정의한다.
 */

import { TUNING } from '../config/tuning.js';

/** 상태이상 식별자 (11종) */
export type StatusEffectId =
  | 'food_poison' | 'bio_poison' | 'diarrhea' | 'bleed' | 'fracture'
  | 'chill' | 'cold' | 'flu' | 'fever' | 'exhaust' | 'faint';

/** 치료 수단 — UI 안내·아이템 게이트가 소비 */
export type StatusCure = 'self' | 'medicine' | 'bandage' | 'splint' | 'warmth' | 'hospital' | 'rest';

/** 상태이상 정의 (데이터 — 효과는 `aggregateStatus`가 합산) */
export interface StatusEffectDef {
  id: StatusEffectId;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  /**
   * 상태 패널 아이콘 스트립 배지 — 통일된 칩 프레임 + **16x16 손그림 픽셀 아이콘**.
   * 이모지·특수문자·텍스트 약어를 쓰지 않는다(AGENTS §4).
   */
  badge: StatusBadge;
  /** 지속 HP 감소(활동 1분당) */
  hpPerMin?: number;
  /** 추가 수분 소모(활동 1시간당 %) */
  hydrationPerHour?: number;
  /** 소모 배율 [허기, 수분, 피로] */
  drainMult?: readonly [number, number, number];
  /** 최대 HP 절대 감소 */
  maxHpDelta?: number;
  /** 최대 HP 비율 감소 (0.1 = −10%) */
  maxHpPct?: number;
  /** 최대 피로도 감소 (= 기절이 더 빨리 온다) */
  maxFatigueDelta?: number;
  /** 이동 속도 배율 */
  moveMult?: number;
  /** 자전거 탑승 불가 */
  noBike?: boolean;
  /** 치료 수단 */
  cure: StatusCure;
  /** 자연치유 소요(활동 분) — 없으면 자연치유 없음 */
  selfHealMin?: number;
  /** 방치 시 진행(악화)되는 상태 */
  progressTo?: StatusEffectId;
  /** 진행 시 동반 발생하는 파생 상태 */
  spawns?: StatusEffectId;
  /** 치료 후 재발 확률 */
  relapseChance?: number;
}

/** 상태 배지 — 색 칩 + 짧은 라벨(이모지 대신) */
export interface StatusBadge {
  /**
   * 픽셀 아이콘 키 — 아트는 `tools/gen_pixel_icons.py`가 굽는
   * `client-pc/src/data/PixelIconArt.ts`에 있고, 키는 상태이상 id와 1:1이다.
   * 텍스트 약어를 쓰지 않는 이유는 §4 참조(약어는 유저가 해석해야 한다).
   */
  icon: StatusEffectId;
  /** 칩 테두리·강조색 (0xRRGGBB) */
  color: number;
}

/** 11종 정의표 (§5-1) */
export const STATUS_EFFECTS: readonly StatusEffectDef[] = [
  {
    id: 'food_poison', nameKo: '식중독', nameEn: 'Food Poisoning', badge: { icon: 'food_poison', color: 0x8fbf4a },
    descKo: '상한 음식이나 낮은 위생 탓에 배탈이 났다. 체력이 서서히 줄고 설사를 동반할 수 있다.',
    descEn: 'Spoiled food or poor hygiene. HP drains slowly and may bring on diarrhea.',
    hpPerMin: 0.5, cure: 'self', selfHealMin: 90, progressTo: 'fever', spawns: 'diarrhea',
  },
  {
    id: 'bio_poison', nameKo: '생물중독', nameEn: 'Marine Envenomation', badge: { icon: 'bio_poison', color: 0xa15fd0 },
    descKo: '독성 생물에 쏘였다. 체력이 빠르게 줄고, 방치하면 이상고열로 악화된다.',
    descEn: 'Stung by a venomous creature. HP drains fast and worsens into high fever if untreated.',
    hpPerMin: 1, cure: 'medicine', progressTo: 'fever',
  },
  {
    id: 'diarrhea', nameKo: '설사', nameEn: 'Diarrhea', badge: { icon: 'diarrhea', color: 0x9a7a45 },
    descKo: '식중독에서 파생됐다. 수분이 빠르게 빠지고 이동이 간헐적으로 멈춘다.',
    descEn: 'Follows food poisoning. Hydration drops fast and movement halts intermittently.',
    hydrationPerHour: 24, cure: 'self',
  },
  {
    id: 'bleed', nameKo: '출혈', nameEn: 'Bleeding', badge: { icon: 'bleed', color: 0xd23b3b },
    descKo: '손질 실수나 갯바위 미끄러짐으로 다쳤다. 붕대로 지혈해야 한다.',
    descEn: 'Cut from a knife slip or a fall on the rocks. Needs a bandage.',
    hpPerMin: 1.5, cure: 'bandage', relapseChance: 0.3,
  },
  {
    id: 'fracture', nameKo: '골절', nameEn: 'Fracture', badge: { icon: 'fracture', color: 0xcfc7b4 },
    descKo: '낙상·테트라포드 미끄러짐으로 뼈를 다쳤다. 걷기가 느려지고 자전거를 탈 수 없다.',
    descEn: 'A fall on the tetrapods broke a bone. Slower on foot and no cycling.',
    moveMult: 0.7, noBike: true, maxFatigueDelta: 10, cure: 'splint', relapseChance: 0.25,
  },
  {
    id: 'chill', nameKo: '오한', nameEn: 'Chills', badge: { icon: 'chill', color: 0x8ccbe8 },
    descKo: '저온·비·젖은 옷 탓에 몸이 떨린다. 따뜻한 음식으로 풀리며, 방치하면 감기가 된다.',
    descEn: 'Cold, rain or wet clothes. Warm food clears it; left alone it becomes a cold.',
    drainMult: [1, 1, 1.2], cure: 'warmth', progressTo: 'cold',
  },
  {
    id: 'cold', nameKo: '감기', nameEn: 'Common Cold', badge: { icon: 'cold', color: 0x4d92cf },
    descKo: '오한이 심해졌다. 최대 체력과 최대 피로도가 줄어든다. 휴식과 상비약이 필요하다.',
    descEn: 'The chills got worse. Max HP and max fatigue drop. Needs rest and medicine.',
    maxHpPct: 0.1, maxFatigueDelta: 15, cure: 'rest', selfHealMin: 180, progressTo: 'flu',
  },
  {
    id: 'flu', nameKo: '독감', nameEn: 'Influenza', badge: { icon: 'flu', color: 0x3f6fae },
    descKo: '감기가 독감으로 번졌다. 허기·수분 소모가 크게 늘고 병원 진료가 필요하다.',
    descEn: 'The cold turned into flu. Hunger and thirst drain much faster; see a doctor.',
    maxHpPct: 0.1, maxFatigueDelta: 15, drainMult: [1.4, 1.4, 1], cure: 'hospital',
  },
  {
    id: 'fever', nameKo: '이상고열', nameEn: 'High Fever', badge: { icon: 'fever', color: 0xe8722c },
    descKo: '중독이 심해져 열이 오른다. 체력·허기·수분이 급격히 떨어진다. 병원 진료가 필요하다.',
    descEn: 'The poisoning spiked a fever. HP, hunger and hydration plunge. Hospital required.',
    hpPerMin: 1.5, drainMult: [1.6, 1.6, 1.2], cure: 'hospital',
  },
  {
    id: 'exhaust', nameKo: '탈진', nameEn: 'Exhaustion', badge: { icon: 'exhaust', color: 0x9a9a9a },
    descKo: '허기·수분이 바닥났거나 기절에서 깨어난 후유증. 먹고 마시고 쉬면 서서히 풀린다.',
    descEn: 'Ran out of food and water, or the aftermath of fainting. Eat, drink and rest to recover.',
    maxHpDelta: 10, drainMult: [1.5, 1.5, 1], cure: 'rest',
  },
  {
    id: 'faint', nameKo: '기절', nameEn: 'Fainted', badge: { icon: 'faint', color: 0x6a5a8a },
    descKo: '피로도가 한계에 도달했다. 그 자리에 쓰러진다.',
    descEn: 'Fatigue hit its limit. You collapse where you stand.',
    cure: 'rest',
  },
];

const BY_ID = new Map<StatusEffectId, StatusEffectDef>(STATUS_EFFECTS.map((d) => [d.id, d]));

/** 정의 조회 */
export function getStatusEffect(id: StatusEffectId): StatusEffectDef | undefined {
  return BY_ID.get(id);
}

/** 치료 수단 라벨 (Ko/En — 상태 스트립 툴팁이 소비) */
export const STATUS_CURE_LABEL: Record<StatusCure, { ko: string; en: string }> = {
  self: { ko: '시간이 지나면 낫는다', en: 'Heals over time' },
  medicine: { ko: '해독제 필요', en: 'Needs antidote' },
  bandage: { ko: '붕대 필요', en: 'Needs a bandage' },
  splint: { ko: '부목 필요', en: 'Needs a splint' },
  warmth: { ko: '따뜻한 음식 필요', en: 'Needs warm food' },
  hospital: { ko: '병원 진료 필요', en: 'Needs hospital care' },
  rest: { ko: '휴식 필요', en: 'Needs rest' },
};

/**
 * 자연치유까지 남은 **활동 시간**(ms). 자연치유가 없는 상태는 `null`
 * (그런 상태는 치료 수단을 대신 표기한다).
 */
export function statusRemainMs(a: ActiveStatus): number | null {
  const d = BY_ID.get(a.id);
  if (!d?.selfHealMin) return null;
  return Math.max(0, d.selfHealMin * 60_000 - a.elapsedMs);
}

/** 진행 중인 상태이상 인스턴스 (client가 보관·직렬화) */
export interface ActiveStatus {
  id: StatusEffectId;
  /** 발현 후 누적 활동 시간(ms) */
  elapsedMs: number;
  /** 진행(악화) 판정 누적 타이머(ms) — progressRollMin 마다 롤 */
  rollMs: number;
}

/** 여러 상태이상의 효과 합산 결과 */
export interface StatusModifiers {
  hpPerMin: number;
  hydrationPerHour: number;
  /** 소모 배율 [허기, 수분, 피로] */
  drainMult: [number, number, number];
  maxHpDelta: number;
  maxHpPct: number;
  maxFatigueDelta: number;
  moveMult: number;
  noBike: boolean;
}

/** 활성 상태이상 목록 → 합산 효과 (배율은 곱, 감소는 합) */
export function aggregateStatus(active: readonly ActiveStatus[]): StatusModifiers {
  const m: StatusModifiers = {
    hpPerMin: 0, hydrationPerHour: 0, drainMult: [1, 1, 1],
    maxHpDelta: 0, maxHpPct: 0, maxFatigueDelta: 0, moveMult: 1, noBike: false,
  };
  for (const a of active) {
    const d = BY_ID.get(a.id);
    if (!d) continue;
    m.hpPerMin += d.hpPerMin ?? 0;
    m.hydrationPerHour += d.hydrationPerHour ?? 0;
    if (d.drainMult) {
      m.drainMult[0] *= d.drainMult[0];
      m.drainMult[1] *= d.drainMult[1];
      m.drainMult[2] *= d.drainMult[2];
    }
    m.maxHpDelta += d.maxHpDelta ?? 0;
    m.maxHpPct += d.maxHpPct ?? 0;
    m.maxFatigueDelta += d.maxFatigueDelta ?? 0;
    if (d.moveMult !== undefined) m.moveMult *= d.moveMult;
    if (d.noBike) m.noBike = true;
  }
  return m;
}

/** `tickStatuses` 결과 — 호출측이 HP 차감·토스트·연출에 쓴다 */
export interface StatusTickResult {
  /** 이번 틱의 지속 HP 감소량 */
  hpLoss: number;
  /** 이번 틱에 새로 발현된 상태(진행·파생) */
  added: StatusEffectId[];
  /** 이번 틱에 자연치유로 해제된 상태 */
  removed: StatusEffectId[];
}

/** 난수 주입 — 테스트에서 결정적 시퀀스로 대체 */
export type Rng = () => number;

/**
 * 활동 시간 경과에 따른 상태이상 진행. 배열은 **제자리 수정**된다.
 * - 진행 체인: `progressRollMin` 마다 `progressChance` 로 롤 → `progressTo`로 악화(원 상태는 해제).
 * - 자연치유: `selfHealMin` 경과 시 해제(치료 수단이 self 인 것만 자동, 그 외는 UI 치료 필요).
 * - 면역 스킬 등은 `chanceMult`로 진행 확률을 낮춘다(P5 배선).
 */
export function tickStatuses(
  active: ActiveStatus[],
  dtMs: number,
  opts: { rng?: Rng; chanceMult?: number } = {},
): StatusTickResult {
  const out: StatusTickResult = { hpLoss: 0, added: [], removed: [] };
  if (!(dtMs > 0) || active.length === 0) return out;
  const rng = opts.rng ?? Math.random;
  const chanceMult = opts.chanceMult ?? 1;
  const t = TUNING.status;
  const minutes = dtMs / 60_000;

  for (let i = active.length - 1; i >= 0; i--) {
    const a = active[i];
    const d = BY_ID.get(a.id);
    if (!d) { active.splice(i, 1); continue; }
    a.elapsedMs += dtMs;
    out.hpLoss += (d.hpPerMin ?? 0) * minutes;

    // 진행(악화) 롤
    if (d.progressTo) {
      a.rollMs += dtMs;
      const period = t.progressRollMin * 60_000;
      while (a.rollMs >= period) {
        a.rollMs -= period;
        if (rng() < t.progressChance * chanceMult) {
          const next = d.progressTo;
          if (!active.some((x) => x.id === next)) {
            active.push({ id: next, elapsedMs: 0, rollMs: 0 });
            out.added.push(next);
          }
          active.splice(i, 1);
          out.removed.push(d.id);
          break;
        }
      }
      if (!active[i] || active[i].id !== d.id) continue;   // 위에서 제거됨
    }

    // 자연치유 (cure === 'self' 인 것만 자동 해제)
    const healMin = d.selfHealMin ?? (d.cure === 'self' ? t.selfHealMin : undefined);
    if (d.cure === 'self' && healMin !== undefined && a.elapsedMs >= healMin * 60_000) {
      active.splice(i, 1);
      out.removed.push(d.id);
      // 파생 상태(설사 등)도 함께 소멸
      if (d.spawns) {
        const si = active.findIndex((x) => x.id === d.spawns);
        if (si >= 0) { active.splice(si, 1); out.removed.push(d.spawns); }
      }
    }
  }
  return out;
}

/** 상태이상 부여 (중복이면 무시하고 false) */
export function addStatus(active: ActiveStatus[], id: StatusEffectId): boolean {
  if (active.some((a) => a.id === id)) return false;
  active.push({ id, elapsedMs: 0, rollMs: 0 });
  return true;
}

/**
 * 치료로 해제. 재발 확률이 있는 상태(출혈·골절)는 `relapse`가 true로 돌아온다 —
 * 호출측이 그 신호로 잠시 뒤 다시 부여한다(§5-1).
 */
export function cureStatus(
  active: ActiveStatus[], id: StatusEffectId, rng: Rng = Math.random,
): { removed: boolean; relapse: boolean } {
  const i = active.findIndex((a) => a.id === id);
  if (i < 0) return { removed: false, relapse: false };
  const d = BY_ID.get(id);
  active.splice(i, 1);
  if (d?.spawns) {
    const si = active.findIndex((x) => x.id === d.spawns);
    if (si >= 0) active.splice(si, 1);
  }
  // 재발 확률은 tuning 단일 소스 (정의표 값은 기본값 표기용)
  const chance = id === 'bleed' ? TUNING.status.relapseBleed
    : id === 'fracture' ? TUNING.status.relapseFracture
    : (d?.relapseChance ?? 0);
  return { removed: true, relapse: chance > 0 && rng() < chance };
}
