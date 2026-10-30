# 293차 — 일감 대사(인물 말투) · 집 문 식구(강해솔 ↔ 오세린) · 스토리 인물 매핑 점검 · 해루질 놀이 손맛(떼기 · 파기 · 당기기)

- 날짜: 2026-10-30
- 시스템: 스토리 · 대화 · 필드 · 해루질 · 데이터 · UI
- 갈래: 사용자 실플레이 피드백 셋(캡처 3장)

## 1. 배경

사용자 실플레이 피드백(원문):

- 「일손이 필요하지 않으세요? 선택 시, 나오는 대화 내용인데, 이 부분도 수정해줘.」
  — 캡처: 오세린이 「손이 모자랄 때 부르는 일이다. 사이가 좋으면 품삯을 더 쳐주고 …」라는 정의문을 따옴표에 담아 말한다.
- 「강해솔에게 가야하는 단계인데, 정작 고정 퀘스트 가이드(해녀의 딸)를 따라왔더니, 오세린의 집으로 보여지고 있어.
  … 전체 스토리라인들을 확인하고 수정해줘.」
- 거북손 미니게임: 「이미지가 가이드 표시(클릭해야 하는 부분을 가리면서) 보이지 않음」
  · 「바위에 붙어있는 생물이므로 뒷 배경이 바위와 바다, 하늘이 셋 다 보이는 배경」.
- 바지락: 「실질적으로 잡기가 불가능에 가까움(20번) — 닿기도 전에 도망 · 기다릴 때 모래가 차오름 · 파는 양이 너무 작음
  · 획득 기준점이 불명확」.
- 돌문어: 「부풀어질 때 클릭 시 너무 높은 강도로 텐션바가 올라감 · 뽑아내는 정도가 너무 적음」.
- 떼기 공통: 「첫 실패 뒤 두 번째 시도는 처음과 같은 사이즈거나 줄어드는 폭이 덜 줄어야 함」.

## 2. 원인

- **일감 서두** — `DialoguePanel.enterJobs`가 고정 정의문 한 줄을 따옴표에 담아 찍었다
  (R4 위반 · 290 호칭 정리 때 대본 밖 문장으로 분류되지 않았다).
- **오세린의 집** — 292차 `homes.py`가 집 문 앞 칸을 「앵커에서 가장 가까운 건물 아랫변」으로 골라,
  강해솔(539, 399)과 오세린(536, 399)이 **같은 건물**에 붙었다.
  문 앞 칸은 `nearestStandable`로 스냅돼 둘 다 (539, 399) 한 칸이 됐고, [F]는 `nearNpc`(가장 가까운 한 사람) 기준이라
  「오세린의 집 — 문 두드리기」만 떴다.
  안내 화살표 자체는 강해솔의 문(= 같은 칸)을 가리키고 있었다 — 문이 하나라 「오세린의 집」으로 읽힌 것이다.
  인천 단철호 · 하민지도 같은 꼴(321 · 324, 400).
- **떼기 가림** — 틈 · 가장자리 길 · 집게 끝을 `g`(생물 그림 **아래** 층)에 그리고 타원을 고정 74×54로 잡아,
  거북손처럼 키 큰 판 그림(110px)이 아래 반원을 덮었다.
- **파기** — `digRate` 0.065/s(맨손) · 소란 0.3/s · 쉴 때 구멍 메워짐 0.035/s · 녀석 물러섬 1.1배 · 시작 깊이 0.26~0.42 · 제한 13초.
  이기는 조건이 「구멍 깊이 ≥ 녀석 깊이」였고 도구 그림은 판 아래 60px에서 멈춰 「닿기 전에 달아남」으로 보였다.
- **당기기** — 부풀리는 예고 0.38초(반응 시간보다 짧다) · 버틸 때 긴장 오르는 세기 +2.0/s(0.5 → 1.0까지 0.19초) · 끌어내는 양 0.21/s.

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`core/db-schema/DayJobs.ts`](../../../packages/core/src/db-schema/DayJobs.ts) | `DayJobDef.askKo · askEn` — 21편 「일손이 필요하진 않으세요?」의 답을 그 사람 말투로(`{player} 씨`) |
| 수정 | [`ui/DialoguePanel.ts`](../../../packages/client-pc/src/ui/DialoguePanel.ts) | `enterJobs` 서두 = 지금 줄 수 있는 첫 일감의 `askKo`(없으면 첫 일감) · 이름 · 설명 · 작업 로그를 로케일로 고른다 |
| 수정 | [`data/StoryNpcs.ts`](../../../packages/client-pc/src/data/StoryNpcs.ts) | 강해솔 집 = 부순덕 집(543, 411 · 「부순덕 · 강해솔의 집」) · 하민지 집 → (386, 375) 동쪽 아파트 |
| 수정 | [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `collectInteractOptions` ② — 같은 문(c · r)을 쓰는 집에 있는 식구마다 한 줄(「집 — 이름 부르기」 · 「집 — 들어가기 (이름)」) · 의뢰 표시도 그 사람 것 |
| 수정 | [`core/simulation/ForageMinigame.ts`](../../../packages/core/src/simulation/ForageMinigame.ts) | 떼기 `missShrink` 0.65 → 0.85 · `hardShrink` 0.35 → 0.62 · `missSpeedUp` 1.15 → 1.08. 파기 `digRate` 두 배 · 소란 0.36(맨손) · `noiseDecay` 0.7 · `retreatK` 0.9 · `refill` 0.012 · 시작 깊이 0.45~0.65 · **`reach`**(도구 끝이 닿는 길이 — 이김 = 깊이 + reach ≥ 녀석) · 제한 16초. 당기기 `tellMs` 700 · `surgeRise` 1.1 · `gain` 0.34 · `slack` 0.02 · `surgeLoss` 0.03 · 제한 22초 |
| 수정 | [`core/simulation/ForageMinigame.test.ts`](../../../packages/core/src/simulation/ForageMinigame.test.ts) | 파기 · 당기기는 「조심하면 거의 잡는다」(97% 상한 제외) — 덮치기 · 떼기 상한은 그대로 |
| 수정 | [`ui/ForageBoardArt.ts`](../../../packages/client-pc/src/ui/ForageBoardArt.ts) | 바탕 `shore`(하늘 13줄 · 바다 9줄 · 갯바위 23줄 — 수평선 · 물보라 · 따개비 · 균열) · 떼기 = `shore` |
| 수정 | [`ui/ForageGamePanel.ts`](../../../packages/client-pc/src/ui/ForageGamePanel.ts) | 그림 위 층 `gTop`(떼기 길 · 틈 · 집게 끝 · 판정 고리) · 타원을 그림 크기에서 잼 · 그림을 바위 안(세로 ≤ 116)에 맞춤 · 파기 녀석을 「닿는 선」에 · 도구 끝 = 구멍 바닥 · 파기 안내 셋째 문장 · 가이드 `_v4`(파기 · 떼기) |
| 수정 | [`i18n/en.ts`](../../../packages/client-pc/src/i18n/en.ts) · `en_panels.ts` | 「집 — 이름 부르기」 · 「들어가기 (이름)」 규칙 · 새 집 이름 둘 · 파기 안내 문장 |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) | 위키 시스템 「해루질 놀이 손맛 · 집 문 식구 · 일감 대사」(293) |

## 4. 구조상 위치

- `스토리 → 품삯 일감 → 대화 서두`(데이터 `askKo` + 렌더 `enterJobs`) · `월드 → 인물 → 집 · 문 앞 [F]`(데이터 `home` + 판정 `collectInteractOptions`).
- `해루질 → 손놀림 놀이`(판정 core `FORAGE_GAME` · 렌더 `ForageGamePanel` · 바탕 `ForageBoardArt`). 계약은 `DigState.reach` 한 필드만 늘었다.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 놀이 난이도 | core `ForageMinigame.test.ts` 봇(`RATES=1`) — 조심 · 마구 | 덮치기 0.88/0.00 · 갯강구 0.69/0.00 · 전복 0.87/0.00 · 삿갓조개 0.88/0.17 · **파기 1.00/0.00** · **당기기 1.00/0.00** · 줍기 1.00/0.07 |
| core 전체 | vitest | 459/459 |
| 인물 매핑 | scratchpad `r293_story_audit.mjs`(편 191 · 사람 276 · 자리 43 · 집 27 · 일감 21) | 문제 = 울릉 · 독도 22편(지역 미개방 — 알려진 잔여) · N04-2 모진주(자리 없음 — 장면 임시 배우로 오는 설계 · 167) 뿐. 집 · 일과 · 일감 어긋남 0 |
| 실렌더 | 하네스 `r293.cjs`(dev 5173) | **10/10** — 서귀포 문 세 개(강해솔 = 부순덕 (543, 415) · 오세린 (539, 399)) · 22시 문 앞 [F] 두 줄 · 「해녀의 딸」 안내 = 강해솔 · 오세린 일감 서두 「전단 … 한여름 씨」 · 인천 문 둘 · 거북손 바탕 shore · 틈 층 · 헛짚음 0.85 · 바지락 봇 이김 2.7초 · 돌문어 봇 이김 5.4초 · pageerror 0 |
| 스크린샷 | `r293out/*.png` 육안 | 떼기 하늘 · 바다 · 바위 + 틈이 그림 위 · 파기 손이 판 안 · 당기기 그대로 |
| 타입 | client typecheck | 0 |

## 6. 잔여

- 울릉 · 독도 22편(인물 자리 없음)은 지역이 열릴 때 함께(291 잔여 ②).
- 떼기 바탕은 물속(`underwater`)이어도 같은 `shore`다 — 얕은 물에 잠긴 바위 그림은 따로 그리지 않았다(필요하면 `bedKindFor`에서 가른다).
- 파기의 「닿는 선」은 도구 끝 그림과 1:1이 아니다(도구마다 `reach`만 다르고 그림 길이는 같다) — 느낌이 어긋나면 그림 길이도 도구별로.

## 7. 위험·부작용

- 핫픽스 수치는 봇 기준이다. 사람이 느끼는 난이도는 사용자 실플레이로 다시 본다(특히 파기 소란 문턱 0.5~0.8이 숨어 있는 점).
- 같은 문을 쓰는 집이 셋 이상이면 [F] 목록이 길어진다(지금은 둘이 최대).
- 세이브 영향 없음(놀이 상태는 저장하지 않는다 · 집 자리는 데이터).

## 8. 후속 반영

- [x] 시스템 페이지 [`night-hunting-trap.md`](../02-SYSTEMS/night-hunting-trap.md) · [`story-quests.md`](../02-SYSTEMS/story-quests.md) · [`world-field.md`](../02-SYSTEMS/world-field.md)
- [x] `04-BACKLOG.md` · `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 아티팩트 4개 — 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 **Version 37** ·
  구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 **Version 38** ·
  채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 **Version 36**(「293차 기준」 줄만) ·
  위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c **Version 91**
  (시스템 「해루질 놀이 손맛 · 집 문 식구 · 일감 대사」 · 지도 탭 그림은 그대로 — 인물 자리 데이터만 다시 덤프)
- [ ] main 빨리 감기 · 98차 배포 — 아래에 적는다
