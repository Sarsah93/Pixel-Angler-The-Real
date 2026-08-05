---
name: save-migration
description: Pixel Angler 세이브 하위호환 규칙. 아이템/스토어에 새 필드·게이트·아이템을 추가하거나 serialize/deserialize를 수정할 때 반드시 로드. "세이브", "마이그레이션", "구세이브", "deserialize", "새 아이템 필드", "하위호환" 작업이면 이 스킬을 따른다.
---

# 세이브 하위호환·시드 복원

**대전제: 세이브는 항상 과거 스키마일 수 있다 — 최신 스키마를 가정하지 말 것.** (사용자 정책 2026-07-30)

## 아이템에 정적 기능 필드를 추가하면 (tool/equippable/placeKey/게이트 플래그 등)

`InventoryStore.deserialize`의 시드 백필 마이그레이션에 그 필드를 추가한다 (InventoryStore.ts ~755행):

```ts
const seedById = new Map(createSeedItems().map((sd) => [sd.id, sd]));
// 아이템 매핑에서: 누락분만 복원
newField: i.newField ?? sd?.newField,
```

- **`??`만 사용** — null/undefined만 채우므로 명시적 false·0은 보존된다.
- **유저 상태는 절대 덮어쓰지 않는다**: qty · condition · conditionSinceMs · equipped · equippedHand · slot 등은 저장값 유지.
- 시드에 없는 상점 구매분까지 복원해야 하면 판별 함수로 강제 복원 (예: `isKnifeItem(id)` → tool 'knife' — 53차 패턴).
- 위반 사례(반면교사): 회칼이 tool 없이 저장돼 손 장착 불가(53차) / 착용품이 소켓 점유한 채 저장 → 로드 시 `slot: i.equipped ? SLOT_EQUIPPED : i.slot` 반납(72차).

## 신규 로직의 폴백 3단계

세이브에 없을 수 있는 값을 소비하는 신규 로직은 반드시:
1. **시드 백필** (위)
2. **이름/ID 휴리스틱 폴백** (예: floatBuoyG 미보유 시 이름 추정, speciesId → 텍스처 폴백)
3. **안전 기본값**
— **폴백 없이 신규 필드 강제 참조 금지.**

## 구세이브에 신규 아이템을 반드시 지급해야 하면

deserialize에서 **부재 시 주입**: `if (!this.find(id)) addItem(...)` (`createDevFishDefs` 패턴 — dev 게이트 여부 확인). 단 유저가 팔았을 수 있는 소모/판매 아이템은 재주입 신중(놀람 방지).

## 적용 시점 — 사용자 안내 문구까지

- deserialize는 **세이브 로드 시**(loadFromSlot → applySaveData) 실행 → 기존 세이브도 재로드하면 적용.
- **이미 실행 중인 라이브 세션은 재로드(하드리프레시/메인메뉴 불러오기) 필요** — 검증·안내 시 명시 (53차에서 사용자 혼선).
- 코드 레벨 변경(게이팅/렌더/DB)은 세이브 무관 즉시 적용.

## 신선도/시간 관련

- **오프라인(게임 종료) 중 신선도 정지**: deserialize에서 `savedAtMs` 기준 오프라인 갭만큼 `conditionSinceMs`(+쿨러 lastSyncMs/mediumSetAtMs)를 앞으로 민다 — wall-clock 전체 적용 시 "즉시 부패" 버그(39차).

## 검증

- localStorage 슬롯에 **구세이브를 직접 심어**(신규 필드 제거한 JSON) loadFromSlot 경로로 마이그레이션 확인 — 실 스토어(`__INV`/`__GS`) 기준 (verify-render 스킬).
- 검사 항목: 복원된 필드 / 보존된 유저 상태 / 신규게임(resetAll) 회귀 없음.
