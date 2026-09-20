/**
 * @file gen_quest_wiki_data.mjs
 * @description 퀘스트 아티팩트(위키형) 데이터 생성기 — 151차
 *
 * `@tra/core/dist`의 실제 데이터를 그대로 읽어 아티팩트가 삼킬 JSON 한 덩어리로 굽는다.
 * 수치를 손으로 적지 않는다(코드가 정답) — 퀘스트 수·XP·해금이 바뀌면 이 스크립트만 다시 돌린다.
 *
 * 실행:  node tools/gen_quest_wiki_data.mjs            → JSON만 (stdout)
 *        node tools/gen_quest_wiki_data.mjs --html     → 아티팩트용 완성 HTML (stdout)
 *                                                        (템플릿 `tools/quest_wiki_template.html`의 __DATA__ 자리에 주입)
 * 선행:  npx pnpm --filter @tra/core run build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Windows Node는 C:\ 절대 경로를 ESM specifier로 받지 않으므로 file:// URL로 변환한다.
const core = await import(pathToFileURL(path.join(ROOT, 'packages/core/dist/index.js')).href);

/** 보상 아이템 이름 — 클라 데이터(QuestRewardItems.ts)에서 id → name 만 긁는다 */
function rewardItemNames() {
  const src = fs.readFileSync(path.join(ROOT, 'packages/client-pc/src/data/QuestRewardItems.ts'), 'utf8');
  const out = {};
  for (const mm of src.matchAll(/id: '([^']+)', name: '([^']+)'/g)) out[mm[1]] = mm[2];
  for (const mm of src.matchAll(/\(\s*'([^']+)',\s*'([^']+)'/g)) if (!out[mm[1]]) out[mm[1]] = mm[2];
  return out;
}
const ITEM_NAME = rewardItemNames();

const SHOP_UNLOCK_LABEL = {
  mart_pro_knife: '식자재마트 — 전문가용 회칼 진열',
  market_crate_pro: '직판장 — 규격 상자(위판용) 진열',
  market_lure_starter: '직판장 — 입문 루어 진열',
  daily_workshop_pro: '생활용품점 — 공방 도구 진열',
  market_egi_pro: '직판장 — 고급 에기 진열',
};

const skillName = (id) => core.SKILL_DATABASE.find((s) => s.id === id)?.nameKo ?? id;
const licenseName = (id) => core.LICENSE_DATABASE.find((l) => l.type === id)?.nameKo ?? id;

const npcIndex = {};
for (const n of core.STORY_MAIN_NPCS) npcIndex[n.id] = { name: n.nameKo, role: n.roleKo };
for (const a of core.STORY_ARCS) for (const n of a.npcs) if (!npcIndex[n.id]) npcIndex[n.id] = { name: n.nameKo, role: n.roleKo, arc: a.id };

const regionName = (id) => core.WORLD_NODE_DATABASE.find((r) => r.id === id)?.name
  ?? core.REGION_DATABASE.find((r) => r.id === id)?.nameKo ?? id;

const arcOf = {};
for (const a of core.STORY_ARCS) for (const qid of a.questIds) arcOf[qid] = a;

// 다음 임무 = 나를 prereq로 가진 것 (위키 인포박스 「이후」)
const nextOf = {};
for (const q of core.STORY_QUESTS) for (const p of q.prereq ?? []) (nextOf[p] ??= []).push(q.id);

// 같은 의뢰인의 형제 임무 = 「다른 선택들」
const byGiver = {};
for (const q of core.STORY_QUESTS) (byGiver[q.giver] ??= []).push(q.id);

const quests = core.STORY_QUESTS.map((q) => {
  const n = core.narrativeOf(q.id);
  const ch = core.choicesFor(q);
  const r = q.rewards ?? {};
  const arc = arcOf[q.id];
  return {
    id: q.id, kind: q.kind, part: q.part, chapter: q.chapter,
    title: q.titleKo, titleEn: q.titleEn,
    desc: q.descKo,
    lv: q.minLevel, xp: q.xp,
    giver: q.giver, giverName: npcIndex[q.giver]?.name ?? q.giver, giverRole: npcIndex[q.giver]?.role ?? '',
    region: q.region, regionName: regionName(q.region),
    prereq: q.prereq ?? [], next: nextOf[q.id] ?? [],
    siblings: (byGiver[q.giver] ?? []).filter((id) => id !== q.id),
    obj: (q.objectives ?? []).map((o, i) => ({
      label: n?.objectives?.[i] ?? o.labelKo, kind: o.kind, manual: !!o.manual,
      minCm: o.minCm, target: o.target, spotKind: o.spotKind,
    })),
    diff: (() => { const d = core.questDifficulty(q); return { tier: d.tier, label: d.labelKo, score: d.score, acts: d.actionsKo, reason: d.reasonKo }; })(),
    teaches: q.teaches ?? [],
    deadline: q.deadline ?? null,
    unlocks: q.unlocks ?? [],
    policy: q.offerPolicy ?? null, event: q.event ?? null,
    journalPage: q.journalPage ?? null,
    arcId: arc?.id ?? null, arcTitle: arc?.titleKo ?? null,
    rw: {
      xp: q.xp,
      coins: r.coins ?? 0,
      items: (r.items ?? []).map((it) => ({ name: ITEM_NAME[it.id] ?? it.id, qty: it.qty ?? 1, bound: !!it.bound })),
      licenses: (r.licenses ?? []).map(licenseName),
      skills: (r.skillUnlocks ?? []).map(skillName),
      shops: (r.shopUnlocks ?? []).map((k) => SHOP_UNLOCK_LABEL[k] ?? k),
      rep: q.reputation ?? null,
    },
    nar: n ? { intro: n.intro, offer: n.offer, progress: n.progress, done: n.done, epi: n.epilogue } : null,
    offerChoices: (ch.offer ?? []).map((c) => ({ label: c.labelKo, reply: c.replyKo, decline: !!c.outcome?.decline, out: core.describeOutcomeKo(c.outcome) })),
    complete: (ch.complete ?? []).map((c) => ({ label: c.labelKo, reply: c.replyKo, out: core.describeOutcomeKo(c.outcome) })),
  };
});

const chapters = core.STORY_CHAPTERS.map((c) => ({
  n: c.chapter ?? c.n, part: c.part, partT: c.partTitleKo ?? c.partT,
  title: c.titleKo ?? c.t, lv: c.levelRange ?? c.lv, regions: (c.regionIds ?? c.rg ?? []).map(regionName),
  question: c.questionKo ?? c.q ?? '',
  qual: c.qualification ? {
    l: c.qualification.labelKo, d: c.qualification.deadlineKo,
    m: c.qualification.onMissKo, u: c.qualification.unlocksKo,
  } : null,
}));

const out = {
  generatedFrom: '@tra/core dist',
  counts: {
    quests: quests.length,
    main: quests.filter((q) => q.kind === 'main').length,
    sub: quests.filter((q) => q.kind !== 'main').length,
    arcs: core.STORY_ARCS.length,
    xp: quests.reduce((s, q) => s + (q.xp ?? 0), 0),
    pages: core.JOURNAL_PAGES.length,
  },
  chapters,
  arcs: core.STORY_ARCS.map((a) => ({
    id: a.id, title: a.titleKo, region: regionName(a.regionId),
    npcs: a.npcs.map((n) => ({ name: n.nameKo, role: n.roleKo })),
    relation: a.relationKo, angle: a.angleKo, questIds: a.questIds,
  })),
  npcs: npcIndex,
  quests,
};
const json = JSON.stringify(out);
if (process.argv.includes('--html')) {
  // ⚠ 스크립트 태그 안이므로 `</`를 반드시 깨 둔다 — 안 그러면 본문 어딘가에서 문서가 닫힌다.
  const tpl = fs.readFileSync(path.join(ROOT, 'tools/quest_wiki_template.html'), 'utf8');
  process.stdout.write(tpl.replace('__DATA__', json.replace(/<\//g, '<\\/')));
} else {
  process.stdout.write(json);
}
