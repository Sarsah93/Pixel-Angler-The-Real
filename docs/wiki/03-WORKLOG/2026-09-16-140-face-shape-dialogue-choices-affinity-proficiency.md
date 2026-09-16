# 140차 — 얼굴형·머리 축소·측면 프로파일 + NPC 대화창(선택지 분기) + 우호도 + 숙련도 + 아티팩트 v4

- 날짜: 2026-09-16 · 시스템: 캐릭터 아트(S23) · 스토리·퀘스트(S22) · 진행·스킬(S21)
- 커밋: `43ea507`(A 아트) + 이번 커밋(B~F) — **사용자 명시 허가로 main 병합·푸시**

## 1. 배경

사용자 지시 원문(요약):

1. "캐릭터 얼굴이 기본형이 너무 사각형이라 귀엽지 않아. 얼굴형도 선택할 수 있게(계란형·원형·사각형). 얼굴이 너무 커.
   스타듀밸리 캐릭터 참고." / "좌·우 옆면이 너무 이상해 — 몸통 아래 다리가 뒤로 살짝 휘어 보인다."
2. "npc와 대화가 시작될 때 주변 어둡게 처리하면서 탑다운 필드에서 npc 대화창 신설. 선택지도 다양하게.
   선택에 따라 다른 스토리 전개 및 결과. 메인은 메인 스트림을 해치지 않는 선에서, 서브는 보상이 달라지도록."
3. "NPC 우호도(−1 최저, 1 최고, 0 기본)를 추가하고 보상 정도·advantage/disadvantage·서브 진행 가능 여부에 반영
   (메인에 큰 영향 없게)."
4. "일부 스킬은 배우더라도 곧바로 적용되지 않고 특정 행위로 숙련도를 채워야 효과. 숙련도 레벨에 따라 효과 크기 차등."
5. "바닐라 스켈레톤 작업 내역을 gpt image 프롬프트에 넣기 좋게 정리해 줘."
6. "아티팩트도 v4로 재개정." · "main에 commit & push."
7. 추가 질문: "초보 딱지를 떼면 퀘스트를 안 해도 낚시 등 콘텐츠를 즐길 수 있게 돼 있나?"

## 2. 원인 (아트 결함의 실측)

| 증상 | 확정 기전 | 근거 |
|---|---|---|
| 머리가 너무 크다 | 머리 10행 × **12px**인데 남성 몸통이 10px — **어깨보다 머리가 넓었다**(버섯 실루엣) | `pose()` 수치 |
| 측면 다리가 뒤로 휜다 | (a) 측면 다리 x가 13..16 **고정**인데 골반은 `13 + face` → 오른쪽 볼 때 다리가 골반보다 1px 뒤 (b) 걷기가 다리 사각형 **전체**를 ±2px 이동해 허벅지가 골반에서 떨어짐 | ASCII 덤프 |
| 측면 얼굴이 이상하다 | 정면용 2×3 눈 + 별도 눈썹 행 + 4px 미소 + 2px 코를 9px 얼굴에 그대로 — 눈이 얼굴을 삼키고 코·입이 **부리**로 읽힘 · 뒤통수에 머리카락이 없어 **대머리** | 26배 확대 캡처 |

## 3. 변경

### 신설

| 파일 | 내용 |
|---|---|
| `core/rules/Affinity.ts` | 우호도 규칙 — 클램프·5티어·보상 배율·품삯 배율·서브 발주 게이트·눈금 |
| `core/db-schema/StoryChoices.ts` | 선택지 데이터 — 톤 3종 · 서브 표준 4종(품삯/가르침/사양/청탁) · **손글 13편** · `choicesFor`·`choiceVisible`·`describeOutcomeKo`·`validateStoryChoices` |
| `.agents/CHARACTER_SPRITE_PROMPT_SPEC.md` | GPT Image 프롬프트용 스켈레톤 스펙(격자·앵커·프레임·얼굴·팔레트·레이어·복붙 초안) |

### 수정

| 파일 | 내용 |
|---|---|
| `core/art/CharacterArt.ts` | 머리 9행×10px(측면 9) · `FaceShape` 3종 + `L_headShape` 레이어(살·머리카락·모자 한꺼번에 깎기) · 다리 `limb()` 행별 기울기 · 뒤통수 `napeFill` · 측면 코 1px(눈높이)+인중 들임 · 눈 2행(눈썹 = 눈꺼풀 연장) · `charCfgKey`에 faceShape |
| `core/art/CharacterCast.ts` | 41인 `faceShape` 해시 배정 |
| `core/types/Story.ts` | `ChoiceOutcome`·`ChoiceRequires`·`QuestChoiceDef`·`QuestChoiceSet`·`AffinityTier`·`AffinityState` · `StoryQuestDef.choices?` |
| `core/types/Skills.ts` | `ProfActionKey` 17종 · `SkillProficiencyDef` · `PROF_LEVEL_XP [15,45,100,200,360]` · `PROF_EFFECT_SCALE [0,.35,.6,.85,1,1.15]` · `SkillDef.proficiency?` |
| `core/db-schema/SkillDatabase.ts` | 숙련도 지정 **22스킬** · `skillMult/skillBonus(ranks, key, prof?)` · `profGain` · `skillEffectScale` |
| `core/config/tuning.ts` | `affinity` 11키 · `proficiency.xpMult` · META 5종 |
| `client/store/StoryStore.ts` | `affinity`·`choices` 세이브 · `accept(id, choiceId)`·`complete(id, choiceId)` · 우호도 배율 · 아이템 보상 **실지급** · 서브 발주 게이트 · 품삯 배율 · host 5메서드 |
| `client/store/GameState.ts` | `skillProf`·`bonusSkillPoints` 세이브 · `addProficiency`·`grantProfXp`·`grantProfLevelUp`·`noteRiding` · 훅(랜딩·활동·응급처치) |
| `client/ui/DialoguePanel.ts` | **재작성** — 하단 대화 박스 · 딤 · 초상(실시트 ×5) · 우호도 게이지 · 선택지 행(↑↓ Enter) · 응답 화면 · 일감 뷰 |
| `client/ui/SkillTreePanel.ts` | 노드 배지 `미숙`/`숙련 n` · 상세 숙련도 줄 + 진행 바 |
| `client/scenes/RegionFieldScene.ts` | 캐스팅 → `cast` 숙련 · 자전거 → `ride` · 숙련 레벨업 토스트 · `validateStoryChoices` |
| `client/scenes/field/TrapFieldSystem.ts` · `FirstPersonFishingScene.ts` | `trap`·`chum` 숙련 훅 |
| `client/i18n/I18n.ts` | `allChoiceLines()` 사전 합류 |
| `client/scenes/CharacterCreateScene.ts` | '얼굴형' 행(얼굴 섹션) |

### 삭제

- `DialoguePanel` 구 3톤 버튼 + 하단 일감 스트립(선택지 행·일감 뷰로 흡수). `TONE_CHOICES`는 사전용으로만 잔존.

## 4. 구조상 위치

- S23 캐릭터 아트 → 렌더 층(`pose()`·레이어). 셀·앵커·몸 26행은 불변이라 **배치 레이아웃 무영향**.
  ⚠ 캐스트 해시 규칙은 그대로 — `faceShape`만 새 해시 오프셋(27)으로 추가해 기존 NPC 외형은 얼굴형 외 불변.
- S22 스토리 → 계약(`Story.ts`) + 데이터(`StoryChoices`) + 판정(`Affinity`) + 상태(`StoryStore`) + 렌더(`DialoguePanel`).
  **메인 XP 계약(§8-1)은 불변** — 우호도·선택지는 메인 XP에 곱하지 않는다(`affinityRewardMult(main,'xp') = 1`).
- S21 진행 → 계약(`Skills.ts`) + 데이터(`SkillDatabase`) + 상태(`GameState.skillProf`). 소비처는 `skillMult` 서명 그대로.

### 자유 플레이 보장 규칙 (사용자 질문 7 답 — 코드로 확인)

- 퀘스트는 전부 NPC에게 말을 걸어 수락하는 **선택 사항**. 자동 시작은 M1-01·M7-08만이고 스스로 닫힌다.
- `unlocks: ['region:*']` 플래그는 **어느 클라이언트 코드도 읽지 않는다** → 지역·낚시·손질·제작·채집·통발·일감은 스토리 무관.
- 스토리가 자유 플레이에 개입하는 유일한 지점 = M1-06 완료 후 낚싯대 어획물 판매 금지(135차 사용자 결정).
- 우호도·선택지는 **서브 발주·보상·품삯에만** 걸린다(`Affinity.ts` 헤더에 명문화).

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 아트 | `render_char_preview.mjs` + 측면 14배·머리 26배 확대 | 머리 폭 10 ≤ 몸통 10 · 측면 다리 골반 아래 정렬 · 걷기 발끝만 이동 · 코 1px · 뒤통수 채움 |
| 얼굴형 | 3종 × 남녀 × 정면/측면 렌더 | 턱선에서 구별됨(계란 1→2 / 둥근 0→1 / 사각 0→0) |
| 생성 씬 | Playwright 13행 · 얼굴형 ←→ 순환 | `oval → round → square → oval` · pageerror 0 |
| 선택지 DB | `validateStoryChoices()` · `validateStoryQuests()` | 둘 다 0건 · 186퀘 전부 ≥ 2갈래 · 손글 13편 |
| 대화 흐름 | Playwright: M1-02 톤 `tone_honest` → 완료 `give_back` | 우호도 0 → 0.03 → 0.15(선택 +0.08 + 메인 완료 +0.04) · 재화 50,000 → **70,090**(30,000 × 1.003 − 10,000) · 항구 신뢰 +2 · `chosen` 기록 |
| 일감 배율 | 일감 뷰 | 12,000 × (1 + 0.15 × 0.15) = **12,270원** |
| 숙련도 | `learnSkill('fish_cast')` → 캐스팅 20회 | 배운 직후 ×**1.000**(효과 0) → Lv1 ×**1.021**(0.06 × 0.35) · 레벨업 통지 1건 |
| 빌드 | `pnpm run build` · typecheck | 3/3 · 0 오류 |
| 아티팩트 | 같은 URL 재발행(v4) | 186 · 68/118 · 아크 23 · XP 2,809,150 · 회귀 33 · 선택지 블록 + 신규 §branch |

## 6. 잔여

- **선택지 손글은 13편** — 나머지 173편은 표준 4종. 아크별 서사에 맞춘 손글 확장은 사용자 대사 검토 후.
- `flag: choice.*` 후속 분기 소비처는 `N18-1 ask_tip`(rival_cool) 1곳뿐 — 분기 플래그를 읽는 퀘스트 목표 조건은 차기.
- 우호도 표시는 대화창만 — 일지 '사람들' 색인에 우호도 눈금 미표시.
- 숙련도 행위 훅 미배선: `lureAction`·`jig`·`egi`·`surf`(1인칭 액션 — 어느 조작이 어떤 행위인지 확정 후)·`haggle`(상점).
- **구세이브의 기술형 스킬 22종은 숙련도 0 = 효과 0으로 되돌아간다**(설계대로) — 테스터 안내 필요.
- 대화창 초상은 실시트 'down' 프레임 ×5 — 별도 초상 아트 없음(사용자 GPT 생성 결과 대기).

## 7. 위험·부작용

- `skillMult/skillBonus` 서명에 세 번째 인자 추가 — 기존 호출(2인자)은 그대로 동작(숙련 배율 1).
- `questsForNpc` 반환에 `refusedSub` 추가 — 구 호출부(JournalPanel 등)는 구조분해로 읽어 무영향.
- `complete()`가 이제 `rewards.items`를 **실지급**한다(구: console.info 보류). 카탈로그에 없는 id는 경고 후 미지급 — 가방 3종(`inv_bag_*`)은 카탈로그 존재 여부 확인 필요.
- 캐스트 해시에 `pick(FACE_SHAPES, h, 27)` 추가 — 오프셋 27이 기존 pick과 겹치지 않음을 확인(다른 오프셋 불변).

## 8. 후속 반영

- [x] 워크로그(이 문서) · README 색인
- [x] 시스템 페이지 S21·S22·S23 갱신
- [x] 백로그 M 행
- [x] AGENTS §9 · PLAN · CLAUDE.md 요약
- [x] STORY_SPEC_v4 §13 현황표
- [x] 아티팩트 v4 재발행
