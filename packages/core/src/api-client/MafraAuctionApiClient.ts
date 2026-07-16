/**
 * @file MafraAuctionApiClient.ts
 * @description 농식품 공공데이터 포털(data.mafra.go.kr) 수산물 도매 경락가격 API 클라이언트
 *
 * 실호출 검증 완료 (2026-07-16):
 *  - 호출 형식: http://211.237.50.150:7080/openapi/{API_KEY}/{TYPE}/{GRID_ID}/{START}/{END}?DATES=YYYYMMDD
 *  - API 1) 수산물도매시장별도매경락가격조회: Grid_20220822000000000623_1 (UNITNAME 규격 포함)
 *  - API 2) 수산물품목별도매경락가격조회:     Grid_20220818000000000621_1
 *  - 선택 파라미터: MCLASSNAME(품목명), SCLASSNAME(품종명), MARKETNAME(도매시장명), CONAME(도매법인명)
 *  - 응답: { [gridId]: { totalCnt, startRow, endRow, row: MafraFishPriceRow[] } }
 *  - 데이터 수록 범위: 2000-01-04 ~ 2023-12-31 (과거 이력 데이터)
 *    → 게임에서는 현재 날짜의 "같은 월/일 2023년" 시세를 사용해 계절성을 재현하고,
 *      해당 일자에 거래가 없으면(휴장) 하루씩 거슬러 최대 7일 탐색한다.
 *
 * 주의: End Point가 HTTP(비보안)이므로 HTTPS 페이지에서 직접 호출 시 혼합 콘텐츠로
 * 차단될 수 있음 — 그 경우 개발 프록시/서버 경유 필요. 실패 시 Mock 폴백.
 */

import { WholesalePriceInfo } from '../types/Economy.js';
import { getMockWholesalePrices } from './AuctionPriceApiClient.js';

/** 경락가격 응답 행 (실측 필드 — 도매시장별 API는 UNITNAME 추가) */
export interface MafraFishPriceRow {
  ROW_NUM: number;
  /** 경매일 (YYYYMMDD) */
  DATES: string;
  /** 품목명 (예: '넙치', '가자미', '갈치') */
  MCLASSNAME: string;
  /** 품종명 (예: '도다리', '참돔', '기타') */
  SCLASSNAME: string;
  /** 등급 (예: '자연산 보통') */
  GRADENAME: string;
  /** 평균가 (원) */
  AVGPRICE: number;
  /** 최고가 (원) */
  MAXPRICE: number;
  /** 최저가 (원) */
  MINPRICE: number;
  /** 거래량 */
  SUMAMT: number;
  /** 도매시장명 */
  MARKETNAME: string;
  /** 도매법인명 */
  CONAME: string;
  /** 규격 (도매시장별 API만) */
  UNITNAME?: string;
}

/** MAFRA Grid 공통 응답 래퍼 */
export interface MafraGridResponse<T> {
  totalCnt: number;
  startRow: number;
  endRow: number;
  result?: { code: string; message: string };
  row?: T[];
}

/** 조회 옵션 (선택 파라미터) */
export interface MafraQueryOptions {
  /** 품목명 필터 (예: '넙치') */
  itemName?: string;
  /** 품종명 필터 */
  varietyName?: string;
  /** 도매시장명 필터 (예: '수원도매시장') */
  marketName?: string;
  /** 도매법인명 필터 */
  coName?: string;
  /** 조회 개수 (기본 300) */
  maxRows?: number;
}

/** Grid ID — 활용신청 승인 API 2종 */
const GRID_BY_MARKET = 'Grid_20220822000000000623_1';  // 수산물도매시장별도매경락가격조회
const GRID_BY_ITEM = 'Grid_20220818000000000621_1';    // 수산물품목별도매경락가격조회

/** 데이터 수록 마지막 연도 (2000-01-04 ~ 2023-12-31) */
const DATASET_LAST_YEAR = 2023;

/**
 * MAFRA 품목명(MCLASSNAME)/품종명(SCLASSNAME) → 게임 어종 ID 매칭 테이블.
 * 품목명 우선 매칭, '돔'처럼 포괄 품목은 품종명으로 세분화.
 */
export const MAFRA_ITEM_TO_SPECIES: { item: string; variety?: string; speciesId: string }[] = [
  { item: '감성돔', speciesId: 'black_seabream' },
  { item: '돔', variety: '참돔', speciesId: 'red_seabream' },
  { item: '돔', variety: '돌돔', speciesId: 'stone_beakperch' },
  { item: '돔', variety: '벵어돔', speciesId: 'largescale_blackfish' },
  { item: '돔', variety: '벵에돔', speciesId: 'largescale_blackfish' },
  { item: '넙치', speciesId: 'flatfish' },
  { item: '광어', speciesId: 'flatfish' },
  { item: '가자미', speciesId: 'flounder' },
  { item: '갈치', speciesId: 'hairtail' },
  { item: '고등어', speciesId: 'chub_mackerel' },
  { item: '전갱이', speciesId: 'horse_mackerel' },
  { item: '농어', speciesId: 'sea_bass' },
  { item: '숭어', variety: '가숭어', speciesId: 'redlip_mullet' },
  { item: '숭어', variety: '밀치', speciesId: 'redlip_mullet' },
  { item: '밀치', speciesId: 'redlip_mullet' },
  { item: '숭어', speciesId: 'striped_mullet' },
  { item: '벵에돔', speciesId: 'largescale_blackfish' },
  { item: '벵어돔', speciesId: 'largescale_blackfish' },
  { item: '돔', variety: '긴꼬리', speciesId: 'longtail_blackfish' },
  { item: '방어', speciesId: 'yellowtail' },
  { item: '부시리', speciesId: 'amberjack' },
  { item: '노래미', speciesId: 'greenling' },
  { item: '쥐노래미', speciesId: 'fat_greenling' },
  { item: '우럭', speciesId: 'black_rockfish' },
  { item: '조피볼락', speciesId: 'black_rockfish' },
  { item: '볼락', speciesId: 'dark_banded_rockfish' },
  { item: '붕장어', speciesId: 'conger_eel' },
  { item: '장어', variety: '붕장어', speciesId: 'conger_eel' },
  { item: '복어', speciesId: 'tiger_puffer' },

  // ── 신규 어종 12종 (2026-07-16) ──
  // 주의: 매칭은 부분 일치(includes)이므로 품목명이 포함 관계면 '더 긴 쪽'을 먼저 둘 것.
  //       ('말쥐치'⊃'쥐치', '강도다리'⊃'도다리') 순서가 뒤바뀌면 오매칭된다.
  { item: '가자미', variety: '강도다리', speciesId: 'starry_flounder' },
  { item: '가자미', variety: '문치', speciesId: 'flounder' },
  { item: '가자미', variety: '도다리', speciesId: 'flounder' },
  { item: '장어', variety: '갯장어', speciesId: 'pike_conger' },
  { item: '말쥐치', speciesId: 'black_scraper' },
  { item: '쥐치', speciesId: 'filefish' },
  { item: '강도다리', speciesId: 'starry_flounder' },
  { item: '도다리', speciesId: 'flounder' },      // 시장 유통 '도다리'는 통상 문치가자미
  { item: '문치가자미', speciesId: 'flounder' },
  { item: '개서대', speciesId: 'tonguefish' },
  { item: '서대', speciesId: 'tonguefish' },
  { item: '갯장어', speciesId: 'pike_conger' },
  { item: '하모', speciesId: 'pike_conger' },
  { item: '꽁치', speciesId: 'pacific_saury' },
  { item: '눈볼대', speciesId: 'blackthroat_seaperch' },
  { item: '금태', speciesId: 'blackthroat_seaperch' },
  { item: '눈퉁멸', speciesId: 'round_herring' },
  { item: '대구', speciesId: 'pacific_cod' },
  { item: '덕대', speciesId: 'korean_pomfret' },
  { item: '병어', speciesId: 'silver_pomfret' },
  { item: '도루묵', speciesId: 'sandfish' },
];

/** MAFRA 행 → 게임 어종 ID (매칭 실패 시 undefined) */
export function matchMafraSpecies(row: Pick<MafraFishPriceRow, 'MCLASSNAME' | 'SCLASSNAME'>): string | undefined {
  const item = row.MCLASSNAME ?? '';
  const variety = row.SCLASSNAME ?? '';
  // 품종 지정 매칭 우선
  for (const m of MAFRA_ITEM_TO_SPECIES) {
    if (m.variety && item.includes(m.item) && variety.includes(m.variety)) return m.speciesId;
  }
  for (const m of MAFRA_ITEM_TO_SPECIES) {
    if (!m.variety && item.includes(m.item)) return m.speciesId;
  }
  return undefined;
}

/** 현재 날짜 → 데이터셋 수록 연도(2023)의 같은 월/일 (계절성 유지) */
export function mapToDatasetDate(now: Date): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${DATASET_LAST_YEAR}${mm}${dd}`;
}

/** YYYYMMDD 하루 전 */
function prevDay(ymd: string): string {
  const d = new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

export class MafraAuctionApiClient {
  private readonly apiKey: string;
  private readonly useMock: boolean;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl = 'http://211.237.50.150:7080/openapi') {
    this.apiKey = apiKey ?? '';
    this.useMock = !apiKey;
    this.baseUrl = baseUrl;
  }

  /** Grid 공통 호출 */
  private async callGrid(gridId: string, dates: string, opts: MafraQueryOptions = {}): Promise<MafraFishPriceRow[]> {
    const end = opts.maxRows ?? 300;
    const url = new URL(`${this.baseUrl}/${this.apiKey}/json/${gridId}/1/${end}`);
    url.searchParams.set('DATES', dates);
    if (opts.itemName) url.searchParams.set('MCLASSNAME', opts.itemName);
    if (opts.varietyName) url.searchParams.set('SCLASSNAME', opts.varietyName);
    if (opts.marketName) url.searchParams.set('MARKETNAME', opts.marketName);
    if (opts.coName) url.searchParams.set('CONAME', opts.coName);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    const root = data?.[gridId] as MafraGridResponse<MafraFishPriceRow> | undefined;
    if (root?.result && root.result.code && root.result.code !== 'INFO-000' && root.result.code !== '') {
      throw new Error(`${root.result.code}: ${root.result.message}`);
    }
    return Array.isArray(root?.row) ? root.row : [];
  }

  /**
   * API 1) 수산물도매시장별도매경락가격조회 (규격 UNITNAME 포함).
   * 네트워크/응답 오류 시 빈 배열 대신 throw — 상위에서 폴백 처리.
   */
  async fetchByMarket(dates: string, opts: MafraQueryOptions = {}): Promise<MafraFishPriceRow[]> {
    return this.callGrid(GRID_BY_MARKET, dates, opts);
  }

  /** API 2) 수산물품목별도매경락가격조회 */
  async fetchByItem(dates: string, opts: MafraQueryOptions = {}): Promise<MafraFishPriceRow[]> {
    return this.callGrid(GRID_BY_ITEM, dates, opts);
  }

  /**
   * 게임 소비용 일괄 시세 수집:
   * 오늘 날짜를 2023년 동월동일로 매핑(계절성 유지) → 휴장 시 최대 7일 역탐색 →
   * 어종 매칭 행을 speciesId별 가중 평균(거래량 가중)으로 집계해
   * WholesalePriceInfo[]로 정규화한다. 실패/키 미설정 시 결정적 Mock 시세 폴백.
   */
  async fetchSeafoodPrices(now = new Date()): Promise<{ items: WholesalePriceInfo[]; isRealData: boolean; datasetDate?: string }> {
    const todayYmd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    if (this.useMock) {
      return { items: getMockWholesalePrices(todayYmd), isRealData: false };
    }

    try {
      // 하루 거래만으로는 어종 수가 적을 수 있어 (주말/휴장/소규모 시장)
      // 동월동일부터 최대 7일치를 역방향 누적 — 매칭 어종이 8종 이상이면 조기 종료
      const agg = new Map<string, { sumPW: number; sumW: number; max: number; min: number; vol: number; item: string; variety: string; grade: string }>();
      let dates = mapToDatasetDate(now);
      let usedDate = dates;
      let anyRows = false;

      for (let attempt = 0; attempt < 7; attempt++) {
        const rows = await this.fetchByMarket(dates);
        if (rows.length > 0) {
          anyRows = true;
          usedDate = dates;
          for (const row of rows) {
            const speciesId = matchMafraSpecies(row);
            if (!speciesId) continue;
            const avg = Number(row.AVGPRICE);
            const w = Math.max(1, Number(row.SUMAMT) || 1);
            if (!Number.isFinite(avg) || avg <= 0) continue;
            const cur = agg.get(speciesId) ?? { sumPW: 0, sumW: 0, max: 0, min: Infinity, vol: 0, item: row.MCLASSNAME, variety: row.SCLASSNAME, grade: row.GRADENAME };
            cur.sumPW += avg * w;
            cur.sumW += w;
            cur.max = Math.max(cur.max, Number(row.MAXPRICE) || avg);
            cur.min = Math.min(cur.min, Number(row.MINPRICE) || avg);
            cur.vol += w;
            agg.set(speciesId, cur);
          }
          if (agg.size >= 8) break;
        }
        dates = prevDay(dates);
      }
      if (!anyRows) throw new Error('7일 내 거래 데이터 없음');
      if (agg.size === 0) throw new Error('어종 매칭 행 없음');

      const items: WholesalePriceInfo[] = [];
      agg.forEach((a, speciesId) => {
        items.push({
          speciesId,
          itemName: a.item,
          breedName: a.variety,
          gradeName: a.grade,
          tradeWeightKg: 1,
          avgPricePerKg: Math.round(a.sumPW / a.sumW),
          maxPricePerKg: Math.round(a.max),
          minPricePerKg: Math.round(a.min === Infinity ? a.sumPW / a.sumW : a.min),
          totalVolumeKg: a.vol,
          auctionDate: new Date(),
        });
      });
      return { items, isRealData: true, datasetDate: usedDate };
    } catch (e) {
      console.warn('[MafraAuctionApiClient] API 실패 — Mock 시세 폴백:', e);
      return { items: getMockWholesalePrices(todayYmd), isRealData: false };
    }
  }
}
