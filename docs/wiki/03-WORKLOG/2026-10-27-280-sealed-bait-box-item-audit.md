# 280차 — 미끼 갑은 열기 전까지 갑째 · 아이템 버그 전수 점검(26건 고침)

| | |
|---|---|
| **날짜** | 2026-10-27 |
| **시스템** | `인벤`(갑 · 신선도 합치기 · 채비 칸 몫 · 고장 장비 · 불러오기) · `낚시`(카탈로그 밖 루어 제원 · 거치대) · `회썰기`(회칼 표) · `제작`(수제 채비 · 크릴 고르기) · `홈`(선반 · 냉장고) · `해루질`(통발 미끼) · `경제`(거래 · 추천 표시) · `스토리`(첫물) |
| **트리거** | 사용자 「미끼 갑은 열기 전까지 그대로 두도록 바꿔줘. 아 그리고, 이런 아이템 관련 버그가 없는 지 전체적으로 검수해줘.」 |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck`(main · 배포는 이번 요청에 없음) |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 33파일 345 통과 |

---

## 1. 배경 — 왜 했나

- 279차 기록 §6에 「상점 묶음(갑)은 불러올 때 저절로 풀린다 — 갑을 열기 전까지 그대로 둘지 결정」을 남겼다(백로그 CW).
- 사용자 결정: 「미끼 갑은 열기 전까지 그대로 두도록 바꿔줘.」
- 같은 메시지: 「이런 아이템 관련 버그가 없는 지 전체적으로 검수해줘.」 — 279의 곽 · 갑 미끼 칸 오류 같은 **분류 · 경로 어긋남**을 게임 전체에서 찾는다.

## 2. 원인 — 무엇이 문제였나

**미끼 갑.**

- 산 자리(`RegionFieldScene.handleBuy`)는 상점 `bundle`이 있으면 `addBundle`로 낱개를 넣었다 — 청갯지렁이 · 혼무시 1갑은 산 순간 지렁이 8마리였다.
- 불러오기(`InventoryStore.deserialize` 188차 세트 정리 루프)도 `bundle` 아이템을 전부 풀었다.
- 갑에는 신선도 시계가 없었다 — 갑째 두면 영원히 싱싱하고, 열 때마다 갓 산 지렁이가 나왔다(갑째 두게 바꾸면 바로 생기는 구멍).

**전수 점검.** 네 갈래(장착 · 상태 / 곽 · 갑 · 묶음 / 분류 어긋남 / 불러오기 이전)로 나눠 읽기 전용 조사를 돌리고, 나온 것을 하나씩 코드로 다시 확인했다. 확인된 것 26건:

| # | 무엇이 | 기전(확인 근거) |
|---|---|---|
| 1 | 고장으로 손에서 내린 대 · 릴이 **어디에도 안 보임** | `setFault`가 `equipped`만 끄고 칸(`slot` −1)을 안 돌려줌 — 가방 칸(0~용량)에도 장비 창(착용)에도 없다. 자가 수리 메뉴가 가방에만 있어 못 고치고, 같은 대를 새로 사면 숨은 칸에 +1 |
| 2 | 같은 물건이 합쳐질 때 **신선도가 한쪽으로 통째로** | `addItem`이 id만 보고 `qty +=` — 상한 지렁이 1 + 새 갑 8 = 9마리 전부 상함, 거꾸로 묵은 수확물이 새것과 합쳐져 싱싱해짐 |
| 3 | 미끼를 버리거나 넘겨도 **채비 칸은 그대로** | `removeQty` · `removeItem(1개)`은 0개가 될 때만 트리를 정리 — 1마리로 바늘 셋이 차 있고 무리 입질이 3마리를 굴림 |
| 4 | 봉돌 · 도래 · 바늘 **1개로 두 칸** | 수 검사가 미끼 칸에만 — 고리봉돌 1개가 미끄럼 칸 · 목줄 중간 칸에 동시에(무게 두 번) |
| 5 | 바닥 · 거치대 사본에 **장착 표식이 남음** | `GroundItemStore.drop`이 `qty` · `slot`만 떼고, `takeRigForParking` 사본이 `equipped:true` — 주우면 가방 칸에 있으면서 「오른손」 |
| 6 | 통발 미끼로 **갑 · 곽이 통째로** | `TrapDeployPanel`이 `/미끼/` 하위 분류만 봄 → 설치 = `removeQty(갑, 1)` = 8마리 · 곽크릴 20마리가 통발 하나에 |
| 7 | 「밑밥 크릴에서 미끼 고르기」 제작 — **블록 50마리 → 1마리 · 해동 관문 우회** | 산출 1 · 재료 판정이 신선도를 안 봄(언 블록도 · 상한 재료도) |
| 8 | 가방 「사용하기」가 **효과 없이 물건을 지움** | 분류(`consumable`)만 보고 메뉴를 냄 — 밑밥 블록 · 각얼음 · 집어제 · 부탄 · 양념 · 날 해파리 · 불가사리 |
| 9 | 상점 「추천」이 **갑 · 곽에 한 번도 안 붙음** | `isBaitRecommended`가 `isBaitItem`(갑 거름)으로 시작 · 이름 → 미끼 종류 표가 낚시 쪽과 따로(참갯지렁이 · 갯강구 빠짐) |
| 10 | 「첫물」 퀘스트가 **팩을 통째로** | 가방 첫 수확물을 건넴 — 딸기 한 팩(25개)이 앞이면 그게 빠짐 |
| 11 | 거치대 낚싯대(옛 세이브) — 미끼 칸의 **곽이 따먹히면 곽째** | `RodHolderSystem` 미끼 판정이 거치대 사본을 직접 봄(가방 트리 정리가 안 닿음) |
| 12 | 마트 「참치 통조림 **(묶음)**」 | 한 캔을 팔면서 이름만 묶음 |
| 13 | 팩 수확물의 요리 재료가 **중간 수확물 재료로 샐 수 있음** | `produceCookIngredient`가 팩 id를 걸러내지 않음(지금 해당 작물은 없음 — 예방) |
| 14 | **장인 단조 야나기바 · 정옥선의 칼이 회칼로 안 읽힘** | core `KNIFE_SPECS`에 두 id가 없음 — 손에 들어도 「회칼 없음 — 막칼」(수율 0.85) |
| 15 | 수제 감성돔 · 벵에돔 채비가 **어느 칸에도 안 들어감** | 하위 분류 `바늘`(정본은 `바늘/훅`) — `partKindOf` null |
| 16 | 수제 원투 카드 채비 — **단수 · 자중 없음** | `rigPart` · `kitHooks` · `sinkerWeightG` 없이 이름으로만 카드 채비 |
| 17 | 튜닝 에기 · 커스텀 미노우 · 미노우 90F · 주조 메탈지그 — **물리 제원 없음** | `getLureSpec`이 루어 카탈로그 id만 앎 → 무게 0g · 두족류 묶임 없음(튜닝 에기로 오징어가 안 낚임) |
| 18 | 바칸에 고기 · 밑밥이 **담긴 채 버리기 · 팔기 · 선반** | 쿨러 id(`inv_cooler`)만 검사 — 바칸(`inv_bakkan`)은 같은 어창을 쓰는데 빠짐 |
| 19 | 거래로 **채집물 · 법에 걸린 어획물 · 담긴 쿨러**가 나감 | `tradeBlockReason`이 상점 판매 제외 규칙과 따로 |
| 20 | 냉장고가 **상한 것을 「냉장」으로 되살림** | `FridgeStore.place`가 상태를 무조건 냉장 · 냉동으로 — 상한 생선이 회 · 제값 |
| 21 | 헤드랜턴 · 집게 · 기본 게 통발이 **불러올 때마다 새로** | 121차 「1회 주입」이 표식 없이 「가방에 없으면」만 봄 — 지금은 셋 다 사고 · 만들고 · 통발은 놓으면 빠진다(놓고 저장 · 불러오기 · 거두면 둘) |
| 22 | 세트 자동 풀기 실패 시 **세트가 사라짐** | 188 루프가 지우고 → 풀기 실패 → `addItem` 실패를 무시(잠긴 칸 세트 · 루어 칸 가득) |
| 23 | 요리가 **게임을 끈 동안 식음** | 오프라인 보정이 `conditionSinceMs`만 밀고 `dish.cookedAtMs`(온도 · 식감 별)는 그대로 |
| 24 | 거치대에 옮긴 미끼가 **꺼진 동안 상함** | 거치대 사본의 신선도 시계를 안 밂 |
| 25 | 옷장 · 선반의 생미끼 · 먹거리가 **꺼진 동안 상함** | 집 보관함은 오프라인 보정이 없음(가방 · 쿨러와 다름) |
| 26 | 256 이전 거치대 낚싯대 — **채비가 풀림** | 돌려받을 때 정본 id로 넣는데 트리는 옛 id → 칸 비움 |

## 3. 변경 — 어디를 어떻게

**미끼 갑(사용자 요청).**

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) `isSealedBaitBundle` | 구성품이 전부 미끼인 상점 묶음 = 미끼 갑(청갯지렁이 · 혼무시 1갑). 루어 · 에기 세트는 해당 없음 |
| 수정 | [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) `handleBuy` | 미끼 갑은 갑째 가방에(구성표는 싣지 않음) · 세트는 전처럼 산 자리에서 풀림 |
| 수정 | `InventoryStore.deserialize` 188 루프 | 미끼 갑은 건너뜀 |
| 신설 | `InventoryStore.packContent` · `openPack` | 곽 · 갑 안에 든 것 하나 · 연다(포장 = 「포장 뜯기」 · 묶음 = 「열기」) |
| 수정 | [`ui/UtilizationPanel.ts`](../../../packages/client-pc/src/ui/UtilizationPanel.ts) 미끼 칸 고르기 | 안의 것이 이 칸에 맞는 곽 · 갑마다 「… — 열어서 꿰기」(열고 → 한 마리 꿰기 · 나머지 가방). 밑밥 블록은 줄에서 뺌 · 그 줄이 있으면 목록 폭 380 |
| 수정 | [`data/ShopCatalog.ts`](../../../packages/client-pc/src/data/ShopCatalog.ts) | 두 갑에 `condition: 'live'` — 산 때부터 시계 |
| 수정 | `InventoryStore.openBundle` | 상한 갑은 「이미 상했다 — 열어도 쓸 수 없다」 · 연 지렁이는 갑의 상태 · 시각을 잇는다 |
| 수정 | [`data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) · `i18n/en_rig.ts` · `en_items.ts` | 낚시 채비 쪽 문단(갑째 · 열어서 꿰기 · 언 곽크릴 · 갑 시계) · 줄 · 사유 영어 |

**전수 점검(위 표 번호).**

| # | 위치 | 내용 |
|---|---|---|
| 1 | `InventoryStore.setFault` · `fixSlotCollisions` · `lockedSlotFor` | 내린 장비는 빈 칸 → 없으면 잠긴 칸(용량 밖 — 꺼낼 수 있음). 불러올 때 「착용 아님 + 칸 없음」은 빈 칸으로 |
| 2 | `InventoryStore.blendCondition` · `addItem` · `msToSpoiled` | 수량 가중 「부패까지 남은 시간」 → 더 싱싱한 쪽 경로 위 단계로 · 상한 것의 남은 시간 = 0(예전엔 Infinity라 「가장 먼저 상하는 조각」에서 빠짐) |
| 3 | `trimOverCommitted` · `removeQty(…, trimFirst)` · `removeItem` · `syncTreeWithItems` | 남은 수보다 많이 꿰인 칸을 비운다(먹힌 바늘 먼저 · 그다음 뒤쪽) — `consumeBaitAt`의 옛 정리를 이리로 합침 |
| 4 | `partStockLeft` · `setRigNode` · 채비 창 후보 | 줄(스풀) 칸이 아니면 같은 물건을 칸끼리 나눠 쓴다 · 모자라면 후보에서 빠지고 「남은 수가 모자랍니다」 |
| 5 | [`store/GroundItemStore.ts`](../../../packages/client-pc/src/store/GroundItemStore.ts) `drop` · `takeRigForParking` | 장착 표식을 떼고 놓음 |
| 6 | [`ui/TrapDeployPanel.ts`](../../../packages/client-pc/src/ui/TrapDeployPanel.ts) | `isBaitItem`(낱개 미끼만) · 낱개가 없고 갑만 있으면 「낱개 미끼 없음 — 가방에서 갑을 열어 주세요」 |
| 7 | core [`CraftingDatabase.ts`](../../../packages/core/src/db-schema/CraftingDatabase.ts) · [`store/CraftingStore.ts`](../../../packages/client-pc/src/store/CraftingStore.ts) `matches` | 산출 20 · 설명 「녹은 밑밥 블록에서」 · 재료 판정 — 상한 것 제외 · 언 크릴 블록 제외 |
| 8 | [`ui/InventoryPanel.ts`](../../../packages/client-pc/src/ui/InventoryPanel.ts) | 「사용하기」는 효과(허기 · 수분 · 체력 · 피로 · 치료 · 버프 · 요리 · 날로 먹기)가 있을 때만 |
| 9 | [`store/RecommendationStore.ts`](../../../packages/client-pc/src/store/RecommendationStore.ts) | 갑 · 곽은 안의 미끼로 판정 · 이름 표는 `RigParts.baitKeyOf` 하나 |
| 10 | `RegionFieldScene.playQuestScene` | 낱개 수확물 먼저(`looseOfPack`) |
| 11 | [`scenes/field/RodHolderSystem.ts`](../../../packages/client-pc/src/scenes/field/RodHolderSystem.ts) | 곽 · 갑은 미끼로 치지 않음 |
| 12 | `ShopCatalog` 마트 | 「참치 통조림」 · 설명 「마트 특가 …」 |
| 13 | [`data/CropItems.ts`](../../../packages/client-pc/src/data/CropItems.ts) `produceCookIngredient` | 팩 id는 재료 없음 |
| 14 | core [`KnifeDatabase.ts`](../../../packages/core/src/db-schema/KnifeDatabase.ts) | 단조 야나기바(야나기바 등급 · 수율 1.15) · 정옥선의 칼(회칼 등급 · 1.05) · 같은 등급이면 수율 높은 칼 |
| 15 · 16 | [`data/CraftOutputs.ts`](../../../packages/client-pc/src/data/CraftOutputs.ts) · `deserialize` | `바늘/훅` · 카드 채비 3단 38g — 옛 세이브도 불러올 때 바로잡음 |
| 17 | core [`LuresCatalogDB.ts`](../../../packages/core/src/db-schema/LuresCatalogDB.ts) `getLureSpec` | 빌린 제원 표(튜닝 에기 ← 에기 3.5호 21g · 커스텀 미노우 · 미노우 90F ← 플로팅 미노우 · 메탈지그 20g ← 28g) — 라인업 목록엔 안 나옴 |
| 18 | `InventoryStore.coolerRemovalBlocked` · `CoolerStore.hasContents` | 쿨러 · 바칸 중 마지막 그릇일 때만 막음 — 버리기 · 팔기 · 거래 · 집 보관 |
| 19 | `InventoryStore.tradeBlockReason` | 채집물 · `StoryStore.sellVerdict` · 쿨러 |
| 20 | [`store/FridgeStore.ts`](../../../packages/client-pc/src/store/FridgeStore.ts) `place` | 나쁨 · 상함은 그대로 |
| 21 | `InventorySaveState.starterToolsGiven` | 세이브 표식 — 옛 세이브만 한 번 |
| 22 | 188 루프 | 풀기 · 다시 넣기가 다 실패하면 원래 자리로 되돌림 |
| 23 | `deserialize` | `dish.cookedAtMs`도 꺼진 시간만큼 |
| 24 | [`store/GameState.ts`](../../../packages/client-pc/src/store/GameState.ts) `applySaveData` | 거치대 사본 시계도 |
| 25 | [`store/HomeStore.ts`](../../../packages/client-pc/src/store/HomeStore.ts) | `savedAtMs` 저장 · 옷장 · 선반 시계를 꺼진 시간만큼 |
| 26 | `returnParkedGear` | 트리 id도 `canonicalItemId` |

**위키 · 아티팩트(문서 층).**

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) `bait_box` | 시스템 탭 「미끼 갑 · 같은 물건 겹치기」(산 갑 · 여는 길 · 갑 신선도 · 같은 물건 쌓기 · 채비 칸 몫 · 고장 난 대 · 쿨러 · 사용하기) |
| 수정 | [`tools/wiki_items.json`](../../../tools/wiki_items.json) | 다시 덤프 — 마트 「참치 통조림」 |
| 수정 | [`docs/artifacts/`](../../artifacts/README.md) 셋 | 「280차 기준」 · 라이브러리 「아이템 점검」 줄 · 순서도 미끼 칸 「낱개만 · 갑은 열어서」 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- 미끼 갑: `인벤 → 묶음 → 구매 · 로드 · 채비 창` — **데이터 + 판정 층**. 갑은 이제 「연 적 없는 물건」이 기본 상태이고, 낱개를 얻는 길은 가방 「열기」 · 채비 창 「열어서 꿰기」 둘.
- 신선도 합치기 · 채비 몫 · 고장 칸: `인벤 → 스토어 불변조건` — **판정 층**. 「id당 한 칸」 구조는 그대로 두고 그 안에서 맞는 값을 만든다(개체 분리는 백로그 CX).
- 회칼 · 루어 제원 · 크릴 고르기: **core 데이터 층**(표 · 조회 함수). 저장 형식 변화 없음.
- 불러오기 보정 4건(도구 표식 · 세트 되돌림 · 요리 · 거치대 · 집 보관 시계): **세이브 층** — 새 필드 둘(`starterToolsGiven` · 집 `savedAtMs`) 모두 없으면 옛 동작.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 하네스 `r280a.cjs`(scratchpad) — 미끼 갑 | dev 서버 · Playwright · 실 스토어(`__INV`) · 상점 구매 `handleBuy` · 저장 → 불러오기 두 번 · 채비 창 미끼 칸 클릭 목록 | **14/14 PASS** · pageerror 0 |
| 하네스 `r280b.cjs` — 점검 수정 | 같은 방식 · 장착 · 고장 · 세이브 조작 · 채비 트리 · 가방 메뉴 | **21/21 PASS** · pageerror 0 |
| 구매 · 불러오기 | 청갯지렁이 갑 2 · 혼무시 1 · 루어 세트 1 | 갑째 2 · 1 · 낱개 0 · 세트만 풀림 · 두 번 불러와도 갑 그대로 · 통째로 든 옛 세트는 풀림 |
| 미끼 칸 | 낱개 미끼 0 · 갑 둘 · 곽크릴 | 줄 셋 「… — 열어서 꿰기」 · 글 폭 175 · 242 · 175 ≤ 360 · 언 곽크릴 → 언 크릴 20 · 갑 → 8마리(1 꿰임) · 지렁이 시각 = 갑 시각 |
| 갑 시계 · 섞기 | 상한 갑 · 「보통」 갑 + 「활」 8마리 | 상한 갑 열기 거절(갑 · 수 그대로) · 16마리 「신선」(가운데 값) |
| 고장 장비 | 손에 든 대에 `rod_section` · 칸 −1 세이브 | 가방 칸 0에 보임 · 불러오면 칸 0 |
| 신선도 · 냉장고 | `msToSpoiled(상함)` · 냉장고에 상한 것 · 싱싱한 것 | 0 · 「상함」 그대로 · 「냉장」 |
| 기본 도구 | 표식 있는 세이브 · 표식 없는 세이브 · 주입 뒤 없앰 | 안 생김 · 각 1개 · 다시 안 생김 |
| 요리 | 1시간 전 저장 세이브 | 조리 시각 +3,600,000ms |
| 수제 · 칼 · 루어 | 불러오기 · core 조회 | 감성돔 채비 = 바늘 칸 · 카드 채비 3단 38g · 단조 우선 · 정옥선 칼 회칼 등급 · 튜닝 에기 21g 두족류 · 메탈지그 20g |
| 쿨러 · 거래 | 바칸만 + 밑밥 5 · 채집물 | 버리기 · 거래 · 선반 막힘 → 비우면 풀림 · 채집물 거래 「(조례)」 |
| 채비 몫 | 고리봉돌 1개 · 묶음추 바늘 3 + 지렁이 3 | 미끄럼 칸 됨 · 목줄 중간 막힘 → 2개면 됨 · 1개 버리면 칸 1 · 지렁이 2 버리면 미끼 칸 1 |
| 「사용하기」 | 밑밥 블록 · 통조림 메뉴 | 블록 = 「열기」만(사용하기 없음) · 통조림 = 사용하기 |
| core 시험 | `vitest run` | 33파일 345 통과 |
| 빌드 · 타입 | `npx pnpm run build` · client typecheck | 3/3 · 0 오류 |

스크린샷(육안): 채비 창 미끼 칸 「열어서 꿰기」 세 줄(`out280a/c_rig_bait_open_rows.png`) · 연 뒤 채비 · 가방.

재현 절차(하네스 시작): `__GS.startNewGameInSlot(3)` → 필드 씬 `restart({ region: 'hometown' })` → 집 씬 멈추고 필드 재개(새 게임만 부르면 메인 메뉴에 머문다).

## 6. 잔여 — 이번에 안 한 것

- **장비 · 루어가 같은 id로 한 칸에 쌓인다**(백로그 CX) — 고장 · 쓴 횟수 · 줄 쓴 길이 · 손상이 한 칸 전체의 것이다(중고 고장 대를 사면 새 대에 합쳐져 고장이 사라지거나, 새 대가 고장을 물려받음 · 같은 모자를 쓴 채 하나 더 사면 착용 칸에 합쳐져 안 보임 · 루어 3개 중 하나 손상 = 셋 다).
  고치려면 장비를 개체(번호 붙은 id)로 나눠야 한다 — 가방 · 장비 창 · 상점 · 거래 · 세이브 전부 닿는다. 착수 조건: 사용자가 장비 개체 단위를 원할 때.
- **줄 세기 기준 둘**(백로그 CY) — 낚시 물리는 이름의 「N호」로 세기를 셈(카본 3호 = 5.4kg), 상세 창은 제원 lb(10.5lb = 4.8kg). 어느 쪽으로 맞출지는 밸런스 결정.
- 작은 것(백로그 CZ): 트레블 훅이 미끼 바늘 칸에 들어감 · 크릴 집어제 배합이 블록에서 나온 크릴(`inv_krill_bag`)을 안 받음 · 256 별칭 합치기 때 줄 쓴 길이가 한쪽 것만 남음(일회성) · dev 전용 시험 물고기가 불러올 때마다 다시 생김.
- 미끼 판정 두 함수(`isBaitItem` · `partKindOf`)는 여전히 둘(CV ③) — 추천 표시는 이번에 `RigParts.baitKeyOf`로 합침.

## 7. 위험·부작용

- **신선도 섞기**: 같은 물건을 합칠 때 상태가 가운데로 간다. 예전에 「새것 + 묵은 것 = 새것」으로 되살리던 플레이는 막힌다. 반대로 상한 것 1에 새것을 더하면 전부 상하던 손해도 사라진다.
- **채비 몫**: 봉돌 · 도래 · 바늘을 칸마다 따로 세게 됐다. 옛 세이브에 하나로 두 칸을 채운 채비가 있으면 불러올 때 뒤쪽 칸이 비고 그 아래가 풀린다(그 무게가 두 번 세지던 것이 바로잡히는 것).
- **기본 도구 표식**: 280 이전에 만든 세이브(188 이후 새 게임 포함)는 표식이 없어 한 번 더 주입될 수 있다 — 이번이 마지막이다.
- **크릴 고르기**: 산출이 1 → 20으로 크게 바뀌었다(「열기」 50마리보다 적은 것은 그대로). 산출은 끝날 때 표를 읽으므로(`CraftingStore` 완료 처리) 진행 중이던 제작도 20이 나온다.
- **루어 빌린 제원**: 튜닝 에기로 이제 두족류가 낚인다(원래 의도). 메탈지그 20g은 28g 지그의 동작 계수를 빌렸다.
- **「사용하기」**: 효과 필드가 비어 있던 음식은 메뉴가 사라진다 — 나중에 효과를 붙이면 다시 뜬다.

## 8. 후속 반영

- [x] 시스템 페이지 `inventory-equipment.md` §4 · §5 · §6 · `fishing-loop.md` §6 · `home-base.md` §6 · `sashimi-cooking.md` §6 · `night-hunting-trap.md` §6
- [x] `04-BACKLOG.md` — CW 해결(삭제) · CX · CY · CZ 신설 · CV ③ 갱신
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 요약
- [x] 아티팩트 4개 — 점검 `check_artifact_page` 셋 PASS(밝음 · 어두움 · 폰) · 위키 Playwright pageerror 0
  - 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 — Version 22
  - 구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 — Version 24
  - 채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 — Version 22(채비 문법은 258차 그대로)
  - 전체 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c — Version 75(지도 탭 그림은 그대로)
