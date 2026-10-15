/**
 * @file sets.cjs
 * @description 255차 — 텃밭 영양번식 재료 그림(씨감자 · 순 · 종구 · 종근 · 버섯 배지 — 16px 손그림 `px:set_<작물>` → Gemini 그림). 16종.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/sets.cjs --out <폴더>`
 *  · 설치 `--install` → `food assets/items/set_<작물>.png` → `node tools/item_cards.cjs`.
 *
 *  그림 한 장 = 가게에서 파는 한 단위다 — 씨감자 조각 셋 · 순 네 줄기 한 다발 · 마늘 쪽 한 자루 · 종근 두세 덩이(`count`).
 *  수확물 초상과 헷갈리지 않게 「심을 것」의 표지(자른 단면 · 싹눈 · 잔뿌리 · 묶음 끈 · 배지 비닐)를 꼭 넣는다.
 *  버섯 배지 · 마늘 자루는 포장 참고 그림(`REF_PACK`)을 쓴다. 흰 물건(초석잠 · 노루궁뎅이 배지)은 `keepWhite`.
 */
'use strict';

const REF_PLANT = ['food assets/crops/asis/crop_strawberry.png', 'food assets/crops/asis/crop_lettuce.png', 'food assets/crops/asis/crop_potato.png'];
const REF_PACK = ['food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png', 'food assets/tackle/it_krill_box.png'];

const set = (crop, nameKo, nameEn, look, opt = {}) => ({
  px: [`px:set_${crop}`], file: `set_${crop}.png`, nameKo, nameEn, aspect: '1:1', refs: REF_PLANT, look, ...opt,
});

module.exports = {
  // ── 덩이 · 뿌리줄기 ──
  item_set_potato: set('potato', '씨감자 조각', 'Seed potato pieces',
    '심으려고 자른 씨감자 조각. 황갈색 껍질의 감자를 크게 자른 덩이라 한 면은 연노란 감자 속살 단면(살짝 말라 있음)이고, '
    + '껍질 쪽에는 움푹한 눈과 거기서 막 돋은 짧고 통통한 보랏빛 · 연초록 싹이 있다.', { count: 3 }),
  item_set_taro: set('taro', '종토란', 'Seed taro corms',
    '심을 종토란. 갈색 털 같은 껍질에 둥근 고리 무늬가 겹겹이 있는 동그란 토란 알이고, 위쪽 끝에 분홍빛 도는 뾰족한 싹눈이 짧게 돋았다.', { count: 3 }),
  item_set_ginger: set('ginger', '종강 (씨생강)', 'Seed ginger',
    '심을 씨생강 덩이. 손가락처럼 울퉁불퉁 갈라진 연한 황갈색 생강 뿌리줄기로, 고리 무늬 마디마다 분홍빛 · 연두빛 싹눈이 볼록 돋았다.', { count: 2 }),
  item_set_choseokjam: set('choseokjam', '초석잠 종근', 'Chinese artichoke seed tubers',
    '심을 초석잠 덩이줄기. 마디가 잘록잘록 감긴 작고 흰 누에(애벌레) 모양 덩이줄기로, 아이보리 흰색에 마디 골이 연한 갈색 그늘로 보인다. 작은 더미로 모았다.',
    { count: 6, keepWhite: true }),
  item_set_jerusalem: set('jerusalem', '돼지감자 종괴', 'Jerusalem artichoke seed tubers',
    '심을 돼지감자(뚱딴지) 덩이줄기. 생강처럼 울퉁불퉁 혹이 난 연갈색 · 자줏빛 껍질의 덩이줄기로, 둥근 혹 끝 몇 군데에 '
    + '뭉툭하고 짧은 분홍빛 싹눈(가시처럼 뾰족하지 않고 동그스름한 눈)이 볼록 돋았다.', { count: 3 }),
  item_set_myoga: set('myoga', '양하 뿌리줄기', 'Myoga ginger rhizomes',
    '심을 양하 뿌리줄기 토막. 마디진 연한 황갈색 뿌리줄기(생강보다 가늘고 길다)로 마디마다 가는 잔뿌리가 나 있고, '
    + '한쪽 끝에 분홍빛 자줏색 비늘잎에 싸인 뾰족한 새싹이 돋았다.', { count: 2 }),
  item_set_meowi: set('meowi', '머위 땅속줄기', 'Butterbur runners',
    '심을 머위 땅속줄기. 연필 굵기의 길고 마디진 연한 미색 · 연자줏빛 줄기로, 마디마다 가는 잔뿌리와 작은 연두빛 싹눈이 있다. 서로 살짝 겹쳐 놓였다.',
    { count: 3 }),
  item_set_turmeric: set('turmeric', '울금 종근', 'Turmeric seed rhizomes',
    '심을 울금 뿌리줄기. 생강처럼 생긴 갈색 뿌리줄기(가로 고리 무늬 마디)이고, 그중 하나는 잘려 선명한 주황색 단면이 보인다. 마디에 작은 싹눈.',
    { count: 2 }),

  // ── 알뿌리 ──
  item_set_scallion: set('scallion', '쪽파 종구', 'Scallion seed bulbs',
    '심을 쪽파 종구(씨쪽파) 알뿌리. 작은 양파처럼 생긴 갸름한 알뿌리로, 겉은 얇은 적갈색 · 황갈색 껍질, 위쪽 끝은 말라 뾰족하고 '
    + '밑동에 마른 잔뿌리 자국이 있다. 한두 알은 위 끝에서 연초록 싹이 짧게 나왔다. 작은 더미로 모았다.', { count: 6 }),
  item_set_garlic: set('garlic', '마늘 종구 (40쪽)', 'Seed garlic cloves in a mesh bag',
    '그물코가 성긴 빨간 그물망 자루 하나에 마늘 쪽(낱쪽) 수십 개를 담고 위를 끈으로 묶은 작은 자루. '
    + '가는 그물 줄 사이로 속의 마늘 쪽이 또렷하다 — 쪽마다 미색 · 흰 껍질에 연자줏빛 세로 줄이 있고, 위는 뾰족하고 밑동은 납작한 물방울 모양. '
    + '통마늘이 아니라 낱쪽.', { refs: REF_PACK }),

  // ── 줄기 꽂이 ──
  item_set_sweet_potato: set('sweet_potato', '고구마순 4줄기', 'Sweet potato slips (4 cuttings)',
    '고구마 삽수(순) 네 줄기를 밑동에서 고무줄 하나로 묶은 작은 다발. 줄기는 한 뼘 길이의 초록 줄기(마디에 살짝 붉은 기)이고, '
    + '하트 모양 초록 잎 4~5장이 어긋나게 달렸다. 뿌리 없이 잘린 밑동이 가지런하다. 줄기는 꼭 네 대.'),
  item_set_pumpkin_sweet_potato: set('pumpkin_sweet_potato', '호박고구마순 4줄기', 'Pumpkin sweet potato slips (4 cuttings)',
    '호박고구마 삽수(순) 네 줄기를 밑동에서 고무줄 하나로 묶은 작은 다발. 줄기는 한 뼘 길이의 진한 자주색이고, '
    + '잎은 세 갈래로 얕게 갈라진 하트 모양(잎맥 · 가장자리가 자줏빛인 짙은 초록)이다. 뿌리 없이 잘린 밑동이 가지런하다. 줄기는 꼭 네 대.'),
  item_set_water_parsley: set('water_parsley', '미나리 줄기', 'Water parsley cuttings',
    '심을 미나리 줄기 한 줌(일고여덟 대)을 가운데에서 끈으로 묶은 작은 다발. 줄기는 연필보다 가늘고 긴 연초록 줄기(밑동 쪽은 연분홍빛)로 '
    + '마디가 있고, 줄기 끝에 톱니 있는 작은 깃꼴 잎이 조금 남았다. 줄기 아래쪽 마디마다 흰 실뿌리가 수염처럼 돋았다. 대파 · 셀러리처럼 굵지 않다.'),

  // ── 버섯 배지 ──
  item_set_oyster_mushroom: set('oyster_mushroom', '느타리 배지 (1.5kg)', 'Oyster mushroom grow block (1.5kg)',
    '느타리버섯 재배 배지 한 덩이. 투명 비닐 봉지에 꽉 채운 원통형 톱밥 덩어리로, 비닐 너머로 흰 균사가 퍼진 연갈색 톱밥이 비친다. '
    + '위쪽 비닐을 벌린 입구에서 회갈색 부채꼴 느타리 어린 버섯이 작게 무리 지어 돋아났다.', { refs: REF_PACK }),
  item_set_lions_mane: set('lions_mane', '노루궁뎅이 배지 (1kg)', "Lion's mane grow block (1kg)",
    '노루궁뎅이버섯 재배 배지 한 덩이. 흰 균사가 꽉 찬 미색 톱밥을 투명 비닐 봉지에 채운 원통형 덩어리이고, '
    + '옆면 칼집 사이로 흰 털 뭉치 같은 둥근 노루궁뎅이 버섯 하나가 작게 돋아나 가는 가시 털이 아래로 늘어진다.', { refs: REF_PACK, keepWhite: true }),
  item_set_wood_ear: set('wood_ear', '목이 배지 (1봉)', 'Wood ear grow bag',
    '목이버섯 재배 배지 한 봉. 갈색 톱밥을 꽉 채운 투명 비닐 봉지(원통형 · 위는 묶음)이고, '
    + '옆면 칼집 몇 군데에서 귀 모양으로 주름진 반투명 짙은 갈색 목이버섯이 작게 돋아났다.', { refs: REF_PACK }),
};
