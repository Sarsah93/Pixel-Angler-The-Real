/**
 * @file WeightFormat.ts
 * @description 332차 — **손질 산출물 무게 표기**(순수 TS).
 *
 * 사용자 지시(2026-11-20): 「손질 부속 무게가 1000g이 넘어가면 kg로 표시해주고, 그 뒤에 세부 g을 적어줄 것」.
 *  - 1,000g 미만: 「850g」(전과 같다)
 *  - 1,000g 이상: 「18.3kg(18,269g)」 — kg은 소수 한 자리(반올림), 괄호 안은 정확한 g(천 단위 쉼표)
 * 큰 고기(참다랑어 · 새치)의 덩어리 · 가마살 · 머리는 수 kg ~ 수십 kg이라 g만으로는 한눈에 안 읽힌다.
 * 이름에 박힌 옛 표기(「… 18,269g」 · 「… 18269g」)는 `upgradeWeightSuffix`가 불러올 때 새 표기로 바꾼다.
 */

/** 천 단위 쉼표(로케일에 기대지 않는다 — 환경마다 `toLocaleString` 결과가 달라지지 않게) */
function comma(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 무게(g) → 표기. 1,000g 미만 「850g」 · 이상 「18.3kg(18,269g)」 */
export function formatGramsKo(g: number): string {
  const v = Math.max(0, Math.round(g));
  if (v < 1000) return `${v}g`;
  return `${(v / 1000).toFixed(1)}kg(${comma(v)}g)`;
}

/**
 * 이름 끝의 옛 무게 표기를 새 표기로 — 「참다랑어 가마살 2,269g」 → 「참다랑어 가마살 2.3kg(2,269g)」.
 * 이미 새 표기(끝이 `kg(…g)`)이거나 1,000g 미만이거나 끝이 무게가 아니면 그대로 돌려준다.
 */
export function upgradeWeightSuffix(name: string): string {
  if (/kg\([\d,]+g\)$/.test(name)) return name;
  const m = /^(.*\s)(\d{1,3}(?:,\d{3})+|\d+)g$/.exec(name);
  if (!m) return name;
  const g = Number(m[2].replace(/,/g, ''));
  if (!Number.isFinite(g) || g < 1000) return name;
  return `${m[1]}${formatGramsKo(g)}`;
}
