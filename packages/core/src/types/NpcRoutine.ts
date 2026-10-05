/**
 * @file NpcRoutine.ts
 * @description 인물 일과 타입 (214차 — NPC 일과 · 사용자 지시 「24시간 밖에 있는 npc도 있고, 그렇지 않은 npc도」).
 *
 * 세계 시계는 실시간(KST)이다. 인물은 그 시계를 따라 **일터(post)** 와 **집(home)** 을 오간다.
 * ⚠ R12 — 이야기 목표는 시각에 묶이지 않는다. 집에 있는 인물도 **문을 두드리면** 같은 대화를 할 수 있다.
 *   일과는 「어디서 만나는가」만 바꾸고 「만날 수 있는가」는 바꾸지 않는다.
 */

/** 일과 갈래 — 같은 갈래는 같은 시간표를 쓴다 */
export type NpcRoutineKind =
  /** 새벽 장 — 위판 · 좌판 상인 (03~19시) */
  | 'market'
  /** 사무 — 어촌계 · 관공서 (08~18시, 일요일 쉼) */
  | 'office'
  /** 낚시꾼 — 동트기 전부터 밤까지 (05~22시) */
  | 'angler'
  /** 낮 낚시 — 해 있을 때만 (06~18시) */
  | 'day_angler'
  /** 공방 · 손일 (07~17시) */
  | 'craft'
  /** 아이 · 학생 — 할아버지 공방 곁 (08~19시) */
  | 'kid'
  /** 구경 · 여행 (09~21시) */
  | 'visitor'
  /** 24시간 — 떠돌이 · 감시원 교대 · 밤낚시꾼 */
  | 'always';

/** 일터에 나와 있는 시간 한 토막 — [fromMin, toMin) KST 분(0~1440). toMin < fromMin이면 자정을 넘긴다 */
export interface NpcShift {
  fromMin: number;
  toMin: number;
}

export interface NpcRoutineDef {
  kind: NpcRoutineKind;
  shifts: NpcShift[];
  /** 쉬는 요일(0 = 일요일) — 그날은 하루 종일 집 */
  offDays?: number[];
}

/** 지금 어디 있나 */
export type NpcWhere = 'post' | 'home';

/**
 * 집에 있는 까닭 — 문 두드렸을 때 첫마디가 달라진다.
 *  sleep = 잘 시간(22~05시) · rest = 일 끝나고 쉬는 중 · dayoff = 쉬는 날
 */
export type NpcHomeReason = 'sleep' | 'rest' | 'dayoff';

export interface NpcWhereabouts {
  where: NpcWhere;
  reason?: NpcHomeReason;
  /** 지금 상태가 바뀌는 다음 시각까지 남은 분 — 24시간형은 Infinity */
  minutesLeft: number;
}
