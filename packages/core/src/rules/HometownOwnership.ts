/**
 * @file HometownOwnership.ts
 * @description 305차 — 홈타운은 사람마다 한 벌 · 그 안의 것은 주인 것 · 방문은 나중(사용자 결정 2026-11-06).
 *
 * 세 가지를 정한다:
 *  1. **세션 키 범위** — 세션에 알리는 홈타운 지역 · 맵 · 공유 소비 키에 주인 꼬리표(`hometown@<집 id>`)를 붙인다.
 *     홈타운은 모두 같은 지역 키(`hometown`) 하나를 써서, 친구가 제 집 마당에 서 있으면 내 마당에도 서 있는 것처럼 보였고
 *     (231차 감사 「남의 울타리를 뚫고 선다」) 마당에 놓은 화구 · 거치대 · 통발이 남의 홈타운에도 보이며 같은 칸 설치를 막았다.
 *     날씨 카드(`w:`)는 그대로 둔다 — 같은 마을 하늘이다.
 *  2. **소유 판정** — 주인은 무엇이든 · 방문자는 보기 · 말 · 거래 · 선물만(`HOMETOWN_VISITOR_ACTIONS`).
 *  3. **머무는 집 정하기** — 남의 집은 세션에 접속해 있고 · 주인이 지금 세션에 있고 · 방문이 허락된 때만. 아니면 내 집으로 돌린다.
 *     방문 신청 · 허락은 아직 없다 — 지금은 허락 판정이 늘 거짓이라 언제나 내 집이다(dev 훅만 남의 집을 흉내 낸다).
 *
 * 순수 TS — 렌더 · 브라우저 API 없음.
 */

import type { HomeId, HometownAction, HometownFallback, HometownStay } from '../types/Multiplayer.js';

/** 홈타운 지역 id (맵 그래프 · 장면 전환 · 세이브가 쓰는 이름 — 세션에만 꼬리표가 붙는다) */
export const HOMETOWN_REGION_ID = 'hometown';
/** 꼬리표 구분 글자 — 지역 id · 맵 id에는 쓰지 않는 글자 */
const SCOPE_SEP = '@';
/** 집 id 모양 — `h` + 소문자 · 숫자 10~24자(서버 지역 키 64자 · 소비 키 96자 안에 넉넉히 든다) */
const HOME_ID_RE = /^h[0-9a-z]{10,24}$/;

/** 새 집 id — 새 캐릭터 · 옛 세이브 백필. 시각 + 난수(추측할 까닭이 없는 공개 값이라 암호 난수까지는 쓰지 않는다) */
export function newHomeId(rand: () => number = Math.random, nowMs: number = Date.now()): HomeId {
  let r = '';
  while (r.length < 8) r += Math.floor(rand() * 36).toString(36);
  return `h${Math.max(0, Math.floor(nowMs)).toString(36)}${r.slice(0, 8)}`;
}

/** 집 id 모양인가 */
export function isHomeId(v: unknown): v is HomeId {
  return typeof v === 'string' && HOME_ID_RE.test(v);
}

/** 홈타운 지역인가(꼬리표가 붙은 세션 키도 참) */
export function isHometownRegion(regionId: string): boolean {
  return regionId === HOMETOWN_REGION_ID || regionId.startsWith(HOMETOWN_REGION_ID + SCOPE_SEP);
}

// ═══════════════════════════════════════════════════
// 1. 세션 키 범위
// ═══════════════════════════════════════════════════

/** 세션에 알리는 지역 키 — 홈타운만 `hometown@<집 id>`. 집 id가 없으면(모양이 틀리면) 그대로 */
export function mpScopedRegionId(regionId: string, homeId: string): string {
  return regionId === HOMETOWN_REGION_ID && isHomeId(homeId) ? `${HOMETOWN_REGION_ID}${SCOPE_SEP}${homeId}` : regionId;
}

/** 세션 지역 키 풀기 — `hometown@h…` → `{ regionId: 'hometown', homeId }`. 꼬리표 없는 키는 그대로 */
export function mpUnscopeRegionId(scoped: string): { regionId: string; homeId?: HomeId } {
  const pre = HOMETOWN_REGION_ID + SCOPE_SEP;
  if (scoped.startsWith(pre)) {
    const homeId = scoped.slice(pre.length);
    return isHomeId(homeId) ? { regionId: HOMETOWN_REGION_ID, homeId } : { regionId: HOMETOWN_REGION_ID };
  }
  return { regionId: scoped };
}

/**
 * 세션에 알리는 맵 키 — 홈타운 맵(`hometown:<맵 id>` · 맨 `hometown`)만 `hometown@<집 id>:<맵 id>`.
 * 이미 꼬리표가 붙었거나 다른 지역이면 그대로(두 번 붙지 않는다).
 */
export function mpScopedMapKey(mapKey: string, homeId: string): string {
  if (!isHomeId(homeId)) return mapKey;
  if (mapKey === HOMETOWN_REGION_ID) return `${HOMETOWN_REGION_ID}${SCOPE_SEP}${homeId}`;
  if (mapKey.startsWith(HOMETOWN_REGION_ID + ':')) return `${HOMETOWN_REGION_ID}${SCOPE_SEP}${homeId}${mapKey.slice(HOMETOWN_REGION_ID.length)}`;
  return mapKey;
}

/**
 * 공유 소비 키 범위 — 키 몸통이 맵 키로 시작하는 채집(`f:`) · 달아나는 생물(`r:`)은 그 맵 키를 범위화한다.
 * 과증식(`n:<시드>|<순번>`)은 키에 맵이 없어 **지금 홈타운에 서 있으면** `n:hometown@<집 id>|…`로 가른다.
 * 날씨 카드(`w:`)는 그대로 — 같은 마을 하늘(홈타운 날씨는 시드 × 슬롯이라 키를 쓰지도 않는다).
 */
export function mpScopedWorldKey(key: string, homeId: string, inHometown: boolean): string {
  if (!isHomeId(homeId)) return key;
  const pre = key.slice(0, 2);
  const body = key.slice(2);
  if (pre === 'f:' || pre === 'r:') return pre + mpScopedMapKey(body.split('|')[0], homeId) + body.slice(body.split('|')[0].length);
  if (pre === 'n:' && inHometown && !body.startsWith(HOMETOWN_REGION_ID + SCOPE_SEP)) {
    return `n:${HOMETOWN_REGION_ID}${SCOPE_SEP}${homeId}|${body}`;
  }
  return key;
}

// ═══════════════════════════════════════════════════
// 2. 소유 판정
// ═══════════════════════════════════════════════════

/** 방문자도 할 수 있는 행동 — 보기 · 말 · 거래 · 선물. 텃밭 · 설치 · 우편함 · 집 안 · 마당 · 채집은 주인만 */
export const HOMETOWN_VISITOR_ACTIONS: ReadonlySet<HometownAction> = new Set<HometownAction>(['look', 'talk', 'trade', 'gift']);

/**
 * 이 홈타운에서 이 행동을 해도 되는가. 주인(같은 집 id) = 전부 · 방문자 = 방문자 행동만.
 * 머무는 집 id가 비었으면(혼자 하기 · 세션 전) 내 집이다.
 */
export function hometownAllows(action: HometownAction, actorHomeId: string, ownerHomeId: string | undefined): boolean {
  if (!ownerHomeId || ownerHomeId === actorHomeId) return true;
  return HOMETOWN_VISITOR_ACTIONS.has(action);
}

/** 막힌 행동의 안내 글(남의 집에서) */
export function hometownBlockReasonKo(action: HometownAction): string {
  switch (action) {
    case 'enterHouse': return '남의 집에는 들어갈 수 없습니다.';
    case 'mailbox': return '남의 집 우편함입니다.';
    case 'farm': return '남의 집 텃밭은 손댈 수 없습니다.';
    case 'place': case 'yard': return '남의 집 마당에는 물건을 놓을 수 없습니다.';
    case 'pickup': return '남의 집 물건은 거둘 수 없습니다.';
    case 'forage': return '남의 집 마당에서는 캘 수 없습니다.';
    default: return '남의 집에서는 할 수 없습니다.';
  }
}

/**
 * 홈타운 데이터 묶음(텃밭 · 집 안 · 우편함 · 마당 설치물)의 주인 — 로컬 세이브의 홈타운은 **언제나 그 세이브 주인의 것**이다.
 * 적힌 주인이 없으면(구세이브) 내 집 id로 채우고, 다르면(세이브를 옮겨 붙인 경우 등) 내 집 id로 다시 적는다.
 */
export function claimHometownOwner(stored: unknown, myHomeId: HomeId): { ownerHomeId: HomeId; restamped: boolean } {
  return { ownerHomeId: myHomeId, restamped: stored !== myHomeId };
}

// ═══════════════════════════════════════════════════
// 3. 머무는 집 정하기
// ═══════════════════════════════════════════════════

/** 머무는 집 판정에 필요한 지금 사정 */
export interface HometownStayContext {
  myHomeId: HomeId;
  /** 세션에 접속해 있는가 */
  connected: boolean;
  /** 그 집 주인이 지금 세션에 있는가(공개 프로필 `homeId`로 본다) */
  ownerOnline: (homeId: HomeId) => boolean;
  /** 그 집에 방문이 허락됐는가 — 방문 신청 · 허락이 생기기 전까지는 늘 거짓 */
  visitAllowed: (homeId: HomeId) => boolean;
}

/**
 * 들어가려는(머무는) 홈타운을 정한다. 내 집은 언제나 된다. 남의 집은 접속 · 주인 있음 · 허락 셋이 모두 참일 때만 —
 * 하나라도 아니면 내 집으로 돌리고 까닭을 돌려준다(장면 전환 · 재접속 자리 · 주인이 나간 뒤 공통).
 */
export function resolveHometownStay(
  want: { ownerHomeId?: string; ownerName?: string } | undefined, ctx: HometownStayContext,
): { stay: HometownStay; fallback?: HometownFallback } {
  const mine: HometownStay = { ownerHomeId: ctx.myHomeId };
  const owner = want?.ownerHomeId;
  if (!owner || owner === ctx.myHomeId) return { stay: mine };
  if (!isHomeId(owner)) return { stay: mine, fallback: 'badId' };
  if (!ctx.connected) return { stay: mine, fallback: 'notConnected' };
  if (!ctx.ownerOnline(owner)) return { stay: mine, fallback: 'ownerAway' };
  if (!ctx.visitAllowed(owner)) return { stay: mine, fallback: 'notAllowed' };
  return { stay: { ownerHomeId: owner, ...(want?.ownerName ? { ownerName: want.ownerName } : {}) } };
}

/** 남의 집에 돌려보낼 때의 안내 글 */
export function hometownFallbackReasonKo(f: HometownFallback): string {
  switch (f) {
    case 'notConnected': return '함께하기 연결이 끊겨 내 집으로 돌아왔습니다.';
    case 'ownerAway': return '집주인이 자리를 비워 내 집으로 돌아왔습니다.';
    case 'notAllowed': return '방문 허락이 없어 내 집으로 돌아왔습니다.';
    default: return '내 집으로 돌아왔습니다.';
  }
}
