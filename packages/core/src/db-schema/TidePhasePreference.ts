/**
 * @file TidePhasePreference.ts
 * @description 어종 × 물때 흐름 8단계 선호표 (205차 — `.agents/TIDE_PHASE_STRATEGY_SPEC.md` §3 · P1/P3).
 *
 * - 배율은 「그 어종의 다른 조건이 같을 때」 단계별 상대 입질 가중이다(1.0 = 중립 · 누락 단계 = 1.0).
 * - 사리 · 남해(부산) 기준값이다. 실제 적용은 `TidePhaseStrategy.speciesTidePhaseMult`가
 *   사리/조금(`tideSpringK`)과 지역(동해 감쇠 `tideRegionK`)으로 눌러서 쓴다.
 * - `size`는 그 어종만의 대물 가중(0~1) — 공통 단계 가중(`TIDE_FLOW_PROFILE.sizeBias`)에 더해진다.
 * - 숫자는 설계 초안이다(출처에 숫자 없음 — 근거 강도는 `evidence`). 전체 세기는 `TUNING.tidePhase`로 조절.
 * - 어종별 선호는 게임 화면에 미리 보이지 않는다(R2) — 잡아 본 뒤 `noteKo`가 기록으로 남는다.
 *
 * 순수 데이터 — 렌더/브라우저 API 없음.
 */

import type { TideFlowPhase, TidePhasePrefGroup, TidePhaseRow } from '../types/TideFlow.js';

/** 단계 순서 — 표 열 순서(간조 물돌이 → 들물 → 만조 물돌이 → 날물) */
export const TIDE_PREF_PHASE_ORDER: TideFlowPhase[] = [
  'slack_low', 'flood_early', 'flood_mid', 'flood_late', 'slack_high', 'ebb_early', 'ebb_mid', 'ebb_late',
];

/** 8칸 배열(LS F1 F2 F3 HS E1 E2 E3)을 단계 행으로 */
function row(v: [number, number, number, number, number, number, number, number]): TidePhaseRow {
  const out: TidePhaseRow = {};
  TIDE_PREF_PHASE_ORDER.forEach((p, i) => { if (v[i] !== 1) out[p] = v[i]; });
  return out;
}

export const TIDE_PHASE_PREF_GROUPS: TidePhasePrefGroup[] = [
  {
    id: 'black_seabream', nameKo: '감성돔', nameEn: 'Black seabream',
    members: ['black_seabream'],
    bite: row([1.10, 1.25, 0.95, 1.20, 1.15, 1.15, 0.90, 1.15]),
    size: { slack_high: 0.4, slack_low: 0.3, flood_late: 0.2 },
    noteKo: '감성돔은 끝날물에서 초들물로 넘어갈 때 잘 문다. 물이 멈춘 물돌이에는 오히려 큰 놈이 붙는다.',
    noteEn: 'Black seabream bite best as the late ebb turns into the early flood. At slack water the big ones show up instead.',
    evidence: 'community',
  },
  {
    id: 'blackfish', nameKo: '벵에돔 · 긴꼬리벵에돔', nameEn: 'Blackfish',
    members: ['largescale_blackfish', 'longtail_blackfish'],
    bite: row([0.75, 1.15, 1.10, 1.05, 0.75, 1.15, 1.10, 1.00]),
    noteKo: '벵에돔은 물이 적당히 흐를 때 뜬다. 물이 멈추면 입을 닫는다.',
    noteEn: 'Blackfish rise when the water moves steadily. When it stops, they shut their mouths.',
    evidence: 'community',
  },
  {
    id: 'beakperch', nameKo: '돌돔 · 강담돔', nameEn: 'Beakperch',
    members: ['stone_beakperch', 'spotted_knifejaw'],
    bite: row([0.90, 1.30, 1.05, 0.90, 0.90, 1.35, 1.15, 0.90]),
    size: { ebb_early: 0.2, flood_early: 0.15 },
    noteKo: '돌돔은 멈췄던 물이 빠르게 살아날 때 덤빈다. 날물이 막 시작될 때가 특히 좋았다.',
    noteEn: 'Beakperch strike when still water suddenly comes alive. The start of the ebb was especially good.',
    evidence: 'community',
  },
  {
    id: 'red_seabream', nameKo: '참돔', nameEn: 'Red seabream',
    members: ['red_seabream'],
    bite: row([0.60, 1.10, 1.30, 1.00, 0.60, 1.10, 1.30, 1.00]),
    size: { flood_mid: 0.3, ebb_mid: 0.3 },
    noteKo: '참돔은 물살이 가장 셀 때 문다. 물이 멈추면 입질이 뚝 끊긴다.',
    noteEn: 'Red seabream bite when the current runs hardest. When the water stops, the bites just end.',
    evidence: 'community',
  },
  {
    id: 'bottom_ambush', nameKo: '광어 · 우럭', nameEn: 'Flatfish · Rockfish',
    members: ['flatfish', 'black_rockfish'],
    bite: row([0.85, 1.30, 0.90, 1.00, 0.85, 1.30, 0.90, 1.00]),
    noteKo: '바닥에 붙은 광어·우럭은 물이 막 흐르기 시작할 때 눈앞을 지나는 미끼를 덮친다.',
    noteEn: 'Flatfish and rockfish on the bottom pounce on bait drifting past just as the water starts to move.',
    evidence: 'community',
  },
  {
    id: 'rockfish_light', nameKo: '청볼락 · 황볼락 · 열기', nameEn: 'Small rockfish',
    members: ['blue_rockfish', 'golden_rockfish', 'red_snapper_rockfish'],
    bite: row([1.00, 1.20, 0.90, 1.05, 1.10, 1.20, 0.90, 1.00]),
    noteKo: '볼락은 물살이 약할 때를 좋아한다. 물이 막 돌거나 흐름이 붙기 시작할 때 잘 나왔다.',
    noteEn: 'Small rockfish like a gentle current. They came up best right as the tide turned or began to move.',
    evidence: 'community',
  },
  {
    id: 'sea_bass', nameKo: '농어', nameEn: 'Sea bass',
    members: ['sea_bass'],
    bite: row([0.80, 1.05, 1.05, 1.20, 1.15, 1.25, 1.05, 0.95]),
    size: { flood_late: 0.25, slack_high: 0.25, ebb_early: 0.2 },
    noteKo: '농어는 물이 가득 찬 뒤 빠지기 시작할 때 포말 속에서 문다.',
    noteEn: 'Sea bass hit in the white water as the full tide starts to drain.',
    evidence: 'community',
  },
  {
    id: 'squid', nameKo: '무늬오징어 · 한치', nameEn: 'Squid',
    members: ['squid', 'swordtip_squid'],
    bite: row([1.05, 1.20, 0.95, 1.10, 1.10, 1.15, 0.90, 1.00]),
    noteKo: '오징어는 물이 완만할 때, 특히 물이 돌기 앞뒤로 에기를 잘 안는다.',
    noteEn: 'Squid grab the egi when the current is gentle — especially just before and after the tide turns.',
    evidence: 'community',
  },
  {
    id: 'bottom_cephalopod', nameKo: '갑오징어 · 문어', nameEn: 'Cuttlefish · Octopus',
    members: ['cuttlefish', 'octopus', 'giant_octopus'],
    bite: row([1.10, 1.10, 0.85, 1.00, 1.10, 1.10, 0.85, 1.00]),
    noteKo: '바닥을 기는 녀석들은 물살이 세면 채비가 뜬다. 물이 느릴 때가 낫다.',
    noteEn: 'Bottom crawlers lose the rig when the current is strong. Slow water works better.',
    evidence: 'community',
  },
  {
    id: 'pelagic_big', nameKo: '부시리 · 방어 · 잿방어 · 삼치', nameEn: 'Amberjack · Yellowtail · Spanish mackerel',
    members: ['amberjack', 'yellowtail', 'greater_amberjack', 'spanish_mackerel'],
    bite: row([0.80, 1.15, 1.10, 1.15, 0.90, 1.15, 1.05, 1.00]),
    size: { flood_early: 0.15, ebb_early: 0.15 },
    noteKo: '회유하는 큰 고기는 물 방향이 바뀌자마자 연달아 들어온다.',
    noteEn: 'The big roaming fish come in back to back right after the current changes direction.',
    evidence: 'community',
  },
  {
    id: 'pelagic_small', nameKo: '고등어 · 전갱이 · 학꽁치', nameEn: 'Mackerel · Horse mackerel · Halfbeak',
    members: ['chub_mackerel', 'horse_mackerel', 'halfbeak'],
    bite: row([0.90, 1.00, 1.05, 1.10, 1.10, 1.00, 1.00, 0.95]),
    noteKo: '작은 회유어는 물때를 크게 타지 않는다. 그래도 물이 가득 찰 무렵이 조금 낫다.',
    noteEn: 'Small roaming fish barely care about the tide, though it is slightly better near high water.',
    evidence: 'community',
  },
  {
    id: 'mullet', nameKo: '숭어 · 가숭어', nameEn: 'Mullet',
    members: ['striped_mullet', 'redlip_mullet'],
    bite: row([0.85, 1.00, 1.10, 1.10, 1.05, 1.00, 0.95, 0.90]),
    noteKo: '숭어는 들물을 타고 연안으로 붙는다.',
    noteEn: 'Mullet ride the flood in toward the shore.',
    evidence: 'folk',
  },
  {
    id: 'flounder_whiting', nameKo: '가자미 · 도다리 · 보리멸', nameEn: 'Flounder · Whiting',
    members: ['flounder', 'frog_flounder', 'starry_flounder', 'northern_whiting'],
    bite: row([0.85, 1.15, 1.05, 1.10, 0.95, 1.10, 1.00, 0.95]),
    noteKo: '모래밭 고기는 들물 초반부터 물이 찰 때까지 꾸준히 문다.',
    noteEn: 'Sand-bottom fish bite steadily from the early flood until the water is full.',
    evidence: 'folk',
  },
];

/** 어종 id → 묶음(없으면 물때 선호 중립) */
const BY_SPECIES = new Map<string, TidePhasePrefGroup>();
for (const g of TIDE_PHASE_PREF_GROUPS) for (const id of g.members) BY_SPECIES.set(id, g);

export function tidePhasePrefGroupOf(speciesId: string): TidePhasePrefGroup | undefined {
  return BY_SPECIES.get(speciesId);
}

/** 어종의 단계 원배율(감쇠 전 · 없으면 1) */
export function rawTidePhasePref(speciesId: string, phase: TideFlowPhase): number {
  return BY_SPECIES.get(speciesId)?.bite[phase] ?? 1;
}

/** 어종의 단계 대물 원가중(감쇠 전 · 없으면 0) */
export function rawTidePhaseSize(speciesId: string, phase: TideFlowPhase): number {
  return BY_SPECIES.get(speciesId)?.size?.[phase] ?? 0;
}

/** 이 어종이 「잘 무는 단계」인가 — 발견 기록 문턱(원배율 1.15 이상) */
export function isFavoredTidePhase(speciesId: string, phase: TideFlowPhase): boolean {
  return rawTidePhasePref(speciesId, phase) >= 1.15;
}
