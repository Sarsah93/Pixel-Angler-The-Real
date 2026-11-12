/**
 * capture_butchery_wiki.cjs — 위키 「어종 손질」 탭 공정 그림 찍기 (315차)
 *
 * 사용자 지시(2026-11-11): 「wiki에 어종 손질 탭 … 카테고리 별로 클릭 시, 손질 공정 과정을 한 눈에 볼 수 있도록 이미지」.
 * 게임 손질 창을 dev 서버에서 열어 **작업마다**(dev 작업 점프 — 앞 작업은 다 한 상태) 도마를 찍는다.
 * 그 작업의 유도선이 그려진 그대로다(어디를 어떻게 긋는지). 어종군마다 대표 어종 한 마리.
 *
 * 출력: tools/wiki_img/butchery/<공정>.png(칸 300 × 170을 세로로 이은 시트) + manifest.json(단계 이름 · 안내 글 · 칸 크기)
 * 실행: (dev 서버 5173) node tools/capture_butchery_wiki.cjs [http://127.0.0.1:5173/] [공정,공정…]
 * 그다음: node tools/gen_game_wiki_data.mjs --html > <위키 index.html>
 */
'use strict';
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tools/wiki_img/butchery');
const URL = process.argv[2] && process.argv[2].startsWith('http') ? process.argv[2] : 'http://127.0.0.1:5173/';
const ONLY = (process.argv.find((a, i) => i >= 2 && !a.startsWith('http')) || '').split(',').filter(Boolean);

/** 공정 = 대표 어종 한 마리 (어종군 → 위키 갈래) */
const FLOWS = [
  { id: 'amberjack', sp: 'greater_amberjack', len: 80, wg: 4000 },
  { id: 'small', sp: 'pacific_saury', len: 32, wg: 150 },
  { id: 'bream', sp: 'black_seabream', len: 40, wg: 1200 },
  { id: 'halibut', sp: 'flatfish', len: 50, wg: 1600 },
  { id: 'squid', sp: 'squid', len: 35, wg: 900 },
  { id: 'octopus', sp: 'octopus', len: 60, wg: 1500 },
  { id: 'eel_conger', sp: 'conger_eel', len: 70, wg: 900 },
  { id: 'eel_pike', sp: 'pike_conger', len: 90, wg: 1200 },
  { id: 'eel_hag', sp: 'hagfish', len: 50, wg: 500 },
  { id: 'loin', sp: 'bluefin_tuna', len: 110, wg: 25000 },   // 317 — 4덩어리 해체(참다랑어 · 대방어급)
].filter((f) => !ONLY.length || ONLY.includes(f.id));

const TW = 300, TH = 170;   // 시트 한 칸(도마 600 × 340을 절반으로)

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const manPath = path.join(OUT, 'manifest.json');
  const man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : {};
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.addInitScript(() => localStorage.setItem('tra_fp_guide_seen', '1'));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.__PIXEL_ANGLER_GAME?.scene.isActive('MainMenuScene') && globalThis.__GS && globalThis.__INV, null, { timeout: 240000 });
  await page.evaluate(() => {
    const g = globalThis.__PIXEL_ANGLER_GAME;
    globalThis.__GS.startNewGameInSlot(3);
    globalThis.__GS.setFlag?.('tour.butchery', true);
    g.scene.stop('MainMenuScene');
    g.scene.start('RegionFieldScene', { region: 'gangwon_sokcho' });
  });
  await page.waitForFunction(() => { const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene'); return s?.scene.isActive() && s.hud; }, null, { timeout: 240000 });
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    globalThis.__BPmod = await import('/src/ui/ButcheryPanel.ts');
    (await import('/src/ui/GuideTour.ts')).setGuideTipsEnabled(false);
  });

  for (const f of FLOWS) {
    const info = await page.evaluate(({ sp, len, wg }) => {
      const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
      const INV = globalThis.__INV;
      const id = `inv_wikicap_${sp}`;
      // 앞 공정이 지급한 부산물 · 필렛으로 가방이 차면 다음 어종을 못 넣는다 — 먹을거리 칸을 비우고 시작
      for (const it of [...INV.items]) if (it.category === 'food') INV.removeItem(it.id, false);
      INV.addItem({ id, name: sp, icon: '', category: 'food', subCategory: '어획물', basePrice: 9000, condition: 'live', equippable: false, speciesId: sp, lengthCm: len, weightG: wg, sex: 'F', conditionSinceMs: Date.now() }, 1);
      globalThis.__bp?.destroy();
      const bp = new globalThis.__BPmod.ButcheryPanel(s, INV.find(id), { onClose: () => {}, onComplete: () => {} });
      s.add.existing(bp); globalThis.__bp = bp;
      return {
        tasks: bp.sections.flatMap((sec, si) => sec.tasks.map((t) => ({ si, sec: sec.label, id: t.id, task: t.label }))),
        clip: { x: bp.x + bp.boardX - 20, y: bp.y + bp.boardCy - 170, width: bp.boardW + 40, height: 340 },
      };
    }, f);
    const steps = [];
    const shots = [];
    for (const t of info.tasks) {
      const st = await page.evaluate(({ si, id }) => {
        const bp = globalThis.__bp;
        bp.devJumpToTask(si, id);
        if (bp.byproductPopup) bp.confirmByproductPopup(false);
        const s = bp.process.stage;
        return s ? { label: s.label, guide: s.guide, prim: s.primitive } : null;
      }, t);
      if (!st) continue;
      await page.waitForTimeout(450);
      const buf = await page.screenshot({ clip: info.clip });
      shots.push(buf.toString('base64'));
      steps.push({ sec: t.sec, task: t.task, stage: st.label, guide: st.guide });
    }
    // 시트 굽기 — 브라우저 캔버스로 절반 크기(부드럽게) · 세로로 잇기
    const png = await page.evaluate(async ({ shots, TW, TH }) => {
      const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH * shots.length;
      const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      for (let i = 0; i < shots.length; i++) {
        const im = new Image(); im.src = `data:image/png;base64,${shots[i]}`;
        await im.decode();
        ctx.drawImage(im, 0, i * TH, TW, TH);
      }
      return cv.toDataURL('image/png').split(',')[1];
    }, { shots, TW, TH });
    const file = path.join(OUT, `${f.id}.png`);
    fs.writeFileSync(file, Buffer.from(png, 'base64'));
    man[f.id] = { sp: f.sp, file: `butchery/${f.id}.png`, tileW: TW, tileH: TH, steps };
    fs.writeFileSync(manPath, `${JSON.stringify(man, null, 1)}\n`);   // 공정마다 바로 적는다(중간에 멈춰도 찍은 것은 남는다)
    console.log(`[capture_butchery_wiki] ${f.id} (${f.sp}) — ${steps.length}단계 · ${Math.round(fs.statSync(file).size / 1024)}KB`);
    await page.evaluate(() => { globalThis.__bp?.destroy(); globalThis.__bp = null; });
  }
  fs.writeFileSync(manPath, `${JSON.stringify(man, null, 1)}\n`);
  console.log(`[capture_butchery_wiki] pageerror ${errs.length}`, errs.slice(0, 3));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
