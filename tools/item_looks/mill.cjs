/**
 * @file mill.cjs
 * @description 284차 — 방앗간 · 밭 부산물 그림(기름병 · 방앗간 양념 · 깻묵 · 깻대 · 콩대 · 보릿짚 · 옥수숫대 · 검불 · 폐배지 · 곡물 봉투). 15종.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/mill.cjs --out <폴더>`
 *  · 설치 `--install` → `food assets/items/<파일>` → `node tools/item_cards.cjs`.
 *
 *  새 아이템이라 옛 그림 키가 없다 — 키는 `item_<id>`, 어느 아이템이 쓰는지는 `ids`(`ITEM_IMAGE_BY_ID`).
 *  기름병 넷(`oil_<참깨|들깨>_<180|350>` — core `rules/OilMill.ts`)은 방앗간에서 짜 담아 주는 **라벨 없는 투명 유리병**이다.
 *   - 기름 두 가지는 뚜껑 색 + 기름 빛깔로 가른다(64px 칸에서) — 참기름 = 빨간 뚜껑 · 진한 호박색 / 들기름 = 초록 뚜껑 · 연한 금빛 연둣빛.
 *   - 180ml · 350ml는 그림이 긴 변에 맞춰 같은 크기로 그려지므로 **생김새**로 가른다 — 180 = 작고 땅딸막한 병 · 짧은 목 /
 *     350 = 키가 크고 날씬한 병 · 긴 목.
 *  1큰술 양념 셋(`cook_perilla_oil` · `cook_perilla_powder` · `cook_sesame_salt`)은 식자재 양념과 같은 틀(`food.cjs` —
 *   「1큰술」 단위지만 그림은 그 양념의 병 · 봉지 · 통)이다 — 들기름 = 참기름병(`art_sesame_oil`)과 같은 병 · 연한 기름 · 초록 띠 /
 *   들깨가루 = 고춧가루처럼 투명 지퍼 봉지 / 깨소금 = 다진마늘처럼 뚜껑 반쯤 연 작은 통. 방앗간 기름병(라벨 없음 · 플라스틱 뚜껑)과 겹치지 않는다.
 *  밭 부산물(`res_*` — core `db-schema/FarmResidues.ts`)은 볏짚(`farm.cjs` `item_straw`)과 같은 식물 화풍 참고를 쓴다.
 *   보릿짚은 볏짚과 갈리게 더 밝고 매끈한 연노랑 · 까락이 남은 빈 이삭.
 *  곡물 봉투(`farm_grain_bag` · 16px 키 `px:it_grain_bag`)는 낟알 봉지 초상(`crop_<깨 · 콩 · 보리>_b<g>` — `gemini_crop_art.cjs --set bag`)과 같은
 *   크라프트 지퍼 봉투의 빈 것이다.
 */
'use strict';

/** 화풍 참고(ROOT 기준) — 포장된 물건 · 봉지 · 병 */
const REF_PACK = ['food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png', 'food assets/tackle/it_krill_box.png'];
/** 식물 · 짚 */
const REF_PLANT = ['food assets/crops/asis/crop_strawberry.png', 'food assets/crops/asis/crop_lettuce.png', 'food assets/crops/asis/crop_potato.png'];
/** 덩어리 음식 · 흙 */
const REF_FOOD = ['packages/client-pc/public/food/stew_red_whole.png', 'food assets/crops/asis/crop_potato.png', 'food assets/tackle/it_krill_block.png'];
/** 들기름 1큰술 — 참기름(`art_sesame_oil`) 그림을 첫 장으로(같은 병) */
const REF_SESAME_OIL = ['food assets/items/sesame_oil.png', 'food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png'];
/** 들깨가루 — 고춧가루 봉지를 첫 장으로(같은 봉지) */
const REF_POWDER = ['food assets/items/gochugaru.png', 'food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png'];
/** 깨소금 — 다진마늘 통을 첫 장으로(같은 통) */
const REF_TUB = ['food assets/items/garlic_minced.png', 'food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png'];

const WHITE = '흰 부분도 진한 윤곽선과 연회색 그늘로 또렷하게.';
/** 방앗간 기름병 — 라벨 없는 투명 유리병 */
const MILL_BOTTLE = '방앗간에서 짜 담아 주는 라벨 없는 투명한 유리 기름병 한 병';
const SMALL = '작은 병(180ml) — 키가 낮고 땅딸막한 둥근 병으로, 높이는 폭의 두 배쯤이고 둥근 어깨 위에 짧은 목이 있다.';
const LARGE = '큰 병(350ml) — 키가 크고 날씬한 둥근 병으로, 높이는 폭의 세 배가 넘고 완만한 어깨 위로 길쭉한 목이 올라간다.';

const item = (id, file, nameKo, nameEn, aspect, refs, look, opt = {}) => ({ ids: [id], file, nameKo, nameEn, aspect, refs, look, ...opt });

module.exports = {
  // ── 방앗간 기름병 4(뚜껑 색 · 기름 빛깔 = 기름 / 생김새 = 크기) ──
  item_oil_sesame_180: item('oil_sesame_180', 'oil_sesame_180.png', '참기름 (180ml 병)', 'Sesame oil (180ml bottle)', '3:4', REF_PACK,
    `${MILL_BOTTLE}. ${SMALL} 병 속에는 맑고 진한 호박색 · 적갈색 참기름이 목 아래까지 가득 차 빛을 받아 반짝인다. `
    + '뚜껑은 빨간 플라스틱 돌림 뚜껑. 라벨 · 스티커 · 띠 · 글자 없음 — 유리와 기름만. 세워 놓고 비스듬히 위에서 본 모습.', { keepWhite: true }),
  item_oil_sesame_350: item('oil_sesame_350', 'oil_sesame_350.png', '참기름 (350ml 병)', 'Sesame oil (350ml bottle)', '3:4', REF_PACK,
    `${MILL_BOTTLE}. ${LARGE} 병 속에는 맑고 진한 호박색 · 적갈색 참기름이 목 아래까지 가득 차 빛을 받아 반짝인다. `
    + '뚜껑은 빨간 플라스틱 돌림 뚜껑. 라벨 · 스티커 · 띠 · 글자 없음 — 유리와 기름만. 세워 놓고 비스듬히 위에서 본 모습.', { keepWhite: true }),
  item_oil_perilla_180: item('oil_perilla_180', 'oil_perilla_180.png', '들기름 (180ml 병)', 'Perilla oil (180ml bottle)', '3:4', REF_PACK,
    `${MILL_BOTTLE}. ${SMALL} 병 속에는 맑고 연한 금빛 · 살짝 연둣빛이 도는 노란 들기름이 목 아래까지 가득 차 있다(참기름보다 훨씬 밝고 옅다). `
    + '뚜껑은 초록 플라스틱 돌림 뚜껑. 라벨 · 스티커 · 띠 · 글자 없음 — 유리와 기름만. 세워 놓고 비스듬히 위에서 본 모습.', { keepWhite: true }),
  item_oil_perilla_350: item('oil_perilla_350', 'oil_perilla_350.png', '들기름 (350ml 병)', 'Perilla oil (350ml bottle)', '3:4', REF_PACK,
    `${MILL_BOTTLE}. ${LARGE} 병 속에는 맑고 연한 금빛 · 살짝 연둣빛이 도는 노란 들기름이 목 아래까지 가득 차 있다(참기름보다 훨씬 밝고 옅다). `
    + '뚜껑은 초록 플라스틱 돌림 뚜껑. 라벨 · 스티커 · 띠 · 글자 없음 — 유리와 기름만. 세워 놓고 비스듬히 위에서 본 모습.', { keepWhite: true }),

  // ── 1큰술 양념 3(식자재 양념과 같은 틀 — 병 · 봉지 · 통) ──
  item_cook_perilla_oil: item('cook_perilla_oil', 'perilla_oil.png', '들기름', 'Perilla oil', '3:4', REF_SESAME_OIL,
    '들기름 한 병 — 첫 번째 참고 그림의 참기름병과 똑같은 병(작고 목이 긴 투명 유리병 · 금색 금속 마개 · 몸통에 크림색 라벨)인데, '
    + '병 속 기름은 맑고 연한 금빛 · 살짝 연둣빛이 도는 노랑으로 참기름보다 훨씬 밝고 옅다. 병목 띠는 초록, 라벨에는 작고 둥근 회갈색 들깨 알 그림(글자 없음). '
    + '세워 놓고 비스듬히 위에서 본 모습.', { keepWhite: true }),
  item_cook_perilla_powder: item('cook_perilla_powder', 'perilla_powder.png', '들깨가루', 'Perilla seed powder', '3:4', REF_POWDER,
    '들깨가루 한 봉지 — 첫 번째 참고 그림의 고춧가루 봉지와 같은 투명 지퍼 비닐 봉지에 회색빛 베이지 · 연한 회갈색의 거칠게 간 들깨가루가 가득 차 불룩하다'
    + '(고운 밀가루가 아니라 껍질 조각이 섞인 굵은 가루 · 군데군데 짙은 갈색 점). 위쪽 지퍼 입구에 초록 테 한 줄, '
    + '봉지 앞면 위쪽에 작고 둥근 회갈색 들깨 알 몇 개 그림이 있는 흰 띠(글자 없음).', { keepWhite: true }),
  item_cook_sesame_salt: item('cook_sesame_salt', 'sesame_salt.png', '깨소금', 'Roasted sesame salt', '1:1', REF_TUB,
    '깨소금 한 통 — 첫 번째 참고 그림의 다진마늘 통과 같은 작고 납작한 원통형 반투명 플라스틱 통. 주황빛 노란 뚜껑을 반쯤 열어 비스듬히 걸쳐 두어, '
    + '통 안에 노릇노릇 볶아 반쯤 빻은 황금빛 · 연갈색 참깨(납작한 물방울 모양 알과 부서진 조각)가 소복이 찬 것이 보이고 사이사이 흰 소금 알갱이가 반짝인다. '
    + '통 옆면에 노란 띠와 작은 참깨 알 그림(글자 없음).', { keepWhite: true }),

  // ── 방앗간 부산물 ──
  item_farm_oilcake: item('farm_oilcake', 'farm_oilcake.png', '깻묵', 'Pressed oil cake (kkaemuk)', '4:3', REF_FOOD,
    '방앗간에서 기름을 짜고 남은 깻묵 한 덩이 — 짙은 갈색 · 검갈색으로 단단히 눌린 납작하고 둥근 판(접시만 한 크기 · 두께는 손가락 한 마디). '
    + '겉에 눌려 뭉개진 깨 알갱이 결과 기름기 도는 은은한 윤이 있고, 둥근 판 한쪽 가장자리가 부서져 떨어져 나간 작은 조각 두어 개가 바로 옆에 놓였다. '
    + '비스듬히 위에서 본 모습.'),

  // ── 밭 부산물(밭에 넣기 · 짚 덮기) ──
  item_res_sesame_stalk: item('res_sesame_stalk', 'res_sesame_stalk.png', '깻대', 'Dried sesame stalks', '1:1', REF_PLANT,
    '깨를 털고 남은 마른 깻대 한 단 — 곧고 가는 마른 갈색 줄기 열댓 대를 가지런히 모아 가운데를 새끼줄로 묶어 대각선으로 눕혔다. '
    + '줄기는 네모진 단면에 마디가 있고, 위쪽 절반에 씨를 털어 낸 빈 꼬투리가 다닥다닥 붙어 있다 — 꼬투리는 손가락 한 마디 길이의 통통한 원통형 연갈색 껍질로 '
    + '줄기보다 굵어 또렷이 보이고, 끝이 네 갈래로 쩍 벌어져 속이 비었다. 잎 · 씨 없음.'),   // 1차는 꼬투리가 안 보여 막대 다발이었다
  item_res_bean_stalk: item('res_bean_stalk', 'res_bean_stalk.png', '콩대', 'Dried soybean stalks', '1:1', REF_PLANT,
    '콩을 털고 남은 마른 콩대 한 단 — 짧게 가지를 친 짙은 갈색 마른 콩 줄기 대여섯 포기를 새끼줄로 묶어 대각선으로 눕혔다. '
    + '가지마다 둘로 쪼개져 비틀린 빈 콩깍지(연갈색 · 보송한 잔털)가 매달려 있다. 잎 · 콩알 없음.'),
  item_res_barley_straw: item('res_barley_straw', 'res_barley_straw.png', '보릿짚', 'Barley straw', '1:1', REF_PLANT,
    '보릿짚 한 단 — 매끈하고 윤이 나는 밝은 연노랑 보릿짚 줄기를 한 아름 가지런히 모아 가운데를 새끼줄로 두 바퀴 묶어 대각선으로 눕혔다. '
    + '한쪽 끝은 가지런히 자른 밑동(속이 빈 동그란 줄기 단면들), 다른 끝은 낟알을 턴 빈 이삭에 길고 뻣뻣한 까락(가시 같은 수염)이 부채처럼 뻗어 있다. '
    + '볏짚보다 줄기가 굵고 밝으며 반짝인다.'),
  item_res_corn_stalk: item('res_corn_stalk', 'res_corn_stalk.png', '옥수숫대', 'Dried corn stalks', '1:1', REF_PLANT,
    '옥수수를 따고 남은 마른 옥수숫대 세 대를 끈으로 묶은 다발을 대각선으로 눕혔다 — 굵고 마디진 누런 · 연갈색 줄기에 '
    + '길고 넓은 마른 잎(가장자리가 말리고 바스락거리는 황갈색)이 늘어져 있고, 위 끝에 마른 수꽃 이삭. 옥수수 자루 · 알 없음.'),
  item_res_chaff: item('res_chaff', 'res_chaff.png', '검불', 'Chaff', '4:3', REF_PLANT,
    '키질로 날려 낸 검불 한 무더기 — 마른 깍지 · 부서진 꼬투리 조각 · 겨 · 가는 줄기 부스러기가 섞인 가볍고 푸석한 연갈색 · 누런 작은 더미. '
    + '알곡은 없다. 부스러기가 소복이 쌓여 가장자리로 갈수록 성기다.'),
  item_res_spent_substrate: item('res_spent_substrate', 'res_spent_substrate.png', '폐배지', 'Spent mushroom substrate', '1:1', REF_FOOD,
    '버섯을 다 따고 남은 폐배지 한 덩이 — 톱밥을 다져 만든 원통형 버섯 배지(비닐을 벗긴 덩어리)로, 연갈색 · 짙은 갈색 톱밥 결 위에 '
    + '흰 균사가 솜처럼 얼룩져 퍼져 있다. 윗면에 버섯을 딴 자국 몇 군데, 한쪽 모서리가 부슬부슬 허물어져 톱밥 부스러기가 조금 흘렀다. 버섯은 없다.'),

  // ── 곡물 봉투(빈 것) ──
  item_farm_grain_bag: { ids: ['farm_grain_bag'], px: ['px:it_grain_bag'], file: 'farm_grain_bag.png', nameKo: '곡물 봉투', nameEn: 'Empty zip-top grain bag',
    aspect: '3:4', refs: REF_PACK,
    look: '빈 곡물 봉투 하나 — 크라프트 종이로 만든 지퍼 곡물 봉투(위에 지퍼 입구 · 바닥 접힘 · 앞면 가운데에 큰 투명 직사각형 창)를 '
      + '납작하게 접어 눕혀 놓았다. 비어 있어서 투명 창 너머로 봉투 안쪽의 연한 갈색 종이 면이 비치고, 바닥 접힘선과 옆 주름이 보인다. 낟알 · 라벨 · 글자 없음.' },
};
