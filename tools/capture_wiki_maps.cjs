/**
 * @file capture_wiki_maps.cjs
 * @description 264차 — 위키 「지도」 탭용 지역 지도 캡처. 게임 렌더러(RegionFieldScene)로 지역 전체를 탑다운으로 찍는다.
 *
 * 실행(dev 서버 5173이 떠 있어야 한다):
 *   node tools/capture_wiki_maps.cjs <출력 폴더> [데이터 지역 …]     (지역을 안 적으면 전부)
 *   예: node tools/capture_wiki_maps.cjs /tmp/wikimaps sokcho_v2 hometown
 *
 * 방식:
 *   - 시계를 정오(KST 12시)로 고정한다(밤 명암 · 가로등 · 네온 없음). 날씨 연출 · 차량 · 사람 · HUD · 글자는 숨긴다.
 *   - 게임 화면을 3,072×3,072(청크 3×3)로 키우고, 청크 스트리밍을 하네스가 쥔다(`preloadAround`만 — 매 프레임 갱신은 끈다).
 *   - 블록(청크 3×3)마다 카메라를 옮겨 `postrender`에서 게임 캔버스를 누적 캔버스에 1/4(타일당 8px)로 그린다.
 *   - 누적 캔버스 → 4,096 시트(WebP) + 축소판(타일당 2px) + `index.json`(크기 · 시트 격자).
 *   레거시 맵(홈타운 · 타일 20px)은 블록 하나 · 원래 크기 그대로.
 *
 * 산출: <출력 폴더>/<데이터 지역>/{s_<col>_<row>.webp, overview.webp, index.json}
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');

const OUT = process.argv[2];
if (!OUT) { console.error('사용: node tools/capture_wiki_maps.cjs <출력 폴더> [데이터 지역 …]'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

/** 데이터 지역 → 씬을 여는 지역 · 구역 맵 id (어느 구역이든 같은 데이터 지역이면 같은 지도) */
const MAPS = {
  sokcho_v2: ['gangwon_sokcho', 'sokcho_sokchohang_1'],
  busan_gamcheon: ['busan', 'busan_namhang_1'],
  busan_baegunpo: ['busan', 'busan_baegunpo_1'],
  ulsan: ['ulsan', 'ulsan_bangeojin_1'],
  pohang_guryongpo: ['gyeongbuk_pohang', 'pohang_guryongpo_1'],
  geoje_east: ['gyeongnam_geoje', 'geoje_jisepo_1'],
  geoje_south: ['gyeongnam_geoje', 'geoje_haegeumgang_1'],
  yeosu_city: ['jeonnam_yeosu', 'yeosu_guhang_1'],
  taean_anheung: ['chungnam_taean', 'taean_anheung_1'],
  taean_manripo: ['chungnam_taean', 'taean_manripo_1'],
  jeju_city: ['jeju', 'jeju_dodu_1'],
  jeju_moseulpo: ['jeju', 'jeju_moseulpo_1'],
  jeju_seogwipo: ['jeju', 'jeju_seogwipo_1'],
  incheon_yeonan: ['incheon', 'incheon_yeonan_1'],
  ulleung: ['ulleungdo', 'ulleung_dodong_1'],   // 294차 — 울릉도 도동
  dokdo: ['dokdo', 'dokdo_dongdo_1'],   // 294차 — 독도 동도
  hometown: ['hometown', 'hometown_home'],
  // 265차 — 구 맵(레거시 · 타일 20px · 맵 그래프 노드). 심리스로 바뀐 뒤 게임에서는 안 열리지만 「지금 구현한 모든 지역맵」을 보려고 찍는다(씬 `legacy` 플래그)
  sokcho_sokchohang_3: ['gangwon_sokcho', 'sokcho_sokchohang_3', true],
  sokcho_sokchohang_2: ['gangwon_sokcho', 'sokcho_sokchohang_2', true],
  sokcho_sokchohang_1: ['gangwon_sokcho', 'sokcho_sokchohang_1', true],
  sokcho_sokchohang_dongmyeonghang: ['gangwon_sokcho', 'sokcho_sokchohang_dongmyeonghang', true],
  sokcho_dongmyeonghang_1: ['gangwon_sokcho', 'sokcho_dongmyeonghang_1', true],
  sokcho_dongmyeonghang_2: ['gangwon_sokcho', 'sokcho_dongmyeonghang_2', true],
  sokcho_dongmyeonghang_3: ['gangwon_sokcho', 'sokcho_dongmyeonghang_3', true],
  busan_gamcheon_west_1: ['busan', 'busan_gamcheon_west_1', true],
  busan_gamcheon_west_2: ['busan', 'busan_gamcheon_west_2', true],
  busan_gamcheon_east_1: ['busan', 'busan_gamcheon_east_1', true],
  busan_gamcheon_east_2: ['busan', 'busan_gamcheon_east_2', true],
  busan_gamcheon_east_3: ['busan', 'busan_gamcheon_east_3', true],
  busan_amnam_1: ['busan', 'busan_amnam_1', true],
  busan_baegunpo_1: ['busan', 'busan_baegunpo_1', true],
  busan_baegunpo_2: ['busan', 'busan_baegunpo_2', true],
};
const wanted = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const MAX_BLOCKS = Number((process.argv.find((a) => a.startsWith('--max-blocks=')) ?? '').split('=')[1] || 0);   // 시험용
const QUALITY = Number((process.argv.find((a) => a.startsWith('--quality=')) ?? '').split('=')[1] || 0.9);
const list = (wanted.length ? wanted : Object.keys(MAPS)).filter((k) => { if (!MAPS[k]) console.error('모르는 데이터 지역:', k); return !!MAPS[k]; });

const SHEET = 4096;          // 시트 한 변(px)
const BLOCK_PX = 3072;       // 블록 = 청크(32타일 × 32px = 1,024px) 3×3
const SCALE_DOWN = 4;        // 32px/타일 → 8px/타일

/** 정오 KST — 하네스 실행 시각과의 차이(ms). 페이지의 Date를 이만큼 민다 */
function noonOffsetMs() {
  const now = Date.now();
  const kst = new Date(now + 9 * 3600e3);
  const target = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), 3, 0, 0);   // 12:00 KST = 03:00 UTC
  return target - now;
}

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await page.addInitScript((off) => {
    localStorage.setItem('tra_fp_guide_seen', '1');
    const RealDate = Date;
    function FakeDate(...a) {
      if (!new.target) return new RealDate(RealDate.now() + off).toString();
      return a.length ? new RealDate(...a) : new RealDate(RealDate.now() + off);
    }
    FakeDate.now = () => RealDate.now() + off;
    FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC; FakeDate.prototype = RealDate.prototype;
    globalThis.Date = FakeDate;
  }, noonOffsetMs());
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => { const g = globalThis.__PIXEL_ANGLER_GAME; return g && g.scene.isActive('MainMenuScene'); }, { timeout: 90000 });
  await page.evaluate(() => { globalThis.__GS.startNewGameInSlot(3); });
  await page.waitForTimeout(1000);
  const hourInPage = await page.evaluate(() => new Date().getHours());
  console.log(`[clock] 페이지 시각(로컬) ${hourInPage}시 · Date 보정 ${Math.round(noonOffsetMs() / 60000)}분`);

  for (const dr of list) {
    const [region, mapId, legacy = false] = MAPS[dr];
    const t0 = Date.now();
    const before = errors.length;
    await page.evaluate(({ region, mapId, legacy }) => {
      const g = globalThis.__PIXEL_ANGLER_GAME;
      for (const s of g.scene.getScenes(true)) { if (s.scene.key !== 'RegionFieldScene') s.scene.stop(); }
      const f = g.scene.getScene('RegionFieldScene');
      if (f.scene.isActive()) f.scene.restart({ region, mapId, legacy }); else g.scene.start('RegionFieldScene', { region, mapId, legacy });
    }, { region, mapId, legacy });
    // 홈타운은 새 게임이 집 안(HomeInteriorScene)에서 시작한다 — 실내를 닫고 필드를 깨운다(stop + resume 규칙)
    await page.waitForFunction(() => {
      const g = globalThis.__PIXEL_ANGLER_GAME; const s = g.scene.getScene('RegionFieldScene');
      if (!s || s.bootFailed || !s.playerBody || !s.hud) return false;
      if (!s.scene.isActive() && g.scene.isActive('HomeInteriorScene')) { g.scene.getScene('HomeInteriorScene').scene.stop(); g.scene.resume('RegionFieldScene'); return false; }
      return s.scene.isActive() && (s.chunks || !s.seamlessDef);   // 구 맵(홈타운 · legacy)은 청크가 없다
    }, { timeout: 120000, polling: 300 });
    await page.waitForTimeout(2500);

    // ── 준비: 화면 키우기 · 카메라 풀기 · 숨기기 · 청크 스트리밍 쥐기
    const info = await page.evaluate(async ({ BLOCK_PX, SCALE_DOWN }) => {
      const g = globalThis.__PIXEL_ANGLER_GAME;
      const s = g.scene.getScene('RegionFieldScene');
      const seamless = !!s.chunks;
      const TR = seamless ? 32 : 20;
      const cols = s.cols, rows = s.rows;
      const worldW = cols * TR, worldH = rows * TR;
      const S = seamless ? BLOCK_PX : 1024;
      g.scale.setGameSize(S, S);
      await new Promise((r) => g.events.once('postrender', r));
      const cam = s.cameras.main;
      cam.stopFollow(); cam.removeBounds(); cam.setZoom(1);
      // 숨기기 — HUD · 사람 · 차량 · 날씨 · 글자 · 화면 고정 오브젝트
      s.hud?.setVisible(false);
      s.playerSprite?.setVisible(false);
      if (s.charSprite) for (const k of ['image', 'shadow', 'spr']) s.charSprite[k]?.setVisible?.(false);
      for (const n of s.storyNpcs ?? []) {
        n.actor?.walker?.spr?.setVisible?.(false); n.actor?.setVisible?.(false);
        n.label?.setVisible?.(false); n.mark?.setVisible?.(false);
      }
      s.refreshQuestMarkers = () => {};
      s.ambientNpcs?.destroy?.(); s.ambientNpcs = undefined;
      s.traffic?.destroy?.(); s.traffic = undefined;
      for (const o of s.weatherFxObjs ?? []) o.destroy?.(); s.weatherFxObjs = []; s.fxWeather = '__capture__';
      s.applyWeatherFx = () => {};
      s.promptText?.setVisible?.(false);
      for (const t of s.liveHints ?? []) t.setVisible?.(false);
      let hiddenText = 0, hiddenFixed = 0;
      for (const o of s.children.list) {
        if (o.type === 'Text') { o.setVisible(false); hiddenText++; }
        else if (o.scrollFactorX === 0 && o.scrollFactorY === 0 && o !== s.hud) { o.setVisible(false); hiddenFixed++; }
      }
      if (s.playerBody?.body) { s.playerBody.body.enable = false; s.playerBody.setVelocity?.(0, 0); }
      if (seamless) {
        const ch = s.chunks;
        if (!ch.__capturePatched) {
          const orig = ch.update.bind(ch);
          ch.__force = false;
          ch.update = (x, y) => { if (ch.__force) orig(x, y); };
          ch.__capturePatched = true;
        }
      }
      // 누적 캔버스
      const scale = seamless ? 1 / SCALE_DOWN : 1;
      const W = Math.ceil(worldW * scale), H = Math.ceil(worldH * scale);
      const acc = document.createElement('canvas'); acc.width = W; acc.height = H;
      const actx = acc.getContext('2d');
      actx.imageSmoothingEnabled = true; actx.imageSmoothingQuality = 'high';
      actx.fillStyle = '#0a0e14'; actx.fillRect(0, 0, W, H);
      globalThis.__ACC = { acc, actx, S, TR, cols, rows, worldW, worldH, scale, seamless };
      return { seamless, TR, cols, rows, worldW, worldH, S, W, H, camW: cam.width, camH: cam.height, hiddenText, hiddenFixed, renderer: g.renderer.type };
    }, { BLOCK_PX, SCALE_DOWN });
    console.log(`[${dr}] ${info.cols}×${info.rows}칸 · TR ${info.TR} · 화면 ${info.camW}×${info.camH} · 누적 ${info.W}×${info.H} · 글자 ${info.hiddenText} · 고정 ${info.hiddenFixed} 숨김 · renderer ${info.renderer}`);

    // ── 블록 목록(청크 3×3 중심)
    const blocks = [];
    if (info.seamless) {
      const chunkPx = 32 * info.TR;
      const chunkCols = Math.ceil(info.cols / 32), chunkRows = Math.ceil(info.rows / 32);
      for (let cr = 1; cr - 1 < chunkRows; cr += 3) {
        for (let cc = 1; cc - 1 < chunkCols; cc += 3) {
          const ce = Math.min(cc, chunkCols - 1), re = Math.min(cr, chunkRows - 1);
          blocks.push([ce * chunkPx + chunkPx / 2, re * chunkPx + chunkPx / 2]);
        }
      }
    } else {
      // 구 맵 — 1,024px 블록 격자(홈타운 960×640 = 1블록 · 속초 구 맵 1,460×1,180 = 4블록)
      for (let by = info.S / 2; by - info.S / 2 < info.worldH; by += info.S) for (let bx = info.S / 2; bx - info.S / 2 < info.worldW; bx += info.S) blocks.push([bx, by]);
    }
    const todo = MAX_BLOCKS > 0 ? blocks.slice(0, MAX_BLOCKS) : blocks;
    let i = 0;
    for (const [cx, cy] of todo) {
      const tb = Date.now();
      const r = await page.evaluate(async ({ cx, cy }) => {
        const g = globalThis.__PIXEL_ANGLER_GAME;
        const s = g.scene.getScene('RegionFieldScene');
        const A = globalThis.__ACC;
        const cam = s.cameras.main;
        const half = A.S / 2;
        if (A.seamless) { const ch = s.chunks; ch.__force = true; ch.preloadAround(cx, cy); ch.__force = false; }
        cam.setScroll(cx - half, cy - half);
        // 두 프레임 기다린 뒤 postrender에서 캔버스를 그대로 복사한다(WebGL 버퍼는 같은 프레임 안에서만 살아 있다)
        await new Promise((res) => g.events.once('postrender', () => g.events.once('postrender', res)));
        let copied = false;
        await new Promise((res) => g.events.once('postrender', () => {
          const x0 = Math.max(0, cx - half), y0 = Math.max(0, cy - half);
          const x1 = Math.min(A.worldW, cx + half), y1 = Math.min(A.worldH, cy + half);
          if (x1 > x0 && y1 > y0) {
            const sx = x0 - (cx - half), sy = y0 - (cy - half);
            A.actx.drawImage(g.canvas, sx, sy, x1 - x0, y1 - y0, Math.round(x0 * A.scale), Math.round(y0 * A.scale), Math.round((x1 - x0) * A.scale), Math.round((y1 - y0) * A.scale));
            copied = true;
          }
          res();
        }));
        const resident = A.seamless ? s.chunks.resident?.size : -1;
        return { copied, scroll: [cam.scrollX, cam.scrollY], resident };
      }, { cx, cy });
      i++;
      if (i % 10 === 1 || i === todo.length) console.log(`  블록 ${i}/${todo.length} (${cx},${cy}) ${r.copied ? '' : '— 범위 밖'} 상주 ${r.resident} · ${Date.now() - tb}ms`);
    }

    // ── 시트 · 축소판 저장
    const dir = path.join(OUT, dr);
    fs.mkdirSync(dir, { recursive: true });
    const meta = await page.evaluate(({ SHEET }) => {
      const A = globalThis.__ACC;
      return { W: A.acc.width, H: A.acc.height, sheetCols: Math.ceil(A.acc.width / SHEET), sheetRows: Math.ceil(A.acc.height / SHEET) };
    }, { SHEET });
    const toB64 = async (sx, sy, sw, sh, dw, dh, q) => page.evaluate(async ({ sx, sy, sw, sh, dw, dh, q }) => {
      const A = globalThis.__ACC;
      const c = document.createElement('canvas'); c.width = dw; c.height = dh;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.fillStyle = '#0a0e14'; x.fillRect(0, 0, dw, dh);
      x.drawImage(A.acc, sx, sy, sw, sh, 0, 0, dw, dh);
      const blob = await new Promise((r) => c.toBlob(r, 'image/webp', q));
      const buf = await blob.arrayBuffer();
      let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      return btoa(s);
    }, { sx, sy, sw, sh, dw, dh, q });
    let bytes = 0;
    const sheets = [];
    for (let sr = 0; sr < meta.sheetRows; sr++) {
      for (let sc = 0; sc < meta.sheetCols; sc++) {
        const sw = Math.min(SHEET, meta.W - sc * SHEET), sh = Math.min(SHEET, meta.H - sr * SHEET);
        const b64 = await toB64(sc * SHEET, sr * SHEET, sw, sh, sw, sh, QUALITY);
        const f = `s_${sc}_${sr}.webp`;
        const buf = Buffer.from(b64, 'base64');
        fs.writeFileSync(path.join(dir, f), buf);
        bytes += buf.length;
        sheets.push({ f, x: sc * SHEET, y: sr * SHEET, w: sw, h: sh, bytes: buf.length });
      }
    }
    const ovScale = info.seamless ? 0.25 : (legacy ? 0.5 : 1);   // 8px/타일 → 2px/타일 · 구 맵 20px → 10px(홈타운은 1:1 그대로)
    const ow = Math.round(meta.W * ovScale), oh = Math.round(meta.H * ovScale);
    const ovB64 = await toB64(0, 0, meta.W, meta.H, ow, oh, 0.9);
    const ovBuf = Buffer.from(ovB64, 'base64');
    fs.writeFileSync(path.join(dir, 'overview.webp'), ovBuf);
    const index = {
      dataRegion: dr, region, mapId, cols: info.cols, rows: info.rows, tilePx: info.TR,
      pxPerTile: info.seamless ? info.TR / SCALE_DOWN : info.TR, width: meta.W, height: meta.H,
      sheet: SHEET, sheets, overview: { f: 'overview.webp', w: ow, h: oh, pxPerTile: (info.seamless ? info.TR / SCALE_DOWN : info.TR) * ovScale },
      blocks: todo.length, capturedAt: new Date().toISOString(), quality: QUALITY,
    };
    fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 1));
    // 게임 화면 원복(다음 지역)
    await page.evaluate(() => { const g = globalThis.__PIXEL_ANGLER_GAME; g.scale.setGameSize(1280, 720); delete globalThis.__ACC; });
    console.log(`[${dr}] 완료 — 블록 ${todo.length} · 시트 ${sheets.length}장 ${(bytes / 1048576).toFixed(1)}MB · 축소판 ${(ovBuf.length / 1024).toFixed(0)}KB · ${((Date.now() - t0) / 1000).toFixed(0)}s · pageerror ${errors.length - before}`);
  }
  console.log('[errors]', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch((e) => { console.error('CAPTURE FAIL', e); process.exit(1); });
