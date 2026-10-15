/**
 * @file gemini_item_art.cjs
 * @description 255차 — 장비 밖 아이템 그림을 Gemini 그림 모델로 그린다(249차 `gemini_tackle_art.cjs`와 같은 길).
 *
 *  대상: 코드로 그린 임시 그림(`art_*` — `tools/item_art/icons_*.py`) · 16px 손그림(`px:*`) · 그림이 아예 없던 아이템(가구 등).
 *  생김새 표는 묶음마다 파일 하나다 — `tools/item_looks/<묶음>.cjs`(밑줄로 시작하는 파일은 표가 아니다).
 *  여러 사람이 동시에 다른 묶음을 쓸 수 있게 나눴다. 한 항목:
 *    <텍스처 키>: { file, nameKo, nameEn, aspect: '1:1'|'4:3'|'3:4'|'16:9', refs: [ROOT 기준 경로 3장], look,
 *                   ids?: [아이템 id], px?: ['px:<16px 키>'], pair?: true, keepWhite?: true, mesh?: true, count?: n }
 *    - 키가 이미 아이템이 쓰는 텍스처 키(`art_*`)면 아이템 · 세이브는 그대로 두고 그림만 바뀐다(`item_art/build.py`가 그 키를 빼 준다).
 *    - 새 키면 `ids`(아이템 id) · `px`(16px 아이콘 키)로 어느 아이템이 이 그림을 쓰는지 잇는다(`item_cards.cjs`가 `ItemImages.ts`를 쓴다).
 *    - `pair: true` — 한 켤레(장갑 · 신발)는 **왼쪽 한 짝 + 오른쪽 한 짝, 딱 두 짝**만 그리게 한다
 *      (249차 「한 켤레는 한 덩어리로」 문구가 손가락 겹친 장갑 · 세 짝 신발을 낳았다).
 *    - `count: n` — 정확히 n개(경단 세 알처럼). 안 쓰면 「그 물건 하나만」.
 *  키는 환경의 네트워크 시크릿을 에이전트 프록시가 붙인다(이 스크립트 · 저장소에는 키가 없다).
 *  ⚠ Node 내장 fetch는 HTTPS_PROXY를 읽지 않는다 — 반드시 `NODE_USE_ENV_PROXY=1`로 돌린다.
 *
 *  사용:
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --out <폴더> [--group food] [--only art_a,art_b]
 *        [--model gemini-nano-banana-2.1] [--jobs 4] [--tries 4] [--tag v2] [--force] [--dry]
 *    결과: <폴더>/<키>[.<tag>].png(PNG32) + <폴더>/_log.jsonl
 *    검수 시트: node tools/gemini_item_art.cjs --out <폴더> --sheet <png> [--group …] [--tag v2]
 *    표 하나만: --looks tools/item_looks/_dishes.cjs (불요리 완성 요리 사진 — 설치는 `tools/dish_photos.cjs`)
 *    설치(고른 판은 태그 없는 이름으로 둔다): --install [--group …] [--only …] [--force]
 *      배경 벗기기(여러 조각 유지) → 번짐 벗기기 → 타이트 크롭 → 격자 정규화(긴 변 192칸 · 셀 6px) → `food assets/items/<파일>`.
 *    그다음 `node tools/item_cards.cjs`가 게임용 카드(228×90 안) · 아이콘(64px) · `src/data/ItemImages.ts`를 쓴다.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'food assets', 'items');
const LOOKS_DIR = path.join(__dirname, 'item_looks');
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

/** 표 읽기 — `tools/item_looks/*.cjs`(밑줄 파일 제외). 키가 겹치면 멈춘다. `only`면 그 파일 하나만(요리 사진 `_dishes.cjs` 등) */
function loadLooks(only = '') {
  const out = {};
  if (only) {
    const group = path.basename(only).replace(/\.cjs$/, '').replace(/^_/, '');
    for (const [k, v] of Object.entries(require(path.resolve(only)))) out[k] = { ...v, group };
    return out;
  }
  if (!fs.existsSync(LOOKS_DIR)) return out;
  for (const f of fs.readdirSync(LOOKS_DIR).filter((n) => n.endsWith('.cjs') && !n.startsWith('_')).sort()) {
    const group = f.replace(/\.cjs$/, '');
    const tab = require(path.join(LOOKS_DIR, f));
    for (const [k, v] of Object.entries(tab)) {
      if (out[k]) throw new Error(`키 겹침: ${k} (${out[k].group} · ${group})`);
      out[k] = { ...v, group };
    }
  }
  return out;
}

const STYLE_INTRO = '첨부한 그림 세 장은 화풍 참고용입니다. 이 그림들과 같은 픽셀 아트 화풍으로 게임 아이템 하나를 새로 그려 주세요. '
  + '같은 도트 크기, 물건 둘레 전체를 감싸는 진한 윤곽선, 밝은 하이라이트와 어두운 그늘의 단계, 사실적인 색과 재질(금속 · 플라스틱 · 천 · 종이 · 유리 · 나무 · 음식) 표현을 맞춥니다. '
  + '물건은 비스듬히 위에서 내려다본 각도(4분의 3 시점)로 입체감 있게 그립니다. 참고 그림 속 물건은 그리지 마세요.';

function quantityRule(it) {
  if (it.pair) {
    return '수량: 한 켤레 = 왼쪽 한 짝과 오른쪽 한 짝, 정확히 두 짝만. 세 짝 이상 또는 한 짝만 그리지 않는다. '
      + '두 짝은 나란히 놓고(살짝만 겹쳐도 됨) 각 짝의 모양 전체(손가락 다섯 개 · 신발 앞코부터 뒤꿈치까지)가 보이게.';
  }
  if (it.count) return `수량: 정확히 ${it.count}개. 더 그리지도 덜 그리지도 않는다.`;
  return '수량: 그 물건 하나만.';
}

const taskText = (it) => `그릴 것: ${it.nameKo} (${it.nameEn}). ${it.look}\n`
  + `${quantityRule(it)}\n`
  + '조건: 순백색 단색 배경. 화면 가운데에 크게, 끝까지 잘리지 않게. '
  + '사람 손 · 바닥 · 탁자 · 그림자 · 글자 · 숫자 · 로고 · 상표 · 테두리 없음. 사진이 아니라 픽셀 아트.';

function parseArgs(argv) {
  const P = { out: '', only: null, group: '', looks: '', model: 'gemini-nano-banana-2.1', jobs: 4, tries: 4, tag: '', force: false, dry: false, install: false, grid: 192, sheet: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--out') P.out = v();
    else if (a === '--only') P.only = new Set(v().split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--group') P.group = v();
    else if (a === '--looks') P.looks = v();
    else if (a === '--model') P.model = v();
    else if (a === '--jobs') P.jobs = Math.max(1, +v());
    else if (a === '--tries') P.tries = Math.max(1, +v());
    else if (a === '--tag') P.tag = v();
    else if (a === '--force') P.force = true;
    else if (a === '--dry') P.dry = true;
    else if (a === '--install') P.install = true;
    else if (a === '--grid') P.grid = Math.max(0, +v());
    else if (a === '--sheet') P.sheet = v();
  }
  if (!P.out) { console.error('--out <폴더>가 필요하다'); process.exit(1); }
  return P;
}

const outName = (key, tag) => `${key}${tag ? `.${tag}` : ''}`;

/** 참고 그림 — 흰 바탕에 얹어 긴 변 512px PNG로 한 번만 만든다(경로는 ROOT 기준) */
function refPart(outDir, rel) {
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, rel.replace(/[\\/ ]/g, '_'));
  if (!fs.existsSync(dst)) execFileSync('convert', [path.join(ROOT, rel), '-background', 'white', '-alpha', 'remove', '-resize', '512x512>', `PNG24:${dst}`]);
  return { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateOne(key, it, P) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: STYLE_INTRO }, ...it.refs.map((f) => refPart(P.out, f)), { text: taskText(it) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: it.aspect ?? '1:1' } },
  };
  let last = '';
  for (let attempt = 1; attempt <= P.tries; attempt++) {
    const t0 = Date.now();
    let res, j;
    try {
      res = await fetch(`${API}/${P.model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      j = await res.json();
    } catch (e) { last = `fetch ${e.message}`; await sleep(5000 * attempt); continue; }
    const ms = Date.now() - t0;
    if (!res.ok) {
      last = `HTTP ${res.status} ${(j?.error?.message ?? '').slice(0, 160)}`;
      if (res.status === 403) throw new Error(`${last} — NODE_USE_ENV_PROXY=1로 돌렸는지, 시크릿 · 결제를 확인`);
      await sleep((res.status === 429 ? 20000 : 6000) * attempt);
      continue;
    }
    const parts = j.candidates?.[0]?.content?.parts ?? [];
    const img = parts.map((p) => p.inlineData ?? p.inline_data).find((d) => d?.data);
    if (!img) { last = `그림 없음 finish=${j.candidates?.[0]?.finishReason ?? '?'}`; await sleep(3000); continue; }
    const name = outName(key, P.tag);
    // ⚠ 임시 파일 이름에 확장자 `.raw`를 쓰지 않는다 — ImageMagick이 날 픽셀로 읽는다(247)
    const tmp = path.join(os.tmpdir(), `gia_${name}_${process.pid}`);
    fs.writeFileSync(tmp, Buffer.from(img.data, 'base64'));
    execFileSync('convert', [tmp, '-depth', '8', `PNG32:${path.join(P.out, `${name}.png`)}`]);
    fs.rmSync(tmp, { force: true });
    const u = j.usageMetadata ?? {};
    fs.appendFileSync(path.join(P.out, '_log.jsonl'), JSON.stringify({
      key, file: `${name}.png`, model: P.model, attempt, ms, mime: img.mimeType ?? img.mime_type,
      inTok: u.promptTokenCount, outTok: u.candidatesTokenCount, at: new Date().toISOString(),
    }) + '\n');
    return { ok: true, ms, attempt };
  }
  return { ok: false, err: last };
}

/** 검수 시트 — 12장씩 · 칸 아래 키와 이름(흰 배경 그대로) */
function sheet(P, LOOKS, list) {
  const files = list.map((k) => path.join(P.out, `${outName(k, P.tag)}.png`)).filter((f) => fs.existsSync(f));
  if (!files.length) { console.log('시트에 넣을 그림이 없다'); return; }
  const base = P.sheet.replace(/\.png$/, '');
  for (let i = 0; i < files.length; i += 12) {
    const chunk = files.slice(i, i + 12);
    const args = [];
    for (const f of chunk) {
      const key = path.basename(f, '.png').replace(/\.[^.]+$/, '');
      args.push('-label', `${key}\n${LOOKS[key]?.nameKo ?? ''}`, f);
    }
    const dst = `${base}_${String(i / 12 + 1).padStart(2, '0')}.png`;
    execFileSync('montage', [...args, '-font', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '-pointsize', '13', '-tile', '4x', '-geometry', '260x260+6+6', '-background', '#e8e4da', dst]);
    console.log(`시트 → ${dst}`);
  }
}

/** 검수를 마친 `<out>/<키>.png` → 배경 벗기기 → 번짐 벗기기 → 타이트 크롭 + 투명 여백 → 격자 정규화(셀 6px) → `food assets/items/<파일>` */
async function install(P, LOOKS, list) {
  const { DEFAULTS, decodeAny } = require('./pixelize_crops.cjs');
  const { peelFringe, regrid } = require('./gemini_fish_art.cjs');
  const { cutoutMulti } = require('./gemini_tackle_art.cjs');
  const { encode } = require('./lib_png.cjs');
  fs.mkdirSync(SRC, { recursive: true });
  const PAD = 2;
  let n = 0;
  for (const key of list) {
    const it = LOOKS[key];
    const src = path.join(P.out, `${key}.png`);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(SRC, it.file);
    if (fs.existsSync(dst) && !P.force) { console.log(`${path.relative(ROOT, dst)}: 이미 있어 건너뛴다(--force로 덮기)`); continue; }
    const img = await decodeAny(src);
    const w = img.w, h = img.h;
    const cut = cutoutMulti(img, DEFAULTS.tol, !it.keepWhite, !!it.mesh);
    const d = cut.data;
    const pf = peelFringe(d, w, h);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { console.error(`${key}: 전경이 없다`); continue; }
    const bw = x1 - x0 + 1 + PAD * 2, bh = y1 - y0 + 1 + PAD * 2;
    const out = Buffer.alloc(bw * bh * 4);
    for (let y = y0; y <= y1; y++) d.copy(out, ((y - y0 + PAD) * bw + PAD) * 4, (y * w + x0) * 4, (y * w + x1 + 1) * 4);
    for (let i = 0; i < bw * bh; i++) if (out[i * 4 + 3] === 0) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0;
    let fin = { w: bw, h: bh, data: out }, gridNote = '';
    if (P.grid > 0) {
      const g = regrid(out, bw, bh, P.grid, DEFAULTS.cell);
      const pw = g.w + DEFAULTS.cell * 2, ph = g.h + DEFAULTS.cell * 2, padded = Buffer.alloc(pw * ph * 4);
      for (let y = 0; y < g.h; y++) g.data.copy(padded, ((y + DEFAULTS.cell) * pw + DEFAULTS.cell) * 4, y * g.w * 4, (y + 1) * g.w * 4);
      fin = { w: pw, h: ph, data: padded };
      gridNote = ` · 격자 ${g.cw}×${g.ch}칸(셀 ${DEFAULTS.cell}px)`;
    }
    const bytes = encode(fin.w, fin.h, fin.data, dst);
    console.log(`${key} → ${path.relative(ROOT, dst)}: ${w}x${h} → ${fin.w}x${fin.h} (${(bytes / 1024).toFixed(0)}KB) · ${cut.note} · 번짐 ${pf.peeled}px${gridNote}`);
    n++;
  }
  console.log(`${n}장 설치 → 이제 node tools/item_cards.cjs`);
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  const LOOKS = loadLooks(P.looks);
  // 합성 그림(`composite` — 씨앗 봉투 `seed_packets.cjs`)은 Gemini로 그리지 않는다
  const picked = (key) => !LOOKS[key].composite && (!P.only || P.only.has(key)) && (!P.group || LOOKS[key].group === P.group);
  const all = Object.keys(LOOKS).filter(picked);
  fs.mkdirSync(P.out, { recursive: true });
  if (P.sheet) { sheet(P, LOOKS, all); return; }
  if (P.install) { await install(P, LOOKS, all); return; }
  const list = all.filter((k) => P.force || !fs.existsSync(path.join(P.out, `${outName(k, P.tag)}.png`)));
  for (const k of list) for (const r of LOOKS[k].refs ?? []) if (!fs.existsSync(path.join(ROOT, r))) throw new Error(`${k}: 참고 그림이 없다 — ${r}`);
  console.log(`대상 ${list.length}장 · 모델 ${P.model} · 동시 ${P.jobs}`);
  if (P.dry) { for (const k of list) console.log(`${outName(k, P.tag)} [${LOOKS[k].aspect ?? '1:1'} · 참고 ${LOOKS[k].refs.join(', ')}]\n${taskText(LOOKS[k])}\n`); return; }
  let next = 0, done = 0, fail = 0;
  const failed = [];
  const worker = async () => {
    while (next < list.length) {
      const k = list[next++];
      const r = await generateOne(k, LOOKS[k], P);
      if (r.ok) { done++; console.log(`[${done + fail}/${list.length}] ${outName(k, P.tag)} — ${r.ms}ms${r.attempt > 1 ? ` (시도 ${r.attempt})` : ''}`); }
      else { fail++; failed.push(outName(k, P.tag)); console.log(`[${done + fail}/${list.length}] ${outName(k, P.tag)} — 실패: ${r.err}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(P.jobs, list.length) }, worker));
  console.log(`끝: 성공 ${done} · 실패 ${fail}${failed.length ? ` (${failed.join(', ')})` : ''}`);
}

module.exports = { loadLooks, STYLE_INTRO, taskText, generateOne };
if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
