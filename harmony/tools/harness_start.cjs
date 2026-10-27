/**
 * 하모니 v2 — 게임을 띄워 시나리오를 돌리는 하네스의 시작 본(2026-10-27).
 *
 * 쓰는 법(시나리오 파일은 스크래치에 따로 쓴다 — 저장소 · 상태 브랜치에 남기지 않는다):
 *
 *   const { boot } = require('<상태 폴더>/harmony/tools/harness_start.cjs');
 *   (async () => {
 *     const h = await boot({ region: 'hometown' });          // dev 서버(5173)가 떠 있어야 한다
 *     const r = await h.page.evaluate(async () => {           // 게임 안에서 실행
 *       const inv = globalThis.__INV;                         // 게임과 같은 스토어 인스턴스
 *       return inv.find('inv_pe1')?.qty;
 *     });
 *     h.check('합사 원줄이 있다', r > 0, r);
 *     await h.done();                                         // PASS/FAIL 수 · pageerror 출력 후 닫기
 *   })();
 *
 * dev 서버: `cd packages/client-pc && npx vite --port 5173 > <스크래치>/vite.log 2>&1 &` (파이프로 head 하지 않는다)
 *   - core를 고쳤으면 `packages/client-pc/node_modules/.vite`를 지우고 다시 띄운다(옛 core가 남는다).
 *   - 하네스가 도는 동안 소스를 고치지 않는다(HMR이 페이지를 다시 읽어 하네스가 죽는다).
 *   - 끝나면 vite · 브라우저를 PID로 끈다(`pkill -f`는 자기 셸까지 죽인다).
 *
 * 게임 안 dev 전역(스킬 verify-render 표):
 *   __PIXEL_ANGLER_GAME · __INV(가방) · __GS(GameState) · __FIELD(채집 · 통발 · 쿨러 · 튜닝) · __STORY(퀘스트) ·
 *   __FP(1인칭 낚시 — devForceBite · devForceFight) · __COOK(요리) · __HOME(집) · __DISC(도감) · __MAPEDIT(맵 편집기)
 *   모듈 함수는 `await import('/src/…/X.ts')`(.ts URL), core 데이터는 `await import('/@id/@tra/core')`.
 *   ⚠ `/src/store/*.ts`를 import하면 게임과 **다른** 인스턴스다 — 상태는 반드시 전역으로 만진다.
 *   ⚠ `page.keyboard`는 아래 씬(메인 메뉴)까지 움직인다 — 단추는 패널 메서드를 직접 부른다.
 *   ⚠ 헤드리스는 rAF가 느리다 — 시간이 흐르는 판정은 씬 메서드를 직접 부르거나 시계 필드를 되감는다.
 *   ⚠ 새 게임은 가방이 비어 있다(프롤로그) — 물건은 상점 경로(`RegionFieldScene.handleBuy`)나 `__INV.addItem`으로 준다.
 *     상점 표는 `(await import('/src/data/ShopCatalog.ts')).SHOP_CATALOG` — 항목에서 price · maxPerPurchase를 빼면 아이템 틀이다.
 *     돈은 `__GS.addCoins(500000, true)`.
 */
'use strict';

function loadPlaywright() {
  const tries = ['playwright', '/opt/node-tools/node_modules/playwright'];
  for (const t of tries) {
    try { return require(t); } catch { /* 다음 */ }
  }
  throw new Error('playwright를 찾지 못했습니다 — 설치하지 말고 「확인하지 못함」으로 적습니다');
}

/**
 * 새 게임(슬롯 3)을 만들어 필드에 선다. region = 'hometown'이면 집 안을 닫고 집 앞 필드로 나온다.
 * @param {{ region?: string, url?: string, viewport?: {width:number,height:number}, slot?: number }} opts
 */
async function boot(opts = {}) {
  const { chromium } = loadPlaywright();
  const region = opts.region ?? 'hometown';
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: opts.viewport ?? { width: 1280, height: 720 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.addInitScript(() => { try { localStorage.setItem('tra_fp_guide_seen', '1'); } catch { /* 없음 */ } });
  await page.goto(opts.url ?? 'http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.__PIXEL_ANGLER_GAME?.scene.isActive('MainMenuScene'), null, { timeout: 180000 });
  await page.waitForTimeout(1000);
  await page.evaluate(({ region, slot }) => {
    globalThis.__GS.startNewGameInSlot(slot);
    const g = globalThis.__PIXEL_ANGLER_GAME;
    g.scene.getScenes(true).forEach((sc) => { if (sc.scene.key !== 'RegionFieldScene') g.scene.stop(sc.scene.key); });
    const f = g.scene.getScene('RegionFieldScene');
    if (f.scene.isActive()) f.scene.restart({ region }); else g.scene.start('RegionFieldScene', { region });
  }, { region, slot: opts.slot ?? 3 });
  if (region === 'hometown') {
    await page.waitForFunction(() => globalThis.__PIXEL_ANGLER_GAME.scene.isActive('HomeInteriorScene'), null, { timeout: 120000 });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const g = globalThis.__PIXEL_ANGLER_GAME;
      g.scene.getScene('HomeInteriorScene').scene.stop();
      g.scene.resume('RegionFieldScene');
    });
  }
  await page.waitForFunction(() => {
    const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
    return s && s.scene.isActive() && s.hud;
  }, null, { timeout: 120000 });
  await page.waitForTimeout(600);

  let pass = 0, fail = 0;
  const results = [];
  const check = (name, ok, got) => {
    if (ok) pass++; else fail++;
    results.push({ name, ok: !!ok, got: ok ? undefined : got });
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' — got ' + JSON.stringify(got)}`);
  };
  const shot = (path) => page.screenshot({ path });
  const done = async () => {
    console.log(`[결과] PASS ${pass} · FAIL ${fail} · pageerror ${errors.length}`);
    if (errors.length) console.log('[pageerror]', errors.slice(0, 3));
    await browser.close();
    return { pass, fail, errors, results };
  };
  return { browser, page, errors, check, shot, done };
}

module.exports = { boot, loadPlaywright };
