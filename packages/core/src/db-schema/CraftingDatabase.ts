/**
 * @file CraftingDatabase.ts
 * @description 제작 도면 DB (P7 — SPEC §2-5). **요리(RecipeDatabase)와 분리한다.**
 *
 * 3단 구조(222차 — 사용자 확정):
 *  - `station: 'hand'`      = **U 창 '제작' 탭**(맨손) — 묶기 · 끼우기 · 섞기. 어디서나.
 *  - `station: 'workbench'` = **설치한 작업대** 근접 [F] — 불(주조) · 도료 · 공구가 필요한 것.
 *  - `station: 'advanced'`  = 작업대 + **로드 빌딩 공구 세트**(가방) — 정밀 부품 · 긴 시간.
 *
 * 222차 — 제작은 시간이 걸린다(`timeSec` · 진행은 클라이언트 `CraftingStore` 큐). 최소 레벨(`minLevel`) ·
 * 실패 시 재료마다 잃을 확률(`lossChance`) · 품질 굴림(`rollCraftQuality`)은 `simulation/CraftRules.ts`.
 *
 * 재료·산출의 itemId는 클라이언트 인벤토리 id 문자열이다(RecipeDatabase 전례).
 * 산출 아이템 템플릿은 `client-pc/src/data/CraftOutputs.ts`가 보유한다 —
 * core는 **무엇을 얼마나 먹고 무엇이 몇 개 나오는가**만 안다(렌더·인벤토리 비의존).
 */

/** 제작 위치 — 맨손 / 작업대 / 고급(작업대 + 로드 빌딩 공구 세트) */
export type CraftStation = 'hand' | 'workbench' | 'advanced';

export const CRAFT_STATION_LABEL: Record<CraftStation, { ko: string; en: string }> = {
  hand: { ko: '맨손', en: 'By hand' },
  workbench: { ko: '작업대', en: 'Workbench' },
  advanced: { ko: '고급 작업대', en: 'Advanced bench' },
};

/** 도면 분류 — 제작 창 종류 탭(222차) */
export type CraftGroup = 'rig' | 'sinker' | 'bait' | 'lure' | 'trap' | 'gear' | 'medic' | 'life';

/** 탭 순서 */
export const CRAFT_GROUP_ORDER: readonly CraftGroup[] = ['rig', 'sinker', 'bait', 'lure', 'trap', 'gear', 'medic', 'life'];

export const CRAFT_GROUP_LABEL: Record<CraftGroup, { ko: string; en: string }> = {
  rig: { ko: '채비', en: 'Rigs' },
  sinker: { ko: '봉돌·찌', en: 'Sinkers & Floats' },
  bait: { ko: '미끼', en: 'Bait' },
  lure: { ko: '루어·에기', en: 'Lures & Egi' },
  trap: { ko: '통발·채집', en: 'Traps & Foraging' },
  gear: { ko: '장비', en: 'Gear' },
  medic: { ko: '구급품', en: 'First Aid' },
  life: { ko: '생활', en: 'Everyday' },
};

/**
 * 재료 1항목. 매칭은 **셋 중 하나**:
 *  - `itemId`          = 인벤토리 아이템 id 정확 일치
 *  - `speciesId`       = 채집물/어획물 개체(전복 자개 등) — 개체 아이템의 speciesId 일치
 *  - `byproductKind`   = 손질 부산물 종류(껍질·뼈 등)
 */
export interface CraftMaterial {
  itemId?: string;
  speciesId?: string;
  byproductKind?: string;
  qty: number;
  /** 목록 표시용 이름 (인벤토리에 없어도 무엇을 구해야 하는지 보인다) */
  nameKo: string;
  nameEn: string;
}

export interface CraftBlueprint {
  id: string;
  station: CraftStation;
  group: CraftGroup;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  materials: CraftMaterial[];
  /** 산출 아이템 id (CraftOutputs 템플릿 키) */
  outputId: string;
  outputQty: number;
  /** 기본 성공률 0~1 — `craft_success` 스킬로 보정(상한 1) */
  baseSuccess: number;
  /**
   * 제작 1건 XP — **난이도 가중**. 소비측(`CraftingStore`)이
   * `activityXp('craft', xp / TUNING.xp.craftBase)` 로 환산하므로,
   * craftBase 기본값(15)에서는 이 값이 그대로 지급 XP가 된다.
   */
  xp: number;
  /** 도면 해금 조건 — 해당 스킬 랭크 미만이면 목록에 잠금 표기 */
  requiresSkill?: { id: string; rank: number };
  /** 222차 — 1개 만드는 데 드는 시간(초). 없으면 위치별 기본값(`CRAFT_DEFAULT_TIME_SEC`) */
  timeSec?: number;
  /** 222차 — 최소 레벨 */
  minLevel?: number;
  /** 222차 — 실패 시 재료 하나하나를 잃을 확률(없으면 `TUNING.craft.failLossChance`) */
  lossChance?: number;
}

/** 위치별 기본 제작 시간(초) */
export const CRAFT_DEFAULT_TIME_SEC: Record<CraftStation, number> = { hand: 20, workbench: 60, advanced: 300 };

/**
 * 도면 26종(222차 — 맨손 11 · 작업대 12 · 고급 3). 아래는 129차 원래 주석.
 * 도면 14종 (hand 8 + workbench 6).
 * ⚠ 스펙 §11 P7은 "도면 12종"으로 적혀 있으나, 스펙 §2-5가 열거한 품목을 전부 만들면 14종이다
 *   (채비 3 · 봉돌 2 · 구급품 3 / 루어 1 · 에기 1 · 통발 2 · 로드 1 · 릴 1).
 *   숫자를 맞추려 품목을 빼지 않고 **14종으로 구현**한다. 밑밥 배합은 기존 'U 밑밥 품질' 탭이
 *   전담하므로 도면으로 중복 정의하지 않는다(제작 탭에서 해당 탭으로 안내만).
 */
export const CRAFT_BLUEPRINTS: readonly CraftBlueprint[] = [
  // ── 기본(맨손) — 채비 묶음 ──────────────────────────
  {
    id: 'bp_rig_chinu', station: 'hand', group: 'rig',
    nameKo: '감성돔 바늘 묶음 채비', nameEn: 'Black Seabream Snelled Hook',
    descKo: '카본 목줄에 감성돔 바늘을 직접 묶어 만든 완성 채비. 시판품보다 저렴하다.',
    descEn: 'A snelled chinu hook tied onto carbon leader. Cheaper than store-bought.',
    materials: [
      { itemId: 'inv_carbon15', qty: 1, nameKo: '카본 목줄 3호', nameEn: 'Carbon Leader #3' },
      { itemId: 'inv_chinu3', qty: 2, nameKo: '감성돔 바늘 3호', nameEn: 'Chinu Hook #3' },
    ],
    outputId: 'craft_rig_chinu', outputQty: 2, baseSuccess: 0.92, xp: 12,
    timeSec: 15, minLevel: 1,
  },
  {
    id: 'bp_rig_blackfish', station: 'hand', group: 'rig',
    nameKo: '벵에돔 목줄 채비', nameEn: 'Blackfish Leader Rig',
    descKo: '가는 목줄에 작은 바늘을 묶은 전유동용 채비. 예민한 입질에 대응한다.',
    descEn: 'A fine-leader rig for free-drift fishing, matched to shy bites.',
    materials: [
      { itemId: 'shop_carbon3', qty: 1, nameKo: '카본 목줄 3호', nameEn: 'Carbon Leader #3' },
      { itemId: 'inv_chinu3', qty: 2, nameKo: '감성돔 바늘 3호', nameEn: 'Chinu Hook #3' },
    ],
    outputId: 'craft_rig_blackfish', outputQty: 2, baseSuccess: 0.90, xp: 12,
    requiresSkill: { id: 'craft_knot', rank: 1 },
    timeSec: 18, minLevel: 3,
  },
  {
    id: 'bp_rig_surf', station: 'hand', group: 'rig',
    nameKo: '원투 카드 채비 (3단)', nameEn: 'Surf Dropper Rig (3-hook)',
    descKo: '한 줄에 바늘 세 개를 단 편대. 수심층을 한 번에 훑는다.',
    descEn: 'A three-dropper surf rig that sweeps several depth layers at once.',
    materials: [
      { itemId: 'inv_nylon2', qty: 1, nameKo: '나일론 원줄 2호', nameEn: 'Nylon Main Line #2' },
      { itemId: 'inv_chinu3', qty: 3, nameKo: '감성돔 바늘 3호', nameEn: 'Chinu Hook #3' },
      { itemId: 'inv_mat_wire', qty: 1, nameKo: '철사', nameEn: 'Wire' },
    ],
    outputId: 'craft_rig_surf', outputQty: 1, baseSuccess: 0.85, xp: 18,
    requiresSkill: { id: 'craft_knot', rank: 2 },
    timeSec: 30, minLevel: 6,
  },

  // ── 기본(맨손) — 봉돌 주조 ─────────────────────────
  {
    id: 'bp_sinker_ring', station: 'workbench', group: 'sinker',
    nameKo: '고리봉돌 주조 (20호)', nameEn: 'Cast Ring Sinker (#20)',
    descKo: '주석을 녹여 고리봉돌을 뽑는다. 원투 메인 싱커의 기본형.',
    descEn: 'Melt tin into a ring sinker — the workhorse surf weight.',
    materials: [{ itemId: 'inv_mat_tin', qty: 2, nameKo: '주석 잉곳', nameEn: 'Tin Ingot' }],
    outputId: 'inv_sinker_ring_20', outputQty: 2, baseSuccess: 0.88, xp: 14,
    requiresSkill: { id: 'craft_sinker', rank: 1 },
    timeSec: 90, minLevel: 8,
  },
  {
    id: 'bp_sinker_hole', station: 'workbench', group: 'sinker',
    nameKo: '구멍봉돌 주조 (20호)', nameEn: 'Cast Hole Sinker (#20)',
    descKo: '가운데 구멍을 낸 봉돌. 원줄이 통과해 이물감이 적다(예신 피드백 +15%).',
    descEn: 'A through-hole sinker; the line slides free, so bites telegraph better (+15%).',
    materials: [
      { itemId: 'inv_mat_tin', qty: 2, nameKo: '주석 잉곳', nameEn: 'Tin Ingot' },
      { itemId: 'inv_mat_wire', qty: 1, nameKo: '철사', nameEn: 'Wire' },
    ],
    outputId: 'inv_sinker_hole_20', outputQty: 2, baseSuccess: 0.84, xp: 16,
    requiresSkill: { id: 'craft_sinker', rank: 1 },
    timeSec: 100, minLevel: 10,
  },

  // ── 기본(맨손) — 구급품 (§5 치료 수단) ───────────────
  {
    id: 'bp_bandage', station: 'hand', group: 'medic',
    nameKo: '붕대', nameEn: 'Bandage',
    descKo: '출혈을 멈춘다. 손질 실수·갯바위 미끄러짐의 1차 처치.',
    descEn: 'Stops bleeding — first response to knife slips and rock falls.',
    materials: [{ itemId: 'inv_mat_cloth', qty: 2, nameKo: '면 붕대천', nameEn: 'Cotton Gauze' }],
    outputId: 'craft_bandage', outputQty: 2, baseSuccess: 0.95, xp: 10,
    timeSec: 10, minLevel: 1,
  },
  {
    id: 'bp_splint', station: 'hand', group: 'medic',
    nameKo: '부목', nameEn: 'Splint',
    descKo: '골절을 고정한다. 걷기 속도와 자전거 탑승을 되돌린다.',
    descEn: 'Immobilises a fracture, restoring walking speed and cycling.',
    materials: [
      { itemId: 'inv_mat_wood', qty: 2, nameKo: '곧은 나무 막대', nameEn: 'Straight Wood Stick' },
      { itemId: 'inv_mat_cloth', qty: 1, nameKo: '면 붕대천', nameEn: 'Cotton Gauze' },
    ],
    outputId: 'craft_splint', outputQty: 1, baseSuccess: 0.90, xp: 14,
    requiresSkill: { id: 'craft_medic', rank: 1 },
    timeSec: 25, minLevel: 4,
  },
  {
    id: 'bp_medicine', station: 'hand', group: 'medic',
    nameKo: '상비약', nameEn: 'First-Aid Medicine',
    descKo: '감기·식중독의 자연치유를 크게 앞당긴다. 독감·이상고열에는 듣지 않는다.',
    descEn: 'Greatly shortens a cold or food poisoning. Useless against flu or high fever.',
    materials: [
      { itemId: 'inv_mat_herb', qty: 2, nameKo: '약초', nameEn: 'Medicinal Herb' },
      { itemId: 'shop_water', qty: 1, nameKo: '생수 500ml', nameEn: 'Bottled Water 500ml' },
    ],
    outputId: 'craft_medicine', outputQty: 2, baseSuccess: 0.86, xp: 18,
    requiresSkill: { id: 'craft_medic', rank: 2 },
    timeSec: 40, minLevel: 8,
  },

  // ── 고급(제작대) — 루어·에기 ────────────────────────
  {
    id: 'bp_lure_custom', station: 'workbench', group: 'lure',
    nameKo: '커스텀 미노우 도색', nameEn: 'Custom Minnow Paint',
    descKo: '시판 미노우에 자개를 붙이고 도색해 반사광을 바꾼다. 성능 편차가 줄어든다.',
    descEn: 'Inlay abalone shell and repaint a stock minnow — tighter performance spread.',
    materials: [
      { itemId: 'lure_minnow_float', qty: 1, nameKo: '미노우 90F (플로팅)', nameEn: 'Minnow 90F (Floating)' },
      { itemId: 'inv_mat_paint', qty: 1, nameKo: '도료 세트', nameEn: 'Paint Set' },
      { speciesId: 'haliotis_discus', qty: 1, nameKo: '전복 (자개용)', nameEn: 'Abalone (for inlay)' },
    ],
    outputId: 'craft_lure_custom', outputQty: 1, baseSuccess: 0.80, xp: 26,
    requiresSkill: { id: 'craft_paint', rank: 1 },
    timeSec: 240, minLevel: 20,
  },
  {
    id: 'bp_egi_tune', station: 'workbench', group: 'lure',
    nameKo: '에기 침강 튜닝', nameEn: 'Egi Sink Tuning',
    descKo: '시트 납을 덧대 침강 자세를 잡는다. 두족류 공략 수심대를 좁힌다.',
    descEn: 'Trim sheet lead to fix the fall posture, narrowing the squid strike zone.',
    materials: [
      { itemId: 'lure_egi_35', qty: 1, nameKo: '에기 3.5호', nameEn: 'Egi #3.5' },
      { itemId: 'inv_mat_tin', qty: 1, nameKo: '주석 잉곳', nameEn: 'Tin Ingot' },
    ],
    outputId: 'craft_egi_tuned', outputQty: 1, baseSuccess: 0.82, xp: 24,
    requiresSkill: { id: 'craft_egi', rank: 1 },
    timeSec: 180, minLevel: 18,
  },

  // ── 고급(제작대) — 통발 ─────────────────────────────
  {
    id: 'bp_trap_basic', station: 'workbench', group: 'trap',
    nameKo: '기본 게 통발 제작', nameEn: 'Basic Crab Trap Build',
    descKo: '철사 프레임에 그물망을 씌운 기본 게 통발. 직판장 판매품과 같은 규격이다.',
    descEn: 'Mesh over a wire frame — the standard folding trap.',
    materials: [
      { itemId: 'inv_mat_wire', qty: 2, nameKo: '철사', nameEn: 'Wire' },
      { itemId: 'inv_mat_mesh', qty: 2, nameKo: '그물망', nameEn: 'Net Mesh' },
    ],
    outputId: 'inv_trap_trap_crab_basic', outputQty: 1, baseSuccess: 0.88, xp: 22,
    requiresSkill: { id: 'craft_trap', rank: 1 },
    timeSec: 150, minLevel: 12,
  },
  {
    id: 'bp_trap_improved', station: 'advanced', group: 'trap',
    nameKo: '프로 게 통발 제작', nameEn: 'Pro Crab Trap Build',
    descKo: '입구 각도를 좁히고 프레임을 보강한 대형 개량형. 통발 제작 최종 랭크의 도면이다.',
    descEn: 'Narrowed funnel and reinforced frame — the final-rank trap blueprint.',
    materials: [
      { itemId: 'inv_trap_trap_crab_basic', qty: 1, nameKo: '기본 게 통발', nameEn: 'Basic Crab Trap' },
      { itemId: 'inv_mat_wire', qty: 2, nameKo: '철사', nameEn: 'Wire' },
      { itemId: 'inv_mat_mesh', qty: 1, nameKo: '그물망', nameEn: 'Net Mesh' },
    ],
    outputId: 'inv_trap_trap_crab_pro', outputQty: 1, baseSuccess: 0.78, xp: 34,
    requiresSkill: { id: 'craft_trap', rank: 3 },
    timeSec: 600, minLevel: 40,
  },

  // ── 고급(제작대) — 로드·릴 ──────────────────────────
  {
    // 135차 — Ch1 M1-08 「간이 백팩」. 탁만수의 첫 교습: "짐부터 어떻게 좀 해라."
    id: 'bp_backpack_rough', station: 'hand', group: 'gear',
    nameKo: '간이 백팩', nameEn: 'Improvised Backpack',
    descKo: '헌 그물망과 목재 살로 엮은 등짐. 볼품은 없지만 짐칸이 한 줄 늘어난다.',
    descEn: 'Old netting lashed to wooden stays. Ugly, but it adds a row of carrying space.',
    materials: [
      { itemId: 'inv_mat_mesh', qty: 1, nameKo: '통발 그물망', nameEn: 'Trap Mesh' },
      { itemId: 'inv_mat_wood', qty: 2, nameKo: '목재', nameEn: 'Wood' },
      { itemId: 'inv_mat_wire', qty: 2, nameKo: '철사', nameEn: 'Wire' },
    ],
    outputId: 'craft_backpack_rough', outputQty: 1, baseSuccess: 0.95, xp: 30,
    timeSec: 30, minLevel: 1,
  },

  // ── 222차 확장 — 산출물은 상점에 이미 있는 물건(값 · 스펙이 갈라지지 않게) ──
  {
    id: 'bp_rig_swivel', station: 'hand', group: 'rig',
    nameKo: '감성돔 도래 채비 묶음', nameEn: 'Chinu Swivel Rig Bundle',
    descKo: '핀 도래에 목줄과 바늘을 미리 묶어 세 벌을 만든다. 현장에서 갈아 끼우기만 하면 된다.',
    descEn: 'Pre-tie leader and hooks to a pin swivel, three at a time — just swap them in on the spot.',
    materials: [
      { itemId: 'inv_carbon15', qty: 1, nameKo: '카본 목줄 3호', nameEn: 'Carbon Leader #3' },
      { itemId: 'inv_swivel', qty: 1, nameKo: '핀 도래 8호', nameEn: 'Pin Swivel #8' },
      { itemId: 'inv_chinu3', qty: 3, nameKo: '감성돔 바늘 3호', nameEn: 'Chinu Hook #3' },
    ],
    outputId: 'craft_rig_chinu', outputQty: 3, baseSuccess: 0.9, xp: 16,
    timeSec: 25, minLevel: 4, requiresSkill: { id: 'craft_knot', rank: 1 },
  },
  {
    id: 'bp_bait_fishcut', station: 'hand', group: 'bait',
    nameKo: '생선 조각 미끼 썰기', nameEn: 'Cut Fish Bait',
    descKo: '선어 오징어 한 마리를 갈치 · 우럭용 조각 미끼로 썬다.',
    descEn: 'Slice a fresh squid into cut bait for hairtail and rockfish.',
    materials: [{ itemId: 'shop_squid', qty: 1, nameKo: '오징어 (선어)', nameEn: 'Squid (Fresh)' }],
    outputId: 'inv_fishcut', outputQty: 4, baseSuccess: 0.97, xp: 8,
    timeSec: 15, minLevel: 1,
  },
  {
    id: 'bp_bait_chum', station: 'hand', group: 'bait',
    nameKo: '크릴 집어제 배합', nameEn: 'Krill Chum Mix',
    descKo: '냉동 크릴을 녹여 굵은소금과 버무린다. 집어제 한 봉이 된다.',
    descEn: 'Thaw krill and toss with coarse salt — one bag of chum.',
    materials: [
      { itemId: 'inv_krill', qty: 2, nameKo: '크릴 (냉동)', nameEn: 'Krill (Frozen)' },
      { itemId: 'inv_coarse_salt', qty: 1, nameKo: '굵은소금', nameEn: 'Coarse Salt' },
    ],
    outputId: 'inv_chum', outputQty: 1, baseSuccess: 0.95, xp: 10,
    timeSec: 25, minLevel: 3,
  },
  {
    id: 'bp_gloves', station: 'hand', group: 'life',
    nameKo: '목장갑 덧대기', nameEn: 'Patched Work Gloves',
    descKo: '무명천을 겹쳐 손바닥을 덧댄 장갑. 테트라포드 · 그물 작업에서 손을 지킨다.',
    descEn: 'Double-layered cotton palms — keeps your hands whole on tetrapods and nets.',
    materials: [{ itemId: 'inv_mat_cloth', qty: 2, nameKo: '무명천', nameEn: 'Cotton Cloth' }],
    outputId: 'inv_gloves_work', outputQty: 1, baseSuccess: 0.95, xp: 10,
    timeSec: 30, minLevel: 2,
  },
  {
    id: 'bp_float_balsa', station: 'workbench', group: 'sinker',
    nameKo: '구멍찌 깎기 (1.0호)', nameEn: 'Carve a Hole Float (1.0)',
    descKo: '목재를 깎아 구멍을 뚫고 도료와 수지로 마감한다. 부력 1.0호.',
    descEn: 'Carve and bore wood, then seal with paint and resin. 1.0 buoyancy.',
    materials: [
      { itemId: 'inv_mat_wood', qty: 1, nameKo: '목재', nameEn: 'Wood' },
      { itemId: 'inv_mat_paint', qty: 1, nameKo: '도료 세트', nameEn: 'Paint Set' },
      { itemId: 'inv_mat_resin', qty: 1, nameKo: '에폭시 수지', nameEn: 'Epoxy Resin' },
    ],
    outputId: 'shop_float10', outputQty: 2, baseSuccess: 0.8, xp: 24,
    timeSec: 180, minLevel: 14,
  },
  {
    id: 'bp_tongs', station: 'workbench', group: 'trap',
    nameKo: '채집 집게 만들기', nameEn: 'Make Foraging Tongs',
    descKo: '철사를 꼬아 집게 날을 세우고 나무 손잡이를 단다. 성게 · 게를 맨손으로 잡지 않아도 된다.',
    descEn: 'Twist wire into tong blades on a wooden grip — no more bare hands for urchins and crabs.',
    materials: [
      { itemId: 'inv_mat_wire', qty: 2, nameKo: '철사', nameEn: 'Wire' },
      { itemId: 'inv_mat_wood', qty: 1, nameKo: '목재', nameEn: 'Wood' },
    ],
    outputId: 'inv_tongs', outputQty: 1, baseSuccess: 0.9, xp: 16,
    timeSec: 90, minLevel: 5,
  },
  {
    id: 'bp_gaff', station: 'workbench', group: 'trap',
    nameKo: '채집 갈고리 만들기', nameEn: 'Make a Foraging Gaff',
    descKo: '주석으로 갈고리 끝을 붙이고 철사로 자루에 감는다. 바위틈 문어 · 전복용.',
    descEn: 'Cast a tin hook tip and bind it to a shaft — for octopus and abalone in crevices.',
    materials: [
      { itemId: 'inv_mat_wire', qty: 2, nameKo: '철사', nameEn: 'Wire' },
      { itemId: 'inv_mat_wood', qty: 1, nameKo: '목재', nameEn: 'Wood' },
      { itemId: 'inv_mat_tin', qty: 1, nameKo: '주석 잉곳', nameEn: 'Tin Ingot' },
    ],
    outputId: 'inv_gaff', outputQty: 1, baseSuccess: 0.85, xp: 20,
    timeSec: 120, minLevel: 9,
  },
  {
    id: 'bp_rod_holder', station: 'workbench', group: 'gear',
    nameKo: '원투 거치대 (삼발이)', nameEn: 'Surf Rod Stand (Tripod)',
    descKo: '목재 다리 셋을 철사로 묶은 삼발이. 원투 대를 걸어 두고 기다린다.',
    descEn: 'Three wooden legs lashed with wire — rest a surf rod and wait.',
    materials: [
      { itemId: 'inv_mat_wood', qty: 3, nameKo: '목재', nameEn: 'Wood' },
      { itemId: 'inv_mat_wire', qty: 2, nameKo: '철사', nameEn: 'Wire' },
    ],
    outputId: 'shop_rod_holder', outputQty: 1, baseSuccess: 0.88, xp: 20,
    timeSec: 150, minLevel: 10,
  },
  {
    id: 'bp_landing_net', station: 'workbench', group: 'gear',
    nameKo: '뜰채 3m 엮기', nameEn: 'Weave a 3 m Landing Net',
    descKo: '철사 테에 그물망을 엮고 목재 자루를 단다.',
    descEn: 'Weave mesh onto a wire hoop and fit a wooden pole.',
    materials: [
      { itemId: 'inv_mat_wire', qty: 2, nameKo: '철사', nameEn: 'Wire' },
      { itemId: 'inv_mat_mesh', qty: 1, nameKo: '통발 그물망', nameEn: 'Trap Mesh' },
      { itemId: 'inv_mat_wood', qty: 2, nameKo: '목재', nameEn: 'Wood' },
    ],
    outputId: 'shop_net_3', outputQty: 1, baseSuccess: 0.84, xp: 24,
    timeSec: 210, minLevel: 12,
  },
  {
    id: 'bp_bucket', station: 'workbench', group: 'gear',
    nameKo: '낚시용 두레박', nameEn: 'Fishing Bucket',
    descKo: '그물망에 수지를 먹여 물이 새지 않게 하고 철사 손잡이를 단다.',
    descEn: 'Seal mesh with resin so it holds water, then add a wire handle.',
    materials: [
      { itemId: 'inv_mat_mesh', qty: 1, nameKo: '통발 그물망', nameEn: 'Trap Mesh' },
      { itemId: 'inv_mat_resin', qty: 1, nameKo: '에폭시 수지', nameEn: 'Epoxy Resin' },
      { itemId: 'inv_mat_wire', qty: 1, nameKo: '철사', nameEn: 'Wire' },
    ],
    outputId: 'inv_bucket', outputQty: 1, baseSuccess: 0.86, xp: 18,
    timeSec: 120, minLevel: 7,
  },
  {
    id: 'bp_tairaba_skirt', station: 'workbench', group: 'lure',
    nameKo: '타이라바 스커트 물들이기', nameEn: 'Dye a Tai-rubber Skirt',
    descKo: '무명천을 가늘게 갈라 붉게 물들인다. 새우 다리처럼 흔들린다.',
    descEn: 'Shred cloth into strips and dye them red — they wave like shrimp legs.',
    materials: [
      { itemId: 'inv_mat_cloth', qty: 1, nameKo: '무명천', nameEn: 'Cotton Cloth' },
      { itemId: 'inv_mat_paint', qty: 1, nameKo: '도료 세트', nameEn: 'Paint Set' },
    ],
    outputId: 'inv_tairaba_skirt_red', outputQty: 2, baseSuccess: 0.88, xp: 16,
    timeSec: 120, minLevel: 15,
  },
  {
    id: 'bp_rod_custom', station: 'advanced', group: 'gear',
    nameKo: '커스텀 로드 빌딩', nameEn: 'Custom Rod Building',
    descKo: '블랭크에 가이드를 감고 에폭시로 마감한다. 손맛이 다른 나만의 대.',
    descEn: 'Wrap guides on a blank and finish with epoxy — a rod that is yours.',
    materials: [
      { itemId: 'inv_mat_blank', qty: 1, nameKo: '로드 블랭크', nameEn: 'Rod Blank' },
      { itemId: 'inv_mat_wire', qty: 2, nameKo: '철사', nameEn: 'Wire' },
      { itemId: 'inv_mat_resin', qty: 1, nameKo: '에폭시 수지', nameEn: 'Epoxy Resin' },
    ],
    outputId: 'craft_rod_custom', outputQty: 1, baseSuccess: 0.72, xp: 60,
    requiresSkill: { id: 'craft_rod', rank: 1 },
    timeSec: 1200, minLevel: 60,
  },
  {
    id: 'bp_reel_custom', station: 'advanced', group: 'gear',
    nameKo: '릴 기어비 커스텀', nameEn: 'Reel Gear Custom',
    descKo: '정밀 기어를 갈아 끼워 감는 속도를 바꾼다. 분해 조립에 손이 많이 간다.',
    descEn: 'Swap in precision gears to change retrieve speed — fiddly bench work.',
    materials: [
      { itemId: 'inv_reel', qty: 1, nameKo: '스피닝릴', nameEn: 'Spinning Reel' },
      { itemId: 'inv_mat_gear', qty: 1, nameKo: '정밀 기어 세트', nameEn: 'Precision Gear Set' },
    ],
    outputId: 'craft_reel_custom', outputQty: 1, baseSuccess: 0.75, xp: 50,
    requiresSkill: { id: 'craft_reel', rank: 1 },
    timeSec: 900, minLevel: 55,
  },
];

/** 위치별 도면 목록 (목록 렌더 — 그룹 순서 유지) */
export function blueprintsFor(station: CraftStation): CraftBlueprint[] {
  return CRAFT_BLUEPRINTS.filter((b) => b.station === station);
}

export function getBlueprint(id: string): CraftBlueprint | undefined {
  return CRAFT_BLUEPRINTS.find((b) => b.id === id);
}

/** 제작 1건 성공률 — `craft_success`(매듭 숙련) 선형 합산 보정, 상한 0.99 */
export function craftSuccessRate(bp: CraftBlueprint, successMult = 1): number {
  return Math.min(0.99, bp.baseSuccess * successMult);
}

/**
 * 재료 절감 — `craft_material`(공구 관리)은 **확률적 미소모**로 적용한다.
 * (분수 재료를 만들지 않기 위해. mult 0.88이면 단위마다 12% 확률로 아껴 쓴다.)
 */
export function materialSaveChance(materialMult = 1): number {
  return Math.max(0, Math.min(0.6, 1 - materialMult));
}
