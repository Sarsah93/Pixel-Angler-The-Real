# 285차 — 방앗간 알림 · 갈무리(걸대 · 장독) · 씨 받기 · 생기름 · 압맥 · 나물 볶음 이름

| | |
|---|---|
| **날짜** | 2026-10-29 |
| **시스템** | `홈`(텃밭 E1) · `경제`(방앗간) · `회썰기`(불요리) · `인벤` · `필드`(알림 · 지도 표시) · `에셋` · `세이브` |
| **트리거** | 284차 「뒤로 미룬 것」 전부 반영 지시(아래 §1) + 우선순위 추천 · 대화 품질 지적(286 ~ 288로 넘김) |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` → main 빨리 감기 → 93차 배포(사용자 지시 — 「위 변경 사항들 아티팩트, main 반영 및 재배포」) |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 392(36 파일) |

---

## 1. 배경 — 왜 했나

사용자 말(원문):

> # 이번 차수에서 언급된 '뒤로 미룬 것' 관련
> 1) 방앗간 일이 다 되었을 때, 알림 — 채팅창에 이벤트 발생 로그 · 시계 착용 시 시계 알림 효과음(삐빅-삐빅-삐빅) · 팝업 메시지(타이머 설정해둔 것처럼) · 가게 근처나 표지판 쪽에 느낌표 아이콘(맵에도 표시)
> 2) 미룬 가공: 시래기 말리기, 생기름(볶지 않은 기름), 압맥(누른 보리) 셋 다 레퍼런스 찾아서 가공 반영하기.
> 3) 미룬 부산물: 옥수수수염차, 콩잎, 깻잎 장아찌, 받은 씨앗 다시 심기, 딸기 런너 … 필요 시 gemini 이미지 생성도 해.
> 4) 요리 이름: 「토란대 들깨볶음」처럼 주재료에 따라 나물 볶음 이름이 바뀌는 것 → 적용하기
> # 위 변경 사항들 아티팩트, main 반영 및 재배포

같은 메시지의 나머지(대화 · 퀘스트 품질 · 해루질 규제 · 맵 확장 영향 · 문어 가이드)는 크기가 커서 286 ~ 288차로 나눴다(§6).
「해녀의 딸」 시범 대본(사용자 원문)은 286차 입력으로 [`.agents/inputs/285_n01_5_user_script.md`](../../../.agents/inputs/285_n01_5_user_script.md)에,
286 ~ 288 조사 요점은 [`285_research_286_288.md`](../../../.agents/inputs/285_research_286_288.md)에 보관했다.

## 2. 레퍼런스 — 기간 · 수율(실제보다 줄였다)

| 대상 | 레퍼런스 | 게임 |
|---|---|---|
| 시래기 | 무청을 그늘 · 바람에 걸어 겨우내 말린다 · 소금물에 살짝 데쳐 말리면 빛이 산다(농진청 웹진 2022-02 · 조리법) | 엮어 걸기 6일 · 데쳐 말리기 3일(소금 1큰술) → 말린 시래기 한 타래(요리 재료 「시래기」) |
| 옥수수수염차 | 씻어 이틀 말린 뒤 약불에 덖는다 · 수분 약 80% | 생수염 50g → 2일 → 10g 한 봉 |
| 깻잎 장아찌 | 100장 · 간장 · 물 · 식초 · 설탕 끓여 붓기 · 이튿날 다시 끓여 붓기 · 2주 냉장 | 깻잎 다섯 묶음 + 진간장 4큰술 → 7일 → 10장 × 10 |
| 콩잎 장아찌 | 경상도 단풍콩잎 · 진한 소금물에 20~30일 삭혀 우려내 양념 | 단풍콩잎 두 묶음 + 소금 3큰술 → 14일 → 10장 × 4 |
| 생기름 | 볶지 않은 저온 압착 · 착유율이 낮다 | 350ml 한 병 = 참깨 1kg · 들깨 1.1kg · 공임 5,000원/kg · 90분 |
| 압맥 | 보리를 쪄 롤러로 누른다 | 1kg 단위 → 압맥 한 봉(기존 「압맥 (눌린 보리)」) · 1,500원/kg · 30분 |
| 씨 받기 | 1칸 분 = 10a 파종량 ÷ 1,000㎡(콩 6g · 깨 1g · 보리 16g) · 교잡종(F1) 받은 씨는 고르지 않다 | 받은 씨앗 = 섬 ×0.92 · 교잡종 수확 ×0.85 |
| 딸기 런너 | 여름 기는줄기 끝 자묘를 떼어 모종으로 | 한 해 넘긴 포기 · 6~8월 · 2~4포기 |

## 3. 변경

### 3.1 core

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`rules/OilMill.ts`](../../../packages/core/src/rules/OilMill.ts) | 일 7(생참기름 · 생들기름 · 보리 누르기 추가) · 기름병 8(`oil_<깨>_raw_<ml>` — 같은 1큰술) · 일마다 `feePerKg` · `waitMin` · `stepG` · `inputKo` · `millStepG` |
| 신설 | [`rules/HomeCure.ts`](../../../packages/core/src/rules/HomeCure.ts) | 갈무리 할 일 5 · 나온 것 4(`CURE_ITEMS` — 값 · 영양 · 요리 재료) · 걸대 6줄 · 장독 4칸 · `cureLeftKo` |
| 신설 | [`db-schema/NamulDishes.ts`](../../../packages/core/src/db-schema/NamulDishes.ts) | 나물 13 × (볶음 · 들깨볶음) — `namulVariantOf` · 들깨볶음 효과 ×1.15 |
| 수정 | [`types/Farming.ts`](../../../packages/core/src/types/Farming.ts) · [`db-schema/CropDatabase.ts`](../../../packages/core/src/db-schema/CropDatabase.ts) | 설비 `dryingRack` · `crock` · 부산물 옥수수수염(g) · 단풍콩잎 · `seedSave`(칸 21 · 낱알 4) · 받은 씨앗 id `_saved` · `cropStartOfItem`이 꼬리를 뗀다 |
| 수정 | [`simulation/FarmSim.ts`](../../../packages/core/src/simulation/FarmSim.ts) · `CropCultivationData` | `seedSaveBlockKo` · `saveSeedsCell` · `seedPacketsFromGrain` · `applySavedSeed` · 딸기 `propagate: runner`(6~8월) |
| 수정 | `RecipeLore` · `DishDiscovery` · `DishFactory` | 나물 볶음을 변형 레시피로(갈래 `veg`) · 도감 후보 26 · 영어 이름 |
| 신설 | [`simulation/Farm285.test.ts`](../../../packages/core/src/simulation/Farm285.test.ts) | 14시험 |

### 3.2 client

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`ui/MillNotifier.ts`](../../../packages/client-pc/src/ui/MillNotifier.ts) | 다 된 방앗간 일 · 갈무리를 알린다 — 채널 「[방앗간]」 · 「[갈무리]」 · 손목시계면 `watch_alarm`(삐빅 × 3) + 알림 창 · 아니면 1인칭 · 집에서 글 한 줄 · `notified` 세이브 |
| 수정 | `RegionFieldScene` · `FirstPersonFishingScene` · `HomeInteriorScene` | 5초마다 펌프 · 필드는 방앗간 문 위 초록 느낌표 · 미니맵 `mm_pickup` |
| 수정 | [`ui/FullMapPanel.ts`](../../../packages/client-pc/src/ui/FullMapPanel.ts) | 범례 「찾을 것」 |
| 신설 | [`store/CureQueue.ts`](../../../packages/client-pc/src/store/CureQueue.ts) · [`store/CureActions.ts`](../../../packages/client-pc/src/store/CureActions.ts) · [`ui/CurePanel.ts`](../../../packages/client-pc/src/ui/CurePanel.ts) · [`data/CureItems.ts`](../../../packages/client-pc/src/data/CureItems.ts) | 걸기 · 거두기 · 도로 걷기(한 시간 안) · 버리기(확인 창) · 낮은 등급부터 · 굵은소금도 소금 · 세이브 `cureQueue` · 가이드 `tour.cure` |
| 수정 | [`ui/FarmPanel.ts`](../../../packages/client-pc/src/ui/FarmPanel.ts) · [`store/FarmStore.ts`](../../../packages/client-pc/src/store/FarmStore.ts) | 설비 칩(걸대 · 장독) 누르면 갈무리 창 · 다 되면 초록 점 · 설비 목록 「갈무리」 + 「설비 걷기」 · 칸 높이 흐름 배치 · 「씨 받기」(확인 창) · 「런너 모종 떼기」 · 받은 씨앗 심기 → `applySavedSeed` · 걸어 둔 것이 있으면 설비 · 구획 걷기 막음 · `grainToSeeds` |
| 수정 | [`ui/InventoryPanel.ts`](../../../packages/client-pc/src/ui/InventoryPanel.ts) | 콩 · 깨 · 보리 낱알 「씨앗으로 덜기 (1 · 5칸 분)」 |
| 수정 | [`ui/MillPanel.ts`](../../../packages/client-pc/src/ui/MillPanel.ts) · [`store/MillActions.ts`](../../../packages/client-pc/src/store/MillActions.ts) | 일 7(줄 32px · 창 520) · 단위 `millStepG` · 「드는 보리」 · 압맥 찾기(시작 가방 템플릿) · 무르기 문구 |
| 수정 | `store/CookingStore.ts` | 나물 볶음의 주재료 = `namulVariantOf` → 「토란대 들깨볶음」 |
| 수정 | `data/CropItems.ts` · `ItemVitals` · `ShopCatalog` · `WikiCatalog` · `InventoryStore` · `GameState` · `AnglerLogScene` · `HelpContent` | 받은 씨앗 템플릿 · 장아찌 · 수염차 영양 · 가게(식자재마트 · 식당)가 갈무리를 산다 · 위키 · 세이브 · 도감 갈래 · 도움말 「갈무리 · 씨 받기」 · 방앗간 「생기름 · 압맥 · 다 됐을 때」 |
| 신설 | [`i18n/en_cure.ts`](../../../packages/client-pc/src/i18n/en_cure.ts) | 갈무리 · 씨 받기 영어 — 규칙은 `EN_RULES` 맨 앞(넓은 「— 」 규칙보다 먼저) |

### 3.3 그림 · 도구

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`tools/item_looks/cure.cjs`](../../../tools/item_looks/cure.cjs) | 생기름 병 4(흰 뚜껑 + 갈색 꼬리표 · 연한 기름) · 갈무리 4 · 걸대 · 장독 — Gemini 10장 |
| 수정 | [`tools/gemini_crop_art.cjs`](../../../tools/gemini_crop_art.cjs) | 옥수수수염 · 단풍콩잎 초상 2장 → 초상 113 |
| 수정 | `tools/gen_pixel_icons.py` | 16px `mk_pickup` · `mm_pickup` · `it_drying_rack` · `it_crock` |
| 수정 | `tools/gen_game_wiki_data.mjs` | 시스템 탭 「갈무리 · 씨 받기 · 생기름 · 압맥」 · 선반 「갈무리」 → 농사 탭 농산물 |

## 4. 구조상 위치

`홈(텃밭 E1) → 수확 뒤 가공 → 갈무리 · 씨 받기` — **데이터(core 표) + 판정(core 순수 함수) + 대기열(client 세이브) + 렌더(창)**.
방앗간 생기름 · 압맥은 284 방앗간 계약에 일 셋을 더한 것이고, 알림은 방앗간 · 갈무리가 같은 펌프(`MillNotifier`)를 쓴다.
나물 볶음 이름은 255차 요리 개체화(변형 레시피)의 채소판 — 주재료 자리에 `veg_<열쇠>`.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| core | `vitest` | 392/392(36 파일 · Farm285 14) |
| 실동작 | 하네스 `r285a`(scratchpad) | **21/21** — 생기름 1kg · 1큰술 23 · 압맥 1kg 단위 · 걸기(낮은 등급부터) · 굵은소금 · 덜 됐을 때 · 설비/구획 걷기 막힘 · 거두기 · 도로 걷기 · 버리기 · 세이브 왕복 · 마트 매입 · 허기 · 씨 받기 · 받은 씨앗 심기(`savedSeed`) · 콩 50g → 6g × 5 · 런너 · 「토란대 들깨볶음」 · 알림 한 번만 · 영어 KO 0 · pageerror 0 |
| 화면 | 하네스 `r285b` | 8/9 — 문 위 느낌표 · 미니맵(검사 기대값이 구운 키 `pxi_mk_pickup_1`을 몰라 FAIL로 찍혔고 그림은 정상) · 전체 지도 「찾을 것」 · 방앗간 창 일 7 · 「1kg」 · 「드는 보리」 · 설비 목록 단추 · 갈무리 창 자리 수 · 실마우스 「거두기」 · 영어 · 텍스트 넘침 0 · pageerror 0 · 스크린샷 육안 |
| 위키 | `wikichk285` | 농사 · 먹을거리 · 요리 탭 그림 깨짐 0 · pageerror 0 · 생성기 경고 0 |
| 빌드 | `pnpm run build` · client typecheck | 3/3 · 0 |

## 6. 잔여

- **286 — 대화 체계 개편**(사용자 지적 1): 주인공 대사 · 고른 답의 실제 말 · 몸짓(담배 · 연기) · 곁가지 거절 = 실패 · 우호도 · 보상 재조정 · 「해녀의 딸」 시범(사용자 대본 그대로) → 퀘스트 191편 · 일지 요약.
- **287 — 해루질 · 어종**(지적 2): 금어기 · 금지체장 · 체장별 그림 크기 · dev 미니게임 바로 시작 · 입질 연결성 전수.
- **288 — 맵 확장 영향**(지적 3): 퀘스트 안내 화살표가 인물 실제 자리 대신 `q.region` 기본점으로 가는 문제(조사에서 39편) · 퀘스트가 속초에 몰림 · 지역별 활동.
- 문어 손질 가이드(지적 4) — 후순위.
- 갈무리 · 받은 씨앗 수치(날 수 · ×0.92 · ×0.85)는 실플레이 뒤 조율 · 텃밭 위 갈무리 표시(필드 그림)는 하지 않았다(창 칩의 초록 점 + 채널).

## 7. 위험 · 부작용

- **`EN_CURE_RULES`를 `EN_RULES` 맨 앞에 둠** — 넓은 「X — Y」 규칙이 「거뒀다 — …」를 먼저 갈라 「거뒀다」가 남았다. 규칙이 모두 한국어 낱말로 시작해 다른 문장을 잡지 않는다.
- **도로 걷기 한 시간** — 그 뒤 걷으면 버린다(신선도 되돌리기 막기). 사용자가 잘못 걸면 한 시간 안에 물러야 한다.
- **받은 씨앗은 가게가 사지 않는다**(`seed_` 소분류는 원래 매입 대상 아님) · 위키 값은 봉투 값의 절반.
- 방앗간 창 높이 470 → 520(일 일곱) — 화면 720 안 · 위치 (40, 60).

## 8. 후속 반영

- [x] 워크로그(이 파일) · 색인 `03-WORKLOG/README.md` §3.1
- [x] 시스템 페이지 — [`home-base.md`](../02-SYSTEMS/home-base.md)(갈무리 · 씨 받기 · 생기름 · 압맥 · 알림) · [`sashimi-cooking.md`](../02-SYSTEMS/sashimi-cooking.md)(나물 볶음 이름)
- [x] 백로그 `04-BACKLOG.md` DB(284 잔여 → 285 반영) · DC(286 ~ 288)
- [x] `IMPLEMENTATION_PLAN.md` · `AGENTS.md` §9 · `CLAUDE.md` 요약
- [x] 아티팩트 4개(`docs/artifacts/README.md` 표):
  - 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c **Version 82**(81 = 첫 발행 · 82 = 씨 받는 작물 목록 정정)
  - 남은 과업 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 **Version 28**(추천 순서 1 = 286 ~ 288)
  - 구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 **Version 29**
  - 채비 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 **Version 27**(「285차 기준」 줄 · 문법 258)
- [x] main 빨리 감기 `54373e4..5940351`(284 · 285) · **93차 배포** — Actions 「테스트 배포」 실행 22 → gh-pages `695b690` ·
  배포본 점검(gh-pages 브랜치를 로컬 서버로 — 컨테이너에서 라이브 주소는 닿지 않는다): 파일 2,095 · 소스맵 0 · 새 그림 10 포함 · 기동 10.3초 · 4xx 0 · pageerror 0
