/**
 * @file index.ts
 * @description 백엔드 서버 진입점 — 멀티플레이 세션 REST(`/mp`) + 날씨 프록시(`/api`).
 *
 * 멀티플레이는 전부 REST(1초 폴링)다. 예전의 Socket.IO 뼈대는 쓰는 곳이 없어 걷어 냈다 —
 * 부드러운 실시간 이동 보간이 필요해지면 그때 `/mp` 계약 위에 다시 올린다.
 */

// ⚠ 반드시 첫 import — 아래 모듈들이 불러올 때 `process.env`를 읽으므로(.env의 KMA_API_KEY · MP_SESSION_DIR 등)
//   `.env`를 그보다 먼저 실어야 한다. 본문에서 `dotenv.config()`를 부르면 이미 늦다(import가 먼저 평가된다).
import 'dotenv/config';

import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';

import { weatherProxyRouter } from './api/WeatherProxy.js';
import { multiplayerRouter } from './multiplayer/routes.js';
import { corsOriginAllowed, parseCorsOrigins } from './http/guards.js';

const app = express();

// CORS — 허용 목록(기본: 같은 PC · 사설망 · 테스트 배포본 · 데스크톱 앱 / `CORS_ORIGINS`로 바꾼다)
const corsRule = parseCorsOrigins(process.env.CORS_ORIGINS);
app.use(cors({
  origin: (origin, cb) => cb(null, corsOriginAllowed(origin, corsRule)),
}));

// 본문 크기 상한 — 거래 제안(아이템 원본 8줄)이 가장 크다
app.use(express.json({ limit: '512kb' }));

// API 프록시 라우터 등록
app.use('/api', weatherProxyRouter);
// 멀티플레이 세션 라우터 (143차) — 로비·이름 중복 검사·위치 알림
app.use('/mp', multiplayerRouter);

// 헬스체크
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// 오류 응답 — 기본 처리기는 스택 · 서버 폴더 경로를 본문에 그대로 싣는다. 사유만 돌려주고 자세한 것은 서버 로그에만 남긴다.
// (클라이언트는 상태 코드와 무관하게 `{ ok, reasonKo }` 본문을 읽는다)
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) { next(err); return; }
  const status = typeof (err as { status?: unknown })?.status === 'number' ? (err as { status: number }).status : 500;
  const code = status >= 400 && status < 500 ? status : 500;
  if (code === 500) console.error('[Server] 처리 중 오류:', err);
  res.status(code).json({ ok: false, reasonKo: code === 413 ? '요청이 너무 큽니다.' : code === 500 ? '서버에서 처리하지 못했습니다.' : '요청이 올바르지 않습니다.' });
});

const PORT = process.env.SERVER_PORT || 4000;
app.listen(PORT, () => {
  console.log(`[Server] Pixel Angler The Real Backend is running on port ${PORT}`);
  console.log(`[Server] CORS: ${corsRule.all ? '전부 허용(*)' : corsRule.list ? corsRule.list.join(', ') : '기본 목록(같은 PC · 사설망 · 테스트 배포본 · 데스크톱 앱)'}`);
});
