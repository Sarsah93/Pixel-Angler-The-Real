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
  **행이 없으면 「g당 10원」 폴백**(kg 10,000 · 보정 없음 — 302차에 다섯 종이 그랬다) — core 시험 `FishPrice302`가 오라클 · 도감 전 종을 막는다.
  kg 단가에는 **근거 주석**(출처 · 연도 · 생물/냉동/원양 구분)을 단다. 같은 물고기의 도감 갈래(참돔 야간)는 행 대신 `PRICE_SPECIES_ALIAS`.
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

### 5. 그 밖의 층 (322차 — 9종을 넣으며 확인한 것)

- `rules/SpeciesPresence.ts` `SPECIES_SEA_WEIGHT` — 바다별 가중(동 · 남 · 서 · 제주 · 울릉). 없으면 1(막지 않는다)이라 **모든 바다에 흔하게 나온다**.
- `db-schema/FishCookingProfiles.ts` — 조리 프로필 한 줄(`P(...)` 열두 값).
- `simulation/FishRarity.ts` `fightGroupOf` — 파이팅 어종군(작은 표층어 = `mackerel` · 바리류 · 볼락류 = `rockfish`). 없으면 `other`.
- `ui/FishTemplateRenderer.ts` `FISH_COLORS` — 그림이 없을 때의 대체 그림 · 도마 공용 그림 물들이기 색.
- **드문 어종은 `abundance`(0~1)** — 바다 · 철 · 수심 · 미끼가 다 맞는 자리에 사는 다른 어종이 적으면 가중이 낮아도 몫이 커진다(자바리 28%가 나왔다).
  넣은 뒤 가장 알맞은 문맥에서 `speciesBiteShare`로 재 본다(「가끔」 = 5% 안팎 · 「아주 드물게」 = 1% 아래).
- **금어기에 지역 예외가 있으면 `closedSeasonExemptRegions`**(전어 — 강원 · 경북 제외). `closedMonths`는 금어기 판정에도 쓰인다 — 금어기 없는 어종에 산란기 표시로 넣지 않는다.
- 시험: `ButcheryFlow322.test.ts`의 「새 어종 9」 묶음이 층 정합(이름 · 규제 · 체장-체중 · 품목 매핑 · 존재 · 손질 분류)을 본다 — 새 어종을 넣으면 목록에 더한다.

### 6. 그림이 아직 없을 때 (322차)

- 그림 없이 등록할 수 있다 — `FISH_TEXTURE` · `FISH_IMAGE_FILES`에 **줄을 넣지 않는다**(없는 파일을 적으면 부팅 404 · `fish_cards.cjs` 실패). 도감 칸은 「이미지 없음」, 가방은 대체 그림.
- 손질은 열지 않는다: 프로필 · 어종군까지 배선하고 `BUTCHERY_WIRED_SPECIES` + **`BUTCHERY_ART_PENDING_SPECIES`**에 넣는다(옆면은 그 어종 그림이어야 한다 — 다른 어종 그림으로 대신 열지 않는다).
- 그림이 생기면: ① `tools/gemini_fish_art.cjs`(생김새 `LOOKS`) → `--install` ② `FishTextures.ts` 두 표에 한 줄씩 → `node tools/fish_cards.cjs`
  ③ `tools/gen_species_sprites.cjs` 표(이미 있으면 그대로) 실행 ④ `BUTCHERY_ART_PENDING_SPECIES`에서 빼기 ⑤ 필렛 그림(`gemini_fillet_art.cjs` 또는 `FILLET_SPECIES_ALIAS`) ⑥ 위키 그림.
- **322(2) 실측 순서**(9종 · 41장 · 약 2,000원): 어종 그림 → 검수 시트(`montage`) → `--install` → 표 두 곳 → `fish_cards.cjs` → `gen_species_sprites.cjs` →
  필렛 `gemini_fillet_art.cjs --whole`(반쪽 통째 — 316 방식) → `--install` → `split_fillet_art.cjs --only <큰 어종>` → `--side --only …` → `--bake` →
  `gen_sashimi_fillet.cjs --species` → 대기 목록에서 빼기 → 큰 어종이면 `LoinArt.loinLook` 살빛 → `--wiki-sheets` · `gen_wiki_images.py` · 위키.
- **생김새 설명에 「○○처럼」을 쓰면 그 어종이 나온다** — 다금바리에 「농어처럼 길쭉하고 날씬한」이라 적어 농어가 나왔다.
  모양이 어긋나면 실물 사진을 `--photo <파일>`로 함께 보낸다(사진은 저장소에 두지 않는다 · 「사진의 흐릿함은 따라 하지 말 것」이 지시문에 들어 있다).
- **가는 실 · 수염 같은 한 칸 굵기 돌기는 그리게 하지 않는다** — 전어 등지느러미 마지막 줄기를 「긴 실」로 적었더니 몸에서 떠서 구불거리는 선이 나와
  「머리카락이 남은 것 같다」는 지적을 받았다(사용자 결정 = 지운다). 필렛 살빛도 첫 판을 본다(전어가 고등어처럼 붉게 나왔다 — 「붉지 않다」를 적는다).

## 부가 배선 (해당 시)

- **장어형 몸(315)**은 `tree: 'eel'` — `tools/gen_eel_views.cjs`의 `SPECIES`에 몸 윤곽 · 색 · 가르는 쪽(`open`) · 뼈끊기 · 껍질 벗기기를 한 줄 더해 그림과 유도선을 같이 굽고, 프로필 `filletCount: 1` + `BUTCHERY_IMPLEMENTED_SPECIES`에 넣는다(섹션은 `EEL_SECTIONS`가 단계로 줄인다).
- **손질 편입은 별도 단계**: `BUTCHERY_IMPLEMENTED_SPECIES`(ButcheryProfiles.ts) + `BUTCHERY_PROFILES` 프로필(작은 생선은 `tree: 'small'`) + **어종군 표 `butcheryArtFamily`**(313 — 유도선 · 도마 그림 · 부산물 아이콘 단일 출처, client `butcherFamilyOf`는 이것을 읽는다) +
  도마 온마리 그림(`tools/gen_species_sprites.cjs` 표 · 넙치는 `gen_flatfish_sprites.cjs`) + `ButcheryPanel.guessSpecies` 이름 폴백. 등록만으로는 손질 불가(unsupported 안내)가 정상.
- **dev 테스트 지급**: 손질/UI 검증 대상이면 `createDevFishDefs`(InventoryStore)에 추가 — 기존 세이브도 재로드 시 주입됨.
- 크기 등급 어종이면 `SIZE_TIER_BOUNDS`(SizeTierRules.ts), 스폰 바인딩 루어면 LuresCatalogDB `spawnBinding`.
- **core 새 파일을 만들었으면 `core/src/index.ts` export 필수.**
- **통발로만 드는 생물(독도새우 — 295차)**: 어종이 아니라 **갯것 DB**(`ShoreCreatureDatabase.ts`)에 `trapOnly: true · trapTypes · trapSeas`로 넣는다.
  `rollForageSpots`가 풀에서 빼고 `harvestTrap`이 통발 종류 · 바다(`seaOf(regionId)`)로 거른다. 그림은 `tools/gemini_forage_art.cjs` LOOKS → `--install` → `node tools/forage_cards.cjs --only <id>`.
- **그림이 없는 새 어종은 Gemini로**(295차): `tools/gemini_fish_art.cjs`의 `LOOKS`에 한 줄 → `NODE_USE_ENV_PROXY=1 node tools/gemini_fish_art.cjs --out <폴더>` → 검수 → `--install` → `node tools/fish_cards.cjs --only <파일>`.
  ⚠ 도구는 **core dist**에서 어종 DB를 읽는다 — `npx pnpm --filter @tra/core run build`를 먼저 하지 않으면 「어종 DB에 없다」로 건너뛴다.
- **지역 특산이면 `REGIONAL_SPECIALTIES`에도**(294 · 295 — `db-schema/RegionalSpecialty.ts`): 지역 · 제철 · 배율 · 유래. 다섯 바다 가중(`SPECIES_SEA_WEIGHT`)은 `Presence289.test`가 빠짐을 잡는다.

## 검증

1. 스폰 가능 확인: `weightedCandidates` 기반 분포 시뮬(주/야·지형·수심층 케이스) — 신규 종 weight > 0.
2. 판매가 산정: `evaluateFishSellPrice`로 소/중/대 3점 가격이 실측 시세대와 정합하는지 (폭증 시 weightExp 조정).
3. 도감 카드 렌더(이미지·제철 행) + 어획 팝업 실사 이미지 — verify-render 스킬로 실렌더 확인.
4. `npx pnpm run build` 3/3 + client typecheck 0.
