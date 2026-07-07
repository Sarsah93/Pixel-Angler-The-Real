/**
 * @file GameState.ts
 * @description 전역 게임 상태 관리
 *
 * Phaser와 독립적인 순수 TypeScript 상태 관리.
 * 씬 간 데이터 공유 및 세이브/로드의 중심입니다.
 */

import type { PlayerState, TackleSetup } from '@tra/core';
import { EnvironmentStore } from './EnvironmentStore.js';

// ─────────────────────────────────────────────
// 기본 플레이어 상태
// ─────────────────────────────────────────────
function createDefaultPlayer(): PlayerState {
  return {
    id: crypto.randomUUID(),
    nickname: '이름없는꾼',
    characterSkinId: 'default',
    position: { x: 100, y: 100, sceneKey: 'WorldMapScene' },
    facing: 'down',
    status: 'idle',
    currentTackle: null,
    inventory: {
      rodIds: ['rod_daiwaSS1500_1p5'],
      reelIds: ['reel_daiwa3000'],
      consumables: [
        { itemId: 'bait_sandworm_fresh', name: '청갯지렁이', quantity: 30, category: 'bait' },
        { itemId: 'bait_earthworm', name: '지렁이', quantity: 20, category: 'bait' },
      ],
      livewell: [],
      coins: 50000,
    },
    caughtFishHistory: [],
    personalRecords: {},
    totalTrips: 0,
    totalPlayMinutes: 0,
    createdAt: new Date(),
    lastSavedAt: new Date(),
  };
}

// ─────────────────────────────────────────────
// GameState 싱글톤
// ─────────────────────────────────────────────
export class GameStateManager {
  private _player: PlayerState | null = null;
  private _currentSpotId: string | null = null;
  private _isInitialized = false;

  readonly environment = EnvironmentStore;

  initialize(): void {
    if (this._isInitialized) return;

    // 세이브 파일 로드 시도
    const saved = this.load();
    this._player = saved ?? createDefaultPlayer();
    this._isInitialized = true;

    console.log('[GameState] Initialized. Player:', this._player.nickname);
  }

  get player(): PlayerState {
    if (!this._player) throw new Error('GameState not initialized. Call GameState.initialize() first.');
    return this._player;
  }

  get currentSpotId(): string | null {
    return this._currentSpotId;
  }

  /** 플레이어 상태 부분 업데이트 */
  updatePlayer(partial: Partial<PlayerState>): void {
    if (!this._player) return;
    this._player = { ...this._player, ...partial };
  }

  /** 현재 낚시터 설정 */
  setCurrentSpot(spotId: string): void {
    this._currentSpotId = spotId;
  }

  /** 현재 채비 설정 */
  equipTackle(tackle: TackleSetup | null): void {
    this.updatePlayer({ currentTackle: tackle });
  }

  /** 세이브 (LocalStorage — 추후 Tauri API 기반 파일 저장으로 전환) */
  save(): void {
    if (!this._player) return;
    try {
      this._player.lastSavedAt = new Date();
      localStorage.setItem('tra_save', JSON.stringify(this._player));
      console.log('[GameState] Saved.');
    } catch (e) {
      console.error('[GameState] Save failed:', e);
    }
  }

  /** 로드 */
  private load(): PlayerState | null {
    try {
      const raw = localStorage.getItem('tra_save');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PlayerState;
      // Date 복원
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.lastSavedAt = new Date(parsed.lastSavedAt);
      return parsed;
    } catch {
      return null;
    }
  }

  /** 새 게임 시작 (세이브 초기화) */
  newGame(): void {
    localStorage.removeItem('tra_save');
    this._player = createDefaultPlayer();
  }
}

export const GameState = new GameStateManager();
