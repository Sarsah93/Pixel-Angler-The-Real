/**
 * @file I18n.ts
 * @description 인게임 텍스트 다국어(한국어/영어) — 117차.
 *
 * 설계: 원문(한국어)이 곧 키다. `Phaser.GameObjects.Text.setText`를 한 번 감싸서 **모든 Text 오브젝트가
 * 만들어지거나 갱신될 때 사전을 통과**하게 한다 — 호출부 수백 곳을 `t()`로 감싸지 않아도 되고,
 * 사전에 없는 문장은 그대로(한국어) 남는다(부분 지원 상태에서도 깨지지 않는다).
 *
 *  - 정확 일치 사전(`EN_DICT`) → 정규식 규칙(`EN_RULES`, 수치·이름이 섞인 문장) → 줄/구분자 단위 분해 →
 *    `[태그] 본문` 접두 분해 순으로 시도한다. 한글이 없는 문자열은 즉시 통과(시계·수치 = 비용 0).
 *  - 어종 이름은 `FISH_DATABASE.nameEn`을 런타임에 사전에 합친다(도감 데이터가 곧 번역).
 *  - 언어를 바꾸면 `refreshAll(game)`이 살아 있는 모든 Text를 원문(`__i18nSrc`)으로 다시 set해 즉시 갈아입힌다.
 *
 * 한계(117차 기준): 사전 커버리지 = 필드/HUD/메뉴/설정/인벤·상점·장비·쿨러/1인칭 낚시/채비/가이드/도움말
 * 라벨·제목·캡션 + 주요 아이템명·어종명. 손질 스테이지 안내, 도감 설명문, 아이템 상세 설명 일부는 한국어로 남는다.
 */

import Phaser from 'phaser';
import {
  FISH_DATABASE, SHORE_CREATURE_DATABASE, LURES_CATALOG_DB, ORACLE_FISH_DB,
  LICENSE_DATABASE, SKILL_DATABASE, SKILL_CATEGORIES,
  REGION_DATABASE, WORLD_NODE_DATABASE, REGION_AREA_NODES, REGION_MAP_GRAPHS, SEAMLESS_REGIONS,
  DATA_ATTRIBUTIONS, LICENSE_LABEL, LICENSE_LABEL_EN,
  CRAFT_BLUEPRINTS, CRAFT_GROUP_LABEL,
  allChoiceLines,
} from '@tra/core';
import { EN_PLACES } from './places.js';
import { EN_POIS } from './en_pois.js';
import { EN_DICT, EN_RULES } from './en.js';
import {
  STORY_QUESTS, STORY_CHAPTERS, JOURNAL_PAGES, STORY_ARCS, STORY_MAIN_NPCS, FISHERY_LAW_RULES, canSell, provenanceOf,
} from '@tra/core';
import { allDialogueLines } from '../data/StoryDialogue.js';

export type Locale = 'ko' | 'en';

let locale: Locale = 'ko';
const HANGUL = /[가-힣]/;
const cache = new Map<string, string>();
const runtimeDict = new Map<string, string>();
let installed = false;

/**
 * 런타임 사전 합류 — **데이터가 곧 번역**인 항목(nameKo/nameEn 쌍)을 사전에 붙인다.
 * 어종·해양생물·루어·오라클 어종 + 지명(EN_PLACES).
 */
function buildRuntimeDict(): void {
  if (runtimeDict.size) return;
  const put = (ko?: string, en?: string): void => {
    if (!ko || !en) return;
    if (!runtimeDict.has(ko)) runtimeDict.set(ko, en);
    // '광어(넙치)' 처럼 괄호 별칭이 붙은 이름은 **앞부분 짧은 이름**도 등록한다 —
    // 어획 아이템명·팝업은 '광어 (72cm)' 처럼 짧은 이름을 쓴다 (119차 ⑥ 실측).
    const short = ko.split('(')[0].trim();
    if (short && short !== ko && !runtimeDict.has(short)) runtimeDict.set(short, en);
  };
  for (const f of FISH_DATABASE) put(f.nameKo, f.nameEn);
  for (const c of SHORE_CREATURE_DATABASE) put(c.nameKo, c.nameEn);
  for (const l of LURES_CATALOG_DB) put(l.nameKo, l.nameEn);
  for (const o of ORACLE_FISH_DB) put(o.nameKo, o.nameEn);
  // 지명 — **데이터의 nameEn 이 먼저**, 사전(EN_PLACES)은 아직 필드가 없는 것만 메운다 (120차 ③).
  for (const r of REGION_DATABASE) { put(r.nameKo, r.nameEn); put(r.shortNameKo, r.shortNameEn); }
  for (const n of WORLD_NODE_DATABASE) { put(n.name, n.nameEn); put(n.shortName, n.shortNameEn); }
  for (const list of Object.values(REGION_AREA_NODES)) for (const a of list) put(a.name, a.nameEn);
  for (const g of Object.values(REGION_MAP_GRAPHS)) for (const n of g.nodes) put(n.name, n.nameEn);
  for (const r of Object.values(SEAMLESS_REGIONS)) put(r.name, r.nameEn);
  // 122차 — 면허·스킬·지역 설명·구역 상세: 데이터 필드(nameEn/descriptionEn/descEn/detailsEn)가 정본
  for (const l of LICENSE_DATABASE) { put(l.nameKo, l.nameEn); put(l.description, l.descriptionEn); if (l.plannedNote) put(l.plannedNote, l.plannedNoteEn); }
  for (const sk of SKILL_DATABASE) { put(sk.nameKo, sk.nameEn); put(sk.descKo, sk.descEn); }
  for (const c of SKILL_CATEGORIES) { put(c.nameKo, c.nameEn); put(c.descKo, c.descEn); put(c.lockedNoteKo, c.lockedNoteEn); }
  // 131차 — 제작 도면·그룹 라벨도 데이터(nameEn/descEn)가 정본
  for (const bp of CRAFT_BLUEPRINTS) { put(bp.nameKo, bp.nameEn); put(bp.descKo, bp.descEn); }
  for (const g of Object.values(CRAFT_GROUP_LABEL)) put(g.ko, g.en);
  for (const r of REGION_DATABASE) put(r.description, r.descriptionEn);
  // 122차 — 출처 화면(데이터 제공기관·서비스·사용처·라이선스 라벨)
  for (const a of DATA_ATTRIBUTIONS) { put(a.provider, a.providerEn); put(a.service, a.serviceEn); put(a.usage, a.usageEn); }
  for (const k of Object.keys(LICENSE_LABEL) as (keyof typeof LICENSE_LABEL)[]) put(LICENSE_LABEL[k], LICENSE_LABEL_EN[k]);
  for (const list of Object.values(REGION_AREA_NODES)) for (const a of list) {
    put(a.desc, a.descEn);
    (a.details ?? []).forEach((d, i) => put(d, a.detailsEn?.[i]));
  }
  // 134차 — 스토리: 퀘스트·챕터·조행록·아크·NPC·법 규칙·대사 (데이터 Ko/En 쌍이 정본)
  for (const q of STORY_QUESTS) { put(q.titleKo, q.titleEn); put(q.descKo, q.descEn); for (const o of q.objectives) put(o.labelKo, o.labelEn); }
  for (const ch of STORY_CHAPTERS) {
    put(ch.titleKo, ch.titleEn); put(ch.partTitleKo, ch.partTitleEn); put(ch.questionKo, ch.questionEn);
    const q = ch.qualification;
    if (q) { put(q.labelKo, q.labelEn); put(q.deadlineKo, q.deadlineEn); put(q.onMissKo, q.onMissEn); put(q.unlocksKo, q.unlocksEn); }
  }
  for (const p of JOURNAL_PAGES) { put(p.labelKo, p.labelEn); put(p.howKo, p.howEn); }
  for (const a of STORY_ARCS) { put(a.titleKo, a.titleEn); put(a.relationKo, a.relationEn); put(a.angleKo, a.angleEn); for (const n of a.npcs) { put(n.nameKo, n.nameEn); put(n.roleKo, n.roleEn); } }
  for (const n of STORY_MAIN_NPCS) { put(n.nameKo, n.nameEn); put(n.roleKo, n.roleEn); }
  for (const r of FISHERY_LAW_RULES) { put(r.titleKo, r.titleEn); put(r.textKo, r.textEn); put(r.basisKo, r.basisEn); put(r.whenKo, r.whenEn); }
  for (const m of ['rod', 'trap', 'gift', 'commercial'] as const) { const v = canSell(provenanceOf(m, ''), []); put(v.reasonKo, v.reasonEn); v.alternatives.forEach((a, i) => put(a, v.alternativesEn[i])); }
  for (const [ko, en] of allDialogueLines()) put(ko, en);
  for (const [ko, en] of allChoiceLines()) put(ko, en);   // 140차 — 선택지·응답
  for (const [ko, en] of Object.entries(EN_PLACES)) put(ko, en);
  // 상호명 보정 사전 — OSM `name:en` 이 없거나(42건) 품질이 낮은 것(지구대 중복 등)을 덮는다.
  // registerNames(OSM)보다 **먼저** 들어가므로 큐레이션이 이긴다.
  for (const [ko, en] of Object.entries(EN_POIS)) put(ko, en);
}

/**
 * 런타임 이름 등록 (120차) — 지역 데이터를 로드한 뒤 알게 되는 이름 쌍을 사전에 붙인다.
 * 현재 소비처: OSM POI 상호명(`RegionPoi.name` → `nameEn`).
 *
 * 이미 있는 키는 **덮지 않는다** — 지명(`동명항` = Dongmyeong Port)과 POI 상호명이 같은 글자일 때
 * 지명 쪽이 이겨야 하고, 큐레이션 사전(`EN_POIS`)도 OSM 원본보다 우선이기 때문이다.
 */
export function registerNames(pairs: Iterable<readonly [string, string]>): void {
  buildRuntimeDict();
  let added = 0;
  for (const [ko, en] of pairs) {
    if (!ko || !en || runtimeDict.has(ko)) continue;
    runtimeDict.set(ko, en);
    added++;
  }
  if (added) cache.clear();   // 이미 원문으로 굳은 번역 결과를 버린다
}

export function getLocale(): Locale { return locale; }

/** 문자열 1개 번역 — Text 밖(로그·문자열 조립)에서도 쓸 수 있다. 사전에 없으면 원문 그대로. */
export function t(src: string): string {
  if (locale !== 'en' || !src || !HANGUL.test(src)) return src;
  return translateText(src);
}

// 구분자 분해 — **구체적인 것부터**. 마지막 두 개(연속 공백 열 구분·맨 가운데점)는
// 사전·규칙이 전부 빗나갔을 때만 쓰는 마지막 수단이다 (119차 ⑥).
const SEP_PATTERNS: RegExp[] = [
  /(\s{2,}›\s{2,})/, /(\s{2,}·\s{2,})/, /(\s·\s)/, /(\s—\s)/, /(\s\|\s)/, /(\s\/\s)/,
  /(\s{2,})/, /(,\s)/, /(·)/,
];
/** 트리 글리프·불릿 접두(▾ ▸ · ① 등) — 접두는 두고 본문만 번역 */
const GLYPH_PREFIX = /^([^\w가-힣\[\(]+\s+)(.+)$/s;

export type Translator = (s: string) => string;

/**
 * 규칙 치환 템플릿 적용 — `$1`~`$9` 캡처를 **번역기에 한 번 더 통과**시킨다.
 *
 * 119차 실측: 구현이 `s.replace(re, rep)`였던 탓에 캡처 안의 한국어(어종·아이템·슬롯·지명)가
 * 통째로 원문으로 남았다. 게다가 규칙이 한 번 맞으면 translateDeep의 분해 단계가 전부
 * 건너뛰어져, `[HH:MM] 본문` 같은 포괄 규칙 하나가 채팅 로그 전체의 번역을 막고 있었다.
 */
function applyTemplate(tmpl: string, m: RegExpExecArray, tr: Translator): string {
  return tmpl.replace(/\$(\d)/g, (_all, d: string) => {
    const g = m[Number(d)];
    return g === undefined ? '' : tr(g);
  });
}

function translateOnce(s: string, depth: number): string | null {
  const d = EN_DICT[s] ?? runtimeDict.get(s);
  if (d !== undefined) return d;
  // 캡처 재번역기 — 캡처가 원문 전체와 같으면(무한 재귀) 그대로 둔다
  // 캡처가 원문 전체와 같거나(무한 재귀) 너무 깊으면 그대로 둔다
  const tr: Translator = (x) => (x === s || depth > 6 ? x : translateDeep(x, depth + 1));
  for (const [re, rep] of EN_RULES) {
    const m = re.exec(s);
    if (m) return typeof rep === 'function' ? rep(m, tr) : applyTemplate(rep, m, tr);
  }
  return null;
}

/** 재귀 번역 본체 — 정확 일치 → 규칙 → 줄 분해 → 구분자 분해 → 태그 접두 분해 */
function translateDeep(s: string, depth: number): string {
  if (!HANGUL.test(s)) return s;
  const hit = translateOnce(s, depth);
  if (hit !== null) return hit;
  if (depth > 3) return s;
  const trimmed = s.trim();
  if (trimmed !== s && trimmed.length) {
    const inner = translateDeep(trimmed, depth + 1);
    if (inner !== trimmed) return s.replace(trimmed, inner);
  }
  if (s.includes('\n')) {
    return s.split('\n').map((line) => translateDeep(line, depth + 1)).join('\n');
  }
  // ▾ 라벨 / · 항목 — 글리프 접두 분리
  const gp = GLYPH_PREFIX.exec(s);
  if (gp) {
    const rest = translateDeep(gp[2], depth + 1);
    if (rest !== gp[2]) return gp[1] + rest;
  }
  // 끝 꼬리표 — '라벨  (준비 중)' 처럼 본문 + 괄호 꼬리
  const tail = /^(.+?)(\s+\((?:준비 중|추후|dev|예정)[^)]*\))$/s.exec(s);
  if (tail) {
    const a = translateDeep(tail[1], depth + 1);
    const b = translateDeep(tail[2].trim(), depth + 1);
    if (a !== tail[1] || b !== tail[2].trim()) return `${a}  ${b}`;
  }
  // [태그] 본문  /  [12:46] 본문
  const tag = /^(\[[^\]]+\])\s*(.*)$/s.exec(s);
  if (tag) {
    const tg = translateDeep(tag[1].slice(1, -1), depth + 1);
    const rest = translateDeep(tag[2], depth + 1);
    if (tg !== tag[1].slice(1, -1) || rest !== tag[2]) return `[${tg}] ${rest}`;
  }
  // '라벨: 값' — 스펙 행/툴팁에서 가장 흔한 조립 형태
  const colon = /^([^:\n]{1,24}):\s+([\s\S]+)$/.exec(s);
  if (colon) {
    const a = translateDeep(colon[1], depth + 1);
    const b = translateDeep(colon[2], depth + 1);
    if (a !== colon[1] || b !== colon[2]) return `${a}: ${b}`;
  }
  for (const sep of SEP_PATTERNS) {
    if (sep.test(s)) {
      const parts = s.split(sep);
      if (parts.length > 2) {
        const out = parts.map((p, i) => (i % 2 === 1 ? p : translateDeep(p, depth + 1))).join('');
        if (out !== s) return out;
      }
    }
  }
  // 괄호 안쪽만 따로
  const paren = /^(.*?)\s*\((.+)\)\s*$/s.exec(s);
  if (paren && paren[1].length) {
    const a = translateDeep(paren[1], depth + 1);
    const b = translateDeep(paren[2], depth + 1);
    if (a !== paren[1] || b !== paren[2]) return `${a} (${b})`;
  }
  return s;
}

export function translateText(src: string): string {
  if (!HANGUL.test(src)) return src;
  const c = cache.get(src);
  if (c !== undefined) return c;
  buildRuntimeDict();
  const out = translateDeep(src, 0);
  if (cache.size > 4000) cache.clear();
  cache.set(src, out);
  return out;
}

type I18nText = Phaser.GameObjects.Text & { __i18nSrc?: string };

/**
 * Phaser Text 훅 설치 — `setText`를 감싸 원문을 `__i18nSrc`에 보관하고 현재 언어로 그린다.
 * 게임 생성 전에 1회. (생성자도 내부에서 setText를 호출하므로 새 Text 전부에 적용된다.)
 */
export function installI18n(initial: Locale): void {
  locale = initial;
  if (installed) return;
  installed = true;
  const proto = Phaser.GameObjects.Text.prototype as unknown as {
    setText: (this: I18nText, value: string | string[] | number) => Phaser.GameObjects.Text;
  };
  const orig = proto.setText;
  proto.setText = function (this: I18nText, value: string | string[] | number) {
    const raw = Array.isArray(value) ? value.join('\n') : (value === undefined || value === null ? '' : String(value));
    this.__i18nSrc = raw;
    return orig.call(this, locale === 'en' ? translateText(raw) : raw);
  };
}

/** 언어 전환 — 저장은 호출측(설정) 몫. 살아 있는 씬의 Text를 전부 원문으로 다시 set해 즉시 반영. */
export function setLocale(next: Locale, game?: Phaser.Game): void {
  if (locale === next) return;
  locale = next;
  cache.clear();
  if (game) { refreshAll(game); game.events.emit('locale-changed', next); }   // 명패 등 실측 폭 레이아웃 재배치 훅 (122차)
}

export function refreshAll(game: Phaser.Game): void {
  const walk = (list: Phaser.GameObjects.GameObject[]): void => {
    for (const go of list) {
      if (go instanceof Phaser.GameObjects.Container) { walk(go.list); continue; }
      if (go instanceof Phaser.GameObjects.Text) {
        const src = (go as I18nText).__i18nSrc;
        if (src !== undefined && HANGUL.test(src)) go.setText(src);
      }
    }
  };
  for (const scene of game.scene.getScenes(false)) {
    if (!scene.sys?.displayList) continue;
    walk(scene.sys.displayList.list as Phaser.GameObjects.GameObject[]);
  }
}
