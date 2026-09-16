/**
 * @file QuestRewardItems.ts
 * @description 스토리 보상 전용 아이템 카탈로그 (141차) — 메인 해금형 보상(귀속 장비·가방)과 서브 아크 가방.
 *
 * - `qr_*` = 메인 스트림 **귀속(bound)** 장비. 상점 매입 목록에서 제외되고 상세보기에 '귀속' 행이 붙는다.
 *   "메인을 깨서 돈을 버는" 우회를 막고, 레벨 밴드에 비례해 고급 장비를 **이야기가** 준다.
 * - `inv_bag_*` = 서브 아크(N01-6·N06-3·N11-2)의 가방 — 귀속 아님(팔 수 있다).
 * - 가방 `bagSlots`는 값을 그대로 싣되 인벤 그리드 상한(`GRID_CAPACITY_MAX` 30)에 `min`으로 걸린다 —
 *   패널 재설계 전까지는 25+5=30칸이 실효 상한(백로그).
 * - `WikiCatalog.buildItemWikiCatalog`가 네 번째 소스로 합류시킨다(도감·`GameState.giveItem` 조회 경로).
 */

import type { InvItemTemplate } from '../store/InventoryStore.js';

const gear = (id: string, name: string, sub: string, basePrice: number, extra: Partial<InvItemTemplate> = {}): InvItemTemplate =>
  ({ id, name, icon: '', category: 'gear', subCategory: sub, basePrice, equippable: true, bound: true, ...extra });

export const QUEST_REWARD_ITEMS: InvItemTemplate[] = [
  // ── Ch1 — 실습생 ──
  { id: 'qr_tackle_pouch', name: '옛 계원의 채비 주머니', icon: '', category: 'gear', subCategory: '가방', basePrice: 15000,
    equippable: true, bound: true, bagSlots: 3, iconTexture: 'px:it_backpack' },
  gear('qr_rod_heirloom', '아버지의 릴대 (손에 맞춘 것)', '손도구', 210000, { tool: 'rod', iconTexture: 'px:it_rod' }),
  gear('qr_reel_heirloom', '아버지의 릴 (드랙 재조정)', '릴', 120000, { iconTexture: 'px:it_reel' }),
  { id: 'qr_knife_okseon', name: '정옥선의 손질 칼', icon: '', category: 'etc', subCategory: '조리도구', basePrice: 60000,
    equippable: true, bound: true, tool: 'knife' },
  { id: 'qr_headlamp_trainee', name: '어촌계 실습생 헤드랜턴 (1,000lm)', icon: '', category: 'etc', subCategory: '해루질 도구',
    basePrice: 40000, equippable: false, bound: true, lampLumens: 1000 },
  // ── Ch2 — 위판 ──
  gear('qr_rod_gamcheon', '도현수의 감천 튜닝 대', '손도구', 260000, { tool: 'rod', iconTexture: 'px:it_rod' }),
  { id: 'qr_bag_field', name: '촬영 스태프 필드백', icon: '', category: 'gear', subCategory: '가방', basePrice: 45000,
    equippable: true, bound: true, bagSlots: 5, iconTexture: 'px:it_backpack' },
  gear('qr_reel_winter', '겨울 바다용 스피닝릴 (동결 드랙)', '릴', 180000, { iconTexture: 'px:it_reel' }),
  // ── Ch3 — 배 ──
  gear('qr_rod_jig', '고래마루 지깅 로드', '손도구', 320000, { tool: 'rod', iconTexture: 'px:it_rod' }),
  { id: 'qr_bag_expedition', name: '어촌계 원정 가방', icon: '', category: 'gear', subCategory: '가방', basePrice: 70000,
    equippable: true, bound: true, bagSlots: 8, iconTexture: 'px:it_backpack' },
  gear('qr_rod_bamboo', '탁만수의 새 죽간', '손도구', 450000, { tool: 'rod', iconTexture: 'px:it_rod' }),
  // ── Ch4 — 손님 ──
  gear('qr_reel_captain', '선장용 스피닝릴 (고속 기어)', '릴', 260000, { iconTexture: 'px:it_reel' }),
  gear('qr_rod_surf', '탁새벽의 서프 대', '손도구', 380000, { tool: 'rod', iconTexture: 'px:it_rod' }),
  // ── Ch5 — 제주 ──
  { id: 'qr_bag_guide', name: '가이드 가방 (구명조끼·멀미약·계측자)', icon: '', category: 'gear', subCategory: '가방', basePrice: 90000,
    equippable: true, bound: true, bagSlots: 10, iconTexture: 'px:it_backpack' },
  gear('qr_rod_tournament', '제주 대회 부상 로드 (각인)', '손도구', 620000, { tool: 'rod', iconTexture: 'px:it_rod' }),
  gear('qr_reel_tournament', '제주 대회 부상 릴 (각인)', '릴', 380000, { iconTexture: 'px:it_reel' }),
  // ── Ch6 — 돌아오는 길 ──
  { id: 'qr_headlamp_keeper', name: '등대지기의 랜턴 (1,400lm)', icon: '', category: 'etc', subCategory: '해루질 도구',
    basePrice: 90000, equippable: false, bound: true, lampLumens: 1400 },
  { id: 'qr_bag_voyage', name: '원거리 항해 가방', icon: '', category: 'gear', subCategory: '가방', basePrice: 120000,
    equippable: true, bound: true, bagSlots: 12, iconTexture: 'px:it_backpack' },
  // ── Ch7 — 조행록 ──
  gear('qr_rod_final', '탁새벽의 대 (마지막 캐스팅)', '손도구', 900000, { tool: 'rod', iconTexture: 'px:it_rod' }),
  gear('qr_reel_final', '탁새벽의 릴 (마지막 캐스팅)', '릴', 520000, { iconTexture: 'px:it_reel' }),

  // ── 서브 아크 가방 (귀속 아님 — 137차 이후 참조만 있던 id를 실물화) ──
  { id: 'inv_bag_mountain', name: '바람의 마운틴 백팩', icon: '', category: 'gear', subCategory: '가방', basePrice: 85000,
    equippable: true, bagSlots: 8, iconTexture: 'px:it_backpack' },
  { id: 'inv_bag_tackle_vest', name: '씨바스터즈 태클 베스트', icon: '', category: 'gear', subCategory: '가방', basePrice: 60000,
    equippable: true, bagSlots: 5, iconTexture: 'px:it_backpack' },
  { id: 'inv_bag_dry', name: '채파도의 드라이백', icon: '', category: 'gear', subCategory: '가방', basePrice: 40000,
    equippable: true, bagSlots: 5, iconTexture: 'px:it_backpack' },
];

/** id → 이름 (일지·대화창 보상 표기용) */
export function questRewardItemName(id: string): string | undefined {
  return QUEST_REWARD_ITEMS.find((i) => i.id === id)?.name;
}
