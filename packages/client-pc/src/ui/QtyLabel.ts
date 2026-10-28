/**
 * @file QtyLabel.ts
 * @description 284차 — 가방 수량 글 한 벌: 낱개는 「x5」, 무게로 세는 물건(`InvItem.unitG` — 털어 낸 깨 · 콩 · 보리 낱알 · 밭 부산물 · 깻묵)은
 *   「480g」 · 「1.25kg」. 칸 귀퉁이 · 목록 줄 · 기록 문장이 같은 함수를 쓴다(「×480」처럼 g을 개수로 읽히지 않게).
 */

/** g → 사람 말(1,000g부터 kg · 소수 둘째 자리까지 · 끝 0은 뗀다) */
export function gramsText(g: number): string {
  const n = Math.max(0, Math.round(g));
  if (n < 1000) return `${n}g`;
  const kg = (n / 1000).toFixed(n >= 10000 ? 1 : 2).replace(/\.?0+$/, '');
  return `${kg}kg`;
}

/** 무게로 세는 물건인가 */
export function isWeighed(i: { unitG?: number }): boolean {
  return !!i.unitG;
}

/** 칸 귀퉁이 수량 글 — 낱개 1개는 빈 글 · 무게 물건은 늘 g */
export function qtyBadge(i: { qty: number; unitG?: number }, prefix = 'x'): string {
  if (i.unitG) return gramsText(i.qty * i.unitG);
  return i.qty > 1 ? `${prefix}${i.qty}` : '';
}

/** 목록 줄 · 기록 문장의 수량 — n개(무게 물건은 n × unitG g). 낱개는 1개도 「x1」 */
export function qtyWord(i: { unitG?: number }, n: number, prefix = 'x'): string {
  return i.unitG ? gramsText(n * i.unitG) : `${prefix}${n}`;
}
