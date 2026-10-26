# 273차 — 원줄 · 목줄 내구도(묶인 줄의 마모 · 재질 · 「줄 끝 잘라 다시 매기」)

| | |
|---|---|
| **날짜** | 2026-10-26 |
| **시스템** | `낚시 루프` `인벤 · 장비` `UI` |
| **트리거** | 사용자 지시 「원줄/목줄은 내구도로 해야 할 것 같은데...가장 리얼요소를 반영하려면 어떻게 적용하는 게 좋을까? 위 내용까지 적용 후 배포하고, main 빨리 감기 해줘.」 |
| **커밋** | `f9ed6d0`(구현 · 문서) + 86차 기록 커밋 — 작업 브랜치 `claude/project-review-task-planning-yopbck` → main 빨리 감기 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 345/345(`LineWear.test.ts` 13 신설) |

---

## 1. 배경 — 왜 했나

사용자 지시(2026-10-26): 「원줄/목줄은 내구도로 해야 할 것 같은데...가장 리얼요소를 반영하려면 어떻게 적용하는 게 좋을까?
위 내용까지 적용 후 배포하고, main 빨리 감기 해줘.」

그전까지 줄은 **터질 때만** 잃는 소모품이었다(206차 — 터진 길이만 스풀에서 잘린다). 터지기 전까지는 새 줄과 똑같이 셌다.
실제 낚시에서는 반대다 — 줄은 터지기 **전에** 서서히 약해지고, 약해진 줄로 큰 고기를 걸어서 터진다.
그래서 낚시꾼은 매듭 위 몇 미터를 잘라 내고 다시 묶는다. 이번 차수는 그 관행을 모델로 옮긴 것이다.

### 「가장 리얼한 요소」로 고른 것

| 현실 | 모델 |
|---|---|
| 내구도는 스풀이 아니라 **지금 묶여 있는 한 가닥**의 상태다 | 마모 0~1을 역할(원줄 · 목줄)마다 두고, 칸의 스풀이 바뀌거나 터져서 잘리면 0 |
| 한계 가까이에서 버틸수록 줄이 지친다(반복 하중 피로) | 그 줄의 장력비가 0.5를 넘는 동안 (초과분)² × 0.01/초 × 재질 — 센 원줄은 같은 게이지에서도 덜 받는다 |
| 들어 올리는 순간 충격이 가장 크고, 목줄은 고기 몸 · 지느러미에 쓸린다 | 무게 ÷ 그 줄의 세기 × 0.06 × 재질 — 목줄 1.5배 · 원줄 0.4배 |
| 밑걸림을 끌어내면 바위에 긁힌다 | 채비를 건졌을 때 목줄 0.12 · 원줄 0.04 × 재질 쓸림(잘려 나간 줄은 새 줄) |
| 던질 때마다 가이드를 지나 결이 인다(특히 합사) | 캐스팅마다 0.002 × 재질(합사 1.4 · 나일론 · 카본 0.6) · 목줄은 1/3 |
| 여 위를 끌린 목줄이 긁힌다 | 끌린 거리 1m당 0.008 × 바닥 근접도(밑걸림 모델과 같은 값) × 재질 쓸림 · 원줄은 1/5 |
| 재질이 다르다 — 나일론은 늘어나고 물을 먹는다 · 카본은 쓸림에 강하다 · 합사는 세지만 쓸림 · 매듭 · 가이드에 약하다 | `LINE_MATERIAL_TRAITS`(쓸림 1.0 / 0.55 / 1.8 · 피로 1.1 / 0.9 / 0.5 · 가이드 0.6 / 0.6 / 1.4 · 충격 0.7 / 1.0 / 1.5 · 나일론 젖음 −8%) |
| 쓸린 줄은 공칭보다 약하게 터진다 | 세기 = 공칭(호수 환산) × (1 − 마모 × 0.5) — 파이팅 게이지 분모 · 드랙 · 대 과부하 판정이 전부 이 값을 쓴다 |
| 매듭 위를 잘라 다시 묶으면 새 줄이다 | 「줄 끝을 잘라 다시 매기」 — 목줄 1.5m · 원줄 3m를 스풀에서 잘라 내고(206차 `cutLine`) 마모 0 |

## 2. 원인 — 무엇이 문제였나

버그 수정이 아니라 설계 추가다. 다만 작업 중 결함 하나를 찾았다 —
`UtilizationPanel.flashBoardToast`가 글자를 `bodyContainer`에 넣는데, 호출 바로 뒤에 도는 `renderBody()`가 `bodyContainer.removeAll(true)`로 비우며
글자까지 지웠다. 채비 고정 · 고정 해제(155차) · 「권장되는 채비 유형이 아닙니다」(193차) 토스트가 채비하기 탭에서는 한 번도 보이지 않았다
(실측: `retieLine` 뒤 `renderBody` → `bodyContainer`에서 토스트 텍스트 0건). 거기에 도마 사각형(`cookBoardRect`)은 요리 탭을 그리기 전에는 0이라
채비 탭에서는 (0,0)에 찍혔다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`packages/core/src/types/LineWear.ts`](../../../packages/core/src/types/LineWear.ts) | `LineMaterialKey` · `LineRole` · `LineWearStage` · `LineMaterialTraits` · `LineWearSummary` |
| 신설 | [`packages/core/src/simulation/LineWear.ts`](../../../packages/core/src/simulation/LineWear.ts) | 재질 표 · 단계 · `effectiveLineStrengthKg` · `fightFatigueWear` · `lineTensionRatioOf` · `landingShockWear` · `snagPullWear` · `castWear` · `bottomDragWear` · `retieCutM` |
| 신설 | [`packages/core/src/simulation/LineWear.test.ts`](../../../packages/core/src/simulation/LineWear.test.ts) | 시험 13(재질 추정 · 단계 문턱 · 잘림 · 세기 · 젖음 · 장력비 옮김 · 다섯 길 · 다시 매기 · 표) |
| 수정 | [`packages/core/src/config/tuning.ts`](../../../packages/core/src/config/tuning.ts) | `TUNING.lineWear` 18키 + META 슬라이더 10 |
| 수정 | [`packages/core/src/index.ts`](../../../packages/core/src/index.ts) | export |
| 수정 | [`packages/client-pc/src/store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | `_lineWear`(역할별 `{itemId, wear}`) · 세이브 `lineWear`(구세이브 0 · id 정본화) · `syncLineWear`(투영마다 스풀 바뀜 → 0) · `lineWearOf/addLineWear/lineWearSummaryOf/lineWearView/retieLine` · `applyRigLoss` 잘린 줄 0 · 거치 목줄 0 · `lineCapacityKg` = 유효 세기(공칭은 `lineNominalCapacityKg`) |
| 수정 | [`packages/client-pc/src/scenes/FirstPersonFishingScene.ts`](../../../packages/client-pc/src/scenes/FirstPersonFishingScene.ts) | `applyCastWear`(create) · `applyBottomDragWear`(밑걸림 틱) · `applyFightWear`(파이트 틱) · `applyLandingWear`(`onLanded`) · `applySnagPullWear`(끌어냄) · `bumpLineWear` + `lineWearNotice`(흰 테 · 장비 일지 · 단계 오를 때 한 번) |
| 수정 | [`packages/client-pc/src/ui/UtilizationPanel.ts`](../../../packages/client-pc/src/ui/UtilizationPanel.ts) | 줄 칸 배지(쓸림 · 심함 · 위험) · 제원 줄 꼬리 · 칸 목록 맨 위 「줄 끝을 잘라 다시 매기 — N m 소모 (단계)」(고정 중에도 이 행만) · 가이드 단계 + 첫 배지 미니 가이드 `line_wear` · 토스트를 패널 자식으로(탭별 자리) |
| 수정 | [`packages/client-pc/src/ui/ItemDetailPanel.ts`](../../../packages/client-pc/src/ui/ItemDetailPanel.ts) | 원줄 · 목줄 스풀 「성질」 줄(`shortKo`) |
| 수정 | [`packages/client-pc/src/data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) | 「줄 호수와 인장강도」에 문단 2(쌓이는 길 · 다시 매기 · 재질) |
| 수정 | `packages/client-pc/src/i18n/en_rig.ts` · `en_help.ts` | 사전 14 · 규칙 7 |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) | 「시스템」 탭 `line_wear` 절(수치는 core에서 읽는다) |
| 수정 | `docs/artifacts/library.html` · `tasks.html` · `rig_flow.html` | 라이브러리 항목 「원줄 · 목줄 내구도」 · 파이팅 꼬리 · 273차 기준 |

### 수치(기본값 — F8 「lineWear.*」)

| 키 | 값 | 뜻 |
|---|---|---|
| `strengthLossAtWorn` | 0.5 | 마모 1에서 세기 절반 |
| `fatigueK` · `fatigueThreshold` | 0.01 · 0.5 | 파이팅 피로 — 장력비 0.9에서 60초 = 나일론 0.106 · 카본 0.086 · 합사 0.048 |
| `shockK` · `landingLeaderMult` · `landingMainMult` | 0.06 · 1.5 · 0.4 | 랜딩 — 2kg을 카본 3호(5.4kg)에 올리면 목줄 0.033 |
| `snagPullLeader` · `snagPullMain` | 0.12 · 0.04 | 끌어냄 — 카본 목줄 0.066 · 합사 원줄 0.072 |
| `castK` · `castLeaderFrac` | 0.002 · 1/3 | 합사 원줄 100번 = 0.28 · 카본 목줄 100번 = 0.04 |
| `dragPerM` · `dragMainFrac` | 0.008 · 0.2 | 카본 목줄 10m = 0.044 · 합사 원줄 0.029 |
| `nylonWetLoss` | 0.08 | 나일론 2호 3.6 → 3.31kg |
| `retieLeaderM` · `retieMainM` | 1.5 · 3 | 다시 매기 소모 |
| `stageLight` · `stageHeavy` · `stageCritical` | 0.2 · 0.5 · 0.8 | 쓸림 조금 · 쓸림 심함(배지 「심함」 · 알림) · 끊어지기 직전(「위험」 · 던질 때마다 알림) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S2 낚시 루프 → 파이팅 · 채비 손실 → 줄 세기` 와 `S4 인벤 · 장비 → 채비 트리 → 줄 칸`.
계약(타입 `LineWear` · 세이브 `lineWear`) · 데이터(재질 표 · TUNING) · 판정(core 함수 · `lineCapacityKg`) · 렌더(배지 · 목록 행 · 알림 · 상세 · 도움말) 네 층 전부.
파급 — `lineCapacityKg()`를 읽는 곳 전부(파이트 분모 · 드랙 · 대 과부하 판정 · 채비 제원 줄)가 마모 · 젖음을 반영한 값을 받는다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| core 모델 | vitest `LineWear.test.ts` | 13/13 · 전체 345/345(33 파일) |
| 스토어 — 새 줄 · 마모 → 세기 · 세이브 왕복 · 구세이브 · 다시 매기 · 손실 리셋 · 스풀 바꿈 리셋 | 하네스 `wear273.cjs`(dev 서버 · `__INV`) | A~F 7/7 — 원줄 9 · 목줄 5.4 → 마모 0.3 세기 4.59 · 왕복 유지 · 구세이브 0 · 다시 매기 148.5m · 목줄 터짐 뒤 0 · 나일론 원줄 바꿈 0 · 젖음 4.968 |
| 채비 창 | 같은 하네스 — 고정 + 마모(원줄 0.25 · 목줄 0.55) → `renderBody` 글자 · 칸 클릭 목록 · `retieLine` | 배지 「쓸림」 · 「심함」 · 제원 「라인 인장: 3.9 kg · 목줄 쓸림 심함」 · 고정 중 목줄 칸 = 「줄 끝을 잘라 다시 매기 — 1.5m 소모 (쓸림 심함)」 + 닫기 · 다시 맨 뒤 0 · 토스트 「목줄 끝을 잘라 다시 맸다 — AMSTRONG 카본 목줄 3호 1.5m」 |
| 1인칭 — 다섯 길 | 같은 하네스 — `__FP` 메서드 직접 호출 + 입질 강제 파이팅 300틱(장력 85) | 캐스팅 +0.0028/+0.0004 · 피로 1초 0.00182/0.00012 · 랜딩 2kg 0.033/0.009 · 끌어냄 0.066/0.072 · 끌림 10m 0.044/0.029 · 루프 +0.0041 · 알림 글 1 |
| 404 · pageerror | 하네스 | 0 · 0 |
| 빌드 · 타입 | `npx pnpm run build` · typecheck | 3/3 · 0 |
| 아티팩트 | `check_artifact_page.cjs` 셋 | PASS · PASS · PASS |

스크린샷(scratchpad `wear273/`): `rig_badges.png`(배지 · 제원 줄) · `rig_retie_row.png`(목록 행 「추천」) · `rig_after_retie.png` · `fp_notice.png`(파이팅 중 흰 테 알림).

재현: 새 게임 → 직판장 물건(합사 원줄 1호 · 카본 목줄 3호 · 바늘 · 곽크릴)을 가방에 → 원줄 → 없음 → 직결 → 목줄 → 직결 → 바늘 → 미끼 →
`__INV.addLineWear('leader', 0.3)` → `lineCapacityKg()` 4.59 → `retieLine('leader')` → 0 · 148.5m.

## 6. 잔여 — 이번에 안 한 것

- **수치 조율은 실플레이 뒤** — 다섯 길의 계수는 「한 번의 긴 파이팅 ≈ 쓸림 조금 문턱」 · 「합사 원줄 100번 캐스팅 ≈ 0.28」을 기준으로 잡은 초안이다(F8 슬라이더 10).
- **거치대(207차)에 걸어 둔 낚싯대의 줄**은 마모를 쌓지 않는다 — 거치대 시뮬은 평면 스냅샷이라 줄 상태가 없다. 거치대 파이팅은 1인칭으로 넘어오므로 그때부터 쌓인다.
- **이빨 고기(복어 · 갈치)의 부분 쓸림**은 없다 — 지금은 `lineCutter`가 목줄째 자른다(기존 규칙 그대로).
- **매듭 세기**(합사 직결이 약한 것)는 넣지 않았다 — 공칭값이 바뀌어 도움말의 「5.4kg 기준」이 흔들린다. 필요하면 재질 표에 `knot` 계수 한 줄.
- 상점의 나일론 원줄(`shop_nylon3_main`)은 젖음 −8%를 받는다 — 값 그대로 두었다(기준가 5,000원 · 합사보다 훨씬 싸다).

## 7. 위험·부작용

- `lineCapacityKg()`가 **낮아질 수 있다**(마모 · 나일론 젖음) — 나일론 목줄 2호 세이브는 3.6 → 3.31kg로 시작한다. 구세이브의 마모는 0이라 그 밖에는 같다.
- 토스트를 패널 자식으로 옮겨 **채비 고정 · 고정 해제 · 비권장 미끼 토스트가 이제 보인다**(그전에는 바로 지워졌다) — 1.8초 뒤 사라지므로 겹침은 없다.
- 1인칭 알림은 단계가 **오를 때 한 번**(역할별 · 그 낚시 안)이고, 끊어지기 직전인 줄은 던질 때마다 한 번 더 말한다 — 의도한 반복이다.
- 성능 — 파이트 틱 · 밑걸림 틱마다 `lineWearView()`(아이템 둘 조회 · 소수 연산)를 부른다. 프레임 비용은 무시할 수준(하네스 300틱 4.87초 · 지연 없음).

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/fishing-loop.md` §4 · §6 · `inventory-equipment.md` §4 · §6
- [x] `04-BACKLOG.md` CP 행
- [x] `AGENTS.md` §9 요약 + 링크 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 아티팩트 4개(절대 규칙 15) — 과업 Version 16 · 라이브러리 18 · 순서도 16 · 위키 71 (`docs/artifacts/README.md`)
- [x] **86차 배포**(2026-10-26 · 「테스트 배포」 실행 15 · 작업 브랜치 `f9ed6d0` · gh-pages `8e5bf34` · 정적 2,004 · public 대조 같음 2,001 · 다름 0 · 빠짐 0 ·
  번들에 「줄 끝을 잘라 다시 매기」 있음 · 하위 경로 기동 15.6초(헤드리스) · 텍스처 1,409 · 404 0(외부 KAMIS 스냅샷 1건은 환경 차단) · pageerror 0)
- [x] **main 빨리 감기**(사용자 지시 「main 빨리 감기 해줘」) — `origin/main` `0415a0d` → 작업 브랜치 머리(272차 둘 · 273차 · 이 기록 커밋)
