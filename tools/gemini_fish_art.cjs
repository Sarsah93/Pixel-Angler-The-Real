/**
 * @file gemini_fish_art.cjs
 * @description 246차 — 그림이 없는 어종을 Gemini 그림 모델로 그린다(사진 없이 「생김새 설명 + 기존 어종 그림을 화풍 참고」).
 *
 *  키는 환경의 네트워크 시크릿(호스트 `generativelanguage.googleapis.com` · 헤더 `x-goog-api-key`)을
 *  에이전트 프록시가 붙인다 — 이 스크립트 · 저장소에는 키가 없다.
 *  ⚠ Node 내장 fetch는 HTTPS_PROXY를 읽지 않는다 — 반드시 `NODE_USE_ENV_PROXY=1`로 돌린다(Node ≥ 22.21).
 *
 *  사용:
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_fish_art.cjs --out <폴더> [--only tonguefish,sandfish]
 *        [--model gemini-nano-banana-2.1] [--jobs 2] [--tries 4] [--tag v2] [--force] [--dry]
 *    결과: <폴더>/<speciesId>[.<tag>].png(PNG32) + <폴더>/_log.jsonl(모델 · 토큰 · 시간)
 *    검수 뒤 `--install`(고른 판은 `<speciesId>.png` 이름으로 둔다)이 배경을 벗겨 생성 해상도 그대로(타이트 크롭 + 투명 여백 2px)
 *    `food assets/fish/<파일>`에 넣는다. 그다음 `node tools/fish_cards.cjs`가 게임용 카드 · 아이콘을 굽는다.
 *    ⚠ 192셀로 다시 맞추지 않는다 — Gemini 도트 격자는 고르지 않아(셀 5~23px 추정) 리샘플하면 윤곽선이 흐려진다(246 비교 시트).
 *
 *  그림 규칙(기존 어종 53장과 같게): 한 마리 · 옆모습(가자미 · 서대류는 눈 있는 쪽을 위에서) · **머리 왼쪽 · 꼬리 오른쪽** ·
 *  진한 윤곽선 도트 · 사실적인 체색. 화풍 참고는 어종마다 고른 기존 그림 3장(흰 바탕에 얹어 긴 변 512px로 보낸다).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FISH_SRC = path.join(ROOT, 'food assets', 'fish');
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * 어종 id → 파일 이름(영어 통칭 · 소문자) · 그림 비율 · 화풍 참고 3장(`food assets/fish/` 원본) · 생김새.
 * 모델이 헷갈리기 쉬운 이웃 종(쥐치 ↔ 말쥐치 · 정어리 ↔ 눈퉁멸)은 다른 점을 적는다.
 */
const LOOKS = {
  tonguefish: {
    file: 'robust_tonguefish.png', aspect: '21:9', refs: ['flounder.png', 'bartail_flathead.png', 'conger_eel.png'],
    look: '서대(혀가자미)류 납작한 물고기를 눈 있는 쪽에서 위로 내려다본 모습. 가자미 · 넙치처럼 둥근 타원이 아니라 사람 혓바닥처럼 가늘고 긴 몸이다 — '
      + '지느러미까지 합친 몸 폭이 길이의 4분의 1을 넘지 않는 가늘고 긴 띠 모양이고, 머리 쪽이 가장 넓으며 꼬리 쪽으로 갈수록 곧게 가늘어져 창끝처럼 뾰족하게 끝난다. '
      + '머리 끝은 둥글고, 작은 두 눈이 머리 위쪽에 몰려 있으며, 입은 작고 갈고리처럼 아래로 굽었다. 몸 색은 붉은 기가 도는 황갈색 · 모래색에 잔비늘 질감. '
      + '등지느러미와 뒷지느러미는 몸 가장자리를 따라 가는 술처럼 이어지다 꼬리 끝에서 하나로 만난다(꼬리지느러미가 따로 갈라지지 않는다). 가슴지느러미 · 배지느러미는 보이지 않는다.',
  },
  round_herring: {
    file: 'round_herring.png', aspect: '21:9', refs: ['yellowtail_fish.png', 'flathead_grey_mullet.png', 'northern_whiting.png'],
    look: '눈퉁멸(청어과 소형 물고기)을 옆에서 본 모습. 몸은 가늘고 길며 단면이 둥근 원통형이다(옆으로 눌린 몸이 아니다) — 몸높이가 몸길이의 6분의 1쯤으로 날씬하다. 눈이 몸에 비해 아주 크다. '
      + '등은 짙은 청록색 · 남색, 옆구리와 배는 은백색으로 밝게 빛나며 경계가 매끈하게 바뀐다. 등지느러미 하나가 몸 가운데쯤, 배지느러미는 등지느러미보다 뒤에 있고, '
      + '꼬리는 깊게 갈라진 제비꼬리. 옆줄 · 반점 · 줄무늬 없음. 정어리보다 가늘고 길며 옆구리에 검은 점이 없다.',
  },
  sandfish: {
    file: 'japanese_sandfish.png', aspect: '21:9', refs: ['fat_greenling.png', 'northern_whiting.png', 'yellowtail_fish.png'],
    look: '도루묵을 옆에서 본 모습. 몸은 길쭉하고 옆으로 납작하며 비늘이 없어 매끈하다. 입이 크고 위로 비스듬히 열려 아래턱이 앞으로 나와 있고, 입술 가장자리에 작은 술이 있다. 눈이 크다. '
      + '등은 연한 황갈색 바탕에 짙은 갈색 물결무늬와 얼룩이 불규칙하게 흩어져 있고, 배는 은백색. 가슴지느러미가 크고 부채처럼 넓다. '
      + '등지느러미는 앞의 작은 가시 지느러미와 뒤의 길고 낮은 지느러미 둘, 뒷지느러미는 길다. 꼬리는 끝이 거의 반듯하다.',
  },
  black_scraper: {
    file: 'black_scraper.png', aspect: '16:9', refs: ['yellowtail_fish.png', 'dark-banded_rockfish.png', 'surf_perch.png'],
    look: '말쥐치를 옆에서 본 모습. 쥐치보다 길쭉한 타원형 몸, 옆으로 납작하고 가죽처럼 꺼끌꺼끌한 피부. 몸 색은 푸른빛이 도는 회색 · 회갈색에 흐린 짙은 얼룩. '
      + '주둥이는 뾰족하게 앞으로 나와 끝에 아주 작은 입이 있다. 눈 위에 굵고 단단한 가시 하나(첫 등지느러미)가 비스듬히 서 있다. '
      + '둘째 등지느러미와 뒷지느러미는 길고 낮으며 서로 마주 본다. 지느러미와 꼬리는 선명한 청록색 · 파란색이고, 꼬리 끝은 둥글다. '
      + '쥐치처럼 마름모꼴로 높지 않고, 노란 지느러미도 아니다.',
  },
};

const STYLE_INTRO = '첨부한 그림 세 장은 화풍 참고용입니다. 이 그림들과 같은 픽셀 아트 화풍으로 물고기 한 마리를 새로 그려 주세요. '
  + '같은 도트 크기, 진한 윤곽선, 밝은 하이라이트와 어두운 그늘의 단계, 사실적인 체색과 비늘 · 지느러미 줄기 표현을 맞춥니다. '
  + '참고 그림 속 물고기는 그리지 마세요.';
const taskText = (it) => `그릴 것: ${it.nameKo} (${it.nameEn}, ${it.sci}). ${it.look}\n`
  + '조건: 순백색 단색 배경. 물고기 한 마리만, 머리는 왼쪽 · 꼬리는 오른쪽. 화면 가운데에 크게, 지느러미 끝까지 잘리지 않게. '
  + '물 · 바닥 · 그림자 · 거품 · 글자 · 테두리 없음. 사진이 아니라 픽셀 아트.';

function parseArgs(argv) {
  const P = { out: '', only: null, model: 'gemini-nano-banana-2.1', jobs: 2, tries: 4, tag: '', force: false, dry: false, install: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--out') P.out = v();
    else if (a === '--only') P.only = new Set(v().split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--model') P.model = v();
    else if (a === '--jobs') P.jobs = Math.max(1, +v());
    else if (a === '--tries') P.tries = Math.max(1, +v());
    else if (a === '--tag') P.tag = v();
    else if (a === '--force') P.force = true;
    else if (a === '--dry') P.dry = true;
    else if (a === '--install') P.install = true;
  }
  if (!P.out) { console.error('--out <폴더>가 필요하다'); process.exit(1); }
  return P;
}

/** 대상 — LOOKS에 있는 어종 중 아직 원본이 없는 것(--only면 그것만) · 이름은 core 어종 DB에서 */
async function targets(P) {
  const core = await import(path.join(ROOT, 'packages/core/dist/index.js'));
  const out = [];
  for (const [id, L] of Object.entries(LOOKS)) {
    if (P.only && !P.only.has(id)) continue;
    if (!P.only && fs.existsSync(path.join(FISH_SRC, L.file))) continue;
    const f = core.FISH_DATABASE.find((x) => x.id === id);
    if (!f) { console.warn(`${id}: 어종 DB에 없다 — 건너뛴다`); continue; }
    out.push({ id, nameKo: f.nameKo, nameEn: f.nameEn, sci: f.scientificName, ...L });
  }
  return out;
}

/** 참고 그림 — 흰 바탕에 얹어(투명 → 흰색) 긴 변 512px PNG로 한 번만 만든다 */
function refPart(outDir, file) {
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, file);
  if (!fs.existsSync(dst)) execFileSync('convert', [path.join(FISH_SRC, file), '-background', 'white', '-alpha', 'remove', '-resize', '512x512>', `PNG24:${dst}`]);
  return { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateOne(it, P) {
  const refs = it.refs.map((f) => refPart(P.out, f));
  const body = {
    contents: [{ role: 'user', parts: [{ text: STYLE_INTRO }, ...refs, { text: taskText(it) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: it.aspect } },
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
    const name = P.tag ? `${it.id}.${P.tag}` : it.id;
    const tmp = path.join(os.tmpdir(), `gfa_${name}_${process.pid}`);
    fs.writeFileSync(tmp, Buffer.from(img.data, 'base64'));
    execFileSync('convert', [tmp, '-depth', '8', `PNG32:${path.join(P.out, `${name}.png`)}`]);
    fs.rmSync(tmp, { force: true });
    const u = j.usageMetadata ?? {};
    fs.appendFileSync(path.join(P.out, '_log.jsonl'), JSON.stringify({
      id: it.id, file: `${name}.png`, model: P.model, attempt, ms, mime: img.mimeType ?? img.mime_type,
      inTok: u.promptTokenCount, outTok: u.candidatesTokenCount, at: new Date().toISOString(),
    }) + '\n');
    return { ok: true, ms, attempt };
  }
  return { ok: false, err: last };
}

/**
 * 테두리 번짐 벗기기 — Gemini 응답은 JPEG라 진한 윤곽선 바깥에 1px 회색 띠와 계단 모서리의 흰 삼각형이 남는다(어두운 창에서 흰 테).
 * 투명과 (8방향으로) 닿은 무채색 픽셀 중 바로 안쪽 이웃보다 확연히 밝은 것만 걷어 윤곽선에서 멈춘다 · 떨어져 나간 부스러기(40px 미만)도 지운다.
 */
function peelFringe(d, w, h, iters = 3) {
  const Lof = (o) => 0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2];
  const satOf = (o) => { const mx = Math.max(d[o], d[o + 1], d[o + 2]), mn = Math.min(d[o], d[o + 1], d[o + 2]); return mx ? (mx - mn) / mx : 0; };
  let peeled = 0;
  for (let it = 0; it < iters; it++) {
    const rm = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (d[o + 3] === 0) continue;
      const L = Lof(o);
      if (L <= 70 || satOf(o) >= 0.3) continue;
      let touch = false, minL = 999;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) { touch = true; continue; }
        const q = (yy * w + xx) * 4;
        if (d[q + 3] === 0) touch = true; else minL = Math.min(minL, Lof(q));
      }
      if (touch && (minL === 999 || L > minL + 40)) rm.push(o);
    }
    for (const o of rm) d[o + 3] = 0;
    peeled += rm.length;
    if (!rm.length) break;
  }
  const seen = new Uint8Array(w * h);
  let crumbs = 0;
  for (let s0 = 0; s0 < w * h; s0++) {
    if (seen[s0] || d[s0 * 4 + 3] === 0) continue;
    const st = [s0]; seen[s0] = 1; const mem = [];
    while (st.length) {
      const i = st.pop(); mem.push(i);
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !seen[j] && d[j * 4 + 3] > 0) { seen[j] = 1; st.push(j); }
    }
    if (mem.length < 40) { for (const i of mem) d[i * 4 + 3] = 0; crumbs += mem.length; }
  }
  return { peeled, crumbs };
}

/**
 * 검수를 마친 `<out>/<id>.png` → 배경 벗기기(테두리 BFS · 갇힌 흰 섬 · 그림자 걷기는 끔 — 은빛 배 가장자리를 먹는다)
 * → 번짐 벗기기 → 타이트 크롭 + 투명 여백 2px → `food assets/fish/<파일>`. 이미 있으면 --force 없이 덮지 않는다.
 */
async function install(P) {
  const { DEFAULTS, decodeAny, cutout } = require('./pixelize_crops.cjs');
  const { encode } = require('./lib_png.cjs');
  fs.mkdirSync(FISH_SRC, { recursive: true });
  const PAD = 2;
  let n = 0;
  for (const [id, L] of Object.entries(LOOKS)) {
    if (P.only && !P.only.has(id)) continue;
    const src = path.join(P.out, `${id}.png`);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(FISH_SRC, L.file);
    if (fs.existsSync(dst) && !P.force) { console.log(`${L.file}: 이미 있어 건너뛴다(--force로 덮기)`); continue; }
    const img = await decodeAny(src);
    const w = img.w, h = img.h;
    const cut = cutout(img, { ...DEFAULTS, shadow: 0 });
    const d = Buffer.from(cut.data);
    const pf = peelFringe(d, w, h);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { console.error(`${id}: 전경이 없다`); continue; }
    const bw = x1 - x0 + 1 + PAD * 2, bh = y1 - y0 + 1 + PAD * 2;
    const out = Buffer.alloc(bw * bh * 4);
    for (let y = y0; y <= y1; y++) d.copy(out, ((y - y0 + PAD) * bw + PAD) * 4, (y * w + x0) * 4, (y * w + x1 + 1) * 4);
    for (let i = 0; i < bw * bh; i++) if (out[i * 4 + 3] === 0) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0;
    const bytes = encode(bw, bh, out, dst);
    console.log(`${id} → ${L.file}: ${w}x${h} → ${bw}x${bh} (${(bytes / 1024).toFixed(0)}KB) · ${cut.note} · 번짐 ${pf.peeled}px · 부스러기 ${pf.crumbs}px`);
    n++;
  }
  console.log(`food assets/fish에 ${n}장 → 이제 node tools/fish_cards.cjs`);
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  fs.mkdirSync(P.out, { recursive: true });
  if (P.install) { await install(P); return; }
  let list = await targets(P);
  list = list.filter((t) => P.force || !fs.existsSync(path.join(P.out, `${P.tag ? `${t.id}.${P.tag}` : t.id}.png`)));
  console.log(`대상 ${list.length}장 · 모델 ${P.model} · 동시 ${P.jobs}`);
  if (P.dry) { for (const t of list) console.log(`${t.id} [${t.aspect} · 참고 ${t.refs.join(', ')}]\n${STYLE_INTRO}\n${taskText(t)}\n`); return; }
  let next = 0, done = 0, fail = 0;
  const failed = [];
  const worker = async () => {
    while (next < list.length) {
      const it = list[next++];
      const r = await generateOne(it, P);
      if (r.ok) { done++; console.log(`[${done + fail}/${list.length}] ${it.id} — ${r.ms}ms${r.attempt > 1 ? ` (시도 ${r.attempt})` : ''}`); }
      else { fail++; failed.push(it.id); console.log(`[${done + fail}/${list.length}] ${it.id} — 실패: ${r.err}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(P.jobs, list.length) }, worker));
  console.log(`끝: 성공 ${done} · 실패 ${fail}${failed.length ? ` (${failed.join(', ')})` : ''}`);
}

module.exports = { LOOKS, STYLE_INTRO, taskText };
if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
