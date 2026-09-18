/**
 * @file RegionHud.ts
 * @description RegionFieldScene 전용 HUD 오버레이
 *
 * 구성:
 *  - 좌상단: HP(스태미나) 바, 피로도 바, 시계(현재 시각), 지역 날씨 정보
 *  - 우상단: 미니맵 (실제 지형 타일 그리드 축소 렌더, M 키 3단계 크기 순환)
 *  - 중앙 하단: 퀵슬롯 8칸 (InventoryStore 배정 연동, 1~8 키/클릭 선택)
 *  - 좌하단: 이벤트 메시지 로그 + 커뮤니티 채팅 (멀티플레이 대비 목업)
 */

import Phaser from 'phaser';
import { MP_CHAT_MAX_LEN, type RegionTerrain, type WeatherKind, type StatusEffectId } from '@tra/core';
import {
  WEATHER_LABEL, kstParts, isNightHour,
  getStatusEffect, statusRemainMs, STATUS_CURE_LABEL, xpToNext, MAX_LEVEL,
} from '@tra/core';
import { GameState } from '../store/GameState.js';
import { loadSettings, saveSettings } from '../scenes/SettingsScene.js';
import { InventoryStore } from '../store/InventoryStore.js';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { MultiplayerClient } from '../net/MultiplayerClient.js';
import { applyScreenFixed, restoreHandCursor } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';
import { clampTextWidth } from './TextFit.js';
import { addPixelIcon } from './PixelIcon.js';
import { paintHudPanel, paintHudSlot } from './HudPanelStyle.js';
import { t, getLocale } from '../i18n/I18n.js';
import { StoryStore } from '../store/StoryStore.js';

/** 미니맵 마커 — priority: 0 상점 / 2 퀘스트 보유 / 3 완료 가능 (높을수록 셀 점유 우선) */
export interface MiniMarker {
  wx: number;
  wy: number;
  /** PixelIconArt 키 (mm_*) */
  icon: string;
  priority: number;
  /** 155차 — 아이콘 대신 그리는 도형 (핀) */
  shape?: 'pin';
}

/** 155차 — 추적기 데이터 */
export interface QuestTrackerData {
  title: string;
  objective: string;
  howTo?: string;
  distance?: string;
}

/** 155차 — 획득 토스트 */
export interface ItemToastData {
  kind: 'item' | 'quest' | 'coin';
  name: string;
  qty: number;
  bound?: boolean;
  /** 아이템 아이콘(createItemIcon) — 있으면 우선 */
  item?: Parameters<typeof createItemIcon>[3];
  /** 픽셀 아이콘 키 폴백 */
  iconKey?: string;
}

export interface RegionHudConfig {
  /** 지역 ID — 기상/해양 데이터 조회 키 (KMA_GRID_BY_REGION / REGION_TO_MMSI) */
  regionId: string;
  mapId: string;
  terrain: RegionTerrain[][];
  cols: number;
  rows: number;
  worldW: number;
  worldH: number;
}

// ── 미니맵 지형 색 (필드 팔레트 축소판) ────────────────
const MINI_COL: Record<RegionTerrain, number> = {
  water: 0x4a86b0,
  land: 0xbfae82,
  building: 0x6f523a,
  grass: 0x7ba352,
  // OSM 심리스 v2 신규 지형 (필드 팔레트 축소판)
  road: 0x4c4f54,
  sidewalk: 0xb3b8bf,
  sand: 0xe2d2a2,
  pier: 0x9aa5b0,
};

const MINI_SIZES = [150, 250, 350] as const;

// ── 상태 패널 레이아웃 ────────────────────────────────
// 텍스트가 패널 밖으로 밀려나지 않도록 모든 요소를 이 상수 기준으로 배치한다.
// (기존 236px 패널에 날씨 문자열이 x=110부터 그려져 우측으로 넘치던 버그 수정)
const SP = {
  x: 16, y: 16, w: 320, h: 176,
  pad: 10,
  /** 게이지 라벨 폭 */
  labelW: 48,
} as const;

/**
 * HUD 패널 공통 **타이틀바(캡션바) 높이**.
 * 규칙(119차 ①): 타이틀바에는 패널 제목과 조절 버튼(◱ 크기 / ◐ 투명)만 들어가고,
 * 컨텐츠는 이 밴드 **아래**에서 시작한다. 버튼(16px)이 밴드 안에 완전히 들어가도록
 * 어떤 축소 단계에서도 20px 아래로 내려가지 않는다.
 */
const HUD_HEADER_H = 20;
/** 타이틀바 안쪽 조절 버튼 y (밴드 상단에서 2px 여유) */
const HUD_CTRL_INSET = 2;
/** 상태 패널 컨텐츠 시작 y — 타이틀바 아래 */
const SP_CONTENT_Y = SP.y + HUD_HEADER_H;

/**
 * 지역 채널 로그 1줄 — 표시 형식이 크기 단계마다 달라서 **시각·머리말·본문을 분리 보관**한다 (119차 ②).
 *  - 큰   : `[HH:MM] [이벤트] 본문`
 *  - 중간 : `[이벤트] 본문`      (시각 제거 — 창 안 글씨 크기는 그대로)
 *  - 최소 : `[이벤트] ...`       (본문 10자 초과 시. 짧은 내용은 그대로 보인다)
 */
interface LogEntry {
  time: string;
  /** `[이벤트]` 같은 태그 또는 `안개낀바다:` 같은 캐릭터 ID (콜론 포함) */
  head: string;
  body: string;
}
/** 최소 단계에서 본문을 '...'로 줄이는 글자 수 기준 */
const LOG_MIN_BODY_CHARS = 10;

/** 원문 메시지 → 머리말(태그/캐릭터 ID) + 본문 분리 */
function splitLogMessage(message: string): { head: string; body: string } {
  const tag = /^(\[[^\]]+\])\s*([\s\S]*)$/.exec(message);
  if (tag) return { head: tag[1], body: tag[2] };
  const id = /^([^:\n]{1,16}:)\s*([\s\S]*)$/.exec(message);
  if (id) return { head: id[1], body: id[2] };
  return { head: '', body: message };
}

/** 원형 날씨 아이콘 배지 반지름 */
const BADGE_R = 13;
/** HUD 축소 3단계(미니맵 M 순환과 같은 문법) · 투명도 4단계 — 마지막 단계도 0이 아니라 아주 희미하게 남긴다 (116차) */
const HUD_SCALES = [1, 0.75, 0.5];
const HUD_ALPHAS = [1, 0.7, 0.4, 0.05];   // 최저 = 뒤 배경이 거의 그대로 비친다 (117차 피드백)
/**
 * 배지는 2열 × 2행 배치.
 * 한 줄에 4개를 넣으면 '맑음 25.9°C' 같은 캡션이 슬롯에 안 들어가
 * 잘리거나 패널 밖으로 밀려난다 — 2열로 나눠 캡션 폭을 충분히 확보한다.
 */
const BADGE_COLS = 2;
const BADGE_STEP_X = (SP.w - SP.pad * 2) / BADGE_COLS;
const BADGE_STEP_Y = 30;
/**
 * 배지 첫 행 y — '대' 단계 전용.
 * 126차에 경험치 바(+52)가 끼면서 날짜·시계가 각각 14px씩 밀렸다.
 * 시계(18px, y +82)의 실제 하단이 +106이므로 첫 행 중심은 +122(= 배지 상단 +109)에 둔다.
 */
const BADGE_ROW0_Y = SP_CONTENT_Y + 122;
/** 캡션 최대 폭 — 이 값을 넘으면 줄바꿈되므로 패널 밖으로는 절대 못 나간다 */
const CAPTION_MAX_W = BADGE_STEP_X - BADGE_R * 2 - 8;

/**
 * 상태 패널 3단계 레이아웃 (118차 피드백 1) — **축소 = 정보량 축소**이지 글씨 축소가 아니다.
 * 구현은 컨테이너 scale이 아니라 **단계별 재생성**: 글씨 크기는 어느 단계에서나 전체 크기와 같다.
 *  - full  : 배지 2열 × 2행 + 캡션 (기존과 동일)
 *  - icons : 배지 아이콘만 1행 4개 — 아이콘 호버 시 그 항목 설명 툴팁
 *  - none  : HP·피로도·시각만 — 패널 어디든 호버하면 날씨 전체 툴팁
 */
interface StatusLayout { w: number; h: number; date: boolean; badges: 'full' | 'icons' | 'none' }
const SP_LAYOUTS: StatusLayout[] = [
  { w: SP.w, h: SP.h + HUD_HEADER_H, date: true, badges: 'full' },
  { w: 236, h: 132 + HUD_HEADER_H, date: true, badges: 'icons' },
  { w: 196, h: 84 + HUD_HEADER_H, date: false, badges: 'none' },
];

/**
 * 상태 패널 게이지 키 — 렌더와 호버 히트가 **같은 rect 소스**(`barRects`)를 공유한다.
 * xp·hunger·hydration은 '대' 단계 전용(중·소는 118차 정보량 축소 원칙대로 무변경).
 */
type VitalKey = 'hp' | 'fatigue' | 'xp' | 'hunger' | 'hydration';

/** 게이지 라벨 Ko/En — 이 텍스트만 사전을 타고, 수치는 숫자만이라 번역 대상이 아니다 (119차 규칙) */
const VITAL_LABEL: Record<VitalKey, { ko: string; en: string; color: number; icon?: string }> = {
  hp: { ko: '체력', en: 'HP', color: 0x37d97b },
  fatigue: { ko: '피로도', en: 'Fatigue', color: 0xff8a3d },
  xp: { ko: '경험치', en: 'EXP', color: 0xe8ddc0 },
  // 허기·수분은 **라벨 텍스트 대신 픽셀 아이콘**(빵·물방울) — 로케일과 무관해 폭이 흔들리지 않는다
  hunger: { ko: '허기', en: 'Hunger', color: 0xd8a24a, icon: 'hunger' },
  hydration: { ko: '수분', en: 'Water', color: 0x4fb8e0, icon: 'hydration' },
};

/** 생존 지표 아이콘 표시 크기(px) */
const VITAL_ICON = 16;

/** 게이지 한 줄의 기하 — `barRects()`가 렌더·히트·툴팁 앵커에 같은 값을 공급한다 */
interface VitalRect {
  key: VitalKey;
  /** 라벨(또는 아이콘) 좌측 x */
  labelX: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 툴팁 앵커 사각형 — 이 박스를 피해 여유 있는 쪽으로 팝업이 펼쳐진다 */
interface TipAnchor { x: number; y: number; w: number; h: number }

/**
 * 상태이상 스트립 — **패널 밖 하단 좌정렬**(SPEC §7).
 * 통일된 칩 프레임 + **16x16 손그림 픽셀 아이콘**(텍스트 약어·이모지 금지 — AGENTS §4).
 * 4개를 넘으면 둘째 줄로 접힌다.
 */
const STRIP = { chip: 22, gap: 4, perRow: 4, top: 6, icon: 16 } as const;

/** 남은 활동 시간 표기 — 상위 0단위는 생략 (44차 compactRemain과 같은 문법) */
function formatRemain(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), sec = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

/** 배지 idx → 중심 좌표 (레이아웃별) */
function badgePos(layout: StatusLayout, idx: number): { x: number; y: number } {
  if (layout.badges === 'icons') {
    const step = (layout.w - SP.pad * 2) / 4;
    return { x: SP.x + SP.pad + step / 2 + idx * step, y: SP_CONTENT_Y + 108 };
  }
  const col = idx % BADGE_COLS;
  const row = Math.floor(idx / BADGE_COLS);
  return {
    x: SP.x + SP.pad + BADGE_R + col * BADGE_STEP_X,
    y: BADGE_ROW0_Y + row * BADGE_STEP_Y,
  };
}

// ── 날씨 종류 → 원형 배지 픽토그램/색/라벨 ─────────────
// 기상청 SKY/PTY 코드에서 정규화된 WeatherKind 기준 (@tra/core)
const KIND_GLYPH: Record<WeatherKind, string> = {
  clear: '☀', partly: '⛅', cloudy: '☁', rain: '☂',
  sleet: '☂', snow: '❄', shower: '☂', fog: '≋',
};
const KIND_COLOR: Record<WeatherKind, number> = {
  clear: 0xffcc44, partly: 0xc8d8e8, cloudy: 0x8fa4b8, rain: 0x4a9fe0,
  sleet: 0x7ab8e0, snow: 0xdfe9ff, shower: 0x3d8fd0, fog: 0x9aa8b0,
};

export class RegionHud extends Phaser.GameObjects.Container {
  private cfg: RegionHudConfig;

  // 상태 패널
  private barsG!: Phaser.GameObjects.Graphics;
  /** 날짜 (KST 명시) */
  private dateText?: Phaser.GameObjects.Text;
  /** 시각 HH:MM:SS */
  private clockText!: Phaser.GameObjects.Text;
  /** 주간/야간 라벨 */
  private dayNightText!: Phaser.GameObjects.Text;
  /** 원형 배지 그래픽 (아이콘 원/테두리) */
  private badgeG!: Phaser.GameObjects.Graphics;
  /** 배지 글리프 텍스트 (주야간/날씨/안개/바람) */
  private badgeGlyphs: Phaser.GameObjects.Text[] = [];
  /** 배지 하단 캡션 */
  private badgeCaptions: Phaser.GameObjects.Text[] = [];
  /** 배지 호버 히트 영역 (아이콘 단계) */
  private badgeHits: Phaser.GameObjects.Rectangle[] = [];
  /** 최신 배지 내용 — 축소 단계의 호버 툴팁이 이 값을 그린다 */
  private badgeData: { glyph: string; caption: string; color: number; active: boolean }[] = [];
  /** 호버 툴팁 (커서 우측 하단) */
  private weatherTip?: Phaser.GameObjects.Container;
  /** 현재 상태 패널 레이아웃 */
  private statusLayout: StatusLayout = SP_LAYOUTS[0];

  // ── 생존 지표 UI (126차 P3) ──
  /** 게이지 라벨(체력/피로도/경험치/허기/수분) — 로케일 전환 시 setText 훅이 처리 */
  private vitalLabels = new Map<VitalKey, Phaser.GameObjects.Text>();
  /** 열려 있는 호버 팝업의 매초 갱신 훅 (없으면 팝업 없음) */
  private tipRefresh?: () => void;
  /** 게이지 호버 히트 — 수치는 상시 표기하지 않고 호버 팝업으로만 (118차 방향) */
  private vitalHits: Phaser.GameObjects.Rectangle[] = [];
  /** 수치 호버 팝업 */
  private valueTip?: Phaser.GameObjects.Container;
  /** 상태이상 스트립 (패널 밖 — 크기 단계와 무관하게 항상 표시) */
  private stripC?: Phaser.GameObjects.Container;
  /** 스트립 재생성 판단용 시그니처 (id 목록 + 로케일) */
  private stripSig = '';

  /** 상태 패널·지역 채널 래퍼 — 크기(scale)·투명도(alpha)를 통째로 조절 (116차) */
  private statusC!: Phaser.GameObjects.Container;
  /** 지역 채널 패널 구성 오브젝트 — 크기 단계마다 통째로 재생성(중첩 컨테이너+마스크는 입력 시 렌더러 크래시 실측) */
  private logParts: Phaser.GameObjects.GameObject[] = [];
  private statusSize = 0;
  private statusAlpha = 0;
  private chatSize = 0;
  private chatAlpha = 0;
  /** 크기/투명 조절 버튼 (래퍼 밖 — 투명도를 끝까지 내려도 버튼은 남아 복구 가능) */
  private statusCtrl: Phaser.GameObjects.GameObject[] = [];
  private chatCtrl: Phaser.GameObjects.GameObject[] = [];

  // 미니맵
  private miniContainer!: Phaser.GameObjects.Container;
  /** 155차 — 미니맵 아래 「지금 할 일」 추적기 */
  private trackerC?: Phaser.GameObjects.Container;
  private trackerData: QuestTrackerData | null = null;
  /** 155차 — 우측 획득 토스트(아이템 아이콘 + 수량, 페이드 인/아웃) */
  private toasts: { c: Phaser.GameObjects.Container; h: number }[] = [];
  /** 미니맵 타이틀 밴드 높이 (155차 — +/− 버튼이 들어간다) */
  private static readonly MINI_HDR = 18;
  private miniSizeIdx = 0;
  private miniMarker!: Phaser.GameObjects.Arc;
  private miniDispW = 0;
  private miniDispH = 0;
  /** 미니맵 마커 (136차 — 상점 카테고리 · 퀘스트 느낌표/물음표) */
  private miniMarkers: MiniMarker[] = [];
  private miniMarkerC?: Phaser.GameObjects.Container;

  // 퀵슬롯
  private slotContainers: Phaser.GameObjects.Container[] = [];
  /** 슬롯별 아이콘 오브젝트 (이미지/이모지 동적 교체) */
  private slotIcons: (Phaser.GameObjects.GameObject | null)[] = [];

  // 로그/채팅 (지역 채널 — 마스크 클립 + 스크롤백)
  private logLines: LogEntry[] = [];
  private logText!: Phaser.GameObjects.Text;
  /** 로그 뷰포트 (헤더 아래 ~ 입력란 위 — 마스크/스크롤 대상) */
  private logRect = { x: 0, y: 0, w: 0, h: 0 };
  /** 패널 전체 (휠 스크롤 호버 판정) */
  private logAreaRect = { x: 0, y: 0, w: 0, h: 0 };
  /** 스크롤 오프셋 — 0 = 맨 위 … maxScroll = 맨 아래(최신) */
  private logScrollY = 0;
  private logBarG?: Phaser.GameObjects.Graphics;
  private logMaskShape?: Phaser.GameObjects.Graphics;
  private logDragging = false;
  private logWheelHandler?: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;
  private logMoveHandler?: (p: Phaser.Input.Pointer) => void;
  private logUpHandler?: () => void;

  constructor(scene: Phaser.Scene, cfg: RegionHudConfig) {
    super(scene);
    this.cfg = cfg;
    this.setScrollFactor(0);
    this.setDepth(200);

    const st = loadSettings();
    this.statusSize = Phaser.Math.Clamp(st.hudStatusSize ?? 0, 0, SP_LAYOUTS.length - 1);
    this.statusAlpha = Phaser.Math.Clamp(st.hudStatusAlpha ?? 0, 0, HUD_ALPHAS.length - 1);
    this.chatSize = Phaser.Math.Clamp(st.hudChatSize ?? 0, 0, HUD_SCALES.length - 1);
    this.chatAlpha = Phaser.Math.Clamp(st.hudChatAlpha ?? 0, 0, HUD_ALPHAS.length - 1);

    this.createMiniMap();
    this.createQuickslots();
    this.applyStatusView();
    this.applyChatView();   // createLogPanel 포함 (크기 단계 반영)

    // 화면 고정 히트 영역 보정 (카메라 스크롤 시 퀵슬롯 클릭 어긋남 방지)
    applyScreenFixed(this);

    this.updateStatus();
    scene.time.addEvent({ delay: 1000, loop: true, callback: this.updateStatus, callbackScope: this });
  }

  // ═══════════════════════════════════════════════════
  // 좌상단 상태 패널 (HP / 피로도 / 시계 / 날씨)
  // ═══════════════════════════════════════════════════
  /** 상태 패널 파괴 — 단계 재생성 전 필수(안 걷으면 뒤에 겹쳐 남는다, 118차 채널 사례와 동일) */
  private destroyStatusPanel(): void {
    this.hideWeatherTip();
    this.hideValueTip();
    this.statusC?.destroy();          // 컨테이너 destroy = 자식까지
    this.badgeGlyphs = [];
    this.badgeCaptions = [];
    this.badgeHits = [];
    this.vitalHits = [];
    this.vitalLabels.clear();
    // 스트립은 패널 밖 컨테이너 — 단계마다 y가 달라지므로 시그니처를 비워 다음 틱에 재생성시킨다
    this.stripC?.destroy();
    this.stripC = undefined;
    this.stripSig = '';
  }

  /**
   * 상태 패널 생성 — `statusSize` 단계에 맞춘 **실치수 레이아웃**.
   * 글씨 크기는 단계와 무관하게 같다(작은 패널에서 글씨까지 줄어들면 읽을 수 없다 — 118차 피드백).
   */
  private createStatusPanel(): void {
    this.destroyStatusPanel();
    const L = SP_LAYOUTS[Phaser.Math.Clamp(this.statusSize, 0, SP_LAYOUTS.length - 1)];
    this.statusLayout = L;

    // 래퍼는 HUD(this)의 자식 — (116차엔 `statusC.add(statusC)`로 자기 자신에 넣어 화면에 아예 안 나왔다)
    this.statusC = this.scene.add.container(0, 0);
    this.add(this.statusC);
    const bg = this.scene.add.graphics();
    paintHudPanel(bg, SP.x, SP.y, L.w, L.h, { headerH: HUD_HEADER_H });
    this.statusC.add(bg);

    // 타이틀바 — 제목은 좌측, 조절 버튼(◱ ◐)은 우측(rebuildCtrl). 아래 컨텐츠와 겹치지 않는다.
    const titleT = this.scene.add.text(SP.x + SP.pad, SP.y + 4, '상태', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#4af2a1', fontStyle: 'bold',
    });
    this.statusC.add(titleT);

    const lx = SP.x + SP.pad;
    const full = L.badges === 'full';

    // ── 게이지 라벨 — rect는 barRects()가 단일 소스(렌더·히트 공유) ──
    this.vitalLabels.clear();
    this.barsG = this.scene.add.graphics();
    for (const r of this.barRects()) {
      const iconKey = VITAL_LABEL[r.key].icon;
      if (iconKey) {
        // 허기·수분 = 텍스트 라벨 대신 픽셀 아이콘 (호버 툴팁이 이름을 설명한다)
        const img = addPixelIcon(this.scene, iconKey, r.labelX + VITAL_ICON / 2, r.y + r.h / 2, VITAL_ICON);
        if (img) this.statusC.add(img);
        continue;
      }
      // 경험치 라벨은 `Lv.n`이라 updateStatus에서 매초 갱신한다(생성 시엔 빈 문자열)
      const label = this.scene.add.text(r.labelX, r.y + r.h / 2,
        r.key === 'xp' ? '' : this.vitalLabelText(r.key), {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#a0b8c8', fontStyle: 'bold',
        }).setOrigin(0, 0.5);
      this.vitalLabels.set(r.key, label);
      this.statusC.add(label);
    }
    this.statusC.add(this.barsG);
    this.createVitalHits();

    // ── 날짜 / 시각 (KST 명시) — 최소 단계는 시각만 ──
    // '대'는 경험치 바(+52)가 끼어 날짜·시계가 14px 아래로 밀린다. '중/소'는 무변경.
    if (L.date) {
      this.dateText = this.scene.add.text(lx, SP_CONTENT_Y + (full ? 66 : 52), '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#9fd0e4',
      });
      this.statusC.add(this.dateText);
    } else {
      this.dateText = undefined;
    }

    const clockY = L.date ? SP_CONTENT_Y + (full ? 82 : 68) : SP_CONTENT_Y + 50;
    this.clockText = this.scene.add.text(lx, clockY, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#e8f4fd', fontStyle: 'bold',
    });
    this.statusC.add(this.clockText);

    // x는 updateStatus에서 시계 실폭 기준으로 다시 잡는다(생성 시점엔 시계가 비어 있다)
    this.dayNightText = this.scene.add.text(lx + 92, clockY + 5, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffcc44',
    });
    this.statusC.add(this.dayNightText);

    // ── 원형 날씨 배지 (주야간 / 날씨 / 안개 / 바람) ──
    this.badgeG = this.scene.add.graphics();
    this.statusC.add(this.badgeG);

    if (L.badges !== 'none') {
      for (let i = 0; i < 4; i++) {
        const { x: bx, y: by } = badgePos(L, i);
        const glyph = this.scene.add.text(bx, by, '', {
          fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff',
        }).setOrigin(0.5);
        this.badgeGlyphs.push(glyph);
        this.statusC.add(glyph);
        if (L.badges === 'full') {
          // wordWrap으로 슬롯 폭을 넘지 못하게 한다 (maxLines는 쓰지 않는다 —
          // 값이 잘려 '맑음 25.9°C'가 '맑음'이 되어버린다)
          const cap = this.scene.add.text(bx + BADGE_R + 5, by, '', {
            fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#cfe3f2',
            wordWrap: { width: CAPTION_MAX_W },
          }).setOrigin(0, 0.5);
          this.badgeCaptions.push(cap);
          this.statusC.add(cap);
        } else {
          // 아이콘 단계 — 캡션 대신 **아이콘 호버 툴팁**
          const hit = this.scene.add.rectangle(bx, by, BADGE_R * 2 + 8, BADGE_R * 2 + 8, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: false });
          hit.on('pointerover', (p: Phaser.Input.Pointer) => this.showWeatherTip([i], p));
          hit.on('pointermove', (p: Phaser.Input.Pointer) => this.moveWeatherTip(p));
          hit.on('pointerout', () => this.hideWeatherTip());
          this.badgeHits.push(hit);
          this.statusC.add(hit);
        }
      }
    } else {
      // 최소 단계 — 패널 어디든 호버하면 날씨 4종 전체를 커서 우측 하단에 띄운다
      const hit = this.scene.add.rectangle(SP.x + L.w / 2, SP_CONTENT_Y + (L.h - HUD_HEADER_H) / 2, L.w, L.h - HUD_HEADER_H, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: false });
      hit.on('pointerover', (p: Phaser.Input.Pointer) => this.showWeatherTip([0, 1, 2, 3], p));
      hit.on('pointermove', (p: Phaser.Input.Pointer) => this.moveWeatherTip(p));
      hit.on('pointerout', () => this.hideWeatherTip());
      this.badgeHits.push(hit);
      this.statusC.add(hit);
    }
  }

  // ── 생존 지표 게이지 (126차 P3) ─────────────────────
  /**
   * 게이지 라벨 텍스트 — **항상 한국어 원문**을 넘긴다.
   * `Text.setText` i18n 훅이 사전으로 번역하고, 로케일 전환 시 `setLocale`이 원문으로 되돌려 다시 번역한다
   * (여기서 영어를 직접 넣으면 ko로 되돌아올 때 역방향 사전이 없어 영어가 굳는다 — 118차 규칙).
   */
  private vitalLabelText(key: VitalKey): string {
    return VITAL_LABEL[key].ko;
  }

  /**
   * 게이지 rect 단일 소스. 렌더(`updateStatus`)와 호버 히트(`createVitalHits`)가 이 값을 공유하므로
   * 레이아웃을 고쳐도 툴팁 판정이 어긋나지 않는다.
   *
   * '대' 배치 (CONTENT_Y 기준):
   *   좌: 체력 +12 / 피로도 +32 / 경험치 +52(얇게 6px)
   *   우: 허기 +68 / 수분 +84 (컴팩트 — 날짜·시계 우측 컬럼)
   */
  private barRects(): VitalRect[] {
    const L = this.statusLayout;
    const lx = SP.x + SP.pad;
    const bx = lx + SP.labelW;
    const bw = L.w - SP.pad * 2 - SP.labelW;
    const rows: VitalRect[] = [
      { key: 'hp', labelX: lx, x: bx, y: SP_CONTENT_Y + 12, w: bw, h: 10 },
      { key: 'fatigue', labelX: lx, x: bx, y: SP_CONTENT_Y + 32, w: bw, h: 10 },
    ];
    if (L.badges !== 'full') return rows;
    // 경험치 — 피로도보다 얇게(6px), 좌측 라벨은 `Lv.n`
    rows.push({ key: 'xp', labelX: lx, x: bx, y: SP_CONTENT_Y + 52, w: bw, h: 6 });
    // 허기·수분 — 우측 컬럼 컴팩트 바. 라벨은 픽셀 아이콘(빵·물방울)이라 로케일 폭 문제가 없다.
    // 아이콘(16px) 컬럼 — 행 간격 22px라 위아래 아이콘이 맞닿지 않는다(실측 6px 여유).
    // 바는 아이콘 우측 224에서 시작해 324에서 끝난다(패널 컨텐츠 우측 한계 326).
    const rx = SP.x + SP.pad + 176;
    rows.push({ key: 'hunger', labelX: rx, x: rx + 22, y: SP_CONTENT_Y + 62, w: 100, h: 8 });
    rows.push({ key: 'hydration', labelX: rx, x: rx + 22, y: SP_CONTENT_Y + 84, w: 100, h: 8 });
    return rows;
  }

  /** 게이지 호버 히트 — 라벨~바 전체를 덮는다(얇은 바를 정확히 겨냥하지 않아도 뜨게) */
  private createVitalHits(): void {
    for (const r of this.barRects()) {
      const x0 = Math.min(r.labelX, r.x) - 2;
      const w = r.x + r.w - x0 + 2;
      const hit = this.scene.add.rectangle(x0 + w / 2, r.y + r.h / 2, w, Math.max(r.h + 8, 16), 0xffffff, 0.001)
        .setInteractive({ useHandCursor: false });
      const anchor: TipAnchor = { x: x0, y: r.y - 4, w, h: r.h + 8 };
      hit.on('pointerover', () => this.showValueTip(r.key, anchor));
      hit.on('pointerout', () => this.hideValueTip());
      this.vitalHits.push(hit);
      this.statusC.add(hit);
    }
  }

  /** 게이지 현재/최대 + 비율 — 툴팁과 렌더가 같은 값을 쓴다 */
  private vitalValue(key: VitalKey): { cur: number; max: number; ratio: number; extra?: string } {
    const v = GameState.vitals;
    const p = GameState.player;
    switch (key) {
      case 'hp': return { cur: Math.round(v.hp), max: v.maxHp, ratio: v.maxHp > 0 ? v.hp / v.maxHp : 0 };
      case 'fatigue': return { cur: Math.round(v.fatigue), max: v.maxFatigue, ratio: v.maxFatigue > 0 ? v.fatigue / v.maxFatigue : 0 };
      case 'hunger': return { cur: Math.round(v.hunger), max: 100, ratio: v.hunger / 100 };
      case 'hydration': return { cur: Math.round(v.hydration), max: 100, ratio: v.hydration / 100 };
      case 'xp': {
        const lv = p.level ?? 1;
        // 138차 — 만렙에서도 XP는 쌓인다. 바는 채운 채로 두고 누적치를 숫자로 보여준다.
        if (lv >= MAX_LEVEL) {
          return { cur: Math.round(p.experience ?? 0), max: 0, ratio: 1, extra: `Lv.${lv} MAX` };
        }
        const need = xpToNext(lv);
        return { cur: Math.round(p.experience ?? 0), max: need, ratio: need > 0 ? (p.experience ?? 0) / need : 0, extra: `Lv.${lv}` };
      }
    }
  }

  /**
   * 수치 호버 팝업 — 상시 숫자를 없앤 대신(SPEC §7) 호버로만 보여준다.
   * 라벨(사전 대상)과 수치(숫자만)를 **분리된 Text**로 그린다 — 통짜 문자열은 i18n 규칙이 갉아먹는다(119차).
   */
  private showValueTip(key: VitalKey, anchor: TipAnchor): void {
    this.hideValueTip();
    const d = VITAL_LABEL[key];
    const val = this.vitalValue(key);
    const pct = Math.round(val.ratio * 100);
    // 허기·수분은 100 만점 지표라 **비율 표기**가 직관적이다 — `62% / 100%`.
    // 체력·피로도·경험치는 절대치가 의미를 가지므로 `현재 / 최대 (비율)`을 유지한다.
    const valueStr = d.icon
      ? `${pct}% / 100%`
      : (val.max > 0 ? `${val.cur} / ${val.max} (${pct}%)` : `(${pct}%)`);

    const c = this.scene.add.container(0, 0);
    const g = this.scene.add.graphics();
    c.add(g);
    const padX = 10, padY = 7;
    const label = this.scene.add.text(padX, padY, this.vitalLabelText(key), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#cfe3f2', fontStyle: 'bold',
    });
    const value = this.scene.add.text(padX, padY + 16, valueStr, {
      fontFamily: 'monospace', fontSize: '12px', color: '#e8f4fd',
    });
    c.add([label, value]);
    let h = padY * 2 + 32;
    let w = padX * 2 + Math.max(label.width, value.width);
    if (val.extra) {
      const ex = this.scene.add.text(padX, padY + 32, val.extra, {
        fontFamily: 'monospace', fontSize: '11px', color: '#e8ddc0',
      });
      c.add(ex);
      w = Math.max(w, padX * 2 + ex.width);
      h += 16;
    }
    g.fillStyle(0x06101e, 0.96);
    g.fillRoundedRect(0, 0, w, h, 5);
    g.lineStyle(1.2, d.color, 0.9);
    g.strokeRoundedRect(0, 0, w, h, 5);
    c.setSize(w, h);
    this.valueTip = c;
    this.add(c);
    applyScreenFixed(this);
    this.anchorTip(c, anchor);
    // 매초 갱신 — 게이지는 실시간으로 줄어든다(팝업이 멈춰 있으면 거짓 정보가 된다)
    this.tipRefresh = () => this.showValueTip(key, anchor);
  }

  private hideValueTip(): void {
    this.tipRefresh = undefined;
    this.valueTip?.destroy();
    this.valueTip = undefined;
  }

  /**
   * 툴팁을 **앵커 옆 여유 공간 쪽으로** 펼친다 (커서 추종 아님 —
   * 칩/게이지 위에서 마우스를 움직여도 팝업이 흔들리지 않는다).
   * 좌우는 남는 폭이 큰 쪽, 상하는 남는 높이가 큰 쪽으로 확장하고 화면 안으로 클램프한다.
   */
  private anchorTip(c: Phaser.GameObjects.Container, a: TipAnchor): void {
    const gap = 6;
    const w = c.width, h = c.height;
    const roomR = GAME_WIDTH - (a.x + a.w) - gap * 2;
    const roomL = a.x - gap * 2;
    let x = (roomR >= w || roomR >= roomL) ? a.x + a.w + gap : a.x - gap - w;
    x = Math.min(Math.max(4, x), Math.max(4, GAME_WIDTH - w - 4));
    const roomD = GAME_HEIGHT - a.y - 4;
    const roomU = a.y + a.h - 4;
    let y = (roomD >= h || roomD >= roomU) ? a.y : a.y + a.h - h;
    y = Math.min(Math.max(4, y), Math.max(4, GAME_HEIGHT - h - 4));
    c.setPosition(x, y);
  }

  // ── 상태이상 스트립 (패널 밖 하단 좌정렬) ────────────
  /** 활성 목록이 바뀔 때만 재생성 — 매초 파괴/생성하면 호버가 끊긴다 */
  private refreshStatusStrip(): void {
    const list = GameState.statuses;
    const sig = `${getLocale()}|${this.statusSize}|${list.map((a) => a.id).join(',')}`;
    if (sig === this.stripSig) return;
    this.stripSig = sig;
    this.stripC?.destroy();
    this.stripC = undefined;
    if (list.length === 0) return;

    const c = this.scene.add.container(0, 0);
    const y0 = SP.y + this.statusLayout.h + STRIP.top;
    // 툴팁 앵커는 **스트립 전체 박스**다 — 칩 하나에 붙이면 팝업이 옆 칩들을 덮어
    // 다른 상태이상으로 커서를 옮길 수 없다(실렌더에서 확인).
    const rows = Math.ceil(list.length / STRIP.perRow);
    const stripBox: TipAnchor = {
      x: SP.x,
      y: y0,
      w: Math.min(list.length, STRIP.perRow) * (STRIP.chip + STRIP.gap) - STRIP.gap,
      h: rows * (STRIP.chip + STRIP.gap) - STRIP.gap,
    };
    list.forEach((a, i) => {
      const def = getStatusEffect(a.id);
      if (!def) return;
      const col = i % STRIP.perRow;
      const row = Math.floor(i / STRIP.perRow);
      const x = SP.x + col * (STRIP.chip + STRIP.gap);
      const y = y0 + row * (STRIP.chip + STRIP.gap);
      const g = this.scene.add.graphics();
      g.fillStyle(def.badge.color, 0.32);
      g.fillRoundedRect(x, y, STRIP.chip, STRIP.chip, 4);
      g.lineStyle(1.2, def.badge.color, 0.95);
      g.strokeRoundedRect(x, y, STRIP.chip, STRIP.chip, 4);
      // 칩 안의 그림 = 16x16 손그림 픽셀 아이콘 (로케일 무관 — 사전을 타지 않는다)
      const icon = addPixelIcon(this.scene, def.badge.icon, x + STRIP.chip / 2, y + STRIP.chip / 2, STRIP.icon);
      const hit = this.scene.add.rectangle(x + STRIP.chip / 2, y + STRIP.chip / 2, STRIP.chip + 2, STRIP.chip + 2, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: false });
      hit.on('pointerover', () => this.showStatusTip(def.id, stripBox));
      hit.on('pointerout', () => this.hideValueTip());
      c.add(icon ? [g, icon, hit] : [g, hit]);
    });
    this.stripC = c;
    this.add(c);
    applyScreenFixed(this);
  }

  /**
   * 상태이상 툴팁 — 아이콘 · 이름 · 남은 시간(자연치유) 또는 치료 수단 · 설명 (Ko/En).
   * **매초 갱신**되므로 남은 시간이 실시간으로 줄어든다. 상태가 풀리면 스스로 닫힌다.
   */
  private showStatusTip(id: StatusEffectId, anchor: TipAnchor): void {
    this.hideValueTip();
    const a = GameState.statuses.find((x) => x.id === id);
    const def = a ? getStatusEffect(a.id) : undefined;
    if (!a || !def) return;
    const en = getLocale() === 'en';
    const remain = statusRemainMs(a);
    const sub = remain !== null
      ? `${en ? 'Recovers in' : '자연치유까지'} ${formatRemain(remain)}`
      : (en ? STATUS_CURE_LABEL[def.cure].en : STATUS_CURE_LABEL[def.cure].ko);

    const c = this.scene.add.container(0, 0);
    const g = this.scene.add.graphics();
    c.add(g);
    const padX = 10, padY = 8, maxW = 240;
    // 제목 줄 = 아이콘 + 이름 (스트립 칩과 같은 그림이라 어느 배지의 설명인지 즉시 연결된다)
    const tipIcon = addPixelIcon(this.scene, def.badge.icon, padX + 9, padY + 9, 18);
    if (tipIcon) c.add(tipIcon);
    const nameX = tipIcon ? padX + 24 : padX;
    const name = this.scene.add.text(nameX, padY + 2, en ? def.nameEn : def.nameKo, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#f2f8ff', fontStyle: 'bold',
    });
    // wordWrap 아래는 고정 y 금지 — 실측 흐름 배치 (119차 규칙)
    const subT = this.scene.add.text(padX, name.y + name.height + 4, sub, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffcc44',
      wordWrap: { width: maxW },
    });
    const desc = this.scene.add.text(padX, subT.y + subT.height + 4, en ? def.descEn : def.descKo, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#cfe3f2',
      wordWrap: { width: maxW },
    });
    c.add([name, subT, desc]);
    const w = padX * 2 + Math.max(nameX - padX + name.width, subT.width, desc.width);
    const h = desc.y + desc.height + padY;
    g.fillStyle(0x06101e, 0.96);
    g.fillRoundedRect(0, 0, w, h, 5);
    g.lineStyle(1.2, def.badge.color, 0.95);
    g.strokeRoundedRect(0, 0, w, h, 5);
    c.setSize(w, h);
    this.valueTip = c;
    this.add(c);
    applyScreenFixed(this);
    this.anchorTip(c, anchor);
    this.tipRefresh = () => this.showStatusTip(id, anchor);
  }

  // ── 날씨 호버 툴팁 (축소 단계 전용) ──────────────────
  /** 커서 우측 하단에 날씨 항목 설명을 띄운다 (아이콘 + 텍스트) */
  private showWeatherTip(indices: number[], p: Phaser.Input.Pointer): void {
    this.hideWeatherTip();
    if (this.badgeData.length < 4) return;
    const rows = indices.map((i) => this.badgeData[i]).filter(Boolean);
    if (rows.length === 0) return;

    const c = this.scene.add.container(0, 0);
    const padX = 10, padY = 8, rowH = 22, r = 9;
    const g = this.scene.add.graphics();
    c.add(g);
    let maxTextW = 0;
    rows.forEach((row, idx) => {
      const cy = padY + rowH / 2 + idx * rowH;
      const glyph = this.scene.add.text(padX + r, cy, row.glyph, {
        fontFamily: 'sans-serif', fontSize: '12px', color: row.active ? '#ffffff' : '#5d6f7e',
      }).setOrigin(0.5);
      const cap = this.scene.add.text(padX + r * 2 + 6, cy, row.caption, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: row.active ? '#cfe3f2' : '#7d8f9e',
      }).setOrigin(0, 0.5);
      maxTextW = Math.max(maxTextW, cap.width);
      c.add([glyph, cap]);
    });
    const w = padX * 2 + r * 2 + 6 + maxTextW;
    const h = padY * 2 + rows.length * rowH;
    g.fillStyle(0x06101e, 0.96);
    g.fillRoundedRect(0, 0, w, h, 5);
    g.lineStyle(1.2, 0x2a5a8a, 0.95);
    g.strokeRoundedRect(0, 0, w, h, 5);
    // 배지 원 (아이콘 뒤)
    rows.forEach((row, idx) => {
      const cy = padY + rowH / 2 + idx * rowH;
      g.fillStyle(row.active ? row.color : 0x24323e, row.active ? 0.28 : 0.5);
      g.fillCircle(padX + r, cy, r);
      g.lineStyle(1.2, row.active ? row.color : 0x3a4a58, row.active ? 0.95 : 0.7);
      g.strokeCircle(padX + r, cy, r);
    });
    c.setSize(w, h);
    this.weatherTip = c;
    this.add(c);
    applyScreenFixed(this);
    this.moveWeatherTip(p);
  }

  /** 툴팁을 커서 우측 하단에 붙인다 (화면 밖으로 나가면 반대편으로) */
  private moveWeatherTip(p: Phaser.Input.Pointer): void {
    const c = this.weatherTip;
    if (!c) return;
    const w = c.width, h = c.height;
    let x = p.x + 14, y = p.y + 16;
    if (x + w > GAME_WIDTH - 4) x = Math.max(4, p.x - 14 - w);
    if (y + h > GAME_HEIGHT - 4) y = Math.max(4, p.y - 16 - h);
    c.setPosition(x, y);
  }

  private hideWeatherTip(): void {
    this.weatherTip?.destroy();
    this.weatherTip = undefined;
  }

  /**
   * 원형 배지 1개 렌더.
   * @param active 비활성이면 어둡게 (해당 기상 현상이 없음)
   */
  private drawBadge(idx: number, glyph: string, caption: string, color: number, active: boolean): void {
    // 내용은 단계와 무관하게 항상 기록한다 — 축소 단계의 호버 툴팁이 이 값을 그린다
    this.badgeData[idx] = { glyph, caption, color, active };
    if (this.statusLayout.badges === 'none') return;

    const { x: bx, y: by } = badgePos(this.statusLayout, idx);
    this.badgeG.fillStyle(active ? color : 0x24323e, active ? 0.28 : 0.5);
    this.badgeG.fillCircle(bx, by, BADGE_R);
    this.badgeG.lineStyle(1.5, active ? color : 0x3a4a58, active ? 0.95 : 0.7);
    this.badgeG.strokeCircle(bx, by, BADGE_R);

    this.badgeGlyphs[idx]?.setText(glyph).setColor(active ? '#ffffff' : '#5d6f7e');
    this.badgeCaptions[idx]?.setText(caption).setColor(active ? '#cfe3f2' : '#5d6f7e');
  }

  private updateStatus = (): void => {
    const p = GameState.player;

    // ── 게이지 (체력·피로도 / '대'는 경험치·허기·수분 추가) ──
    // 최대치는 100 고정이 아니다 — 레벨·스킬·상태이상이 maxHp/maxFatigue를 바꾼다(125차).
    this.barsG.clear();
    const low = GameState.isVitalsLow;
    for (const r of this.barRects()) {
      const val = this.vitalValue(r.key);
      this.barsG.fillStyle(0x101820, 0.9);
      this.barsG.fillRect(r.x, r.y, r.w, r.h);
      // 허기·수분은 임계(20%) 미만이면 경고색 — 숫자를 안 띄우는 대신 색으로 알린다
      const warn = (r.key === 'hunger' || r.key === 'hydration') && val.ratio < 0.2;
      this.barsG.fillStyle(warn ? 0xe04b3a : VITAL_LABEL[r.key].color, 0.95);
      this.barsG.fillRect(r.x, r.y, r.w * Phaser.Math.Clamp(val.ratio, 0, 1), r.h);
      this.barsG.lineStyle(1, 0x2a5a8a, 0.9);
      this.barsG.strokeRect(r.x, r.y, r.w, r.h);
      if (r.key === 'xp') {
        const lv = p.level ?? 1;
        this.vitalLabels.get('xp')?.setText(lv >= MAX_LEVEL ? 'Lv.MAX' : `Lv.${lv}`);
      }
    }
    // 허기·수분 임계 시 라벨을 붉게 (감속·피로 가중이 걸린 상태)
    for (const key of ['hunger', 'hydration'] as const) {
      this.vitalLabels.get(key)?.setColor(low ? '#ff9a8a' : '#a0b8c8');
    }

    // ── 상태이상 스트립 (패널 밖) ──
    this.refreshStatusStrip();
    // 열린 호버 팝업이 있으면 같은 주기로 다시 그린다(남은 시간·수치 실시간)
    this.tipRefresh?.();

    // ── 날짜/시각 (KST 고정) ──
    // 사용자의 로컬 타임존이 KST가 아니어도 게임 시간은 항상 한국시간 기준이므로
    // toLocaleString에 Asia/Seoul을 명시해 실제 KST를 표시한다.
    const now = new Date();
    const kst = kstParts(now);
    // 134차 — 실습생 기한 D-nn (STORY_SPEC §6 상태 패널 뱃지)
    // ⚠ dl 은 음수가 될 수 있다(기한 초과) — 그대로 넣으면 `D--3` 이 된다(135차 실측).
    const dl = StoryStore.deadlineDaysLeft();
    const ddayTxt = dl == null ? ''
      : dl >= 0 ? ` · D-${dl}` : ` · D+${-dl} (기한 초과)`;
    this.dateText?.setText(`${kst.y}년 ${kst.mo}월 ${kst.d}일 (${kst.dow}) · KST${ddayTxt}`);
    this.clockText.setText(`${kst.hh}:${kst.mi}:${kst.ss}`);

    const night = isNightHour(Number(kst.hh));
    this.dayNightText.setText(night ? '야간' : '주간').setColor(night ? '#8fa9d0' : '#ffcc44');
    // 시계 폭은 **텍스트가 채워진 뒤에야** 확정된다 — 생성 시점(빈 문자열, width 0)에 잡으면 시계 위에 겹친다
    this.dayNightText.setX(SP.x + SP.pad + this.clockText.width + 8);

    // ── 원형 날씨 배지 ──
    const region = this.cfg.regionId;
    const kind = ExternalDataStore.getWeatherKind(region);
    const kma = ExternalDataStore.getKmaWeather(region);
    const marine = ExternalDataStore.getRegionMarineWeather(region);

    this.badgeG.clear();

    // 1) 주간/야간
    this.drawBadge(0, night ? '☾' : '☀', night ? '어두움' : '밝음',
      night ? 0x8fa9d0 : 0xffcc44, true);

    // 2) 날씨 (기상청 SKY/PTY)
    const tempC = kma?.tempC ?? marine?.airTempC;
    this.drawBadge(1, KIND_GLYPH[kind], tempC !== undefined ? `${WEATHER_LABEL[kind]} ${tempC.toFixed(1)}°C` : WEATHER_LABEL[kind],
      KIND_COLOR[kind], true);

    // 3) 안개 — 해양기상 시정(HORIZON_VISIBL) 기반. 시정 관측소가 없으면 비활성.
    const vis = marine?.visibilityM;
    const foggy = kind === 'fog' || (vis !== undefined && vis < 1000);
    this.drawBadge(2, '≋',
      vis !== undefined ? (foggy ? `안개 ${(vis / 1000).toFixed(1)}km` : `시정 ${(vis / 1000).toFixed(1)}km`) : '안개 —',
      0x9aa8b0, foggy);

    // 4) 바람 — 기상청 풍속 우선, 없으면 해양기상 실측
    const wind = kma?.windSpeedMs ?? marine?.windSpeedMs;
    const windy = wind !== undefined && wind >= 4;
    this.drawBadge(3, '≈', wind !== undefined ? `바람 ${wind.toFixed(1)}m/s` : '바람 —',
      windy ? 0x6fd3e0 : 0x4a86b0, wind !== undefined);
  };

  // ═══════════════════════════════════════════════════
  // 우상단 미니맵 (M 키 크기 순환)
  // ═══════════════════════════════════════════════════
  private createMiniMap(): void {
    // 지형 그리드를 1타일=1px 텍스처로 1회 베이킹
    const texKey = `rhud_mini_${this.cfg.mapId}`;
    if (!this.scene.textures.exists(texKey)) {
      const total = this.cfg.cols * this.cfg.rows;
      if (total > 60_000) {
        // 대형(심리스) 맵 — Graphics 커맨드 수십만 개는 generateTexture가 느리다.
        // CanvasTexture에 ImageData로 직접 픽셀을 쓰는 경로 (한 번에 O(N) 바이트 쓰기).
        const tex = this.scene.textures.createCanvas(texKey, this.cfg.cols, this.cfg.rows)!;
        const ctx = tex.getContext();
        const img = ctx.createImageData(this.cfg.cols, this.cfg.rows);
        const d = img.data;
        let i = 0;
        for (let r = 0; r < this.cfg.rows; r++) {
          const row = this.cfg.terrain[r];
          for (let c = 0; c < this.cfg.cols; c++) {
            const col = MINI_COL[row[c]];
            d[i] = (col >> 16) & 255; d[i + 1] = (col >> 8) & 255; d[i + 2] = col & 255; d[i + 3] = 255;
            i += 4;
          }
        }
        ctx.putImageData(img, 0, 0);
        tex.refresh();
      } else {
        const g = this.scene.add.graphics();
        for (let r = 0; r < this.cfg.rows; r++) {
          for (let c = 0; c < this.cfg.cols; c++) {
            g.fillStyle(MINI_COL[this.cfg.terrain[r][c]], 1);
            g.fillRect(c, r, 1, 1);
          }
        }
        g.generateTexture(texKey, this.cfg.cols, this.cfg.rows);
        g.destroy();
      }
    }

    this.miniContainer = this.scene.add.container(0, 0);
    this.add(this.miniContainer);
    this.buildMiniMap();
  }

  private buildMiniMap(): void {
    this.miniContainer.removeAll(true);

    const size = MINI_SIZES[this.miniSizeIdx];
    const scale = Math.min(size / this.cfg.cols, size / this.cfg.rows);
    this.miniDispW = this.cfg.cols * scale;
    this.miniDispH = this.cfg.rows * scale;

    const HDR = RegionHud.MINI_HDR;
    const ox = GAME_WIDTH - this.miniDispW - 16;
    const oy = 16 + HDR;
    this.miniContainer.setPosition(ox, oy);

    // 타이틀 밴드(155차) — 제목 + [−][+] 크기 버튼. 컨텐츠(지도)는 밴드 아래에서 시작한다(119차 규칙).
    const frame = this.scene.add.graphics();
    paintHudPanel(frame, -5, -5 - HDR, this.miniDispW + 10, this.miniDispH + 10 + HDR, { alpha: 0.95, headerH: HDR });
    this.miniContainer.add(frame);
    const mtitle = this.scene.add.text(0, -5 - HDR + 3, '지도', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fc0d4', fontStyle: 'bold',
    });
    this.miniContainer.add(mtitle);
    const mkBtn = (x: number, glyph: string, onClick: () => void): void => {
      const top = -5 - HDR + 2;
      const g = this.scene.add.graphics();
      g.fillStyle(0x0a1628, 0.92); g.fillRoundedRect(x, top, 14, 14, 3);
      g.lineStyle(1, 0x2a5a8a, 1); g.strokeRoundedRect(x, top, 14, 14, 3);
      const t = this.scene.add.text(x + 7, top + 7, glyph, { fontFamily: 'sans-serif', fontSize: '11px', color: '#9fc0d4', fontStyle: 'bold' }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(x + 7, top + 7, 16, 16, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => t.setColor('#ffffff'));
      hit.on('pointerout', () => t.setColor('#9fc0d4'));
      // 클릭 핸들러 안에서 미니맵을 재생성하면 입력 디스패치 중 오브젝트가 사라진다 — 다음 틱으로
      hit.on('pointerdown', () => { this.scene.time.delayedCall(0, () => { onClick(); restoreHandCursor(this.scene); }); });
      this.miniContainer.add([g, t, hit]);
    };
    mkBtn(this.miniDispW + 5 - 34, '−', () => this.stepMiniMapSize(-1));
    mkBtn(this.miniDispW + 5 - 16, '+', () => this.stepMiniMapSize(1));

    const img = this.scene.add.image(0, 0, `rhud_mini_${this.cfg.mapId}`)
      .setOrigin(0, 0)
      .setScale(scale)
      .setAlpha(0.92)
      .setInteractive();
    // 미니맵 클릭 → 정규화 좌표 이벤트 (dev: Ctrl+클릭 순간이동 — RegionFieldScene가 소비)
    img.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const ev = p.event as MouseEvent | undefined;
      const nx = Phaser.Math.Clamp((p.x - ox) / this.miniDispW, 0, 1);
      const ny = Phaser.Math.Clamp((p.y - oy) / this.miniDispH, 0, 1);
      this.scene.events.emit('minimap-click', nx, ny, !!ev?.ctrlKey);
    });
    this.miniContainer.add(img);

    const hint = this.scene.add.text(this.miniDispW / 2, this.miniDispH + 6, 'M 전체 지도', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
    }).setOrigin(0.5, 0);
    this.miniContainer.add(hint);

    this.miniMarkerC = this.scene.add.container(0, 0);
    this.miniContainer.add(this.miniMarkerC);
    this.drawMiniMarkers();

    this.miniMarker = this.scene.add.circle(0, 0, 3.5, 0xff4040).setStrokeStyle(1, 0xffffff, 0.9);
    this.miniContainer.add(this.miniMarker);

    // 재구성된 자식 히트 영역 보정
    applyScreenFixed(this.miniContainer);
    this.layoutTracker();
  }

  /** 155차 — 타이틀바 [−]/[+]: 크기 단계 이동 (150 ↔ 250 ↔ 350, 양 끝에서 멈춘다) */
  stepMiniMapSize(dir: 1 | -1): void {
    const next = Phaser.Math.Clamp(this.miniSizeIdx + dir, 0, MINI_SIZES.length - 1);
    if (next === this.miniSizeIdx) return;
    this.miniSizeIdx = next;
    this.buildMiniMap();
  }

  /** 미니맵 하단 y (화면 좌표) — 추적기·토스트가 그 아래에 선다 */
  private miniBottomY(): number { return 16 + RegionHud.MINI_HDR + this.miniDispH + 22; }

  // ═══════════════════════════════════════════════════
  // 155차 — 「지금 할 일」 추적기 (미니맵 아래)
  // ═══════════════════════════════════════════════════
  setQuestTracker(data: QuestTrackerData | null): void {
    const same = JSON.stringify(data) === JSON.stringify(this.trackerData);
    this.trackerData = data;
    if (!same) this.layoutTracker();
  }

  private layoutTracker(): void {
    this.trackerC?.destroy();
    this.trackerC = undefined;
    const d = this.trackerData;
    if (!d) return;
    const W = Math.max(236, this.miniDispW + 10);
    const x = GAME_WIDTH - 16 - W + 5, y = this.miniBottomY();
    const c = this.scene.add.container(x, y);
    const HDR = 18, PADX = 8;
    const parts: Phaser.GameObjects.GameObject[] = [];
    let cy = HDR + 6;
    const mk = (txt: string, size: number, color: string, bold = false): Phaser.GameObjects.Text => {
      const t = this.scene.add.text(PADX, cy, txt, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal',
        wordWrap: { width: W - PADX * 2 }, lineSpacing: 2,
      });
      cy += t.height + 4;
      parts.push(t);
      return t;
    };
    mk(d.title, 12, '#ffe9a0', true);
    mk(d.objective, 11, '#e8f4fd');
    if (d.howTo) mk(d.howTo, 10, '#9fc0d4');
    if (d.distance) mk(d.distance, 10, '#7fe0b0', true);
    const H = cy + 4;
    const bg = this.scene.add.graphics();
    paintHudPanel(bg, 0, 0, W, H, { alpha: 0.92, headerH: HDR });
    const head = this.scene.add.text(PADX, 3, '지금 할 일', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#4af2a1', fontStyle: 'bold',
    });
    const badge = this.scene.add.text(W - PADX, 3, 'J 일지', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
    }).setOrigin(1, 0);
    c.add([bg, head, badge, ...parts]);
    this.add(c);
    this.trackerC = c;
    applyScreenFixed(this);
  }

  // ═══════════════════════════════════════════════════
  // 155차 — 획득 토스트 (우측 · 아이콘 + 이름 × 수량 · 페이드 인/아웃)
  // ═══════════════════════════════════════════════════
  showItemToast(t: ItemToastData): void {
    const W = 250, H = 46;
    const c = this.scene.add.container(GAME_WIDTH - 16 - W + 30, 0);
    const bg = this.scene.add.graphics();
    const gold = t.kind === 'quest' || t.bound;
    paintHudPanel(bg, 0, 0, W, H, { alpha: 0.94 });
    if (gold) { bg.lineStyle(1.5, 0xffd257, 0.95); bg.strokeRect(0.5, 0.5, W - 1, H - 1); }
    c.add(bg);
    if (t.item) {
      const icon = createItemIcon(this.scene, 24, H / 2, t.item, 26);
      c.add(icon);
    } else if (t.iconKey) {
      const ic = addPixelIcon(this.scene, t.iconKey, 24, H / 2, 16);
      if (ic) c.add(ic);
    }
    const head = this.scene.add.text(46, 7, t.kind === 'quest' ? '할 일 보상' : t.kind === 'coin' ? '재화' : t.bound ? '이야기가 준 물건' : '획득', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: gold ? '#ffd257' : '#7a98ac', fontStyle: 'bold',
    });
    const name = this.scene.add.text(46, 21, t.qty > 1 ? `${t.name}  ×${t.qty}` : t.name, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#e8f4fd', fontStyle: 'bold',
    });
    clampTextWidth(name, W - 46 - 8);
    c.add([head, name]);
    c.setAlpha(0);
    this.add(c);
    applyScreenFixed(this);
    this.toasts.push({ c, h: H });
    if (this.toasts.length > 4) { const old = this.toasts.shift(); old?.c.destroy(); }
    this.relayoutToasts();
    this.scene.tweens.add({ targets: c, alpha: 1, x: GAME_WIDTH - 16 - W, duration: 220, ease: 'Sine.easeOut' });
    this.scene.time.delayedCall(2600, () => {
      this.scene.tweens.add({
        targets: c, alpha: 0, x: GAME_WIDTH - 16 - W + 30, duration: 320, ease: 'Sine.easeIn',
        onComplete: () => { this.toasts = this.toasts.filter((e) => e.c !== c); c.destroy(); this.relayoutToasts(); },
      });
    });
  }

  private relayoutToasts(): void {
    // 추적기 아래에서 시작해 아래로 쌓인다 — 퀵슬롯 바(하단 74px)를 침범하지 않는 범위
    let y = this.miniBottomY() + (this.trackerC ? (this.trackerC.getBounds().height + 10) : 0);
    for (const e of this.toasts) {
      this.scene.tweens.add({ targets: e.c, y, duration: 160, ease: 'Sine.easeOut' });
      y += e.h + 6;
      if (y > GAME_HEIGHT - 90) break;
    }
  }

  /**
   * 미니맵 마커 갱신 (136차) — 씬이 상점 POI·NPC 퀘스트 상태를 계산해 넘긴다.
   * 좌표는 **월드 픽셀**. 같은 셀에 여럿이면 우선순위가 높은 하나만 그린다(아이콘 더미 방지).
   */
  setMiniMarkers(list: MiniMarker[]): void {
    this.miniMarkers = list;
    this.drawMiniMarkers();
  }

  private drawMiniMarkers(): void {
    const c = this.miniMarkerC;
    if (!c) return;
    c.removeAll(true);
    if (this.miniDispW <= 0) return;
    // 표시 하한 (143차 — 바닥 이름표를 끈 대신 미니맵이 장소를 떠맡는다):
    //  150 = 의뢰 · 인물 / 250 = 물품 상점까지 / 350 = 음식점·카페와 그 밖의 장소까지.
    //  한 지역 상점이 200곳 가까이라, 작은 미니맵에 전부 찍으면 지형이 아이콘에 묻힌다.
    const size = MINI_SIZES[this.miniSizeIdx];
    const minPri = size < 250 ? 2 : size < 350 ? 1 : 0;
    const cell = size < 250 ? 16 : size < 350 ? 14 : 12;
    const taken = new Map<string, number>();
    const picked: { x: number; y: number; m: MiniMarker }[] = [];
    for (const m of [...this.miniMarkers].sort((a, b) => b.priority - a.priority)) {
      if (m.priority < minPri) continue;
      const x = (m.wx / this.cfg.worldW) * this.miniDispW;
      const y = (m.wy / this.cfg.worldH) * this.miniDispH;
      if (x < 0 || y < 0 || x > this.miniDispW || y > this.miniDispH) continue;
      const key = `${Math.floor(x / cell)}:${Math.floor(y / cell)}`;
      const best = taken.get(key) ?? -1;
      if (best >= m.priority) continue;
      taken.set(key, m.priority);
      picked.push({ x, y, m });
    }
    for (const { x, y, m } of picked) {
      if (m.shape === 'pin') {
        const g = this.scene.add.graphics();
        g.fillStyle(0x0a1628, 0.9); g.fillTriangle(x - 5, y - 6, x + 5, y - 6, x, y + 2); g.fillCircle(x, y - 7, 5);
        g.fillStyle(0x5cd0ff, 1); g.fillTriangle(x - 3.5, y - 6, x + 3.5, y - 6, x, y); g.fillCircle(x, y - 7, 3.5);
        c.add(g);
        continue;
      }
      const img = addPixelIcon(this.scene, m.icon, x, y, 10);
      if (img) c.add(img);
    }
  }

  toggleMiniMapSize(): void {
    this.miniSizeIdx = (this.miniSizeIdx + 1) % MINI_SIZES.length;
    this.buildMiniMap();
  }

  updatePlayerMarker(worldX: number, worldY: number): void {
    if (!this.miniMarker) return;
    const mx = Phaser.Math.Clamp((worldX / this.cfg.worldW) * this.miniDispW, 3, this.miniDispW - 3);
    const my = Phaser.Math.Clamp((worldY / this.cfg.worldH) * this.miniDispH, 3, this.miniDispH - 3);
    this.miniMarker.setPosition(mx, my);
  }

  // ═══════════════════════════════════════════════════
  // 중앙 하단 퀵슬롯 8칸
  // ═══════════════════════════════════════════════════
  private createQuickslots(): void {
    const slotW = 46, slotH = 46, gap = 8;
    const totalW = 8 * slotW + 7 * gap;
    const startX = (GAME_WIDTH - totalW) / 2;
    const slotY = GAME_HEIGHT - slotH - 20;

    const barBg = this.scene.add.graphics();
    paintHudPanel(barBg, startX - 10, slotY - 8, totalW + 20, slotH + 16, { alpha: 0.8 });
    this.add(barBg);

    for (let i = 0; i < 8; i++) {
      const sx = startX + i * (slotW + gap) + slotW / 2;
      const sc = this.scene.add.container(sx, slotY + slotH / 2);

      const box = this.scene.add.graphics();
      box.name = 'box';
      sc.add(box);

      const keyLabel = this.scene.add.text(-slotW / 2 + 4, -slotH / 2 + 3, String(i + 1), {
        fontFamily: 'monospace', fontSize: '9px', color: '#8faabf',
      });
      sc.add(keyLabel);

      const nameTxt = this.scene.add.text(0, slotH / 2 - 8, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '8px', color: '#ffffffaa',
      }).setOrigin(0.5);
      nameTxt.name = 'name';
      sc.add(nameTxt);

      const hit = this.scene.add.rectangle(0, 0, slotW, slotH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        GameState.updatePlayer({ activeQuickslotIndex: i });
        this.refreshQuickslots();
        this.scene.events.emit('quickslot-changed', i);
      });
      sc.add(hit);

      this.slotContainers.push(sc);
      this.add(sc);
    }
    this.refreshQuickslots();
  }

  refreshQuickslots(): void {
    const activeIdx = GameState.player.activeQuickslotIndex;
    const slotW = 46, slotH = 46;

    this.slotContainers.forEach((sc, i) => {
      const box = sc.getByName('box') as Phaser.GameObjects.Graphics;
      const nameTxt = sc.getByName('name') as Phaser.GameObjects.Text;

      const itemId = InventoryStore.quickslots[i];
      const item = itemId ? InventoryStore.find(itemId) : undefined;

      // 아이콘 재생성 (이미지/이모지 혼용 지원)
      this.slotIcons[i]?.destroy();
      this.slotIcons[i] = null;
      if (item) {
        const icon = createItemIcon(this.scene, 0, -4, item, 26);
        icon.setScrollFactor(0);
        sc.add(icon);
        this.slotIcons[i] = icon;
      }
      // **번역 후** 자른다 — 원문을 먼저 자르면 조각('용상')이 사전에 없어 영어에서 한글이 남는다 (119차 6)
      nameTxt.setText(item ? t(item.name).split(' ')[0] : '');

      box.clear();
      paintHudSlot(box, 0, 0, slotW, slotH, i === activeIdx);
    });
  }

  // ═══════════════════════════════════════════════════
  // 좌하단 이벤트 로그 + 커뮤니티 채팅 (목업)
  // ═══════════════════════════════════════════════════
  /** 지역 채널 구성 오브젝트·마스크·씬 입력 핸들러를 전부 걷어낸다 (크기 단계 재생성 전 필수 — 안 걷으면 뒤에 겹쳐 남는다) */
  private destroyLogPanel(): void {
    if (this.logWheelHandler) { this.scene.input.off('wheel', this.logWheelHandler); this.logWheelHandler = undefined; }
    if (this.logMoveHandler) { this.scene.input.off('pointermove', this.logMoveHandler); this.logMoveHandler = undefined; }
    if (this.logUpHandler) { this.scene.input.off('pointerup', this.logUpHandler); this.logUpHandler = undefined; }
    this.logParts.forEach((o) => o.destroy());
    this.logParts = [];
    this.logMaskShape?.destroy();
    this.logMaskShape = undefined;
    this.logBarG = undefined;
    this.logDragging = false;
  }

  private createLogPanel(): void {
    this.destroyLogPanel();
    // 크기 단계 k — 좌하단 모서리(16, GAME_HEIGHT−20)를 고정한 채 실치수·폰트를 함께 줄인다
    //   (래퍼 컨테이너 scale 방식은 마스크+인터랙티브 자식과 함께 렌더러 크래시 — 재생성이 정답)
    const k = HUD_SCALES[this.chatSize];
    const fs = (base: number): string => `${Math.max(7, Math.round(base * k))}px`;
    // 고정 3영역 — [타이틀바][로그 뷰포트(마스크/스크롤)][입력란(하단 고정)]. 로그는 뷰포트
    // 밖(입력란 아래/창 밖)으로 절대 못 나간다 (지오메트리 마스크로 강제).
    // 타이틀바는 축소 단계에서도 조절 버튼(16px)이 들어갈 최소 높이를 지킨다 (119차 ① 규칙).
    const headerH = Math.max(HUD_HEADER_H + 4, Math.round(24 * k)), inputH = Math.round(30 * k);
    const w = Math.round(300 * k);
    // 타이틀바 최소 높이 때문에 로그 뷰포트가 사라지지 않도록 패널 높이에 하한을 둔다
    const h = Math.max(headerH + inputH + 36, Math.round(148 * k));
    const px = 16, py = GAME_HEIGHT - h - 20;
    this.logRect = { x: px + 10, y: py + headerH, w: w - 20, h: h - headerH - inputH };
    this.logAreaRect = { x: px, y: py, w, h };

    const bg = this.scene.add.graphics();
    paintHudPanel(bg, px, py, w, h, { headerH: Math.max(HUD_HEADER_H, Math.round(21 * k)) });
    this.addLogPart(bg);

    const title = this.scene.add.text(px + 10, py + 4, '지역 채널', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: fs(11), color: '#4af2a1', fontStyle: 'bold',
    });
    this.addLogPart(title);

    // ── 로그 텍스트 — 마스크된 컨테이너 안에서 y = −scrollY로 이동 (워드랩 = 가로 삐짐 방지) ──
    const logContainer = this.scene.add.container(this.logRect.x, this.logRect.y);
    this.addLogPart(logContainer);
    this.logText = this.scene.add.text(0, 0, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: fs(9), color: '#ccddee', lineSpacing: Math.round(4 * k),
      wordWrap: { width: this.logRect.w - 12 },   // 우측 스크롤바 폭 제외
    });
    logContainer.add(this.logText);
    // 뷰포트 마스크 — HUD는 화면 고정(scrollFactor 0)인데 마스크가 기본값(1)이면
    // 카메라 스크롤 씬에서 클립 영역이 어긋난다 (33차 교훈) — 마스크도 화면 고정.
    const maskG = this.scene.make.graphics({}, false).setScrollFactor(0);
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRect(this.logRect.x, this.logRect.y, this.logRect.w, this.logRect.h);
    logContainer.setMask(maskG.createGeometryMask());
    this.logMaskShape = maskG;

    // ── 스크롤바 (넘칠 때만 표시) + 썸 드래그/트랙 점프 ──
    this.logBarG = this.scene.add.graphics();
    this.addLogPart(this.logBarG);
    const trackX = this.logRect.x + this.logRect.w - 5;
    const barHit = this.scene.add.rectangle(
      trackX + 2.5, this.logRect.y + this.logRect.h / 2, 14, this.logRect.h, 0xffffff, 0.001,
    ).setInteractive({ useHandCursor: true });
    this.addLogPart(barHit);
    barHit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.logMaxScroll() <= 0) return;
      this.logDragging = true;
      this.logScrollFromPointer(p.y);
    });
    this.logMoveHandler = (p) => { if (this.logDragging) this.logScrollFromPointer(p.y); };
    this.logUpHandler = () => { this.logDragging = false; };
    this.scene.input.on('pointermove', this.logMoveHandler);
    this.scene.input.on('pointerup', this.logUpHandler);
    // 휠 스크롤 — 패널 호버 중에만 (다른 UI 휠과 충돌 방지)
    this.logWheelHandler = (p, _go, _dx, dy) => {
      const r = this.logScreenArea();
      if (p.x < r.x || p.x > r.x + r.w || p.y < r.y || p.y > r.y + r.h) return;
      this.setLogScroll(this.logScrollY + Math.sign(dy) * 22);
    };
    this.scene.input.on('wheel', this.logWheelHandler);

    // ── 채팅 입력 (145차 — 목업에서 실채팅으로) ──
    const inputBg = this.scene.add.rectangle(px + 10, py + h - Math.round(24 * k), w - 20, Math.round(17 * k), 0x050f1e)
      .setOrigin(0, 0).setStrokeStyle(1, 0x1f3d5a);
    const inputText = this.scene.add.text(px + 14, py + h - Math.round(21 * k), '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: fs(8), color: '#607b8e',
    });
    this.chatInputBg = inputBg;
    this.chatInputText = inputText;
    this.refreshChatInput();
    this.addLogPart([inputBg, inputText]);

    // 초기 안내 (최초 1회) — 재생성 시엔 보존된 로그를 다시 채운다
    if (this.logLines.length === 0) {
      this.pushLog('[시스템] 지역 채널에 접속했습니다.');
    } else {
      this.renderLogText();
      this.setLogScroll(Number.MAX_SAFE_INTEGER);
    }
    this.logParts.forEach((o) => (o as unknown as { setAlpha?: (a: number) => void }).setAlpha?.(HUD_ALPHAS[this.chatAlpha]));
    applyScreenFixed(this);
  }

  // ═══════════════════════════════════════════════════
  // HUD 크기/투명도 (116차 — 상태 패널·지역 채널: 3단계 축소 + 4단계 투명. 설정에 영속)
  // ═══════════════════════════════════════════════════
  private persistHud(): void {
    saveSettings({
      ...loadSettings(),
      hudStatusSize: this.statusSize, hudStatusAlpha: this.statusAlpha,
      hudChatSize: this.chatSize, hudChatAlpha: this.chatAlpha,
    });
  }

  /**
   * 상태 패널 — **좌상단 모서리 고정**. 단계는 scale이 아니라 레이아웃 재생성으로 바꾼다
   * (118차: scale로 줄이면 글씨까지 작아져 읽을 수 없었다).
   */
  private applyStatusView(): void {
    this.createStatusPanel();
    this.statusC.setAlpha(HUD_ALPHAS[this.statusAlpha]);
    this.updateStatus();
    const right = SP.x + this.statusLayout.w;
    this.rebuildCtrl(this.statusCtrl, right, SP.y + HUD_CTRL_INSET, () => {
      this.statusSize = (this.statusSize + 1) % SP_LAYOUTS.length; this.applyStatusView(); this.persistHud();
    }, () => {
      this.statusAlpha = (this.statusAlpha + 1) % HUD_ALPHAS.length; this.applyStatusView(); this.persistHud();
    }, this.statusAlpha === HUD_ALPHAS.length - 1);
  }

  /** 지역 채널 — 크기 단계에 맞춰 패널을 재생성(좌하단 고정) + 투명도 */
  private applyChatView(): void {
    this.createLogPanel();
    const area = this.logScreenArea();
    this.rebuildCtrl(this.chatCtrl, area.x + area.w, area.y + HUD_CTRL_INSET, () => {
      this.chatSize = (this.chatSize + 1) % HUD_SCALES.length; this.applyChatView(); this.persistHud();
    }, () => {
      this.chatAlpha = (this.chatAlpha + 1) % HUD_ALPHAS.length; this.applyChatView(); this.persistHud();
    }, this.chatAlpha === HUD_ALPHAS.length - 1);
  }

  /**
   * 패널 우상단 모서리의 조절 버튼 2개 — [◱ 크기] [◐ 투명]. 래퍼 밖(항상 불투명)이라 투명도를
   * 최저로 내려도 이 버튼으로 되돌린다. 최저 단계에서는 버튼을 강조색으로.
   */
  private rebuildCtrl(
    store: Phaser.GameObjects.GameObject[], right: number, top: number,
    onSize: () => void, onAlpha: () => void, atMinAlpha: boolean,
  ): void {
    store.forEach((o) => o.destroy());
    store.length = 0;
    const mk = (x: number, glyph: string, onClick: () => void, hot: boolean): void => {
      const g = this.scene.add.graphics();
      g.fillStyle(hot ? 0x3a2a08 : 0x0a1628, 0.92); g.fillRoundedRect(x, top, 16, 16, 4);
      g.lineStyle(1, hot ? 0xffce54 : 0x2a5a8a, 1); g.strokeRoundedRect(x, top, 16, 16, 4);
      const t = this.scene.add.text(x + 8, top + 8, glyph, {
        fontFamily: 'sans-serif', fontSize: '10px', color: hot ? '#ffce54' : '#9fc0d4',
      }).setOrigin(0.5);
      const hit = this.scene.add.rectangle(x + 8, top + 8, 18, 18, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => t.setColor('#ffffff'));
      hit.on('pointerout', () => t.setColor(hot ? '#ffce54' : '#9fc0d4'));
      // 클릭 핸들러 안에서 버튼 자신을 destroy/재생성하면 입력 디스패치 도중 오브젝트가 사라진다 —
      //   다음 틱으로 미룬다(실측: 즉시 재생성 시 렌더러 탭 크래시)
      hit.on('pointerdown', () => {
        this.scene.time.delayedCall(0, () => {
          onClick();
          // 버튼 자신이 재생성되며 커서가 풀린다 — 포인터는 아직 버튼 위이므로 다시 세운다
          restoreHandCursor(this.scene);
        });
      });
      this.add([g, t, hit]);
      store.push(g, t, hit);
    };
    mk(right - 36, '◱', onSize, false);
    mk(right - 18, '◐', onAlpha, atMinAlpha);
    applyScreenFixed(this);
  }

  /** 로그 최대 스크롤 (0 = 넘치지 않음) */
  private logMaxScroll(): number {
    return Math.max(0, (this.logText?.height ?? 0) - this.logRect.h);
  }

  /** 스크롤 적용 — 텍스트 이동 + 스크롤바 갱신 */
  private setLogScroll(v: number): void {
    this.logScrollY = Phaser.Math.Clamp(v, 0, this.logMaxScroll());
    this.logText?.setY(-this.logScrollY);
    this.drawLogBar();
  }

  /** 썸 드래그/트랙 클릭 → scrollY 매핑 */
  private logScrollFromPointer(pointerY: number): void {
    const max = this.logMaxScroll();
    if (max <= 0) return;
    const r = this.logScreenRect();
    const thumbH = this.logThumbH();
    const ratio = Phaser.Math.Clamp((pointerY - r.y - thumbH / 2) / Math.max(1, r.h - thumbH), 0, 1);
    this.setLogScroll(ratio * max);
  }

  /** 로그 뷰포트의 화면 좌표 (패널이 실치수로 재생성되므로 그대로) */
  private logScreenRect(): { x: number; y: number; w: number; h: number } {
    return { ...this.logRect };
  }

  /** 지역 채널 패널 전체의 화면 좌표 */
  private logScreenArea(): { x: number; y: number; w: number; h: number } {
    return { ...this.logAreaRect };
  }

  private addLogPart(objs: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]): void {
    const arr = Array.isArray(objs) ? objs : [objs];
    this.add(arr);
    this.logParts.push(...arr);
  }

  private logThumbH(): number {
    const contentH = Math.max(1, this.logText?.height ?? 1);
    return Math.max(22, this.logRect.h * Math.min(1, this.logRect.h / contentH));
  }

  /** 스크롤바 렌더 — 콘텐츠 대비 비율 썸, 넘치지 않으면 숨김 */
  private drawLogBar(): void {
    const g = this.logBarG;
    if (!g) return;
    g.clear();
    const max = this.logMaxScroll();
    if (max <= 0) return;
    const trackX = this.logRect.x + this.logRect.w - 5;
    g.fillStyle(0x000000, 0.28);
    g.fillRoundedRect(trackX, this.logRect.y, 5, this.logRect.h, 2);
    const thumbH = this.logThumbH();
    const thumbY = this.logRect.y + (this.logRect.h - thumbH) * (this.logScrollY / max);
    g.fillStyle(0x7fb8d8, 0.6);
    g.fillRoundedRect(trackX, thumbY, 5, thumbH, 2);
  }

  // ═══════════════════════════════════════════════════
  // 지역 채널 채팅 (145차)
  // ═══════════════════════════════════════════════════

  private chatInputBg?: Phaser.GameObjects.Rectangle;
  private chatInputText?: Phaser.GameObjects.Text;
  /** 입력 중인가 — 씬은 이 동안 이동·단축키를 막는다 */
  private composing = false;
  private draft = '';

  get isComposing(): boolean { return this.composing; }
  get chatDraft(): string { return this.draft; }

  /** 입력 시작 */
  beginCompose(): void {
    this.composing = true;
    this.draft = '';
    this.refreshChatInput();
  }

  /** 입력 중이면 취소하고 true */
  cancelCompose(): boolean {
    if (!this.composing) return false;
    this.composing = false;
    this.draft = '';
    this.refreshChatInput();
    return true;
  }

  /** 입력을 끝내고 친 글을 돌려준다 (빈 문자열이면 보내지 않는다) */
  commitCompose(): string {
    const text = this.draft.trim();
    this.composing = false;
    this.draft = '';
    this.refreshChatInput();
    return text;
  }

  /**
   * 입력 중인 글을 통째로 교체 (150차) — 한글 IME는 글자 단위로 오지 않는다.
   * 씬의 `TextInput`(숨김 DOM 입력)이 조합이 끝날 때마다 현재 값을 통째로 넘긴다.
   */
  setCompose(text: string): void {
    if (!this.composing) return;
    this.draft = [...text].slice(0, MP_CHAT_MAX_LEN).join('');
    this.refreshChatInput();
  }

  private refreshChatInput(): void {
    if (!this.chatInputText) return;
    if (this.composing) {
      this.chatInputText.setText(`> ${this.draft}_`).setColor('#d8ecff');
      this.chatInputBg?.setStrokeStyle(1, 0x4a9fd8);
    } else {
      const ready = MultiplayerClient.isConnected;
      this.chatInputText
        .setText(ready ? '[ENTER] 대화 입력' : '[ENTER] 대화 입력 (혼자 하는 중)')
        .setColor(ready ? '#8fa9bd' : '#607b8e');
      this.chatInputBg?.setStrokeStyle(1, 0x1f3d5a);
    }
  }

  /** 이벤트/채팅 메시지 추가 (최근 200줄 보존 — 과거는 스크롤백으로 열람) */
  pushLog(message: string): void {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const { head, body } = splitLogMessage(message);
    this.logLines.push({ time: `${hh}:${mm}`, head, body });
    if (this.logLines.length > 200) this.logLines.shift();
    if (!this.logText) return;
    // auto-stick: 하단(최신)에 있었으면 새 메시지로 자동 스크롤, 과거 열람 중이면 위치 유지
    const atBottom = this.logScrollY >= this.logMaxScroll() - 2;
    this.renderLogText();
    if (atBottom) this.setLogScroll(Number.MAX_SAFE_INTEGER);
    else this.drawLogBar();
  }

  /** 크기 단계별 로그 1줄 포맷 (119차 ② — 큰=시각 포함 / 중간=시각 제거 / 최소=본문 말줄임) */
  private formatLogLine(e: LogEntry): string {
    const head = e.head ? `${e.head} ` : '';
    if (this.chatSize >= 2) {
      return `${head}${e.body.length > LOG_MIN_BODY_CHARS ? '...' : e.body}`;
    }
    if (this.chatSize === 1) return `${head}${e.body}`;
    return `[${e.time}] ${head}${e.body}`;
  }

  /** 보존된 로그를 현재 크기 단계 형식으로 다시 그린다 */
  private renderLogText(): void {
    this.logText?.setText(this.logLines.map((e) => this.formatLogLine(e)).join('\n'));
  }

  override destroy(fromScene?: boolean): void {
    this.hideWeatherTip();
    if (this.scene?.input) this.destroyLogPanel();
    super.destroy(fromScene);
  }
}
