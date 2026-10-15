/**
 * @file check_inquiry.mjs
 * @description 253차 — 물어보기 데이터(`packages/core/src/db-schema/StoryInquiry*.ts`) 검사기.
 *
 *  - 소스에서 바로 읽는다(TypeScript `transpileModule` — core를 다시 빌드하지 않는다. 여럿이 묶음을 나눠 쓰는 동안 dist를 덮지 않게).
 *  - 편 · 사람 명부는 core 빌드본(`packages/core/dist` · 환경 변수 `CORE_DIST`)에서 온다.
 *  - 오류(✗): 참조(화제 · 사람 · 앞 물음 · 편 · 조사 목표) · 유일 id · 닿을 수 없는 화제 · 글 규칙(단락 짝 · 따옴표 · 이모지 · 내부 id · 영어 누락).
 *    경고(△): 길이 · 묻는 물음 없는 화제 · 꼬리 없는 사람.
 *
 *  사용: node tools/check_inquiry.mjs [--part 2] [--final]   (--final = 공통 화제마다 물음이 하나 이상)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const DIST = process.env.CORE_DIST ? path.resolve(process.env.CORE_DIST) : path.join(ROOT, 'packages/core/dist');
const core = await import(pathToFileURL(path.join(DIST, 'index.js')).href);
const { STORY_QUESTS, getStoryNpc } = core;

const SRC = path.join(ROOT, 'packages/core/src/db-schema');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'inquiry-'));
for (const f of ['StoryInquiryKit', 'StoryInquiry1', 'StoryInquiry2', 'StoryInquiry3', 'StoryInquiry']) {
  const js = ts.transpileModule(fs.readFileSync(path.join(SRC, `${f}.ts`), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  fs.writeFileSync(path.join(TMP, `${f}.js`), js);
}
const data = await import(`${pathToFileURL(path.join(TMP, 'StoryInquiry.js')).href}?t=${Date.now()}`);
const parts = {};
for (const n of [1, 2, 3]) parts[n] = await import(pathToFileURL(path.join(TMP, `StoryInquiry${n}.js`)).href);
fs.rmSync(TMP, { recursive: true, force: true });

const val = (k) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? undefined : process.argv[i + 1]; };
const onlyPart = val('part') ? Number(val('part')) : null;
const final = process.argv.includes('--final');
const TOPICS = data.INQUIRY_TOPICS, NODES = data.INQUIRY_NODES;
const partOfNode = new Map(); const partOfTopic = new Map();
for (const n of [1, 2, 3]) {
  for (const x of parts[n][`INQUIRY_NODES_${n}`]) partOfNode.set(x.id, n);
  for (const x of parts[n][`INQUIRY_TOPICS_${n}`]) partOfTopic.set(x.id, n);
}
const mine = (id, isNode) => onlyPart === null || (isNode ? partOfNode.get(id) : partOfTopic.get(id)) === onlyPart;

const errs = [], warns = [];
const E = (m) => errs.push(`✗ ${m}`), W = (m) => warns.push(`△ ${m}`);
const len = (s) => [...(s ?? '')].length;
const questIds = new Set(STORY_QUESTS.map((q) => q.id));
const T = new Map(), N = new Map();
const PREFIX = { person: 'p_', place: 'pl_', thing: 't_', word: 'w_', clue: 'c_' };
const EMOJI = /\p{Extended_Pictographic}/u, HANGUL = /[가-힣]/, QID = /\b[MN]\d{1,2}-\d{1,2}\b/;
const DEV = /(퀘스트|우호도|플래그|경험치|숙련도|트랙(?!터)|레일|아크|화제)/;
const text = (ko, en, where, kind) => {
  if (!ko?.trim() || !en?.trim()) E(`${where}: 빈 글`);
  if (EMOJI.test(ko) || EMOJI.test(en)) E(`${where}: 이모지`);
  if (/["“”]/.test(ko) || /["“”]/.test(en)) E(`${where}: 큰따옴표`);
  if (HANGUL.test(en ?? '')) E(`${where}: 영어에 한글`);
  if (QID.test(ko)) E(`${where}: 내부 편 id`);
  const dev = DEV.exec(ko); if (dev && kind !== 'note') E(`${where}: 개발 용어 「${dev[1]}」`);
  const pk = (ko ?? '').split('\n\n'), pe = (en ?? '').split('\n\n');
  if (pk.length !== pe.length) E(`${where}: 단락 수 한 ${pk.length} · 영 ${pe.length}`);
  if (/\n(?!\n)/.test((ko ?? '').replace(/\n\n/g, ''))) E(`${where}: 홑줄바꿈`);
};
for (const t of TOPICS) {
  if (T.has(t.id)) E(`화제 id 중복 ${t.id}`);
  T.set(t.id, t);
}
for (const n of NODES) { if (N.has(n.id)) E(`물음 id 중복 ${n.id}`); N.set(n.id, n); }
const gateRefs = (g, where) => {
  if (!g) return;
  for (const q of [g.questSeen, g.questDone, g.questActive, g.questNotDone]) if (q && !questIds.has(q)) E(`${where}: 없는 편 ${q}`);
  for (const t of g.topics ?? []) if (!T.has(t)) E(`${where}: 없는 화제 ${t}`);
  for (const a of g.asked ?? []) if (!N.has(a)) E(`${where}: 없는 물음 ${a}`);
  if (g.flag && !/^(choice|unlock|inq)\./.test(g.flag)) E(`${where}: 플래그 접두`);
};
for (const t of TOPICS) {
  if (!mine(t.id, false)) continue;
  const w = `화제 ${t.id}`;
  if (!PREFIX[t.kind]) E(`${w}: 갈래 ${t.kind}`);
  else if (!t.id.startsWith(PREFIX[t.kind])) E(`${w}: 접두 ${PREFIX[t.kind]}`);
  text(t.labelKo, t.labelEn, `${w} 이름`, 'label');
  text(t.noteKo, t.noteEn, `${w} 노트`, 'note');
  if (len(t.labelKo) > 14) W(`${w}: 이름 ${len(t.labelKo)}자 — 짧게`);
  const gates = !t.learnWhen ? [] : Array.isArray(t.learnWhen) ? t.learnWhen : [t.learnWhen];
  gates.forEach((g, i) => gateRefs(g, `${w} learnWhen[${i}]`));
}
const opened = new Set(NODES.flatMap((n) => n.opens ?? []));
let mineN = 0, chars = 0;
for (const n of NODES) {
  if (!mine(n.id, true)) continue;
  mineN++; chars += len(n.answerKo);
  const w = `물음 ${n.id}`;
  if (!getStoryNpc(n.npcId)) E(`${w}: 없는 사람 ${n.npcId}`);
  if (!n.id.startsWith(`${n.npcId}.`)) E(`${w}: id는 '<사람 id>.'로 시작`);
  if (!T.has(n.topic)) E(`${w}: 없는 화제 ${n.topic}`);
  if (n.parent) { const p = N.get(n.parent); if (!p) E(`${w}: 없는 앞 물음 ${n.parent}`); else if (p.npcId !== n.npcId) E(`${w}: 앞 물음이 다른 사람`); }
  for (const o of n.opens ?? []) if (!T.has(o)) E(`${w}: 여는 화제 없음 ${o}`);
  gateRefs(n.requires, `${w} requires`);
  text(n.askKo, n.askEn, `${w} 물음`, 'ask');
  text(n.answerKo, n.answerEn, `${w} 답`, 'answer');
  const la = len(n.askKo), lb = len(n.answerKo);
  if (la < 4 || la > 44) E(`${w}: 물음 ${la}자(4~44)`); else if (la > 36) W(`${w}: 물음 ${la}자 — 36자 이하 권장`);
  if (len(n.askEn) > 100) E(`${w}: 영어 물음 ${len(n.askEn)}자`);
  if (lb < 40) E(`${w}: 답 ${lb}자 — 너무 짧다`); else if (lb < 60) W(`${w}: 답 ${lb}자 — 60자 이상 권장`);
  if (lb > 320) E(`${w}: 답 ${lb}자 — 너무 길다`); else if (lb > 250) W(`${w}: 답 ${lb}자 — 240자 안팎 권장`);
  const e = n.effect;
  if (e?.affinity !== undefined && Math.abs(e.affinity) > 0.03) E(`${w}: 우호도 ±0.03 초과`);
  if (e?.flag && !/^choice\.[a-z0-9_.]+$/.test(e.flag)) E(`${w}: 플래그 choice.<소문자>`);
  if (e?.action) {
    const q = STORY_QUESTS.find((x) => x.id === e.action.questId);
    const o = q?.objectives[e.action.objectiveIndex];
    if (!q) E(`${w}: 조사 편 없음`);
    else if (!o?.actionKey) E(`${w}: 조사 목표 ${e.action.objectiveIndex}에 행동이 없다`);
    else if (q.giver !== n.npcId) E(`${w}: 조사 물음은 그 편 의뢰인(${q.giver})에게`);
    if (n.parent) E(`${w}: 조사 물음은 꼬리 질문 금지(requires.asked로 곁물음을 먼저)`);
    if (!(e.action.step >= 0 && e.action.step <= 2)) E(`${w}: step 0~2`);
  }
}
// 닿을 수 없는 화제 · 쓸모없는 화제
const used = new Set(NODES.filter((n) => !n.effect?.action).map((n) => n.topic));
const usedAny = new Set(NODES.map((n) => n.topic));
for (const t of TOPICS) {
  if (!mine(t.id, false) && !(final && !partOfTopic.has(t.id))) continue;
  if (!t.known && !t.learnWhen && !opened.has(t.id)) E(`화제 ${t.id}: 알게 될 길이 없다(known · learnWhen · opens)`);
  if (!usedAny.has(t.id)) (final ? E : W)(`화제 ${t.id}: 이 화제로 묻는 물음이 없다`);
  else if (!used.has(t.id)) W(`화제 ${t.id}: 조사 물음뿐 — 일반 목록에는 안 나온다`);
}
// 조사 단계 빠짐(조사 목표마다 단계별 열쇠 물음)
const keys = new Map();
for (const n of NODES) if (n.effect?.action) { const k = `${n.effect.action.questId}#${n.effect.action.objectiveIndex}`; (keys.get(k) ?? keys.set(k, new Set()).get(k)).add(n.effect.action.step); }
for (const [k, steps] of keys) if (onlyPart === null || onlyPart === 3) console.log(`   조사 ${k}: 열쇠 물음 단계 ${[...steps].sort().join(', ')}`);
// 사람별 물음 수 · 꼬리 수
const per = {};
for (const n of NODES) { if (!mine(n.id, true)) continue; const p = (per[n.npcId] ??= { n: 0, tail: 0 }); p.n++; if (n.parent) p.tail++; }
console.log(`물음 ${mineN} · 화제 ${TOPICS.filter((t) => mine(t.id, false)).length} · 답 평균 ${mineN ? Math.round(chars / mineN) : 0}자`);
for (const [id, p] of Object.entries(per)) { console.log(`   ${id}: 물음 ${p.n} · 꼬리 ${p.tail}`); if (!p.tail) W(`${id}: 꼬리 질문이 하나도 없다`); }
for (const m of errs) console.log(m);
for (const m of warns) console.log(m);
console.log(`오류 ${errs.length} · 경고 ${warns.length}`);
process.exit(errs.length ? 1 : 0);
