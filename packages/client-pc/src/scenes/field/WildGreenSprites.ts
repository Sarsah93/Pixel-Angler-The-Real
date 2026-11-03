/**
 * @file WildGreenSprites.ts
 * @description 299(2)차 — 산나물 포기 텍스처 굽기(`data/WildGreenArt.ts`의 도트를 입자 2px로).
 *
 *  자리 표식(필드) · 놀이 판 · 도감 · 가이드 그림이 전부 이 한 벌(`wildgreen_<생물 id>`)을 쓴다 —
 *  수확한 묶음 그림(작물 아이콘)을 자리에 올려놓지 않는다(사용자 지적 — 「심어져 있는 그림처럼」).
 *  밑동이 그림 아래 가운데라 표식은 `setOrigin(0.5, 1)`로 칸 바닥에 세운다.
 */

import Phaser from 'phaser';
import { SHORE_CREATURE_DATABASE, isWildGreen, type ShoreCreature } from '@tra/core';
import { WILD_GREEN_ART, WILD_GREEN_COMMON, WILD_GREEN_UNIT, type WildGreenGlyph } from '../../data/WildGreenArt.js';

/** 산나물 포기 텍스처 키 */
export function wildGreenTexKey(c: ShoreCreature): string {
  return `wildgreen_${c.id}`;
}

/** 산나물 8종 포기 텍스처를 굽는다(한 번) — 그림이 없는 종은 곰취 틀로 */
export function ensureWildGreenTextures(scene: Phaser.Scene): void {
  const tex = scene.textures;
  for (const c of SHORE_CREATURE_DATABASE) {
    if (!isWildGreen(c)) continue;
    const key = wildGreenTexKey(c);
    if (tex.exists(key)) continue;
    const def = WILD_GREEN_ART[c.id] ?? WILD_GREEN_ART['green_gomchwi'];
    if (!def) continue;
    const u = WILD_GREEN_UNIT;
    const w = def.rows[0]?.length ?? 0, h = def.rows.length;
    if (!w || !h) continue;
    const g = scene.add.graphics();
    for (let r = 0; r < h; r++) {
      const row = def.rows[r] ?? '';
      for (let col = 0; col < w; col++) {
        const ch = row[col] as WildGreenGlyph | undefined;
        if (!ch || ch === '.') continue;
        const color = def.palette[ch as Exclude<WildGreenGlyph, '.'>]
          ?? (ch === 'g' || ch === 'e' ? WILD_GREEN_COMMON[ch] : undefined);
        if (color === undefined) continue;
        g.fillStyle(color, 1);
        g.fillRect(col * u, r * u, u, u);
      }
    }
    g.generateTexture(key, w * u, h * u);
    g.destroy();
  }
}
