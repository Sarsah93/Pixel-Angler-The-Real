/**
 * @file Hydrodynamics.ts
 * @description 수중 역학 및 채비 물리 연산에 사용되는 격자 맵 및 물리 타입 정의
 */

export type WaterType = 'MAIN' | 'COUNTER' | 'EDDY' | 'CONVERGENCE';

export interface TileWaterState {
  /** 수중 타일의 수심 (m) */
  depth: number;
  /** 조류의 속도 및 방향 벡터 (x: 동서류, y: 남북류) */
  currentVector: { x: number; y: number };
  /** 물 종류: 본류(MAIN), 반탄류(COUNTER), 와류(EDDY), 조경지대(CONVERGENCE) */
  waterType: WaterType;
  /** 바닥 지형 종류: 자갈(gravel), 여/암반(reef), 모래(sand), 진흙(mud) */
  bottomType: 'gravel' | 'reef' | 'sand' | 'mud';
}

export interface HydroGrid {
  /** 격자의 가로 크기 (타일 수) */
  width: number;
  /** 격자의 세로 크기 (타일 수) */
  height: number;
  /** 2D 타일 상태 배열 [y][x] */
  cells: TileWaterState[][];
}

export interface FightIncident {
  /** 밑걸림 발생 확률 (0.0 ~ 1.0) */
  snagChance: number;
  /** 대상어의 바늘털이(공중 도약) 확률 (0.0 ~ 1.0) */
  hookShakeChance: number;
  /** 여 쓸림 위험 지수 (0.0 ~ 1.0) */
  reefFriction: number;
}
