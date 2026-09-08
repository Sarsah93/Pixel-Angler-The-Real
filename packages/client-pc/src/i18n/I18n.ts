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
} from '@tra/core';
import { EN_PLACES } from './places.js';
import { EN_DICT, EN_RULES } from './en.js';

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
  for (const [ko, en] of Object.entries(EN_PLACES)) put(ko, en);
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
  /(\s{2,})/, /(·)/,
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
  if (game) refreshAll(game);
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
