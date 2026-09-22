# 167차 — 퀘스트 장면 게이트: 클릭으로 닫히던 목표 100건을 컷씬으로 · N18-6 「위반 증거」 사용자 각본 · 아이콘 2건

| | |
|---|---|
| **날짜** | 2026-09-22 |
| **시스템** | `스토리` `컷씬` `UI` `아이콘` `i18n` |
| **트리거** | 사용자 지시 3건 (아이콘 매핑 2 · 퀘스트 공통 설계 결함 · N18-6 각본) |
| **커밋** | `844ad6f` |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 지시(원문):

- "아이콘 매핑 2개 추가하고" — 첨부 2장 = 혼무시(지렁이 뭉치 도트) · 감성돔 바늘(단일 바늘 도트).
  166차에 "에셋 없는 잔여"로 남긴 `inv_honmushi`·`inv_chinu3`의 이모지를 이걸로 지운다.
- "모든 퀘스트에서 공통적으로 잘못 설계된 부분들이 있어. 유저가 특정 행동을 하지 않아도 그냥 클릭만해도 클리어되거나,
  보상을 단순 지급하고 있어. 유저가 특정 행동을 하도록 디테일하게 설계되어야 해."
- N18-6 「위반 증거」 각본 — 도매시장 근처에 숨은 수상한 사람 → 말을 걸면 곧바로 컷씬 → 벽에 숨어 관찰 →
  두 사람이 마주 서서 말풍선 `...`을 좌우로 교차(아래 대사창 순서대로) → 대사 6줄 → 수정된 명부(책) 전달 →
  2는 오른쪽으로 사라지고 1은 나를 못 보고 지나간다 → 혼잣말 "(이건 아무래도 큰일인데...?)".
  "이런 느낌으로 퀘스트 자체에 부여된 스토리를 컷씬 연출 등으로 표현해야 함.
  지금 짜여진 모든 퀘스트에서 이러한 부분을 반영해줬으면 좋겠어."

## 2. 원인 — 「클릭만 해도 클리어」의 정체

실측(`packages/core/dist` 기준) — 186퀘 342목표 중:

| 경로 | 건수 | 기전 |
|---|---|---|
| `talk` 목표 | 79 | `DialoguePanel` 생성자가 `StoryStore.event({ kind: 'talk' })`를 발행 → **대화창을 여는 순간** 닫혔다 |
| 수동 목표(행동 키 없음) | 21 | `[이 자리에서 마무리]` 행 = `advanceManual` 클릭 한 번(boatTrip 9 · furnish 3 · survive 2 · holdPosition 2 · mine 2 · farm 2 · deliverFree 1) |
| 대화·선택 계통 행동 키 | 8 | `chooseAction`이 **선택 클릭 자체를 성공 이벤트로** 발행(`quality_course`·`oral_history`·`legal_route_choice` 등) |

즉 100건은 조작이 "클릭"이었고, 8건은 "선택지 클릭"이었다. 보상은 이 목표들이 닫힌 뒤 완료 대화에서 그대로 지급됐다.
164차가 행동 키를 붙인 27건 중 검사·제작·운반·현장 계통은 실제 시스템 사건이 필요했지만, 대화·선택 계통은 예외였다.

N18-6은 165차에 3부작 컷씬이 있었으나 ① 배우가 **도현수·강두철**(발주자·계원)이라 "수상한 사람"이 아니었고
② 트리거가 금색 점이라 "숨은 NPC에게 말을 건다"가 아니었으며 ③ 말풍선이 본문 전체를 띄워 교차 연출이 없었다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`store/StoryStore.ts`](../../../packages/client-pc/src/store/StoryStore.ts) | `StoryEvent 'scene'` 신설 — 그 퀘스트·그 목표 하나만 닫는다. `talk` 이벤트는 무시(`match` → null). `isSceneObjective`·`sceneNpcOf`·`sceneEntryNpc`(상대가 필드에 없으면 발주자가 입구)·`sceneObjectivesFor(npcId)`·`setFieldNpcs`. `chooseAction(…, deferEmit)` + `finishActionChoice` — 대화·선택 계통은 장면이 끝난 뒤 오른다. dev `devActivateQuest`·`__STORY` |
| 수정 | [`ui/DialoguePanel.ts`](../../../packages/client-pc/src/ui/DialoguePanel.ts) | 생성자의 `talk` 발행 **삭제**. `[이 자리에서 마무리]` 폐기 → 장면 행(`sceneRow`) · 상대가 다른 사람이면 "…을(를) 직접 찾아가야 한다" 안내. 메뉴에 이 사람과 이어지는 장면 행(발주자가 아니어도 — 정옥선 앞 M1-01). `viaNpc` 트리거 행. `onScene(DialogueSceneRequest)` 콜백 |
| 신설 | [`data/QuestScenes.ts`](../../../packages/client-pc/src/data/QuestScenes.ts) | 나레이션 층(`StoryNarrative`·`StoryDialogue`)에서 장면을 **조립**하는 생성기 + 손글 우선 표 `QUEST_SCENE_OVERRIDES`(M1-01 ③). 상대가 필드에 없으면 임시 배우(`extras`)가 멀리서 걸어와 말을 붙이고 사라진다 |
| 수정 | [`ui/StoryCinematicPanel.ts`](../../../packages/client-pc/src/ui/StoryCinematicPanel.ts) | 스텝 `moveTo`(절대 타일 · 가로→세로) · `faceTo` · `fade` · `remove` · `give`(책/상자/봉투 아이콘) · `say.bubble`(말풍선 `...`). `CineActor.setWalking`·`keepPosition`. 종료 시 alpha 복구 |
| 수정 | [`data/StoryCinematics.ts`](../../../packages/client-pc/src/data/StoryCinematics.ts) | `CINE_N186_WATCH` 재작성 — 사용자 각본 그대로(무대 = 속초 동명항 경매장 동쪽 벽 592,154 · 숨는 자리 588,152 · 2의 등장 601,154) |
| 수정 | [`data/StoryNpcs.ts`](../../../packages/client-pc/src/data/StoryNpcs.ts) | `StoryFieldTrigger.actor`(사람이 서 있는 트리거)·`viaNpc`(대화창 행). N18-6 ① 수상한 사람(배우) · ② 명부 597,151 · ③ 도현수 대화 행 |
| 수정 | [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 트리거 배우 스폰·가시성 · `spawnSceneExtra`/`clearSceneExtras` · `playQuestScene`(끝 = `scene` 이벤트) · `playActionChoiceScene`(끝 = `finishActionChoice`) · `runSceneRequest` · 컷씬 중 배우 걷기 프레임 · 총회 표결 종료 = 「총회에 선다」 장면 |
| 수정 | [`scenes/field/FieldNpcSystem.ts`](../../../packages/client-pc/src/scenes/field/FieldNpcSystem.ts) | `NpcWalker.syncFromImageWalking` · `StoryNpcActor.cineWalking` — 컷씬이 NPC를 옮길 때 걷기 프레임 |
| 수정 | `BootScene.ts` · `InventoryStore.ts` · `ShopCatalog.ts` | `item_honmushi`·`item_hook_chinu` 매핑 + 구세이브 `iconTexture` 백필(이모지 제거) |
| 수정 | `i18n/en.ts` · `en_panels.ts` · `I18n.ts` | 장면 행·트리거 배우 이름·"직접 찾아가야 한다" 규칙 · `allQuestSceneLines` 합류 |
| 신설 | `public/item-icons/it_honmushi.png` · `it_hook_chinu.png` | 사용자 첨부(webp → png 변환 · 여백 크롭) |

⚖ 결정

- **클릭이 목표를 닫는 경로를 남기지 않았다.** `advanceManual`은 dev 호환으로만 남고 UI에서 부르지 않는다.
- **100편을 손으로 쓰지 않았다.** 각 편은 나레이션 층에 인물의 말·1인칭 서두가 이미 있어, 생성기가 그 글을
  배우·동선·말풍선·감정으로 무대에 올린다. 손글이 필요한 편은 `QUEST_SCENE_OVERRIDES` 한 줄로 우선한다(N18-6 ①·M1-01 ③).
- **상대가 이 지역에 없는 목표는 발주자가 입구다** — 그 사람은 임시 배우로 걸어와 만난다. "아무도 없는데 대사창만 흐르는"
  165차 폴백은 쓰지 않는다.
- 시스템이 없는 수동 종류(배 출조·농사·광질·가구·생존)는 **장면으로 이야기를 보여 주는 것까지**다. 실시스템은 그 시스템 차수에.

## 4. 구조상 위치

`S22 스토리·퀘스트 → 목표 추적(판정 층) + 컷씬 런타임(렌더 층)`.
계약 변경 = `StoryEvent`에 `scene` 추가(세이브 스키마 불변 — `obj[]`는 그대로). 데이터 변경 = 트리거 3건 좌표·형태, 각본 1편.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| N18-6 ① 목격 컷씬 | 실렌더(`v167.cjs`) — `devActivateAction` → 수상한 사람 옆 [F] | 배우 s1·s2·player 3인 · 43.7초 · 끝에 단계 0→1 · 임시 배우 0 · s1 숨김 · 플레이어 alpha 1 |
| N18-6 ③ 보고 | 도현수 대화창 `viaNpc` 행 | 행 노출 → 컷씬 → 단계 3/3 · `obj [3,3]` |
| M1-01 ③ 정옥선 고민(손글) | 정옥선 메뉴 행 → 장면 | `obj [1,1,1]` · 무발주 퀘 자동 완료(`done`) |
| N02-1 ② 새벽과 내기(생성) | 탁만수 대화 → 상대 탁새벽은 필드에 없음 | 임시 배우 `탁새벽`이 걸어와 대화 → 끝에 목표 닫힘 · 배우 0 |
| 대화 계통 행동(M3-06) | 선택지 클릭 → 단계 확인 → 장면 | **클릭 직후 0 유지** → 장면 종료 후 1 |
| ESC 건너뛰기 | M1-01 ③ 2.5초 뒤 `skipCinematic` | 목표 닫힘 · 정옥선·플레이어 alpha 1 · HUD 복귀 |
| 대화창 열기만 | N04-1 배누리 대화 열고 닫기 | `obj [2,0]` — **talk 목표가 열리지 않는다** · 장면 행 1 |
| 빌드·타입체크 | `pnpm run build` · typecheck | 3/3 · 0 오류 · pageerror 0 |

재현 절차(하네스 `scratchpad/v167.cjs`·`v167b.cjs`): 속초 진입 → `__STORY.devActivateAction('N18-6')` →
트리거 좌표 옆으로 순간이동 → `updateStoryProximity(200)` 4회 → `keydown-F` → `cinematicActive`가 풀릴 때까지 대기.

⚠ 하네스 함정(신규) — 대화창은 단락이 여럿이면 `▼`에서 멈춘다. 행이 뜰 때까지 `panel.advance()`를 반복 호출한다.
헤드리스 fps 13 · delta 16.7 고정이라 컷씬은 벽시계로 약 4배 느리다(43초 각본 = 실 3분).

## 6. 잔여 — 이번에 안 한 것

- **생성 장면의 글 품질** — 100편이 나레이션 문장을 재배치한 것이라 편마다 밀도가 다르다. 사용자가 읽고 어색한 편은
  `QUEST_SCENE_OVERRIDES`에 손글로 덮는다(키 `${questId}#${idx}`).
- **인천·부산 등 다른 지역 퀘스트는 그 지역 필드가 없어 열 수 없다** — 장면 규칙은 지역 무관이지만 입구 NPC가 속초에만 있다.
  N18-6도 무대를 속초 경매장에 임시로 두었다(인천 필드가 생기면 좌표 3건만 옮긴다).
- 배 출조·농사·광질·가구·생존 목표는 장면만 있고 **실시스템이 없다** — 각 시스템 차수에서 `manual` 해제.
- 시스템 페이지·아티팩트의 「대화로 완료」 표기 갱신(일지 라벨은 그대로 두었다 — 일지는 목표 문장을 보여 줄 뿐이다).

## 7. 위험·부작용

- **구세이브** — `obj[]` 스키마 불변. 과거에 클릭으로 닫힌 목표는 닫힌 채다. 진행 중이던 talk 목표는 이제 장면 행으로 닫아야 한다.
- 컷씬 중 `updateFieldNpcs`가 배우 걷기 프레임을 돌린다 — `cinematicActive`일 때만이며 위치는 트윈이 정본이다.
- 트리거 배우는 `keepPosition`이라 원위치 복구 대상이 아니다 — 단계가 올라 트리거가 닫히면 가시성으로 사라진다.
  dev에서 단계를 되돌리면(`devSetActionStep`) 마지막 자리(583,151 부근)에 다시 나타난다 — 검증 편의상 의도.
- `M1-11` 「총회에 선다」는 표결 패널 종료가 곧 장면 이벤트다(대화창 열기가 아니라).

## 8. 후속 반영

- [x] 워크로그 (이 파일)
- [x] `03-WORKLOG/README.md` 색인
- [x] `02-SYSTEMS/story-quests.md` §2 · §4 · §5 · §6 #23
- [x] `04-BACKLOG.md` — 166차 아이콘 잔여 해소 · 167차 잔여
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` · `docs/wiki/README.md`
- [x] 스킬 `verify-render` — 대화창 단락 advance 함정

## 9. 후속 실측 — 생성 장면 12편 실플레이 감사 (2026-09-22, 코드 변경 0)

사용자 지시 *"생성된 장면들 몇 개 실제로 돌려서 어색한 편들 골라줘"*. 속초에서 입구 NPC가 있는 35편 중 12편을
대화창 행 → 컷씬 완주로 돌리고 대사 줄마다 캡처했다(하네스 `scratchpad/v167s4.cjs` · 캡처 `167_S_<id>_<n>.png` ·
접촉지 `167_sheet_<id>.png`). 12편 전부 목표가 닫혔고 pageerror 0. **어색함은 편별 사고가 아니라 생성기 규칙 6가지**다.

| # | 규칙(`generatedScene`) | 증상 | 실측 편 |
|---|---|---|---|
| A | `myLine` = 서두 문장 → **플레이어 말풍선** | 3인칭 서술을 입으로 말한다(`부두에 강두철 조합장과 탁만수 노인이 서 있었다`·`목소리가 낮다`) | 12/12 |
| B | 발주자 첫 대사 = `progress`(「아직 …?」 재촉) | 장면 안에서 "아직 안 왔나 · 받았으면 가"라고 한다 — 그 자리에 서 있는데 | M4-11 · M6-05 · N18-1 · M3-09 · N01-2 |
| C | 비발주자 첫 대사 = `NPC_IDLE[0]` | 무관한 잡담(`할 일 없으면 얼음이나 날라`) | N19-1 |
| D | 닫는 혼잣말 = `afterKo ?? intro[idx+2]` | NPC 인용문이 내 생각으로 나온다(`그 천막, 내 거다`·`네가 잡은 건 네가 먹어라`) | M7-04 · M1-06 |
| E | 제목 = 퀘스트 지역·제호 | 속초 주차장에서 `부산 · 다리 밑` · 좌판에서 `병실` | N01-2 · M3-09 · M6-05 · M7-04 |
| F | 배우·소품 없음 | 소년·탁만수·병상이 없고, 죽간·조행록을 받는 목표에 `give`가 없다. 임시 배우는 `…`만 한다 | N02-1 · M4-11 · M3-09 · M6-05 |

**가장 어색한 순** — N19-1(탁 노인의 비밀을 정옥선 앞에서 말한다 + 무관한 대사) → M4-11(옆에 서서 "아직 속초 아닌가") →
N18-1(`목소리가 낮다`를 말풍선으로) → M6-05(병실인데 좌판·서 있는 할머니) → M3-09(포항 제목·주기 전에 "받았으면 가") →
N01-2(부산 제목·소년 없음) → N04-3(듣는 상대를 3인칭으로) → M7-04(할머니 대사가 내 생각). 비교적 자연스러운 편 = M1-06 · N03-1 · N01-1.

⚠ 하네스 함정(신규) — 순간이동 뒤 **같은 프레임에 대화창을 열면 스프라이트가 옛 자리에 남는다**
(`update()`가 `uiBlocked`에서 `updateSpriteAndShadow()` 앞에 반환). `updateSpriteAndShadow()` 직접 호출 + 700ms 대기 후 연다.
첫 실행에서 플레이어가 화면 밖에 있던 것은 이 함정이지 제품 결함이 아니다. 어촌계장 대화는 M1-11이 활성이면 총회 패널로 빠진다.

착수 조건 — 규칙 A~D는 생성기 한 곳(`data/QuestScenes.ts`)에서 고친다: 내 말은 `dlg.offer`의 플레이어 응답/선택지 문장에서,
발주자 대사는 `progress`가 아니라 `offer[1]`·완료 대사에서, 비발주자는 아크별 첫 대사, 닫는 문장은 서술문만 허용(따옴표·명령형 배제),
제목은 현재 지역명. E·F는 편별 손글(`QUEST_SCENE_OVERRIDES`).
