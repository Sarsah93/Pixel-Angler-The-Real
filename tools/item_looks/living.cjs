/**
 * @file living.cjs
 * @description 255차 — 생활 물건 그림(약 · 구급품 · 화구 · 냄비 · 칼 · 회 접시 · 자전거 · 증서 · 도면 · 이야기 물건).
 *  코드로 그린 임시 그림(`art_*`)은 키를 그대로 두고 그림만 바뀐다. 16px 손그림만 있던 심부름 물건 둘(`px:it_bamboo_tray` · `px:it_food_box`)은
 *  새 키 `item_*` + `px`로 잇는다. 생성기 `tools/gemini_item_art.cjs`.
 *  - 칼 다섯 자루는 모두 칼날 끝이 오른쪽 위인 대각선 — 손잡이 나무 · 색, 칼날 길이 · 폭, 다마스커스 무늬(단조), 빨간 테이프 · 녹빛(정옥선)으로 가른다.
 *  - 회 접시 넷은 한 축척으로 크기를 보일 수 없어 모양을 바꾼다: 작은 둥근 접시 → 긴 직사각 접시 → 큰 타원 접시(물결 테) → 아주 큰 둥근 쟁반.
 *    회는 올리지 않고 차조기 잎 장식만. 흰 그릇이라 `keepWhite`.
 *  - 양수 냄비는 불요리 사진(`public/food/stew_red*.png`)의 검은 양수 냄비와 같은 냄비로 그린다(같은 부엌).
 *  - 반찬통은 16px 손그림의 뜻(보자기 매듭 · 금박 무늬)을 잇는다.
 *  `keepWhite` — 속이 비치는 고리 · 틈이 없는 물건만(흰 반짝임 · 흰 라벨이 구멍으로 뚫리지 않게). 고리 손잡이 · 바퀴살 · 석쇠 격자가 있는 것은 끈다.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/living.cjs --out <폴더>` · 설치는 같은 줄에 `--install`.
 */
'use strict';

/** 화풍 참고(ROOT 기준) — 포장된 물건 · 봉지 · 상자 · 병 */
const REF_PACK = ['food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png', 'food assets/tackle/it_krill_box.png'];
/** 일반 물건 */
const REF_BAG = ['food assets/tackle/it_bakkan_danax.png', 'food assets/tackle/it_krill_box.png', 'food assets/tackle/it_spinning_reel.png'];
/** 금속 도구 · 칼 · 조리 도구 */
const REF_METAL = ['food assets/tackle/it_spinning_reel.png', 'food assets/tackle/it_swivel_v2.png', 'food assets/tackle/it_bakkan_danax.png'];
/** 음식(첫 장 = 매운탕 검은 양수 냄비) */
const REF_FOOD = ['packages/client-pc/public/food/stew_red_whole.png', 'food assets/crops/asis/crop_strawberry.png', 'food assets/tackle/it_krill_block.png'];

/** 흰 부분이 배경에 묻히지 않게 붙이는 문구 */
const WHITE = '흰 부분도 진한 윤곽선과 연회색 그늘로 또렷하게.';
/** 칼 공통 구도 */
const KNIFE = '칼날 끝이 오른쪽 위, 손잡이가 왼쪽 아래인 대각선으로 놓인 칼 한 자루. ';

module.exports = {
  // ── 약 · 구급품 ──
  art_ointment: { file: 'ointment.png', nameKo: '상처 연고', nameEn: 'Wound ointment tube', aspect: '4:3', refs: REF_PACK, keepWhite: true,
    look: '상처 연고 한 개 — 손가락 길이의 작은 연고 튜브. 몸통은 흰색에 초록 띠와 작은 흰 십자 무늬(글자 없음), 한쪽 끝은 납작하게 접혀 눌린 꼬리, '
      + '다른 끝은 주황색 돌림 뚜껑. 대각선으로 눕혀 놓았다(뚜껑이 오른쪽 위). ' + WHITE },
  art_tonic_drink: { file: 'tonic_drink.png', nameKo: 'HP 회복 드링크', nameEn: 'Energy tonic drink', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '한국 약국의 피로 회복 드링크 한 병 — 손바닥에 쏙 드는 작은 갈색 유리병(어깨가 둥글고 몸통이 통통하다), 짙은 호박색 유리 너머로 '
      + '주황빛 음료가 비친다. 금색 알루미늄 돌려 따는 뚜껑, 몸통 가운데에 노랑 · 빨강 띠 라벨(글자 없음). 세워 놓고 비스듬히 위에서 본 모습.' },
  art_pill_seasick: { file: 'pill_seasick.png', nameKo: '멀미약', nameEn: 'Motion sickness pills', aspect: '4:3', refs: REF_PACK, keepWhite: true,
    look: '멀미약 한 판 — 작은 직사각형 알약 포장(블리스터) 한 장. 은박 판 위에 볼록한 투명 플라스틱 칸 여섯 개(2줄 × 3칸)가 있고 '
      + '칸마다 하늘색 둥근 알약이 하나씩 들어 있다. 판 한쪽 빈 자리에 작은 파란 배와 물결 그림(글자 없음). 비스듬히 위에서 본 모습.' },
  art_medicine: { file: 'medicine.png', nameKo: '종합 상비약', nameEn: 'Household medicine box', aspect: '1:1', refs: REF_PACK, keepWhite: true,
    look: '종합 상비약 한 상자 — 손바닥만 한 직사각형 종이 약 상자 하나, 흰 바탕에 초록 띠와 큰 초록 십자 무늬(글자 없음). '
      + '상자 윗뚜껑이 열려 있고 그 안에서 빨강 · 흰색 캡슐 알약이 든 은박 블리스터 한 판이 반쯤 빠져나와 있다. 비스듬히 위에서 본 모습. ' + WHITE },
  art_bandage: { file: 'bandage.png', nameKo: '멸균 붕대', nameEn: 'Sterile gauze bandage roll', aspect: '4:3', refs: REF_PACK, keepWhite: true,
    look: '멸균 붕대 한 롤 — 하얀 거즈 붕대를 단단히 감은 원통 롤 하나가 옆으로 누워 있고, 끝자락이 조금 풀려 앞으로 늘어져 있다. '
      + '거즈의 성긴 올 무늬(가는 격자)가 보이고 롤 옆면에 동심원 감김 줄무늬, 롤 가운데 구멍은 없다. 풀린 끝을 고정하는 작은 은색 클립 하나. '
      + '흰 거즈도 진한 윤곽선과 연회색 · 하늘빛 그늘로 또렷하게.' },
  art_splint: { file: 'splint.png', nameKo: '의료용 부목', nameEn: 'Padded medical splint', aspect: '1:1', refs: REF_PACK, keepWhite: true,
    look: '의료용 부목 하나 — 팔에 대는 길쭉하고 납작한 판(손바닥 폭, 팔 길이)이 오른쪽 위로 비스듬한 대각선으로 놓여 있다. '
      + '겉은 주황색 스펀지 패드로 감쌌고 가장자리로 은색 알루미늄 판이 살짝 보이며, 판을 가로질러 검은 찍찍이 끈 두 줄이 감겨 있다.' },
  // ── 밤 낚시 · 탈것 ──
  art_mosquito_coil: { file: 'mosquito_coil.png', nameKo: '모기향', nameEn: 'Mosquito coil', aspect: '4:3', refs: REF_BAG,
    look: '모기향 하나 — 짙은 초록색 소용돌이(나선) 모기향 한 판이 작은 둥근 양철 받침 접시 위에 놓여 있다. 나선은 다섯 바퀴쯤 감기고 바퀴 사이로 '
      + '은회색 받침이 보인다. 나선 바깥 끝에 빨간 불씨가 붙어 있고 거기서 가는 회색 연기 한 줄기가 위로 피어오른다. 받침 가운데에 모기향을 꽂는 작은 금속 핀. '
      + '비스듬히 위에서 본 모습.' },
  art_bike: { file: 'bike.png', nameKo: '자전거', nameEn: 'City bicycle', aspect: '4:3', refs: REF_BAG,
    look: '생활 자전거 한 대 — 옆에서 조금 비스듬히 본 모습, 앞바퀴가 오른쪽. 짙은 청록색 프레임, 검은 타이어와 은색 바퀴살이 보이는 두 바퀴, '
      + '검은 안장, 은색 핸들과 검은 손잡이, 체인과 페달, 뒷바퀴 위에 은색 짐받이, 두 바퀴 위에 흙받이. 바구니 · 사람 없음. 바퀴살 사이 빈 곳과 프레임 안쪽은 배경색.' },
  // ── 화구 · 연료 · 조리 도구 ──
  art_stove_portable: { file: 'stove_portable.png', nameKo: '휴대용 가스스토브', nameEn: 'Portable butane stove', aspect: '4:3', refs: REF_METAL, keepWhite: true,
    look: '한국식 휴대용 가스스토브(부루스타) 하나 — 납작한 직사각형 상자 모양 몸통, 윗판은 은색 스테인리스, 옆판은 검정. '
      + '윗판 가운데에 둥근 버너와 그 위에 냄비를 얹는 검은 네 갈래 받침, 앞면 오른쪽에 둥근 점화 손잡이, 왼쪽에 부탄가스 캔을 넣는 칸의 덮개(닫힘). '
      + '비스듬히 위에서 본 모습. 글자 · 로고 없음.' },
  art_gascan: { file: 'gascan.png', nameKo: '부탄 캐니스터', nameEn: 'Butane gas canister', aspect: '3:4', refs: REF_PACK, keepWhite: true,
    look: '휴대용 부탄가스 캔 하나 — 길쭉한 원통형 금속 캔(높이가 지름의 세 배쯤)을 세워 놓았다. 몸통은 흰 바탕에 빨간 · 파란 굵은 색띠와 '
      + '작은 주황 불꽃 그림(글자 없음), 위쪽은 은색 금속 어깨와 노즐에 주황색 플라스틱 뚜껑. 비스듬히 위에서 본 모습. ' + WHITE },
  art_pot_camp: { file: 'pot_camp.png', nameKo: '코펠 냄비 (1.8L)', nameEn: 'Camping pot', aspect: '4:3', refs: REF_METAL,
    look: '캠핑용 코펠 냄비 하나 — 얇은 알루미늄 냄비, 겉은 금빛 · 샴페인색 아노다이징 광택, 키가 낮은 원통형. 뚜껑을 덮었고 뚜껑 가운데에 작은 검은 손잡이. '
      + '몸통 양옆에 접었다 펴는 가는 은색 철사 손잡이 두 개(펼쳐서 위로 세운 모습). 가볍고 얇은 캠핑 도구 느낌. 비스듬히 위에서 본 모습.' },
  art_pot_home: { file: 'pot_home.png', nameKo: '양수 냄비 (3.5L)', nameEn: 'Two-handled stock pot', aspect: '4:3', refs: REF_FOOD,
    look: '집 부엌용 양수 냄비 하나 — 첫 번째 참고 그림의 매운탕 냄비와 같은 검은 냄비(이 냄비만은 참고 그림을 따른다): 두툼한 검은 무쇠 · 법랑 냄비, '
      + '넓고 깊은 원통형, 몸통 양옆에 둥근 고리 손잡이 두 개. 속은 비어 있고 검은 뚜껑(가운데 둥근 손잡이)을 덮었다. 묵직하고 두꺼운 느낌. 비스듬히 위에서 본 모습.' },
  art_pan: { file: 'pan.png', nameKo: '프라이팬', nameEn: 'Frying pan', aspect: '4:3', refs: REF_METAL,
    look: '프라이팬 하나 — 둥글고 얕은 검은 코팅 프라이팬(안쪽 바닥은 매끈한 짙은 회흑색, 바깥은 검정), 길고 곧은 손잡이가 오른쪽 아래로 뻗는다. '
      + '손잡이는 검은 플라스틱에 끝에 거는 구멍 하나, 팬과 손잡이 이음에 은색 리벳. 비어 있다. 비스듬히 위에서 본 모습.' },
  art_grate: { file: 'grate.png', nameKo: '석쇠', nameEn: 'Wire grill grate', aspect: '1:1', refs: REF_METAL, mesh: true,
    look: '직화 구이용 석쇠 하나 — 굵은 은색 철사로 만든 네모난 테 안에 가는 철사가 촘촘한 격자(그물코가 고르게 네모나다)를 이루고, 테 한쪽에서 '
      + '긴 철사 손잡이 두 가닥이 나와 끝에서 짧은 나무 손잡이로 모인다. 격자 철사는 불에 그을려 군데군데 검게 탔다. 대각선으로 놓인다(손잡이가 오른쪽 아래). '
      + '격자 사이 빈 곳은 배경색.' },
  // ── 칼 ──
  art_knife_sashimi: { file: 'knife_sashimi.png', nameKo: '회칼 (사시미)', nameEn: 'Standard sashimi knife', aspect: '1:1', refs: REF_METAL, keepWhite: true,
    look: KNIFE + '표준 회칼(사시미 칼) — 길고 가는 외날 칼날(손잡이의 두 배 길이, 끝이 뾰족하다)은 매끈한 은색 스테인리스, 날 쪽에 가늘게 빛나는 연마 띠. '
      + '손잡이는 무늬 없는 연한 미색 원목(둥근 타원 단면)이고 칼날 쪽 끝에 검은 플라스틱 테. 장식 없는 평범한 표준품.' },
  art_knife_yanagiba: { file: 'knife_yanagiba.png', nameKo: '장인 야나기바', nameEn: 'Artisan yanagiba knife', aspect: '1:1', refs: REF_METAL, keepWhite: true,
    look: KNIFE + '장인이 만든 야나기바(일식 회칼) — 칼날은 손잡이의 두 배 반 길이로 아주 길고 가늘며, 거울처럼 광이 나는 은색에 날을 따라 물결치는 '
      + '흐린 경계선(손으로 간 칼날 무늬)이 보인다. 손잡이는 짙은 적갈색 자단 나무 팔각 손잡이(모서리 면이 또렷하다), 칼날 쪽 끝에 흰 · 미색 물소뿔 테. 고급스럽다.' },
  art_knife_yanagiba_pro: { file: 'knife_yanagiba_pro.png', nameKo: '야나기바 (장인 단조)', nameEn: 'Hand-forged Damascus yanagiba', aspect: '1:1', refs: REF_METAL, keepWhite: true,
    look: KNIFE + '장인이 두드려 단조한 최고급 야나기바 — 가장 긴 회칼(칼날이 손잡이의 세 배). 칼날 전체에 다마스커스 강철 특유의 물결 · 나뭇결 겹무늬'
      + '(밝은 은색과 짙은 회색 줄이 굽이친다), 날 쪽 가장자리는 거울처럼 밝게 갈렸고 칼등 쪽은 망치 자국이 남은 거친 검은 단조 면. '
      + '손잡이는 새까만 흑단 팔각 손잡이에 칼날 쪽 끝이 검은 물소뿔 테, 그 사이에 가는 은색 고리 하나. 묵직하고 귀하다.' },
  art_knife_utility: { file: 'knife_utility.png', nameKo: '범용 막칼', nameEn: 'Cheap utility kitchen knife', aspect: '1:1', refs: REF_METAL, keepWhite: true,
    look: KNIFE + '범용 막칼(평범한 부엌 식칼) — 회칼보다 짧고 넓적한 양날 칼날(손잡이보다 조금 긴 정도, 칼날 폭이 넓고 끝으로 갈수록 둥글게 휘어 뾰족하다), '
      + '평범한 무광 은색 스테인리스. 손잡이는 검은 플라스틱에 은색 리벳 세 개. 값싸고 투박하다.' },
  art_knife_okseon: { file: 'knife_okseon.png', nameKo: '정옥선의 손질 칼', nameEn: "Okseon's old fish-cleaning knife", aspect: '1:1', refs: REF_METAL, keepWhite: true,
    look: KNIFE + '시장 생선 가게 할머니가 수십 년 쓴 낡은 생선 손질 칼 — 칼날은 두툼하고 넓적한 세모꼴(데바 칼 모양, 손잡이와 길이가 비슷), '
      + '칼등 쪽은 검회색 녹빛 얼룩과 거뭇한 손때, 날 쪽은 숫돌에 하도 갈아 폭이 좁아지고 밝게 빛나며 작은 이 빠진 자국이 한두 군데. '
      + '손잡이는 오래 써서 검게 변한 나무인데 가운데를 빛바랜 빨간 절연 테이프로 여러 번 감았다. 낡았지만 날은 잘 선 정든 칼.' },
  // ── 회 접시(크기마다 모양이 다르다 — 회 없이 장식 잎만) ──
  art_plate_s: { file: 'plate_s.png', nameKo: '사시미 접시 (소)', nameEn: 'Small round sashimi plate', aspect: '1:1', refs: REF_BAG, keepWhite: true,
    look: '회를 담는 작은 접시 — 지름이 한 뼘쯤 되는 작고 둥근 흰 도자기 접시 하나를 비스듬히 위에서 본 모습(타원으로 보인다). '
      + '가장자리에 짙은 남색 테 한 줄, 접시가 얕게 오목하다. 접시 위쪽 가장자리에 초록 차조기(시소) 잎 한 장만 장식으로 놓였고 회는 없다. ' + WHITE },
  art_plate_m: { file: 'plate_m.png', nameKo: '사시미 접시 (중)', nameEn: 'Long rectangular sashimi plate', aspect: '16:9', refs: REF_BAG, keepWhite: true,
    look: '회를 담는 중간 접시 — 길쭉한 직사각형 흰 도자기 접시 하나(가로가 세로의 두 배 반), 비스듬히 위에서 본 모습. 네 모서리가 살짝 위로 들린 얕은 판이고, '
      + '가장자리를 따라 연한 회청색 유약 띠가 둘렀다. 한쪽 끝에 초록 차조기 잎 두 장과 하얀 무순 조금, 회는 없다. ' + WHITE },
  art_plate_l: { file: 'plate_l.png', nameKo: '사시미 접시 (대)', nameEn: 'Large oval sashimi plate', aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '회를 담는 큰 접시 — 큼직한 타원형 흰 도자기 접시 하나, 비스듬히 위에서 본 모습. 넓은 테두리에 짙은 남색 물결 무늬(파도 문양)가 한 바퀴 그려져 있고 '
      + '가운데는 얕게 오목하다. 접시 한쪽에 초록 차조기 잎 세 장과 노란 식용 국화 한 송이, 회는 없다. ' + WHITE },
  art_plate_xl: { file: 'plate_xl.png', nameKo: '사시미 접시 (특대)', nameEn: 'Huge round sashimi platter', aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '모듬회를 담는 아주 큰 둥근 쟁반 접시 — 대형 둥근 흰 도자기 접시 하나, 비스듬히 위에서 본 모습(넓은 타원). 두툼한 테두리에 짙은 남색 띠와 '
      + '금색 가는 테 두 줄, 바닥에 낮은 굽. 접시 한가운데에 하얗게 채 썬 무를 소복이 깐 자리 하나와 그 둘레 사방에 초록 차조기 잎 네 장, 회는 없다. '
      + '아주 크고 화려하다. ' + WHITE },
  // ── 손도구 · 증서 · 도면 ──
  art_watering_can: { file: 'watering_can.png', nameKo: '물뿌리개', nameEn: 'Tin watering can', aspect: '4:3', refs: REF_METAL,
    look: '양철 물뿌리개 하나 — 은회색 함석(아연 도금 양철) 물뿌리개, 둥근 원통 몸통에 가로 이음 띠가 두 줄, 위에서 뒤쪽으로 둥글게 휜 손잡이, '
      + '몸통 앞쪽 아래에서 비스듬히 길게 뻗은 가는 물 대롱 끝에 구멍이 촘촘한 둥근 물뿌리개 머리. 옆에서 조금 비스듬히 본 모습, 물 대롱이 오른쪽. '
      + '손잡이 고리 안쪽은 배경색.' },
  art_certificate: { file: 'certificate.png', nameKo: '조업 재교육 이수증', nameEn: 'Training course certificate', aspect: '3:4', refs: REF_BAG, keepWhite: true,
    look: '수료증 한 장 — 두툼한 상아색 종이 증서 한 장, 비스듬히 위에서 본 모습(아래 한쪽 모서리가 살짝 말려 올라감). 가장자리를 따라 짙은 청록색 장식 테두리 무늬, '
      + '위쪽 가운데에 금색 둥근 문장(닻과 물고기 모양) 하나, 가운데에 글자 대신 가는 회색 가로줄 여러 줄, 오른쪽 아래에 빨간 네모 도장 자국 하나. '
      + '실제 글자 · 숫자 없음.' },
  art_blueprint: { file: 'blueprint.png', nameKo: '도면', nameEn: 'Blueprint sheet', aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '도면 한 장 — 파란 청사진 종이 한 장이 반쯤 펼쳐져 있고 오른쪽 끝은 둥글게 말려 있다. 파란 바탕에 흰 가는 선으로 그린 기술 도면: '
      + '낚시찌 하나와 낚싯바늘 하나의 옆모습, 치수선과 화살표, 옅은 모눈 격자. 글자 · 숫자 없음(치수선에도 숫자를 쓰지 않는다). 비스듬히 위에서 본 모습.' },
  // ── 이야기 물건 · 심부름 ──
  art_ice_crate: { file: 'ice_crate.png', nameKo: '정옥선의 심부름용 얼음 상자', nameEn: 'Errand ice box', aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '시장 생선 가게에서 쓰는 심부름용 얼음 상자 하나 — 뚜껑을 덮은 두툼한 흰 스티로폼 상자(작은 여행 가방만 한 크기, 깊다)를 빨간 비닐 노끈으로 '
      + '열십자로 꽁꽁 묶었고, 노끈 매듭 위에 손으로 드는 고리. 뚜껑 한쪽에 파란 테이프 한 줄, 상자 아래 이음매에 물방울 몇 개가 맺혀 있다. '
      + '비스듬히 위에서 본 모습. 글자 없음. ' + WHITE },
  item_bamboo_tray: { file: 'bamboo_tray.png', px: ['px:it_bamboo_tray'], nameKo: '탁만수의 대나무 얼음 받침', nameEn: 'Handmade bamboo ice tray',
    aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '죽간 공방 장인이 손으로 깎아 엮은 대나무 얼음 받침 하나 — 시장 좌판에서 얼음과 생선을 올려 두는 납작한 직사각형 판. '
      + '쪼갠 대나무 살(누런 연두 · 황갈색, 군데군데 볼록한 마디) 열두어 개를 가로로 촘촘히 나란히 붙이고(살 사이 이음은 짙은 그늘 선), '
      + '판 아래 양쪽 끝에 굵은 대나무 막대 두 개를 가로질러 갈색 노끈으로 엮어 묶었다(막대가 짧은 다리 노릇). 비스듬히 위에서 본 모습.' },
  item_food_box: { file: 'food_box.png', px: ['px:it_food_box'], nameKo: '정옥선의 반찬통', nameEn: 'Side-dish box wrapped in bojagi cloth',
    aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '보자기에 싼 반찬통 하나 — 네모난 반찬통(도시락 통 크기)을 진분홍 · 다홍색 비단 보자기로 감싸고, 위에서 두 귀를 토끼 귀처럼 세워 묶어 매듭을 지었다. '
      + '보자기에 작은 금색 꽃 · 점 무늬가 흩어져 있고, 매듭 아래 틈으로 반찬통의 투명한 뚜껑 모서리와 그 안의 빨간 김치가 살짝 보인다. '
      + '비스듬히 위에서 본 모습. 할머니가 정성껏 싸 준 느낌.' },
  art_family_photo: { file: 'family_photo.png', nameKo: '가족사진', nameEn: 'Old family photo', aspect: '4:3', refs: REF_BAG, keepWhite: true,
    look: '오래된 가족사진 한 장 — 인화한 종이 사진 한 장(액자 없음), 누렇게 바랜 크림색 테두리, 한쪽 모서리가 살짝 접히고 구김이 조금. '
      + '사진 속: 바닷가 바위 앞에서 어린아이 하나와 그 양옆의 엄마 · 아빠, 세 사람이 바람에 눈을 찡그리며 웃고 있고, 뒤로 푸른 바다와 하늘, 흰 파도. '
      + '색이 바래 따뜻한 노란빛이 돈다. 비스듬히 위에서 본 모습. 글자 · 날짜 없음.' },
};
