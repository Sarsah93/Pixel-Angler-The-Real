/**
 * @file cure.cjs
 * @description 285차 — 생기름 병 넷 · 갈무리해 나온 것 넷(말린 시래기 · 옥수수수염차 · 깻잎 · 콩잎 장아찌) · 갈무리 설비 둘(건조 걸대 · 장독). 10종.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/cure.cjs --out <폴더>`
 *  · 설치 `--install` → `food assets/items/<파일>` → `node tools/item_cards.cjs`.
 *
 *  - 생기름 병(`oil_<참깨|들깨>_raw_<180|350>` — core `rules/OilMill.ts`)은 284차 방앗간 병(`mill.cjs`)과 같은 라벨 없는 투명 유리병이다.
 *    볶은 기름과 64px 칸에서 갈리게 **흰 뚜껑 + 병목에 묶은 갈색 종이 꼬리표(글자 없음)** · 기름은 훨씬 연하고 맑다.
 *    참깨 생기름 = 연한 밀짚빛 금색 / 들깨 생기름 = 거의 투명한 연둣빛 노랑. 크기는 생김새로 가른다(180 땅딸막 · 350 날씬).
 *  - 갈무리해 나온 것(`cure_*` — core `rules/HomeCure.ts` `CURE_ITEMS`) · 설비(`farm_drying_rack` · `farm_crock` — 16px 키는 `it_drying_rack` · `it_crock`).
 */
'use strict';

/** 화풍 참고(ROOT 기준) — 포장된 물건 · 병 */
const REF_PACK = ['food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png', 'food assets/tackle/it_krill_box.png'];
/** 284차 방앗간 병을 첫 장으로(같은 병) */
const REF_MILL_SMALL = ['food assets/items/oil_sesame_180.png', 'food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png'];
const REF_MILL_LARGE = ['food assets/items/oil_sesame_350.png', 'food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png'];
/** 식물 · 말린 잎 */
const REF_PLANT = ['food assets/crops/asis/crop_strawberry.png', 'food assets/crops/asis/crop_lettuce.png', 'food assets/crops/asis/crop_potato.png'];
/** 반찬 · 음식 */
const REF_FOOD = ['packages/client-pc/public/food/stew_red_whole.png', 'food assets/crops/asis/crop_strawberry.png', 'food assets/tackle/it_krill_block.png'];
/** 나무 · 설비 */
const REF_WOOD = ['food assets/items/farm_stake.png', 'food assets/items/sprout_jar.png', 'food assets/tackle/it_krill_box.png'];

const RAW_BOTTLE = '방앗간에서 볶지 않은 깨를 짜 담아 준 라벨 없는 투명한 유리 기름병 한 병';
const SMALL = '작은 병(180ml) — 첫 번째 참고 그림의 병과 같은 모양: 키가 낮고 땅딸막한 둥근 병으로, 높이는 폭의 두 배쯤이고 둥근 어깨 위에 짧은 목이 있다.';
const LARGE = '큰 병(350ml) — 첫 번째 참고 그림의 병과 같은 모양: 키가 크고 날씬한 둥근 병으로, 높이는 폭의 세 배가 넘고 완만한 어깨 위로 길쭉한 목이 올라간다.';
const RAW_CAP = '뚜껑은 흰 플라스틱 돌림 뚜껑이고, 병목에 갈색 크라프트 종이 꼬리표 하나를 노끈으로 묶어 늘어뜨렸다(꼬리표에 글자 없음).';
const RAW_TAIL = '라벨 · 스티커 · 글자 없음 — 유리 · 기름 · 꼬리표만. 세워 놓고 비스듬히 위에서 본 모습.';
const SESAME_RAW = '병 속에는 볶지 않아 아주 연하고 맑은 밀짚빛 금색 참기름이 목 아래까지 가득 차 있다(볶은 참기름의 진한 호박색과 전혀 다르게 밝다).';
const PERILLA_RAW = '병 속에는 볶지 않아 거의 투명한 연둣빛 노랑 들기름이 목 아래까지 가득 차 있다(물처럼 맑고 아주 옅다).';

const item = (id, file, nameKo, nameEn, aspect, refs, look, opt = {}) => ({ ids: [id], file, nameKo, nameEn, aspect, refs, look, ...opt });

module.exports = {
  // ── 생기름 병 4 ──
  item_oil_sesame_raw_180: item('oil_sesame_raw_180', 'oil_sesame_raw_180.png', '생참기름 (180ml 병)', 'Raw sesame oil (180ml bottle)', '3:4', REF_MILL_SMALL,
    `${RAW_BOTTLE}. ${SMALL} ${SESAME_RAW} ${RAW_CAP} ${RAW_TAIL}`, { keepWhite: true }),
  item_oil_sesame_raw_350: item('oil_sesame_raw_350', 'oil_sesame_raw_350.png', '생참기름 (350ml 병)', 'Raw sesame oil (350ml bottle)', '3:4', REF_MILL_LARGE,
    `${RAW_BOTTLE}. ${LARGE} ${SESAME_RAW} ${RAW_CAP} ${RAW_TAIL}`, { keepWhite: true }),
  item_oil_perilla_raw_180: item('oil_perilla_raw_180', 'oil_perilla_raw_180.png', '생들기름 (180ml 병)', 'Raw perilla oil (180ml bottle)', '3:4', REF_MILL_SMALL,
    `${RAW_BOTTLE}. ${SMALL} ${PERILLA_RAW} ${RAW_CAP} ${RAW_TAIL}`, { keepWhite: true }),
  item_oil_perilla_raw_350: item('oil_perilla_raw_350', 'oil_perilla_raw_350.png', '생들기름 (350ml 병)', 'Raw perilla oil (350ml bottle)', '3:4', REF_MILL_LARGE,
    `${RAW_BOTTLE}. ${LARGE} ${PERILLA_RAW} ${RAW_CAP} ${RAW_TAIL}`, { keepWhite: true }),

  // ── 갈무리해 나온 것 4 ──
  item_cure_siraegi: item('cure_siraegi', 'cure_siraegi.png', '말린 시래기 (한 타래)', 'Dried siraegi (a coil)', '1:1', REF_PLANT,
    '바싹 말린 시래기 한 타래 — 무청 잎줄기 여러 가닥을 새끼줄에 엮어 둥글게 감아 묶은 다발. 마른 잎은 쪼그라들고 바스락거리는 칙칙한 올리브 녹색 · 누런 풀빛 · '
    + '군데군데 갈색이고, 잎줄기는 가늘게 말라 쭈글쭈글하다(싱싱한 초록이 아니다). 연갈색 새끼줄이 다발을 감고 위쪽에 거는 고리가 하나 있다. 비스듬히 위에서 본 모습.'),
  item_cure_corn_silk_tea: item('cure_corn_silk_tea', 'cure_corn_silk_tea.png', '옥수수수염차 (10g 한 봉)', 'Corn silk tea (one 10g pack)', '3:4', REF_PACK,
    '덖은 옥수수수염 한 봉 — 손바닥만 한 투명 지퍼 비닐 봉지에 노릇하게 덖은 옥수수수염(가늘고 곱슬곱슬한 실 같은 섬유 뭉치 · 진한 황금빛 갈색 · 군데군데 짙은 갈색)이 '
    + '폭신하게 차 있다. 봉지 위쪽에 노란 테 한 줄, 앞면 아래에 작은 옥수수 자루 그림이 있는 흰 띠(글자 없음).', { keepWhite: true }),
  item_cure_pickle_perilla: item('cure_pickle_perilla', 'cure_pickle_perilla.png', '깻잎 장아찌 (10장)', 'Pickled perilla leaves (10 leaves)', '4:3', REF_FOOD,
    '깻잎 장아찌 열 장 — 작고 납작한 투명 플라스틱 반찬통(뚜껑은 열어 옆에 비스듬히 걸쳐 둠)에 간장물에 삭혀 짙은 녹갈색 · 거무스름하게 윤기 나는 깻잎이 '
    + '켜켜이 포개져 있다(톱니 가장자리 · 잎맥이 보인다). 잎 사이사이 얇게 썬 붉은 고추 · 마늘 편 몇 조각, 통 바닥에 갈색 간장물이 조금 고였다. 비스듬히 위에서 본 모습.'),
  item_cure_pickle_bean_leaf: item('cure_pickle_bean_leaf', 'cure_pickle_bean_leaf.png', '콩잎 장아찌 (10장)', 'Pickled soybean leaves (10 leaves)', '4:3', REF_FOOD,
    '경상도식 콩잎 장아찌 열 장 — 작고 납작한 투명 플라스틱 반찬통(뚜껑은 열어 옆에 비스듬히 걸쳐 둠)에 소금물에 삭혀 노랗게 단풍 든 콩잎(둥근 달걀꼴 · 끝이 뾰족한 '
    + '세 장 겹잎 낱장 · 황금빛 노랑에 연갈색 얼룩)을 켜켜이 포개고, 잎 사이사이에 붉은 고춧가루 · 다진 마늘 양념을 발랐다. 노란 잎과 붉은 양념이 줄무늬처럼 번갈아 보인다. '
    + '비스듬히 위에서 본 모습.'),

  // ── 갈무리 설비 2 ──
  item_farm_drying_rack: { ids: ['farm_drying_rack'], px: ['px:it_drying_rack'], file: 'farm_drying_rack.png', nameKo: '건조 걸대', nameEn: 'Drying rack',
    aspect: '1:1', refs: REF_WOOD,
    look: '텃밭 처마 밑에 세우는 나무 건조 걸대 하나 — 껍질 벗긴 연갈색 통나무 기둥 두 개가 A자로 벌어져 서고, 그 사이에 가로 장대(대나무) 세 줄을 노끈으로 묶어 걸었다. '
      + '가로 장대마다 빈 새끼줄 고리 몇 개가 늘어져 있다(아무것도 걸리지 않은 빈 걸대). 비스듬히 앞에서 본 모습.' },
  item_farm_crock: { ids: ['farm_crock'], px: ['px:it_crock'], file: 'farm_crock.png', nameKo: '장독 (옹기 20L)', nameEn: 'Crock (20L onggi)',
    aspect: '1:1', refs: REF_WOOD,
    look: '한국 전통 옹기 장독 하나(20L) — 어깨가 넓고 배가 불룩하며 아래로 좁아지는 짙은 고동색 · 검붉은 갈색 유약 항아리. 유약이 은은하게 윤이 나고 '
      + '어깨에 손가락으로 그은 듯한 물결무늬 한 줄. 위에는 같은 옹기 뚜껑(둥근 꼭지)을 덮었다. 비스듬히 위에서 본 모습.' },
};
