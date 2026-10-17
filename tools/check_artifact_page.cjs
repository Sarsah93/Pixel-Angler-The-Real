#!/usr/bin/env node
/**
 * @file check_artifact_page.cjs
 * @description claude.ai 아티팩트 원본(`docs/artifacts/*.html`) 발행 전 점검 (260차).
 *
 * 아티팩트 서비스가 발행 때 씌우는 뼈대(doctype · head · body)를 흉내 내 띄우고 다음을 잰다.
 *  ① 본문 가로 넘침 — 문서 폭이 창 폭보다 넓으면 안 된다(표 · 그림은 자기 상자 안에서만 스크롤).
 *  ② SVG 상자 안 글자 넘침 · 상자끼리 겹침 · 갈래 이름이 상자를 덮는지(선택자를 주었을 때 — 채비 모딩 순서도).
 *  ③ pageerror 0.
 *  ④ 스크린샷 — 밝음 · 어두움(1280px) · 폰 폭(400px) 전체 페이지 + SVG 전체(가로 스크롤 상자를 풀고).
 *
 * 사용: node tools/check_artifact_page.cjs <html> <출력 접두사> [svg 선택자]
 *   예) node tools/check_artifact_page.cjs docs/artifacts/rig_flow.html /tmp/x/rig '#flow'
 * Playwright는 설치하지 않는다 — 로컬 → /opt/node-tools → npx 캐시 순으로 찾는다(크로미움은 미리 깔린 것).
 */
const fs = require('fs');
const path = require('path');

function resolvePlaywright() {
  try { return require('playwright'); } catch { /* 다음 후보 */ }
  const cands = ['/opt/node-tools/node_modules/playwright'];
  const npx = path.join(process.env.LOCALAPPDATA || path.join(process.env.HOME || '', '.npm'), process.env.LOCALAPPDATA ? 'npm-cache/_npx' : '_npx');
  if (fs.existsSync(npx)) for (const d of fs.readdirSync(npx)) cands.push(path.join(npx, d, 'node_modules', 'playwright'));
  for (const c of cands) if (fs.existsSync(c)) return require(c);
  throw new Error('playwright를 찾지 못했다');
}

const [file, out, svgSel] = process.argv.slice(2);
if (!file || !out) {
  console.error('사용: node tools/check_artifact_page.cjs <html> <출력 접두사> [svg 선택자]');
  process.exit(2);
}
const body = fs.readFileSync(file, 'utf8');
const shell = (scheme, extraCss = '') => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{color-scheme:${scheme};box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}${extraCss}</style>
</head><body>${body}</body></html>`;

(async () => {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  let bad = 0;
  for (const [tag, w, scheme] of [['light', 1280, 'light'], ['dark', 1280, 'dark'], ['phone', 400, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    await page.setContent(shell(scheme), { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const r = await page.evaluate((sel) => {
      const res = { docW: document.documentElement.scrollWidth, winW: window.innerWidth, overflowText: [], overlap: [], labelHits: [] };
      const svg = sel ? document.querySelector(sel) : null;
      if (svg) {
        const rects = [...svg.querySelectorAll('rect.box')].map((b) => ({
          x: +b.getAttribute('x'), y: +b.getAttribute('y'), w: +b.getAttribute('width'), h: +b.getAttribute('height'),
        }));
        for (const t of svg.querySelectorAll('text.lbl, text.sub')) {
          const tx = +t.getAttribute('x'), ty = +t.getAttribute('y');
          const box = rects.find((b) => tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h);
          if (!box) continue;
          const len = t.getComputedTextLength();
          if (tx + len > box.x + box.w - 4) res.overflowText.push({ text: t.textContent, over: Math.round(tx + len - (box.x + box.w - 4)) });
        }
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i], b = rects[j];
          if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) res.overlap.push([i, j]);
        }
        for (const t of svg.querySelectorAll('text.elbl, text.glbl')) {
          const bb = t.getBBox();
          for (const b of rects) if (bb.x < b.x + b.w && b.x < bb.x + bb.width && bb.y < b.y + b.h && b.y < bb.y + bb.height) res.labelHits.push(t.textContent);
        }
      }
      return res;
    }, svgSel || null);
    const fail = r.docW > r.winW || r.overflowText.length || r.overlap.length || r.labelHits.length || errs.length;
    if (fail) bad++;
    console.log(`${fail ? 'FAIL' : 'ok  '} ${tag}`, JSON.stringify({ ...r, errs }));
    await page.screenshot({ path: `${out}_${tag}.png`, fullPage: true });
    await ctx.close();
  }
  if (svgSel) {
    // SVG 전체 — 가로 스크롤 상자를 풀고 넓은 창으로 찍는다
    const ctx = await browser.newContext({ viewport: { width: 3800, height: 1000 } });
    const page = await ctx.newPage();
    await page.setContent(shell('light', '.chart{overflow:visible!important}.wrap{max-width:none!important}'), { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const el = await page.$(svgSel);
    if (el) await el.screenshot({ path: `${out}_svg.png` });
    await ctx.close();
  }
  await browser.close();
  console.log(bad ? `FAIL ${bad}` : 'PASS');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
