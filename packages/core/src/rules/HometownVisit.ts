/**
 * @file HometownVisit.ts
 * @description 306차 — 홈타운 방문(집 구경) 규칙. 305차 밑작업(집 id · 세션 키 범위 · 방문자 행동 · 머무는 집) 위에 얹는다.
 *
 * 흐름: 손님이 정보 보기에서 「집 구경 청하기」 → 서버가 집주인에게 알림 → 집주인이 들이면(`accepted`) 손님은 그 집으로 간다.
 * 들인 동안 집주인 클라이언트가 **집 모습(읽기 전용)** 을 올리고, 손님 화면은 제 세이브가 아니라 그것으로 마당 · 텃밭 · 우편함 깃발을 그린다.
 * 어느 쪽이든 끝내거나 · 자리를 비우면(접속 끊김) 방문이 끝나고 손님은 내 집으로 돌아온다(305 `resolveHometownStay`).
 *
 * 순수 TS — 서버 · 클라이언트가 같이 읽는다.
 */

import type { MpVisit, MpHomeView, MpHomeInteriorView } from '../types/Multiplayer.js';
import { MP_HOME_VIEW_MAX_JSON } from '../types/Multiplayer.js';
import { isHomeId } from './HometownOwnership.js';

/** 방문이 아직 살아 있는가(답을 기다리는 중 · 들인 뒤) */
export function isVisitLive(v: Pick<MpVisit, 'status'>): boolean {
  return v.status === 'pending' || v.status === 'accepted';
}

/** 내가 그 집에 들어가도 되는가 — 내가 손님으로 청해 **들인** 방문이 있다 */
export function visitAllowedFor(visits: readonly MpVisit[], myPlayerId: string, homeId: string): boolean {
  return !!myPlayerId && visits.some((v) => v.status === 'accepted' && v.fromPlayerId === myPlayerId && v.homeId === homeId);
}

/** 내가 손님인 살아 있는 방문(하나뿐 — 서버가 둘을 받지 않는다) */
export function guestVisitOf(visits: readonly MpVisit[], myPlayerId: string): MpVisit | undefined {
  return visits.find((v) => v.fromPlayerId === myPlayerId && isVisitLive(v));
}

/** 내가 집주인인 방문(상태로 거른다 — 생략하면 살아 있는 것 전부) */
export function hostVisitsOf(visits: readonly MpVisit[], myPlayerId: string, status?: MpVisit['status']): MpVisit[] {
  return visits.filter((v) => v.toPlayerId === myPlayerId && (status ? v.status === status : isVisitLive(v)));
}

/** 두 사람 사이에 살아 있는 방문(어느 방향이든) */
export function liveVisitBetween(visits: readonly MpVisit[], a: string, b: string): MpVisit | undefined {
  return visits.find((v) => isVisitLive(v)
    && ((v.fromPlayerId === a && v.toPlayerId === b) || (v.fromPlayerId === b && v.toPlayerId === a)));
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown, max = 64): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

/**
 * 주인 집 모습 모양 검사 — 서버(받을 때)와 손님(그릴 때)이 같이 쓴다. 모양이 틀리거나 너무 크면 null.
 * 마당 설치물은 칸 좌표 · 종류 · id만 확인한다(그림은 손님 클라이언트의 종류 표로 그린다).
 * 307차 — 집 안(`interior`)이 있으면 그 모양도 본다(가구 · 화분 · 스탠드 · 수조 · 어탁만 — 보관함 속은 애초에 싣지 않는다).
 */
export function cleanHomeView(v: unknown): MpHomeView | null {
  if (!isObj(v)) return null;
  let json = '';
  try { json = JSON.stringify(v); } catch (_e) { return null; }
  if (json.length > MP_HOME_VIEW_MAX_JSON) return null;
  const w = v.world;
  if (!isObj(w) || !Array.isArray(w.removedIds) || !Array.isArray(w.moved) || !Array.isArray(w.placed)) return null;
  if (w.removedIds.length > 600 || w.moved.length > 600 || w.placed.length > 300) return null;
  if (!w.removedIds.every((x) => isStr(x))) return null;
  if (!w.moved.every((m) => isObj(m) && isStr(m.instanceId) && isNum(m.tx) && isNum(m.ty))) return null;
  if (!w.placed.every((o) => isObj(o) && isStr(o.instanceId) && isStr(o.type, 32) && isNum(o.tx) && isNum(o.ty))) return null;
  if (!isObj(v.farm) || Object.keys(v.farm).length > 32 || !Object.values(v.farm).every(isObj)) return null;
  if (typeof v.mailboxFlag !== 'boolean' || !isNum(v.atMs)) return null;
  if (v.interior !== undefined && !isInteriorShape(v.interior)) return null;
  return v as unknown as MpHomeView;
}

const FURN_DIRS = ['down', 'left', 'up', 'right'];

/** 307차 — 집 안 모습 모양(가구 80점 · 화분 · 스탠드 id · 수조 20개 × 고기 8 · 어탁 한 점) */
function isInteriorShape(iv: unknown): iv is MpHomeInteriorView {
  if (!isObj(iv) || !Array.isArray(iv.placed) || !Array.isArray(iv.dryPlants) || !Array.isArray(iv.lampsOn) || !isObj(iv.tanks)) return false;
  if (iv.placed.length > 80 || iv.dryPlants.length > 80 || iv.lampsOn.length > 80) return false;
  if (!iv.placed.every((f) => isObj(f) && isStr(f.id) && isStr(f.kind, 32) && isNum(f.tx) && isNum(f.ty) && FURN_DIRS.includes(f.dir as string))) return false;
  if (!iv.dryPlants.every((x) => isStr(x)) || !iv.lampsOn.every((x) => isStr(x))) return false;
  const tanks = Object.values(iv.tanks);
  if (tanks.length > 20) return false;
  if (!tanks.every((t) => Array.isArray(t) && t.length <= 8
    && t.every((x) => isObj(x) && isStr(x.speciesId) && isNum(x.lengthCm) && (x.sex === 'M' || x.sex === 'F')))) return false;
  if (iv.fishPrint !== undefined && !(isObj(iv.fishPrint) && isStr(iv.fishPrint.speciesId) && isNum(iv.fishPrint.lengthCm))) return false;
  return true;
}

/** 방문 한 건이 서버 응답 모양인가(손님 · 주인 클라이언트가 받을 때) */
export function isVisitShape(v: unknown): v is MpVisit {
  return isObj(v) && isStr(v.id) && isStr(v.fromPlayerId) && isStr(v.toPlayerId) && typeof v.fromName === 'string'
    && typeof v.toName === 'string' && isHomeId(v.homeId)
    && (v.status === 'pending' || v.status === 'accepted' || v.status === 'declined' || v.status === 'ended' || v.status === 'expired')
    && isNum(v.createdMs) && isNum(v.viewRev);
}
