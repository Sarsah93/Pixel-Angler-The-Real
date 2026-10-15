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

/** 168차 — 퀘스트 장면(컷씬) 대사. `tools/dump_quest_scenes.cjs`가 굽는다(없으면 빈 표). */
function loadScenes() {
  const f = path.join(ROOT, 'tools/quest_scenes.json');
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const s of JSON.parse(fs.readFileSync(f, 'utf8'))) out[`${s.id}#${s.idx}`] = { lines: s.lines, hand: !!s.hand, place: s.place };
  return out;
}
const SCENES = loadScenes();

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

/** 254차 — 이어지는 대화 한 벌을 위키용으로(사람 이름 · 우호도 증감 · 조건 · 다음/끝) */
const npcName = (id) => (id === '' ? '지문' : core.getStoryNpc(id)?.nameKo ?? id);
const AT_LABEL = { offer: '받는 자리', objective: '진행 중', action: '진행 중(단계)', complete: '끝내는 자리' };
const STANCE_LABEL = { giver: '의뢰인 편', other: '맞은편', mid: '가운데', self: '제 생각' };
function gateText(g) {
  if (!g) return '';
  const out = [];
  if (g.flag) out.push('앞에서 고른 말이 있을 때');
  if (g.notFlag) out.push('앞에서 그 말을 고르지 않았을 때');
  if (g.affinityMin) out.push(`${npcName(g.affinityMin[0])} 우호도 ${g.affinityMin[1]} 이상`);
  if (g.affinityMax) out.push(`${npcName(g.affinityMax[0])} 우호도 ${g.affinityMax[1]} 이하`);
  return out.join(' · ');
}
function talkView(t) {
  return {
    id: t.id, at: AT_LABEL[t.at] ?? t.at, npc: npcName(t.npcId), start: t.start,
    nodes: Object.entries(t.nodes).map(([id, n]) => ({
      id, who: n.speaker === undefined ? npcName(t.npcId) : npcName(n.speaker), line: n.lineKo,
      choices: n.choices.map((c) => ({
        label: c.labelKo, stance: STANCE_LABEL[c.stance] ?? '',
        aff: Object.entries(c.affinity ?? {}).map(([k, v]) => `${npcName(k)} ${v > 0 ? '+' : ''}${v}`).join(' · '),
        gate: gateText(c.requires), next: c.next ?? null,
        end: c.end ? (c.end.accept ? '받는다' : c.end.decline ? '미룬다' : c.end.ending ? `결말 「${core.endingById(c.end.ending)?.titleKo ?? ''}」` : c.end.complete ? '마친다' : '끝') : null,
        endLine: c.end?.lineKo ?? '',
      })),
    })),
  };
}
const ENDING_KIND = { canon: '하나로 모이는 결말', rupture: '갈라지는 결말', neutral: '이도 저도 아닌 결말' };
function endingView(e) {
  const fx = e.effects ?? {};
  const lines = [];
  for (const [k, v] of Object.entries(fx.affinity ?? {})) lines.push(`${npcName(k)} 우호도 ${v > 0 ? '+' : ''}${v}`);
  for (const [k, v] of Object.entries(fx.affinitySet ?? {})) lines.push(`${npcName(k)} 우호도 ${v}로`);
  for (const [k, v] of Object.entries(fx.affinityCap ?? {})) lines.push(`${npcName(k)} 우호도가 영영 ${v}를 넘지 않는다`);
  for (const [k, v] of Object.entries(fx.shop ?? {})) {
    if (v.noHaggle) lines.push(`${npcName(k)} 가게 — 값을 깎아 주지 않는다`);
    if (v.rare === 'none') lines.push(`${npcName(k)} 가게 — 귀한 물건을 들이지 않는다`);
    if (v.rare === 'more') lines.push(`${npcName(k)} 가게 — 귀한 물건을 늘 들여놓는다`);
  }
  for (const [k, v] of Object.entries(fx.role ?? {})) lines.push(`${npcName(k)} — ${v.ko}`);
  return { kind: ENDING_KIND[e.kind] ?? e.kind, title: e.titleKo, summary: e.summaryKo, effects: lines };
}

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
    // 254차 — 이어지는 대화(갈래) · 이 편이 정하는 결말
    talks: (core.talksOfQuest?.(q.id) ?? []).map(talkView),
    endings: core.STORY_ENDINGS ? core.STORY_ENDINGS.filter((e) => e.questId === q.id).map(endingView) : [],
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
  scenes: SCENES,
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
    endings: core.endingsOfArc ? core.endingsOfArc(a.id).map(endingView) : [],
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
