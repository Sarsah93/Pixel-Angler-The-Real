/**
 * 어종 id 마이그레이션 — 구세이브에 남은 폐기 어종 id를 현행 id로 옮긴다.
 *
 * 어종을 통폐합하면 이미 저장된 어획물·도감·쿨러 개체가 **존재하지 않는 id**를 가리키게 된다.
 * 그대로 두면 상세보기·도감·판매가 조회가 전부 폴백으로 떨어지므로, 로드 시점에 한 번 갈아끼운다.
 * (세이브 하위호환 원칙 — 유저 상태(중량·길이·신선도)는 그대로 두고 id만 바꾼다.)
 */

/** 폐기 어종 id → 대체 어종 id */
export const SPECIES_ID_MIGRATION: Readonly<Record<string, string>> = Object.freeze({
  // 171차 — '볼락'은 청볼락·황볼락을 아우르는 상위 이름이라 별도 종으로 두지 않는다(사용자 지시).
  //   구 일반 볼락의 형질(야간 상층 보일링)은 청볼락이 흡수했다.
  dark_banded_rockfish: 'blue_rockfish',
});

/** 어종 id 한 건을 현행 id로 옮긴다 (해당 없으면 원본 그대로). */
export function migrateSpeciesId(id: string | undefined): string | undefined {
  if (!id) return id;
  return SPECIES_ID_MIGRATION[id] ?? id;
}

/** 어획물 아이템 id 안에 박힌 어종 id까지 옮긴다 (`inv_catch_<speciesId>_<seq>` 규칙). */
export function migrateCatchItemId(itemId: string): string {
  for (const [from, to] of Object.entries(SPECIES_ID_MIGRATION)) {
    if (itemId.includes(from)) return itemId.replace(from, to);
  }
  return itemId;
}
