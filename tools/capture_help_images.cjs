/**
 * @file capture_help_images.cjs
 * @description 도움말 라이브러리 실캡처 하네스 (187차 — 전 장 재촬영용으로 재작성)
 *
 *   node tools/capture_help_images.cjs <out_dir> [--lang ko|en] [--only key1,key2] [--url http://localhost:5173/]
 *   py   tools/annotate_help_images.py <out_dir> [--lang en]      ← 축소 + 번호 콜아웃 → public/guide/help/
 *
 * 전제: dev 서버(`npx pnpm --filter @tra/client-pc run dev`) — dev 전역(`__GS`·`__INV`·`__FP`·`__COOK`…)을 쓴다.
 * 1280×720 원본을 `<out_dir>/<key>.png`로 저장한다. 콜아웃 좌표(annotate의 CALLOUTS)는 이 원본 좌표계다.
 *
 * 촬영 조건을 고정한다 — 그래야 다시 찍어도 콜아웃이 맞는다.
 *  - 시각: KST 13시대(Date 시프트 · 낮 조명) · 브라우저 시간대 Asia/Seoul(채널 로그 시각도 KST)
 *  - 날씨: 홈타운 맑음(`rerollHometownWeather` 고정) · 속초는 KMA 없으면 기본 맑음
 *  - 새 게임 슬롯 3 · 오프닝 혼잣말/집 안내 생략 플래그 · 1인칭 첫 진입 가이드 생략
 *  - 188차: 새 게임은 빈손 · 집 안 프롤로그로 시작한다 → `applyStartKit`이 dev 시드 지급품(`resetAllDevSeed`) ·
 *    창 체험 가이드 플래그(`tour.*`) 전부 · 프롤로그 14목표 완료(단축키 개방)로 187차 무대를 재현한다.
 *    가이드 자체를 보여 주는 두 장(prologue · guide_tour)만 가이드를 띄운다.
 *  - `[dev]` 채널 로그 제거(개발 빌드 전용 줄)
 *
 * 영문(`--lang en`)은 찍을 때마다 화면 Text의 한글 잔존을 훑어 `<out_dir>/_residue.json`에 모은다
 * (사전 누락 목록 — 파일이 없으면 잔존 0). 사전을 고쳤으면 dev 서버를 재시작한 뒤 다시 찍는다.
 *
 * 그룹 단위로 페이지를 새로 띄운다(한 장면의 실패가 다른 장면을 오염시키지 않게).
 * ⚠ 헤드리스는 `scene.time` 타이머가 돌지 않는다(verify-render 스킬) — 지연 호출로 여는 것은 직접 부른다.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// ── 인자 ──────────────────────────────────────────────
const argv = process.argv.slice(2);
const OUT = path.resolve(argv.find((a) => !a.startsWith('--')) || 'help_raw');
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : def; };
const LANG = opt('lang', 'ko');
const ONLY = (opt('only', '') || '').split(',').filter(Boolean);
const URL = opt('url', 'http://localhost:5173/');
fs.mkdirSync(OUT, { recursive: true });

// ── Playwright 찾기 (로컬 설치 → 컨테이너 전역 → Windows npx 캐시) ──
function resolvePlaywright() {
  try { return require('playwright'); } catch { /* 다음 후보 */ }
  const cands = ['/opt/node22/lib/node_modules/playwright', '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright'];
  for (const c of cands) if (fs.existsSync(c)) return require(c);
  const base = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const p = path.join(base, d, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error('playwright not found');
}
const { chromium } = resolvePlaywright();
const launchOpts = fs.existsSync('/opt/pw-browsers/chromium')
  ? { executablePath: '/opt/pw-browsers/chromium' }
  : { channel: 'chrome' };

const want = (key) => ONLY.length === 0 || ONLY.includes(key);
const log = (...a) => console.log('[capture]', ...a);

// ── 부팅 ──────────────────────────────────────────────
async function boot() {
  const browser = await chromium.launch(launchOpts);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, timezoneId: 'Asia/Seoul' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.addInitScript(({ lang }) => {
    // 낮 13시대로 시프트 (시간은 계속 흐른다)
    const D0 = Date; const now = D0.now();
    const kst = new D0(now + 9 * 3600e3);
    const off = ((13 - kst.getUTCHours()) * 60 - kst.getUTCMinutes() + 30) * 60e3;
    class FD extends D0 {
      constructor(...a) { if (a.length === 0) super(D0.now() + off); else super(...a); }
      static now() { return D0.now() + off; }
    }
    FD.UTC = D0.UTC; FD.parse = D0.parse;
    globalThis.Date = FD;
    localStorage.setItem('tra_fp_guide_seen', '1');
    const s = JSON.parse(localStorage.getItem('pixelAngler_settings') || '{}');
    s.language = lang;
    localStorage.setItem('pixelAngler_settings', JSON.stringify(s));
  }, { lang: LANG });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => { const g = globalThis.__PIXEL_ANGLER_GAME; return g && g.scene.isActive('MainMenuScene'); }, null, { timeout: 90000 });
  await page.waitForTimeout(800);
  return { browser, page, errors };
}

async function waitScene(page, key, t = 30000) {
  await page.waitForFunction((k) => globalThis.__PIXEL_ANGLER_GAME.scene.isActive(k), key, { timeout: t });
}

async function shot(page, key) {
  await page.screenshot({ path: path.join(OUT, `${key}.png`) });
  log('saved', key);
  if (LANG === 'en') await scanResidue(page, key);
}

/** 영문 촬영 때 화면에 보이는 Text 중 한글이 남은 것을 모은다 → <out>/_residue.json (사전 누락 목록) */
const RESIDUE = {};
async function scanResidue(page, key) {
  const found = await page.evaluate(() => {
    const out = new Set();
    const g = globalThis.__PIXEL_ANGLER_GAME;
    const visit = (o, vis) => {
      if (!o) return;
      const v = vis && o.visible !== false && (o.alpha === undefined || o.alpha > 0.05);
      if (o.type === 'Text' && v && /[가-힣]/.test(o.text)) out.add(o.text);
      if (o.list) for (const c of o.list) visit(c, v);
    };
    // 멈춘 씬도 그려진다 — 파이팅 장면은 게이지를 고정하려고 pause()한 채 찍으므로 RUNNING만 보면 빠진다
    for (const sc of g.scene.scenes) {
      if (!sc.sys.isVisible() || !(sc.sys.isActive() || sc.sys.isPaused())) continue;
      for (const o of sc.children.list) visit(o, true);
    }
    return [...out];
  });
  if (found.length) {
    RESIDUE[key] = found;
    fs.writeFileSync(path.join(OUT, '_residue.json'), JSON.stringify(RESIDUE, null, 1));
    log(`  residue ${key}: ${found.length}`);
  }
}

/**
 * 190차 — 집 실내 촬영 고정: 창·조명은 실시각·날씨를 따르므로(밤에 찍으면 방이 어둡다) 시간대를 고정하고,
 * 돌아다니는 고양이는 러그 위에서 자게 둔다(콜아웃을 가리지 않게).
 */
async function calmHome(page, phase = 'day') {
  await page.evaluate((phase) => {
    const hi = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('HomeInteriorScene');
    if (hi.ambience) { hi.ambience.force = { phase, weather: 'clear' }; hi.ambience.refresh(); }
    const rug = globalThis.__HOME.placed.find((f) => f.kind === 'rug');
    if (hi.cat && rug) {
      const IT = 48, OX = (1280 - 12 * IT) / 2, OY = (720 - 10 * IT) / 2 + 10;
      hi.cat.x = OX + (rug.tx + 1.5) * IT; hi.cat.y = OY + (rug.ty + 1) * IT + 10;
      hi.cat.state = 'sleep'; hi.cat.timer = 1e9; globalThis.__HOME.cat.fedMs = Date.now(); hi.cat.update(0);
    }
  }, phase);
}

/** 188차 — 창 첫 열기 체험 가이드 id 전부 (`tour.<id>` 플래그 — 켜 두면 말풍선이 뜨지 않는다) */
const TOUR_IDS = ['inventory', 'equipment', 'status', 'journal', 'license', 'fullmap', 'skill', 'shop', 'trade',
  'utilization', 'cooler', 'cooking', 'codex', 'butchery', 'worldmap', 'home_first_steps',
  'home_fridge', 'home_wardrobe', 'home_shelf', 'home_decorate',
  'home_aquarium', 'home_tide_table', 'home_calendar', 'home_fishprint'];
/** 188차 — 프롤로그(M1-01 앞 14목표) 행동 플래그 */
const PROLOGUE_KEYS = ['box', 'rod', 'reel', 'photo', 'journal', 'squid', 'save', 'leave', 'well', 'status', 'map', 'arrive', 'buy', 'sell'];
const PROLOGUE_BUY = ['line', 'hook', 'sinker', 'float', 'bait'];

/**
 * 188차 — 새 게임은 빈손 · 집 안 프롤로그로 시작한다. 촬영용 무대는 그 이전(187차)의 시작 상태로 맞춘다:
 *  ① dev 시드 지급품(대·릴 착용 · 채비 · 소모품 일체 — `resetAllDevSeed`)
 *  ② 오프닝 혼잣말 · 집 안내 · 창 체험 가이드 전부 본 것으로
 *  ③ 프롤로그 14목표 완료 → 단축키가 모두 열린다(`prologueKeyAllowed`)
 * ⚠ `import('/src/store/Prologue.ts')`로 `syncPrologue()`를 부르면 게임과 다른 모듈 인스턴스를 잡을 수 있다
 *   (verify-render) — dev 전역 `__STORY.setObjectiveProgress`로 목표를 직접 채운다(대·릴 착용이 먼저).
 */
async function applyStartKit(page, { skipHomeTour = true, prologue = true } = {}) {
  await page.evaluate(async ({ TOUR_IDS, PROLOGUE_KEYS, PROLOGUE_BUY, skipHomeTour, prologue }) => {
    const gs = globalThis.__GS, inv = globalThis.__INV, story = globalThis.__STORY;
    inv.resetAllDevSeed();
    gs.setFlag('intro.monologue');
    if (skipHomeTour) gs.setFlag('intro.homeTour');
    for (const id of TOUR_IDS) gs.setFlag(`tour.${id}`);
    if (!prologue) return;
    for (const k of PROLOGUE_KEYS) gs.setFlag(`prologue.${k}`);
    for (const k of PROLOGUE_BUY) gs.setFlag(`prologue.buy.${k}`);
    const core = await import('/@id/@tra/core');
    const q = core.getStoryQuest('M1-01');
    for (let i = 0; i < 14; i++) story.setObjectiveProgress('M1-01', i, q.objectives[i].target ?? 1);
  }, { TOUR_IDS, PROLOGUE_KEYS, PROLOGUE_BUY, skipHomeTour, prologue });
}

/** 새 게임 → 홈타운 (맑음 · 오프닝 생략 · 187차 시작 상태) */
async function newGameHometown(page, { skipTour = true } = {}) {
  await page.evaluate(async () => {
    const ext = await import('/src/store/ExternalDataStore.ts');
    ext.ExternalDataStore.rerollHometownWeather = function () { this._hometownWeather = 'clear'; };
    ext.ExternalDataStore._hometownWeather = 'clear';
    globalThis.__GS.startNewGameInSlot(3);
  });
  await applyStartKit(page, { skipHomeTour: skipTour });
  const left = await page.evaluate(() => {
    const p = globalThis.__STORY.progress('M1-01');
    return p ? p.obj.slice(0, 14).join(',') : 'none';
  });
  log('  M1-01 prologue', left);
  await page.evaluate(() => {
    globalThis.__PIXEL_ANGLER_GAME.scene.getScene('MainMenuScene').scene.start('RegionFieldScene', { region: 'hometown' });
  });
  await waitScene(page, 'RegionFieldScene');
  await page.waitForTimeout(2500);
  await cleanLog(page);
}

/** 지역 채널에서 개발 빌드 전용 줄(`[dev]`) 제거 */
async function cleanLog(page) {
  await page.evaluate(() => {
    const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
    const hud = s && s.hud; if (!hud || !hud.logLines) return;
    hud.logLines = hud.logLines.filter((e) => !/\[dev\]/.test(`${e.head || ''}${e.body || ''}`));
    hud.renderLogText?.();
  });
}

/** 속초 심리스 맵 진입 */
async function enterSokcho(page) {
  await page.evaluate(() => {
    const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
    s.scene.start('RegionFieldScene', { region: 'gangwon_sokcho' });
  });
  await page.waitForFunction(() => {
    const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
    return s && s.region !== 'hometown' && s.playerBody && s.chunks;
  }, null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  await cleanLog(page);
}

/** 월드 타일(32px) 좌표로 순간이동 + 스프라이트 동기화 */
async function teleportTile(page, c, r, face) {
  await page.evaluate(({ c, r, face }) => {
    const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
    const TR = 32;
    s.devTeleport(c * TR + TR / 2, r * TR + TR / 2);
    if (face && s.charSprite) s.charSprite.setDir(face);
    s.updateSpriteAndShadow?.();
  }, { c, r, face: face || null });
  await page.waitForTimeout(1600);
  await cleanLog(page);
}

/** 퀘스트 화살표·추적기를 즉시 갱신 (헤드리스 rAF가 느려 누적 타이머가 안 찬다) */
async function refreshGuide(page) {
  await page.evaluate(() => {
    const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
    for (let i = 0; i < 3; i++) s.updateQuestGuide?.(500);
    s.hud?.updateStatus?.();
  });
}

/** 스폰 주변 물가(남쪽이 바다) 후보 — 캐스팅 가능한 걷기 타일 */
async function findWaterside(page) {
  return page.evaluate(() => {
    const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
    const c0 = Math.floor(s.playerBody.x / 32), r0 = Math.floor(s.playerBody.y / 32);
    const out = [];
    for (let r = r0 - 60; r <= r0 + 60; r++) for (let c = c0 - 80; c <= c0 + 80; c++) {
      const t = s.terrainAt(c, r); if (!t || t === 'water') continue;
      if (s.terrainAt(c, r + 1) === 'water' && s.terrainAt(c, r + 2) === 'water' && s.terrainAt(c, r + 3) === 'water' && s.terrainAt(c + 1, r + 3) === 'water') {
        out.push({ c, r, t, d: Math.hypot(c - c0, r - r0) });
      }
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, 6);
  });
}

const GROUPS = [];
const group = (name, keys, fn) => GROUPS.push({ name, keys, fn });

module.exports = { boot, waitScene, shot, newGameHometown, applyStartKit, cleanLog, enterSokcho, teleportTile, refreshGuide, findWaterside, want, log, OUT, LANG };

// ═══════════════════════════════════════════════════════
// 그룹 정의
// ═══════════════════════════════════════════════════════

// ── 캐릭터 만들기 ──
group('menu', ['char_create'], async (page) => {
  await page.evaluate(() => {
    globalThis.__GS.startNewGameInSlot(3);
    globalThis.__PIXEL_ANGLER_GAME.scene.getScene('MainMenuScene').scene.start('CharacterCreateScene');
  });
  await waitScene(page, 'CharacterCreateScene');
  await page.waitForTimeout(1800);
  if (want('char_create')) await shot(page, 'char_create');
});

// ── 홈타운 · 집 실내 ──
group('hometown', ['hometown', 'home_interior', 'home_decor', 'home_life'], async (page) => {
  await newGameHometown(page);
  await refreshGuide(page);
  if (want('hometown')) await shot(page, 'hometown');
  if (!want('home_interior')) return;
  await page.evaluate(() => globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene').enterHomeInterior());
  await waitScene(page, 'HomeInteriorScene');
  await page.waitForTimeout(2600);
  await calmHome(page, 'day');
  // 침대 앞으로 옮겨 [F] 힌트를 띄운 뒤 침대 메뉴를 연다
  await page.evaluate(() => {
    const hi = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('HomeInteriorScene');
    const IT = 48, OX = (1280 - 12 * IT) / 2, OY = (720 - 10 * IT) / 2 + 10;
    hi.px = OX + 11.45 * IT; hi.py = OY + 4.7 * IT; hi.facing = 'left';
    hi.update(0, 16);
    hi.openBedMenu();
  });
  await page.waitForTimeout(500);
  await shot(page, 'home_interior');
  if (!want('home_decor')) return;
  // 189차 — 가구 배치: 의자 하나를 넣어 두고, 소파를 들어 오른쪽 아래 빈자리(초록)에 대 본다
  await page.evaluate(() => {
    const hi = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('HomeInteriorScene');
    const IT = 48, OX = (1280 - 12 * IT) / 2, OY = (720 - 10 * IT) / 2 + 10;
    hi.onEscape();
    hi.px = OX + 6 * IT; hi.py = OY + 7.5 * IT; hi.update(0, 16);
    hi.openDecor();
    const t = globalThis.__TOUR.active; if (t) t.finish();
    const d = hi.decor;
    d.onMove(OX + 7.5 * IT, OY + 4.5 * IT); d.onLeft(); d.dropToTray();
    d.onMove(OX + 2.5 * IT, OY + 7 * IT); d.onLeft();
    d.onMove(OX + 8.5 * IT, OY + 8 * IT);
  });
  await page.waitForTimeout(500);
  await shot(page, 'home_decor');
  if (!want('home_life')) return;
  // 190차 — 집 살림: 밤 · 스탠드 켬 · 라디오 · 러그 위 고양이 · 관상 수조(고기 둘) · 벽 장식(어탁에 감성돔)
  await page.evaluate(() => {
    const hi = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('HomeInteriorScene');
    const IT = 48, OX = (1280 - 12 * IT) / 2, OY = (720 - 10 * IT) / 2 + 10;
    hi.decor?.exit();
    const H = globalThis.__HOME;
    // 189차 촬영이 옮겨 둔 가구를 기본 자리로 돌린다
    H.deserialize({ ...H.serialize(), placed: undefined, stored: [] });
    const id = H.addStored('aquarium');
    H.place({ id, kind: 'aquarium', tx: 8, ty: 7, dir: 'down' });
    H.addToTank(id, { speciesId: 'black_seabream', nameKo: '감성돔', lengthCm: 30, weightG: 500, sex: 'M', iconTexture: 'fish_black_sea_bream' });
    H.addToTank(id, { speciesId: 'largescale_blackfish', nameKo: '벵에돔', lengthCm: 26, weightG: 400, sex: 'M' });
    H.lampOn.stand = true;
    globalThis.__GS.addCaughtFish('black_seabream', '감성돔', 47, 1650, 'rod');
    hi.drawFishPrintInk();
    hi.buildFurniture(null);
    hi.px = OX + 6.2 * IT; hi.py = OY + 8.6 * IT; hi.facing = 'up'; hi.update(0, 16);
  });
  await calmHome(page, 'night');
  await page.waitForTimeout(600);
  await shot(page, 'home_life');
});

// ── 188차 프롤로그: 새 게임 = 집 안 침대 옆에서 눈을 뜬다 (혼잣말 뒤 첫 걸음 가이드 · 「지금 할 일」 띠) ──
group('prologue', ['prologue'], async (page) => {
  await page.evaluate(async () => {
    const ext = await import('/src/store/ExternalDataStore.ts');
    ext.ExternalDataStore.rerollHometownWeather = function () { this._hometownWeather = 'clear'; };
    ext.ExternalDataStore._hometownWeather = 'clear';
    // intro.monologue를 켜지 않는다 — 그 플래그가 없을 때만 필드가 집 안 기상(wake)으로 넘긴다
    globalThis.__GS.startNewGameInSlot(3);
    globalThis.__PIXEL_ANGLER_GAME.scene.getScene('MainMenuScene').scene.start('RegionFieldScene', { region: 'hometown' });
  });
  await waitScene(page, 'HomeInteriorScene');
  await page.waitForTimeout(2500);
  await calmHome(page, 'day');
  // 기상 혼잣말은 time.delayedCall(320)로 열린다 — 헤드리스는 타이머가 돌지 않으므로 직접 열고 바로 닫아
  // 첫 걸음 가이드로 넘긴다. 가이드는 「낚시 상자를 열어 보자」 단계(5/5)로 건너뛴다.
  await page.evaluate(() => {
    const hi = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('HomeInteriorScene');
    hi.startWake();
    hi.tourPanel?.destroy(); hi.tourPanel = undefined;
    hi.startFirstSteps();
    const tour = globalThis.__TOUR.active;
    if (tour) { tour.go(4); tour.completeTyping(); }
  });
  // 가이드는 요청 큐를 거쳐 다음 틱에 뜰 수 있다 — 뜰 때까지 기다렸다가 단계를 맞춘다
  await page.waitForFunction(() => !!globalThis.__TOUR.active, null, { timeout: 15000 });
  await page.evaluate(() => { const t = globalThis.__TOUR.active; if (t) { if (t.index !== 4) t.go(4); t.completeTyping(); } });
  // 189차 — 상자 왼편에 세워 머리 위 [F] 안내(「낚시 상자 열기」)가 보이게 한다 (콜아웃 ④)
  await page.evaluate(() => {
    const hi = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('HomeInteriorScene');
    const IT = 48, OX = (1280 - 12 * IT) / 2, OY = (720 - 10 * IT) / 2 + 10;
    hi.px = OX + 8.55 * IT; hi.py = OY + 5.5 * IT; hi.facing = 'right'; hi.update(0, 16);
  });
  await page.waitForTimeout(400);
  await cleanLog(page);   // 아래에 멈춰 있는 필드 씬 채널의 [dev] 줄(영문 잔존 스캔에 걸린다)
  if (want('prologue')) await shot(page, 'prologue');
});

// ── 속초 필드: HUD · 전체 지도 · 일지 · 대화 · 전국 지도 ──
group('sokcho', ['hud', 'tracker', 'fullmap', 'journal', 'dialog', 'worldmap'], async (page) => {
  await newGameHometown(page);
  await enterSokcho(page);
  const spots = await findWaterside(page);
  const w = spots[0];
  await teleportTile(page, w.c, w.r, 'down');
  await refreshGuide(page);
  await page.waitForTimeout(600);
  if (want('hud')) await shot(page, 'hud');
  if (want('tracker')) await shot(page, 'tracker');
  if (want('fullmap')) {
    await page.evaluate(() => globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene').toggleFullMap());
    await page.waitForTimeout(1200);
    await shot(page, 'fullmap');
    await page.evaluate(() => globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene').toggleFullMap());
    await page.waitForTimeout(400);
  }
  if (want('dialog')) {
    // 정옥선 좌판 앞 — 도착 컷씬(M1-01 ②)이 대화창을 덮으므로 이 촬영에서만 막는다.
    // 대화창은 단락 끝(▼)에서 멈추므로 선택지가 뜰 때까지 넘긴다.
    await page.evaluate(() => {
      const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
      s.playCinematic = () => {};
    });
    await teleportTile(page, 583, 161, 'up');
    await page.evaluate(() => {
      const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
      s.updateSpriteAndShadow?.();
      s.openDialogue('okseon');
    });
    await page.waitForTimeout(800);
    await page.evaluate(async () => {
      const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
      const top = s.popupStack[s.popupStack.length - 1]?.panel;
      for (let i = 0; i < 40 && top && !(top.rows && top.rows.length); i++) { top.advance?.(); await new Promise((r) => setTimeout(r, 120)); }
    });
    await page.waitForTimeout(1200);
    await shot(page, 'dialog');
    await page.evaluate(() => {
      const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
      while (s.popupStack.length) s.closeTopPopup();
    });
    await page.waitForTimeout(400);
  }
  if (want('journal')) {
    // 188차 — M1-01은 프롤로그 14목표 + 3목표 = 17줄이라 목표 목록이 창 아래로 넘친다(일지 버그 — 보고).
    //   촬영은 M1-01을 마치고 M1-02(얼음 나르기)를 진행 중으로 둔 화면을 쓴다(대화 촬영 뒤라 영향 없음).
    await page.evaluate(() => {
      const st = globalThis.__STORY;
      const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
      while (s.popupStack.length) s.closeTopPopup();
      for (let i = 14; i < 17 && st.isActive('M1-01'); i++) st.setObjectiveProgress('M1-01', i, 1);   // 의뢰인 없는 할 일 — 다 채우면 저절로 끝난다
      if (!st.isActive('M1-02') && !st.isDone('M1-02')) st.devActivateQuest('M1-02');
    });
    await clearToasts(page);
    await cleanLog(page);
    await page.evaluate(() => globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene').togglePanel('journal'));
    await page.waitForTimeout(1000);
    await shot(page, 'journal');
    await page.evaluate(() => globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene').togglePanel('journal'));
    await page.waitForTimeout(300);
  }
  if (want('worldmap')) {
    await page.evaluate(() => {
      const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
      while (s.popupStack.length) s.closeTopPopup();
      s.exitToWorldMap();
    });
    await waitScene(page, 'WorldMapScene');
    await page.waitForTimeout(2500);
    // 핀 편집 Dev Tool 버튼은 dev 빌드 전용 — 플레이어 화면에는 없다
    await page.evaluate(() => {
      const w = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('WorldMapScene');
      for (const k of ['_devToolBtnBg', '_devToolBtnText', '_devToolBtnHit']) w[k]?.setVisible(false);
    });
    await page.waitForTimeout(200);
    await shot(page, 'worldmap');
  }
});


/** 그룹 안에서 한 장씩 — 실패해도 다음 장으로 넘어간다 */
async function cap(page, key, fn) {
  if (!want(key)) return;
  try { await fn(); await shot(page, key); }
  catch (e) { log(`  ${key} FAILED:`, String(e).slice(0, 300)); }
}
/** 필드 씬의 열린 창을 모두 닫는다 */
async function closeAll(page) {
  await page.evaluate(() => {
    const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene');
    for (let i = 0; i < 12 && s.popupStack.length; i++) s.closeTopPopup();
  });
  await page.waitForTimeout(300);
}
const S = 'globalThis.__PIXEL_ANGLER_GAME.scene.getScene("RegionFieldScene")';
/** 획득 알림 카드 즉시 치우기 (헤드리스는 닫힘 트윈이 느리다) */
async function clearToasts(page) {
  await page.evaluate(() => {
    const hud = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene')?.hud;
    if (!hud || !hud.toasts) return;
    for (const e of hud.toasts) e.c.destroy();
    hud.toasts = [];
    hud.toastClearC?.destroy(); hud.toastClearC = undefined;
  });
}

// ── 패널류 (속초 물가에서) ──
group('panels', ['guide_tour', 'inventory', 'equipment', 'gear_fault', 'cooler', 'codex', 'skill_tree', 'license', 'vitals_panel', 'settings'], async (page) => {
  await newGameHometown(page);
  await enterSokcho(page);
  const w = (await findWaterside(page))[0];
  await teleportTile(page, w.c, w.r, 'down');
  // 공통 무대: 어획물 몇 마리 · 레벨 · 면허 하나(정기 지출 줄) · 도감 일부 공개
  await page.evaluate(async () => {
    const inv = globalThis.__INV, gs = globalThis.__GS;
    const disc = globalThis.__DISC;
    for (const sp of ['black_rockfish', 'greenling', 'black_seabream', 'blue_rockfish', 'scorpionfish', 'fat_greenling', 'flatfish', 'sea_bass']) disc.record('fish', sp, 'catch');
    for (const sp of ['black_rockfish', 'greenling', 'black_seabream']) inv.devGrantFish(sp);
    gs.grantXp(2600);
    gs.acquireLicense('trap_basic');
    gs.acquireLicense('shore_hunting_basic');
  });
  await cleanLog(page);
  await clearToasts(page);

  // 188차 — 창 첫 열기 체험 가이드(가방). 이 한 장만 가이드를 다시 켠다 — 「낚시용품」 탭을 눌러 보는 단계(2/7)
  await cap(page, 'guide_tour', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      globalThis.__GS.setFlag('tour.inventory', false);
      s.toggleInventory();
      const tour = globalThis.__TOUR.active;
      if (tour) { tour.go(1); tour.completeTyping(); }
    }, S);
    await page.waitForFunction(() => !!globalThis.__TOUR.active, null, { timeout: 15000 });
    await page.waitForTimeout(300);
    await page.evaluate(() => { const t = globalThis.__TOUR.active; if (t) { if (t.index !== 1) t.go(1); t.completeTyping(); } });
    await page.waitForTimeout(400);
  });
  await page.evaluate(() => { globalThis.__TOUR.active?.finish(); });
  await closeAll(page);

  await cap(page, 'inventory', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      s.toggleInventory();
      const p = s.invPanel;
      p.currentTab = 'food'; p.paintTabs(); p.renderGrid();
      const it = globalThis.__INV.getByCategory('food').find((i) => i.speciesId);
      if (it) { p.statusText.setText(p.itemSummaryLine(it)); }
    }, S);
    await page.waitForTimeout(700);
  });
  await closeAll(page);

  await cap(page, 'equipment', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      for (const id of ['inv_cap', 'inv_top', 'inv_pants', 'inv_shoes', 'inv_gloves', 'inv_glasses', 'inv_watch']) globalThis.__INV.equipItem(id);
      s.events.emit('inventory-changed');
      s.refreshCharacterLook?.();
      s.toggleInventory(40);
      s.toggleEquipment();
    }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);

  await cap(page, 'gear_fault', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      const inv = globalThis.__INV;
      const rod = inv.find('inv_rod');
      if (rod.equipped) inv.unequipItem('inv_rod');
      inv.setFault(inv.find('inv_rod'), 'rod_tip');
      s.events.emit('inventory-changed');
      s.toggleInventory(40);
      const p = s.invPanel; p.currentTab = 'gear'; p.paintTabs(); p.renderGrid();
      s.openItemDetail(inv.find('inv_rod'));
      const det = s.popupStack[s.popupStack.length - 1]?.panel;
      det?.setPosition(520, 60); det?.applyFix?.();
    }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);
  await page.evaluate(() => { const inv = globalThis.__INV; inv.clearFault(inv.find('inv_rod')); });

  await cap(page, 'cooler', async () => {
    await page.evaluate(async (S) => {
      const s = eval(S);
      const { resolveFishTexture } = await import('/src/data/FishTextures.ts');
      const c = globalThis.__FIELD.cooler;
      c.addSeawater();
      for (const [sp, name, len, w, sex] of [['black_rockfish', '조피볼락', 31, 520, 'M'], ['greenling', '쥐노래미', 28, 330, 'F'], ['black_seabream', '감성돔', 34, 780, 'M']]) {
        c.add({ speciesId: sp, nameKo: name, lengthCm: len, weightG: w, sex, iconTexture: resolveFishTexture(sp, len, sex), catchMethod: 'rod' });
      }
      s.toggleCooler();
    }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);

  await cap(page, 'skill_tree', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      const gs = globalThis.__GS;
      for (const id of ['fish_cast', 'fish_cast', 'fish_scatter']) gs.learnSkill(id);
      gs.addProficiency?.('cast', 30);
      s.togglePanel('skill');
    }, S);
    await page.waitForTimeout(900);
    // 188차 — 설명은 슬롯 호버 팝업에만 있다. 롱캐스트 칸의 팝업을 고정해 띄운다(맨 아래 「다음 레벨」 줄 포함)
    await page.evaluate((S) => {
      const p = eval(S).skillPanel;
      if (!p) return;
      p.showTip({ kind: 'skill', id: 'fish_cast' });
      p.tipPinned = true;
    }, S);
    await page.waitForTimeout(400);
  });
  await closeAll(page);

  await cap(page, 'license', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      s.togglePanel('license');
      const lp = s.licensePanel;
      lp.selected = 'trap_basic'; lp.selectedFee = null; lp.renderList(); lp.renderDetail();
    }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);

  await cap(page, 'vitals_panel', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      const gs = globalThis.__GS;
      gs.commitVitals({ ...gs.vitals, hunger: 38, hydration: 17, fatigue: 46 });
      // 188차 — 식중독은 확률로 설사를 함께 데려온다(정의표 spawns) — 촬영은 같이 붙는 쪽으로 고정
      for (const id of ['bleed', 'food_poison', 'exhaust']) gs.addStatus(id, () => 0);
      s.hud.updateStatus();
      s.hud.showValueTip('hydration', { x: 200, y: 112, w: 126, h: 16 });
    }, S);
    await page.waitForTimeout(700);
  });

  await cap(page, 'codex', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      s.hud.hideTip?.();
      s.scene.pause();
      s.scene.launch('AnglerLogScene', { returnScene: 'RegionFieldScene' });
    }, S);
    await waitScene(page, 'AnglerLogScene');
    await page.waitForTimeout(1500);
  });
  await page.evaluate(() => {
    const g = globalThis.__PIXEL_ANGLER_GAME;
    if (g.scene.isActive('AnglerLogScene')) { g.scene.stop('AnglerLogScene'); g.scene.resume('RegionFieldScene'); }
  });
  await page.waitForTimeout(600);

  await cap(page, 'settings', async () => {
    await page.evaluate((S) => { const s = eval(S); s.openSettingsFromPause(); }, S);
    await waitScene(page, 'SettingsScene');
    await page.waitForTimeout(800);
    await page.evaluate(() => { globalThis.__PIXEL_ANGLER_GAME.scene.getScene('SettingsScene').switchTab('display'); });
    await page.waitForTimeout(600);
  });
});

// ── 상점 (동명활어센터 앞) ──
group('shops', ['shop', 'shop_trade'], async (page) => {
  await newGameHometown(page);
  await enterSokcho(page);
  await page.evaluate(() => { const s = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene'); s.playCinematic = () => {}; });
  await teleportTile(page, 586, 156, 'up');
  await page.evaluate(() => { for (const sp of ['black_rockfish', 'greenling']) globalThis.__INV.devGrantFish(sp); });
  await cleanLog(page);
  await cap(page, 'shop', async () => {
    await page.evaluate((S) => { const s = eval(S); s.openShop('market'); }, S);
    await page.waitForTimeout(1000);
  });
  await cap(page, 'shop_trade', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      const p = s.shopPanel;
      p.currentTab = 'sell'; p.paintTabs?.(); p.renderGrid?.();
      s.invPanel && (s.invPanel.currentTab = 'food', s.invPanel.paintTabs(), s.invPanel.renderGrid());
    }, S);
    await page.waitForTimeout(900);
  });
});

// ── 활용(U) 창 · 손질 · 제작 ──
group('util', ['rig_bait', 'rig_lure', 'chum_tab', 'craft_tab', 'board_fish', 'butchery'], async (page) => {
  await newGameHometown(page);
  await enterSokcho(page);
  const w = (await findWaterside(page))[0];
  await teleportTile(page, w.c, w.r, 'down');
  await cleanLog(page);
  await cap(page, 'rig_bait', async () => {
    await page.evaluate((S) => { const s = eval(S); s.toggleUtilization('tackles', true); }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);
  await cap(page, 'rig_lure', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      globalThis.__INV.setRigMode('lure');
      s.toggleUtilization('tackles', true);
    }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);
  await page.evaluate(() => globalThis.__INV.setRigMode('bait'));
  await cap(page, 'chum_tab', async () => {
    await page.evaluate((S) => { const s = eval(S); s.toggleUtilization('chum', true); }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);
  await cap(page, 'craft_tab', async () => {
    await page.evaluate((S) => { const s = eval(S); s.toggleUtilization('craft', true); }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);
  await cap(page, 'board_fish', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      const inv = globalThis.__INV;
      inv.devGrantFish('black_seabream');
      inv.equipHand('knife_sashimi', 'right');
      globalThis.__GS.setFlag('guideSeen.butchery');
      s.toggleUtilization('cooking', true);
      const u = s.utilPanel;
      const fish = inv.getByCategory('food').find((i) => i.speciesId === 'black_seabream');
      u.cookBoardFishId = fish.id; u.renderBody();
    }, S);
    await page.waitForTimeout(900);
  });
  await cap(page, 'butchery', async () => {
    await page.evaluate((S) => {
      const s = eval(S);
      const inv = globalThis.__INV;
      let u = s.utilPanel;
      if (!u || !u.cookBoardFishId) {
        // 단독 촬영(--only butchery) — 도마 준비를 여기서 한다
        inv.devGrantFish('black_seabream');
        inv.equipHand('knife_sashimi', 'right');
        globalThis.__GS.setFlag('guideSeen.butchery');
        s.toggleUtilization('cooking', true);
        u = s.utilPanel;
        u.cookBoardFishId = inv.getByCategory('food').find((i) => i.speciesId === 'black_seabream').id;
        u.renderBody();
      }
      const fish = inv.find(u.cookBoardFishId);
      u.openButchery(fish);
    }, S);
    await page.waitForTimeout(1500);
    // 개발 빌드 전용 버튼(dev: …)은 플레이어 화면에 없다 — 촬영에서 숨긴다
    await page.evaluate((S) => {
      const bp = eval(S).utilPanel?.butcheryPanel;
      const L = bp?.uiC?.list ?? [];
      for (let i = 0; i < L.length; i++) {
        const o = L[i];
        const src = o.type === 'Text' ? (o.__i18nSrc ?? o.text) : '';
        if (/^dev:/.test(src)) { L[i - 1]?.setVisible?.(false); o.setVisible(false); L[i + 1]?.setVisible?.(false); }
      }
    }, S);
    await page.waitForTimeout(300);
  });
});

// ── 홈타운: 선택 창 · 고급 제작대 · 집 주방 요리 ──
group('home2', ['interact_choice', 'workbench', 'cook_panel'], async (page) => {
  await newGameHometown(page);
  await clearToasts(page);
  await cap(page, 'interact_choice', async () => {
    await page.evaluate(async (S) => {
      const s = eval(S);
      const { QUEST_REWARD_ITEMS } = await import('/src/data/QuestRewardItems.ts');
      const tpl = (QUEST_REWARD_ITEMS || []).find((t) => t.id === 'quest_ice_crate');
      globalThis.__INV.addItem({ ...tpl }, 1, { silent: true });
      s.placeItemFromInventory(globalThis.__INV.find('quest_ice_crate'));
      s.updateObjectProximity?.();
      s.openInteractChoice(s.collectInteractOptions());
    }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);
  await cap(page, 'workbench', async () => {
    await page.evaluate((S) => { const s = eval(S); s.openAdvancedCraft(); }, S);
    await page.waitForTimeout(900);
  });
  await closeAll(page);
  await cap(page, 'cook_panel', async () => {
    await page.evaluate(() => globalThis.__PIXEL_ANGLER_GAME.scene.getScene('RegionFieldScene').enterHomeInterior());
    await waitScene(page, 'HomeInteriorScene');
    await page.waitForTimeout(2400);
    await calmHome(page, 'day');
    await page.evaluate(() => {
      const C = globalThis.__COOK, inv = globalThis.__INV;
      inv.devGrantFish('black_seabream');
      const st = C.ensureHomeStove();
      C.attachCookware(st, inv.find('cook_pot_camp'));
      C.startRecipe(st, 'stew_red_whole');
      C.addWaterFromTap(st, 4);
      const f = inv.getByCategory('food').filter((i) => i.speciesId === 'black_seabream').pop();
      if (f) { f.weightG = 900; C.addIngredientItem(st, f, 1); }
      for (const id of ['cook_radish', 'cook_leek']) { const it = inv.find(id); if (it) C.addIngredientItem(st, it, 1); }
      C.setHeat(st, 3); st.lastTickMs -= 60000; C.syncAll();
      const hi = globalThis.__PIXEL_ANGLER_GAME.scene.getScene('HomeInteriorScene');
      hi.openCook();
    });
    await page.waitForTimeout(1200);
  });
});

/** 1인칭 공용: 속초 물가 → 조준(선택 촬영) → 발사 → 1인칭 진입 */
async function castToFp(page, aimKey) {
  await newGameHometown(page);
  await enterSokcho(page);
  await page.evaluate(() => { const gs = globalThis.__GS; for (const f of ['guideSeen.bite', 'guideSeen.fight', 'guideSeen.chum', 'guideSeen.retrieve', 'guideSeen.butchery']) gs.setFlag(f); });
  const w = (await findWaterside(page))[0];
  await teleportTile(page, w.c, w.r, 'down');
  await clearToasts(page);
  await page.mouse.move(700, 560);
  await page.mouse.down();
  await page.waitForTimeout(900);
  if (aimKey && want(aimKey)) await shot(page, aimKey);
  await page.mouse.up();
  await waitScene(page, 'FirstPersonFishingScene', 25000);
  await page.waitForTimeout(3500);
}
/** 1인칭 씬을 수동 스텝 (헤드리스 rAF가 느려서 누적 게임 시간을 직접 굴린다) */
async function stepFp(page, frames, setup) {
  await page.evaluate(({ frames, setup }) => {
    const fp = globalThis.__FP;
    if (setup) (new Function('fp', setup))(fp);
    for (let i = 0; i < frames; i++) fp.update(performance.now(), 16.67);
  }, { frames, setup: setup || null });
}

/** 1인칭 씬의 연출 텍스트(원문 기준)를 찾아 알파를 고정 — 트윈이 헤드리스에서 반쯤 멈춘 채 찍히지 않게 */
async function pinFpText(page, src, alpha) {
  await page.evaluate(({ src, alpha }) => {
    const fp = globalThis.__FP;
    for (const o of fp.children.list) {
      if (o.type !== 'Text') continue;
      if ((o.__i18nSrc || o.text) !== src) continue;
      fp.tweens.killTweensOf(o);
      if (alpha <= 0) o.setVisible(false); else o.setAlpha(alpha).setVisible(true);
    }
  }, { src, alpha });
}
/** 탈출 판정(초당 확률)을 잠시 막고 스텝 — 촬영 중에 물고기가 달아나 다음 장면이 탑다운이 되지 않게 */
const NO_ESCAPE = 'const __r = Math.random; Math.random = () => 0.999; try { STEP } finally { Math.random = __r; }';

group('fp', ['cast_aim', 'fp_views', 'spool', 'bite_s3', 'fp_fight', 'spool_fight', 'dragin_reel', 'catch_popup'], async (page) => {
  await castToFp(page, 'cast_aim');
  await cap(page, 'fp_views', async () => { await stepFp(page, 60); await page.waitForTimeout(400); });
  await cap(page, 'spool', async () => { await stepFp(page, 200, 'fp.spoolKey.isDown = true;'); await page.waitForTimeout(300); });
  await stepFp(page, 5, 'fp.spoolKey.isDown = false;');
  await cap(page, 'bite_s3', async () => {
    await page.evaluate(() => {
      // 입질 패턴은 추첨이라 3단계 없이 끝나기도 한다([1,1] · [2,2]) — 3단계만 있는 패턴을 고르게 rng를 고정하고,
      // 그래도 못 닿으면(어종 고정 패턴) 새 입질로 다시 한다.
      const fp = globalThis.__FP;
      for (let attempt = 0; attempt < 6 && fp.prevStage !== 3; attempt++) {
        if (!fp.biteSeq.active) fp.devForceBite();
        if (fp.pendingFish) fp.biteSeq.start({ speciesId: fp.pendingFish.speciesId, biteProbPerSec: 0.5, stageTimeScale: 1, rng: () => 0.99 });
        for (let i = 0; i < 1500 && fp.prevStage !== 3; i++) fp.update(performance.now(), 16.67);
        if (fp.prevStage !== 3) fp.biteSeq.reset();
      }
    });
    await pinFpText(page, '지금 챔질! (우클릭)', 1);
    await page.waitForTimeout(250);
  });
  await pinFpText(page, '지금 챔질! (우클릭)', 0);
  await cap(page, 'fp_fight', async () => {
    await page.evaluate((NO_ESCAPE) => {
      const fp = globalThis.__FP;
      if (fp.fpState === 'drift' && fp.biteSeq?.active) fp.attemptHookset();
      if (!fp.fight) fp.devForceFight('dive');
      (new Function('fp', NO_ESCAPE.replace('STEP', `
        fp.fight.pattern = 'dive'; fp.fight.patternTimer = 9;
        fp.reeling = true;
        for (let i = 0; i < 60; i++) fp.update(performance.now(), 16.67);
        fp.reeling = false; fp.upKey.isDown = true;
        for (let i = 0; i < 6; i++) fp.update(performance.now(), 16.67);
        // 텐션 게이지를 안전대(30~80) 안에서 보여 주려고 마지막 그림만 다시 그린다(물리 모델은 그대로)
        const st = fp.fight.status('none', 0);
        fp.renderFightUi({ ...st, tension: 56 });
        const src = fp.probText.__i18nSrc || fp.probText.text;
        fp.probText.setText(src.replace(/^텐션 [0-9]+ /, '텐션 56 '));
        fp.cameras.main.resetFX(); for (const o of [...fp.children.list]) if (o.type === 'Rectangle' && o.width >= 1280 && o.fillColor === 0xffffff) { fp.tweens.killTweensOf(o); o.destroy(); }   // 챔질 플래시가 반쯤 남은 채 멈추지 않게
        fp.scene.pause();   // 실 루프가 다음 프레임에 게이지를 원래 값으로 다시 그리지 않게(일시정지 씬도 렌더는 된다)
      `)))(fp);
    }, NO_ESCAPE);
    await pinFpText(page, 'HOOK UP!', 0);
    await page.waitForTimeout(300);
  });
  await cap(page, 'spool_fight', async () => {
    await page.evaluate((NO_ESCAPE) => {
      const fp = globalThis.__FP;
      if (fp.scene.isPaused()) fp.scene.resume();
      (new Function('fp', NO_ESCAPE.replace('STEP', `
        fp.upKey.isDown = false;
        fp.fight.pattern = 'jump'; fp.fight.patternTimer = 9;
        fp.spoolKey.isDown = true;
        for (let i = 0; i < 40; i++) fp.update(performance.now(), 16.67);
        // 슬랙 경고 막대까지 보이게(실제로는 텐션 6 미만이 이어질 때 차오른다) — 마지막 그림만 다시 그린다
        const st = fp.fight.status('none', 0);
        fp.renderFightUi({ ...st, tension: Math.min(st.tension, 4), slackRisk: 0.45 });
        fp.cameras.main.resetFX(); for (const o of [...fp.children.list]) if (o.type === 'Rectangle' && o.width >= 1280 && o.fillColor === 0xffffff) { fp.tweens.killTweensOf(o); o.destroy(); }
        fp.scene.pause();
      `)))(fp);
    }, NO_ESCAPE);
    await page.waitForTimeout(300);
  });
  await cap(page, 'dragin_reel', async () => {
    await page.evaluate((NO_ESCAPE) => {
      const fp = globalThis.__FP;
      if (fp.scene.isPaused()) fp.scene.resume();
      (new Function('fp', NO_ESCAPE.replace('STEP', `
        fp.spoolKey.isDown = false;
        if (fp.fight) { fp.fight.pattern = 'none'; fp.fight.slackTimer = 0; fp.fight.tension = 50; }
        for (let i = 0; i < 8; i++) fp.update(performance.now(), 16.67);
        fp.beginDragIn();
        fp.reeling = true;
        for (let i = 0; i < 50; i++) fp.update(performance.now(), 16.67);
      `)))(fp);
    }, NO_ESCAPE);
    await page.waitForTimeout(300);
  });
  await cap(page, 'catch_popup', async () => {
    await page.evaluate(async () => {
      const fp = globalThis.__FP;
      fp.reeling = false;
      const f = fp.hookedFish;
      // 금지체장 미만 · 금어기면 3선택 창 대신 자동 방생 안내가 뜬다 — 촬영은 선택 창이 목적이라 체장을 올린다.
      //   ⚠ 방생 판정은 입질 때 굳힌 플래그(isUndersized · isClosedSeason)를 본다 — 체장만 올리면 그대로 방생된다
      if (f) {
        const k = Math.max(f.lengthCm, 40) / f.lengthCm;
        f.lengthCm = Math.round(f.lengthCm * k);
        f.weightG = Math.round(f.weightG * k * k * k);   // 길이³ 비례로 무게를 맞춘다(0.19kg · 40cm 같은 어색한 줄 방지)
        f.isUndersized = false; f.isClosedSeason = false;
      }
      fp.onLanded();
      await new Promise((r) => setTimeout(r, 900));
      if (!fp.resultContainer && f) {
        const { resolveFishTexture } = await import('/src/data/FishTextures.ts');
        fp.showCatchDecisionPanel(f, [], resolveFishTexture(f.speciesId, f.lengthCm, f.sex));
      }
    });
    await page.waitForTimeout(900);
  });
});

group('fp2', ['snag'], async (page) => {
  await castToFp(page, null);
  await cap(page, 'snag', async () => {
    await page.evaluate(() => { globalThis.__FP.onSnagged(); });
    await page.waitForTimeout(700);
  });
});



// ═══════════════════════════════════════════════════════
// 실행
// ═══════════════════════════════════════════════════════
async function main() {
  const extra = module.exports.EXTRA_GROUPS || [];
  const all = GROUPS.concat(extra);
  let fails = 0;
  for (const g of all) {
    if (ONLY.length && !g.keys.some((k) => ONLY.includes(k))) continue;
    log(`group ${g.name} (${LANG})`);
    const { browser, page, errors } = await boot();
    try {
      await g.fn(page);
    } catch (e) {
      fails++;
      log(`group ${g.name} FAILED:`, String(e).slice(0, 400));
      try { await page.screenshot({ path: path.join(OUT, `_fail_${g.name}.png`) }); } catch { /* 무시 */ }
    }
    if (errors.length) log(`group ${g.name} pageerror ${errors.length}:`, errors.slice(0, 3));
    await browser.close();
  }
  log(fails ? `done with ${fails} failed group(s)` : 'done');
  process.exitCode = fails ? 1 : 0;
}

if (require.main === module) {
  // 다음 틱에 실행 — 아래쪽(또는 외부 모듈)에서 그룹을 더 붙일 수 있게
  setImmediate(() => { main().catch((e) => { console.error(e); process.exit(1); }); });
}
