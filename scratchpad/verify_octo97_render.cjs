/**
 * @file verify_octo97_render.cjs
 * @description 097차 실렌더 검증 — ① 문어 8스테이지 실마우스 완주(파라메트릭 3뷰·소금 게이트) +
 *  ② 한치 = 오징어 실사 스프라이트 공유 + ③ 두족류 회뜨기 3모드(몸통살 22점·날개살 4점·촉완 분리).
 * 실행: node scratchpad/verify_octo97_render.cjs  (선행: dev 서버 5173)
 */
const fs = require('fs');
const path = require('path');
function resolvePlaywright() {
  try { return require('playwright'); } catch { /* npx 캐시 탐색 */ }
  const base = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const p = path.join(base, d, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error('playwright not found');
}
const { chromium } = resolvePlaywright();

let pass = 0, fail = 0;
const ok = (cond, label) => {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}`); }
};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('tra_fp_guide_seen', '1'));
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const g = globalThis.__PIXEL_ANGLER_GAME;
    return g && g.scene.isActive('MainMenuScene');
  }, { timeout: 30000 });
  const canvasBox = await (await page.$('canvas')).boundingBox();
  const toScreen = (gx, gy) => ({
    x: canvasBox.x + gx * (canvasBox.width / 1280),
    y: canvasBox.y + gy * (canvasBox.height / 720),
  });
  const shotClip = async (name, gx, gy, gw, gh) => {
    await page.screenshot({
      path: path.join(__dirname, `o97_${name}.png`),
      clip: {
        x: canvasBox.x + gx * (canvasBox.width / 1280), y: canvasBox.y + gy * (canvasBox.height / 720),
        width: gw * (canvasBox.width / 1280), height: gh * (canvasBox.height / 720),
      },
    });
    console.log(`  📷 o97_${name}.png`);
  };

  // ═══════════ ① 문어 손질 완주 ═══════════
  console.log('── ① 문어 8스테이지 (실마우스) ──');
  await page.evaluate(async () => {
    const game = globalThis.__PIXEL_ANGLER_GAME;
    const scene = game.scene.getScene('MainMenuScene');
    const { ButcheryPanel } = await import('/src/ui/ButcheryPanel.ts');
    const source = {
      id: 'inv_catch_octopus_v97', name: '참문어', icon: '🐙', category: 'food',
      subCategory: '어획물', qty: 1, basePrice: 15000,
      speciesId: 'octopus', lengthCm: 45, weightG: 1400, condition: 'live',
    };
    globalThis.__INV.addItem(source, 1);
    const panel = new ButcheryPanel(scene, globalThis.__INV.find('inv_catch_octopus_v97'),
      { onClose: () => {}, onComplete: () => {} });
    scene.add.existing(panel);
    globalThis.__PANEL = panel;
  });
  const probe = () => page.evaluate(() => {
    const p = globalThis.__PANEL;
    return {
      stage: p.process.stage ? p.process.stage.id : null,
      ori: p.process.orientation, drawnOri: p.renderedOrientation,
      finished: p.process.finished, fill: p.process.currentFill,
      flash: p.flashMsg ? p.flashMsg.text : null,
      panelXY: { x: p.x, y: p.y },
    };
  });
  const settle = async () => {
    for (let i = 0; i < 5; i++) {
      await page.waitForFunction(() => {
        const p = globalThis.__PANEL;
        return !p.actionAnim && !p.flipping;
      }, { timeout: 15000 });
      await page.waitForTimeout(120);
      const hadPopup = await page.evaluate(() => {
        const p = globalThis.__PANEL;
        if (!p.byproductPopup) return false;
        p.confirmByproductPopup(false);
        return true;
      });
      if (!hadPopup) return;
      await page.waitForTimeout(150);
    }
  };
  const normToScreen = async (nx, ny) => {
    const g = await page.evaluate(([x, y]) => {
      const p = globalThis.__PANEL;
      const [px, py] = p.toPanelPx({ x, y });
      return { x: p.x + px, y: p.y + py };
    }, [nx, ny]);
    return toScreen(g.x, g.y);
  };
  const dragPath = async (pts, steps = 16) => {
    const first = await normToScreen(pts[0].x, pts[0].y);
    await page.mouse.move(first.x, first.y);
    await page.mouse.down();
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
      const tt = t * (pts.length - 1) - seg;
      const s = await normToScreen(
        pts[seg].x + (pts[seg + 1].x - pts[seg].x) * tt,
        pts[seg].y + (pts[seg + 1].y - pts[seg].y) * tt);
      await page.mouse.move(s.x, s.y, { steps: 2 });
    }
    await page.mouse.up();
    await settle();
  };
  const stagePaths = () => page.evaluate(() => {
    const s = globalThis.__PANEL.process.stage;
    return { cut: s?.cut?.guidePath ?? null, sweep: s?.sweepPath ?? null };
  });

  // ⚠ page.keyboard.press('Enter')는 아래 MainMenuScene 메뉴 선택까지 구동한다
  //   (NEW GAME 시작 → InventoryStore.resetAll() — 1차 실행에서 실측). 패널 핸들러 직접 호출.
  const pressEnter = async () => {
    await page.evaluate(() => { globalThis.__PANEL.onKey({ code: 'Enter', shiftKey: false }); });
    await settle();
  };

  let st = await probe();
  ok(st.stage === 'octo_invert' && st.drawnOri === 'OCTO_WHOLE', `외번 스테이지 · OCTO_WHOLE 렌더 (${st.stage}/${st.drawnOri})`);
  await shotClip('octo_whole', 100, 30, 1080, 660);
  await dragPath((await stagePaths()).cut);
  st = await probe();
  ok(st.stage === 'octo_viscera_pull' && st.drawnOri === 'OCTO_INVERTED', `내장 단계 · OCTO_INVERTED 전환 (${st.stage}/${st.drawnOri})`);
  await shotClip('octo_inverted', 100, 30, 1080, 660);
  await dragPath((await stagePaths()).cut);
  st = await probe();
  ok(st.stage === 'octo_revert', `되돌리기 단계 도달 (${st.stage})`);
  await pressEnter();
  st = await probe();
  ok(st.stage === 'octo_salt', `소금 단계 도달 (${st.stage})`);

  // 소금 게이트 — 소금 없이 드래그 시작 → 차단 플래시
  await page.evaluate(() => {
    const it = globalThis.__INV.find('inv_coarse_salt');
    if (it) globalThis.__INV.removeQty('inv_coarse_salt', it.qty);
  });
  {
    const sw = (await stagePaths()).sweep;
    const s0 = await normToScreen(sw[0].x, sw[0].y);
    await page.mouse.move(s0.x, s0.y);
    await page.mouse.down();
    await page.mouse.up();
    st = await probe();
    ok((st.flash ?? '').includes('굵은소금'), `소금 없음 → 차단 안내 ('${st.flash}')`);
    ok(st.stage === 'octo_salt' && st.fill === 0, '차단 중 게이지 진행 없음');
  }
  await page.evaluate(() => {
    globalThis.__INV.addItem({
      id: 'inv_coarse_salt', name: '굵은소금', icon: '🧂', category: 'consumable',
      subCategory: '조미/손질', basePrice: 2000, equippable: false,
    }, 2);
  });
  {
    const sw = (await stagePaths()).sweep;
    // 지그재그 스윕 2회 왕복 — 커버리지 게이지 채우기
    await dragPath([...sw, ...[...sw].reverse(), ...sw], 40);
  }
  st = await probe();
  ok(st.stage === 'octo_scrub', `소금 완료 → 문지르기 단계 (${st.stage})`);
  const saltLeft = await page.evaluate(() => globalThis.__INV.find('inv_coarse_salt')?.qty ?? 0);
  ok(saltLeft === 1, `굵은소금 1개 소모 (잔여 ${saltLeft})`);
  await shotClip('octo_scrub_foam', 100, 30, 1080, 660);
  {
    const sw = (await stagePaths()).sweep;
    await dragPath([...sw, ...[...sw].reverse(), ...sw], 40);
  }
  st = await probe();
  ok(st.stage === 'octo_wash', `세척 단계 도달 (${st.stage})`);
  await pressEnter();
  st = await probe();
  ok(st.stage === 'octo_beak_out' && st.drawnOri === 'OCTO_ORAL', `악판 단계 · OCTO_ORAL 렌더 (${st.stage}/${st.drawnOri})`);
  await shotClip('octo_oral', 100, 30, 1080, 660);
  await dragPath((await stagePaths()).cut);
  st = await probe();
  ok(st.stage === 'octo_done', `완료 스테이지 도달 (${st.stage})`);
  await pressEnter();
  st = await probe();
  ok(st.finished, '문어 완주 (finished)');
  ok(await page.evaluate(() => globalThis.__PIXEL_ANGLER_GAME.scene.isActive('MainMenuScene')),
    'MainMenuScene 유지 (메뉴 오작동 없음)');
  await shotClip('octo_result', 100, 30, 1080, 660);
  const octoInv = await page.evaluate(() => {
    const inv = globalThis.__INV;
    return {
      whole: inv.items.find((i) => i.id.startsWith('inv_ceph_octo_whole_'))?.name ?? null,
      ink: inv.items.find((i) => i.id === 'inv_ceph_octo_ink_sac')?.qty ?? 0,
      fillet: inv.items.some((i) => i.id.startsWith('inv_fillet_octopus')),
      source: !!inv.find('inv_catch_octopus_v97'),
    };
  });
  ok(!!octoInv.whole, `문어 통마리 순살 지급 ('${octoInv.whole}')`);
  ok(octoInv.ink >= 1, `먹물주머니 지급 (${octoInv.ink})`);
  ok(!octoInv.fillet, '두족류 = 순수 필렛 미지급 (097차)');
  ok(!octoInv.source, '원물 소모');
  await page.evaluate(() => { globalThis.__PANEL.destroy(); globalThis.__PANEL = undefined; });

  // ═══════════ ② 한치 — 오징어 실사 스프라이트 공유 ═══════════
  console.log('── ② 한치 트리 진입 (스프라이트 공유) ──');
  await page.evaluate(async () => {
    const game = globalThis.__PIXEL_ANGLER_GAME;
    const scene = game.scene.getScene('MainMenuScene');
    const { ButcheryPanel } = await import('/src/ui/ButcheryPanel.ts');
    const source = {
      id: 'inv_catch_swordtip_v97', name: '한치', icon: '🦑', category: 'food',
      subCategory: '어획물', qty: 1, basePrice: 18000,
      speciesId: 'swordtip_squid', lengthCm: 32, weightG: 520, condition: 'live',
    };
    globalThis.__INV.addItem(source, 1);
    const panel = new ButcheryPanel(scene, globalThis.__INV.find('inv_catch_swordtip_v97'),
      { onClose: () => {}, onComplete: () => {} });
    scene.add.existing(panel);
    globalThis.__PANEL = panel;
  });
  {
    const info = await page.evaluate(async () => {
      const p = globalThis.__PANEL;
      const { cephStageSprite } = await import('/src/ui/CephalopodFish.ts');
      const spr = cephStageSprite({ stageId: p.process.stage?.id });
      return { stage: p.process.stage?.id, count: p.process.stageList.length, spr: spr ? `${spr.w}x${spr.h}` : null };
    });
    ok(info.count === 20 && info.stage === 'ceph_shime_mantle', `한치 = 20스테이지 진입 (${info.stage})`);
    ok(!!info.spr, `오징어 실사 스프라이트 공유 (${info.spr})`);
    await shotClip('swordtip_stage1', 100, 30, 1080, 660);
  }
  await page.evaluate(() => { globalThis.__PANEL.destroy(); globalThis.__PANEL = undefined; });

  // ═══════════ ③ 두족류 회뜨기 3모드 (SashimiPanel) ═══════════
  console.log('── ③ 회뜨기 — 몸통살 22점 / 날개살 4점 / 촉완 분리 ──');
  const openSlice = async (tpl, qty) => {
    await page.evaluate(async ([t, q]) => {
      const game = globalThis.__PIXEL_ANGLER_GAME;
      const scene = game.scene.getScene('MainMenuScene');
      const { SashimiPanel } = await import('/src/ui/SashimiPanel.ts');
      globalThis.__INV.addItem(t, q);
      const panel = new SashimiPanel(scene, globalThis.__INV.find(t.id), 'basic',
        { onClose: () => {}, onComplete: () => {} });
      scene.add.existing(panel);
      globalThis.__SP = panel;
    }, [tpl, qty]);
  };
  const sliceCutScreen = async (orderPos) => {
    return page.evaluate((op) => {
      const p = globalThis.__SP;
      const pathIdx = p.cutOrder[op];
      return p.cutPaths[pathIdx].map((pt) => ({
        x: p.x + p.fr.x + pt.x * p.fr.w, y: p.y + p.fr.y + pt.y * p.fr.h,
      }));
    }, orderPos);
  };
  const doSliceCut = async (orderPos) => {
    const pts = await sliceCutScreen(orderPos);
    const a = toScreen(pts[0].x, pts[0].y), b = toScreen(pts[pts.length - 1].x, pts[pts.length - 1].y);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    for (let k = 1; k <= 14; k++) {
      await page.mouse.move(a.x + (b.x - a.x) * (k / 14), a.y + (b.y - a.y) * (k / 14), { steps: 2 });
    }
    await page.mouse.up();
    await page.waitForTimeout(120);
  };
  const spProbe = () => page.evaluate(() => {
    const p = globalThis.__SP;
    return {
      cutIdx: p.cutIdx, cuts: p.spec.cuts, done: p.done,
      split: !!p.mantleTopImg, wings: p.finWings.filter(Boolean).length,
      xy: { x: p.x, y: p.y },
    };
  });

  // ── 몸통살 22점 ──
  await openSlice({
    id: 'inv_ceph_ceph_mantle_fillet_squid_997', name: '무늬오징어 몸통살 (body tube) 362g',
    icon: '🦑', iconTexture: 'trim_ceph_mantle_squid', category: 'food', subCategory: '부산물',
    basePrice: 9000, speciesId: 'squid', weightG: 362, condition: 'live', equippable: false,
  }, 1);
  await doSliceCut(0);                                    // 가운데 가로 1컷
  let sp = await spProbe();
  ok(sp.cutIdx === 1 && sp.split, `몸통살 가로 1컷 → 두 덩어리 분리 (cutIdx ${sp.cutIdx})`);
  await shotClip('mantle_split', 90, 40, 1100, 640);
  for (let i = 1; i < 11; i++) await doSliceCut(i);       // 세로 10컷 (오른쪽부터)
  sp = await spProbe();
  ok(sp.done && sp.cutIdx === 11, `몸통살 11컷 완주 (cutIdx ${sp.cutIdx})`);
  await shotClip('mantle_done', 90, 40, 1100, 640);
  const mantleInv = await page.evaluate(() => {
    const inv = globalThis.__INV;
    const piece = inv.items.find((i) => i.id.startsWith('inv_sashimi_cut_ceph_mantle_squid_'));
    return { qty: piece?.qty ?? 0, name: piece?.name ?? null, src: !!inv.find('inv_ceph_ceph_mantle_fillet_squid_997') };
  });
  ok(mantleInv.qty === 22, `몸통살 회 조각 ×22 지급 ('${mantleInv.name}' ×${mantleInv.qty})`);
  ok(!mantleInv.src, '몸통살 원물 소모');
  await page.evaluate(() => { globalThis.__SP.destroy(); globalThis.__SP = undefined; });

  // ── 날개살 4점 ──
  await openSlice({
    id: 'inv_ceph_ceph_fin_meat', name: '날개살', icon: '🦑', iconTexture: 'trim_ceph_fin',
    category: 'food', subCategory: '부산물', basePrice: 1200, speciesId: 'squid',
    condition: 'live', equippable: false,
  }, 2);
  sp = await spProbe();
  ok(sp.cuts === 2 && sp.wings === 2, `날개살 = 좌우 날개 2장 렌더 · 2컷 (${sp.wings}장/${sp.cuts}컷)`);
  await shotClip('fin_wings', 90, 40, 1100, 640);
  await doSliceCut(0);
  await doSliceCut(1);
  sp = await spProbe();
  ok(sp.done, '날개살 2컷 완주');
  await shotClip('fin_done', 90, 40, 1100, 640);
  const finInv = await page.evaluate(() => {
    const inv = globalThis.__INV;
    const piece = inv.items.find((i) => i.id.startsWith('inv_sashimi_cut_ceph_fin_squid_'));
    return { qty: piece?.qty ?? 0, srcQty: inv.find('inv_ceph_ceph_fin_meat')?.qty ?? 0 };
  });
  ok(finInv.qty === 4, `날개살 회 조각 ×4 지급 (${finInv.qty})`);
  ok(finInv.srcQty === 1, `날개살 스택 1개만 소모 (잔여 ${finInv.srcQty})`);
  await page.evaluate(() => { globalThis.__SP.destroy(); globalThis.__SP = undefined; });

  // ── 다리부 촉완 분리 ──
  await openSlice({
    id: 'inv_ceph_ceph_arms', name: '다리부', icon: '🦑', iconTexture: 'trim_ceph_arms',
    category: 'food', subCategory: '부산물', basePrice: 1800, speciesId: 'squid',
    condition: 'live', equippable: false,
  }, 1);
  await doSliceCut(0);
  sp = await spProbe();
  ok(sp.done, '다리부 1컷 완주 (촉완 분리)');
  await shotClip('arms_done', 90, 40, 1100, 640);
  const armsInv = await page.evaluate(() => {
    const inv = globalThis.__INV;
    return {
      tent: inv.find('inv_ceph_ceph_tentacle')?.qty ?? 0,
      only: inv.items.find((i) => i.id.startsWith('inv_ceph_arms_only_squid_'))?.name ?? null,
      sashimi: inv.items.some((i) => i.id.startsWith('inv_sashimi_cut_ceph_arms')),
      src: !!inv.find('inv_ceph_ceph_arms'),
    };
  });
  ok(armsInv.tent === 2, `촉완 ×2 지급 (${armsInv.tent})`);
  ok(!!armsInv.only, `촉완이 제거된 다리부 지급 ('${armsInv.only}')`);
  ok(!armsInv.sashimi, '다리부 = 회 조각 아님 (지급 없음)');
  ok(!armsInv.src, '다리부 원물 소모');
  await page.evaluate(() => { globalThis.__SP.destroy(); globalThis.__SP = undefined; });

  console.log(`\n[pageerror] ${errors.length}`, errors.slice(0, 3));
  console.log(`결과: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail > 0 || errors.length > 0 ? 1 : 0);
})();
