/**
 * @file dump_quest_scenes.cjs
 * @description 퀘스트 장면(컷씬) 대사 덤프 — 위키 아티팩트 「장면」 절 입력 (168차).
 *  브라우저 안에서 `data/QuestScenes.ts`를 돌려 100편의 실제 대사를 `tools/quest_scenes.json`으로 굽는다.
 *  선행: dev 서버(5173). 실행: NODE_PATH=<playwright 경로> node tools/dump_quest_scenes.cjs
 */
const { chromium } = require('playwright');   // NODE_PATH로 찾는다
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!globalThis.__PIXEL_ANGLER_GAME, { timeout: 40000 });
  const out = await p.evaluate(async () => {
    const qs = await import('/src/data/QuestScenes.ts');
    const core = await import('/node_modules/@tra/core/dist/index.js').catch(() => null);
    const c = core ?? await import('@tra/core');
    const field = ['okseon','coop','hyeonsu','kang_ducheol','tak_mansu','bae_nuri','baram'];
    const res = [];
    for (const q of c.STORY_QUESTS) q.objectives.forEach((o, i) => {
      const scene = o.kind === 'talk' || (!!o.manual && !o.actionKey);
      if (!scene) return;
      const def = qs.questSceneFor(q.id, i, { regionId: 'gangwon_sokcho', fieldNpcIds: field, placeKo: '강원 속초' });
      const npc = o.npcId ?? q.giver ?? '';
      res.push({ id: q.id, idx: i, kind: o.kind, giver: q.giver, npc, onField: field.includes(npc), entryOnField: field.includes(npc) || field.includes(q.giver), label: o.labelKo, place: def.script.placeKo,
        lines: def.script.steps.filter(s => s.kind === 'say').map(s => {
          const names = { player: '나', ...Object.fromEntries(def.extras.map(e => [e.key, e.nameKo])) };
          for (const [k, v] of Object.entries(def.roles)) if (!names[k]) { const n = c.getStoryNpc(v); names[k] = n ? n.nameKo : v; }
          return { who: s.thought ? '혼잣말' : (names[s.who] ?? s.who), text: s.text };
        }), hand: !!qs.QUEST_SCENE_OVERRIDES[`${q.id}#${i}`] });
    });
    return res;
  });
  fs.writeFileSync(require('path').join(__dirname, 'quest_scenes.json'), JSON.stringify(out, null, 1));
  console.log('scenes', out.length, 'entryOnField', out.filter(r=>r.entryOnField).length);
  await b.close();
})();
