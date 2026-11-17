/**
 * @file TrimPartIcons.ts
 * @description 327차 — 손질 부산물(머리 · 척추뼈) 아이콘 고르기 · 굽기
 *
 * 사용자 리포트(2026-11-17): 「긴꼬리벵에돔 손질하고 나니까, 머리 이미지가 없네?」
 *  옛 머리 아이콘(`trimhead_<어종>`)은 손질 창이 어종군 사진(감성돔 · 잿방어)에 색을 입혀 **그 자리에서 구운 텍스처**였다.
 *  아이템에는 그 키만 저장되고, 게임을 다시 켜면 텍스처가 없어 아이콘이 비었다(그 어종을 다시 손질할 때까지).
 *
 * 고르는 차례:
 *  ① 어종 그림(Gemini — `trimpart_<종류>_<어종>` · `TrimPartArt` 목록 · BootScene이 싣는다)
 *  ② 머리 = **그 어종 도마 그림에서 머리 절단선대로 오려 낸 것**(`trimhead_<어종>` — 도마에서 떨어져 나간 바로 그 조각.
 *     절단선은 손질 창과 같은 단계 좌표라 F9 확정을 그대로 따른다) · 어종군 사진의 원래 어종(감성돔 · 잿방어 · 광어)은 그 사진
 *  ③ 어종군 사진(`trim_head_<군>` · `trim_spine_<군>`)
 * 굽는 텍스처는 `ensureTrimPartTexture`가 아이콘을 그릴 때 되살린다 — 세이브에 남은 옛 키도 같은 이름으로 다시 굽는다.
 * 아이콘 자리(`ItemIcon`)는 저장된 키보다 「부산물 종류 + 어종」을 먼저 본다 — 옛 세이브의 머리 · 뼈도 새 그림으로 보인다.
 */
import Phaser from 'phaser';
import { ButcheryProcess, butcheryProfileFor } from '@tra/core';
import {
  butcherSpritesFor, butcherFamilyOf, butcherGuideFrame, computeFishFrame, prepEraseFor, fishPolyContains, tintColor,
  SPRITE_PALETTE_CHARS, BUTCHER_FISH_W0, BUTCHER_FISH_H0, type PixelFishState,
} from './PixelButcherFish.js';
import { getFishColors } from './FishTemplateRenderer.js';
import { TRIM_PART_ART, TRIM_PART_ALIAS, type TrimPartKind } from '../data/TrimPartArt.js';
import { canvasContextOf, destroyCanvasTexture, refreshCanvasTexture, sourceImageOf } from './CanvasTextureGuard.js';

/** 어종군 사진이 바로 그 어종인 것 — 오려 내지 않고 사진을 쓴다 */
const NATIVE_HEAD: Readonly<Record<string, string>> = {
  black_seabream: 'trim_head_bream', greater_amberjack: 'trim_head_amberjack', flatfish: 'trim_head_halibut',
};
const CUT_PREFIX = 'trimhead_';
const ART_PREFIX = 'trimpart_';
/** 오려 내지 못한 어종(그림 · 칼선이 어긋남) — 아이콘을 그릴 때마다 다시 시도하지 않는다 */
const cutFailed = new Set<string>();

/** 어종 그림 텍스처 키(부트에서 실은 것) — 없으면 undefined */
export function trimPartArtKey(scene: Phaser.Scene, speciesId: string, kind: TrimPartKind): string | undefined {
  const id = TRIM_PART_ALIAS[speciesId] ?? speciesId;
  if (!TRIM_PART_ART[id]?.includes(kind)) return undefined;
  const key = `${ART_PREFIX}${kind}_${id}`;
  return scene.textures.exists(key) ? key : undefined;
}

/** 부트 로드 목록 — [텍스처 키, 경로] */
export function trimPartArtFiles(): [string, string][] {
  const out: [string, string][] = [];
  for (const [id, kinds] of Object.entries(TRIM_PART_ART)) for (const k of kinds) out.push([`${ART_PREFIX}${k}_${id}`, `trimmings/sp/${k}_${id}.png`]);
  return out;
}

/** 그 어종의 머리 절단선(앞면) — 그려진 생선 그림 rect 정규화. 단계가 없으면 undefined(머리 비율 근사로 지운다) */
function headCutPathOf(speciesId: string): { path?: { x: number; y: number }[]; sprites: ReturnType<typeof butcherSpritesFor> } {
  const sprites = butcherSpritesFor(speciesId);
  try {
    const profile = butcheryProfileFor(speciesId);
    const process = new ButcheryProcess(profile, 1, { guideFrame: butcherGuideFrame(speciesId, undefined, BUTCHER_FISH_W0, BUTCHER_FISH_H0) });
    const id = profile.bodyShape === 'flat' ? 'flat_head_scut' : 'head_base';
    const guide = process.stageList.find((s) => s.id === id)?.cut?.guidePath;
    if (!guide?.length) return { sprites };
    const geom = { x: 0, y: 0, w: BUTCHER_FISH_W0, h: BUTCHER_FISH_H0 };
    const f = computeFishFrame(sprites.whole, geom);
    return { sprites, path: guide.map((p) => ({ x: (p.x * geom.w - f.ox) / f.dw, y: (p.y * geom.h - f.oy) / f.dh })) };
  } catch {
    return { sprites };
  }
}

/**
 * 그 어종 도마 그림에서 머리 절단선 앞쪽을 오려 내 굽는다(`outKey` — 기본 `trimhead_<어종>`). 구웠거나 이미 있으면 키.
 * 잘린 가장자리 두 칸은 살빛으로 칠한다(단면). 떨어진 부스러기(지느러미 끝)는 버린다.
 */
export function ensureCutHead(scene: Phaser.Scene, speciesId: string, outKey = `${CUT_PREFIX}${speciesId}`): string | undefined {
  const tm = scene.textures;
  if (tm.exists(outKey)) return outKey;
  if (cutFailed.has(speciesId)) return undefined;
  const { path, sprites } = headCutPathOf(speciesId);
  const spr = sprites.whole;
  const state = { orientation: 'BASE', headOff: true, headCutPath: path, finsOff: false } as unknown as PixelFishState;
  const erase = prepEraseFor(sprites, state, 'BASE');
  const W = spr.w, H = spr.h;
  const solid = (c: number, r: number): boolean => c >= 0 && r >= 0 && c < W && r < H && spr.rows[r][c] !== '.';
  const inHead = new Uint8Array(W * H);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (solid(c, r) && erase.some((poly) => fishPolyContains((c + 0.5) / W, (r + 0.5) / H, poly))) inHead[r * W + c] = 1;
  }
  // 가장 큰 덩어리(+ 그 8% 넘는 덩어리)만 남긴다
  const lab = new Int32Array(W * H).fill(-1);
  const sizes: number[] = [];
  for (let s0 = 0; s0 < W * H; s0++) {
    if (!inHead[s0] || lab[s0] >= 0) continue;
    const id = sizes.length;
    const st = [s0]; lab[s0] = id; let n = 0;
    while (st.length) {
      const i = st.pop() as number; n++;
      const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j >= 0 && inHead[j] && lab[j] < 0) { lab[j] = id; st.push(j); }
      }
    }
    sizes.push(n);
  }
  const big = Math.max(0, ...sizes);
  if (big < 12) { cutFailed.add(speciesId); return undefined; }   // 머리라 할 것이 없다(그림 · 절단선이 어긋남) → 어종군 사진으로
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < W * H; i++) {
    if (lab[i] < 0 || sizes[lab[i]] < big * 0.08) { inHead[i] = 0; continue; }
    const x = i % W, y = (i / W) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const cell = Math.max(1, Math.min(6, Math.floor(192 / Math.max(bw, bh))));
  const cv = tm.createCanvas(outKey, bw * cell, bh * cell);
  if (!cv) return undefined;
  const ctx = canvasContextOf(cv);
  if (!ctx) { destroyCanvasTexture(cv); return undefined; }
  // 어종 그림이 없어 어종군 그림을 쓰는 어종은 도마와 같이 어종 색을 약하게 입힌다
  const tint = sprites.wholeNative || sprites.nativeColor ? null : getFishColors(speciesId).body;
  const pal = spr.palette.map((c) => (tint !== null ? tintColor(c, tint, 0.22) : c));
  const css = (c: number): string => `#${(c & 0xffffff).toString(16).padStart(6, '0')}`;
  /** 몸통(머리가 아닌 살)과 맞닿은 칸까지의 거리 — 1 = 바로 옆 · 2 = 한 칸 건너 */
  const cutDist = (c: number, r: number): number => {
    for (let d = 1; d <= 2; d++) {
      for (const [dx, dy] of [[d, 0], [0, d], [0, -d], [-d, 0]] as const) {
        const cc = c + dx, rr = r + dy;
        if (solid(cc, rr) && !inHead[rr * W + cc] && !erase.some((poly) => fishPolyContains((cc + 0.5) / W, (rr + 0.5) / H, poly))) return d;
      }
    }
    return 0;
  };
  try {
    ctx.clearRect(0, 0, bw * cell, bh * cell);
    for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) {
      if (!inHead[r * W + c]) continue;
      const d = cutDist(c, r);
      ctx.fillStyle = d === 1 ? '#8f3a3c' : d === 2 ? '#d98a82' : css(pal[SPRITE_PALETTE_CHARS.indexOf(spr.rows[r][c])] ?? 0);
      ctx.fillRect((c - x0) * cell, (r - y0) * cell, cell, cell);
    }
  } catch { destroyCanvasTexture(cv); return undefined; }
  if (!refreshCanvasTexture(cv, `손질 머리 ${outKey}`)) { destroyCanvasTexture(cv); return undefined; }
  return outKey;
}

/** 머리 아이콘 키 — 어종 그림 → (원래 어종이면 사진) → 오려 낸 머리 → 어종군 사진 */
export function trimHeadIconKey(scene: Phaser.Scene, speciesId: string): string {
  const fam = butcherFamilyOf(speciesId);
  return trimPartArtKey(scene, speciesId, 'head')
    ?? NATIVE_HEAD[speciesId]
    ?? ensureCutHead(scene, speciesId)
    ?? `trim_head_${fam}`;
}

/** 척추뼈 아이콘 키 — 어종 그림 → 어종군 사진 */
export function trimSpineIconKey(scene: Phaser.Scene, speciesId: string): string {
  return trimPartArtKey(scene, speciesId, 'spine') ?? `trim_spine_${butcherFamilyOf(speciesId)}`;
}

/**
 * 어종 필렛 그림이 없는 어종의 순수 필렛 아이콘 — 어종군 로인 사진에 어종 색을 약하게 입혀 굽는다.
 * 키가 곧 처방이다: `trimfillet_<몸 색 16진>`(돔류 필렛) · `trimfillet_aj_<몸 색 16진>`(잿방어 로인) — 키만으로 다시 굽는다.
 */
export function ensureTintedFillet(scene: Phaser.Scene, key: string): boolean {
  const tm = scene.textures;
  if (tm.exists(key)) return true;
  const m = /^trimfillet_(aj_)?([0-9a-f]{1,6})$/.exec(key);
  if (!m) return false;
  const baseKey = m[1] ? 'trim_fillet_amberjack' : 'trim_fillet_bream';
  if (!tm.exists(baseKey)) return false;
  const src = sourceImageOf(scene, baseKey) as HTMLImageElement | HTMLCanvasElement | null;
  if (!src || !src.width || !src.height) return false;
  const body = parseInt(m[2], 16);
  const mix = (sh: number): number => Math.round(255 * (1 - 0.26) + ((body >> sh) & 255) * 0.26);   // 흰색에 몸 색 26%
  const scale = 200 / Math.max(src.width, src.height);   // 아이콘용 축소
  const w = Math.max(1, Math.round(src.width * scale)), h = Math.max(1, Math.round(src.height * scale));
  const cv = tm.createCanvas(key, w, h);
  if (!cv) return false;
  const ctx = canvasContextOf(cv);
  if (!ctx) { destroyCanvasTexture(cv); return false; }
  try {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(src, 0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${mix(16)},${mix(8)},${mix(0)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';   // 원본 알파로 다시 오린다(배경 투명)
    ctx.drawImage(src, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } catch { destroyCanvasTexture(cv); return false; }
  if (!refreshCanvasTexture(cv, `손질 아이콘 ${key}`)) { destroyCanvasTexture(cv); return false; }
  return true;
}

/**
 * 세이브에 남은 굽는 키가 아직 없으면 다시 굽는다 — 오려 낸 머리(`trimhead_<어종>`) · 색 입힌 필렛(`trimfillet_*`).
 * 이 모듈의 키가 아니면 false.
 */
export function ensureTrimPartTexture(scene: Phaser.Scene, key: string | undefined): boolean {
  if (!key) return false;
  if (key.startsWith('trimfillet_')) return ensureTintedFillet(scene, key);
  if (!key.startsWith(CUT_PREFIX)) return false;
  if (scene.textures.exists(key)) return true;
  return !!ensureCutHead(scene, key.slice(CUT_PREFIX.length), key);
}

/**
 * 아이콘 자리에서 — 머리 · 척추뼈 부산물이면 「종류 + 어종」으로 지금 쓸 그림 키를 다시 고른다(옛 세이브의 키를 새 그림으로).
 * 장어 · 해체 결과물처럼 제 굽는 그림이 있는 것(`trim_eel_*` · `trimloin_*`)과 다른 아이템은 건드리지 않는다(undefined).
 */
export function trimPartIconOverride(
  scene: Phaser.Scene, item: { iconTexture?: string; speciesId?: string; byproductKind?: string },
): string | undefined {
  const k = item.byproductKind;
  if ((k !== 'head' && k !== 'spine') || !item.speciesId) return undefined;
  const cur = item.iconTexture ?? '';
  if (cur.startsWith('trim_eel_') || cur.startsWith('trimloin_')) return undefined;
  const key = k === 'head' ? trimHeadIconKey(scene, item.speciesId) : trimSpineIconKey(scene, item.speciesId);
  return scene.textures.exists(key) ? key : undefined;
}
