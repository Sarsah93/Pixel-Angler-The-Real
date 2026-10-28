/**
 * @file _dishes.cjs
 * @description 255차 — 불요리 완성 요리 사진(레시피 하나에 한 장). 서더리 · 통생선 매운탕(`public/food/stew_red*.png`) 수준 · 같은 화풍.
 *  생성 `node tools/gemini_item_art.cjs --looks tools/item_looks/_dishes.cjs --out <폴더>` · 설치 `node tools/dish_photos.cjs`
 *  (아이템 카드가 아니라 `public/food/<레시피>.png` → 텍스처 `food_<레시피>` · `FireRecipeDatabase.photoKey`).
 *  밑줄 파일이라 `item_cards.cjs`(아이템 카드 표)는 읽지 않는다.
 *  국물 요리는 매운탕과 같은 **검은 양수 냄비(양쪽 손잡이)** 에 담는다 — 한 상에 놓였을 때 같은 부엌에서 나온 그릇으로 보이게.
 */
'use strict';

const REF = ['packages/client-pc/public/food/stew_red_whole.png', 'packages/client-pc/public/food/stew_red.png', 'packages/client-pc/public/food/assorted_sashimi.png'];

module.exports = {
  stew_clear: { file: 'stew_clear.png', nameKo: '지리 (맑은탕)', nameEn: 'Clear fish soup (jiri)', aspect: '4:3', refs: REF,
    look: '맑은 생선탕(지리) 한 냄비. 참고 그림의 매운탕과 똑같은 검은 양수 냄비(양쪽에 둥근 손잡이)를 비스듬히 위에서 본다. '
      + '국물은 고춧가루가 전혀 없는 맑고 투명한 연한 금빛이다(바닥이 비칠 만큼). 흰 생선 살 토막 서너 개와 머리 반쪽, 납작하게 썬 반투명 무 몇 쪽, '
      + '초록 미나리 한 줌, 어슷 썬 대파, 홍고추 · 청양고추 몇 쪽, 하얀 두부 두어 조각이 국물 위로 보인다. 김이 살짝.' },
  grill_fish: { file: 'grill_fish.png', nameKo: '생선구이', nameEn: 'Grilled fish', aspect: '4:3', refs: REF,
    look: '생선 한 마리를 통째로 노릇하게 구운 것. 길쭉한 흰 사각 도자기 접시에 머리가 왼쪽을 향해 놓여 있다. '
      + '껍질은 노릇한 갈색과 군데군데 짙은 구운 자국(석쇠 줄무늬)이 있고 옆구리에 칼집 세 줄, 칼집 사이로 하얀 살이 보인다. '
      + '접시 한쪽에 반달 레몬 한 조각과 무 간 것 약간. 기름이 살짝 반짝인다.' },
  braise_fish: { file: 'braise_fish.png', nameKo: '생선조림', nameEn: 'Braised fish (jorim)', aspect: '4:3', refs: REF,
    look: '생선조림 한 냄비. 참고 그림과 같은 검은 냄비지만 조금 더 얕다. 붉은 고춧가루 · 간장 양념이 자작하게 졸아 윤기가 흐른다. '
      + '양념이 밴 생선 토막 서너 개(껍질은 은빛 · 살은 하얗다)와 그 밑에 깔린 두툼한 무 토막(양념이 배어 갈색), 어슷 썬 대파 · 풋고추 · 홍고추가 위에 얹혀 있다. '
      + '국물은 거의 없고 걸쭉하다.' },
  stirfry_squid: { file: 'stirfry_squid.png', nameKo: '오징어볶음', nameEn: 'Stir-fried squid', aspect: '4:3', refs: REF,
    look: '오징어볶음 한 접시. 둥근 흰 도자기 접시에 빨간 고추장 양념으로 볶은 오징어가 수북하다 — 격자 칼집을 넣어 동그랗게 말린 몸통 조각과 다리. '
      + '채 썬 양파, 반달 당근, 어슷 썬 대파, 청 · 홍고추가 섞여 있고 양념이 반짝인다. 위에 흰 참깨를 조금 뿌렸다.' },
  soup_clam: { file: 'soup_clam.png', nameKo: '조개탕', nameEn: 'Clam soup', aspect: '4:3', refs: REF,
    look: '조개탕 한 냄비. 참고 그림과 똑같은 검은 양수 냄비(양쪽 손잡이)를 비스듬히 위에서 본다. 맑고 뽀얀 국물에 입을 벌린 조개(바지락 · 모시조개 — '
      + '갈색 · 회색 줄무늬 껍데기, 안쪽은 하얀 속살)가 가득 쌓여 있다. 어슷 썬 대파와 청양고추 · 홍고추 몇 쪽. 고춧가루 없음. 김이 살짝.' },
  porridge_abalone: { file: 'porridge_abalone.png', nameKo: '전복죽', nameEn: 'Abalone porridge', aspect: '4:3', refs: REF,
    look: '전복죽 한 그릇. 검은 돌솥(작은 손잡이 둘) 또는 두꺼운 사기 그릇에 담긴 걸쭉한 죽 — 내장을 넣어 연한 초록빛이 도는 미색. '
      + '위에 얇게 저민 전복 살 너덧 점(가장자리가 짙은 회갈색 · 속은 크림색)이 부채꼴로 얹혀 있고, 참기름이 반짝이며 흰 참깨와 김가루가 조금.' },
  grill_eel: { file: 'grill_eel.png', nameKo: '장어구이', nameEn: 'Grilled eel', aspect: '4:3', refs: REF,
    look: '장어구이 한 접시. 길쭉한 검은 사각 접시에 손바닥만 한 장어 토막 다섯 여섯 개가 나란히 놓여 있다. '
      + '껍질 쪽은 짙은 갈색, 살 쪽은 달콤한 간장 양념을 발라 구워 윤기 나는 적갈색이고 석쇠 자국이 있다. '
      + '한쪽에 생강채 한 줌과 초록 깻잎 한 장.' },
  // 284차 — 텃밭 부산물 나물(시래기 · 우거지 · 고구마줄기 · 토란대 · 깻순)을 데쳐 들기름 · 들깨가루에 볶은 것
  stirfry_namul: { file: 'stirfry_namul.png', nameKo: '나물 볶음', nameEn: 'Stir-fried greens (namul bokkeum)', aspect: '4:3', refs: REF,
    look: '들기름에 볶은 나물 한 접시. 참고 그림들과 같은 화풍 · 같은 부엌의 그릇으로, 둥근 흰 도자기 접시에 데쳐서 볶은 나물이 소복하게 담겨 있다 — '
      + '손가락 길이로 썬 짙은 올리브빛 초록 · 갈색 시래기(데친 무청 줄기와 잎)와 가늘고 긴 자줏빛 갈색 고구마줄기가 섞여 들기름에 윤기가 돈다. '
      + '위에 회색빛 베이지 들깨가루를 넉넉히 뿌려 나물에 뽀얗게 묻었고, 어슷 썬 대파 몇 쪽과 다진 마늘이 조금, 흰 참깨를 살짝. 국물 없이 촉촉하다.' },
};
