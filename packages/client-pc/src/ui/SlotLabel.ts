/**
 * @file SlotLabel.ts
 * @description 아이템 슬롯 이름표 — **글씨를 줄이지 않고 이름을 줄인다** (188차 사용자 리포트).
 *
 * 배경: 인벤토리·채비·쿨러·퀵슬롯 칸 아래 이름표가 긴 이름(`AMSTRONG 합사 원줄 1호 · 150m`)을
 * 칸 폭에 맞추려고 `setScale(칸폭 / 글자폭)`으로 축소해 **읽을 수 없는 크기**가 됐다.
 * 이제 이름표는 고정 글자 크기(`SLOT_LABEL_PX` 이상)를 지키고, 대신 문자열을 줄인다.
 *
 *   `AMSTRONG 합사 원줄 1호 · 150m` → (토큰) AMS · 합사 · 1호 · 150m → 칸에 맞는 조합 `AMS·합사·1호`
 *
 * 규칙:
 *  1. 원문(현재 언어로 번역된 표시 문자열)이 들어가면 그대로 쓴다.
 *  2. 토큰화 — 공백·`·`·`/`로 나누고 괄호는 따로 본다.
 *     - 라틴 대문자 브랜드(4자 이상)는 앞 3자(AMSTRONG → AMS)
 *     - 재질 바로 뒤 줄 범주어는 뺀다(`합사 원줄` → `합사`, `Nylon Leader` → `Nylon`) — 재질이 곧 줄 종류다
 *     - 긴 범주어는 짧게(`스피닝릴` → `릴`, `Spinning Reel` → `Reel`, `Fluorocarbon` → `Fluoro`)
 *     - 숫자 없는 괄호는 메모(`(수제)` `(밑밥용)`) — 첫 시도(괄호째 잇기) 이후로는 뺀다.
 *       숫자·크기 괄호(`(38cm)` `(특대)`)는 규격/크기 토큰으로 푼다.
 *  3. 괄호째 `·`로 이은 전체가 들어가면 그것을 쓴다.
 *  4. 아니면 **머리말(마지막 일반 단어 — 한·영 모두 명사구의 머리는 뒤)은 반드시 남기고**, 나머지 토큰의
 *     부분집합 중 칸에 들어가면서 정보 가중치 합이 가장 큰 조합을 고른다(원래 순서 유지, `·`로 잇기).
 *     가중치: 크기 > 첫 규격 > 첫 단어(어종·재질) > 브랜드 > 기타 수식어 > 둘째 이후 규격 > 약한 수식어(수제·고급·…의).
 *     머리말이 범용어(`세트`·`정식`·`Set`·`Bar`)면 첫 단어가 대신 필수다(`생선구이 정식` → `생선구이`).
 *  5. 그래도 안 들어가면 머리말을 `clampTextWidth`로 말줄임.
 *
 * 전체 이름은 각 패널의 호버 상태줄·툴팁·상세보기(우클릭)에서 그대로 보인다.
 */

import Phaser from 'phaser';
import { clampTextWidth } from './TextFit.js';
import { t as translate } from '../i18n/I18n.js';

/** 슬롯 이름표 최소 글자 크기(px) — 이보다 작게 그리지 않는다 (188차 — 7~8px 축소 금지) */
export const SLOT_LABEL_PX = 10;

/** 토큰 종류 */
type TokKind = 'word' | 'spec' | 'size' | 'note' | 'brand' | 'weak';
/** 토큰 — `paren`이면 원문에서 괄호 안에 있던 말 */
interface Tok { text: string; kind: TokKind; paren?: boolean }

/** 재질 단어 — 뒤따르는 `원줄/목줄`은 재질만으로 줄 종류가 읽히므로 뺀다 */
const MATERIAL_KO = /^(합사|나일론|카본|PE|모노|플로로)$/;
/** 재질 뒤에서만 빼는 줄 범주어 — `원줄 스풀`처럼 재질이 없으면 남긴다 */
const LINE_GENERIC_KO = /^(원줄|목줄)$/;
/** 긴 범주어 → 짧은 범주어 (뜻이 남는 범위에서만). 영어 줄 범주어는 재질 바로 뒤일 때만 뺀다 */
const SHORTEN: [RegExp, string][] = [
  [/스피닝릴/g, '릴'],
  [/\bSpinning Reel\b/gi, 'Reel'],
  [/\b(Braid(?:ed)?|Nylon|Fluorocarbon|Carbon|Mono|PE)\s+(?:Main\s+Line|Line|Leader)\b/gi, '$1'],
  [/\bFluorocarbon\b/g, 'Fluoro'],
  [/\bfluorocarbon\b/g, 'fluoro'],
];
/** 약한 수식어 — 칸이 모자라면 가장 먼저 빠진다 (같은 계열 안에서 구분력이 낮은 말) */
const WEAK_KO = new Set([
  '수제', '고급', '기본', '소형', '대형', '휴대용', '튜닝', '커스텀', '입문', '대용량', '낚시용',
  '옛', '낡은', '정밀', '업소용', '관상용', '장인', '특제', '초보', '일반', '실습생',
]);
const WEAK_EN = new Set([
  'of', 'for', 'the', 'a', 'an', 'with', 'and', '&', 'handmade', 'custom', 'tuned', 'premium',
  'basic', 'old', 'portable', 'small', 'large', 'beginner', 'starter', 'trainee', 'precision',
  'floating', 'sinking',
]);
/**
 * 범용 머리말 — `세트`·`정식`·`Set`·`Bar`처럼 혼자 남으면 무엇인지 모르는 말.
 * 머리말이 이것이면 **첫 단어를 머리 대신 반드시 남긴다**(`생선구이 정식` → `생선구이`, `Chocolate Bar` → `Chocolate`).
 */
const GENERIC_HEAD = new Set(['세트', '정식', '키트', '묶음', 'set', 'kit', 'bar', 'bundle', 'pack']);
/** 크기 괄호 — `(특대)`·`(소)`는 같은 이름끼리 구분하는 핵심이라 남긴다. 영어는 S/M/L/XL로 */
const SIZE_SHORT: Record<string, string> = {
  small: 'S', medium: 'M', large: 'L', 'x-large': 'XL', 'extra large': 'XL', 'extra-large': 'XL',
};
const SIZE_WORD = /^(소|중|대|특대|소형|중형|대형|S|M|L|XL|small|medium|large|x-large|extra[- ]large)$/i;
const HAS_DIGIT = /\d/;
/** 라틴 대문자 브랜드(4자 이상) → 앞 3자 */
const BRAND = /^[A-Z]{4,}$/;

function classify(raw: string): Tok {
  if (HAS_DIGIT.test(raw)) return { text: raw, kind: 'spec' };
  if (BRAND.test(raw)) return { text: raw.slice(0, 3), kind: 'brand' };
  if (WEAK_KO.has(raw) || WEAK_EN.has(raw.toLowerCase()) || /[가-힣]의$/.test(raw) || /'s$/i.test(raw)) {
    return { text: raw, kind: 'weak' };
  }
  return { text: raw, kind: 'word' };
}

/** 표시 문자열 → 토큰 열 (괄호는 note/spec/size 토큰으로, 나머지는 공백·`·`·`/`로 나눈다) */
function tokenize(display: string): Tok[] {
  let s = display;
  for (const [re, rep] of SHORTEN) s = s.replace(re, rep);
  const toks: Tok[] = [];
  const re = /\(([^()]*)\)|([^\s·/()]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m[1] !== undefined) {
      const inner = m[1].trim().replace(/\s*·\s*/g, '·');
      if (!inner) continue;
      if (HAS_DIGIT.test(inner)) toks.push({ text: inner.replace(/\s+/g, ''), kind: 'spec', paren: true });
      else if (SIZE_WORD.test(inner)) toks.push({ text: SIZE_SHORT[inner.toLowerCase()] ?? inner, kind: 'size', paren: true });
      else toks.push({ text: inner, kind: 'note', paren: true });
      continue;
    }
    const w = m[2];
    if (w === '-' || w === '—' || w === ',') continue;
    toks.push(classify(w));
  }
  // 재질 바로 뒤 `원줄/목줄` 제거 (KO) + 같은 말 중복 제거(`러버 45g (45g)`)
  const seen = new Set<string>();
  return toks.filter((tk, i) => {
    if (LINE_GENERIC_KO.test(tk.text) && i > 0 && MATERIAL_KO.test(toks[i - 1].text)) return false;
    if (seen.has(tk.text)) return false;
    seen.add(tk.text);
    return true;
  });
}

/** 토큰 열 → 문자열. `parenStyle`이면 괄호 토큰을 `(…)`로 앞 토큰에 붙인다 */
function join(toks: Tok[], parenStyle: boolean): string {
  let out = '';
  for (const tk of toks) {
    if (parenStyle && tk.paren) out += `(${tk.text})`;
    else out += (out ? '·' : '') + tk.text;
  }
  return out;
}

/** 부분집합 열거 상한 — 토큰이 이보다 많으면 가중치 낮은 것부터 미리 뺀다 (2^12 = 4096 조합) */
const MAX_OPTIONAL = 12;

/**
 * 표시 문자열을 `maxW` 안에 들도록 축약한다 — 들어가는 축약이 없으면 `null`.
 * 순수 함수(측정은 `measure` 콜백) — 원문 자체가 들어가는지는 호출측이 먼저 본다.
 *
 * @param measure 문자열 → 렌더 폭(px). 토큰별 폭의 합으로 후보를 고른 뒤, 고른 후보는 통째로 다시 잰다
 */
export function abbreviateSlotName(display: string, maxW: number, measure: (s: string) => number): string | null {
  const toks = tokenize(display);
  if (toks.length === 0) return null;

  // 괄호째 이은 전체 (가장 정보가 많은 축약)
  const full = join(toks, true);
  if (full !== display && measure(full) <= maxW) return full;

  const cur = toks.filter((tk) => tk.kind !== 'note');
  if (cur.length === 0) return null;
  let head = -1;
  for (let i = cur.length - 1; i >= 0; i--) if (cur[i].kind === 'word') { head = i; break; }
  const firstWord = cur.findIndex((tk) => tk.kind === 'word');
  const firstSpec = cur.findIndex((tk) => tk.kind === 'spec');
  // 머리말이 범용어(세트·Set…)면 첫 단어가 대신 필수 토큰이 되고, 범용 머리말은 선택 토큰으로 내려간다
  const genericHead = head >= 0 && firstWord >= 0 && firstWord !== head && GENERIC_HEAD.has(cur[head].text.toLowerCase());
  const must = genericHead ? firstWord : head;
  // 가중치: 크기 > 첫 규격 > 첫 단어 > 브랜드 > 기타 수식어 > 둘째 이후 규격 > 약한 수식어
  //   (첫 단어 + 둘째 규격 < 첫 규격 — 같은 계열(그럽 2인치/3인치)이 한 규칙으로 줄어들게)
  const weight = (i: number): number => {
    const tk = cur[i];
    if (genericHead && i === head) return 60;
    switch (tk.kind) {
      case 'size': return 45;
      case 'spec': return i === firstSpec ? 40 : 5;
      case 'brand': return 25;
      case 'weak': return 3;
      default: return i === firstWord ? 30 : 20;
    }
  };

  const sep = measure('·');
  const widths = cur.map((tk) => measure(tk.text));
  let optional = cur.map((_, i) => i).filter((i) => i !== must);
  if (optional.length > MAX_OPTIONAL) {
    optional = [...optional].sort((a, b) => weight(b) - weight(a)).slice(0, MAX_OPTIONAL).sort((a, b) => a - b);
  }

  interface Pick { idx: number[]; value: number; w: number }
  const picks: Pick[] = [];
  const n = optional.length;
  for (let mask = 0; mask < (1 << n); mask++) {
    const idx: number[] = must >= 0 ? [must] : [];
    let value = must >= 0 ? 1000 : 0;
    for (let b = 0; b < n; b++) if (mask & (1 << b)) { idx.push(optional[b]); value += weight(optional[b]); }
    if (idx.length === 0) continue;
    const w = idx.reduce((s, i) => s + widths[i], 0) + sep * (idx.length - 1);
    if (w > maxW) continue;
    picks.push({ idx: idx.sort((a, b) => a - b), value, w });
  }
  picks.sort((a, b) => b.value - a.value || b.w - a.w);
  for (const p of picks.slice(0, 6)) {
    const s = join(p.idx.map((i) => cur[i]), false);
    if (s !== display && measure(s) <= maxW) return s;
  }
  return null;
}

/** 축약도 안 들어갈 때 말줄임할 마지막 후보 — 머리말(범용 머리말이면 첫 단어, 단어가 없으면 첫 토큰) */
function lastResort(display: string): string {
  const toks = tokenize(display).filter((tk) => tk.kind !== 'note');
  const words = toks.filter((tk) => tk.kind === 'word');
  const head = words[words.length - 1];
  if (head && words.length > 1 && GENERIC_HEAD.has(head.text.toLowerCase())) return words[0].text;
  return head?.text ?? toks[0]?.text ?? display;
}

/**
 * 슬롯 이름표에 아이템 이름을 쓴다 — 글자 크기는 그대로 두고 `maxW` 안에 들 때까지 이름을 줄인다.
 *
 * @param label 이름표 Text (글자 크기는 호출측이 `SLOT_LABEL_PX` 이상으로 만든다)
 * @param name  원문(한국어) 아이템 이름 — 현재 언어로 번역한 뒤 축약한다
 * @param maxW  허용 폭(px)
 * @param suffix 축약하지 않고 항상 붙이는 꼬리(예: ` x3`)
 * @param maxLines wordWrap이 걸린 이름표(채비 소켓 등)의 허용 줄 수 — 넘으면 축약한다
 */
export function setSlotLabel(
  label: Phaser.GameObjects.Text, name: string, maxW: number, suffix = '', maxLines = 1,
): Phaser.GameObjects.Text {
  const display = translate(name);
  const fits = (): boolean => label.width <= maxW + 0.5 && label.getWrappedText().length <= maxLines;
  label.setScale(1);
  label.setText(display + suffix);
  if (maxW <= 0 || fits()) return label;

  const measure = (s: string): number => { label.setText(s); return label.width; };
  const sw = suffix ? measure(suffix) : 0;
  const best = abbreviateSlotName(display, maxW - sw, measure);
  if (best) {
    label.setText(best + suffix);
    if (fits()) return label;
  }
  // 마지막 수단 — 머리말을 말줄임 (꼬리는 지킨다)
  label.setText(lastResort(display));
  clampTextWidth(label, Math.max(8, maxW - sw));
  if (suffix) label.setText(label.text + suffix);
  return label;
}
