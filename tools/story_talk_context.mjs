/**
 * @file story_talk_context.mjs
 * @description 290차 — 대본(주고받는 장면)을 쓰기 전에 읽을 **편별 문맥**을 뽑는다(받는 자리 · 끝내는 자리 대본 집필용).
 *
 *  - 묶음(1~10)의 편마다: 제목 · 의뢰인(이름 · 나이 · 직업) · 정책 · 앞 편 · 설계 요약 · 목표 · 일지 서두 · 옛 받는 말 · 끝내는 말 · 맺음 ·
 *    영업시간 단서 · 옛 받는 답 · 보상 답(id · 라벨 · 응답 · 결과 · 조건 — 대본의 끝이 이 id에 묶인다) · 진행 중 물음(287) ·
 *    이미 있는 대화(254 · 286 — 고쳐 쓴다) · 이 편이 정하는 결말.
 *  - core 빌드본(`packages/core/dist` · 환경 변수 `CORE_DIST`)을 읽는다.
 *
 *  사용: node tools/story_talk_context.mjs --batch 3 [--out <파일.md>]
 *        node tools/story_talk_context.mjs --list           (묶음 표)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.CORE_DIST ? path.resolve(process.env.CORE_DIST) : path.join(ROOT, 'packages/core/dist');
const core = await import(pathToFileURL(path.join(DIST, 'index.js')).href);
const {
  STORY_QUESTS, getStoryQuest, getStoryNpc, narrativeOf, choicesFor, progressAskOf, STORY_TALKS, STORY_ENDINGS, STORY_ARCS,
} = core;

/** 묶음 — 이야기(편 id 머리)를 묶는다. 한 묶음 = 한 사람이 쓴다(말투가 한 손에서) */
export const TALK_BATCHES = {
  1: ['M1', 'M2'],
  2: ['M3', 'M4'],
  3: ['M5', 'M6'],
  4: ['M7', 'N21', 'N24'],
  5: ['N01', 'N02', 'N03'],
  6: ['N04', 'N05', 'N06', 'N07'],
  7: ['N08', 'N09', 'N10', 'N11', 'N12', 'N13'],
  8: ['N14', 'N15', 'N16', 'N17', 'N18'],
  9: ['N19', 'N20'],
  10: ['N22', 'N23'],
};

const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? undefined : process.argv[i + 1]; };
const has = (k) => process.argv.includes(`--${k}`);

const npcLine = (id) => {
  if (!id) return '(없음 — 혼자 하는 일)';
  const n = getStoryNpc(id);
  return n ? `${id} = ${n.nameKo} (${n.nameEn}) — ${n.roleKo}` : `${id} (없는 사람)`;
};
const out1 = (o) => JSON.stringify(o);

function questBlock(q) {
  const n = narrativeOf(q.id) ?? {};
  const set = choicesFor(q);
  const L = [];
  L.push(`### ${q.id} 「${q.titleKo}」 / ${q.titleEn}`);
  L.push('');
  L.push(`- 종류 ${q.kind === 'main' ? '메인(거절 · 미루기 없음)' : '곁가지'} · 받는 정책 ${q.offerPolicy ?? 'standard'} · 장 ${q.chapter} · 지역 ${q.region}`);
  L.push(`- 의뢰인 ${npcLine(q.giver)}`);
  if (q.prereq?.length) L.push(`- 앞 편: ${q.prereq.map((id) => `${id} 「${getStoryQuest(id)?.titleKo ?? ''}」`).join(' · ')}`);
  L.push(`- 설계 요약(화면에 안 나온다): ${q.descKo}`);
  L.push('- 목표:');
  q.objectives.forEach((o, i) => {
    const label = n.objectives?.[i] ?? o.labelKo;
    L.push(`  ${i}) [${o.kind}${o.manual ? ' · 수동' : ''}${o.actionKey ? ' · 행동' : ''}] ${label}${o.npcId ? ` (상대 ${npcLine(o.npcId)})` : ''}`);
  });
  if (n.intro) L.push(`- 일지 서두(주인공 1인칭 — 대화창에는 안 나온다 · 상황 파악용): ${n.intro}`);
  if (n.offer) L.push(`- 옛 받는 말(이 사람 말투의 기준 · 대본으로 풀어 쓴다): ${n.offer}`);
  if (n.done) L.push(`- 옛 끝내는 말: ${n.done}`);
  if (n.epilogue) L.push(`- 맺음(일지): ${n.epilogue}`);
  if (n.hint) L.push(`- 영업시간 단서(대화창이 따로 빨간 글로 찍는다 — 대본에 다시 쓰지 않는다): ${n.hint}`);
  L.push('- 옛 받는 답(대본의 받는 끝은 `end: endTalk({ accept: true, offer: \'<id>\' })` — 미루는 답이면 `decline: true, offer: \'<id>\'`):');
  for (const c of set.offer) {
    L.push(`  - \`${c.id}\` 「${c.labelKo}」 → 응답 「${c.replyKo}」 · 결과 ${out1(c.outcome)}${c.requires ? ` · 조건 ${out1(c.requires)}` : ''}`);
  }
  L.push('- 보상 답(대본의 끝내는 끝은 `end: endTalk({ complete: \'<id>\', lineKo, lineEn })` — **전부** 어딘가의 끝에 묶는다):');
  for (const c of set.complete) {
    L.push(`  - \`${c.id}\` 「${c.labelKo}」 → 응답 「${c.replyKo}」 · 결과 ${out1(c.outcome)}${c.requires ? ` · 조건 ${out1(c.requires)}` : ''}`);
  }
  const asks = q.objectives.map((_, i) => progressAskOf(q.id, i)).map((a, i) => (a ? `  ${i}) 물음 「${a.askKo}」 · 내 답 「${a.answerKo}」 · 조언 「${a.replyKo}」` : null)).filter(Boolean);
  if (asks.length) { L.push('- 진행 중 물음(287 — 이미 있다 · 대본과 겹치지 않게):'); L.push(...asks); }
  const talks = STORY_TALKS.filter((t) => t.questId === q.id);
  if (talks.length) {
    L.push(`- 이미 있는 대화(파일에 있다 — 고쳐 쓴다. 단계 id · 고를 말 id · 표시 · 우호도 · 조건 · 끝 · 결말은 그대로): ${talks.map((t) => `${t.id}(${t.at}${t.objectiveIndex !== undefined ? ` ${t.objectiveIndex}` : ''}${t.step !== undefined ? `/${t.step}` : ''} · ${Object.values(t.nodes).some((x) => x.beats) ? '대본' : '옛 꼴'})`).join(' · ')}`);
  }
  const ends = STORY_ENDINGS.filter((e) => e.questId === q.id);
  if (ends.length) L.push(`- 이 편이 정하는 결말: ${ends.map((e) => `${e.id}(${e.kind} 「${e.titleKo}」)`).join(' · ')}`);
  const arc = STORY_ARCS.find((a) => a.questIds.includes(q.id));
  if (arc) {
    const idx = arc.questIds.indexOf(q.id);
    const next = arc.questIds[idx + 1];
    L.push(`- 이야기 「${arc.titleKo}」 ${idx + 1}/${arc.questIds.length}편${next ? ` · 다음 편 제목만(내용은 스포일러 — 앞당기지 않는다): 「${getStoryQuest(next)?.titleKo ?? ''}」` : ' · 마지막 편'}`);
  }
  L.push('');
  return L.join('\n');
}

if (has('list')) {
  for (const [b, parts] of Object.entries(TALK_BATCHES)) {
    const qs = STORY_QUESTS.filter((q) => parts.includes(q.id.split('-')[0]) && q.giver);
    console.log(`${b}: ${parts.join(' · ')} — ${qs.length}편`);
  }
  process.exit(0);
}

const b = Number(arg('batch'));
const parts = TALK_BATCHES[b];
if (!parts) { console.error('--batch 1~10 또는 --list'); process.exit(2); }
const qs = STORY_QUESTS.filter((q) => parts.includes(q.id.split('-')[0]));
const givers = [...new Set(qs.map((q) => q.giver).filter(Boolean))];
const L = [`# 290차 대본 문맥 — 묶음 ${b} (${parts.join(' · ')}) · ${qs.length}편`, ''];
L.push('## 인물(의뢰인) — 말투는 아래 편들의 옛 받는 말 · 끝내는 말을 읽고 맞춘다', '');
for (const g of givers) L.push(`- ${npcLine(g)} — 의뢰 ${qs.filter((q) => q.giver === g).map((q) => q.id).join(' · ')}`);
const others = [...new Set(qs.flatMap((q) => q.objectives.map((o) => o.npcId)).filter((x) => x && !givers.includes(x)))];
if (others.length) { L.push('', '목표에 나오는 다른 사람:'); for (const o of others) L.push(`- ${npcLine(o)}`); }
L.push('');
for (const p of parts) {
  L.push(`## 묶음 파일 \`packages/core/src/db-schema/StoryTalk${p}.ts\` (내보내는 이름 \`TALKS_${p}\`)`, '');
  for (const q of qs.filter((x) => x.id.split('-')[0] === p)) L.push(questBlock(q));
}
const text = L.join('\n');
const out = arg('out');
if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, text); console.log(`${out} — ${qs.length}편 · ${text.length.toLocaleString()}자`); }
else console.log(text);
