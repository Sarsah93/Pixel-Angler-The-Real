/**
 * @file food.cjs
 * @description 255차 — 먹을거리 · 양념 그림(코드로 그린 임시 그림 `art_*` → Gemini 픽셀 아트). 생성기 `tools/gemini_item_art.cjs`.
 *  키는 아이템이 이미 쓰는 `art_*` 그대로 — 세이브 · 카탈로그의 `iconTexture`는 그대로 두고 그림만 바뀐다(`ids` · `px` 없음).
 *  한 그림 = 가방 한 칸에 드는 것 하나(소금 = 한 봉지 · 생수 = 한 병 · 레몬 = 한 알). 양념은 「1큰술」 단위지만 그림은 그 양념의 통 · 봉지 · 병이다.
 *  라벨에는 글자 · 숫자 · 로고를 쓰지 않는다 — 색 띠와 작은 그림(콩 · 멸치 · 고추 · 벼 이삭)으로 무엇인지 읽히게 한다.
 *  국간장 · 진간장은 병 모양 · 뚜껑 색 · 간장 빛깔로 가른다(가는 병 노란 뚜껑 연한 적갈색 / 통통한 병 빨간 뚜껑 검은빛).
 *  생선구이 정식은 불요리 생선구이 사진(`public/food/grill_fish.png`)을 첫 참고로 보내 같은 생선이 상에 오르게 한다.
 *  `keepWhite` — 투명 · 흰 물건(병 · 봉지 · 흰 그릇)은 설치 때 안쪽 흰 반짝임이 구멍으로 뚫리지 않게 한다(속이 비치는 고리 · 틈이 없는 물건만).
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/food.cjs --out <폴더>` · 설치는 같은 줄에 `--install`.
 */
'use strict';

/** 화풍 참고(ROOT 기준) — 포장된 물건 · 봉지 · 상자 · 병 */
const REF_PACK = ['food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png', 'food assets/tackle/it_krill_box.png'];
/** 일반 물건 */
const REF_BAG = ['food assets/tackle/it_bakkan_danax.png', 'food assets/tackle/it_krill_box.png', 'food assets/tackle/it_spinning_reel.png'];
/** 금속 도구 · 칼 · 조리 도구 */
const REF_METAL = ['food assets/tackle/it_spinning_reel.png', 'food assets/tackle/it_swivel_v2.png', 'food assets/tackle/it_bakkan_danax.png'];
/** 음식 */
const REF_FOOD = ['packages/client-pc/public/food/stew_red_whole.png', 'food assets/crops/asis/crop_strawberry.png', 'food assets/tackle/it_krill_block.png'];
/** 생선구이 정식 — 불요리 생선구이 사진을 첫 장으로(같은 생선) */
const REF_MEAL = ['packages/client-pc/public/food/grill_fish.png', 'packages/client-pc/public/food/stew_red_whole.png', 'food assets/tackle/it_krill_block.png'];

/** 흰 부분이 배경에 묻히지 않게 붙이는 문구 */
const WHITE = '흰 부분도 진한 윤곽선과 연회색 그늘로 또렷하게.';

module.exports = {
  // ── 소금 · 가루 양념 ──
  art_coarse_salt: { file: 'coarse_salt.png', nameKo: '굵은소금', nameEn: 'Coarse sea salt', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '굵은소금(천일염) 한 봉지 — 두툼한 투명 비닐 봉지에 굵고 각진 소금 결정이 가득 차 불룩하다. 결정은 반투명한 흰색 · 연회색으로, '
      + '알갱이마다 모서리가 보일 만큼 굵다(고운 가루가 아니다). 봉지 입구는 위에서 비틀어 빨간 노끈으로 묶었고, 봉지 아래쪽에 짙은 파란 띠 하나(글자 없음). ' + WHITE },
  art_salt: { file: 'salt.png', nameKo: '소금', nameEn: 'Fine table salt', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '고운 소금 한 봉지 — 손바닥만 한 작은 세움 비닐 파우치(위에 지퍼 입구). 파우치 위아래는 짙은 남색 · 하늘색 띠이고, '
      + '앞면 가운데 둥근 투명 창으로 눈처럼 고운 흰 소금 가루가 보인다. 굵은 결정이 아니라 가루다. 글자 없음. ' + WHITE },
  art_sugar: { file: 'sugar.png', nameKo: '설탕', nameEn: 'White sugar', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '설탕 한 봉지 — 직사각형 종이 봉투에 설탕이 가득 차 불룩하다. 봉투는 흰 바탕에 위아래 분홍 · 빨간 띠, 앞면 가운데에 하얀 각설탕 세 개 그림(글자 없음). '
      + '위쪽 한 귀퉁이를 뜯어 접어 반짝이는 흰 설탕 알갱이가 조금 보인다. ' + WHITE },
  art_gochugaru: { file: 'gochugaru.png', nameKo: '고춧가루', nameEn: 'Korean chili flakes', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '고춧가루 한 봉지 — 투명한 지퍼 비닐 봉지에 선홍색 · 진홍색 고춧가루(굵게 빻은 가루와 작은 노란 씨 몇 알)가 가득 차 불룩하다. '
      + '위쪽 지퍼 입구에 빨간 테 한 줄, 봉지 앞면 위쪽에 작은 빨간 고추 한 개 그림이 있는 흰 띠(글자 없음).' },
  art_pepper: { file: 'pepper.png', nameKo: '후추', nameEn: 'Ground black pepper', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '후추 한 통 — 작은 원통형 후추통. 위 뚜껑은 회색 플라스틱 뿌리개로 작은 구멍이 여러 개 뚫려 있고, '
      + '몸통은 짙은 남색 · 검정 바탕에 금색 띠와 검은 후추 알갱이 몇 알 그림(글자 없음). 세워 놓고 비스듬히 위에서 본 모습.' },
  art_garlic_minced: { file: 'garlic_minced.png', nameKo: '다진마늘', nameEn: 'Minced garlic tub', aspect: '1:1', refs: REF_PACK, keepWhite: true,
    look: '다진 마늘 한 통 — 작고 납작한 원통형 반투명 플라스틱 통. 초록 뚜껑을 반쯤 열어 비스듬히 걸쳐 두어, 통 안에 연한 미색 · 노르스름한 '
      + '곱게 다진 마늘이 촉촉하게 가득 찬 것이 보인다. 통 옆면에 연두색 띠와 하얀 통마늘 한 통 그림(글자 없음).' },
  // ── 병 · 통 양념 ──
  art_soy_light: { file: 'soy_light.png', nameKo: '국간장', nameEn: 'Soup soy sauce', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '국간장 한 병 — 키가 크고 날씬한 투명 페트병에 맑은 적갈색 간장(빛이 비칠 만큼 연한 붉은 호박빛)이 4분의 3쯤 차 있다. '
      + '뚜껑은 노란색, 몸통 라벨은 연두 · 크림색 띠에 노란 콩 세 알 그림(글자 없음). 병이 가늘고 간장 빛깔이 연하다. 세워 놓고 비스듬히 위에서 본 모습.' },
  art_soy_dark: { file: 'soy_dark.png', nameKo: '진간장', nameEn: 'Dark soy sauce', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '진간장 한 병 — 어깨가 넓고 통통한 각진 투명 페트병에 빛이 거의 비치지 않는 검은빛 짙은 간장이 가득. '
      + '뚜껑은 빨간색, 몸통 라벨은 빨강 · 검정 띠에 노란 콩 세 알 그림(글자 없음). 병이 넓적하고 간장이 새까맣다. 세워 놓고 비스듬히 위에서 본 모습.' },
  art_fish_sauce: { file: 'fish_sauce.png', nameKo: '액젓', nameEn: 'Anchovy fish sauce', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '멸치액젓 한 병 — 어깨가 둥근 투명 플라스틱 병에 맑은 호박색 · 주황빛 갈색 액젓이 가득. 뚜껑은 빨간색, '
      + '몸통 라벨은 하늘색 띠에 작은 은빛 멸치 두 마리 그림(글자 없음). 세워 놓고 비스듬히 위에서 본 모습.' },
  art_gochujang: { file: 'gochujang.png', nameKo: '고추장', nameEn: 'Gochujang tub', aspect: '1:1', refs: REF_PACK, keepWhite: true,
    look: '고추장 한 통 — 모서리가 둥근 직사각형 빨간 플라스틱 통. 빨간 뚜껑을 반쯤 열어 뒤로 젖혀서, 통 안에 윤기 나는 짙은 검붉은 고추장이 '
      + '가득 찬 것이 보인다. 통 앞면은 빨강 바탕에 노란 띠와 작은 초록 꼭지 달린 고추 그림 하나(글자 없음). 비스듬히 위에서 본 모습.' },
  art_sesame_oil: { file: 'sesame_oil.png', nameKo: '참기름', nameEn: 'Sesame oil', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '참기름 한 병 — 작고 목이 긴 투명 유리병에 맑고 진한 호박색 · 금갈색 참기름이 가득(빛을 받아 반짝인다). 금색 금속 마개, '
      + '병목에 빨간 띠, 몸통 라벨은 크림색 바탕에 작은 깨 알갱이 그림(글자 없음). 세워 놓고 비스듬히 위에서 본 모습.' },
  art_cooking_oil: { file: 'cooking_oil.png', nameKo: '식용유', nameEn: 'Cooking oil bottle', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '큰 식용유 한 병 — 크고 통통한 투명 페트병에 맑은 연노랑 기름이 가득, 병 어깨 아래에 손으로 쥐는 오목한 허리, 노란 뚜껑. '
      + '몸통 라벨은 초록 · 노랑 띠에 노란 콩 그림(글자 없음). 참기름병보다 훨씬 크고 기름 빛깔이 옅다. 세워 놓고 비스듬히 위에서 본 모습.' },
  art_sauce_set: { file: 'sauce_set.png', nameKo: '양념 세트', nameEn: 'Seasoning gift set', aspect: '4:3', refs: REF_PACK, keepWhite: true,
    look: '양념 세트 한 벌 — 뚜껑 없는 얕은 밝은 원목 상자 하나에 작은 양념병 세 개가 나란히 꽂혀 있다: 왼쪽은 검은 간장이 든 유리병(빨간 뚜껑), '
      + '가운데는 호박색 참기름이 든 유리병(금색 뚜껑), 오른쪽은 붉은 고추 양념이 든 병(초록 뚜껑). 병마다 라벨은 단색 띠뿐(글자 없음). '
      + '상자째 한 덩어리로, 비스듬히 위에서 본 모습.' },
  // ── 식자재 · 가공품 ──
  art_rice_bag: { file: 'rice_bag.png', nameKo: '쌀 1kg', nameEn: '1 kg rice bag', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '작은 쌀 한 봉지 — 한 손으로 드는 작고 두툼한 직사각형 쌀 포대(흰 비닐), 쌀이 가득 차 불룩하다. 앞면 가운데 투명한 타원 창으로 하얀 쌀알이 보이고, '
      + '창 위에 노란 벼 이삭 그림 하나, 포대 아래쪽에 초록 띠(글자 없음). 위쪽 입구는 박음질로 봉했다. ' + WHITE },
  art_can_tuna: { file: 'can_tuna.png', nameKo: '참치 통조림', nameEn: 'Canned tuna', aspect: '4:3', refs: REF_PACK, keepWhite: true,
    look: '참치 통조림 한 캔 — 키가 낮고 넓적한 원통형 깡통(지름이 높이의 두 배쯤). 비스듬히 위에서 내려다봐 은색 뚜껑의 둥근 테 홈과 '
      + '손가락을 거는 따개 고리가 보인다. 옆면 라벨은 금색 바탕에 짙은 파란 띠 하나와 분홍빛 참치 살 덩어리 그림 하나(글자 · 숫자 없음).' },
  art_veges: { file: 'veges.png', nameKo: '식자재 묶음 (대파/양파)', nameEn: 'Green onions and onions bundle', aspect: '1:1', refs: REF_FOOD,
    look: '요리용 채소 한 묶음 — 대파 두 대와 양파 두 알이 한 덩어리. 하얀 밑동과 짙은 초록 잎이 달린 긴 대파 두 대를 가운데에서 빨간 고무줄로 '
      + '한데 묶어 대각선으로 눕혔고(잎 끝이 오른쪽 위), 대파 밑동 앞에 껍질이 반질반질한 황갈색 양파 두 알이 붙어 놓여 있다. 대파 밑동에 짧은 흰 수염뿌리.' },
  art_lemon: { file: 'lemon.png', nameKo: '레몬', nameEn: 'Lemon', aspect: '4:3', refs: REF_FOOD,
    look: '레몬 한 개를 통째로 — 양 끝이 살짝 뾰족한 타원형, 자르지 않은 한 알. 껍질은 반질반질한 밝은 노랑에 오톨도톨한 기공 무늬, '
      + '꼭지 쪽에 작은 초록 꼭지와 초록 잎 한 장. 옆으로 누운 모습.' },
  art_snackbar: { file: 'snackbar.png', nameKo: '초코바', nameEn: 'Chocolate bar', aspect: '4:3', refs: REF_PACK,
    look: '초코바 하나 — 손가락 두 개 굵기의 길쭉한 초콜릿 바가 반짝이는 비닐 포장지(짙은 빨강 · 갈색, 양 끝은 톱니 모양으로 눌러 봉한 이음)에 싸여 있고, '
      + '한쪽 끝을 뜯어 젖혀 갈색 초콜릿 겉면과 잘린 단면(땅콩 알 · 캐러멜 층)이 보인다. 대각선으로 놓인다. 글자 · 로고 없음.' },
  art_water: { file: 'water.png', nameKo: '생수 500ml', nameEn: 'Bottled water 500 ml', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '작은 생수 한 병(한 손에 쥐는 크기) — 투명한 페트병에 맑은 물이 가득, 파란 플라스틱 뚜껑, 몸통 가운데에 하늘색 · 파랑 물결 무늬 띠 라벨(글자 없음), '
      + '병 몸통에 가로 홈 몇 줄. 투명한 병은 연한 하늘색과 흰 반짝임으로, 둘레는 진한 윤곽선. 세워 놓고 비스듬히 위에서 본 모습.' },
  art_riceball: { file: 'riceball.png', nameKo: '주먹밥', nameEn: 'Triangle rice ball', aspect: '1:1', refs: REF_FOOD, keepWhite: true,
    look: '삼각김밥(세모 주먹밥) 하나 — 포장을 벗긴 세모난 밥 덩이를 정면에서 조금 위로 본 모습. 밥은 새하얀 쌀밥(낱알이 보인다). '
      + '검은 김 한 장이 세모의 밑변 전체를 감싼다 — 왼쪽 아래 모서리부터 오른쪽 아래 모서리까지 밑변을 따라 끝에서 끝까지 덮고, '
      + '위로는 높이의 3분의 1까지 올라와 아래쪽이 넓은 검은 띠가 된다(한쪽에만 붙인 네모 조각이 아니다). '
      + '위 꼭짓점 아래 밥 사이로 분홍빛 참치마요 소가 살짝 비친다. ' + WHITE },
  // ── 식당 · 카페 · 주점 ──
  art_meal_grilled: { file: 'meal_grilled.png', nameKo: '생선구이 정식', nameEn: 'Grilled fish set meal', aspect: '4:3', refs: REF_MEAL, keepWhite: true,
    look: '한국 식당의 생선구이 정식 한 상 — 직사각형 갈색 나무 쟁반 하나 위에 차린 밥상. 쟁반 뒤쪽에 길쭉한 흰 사각 접시에 담긴 생선구이 한 마리'
      + '(이 생선만은 첫 번째 참고 그림의 생선구이와 같은 모습 — 노릇하게 구운 껍질 · 석쇠 자국 · 칼집 · 반달 레몬 한 조각), 앞쪽 왼쪽에 흰 쌀밥이 소복한 밥공기 하나, '
      + '앞쪽 오른쪽에 된장국 한 그릇(갈색 국물에 두부 · 파), 그 사이에 작은 반찬 접시 세 개(빨간 배추김치 · 초록 시금치나물 · 갈색 멸치볶음), '
      + '쟁반 한쪽 끝에 숟가락 · 젓가락 한 벌. 쟁반째 한 덩어리로, 비스듬히 위에서 내려다본 모습.' },
  art_coffee: { file: 'coffee.png', nameKo: '아메리카노', nameEn: 'Hot americano to go', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '따뜻한 아메리카노 한 잔(테이크아웃) — 흰 종이컵에 검은 플라스틱 뚜껑(마시는 구멍), 컵 가운데에 골판지 갈색 컵 홀더를 끼웠다. '
      + '뚜껑 마시는 구멍 위로 가는 김 한 줄기. 로고 · 글자 없음. 세워 놓고 비스듬히 위에서 본 모습. ' + WHITE },
  art_latte: { file: 'latte.png', nameKo: '카페라떼', nameEn: 'Cafe latte', aspect: '4:3', refs: REF_FOOD, keepWhite: true,
    look: '카페라떼 한 잔 — 넓적한 흰 도자기 커피잔과 받침 접시. 비스듬히 위에서 내려다봐 잔 속 연갈색 우유 거품 위에 흰 하트 모양 라떼아트가 또렷하다. '
      + '잔 오른쪽에 작은 손잡이, 받침 접시 위에 작은 은색 티스푼 하나. ' + WHITE },
  art_dessert: { file: 'dessert.png', nameKo: '수제 디저트', nameEn: 'Handmade strawberry cake slice', aspect: '4:3', refs: REF_FOOD, keepWhite: true,
    look: '카페의 수제 케이크 한 조각 — 작고 둥근 흰 도자기 접시 위에 놓인 세모난 딸기 생크림 케이크 한 조각. 옆 단면에 노란 스펀지 시트 세 층과 '
      + '흰 생크림 층, 그 사이에 얇게 썬 빨간 딸기가 보이고, 위에는 생크림 한 덩이와 통딸기 하나, 초록 민트 잎 한 장. 접시 한쪽에 작은 은색 포크 하나. ' + WHITE },
  art_makgeolli: { file: 'makgeolli.png', nameKo: '막걸리', nameEn: 'Makgeolli bottle', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '막걸리 한 병 — 한국 막걸리 특유의 하얀 플라스틱 병(어깨가 둥글고 몸통에 가로 홈 몇 줄), 초록 뚜껑, '
      + '몸통 가운데에 초록 · 크림색 띠 라벨과 작은 노란 벼 이삭 그림(글자 없음). 병 속 술이 뽀얀 우윳빛이라 병이 크림색 · 미색으로 보인다. ' + WHITE },
  art_soju: { file: 'soju.png', nameKo: '소주', nameEn: 'Soju bottle', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '소주 한 병 — 한국 소주 특유의 투명한 초록색 유리병(길쭉하고 어깨가 둥글며 목이 가늘다), 초록 유리 너머로 맑은 술이 비친다. '
      + '은색 · 초록 돌려 따는 금속 뚜껑, 몸통 가운데에 흰 바탕에 하늘색 띠가 있는 라벨(글자 · 로고 없음). 세워 놓고 비스듬히 위에서 본 모습.' },
  art_anju: { file: 'anju.png', nameKo: '해물 안주', nameEn: 'Seafood pancake (pub snack)', aspect: '4:3', refs: REF_FOOD,
    look: '포구 주점의 해물 안주 — 해물파전 한 장. 둥근 짙은 남색 사기 접시 위에 노릇노릇 바삭하게 부친 큼직한 동그란 전 하나. '
      + '전 위로 길게 누운 초록 쪽파 줄기, 하얀 오징어 고리 · 분홍 새우 · 주황 홍합 살, 붉은 고추 조각이 박혀 있고 가장자리는 갈색으로 바삭하다. '
      + '접시 위 한쪽 가장자리에 작은 간장 종지(검은 간장에 깨) 하나. 기름이 살짝 반짝인다.' },
};
