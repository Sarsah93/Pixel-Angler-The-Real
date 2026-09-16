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
  reasonKo?: string;
}

export interface MpPresenceRes {
  ok: boolean;
  /** 나를 뺀 나머지 — 지역이 같은 사람만 걸러 쓰는 것은 클라이언트 몫 */
  peers?: MpPeer[];
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
