# 199차 — 조작 안내 띠 정리(R11) · 쿨러 여러 마리 놓아주기 · Graphics 판 겹침 감사 · 도움말 재촬영

| | |
|---|---|
| **날짜** | 2026-10-03 |
| **시스템** | `낚시` `쿨러` `UI` `가이드` `집` |
| **트리거** | 사용자 지시(198차 잔여 AO 4건) |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 원문:

> "남은 4건(조작 안내 띠, 쿨러 다중 방생, 도움말 재촬영)도 진행해줘."

198차 §6 잔여(백로그 AO) 4건:

1. 1인칭 화면 위·아래 조작 안내 띠 — R11(창에 조작 안내 문구 금지) 대상 여부 판단 후 정리
2. Graphics만으로 그린 판(1인칭 수심 패널·평면도, 월드맵 범례)은 겹침 감사가 경계를 못 본다
3. 쿨러 패널(B)에서 여러 마리를 골라 한 번에 놓아주기 + 재확인
4. 도움말 「집」 그림 재촬영(198차에 방이 +12px 내려갔다)

## 2. 원인 — 무엇이 문제였나

- **1인칭 하단 조작 띠**(`controlBarText`)는 상태(drift/입질/파이팅)마다 `좌클릭 유지 = 릴링 / ←→ = … / H = 뒷줄견제 …`를
  나열하는 띠였다 — R11이 금지하는 「창에 박힌 조작 안내 문구」 그대로다. 상단 상태 줄도 `(우클릭)`·`↑ 홀드` 같은 키 안내를 섞고 있었다.
- **필드 캐스팅 안내 띠**(`promptText` — `좌클릭 유지 = 조준·차지…` / 구멍치기 `좌클릭 짧게 = 구멍치기…`)도 물가에 설 때마다
  화면 아래에 같은 문장을 띄웠다.
- 감사 하네스는 `getBounds()`가 있는 Text·Image·Container만 봤다. Graphics는 그린 영역을 모르므로 **판 전체가 감사 밖**이었다.
- 쿨러 패널(B)은 한 마리씩 우클릭 → 방생 → 확인만 가능했다(정리 창 `CoolerSwapPanel`만 여러 마리 선택을 지원).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 삭제 | [`FirstPersonFishingScene.ts`](../../../packages/client-pc/src/scenes/FirstPersonFishingScene.ts) | 하단 조작 띠 `controlBarText` · `buildControlBar()` · `refreshControlBar()` — R11 위반. 키 목록은 F1 가이드북 「회수 중 조작」 쪽으로 모았다 |
| 수정 | 〃 | 상단 상태 줄은 **상황만**: `채비 흘리는 중` / `구멍치기 (테트라포드)` / `입질 감지! 초릿대(끝)를 지켜보세요` / `지금 챔질!` / `챔질 성공! 텐션을 30~80 사이로 지키세요` 등. 키 표기 삭제 |
| 신설 | 〃 `refreshSpoolState()` | 스풀 개방·닫힘이 바뀌는 순간 상태 줄 갱신 — `스풀 개방 — 원줄이 나갑니다` / 파이팅 중 `줄 주는 중 — 고기가 원하는 방향으로 달립니다` |
| 수정 | 〃 | 어창 라벨 `어창 (클릭해서 열기)` → `어창` · ESC는 쿨러 패널 `onEscIntercept()`를 먼저 거친다 |
| 수정 | [`RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 캐스팅 안내 띠 삭제 → **처음 한 번 말풍선**(`maybeCastTour` — `cast_first`·`cast_hole` · passive · 캐릭터를 짚음 · 차지하면 다음으로) |
| 신설 | [`CoolerPanel.ts`](../../../packages/client-pc/src/ui/CoolerPanel.ts) | 여러 마리 고르기 — 우클릭 메뉴 「여러 마리 고르기」 또는 Shift+클릭 → 파란 테두리 · 하단 [놓아주기 (N)] [취소] → `ConfirmDialog`(이름·크기 목록 + 「놓아주기」/「취소」) |
| 수정 | 〃 | 한 마리 방생 확인도 같은 양식(`이 고기를 놓아줄까요? …놓아준 고기는 되돌릴 수 없습니다.` · 위험 단추) · `onEscIntercept()` = 확인 창 → 메뉴 → 고르기 순으로 하나씩 닫음 · 체험 가이드 쿨러 단계에 「여러 마리 고르기」 |
| 신설 | [`ScreenReserve.ts`](../../../packages/client-pc/src/ui/ScreenReserve.ts) `tagUiRect` | Graphics 판에 화면 사각형을 달아(`setData('uiRect')`) 감사가 읽게 한다 |
| 수정 | 1인칭 수심 패널·평면도 · [`WorldMapScene.ts`](../../../packages/client-pc/src/scenes/WorldMapScene.ts) 범례 | `tagUiRect` 부착 |
| 수정 | [`tools/ui_overlap_audit.js`](../../../tools/ui_overlap_audit.js) | `uiRect` 태그 읽기 · 상호작용 없는 Image/Sprite(장식 구름) 제외 — 거짓 양성 |
| 수정 | [`GuideContent.ts`](../../../packages/client-pc/src/data/GuideContent.ts) · [`HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) | 가이드북 「회수 중 조작」에 키 목록 이전 · 도움말 캡션 5곳(상태 줄 문구·챔질·어창 메뉴) |
| 수정 | i18n `en.ts` · `en_tour.ts` · `en_tour_panels2.ts` · `en_help.ts` | 새 문구 EN |
| 수정 | [`tools/capture_help_images.cjs`](../../../tools/capture_help_images.cjs) · [`annotate_help_images.py`](../../../tools/annotate_help_images.py) | 새 가이드 id 억제 · 스풀 쪽 결정적 촬영(입질 해제 후 `refreshSpoolState`) · 콜아웃 좌표(집 +12px · 상태 줄) |
| 재촬영 | `public/guide/help/` | 13쪽 × ko/en = 26장 — 집 3 · 캐스팅 · 1인칭 화면 · 스풀 2 · 챔질 · 파이트 · 끌어오기 · 결정 · 걸림 · 쿨러 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- `S1 낚시 루프 → 1인칭 화면 → 상태 줄/조작 띠` — **렌더 층**. 판정·입력 처리는 그대로(키 바인딩 변경 없음).
- `S1 낚시 루프 → 쿨러 → 쿨러 패널 방생` — **UI 층**. `CoolerStore.removeAt` 기존 경로 재사용(스토어 계약 변경 없음).
- `S9 UI 프레임워크 → 겹침 감사` — 도구 + `ScreenReserve` 헬퍼(데이터 태그만).

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 1인칭 상태 줄 | 실렌더(Playwright, ko) | `채비 흘리는 중` · 키 표기 Text 0개 · 스풀 열기/닫기 → 문구 전환 |
| 쿨러 여러 마리 | 실렌더 — 칸 [0,2,4] 고르기 → [놓아주기 (3)] | 확인 창에 3마리 목록 → ESC = 확인 창만 닫힘(패널·고르기 유지) → 다시 → 놓아주기 → 3마리 감소(남은 칸 [19,21,23]) |
| Shift+클릭 · ESC | 실렌더 | Shift+클릭 고르기 ✓ · ESC로 고르기 종료 ✓ |
| 겹침 감사 | `tools/ui_overlap_audit.js` | 홈타운·집·집 플래시·가구 배치·속초·1인칭(13항 — 태그 판 포함)·메인 메뉴·월드맵·조행록·설정 **부분 겹침 0** |
| 도움말 26장 | 육안 | 스풀 쪽 = 상단 `Bail open — line is paying out` 위 ②(1차 촬영은 입질 깜박임이 찍혀 결정적 촬영으로 재촬영) · 가구 배치 트레이·완료 콜아웃 일치 |
| pageerror | 하네스 | 0 |
| 빌드 | `npx pnpm run build` · typecheck | 3/3 · 0 오류 |

## 6. 잔여 — 이번에 안 한 것

- **파이트 반응 단서 배너**(`바늘털이! 릴링 멈추고 ↑를 떼세요!` 등)는 **남겼다** — 상시 띠가 아니라 그 순간에만 뜨는 게임플레이 신호다.
  키를 빼고 「무엇을 할지」만 말하게 바꿀지는 사용자 판단(R11 해석).
- 결정 패널 단추 `필드로 돌아가기 (SPACE)`의 키 표기 — 단추 라벨의 단축키 표기는 관용으로 보고 유지.
- 캐스팅 말풍선은 **처음 한 번**만 뜬다. 다시 보려면 도움말(F1).

## 7. 위험·부작용

- 하단 띠가 사라져 **처음 하는 사람이 키를 모를 수 있다** — 1인칭 첫 진입 가이드북(F1 자동)과 필드 첫 캐스팅 말풍선이 대신한다.
  기존 세이브는 가이드북을 이미 본 상태라 새 「회수 중 조작」 쪽을 못 볼 수 있다(F1로 열람).
- 쿨러 ESC 순서가 하나 늘었다(확인 창 → 메뉴 → 고르기 → 패널) — 강제 방생 `lockedOpen` 판정보다 앞이라 잠긴 채 닫히지 않는다.

## 8. 후속 반영

- [x] 시스템 페이지 `fishing-loop.md` §4(쿨러 패널 여러 마리) · `ui-framework.md` §6(Graphics 판 `tagUiRect`)
- [x] `04-BACKLOG.md` AO 해소 → 잔여 2건(반응 단서 · SPACE 표기) AP로
- [x] `AGENTS.md` §9 · §6c · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 요약
- [x] 스킬 `ui-panel` — 감사 대상에 Graphics 판 태그
