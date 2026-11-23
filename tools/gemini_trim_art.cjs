/**
 * @file gemini_trim_art.cjs
 * @description 327차 — **어종별 손질 부산물 그림**(Gemini) — 머리 · 척추뼈(중골).
 *
 *  사용자 리포트(2026-11-17): 「긴꼬리벵에돔 손질하고 나니까, 머리 이미지가 없네? 다른 생선들도 손질 부속에 대한 이미지 별도로 없으면
 *  Gemini 이미지 generation 해줘」.
 *  그전에는 머리 = 어종군 사진 셋(감성돔 · 잿방어 · 광어)에 어종 색을 입혀 **그 자리에서 구운 텍스처**(`trimhead_<어종>`)였다 —
 *  게임을 다시 켜면 그 텍스처가 없어 머리 아이콘이 비었다. 척추뼈는 어종군 사진 그대로(참돔 뼈에 감성돔 꼬리).
 *
 *  그림 둘(어종마다):
 *    head  — 아가미뚜껑 뒤에서 잘라 낸 머리 · 옆에서 본 모습 · **주둥이 왼쪽**(넙치류는 위에서 본 모습 — 광어 머리 사진과 같은 구도)
 *    spine — 세장뜨기 하고 남은 척추뼈(중골) · **머리 쪽 왼쪽 · 꼬리지느러미 오른쪽**(넙치류는 다섯장뜨기 하고 남은 뼈 — 위에서 본 모습)
 *  332차 — 그림 하나 더(4덩어리 해체 어종 10종만 · `--kinds kama`):
 *    kama  — 가마살(머리를 떼며 함께 나오는 아가미 뒤 턱밑살 — 가슴지느러미가 붙은 초승달 모양 한 덩이).
 *            사용자 리포트 「'가마살' 이미지가 픽셀아트가 아니라서 … 다시 전부 다 그려야」 — 그전에는 캔버스에 찍은 세모 도형(`trimloin_kama_*`)이었다.
 *            화풍 참고 = 그 어종 머리 그림(327(2)) + 온마리 그림. 구도 참고 사진이 없어 방향은 맞추지 않는다(그린 대로).
 *  332(2) — 그림 둘 더(해체 어종 · `--kinds nakaochi,chiai`): 사용자 「중골 살 · 혈합육도 gemini로 그려줘」.
 *    nakaochi — 중골 살(등뼈에서 숟가락으로 긁어 낸 살 무더기) · chiai — 혈합육(덩어리에서 도려낸 검붉은 띠).
 *            살색이 같은 어종은 한 그림을 같이 쓴다(`FLESH` = 그림 주인 6 · `FLESH_OWNER` = 같이 쓰는 어종 4 → `TRIM_FLESH_OWNER`).
 *    가마살은 큰 바리류 셋을 뺀 7종이다(사용자 결정 — 서더리로 쓴다).
 *  구도 · 화풍 참고 = 어종군 원본 사진(`food assets/trimmings/{bream,amberjack,halibut}`) + 그 어종 온마리 그림(`food assets/fish/`).
 *  갈빗대 · 지아이뼈 · 껍질 · 내장은 어종이 달라도 생김새가 같아 공용 그림 그대로 둔다(껍질 · 내장 · 지아이뼈는 아이템도 하나로 겹친다).
 *
 *  키는 환경의 네트워크 시크릿이 붙인다(호스트 generativelanguage.googleapis.com · 헤더 x-goog-api-key).
 *  ⚠ Node 내장 fetch는 프록시를 안 탄다 — 반드시 `NODE_USE_ENV_PROXY=1`.
 *
 *  사용:
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_trim_art.cjs --out <폴더> [--only sea_bass,red_seabream] [--kinds head,spine] [--jobs 4] [--force] [--tag v2] [--dry]
 *      → <폴더>/<id>_<kind>.png(PNG32) + _log.jsonl
 *    node tools/gemini_trim_art.cjs --out <폴더> --sheet <sheet.png> [--kinds head]   검수 시트(칸 아래 어종 이름)
 *    node tools/gemini_trim_art.cjs --out <폴더> --install [--force]   배경 벗기기 · 방향 맞추기 · 격자 정규화(긴 변 192칸 × 4px)
 *      → `food assets/trimmings/species/<id>_<kind>.png`(원본 — 저장소)
 *    node tools/gemini_trim_art.cjs --bake
 *      → `packages/client-pc/public/trimmings/sp/<kind>_<id>.png`(긴 변 192px — 한 칸 = 1px) + `src/data/TrimPartArt.ts`(목록 — 자동 생성)
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
const PUB = path.join(ROOT, 'packages', 'client-pc', 'public', 'trimmings', 'sp');
const OUT_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'TrimPartArt.ts');
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

const KINDS = ['head', 'spine', 'kama', 'nakaochi', 'chiai', 'kamasaku'];
/** 기본으로 뽑는 종류 — 가마살 · 중골 살 · 혈합육은 해체 어종만이라 `--kinds`로 따로 부른다 */
const DEFAULT_KINDS = ['head', 'spine'];
/**
 * 332 — 가마살을 내는 어종(core `LOIN_KAMA_SPECIES`) → 살 색(잘린 면).
 *  332(2) — 큰 바리류(자바리 · 다금바리 · 능성어)는 가마살을 내지 않는다(사용자 결정 — 머리에 붙여 서더리로).
 */
const KAMA = {
  bluefin_tuna: '짙은 붉은 살에 흰 지방 결이 촘촘하다(뱃살 쪽은 분홍빛)',
  bigeye_tuna: '맑은 붉은 살',
  swordfish: '옅은 분홍빛이 도는 크림색 살',
  striped_marlin: '주황빛이 도는 분홍 살',
  yellowtail: '분홍빛 살에 흰 지방 결, 껍질 쪽에 검붉은 혈합육 줄',
  amberjack: '분홍빛 살, 껍질 쪽에 검붉은 혈합육 줄',
  greater_amberjack: '옅은 분홍빛 살, 껍질 쪽에 검붉은 혈합육 줄',
};
/**
 * 332(2) — 중골 살 · 혈합육 그림의 주인 6(살색이 갈리는 만큼) → [중골 살 색, 혈합육 색].
 *  나머지 해체 어종은 `FLESH_OWNER`의 주인 그림을 같이 쓴다(긁어 낸 살 · 도려낸 띠는 어종이 달라도 생김새가 같다 — 색만 다르다).
 */
const FLESH = {
  bluefin_tuna: ['짙은 선홍색 · 검붉은 붉은 살, 군데군데 옅은 분홍빛 지방이 섞여 있다', '거의 검은빛이 도는 검붉은색(짙은 팥죽색)'],
  bigeye_tuna: ['맑고 밝은 선홍색 붉은 살', '검붉은 적갈색'],
  swordfish: ['옅은 살구색 · 분홍빛이 도는 크림색 살', '붉은 갈색'],
  striped_marlin: ['주황빛이 도는 분홍색 살', '검붉은 갈색'],
  yellowtail: ['옅은 분홍색 살에 흰 지방 결이 섞여 있다', '검붉은 적갈색'],
  longtooth_grouper: ['반투명한 흰 살(아주 옅은 분홍 기)', '옅은 분홍 갈색'],
};
const FLESH_OWNER = { amberjack: 'yellowtail', greater_amberjack: 'yellowtail', sawedged_perch: 'longtooth_grouper', sevenband_grouper: 'longtooth_grouper' };
const isFlesh = (k) => k === 'nakaochi' || k === 'chiai' || k === 'kamasaku';
/**
 * 333 — 가마살 덩이의 생김새 갈래(사용자가 준 실제 사진 셋에서 읽은 것 — 사진은 저장소에 넣지 않는다 · `--kref <폴더>`로 구도 참고만).
 *  amberjack = 가슴지느러미 · 배지느러미가 붙은 세모 덩이 / tuna = 지느러미 뗀 구멍이 남은 길쭉한 띠 / bill = 지느러미 밑동만 남은 두툼한 세모 덩이
 */
const KAMA_FORM = {
  yellowtail: 'amberjack', amberjack: 'amberjack', greater_amberjack: 'amberjack',
  bluefin_tuna: 'tuna', bigeye_tuna: 'tuna', swordfish: 'bill', striped_marlin: 'bill',
};
/** 구도 참고 사진 파일 이름(`--kref` 폴더 안) — 없으면 글만으로 그린다(332처럼 몸통 토막이 나올 수 있다 — 경고) */
const KAMA_REF_FILE = { amberjack: 'kama_amberjack.png', tuna: 'kama_tuna.png', bill: 'kama_tuna.png' };

/** 구도 · 화풍 참고(어종군 원본 사진) */
const REF = {
  head: { bream: path.join(TRIM, 'bream', 'head_black_sea_bream.png'), amberjack: path.join(TRIM, 'amberjack', 'head_amberjack.png'), halibut: path.join(TRIM, 'halibut', 'head_halibut.png') },
  spine: { bream: path.join(TRIM, 'bream', 'rests_main_spine_bream.png'), amberjack: path.join(TRIM, 'amberjack', 'rests_main_spine_amberjack.png'), halibut: path.join(TRIM, 'halibut', 'main_spine_bone_halibut.png') },
};

/**
 * 필렛 도구 표(둥근 생선 36종 — 온마리 원본 · 이름 · 껍질 색 · 몸 모양)에 필렛 그림이 없는 어종(넙치류 · 참치 · 새치)을 보탠다.
 *  fam = 구도 참고(bream = 몸 높은 돔 / amberjack = 방추형 · 길쭉한 몸 / halibut = 넙치류 탑뷰)
 *  native = 어종군 원본 사진이 바로 그 어종이라 그리지 않는다(감성돔 · 잿방어 · 광어) · alias = 같은 생물종
 */
const FILLET = require('./gemini_fillet_art.cjs').SPECIES;
const BREAM_FAM = new Set(['black_seabream', 'red_seabream', 'night_seabream', 'largescale_blackfish', 'longtail_blackfish', 'stone_beakperch', 'spotted_knifejaw', 'surfperch', 'rainbow_wrasse']);
const EXTRA = {
  flatfish: { native: true },
  flounder: { fish: 'flounder.png', ko: '문치가자미', fam: 'halibut', skin: '황갈색 · 회갈색 바탕에 짙은 갈색 잔점', shape: '달걀꼴로 납작한 가자미' },
  frog_flounder: { fish: 'frog_flounder.png', ko: '도다리', fam: 'halibut', skin: '회갈색 바탕에 짙은 갈색 얼룩과 흰 점', shape: '마름모꼴로 납작하고 몸이 높은 가자미' },
  starry_flounder: { fish: 'starry_flounder.png', ko: '강도다리', fam: 'halibut', skin: '짙은 올리브 갈색 바탕, 지느러미에 검은 띠와 주황빛 띠가 번갈아 있다', shape: '마름모꼴로 납작한 가자미' },
  tonguefish: { fish: 'robust_tonguefish.png', ko: '개서대', fam: 'halibut', skin: '붉은 갈색 · 적갈색', shape: '혀 모양으로 길쭉하고 납작하며 꼬리가 뾰족하게 모인다',
    headNote: '머리가 둥글고 작으며 눈이 아주 작고 입이 갈고리처럼 굽었다.', spineNote: '꼬리지느러미가 따로 없이 뾰족하게 모인다.' },
  bluefin_tuna: { fish: 'pacific_bluefin_tuna.png', ko: '참다랑어', fam: 'amberjack', skin: '등은 짙은 남색 · 검푸른색, 배는 은백색', shape: '굵은 방추형 큰 몸', spineNote: '꼬리지느러미는 초승달 모양으로 짙은 남색이고 꼬리자루가 가늘다.' },
  bigeye_tuna: { fish: 'bigeye_tuna.png', ko: '눈다랑어', fam: 'amberjack', skin: '등은 짙은 남색, 배는 은백색, 옆구리에 누르스름한 빛', shape: '굵은 방추형 큰 몸',
    headNote: '눈이 유난히 크다.', spineNote: '꼬리지느러미는 초승달 모양으로 짙은 남색이고 꼬리자루가 가늘다.' },
  swordfish: { fish: 'swordfish.png', ko: '황새치', fam: 'amberjack', skin: '등은 짙은 흑갈색 · 남색, 배는 옅은 회백색', shape: '굵고 긴 방추형 큰 몸', wideHead: true,
    headNote: '위턱이 칼처럼 납작하고 아주 길게 뻗었다(머리 길이의 두 배쯤) — 긴 주둥이까지 다 그린다. 눈이 크다.', spineNote: '꼬리지느러미는 크고 넓은 초승달 모양이고 꼬리자루가 가늘다.' },
  striped_marlin: { fish: 'striped_marlin.png', ko: '청새치', fam: 'amberjack', skin: '등은 짙은 남색, 배는 은백색, 옆구리에 옅은 푸른 세로띠', shape: '길고 날씬한 방추형 큰 몸', wideHead: true,
    headNote: '위턱이 창처럼 둥글고 길게 뻗었다 — 긴 주둥이까지 다 그린다.', spineNote: '꼬리지느러미는 크고 가는 초승달 모양이고 꼬리자루가 가늘다.' },
};
/** 머리 · 뼈 생김새 보탬(필렛 표에는 없는 말) */
const NOTES = {
  halfbeak: { wideHead: true, headNote: '아래턱이 바늘처럼 가늘고 길게 뻗었고 끝이 붉다 — 긴 아래턱까지 다 그린다.' },
  pacific_saury: { headNote: '주둥이가 뾰족하고 아래턱이 조금 더 길다.' },
  spanish_mackerel: { headNote: '주둥이가 뾰족하고 입이 크며 날카로운 이빨이 보인다.' },
  black_rockfish: { headNote: '머리가 크고 눈이 크며 아가미뚜껑에 가시가 있다.' },
  stone_beakperch: { headNote: '입이 새 부리처럼 단단하고 작다.' },
  spotted_knifejaw: { headNote: '입이 새 부리처럼 단단하고 작다.' },
  yellowfin_goby: { headNote: '머리가 크고 납작하며 입이 크다.' },
  rainbow_wrasse: { headNote: '주둥이가 뾰족하고 입술이 두툼하다.' },
  horse_mackerel: { spineNote: '꼬리지느러미는 깊게 갈라졌고 누르스름하다.' },
  chub_mackerel: { spineNote: '꼬리지느러미는 깊게 갈라졌고 회청색이다.' },
};
const SPECIES = {};
for (const [id, t] of Object.entries(FILLET)) {
  if (t.alias) { SPECIES[id] = { alias: t.alias }; continue; }
  const native = id === 'black_seabream' || id === 'greater_amberjack';
  SPECIES[id] = { fish: t.fish, ko: t.ko, skin: t.skin, shape: t.shape.replace(/필렛[도이은는가]?[^,(]*/g, '').replace(/이라\s*$|라\s*$/, '').trim() || t.shape,
    fam: BREAM_FAM.has(id) ? 'bream' : 'amberjack', native, ...(NOTES[id] ?? {}) };
}
Object.assign(SPECIES, EXTRA);

// ── 프롬프트 ──
const STYLE = '고해상도 픽셀 아트(진한 윤곽선 도트 — 낚시 게임의 손질 부산물 아이콘)';
function headText(t) {
  if (t.fam === 'halibut') {
    return '첫째 그림은 낚시 게임 손질 화면의 「잘라 낸 넙치 머리」 사진이다 — 눈이 있는 쪽을 위에서 내려다본 모습으로, 주둥이가 왼쪽 · 비스듬히 잘린 면이 오른쪽이다(구도 · 방향 참고). '
      + '둘째 그림은 손질할 어종의 온마리 그림(위에서 본 모습)이다.\n'
      + `둘째 그림의 어종 ${t.ko}의 머리만 잘라 낸 그림을 ${STYLE}로 그려라. 첫째 그림과 같은 구도 · 방향(주둥이 왼쪽 · 잘린 면 오른쪽 · 눈이 있는 쪽을 위에서 내려다본다)이다. `
      + `머리 모양 · 두 눈의 자리 · 입 · 색 · 무늬는 둘째 그림의 ${t.ko} 그대로다(첫째 그림의 어종을 따라 그리지 않는다): 몸 색은 ${t.skin}. ${t.headNote ?? ''} `
      + '아가미뚜껑 바로 뒤에서 잘렸고, 오른쪽 잘린 면에 흰 살과 붉은 아가미가 조금 보인다. 머리 하나만 · 몸통 · 꼬리 · 도마 · 접시 · 그림자 · 글자 없음. 머리가 그림을 가득 채운다. 배경은 단색 흰색.';
  }
  return '첫째 그림은 낚시 게임 손질 화면의 「잘라 낸 생선 머리」 사진이다 — 아가미뚜껑 뒤에서 잘라 낸 머리를 옆에서 본 모습으로, 주둥이가 왼쪽 · 잘린 면이 오른쪽이다(구도 · 방향 참고). '
    + '둘째 그림은 손질할 어종의 온마리 그림이다.\n'
    + `둘째 그림의 어종 ${t.ko}의 머리만 잘라 낸 그림을 ${STYLE}로 그려라. 첫째 그림과 같은 구도 · 방향(옆에서 본 모습 · 주둥이 왼쪽 · 잘린 면 오른쪽)이다. `
    + `머리 모양 · 눈 · 입 · 색 · 무늬는 둘째 그림의 ${t.ko} 그대로다(첫째 그림의 어종을 따라 그리지 않는다): 몸 색은 ${t.skin}. ${t.headNote ?? ''} `
    + '아가미뚜껑 바로 뒤에서 곧게 잘렸고 가슴지느러미가 붙어 있다 — 머리와 아가미뚜껑까지만이고, 등지느러미가 시작되는 몸통은 그리지 않는다. 오른쪽 잘린 면에 살과 붉은 아가미가 조금 보인다. '
    + '머리 하나만 · 몸통 · 꼬리 · 도마 · 접시 · 그림자 · 글자 없음. 머리가 그림을 가득 채운다. 배경은 단색 흰색.';
}
function spineText(t) {
  if (t.fam === 'halibut') {
    return '첫째 그림은 낚시 게임 손질 화면의 「넙치 뼈」 사진이다 — 다섯장뜨기로 살을 다 떠내고 남은 뼈를 위에서 내려다본 모습으로, 머리 쪽이 왼쪽 · 꼬리지느러미가 오른쪽이고, '
      + '가운데 등뼈에서 위아래로 가는 가시뼈가 부챗살처럼 뻗으며 둘레에 지느러미 살이 띠처럼 남아 있다(구도 · 방향 참고). 둘째 그림은 손질할 어종의 온마리 그림이다.\n'
      + `둘째 그림의 어종 ${t.ko}를 다섯장뜨기 하고 남은 뼈를 ${STYLE}로 그려라. 첫째 그림과 같은 구도 · 방향(머리 쪽 왼쪽 · 꼬리 오른쪽 · 위에서 내려다본다)이고 머리는 잘려 없다. `
      + `뼈의 윤곽은 그 어종의 몸 모양을 따른다(${t.shape}). 둘레에 남은 지느러미와 꼬리지느러미의 색 · 무늬는 둘째 그림의 ${t.ko} 그대로다: ${t.skin}. ${t.spineNote ?? ''} `
      + '뼈는 뽀얀 흰색이고 뼈 사이에 옅은 분홍빛 살이 조금 남아 있다. 뼈 하나만 · 머리 · 도마 · 접시 · 그림자 · 글자 없음. 그림 가로 폭을 가득 채운다. 배경은 단색 흰색.';
  }
  return '첫째 그림은 낚시 게임 손질 화면의 「생선 척추뼈(중골)」 사진이다 — 세장뜨기로 양쪽 살을 떠내고 남은 등뼈를 옆에서 본 모습으로, 머리 쪽(잘린 쪽)이 왼쪽 · 꼬리지느러미가 오른쪽에 붙어 있고, '
    + '등뼈에서 위아래로 가시뼈가 가지런히 뻗으며 뼈 사이에 붉은 살이 조금 남아 있다(구도 · 방향 참고). 둘째 그림은 손질할 어종의 온마리 그림이다.\n'
    + `둘째 그림의 어종 ${t.ko}를 세장뜨기 하고 남은 척추뼈를 ${STYLE}로 그려라. 첫째 그림과 같은 구도 · 방향(옆에서 본 모습 · 머리 쪽 왼쪽 · 꼬리지느러미 오른쪽)이고 머리는 잘려 없다. `
    + `뼈의 길이와 높이 비율은 그 어종의 몸을 따른다(${t.shape}). 꼬리지느러미의 모양과 색은 둘째 그림의 ${t.ko} 그대로다(첫째 그림의 어종을 따라 그리지 않는다). ${t.spineNote ?? ''} `
    + '등뼈는 뽀얀 흰색 마디가 줄지어 있고, 위아래 가시뼈 사이에 얇은 살이 남아 있다. '
    + '살을 다 떠낸 뒤라 등뼈 마디와 위아래 가시뼈가 하나하나 또렷이 보인다 — 살덩이나 필렛처럼 그리지 않는다. '
    + '껍질 · 머리 · 내장 · 도마 · 접시 · 그림자 · 글자 없음. 뼈 하나만, 그림 가로 폭을 가득 채운다. 배경은 단색 흰색.';
}
const KAMA_NOT = '가마살은 생선 몸통을 가로로 썬 토막이 아니다. 아가미 구멍 바로 뒤(아가미뚜껑 뒤 가장자리)와 머리를 떼는 사선 사이에서 떼어 낸, 배 쪽의 덩이다'
  + '(생선구이 집의 「가마구이」 부위). 한쪽 옆구리에서 한 덩이가 나온다. 척추뼈의 둥근 단면 · 몸통의 둥근 단면 · 내장은 보이지 않는다. '
  + '덩이는 원통 토막이 아니라 옆구리 살이 붙은 납작하고 두툼한 판이다 — 껍질 면이 그림의 대부분을 차지하고, 잘린 면은 가장자리를 따라 좁은 띠로만 보인다. '
  + '살 단면에 나이테 같은 둥근 동심원 무늬를 그리지 않는다. ';
const KAMA_END = '한 덩이만 그린다 — 눈 · 입 · 아가미뚜껑 · 머리 · 몸통 · 꼬리 · 도마 · 접시 · 그림자 · 글자 없음. 덩이가 그림을 가득 채운다. 배경은 단색 흰색.';
function kamaText(t, hasPhoto) {
  const form = KAMA_FORM[t.id];
  const refs = hasPhoto
    ? (form === 'tuna'
      ? '첫째 그림은 다랑어 가마살 한 덩이를 껍질 쪽이 보이게 놓은 실제 사진이다(생김새 · 구도 참고 — 이 덩이의 모양을 따른다). '
      : form === 'bill'
        ? '첫째 그림은 다랑어 가마살 한 덩이를 껍질 쪽이 보이게 놓은 실제 사진이다(큰 생선의 가마살이 어떤 덩이인지 참고 — 납작하고 두툼한 판 · 한 변이 오목하게 파였다 · 겉은 거의 다 껍질). '
        : '첫째 그림은 방어 가마살 두 덩이를 껍질 쪽이 보이게 놓은 실제 사진이다(생김새 · 구도 참고 — 그 가운데 한 덩이를 그린다 · 두 덩이를 다 그리지 않는다). ')
      + '둘째 그림은 낚시 게임 손질 화면의 「잘라 낸 생선 머리」 그림이다(화풍 참고 — 진한 윤곽선 · 또렷한 도트). 셋째 그림은 그 어종의 온마리 그림이다(껍질 색 참고).\n'
    : '첫째 그림은 낚시 게임 손질 화면의 「잘라 낸 생선 머리」 그림이다(화풍 · 색 참고). 둘째 그림은 그 어종의 온마리 그림이다.\n';
  const head = refs + `${t.ko}의 「가마살」 한 덩이를 ${STYLE}로 그려라. 껍질 쪽이 보이는 모습이다. ` + KAMA_NOT;
  if (form === 'tuna') {
    return head
      + '모양: 가로로 길쭉하고 두툼한 띠 모양 덩이다(가로가 세로의 두 배쯤). 위쪽 긴 변은 아가미 구멍 자리라 가운데가 안으로 오목하게 파였다. '
      + '아래쪽 긴 변과 양 끝은 칼로 곧게 잘린 면이고, 잘린 면을 따라 살이 가는 띠로 드러난다. '
      + `껍질: 은빛 · 회청색이고 긁힌 자국처럼 은백색 얼룩이 있으며, 한쪽 끝은 등 쪽에 가까워 더 짙은 남색이다(${t.skin}). 비늘은 아주 잘아 매끈해 보인다. `
      + '가슴지느러미는 떼어 내 없다 — 오른쪽 끝 가까이에 지느러미가 붙어 있던 자리가 흰 물렁뼈의 둥근 구멍으로 남아 있다. '
      + `잘린 면의 살 색: ${KAMA[t.id]}. ` + KAMA_END;
  }
  if (form === 'bill') {
    return head
      + '모양: 첫째 그림의 덩이보다 짧고 세모꼴에 가까운 판이다 — 왼쪽이 넓고 오른쪽 아래로 가며 좁아진다. 위쪽 변(앞변)은 아가미 구멍 자리라 안으로 오목하게 파였고, '
      + '나머지 두 변은 칼로 곧게 잘린 면이다. '
      + `잘린 면은 가장자리의 좁은 띠로만 보인다: ${KAMA[t.id]}. `
      + `껍질: 비늘이 없이 매끈하다 — 위쪽은 짙고 아래쪽(배)은 옅다(${t.skin}). `
      + '가슴지느러미는 밑동만 짧게 남기고 잘랐다 — 낫 모양의 딱딱한 지느러미 밑동이 덩이 가운데에 조금 남아 있다. 배지느러미는 없다. '
      + KAMA_END;
  }
  return head
    + '모양: 세모꼴 덩이다. 왼쪽 변(앞변)은 아가미 구멍 자리라 안으로 오목하게 파였고, 그 가장자리를 따라 붉은 살이 가는 테두리로만 드러난다(넓은 단면이 아니다). '
    + '오른쪽 변(뒷변)은 칼로 곧게 잘린 면이고, 아랫변은 배 가운데 선이다. '
    + `껍질: 위쪽 3분의 1쯤은 등 쪽의 짙은 색, 그 아래는 배 쪽의 은백색이다(${t.skin}). `
    + '가슴지느러미 하나가 덩이 가운데에서 오른쪽(꼬리 쪽)으로 뻗어 있다. 오른쪽 아래 모서리에 작은 배지느러미가 붙어 있다. '
    + `잘린 면의 살 색: ${KAMA[t.id]}. ` + KAMA_END;
}
function fleshText(t, k) {
  const [meat, dark] = FLESH[t.id];
  const head = '첫째 그림은 낚시 게임 손질 화면의 「잘라 낸 생선 머리」 그림이다(화풍 참고 — 진한 윤곽선 · 또렷한 도트). 둘째 그림은 그 어종의 온마리 그림이다(어떤 생선인지 참고).\n';
  if (k === 'kamasaku') {
    return head
      + `${t.ko}의 「가마살 횟감」 한 조각을 ${STYLE}로 그려라. 첫째 그림과 같은 화풍이다. `
      + '가마살(아가미 뒤에서 떼어 낸 세모 덩이)에서 가슴지느러미 아래쪽, 내장을 감싸던 뱃살 부분만 도려내고 껍질과 뼈를 떼어 낸 횟감이다: '
      + '손바닥만 한 세모난 살 조각 하나가 비스듬히 위에서 본 모습으로 놓여 있다. 도톰하고, 가장자리는 칼로 반듯하게 잘렸다. '
      + `지방이 많은 뱃살이라 흰 지방 결이 살결을 따라 촘촘히 지나간다. 살 색: ${meat}. 껍질 · 뼈 · 지느러미는 없다 — 살만 있다. `
      + '살 조각 하나만 그린다 — 생선 · 머리 · 칼 · 그릇 · 접시 · 도마 · 그림자 · 글자 없음. 조각이 그림을 가득 채운다. 배경은 단색 흰색.';
  }
  if (k === 'nakaochi') {
    return head
      + `${t.ko}의 「중골 살」 한 무더기를 ${STYLE}로 그려라. 첫째 그림과 같은 화풍이다. `
      + '중골 살은 큰 생선을 해체하고 남은 등뼈에서 숟가락으로 긁어 낸 살이다(일본 요리의 「나카오치」): '
      + '숟가락 자국대로 둥글게 말린 얇은 살점 여러 조각이 소복이 쌓인 낮은 무더기를 비스듬히 위에서 본 모습이다. 다진 고기처럼 곱지 않고, 살점 하나하나의 결이 보인다. '
      + `살 색: ${meat}. 껍질 · 뼈는 없다 — 살만 있다. `
      + '살 무더기 하나만 그린다 — 생선 · 머리 · 숟가락 · 그릇 · 접시 · 도마 · 그림자 · 글자 없음. 무더기가 그림을 가득 채운다. 배경은 단색 흰색.';
  }
  return head
    + `${t.ko}의 「혈합육」 한 줄을 ${STYLE}로 그려라. 첫째 그림과 같은 화풍이다. `
    + '혈합육은 생선 살 덩어리에서 칼로 도려낸 검붉은 살 띠다(일본 요리의 「치아이」 — 옆줄을 따라 붙은 피가 많은 살): '
    + '길쭉하고 단면이 세모꼴인 살 띠 하나가 가로로 길게, 수평으로 반듯하게 놓인 모습이다(기울이지 않는다 — 왼쪽 끝과 오른쪽 끝의 높이가 같다). 가운데가 조금 도톰하고 양 끝이 가늘다. 칼로 자른 면이 매끈하고 살결이 길이 방향으로 나 있다. '
    + `색: ${dark}. 한쪽 가장자리에 그 생선의 보통 살(${meat.split(',')[0].split('(')[0].trim()})이 가는 띠로 조금 붙어 있다. 껍질 · 뼈는 없다. `
    + '살 띠 하나만 그린다 — 생선 · 머리 · 칼 · 그릇 · 접시 · 도마 · 그림자 · 글자 없음. 띠가 그림 가로 폭을 가득 채운다. 배경은 단색 흰색.';
}
const aspectOf = (t, k) => (k === 'chiai' ? '16:9' : k === 'nakaochi' || k === 'kamasaku' ? '4:3' : k === 'kama' ? (KAMA_FORM[t.id] === 'tuna' ? '16:9' : '4:3') : k === 'spine' ? (t.fam === 'halibut' ? '16:9' : '21:9') : t.wideHead ? '16:9' : t.fam === 'halibut' ? '1:1' : '4:3');
/** 그 종류를 그릴 어종인가 — 머리 · 뼈는 원래 어종(사진이 그 어종) 빼고 전부 · 가마살은 해체 어종만(잿방어 포함) */
const wants = (id, t, k) => !t.alias && (k === 'kamasaku' ? !!FLESH[id] && !!KAMA[id] : isFlesh(k) ? !!FLESH[id] : k === 'kama' ? !!KAMA[id] : !t.native);
/** 가마살 화풍 참고 = 그 어종 머리 그림(없으면 어종군 머리 사진) */
const kamaRef = (t) => { const f = path.join(DEST, `${t.id}_head.png`); return fs.existsSync(f) ? f : REF.head[t.fam]; };

// ── 공용 ──
function parseArgs(argv) {
  const P = { out: '', only: null, kinds: DEFAULT_KINDS, model: 'gemini-nano-banana-2.1', jobs: 4, force: false, dry: false, install: false, bake: false, sheet: '', tag: '', kref: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--out') P.out = v();
    else if (a === '--only') P.only = new Set(v().split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--kinds') P.kinds = v().split(',').map((s) => s.trim()).filter((k) => KINDS.includes(k));
    else if (a === '--model') P.model = v();
    else if (a === '--jobs') P.jobs = Math.max(1, +v());
    else if (a === '--force') P.force = true;
    else if (a === '--dry') P.dry = true;
    else if (a === '--install') P.install = true;
    else if (a === '--bake') P.bake = true;
    else if (a === '--sheet') P.sheet = v();
    else if (a === '--tag') P.tag = v();
    else if (a === '--kref') P.kref = v();
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

async function callGemini(parts, P, outFile, aspect) {
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
      if (res.status === 402) throw new Error(`${last} — 크레딧 소진`);
      await sleep((res.status === 429 ? 20000 : 6000) * attempt);
      continue;
    }
    const img = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.inlineData ?? p.inline_data).find((d) => d?.data);
    if (!img) { last = `그림 없음 finish=${j.candidates?.[0]?.finishReason ?? '?'}`; await sleep(3000); continue; }
    const tmp = path.join(os.tmpdir(), `gtr_${path.basename(outFile)}_${process.pid}.dl`);
    fs.writeFileSync(tmp, Buffer.from(img.data, 'base64'));
    execFileSync('convert', [tmp, '-depth', '8', `PNG32:${outFile}`]);
    fs.rmSync(tmp, { force: true });
    const u = j.usageMetadata ?? {};
    return { ok: true, ms: Date.now() - t0, inTok: u.promptTokenCount, outTok: u.candidatesTokenCount };
  }
  return { ok: false, err: last };
}

function targets(P) {
  return Object.entries(SPECIES)
    .filter(([id, t]) => P.kinds.some((k) => wants(id, t, k)) && (!P.only || P.only.has(id)))
    .map(([id, t]) => ({ id, ...t }));
}
function log(P, rec) { fs.appendFileSync(path.join(P.out, '_log.jsonl'), JSON.stringify({ ...rec, at: new Date().toISOString() }) + '\n'); }

async function genOne(t, k, P) {
  const out = path.join(P.out, `${t.id}_${k}${P.tag ? `_${P.tag}` : ''}.png`);
  if (fs.existsSync(out) && !P.force) return 'skip';
  // 333 — 가마살은 사용자가 준 실제 사진을 구도 참고로 맨 앞에(`--kref` — 저장소에 없다). 없으면 글만으로(경고)
  const kphoto = k === 'kama' && P.kref ? path.join(P.kref, KAMA_REF_FILE[KAMA_FORM[t.id]] ?? '') : '';
  const hasPhoto = !!kphoto && fs.existsSync(kphoto) && fs.statSync(kphoto).isFile();
  if (k === 'kama' && !hasPhoto) console.warn(`[경고] ${t.id} 가마살 — 구도 참고 사진 없음(--kref). 몸통 토막처럼 나올 수 있다`);
  const parts = [
    ...(hasPhoto ? [refPart(P.out, kphoto, `kref_${KAMA_FORM[t.id]}_${path.basename(kphoto)}`)] : []),
    k === 'kama' || isFlesh(k) ? refPart(P.out, kamaRef(t), `ref_kama_${t.id}.png`) : refPart(P.out, REF[k][t.fam], `ref_${k}_${t.fam}.png`),
    refPart(P.out, path.join(FISH_SRC, t.fish), t.fish),
    { text: k === 'head' ? headText(t) : k === 'kama' ? kamaText(t, hasPhoto) : isFlesh(k) ? fleshText(t, k) : spineText(t) },
  ];
  const r = await callGemini(parts, P, out, aspectOf(t, k));
  log(P, { id: t.id, kind: k, tag: P.tag, ...r });
  return r.ok ? `${k} ${(r.ms / 1000).toFixed(0)}s` : `${k} 실패(${r.err})`;
}

// ── 실루엣(필렛 도구와 같은 식) ──
let _crops = null;
const crops = () => (_crops ??= require('./pixelize_crops.cjs'));
async function silhouette(file) {
  const { DEFAULTS, decodeAny, cutout } = crops();
  const img = await decodeAny(file);
  const isAlpha = (() => { let n = 0, t = 0; for (let x = 0; x < img.w; x += 4) { t++; if (img.data[x * 4 + 3] < 8) n++; } return n / t > 0.9; })();
  const cut = isAlpha ? { data: img.data } : cutout(img, { ...DEFAULTS, shadow: 0 });
  const d = Buffer.from(cut.data);
  const { w, h } = img;
  const lab = new Int32Array(w * h).fill(-1);
  const sizes = [];
  let id = 0;
  for (let s0 = 0; s0 < w * h; s0++) {
    if (lab[s0] >= 0 || d[s0 * 4 + 3] < 128) continue;
    const st = [s0]; lab[s0] = id; let n = 0;
    while (st.length) {
      const i = st.pop(); n++;
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && lab[j] < 0 && d[j * 4 + 3] >= 128) { lab[j] = id; st.push(j); }
    }
    sizes.push(n); id++;
  }
  // 뼈 그림은 가시 끝이 떨어져 나올 수 있다 — 가장 큰 덩어리의 2% 넘는 덩어리는 함께 남긴다(부스러기만 버린다)
  const big = Math.max(0, ...sizes);
  const keep = sizes.map((n) => n >= big * 0.02);
  let x0 = w, y0 = h, x1 = -1, y1 = -1, kept = 0, total = 0;
  for (let i = 0; i < w * h; i++) {
    const l = lab[i];
    if (l < 0) { d[i * 4 + 3] = 0; continue; }
    total++;
    if (!keep[l]) { d[i * 4 + 3] = 0; continue; }
    kept++;
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { w, h, data: d, bbox: { x0, y0, x1, y1 }, mainFrac: total ? big / total : 0, parts: keep.filter(Boolean).length };
}
function normMask(s, N = 64, M = 48, mirror = false) {
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

// ── 설치 — 배경 벗기기 · 방향 · 격자 ──
async function install(P) {
  const { peelFringe, regrid } = require('./gemini_fish_art.cjs');
  const { encode } = require('./lib_png.cjs');
  fs.mkdirSync(DEST, { recursive: true });
  const refMask = {};
  for (const k of Object.keys(REF)) for (const f of Object.keys(REF[k])) refMask[`${k}_${f}`] = normMask(await silhouette(REF[k][f]));
  let n = 0;
  for (const t of targets({ ...P, kinds: KINDS })) {
    for (const k of P.kinds) {
      if (!wants(t.id, t, k)) continue;
      const src = path.join(P.out, `${t.id}_${k}.png`);
      if (!fs.existsSync(src)) continue;
      const dst = path.join(DEST, `${t.id}_${k}.png`);
      if (fs.existsSync(dst) && !P.force) continue;
      const s = await silhouette(src);
      const pf = peelFringe(s.data, s.w, s.h);
      // 방향 — 구도 참고와 같은 쪽(머리 = 주둥이 왼쪽 / 뼈 = 꼬리 오른쪽): 뒤집은 쪽이 참고와 더 닮았으면 뒤집는다
      //  가마살은 구도 참고 사진이 없다 — 그린 방향 그대로 둔다
      const rm = refMask[`${k}_${t.fam}`];
      const a = rm ? iou(normMask(s), rm) : 0, b = rm ? iou(normMask(s, 64, 48, true), rm) : 0;
      const flip = !!rm && b > a + 0.04;
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
      console.log(`${t.id}_${k}: ${bw}x${bh}${flip ? ' 좌우 뒤집음' : ''} → ${pw}x${ph} (${(bytes / 1024).toFixed(0)}KB · 닮음 ${a.toFixed(2)}/${b.toFixed(2)} · 덩어리 ${s.parts} · 번짐 ${pf.peeled}px)`);
      n++;
    }
  }
  console.log(`${path.relative(ROOT, DEST)}에 ${n}장 → 이제 node tools/gemini_trim_art.cjs --bake`);
}

// ── 굽기 — 게임 아이콘(긴 변 192px · 한 칸 = 1px) + 목록 TS ──
function bake() {
  fs.mkdirSync(PUB, { recursive: true });
  const have = {};
  let n = 0, bytes = 0;
  for (const [id, t] of Object.entries(SPECIES)) {
    for (const k of KINDS) {
      if (!wants(id, t, k)) continue;
      const src = path.join(DEST, `${id}_${k}.png`);
      if (!fs.existsSync(src)) continue;
      const dst = path.join(PUB, `${k}_${id}.png`);
      // 원본은 격자 4px + 둘레 4px 여백 — 여백을 떼고 1/4로(점 표본 = 칸 색 그대로)
      execFileSync('convert', [src, '-shave', '4x4', '-filter', 'point', '-resize', '25%', '-strip', `PNG32:${dst}`]);
      bytes += fs.statSync(dst).size; n++;
      (have[id] ??= []).push(k);
    }
  }
  const alias = Object.fromEntries(Object.entries(SPECIES).filter(([, t]) => t.alias).map(([id, t]) => [id, t.alias]));
  const lines = [
    '/**',
    ' * @file TrimPartArt.ts',
    ' * @description 327차 — 어종별 손질 부산물 그림 목록(머리 · 척추뼈 · 332 가마살 · 332(2) 중골 살 · 혈합육). **자동 생성 — 손으로 고치지 않는다**(`node tools/gemini_trim_art.cjs --bake`).',
    ' *  그림은 `public/trimmings/sp/<종류>_<어종>.png`(긴 변 192px), 텍스처 키는 `trimpart_<종류>_<어종>`.',
    ' */',
    '',
    "export type TrimPartKind = 'head' | 'spine' | 'kama' | 'nakaochi' | 'chiai' | 'kamasaku';",
    '',
    '/** 어종 → 그 어종 그림이 있는 부산물 종류 */',
    'export const TRIM_PART_ART: Readonly<Record<string, readonly TrimPartKind[]>> = {',
    ...Object.keys(have).sort().map((id) => `  ${id}: [${have[id].map((k) => `'${k}'`).join(', ')}],`),
    '};',
    '',
    '/** 같은 생물종(참돔 야간 = 참돔) — 그 어종 그림을 쓴다 */',
    `export const TRIM_PART_ALIAS: Readonly<Record<string, string>> = ${JSON.stringify(alias)};`,
    '',
    '/** 332(2) — 중골 살 · 혈합육 그림을 같이 쓰는 어종 → 그림 주인(살색이 같은 어종) */',
    `export const TRIM_FLESH_OWNER: Readonly<Record<string, string>> = ${JSON.stringify(FLESH_OWNER)};`,
    '',
  ];
  fs.writeFileSync(OUT_TS, lines.join('\n'));
  console.log(`${path.relative(ROOT, PUB)}에 ${n}장(${(bytes / 1024).toFixed(0)}KB) · ${path.relative(ROOT, OUT_TS)} — 어종 ${Object.keys(have).length}`);
}

// ── 검수 시트 ──
function sheet(P) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gtr_sheet_'));
  for (const k of P.kinds) {
    const args = [];
    for (const t of targets(P)) {
      const f = path.join(P.out, `${t.id}_${k}${P.tag ? `_${P.tag}` : ''}.png`);
      if (!wants(t.id, t, k) || !fs.existsSync(f)) continue;
      args.push('-label', `${t.ko} ${t.id}`, f);
    }
    if (!args.length) continue;
    const dst = P.sheet.replace(/\.png$/, `_${k}.png`);
    // 한글 글꼴은 unifont뿐이다(컨테이너) — 없으면 montage 기본 글꼴(이름이 깨질 수 있다)
    const FONT = '/usr/share/fonts/opentype/unifont/unifont.otf';
    const font = fs.existsSync(FONT) ? ['-font', FONT] : [];
    execFileSync('montage', [...args, ...font, '-pointsize', '16', '-background', '#f4f1ea', '-tile', k === 'spine' ? '4x' : k === 'kama' ? '5x' : isFlesh(k) ? '3x' : '6x', '-geometry', k === 'spine' ? '380x120+5+5' : k === 'chiai' ? '320x180+5+5' : '210x170+5+5', dst]);
    console.log(dst);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  if (P.bake) { bake(); return; }
  fs.mkdirSync(P.out, { recursive: true });
  if (P.install) { await install(P); return; }
  if (P.sheet) { sheet(P); return; }
  const jobs = [];
  for (const t of targets(P)) for (const k of P.kinds) if (wants(t.id, t, k)) jobs.push([t, k]);
  console.log(`대상 ${targets(P).length}종 · 종류 ${P.kinds.join(',')} · 그림 ${jobs.length}장 · 모델 ${P.model} · 동시 ${P.jobs}`);
  if (P.dry) {
    const t = targets(P)[0];
    console.log(P.kinds.some(isFlesh) ? P.kinds.filter(isFlesh).map((k) => fleshText(t, k)).join('\n\n') : P.kinds.includes('kama') ? kamaText(t, !!P.kref) : `${headText(t)}\n\n${spineText(t)}`);
    return;
  }
  let next = 0, done = 0, stop = false;
  const worker = async () => {
    while (next < jobs.length && !stop) {
      const [t, k] = jobs[next++];
      try { const r = await genOne(t, k, P); done++; if (r !== 'skip') console.log(`[${done}/${jobs.length}] ${t.id} — ${r}`); }
      catch (e) { done++; console.log(`[${done}/${jobs.length}] ${t.id} ${k} — 오류 ${e.message}`); if (/크레딧|403/.test(e.message)) stop = true; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(P.jobs, jobs.length) }, worker));
  console.log(stop ? '멈춤(크레딧 · 권한)' : '끝');
}

module.exports = { SPECIES, KINDS };
if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
