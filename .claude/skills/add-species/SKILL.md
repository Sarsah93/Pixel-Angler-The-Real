---
name: add-species
description: Pixel Angler 신규 어종 등록 절차 (4계층 — 오라클/도감/텍스처/경락 매핑). 새 어종·해양생물을 추가하거나 기존 어종 데이터를 정정할 때 반드시 로드. "어종 추가", "어종 등록", "DB 등록", "신규 물고기", 한치·두족류 등 특정 종 이름의 등록 작업이면 이 스킬을 따른다.
---

# 신규 어종 등록 (4계층)

**ID 표준 = 오라클** (`ORACLE_FISH_DB`). 다른 계층이 오라클과 값이 다르면 오라클 기준으로 정렬한다 (드리프트 금지 — 금지체장 불일치 사례 有).

## 등록 4계층 (전부 필수)

### 1. 오라클 — `packages/core/src/simulation/FishSpawningOracle.ts` (`ORACLE_FISH_DB`)
스폰·입질 가중의 단일 소스. 필드 관례:
- `habitat`(HabitatTerrain[]) · `minDepthM/maxDepthM` · `preferredLayers`(surface/mid/bottom — 인접층 불일치 0.15 / 두 층 어긋남 0.03 페널티)
- `baitPreference`: **BaitKey 체계**(0~100). ⚠ BaitKey(`krill`)와 BaitCategory(`krill_frozen`)는 **별개 타입** — 혼동 금지
- 크기: `minCm/maxCm/meanCm/sdCm/weightFactor`(W≈wf·L³) · `maleRatio`/`sexRule`(성전환 어종)
- 규제: `legalMinCm`(**전장 기준** — 법정 항문장이면 전장 환산: 갈치 18→47 사례) · `closedMonths`
- `nightBonus`(야행성 >1 / 주행성 억제 <1 — 실생태 리서치 후 부여) · `tideActivity`(sariPeak/flatTide 헬퍼)
- `fight`: basePower · patternWeights{jump/dive/lateral} · intervalMult · mouthFragility · `lineCutter`(복어·이빨 어종)
- 두족류 = `egiOnly: true` (에기 spawnBinding 필터에 있을 때만 스폰)

### 2. 도감 — `packages/core/src/db-schema/FishDatabase.ts` (`FISH_DATABASE`)
학명·영문명·제철·서식 설명. 오라클과 수치 정합 필수. ⚠ SpotType에 `'boat'` 없음 → `'boat_fishing'`.

### 3. 텍스처 — `public/fish/*.png` + BootScene + `data/FishTextures.ts`
- BootScene `load.image('fish_<id>', 'fish/<파일>.png')` — 상대경로(선행 `/` 금지).
- `FISH_TEXTURE` 맵에 `<speciesId>: 'fish_<id>'` 등록 — 어획 팝업/인벤/도감/도마 프리뷰가 speciesId 폴백으로 공유.
- 성별·체장 분기(돌돔 암수 등)는 `resolveFishTexture`에 규칙 추가.
- 에셋이 없으면 스킵 가능(도감 '이미지 없음' 표기·파라메트릭 폴백) — 단 어디까지 미배선인지 명시.

### 4. 경락/판매가 — 3곳
- `SEAFOOD_AUCTION_MAPPING` (`core/src/types/Economy.ts`): 기본 kg단가 + `sizeFactor` + **`weightExp`**(대형어 마리당 평탄 시세 재현 — 방어 0.4처럼 sub-linear로 가격 폭증 완화. 기본 1=선형).
- `MAFRA_ITEM_TO_SPECIES` (`core/src/api-client/MafraAuctionApiClient.ts`): 시장 품목/품종명 → speciesId.
- `KOSIS_SPECIES_MATCH` (`client-pc/src/store/ExternalDataStore.ts`): 통계 분류명 → speciesId[] (다중 매핑 가능).

⚠ **매칭 테이블 순서 규칙 (조용한 오매칭 주의)**: 두 테이블 모두 **부분일치(includes) + 선착순(find)** — 품목명이 포함 관계면 **긴 쪽을 반드시 앞에**. 기존 함정: `잿방어⊃방어` · `갑오징어⊃오징어` · `말쥐치⊃쥐치` · `강도다리⊃도다리` · `개서대⊃서대`.

## 부가 배선 (해당 시)

- **손질 편입은 별도 단계**: `BUTCHERY_IMPLEMENTED_SPECIES`(ButcheryProfiles.ts) + `BUTCHERY_PROFILES` 프로필 + `getButcheryFamily` 분기 + 어종군 렌더(`butcherFamilyOf`/trimmings). 등록만으로는 손질 불가(unsupported 안내)가 정상.
- **dev 테스트 지급**: 손질/UI 검증 대상이면 `createDevFishDefs`(InventoryStore)에 추가 — 기존 세이브도 재로드 시 주입됨.
- 크기 등급 어종이면 `SIZE_TIER_BOUNDS`(SizeTierRules.ts), 스폰 바인딩 루어면 LuresCatalogDB `spawnBinding`.
- **core 새 파일을 만들었으면 `core/src/index.ts` export 필수.**

## 검증

1. 스폰 가능 확인: `weightedCandidates` 기반 분포 시뮬(주/야·지형·수심층 케이스) — 신규 종 weight > 0.
2. 판매가 산정: `evaluateFishSellPrice`로 소/중/대 3점 가격이 실측 시세대와 정합하는지 (폭증 시 weightExp 조정).
3. 도감 카드 렌더(이미지·제철 행) + 어획 팝업 실사 이미지 — verify-render 스킬로 실렌더 확인.
4. `npx pnpm run build` 4/4 + client typecheck 0.
