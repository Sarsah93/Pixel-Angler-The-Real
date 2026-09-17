/**
 * @file Multiplayer.ts
 * @description 싱글/멀티 플레이 공통 규격 (143차 신설)
 *
 * 멀티는 **호스트가 세션을 열고 같은 세션에 모인 사람들이 한 세계를 공유**하는 구조다.
 * 세션이 곧 서버 한 칸이므로 **캐릭터 이름은 세션 안에서 유일**해야 한다.
 *
 * 이 파일은 클라이언트(`@tra/client-pc`)와 서버(`@tra/server`)가 **같이 읽는 계약**이다.
 * 전송 수단(HTTP·소켓)은 여기서 정하지 않는다 — 주고받는 모양만 정의한다.
 */

import type { CharConfig } from '../art/CharacterArt.js';

/** 플레이 방식 */
export type GameMode = 'single' | 'multi';

/** 세션 코드 길이 — 사람이 불러주기 좋은 6자리 */
export const SESSION_CODE_LEN = 6;
/** 세션 코드 문자 집합 — 0/O, 1/I 처럼 헷갈리는 글자는 뺀다 */
export const SESSION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 기본 서버 주소 (로컬 호스트) */
export const MP_DEFAULT_SERVER = 'http://localhost:4000';

/** 자리 비움 판정 — 이 시간 동안 소식이 없으면 접속이 끊긴 것으로 본다 */
export const MP_PRESENCE_TIMEOUT_MS = 30_000;
/** 위치를 알리는 주기 */
export const MP_PRESENCE_INTERVAL_MS = 1_000;

/** 캐릭터 이름 길이 제한 — 캐릭터 만들기 입력과 같은 값 */
export const CHAR_NAME_MAX = 8;

/** 이름 중복 판정용 정규화 키 — 앞뒤 공백·중복 공백·대소문자 차이는 같은 이름으로 본다 */
export function characterNameKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export interface NameValidation {
  ok: boolean;
  /** 화면에 그대로 띄울 한국어 사유 (ok=false일 때만) */
  reasonKo?: string;
}

/** 형식 검사 — 중복 검사와 별개(서버가 알 필요 없는 것) */
export function validateCharacterName(name: string): NameValidation {
  const t = name.trim();
  if (t.length === 0) return { ok: false, reasonKo: '이름을 입력하세요.' };
  if (t.length > CHAR_NAME_MAX) return { ok: false, reasonKo: `이름은 ${CHAR_NAME_MAX}자까지 쓸 수 있습니다.` };
  if (/[^\p{L}\p{N} ]/u.test(t)) return { ok: false, reasonKo: '이름에는 글자와 숫자만 쓸 수 있습니다.' };
  return { ok: true };
}

// ═══════════════════════════════════════════════════════
// 주고받는 모양
// ═══════════════════════════════════════════════════════

/** 세션에 들어와 있는 한 사람 (다른 사람에게 보이는 몫) */
export interface MpPeer {
  playerId: string;
  name: string;
  /** 지금 있는 지역 id — 같은 지역일 때만 화면에 보인다 */
  regionId: string;
  x: number;
  y: number;
  /** 바라보는 방향 — 스프라이트 프레임 선택용 */
  facing: 'down' | 'up' | 'left' | 'right';
  moving: boolean;
  /**
   * 캐릭터 외형 (145차). 입장할 때 한 번 올리고 서버가 들고 있다가 그대로 되돌려 준다 —
   * 구 구현은 `characterOf('mp_' + playerId)`로 id에서 얼굴을 지어냈다(본인이 만든 얼굴과 무관).
   */
  look?: CharConfig;
  /** 지금 무엇을 하는가 (145차) — 없으면 필드로 본다 */
  activity?: MpActivity;
}

export interface MpCreateSessionRes {
  ok: boolean;
  code?: string;
  reasonKo?: string;
}

export interface MpSessionInfoRes {
  ok: boolean;
  code?: string;
  /** 지금 들어와 있는 사람 수 */
  playerCount?: number;
  /** 이미 쓰이고 있는 이름들 — 슬롯 화면에서 미리 보여줄 수 있다 */
  names?: string[];
  reasonKo?: string;
}

/** 이름 중복 검사 결과 */
export interface MpNameCheckRes {
  ok: boolean;
  /** true면 이미 쓰이는 이름 */
  duplicate?: boolean;
  reasonKo?: string;
}

export interface MpJoinRes {
  ok: boolean;
  playerId?: string;
  duplicate?: boolean;
  /** 세션 공용 시드 (145차) — 보일링·날씨 같은 주변 무작위의 기준점 */
  seed?: number;
  /** 이전에 있던 자리 — 이어하기로 들어온 경우에만 (145차) */
  resume?: MpResume;
  reasonKo?: string;
}

export interface MpPresenceRes {
  ok: boolean;
  /** 나를 뺀 나머지 — 지역이 같은 사람만 걸러 쓰는 것은 클라이언트 몫 */
  peers?: MpPeer[];
  /** 지금 세션에 깔려 있는 통발 전부 (145차 — 내 것 포함. 클라이언트가 내 것을 걸러 그린다) */
  traps?: MpPlacedTrap[];
  /** 내가 마지막으로 받은 줄 이후의 채팅 (145차) */
  chat?: MpChatLine[];
  reasonKo?: string;
}

/** 캐릭터 만들기 진행 단계 — 화면에 그대로 띄우는 문구 (사용자 지정) */
export const MP_PROGRESS_KO = {
  checking: '중복 여부 확인중',
  passed: '중복 여부 통과',
  creating: '생성 중 로딩',
  connecting: '접속중',
  duplicate: '캐릭터 이름이 중복되어 생성할 수 없습니다! 이름을 변경하세요.',
} as const;

// ═══════════════════════════════════════════════════════
// 세션 세계 (145차) — 함께 겪는 것만 서버가 들고 있는다
// ═══════════════════════════════════════════════════════

/**
 * 세션이 공유하는 것은 **주변 세계**뿐이다 — 설치물과 무작위의 기준점.
 * 퀘스트·우호도·인벤·어획은 각자의 저장 슬롯에 남는다(143차 결정, 145차에도 유지).
 *
 * ⚠ 이 경계를 옮기려면 먼저 §퀘스트 게이트 규칙을 읽을 것.
 */
export interface MpWorldState {
  /** 세션 공용 난수 시드 — 세션이 살아 있는 동안 바뀌지 않는다 */
  seed: number;
  /** 지금 물에 잠겨 있는 통발 (누가 놓았든 전부) */
  traps: MpPlacedTrap[];
}

/**
 * 남에게 보이는 통발 한 틀.
 * 안에 무엇이 들었는지는 **보내지 않는다** — 포획물은 놓은 사람의 것이고,
 * 수거 판정(분실 롤·내구도·조례 적발)도 그 사람 클라이언트에서만 돈다.
 */
export interface MpPlacedTrap {
  instanceId: string;
  /** 놓은 사람 — 남의 통발은 볼 수만 있고 건드릴 수 없다 */
  ownerId: string;
  ownerName: string;
  /** 어느 맵인가 (`regionId:mapId`) */
  mapKey: string;
  tileX: number;
  tileY: number;
  trapSpecId: string;
  deployedAtMs: number;
}

/** 지금 무엇을 하고 있는가 — 이름표 옆 아이콘 + 밀어내기 대상 판정에 쓴다 */
export type MpActivity = 'field' | 'fishing' | 'shop' | 'indoor' | 'menu';

/** 활동 표시 문구 (툴팁·로그용 — 화면 아이콘은 클라이언트가 고른다) */
export const MP_ACTIVITY_KO: Record<MpActivity, string> = {
  field: '이동 중',
  fishing: '낚시 중',
  shop: '거래 중',
  indoor: '실내',
  menu: '자리 비움',
};

/** 필드에서 실제로 걸어다니는 상태인가 — 아니면 마지막 자리에 서 있는 껍데기다 */
export function isFieldActive(a: MpActivity | undefined): boolean {
  return (a ?? 'field') === 'field';
}

// ── 공용 시드 ────────────────────────────────────────

/**
 * 공용 시드를 써도 되는 무작위의 **닫힌 목록**.
 *
 * ⚠ **퀘스트 게이트 규칙** (2026-09-17 사용자 지시):
 * 진행도가 조건에 끼어드는 무작위는 여기에 넣지 않는다. 퀘스트 단계로만 열리는 자원·이벤트를
 * 공용 시드로 돌리면 ① 아직 그 단계가 아닌 사람 화면에도 뜨고 ② 같은 단계라도 완료 시점이 달라
 * 한 사람이 먼저 가져가면 다른 사람의 목표가 사라진다. 그런 것은 **각자 로컬 난수**로 둔다.
 *
 * 새 종류를 늘리려면 이 유니온에 손을 대야 한다 — 그 자체가 "퀘스트가 걸리는가"를 한 번 묻는 관문이다.
 */
export type MpSharedRngKind =
  | 'field_event'   // 보일링·스쿨링 (피딩 활성도만 본다 — 퀘스트 무관)
  | 'nuisance'      // 과증식 해양생물 배치·표류 (계절만 본다)
  | 'traffic'       // 주행 차량 (순수 배경)
  | 'weather';      // 홈타운 랜덤 날씨 (실데이터 없는 지역)

export const MP_SHARED_RNG_KINDS: readonly MpSharedRngKind[] =
  ['field_event', 'nuisance', 'traffic', 'weather'];

/**
 * 공용 시드 유도 — `세션 시드 × 종류 × 키(맵 등) × 시간 슬롯`.
 * 같은 세션·같은 슬롯이면 누가 계산해도 같은 수가 나온다(서버 왕복 없음).
 * 싱글이면 `sessionSeed = 0`을 넣는다 — 그래도 맵·시간으로 결정적이다.
 */
export function mpWorldSeed(
  sessionSeed: number, kind: MpSharedRngKind, key: string, slot: number,
): number {
  let h = 2166136261 >>> 0;
  const s = `${kind}:${key}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= Math.imul(sessionSeed >>> 0, 2654435761);
  h ^= Math.imul(slot | 0, 40503);
  return h >>> 0;
}

/** 시간 슬롯 번호 — 슬롯이 같으면 같은 결과가 유지된다(슬롯이 넘어가야 갈린다) */
export function mpTimeSlot(epochMs: number, slotLenMs: number): number {
  return Math.floor(epochMs / Math.max(1, slotLenMs));
}

/** 시드 하나로 도는 결정적 난수기 (mulberry32) */
export function mpRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 채팅 ─────────────────────────────────────────────

/** 지역 채널 한 줄 — 서버는 최근 것만 들고 있다 */
export interface MpChatLine {
  seq: number;
  playerId: string;
  name: string;
  text: string;
  atMs: number;
}

/** 서버가 보관하는 최근 줄 수 */
export const MP_CHAT_KEEP = 60;
/** 한 줄 길이 상한 */
export const MP_CHAT_MAX_LEN = 120;

// ── 이어하기 ─────────────────────────────────────────

/**
 * 재접속 열쇠. 세션은 **이름이 아니라 이 id로** 사람을 알아본다 —
 * 게임을 껐다 켜도 같은 id로 들어오면 서버가 마지막 자리와 이름을 돌려준다.
 * 캐릭터 저장 슬롯에서 만들어 보관한다(클라이언트가 소유).
 */
export interface MpIdentity {
  userId: string;
  name: string;
}

/** 세션 저장본 한 사람 몫 — 서버가 디스크에 남기는 것 */
export interface MpSavedPlayer {
  userId: string;
  name: string;
  nameKey: string;
  regionId: string;
  x: number;
  y: number;
  lastSeenMs: number;
}

/** 세션 저장본 — 호스트 PC(또는 전용 서버)에 남는 "세계 파일" */
export interface MpSavedSession {
  code: string;
  seed: number;
  createdMs: number;
  savedMs: number;
  players: MpSavedPlayer[];
  traps: MpPlacedTrap[];
}

/** 이어하기 결과 — 서버가 이전 자리를 알고 있으면 돌려준다 */
export interface MpResume {
  regionId: string;
  x: number;
  y: number;
}
