/**
 * @file TackleTextures.ts
 * @description 249차 — 낚시 장비 그림 표(어종 `FISH_IMAGE_FILES` · 갯것 `FORAGE_IMAGE_FILES`와 같은 카드 방식).
 *
 *  원본은 `food assets/tackle/<파일>`(사용자 그림 · Gemini 그림 — 1,000px 안팎)이고, 게임은 `node tools/tackle_cards.cjs`가 굽는
 *  카드(`public/tackle/<파일>` — 상세 창 큰 그림 칸 228×90 안)와 64px 아이콘(`public/tackle/icon/<파일>` — 가방 · 상점 · 퀵슬롯 칸)만 싣는다.
 *  아이콘 키는 `<카드 키>__icon`(`FishTextures.fishIconKey`) — 72px 이하로 그리는 칸은 `fitFishTexture`가 아이콘으로 바꾼다.
 *
 *  키 두 갈래:
 *   - `art_*` — 코드로 그린 임시 그림(`tools/item_art/`)을 쓰던 장비. **키를 그대로 두고 그림만 바꿨다** — 세이브 · 카탈로그의
 *     `iconTexture`를 고치지 않아도 된다. 코드 그림 PNG는 `tools/item_art/build.py`가 이 표를 읽어 빼고, 아이템 id 연결만 남긴다.
 *   - 그 밖 — 사용자 그림(스피닝대 · 구멍찌 등)과, 다른 종류 그림을 빌려 쓰던 장비의 새 그림(원투대 · 레버브레이크 릴 · 합사 등).
 *     어느 대 · 릴 · 줄이 어느 그림인지는 아래 `rodArtKey` · `reelArtKey` · `lineArtKey`가 정한다(상점 · 시작 아이템 · 보상 · 구세이브 공용).
 */
import { reelSpecFor, rodSpecFor, itemBaseId } from '@tra/core';
import type { RodUse } from '@tra/core';

/** 텍스처 키 → `food assets/tackle/` 원본 파일(= `public/tackle/` 카드 · `public/tackle/icon/` 아이콘 파일 이름) */
export const TACKLE_IMAGE_FILES: Record<string, string> = {
  // ── 사용자 그림(129 · 166 · 192 · 196 · 228 · 229 · 230차) ──
  item_spinning_rod: 'it_spinning_rod_v2.png',     // 스피닝대(갯바위 찌낚시대) — 릴을 뺀 순수 대
  item_bait_rod: 'it_bait_rod.png',                // 선상 베이트대
  item_spinning_reel: 'it_spinning_reel.png',
  item_bait_reel: 'it_bait_reel.png',
  item_jighead: 'it_jighead.png',
  item_worm: 'it_worm.png',
  item_soft_worm: 'it_soft_worm.png',              // 꼬리가 말린 그럽 웜
  item_treble: 'it_treble_hook.png',
  item_hook_chinu: 'it_hook_chinu.png',
  item_minnow: 'it_minnow.png',
  item_metal_jig: 'it_metal_jig.png',
  line_spool_saiso: 'line_spool_saiso.png',        // 나일론 원줄 스풀
  sinker_ring: 'sinker_ring.png',
  sinker_pillar: 'sinker_pillar.png',
  sinker_bundle: 'it_sinker_bundle_v2.png',
  float_zero: 'it_float_zero_v2.png',              // 몸통에 '00' 각인 — 호수 라벨을 겹치지 않는다(ItemIcon)
  float_hole: 'it_float_hole_v2.png',
  float_tilt: 'it_float_tilt_v2.png',
  subfloat_light: 'it_subfloat_light_v2.png',
  subfloat_heavy: 'it_subfloat_heavy_v2.png',
  splitshot: 'it_splitshot_v2.png',
  swivel: 'it_swivel_v2.png',
  cushion_bell: 'it_cushion_bell_v2.png',
  cushion_round: 'it_cushion_round_v2.png',
  bead_halfmoon: 'it_bead_halfmoon_v2.png',
  tairaba_head_red: 'it_tairaba_head_red.png',     // 무게별 라인업이 한 그림 — 크기는 ItemIcon.iconWeightScale
  tairaba_skirt_red: 'it_tairaba_skirt_red.png',
  tairaba_necktie_orange: 'it_tairaba_necktie_orange.png',
  swivel_barrel: 'it_swivel_barrel.png',
  card_rig_flasher: 'it_card_rig_flasher.png',     // 193차 구 카드 채비(196차에 열기 · 전갱이로 바뀜 — 구세이브용)
  card_rig_plain: 'it_card_rig_plain.png',
  card_rig_yeolgi: 'it_card_rig_yeolgi.png',
  card_rig_jeongaengi: 'it_card_rig_jeongaengi.png',
  item_ragworm_pack: 'pack_ragworm.png',
  item_honmushi_pack: 'pack_honmushi.png',
  item_krill_block: 'it_krill_block.png',
  item_krill_box: 'it_krill_box.png',
  item_krill_bait: 'it_krill_bait.png',
  item_bakkan_danax: 'it_bakkan_danax.png',
  // ── 249차 Gemini — 다른 종류 그림을 빌려 쓰던 장비의 제 그림 ──
  item_rod_surf: 'rod_surf.png',
  item_rod_shorejig: 'rod_shorejig.png',
  item_rod_light: 'rod_light.png',
  item_rod_eging: 'rod_eging.png',
  item_rod_hole: 'rod_hole.png',
  item_rod_budget: 'rod_budget.png',
  item_rod_bamboo: 'rod_bamboo.png',
  item_reel_small: 'reel_small.png',
  item_reel_lever: 'reel_lever.png',
  item_reel_surf: 'reel_surf.png',
  item_reel_sw: 'reel_sw.png',
  item_lure_shad: 'lure_shad.png',                 // 노 모양 꼬리(섀드) 웜 — 그럽 웜 그림을 빌려 쓰던 것
  item_line_pe: 'line_pe.png',
  item_line_leader: 'line_leader.png',
  item_float_sink: 'float_sink.png',               // 잠길찌 — 수중찌 그림을 빌려 쓰던 것
  // ── 249차 Gemini — 코드로 그린 임시 그림을 쓰던 장비(키는 그대로) ──
  art_lure_spoon: 'lure_spoon.png',
  art_lure_spinner: 'lure_spinner.png',
  art_lure_egi: 'lure_egi.png',
  art_lure_tairaba: 'lure_tairaba.png',
  art_lure_set: 'lure_set.png',
  art_egi_set: 'egi_set.png',
  art_breadball: 'breadball.png',
  art_breadpack: 'breadpack.png',
  art_fishcut: 'fishcut.png',
  art_chum_mix: 'chum_mix.png',
  art_chum_powder: 'chum_powder.png',
  art_chum_powder_heavy: 'chum_powder_heavy.png',
  art_chum_bread: 'chum_bread.png',
  art_chum_apmac: 'chum_apmac.png',
  art_chum_corn: 'chum_corn.png',
  art_chum_viscera: 'chum_viscera.png',
  art_landing_net: 'landing_net.png',
  art_rod_holder: 'rod_holder.png',
  art_bucket: 'bucket.png',
  art_cooler: 'cooler.png',
  art_fish_crate: 'fish_crate.png',
  art_ice_bag: 'ice_bag.png',
  art_cap: 'cap.png',
  art_vest: 'vest.png',
  art_pants: 'pants.png',
  art_shoes: 'shoes.png',
  art_boots_wading: 'boots_wading.png',
  art_glasses: 'glasses.png',
  art_gloves_fleece: 'gloves_fleece.png',
  art_gloves_rubber: 'gloves_rubber.png',
  art_gloves_work: 'gloves_work.png',
  art_watch: 'watch.png',
  art_tackle_pouch: 'tackle_pouch.png',
  art_bag_field: 'bag_field.png',
  art_bag_expedition: 'bag_expedition.png',
  art_bag_guide: 'bag_guide.png',
  art_bag_voyage: 'bag_voyage.png',
  art_bag_mountain: 'bag_mountain.png',
  art_tackle_vest: 'tackle_vest.png',
  art_dry_bag: 'dry_bag.png',
  art_headlamp: 'headlamp.png',
  art_headlamp_trainee: 'headlamp_trainee.png',
  art_lantern_keeper: 'lantern_keeper.png',
  art_tongs: 'tongs.png',
  art_gaff: 'gaff.png',
  art_rake: 'rake.png',
  art_trap_crab_basic: 'trap_crab_basic.png',
  art_trap_crab_pro: 'trap_crab_pro.png',
  art_trap_shrimp_basic: 'trap_shrimp_basic.png',
  art_trap_eel_basic: 'trap_eel_basic.png',
  art_trap_eel_pro: 'trap_eel_pro.png',
  art_trap_octopus_earthen: 'trap_octopus_earthen.png',
  art_trap_octopus_pvc: 'trap_octopus_pvc.png',
  art_trap_fish_net: 'trap_fish_net.png',
  art_reel_oil: 'reel_oil.png',
  art_carekit: 'carekit.png',
  art_junk_parts: 'junk_parts.png',
  art_toolset_rod: 'toolset_rod.png',
  art_spray: 'spray.png',
};

/** 하네스 복제본(`inv_rod_budget_h0`)처럼 꼬리가 붙은 id → 원래 id */
const baseId = (id: string): string => itemBaseId(id).replace(/_h\d+$/, '');   // 282차 — 개체 번호(`#n`)도 뗀다

/** 낚싯대 종류(core `RodUse`) → 그림. 갯바위 찌낚시대는 사용자 스피닝대 그림 · 선상 베이트대는 사용자 베이트대 그림 */
const ROD_ART_BY_USE: Record<RodUse, string> = {
  float_iso: 'item_spinning_rod',
  surf: 'item_rod_surf',
  shore_jigging: 'item_rod_shorejig',
  shore_light: 'item_rod_light',
  eging: 'item_rod_eging',
  boat_bait: 'item_bait_rod',
  hole: 'item_rod_hole',
  budget: 'item_rod_budget',
};

/** 낚싯대 그림 키 — 대 종류(core `rodSpecFor` — id 표 · 이름 추정)로 고른다. 죽간만 따로 */
export function rodArtKey(id: string, nameKo = ''): string {
  const base = baseId(id);
  if (base === 'qr_rod_bamboo' || /죽간/.test(nameKo)) return 'item_rod_bamboo';
  return ROD_ART_BY_USE[rodSpecFor(base, nameKo).use] ?? 'item_spinning_rod';
}

/** 레버브레이크 릴 — 시작 릴(다이오 2500L)과 그 릴을 손본 「아버지의 릴」, 이름에 레버 · LBD가 든 것 */
const LEVER_REEL_IDS = new Set(['inv_reel', 'qr_reel_heirloom']);

/** 릴 그림 키 — 베이트 · 레버브레이크 · 번수(2000 이하 소형 · 4000 쇼어지깅 · 5000 이상 원투)로 고른다 */
export function reelArtKey(id: string, nameKo = ''): string {
  const base = baseId(id);
  const s = reelSpecFor(base, nameKo);
  if (s.kind === 'bait') return 'item_bait_reel';
  if (LEVER_REEL_IDS.has(base) || /레버|LBD/.test(nameKo)) return 'item_reel_lever';
  if (s.size >= 5000) return 'item_reel_surf';
  if (s.size >= 4000) return 'item_reel_sw';
  if (s.size <= 2000) return 'item_reel_small';
  return 'item_spinning_reel';
}

/** 낚싯줄 스풀 그림 키 — 목줄 스풀(카본 · 나일론 목줄) · 합사(PE) · 그 밖 나일론 원줄 */
export function lineArtKey(nameKo: string, subCategory = ''): string {
  if (subCategory === '목줄 스풀' || /목줄|카본|쇼크리더/.test(nameKo)) return 'item_line_leader';
  if (/합사|PE\b/.test(nameKo)) return 'item_line_pe';
  return 'line_spool_saiso';
}

/** 빌려 쓰던 그림 키(구세이브 · 옛 카탈로그 값) — 이 값일 때만 종류별 새 그림으로 바꾼다(사용자가 다른 그림을 단 것은 건드리지 않는다) */
const GENERIC_ROD_KEYS = new Set(['item_spinning_rod', 'item_bait_rod', 'px:it_rod']);
const GENERIC_REEL_KEYS = new Set(['item_spinning_reel', 'item_bait_reel', 'px:it_reel']);

/**
 * 249차 — 구세이브 아이템의 장비 그림 키를 종류별 그림으로 바로잡는다(정적 제품 정보 — 수량 · 칸 · 장착은 그대로).
 * 대 · 릴 · 낚싯줄 스풀 · 섀드 웜 · 잠길찌가 다른 종류 그림을 빌려 쓰던 것이다. 바꿀 것이 없으면 받은 키 그대로.
 */
export function refreshTackleArtKey(item: { id: string; name: string; iconTexture?: string; subCategory?: string; tool?: string }): string | undefined {
  const t = item.iconTexture;
  if (!t) return t;
  if (GENERIC_ROD_KEYS.has(t) && (item.tool === 'rod' || item.subCategory === '손도구')) return rodArtKey(item.id, item.name);
  if (GENERIC_REEL_KEYS.has(t) && item.subCategory === '릴') return reelArtKey(item.id, item.name);
  if (t === 'line_spool_saiso') return lineArtKey(item.name, item.subCategory);
  if (t === 'item_soft_worm' && baseId(item.id).startsWith('lure_jerk_')) return 'item_lure_shad';
  if (t === 'subfloat_heavy' && baseId(item.id) === 'inv_float_sink') return 'item_float_sink';
  return t;
}
