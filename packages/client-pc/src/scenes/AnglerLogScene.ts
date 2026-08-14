/**
 * @file AnglerLogScene.ts
 * @description 도감 & 조과첩 씬 — 어종/해양생물/아이템 위키 + 조과 기록
 *
 * 모든 도감 탭은 DiscoveryStore(발견 기록) 기반 —
 * 한 번이라도 조우(어획/포획/채집/취득)한 항목만 공개하고, 미발견은 실루엣/???로 가린다.
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import {
  FISH_DATABASE, getSpotById, SHORE_CREATURE_DATABASE,
  DISCOVERY_SOURCE_LABEL,
} from '@tra/core';
import type { ShoreCreatureCategory } from '@tra/core';
import { DiscoveryStore } from '../store/DiscoveryStore.js';
import { FISH_TEXTURE } from '../data/FishTextures.js';
import { itemWikiByCategory } from '../data/WikiCatalog.js';
import { createItemIcon } from '../ui/ItemIcon.js';
import { CATEGORY_LABEL } from '../store/InventoryStore.js';
import type { InvCategory } from '../store/InventoryStore.js';
import { clampTextWidth } from '../ui/TextFit.js';
import { fadeOutThen } from './SceneFade.js';

type LogTab = 'encyclopedia' | 'creatures' | 'items' | 'history';

/** 해양생물 카테고리 라벨/이모지 (위키 카드용) */
const CREATURE_CAT_LABEL: Record<ShoreCreatureCategory, string> = {
  shellfish: '조개류', crustacean: '갑각류', cephalopod: '두족류',
  echinoderm: '극피동물', bivalve: '이매패류', gastropod: '복족류',
};
const CREATURE_CAT_EMOJI: Record<ShoreCreatureCategory, string> = {
  shellfish: '🐚', crustacean: '🦀', cephalopod: '🐙',
  echinoderm: '🦔', bivalve: '🦪', gastropod: '🐌',
};

export class AnglerLogScene extends Phaser.Scene {
  private currentTab: LogTab = 'encyclopedia';
  private tabContainer?: Phaser.GameObjects.Container;

  // 조과 기록용 정렬/필터/페이징 상태
  private filterSpotId: string = 'all';
  private sortBy: 'latest' | 'length' | 'weight' = 'latest';
  private currentPage = 0;
  /** 조과 기록 1페이지 표시 수 — 행 60px, 시작 210 → 210+6*60+50=620 ≤ 네비(675) */
  private readonly ITEMS_PER_PAGE = 7;
  /** 아이템 위키 카테고리 필터 */
  private itemCatFilter: InvCategory = 'gear';

  // 탭 버튼 배경 참조 (활성 하이라이트)
  private tabBtnBgs: Partial<Record<LogTab, Phaser.GameObjects.Rectangle>> = {};

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
    this.add.text(40, 30, '📖 도감 & 조과첩 (Angler\'s Log)', {
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
    // [UI] 탭 버튼 영역 (배열 기반 4탭)
    // ─────────────────────────────────────────────
    const tabY = 110;
    const TABS: { key: LogTab; label: string; w: number }[] = [
      { key: 'encyclopedia', label: '어종 도감',     w: 140 },
      { key: 'creatures',    label: '해양생물',      w: 130 },
      { key: 'items',        label: '아이템 위키',   w: 140 },
      { key: 'history',      label: '나의 조과 기록', w: 160 },
    ];
    let tabX = 60;
    for (const tab of TABS) {
      const cx = tabX + tab.w / 2;
      const btn = this.add.container(cx, tabY).setInteractive(
        new Phaser.Geom.Rectangle(-tab.w / 2, -16, tab.w, 32),
        Phaser.Geom.Rectangle.Contains
      );
      const bg = this.add.rectangle(0, 0, tab.w, 32, 0x0e1c2d).setStrokeStyle(1.5, 0x2a5a8a);
      const txt = this.add.text(0, 0, tab.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '14px',
        color: '#e8f4fd',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      btn.add([bg, txt]);
      btn.on('pointerdown', () => this.switchTab(tab.key));
      this.tabBtnBgs[tab.key] = bg;
      tabX += tab.w + 10;
    }

    // ESC 설정
    this.input.keyboard?.on('keydown-ESC', () => this.onBack());

    // 콘텐츠 렌더링 컨테이너
    this.tabContainer = this.add.container(0, 0);

    // 기본 탭 렌더링
    this.switchTab('encyclopedia');

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  private onBack(): void {
    fadeOutThen(this, () => {
      this.scene.stop();
      this.scene.resume(this.returnScene);
    }, 220);
  }

  private switchTab(tab: LogTab): void {
    if (this.currentTab !== tab) this.currentPage = 0;   // 탭마다 페이지 수가 달라 초기화
    this.currentTab = tab;

    // 활성 탭 버튼 시각적 효과 설정
    for (const [key, bg] of Object.entries(this.tabBtnBgs)) {
      bg?.setFillStyle(key === tab ? 0x2a5a8a : 0x0e1c2d);
    }

    this.renderCurrentTab();
  }

  private renderCurrentTab(): void {
    if (this.tabContainer) {
      this.tabContainer.removeAll(true);
    }

    switch (this.currentTab) {
      case 'encyclopedia': this.renderEncyclopedia(); break;
      case 'creatures':    this.renderCreatures();    break;
      case 'items':        this.renderItems();        break;
      case 'history':      this.renderHistory();      break;
    }
  }

  /** 발견 정보 한 줄 ("낚시로 어획 · 8/14") — 발견 카드 하단 공통 표기 */
  private discoveryLine(kind: 'fish' | 'creature' | 'item', id: string): string | null {
    const e = DiscoveryStore.get(kind, id);
    if (!e) return null;
    const d = new Date(e.firstAtMs);
    return `${DISCOVERY_SOURCE_LABEL[e.source]} · ${d.getMonth() + 1}/${d.getDate()}`;
  }

  // ─────────────────────────────────────────────
  // 1. 어종 도감 탭 렌더링
  // ─────────────────────────────────────────────
  private renderEncyclopedia(): void {
    const { width, height } = this.scale;
    const startX = 40;
    const startY = 160;
    const itemW = 220;
    const itemH = 150;
    const colCount = 4;
    // 페이지 네비(height-45) 위까지만 채운다 — 구 구현은 전 어종을 한 번에 그려 하단이 잘렸다
    // (마지막 행 아래엔 간격이 필요 없으므로 +GAP 후 나눈다)
    const GAP = 20;
    const rowsPerPage = Math.max(1, Math.floor((height - 45 - 24 - startY + GAP) / (itemH + GAP)));
    const perPage = rowsPerPage * colCount;
    const maxPage = Math.max(0, Math.ceil(FISH_DATABASE.length / perPage) - 1);
    this.currentPage = Math.min(this.currentPage, maxPage);   // 탭 전환 시 범위 밖 페이지 방어

    const records = GameState.player.caughtFishHistory;
    const pageFish = FISH_DATABASE.slice(this.currentPage * perPage, (this.currentPage + 1) * perPage);

    // 발견 현황 요약 — 발견 = 낚시 어획 + 통발 포획 등 최초 조우 (DiscoveryStore 단일 기준)
    const found = FISH_DATABASE.filter((f) => DiscoveryStore.isDiscovered('fish', f.id)).length;
    const summary = this.add.text(width - 40, startY - 26,
      `발견 ${found} / ${FISH_DATABASE.length}종`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#8faabf',
      }).setOrigin(1, 0);
    this.tabContainer?.add(summary);

    pageFish.forEach((fish, idx) => {
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);

      const x = startX + col * (itemW + GAP);
      const y = startY + row * (itemH + GAP);

      // 카드 배경
      const card = this.add.graphics();
      card.fillStyle(0x0e1c2d);
      card.fillRoundedRect(x, y, itemW, itemH, 4);
      card.lineStyle(1.5, 0x2a5a8a, 0.8);
      card.strokeRoundedRect(x, y, itemW, itemH, 4);
      this.tabContainer?.add(card);

      const caughtCount = records.filter(r => r.fishSpeciesId === fish.id).length;
      const bestRecord = GameState.player.personalRecords[fish.id] || 0;
      const discovered = DiscoveryStore.isDiscovered('fish', fish.id);

      if (discovered) {
        // 이름·학명 = 카드 전체 폭(안쪽 여백 15/12), 실사 이미지는 좌측 아래
        const nameText = clampTextWidth(this.add.text(x + 15, y + 12, fish.nameKo, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '15px',
          color: '#4af2a1',
          fontStyle: 'bold'
        }), itemW - 27);
        const sciText = clampTextWidth(this.add.text(x + 15, y + 32, fish.scientificName, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#5a8fab',
          fontStyle: 'italic'
        }), itemW - 27);
        this.tabContainer?.add([nameText, sciText]);

        // 어종 실사 픽셀 이미지(있는 어종만) — 좌측 박스 안에 종횡비 유지로 축소
        const IMG_X = x + 12, IMG_Y = y + 48, IMG_W = 84, IMG_H = 66;
        const texKey = FISH_TEXTURE[fish.id];
        if (texKey && this.textures.exists(texKey)) {
          const src = this.textures.get(texKey).getSourceImage() as { width: number; height: number };
          const k = Math.min(IMG_W / src.width, IMG_H / src.height);
          const img = this.add.image(IMG_X + IMG_W / 2, IMG_Y + IMG_H / 2, texKey)
            .setDisplaySize(Math.round(src.width * k), Math.round(src.height * k));
          this.tabContainer?.add(img);
        } else {
          const noImg = this.add.text(IMG_X + IMG_W / 2, IMG_Y + IMG_H / 2, '이미지 없음', {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#24455f',
          }).setOrigin(0.5);
          this.tabContainer?.add(noImg);
        }

        // 우측 스탯 열 (좁으므로 폭 상한 고정 — §4 텍스트 오버플로 금지)
        const SX = x + 104;
        const SW = itemW - 104 - 12;
        const season = fish.peakSeasonMonths.length > 0
          ? `제철 ${fish.peakSeasonMonths.slice(0, 4).join('·')}월`
          : '제철 연중';
        // 낚시 어획이 없는 발견(통발 포획 등)은 기록 대신 발견 경로를 보여준다
        const discLine = this.discoveryLine('fish', fish.id);
        const rows: [string, string][] = caughtCount > 0
          ? [
              [`최대어 ${bestRecord} cm`, '#e8f4fd'],
              [`누적 ${caughtCount} 수`, '#e8f4fd'],
              [season, '#8faabf'],
              [`kg당 ${fish.sashimiValuePerKg.toLocaleString()}원`, '#c8a060'],
            ]
          : [
              [`🔍 ${discLine ?? '발견'}`, '#8fd4b8'],
              ['낚시 기록 없음', '#607b8e'],
              [season, '#8faabf'],
              [`kg당 ${fish.sashimiValuePerKg.toLocaleString()}원`, '#c8a060'],
            ];
        rows.forEach(([label, color], i) => {
          const t = clampTextWidth(this.add.text(SX, y + 50 + i * 19, label, {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color,
          }), SW);
          this.tabContainer?.add(t);
        });
      } else {
        // ── 미발견 카드: 실루엣 + ??? + 서식 힌트 (어디서 만날 수 있는지만 귀띔) ──
        const texKey = FISH_TEXTURE[fish.id];
        if (texKey && this.textures.exists(texKey)) {
          const src = this.textures.get(texKey).getSourceImage() as { width: number; height: number };
          const SIL_W = 120, SIL_H = 60;
          const k = Math.min(SIL_W / src.width, SIL_H / src.height);
          // setTintFill = 알파만 남기고 단색 채움 → 검은 실루엣
          const sil = this.add.image(x + itemW / 2, y + 52, texKey)
            .setDisplaySize(Math.round(src.width * k), Math.round(src.height * k))
            .setTintFill(0x152538)
            .setAlpha(0.9);
          this.tabContainer?.add(sil);
        }
        const secretText = this.add.text(x + itemW / 2, y + 96, '???', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '14px',
          color: '#2a5a8a'
        }).setOrigin(0.5);
        // 서식 힌트 — 수심대·수층 (이름은 숨긴 채 조우 조건만)
        const LAYER_LABEL = { surface: '표층', mid: '중층', bottom: '바닥층' } as const;
        const hint = `${fish.preferredDepthM[0]}~${fish.preferredDepthM[1]}m · ${LAYER_LABEL[fish.swimmingLayer]}${fish.isNocturnal ? ' · 야행성' : ''}`;
        const descText = clampTextWidth(this.add.text(x + itemW / 2, y + 120, hint, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '10px',
          color: '#3a5a78'
        }).setOrigin(0.5), itemW - 24);

        this.tabContainer?.add([secretText, descText]);
      }
    });

    this.renderPageNav(maxPage, width, height);
  }

  // ─────────────────────────────────────────────
  // 1b. 해양생물 도감 탭 (해루질·통발 생물)
  // ─────────────────────────────────────────────
  private renderCreatures(): void {
    const { width, height } = this.scale;
    const startX = 40;
    const startY = 160;
    const itemW = 220;
    const itemH = 150;
    const colCount = 4;
    const GAP = 20;
    const rowsPerPage = Math.max(1, Math.floor((height - 45 - 24 - startY + GAP) / (itemH + GAP)));
    const perPage = rowsPerPage * colCount;
    const all = SHORE_CREATURE_DATABASE;
    const maxPage = Math.max(0, Math.ceil(all.length / perPage) - 1);
    this.currentPage = Math.min(this.currentPage, maxPage);

    const found = all.filter((c) => DiscoveryStore.isDiscovered('creature', c.id)).length;
    const summary = this.add.text(width - 40, startY - 26,
      `발견 ${found} / ${all.length}종 — 해루질·통발로 채집해 발견`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#8faabf',
      }).setOrigin(1, 0);
    this.tabContainer?.add(summary);

    const page = all.slice(this.currentPage * perPage, (this.currentPage + 1) * perPage);
    page.forEach((cr, idx) => {
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);
      const x = startX + col * (itemW + GAP);
      const y = startY + row * (itemH + GAP);

      const card = this.add.graphics();
      card.fillStyle(0x0e1c2d);
      card.fillRoundedRect(x, y, itemW, itemH, 4);
      card.lineStyle(1.5, 0x2a5a8a, 0.8);
      card.strokeRoundedRect(x, y, itemW, itemH, 4);
      this.tabContainer?.add(card);

      if (DiscoveryStore.isDiscovered('creature', cr.id)) {
        const nameText = clampTextWidth(this.add.text(x + 15, y + 12, cr.nameKo, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '15px', color: '#4af2a1', fontStyle: 'bold',
        }), itemW - 27);
        const sciText = clampTextWidth(this.add.text(x + 15, y + 32, cr.scientificName, {
          fontFamily: 'monospace', fontSize: '9px', color: '#5a8fab', fontStyle: 'italic',
        }), itemW - 27);
        // 큰 이모지 아이콘 (전용 스프라이트 에셋 도입 전 — spriteKey는 예약)
        const emoji = this.add.text(x + 44, y + 84, CREATURE_CAT_EMOJI[cr.category] ?? '🐚', {
          fontSize: '38px',
        }).setOrigin(0.5);
        this.tabContainer?.add([nameText, sciText, emoji]);

        const SX = x + 92;
        const SW = itemW - 92 - 12;
        const closed = cr.closedSeasonMonths.length > 0
          ? `금어기 ${cr.closedSeasonMonths.join('·')}월` : '금어기 없음';
        const discLine = this.discoveryLine('creature', cr.id);
        const rows: [string, string][] = [
          [CREATURE_CAT_LABEL[cr.category] ?? cr.category, '#8faabf'],
          [`kg당 ${cr.marketValuePerKg.toLocaleString()}원`, '#c8a060'],
          [closed, cr.closedSeasonMonths.length > 0 ? '#d47a6a' : '#607b8e'],
          [`🔍 ${discLine ?? '발견'}`, '#8fd4b8'],
        ];
        rows.forEach(([label, color], i) => {
          const t = clampTextWidth(this.add.text(SX, y + 54 + i * 19, label, {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color,
          }), SW);
          this.tabContainer?.add(t);
        });
      } else {
        // 미발견 — 카테고리 실루엣 이모지(어둡게) + 조우 힌트
        const emoji = this.add.text(x + itemW / 2, y + 52, CREATURE_CAT_EMOJI[cr.category] ?? '🐚', {
          fontSize: '34px',
        }).setOrigin(0.5).setAlpha(0.18);
        const secretText = this.add.text(x + itemW / 2, y + 92, '???', {
          fontFamily: '"Press Start 2P", monospace', fontSize: '14px', color: '#2a5a8a',
        }).setOrigin(0.5);
        const timeHint = cr.discoveryTime === 'night' ? '야간' : cr.discoveryTime === 'day' ? '주간' : '주야';
        const licHint = cr.requiredLicense ? ' · 심화 면허' : '';
        const hint = clampTextWidth(this.add.text(x + itemW / 2, y + 118,
          `${timeHint} 해루질·통발${licHint}`, {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#3a5a78',
          }).setOrigin(0.5), itemW - 24);
        this.tabContainer?.add([emoji, secretText, hint]);
      }
    });

    this.renderPageNav(maxPage, width, height);
  }

  // ─────────────────────────────────────────────
  // 1c. 아이템 위키 탭 (시드 + 상점 전 품목)
  // ─────────────────────────────────────────────
  private renderItems(): void {
    const { width, height } = this.scale;
    const startX = 40;
    const filterY = 160;
    const startY = 196;
    const itemW = 220;
    const itemH = 118;
    const colCount = 4;
    const GAP = 16;

    // 카테고리 필터 바
    const cats: InvCategory[] = ['gear', 'consumable', 'food', 'tackle', 'lure', 'etc'];
    let fx = startX;
    for (const cat of cats) {
      const selected = this.itemCatFilter === cat;
      const label = CATEGORY_LABEL[cat];
      const bw = 86;
      const btn = this.add.container(fx + bw / 2, filterY + 10).setInteractive(
        new Phaser.Geom.Rectangle(-bw / 2, -12, bw, 24),
        Phaser.Geom.Rectangle.Contains
      );
      const bg = this.add.rectangle(0, 0, bw, 24, selected ? 0x2a5a8a : 0x0e1c2d).setStrokeStyle(1, 0x1f3d5a);
      const t = this.add.text(0, 0, label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px',
        color: selected ? '#4af2a1' : '#a0b8c8',
      }).setOrigin(0.5);
      btn.add([bg, t]);
      btn.on('pointerdown', () => {
        this.itemCatFilter = cat;
        this.currentPage = 0;
        this.renderCurrentTab();
      });
      this.tabContainer?.add(btn);
      fx += bw + 8;
    }

    const entries = itemWikiByCategory(this.itemCatFilter);
    const rowsPerPage = Math.max(1, Math.floor((height - 45 - 24 - startY + GAP) / (itemH + GAP)));
    const perPage = rowsPerPage * colCount;
    const maxPage = Math.max(0, Math.ceil(entries.length / perPage) - 1);
    this.currentPage = Math.min(this.currentPage, maxPage);

    const foundAll = entries.filter((e) => DiscoveryStore.isDiscovered('item', e.id)).length;
    const summary = this.add.text(width - 40, filterY, `발견 ${foundAll} / ${entries.length} — 취득하면 등록`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#8faabf',
    }).setOrigin(1, 0);
    this.tabContainer?.add(summary);

    const page = entries.slice(this.currentPage * perPage, (this.currentPage + 1) * perPage);
    page.forEach((entry, idx) => {
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);
      const x = startX + col * (itemW + GAP);
      const y = startY + row * (itemH + GAP);

      const card = this.add.graphics();
      card.fillStyle(0x0e1c2d);
      card.fillRoundedRect(x, y, itemW, itemH, 4);
      card.lineStyle(1, 0x1f3d5a, 0.9);
      card.strokeRoundedRect(x, y, itemW, itemH, 4);
      this.tabContainer?.add(card);

      if (DiscoveryStore.isDiscovered('item', entry.id)) {
        // 아이콘 (이미지 아이콘 있으면 이미지, 없으면 이모지)
        const icon = createItemIcon(this, x + 26, y + 26, entry, 30);
        this.tabContainer?.add(icon);

        const nameText = clampTextWidth(this.add.text(x + 48, y + 12, entry.name, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#e8f4fd', fontStyle: 'bold',
        }), itemW - 60);
        const subText = clampTextWidth(this.add.text(x + 48, y + 30, `${entry.subCategory} · ${entry.basePrice.toLocaleString()}원`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8faabf',
        }), itemW - 60);
        this.tabContainer?.add([nameText, subText]);

        // 설명 (2줄 워드랩 — 카드 밖 금지)
        if (entry.desc) {
          const desc = this.add.text(x + 12, y + 50, entry.desc, {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#a0b8c8',
            wordWrap: { width: itemW - 24 }, maxLines: 2,
          });
          this.tabContainer?.add(desc);
        }

        const discLine = this.discoveryLine('item', entry.id);
        const foot = clampTextWidth(this.add.text(x + 12, y + itemH - 20, `🔍 ${discLine ?? '취득'}`, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8fd4b8',
        }), itemW - 24);
        this.tabContainer?.add(foot);
      } else {
        const secretText = this.add.text(x + itemW / 2, y + 40, '???', {
          fontFamily: '"Press Start 2P", monospace', fontSize: '13px', color: '#2a5a8a',
        }).setOrigin(0.5);
        // 입수 힌트 — 판매처(있으면) / 소분류만
        const hintSrc = entry.soldAt.length > 0
          ? `${entry.soldAt.join('·')}에서 구매`
          : `${entry.subCategory} — 플레이로 입수`;
        const hint = clampTextWidth(this.add.text(x + itemW / 2, y + 72, hintSrc, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#3a5a78',
        }).setOrigin(0.5), itemW - 24);
        this.tabContainer?.add([secretText, hint]);
      }
    });

    if (entries.length === 0) {
      const empty = this.add.text(width / 2, startY + 120, '이 카테고리에 등록된 품목이 없습니다.', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#607b8e',
      }).setOrigin(0.5);
      this.tabContainer?.add(empty);
    }

    this.renderPageNav(maxPage, width, height);
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

    // 라벨 실측 폭 기준으로 첫 버튼을 배치 — 구 고정값(120)은 라벨(우측 끝 ≈112)과 버튼(좌측 85)이 겹쳤다
    let filterBtnX = 40 + filterLabel.width + 12 + 35;
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

    // 정렬 버튼 3개(폭 60·간격 66)를 우측 끝(width-40)에 맞춰 역산 — 라벨과 겹치지 않게
    let sortBtnX = width - 40 - 30 - 66 * (sorts.length - 1);
    sortLabel.setX(Math.min(width - 320, sortBtnX - 30 - 12 - sortLabel.width));
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
        const nameTextObj = clampTextWidth(this.add.text(60, itemY + 10, nameTxt, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '14px',
          color: log.isBestRecord ? '#ffeeaa' : '#e8f4fd',
          fontStyle: log.isBestRecord ? 'bold' : 'normal',
        }), width - 200);   // 우측 왕관 배지 자리 확보
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
        const subTextObj = clampTextWidth(this.add.text(60, itemY + 30, subTxt, {
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: '11px',
          color: '#8faabf',
        }), width - 120);   // 행 배경(width-80) 안쪽
        this.tabContainer?.add(subTextObj);
      });
    }

    this.renderPageNav(Math.max(0, Math.ceil(rawLogs.length / this.ITEMS_PER_PAGE) - 1), width, height);
  }

  /**
   * 페이지 네비게이션 (◀ 이전 · n/N · 다음 ▶) — 두 탭이 공유.
   * 구 구현은 조과 기록 탭 안에만 있어, **도감 탭은 페이징 없이 전 어종을 그려**
   * 화면(720) 밖으로 넘쳤다 (사용자 리포트 2026-08-04 "하단이 잘림").
   */
  private renderPageNav(maxPage: number, width: number, height: number): void {
    const navY = height - 45;
    const mkBtn = (dx: number, label: string, enabled: boolean, onClick: () => void): void => {
      const btn = this.add.container(width / 2 + dx, navY).setInteractive(
        new Phaser.Geom.Rectangle(-40, -12, 80, 24),
        Phaser.Geom.Rectangle.Contains,
      );
      const bg = this.add.rectangle(0, 0, 80, 24, 0x1f3d5a).setStrokeStyle(1.0, 0x2a5a8a);
      const t = this.add.text(0, 0, label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px',
        color: enabled ? '#ffffff' : '#607b8e',
      }).setOrigin(0.5);
      btn.add([bg, t]);
      if (enabled) {
        btn.on('pointerdown', onClick);
        btn.on('pointerover', () => bg.setFillStyle(0x2a5a8a));
        btn.on('pointerout', () => bg.setFillStyle(0x1f3d5a));
      }
      this.tabContainer?.add(btn);
    };

    mkBtn(-80, '◀ 이전', this.currentPage > 0, () => { this.currentPage--; this.renderCurrentTab(); });
    const pageIndexText = this.add.text(width / 2, navY, `${this.currentPage + 1} / ${maxPage + 1}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#e8f4fd',
    }).setOrigin(0.5);
    this.tabContainer?.add(pageIndexText);
    mkBtn(80, '다음 ▶', this.currentPage < maxPage, () => { this.currentPage++; this.renderCurrentTab(); });
  }
}
