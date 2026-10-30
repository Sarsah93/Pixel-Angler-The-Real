/**
 * @file check_talks.mjs
 * @description 254차 — 이어지는 대화 묶음(`packages/core/src/db-schema/StoryTalk<묶음>.ts`) 검사기.
 *
 *  - 묶음 파일을 **소스에서 바로** 읽는다(TypeScript `transpileModule`) — 여럿이 묶음을 나눠 쓰는 동안 core dist를 서로 덮지 않게.
 *  - 편 · 사람 · 결말 · 끝내는 자리 답은 core 빌드본(`packages/core/dist` · 환경 변수 `CORE_DIST`)에서 온다.
 *  - 오류(✗) = `validateTalks`(참조 · 끝 규칙 · 막다른 길 · 글 규칙) — 반드시 고친다.
 *    경고(△) = 사람이 판단 — 말 길이 · 대사 길이 · 깎이는 말 없음 · 그 자리에 없는 사람에게 미치는 말 없음 · 남기고 안 읽는 표시.
 *
 *  290차 — 묶음은 `StoryTalk<묶음>.ts` 파일 전부(편 id 머리와 같은 이름 — M1 · N01 …). 묶음 검사에 더한다:
 *    덮개(그 묶음 편마다 받는 자리 · 끝내는 자리 대본 · 옛 답의 표시 · 보상 답 · 미루기 — `talkCoverageIssues`) ·
 *    호칭(주인공 말 속 부름말 — `--strict`면 가리키는 말도 오류).
 *
 *  사용: node tools/check_talks.mjs --part N19 [--strict]   (묶음 하나)
 *        node tools/check_talks.mjs --all [--strict]        (있는 묶음 전부)
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
const SRC = path.join(ROOT, 'packages/core/src/db-schema');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'talks-'));
const PARTS = fs.readdirSync(SRC).map((f) => /^StoryTalk([MN]\d+)\.ts$/.exec(f)?.[1]).filter(Boolean)
  .sort((a, b) => (a[0] === b[0] ? +a.slice(1) - +b.slice(1) : a < b ? -1 : 1));

const transpile = (file, outName) => {
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const out = path.join(TMP, outName);
  fs.writeFileSync(out, js);
  return out;
};
transpile(path.join(SRC, 'StoryTalkKit.ts'), 'StoryTalkKit.js');
async function loadPart(p) {
  const out = transpile(path.join(SRC, `StoryTalk${p}.ts`), `StoryTalk${p}.js`);
  return (await import(`${pathToFileURL(out).href}?t=${Date.now()}`))[`TALKS_${p}`];
}

const arg = (k) => process.argv.includes(`--${k}`);
const val = (k) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? undefined : process.argv[i + 1]; };
const parts = arg('all') ? PARTS : [val('part')];
if (parts.some((p) => !PARTS.includes(p))) { console.error(`--part ${PARTS.join('|')} 또는 --all`); process.exit(2); }

const len = (s) => [...(s ?? '')].length;
let errN = 0, warnN = 0;
// 표시를 읽는 쪽은 묶음을 넘나든다 — 전 묶음을 읽어 「남기고 아무도 안 읽는 표시」를 센다
const all = [];
for (const p of PARTS) { try { all.push(...(await loadPart(p))); } catch { /* 아직 없는 묶음 */ } }
const read = new Set();
for (const t of all) for (const n of Object.values(t.nodes)) for (const c of n.choices) {
  if (c.requires?.flag) read.add(c.requires.flag);
  if (c.requires?.notFlag) read.add(c.requires.notFlag);
}

for (const p of parts) {
  const talks = await loadPart(p);
  const errs = core.validateTalks(talks).map((m) => `✗ ${m}`);
  // 290차 — 덮개(이 묶음 편 = id 머리가 묶음 이름) · 호칭
  const own = new Set(core.STORY_QUESTS.filter((q) => q.id.split('-')[0] === p).map((q) => q.id));
  for (const m of core.talkCoverageIssues(talks, own)) errs.push(`✗ ${m}`);
  for (const t of talks) if (!own.has(t.questId)) errs.push(`✗ ${t.id}: 이 묶음 편이 아니다(${t.questId}) — 그 편 묶음 파일로`);
  for (const m of core.talkAddressWarnings(talks)) (arg('strict') ? errs : null)?.push(`✗ ${m}`);
  const warns = [];
  const stats = { talks: talks.length, nodes: 0, choices: 0, neg: 0, cross: 0, gated: 0, ko: 0, stance: { giver: 0, other: 0, mid: 0, self: 0 } };
  for (const t of talks) {
    const q = core.getStoryQuest(t.questId);
    let neg = 0, cross = 0;
    for (const [nid, n] of Object.entries(t.nodes)) {
      stats.nodes++;
      stats.ko += len(n.lineKo);
      if (len(n.lineKo) > 330) warns.push(`△ ${t.id}/${nid} 대사 ${len(n.lineKo)}자 — 330자 넘으면 대화창에서 세 번 넘게 밀린다`);
      if (!n.beats && len(n.lineKo) < 12) warns.push(`△ ${t.id}/${nid} 대사가 짧다(${len(n.lineKo)}자)`);
      if (!n.beats) warns.push(`△ ${t.id}/${nid} 대본 장면이 아니다(상대 대사 한 덩어리) — scene([...])으로`);
      for (const b of n.beats ?? []) {
        if (b.kind !== 'line') continue;
        stats.ko += len(b.ko);
        if (b.who !== 'player' && len(b.ko) > 140) warns.push(`△ ${t.id}/${nid} 한 줄 ${len(b.ko)}자 — 140자 넘으면 둘로 나누고 사이에 주인공 말을`);
      }
      for (const c of n.choices) {
        stats.choices++;
        if (c.stance) stats.stance[c.stance]++;
        if (c.requires) stats.gated++;
        const l = len(c.labelKo);
        if (!c.labelKo.startsWith('(') && (l < 4 || l > 45)) warns.push(`△ ${t.id}/${nid}/${c.id} 말 ${l}자(4~45)`);
        if (len(c.labelEn) > 110) warns.push(`△ ${t.id}/${nid}/${c.id} 영어 말 ${len(c.labelEn)}자(110 이하)`);
        for (const [npc, d] of Object.entries(c.affinity ?? {})) {
          if (d < 0) neg++;
          if (npc !== t.npcId) cross++;
        }
        for (const f of c.flags ?? []) if (!read.has(f)) warns.push(`△ ${t.id}/${nid}/${c.id} 표시 ${f} — 아무 대화도 읽지 않는다(필요 없으면 지운다)`);
      }
    }
    stats.neg += neg; stats.cross += cross;
    if (!neg && !Object.values(t.nodes).some((n) => n.beats)) warns.push(`△ ${t.id} 마음이 식는 말이 하나도 없다`);
    if (!cross && (q?.objectives ?? []).some((o) => o.npcId && o.npcId !== t.npcId)) warns.push(`△ ${t.id} 다른 인물이 얽힌 편인데 그 사람에게 미치는 말이 없다`);
  }
  console.log(`\n── 묶음 ${p} — 대화 ${stats.talks} · 단계 ${stats.nodes} · 말 ${stats.choices}(조건 ${stats.gated}) · 깎이는 말 ${stats.neg} · 다른 사람에게 미치는 말 ${stats.cross} · 대사 ${stats.ko.toLocaleString()}자`);
  console.log(`   입장 — 의뢰인 편 ${stats.stance.giver} · 맞은편 ${stats.stance.other} · 가운데 ${stats.stance.mid} · 제 생각 ${stats.stance.self}`);
  for (const e of errs) console.log(e);
  for (const w of warns) console.log(w);
  errN += errs.length; warnN += warns.length;
}
console.log(`\n오류 ${errN} · 경고 ${warnN}`);
process.exit(errN ? 1 : 0);
