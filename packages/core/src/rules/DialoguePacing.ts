/**
 * @file DialoguePacing.ts
 * @description 257차 — 대사는 한 문장씩 숨을 쉬며 흐른다.
 *
 * 사용자 지시(원문): 「대사를 전개할 때, 한 문장이 끝나면 줄바꿈을 해줘야 할 것 같아 … 실제로 말을 할 때,
 * 저렇게 빠르게 말하지 않으니까」 · 「모든 대화 내용에도 저렇게 문장 간 쉬는 구간을 만들어줘야 할 것 같아」.
 *
 * - 단락 하나를 문장으로 가른다. 문장 끝(. ? ! … 。 ！ ？ — 닫는 따옴표 · 괄호까지) 뒤에 공백이 오고,
 *   그다음 글자가 새 문장의 첫 글자(글자 · 숫자 · 여는 따옴표 · 괄호)일 때만 가른다.
 * - 가른 자리에는 `sep`(기본 빈 줄)을 넣고, 찍는 쪽이 쉬어 갈 자리(그만큼 찍은 뒤)를 돌려준다.
 * - 원래 있던 줄바꿈은 그대로 둔다. 앞 줄이 문장으로 끝났으면 거기서도 쉰다.
 * - 목록 줄(「- …」 · 「• …」 · 「[완료] …」)은 가르지도, 쉬지도 않는다.
 * - `maxLines` — 칸이 좁은 곳(컷씬 하단 띠)은 이웃한 두 문장 중 합이 가장 짧은 쌍을 한 줄로 합쳐 줄 수를 맞춘다.
 *   합친 줄 안에서도 쉬는 자리는 그대로 남는다.
 *
 * 가르지 않는 자리: 소수(1.5호 — 뒤에 공백 없음) · 번호(「1. 먼저」) · 영어 줄임말(Mr. · Dr. · e.g.) ·
 * 머리글자(J. Kim) · 마침표 뒤 영어 소문자(approx. two) · 앞에 글자가 없는 말줄임(「… 잘」) ·
 * 시스템 줄의 「→ ???」 · 다음 글자가 화살표 · 가운뎃점처럼 문장을 시작하지 않는 글자.
 *
 * 번역을 거친 **뒤의** 글에 쓴다 — 사전 열쇠는 원문 단락 그대로다.
 */

/** 문장 사이에서 쉬는 시간(ms) — 대화창 · 혼잣말 · 컷씬 공통 */
export const SENTENCE_PAUSE_MS = 450;

/** 가른 결과 — `text`는 문장 사이에 줄바꿈이 들어간 글, `pauses`는 쉬어 갈 자리(그만큼 찍은 뒤 · 오름차순) */
export interface PacedText {
  text: string;
  pauses: number[];
}

export interface PaceOptions {
  /** 문장 사이에 넣을 것 — 기본 빈 줄(`'\n\n'`) */
  sep?: string;
  /** 문장 줄이 이보다 많으면 짧은 이웃끼리 한 줄로 합친다(쉬는 자리는 남는다) */
  maxLines?: number;
}

const END = new Set(['.', '!', '?', '…', '。', '！', '？']);
const CLOSE = new Set(['"', '\'', '”', '’', '」', '』', ')', '）', ']', '】']);
/** 새 문장의 첫 글자 — 글자 · 숫자 · 여는 따옴표 · 괄호 · 말줄임(…) */
const START = /[\p{L}\p{N}"'“‘「『(（[【…]/u;
const LETTER = /[\p{L}\p{N}]/u;
/** 영어 줄임말 — 뒤에서 가르지 않는다 */
const ABBR = /(?:^|[\s("“‘])(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|Mt|vs|No|Vol|approx|e\.g|i\.e)$/i;
/** 목록 줄 — 가르지 않는다 */
const LIST_LINE = /^\s*(?:[-•·]\s|\[[^\]\n]{1,12}\]\s)/;

/** 한 줄 안의 문장 조각 — `inner`는 합쳐진 조각 안의 쉬는 자리(조각 첫 글자부터 센 글자 수) */
interface Piece {
  text: string;
  inner: number[];
  /** 앞 조각과 원래 줄바꿈으로 갈라졌다(합치지 않는다) */
  hard: boolean;
  /** 앞 조각이 끝난 자리에서 쉰다 */
  pauseBefore: boolean;
}

/** `head`(문장 끝 무리 앞 글)와 무리(`run`)를 보고 여기서 갈라도 되는지 */
function breakable(head: string, run: string, next: string): boolean {
  if (!LETTER.test(head)) return false;                       // 「… 잘」 — 앞에 글자가 없는 말줄임
  if (/→\s*$/.test(head)) return false;                       // 시스템 줄 「"…" → ???」
  if (run === '.') {
    if (/(?:^|\s)\d+$/.test(head)) return false;              // 번호 「1.」
    if (ABBR.test(head)) return false;                        // Mr. · Dr. · e.g.
    if (/(?:^|[\s("“‘])\p{Lu}$/u.test(head)) return false;    // 머리글자 J.
    if (/[a-z]/.test(next)) return false;                     // approx. two — 같은 문장
  }
  return true;
}

/** 줄 하나를 문장 조각으로 가른다 */
function splitLine(line: string): string[] {
  if (LIST_LINE.test(line)) return [line];
  const out: string[] = [];
  let start = 0;
  let i = 0;
  while (i < line.length) {
    if (!END.has(line[i])) { i++; continue; }
    let j = i;
    while (j < line.length && END.has(line[j])) j++;          // 마침표 무리(… · ?! · ...)
    let k = j;
    while (k < line.length && CLOSE.has(line[k])) k++;        // 닫는 따옴표 · 괄호
    let m = k;
    while (m < line.length && /\s/.test(line[m])) m++;
    const starts = m < line.length && (START.test(line[m]) || line.startsWith('...', m));   // 「…아니」 · 「...well」도 새 문장
    if (m > k && starts && breakable(line.slice(start, i), line.slice(i, j), line[m])) {
      out.push(line.slice(start, k).trim());
      start = m;
      i = m;
      continue;
    }
    i = Math.max(k, i + 1);
  }
  out.push(line.slice(start).trim());
  return out.filter((p) => p.length > 0);
}

/** 문장으로 끝나는 줄인가(닫는 따옴표 · 괄호는 건너 본다) */
function endsSentence(s: string): boolean {
  let e = s.length - 1;
  while (e >= 0 && CLOSE.has(s[e])) e--;
  return e >= 0 && END.has(s[e]);
}

/**
 * 단락을 문장마다 줄을 바꿔 다시 쓰고, 찍는 쪽이 쉬어 갈 자리를 함께 돌려준다.
 * 문장이 하나뿐이면 글은 그대로이고 쉬는 자리는 원래 줄바꿈에만 생긴다.
 */
export function paceSentences(text: string, opts: PaceOptions = {}): PacedText {
  const sep = opts.sep ?? '\n\n';
  const pieces: Piece[] = [];
  const lines = text.split('\n');
  lines.forEach((line, li) => {
    const parts = splitLine(line);
    const prevLine = li > 0 ? lines[li - 1] : '';
    const prevPause = li > 0 && !LIST_LINE.test(prevLine) && endsSentence(prevLine.trimEnd());
    if (parts.length === 0) {
      // 빈 줄 — 원래 빈 줄은 그대로 남긴다
      pieces.push({ text: '', inner: [], hard: li > 0, pauseBefore: false });
      return;
    }
    parts.forEach((p, pi) => pieces.push({
      text: p, inner: [], hard: li > 0 && pi === 0, pauseBefore: pi === 0 ? prevPause : true,
    }));
  });

  // 좁은 칸 — 원래 줄바꿈이 아닌 이웃 둘 중 합이 가장 짧은 쌍을 합친다
  const maxLines = opts.maxLines ?? Infinity;
  while (pieces.length > maxLines) {
    let best = -1;
    let bestLen = Infinity;
    for (let a = 0; a + 1 < pieces.length; a++) {
      if (pieces[a + 1].hard) continue;
      const len = pieces[a].text.length + pieces[a + 1].text.length;
      if (len < bestLen) { bestLen = len; best = a; }
    }
    if (best < 0) break;
    const a = pieces[best], b = pieces[best + 1];
    const joined: Piece = {
      text: `${a.text} ${b.text}`,
      inner: [...a.inner, a.text.length, ...b.inner.map((x) => x + a.text.length + 1)],
      hard: a.hard,
      pauseBefore: a.pauseBefore,
    };
    pieces.splice(best, 2, joined);
  }

  let out = '';
  const pauses: number[] = [];
  pieces.forEach((p, idx) => {
    if (idx > 0) {
      if (p.pauseBefore && out.length > 0) pauses.push(out.length);
      out += p.hard ? '\n' : sep;
    }
    for (const off of p.inner) pauses.push(out.length + off);
    out += p.text;
  });
  return { text: out, pauses };
}
