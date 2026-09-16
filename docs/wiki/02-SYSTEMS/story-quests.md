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
| 진행 엔진 `StoryStore` + 훅 11곳 + 세이브 `story` | ✅ | 134 |
| 일지(J) 재작성 — 조행록·자격 사다리·트리 | ✅ | 134 |
| Ch1 발주 NPC 7 배치 + 대화 패널 + Ch1 16퀘 대사 | ✅ | 134 |
| HUD D-nn · 판매 창 법 판정(플래그) · 도움말 토픽 2 · 영문 사전 | ✅ | 134 |
| **법 강제 3단계**(`enforceRodSell` 0/1/**2 = M1-06 완료 후**·기본 2) | ✅ | 135 |
| **품삯 일용직 3종**(`DayJobs` — 대화 [일하기]·행동력 소모·하루 상한) | ✅ | 135 |
| **생활용품점 사이소**(저가 장비 한 벌 · 속초 POI 17곳) | ✅ | 135 |
| **가방 사다리 1단계**(간이 백팩 도면 → 인벤 25 → 30칸 · 등 슬롯) | ✅ | 135 |
| Ch1 manual 목표 → auto 배선 (M1-02·04·08·10) | ✅ | 135 |
| 가방 2~4단계(중형·대형) + 지급품 9종 + 시작 ₩312,000 | ⬜ | 아이템·아이콘 추가 시 |
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
| 신규 퀘스트 전용 대사(`StoryDialogue`) | ⬜ | 137 잔여 — Ch1 대사만 존재 |


## 5. 잔여·차기

- **M1-06 → M1-11 구간의 수입 설계 확인**(135차 결과) — 법 강제 기본 2에서는 M1-06을 끝내는 순간
  어획물 판매가 전면 막히고(낚싯대 영구 · 통발은 비어업인 자가소비), `reported_fishery`는 M1-11 총회에서 나온다.
  그 사이 현금은 품삯뿐이다 — 일당 상한 **73,000원**(얼음 12,000×2 + 그물 8,000×3 + 공동작업 25,000, 피로 54).
  실플레이로 체감이 팍팍하면 `TUNING.job.wageMult` 또는 `law.enforceRodSell = 0`.
- 남은 manual 목표: 1-4 구멍치기(사이소는 135차 완료) · 1-11 총회 연출 · 통발 위판 UI(M2-01).
- 퀘 `rewards.items`(가방 2~4단계) 지급 — 아이템 정의 + 픽셀 아이콘(`gen_pixel_icons.py`) 필요.
- **`deadline.onMiss: 'cost'` 미구현** — D-day가 지나도 아무 일도 없다(표기만 `D+n (기한 초과)`). 벌칙 수치는 사용자 결정 대기.
- 도움말 '일지' 토픽 실캡처(현재 텍스트만) · `capture_help_images.cjs`에 `journal_log`·`dialogue` 추가.
- dev 콘솔(F10)에 퀘 점프/완료 명령(구세이브 고레벨 테스터용).

## 6. 함정·불변조건

1. **`validateStoryQuests()` = §8-1 수치 계약** — 퀘 XP를 바꾸면 챕터 합계가 어긋난다. 바꾸려면 `STORY_CHAPTERS.contract`도 같이. dev 부팅 시 `console.warn`.
2. **`talk` 목표는 `manual: true`여도 대화를 열면 자동** — `StoryStore.event`가 talk만 예외 처리. 다른 manual은 [다음 단계]로만.
3. **`body`는 Phaser Container 예약 프로퍼티** — DialoguePanel에서 `bodyC`로(44차 함정 재발).
4. **헤드리스 검증에서 NPC 근접은 2.5초 대기** — rAF ≈ 2fps + delta 클램프라 150ms 스로틀 통과에 여러 프레임(하네스 함정, 게임 무관).
5. **어획 이벤트의 `month`는 실제 KST 월** — 조행록 제철 판정이 여기 걸린다. 검증은 `event()`에 month 직접 주입.
6. **스토리 자격 면허 4종은 스킬 포인트를 주지 않는다** — `SKILL_BONUS_EXCLUDED_LICENSES`. 빼면 Σ 215 등식이 깨진다.
7. **`catchMethod` 없는 어획물 = rod** — 구세이브·기타 경로 보수적 처리. 새 생성 지점은 반드시 기록(FP 2곳·통발 2곳·쿨러 이송 2곳).
8. **`QUEST_DATABASE`(레거시 16퀘) 삭제 금지** — `License.requirements.quest_completed`가 참조. 일지만 스토리 DB로 전환.
9. **일감(`DayJobs`)은 완료 시 `job:<id>` 커스텀 이벤트를 흘린다** — `custom` 목표는 `placeKey`로,
   `communityWork` 목표는 `job:coop_work`로 매칭된다(135차). 새 일감을 추가하면 `questKey`를 함께 정한다.
10. **`TUNING.law.enforceRodSell`은 3값이다** — 0/1/2. `>= 1` 같은 이진 비교로 읽지 말 것(2는 조건부).
11. **무발주 퀘는 `event()` 끝에서 자동 완료** — 새 무발주 퀘를 추가하면 목표를 채우는 이벤트가 반드시 `event()`를 타야 한다.


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
