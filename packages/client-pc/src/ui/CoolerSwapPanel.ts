/**
 * @file CoolerSwapPanel.ts
 * @description 쿨러 정리 창 (196차 신설 · 198차 재작성 — 사용자 지시
 *   「쿨러 슬롯 중 어종을 선택하고 놓아주기를 직접 골라 빈 공간을 만들고, 그 자리에 넣을 수 있게」
 *   「하나 혹은 다수의 어획물을 지정하고 방생하기를 누르면 재확인 문구와 버튼」)
 *
 * 쿨러가 차서 방금 낚은 고기가 다 들어가지 않을 때 결정 패널 대신 뜬다.
 *  - 위 줄: 방금 낚은 고기(1~3마리) · 아래 3x3: 쿨러.
 *  - **고르기**: 고기 카드를 누르면 고른 상태(하늘색 테)가 된다 — 여러 마리 가능, 다시 누르면 해제.
 *  - **[놓아주기]**: 고른 고기 전부를 놓아준다 — **확인 창**(이름·크기 목록 + 「놓아주기」/「취소」)을 거친다.
 *    쿨러 고기는 그 자리에서 빠져 **빈 칸**이 된다(되돌릴 수 없음 — 확인 창이 말한다).
 *  - **자리에 넣기**: 방금 낚은 고기를 고른 채 빈 칸을 누르면 **그 칸에** 넣는다(아직 확정 전 — 노란 테).
 *    넣어 둔 고기를 다시 누르면 위 줄로 돌아온다.
 *  - **[넣고 마치기]**: 자리에 넣은 대로 확정 + 남은 고기는 빈 칸에 무거운 순으로 넣는다.
 *    그래도 남으면 「들어가는 만큼만 넣고 N마리는 놓아줄까요?」 **확인 창**.
 *  - **[돌아가기]**: 결정 패널로(이미 놓아준 고기는 돌아오지 않는다 — 남은 고기만 결정 패널로).
 * 조작 안내 글은 창에 쓰지 않는다(R11) — 처음 열 때 체험 가이드(`tour.cooler_swap2`)가 짚는다.
 *
 * 1인칭 결과 패널과 같은 화면 고정 컨테이너(depth 112)로 둔다 — DraggablePanel이 아니다
 * (결정 패널이 같은 방식이고, 낚시 씬은 팝업 스택이 없다). 확인 창은 `ConfirmDialog`(모달 950).
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { CoolerStore, COOLER_CAPACITY, type CoolerFish } from '../store/CoolerStore.js';
import { CONDITION_LABEL, CONDITION_COLOR } from '../store/InventoryStore.js';
import { applyScreenFixed } from './DraggablePanel.js';
import { resolveFishTexture } from '../data/FishTextures.js';
import { maybeStartTour, type TourRect } from './GuideTour.js';
import { ConfirmDialog } from './Dialogs.js';

/** 방금 낚은 고기(1인칭 SpawnedFish에서 필요한 것만) */
export interface SwapNewFish {
  speciesId: string;
  nameKo: string;
  lengthCm: number;
  weightG: number;
  sex: 'M' | 'F';
  iconTexture?: string;
}

export interface CoolerSwapResult {
  /** 쿨러에 넣은 새 고기 */
  stored: SwapNewFish[];
  /** 놓아준 새 고기 수 */
  releasedNew: number;
  /** 쿨러에서 꺼내 놓아준 고기 수 */
  releasedOld: number;
}

const W = 540;
const H = 470;
const CARD = 58;
const GAP = 8;
/** 고른 카드 테두리 */
const SEL = 0x5cd0ff;
/** 자리에 넣어 둔(확정 전) 새 고기 테두리 */
const PLACED = 0xffd84a;

/** 방금 낚은 고기 하나의 상태 */
type FreshState = 'wait' | 'placed' | 'released';

export class CoolerSwapPanel extends Phaser.GameObjects.Container {
  private freshState: FreshState[];
  /** 쿨러 칸 → 그 칸에 넣어 둔(확정 전) 새 고기 번호 */
  private placed = new Map<number, number>();
  /** 고른 카드 — `n<i>`(방금 낚은 고기) · `c<i>`(쿨러 칸) */
  private sel = new Set<string>();
  private releasedOld = 0;
  private dialog: ConfirmDialog | null = null;
  private newRowRect = new Phaser.Geom.Rectangle();
  private gridRect = new Phaser.Geom.Rectangle();
  private countRect = new Phaser.Geom.Rectangle();
  private releaseBtnRect = new Phaser.Geom.Rectangle();
  private doneBtnRect = new Phaser.Geom.Rectangle();

  constructor(
    scene: Phaser.Scene,
    private readonly fresh: SwapNewFish[],
    private readonly cbs: {
      onDone: (r: CoolerSwapResult) => void;
      /** 돌아가기 — 아직 남은 새 고기 번호(이미 놓아준 고기는 빠진다) */
      onCancel: (remaining: number[]) => void;
    },
  ) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16);
    this.freshState = fresh.map(() => 'wait');
    this.setDepth(112);
    scene.add.existing(this);
    this.render();
    maybeStartTour(scene, () => ({
      id: 'cooler_swap2',
      alive: () => this.active,
      steps: [
        { text: '쿨러가 가득 찼을 때 여는 정리 창입니다. 맨 위가 방금 낚은 고기, 아래가 쿨러에 들어 있던 고기예요.', target: () => this.newRowRect },
        { text: '고기를 누르면 고른 상태가 됩니다. 여러 마리를 함께 고를 수 있고, 다시 누르면 풀립니다.', target: () => this.gridRect },
        { text: '고른 고기는 「놓아주기」로 놓아줍니다. 한 번 더 묻고, 놓아준 자리는 빈 칸이 됩니다.', target: () => this.releaseBtnRect },
        { text: '방금 낚은 고기를 고른 채 빈 칸을 누르면 그 자리에 들어갑니다. 넣을 고기와 빈 자리 수는 여기서 봅니다.', target: () => this.countRect },
        { text: '「넣고 마치기」로 확정합니다. 자리가 모자라면 남는 고기를 놓아줄지 한 번 더 묻습니다.', target: () => this.doneBtnRect },
      ],
    }));
  }

  /** 쿨러 칸별 고기(빈 칸 null) */
  private slots(): (CoolerFish | null)[] {
    return Array.from({ length: COOLER_CAPACITY }, (_, i) => CoolerStore.get(i));
  }

  /** 아직 자리를 못 정한 새 고기 번호 */
  private waiting(): number[] {
    return this.freshState.flatMap((s, i) => (s === 'wait' ? [i] : []));
  }

  /** 정말 비어 있는 칸(넣어 둔 새 고기도 없는 칸) */
  private emptySlots(): number[] {
    return this.slots().flatMap((f, i) => (!f && !this.placed.has(i) ? [i] : []));
  }

  /** 고른 새 고기 중 가장 앞 번호(빈 칸에 넣을 고기) */
  private pickedFresh(): number | null {
    const i = this.waiting().find((k) => this.sel.has(`n${k}`));
    return i === undefined ? null : i;
  }

  private fishLine(nameKo: string, lengthCm: number): string {
    return `${nameKo} ${lengthCm}cm`;
  }

  private render(): void {
    this.removeAll(true);
    const sc = this.scene;
    const bg = sc.add.graphics();
    bg.fillStyle(0x000000, 0.45);
    bg.fillRect(-GAME_WIDTH, -GAME_HEIGHT, GAME_WIDTH * 2, GAME_HEIGHT * 2);
    bg.fillStyle(0x0a1628, 0.98);
    bg.fillRoundedRect(-W / 2, -H / 2, W, H, 8);
    bg.lineStyle(2, 0x2a5a8a, 1);
    bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 8);
    this.add(bg);
    // 바깥 입력 흡수 — 아래 결정 패널·낚시 화면이 눌리지 않게
    this.add(sc.add.rectangle(0, 0, GAME_WIDTH * 2, GAME_HEIGHT * 2, 0x000000, 0.001).setInteractive());

    this.add(sc.add.text(0, -H / 2 + 22, '쿨러 정리', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '17px', color: '#aee8ff', fontStyle: 'bold',
    }).setOrigin(0.5));

    // ── 방금 낚은 고기 ── (자리에 넣었거나 놓아준 고기는 빈 틀)
    const y0 = -H / 2 + 50;
    this.add(this.label(-W / 2 + 20, y0, '방금 낚은 고기'));
    const rowW = this.fresh.length * CARD + (this.fresh.length - 1) * GAP;
    const rx0 = -rowW / 2;
    this.fresh.forEach((f, i) => {
      const x = rx0 + i * (CARD + GAP);
      if (this.freshState[i] !== 'wait') { this.addFrame(x, y0 + 20); return; }
      const key = `n${i}`;
      this.addCard(x, y0 + 20, f.iconTexture, `${f.lengthCm}cm`, '#ffd84a', this.sel.has(key) ? SEL : null, () => {
        this.toggle(key);
      });
    });
    this.newRowRect = this.screenRect(rx0 - 4, y0 + 16, rowW + 8, CARD + 8);

    // ── 쿨러 3x3 ──
    const gy0 = y0 + 20 + CARD + 26;
    const stored = CoolerStore.count() + this.placed.size;
    this.add(this.label(-W / 2 + 20, gy0 - 18, `쿨러 (${stored}/${COOLER_CAPACITY})`));
    const gridW = 3 * CARD + 2 * GAP;
    const gx0 = -gridW / 2;
    const pick = this.pickedFresh();
    this.slots().forEach((f, i) => {
      const x = gx0 + (i % 3) * (CARD + GAP);
      const y = gy0 + Math.floor(i / 3) * (CARD + GAP);
      const p = this.placed.get(i);
      if (p !== undefined) {
        // 자리에 넣어 둔 새 고기 — 누르면 위 줄로 되돌린다
        const nf = this.fresh[p];
        this.addCard(x, y, nf.iconTexture, '방금 낚음', '#ffd84a', PLACED, () => {
          this.placed.delete(i);
          this.freshState[p] = 'wait';
          this.render();
        });
        return;
      }
      if (!f) {
        // 빈 칸 — 새 고기를 고른 상태면 넣을 수 있는 칸으로 밝힌다
        this.addEmpty(x, y, pick !== null, () => {
          const k = this.pickedFresh();
          if (k === null) return;
          this.placed.set(i, k);
          this.freshState[k] = 'placed';
          this.sel.delete(`n${k}`);
          this.render();
        });
        return;
      }
      const key = `c${i}`;
      const sub = `${f.lengthCm}cm · ${CONDITION_LABEL[f.condition]}`;
      this.addCard(x, y, f.iconTexture ?? resolveFishTexture(f.speciesId, f.lengthCm, f.sex), sub,
        CONDITION_COLOR[f.condition], this.sel.has(key) ? SEL : null, () => this.toggle(key));
    });
    this.gridRect = this.screenRect(gx0 - 4, gy0 - 4, gridW + 8, 3 * CARD + 2 * GAP + 8);

    // ── 넣을 고기 · 빈 자리 ──
    const need = this.waiting().length;
    const free = this.emptySlots().length;
    const cy = gy0 + 3 * CARD + 2 * GAP + 18;
    const cnt = sc.add.text(0, cy, `넣을 고기 ${need}마리 · 빈 자리 ${free}칸`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', fontStyle: 'bold',
      color: need > free ? '#ff7a6a' : '#4af2a1',
    }).setOrigin(0.5);
    this.add(cnt);
    this.countRect = this.screenRect(-cnt.width / 2 - 6, cy - 12, cnt.width + 12, 24);

    // ── 버튼 ──
    const by = H / 2 - 30;
    const bw = 158;
    const nSel = this.sel.size;
    this.addButton(-bw - 10, by, bw, nSel > 0 ? `놓아주기 (${nSel})` : '놓아주기', nSel > 0,
      0x4a1a14, 0xff7a6a, '#ffb0a4', () => this.askRelease());
    this.addButton(0, by, bw, '넣고 마치기', true, 0x0d4a2e, 0x4af2a1, '#4af2a1', () => this.finish());
    this.addButton(bw + 10, by, bw, '돌아가기', true, 0x123a52, 0x5cd0ff, '#9fd0e4', () => this.cancel());
    this.releaseBtnRect = this.screenRect(-bw * 1.5 - 14, by - 21, bw + 8, 42);
    this.doneBtnRect = this.screenRect(-bw / 2 - 4, by - 21, bw + 8, 42);
    applyScreenFixed(this);
  }

  private toggle(key: string): void {
    if (this.sel.has(key)) this.sel.delete(key);
    else this.sel.add(key);
    this.render();
  }

  /** 고른 고기 이름 목록 — 확인 창용(한 줄에 둘 · 최대 여섯 마리 + 「외 N마리」) */
  private listLines(items: string[]): string {
    const shown = items.slice(0, 6);
    const rows: string[] = [];
    for (let i = 0; i < shown.length; i += 2) rows.push(shown.slice(i, i + 2).join(' · '));
    if (items.length > shown.length) rows.push(`외 ${items.length - shown.length}마리`);
    return rows.join('\n');
  }

  /** [놓아주기] — 고른 고기를 확인 창을 거쳐 놓아준다 */
  private askRelease(): void {
    if (this.sel.size === 0 || this.dialog) return;
    const names: string[] = [];
    for (const key of this.sel) {
      const i = Number(key.slice(1));
      if (key[0] === 'n') names.push(this.fishLine(this.fresh[i].nameKo, this.fresh[i].lengthCm));
      else { const f = CoolerStore.get(i); if (f) names.push(this.fishLine(f.nameKo, f.lengthCm)); }
    }
    this.confirm(
      `고른 고기 ${names.length}마리를 놓아줄까요?\n${this.listLines(names)}\n놓아준 고기는 되돌릴 수 없습니다.`,
      '놓아주기',
      () => {
        for (const key of this.sel) {
          const i = Number(key.slice(1));
          if (key[0] === 'n') this.freshState[i] = 'released';
          else if (CoolerStore.removeAt(i)) this.releasedOld++;
        }
        this.sel.clear();
        // 방금 낚은 고기가 하나도 안 남았으면 할 일이 끝났다
        if (this.freshState.every((s) => s === 'released')) { this.close(); return; }
        this.render();
      },
    );
  }

  /** [넣고 마치기] — 넣어 둔 자리 확정 + 남은 고기는 빈 칸에 무거운 순 · 그래도 남으면 확인 후 놓아준다 */
  private finish(): void {
    if (this.dialog) return;
    const wait = this.waiting().sort((a, b) => this.fresh[b].weightG - this.fresh[a].weightG);
    const empty = this.emptySlots();
    const fit = wait.slice(0, empty.length);
    const over = wait.slice(empty.length);
    const commit = (): void => {
      fit.forEach((k, j) => { this.placed.set(empty[j], k); this.freshState[k] = 'placed'; });
      over.forEach((k) => { this.freshState[k] = 'released'; });
      this.close();
    };
    if (over.length === 0) { commit(); return; }
    const names = over.map((k) => this.fishLine(this.fresh[k].nameKo, this.fresh[k].lengthCm));
    this.confirm(
      `빈 자리가 모자랍니다.\n들어가는 만큼만 넣고 ${over.length}마리는 놓아줄까요?\n${this.listLines(names)}`,
      '놓아주고 넣기',
      commit,
    );
  }

  /** 확정 — 넣어 둔 고기를 그 칸에 넣고 결과를 돌려준다 */
  private close(): void {
    const stored: SwapNewFish[] = [];
    for (const [slot, k] of this.placed) {
      const f = this.fresh[k];
      const ok = CoolerStore.addAt(slot, {
        speciesId: f.speciesId, nameKo: f.nameKo, lengthCm: f.lengthCm,
        weightG: f.weightG, sex: f.sex, iconTexture: f.iconTexture, catchMethod: 'rod',
      });
      if (ok) stored.push(f);
    }
    const releasedNew = this.fresh.length - stored.length;
    this.destroy();
    this.cbs.onDone({ stored, releasedNew, releasedOld: this.releasedOld });
  }

  /** ESC — 확인 창이 떠 있으면 그것만 닫고, 아니면 [돌아가기] */
  onEsc(): void {
    if (this.dialog) { this.dialog.destroy(); this.dialog = null; return; }
    this.cancel();
  }

  /** [돌아가기] — 넣어 둔 자리는 없던 일로 · 놓아준 고기는 돌아오지 않는다 */
  private cancel(): void {
    if (this.dialog) return;
    const remaining = this.freshState.flatMap((s, i) => (s === 'released' ? [] : [i]));
    this.destroy();
    this.cbs.onCancel(remaining);
  }

  private confirm(message: string, yes: string, onYes: () => void): void {
    const dlg = new ConfirmDialog(this.scene, message, () => {
      dlg.destroy();
      this.dialog = null;
      onYes();
    }, () => {
      dlg.destroy();
      this.dialog = null;
    }, { yes, no: '취소', danger: true });
    this.scene.add.existing(dlg);
    this.dialog = dlg;
  }

  override destroy(fromScene?: boolean): void {
    this.dialog?.destroy();
    this.dialog = null;
    super.destroy(fromScene);
  }

  private label(x: number, y: number, s: string): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, s, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
  }

  /** 자리를 비운 틀(위 줄 — 넣었거나 놓아준 고기) */
  private addFrame(x: number, y: number): void {
    const g = this.scene.add.graphics();
    g.lineStyle(1, 0x1f3d5a, 0.6); g.strokeRoundedRect(x, y, CARD, CARD, 4);
    this.add(g);
  }

  /** 빈 쿨러 칸 — 새 고기를 고른 상태면 초록으로 밝혀 「여기 넣을 수 있다」를 보인다 */
  private addEmpty(x: number, y: number, ready: boolean, onClick: () => void): void {
    const sc = this.scene;
    const g = sc.add.graphics();
    const paint = (hover: boolean): void => {
      g.clear();
      if (ready) {
        g.fillStyle(hover ? 0x14402c : 0x0e2a20, 0.9); g.fillRoundedRect(x, y, CARD, CARD, 4);
        g.lineStyle(hover ? 2 : 1.5, 0x4af2a1, hover ? 1 : 0.7); g.strokeRoundedRect(x, y, CARD, CARD, 4);
      } else {
        g.lineStyle(1, 0x1f3d5a, 0.9); g.strokeRoundedRect(x, y, CARD, CARD, 4);
      }
    };
    paint(false);
    this.add(g);
    if (!ready) return;
    const hit = sc.add.rectangle(x + CARD / 2, y + CARD / 2, CARD, CARD, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => paint(true));
    hit.on('pointerout', () => paint(false));
    hit.on('pointerdown', onClick);
    this.add(hit);
  }

  /** 고기 카드 — ring = 고른(하늘색) · 넣어 둔(노랑) 테 */
  private addCard(
    x: number, y: number, tex: string | undefined, sub: string, subColor: string, ring: number | null, onClick: () => void,
  ): void {
    const sc = this.scene;
    const g = sc.add.graphics();
    const paint = (hover: boolean): void => {
      g.clear();
      g.fillStyle(ring === SEL ? 0x123a56 : hover ? 0x162a40 : 0x0e1c2d, 0.96);
      g.fillRoundedRect(x, y, CARD, CARD, 4);
      g.lineStyle(ring !== null ? 2.5 : 1.2, ring ?? (hover ? 0x5cd0ff : 0x1f3d5a), 0.95);
      g.strokeRoundedRect(x, y, CARD, CARD, 4);
    };
    paint(false);
    this.add(g);
    if (tex && sc.textures.exists(tex)) {
      const src = sc.textures.get(tex).getSourceImage() as HTMLImageElement;
      const k = Math.min((CARD - 10) / src.width, 26 / src.height);
      this.add(sc.add.image(x + CARD / 2, y + 20, tex).setDisplaySize(src.width * k, src.height * k));
    }
    const t = sc.add.text(x + CARD / 2, y + CARD - 4, sub, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', fontStyle: 'bold', color: subColor,
    }).setOrigin(0.5, 1);
    if (t.width > CARD - 4) t.setScale((CARD - 4) / t.width);
    this.add(t);
    const hit = sc.add.rectangle(x + CARD / 2, y + CARD / 2, CARD, CARD, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => paint(true));
    hit.on('pointerout', () => paint(false));
    hit.on('pointerdown', onClick);
    this.add(hit);
  }

  private addButton(
    cx: number, cy: number, bw: number, label: string, enabled: boolean,
    fill: number, stroke: number, color: string, onClick: () => void,
  ): void {
    const sc = this.scene;
    const g = sc.add.graphics();
    g.fillStyle(enabled ? fill : 0x18222e, 0.95); g.fillRoundedRect(cx - bw / 2, cy - 19, bw, 38, 5);
    g.lineStyle(2, enabled ? stroke : 0x2a3846, 1); g.strokeRoundedRect(cx - bw / 2, cy - 19, bw, 38, 5);
    const txt = sc.add.text(cx, cy, label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', fontStyle: 'bold', color: enabled ? color : '#546a7c',
    }).setOrigin(0.5);
    if (txt.width > bw - 10) txt.setScale((bw - 10) / txt.width);
    const hit = sc.add.rectangle(cx, cy, bw, 38, 0xffffff, 0.001).setInteractive({ useHandCursor: enabled });
    if (enabled) {
      hit.on('pointerover', () => txt.setColor('#ffffff'));
      hit.on('pointerout', () => txt.setColor(color));
      hit.on('pointerdown', onClick);
    }
    this.add([g, txt, hit]);
  }

  /** 컨테이너 로컬 사각형 → 화면 사각형(가이드 하이라이트용) */
  private screenRect(x: number, y: number, w: number, h: number): TourRect {
    return new Phaser.Geom.Rectangle(this.x + x, this.y + y, w, h);
  }
}
