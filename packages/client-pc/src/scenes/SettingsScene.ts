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
  /** 1인칭 낚시 뷰 낚싯대(로드) 화면 위치 — 화면 중앙 기준 좌/우 */
  rodSide: 'left' | 'right';
  /** 릴 핸들(감는 손잡이) 위치 — 화면이 아닌 **로드 기준** 좌/우 */
  reelHandle: 'left' | 'right';
}

const SETTINGS_STORAGE_KEY = 'pixelAngler_settings';

const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 0.7, bgmVolume: 0.5, language: 'ko',
  rodSide: 'right', reelHandle: 'left',
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    // 기존 저장본에 신규 필드가 없을 수 있으므로 기본값과 병합
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
  } catch (_e) {/* ignore */}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// ─────────────────────────────────────────────
// 단축키 정의 목록 (2026-07-24 현행화 — 필드/1인칭 낚시/파이팅)
// ─────────────────────────────────────────────
interface HotkeyEntry { key: string; desc: string; }
interface HotkeySection { title: string; items: HotkeyEntry[]; }

const HOTKEY_SECTIONS: HotkeySection[] = [
  {
    title: '필드 (탑다운)',
    items: [
      { key: '방향키', desc: '캐릭터 이동' },
      { key: '좌클릭(유지)', desc: '캐스팅 차지 → 착수 시 낚시 진입' },
      { key: '좌클릭', desc: '클릭 위치로 이동' },
      { key: 'E', desc: '장비 패널 (건물 근접 시 상호작용 우선)' },
      { key: 'R', desc: '자전거 승·하차 (탑승 시 이동 2배)' },
      { key: 'B', desc: '쿨러(어창) 열기' },
      { key: 'S', desc: '능력치(스탯) 패널' },
      { key: 'U', desc: '활용 (요리·채비 조립)' },
      { key: 'I', desc: '인벤토리 토글' },
      { key: 'L', desc: '면허 패널 토글' },
      { key: 'Q', desc: '퀘스트 저널 토글' },
      { key: 'M', desc: '미니맵 크기 순환' },
      { key: 'V', desc: '조류/수심 오버레이 토글' },
      { key: '1 ~ 8', desc: '퀵슬롯 선택' },
      { key: 'ESC', desc: '팝업 닫기(LIFO) / 일시정지 메뉴' },
    ],
  },
  {
    title: '1인칭 낚시 (채비 흘림)',
    items: [
      { key: '우클릭', desc: '챔질 (3단계에 성공률 최고)' },
      { key: '좌클릭(유지)', desc: '릴링 (발앞까지 감으면 채비 회수)' },
      { key: '좌클릭 탭', desc: '호핑 (루어 머리 들기)' },
      { key: '좌클릭 더블탭', desc: '트위칭 / 저킹' },
      { key: '←/→', desc: '채비 횡 이동 (조류 방향·세기 연동)' },
      { key: '↑ (유지)', desc: '리프트 (채비 수심 상승)' },
      { key: 'H', desc: '뒷줄견제 (그 지점 홀드)' },
      { key: 'C', desc: '밑밥 투척 (동조율)' },
      { key: 'I', desc: '인벤토리 토글' },
      { key: 'SPACE', desc: '다시 캐스팅 (결과 화면)' },
      { key: 'F1 / ?', desc: '도움말 가이드' },
      { key: 'ESC', desc: '종료 (인벤→쿨러→나가기 LIFO)' },
    ],
  },
  {
    title: '1인칭 파이팅',
    items: [
      { key: '좌클릭(유지)', desc: '릴링 (거리 좁힘)' },
      { key: '←/→', desc: '로드 스티어 (+릴링 = 물고기 횡 견인)' },
      { key: '↑ (유지)', desc: '버티기 (홀드 — 구 H)' },
    ],
  },
];

// ─────────────────────────────────────────────
// 씬 클래스
// ─────────────────────────────────────────────
type SettingsTab = 'hotkey' | 'fishing' | 'audio' | 'language';

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
      { id: 'fishing', label: '낚시' },
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
    const tabs: SettingsTab[] = ['hotkey', 'fishing', 'audio', 'language'];

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
      case 'fishing':  this.renderFishingTab(); break;
      case 'audio':    this.renderAudioTab(); break;
      case 'language': this.renderLanguageTab(); break;
    }
  }

  // ── 낚시 탭 (1인칭 로드/릴 위치) ──────────────────────
  private renderFishingTab(): void {
    const panelX = (GAME_WIDTH - 800) / 2;
    const panelY = (GAME_HEIGHT - 560) / 2;
    const startX = panelX + 60;
    const startY = panelY + 130;

    const items: {
      key: 'rodSide' | 'reelHandle'; label: string; desc: string;
      options: { value: 'left' | 'right'; label: string }[];
    }[] = [
      {
        key: 'rodSide', label: '낚싯대(로드) 위치',
        desc: '1인칭 낚시 뷰에서 낚싯대가 놓일 화면 방향 — 화면 중앙 기준 좌/우 반대편에 그려집니다.',
        options: [{ value: 'left', label: '좌 (좌수)' }, { value: 'right', label: '우 (우수)' }],
      },
      {
        key: 'reelHandle', label: '릴 핸들 위치',
        desc: '로드에 장착된 스피닝릴의 핸들(감는 손잡이) 방향 — 화면이 아닌 로드 기준 좌/우입니다.',
        options: [{ value: 'left', label: '좌' }, { value: 'right', label: '우' }],
      },
    ];

    items.forEach((item, i) => {
      const iy = startY + i * 130;

      const label = this.add.text(startX, iy, item.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#d0e8f5', fontStyle: 'bold',
      });
      const desc = this.add.text(startX, iy + 22, item.desc, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#607b8e',
        wordWrap: { width: 640 },
      });
      this.contentContainer.add([label, desc]);

      item.options.forEach((opt, j) => {
        const bx = startX + j * 180;
        const by = iy + 52;
        const selected = this.settings[item.key] === opt.value;

        const bg = this.add.graphics();
        bg.fillStyle(selected ? 0x162a40 : 0x0e1c2d, 0.9);
        bg.fillRoundedRect(bx, by, 164, 40, 5);
        bg.lineStyle(2, selected ? 0x4af2a1 : 0x2a5a8a, selected ? 1 : 0.5);
        bg.strokeRoundedRect(bx, by, 164, 40, 5);

        const txt = this.add.text(bx + 82, by + 20, opt.label, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px',
          color: selected ? '#4af2a1' : '#a0b8c8', fontStyle: 'bold',
        }).setOrigin(0.5);

        const hit = this.add.rectangle(bx + 82, by + 20, 164, 40, 0xffffff, 0)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          this.settings[item.key] = opt.value;
          saveSettings(this.settings);
          this.contentContainer.removeAll(true);
          this.renderTab();
        });

        this.contentContainer.add([bg, txt, hit]);
      });
    });

    const note = this.add.text(startX, startY + 280,
      '※ 변경 즉시 저장되며, 다음 1인칭 낚시 진입부터 반영됩니다.', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#4af2a1', fontStyle: 'italic',
      });
    this.contentContainer.add(note);
  }

  // ── 단축키 탭 (섹션별 2열: 좌=필드 / 우=1인칭 낚시·파이팅) ─────────────────
  private renderHotkeyTab(): void {
    const panelX = (GAME_WIDTH - 800) / 2;
    const panelY = (GAME_HEIGHT - 560) / 2;
    const startX = panelX + 24;
    const startY = panelY + 106;
    const colW = 374;

    const headerNote = this.add.text(startX, startY, '※ 이번 업데이트까지의 조작을 반영했습니다. 단축키 변경(리맵)은 추후 지원 예정입니다.', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#607b8e', fontStyle: 'italic',
    });
    this.contentContainer.add(headerNote);

    // 좌측 열 = 필드, 우측 열 = 낚시 + 파이팅
    const columns: { x: number; sections: HotkeySection[] }[] = [
      { x: startX, sections: [HOTKEY_SECTIONS[0]] },
      { x: startX + colW + 8, sections: [HOTKEY_SECTIONS[1], HOTKEY_SECTIONS[2]] },
    ];
    const keyW = 118;
    const rowH = 22;

    columns.forEach((col) => {
      let y = startY + 20;
      col.sections.forEach((sec) => {
        const header = this.add.text(col.x, y, `▸ ${sec.title}`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#5cd0ff', fontStyle: 'bold',
        });
        this.contentContainer.add(header);
        y += 22;

        sec.items.forEach((item) => {
          const keyBg = this.add.graphics();
          keyBg.fillStyle(0x0e1c2d, 0.9);
          keyBg.fillRoundedRect(col.x, y, keyW, rowH - 3, 3);
          keyBg.lineStyle(1, 0x2a5a8a, 0.7);
          keyBg.strokeRoundedRect(col.x, y, keyW, rowH - 3, 3);

          const keyText = this.add.text(col.x + keyW / 2, y + (rowH - 3) / 2, item.key, {
            fontFamily: 'monospace', fontSize: '10px', color: '#4af2a1', fontStyle: 'bold',
          }).setOrigin(0.5);
          if (keyText.width > keyW - 6) keyText.setScale((keyW - 6) / keyText.width);

          const descText = this.add.text(col.x + keyW + 8, y + 2, item.desc, {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#a0b8c8',
          });

          this.contentContainer.add([keyBg, keyText, descText]);
          y += rowH;
        });
        y += 8;   // 섹션 간 간격
      });
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
