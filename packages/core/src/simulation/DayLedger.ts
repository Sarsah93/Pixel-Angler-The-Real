/**
 * @file DayLedger.ts
 * @description 하루 기록 장 만들기 · 결산 카드 꾸리기 (211차 — 순수 TS).
 *
 * 기록하는 쪽(client `LedgerStore`)은 장에 숫자를 쌓기만 하고, 보여 주는 쪽(`DayReportPanel`)은
 * 여기서 만든 **카드**만 그린다 — 무엇을 어떤 말로 보여 줄지는 이 파일 한 곳이 정한다.
 * 비어 있는 카드는 만들지 않는다(낚시만 한 날은 낚시 · 돈 카드만 나온다).
 */

import type { CoinReason, DayLedgerPage, LedgerCard, NextDayInput, NextDayPlan } from '../types/DayLedger.js';
import { kstYmd } from '../utils/KstTime.js';

export const COIN_REASON_LABEL: Record<CoinReason, string> = {
  sell: '판매', auction: '위판', quest: '의뢰 · 품삯', trade: '거래',
  shop: '구매', license: '자격 · 허가', upkeep: '정기 지출', repair: '수리',
  travel: '차비', clinic: '보건소', fine: '벌금', fee: '어장 행사료', death: '쓰러짐', other: '기타',
};

/** 빈 장 */
export function newLedgerPage(no: number, ymd: string, atMs: number, coins: number): DayLedgerPage {
  return {
    no, openedYmd: ymd, openedAtMs: atMs, playMs: 0, coinsStart: coins, coinsEnd: coins,
    earned: {}, spent: {}, catches: [], lost: { lineBreak: 0, escaped: 0, hookOff: 0, missed: 0 },
    gained: {}, used: {}, questsAccepted: [], questsDone: [], objectivesDone: 0, affinity: {},
    xp: 0, levelUps: 0, profUps: [], skills: [], titles: [], discoveries: [],
    life: { cook: 0, butcher: 0, sashimi: 0, craft: 0, trap: 0, forage: 0, auctionLots: 0 },
    gear: [], regions: [],
  };
}

/** 구세이브 · 일부만 있는 장을 빈 장 모양으로 채운다(누락 필드만) */
export function normalizeLedgerPage(p: Partial<DayLedgerPage> & { no: number; openedYmd: string }): DayLedgerPage {
  const base = newLedgerPage(p.no, p.openedYmd, p.openedAtMs ?? 0, p.coinsStart ?? 0);
  return {
    ...base, ...p,
    lost: { ...base.lost, ...(p.lost ?? {}) },
    life: { ...base.life, ...(p.life ?? {}) },
  } as DayLedgerPage;
}

/** 원 단위 → 「12,300원」 */
export function wonText(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}

/** 놀던 시간 → 「1시간 12분」 */
export function playTimeText(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return '1분 미만';
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

/** 이름 끝 글자 받침 → 「와」/「과」 */
export function josaWa(name: string): string {
  const c = name.charCodeAt(name.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return '와';
  return (c - 0xac00) % 28 === 0 ? '와' : '과';
}

function topEntries(rec: Record<string, number>, n: number): [string, number][] {
  return Object.entries(rec).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export interface LedgerNames {
  region: (id: string) => string;
  npc: (id: string) => string;
}

/**
 * 결산 카드 — 의미 있는 순서(돈 → 낚시 → 이야기 → 성장 → 도감 → 생활 → 가방 → 장비 → 다닌 곳).
 * 한 카드는 5줄 이내(카드 높이가 고정이라 넘치면 「외 N」으로 접는다).
 */
export function buildLedgerCards(p: DayLedgerPage, names: LedgerNames): LedgerCard[] {
  const cards: LedgerCard[] = [];
  const MAX = 5;

  // ── 돈 ──
  const earnedTotal = Object.values(p.earned).reduce((a, b) => a + (b ?? 0), 0);
  const spentTotal = Object.values(p.spent).reduce((a, b) => a + (b ?? 0), 0);
  if (earnedTotal > 0 || spentTotal > 0) {
    const net = p.coinsEnd - p.coinsStart;
    const lines: string[] = [`${wonText(p.coinsStart)} → ${wonText(p.coinsEnd)}`];
    for (const [k, v] of topEntries(p.earned as Record<string, number>, 2)) lines.push(`+ ${COIN_REASON_LABEL[k as CoinReason]} ${wonText(v)}`);
    for (const [k, v] of topEntries(p.spent as Record<string, number>, 2)) lines.push(`− ${COIN_REASON_LABEL[k as CoinReason]} ${wonText(v)}`);
    cards.push({
      key: 'money', titleKo: '돈', headline: `${net >= 0 ? '+' : '−'}${wonText(Math.abs(net))}`,
      lines: lines.slice(0, MAX), tone: net > 0 ? 'good' : net < 0 ? 'bad' : 'neutral',
    });
  }

  // ── 낚시 ──
  const lostTotal = p.lost.lineBreak + p.lost.escaped + p.lost.hookOff + p.lost.missed;
  if (p.catches.length > 0 || lostTotal > 0) {
    const species = new Set(p.catches.map((c) => c.speciesId));
    const biggest = [...p.catches].sort((a, b) => b.weightG - a.weightG)[0];
    const lines: string[] = [];
    if (biggest) lines.push(`가장 큰 고기 — ${biggest.nameKo} ${biggest.lengthCm.toFixed(0)}cm`);
    const kept = p.catches.filter((c) => c.fate === 'kept').length;
    const rel = p.catches.filter((c) => c.fate === 'released').length;
    const law = p.catches.filter((c) => c.fate === 'lawful').length;
    if (kept || rel) lines.push(`보관 ${kept}마리 · 놓아줌 ${rel}마리`);
    if (law) lines.push(`작거나 금어기라 돌려보냄 ${law}마리`);
    if (lostTotal) {
      const parts: string[] = [];
      if (p.lost.lineBreak) parts.push(`줄터짐 ${p.lost.lineBreak}`);
      if (p.lost.escaped) parts.push(`탈출 ${p.lost.escaped}`);
      if (p.lost.hookOff) parts.push(`바늘 빠짐 ${p.lost.hookOff}`);
      if (p.lost.missed) parts.push(`헛챔질 ${p.lost.missed}`);
      lines.push(`놓친 것 — ${parts.join(' · ')}`);
    }
    cards.push({
      key: 'fishing', titleKo: '낚시',
      headline: p.catches.length ? `${p.catches.length}마리 · ${species.size}종` : '빈손',
      lines: lines.slice(0, MAX), fishSpeciesId: biggest?.speciesId,
    });
  }

  // ── 이야기 ──
  const aff = topEntries(Object.fromEntries(Object.entries(p.affinity).map(([k, v]) => [k, Math.abs(v)])), 2);
  if (p.questsDone.length || p.questsAccepted.length || p.objectivesDone || aff.length) {
    const lines: string[] = [];
    for (const q of p.questsDone.slice(0, 2)) lines.push(`마침 — ${q}`);
    if (p.questsDone.length > 2) lines.push(`… 외 ${p.questsDone.length - 2}건 마침`);
    for (const q of p.questsAccepted.slice(0, 1)) lines.push(`맡음 — ${q}`);
    for (const [id] of aff) {
      const d = p.affinity[id] ?? 0;
      const nm = names.npc(id);
      lines.push(`${nm}${josaWa(nm)} ${d >= 0 ? '가까워졌다' : '서먹해졌다'}`);
    }
    cards.push({
      key: 'story', titleKo: '이야기',
      headline: p.questsDone.length ? `${p.questsDone.length}건 마침` : p.objectivesDone ? `할 일 ${p.objectivesDone}개 해냄` : undefined,
      lines: lines.slice(0, MAX),
    });
  }

  // ── 성장 ──
  if (p.xp > 0 || p.levelUps || p.profUps.length || p.skills.length || p.titles.length) {
    const lines: string[] = [];
    if (p.levelUps) lines.push(`레벨 ${p.levelUps}단계 올랐다`);
    for (const s of p.profUps.slice(0, 2)) lines.push(`솜씨 — ${s}`);
    for (const s of p.skills.slice(0, 1)) lines.push(`새 기술 — ${s}`);
    for (const s of p.titles.slice(0, 2)) lines.push(`타이틀 — ${s}`);
    cards.push({ key: 'growth', titleKo: '성장', headline: p.xp > 0 ? `경험 +${Math.round(p.xp).toLocaleString('ko-KR')}` : undefined, lines: lines.slice(0, MAX) });
  }

  // ── 도감 ──
  if (p.discoveries.length) {
    const lines = p.discoveries.slice(0, 4).map((d) => d.name);
    if (p.discoveries.length > 4) lines.push(`… 외 ${p.discoveries.length - 4}`);
    cards.push({ key: 'codex', titleKo: '새로 알게 된 것', headline: `새로 ${p.discoveries.length}가지`, lines });
  }

  // ── 생활 ──
  const L = p.life;
  const lifeParts: string[] = [];
  if (L.cook) lifeParts.push(`요리 ${L.cook}번`);
  if (L.butcher) lifeParts.push(`손질 ${L.butcher}마리`);
  if (L.sashimi) lifeParts.push(`회 ${L.sashimi}접시`);
  if (L.craft) lifeParts.push(`제작 ${L.craft}번`);
  if (L.trap) lifeParts.push(`통발 걷기 ${L.trap}번`);
  if (L.forage) lifeParts.push(`채집 ${L.forage}번`);
  if (L.auctionLots) lifeParts.push(`위판 낙찰 ${L.auctionLots}건`);
  if (lifeParts.length) cards.push({ key: 'life', titleKo: '생활', lines: lifeParts.slice(0, MAX) });

  // ── 가방 ──
  const gTop = topEntries(p.gained, 3), uTop = topEntries(p.used, 2);
  if (gTop.length || uTop.length) {
    const lines: string[] = [];
    for (const [n, q] of gTop) lines.push(`+ ${n} ×${q}`);
    for (const [n, q] of uTop) lines.push(`− ${n} ×${q}`);
    cards.push({ key: 'bag', titleKo: '가방', lines: lines.slice(0, MAX) });
  }

  // ── 장비 ──
  if (p.gear.length) {
    const lines = p.gear.slice(0, 4);
    if (p.gear.length > 4) lines.push(`… 외 ${p.gear.length - 4}`);
    cards.push({ key: 'gear', titleKo: '장비', lines, tone: 'bad' });
  }

  // ── 다닌 곳 ──
  if (p.regions.length) {
    cards.push({ key: 'places', titleKo: '다닌 곳', lines: [p.regions.map(names.region).join(' · ')] });
  }
  return cards;
}


// ── 내일 할 만한 것 (212차) ─────────────────────────────

/**
 * 하루의 경계 시각(KST) — 자정이 아니라 새벽 4시다. 밤낚시(22~02시)가 자정에 쪼개지지 않고,
 * 새벽 위판 · 새벽 물때부터가 「새 하루」로 읽힌다.
 */
export const DAY_BOUNDARY_HOUR = 4;

/** 그 순간이 속한 「하루」(YYYYMMDD) — 새벽 4시 전이면 전날 */
export function logicalYmd(atMs: number): string {
  return kstYmd(new Date(atMs - DAY_BOUNDARY_HOUR * 3600000));
}

/** YYYYMMDD + n일 */
export function addYmd(ymd: string, n: number): string {
  const t = Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8))) + n * 86400000;
  const d = new Date(t);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * 이 장 다음에 오는 하루 — 잠들며 닫은 장은 잠든 순간의 하루 + 1, 자정에 닫힌 장은 연 날 + 1.
 * (새벽 2시에 잠들면 「다음 날」은 그날 낮이다.)
 */
export function nextDayOf(p: DayLedgerPage): string {
  if (p.closedBy === 'sleep' && p.closedAtMs !== undefined) return addYmd(logicalYmd(p.closedAtMs), 1);
  return addYmd(p.openedYmd, 1);
}

/** 그날 밤 — 19시부터 다음 날 새벽 4시(=분 1680)까지. 다음 날 새벽 시각은 +1440분으로 넘겨받는다 */
const inNight = (m: number): boolean => m >= 19 * 60 && m <= (24 + DAY_BOUNDARY_HOUR) * 60;

/**
 * 다음 날 바다로 할 만한 것 하나를 고른다 — 위에서부터 먼저 걸리는 것.
 * ① 파도가 막는 높이 이상 · 비 확률 70% 이상 · 비 예보 → 바다는 쉰다
 * ② 물살 센 날(0.7+) 밤 간조 → 해루질
 * ③ 사리(0.85+) → 무거운 채비 · 새벽 5시 뒤 첫 만조
 * ④ 조금(0.5 미만) → 가벼운 채비
 * ⑤ 그 밖 → 만조 앞뒤
 */
export function planNextDay(i: NextDayInput): NextDayPlan {
  if ((i.waveMaxM ?? 0) >= i.maxSafeWaveM || (i.popMaxPct ?? 0) >= 70 || i.wet) return { kind: 'stormy' };
  const nightLow = i.lowTimesMin.find(inNight);
  if (i.currentStrength >= 0.7 && nightLow !== undefined) return { kind: 'night_forage', atMin: nightLow };
  const high = i.highTimesMin.find((m) => m >= 5 * 60) ?? i.highTimesMin[0];
  if (i.currentStrength >= 0.85) return { kind: 'spring_tide', atMin: high };
  if (i.currentStrength < 0.5) return { kind: 'neap_tide' };
  return { kind: 'good_tide', atMin: high };
}
