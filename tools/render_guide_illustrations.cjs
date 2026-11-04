/**
 * @file render_guide_illustrations.cjs
 * @description 게임 가이드 삽화(640×300 · `packages/client-pc/public/guide/guide_<group>_<n>.png`) 렌더 도구 — 300(D)차.
 *
 *  삽화의 정본은 목업 `docs/mockups/game_guide_hub.html`이다(슬라이드마다 인라인 SVG 문자열 — `svg: bg + "<g …>"`).
 *  116차까지는 그 목업을 브라우저에서 열어 손으로 찍었고, 이 도구는 그 일을 Playwright(Chromium)로 되풀이한다.
 *  300(D)차 — 사용자 리포트 「회뜨기 1장 회칼 세 자루가 막대 사각형 자리 표시」 → 자리 표시로 그린 물건(칼 · 찌 · 미끼 · 지그 · 밑밥 · 물고기 · 필렛)을
 *  실제 그림으로 바꾸면서 만들었다. 그림은 파일 경로가 아니라 **데이터 URI**로 목업 안에 들어간다(파일 서버 없이 렌더 · 목업을 그냥 열어도 보인다).
 *
 *  두 단계:
 *   1. `--embed` — 아래 `GUIDE_IMAGES` 표(원본 파일 · 맞출 칸)를 읽어 투명 여백을 자르고 면적 평균(`tackle_cards.cjs`의 `shrinkKeepAlpha`)으로
 *      **그려질 크기 그대로** 줄인 뒤 PNG 데이터 URI로 목업의 GUIDE_IMG_BEGIN … GUIDE_IMG_END 주석 블록(`const IMG = {…}`)에 굽는다.
 *      슬라이드 SVG는 `pic(키, cx, cy, {rot, flip, opacity})`(목업 안 헬퍼)로 그 그림을 제 크기(배율 1)로 놓는다 — 브라우저 리샘플이 없다.
 *      `px: true`(도트 그림)이면 줄이지 않고 `fit`에 들어가는 **정수 배율**로 키워 `image-rendering: pixelated`로 그린다.
 *   2. `--render` — 목업을 열어 `GUIDES`를 읽고 슬라이드마다 640×300으로 찍는다(`--only`로 일부만).
 *
 *  사용(레포 루트):
 *    node tools/render_guide_illustrations.cjs --embed                       # 그림 표 → 목업 IMG 블록
 *    node tools/render_guide_illustrations.cjs --render [--out <폴더>] [--only butchery_1,chum_4] [--font <ttf>] [--font-bold <ttf>]
 *    node tools/render_guide_illustrations.cjs --embed --render             # 둘 다(기본 출력 = public/guide)
 *
 *  글꼴: 목업은 "Noto Sans KR" → "Segoe UI" → sans-serif 순이다. Windows는 맑은 고딕이 받쳐 주지만 리눅스 컨테이너에는 한글 글꼴이 없어
 *  네모가 찍힌다 — `--font <ttf>`(일반) · `--font-bold <ttf>`(굵게)로 Noto Sans KR TTF를 주면 @font-face(데이터 URI)로 싣는다.
 *  (Google Fonts `css?family=Noto+Sans+KR:400,700&text=<쓰는 글자>`를 옛 UA로 받으면 쓰는 글자만 든 작은 TTF가 온다 — 300(D) 실제 절차.)
 *
 *  슬라이드 ↔ 파일(목업 GUIDES 순서 그대로 — 1부터):
 *   | 목업 탭 | 파일 접두 | 장 | 비고 |
 *   |---|---|---|---|
 *   | 파이트 | guide_fight_<n> | 1~5 | `guide_fight_6`(실캡처 합성)은 `tools/compose_fight_guide.py` — 이 도구가 건드리지 않는다 |
 *   | 회수 | guide_retrieve_<n> | 1~4 | |
 *   | 밑밥 | guide_chum_<n> | 1~5 | |
 *   | 회뜨기 | guide_butchery_<n> | 1~5 | |
 *  게임은 `src/data/GuideContent.ts`의 `textureKey`로 싣는다(BootScene) — 입질·챔질 탭은 `guide_fight_1`을 같이 쓴다.
 *
 *  검증: 찍은 PNG가 640×300인지 `lib_png.decode`로 확인하고 전 · 후 비교 시트를 눈으로 본다(글자 겹침 · 그림 잘림).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib_png.cjs');
const { shrinkKeepAlpha } = require('./tackle_cards.cjs');

const ROOT = path.resolve(__dirname, '..');
const MOCKUP = path.join(ROOT, 'docs', 'mockups', 'game_guide_hub.html');
const OUT_DEFAULT = path.join(ROOT, 'packages', 'client-pc', 'public', 'guide');
const W = 640, H = 300;
/** 목업 탭 이름 → 파일 접두 */
const GROUP_OF = { '파이트': 'fight', '회수': 'retrieve', '밑밥': 'chum', '회뜨기': 'butchery' };
const BEGIN = '/* GUIDE_IMG_BEGIN */', END = '/* GUIDE_IMG_END */';

/**
 * 삽화에 들어가는 그림 표 — 키: { src(레포 루트 기준), fit: [최대 가로, 최대 세로], px?: 도트 그림(정수 배율), note }.
 * 쓰는 곳마다 그려질 크기로 따로 굽는다(같은 원본이라도 키를 나눈다) — 브라우저가 다시 줄이지 않게.
 *  - 칼 · 찌 · 미끼 · 지그 · 밑밥 = 255차 아이템 · 249차 장비 그림 **원본**(`food assets/`) — `public/` 카드(90px)는 삽화에 작다.
 *  - 물고기 = 246차 어종 그림 원본(감성돔 = 찌낚시 장면 · 참돔 = 회뜨기 장면).
 *  - 필렛 = `public/sashimi/fillet_side_bream.png`(원본 없음 — 배율 1 이하로만).
 */
const GUIDE_IMAGES = {
  // 회뜨기 1 — 회칼 세 자루(막칼 0.85 · 회칼 1.0 · 야나기바 1.1 = core KnifeDatabase knife_utility · knife_sashimi · knife_yanagiba)
  knife_utility: { src: 'food assets/items/knife_utility.png', fit: [168, 168] },
  knife_sashimi: { src: 'food assets/items/knife_sashimi.png', fit: [168, 168] },
  knife_yanagiba: { src: 'food assets/items/knife_yanagiba.png', fit: [168, 168] },
  // 회수 1~3 — 구멍찌(찌 채비) · 크릴 미끼 · 메탈지그(루어)
  float_hole_36: { src: 'food assets/tackle/it_float_hole_v2.png', fit: [36, 36] },
  float_hole_48: { src: 'food assets/tackle/it_float_hole_v2.png', fit: [48, 48] },
  float_hole_56: { src: 'food assets/tackle/it_float_hole_v2.png', fit: [56, 56] },
  float_hole_64: { src: 'food assets/tackle/it_float_hole_v2.png', fit: [64, 64] },
  krill_14: { src: 'food assets/tackle/it_krill_bait.png', fit: [14, 14] },
  krill_22: { src: 'food assets/tackle/it_krill_bait.png', fit: [22, 22] },
  krill_24: { src: 'food assets/tackle/it_krill_bait.png', fit: [24, 24] },
  metal_jig_60: { src: 'food assets/tackle/it_metal_jig.png', fit: [60, 60] },
  // 밑밥 4 — 파우더 봉지 · 압맥 봉지 · 경단(뭉친 밑밥 — 빵가루 경단 그림)
  chum_powder_56: { src: 'food assets/tackle/chum_powder.png', fit: [56, 56] },
  chum_apmac_56: { src: 'food assets/tackle/chum_apmac.png', fit: [56, 56] },
  breadball_48: { src: 'food assets/tackle/breadball.png', fit: [56, 48] },
  // 파이트 3 · 5 · 밑밥 1 — 감성돔(머리 왼쪽)
  bsb_80: { src: 'food assets/fish/black_sea_bream.png', fit: [80, 80] },
  bsb_110: { src: 'food assets/fish/black_sea_bream.png', fit: [110, 110] },
  bsb_180: { src: 'food assets/fish/black_sea_bream.png', fit: [180, 180] },
  // 회뜨기 2 — 참돔(슬라이드에서 좌우 뒤집어 머리 오른쪽)
  rsb_270: { src: 'food assets/fish/red_sea_bream.png', fit: [270, 160] },
  // 회뜨기 5 — 참돔 필렛 옆모습(박피)
  fillet_side_340: { src: 'packages/client-pc/public/sashimi/fillet_side_bream.png', fit: [340, 110] },
};

// ── 인자 ──────────────────────────────────────────────
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const DO_EMBED = has('--embed'), DO_RENDER = has('--render');
const OUT = path.resolve(opt('--out', OUT_DEFAULT));
const ONLY = (opt('--only', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const FONT = opt('--font', ''), FONT_BOLD = opt('--font-bold', '');
const log = (...a) => console.log('[guide]', ...a);

// ── 그림 굽기 ─────────────────────────────────────────
/** 투명 여백(알파 < 8) 자르기 — 1px 여유 */
function trimAlpha(im) {
  const { w, h, data } = im;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] >= 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new Error('빈 그림');
  x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(w - 1, x1 + 1); y1 = Math.min(h - 1, y1 + 1);
  const tw = x1 - x0 + 1, th = y1 - y0 + 1, out = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) data.copy(out, y * tw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + tw) * 4);
  return { w: tw, h: th, data: out };
}

/** 최근접 정수 배율 확대(도트 그림) */
function nearestUp(im, k) {
  const tw = im.w * k, th = im.h * k, out = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const s = ((Math.floor(y / k)) * im.w + Math.floor(x / k)) * 4, d = (y * tw + x) * 4;
    out[d] = im.data[s]; out[d + 1] = im.data[s + 1]; out[d + 2] = im.data[s + 2]; out[d + 3] = im.data[s + 3];
  }
  return { w: tw, h: th, data: out };
}

/** 한 항목 → { w, h, png(Buffer) } — fit 칸에 맞춰 줄이기(또는 도트는 정수 배율 키우기) */
function bakeImage(key, spec) {
  const file = path.join(ROOT, spec.src);
  if (!fs.existsSync(file)) throw new Error(`${key}: 원본이 없다 — ${spec.src}`);
  const im = trimAlpha(decode(file));
  const [fw, fh] = spec.fit;
  let out;
  if (spec.px) {
    const k = Math.max(1, Math.floor(Math.min(fw / im.w, fh / im.h)));
    out = k === 1 ? im : nearestUp(im, k);
  } else {
    const s = Math.min(fw / im.w, fh / im.h, 1);
    const tw = Math.max(1, Math.round(im.w * s)), th = Math.max(1, Math.round(im.h * s));
    out = s >= 1 ? im : { w: tw, h: th, data: shrinkKeepAlpha(im.data, im.w, im.h, tw, th) };
  }
  const tmp = path.join(require('os').tmpdir(), `guide_img_${process.pid}_${key}.png`);
  encode(out.w, out.h, out.data, tmp);
  const png = fs.readFileSync(tmp); fs.unlinkSync(tmp);
  return { w: out.w, h: out.h, png };
}

/** GUIDE_IMAGES → 목업 IMG 블록 */
function embed() {
  let html = fs.readFileSync(MOCKUP, 'utf8');
  const lines = [BEGIN, '// 자동 생성 — node tools/render_guide_illustrations.cjs --embed (표 GUIDE_IMAGES · 손으로 고치지 않는다)'];
  lines.push('const IMG = {');
  let total = 0;
  for (const [key, spec] of Object.entries(GUIDE_IMAGES)) {
    const { w, h, png } = bakeImage(key, spec);
    total += png.length;
    lines.push(` ${key}: {w:${w},h:${h},px:${spec.px ? 'true' : 'false'},src:"data:image/png;base64,${png.toString('base64')}"},`);
    log(`embed ${key} ${w}×${h} ${(png.length / 1024).toFixed(1)}KB`);
  }
  lines.push('};');
  // 그림 놓기 — 가운데 (cx, cy)에 제 크기로. rot(도) · flip(좌우) · opacity
  lines.push("const pic=(k,cx,cy,o={})=>{const im=IMG[k];if(!im)throw new Error('IMG '+k);const t=['translate('+cx+','+cy+')'];if(o.rot)t.push('rotate('+o.rot+')');if(o.flip)t.push('scale(-1,1)');"
    + "return \"<g transform='\"+t.join(' ')+\"'\"+(o.opacity!=null?\" opacity='\"+o.opacity+\"'\":'')+\"><image href='\"+im.src+\"' x='\"+(-im.w/2)+\"' y='\"+(-im.h/2)+\"' width='\"+im.w+\"' height='\"+im.h+\"'\"+(im.px?\" style='image-rendering:pixelated'\":'')+\"/></g>\";};");
  lines.push(END);
  const block = lines.join('\n');
  const b = html.indexOf(BEGIN), e = html.indexOf(END);
  if (b >= 0 && e > b) html = html.slice(0, b) + block + html.slice(e + END.length);
  else {
    const anchor = html.indexOf('const GUIDES = {');
    if (anchor < 0) throw new Error('목업에서 const GUIDES를 못 찾았다');
    html = html.slice(0, anchor) + block + '\n' + html.slice(anchor);
  }
  fs.writeFileSync(MOCKUP, html);
  log(`IMG 블록 ${Object.keys(GUIDE_IMAGES).length}장 · ${(total / 1024).toFixed(0)}KB → ${path.relative(ROOT, MOCKUP)}`);
}

// ── 렌더 ──────────────────────────────────────────────
function resolvePlaywright() {
  try { return require('playwright'); } catch { /* 다음 */ }
  for (const c of ['/opt/node22/lib/node_modules/playwright', '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright']) {
    if (fs.existsSync(c)) return require(c);
  }
  throw new Error('playwright를 못 찾았다 — npm i -D playwright 또는 전역 설치');
}

function fontFace(file, weight) {
  if (!file) return '';
  const b64 = fs.readFileSync(path.resolve(file)).toString('base64');
  return `@font-face{font-family:"Noto Sans KR";font-weight:${weight};src:url(data:font/ttf;base64,${b64}) format("truetype");}`;
}

async function render() {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  try {
    const hub = await browser.newPage();
    await hub.goto('file://' + MOCKUP);
    const guides = await hub.evaluate(() => GUIDES);   // 목업 전역(const — 스크립트 렉시컬 전역)
    await hub.close();
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const css = `${fontFace(FONT, 400)}${fontFace(FONT_BOLD, 700)}*{font-family:"Noto Sans KR","Segoe UI",sans-serif;}body{margin:0;background:#0c1e30;overflow:hidden}svg{display:block}`;
    fs.mkdirSync(OUT, { recursive: true });
    let n = 0;
    for (const [tab, pages] of Object.entries(guides)) {
      const group = GROUP_OF[tab];
      if (!group) { log(`탭 「${tab}」은 파일 접두가 없다 — 건너뜀`); continue; }
      for (let i = 0; i < pages.length; i++) {
        const name = `${group}_${i + 1}`;
        if (ONLY.length && !ONLY.includes(name)) continue;
        const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>`
          + `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${pages[i].svg}</svg></body></html>`;
        await page.setContent(html, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const file = path.join(OUT, `guide_${name}.png`);
        await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H }, omitBackground: false });
        const chk = decode(file);
        if (chk.w !== W || chk.h !== H) throw new Error(`${name}: ${chk.w}×${chk.h} — 640×300이 아니다`);
        log(`render ${name} → ${path.relative(ROOT, file)} (${W}×${H} · ${pages[i].h})`);
        n++;
      }
    }
    log(`${n}장`);
  } finally { await browser.close(); }
}

(async () => {
  if (!DO_EMBED && !DO_RENDER) { console.log('--embed 또는 --render를 준다 (머리말 참조)'); process.exit(1); }
  if (DO_EMBED) embed();
  if (DO_RENDER) await render();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
