/**
 * @file gemini_face_art.cjs
 * @description 267차 — 인물 얼굴 초상(흉상)을 Gemini 그림 모델로 그린다(244 작물 · 249 장비 · 255 아이템과 같은 길).
 *
 *  사용자 지시: 「각 인물 별로 얼굴 이미지를 따로 따서 넣기 … gemini imaging … 정옥선 = 할머니 · 흰머리 장발 · 모자」
 *              「주인공 얼굴도 선택한 모델형(성별 · 머리 모양 · 머리색 · 피부 …)에 따라 디폴트값」.
 *
 *  대상 두 묶음:
 *    cast   — 이야기 인물 43명(core `castIds()`). 생김새는 `characterOf(id)`(성별 · 나이 · 역할 · 머리 · 피부 · 눈 · 모자 · 겉옷)에서
 *             자동 문장으로 만들고, `tools/face_looks.cjs`의 한 줄(그 인물만의 특징)을 덧붙인다. 참고 그림 = 같은 설정의 32×32 절차 초상(배색 · 머리 모양 앵커).
 *    player — 주인공 기본 얼굴 = 성별(2) × 머리 모양(8) = 16장 + 남성 수염판 8장. 머리색 · 피부 · 눈동자는 **기준색**으로 그리고
 *             게임이 생성 옵션에 맞춰 팔레트를 치환한다(`ui/FacePhoto.ts` recolor — 기준 = 밤색 머리 · 보통 피부 · 짙은 갈색 눈).
 *             얼굴형 · 입 모양은 치환하지 못한다(백로그).
 *
 *  키는 환경의 네트워크 시크릿을 에이전트 프록시가 붙인다(이 스크립트 · 저장소에는 키가 없다).
 *  ⚠ Node 내장 fetch는 HTTPS_PROXY를 읽지 않는다 — 반드시 `NODE_USE_ENV_PROXY=1`로 돌린다.
 *  ⚠ 결제가 비어 있으면 HTTP 402 「prepayment credits are depleted」 — AI Studio에서 충전한 뒤 다시 돌린다(267차 실측).
 *
 *  사용:
 *    node tools/gemini_face_art.cjs --list                                         # 대상 · 자동 문장 표
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_face_art.cjs --out <폴더> --dry         # 프롬프트 + 참고 그림만(요청 없음)
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_face_art.cjs --out <폴더> [--set cast|player|all] [--only okseon,baram]
 *        [--ref <화풍 · 밀도 앵커 png>[,png]] [--model gemini-nano-banana-2.1] [--jobs 3] [--tries 4] [--tag v2] [--force]
 *    node tools/gemini_face_art.cjs --out <폴더> --sheet <png>                     # 검수 시트(12장씩)
 *    node tools/gemini_face_art.cjs --out <폴더> --install [--only …] [--force]     # 배경 벗기기 → 정사각 → 96칸(셀 2px = 192px)
 *        → packages/client-pc/public/faces/<키>.png + src/data/FacePortraits.ts(자동 목록 — 부팅이 `face_<키>`로 싣는다)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CORE = path.join(ROOT, 'packages', 'core', 'dist', 'index.js');
const FACES_DIR = path.join(ROOT, 'packages', 'client-pc', 'public', 'faces');
const MANIFEST = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'FacePortraits.ts');
const WIKI_IMG = path.join(ROOT, 'tools', 'wiki_img');
const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const CELLS = 96;      // 긴 변 칸 수
const CELL = 2;        // 셀 px — 맵 기준 입자와 같다(192px 정사각)
const NOTES = require('./face_looks.cjs');

const HAIR_NAME = ['검은', '짙은 갈색', '밤색', '밝은 갈색', '금발', '붉은 갈색', '반백(회색)', '백발(흰)', '푸른빛 도는 검은', '보랏빛 도는'];
const SKIN_NAME = ['밝은 살구빛', '보통(살구빛)', '약간 그을린 황갈색', '볕에 탄 갈색', '짙은 갈색'];
const EYE_NAME = ['짙은 갈색', '갈색', '청회색', '초록빛', '보랏빛', '적갈색'];
const STYLE_NAME = { short: '짧은 머리', bob: '단발', pony: '포니테일(뒤로 묶은 머리)', long: '어깨 아래로 내려오는 긴 머리', buzz: '아주 짧게 깎은 머리', curly: '곱슬머리', braid: '땋은 머리', topknot: '상투처럼 위로 묶은 머리' };
const SHAPE_NAME = { oval: '계란형', round: '둥근', square: '각진' };
const MOUTH_NAME = { smile: '살짝 웃는 입', neutral: '다문 입', small: '작은 입', open: '살짝 벌린 입' };
const HAT_NAME = { none: '', cap: '야구 모자', beanie: '비니(털모자)', sun: '챙 넓은 밀짚모자', bandana: '두건', visor: '선바이저' };
const OUTER_NAME = { none: '', vest: '조끼', apron: '앞치마', jacket: '재킷' };
const SHIRT_NAME = { none: '', tee: '티셔츠', shirt: '셔츠', hoodie: '후드 티', knit: '니트' };
const AGE_NAME = { child: '열두 살 안팎의 아이', teen: '십대 중후반', young: '이십 대', mid: '삼사십 대', elder: '예순이 넘은 노인' };
const ROLE_NAME = { vendor: '어시장 좌판 상인', official: '수협 · 어촌계 관계자', captain: '낚시어선 선장', artisan: '장인', student: '학생', streamer: '낚시 방송인',
  office: '회사원', keeper: '등대 · 창고 지킴이', drifter: '떠돌이 낚시꾼', worker: '야간 관리인', camper: '캠핑카 여행자', crew: '어선 선원',
  musician: '연주자', cook: '요리 좋아하는 사람', writer: '작가', collector: '수집가', expert: '낚시 달인', angler: '낚시꾼' };
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

/** 기준색(주인공 판 — 게임이 이 색 둘레를 치환한다) */
const PLAYER_BASE = { hair: 2, skin: 1, eye: 0 };

async function loadCore() {
  if (!fs.existsSync(CORE)) throw new Error('core dist가 없다 — npx pnpm --filter @tra/core run build');
  return import(CORE);
}

/** 인물 한 명의 생김새 문장(자동) — core 설정 + face_looks 덧붙임 */
function describe(core, key, cfg, trait, npc, note) {
  const look = { ...cfg.look };
  const outfit = { ...cfg.outfit };
  if (note?.hair !== undefined) look.hair = note.hair;
  if (note?.hairStyle) look.hairStyle = note.hairStyle;
  if (note?.skin !== undefined) look.skin = note.skin;
  if (note?.hat) outfit.hat = note.hat;
  const ageM = /(\d+)세/.exec(npc?.roleKo ?? '');
  const age = ageM ? `${ageM[1]}세` : (AGE_NAME[trait?.age] ?? '이십 대');
  const sex = look.sex === 'f' ? '여성' : '남성';
  const parts = [];
  parts.push(`${age} ${sex}, ${ROLE_NAME[trait?.role] ?? '낚시꾼'}.`);
  parts.push(`${HAIR_NAME[look.hair] ?? '검은'} ${STYLE_NAME[look.hairStyle] ?? '짧은 머리'}(머리색 ${hex(core.HAIR_COLORS[look.hair] ?? core.HAIR_COLORS[0])}).`);
  parts.push(`${SKIN_NAME[look.skin] ?? SKIN_NAME[1]} 피부(${hex(core.SKIN_TONES[look.skin] ?? core.SKIN_TONES[1])}), ${EYE_NAME[look.eye] ?? '짙은 갈색'} 눈동자(${hex(core.EYE_COLORS[look.eye] ?? core.EYE_COLORS[0])}), ${SHAPE_NAME[look.faceShape] ?? '계란형'} 얼굴, ${MOUTH_NAME[look.mouth] ?? '다문 입'}.`);
  if (look.beard >= 0) parts.push(`${HAIR_NAME[look.beard] ?? '짙은 갈색'} 수염.`);
  else if (look.sex === 'm') parts.push('수염 없음.');
  if (look.blush && (trait?.age === 'child' || trait?.age === 'teen')) parts.push('앳된 볼.');
  const wear = [];
  if (outfit.hat && outfit.hat !== 'none') wear.push(`${HAT_NAME[outfit.hat]}(${hex(outfit.hatColor)})`);
  if (outfit.outer && outfit.outer !== 'none') wear.push(`${OUTER_NAME[outfit.outer]}(${hex(outfit.outerColor)})`);
  if (outfit.shirt && outfit.shirt !== 'none') wear.push(`${SHIRT_NAME[outfit.shirt]}(${hex(outfit.shirtColor)})`);
  if (wear.length) parts.push(`차림: ${wear.join(' · ')} — 어깨선까지만 보인다.`);
  if (note?.note) parts.push(note.note);
  return parts.join(' ');
}

/** 대상 표 — cast(43) + player(16 + 수염 8) */
async function buildTargets(set) {
  const core = await loadCore();
  const out = {};
  if (set === 'cast' || set === 'all') {
    for (const id of core.castIds()) {
      if (id === 'coop') continue;   // 「동명항 어촌계」는 단체다 — 얼굴이 없다
      const cfg = core.characterOf(id);
      const npc = core.getStoryNpc(id);
      out[id] = { key: id, kind: 'cast', nameKo: npc?.nameKo ?? id, nameEn: npc?.nameEn ?? id, cfg, text: describe(core, id, cfg, core.CAST_TRAITS[id], npc, NOTES[id]) };
    }
  }
  if (set === 'player' || set === 'all') {
    const npc = core.getStoryNpc('player');
    for (const sex of ['m', 'f']) {
      for (const style of core.HAIR_STYLES) {
        for (const beard of sex === 'm' ? [false, true] : [false]) {
          const key = `player_${sex}_${style}${beard ? '_beard' : ''}`;
          const look = { ...core.defaultAppearance(sex), hairStyle: style, hair: PLAYER_BASE.hair, skin: PLAYER_BASE.skin, eye: PLAYER_BASE.eye, faceShape: 'oval', mouth: 'neutral', blush: false, beard: beard ? PLAYER_BASE.hair : -1 };
          const cfg = { look, outfit: { ...core.bareOutfit(), shirt: 'tee', shirtColor: 0x3d5a80 } };
          const trait = { sex, age: 'young', role: 'angler' };
          out[key] = { key, kind: 'player', nameKo: `주인공 ${sex === 'm' ? '남' : '여'} · ${STYLE_NAME[style]}${beard ? ' · 수염' : ''}`, nameEn: key, cfg,
            text: describe(core, key, cfg, trait, npc, NOTES.player)
              + ' 머리카락 · 피부 · 눈동자는 각각 **한 가지 기준색과 그 밝은 · 어두운 단계(3단)만** 쓴다 — 게임이 그 색을 통째로 바꿔 입힌다. 모자 · 안경 · 장신구 없음.' };
        }
      }
    }
  }
  return { core, targets: out };
}

const STYLE_INTRO = '픽셀 아트 **인물 초상(흉상)** 한 장을 그려 주세요. 머리 꼭대기부터 어깨선까지, 정면에서 아주 살짝 비스듬히 본 얼굴, 얼굴이 화면의 60% 이상을 차지하게 크게. '
  + '화풍: 레트로 어드벤처 게임의 대화창 초상 — 또렷한 도트, 얼굴 · 머리 · 옷 둘레를 감싸는 진한 윤곽선, 평평한 면과 3단 음영(밝음 · 기본 · 그늘), 색은 적게(12~20색). '
  + '도트 밀도: 화면 한 변이 약 128칸(한 칸 = 8px)인 **세밀한 도트**입니다 — 32칸짜리 굵은 도트로 그리지 마세요. 눈동자 · 콧날 · 입술 · 머리카락 결이 칸 몇 개로 그려질 만큼 촘촘하게. '
  + '사실적 비례의 얼굴(눈 · 코 · 입 · 귀가 분명하고 호감 가는 인상 — 추하거나 기괴하지 않게). 사진 · 3D · 수채 · 부드러운 번짐 금지.';
const ANCHOR_TEXT = '바로 위 그림(있다면)은 **화풍 · 도트 밀도 참고**입니다 — 그 사람을 그리지 말고 밀도와 음영 방식만 따르세요. '
  + '아래 작은 도트 그림은 그릴 인물의 **배색 · 머리 모양 · 모자 앵커**입니다 — 같은 사람을 훨씬 자세하고 보기 좋게 다시 그리되 배색은 따르세요. 그 작은 그림을 그대로 키우지는 마세요.';

const taskText = (it) => `그릴 사람: ${it.nameKo} (${it.nameEn}). ${it.text}\n`
  + '조건: 순백색 단색 배경(그림자 · 무늬 없음). 인물 하나만, 머리 끝과 어깨선이 잘리지 않게. 글자 · 숫자 · 로고 · 테두리 · 말풍선 없음. 정사각 1:1.';

/** 참고 그림 — 같은 설정의 32×32 절차 초상을 8배로(배색 · 머리 모양 앵커) */
function procRefPart(core, outDir, key, cfg) {
  const { encode } = require('./lib_png.cjs');
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, `${key}.png`);
  if (!fs.existsSync(dst)) {
    const art = core.renderFacePortrait(cfg);
    const S = 8, W = art.w * S, H = art.h * S;
    const buf = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const si = ((y / S | 0) * art.w + (x / S | 0)) * 4, di = (y * W + x) * 4;
      const a = art.rgba[si + 3];
      // 투명은 흰 배경으로(모델이 배경을 그리지 않게)
      buf[di] = a ? art.rgba[si] : 255; buf[di + 1] = a ? art.rgba[si + 1] : 255; buf[di + 2] = a ? art.rgba[si + 2] : 255; buf[di + 3] = 255;
    }
    encode(W, H, buf, dst);
  }
  return { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } };
}

/**
 * 화풍 · 도트 밀도 앵커 — `--ref` 파일(최대 2장 · 512px로 줄여 보냄)이 있으면 그것, 없으면 이미 설치한 얼굴 두 장.
 * 267차 시범: 앵커 없이는 한 장은 128칸급 세밀 도트, 다른 장은 32칸급 굵은 도트로 밀도가 제각각이었다 — 앵커 한 장이 밀도를 고정한다.
 */
function styleRefParts(outDir, refs, exclude) {
  const files = refs.length ? refs.slice(0, 2)
    : fs.existsSync(FACES_DIR) ? fs.readdirSync(FACES_DIR).filter((f) => f.endsWith('.png') && f !== `${exclude}.png`).sort().slice(0, 2).map((f) => path.join(FACES_DIR, f)) : [];
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  return files.map((f) => {
    const dst = path.join(dir, `style_${path.basename(f)}`);
    if (!fs.existsSync(dst)) execFileSync('convert', [f, '-background', 'white', '-alpha', 'remove', '-resize', '512x512>', `PNG24:${dst}`]);
    return { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } };
  });
}

function parseArgs(argv) {
  const P = { out: '', only: null, set: 'all', model: 'gemini-nano-banana-2.1', jobs: 3, tries: 4, tag: '', force: false, dry: false, install: false, list: false, sheet: '', refs: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--out') P.out = path.resolve(next());
    else if (a === '--only') P.only = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--set') P.set = next();
    else if (a === '--model') P.model = next();
    else if (a === '--jobs') P.jobs = Math.max(1, +next());
    else if (a === '--tries') P.tries = Math.max(1, +next());
    else if (a === '--tag') P.tag = next();
    else if (a === '--force') P.force = true;
    else if (a === '--dry') P.dry = true;
    else if (a === '--install') P.install = true;
    else if (a === '--list') P.list = true;
    else if (a === '--sheet') P.sheet = path.resolve(next());
    else if (a === '--ref') P.refs.push(...next().split(',').map((f) => path.resolve(f.trim())).filter(Boolean));
    else throw new Error(`모르는 인자: ${a}`);
  }
  return P;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const outName = (key, tag) => `${key}${tag ? `.${tag}` : ''}`;

async function generateOne(core, key, it, P) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: STYLE_INTRO }, ...styleRefParts(P.out, P.refs, key), { text: ANCHOR_TEXT }, procRefPart(core, P.out, key, it.cfg), { text: taskText(it) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
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
      if (res.status === 402) throw new Error(`${last} — 결제가 비었다(AI Studio 충전 뒤 다시)`);
      await sleep((res.status === 429 ? 20000 : 6000) * attempt);
      continue;
    }
    const parts = j.candidates?.[0]?.content?.parts ?? [];
    const img = parts.map((p) => p.inlineData ?? p.inline_data).find((d) => d?.data);
    if (!img) { last = `그림 없음 finish=${j.candidates?.[0]?.finishReason ?? '?'}`; await sleep(3000); continue; }
    const name = outName(key, P.tag);
    const tmp = path.join(os.tmpdir(), `gfa_${name}_${process.pid}`);
    fs.writeFileSync(tmp, Buffer.from(img.data, 'base64'));
    execFileSync('convert', [tmp, '-depth', '8', `PNG32:${path.join(P.out, `${name}.png`)}`]);
    fs.rmSync(tmp, { force: true });
    const u = j.usageMetadata ?? {};
    fs.appendFileSync(path.join(P.out, '_log.jsonl'), JSON.stringify({ key, file: `${name}.png`, model: P.model, attempt, ms, inTok: u.promptTokenCount, outTok: u.candidatesTokenCount, at: new Date().toISOString() }) + '\n');
    return { ok: true, ms, attempt };
  }
  return { ok: false, err: last };
}

function sheet(P, targets, list) {
  const files = list.map((k) => path.join(P.out, `${outName(k, P.tag)}.png`)).filter((f) => fs.existsSync(f));
  if (!files.length) { console.log('시트에 넣을 그림이 없다'); return; }
  const base = P.sheet.replace(/\.png$/, '');
  for (let i = 0; i < files.length; i += 12) {
    const chunk = files.slice(i, i + 12);
    const args = [];
    for (const f of chunk) { const key = path.basename(f, '.png').replace(/\.[^.]+$/, ''); args.push('-label', `${key}\n${targets[key]?.nameKo ?? ''}`, f); }
    const dst = `${base}_${String(i / 12 + 1).padStart(2, '0')}.png`;
    execFileSync('montage', [...args, '-font', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '-pointsize', '13', '-tile', '4x', '-geometry', '260x260+6+6', '-background', '#e8e4da', dst]);
    console.log(`시트 → ${dst}`);
  }
}

/** 목록 파일 — public/faces/*.png 전부(손으로 고치지 않는다) */
function writeManifest() {
  const keys = fs.existsSync(FACES_DIR) ? fs.readdirSync(FACES_DIR).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')).sort() : [];
  const lines = [
    '/**',
    ' * @file FacePortraits.ts',
    ' * @description 267차 — 사진(Gemini) 얼굴 초상이 있는 키 목록(자동 생성 — `node tools/gemini_face_art.cjs --install`).',
    ' *  BootScene이 `faces/<키>.png`(192×192 · 셀 2px)를 `face_<키>`로 싣고, `ui/FacePhoto.ts`가 대화창 · 혼잣말 · 일지 초상에 먼저 쓴다.',
    ' *  키 = 인물 id(okseon …) 또는 주인공 기본 얼굴 `player_<m|f>_<머리 모양>[_beard]`(머리색 · 피부 · 눈동자는 게임이 치환).',
    ' *  목록에 없으면 32×32 절차 초상(`ensureFacePortrait`) 그대로. 손으로 고치지 말 것.',
    ' */',
    'export const FACE_PORTRAITS: readonly string[] = [',
    ...keys.map((k) => `  '${k}',`),
    '];',
    '',
  ];
  fs.writeFileSync(MANIFEST, lines.join('\n'));
  console.log(`${path.relative(ROOT, MANIFEST)}: ${keys.length}키`);
}

/** 검수를 마친 `<out>/<키>.png` → 배경 벗기기 → 번짐 벗기기 → 정사각(여백) → 96칸(셀 2px) → public/faces/<키>.png */
async function install(P, targets, list) {
  const { DEFAULTS, decodeAny } = require('./pixelize_crops.cjs');
  const { peelFringe, regrid } = require('./gemini_fish_art.cjs');
  const { cutoutMulti } = require('./gemini_tackle_art.cjs');
  const { encode } = require('./lib_png.cjs');
  fs.mkdirSync(FACES_DIR, { recursive: true });
  let n = 0;
  for (const key of list) {
    const src = path.join(P.out, `${key}.png`);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(FACES_DIR, `${key}.png`);
    if (fs.existsSync(dst) && !P.force) { console.log(`${path.relative(ROOT, dst)}: 이미 있어 건너뛴다(--force로 덮기)`); continue; }
    const img = await decodeAny(src);
    const { w, h } = img;
    const cut = cutoutMulti(img, DEFAULTS.tol, false, false);
    const d = cut.data;
    const pf = peelFringe(d, w, h);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { console.error(`${key}: 전경이 없다`); continue; }
    // 정사각 — 긴 변 기준, 가로는 가운데 · 세로는 머리 위 여백을 조금만
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, side = Math.max(bw, bh);
    const sq = Buffer.alloc(side * side * 4);
    const ox = Math.floor((side - bw) / 2), oy = side - bh;   // 어깨선이 아래 끝에 닿게
    for (let y = 0; y < bh; y++) d.copy(sq, ((y + oy) * side + ox) * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4);
    for (let i = 0; i < side * side; i++) if (sq[i * 4 + 3] === 0) sq[i * 4] = sq[i * 4 + 1] = sq[i * 4 + 2] = 0;
    const g = regrid(sq, side, side, CELLS, CELL);
    const bytes = encode(g.w, g.h, g.data, dst);
    // 268차 — 인물 얼굴은 위키 그림 폴더에도 둔다(지도 핀 상세 · 조행록 의뢰인 칸 — 생성기가 `face_<id>.png`를 찾는다). 주인공 판은 위키에 없다
    if (targets[key].kind === 'cast') { fs.mkdirSync(WIKI_IMG, { recursive: true }); fs.copyFileSync(dst, path.join(WIKI_IMG, `face_${key}.png`)); }
    console.log(`${key} → ${path.relative(ROOT, dst)}: ${w}x${h} → ${g.w}x${g.h} (${(bytes / 1024).toFixed(0)}KB) · ${cut.note} · 번짐 ${pf.peeled}px`);
    n++;
  }
  writeManifest();
  console.log(`${n}장 설치`);
}

(async () => {
  const P = parseArgs(process.argv.slice(2));
  const { core, targets } = await buildTargets(P.set);
  let list = Object.keys(targets);
  if (P.only) {
    const miss = P.only.filter((k) => !targets[k]);
    if (miss.length) throw new Error(`모르는 키: ${miss.join(', ')}`);
    list = P.only;
  }
  if (P.list) {
    for (const k of list) console.log(`${k.padEnd(24)} ${targets[k].nameKo} — ${targets[k].text}`);
    console.log(`\n${list.length}장 (cast ${list.filter((k) => targets[k].kind === 'cast').length} · player ${list.filter((k) => targets[k].kind === 'player').length})`);
    return;
  }
  if (!P.out) throw new Error('--out <폴더>');
  fs.mkdirSync(P.out, { recursive: true });
  if (P.sheet) { sheet(P, targets, list); return; }
  if (P.install) { await install(P, targets, list); return; }
  if (P.dry) {
    for (const k of list) {
      procRefPart(core, P.out, k, targets[k].cfg); styleRefParts(P.out, P.refs, k);
      console.log(`\n=== ${k} (${targets[k].nameKo}) ===\n${taskText(targets[k])}`);
    }
    console.log(`\n[dry] ${list.length}장 — 참고 그림 ${path.join(P.out, '_refs')} · 요청은 보내지 않았다`);
    return;
  }
  const todo = list.filter((k) => P.force || !fs.existsSync(path.join(P.out, `${outName(k, P.tag)}.png`)));
  console.log(`${todo.length}장 생성(건너뜀 ${list.length - todo.length}) · 모델 ${P.model} · 동시 ${P.jobs}`);
  let i = 0, ok = 0, fail = 0;
  const worker = async () => {
    while (i < todo.length) {
      const k = todo[i++];
      const r = await generateOne(core, k, targets[k], P);
      if (r.ok) { ok++; console.log(`${k}: ok ${(r.ms / 1000).toFixed(1)}s(시도 ${r.attempt})`); }
      else { fail++; console.log(`${k}: 실패 — ${r.err}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(P.jobs, todo.length) }, worker));
  console.log(`끝: 성공 ${ok} · 실패 ${fail} → 검수 시트: --sheet <png> · 설치: --install`);
})().catch((e) => { console.error(e.message ?? e); process.exit(1); });
