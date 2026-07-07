/**
 * @file RoomManager.ts
 * @description 동시 출조 방 관리 클래스 (인메모리)
 */

import type { RemotePlayerSnapshot } from '@tra/core';

export interface RoomInfo {
  roomId: string;
  players: Map<string, RemotePlayerSnapshot>;
}

export class RoomManager {
  private rooms = new Map<string, RoomInfo>();

  /**
   * 플레이어를 특정 방에 등록합니다.
   */
  joinRoom(roomId: string, player: RemotePlayerSnapshot): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        players: new Map(),
      });
    }

    const room = this.rooms.get(roomId)!;
    room.players.set(player.id, player);
    console.log(`[RoomManager] Player ${player.nickname} joined room ${roomId}. Total: ${room.players.size}`);
  }

  /**
   * 플레이어가 모든 방에서 완전히 이탈하도록 처리합니다.
   */
  leaveAllRooms(playerId: string): { roomId: string; wasLast: boolean }[] {
    const exited: { roomId: string; wasLast: boolean }[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.has(playerId)) {
        room.players.delete(playerId);
        exited.push({
          roomId,
          wasLast: room.players.size === 0,
        });
        
        if (room.players.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }

    return exited;
  }

  /**
   * 특정 방에 참가 중인 다른 플레이어들의 스냅샷 리스트를 구합니다.
   */
  getPlayersInRoom(roomId: string): RemotePlayerSnapshot[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.players.values());
  }

  /**
   * 플레이어의 움직임/동작 상태를 실시간 업데이트합니다.
   */
  updatePlayerState(
    playerId: string,
    state: Partial<Omit<RemotePlayerSnapshot, 'id' | 'nickname'>>
  ): { roomId: string } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      const player = room.players.get(playerId);
      if (player) {
        // 객체 참조 변경 방지
        Object.assign(player, state);
        return { roomId };
      }
    }
    return null;
  }
}
