/**
 * @file gemini_fillet_art.cjs
 * @description 316차 — **어종별 필렛 그림**(Gemini). 배를 가른 뒤 도마 · 가방 · 회썰기에 나오는 필렛 그림 세 가지를 어종마다 그린다.
 *
 *  사용자 지시(2026-11-11): 「어종별 필렛 그림 Gemini로 전부 진행해줘」(315 시범 — 농어 · 우럭 · 참돔 · 고등어 4장 뒤).
 *  그전에는 어종군 공용 그림(잿방어 로인 · 감성돔 필렛 · 공용 갈빗대 사진)에 어종 색을 약하게 입혀 썼다.
 *
 *  그림 세 가지(어종마다):
 *    pure  — 순수 필렛(껍질 · 뼈 없는 살코기) · 살 면 위 · **꼬리 왼쪽 · 머리 오른쪽**(박피 「꼬리(왼쪽)」 · 회썰기 탑뷰 규칙)
 *            화풍 참고 = 잿방어 순수 필렛(315 시범과 같은 식) + 그 어종 온마리
 *    skin  — 껍질이 붙어 있는 필렛 = **pure 그림을 고쳐서**(모양 · 자리 그대로 · 윤곽 둘레에 그 어종 껍질 띠) — 박피 도마 · 가방 아이콘
 *    ribs  — 갈빗대가 붙은 필렛 = **공용 갈빗대 사진의 구도**(머리 왼쪽 · 뱃살 날개 왼쪽 아래) + pure의 화풍 · 살색 — 갈빗대 제거 도마 · 가방 아이콘
 *  모양이 어긋나면(skin ↔ pure · ribs ↔ 구도 참고의 실루엣 IoU가 낮으면) 다시 뽑는다 — 유도선이 그림을 벗어나지 않게.
 *
 *  키는 환경의 네트워크 시크릿이 붙인다(호스트 generativelanguage.googleapis.com · 헤더 x-goog-api-key).
 *  ⚠ Node 내장 fetch는 프록시를 안 탄다 — 반드시 `NODE_USE_ENV_PROXY=1`.
 *
 *  사용:
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_fillet_art.cjs --out <폴더> [--only sea_bass,red_seabream] [--kinds pure,skin,ribs] [--jobs 4] [--force] [--dry]
 *      → <폴더>/<id>_<kind>.png(PNG32) + _log.jsonl(시도 · IoU · 토큰)
 *    node tools/gemini_fillet_art.cjs --out <폴더> --sheet <sheet.png>   검수 시트(어종마다 한 줄: 순수 · 껍질 · 갈빗대)
 *    node tools/gemini_fillet_art.cjs --out <폴더> --install [--force]    배경 벗기기 · 방향 맞추기 · 격자 정규화(긴 변 192칸 × 4px)
 *      → `food assets/trimmings/species/<id>_<kind>.png`
 *    node tools/gemini_fillet_art.cjs --bake
 *      → client `src/data/PixelFilletSpecies.ts`(도마 스프라이트 — 긴 변 128칸 · 팔레트 ≤ 48) — 게임은 이것만 싣는다
 *    그다음 `node tools/gen_sashimi_fillet.cjs`가 어종 회썰기 탑뷰 · 측면 · 한 점을 굽는다(`public/sashimi/sp/`).
 *    node tools/gemini_fillet_art.cjs --wiki-sheets
 *      → 위키 「어종 손질」 탭 어종별 필렛 그림 시트(`tools/wiki_img/butchery/fillets_<갈래>.webp` — 한 줄 = 어종 하나: 순수 · 껍질 · 갈빗대)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FISH_SRC = path.join(ROOT, 'food assets', 'fish');
const TRIM = path.join(ROOT, 'food assets', 'trimmings');
const DEST = path.join(TRIM, 'species');
const OUT_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'PixelFilletSpecies.ts');
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

const STYLE_REF = path.join(TRIM, 'amberjack', 'pure_pillet_amberjack.png');   // 315 시범과 같은 화풍 참고
const RIBS_REF = path.join(TRIM, 'skinned_pillet_with_ribs.png');             // 갈빗대 필렛 구도 참고(도마 갈빗대 유도선을 잰 그림)

/**
 * 어종 → 온마리 원본 · 살 · 껍질 · 모양.
 *  keep = 원래 어종군 그림이 바로 그 어종이라 순수 · 껍질 그림은 원본을 쓴다(잿방어 로인 · 감성돔 필렛) — 갈빗대만 그린다.
 *  alias = 같은 생물종(참돔 야간 = 참돔) — 그리지 않고 게임이 그 어종 그림을 쓴다.
 */
const SPECIES = {
  // ── 돔류 흐름 ──
  black_seabream: { fish: 'black_sea_bream.png', ko: '감성돔', keep: path.join(TRIM, 'bream', 'pure_pillet_bream.png'), keepSkin: path.join(TRIM, 'bream', 'skinned_pillet_bream.png'),
    flesh: '감성돔 살은 맑고 투명한 흰 살이다. 근육결이 가는 흰 줄로 겹치고 혈합육은 가늘고 옅은 붉은색이다.',
    skin: '은회색 · 검은 회색(등 쪽이 짙다)에 비늘 결이 보인다', shape: '몸이 높은 돔이라 필렛도 폭이 넓은 편' },
  red_seabream: { fish: 'red_sea_bream.png', ko: '참돔',
    flesh: '참돔 살은 맑은 흰 살에 옅은 분홍빛이 돈다. 껍질을 벗긴 쪽 가장자리를 따라 붉은 기가 얇게 남고, 근육결이 선명한 흰 줄로 보인다. 혈합육은 가늘고 옅은 붉은색.',
    skin: '선명한 분홍 · 주홍빛 붉은색에 작은 푸른 점', shape: '몸이 높은 돔이라 필렛도 폭이 넓은 편' },
  night_seabream: { alias: 'red_seabream' },
  largescale_blackfish: { fish: 'large_scale_blackfish.png', ko: '벵에돔',
    flesh: '벵에돔 살은 살짝 회색빛이 도는 흰 살이다. 가운데를 따라 짙은 붉은 갈색 혈합육 띠가 또렷하고, 근육결은 가는 흰 줄이다.',
    skin: '짙은 청흑색 · 올리브빛 흑갈색', shape: '타원형 몸이라 필렛도 통통한 편' },
  longtail_blackfish: { fish: 'small_scale_blackfish.png', ko: '긴꼬리벵에돔',
    flesh: '긴꼬리벵에돔 살은 살짝 회색빛이 도는 흰 살이다. 가운데를 따라 짙은 붉은 갈색 혈합육 띠가 또렷하다.',
    skin: '푸른빛이 도는 짙은 흑색', shape: '타원형 몸이라 필렛도 통통한 편' },
  stone_beakperch: { fish: 'barred_knifejaw_female.png', ko: '돌돔',
    flesh: '돌돔 살은 단단하고 투명한 흰 살이다. 근육결이 굵고 또렷한 흰 줄로 보이고 혈합육은 옅은 분홍빛으로 가늘다.',
    skin: '회백색 바탕에 굵은 검은 세로 줄무늬', shape: '몸이 높은 돔이라 필렛도 폭이 넓은 편' },
  spotted_knifejaw: { fish: 'spotted_knifejaw.png', ko: '강담돔',
    flesh: '강담돔 살은 단단하고 투명한 흰 살이다. 근육결이 굵은 흰 줄이고 혈합육은 옅은 분홍빛이다.',
    skin: '회백색 바탕에 촘촘한 검은 반점', shape: '몸이 높은 돔이라 필렛도 폭이 넓은 편' },
  surfperch: { fish: 'surf_perch.png', ko: '망상어',
    flesh: '망상어 살은 부드러운 흰 살에 옅은 분홍빛이 돌고, 혈합육은 가늘고 옅다.',
    skin: '은회색 · 청회색', shape: '몸이 높고 납작해 필렛이 넓적하다' },
  rainbow_wrasse: { fish: 'multicolorfin_rainbowfish_female.png', ko: '용치놀래기',
    flesh: '용치놀래기 살은 부드럽고 살짝 투명한 흰 살이다. 혈합육은 거의 보이지 않는다.',
    skin: '붉은 갈색 · 주황빛 바탕에 노르스름한 세로 줄', shape: '가늘고 긴 몸이라 필렛도 길쭉하다' },
  // ── 방어류 흐름 ──
  yellowtail: { fish: 'yellowtail_fish.png', ko: '방어',
    flesh: '방어 살은 분홍빛이 도는 연한 붉은 살로 기름져 윤기가 돈다. 가운데를 따라 짙은 붉은 혈합육 띠가 넓게 지난다.',
    skin: '등은 청록색, 배는 은백색, 가운데에 노란 세로줄', shape: '방추형 큰 몸이라 필렛이 두툼하고 길다' },
  amberjack: { fish: 'yellowtail_amberjack.png', ko: '부시리',
    flesh: '부시리 살은 방어보다 밝고 맑은 연분홍 살이다. 가운데를 따라 붉은 혈합육 띠가 지난다.',
    skin: '등은 청록색, 배는 은백색, 노란 세로줄', shape: '방추형 큰 몸이라 필렛이 두툼하고 길다' },
  greater_amberjack: { fish: 'greater_amberjack.png', ko: '잿방어', keep: path.join(TRIM, 'amberjack', 'pure_pillet_amberjack.png'), keepSkin: path.join(TRIM, 'amberjack', 'skinned_pillet_amberjack.png'),
    flesh: '잿방어 살은 연분홍 · 살구빛 살이고 혈합육은 진홍색이다.',
    skin: '갈색 · 보랏빛 회색', shape: '높고 두툼한 방추형' },
  chub_mackerel: { fish: 'mackerel.png', ko: '고등어',
    flesh: '고등어 살은 붉은 갈색 · 분홍빛 갈색의 기름진 살이다. 등 쪽이 더 짙고, 가운데를 따라 짙은 적갈색 혈합육 띠가 길게 지나며, 배 쪽은 조금 밝은 회분홍이다. 기름져 윤기가 돈다.',
    skin: '청록색 바탕에 검은 물결무늬, 배 쪽은 은백색', shape: '방추형이라 필렛이 길쭉하다' },
  horse_mackerel: { fish: 'jack_mackerel.png', ko: '전갱이',
    flesh: '전갱이 살은 분홍빛이 도는 연한 붉은 살 · 회갈색 살이고, 가운데를 따라 진한 붉은 혈합육 띠가 지난다.',
    skin: '은빛에 등은 청록색, 옆줄을 따라 단단한 모비늘 줄', shape: '방추형이라 필렛이 길쭉하다' },
  spanish_mackerel: { fish: 'spanish_mackerel.png', ko: '삼치',
    flesh: '삼치 살은 희고 부드러운 연분홍 · 흰 살이다. 혈합육은 옅은 회갈색 · 분홍빛으로 가늘다.',
    skin: '은회색 바탕에 회청색 점이 줄지어 있다', shape: '가늘고 긴 몸이라 필렛이 아주 길다' },
  sea_bass: { fish: 'sea_bass.png', ko: '농어',
    flesh: '농어 살은 반투명한 흰 살이다. 근육결은 가는 흰 줄로 비스듬히 겹치고, 등 쪽 가운데를 따라 옅은 분홍빛 혈합육이 가늘게 지난다. 붉은 살이 아니다.',
    skin: '은회색, 등은 회청색에 작은 검은 점', shape: '길쭉한 몸이라 필렛도 길쭉하다' },
  black_rockfish: { fish: 'black_rockfish.png', ko: '우럭(조피볼락)',
    flesh: '우럭 살은 단단하고 하얀 흰살이다. 근육결이 굵고 또렷한 흰 줄로 보이고, 혈합육은 거의 없어 가운데에 아주 옅은 분홍 기만 있다. 가장자리는 살짝 투명하다.',
    skin: '짙은 회갈색 · 흑갈색 얼룩', shape: '머리가 큰 볼락류라 필렛은 통통하고 짧은 편' },
  blue_rockfish: { fish: 'dark-banded_rockfish.png', ko: '청볼락',
    flesh: '청볼락 살은 하얀 흰살이다. 근육결이 또렷한 흰 줄이고 혈합육은 아주 옅다.',
    skin: '짙은 청회색 · 검푸른색', shape: '볼락류라 필렛은 통통하고 짧은 편' },
  golden_rockfish: { fish: 'owstons_rockfish.png', ko: '황볼락',
    flesh: '황볼락 살은 하얀 흰살이다. 근육결이 또렷한 흰 줄이고 혈합육은 아주 옅다.',
    skin: '황갈색 · 노란빛이 도는 갈색', shape: '볼락류라 필렛은 통통하고 짧은 편' },
  red_snapper_rockfish: { fish: 'red_snapper_rockfish.png', ko: '열기(불볼락)',
    flesh: '열기 살은 분홍빛이 살짝 도는 흰 살이다. 근육결이 가는 흰 줄이고 혈합육은 옅은 분홍이다.',
    skin: '선명한 붉은색 · 주황빛', shape: '볼락류라 필렛은 통통하고 짧은 편' },
  striped_mullet: { fish: 'flathead_grey_mullet.png', ko: '숭어',
    flesh: '숭어 살은 연분홍빛 흰 살이다. 가운데를 따라 붉은 혈합육 띠가 뚜렷하고, 배 쪽 가장자리에 하얀 지방층이 있다.',
    skin: '은회색 바탕에 가는 회색 세로줄', shape: '원통형 몸이라 필렛이 길쭉하다' },
  redlip_mullet: { fish: 'so-iuy_mullet.png', ko: '가숭어(참숭어)',
    flesh: '가숭어 살은 연분홍빛 흰 살이다. 가운데를 따라 붉은 혈합육 띠가 뚜렷하고, 배 쪽 가장자리에 하얀 지방층이 있다.',
    skin: '은회색, 등은 회갈색', shape: '원통형 몸이라 필렛이 길쭉하다' },
  // ── 작은 생선 ──
  pacific_saury: { fish: 'saury.png', ko: '꽁치', small: true,
    flesh: '꽁치 살은 붉은빛이 도는 회분홍 살로 기름져 윤기가 돈다. 가운데를 따라 짙은 적갈색 혈합육 띠가 지난다.',
    skin: '등은 짙은 청남색, 배는 은백색', shape: '아주 가늘고 긴 몸이라 필렛도 가늘고 길다(길이가 폭의 약 5배)' },
  halfbeak: { fish: 'halfbeak.png', ko: '학꽁치', small: true,
    flesh: '학꽁치 살은 맑고 투명한 흰 살이다. 혈합육은 거의 없다.',
    skin: '은빛, 옆구리에 은색 띠, 등은 청록색', shape: '아주 가늘고 긴 몸이라 필렛도 가늘고 길다(길이가 폭의 약 5배)' },
  round_herring: { fish: 'round_herring.png', ko: '눈퉁멸', small: true,
    flesh: '눈퉁멸 살은 붉은빛이 도는 회분홍 살로 기름지다. 가운데를 따라 짙은 혈합육 띠가 지난다.',
    skin: '등은 청록 · 남색, 배는 은백색', shape: '가늘고 긴 몸이라 필렛도 길쭉하다(길이가 폭의 약 4배)' },
  northern_whiting: { fish: 'northern_whiting.png', ko: '보리멸', small: true,
    flesh: '보리멸 살은 맑고 하얀 흰 살이다. 혈합육은 거의 없다.',
    skin: '연한 황갈색 · 은빛', shape: '가늘고 긴 몸이라 필렛도 길쭉하다(길이가 폭의 약 4배)' },
  yellowfin_goby: { fish: 'yellowfin_goby.png', ko: '문절망둑', small: true,
    flesh: '문절망둑 살은 살짝 투명한 흰 살이다. 혈합육은 거의 없다.',
    skin: '연갈색 · 황갈색 바탕에 갈색 얼룩', shape: '머리가 크고 몸이 원통형이라 필렛은 길쭉하고 꼬리 쪽이 가늘다(길이가 폭의 약 4배)' },
};

const KINDS = ['pure', 'skin', 'ribs'];
const WIKI_DIR = path.join(ROOT, 'tools', 'wiki_img', 'butchery');

// ── 프롬프트 ──
const pureIntro = '첫째 그림은 낚시 게임 손질 화면의 「순수 필렛」 그림이다 — 생선 반쪽에서 껍질과 뼈를 다 발라낸 살코기 한 덩이를, 살 면이 위로 오게 도마 위에서 내려다본 고해상도 픽셀 아트. '
  + '둘째 그림은 손질할 어종의 온마리 그림(어종을 알아보는 참고)이다.';
const pureTask = (t) => `둘째 그림의 어종 ${t.ko}의 순수 필렛을 첫째 그림과 같은 화풍(진한 윤곽선 도트 · 고해상도 픽셀 아트)으로 그려라. `
  + '꼬리 쪽이 왼쪽(가늘다) · 머리 쪽이 오른쪽(두껍고 비스듬히 잘린 면), 윗변이 등 쪽 · 아랫변이 배 쪽. 살 면이 보이게 위에서 내려다본 한 덩이만, 그림 가로 폭의 대부분을 채운다. '
  + `${t.flesh} 필렛 모양은 그 어종 몸 비율을 따른다(${t.shape}). `
  + '껍질 · 뼈 · 머리 · 도마 · 접시 · 그림자 · 글자 없음. 배경은 단색 흰색.';
const skinIntro = '첫째 그림은 낚시 게임 손질 화면의 「순수 필렛」(껍질을 벗긴 살코기) 픽셀 아트다. 둘째 그림은 그 어종의 온마리 그림이다.';
const skinTask = (t) => '첫째 그림을 고쳐 「껍질이 아직 붙어 있는 필렛」으로 만들어라. 필렛의 모양 · 크기 · 위치 · 방향 · 살 무늬 · 화풍은 첫째 그림과 똑같이 둔다. '
  + '살 면이 위를 보고 껍질은 도마에 닿은 아래쪽에 붙어 있어서, 필렛 윤곽 둘레(특히 아랫변 배 쪽과 윗변 등 쪽)를 따라 껍질이 얇은 띠처럼 비어져 나와 보인다. '
  + `껍질 띠의 색과 무늬는 둘째 그림 ${t.ko}의 몸 색을 따른다: ${t.skin}. 살 위를 껍질로 덮지 않는다. 뼈 · 도마 · 그림자 · 글자 없음. 배경은 단색 흰색.`;
const ribsIntro = '첫째 그림은 「갈빗대가 붙은 필렛」의 구도 참고다 — 머리 쪽이 왼쪽, 왼쪽 아래로 갈빗대가 박힌 얇은 뱃살 날개가 처져 있고, 가운데를 따라 척추 자리 줄이 지나며, 꼬리가 오른쪽으로 가늘어진다. '
  + '둘째 그림은 같은 어종의 순수 필렛(화풍 · 살색 참고), 셋째 그림은 그 어종의 온마리 그림이다.';
const ribsTask = (t) => `셋째 그림의 어종 ${t.ko}을 세장뜨기 해서 막 떠낸, 갈빗대가 아직 붙어 있는 필렛을 그려라. `
  // 작은 생선도 구도 참고와 같은 모양으로 — 「가늘고 길게」를 주면 뱃살 날개 · 갈빗대가 사라졌다(316 눈퉁멸 · 보리멸 1차)
  + '첫째 그림과 같은 모양 · 같은 방향 · 같은 크기 비율 · 같은 자리(뱃살 날개와 갈빗대가 왼쪽 아래)로 그린다. 갈빗대가 또렷하게 보여야 한다. '
  + `살 면이 위를 본다. 살색 · 근육결 · 혈합육은 둘째 그림과 같게(${t.flesh}). 갈빗대는 뱃살 날개 안에 가는 흰 뼈가 비스듬히 늘어선 모습이고, 척추 자리 줄을 따라 작은 뼈 끝이 점점이 보인다. `
  + '화풍은 둘째 그림처럼 진한 윤곽선 도트 · 고해상도 픽셀 아트. 머리 · 껍질 무늬 · 도마 · 그림자 · 글자 없음. 배경은 단색 흰색.';

// ── 공용 ──
function parseArgs(argv) {
  const P = { out: '', only: null, kinds: KINDS, model: 'gemini-nano-banana-2.1', jobs: 4, tries: 3, force: false, dry: false, install: false, bake: false, sheet: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--out') P.out = v();
    else if (a === '--only') P.only = new Set(v().split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--kinds') P.kinds = v().split(',').map((s) => s.trim()).filter((k) => KINDS.includes(k));
    else if (a === '--model') P.model = v();
    else if (a === '--jobs') P.jobs = Math.max(1, +v());
    else if (a === '--tries') P.tries = Math.max(1, +v());
    else if (a === '--force') P.force = true;
    else if (a === '--dry') P.dry = true;
    else if (a === '--install') P.install = true;
    else if (a === '--bake') P.bake = true;
    else if (a === '--sheet') P.sheet = v();
  }
  if (!P.out && !P.bake) { console.error('--out <폴더>가 필요하다'); process.exit(1); }
  return P;
}

/** 참고 그림 — 흰 바탕(투명 → 흰색) · 긴 변 768px PNG로 한 번만 만든다 */
function refPart(outDir, file, name) {
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, name);
  if (!fs.existsSync(dst)) execFileSync('convert', [file, '-background', 'white', '-alpha', 'remove', '-resize', '768x768>', `PNG24:${dst}`]);
  return { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(parts, P, outFile, aspect = '21:9') {
  const body = { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } } };
  let last = '';
  for (let attempt = 1; attempt <= 4; attempt++) {
    const t0 = Date.now();
    let res, j;
    try {
      res = await fetch(`${API}/${P.model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      j = await res.json();
    } catch (e) { last = `fetch ${e.message}`; await sleep(5000 * attempt); continue; }
    if (!res.ok) {
      last = `HTTP ${res.status} ${(j?.error?.message ?? '').slice(0, 160)}`;
      if (res.status === 403) throw new Error(`${last} — NODE_USE_ENV_PROXY=1로 돌렸는지, 시크릿 · 결제를 확인`);
      await sleep((res.status === 429 ? 20000 : 6000) * attempt);
      continue;
    }
    const img = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.inlineData ?? p.inline_data).find((d) => d?.data);
    if (!img) { last = `그림 없음 finish=${j.candidates?.[0]?.finishReason ?? '?'}`; await sleep(3000); continue; }
    // ⚠ 임시 파일 확장자를 .raw로 두면 convert가 DNG로 읽으려다 실패한다(315 시범)
    const tmp = path.join(os.tmpdir(), `gfl_${path.basename(outFile)}_${process.pid}.dl`);
    fs.writeFileSync(tmp, Buffer.from(img.data, 'base64'));
    execFileSync('convert', [tmp, '-depth', '8', `PNG32:${outFile}`]);
    fs.rmSync(tmp, { force: true });
    const u = j.usageMetadata ?? {};
    return { ok: true, ms: Date.now() - t0, inTok: u.promptTokenCount, outTok: u.candidatesTokenCount };
  }
  return { ok: false, err: last };
}

// ── 실루엣 · 비교 ──
let _crops = null;
const crops = () => (_crops ??= require('./pixelize_crops.cjs'));

/** 배경을 벗긴 RGBA + 가장 큰 덩어리 bbox */
async function silhouette(file) {
  const { DEFAULTS, decodeAny, cutout } = crops();
  const img = await decodeAny(file);
  const isAlpha = (() => { let n = 0, t = 0; for (let x = 0; x < img.w; x += 4) { t++; if (img.data[x * 4 + 3] < 8) n++; } return n / t > 0.9; })();
  const cut = isAlpha ? { data: img.data } : cutout(img, { ...DEFAULTS, shadow: 0 });
  const d = Buffer.from(cut.data);
  const { w, h } = img;
  // 가장 큰 연결 덩어리만 남긴다(떨어진 부스러기 · 그림 밖 얼룩)
  const lab = new Int32Array(w * h).fill(-1);
  let best = -1, bestN = 0, id = 0, total = 0;
  const sizes = [];
  for (let s0 = 0; s0 < w * h; s0++) {
    if (lab[s0] >= 0 || d[s0 * 4 + 3] < 128) continue;
    const st = [s0]; lab[s0] = id; let n = 0;
    while (st.length) {
      const i = st.pop(); n++;
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && lab[j] < 0 && d[j * 4 + 3] >= 128) { lab[j] = id; st.push(j); }
    }
    sizes.push(n); total += n;
    if (n > bestN) { bestN = n; best = id; }
    id++;
  }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < w * h; i++) {
    if (lab[i] !== best) { if (d[i * 4 + 3] < 128 || lab[i] >= 0) d[i * 4 + 3] = 0; continue; }
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { w, h, data: d, bbox: { x0, y0, x1, y1 }, mainFrac: total ? bestN / total : 0 };
}

/** bbox를 N×M 격자로 늘인 실루엣(0/1) — 종횡비가 달라도 모양만 비교한다 */
function normMask(s, N = 96, M = 40, mirror = false) {
  const { x0, y0, x1, y1 } = s.bbox;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const m = new Uint8Array(N * M);
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    const ii = mirror ? N - 1 - i : i;
    const x = x0 + Math.min(bw - 1, Math.floor((ii + 0.5) * bw / N)), y = y0 + Math.min(bh - 1, Math.floor((j + 0.5) * bh / M));
    m[j * N + i] = s.data[(y * s.w + x) * 4 + 3] >= 128 ? 1 : 0;
  }
  return m;
}
const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return u ? i / u : 0; };
const aspectOf = (s) => (s.bbox.x1 - s.bbox.x0 + 1) / (s.bbox.y1 - s.bbox.y0 + 1);

/** 꼬리가 왼쪽인가 — 왼쪽 20% 열의 평균 높이가 오른쪽 20%보다 작으면 꼬리(가는 쪽)가 왼쪽 */
function tailLeft(s) {
  const { x0, x1, y0, y1 } = s.bbox;
  const colH = (x) => { let n = 0; for (let y = y0; y <= y1; y++) if (s.data[(y * s.w + x) * 4 + 3] >= 128) n++; return n; };
  const span = x1 - x0 + 1, k = Math.max(1, Math.round(span * 0.2));
  let L = 0, R = 0;
  for (let i = 0; i < k; i++) { L += colH(x0 + i); R += colH(x1 - i); }
  return L <= R;
}

// ── 생성 ──
function targets(P) {
  return Object.entries(SPECIES)
    .filter(([id, t]) => !t.alias && (!P.only || P.only.has(id)))
    .map(([id, t]) => ({ id, ...t, kinds: P.kinds.filter((k) => !(t.keep && k !== 'ribs')) }));
}

function log(P, rec) { fs.appendFileSync(path.join(P.out, '_log.jsonl'), JSON.stringify({ ...rec, at: new Date().toISOString() }) + '\n'); }

async function genSpecies(t, P) {
  const fishRef = () => refPart(P.out, path.join(FISH_SRC, t.fish), t.fish);
  const file = (k, tag = '') => path.join(P.out, `${t.id}_${k}${tag}.png`);
  const lines = [];
  // ① 순수 필렛
  if (t.kinds.includes('pure') && (P.force || !fs.existsSync(file('pure')))) {
    const r = await callGemini([{ text: pureIntro }, refPart(P.out, STYLE_REF, '_style_pure.png'), fishRef(), { text: pureTask(t) }], P, file('pure'));
    if (!r.ok) { lines.push(`pure 실패 ${r.err}`); return lines; }
    const s = await silhouette(file('pure'));
    log(P, { id: t.id, kind: 'pure', ms: r.ms, aspect: +aspectOf(s).toFixed(2), tailLeft: tailLeft(s), main: +s.mainFrac.toFixed(3), inTok: r.inTok, outTok: r.outTok });
    lines.push(`pure ${r.ms}ms 비 ${aspectOf(s).toFixed(2)} 꼬리${tailLeft(s) ? '왼' : '오른'}`);
  }
  const pureFile = t.keep ?? file('pure');
  if (!fs.existsSync(pureFile)) return lines;
  // ② 껍질 붙은 필렛 — pure를 고친다 · 실루엣 IoU ≥ 0.85를 고른다
  if (t.kinds.includes('skin') && (P.force || !fs.existsSync(file('skin')))) {
    const ps = await silhouette(pureFile);
    const pm = normMask(ps);
    let best = null;
    for (let k = 1; k <= P.tries; k++) {
      const tmp = file('skin', `.try${k}`);
      const r = await callGemini([{ text: skinIntro }, refPart(P.out, pureFile, `_pure_${t.id}.png`), fishRef(), { text: skinTask(t) }], P, tmp);
      if (!r.ok) { lines.push(`skin 시도 ${k} 실패 ${r.err}`); continue; }
      const s = await silhouette(tmp);
      const q = iou(normMask(s), pm), ar = aspectOf(s) / aspectOf(ps);
      log(P, { id: t.id, kind: 'skin', try: k, ms: r.ms, iou: +q.toFixed(3), aspectRatio: +ar.toFixed(3), inTok: r.inTok, outTok: r.outTok });
      const score = q - Math.abs(1 - ar);
      if (!best || score > best.score) best = { tmp, q, ar, score };
      if (q >= 0.85 && Math.abs(1 - ar) < 0.12) break;
    }
    if (best) {
      fs.copyFileSync(best.tmp, file('skin'));
      lines.push(`skin IoU ${best.q.toFixed(2)} 비 ${best.ar.toFixed(2)}`);
    }
  }
  // ③ 갈빗대 붙은 필렛 — 구도 참고와 실루엣 IoU ≥ 0.93(종횡비 무관 · 거울상도 본다 · 316 1차 0.72는 갈빗대 없는 그림을 통과시켰다)
  if (t.kinds.includes('ribs') && (P.force || !fs.existsSync(file('ribs')))) {
    const rs = await silhouette(RIBS_REF);
    const rm = normMask(rs);
    let best = null;
    for (let k = 1; k <= P.tries; k++) {
      const tmp = file('ribs', `.try${k}`);
      const r = await callGemini([{ text: ribsIntro }, refPart(P.out, RIBS_REF, '_ribs_ref.png'), refPart(P.out, pureFile, `_pure_${t.id}.png`), fishRef(), { text: ribsTask(t) }], P, tmp);
      if (!r.ok) { lines.push(`ribs 시도 ${k} 실패 ${r.err}`); continue; }
      const s = await silhouette(tmp);
      const qd = iou(normMask(s), rm), qm = iou(normMask(s, 96, 40, true), rm);
      const q = Math.max(qd, qm);
      log(P, { id: t.id, kind: 'ribs', try: k, ms: r.ms, iou: +qd.toFixed(3), iouMirror: +qm.toFixed(3), aspect: +aspectOf(s).toFixed(2), inTok: r.inTok, outTok: r.outTok });
      if (!best || q > best.q) best = { tmp, q, mirrored: qm > qd };
      if (q >= 0.93) break;
    }
    if (best) {
      fs.copyFileSync(best.tmp, file('ribs'));
      lines.push(`ribs IoU ${best.q.toFixed(2)}${best.mirrored ? ' (거울상)' : ''}`);
    }
  }
  return lines;
}

// ── 설치 — 배경 벗기기 · 방향 · 격자 정규화 ──
async function install(P) {
  const { peelFringe, regrid } = require('./gemini_fish_art.cjs');
  const { encode } = require('./lib_png.cjs');
  fs.mkdirSync(DEST, { recursive: true });
  const rs = await silhouette(RIBS_REF);
  const rm = normMask(rs);
  let n = 0;
  for (const t of targets({ ...P, kinds: KINDS })) {
    for (const k of t.kinds) {
      const src = path.join(P.out, `${t.id}_${k}.png`);
      if (!fs.existsSync(src)) continue;
      const dst = path.join(DEST, `${t.id}_${k}.png`);
      if (fs.existsSync(dst) && !P.force) continue;
      const s = await silhouette(src);
      const pf = peelFringe(s.data, s.w, s.h);
      // 방향: pure · skin = 꼬리 왼쪽 / ribs = 구도 참고와 같은 쪽(뱃살 날개 왼쪽 아래)
      let flip = false;
      if (k === 'ribs') flip = iou(normMask(s, 96, 40, true), rm) > iou(normMask(s), rm);
      else flip = !tailLeft(s);
      const { x0, y0, x1, y1 } = s.bbox;
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const crop = Buffer.alloc(bw * bh * 4);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const sx = flip ? x1 - x : x0 + x;
        s.data.copy(crop, (y * bw + x) * 4, ((y0 + y) * s.w + sx) * 4, ((y0 + y) * s.w + sx) * 4 + 4);
      }
      for (let i = 0; i < bw * bh; i++) if (crop[i * 4 + 3] === 0) crop[i * 4] = crop[i * 4 + 1] = crop[i * 4 + 2] = 0;
      const g = regrid(crop, bw, bh, 192, 4);
      const PAD = 4, pw = g.w + PAD * 2, ph = g.h + PAD * 2, out = Buffer.alloc(pw * ph * 4);
      for (let y = 0; y < g.h; y++) g.data.copy(out, ((y + PAD) * pw + PAD) * 4, y * g.w * 4, (y + 1) * g.w * 4);
      const bytes = encode(pw, ph, out, dst);
      console.log(`${t.id}_${k}: ${bw}x${bh}${flip ? ' 좌우 뒤집음' : ''} → ${pw}x${ph} (${(bytes / 1024).toFixed(0)}KB · 격자 ${g.cw}×${g.ch} · 번짐 ${pf.peeled}px)`);
      n++;
    }
  }
  console.log(`${path.relative(ROOT, DEST)}에 ${n}장 → 이제 node tools/gemini_fillet_art.cjs --bake`);
}

// ── 굽기 — 도마 스프라이트(긴 변 128칸 · 팔레트 ≤ 48) ──
const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
function bake() {
  const { decode } = require('./lib_png.cjs');
  const { areaResize, quantize } = crops();
  const files = fs.existsSync(DEST) ? fs.readdirSync(DEST).filter((f) => /^[a-z_]+_(pure|skin|ribs)\.png$/.test(f)).sort() : [];
  const entries = [];
  for (const f of files) {
    const img = decode(path.join(DEST, f));
    // 투명 여백을 뺀 bbox → 긴 변 128칸
    let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] >= 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const crop = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++) img.data.copy(crop, y * bw * 4, ((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x1 + 1) * 4);
    const s = 128 / Math.max(bw, bh);
    const dw = Math.max(1, Math.round(bw * s)), dh = Math.max(1, Math.round(bh * s));
    const small = areaResize(crop, bw, bh, dw, dh);
    for (let i = 0; i < dw * dh; i++) small[i * 4 + 3] = small[i * 4 + 3] >= 128 ? 255 : 0;
    const q = quantize(small, dw, dh, 48);
    const pal = q.palette.map((c) => (Array.isArray(c) ? (c[0] << 16) | (c[1] << 8) | c[2] : c));
    const idxOf = new Map(pal.map((c, i) => [c, i]));
    const rows = [];
    for (let y = 0; y < dh; y++) {
      let r = '';
      for (let x = 0; x < dw; x++) {
        const o = (y * dw + x) * 4;
        if (q.buf[o + 3] < 128) { r += '.'; continue; }
        const c = (q.buf[o] << 16) | (q.buf[o + 1] << 8) | q.buf[o + 2];
        let i = idxOf.get(c);
        if (i === undefined) { // 팔레트 최근접
          let bd = Infinity; i = 0;
          pal.forEach((p, k) => { const d = ((p >> 16) - q.buf[o]) ** 2 + (((p >> 8) & 255) - q.buf[o + 1]) ** 2 + ((p & 255) - q.buf[o + 2]) ** 2; if (d < bd) { bd = d; i = k; } });
        }
        r += AB[i];
      }
      rows.push(r);
    }
    const key = f.replace(/\.png$/, '');
    entries.push([key, { w: dw, h: dh, palette: pal, rows }]);
    console.log(`${key}: ${dw}x${dh} · 팔레트 ${pal.length}`);
  }
  const aliases = Object.entries(SPECIES).filter(([, t]) => t.alias).map(([id, t]) => `  ${id}: '${t.alias}',`);
  const ser = ([k, s]) => `  ${JSON.stringify(k)}: {\n    w: ${s.w}, h: ${s.h}, cellPx: 1,\n    palette: [${s.palette.map((p) => '0x' + p.toString(16).padStart(6, '0')).join(', ')}],\n    rows: [\n${s.rows.map((r) => `      '${r}',`).join('\n')}\n    ],\n  },`;
  const ts = `/**
 * @file PixelFilletSpecies.ts
 * @description 316차 — 어종별 필렛 도마 스프라이트(자동 생성 — 수동 편집 금지).
 *
 * 생성: node tools/gemini_fillet_art.cjs --bake  (입력: food assets/trimmings/species/<어종>_<종류>.png — Gemini 그림을 설치한 것)
 * 키: \`<종류>_<어종>\`가 아니라 \`<어종>_<종류>\` — pure(순수 필렛) · skin(껍질 붙은 필렛) · ribs(갈빗대 붙은 필렛).
 * 도마(\`PixelButcherFish\`) · 가방 아이콘 · 유도선 그림 자리(\`ButcheryPanel\` filletFrames)가 이 표를 먼저 보고, 없으면 어종군 공용 그림이다.
 */

import type { PixelFishSprite } from './PixelFishSprites.js';

export const FILLET_SPECIES_SPRITES: Record<string, PixelFishSprite> = {
${entries.map(ser).join('\n')}
};

/** 같은 생물종 — 그 어종의 필렛 그림을 쓴다 */
export const FILLET_SPECIES_ALIAS: Record<string, string> = {
${aliases.join('\n')}
};
`;
  fs.writeFileSync(OUT_TS, ts);
  console.log(`written ${path.relative(ROOT, OUT_TS)} — ${entries.length}장 · ${(ts.length / 1024).toFixed(0)}KB`);
}

// ── 검수 시트 ──
async function sheet(P) {
  const rows = [];
  for (const t of targets({ ...P, kinds: KINDS })) {
    const cells = KINDS.map((k) => {
      const f = k !== 'ribs' && t.keep ? t.keep : path.join(P.out, `${t.id}_${k}.png`);
      return fs.existsSync(f) ? f : 'xc:gray';
    });
    rows.push({ id: t.id, ko: t.ko, cells });
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flsheet_'));
  const lines = [];
  for (const r of rows) {
    const out = path.join(tmpDir, `${r.id}.png`);
    execFileSync('montage', [...r.cells.flatMap((c) => ['-label', '', c]), '-tile', '3x1', '-geometry', '300x130+4+4', '-background', '#2a3038', out]);
    const lab = path.join(tmpDir, `${r.id}_l.png`);
    execFileSync('convert', [out, '-gravity', 'NorthWest', '-splice', '0x18', '-fill', '#e8eef4', '-font', '/usr/share/fonts/opentype/unifont/unifont.otf', '-pointsize', '16', '-annotate', '+6+1', `${r.ko} (${r.id})`, lab]);
    lines.push(lab);
  }
  execFileSync('convert', [...lines, '-append', P.sheet]);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`시트 ${P.sheet} — ${rows.length}줄(순수 · 껍질 · 갈빗대)`);
}

// ── 위키 시트 — 갈래마다 한 장(한 줄 = 어종 하나 · 칸 = 순수 · 껍질 · 갈빗대) ──
async function wikiSheets() {
  const { decode, encode } = require('./lib_png.cjs');
  const { areaResize } = crops();
  const core = await import(path.join(ROOT, 'packages/core/dist/index.js'));
  const prof = (id) => core.BUTCHERY_PROFILES[id];
  const finfish = [...core.BUTCHERY_IMPLEMENTED_SPECIES].filter((id) => SPECIES[id] && !SPECIES[id].alias);
  // 위키 갈래와 같은 가름(gen_game_wiki_data.mjs BK_CATS)
  const CATS = {
    amberjack: finfish.filter((id) => core.butcheryArtFamily(id) === 'amberjack' && !prof(id)?.tree),
    small: finfish.filter((id) => prof(id)?.tree === 'small'),
    bream: finfish.filter((id) => core.butcheryArtFamily(id) === 'bream' && !prof(id)?.tree && prof(id)?.bodyShape !== 'flat'),
  };
  const TW = 240, TH = 96;
  const fileOf = (id, k) => {
    const t = SPECIES[id];
    if (t.keep && k === 'pure') return t.keep;
    if (t.keep && k === 'skin') return t.keepSkin;
    return path.join(DEST, `${id}_${k}.png`);
  };
  fs.mkdirSync(WIKI_DIR, { recursive: true });
  const manPath = path.join(WIKI_DIR, 'manifest.json');
  const man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : {};
  man.fillets = {};
  for (const [cat, ids] of Object.entries(CATS)) {
    const W = TW * KINDS.length, H = TH * ids.length;
    const sheet = Buffer.alloc(W * H * 4);
    ids.forEach((id, row) => KINDS.forEach((k, col) => {
      const f = fileOf(id, k);
      if (!f || !fs.existsSync(f)) return;
      const img = decode(f);
      let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] >= 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const crop = Buffer.alloc(bw * bh * 4);
      for (let y = 0; y < bh; y++) img.data.copy(crop, y * bw * 4, ((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x1 + 1) * 4);
      const sc = Math.min((TW - 12) / bw, (TH - 10) / bh);
      const dw = Math.max(1, Math.round(bw * sc)), dh = Math.max(1, Math.round(bh * sc));
      const small = areaResize(crop, bw, bh, dw, dh);
      const ox = col * TW + Math.floor((TW - dw) / 2), oy = row * TH + Math.floor((TH - dh) / 2);
      for (let y = 0; y < dh; y++) small.copy(sheet, ((oy + y) * W + ox) * 4, y * dw * 4, (y + 1) * dw * 4);
    }));
    // PNG로 구운 뒤 webp(품질 88)로 — 면적 평균 축소라 색이 많아 PNG는 1.3MB였다
    const file = `butchery/fillets_${cat}.webp`;
    const tmpPng = path.join(os.tmpdir(), `fillets_${cat}_${process.pid}.png`);
    encode(W, H, sheet, tmpPng);
    execFileSync('convert', [tmpPng, '-quality', '88', path.join(WIKI_DIR, `fillets_${cat}.webp`)]);
    fs.rmSync(tmpPng, { force: true });
    fs.rmSync(path.join(WIKI_DIR, `fillets_${cat}.png`), { force: true });
    const bytes = fs.statSync(path.join(WIKI_DIR, `fillets_${cat}.webp`)).size;
    man.fillets[cat] = { file, tileW: TW, tileH: TH, kinds: ['순수 필렛', '껍질 붙은 필렛', '갈빗대 붙은 필렛'], rows: ids };
    console.log(`${file}: ${ids.length}종 · ${W}x${H} · ${(bytes / 1024).toFixed(0)}KB`);
  }
  fs.writeFileSync(manPath, `${JSON.stringify(man, null, 1)}\n`);
}

async function main() {
  if (process.argv.includes('--wiki-sheets')) { await wikiSheets(); return; }
  const P = parseArgs(process.argv.slice(2));
  if (P.bake) { bake(); return; }
  fs.mkdirSync(P.out, { recursive: true });
  if (P.install) { await install(P); return; }
  if (P.sheet) { await sheet(P); return; }
  const list = targets(P);
  console.log(`대상 ${list.length}종 · 종류 ${P.kinds.join(',')} · 모델 ${P.model} · 동시 ${P.jobs}`);
  if (P.dry) { const t = list[0]; console.log(pureTask(t), '\n', skinTask(t), '\n', ribsTask(t)); return; }
  let next = 0, done = 0;
  const worker = async () => {
    while (next < list.length) {
      const t = list[next++];
      try {
        const lines = await genSpecies(t, P);
        done++;
        console.log(`[${done}/${list.length}] ${t.id} — ${lines.join(' · ')}`);
      } catch (e) { done++; console.log(`[${done}/${list.length}] ${t.id} — 오류 ${e.message}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(P.jobs, list.length) }, worker));
  console.log('끝');
}

module.exports = { SPECIES, KINDS };
if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
