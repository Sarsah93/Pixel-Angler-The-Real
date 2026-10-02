/**
 * @file CoolerSwapPanel.ts
 * @description 쿨러 정리 창 (196차 — 사용자 지시 「방금 잡은 고기와 이전에 잡아 둔 고기를 바꿔 방생하고 싶다」)
 *
 * 쿨러가 차서 방금 낚은 고기가 다 들어가지 않을 때 결정 패널 대신 뜬다.
 *  - 위 줄: 방금 낚은 고기(1~3마리) — 누르면 「놓아줌」으로 바뀐다.
 *  - 아래 3x3: 쿨러에 있던 고기 — 누르면 「놓아줌」(자리를 비운다).
 *  - 넣을 고기 수 · 빈 자리 수를 맞춰 보여 준다(모자라면 빨강).
 *  - [정리하고 넣기] — 고른 대로 바꿔 넣는다(넣을 고기 ≤ 빈 자리일 때만).
 *  - [들어가는 만큼만 넣기] — 빈 자리만큼 **무거운 순**으로 넣고 나머지는 놓아준다.
 *  - [돌아가기] — 결정 패널로.
 * 조작 안내 글은 창에 쓰지 않는다(R11) — 처음 열 때 체험 가이드(`tour.cooler_swap`)가 짚는다.
 *
 * 1인칭 결과 패널과 같은 화면 고정 컨테이너(depth 112)로 둔다 — DraggablePanel이 아니다
 * (결정 패널이 같은 방식이고, 낚시 씬은 팝업 스택이 없다).
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { CoolerStore, COOLER_CAPACITY, type CoolerFish } from '../store/CoolerStore.js';
import { CONDITION_LABEL, CONDITION_COLOR } from '../store/InventoryStore.js';
import { applyScreenFixed } from './DraggablePanel.js';
import { resolveFishTexture } from '../data/FishTextures.js';
import { maybeStartTour, type TourRect } from './GuideTour.js';

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
const H = 460;
const CARD = 58;
const GAP = 8;

export class CoolerSwapPanel extends Phaser.GameObjects.Container {
  private newKeep: boolean[];
  private oldRelease: boolean[] = Array.from({ length: COOLER_CAPACITY }, () => false);
  private newRowRect = new Phaser.Geom.Rectangle();
  private gridRect = new Phaser.Geom.Rectangle();
  private countRect = new Phaser.Geom.Rectangle();
  private btnRect = new Phaser.Geom.Rectangle();

  constructor(
    scene: Phaser.Scene,
    private readonly fresh: SwapNewFish[],
    private readonly cbs: { onDone: (r: CoolerSwapResult) => void; onCancel: () => void },
  ) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16);
    this.newKeep = fresh.map(() => true);
    this.setDepth(112);
    scene.add.existing(this);
    this.render();
    maybeStartTour(scene, () => ({
      id: 'cooler_swap',
      alive: () => this.active,
      steps: [
        { text: '쿨러가 가득 찼을 때 여는 정리 창입니다. 맨 위가 방금 낚은 고기예요. 누르면 놓아줄 고기로 바뀝니다.', target: () => this.newRowRect },
        { text: '아래는 쿨러에 들어 있던 고기입니다. 작은 고기를 눌러 놓아주면 그만큼 자리가 생깁니다.', target: () => this.gridRect },
        { text: '넣을 고기와 빈 자리 수입니다. 넣을 고기가 더 많으면 빨갛게 표시됩니다.', target: () => this.countRect },
        { text: '「정리하고 넣기」는 고른 대로 바꿔 넣고, 「들어가는 만큼만 넣기」는 빈 자리만큼 무거운 고기부터 넣고 나머지를 놓아줍니다.', target: () => this.btnRect },
      ],
    }));
  }

  /** 쿨러 칸별 고기(빈 칸 null) */
  private slots(): (CoolerFish | null)[] {
    return Array.from({ length: COOLER_CAPACITY }, (_, i) => CoolerStore.get(i));
  }

  private freeSlots(): number {
    const s = this.slots();
    const released = s.filter((f, i) => f && this.oldRelease[i]).length;
    return COOLER_CAPACITY - CoolerStore.count() + released;
  }

  private needSlots(): number {
    return this.newKeep.filter(Boolean).length;
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

    const title = sc.add.text(0, -H / 2 + 22, '쿨러 정리', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '17px', color: '#aee8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(title);

    // ── 방금 낚은 고기 ──
    const y0 = -H / 2 + 50;
    this.add(this.label(-W / 2 + 20, y0, '방금 낚은 고기'));
    const rowW = this.fresh.length * CARD + (this.fresh.length - 1) * GAP;
    const rx0 = -rowW / 2;
    this.fresh.forEach((f, i) => {
      const x = rx0 + i * (CARD + GAP);
      this.addCard(x, y0 + 20, f.iconTexture, `${f.lengthCm}cm`, !this.newKeep[i], '#ffd84a', () => {
        this.newKeep[i] = !this.newKeep[i];
        this.render();
      });
    });
    this.newRowRect = this.screenRect(rx0 - 4, y0 + 16, rowW + 8, CARD + 8);

    // ── 쿨러 3x3 ──
    const gy0 = y0 + 20 + CARD + 26;
    this.add(this.label(-W / 2 + 20, gy0 - 18, `쿨러 (${CoolerStore.count()}/${COOLER_CAPACITY})`));
    const gridW = 3 * CARD + 2 * GAP;
    const gx0 = -gridW / 2;
    this.slots().forEach((f, i) => {
      const x = gx0 + (i % 3) * (CARD + GAP);
      const y = gy0 + Math.floor(i / 3) * (CARD + GAP);
      if (!f) {
        const g = sc.add.graphics();
        g.lineStyle(1, 0x1f3d5a, 0.9); g.strokeRoundedRect(x, y, CARD, CARD, 4);
        this.add(g);
        return;
      }
      const sub = `${f.lengthCm}cm · ${CONDITION_LABEL[f.condition]}`;
      this.addCard(x, y, f.iconTexture ?? resolveFishTexture(f.speciesId, f.lengthCm, f.sex), sub, this.oldRelease[i], CONDITION_COLOR[f.condition], () => {
        this.oldRelease[i] = !this.oldRelease[i];
        this.render();
      });
    });
    this.gridRect = this.screenRect(gx0 - 4, gy0 - 4, gridW + 8, 3 * CARD + 2 * GAP + 8);

    // ── 넣을 고기 · 빈 자리 ──
    const need = this.needSlots();
    const free = this.freeSlots();
    const cy = gy0 + 3 * CARD + 2 * GAP + 18;
    const cnt = sc.add.text(0, cy, `넣을 고기 ${need}마리 · 빈 자리 ${free}칸`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', fontStyle: 'bold',
      color: need > free ? '#ff7a6a' : '#4af2a1',
    }).setOrigin(0.5);
    this.add(cnt);
    this.countRect = this.screenRect(-cnt.width / 2 - 6, cy - 12, cnt.width + 12, 24);

    // ── 버튼 ──
    const by = H / 2 - 30;
    const canApply = need <= free && (need > 0 || this.oldRelease.some(Boolean) || this.newKeep.some((k) => !k));
    const bw = 158;
    this.addButton(-bw - 10, by, bw, '정리하고 넣기', canApply, 0x0d4a2e, 0x4af2a1, '#4af2a1', () => this.apply(false));
    this.addButton(0, by, bw, '들어가는 만큼만 넣기', true, 0x14425e, 0x33b0e0, '#aee8ff', () => this.apply(true));
    this.addButton(bw + 10, by, bw, '돌아가기', true, 0x123a52, 0x5cd0ff, '#9fd0e4', () => {
      this.destroy();
      this.cbs.onCancel();
    });
    this.btnRect = this.screenRect(-bw * 1.5 - 14, by - 21, bw * 3 + 28, 42);
    applyScreenFixed(this);
  }

  /** 적용 — fitOnly면 빈 자리만큼 무거운 순으로 넣고 나머지는 놓아준다 */
  private apply(fitOnly: boolean): void {
    // 1) 놓아주기로 고른 쿨러 고기를 먼저 뺀다 — 자리가 생긴다
    let releasedOld = 0;
    this.oldRelease.forEach((r, i) => { if (r && CoolerStore.removeAt(i)) releasedOld++; });
    const free = COOLER_CAPACITY - CoolerStore.count();
    let keep = this.fresh.filter((_, i) => this.newKeep[i]);
    if (fitOnly) keep = [...keep].sort((a, b) => b.weightG - a.weightG).slice(0, Math.max(0, free));
    else if (keep.length > free) return;   // 버튼이 막혀 있다 — 방어
    for (const f of keep) {
      CoolerStore.add({
        speciesId: f.speciesId, nameKo: f.nameKo, lengthCm: f.lengthCm,
        weightG: f.weightG, sex: f.sex, iconTexture: f.iconTexture, catchMethod: 'rod',
      });
    }
    this.destroy();
    this.cbs.onDone({ stored: keep, releasedNew: this.fresh.length - keep.length, releasedOld });
  }

  private label(x: number, y: number, s: string): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, s, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#8faabf', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
  }

  /** 고기 카드 — 놓아줄 고기는 어둡게 + 빨간 테 + 「놓아줌」 */
  private addCard(
    x: number, y: number, tex: string | undefined, sub: string, released: boolean, subColor: string, onClick: () => void,
  ): void {
    const sc = this.scene;
    const g = sc.add.graphics();
    const paint = (hover: boolean): void => {
      g.clear();
      g.fillStyle(released ? 0x2a1214 : hover ? 0x162a40 : 0x0e1c2d, 0.96);
      g.fillRoundedRect(x, y, CARD, CARD, 4);
      g.lineStyle(released ? 2 : 1.2, released ? 0xff6a5a : hover ? 0x5cd0ff : 0x1f3d5a, 0.95);
      g.strokeRoundedRect(x, y, CARD, CARD, 4);
    };
    paint(false);
    this.add(g);
    if (tex && sc.textures.exists(tex)) {
      const src = sc.textures.get(tex).getSourceImage() as HTMLImageElement;
      const k = Math.min((CARD - 10) / src.width, 26 / src.height);
      const img = sc.add.image(x + CARD / 2, y + 20, tex).setDisplaySize(src.width * k, src.height * k);
      if (released) img.setAlpha(0.35);
      this.add(img);
    }
    const t = sc.add.text(x + CARD / 2, y + CARD - 4, released ? '놓아줌' : sub, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '9px', fontStyle: 'bold',
      color: released ? '#ff8a7a' : subColor,
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
