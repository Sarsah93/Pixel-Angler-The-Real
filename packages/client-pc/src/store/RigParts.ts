/**
 * @file RigParts.ts
 * @description 인벤토리 아이템 → 채비 부품 종류·미끼 종류 분류기 (192차 채비 모딩 트리)
 *
 * 아이템이 `rigPart`를 들고 있으면 그대로 쓰고, 없으면(구세이브·옛 상점 품목) 이름·제원으로 추정한다.
 * 트리(core `RigTree`)는 아이템 실체를 모르고 `RigItemView`만 본다 — 이 파일이 그 다리다.
 */

import { getLureSpec, type RigPartKind, type RigItemView, type BaitKey } from '@tra/core';
import type { InvItem } from './InventoryStore.js';

/** 아이템이 들어갈 수 있는 채비 칸 종류 (없으면 채비 부품이 아니다) */
export function partKindOf(i: Pick<InvItem, 'id' | 'name' | 'subCategory' | 'rigPart' | 'sinkerKind' | 'floatBuoyG'>): RigPartKind | null {
  if (i.rigPart) return i.rigPart;
  const sub = i.subCategory ?? '';
  const n = i.name ?? '';
  if (sub === '원줄 스풀') return 'main_line';
  if (sub === '목줄 스풀') return 'leader_line';
  if (i.sinkerKind === 'bundle') return 'bundle_sinker';
  if ((i.name ?? '').includes('카드 채비')) return 'card_rig';
  if (i.sinkerKind === 'ring' || i.sinkerKind === 'hole') return 'sliding_sinker';
  if (sub === '지그헤드' || n.includes('지그헤드')) return 'jig_head';
  const lure = getLureSpec(i.id);
  if (lure) return lure.requiresJigHead ? 'soft_lure' : 'hard_lure';
  if (sub === '루어') return 'hard_lure';
  if (sub === '바늘/훅') return 'hook';
  if (sub.includes('미끼') || sub === '생미끼') return 'bait';
  if (sub === '채비 부속') {
    if (n.includes('타이라바')) {
      if (n.includes('헤드')) return 'tairaba_head';
      if (n.includes('스커트')) return 'tairaba_skirt';
      if (n.includes('넥타이') || n.includes('리본')) return 'tairaba_necktie';
    }
    if (n.includes('좁쌀')) return 'split_shot';
    if (n.includes('수중찌')) return 'sub_float';
    if (n.includes('찌')) return 'float';
    if (n.includes('도래')) return (n.includes('핀') || n.includes('스냅')) ? 'swivel_snap' : 'swivel_plain';
    if (n.includes('쿠션')) return 'cushion';
    if (n.includes('구슬')) return 'bead';
    if (n.includes('봉돌')) return 'sliding_sinker';
  }
  return null;
}

/** 미끼 아이템 → 스폰 오라클 BaitKey (이름 기준 — 1인칭 씬의 분류와 같다) */
export function baitKeyOf(i: Pick<InvItem, 'name' | 'subCategory'>): BaitKey | undefined {
  const n = i.name ?? '';
  if (n.includes('혼무시') || n.includes('참갯지렁이')) return 'worm_king';
  if (n.includes('지렁이')) return 'worm_blue';
  if (n.includes('크릴')) return 'krill';
  if (n.includes('빵') || n.includes('떡밥')) return 'bread';
  if (n.includes('생선') || n.includes('오징어')) return 'fishcut';
  if (n.includes('옥수수')) return 'corn';
  if (n.includes('게') || n.includes('소라')) return 'crab';
  if (n.includes('성게')) return 'urchin';
  if (n.includes('조개') || n.includes('개불')) return 'shellfish';
  if (n.includes('미꾸라지') || n.includes('전갱이')) return 'livefish';
  return (i.subCategory ?? '').includes('미끼') ? 'krill' : undefined;
}

/** 트리가 보는 아이템 뷰 */
export function rigViewOf(i: InvItem): RigItemView {
  const kind = partKindOf(i);
  return {
    id: i.id,
    name: i.name,
    partKind: kind,
    qty: i.qty,
    sinkerWeightG: i.sinkerWeightG,
    kitHooks: i.kitHooks,
    flasher: !!i.cardFlasher,
    cardTarget: i.cardTarget,
    baitKey: kind === 'bait' ? baitKeyOf(i) : undefined,
  };
}
