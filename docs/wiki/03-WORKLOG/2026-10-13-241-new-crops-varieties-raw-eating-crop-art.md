# 241차 — 새 작물 5종 · 개량종 3종 · 날로 먹기 · 작물 그림 기준(사진 → 도트) · 스킬 수치 정본

| | |
|---|---|
| **날짜** | 2026-10-13 |
| **시스템** | `농장` `인벤토리` `도감·위키` `에셋` `진행(스킬)` |
| **트리거** | 사용자 지시(4건 — 우선순위 ② 스킬 수치 정본 → ① 새 작물 · 개량종 → ④ 날로 먹기 → ③ 작물 그림 정합) |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` |
| **빌드·타입체크** | 3/3 · 0 오류 · core 175/175(새 10) |

---

## 1. 배경 — 왜 했나

사용자 지시(2026-10-13) 네 갈래.

- ① 「다음 텃밭 차수 진행 — 새 작물 5종 추가하고 개량종까지 진행해줘.」
- ② 하모니 일일 점검의 보류 질문(P-0020 · F-0088 · F-0095) — 「스킬 트리의 노드 수와 총 포인트 중 어느 쪽이 정본인지 ·
  어느 작업 차수에서 어긋났는지 확인해.」
- ③ 「작물 그래픽 … 실제 이미지와 다른 부분들이 너무 많이 보여. 땅콩은 이해가 되지 않아 … 작물 이미지 도트 디자인이 현재 어종에 적용된
  그래픽과 너무 차이가 나기 때문에 한쪽으로 정합을 해줘야 할 것 같아 … 해상도 및 비트 심도 · 색 재현성 · 선명도 및 대비 · 질감 · 노이즈 및 왜곡,
  이 다섯 가지 요소를 물고기 그래픽으로부터 뽑아내서 작물에 적용 … 그 기준으로 현재 물고기 에셋들도 점검.」
- ④ 「수확한 작물을 가열/조리하지 않아도 먹을 수 있는 작물들을 식별하고 적용(영양 · 수분 · 상태이상 등) … 상세보기에서 섭취 시 발생할 일에
  대한 가벼운 정보 … wiki에 업데이트.」

## 2. 판단 — 스킬 수치 정본(②)

- **정본 = 코드.** `SkillDatabase.ts` 실측: 노드 **95 = 유료 90 + 시너지 히든 5**, Σ(유료) = **216** = 만렙 200 + 면허 보너스 15 + 시작 보너스 1.
  무결성 검사(모듈 로드 시)가 이 등식을 지키고 있고, 세이브가 이 비용을 쓰므로 문서 쪽을 코드에 맞춘다.
- **어긋난 차수**: ⓐ 193차 — 「한 바늘에 두 미끼」 +1pt를 넣으면서 우변에 시작 보너스 1을 붙여 215 → 216이 됐는데 머리 주석의
  「215 등식」 문단을 안 고쳤다. ⓑ 235차 — 농사 「산채 재배」 · 「수경 재배」 2노드를 더해 93 → 95로 고치면서 괄호 안 「유료 88」을 90으로 안 올렸다.
  (사용자 추정 「농사 관련 추가하면서 생긴 것」은 노드 수 쪽에 맞다. 215/216은 193차.)
- 정정 8곳: `SkillDatabase.ts` 머리 · 하단 docblock, `Progression.ts` 주석 2, `README.md` 2, `docs/wiki/README.md`, `progression.md` 6,
  `PROGRESSION_SURVIVAL_SPEC.md` §2 머리에 현행 대조 한 줄.
- F-0095([E] → [F]): 심리스 필드 상호작용 키 문맥만 7곳(`night-hunting-trap.md` 2 · `world-field.md` · `home-base.md` 2 · `TrapFieldSystem.ts` 2 ·
  `RegionFieldScene.ts` 주석 3 · `tuning.ts`). 장비창 [E]와 레거시 FieldScene 힌트(`SpotFieldLayouts` · `YoilBayFieldMap`)는 맞는 표기라 두었다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`types/Farming.ts`](../../../packages/core/src/types/Farming.ts) | `CropVariant`(원종 · 거둔 횟수 · 다른 점) · `CropDef.variant` · `CareTaskId 'stevia_feed'` |
| 수정 | [`db-schema/CropDatabase.ts`](../../../packages/core/src/db-schema/CropDatabase.ts) | **새 작물 5**(참외 · 수박 · 블루베리 · 토마토 · 딸기) · **개량종 3**(스테비아 토마토 · 호박고구마 · 청양고추) · 곡선 4(연평균 1.00 `norm`) · 난이도 8 · 자재 `farm_stevia` · `variantsOf` · `baseCropOf` · `variantUnlockKo` |
| 신설 | [`db-schema/CropRawEatDatabase.ts`](../../../packages/core/src/db-schema/CropRawEatDatabase.ts) | 수확물 기본 id **84종 전수** — 먹는다 46 · 나눠서 13 · 못 먹는다 25. 단위 영양(g · kcal · ml · 매운 것 `mlNet`) · 메모 ko/en · 조각(`_pc`) · `rawEatStatus` · `FOOD_NUTRITION` 등록 |
| 수정 | [`db-schema/CropCareDatabase.ts`](../../../packages/core/src/db-schema/CropCareDatabase.ts) | 토마토 표(멀칭 · 지주 2 · 곁순 · 유인 · 웃거름 · 방제 4 · 걷어 내기 — 첫 꽃 따기는 뺀다) · 스테비아 표(+발효액 4회) · 청양고추 = 고추 표 |
| 수정 | [`rules/ProduceMarket.ts`](../../../packages/core/src/rules/ProduceMarket.ts) | KAMIS 품목 6(참외 · 수박 · 토마토 · 딸기 · 고구마/호박 · 풋고추/청양) |
| 신설 | [`simulation/Farm241.test.ts`](../../../packages/core/src/simulation/Farm241.test.ts) | 10건 — 칸 · 날 상한 · 곡선 평균 · 육묘 · 개량종 값 배율 · 날로 먹기 전수 · 조각 · 영양 파생 |
| 수정 | [`data/CropItems.ts`](../../../packages/client-pc/src/data/CropItems.ts) | 조각 템플릿(`농산물 조각` · 등급 없음 · `unpack`) · 템플릿에 허기/수분 부착 · 가게 게이트 `requiresHarvests` · `variantNoticeKo` |
| 수정 | [`store/FarmStore.ts`](../../../packages/client-pc/src/store/FarmStore.ts) | 작물별 거둔 횟수 `harvestsBy`(세이브 · 백필 빈 표) · n번째 거둔 순간 개량종 알림(큐 + 메시지 꼬리) |
| 수정 | [`ui/ShopPanel.ts`](../../../packages/client-pc/src/ui/ShopPanel.ts) · [`data/ShopCatalog.ts`](../../../packages/client-pc/src/data/ShopCatalog.ts) | 진열 조건 「원종 n번 거둔 뒤」 |
| 수정 | [`ui/InventoryPanel.ts`](../../../packages/client-pc/src/ui/InventoryPanel.ts) | 농산물 「사용하기」 = 날로 먹는 것만(날생선 규칙과 같음) · 큰 단위는 「나누기」 |
| 수정 | [`store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | 조각 템플릿 조회 · 구세이브 큰 수확물 `unpack` 백필 |
| 수정 | [`data/ItemVitals.ts`](../../../packages/client-pc/src/data/ItemVitals.ts) | 날로 먹는 수확물 효과 표(영양 파생 · 피로 0) |
| 수정 | [`ui/ItemDetailPanel.ts`](../../../packages/client-pc/src/ui/ItemDetailPanel.ts) | 줄 「날로 먹기」 · 「원종」 · 「개량종 — 지금 n/3번」 · 본문 꼬리 [날로 먹기] · [익혀야] · [개량종] · 조각 상세 · **작물 초상** |
| 수정 | `i18n/I18n.ts` · `i18n/en_farm.ts` · `data/HelpContent.ts` | 런타임 사전(메모 · 이유 · 다른 점 · 조각 이름) · 라벨 · 규칙 14 · 도움말 「날로 먹기 · 개량종」 2쪽 + 영어 |
| 수정 | [`tools/gen_pixel_icons.py`](../../../tools/gen_pixel_icons.py) | 원형 5(둥근 열매 · 줄무늬 · 참외 · 딸기 · 블루베리 송이) · 아이콘 19(작물 8 · 씨앗 2 · 모종 7 · 순 1 · 발효액) |
| 신설 | [`tools/pixelize_crops.cjs`](../../../tools/pixelize_crops.cjs) · [`tools/lib_png.cjs`](../../../tools/lib_png.cjs) | **작물 사진 → 픽셀 아트 grade 초상**(배경 벗기기 · 닫힘 · 셀 6px · 긴 변 192셀 · **툰 추상화** = 양방향 필터 → 6단 양자화 → DoG 먹선 → 32색 · 실루엣 윤곽 · 64px 아이콘 · `CropPortraits.ts`) — Pillow 없이. `--style photo`(1차 사진 블록) · `kuwahara`(v2) 보존 |
| 신설 | [`tools/check_art_quality.cjs`](../../../tools/check_art_quality.cjs) | 실사 도트 에셋 **5기준 실측기**(셀 주기 · 알파 · 색 수 · 대비 · 경계 · 질감 · 노이즈 · 깃발 · `--fix-alpha`) |
| 신설 | `public/crops/crop_peanut.png` · `_icon.png` · `food assets/crops/crop_peanut.png` · `data/CropPortraits.ts` | 땅콩 시연(사용자 사진) — 1176×1032 · 셀 6 · 196셀. **1차본은 사진 블록화라 사용자 지적 → 2차 툰 추상화**(팔레트 30 · 색 52 · 테두리 어두움 100%) |
| 수정 | `scenes/BootScene.ts` · `ui/ItemIcon.ts` | 초상 로드(`cropimg_*` · `cropicon_*`) · 칸 ≤ 72px은 아이콘 판, 그 위는 초상 |
| 수정 | `tools/gen_game_wiki_data.mjs` · `tools/game_wiki_template.html` · `tools/wiki_img/` | 작물 상세 「날로 먹을 수 있나」 · 「개량종」 절 · 태그 · 아이템 「농사」 절 줄 · 조각 역참조 · 그림 20장 |
| 수정 | 스킬 수치 · [E] 문서 8 + 7곳 | §2 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- `S8 홈베이스 → 농장 E1 텃밭 → 작물 DB(데이터) · 관리 표(데이터) · 날로 먹기(데이터 + 판정) · 개량종(데이터 + 가게 게이트 + 세이브)`.
- `S5 인벤토리 → 소모품 효과 표(ItemVitals — 데이터) · 우클릭 행동(렌더 · 판정)`.
- `S20 도감 · 위키 → 생성기(데이터 → HTML)`.
- `S23 캐릭터 · 에셋 → 실사 도트 에셋 기준(새 페이지 photo-pixel-art.md) — 도구 2 · 렌더 배선(아이콘 · 상세)`.
- `S21 진행 → 스킬 예산 문서(주석 · 문서만 — 코드 수치 불변)`.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| core 전체 | `vitest run` | **175/175**(새 10 · 기존 2건 기대치 갱신 — 난이도 분포 [33, 28, 6, 9] · 작물 76종) |
| 칸 · 날 수익 상한 | `cropDailyValue` 전수 | 새 8종 전부 ≤ 1,000원(참외 174 · 수박 288 · 블루베리 261 · 토마토 285 · 딸기 243 · 스테비아 520 · 호박고구마 69 · 청양 231) |
| 날로 먹기 전수 | `allProduceBaseIds` ↔ 두 표 | 빠진 것 0 · 겹친 것 0 · 오타 0(표의 id는 전부 실제 수확물) |
| 실게임 — 효과 | Playwright `__INV` 지급 | 청양고추 수분 **−2** · 상추 허기 +1 수분 +5 · 감자 효과 없음(먹기 자체 없음) · 수박 통 `unpack` → **수박 한 쪽 8개** |
| 실게임 — 우클릭 메뉴 | 실마우스 우클릭 3종 | 수박 통: 「상세보기 · **나누기** · 퀵슬롯 등록 · 전환하기 · 버리기 · 완전제거 · 취소」(사용하기 없음) · 감자: 사용하기 **없음** · 상추: **사용하기** 있음 |
| 실게임 — 상세보기 | `buildItemDetail` + 실렌더 캡처 4장 | 감자 「날로 먹기: 못 먹는다 — 익혀야」 + [익혀야] 이유 · 토마토 「나눠서 먹는다 (5조각)」 · 「개량종: 스테비아 토마토 — 지금 0/3번」 · 스테비아 모종 「원종: 토마토」 · 손이 가는 일에 「스테비아 발효액 주기 4회」 · 토마토 씨앗 「거두는 것: 토마토 모종 20~30포기」 |
| 종묘사 게이트 | `nurseryFarmEntries` | 스테비아 모종 `requiresHarvests {tomato, 3}` · `minLevel 15` · `FarmStore.harvestsOf('tomato')` 0 |
| 작물 초상 | 텍스처 · `cropPortraitTexture` · 상세 캡처 | `cropimg_crop_peanut` · `cropicon_crop_peanut` 존재 · 칸 36px → 아이콘 판 · 상세 → 초상 · **상세보기에 땅콩 실사 도트가 크게** (토마토는 초상이 없어 16px 손그림 그대로) |
| 어종 에셋 5기준 | `check_art_quality.cjs public/fish` 53장 | 긴 변 511~2,172(중앙값 1,259) · 셀 2~14px(중앙값 6) · 가로 85~728셀(192) · 반투명 테두리 10% · 색 1,033~31,727(5,162) · 밝기 sd 29~87(60) · 노이즈 7~46(22) |
| 어종 깃발 | 같은 도구 | **알파 전면 252~253 + 알파 1 유령 픽셀**: black_rockfish · blackthroat_seaperch · flounder · korean_pomfret · pacific_cod · red_snapper_rockfish · sea_bass · silver_pomfret · tiger_puffer · yellowfin_goby(10) · **셀 없음(사진 그대로)**: common_octopus · jack_mackerel · mackerel · spanish_mackerel · swordtip_squid · rainbowfish 암수(7) · **셀 굵음 ≥ 12px**: black_sea_bream 12 · bigfin_reef_squid 13 · spotted_knifejaw 14 · **대문자 파일명**: So-iuy_mullet |
| 위키 Version 40 | file:// Playwright | 작물 76/76 · 수박 절 8(날로 먹을 수 있나 포함) · 태그 「날로 먹을 수 있음」 · 조각 카드(아이템 탭) 「농사」 절 · 토마토 「개량종」 절 · 스테비아 태그 「개량종 — 토마토에서」 · 땅콩 그림 392×344(초상) · 깨진 그림 0 · pageerror 0 |
| 빌드 | `pnpm run build` · typecheck | 3/3 · 0 |

재현: `node scratchpad/r241.cjs`(지급 · 상세 · 게이트 · 초상) · `r241b.cjs`(우클릭 메뉴 — 가방은 `toggleInventory()` 직접 호출 · `currentTab = 'food'`) ·
`wiki241.cjs`(file:// 위키) · 스크린샷 `scratchpad/shots/241_*.png`.

### 5.1 2차 지시 — 「픽셀 아트 grade」 대조(2026-10-13)

사용자: 「생땅콩 이미지를 내가 전달해준 걸 그대로 복붙한거야…? 픽셀 아트 grade로 어느 정도는 조정해야지」 + 참고 두 쌍(바칸 사진 ↔ 변환본 · 곽크릴 사진 ↔ 변환본).

| 대상 | 방법 | 결과 |
|---|---|---|
| 참고본 실측 | `scratchpad/art/palette_measure.cjs` · `check_art_quality.cjs` | 바칸 변환본: 1024px · 셀 3~4px · 실루엣 테두리 어두움 94% · 밝기 양봉(검정 48% · 흰 30%) · 90% 덮는 색 1,550 / 곽크릴: 테두리 66~75% |
| v2 쿠와하라 + 24색 + 밝기 차 먹선 | 같은 사진 3장 | 실패 — 바칸 끈 · 빨간 테 · 로고 소실, 땅콩은 갈색 얼룩(`cmp_bakkan.png` · `cmp_peanut.png`) |
| v3 툰 추상화(양방향 3회 · 6단 · DoG 선 · 32색 · 윤곽) | 같은 사진 3장 + 변형 3종(채도 · 대비 · 단) | 바칸 끈 · 테 · 로고 · 라벨 유지, 땅콩 그물 = 먹선 · 면 띠(`cmp_bakkan3.png` · `cmp_peanut3.png` · `sweep_*.png`). 기본값 = B(채도 1.15 · 대비 1.1 · 6단 · φ 3) |
| 최종 땅콩 | `node tools/pixelize_crops.cjs --only crop_peanut` | 팔레트 30 · 색 52 · 테두리 어두움 100% · 위키 그림 392×344 교체 |

## 6. 잔여 — 이번에 안 한 것

- **픽셀 아트 grade 보정** — 고전 필터는 구조를 새로 그리지 못한다(참고본은 생성 모델 + piskel). 질감 많은 농산물 사진 ↔ 변환본 2~3쌍과 변환 도구 · 설정을 받아 기본값을 맞춘다(사용자 제안 「에셋이 더 필요하면 첨부」).
- **작물 사진 73장**(땅콩 빼고) — 컨테이너가 이미지를 받아 오지 못한다(프록시 차단). 사용자가 `food assets/crops/<수확물 기본 id>.png|jpg`로 넣으면
  `node tools/pixelize_crops.cjs` 한 번으로 초상 · 아이콘 · 목록이 생긴다(저작권이 깨끗한 사진 — 어종처럼).
- **어종 에셋 정합(알파 정규화 · 셀 굵기 통일)** — `check_art_quality.cjs --fix-alpha`가 사본(`.fixed.png`)을 만든다. 10장 교체 · 셀 2px 7장의 재굽기는
  사용자 결정 뒤(에셋 바이너리 교체는 레포 크기 영향).
- 16px 손그림 아이콘을 초상에서 자동으로 내려 만들기(면적 평균 16px은 뭉개진다 — 손그림 그대로 두고 초상이 있으면 64px 아이콘 판을 쓴다).
- 개량종 해금은 **241차 이후 거둔 횟수**만 센다(구세이브의 지난 수확은 모른다) — 체감이 억울하면 `harvests`(전체) ≥ 3이면 열어 주는 완화를 검토.
- 스테비아 농법을 다른 작물(딸기 · 참외)로 확장 · 호박고구마 · 청양 외 개량종(완숙 대추토마토 · 꿀고구마 · 오이맛고추).
- 날로 먹는 것의 상태이상은 매운 것의 수분 감소뿐 — 설사(생것 과식) 같은 벌칙은 넣지 않았다(사용자 「가벼운 정보 정도」).
- 하모니 원장(`harmony-state` 브랜치 F-0088 · F-0095)의 상태 갱신은 하모니 예약 작업 몫 — 이 세션은 코드 · 문서만 고쳤다.

## 7. 위험·부작용

- `FarmSaveState.harvestsBy`는 선택 필드 — 구세이브는 빈 표로 읽힌다(스키마 v 그대로). 구세이브 큰 수확물의 `unpack`은 로드 백필이 붙인다.
- 수확물 템플릿에 허기 · 수분이 붙어 가게 판매가 · 요리에는 영향이 없다(효과 필드만). 조각(`농산물 조각`)은 `shopBuysItem`이 사지 않는다(의도).
- `InventoryPanel` 「사용하기」 조건이 농산물에서 좁아졌다 — 날로 못 먹는 25종은 이제 메뉴에 사용하기가 없다(전에는 눌러도 효과 없는 사용하기가 떴다).
- `P_CORN` 곡선(연평균 1.12 · 235차 추정)은 그대로 — 241차 평균 시험은 새 8종만 본다.
- 작물 초상은 `px:crop_*` 키에 맞는 초상이 있을 때만 — 등급 꼬리 · 조각 템플릿도 같은 `px:<기본 id>`를 쓰므로 함께 바뀐다.
- `pixelize_crops.cjs`의 배경 벗기기는 흰(단색) 배경 전제 — 어두운 배경 · 그림자 짙은 사진은 `--tol` · `--close`를 조정한다(땅콩: 30 · 4).

## 8. 후속 반영

- [x] 시스템 페이지 `home-base.md` §2 · §4 · §5 · §6 / `discovery-wiki.md` §2 · §4 / `progression.md` 수치 / 새 페이지 `photo-pixel-art.md`
- [x] `04-BACKLOG.md` BQ
- [x] `AGENTS.md` §9 요약 + 링크 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 최근 3
- [x] 새 함정 → `home-base.md` §6 · 스킬 `asset-pipeline`(작물 초상 파이프라인) · `verify-render`(가방 단축키 게이트 · 탭)
