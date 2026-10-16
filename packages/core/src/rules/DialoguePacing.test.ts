/**
 * @file DialoguePacing.test.ts
 * @description 257차 — 대사를 문장마다 가르고 쉬는 자리를 돌려주는 규칙 (vitest).
 * 규칙 사례 + core가 내보내는 모든 글(한국어 · 영어)에 대한 불변식. 빌드에서는 제외(tsconfig.build exclude).
 */
import { describe, expect, it } from 'vitest';
import { paceSentences } from './DialoguePacing.js';
import * as core from '../index.js';

/** 쉬는 자리 바로 앞의 글 조각 — 읽기 쉬운 단언용 */
const before = (text: string, pauses: number[]) => pauses.map((p) => text.slice(Math.max(0, p - 6), p));

describe('문장 가르기 · 쉬는 자리 (257차)', () => {
  it('한 단락의 문장마다 빈 줄로 가르고 문장 끝에서 쉰다', () => {
    const r = paceSentences('눈을 떴다. 천장 무늬가 낯설다. 이 집에서 잔 게 몇 해 만인지 세어 보다가 그만뒀다.');
    expect(r.text).toBe('눈을 떴다.\n\n천장 무늬가 낯설다.\n\n이 집에서 잔 게 몇 해 만인지 세어 보다가 그만뒀다.');
    expect(before(r.text, r.pauses)).toEqual(['눈을 떴다.', '무늬가 낯설다.'.slice(-6)]);
  });

  it('따옴표 · 이름표가 붙은 대사도 안에서 가른다', () => {
    expect(paceSentences('"안녕. 반가워요?"').text).toBe('"안녕.\n\n반가워요?"');
    expect(paceSentences('강두철 — "가자. 늦었다."').text).toBe('강두철 — "가자.\n\n늦었다."');
    expect(paceSentences('"그래." "알았어."').text).toBe('"그래."\n\n"알았어."');
  });

  it('시스템 줄 · 목록 줄은 가르지 않는다', () => {
    const others = '고르지 않은 답 — "좋아요." → ???   "싫어요." → ???';
    expect(paceSentences(others)).toEqual({ text: others, pauses: [] });
    const list = '- 우럭을 잡는다. 세 마리. (0/3)\n[완료] 미끼를 산다. 넉넉히.';
    expect(paceSentences(list)).toEqual({ text: list, pauses: [] });
  });

  it('소수 · 번호 · 영어 줄임말 · 머리글자 · 마침표 뒤 소문자에서는 가르지 않는다', () => {
    expect(paceSentences('1.5호 찌를 쓴다. 좋다.').text).toBe('1.5호 찌를 쓴다.\n\n좋다.');
    expect(paceSentences('1. 먼저 미끼를 단다.').text).toBe('1. 먼저 미끼를 단다.');
    expect(paceSentences('Mr. Kim waved. Then he left.').text).toBe('Mr. Kim waved.\n\nThen he left.');
    expect(paceSentences('J. Kim is here. Hi.').text).toBe('J. Kim is here.\n\nHi.');
    expect(paceSentences('It takes approx. two hours. Done.').text).toBe('It takes approx. two hours.\n\nDone.');
    expect(paceSentences('…잘 모르겠다. 정말.').text).toBe('…잘 모르겠다.\n\n정말.');
    expect(paceSentences('"그래. …아니, 됐다."').text).toBe('"그래.\n\n…아니, 됐다."');
    expect(paceSentences('Fine. ...whatever.').text).toBe('Fine.\n\n...whatever.');
  });

  it('원래 줄바꿈은 그대로 두고, 앞 줄이 문장으로 끝났으면 거기서도 쉰다', () => {
    const r = paceSentences('뒤집어 보니 글자가 있다.\n영금정.');
    expect(r.text).toBe('뒤집어 보니 글자가 있다.\n영금정.');
    expect(r.pauses).toEqual(['뒤집어 보니 글자가 있다.'.length]);
  });

  it('좁은 칸은 짧은 이웃끼리 합쳐 줄 수를 맞추되 쉬는 자리는 남긴다', () => {
    const src = '(시장 뒤에 누가 서 있다. 저 사람… 뭘 기다리는 거지? 벽에 붙어서 좀 보자.)';
    const r = paceSentences(src, { sep: '\n', maxLines: 3 });
    expect(r.text.split('\n')).toHaveLength(3);
    expect(r.text).toBe('(시장 뒤에 누가 서 있다.\n저 사람… 뭘 기다리는 거지?\n벽에 붙어서 좀 보자.)');
    expect(r.pauses).toHaveLength(3);
  });
});

/** core가 내보내는 값에서 글을 모두 모은다(함수 · 순환은 건너뛴다) */
function collectStrings(): string[] {
  const out = new Set<string>();
  const seen = new WeakSet<object>();
  const walk = (v: unknown, depth: number): void => {
    if (depth > 12) return;
    if (typeof v === 'string') { if (v.length >= 8) out.add(v); return; }
    if (!v || typeof v !== 'object') return;
    if (seen.has(v as object)) return;
    seen.add(v as object);
    if (v instanceof Map) { for (const [k, x] of v) { walk(k, depth + 1); walk(x, depth + 1); } return; }
    if (v instanceof Set) { for (const x of v) walk(x, depth + 1); return; }
    for (const x of Object.values(v as Record<string, unknown>)) walk(x, depth + 1);
  };
  for (const v of Object.values(core)) walk(v, 0);
  return [...out];
}

describe('core 전 말뭉치 불변식 (257차)', () => {
  const all = collectStrings();
  it('글을 넉넉히 모았다', () => { expect(all.length).toBeGreaterThan(5000); });

  it('글자는 그대로이고(공백만 바뀜) · 쉬는 자리는 오름차순 · 줄 머리에 닫는 부호가 오지 않는다', () => {
    const bad: string[] = [];
    let split = 0;
    for (const s of all) {
      const r = paceSentences(s);
      if (r.text.replace(/\s+/g, '') !== s.replace(/\s+/g, '')) bad.push(`글자 바뀜: ${s.slice(0, 60)}`);
      for (let i = 0; i < r.pauses.length; i++) {
        const p = r.pauses[i];
        if (p <= 0 || p >= r.text.length || (i > 0 && p <= r.pauses[i - 1])) bad.push(`쉬는 자리: ${s.slice(0, 60)}`);
      }
      const lines = r.text.split('\n');
      const orig = s.split('\n').map((l) => l.trim());   // 원래 줄 머리는 그대로 둔다(…로 여는 원문)
      for (const line of lines) if (/^(?:[)）」』”’\]】,!?]|\.(?!\.\.))/.test(line) && !orig.some((o) => o.startsWith(line.trim()))) bad.push(`줄 머리 부호: ${line.slice(0, 40)} ← ${s.slice(0, 50)}`);   // 말줄임(…)으로 여는 문장은 괜찮다
      if (r.pauses.length > 0) split++;
    }
    expect(bad.slice(0, 10)).toEqual([]);
    expect(split).toBeGreaterThan(1000);   // 여러 문장 글이 실제로 갈렸다
  });
});
