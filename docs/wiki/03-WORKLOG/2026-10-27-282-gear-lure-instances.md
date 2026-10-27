# 282차 — 장비 · 단단한 루어 개체 분리(번호 붙은 id) · main 반영 · 91차 배포

| | |
|---|---|
| **날짜** | 2026-10-27 |
| **시스템** | `인벤`(가방 · 장비 · 세이브) · `낚시`(채비 창 루어 칸) · 상점 · 거래 · 제작 · 집 보관 · 텃밭(물뿌리개) · 도감 |
| **트리거** | 사용자 — 백로그 CX 「장비(낚싯대 · 릴 · 옷 · 칼)와 루어만 따로 다루고 … -> OK 장비랑 루어만 개체로 나누는 걸로 진행해줘. (커밋 재배포까지 다 해줘)」 |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` → main 빨리 감기 → Actions 「테스트 배포」(91차) |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 34파일 350 통과(새 5) |

---

## 1. 배경 — 왜 했나

- 280차 아이템 점검에서 남긴 백로그 CX: 가방은 **같은 id 한 칸 · 수량**만 알고, 고장 · 쓴 횟수 · 착용은 그 칸에 하나씩만 붙는다.
  - 중고로 산 고장 대와 같은 모델 새 대가 한 칸(2개)에 합쳐져 고장이 사라지거나 새 대가 고장을 물려받는다.
  - 같은 모자를 쓴 채 하나 더 사면 착용 칸에 합쳐져 가방에 안 보인다.
  - 같은 루어 3개 중 하나만 상해도 셋 다 상한 것으로 나온다.
- 281차 보고에서 추천안(장비 · 루어만 개체로, 소모품은 묶음 그대로)을 드렸고, 사용자가 그대로 진행을 결정했다(원문 위 트리거).

## 2. 원인 — 구조

- `InventoryStore.addItem`은 `find(template.id)`로 칸을 찾아 `qty`만 더한다(256 별칭 · 280 신선도 가중 섞기까지는 이 구조 안의 보정).
- 참조(퀵슬롯 · 채비 트리 노드 `itemId` · 루어 칸 `_lure` · 장착)는 전부 **아이템 id 문자열**이다.
  그래서 「번호를 따로 두는 필드(`uid`)」보다 **id 자체를 개체마다 다르게** 하는 쪽이 참조를 덜 건드린다.
- 이미 「꼬리 붙은 id → 원래 id」 조회 관례가 있었다(하네스 복제본 `inv_rod_budget_h0` — `RodCatalog.lookupById` · `TackleTextures.baseId`). 이 관례를 넓혔다.

## 3. 변경 — 어디를 어떻게

**설계.**

- **개체 아이템** = 착용 · 손 도구(`equippable` 또는 `tool` — 낚싯대 · 릴 · 뜰채 · 칼 · 물뿌리개 · 모자 · 옷 · 신발 · 장갑 · 안경 · 시계 · 가방)
  \+ **단단한 루어**(루어 카탈로그 중 `family !== 'soft'` — 미노우 · 스푼 · 스피너 · 에기 · 메탈지그 · 타이라바).
- 웜(소프트 루어) · 미끼 · 봉돌 · 바늘 · 찌 · 줄은 **묶음 그대로**(입문 루어 세트의 웜 14개가 14칸을 먹지 않게).
- 개체는 수량 1 · id `<카탈로그 id>#<번호>`(예: `rod_iso_1_53#4`). 번호는 가방 순번(`instSeq` — 세이브).
- 카탈로그 조회(제원 · 그림 · 값 · 도감 · 보호 판정)는 번호를 떼고 한다(`itemBaseId`).

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/src/rules/ItemInstance.ts`](../../../packages/core/src/rules/ItemInstance.ts) | `itemBaseId` · `isInstanceId` · `makeInstanceId` · `instanceNumberOf` · `sameItemKind` + 시험 5 |
| 수정 | core `getLureSpec` · `RodCatalog.lookupById`(`rodSpecFor` · `reelSpecFor`) · `getRodCatalogEntry` · `getReelCatalogEntry` · `getRodById` · `getReelById` · `isKnifeItem` · `getBestKnife` · `blueprintsByOutput` | 번호를 떼고 찾는다 |
| 수정 | [`store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | `isInstanceItem` · `find`(정확한 id → 번호 없는 카탈로그 id면 착용 개체 → 첫 개체) · `countOf` · `instancesOf` · `addItemIds`/`addInstances`(n개 = 칸 n개 · 하나라도 모자라면 통째로 거절) · `slotShortfall` · `slotsNeededFor`(개체는 한 개에 한 칸) · `removeQty`(카탈로그 id면 착용 안 한 개체부터 n개) · `deleteInstance` · `assignQuickslot` · `setRigNode`(카탈로그 id → 개체) · `importTradeItem`(상대 번호 버리고 새 번호) · `returnParkedGear`(새 번호 대 → 손 · 채비 노드 옮김) |
| 수정 | 같은 파일 — 세이브 | `splitInstanceStacks` — 옛 「같은 id 한 칸 · 수량 n」을 개체 n개로. **첫 개체가 칸 · 착용 · 고장 · 쓴 횟수를 잇고** 나머지는 새것 · 빈 칸(없으면 잠긴 칸). 퀵슬롯 · 채비 트리 · 루어 칸 · 줄 마모 참조는 첫 개체로. `instSeq` 저장 · 불러올 때 가방 번호 최댓값과 비교 |
| 수정 | `ItemIdAlias.canonicalItemId` · `ItemKeepGuard.itemKeepReason` · `Prologue.prologueProtects` | 번호 앞만 정본화 · 번호를 떼고 판정(아버지의 대 · 릴 프롤로그 보호가 풀려 팔고 다시 받는 길이 열릴 뻔했다) |
| 수정 | `data/EquipOutfit.gearLookOf` · `ui/ItemIcon`(`ITEM_ART_BY_ID` · `ITEM_IMAGE_BY_ID`) · `TackleTextures.baseId` | 착용 모습 · 그림 표를 카탈로그 id로 |
| 수정 | `store/DiscoveryStore` | 아이템 기록 · 조회를 카탈로그 id로(번호 붙은 기록이 세이브에 쌓이지 않게 · 불러올 때 접음) |
| 수정 | `store/CraftingStore` | 재료 판정 카탈로그 id(미노우 · 에기 · 릴 재료) · 산출 자리(개체는 한 칸 더) · 품질 올리기는 묶음만 · 보관함에서도 개체는 따로 · `stackable`에 개체 판정 |
| 수정 | `scenes/field/FarmFieldSystem` | 손에 든 물뿌리개 판정(개체 id) — 안 고치면 「물 주기」가 안 떴다 |
| 수정 | `ui/HomeStoragePanel.withdraw` | 넣기 실패면 보관함에 되돌린다(옛 검사 「같은 id가 있으면 칸 불필요」 → 개체는 사라질 수 있었다) · `HomeStore.put`은 개체를 합치지 않는다 |
| 수정 | `store/GameState` 이야기 쪽 | `countItem` · `takeQuestItems` = `countOf` |
| 수정 | `store/InventorySort` | 같은 이름 끝 순서 = id 숫자 순(`x#2` < `x#10`) |
| 수정 | [`ui/UtilizationPanel.ts`](../../../packages/client-pc/src/ui/UtilizationPanel.ts) 채비 칸 후보 | 개체는 「같은 물건 · 같은 고장」끼리 한 줄(`클래식 스푼 14g (x2)` · `… — 부분 파손 (x1)`) · 고르면 덜 쓴 개체 · 줄 글 말줄임(`clampTextWidth`) · 고장 줄 있으면 목록 330 |
| 수정 | `data/HelpContent` · `i18n/en_help` · `i18n/en`(규칙 1) | F1 인벤토리 쪽 한 문단(한 개에 한 칸 · 묶음 · 채비 창 묶음 줄) · 영어 |

**바꾸지 않은 것.** 상점 구매(`handleBuy`)는 `addItem` 결과만 보고 값을 받으므로 그대로 「칸 모자라면 통째로 거절 · 돈 그대로」다.
중고 칸(`ShopStore.addUsed`)은 정확한 id로 합쳐 개체마다 따로 남는다 — 고장 · 쓴 횟수 그대로 되사 온다.

## 4. 구조상 위치

`인벤 → 스토어 불변조건 → 아이템 정체성` — **계약 층**(id의 뜻이 「카탈로그 물건」에서 「가방 안 한 개체」로 바뀜).
카탈로그 조회는 core 함수 안에서 번호를 떼므로 호출부는 대부분 그대로다. 「몇 개 가졌나」 · 「칸이 몇 개 필요한가」 · 「같은 물건인가」를 묻는 곳만 바뀌었다.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 개체 분리 · 세이브 · 거래 · 상점 · 거치대 | 하네스 `r282a.cjs`(dev 서버 · `__INV` · `handleBuy`) | **21/21** · pageerror 0 |
| 주변(프롤로그 보호 · 착용 모습 · 도감 · 정렬 · 제작 재료 · 채비 창 묶음 줄 · 고르기) | 하네스 `r282b.cjs` | **8/8** · pageerror 0 · 스크린샷 육안(채비 창 3줄 · 가방 장비 탭) |
| core | `vitest` | 34파일 350 통과(`ItemInstance.test.ts` 5 신설) |
| 빌드 | `npx pnpm run build` · client `typecheck` | 3/3 · 0 오류 |
| 화면 감사 | 보조 에이전트 2개(화면 · 데이터 / 스토어 · 씬 · core) | 꼭 고칠 곳 11곳 → 전부 반영 |

재현 절차(다음 회귀 시험):

1. 같은 대 2개 `addItem` → 개체 2개(`#1` · `#2`) · 칸 2개 · `setFault` 하나 → 다른 하나는 성함 · `countOf` 2.
2. 모자 착용 + 같은 모자 하나 더 → 하나 착용(칸 −1) · 하나 가방 칸.
3. 스푼 3개(하나 파손) · 웜 8개 → 스푼 개체 3 · 웜 한 칸 8.
4. 옛 세이브(모자 2 착용 · 스푼 3 파손 · 퀵슬롯 · 루어 칸 = 카탈로그 id) `deserialize` → 모자 1 착용 + 1 가방 · 스푼 첫 개체만 파손 · 쓴 횟수 12 · 퀵슬롯 · 루어 칸 = 첫 개체.
5. 루어 잃기(`loseLureRig`) → 그 개체 하나만 빠짐.
6. 상점 대 3개 → 개체 3 · 값 3개분 / 장비 칸 2개뿐 → 통째로 거절 · 돈 그대로.
7. 거치대 걸고 다시 잡기 → 같은 개체가 오른손.
8. 채비 창 루어 칸 → 「(x2)」 · 「부분 파손 (x1)」 두 줄 · 고르면 쓴 횟수 0인 성한 개체.

## 6. 잔여

- **찌는 묶음 그대로다** — 찌도 고장(`float_cracked` · 부력 변성)과 쓴 횟수(300회)가 있지만 사용자 범위(장비 · 루어) 밖이라 두었다.
  같은 찌 여러 개 중 하나가 깨지면 그 칸 전체가 깨진 것으로 보인다(옛 동작). 원하면 `isInstanceItem`에 찌를 더하면 된다.
- **옛 세이브 집 보관함 · 바닥 · 중고 칸의 묶음**(카탈로그 id · 수량 n)은 꺼낼 때 개체로 나뉜다 — 칸이 모자라면 꺼내지지 않고 보관함에 남는다(안내 「가방에 빈 칸이 없다」).
- 거래 창은 개체마다 한 줄이라 같은 루어 여럿을 넘기면 줄이 여럿이다(한 번에 넘길 수 있는 줄 수 상한 안에서).
- 상점 판매 목록도 개체마다 한 줄(스푼 5개 = 5줄 · 각 1개).

## 7. 위험·부작용

- **id에 `#`가 들어간다** — 아이템 id를 문자열 끝 고정 정규식(`…$`)이나 카탈로그 표 키로 쓰는 새 코드는 `itemBaseId`를 거쳐야 한다(시스템 페이지 함정 20).
- 세이브 크기: 개체마다 아이템 한 줄 — 장비 · 루어가 수십 개여도 몇 KB 수준.
- `find(카탈로그 id)`는 이제 「그 물건 중 하나」(착용한 것 우선)다. 그 물건이 몇 개인지 묻는 곳에서 `find(...).qty`를 쓰면 1이 나온다 — `countOf`.
- 번역: 채비 창 묶음 줄은 새 규칙(`… — … (xN)`) — 일반 「이름 (xN)」 줄은 전과 같다.

## 8. 후속 반영

- [x] 워크로그 색인 `03-WORKLOG/README.md` §3.1
- [x] `02-SYSTEMS/inventory-equipment.md` — §4 표 한 줄 · §5 CX 줄 → 잔여(찌) · §6 함정 14 갱신 · 20 신설
- [x] `04-BACKLOG.md` — CX 해결(삭제) · 갱신 줄
- [x] `.agents/AGENTS.md` §9 · `.agents/IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 요약
- [x] 아티팩트 4개 — 같은 주소:
  남은 과업 설계 [Version 24](https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4) · 구현 라이브러리 [Version 26](https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5) ·
  채비 모딩 순서도 [Version 24](https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1)(「282차 기준」 줄 · 문법 그대로) · 위키 [Version 77](https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c)(시스템 「장비 · 루어는 한 개씩」)
- [x] main 빨리 감기 · 「테스트 배포」 91차 · 배포본 점검
