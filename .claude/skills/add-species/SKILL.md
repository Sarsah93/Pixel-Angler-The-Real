---
name: add-species
description: Pixel Angler 신규 어종 등록 절차 (4계층 — 오라클/도감/텍스처/경락 매핑). 새 어종·해양생물을 추가하거나 기존 어종 데이터를 정정할 때 반드시 로드. "어종 추가", "어종 등록", "DB 등록", "신규 물고기", 한치·두족류 등 특정 종 이름의 등록 작업이면 이 스킬을 따른다.
---

# 신규 어종 등록 (4계층 + 바다 가중)

**ID 표준 = 오라클** (`ORACLE_FISH_DB`). 다른 계층이 오라클과 값이 다르면 오라클 기준으로 정렬한다 (드리프트 금지 — 금지체장 불일치 사례 有).

## 등록 4계층 (전부 필수)

### 1. 오라클 — `packages/core/src/simulation/FishSpawningOracle.ts` (`ORACLE_FISH_DB`)
스폰·입질 가중의 단일 소스. 필드 관례:
- `habitat`(HabitatTerrain[]) · `minDepthM/maxDepthM` · `preferredLayers`(surface/mid/bottom — 인접층 불일치 0.15 / 두 층 어긋남 0.03 페널티)
- `baitPreference`: **BaitKey 체계**(0~100). ⚠ BaitKey(`krill`)와 BaitCategory(`krill_frozen`)는 **별개 타입** — 혼동 금지
- 크기: `minCm/maxCm/meanCm/sdCm` · `lwrA`/`lwrB`(체장-체중 W(g) = lwrA × L(cm)^lwrB — `lwrA` 필수) · `bodyForm`(필수) · `maleRatio`/`sexRule`(성전환 어종)
- 규제: `legalMinCm`(**전장 기준** — 법정 항문장이면 전장 환산: 갈치 18→47 사례) · `closedMonths` · `closedSeasons`(날짜 금어기) · `legalMinWeightG`(금지체중)
- `nightBonus`(야행성 >1 / 주행성 억제 <1 — 실생태 리서치 후 부여) · `tideActivity`(sariPeak/flatTide 헬퍼)
- `fight`: basePower · patternWeights{jump/dive/lateral} · intervalMult · mouthFragility · `lineCutter`(복어·이빨 어종)
- 두족류 = `egiOnly: true` (에기 spawnBinding 필터에 있을 때만 스폰)

### 2. 도감 — `packages/core/src/db-schema/FishDatabase.ts` (`FISH_DATABASE`)
학명·영문명·제철·서식 설명. 오라클과 수치 정합 필수. ⚠ SpotType에 `'boat'` 없음 → `'boat_fishing'`.

### 3. 텍스처 — 원본 `food assets/fish/*.png` + `data/FishTextures.ts` 표 + 카드 굽기 (246차)
- 원본(파일명 **소문자** 영어 통칭)을 `food assets/fish/`에 둔다. 사진 · 그림이 없으면 `tools/gemini_fish_art.cjs`의 `LOOKS`에 한 줄 → 생성 → `--install`(스킬 `asset-pipeline` ⑦).
- `FISH_IMAGE_FILES`에 `fish_<id>: '<파일>.png'` — BootScene이 이 표로 카드(`fish_<id>`)와 64px 아이콘(`fishicon_<id>`)을 싣는다(BootScene은 고치지 않는다).
- **`node tools/fish_cards.cjs --only <파일>`** → `--check` — 안 돌리면 BootScene 404(카드가 없다).
- `FISH_TEXTURE` 맵에 `<speciesId>: 'fish_<id>'` 등록 — 어획 팝업/인벤/도감/도마 프리뷰가 speciesId 폴백으로 공유.
- 성별·체장 분기(돌돔 암수 등)는 `resolveFishTexture`에 규칙 추가.
- 새 화면에서 어종 그림을 72px 이하로 그리면 `fitFishTexture`(아이콘 판)를 거친다. 410×166보다 크게 그리면 `fish_cards.cjs` 카드 크기도 키운다.
- 에셋이 없으면 스킵 가능(도감 '이미지 없음' 표기·파라메트릭 폴백) — 단 어디까지 미배선인지 명시.

### 4. 경락/판매가 — 3곳
- `SEAFOOD_AUCTION_MAPPING` (`core/src/types/Economy.ts`): 기본 kg단가 + `sizeFactor` + **`weightExp`**(대형어 마리당 평탄 시세 재현 — 방어 0.4처럼 sub-linear로 가격 폭증 완화. 기본 1=선형).
- `MAFRA_ITEM_TO_SPECIES` (`core/src/api-client/MafraAuctionApiClient.ts`): 시장 품목/품종명 → speciesId.
- `KOSIS_SPECIES_MATCH` (`client-pc/src/store/ExternalDataStore.ts`): 통계 분류명 → speciesId[] (다중 매핑 가능).

⚠ **매칭 테이블 순서 규칙 (조용한 오매칭 주의)**: 두 테이블 모두 **부분일치(includes) + 선착순(find)** — 품목명이 포함 관계면 **긴 쪽을 반드시 앞에**. 기존 함정: `잿방어⊃방어` · `갑오징어⊃오징어` · `말쥐치⊃쥐치` · `강도다리⊃도다리` · `개서대⊃서대`.

### 5. 바다 가중 — `packages/core/src/rules/SpeciesPresence.ts` (`SPECIES_SEA_WEIGHT`) — 289차
- 종마다 `{ east, south, west, jeju }`(0~1 — 1 주 어장 · 0.5 흔하진 않다 · 0.05 이하 거의 없다). **빠지면 시험이 실패한다**(`Presence289.test.ts` — 오라클 종 = 표 종).
- 도감의 `peakSeasonMonths` · `preferredTempC`가 이제 입질을 바꾼다(계절 가중 · 평년 수온 가중) — 제철에 그 종의 주 바다 평년 수온이
  적수온 밖이면 제철에 눌린다(288 감사: 방어 18~26℃ ↔ 겨울 제철). 등록 뒤 `node tools/check_species_temp_season.mjs`(주 바다 × 제철 달 평균 수온 가중 < 0.7을 찍는다 — 겨울 서해 냉수는 실제로 비는 것이라 남아도 된다)로 확인.
- 두족류(에기 전용)는 `LuresCatalogDB` 에기 `spawnBinding` 둘에도 넣는다 · `CephalopodProfiles` · `ButcherySections` · `CephalopodStages` · `CephalopodGuides`(손질 트리 — 살오징어는 한치 트리 공유)
  · `CookIngredientDatabase.SQUID_SPECIES` · `FishRarity.CEPH` · `TidePhasePreference` 무리 · 위키 생성기 `CEPH_FISH`.
- 그림이 없으면 `NODE_USE_ENV_PROXY=1 node tools/gemini_fish_art.cjs --out <폴더> --only <id>`(`LOOKS`에 한 줄 · **core를 먼저 빌드** — 도구가 dist에서 어종을 찾는다)
  → `--install` → `FishTextures.ts` 두 표(`FISH_TEXTURE` · `FISH_IMAGE_FILES`) → `node tools/fish_cards.cjs --only <파일>` → 위키 `python3.13 tools/gen_wiki_images.py`.

## 부가 배선 (해당 시)

- **손질 편입은 별도 단계**: `BUTCHERY_IMPLEMENTED_SPECIES`(ButcheryProfiles.ts) + `BUTCHERY_PROFILES` 프로필 + `getButcheryFamily` 분기 + 어종군 렌더(`butcherFamilyOf`/trimmings). 등록만으로는 손질 불가(unsupported 안내)가 정상.
- **dev 테스트 지급**: 손질/UI 검증 대상이면 `createDevFishDefs`(InventoryStore)에 추가 — 기존 세이브도 재로드 시 주입됨.
- 크기 등급 어종이면 `SIZE_TIER_BOUNDS`(SizeTierRules.ts), 스폰 바인딩 루어면 LuresCatalogDB `spawnBinding`.
- **core 새 파일을 만들었으면 `core/src/index.ts` export 필수.**

## 검증

1. 스폰 가능 확인: `weightedCandidates` 기반 분포 시뮬(주/야·지형·수심층 케이스) — 신규 종 weight > 0.
2. 판매가 산정: `evaluateFishSellPrice`로 소/중/대 3점 가격이 실측 시세대와 정합하는지 (폭증 시 weightExp 조정).
3. 도감 카드 렌더(이미지·제철 행) + 어획 팝업 실사 이미지 — verify-render 스킬로 실렌더 확인.
4. `npx pnpm run build` 3/3 + client typecheck 0.
