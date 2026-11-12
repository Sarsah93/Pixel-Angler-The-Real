/**
 * @file SashimiSpeciesArt.ts
 * @description 316차 — 어종별 회썰기 필렛 그림(탑뷰 · 측면 · 한 점) 싣기.
 *
 * 그림 = `public/sashimi/sp/<어종>_{top,side,piece}.png`(`node tools/gen_sashimi_fillet.cjs --species` — Gemini 어종 필렛에서 굽는다).
 *  - 한 점(piece)은 부팅에 싣는다(작다 — 회 조각 아이템 아이콘이 세이브에 남아 다시 불러온 뒤에도 그려야 한다).
 *  - 탑뷰 · 측면(장당 약 80KB)은 **회썰기 창을 열 때 그 어종 것만** 싣는다(`ensureSashimiSpeciesArt`).
 *    못 실으면(오프라인 · 시간 초과) 어종군 공용 그림으로 연다 — 창은 언제나 열린다.
 */
import Phaser from 'phaser';
import { SASHIMI_SPECIES_PROFILES } from '../data/SashimiSpeciesProfiles.js';
import { FILLET_SPECIES_ALIAS } from '../data/PixelFilletSpecies.js';

export type SashimiArtView = 'top' | 'side' | 'piece';

/** 이 어종의 회썰기 그림 키(같은 생물종은 그 어종) — 그림이 없으면 undefined */
export function sashimiSpeciesOf(speciesId: string | undefined): string | undefined {
  if (!speciesId) return undefined;
  const sp = FILLET_SPECIES_ALIAS[speciesId] ?? speciesId;
  return SASHIMI_SPECIES_PROFILES[sp] ? sp : undefined;
}

/** 텍스처 키 */
export const sashimiSpeciesTex = (sp: string, view: SashimiArtView): string => `sashimi_sp_${view}_${sp}`;

/** 회 조각 아이콘 키 — 그 어종 그림이 실려 있으면 */
export function sashimiSpeciesPieceKey(scene: Phaser.Scene, speciesId: string | undefined): string | undefined {
  const sp = sashimiSpeciesOf(speciesId);
  const key = sp ? sashimiSpeciesTex(sp, 'piece') : undefined;
  return key && scene.textures.exists(key) ? key : undefined;
}

/** 부팅 — 한 점 그림만(어종 24 × 약 3KB) */
export function preloadSashimiSpeciesPieces(load: Phaser.Loader.LoaderPlugin): void {
  for (const sp of Object.keys(SASHIMI_SPECIES_PROFILES)) {
    load.image(sashimiSpeciesTex(sp, 'piece'), `sashimi/sp/${sp}_piece.png`);
  }
}

/**
 * 회썰기 창을 열기 전에 그 어종의 탑뷰 · 측면 그림을 싣는다.
 * 다 실리면 어종 키, 그림이 없거나 못 실으면 undefined(어종군 공용 그림으로 연다). 최대 `timeoutMs` 기다린다.
 */
export function ensureSashimiSpeciesArt(scene: Phaser.Scene, speciesId: string | undefined, timeoutMs = 6000): Promise<string | undefined> {
  const sp = sashimiSpeciesOf(speciesId);
  if (!sp) return Promise.resolve(undefined);
  const keys = (['top', 'side'] as const).map((v) => [v, sashimiSpeciesTex(sp, v)] as const);
  const ready = (): boolean => keys.every(([, k]) => scene.textures.exists(k));
  if (ready()) return Promise.resolve(sp);
  return new Promise((resolve) => {
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      scene.load.off(Phaser.Loader.Events.COMPLETE, finish);
      resolve(ready() ? sp : undefined);
    };
    for (const [v, k] of keys) if (!scene.textures.exists(k)) scene.load.image(k, `sashimi/sp/${sp}_${v}.png`);
    scene.load.once(Phaser.Loader.Events.COMPLETE, finish);
    scene.time.delayedCall(timeoutMs, finish);
    setTimeout(finish, timeoutMs + 500);   // 씬 시계가 멈춰 있어도(일시정지 · 헤드리스) 언젠가는 연다
    if (!scene.load.isLoading()) scene.load.start();
  });
}
