/**
 * @file CraftingDatabase.ts
 * @description 제작 도면 DB (P7 — SPEC §2-5). **요리(RecipeDatabase)와 분리한다.**
 *
 * 2단 구조:
 *  - `station: 'hand'`      = **U 창 '제작' 탭**(핸드크래프팅) — 조건 없이 어디서나.
 *  - `station: 'workbench'` = **설치형 고급 제작대** 근접 [F] 팝업.
 *
 * 재료·산출의 itemId는 클라이언트 인벤토리 id 문자열이다(RecipeDatabase 전례).
 * 산출 아이템 템플릿은 `client-pc/src/data/CraftOutputs.ts`가 보유한다 —
 * core는 **무엇을 얼마나 먹고 무엇이 몇 개 나오는가**만 안다(렌더·인벤토리 비의존).
 */

/** 제작 위치 — 기본(맨손) / 고급(설치 제작대) */
export type CraftStation = 'hand' | 'workbench';

/** 도면 분류 — '제작' 탭 좌측 목록 그룹 */
export type CraftGroup = 'rig' | 'sinker' | 'medic' | 'lure' | 'trap' | 'gear';

export const CRAFT_GROUP_LABEL: Record<CraftGroup, { ko: string; en: string }> = {
  rig: { ko: '채비 묶음', en: 'Rigs' },
  sinker: { ko: '봉돌 주조', en: 'Sinkers' },
  medic: { ko: '구급품', en: 'First Aid' },
  lure: { ko: '루어·에기', en: 'Lures & Egi' },
  trap: { ko: '통발', en: 'Traps' },
  gear: { ko: '로드·릴', en: 'Rod & Reel' },
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
}

/**
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
  },

  // ── 기본(맨손) — 봉돌 주조 ─────────────────────────
  {
    id: 'bp_sinker_ring', station: 'hand', group: 'sinker',
    nameKo: '고리봉돌 주조 (20호)', nameEn: 'Cast Ring Sinker (#20)',
    descKo: '주석을 녹여 고리봉돌을 뽑는다. 원투 메인 싱커의 기본형.',
    descEn: 'Melt tin into a ring sinker — the workhorse surf weight.',
    materials: [{ itemId: 'inv_mat_tin', qty: 2, nameKo: '주석 잉곳', nameEn: 'Tin Ingot' }],
    outputId: 'inv_sinker_ring_20', outputQty: 2, baseSuccess: 0.88, xp: 14,
    requiresSkill: { id: 'craft_sinker', rank: 1 },
  },
  {
    id: 'bp_sinker_hole', station: 'hand', group: 'sinker',
    nameKo: '구멍봉돌 주조 (20호)', nameEn: 'Cast Hole Sinker (#20)',
    descKo: '가운데 구멍을 낸 봉돌. 원줄이 통과해 이물감이 적다(예신 피드백 +15%).',
    descEn: 'A through-hole sinker; the line slides free, so bites telegraph better (+15%).',
    materials: [
      { itemId: 'inv_mat_tin', qty: 2, nameKo: '주석 잉곳', nameEn: 'Tin Ingot' },
      { itemId: 'inv_mat_wire', qty: 1, nameKo: '철사', nameEn: 'Wire' },
    ],
    outputId: 'inv_sinker_hole_20', outputQty: 2, baseSuccess: 0.84, xp: 16,
    requiresSkill: { id: 'craft_sinker', rank: 1 },
  },

  // ── 기본(맨손) — 구급품 (§5 치료 수단) ───────────────
  {
    id: 'bp_bandage', station: 'hand', group: 'medic',
    nameKo: '붕대', nameEn: 'Bandage',
    descKo: '출혈을 멈춘다. 손질 실수·갯바위 미끄러짐의 1차 처치.',
    descEn: 'Stops bleeding — first response to knife slips and rock falls.',
    materials: [{ itemId: 'inv_mat_cloth', qty: 2, nameKo: '면 붕대천', nameEn: 'Cotton Gauze' }],
    outputId: 'craft_bandage', outputQty: 2, baseSuccess: 0.95, xp: 10,
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
  },
  {
    id: 'bp_trap_improved', station: 'workbench', group: 'trap',
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
  },
  {
    id: 'bp_rod_custom', station: 'workbench', group: 'gear',
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
  },
  {
    id: 'bp_reel_custom', station: 'workbench', group: 'gear',
    nameKo: '릴 기어비 커스텀', nameEn: 'Reel Gear Custom',
    descKo: '정밀 기어를 갈아 끼워 감는 속도를 바꾼다. 분해 조립에 손이 많이 간다.',
    descEn: 'Swap in precision gears to change retrieve speed — fiddly bench work.',
    materials: [
      { itemId: 'inv_reel', qty: 1, nameKo: '스피닝릴', nameEn: 'Spinning Reel' },
      { itemId: 'inv_mat_gear', qty: 1, nameKo: '정밀 기어 세트', nameEn: 'Precision Gear Set' },
    ],
    outputId: 'craft_reel_custom', outputQty: 1, baseSuccess: 0.75, xp: 50,
    requiresSkill: { id: 'craft_reel', rank: 1 },
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
