const fs = require('fs'); const path = require('path');
function resolvePlaywright() {
  try { return require('playwright'); } catch {}
  const base = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const p = path.join(base, d, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error('playwright not found');
}
const { chromium } = resolvePlaywright();
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.__PIXEL_ANGLER_GAME?.scene.isActive('MainMenuScene'), { timeout: 30000 });
  const r = await page.evaluate(() => {
    const inv = globalThis.__INV;
    // 구세이브 재현 — 직렬화본에서 굵은소금·dev 문어를 제거하고 다시 로드
    const s = inv.serialize();
    s.items = s.items.filter((i) => i.id !== 'inv_coarse_salt' && i.id !== 'inv_devfish_octopus');
    inv.deserialize(s);
    return {
      salt: inv.find('inv_coarse_salt')?.qty ?? 0,
      octo: inv.find('inv_devfish_octopus')?.name ?? null,
      swordtip: inv.find('inv_devfish_swordtip_squid')?.name ?? null,
      knife: inv.items.some((i) => i.tool === 'knife'),
    };
  });
  console.log('구세이브(소금·문어 없음) 로드 후 →', JSON.stringify(r));
  console.log('[pageerror]', errors.length);
  await browser.close();
  process.exit(r.salt === 3 && r.octo && r.swordtip && r.knife && errors.length === 0 ? 0 : 1);
})();
