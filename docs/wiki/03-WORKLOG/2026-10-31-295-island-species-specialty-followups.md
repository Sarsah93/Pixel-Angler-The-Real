# 295차 — 섬 어종 5 · 특산 후속 다섯(명산지 꼬리표 · 산지 매대 · 택배 차익 · 지역 가공대 · 지역 레시피 · 도감 특산 탭)

| | |
|---|---|
| **날짜** | 2026-10-31 |
| **시스템** | `낚시` `해루질(통발)` `경제` `회썰기(불요리)` `스토리` `도감` `인벤` `필드` `에셋` `데이터` `세이브` `위키` |
| **트리거** | 사용자 지시(294 보고 뒤) — 「1) 자리돔 · 혹돔 · 옥돔 · 참다랑어 · 독도새우 추가해주고, 2) … 명산지 꼬리표, 산지 매대와 택배 차익, 지역 가공대, 지역 레시피, 도감 특산탭까지만 우선 진행하고 나머지는 백로그로 남겨놔줘.」 |
| **커밋** | `2bf6bef`(코드) · 문서는 296차와 함께 |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 475 |

---

## 1. 배경 — 왜 했나

294차가 울릉 · 독도를 열면서 「DB에 없는 섬 어종 5」와 「특산 설계 후보 8」을 사용자 결정으로 남겼다.
사용자가 어종 다섯을 전부 넣고, 후보 여덟 중 다섯(명산지 꼬리표 · 산지 매대와 택배 차익 · 지역 가공대 · 지역 레시피 · 도감 특산 탭)을 먼저 하라고 정했다.
나머지 셋(축제 달력 · 인물 선물 선호 · 지역 텃밭 제한)은 백로그에 남긴다(§6).

## 2. 원인 — *(버그 수정 아님 — 설계 결정 반영)*

- 독도새우(도화새우)는 수심 150~300m 통발 어종이라 해루질 풀에 넣으면 거짓이 된다 — 갯것 DB에 **통발 전용**(`trapOnly`)을 두고 새우 통발 · 울릉 바다에서만 든다.
- 특산 「택배 차익」은 「다른 지역에 가져가면 더 쳐준다」가 뜻이라 `priceOf`에 판매 지역을 넘겨 배율을 곱한다(밖 1.15 · 제철 배율과 곱).
- 지역 레시피는 요리 개체화(255)의 레시피 변형을 그대로 쓰되 **주재료 어종 잠금**(`mainSpecies`)과 **배움**(`learn.questId`)을 더했다 — 그 지역 이야기 한 편을 끝내야 창에 뜬다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`core/.../FishSpawningOracle.ts`](../../../packages/core/src/simulation/FishSpawningOracle.ts) · `FishDatabase.ts` · `FishCookingProfiles.ts` · `SpeciesPresence.ts` · `Economy.ts` · `MafraAuctionApiClient.ts` · client `ExternalDataStore.ts` · `FishTextures.ts` | 어종 4(자리돔 `pearl_spot_chromis` · 혹돔 `bulgyhead_wrasse` · 옥돔 `red_tilefish` 금어기 7/21~8/20 · 참다랑어 `bluefin_tuna` 50~300cm) — 오라클 · 도감 · 요리 프로필 · 다섯 바다 가중 · 경락 · MAFRA · KOSIS · 그림 |
| 수정 | [`core/.../ShoreCreatureDatabase.ts`](../../../packages/core/src/db-schema/ShoreCreatureDatabase.ts) · `ForagingEngine.ts` · `TrapSystem.ts` | 독도새우 `pandalus_hypsinotus`(도화새우 · 120,000원/kg) = `trapOnly · trapTypes ['shrimp_trap'] · trapSeas ['ulleung']` — 해루질 풀에서 빠지고 `harvestTrap`이 통발 종류 · 바다로 거른다 |
| 수정 | [`core/.../RegionalSpecialty.ts`](../../../packages/core/src/db-schema/RegionalSpecialty.ts) | 50(44 + 독도새우 + 가공품 5) · `specialtySellMult(key, origin, month, sellRegion)` · `SPECIALTY_AWAY_MULT` 1.15 |
| 신설 | [`core/.../rules/RegionalProcessing.ts`](../../../packages/core/src/rules/RegionalProcessing.ts) | 가공품 5(과메기 · 명이 장아찌 · 오징어순대 · 대구포 · 반건조 옥돔) · 가공 레시피 5(재료 · 수율 · 공임 · 시간) · `processQuote` |
| 수정 | `core/.../types/Cooking.ts` · `FireRecipeDatabase.ts` · `RecipeLore.ts` · `FoodNutrition.ts` · `FoodEffects.ts` · `StoryQuestDatabase.ts` | 지역 레시피 4(`mainSpecies` · `learn.questId`) — 퀘스트 `unlocks: ['recipe:<id>']`를 데이터에서 자동으로 단다 |
| 수정 | `core/.../types/Discovery.ts` · client `DiscoveryStore.ts` | 발견 갈래 `specialty` · `noteSpecialty(item, source)`(얻은 지역 꼬리표가 있을 때만) |
| 신설 | client `data/SpecialtyTag.ts` · `data/ProcessedItems.ts` · `data/RegionStall.ts` · `data/RecipeUnlock.ts` | 특산 표시 이름(「구룡포 과메기」) · 가공품 템플릿(분류 「가공품」) · 직판장 산지 매대 · 배운 레시피 판정 |
| 신설 | client `store/ProcessQueue.ts` · `store/ProcessActions.ts` · `ui/ProcessPanel.ts` | 가공장 대기열(세이브 `processQueue`) · 맡기기 · 찾기 · 창(가이드 `process`) — 알림은 방앗간과 같은 길(`[가공장]`) |
| 수정 | client `InventoryStore.ts` · `CoolerStore.ts` · `ShopPanel.ts` · `InventoryPanel.ts` · `CoolerPanel.ts` · `ItemDetailPanel.ts` · `AuctionHousePanel.ts` | 판매가에 판매 지역(`getSellPrice(item, region)`) · 칸 배지 `mk_origin` · 표시 이름 · 위판 정산 원산지 줄 · 꼬리표 합치기 규칙(다른 지역이면 비운다) |
| 수정 | client `ShopCatalog.ts` · `InteriorLayouts.ts` · `InteriorSystem.ts` · `InteriorArt.ts` · `RegionFieldScene.ts` · POI JSON 5지역 ×2 | 가게 종류 `processor`(구룡포 · 울릉 · 속초 · 거제 · 서귀포 — `src: manual`) · 실내 덕장 · 느낌표 |
| 수정 | client `CookingStore.ts` · `CookingPanel.ts` · `StoryStore.ts` · `AnglerLogScene.ts` · `HelpContent.ts` · i18n 3 | 레시피 배움 게이트 · 주재료 잠금 · 보상 줄 「요리 배움」 · 도감 「특산」 탭(열린 지역만 · dev 「모든 지역 열기」 존중) |
| 신설 | `food assets/fish/` 4 · `forage/art/pandalus_hypsinotus.png` · `items/proc_*` 5 · `public/fish · forage · items` 카드 | Gemini 그림(어종 4 · 새우 1 · 가공품 5) — 도구 `gemini_fish_art.cjs` LOOKS · `gemini_forage_art.cjs` · `item_looks/processed.cjs` |
| 신설 | [`core/.../rules/Specialty295.test.ts`](../../../packages/core/src/rules/Specialty295.test.ts) | 9 시험(통발 전용 · 어종 4 · 특산 50 · 배율 · 가공 5 · 레시피 4) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S2 낚시 · S9 통발 → 어종 등록(4계층)` · `S10 경제 → 지역 특산 2차(표시 · 판매 지역 · 가공)` · `S6 불요리 → 지역 레시피(배움 게이트)` · `S19 도감 → 특산 탭`.
계약(`InvItem.originRegion`은 294 · 이번은 `FireRecipeDef.mainSpecies · learn` · `DiscoveryKind` · `TrapDeploymentContext`) + 데이터 + 판정(`priceOf` · `harvestTrap` · `recipeKnown`) + 렌더.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| core 시험 | vitest 44파일 | 475 통과(새 시험 9 포함 — `Presence289`가 새 어종 넷의 다섯 바다 열을 본다) |
| 통발 · 해루질 | `rollForageSpots` 풀 · `harvestTrap`(울릉 · 동해) | 독도새우는 풀 0 · 울릉 새우 통발에서만 |
| 실렌더 r295 | 하네스 11/13(둘은 설계대로 — 칸 이름 줄임이 지역 머리를 뗀다 · 도감은 열린 지역만) | 가공장 맡기기 · 찾기 · 가방 배지 2 · 도감 특산 4쪽 「구룡포 과메기」 카드 |
| 실렌더 r295b | 2/3(같은 줄임 규칙) | 봉인 배지 · 상세 「특산」 · 「유래」 줄 |
| 빌드 | `npx pnpm run build` · 루트 typecheck | 3/3 · 4/4 |

## 6. 잔여 — 이번에 안 한 것

- **백로그로 남긴 셋**(사용자 지시) — 축제 달력 · 인물 선물 선호 · 지역 텃밭 제한(백로그 DE).
- 칸 이름 줄임(`abbreviateSlotLabel`)은 지역 머리를 뗀다 — 「과메기·1마리」. 배지가 산지를 말하므로 받아들였다(상세 · 쿨러 · 툴팁은 전체 이름).
- 지역 레시피 4는 사진이 없다(`photoKey` 없음 — 요리 사진 7과 같은 절차로 뒤에).
- 가다랑어 · 심해 통발(수심 150m+)은 넣지 않았다(통발은 갯가 설치물 — 울릉 새우 통발이 허구적 단순화).
- 특산 배율 50은 추정값 — 실플레이 뒤 표 수정.

## 7. 위험·부작용

- `priceOf`에 판매 지역 인자가 늘었다 — 안 넘기면 현재 지역(`GameState.currentRegionId`)이고, 꼬리표가 없으면 1.
- `addItemIds`에서 같은 id · 다른 꼬리표가 합쳐지면 꼬리표를 비운다 — 「섞인 묶음은 특산이 아니다」(의도).
- 퀘스트 `unlocks`에 레시피 줄이 데이터에서 자동으로 붙는다 — 없는 퀘스트 id면 로드 때 던진다(시험이 잡는다).
- 세이브: `processQueue` 키 추가(없으면 빈 대기열) · 가방 가공품은 `processedItemTemplate` 백필.

## 8. 후속 반영

- [x] 시스템 페이지 `fishing-loop` · `night-hunting-trap` · `economy-data` · `story-quests` · `sashimi-cooking` · `discovery-wiki` · `world-field`
- [x] `04-BACKLOG.md`(DE) · `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` · 스킬 `add-species`(통발 전용 갯것 · Gemini LOOKS)
- [x] 아티팩트 4개 — 296차와 함께 같은 URL에 발행(판은 [296 §8](2026-11-02-296-mailbox-lost-item-paths.md))
