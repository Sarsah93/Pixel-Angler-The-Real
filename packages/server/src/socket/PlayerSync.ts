/**
 * @file PlayerSync.ts
 * @description WebSocket 상에서의 플레이어 이동 및 동조화 이벤트 수신기 및 발송기
 */

import type { Server, Socket } from 'socket.io';
import type { RoomManager } from './RoomManager.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/SocketEvents.js';
import type { RemotePlayerSnapshot } from '@tra/core';

export function setupPlayerSync(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager
): void {
  const playerId = socket.id;

  // 1. 방 진입
  socket.on('joinRoom', ({ roomId, nickname }) => {
    // 룸 참여 전 기존 룸 제거
    roomManager.leaveAllRooms(playerId);

    const initialPlayer: RemotePlayerSnapshot = {
      id: playerId,
      nickname,
      characterSkinId: 'default',
      position: { x: 400, y: 300, sceneKey: 'FieldScene' },
      facing: 'down',
      status: 'idle',
    };

    roomManager.joinRoom(roomId, initialPlayer);
    socket.join(roomId);

    // 본인에게는 이 방에 있는 다른 플레이어들의 목록 전송
    const otherPlayers = roomManager.getPlayersInRoom(roomId).filter((p) => p.id !== playerId);
    socket.emit('roomJoined', { players: otherPlayers });

    // 방 내 다른 사람들에게는 내 진입 알림
    socket.to(roomId).emit('playerJoined', initialPlayer);
  });

  // 2. 실시간 좌표 및 상태 갱신 수신
  socket.on('updateState', (state) => {
    const updated = roomManager.updatePlayerState(playerId, {
      position: { x: state.x, y: state.y, sceneKey: 'FieldScene' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      facing: state.facing as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: state.status as any,
    });

    if (updated) {
      // 룸에 있는 다른 클라이언트에게 이 플레이어의 좌표 전파
      const allPlayers = roomManager.getPlayersInRoom(updated.roomId);
      io.to(updated.roomId).emit('stateBroadcast', allPlayers);
    }
  });

  // 3. 채팅 메시지 수신
  socket.on('chatMessage', ({ message }) => {
    // 플레이어가 속해 있는 방 찾기
    const playersInAnyRoom = roomManager.getPlayersInRoom('geoje_gujora_breakwater'); // 기본 룸으로 근사
    const sender = playersInAnyRoom.find((p) => p.id === playerId);
    if (sender) {
      io.to('geoje_gujora_breakwater').emit('chatBroadcast', {
        playerId,
        nickname: sender.nickname,
        message,
      });
    }
  });

  // 4. 접속 완전 종료
  socket.on('disconnect', () => {
    const exitedRooms = roomManager.leaveAllRooms(playerId);
    exitedRooms.forEach(({ roomId }) => {
      socket.to(roomId).emit('playerLeft', { playerId });
    });
    console.log(`[PlayerSync] Client disconnected: ${playerId}`);
  });
}
