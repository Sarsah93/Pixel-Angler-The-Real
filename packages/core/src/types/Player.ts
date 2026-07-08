/**
 * @file Player.ts
 * @description 플레이어 상태 타입 정의
 *
 * 멀티플레이 대비: 이 타입이 WebSocket을 통해 다른 플레이어에게
 * 그대로 전송되는 구조체입니다. 렌더링 무관한 순수 데이터만 포함합니다.
 */

import type { TackleSetup } from './Gear.js';

// ─────────────────────────────────────────────
// 플레이어 행동 상태
// 멀티플레이 동기화 시 이 값으로 상대방 도트 애니메이션 결정
// ─────────────────────────────────────────────
export type PlayerStatus =
  | 'idle'           // 멈춰 있음
  | 'walking'        // 이동 중
  | 'casting'        // 캐스팅 중 (낚싯대 던지는 모션)
  | 'waiting_bite'   // 찌 흘리는 중 (대기)
  | 'fighting'       // 히트 후 대물 파이팅 중
  | 'landing'        // 뜰채 사용 단계
  | 'packing'        // 채비 정리 중
  | 'menu';          // 메뉴/UI 조작 중

export type FacingDirection = 'up' | 'down' | 'left' | 'right';

// ─────────────────────────────────────────────
// 플레이어 위치
// ─────────────────────────────────────────────
export interface PlayerPosition {
  x: number;
  y: number;
  sceneKey: string;  // 어느 씬에 있는지 ('FieldScene_geoje_breakwater' 등)
}

// ─────────────────────────────────────────────
// 잡은 물고기 기록 (조과첩 항목)
// ─────────────────────────────────────────────
export interface CaughtFishRecord {
  id: string;
  fishSpeciesId: string;       // FishDatabase의 어종 ID
  lengthCm: number;
  weightGram: number;
  caughtAt: Date;
  locationId: string;          // SpotDatabase의 낚시터 ID
  tackleUsed: TackleSetup;
  tidePhase: number;           // 물때 (1~15)
  waterTempC: number;
  isBestRecord: boolean;       // 최대어 여부
  baitUsed: string;
}

// ─────────────────────────────────────────────
// 인벤토리
// ─────────────────────────────────────────────
export interface Inventory {
  /** 낚싯대 보유 목록 (ID 리스트) */
  rodIds: string[];
  /** 릴 보유 목록 */
  reelIds: string[];
  /** 소모품 미끼/채비 재료 */
  consumables: ConsumableItem[];
  /** 현재 보관 중인 물고기 (회 못 뜬 것들) */
  livewell: CaughtFishRecord[];
  /** 인게임 재화 (앵글러 코인) */
  coins: number;
}

export interface ConsumableItem {
  itemId: string;
  name: string;
  quantity: number;
  category: 'bait' | 'tackle' | 'food' | 'ingredient';
}

// ─────────────────────────────────────────────
// 플레이어 전체 상태 (세이브 파일의 핵심 구조체)
// ─────────────────────────────────────────────
export interface PlayerState {
  /** 고유 ID (싱글: 로컬 UUID, 멀티: 서버 발급) */
  id: string;
  nickname: string;
  /** 플레이어 도트 캐릭터 스킨 ID */
  characterSkinId: string;

  position: PlayerPosition;
  facing: FacingDirection;
  status: PlayerStatus;

  /** 현재 장착된 채비 (null = 채비 미장착) */
  currentTackle: TackleSetup | null;

  inventory: Inventory;
  caughtFishHistory: CaughtFishRecord[];

  /** 최대어 기록 맵 (어종ID → 최대 cm) */
  personalRecords: Record<string, number>;

  /** 총 출조 횟수 */
  totalTrips: number;
  /** 누적 플레이 시간 (분) */
  totalPlayMinutes: number;
  /** 등록 날짜 */
  createdAt: Date;
  /** 마지막 저장 날짜 */
  lastSavedAt: Date;

  // ─── STATUS 관련 지표 ───
  /** 체력 (Stamina: 0 ~ 100) */
  stamina: number;
  /** 피로도 (Fatigue: 0 ~ 100) */
  fatigue: number;
  /** 활성화된 퀵슬롯 인덱스 (0 ~ 7) */
  activeQuickslotIndex: number;
}

// ─────────────────────────────────────────────
// 멀티플레이 전용: 네트워크로 전송되는 경량 상태
// 전체 PlayerState가 아닌 이 타입만 동기화
// ─────────────────────────────────────────────
export interface RemotePlayerSnapshot {
  id: string;
  nickname: string;
  characterSkinId: string;
  position: PlayerPosition;
  facing: FacingDirection;
  status: PlayerStatus;
}
