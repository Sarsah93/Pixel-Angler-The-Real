# 134차 (2026-09-14) — 스토리 「조행록」 정립: 퀘스트 120 · 법 규칙 5조 · 일지·NPC 대화 · 플레이어 시나리오

> 시스템: S22 스토리·퀘스트(신설) · S21 진행(면허 4종·일지) · S5 경제(판매 판정) · UI · i18n · 문서
> 빌드 3/3(turbo `--force`) · typecheck 0 · core 무결성 OK · 법 T1~T7 PASS · 실렌더 **12/12** · pageerror 0

---

## 1. 배경

사용자 업로드 `claude_story-v3-spec.md`(스토리 스펙 v3 — 메인 「조행록」 + NPC 17아크, 921줄) + 지시:

> "해당 내용 바탕으로 스토리 라인 및 전체 진행 및 퀘스트 등을 모두 요약된 플레이어 시나리오로 정립하고,
> 인게임 내 모든 요소를 우선 최대한 반영해. 그 다음 commit & push 해줘. (수정할 부분은 push 후에 살펴볼게)"

로드맵상 이 작업이 곧 **P8 퀘스트 XP · Ch1 리워크**(133차 이월)다. 122차 일지 골격(스토리 준비 중·레거시 16퀘)을 스펙 구조로 대체했다.

## 2. 원인·판단 (구현 결정)

- **스펙은 레포 접근 없이 작성돼 id가 다르다** — 조행록 17장 중 4종 미등록(임연수어·호래기·주꾸미 + 서브의 돗돔), `bigfin_squid`·`yellowtail_amberjack`·`ulleung`·`sokcho_v2` 등 표기 불일치.
  → §0.5 코드 정합 노트를 스펙 상단에 신설하고 **본문보다 우선**시켰다(두족류 스펙 §0.5 전례). 미등록 종은 스펙 자체의 대체 규칙(§7-4-3)을 따르고 `substitutedFrom`으로 원안을 보존.
- **법 규칙 §3 강제를 켜면 테스터 빌드의 유일한 수입원(낚싯대 어획물 판매)이 사라진다** — Ch1 품삯·통발 위판 UI가 아직 없다.
  → 판정·UI 배선은 전부 넣고 **`TUNING.law.enforceRodSell = 0`**. 켜는 시점은 사용자 결정.
- **가방 사다리(2×5)·지급품·시작 재화 ₩312,000**은 테스터 세이브(5×5 슬롯 11~25)를 깨고, 저가 장비·품삯 루프 없이 가난만 남긴다 → core 모델만.
- **자동 추적기가 없는 목표**(대화·납품·배 출조·공동작업…)는 `manual` 플래그로 대화 패널에서 닫는다 — 시스템이 생기면 플래그만 뺀다. 120퀘 전부 "지금 완주 가능"이 목표.

## 3. 변경

### 신설

| 파일 | 내용 |
|---|---|
| `.agents/STORY_SPEC_v3.md` | 원문 + **§0.5 코드 정합 v3.1**(어종 17·지역·면허·스키마·법·가방·NPC·미착수 표) |
| `.agents/PLAYER_SCENARIO.md` | 플레이어 시점 요약 — 5부 7챕터 흐름 · 17장 표 · 자격 사다리 · 규칙 · 아크 17 · 구현 마커 |
| `core/types/Story.ts` | 계약 타입 전부 |
| `core/rules/FisheryLaw.ts` + `.test.ts` | 5조 규칙 표 · 5함수 · `landingLegalFlags` · T1~T7 |
| `core/inventory/Backpack.ts` | `BACKPACK_SPECS`·`resolveSlotsPerTab`·`canUnequipBag` |
| `core/db-schema/StoryChapters.ts` | 7챕터 + 자격 7 + §8-1 계약 |
| `core/db-schema/StoryQuestDatabase.ts` | **120퀘** + `validateStoryQuests` |
| `core/db-schema/JournalPages.ts` · `StoryArcs.ts` | 17장 · 17아크(NPC 40명) |
| `client/store/StoryStore.ts` | 진행 엔진(`__STORY` dev 노출) |
| `client/data/StoryNpcs.ts` · `StoryDialogue.ts` | 속초 NPC 7 배치 · 영금정 · Ch1 대사 |
| `client/ui/DialoguePanel.ts` | 대화 패널 |
| `docs/wiki/02-SYSTEMS/story-quests.md` | S22 페이지 |

### 수정

| 파일 | 내용 |
|---|---|
| `core/config/tuning.ts` | `story`·`rep`·`law`·`inventory` 블록 + META 4 |
| `core/types/License.ts` | `LicenseType` 4종 + `LICENSE_DATABASE` 4건(`quest_completed` 조건) |
| `core/types/Skills.ts` | 보너스 제외 목록 += 4 (Σ 215 불변) |
| `core/index.ts` | export 30여 심볼 |
| `client/store/GameState.ts` | `story` 세이브 · `currentRegionId` · 훅 7곳 · `StoryStore.bind` |
| `client/store/InventoryStore.ts` · `CoolerStore.ts` · `ui/CoolerPanel.ts` | `catchMethod` 필드·승계 |
| `client/scenes/FirstPersonFishingScene.ts` · `field/TrapFieldSystem.ts` | 어획 생성 시 `catchMethod` 기록 · 통발 이벤트 |
| `client/scenes/RegionFieldScene.ts` | NPC 배치·근접 힌트·[F] 대화·방문/자전거 이벤트·dev 무결성 경고 |
| `client/scenes/HomeInteriorScene.ts` | 침대 저장 → `bedSave` 이벤트 |
| `client/ui/JournalPanel.ts` | **전면 재작성**(조행록·자격 사다리·트리·휠 스크롤) |
| `client/ui/RegionHud.ts` | 날짜줄 `D-nn` |
| `client/ui/ShopPanel.ts` | 법 판정으로 판매 목록 필터 + 사유/대안 안내 |
| `client/data/HelpContent.ts` · `i18n/en_help.ts` · `i18n/I18n.ts` | 법 토픽 신설 · 일지 토픽 재작성 · 스토리 데이터 사전 합류 |

### 삭제

없음. 레거시 `QUEST_DATABASE`는 면허 요구조건이 참조하므로 보존.

## 4. 구조상 위치

`S22 스토리·퀘스트`(신설) → 계약(`types/Story.ts`) · 데이터(4 DB) · 판정(`FisheryLaw` · `StoryStore.match`) · 렌더(일지·대화·HUD).
파급: S21(면허 4종·일지) · S5 상점(판매 필터 — 플래그 OFF라 현행 무변화) · S2 인벤(`catchMethod` 추가 필드 — 세이브는 full spread라 자동 보존).

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 퀘 DB 무결성 | `validateStoryQuests()` (dist) | 0건 — 120퀘 · 챕터별 수/XP = §8-1 계약 · 17장 커버 · 어종·발주자 id 전부 실재 |
| 법 규칙 | T1~T7 (dist 실행 + vitest 파일) | 7/7 PASS (T1 낚싯대+면허 → 불가 · T2 통발+면허 → 허용 · T7 대안 ≥ 1) |
| 실렌더 `verify134.cjs` | Playwright · 새 게임 · 속초 | **12/12** — NPC 7 배치 · M1-01 자동 완료(영금정 도착 → XP 240) · 정옥선 근접 힌트 `[F] 정옥선 — 새 의뢰` · 대화 패널(M1-02 발주) · 수락→상점 방문(자동)→얼음 나르기(수동)→완료(품삯 30,000·신뢰 +2·M1-03 발주) · M1-03 완료 → HUD `D-180` → 수면 → `D-179` · 어획 훅(M1-04) · 조행록 1장 제철 판정(9월 ✗ → 1월 ✓) · 판매 판정(플래그 off=null / rod=LAW_SELL_ROD 면허 무관 / trap=면허 후 허용) · 세이브 왕복 · 일지 61행 렌더 · 영문 423문자열 미번역 0 · pageerror 0 · TextOverflow 0 |
| 스크린샷 육안 | 대화·일지 3장 | 3톤 버튼 라벨 넘침 1건 → `clampTextWidth` 수정 |

재현: `node scratchpad/verify134.cjs` (dev :5173, `__STORY`·`__GS` 사용).

## 6. 잔여

§0.5-9 표 그대로 — 법 강제 ON(사용자 결정) · 가방 UI·지급품·시작 재화 · 배 출조·구멍치기·사이소·좌판·구술 채록·반복 의뢰 · 평판 소비처·기한 초과 처리 · Ch2+ 전용 대사 · NPC 전용 스프라이트 · 미등록 어종 7종.
착수 조건: Ch1 manual 목표를 실시스템으로 바꾸는 순서 = 1-2 품삯 → 1-4 구멍치기·사이소 → 1-8 가방 → 1-10 공동작업.

## 7. 위험·부작용

- `addCaughtFish` 시그니처에 `method` 기본 인자 추가 — 기존 호출 2곳 무변경(rod).
- `GameState.addCoins`가 이제 `StoryStore.event('coins')`를 부른다 — 활성 퀘 없으면 루프만 돌고 무해. 부팅 초기(`bind` 전) 호출은 host null 가드.
- 일지 패널이 씬 `wheel`을 구독 — `destroy`에서 해제(누수 방지).
- 구세이브: `story` 없음 → M1-01만 활성. 고레벨 구세이브도 Ch1부터(dev 콘솔 점프는 후속).
- 헤드리스 NPC 근접 검증은 2.5초 대기 필요(하네스 함정 — S22 §6-4).

## 8. 후속 반영

- [x] 워크로그(이 문서) · [x] `02-SYSTEMS/story-quests.md` 신설 + `02-SYSTEMS/README.md` · [x] `03-WORKLOG/README.md` 인덱스
- [x] `04-BACKLOG.md`(A3-5 퀘스트 항목 갱신 · D 판매 강제 질문) · [x] `progression.md` §4·§5 일지 항목
- [x] `docs/wiki/README.md` 대시보드(S22 · 지금 위치) · [x] `IMPLEMENTATION_PLAN.md` · `AGENTS.md` §9 · `CLAUDE.md` · `README.md`
