/**
 * @file ForageMinigame.ts
 * @description 224차 — 채집 손놀림 놀이(사용자 지시 「조금 어려운 정도 · 순발력과 예측력」).
 *
 * 사는 모양마다 한 가지 놀이를 한다 — 판정은 전부 여기(순수 함수 · 시드 난수), 씬은 그리기와 입력만.
 *
 *  - 덮치기(snatch · 달아나는 게 · 갯강구) — 손을 옮겨 두었다가 눌러 덮친다. 손이 내려가는 데 시간이 걸리므로
 *    **지금 자리가 아니라 내려갈 때의 자리**를 노려야 한다(예측). 생물은 멈칫(예고) → 튀어 나가기를 되풀이하고,
 *    가끔은 멈칫만 하고 안 간다(속임). 손을 빨리 들이대면 놀라서 바위 틈(양 끝)으로 도망친다.
 *  - 줍기(pick · 느린 생물) — 덮치기와 같지만 느리고 도망칠 틈이 없다. 성게 · 소라는 맨손이면 다칠 수 있다.
 *  - 떼기(pry · 붙은 생물) — 오가는 바늘이 초록 칸에 들 때 누른다. 놓치면 꽉 붙어 칸이 좁아지고 빨라진다(순발력).
 *    삿갓조개는 한 번 놓치면 거의 못 뗀다.
 *  - 파기(dig · 묻힌 생물) — 누르고 있으면 판다. 오래 파면 「소란」이 차고, 소란이 크면 지렁이가 더 깊이 숨는다.
 *    조용히 기다리면 조금씩 올라온다 — 파고 쉬는 박자를 읽는다(예측).
 *  - 당기기(pull · 문어) — 누르고 있으면 끌어낸다. 줄(긴장)이 알맞은 동안만 나온다. 문어가 몸을 부풀리면(예고)
 *    곧 버틴다 — 그때 놓아야 한다. 계속 당기면 다리가 끊기고 먹물을 쏘며 달아난다(순발력).
 *
 * 놓치면(lost) 그 생물은 사라진다(사용자 지시 — 씬이 스팟을 지운다).
 */

import type { ShoreCreature } from '../db-schema/ShoreCreatureDatabase.js';
import type { ForageGameKind, ForageTool } from '../types/Foraging.js';
import { forageGameKindOf } from './ForagingEngine.js';

/** 매 프레임 입력 */
export interface ForageGameInput {
  /** 손 · 조준 위치(0~1 — 놀이 판 가로) */
  aimX: number;
  /** 이번 프레임에 막 눌렀다 */
  press: boolean;
  /** 누르고 있다 */
  hold: boolean;
}

export type ForageGameLoss = 'escaped' | 'clamped' | 'deeper' | 'torn' | 'timeout';

/** 덮치기 · 줍기 상태 */
export interface SnatchState {
  /** 생물 위치 0~1 */
  x: number;
  /** 손 위치 0~1 */
  handX: number;
  phase: 'idle' | 'tell' | 'dash' | 'bolt';
  /** 현재 단계 남은 시간(ms) */
  phaseMs: number;
  /** 예고 · 튀는 방향 */
  dir: -1 | 1;
  /** 튀어 갈 목표 */
  targetX: number;
  /** 놀람 0~1 — 1이면 바위 틈으로 도망 */
  alarm: number;
  /** 덮치는 중 남은 시간(ms) — 0 = 손을 들고 있다 */
  strikeMs: number;
  strikeTotalMs: number;
  misses: number;
  /** 잡히는 반경(판 비율) */
  catchR: number;
  /** 도망칠 틈이 있는가(줍기는 없다) */
  holes: boolean;
}

/** 떼기 상태 */
export interface PryState {
  needle: number;
  needleDir: -1 | 1;
  /** 바늘 속도(판/초) */
  speed: number;
  zoneC: number;
  zoneW: number;
  hits: number;
  need: number;
  misses: number;
  /** 방금 판정(그림용) — 'hit' | 'miss' 표시 남은 ms */
  flash: { kind: 'hit' | 'miss'; ms: number } | null;
}

/** 파기 상태 */
export interface DigState {
  /** 판 깊이 0~1 */
  depth: number;
  /** 생물 깊이 0~1 (1 = 손이 안 닿는다) */
  prey: number;
  /** 소란 0~1 */
  noise: number;
  /** 조용히 있은 시간(ms) */
  quietMs: number;
  digRate: number;
  noiseRate: number;
  /** 이 녀석이 놀라기 시작하는 소란(판마다 다르다 — 겉으론 안 보이고 움찔거림으로 읽는다) */
  calm: number;
  /** 지금 움찔(더 깊이 숨는 중) — 그림용 */
  flinch: boolean;
}

/** 당기기 상태 */
export interface PullState {
  tension: number;
  progress: number;
  phase: 'calm' | 'tell' | 'surge';
  phaseMs: number;
  pullMult: number;
}

export interface ForageGameState {
  kind: ForageGameKind;
  creatureId: string;
  tool: ForageTool;
  /** 지난 시간(ms) */
  t: number;
  /** 제한 시간(ms) */
  limitMs: number;
  status: 'play' | 'won' | 'lost';
  lost?: ForageGameLoss;
  snatch?: SnatchState;
  pry?: PryState;
  dig?: DigState;
  pull?: PullState;
}

/** 수치 — 「조금 어려운」 기준(집중하면 7할 남짓) */
export const FORAGE_GAME = {
  snatch: {
    handSpeed: 1.9,            // 판/초
    strikeMs: { hand: 300, tongs: 240, net: 190, gaff: 260, rake: 300 } as Record<ForageTool, number>,
    catchR: { hand: 0.042, tongs: 0.055, net: 0.08, gaff: 0.048, rake: 0.04 } as Record<ForageTool, number>,
    idleMs: [380, 1050] as [number, number],
    tellMs: [200, 380] as [number, number],
    dashSpeed: [1.3, 3.0] as [number, number],   // agility 0 → 1
    dashDist: [0.16, 0.42] as [number, number],
    feint: 0.3,
    nearR: 0.13,               // 손이 이만큼 가까이 빠르게 오면 놀란다
    nearSpeed: 0.9,
    alarmPerMiss: 0.45,
    maxMisses: 3,
    limitMs: 11_000,
  },
  pry: {
    speed: 1.15,
    zoneW: { hand: 0.11, tongs: 0.15, net: 0.1, gaff: 0.14, rake: 0.1 } as Record<ForageTool, number>,
    missShrink: 0.65,
    hardShrink: 0.35,
    missSpeedUp: 1.15,
    hitSpeedUp: 1.06,
    minZoneW: 0.045,
    maxMisses: 3,
    limitMs: 12_000,
  },
  dig: {
    digRate: { hand: 0.065, rake: 0.11, tongs: 0.06, net: 0.04, gaff: 0.07 } as Record<ForageTool, number>,
    noiseRate: { hand: 0.3, rake: 0.42, tongs: 0.3, net: 0.3, gaff: 0.36 } as Record<ForageTool, number>,
    noiseDecay: 0.55,
    calmRange: [0.42, 0.72] as [number, number],
    retreatK: 1.1,
    boltRate: 0.22,
    creepAfterMs: 900,
    creepRate: 0.025,
    startDepth: [0.26, 0.42] as [number, number],
    /** 쉬는 동안 판 구멍이 무너져 메워지는 빠르기 */
    refill: 0.035,
    limitMs: 13_000,
  },
  pull: {
    rise: 0.62, fall: 0.8, surgeRise: 2.0,
    windowLo: 0.3, windowHi: 0.85,
    gain: 0.21, slack: 0.03, surgeLoss: 0.05,
    calmMs: [1100, 2400] as [number, number],
    tellMs: 380, surgeMs: 800,
    pullMult: { gaff: 1.25, tongs: 1.0, net: 0.8, hand: 0.85, rake: 0.8 } as Record<ForageTool, number>,
    limitMs: 18_000,
  },
} as const;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const between = (r: [number, number], rng: () => number): number => lerp(r[0], r[1], rng());

/** 기본 빠르기(덮치기 · 줍기) */
function agilityOf(c: ShoreCreature, kind: ForageGameKind): number {
  if (c.agility !== undefined) return clamp01(c.agility);
  return kind === 'pick' ? 0.15 : 0.6;
}

/**
 * 새 판. `dex`는 손재주 보정 0~1(스킬 · 레벨 — 칸을 넓히고 손을 빠르게).
 */
export function createForageGame(c: ShoreCreature, tool: ForageTool, rng: () => number, dex = 0): ForageGameState {
  const kind = forageGameKindOf(c);
  const d = clamp01(dex);
  const base: ForageGameState = { kind, creatureId: c.id, tool, t: 0, limitMs: 10_000, status: 'play' };
  if (kind === 'snatch' || kind === 'pick') {
    const S = FORAGE_GAME.snatch;
    const pick = kind === 'pick';
    base.limitMs = pick ? S.limitMs + 4000 : S.limitMs;
    const x = lerp(0.3, 0.7, rng());
    base.snatch = {
      x, handX: x < 0.5 ? 0.85 : 0.15, phase: 'idle', phaseMs: between(S.idleMs, rng), dir: 1, targetX: x,
      alarm: 0, strikeMs: 0, strikeTotalMs: S.strikeMs[tool], misses: 0,
      catchR: S.catchR[tool] * (1 + d * 0.45),
      holes: !pick,
    };
  } else if (kind === 'pry') {
    const P = FORAGE_GAME.pry;
    base.limitMs = P.limitMs;
    base.pry = {
      needle: 0, needleDir: 1, speed: P.speed * (c.clampsHard ? 1.15 : 1),
      zoneC: lerp(0.25, 0.75, rng()), zoneW: P.zoneW[tool] * (1 + d * 0.4),
      hits: 0, need: Math.max(1, c.pryHits ?? 2), misses: 0, flash: null,
    };
  } else if (kind === 'dig') {
    const G = FORAGE_GAME.dig;
    base.limitMs = G.limitMs;
    base.dig = {
      depth: 0, prey: between(G.startDepth, rng), noise: 0, quietMs: 0,
      digRate: G.digRate[tool] * (1 + d * 0.3), noiseRate: G.noiseRate[tool],
      calm: between(G.calmRange, rng), flinch: false,
    };
  } else {
    const L = FORAGE_GAME.pull;
    base.limitMs = L.limitMs;
    base.pull = { tension: 0, progress: 0.2, phase: 'calm', phaseMs: between(L.calmMs, rng), pullMult: L.pullMult[tool] * (1 + d * 0.25) };
  }
  return base;
}

function lose(s: ForageGameState, why: ForageGameLoss): ForageGameState {
  s.status = 'lost';
  s.lost = why;
  return s;
}

/** 한 프레임 진행(상태를 고쳐서 돌려준다). 끝난 판은 그대로 */
export function stepForageGame(s: ForageGameState, input: ForageGameInput, dtMs: number, rng: () => number, c?: ShoreCreature): ForageGameState {
  if (s.status !== 'play') return s;
  const dt = Math.max(0, Math.min(100, dtMs));
  const sec = dt / 1000;
  s.t += dt;
  if (s.snatch) return stepSnatch(s, s.snatch, input, dt, sec, rng, c);
  if (s.pry) return stepPry(s, s.pry, input, sec, rng, c);
  if (s.dig) return stepDig(s, s.dig, input, dt, sec);
  if (s.pull) return stepPull(s, s.pull, input, dt, sec, rng);
  return s;
}

function stepSnatch(s: ForageGameState, n: SnatchState, input: ForageGameInput, dt: number, sec: number, rng: () => number, c?: ShoreCreature): ForageGameState {
  const S = FORAGE_GAME.snatch;
  const agi = c ? agilityOf(c, s.kind) : (s.kind === 'pick' ? 0.15 : 0.6);
  // 손 — 덮치는 중엔 움직이지 않는다
  const prevHand = n.handX;
  if (n.strikeMs <= 0) {
    const step = S.handSpeed * sec;
    const want = clamp01(input.aimX);
    n.handX = Math.abs(want - n.handX) <= step ? want : n.handX + Math.sign(want - n.handX) * step;
  }
  const handSpeed = sec > 0 ? Math.abs(n.handX - prevHand) / sec : 0;
  // 놀람 — 손을 빠르게 바짝 들이댔다
  if (n.holes && Math.abs(n.handX - n.x) < S.nearR && handSpeed > S.nearSpeed) n.alarm = Math.min(1, n.alarm + sec * 1.6);
  if (n.holes && n.alarm >= 1 && n.phase !== 'bolt') {
    n.phase = 'bolt';
    n.dir = n.x < n.handX ? -1 : 1;
    n.targetX = n.dir < 0 ? 0 : 1;
  }
  if (n.holes && s.t >= s.limitMs && n.phase !== 'bolt') { n.phase = 'bolt'; n.dir = n.x < 0.5 ? -1 : 1; n.targetX = n.dir < 0 ? 0 : 1; }
  if (!n.holes && s.t >= s.limitMs) return lose(s, 'timeout');

  // 생물
  const dashSpeed = lerp(S.dashSpeed[0], S.dashSpeed[1], agi);
  n.phaseMs -= dt;
  switch (n.phase) {
    case 'idle':
      n.x = clamp01(n.x + (rng() - 0.5) * 0.004);
      if (n.phaseMs <= 0) {
        n.phase = 'tell';
        n.phaseMs = lerp(S.tellMs[1], S.tellMs[0], agi);
        // 손에서 멀어지는 쪽을 더 좋아한다 — 가장자리에선 안쪽으로
        const away: -1 | 1 = n.x < n.handX ? -1 : 1;
        n.dir = rng() < 0.65 ? away : (away === 1 ? -1 : 1);
        if (n.x < 0.15) n.dir = 1;
        if (n.x > 0.85) n.dir = -1;
        n.targetX = Math.max(0.06, Math.min(0.94, n.x + n.dir * between(S.dashDist, rng)));
      }
      break;
    case 'tell':
      if (n.phaseMs <= 0) {
        if (rng() < S.feint) { n.phase = 'idle'; n.phaseMs = between(S.idleMs, rng) * 0.6; }   // 속임 — 멈칫만
        else { n.phase = 'dash'; n.phaseMs = 2000; }
      }
      break;
    case 'dash': {
      const step = dashSpeed * sec;
      if (Math.abs(n.targetX - n.x) <= step) { n.x = n.targetX; n.phase = 'idle'; n.phaseMs = between(S.idleMs, rng) * (1 - agi * 0.4); }
      else n.x += Math.sign(n.targetX - n.x) * step;
      break;
    }
    case 'bolt': {
      const step = dashSpeed * 1.15 * sec;
      n.x = clamp01(n.x + n.dir * step);
      if (n.x <= 0.02 || n.x >= 0.98) return lose(s, 'escaped');
      break;
    }
  }

  // 덮치기
  if (n.strikeMs > 0) {
    n.strikeMs -= dt;
    if (n.strikeMs <= 0) {
      n.strikeMs = 0;
      if (Math.abs(n.x - n.handX) <= n.catchR) { s.status = 'won'; return s; }
      n.misses += 1;
      if (!n.holes) {
        if (n.misses >= S.maxMisses + 1) return lose(s, 'escaped');
      } else {
        n.alarm = Math.min(1, n.alarm + S.alarmPerMiss);
        if (n.misses >= S.maxMisses) n.alarm = 1;
        if (n.phase !== 'bolt') {   // 놀라서 손 반대쪽으로 튄다
          n.phase = 'dash';
          n.dir = n.x < n.handX ? -1 : 1;
          n.targetX = Math.max(0.06, Math.min(0.94, n.x + n.dir * S.dashDist[1]));
        }
      }
    }
  } else if (input.press) {
    n.strikeMs = n.strikeTotalMs;
  }
  return s;
}

function stepPry(s: ForageGameState, p: PryState, input: ForageGameInput, sec: number, rng: () => number, c?: ShoreCreature): ForageGameState {
  const P = FORAGE_GAME.pry;
  if (p.flash) { p.flash.ms -= sec * 1000; if (p.flash.ms <= 0) p.flash = null; }
  p.needle += p.needleDir * p.speed * sec;
  if (p.needle >= 1) { p.needle = 1; p.needleDir = -1; }
  if (p.needle <= 0) { p.needle = 0; p.needleDir = 1; }
  if (s.t >= s.limitMs) return lose(s, 'clamped');
  if (!input.press) return s;
  if (Math.abs(p.needle - p.zoneC) <= p.zoneW / 2) {
    p.hits += 1;
    p.flash = { kind: 'hit', ms: 260 };
    if (p.hits >= p.need) { s.status = 'won'; return s; }
    p.speed *= P.hitSpeedUp;
    p.zoneC = lerp(0.2, 0.8, rng());
  } else {
    p.misses += 1;
    p.flash = { kind: 'miss', ms: 320 };
    p.zoneW *= c?.clampsHard ? P.hardShrink : P.missShrink;
    p.speed *= P.missSpeedUp;
    p.zoneC = lerp(0.2, 0.8, rng());
    if (p.misses >= P.maxMisses || p.zoneW < P.minZoneW) return lose(s, 'clamped');
  }
  return s;
}

function stepDig(s: ForageGameState, g: DigState, input: ForageGameInput, dt: number, sec: number): ForageGameState {
  const G = FORAGE_GAME.dig;
  if (input.hold) {
    g.depth = Math.min(1, g.depth + g.digRate * sec);
    g.noise = Math.min(1, g.noise + g.noiseRate * sec);
    g.quietMs = 0;
  } else {
    g.noise = Math.max(0, g.noise - G.noiseDecay * sec);
    g.quietMs += dt;
    g.depth = Math.max(0, g.depth - G.refill * sec);   // 쉬면 모래가 무너져 다시 메워진다
  }
  g.flinch = g.noise > g.calm;
  if (g.noise >= 1) g.prey += G.boltRate * sec;                                   // 크게 놀라 깊이 파고든다
  else if (g.noise > g.calm) g.prey += (0.08 + (g.noise - g.calm)) * G.retreatK * sec;
  else if (g.quietMs > G.creepAfterMs) g.prey = Math.max(g.depth + 0.02, g.prey - G.creepRate * sec);   // 조용하면 슬금슬금 올라온다
  if (g.depth >= g.prey) { s.status = 'won'; return s; }
  if (g.prey >= 1) return lose(s, 'deeper');
  if (s.t >= s.limitMs) return lose(s, 'timeout');
  return s;
}

function stepPull(s: ForageGameState, p: PullState, input: ForageGameInput, dt: number, sec: number, rng: () => number): ForageGameState {
  const L = FORAGE_GAME.pull;
  p.phaseMs -= dt;
  if (p.phaseMs <= 0) {
    if (p.phase === 'calm') { p.phase = 'tell'; p.phaseMs = L.tellMs; }
    else if (p.phase === 'tell') { p.phase = 'surge'; p.phaseMs = L.surgeMs; }
    else { p.phase = 'calm'; p.phaseMs = between(L.calmMs, rng); }
  }
  if (input.hold) {
    p.tension = Math.min(1.2, p.tension + (L.rise + (p.phase === 'surge' ? L.surgeRise : 0)) * sec);
    if (p.tension >= L.windowLo && p.tension <= L.windowHi && p.phase !== 'surge') p.progress += L.gain * p.pullMult * sec;
  } else {
    p.tension = Math.max(0, p.tension - L.fall * sec);
    p.progress -= L.slack * sec;
  }
  if (p.phase === 'surge') p.progress -= L.surgeLoss * sec;
  if (p.tension >= 1) return lose(s, 'torn');
  if (p.progress >= 1) { s.status = 'won'; return s; }
  if (p.progress <= 0) return lose(s, 'escaped');
  if (s.t >= s.limitMs) return lose(s, 'escaped');
  return s;
}

/** 놓친 까닭 — 필드 혼잣말(한국어 원문 · i18n은 클라이언트) */
export function forageLossLineKo(nameKo: string, why: ForageGameLoss): string {
  switch (why) {
    case 'escaped': return `${nameKo}이(가) 바위 틈으로 달아났다.`;
    case 'clamped': return `${nameKo}이(가) 바위에 꽉 붙어 버렸다. 더는 못 떼겠다.`;
    case 'deeper': return `${nameKo}이(가) 깊이 파고들어 버렸다.`;
    case 'torn': return `너무 세게 당겼다 — ${nameKo}이(가) 먹물을 쏘고 달아났다.`;
    case 'timeout': return `머뭇거리는 사이 ${nameKo}을(를) 놓쳤다.`;
  }
}
