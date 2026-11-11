/**
 * @file FilletSpeciesIcons.ts
 * @description 316차 — 어종 필렛 그림 아이콘(가방 칸 · 부산물 팝업 · 결과 창).
 *
 * 그림 원본은 도마 스프라이트(`PixelFilletSpecies` — Gemini 그림을 긴 변 128칸으로 구운 것)다.
 * 아이콘 PNG를 따로 싣지 않고 그 스프라이트를 캔버스 텍스처로 굽는다(셀 2px) — 어종 27 × 3장을 부팅에 싣지 않는다.
 * 텍스처 키(`trimsp_<종류>_<어종>`)는 아이템 `iconTexture`로 세이브에 남는다 — 다시 불러온 뒤 처음 그릴 때
 * `ensureTrimTexture`가 다시 굽는다(`ItemIcon.createItemIcon`). 315 장어 결과물(`trim_eel_*`)도 같은 길로 되살린다.
 */
import Phaser from 'phaser';
import { speciesFilletSprite, type SpeciesFilletKind } from './PixelButcherFish.js';
import { ensureEelTrimTexture } from './EelBoard.js';
import { FILLET_SPECIES_ALIAS } from '../data/PixelFilletSpecies.js';
import type { PixelFishSprite } from '../data/PixelFishSprites.js';

const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
const PREFIX = 'trimsp_';

/** 스프라이트 → 캔버스 텍스처(셀 C px · 투명 여백 PAD) */
function bakeSprite(scene: Phaser.Scene, key: string, spr: PixelFishSprite, C = 2, PAD = 2): boolean {
  if (scene.textures.exists(key)) return true;
  const w = spr.w * C + PAD * 2, h = spr.h * C + PAD * 2;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex?.getContext();
  if (!tex || !ctx) return false;
  for (let y = 0; y < spr.h; y++) {
    const row = spr.rows[y];
    for (let x = 0; x < spr.w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      ctx.fillStyle = `#${spr.palette[AB.indexOf(ch)].toString(16).padStart(6, '0')}`;
      ctx.fillRect(PAD + x * C, PAD + y * C, C, C);
    }
  }
  tex.refresh();
  return true;
}

/**
 * 어종 필렛 아이콘 텍스처 키 — 그 어종 그림이 있으면 굽고 키를, 없으면 undefined(부르는 쪽이 어종군 공용 아이콘으로).
 *  pure = 순수 필렛 · skin = 껍질 붙은 필렛 · ribs = 갈빗대 붙은 필렛
 */
export function speciesFilletIconKey(scene: Phaser.Scene, speciesId: string, kind: SpeciesFilletKind): string | undefined {
  const spr = speciesFilletSprite(speciesId, kind);
  if (!spr) return undefined;
  const sp = FILLET_SPECIES_ALIAS[speciesId] ?? speciesId;
  const key = `${PREFIX}${kind}_${sp}`;
  return bakeSprite(scene, key, spr) ? key : undefined;
}

/**
 * 세이브에 남은 굽는 텍스처 키(`trimsp_*` · `trim_eel_*`)가 아직 없으면 다시 굽는다 — 있으면(또는 구웠으면) true.
 * 다른 키는 건드리지 않는다(false).
 */
export function ensureTrimTexture(scene: Phaser.Scene, key: string | undefined): boolean {
  if (!key) return false;
  if (scene.textures.exists(key)) return true;
  if (key.startsWith(PREFIX)) {
    const m = /^trimsp_(pure|skin|ribs)_(.+)$/.exec(key);
    return !!(m && speciesFilletIconKey(scene, m[2], m[1] as SpeciesFilletKind));
  }
  if (key.startsWith('trim_eel_')) {
    const m = /^trim_eel_(fillet|head|spine)_(.+)$/.exec(key);
    return !!(m && ensureEelTrimTexture(scene, m[2], m[1] as 'fillet' | 'head' | 'spine'));
  }
  return false;
}
