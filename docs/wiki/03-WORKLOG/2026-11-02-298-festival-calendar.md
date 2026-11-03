# 298차 — 지역 축제 달력(축제 달 + 절정 주 — 특산 값 · 축제 매대 · 북적임 · 축제 일손 · 라디오 · 알림 · 일지 「나날」 · 도감 특산 카드)

| | |
|---|---|
| **날짜** | 2026-11-02 |
| **시스템** | `경제(특산)` `필드(행인)` `스토리(일감)` `UI(일지 · 도감 · 라디오 · 알림)` `도움말` `dev` |
| **트리거** | 사용자 결정(2026-11-02) — 특산 후속 남은 셋 중 「축제 달력」: 「달 단위로 넓히는 게 좋을 듯? 이건 너가 고민해서 우선 적용해줘봐」 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 487(+6) |

---

## 1. 배경 — 왜 했나

295차에 남긴 특산 후속 셋 중 둘째. 사용자 물음 3(축제 기간)에 「달 단위로 넓히는 쪽」을 고르고 설계를 맡겼다.

게임 시계가 실시간(KST)이라 「그 주말에만」은 접속 못 하는 사람에게 닫힌 문이다(R12와 같은 이유).
그래서 **두 겹**으로 잡았다 — 축제 **달** 내내 가벼운 효과, 실제 축제가 열리는 **절정 주**(해마다 같은 날짜 범위로 어림)에 센 효과.

## 2. 원인 — 설계 근거(버그 아님)

- 실제 축제 날짜는 2026-11-02 웹 조사(표준 검색 11건)에서 왔다. 해마다 며칠씩 움직이므로 절정은 **고정 날짜 범위**로 어림했다.

| 축제 | 조사한 해의 날짜 | 게임 절정 |
|---|---|---|
| 속초 양미리·도루묵 축제(속초항) | 2025 11/7~16 | 11/7~16 |
| 부산 자갈치축제 | 2025 10/23~26 · 2026 10/15~18 | 10/17~26 |
| 포항 구룡포 과메기 축제(아라광장) | 2025 11/15~16 · 2024 11/16~17 | 11/13~19 |
| 거제 대구수산물축제(외포항) | 2024 12/21~22 · 2023 12/16~ | 12/15~23 |
| 모슬포 방어축제 | 2025 11/20~23 · 2026 11/19 개막 | 11/19~23 |
| 울릉도 오징어축제(저동항) | 2025 8/4~6 | 8/3~9 |
| 안면도 백사장 대하축제 | 2025 9/20~27 | 9/20~27 |
| 소래포구축제 | 2025 9/26~28 | 9/25~28 |
| 여수 섬슐랭 페스타 | 2025 11/1 | 11/1~3 |

- 울산(정자 가자미) · 울릉 산나물 · 독도는 확인된 축제가 없어 넣지 않았다. 기장 멸치축제(4월)는 멸치가 특산 표에 없어 뺐다.
- 값은 **그 고장에서 얻은 특산을 그 고장 가게에서 팔 때만**(축제 지역 = 판매 지역). 산지 밖 택배 차익(295 · 1.15)과 겹치지 않고, 위판에는 붙지 않는다.
  배율은 제철 배율에 곱한다 — 도루묵(속초 ×1.3 · 11월 제철)을 속초 가게에 절정 주에 팔면 1.3 × 1.3 = 1.69.
- 속초 낮 행인은 땅 상한(1,500칸당 1 = 120)과 기본 120이 같아 ×2가 보이지 않았다 → 절정 주에는 **땅 상한도 두 배**(실측 120 → 240).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/src/db-schema/Festivals.ts`](../../../packages/core/src/db-schema/Festivals.ts) | `FESTIVALS` 9 · 배율 상수(달 1.1 · 절정 1.3 · 행인 2 · 일손 품삯 1.3 · 매대 할인 0.2/0.3) · `festivalPhase` · `inFestivalPeak` · `festivalSellMult` · **`specialtySellMultAt`**(제철 × 택배 × 축제) · `daysUntilFestivalPeak` · `upcomingFestivals` · `festivalPeriodLabel` · `validateFestivals` |
| 신설 | [`core/src/rules/Festivals298.test.ts`](../../../packages/core/src/rules/Festivals298.test.ts) | 시험 6 — 표 · 단계(끝 날 포함 · KST) · 값 · 일손 · 일지 순서 · 기간 글 |
| 수정 | [`core/src/db-schema/DayJobs.ts`](../../../packages/core/src/db-schema/DayJobs.ts) | `festivalId` · **축제 일손 9편**(정옥선 구이 좌판 · 채수림 수조 점검 · 한봄 시식 부스 · 채금자 대구 하역 · 유리아 무대 보조 · 오세라 물품 나르기 · 마감기 매대 글씨 · 단철호 부스 · 오가윤 안내) · `dayJobsOfNpc(npc, region, now)` · `jobOpenAt` · `jobWageMultAt` |
| 수정 | [`core/src/index.ts`](../../../packages/core/src/index.ts) | 축제 export |
| 신설 | [`client/src/data/FestivalClock.ts`](../../../packages/client-pc/src/data/FestivalClock.ts) | `festivalNow()`(실시간 · dev 옮긴 날) · `devSetFestivalDate` · `__FEST` |
| 수정 | [`client/src/store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | 판매가 세 자리(농산물 · 가공품 · 어획물) → `specialtySellMultAt(…, festivalNow())` |
| 수정 | [`client/src/data/RegionStall.ts`](../../../packages/client-pc/src/data/RegionStall.ts) | 직판장 축제 매대 — 그 축제 가공품 축제 달 20% · 절정 30% 싸게 · desc 「축제 매대 — …」 |
| 수정 | [`client/src/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 행인 수 × 절정 2 · 축제 달 1.25(땅 상한도 같이) |
| 수정 | [`client/src/store/StoryStore.ts`](../../../packages/client-pc/src/store/StoryStore.ts) | `jobsOfNpc`가 `festivalNow()`로 축제 일손을 거르고 `jobWage`에 절정 ×1.3 |
| 수정 | [`client/src/data/RadioBroadcast.ts`](../../../packages/client-pc/src/data/RadioBroadcast.ts) | 열린 바다의 축제 — 「한창입니다」 · 「이달 … 열립니다」 한 · 영 |
| 수정 | [`client/src/ui/MillNotifier.ts`](../../../packages/client-pc/src/ui/MillNotifier.ts) | `festivalNoticesDue`(열린 지역 · 절정 · 플래그 `fest.<id>.<해>`) → 채널 「[축제]」 · 손목시계 알람(해마다 한 번) |
| 수정 | [`client/src/ui/JournalPanel.ts`](../../../packages/client-pc/src/ui/JournalPanel.ts) | 「나날」 앞으로 칸 — 열린 지역 축제 넷(진행 중 → 축제 달 → 가까운 순 · 「지금 한창」 · 「축제 달 · N일 뒤 절정」 · 「축제 달 · 절정 지남」 · 「N일 뒤」) |
| 수정 | [`client/src/scenes/AnglerLogScene.ts`](../../../packages/client-pc/src/scenes/AnglerLogScene.ts) | 특산 카드 값 줄에 축제 이름 · 기간(표에 축제가 있으면 그것 · 없으면 294 `festivalKo`) |
| 수정 | [`client/src/data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) · [`i18n/en_fest.ts`](../../../packages/client-pc/src/i18n/en_fest.ts) · `en.ts` | 도움말 「사람과 할 일 › 지역 축제」 · 영문(기간 글 규칙 · 일지 오른쪽 글 · 매대 · 알림) |
| 수정 | [`client/src/dev/DevConsolePanel.ts`](../../../packages/client-pc/src/dev/DevConsolePanel.ts) | 「축제 시계 (298)」 고르기 — 축제마다 절정 첫날 · 축제 달 하루로 옮김(세이브 안 됨) |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) · `game_wiki_template.html` | 시스템 항목 `festivals_298` · 출조 지역 카드 「축제」 표 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S19 경제 → 지역 특산 → 축제 달력` + `S10 필드 → 마을 사람 → 축제 북적임` + `S22 스토리 → 일감 → 축제 일손`.

- **계약**: `FestivalDef` · `DayJobDef.festivalId` · `dayJobsOfNpc(…, now)`.
- **데이터**: `FESTIVALS` 9 · 축제 일손 9 · 영문.
- **판정**: `festivalPhase`(KST 날짜 · 끝 날 포함) · `specialtySellMultAt`(판매가 사슬의 단일 입구) · `jobOpenAt` · `jobWageMultAt` · `festivalNoticesDue`.
- **렌더**: 일지 「나날」 · 도감 특산 카드 · 라디오 원고 · 채널 · 시계 알람 · 직판장 매대 desc · dev 콘솔.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 표 9 · 지역 · 특산 id · 단계(11/16 23시 peak · 11/17 0시 month · 10/31 23시 none) · 값 · 일손 · 일지 순서 · 기간 글 | core vitest `Festivals298.test.ts` | 6/6 · 전체 487/487 |
| 축제 시계 — 실시간(null) → `2026-11-10`(KST 정오 = `03:00Z`) | 하네스 `r298.cjs` A | PASS |
| 과메기(구룡포 특산 · 11월 제철) 구룡포 가게 — 절정 = 제철 × 1.3(배율 1.69 · 4,060원) · 축제 달 × 1.1(1.43 · 3,430원) · 속초 가게는 날짜 무관(3,590원) | B | PASS |
| 직판장 축제 매대 — 과메기 절정 2,500(30% 싸게) · 달 2,900(20%) · 밖 3,600 · desc 「축제 매대 — 포항 구룡포 과메기 축제(11월 13일 ~ 19일) · 30% 싸게 · 구룡포 과메기」 | C | PASS |
| 정옥선 축제 일손 — 11월에만(1 → 2건) · 절정 품삯 20,800 = 16,000 × 1.3 | D | PASS |
| 라디오 — 11/10 축제 줄 4(속초 한창 · 포항 · 모슬포 · 여수 이달) · 5/1 0 · 영어 | E | PASS |
| 절정 첫 알림 — 1장(속초만) 1건 → 필드 펌프(5초)가 채널 「[축제]」 · 플래그 → 0건 | F + `01_notice.png` | PASS |
| 일지 「나날」 — 「속초 양미리·도루묵 축제 / 속초항 항만부지 · 11월 7일 ~ 16일 / 지금 한창」 · dev 모든 지역 열기 → 넷(한창 → 3일 뒤 절정 → 9일 뒤 → 지남) | G · G-2 + `03_journal_days_all.png` | PASS |
| 영어 — Nov 7–16 · Dec 15–23 · in 12 days · Festival month · peak in 12 days · On now · Local festivals | H | PASS |
| 도움말 · 특산 카드 줄 「속초 양미리·도루묵 축제 11월 7일 ~ 16일」 · `validateFestivals` 0 | I | PASS |
| 속초 행인 — 5/1 120명 · 11/10 240명(땅 상한 ×2) | J + `04_sokcho_peak.png` | PASS |
| pageerror · 빌드 · 타입체크 | 하네스 · `pnpm run build` · 루트 typecheck | 0 · 3/3 · 4/4 |

하네스 11/11. 재현: dev F10 「축제 시계」에서 「속초 양미리·도루묵 축제 절정」을 고르고 필드로 — 5초 안에 채널 「[축제]」 · 손목시계가 있으면 알람. 일지(J) 「나날」 · 라디오 · 정옥선 「일손이 필요하진 않으세요?」.

## 6. 잔여 — 이번에 안 한 것

- 울산 · 울릉 산나물 · 독도 축제 없음(확인된 축제가 없다). 기장 멸치는 특산 표에 멸치가 없어 뺐다 — 멸치를 특산에 넣을 때 같이.
- 절정 날짜는 고정 어림이다 — 해마다 실제 날짜로 갱신하는 길(원격 스냅샷)은 두지 않았다(실측 일정이 매년 다르다).
- 축제 **콘텐츠**(맨손잡기 놀이 · 축제 편지 · 축제 전용 퀘스트)는 없다 — 백로그 DF ④(편지)와 함께.
- 채널 「[축제]」 알림 글의 영문은 규칙으로 번역하지만 축제 이름 · 자리는 `tr`가 사전에 없으면 한국어로 남는다(이름 사전 미등록 — 라디오 · 일지는 `nameEn` 직접).
- 299 지역 텃밭 제한 · 1단계는 예시 창(`docs/mockups/regional_plot_window.svg`) **사용자 의견 뒤**.

## 7. 위험·부작용

- 판매가 사슬 세 곳이 `specialtySellMultAt`로 바뀌었다 — 특산이 아닌 물건은 그대로 1(시험 B · core 시험). 위판(`sellRegion` 없음)에는 축제가 안 붙는다.
- 행인 수가 절정 주 두 배라 큰 지역(부산 감천 1.17M 타일)에서 성능을 볼 것 — 땅 상한은 그대로 비례(1,500칸당 2명).
- `festivalNow()`를 안 거친 `new Date()` 축제 판정을 새로 쓰면 dev 시계와 어긋난다 — 축제를 보는 코드는 전부 `festivalNow()`.
- 알림 플래그는 세이브 `flags`에 남는다(`fest.<id>.<해>`) — 해가 바뀌면 다시 알린다.

## 8. 후속 반영

- [x] 시스템 페이지 `economy-data.md` §4 · §5 · `world-field.md` §4 · `story-quests.md` §4
- [x] `04-BACKLOG.md` DE(축제 ✅ · 남은 것 = 지역 텃밭)
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 위키 생성기 `festivals_298` · 지역 카드 「축제」 · 아티팩트 셋(「298차 기준」 · 항목)
- [x] 발행 — 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 **Version 43** · 구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 **Version 42** ·
  채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 **Version 40**(「298차 기준」 줄만) · 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c **Version 95**(시스템 「지역 축제 달력」 · 출조 지역 카드 「축제」 표 · 새 그림 없음 · 파일 456)
- [x] main 반영 · 배포 — 2026-11-03 사용자 지시로 297 · 299와 한 번에 —
  main `b461a07` · **100차 배포(gh-pages `0a98430` · 실행 29 · main `b461a07` · 정적 2,157 · 소스맵 0 · 기동 9.6초 · 4xx 0(바깥 1 = KAMIS) · pageerror 0)**
  (상세 [299차 §8](2026-11-03-299-wild-greens-gathering.md))
