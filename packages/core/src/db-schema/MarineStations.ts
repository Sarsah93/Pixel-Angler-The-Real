/**
 * @file MarineStations.ts
 * @description 국립해양측위정보원 해양기상 관측소 레지스트리 (76개소 / 13개 기관)
 *
 * openWeatherNow.do/openWeatherDate.do는 mmsi(지점코드)가 **필수**이므로
 * 전 지역 수집을 하려면 지점 목록이 선행되어야 한다. 이 파일이 그 목록이다.
 *
 * 센서 커버리지 (실측 확인 2026-07-16):
 *   풍향/풍속 61/76 · 기온/습도 60/76 · 기압 59/76 · 시정 23/76
 *   수온 11/76 · 유향유속 11/76 · 염분 4/76 · 조류 4/76
 *   **파고/파향 0/76 — 어느 관측소도 관측하지 않음(항상 미제공)**
 *
 * 순수 데이터 — 렌더링/브라우저 API 없음.
 */

/** 관측 기관 코드 → 기관명 */
export const MMAF_OFFICES: Record<string, string> = {
  '101': '부산청',
  '102': '인천청',
  '103': '여수청',
  '104': '울산청',
  '105': '대산청',
  '106': '평택청',
  '107': '목포청',
  '108': '군산청',
  '109': '마산청',
  '110': '포항청',
  '111': '동해청',
  '112': '제주단',
  '113': '진도소',
};

/** 관측소가 보유한 센서 종류 */
export interface StationSensors {
  /** 풍향 */ wd: boolean;
  /** 풍속 */ ws: boolean;
  /** 기온 */ at: boolean;
  /** 습도 */ hu: boolean;
  /** 기압 */ ap: boolean;
  /** 시정 */ vis: boolean;
  /** 수온 */ wt: boolean;
  /** 염분 */ sal: boolean;
  /** 표면 유향·유속 */ cur: boolean;
  /** 조류 */ tide: boolean;
}

/** 해양기상 관측소 */
export interface MarineStation {
  /** 지점코드 (API mmsi 파라미터) */
  mmsi: string;
  /** 지점명 */
  name: string;
  /** 기관코드 (API mmaf 파라미터) */
  mmaf: string;
  /** 보유 센서 */
  sensors: StationSensors;
}

/** 전국 해양기상 관측소 76개소 */
export const MARINE_STATIONS: MarineStation[] = [
  { mmsi: '1019001', name: '남항동방파제등대', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1019002', name: '부산항신항소형선부두등대', mmaf: '101', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1019003', name: '송정리등표', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1019004', name: '부산항신항다목적부두', mmaf: '101', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401578', name: '오륙도등대', mmaf: '101', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401579', name: '감천항유도등부표(랜비)', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: true, sal: true, cur: true, tide: false } },
  { mmsi: '994401583', name: '신항유도등부표(랜비)', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: true, sal: true, cur: true, tide: false } },
  { mmsi: '994401584', name: '부산항신항중앙C호등부표', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: true, sal: true, cur: true, tide: false } },
  { mmsi: '994401587', name: '나무섬등대', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401588', name: '가덕도등대', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401594', name: '남형제도등표', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401597', name: '부산항유도등부표(랜비)', mmaf: '101', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: true, sal: true, cur: true, tide: false } },
  { mmsi: '0010', name: '인천갑문조류신호표지', mmaf: '102', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: false, wt: false, sal: false, cur: false, tide: true } },
  { mmsi: '0020', name: '부도수도조류신호표지', mmaf: '102', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: false, wt: false, sal: false, cur: false, tide: true } },
  { mmsi: '1021000', name: '인천항동수도12호등부표', mmaf: '102', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: false, wt: true, sal: false, cur: true, tide: false } },
  { mmsi: '1021013', name: '팔미도등대', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1021014', name: '부도등대', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1021018', name: '인천항석탄부두A호등대', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1021024', name: '민어여등표', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1021040', name: '인천항항로분기등부표', mmaf: '102', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: false, wt: true, sal: false, cur: true, tide: false } },
  { mmsi: '1029001', name: '백령도 용기포항여객터미널', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401001', name: '인천항서수도5호등부표', mmaf: '102', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: false, wt: true, sal: false, cur: true, tide: false } },
  { mmsi: '994401015', name: '선미도등대', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401020', name: '소연평도등대', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401021', name: '서포리남방등표', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401022', name: '북장자서등표', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401023', name: '초치암등표', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401039', name: '고식이등표', mmaf: '102', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1030262', name: '여초등표', mmaf: '103', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1030384', name: '여수해만중앙A호유도등부표', mmaf: '103', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: true, sal: false, cur: true, tide: false } },
  { mmsi: '994402917', name: '광양항등표', mmaf: '103', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994402925', name: '중결도등대', mmaf: '103', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1041519', name: '울산항동방파제서단등대', mmaf: '104', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1051101', name: '외연도항동방파제등대', mmaf: '105', sensors: { wd: true, ws: true, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '4402675', name: '소녀암등표', mmaf: '105', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '4402692', name: '신도타서등표', mmaf: '105', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '4422880', name: '대산항제2항로제3호등부표', mmaf: '105', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: true, sal: false, cur: true, tide: false } },
  { mmsi: '994401037', name: '무당서등표', mmaf: '106', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401042', name: '입파도등대', mmaf: '106', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1079001', name: '안좌여객선터미널', mmaf: '107', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1079002', name: '홍도등대', mmaf: '107', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1079003', name: '가거도등대', mmaf: '107', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1079004', name: '계마항방파제등대', mmaf: '107', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1079005', name: '매물도등대', mmaf: '107', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1079006', name: '우세도등대', mmaf: '107', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1079007', name: '대노록도등대', mmaf: '107', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1079008', name: '외달도등표', mmaf: '107', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1085555', name: '상왕등도등대', mmaf: '108', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1086109', name: '군산항남방파제등대', mmaf: '108', sensors: { wd: true, ws: true, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1089651', name: '십이동파도등대', mmaf: '108', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '4406116', name: '역경등대', mmaf: '108', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '4406120', name: '비응항서방파제남단등대', mmaf: '108', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403650', name: '가진서등대', mmaf: '108', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403652', name: '군산연도등대', mmaf: '108', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403658', name: '흑서등표', mmaf: '108', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403661', name: '군산흑도등표', mmaf: '108', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1091045', name: '견내량등표', mmaf: '109', sensors: { wd: false, ws: false, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1095079', name: '흑암등표', mmaf: '109', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401606', name: '고암등대', mmaf: '109', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994401623', name: '고도등표', mmaf: '109', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1103579', name: '영일만항분리항로등부표(랜비)', mmaf: '110', sensors: { wd: true, ws: true, at: true, hu: true, ap: false, vis: false, wt: true, sal: false, cur: true, tide: false } },
  { mmsi: '994403582', name: '도동등대', mmaf: '110', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1119808', name: '동해항남방파제등대', mmaf: '111', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403800', name: '묵호등대', mmaf: '111', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403807', name: '임원항방파제등대', mmaf: '111', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403810', name: '주문진항동방파제등대', mmaf: '111', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: true, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403894', name: '김녕항서방파제등대', mmaf: '112', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403895', name: '방서등대', mmaf: '112', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403896', name: '개민포등대', mmaf: '112', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '994403901', name: '중뢰등표', mmaf: '112', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1139001', name: '하조도등대', mmaf: '113', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1139002', name: '어룡도등대', mmaf: '113', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1139006', name: '횡간도등대', mmaf: '113', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: false, sal: false, cur: false, tide: false } },
  { mmsi: '1139007', name: '완도항 유도등부표', mmaf: '113', sensors: { wd: true, ws: true, at: true, hu: true, ap: true, vis: false, wt: true, sal: false, cur: true, tide: false } },
  { mmsi: 'JJ', name: '장죽수도조류신호표지', mmaf: '113', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: false, wt: false, sal: false, cur: false, tide: true } },
  { mmsi: 'MR', name: '명량수도조류신호표지', mmaf: '113', sensors: { wd: false, ws: false, at: false, hu: false, ap: false, vis: false, wt: false, sal: false, cur: false, tide: true } },
];

/** 기관코드로 관측소 조회 */
export function getStationsByOffice(mmaf: string): MarineStation[] {
  return MARINE_STATIONS.filter((s) => s.mmaf === mmaf);
}

/** 지점코드로 관측소 조회 */
export function getStation(mmsi: string): MarineStation | undefined {
  return MARINE_STATIONS.find((s) => s.mmsi === mmsi);
}

/** 특정 센서를 보유한 관측소만 (예: 수온 관측소 11개소) */
export function getStationsWithSensor(sensor: keyof StationSensors): MarineStation[] {
  return MARINE_STATIONS.filter((s) => s.sensors[sensor]);
}
