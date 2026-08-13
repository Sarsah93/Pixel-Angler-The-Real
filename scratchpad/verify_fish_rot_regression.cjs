/**
 * @file verify_fish_rot_regression.cjs
 * @description 092차 renderedRotation 도입의 어류 회귀 검증 — 광어 세로 배치(수동 R 회전) 무손상.
 *  ① 광어 중앙선 스테이지(rotationRequired 90) 진입 시 회전 힌트 ② R 회전 → 표시 동기화
 *  ③ 세로 배치 스크린샷 ④ 가이드 트레이스 실드래그 통과 (rotNorm 왕복 정합).
 */
const fs = require('fs');
const path = require('path');
function resolvePlaywright() {
  try { return require('playwright'); } catch { /* npx 캐시 */ }
  const base = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const p = path.join(base, d, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error('playwright not found');
}
const { chromium } = resolvePlaywright();
let pass = 0, fail = 0;
const ok = (c, l) => { if (c) { pass++; console.log(`  ✅ ${l}`); } else { fail++; console.log(`  ❌ ${l}`); } };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const g = globalThis.__PIXEL_ANGLER_GAME;
    return g && g.scene.isActive('MainMenuScene');
  }, { timeout: 30000 });

  await page.evaluate(async () => {
    const game = globalThis.__PIXEL_ANGLER_GAME;
    const scene = game.scene.getScene('MainMenuScene');
    const { ButcheryPanel } = await import('/src/ui/ButcheryPanel.ts');
    const source = {
      id: 'inv_catch_flatfish_reg', name: '광어', icon: '🐟', category: 'food',
      subCategory: '어획물', qty: 1, basePrice: 30000,
      speciesId: 'flatfish', lengthCm: 58, weightG: 2200, condition: 'live',
    };
    const panel = new ButcheryPanel(scene, source, { onClose: () => {}, onComplete: () => {} });
    scene.add.existing(panel);
    globalThis.__PANEL = panel;
  });
  const canvasBox = await (await page.$('canvas')).boundingBox();

  // 배쪽 중앙선(rotationRequired 90)까지 dev 점프 — 섹션/작업 id를 런타임에서 찾는다
  await page.evaluate(() => {
    const p = globalThis.__PANEL;
    for (let si = 0; si < p.sections.length; si++) {
      const t = p.sections[si].tasks.find((tk) => tk.stageIds.includes('flat_belly_center'));
      if (t) { p.devJumpToTask(si, t.id); return; }
    }
    throw new Error('flat_belly_center task not found');
  });
  await page.waitForFunction(() => !globalThis.__PANEL.flipping && !globalThis.__PANEL.actionAnim, { timeout: 10000 });
  await page.waitForTimeout(150);
  let st = await page.evaluate(() => {
    const p = globalThis.__PANEL;
    return { stage: p.process.stage?.id, rot: p.process.rotation, drawnRot: p.renderedRotation, ok: p.process.rotationOk() };
  });
  ok(st.stage === 'flat_belly_center', `스테이지 = flat_belly_center (${st.stage})`);
  // devJumpToTask는 jumpTo가 회전을 스냅 — 표시도 동기화됐는지
  ok(st.rot === 90 && st.drawnRot === 90, `회전 90 + 표시 동기 (process ${st.rot} / 표시 ${st.drawnRot})`);

  // 수동 R 회전 왕복 — refresh 경유 동기화 확인 (어류는 수동 회전 유지)
  st = await page.evaluate(() => {
    const p = globalThis.__PANEL;
    p.doRotate(1);   // 90 → 180
    const a = { rot: p.process.rotation, drawn: p.renderedRotation };
    p.doRotate(-1);  // 180 → 90 복귀
    const b = { rot: p.process.rotation, drawn: p.renderedRotation };
    return { a, b };
  });
  ok(st.a.rot === 180 && st.a.drawn === 180, `R 회전 즉시 동기 (${st.a.rot}/${st.a.drawn})`);
  ok(st.b.rot === 90 && st.b.drawn === 90, `Shift+R 복귀 동기 (${st.b.rot}/${st.b.drawn})`);

  const pxy = await page.evaluate(() => ({ x: globalThis.__PANEL.x, y: globalThis.__PANEL.y }));
  await page.screenshot({
    path: path.join(__dirname, 's16_fish_rot90.png'),
    clip: {
      x: canvasBox.x + pxy.x * (canvasBox.width / 1280), y: canvasBox.y + pxy.y * (canvasBox.height / 720),
      width: 1080 * (canvasBox.width / 1280), height: 656 * (canvasBox.height / 720),
    },
  });
  console.log('  📷 s16_fish_rot90.png');

  // 가이드 트레이스 실드래그 — 세로 배치에서 중앙선 컷 통과 (rotNorm 왕복 정합)
  const guide = await page.evaluate(() => {
    const p = globalThis.__PANEL;
    return p.process.stage.cut.guidePath.map((pt) => {
      const [px, py] = p.toPanelPx(pt);
      return { x: p.x + px, y: p.y + py };
    });
  });
  const toScreen = (g) => ({ x: canvasBox.x + g.x * (canvasBox.width / 1280), y: canvasBox.y + g.y * (canvasBox.height / 720) });
  const s0 = toScreen(guide[0]);
  await page.mouse.move(s0.x, s0.y);
  await page.mouse.down();
  for (let k = 1; k <= 12; k++) {
    const t = k / 12;
    const seg = Math.min(guide.length - 2, Math.floor(t * (guide.length - 1)));
    const tt = t * (guide.length - 1) - seg;
    const g = toScreen({
      x: guide[seg].x + (guide[seg + 1].x - guide[seg].x) * tt,
      y: guide[seg].y + (guide[seg + 1].y - guide[seg].y) * tt,
    });
    await page.mouse.move(g.x, g.y, { steps: 2 });
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForFunction(() => !globalThis.__PANEL.actionAnim && !globalThis.__PANEL.flipping, { timeout: 12000 });
  st = await page.evaluate(() => ({ stage: globalThis.__PANEL.process.stage?.id }));
  ok(st.stage === 'flat_belly_up_score', `세로 배치 중앙선 컷 통과 → 다음 스테이지 (${st.stage})`);

  console.log(`[pageerror] ${errors.length}`, errors.slice(0, 3));
  ok(errors.length === 0, 'pageerror 0');
  console.log(`결과: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
