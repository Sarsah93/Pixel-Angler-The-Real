# 297차 — 인물 선물 선호(대화 선택지 「드리고 싶은 게 있어요」 · 취향 44명 · 하루 한 번 · 수첩 · 칭호 「산타」 · 「박애주의자」)

| | |
|---|---|
| **날짜** | 2026-11-02 |
| **시스템** | `스토리` `대화` `인벤` `진행(칭호)` `UI` `가이드` `세이브` `도움말` |
| **트리거** | 사용자 결정(2026-11-02) — 특산 후속 남은 셋 중 「인물 선물 선호」 · 추가 아이디어 1(산타클로스 칭호) |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 481(+6) |

---

## 1. 배경 — 왜 했나

295차에 특산 후속 셋(축제 달력 · 인물 선물 선호 · 지역 텃밭 제한)을 백로그 DE로 남겼다.
사용자가 「축제 달력, 인물 선물 선호, 지역 텃밭 제한도 작업해보자」고 했고, 설계 물음 다섯에 이렇게 답했다.

- 「1. 대화선택지 선물하기」 — 선물은 가방 드래그가 아니라 **대화 선택지**로 건넨다.
- 「2. 우호도만 권하기」 — 효과는 **우호도만**(값 · 할인 · 보상 배율은 걸지 않는다).
- 「추가 아이디어 1. 모든 npc에게 npc가 매우 선호하는 선물을 한 번 씩 다 선물했을 때, 산타클로스 칭호를 주는 게 어떨까? 옵션은 너가 추천해줘.」
  → 두 단계 추천을 그대로 넣었다 — 절반이면 「산타」(드묾), 전원이면 「박애주의자」(전설). 효과는 선물 우호도 배율.
- 축제 달력(3)은 「달 단위로 넓히는 쪽 … 너가 고민해서 우선 적용」 → **298차**로, 지역 텃밭(4 · 5)은 예시 창(SVG)을 본 뒤 → **299차**로 미뤘다.

## 2. 원인 — 무엇이 문제였나

버그 수정이 아니다. 다만 설계 근거 둘은 적어 둔다.

- 우호도 체계는 −1..+1 · 단계 경계 ±0.2 · ±0.6이고, 대본의 한 번 가산 상한이 ±0.3이다(`addAffinity` 상한 · 결말 영영 상한).
  선물 한 번의 값은 그보다 작아야 대본의 무게를 넘지 않는다 — 아주 좋아함 +0.12 · 좋아함 +0.06 · 보통 +0.02 · 싫어함 −0.06.
  하루 한 번이므로 한 단계(0.2)를 넘는 데 아주 좋아하는 것으로 이틀, 보통 것으로 열흘이 든다.
- 취향 표의 열쇠는 네 가지(`item:<id>` · `species:<어종>` · `specialty:<특산 id>` · `kind:<갈래>`)다.
  특산 id를 쓰면 「그 지역에서 얻은 특산」(295차 `originRegion` 꼬리표)만 맞고, 가게에서 산 같은 물건은 맞지 않는다 — 특산을 선물로 쓰는 길이 열린다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/src/types/Gift.ts`](../../../packages/core/src/types/Gift.ts) | `GiftReaction`(love · like · neutral · dislike) · `GiftKind` 12(fish · forage · crop · processed · dish · sashimi · drink · coffee · sweet · snack · smoke · ingredient) · `GiftTag` · `GiftItemView` · `NpcGiftPrefDef` · `GiftLog` |
| 신설 | [`core/src/db-schema/NpcGiftPrefs.ts`](../../../packages/core/src/db-schema/NpcGiftPrefs.ts) | **44명 취향 표**(아주 좋아함 · 좋아함 · 싫어함 · 반응 대사 넷 한 · 영) · `giftPrefOf` · `giftHomeRegionOf`(고향 = 아크 지역 · 주 인물은 속초) · `GIFT_PREF_NPC_COUNT` |
| 신설 | [`core/src/rules/Gifts.ts`](../../../packages/core/src/rules/Gifts.ts) | `GIFT_AFFINITY`(+0.12 / +0.06 / +0.02 / −0.06) · `GIFT_DAILY_CAP` 1 · `giftReaction`(싫어함 > 아주 좋아함 > 좋아함 > 고향 특산 = 좋아함 > 보통) · `giftLine` · `giftTitleGoals`(22 · 44) · `canGiftToday` · `validateGiftPrefs` · `GIFT_REACTION_LABEL` · `GIFT_AGAIN_LINE` |
| 신설 | [`core/src/rules/Gifts297.test.ts`](../../../packages/core/src/rules/Gifts297.test.ts) | 시험 6 — 표 무결성 · 반응 차례 · 고향 특산 · 하루 한 번 · 칭호 목표 · 대사 네 벌 |
| 수정 | [`core/src/types/Titles.ts`](../../../packages/core/src/types/Titles.ts) · [`db-schema/TitleDatabase.ts`](../../../packages/core/src/db-schema/TitleDatabase.ts) | 통계 `giftLoved` · 효과 `giftWarmth`(드묾 +25% · 전설 +50% — `TitleModifiers.giftMult`) · 칭호 「산타」(`gift_bundle` · 22명 · rare) · 「박애주의자」(`santa` · 44명 · legend) — 타이틀 32종 |
| 수정 | [`core/src/index.ts`](../../../packages/core/src/index.ts) | 세 파일 export |
| 신설 | [`client/src/data/GiftTags.ts`](../../../packages/client-pc/src/data/GiftTags.ts) | 가방 물건 → 선물 갈래(`giftKindOf` — 분류 · 하위 분류 · id 표) · `isGiftable`(장비 · 이야기 물건 · 번호 붙은 개체 · 묶인 것 제외) · `giftViewOf`(태그 item · kind · species · specialty) |
| 신설 | [`client/src/ui/GiftPickerPanel.ts`](../../../packages/client-pc/src/ui/GiftPickerPanel.ts) | 「선물 고르기」 모달(depth 950 · 7열 · 3줄 보임 · 휠) · 「건네기」 · 「그만두기」 · 첫 열기 가이드 `gift` 2단계 |
| 수정 | [`client/src/ui/DialoguePanel.ts`](../../../packages/client-pc/src/ui/DialoguePanel.ts) | 메뉴 행 **「드리고 싶은 게 있어요.」**(줄 수 있는 것이 가방에 있을 때만 · 어촌계 제외 · 오늘 드렸으면 힌트 「오늘은 이미 드렸다」 → 그 사람 말) · `giveGift`(가방에서 하나 빼기 · 효과음 · 초상 막대 즉시 · 「(막걸리를 건넨다.)」 → 그 사람 말 → 처음 아주 좋아하면 힌트 쪽) |
| 수정 | [`client/src/store/StoryStore.ts`](../../../packages/client-pc/src/store/StoryStore.ts) | `gifts: Record<npcId, GiftLog>`(세이브 `story.gifts`) · `canGiftTo` · `giveGift`(반응 · 배율 · `addAffinity` · 수첩 기록 · 처음 아주 좋아함 → `custom gift:love`) · `giftNotes` · `giftLovedCount` · `devResetGiftDay` · 호스트 `giftMult` |
| 수정 | [`client/src/store/TitleStore.ts`](../../../packages/client-pc/src/store/TitleStore.ts) · [`store/GameState.ts`](../../../packages/client-pc/src/store/GameState.ts) | `custom gift:love` → `bump('giftLoved')` · 호스트 `giftMult = TitleStore.modifiers().giftMult` |
| 수정 | [`client/src/ui/JournalPanel.ts`](../../../packages/client-pc/src/ui/JournalPanel.ts) | 수첩 맨 위 「선물 취향」 — 「정옥선 씨 — 막걸리를 아주 좋아함」 한 줄씩(아주 좋아함 금색 · 싫어함 붉은색) |
| 수정 | [`client/src/data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) · [`i18n/en_gift.ts`](../../../packages/client-pc/src/i18n/en_gift.ts) · `en.ts` | 도움말 「사람과 할 일 › 선물하기」 · 영문 15줄(행 · 힌트 · 창 · 가이드 · 수첩 — 반응 대사 176은 취향 표에 한 · 영 짝으로) |
| 수정 | [`client/src/dev/DevConsolePanel.ts`](../../../packages/client-pc/src/dev/DevConsolePanel.ts) | ③-2 「선물 하루 제한 풀기 (297)」 |
| 신설 | [`docs/mockups/regional_plot_window.svg`](../../mockups/regional_plot_window.svg) | 299차 지역 텃밭 「창 관리형」 예시(사용자 의견 대기) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S22 스토리 · 퀘스트 → 대화창 선택지 → 선물` + `S21 진행 → 타이틀 → 선물 칭호 둘`.

- **계약**: `Gift.ts`(core 타입) · `TitleStatKey` · `TitleEffectKind` · `TitleModifiers.giftMult` · `StoryHost.giftMult`.
- **데이터**: `NpcGiftPrefs.ts` 44명 · `TitleDatabase` 2종 · `GiftTags.ts` id → 갈래 표 · `en_gift.ts`.
- **판정**: `rules/Gifts.ts`(반응 · 값 · 하루 한 번 · 칭호 목표) · `StoryStore.giveGift`(가산 · 기록 · 이벤트).
- **렌더**: `DialoguePanel`(행 · 건네기 쪽) · `GiftPickerPanel` · `JournalPanel` 수첩.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 표 무결성 · 반응 차례 · 고향 특산 · 하루 한 번 · 칭호 목표 · 대사 | core vitest `Gifts297.test.ts` | 6/6 · 전체 481/481 |
| 줄 것 없음 → 행 없음 · 막걸리 · 아메리카노 지급 → 행 · 힌트 없음 | 하네스 `r297.cjs` A · B(새 게임 · 정옥선) | PASS |
| 고르기 창(depth 950 · 2종 · 첫 칸 · 「건네기」 · 가이드 2단계) | C + 스크린샷 `02_picker_tour.png` | PASS |
| 「건네기」 **실클릭** → 창 닫힘 · 우호도 +0.12 · 막걸리 2 → 1 · `giftLoved` 1 · 초상 「보통 (+0.12)」 즉시 · 「(막걸리를 건넨다.)」 → 정옥선 말 → 힌트 쪽 · [계속 이야기하기 · 나가기] | D · D-2 · D-3 | PASS |
| 하루 한 번 — 힌트 「오늘은 이미 드렸다」 · 누르면 창 없이 「오늘은 이미 받았어요. 마음만으로 충분해요.」 | E · E-2 | PASS |
| dev 제한 풀기 → 아메리카노(싫어함) → −0.06(배율 없음) · 가방 0 · `giftLoved` 그대로 · 수첩 dislike | F · F-2 | PASS |
| 일지 수첩 「선물 취향」 — 「정옥선 씨 — 막걸리를 아주 좋아함」 · 「아메리카노를 싫어함」 | G + `07_journal_notes.png` | PASS |
| 세이브 — `story.gifts.okseon`(loved · learned 2) 직렬화 · 역직렬화 동일 · 오늘 제한 유지 · 슬롯 저장 | H | PASS |
| 칭호 「산타」(22 · rare) · 「박애주의자」(44 · legend) · `giftMult` 1(미획득) | I | PASS |
| 영어 — 「I have something for you.」 · 「Already gave something today」 · 거절 말 | J · J-2 + `08_en.png` | PASS |
| 어촌계(단체) 대화에는 행이 없다 | K | PASS |
| pageerror · 빌드 · 타입체크 | 하네스 · `pnpm run build` · 루트 typecheck | 0 · 3/3 · 4/4 |

하네스 16/16. 4xx는 바깥 1(KAMIS 스냅샷 — 키 대기)뿐.

재현 절차: 새 게임 → 집 밖 → dev F10 ③-2는 쓰지 않고 가게에서 막걸리를 사서 정옥선에게 말 걸기 → 「드리고 싶은 게 있어요.」 → 막걸리 「건네기」.
같은 날 다시 누르면 「오늘은 이미 받았어요」. 아메리카노를 주면 「커피는 속 쓰려서 못 마셔.」 · 우호도 −0.06.

## 6. 잔여 — 이번에 안 한 것

- **298 축제 달력** — 사용자 「달 단위로 넓히는 쪽 … 너가 고민해서 우선 적용」. 축제 달 + 절정 주(7일) 두 겹으로 잡는다(다음 차수).
- **299 지역 텃밭 제한 · 지역 텃밭 1단계** — 「창 관리로 한다면 예시 이미지 svg로 보여줘」 → `docs/mockups/regional_plot_window.svg`를 보냈다. **사용자 의견 뒤** 착수.
  울릉 나물 셋은 「재배가 가능하면 제한을 둘 필요는 없을 듯」 → 지역 잠금 없이 특산 꼬리표만.
- **산나물 「산것 캐기」** — 추천(해루질 엔진 재사용 · 7~8종 · 마을 공동산). 셋이 끝난 뒤 따로 한 차수.
- 취향 표는 **설계 추정**이다(인물 소개 · 대본에서 뽑았다) — 사용자 실플레이 뒤 표만 고치면 된다. 반응 대사는 인물마다 넷뿐(아주 좋아함 · 좋아함 · 보통 · 싫어함) — 물건별 대사는 없다.
- 선물 효과는 우호도만(사용자 결정 2). 선물로 열리는 대화 · 편지(백로그 DF ④ 편지 콘텐츠)는 두지 않았다.
- 선물 칭호는 「아주 좋아하는 것을 받은 사람 수」로 센다 — 사용자 표현 「한 번씩 다 선물했을 때」와 같다. 같은 사람에게 두 번째 아주 좋아하는 것은 세지 않는다.

## 7. 위험·부작용

- `isGiftable`이 **번호 붙은 개체**(282차 장비 · 단단한 루어)와 `bound` · 이야기 물건을 거른다 — 새 분류를 더하면 `giftKindOf`에 갈래를 넣어야 행이 뜬다(없으면 조용히 선물 불가).
- 대화창 메뉴에 행이 하나 늘었다(최대 7행 — 일감 · 물어보기 · 거래 · 이어지는 대화 · 선물 · 나가기). 행 높이는 `renderChoiceRows`가 줄 수로 나눠 잡으므로 넘치지 않는다(실측 5행).
- 우호도 가산은 `addAffinity`를 그대로 타므로 결말 영영 상한(254차)을 넘지 않는다.
- 세이브 `story.gifts`는 구세이브에 없다 — `?? {}`로 빈 표. 되돌릴 것 없음.

## 7-2. 297(2) 정정(2026-11-03 — 사용자 지시)

- 「(아주 좋아하는 것을 처음 건넸다 — 선물 칭호에 한 사람 더.)」 힌트 쪽을 뺐다(칭호 조건을 알리는 글) → 아주 좋아하는 반응이면 「(아주 좋아하는 것 같다.)」.
- 칭호 이름 「선물 보따리」 → 「산타」(선물 우호도 +25%) · 「동네 산타」 → 「박애주의자」(선물 우호도 +50% + 상점 구매가 −3% — 효과 `giftAndDiscount`). id는 그대로. 상세 [299](2026-11-03-299-wild-greens-gathering.md) §1 · §3.

## 8. 후속 반영

- [x] 시스템 페이지 `story-quests.md` §2 · §4 · §5 · `progression.md` §4 갱신
- [x] `04-BACKLOG.md` DE 갱신(선물 ✅ · 남은 둘 = 축제 · 텃밭)
- [x] `AGENTS.md` §9 요약 + 링크 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 이어받기
- [x] 위키 생성기 항목 `gifts_297` · 아티팩트 원본 셋(`docs/artifacts/*.html` — 점검 `check_artifact_page` 3/3 PASS)
- [x] 발행 — 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 **Version 42** · 구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 **Version 41**(창 51 · 칭호 32종) ·
  채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 **Version 39**(「297차 기준」 줄만) · 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c **Version 94**(시스템 「인물 선물 — 드리고 싶은 게 있어요」 · 새 그림 없음 · 파일 456)
- [ ] main 반영 · 배포 — **사용자 결정 대기**(297은 main · 배포 지시가 없었다 — 298 축제 달력과 함께 한 번에 올리는 쪽을 권한다)
