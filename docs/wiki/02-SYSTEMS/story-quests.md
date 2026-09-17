# S22 스토리·퀘스트 — 「조행록」 7챕터 · NPC 17아크 · 법 규칙 5조

> 상태: 🔶 **데이터·엔진·일지·대화 완비 / 계통(배 출조·구멍치기·좌판…)과 강제(법·가방) 미착수** — 134차.
> 정본 스펙: [`.agents/STORY_SPEC_v4.md`](../../.agents/STORY_SPEC_v4.md) (v3는 [원안 산문 보관본](../../.agents/STORY_SPEC_v3.md)) ·
> 플레이어 요약: [`.agents/PLAYER_SCENARIO.md`](../../.agents/PLAYER_SCENARIO.md).

---

## 1. 목적·범위

- **책임**: 메인 65퀘 + 서브 55퀘 정의와 진행(수락·목표 추적·완료·보상), 조행록 17장, 자격 사다리·D-day, 평판 2종, 법 규칙 판정, NPC 대화, 일지(J).
- **책임 아님**: 면허 DB 자체(S21) · 어획/손질/제작 등 이벤트의 **발생**(각 시스템이 `StoryStore.event`를 호출) · 상점 UI 자체(S5 — 판정 결과만 소비).

## 2. 구성

| 파일 | 역할 |
|---|---|
| `core/src/types/Story.ts` | 계약 타입 — `StoryQuestDef`·`StoryObjective(manual)`·`JournalPageDef`·`StoryArcDef`·`CatchProvenance`·`LawVerdict`·`ReputationState` |
| `core/src/rules/FisheryLaw.ts` (+`.test.ts`) | 법 규칙 5조 순수 함수 `canSell/canKeep/canUseGear/canGather/requiredLicenseFor` · 거부 시 대안 ≥ 1 |
| `core/src/db-schema/StoryChapters.ts` | 5부 7챕터 · 자격 사다리 · **§8-1 수치 계약** |
| `core/src/db-schema/StoryQuestDatabase.ts` | **186퀘**(메인 68 · 서브 118) + `validateStoryQuests()` · 137차 증설분은 `SUB_EXTRA`(선행 조건 명시) |
| `core/src/db-schema/JournalPages.ts` | 조행록 17장(어종 id 정합) + `journalCatchMatches` |
| `core/src/db-schema/StoryArcs.ts` | 메인 3인 + **19아크** NPC (137차 +N18 도현수 · N19 정옥선·탁만수) |
| `core/src/inventory/Backpack.ts` | 가방 사다리 모델(§8-3) — UI 미배선 |
| `core/src/config/tuning.ts` | `story`·`rep`·`law.enforceRodSell`·`inventory` |
| `client/src/store/StoryStore.ts` | **진행 엔진** — 상태·이벤트 매칭·완료/보상·D-day·평판·조행록·판매 판정·세이브 |
| `client/src/data/StoryNpcs.ts` · `StoryDialogue.ts` | NPC 배치(타일)·방문 장소 · Ch1 대사 `[ko,en]` |
| `client/src/ui/DialoguePanel.ts` | 발주/진행/완료 대화(3톤 선택지) |
| `client/src/ui/JournalPanel.ts` | 일지 — 조행록·자격 사다리·부/챕터/퀘 트리(윈도우드 + 휠) |
| 훅 | `GameState.addCaughtFish/addLawfulReleaseXp/addActivityXp/acquireLicense/grantXp/addCoins/sleepRecover` · `RegionFieldScene`(방문·NPC·자전거) · `TrapFieldSystem`(통발) · `HomeInteriorScene`(침대 저장) · `ShopPanel`(판매 판정) · `RegionHud`(D-day) |

## 3. 동작 구조

```
정의(core)            상태(client StoryStore)                 UI
STORY_QUESTS ──┐     quests{id: active|done, obj[]}    ┌─ JournalPanel(J)
JOURNAL_PAGES ─┼──►  pageCatch{page: n} · rep · day ───┼─ DialoguePanel([F])
STORY_ARCS ────┘     traineeDay (D-180)                └─ RegionHud D-nn
        ▲                    ▲
        │ validate           │ event({catch|release|activity|license|trap|visit|custom|talk|level|coins})
   dev 부팅 경고        GameState·씬·시스템 훅
```

- **가용 → 활성 → 완료**: `status(q)` = done / active / available(챕터 개방 ∧ prereq ∧ minLevel) / locked.
  챕터 개방 = 이전 챕터 **마지막 메인** 완료. 무발주 퀘(M1-01·M7-08)는 자동 활성·자동 완료.
- **목표 추적**: 이벤트 1종으로 활성 퀘 전체의 미완 목표와 대조. `manual` 목표는 대화 [다음 단계 진행]. `talk`는 대화 열면 자동.
  상태형 목표(레벨·재화·보유 면허)는 수락 즉시 평가 + `set` 갱신.
- **완료 보상**: XP(`grantXp`) · 재화 · 면허(`acquireLicense`) · 평판(클램프) · `journalPage` 채움 · `unlock.<key>` 플래그(`trainee` → D-day 시작).
- **조행록**: 어획 이벤트마다 17장 전부와 대조(`selfCaught` ∧ 어종 ∧ 계절 ∧ minCm) 누적. 채움 = 어획 ∧ 아크 완주.
- **날짜**: `sleepRecover`(침대) → `advanceDay`. 오프라인 정지(125차 활동 시간 규칙과 동일 원리).
- **법 판정**: `sellVerdict(item)` — `TUNING.law.enforceRodSell` 0이면 null(현행). `InvItem.catchMethod`(rod/trap 기록, 쿨러 승계 · 없으면 rod).

## 4. 세부과제 현황

| 과제 | 상태 | 차수 |
|---|---|---|
| 스펙 v3 레포 배치 + §0.5 코드 정합(어종·지역·면허·SAISO·인벤 상수) | ✅ | 134 |
| core 타입·법 규칙 5함수·테스트 T1~T7 | ✅ | 134 |
| 퀘스트 120 · 챕터 7 · 조행록 17 · 아크 17 · 무결성 검사(§8-1 계약) | ✅ | 134 |
| 스토리 자격 면허 4종(`LicenseType`) + 스킬 보너스 제외(Σ 215 불변) | ✅ | 134 |
| **대화 선택지 분기**(`StoryChoices` — 톤 3 · 서브 표준 4 · 손글 13 · 메인 제약 검증) | ✅ | 140 |
| **NPC 우호도**(`rules/Affinity.ts` — 5티어 · 서브 게이트 · 보상/품삯 배율 · 세이브 `story.affinity`) | ✅ | 140 |
| **탑다운 대화창 재작성**(하단 박스 · 딤 · 초상 · 우호도 게이지 · 선택지 키보드) | ✅ | 140 |
| 퀘 `rewards.items` 실지급(`host.giveItem` — 카탈로그 tpl) | ✅ | 140 |
| 진행 엔진 `StoryStore` + 훅 11곳 + 세이브 `story` | ✅ | 134 |
| 일지(J) 재작성 — 조행록·자격 사다리·트리 | ✅ | 134 |
| Ch1 발주 NPC 7 배치 + 대화 패널 + Ch1 16퀘 대사 | ✅ | 134 |
| HUD D-nn · 판매 창 법 판정(플래그) · 도움말 토픽 2 · 영문 사전 | ✅ | 134 |
| **법 강제 3단계**(`enforceRodSell` 0/1/**2 = M1-06 완료 후**·기본 2) | ✅ | 135 |
| **품삯 일용직 3종**(`DayJobs` — 대화 [일하기]·행동력 소모·하루 상한) | ✅ | 135 |
| **생활용품점 사이소**(저가 장비 한 벌 · 속초 POI 17곳) | ✅ | 135 |
| **가방 사다리 1단계**(간이 백팩 도면 → 인벤 25 → 30칸 · 등 슬롯) | ✅ | 135 |
| Ch1 manual 목표 → auto 배선 (M1-02·04·08·10) | ✅ | 135 |
| **위판 UI(M2-01)** — 직판장 위판 창구 · 경매 현장 · 정산 · `sell` 목표 auto | ✅ | 147 — [S6](economy-data.md) |
| **M1-11 총회 연출** — 좌석 24석 거수 표결 · 평판이 찬성률로 · 부결 없음 | ✅ | 147 |
| **M1-04 구멍치기 + 장소 게이트**(`StoryObjective.spotKind` — "방파제에서"를 실제로 강제) | ✅ | 149 — [S3](fishing-loop.md) |
| **기한 초과 벌칙**(`deadline.onMiss`) — 재화가 아니라 **평판 감점** | ✅ | 147 — 사용자 결정 |
| 가방 2~4단계(중형·대형) + 지급품 9종 + 시작 ₩312,000 | ⬜ | **148차** — 인벤 윈도우드 스크롤 선행(`GRID_CAPACITY_MAX` 30이 8/10/12를 전부 클램프) |
| 1-4 구멍치기 (조법 + M1-04 장소 게이트) | ⬜ | **149차** — 지형 판정(`breakwaterClassAt` 2/3)은 이미 있다 |
| 배 출조 8단계 · 구멍치기+사이소 · 해루질 리워크(고립 경고) · 좌판 운영 · 구술 채록 · 반복 의뢰 | ⬜ | 각 계통 차수 |
| 평판 소비처(위판 수수료·총회 표결·시험 가산) · 기한 초과 처리 | ⬜ | Ch2 착수 시 |
| Ch2+ 전용 대사 · 조행록 홈타운 액자 · NPC 전용 스프라이트 | ⬜ | 에셋/서사 후속 |
| 미등록 어종 7종(임연수어·호래기·주꾸미·청어·살오징어·망둥어·돗돔) | ⬜ | `add-species` — 등록 시 조행록 원안 복원 |

| **일지(J) 2트랙 재작성**(레일 챕터 7 + 메인 스파인 / 서브 아크 + 퀘스트 상세) | ✅ | 136 — XP는 상세 '보상'에만(사용자 지시) |
| **사람들(17아크) 색인 + 아크 상세** | ✅ | 136 — 미조우 아크는 `???` |
| **NPC 퀘스트 마커**(미니맵 + 필드 머리 위) | ✅ | 136 — 노랑 물음표 = 지금 해결 가능 / 빨강 느낌표 = 새 의뢰. 메인·서브 미구분(사용자 결정) |
| **미니맵 상점 카테고리 아이콘 8종** | ✅ | 136 — 셀 중복 제거 + 크기 단계별 표시 하한 |
| **퀘스트 증설 38편** — 메인 3(M2-11·M4-11·M6-09) + 서브 35(챕터당 5) | ✅ | 137 — 총 **186퀘** · 계약 7챕터 갱신 |
| **회귀 고리 13편** — 새 자격을 들고 옛 항구로 돌아간다 | ✅ | 137 — 챕터 무대 밖 편 20 → **33** |
| **신규 아크 N18 도현수 · N19 정옥선·탁만수** | ✅ | 137 — 라이벌 7챕터 전편 / 오십 년 심부름 6편 |
| **인물 연결**(강두철↔고만석 · 배누리 진로 · 이수연 식당) | ✅ | 137 |
| 일지 서브 트랙 **윈도우드 렌더 + 휠 스크롤** | ✅ | 137 — 12아크 15편 수용 |
| ~~신규 퀘스트 전용 대사(`StoryDialogue`)~~ → **나레이션 층 `StoryNarrative.ts` 186편**(서두·NPC 대사·완료 선택지·에필로그) | ✅ | 141 — `StoryDialogue`는 Ch1 폴백 |
| **메인 해금형 보상**(귀속 장비 20 · 기술 해금 7 · 상점 해금 5 · 재화 · 면허) — 서브와 종류 분리(검증기) | ✅ | 141 |
| **선택지 보상 비공개**(고른 뒤 응답·받은 것·다른 답 `???`) — 대화창·일지 | ✅ | 141 |
| **발주 정책** `once`(거절 = 영구 소멸) 5 · `event`(계절·레벨 구간·쿨다운) 9 | ✅ | 141 — 세이브 `declined`·`offerCooldown` |
| 서브 가방 3종(`inv_bag_*`) 실물화 + `InvItem.bound` | ✅ | 141 — `QuestRewardItems.ts` |
| **나레이션 영문 186편**(`StoryNarrativeEn.ts` 짝 파일 — intro·offer·progress·done·objectives·epilogue) | ✅ | 151 — 829/829줄 · 누락 0 |


## 4-b. 일지·대화 표현형 (150차 재작성)

- **일지(J)** — 좌 표(의뢰인·임무·지역·상태·**진행률 N% + 바**) / 우 상세(얼굴 · **자체 스크롤 나레이션** ·
  목표 바 · 보상 카드) + **이야기 탭**(붉은 점선 척추 · 체크박스 · 현재 위치 ▼).
- **노출 범위 = 진행 중 + 지금 받을 수 있는 것**(실측 기본 1 / 186). `완료한 임무 표시` · `잠긴 임무 표시`
  토글은 **둘 다 기본 꺼짐**. 잠긴 임무는 이름도 주지 않는다(`???`).
- **대화창** — 타이핑 · 위로 밀리는 로그 · 단락 끝 ▼ · 본문 20px · 표준 선택지 3종
  (`도와줄 일` / `물건 보기`(= `StoryNpcDef.shopId` 있을 때만) / `나가기`) · 얼굴 확대 초상.
- **오프닝 혼잣말** — 홈타운 첫 진입 1회(`GameState.flags['intro.monologue']`), 6단락.

## 5. 잔여·차기

- **M1-06 → M1-11 구간의 수입 설계 확인**(135차 결과) — 법 강제 기본 2에서는 M1-06을 끝내는 순간
  어획물 판매가 전면 막히고(낚싯대 영구 · 통발은 비어업인 자가소비), `reported_fishery`는 M1-11 총회에서 나온다.
  그 사이 현금은 품삯뿐이다 — 일당 상한 **73,000원**(얼음 12,000×2 + 그물 8,000×3 + 공동작업 25,000, 피로 54).
  실플레이로 체감이 팍팍하면 `TUNING.job.wageMult` 또는 `law.enforceRodSell = 0`.
- ~~통발 위판 UI(M2-01)~~ ✅147 · ~~1-11 총회 연출~~ ✅147 · ~~1-4 구멍치기 + 장소 게이트~~ ✅149.
  Ch1 계통은 이것으로 전부 실시스템이 됐다. **남은 계통은 배 출조(Ch4)·좌판(Ch5)**이고,
  그때 `spotKind: 'boat'`가 처음 소비된다(149차에 계약만 열어 뒀다).
- ~~가방 아이템 정의~~ ✅141(`QuestRewardItems.ts`) · ~~귀속 가방 8~12가 상한 30에 눌려 같은 효과~~ ✅148
  (상한 37 · 28/30/33/35/37 다섯 단계 분화 — [S5](inventory-equipment.md)).
- ~~나레이션 영문~~ ✅**151차**(`StoryNarrativeEn.ts` 186편 · 829줄). 남은 것은 **선택지 영문** —
  `complete`/`offerChoices` 510개 라벨·응답이 아직 `labelEn = labelKo` 폴백이다(분량이 나레이션과 맞먹어 별도 차수).
- `choice.*` 플래그 ~60종을 읽는 후속 조건(현재 N18-1 1곳) · 일지 '사람들'에 우호도 눈금.
- event 정책 테스트용 **계절 강제(dev)** 없음 · `once` 거절 초기화 dev 명령 없음.
- ~~`deadline.onMiss: 'cost'` 미구현~~ ✅147 — **평판 감점**으로 구현(`TUNING.story.missRepPerDay` 1/일).
  재화 벌칙(`missCostKrw`)은 배선하지 않는다: M1-06~M1-11 구간은 현금이 품삯뿐이라 회복 불가 상태가 된다.
- 도움말 '일지' 토픽 실캡처(현재 텍스트만) · `capture_help_images.cjs`에 `journal_log`·`dialogue` 추가.
- dev 콘솔(F10)에 퀘 점프/완료 명령(구세이브 고레벨 테스터용).

## 6. 함정·불변조건

### 9. 미진행 정보는 그리지 않는다 (150차 · AGENTS §4 R2)

회색 비활성으로 보여줘도 스포일러다. 목록·조행록·인물·챕터 목표 전부 **해금된 것만** 연다.
"앞으로 이런 게 있다"를 알려 주는 UI는 만들지 않는다.

### 10. 설명은 정의문이 아니라 나레이션 (150차 · R4)

`descKo`는 설계 요약이다. 화면에는 `StoryNarrative`(1인칭 서두 · NPC 대사 · 내 생각)를 쓴다.
`descKo`는 나레이션이 없을 때의 폴백으로만.

### 12. 영문 나레이션은 짝 파일에 둔다 (151차)

한국어 원고(`StoryNarrative.ts`)와 영문(`StoryNarrativeEn.ts`)은 **같은 키를 쓰는 별도 파일**이다.
한 파일에 ko/en을 섞으면 한국어 원고를 손볼 때마다 영문이 끼어들어 읽을 수 없게 된다.

- 합치는 곳은 `narrativeOf()` 하나 — `mergedNarrative()`가 캐시한다(대화창·일지가 프레임마다 부른다).
- 화면에 닿는 경로는 **i18n 사전**(`allNarrativeLines()` → `buildRuntimeDict`)이다. 원문이 곧 키라
  **UI 호출부를 한 줄도 고치지 않는다.** 새 나레이션을 쓰면 영문을 같은 키로 넣기만 하면 된다.
- 목표 라벨은 **배열 인덱스로 짝**을 맞춘다 — 한국어와 영문의 개수가 다르면 없는 쪽은 싣지 않는다.
- 커버리지는 `narrativeEnCoverage()`로 센다(총 줄 수 / 번역된 줄 수 / 누락 키).

### 11. 일지 구조를 바꾸면 i18n 키가 깨진다 (150차)

한국어 원문이 사전 키다. 라벨·문장을 고치면 `en_panels`/`en_help`의 옛 항목이 **고아**가 된다 —
같이 고치고, **dev 서버를 재시작한 뒤** EN으로 확인한다(120차 함정).



1. **`validateStoryQuests()` = §8-1 수치 계약** — 퀘 XP를 바꾸면 챕터 합계가 어긋난다. 바꾸려면 `STORY_CHAPTERS.contract`도 같이. dev 부팅 시 `console.warn`.
2. **`talk` 목표는 `manual: true`여도 대화를 열면 자동** — `StoryStore.event`가 talk만 예외 처리. 다른 manual은 [다음 단계]로만.
3. **`body`는 Phaser Container 예약 프로퍼티** — DialoguePanel에서 `bodyC`로(44차 함정 재발).
4. **헤드리스 검증에서 NPC 근접은 2.5초 대기** — rAF ≈ 2fps + delta 클램프라 150ms 스로틀 통과에 여러 프레임(하네스 함정, 게임 무관).
5. **어획 이벤트의 `month`는 실제 KST 월** — 조행록 제철 판정이 여기 걸린다. 검증은 `event()`에 month 직접 주입.
6. **스토리 자격 면허 4종은 스킬 포인트를 주지 않는다** — `SKILL_BONUS_EXCLUDED_LICENSES`. 빼면 Σ 215 등식이 깨진다.
7. **장소 조건(`spotKind`)은 라벨이 약속한 것까지만 강제한다**(149차) — M1-04의 라벨이
   "방파제에서"이므로 `breakwater`를 걸고, 구멍치기(`hole`)는 `spotKindSatisfies`가 이를
   만족하는 것으로 본다. 라벨보다 더 요구하면 계약 위반이고 **진행 중인 세이브가 막힌다**.
8. **조건만 어긋난 어획은 조용히 버리지 않는다**(149차) — `match`가 null을 돌려주기 전에
   "장소 조건만 불일치"인지 확인해 안내 문구를 낸다. 안 그러면 "낚았는데 목표가 안 찬다"가
   버그로 읽힌다.
7. **`catchMethod` 없는 어획물 = rod** — 구세이브·기타 경로 보수적 처리. 새 생성 지점은 반드시 기록(FP 2곳·통발 2곳·쿨러 이송 2곳).
8. **`QUEST_DATABASE`(레거시 16퀘) 삭제 금지** — `License.requirements.quest_completed`가 참조. 일지만 스토리 DB로 전환.
9. **일감(`DayJobs`)은 완료 시 `job:<id>` 커스텀 이벤트를 흘린다** — `custom` 목표는 `placeKey`로,
   `communityWork` 목표는 `job:coop_work`로 매칭된다(135차). 새 일감을 추가하면 `questKey`를 함께 정한다.
10. **`TUNING.law.enforceRodSell`은 3값이다** — 0/1/2. `>= 1` 같은 이진 비교로 읽지 말 것(2는 조건부).
11. **무발주 퀘는 `event()` 끝에서 자동 완료** — 새 무발주 퀘를 추가하면 목표를 채우는 이벤트가 반드시 `event()`를 타야 한다.
12. **메인 선택지 제약**(140차) — `validateStoryChoices()`가 메인의 xpMult·items·skillPoints·proficiencyLevelUp을 거부하고 우호도 ±0.1을 넘기지 못하게 한다. 메인 XP 계약(§8-1)에 우호도 배율은 곱하지 않는다.
13. **우호도는 서브 발주·보상·품삯에만** — 상점·낚시·이동 같은 자유 콘텐츠에 걸지 말 것(자유 플레이 보장 규칙 — 워크로그 140 §4).
14. **`complete()`가 아이템을 실지급한다** — 카탈로그(`buildItemWikiCatalog`)에 없는 id는 경고 후 미지급. 보상 아이템을 추가하면 카탈로그 등록이 선행.
15. **선택지 `flag`는 `choice.` 접두 필수** — 검증기가 거부. `hasFlag`로 읽는다.
16. **보상 종류는 겹치지 않는다**(141차) — 메인만 귀속 장비(`qr_*`·`bound`)·기술 해금·상점 해금을 줄 수 있고, 서브는 거부된다. 메인 선택지 아이템은 귀속만.
17. **보상은 고르기 전에 보이지 않는다** — `DialoguePanel`에 `hintKo`/`describeOutcomeKo`를 다시 붙이지 말 것. 공개 지점은 응답 화면(`lastRewardLines`·`otherChoices`)과 완료 후 일지뿐.
18. **once/event 퀘는 발주 선택지에 `decline` 답이 하나 있어야 한다** — 없으면 `choicesFor`가 표준 거절을 붙이고 검증기가 확인한다. `decline`은 발주 단계 전용.
19. **`payMult`는 데이터 전용** — `choicesFor`가 coins로 환산한다. 환산 안 된 값이 새면 검증기가 잡는다.
20. **M2-01의 `sell` 목표는 147차에 auto가 됐다** — `StoryStore.event({ kind: 'sell' })`는
    **위판에서만** 발화한다(상점 판매는 쏘지 않는다). 다른 퀘스트에 `sell` 목표를 추가하면
    위판이 그 목표도 함께 민다는 점을 감안할 것.
21. **총회는 부결되지 않는다** — `meetingVote()`는 찬성률만 평판을 따르고 가결은 보장한다.
    진행이 막히는 무작위를 만들지 않는다는 원칙(138차 §3)이라, 부결 분기를 추가하지 말 것.
22. **event 시기 창은 KST 실제 월** — 계절 밖이면 `status 'locked'`. 챕터 계약 수·XP 합계에는 그대로 포함된다.


---

## 138차 갱신 (2026-09-16)

- **186퀘 (메인 68 · 서브 118) · 23아크.** 138차에 서브 28편 + 아크 4개 증설.
- 신규 아크: **N20 유하랑**(낚시 버튜버 — 콘텐츠 제작 · 7편) · **N21 오세찬**(해양환경 감시원 — 과증식 대응 · 7편) ·
  **N22 하늬**(생활공방 — 제작/농사/광질/리빙 · 8편) · **N23 채수림**(수산질병·양식 관리사 — 어종 관리 · 6편).
- 신규 목표 종류: `cull`(과증식 수거 — 자동 추적) · `farm`·`mine`·`furnish`(시스템 도착 전까지 `manual`).
- 설계 원칙 3가지(신규 퀘스트 작성 시 준수):
  1. **기존 시스템에 의미를 얹는다** — 탈출 양식 광어는 133차 비만도를, 금어기 계측은 134차 법 규칙을 그대로 판정 근거로 쓴다.
  2. **확률 드랍 목표 금지** — 알비노는 "잡아 와라"가 아니라 조건(스팟·물때)을 맞추는 퀘스트로. 아니면 영구 미완이 된다.
  3. **`manual` 목표는 챕터당 2편까지** — 쌓이면 "대화만 하는 퀘스트"가 되어 체감이 빈다.
- 누적 XP 2,415,600 → **2,809,150**(+16%). 기존 퀘스트 보상은 **한 건도 줄이지 않았다**.
- ⚠ 챕터 계약(`StoryChapters.contract`)은 손으로 세지 말고 스크립트로 재산출할 것 — 28편을 넣으면 7챕터가 전부 바뀐다.
