/**
 * @file index.ts
 * @description Express 및 Socket.io 통합 멀티플레이 백엔드 서버 진입점
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { RoomManager } from './socket/RoomManager.js';
import { setupPlayerSync } from './socket/PlayerSync.js';
import { weatherProxyRouter } from './api/WeatherProxy.js';
import type { ClientToServerEvents, ServerToClientEvents } from './types/SocketEvents.js';

// .env 로드
dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS 설정
app.use(cors({
  origin: '*', // 개발 시 모든 오리진 허용
}));

app.use(express.json());

// API 프록시 라우터 등록
app.use('/api', weatherProxyRouter);

// 헬스체크
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Socket.io 인스턴스 생성
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 동시 출조 룸 관리자 인스턴스
const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`[Server] Client connected: ${socket.id}`);
  setupPlayerSync(io, socket, roomManager);
});

const PORT = process.env.SERVER_PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`[Server] The Real Angler Backend is running on port ${PORT}`);
});
