# 141차 — 퀘스트 나레이션 186편 + 메인 해금형 보상(귀속 장비·기술·상점) + 선택지 비공개 공개 + 발주 정책(once/event)

- 날짜: 2026-09-16 · 시스템: 스토리·퀘스트(S22) · 진행·스킬(S21) · 인벤·상점(S4) · 캐릭터 아트(S23 — 방향 결정만)
- 커밋: 이번 커밋 — **사용자 명시 허가로 main 병합·푸시**

## 1. 배경

사용자 지시 원문(요약):

1. "메인은 검증기가 XP·아이템·SP를 금지했는데, 사실 메인 퀘스트에서 해금 퀘스트나 레벨 구간대에 비례한 보상
   (구매 해금, 고급·귀속 장비, 재화, 숙련 스킬 해금, 장소·권한·면허 해금, 가방)을 주긴 해야 한다.
   서브와 겹치지 않는 보상 체계로 밸런스 — 서브 = 원활한 진행(찍먹), 메인 = 해금·귀속·기술."
2. "각 퀘스트의 선택지(대답) 내용이 아티팩트에 빠져 있다. '맡겨 주셔서 고맙습니다 / 끝냈습니다'는 너무 심플하고
   지루하다. 결과를 추론하거나 여지를 남기는 식으로."
3. "퀘스트 설명이 느낌·재미가 없다. '첫 품삯이 기본 재화다'는 나무위키식 정의 — '이 돈이라도 있어야
   뭐라도 할 수 있을 거라 생각된다' 식의 캐릭터 시점 나레이션으로."
4. "메인/서브를 이야기처럼. 육하원칙. 캐릭터 설정과 나레이션을 부여하고, NPC간·NPC↔유저 대화도 각자 입장에서."
5. (추가) "선택지 보상을 대화 도중에 보여 주지 말 것. 고른 뒤에 대화 내용과 엮어서 공개. 완료 시에는 받은 것을
   표시하되 다른 선택지의 보상은 `???`로 — 재도전 동기."
6. (추가) "거절하면 다시 못 받는 서브 퀘스트, 특정 레벨대·계절의 돌발성 이벤트 퀘스트도 고려."
7. (추가) 캐릭터 시안 이미지 — "이 디자인/스타일(스타듀 느낌 바닐라 스켈레톤)이 더 좋다. 여기서 조금씩 변형."

## 2. 원인 (무엇이 부족했나)

| 증상 | 확정 기전 | 근거 |
|---|---|---|
| 메인 보상이 XP뿐 | 140차 `validateStoryChoices`가 메인 **선택지**의 아이템·SP를 막았고, 고정 보상(`rewards`)도 coins·licenses·items 3종만 있어 "해금"을 표현할 스키마가 없었다 | `QuestRewards` 정의 |
| 선택지가 지루하다 | 186편 중 173편이 표준 세트(`main_dutiful`/`main_blunt`) — 라벨이 퀘스트 내용과 무관 | `STORY_CHOICE_OVERRIDES` 13건 |
| 설명이 정의문 | `descKo`는 설계 요약(무엇을 배우는 편인가)인데 플레이어 화면(대화창·일지)이 그것을 그대로 노출 | `renderOffer`·`renderQuest` |
| 아티팩트에 선택지 없음 | v4는 완료 선택지 라벨과 결과만 싣고 **응답 문장**과 발주 선택지를 빼놓았다 | `choHTML` v4 |
| 보상이 미리 보인다 | 선택지 행 우측에 `describeOutcomeKo` 미리보기 · 완료 화면에 "기본 보상: …" 줄 | `choiceRow`·`renderComplete` |

## 3. 변경

### 신설

| 파일 | 내용 |
|---|---|
| `packages/core/src/db-schema/StoryNarrative.ts` | **186편 전부** — 주인공 1인칭 서두(`intro`) · NPC 발주/진행/완료 대사 · 메인 목표 나레이션 라벨 · 에필로그 · **내용 기반 완료 선택지 2~3개**(응답 문장이 보상을 드러낸다) · once/event 퀘의 발주 선택지(거절 답 포함). 2,016줄 |
| `packages/client-pc/src/data/QuestRewardItems.ts` | 메인 귀속 장비·가방 20종(`qr_*`, `bound: true`) + 서브 가방 3종(`inv_bag_*` — 140차 미지급 경고 해소). `WikiCatalog` 4번째 소스 |

### 수정

| 파일 | 내용 |
|---|---|
| `types/Story.ts` | `QuestRewards` += `items[].bound` · `skillUnlocks` · `shopUnlocks` / `offerPolicy`(`standard`/`once`/`event`) + `event{seasons,levelBand,cooldownDays}` / `ChoiceOutcome` += `decline`·`payMult` / `QuestNarrative` 타입 |
| `types/Skills.ts` · `SkillDatabase.ts` | `SkillUnlockCond` += `{ kind: 'quest' }` · `SkillUnlockCtx.questsDone`. 7스킬에 퀘스트 해금(루어 액션 M2-05 · 지깅 M3-02 · 원투 M4-08 · 에깅 M4-09 · 경매 배짱 M2-01 · 보트 조종 M4-02 · 로드 빌딩 M3-09) |
| `StoryQuestDatabase.ts` | 메인 28편에 해금형 보상 배치(귀속 장비 20 · 기술 7 · 상점 5 · 재화 8 · 면허) · 서브 14편에 발주 정책(once 5 · event 9) · 검증기에 보상 스키마·정책 항목 추가 |
| `StoryChoices.ts` | 우선순위 **나레이션 > 정의 > 표준** · `payMult` 환산 · once/event 거절 답 보장(`DEFAULT_DECLINE`) · 메인 아이템은 **귀속만** 허용 · `hasCustomChoices` · 구 손글 13편은 나레이션으로 이관(빈 객체 유지) |
| `InventoryStore.ts` · `ShopPanel.ts` · `ItemDetailPanel.ts` | `InvItem.bound`(판매 목록 제외 · 상세 '귀속' 행) · `ShopEntry.unlockKey`(플래그 전엔 구매 목록에 없음) + 해금 품목 5종 |
| `StoryStore.ts` | `declined`·`offerCooldown` 세이브 · `status()` `'declined'` · event 시기 창(`eventWindowOpen`) · `accept` 거절 처리 · `complete` 귀속 지급·기술/상점 플래그·`lastRewardLines` · `otherChoices` · `offerNoteKo` · host `giveItem(bound)`·`itemName`·`month` |
| `GameState.ts` | `unlockCtx.questsDone` · `describeUnlock` quest 제목 · host 확장 · `itemNameOf` |
| `DialoguePanel.ts` | 발주 = 나레이션 → NPC 대사 → 정책 안내 → **힌트 없는** 선택지 / 완료 = 보상 미리보기 제거 / 응답 = NPC 응답 → 받은 것 → 이 답으로 → 고르지 않은 답 `???` → 에필로그 |
| `JournalPanel.ts` | 서두 나레이션 · 목표 나레이션 라벨 · 보상은 **완료 후에만**(전엔 종류 `???`) · 고른 답/응답 + 다른 답 `???` · 상태 `거절함` · 정책 안내 |

### 삭제

없음(구 `STORY_CHOICE_OVERRIDES`는 빈 객체로 남겨 import 호환).

## 4. 구조상 위치

`스토리·퀘스트(S22) → 보상·선택지 → 이 작업`. 층 = **데이터(나레이션·보상) + 계약(정책·귀속) + 렌더(비공개 공개)**.

- 메인 XP 계약(§8-1)은 손대지 않았다 — 해금형 보상은 `rewards`에 **추가**됐고 XP 합계는 그대로다.
- 보상 종류 분리 규칙: **메인 = 해금**(귀속 장비·가방·재화·기술·상점·지역/면허) / **서브 = 진행 보조**(품삯·가르침·SP — 선택지).
  검증기가 서브의 기술·상점 해금·귀속 장비를 거부한다.
- 귀속(`bound`)은 판매 차단만 한다 — 착용·수리·버리기는 가능. 현금화 우회를 막는 것이 목적이다.
- 캐릭터 아트: 사용자가 제시한 **스타듀 계열 바닐라 시트(32×32 · 5열×4행)** 를 기본 룩으로 확정하고 변형 방향으로 간다.
  구현(시트 임포트·페이퍼돌 앵커 재측정)은 별도 차수 — S23 §7과 프롬프트 스펙 §0에 기록.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 무결성 | `validateStoryQuests()` / `validateStoryChoices()` | 0 / 0 (메인 우호도 ±0.1 초과 5건은 데이터 수정으로 해소) |
| 나레이션 커버리지 | `STORY_QUESTS.filter(q => !STORY_NARRATIVE[q.id])` | 0건 (186/186) |
| 발주 화면 | 하네스 `vr141.mjs` — 정옥선 M1-02 | 나레이션 → NPC 대사 → 선택지 `hint: null` 4행 |
| 완료 → 응답 | 같은 하네스 — 3번째 답 | 응답 문장 · `받은 것: 경험치 +270 · 30,090원` · `이 답으로: +3,000원 · 우호도 +0.02` · 다른 답 2개 `???` · 에필로그. 플래그 `choice.m1_ask_work` true |
| 귀속 지급 | M1-03·M1-07 완료 | `qr_tackle_pouch{bound:true,bagSlots:3}` · `qr_knife_okseon.bound` · `unlock.shop.mart_pro_knife` true |
| 발주 정책 | N04-2(겨울 event, 지금 9월) / N20-1(once) 거절 | `eventWindowOpen` false + "시기 의뢰 — 겨울에만" / accept('decline') → `status 'declined'` · 세이브 `declined:['N20-1']` |
| 스킬 퀘스트 해금 | `canLearnSkill('fish_lure')` 전/후 | "메인 퀘스트 「품질관리 교육」 완료" → `completeQuest('M2-05')` 후 ok |
| 일지 | M1-02 완료 상태 렌더 | 나레이션 · 고른 답 `▸` + 응답 · 다른 답 `→ ???` |
| 레이아웃 | 대화창 스크린샷 2장 | 312px 안에 수용(행 압축 하한 22px · 본문 최장 ≈ 130px) |
| 빌드 | `npx pnpm run build` · typecheck | 3/3 · 0 오류 · pageerror 0 |
| 아티팩트 | `gen_artifact_v5.mjs` → 같은 URL 재발행(Version 5) | 나레이션 186 · 발주/완료 선택지(응답·결과·조건) · 해금 보상 표 · 정책 표 · 검색 색인 확장 |

## 6. 잔여

- **영문**: 나레이션·선택지 186편은 한국어만(`labelEn = labelKo`). 영문 사전 편입은 분량이 커 별도 차수.
- **가방 상한**: 귀속 가방 `bagSlots` 8~12는 값만 실리고 `GRID_CAPACITY_MAX`(30)에 `min`으로 걸린다 — 인벤 패널 6행 한계.
  7행 이상은 패널 재설계가 먼저(백로그).
- **`choice.*` 분기 소비처**: 이번에 플래그 ~60종이 생겼지만 읽는 곳은 N18-1 `rival_cool` 1곳뿐. 후속 퀘 조건·대사 분기에 소비.
- **event 정책의 실시간 계절**은 KST 실제 월 — 테스트 시즌 강제 옵션(dev 슬라이더) 없음.
- **캐릭터 시트 교체**(사용자 시안 채택): `CharacterArt` 절차 생성 → 외부 시트 임포트 경로 + 페이퍼돌 앵커 재측정. 착수 조건 = 사용자 최종 시트 PNG.
- 상점 해금 품목 5종은 플레이스홀더 성격(값·효과 최소) — 실장비 튜닝은 각 계통 차수.

## 7. 위험·부작용

- **구세이브**: `declined`·`offerCooldown` 없음 → 빈 값. 기존 완료 퀘의 귀속 장비는 소급 지급되지 않는다(설계).
  M2-05 등을 이미 끝낸 세이브는 `_completedQuestIds`에 있으므로 기술 해금 조건은 만족한다.
- **event 퀘는 계절 밖이면 `locked`로 보인다** — 일지가 "시기 의뢰" 안내를 붙이지만, 챕터 계약 수에는 그대로 포함된다(XP 합계 불변).
- `once` 거절은 되돌릴 수 없다 — 새 캐릭터 재도전이 의도된 경로. dev 콘솔에서 `declined` 초기화 명령은 아직 없다.
- `DialoguePanel`은 `describeOutcomeKo`를 더 이상 쓰지 않는다 — 아티팩트·일지 전용. 지우지 말 것.
- 세이브 스키마 필드 2종 추가(`StorySaveState`) — `save-migration` 규칙대로 `??` 폴백.

## 8. 후속 반영

- [x] 워크로그(이 문서) · `03-WORKLOG/README.md` 색인
- [x] `02-SYSTEMS/story-quests.md` §4·§5·§6 갱신 · `character-art.md` §7(시안 채택)
- [x] `04-BACKLOG.md` M 행 갱신 + N 행 신설
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 요약
- [x] `STORY_SPEC_v4.md` §4-1 필드 · §13 현황 · §14 잔여 · `CHARACTER_SPRITE_PROMPT_SPEC.md` §0 확정 시안
- [x] 아티팩트 v5 재발행(같은 URL)
