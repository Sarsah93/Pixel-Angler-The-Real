/**
 * @file CollapseOverlay.ts
 * @description 기절·사망 연출 오버레이 (126차 P4 — PROGRESSION_SURVIVAL_SPEC §6)
 *
 * 흐름: 캐릭터가 옆으로 눕는다 → 캐릭터 주변만 남기고 비네트 암전(0.5초)
 *      → 2초 후 팝업("기절했습니다!" / "사망했습니다!") → 버튼으로 기상·부활.
 *
 * 씬 공용(필드·1인칭·실내)이라 캐릭터 스프라이트는 **선택 인자**다. 없으면 화면 중앙을
 * 기준으로 비네트를 판다. 눕는 연출은 전용 에셋(눈 감은 2프레임)이 들어오기 전까지
 * 기존 idle 스프라이트를 90° 눕히고 호흡 스케일을 얹은 **플레이스홀더**다.
 *
 * ⚠ UI 규칙(AGENTS §4): 이모지·장식 특수문자를 쓰지 않는다 — 색·도형·텍스트만.
 */

import Phaser from 'phaser';
import { TUNING } from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { applyScreenFixed } from './DraggablePanel.js';

/** 쓰러짐 종류 — 기절(회복 가능) / 사망(페널티 + 집 부활) */
export type CollapseKind = 'faint' | 'death';

export interface CollapseOptions {
  /** 눕힐 캐릭터 스프라이트 (없으면 화면 중앙 기준 비네트) */
  sprite?: Phaser.GameObjects.Image;
  /** 비네트 중심 (스프라이트가 없을 때 — 화면 좌표) */
  focus?: { x: number; y: number };
  /** 팝업 본문 추가 줄 (사망 페널티 안내 등) */
  detail?: string;
  /** 버튼을 눌렀을 때 — 여기서 기상·부활 처리를 한다 */
  onConfirm: () => void;
}

const TITLE: Record<CollapseKind, string> = {
  faint: '기절했습니다!',
  death: '사망했습니다!',
};
const BUTTON: Record<CollapseKind, string> = {
  faint: '일으키기',
  death: '집에서 부활하기',
};
const ACCENT: Record<CollapseKind, number> = {
  faint: 0xffcc44,
  death: 0xe04b3a,
};

/** 비네트 텍스처 한 변(px) — 중심 투명 반경 ≈ 92px, 가장자리에서 완전 불투명 */
const VIGNETTE_PX = 512;

/** 방사형 그라데이션 텍스처를 1회 생성(게임 레벨 캐시 — 씬 재시작에도 유지) */
function ensureVignetteTexture(scene: Phaser.Scene): string {
  const key = 'collapse_vignette';
  if (scene.textures.exists(key)) return key;
  const size = VIGNETTE_PX;
  const canvas = scene.textures.createCanvas(key, size, size);
  const ctx = canvas?.getContext();
  if (!ctx || !canvas) return key;
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.36, 'rgba(0,0,0,0)');     // 캐릭터가 보이는 구멍 (≈92px)
  grad.addColorStop(0.62, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
  return key;
}

/**
 * 연출 재생. 반환 함수를 호출하면 오버레이를 즉시 걷는다(씬 종료·전환 대비).
 * 오버레이가 떠 있는 동안 아래 입력은 전면 차단된다(딤이 흡수).
 */
export function playCollapse(
  scene: Phaser.Scene,
  kind: CollapseKind,
  opts: CollapseOptions,
): () => void {
  const t = TUNING.collapse;
  const cam = scene.cameras.main;
  const focus = opts.focus ?? (opts.sprite
    ? { x: (opts.sprite.x - cam.scrollX), y: (opts.sprite.y - cam.scrollY) }
    : { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });

  // ── 눕기 (전용 에셋 전 플레이스홀더 — 90° 회전 + 호흡) ──
  const spr = opts.sprite;
  const prevAngle = spr?.angle ?? 0;
  const prevOriginY = spr?.originY ?? 1;
  let breath: Phaser.Tweens.Tween | undefined;
  if (spr) {
    spr.setOrigin(0.5, 0.5);
    scene.tweens.add({ targets: spr, angle: prevAngle - 90, duration: 260, ease: 'Quad.easeOut' });
    breath = scene.tweens.add({
      targets: spr, scaleY: spr.scaleY * 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(1180);

  // ── 비네트 암전 — 캐릭터 주변 원형만 남긴다 ──
  // Graphics로는 채운 사각형에 구멍을 뚫을 수 없고, ERASE 블렌드는 게임 화면까지 지운다.
  // → **방사형 그라데이션 텍스처 1장**(중심 투명 → 가장자리 불투명)을 초점에 얹고,
  //   그 사각 범위 밖은 검은 사각 4장으로 마저 덮는다.
  const texKey = ensureVignetteTexture(scene);
  const vig = scene.add.image(focus.x, focus.y, texKey)
    .setDisplaySize(VIGNETTE_PX, VIGNETTE_PX).setScrollFactor(0).setAlpha(0);
  c.add(vig);

  const half = VIGNETTE_PX / 2;
  const rects = [
    scene.add.rectangle(0, 0, GAME_WIDTH, Math.max(0, focus.y - half), 0x000000, 1).setOrigin(0, 0),
    scene.add.rectangle(0, focus.y + half, GAME_WIDTH, Math.max(0, GAME_HEIGHT - (focus.y + half)), 0x000000, 1).setOrigin(0, 0),
    scene.add.rectangle(0, focus.y - half, Math.max(0, focus.x - half), VIGNETTE_PX, 0x000000, 1).setOrigin(0, 0),
    scene.add.rectangle(focus.x + half, focus.y - half, Math.max(0, GAME_WIDTH - (focus.x + half)), VIGNETTE_PX, 0x000000, 1).setOrigin(0, 0),
  ];
  rects.forEach((r) => { r.setScrollFactor(0).setAlpha(0); c.add(r); });

  const state = { a: 0 };
  scene.tweens.add({
    targets: state, a: 0.86, duration: t.dimMs, ease: 'Quad.easeIn',
    onUpdate: () => {
      vig.setAlpha(state.a);
      rects.forEach((r) => r.setAlpha(state.a));
    },
  });

  // 아래 입력 차단 — 팝업이 뜨기 전에도 조작이 먹으면 안 된다
  const blocker = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001)
    .setScrollFactor(0).setInteractive();
  c.add(blocker);

  let popup: Phaser.GameObjects.Container | undefined;
  const popupTimer = scene.time.delayedCall(t.popupDelayMs, () => {
    popup = buildPopup(scene, kind, opts, () => { cleanup(); opts.onConfirm(); });
    c.add(popup);
    applyScreenFixed(c);
  });

  applyScreenFixed(c);

  const cleanup = (): void => {
    popupTimer.remove(false);
    breath?.remove();
    if (spr) {
      spr.setAngle(prevAngle);
      spr.setOrigin(0.5, prevOriginY);
      spr.setScale(1);
    }
    c.destroy();
  };
  return cleanup;
}

/** 팝업 — 제목 + (선택)상세 + 버튼 하나. 흐름 배치(고정 y 금지 — 119차 규칙) */
function buildPopup(
  scene: Phaser.Scene,
  kind: CollapseKind,
  opts: CollapseOptions,
  onConfirm: () => void,
): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0).setScrollFactor(0);
  const g = scene.add.graphics().setScrollFactor(0);
  c.add(g);

  const padX = 24, padY = 18, maxW = 320;
  const title = scene.add.text(padX, padY, TITLE[kind], {
    fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#f2f8ff', fontStyle: 'bold',
  }).setScrollFactor(0);
  c.add(title);
  let y = title.y + title.height + 10;
  if (opts.detail) {
    const d = scene.add.text(padX, y, opts.detail, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#cfe3f2',
      wordWrap: { width: maxW }, lineSpacing: 4,
    }).setScrollFactor(0);
    c.add(d);
    y = d.y + d.height + 12;
  }

  const bw = Math.max(160, maxW * 0.6), bh = 34;
  const btnBg = scene.add.rectangle(padX, y, bw, bh, ACCENT[kind], 0.9).setOrigin(0, 0).setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  const btnT = scene.add.text(padX + bw / 2, y + bh / 2, BUTTON[kind], {
    fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#0d1420', fontStyle: 'bold',
  }).setOrigin(0.5).setScrollFactor(0);
  btnBg.on('pointerover', () => btnBg.setAlpha(1));
  btnBg.on('pointerout', () => btnBg.setAlpha(0.9));
  btnBg.on('pointerdown', onConfirm);
  c.add([btnBg, btnT]);

  const w = padX * 2 + Math.max(title.width, bw, opts.detail ? maxW : 0);
  const h = y + bh + padY;
  g.fillStyle(0x06101e, 0.97);
  g.fillRoundedRect(0, 0, w, h, 8);
  g.lineStyle(2, ACCENT[kind], 0.95);
  g.strokeRoundedRect(0, 0, w, h, 8);
  c.setSize(w, h);
  c.setPosition(Math.round((GAME_WIDTH - w) / 2), Math.round((GAME_HEIGHT - h) / 2));
  return c;
}
