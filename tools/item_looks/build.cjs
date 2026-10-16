/**
 * @file build.cjs
 * @description 255차 — 제작 재료 · 설치물 · 집 가구 · 집 안 텃밭 설비 그림(코드 그림 `art_*` · 그림 없던 가구 · 16px 손그림 `px:*` → Gemini 그림). 25종.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/build.cjs --out <폴더>`
 *  · 설치 `--install` → `food assets/items/<파일>` → `node tools/item_cards.cjs`.
 *
 *  코드 그림 키(`art_*`)는 키를 그대로 둔다 — 아이템 · 세이브가 든 `iconTexture`는 그대로이고 그림만 바뀐다.
 *  가구(`furn_*` — 아이템 id가 곧 옛 텍스처 키)는 새 키 `item_furn_*` + `ids`로 잇는다.
 *  가구 그림은 방 안 그림(`data/HomeFurniture.ts` `drawFurnitureArt`)과 같은 색 · 모양이다 —
 *   의자 = 밝은 갈색 원목 · 등받이 살 셋 / 식탁 = 연한 꿀색 상판 · 짙은 갈색 다리 / 소파 = 자주 · 보라 천 · 단추 누빔 셋 · 방석 둘 /
 *   러그 = 짙은 초록 테 · 초록 사선 줄무늬 · 크림색 술 / 화분 = 테라코타 토분 · 길쭉한 잎 다섯 / 협탁 스탠드 = 짙은 갈색 협탁 · 놋쇠 손잡이 · 켜진 크림색 갓 /
 *   라디오 = 붉은 칠 몸통 · 스피커 망 · 크림색 다이얼 창 · 안테나 / 관상 수조 = 원목 받침장 · 파란 물 · 자갈 · 수초 · 짙은 회색 조명 덮개.
 *  수조 셋은 서로 헷갈리지 않게 가른다 — 활어 수조(업소용) = 은색 스테인리스 틀 · 냉각기 · 광어 · 우럭 /
 *   관상용 수족관(설치형) = 받침 없는 검은 테 수조 · 흰 모래 · 열대어 / 관상 수조(집 가구) = 원목 받침장 위.
 *  흰 물건(무명천)은 `keepWhite`, 그물코로 배경이 비쳐야 하는 것(통발 그물망)은 `mesh`.
 */
'use strict';

const REF_PACK = ['food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png', 'food assets/tackle/it_krill_box.png'];
const REF_BAG = ['food assets/tackle/it_bakkan_danax.png', 'food assets/tackle/it_krill_box.png', 'food assets/tackle/it_spinning_reel.png'];
const REF_METAL = ['food assets/tackle/it_spinning_reel.png', 'food assets/tackle/it_swivel_v2.png', 'food assets/tackle/it_bakkan_danax.png'];
const REF_PLANT = ['food assets/crops/asis/crop_strawberry.png', 'food assets/crops/asis/crop_lettuce.png', 'food assets/crops/asis/crop_potato.png'];

/** 그림이 없던 가구 — 아이템 id `furn_<종류>`(BootScene이 방 그림으로 굽던 키) → 새 키 `item_furn_<종류>` */
const furn = (kind, nameKo, nameEn, aspect, refs, look, opt = {}) => ({
  ids: [`furn_${kind}`], file: `furn_${kind}.png`, nameKo, nameEn, aspect, refs, look, ...opt,
});

module.exports = {
  // ── 설치물(마당 · 실내) ──
  art_farm_kit: { file: 'farm_kit.png', nameKo: '텃밭 개간 키트', nameEn: 'Garden bed starter kit', aspect: '4:3', refs: REF_BAG,
    look: '마당에 텃밭 한 구획을 낼 도구를 담은 얕은 나무 궤짝 하나를 비스듬히 앞 위에서 본다. 궤짝은 밝은 소나무 판자로 짠 직사각형 상자(옆판에 판자 이음 줄, 모서리에 못 머리)이고, '
      + '안에 끝이 뾰족한 짧은 나무 말뚝 네 개와 둥글게 감은 흰 노끈 한 타래가 담겨 있으며, 쇠 삽날이 달린 짧은 나무 자루 삽 하나가 궤짝 위로 비스듬히 걸쳐 있다. '
      + '궤짝 앞판 가운데에 초록 새싹 두 잎 모양 그림 하나만 찍혀 있다(글자 없음). 흙 · 풀 없음.' },
  art_fence: { file: 'fence.png', nameKo: '울타리', nameEn: 'Wooden fence section', aspect: '4:3', refs: REF_BAG,
    look: '나무 울타리 한 칸(한 토막)을 비스듬히 앞 위에서 본 모습. 양 끝에 굵은 네모 나무 기둥 두 개가 서 있고(위 끝은 평평하게 자르고 모서리를 살짝 깎았다), '
      + '두 기둥 사이를 굵은 가로대 두 줄(위 · 아래)이 가로지른다. 가로대가 기둥에 닿는 자리마다 검은 못 머리 두 개. '
      + '나무는 햇볕에 바랜 중간 갈색이고 세로 나뭇결과 옹이 몇 개, 기둥 밑동 쪽이 조금 짙다. 세워 놓은 한 칸만, 흙 · 풀 없음.' },
  art_aquarium_live: { file: 'aquarium_live.png', nameKo: '활어 수조 (업소용)', nameEn: 'Commercial live-fish tank', aspect: '4:3', refs: REF_BAG,
    look: '횟집 앞에 두는 업소용 활어 수조 하나를 비스듬히 앞 위에서 본다. 가로로 긴 큰 직사각형 유리 수조를 은색 스테인리스 각관 틀이 감싸고, '
      + '아래는 같은 은색 스테인리스 받침대(짧은 다리 넷과 아래 선반)다. 수조 위 뒤쪽 가장자리에 회색 냉각기 상자 하나와 거기서 물속으로 내려가는 검은 호스 두 가닥. '
      + '안에는 맑고 차가운 파란 물이 가득하고 한쪽 구석에서 하얀 공기 방울 줄기가 올라온다. 물속에 아래쪽에 납작 붙은 갈색 광어 한 마리와 회갈색 우럭 두 마리. 가격표 · 글자 없음.' },
  art_aquarium_display: { file: 'aquarium_display.png', nameKo: '관상용 수족관', nameEn: 'Display aquarium', aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '실내에 두는 관상용 수족관 하나(받침장 없이 수조만)를 비스듬히 앞 위에서 본다. 가로로 조금 긴 직사각형 유리 수조, 테두리는 얇은 검은 틀, '
      + '위에 검은 조명 덮개가 얹혀 아래로 하얀 불빛이 물에 비친다. 바닥에 흰 모래와 둥근 회색 돌 두어 개, 길게 하늘거리는 초록 수초 서너 포기, '
      + '작은 열대어 세 마리(주황 바탕에 흰 줄무늬 하나 · 노랑 하나 · 파랑 하나)가 떠 있다. 물은 맑은 연청록.' },
  art_workbench: { file: 'workbench.png', nameKo: '작업대', nameEn: 'Workbench', aspect: '4:3', refs: REF_BAG,
    look: '마당에 두는 튼튼한 나무 작업대 하나를 비스듬히 앞 위에서 본다. 두툼한 원목 상판(밝은 갈색 판자 서너 장을 이었고 칼자국 · 얼룩이 조금), '
      + '굵은 네모 다리 넷, 다리 사이 아래쪽에 판자 선반 하나. 상판 왼쪽 끝에 회색 쇠 바이스가 물려 있고, 상판 위에 나무 자루 망치 하나와 작은 톱 하나가 놓였다.' },

  // ── 제작 재료 ──
  art_wood: { file: 'wood.png', nameKo: '목재', nameEn: 'Lumber bundle', aspect: '1:1', refs: REF_BAG,
    look: '제작에 쓰는 목재 한 묶음이 대각선으로 놓였다. 밝은 노르스름한 소나무 각목 두 개와 납작한 판자 두 장(길이가 비슷한 막대 모양)을 가지런히 포개 '
      + '두 군데를 갈색 노끈으로 묶었다. 앞쪽 잘린 마구리에 나이테가 보이고 옆면에 세로 나뭇결과 옹이 하나. 껍질 없는 깨끗한 제재목.' },
  art_wire: { file: 'wire.png', nameKo: '철사', nameEn: 'Wire coil', aspect: '1:1', refs: REF_METAL,
    look: '철사 한 타래. 은회색 아연 도금 철사를 둥근 고리로 수십 바퀴 감은 타래를 비스듬히 위에서 본 모습(납작한 도넛 모양, 가운데는 비어 있다). '
      + '가닥이 겹겹이 감긴 결이 보이고 빛이 닿는 쪽은 밝게 반짝인다. 타래를 세 군데 짧은 철사로 꼬아 동여맸고, 한쪽 끝 한 가닥이 바깥으로 조금 풀려 구불하게 삐져나왔다.' },
  art_resin: { file: 'resin.png', nameKo: '에폭시 수지', nameEn: 'Two-part epoxy resin', aspect: '1:1', refs: REF_PACK, count: 2,
    look: '에폭시 수지 한 세트 — 주제와 경화제, 크기가 같은 작은 플라스틱 병 두 개가 나란히 서 있다. 왼쪽 병은 투명해서 안의 맑은 꿀빛 액체가 보이고 검은 뚜껑, '
      + '오른쪽 병은 반투명 흰 병에 짙은 호박색 액체가 비치고 빨간 뚜껑. 두 병 모두 뚜껑 끝이 뾰족한 노즐이고, 몸통 가운데에 뚜껑과 같은 색 단색 띠가 하나씩 있다. 글자 없음.' },
  art_paint: { file: 'paint.png', nameKo: '도료 세트', nameEn: 'Lure paint set', aspect: '4:3', refs: REF_PACK,
    look: '루어 칠하는 도료 한 세트 — 작고 납작한 둥근 금속 깡통 세 개가 나란히 붙어 한 덩어리를 이루고, 뚜껑을 열어 안의 걸쭉한 도료가 보인다(빨강 · 파랑 · 노랑 하나씩). '
      + '깡통 옆면은 은색에 안의 도료 색과 같은 띠가 둘렸고, 테두리에 흘러내린 도료 자국 한 줄. 깡통 위에 나무 자루 가는 붓 하나가 비스듬히 걸쳐 있고 붓끝에 파란 도료가 묻었다. 글자 없음.' },
  art_tin_ingot: { file: 'tin_ingot.png', nameKo: '주석 잉곳', nameEn: 'Tin ingots', aspect: '4:3', refs: REF_METAL, count: 3,
    look: '주석 잉곳 — 윗면이 좁고 아랫면이 넓은 사다리꼴 막대 모양 은백색 금속 덩어리(주괴)를 피라미드처럼 쌓았다(아래에 둘, 그 위 가운데에 하나). '
      + '윗면은 살짝 푸른 기가 도는 밝은 은색으로 매끈하게 반짝이고, 비스듬한 옆면은 조금 무광의 회색, 모서리는 살짝 둥글다. 각인 · 글자 없음.' },
  art_mesh_roll: { file: 'mesh_roll.png', nameKo: '통발 그물망', nameEn: 'Trap netting roll', aspect: '4:3', refs: REF_BAG, mesh: true,
    look: '통발 만드는 그물망 한 두루마리. 짙은 녹색 나일론 그물을 굵은 원통으로 말아 옆으로 눕혀 놓았고, 두루마리 두 군데를 노란 끈으로 묶었다. '
      + '앞쪽 아래로 한 자락이 풀려 나와 펼쳐져 있는데, 그 자락은 작은 마름모 그물눈이 또렷하고 그물눈 사이 구멍은 비어 있다(흰 배경이 그대로 보인다). '
      + '두루마리 마구리에도 겹겹이 감긴 그물 결이 보인다.' },
  art_rod_blank: { file: 'rod_blank.png', nameKo: '로드 블랭크', nameEn: 'Fishing rod blanks', aspect: '1:1', refs: REF_METAL, count: 3,
    look: '커스텀 낚싯대를 만들 블랭크 — 가이드 · 손잡이 · 릴시트가 하나도 달리지 않은 맨 탄소 대롱 세 대가 나란히 대각선으로 놓였다(가는 끝이 왼쪽 위, 굵은 끝이 오른쪽 아래). '
      + '끝으로 갈수록 가늘어지고, 표면은 검은 카본에 가는 사선 직조 무늬와 길쭉한 광택 줄. 굵은 끝 마구리는 속이 빈 동그란 구멍이 보이고, 굵은 쪽 가까이에 얇은 금색 띠가 하나씩 둘렸다.' },
  art_gear_set: { file: 'gear_set.png', nameKo: '정밀 기어 세트', nameEn: 'Precision reel gear set', aspect: '4:3', refs: REF_METAL,
    look: '릴 튜닝용 정밀 기어 세트 — 뚜껑 없는 얕은 검정 플라스틱 케이스 하나를 비스듬히 위에서 본다. 케이스 안 짙은 회색 스펀지에 파인 홈마다 부품이 하나씩 박혀 있다: '
      + '금색 황동 톱니바퀴 큰 것 하나와 중간 것 하나, 은색 스테인리스 톱니바퀴 두 개(크기가 다르다), 작은 은색 볼베어링 고리 세 개, 가는 축 핀 하나. 톱니 하나하나가 또렷하다. 글자 없음.' },
  art_cloth: { file: 'cloth.png', nameKo: '무명천', nameEn: 'Cotton cloth', aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '무명천 한 묶음 — 누르스름한 흰 면천을 네모나게 접어 서너 겹 포갠 꾸러미를 비스듬히 위에서 본다. 접힌 가장자리마다 겹이 보이고, '
      + '천 겉에 씨실 · 날실 올이 은은한 격자 결로 보인다. 가운데를 파란 끈 한 줄로 가로질러 묶었다. 흰 부분도 연한 회색 그늘과 진한 윤곽선으로 또렷하게.' },
  art_herb: { file: 'herb.png', nameKo: '약초', nameEn: 'Medicinal herbs', aspect: '1:1', refs: REF_PLANT,
    look: '산과 들에서 캔 약초 한 묶음 — 톱니 모양으로 깊게 갈라진 초록 잎(쑥 · 당귀 잎처럼, 잎 뒷면은 은녹색)이 달린 줄기 대여섯 대를 모아 아래쪽을 지푸라기 끈으로 묶은 다발. '
      + '아래 끝에는 흙을 털어 낸 연갈색 잔뿌리 몇 가닥이 붙어 있다. 대각선으로 눕혀 놓았다.' },

  // ── 집 가구(방 안 그림과 같은 색 · 모양) ──
  item_furn_chair: furn('chair', '나무 의자', 'Wooden chair', '3:4', REF_BAG,
    '식탁 앞에 두는 나무 의자 하나를 비스듬히 앞 위에서 본다. 꿀빛이 도는 밝은 갈색 원목 — 네모난 좌판, 뒤쪽에 곧게 선 등받이(위 가로대 하나와 그 아래 세로 살 세 개), '
    + '곧은 네모 다리 넷과 다리 사이 가로 버팀대. 좌판 윗면이 가장 밝고 옆면 · 다리는 조금 짙은 갈색, 나뭇결이 은은하다. 방석 · 장식 없음.'),
  item_furn_island: furn('island', '2인용 식탁', 'Dining table for two', '4:3', REF_BAG,
    '둘이 앉으면 딱 맞는 작은 원목 식탁 하나를 비스듬히 앞 위에서 본다. 연한 꿀색 · 베이지빛 밝은 원목 직사각형 상판(가로가 세로의 두 배쯤, 가장자리 위 모서리에 밝은 빛 줄)과 '
    + '그 아래 짙은 갈색 곧은 다리 넷. 상판에 은은한 나뭇결. 위에 아무것도 올려놓지 않았고 의자 없음.'),
  item_furn_sofa: furn('sofa', '2인용 소파', 'Two-seat sofa', '4:3', REF_BAG,
    '2인용 천 소파 하나를 정면에서 조금 위로 비스듬히 본다. 천은 진한 자두색 · 자주빛 보라, 높은 등받이에 단추 누빔 세 개가 가로로 나란하고, '
    + '좌판에 네모난 방석 두 개(가운데 솔기, 방석은 등받이보다 밝은 연보라), 양옆에 둥근 머리의 두툼한 팔걸이, 아래에 짙은 갈색 짧은 나무 다리. 둘레는 짙은 보라 윤곽. 쿠션 · 담요 없음.'),
  item_furn_rug: furn('rug', '러그', 'Rug', '4:3', REF_BAG,
    '직사각형 러그 한 장을 판판하게 펼쳐 놓고 비스듬히 위에서 본다(말지 않음). 가장자리를 짙은 초록 띠가 두르고, 안쪽은 초록과 조금 짙은 초록이 번갈아 드는 사선 줄무늬 결. '
    + '위쪽과 아래쪽 긴 변 끝에 크림색 술이 촘촘히 달려 있다. 두께가 조금 있는 짠 천의 질감.'),
  item_furn_plant: furn('plant', '화분', 'Potted plant', '3:4', REF_PLANT,
    '집 안에 두는 화분 하나. 주황빛 테라코타 토분(위가 넓고 아래가 좁은 원뿔대, 입구 테가 두툼하다)에 짙은 흙이 담겨 있고, '
    + '길쭉하고 끝이 뾰족한 초록 잎 대여섯 장이 가운데에서 부채꼴로 위로 뻗어 있다(잎 끝은 밝은 연두, 안쪽은 짙은 초록). 받침 접시 없음.'),
  item_furn_stand: furn('stand', '협탁 스탠드', 'Bedside table with lamp', '3:4', REF_BAG,
    '침대 머리맡에 두는 작은 협탁과 그 위의 스탠드 한 덩어리. 협탁은 짙은 갈색 원목 네모 상자꼴(서랍 하나, 서랍 가운데 작은 놋쇠 손잡이, 위 모서리에 밝은 빛 줄)이고, '
    + '그 위에 가는 짙은 갈색 기둥의 스탠드가 서 있으며, 위가 좁고 아래가 넓은 크림색 천 갓이 노랗게 켜져 따뜻한 불빛을 낸다.'),
  item_furn_radio: furn('radio', '라디오', 'Radio', '4:3', REF_BAG,
    '옛날식 휴대용 라디오 하나를 비스듬히 앞에서 본다. 가로로 긴 둥근 모서리 상자 몸통은 짙은 붉은 칠(검붉은 벽돌색), 앞면 왼쪽 절반은 촘촘한 구멍이 난 짙은 스피커 망, '
    + '오른쪽 위에 크림색 주파수 창(빨간 바늘 하나와 눈금 줄만 — 숫자 없음), 그 아래 크림색 둥근 다이얼 손잡이 두 개. '
    + '위에 검은 손잡이가 활처럼 걸려 있고, 오른쪽 뒤에서 은색 막대 안테나가 비스듬히 위로 뻗었다.'),
  item_furn_aquarium: furn('aquarium', '관상 수조', 'Home aquarium', '4:3', REF_BAG,
    '집 안에 두는 관상 수조 가구 하나를 비스듬히 앞 위에서 본다. 짙은 갈색 원목 받침장(낮은 장, 앞에 문 두 짝) 위에 가로로 긴 유리 수조가 얹혀 있고, '
    + '수조 위는 짙은 회색 조명 덮개로 덮였다. 물은 맑은 파랑(아래로 갈수록 짙다), 바닥에 베이지 자갈, 양쪽 가장자리에 초록 수초 몇 포기, 작은 은회색 물고기 한 마리. '
    + '유리 앞면에 비스듬한 흰 반사 한 줄.'),

  // ── 집 안 텃밭 설비(16px 손그림 → 새 그림) ──
  item_sprout_jar: { px: ['px:it_sprout_jar'], file: 'sprout_jar.png', nameKo: '콩나물 시루', nameEn: 'Bean sprout jar', aspect: '3:4', refs: REF_BAG,
    look: '집 안에서 콩나물을 기르는 옹기 시루 한 벌. 짙은 갈색 유약이 반짝이는 옹기 시루(위가 넓고 아래로 좁아지는 둥근 항아리꼴, 양옆에 작은 손잡이 귀)가 '
      + '회색 물받이 대야 위에 얹혀 있다. 시루 입구는 흰 무명 보자기로 덮었고, 보자기 가장자리 밑으로 노란 콩나물 머리 몇 개가 살짝 보인다. '
      + '시루 밑 구멍에서 물방울 두어 개가 대야로 떨어진다.' },
  item_hydro_rack: { px: ['px:it_hydro_rack'], file: 'hydro_rack.png', nameKo: '수경 재배기', nameEn: 'Hydroponic rack', aspect: '3:4', refs: REF_BAG,
    look: '집 안에서 잎채소를 기르는 두 칸 수경 재배기 하나를 비스듬히 앞 위에서 본다. 회색 금속 기둥 네 개로 된 좁고 높은 선반에 칸이 두 개 있고, '
      + '칸마다 위쪽에 하얗게 빛나는 LED 생장등 막대가 달려 있으며, 그 아래에 물이 흐르는 파란 물받이 홈통이 가로로 놓여 홈통 구멍마다 초록 상추 · 잎채소 모종이 한 줄로 꽂혀 싱싱하게 자란다. '
      + '맨 아래 칸에 작은 흰 물탱크와 거기서 위로 올라가는 가는 투명 호스.' },
};
