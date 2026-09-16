/**
 * @file CharacterCast.ts
 * @description 스토리 인물 41인 외형 캐스팅 (138차)
 *
 * 구 배선은 **NPC 텍스처 5장으로 38인을 돌려막았다**(탁만수 = 강두철 = `npc_grandfather`,
 * 도현수 = 배누리 = `npc_tourist_f`). 한 화면에 같은 얼굴이 둘 서 있었다.
 *
 * 여기서는 인물마다 **성별·연령·역할**만 표로 두고, 나머지(피부·머리색·머리모양·눈·입)는
 * **id 해시로 결정적 분화**한다 — 38인이 전부 다르면서도 팔레트는 한 벌로 묶인다.
 * 손으로 바꾸고 싶은 인물은 `CAST_OVERRIDE`에 한 줄만 적으면 된다.
 *
 * ⚠ 결정적(deterministic)이어야 한다 — 세이브에 외형을 저장하지 않고 id로 매번 재생성하므로,
 *   해시 규칙을 바꾸면 **기존 세이브의 NPC 얼굴이 전부 바뀐다**. 규칙 변경은 차수 기록 대상.
 */

import {
  type CharAppearance, type CharConfig, type CharOutfit, type CharSex, type HairStyle,
  type MouthStyle, HAIR_COLORS, CLOTH_COLORS, bareOutfit,
} from './CharacterArt.js';

export type CharAge = 'child' | 'teen' | 'young' | 'mid' | 'elder';
export type CharRole =
  | 'vendor' | 'official' | 'captain' | 'artisan' | 'student' | 'streamer'
  | 'office' | 'keeper' | 'drifter' | 'worker' | 'camper' | 'crew'
  | 'musician' | 'cook' | 'writer' | 'collector' | 'expert' | 'angler';

export interface CastTrait { sex: CharSex; age: CharAge; role: CharRole }

/** 인물 표 — 나이·역할은 `StoryArcs`의 roleKo에서 그대로 옮겼다 */
export const CAST_TRAITS: Record<string, CastTrait> = {
  okseon: { sex: 'f', age: 'elder', role: 'vendor' },
  hyeonsu: { sex: 'm', age: 'young', role: 'angler' },
  coop: { sex: 'm', age: 'mid', role: 'official' },
  baram: { sex: 'm', age: 'mid', role: 'drifter' },
  tak_mansu: { sex: 'm', age: 'elder', role: 'artisan' },
  tak_saebyeok: { sex: 'm', age: 'child', role: 'student' },
  kang_ducheol: { sex: 'm', age: 'elder', role: 'official' },
  bae_nuri: { sex: 'f', age: 'teen', role: 'student' },
  ha_sua: { sex: 'f', age: 'teen', role: 'student' },
  mo_jinju: { sex: 'f', age: 'teen', role: 'expert' },
  seo_harin: { sex: 'f', age: 'young', role: 'streamer' },
  na_gibeom: { sex: 'm', age: 'young', role: 'expert' },
  go_hosu: { sex: 'm', age: 'young', role: 'student' },
  mo_taejo: { sex: 'm', age: 'young', role: 'angler' },
  baek_haneul: { sex: 'm', age: 'young', role: 'student' },
  yeo_gangsan: { sex: 'm', age: 'mid', role: 'expert' },
  jim_kang: { sex: 'm', age: 'mid', role: 'collector' },
  go_manseok: { sex: 'm', age: 'elder', role: 'captain' },
  go_haena: { sex: 'f', age: 'young', role: 'crew' },
  lee_suyeon: { sex: 'f', age: 'teen', role: 'cook' },
  han_bom: { sex: 'f', age: 'teen', role: 'cook' },
  namgung_hyeon: { sex: 'm', age: 'elder', role: 'worker' },
  chae_geumja: { sex: 'f', age: 'young', role: 'captain' },
  chae_pado: { sex: 'm', age: 'young', role: 'crew' },
  oh_gayun: { sex: 'f', age: 'young', role: 'office' },
  jeong_umi: { sex: 'f', age: 'mid', role: 'camper' },
  song_gibaek: { sex: 'm', age: 'elder', role: 'keeper' },
  ma_gamgi: { sex: 'm', age: 'mid', role: 'writer' },
  oh_serin: { sex: 'f', age: 'young', role: 'angler' },
  mara: { sex: 'f', age: 'young', role: 'office' },
  yu_ria: { sex: 'f', age: 'mid', role: 'streamer' },
  oh_sera: { sex: 'f', age: 'mid', role: 'office' },
  yeon_taeo: { sex: 'm', age: 'young', role: 'expert' },
  seok_dokgu: { sex: 'm', age: 'child', role: 'student' },
  seok_daeyang: { sex: 'm', age: 'elder', role: 'keeper' },
  dan_cheolho: { sex: 'm', age: 'mid', role: 'office' },
  ha_minji: { sex: 'f', age: 'young', role: 'musician' },
  // 138차 증설 4인
  yu_harang: { sex: 'f', age: 'young', role: 'streamer' },
  oh_sechan: { sex: 'm', age: 'mid', role: 'official' },
  ha_nui: { sex: 'f', age: 'mid', role: 'artisan' },
  chae_surim: { sex: 'f', age: 'mid', role: 'expert' },
};

/** 손으로 굳힌 외형 (해시 결과를 덮어쓴다) */
export const CAST_OVERRIDE: Record<string, Partial<CharAppearance> & { outfit?: Partial<CharOutfit> }> = {
  okseon: { hairStyle: 'short', hair: 7, outfit: { hat: 'bandana', hatColor: 0xc4553f } },
  tak_mansu: { hair: 7, beard: 7, outfit: { hat: 'sun', hatColor: 0xd1a72f } },
  kang_ducheol: { hair: 6, beard: 6, outfit: { hat: 'cap', hatColor: 0x3d5a80 } },
  go_manseok: { hair: 7, beard: 7, outfit: { hat: 'beanie', hatColor: 0x5b6637 } },
  hyeonsu: { hair: 0, hairStyle: 'short', mouth: 'neutral', blush: false, outfit: { shirt: 'shirt', shirtColor: 0xc4553f, held: 'rod' } },
  bae_nuri: { hairStyle: 'pony', hair: 3 },
  seo_harin: { hairStyle: 'long', hair: 5, outfit: { hat: 'visor', hatColor: 0xd1a72f } },
  baram: { hairStyle: 'long', hair: 1, beard: 1, outfit: { hat: 'bandana', hatColor: 0x5b6637 } },
  yu_harang: { hairStyle: 'pony', hair: 9, outfit: { hat: 'visor', hatColor: 0xc4553f, shirt: 'tee', shirtColor: 0x2f8377 } },
  oh_sechan: { hair: 0, outfit: { hat: 'cap', hatColor: 0x2f8377, outer: 'vest', outerColor: 0xd1a72f } },
  ha_nui: { hairStyle: 'braid', hair: 2, outfit: { outer: 'apron', outerColor: 0x8a6340 } },
  chae_surim: { hairStyle: 'bob', hair: 0, outfit: { shirt: 'shirt', shirtColor: 0xe8e2d4, outer: 'jacket', outerColor: 0x9a9ea6 } },
};

// ── 결정적 해시 ─────────────────────────────────────────────
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function pick<T>(arr: readonly T[], h: number, salt: number): T {
  return arr[(h >>> salt) % arr.length];
}

const HAIR_BY_AGE: Record<CharAge, number[]> = {
  child: [0, 1, 2], teen: [0, 1, 2, 3, 4, 9], young: [0, 1, 2, 3, 4, 5, 9],
  mid: [0, 1, 2, 5, 6], elder: [6, 7, 8],
};
const STYLE_M: HairStyle[] = ['short', 'buzz', 'curly', 'short', 'topknot'];
const STYLE_F: HairStyle[] = ['bob', 'pony', 'long', 'braid', 'curly'];
const MOUTHS: MouthStyle[] = ['smile', 'neutral', 'small', 'smile'];

/** 역할 → 복장 원형 */
function outfitOfRole(role: CharRole, h: number, sex: CharSex): CharOutfit {
  const c1 = pick(CLOTH_COLORS, h, 3);
  const c2 = pick(CLOTH_COLORS, h, 11);
  const o: CharOutfit = {
    ...bareOutfit(),
    shirt: 'tee', shirtColor: c1,
    pants: sex === 'f' && (h & 8) ? 'skirt' : 'jeans', pantsColor: c2,
    shoes: 'sneakers', shoesColor: pick(CLOTH_COLORS, h, 17),
  };
  switch (role) {
    case 'vendor': return { ...o, outer: 'apron', outerColor: 0xe8e2d4, shoes: 'rubber', shoesColor: 0x4a4550 };
    case 'cook': return { ...o, outer: 'apron', outerColor: 0xe8e2d4 };
    case 'official': return { ...o, shirt: 'shirt', outer: 'jacket', outerColor: 0x3d5a80, hat: 'cap', hatColor: 0x2f3f5c, shoes: 'boots' };
    case 'captain': return { ...o, shirt: 'knit', outer: 'jacket', outerColor: 0x2a3f5c, hat: 'cap', hatColor: 0x1a2740, shoes: 'rubber', pants: 'waders', pantsColor: 0x5b6637 };
    case 'crew': return { ...o, hat: 'cap', hatColor: c1, outer: 'vest', outerColor: 0xc47430, shoes: 'rubber' };
    case 'artisan': return { ...o, outer: 'vest', outerColor: 0x5e4228, hat: 'bandana', hatColor: 0x8a5a3c };
    case 'keeper': return { ...o, shirt: 'knit', hat: 'beanie', hatColor: c2, shoes: 'boots' };
    case 'worker': return { ...o, shirt: 'hoodie', hat: 'cap', hatColor: 0x4a4550, shoes: 'boots' };
    case 'drifter': return { ...o, shirt: 'knit', outer: 'vest', outerColor: 0x5b6637, hat: 'bandana', hatColor: 0xc4553f, pack: true, shoes: 'boots' };
    case 'streamer': return { ...o, shirt: 'tee', shirtColor: 0xd1a72f, hat: 'visor', hatColor: c2 };
    case 'office': return { ...o, shirt: 'shirt', shirtColor: 0xe8e2d4, pants: 'jeans', pantsColor: 0x4a4550 };
    case 'camper': return { ...o, shirt: 'knit', hat: 'beanie', hatColor: c1, pack: true, shoes: 'boots' };
    case 'musician': return { ...o, shirt: 'knit', shirtColor: c2 };
    case 'writer': return { ...o, shirt: 'hoodie', shirtColor: 0x8d8f9a };
    case 'collector': return { ...o, outer: 'jacket', outerColor: 0x4a4550, shoes: 'boots' };
    case 'expert': return { ...o, shirt: 'shirt', outer: 'vest', outerColor: 0x5b6637, shoes: 'boots', held: 'rod' };
    case 'angler': return { ...o, outer: 'vest', outerColor: 0xc47430, hat: 'cap', hatColor: c2, shoes: 'rubber' };
    case 'student': default: return { ...o, shirt: (h & 4) ? 'hoodie' : 'tee', pants: (h & 2) ? 'shorts' : o.pants };
  }
}

/** 인물 id → 외형. 표에 없으면 id 해시만으로 만든다(엑스트라 NPC 공용). */
export function characterOf(npcId: string, fallback?: Partial<CastTrait>): CharConfig {
  const h = hash32(npcId);
  const t: CastTrait = CAST_TRAITS[npcId] ?? {
    sex: fallback?.sex ?? ((h >>> 1) & 1 ? 'f' : 'm'),
    age: fallback?.age ?? (['young', 'mid', 'teen', 'elder'] as CharAge[])[(h >>> 5) % 4],
    role: fallback?.role ?? 'angler',
  };
  const hairPool = HAIR_BY_AGE[t.age];
  const look: CharAppearance = {
    sex: t.sex,
    skin: (h >>> 7) % 5,
    hair: hairPool[(h >>> 13) % hairPool.length],
    hairStyle: t.sex === 'f' ? pick(STYLE_F, h, 19) : pick(STYLE_M, h, 19),
    eye: (h >>> 23) % 6,
    mouth: pick(MOUTHS, h, 9),
    blush: t.age === 'child' || t.age === 'teen' || ((h >>> 3) & 1) === 1,
    brow: t.sex === 'm' ? 0.8 : 0.45,
    beard: t.sex === 'm' && (t.age === 'elder' || (t.age === 'mid' && ((h >>> 21) & 1) === 1))
      ? (t.age === 'elder' ? 7 : 1) : -1,
  };
  let outfit = outfitOfRole(t.role, h, t.sex);
  const ov = CAST_OVERRIDE[npcId];
  if (ov) {
    const { outfit: oo, ...lo } = ov;
    Object.assign(look, lo);
    if (oo) outfit = { ...outfit, ...oo };
  }
  // 아이는 체형이 아니라 복장·머리로만 구분한다(스켈레톤은 1종 유지 — 레이어 정합 보장)
  if (t.age === 'child') { look.brow = 0.2; look.blush = true; }
  if (HAIR_COLORS[look.hair] === undefined) look.hair = 0;
  return { look, outfit };
}

/** 표에 등재된 전 인물 id */
export function castIds(): string[] { return Object.keys(CAST_TRAITS); }
