/**
 * @file InventorySort.ts
 * @description 277차 — 가방 자동 정리 순서(한 탭 안에서: 비슷한 물건끼리 → 이름 가나다 · 알파벳 순)
 *
 * 사용자 지시(2026-10-26): 「유사 품목(동일 탭 내 — 구멍봉돌과 고리봉돌은 둘 다 봉돌) 순 → 가나다/알파벳 순 …
 * 어떤 것이 먼저일지는 알아서 정해줘」.
 *
 * 무리 순서는 탭마다 「쓰는 차례」로 정했다.
 *  - 낚시용품: 채비를 위에서 아래로 매는 차례 — 줄(원줄 → 목줄) → 찌(부력찌 → 수중찌) → 구슬 · 쿠션 →
 *    봉돌(고리 · 구멍 → 좁쌀 → 묶음추) → 도래 → 바늘 · 카드 채비 → 지그헤드 · 웜 → 루어 → 타이라바 → 미끼(생 → 냉동 → 반죽 → 선어).
 *    무리는 채비 부품 종류(`partKindOf`)로 가른다 — 소분류가 같은 「채비 부속」 45종도 찌 · 봉돌 · 도래로 나뉜다.
 *  - 장비: 손에 드는 것(낚싯대 → 릴 → 뜰채 · 손도구) → 가방 → 머리부터 발끝까지 입는 차례.
 *  - 소모품 · 음식 · 퀘스트 · 기타: 자주 꺼내는 것 먼저(아래 표 순서).
 * 표에 없는 소분류는 표 뒤에 소분류 이름 순으로 놓는다 — 같은 소분류끼리는 언제나 붙어 있다.
 *
 * 같은 무리 안에서는 **화면에 보이는 이름**(언어 설정을 따른다)으로 가나다 · 알파벳 순이다.
 * 숫자는 크기 순(2호 < 10호 · 38cm < 45cm). 이름까지 같으면 신선한 것 → 많은 것 → id 순(늘 같은 결과).
 */

import type { InvCategory, InvCondition, InvItem } from './InventoryStore.js';
import { partKindOf, isPackItem } from './RigParts.js';
import { PRODUCE_SUB, PIECE_SUB, SEED_SUB, FARM_SUB } from '../data/CropItems.js';
import { getLocale, t } from '../i18n/I18n.js';
import type { RigPartKind } from '@tra/core';

/** 낚시용품 — 채비 부품 종류의 차례(위 → 아래로 매는 차례 · 완제품 · 루어 · 미끼) */
const TACKLE_KIND_ORDER: RigPartKind[] = [
  'main_line', 'leader_line',
  'float', 'sub_float',
  'bead', 'cushion',
  'sliding_sinker', 'split_shot', 'bundle_sinker',
  'swivel_plain', 'swivel_snap',
  'hook', 'card_rig',
  'jig_head', 'soft_lure',
  'hard_lure',
  'tairaba_head', 'tairaba_skirt', 'tairaba_necktie',
  'bait',
];

/** 미끼 무리 안의 차례(소분류) */
const BAIT_SUB_ORDER = ['생미끼', '냉동미끼', '반죽미끼', '선어미끼'];

/** 탭별 소분류 차례 — 낚시용품은 부품 종류가 먼저고, 부품이 아닌 것(편대 등)이 여기로 온다 */
const SUB_ORDER: Record<InvCategory, string[]> = {
  gear: ['낚싯대', '릴', '손도구', '가방', '모자', '안경', '상의', '장갑', '시계', '하의', '신발'],
  consumable: ['집어제/밑밥', '보냉', '의약품', '구급품', '스프레이/오일', '장비 수리', '야간 대비', '연료',
    '양념', '조미/손질', SEED_SUB, FARM_SUB],
  food: ['어획물', '채집물', '해파리', '불가사리', '손질 통마리', '손질 필렛', '엔가와', '부산물', '수산물',
    '요리(회)', '요리(숙회)', '요리', '보양식', PRODUCE_SUB, PIECE_SUB, '식자재', '가공품'],
  tackle: ['편대'],
  lure: ['루어', '지그헤드'],
  quest: ['이야기 물건', '심부름'],
  etc: ['낚시도구', '해루질 도구', '통발', '설치형', '화구', '조리도구', '식기', '가구', '재료', FARM_SUB,
    '도면', '증서', '탈것', '잡동사니'],
};

/** 이름까지 같을 때 — 신선한 것 먼저 */
const CONDITION_ORDER: Record<InvCondition, number> = {
  live: 0, fresh: 1, chilled: 2, normal: 3, frozen: 4, thawed: 5, bad: 6, spoiled: 7,
};

/** 표에 없는 소분류가 놓이는 자리 — 표 뒤 */
const UNLISTED = 10_000;

/** 무리 키 — [차례 번호, 같은 번호 안에서 소분류 이름] */
export function sortGroupOf(it: InvItem): [number, string] {
  const sub = it.subCategory ?? '';
  if (it.category === 'tackle' || it.category === 'lure') {
    // 279차 — 곽 · 갑은 채비 부품이 아니지만(`partKindOf` = null) 정리할 때는 미끼 무리에 둔다
    const kind = partKindOf(it) ?? (isPackItem(it) && (sub.includes('미끼') || sub === '생미끼') ? 'bait' : null);
    if (kind) {
      const k = TACKLE_KIND_ORDER.indexOf(kind);
      if (kind === 'bait') {
        const b = BAIT_SUB_ORDER.indexOf(sub);
        return [k * 100 + (b >= 0 ? b : 50), b >= 0 ? '' : sub];
      }
      return [k * 100, ''];
    }
  }
  // 장비 — 손도구 중 낚싯대는 「낚싯대」 무리(시드 낚싯대는 소분류가 「손도구」다)
  const key = it.category === 'gear' && it.tool === 'rod' ? '낚싯대' : sub;
  const order = SUB_ORDER[it.category] ?? [];
  const i = order.indexOf(key);
  // 낚시용품의 부품이 아닌 것은 부품 무리 뒤에 온다
  const base = it.category === 'tackle' || it.category === 'lure' ? TACKLE_KIND_ORDER.length * 100 : 0;
  return i >= 0 ? [base + i, ''] : [UNLISTED, key];
}

/** 화면에 보이는 이름 — 영어 설정이면 번역된 이름으로 줄 세운다 */
function shownName(it: InvItem): string {
  return getLocale() === 'en' ? t(it.name) : it.name;
}

/** 정리 비교 함수를 만든다(언어에 맞는 사전 순 · 숫자 크기 순) */
export function inventorySortCompare(): (a: InvItem, b: InvItem) => number {
  const coll = new Intl.Collator(getLocale() === 'en' ? 'en' : 'ko', { numeric: true, sensitivity: 'base' });
  return (a, b) => {
    const [ra, ka] = sortGroupOf(a);
    const [rb, kb] = sortGroupOf(b);
    if (ra !== rb) return ra - rb;
    if (ka !== kb) return coll.compare(ka, kb);
    const byName = coll.compare(shownName(a), shownName(b));
    if (byName !== 0) return byName;
    const ca = a.condition ? CONDITION_ORDER[a.condition] ?? 9 : 9;
    const cb = b.condition ? CONDITION_ORDER[b.condition] ?? 9 : 9;
    if (ca !== cb) return ca - cb;
    if (a.qty !== b.qty) return b.qty - a.qty;
    return coll.compare(a.id, b.id);   // 282차 — 개체 번호(`x#2` < `x#10`)도 숫자 순
  };
}
