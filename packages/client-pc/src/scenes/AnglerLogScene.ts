/**
 * @file AnglerLogScene.ts
 * @description 조과첩(실데이터 기록) 및 어종 도감 씬
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import { FISH_DATABASE, getSpotById } from '@tra/core';

export class AnglerLogScene extends Phaser.Scene {
  private currentTab: 'encyclopedia' | 'history' = 'encyclopedia';
  private tabContainer?: Phaser.GameObjects.Container;

  // 조과 기록용 정렬/필터/페이징 상태
  private filterSpotId: string = 'all';
  private sortBy: 'latest' | 'length' | 'weight' = 'latest';
  private currentPage = 0;
  private readonly ITEMS_PER_PAGE = 5;

  // 탭 버튼 오브젝트 참조
  private tabBtnEncyBg?: Phaser.GameObjects.Rectangle;
  private tabBtnHistBg?: Phaser.GameObjects.Rectangle;

  /** 나가기 시 resume할 씬 (메인 메뉴/필드 어디서든 진입 가능) */
  private returnScene = 'FieldScene';

  constructor() {
    super({ key: 'AnglerLogScene' });
  }

  init(data?: { returnScene?: string }): void {
    this.returnScene = data?.returnScene ?? 'FieldScene';
  }

  create(): void {
    const { width, height } = this.scale;

    // 전체 다크 배경
    this.add.rectangle(0, 0, width, height, 0x050b14).setOrigin(0, 0);

    // 타이틀
    this.add.text(40, 30, '📖 꾼의 조과첩 & 어종 도감 (Angler\'s Log)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '24px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });

    this.add.text(40, 65, 'ESC 키 또는 상단 [나가기] 버튼을 누르면 월드로 귀환합니다.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#8faabf',
    });

    // ─────────────────────────────────────────────
    // [UI] 나가기 버튼
    // ─────────────────────────────────────────────
    const backBtn = this.add.container(width - 120, 30).setInteractive(
      new Phaser.Geom.Rectangle(-40, -14, 80, 28),
      Phaser.Geom.Rectangle.Contains
    );
    const backBg = this.add.rectangle(0, 0, 80, 28, 0x1f3d5a).setStrokeStyle(1.5, 0x2a5a8a);
    const backText = this.add.text(0, 0, '나가기', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    backBtn.add([backBg, backText]);
    backBtn.on('pointerdown', () => this.onBack());
    backBtn.on('pointerover', () => backBg.setFillStyle(0x2a5a8a));
    backBtn.on('pointerout', () => backBg.setFillStyle(0x1f3d5a));

    // ─────────────────────────────────────────────
    // [UI] 탭 버튼 영역
    // ─────────────────────────────────────────────
    const tabY = 110;

    // 1) 어종 도감 탭 버튼
    const tabBtnEncy = this.add.container(140, tabY).setInteractive(
      new Phaser.Geom.Rectangle(-80, -16, 160, 32),
      Phaser.Geom.Rectangle.Contains
    );
    this.tabBtnEncyBg = this.add.rectangle(0, 0, 160, 32, 0x0e1c2d).setStrokeStyle(1.5, 0x2a5a8a);
    const tabBtnEncyText = this.add.text(0, 0, '어종 도감', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#e8f4fd',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    tabBtnEncy.add([this.tabBtnEncyBg, tabBtnEncyText]);
    tabBtnEncy.on('pointerdown', () => this.switchTab('encyclopedia'));

    // 2) 조과 기록 탭 버튼
    const tabBtnHist = this.add.container(310, tabY).setInteractive(
      new Phaser.Geom.Rectangle(-80, -16, 160, 32),
      Phaser.Geom.Rectangle.Contains
    );
    this.tabBtnHistBg = this.add.rectangle(0, 0, 160, 32, 0x0e1c2d).setStrokeStyle(1.5, 0x2a5a8a);
    const tabBtnHistText = this.add.text(0, 0, '나의 조과 기록', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '14px',
      color: '#e8f4fd',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    tabBtnHist.add([this.tabBtnHistBg, tabBtnHistText]);
    tabBtnHist.on('pointerdown', () => this.switchTab('history'));

    // ESC 설정
    this.input.keyboard?.on('keydown-ESC', () => this.onBack());

    // 콘텐츠 렌더링 컨테이너
    this.tabContainer = this.add.container(0, 0);

    // 기본 탭 렌더링
    this.switchTab('encyclopedia');

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  private onBack(): void {
    this.cameras.main.fadeOut(220, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume(this.returnScene);
    });
  }

  private switchTab(tab: 'encyclopedia' | 'history'): void {
    this.currentTab = tab;

    // 활성 탭 버튼 시각적 효과 설정
    if (tab === 'encyclopedia') {
      this.tabBtnEncyBg?.setFillStyle(0x2a5a8a);
      this.tabBtnHistBg?.setFillStyle(0x0e1c2d);
    } else {
      this.tabBtnEncyBg?.setFillStyle(0x0e1c2d);
      this.tabBtnHistBg?.setFillStyle(0x2a5a8a);
    }

    this.renderCurrentTab();
  }

  private renderCurrentTab(): void {
    if (this.tabContainer) {
      this.tabContainer.removeAll(true);
    }

    if (this.currentTab === 'encyclopedia') {
      this.renderEncyclopedia();
    } else {
      this.renderHistory();
    }
  }

  // ─────────────────────────────────────────────
  // 1. 어종 도감 탭 렌더링
  // ─────────────────────────────────────────────
  private renderEncyclopedia(): void {
    const startX = 40;
    const startY = 160;
    const itemW = 220;
    const itemH = 150;
    const colCount = 4;

    const records = GameState.player.caughtFishHistory;

    FISH_DATABASE.forEach((fish, idx) => {
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);

      const x = startX + col * (itemW + 20);
      const y = startY + row * (itemH + 20);

      // 카드 배경
      const card = this.add.graphics();
      card.fillStyle(0x0e1c2d);
      card.fillRoundedRect(x, y, itemW, itemH, 4);
      card.lineStyle(1.5, 0x2a5a8a, 0.8);
      card.strokeRoundedRect(x, y, itemW, itemH, 4);
      this.tabContainer?.add(card);

      const caughtCount = records.filter(r => r.fishSpeciesId === fish.id).length;
      const bestRecord = GameState.player.personalRecords[fish.id] || 0;

      if (caughtCount > 0) {
        const nameText = this.add.text(x + 15, y + 15, fish.nameKo, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '16px',
          color: '#4af2a1',
          fontStyle: 'bold'
        });
        const sciText = this.add.text(x + 15, y + 38, fish.scientificName, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#5a8fab',
          fontStyle: 'italic'
        });
        const recordText = this.add.text(x + 15, y + 65, `최대어: ${bestRecord} cm`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '12px',
          color: '#e8f4fd'
        });
        const countText = this.add.text(x + 15, y + 85, `누적 조과: ${caughtCount} 수`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '12px',
          color: '#e8f4fd'
        });
        const priceText = this.add.text(x + 15, y + 110, `횟값: kg당 ${fish.sashimiValuePerKg.toLocaleString()}원`, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '11px',
          color: '#c8a060'
        });

        this.tabContainer?.add([nameText, sciText, recordText, countText, priceText]);
      } else {
        const secretText = this.add.text(x + itemW / 2, y + itemH / 2 - 10, '???', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '16px',
          color: '#2a5a8a'
        }).setOrigin(0.5);
        const descText = this.add.text(x + itemW / 2, y + itemH / 2 + 15, '미발견', {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '11px',
          color: '#1f3d5a'
        }).setOrigin(0.5);

        this.tabContainer?.add([secretText, descText]);
      }
    });
  }

  // ─────────────────────────────────────────────
  // 2. 조과 기록 탭 렌더링
  // ─────────────────────────────────────────────
  private renderHistory(): void {
    const { width, height } = this.scale;

    // ─────────────────────────────────────────────
    // 정렬 및 필터 헤더 도구 생성
    // ─────────────────────────────────────────────
    const controlY = 160;

    // 1) 필터 텍스트 라벨
    const filterLabel = this.add.text(40, controlY, '출조지 필터:', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#8faabf',
    });
    this.tabContainer?.add(filterLabel);

    // 필터 버튼들 (전체, 거제, 양양, 제주, 여수)
    const filters = [
      { id: 'all', label: '전체' },
      { id: 'geoje_gujora_breakwater', label: '거제 방파제' },
      { id: 'geoje_mangchi_rocky', label: '거제 갯바위' },
      { id: 'yangyang_naksansa_breakwater', label: '양양 낙산' },
      { id: 'jeju_seongsan_breakwater', label: '제주 성산' },
      { id: 'yeosu_odongdo_boat', label: '여수 선상' },
    ];

    let filterBtnX = 120;
    filters.forEach((filter) => {
      const isSelected = this.filterSpotId === filter.id;
      const btn = this.add.container(filterBtnX, controlY + 6).setInteractive(
        new Phaser.Geom.Rectangle(-35, -10, 70, 20),
        Phaser.Geom.Rectangle.Contains
      );
      const bg = this.add.rectangle(0, 0, 70, 20, isSelected ? 0x2a5a8a : 0x0e1c2d).setStrokeStyle(1, 0x1f3d5a);
      const text = this.add.text(0, 0, filter.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '9px',
        color: isSelected ? '#4af2a1' : '#a0b8c8',
      }).setOrigin(0.5);

      btn.add([bg, text]);
      btn.on('pointerdown', () => {
        this.filterSpotId = filter.id;
        this.currentPage = 0; // 필터 변경 시 페이지 초기화
        this.renderCurrentTab();
      });
      this.tabContainer?.add(btn);
      filterBtnX += 76;
    });

    // 2) 정렬 텍스트 라벨
    const sortLabel = this.add.text(width - 320, controlY, '정렬 방식:', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '12px',
      color: '#8faabf',
    });
    this.tabContainer?.add(sortLabel);

    // 정렬 버튼들 (최신순, 최대어순, 무게순)
    const sorts = [
      { id: 'latest', label: '최신순' },
      { id: 'length', label: '최대어순' },
      { id: 'weight', label: '무게순' },
    ];

    let sortBtnX = width - 240;
    sorts.forEach((sort) => {
      const isSelected = this.sortBy === sort.id;
      const btn = this.add.container(sortBtnX, controlY + 6).setInteractive(
        new Phaser.Geom.Rectangle(-30, -10, 60, 20),
        Phaser.Geom.Rectangle.Contains
      );
      const bg = this.add.rectangle(0, 0, 60, 20, isSelected ? 0x2a5a8a : 0x0e1c2d).setStrokeStyle(1, 0x1f3d5a);
      const text = this.add.text(0, 0, sort.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '9px',
        color: isSelected ? '#4af2a1' : '#a0b8c8',
      }).setOrigin(0.5);

      btn.add([bg, text]);
      btn.on('pointerdown', () => {
        this.sortBy = sort.id as any;
        this.currentPage = 0;
        this.renderCurrentTab();
      });
      this.tabContainer?.add(btn);
      sortBtnX += 66;
    });

    // 구분선
    const divider = this.add.graphics();
    divider.lineStyle(1.5, 0x1f3d5a, 0.6);
    divider.lineBetween(40, 195, width - 40, 195);
    this.tabContainer?.add(divider);

    // ─────────────────────────────────────────────
    // 데이터 필터링 및 정렬 처리
    // ─────────────────────────────────────────────
    let rawLogs = [...GameState.player.caughtFishHistory];

    // 필터링
    if (this.filterSpotId !== 'all') {
      rawLogs = rawLogs.filter(log => log.locationId === this.filterSpotId);
    }

    // 정렬
    rawLogs.sort((a, b) => {
      if (this.sortBy === 'latest') {
        return new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime();
      } else if (this.sortBy === 'length') {
        return b.lengthCm - a.lengthCm;
      } else {
        return b.weightGram - a.weightGram;
      }
    });

    // ─────────────────────────────────────────────
    // 목록 렌더링 (페이징 적용)
    // ─────────────────────────────────────────────
    const logStartY = 210;
    const logH = 50;

    const pageStart = this.currentPage * this.ITEMS_PER_PAGE;
    const pageItems = rawLogs.slice(pageStart, pageStart + this.ITEMS_PER_PAGE);

    if (pageItems.length === 0) {
      const emptyText = this.add.text(width / 2, logStartY + 100, '기록된 조과 정보가 없습니다.', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '14px',
        color: '#607b8e',
      }).setOrigin(0.5);
      this.tabContainer?.add(emptyText);
    } else {
      pageItems.forEach((log, index) => {
        const itemY = logStartY + index * (logH + 10);
        const fish = FISH_DATABASE.find(f => f.id === log.fishSpeciesId);
        const spot = getSpotById(log.locationId);

        const rowBg = this.add.rectangle(width / 2, itemY + logH / 2, width - 80, logH, 0x0e1c2d).setStrokeStyle(1.0, 0x1f3d5a);
        this.tabContainer?.add(rowBg);

        // 어종명 및 크기 정보
        const nameTxt = `${fish ? fish.nameKo : '알 수 없는 어종'}   ${log.lengthCm} cm  /  ${(log.weightGram / 1000).toFixed(2)} kg`;
        const nameTextObj = this.add.text(60, itemY + 10, nameTxt, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '14px',
          color: log.isBestRecord ? '#ffeeaa' : '#e8f4fd',
          fontStyle: log.isBestRecord ? 'bold' : 'normal',
        });
        this.tabContainer?.add(nameTextObj);

        // 왕관 표시 (최대어일 때)
        if (log.isBestRecord) {
          const crownText = this.add.text(60 + nameTextObj.width + 10, itemY + 12, '👑 최대어', {
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: '10px',
            color: '#ffdd44',
            fontStyle: 'bold',
          });
          this.tabContainer?.add(crownText);
        }

        // 장비, 미끼 정보 및 수온/물때 정보
        const dateStr = new Date(log.caughtAt).toLocaleDateString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        const subTxt = `📍 ${spot ? spot.name : '알 수 없는 낚시터'}  |  ⚙️ ${log.tackleUsed.rigType.replace('_flowing', '').replace('_sinker', '')} (${log.baitUsed})  |  🌡️ ${log.waterTempC}°C  |  🌊 ${log.tidePhase}물  |  📅 ${dateStr}`;
        const subTextObj = this.add.text(60, itemY + 30, subTxt, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '11px',
          color: '#8faabf',
        });
        this.tabContainer?.add(subTextObj);
      });
    }

    // ─────────────────────────────────────────────
    // [UI] 페이징 네비게이션 컨트롤러
    // ─────────────────────────────────────────────
    const maxPage = Math.max(0, Math.ceil(rawLogs.length / this.ITEMS_PER_PAGE) - 1);
    const navY = height - 45;

    // 이전 페이지 버튼
    const prevBtn = this.add.container(width / 2 - 80, navY).setInteractive(
      new Phaser.Geom.Rectangle(-40, -12, 80, 24),
      Phaser.Geom.Rectangle.Contains
    );
    const prevBg = this.add.rectangle(0, 0, 80, 24, 0x1f3d5a).setStrokeStyle(1.0, 0x2a5a8a);
    const prevText = this.add.text(0, 0, '◀ 이전', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: this.currentPage > 0 ? '#ffffff' : '#607b8e',
    }).setOrigin(0.5);
    prevBtn.add([prevBg, prevText]);
    if (this.currentPage > 0) {
      prevBtn.on('pointerdown', () => {
        this.currentPage--;
        this.renderCurrentTab();
      });
      prevBtn.on('pointerover', () => prevBg.setFillStyle(0x2a5a8a));
      prevBtn.on('pointerout', () => prevBg.setFillStyle(0x1f3d5a));
    }
    this.tabContainer?.add(prevBtn);

    // 페이지 인덱스 표시
    const pageIndexText = this.add.text(width / 2, navY, `${this.currentPage + 1} / ${maxPage + 1}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e8f4fd',
    }).setOrigin(0.5);
    this.tabContainer?.add(pageIndexText);

    // 다음 페이지 버튼
    const nextBtn = this.add.container(width / 2 + 80, navY).setInteractive(
      new Phaser.Geom.Rectangle(-40, -12, 80, 24),
      Phaser.Geom.Rectangle.Contains
    );
    const nextBg = this.add.rectangle(0, 0, 80, 24, 0x1f3d5a).setStrokeStyle(1.0, 0x2a5a8a);
    const nextText = this.add.text(0, 0, '다음 ▶', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: this.currentPage < maxPage ? '#ffffff' : '#607b8e',
    }).setOrigin(0.5);
    nextBtn.add([nextBg, nextText]);
    if (this.currentPage < maxPage) {
      nextBtn.on('pointerdown', () => {
        this.currentPage++;
        this.renderCurrentTab();
      });
      nextBtn.on('pointerover', () => nextBg.setFillStyle(0x2a5a8a));
      nextBtn.on('pointerout', () => nextBg.setFillStyle(0x1f3d5a));
    }
    this.tabContainer?.add(nextBtn);
  }
}
