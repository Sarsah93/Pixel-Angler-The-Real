/**
 * @file guards.ts
 * @description 서버 진입점의 보호 장치 — CORS 허용 목록 · 요청 빈도 제한.
 *
 * 이 서버는 **방을 연 사람의 PC에서 도는 세계 서버**다(호스트-클라이언트 전제). 그래서 기본 허용 목록은
 * 「같은 PC · 같은 공유기 안 · 테스트 배포본 · 데스크톱 앱」이고, 그 밖의 출처는 `CORS_ORIGINS`로 직접 연다.
 */

import type { NextFunction, Request, Response } from 'express';

/** 기본으로 허용하는 고정 출처 — 테스트 배포본(gh-pages)과 Tauri 데스크톱 앱 */
const DEFAULT_ORIGINS: readonly string[] = [
  'https://sarsah93.github.io',
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
];

/** 같은 PC(localhost) 또는 사설망(10.x · 172.16~31.x · 192.168.x) 주소인가 — 포트는 가리지 않는다 */
function isLocalOrLanHost(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const a = Number(m[1]), b = Number(m[2]);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/**
 * `CORS_ORIGINS` 환경 변수 풀이.
 * - 없음 → 기본 목록(같은 PC · 사설망 · 테스트 배포본 · 데스크톱 앱)
 * - `*` → 전부 허용(개발용)
 * - 쉼표로 나눈 출처 목록 → **그 목록만** 허용(기본 목록을 대신한다)
 */
export function parseCorsOrigins(raw: string | undefined): { all: boolean; list: readonly string[] | null } {
  const v = (raw ?? '').trim();
  if (!v) return { all: false, list: null };
  if (v === '*') return { all: true, list: null };
  return { all: false, list: v.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean) };
}

/** 이 출처의 브라우저 요청을 받아 줄 것인가. 출처가 없는 요청(브라우저가 아닌 도구 · 같은 출처)은 CORS 대상이 아니다 */
export function corsOriginAllowed(origin: string | undefined, rule: ReturnType<typeof parseCorsOrigins>): boolean {
  if (!origin) return true;
  if (rule.all) return true;
  if (rule.list) return rule.list.includes(origin);
  if (DEFAULT_ORIGINS.includes(origin)) return true;
  try {
    const u = new URL(origin);
    return (u.protocol === 'http:' || u.protocol === 'https:') && isLocalOrLanHost(u.hostname);
  } catch (_e) {
    return false;
  }
}

/**
 * 주소(IP)별 요청 빈도 제한 — 고정 창. 인증 없이 열려 있는 경로(세션 열기 · 조회 · 참가)에만 건다.
 * 넘으면 429와 함께 화면에 그대로 띄울 사유를 돌려준다(클라이언트는 상태 코드와 무관하게 본문을 읽는다).
 */
export function rateLimit(opts: { windowMs: number; max: number }): (req: Request, res: Response, next: NextFunction) => void {
  const hits = new Map<string, { n: number; resetMs: number }>();
  return (req, res, next) => {
    const now = Date.now();
    // 지난 창은 그때그때 치운다 — 따로 타이머를 두지 않는다
    if (hits.size > 2_000) for (const [k, h] of hits) if (h.resetMs <= now) hits.delete(k);
    const key = req.ip ?? 'unknown';
    const h = hits.get(key);
    if (!h || h.resetMs <= now) { hits.set(key, { n: 1, resetMs: now + opts.windowMs }); next(); return; }
    if (h.n >= opts.max) {
      res.status(429).json({ ok: false, reasonKo: '요청이 너무 잦습니다 — 잠시 뒤 다시 시도하세요.' });
      return;
    }
    h.n++;
    next();
  };
}
