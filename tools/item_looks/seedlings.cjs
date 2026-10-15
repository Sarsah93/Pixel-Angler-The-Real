/**
 * @file seedlings.cjs
 * @description 255차 — 텃밭 모종 · 묘목 그림(16px 손그림 `px:sdl_<작물>` → Gemini 그림). 47종.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/seedlings.cjs --out <폴더>`
 *  · 설치 `--install` → `food assets/items/sdl_<작물>.png` → `node tools/item_cards.cjs`.
 *
 *  모종(1포기) = **검은 육묘 포트 하나 + 어린 포기 하나**(`POT` — 47장이 한 가게에서 산 모종으로 보이게 포트 문구를 같게 둔다).
 *  잎 모양 · 색은 그 작물 초상(`public/crops/<초상>_card.png` · `gemini_crop_art.cjs` LOOKS)의 어린 모습으로 쓴다.
 *  상추 9품종은 서로 갈리게 쓴다 — 청치마/적치마(주걱 잎 로제트 · 잎끝 색) · 꽃상추(참나무 잎 갈래 · 진자주) ·
 *  청축면/적축면(곱슬 공) · 생채(노란빛 물결 로제트) · 청로메인/적로메인(곧게 선 꽃병) · 버터헤드(오목한 잎 장미).
 *  같은 식물이 둘인 것(깻잎 · 들깨 — 들깨는 흰 꽃이삭)과 박과 덩굴(오이 · 참외 · 수박 · 박 · 여주 · 애호박)은 잎 갈래 · 꽃 · 아기 열매로 가른다.
 *  묘목(두릅 · 초피 · 엄나무)은 마대로 싼 뿌리분(`TREE`) · 블루베리만 큰 검은 화분 — 세로 그림(3:4).
 */
'use strict';

const REF_PLANT = ['food assets/crops/asis/crop_strawberry.png', 'food assets/crops/asis/crop_lettuce.png', 'food assets/crops/asis/crop_potato.png'];

/** 모종 공통 — 검은 육묘 포트 하나 + 어린 포기 하나(잎이 그림의 주인공) */
const POT = '작고 둥근 검은 플라스틱 육묘 포트(말랑한 비닐 화분 — 옆면에 세로 골, 윗테가 살짝 말림) 하나에 어린 모종 한 포기를 심었다. '
  + '포트 윗면의 짙은 갈색 상토가 보이도록 비스듬히 위에서 본다. 포트는 아래쪽에 작게, 잎은 그 위로 크고 또렷하게 펼쳐진다. '
  + '포트는 딱 하나 — 육묘 트레이 · 여러 포트 · 화분 받침 없음. ';

/** 묘목 공통 — 마대로 싼 뿌리분 + 가는 나무줄기 한 그루 */
const TREE = '어린 나무 묘목 한 그루를 통째로 그린다. 뿌리분은 갈색 마대 천(삼베)으로 동그랗게 싸고 노끈으로 묶었다. '
  + '그 위로 가는 나무줄기가 곧게 서 있다. 비스듬히 위에서 본 모습. 묘목은 딱 한 그루. ';

const sdl = (crop, nameKo, nameEn, plant, opt = {}) => ({
  px: [`px:sdl_${crop}`], file: `sdl_${crop}.png`, nameKo, nameEn, aspect: '1:1', refs: REF_PLANT, look: POT + plant, ...opt,
});
const tree = (crop, nameKo, nameEn, plant, opt = {}) => ({
  px: [`px:sdl_${crop}`], file: `sdl_${crop}.png`, nameKo, nameEn, aspect: '3:4', refs: REF_PLANT, look: TREE + plant, ...opt,
});

module.exports = {
  // ── 상추 9품종 ──
  item_sdl_lettuce: sdl('lettuce', '청치마 모종', 'Green leaf lettuce (cheongchima) seedling',
    '잎: 밝은 연두빛 초록의 길쭉한 주걱 모양 잎 6~7장이 밑동에서 사방으로 느슨하게 퍼진 로제트. '
    + '잎 가장자리는 잔잔하게 물결치고 가운데에 연한 흰 잎맥. 붉은 기 · 곱슬 없음.'),
  item_sdl_jeokchima: sdl('jeokchima', '적치마 모종', 'Red leaf lettuce (jeokchima) seedling',
    '잎: 길쭉한 주걱 모양 잎 6장이 밑동에서 느슨하게 퍼진 로제트(청치마 상추와 같은 모양). '
    + '잎 아래쪽 절반은 연초록, 잎 끝 쪽 절반은 짙은 적자주색으로 물들었다. 가장자리는 잔잔한 물결, 곱슬 없음.'),
  item_sdl_kkot_lettuce: sdl('kkot_lettuce', '꽃상추 모종', 'Oak-leaf lettuce (kkot-sangchu) seedling',
    '잎: 가장자리가 참나무 잎처럼 깊고 들쭉날쭉하게 갈라진(꽃잎 같은) 얇은 잎 7~8장이 느슨하게 펼쳐진 포기. '
    + '잎 대부분이 진한 자줏빛 붉은색이고 밑동 쪽 잎맥만 연초록.'),
  item_sdl_cheongchukmyeon: sdl('cheongchukmyeon', '청축면 모종', 'Green frilly lettuce (cheongchukmyeon) seedling',
    '잎: 가장자리가 오글오글 심하게 곱슬거리는(축면) 밝은 연두색 잎이 둥글게 겹쳐 모인 동그란 공 모양 포기. '
    + '레이스처럼 잘게 주름진 가장자리가 겹겹이 보인다. 붉은 기 없음.'),
  item_sdl_jeokchukmyeon: sdl('jeokchukmyeon', '적축면 모종', 'Red frilly lettuce (jeokchukmyeon) seedling',
    '잎: 오글오글 심하게 곱슬거리는(축면) 잎이 둥글게 겹쳐 모인 동그란 공 모양 포기. '
    + '곱슬 가장자리와 겉면은 짙은 자줏빛, 잎 속과 잎맥 쪽은 연초록이 얼룩처럼 섞인다.'),
  item_sdl_saengchae: sdl('saengchae', '생채 모종', 'Saengchae lettuce seedling',
    '잎: 연한 노란빛 연두색의 얇고 부드러운 넓은 잎이 속에서부터 겹겹이 차오르는 둥근 로제트. '
    + '가장자리는 크게 굽이치는 물결(곱슬 아님), 속잎은 거의 노랗고 겉잎은 연초록. 붉은 기 없음, 잎이 곧게 서지 않는다.'),
  item_sdl_cheongromaine: sdl('cheongromaine', '청로메인 모종', 'Green romaine seedling',
    '잎: 길고 곧게 위로 선 짙은 초록 잎 5~6장이 꽃병처럼 모여 선 포기. 잎은 긴 숟가락 모양, '
    + '가운데 굵고 흰 잎맥, 잎 표면이 오톨도톨 주름졌다. 옆으로 퍼지지 않고 위로 선다.'),
  item_sdl_jeokromaine: sdl('jeokromaine', '적로메인 모종', 'Red romaine seedling',
    '잎: 길고 곧게 위로 선 잎 5~6장이 꽃병처럼 모여 선 포기(로메인 모양). '
    + '잎은 짙은 적갈색(포도주빛 갈색)이고 가운데 잎맥과 밑동만 연초록.'),
  item_sdl_butterhead: sdl('butterhead', '버터헤드 모종', 'Butterhead lettuce seedling',
    '잎: 둥글고 숟가락처럼 오목한 매끈한 연두색 잎이 장미꽃처럼 겹겹이 감싸 느슨한 공 모양을 이룬 포기. '
    + '잎 가장자리는 매끈(곱슬 · 톱니 없음), 속잎은 연노랑, 겉잎은 연초록으로 부드럽고 윤기가 난다. '
    + '포트는 다른 모종과 같은 둥근 원형 포트다(네모난 화분 아님).'),

  // ── 잎채소 · 산나물 · 향채 ──
  item_sdl_perilla: sdl('perilla', '깻잎 모종', 'Perilla leaf seedling',
    '잎: 곧은 네모 줄기에 둥근 하트 모양 · 가장자리 톱니가 있는 짙은 초록 깻잎이 두 장씩 마주 달려 3~4층으로 겹친 포기. '
    + '잎은 넓고 크며 잎맥이 오목하게 파였다. 꽃 없음.'),
  item_sdl_deulkkae: sdl('deulkkae', '들깨 모종', 'Perilla (deulkkae) seedling',
    '잎: 깻잎과 같은 들깨 포기(둥근 하트 모양 톱니 잎이 두 장씩 마주나기) — 줄기가 조금 더 길게 곧게 서고, '
    + '맨 위 줄기 끝에 작은 흰 꽃이 층층이 달린 가는 꽃이삭 하나가 올라왔다.'),
  item_sdl_chive: sdl('chive', '부추 포기 모종', 'Garlic chive clump',
    '포트 가득 가늘고 납작한 긴 초록 부추 잎 수십 가닥이 한 덩이로 모여 곧게 선 포기(밑동은 흰빛). '
    + '잎끝은 살짝 휘어 늘어진다. 파처럼 속이 빈 원통 잎이 아니라 납작한 띠 잎.'),
  item_sdl_bangpung: sdl('bangpung', '방풍나물 모종', 'Coastal hog fennel seedling',
    '잎: 세 갈래로 갈라지고 가장자리에 톱니가 있는 두껍고 윤기 나는 청록색 잎 여러 장, 잎자루는 자줏빛. 낮게 퍼진 포기.'),
  item_sdl_gomchwi: sdl('gomchwi', '곰취 모종', 'Gomchwi seedling',
    '잎: 크고 둥근 하트 모양 짙은 초록 잎 3~4장(가장자리 잔톱니)이 긴 잎자루 끝에 달려 우산처럼 펼쳐진다.'),
  item_sdl_myeongi: sdl('myeongi', '산마늘 모종', 'Alpine leek (myeongi) seedling',
    '잎: 넓은 타원형의 매끈한 초록 잎 3장(은방울꽃 잎처럼 끝이 뾰족)이 밑동에서 곧게 올라온다. 밑동 잎자루는 자줏빛 붉은색.'),
  item_sdl_samnamul: sdl('samnamul', '눈개승마 모종', "Goat's beard (samnamul) seedling",
    '잎: 붉은 갈색의 연한 줄기 여러 대가 올라오고, 그 끝에 깃꼴로 갈라진 작은 톱니 잎이 모여 펼쳐지는 어린 포기.'),
  item_sdl_eosuri: sdl('eosuri', '어수리 모종', 'Eosuri seedling',
    '잎: 깃꼴로 크게 갈라진 넓은 잎(셀러리 · 미나리 잎과 비슷, 가장자리 톱니) 3~4장과 연초록 긴 잎자루.'),
  item_sdl_bujigaengi: sdl('bujigaengi', '부지깽이 모종', 'Ulleung aster (bujigaengi) seedling',
    '잎: 긴 타원형 연초록 잎 6~8장(가장자리에 굵은 톱니)이 밑동에서 로제트로 퍼진 포기.'),
  item_sdl_wasabi: sdl('wasabi', '고추냉이 모종', 'Wasabi seedling',
    '잎: 둥근 하트 모양 잎(가장자리 톱니, 윤기 나는 초록) 4~5장이 긴 잎자루 끝에 달려 펼쳐진다. '
    + '밑동에 짧고 굵은 초록 뿌리줄기가 흙 위로 조금 드러났다.'),
  item_sdl_napa_cabbage: sdl('napa_cabbage', '김장배추 모종', 'Napa cabbage seedling',
    '잎: 넓고 우글쭈글 주름진 타원형 잎 5~6장(연초록 잎에 굵고 흰 잎줄기)이 로제트로 펼쳐진 어린 배추 포기. 속은 아직 차지 않았다.'),
  item_sdl_gondre: sdl('gondre', '곤드레 모종', 'Gondre (Korean thistle) seedling',
    '잎: 긴 타원형 초록 잎 5~6장(가장자리에 가는 가시 같은 톱니, 잎 뒷면은 흰빛)이 밑동에서 로제트로 퍼진 엉겅퀴 같은 포기.'),
  item_sdl_danggui: sdl('danggui', '당귀잎 모종', 'Angelica (danggui) seedling',
    '잎: 세 갈래로 갈라진 겹잎(가장자리 톱니)의 윤기 나는 짙은 초록 잎 여러 장과 자줏빛 긴 잎자루.'),
  item_sdl_banga: sdl('banga', '방아 모종', 'Korean mint (banga) seedling',
    '잎: 깻잎보다 작고 끝이 뾰족한 하트 모양 연초록 잎(가장자리 톱니)이 마주 달린 네모 줄기 두세 대. 줄기 끝에 보랏빛 꽃이삭 하나.'),
  item_sdl_shiso: sdl('shiso', '차조기 모종', 'Shiso (chajogi) seedling',
    '잎: 짙은 자주색 깻잎 모양 잎(둥근 하트 모양, 가장자리 톱니 · 주름)이 두 장씩 마주 달린 자주색 줄기. 잎 전체가 자줏빛.'),
  item_sdl_basil: sdl('basil', '바질 모종', 'Basil seedling',
    '잎: 윤기 나는 볼록한 타원형 밝은 초록 잎이 두 장씩 마주 달린 줄기, 꼭대기에 어린 순이 모인 포기. 잎은 숟가락처럼 살짝 오목하다.'),

  // ── 열매채소 ──
  item_sdl_chili: sdl('chili', '고추 모종', 'Chili pepper seedling',
    '잎: 곧은 초록 줄기에 윤기 나는 갸름한 창 모양(피침형) 짙은 초록 잎 7~8장이 어긋나게 달린 어린 고추 포기. '
    + '잎 사이에 작은 흰 꽃 한 송이. 열매 없음.'),
  item_sdl_cheongyang: sdl('cheongyang', '청양고추 모종', 'Cheongyang chili seedling',
    '잎: 곧은 초록 줄기에 고추 모종보다 가늘고 좁은 창 모양 짙은 초록 잎 6~7장. '
    + '잎 덩어리 양옆 · 앞쪽으로 손가락처럼 가늘고 긴 청양고추 서너 개가 아래로 늘어져 매달렸다 — 윤기 나는 짙은 초록에 하이라이트가 반짝이고 끝이 뾰족하다. '
    + '고추가 잎에 가리지 않고 흰 배경 앞에서 실루엣이 또렷하게 보인다.'),
  item_sdl_cherry_tomato: sdl('cherry_tomato', '방울토마토 모종', 'Cherry tomato seedling',
    '잎: 잔털이 보송한 연초록 줄기에 가장자리 톱니가 있는 깃꼴 겹잎(작은 잎 여러 장이 한 잎자루에 달림) 4~5장. '
    + '줄기 끝에 작은 별 모양 노란 꽃 송이와 콩알만 한 둥근 초록 열매 서너 알.'),
  item_sdl_tomato: sdl('tomato', '토마토 모종', 'Tomato seedling',
    '잎: 잔털이 보송한 굵고 곧은 연초록 줄기에 가장자리 톱니가 있는 깃꼴 겹잎(작은 잎 여러 장이 한 잎자루에 달림) 5~6장이 '
    + '넓게 펼쳐진 튼튼한 포기. 꽃 · 열매 없음.'),
  item_sdl_stevia_tomato: sdl('stevia_tomato', '스테비아 토마토 모종', 'Stevia tomato seedling',
    '잎: 잔털이 보송한 연초록 줄기에 가장자리 톱니가 있는 깃꼴 겹잎 4~5장. '
    + '줄기 끝에 작은 별 모양 노란 꽃과, 대추처럼 길쭉한 작은 열매 서너 알(하나는 빨갛게 익음).'),
  item_sdl_eggplant: sdl('eggplant', '가지 모종', 'Eggplant seedling',
    '잎: 자줏빛이 도는 굵은 줄기에 넓은 달걀 모양 잎(가장자리 얕은 물결, 잎맥이 자줏빛) 5~6장. 잎 사이에 노란 꽃술의 연보라 꽃 한 송이.'),
  item_sdl_okra: sdl('okra', '오크라 모종', 'Okra seedling',
    '잎: 단풍잎처럼 다섯 갈래로 갈라진 큰 손바닥 모양 잎 3~4장(가장자리 톱니), 굵고 곧은 초록 줄기. '
    + '줄기 끝에 연노랑 꽃잎에 가운데가 짙은 자주색인 꽃 한 송이.'),
  item_sdl_corn: sdl('corn', '찰옥수수 모종', 'Waxy corn seedling',
    '잎: 포트에서 곧게 올라온 길고 납작한 띠 모양 초록 잎 4~5장(풀잎처럼 끝이 뾰족, 가운데 연한 잎맥)이 '
    + '줄기를 감싸며 위로 뻗다가 끝이 아래로 휜다.'),
  item_sdl_yacon: sdl('yacon', '야콘 모종', 'Yacon seedling',
    '잎: 넓은 세모꼴 하트 모양 잎(가장자리 톱니, 잔털로 보송한 짙은 초록) 4~6장이 두 장씩 마주 달렸다. 잎자루에 좁은 날개, 줄기는 자줏빛을 띤다.'),
  item_sdl_strawberry: sdl('strawberry', '딸기 모종 (런너 묘)', 'Strawberry runner plant',
    '잎: 긴 잎자루 끝에 톱니 있는 둥근 작은 잎 세 장이 달린 겹잎(세 장 겹잎) 4~5개가 낮게 퍼진 포기. '
    + '노란 꽃술의 흰 꽃 한 송이, 포트 옆으로 가는 붉은 런너 줄기 하나가 뻗어 나간다.'),

  // ── 박과 덩굴 — 잎 갈래 · 꽃 · 아기 열매로 가른다 ──
  item_sdl_cucumber: sdl('cucumber', '오이 모종', 'Cucumber seedling',
    '잎: 손바닥만 한 오각형 하트 모양 잎(가장자리에 얕고 뾰족한 각, 거친 잔털) 3~4장, 꼬불꼬불한 덩굴손 하나. '
    + '줄기 끝에 노란 꽃 한 송이, 꽃 밑에 오톨도톨 가시 돋은 손가락만 한 아기 오이.'),
  item_sdl_zucchini: sdl('zucchini', '애호박 모종', 'Korean zucchini seedling',
    '잎: 크고 둥근 손바닥 모양 잎(얕게 다섯 갈래, 잎 위에 은백색 얼룩무늬) 3장, 굵고 속이 빈 잔털 잎자루. 가운데에 큰 노란 꽃봉오리 하나.'),
  item_sdl_bitter_melon: sdl('bitter_melon', '여주 모종', 'Bitter melon seedling',
    '잎: 손바닥처럼 다섯~일곱 갈래로 깊게 갈라진 작은 초록 잎 5~6장이 가는 줄기에 달렸다. 꼬불꼬불한 덩굴손 두세 개와 작은 노란 꽃 한 송이.'),
  item_sdl_gourd: sdl('gourd', '박 모종', 'Bottle gourd seedling',
    '잎: 크고 둥근 하트 모양 잎 3장(잔털이 보송한 연초록, 가장자리 얕은 물결), 꼬불꼬불한 덩굴손. 줄기 끝에 흰 꽃 한 송이.'),
  item_sdl_korean_melon: sdl('korean_melon', '참외 모종', 'Korean melon seedling',
    '잎: 둥글고 얕게 갈라진 하트 모양 잎(잔털, 가장자리 잔톱니) 5~6장이 포트 지름보다 넓게 펼쳐져 그림의 대부분을 차지하고, '
    + '꼬불꼬불한 덩굴손이 포트 밖으로 뻗는다. 줄기 끝에 작은 노란 꽃 한 송이, 꽃 밑에 노란 바탕에 흰 세로 줄무늬가 있는 메추리알만 한 아기 참외. '
    + '포트 아래 그림자 · 바닥 없음.'),
  item_sdl_watermelon: sdl('watermelon', '수박 접목 모종', 'Grafted watermelon seedling',
    '잎: 깃꼴로 깊게 여러 번 갈라진(가장자리가 들쭉날쭉한) 은빛 도는 짙은 초록 잎 3~4장, 덩굴손. '
    + '줄기 밑동 접목 자리에 작고 둥근 플라스틱 접목 집게(흰색 · 연두색 클립) 하나가 줄기를 물고 있다.'),

  // ── 파 · 양파 ──
  item_sdl_onion: sdl('onion', '양파 모종', 'Onion seedling',
    '잎: 가늘고 속이 빈 원통형 청록색 잎 3~4가닥(쪽파처럼 가늘다)이 위로 서다가 끝이 살짝 휘고, 흙 위 밑동은 하얗고 아주 살짝 볼록하다.'),
  item_sdl_leek: sdl('leek', '대파 모종', 'Green onion seedling',
    '잎: 손가락 굵기의 곧은 흰 줄기(대) 하나가 흙에서 올라오고, 그 위에서 진초록 원통형 잎 3~4장이 V자로 갈라져 위로 뻗는다. '
    + '양파 모종보다 굵고 흰 대가 길다.'),

  // ── 묘목(세로 그림) ──
  item_sdl_dureup: tree('dureup', '두릅 묘목', 'Fatsia (dureup) sapling',
    '줄기는 연필 굵기의 회갈색으로 짧고 날카로운 가시가 촘촘히 돋았다. 줄기 꼭대기에서만 연초록 겹잎 2~3장'
    + '(긴 잎자루에 톱니 있는 달걀 모양 작은 잎들이 깃꼴로 마주 달림)이 펼쳐진다. 곁가지 없음.'),
  item_sdl_eomnamu: tree('eomnamu', '엄나무 묘목', 'Castor aralia (eomnamu) sapling',
    '줄기는 엄지 굵기의 회갈색으로, 밑이 넓은 크고 굵은 가시가 듬성듬성 돋았다. '
    + '줄기 꼭대기에 손바닥처럼 다섯~일곱 갈래로 깊게 갈라진 큰 연초록 잎 2~3장이 긴 잎자루에 달려 펼쳐진다.'),
  item_sdl_chopi: tree('chopi', '초피 암나무 묘목', 'Female chopi (Korean pepper) sapling',
    '가는 갈색 줄기와 곁가지 두셋, 잎자루 밑마다 짧은 가시가 한 쌍씩 돋았다. 작은 달걀 모양 잎(가장자리 잔톱니) 열 장 남짓이 '
    + '깃꼴로 마주 달린 겹잎 여러 개, 가지 끝에 작고 둥근 초록 · 붉은 열매 송이 하나.'),
  item_sdl_blueberry: { px: ['px:sdl_blueberry'], file: 'sdl_blueberry.png', nameKo: '블루베리 묘목 (3년생)', nameEn: 'Blueberry bush (3-year-old)', aspect: '3:4', refs: REF_PLANT,
    look: '작은 블루베리 관목 한 그루를 검은 플라스틱 화분(육묘 포트보다 크고 깊다) 하나에 심었다. 화분 윗면 흙이 보이도록 비스듬히 위에서 본다. '
      + '붉은 갈색의 가는 가지 대여섯 대가 덤불처럼 올라오고, 작고 윤기 나는 타원형 잎(가장자리 매끈, 몇 장은 붉게 물듦)이 촘촘하다. '
      + '가지 끝에 분이 하얗게 낀 남보라색 블루베리 몇 알. 화분은 딱 하나.' },
};
