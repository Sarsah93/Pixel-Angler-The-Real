/**
 * @file MarineNuisanceDatabase.ts
 * @description 과증식 해양생물 DB — 해파리 2종 · 불가사리 2종 (138차)
 *
 * 거래되는 어종이 아니라 **처리 대상**이다. 어종 DB(`FishDatabase`)와 분리한 이유:
 *  - 낚시 스폰 후보가 아니다(해파리는 미끼에 걸리지 않고, 불가사리는 바닥 채집물이다).
 *  - 가치가 판매가가 아니라 **구제 수매가**로 매겨진다(아무르불가사리 지자체 수매 사업).
 *  - 계절 과증식(bloom)이라는 시간 축이 어종의 금어기·제철과 성격이 다르다.
 *
 * 수치는 국립수산과학원·해양수산부 해파리 모니터링 공개 정보와 FishBase 계열 기재를
 * 게임 스케일로 옮긴 것이다(정확한 학술 수치가 아니라 **게임 내 상세보기 표기용**).
 */

export type NuisanceKind = 'jellyfish' | 'starfish';
/** 수거 방식 — snag = 훌치기(라인 끌어오기) · gather = 손/도구 채집 */
export type NuisanceHarvest = 'snag' | 'gather' | 'both';

export interface MarineNuisance {
  id: string;
  nameKo: string;
  nameEn: string;
  scientificName: string;
  kind: NuisanceKind;
  /** 크기 — 해파리 = 우산 지름 / 불가사리 = 팔 끝 사이 반경*2 (cm) */
  sizeRangeCm: [number, number];
  /** 무게 (kg) */
  weightRangeKg: [number, number];
  /** 과증식 월 (1~12) */
  bloomMonths: number[];
  /** 정점 월 — 이 달에는 개체가 2배로 나온다 */
  peakMonths: number[];
  /** 상대 출현 가중 (1 = 표준). 낮을수록 드물다 */
  abundance: number;
  /** 독성 0 없음 / 1 경미 / 2 통증 / 3 위험 */
  venom: 0 | 1 | 2 | 3;
  harvest: NuisanceHarvest;
  /** 구제 수매가 (원/kg · 0 = 수매 없음) */
  cullPricePerKg: number;
  /** 식용 가능 여부 */
  edible: boolean;
  /** 서식·분포 */
  habitatKo: string;
  habitatEn: string;
  /** 피해 양상 */
  damageKo: string;
  damageEn: string;
  /** 구별 포인트 (플레이어가 눈으로 가려야 한다) */
  markKo: string;
  markEn: string;
  descKo: string;
  descEn: string;
  /** 해파리 — 표층 표류 규칙 */
  drift?: {
    /** 해안선에서 최소 이 거리(타일) 바깥에만 뜬다 */
    minShoreTiles: number;
    /** 한 칸 이동 간격(초) — 실시간 */
    moveSec: number;
  };
  /** 불가사리 — 바닥 서식 규칙 */
  benthic?: {
    minDepthM: number;
    maxDepthM: number;
    /** 해안으로 밀려올 확률 (0~1) — 이 개체는 [F] 채집 대상이 된다 */
    washUpRate: number;
  };
}

export const MARINE_NUISANCES: MarineNuisance[] = [
  {
    id: 'moon_jelly',
    nameKo: '보름달물해파리', nameEn: 'Moon Jellyfish',
    scientificName: 'Aurelia coerulea',
    kind: 'jellyfish',
    sizeRangeCm: [15, 40], weightRangeKg: [0.2, 2.5],
    bloomMonths: [5, 6, 7, 8, 9, 10], peakMonths: [7, 8],
    abundance: 1,
    venom: 1,
    harvest: 'snag',
    cullPricePerKg: 300,
    edible: false,
    habitatKo: '전 연안 표층. 만·항만처럼 물이 갇힌 폐쇄성 해역에서 폴립이 번식해 떼로 뜬다.',
    habitatEn: 'Surface waters nationwide; polyps thrive in enclosed bays and harbours.',
    damageKo: '발전소 취수구와 양식장 그물을 막고, 조업 그물에 딸려 들어와 어획물을 상하게 한다.',
    damageEn: 'Clogs intake screens and farm nets; fouls catches hauled in the same net.',
    markKo: '반투명한 청백색 우산에 **말굽 모양 생식소 네 개**가 비쳐 보인다. 촉수가 짧다.',
    markEn: 'Translucent bluish bell with four horseshoe gonads; short tentacles.',
    descKo: '가장 흔한 과증식 해파리. 독이 약해 스치면 따끔한 정도지만, 수가 많아 피해가 누적된다. 유영력이 거의 없어 조류를 그대로 타고 흐른다.',
    descEn: 'The most common bloom jellyfish. Mild sting, but sheer numbers do the damage. Almost no swimming power — it simply rides the current.',
    drift: { minShoreTiles: 6, moveSec: 300 },
  },
  {
    id: 'nomura_jelly',
    nameKo: '노무라입깃해파리', nameEn: "Nomura's Jellyfish",
    scientificName: 'Nemopilema nomurai',
    kind: 'jellyfish',
    sizeRangeCm: [60, 200], weightRangeKg: [15, 150],
    bloomMonths: [7, 8, 9, 10], peakMonths: [8, 9],
    abundance: 0.18,
    venom: 3,
    harvest: 'snag',
    cullPricePerKg: 1200,
    edible: true,
    habitatKo: '동중국해에서 발생해 대마난류를 타고 남해·동해로 들어온다. 먼바다 표층.',
    habitatEn: 'Spawns in the East China Sea and rides the Tsushima Current into Korean waters.',
    damageKo: '한 마리가 100kg을 넘어 그물을 찢고 조업을 멈춰 세운다. 쏘이면 통증과 부종이 남는다.',
    damageEn: 'A single animal can exceed 100 kg — it tears nets and halts a day of fishing. Stings hurt and swell.',
    markKo: '황갈색 우산 아래로 **실 같은 부속지가 다발로 늘어진다**. 보름달물해파리보다 훨씬 크고 탁하다.',
    markEn: 'Yellow-brown bell trailing dense thread-like appendages; far larger and murkier than a moon jelly.',
    descKo: '세계 최대급 해파리. 개체 수는 많지 않지만 한 마리의 피해가 크다. 염장해 먹는 유일한 해파리이기도 하다.',
    descEn: 'Among the largest jellyfish on earth. Rare in number, heavy in damage — and the one jellyfish people salt and eat.',
    drift: { minShoreTiles: 8, moveSec: 420 },
  },
  {
    id: 'blue_bat_star',
    nameKo: '별불가사리', nameEn: 'Blue Bat Star',
    scientificName: 'Patiria pectinifera',
    kind: 'starfish',
    sizeRangeCm: [6, 14], weightRangeKg: [0.03, 0.2],
    bloomMonths: [3, 4, 5, 6, 9, 10], peakMonths: [4, 5],
    abundance: 0.84,   // 150차 — 필드에 너무 많이 보여 30% 감산(사용자 리포트)
    venom: 0,
    harvest: 'both',
    cullPricePerKg: 0,
    edible: false,
    habitatKo: '전 연안 조간대~수심 40m 암반·자갈. 해안으로도 자주 밀려온다.',
    habitatEn: 'Rocky and gravel bottoms from the intertidal to 40 m; often washes ashore.',
    damageKo: '거의 없다. 죽은 생물과 유기물을 먹는 청소부 역할이 크다.',
    damageEn: 'Minimal. Largely a scavenger that cleans up dead matter.',
    markKo: '팔이 **짧고 넓어 오각형에 가깝다**. 짙은 청람색 바탕에 주황 반점.',
    markEn: 'Short, broad arms giving a pentagon outline; deep blue-grey with orange mottling.',
    descKo: '흔히 유해종으로 오해받지만 패류를 거의 먹지 않는다. 구제 대상이 아니므로 잡았으면 돌려보내는 편이 낫다.',
    descEn: 'Often mistaken for a pest, but it barely preys on shellfish. Not a cull target — better returned to the sea.',
    benthic: { minDepthM: 0, maxDepthM: 40, washUpRate: 0.35 },
  },
  {
    id: 'amur_star',
    nameKo: '아무르불가사리', nameEn: 'Northern Pacific Seastar',
    scientificName: 'Asterias amurensis',
    kind: 'starfish',
    sizeRangeCm: [20, 40], weightRangeKg: [0.15, 0.9],
    bloomMonths: [3, 4, 5, 6], peakMonths: [4, 5],
    abundance: 0.8,
    venom: 0,
    harvest: 'both',
    cullPricePerKg: 700,
    edible: false,
    habitatKo: '동해·남해 수심 0~40m 모래·펄·암반. 산란기인 봄에 떼로 몰린다.',
    habitatEn: 'Sand, mud and rock to 40 m in the East and South Seas; swarms in the spring spawning season.',
    damageKo: '전복·바지락·굴을 직접 포식한다. 양식장 피해가 커 지자체가 수매해 구제한다.',
    damageEn: 'Preys directly on abalone, clams and oysters — the reason local governments pay by the kilo to remove it.',
    markKo: '팔 다섯이 **길고 끝이 위로 젖혀진다**. 황색 바탕에 자주색 반점.',
    markEn: 'Five long arms with upturned tips; yellow ground with purple mottling.',
    descKo: '대표적인 해적생물. 별불가사리와 헷갈리기 쉬우니 팔 길이와 끝 모양으로 가린다. 수매 대상이라 모아 두면 값이 된다.',
    descEn: 'The pest starfish. Tell it from the bat star by the long, upturned arms. Cull payments make a full bucket worth carrying.',
    benthic: { minDepthM: 0, maxDepthM: 40, washUpRate: 0.2 },
  },
];

export function getNuisance(id: string): MarineNuisance | undefined {
  return MARINE_NUISANCES.find((n) => n.id === id);
}

/** 그 달에 나올 수 있는 종 + 가중 (0이면 안 나온다) */
export function nuisanceBloomWeight(n: MarineNuisance, month: number): number {
  if (!n.bloomMonths.includes(month)) return 0;
  return n.abundance * (n.peakMonths.includes(month) ? 2 : 1);
}

/** 개체 생성 — 크기·무게는 균등 난수(시드 주입 가능) */
export function rollNuisance(n: MarineNuisance, rnd: () => number = Math.random): { sizeCm: number; weightKg: number } {
  const t = rnd();
  const sizeCm = Math.round(n.sizeRangeCm[0] + (n.sizeRangeCm[1] - n.sizeRangeCm[0]) * t);
  // 무게는 크기와 같은 분위를 따르되 약간의 개체차(±12%)를 준다
  const base = n.weightRangeKg[0] + (n.weightRangeKg[1] - n.weightRangeKg[0]) * t;
  const weightKg = Math.max(0.01, base * (0.88 + rnd() * 0.24));
  return { sizeCm, weightKg: Math.round(weightKg * 100) / 100 };
}

/** 구제 수매가 (원) — 수매 대상이 아니면 0 */
export function nuisanceCullValue(n: MarineNuisance, weightKg: number): number {
  if (n.cullPricePerKg <= 0) return 0;
  return Math.round((n.cullPricePerKg * weightKg) / 10) * 10;
}
