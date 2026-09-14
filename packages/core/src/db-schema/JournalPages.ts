/**
 * @file JournalPages.ts
 * @description 「동명 조행록」 빈 17장 = 17개 지역 (134차, STORY_SPEC_v3 §7 확정표 + §0.5 어종 id 정합)
 *
 * 한 장을 채우는 조건은 둘 다: ① 그 지역 지표 어종을 제철에 **자가어획**(계측, 방생 가능) ②
 * 그 지역 서브 아크 완주. 어획만으로도, 대화만으로도 안 된다("한 마리가 사람 사이를 잇는다").
 *
 * ⚖ §0.5 어종 대체(레포 미등록 종): 1 임연수어 → **도루묵** · 4 호래기 → **볼락**(§7-4-3 대체안) ·
 *   7 지세포 볼락 → **광어**(같은 대체안) · 10 주꾸미 → **갑오징어**. `substitutedFrom`에 원안 표기.
 *   추가 권장(어종 등록 시 되돌린다): 임연수어·호래기·주꾸미·청어·살오징어·망둥어.
 * ⚠ 지역 하위 권역(거제 동/남, 태안 안흥/만리포, 제주 3)은 OSM 확장 전이라 `areaKey`로만 예약.
 */

import type { JournalPageDef } from '../types/Story.js';

export const JOURNAL_PAGES: JournalPageDef[] = [
  { page: 1, regionId: 'gangwon_sokcho', labelKo: '속초 동명항', labelEn: 'Sokcho — Dongmyeong Port',
    speciesId: 'sandfish', seasons: ['winter'], howKo: '겨울 새벽 04~07시 · 방파제', howEn: 'Winter dawn 04–07 · breakwater',
    arcId: 'N04', substitutedFrom: '임연수어' },
  { page: 2, regionId: 'busan', areaKey: 'busan_area_gamcheon_west', labelKo: '부산 감천항', labelEn: 'Busan — Gamcheon Port',
    speciesId: 'black_seabream', seasons: ['winter'], howKo: '겨울 피크 · 찌낚시', howEn: 'Winter peak · float rig', minCm: 40, arcId: 'N06' },
  { page: 3, regionId: 'busan', areaKey: 'busan_area_amnam', labelKo: '부산 암남공원', labelEn: 'Busan — Amnam Park',
    speciesId: 'horse_mackerel', seasons: ['winter'], howKo: '겨울 야간 루어', howEn: 'Winter night lure', arcId: 'N05' },
  { page: 4, regionId: 'busan', areaKey: 'busan_area_baekunpo', labelKo: '부산 백운포', labelEn: 'Busan — Baegunpo',
    speciesId: 'dark_banded_rockfish', seasons: ['winter'], howKo: '겨울 야간 · 볼락 루어', howEn: 'Winter night · rockfish lure',
    count: 3, arcId: 'N07', substitutedFrom: '호래기' },
  { page: 5, regionId: 'ulsan', labelKo: '울산 방어진', labelEn: 'Ulsan — Bangeojin',
    speciesId: 'yellowtail', seasons: ['winter'], howKo: '겨울 11~1월 · 선상 지깅', howEn: 'Winter Nov–Jan · boat jigging', minCm: 40, arcId: 'N08' },
  { page: 6, regionId: 'gyeongbuk_pohang', labelKo: '포항 구룡포', labelEn: 'Pohang — Guryongpo',
    speciesId: 'red_seabream', seasons: ['spring', 'autumn'], howKo: '봄·가을 새벽/저녁 · 타이라바', howEn: 'Spring/autumn dawn or dusk · tai-rubber', arcId: 'N09' },
  { page: 7, regionId: 'gyeongnam_geoje', areaKey: 'geoje_east', labelKo: '거제 지세포', labelEn: 'Geoje — Jisepo',
    speciesId: 'flatfish', seasons: ['spring', 'autumn'], howKo: '봄·가을 주간 · 지그헤드 다운샷', howEn: 'Spring/autumn daytime · jighead downshot',
    arcId: 'N11', substitutedFrom: '볼락' },
  { page: 8, regionId: 'gyeongnam_geoje', areaKey: 'geoje_south', labelKo: '거제 해금강', labelEn: 'Geoje — Haegeumgang',
    speciesId: 'largescale_blackfish', seasons: ['summer'], howKo: '초여름 · 갯바위', howEn: 'Early summer · rocks', arcId: 'N01' },
  { page: 9, regionId: 'jeonnam_yeosu', labelKo: '여수', labelEn: 'Yeosu',
    speciesId: 'hairtail', seasons: ['summer', 'autumn'], howKo: '초여름~가을 야간 · 루어 또는 선상', howEn: 'Early summer–autumn night · lure or boat', arcId: 'N12' },
  { page: 10, regionId: 'chungnam_taean', areaKey: 'taean_anheung', labelKo: '태안 안흥', labelEn: 'Taean — Anheung',
    speciesId: 'cuttlefish', seasons: ['autumn'], howKo: '가을 주간 · 에깅', howEn: 'Autumn daytime · egging', arcId: 'N13', substitutedFrom: '주꾸미' },
  { page: 11, regionId: 'chungnam_taean', areaKey: 'taean_manripo', labelKo: '태안 만리포', labelEn: 'Taean — Mallipo',
    speciesId: 'sea_bass', seasons: ['spring', 'summer'], howKo: '봄~여름 포말대 야간 · 서프 루어', howEn: 'Spring–summer surf-zone night · surf lure', arcId: 'N02' },
  { page: 12, regionId: 'jeju', areaKey: 'jeju_city', labelKo: '제주 도두항', labelEn: 'Jeju — Dodu Port',
    speciesId: 'swordtip_squid', seasons: ['summer'], howKo: '여름 야간 · 집어등', howEn: 'Summer night · fishing lights', count: 3, arcId: 'N14' },
  { page: 13, regionId: 'jeju', areaKey: 'jeju_moseulpo', labelKo: '제주 모슬포', labelEn: 'Jeju — Moseulpo',
    speciesId: 'yellowtail', seasons: ['winter'], howKo: '겨울 11~1월 · 대물 지깅', howEn: 'Winter Nov–Jan · big-fish jigging', minCm: 80, arcId: 'N10' },
  { page: 14, regionId: 'jeju', areaKey: 'jeju_seogwipo', labelKo: '제주 서귀포', labelEn: 'Jeju — Seogwipo',
    speciesId: 'squid', seasons: ['autumn'], howKo: '가을 야간 얕은 곳 · 에기', howEn: 'Autumn night shallows · egi', arcId: 'N14' },
  { page: 15, regionId: 'incheon', labelKo: '인천 연안부두', labelEn: 'Incheon — Yeonan Pier',
    speciesId: 'black_rockfish', seasons: ['autumn'], howKo: '가을 야간 대물', howEn: 'Autumn night, big one', minCm: 30, arcId: 'N17' },
  { page: 16, regionId: 'ulleungdo', labelKo: '울릉도', labelEn: 'Ulleungdo',
    speciesId: 'amberjack', seasons: ['summer', 'autumn'], howKo: '여름~가을 · 지깅/파핑', howEn: 'Summer–autumn · jigging/popping', arcId: 'N15' },
  { page: 17, regionId: 'dokdo', labelKo: '독도', labelEn: 'Dokdo',
    speciesId: 'stone_beakperch', seasons: ['summer', 'autumn'], howKo: '여름~가을 · 계측 후 즉시 방류', howEn: 'Summer–autumn · measure and release', releaseAfter: true, arcId: 'N16' },
];

export function getJournalPage(page: number): JournalPageDef | undefined {
  return JOURNAL_PAGES.find((p) => p.page === page);
}

/** 어획 이벤트가 이 장의 어획 조건을 만족하는가 (계절·체장·마릿수는 호출부가 누적) */
export function journalCatchMatches(p: JournalPageDef, ev: { speciesId: string; lengthCm: number; season: string; selfCaught: boolean }): boolean {
  if (!ev.selfCaught) return false;
  if (ev.speciesId !== p.speciesId) return false;
  if (!p.seasons.includes(ev.season as JournalPageDef['seasons'][number])) return false;
  if (p.minCm && ev.lengthCm < p.minCm) return false;
  return true;
}
