/**
 * f9_share_common_lines.cjs — 328차: 비늘치기 뒤 단계의 확정 선을 어종군 공통값으로 넣기
 *
 * 사용자 지시(2026-11-17): 「방혈, 피빼기, 머리제거, 지느러미 제거, 비늘제거 까지는 생선마다 크기와 생김새, 머리 위치 등이 달라서
 *   내가 따로 잡아줘야 하는데, 그 뒷 부분부터는 다 동일해. … 내가 가이드 확정한 어종들 보고 참고해서 다른 어종들에도 적용해줘」.
 *
 * 확정한 어종들의 선을 **어종군 그림 자리로 되옮겨**(필렛 뷰 = 열 실루엣 역변환 — `invertGuideRemap`) 점마다 평균을 내고
 * `@bream` · `@amberjack` 군 키에 넣는다. 쓸 때는 어종마다 다시 그 어종 그림 자리로 옮겨진다(`familyFrame`).
 *
 *  | 단계 | 그림 | 평균 내는 어종 | 넣는 곳 |
 *  |---|---|---|---|
 *  | `vessel_scrub` 핏줄 긁기 | 체강(두 군 공용 · 옮기지 않음) | 확정한 어종 전부 | 두 군 |
 *  | `peel_grip` 박피 ① 꼬리 칼집 | 껍질 붙은 필렛(군마다 대표 그림이 다르다) | 군마다 확정한 어종 | 그 군 · `familyFrame` |
 *  | `rib_a` · `rib_b` 갈빗대 | 갈빗대 붙은 필렛(두 군 대표 그림이 같다) | 기본선에서 **옮겨 확정한** 어종 | 두 군 · `familyFrame` |
 *
 *  - 장뜨기 8단계는 `f9_share_fillet_lines.cjs`(321 — 벵에돔 기준)가 맡는다. 꼬리 칼집은 그림의 꼬리 자루에서 굽는다(client `butcherTailLines`).
 *    지아이뼈 분리는 살 높이 한가운데 줄을 위 · 아래 두 칼로 가른다(client `butcherPinLine` → core `splitPinStrokes`). 해체 측면 선은
 *    기준 어종(잿방어)의 확정 선을 손질 창이 그때그때 모양으로 바꿔 쓴다(`ButcheryPanel.loinReferenceShape`). 셋 다 이 도구와 무관하다.
 *  - 찾는 순서는 어종 → 군이라, 어종마다 확정한 것은 그대로다(기본선 그대로 확정한 것도 그 어종의 확정이다).
 *  - 갈빗대는 기본선 그대로 [확정]만 누른 어종(점마다 0.012 안)을 평균에서 뺀다 — 넣으면 평균이 기본선 쪽으로 끌린다.
 *
 * 실행(dev 서버 5173이 떠 있어야 한다 — 그림 틀을 게임 코드에서 읽는다):
 *   node tools/f9_share_common_lines.cjs [--check] [--url http://127.0.0.1:5173/]
 *   → `tools/f9_captures/captures.json`의 군 키를 고치고 `apply_f9_captures.cjs`로 core 표를 다시 굽는다.
 *   어종 확정이 늘면 다시 돌린다(평균이 바뀐다).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'tools/f9_captures/captures.json');
const FAMILIES = ['@amberjack', '@bream'];
/** 단계 → { pool: 'all' | 'family' · frame: 군 그림 자리로 옮기는가 · movedOnly: 기본선에서 옮긴 어종만 } */
const STAGES = {
  vessel_scrub: { pool: 'all', frame: false, movedOnly: false },
  peel_grip: { pool: 'family', frame: true, movedOnly: false },
  rib_a: { pool: 'all', frame: true, movedOnly: true },
  rib_b: { pool: 'all', frame: true, movedOnly: true },
};
const MOVED_EPS = 0.012;

const r3 = (v) => Math.round(v * 1000) / 1000;
const lineOf = (o) => (o ? (o.guidePath ?? o.sweepPath ?? (o.guidePaths && o.guidePaths[0])) : undefined);
const maxDev = (a, b) => (a && b && a.length === b.length
  ? Math.max(...a.map((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y))) : Infinity);

async function measure(url, table) {
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => globalThis.__PIXEL_ANGLER_GAME?.scene.isActive('MainMenuScene'), null, { timeout: 300000 });
    return await page.evaluate(async ({ table, stageIds }) => {
      const core = await import('/@id/@tra/core');
      const P = await import('/src/ui/PixelButcherFish.ts');
      const W = P.BUTCHER_FISH_W0, H = P.BUTCHER_FISH_H0;
      const out = [];
      // 손질이 열린 어종만(참돔 야간처럼 프로필을 빌려 쓰는 어종도 든다)
      const open = new Set(core.BUTCHERY_IMPLEMENTED_SPECIES);
      for (const id of Object.keys(table)) {
        if (id.startsWith('@') || !open.has(id)) continue;
        const profile = core.butcheryProfileFor(id);
        if (profile.tree === 'eel' || profile.bodyShape === 'flat') continue;
        const gf = P.butcherGuideFrame(id, undefined, W, H), ff = P.butcherFilletFrames(id, W, H);
        const def = core.buildButcheryStages(profile, { guideFrame: gf, filletFrames: ff });
        for (const sid of stageIds) {
          const o = table[id][sid];
          const conf = o ? (o.guidePath ?? o.sweepPath ?? (o.guidePaths && o.guidePaths[0])) : undefined;
          const ds = def.find((q) => q.id === sid);
          if (!conf || !ds) continue;
          const m = core.stageGuideRemap(sid, { guideFrame: gf, filletFrames: ff });
          const inv = m ? core.invertGuideRemap(m) : undefined;
          out.push({
            id, sid, fam: `@${core.butcheryArtFamily(id)}`, at: o.at ?? '', sweep: !!o.sweepPath,
            conf, def: ds.cut?.guidePath ?? ds.sweepPath,
            confFam: conf.map((p) => (inv ? core.remapGuidePoint(p, inv) : { x: p.x, y: p.y })),
          });
        }
      }
      return out;
    }, { table, stageIds: Object.keys(STAGES) });
  } finally {
    await browser.close();
  }
}

async function main() {
  const a = process.argv.slice(2);
  const check = a.includes('--check');
  const url = a.includes('--url') ? a[a.indexOf('--url') + 1] : 'http://127.0.0.1:5173/';
  const table = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const rows = await measure(url, table);

  const fams = Object.fromEntries(FAMILIES.map((f) => [f, { ...(table[f] ?? {}) }]));
  let changed = 0;
  for (const [sid, rule] of Object.entries(STAGES)) {
    const all = rows.filter((r) => r.sid === sid && (!rule.movedOnly || maxDev(r.conf, r.def) > MOVED_EPS));
    for (const fam of FAMILIES) {
      const pool = rule.pool === 'all' ? all : all.filter((r) => r.fam === fam);
      // 점 수가 가장 흔한 것끼리만 평균(점 수가 다른 선은 점마다 대응이 없다)
      const byN = {};
      for (const r of pool) (byN[r.confFam.length] ??= []).push(r);
      const use = Object.values(byN).sort((x, y) => y.length - x.length)[0] ?? [];
      if (!use.length) { console.log(`  ${sid.padEnd(13)} ${fam.padEnd(10)} 확정한 어종 없음 — 그대로`); continue; }
      const n = use[0].confFam.length;
      const mean = Array.from({ length: n }, (_, i) => ({
        x: r3(use.reduce((s, r) => s + r.confFam[i].x, 0) / use.length),
        y: r3(use.reduce((s, r) => s + r.confFam[i].y, 0) / use.length),
      }));
      const next = { from: `mean:${use.map((r) => r.id).sort().join(',')}` };
      next[use[0].sweep ? 'sweepPath' : 'guidePath'] = mean;
      if (rule.frame) next.familyFrame = true;
      next.at = use.map((r) => r.at).sort().pop();
      if (JSON.stringify(fams[fam][sid]) !== JSON.stringify(next)) changed++;
      fams[fam][sid] = next;
      console.log(`  ${sid.padEnd(13)} ${fam.padEnd(10)} 어종 ${String(use.length).padStart(2)} · ${mean.map((p) => `(${p.x.toFixed(3)},${p.y.toFixed(3)})`).join(' ')}`);
    }
  }
  console.log(`[f9_share_common_lines] 단계 ${Object.keys(STAGES).length} · 바뀌는 항목 ${changed}${check ? ' (바꾸지 않음)' : ''}`);
  if (check || !changed) return;
  // 군 키를 맨 앞에(나머지는 원래 순서) — dev 서버 [확정]은 새 어종을 끝에 붙인다
  const out = {};
  for (const fam of FAMILIES) out[fam] = fams[fam];
  for (const [k, v] of Object.entries(table)) if (!FAMILIES.includes(k)) out[k] = v;
  fs.writeFileSync(SRC, `${JSON.stringify(out, null, 1)}\n`, 'utf8');
  console.log(execFileSync(process.execPath, [path.join(ROOT, 'tools/apply_f9_captures.cjs')], { encoding: 'utf8' }).trim());
}
main().catch((e) => { console.error('[f9_share_common_lines] 실패', e); process.exit(1); });
