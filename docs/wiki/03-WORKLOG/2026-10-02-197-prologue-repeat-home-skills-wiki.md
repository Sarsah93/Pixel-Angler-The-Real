# 197차 — 속초 다녀온 뒤 튜토리얼 반복 버그 · 위키 「스킬」 탭

| | |
|---|---|
| **날짜** | 2026-10-02 |
| **시스템** | `스토리` `집` `UI` `위키` |
| **트리거** | QA 버그 리포트 + 사용자 지시 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 전달(QA):

> "QA 과정에서 튜토리얼 설명이 속초갔다가 다시 집으로 복귀 시, 반복 발생하는 버그가 있다고 하네.
> 재현 검증 후 교정할 것. 그리고 아티팩트에 '스킬' 탭도 추가해줘."

## 2. 원인 — 무엇이 문제였나

재현 하네스(새 게임 → 프롤로그를 「막차 타기」까지 → 속초 도착 → 다시 홈타운 → 집 입장)로 **두 가지가 함께** 나왔다.

**① 집 안 기상 혼잣말이 다시 나온다(주 원인).**

- 로그: `[enter-house] HomeInteriorScene:mono` — 「눈을 떴다. 천장 무늬가 낯설다…」(스크린샷으로 확인).
- 기전: Phaser `Systems.start(data)`는 `if (data) settings.data = data` — **데이터 없이 `launch(key)`를 부르면 지난번 데이터를 그대로 다시 넘긴다**.
  새 게임이 `launch('HomeInteriorScene', { wake: true })`로 들어갔으므로,
  나중에 `enterHomeInterior`의 빈 `launch('HomeInteriorScene')`도 `{ wake: true }`를 받았다.
  같은 세션 안에서는 처음 집에서 나간 뒤 다시 들어갈 때마다 재현된다.

**② 홈타운에서 「속초에 왔다…」 말풍선이 다시 뜬다.**

- 로그: `[back-home] coach_buy :: 속초에 왔다...`
- 기전: `coachStage()`가 `arrive` 통과 뒤 `buy`·`sell` 단계 문구를 **지역을 가리지 않고** 냈다.
  속초 도착 직후 할 일(바늘·봉돌 사기, 오징어 팔기)이 끝나기 전에 집으로 돌아오면 속초 문구가 홈타운에서 나왔다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`scenes/HomeInteriorScene.ts`](../../../packages/client-pc/src/scenes/HomeInteriorScene.ts) `init` | `wake = data.wake && !prologueStepDone('box')` · 읽은 뒤 `sys.settings.data = {}`로 비움 |
| 수정 | [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) `enterHomeInterior` | `launch('HomeInteriorScene', { wake: false })` — 데이터를 항상 넘긴다 |
| 수정 | 같은 파일 `coachStage` | 홈타운 + `buy`/`sell` 미완 → 「속초 직판장에서 할 일이 남았다…」(`back_to_sokcho`) 한 줄만 |
| 수정 | [`scenes/SettingsScene.ts`](../../../packages/client-pc/src/scenes/SettingsScene.ts) · [`scenes/MainMenuScene.ts`](../../../packages/client-pc/src/scenes/MainMenuScene.ts) `init` | 같은 함정 2곳 — 읽은 뒤 `sys.settings.data = {}` · 메인 메뉴의 설정 열기는 `{ returnScene: 'MainMenuScene' }`를 넘긴다 |
| 수정 | [`i18n/en_home.ts`](../../../packages/client-pc/src/i18n/en_home.ts) | 위 문구 영문 |
| 수정 | [`tools/gen_wiki_images.py`](../../../tools/gen_wiki_images.py) | `SkillIconArt` 16x16 → `sk_<id>.png` 93장(manifest `sk:<id>`) |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) | `skills` 블록 — 분야 7 · 스킬 88 + 숨은 시너지 5 · 선행 · 추가 조건(레벨/자격/분야 랭크/이야기) · 숙련도 |
| 수정 | [`tools/game_wiki_template.html`](../../../tools/game_wiki_template.html) | 「스킬」 탭 버튼 + `TABS.skills` + `toSkillCard` |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- `스토리 → M1-01 프롤로그 → 집 기상 · 말풍선 코치` — **판정 층**(씬 진입 데이터·코치 단계 선택). 데이터·계약 변경 없음.
- `위키 → 전체 위키 아티팩트 → 스킬 탭` — 도구·발행본만(게임 코드 무관).

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 수정 전 재현 | 실렌더 하네스(`r197a.cjs`) | 집 재입장 시 기상 혼잣말 · 홈타운 `coach_buy` 「속초에 왔다」 — 둘 다 재현 |
| 수정 후 (`arrive`까지 진행) | 같은 하네스 | 홈타운 = `coach_back_to_sokcho` · 집 재입장 혼잣말 0 |
| 수정 후 (`sell`까지 진행) | 같은 하네스 | 집 재입장 시 새 게임용 `home_first_steps` 투어 외 반복 0 |
| 페이지 오류 | 하네스 `pageerror` | 0 |
| 같은 함정 2곳 | 하네스(`r197b.cjs`) — 설정을 `returnScene: 'RegionFieldScene'`로 연 뒤 빈 `launch` · 메인 메뉴 `gotoSlots: true` 뒤 빈 `start` | `returnScene` = `MainMenuScene` · `gotoSlots` = false(수정 전이면 각각 옛 값) |
| 위키 스킬 탭 | Playwright 1280·400px | 카드 88(+숨은 5) · 그림 깨짐 0 · 4xx 0 · pageerror 0 · 가로 스크롤 0 |

재현 절차: 새 게임 → 상자·장비·사진·저장·우물·상태창·지도 → 버스로 속초 → (구매·판매 전) 버스로 홈타운 → 집 [F].
기대: 기상 혼잣말 없음, 홈타운 말풍선은 「속초 직판장에서 할 일이 남았다」.

## 6. 잔여 — 이번에 안 한 것

- `init(data)`가 있는 씬 9개를 훑어 **데이터 없이 `launch`/`start`되는 곳**을 찾았다 — 집 외에 설정(메인 메뉴에서 열기)·
  메인 메뉴(로비가 `gotoSlots: true`로 연 뒤 다른 곳에서 빈 `start`) 2곳이 같은 함정이라 함께 고쳤다.
  나머지(필드·1인칭·도감·출처·레거시 FieldScene/FishingScene)는 늘 데이터를 넘기거나 기본값이 무해하다.
- 새 씬이 `init(data)`로 분기하면 같은 규칙을 따른다(`ui-framework.md` §6 함정에 올림).

## 7. 위험·부작용

- 하네스에서 `[hometown-1] back_to_sokcho`가 속초에 가기 **전에** 한 번 보였다 — 하네스가 `arrive`를 미리 닫는 인공물이다
  (실플레이에서는 속초 도착이 `arrive`를 닫으므로 그 전에는 「막차에 오르자」가 나온다).
- 그 밖에는 없음.

## 8. 후속 반영

- [x] 워크로그 색인(`03-WORKLOG/README.md`)
- [x] `02-SYSTEMS/ui-framework.md` §6 · `story-quests.md` §6 · `discovery-wiki.md` §4 표
- [x] AGENTS §9 · PLAN §3 · CLAUDE.md 이어받기 요약(194차 제거)
- [x] 위키 아티팩트 Version 20 · gh-pages 재배포
