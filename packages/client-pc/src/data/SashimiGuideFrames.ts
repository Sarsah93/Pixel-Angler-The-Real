/**
 * @file SashimiGuideFrames.ts
 * @description 삼면뜨기 픽셀 가이드 시트 → Phaser 텍스처 프레임 등록 (SASHIMI_PIXEL_GUIDE_SPEC §4-C)
 *
 * 47컷을 개별 PNG로 굽지 않고 **시트 1장(sashimi_pixel_guide.png)을 단일 텍스처로 로드한 뒤
 * 그리드 프레임으로 등록**한다 — 지오메트리는 core SASHIMI_GUIDE_SHEET가 단일 소스.
 * (스펙의 "고유 28컷 + 반복 매핑" 최적화는 개별 파일 굽기 전제 — 시트 프레임 방식은
 *  중복 컷도 비용이 없어 47컷 전부 등록한다. pre9 = p01 별칭도 프레임이라 자동 해결.)
 *
 * 프레임 키: 'sg_pre1'~'sg_pre9' / 'sg_p01'~'sg_p38'.
 */

import Phaser from 'phaser';
import { allGuideCutKeys, guideCutFrameRect } from '@tra/core';

/** 시트 텍스처 키 (BootScene load.image와 일치) */
export const SASHIMI_GUIDE_TEXTURE = 'sashimi_guide_sheet';

/** 컷 키('pre3'|'p07') → 프레임 이름 */
export function guideFrameName(cutKey: string): string {
  return `sg_${cutKey}`;
}

/** 시트 텍스처에 47컷 프레임 일괄 등록 (BootScene create에서 1회) */
export function registerSashimiGuideFrames(scene: Phaser.Scene): void {
  const tex = scene.textures.get(SASHIMI_GUIDE_TEXTURE);
  if (!tex || tex.key === '__MISSING') return;
  for (const key of allGuideCutKeys()) {
    const name = guideFrameName(key);
    if (tex.has(name)) continue;
    const r = guideCutFrameRect(key);
    tex.add(name, 0, r.x, r.y, r.w, r.h);
  }
}

/** 프레임 사용 가능 여부 (시트 로드 + 등록 완료) */
export function hasGuideFrames(scene: Phaser.Scene): boolean {
  const tex = scene.textures.get(SASHIMI_GUIDE_TEXTURE);
  return !!tex && tex.key !== '__MISSING' && tex.has(guideFrameName('pre1'));
}
