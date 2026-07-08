/**
 * @file HydroDynamicsEngine.ts
 * @description 2D 격자 기반 수심 및 조류 (수중 역학) 시뮬레이션 엔진
 */

import type { HydroGrid, TileWaterState, WaterType } from '../types/Hydrodynamics.js';

/**
 * 특정 낚시터 스팟과 물때 상태에 기반한 수중 격자 맵(128x96)을 동적으로 생성합니다.
 * 포항 영일만 지형의 특징(반폐쇄성 홈통, 외만 본류대, 테트라포드 반탄류)을 모사합니다.
 * 
 * @param spotId          - 낚시터 고유 ID
 * @param tidePhase       - 현재 물때 (1~15)
 * @param currentStrength - 조류의 세기 가중치 (0.0 ~ 1.0)
 */
export function generateHydroGrid(
  _spotId: string,
  tidePhase: number,
  currentStrength: number
): HydroGrid {
  const width = 128;
  const height = 96;
  const cells: TileWaterState[][] = [];

  // 기본 조류 흐름 세기 (물때 강도 비례)
  const baseSpeed = currentStrength * 1.8; // m/s 단위 근사

  // 들물/날물 방향 결정 (물때 1~7물: 들물=만 내부로 흐름, 8~15물: 날물=외해로 흐름)
  const isIncomingTide = tidePhase <= 7;
  const flowDirX = isIncomingTide ? 1.0 : -1.0;
  const flowDirY = isIncomingTide ? 0.3 : -0.3;

  for (let y = 0; y < height; y++) {
    const row: TileWaterState[] = [];
    for (let x = 0; x < width; x++) {
      // ─────────────────────────────────────────────────────────
      // 1. 지형 정의 (육지 및 구조물 경계 설정)
      // ─────────────────────────────────────────────────────────
      // 포항 영일만 모사 격자 구조:
      // - 좌측 하단 (x < 28 && y > 55): 포항 신항/송도 방면 육지
      // - 하단 전체 (y > 80): 해안선 육지
      // - 중앙 수직 구조 (x === 60 && y > 30 && y < 75): 신항 방파제 스펙
      const isLand = (x < 28 && y > 55) || (y > 80) || (x >= 58 && x <= 62 && y >= 35 && y <= 70);

      if (isLand) {
        // 육지나 구조물 내부 타일은 수심 0, 조류 0
        row.push({
          depth: 0,
          currentVector: { x: 0, y: 0 },
          waterType: 'MAIN',
          bottomType: 'sand',
        });
        continue;
      }

      // ─────────────────────────────────────────────────────────
      // 2. 수심(Depth) 연산
      // ─────────────────────────────────────────────────────────
      // 외만인 우상단(x -> 128, y -> 0)으로 갈수록 수심이 선형적으로 증가 (최대 32m)
      const distFromLand = Math.min(
        y, 
        80 - y,
        x < 28 ? y - 55 : 999,
        x >= 58 && x <= 62 ? Math.abs(y - 35) : 999
      );
      
      let depth = 3.0 + (1.0 - y / height) * 18.0 + (x / width) * 12.0;
      // 육지 경계 근처는 경사면 수심 급하강 연산
      if (distFromLand < 12) {
        depth = Math.max(1.5, depth * (distFromLand / 12));
      }
      depth = Math.round(depth * 10) / 10; // 소수점 첫째자리까지

      // ─────────────────────────────────────────────────────────
      // 3. 바닥 지형(Bottom Type) 설정
      // ─────────────────────────────────────────────────────────
      let bottomType: 'gravel' | 'reef' | 'sand' | 'mud' = 'sand';
      if (depth > 22) {
        bottomType = 'mud'; // 깊은 뻘밭
      } else if (distFromLand < 8) {
        bottomType = 'reef'; // 테트라포드/갯바위 주변 여밭
      } else if (distFromLand >= 8 && distFromLand < 22) {
        bottomType = 'gravel'; // 자갈/조가비 바닥
      }

      // ─────────────────────────────────────────────────────────
      // 4. 조류 및 반탄류/와류 역학 연산 (20칸 = 20m 규칙 적용)
      // ─────────────────────────────────────────────────────────
      let waterType: WaterType = 'MAIN';
      let vx = baseSpeed * flowDirX;
      let vy = baseSpeed * flowDirY;

      // 육지 경계(distFromLand)로부터의 거리를 기준으로 분기
      if (distFromLand <= 20) {
        // 20칸 이하: 지형 장애물 마찰 영역
        if (x > 50 && x < 70 && y > 30 && y < 75) {
          // 방파제 내항/외항 마찰 효과
          // 외항(우측)은 부딪혀서 위로 꺾이는 와류 발생
          waterType = 'EDDY';
          vx = -baseSpeed * flowDirX * 0.4;
          vy = baseSpeed * 0.6;
        } else if (y > 70) {
          // 남쪽 얕은 내만: 본류가 들어온 후 돌아 나가는 반탄류 형성
          waterType = 'COUNTER';
          vx = -baseSpeed * flowDirX * 0.6; // 역방향 60% 속도
          vy = -baseSpeed * flowDirY * 0.3;
        } else {
          // 일반적인 해안 와류
          waterType = 'EDDY';
          vx = baseSpeed * flowDirX * 0.3;
          vy = -baseSpeed * flowDirY * 0.5; // 와류 회전
        }
      }

      // ─────────────────────────────────────────────────────────
      // 5. 조경지대(CONVERGENCE) 판정
      // ─────────────────────────────────────────────────────────
      // 예: 본대조류의 흐름과 방파제 회전류가 서로 강하게 마주치는 경계 타일 영역
      // x좌표 68~78 라인 부근에서 본대조류와 반탄류가 교차하게 연출
      const isNearBarrierEdge = y >= 32 && y <= 48 && x >= 65 && x <= 78;
      if (isNearBarrierEdge && waterType !== 'EDDY') {
        waterType = 'CONVERGENCE';
        vx = vx * 0.2; // 에너지가 충돌하여 조류 속도가 급감함
        vy = vy * 0.2;
      }

      row.push({
        depth,
        currentVector: { x: vx, y: vy },
        waterType,
        bottomType,
      });
    }
    cells.push(row);
  }

  return {
    width,
    height,
    cells,
  };
}

/**
 * 월드 픽셀 좌표(0~2048, 0~1536)를 격자 좌표(0~128, 0~96)로 매핑하여 해당 지점의 수중 역학 상태를 조회합니다.
 * 
 * @param grid - 수중 격자 객체
 * @param worldX - 월드 X 픽셀 좌표 (0 ~ 2048)
 * @param worldY - 월드 Y 픽셀 좌표 (0 ~ 1536)
 */
export function getWaterStateAt(
  grid: HydroGrid,
  worldX: number,
  worldY: number
): TileWaterState {
  const tileSize = 16;
  const tileX = Math.max(0, Math.min(grid.width - 1, Math.floor(worldX / tileSize)));
  const tileY = Math.max(0, Math.min(grid.height - 1, Math.floor(worldY / tileSize)));

  const cell = grid.cells[tileY]?.[tileX];
  if (!cell) {
    // 맵 범위를 벗어날 시 기본 심해 상태 반환
    return {
      depth: 25.0,
      currentVector: { x: 0.1, y: 0.05 },
      waterType: 'MAIN',
      bottomType: 'mud',
    };
  }
  return cell;
}
