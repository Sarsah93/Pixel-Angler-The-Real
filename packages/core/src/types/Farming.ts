/**
 * @file Farming.ts
 * @description 텃밭 농사 타입 (235차 — 사용자 확정 「추천안 2번」: 실제 시간 · 실제 계절은 그대로)
 *
 * 원칙
 *  - **실제 시간대로 자란다** — 꺼 둔 동안에도. 집만 빠른 땅은 없다.
 *  - 매일 거둘 거리는 원래 빠른 작물(콩나물 · 새싹 · 잎 따기 · 베고 다시 자람)에서,
 *    긴 작물은 실제 중간 수확(솎음 · 마늘종 · 고구마순 · 고춧잎 · 호박잎)으로 잇는다.
 *  - 모종 = 현실의 시간 단축(육묘를 건너뛴다). 씨앗은 싸고 느리다.
 *  - 빨라지는 건 **시설**로 번다 — 곱하되 상한(잎채소 ×2.0 · 철 작물 ×1.4).
 *  - 자리를 비워도 벌하지 않는다 — 죽지 않고 시들어 품질만 준다. 비 = 물 주기.
 *
 * 칸 = 1㎡(주말농장 한 구획 12㎡ = 4×3칸). 수량 · 비율은 실제 재배 자료(10a 수량 · 재식 거리 ·
 * 발아율 · 씨감자/종구 대비 수확)를 칸 단위로 환산했다(`CropDatabase` 각 줄 주석).
 */

/** 작물 갈래 — 그림 · 아이콘 원형을 고른다 */
export type CropCategory =
  | 'leaf'      // 잎채소(상추 · 시금치 · 근대 …)
  | 'fruit'     // 열매(고추 · 토마토 · 오이 · 호박 …)
  | 'root'      // 뿌리(무 · 당근 · 야콘 …)
  | 'tuber'     // 덩이(감자 · 고구마 · 토란 · 초석잠 …)
  | 'bulb'      // 비늘줄기 · 파(마늘 · 양파 · 대파 · 쪽파 · 산마늘)
  | 'grain'     // 곡식(옥수수 · 보리)
  | 'legume'    // 콩
  | 'wild'      // 산채(곰취 · 눈개승마 · 어수리 · 두릅 …)
  | 'herb'      // 향채
  | 'mushroom'  // 버섯 배지
  | 'sprout';   // 시루 · 새싹(콩나물 · 숙주 · 새싹채소)

/** 시설 가속 상한을 고르는 묶음 — 잎채소는 ×2.0까지, 철 작물(열매 · 뿌리 · 곡식)은 ×1.4까지 */
export type CropSpeedClass = 'leafy' | 'seasonal';

/** 희귀도 — 씨앗 · 모종을 구하기 어려운 정도(가게 재고 · 출처) */
export type CropRarity = 'common' | 'uncommon' | 'rare' | 'very_rare';

/** 수확 등급 — 특 · 상 · 보통 */
export type CropGrade = 'special' | 'good' | 'normal';

/** 심는 방법 */
export type CropStartKind = 'seed' | 'seedling' | 'set';

/** 어디서 기르나 — 마당 텃밭 / 실내(시루 · 배지 · 수경 랙) */
export type FarmSite = 'plot' | 'indoor';

/** 시설 · 손질 — 텃밭 단위 설비와 칸 단위 손질 */
export type FarmFacility =
  | 'compost'      // 퇴비(칸 — 이번 작기 생장 ×1.15 · 품질 +)
  | 'rainBarrel'   // 빗물통 · 점적 관수(텃밭 — 비운 동안 흙이 마르지 않는다)
  | 'greenhouse'   // 비닐하우스(텃밭 — 철 앞뒤 1달 · 추운 달 ×1.25)
  | 'shade'        // 차광막(텃밭 — 산채 재배 자격)
  | 'hydroRack'    // 실내 수경 랙(잎채소 ×1.8)
  | 'coldWater'    // 냉수 순환 수조(고추냉이 자격)
  | 'sproutJar';   // 콩나물 시루(실내 — 시루 · 새싹 자격)

/** 심는 방법 하나 */
export interface CropStart {
  kind: CropStartKind;
  /** 씨앗 · 모종 · 종구 아이템 id */
  itemId: string;
  /** 칸(1㎡)당 쓰는 수 — 씨앗은 「1칸 분」 봉, 모종은 포기, 종구는 개 */
  perCell: number;
  /** 섬(입모) 비율 — 씨앗 발아율 · 모종 활착률 · 종구 출아율(실측 표기값) */
  establish: number;
  /** 심은 뒤 첫 수확까지 일수(적온 · 물 충분 · 노지) */
  days: number;
  /** 노지에 심을 수 있는 달(1~12) */
  months: number[];
  /** 한 단위 값(원) — 씨앗 「1칸 분」 봉 · 모종 1포기 · 종구 「1칸 분」 */
  cost: number;
  /** 단위 이름(없으면 「○○ 씨앗 (1칸 분)」 · 「○○ 모종」) */
  labelKo?: string;
  labelEn?: string;
  /** 수확량 배수 — 같은 작물을 다른 재료로 앉힐 때(키운 백태 200g으로 콩나물 = 1.8배) */
  qtyMult?: number;
  /**
   * 238차 — 육묘 트레이 파종. 이 씨앗은 밭에 바로 뿌리지 않고 **집 안 선반의 육묘 트레이**에 뿌려 모종을 키운다
   * (고추 — 2월 따뜻한 실내에서 싹 틔워 70~90일 기른 뒤 4월 하순~5월 상순 밭에 옮겨 심는다).
   * 다 자라면 거두기가 **모종 아이템**(`sdl_<작물>`)을 준다 — 포기 수 [최소, 최대] · 가식(`prick_out`)을 거르면 줄어든다.
   */
  nursery?: { seedlings: [number, number]; seedlingItemId: string };
}

/** 본 수확 */
export interface CropHarvest {
  /** 수확물 아이템 id */
  itemId: string;
  /** 수확물 이름(단위 포함 — 「상추 한 줌 (100g)」) */
  nameKo: string;
  nameEn: string;
  /**
   * 다 익고 이만큼 지나면 다른 것으로 바뀐다(풋고추 → 홍고추) — 품질은 그대로.
   * 238차 — `turningDays`부터 `afterDays`까지는 **검붉은 고추**(덜 익음): 이때 거두면 홍고추로 치되 품질이 깎인다
   * (꼭지 끝까지 빨갛게 익어야 말렸을 때 빛깔이 좋다).
   */
  ripenTo?: { itemId: string; nameKo: string; nameEn: string; afterDays: number; price: number; cookIngredient?: string; turningDays?: number };
  /** 칸당 한 번 거두는 수(섬 1.0 · 상 등급 기준) [최소, 최대] */
  qtyPerCell: [number, number];
  /** 잎 따기 · 베기 — 첫 수확 뒤 간격(일)과 남은 횟수 */
  repeat?: { everyDays: number; times: number };
  /** 다 익은 뒤 품질이 떨어지기 시작할 때까지(일) — 추대 · 과숙 · 쇠기 */
  holdDays: number;
  /**
   * 236차 — 수확 덤(사용자 제안 「수확 때 랜덤으로 +10%씩」). 거둘 때마다 0~`bonusSteps`단계(10%씩)를
   * 고르게 굴려 그만큼 더 준다 — 버섯처럼 송이 크기가 들쭉날쭉한 작물. 3이면 0 · 10 · 20 · 30%(평균 +15%).
   */
  bonusSteps?: number;
  /**
   * 243차 — 포장 단위(사용자 결정 「한 팩 단위는 패키징을 별도로 해야 — 수확할 때는 1개씩 따니까」).
   * 거두면 낱개(`itemId`)가 나오고, 가방의 「포장하기」가 낱개 `units`개 + 포장 용기(`FARM_PACK_CONTAINER`) 1개를 팩 1개로 묶는다.
   * 팩 등급은 담은 낱개 등급 그대로 · 「포장 뜯기」로 낱개로 되돌린다(용기는 버린다).
   * 값: 팩 = 낱개 기준가 × `units`(제값) · 낱개로 팔면 `FARM_TUNING.looseSellMult`만 쳐준다(가게가 다시 담는다).
   */
  pack?: CropPack;
}

/** 243차 — 포장 단위(팩) */
export interface CropPack {
  /** 팩 아이템 기본 id(`crop_strawberry_pack`) — 등급 꼬리(`_sp` · `_nm`)는 낱개와 같은 규칙 */
  itemId: string;
  /** 팩 이름(단위 포함) — 242차까지의 수확물 이름 그대로라 구세이브의 「한 팩」 아이템 이름과 맞는다 */
  nameKo: string;
  nameEn: string;
  /** 한 팩에 담는 낱개 수 */
  units: number;
}

/** 중간 수확 — 솎음 · 마늘종 · 고구마순 · 고춧잎 · 호박잎 */
export interface CropInterim {
  itemId: string;
  labelKo: string;
  labelEn: string;
  /** 생육 진행도 [시작, 끝] 사이에 한 번 */
  window: [number, number];
  qtyPerCell: [number, number];
  /** 거둔 뒤 본 수확량 배수(솎음 1.0 — 남은 포기가 굵어진다 · 고구마순 0.95 · 마늘종 1.05) */
  mainYieldMult: number;
  /** 값(원/단위 · 상 등급) */
  price: number;
  /** 씨앗으로 시작했을 때만(솎음 — 모종은 솎을 게 없다) */
  seedOnly?: boolean;
  /** 마트에 늘 있나 */
  inMart: boolean;
  cookIngredient?: string;
}

/**
 * 237차 — 기르기 어려운 정도(사용자 제안 「작물별 난이도에 따라 자격 요건 차등」).
 * 1 쉬움 · 2 보통 · 3 까다로움 · 4 아주 까다로움. 단계마다 요건은 `FARM_TUNING.tierLevels` · `certTier`.
 * 기준은 농촌진흥청 텃밭 분류(쉬움 = 상추 · 시금치 · 쑥갓 · 배추 · 당근 · 무 · 고구마 · 감자 / 보통 = 토마토 · 호박 · 고추 · 가지 /
 * 어려움 = 오이 · 수박 · 참외 — 병과 벌레 · 지주 · 육묘)이고, 분류에 없는 작물은 「까다로운 점」으로 견준다.
 */
export type CropDifficulty = 1 | 2 | 3 | 4;

/**
 * 237차 — 까다로운 점(왜 어려운가 — 상세 보기에 그대로 나간다).
 * `nursery`는 **씨앗으로 시작할 때만** 한 단계를 올린다(모종이 쉽다 — 고추 육묘 70~80일).
 */
export type CropCare =
  | 'pests'        // 병해충이 잘 온다
  | 'support'      // 지주 · 유인 · 곁순
  | 'nursery'      // 씨앗이면 육묘가 길고 까다롭다
  | 'germination'  // 싹 틔우기가 까다롭다
  | 'overwinter'   // 겨울을 나야 한다
  | 'longSeason'   // 반년 가까이 · 여러 해 걸린다
  | 'soil'         // 흙을 가린다(깊은 흙 · 모래 · 북주기)
  | 'heat'         // 더위 · 땅 온도를 맞춰야 한다
  | 'shade'        // 반그늘 · 숲 흙
  | 'water'        // 물을 가린다(습지 · 찬물)
  | 'humidity';    // 습도를 맞춰야 한다(버섯)

/**
 * 238차 — 병해(사용자 조사 · 농진청 농사로): 역병(줄기 밑이 썩고 포기가 시든다 — 장마 · 다습) ·
 * 탄저병(열매가 썩는다 — 6~9월 고온다습 · 빗물로 번진다 · 수량 손실 15~60%) ·
 * 바이러스병(잎 모자이크 · 위축 — 총채벌레 · 진딧물이 옮긴다). 고추 · 토마토 · 가지 · 오이 같은 열매 작물에 든다.
 * 245차 — 작물마다 실제로 문제 되는 병 · 벌레 · 새를 더했다(사용자 「고추처럼 각 농작물에 대한 난이도를 추가」).
 *   병은 걷어 내기 · 살균제, 벌레는 벌레 잡기 · 방충망 · 살충제, 새는 새 그물로 막는다. 수치는 `DISEASE_DEFS`.
 */
export type CropDisease =
  | 'blight' | 'anthracnose' | 'virus'
  | 'powdery_mildew'   // 흰가루병 — 박과(오이 · 호박 · 참외 · 수박 · 박 · 여주) · 딸기
  | 'downy_mildew'     // 노균병 — 오이 · 참외 · 양파 · 시금치
  | 'soft_rot'         // 무름병 — 고추냉이
  | 'gray_mold'        // 잿빛곰팡이병 — 딸기
  | 'rust'             // 녹병 — 마늘 · 대파 · 부추
  | 'root_rot'         // 뿌리썩음병 — 생강 · 울금
  | 'green_mold'       // 푸른곰팡이병 — 버섯 배지(집 안에서도 든다)
  | 'caterpillar'      // 애벌레 — 배추흰나비 · 배추좀나방 · 호랑나비
  | 'flea_beetle'      // 벼룩잎벌레 — 배추 · 무 · 열무 · 얼갈이 · 순무 · 루꼴라
  | 'aphid'            // 진딧물 — 상추 · 쑥갓 · 가지 · 오크라 · 동부 · 초피
  | 'stink_bug'        // 노린재 — 콩
  | 'corn_borer'       // 조명나방 — 옥수수
  | 'birds';           // 새 — 블루베리 · 옥수수(익을 무렵)

/** 245차 — 병 · 벌레 · 새 하나의 수치(드는 철 · 확률 · 번짐 · 피해 · 막는 손) */
export interface DiseaseDef {
  /** 병 · 벌레 · 새 — 알림 문장 · 아이콘 · 위키 묶음이 달라진다 */
  kind: 'disease' | 'pest' | 'bird';
  /** 드는 철(달) */
  season: readonly number[];
  /** 하루에 들 확률 — 철 안 · 철 밖 */
  daily: { on: number; off: number };
  /** 든 뒤 하루에 번지는 양(심한 정도 0..1) */
  spread: number;
  /** 젖은 날(비 뒤 하루) — 드는 확률 배수(번짐은 그 80%만큼). 1 = 상관없음 · 1 미만 = 비에 씻긴다 */
  wet: number;
  /** 거둘 때 수량 손실(심한 정도 1일 때) */
  yieldLoss: number;
  /** 날마다 포기(섬)를 죽인다 — 이 값 × 심한 정도(바닥 0.25) */
  standLoss?: number;
  /** 하루 품질 손실 × 심한 정도 */
  qualityLoss: number;
  /** 비닐 터널 안 배수(비를 막고 습하다) */
  greenhouse: number;
  /** 걷어 내기 · 벌레 잡기 한 번에 줄이는 심한 정도 · 뽑아 내는 포기(섬) */
  cull: number;
  cullStand: number;
  /** 집 안 선반에서도 든다(버섯 배지) */
  indoor?: boolean;
  /** 열매 · 이삭이 익을 무렵(자람 75% 이상 · 수확기)에만 온다(새) */
  ripeOnly?: boolean;
  /** 흙이 흠뻑 젖어 있으면(수분 0.85 넘게) 드는 확률 배수 */
  soggy?: number;
}

/** 칸 하나에 든 병 — 심한 정도 0..1(1 = 다 번졌다) */
export interface CropDiseaseState {
  severity: number;
  /** 처음 든 시각(ms) */
  sinceMs: number;
}

/**
 * 238차 — 관리 작업(사용자 제안 「까다로움을 딸깍이 아니라 실제 동작 · 과정 · 시간으로」).
 * 고추 6단계(파종 · 육묘 · 정식 · 초기 생장 · 개화 착과 · 수확)를 작업으로 쪼갰다 — 다른 작물은 까다로운 점에서 뽑는다.
 */
export type CareTaskId =
  | 'prick_out'          // 가식 — 본잎이 나오면 넓은 트레이로 옮겨 심는다(육묘 칸)
  | 'ridge_mulch'        // 두둑 · 멀칭 — 물빠짐 좋게 두둑을 높이고 검은 비닐을 씌운다
  | 'stake'              // 지주 세우기 — 심은 즉시 1.5m 지주를 세우고 끈으로 묶는다
  | 'tie'                // 유인 — 자라는 대로 줄을 더 묶는다(2회)
  | 'water_establish'    // 활착기 물 — 심은 뒤 2주간 흙을 촉촉하게(지속 — 작업 장면은 없다)
  | 'pinch_flower'       // 방아다리 첫 꽃 따기
  | 'remove_suckers'     // 방아다리 아래 곁순 제거
  | 'topdress'           // 웃거름 — 정식 15일 뒤 1차, 이후 15~20일 간격
  | 'spray_fungicide'    // 살균제 — 탄저 · 역병(비 전후 · 7~10일)
  | 'spray_phosphite'    // 아인산 — 역병(7~14일)
  | 'spray_calcium'      // 칼슘액비 — 탄저 예방 보조 · 열매 품질
  | 'spray_insecticide'  // 살충제 — 총채벌레 · 진딧물(바이러스 매개충)
  | 'cull_diseased'      // 병든 열매 · 포기 걷어 내기
  | 'stevia_feed'        // 241차 — 스테비아 발효액 주기(스테비아 토마토 — 거르면 단맛이 오르지 않는다)
  // ── 245차 — 작물별 일(사용자 「고추처럼 각 농작물에 대한 난이도를 추가」) ──
  | 'thin'               // 솎아 주기(씨앗 칸 — 촘촘한 싹을 솎는다 · 감자는 싹 정리)
  | 'weed'               // 김매기(호미)
  | 'hill_up'            // 북주기(호미 — 감자 · 대파 · 땅콩 · 생강 · 토란 …)
  | 'net_cover'          // 방충망 씌우기(배추과 — 애벌레 · 벼룩잎벌레)
  | 'bird_net'           // 새 그물 치기(블루베리 · 옥수수 이삭 · 콩 · 땅콩 싹)
  | 'frost_cover'        // 부직포 덮기(겨울나기)
  | 'straw_mulch'        // 짚 덮기(마늘 · 양파 겨울 · 딸기 · 생강 · 산채)
  | 'pinch_tip'          // 순지르기(깻잎 · 콩 · 바질 · 박과 어미덩굴)
  | 'remove_flower'      // 꽃대 따기(바질 · 부추 · 양파 추대 · 당귀 · 고추냉이)
  | 'pollinate'          // 인공수분(애호박 · 수박 · 박)
  | 'thin_fruit'         // 열매 솎기(수박 · 참외 · 옥수수 이삭)
  | 'trellis'            // 유인망 치기(오이 · 여주 · 박)
  | 'prune'              // 가지치기(전정가위 — 블루베리 · 두릅 · 엄나무 · 초피)
  | 'acidify'            // 산도 맞추기(블루베리 — 피트모스)
  | 'tread'              // 보리밟기
  | 'tie_head'           // 배추 묶기
  | 'remove_runner'      // 런너 따기(딸기)
  | 'cover_dark'         // 검은 천 덮기(콩나물 · 숙주)
  | 'uncover_light'      // 빛 쬐기(새싹채소)
  | 'mist'               // 분무(버섯 — 습도)
  | 'slit_bag'           // 배지 칼집 내기(버섯)
  | 'water_flood'        // 물 대기(미나리 · 토란)
  | 'pick_pests'         // 벌레 잡기(애벌레 · 진딧물 · 노린재 — 들었을 때만)
  | 'strip_leaves'       // 아랫잎 따기(오크라)
  // ── 247차 ──
  | 'harden_off'         // 모종 굳히기(순화 — 옮겨 심기 전 한 주 바깥 바람 · 볕에 길들인다)
  // ── 247차 — 거둔 뒤 밭 손질의 작업 장면(관리 표에는 없다 — 텃밭 창 · 필드가 말린 칸에서 연다) ──
  | 'thresh'             // 털기(깨 · 콩 · 보리 — 마른 단을 내리쳐 알을 떨군다)
  | 'pick_pods'          // 꼬투리 따기(땅콩 — 뒤집어 말린 포기에서)
  | 'gather_bundle'      // 묶어 거두기(마늘 · 양파 — 말린 것을 주워 단으로)
  | 'winnow';            // 키질(턴 알곡을 까불러 검불을 날린다)

/** 작업 장면 모양 — 클라이언트 미니게임이 이 값으로 그림 · 조작을 고른다 */
export type CareWorkKind =
  | 'targets'    // 포기 그림에서 표시된 것(곁순 · 첫 꽃 · 병든 열매)을 하나씩 누른다
  | 'place'      // 표시된 자리에 차례로 박는다 · 씌운다(지주 · 멀칭)
  | 'tie'        // 지시된 높이에 맞춰 묶는다(흔들리는 표시가 띠 안에 올 때 누른다)
  | 'hold'       // 누르고 있어 게이지를 띠 안에 맞춘다(약 치기)
  | 'sprinkle'   // 포기 사이 표시된 자리에 뿌린다(웃거름)
  | 'tray'       // 트레이의 싹을 넓은 트레이로 옮긴다(가식)
  | 'drag'       // 245차 — 고랑의 표시에서 포기 밑동까지 끌어 올린다(북주기)
  | 'pair';      // 245차 — 수꽃을 누른 뒤 암꽃을 누른다(인공수분)

export interface CareTaskDef {
  id: CareTaskId;
  /** 열리는 때 — 심은 날부터 [부터, 까지](일). 육묘 칸은 파종 기준 · 밭은 정식 기준. 245차 — 여러해살이는 올해 다시 올라온 날 기준 */
  dayWindow: [number, number];
  /** 반복 — 한 번 한 뒤 며칠마다 · 몇 번 더(추비 · 방제) */
  repeat?: { everyDays: number; times: number };
  /** 칸마다 쓰는 물건 */
  needs?: { itemId: string; qty: number }[];
  /** 245차 — 가방에 있어야 하는 도구(닳지 않는다 — 호미 · 전정가위) */
  tools?: string[];
  work: CareWorkKind;
  /** 걸리는 시간(초 — 실제 시간) · 품(피로) */
  seconds: number;
  fatigue: number;
  /**
   * 한 뒤 효과 — 수확량 배수(누적) · 품질 · 병 보호(며칠 동안 그 병이 들 확률 × mult — 살균제 0.25 · 아인산 0.15 · 살충제 0.2 · 칼슘 0.7) ·
   * 한 번 해 두면 작기 내내 병이 덜 드는 배수(두둑 · 멀칭 · 방충망 · 새 그물) · 245차 `water` = 흙(배지)을 적신다(분무 · 물 대기)
   */
  effect?: {
    yieldMult?: number; quality?: number;
    protect?: { disease: CropDisease; days: number; mult: number }[];
    diseaseMult?: Partial<Record<CropDisease, number>>;
    water?: boolean;
  };
  /** 안 하고 창이 닫히면 — 수확량 · 품질 · 병 잘 듦 · 쓰러짐 위험 */
  missed?: { yieldMult?: number; quality?: number; diseaseMult?: Partial<Record<CropDisease, number>>; lodging?: boolean };
  /** 보이는 조건 — 병이 들었을 때만(걷어 내기 · 벌레 잡기) · 그 병이 드는 철에만(방제) */
  only?: 'diseased' | 'riskSeason';
  /** 245차 — `only: 'diseased'`일 때 이 병 · 벌레가 들었을 때만(없으면 아무 병이나). 하면 그것의 심한 정도가 준다 */
  onlyFor?: CropDisease[];
  /** 245차 — 이렇게 심은 칸에만(솎아 주기 = 씨앗) */
  startKinds?: CropStartKind[];
  /**
   * 245차 — 차례를 심은 날이 아니라 **달력**으로: 해마다 이 달들(이어진 한 구간 · 12→1 넘어가도 된다)에 한 번.
   * 겨울 덮기 · 이른 봄 웃거름 · 가지치기 · 보리밟기처럼 철에 묶인 일. 구간이 끝날 때까지 안 하면 놓침(벌).
   */
  months?: number[];
  /** 245차 — 자람(0..1)이 이 구간일 때 한 번(배추 묶기 · 열매 솎기 · 이삭 망) — 씨앗 · 모종 어느 쪽이든 같은 때 */
  growth?: [number, number];
  /** 245차 — 거둘 때마다 한 번(벤 뒤 웃거름) — 다시 자람이 60%를 넘기 전까지 */
  afterPick?: boolean;
  /** 245차 — 이 일을 해 두었으면 할 필요가 없다(검은 비닐을 덮은 고구마 밭은 김매기가 없다) */
  waivedBy?: CareTaskId;
  /** 방법 한 줄(작업 장면 머리말 · 상세) */
  howKo: string;
  howEn: string;
}

// ─────────────────────────────────────────────
// 247차 — 재배 요소(사용자 「심기부터 재배까지 고려되는 모든 환경 · 요소 — 시기 · 노동 피로 · 도구 · 행위의 정도」)
// ─────────────────────────────────────────────

/** 247차 — 물 주는 양(조금 · 보통 · 흠뻑) */
export type WaterAmount = 'light' | 'normal' | 'deep';

/**
 * 247차 — 흙이 알맞은 수분보다 오래 젖어 있을 때 생기는 탈.
 * rot = 뿌리 · 덩이가 썩는다(섬 · 품질) · crack = 열매가 갈라진다(열과 — 익을 무렵) ·
 * bland = 맛이 묽어진다(수박 · 참외 · 토마토 — 익을 무렵) · leggy = 웃자라 연약해진다 · none = 물을 좋아한다(미나리 · 토란)
 */
export type OverwaterHarm = 'rot' | 'crack' | 'bland' | 'leggy' | 'none';

/** 247차 — 거두는 손 — 맨손으로 따기 · 가위로 꼭지 자르기 · 낫으로 베기 · 호미 · 쇠스랑으로 캐기 · 뽑기 */
export type HarvestBy = 'pick' | 'snip' | 'cut' | 'dig' | 'pull';

/**
 * 247차 — 거둔 뒤 밭에서 하는 손질(깨 · 콩 · 보리 = 베어 말려 턴다 · 땅콩 = 캐어 말려 꼬투리를 딴다 · 마늘 · 양파 = 캐어 말려 거둔다).
 * 베어 둔 칸은 그 자리에서 마른다 — 비 오는 시간은 세지 않고 품질이 조금 준다.
 */
export interface FieldProcessDef {
  /** 첫 손 — 베기(낫) · 캐기(호미 · 쇠스랑) · 뽑기(맨손) */
  first: 'cut' | 'dig' | 'pull';
  /** 밭에서 말리는 날(실제 시간) */
  dryDays: number;
  /** 다 마른 뒤 — 털기(도리깨 · 막대) · 꼬투리 따기 · 묶어 거두기 */
  last: 'thresh' | 'pick' | 'gather';
  /** 키질 — 키가 있으면 검불을 날려 품질 +, 없으면 섞여 − */
  winnow?: boolean;
  /** 다 마른 뒤 이 날 수가 지나면 꼬투리가 터져 알이 쏟아진다(깨 · 콩 — 하루에 2%씩 · 바닥 60%) */
  shatterDays?: number;
}

/** 247차 — 알맞은 철 밖에 심었을 때의 까닭 — 꽃대가 일찍 선다 · 냉해 · 더위 · 철이 짧다 */
export type OffTimingKind = 'bolt' | 'cold' | 'heat' | 'short';

/** 247차 — 늘리는 법(아주 까다로운 작물 — 「씨앗을 구하기 어렵다」의 실제 대안) */
export interface CropPropagation {
  /** 포기 나누기 · 뿌리 꺾꽂이(두릅 · 엄나무) · 곁눈(고추냉이 — 거둘 때) */
  by: 'division' | 'cutting' | 'offset';
  /** 나누는 달(곁눈은 거둘 때라 비운다) */
  months: number[];
  /** 한 번에 얻는 수 [최소, 최대] — 심는 물건(`starts`의 첫 모종 · 종구) */
  qty: [number, number];
}

/** 247차 — 작물마다 다른 재배 요소 한 벌 */
export interface CropCultivation {
  /** 물 — 알맞은 흙 수분 · 한 번에 줄 양 · 넘칠 때의 탈 · 거두기 전 끊기 */
  water: {
    /** 알맞은 흙 수분 [아래, 위](0..1) — 아래보다 마르면 더디고, 위보다 오래 젖어 있으면 탈이 난다 */
    band: [number, number];
    /** 알맞은 한 번 양 */
    amount: WaterAmount;
    over: OverwaterHarm;
    /** 거두기 이만큼 앞(일)부터는 물을 끊는다 — 그동안은 알맞은 수분의 위가 낮아진다(고구마 · 양파 · 수박 · 참외) */
    stopDays?: number;
  };
  /**
   * 거름 — low = 적게(콩 · 땅콩 · 고구마: 퇴비가 많으면 잎 · 덩굴만 무성 → 수량 −8%) ·
   * mid = 보통 · high = 많이(배추 · 고추 · 오이 · 수박: 퇴비를 넣으면 수량 +8%)
   */
  feed: 'low' | 'mid' | 'high';
  /** 품(한 칸) — 심기 · 거두기(1 가볍다 · 2 보통 · 3 무겁다) */
  labor: { plant: 1 | 2 | 3; harvest: 1 | 2 | 3 };
  /** 거두는 손 — 도구가 반드시인지(낫 · 호미) · 도움인지(수확 가위 · 쇠스랑)를 정한다 */
  harvestBy: HarvestBy;
  /** 거둔 뒤 밭 손질 */
  process?: FieldProcessDef;
  /** 알맞은 심는 달(심을 수 있는 달 가운데) — 밖이면 수량이 줄고 까닭이 붙는다(달마다 다르면 `offMonths`) */
  timing?: { best: number[]; off: OffTimingKind; offMonths?: Partial<Record<number, OffTimingKind>> };
  /** 가시가 있다(두릅 · 엄나무 · 초피) — 장갑 없이 거두면 손을 찔린다 */
  thorny?: boolean;
  /** 쇠스랑으로 캐면 빠르지만 날에 몇 개 찍힌다(감자 · 고구마 · 야콘 · 생강 — 품질 −0.02). 호미는 느리지만 덜 상한다 */
  forkSpears?: boolean;
  /** 캐기 전에 덩굴 · 줄기를 먼저 걷는다(고구마 · 토란 · 야콘 · 울금 · 돼지감자) — 낫이 있으면 품이 준다(×0.8) */
  vines?: boolean;
  /** 떨어진 씨로 이듬해 저절로 난다(비름 · 차조기 · 방아 · 딜 · 깨 …) — 씨가 여물도록 두면 그 텃밭의 씨앗 은행에 든다 */
  selfSeeds?: boolean;
  /** 늘리는 법(포기 나누기 · 뿌리 꺾꽂이 · 곁눈) */
  propagate?: CropPropagation;
  /** 한 줄(상세 · 위키 · 텃밭 창) */
  noteKo: string;
  noteEn: string;
}

/** 247차 — 밭 손질의 단계 — 베어 말리는 중 · 다 말랐다 */
export type FieldProcessStage = 'drying' | 'dry';

/** 247차 — 품이 드는 텃밭 일 */
export type FarmLaborAction =
  | 'till' | 'compost' | 'water' | 'plant' | 'harvest' | 'interim'
  | 'cut' | 'dig' | 'pull' | 'thresh' | 'pick_pods' | 'gather' | 'winnow' | 'divide' | 'pull_seedlings';

/** 작물 하나의 관리 표 */
export interface CropCarePlan {
  tasks: CareTaskDef[];
  /** 이 작물에 드는 병 */
  diseases: CropDisease[];
  /** 활착기(심은 뒤 며칠) — 흙이 마르면 뿌리를 못 내려 섬이 준다 */
  establishDays?: number;
  /** 서리에 끝나는 작물(가을 첫서리 → 남은 것을 거두면 끝) */
  frostEnds?: boolean;
}

/**
 * 241차 — 개량종(품종 · 농법). 원종을 거둬 본 사람에게만 종묘사가 권한다 — 「원종 n번 거두기」가 열쇠.
 *  - 품종: 호박고구마(베니하루카 계통) · 청양고추 — 원종과 다른 작물로 심고 거둔다.
 *  - 농법: 스테비아 토마토 — 토마토에 스테비아 발효액을 주는 재배법(관리 작업 `stevia_feed`).
 */
export interface CropVariant {
  /** 원종 작물 id */
  of: string;
  /** 원종을 이만큼 거둔 뒤(본 수확 · 중간 수확 합 — `FarmStore.harvestsOf`) 종묘사에 진열 */
  afterHarvests: number;
  /** 원종과 다른 점 한 줄(상세 보기 · 위키) */
  diffKo: string;
  diffEn: string;
}

/** 재배 자격 — 스킬 · 시설 · 면허 */
export interface CropRequirement {
  skill?: string;
  facility?: FarmFacility;
  license?: string;
}

/** 시세 — 수확 단위 1개 · 상 등급 기준(원) */
export interface CropPrice {
  base: number;
  /** 달별 지수(1~12월 · 평균 1.0 근처) — 도매 · 소매 계절 흐름 */
  season: readonly number[];
  /** 날씨 · 작황 출렁임 폭(0.1 = ±10% 안팎) */
  volatility: number;
}

export interface CropDef {
  id: string;
  nameKo: string;
  nameEn: string;
  category: CropCategory;
  speedClass: CropSpeedClass;
  rarity: CropRarity;
  /** 마트에서 늘 파는가 — false면 「마트에 없는」 작물(직접 길러야 손에 넣는다) */
  inMart: boolean;
  site: FarmSite;
  /** 심는 방법들(씨앗 · 모종 · 종구 중 가능한 것) */
  starts: CropStart[];
  harvest: CropHarvest;
  interim?: CropInterim;
  /** 노지에서 자라는 달 — 밖이면 멈춘다(겨울나기 작물은 휴면 · 하우스는 앞뒤 1달) */
  growMonths: number[];
  /** 겨울을 난다(마늘 · 양파 · 보리 · 시금치) — 추위에 상하지 않고 봄에 이어 자란다 */
  overwinter?: boolean;
  /** 여러해살이 — 다 거둔 뒤 같은 자리에서 다음 철에 다시(부추 · 산채 · 두릅) */
  perennial?: boolean;
  /** 물 요구 — 흙이 마르는 속도 배율(low 0.7 · mid 1 · high 1.4) */
  water: 'low' | 'mid' | 'high';
  /** 재배 자격 */
  requires?: CropRequirement;
  /** 237차 — 기르기 어려운 정도(`CROP_DIFFICULTY` 표에서 채운다 — 단계 요건은 `cropGate`) */
  difficulty?: CropDifficulty;
  /** 237차 — 까다로운 점 */
  care?: CropCare[];
  /** 241차 — 개량종이면 원종 · 해금 조건 · 다른 점 */
  variant?: CropVariant;
  price: CropPrice;
  /**
   * 숨은 재조정(희귀 · 고가 · 저생산 작물) — 실제 시세를 따르되 칸 · 날 수익이 낚시를 넘지 않게 단가를 살짝 누른다.
   * 화면에는 드러내지 않는다(사용자 지시 2026-10-08). 없으면 1.
   */
  rebalance?: number;
  /** 요리 재료 id(core `COOK_INGREDIENTS`) — 있으면 수확물이 그 재료로 들어간다 */
  cookIngredient?: string;
  /** 출처 · 근거 메모(위키 · 상세 보기 꼬리) */
  noteKo: string;
  /** 같은 메모의 영어(i18n 사전이 데이터를 그대로 읽는다) */
  noteEn: string;
}

/** 칸 하나의 상태 — 세이브된다 */
export interface FarmCellState {
  /** 갈았는가(심기 전 필수) */
  tilled: boolean;
  cropId: string | null;
  start?: CropStartKind;
  /** 심은 시각(ms) */
  plantedAt?: number;
  /** 첫 수확까지 진행 0..1 */
  growth: number;
  /** 흙 수분 0..1 */
  moisture: number;
  /** 품질 0..1 */
  quality: number;
  /** 섬(입모) 0..1 — 발아 · 활착 결과 */
  stand: number;
  /** 반복 수확 — 거둔 횟수 · 다음 수확까지 진행 */
  picks: number;
  regrow: number;
  /** 다 익은 뒤 흐른 시간(h) — 과숙 판정 */
  ripeH: number;
  /** 중간 수확을 했나 */
  interimDone?: boolean;
  /** 이번 작기 퇴비 */
  compost?: boolean;
  /** 마지막으로 계산한 시각(ms) */
  lastMs: number;
  /** 물이 말라 멈춘 시간 누적(h) — 표시용 */
  dryH: number;
  /** 여러해살이: 지난 철에 다 거두고 쉬는 중 */
  resting?: boolean;
  /** 여러해살이: 한 해를 넘긴 뿌리(다음 철은 절반 기간에 다시 올라온다) */
  established?: boolean;
  // ── 238차 — 관리 작업 · 병해 ──
  /**
   * 한 작업 — 작업별 한 횟수 · 마지막 시각 · 창이 닫혀 놓친 횟수(차례는 done + skipped).
   * 245차 `win` = 달력 일(`months`)의 마지막으로 매듭지은 구간 번호(한 · 놓침 어느 쪽이든 — 한 구간에 한 번만 센다)
   */
  care?: Partial<Record<CareTaskId, { done: number; lastMs: number; skipped: number; win?: number }>>;
  /** 245차 — 여러해살이가 올해 다시 올라온 시각(ms) — 날 수로 세는 일의 기준(없으면 심은 시각) */
  cycleAt?: number;
  /** 든 병 */
  diseases?: Partial<Record<CropDisease, CropDiseaseState>>;
  /** 병 보호 — 약을 친 뒤 끝나는 시각(ms)과 그동안 걸릴 확률 배수 */
  protect?: Partial<Record<CropDisease, { untilMs: number; mult: number }>>;
  /** 비를 맞은 뒤 젖어 있는 시간(h) — 역병 · 탄저병이 잘 번진다 */
  wetH?: number;
  /** 지주를 안 세워 비바람에 쓰러졌다(수확 ×0.75 · 품질 −) */
  lodged?: boolean;
  /** 가을 첫서리를 맞은 시각(ms) — 더 자라지 않고, 남은 것을 거두면 끝 */
  frostedAt?: number;
  /** 심은 뒤 수확량 배수 누적(작업 효과 · 놓친 벌) — 1에서 시작 */
  careYield?: number;
  /** 육묘 트레이 칸(씨앗 → 모종) */
  nursery?: boolean;
  /** 활착기에 흙이 말라 뿌리를 못 내린 시간(h) */
  establishDryH?: number;
  // ── 247차 — 재배 요소 ──
  /** 흙이 알맞은 수분보다 젖어 있던 시간(h — 마르면 두 배로 줄어든다). 길어지면 탈(`CropCultivation.water.over`) */
  soggyH?: number;
  /** 알맞은 철 밖에 심었다 — 까닭(수량 −15% · 꽃대는 빨리 쇤다) */
  offTiming?: OffTimingKind;
  /** 거둔 뒤 밭 손질 — 벤(캔) 시각 · 마른 시간 · 비 맞은 시간 · 다 마른 시각 */
  process?: { cutAt: number; dryH: number; rainH: number; dryAt?: number };
  /** 저절로 올라온 싹(산에서 날아든 씨앗 · 새가 떨군 씨) — 자람 25% 전까지는 이름을 모른다 */
  wild?: boolean;
  /** 포기 나누기 · 뿌리 꺾꽂이를 한 해(한 해 한 번) */
  dividedYear?: number;
  /** 일군 채 비어 있기 시작한 시각(ms) — 오래 묵힌 칸에 저절로 싹이 난다 */
  fallowSince?: number;
  /** 퇴비를 넣은 칸에 심었다(거름 요구에 따라 수량 ±8% — 심을 때 정한다) */
  fedAtPlant?: boolean;
  /** 육묘 트레이: 꺼내기 시작한 뒤 트레이에 남은 모종 수(다 꺼내면 칸이 빈다) */
  trayLeft?: number;
}

/** 텃밭 하나(설치물 하나 — 4×3칸) */
export interface FarmPlotState {
  /** 마당 텃밭 · 실내 선반 */
  site: FarmSite;
  cells: FarmCellState[];
  /** 설비(텃밭 — 빗물통 · 하우스 · 차광막 · 냉수 수조 / 실내 — 시루 · 수경 랙) */
  facilities: FarmFacility[];
  /** 247차 — 구획마다 다른 난수 씨(저절로 나는 싹이 구획마다 다르게). 구세이브는 0 */
  salt?: number;
  /** 247차 — 이 텃밭 흙에 떨어진 씨(씨가 여문 작물 id · 최근 6개) — 묵힌 칸에 저절로 난다 */
  seedBank?: string[];
}

/** 성장 계산 환경 — 클라이언트가 주입한다(날씨 · 스킬) */
export interface FarmEnv {
  /** 그 시각에 비가 오는가(실황이 없으면 기후 통계) */
  rainAt: (ms: number) => boolean;
  /** 236차 — 전기료가 밀려 단전됐는가(수경 재배기 불 · 펌프가 꺼진다) */
  powerOff?: boolean;
  /** 238차 — 지금 이 시각의 기온(℃ · 실황이 있을 때) — 서리 판정 보조. 없으면 기후 통계 */
  tempC?: number;
  /** 스킬 배율 — 없으면 0랭크 */
  skill?: {
    /** 물 마름 감소(0.2/랭크 → 0.8배) */
    waterEff?: number;
    /** 퇴비 효과 +20%/랭크 */
    fertilizer?: number;
    /** 병충해 확률 -15%/랭크 */
    pestResist?: number;
  };
}

/** 심기 전 확인에 쓰는 자격 조회 */
export interface FarmPlantCtx {
  hasSkill: (skillId: string) => boolean;
  /** 파종 감각(발아율 +8%/랭크) */
  sproutBonus?: number;
  /** 237차 — 플레이어 레벨(난이도 단계 요건). 없으면 단계 요건을 보지 않는다(시험 · 구 호출) */
  level?: number;
  /** 237차 — 면허 보유(유기농업기능사 — 까다로운 작물). 없으면 보지 않는다 */
  hasLicense?: (licenseType: string) => boolean;
  /** 238차 — 육묘 트레이가 있는가(트레이 파종 씨앗). 없으면 보지 않는다 */
  hasTray?: boolean;
  /** 238차 — 지금 기온(℃ · 실황) — 늦서리 전 정식을 막는다. 없으면 기후 통계만 */
  tempC?: number;
}

/** 수확 결과 */
export interface FarmHarvestResult {
  itemId: string;
  qty: number;
  grade: CropGrade;
  /** 품질(0..1) — 아이템에 실어 둔다 */
  quality: number;
  /** 씨앗 회수(스킬) */
  seedBack?: { itemId: string; qty: number };
  /** 반복 수확이 남았는가(아니면 칸이 비거나 쉰다) */
  more: boolean;
  /** 236차 — 덤으로 더 거둔 수(수량에 이미 들어 있다)와 그 회차의 덤 비율(%) */
  bonusQty?: number;
  bonusPct?: number;
  /** 238차 — 모종을 거뒀다(육묘 트레이 — 등급 꼬리 없이 `sdl_*` 그대로) */
  seedling?: boolean;
  /** 238차 — 병 · 관리로 줄거나 는 배수(1 = 그대로) — 화면 설명용 */
  careMult?: number;
  diseaseMult?: number;
  /** 238차 — 덜 익은(검붉은) 고추를 거뒀다 */
  turning?: boolean;
  /** 238차 — 서리 맞은 끝물 */
  frosted?: boolean;
  /** 247차 — 거둘 때 얻은 곁눈(고추냉이) — 심는 물건 */
  offsets?: { itemId: string; qty: number };
  /** 247차 — 밭 손질 결과(키질 · 비 맞음 · 꼬투리 터짐 — 화면 설명용) */
  processNote?: { winnowed?: boolean; rainLoss?: number; shatterLoss?: number };
}
