/**
 * @file DialogueStage.ts
 * @description 286차 — 대화 장면의 몸짓을 필드 위 실제 인물에게 입힌다(대화창은 `ui/DialoguePanel.ts`가 · 몸짓 표는 core `rules/TalkActs.ts`).
 *
 * 사용자 지시(원문): 「담배를 꺼내 물고 연기를 내뿜는 것 같은 몸짓 연출 … 실제로 사람이 말을 하면서 저 동작을 동시에 할 순 없잖아?
 *  … 저런 연출이 나오고 있는데 갑자기 대화 코멘트가 열리거나 그러지 않았으면 한다」 · 285차 「필드 NPC 입가 담배 그래픽 + 연기 · '후~' 효과음」.
 *
 *  - 무대가 열리면(`begin`) 두 사람이 마주 보고, 카메라가 대화창 위 띠(화면 위 250px)에 두 사람이 오도록 내려간다(HUD는 접는다).
 *  - 몸짓마다 그림 · 소리 · 걸리는 시간. **말을 멈추는 몸짓(block)의 시간 동안 대화창은 새 말을 열지 않는다** — 그 판정은 대화창이 한다.
 *  - 담배는 「든 것」 — 불붙이면 무대가 닫히거나 비벼 끌 때까지 입가에 남고, 끝에서 가는 연기가 오른다.
 *  - 인물 그림은 32칸 × 2배(`CHAR_SCALE`) · 원점 = 발(0.5, 1) — 입은 칸 위에서 약 12행.
 * 무대가 없거나(다른 씬) 그 인물이 필드에 없으면 대화창이 몸짓 지문(괄호 글)을 대신 찍는다.
 */
import Phaser from 'phaser';
import { CHAR_CELL, CHAR_SCALE, talkActDef, type CharDir, type TalkActId } from '@tra/core';
import { playSfx, type SfxName } from '../../audio/SfxBank.js';

/** 무대 위 인물 — 필드의 실제 그림(주인공 · 스토리 인물) */
export interface StageActor {
  obj: Phaser.GameObjects.Image;
  dir(): CharDir;
  face(d: CharDir): void;
}

/** 씬이 무대에 넘겨 주는 것 */
export interface DialogueStageHost {
  readonly scene: Phaser.Scene;
  actor(who: string): StageActor | undefined;
  /** 대화 장면 보기 켜고 끄기 — HUD 접기 · 카메라를 대화창 위 띠로 */
  setTalkView(on: boolean): void;
  /** 건네는 물건의 그림 키(없으면 작은 꾸러미) */
  itemTexture?(itemId: string): string | undefined;
}

/** 입 높이 — 칸 위에서 행 수(머리 꼭대기 3행 · 눈 8행 · 입 12행 언저리) */
const MOUTH_ROW = 12;
/** 손 높이 — 칸 위에서 행 수 */
const HAND_ROW = 20;
const S = CHAR_SCALE;

function mouthOf(a: StageActor): { x: number; y: number; dx: number; visible: boolean } {
  const d = a.dir();
  const top = a.obj.y - CHAR_CELL * S;
  const y = top + MOUTH_ROW * S;
  if (d === 'left') return { x: a.obj.x - 4 * S, y, dx: -1, visible: true };
  if (d === 'right') return { x: a.obj.x + 4 * S, y, dx: 1, visible: true };
  if (d === 'up') return { x: a.obj.x, y, dx: 0, visible: false };
  return { x: a.obj.x + 1 * S, y, dx: 1, visible: true };
}

function dirToward(from: Phaser.GameObjects.Image, to: Phaser.GameObjects.Image): CharDir {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

function turn(d: CharDir, k: 1 | -1): CharDir {
  const ring: CharDir[] = ['down', 'left', 'up', 'right'];
  return ring[(ring.indexOf(d) + k + 4) % 4];
}

export class DialogueStage {
  private readonly host: DialogueStageHost;
  private readonly scene: Phaser.Scene;
  private partner = '';
  private open = false;
  /** 입에 문 담배(인물 id → 그림 · 가는 연기 박자) */
  private readonly cigs = new Map<string, { g: Phaser.GameObjects.Graphics; nextWisp: number }>();
  /** 무대가 닫힐 때 같이 걷는 것(연기 · 불꽃 · 건네는 물건) */
  private readonly props = new Set<Phaser.GameObjects.GameObject>();
  private readonly tweens = new Set<Phaser.Tweens.Tween>();
  private readonly onUpdate: (time: number) => void;

  constructor(host: DialogueStageHost) {
    this.host = host;
    this.scene = host.scene;
    this.onUpdate = (time: number) => this.tick(time);
  }

  get isOpen(): boolean { return this.open; }
  /** 무대의 상대(대화창의 대화 상대) */
  get partnerId(): string { return this.partner; }

  /** 그 사람이 지금 필드에 서 있는가(아니면 대화창이 지문을 찍는다) */
  has(who: string): boolean { return !!this.host.actor(who); }

  /** 무대를 연다 — 두 사람이 마주 보고 카메라가 대화창 위로 */
  begin(partner: string): void {
    if (this.open) return;
    this.open = true;
    this.partner = partner;
    this.host.setTalkView(true);
    this.faceEachOther();
    this.scene.events.on('update', this.onUpdate);
  }

  /** 무대를 닫는다 — 담배 · 연기를 걷고 카메라 · HUD를 되돌린다 */
  end(): void {
    if (!this.open) return;
    this.open = false;
    this.scene.events.off('update', this.onUpdate);
    for (const t of this.tweens) t.stop();
    this.tweens.clear();
    for (const o of this.props) o.destroy();
    this.props.clear();
    for (const c of this.cigs.values()) c.g.destroy();
    this.cigs.clear();
    this.host.setTalkView(false);
  }

  /** 두 사람이 마주 본다(말하는 사람이 바뀔 때 · 고개를 돌렸다 돌아올 때) */
  faceEachOther(): void {
    const me = this.host.actor('player');
    const you = this.host.actor(this.partner);
    if (!me || !you) return;
    me.face(dirToward(me.obj, you.obj));
    you.face(dirToward(you.obj, me.obj));
  }

  /**
   * 몸짓 하나 — 그림 · 소리를 시작하고 걸리는 시간(ms)을 돌려준다.
   * 인물이 없으면 0(대화창이 지문으로 대신한다).
   */
  play(who: string, act: TalkActId, opts: { to?: string; item?: string } = {}): number {
    const def = talkActDef(act);
    const a = this.host.actor(who);
    if (!def || !a || !this.open) return 0;
    switch (act) {
      case 'cig_light': this.cigLight(who, a, def.ms); break;
      case 'cig_puff': this.cigPuff(who, a, def.ms); break;
      case 'cig_out': this.cigOut(who, a); break;
      case 'give': this.give(a, opts.to ? this.host.actor(opts.to) : undefined, opts.item, def.ms); break;
      case 'receive': this.bob(a, 1, 1, 140); break;
      case 'nod': this.bob(a, 2, 2, 150); break;
      case 'shake_head': this.shake(a, def.ms); break;
      case 'look_away': this.lookAway(a, def.ms, 1); break;
      case 'look_sea': this.lookAway(a, def.ms, -1); break;
      case 'look_up': this.bob(a, -2, 1, 220); break;
      case 'peer': this.lean(a, who, def.ms); break;
      case 'sigh': this.bob(a, 2, 1, 420); break;
      case 'laugh': this.bob(a, -1, 3, 90); break;
      case 'silence': break;
    }
    if (def.sfx && act !== 'cig_light') playSfx(def.sfx as SfxName);
    return def.ms;
  }

  // ── 담배 ──────────────────────────────────────────

  private cigLight(who: string, a: StageActor, ms: number): void {
    // 꺼내 무는 데 ⅓ → 라이터 불꽃 ⅓(치익) → 첫 연기
    const t1 = ms * 0.3, t2 = ms * 0.62;
    this.later(t1, () => {
      this.ensureCig(who, a);
      const m = mouthOf(a);
      const flame = this.scene.add.graphics().setDepth(a.obj.depth + 0.002);
      this.props.add(flame);
      const tipX = m.x + m.dx * 7 * S;
      let n = 0;
      const tw = this.scene.tweens.addCounter({
        from: 0, to: 1, duration: t2 - t1, onUpdate: () => {
          n++;
          flame.clear();
          const h = (n % 3) + 3;
          flame.fillStyle(0xffd257, 1).fillRect(tipX - 1, m.y - h - 1, 2 * S - 1, h);
          flame.fillStyle(0xff8a3d, 1).fillRect(tipX, m.y - 2, S, 2);
        },
        onComplete: () => { flame.destroy(); this.props.delete(flame); },
      });
      this.tweens.add(tw);
      playSfx('lighter');
    });
    this.later(t2 + 120, () => this.smoke(a, 2, 600));
  }

  private cigPuff(who: string, a: StageActor, ms: number): void {
    this.ensureCig(who, a);
    // 빨아들이는 동안 끝이 밝아지고, 길게 내뿜는다
    const c = this.cigs.get(who);
    if (c) {
      const tw = this.scene.tweens.add({ targets: c.g, alpha: { from: 1, to: 0.85 }, duration: ms * 0.3, yoyo: true });
      this.tweens.add(tw);
    }
    this.later(ms * 0.35, () => this.smoke(a, 7, ms * 0.6, true));
  }

  private cigOut(who: string, a: StageActor): void {
    const c = this.cigs.get(who);
    if (!c) return;
    this.cigs.delete(who);
    // 입에서 떼어 발치로 — 비벼 끄는 작은 재(그림은 절대 좌표로 그려 두었으니 위치 오프셋만 민다)
    const tw = this.scene.tweens.add({
      targets: c.g, y: (a.obj.y - 2) - mouthOf(a).y, alpha: 0, duration: 520, ease: 'Quad.easeIn',
      onComplete: () => c.g.destroy(),
    });
    this.tweens.add(tw);
    this.later(560, () => this.smoke(a, 1, 300, false, a.obj.y - 2));
  }

  /** 입가 담배 그림 — 방향마다 다시 그린다(매 프레임 위치 동기) */
  private ensureCig(who: string, a: StageActor): void {
    if (this.cigs.has(who)) return;
    const g = this.scene.add.graphics();
    this.cigs.set(who, { g, nextWisp: 0 });
    this.drawCig(g, a);
  }

  private drawCig(g: Phaser.GameObjects.Graphics, a: StageActor): void {
    const m = mouthOf(a);
    g.clear();
    g.setPosition(0, 0).setDepth(a.obj.depth + 0.001);
    if (!m.visible) return;
    const len = 6 * S;
    const x0 = m.x, x1 = m.x + m.dx * len;
    const lo = Math.min(x0, x1);
    // 몸통(흰 종이) · 필터(황토) · 불붙은 끝(주황)
    g.fillStyle(0xf2efe6, 1).fillRect(lo, m.y, len, S);
    g.fillStyle(0xd09a52, 1).fillRect(m.dx >= 0 ? x0 : x0 - 2 * S, m.y, 2 * S, S);
    g.fillStyle(0xff6a2a, 1).fillRect(m.dx >= 0 ? x1 - S : x1, m.y, S, S);
    g.fillStyle(0x2a2435, 0.55).fillRect(lo, m.y + S, len, 1);
  }

  /**
   * 연기 — 2px 도트 덩어리(작은 네모 몇 개)가 피어오르며 흩어진다. 둥근 큰 원은 도트 세계에서 흰 얼룩으로 읽혀 쓰지 않는다.
   * `big` = 길게 내뿜는 숨(얼굴 앞으로 퍼진다) · 아니면 담배 끝에서 가늘게.
   */
  private smoke(a: StageActor, puffs: number, ms: number, big = false, fromY?: number): void {
    const m = mouthOf(a);
    const x0 = big ? m.x + m.dx * 2 * S : m.x + m.dx * 6 * S;
    const y0 = fromY ?? m.y - S;
    for (let i = 0; i < puffs; i++) {
      const p = this.scene.add.graphics().setDepth(a.obj.depth + 0.003);
      const c = big ? 2 + (i % 2) : 1;   // 덩어리 한 변(도트)
      const shade = i % 3 === 0 ? 0xe6e9ee : 0xcdd3da;
      p.fillStyle(shade, 1);
      p.fillRect(-c * S / 2, -c * S / 2, c * S, c * S);
      if (big) { p.fillRect(c * S / 2, -S, S, S); p.fillRect(-c * S / 2 - S, 0, S, S); }
      p.setPosition(x0, y0).setAlpha(big ? 0.75 : 0.6);
      this.props.add(p);
      const side = (m.dx || 1);
      const drift = big ? side * (6 + i * 3) * S / 2 : (i % 2 ? S : -S);
      const rise = big ? (6 + i * 2) * S / 2 : (10 + i * 3) * S / 2;
      const tw = this.scene.tweens.add({
        targets: p, x: x0 + drift, y: y0 - rise, scale: big ? 1.6 : 1.3, alpha: 0,
        delay: i * Math.min(160, ms / Math.max(1, puffs) / 1.5), duration: ms, ease: 'Sine.easeOut',
        onComplete: () => { p.destroy(); this.props.delete(p); },
      });
      this.tweens.add(tw);
    }
  }

  // ── 건네기 · 고개 · 시선 ─────────────────────────────

  private give(from: StageActor, to: StageActor | undefined, item: string | undefined, ms: number): void {
    const tex = item ? this.host.itemTexture?.(item) : undefined;
    const sx = from.obj.x, sy = from.obj.y - CHAR_CELL * S + HAND_ROW * S;
    let o: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
    if (tex && this.scene.textures.exists(tex)) {
      const img = this.scene.add.image(sx, sy, tex);
      const k = 22 / Math.max(img.width, img.height);
      img.setScale(k);
      o = img;
    } else {
      const g = this.scene.add.graphics();
      g.fillStyle(0x3d5a80, 1).fillRect(-5, -7, 10, 14);
      g.fillStyle(0xe8e2d4, 1).fillRect(-5, -7, 10, 3);
      g.setPosition(sx, sy);
      o = g;
    }
    o.setDepth(Math.max(from.obj.depth, to?.obj.depth ?? 0) + 0.004);
    this.props.add(o);
    const tx = to ? to.obj.x : sx + 24, ty = to ? to.obj.y - CHAR_CELL * S + HAND_ROW * S : sy;
    // 꺼내 드는 데 ⅓ · 건너가는 데 ½ · 받아 쥐면 사라진다
    const lift = this.scene.tweens.add({ targets: o, y: sy - 6, duration: ms * 0.3, ease: 'Sine.easeOut' });
    this.tweens.add(lift);
    this.later(ms * 0.32, () => {
      const tw = this.scene.tweens.add({
        targets: o, x: tx, y: ty - 4, duration: ms * 0.5, ease: 'Sine.easeInOut',
        onComplete: () => {
          const fade = this.scene.tweens.add({ targets: o, alpha: 0, duration: 260, delay: 200, onComplete: () => { o.destroy(); this.props.delete(o); } });
          this.tweens.add(fade);
        },
      });
      this.tweens.add(tw);
    });
  }

  /** 위아래로 n번(+ = 아래 먼저) */
  private bob(a: StageActor, px: number, times: number, half: number): void {
    const base = a.obj.y;
    const tw = this.scene.tweens.add({
      targets: a.obj, y: base + px, duration: half, yoyo: true, repeat: times - 1, ease: 'Sine.easeInOut',
      onComplete: () => a.obj.setY(base),
    });
    this.tweens.add(tw);
  }

  private shake(a: StageActor, ms: number): void {
    const d = a.dir();
    // 좌우를 번갈아 본다 — 고개 젓기
    this.later(ms * 0.15, () => a.face(turn(d, 1)));
    this.later(ms * 0.4, () => a.face(turn(d, -1)));
    this.later(ms * 0.7, () => a.face(d));
  }

  private lookAway(a: StageActor, ms: number, k: 1 | -1): void {
    const d = a.dir();
    a.face(turn(d, k));
    this.later(ms, () => { if (this.open) this.faceEachOther(); });
  }

  private lean(a: StageActor, who: string, ms: number): void {
    const other = this.host.actor(who === 'player' ? this.partner : 'player');
    if (!other) return;
    const bx = a.obj.x, by = a.obj.y;
    const dx = Math.sign(other.obj.x - bx) * 3, dy = Math.sign(other.obj.y - by) * 2;
    const tw = this.scene.tweens.add({
      targets: a.obj, x: bx + dx, y: by + dy, duration: ms * 0.35, yoyo: true, hold: ms * 0.3, ease: 'Sine.easeInOut',
      onComplete: () => a.obj.setPosition(bx, by),
    });
    this.tweens.add(tw);
  }

  // ── 매 프레임 ───────────────────────────────────────

  private tick(time: number): void {
    for (const [who, c] of this.cigs) {
      const a = this.host.actor(who);
      if (!a) continue;
      this.drawCig(c.g, a);
      // 물고 있는 동안 끝에서 가는 연기가 오른다(말하는 동안에도 — 말을 막지 않는다)
      if (time >= c.nextWisp) {
        c.nextWisp = time + 900 + Math.random() * 500;
        if (mouthOf(a).visible) this.smoke(a, 1, 1100);
      }
    }
  }

  private later(ms: number, fn: () => void): void {
    const ev = this.scene.time.delayedCall(ms, () => { if (this.open) fn(); });
    // 무대가 닫히면 남은 예약은 `open` 검사로 버려진다
    void ev;
  }
}
