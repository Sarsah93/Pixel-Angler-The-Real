/**
 * @file story_choice_context.mjs
 * @description 253차 — 퀘스트 답 깊이(`StoryChoiceDepth*.ts`)를 쓰기 전에 읽을 **편별 문맥**을 뽑는다.
 *
 *  - 묶음(1~8)의 편마다: 제목 · 발주자 · 정책 · 설계 요약 · 목표 · 나레이션(서두 · 받는 말 · 끝내는 말 · 맺음) ·
 *    지금 답(출처 · 결과) · 해야 할 것(받는 자리 새로 / 더하기 · 끝내는 자리 더하기 · 응답 늘리기 대상).
 *  - core 빌드본(`packages/core/dist` · 환경 변수 `CORE_DIST`로 바꿀 수 있다)을 읽는다 — 답 깊이 데이터는 **빼고**(원래 답 기준) 보여 준다.
 *
 *  사용: node tools/story_choice_context.mjs --batch 1 [--out <파일.md>]
 *        node tools/story_choice_context.mjs --ids M1-06,M2-01
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// CORE_DIST = core 빌드본 위치(기본 packages/core/dist — 여럿이 나눠 쓰는 동안은 사본을 가리키게 할 수 있다)
const DIST = process.env.CORE_DIST ? path.resolve(process.env.CORE_DIST) : path.join(ROOT, 'packages/core/dist');
const core = await import(pathToFileURL(path.join(DIST, 'index.js')).href);
const { STORY_QUESTS, narrativeOf, getStoryNpc, toneOfferChoices, selfOfferChoices, selfCompleteChoices, defaultCompleteChoices, STORY_NARRATIVE_EN } = core;

/** 묶음 — 편 id → 1~8 */
export function batchOf(id) {
  if (/^M[12]-/.test(id)) return 1;
  if (/^M[34]-/.test(id)) return 2;
  if (/^M[567]-/.test(id)) return 3;
  const m = /^N(\d+)-/.exec(id); const n = m ? +m[1] : 0;
  if (n >= 1 && n <= 4) return 4;
  if (n >= 5 && n <= 9) return 5;
  if (n >= 10 && n <= 17) return 6;
  if (n >= 18 && n <= 20) return 7;
  if (n >= 21) return 8;
  return 0;
}

/** 답 깊이를 뺀 원래 답 + 출처 */
export function baseChoices(q) {
  const n = narrativeOf(q.id);
  const solo = !q.giver;
  let offerSrc, offer;
  if (n?.offerChoices) { offer = n.offerChoices; offerSrc = '나레이션'; }
  else if (q.choices?.offer) { offer = q.choices.offer; offerSrc = '퀘스트 정의'; }
  else if (solo) { offer = selfOfferChoices(); offerSrc = '혼잣말 표준'; }
  else { offer = toneOfferChoices(q.kind); offerSrc = '표준 톤'; }
  let completeSrc, complete;
  if (n?.complete) { complete = n.complete; completeSrc = '나레이션'; }
  else if (q.choices?.complete) { complete = q.choices.complete; completeSrc = '퀘스트 정의'; }
  else if (solo) { complete = selfCompleteChoices(); completeSrc = '혼잣말 표준'; }
  else { complete = defaultCompleteChoices(q); completeSrc = '표준(종류별)'; }
  return { offer, offerSrc, complete, completeSrc, hasNarrOffer: !!n?.offerChoices };
}

const fmtOut = (o) => JSON.stringify(o);
const len = (s) => [...(s ?? '')].length;

function questBlock(q) {
  const npc = q.giver ? getStoryNpc(q.giver) : undefined;
  const n = narrativeOf(q.id);
  const en = STORY_NARRATIVE_EN[q.id] ?? {};
  const b = baseChoices(q);
  const policy = q.offerPolicy ?? 'standard';
  const needDecline = !!q.giver && (policy === 'once' || policy === 'event');
  const L = [];
  L.push(`## ${q.id} 「${q.titleKo}」 (${q.titleEn})`);
  L.push('');
  L.push(`- 종류: ${q.kind === 'main' ? '메인' : '서브'} · ${q.chapter}장${q.arcId ? ` · 아크 ${q.arcId}` : ''} · 정책 ${policy}${q.giver ? '' : ' · **무발주(혼자 하는 일)**'}`);
  if (npc) L.push(`- 발주자: ${npc.nameKo} (${npc.nameEn}) — ${npc.roleKo} / id \`${q.giver}\``);
  if (q.prereq?.length) L.push(`- 앞 편: ${q.prereq.join(', ')}`);
  L.push(`- 설계 요약: ${q.descKo}`);
  L.push(`- 목표: ${(n?.objectives ?? q.objectives.map((o) => o.labelKo ?? o.kind)).join(' / ')}`);
  if (n?.intro) L.push(`- 서두(주인공): ${n.intro}`);
  if (n?.offer) L.push(`- 받는 자리 말(ko): ${n.offer}\n- 받는 자리 말(en): ${en.offer ?? '(없음)'}`);
  // 287차 — 진행 중 말은 목표마다 물음 · 내 답 · 조언
  for (const p of core.STORY_PROGRESS_ASKS?.[q.id] ?? []) L.push(`- 진행 중 물음: ${p.askKo} → 나 「${p.answerKo}」 → ${p.replyKo}`);
  if (n?.done) L.push(`- 끝낼 때 말(ko): ${n.done}\n- 끝낼 때 말(en): ${en.done ?? '(없음)'}`);
  if (n?.epilogue) L.push(`- 맺음(주인공): ${n.epilogue}`);
  L.push('');
  L.push(`### 지금 받는 자리 답 — 출처 ${b.offerSrc}`);
  L.push('');
  b.offer.forEach((c, i) => L.push(`${i + 1}. \`${c.id}\` ${c.labelKo} / ${c.labelEn}\n   → ${c.replyKo} (${len(c.replyKo)}자)\n   → ${c.replyEn}\n   결과 ${fmtOut(c.outcome)}${c.requires ? ` · 조건 ${fmtOut(c.requires)}` : ''}`));
  L.push('');
  L.push(`### 지금 끝내는 자리 답 — 출처 ${b.completeSrc}`);
  L.push('');
  b.complete.forEach((c, i) => L.push(`${i + 1}. \`${c.id}\` ${c.labelKo} / ${c.labelEn}\n   → ${c.replyKo} (${len(c.replyKo)}자)\n   → ${c.replyEn}\n   결과 ${fmtOut(c.outcome)}${c.requires ? ` · 조건 ${fmtOut(c.requires)}` : ''}`));
  L.push('');
  L.push('### 해야 할 것');
  L.push('');
  if (b.hasNarrOffer) {
    L.push(`- 받는 자리: 나레이션 답 ${b.offer.length}개가 있다 → \`offerAdd\` ${Math.max(1, 3 - b.offer.length)}개 이상(합쳐 3~5개 · 태도가 다른 답)${needDecline && !b.offer.some((c) => c.outcome.decline) ? ' · **미루기 답(dNo) 필요**' : ''}`);
    const short = b.offer.filter((c) => len(c.replyKo) < 60).map((c) => `\`${c.id}\`(${len(c.replyKo)}자)`);
    if (short.length) L.push(`- 받는 자리 응답 늘리기(\`offerReply\`): ${short.join(', ')}`);
  } else {
    L.push(`- 받는 자리: \`offer\` 3~4개를 **새로**(지금 답은 ${b.offerSrc} — 대체된다)${needDecline ? ' · **미루기 답(dNo) 반드시 포함**' : ''}${q.giver ? '' : ' · 혼잣말(우호도 · 미루기 · 보상 금지, 플래그만 가능)'}`);
  }
  const visible = b.complete.filter((c) => !c.requires).length;
  L.push(`- 끝내는 자리: 지금 ${b.complete.length}개(늘 보이는 것 ${visible}개) → \`completeAdd\` ${Math.max(1, 3 - visible)}개 이상`);
  const shortC = b.complete.filter((c) => len(c.replyKo) < 60).map((c) => `\`${c.id}\`(${len(c.replyKo)}자)`);
  if (shortC.length) L.push(`- 끝내는 자리 응답 늘리기(\`completeReply\`): ${shortC.join(', ')}`);
  L.push('');
  return L.join('\n');
}

const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? undefined : process.argv[i + 1]; };
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const batch = arg('batch');
  const ids = arg('ids')?.split(',');
  const list = STORY_QUESTS.filter((q) => (ids ? ids.includes(q.id) : batchOf(q.id) === Number(batch)));
  if (!list.length) { console.error('편이 없다 — --batch 1~8 또는 --ids'); process.exit(1); }
  const head = `# 답 깊이 문맥 — ${ids ? ids.join(', ') : `묶음 ${batch}`} (${list.length}편)\n\n`;
  const body = head + list.map(questBlock).join('\n');
  const out = arg('out');
  if (out) { fs.writeFileSync(out, body); console.log(`${out} — ${list.length}편 · ${body.length}자`); } else process.stdout.write(body);
}
