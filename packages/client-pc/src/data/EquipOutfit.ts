/**
 * @file EquipOutfit.ts
 * @description 착용 장비 → 캐릭터 외형(CharOutfit) 반영 (151차 — 백로그 O4 해소)
 *
 * 배경: 138차가 **페이퍼돌**(레이어 14종 · `pose()` 앵커 참조)로 캐릭터를 재작성했는데,
 * 정작 인벤토리의 착용 상태를 읽는 곳이 한 군데도 없었다(`refreshCharacterLook` 호출측 0).
 * 모자를 써도 장비창 속 캐릭터는 맨머리였다 — 그 배선을 여기서 잇는다.
 *
 * ⚖ **덮어쓰기지 대체가 아니다.** `GameState.character.outfit`(생성 시 고른 한 벌)은 **기저**로 두고,
 * 실제로 착용한 부위만 그 위에 덮는다. 장비를 전부 벗으면 생성 때 고른 옷차림으로 돌아갈 뿐
 * 알몸이 되지 않는다(시드 인벤토리의 옷은 기본 미착용이라, 전면 파생으로 만들면 새 캐릭터가 벗고 시작한다).
 *
 * ⚖ **기저는 절대 수정하지 않는다** — 매번 기저에서 다시 덮으므로 여러 번 호출해도 결과가 같다.
 * (기저를 갈아치우면 두 번째 호출부터 "벗은 장비가 안 벗겨지는" 상태가 된다.)
 */

import type { CharConfig, CharOutfit, HatKind, HeldKind, OuterKind, PantsKind, ShirtKind, ShoesKind } from '@tra/core';
import { GameState } from '../store/GameState.js';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';

/** 한 아이템이 캐릭터에 남기는 자국 — 지정한 필드만 기저 위에 덮는다 */
export interface GearLook {
  hat?: HatKind; hatColor?: number;
  shirt?: ShirtKind; shirtColor?: number;
  outer?: OuterKind; outerColor?: number;
  pants?: PantsKind; pantsColor?: number;
  shoes?: ShoesKind; shoesColor?: number;
  gloves?: boolean; glovesColor?: number;
  pack?: boolean; packColor?: number;
  held?: HeldKind;
}

/**
 * 아이템 id → 외형. 이름이 아니라 **id**가 기준이다(표시명은 로케일·개명으로 흔들린다).
 * 등재되지 않은 장비는 아래 `lookByKind`가 부위·이름에서 추론한다.
 */
const ITEM_LOOK: Record<string, GearLook> = {
  // ── 머리 ──
  inv_cap:              { hat: 'cap', hatColor: 0x3d5a80 },
  // ── 상의 ── 조끼는 상의를 대체하는 게 아니라 **위에 걸치는 것**이라 outer로 간다.
  inv_top:              { outer: 'vest', outerColor: 0x5b6637 },
  // ── 하의 ──
  inv_pants:            { pants: 'jeans', pantsColor: 0x2f3a44 },
  // ── 신발 ── 갯바위 단화 = 논슬립 밑창의 낮은 고무화
  inv_shoes:            { shoes: 'rubber', shoesColor: 0x4a4550 },
  // ── 장갑 ──
  inv_gloves:           { gloves: true, glovesColor: 0x4a4550 },
  inv_gloves_work:      { gloves: true, glovesColor: 0xe8e2d4 },
  // ── 가방 (등) ──
  qr_tackle_pouch:      { pack: true, packColor: 0x5e4228 },
  qr_bag_field:         { pack: true, packColor: 0x2f3a44 },
  qr_bag_expedition:    { pack: true, packColor: 0x5b6637 },
  qr_bag_guide:         { pack: true, packColor: 0xc4553f },
  qr_bag_voyage:        { pack: true, packColor: 0x2f8377 },
  inv_bag_mountain:     { pack: true, packColor: 0x3d5a80 },
  inv_bag_tackle_vest:  { pack: true, packColor: 0x8a5a8f, outer: 'vest', outerColor: 0x4a4550 },
  inv_bag_dry:          { pack: true, packColor: 0xc47430 },
  bp_backpack_rough:    { pack: true, packColor: 0x8a6340 },
};

/** 이름에 이 낱말이 있으면 그 종류 — 신규 장비가 등재 전이어도 얼추 맞는 실루엣이 나온다 */
function lookByKind(item: InvItem): GearLook | undefined {
  const n = item.name;
  switch (item.subCategory) {
    case '모자': {
      const hat: HatKind =
        /비니|털모자|니트캡/.test(n) ? 'beanie'
        : /버킷|벙거지|썬캡|차양|사파리/.test(n) ? 'sun'
        : /두건|반다나|스카프/.test(n) ? 'bandana'
        : /바이저/.test(n) ? 'visor'
        : 'cap';
      return { hat };
    }
    case '상의': {
      if (/조끼|베스트/.test(n)) return { outer: 'vest' };
      if (/앞치마/.test(n)) return { outer: 'apron' };
      if (/재킷|자켓|점퍼|파카|우비|바람막이/.test(n)) return { outer: 'jacket' };
      const shirt: ShirtKind =
        /후드/.test(n) ? 'hoodie'
        : /니트|스웨터|맨투맨/.test(n) ? 'knit'
        : /셔츠|남방/.test(n) ? 'shirt'
        : 'tee';
      return { shirt };
    }
    case '하의': {
      const pants: PantsKind =
        /웨이더|가슴장화|멜빵/.test(n) ? 'waders'
        : /반바지|숏/.test(n) ? 'shorts'
        : /치마|스커트/.test(n) ? 'skirt'
        : 'jeans';
      return { pants };
    }
    case '신발': {
      const shoes: ShoesKind =
        /장화|부츠/.test(n) ? 'boots'
        : /갯바위|스파이크|논슬립|고무|펠트/.test(n) ? 'rubber'
        : 'sneakers';
      return { shoes };
    }
    case '장갑': return { gloves: true };
    case '가방': return { pack: true };
    default: return undefined;
  }
}

/** 손 도구 → 손에 쥔 물건. 회칼처럼 그릴 레이어가 없는 도구는 빈손으로 둔다. */
function heldOf(tool: InvItem['tool']): HeldKind | undefined {
  if (tool === 'rod') return 'rod';
  if (tool === 'net') return 'net';
  return undefined;
}

/** 아이템 하나의 외형 자국 (등재 우선 → 부위·이름 추론) */
export function gearLookOf(item: InvItem): GearLook | undefined {
  const held = heldOf(item.tool);
  if (held) return { held };
  return ITEM_LOOK[item.id] ?? lookByKind(item);
}

/** 기저 옷차림 위에 착용 장비를 덮은 결과 (기저는 건드리지 않는다) */
export function outfitWithGear(base: CharOutfit, worn: InvItem[] = InventoryStore.items.filter((i) => i.equipped)): CharOutfit {
  const o: CharOutfit = { ...base };
  for (const item of worn) {
    const g = gearLookOf(item);
    if (!g) continue;
    if (g.hat) { o.hat = g.hat; if (g.hatColor !== undefined) o.hatColor = g.hatColor; }
    if (g.shirt) { o.shirt = g.shirt; if (g.shirtColor !== undefined) o.shirtColor = g.shirtColor; }
    if (g.outer) { o.outer = g.outer; if (g.outerColor !== undefined) o.outerColor = g.outerColor; }
    if (g.pants) { o.pants = g.pants; if (g.pantsColor !== undefined) o.pantsColor = g.pantsColor; }
    if (g.shoes) { o.shoes = g.shoes; if (g.shoesColor !== undefined) o.shoesColor = g.shoesColor; }
    if (g.gloves) { o.gloves = true; if (g.glovesColor !== undefined) o.glovesColor = g.glovesColor; }
    if (g.pack) { o.pack = true; if (g.packColor !== undefined) o.packColor = g.packColor; }
    if (g.held) o.held = g.held;
  }
  // 조끼만 걸치고 상의가 없으면 맨몸에 조끼가 된다 — 기본 티를 받쳐 입힌다.
  if (o.outer !== 'none' && o.shirt === 'none') o.shirt = 'tee';
  return o;
}

/**
 * 지금 화면에 그려야 할 캐릭터 설정.
 * **모든 렌더 호출측은 `GameState.character` 대신 이것을 쓴다** — 그래야 장비가 그림에 나온다.
 */
export function characterLook(): CharConfig {
  const base = GameState.character;
  return { look: base.look, outfit: outfitWithGear(base.outfit) };
}
