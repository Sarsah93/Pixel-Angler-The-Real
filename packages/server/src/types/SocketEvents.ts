/**
 * @file SocketEvents.ts
 * @description WebSocket 통신을 위한 공통 이벤트 규격 정의
 */

import type { RemotePlayerSnapshot } from '@tra/core';

export interface ClientToServerEvents {
  /** 방 참여 */
  joinRoom: (payload: { roomId: string; nickname: string }) => void;
  /** 플레이어 상태/위치 업데이트 */
  updateState: (payload: { x: number; y: number; facing: string; status: string }) => void;
  /** 채팅 메시지 송신 */
  chatMessage: (payload: { message: string }) => void;
  /** 토너먼트 조과 등록 */
  submitTournamentScore: (payload: { fishSpeciesId: string; lengthCm: number; weightGram: number }) => void;
}

export interface ServerToClientEvents {
  /** 방 참가 성공 및 현재 접속 중인 다른 플레이어 목록 수신 */
  roomJoined: (payload: { players: RemotePlayerSnapshot[] }) => void;
  /** 새로운 다른 플레이어 접속 */
  playerJoined: (player: RemotePlayerSnapshot) => void;
  /** 다른 플레이어가 퇴장함 */
  playerLeft: (payload: { playerId: string }) => void;
  /** 다른 플레이어들의 상태 동기화 업데이트 */
  stateBroadcast: (players: RemotePlayerSnapshot[]) => void;
  /** 채팅 브로드캐스트 */
  chatBroadcast: (payload: { playerId: string; nickname: string; message: string }) => void;
  /** 토너먼트 리더보드 브로드캐스트 */
  leaderboardUpdate: (payload: Array<{ nickname: string; score: number }>) => void;
}
