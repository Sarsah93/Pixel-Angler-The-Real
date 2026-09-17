/**
 * @file CharacterSprite.ts
 * @description 바닐라 베이스 캐릭터 텍스처 굽기 + 걷기 애니메이션 (138차)
 *
 * 아트 정본은 core `art/CharacterArt.ts`(순수 래스터라이저). 여기서는 **굽기와 재생**만 한다.
 *  - 시트 = 방향 4행 x 프레임 5열(대기 + 걷기 4). 셀 32x32 아트 px를 **정수 x2**로 굽는다.
 *  - 텍스처는 게임 레벨 TextureManager에 등록되므로 씬 재시작에도 살아남는다(50차 전례).
 *  - 키 = `chr_<설정해시>_<배율>`. 장비를 갈아입으면 해시가 바뀌어 **새 시트가 자동으로 구워진다**.
 *
 * ⚠ 비정수 배율 금지 — `setDisplaySize`로 크기를 맞추면 그레인이 무너진다(구 캐릭터의 실패 원인).
 *   배치는 항상 `setScale(정수)` 또는 구운 배율 그대로.
 */
import Phaser from 'phaser';
import {
  CHAR_CELL, CHAR_DIRS, CHAR_FOOT_Y, CHAR_FRAMES, CHAR_SCALE, charCfgKey, renderCharSheet,
  type CharConfig, type CharDir, type CharFrame,
} from '@tra/core';

/** 걷기 프레임 순서 — 접지 → 통과 → 접지(반대) → 통과 (144차 — 캐릭터 만들기 프리뷰가 공유) */
export const WALK_SEQ: CharFrame[] = [1, 2, 3, 4];
/** 프레임 간격(ms) */
export const CHAR_WALK_MS = 150;

function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function charFrameName(dir: CharDir, frame: CharFrame): string {
  return `${dir}${frame}`;
}

/**
 * 캐릭터 시트를 (없으면) 굽고 텍스처 키를 돌려준다.
 * 프레임 이름은 `charFrameName(dir, frame)`.
 */
export function ensureCharSheet(scene: Phaser.Scene, cfg: CharConfig, scale = CHAR_SCALE): string {
  const s = Math.max(1, Math.round(scale));
  const key = `chr_${shortHash(charCfgKey(cfg))}_${s}`;
  if (scene.textures.exists(key)) return key;

  const sheet = renderCharSheet(cfg);
  const w = sheet.w * s;
  const h = sheet.h * s;
  const canvas = scene.textures.createCanvas(key, w, h);
  if (!canvas) return key;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, w, h);

  // 정수 배율 확대 — 보간 없이 블록으로 찍는다
  const img = ctx.createImageData(sheet.w, sheet.h);
  img.data.set(sheet.data);
  if (s === 1) {
    ctx.putImageData(img, 0, 0);
  } else {
    const tmp = document.createElement('canvas');
    tmp.width = sheet.w; tmp.height = sheet.h;
    const tctx = tmp.getContext('2d');
    if (tctx) {
      tctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, sheet.w, sheet.h, 0, 0, w, h);
    }
  }

  const cell = CHAR_CELL * s;
  CHAR_DIRS.forEach((d, r) => {
    CHAR_FRAMES.forEach((f, c) => {
      canvas.add(charFrameName(d, f), 0, c * cell, r * cell, cell, cell);
    });
  });
  canvas.refresh();
  return key;
}

/**
 * 얼굴 초상 텍스처 (150차 — 사용자 지시 "전신 말고 얼굴만 확대해 증명사진처럼").
 *
 * 전신을 통째로 키우면 초상 칸의 대부분을 몸통·다리가 먹고 얼굴은 한 줌으로 남는다.
 * 여기서는 `down` 대기 프레임에서 **얼굴 창(16x16 아트 px)** 만 오려 정수 배율로 키운다.
 * 창은 머리(행 3~11)보다 위아래로 넉넉히 잡는다 — 모자 챙·비니 방울·곱슬은 머리 위로 나오고
 * 아래로는 어깨가 조금 걸려야 증명사진처럼 보인다.
 *
 * ⚠ 배율은 정수(AGENTS §8) — 도트 격자가 무너지지 않는다.
 */
export function ensureFacePortrait(scene: Phaser.Scene, cfg: CharConfig, scale = 10): string {
  const s = Math.max(1, Math.round(scale));
  const key = `face_${shortHash(charCfgKey(cfg))}_${s}`;
  if (scene.textures.exists(key)) return key;

  const FW = 16, FH = 16;         // 얼굴 창 (아트 px)
  const FX = 8, FY = 0;           // 셀 안 좌상단 — 머리(11~20열, 3~11행)를 가운데 두고 위 3행 여유
  const sheet = renderCharSheet(cfg);
  const canvas = scene.textures.createCanvas(key, FW * s, FH * s);
  if (!canvas) return key;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, FW * s, FH * s);

  // 시트에서 얼굴 창만 떠낸다 ('down' = 0행 · 대기 = 0열)
  const face = new Uint8ClampedArray(FW * FH * 4);
  for (let y = 0; y < FH; y++) {
    const src = ((FY + y) * sheet.w + FX) * 4;
    face.set(sheet.data.subarray(src, src + FW * 4), y * FW * 4);
  }
  const img = ctx.createImageData(FW, FH);
  img.data.set(face);
  const tmp = document.createElement('canvas');
  tmp.width = FW; tmp.height = FH;
  const tctx = tmp.getContext('2d');
  if (tctx) {
    tctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, FW, FH, 0, 0, FW * s, FH * s);
  }
  canvas.refresh();
  return key;
}

/**
 * 탑다운 필드용 캐릭터 스프라이트 래퍼.
 * 씬은 `setDir` / `update(dt, moving)`만 호출하면 되고, 장비가 바뀌면 `setConfig`.
 */
export class CharacterSprite {
  readonly image: Phaser.GameObjects.Image;
  private cfg: CharConfig;
  private texKey: string;
  private dir: CharDir = 'down';
  private phase = 0;
  private timer = 0;
  private readonly scene: Phaser.Scene;
  private readonly scale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: CharConfig, scale = CHAR_SCALE) {
    this.scene = scene;
    this.cfg = cfg;
    this.scale = scale;
    this.texKey = ensureCharSheet(scene, cfg, scale);
    this.image = scene.add.image(x, y, this.texKey, charFrameName('down', 0)).setOrigin(0.5, 1);
  }

  /** 셀 하단 ~ 발바닥 사이 여백(px). 원점이 (0.5,1)이므로 배치 y에 **더해야** 발이 지면에 닿는다. */
  get footPad(): number { return (CHAR_CELL - 1 - CHAR_FOOT_Y) * this.scale; }
  /** 몸 높이(px) — 그림자 크기·충돌 계산용 */
  get bodyHeight(): number { return (CHAR_FOOT_Y - 2) * this.scale; }

  setConfig(cfg: CharConfig): void {
    this.cfg = cfg;
    this.texKey = ensureCharSheet(this.scene, cfg, this.scale);
    this.image.setTexture(this.texKey, charFrameName(this.dir, 0));
    this.applyFrame();
  }

  getConfig(): CharConfig { return this.cfg; }

  setDir(dir: CharDir): void {
    if (this.dir === dir) return;
    this.dir = dir;
    this.applyFrame();
  }

  /**
   * `dtMs` = 경과 ms · `moving` = 이동 중 여부 ·
   * `paceMult` = 프레임 속도 배율(144차 — 달리기는 같은 4프레임을 더 빨리 돌린다. 1 = 걷기)
   */
  update(dtMs: number, moving: boolean, paceMult = 1): void {
    if (this.walking !== moving) {
      this.walking = moving;
      this.phase = 0;
      this.timer = 0;
      this.applyFrame();
      if (!moving) return;
    }
    if (!moving) return;
    const step = CHAR_WALK_MS / Math.max(0.2, paceMult);
    this.timer += dtMs;
    while (this.timer >= step) {
      this.timer -= step;
      this.phase = (this.phase + 1) % WALK_SEQ.length;
      this.applyFrame();
    }
  }

  private walking = false;

  private applyFrame(): void {
    const f: CharFrame = this.walking ? WALK_SEQ[this.phase] : 0;
    this.image.setTexture(this.texKey, charFrameName(this.dir, f));
  }

  destroy(): void { this.image.destroy(); }
}

/** 이동 벡터 → 방향 (기존 씬의 4방향 규약과 동일) */
export function dirFromVelocity(vx: number, vy: number, fallback: CharDir = 'down'): CharDir {
  if (vx === 0 && vy === 0) return fallback;
  if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  return vy > 0 ? 'down' : 'up';
}
