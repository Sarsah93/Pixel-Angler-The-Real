# 불요리 콘텐츠 확장 기획서 v1.0 — Recipe ≠ Dish

> 사용자 제공 기획서(2026-09-18)를 레포에 배치한 것. 154차 `FIRE_COOKING_SPEC.md`(조리 엔진)를 **유지한 채**
> 그 위에 **결과 생성 계층**(재료 프로필 → DishInstance → 요리 도감)을 얹는다.
> 구현은 §39 순서대로 — **156차 = Stage 1~6(매운탕 3종 → DishInstance → 상세보기 → 요리 도감)**,
> 정상 작동 확인 뒤 Stage 7~9(나머지 7개 레시피 · Item Library · 밸런싱).

## 0.5 코드 정합 노트 (156차 — 본문보다 우선)

| 기획서 | 실제 코드 | 비고 |
|---|---|---|
| `data/FishCookingProfiles.ts` · `RecipeLibrary.ts` · `FoodEffects.ts` · `DishDiscovery.ts` | `packages/core/src/db-schema/FishCookingProfiles.ts` · `RecipeLore.ts` · `FoodEffects.ts` · `DishDiscovery.ts` | core에 둔다(순수 데이터). `RecipeLibrary`는 154차 `FireRecipeDatabase.ts`가 정본이라 **새로 만들지 않고** 로어·기본 이름만 `RecipeLore.ts`에 |
| 기존 어종 DB에 `cookingProfile` 추가 | **별도 표** `FISH_COOKING_PROFILES[speciesId]` + `fishCookingProfileOf()` | `FishDatabase` 엔트리를 부풀리지 않는다. 미등재 어종은 `DEFAULT_FISH_COOKING_PROFILE` |
| `RecipeDefinition.family` 8종 | 154차 `RecipeFamily` 6종(`stew_red`·`stew_clear`·`grill`·`braise`·`stirfry`·`porridge`) | 레시피 id가 8종(`stew_red`·`stew_clear`·`grill_fish`·`braise_fish`·`stirfry_squid`·`soup_clam`·`porridge_abalone`·`grill_eel`)이라 family를 늘리지 않는다 |
| `recipe_spicy_fish_stew` 등 id | `stew_red` 등 154차 id 유지 | 발견 id = `discovery_<recipeId>_<speciesId>` |
| `DishInstance` | `types/Cooking.ts` `DishInstance` — `InvItem.dishInstance`에 실린다. 154차 `InvItem.dish`(`DishData` — 시간 감쇠 원본)는 **그대로 둔다** | 현재 품질은 154차 `dishStarsAt(dish)`가 계속 계산한다(재작성 금지 §43-5) |
| 품질 축 이름 | seasoning·temperature·texture·freshness·completion = 154차 season·temp·texture·fresh·finish ×100 | |
| 요리 도감 | `DiscoveryKind 'dish'` + `DiscoverySource 'cook'` · `AnglerLogScene` 「요리」 탭 | 발견 id 하나 = 도감 항목 하나(§36) |
| 별 표기 ★ | **텍스트 `별 N / 5`** · 인게임은 픽셀 별 아이콘 | AGENTS §8-8(이모지·글리프 금지)이 우선 |
| 효과 8종 | `FoodEffectDef`(데이터) — 156차에 **기계적으로 적용되는 것은 `satiety`(허기 소모 −%)** = 기존 `drainBuff` | 나머지 종류(피로 회복·이동 지구력…)는 데이터로 실리고 상세보기에 표시만 — Stage 9 밸런싱 때 `GameState` 버프 축 신설 |
| 이름 수식어 | `탄 > 일품 > 싱싱한 > 기름진 > 기본` · 최대 1개 | `TUNING.cook.naming` |
| 가격 | `COOKED_DISH_PRICING` = `TUNING.cook.pricing` — 사시미 계수와 별개 | 탄 것 0원 유지 |

**156차 범위(Stage 1~6)**: 매운탕(`stew_red`)만 어종별로 갈라진다(`VARIANT_RECIPES`). 나머지 7개는 154차 경로 그대로.

---

## 핵심 원칙

**Recipe ≠ Dish.** Recipe = 무엇을 어떻게 요리하는가 / DishInstance = 이번에 실제로 무엇을 만들어 냈는가.

## 0. 기존 시스템 보존 규칙

154차에 구현된 것(불요리 8종 · 필수/부가/택1/한도 · 소금·설탕 0.25큰술 · 단계 순서 · 100°C 캡+증발 · 팬 150°C ·
바람/열관성 · 익음/탐/뒤집기/졸아붙음 · 별 5개 · 시간 감쇠 · 탄 음식 0원 · 강불 방치 탐 · 약불 보온 · 실시간 패널 ·
F/Shift+F · 집 주방 무한 연료/수돗물)은 유지한다. 기존 플레이 흐름을 새 시스템 때문에 바꾸지 않는다.

## 1. 데이터 흐름

FishSpecies(+CookingProfile) → IngredientInstance(개체·중량·신선도) → RecipeDefinition → CookingSimulation(간·온도·식감·익음·탐)
→ DishInstance(최종 이름·품질·영양·버프·판매가·도감 등록).

## 2. Fish Library — CookingProfile

`fatness · texture · fishiness · flavorStrength · brothContribution · grillSuitability · stewSuitability · soupSuitability ·
fryingSuitability · moistureRetention · fleshYield` (0~1). 수치는 플레이어에게 그대로 노출하지 않는다 —
지방감(담백/보통/기름진 편) · 살 식감(부드러움/보통/탄탄함) · 비린 향(거의 없음/약함/보통/강함) · 풍미(은은함/보통/진함).

## 3~11. 레시피 8종 (요지)

| 레시피 | 주재료 영향 | 대표 효과 |
|---|---|---|
| ① 매운탕 | 국물 + 살의 균형. 우럭(국물 높음·탄탄·비린 향 낮음) / 광어(국물 중·부드러움·비린 향 매우 낮음·지방 낮음) / 감성돔(국물 높음·탄탄·지방 중~높음·풍미 높음) | 포만감 — fatness↑ 지속↑ · fishiness↓ 속 편안 · broth↑ 수분↑ |
| ② 지리 | 신선도·fishiness 영향 매우 높음 | 맑은 속 — 30분 피로 증가 −8%(비린 향·신선도 낮으면 감소) |
| ③ 생선구이 | fatness·moisture·texture·freshness·surfaceTemperature | 고소한 한 끼 — 30분 피로 감소 +8% |
| ④ 생선조림 | 무 충분 → 풍미↑ · 탄탄한 살 = 장시간 내구 · 부드러운 살 = 과조리 시 붕괴 | 든든함 — 40분 허기 감소 −10% |
| ⑤ 오징어볶음 | 두족류 — `SeafoodCookingProfile` 공통 타입. 식감이 핵심(부족 = 질김 / 과조리 = 매우 질김) | 활력 — 25분 달리기 피로 −8% |
| ⑥ 조개탕 | 조개 품질 모델(freshness·brothContribution·salinityContribution·shellYield) | 개운함 — 30분 피로 회복 +10% |
| ⑦ 전복죽 | 전복 중량 100~199 기본 / 200~399 풍부한 / 400+ 진한 | 회복식 — 45분 피로 회복 +12% |
| ⑧ 장어구이 | fatness↑ → 허기↑·포만↑·표면 난이도↑·탐 위험↑ | 원기회복 — 60분 피로 감소 +12% |

기본 효과값·부가 재료·택1·한도·단계는 154차 레시피 정의를 따른다(기획서 §4~§11의 표는 154차 데이터와 대부분 일치).

## 12. DishInstance

`instanceId · recipeId · ingredientProfile(primarySpecies·weightG·fatness·texture·fishiness) · quality(seasoning·temperature·texture·
freshness·completion·overall) · result(nameKo/En·descriptionKo/En·hungerRestore·hydrationRestore·effects·sellPrice) · createdAt ·
freshnessAtCompletion`.

## 13. 최종 효과 = 레시피 기본값 × 중량 보정 × 재료 특성 보정 × 신선도 보정 × 조리 품질 보정 → clamp(min, max)

## 14~15. 이름 규칙

기본 = `우럭 매운탕`. 수식어는 **최대 1개**, 우선순위 **탄 → (특수 실패) → 일품(overall ≥ 95 ∧ freshness ≥ 90) → 싱싱한(freshness ≥ 90) /
기름진(fatness ≥ 0.80) → 기본**. `싱싱하고 기름지고 제대로 만든 …` 금지.

## 16. 재료 품질과 조리 품질은 분리한다

좋은 재료 + 나쁜 조리 = 좋은 재료를 망친 음식 / 평범한 재료 + 완벽한 조리 = 꽤 좋은 음식.

## 17~18. 별점 5축 유지 · 상세보기에 현재/완성 직후 · 재료 특성은 숫자 대신 라벨(숙련도로 공개 범위 확장 — §33).

## 19~22. 요리 도감 — 도감 탭 「요리」 · 레시피(종류)와 발견 요리(변형) 분리 · 미발견은 `??? 매운탕` + 힌트 ·
최초 발견 이벤트(「감성돔 매운탕」 요리 도감 등록) · 같은 레시피 반복은 결과가 매번 다르다(중량·신선도·조리).

## 23~24. 중량 구간 small/medium/large/extraLarge(0~499/500~899/900~1,299/1,300+) — 회복·풍미·시간·용기 적합·가격·버프 지속.
큰 재료의 용기 문제는 154차 거부 규칙(`solidVolumeFrac 0.6`) 유지.

## 25~27. 음식 효과 = 회복 + 버프 1개(최대 + 상황성 보조 1). 종류 enum `FoodEffectKind`(satiety·hydration·fatigue_recovery·
fishing_focus·fishing_endurance·movement_endurance·cold_resistance·heat_resistance) · 지속시간 있음. 수치는 `TUNING.cook`.

## 28. 판매가 = baseRecipeValue × ingredientValueMultiplier × qualityMultiplier × freshnessMultiplier (사시미와 별개 계수 · 탄 것 0).

## 29. 상세보기 템플릿 — 별점 · 이름 · 아이콘 · 설명 · 주재료(어종·g) · 신선도/지방감/식감/비린 향 · 영양 · [효과] · 조리 품질 4축 ·
현재/완성 직후 · 판매가. 기존 wrap/흐름 배치 규칙 재사용.

## 30~32. Item Library(설명 데이터화 · ko/en) · RecipeLore(짧은 설명·요리 팁·재료 팁) — Item Library는 Stage 8.

## 33~34. 숙련도에 따른 정보 공개 · 조리 연구(데이터 구조만) — 후속.

## 35~37. 발견 id = recipe + primarySpecies(`discovery_stew_red_black_rockfish`) · **DishInstance마다 도감 항목을 만들지 않는다** ·
저장은 인스턴스 전체(재접속 시 동일 음식 복원).

## 38. 멀티 — 조리 결과는 각자 인벤토리. 공유되는 것은 화구 상태뿐(154차 그대로).

## 39. 구현 순서 — Stage 1 데이터 구조 → 2 프로필(우럭·광어·감성돔) → 3 매운탕만 연동 → 4 DishInstance → 5 상세보기 →
6 요리 도감 → **(확인 뒤)** 7 나머지 7개 → 8 Item Library → 9 `TUNING.cook` 밸런싱.

## 40. `TUNING.cook` — ingredientQuality · dishEffect · naming · pricing (수치 조정은 데이터 수정만으로).

## 41. 검증 — 매운탕 3종 · 중량·신선도 차이 · 성공/실패/탐 · 동일 재료 = 동일 결과 · 저장 왕복 · 최초 발견 1회만.

## 43. 금지 — 레시피마다 고정 아이템 무한 생성 · 재료 수치 전부 노출 · 시뮬 복제 · 효과값 컴포넌트 하드코딩 · 154차 재작성.

## 45. 한 줄 — Recipe = 만드는 방법 / Ingredient = 무엇을 넣었나 / IngredientProfile = 그 재료의 특성 / CookingResult = 어떻게 조리했나 /
DishInstance = 그래서 이번에 무엇이 만들어졌나 / DishDiscovery = 이런 종류를 발견했나.
