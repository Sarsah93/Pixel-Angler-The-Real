/**
 * @file FishBehaviorDatabase.ts
 * @description 어종별 고증 행동 프로파일 데이터베이스
 *
 * 실제 바다낚시 현장 고증 및 국립수산과학원 데이터를 기반으로
 * 어종별 계절/물때/수온/채비 반응성을 정량화합니다.
 *
 * FishBiteEngine.ts V2에서 이 데이터를 참조해 입질 확률을 계산합니다.
 */

// ─────────────────────────────────────────────────────────
// 어종 행동 프로파일 타입
// ─────────────────────────────────────────────────────────

/** 수온 활성도 커브 포인트 */
export interface TempActivityPoint {
  /** 수온 (°C) */
  tempC: number;
  /** 해당 수온에서의 활성도 (0.0~1.0) */
  activity: number;
}

/** 어종별 고증 행동 프로파일 */
export interface FishBehaviorProfile {
  /** FishDatabase.ts의 species.id와 동일해야 함 */
  speciesId: string;

  // ─── 계절별 활성도 ───────────────────────────────────
  /** 계절별 활성도 (0.0~1.0). 회유 시즌 등 반영 */
  seasonActivity: {
    spring: number;   // 3~5월
    summer: number;   // 6~8월
    autumn: number;   // 9~11월
    winter: number;   // 12~2월
  };

  // ─── 물때 타이밍 ─────────────────────────────────────
  /** 입질 활성 조류 세기 구간 (0.0~1.0, 1.0이 사리) */
  optimalTideStrength: [min: number, max: number];
  /**
   * 만조 전후 활성 시간대 (분 단위)
   * 예: [-30, 90] = 만조 30분 전 ~ 만조 후 90분이 피크
   */
  highTideWindow: [beforeMin: number, afterMin: number];
  /**
   * 간조 전후 활성 시간대 (분 단위)
   * 예: [-60, 30] = 간조 60분 전 ~ 간조 후 30분
   */
  lowTideWindow: [beforeMin: number, afterMin: number];

  // ─── 수온 반응 커브 ───────────────────────────────────
  /**
   * 수온별 활성도 커브 (선형 보간 사용)
   * 반드시 tempC 오름차순으로 정렬할 것
   */
  tempActivityCurve: TempActivityPoint[];

  // ─── 채비 타입 보너스 ─────────────────────────────────
  /** 전유동 채비 배수 (1.0 = 보너스 없음) */
  floatFishingBonus: number;
  /** 반유동 채비 배수 */
  semiFloatBonus: number;
  /** 바닥 채비 배수 (원투/선상 포함) */
  bottomRigBonus: number;
  /** 루어 반응도 (0.0~1.0) */
  lureSensitivity: number;

  // ─── 서식지 선호 ─────────────────────────────────────
  /** 선호 수심 범위 (m) */
  preferredDepthM: [min: number, max: number];
  /** 선호 포인트 유형 */
  preferredHabitat: Array<'breakwater' | 'rocky_shore' | 'tidal_flat' | 'open_sea' | 'pier' | 'beach'>;

  // ─── 법적 규제 ────────────────────────────────────────
  /** 금어기 월 배열 (해당 월에 포획 시 경고 메시지 및 점수 패널티) */
  legalClosedMonths: number[];
  /** 법정 포획 최소 체장 (cm). 미달 시 자동 방류 안내 */
  legalMinSizeCm?: number;
}

// ─────────────────────────────────────────────────────────
// 고증 데이터 (주요 어종 10종)
// ─────────────────────────────────────────────────────────

export const FISH_BEHAVIOR_DB: FishBehaviorProfile[] = [

  // ─────────────────────────────────
  // 감성돔 (Black Seabream / Acanthopagrus schlegelii)
  // 남해 전역 방파제/갯바위 대표 어종
  // ─────────────────────────────────
  {
    speciesId: 'black_seabream',
    seasonActivity: {
      spring: 0.75,  // 4~5월 수온 상승기 연안 이동
      summer: 0.55,  // 한여름 고수온기 깊이 들어감
      autumn: 0.95,  // 9~11월 최고 시즌 (추계 감성돔)
      winter: 0.70,  // 영등철(2~3월) 수온 하락기 연안 붙음
    },
    optimalTideStrength: [0.40, 0.85],
    highTideWindow: [-30, 90],  // 만조 30분 전 ~ 만조 후 90분 피크
    lowTideWindow: [-60, 30],
    tempActivityCurve: [
      { tempC: 6,  activity: 0.35 },
      { tempC: 10, activity: 0.65 },
      { tempC: 14, activity: 0.90 },
      { tempC: 18, activity: 1.00 },
      { tempC: 22, activity: 0.85 },
      { tempC: 26, activity: 0.50 },
      { tempC: 30, activity: 0.20 },
    ],
    floatFishingBonus: 1.5,   // 전유동/반유동 채비 최강 반응
    semiFloatBonus: 1.3,
    bottomRigBonus: 0.75,
    lureSensitivity: 0.15,
    preferredDepthM: [2, 15],
    preferredHabitat: ['breakwater', 'rocky_shore'],
    legalClosedMonths: [],
    legalMinSizeCm: 25,
  },

  // ─────────────────────────────────
  // 벵에돔 (Largescale Blackfish / Girella punctata)
  // 제주 및 남해 외도 갯바위 전문 어종
  // ─────────────────────────────────
  {
    speciesId: 'largescale_blackfish',
    seasonActivity: {
      spring: 0.70,
      summer: 1.00,  // 7~8월 여름이 최대 시즌 (빵가루 전유동 독무대)
      autumn: 0.85,
      winter: 0.40,  // 수온 14도 이하 급감
    },
    optimalTideStrength: [0.50, 1.00],  // 사리 근처 강한 조류에서 활성
    highTideWindow: [-60, 60],
    lowTideWindow: [-30, 30],
    tempActivityCurve: [
      { tempC: 12, activity: 0.20 },
      { tempC: 16, activity: 0.55 },
      { tempC: 20, activity: 0.90 },
      { tempC: 24, activity: 1.00 },
      { tempC: 28, activity: 0.80 },
    ],
    floatFishingBonus: 1.8,   // 전층 전유동 채비의 황제
    semiFloatBonus: 1.2,
    bottomRigBonus: 0.40,
    lureSensitivity: 0.05,    // 루어에 거의 반응 안 함
    preferredDepthM: [1, 8],
    preferredHabitat: ['rocky_shore'],
    legalClosedMonths: [],
    legalMinSizeCm: 20,
  },

  // ─────────────────────────────────
  // 갈치 (Hairtail / Trichiurus japonicus)
  // 여름~가을 전국 방파제 야간 인기 어종
  // ─────────────────────────────────
  {
    speciesId: 'hairtail',
    seasonActivity: {
      spring: 0.30,
      summer: 0.90,  // 7~8월이 피크 (특히 야간 방파제)
      autumn: 0.85,  // 9~10월 가을 갈치 대세
      winter: 0.15,
    },
    optimalTideStrength: [0.25, 0.65],  // 조금 근처가 오히려 입질 활발
    highTideWindow: [-90, 120],
    lowTideWindow: [-30, 60],
    tempActivityCurve: [
      { tempC: 14, activity: 0.15 },
      { tempC: 18, activity: 0.55 },
      { tempC: 22, activity: 0.85 },
      { tempC: 26, activity: 1.00 },
      { tempC: 30, activity: 0.70 },
    ],
    floatFishingBonus: 0.60,
    semiFloatBonus: 0.80,
    bottomRigBonus: 1.50,   // 선상 갈치 바닥 채비 강세
    lureSensitivity: 0.65,  // 지그헤드·갈치 루어에 반응 양호
    preferredDepthM: [5, 80],
    preferredHabitat: ['breakwater', 'open_sea'],
    legalClosedMonths: [],
    legalMinSizeCm: 18,
  },

  // ─────────────────────────────────
  // 볼락 (Black Rockfish / Sebastes inermis)
  // 전국 방파제 야간 가족 낚시 대표 어종
  // ─────────────────────────────────
  {
    speciesId: 'black_rockfish',
    seasonActivity: {
      spring: 0.80,  // 3~5월 산란기 입질 활발
      summer: 0.60,
      autumn: 0.70,
      winter: 0.85,  // 겨울에도 방파제 테트라포드 내부에서 활성
    },
    optimalTideStrength: [0.20, 0.70],
    highTideWindow: [-30, 60],
    lowTideWindow: [-30, 30],
    tempActivityCurve: [
      { tempC: 6,  activity: 0.65 },
      { tempC: 10, activity: 0.90 },
      { tempC: 14, activity: 1.00 },
      { tempC: 18, activity: 0.80 },
      { tempC: 22, activity: 0.55 },
      { tempC: 26, activity: 0.30 },
    ],
    floatFishingBonus: 1.10,
    semiFloatBonus: 1.00,
    bottomRigBonus: 1.20,
    lureSensitivity: 0.70,   // 지그헤드·인조웜에 강한 반응
    preferredDepthM: [0.5, 8],
    preferredHabitat: ['breakwater', 'rocky_shore', 'pier'],
    legalClosedMonths: [],
    legalMinSizeCm: 15,
  },

  // ─────────────────────────────────
  // 부시리 (Yellowtail / Seriola lalandi)
  // 제주·남해 지깅 대표 회유 어종
  // ─────────────────────────────────
  {
    speciesId: 'yellowtail',
    seasonActivity: {
      spring: 0.50,  // 북상 회유 시작
      summer: 0.80,
      autumn: 1.00,  // 9~10월 가을 부시리 지깅 최성기
      winter: 0.30,
    },
    optimalTideStrength: [0.60, 1.00],  // 사리 강조류 = 지깅 최적
    highTideWindow: [-120, 60],
    lowTideWindow: [-60, 30],
    tempActivityCurve: [
      { tempC: 16, activity: 0.30 },
      { tempC: 20, activity: 0.70 },
      { tempC: 24, activity: 1.00 },
      { tempC: 28, activity: 0.85 },
    ],
    floatFishingBonus: 0.30,
    semiFloatBonus: 0.40,
    bottomRigBonus: 0.50,
    lureSensitivity: 1.00,   // 지깅/루어 전용 어종
    preferredDepthM: [10, 60],
    preferredHabitat: ['open_sea', 'rocky_shore'],
    legalClosedMonths: [],
    legalMinSizeCm: 30,
  },

  // ─────────────────────────────────
  // 참돔 (Red Seabream / Pagrus major)
  // 선상 타이라바·지깅 최고급 어종
  // ─────────────────────────────────
  {
    speciesId: 'red_seabream',
    seasonActivity: {
      spring: 0.90,  // 봄 산란기 연안 이동 (타이라바 최성기)
      summer: 0.60,
      autumn: 0.80,
      winter: 0.40,
    },
    optimalTideStrength: [0.30, 0.70],
    highTideWindow: [-60, 90],
    lowTideWindow: [-30, 30],
    tempActivityCurve: [
      { tempC: 10, activity: 0.40 },
      { tempC: 15, activity: 0.80 },
      { tempC: 18, activity: 1.00 },
      { tempC: 22, activity: 0.90 },
      { tempC: 26, activity: 0.60 },
    ],
    floatFishingBonus: 0.40,
    semiFloatBonus: 0.50,
    bottomRigBonus: 0.90,   // 타이라바는 바닥 드리프트 방식
    lureSensitivity: 0.85,
    preferredDepthM: [20, 100],
    preferredHabitat: ['open_sea'],
    legalClosedMonths: [4, 5],  // 4~5월 산란기 금어기 (지역별 상이)
    legalMinSizeCm: 24,
  },

  // ─────────────────────────────────
  // 농어 (Japanese Seabass / Lateolabrax japonicus)
  // 여름 야간 루어낚시 인기 어종
  // ─────────────────────────────────
  {
    speciesId: 'japanese_seabass',
    seasonActivity: {
      spring: 0.65,
      summer: 1.00,  // 7~8월 여름 야간 루어낚시 최성기
      autumn: 0.80,
      winter: 0.30,
    },
    optimalTideStrength: [0.30, 0.80],
    highTideWindow: [-60, 90],   // 만조 전후 베이트피시 밀림 타이밍
    lowTideWindow: [-30, 30],
    tempActivityCurve: [
      { tempC: 10, activity: 0.30 },
      { tempC: 15, activity: 0.65 },
      { tempC: 20, activity: 0.95 },
      { tempC: 24, activity: 1.00 },
      { tempC: 28, activity: 0.70 },
    ],
    floatFishingBonus: 0.50,
    semiFloatBonus: 0.70,
    bottomRigBonus: 0.60,
    lureSensitivity: 0.95,   // 미노우·바이브레이션 루어 최강 반응
    preferredDepthM: [0.5, 20],
    preferredHabitat: ['breakwater', 'rocky_shore', 'beach'],
    legalClosedMonths: [1, 2],  // 1~2월 산란기 지역 금어기
    legalMinSizeCm: 25,
  },

  // ─────────────────────────────────
  // 숭어 (Striped Mullet / Mugil cephalus)
  // 갯벌·방파제 리드미컬 수면 활동 어종
  // ─────────────────────────────────
  {
    speciesId: 'striped_mullet',
    seasonActivity: {
      spring: 0.70,
      summer: 0.85,
      autumn: 1.00,  // 10~11월 결집 시즌
      winter: 0.45,
    },
    optimalTideStrength: [0.15, 0.55],  // 약한 조류 선호
    highTideWindow: [-30, 60],
    lowTideWindow: [-60, 60],  // 간조 전후 갯벌 접근
    tempActivityCurve: [
      { tempC: 8,  activity: 0.40 },
      { tempC: 12, activity: 0.70 },
      { tempC: 16, activity: 0.90 },
      { tempC: 20, activity: 1.00 },
      { tempC: 25, activity: 0.80 },
    ],
    floatFishingBonus: 1.20,
    semiFloatBonus: 0.90,
    bottomRigBonus: 0.60,
    lureSensitivity: 0.10,    // 루어 거의 반응 없음
    preferredDepthM: [0.5, 5],
    preferredHabitat: ['tidal_flat', 'breakwater', 'pier'],
    legalClosedMonths: [],
    legalMinSizeCm: 20,
  },

  // ─────────────────────────────────
  // 광어/넙치 (Olive Flounder / Paralichthys olivaceus)
  // 바닥 채비 및 지깅 대표 백조어
  // ─────────────────────────────────
  {
    speciesId: 'olive_flounder',
    seasonActivity: {
      spring: 1.00,  // 3~5월 산란기 연안 이동, 포획량 최대
      summer: 0.55,
      autumn: 0.75,
      winter: 0.60,  // 겨울에도 모래바닥 에 붙어 있음
    },
    optimalTideStrength: [0.20, 0.60],
    highTideWindow: [-30, 60],
    lowTideWindow: [-30, 60],
    tempActivityCurve: [
      { tempC: 8,  activity: 0.55 },
      { tempC: 12, activity: 0.85 },
      { tempC: 16, activity: 1.00 },
      { tempC: 20, activity: 0.75 },
      { tempC: 24, activity: 0.45 },
    ],
    floatFishingBonus: 0.20,
    semiFloatBonus: 0.30,
    bottomRigBonus: 1.60,    // 바닥 채비 독점 어종
    lureSensitivity: 0.55,   // 소형 지그헤드+섀드웜에 반응
    preferredDepthM: [3, 30],
    preferredHabitat: ['beach', 'open_sea', 'breakwater'],
    legalClosedMonths: [4, 5],
    legalMinSizeCm: 35,
  },

  // ─────────────────────────────────
  // 쥐치 (Filefish / Stephanolepis cirrhifer)
  // 갯바위/방파제 미끼 도둑의 대명사
  // ─────────────────────────────────
  {
    speciesId: 'filefish',
    seasonActivity: {
      spring: 0.50,
      summer: 1.00,  // 여름 전 해역 번성
      autumn: 0.80,
      winter: 0.20,
    },
    optimalTideStrength: [0.10, 0.50],
    highTideWindow: [-60, 120],
    lowTideWindow: [-30, 60],
    tempActivityCurve: [
      { tempC: 14, activity: 0.20 },
      { tempC: 18, activity: 0.65 },
      { tempC: 22, activity: 1.00 },
      { tempC: 26, activity: 0.90 },
    ],
    floatFishingBonus: 1.00,
    semiFloatBonus: 0.90,
    bottomRigBonus: 0.80,
    lureSensitivity: 0.05,
    preferredDepthM: [1, 10],
    preferredHabitat: ['breakwater', 'rocky_shore'],
    legalClosedMonths: [],
    legalMinSizeCm: undefined,
  },
];

// ─────────────────────────────────────────────────────────
// 조회 헬퍼 함수
// ─────────────────────────────────────────────────────────

/** speciesId로 행동 프로파일 조회 */
export function getBehaviorProfile(speciesId: string): FishBehaviorProfile | undefined {
  return FISH_BEHAVIOR_DB.find((p) => p.speciesId === speciesId);
}

/**
 * 수온 활성도 커브에서 선형 보간으로 활성도 계산
 * 커브는 tempC 오름차순 정렬 필수
 */
export function interpolateTempActivity(
  curve: TempActivityPoint[],
  tempC: number,
): number {
  if (curve.length === 0) return 0.5;
  if (tempC <= curve[0].tempC) return curve[0].activity;
  if (tempC >= curve[curve.length - 1].tempC) return curve[curve.length - 1].activity;

  for (let i = 0; i < curve.length - 1; i++) {
    const lo = curve[i];
    const hi = curve[i + 1];
    if (tempC >= lo.tempC && tempC <= hi.tempC) {
      const ratio = (tempC - lo.tempC) / (hi.tempC - lo.tempC);
      return lo.activity + (hi.activity - lo.activity) * ratio;
    }
  }
  return 0.5;
}

/**
 * 현재 날짜가 해당 어종의 금어기인지 판단
 */
export function isClosedSeason(profile: FishBehaviorProfile, date: Date): boolean {
  const month = date.getMonth() + 1; // 1~12
  return profile.legalClosedMonths.includes(month);
}
