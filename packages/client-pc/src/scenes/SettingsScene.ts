/**
 * @file SettingsScene.ts
 * @description 게임 설정(옵션) 씬
 *
 * 탭 구조:
 *  [단축키] — 단축키 목록 확인 (추후 리맵 지원)
 *  [음향]   — 효과음 / 배경음 볼륨 슬라이더
 *  [언어]   — 언어 선택 (현재: 한국어 전용)
 *
 * 씬 진입 경로: MainMenuScene [설정] → SettingsScene
 * 씬 복귀:       ESC / [닫기] 버튼 → scene.stop() + scene.resume('MainMenuScene')
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

// ─────────────────────────────────────────────
// 설정 저장 구조체
// ─────────────────────────────────────────────
export interface GameSettings {
  sfxVolume: number;    // 0.0 ~ 1.0
  bgmVolume: number;    // 0.0 ~ 1.0
  language: 'ko' | 'en';
}

const SETTINGS_STORAGE_KEY = 'pixelAngler_settings';

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GameSettings;
  } catch (_e) {/* ignore */}
  return { sfxVolume: 0.7, bgmVolume: 0.5, language: 'ko' };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// ─────────────────────────────────────────────
// 단축키 정의 목록
// ─────────────────────────────────────────────
const HOTKEY_LIST = [
  { key: '방향키 ↑↓←→', desc: '플레이어 이동 (이동 전용)' },
  { key: 'SPACE / ENTER', desc: '낚시 포인트 진입 / 캐스팅' },
  { key: 'E', desc: '건물 / NPC 상호작용' },
  { key: 'H', desc: '해루질 씬 진입' },
  { key: 'T', desc: '통발 관리 씬 진입' },
  { key: 'C', desc: '요리(캐치앤쿡) 씬 진입' },
  { key: 'U', desc: '제작대 씬 진입' },
  { key: 'L', desc: '면허 패널 토글' },
  { key: 'I', desc: '인벤토리 패널 토글' },
  { key: 'Q', desc: '퀘스트 저널 패널 토글' },
  { key: 'S', desc: '능력치(스탯) 패널 토글' },
  { key: 'M', desc: '미니맵 크기 순환' },
  { key: 'V', desc: '조류/수심 오버레이 토글' },
  { key: '1 ~ 8', desc: '퀵슬롯 선택' },
  { key: 'ESC', desc: '팝업 닫기 / 이전 화면 복귀' },
];

// ─────────────────────────────────────────────
// 씬 클래스
// ─────────────────────────────────────────────
type SettingsTab = 'hotkey' | 'audio' | 'language';

export class SettingsScene extends Phaser.Scene {
  private currentTab: SettingsTab = 'hotkey';
  private settings: GameSettings = loadSettings();
  private contentContainer!: Phaser.GameObjects.Container;

  // 탭 버튼 배경 참조 (강조 표시용)
  private tabBgs: Partial<Record<SettingsTab, Phaser.GameObjects.Graphics>> = {};

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    // 전체 배경
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050b14, 0.97).setOrigin(0, 0);

    // 패널 카드
    const panelW = 800;
    const panelH = 560;
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = (GAME_HEIGHT - panelH) / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a1628, 0.98);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    panelBg.lineStyle(2, 0x2a5a8a, 0.9);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

    // 헤더
    this.add.text(GAME_WIDTH / 2, panelY + 26, '⚙  설정 (Settings)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '22px',
      color: '#4af2a1',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // 닫기 버튼 (우측 상단 X)
    const closeBtn = this.add.container(panelX + panelW - 30, panelY + 26).setInteractive(
      new Phaser.Geom.Rectangle(-14, -14, 28, 28),
      Phaser.Geom.Rectangle.Contains,
    );
    const closeBg = this.add.graphics();
    closeBg.lineStyle(2, 0x4a6a8a, 0.8);
    closeBg.strokeCircle(0, 0, 12);
    const closeTxt = this.add.text(0, 0, '✕', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8faabf',
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    closeBtn.on('pointerdown', () => this.closeScene());
    closeBtn.on('pointerover', () => closeTxt.setColor('#ff6b6b'));
    closeBtn.on('pointerout', () => closeTxt.setColor('#8faabf'));

    // ── 탭 버튼 ────────────────────────────────────────
    const tabs: { id: SettingsTab; label: string }[] = [
      { id: 'hotkey', label: '⌨ 단축키' },
      { id: 'audio', label: '🔊 음향' },
      { id: 'language', label: '🌐 언어' },
    ];
    const tabStartX = panelX + 20;
    const tabY = panelY + 56;

    tabs.forEach((tab, i) => {
      const tabW = 140;
      const tx = tabStartX + i * (tabW + 8);

      const tabBg = this.add.graphics();
      this.tabBgs[tab.id] = tabBg;
      this.renderTabBg(tabBg, tx, tabY, tabW, 36, tab.id === this.currentTab);

      const tabText = this.add.text(tx + tabW / 2, tabY + 18, tab.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px',
        color: '#d0e8f5',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const tabHit = this.add.rectangle(tx + tabW / 2, tabY + 18, tabW, 36, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      tabHit.on('pointerdown', () => this.switchTab(tab.id));
      tabHit.on('pointerover', () => tabText.setColor('#4af2a1'));
      tabHit.on('pointerout', () => tabText.setColor('#d0e8f5'));
    });

    // ── 구분선 ──────────────────────────────────────────
    const divLine = this.add.graphics();
    divLine.lineStyle(1, 0x1f3d5a, 0.6);
    divLine.lineBetween(panelX + 10, panelY + 96, panelX + panelW - 10, panelY + 96);

    // ── 콘텐츠 컨테이너 ────────────────────────────────
    this.contentContainer = this.add.container(0, 0);
    this.renderTab();

    // ESC
    this.input.keyboard?.on('keydown-ESC', () => this.closeScene());

    this.cameras.main.fadeIn(200, 0, 10, 20);
  }

  private renderTabBg(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, active: boolean): void {
    g.clear();
    g.fillStyle(active ? 0x162a40 : 0x0a1628, 0.9);
    g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1.5, active ? 0x4af2a1 : 0x2a5a8a, active ? 1 : 0.6);
    g.strokeRoundedRect(x, y, w, h, 4);
  }

  private switchTab(tab: SettingsTab): void {
    const prevTab = this.currentTab;
    this.currentTab = tab;

    // 탭 배경 갱신
    const tabW = 140;
    const panelX = (GAME_WIDTH - 800) / 2;
    const tabStartX = panelX + 20;
    const tabY = (GAME_HEIGHT - 560) / 2 + 56;
    const tabs: SettingsTab[] = ['hotkey', 'audio', 'language'];

    tabs.forEach((id, i) => {
      const bg = this.tabBgs[id];
      if (bg) this.renderTabBg(bg, tabStartX + i * (tabW + 8), tabY, tabW, 36, id === tab);
    });

    if (prevTab !== tab) {
      this.contentContainer.removeAll(true);
      this.renderTab();
    }
  }

  private renderTab(): void {
    switch (this.currentTab) {
      case 'hotkey':   this.renderHotkeyTab(); break;
      case 'audio':    this.renderAudioTab(); break;
      case 'language': this.renderLanguageTab(); break;
    }
  }

  // ── 단축키 탭 ─────────────────────────────────────────
  private renderHotkeyTab(): void {
    const panelX = (GAME_WIDTH - 800) / 2;
    const panelY = (GAME_HEIGHT - 560) / 2;
    const startX = panelX + 30;
    const startY = panelY + 112;
    const colW = 360;

    const headerNote = this.add.text(startX, startY, '※ 단축키 변경은 추후 지원 예정입니다.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#607b8e',
      fontStyle: 'italic',
    });
    this.contentContainer.add(headerNote);

    HOTKEY_LIST.forEach((item, i) => {
      const col = i < 8 ? 0 : 1;
      const row = i < 8 ? i : i - 8;
      const ix = startX + col * (colW + 20);
      const iy = startY + 24 + row * 34;

      // 키 박스
      const keyBg = this.add.graphics();
      keyBg.fillStyle(0x0e1c2d, 0.9);
      keyBg.fillRoundedRect(ix, iy, 120, 26, 3);
      keyBg.lineStyle(1, 0x2a5a8a, 0.7);
      keyBg.strokeRoundedRect(ix, iy, 120, 26, 3);

      const keyText = this.add.text(ix + 60, iy + 13, item.key, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#4af2a1',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const descText = this.add.text(ix + 128, iy + 5, item.desc, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: '#a0b8c8',
      });

      this.contentContainer.add([keyBg, keyText, descText]);
    });
  }

  // ── 음향 탭 ───────────────────────────────────────────
  private renderAudioTab(): void {
    const panelX = (GAME_WIDTH - 800) / 2;
    const panelY = (GAME_HEIGHT - 560) / 2;
    const startX = panelX + 60;
    const startY = panelY + 130;

    const audioItems: { key: keyof GameSettings; label: string; desc: string }[] = [
      { key: 'sfxVolume', label: '효과음 볼륨 (SFX)', desc: '버튼 클릭, 낚시 입질, 캐스팅 등 효과음 음량' },
      { key: 'bgmVolume', label: '배경음 볼륨 (BGM)', desc: '배경 ASMR 파도소리, 갈매기 소리, 인게임 BGM 음량' },
    ];

    audioItems.forEach((item, i) => {
      const iy = startY + i * 110;

      const label = this.add.text(startX, iy, item.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '15px',
        color: '#d0e8f5',
        fontStyle: 'bold',
      });
      const desc = this.add.text(startX, iy + 22, item.desc, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: '#607b8e',
      });

      this.contentContainer.add([label, desc]);

      // 슬라이더 트랙
      const trackW = 500;
      const trackY = iy + 52;
      const track = this.add.graphics();
      track.fillStyle(0x1f3d5a, 0.8);
      track.fillRoundedRect(startX, trackY - 4, trackW, 8, 4);

      // 채워진 부분
      const currentVal = this.settings[item.key] as number;
      const fill = this.add.graphics();
      this.drawSliderFill(fill, startX, trackY - 4, trackW, currentVal);

      // 드래그 핸들
      const handleX = startX + currentVal * trackW;
      const handle = this.add.circle(handleX, trackY, 10, 0x4af2a1);

      // 현재 값 텍스트
      const valText = this.add.text(startX + trackW + 16, trackY, `${Math.round(currentVal * 100)}%`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#4af2a1',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      this.contentContainer.add([track, fill, handle, valText]);

      // 드래그 인터랙션 영역
      const dragZone = this.add.rectangle(startX + trackW / 2, trackY, trackW, 24, 0xffffff, 0)
        .setInteractive({ draggable: true, useHandCursor: true });

      let isDragging = false;
      dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        isDragging = true;
        this.updateSlider(pointer.x, startX, trackW, item.key, fill, handle, valText);
      });
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!isDragging) return;
        this.updateSlider(pointer.x, startX, trackW, item.key, fill, handle, valText);
      });
      this.input.on('pointerup', () => { isDragging = false; saveSettings(this.settings); });

      this.contentContainer.add(dragZone);
    });

    // 저장 안내
    const saveNote = this.add.text(startX, startY + 250, '✅ 슬라이더 조절 후 자동 저장됩니다.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#4af2a1',
      fontStyle: 'italic',
    });
    this.contentContainer.add(saveNote);
  }

  private drawSliderFill(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    trackW: number,
    ratio: number,
  ): void {
    g.clear();
    g.fillStyle(0x4af2a1, 0.8);
    g.fillRoundedRect(x, y, trackW * ratio, 8, 4);
  }

  private updateSlider(
    pointerX: number,
    startX: number,
    trackW: number,
    key: keyof GameSettings,
    fill: Phaser.GameObjects.Graphics,
    handle: Phaser.GameObjects.Arc,
    valText: Phaser.GameObjects.Text,
  ): void {
    const raw = Phaser.Math.Clamp((pointerX - startX) / trackW, 0, 1);
    const rounded = Math.round(raw * 10) / 10; // 0.1 단위
    (this.settings as Record<keyof GameSettings, number | string>)[key] = rounded;
    this.drawSliderFill(fill, startX, handle.y - 4, trackW, rounded);
    handle.setX(startX + rounded * trackW);
    valText.setText(`${Math.round(rounded * 100)}%`);
  }

  // ── 언어 탭 ───────────────────────────────────────────
  private renderLanguageTab(): void {
    const panelX = (GAME_WIDTH - 800) / 2;
    const panelY = (GAME_HEIGHT - 560) / 2;
    const startX = panelX + 60;
    const startY = panelY + 130;

    const langTitle = this.add.text(startX, startY, '🌐 게임 언어 설정', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '16px',
      color: '#d0e8f5',
      fontStyle: 'bold',
    });
    this.contentContainer.add(langTitle);

    const langs: { id: 'ko' | 'en'; nameKo: string; desc: string }[] = [
      { id: 'ko', nameKo: '한국어', desc: '모든 텍스트를 한국어로 표시합니다. (기본값)' },
      { id: 'en', nameKo: 'English (예정)', desc: '영문 지원은 추후 업데이트될 예정입니다.' },
    ];

    langs.forEach((lang, i) => {
      const iy = startY + 50 + i * 80;
      const isSelected = this.settings.language === lang.id;
      const isAvailable = lang.id === 'ko'; // en은 미구현

      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0x162a40 : 0x0e1c2d, 0.9);
      bg.fillRoundedRect(startX, iy, 460, 60, 5);
      bg.lineStyle(2, isSelected ? 0x4af2a1 : 0x2a5a8a, isSelected ? 1 : 0.5);
      bg.strokeRoundedRect(startX, iy, 460, 60, 5);

      const nameText = this.add.text(startX + 20, iy + 12, lang.nameKo, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '16px',
        color: isSelected ? '#4af2a1' : (isAvailable ? '#d0e8f5' : '#4a6a8a'),
        fontStyle: 'bold',
      });
      const descText = this.add.text(startX + 20, iy + 36, lang.desc, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: '#8faabf',
      });

      const checkIcon = isSelected
        ? this.add.text(startX + 430, iy + 22, '✓', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#4af2a1',
            fontStyle: 'bold',
          }).setOrigin(0.5)
        : null;

      this.contentContainer.add([bg, nameText, descText, ...(checkIcon ? [checkIcon] : [])]);

      if (isAvailable) {
        const hit = this.add.rectangle(startX + 230, iy + 30, 460, 60, 0xffffff, 0)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          this.settings.language = lang.id;
          saveSettings(this.settings);
          this.contentContainer.removeAll(true);
          this.renderTab();
        });
        this.contentContainer.add(hit);
      }
    });

    const note = this.add.text(startX, startY + 230, '※ 언어를 변경하면 즉시 저장됩니다. 재시작 없이 일부 텍스트는 다음 씬 진입 시 반영됩니다.', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#607b8e',
      fontStyle: 'italic',
      wordWrap: { width: 660 },
    });
    this.contentContainer.add(note);
  }

  // ── 씬 닫기 ───────────────────────────────────────────
  private closeScene(): void {
    saveSettings(this.settings);
    this.cameras.main.fadeOut(200, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('MainMenuScene');
    });
  }
}
