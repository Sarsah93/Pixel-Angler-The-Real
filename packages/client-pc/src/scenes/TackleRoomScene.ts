/**
 * @file TackleRoomScene.ts
 * @description 장비실 및 채비 관리 씬
 * 
 * 플레이어는 보유한 로드, 릴, 라인, 찌, 미끼 목록을 보고 
 * 최적의 채비를 결합(장착)할 수 있습니다.
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import {
  ROD_DATABASE,
  REEL_DATABASE,
  LINE_DATABASE,
  BAIT_DATABASE,
  HOOK_DATABASE,
} from '@tra/core';
import type { TackleSetup } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

export class TackleRoomScene extends Phaser.Scene {
  // 선택된 장비 인덱스
  private selectedRodIdx = 0;
  private selectedReelIdx = 0;
  private selectedLineIdx = 0;
  private selectedBaitIdx = 0;
  private selectedHookIdx = 0;

  private infoPanel?: Phaser.GameObjects.Container;
  private activeCategory: 'rod' | 'reel' | 'line' | 'hook' | 'bait' = 'rod';

  constructor() {
    super({ key: 'TackleRoomScene' });
  }

  create(): void {
    // 배경
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050b14).setOrigin(0, 0);

    // 타이틀
    this.add.text(40, 40, '🎣 나만의 장비실 (Tackle Room)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '24px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });

    this.add.text(40, 75, '[Tab] 카테고리 이동 | [방향키 위/아래] 선택 변경 | [ENTER] 장착 완료 | [ESC] 뒤로가기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#8faabf',
    });

    // 장비 리스트 UI
    this.createCategoryList();

    // 장비 상세정보 패널
    this.createInfoPanel();

    // 키 입력 바인딩
    this.setupInput();

    this.updateSelection();

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  private createCategoryList(): void {
    const listX = 40;
    const startY = 130;

    // 카테고리 탭 표시
    this.add.text(listX, startY, '카테고리 선택:', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#c8a060',
      fontStyle: 'bold',
    });

    const categories = ['1. 로드(Rod)', '2. 릴(Reel)', '3. 라인(Line)', '4. 바늘(Hook)', '5. 미끼(Bait)'];
    categories.forEach((cat, idx) => {
      this.add.text(listX, startY + 30 + idx * 30, cat, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '15px',
        color: '#8faabf',
      });
    });

    // 구분선
    const divider = this.add.graphics();
    divider.lineStyle(1.5, 0x1f3d5a, 0.8);
    divider.lineBetween(listX, startY + 200, listX + 260, startY + 200);

    // 현재 장착된 채비 요약
    this.add.text(listX, startY + 220, '현재 완성된 채비:', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#c8a060',
      fontStyle: 'bold',
    });

    const tackle = GameState.player.currentTackle;
    const rodText = tackle?.rod.modelName ?? '미장착';
    const reelText = tackle?.reel.modelName ?? '미장착';
    const lineText = tackle?.mainLine.modelName ?? '미장착';
    const baitText = tackle?.bait.name ?? '미장착';

    this.add.text(listX, startY + 250, `대: ${rodText}`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd' });
    this.add.text(listX, startY + 275, `릴: ${reelText}`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd' });
    this.add.text(listX, startY + 300, `줄: ${lineText}`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd' });
    this.add.text(listX, startY + 325, `미끼: ${baitText}`, { fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd' });
  }

  private createInfoPanel(): void {
    const panelX = 360;
    const panelY = 130;

    this.infoPanel = this.add.container(panelX, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e1c2d, 0.9);
    bg.fillRoundedRect(0, 0, 880, 520, 4);
    bg.lineStyle(1.5, 0x2a5a8a, 0.8);
    bg.strokeRoundedRect(0, 0, 880, 520, 4);

    this.infoPanel.add(bg);

    const mainTitle = this.add.text(20, 20, '상세 제원 및 선택', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '18px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });

    this.infoPanel.add(mainTitle);

    // 동적으로 그려질 아이템 리스트 컨테이너
    const listContainer = this.add.container(20, 60);
    this.infoPanel.add(listContainer);
  }

  private updateSelection(): void {
    const container = this.infoPanel?.getAt(2) as Phaser.GameObjects.Container;
    container.removeAll(true); // 기존 텍스트 청소

    // 카테고리에 따른 데이터 표시
    if (this.activeCategory === 'rod') {
      ROD_DATABASE.forEach((rod, index) => {
        const isSelected = index === this.selectedRodIdx;
        const color = isSelected ? '#4af2a1' : '#a0b8c8';
        const prefix = isSelected ? '▶ ' : '  ';
        
        const text = this.add.text(0, index * 80, `${prefix}${rod.brand} ${rod.modelName}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '16px',
          color,
          fontStyle: isSelected ? 'bold' : 'normal',
        });

        const specText = this.add.text(20, index * 80 + 25, `길이: ${rod.lengthM}m | 추천원줄: ${rod.recommendedLineNo.join('~')}호 | 무게: ${rod.weightG}g | 타입: ${rod.rodType}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '12px',
          color: '#5a8fab',
        });

        container.add([text, specText]);
      });
    } else if (this.activeCategory === 'reel') {
      REEL_DATABASE.forEach((reel, index) => {
        const isSelected = index === this.selectedReelIdx;
        const color = isSelected ? '#4af2a1' : '#a0b8c8';
        const prefix = isSelected ? '▶ ' : '  ';

        const text = this.add.text(0, index * 80, `${prefix}${reel.brand} ${reel.modelName}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '16px',
          color,
          fontStyle: isSelected ? 'bold' : 'normal',
        });

        const specText = this.add.text(20, index * 80 + 25, `드랙력: ${reel.maxDragKg}kg | 기어비: ${reel.gearRatio} | 1회전회수: ${reel.retrievePerCrank}cm | 스펙: ${reel.lineCapacity}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '12px',
          color: '#5a8fab',
        });

        container.add([text, specText]);
      });
    } else if (this.activeCategory === 'line') {
      LINE_DATABASE.forEach((line, index) => {
        const isSelected = index === this.selectedLineIdx;
        const color = isSelected ? '#4af2a1' : '#a0b8c8';
        const prefix = isSelected ? '▶ ' : '  ';

        const text = this.add.text(0, index * 80, `${prefix}${line.brand} ${line.modelName}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '16px',
          color,
          fontStyle: isSelected ? 'bold' : 'normal',
        });

        const specText = this.add.text(20, index * 80 + 25, `호수: ${line.lineNo}호 | 강도: ${line.strengthLb}lb | 굵기: ${line.diameterMm}mm | 재질: ${line.material}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '12px',
          color: '#5a8fab',
        });

        container.add([text, specText]);
      });
    } else if (this.activeCategory === 'hook') {
      HOOK_DATABASE.forEach((hook, index) => {
        const isSelected = index === this.selectedHookIdx;
        const color = isSelected ? '#4af2a1' : '#a0b8c8';
        const prefix = isSelected ? '▶ ' : '  ';

        const text = this.add.text(0, index * 80, `${prefix}${hook.name}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '16px',
          color,
          fontStyle: isSelected ? 'bold' : 'normal',
        });

        const specText = this.add.text(20, index * 80 + 25, `크기: ${hook.hookSize} | 타입: ${hook.hookType} | 재질: ${hook.material}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '12px',
          color: '#5a8fab',
        });

        container.add([text, specText]);
      });
    } else if (this.activeCategory === 'bait') {
      BAIT_DATABASE.forEach((bait, index) => {
        const isSelected = index === this.selectedBaitIdx;
        const color = isSelected ? '#4af2a1' : '#a0b8c8';
        const prefix = isSelected ? '▶ ' : '  ';

        const text = this.add.text(0, index * 80, `${prefix}${bait.name}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '16px',
          color,
          fontStyle: isSelected ? 'bold' : 'normal',
        });

        const specText = this.add.text(20, index * 80 + 25, `기본 매력도: ${bait.baseEffectiveness}% | 소모성: ${bait.isConsumable ? '소모성' : '영구'} | 채집가능여부: ${bait.canBeForaged ? '가능' : '상점구매'}`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '12px',
          color: '#5a8fab',
        });

        container.add([text, specText]);
      });
    }
  }

  private setupInput(): void {
    // 탭 키로 카테고리 순환
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      const categories: Array<TackleRoomScene['activeCategory']> = ['rod', 'reel', 'line', 'hook', 'bait'];
      const currentIdx = categories.indexOf(this.activeCategory);
      this.activeCategory = categories[(currentIdx + 1) % categories.length];
      this.updateSelection();
    });

    // 위/아래 방향키로 아이템 탐색
    this.input.keyboard?.on('keydown-UP', () => {
      this.moveSelection(-1);
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      this.moveSelection(1);
    });

    // 엔터 누를 때 전체 채비 완성 후 GameState 업데이트
    this.input.keyboard?.on('keydown-ENTER', () => {
      const tackle: TackleSetup = {
        rod: ROD_DATABASE[this.selectedRodIdx],
        reel: REEL_DATABASE[this.selectedReelIdx],
        mainLine: LINE_DATABASE[this.selectedLineIdx],
        rigType: 'full_float_flowing',
        hook: HOOK_DATABASE[this.selectedHookIdx],
        bait: BAIT_DATABASE[this.selectedBaitIdx],
      };
      
      GameState.equipTackle(tackle);
      
      // 저장
      GameState.save();

      // 화면 피드백 후 WorldMapScene으로 이동
      const { width, height } = this.scale;
      const toast = this.add.text(width / 2, height / 2, '채비가 변경되어 저장되었습니다!', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '20px',
        color: '#4af2a1',
        backgroundColor: '#0a1628f0',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5);

      this.time.delayedCall(1200, () => {
        toast.destroy();
        this.cameras.main.fadeOut(300, 0, 10, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MainMenuScene');
        });
      });
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });
  }

  private moveSelection(offset: number): void {
    if (this.activeCategory === 'rod') {
      this.selectedRodIdx = (this.selectedRodIdx + offset + ROD_DATABASE.length) % ROD_DATABASE.length;
    } else if (this.activeCategory === 'reel') {
      this.selectedReelIdx = (this.selectedReelIdx + offset + REEL_DATABASE.length) % REEL_DATABASE.length;
    } else if (this.activeCategory === 'line') {
      this.selectedLineIdx = (this.selectedLineIdx + offset + LINE_DATABASE.length) % LINE_DATABASE.length;
    } else if (this.activeCategory === 'hook') {
      this.selectedHookIdx = (this.selectedHookIdx + offset + HOOK_DATABASE.length) % HOOK_DATABASE.length;
    } else if (this.activeCategory === 'bait') {
      this.selectedBaitIdx = (this.selectedBaitIdx + offset + BAIT_DATABASE.length) % BAIT_DATABASE.length;
    }
    this.updateSelection();
  }
}
