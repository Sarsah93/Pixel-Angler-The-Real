/**
 * @file ItemIcon.ts
 * @description 아이템 아이콘 렌더 헬퍼
 *
 * 우선순위: ① 실사 · 도트 텍스처 키(사용자가 넣은 그림 — 언제나 먼저) · 작물 초상(`px:crop_*` → `cropimg_` · `cropicon_` — 241 · 244)
 *  ② 코드로 그린 아이템 그림(`ItemArtManifest` — **아이템 id** 로 찾는다. 세이브에 `iconTexture`가 없어도 나온다)
 *  ③ `iconTexture: 'px:<키>'` = 16x16 손그림 픽셀 아이콘 ④ 어획물 speciesId 폴백 ⑤ 레거시 이모지 문자열.
 * ⚠ ⑤는 구 아이템이 남겨둔 폴백일 뿐이다 — **새 아이템에는 이모지를 넣지 않는다**(AGENTS §4).
 * (인벤토리 소켓 / 상점 셀 / 퀵슬롯 / 상세보기 공용)
 */

import Phaser from 'phaser';
import { addPixelIcon } from './PixelIcon.js';
import { fitFishTexture, resolveFishTexture } from '../data/FishTextures.js';
import { ITEM_ART_BY_ID, ITEM_ART_BY_PREFIX, ITEM_ART_BY_PX } from '../data/ItemArtManifest.js';

/**
 * 구세이브·기존 카탈로그가 가진 픽셀 아이콘 키를 실제 투명 PNG 자산으로
 * 단계적으로 치환한다. 키를 여기서 해석하므로 모든 인벤토리/상점/상세보기
 * 렌더러가 같은 자산을 공유하고, 구세이브의 `px:it_*` 값도 깨지지 않는다.
 */
const RASTER_ICON_ALIASES: Record<string, string> = {
  'px:it_rod': 'item_spinning_rod',
  'px:it_reel': 'item_spinning_reel',
  'px:it_jighead': 'item_jighead',
  'px:it_worm': 'item_worm',
  'px:it_minnow': 'item_minnow',
  'px:it_metal_jig': 'item_metal_jig',
};

export interface ItemIconLike {
  /** 아이템 id — 코드로 그린 그림(`ItemArtManifest`)을 찾는 열쇠. 없으면 `iconTexture`만으로 해석한다 */
  id?: string;
  /** 레거시 이모지 아이콘 (최후 폴백 — 신규 아이템은 쓰지 않는다) */
  icon: string;
  /** 텍스처 키. `px:` 접두사면 픽셀 아이콘 아트 키 (예: 'px:it_bandage') */
  iconTexture?: string;
  /** 194차 — 무게추·타이라바 헤드 자중(g). 같은 그림을 무게에 맞춰 키우고 줄이는 데 쓴다 */
  sinkerWeightG?: number;
  /** 어획물 어종 ID — iconTexture가 비었을 때 텍스처 폴백 해소용 */
  speciesId?: string;
  /** 개체 체장 (돌돔 암수 분기 등 텍스처 해소용) */
  lengthCm?: number;
  /** 채비 아이콘 내부에 표시할 호수/부력 라벨용 이름 */
  name?: string;
}

/**
 * 아이콘 게임오브젝트 생성 — 이미지 우선, 없으면 이모지 텍스트.
 * sizePx는 정사각 기준 표시 크기 (이미지는 종횡비 유지 fit).
 *
 * iconTexture가 비어 있거나 로드되지 않았어도, 어획물이면 speciesId로 텍스처를
 * 폴백 해소한다 (텍스처 배선 전에 낚은 구세이브 어획물도 이미지로 표시).
 */
/**
 * 194차 — 무게별 라인업이 **한 그림**을 쓰는 아이템의 크기 배율(사용자 지시: 사이즈별 별도 이미지 없이 비율로).
 * 타이라바 헤드: 부피 ∝ 무게라 지름 ∝ 무게^(1/3) — 200g = 1.0 · 40g ≈ 0.58. 무게가 없으면 이름의 「NNg」로 읽는다.
 */
const WEIGHT_SCALED_ICONS: Record<string, number> = { tairaba_head_red: 200 };
export function iconWeightScale(item: ItemIconLike): number {
  const ref = item.iconTexture ? WEIGHT_SCALED_ICONS[item.iconTexture] : undefined;
  if (!ref) return 1;
  const g = item.sinkerWeightG ?? Number(item.name?.match(/(\d+)\s*g/)?.[1] ?? NaN);
  if (!Number.isFinite(g) || g <= 0) return 1;
  return Math.max(0.55, Math.min(1, Math.cbrt(g / ref)));
}

/**
 * 241차 — 작물 초상(사진 → 도트 · `public/crops/`)이 있으면 16px 손그림(`px:crop_*`) 대신 그것을 쓴다.
 *  칸(≤ 72px)은 64px 아이콘 판(`cropicon_*` — 면적 평균이라 축소 떨림이 없다), 상세 · 도감은 초상(`cropimg_*`).
 *  244차 — `cropimg_*`는 상세 창 칸(228×90)에 맞춘 카드 판(`crops/<id>_card.png`)이다. 셀 6px 원본은 싣지 않는다.
 *  어종 에셋과 같은 출처 한 장에서 두 크기를 내므로 가방과 상세가 같은 그림을 보인다.
 */
export function cropPortraitTexture(scene: Phaser.Scene, iconTexture: string | undefined, sizePx: number): string | undefined {
  if (!iconTexture?.startsWith('px:crop_')) return undefined;
  const id = iconTexture.slice(3);
  const key = sizePx > 72 ? `cropimg_${id}` : `cropicon_${id}`;
  if (scene.textures.exists(key)) return key;
  const alt = sizePx > 72 ? `cropicon_${id}` : `cropimg_${id}`;
  return scene.textures.exists(alt) ? alt : undefined;
}

/**
 * 코드로 그린 아이템 그림의 텍스처 키(없으면 undefined).
 * 사용자가 넣은 실사 · 도트(`px:` 가 아닌 텍스처 키)가 있으면 건드리지 않는다 — 그쪽이 언제나 먼저다.
 * 찾는 순서: 아이템 id → id 접두사(뒤에 번호 · 어종이 붙는 것) → 16x16 아이콘 키의 대체 그림.
 * 세이브에 든 옛 아이템(`iconTexture` 없음 · 이모지뿐 · `px:` 키)도 id 로 그림을 찾는다.
 */
export function itemArtKeyOf(item: { id?: string; iconTexture?: string }): string | undefined {
  const t = item.iconTexture;
  if (t && !t.startsWith('px:')) return undefined;
  if (item.id) {
    const byId = ITEM_ART_BY_ID[item.id];
    if (byId) return byId;
    for (const [prefix, key] of ITEM_ART_BY_PREFIX) if (item.id.startsWith(prefix)) return key;
  }
  return t ? ITEM_ART_BY_PX[t] : undefined;
}

export function createItemIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  item: ItemIconLike,
  sizePx: number,
): Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Container {
  sizePx *= iconWeightScale(item);
  // 241차 작물 초상이 코드로 그린 그림보다 먼저다(사진 → 도트 · Gemini 변환본). 그다음 코드 그림 · 원래 텍스처 키
  const portrait = cropPortraitTexture(scene, item.iconTexture, sizePx);
  const artKey = portrait ? undefined : itemArtKeyOf(item);
  const rasterKey = portrait
    ?? (artKey && scene.textures.exists(artKey) ? artKey : undefined)
    ?? (item.iconTexture ? RASTER_ICON_ALIASES[item.iconTexture] ?? item.iconTexture : undefined);
  if (rasterKey && scene.textures.exists(rasterKey)) {
    // 246차 — 어종 그림은 칸(≤ 72px)이면 64px 아이콘 판, 크면 카드 판(fitFishTexture — 다른 텍스처는 그대로 맞춘다)
    const fit = fitFishTexture(scene.textures, rasterKey, sizePx, sizePx);
    const img = scene.add.image(0, 0, fit.key).setOrigin(0.5);
    img.setDisplaySize(fit.w, fit.h);
    // 166차 — 제로찌(`float_zero`)는 도트에 '00'이 각인돼 있어 라벨을 겹치지 않는다
    const labelKeys = new Set(['float_hole', 'float_tilt', 'subfloat_light', 'subfloat_heavy']);
    if (item.iconTexture && labelKeys.has(item.iconTexture) && item.name) {
      const label = item.name.match(/0{1,3}|G\d+|[-+]?\d+(?:\.\d+)?B?|[-+]?\d+(?:\.\d+)?호/)?.[0]?.replace('호', '');
      if (label) {
        const c = scene.add.container(x, y);
        c.add(img);
        c.add(scene.add.text(0, 1, label, {
          fontFamily: 'monospace', fontSize: `${Math.max(7, Math.round(sizePx * 0.28))}px`,
          color: '#17202a', fontStyle: 'bold', stroke: '#f6e8ba', strokeThickness: 1,
        }).setOrigin(0.5));
        return c;
      }
    }
    img.setPosition(x, y);
    return img;
  }
  // 129차 — `px:<키>` 는 16x16 손그림 픽셀 아이콘(PixelIconArt). 신규 아이템은 이모지 대신 이걸 쓴다(§4).
  if (item.iconTexture?.startsWith('px:')) {
    const key = item.iconTexture.slice(3);
    const img = addPixelIcon(scene, key, x, y, sizePx);
    if (img) return img;
  }
  let texKey = item.iconTexture && scene.textures.exists(item.iconTexture) ? item.iconTexture : undefined;
  if (!texKey && item.speciesId) {
    const resolved = resolveFishTexture(item.speciesId, item.lengthCm ?? 0, 'F');
    if (resolved && scene.textures.exists(resolved)) texKey = resolved;
    // 224차 — 사진이 없는 채집물은 필드 도트(`forage_dot_<id>`)로(이모지 대신)
    else if (scene.textures.exists(`forage_dot_${item.speciesId}`)) texKey = `forage_dot_${item.speciesId}`;
  }
  if (texKey) {
    const fit = fitFishTexture(scene.textures, texKey, sizePx, sizePx);
    return scene.add.image(x, y, fit.key).setOrigin(0.5).setDisplaySize(fit.w, fit.h);
  }
  return scene.add.text(x, y, item.icon, { fontSize: `${Math.round(sizePx * 0.85)}px` }).setOrigin(0.5);
}
