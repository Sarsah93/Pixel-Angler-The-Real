# 315차 — 장어류 손질 · F9 [확정] 단추 · 위키 「어종 손질」 탭 · 도감 산나물 그림

| | |
|---|---|
| **날짜** | 2026-11-11 |
| **시스템** | `손질` · `위키` · `도감(UI)` · `dev 도구` |
| **트리거** | 사용자 지시 여섯(314 보고 뒤) |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` `8dea5e5` · `74bea40`(main · gh-pages 반영은 지시 대기) |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 566 · 장어 실입력 완주 3/3 어종 · r315log 5/5 · pageerror 0 |

---

## 1. 배경 — 왜 했나

사용자 원문(요약 없이 여섯):

> 「1) 인게임 내 '산나물' 로그에 산나물 그림들이 왜 픽셀 그림으로 반영되었지? wiki에 등재된 generated images 있는데 왜 저걸 쓴거야? …
> 탑다운 픽셀 그림을 보여줌으로써, 필드에서 식별이나 인지를 돕게 하겠다는 취지라면 도감 한 칸 우측 하단이나 좌측 상단이나 그런 곳에 …」
>
> 「2) wiki에 어종 손질 탭을 만들고, 그 안에서 다시 방어류/작은 생선류/돔류/광어류/오징어류 정도로 카테고리 나눠서 … 손질 공정 과정을 한 눈에 볼 수 있도록 이미지 …
> 맨 위에 해당되는 어종들 이름 열거하고 해당 이름들을 클릭 시, 어종 도감 쪽으로 이동」
>
> 「3) 배를 가른 뒤의 장뜨기·필렛 그림 … 어종별로 따로 그리려면 그림 작업이 따로 필요 -> 이거는 너가 생성해볼 수 있을까? (도움이 필요하면 gemini로 image generation 해도 됨.)」
>
> 「4) 장어류 손질 … 도마 위에서 구현할 때 형태(UI)적으로 오류가 없도록 실제와 유사한 모습으로 보여주는 게 가장 중요해. 너가 우선 구현을 해봐. 그리고 구현한 내용을 svg 정도로 보여줘.」
>
> 「5) 잿방어, 방어(특히나 대방어, 특대방어 급 이상) 또한 참다랑어처럼 해체 공정(4개의 덩어리로 해체하는)으로 가도록 하는 게 좋지 않을까?」
>
> 「6) 손질 실검증은 내가 localhost 5173 띄워주면 해볼 게. 그리고 … 좌표값을 내가 일일이 복사 붙여넣기 해야하는데 … 인게임 내에서 확정 버튼 같은 걸 누르고 … 너가 해당 로그나 기록을 실시간으로 읽어서 반영」

## 2. 원인 — 무엇이 문제였나

| 항목 | 기전 |
|---|---|
| 1 도감 산나물 그림 | 314차 산나물 탭이 해양생물 칸 함수(`creaturePic`)를 그대로 썼다 — 갯것 사진 키(`forage_<id>`)가 산나물에는 없어 필드 포기 도트(`wildgreen_*`)를 키웠다. 위키는 거두는 물건(`harvestItemId`)의 작물 초상을 쓴다 |
| 3 개복 뒤 그림 | 장뜨기 · 필렛 뷰는 어종군 사진(잿방어 · 감성돔 · 광어) 한 벌에 어종 색을 얇게 입힌다 — 살이 흰 농어 · 우럭도 잿방어의 분홍 · 붉은 살로 나온다 |
| 6 F9 좌표 | [복사] → 대화창 붙여 넣기 → 에이전트가 core 표에 손으로 옮기는 3단 — 옮길 때 `opts`(strong · tolerance)를 잃기 쉽다(스킬 `f9-guide-coords` 함정 1) |
| 6 localhost | 원격 컨테이너의 dev 서버(5173)는 사용자 브라우저에 닿지 않는다(170차) — 단, 앱에 미리보기 칸이 있으면 이 세션 포트를 보여 줄 수 있다(`report_preview_port`) |

## 3. 변경 — 어디를 어떻게

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`scenes/AnglerLogScene.ts`](../../../packages/client-pc/src/scenes/AnglerLogScene.ts) | 산나물 큰 그림 = 거두는 물건 그림(`wildGreenArtKey` — 작물 초상 `cropimg_` · 약초 `art_herb`) · 칸 오른쪽 아래 30px 판에 필드 모습(`addFieldDotBadge` — 산나물 포기 · 사진 있는 갯것의 점 도트) · 판과 같은 높이의 글 줄은 판 왼쪽에서 끊는다 |
| 수정 | [`data/FishTextures.ts`](../../../packages/client-pc/src/data/FishTextures.ts) | `fishIconKey` — 작물 초상 카드 `cropimg_` → 64px `cropicon_`(작은 칸 · 실루엣 · 특산) |
| 신설 | [`core db-schema/EelStages.ts`](../../../packages/core/src/db-schema/EelStages.ts) | 장어류 공정 — 붕장어(송곳 → 점액 → **등 가르기** → 펼치기 → 내장 → 중골 → 지느러미 위 · 아래 → 머리) · 갯장어(**배 가르기** … 머리 → **뼈끊기** 8줄) · 먹장어(송곳 → 목 칼집 → **껍질 통째로 벗기기** → 배 가르기 → 펼치기 → 내장 → 씻기 → 머리 · 뼈 없음) |
| 신설 | [`tools/gen_eel_views.cjs`](../../../tools/gen_eel_views.cjs) | 곧게 편 장어 그림(층 23장 — 측면 · 껍질 벗긴 측면 · 펼친 살 · 머리 · 내장 · 뼈 · 지느러미 위/아래 · 뼈끊기 자국) + **같은 몸 윤곽에서 뽑은 유도선**(core `EelGuideGeometry.ts`). `--preview` 검수 시트 |
| 신설 | [`ui/EelBoard.ts`](../../../packages/client-pc/src/ui/EelBoard.ts) | 장어 도마 렌더러 — 완료 단계에서 모습 파생(송곳 · 소금 알갱이 · 칼자국 · 펼침 · 층 빼기 · 껍질 벗김 진행 · 뼈끊기 자국) + 결과물 그림 굽기(`trim_eel_fillet|head|spine_<어종>`) |
| 수정 | [`ui/ButcheryPanel.ts`](../../../packages/client-pc/src/ui/ButcheryPanel.ts) | 장어 = 전용 렌더러 · 뒤집기 · 회전 없음(`fixedView`) · 부산물 그림 · 결과 = 「손질한 붕장어 (등급) g」(`inv_eelfillet_` — 회썰기 대상 아님) · **F9 [확정] · [군 확정]** 단추(4열) |
| 수정 | core `ButcheryProfiles` · `ButcherySections`(`EEL_SECTIONS`) · `ButcheryProcess` · `types/Butchery` | 프로필 셋(`tree: 'eel'` · 포 한 장) · 구현 어종 31 → 34 · 안내 문구에서 장어류 뺌 · `EelGuideSet` · `filletCount: 1` |
| 신설 | core [`ButcheryGuideOverrides.ts`](../../../packages/core/src/db-schema/ButcheryGuideOverrides.ts) · `applyGuideOverrides` · `isBodyGuideStage` · `butcheryGuideFamilyKey` | F9 확정 좌표 표(자동 생성) — 스테이지를 다 지은 뒤 **좌표만** 바꿔 끼운다(판정 옵션 그대로) · 어종 > 군 · 군 좌표는 온마리 선만 어종 그림 자리로 옮긴다 |
| 신설 | [`vite.config.ts`](../../../packages/client-pc/vite.config.ts) `devButcheryGuidePlugin` · [`ui/DevGuideCaptures.ts`](../../../packages/client-pc/src/ui/DevGuideCaptures.ts) · [`tools/apply_f9_captures.cjs`](../../../tools/apply_f9_captures.cjs) · [`tools/f9_captures/`](../../../tools/f9_captures/README.md) | [확정] → dev 서버 POST → `captures.json`(정본) + `log.jsonl`(한 줄) → core 표 굽기. GET = 정본(이 판에서 다시 연 창에도 확정 좌표). 표 파일은 dev 서버가 지켜보지 않는다(손질이 끊기지 않게) |
| 신설 | [`tools/capture_butchery_wiki.cjs`](../../../tools/capture_butchery_wiki.cjs) | 위키 공정 그림 — 손질 창을 작업마다(dev 작업 점프) 찍어 공정 시트(`tools/wiki_img/butchery/<공정>.png` + manifest) |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) · [`tools/game_wiki_template.html`](../../../tools/game_wiki_template.html) | 위키 「어종 손질」 탭 — 갈래 일곱(방어류 · 작은 생선류 · 돔류 · 광어류 · 오징어류 · 문어류 · 장어류) · 맨 위 어종 이름(→ 어종 도감 카드) · 공정 설명 · 작업마다 도마 그림 칸(시트 한 장을 칸마다 잘라 보인다 · 폰 폭 한 줄) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- 장어류: `손질 → 어류 공정 → 갈래(tree)` — **계약(프로필 · 섹션) + 판정(스테이지) + 렌더(전용 렌더러)** 전부 새로. 두족류처럼 최상단에서 갈라지되(뷰 고정) 어류 판정 · 섹션 · 부산물 경로는 그대로 쓴다.
- F9 [확정]: `dev 도구 → 데이터` — 스테이지 빌더 뒤 한 층(`applyGuideOverrides`). 기존 좌표 표(`GUIDE_COORDS` 등)는 건드리지 않는다.
- 도감 · 위키: 표시 층만.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| core 장어 · 확정 | vitest `ButcheryFlow315`(8) + `ButcheryFlow304`(손질 창 규칙 완주 — 장어 셋 포함 34종) · 전체 | 566 통과 |
| 장어 실렌더 | 하네스 r315eel — **실제 마우스 입력**(탭 · 칼선 드래그 · 문지르기 · 껍질 당기기 · Enter)으로 처음부터 끝까지 | 붕장어 8/8 · 갯장어 9/9(뼈끊기 8줄) · 먹장어 8/8 단계 · 셋 다 「손질한 ○○ (상)」 + 머리 · 뼈 · 내장(먹장어 껍질) 지급 · 원물 소모 · pageerror 0 |
| F9 [확정] | dev 서버에 POST → GET · `log.jsonl` · core 표 굽기 확인 후 되돌림 | 왕복 1/1 |
| 도감 산나물 | 하네스 r315log — 산나물 7 · 갯것 8 발견 | 큰 그림 = 작물 초상 8 + 약초 · 포기 판 7 · 해양생물 점 판 8 · 판과 글 겹침 0 · 5/5 · pageerror 0 |
| 위키 | 헤드리스(`wikicheck315`) | 탭 「어종 손질」(어종·수산생물 다음) · 갈래 일곱(방어 13 · 작은 생선 5 · 돔 9 · 광어 5 · 오징어 4 · 문어 2 · 장어 3) · 처음 = 방어류 · 「농어」 → 어종 탭 농어 카드 · 칸 20 / 13 / 20 / 18 / 20 / 8 / 25 · 시트 그림 읽힘 · 폰 폭 400 넘침 0 · 8/8 · pageerror 0 |
| 빌드 | `npx pnpm run build` · 루트 typecheck | 3/3 · 4/4 |
| SVG | 작업마다 시작 모습(노란 선 = 그을 자리) + 끝 — 세 어종 25칸 | [`docs/mockups/eel_butchery_315.svg`](../../mockups/eel_butchery_315.svg)(432KB) |

## 6. 잔여 — 이번에 안 한 것

- **어종별 개복 뒤 그림(3)** — Gemini 시범 4장(농어 · 우럭 · 참돔 · 고등어 순수 필렛 — 장당 약 15초 · 0.03달러). 전 어종 적용은 다음 차수(§8 제안).
- **대방어 · 잿방어 · 부시리 4덩어리 해체(5)** — 참다랑어 해체 트리와 한 벌로(다음 차수 제안 · 사용자 결정).
- 장어 결과물 회썰기(붕장어회 잘게 · 하모 샤부샤부)는 회썰기 창에 장어 그림 · 공정이 없어 열지 않았다(포는 굽기 · 볶음 재료).
- 장어 유도선 F9 실측 — 그림과 같은 기하라 처음부터 몸 위에 있지만, 손맛(칼선 높이 · 뼈끊기 간격)은 사용자 실검증 뒤 [확정]으로.

## 7. 위험·부작용

- 하네스 함정(게임 문제 아님): 손질 창 첫 열기 안내가 떠 있으면 Enter(씻기)가 막힌다 — 하네스에서 `import('/src/ui/GuideTour.ts')`로 끄면 게임과 다른 모듈 인스턴스라 안 꺼진다. `__GS.setFlag('tour.butchery', true)`로 본 것으로 둔다.

- `ButcheryProfile.filletCount`에 1이 생겼다 — 필렛 수로 나누는 곳(`computeFilletYield` · `bypWeights`)은 1에서도 맞다(304 시험 통과).
- F9 [확정] 표는 dev 서버가 지켜보지 않는다 — 표를 고친 뒤 dev 서버를 다시 켜기 전까지는 서버 정본(GET)이 보이는 값을 맡는다(같은 값).
- 장어 손질 결과(`inv_eelfillet_`)는 회썰기 판정(`inv_fillet_`)에 걸리지 않는다 — 요리 재료 판정이 id 접두로 필렛을 찾는 곳이 생기면 장어 포가 빠질 수 있다.

## 8. 후속 반영

- 시스템 페이지 `butchery.md`(B1 · §5 ⑦⑧⑨ · §6 41~43) · `discovery-wiki.md` · 백로그 · AGENTS §9 · PLAN · CLAUDE.md · 스킬 `f9-guide-coords`(확정 단추) · `add-species`(장어 공정).
- 아티팩트 4개(절대 규칙 15) — 남은 과업 설계 V66 · 구현 라이브러리 V65 · 채비 모딩 순서도 V58 · 위키 V118(공정 시트 9장 `files`).
