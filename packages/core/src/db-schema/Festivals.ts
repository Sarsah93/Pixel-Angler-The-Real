/**
 * @file Festivals.ts
 * @description 298차 — 지역 축제 달력(사용자 결정 2026-11-02 「달 단위로 넓히는 쪽 … 너가 고민해서 우선 적용」).
 *
 *  두 겹 — **축제 달**(그 달 내내 가벼운 효과)과 **절정 주**(실제 축제가 열리는 며칠 — 센 효과).
 *  게임 시계는 실시간(KST)이라 「그 주말에만」은 접속 못 하는 사람에게 닫힌 문이다(R12와 같은 이유) — 달 전체를 축제로 넓히고,
 *  절정은 해마다 같은 날짜 범위로 어림한다(실제 축제는 해마다 며칠씩 움직인다 — 표의 `noteKo`에 조사한 해의 날짜).
 *
 *  효과(핵심은 값) —
 *   - 축제 달: 축제 지역 가게에서 그 축제 특산을 팔면 ×`FESTIVAL_MONTH_MULT` · 라디오 · 일지 「나날」 · 직판장 축제 매대(가공품 싸게).
 *   - 절정 주: ×`FESTIVAL_PEAK_MULT` · 행인 ×`FESTIVAL_PEAK_CROWD` · 축제 일손(`DayJobs.festivalId`) · 시계 알람 「[축제]」.
 *  값 배율은 산지 제철 배율(`specialtySellMult`)에 곱한다 — 산지 밖 택배 차익과는 겹치지 않는다(축제는 그 고장에서 판다).
 *
 *  날짜 근거(2026-11-02 웹 조사 — 298차 워크로그 §2): 속초 양미리·도루묵 2025 11/7~16 · 부산 자갈치 2025 10/23~26(2026 10/15~18) ·
 *  구룡포 과메기 2025 11/15~16(2024 11/16~17) · 거제 대구수산물 2024 12/21~22(2023 12/16~) · 모슬포 방어 2025 11/20~23(2026 11/19) ·
 *  울릉도 오징어 2025 8/4~6 · 안면도 백사장 대하 2025 9/20~27 · 소래포구 2025 9/26~28 · 여수 섬슐랭 페스타 2025 11/1.
 *  울산(정자 가자미) · 울릉 산나물 · 독도는 확인된 축제가 없어 넣지 않았다(백로그).
 */

import { REGIONAL_SPECIALTIES, specialtyOf, specialtySellMult } from './RegionalSpecialty.js';
import { WORLD_NODE_DATABASE } from '../types/WorldMap.js';

export interface FestivalDef {
  id: string;
  /** WorldMap 지역 id — 축제가 열리는 고장(값 · 매대 · 북적임 · 일손이 여기서만) */
  regionId: string;
  nameKo: string;
  nameEn: string;
  /** 축제 달(1~12) — 달 내내 가벼운 효과 */
  month: number;
  /** 절정 — [월, 일] ~ [월, 일](해마다 같은 날짜 · 끝 날 포함). 달을 넘어가도 된다 */
  peak: { from: readonly [number, number]; to: readonly [number, number] };
  /** 이 축제가 띄우는 특산(`REGIONAL_SPECIALTIES` id) */
  specialtyIds: readonly string[];
  /** 열리는 자리 한 줄 */
  placeKo: string;
  placeEn: string;
  /** 근거 — 실제 축제 · 조사한 해의 날짜 */
  noteKo: string;
  noteEn: string;
}

/** 축제 달(절정 밖) 값 배율 */
export const FESTIVAL_MONTH_MULT = 1.1;
/** 절정 주 값 배율 */
export const FESTIVAL_PEAK_MULT = 1.3;
/** 절정 주 지나다니는 사람 배율 */
export const FESTIVAL_PEAK_CROWD = 2;
/** 절정 주 축제 일손 품삯 배율 */
export const FESTIVAL_JOB_PEAK_WAGE = 1.3;
/** 축제 달 직판장 축제 매대 가공품 할인(1 − 값) */
export const FESTIVAL_STALL_OFF = { month: 0.2, peak: 0.3 } as const;

export const FESTIVALS: readonly FestivalDef[] = [
  { id: 'sokcho_sandfish_fest', regionId: 'gangwon_sokcho', nameKo: '속초 양미리·도루묵 축제', nameEn: 'Sokcho Sand Lance & Sandfish Festival',
    month: 11, peak: { from: [11, 7], to: [11, 16] }, specialtyIds: ['sokcho_sandfish'],
    placeKo: '속초항 항만부지', placeEn: 'Sokcho Port grounds',
    noteKo: '속초시수협 주최 — 2025년 제16회 11월 7일 ~ 16일(열흘) · 직거래 판매장 · 먹거리장터', noteEn: 'Sokcho fisheries co-op — 16th edition Nov 7–16, 2025 (ten days), direct-sale stalls and food court' },
  { id: 'busan_jagalchi_fest', regionId: 'busan', nameKo: '부산 자갈치축제', nameEn: 'Busan Jagalchi Festival',
    month: 10, peak: { from: [10, 17], to: [10, 26] }, specialtyIds: ['busan_mackerel'],
    placeKo: '자갈치시장 일원', placeEn: 'Around Jagalchi Market',
    noteKo: '2025년 제32회 10월 23일 ~ 26일(2026년은 10월 15일 ~ 18일) — 해마다 10월 중하순 나흘', noteEn: '32nd edition Oct 23–26, 2025 (Oct 15–18 in 2026) — four days in mid-to-late October every year' },
  { id: 'pohang_gwamegi_fest', regionId: 'gyeongbuk_pohang', nameKo: '포항 구룡포 과메기 축제', nameEn: 'Pohang Guryongpo Gwamegi Festival',
    month: 11, peak: { from: [11, 13], to: [11, 19] }, specialtyIds: ['pohang_gwamegi', 'pohang_saury'],
    placeKo: '구룡포 아라광장', placeEn: 'Ara Plaza, Guryongpo',
    noteKo: '2025년 제26회 11월 15일 ~ 16일(2024년 11월 16일 ~ 17일) — 11월 셋째 주말', noteEn: '26th edition Nov 15–16, 2025 (Nov 16–17 in 2024) — the third weekend of November' },
  { id: 'geoje_cod_fest', regionId: 'gyeongnam_geoje', nameKo: '거제 대구수산물축제', nameEn: 'Geoje Cod Seafood Festival',
    month: 12, peak: { from: [12, 15], to: [12, 23] }, specialtyIds: ['geoje_cod', 'geoje_daegupo'],
    placeKo: '장목면 외포항', placeEn: 'Oepo Port, Jangmok',
    noteKo: '2024년 제17회 12월 21일 ~ 22일(2023년 12월 16일 ~) — 12월 중하순 주말 이틀', noteEn: '17th edition Dec 21–22, 2024 (from Dec 16 in 2023) — a weekend in mid-to-late December' },
  { id: 'jeju_mosulpo_yellowtail_fest', regionId: 'jeju', nameKo: '모슬포 방어축제', nameEn: 'Moseulpo Yellowtail Festival',
    month: 11, peak: { from: [11, 19], to: [11, 23] }, specialtyIds: ['jeju_yellowtail'],
    placeKo: '모슬포항', placeEn: 'Moseulpo Port',
    noteKo: '2025년 제25회 11월 20일 ~ 23일(2026년 11월 19일 개막) — 11월 하순 목~일 · 방어 맨손잡기', noteEn: '25th edition Nov 20–23, 2025 (opens Nov 19 in 2026) — Thu–Sun in late November, bare-hand yellowtail catching' },
  { id: 'ulleung_squid_fest', regionId: 'ulleungdo', nameKo: '울릉도 오징어축제', nameEn: 'Ulleungdo Squid Festival',
    month: 8, peak: { from: [8, 3], to: [8, 9] }, specialtyIds: ['ulleung_squid'],
    placeKo: '저동항 특설무대(천부항 · 남양항)', placeEn: 'Jeodong Port stage (also Cheonbu and Namyang)',
    noteKo: '2025년 제23회 8월 4일 ~ 6일 — 오징어 맨손잡기 · 산나물 시식', noteEn: '23rd edition Aug 4–6, 2025 — bare-hand squid catching and wild-greens tasting' },
  { id: 'taean_daeha_fest', regionId: 'chungnam_taean', nameKo: '안면도 백사장 대하축제', nameEn: 'Anmyeondo Baeksajang Prawn Festival',
    month: 9, peak: { from: [9, 20], to: [9, 27] }, specialtyIds: ['taean_crab'],
    placeKo: '안면읍 백사장항', placeEn: 'Baeksajang Port, Anmyeon',
    noteKo: '2025년 제24회 9월 20일 ~ 27일 — 대하와 함께 꽃게 · 전어가 매대에 오른다', noteEn: '24th edition Sep 20–27, 2025 — prawns, plus blue crab and gizzard shad on the stalls' },
  { id: 'incheon_sorae_fest', regionId: 'incheon', nameKo: '소래포구축제', nameEn: 'Soraepogu Festival',
    month: 9, peak: { from: [9, 25], to: [9, 28] }, specialtyIds: ['incheon_crab'],
    placeKo: '소래포구 해오름광장', placeEn: 'Haeoreum Plaza, Soraepogu',
    noteKo: '2025년 9월 26일 ~ 28일 — 가을 꽃게 · 새우젓 · 계량 · 원산지 단속', noteEn: 'Sep 26–28, 2025 — autumn blue crab and salted shrimp, with scale and origin inspections' },
  { id: 'yeosu_seomchelin_fest', regionId: 'jeonnam_yeosu', nameKo: '여수 섬슐랭 페스타', nameEn: 'Yeosu Island Food Festa',
    month: 11, peak: { from: [11, 1], to: [11, 3] }, specialtyIds: ['yeosu_spanish_mackerel', 'yeosu_tonguefish'],
    placeKo: '여수 구항 일원', placeEn: 'Around Yeosu old harbor',
    noteKo: '2025년 11월 1일 — 섬 음식 잔치 · 11월 제철 삼치 · 서대', noteEn: 'Nov 1, 2025 — an island-food fair with November-season Spanish mackerel and tonguefish' },
];

export type FestivalPhase = 'none' | 'month' | 'peak';

/** KST 해 · 달 · 날 */
export function kstYmdOf(now: Date): { y: number; m: number; d: number } {
  const k = new Date(now.getTime() + 9 * 3_600_000);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate() };
}

const dayIndex = (m: number, d: number): number => m * 40 + d;

/** 절정 안인가(끝 날 포함 · 달을 넘는 범위도) */
export function inFestivalPeak(def: FestivalDef, now: Date): boolean {
  const { m, d } = kstYmdOf(now);
  const cur = dayIndex(m, d), a = dayIndex(def.peak.from[0], def.peak.from[1]), b = dayIndex(def.peak.to[0], def.peak.to[1]);
  return a <= b ? cur >= a && cur <= b : cur >= a || cur <= b;
}

export function festivalPhase(def: FestivalDef, now: Date): FestivalPhase {
  if (inFestivalPeak(def, now)) return 'peak';
  return kstYmdOf(now).m === def.month ? 'month' : 'none';
}

export function festivalById(id: string): FestivalDef | undefined {
  return FESTIVALS.find((f) => f.id === id);
}

export function festivalsOfRegion(regionId: string): FestivalDef[] {
  return FESTIVALS.filter((f) => f.regionId === regionId);
}

export function festivalsOfSpecialty(specialtyId: string): FestivalDef[] {
  return FESTIVALS.filter((f) => f.specialtyIds.includes(specialtyId));
}

/** 이 지역에서 지금 진행 중인 축제(절정이 먼저) */
export function activeFestivalsOfRegion(regionId: string, now: Date): { def: FestivalDef; phase: Exclude<FestivalPhase, 'none'> }[] {
  const out: { def: FestivalDef; phase: Exclude<FestivalPhase, 'none'> }[] = [];
  for (const def of festivalsOfRegion(regionId)) {
    const ph = festivalPhase(def, now);
    if (ph !== 'none') out.push({ def, phase: ph });
  }
  return out.sort((a, b) => (a.phase === 'peak' ? 0 : 1) - (b.phase === 'peak' ? 0 : 1));
}

/** 축제 값 배율 — 그 축제 지역 가게에서 그 축제 특산을 팔 때만(절정 1.3 · 달 1.1 · 아니면 1) */
export function festivalSellMult(specialtyId: string | undefined | null, sellRegion: string | undefined | null, now: Date): number {
  if (!specialtyId || !sellRegion) return 1;
  let best = 1;
  for (const def of festivalsOfSpecialty(specialtyId)) {
    if (def.regionId !== sellRegion) continue;
    const ph = festivalPhase(def, now);
    const m = ph === 'peak' ? FESTIVAL_PEAK_MULT : ph === 'month' ? FESTIVAL_MONTH_MULT : 1;
    if (m > best) best = m;
  }
  return best;
}

/**
 * 판매가 배율 한 번에 — 산지 제철 배율 × 산지 밖 택배 차익(`specialtySellMult`) × 축제 배율.
 * `now`는 KST 실시간(또는 dev가 옮긴 시계).
 */
export function specialtySellMultAt(key: string | undefined | null, originRegion: string | undefined | null, sellRegion: string | undefined | null, now: Date): number {
  const { m } = kstYmdOf(now);
  const base = specialtySellMult(key, originRegion, m, sellRegion);
  const d = specialtyOf(key, originRegion);
  if (!d) return base;
  return base * festivalSellMult(d.id, sellRegion, now);
}

/** 절정 첫날까지 며칠(절정 중이면 0 · 올해 지났으면 내년) */
export function daysUntilFestivalPeak(def: FestivalDef, now: Date): number {
  if (inFestivalPeak(def, now)) return 0;
  const { y, m, d } = kstYmdOf(now);
  const today = Date.UTC(y, m - 1, d);
  let start = Date.UTC(y, def.peak.from[0] - 1, def.peak.from[1]);
  if (start < today) start = Date.UTC(y + 1, def.peak.from[0] - 1, def.peak.from[1]);
  return Math.round((start - today) / 86_400_000);
}

/** 열린 지역의 축제를 가까운 순으로(진행 중이 먼저) — 일지 「나날」 */
export function upcomingFestivals(now: Date, isOpen: (regionId: string) => boolean, withinDays = 400): { def: FestivalDef; phase: FestivalPhase; days: number }[] {
  const out: { def: FestivalDef; phase: FestivalPhase; days: number }[] = [];
  for (const def of FESTIVALS) {
    if (!isOpen(def.regionId)) continue;
    const days = daysUntilFestivalPeak(def, now);
    if (days > withinDays) continue;
    out.push({ def, phase: festivalPhase(def, now), days });
  }
  const rank = (p: FestivalPhase): number => (p === 'peak' ? 0 : p === 'month' ? 1 : 2);
  return out.sort((a, b) => rank(a.phase) - rank(b.phase) || a.days - b.days);
}

const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 절정 기간 글 — 「11월 7일 ~ 16일」 · 「Nov 7–16」 */
export function festivalPeriodLabel(def: FestivalDef, locale: 'ko' | 'en' = 'ko'): string {
  const [fm, fd] = def.peak.from, [tm, td] = def.peak.to;
  if (locale === 'en') return fm === tm ? `${MONTH_EN[fm - 1]} ${fd}–${td}` : `${MONTH_EN[fm - 1]} ${fd} – ${MONTH_EN[tm - 1]} ${td}`;
  return fm === tm ? `${fm}월 ${fd}일 ~ ${td}일` : `${fm}월 ${fd}일 ~ ${tm}월 ${td}일`;
}

/** 표 무결성 — 지역 · 특산 id · 달과 절정이 맞물리는지 */
export function validateFestivals(): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  const regionIds = new Set(WORLD_NODE_DATABASE.map((n) => n.id));
  for (const f of FESTIVALS) {
    if (seen.has(f.id)) issues.push(`${f.id}: id 중복`);
    seen.add(f.id);
    if (!regionIds.has(f.regionId)) issues.push(`${f.id}: 지역 없음 ${f.regionId}`);
    if (f.month < 1 || f.month > 12) issues.push(`${f.id}: 달 ${f.month}`);
    if (f.peak.from[0] !== f.month && f.peak.to[0] !== f.month) issues.push(`${f.id}: 절정(${f.peak.from[0]}월)이 축제 달(${f.month}월) 밖`);
    for (const sid of f.specialtyIds) {
      const d = REGIONAL_SPECIALTIES.find((s) => s.id === sid);
      if (!d) { issues.push(`${f.id}: 특산 없음 ${sid}`); continue; }
      if (!d.regionIds.includes(f.regionId)) issues.push(`${f.id}: 특산 ${sid}는 ${f.regionId}의 특산이 아니다`);
    }
    if (!f.specialtyIds.length) issues.push(`${f.id}: 특산 없음`);
  }
  return issues;
}
