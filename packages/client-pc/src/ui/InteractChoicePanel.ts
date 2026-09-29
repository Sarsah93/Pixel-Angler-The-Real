/**
 * @file InteractChoicePanel.ts
 * @description 상호작용 겹침 선택 패널 (178차 — 사용자 지시)
 *
 * 배경: `[F]` 하나로 대화·거래·채집·회수·줍기를 다 처리하는데, 한 자리에 두 가지 이상이
 * 겹치면 앞선 것이 무조건 이겼다(정옥선 옆에 놓인 물건은 영영 주울 수 없었다).
 * 이제 겹치면 **무엇을 할지 고르는 창**이 뜬다.
 *
 * 규칙
 *  - 타이틀바 '상호작용' + 선택지 목록. 창은 **드래그로 옮길 수 있다**
 *    (기본 위치가 캐릭터 아래라 필드 정보를 가릴 수 있어서 — 사용자 지시).
 *  - `sub`를 가진 선택지는 고르면 **바로 우측에 한 겹 더 펼쳐진다**(아이템 줍기 → 바닥의 물건 목록).
 *  - 키보드: ↑↓ 이동 · Enter 실행 · ESC 닫기(펼친 하위 목록이 있으면 그것만 접는다).
 *
 * ⚠ 목록은 **인터랙티브 행**이라 마스크를 쓰지 않는다(Phaser는 마스크로 입력을 클립하지 않는다 —
 *   스크롤아웃 행의 팬텀 히트가 남는다). 항목 수만큼 창이 자라고, `MAX_ROWS`를 넘으면
 *   그 수를 표기한 채 잘린다.
 */
import Phaser from 'phaser';
import { DraggablePanel, restoreHandCursor } from './DraggablePanel.js';
import { createItemIcon, type ItemIconLike } from './ItemIcon.js';
import { clampTextWidth } from './TextFit.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';

export interface InteractOption {
  label: string;
  /** 보조 설명 (한 줄) */
  note?: string;
  /** 186차 — 후보가 하나뿐일 때 머리 위 [F] 안내에 쓸 문장 (없으면 `[F] ${label}`) */
  hint?: string;
  /** 아이템 선택지면 아이콘을 함께 보여준다 */
  icon?: ItemIconLike;
  /** 즉시 실행 — `sub`가 있으면 실행 대신 하위 목록을 펼친다 */
  run?: () => void;
  /** 우측으로 한 겹 펼쳐질 하위 선택지 */
  sub?: () => InteractOption[];
}

const PANEL_W = 240;
const HDR = 32;
// 행 높이 — 이름(12px) + 보조 설명(9px) 두 줄이 행 배경 안에 들어가는 실측값
const ROW_H = 36;
const PAD = 8;
const MAX_ROWS = 9;

function panelHeightFor(count: number): number {
  return HDR + PAD + Math.min(count, MAX_ROWS) * ROW_H + PAD + (count > MAX_ROWS ? 14 : 0);
}

export class InteractChoicePanel extends DraggablePanel {
  private opts: InteractOption[];
  private rowsC!: Phaser.GameObjects.Container;
  private subPanel?: InteractChoicePanel;
  private cursor = 0;
  private keyHandler?: (ev: KeyboardEvent) => void;
  /**
   * 키 입력을 받아도 되는지 묻는 문(門) — 씬이 배선한다.
   * 위에 다른 창이 겹친 동안 ↑↓/←→/Enter가 **아래의 선택지를 조작하는** 것을 막는다.
   */
  keyGate?: () => boolean;
  private readonly onFinish: () => void;
  /** 하위 패널이면 true — ESC가 자기만 닫는다 */
  private readonly isSub: boolean;

  constructor(
    scene: Phaser.Scene, x: number, y: number,
    opts: InteractOption[], onFinish: () => void,
    title = '상호작용', isSub = false,
  ) {
    super(scene, {
      x, y, width: PANEL_W, height: panelHeightFor(opts.length),
      title, onClose: () => this.closeSelf(), depth: isSub ? 872 : 870,
    });
    this.opts = opts;
    this.onFinish = onFinish;
    this.isSub = isSub;
    // 본 패널은 씬의 `openPopup`이 디스플레이 리스트에 올린다(ESC LIFO 편입).
    // 하위 패널은 스택에 넣지 않으므로 여기서 직접 올린다.
    if (isSub) scene.add.existing(this);
    this.rowsC = scene.add.container(0, 0);
    this.add(this.rowsC);
    this.renderRows();
    if (opts.length > MAX_ROWS) {
      const more = scene.add.text(PAD, panelHeightFor(opts.length) - 16, `그 밖에 ${opts.length - MAX_ROWS}가지`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: '#7a98ac',
      });
      this.add(more);
    }
    if (!isSub) {
      this.keyHandler = (ev: KeyboardEvent) => this.onKey(ev);
      scene.input.keyboard?.on('keydown', this.keyHandler);
    }
    this.applyFix();
  }

  /** 겹친 자리 근처(기본 = 캐릭터 아래)에 놓고 화면 안으로 클램프한다 */
  static placeNear(sx: number, sy: number, rowCount: number): { x: number; y: number } {
    const h = panelHeightFor(rowCount);
    // 우측에 하위 목록이 한 겹 더 펼쳐질 자리를 남겨 둔다
    const x = Phaser.Math.Clamp(Math.round(sx - PANEL_W / 2), 8, Math.max(8, GAME_WIDTH - PANEL_W * 2 - 20));
    // 하단 퀵슬롯 바(74px)와 조작 안내 줄을 침범하지 않게 여유를 둔다 — 그래도 가리면 드래그로 옮긴다
    const y = Phaser.Math.Clamp(Math.round(sy + 30), 8, Math.max(8, GAME_HEIGHT - h - 130));
    return { x, y };
  }

  private renderRows(): void {
    this.rowsC.removeAll(true);
    this.opts.slice(0, MAX_ROWS).forEach((o, i) => {
      const ry = HDR + PAD + i * ROW_H;
      const sel = i === this.cursor;
      const g = this.scene.add.graphics();
      g.fillStyle(sel ? 0x17324c : 0x0e1c2d, sel ? 0.95 : 0.82);
      g.fillRoundedRect(PAD, ry, PANEL_W - PAD * 2, ROW_H - 4, 4);
      if (sel) {
        g.fillStyle(0x4af2a1, 1);
        g.fillRect(PAD, ry, 3, ROW_H - 4);   // 선택 강조 = 색 + 좌측 바 (메인 메뉴 관례)
      }
      this.rowsC.add(g);
      let tx = PAD + 10;
      if (o.icon) {
        const ic = createItemIcon(this.scene, PAD + 18, ry + (ROW_H - 4) / 2, o.icon, 20);
        this.rowsC.add(ic);
        tx = PAD + 34;
      }
      const hasNote = !!o.note;
      const label = this.scene.add.text(tx, ry + (hasNote ? 4 : 9), o.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px',
        color: sel ? '#ffffff' : '#d0e8f5', fontStyle: 'bold',
      });
      clampTextWidth(label, PANEL_W - PAD * 2 - (tx - PAD) - (o.sub ? 20 : 8));
      this.rowsC.add(label);
      if (hasNote) {
        const note = this.scene.add.text(tx, ry + 19, o.note!, {
          fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', color: sel ? '#9fe8ff' : '#7a98ac',
        });
        clampTextWidth(note, PANEL_W - PAD * 2 - (tx - PAD) - (o.sub ? 20 : 8));
        this.rowsC.add(note);
      }
      if (o.sub) {
        // 우측으로 펼쳐진다는 표시 (확립된 조작 글리프)
        const arrow = this.scene.add.text(PANEL_W - PAD - 6, ry + (ROW_H - 4) / 2, '▶', {
          fontFamily: 'sans-serif', fontSize: '10px', color: sel ? '#ffd257' : '#6e8ba0',
        }).setOrigin(1, 0.5);
        this.rowsC.add(arrow);
      }
      const hit = this.scene.add.rectangle(PANEL_W / 2, ry + (ROW_H - 4) / 2, PANEL_W - PAD * 2, ROW_H - 4, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { if (this.cursor !== i) { this.cursor = i; this.renderRows(); } });
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (!p.leftButtonDown()) return;
        this.cursor = i;
        // 입력 디스패치 중 자기 자신을 파괴하지 않도록 다음 틱에서 실행한다.
        this.scene.time.delayedCall(0, () => this.choose());
      });
      this.rowsC.add(hit);
    });
    this.applyFix();
  }

  private choose(): void {
    const o = this.opts[this.cursor];
    if (!o) return;
    if (o.sub) { this.openSub(o); return; }
    // 실행 전에 창을 정리한다 — 실행이 다른 팝업을 열 수 있다(대화창 등)
    const run = o.run;
    this.finishAll();
    run?.();
    return;
  }

  private openSub(o: InteractOption): void {
    this.subPanel?.destroy();
    this.subPanel = undefined;
    const list = o.sub!();
    if (!list.length) return;
    const sx = this.x + PANEL_W + 6;
    const sy = Phaser.Math.Clamp(this.y, 8, Math.max(8, GAME_HEIGHT - panelHeightFor(list.length) - 84));
    const sub = new InteractChoicePanel(this.scene, sx, sy, list, () => this.finishAll(), o.label, true);
    this.subPanel = sub;
    restoreHandCursor(this.scene);
  }

  private onKey(ev: KeyboardEvent): void {
    if (this.keyGate && !this.keyGate()) return;
    const active = this.subPanel ?? this;
    switch (ev.key) {
      case 'ArrowUp':
        active.cursor = (active.cursor - 1 + active.opts.length) % Math.min(active.opts.length, MAX_ROWS);
        active.renderRows();
        break;
      case 'ArrowDown':
        active.cursor = (active.cursor + 1) % Math.min(active.opts.length, MAX_ROWS);
        active.renderRows();
        break;
      // 창이 떠 있는 동안 캐릭터는 어차피 멈춰 있다(`uiBlocked`) — 좌우는 펼침/접기에 쓴다
      case 'ArrowRight': {
        const o = active.opts[active.cursor];
        if (o?.sub) active.openSub(o);   // ▶ 표시가 있는 행은 우측으로 펼친다
        break;
      }
      case 'ArrowLeft':
        // 펼친 하위 목록을 접어 본 목록으로 돌아온다 (ESC 1단계와 같다)
        if (this.subPanel) { this.subPanel.destroy(); this.subPanel = undefined; }
        break;
      case 'Enter':
        active.choose();
        break;
      default:
        break;
    }
  }

  /** ESC / ✕ — 하위가 열려 있으면 그것만 접는다 */
  onEscIntercept(): boolean {
    if (this.subPanel) { this.subPanel.destroy(); this.subPanel = undefined; return true; }
    return false;
  }

  private closeSelf(): void {
    if (this.isSub) { this.destroy(); return; }
    this.finishAll();
  }

  /** 모든 층을 닫고 씬에 알린다 */
  private finishAll(): void {
    this.subPanel?.destroy();
    this.subPanel = undefined;
    this.onFinish();
  }

  destroy(fromScene?: boolean): void {
    if (this.keyHandler) {
      this.scene?.input?.keyboard?.off('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
    this.subPanel?.destroy();
    this.subPanel = undefined;
    super.destroy(fromScene);
  }
}

export { panelHeightFor as interactPanelHeight };
