/**
 * @file WorldMapScene.ts
 * @description 한국 지도 출조지 선택 씬
 * 
 * 플레이어는 거제, 양양, 제주, 여수 등 실제 출조지를 선택하여 출조(FieldScene)할 수 있습니다.
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { SPOT_DATABASE } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

export class WorldMapScene extends Phaser.Scene {
  private selectedIndex = 0;
  private spots = SPOT_DATABASE;
  private spotTexts: Phaser.GameObjects.Text[] = [];
  private mapGraphics?: Phaser.GameObjects.Graphics;
  private infoPanel?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    // 배경
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050b14).setOrigin(0, 0);

    // 타이틀
    this.add.text(40, 40, '출조지 선택 (South Korea Map)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '24px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });

    this.add.text(40, 75, '출조할 지역을 선택하고 스페이스바 또는 엔터를 누르세요.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#8faabf',
    });

    // 지도 렌더링
    this.drawKoreaMap();

    // 출조지 리스트
    this.createSpotList();

    // 상세 정보 패널
    this.createInfoPanel();

    // 키 입력 설정
    this.setupInput();

    this.updateSelection();

    // 페이드인 효과
    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  private drawKoreaMap(): void {
    this.mapGraphics = this.add.graphics();
    this.mapGraphics.lineStyle(2, 0x1f3d5a, 0.8);
    this.mapGraphics.fillStyle(0x0e1c2d, 0.9);

    // 대한민국 영토 근사 다각형 (2D 픽셀 스타일 단순화)
    const mapPoints = [
      new Phaser.Geom.Point(850, 100), // 북한/러시아 경계
      new Phaser.Geom.Point(920, 120),
      new Phaser.Geom.Point(950, 180), // 동해안선 시작
      new Phaser.Geom.Point(960, 320), // 양양/속초 부근
      new Phaser.Geom.Point(980, 420), // 포항 부근
      new Phaser.Geom.Point(990, 480), // 부산 부근
      new Phaser.Geom.Point(930, 540), // 거제/남해안선
      new Phaser.Geom.Point(860, 550), // 여수/목포 부근
      new Phaser.Geom.Point(800, 510), // 진도
      new Phaser.Geom.Point(810, 420), // 태안/군산 서해안선
      new Phaser.Geom.Point(820, 320), // 인천 부근
      new Phaser.Geom.Point(830, 240), // 해주 부근
    ];

    this.mapGraphics.beginPath();
    this.mapGraphics.moveTo(mapPoints[0].x, mapPoints[0].y);
    for (let i = 1; i < mapPoints.length; i++) {
      this.mapGraphics.lineTo(mapPoints[i].x, mapPoints[i].y);
    }
    this.mapGraphics.closePath();
    this.mapGraphics.fillPath();
    this.mapGraphics.strokePath();

    // 제주도
    this.mapGraphics.fillEllipse(850, 595, 40, 20);
    this.mapGraphics.strokeEllipse(850, 595, 40, 20);

    // 독도/울릉도
    this.mapGraphics.fillCircle(1050, 360, 5);
    this.mapGraphics.strokeCircle(1050, 360, 5);
    this.mapGraphics.fillCircle(1080, 370, 3);
    this.mapGraphics.strokeCircle(1080, 370, 3);

    // 휴전선 표시
    this.mapGraphics.lineStyle(1.5, 0x6e2f2f, 0.7);
    this.mapGraphics.lineBetween(825, 290, 955, 305);
  }

  private createSpotList(): void {
    const listX = 40;
    const listY = 130;

    this.spots.forEach((spot, index) => {
      const spotText = this.add.text(listX, listY + index * 45, `${spot.name} (${spot.regionName})`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '18px',
        color: '#a0b8c8',
      });
      
      this.spotTexts.push(spotText);

      // 지도에 마커 추가
      const mapPos = this.getMapCoordinate(spot.latitude, spot.longitude);
      const marker = this.add.circle(mapPos.x, mapPos.y, 6, 0xff3333);
      const markerRing = this.add.circle(mapPos.x, mapPos.y, 12, 0xff3333, 0);
      markerRing.setStrokeStyle(1.5, 0xff3333);

      // 애니메이션
      this.tweens.add({
        targets: markerRing,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 1500,
        repeat: -1,
      });

      // 마커 객체 연동
      spotText.setData('marker', marker);
      spotText.setData('markerRing', markerRing);
    });
  }

  private createInfoPanel(): void {
    const panelX = 420;
    const panelY = 130;

    this.infoPanel = this.add.container(panelX, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e1c2d, 0.9);
    bg.fillRoundedRect(0, 0, 340, 450, 4);
    bg.lineStyle(1.5, 0x2a5a8a, 0.8);
    bg.strokeRoundedRect(0, 0, 340, 450, 4);

    this.infoPanel.add(bg);

    const title = this.add.text(20, 20, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '20px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });
    
    const desc = this.add.text(20, 60, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#a0b8c8',
      wordWrap: { width: 300 },
    });

    const targetSpeciesLabel = this.add.text(20, 180, '주요 어종:', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#c8a060',
      fontStyle: 'bold',
    });

    const targetSpecies = this.add.text(20, 205, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#e8f4fd',
      wordWrap: { width: 300 },
    });

    const facilitiesLabel = this.add.text(20, 300, '편의 시설:', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#c8a060',
      fontStyle: 'bold',
    });

    const facilities = this.add.text(20, 325, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px',
      color: '#e8f4fd',
      wordWrap: { width: 300 },
    });

    const backPrompt = this.add.text(20, 410, 'ESC: 메인 메뉴로 돌아가기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#607b8e',
    });

    this.infoPanel.add([title, desc, targetSpeciesLabel, targetSpecies, facilitiesLabel, facilities, backPrompt]);
  }

  private updateSelection(): void {
    this.spotTexts.forEach((text, index) => {
      const marker = text.getData('marker') as Phaser.GameObjects.Arc;
      const markerRing = text.getData('markerRing') as Phaser.GameObjects.Arc;

      if (index === this.selectedIndex) {
        text.setColor('#4af2a1');
        text.setText(`▶ ${this.spots[index].name}`);
        text.setFontSize(20);
        
        marker.setFillStyle(0x4af2a1);
        markerRing.setStrokeStyle(1.5, 0x4af2a1);
        marker.setScale(1.4);

        // 패널 정보 업데이트
        const spot = this.spots[index];
        const titleText = this.infoPanel?.getAt(1) as Phaser.GameObjects.Text;
        const descText = this.infoPanel?.getAt(2) as Phaser.GameObjects.Text;
        const speciesText = this.infoPanel?.getAt(4) as Phaser.GameObjects.Text;
        const facilitiesText = this.infoPanel?.getAt(6) as Phaser.GameObjects.Text;

        titleText.setText(spot.name);
        descText.setText(spot.description);
        speciesText.setText(spot.mainSpeciesIds.join(', '));
        facilitiesText.setText(spot.facilities.join(', '));
      } else {
        text.setColor('#a0b8c8');
        text.setText(this.spots[index].name);
        text.setFontSize(18);

        marker.setFillStyle(0xff3333);
        markerRing.setStrokeStyle(1.5, 0xff3333);
        marker.setScale(1.0);
      }
    });
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex - 1 + this.spots.length) % this.spots.length;
      this.updateSelection();
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.spots.length;
      this.updateSelection();
    });

    const enterAction = () => {
      const selectedSpot = this.spots[this.selectedIndex];
      GameState.setCurrentSpot(selectedSpot.id);
      
      this.cameras.main.fadeOut(300, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('FieldScene', { spotId: selectedSpot.id });
      });
    };

    this.input.keyboard?.on('keydown-ENTER', enterAction);
    this.input.keyboard?.on('keydown-SPACE', enterAction);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });
  }

  /**
   * 한국 해역 위도/경도를 지도 픽셀 좌표로 변환
   */
  private getMapCoordinate(lat: number, lon: number): { x: number; y: number } {
    // 대한민국 위경도 범위 대략: 
    // 위도 33.0 (제주) ~ 38.5 (고성)
    // 경도 125.0 (서해) ~ 129.5 (동해/부산)
    
    // 지도의 좌표 크기 바인딩: x: 800~1000, y: 150~600
    const mapMinX = 800;
    const mapMaxX = 1000;
    const mapMinY = 150;
    const mapMaxY = 600;

    const latMin = 38.5;
    const latMax = 33.0; // 위에서 아래로 Y가 커지므로
    const lonMin = 125.0;
    const lonMax = 129.5;

    const x = mapMinX + ((lon - lonMin) / (lonMax - lonMin)) * (mapMaxX - mapMinX);
    const y = mapMinY + ((lat - latMin) / (latMax - latMin)) * (mapMaxY - mapMinY);

    return { x, y };
  }
}
