# 303차 — 지역 요리 사진 넷(거제 대구탕 · 제주 옥돔구이 · 구룡포 꽁치조림 · 여수 하모 샤부샤부) · 도감 요리 칸 그림 가림 고침

| | |
|---|---|
| **날짜** | 2026-11-05 |
| **시스템** | `회 · 요리` `사진 → 도트` `도감` |
| **트리거** | 사용자 지시(295 지역 레시피 · 백로그 DG ②) |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` (해시는 §8) |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 시험 522 · 하네스 r303 8/8 · pageerror 0 |

---

## 1. 배경

사용자 지시 원문:

- 「아 그리고, 거제 대구탕, 제주 옥돔구이, 구룡포 꽁치조림, 여수 하모 샤브샤브는 이미지가 따로 없던데, 아직 생성이 안 된거지? 이 부분까지 적용하고 main & gh-pages 재배포해줘.」

295차에 지역 레시피 넷을 넣으면서 사진은 미뤘다(백로그 DG ② 「지역 레시피 사진 넷」).
그동안 요리 창 행은 계열 16px 손그림(`px:it_dish_<계열>`), 만든 요리 칸은 계열 별칭 사진(대구탕 · 하모 = 지리 사진 · 옥돔구이 = 생선구이 · 꽁치조림 = 생선조림)을 빌려 썼다.
도감 요리 탭은 사진이 없으면 글만 냈다.

## 2. 원인 · 발견

- 사진 넷은 만든 적이 없었다 — `tools/item_looks/_dishes.cjs`에 항목이 없었고 `FireRecipeDatabase`의 네 레시피에 `photoKey`가 없었다(295 시험이 「그림 없음」을 고정하고 있었다).
- **덤으로 찾은 결함** — 도감 요리 탭 「발견 기록」 칸의 요리 그림(300차 A)이 **칸 바탕에 덮여 보이지 않았다**.
  `AnglerLogScene.renderDishes`가 그림을 `tabContainer`에 먼저 넣고 바탕 그래픽 `g`를 나중에 넣었다(컨테이너는 넣은 순서로 그린다).
  만든 요리 그림 · 못 만든 변형 실루엣 둘 다 가려졌다 — r303 1차 스크린샷에서 칸 왼쪽 30px이 비어 있었다(그림 객체는 있었다).

## 3. 변경

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`tools/item_looks/_dishes.cjs`](../../../tools/item_looks/_dishes.cjs) | 생김새 넷 — 대구탕(검은 양수 냄비 · 뽀얀 맑은 국물 · 회갈색 반점 대구 토막 · 큰 입 머리 · 곤이 · 미나리) · 옥돔구이(배를 갈라 펼친 옥돔 · 둥근 이마 · 분홍 붉은 껍질 · 구운 자국 · 레몬) · 꽁치조림(얕은 냄비 · 주둥이 뾰족한 꽁치 · 무 · 시래기 · 빨간 양념) · 하모 샤부샤부(맑은 금빛 국물 · 꽃처럼 핀 갯장어 살 · 부추 · 팽이 · 대추) |
| 신설 | `food assets/dishes/` 넷 | 원본(셀 6px · 192×132칸) — Gemini 두 판씩 뽑아 1판을 골랐다(시트 `scratchpad/dish303_sheet.png`) |
| 신설 | `packages/client-pc/public/food/` 넷 + `icon/` 넷 | 게임 사진 582×402(셀 3px) · 칸 아이콘 64×44(`dish_photos.cjs`) |
| 수정 | [`FireRecipeDatabase.ts`](../../../packages/core/src/db-schema/FireRecipeDatabase.ts) | 네 레시피 `photoKey: 'food_<레시피>'` |
| 수정 | [`BootScene.ts`](../../../packages/client-pc/src/scenes/BootScene.ts) | 요리 사진 · 칸 아이콘 목록에 넷 |
| 수정 | [`AnglerLogScene.ts`](../../../packages/client-pc/src/scenes/AnglerLogScene.ts) | 발견 기록 칸 바탕을 그림보다 먼저 넣는다(그림 · 실루엣이 다시 보인다) |
| 수정 | `core/src/rules/Specialty295.test.ts` | 「그림 없음」 → `photoKey === food_<레시피>` |

배선 길(손으로 바꾼 곳은 위 둘뿐이다):

- 요리 창 행 — `CookingPanel`이 `photoKey`의 `__icon` 판을 쓴다.
- 만든 요리 칸 — `CookingStore`가 `iconTexture = photoKey`.
- 구세이브 — 계열 키(`px:it_dish_<계열>`)를 든 옛 지역 요리는 불러올 때 `refreshDishPhoto`가 제 사진으로 바꾼다(255 길 · 유저 상태는 그대로).
- 도감 · 위키 — `food_<레시피>` 텍스처를 이름으로 찾는다(`gen_wiki_images.py`가 `public/food/`를 훑는다).

## 4. 구조상 위치

`회 · 요리 → 요리 개체화 → 레시피 사진(렌더 · 데이터)`. 판정은 바뀌지 않았다 — 레시피 정의에 표시 키 한 줄씩.
도감 고침은 `도감 → 요리 탭 → 발견 기록 칸(렌더)`의 그리는 순서다.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 텍스처 | r303 — 부팅 뒤 `textures.get` | 넷 모두 사진 582×402 · 칸 아이콘 64×44 · `food/` 4xx 0 |
| 만든 요리 | r303 — 대구(1.1kg)로 대구탕을 실제로 끓여 꺼냄(`__COOK`) | 「거제 대구탕 (별 5개)」 · 칸 그림 `food_stew_cod_geoje` |
| 구세이브 | r303 — 요리 칸을 `px:it_dish_grill` · 옥돔구이로 바꿔 `deserialize` | `food_grill_tilefish_jeju` |
| 요리 창 | r303 — 속초 필드 · 양수 냄비 · 석쇠로 창 열기(배운 플래그 넷) | 냄비 목록 대구탕 · 꽁치조림 · 하모 · 석쇠 목록 옥돔구이 칸 아이콘 · 스크린샷 2배 육안 |
| 도감 | r303 — 요리 탭 대구탕 · 하모 · 지리 | 제 사진 · 지리 못 만든 변형 실루엣 보임(고침 전에는 바탕에 가려 비었다) |
| 전체 | 빌드 · 루트 typecheck · core 시험 | 3/3 · 4/4 · 522 |

재현 절차(고침 확인): 도감(L) → 요리 → 아무 레시피 → 「발견 기록」 칸 왼쪽 30px에 그림(만든 것) · 실루엣(못 만든 것)이 보여야 한다.

## 6. 잔여

- 요리 사진은 레시피 14장(매운탕 둘 포함) + 모둠회로 전부다. 새 레시피를 넣으면 같은 길(`_dishes.cjs` 한 항목 → 생성 → `dish_photos.cjs` → `photoKey` · `BootScene` 한 줄).
- 가공품(과메기 · 명이 장아찌 · 오징어순대 · 대구포 · 옥돔 말린 것)은 아직 16px 계열 손그림이다(`ProcessedItems.FALLBACK_PX`) — 요청이 있으면 아이템 그림 길(`item_looks`)로.

## 7. 위험 · 부작용

- 없음 — 표시 키만 바뀌었다. 계열 별칭(`ITEM_TEXTURE_ALIAS`)은 그대로라 레시피 id 없는 옛 요리 칸은 전처럼 계열 사진이다.
- 도감 칸 순서 고침은 요리 탭 한 곳이다. 다른 탭(어종 · 해양생물 · 아이템 · 특산)은 카드 바탕을 먼저 넣고 있었다(전수 확인).

## 8. 후속 반영

- [x] `sashimi-cooking` §4 · `photo-pixel-art` 머리줄 · §4 · `discovery-wiki` §6(그리는 순서 함정)
- [x] `04-BACKLOG.md` DG ②
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 아티팩트 4개 — 남은 과업 설계 Version 53 · 구현 라이브러리 52 · 채비 모딩 순서도 45(「303차 기준」 줄) · 위키 105(새 그림 4를 `files`로)
- [x] main 빨리 감기 · 107차 배포(302 생선 값 포함 — 302는 이번이 첫 배포)
