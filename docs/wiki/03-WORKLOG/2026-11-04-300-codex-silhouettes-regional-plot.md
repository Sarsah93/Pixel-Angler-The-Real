# 300차 — A 도감 표현 통일(실루엣 한 벌 · 힌트 글 · 탭 「아이템」) · 사이소 24시간(임시) · B 지역 텃밭 제한 · 1단계(창 관리형 빌린 밭)

| | |
|---|---|
| **날짜** | 2026-11-04 |
| **시스템** | `발견 도감` `UI` `상점(영업시간)` `텃밭(지역)` `경제(특산)` |
| **트리거** | 사용자 지적 · 지시(2026-11-04 캡처 1장) — 「가방 — 플레이로 입수 · 직판장에서 구매 · 발견 10/58 — 취득하면 등록 … 코드/로직에서 처리되는 경로 같은 것들을 텍스트로 유저에게 표시하지 마. … ???로 입수 · ???에서 구매 · 10/58」 · 「'아이템 위키'가 아니라 '아이템'」 · 「아이템/요리/특산도 어종도감처럼 미발견 상태를 실루엣으로」 · 「해양생물 탭 실루엣 테두리가 어종도감과 다름 … 전부 실루엣 형태로 통일」 · 「사이소 영업시간을 임시로 24시간으로(QA 새벽 테스트) … 여기까지 반영하고 main 재배포」 · 「300 지역 텃밭 제한 · 1단계 착수」 |
| **커밋** | A = `1daa9ce`(기록 `c5c54bb`) · B = 이 워크로그를 채운 커밋 |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 499(B +7) |

---

## 1. 배경 — 왜 했나

### 1-1. A — 도감 글이 「AI가 달아 놓은 코멘트」처럼 읽혔다

사용자 캡처(도감 › 아이템 위키 › 장비)에서 빨간 테 셋: 「가방 — 플레이로 입수」 · 「직판장에서 구매」 · 「발견 10 / 58 — 취득하면 등록」.
「힌트를 주는 것과 동시에 AI가 코멘트를 달아 놓은 것 같은 느낌 … 코드/로직에서 처리되는 경로 같은 것들을 텍스트로 유저에게 표시하지 마」.
대화창을 직설로 쓰지 않기로 한 것(150차 R1 · R4)과 같은 결의 지적이다 — **도감 글도 사람이 쓰는 말이어야 한다.**

- 「플레이로 입수」 = 「상점 판매 목록에 없다」는 로직을 글로 옮긴 것. 「취득하면 등록」 = 발견 스토어의 등록 조건. 둘 다 플레이어의 말이 아니다.
- 「직판장에서 구매」는 미발견 카드가 판매처 이름을 미리 알려 준다(R2 — 아직 못 만난 것은 가린다).
- 탭 이름 「아이템 위키」는 개발 용어(위키 = 우리가 부르는 이름).
- 아이템 · 요리 · 특산 미발견 카드는 글자 「???」뿐이었고, 해양생물 탭은 실루엣 색 · 흐림(0x0a1a2a · 0.55)이 어종 탭(0x152538 · 0.9)과 달라 「반영이 제대로 안 된 느낌」.

### 1-2. 사이소 24시간(임시)

「QA 인원이 다음 퀘스트(M1-04 사이소 영수증)를 밟고 싶은데 테스트 시간이 새벽이라 영업시간(10~22시)에 막힌다」 → 생활용품점(`daily`)을 **임시로 24시간**.
되돌릴 값은 코드 주석과 백로그 DG에 적었다.

### 1-3. B — 지역 텃밭 제한 · 1단계

295차 백로그 DE 「지역 텃밭 제한」 → 297차 예시 창 `docs/mockups/regional_plot_window.svg`(창 관리형) → 사용자 「착수해줘」(의견은 뒤에). §3-B · §5-B.

295차 특산(산지 봉인)은 「그 고장에서 거둔 것」에만 찍히는데 텃밭은 홈타운 마당뿐이라 **작물 특산(포항초 · 대저 토마토 · 구좌 당근 · 태안 마늘 …)은 기를 길이 없었다**.
1단계는 필드에 밭을 그리지 않는다 — **그 고장 종묘사 안쪽 탁자**에서 구획 하나(4칸)를 주 단위 사용료로 빌리고, 같은 탁자에서 텃밭 창을 연다.

## 2. 원인 — 설계 근거

- **미발견 힌트는 「이름을 가린 한 문장」** — 「???에서 구매」(판매처가 있다) · 「???로 입수」(판매처가 없다). 무엇을 어디서 얻는지는 플레이로 안다.
- **요약은 수만** — 「N / M」. 「발견 · 종 · 등록 조건」 같은 설명 말을 붙이지 않는다(다섯 탭 모두).
- **발견 줄은 날짜가 먼저** — 「11/4 · 처음 얻음」(전 「아이템 취득 · 11/4」 = 로그 말투). core `DISCOVERY_SOURCE_LABEL`을 「처음 낚음 · 통발로 처음 · 처음 캠 · 처음 얻음 · 처음 만듦 · 옛 기록」으로.
- **실루엣 한 벌** — `addSilhouette(texKey, cx, cy, boxW, boxH)` 하나(색 0x152538 · 흐림 0.9 · 사진은 카드/아이콘 판 선택 · 48px 이하 도트는 정수 배율). 아이템은 아이콘 객체를 `silhouetteOf`로(그림
  · 글자 · 묶음 전부 같은 색). 해양생물은 사진 카드가 있으면 그것, 없으면 자리 그림(점 · 포기)을 같은 상자(120×60)에.
- **특산 발견 카드에 그림**(어종 아이콘 · 갯것 사진 · 작물 카드 · 가공품) — 미발견 실루엣과 같은 그림이라 「드러났다」가 읽힌다.
- **요리 변형 행**에 레시피 사진 아이콘(30px) — 만든 것은 그대로, 못 만든 것은 실루엣. 사진 없는 지역 레시피 넷은 글만(백로그 DE 「지역 레시피 사진」).
- 해양생물 미발견 힌트 「주간 해루질·통발 · 심화 면허」 → 「주간 · 물가」(산나물 「산자락」 · 통발 전용 「통발」) — 방법 · 면허 글 대신 때 · 자리.
- 특산 미발견 「그 고장 바다에서 낚으면 등록」 줄 삭제 — 「속초 · 수산」만 남긴다.
- 요리 미발견 행 「다른 어종을 사용해 보세요」(안내 말) → 「주재료 ???」.

### 2-B. 지역 텃밭 1단계 — 설계 근거

- **창 관리형** — 밭을 필드에 그리려면 지역마다 자리(발자국 · 충돌 · 깊이) · 칸 연출(247차 2×2 타일) · 미니맵이 따라와야 한다. 1단계는 그것 없이
  「빌린다 → 심는다 → 거둔다 → 산지 봉인」이 도는지부터 본다. 예시 창의 오른쪽 「이 밭」을 **왼쪽 격자 아래**로 옮겼다(오른쪽은 칸 자세히 · 심기 목록이 그대로 쓴다).
- **마당 구획과 같은 `FarmPlotState`** — 자람 · 할 일 · 병해 · 갈무리 · 세이브가 전부 같은 길을 탄다. 다른 것은 셋뿐: 칸 4(2×2) · 흙은 갈아 둠 · 빗물통(= 종묘사가 물을 준다).
- **사용료는 주 단위 선납 · 창을 열 때 자동 정산** — 매일 납부일을 알리는 길(236 upkeep 장부)을 쓰지 않았다. 멀리 가 있는 동안 밀린 주는 다음에 창을 열 때 한꺼번에 낸다.
  못 내면 **새로 심지 못할 뿐**(거두기 · 물 주기는 된다) — 예시 창의 「밀리면 밭이 묵는다」는 2단계 후보(§6).
- **산지는 지금 지역** — 창은 그 고장 종묘사 안에서만 열리므로 `GameState.originRegionId`가 곧 그 고장이다. 294차 수확 꼬리표를 바꾸지 않았다.
- **탁자는 그 종묘사만** — 종묘사 틀은 같아 모든 종묘사(설악종묘사 · 여수 화원 8곳)에 탁자가 서지만, 그 고장 표의 종묘사 이름과 같을 때만 `action`이 산다.
  빌릴 밭이 있는 고장 여섯(포항 · 부산 · 여수 · 태안 · 제주 · 울릉)에 **손 POI 종묘사**를 하나씩 놓았다(`shopKind: 'nursery'`).

## 3. 변경 — 어디를 어떻게

### 3-A. 도감 · 사이소

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`client/src/scenes/AnglerLogScene.ts`](../../../packages/client-pc/src/scenes/AnglerLogScene.ts) | 탭 「아이템」 · `addSilhouette` · `silhouetteOf` · `creaturePicKey` · `specialtyPicKey` · 다섯 탭 요약 「N / M」 · 미발견 힌트(???로 입수 · ???에서 구매 · 주간 · 물가 · 속초 · 수산 · 주재료 ???) · 특산 발견 카드 그림 · 요리 행 그림 · 발견 줄 「월/일 · …」 · `DISH_KIND_HINT` 삭제 |
| 수정 | [`core/src/types/Discovery.ts`](../../../packages/core/src/types/Discovery.ts) | `DISCOVERY_SOURCE_LABEL` 「처음 낚음 · 통발로 처음 · 처음 캠 · 처음 얻음 · 처음 만듦 · 옛 기록 · dev」 |
| 수정 | [`client/src/data/ShopCatalog.ts`](../../../packages/client-pc/src/data/ShopCatalog.ts) | `BUILDING_HOURS.daily = 'always'`(임시 — 되돌릴 값 `{ open: 10, close: 22 }`) |
| 수정 | [`client/src/data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) · [`i18n/en_help.ts`](../../../packages/client-pc/src/i18n/en_help.ts) · [`i18n/en_content.ts`](../../../packages/client-pc/src/i18n/en_content.ts) | 도움말 탭 이름(여섯 탭) · 영어(발견 줄 · 힌트) |

### 3-B. 지역 텃밭 1단계

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/src/db-schema/RegionalPlots.ts`](../../../packages/core/src/db-schema/RegionalPlots.ts) | `REGIONAL_PLOT_OFFERS`(고장 6 — 종묘사 · 주인 · 흙 · 주 3,000원 · 칸 4) · `regionalPlotId`(`rent:<고장>`) · `newPlotContract` · `plotRentDueWeeks` · `settlePlotRent` · `validateRegionalPlotOffers` |
| 신설 | [`core/src/rules/RegionalPlots300.test.ts`](../../../packages/core/src/rules/RegionalPlots300.test.ts) | 표 검사 · 고장마다 작물 특산 · id 왕복 · 선납 · 차례로 내기 · 모자라면 멈춤 · 안 밀렸으면 안 냄(7) |
| 신설 | [`client/src/store/RegionalPlotStore.ts`](../../../packages/client-pc/src/store/RegionalPlotStore.ts) | 계약(고장마다 하나) · `rent`(첫 주 선납 · 구획 생성) · `settle`(밀린 주 자동 납부 · 잠금) · `overdue` · `returnPlot` · 세이브 `regionalPlots` · dev `__RPLOT` |
| 수정 | [`client/src/store/FarmStore.ts`](../../../packages/client-pc/src/store/FarmStore.ts) | `plot()`이 `rent:` id면 `ensureRegionalPlot`(칸 4 · `tilled` · `rainBarrel`) · `removeRegionalPlot`(설비 안 돌려줌) · `setPlotLock`/`plotLock` · `plantCheck` 잠금 · 알림 자리 「○○ 종묘사 빌린 밭」 · **deserialize가 빌린 밭을 12칸으로 늘리지 않음** |
| 수정 | [`client/src/store/GameState.ts`](../../../packages/client-pc/src/store/GameState.ts) | 세이브 `regionalPlots` · 텃밭 뒤 `deserialize` · `resetAll` |
| 수정 | [`client/src/data/InteriorLayouts.ts`](../../../packages/client-pc/src/data/InteriorLayouts.ts) · [`scenes/field/InteriorSystem.ts`](../../../packages/client-pc/src/scenes/field/InteriorSystem.ts) | `InteriorAction 'rentPlot'` · 종묘사 아래 곤돌라 자리에 탁자(`plot_desk` · `display_table`) · 호스트 `actionHint`(「[F] 밭 빌리기」 / 「[F] 빌린 밭」) |
| 수정 | [`client/src/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | POI `shopKind 'nursery'` → 종묘사 · `enterInterior`가 그 고장 종묘사가 아니면 탁자 `action`을 뗀다 · `openRegionalPlot`(확인 창 「빌리기 · 그만두기」 → `rent` → 텃밭 창 / 이미 빌렸으면 `settle` → 창) |
| 수정 | [`client/src/ui/FarmPanel.ts`](../../../packages/client-pc/src/ui/FarmPanel.ts) | 제목 「○○ 종묘사 — 빌린 밭」 · 격자 2×2(`cols`) · 「이 밭」 칸(`renderRentBlock` — 빌린 곳 · 흙 · 사용료 · 다음 납부 · 사용료 내기 · 밭 돌려주기) · 설비 단추 없음 · 심기 목록 「특산」 · 칸 자세히 「여기서 거두면 「포항초」 — 산지 봉인」 · 가이드 `farm_rented` 4단계 |
| 수정 | [`client/src/data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) · [`i18n/en_help.ts`](../../../packages/client-pc/src/i18n/en_help.ts) · [`i18n/en_farm.ts`](../../../packages/client-pc/src/i18n/en_farm.ts) | 도움말 「텃밭 › 다른 고장에서 밭 빌리기」 · 영어(종묘사 · 흙 · 주인 · 창 글 · 규칙 14) |
| 신설 · 수정 | `pixelazed/{pohang_guryongpo,busan_gamcheon,yeosu_city,taean_anheung,jeju_city,ulleung}/manual_pois.json` → `pois.json` · `public/data/…/pois.json` | 손 POI 종묘사 6(구룡포 483,448 · 명지 465,614 · 여수 244,436 · 안흥 534,360 · 제주 502,406 · 도동 483,649 — `shopsites.py`가 고른 POI 없는 건물 문) · `merge_capture_pois.py` 6회 |

## 4. 구조상 위치

- **계약**: `DISCOVERY_SOURCE_LABEL` 글만(키 그대로) · `BUILDING_HOURS.daily`.
- **렌더**: 도감 다섯 탭(미발견 실루엣 · 힌트 · 요약 · 발견 줄 · 특산 그림 · 요리 행 그림).
- **B 계약**: core `RegionalPlots`(표 · 계약 셈) → client `RegionalPlotStore`(돈 · 구획 · 잠금 · 세이브) → `FarmStore`(구획은 마당과 같은 상태) → `FarmPanel`(빌린 밭 갈래) · 실내 `rentPlot`.
  데이터 층 = 손 POI 6 · `InteriorLayouts` 종묘사 틀. 판정 층 = `plantCheck` 잠금 · `enterInterior` 탁자 가림. 렌더 층 = 「이 밭」 칸 · 특산 표시 · 가이드.
- 파급: 발견 줄 글이 바뀌어 영어 표(`en_content` `DISCOVERY_SOURCES`)의 키를 같이 바꿨다. 세이브는 무관(소스 키 `catch · trap …`는 그대로).

## 5. 검증

### 5-A

| 대상 | 방법 | 결과 |
|---|---|---|
| 탭 이름 — 「아이템」 있고 「아이템 위키」 없음 | 하네스 `r300a.cjs`(dev 서버 · 실제 도감 씬 · dev 발견 몇 개) | PASS |
| 어종 — 요약 「1 / 61」 · 실루엣 12(0x152538 · 0.9) · 금지 글 0 | A + `01_fish.png` | PASS |
| 해양생물 — 요약 「2 / 30」 · 실루엣 11 전부 어종과 같은 색 · 흐림 · 120×60 상자 · 힌트 「주야 · 물가」 「주야 · 통발」 | B + `02_creatures.png` | PASS |
| 아이템(장비 · 소모품) — 요약 「2 / 58」 · 실루엣 10 · 11 · 힌트 「???로 입수」 · 「???에서 구매」 · 발견 줄 「11/4 · dev」 · 금지 글 0 | C + `03_items_gear.png` · `03b_items_consumable.png` | PASS |
| 요리 — 요약 「1 / 303」 · 행 실루엣 13 · 「주재료 ???」 · 만든 행은 사진 | D + `04_dishes.png` | PASS |
| 특산 — 요약 「2 / 51」 · 실루엣 10 · 발견 카드 그림(도루묵 아이콘 · 곰취 카드) · 「…면 등록」 0 | E + `05_specialty.png` | PASS |
| pageerror · core · 빌드 · 루트 typecheck | 하네스 · vitest · `pnpm run build` · `pnpm run typecheck` | 0 · 492 · 3/3 · 4/4 |

하네스 7/7. 스크린샷 scratchpad `r300aout/`.

### 5-B

| 대상 | 방법 | 결과 |
|---|---|---|
| core 표 · 계약 셈 | `RegionalPlots300.test.ts` 7 | PASS(core 499) |
| 손 POI 「구룡포 종묘사」가 종묘사로 서고 미니맵 표시 | 하네스 `r300b.cjs`(dev · 포항 구룡포 · 2026-10-15 14:00 KST 시계 — 시금치 심는 철) 1 | PASS |
| 종묘사 안 탁자 — `action rentPlot` · 힌트 「[F] 밭 빌리기」 | 2 | PASS |
| [F] → 확인 창 「… 한 구획(4칸) … 주 3,000원 — 첫 주 3,000원」 · 빌리기 · 그만두기 → 실마우스 「빌리기」 | 3 · `01_confirm.png` | PASS |
| 빌리기 — 계약 · 50,000 → 47,000원 · 구획 4칸 갈아 둠 · 빗물통 · 힌트 「[F] 빌린 밭」 | 4 | PASS |
| 텃밭 창 — 제목 「구룡포 종묘사 — 빌린 밭」 · 격자 160×160(2×2) · 「이 밭」 · 「구룡포 종묘사 · 주인 권덕수」 · 「주 3,000원 · 물은 종묘사가 준다」 · 「10월 22일 · 밀리면 새로 못 심는다」 · 「밭 돌려주기」 · 설비 단추 없음 | 5 · `02_panel.png` | PASS |
| 심기 목록 — 시금치 씨앗 행 「특산」 | 6 · `03_plant_list.png` | PASS |
| 심기 → 칸 자세히 「여기서 거두면 「포항초」 — 산지 봉인」 | 7 · `04_cell_specialty.png` | PASS |
| 거두기 → 가방 `crop_spinach` `originRegion gyeongbuk_pohang` · `specialtyOf` 「포항초」 | 8 | PASS |
| 두 주 밀림 + 돈 1,000원 → `settle` 못 냄(dueWeeks 2) · `plantCheck` 「사용료가 밀려 …」 · 창 「2주 밀렸다 — 6,000원」 · 「사용료 내기」 | 9 · `05_overdue.png` | PASS |
| 돈 +20,000 → 「사용료 내기」 6,000원 · 잠금 풀림 · 심기 다시 됨 | 10 | PASS |
| 세이브 왕복(슬롯 3) — 계약 · 선납 시각 · 1번 칸 시금치 · 4칸 · 잠금 다시 셈 | 11 | PASS(첫 실행은 12칸으로 늘어났다 — deserialize 고침) |
| 돌려주기 — 심은 것 있으면 「다 거둔 뒤에」 거부 → 거둔 뒤 계약 · 구획 삭제 · 힌트 「[F] 밭 빌리기」 | 12 | PASS |
| 다른 종묘사(「설악종묘사」)는 탁자만(action 없음) | 13 | PASS |
| pageerror · 빌드 · 루트 typecheck | 하네스 · `pnpm run build` · `pnpm run typecheck` | 0 · 3/3 · 4/4 |

하네스 13/13. 스크린샷 scratchpad `r300bout/`.

## 6. 잔여

- 사진 없는 지역 레시피 넷(대구탕 · 옥돔구이 · 꽁치조림 · 하모 샤부샤부)은 요리 행에 그림이 없다 — 백로그 DE 「지역 레시피 사진」.
- 아이템 미발견 실루엣은 44px 아이콘의 알파라 16px 손그림 아이콘(`px:`)은 작게 보인다 — 아이템 카드 높이(118)에 맞춘 것. 큰 그림이 필요하면 카드 판(300×160)을 쓰는 어종 방식으로.
- 발견 줄의 dev 해금은 「11/4 · dev」로 보인다(dev 전용).
- **사이소 24시간은 임시** — QA가 끝나면 `{ open: 10, close: 22 }`로 되돌린다(백로그 DG).

### 6-B. 지역 텃밭 — 2단계 후보(사용자 예시 창 의견 뒤)

- **필드에 밭 그리기** — 종묘사 뒤 2×2 칸(247차 칸 연출 · 손에 든 것으로 일하기 · 미니맵). 1단계는 창뿐이다.
- **「밀리면 밭이 묵는다」** — 지금은 새로 못 심을 뿐. 오래 밀리면 물이 끊기거나(빗물통 멈춤) 종묘사가 거둬 가는 규칙은 의견 뒤.
- **알림 · 일지** — 납부일이 가까울 때 손목시계 알람 · 일지 「나날」 한 줄(`MillNotifier` 패턴). 지금은 창을 열어야 안다.
- **이 고장 씨앗 매대** — 예시 창의 「이 고장 씨앗(종묘사)」 칸(특산 씨앗은 그 고장 종묘사만 — 사용자 결정 5). 지금은 어느 종묘사나 같은 씨앗 목록이고, 특산은 「어디서 거두느냐」로만 갈린다.
- **인천 강화 순무** — 인천 데이터 지역이 없어 표에서 뺐다. 울릉 나물은 산나물 캐기(299)로 얻으므로 잠그지 않는다.
- **주인 이름**은 창에만 보인다(필드 인물 아님) — 종묘사 점원과 묶을지는 의견 뒤.
- 영어 확인 창(세 줄)은 규칙 한 줄로 받는다 — 줄바꿈이 들어간 글을 i18n 훅이 통째로 넘기는지 실측하지 않았다(한국어가 남으면 그대로 보인다).

## 7. 위험·부작용

- `DISCOVERY_SOURCE_LABEL` 글을 다른 곳이 쓰면 함께 바뀐다 — 지금은 도감 발견 줄뿐(grep). 위키 생성기는 쓰지 않는다.
- `fitFishTexture`가 72px 이하 상자에서 `__icon` 판을 고른다 — 특산 카드 그림(64×48)은 아이콘 판, 실루엣(120×60)은 카드 판이라 같은 물건이 두 판으로 보일 수 있다(색만 남아 티가 나지 않는다).
- 사이소가 밤새 열리는 동안 「영업시간 단서」(267)가 사이소 의뢰엔 붙지 않는다(`'always'`면 단서 없음) — 의도.
- **B** `FarmStore.plot(id)`는 `rent:` id를 받으면 구획을 **만든다** — 돌려준 뒤 누가 그 id로 `plot()`을 부르면 빈 구획이 되살아난다(계약 없이). 지금 부르는 곳은 텃밭 창뿐이고 창은 계약이 있어야 열린다.
- **B** 빌린 밭의 `env()`는 **지금 지역의 비 · 날씨**로 자란다 — 포항 밭이 속초 비를 맞는다. 빗물통이 물을 대므로 자람엔 차이가 작다(2단계에서 고장별 기후로).
- **B** 탁자 가림은 **이름 일치**다 — 손 POI 이름(`manual_pois.json`)과 표의 `nurseryKo`가 다르면 탁자가 죽는다. 이름을 바꾸면 둘 다.
- **B** `deserialize`의 칸 채우기(마당 12 · 선반 4)에 **빌린 밭 갈래**를 더했다 — 처음엔 빌린 밭이 불러올 때 12칸으로 늘어났다(하네스가 잡았다).
- **위키** 298차부터 템플릿 스크립트 문법 오류로 95~99판이 본문을 못 그렸는데 아무도 몰랐다 — 위키는 `check_artifact_page.cjs` 밖이었다. 이제 생성기가 문법을 검사하고 발행 전 헤드리스 로드를 본다(시스템 페이지 `discovery-wiki.md` §6 13).

## 8. 후속 반영

- [x] 시스템 페이지 `discovery-wiki.md` §2 · §4 · §6 · `04-BACKLOG.md` DG · `03-WORKLOG/README.md` · AGENTS §9 · PLAN · CLAUDE
- [x] 위키 생성기 시스템 항목 「도감은 발견한 것만 — 실루엣 한 벌」 · 아티팩트 원본(tasks · library 「300차 기준」 · 순서도 「300차 기준」 줄)
- [x] 발행 판 — 남은 과업 설계 Version 46 · 구현 라이브러리 45 · 채비 모딩 순서도 42 · 위키 98(새 그림 없음)
- [x] main · 재배포(사용자 「여기까지 반영하고 main 재배포」) — main 빨리 감기 `1daa9ce` · **102차 배포** gh-pages `41e8864`(실행 31 · 정적 2,157 · 소스맵 0) ·
  로컬 기동 점검 기동 10.4초 · 4xx 0(바깥 1 = KAMIS 스냅샷) · pageerror 0 · 배포본 도감 다섯 탭(탭 「아이템」 · 요약 「N / M」 · 실루엣 0x152538 · 0.9 · 힌트 「???로 입수」 「???에서 구매」 · 금지 글 0) · 번들 `daily:"always"`
- [x] B 지역 텃밭 1단계 — 시스템 페이지 `home-base.md` §4 · §5 · §6 · `04-BACKLOG.md` DE · DG · `03-WORKLOG/README.md` · AGENTS §9 · PLAN · CLAUDE · 위키 생성기(「지역 빌린 밭」 · 텃밭 구획 줄) · 아티팩트(tasks · library — 판은 아래)
- [x] B 발행 판 — 남은 과업 설계 Version 47 · 구현 라이브러리 46 · 위키 99(새 그림 없음) · 순서도는 42(「300차 기준」 그대로 — 채비 문법 불변)
- [x] 위키 **100** — 사용자 「아티팩트 wiki가 열리지 않아」 → 298차 `199ebab`부터 템플릿 「특산」 절 줄 끝 `,`(→ `+`)로 95~99판이 본문을 못 그렸다(제호 · 탭만).
  `tools/game_wiki_template.html` 고침 · `gen_game_wiki_data.mjs`에 템플릿 스크립트 `vm.Script` 검사(틀리면 exit 2) · `$` 치환 패턴 막음 · 헤드리스 로드 pageerror 0 · 시스템 탭 · 포항 카드(특산 · 축제) · 절차 `docs/artifacts/README.md` 2-b
- [ ] B main · 배포 — 사용자 결정 뒤(예시 창 의견과 함께)
