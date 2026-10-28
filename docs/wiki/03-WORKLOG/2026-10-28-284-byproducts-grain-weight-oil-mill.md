# 284차 — 작물 부산물 전수 · 낱알 무게(g) · 봉지 · 방앗간(180 · 350ml) · 나물 볶음

| | |
|---|---|
| **날짜** | 2026-10-28 |
| **시스템** | `홈`(텃밭 E1) · `회썰기`(불요리) · `인벤` · `경제`(가게 · 방앗간) · `필드`(속초 가게 자리) · `에셋` · `세이브` |
| **트리거** | 사용자 질문 셋 → 결정 하나(아래 §1) |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` — main 반영 · 배포는 사용자 지시 뒤 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 378(35 파일) |

---

## 1. 배경 — 왜 했나

사용자 말(원문 · 차례대로):

- 「들깨와 참깨 같은 작물의 부산물은 한 줄기를 털었을 때 얼마나 나오는 지를 비중으로 적용해야 할 것 같고, 상품성을 지니는 수준을 중량으로 해야할 것 같아. 예를 들면, 몇 백 그람 단위로? 어떻게 생각해?」
- 「몇 g 기준으로 참기름 혹은 들기름 한 병이 나오는 지도 찾아봐야해.」
- 「방앗간 가게로 하고 병은 180ml · 350ml 두 가지로 진행해줘. 그리고...내 생각인데 고구마줄기도 요리재료가 되거든? 그래서 말인데, 현재 구현된 모든 작물들 기준으로 쓰임새가 있는 부산물들 전체적으로 다 찾고 깨나 고구마처럼 이런 케이스들이 있는지 체크하고 반영하자. 토큰 많이 써도되」

앞선 답(조사 · 제안)에서 정한 것:

- 털어 낸 깨 · 콩 · 보리는 **g으로 센다**. 가게는 낱알을 사지 않고 **봉지**(참깨 300 · 500g · 들깨 · 콩 500g · 1kg · 보리 1kg)를 산다.
- 한 병에 드는 깨: 350ml ≈ 볶은 참깨 850g · 들깨 950g · 180ml ≈ 440g · 490g(방앗간 후기 · 농진청 신품종 착유율의 가운데 값).

## 2. 조사 — 86종 중 「쓸모 있는 부산물」

웹 조사(농촌진흥청 · 방앗간 · 반찬 조리법 · 영농부산물 환원)로 작물마다 실제로 쓰는 것만 골랐다. 쓰임이 없는 것(잎 · 덩굴을 그냥 버리는 것)은 넣지 않았다.

| 갈래 | 작물 → 부산물 | 쓰임 | 양 |
|---|---|---|---|
| 먹는 것 | 김장무 → 무청 | 시래기(생선조림 바닥 · 나물) | 무 하나에 한 묶음 |
| 먹는 것 | 김장배추 → 겉잎 | 우거지 | 포기 하나에 한 묶음 |
| 먹는 것 | 토란 → 토란대 | 들깨 토란대 나물 · 육개장 | 칸당 0.6~1.2묶음 |
| 먹는 것 | 들깨(깻잎) 순지르기 → 깻순 | 나물 | 순지르기 한 칸에 한 줌 |
| 먹는 것(이미 있던 중간 수확) | 고구마줄기 · 고춧잎 · 마늘종 · 산나물 9종 | 요리 재료 「나물」로 연결(지금까지는 재료가 아니었다) | — |
| 밭 부산물 | 들깨 · 참깨 → 깻대 · 검불(키질) | 퇴비 대신 밭에 | 들깨 300~550g · 참깨 80~230g · 검불 = 낱알의 30% |
| 밭 부산물 | 콩 → 콩대 · 검불 | 퇴비 대신 | 160~330g · 20% |
| 밭 부산물 | 보리 → 보릿짚 · 검불 | 퇴비 · 짚 덮기(볏짚 대신) | 420~600g · 15% |
| 밭 부산물 | 옥수수 → 옥수숫대 | 퇴비 | 1.2~2.4kg |
| 밭 부산물 | 느타리 · 노루궁뎅이 · 목이 → 폐배지 | 퇴비(마지막 수확만) | 0.65~1.3kg |
| 방앗간 | 기름 짜고 남은 깻묵 | 밭에 넣는 거름 | 깨 − 볶음 손실 6% − 기름 |

뒤로 미룬 것(백로그 DB): 옥수수수염차 · 콩잎 · 단풍깻잎 장아찌 · 머위대 · 순무청 · 받은 씨앗 다시 심기 · 딸기 런너 · 고춧대 · 덩굴 걷기 · 압맥 · 생기름 · 시래기 말리기 단계.

## 3. 변경

### 3.1 core

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`types/Farming.ts`](../../../packages/core/src/types/Farming.ts) | `CropHarvest.unitG`(g으로 세기) · `bags: CropBag[]` · `CropDef.byproducts: CropByproduct[]`(food · residue · 나오는 때 harvest/process/care · 칸당 또는 단위당 · 키질만 · 끝날 때만 · 쓰임) · `CareTaskDef.yields` · 결과 `byproducts` |
| 수정 | [`db-schema/CropDatabase.ts`](../../../packages/core/src/db-schema/CropDatabase.ts) | 깨 · 콩 · 보리 4종 g · 봉지 7 · 부산물 16줄(작물 12) · 나물 9종 + 고구마줄기 · 무청 · 겉잎 · 토란대 요리 재료 · `produceUnitG` · `bagsOfLoose` · `looseOfBag` · `legacyUnitGrams`(옛 「참깨 (50g)」 묶음 → g) · `byproductOf` |
| 신설 | [`db-schema/FarmResidues.ts`](../../../packages/core/src/db-schema/FarmResidues.ts) | 밭 부산물 7종 — 한 칸 분(`soilPerCell`) · 짚 덮기 분(`mulchPerCell`) · 메모 Ko/En |
| 신설 | [`rules/OilMill.ts`](../../../packages/core/src/rules/OilMill.ts) | 기름병 4(참 · 들 × 180 · 350) · 방앗간 일 4 · `oilQuote` · `grindQuote` · `maxBottles` · `MILL_TUNING`(공임 4,000원/kg · 갈기 3,000원/kg · 병값 400 · 600 · 기름 60분 · 갈기 20분 · 100g 단위) |
| 수정 | [`simulation/FarmSim.ts`](../../../packages/core/src/simulation/FarmSim.ts) · [`CropCareSim.ts`](../../../packages/core/src/simulation/CropCareSim.ts) · [`db-schema/CropCareDatabase.ts`](../../../packages/core/src/db-schema/CropCareDatabase.ts) | `rollByproducts`(남는 몫은 확률로 하나 더 — 기대값 정확) · 거두기 · 털기(키질이면 검불) · 순지르기 깻순 · 짚 덮기 보릿짚 대신(`needs[].alt`) |
| 수정 | [`db-schema/CropRawEatDatabase.ts`](../../../packages/core/src/db-schema/CropRawEatDatabase.ts) | 먹는 부산물 넷은 「못 먹는다 — 익혀야」(이유 Ko/En) · 봉지는 뜯어야 한다 |
| 수정 | [`db-schema/FireRecipeDatabase.ts`](../../../packages/core/src/db-schema/FireRecipeDatabase.ts) · `CookIngredientDatabase` · `FoodNutrition` · `FoodEffects` · `RecipeLore` | 새 레시피 **나물 볶음**(팬 · 나물 1~2 · 기름 · 마늘 · 간장/소금 · 들깨가루 · 깨소금) · 생선조림에 시래기 · 우거지 · 고구마줄기(택1 · 선택) · 재료 8(시래기 · 우거지 · 고구마줄기 · 토란대 · 나물 · 들기름 · 들깨가루 · 깨소금) |
| 신설 | [`simulation/Farm284.test.ts`](../../../packages/core/src/simulation/Farm284.test.ts) | 28시험 — g · 봉지 · 옛 묶음 · 부산물 표 · 무청 · 폐배지 · 검불 · 콩대 · 보릿짚 · 깻순 · 견적 850/440/950/490 · 공임 · 갈기 · 기름값 > 봉지값 · 나물 볶음 구성 |

### 3.2 client

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`ui/QtyLabel.ts`](../../../packages/client-pc/src/ui/QtyLabel.ts) | 수량 글 한 벌 — 무게 물건은 「480g」 · 「1.25kg」(가방 칸 · 목록 · 기록 · 획득 알림) |
| 수정 | [`data/CropItems.ts`](../../../packages/client-pc/src/data/CropItems.ts) · [`store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | `InvItem.unitG` · 봉지 · 부산물 · 밭 부산물 템플릿 · `bagProduce` · 봉지 뜯기 · 기름병 매입 값 · 불러올 때 `unitG` · 요리 재료 백필 · 옛 「참깨 (50g)」 ×3 → 150g |
| 수정 | [`store/FarmStore.ts`](../../../packages/client-pc/src/store/FarmStore.ts) | 거둘 때 · 털 때 부산물 지급(자리 없으면 밭가에 두고 옴) · 「… 480g을 거뒀다 — 깻대 420g · 검불 30g도 나왔다」 · 순지르기 깻순 · `compostSource`(밭 부산물 먼저 · 보릿짚은 마지막 · 그다음 퇴비) · 조사(은/는 · 을/를) |
| 수정 | [`ui/InventoryPanel.ts`](../../../packages/client-pc/src/ui/InventoryPanel.ts) | 「봉지 담기 (300g)」(크기마다) · 수량 창 · 「봉지 뜯기」 · 「병 따기」 · g 배지 |
| 수정 | [`ui/ItemDetailPanel.ts`](../../../packages/client-pc/src/ui/ItemDetailPanel.ts) | 낱알 「낱알은 사지 않는다 — 봉지에 담아 판다」 + 봉지 값 줄 · 「사 주는 곳 … (봉지만)」 · 먹는 부산물 「요리 재료」 · 밭 부산물 상세(무게 · 퇴비 한 칸 분 · 볏짚 한 칸 분) · 기름병 상세(병 따기 23 · 사 주는 곳) |
| 신설 | [`data/MillItems.ts`](../../../packages/client-pc/src/data/MillItems.ts) · [`store/MillQueue.ts`](../../../packages/client-pc/src/store/MillQueue.ts) · [`store/MillActions.ts`](../../../packages/client-pc/src/store/MillActions.ts) · [`ui/MillPanel.ts`](../../../packages/client-pc/src/ui/MillPanel.ts) | 기름병 템플릿 · 방앗간 진열 · 맡긴 일 대기열(세이브) · 맡기기(낮은 등급부터 덜기) · 찾기(자리 모자라면 그대로) · 무르기(깨 · 공임 돌려줌) · 창(일 넷 · 병 −/+ · g −/+/전부 · 견적 흐름 배치 · 맡겨 둔 것 · 1초 갱신 · 가이드 6단계) |
| 수정 | [`data/ShopCatalog.ts`](../../../packages/client-pc/src/data/ShopCatalog.ts) · [`data/InteriorLayouts.ts`](../../../packages/client-pc/src/data/InteriorLayouts.ts) · [`ui/InteriorArt.ts`](../../../packages/client-pc/src/ui/InteriorArt.ts) · [`scenes/field/InteriorSystem.ts`](../../../packages/client-pc/src/scenes/field/InteriorSystem.ts) · [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) · [`ui/FullMapPanel.ts`](../../../packages/client-pc/src/ui/FullMapPanel.ts) | 가게 종류 `mill`(8~19시 · 진열 = 곡물 봉투 + 1큰술 넷 · 병은 안 판다) · 실내 압착기(`oil_press`) [F] · 간판 색 · 미니맵 아이콘 `mm_mill` · 지도 범례 |
| 수정 | `pixelazed/sokcho_v2/capture_pois.json` · `tools/merge_capture_pois.py` | 「설악기름방앗간」(속초관광수산시장 옆 · 캡처 83) · 분류 `O` → `shopKind: 'mill'` · 병합 → `pois.json`(tx 372 · ty 292) |
| 수정 | `data/CookItems.ts` · `store/CookingStore.ts` · `scenes/BootScene.ts` · `ui/RegionHud.ts` · `ui/TradePanel.ts` · `ui/HomeStoragePanel.ts` · `ui/FridgePanel.ts` · `ui/UtilizationPanel.ts` · `ui/FarmPanel.ts` · `ui/FarmWorkPanel.ts` · `store/GameState.ts` | 1큰술 셋(들기름 · 들깨가루 · 깨소금) · 요리 창 상태 글(레시피 역할로 주재료) · 나물 볶음 사진 로드 · 획득 알림 g · 거래 · 집 보관 · 냉장고 g 배지 · 밑밥 낟알 200g 한 줌 · 퇴비 단추가 밭 부산물로도 켜짐 · 「또는 보릿짚 500g」 · `millQueue` 세이브 |
| 수정 | [`data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) | F1 「부산물 · 밭에 넣기」 · 「봉지 담기 · 방앗간」 쪽 · 털기 쪽 g 줄 · 요리 「열 가지 · 나물 볶음」 |
| 신설 · 수정 | [`i18n/en_mill.ts`](../../../packages/client-pc/src/i18n/en_mill.ts) · `I18n.ts` · `en.ts` · `en_farm.ts` · `en_help.ts` | 이름은 데이터 Ko/En(봉지 · 부산물 · 밭 부산물 · 기름병 · 방앗간 일)을 사전에 합류 · 화면 문구 · 수치 문장 규칙(정해진 문장 = 텃밭 규칙 앞 · 「이름 480g」 넓은 규칙 = 맨 끝) · 등급 꼬리 「· 보통」 규칙 · `harvestTailEn` 내보냄 |
| 수정 | `data/WikiCatalog.ts` · `tools/gen_game_wiki_data.mjs` · `tools/wiki_crop_img.cjs` | 위키 — 부산물 · 밭 부산물 메모 · 기름병 · 「밭 부산물」을 농사 탭 농산물 갈래로 · 시스템 탭 「부산물 · 낱알 무게 · 방앗간」 · 작물 그림 파일명 숫자 허용(`_b300`) |

### 3.3 그림(Gemini · 약 1.1달러)

- 작물 초상 11(무청 · 배추 겉잎 · 토란대 · 깻순 · 봉지 7) — `--set byproduct` · `--set bag` → asis → `pixelize_crops` → `CropPortraits.ts` +11.
- 아이템 15(기름병 4 · 깻묵 · 곡물 봉투 · 밭 부산물 6 · 1큰술 3) — `tools/item_looks/mill.cjs` → `item_cards.cjs` → `ItemImages.ts` +15.
- 요리 사진 1(나물 볶음) — `food assets/dishes/stirfry_namul.png` → `public/food/`.
- 시트: scratchpad `art284/`(sheet_crops_baked · sheet_mill_baked · sheet_dish).

## 4. 구조상 위치

`홈 · 텃밭(E1) → 거두기 · 털기 · 관리 → 부산물` + `경제 → 가게 → 방앗간` + `불요리 → 레시피 10`.

- **계약 층**: `CropHarvest.unitG` · `bags` · `CropDef.byproducts` · `FarmResidueDef` · `OilBottleDef` · `MillServiceDef` 신설(선택 필드 — 옛 작물 데이터 그대로 돈다).
- **데이터 층**: 부산물 16줄 · 봉지 7 · 밭 부산물 7 · 기름병 4 · 방앗간 POI 1.
- **판정 층**: 부산물 굴림 · 견적 · 가게 매입(낱알 g은 안 삼) · 퇴비 대신 넣기.
- **렌더 층**: g 표시 한 벌 · 방앗간 창 · 실내 압착기.
- **세이브**: `InvItem.unitG`(백필) · `millQueue`(없으면 빈 대기열) · 옛 묶음 → g.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| core | `npx vitest run` | 378 / 378(35 파일) — 새 28 |
| 무게 · 봉지 · 가게 | 하네스 `r284a` ① — 참깨 1,400g → 300g 봉지 2(봉투 2장) · 봉지 뜯기 · 마트가 낱알 안 삼 · 봉지 값 5,590원 | PASS 4 |
| 방앗간 | `r284a` ② — 350 + 180ml 견적 1,290g · 맡기기(깨 · 공임 빠짐) · 이른 찾기 거절 · 시간 되감고 찾기(병 둘 · 깻묵 725g) · 병 따기 23큰술(재료 sesame_oil) · 들깨 갈기 무르기(500g · 공임 돌려받음) · 깨 모자람 거절 · 세이브 왕복(맡긴 것 남음) | PASS 8 |
| 옛 세이브 | `r284a` ③ — 「참깨 (50g)」 ×3(unitG 없음)을 `deserialize` | 150g · unitG 1 |
| 실내 | `r284a` ④ — `enterInterior('mill')` · `devStandAt('mill')` · [F] | 압착기 [F] = mill → 방앗간 창 |
| 영어 | `r284a` ⑤ — 새 문장 44 · 데이터 이름 · 메모 126개 `t()` · 영어로 창 다시 열어 한글 글 0 | 0 / 0 |
| 속초 자리 | `r284b` — 건물 kind mill · 미니맵 · 문 앞 [F] = 방앗간 · 문 앞 칸 걷기 · 간판 문 옆(side) · 「초당커피방앗간」은 카페 그대로 | PASS 6 |
| 상세 · 가방 | `r284b` — 낱알 · 깻대 · 기름병 · 무청 상세 줄 · 가방 칸 「480g」 「1.25kg」 「725g」 | PASS 5 |
| 텃밭 실제 경로 | `r284c` — 무 캐기 → 무청(요리 재료 시래기) · 들깨 베기 → 말림 → 털기(키질) → 93~110g · 깻대 · 검불 · 퇴비 없이 깻대 1kg 넣기 · 문장 영어 | PASS 4 |
| 화면 | 스크린샷 육안(방앗간 창 한/영 · 실내 · 속초 문 앞 · 가방 음식/소모품 · 획득 알림 g) | 겹침 1건(영어 「180ml bottle」 ↔ 「490g per bottle」) → 흐름 배치로 고침 |
| 빌드 | `npx pnpm run build` · client `tsc --noEmit` | 3/3 · 0 |
| 위키 | 생성기 경고 0 · 탭 9개 그림 깨짐 0 · pageerror 0 | Version 80 발행 |
| 아티팩트 셋 | `check_artifact_page.cjs` 밝음 · 어두움 · 폰 | PASS — 과업 27 · 라이브러리 28 · 순서도 26 |
| pageerror | 하네스 넷 | 0 |

## 6. 잔여

- **사용자 실검증** — 공임 · 기다리는 시간(실제 60분) · 수율 체감 · 방앗간 창 배치. 착수 조건: 배포 뒤.
- **다 됐을 때 알림** — 지금은 방앗간에 가야 안다(`readyMillCount`는 만들어 둠). 착수 조건: 실검증에서 불편하다는 말.
- **뒤로 미룬 부산물 · 가공**(§2 끝 목록) — 시래기 말리기(무청 → 시래기 열에 하나) · 생기름(볶지 않은 기름) · 압맥 · 옥수수수염차 · 콩잎 · 깻잎 장아찌 · 받은 씨앗 다시 심기 · 딸기 런너. 착수 조건: 사용자가 고르는 것부터.
- **나물 갈래별 이름** — 「시래기 볶음」 · 「토란대 들깨볶음」처럼 주재료로 이름이 바뀌는 변형(255 요리 이름 규칙의 채소판). 착수 조건: 요리 변형 확장 때.
- **배포** — main 반영 · 93차 배포는 사용자 지시 뒤.

## 7. 위험 · 부작용

- **넓은 영어 규칙 「(.+) 480g」**은 규칙 목록 맨 끝에 두었다 — 앞의 정해진 규칙이 먼저 잡는다. 이름 뒤에 g이 붙은 다른 문장이 이 규칙에 걸려도 결과는 「번역된 이름 + g」이라 나빠지지 않는다.
- **「(.+) · 보통」 등급 규칙** — 괄호 안 「·」(「무 (1개 · 약 1.2kg) · 보통」)에서 가르지 않게 넣었다. 「쉬움 · 보통」 같은 목록 끝이 걸려도 앞부분을 다시 옮기므로 결과는 같다.
- **낱알은 가게가 안 산다** — 예전 판(묶음 「참깨 (50g)」)으로 팔던 습관이 막힌다. 상세 · 도움말 · 「사 주는 곳 (봉지만)」으로 알린다.
- **방앗간 이름 정규식**(`/방앗간|기름집/` — 가게 POI만) — 지금 데이터에서 걸리는 것은 설악기름방앗간 하나(초당커피방앗간은 카페라 안 걸림). 새 지역에 「○○방앗간」 가게가 생기면 방앗간이 된다(의도).
- 성능 — 방앗간 창은 1초마다 상태 키만 비교하고 바뀔 때만 다시 그린다.

## 8. 후속 반영

- [x] 워크로그(이 파일) · 색인 `03-WORKLOG/README.md` §3.1
- [x] 시스템 페이지 — [`home-base.md`](../02-SYSTEMS/home-base.md)(텃밭 부산물 · 무게 · 방앗간) · [`sashimi-cooking.md`](../02-SYSTEMS/sashimi-cooking.md)(나물 볶음 · 레시피 10)
- [x] 백로그 `04-BACKLOG.md` DB(284 잔여)
- [x] `IMPLEMENTATION_PLAN.md` · `AGENTS.md` §9 · `CLAUDE.md` 요약
- [x] 아티팩트 4개 — 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c **Version 80** · 남은 과업 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 **Version 27** · 구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 **Version 28** · 채비 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 **Version 26**(「284차 기준」 줄 · 문법 258) · `docs/artifacts/README.md` 표
- [x] 스킬 `asset-pipeline` ⑥ — 위키 작물 그림 파일명에 숫자(봉지 `_b300`)
