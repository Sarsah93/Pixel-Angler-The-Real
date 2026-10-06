/**
 * @file ForageMinigame.test.ts
 * @description 224차 — 채집 손놀림 놀이 난이도 확인. 「조금 어려운」(사용자 지시) =
 *  조심스럽게 하는 사람(반응 지연 · 예측 포함)은 대체로 잡고, 마구 누르는 사람은 대개 놓친다.
 */

import { describe, it, expect } from 'vitest';
import { createForageGame, stepForageGame, type ForageGameState, type ForageGameInput } from './ForageMinigame.js';
import { mulberry32, forageGameKindOf, rollForageSpots, rollForageHarvest, forageInjuryRoll } from './ForagingEngine.js';
import { SHORE_CREATURE_DATABASE, getCreatureById } from '../db-schema/ShoreCreatureDatabase.js';
import type { ShoreCreature } from '../db-schema/ShoreCreatureDatabase.js';
import type { ForageTool } from '../types/Foraging.js';

const DT = 16;

type Bot = (s: ForageGameState, mem: { last: number; t: number; aim: number }, rng: () => number) => ForageGameInput;

/** 조심스러운 사람 — 반응 지연 약 0.2초를 흉내 내려고 판단을 0.2초마다만 바꾼다 */
const careful: Bot = (s, mem) => {
  const inp: ForageGameInput = { aimX: mem.aim, press: false, hold: false };
  if (s.snatch) {
    const n = s.snatch;
    // 예측 — 멈칫(예고)이면 튈 자리로, 아니면 지금 자리로. 손은 천천히(놀라지 않게)
    const goal = (n.phase === 'tell' || n.phase === 'dash' ? n.targetX : n.x) + (Math.random() - 0.5) * 0.04;
    const step = 0.7 * DT / 1000;
    mem.aim = Math.abs(goal - mem.aim) <= step ? goal : mem.aim + Math.sign(goal - mem.aim) * step;
    inp.aimX = mem.aim;
    if (s.t - mem.last >= 200 && n.strikeMs <= 0 && n.phase === 'idle' && Math.abs(n.handX - n.x) < n.catchR * 0.7) {
      inp.press = true; mem.last = s.t;
    }
  } else if (s.pry) {
    const p = s.pry;
    // 바늘이 칸 가운데 쪽으로 들어올 때를 예상해 누른다(약간 이르게)
    // 0.2초 전에 본 바늘이 칸에 막 들어설 참이면 누른다(그 사이 바늘은 칸 안쪽으로 들어와 있다)
    const lead = p.needle + p.needleDir * p.speed * 0.2;
    if (s.t - mem.last >= 250 && Math.abs(lead - p.zoneC) < p.zoneW * 0.35) { inp.press = true; mem.last = s.t; }
  } else if (s.dig) {
    const g = s.dig;
    if (g.flinch || g.noise >= 0.6) mem.aim = 1;   // 움찔하거나 소란이 크면 쉰다
    if (g.noise <= 0.2) mem.aim = 0;               // 가라앉으면 다시 판다
    inp.hold = mem.aim < 0.5;
  } else if (s.pull) {
    const p = s.pull;
    inp.hold = p.phase === 'calm' && p.tension < 0.78;
  }
  return inp;
};

/** 마구 누르는 사람 */
const masher: Bot = (s, mem, rng) => {
  const inp: ForageGameInput = { aimX: s.snatch ? s.snatch.x : 0.5, press: false, hold: true };
  if (s.t - mem.last >= 350) { inp.press = true; mem.last = s.t; }
  void rng;
  return inp;
};

/** 사람의 눈 — 0.2초 전 화면을 보고 판단한다(반응 지연) */
const LAG_STEPS = 12;

function play(c: ShoreCreature, tool: ForageTool, bot: Bot, seed: number, lag = LAG_STEPS): ForageGameState {
  const rng = mulberry32(seed);
  const s = createForageGame(c, tool, rng, 0);
  const mem = { last: -9999, t: 0, aim: s.snatch?.handX ?? 0 };
  const seen: ForageGameState[] = [];
  for (let i = 0; i < 2000 && s.status === 'play'; i++) {
    seen.push(JSON.parse(JSON.stringify(s)) as ForageGameState);
    if (seen.length > lag * 2) seen.shift();
    // 반응 지연은 판단마다 0.15~0.28초로 흔들린다
    const lagNow = Math.min(seen.length - 1, Math.floor(lag * 0.75 + rng() * lag * 0.7));
    const view = seen[seen.length - 1 - lagNow]!;
    view.t = s.t;   // 판단 간격(누름 쿨다운)은 지금 시각으로 센다
    const inp = bot(view, mem, rng);
    stepForageGame(s, inp, DT, rng, c);
  }
  return s;
}

function rate(id: string, tool: ForageTool, bot: Bot, n = 300): number {
  const c = getCreatureById(id)!;
  let won = 0;
  for (let k = 0; k < n; k++) if (play(c, tool, bot, 1000 + k).status === 'won') won++;
  return won / n;
}

describe('ForageMinigame — 갈래', () => {
  it('사는 모양마다 놀이가 정해진다', () => {
    expect(forageGameKindOf(getCreatureById('hemigrapsus_sanguineus')!)).toBe('snatch');
    expect(forageGameKindOf(getCreatureById('haliotis_discus')!)).toBe('pry');
    expect(forageGameKindOf(getCreatureById('perinereis_aibuhitensis')!)).toBe('dig');
    expect(forageGameKindOf(getCreatureById('octopus_vulgaris')!)).toBe('pull');
    expect(forageGameKindOf(getCreatureById('omphalius_rusticus')!)).toBe('pick');
  });
  it('모든 생물이 끝나는 판을 만든다(무한 판 없음)', () => {
    for (const c of SHORE_CREATURE_DATABASE) {
      const s = play(c, 'hand', masher, 7);
      expect(s.status).not.toBe('play');
    }
  });
});

describe('ForageMinigame — 난이도 「조금 어려운」', () => {
  const cases: [string, ForageTool][] = [
    ['hemigrapsus_sanguineus', 'hand'],    // 덮치기
    ['ligia_exotica', 'hand'],             // 덮치기(가장 빠름)
    ['haliotis_discus', 'tongs'],          // 떼기 3번
    ['cellana_grata', 'tongs'],            // 떼기(한 번에)
    ['perinereis_aibuhitensis', 'rake'],   // 파기
    ['octopus_vulgaris', 'tongs'],         // 당기기
    ['omphalius_rusticus', 'hand'],        // 줍기
  ];
  for (const [id, tool] of cases) {
    it(`${id} — 조심하면 대체로 잡고 마구 누르면 대개 놓친다`, () => {
      const good = rate(id, tool, careful);
      const bad = rate(id, tool, masher);
      if (process.env.RATES) console.log('RATE', id, tool, good.toFixed(2), bad.toFixed(2));
      // 조심스러운 사람(반응 지연 · 예측 · 완벽한 눈)도 쉽지는 않다(97% 미만) · 그래도 할 만하다(45% 이상).
      // 줍기(느린 고둥)만은 쉬워도 된다.
      expect(good).toBeGreaterThan(0.45);
      if (id !== 'omphalius_rusticus') expect(good).toBeLessThan(0.97);
      // 마구 누르기는 조심스러운 쪽보다 확실히 못하다
      expect(bad).toBeLessThan(good - 0.15);
    });
  }
});

describe('ForagingEngine — 224차 서식 규칙', () => {
  const cands = Array.from({ length: 400 }, (_, i) => ({ tx: (i % 40) * 3, ty: Math.floor(i / 40) * 3, kind: 'shallows' as const, substrate: 'rock' as const }));
  it('동해에는 오분자기가 나오지 않는다', () => {
    for (let k = 0; k < 20; k++) {
      const spots = rollForageSpots(cands, { seed: k, month: 3, isNight: true, tideLevel01: 0.3, hasAdvancedLicense: true, farms: [], maxSpots: 400, eastSea: true });
      expect(spots.some((s) => s.creatureId === 'haliotis_diversicolor')).toBe(false);
    }
  });
  it('바위 바닥 얕은 물엔 모래 속 생물(바지락 · 청갯지렁이)이 없다', () => {
    const spots = rollForageSpots(cands, { seed: 3, month: 3, isNight: true, tideLevel01: 0.3, hasAdvancedLicense: true, farms: [], maxSpots: 400 });
    expect(spots.length).toBeGreaterThan(0);
    expect(spots.some((s) => s.creatureId === 'clam_varicosa' || s.creatureId === 'perinereis_aibuhitensis')).toBe(false);
  });
  it('여름잠 — 8월엔 해삼이 나오지 않는다', () => {
    const spots = rollForageSpots(cands, { seed: 5, month: 8, isNight: true, tideLevel01: 0.3, hasAdvancedLicense: true, farms: [], maxSpots: 400 });
    expect(spots.some((s) => s.creatureId === 'stichopus_japonicus')).toBe(false);
  });
  it('물에 사는 생물은 얕은 물 스팟에만 나온다', () => {
    for (const id of ['haliotis_discus', 'octopus_vulgaris', 'stichopus_japonicus', 'turbo_cornutus', 'strongylocentrotus_nudus']) {
      expect(getCreatureById(id)!.spotKinds).toEqual(['shallows']);
    }
  });
  it('미끼 갯것은 미끼 아이템으로 간다', () => {
    expect(getCreatureById('perinereis_aibuhitensis')!.baitItemId).toBe('inv_ragworm');
    expect(getCreatureById('marphysa_sanguinea')!.baitItemId).toBe('inv_honmushi');
    expect(getCreatureById('hemigrapsus_sanguineus')!.baitItemId).toBeTruthy();
    expect(getCreatureById('ligia_exotica')!.baitItemId).toBeTruthy();
  });
  it('수확 무게는 양수 · 장갑을 끼면 덜 다친다', () => {
    const rng = mulberry32(9);
    for (const c of SHORE_CREATURE_DATABASE) expect(rollForageHarvest(c, rng).weightG).toBeGreaterThan(0);
    const urchin = getCreatureById('strongylocentrotus_nudus')!;
    let bare = 0, glove = 0;
    for (let k = 0; k < 2000; k++) {
      if (forageInjuryRoll(urchin, 'hand', false, rng).injured) bare++;
      if (forageInjuryRoll(urchin, 'hand', true, rng).injured) glove++;
    }
    expect(glove).toBeLessThan(bare / 2);
    expect(forageInjuryRoll(urchin, 'tongs', false, rng).injured).toBe(false);
  });
});
