# 203차 — 타이틀(숨은 업적) 12종 · 달성 배너 · S 창 타이틀 칸 · 머리 위 표시

| | |
|---|---|
| **날짜** | 2026-10-03 |
| **시스템** | `진행` `UI` `멀티` `낚시` `경제` |
| **트리거** | 사용자 지시(202차 백로그 AR 확정) |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

202차에 사용자가 제안한 히든 타이틀 업적의 설계안(배너 · S 창 · 2줄 이름표 · 멀티 id 동기화)을 보고했고, 확정 답이 왔다.

사용자 원문:

> "추천대로 구현해줘. 혼자일때도 띄우자. 레어도에 따라, 소소한 효과 추가. 전부 히든으로 해.
> 그래야 위키에서 찾아보고 달성하려 노력할듯. 우선 12개로 시작. 추가 여부는 나중에 고찰 더 필요할 듯."

- 혼자일 때도 머리 위에 띄운다.
- 레어도(흔함 · 드묾 · 전설)에 따라 효과 크기를 달리한다(소소하게).
- 전부 히든 — 얻기 전에는 이름도 조건도 안 보인다.
- 12종으로 시작하고, 더 넣을지는 나중에 정한다.

## 2. 원인 — 무엇이 문제였나

기능 추가. 행동 누적을 세는 곳이 없었다(방생 · 줄 터짐 · 들어뽕 등은 그 순간 처리만 하고 사라졌다).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/types/Titles.ts`](../../../packages/core/src/types/Titles.ts) | `TitleRarity` · `TitleStatKey` 12 · `TitleEffectKind` 8 · `TitleDef` · `TitleStats` · `TitleModifiers` |
| 신설 | [`core/db-schema/TitleDatabase.ts`](../../../packages/core/src/db-schema/TitleDatabase.ts) | 12종(아래 표) · `TITLE_EFFECT_SCALE` · `titleModifiers` · 밤/새벽 판정 · `titlesNewlyEarned` |
| 신설 | [`client/store/TitleStore.ts`](../../../packages/client-pc/src/store/TitleStore.ts) | 누적 수 · 가게별 거래 수 · 얻은 것 · 단 것 · 출조(trip) · 알림 대기열 · 세이브 · dev `__TITLE` |
| 신설 | [`client/ui/TitleBanner.ts`](../../../packages/client-pc/src/ui/TitleBanner.ts) | 달성 배너(금테 · 절차 메달 · 레어도 리본 · 징글 · 사연 · 효과 · 지역 채널 한 줄) · `pumpTitleBanners` |
| 수정 | `GameState` | 세이브 `titles` · 새 게임 리셋 · `applyVitalsAction` 피로 배율 |
| 수정 | `StoryStore.event` | 첫 줄에서 `TitleStore.onStoryEvent` — 밤 어획 · 60cm↑ · 출조 어획 · 금지체장 자동 방생 |
| 수정 | `FirstPersonFishingScene` | 놓아주기(결정 창 · 정리 창) · 들어뽕(+`landingDropMult`) · 줄 터짐 2곳 · 입질 배율 · 줄 강도 2곳 · 배너 펌프 |
| 수정 | `CoolerPanel` | 놓아주기(한 마리 · 여러 마리) |
| 수정 | `RegionFieldScene` | 캐스팅 2곳(`recordCast`) · 문 닫은 가게 · 거래 3곳(`recordTrade`) · 구매가 · 판매가 · `enterRegion` · 머리 위 타이틀 · 피어 타이틀 · 프로필 `title` · 배너 펌프 |
| 수정 | `HomeInteriorScene` · `UtilizationPanel` · `WorldMapScene` | 고양이(3초 가드) · 별 다섯 사시미 · 월드맵 = 출조 끝 |
| 수정 | [`StatusPanel`](../../../packages/client-pc/src/ui/StatusPanel.ts) | 폭 400 → 700 · 오른쪽 타이틀 칸 · 가이드 `status_titles` 3단계 |
| 수정 | `PeerInfoPanel` · core `MpProfile.title` | 정보 보기 = 이름 · 레어도(효과·얻는 법은 비공개) |
| 수정 | `audio/Sfx.ts` | `playTitleJingle`(레어도별 3~5음) |
| 수정 | `I18n` · `en.ts` · `en_help.ts` · `HelpContent` | 이름·사연은 데이터(`nameEn`/`storyEn`) · 효과 8규칙 · 배너/채널 규칙 · F1 「타이틀 (숨은 업적)」 |

**12종** (효과 크기 = 흔함 1% · 드묾 2% · 전설 3% / 바늘 빠짐 10·20·30% / 피로 3·6·9%):

| 타이틀 | 레어도 | 세는 것 ≥ 목표 | 효과 |
|---|---|---|---|
| 구원자 | 드묾 | 놓아준 고기 100 | 입질 +2% |
| 밤바다 사람 | 드묾 | 밤(22~04시) 어획 50 | 밤 입질 +2% |
| 새벽 첫 줄 | 흔함 | 새벽(04~06시) 캐스팅 30 | 새벽(04~08시) 입질 +1% |
| 대물 사냥꾼 | 전설 | 60cm↑ 어획 10 | 줄 강도 +3% |
| 들어뽕의 아픔 | 흔함 | 랜딩 바늘 빠짐 10 | 바늘 빠짐 −10% |
| 줄 끊는 사람 | 흔함 | 줄 터짐 20 | 줄 강도 +1% |
| 빈 쿨러 | 흔함 | 빈손 출조 10 | 구매가 −1% |
| 단골 | 드묾 | 한 가게 거래 100 | 구매가 −2% |
| 회칼 장인 | 드묾 | 별 다섯 사시미 10 | 판매가 +2% |
| 고양이 집사 | 흔함 | 고양이 쓰다듬기 100 | 입질 +1% |
| 올빼미 | 흔함 | 문 닫은 가게 앞 10 | 행동 피로 −3% |
| 바다 도감 | 전설 | 도감 생물(어종 + 채집) 20 | 판매가 +3% |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- `진행 → 타이틀` — **계약·데이터는 core**(순수 판정), **상태·훅은 client `TitleStore`**, 렌더는 배너 · S 창 · 이름표.
- 효과는 **배율 하나**(`TitleModifiers`)로 기존 계산식 끝에 곱한다 — 안 달면 전부 1이라 기존 수치 불변.
- 「빈 쿨러」의 출조 = 낚시 지역 진입(`enterRegion`) ~ 집 동네/월드맵. 같은 지역 맵 재시작은 같은 출조.
- 멀티는 **id만** 보낸다 — 받는 쪽이 자기 언어로 이름을 찾는다. 서버는 프로필을 통째 중계하므로 무수정.

## 5. 검증 — 무엇으로 확인했나

하네스 `scratchpad/r203a.cjs`(ko · en) · `r203b.cjs`(겹침 감사).

| 대상 | 방법 | 결과 |
|---|---|---|
| 획득 문턱 | `__TITLE.bump('release', 99)` → +1 | 99 = 없음 · 100 = 「구원자」 얻음 + 자동 장착 · 입질 배율 1.02 |
| 배너 | 필드 화면 위 가운데 | 420,52 · 440폭 · 머리 「숨은 업적 달성 · 드묾」 · 사연 · 「입질 +2%」 · 채널 「[업적] …」 |
| 대기열 | 전설 추가 → 배너 클릭 | 다음 배너 「대물 사냥꾼 · 전설」 |
| 머리 위 | `selfTitleText` | 「구원자」 #7fe0ff · 아래 끝 4057 < 스프라이트 위 4063(6px 띄움) |
| S 창 | 열기 · 줄 클릭 | 가이드 `status` 다음 `status_titles` · `auditBottom` 0 · 두 번째 줄 클릭 → 「대물 사냥꾼」 장착 · 줄 강도 1.03 |
| 효과 | `sellPriceOf` · `applyVitalsAction('cast')` | 판매가 6000 → 6120(+2%) · 피로 0.4 → 0.388(−3%) |
| 빈 쿨러 | `recordCast` → `enterRegion(null)` | 0 → 1 |
| 세이브 | `buildSaveData().titles` → reset → deserialize | 얻은 4종 · 장착 · release 100 그대로 · 알림 재발생 없음 |
| 1인칭 | 필드 배너가 뜬 채 낚시 진입 → `lineBreak` 20 | **수정 전 미표시** → 수정 후 「줄 끊는 사람」 배너(§7) |
| EN | `en` 실행 | 「Hidden achievement unlocked · Rare」 · "Savior" · 사연 · S 창 Titles/Remove/Titles earned |
| 겹침 | `tools/ui_overlap_audit.js`(배너 표시 중) | 11개 · 부분 겹침 0 |
| 오류·빌드 | 하네스 · 빌드 · typecheck | pageerror 0 · `[TextOverflow]` 0 · 3/3 · 0 오류 |

## 6. 잔여 — 이번에 안 한 것

- **타이틀 추가(13종~)** — 사용자: "추가 여부는 나중에 고찰". 백로그 AS.
- **목표 수치 튜닝** — 실플레이 속도를 보고 조정(목표만 바꾸면 되고 얻은 것은 지켜진다).
- **집 안(HomeInteriorScene) 머리 위 타이틀** — 필드에만 붙였다. 집은 혼자 있는 방이라 우선순위 낮음.
- 위키(아티팩트)에 타이틀 항목 — 사용자 의도("위키에서 찾아보고")대로 공략 정보는 위키 몫. 다음 위키 재생성 때 넣는다.

## 7. 위험·부작용

- **일시정지된 씬의 배너가 이후 배너를 전부 막았다**(검증 중 발견 · 수정) — 필드 배너가 떠 있는 채 1인칭으로 가면
  필드 트윈이 멈춰 배너가 영영 안 닫혔다. `pumpTitleBanners`가 멈춘 씬의 배너를 걷어 낸다.
- S 창 폭이 700이 되어 화면 왼쪽 절반을 덮는다(끌어 옮길 수 있는 팝업이라 규칙상 허용).
- 효과는 최대 3%라 밸런스 영향은 작다. 「단골」은 가게(판매처 키)마다 세므로 한 가게에 몰아야 한다(의도).

## 8. 후속 반영

- [x] `progression.md` §4 · §6 / `ui-framework.md` §4 · §6 / `multiplayer.md` §4
- [x] `04-BACKLOG.md` AR 해소 · AS 신설
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 요약
