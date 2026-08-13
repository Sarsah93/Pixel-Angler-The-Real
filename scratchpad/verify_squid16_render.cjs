/**
 * @file verify_squid16_render.cjs
 * @description 092차 실렌더 검증 — 무늬오징어 껍질 3구간(회전 뷰·탭·진행 프레임) + 날개 2단 ×2 +
 *  아가미 합성. 실마우스 드래그로 뜯기 진행 프레임(peelDragT)·완료 연출·회전 배치를 스크린샷으로 남긴다.
 * 실행: node scratchpad/verify_squid16_render.cjs  (선행: dev 서버 5173)
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

  // ── 패널 직접 생성 (MainMenuScene 위 — scene.add.existing 필수) ──
  await page.evaluate(async () => {
    const game = globalThis.__PIXEL_ANGLER_GAME;
    const scene = game.scene.getScene('MainMenuScene');
    const { ButcheryPanel } = await import('/src/ui/ButcheryPanel.ts');
    const source = {
      id: 'inv_catch_squid_v16', name: '무늬오징어', icon: '🦑', category: 'food',
      subCategory: '어획물', qty: 1, basePrice: 12000,
      speciesId: 'squid', lengthCm: 30, weightG: 786, condition: 'live',
    };
    const panel = new ButcheryPanel(scene, source, { onClose: () => {}, onComplete: () => {} });
    scene.add.existing(panel);
    globalThis.__PANEL = panel;
  });
  const canvasBox = await (await page.$('canvas')).boundingBox();
  const toScreen = (gx, gy) => ({
    x: canvasBox.x + gx * (canvasBox.width / 1280),
    y: canvasBox.y + gy * (canvasBox.height / 720),
  });

  /** 패널 상태 프로브 */
  const probe = () => page.evaluate(() => {
    const p = globalThis.__PANEL;
    return {
      stage: p.process.stage ? p.process.stage.id : null,
      rot: p.process.rotation, drawnRot: p.renderedRotation,
      peelT: p.peelDragT, anim: !!p.actionAnim, flipping: !!p.flipping,
      finished: p.process.finished,
      subject: p.subjectRect,
      panelXY: { x: p.x, y: p.y },
    };
  });
  /** 연출/뒤집기 종료 대기 + 부산물 팝업(모달) [확인 후 계속] 처리 */
  const settle = async () => {
    for (let i = 0; i < 4; i++) {
      await page.waitForFunction(() => {
        const p = globalThis.__PANEL;
        return !p.actionAnim && !p.flipping;
      }, { timeout: 15000 });
      await page.waitForTimeout(120);
      const hadPopup = await page.evaluate(() => {
        const p = globalThis.__PANEL;
        if (!p.byproductPopup) return false;
        p.confirmByproductPopup(false);   // 부산물 전량 [보관] 유지 + 확인 후 계속
        return true;
      });
      if (!hadPopup) return;
      await page.waitForTimeout(150);
    }
  };
  /** 정규화 → 화면 px (toPanelPx + 패널 오프셋 + 캔버스 스케일) */
  const normToScreen = async (nx, ny) => {
    const g = await page.evaluate(([x, y]) => {
      const p = globalThis.__PANEL;
      const [px, py] = p.toPanelPx({ x, y });
      return { x: p.x + px, y: p.y + py };
    }, [nx, ny]);
    return toScreen(g.x, g.y);
  };
  const shot = async (name) => {
    const st = await probe();
    const clip = {
      x: canvasBox.x + st.panelXY.x * (canvasBox.width / 1280),
      y: canvasBox.y + st.panelXY.y * (canvasBox.height / 720),
      width: 1080 * (canvasBox.width / 1280), height: 656 * (canvasBox.height / 720),
    };
    await page.screenshot({ path: path.join(__dirname, `s16_${name}.png`), clip });
    console.log(`  📷 s16_${name}.png`);
  };
  /** 경로를 따라 실마우스 드래그 (down → 경로 추종 → up 없이 반환 가능) */
  const dragPath = async (pts, { release = true, midShot = null, midShots = null } = {}) => {
    const first = await normToScreen(pts[0].x, pts[0].y);
    await page.mouse.move(first.x, first.y);
    await page.mouse.down();
    const N = 14;
    const mids = midShots ?? (midShot ? [midShot] : []);
    for (let k = 1; k <= N; k++) {
      const t = k / N;
      const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
      const tt = t * (pts.length - 1) - seg;
      const nx = pts[seg].x + (pts[seg + 1].x - pts[seg].x) * tt;
      const ny = pts[seg].y + (pts[seg + 1].y - pts[seg].y) * tt;
      const s = await normToScreen(nx, ny);
      await page.mouse.move(s.x, s.y, { steps: 2 });
      await page.waitForTimeout(24);
      for (const m of mids) {
        if (!m.taken && k === Math.floor(N * m.at)) { await shot(m.name); m.done = await probe(); m.taken = true; }
      }
    }
    if (release) await page.mouse.up();
  };

  // ── 가이드 좌표 (core와 동일 값 — 하네스 로컬 사본, 095차 4단계 분할 기준) ──
  const PEEL_STEPS = [
    [{ x: 0.661, y: 0.730 }, { x: 0.550, y: 0.530 }],   // 실측 (096차)
    [{ x: 0.670, y: 0.668 }, { x: 0.668, y: 0.366 }],
    [{ x: 0.613, y: 0.547 }, { x: 0.729, y: 0.187 }],
    [{ x: 0.557, y: 0.530 }, { x: 0.552, y: 0.217 }],
  ];
  const HEAD_SPLIT = [
    [{ x: 0.771, y: 0.247 }, { x: 0.773, y: 0.905 }],
    [{ x: 0.510, y: 0.177 }, { x: 0.510, y: 0.979 }],
  ];
  const BEAK = [{ x: 0.575, y: 0.613 }, { x: 0.493, y: 0.559 }];
  const PEEL2 = [{ x: 0.60, y: 0.25 }, { x: 0.15, y: 0.28 }];
  const FINSKIN = [
    [{ x: 0.24, y: 0.82 }, { x: 0.36, y: 0.55 }, { x: 0.48, y: 0.30 }],
    [{ x: 0.76, y: 0.82 }, { x: 0.64, y: 0.55 }, { x: 0.52, y: 0.30 }],
  ];
  const FIN = [
    [{ x: 0.822, y: 0.240 }, { x: 0.212, y: 0.247 }],   // 실측 (094차)
    [{ x: 0.842, y: 0.647 }, { x: 0.185, y: 0.657 }],   // 실측 (094차)
  ];
  const VISCERA1 = [{ x: 0.045, y: 0.514 }, { x: 0.882, y: 0.507 }];
  const VISCERA2 = [{ x: 0.42, y: 0.45 }, { x: 0.90, y: 0.40 }];
  const GILL_SWEEP = [
    { x: 0.593, y: 0.335 }, { x: 0.340, y: 0.342 }, { x: 0.256, y: 0.480 },
    { x: 0.502, y: 0.514 }, { x: 0.663, y: 0.634 }, { x: 0.424, y: 0.692 }, { x: 0.170, y: 0.692 },
  ];

  console.log('── ⓪ 내장 분리 2분할 (094차 — 뽑기 1/2 미러 실사) ──');
  await page.evaluate(() => globalThis.__PANEL.devJumpToTask(1, 't_ceph_viscera_1'));
  await settle();
  let st0 = await probe();
  ok(st0.stage === 'ceph_viscera_pull_1', `스테이지 = viscera 1/2 (${st0.stage})`);
  await shot('00a_viscera1_spread');
  await dragPath(VISCERA1);
  await page.waitForTimeout(500);
  st0 = await probe();
  if (st0.anim) await shot('00b_viscera1_anim_lift1');
  await settle();
  st0 = await probe();
  ok(st0.stage === 'ceph_viscera_pull_2', `1/2 완료 → 2/2 (${st0.stage})`);
  await shot('00c_viscera2_lift1m');
  await dragPath(VISCERA2);
  await page.waitForTimeout(500);
  st0 = await probe();
  if (st0.anim) await shot('00d_viscera2_anim_lift2');
  await settle();
  st0 = await probe();
  ok(st0.stage === 'ceph_pen_out', `2/2 완료 → 연골 (${st0.stage})`);

  console.log('── ① 껍질 들추기 (탭 · 좌 90° 회전 뷰 — 링은 화면 우상단) ──');
  await page.evaluate(() => globalThis.__PANEL.devJumpToTask(3, 't_ceph_flip_skin'));
  await settle();
  let st = await probe();
  ok(st.stage === 'ceph_flip_skin', `스테이지 = ceph_flip_skin (${st.stage})`);
  ok(st.rot === 270 && st.drawnRot === 270, `회전 270 (process ${st.rot} / 표시 ${st.drawnRot})`);
  ok(st.subject.w < st.subject.h * 1.4, `subjectRect 세로 배치 (${st.subject.w.toFixed(0)}×${st.subject.h.toFixed(0)})`);
  await shot('01_flipskin_rot270');
  {
    const tp = await normToScreen(0.770, 0.777);   // CEPH_SKIN_LIFT_TAP (로컬 — 화면 우상단에 표시)
    await page.mouse.click(tp.x, tp.y);
    await page.waitForTimeout(600);                 // 들추기 연출 중간 (skin_lift 프레임)
    st = await probe();
    if (st.anim) await shot('02_flipskin_lift_anim');
    await settle();
    st = await probe();
    ok(st.stage === 'ceph_skin_peel_1', `탭 성공 → 껍질 뜯기 1/4 진입 (${st.stage})`);
    ok(st.rot === 270 && st.drawnRot === 270, `회전 270 유지 (process ${st.rot} / 표시 ${st.drawnRot})`);
  }

  console.log('── ② 껍질 뜯기(가로) 4단계 — 짧은 당김마다 다음 사진 (095차) ──');
  {
    const NEXT = ['ceph_skin_peel_2', 'ceph_skin_peel_3', 'ceph_skin_peel_4', 'ceph_skin_finish'];
    for (let step = 0; step < 4; step++) {
      await shot(`03_peel_step${step + 1}_start`);
      await dragPath(PEEL_STEPS[step]);
      await page.waitForTimeout(400);
      st = await probe();
      if (st.anim && step === 1) await shot('04_peel_step2_anim');
      await settle();
      st = await probe();
      ok(st.stage === NEXT[step], `${step + 1}/4 당김 완료 → ${NEXT[step]} (${st.stage})`);
      ok(st.rot === 270, `회전 270 유지 (${st.rot})`);
    }
  }

  console.log('── ③ 껍질 뜯기 ② — 상→하 마무리 · 4.1 → 합성B → 완료 연출 4.2 ──');
  await shot('07_peel2_start_41');
  {
    // 완료 연출 중간 프레임(squid_skin_pull 오버라이드) 캡처를 위해 릴리즈 직후 즉시 촬영
    await dragPath(PEEL2, { release: false });
    await shot('08_peel2_dragging');
    await page.mouse.up();
    await page.waitForTimeout(500);   // 액션 연출 중간
    st = await probe();
    if (st.anim) await shot('09_peel2_finish_anim');
    await settle();
    st = await probe();
    ok(st.stage === 'ceph_skin_done', `뜯기 ② 완료 → skin_done (${st.stage})`);
    ok(st.rot === 270, `회전 270 유지 (${st.rot})`);
  }
  await shot('10_skin_done_photo6');
  await page.keyboard.press('Enter');   // 결과 확인 (button)
  await settle();
  st = await probe();
  ok(st.stage === 'ceph_fin_off_1', `결과 확인 → 날개살 분리 1/2 (094차 순서) (${st.stage})`);
  ok(st.rot === 0, `날개 구간 회전 0 복귀 (${st.rot})`);

  console.log('── ④ 날개살 분리 (먼저) — 날개 0 시작 · 드래그 **후** 전환 이미지 (095차) ──');
  await shot('11_fin1_start_fin0');
  {
    const mid = { at: 0.6, name: '12_fin1_during', done: null, taken: false };
    await dragPath(FIN[0], { midShot: mid });
    // 095차: 라이브 전환 폐기 — 드래그 중에는 시작 사진 유지(peelDragT 미주입 = 0)
    ok(mid.done && mid.done.peelT === 0, `드래그 중 프레임 전환 없음 (peelDragT ${mid.done?.peelT})`);
    await page.waitForTimeout(400);
    st = await probe();
    if (st.anim) await shot('12b_fin1_after_drag');   // 드래그 후 = 전환 이미지(5.1 좌우+상하반전)
    await settle();
    st = await probe();
    ok(st.stage === 'ceph_fin_off_2', `날개살 1/2 완료 → 2/2 (${st.stage})`);
  }
  await shot('13_fin2_start_fin0m');
  await dragPath(FIN[1]);
  await page.waitForTimeout(400);
  st = await probe();
  if (st.anim) await shot('13b_fin2_after_drag');
  await settle();
  st = await probe();
  ok(st.stage === 'ceph_finskin_off_1', `날개살 2/2 완료 → 껍질째 1/2 (${st.stage})`);

  console.log('── ⑤ 날개 뜯기(껍질째) 1/2 · 2/2 (미러) ──');
  await shot('14_finskin1_intact');
  await dragPath(FINSKIN[0]);
  await page.waitForTimeout(500);
  st = await probe();
  if (st.anim) await shot('15_finskin1_tear_anim');
  await settle();
  st = await probe();
  ok(st.stage === 'ceph_finskin_off_2', `1/2 완료 → 2/2 (${st.stage})`);
  await shot('16_finskin2_mirrored');
  await dragPath(FINSKIN[1]);
  await settle();
  st = await probe();
  ok(st.stage === 'ceph_gill_wash', `껍질째 2/2 완료 → 아가미 (${st.stage})`);

  console.log('── ⑥ 아가미 — 합성(gill_on) 표시 + 실측 스윕 문지르기 ──');
  await shot('17_gill_on_composite');
  {
    // 스윕 경로를 왕복 3회 훑는다 (커버리지 게이지)
    for (let r = 0; r < 3; r++) {
      await dragPath(r % 2 === 0 ? GILL_SWEEP : [...GILL_SWEEP].reverse());
      st = await probe();
      if (st.stage !== 'ceph_gill_wash') break;
    }
    await settle();
    st = await probe();
    ok(st.stage === 'ceph_head_split', `아가미 완료 → 3분할 (${st.stage})`);
  }
  await shot('18_headmass');

  console.log('── ⑦ 머리부 3분할 조각 밀림 + 부리 = 가운데 조각만 (096차) ──');
  {
    await dragPath(HEAD_SPLIT[0]);
    await page.waitForTimeout(1700);   // 스윕(0~0.7) 뒤 조각 밀림 구간
    st = await probe();
    if (st.anim) await shot('19_split_cut1_slide');
    await settle();
    st = await probe();
    ok(st.stage === 'ceph_head_split', `1컷 후 스테이지 유지 (${st.stage})`);
    await shot('20_split_cut1_gap');
    await dragPath(HEAD_SPLIT[1]);
    await page.waitForTimeout(1700);
    st = await probe();
    if (st.anim) await shot('21_split_cut2_slide');
    await settle();
    st = await probe();
    ok(st.stage === 'ceph_beak_out', `3분할 완료 → 부리 (${st.stage})`);
    await shot('22_beak_middle_only');
    await dragPath(BEAK);
    await settle();
    st = await probe();
    ok(st.finished === true, `부리 완료 → 완주 (finished ${st.finished})`);
  }

  console.log(`\n[pageerror] ${errors.length}`, errors.slice(0, 3));
  ok(errors.length === 0, 'pageerror 0');
  console.log(`결과: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
