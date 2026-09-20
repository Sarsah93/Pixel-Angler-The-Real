# 164차 — 수동 custom 목표의 실제 행동 이벤트 계약·배선

| | |
|---|---|
| **날짜** | 2026-09-20 |
| **시스템** | `스토리` `데이터` `제작` `필드` `UI` |
| **트리거** | 사용자 지시 — `advanceManual()` 클릭 진행 제거 및 실제 행동별 배선 |
| **선행 커밋** | `f21efce` — `main`에 커밋·푸시 완료 |
| **현재 변경** | 미커밋 |
| **빌드·타입체크** | core `tsc -p tsconfig.build.json` 통과 · client `tsc --noEmit` 통과 |

---

## 1. 배경 — 왜 했나

사용자는 다음 구조 문제를 지적했다.

> “현재 `StoryStore.advanceManual()`이 `manual` 목표를 클릭 한 번으로 증가시키는 구조이고,
> `StoryQuestDatabase.ts`에 수동 custom 목표가 27개 남아 있습니다.”

대화창의 단일 버튼이 제작·운반·검사·선택·현장 행동을 대체하고 있어, 목표 문장과 실제 플레이가
연결되지 않았다.

## 2. 원인 — 무엇이 문제였나

`StoryStore.advanceManual()`은 `manual: true`이고 미완료인 목표의 `obj` 값을 즉시 1 올렸다.
`StoryStore.event()`도 `manual` 목표에 대해 `talk` 외 이벤트를 무시했다.

따라서 데이터에 행동을 설명하는 문장이 있어도 행동 종류를 식별할 계약이나 발행 지점이 없었고,
27개 `custom` 목표가 같은 대화 버튼 경로를 공유했다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `packages/client-pc/src/store/StoryActionRegistry.ts` | 27개 `actionKey`의 행동 계통과 3단계 절차 정의 |
| 수정 | `packages/core/src/types/Story.ts` | `StoryActionKey`와 `StoryObjective.actionKey` 계약 추가 |
| 수정 | `packages/core/src/db-schema/StoryQuestDatabase.ts` | 27개 수동 custom 목표를 고유 행동 키에 매핑 |
| 수정 | `packages/client-pc/src/store/StoryStore.ts` | 계통 발행기, 단계 진행, 세이브 `actionSteps`, action 이벤트 매칭 추가 |
| 수정 | `packages/client-pc/src/ui/DialoguePanel.ts` | 빈 클릭·대사 넘김·NPC 재접근의 자동 진행을 제거하고, 준비 완료 뒤 재대화 제출 흐름 표시 |

추가로 모든 계통에 `evidence-report`·`dialogue-crosscheck`·`field-gate`·`branching-choice`·
`production`·`delivery` 흐름을 부여하고, 계통별 3개 전략 선택지와 우호도 결과를 연결했다.
선택 이력은 `actionChoices`로 저장하고 `choice.action.*` 플래그로 후속 대사/결말이 읽을 수 있다.
검사·현장·제작·운반의 전략 선택은 실제 행동을 대신하지 않는다.
| 수정 | `packages/client-pc/src/store/CraftingStore.ts` | 제작 성공 시 `craft` 행동 발행 |
| 수정 | `packages/client-pc/src/ui/CoolerPanel.ts`·`AuctionHousePanel.ts` | 쿨러·경매 진입 시 검사 행동 발행 |
| 수정 | `packages/client-pc/src/ui/LicensePanel.ts` | 면허 선택·발급 성공 시 선택 행동 발행 |
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` | 장소 도착 뒤 현장 행동 발행 |
| 수정 | `packages/client-pc/src/scenes/AnglerLogScene.ts` | 도감 진입을 검사 행동으로 발행 |

행동 계통은 `dialogue`·`craft`·`delivery`·`inspection`·`selection`·`field` 여섯 가지다.
같은 계통의 실제 성공 이벤트가 세 번 들어와야 해당 action 목표가 완료되며, 이전 목표가 끝나기
전에는 다음 action 목표가 진행되지 않는다. UI는 `0/3 → 1/3 → 2/3 → 3/3 (준비 완료!)`를
표시하고, 준비 완료 뒤 NPC를 **다시** 찾아야 완료 선택지와 보상이 열린다.

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S22 스토리·퀘스트 → 목표 계약·이벤트 판정 → 수동 custom 행동화` 작업이다.

- 계약: core `StoryActionKey`, `StoryObjective.actionKey`.
- 데이터: 퀘스트 27개에 행동 키를 배치.
- 판정·세이브: client `StoryStore`가 계통 이벤트와 단계 상태를 보관·판정.
- 발생: 대화·제작·운반·검사·선택·현장 시스템이 성공 지점에서 발행.
- 표시: 대화창은 다음 실제 행동과 현재 단계만 안내하며 클릭으로 완료하지 않는다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| core 계약·DB | `tsc -p packages/core/tsconfig.build.json` | 통과 |
| client 이벤트·UI 배선 | `tsc --noEmit -p packages/client-pc/tsconfig.json` | 통과 |
| 공백·패치 오류 | `git diff --check` | 통과 |
| 실플레이·브라우저 | 사용자 지시대로 생략 | 미실행 |

`pnpm` 명령은 workspace 링크 재생성 단계에서 비대화형 모듈 제거 오류가 발생해, lockfile 기준
의존성 복구 후 로컬 TypeScript 바이너리로 같은 core/client 타입체크를 수행했다.

## 6. 잔여 — 이번에 안 한 것

- 실제 행동 시스템이 아직 없는 `vessel_safety_inspection`, `hull_inspection`, `video_frame_selection`
  등은 현재 공통 계통 이벤트에 연결할 수 있는 진입점까지만 마련했다.
- 각 행동의 위치·NPC·아이템 조건을 `actionKey`에 추가하는 세부 게이팅은 다음 작업이다.
- F7~F10 및 브라우저 실검증은 사용자가 직접 확인하기로 했으므로 실행하지 않았다.

착수 조건은 해당 시스템에 성공 이벤트가 생기는 것이다. 성공 지점에서
`StoryStore.emitActionSource(source, origin)`을 호출하면 기존 수동 목표와 연결된다.

## 7. 위험·부작용

- 구세이브는 `actionSteps`가 없어도 `obj`를 진행 횟수로 읽는다. 예전 `obj: 1`은 `1/3`이지 완료가 아니다.
- 현재 action 목표는 계통 단위로 매칭한다. 같은 계통의 여러 행동 목표를 동시에 활성화하면
  같은 이벤트가 모두 진행될 수 있어, 다음 단계에서 위치·아이템·NPC 조건을 보강해야 한다.
- `advanceManual()`은 기존 비행동 manual에만 남아 있으며 `actionKey` 목표에는 실패를 반환한다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/story-quests.md` 갱신
- [x] `04-BACKLOG.md` 갱신
- [x] `AGENTS.md` §9 요약 + 링크 갱신
- [x] `IMPLEMENTATION_PLAN.md` 다음 착수 갱신
- [x] action 계통·단계 저장 함정 기록
## 개인 연출·장소 게이트 추가

후속 구현에서는 actionKey가 source 하나만 보고 오르는 경로를 그대로 두지 않았다.

- `StoryCinematicPanel`은 필드 씬 위에서 HUD와 입력을 숨긴 개인 전용 타임라인을 재생한다.
- `MpActivity.cinematic`을 presence에 싣고, 다른 플레이어 화면에는 마지막 위치의 이름표와 `바쁨`만 남긴다.
- N18-6 `label_violation_review`는 `n18-6:watch-cinematic` → `n18-6:ledger-inspect` → `n18-6:report` 순서를 강제한다. 쿨러·경매·도감 같은 일반 검사 화면으로는 오르지 않는다.
- 첫 장면은 도매시장 후문 목격, 두 번째는 수정 명부의 잉크·순서 대조, 세 번째는 도현수에게 증거를 보고하는 장면이다. 세 번째 뒤에는 `3/3 (준비 완료!)` 상태로 남고, NPC와 다시 대화해야 제출된다.
- 나머지 actionKey도 실제 단계 성공 시 `StoryActionRegistry`의 퀘스트별 장소·대사 장면을 호출한다. 이 장면은 선택/제작/운반/검사/현장 이벤트의 성공을 대신하지 않고, 성공 결과를 연출로 보여 주는 후처리다.
