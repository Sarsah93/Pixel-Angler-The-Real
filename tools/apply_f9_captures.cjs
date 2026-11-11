/**
 * apply_f9_captures.cjs — dev F9 [확정] 기록 → core 표(`ButcheryGuideOverrides.ts`) 굽기 (315차)
 *
 * 흐름: 손질 창 F9 편집기 [확정] → dev 서버(`/__dev/butchery-guide`)가 `tools/f9_captures/captures.json`에 합치고
 *       `log.jsonl`에 한 줄 남긴 뒤 이 도구를 부른다 → `packages/core/src/db-schema/ButcheryGuideOverrides.ts`.
 * 좌표만 담는다 — 판정 옵션(strong · tolerance …)은 core 스테이지가 그대로 가진다(F9 [복사] 스니펫의 opts 누락 함정이 없다).
 *
 * 실행: node tools/apply_f9_captures.cjs            (captures.json → TS)
 *       node tools/apply_f9_captures.cjs --check    (바꾸지 않고 건수만)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'tools/f9_captures/captures.json');
const OUT = path.join(ROOT, 'packages/core/src/db-schema/ButcheryGuideOverrides.ts');

const r3 = (v) => Math.round(Number(v) * 1000) / 1000;
const okPt = (p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y));
const pt = (p) => `{ x: ${r3(p.x).toFixed(3)}, y: ${r3(p.y).toFixed(3)} }`;
const line = (a) => `[${a.filter(okPt).map(pt).join(', ')}]`;

function load() {
  if (!fs.existsSync(SRC)) return {};
  const t = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  return t && typeof t === 'object' ? t : {};
}

/** 한 항목을 TS 리터럴로 — 알 수 없는 필드는 버린다 */
function entryTs(o, pad) {
  const out = [];
  if (Array.isArray(o.guidePaths) && o.guidePaths.length > 1) {
    out.push(`${pad}  guidePaths: [\n${o.guidePaths.map((l) => `${pad}    ${line(l)},`).join('\n')}\n${pad}  ],`);
  } else if (Array.isArray(o.guidePath) && o.guidePath.length >= 2) {
    out.push(`${pad}  guidePath: ${line(o.guidePath)},`);
  }
  if (Array.isArray(o.sweepPath) && o.sweepPath.length >= 2) out.push(`${pad}  sweepPath: ${line(o.sweepPath)},`);
  if (okPt(o.tapPoint)) out.push(`${pad}  tapPoint: ${pt(o.tapPoint)},`);
  if (o.familyFrame) out.push(`${pad}  familyFrame: true,`);
  if (typeof o.at === 'string') out.push(`${pad}  at: ${JSON.stringify(o.at)},`);
  return out.join('\n');
}

function render(table) {
  const keys = Object.keys(table).sort();
  let n = 0;
  const body = keys.map((k) => {
    const st = table[k] ?? {};
    const ids = Object.keys(st).sort();
    const rows = ids.map((id) => { n++; return `    ${JSON.stringify(id)}: {\n${entryTs(st[id], '    ')}\n    },`; });
    return `  ${JSON.stringify(k)}: {\n${rows.join('\n')}\n  },`;
  }).join('\n');
  const ts = `/**
 * ButcheryGuideOverrides — dev F9 **[확정]**으로 저장한 손질 유도선 좌표 (315차).
 *
 * ⚠ 자동 생성 — 손으로 고치지 않는다. 원본은 \`tools/f9_captures/captures.json\`이고
 *   \`node tools/apply_f9_captures.cjs\`가 이 파일을 다시 쓴다(dev 서버의 [확정]도 저장 직후 같은 도구를 부른다).
 * 키 = 어종 id 또는 \`@<어종군>\` → 스테이지 id → 좌표. 스테이지를 다 지은 뒤 좌표만 바꿔 끼운다(\`applyGuideOverrides\`).
 */
import type { ButcheryGuideOverrideTable } from '../types/Butchery.js';

export const BUTCHERY_GUIDE_OVERRIDES: ButcheryGuideOverrideTable = {${keys.length ? `\n${body}\n` : ''}};
`;
  return { ts, n, keys: keys.length };
}

const table = load();
const { ts, n, keys } = render(table);
if (process.argv.includes('--check')) {
  console.log(`[apply_f9_captures] ${keys}개 키 · ${n}개 스테이지 (바꾸지 않음)`);
} else {
  const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (prev !== ts) fs.writeFileSync(OUT, ts, 'utf8');
  console.log(`[apply_f9_captures] ${keys}개 키 · ${n}개 스테이지 → ${path.relative(ROOT, OUT)}${prev === ts ? ' (그대로)' : ''}`);
}
