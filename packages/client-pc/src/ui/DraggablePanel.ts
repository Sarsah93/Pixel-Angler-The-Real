/**
 * @file DraggablePanel.ts
 * @description 드래그 이동 가능한 공통 팝업 패널 베이스
 *
 * 모든 단축키 팝업(인벤토리/스테이터스/장비/활용/상점/다이얼로그)의 공통 기반:
 *  - 헤더 드래그로 위치 이동 (화면 밖으로 나가지 않게 클램프)
 *  - 우측 상단 X 버튼 / (씬에서) ESC 최상단 우선 닫기
 *  - 패널 클릭 시 최상단으로 올라옴 (bringToTop)
 *  - 화면 고정(scrollFactor 0) 히트 영역 보정
 *
 * 히트 영역 보정 배경: Phaser는 컨테이너 "자식"의 입력 판정에 자식 자신의
 * scrollFactor(기본 1)를 사용한다. 화면 고정 UI(컨테이너 scrollFactor 0) 안의
 * 자식이 scrollFactor 1이면, 카메라가 스크롤된 만큼 클릭 판정이 어긋난다.
 * → applyScreenFixed()로 트리 전체에 scrollFactor 0을 재귀 적용해야 한다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

/** 화면 고정 컨테이너 트리 전체에 scrollFactor 0 재귀 적용 (입력 판정 어긋남 방지) */
export function applyScreenFixed(root: Phaser.GameObjects.Container): void {
  root.setScrollFactor(0);
  const walk = (c: Phaser.GameObjects.Container): void => {
    for (const child of c.getAll()) {
      const sf = child as unknown as { setScrollFactor?: (v: number) => unknown };
      sf.setScrollFactor?.(0);
      if (child instanceof Phaser.GameObjects.Container) walk(child);
    }
  };
  walk(root);
}

export interface DraggablePanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  /** X 버튼/ESC 등으로 닫힐 때 호출 (씬이 destroy + 스택 제거 담당) */
  onClose: () => void;
  /** true면 패널 뒤 전체 화면 딤 (모달) */
  dim?: boolean;
  depth?: number;
  /** 헤더 우측 X 버튼 숨김 (기본 표시) */
  hideClose?: boolean;
}

const HEADER_H = 32;

/**
 * 팝업 depth 밴드 — 정적 depth는 "처음 열릴 때의 초기 서열"일 뿐이고,
 * 상호작용(클릭) 시 같은 밴드 안에서 동적으로 최상단이 된다 (76차 z-order 규칙):
 *  - 일반 팝업 밴드 [800, 899): 인벤토리/장비/상점/쿨러/상세보기 등 — 서로 자유 전환
 *  - 모달 밴드 [900, ∞): 손질/회썰기/가이드/확인·수량 다이얼로그 — dim이 아래 입력을 흡수
 * 일반 팝업은 모달 밴드 위로 절대 올라가지 않는다 (다이얼로그가 항상 최상단 보장).
 */
const MODAL_BAND_MIN = 900;

export class DraggablePanel extends Phaser.GameObjects.Container {
  protected panelW: number;
  protected panelH: number;
  protected requestClose: () => void;
  /** 헤더 타이틀 텍스트 — setTitle()로 동적 갱신 가능 */
  protected titleText!: Phaser.GameObjects.Text;

  private dimRect?: Phaser.GameObjects.Rectangle;
  /** 생성 시 지정된 기준 depth — 밴드 판정 기준 (동적 최상단은 이 밴드 안에서만 이동) */
  private readonly zBase: number;
  private dragActive = false;
  private dragOffX = 0;
  private dragOffY = 0;
  private moveHandler: (p: Phaser.Input.Pointer) => void;
  private upHandler: () => void;
  private focusDownHandler: (p: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene, cfg: DraggablePanelConfig) {
    super(scene, cfg.x, cfg.y);
    this.panelW = cfg.width;
    this.panelH = cfg.height;
    this.requestClose = cfg.onClose;
    this.zBase = cfg.depth ?? 800;
    this.setDepth(this.zBase);
    this.setScrollFactor(0);

    // ── 모달 딤 (패널과 별개로 화면 전체 고정 — 드래그와 무관) ──
    if (cfg.dim) {
      this.dimRect = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5)
        .setScrollFactor(0)
        .setDepth(this.depth - 1)
        .setInteractive();
    }

    // ── 패널 프레임 ──
    const bg = scene.add.graphics();
    bg.fillStyle(0x0a1628, 0.97);
    bg.fillRoundedRect(0, 0, this.panelW, this.panelH, 6);
    bg.lineStyle(2, 0x2a5a8a, 0.95);
    bg.strokeRoundedRect(0, 0, this.panelW, this.panelH, 6);
    this.add(bg);

    // 패널 빈 공간 클릭 → 최상단으로 (자식 인터랙션 요소가 우선 처리됨)
    const basePlate = scene.add.rectangle(this.panelW / 2, this.panelH / 2, this.panelW, this.panelH, 0xffffff, 0.001)
      .setInteractive();
    basePlate.on('pointerdown', () => this.bringSelfToTop());
    this.add(basePlate);

    // ── 헤더 (드래그 존) ──
    const headerBg = scene.add.graphics();
    headerBg.fillStyle(0x0d2a40, 0.95);
    headerBg.fillRoundedRect(0, 0, this.panelW, HEADER_H, 6);
    headerBg.fillRect(0, HEADER_H - 8, this.panelW, 8);
    this.add(headerBg);

    this.titleText = scene.add.text(14, HEADER_H / 2, cfg.title, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add(this.titleText);

    const dragZone = scene.add.rectangle((this.panelW - 44) / 2, HEADER_H / 2, this.panelW - 44, HEADER_H, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    dragZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragActive = true;
      this.dragOffX = p.x - this.x;
      this.dragOffY = p.y - this.y;
      this.bringSelfToTop();
    });
    this.add(dragZone);

    // ── 닫기 버튼 ──
    if (!cfg.hideClose) {
      const closeTxt = scene.add.text(this.panelW - 20, HEADER_H / 2, '✕', {
        fontFamily: 'monospace', fontSize: '14px', color: '#8faabf',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      closeTxt.on('pointerover', () => closeTxt.setColor('#ff6b6b'));
      closeTxt.on('pointerout', () => closeTxt.setColor('#8faabf'));
      closeTxt.on('pointerdown', () => this.requestClose());
      this.add(closeTxt);
    }

    // ── 드래그 이동 핸들러 (씬 레벨) ──
    this.moveHandler = (p: Phaser.Input.Pointer) => {
      if (!this.dragActive) return;
      const nx = Phaser.Math.Clamp(p.x - this.dragOffX, -this.panelW + 80, GAME_WIDTH - 80);
      const ny = Phaser.Math.Clamp(p.y - this.dragOffY, 0, GAME_HEIGHT - HEADER_H);
      this.setPosition(nx, ny);
    };
    this.upHandler = () => { this.dragActive = false; };
    scene.input.on('pointermove', this.moveHandler);
    scene.input.on('pointerup', this.upHandler);

    // ── 포커스 = 최상단 (씬 레벨 캡처) ──
    //  자식 인터랙티브 요소(그리드 셀·버튼)를 눌러도 basePlate가 이벤트를 못 받으므로,
    //  씬 pointerdown에서 "포인터가 패널 안 + 나를 덮는 상위 패널 없음"이면 최상단으로.
    //  (우클릭 컨텍스트 메뉴 등 자식 팝업이 다른 패널에 가려지는 문제의 근본 해결.)
    this.focusDownHandler = (p: Phaser.Input.Pointer) => {
      if (!this.containsPoint(p.x, p.y)) return;
      const blocked = this.scene.children.list.some((o) =>
        o instanceof DraggablePanel && o !== this && o.depth > this.depth
        && (o.dimRect !== undefined || o.containsPoint(p.x, p.y)));
      if (!blocked) this.bringSelfToTop();
    };
    scene.input.on('pointerdown', this.focusDownHandler);
  }

  /** 스크린 좌표가 패널 rect 안인지 (패널은 scrollFactor 0 — p.x/p.y 그대로 비교) */
  private containsPoint(sx: number, sy: number): boolean {
    return sx >= this.x && sx <= this.x + this.panelW && sy >= this.y && sy <= this.y + this.panelH;
  }

  /** 패널 depth 적용 — 모달 dim은 항상 패널 바로 아래를 따라간다 */
  private applyDepth(d: number): void {
    this.setDepth(d);
    this.dimRect?.setDepth(d - 1);
  }

  /** 콘텐츠 시작 Y (헤더 아래) */
  protected get contentTop(): number {
    return HEADER_H + 8;
  }

  /** 헤더 타이틀 갱신 (쿨러 매질 상태 등 동적 표기용) */
  protected setTitle(title: string): void {
    this.titleText.setText(title);
  }

  /**
   * 같은 밴드 안에서 동적 최상단으로 (76차 재작성).
   * ⚠ 구 `children.bringToTop()`은 디스플레이 리스트 순서만 바꾸는데, Phaser 렌더/입력
   * 정렬은 depth 값이 우선이라 정적 depth가 다른 패널(인벤 800 vs 장비 810)끼리는
   * 완전히 무력했다 — "클릭 시 최상단"이 사실상 사문이던 원인.
   */
  protected bringSelfToTop(): void {
    const modal = this.zBase >= MODAL_BAND_MIN;
    const bandBase = modal ? MODAL_BAND_MIN : 800;
    const bandCap = modal ? Number.MAX_SAFE_INTEGER : MODAL_BAND_MIN - 2;   // 일반 밴드는 모달(dim 899) 침범 금지
    const peers = this.scene.children.list.filter((o): o is DraggablePanel =>
      o instanceof DraggablePanel && o !== this && (o.zBase >= MODAL_BAND_MIN) === modal);
    let next = Math.max(this.depth, ...peers.map((p) => p.depth)) + 1;
    if (next >= bandCap) {
      // 밴드 포화 — depth 순서를 유지한 채 base부터 촘촘히 재정규화
      peers.sort((a, b) => a.depth - b.depth).forEach((p, i) => p.applyDepth(bandBase + i));
      next = bandBase + peers.length;
    }
    this.applyDepth(next);
  }

  /** 자식 추가/재구성 후 반드시 호출 — 화면 고정 히트 영역 보정 */
  protected applyFix(): void {
    applyScreenFixed(this);
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input?.off('pointermove', this.moveHandler);
    this.scene?.input?.off('pointerup', this.upHandler);
    this.scene?.input?.off('pointerdown', this.focusDownHandler);
    this.dimRect?.destroy();
    super.destroy(fromScene);
  }
}
