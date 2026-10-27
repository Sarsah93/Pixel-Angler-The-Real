# 281차 — 줄 세기 호수 기준 하나로 · main 반영 · 90차 배포 · 하모니 v2(제품 점검으로 개편)

| | |
|---|---|
| **날짜** | 2026-10-27 |
| **시스템** | `낚시`(줄 세기) · `인벤`(상세 창 · 줄 제원) · 배포 · 하모니(일일 점검 — `harmony-state` 브랜치) |
| **트리거** | 사용자 — 백로그 CY 「n호수로 하고, lb까지 표시할 수 있으면 같이 하는 게 좋으려나? 통일하는 게 좋으려나? 너가 결정해줘」 · 「main 반영과 재배포 진행해줘」 · 하모니 「기획&개발 관련 develop은 하나도 없는 것 같고 … git 히스토리 관리 정도」 → (가) 방법 · 예산 4% · 결함 수정 PR 허용 |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` · main 빨리 감기(`f400f33`) · `harmony-state`(`9aa5537` · `7ced676` · `ed3e005`) |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 33파일 345 통과 |

---

## 1. 배경 — 왜 했나

- **CY(줄 세기 기준 둘)**: 280차 점검에서 같은 줄의 세기가 두 곳에서 달랐다. 사용자 결정 요청 → 「n호수로 하고 … 너가 결정해줘. (우선 인게임 내에서는 호수가 지배적이긴 하네.)」
- **배포**: 280차(미끼 갑 · 아이템 점검 26건)를 직접 해 보려면 main 반영과 재배포가 필요했다 — 「진행해줘」.
- **하모니**: 사용자 의견 원문 —
  「도메인 1~9에서 … 기획&개발 관련된 develop은 하나도 없는 것 같고, 그냥 git 히스토리 관리 정도로 보여지고 있거든? …
  내가 원했던 일일 점검 develop은 … 미끼 갑(box)이 채비하기 미끼란에 통채로 들어가는 설계 오류 … 아이템 이미지; 신발이 세 켤레, 장갑이 세 켤레 …
  현실적인 요소 혹은 밸런싱이 필요한 부분들, 서비스 플로우에서 보안 정책이나 계정 및 접근성」.
  결정: (가) 이 세션에서 상태 브랜치를 고치기 · 실행 1회 예산 4% · 「재현되고 검증 통과한 작은 결함 수정은 PR로 허용」.

## 2. 원인 — 무엇이 문제였나

**줄 세기 셋.**

| 어디 | 값 | 비고 |
|---|---|---|
| 낚시 물리 `lineStrengthKg`(이름의 「N호」) | 모노 1.8kg/호 · 합사 9kg/호 | 실제 호수 통상값(모노 1호 ≈ 4lb · 합사 1호 ≈ 20lb)과 맞다 |
| 줄 제원표 `LINE_DATABASE` `strengthFactor` | 나일론 4 · **카본 3.5** · **합사 17.5** lb/호 | 카본 3호 10.5lb(4.8kg) · 합사 1호 17.5lb — 물리와 다름 |
| 상점 · 시작 줄 `lineStrengthLb` | 합사 1호 18lb · 카본 3호 10.5lb | 상세 창 「인장 강도」가 이 값을 그대로 찍었다 |

결정: **호수가 기준, lb는 같은 표에서 나온 표시값.** 물리 값(이미 실제 규격에 가깝다)을 정본으로 두고 표시를 맞췄다 — 낚시 판정은 그대로다.

**하모니가 문서 정리로 쏠린 이유(구조).**

- 도메인이 파일 종류(엔지니어링 · 코드 · 문서 · 파이프라인 · 스킬 …)로 나뉘어 있었다 — 게임 기능 단위가 아니다.
- 점수 「숙련」 = 범위 안 파일을 읽은 비율. 매일의 심화는 종합 점수가 가장 낮은 도메인 → 문서가 많은 8 노트·메모리가 늘 꼴찌라 심화가 문서로 갔다.
- 발견 99건 중 문서 · 스킬 · 파일 정리가 35건(열림), 해소 7건도 대부분 문서 수치 · CI · 정리. 게임 결함으로 볼 만한 발견(F-0009 · F-0043 · F-0048 등)은 찾아 놓고 열린 채였다.
- 게임을 띄워 조작하는 단계가 없었다(그림 렌더 상시 과제 하나뿐). 수정 기준은 「작고 안전한 정리」 위주, 토큰 목표 1%.

## 3. 변경 — 어디를 어떻게

**줄 세기(게임).**

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/src/rules/LineStrength.ts`](../../../packages/core/src/rules/LineStrength.ts) | 호수 표 하나 — `MONO_LINE_KG_PER_HO` 1.8 · `PE_LINE_KG_PER_HO` 9 · `lineHoOf`(lineNo 우선 · 이름) · `isPeLine`(재질 우선) · `lineStrengthKgOf` · `lineLbFromKg`(정수) · `lineStrengthView` |
| 수정 | core `FishRarity.lineStrengthKg` | 새 표를 부른다 — 값 변화 없음(합사 1호 9kg · 카본 3호 5.4kg · 나일론 2호 3.6kg) |
| 수정 | core `GearSpecs` `LINE_DATABASE` | `strengthLb`를 같은 표에서 계산(카본 3.5 → 4lb/호 · 합사 17.5 → 20lb/호) — 위키 줄 제원 |
| 수정 | [`ui/ItemDetailPanel.ts`](../../../packages/client-pc/src/ui/ItemDetailPanel.ts) `lineStrengthLabel` | 원줄 · 목줄 스풀 「인장 강도」 = 「12lb (5.4kg)」 — 옛 세이브의 제원 lb는 읽지 않는다 |
| 수정 | `ShopCatalog` · `InventoryStore` 시드 | 합사 1호 18 → 20lb · 카본 3호 10.5 → 12lb · 설명 문장 · 영어 두 줄(`en_items`) |

**배포.** main 빨리 감기 `b6d3849..f400f33` → Actions 「테스트 배포」 실행 19(성공 · 약 1분) → gh-pages `c31bc79`(90차).

**하모니 v2(`harmony-state` 브랜치 — 게임 코드 밖).**

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `harmony/PROTOCOL.md` | v2 — 요일 갈래 · 변경분 영향 점검 · 시나리오를 실제로 돌림(하네스 · 정적 표 · 그림 · 웹) · 같은 모양 훑기 · 재현 + 검증 결함 PR · 보고서 첫머리 = 찾은 버그 |
| 수정 | `harmony/config.json` | 도메인 9 → 갈래 8(① 아이템·재화 · ② 그림·데이터·문구 · ③ 흐름·예외 · ④ 현실성·밸런스 · ⑤ 보안·계정·서비스 · ⑥ 접근성 · 기본 점검 · 문서) · 요일표 · 한도(시나리오 4 · 하네스 40분 · 예산 4%) |
| 신설 | `harmony/agents/q1 ~ q6 · b0 · d0` | 갈래 지침(질문 · 방법 · 이 프로젝트 전용 · 고칠 수 있는 것 · 제안만) |
| 신설 | `harmony/knowledge/bug-patterns.md` | 버그 패턴 44종(워크로그 186~280 원인 · 함정 — 하위 에이전트 조사 · 대조) |
| 신설 | `harmony/knowledge/scenarios.json` | 시나리오 50개(갈래별) · 마지막으로 돌린 날 |
| 신설 | `harmony/tools/harness_start.cjs` | 새 게임 필드에 서는 하네스 시작 본(실행 확인 — PASS 1 · pageerror 0) |
| 수정 | `harmony/tools/score.py` · `tokens.py` | 숙련 → 시나리오(14일) · 지수 = 제품 갈래만 · 오늘 찾음 · 고침 / 목표 4% · 목표 안 증가는 「지켜봄」 |
| 수정 | `harmony/ledger/*.json` | 발견 99 · 수정안 23에 `lane` 부여(옛 `domain`은 남김) |
| 이동 | `harmony/agents/v1/` · `knowledge/v1/` | v1 지침 · 학습 노트 보관(참고 자료) |
| 신설 | `harmony/trigger-prompt-v2.md` | 예약 작업 지침 본문 — **에이전트가 예약 작업을 바꿀 수 없어**(사용자 계정에서 만든 것) 사용자가 붙여 넣는다 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- 줄 세기: `낚시 → 줄 → 세기` · **데이터(core 규칙 표) + 렌더(상세 창)** 층. 판정 값은 그대로라 밸런스 파급 없음.
- 하모니: 게임 밖 운영 계층(`harmony-state` 브랜치). main · gh-pages에는 닿지 않는다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 줄 세기 값 | core dist로 직접 호출 | 합사 1호 9kg · 20lb / 카본 3호 5.4kg · 12lb / 나일론 2호 3.6kg · 8lb / PE 0.8호 16lb · 줄 제원표 나일론 2 · 2.5 · 3 · 5호 = 8 · 10 · 12 · 20lb |
| 상세 창 | 하네스 `r281a.cjs`(scratchpad) — `buildItemDetail` | 「인장 강도 = 20lb (9kg) · 12lb (5.4kg) · 8lb (3.6kg)」 · 옛 제원 10.5lb를 넣어도 12lb · 물리 용량 5.4 · pageerror 0 |
| 빌드 · 시험 | `npx pnpm run build` · typecheck · core test | 3/3 · 0 · 345 통과 |
| 90차 배포 | gh-pages 받기 → 로컬 dist 대조 · 하위 경로 기동 | 정적 2,003 중 2,001 같음 · 다름 = 번들 · index(CI 빌드라 해시만 다름) · 번들에 새 문장(「인장 20lb」 · 「열어서 꿰기」 · `starterToolsGiven`) 있음 · 기동 10.3초 · 4xx 0 · pageerror 0 |
| 하모니 도구 | 상태 폴더 복사본에서 `score.py` · `tokens.py show` · `collect_metrics.py` | 표 출력(제품 지수 48 · 가장 약한 갈래 ⑤ 보안) · 판정 「목표 4.0% 이내 → 유지」 · 지표 수집 4,039파일 정상 |
| 하네스 본 | `harness_start.cjs`로 새 게임 → 아이템 넣기 → core 호출 | PASS 1 · pageerror 0(새 게임은 가방이 비어 있음 — 본 머리 주석에 적음) |

## 6. 잔여 — 이번에 안 한 것

- **예약 작업 지침 교체** — 사용자 몫(`harmony/trigger-prompt-v2.md` 본문을 예약 작업 설정에 붙여 넣기). 붙여 넣기 전에도 v2 절차는 돈다(옛 지침도 `PROTOCOL.md`를 따른다) — 마지막 메시지 형식만 옛 모양.
- **CX(장비 · 루어 개체 분리)** — 사용자 판단 대기. 설명은 사용자 보고에 자세히 적었다.
- **CZ** — 사용자 실검증(트레블 훅 · 밑밥 재료 표 · 미끼 갑 흐름).
- **dev 서버를 사용자 PC에** — 원격 컨테이너의 5173은 사용자 브라우저에 닿지 않는다. 사용자 PC에서 직접 띄우는 명령을 안내했다.
- 하모니 규칙 정규식 `no-scene-start-field`가 `'FieldScene'`만 잡는다(정본 이름 `RegionFieldScene`) — `b0-baseline.md`에 적어 두었다.

## 7. 위험·부작용

- 줄 세기: 판정 값 변화 없음. 표시 lb가 바뀐 줄 — 합사 1호 18 → 20lb · 카본 3호 10.5 → 12lb · 줄 제원표 카본 · 합사 전 호수.
- 하모니 v2 첫 실행(10-28 새벽)은 게임을 띄우므로 v1보다 오래 걸리고 토큰을 더 쓴다(목표 4% — 약 600k). 브라우저가 안 뜨면 정적 점검으로 내려간다.
- 하모니가 결함 수정 PR을 올리기 시작한다 — 병합 전 확인은 사용자 몫(그대로). 열린 PR 상한 3건.

## 8. 후속 반영

- [x] 시스템 페이지 `fishing-loop.md` §6 · `inventory-equipment.md` §6(줄 세기 한 표)
- [x] `04-BACKLOG.md` — CY 해결(삭제) · CZ ⑤ 문구
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 요약 · 배포 줄(90차)
- [x] 아티팩트 4개 — 점검 `check_artifact_page` 셋 PASS · 위키 Playwright pageerror 0
  - 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 — Version 23
  - 구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 — Version 25
  - 채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 — Version 23(채비 문법은 258차 그대로)
  - 전체 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c — Version 76(시스템 탭 「세기 = 호수」 줄 · `tools/gen_game_wiki_data.mjs`)
