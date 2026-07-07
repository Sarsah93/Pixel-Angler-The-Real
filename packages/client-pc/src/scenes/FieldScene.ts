/**
 * @file FieldScene.ts
 * @description 탑다운 평면 지도 필드 플레이 씬
 * 
 * 플레이어 캐릭터가 돌아다니며 낚시 포인트를 찾고, 마트나 편의점을 방문하고, 
 * 낚시 집중 뷰(FishingScene)로 화면을 넘기는 중심 필드입니다.
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { getSpotById, SPOT_DATABASE } from '@tra/core';
import { HUD } from '../ui/HUD.js';
import { MiniMap } from '../ui/MiniMap.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

export class FieldScene extends Phaser.Scene {
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private hud?: HUD;
  private miniMap?: MiniMap;
  private spotInfo = SPOT_DATABASE[0];
  
  // 낚시 포인트 위치 목록 (하드코딩된 예제)
  private fishingPoints: Array<{ x: number; y: number; label: string }> = [];

  constructor() {
    super({ key: 'FieldScene' });
  }

  init(): void {
    const spotId = GameState.currentSpotId || 'geoje_gujora_breakwater';
    const spot = getSpotById(spotId);
    if (spot) {
      this.spotInfo = spot;
    }
  }

  create(): void {
    const { width, height } = this.scale;

    // 타일맵 대용 그래픽 배경 (방파제 디자인)
    this.createFieldBackground();

    // 낚시 포인트 표시 생성
    this.createFishingPoints();

    // 플레이어 캐릭터 생성 (Phaser Arcade 물리 적용)
    this.player = this.physics.add.sprite(width / 2, height / 2 + 100, 'player_placeholder') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    if (this.player) {
      // 텍스처가 없을 경우 더미 사각형 그리기
      this.player.setSize(32, 48);
      this.player.setCollideWorldBounds(true);
    }

    // 키보드 방향키 설정
    this.cursors = this.input.keyboard?.createCursorKeys();

    // HUD 추가
    this.hud = new HUD(this);
    this.add.existing(this.hud);

    // 미니맵 추가
    this.miniMap = new MiniMap(this, GAME_WIDTH - 180, 70, 150, 150);
    this.add.existing(this.miniMap);

    // 낚시 진입 힌트 텍스트
    this.add.text(width / 2, height - 70, '물가로 이동 후 [SPACE] 또는 [ENTER] 키로 캐스팅 시작', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#e8f4fd',
      backgroundColor: '#0a1628cc',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    // ESC 설정
    this.input.keyboard?.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('WorldMapScene');
      });
    });

    // 스페이스 / 엔터 클릭 시 낚시 씬(FishingScene) 진입
    const startFishingAction = () => {
      // 플레이어가 낚시 가능 지점에 있는지 확인하는 로직 (단순 시뮬레이션용 상시 허용)
      this.cameras.main.fadeOut(300, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('FishingScene');
      });
    };

    this.input.keyboard?.on('keydown-SPACE', startFishingAction);
    this.input.keyboard?.on('keydown-ENTER', startFishingAction);

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    // 플레이어 이동 로직
    const speed = 180;
    this.player.setVelocity(0);

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-speed);
      GameState.updatePlayer({ facing: 'left', status: 'walking' });
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(speed);
      GameState.updatePlayer({ facing: 'right', status: 'walking' });
    }

    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-speed);
      GameState.updatePlayer({ facing: 'up', status: 'walking' });
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(speed);
      GameState.updatePlayer({ facing: 'down', status: 'walking' });
    }

    // 멈췄을 때
    if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
      GameState.updatePlayer({ status: 'idle' });
    }

    // 미니맵 위치 동기화
    if (this.miniMap) {
      this.miniMap.updatePlayerMarker(this.player.x, this.player.y);
    }
  }

  private createFieldBackground(): void {
    const bg = this.add.graphics();

    // 1. 넓은 바다 (파란색)
    bg.fillStyle(0x0e2f50);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. 방파제 육지 영역 (회색 타일 느낌)
    bg.fillStyle(0x354152);
    bg.fillRect(100, 150, GAME_WIDTH - 200, GAME_HEIGHT - 150);

    // 테트라포드 방파제 경계선
    bg.fillStyle(0x202b38);
    bg.fillRect(100, 130, GAME_WIDTH - 200, 20);

    // 편의점/마트 건물 (간단한 상자 드로잉)
    if (this.spotInfo.hasNearbyConvenienceStore) {
      bg.fillStyle(0xd46a13); // GS25/농협 느낌 주황
      bg.fillRect(180, 200, 120, 80);
      this.add.text(240, 240, 'GS25 마트', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // 횟집 건물
    bg.fillStyle(0x1377a8);
    bg.fillRect(380, 200, 120, 80);
    this.add.text(440, 240, '싱싱 횟집\n(손질비 kg당)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // 낚시용품점 (태클숍)
    bg.fillStyle(0x286338);
    bg.fillRect(580, 200, 120, 80);
    this.add.text(640, 240, '대박 낚시점\n(장비/미끼)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
  }

  private createFishingPoints(): void {
    // 낚시 가능한 수중여나 포인트에 노란색 점/원 그리기
    this.fishingPoints = [
      { x: 200, y: 110, label: '방파제 외항 수중여' },
      { x: 500, y: 110, label: '조류 회전구간' },
      { x: 800, y: 110, label: '방파제 내항 끝자리' },
    ];

    const g = this.add.graphics();
    g.fillStyle(0xffff33, 0.4);
    g.lineStyle(1.5, 0xffff33, 0.8);

    this.fishingPoints.forEach((point) => {
      g.fillCircle(point.x, point.y, 8);
      g.strokeCircle(point.x, point.y, 16);
      
      this.add.text(point.x, point.y - 25, point.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px',
        color: '#ffff88',
      }).setOrigin(0.5);
    });
  }
}
