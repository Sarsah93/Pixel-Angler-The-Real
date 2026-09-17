# Pixel Angler The Real — 프로젝트 위키

> **이 위키의 목적**: 날짜·차수 순으로만 쌓이던 작업 기록을 **구조(시스템) 기준**으로 다시 배열해,
> "지금 무엇이 어디까지 되어 있고 / 무엇이 남았고 / 어디가 위험한가"를 한 화면에서 판별한다.
> 최종 업데이트: 2026-09-15 (135차 반영)

---

## 0. 문서 역할 분담 (중복 기록 금지)

| 문서 | 역할 | 성격 |
|---|---|---|
| `CLAUDE.md` | 세션 진입점 — 필수 선행 문서·스킬 목록·현재 위치 요약 | 짧게 유지 |
| `.agents/AGENTS.md` | **불변 규칙**(§1~§8) + **차수 원장**(§9, append-only 원문 기록) | 규칙은 여기서만 바뀐다 |
| `.agents/IMPLEMENTATION_PLAN.md` | 로드맵(Phase) · 다음 착수 · 완료 목록 | 계획 축 |
| **`docs/wiki/`** (이 문서) | **구조화 뷰** — 시스템별 현황·세부과제·잔여·위험 | 판단·탐색 축 |
| `.claude/skills/*/SKILL.md` | 반복 작업 절차·함정 노하우 | 방법 축 |

**작업 후 기록 규칙** → [`03-WORKLOG/README.md`](03-WORKLOG/README.md) · 스킬 `work-log`
새 작업의 **본문 기록은 워크로그 1건**에 쓰고, AGENTS/PLAN에는 **요약 3~5줄 + 링크**만 남긴다.

---

## 1. 위키 구성 (4층)

| 층 | 문서 | 답하는 질문 |
|---|---|---|
| **1. 구조** | [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md) | 게임이 어떤 화면·모듈로 이루어져 있나? 데이터는 어디로 흐르나? |
| **2. 시스템별 과제** | [`02-SYSTEMS/`](02-SYSTEMS/README.md) | 이 시스템은 어디까지 됐고 세부과제/잔여는 무엇인가? |
| **3. 작업 기록** | [`03-WORKLOG/`](03-WORKLOG/README.md) | 그 변경은 언제·왜·무엇을 건드렸고 어떻게 검증했나? |
| **4. 잔여·위험** | [`04-BACKLOG.md`](04-BACKLOG.md) | 지금 남은 것·깨질 수 있는 것·최적화 여지는? |

---

## 2. 시스템 상태 대시보드

상태 범례 — ✅ 완결(변경 계획 없음) · 🟢 운영(안정, 확장만) · 🔶 부분 구현 · 🚧 진행 중 · ⬜ 미착수 · ⚠ 위험 동반

| # | 시스템 | 상태 | 핵심 소스 | 잔여 요약 |
|---|---|---|---|---|
| S1 | [낚시 루프 (1인칭)](02-SYSTEMS/fishing-loop.md) | 🟢 | `FirstPersonFishingScene` · core 물리 9종 · **`HoleFishing`(149차 구멍치기)** | 어탐 레이더, 가이드 삽화 실사화, `TUNING.hole` F8 확정 |
| S2 | [필드·캐스팅 (탑다운)](02-SYSTEMS/world-field.md) | 🟢 | `RegionFieldScene` · **`SeamlessChunks`** | 비주얼 4레이어 에셋, 사운드 |
| S3 | [**손질 (회뜨기)**](02-SYSTEMS/butchery.md) | 🚧 | `ButcheryProcess` · `ButcheryPanel` · `CephalopodStages` | 두족류 **무늬오징어·한치·문어 개방**(97차) · 갑오징어 잔여 · 광어 F9 잔여 |
| S4 | [회썰기·플레이팅](02-SYSTEMS/sashimi-cooking.md) | 🟢 | `SashimiPanel` · `UtilizationPanel` · **미완성 접시**(135) | 스시, 불요리(화구·용기) |
| S5 | [인벤토리·장비·보관](02-SYSTEMS/inventory-equipment.md) | 🟢 | `InventoryStore` · `CoolerStore` · `FridgeStore` · **`InventoryPanel` 윈도우드 스크롤(148차)** | **148차 가방 사다리 5단계 실효화**(25 → 28/30/33/35/37 · 용량 밖 '잠긴 칸') — 예약 슬롯 6종 아이템 대기 · 탭별 용량 차등(core `Backpack.ts`) 미배선 |
| S6 | [경제·상점·시세](02-SYSTEMS/economy-data.md) | 🟢 | `MarketPriceEvaluator` · `ShopPanel` · **`ConsignmentAuction`(147차 위판)** · `AuctionHousePanel` | **147차 위판 개통**(직판장 창구 겸용 · 평판 = 수수료) — `TUNING.auction` F8 조율 · 경매 **구매자 측** 미개방 · 낚시점 전용 상점 |
| S7 | [월드맵·지역 타일맵](02-SYSTEMS/world-field.md) | 🔶 | `WorldMapScene` · **OSM 파이프라인 3종** · `build_region_maps.py` | 속초(심리스 v2)·부산·홈타운 개방 — OSM 16개 지역 확장 잔여 |
| S8 | [홈베이스 (집)](02-SYSTEMS/home-base.md) | 🔶 | `HomeInteriorScene` · `types/HomeBase.ts` | 하우스 Tier 1~3, 수조 패널, 농사 |
| S9 | [외부 실데이터](02-SYSTEMS/economy-data.md#외부-api) | 🟢⚠ | `core/api-client/*` | **배포 시 CORS 프록시 필수** |
| S10 | [UI 프레임워크](02-SYSTEMS/ui-framework.md) | 🟢 | `DraggablePanel` · `TextFit` · `SceneFade` · `HelpLibraryPanel`(**11카테고리 44토픽**) · `i18n/*` | 저순위 팝업 검수 잔여 · **131차 도움말 현행화·제작 UI 영문화 완료** · 한국어 콜아웃 4장 대기 |
| S11 | [가이드·온보딩](02-SYSTEMS/ui-framework.md#가이드-허브) | 🟢 | `GuidePanel` · `GuideContent` | 삽화 실게임 스크린샷 교체 |
| S12 | [세이브·슬롯](02-SYSTEMS/inventory-equipment.md#세이브) | 🟢 | `GameState` | 저장은 집 침대 전용 |
| S13 | [튜닝·dev 도구](02-SYSTEMS/ui-framework.md#dev-도구) | 🟢 | `config/tuning.ts` · `DevTuningPanel`(F8) | fight/rod/yield 테이블 소비 전환 |
| S14 | [해루질·통발](02-SYSTEMS/night-hunting-trap.md) | 🟢 | `ForagingEngine` · `ForageSystem` · `TrapFieldSystem` · `extract_fishfarms.py` | **121차 인-맵 1차 완료**(채집 스팟·어장 실폴리곤·강원 조례·통발 아이템) — 야간 실검증·F8 조율·실사 스프라이트·wade/dive 잔여 · **122차 상호작용 F 키 + 스킬 배율 훅** · ⚠ **"D2"는 이미 끝난 라벨**(147차 확인) · 어획물 sink는 **147차 위판**으로 해소 |
| S15 | 요리(불요리)·CookScene | ⬜ | `CookScene` · `RecipeDatabase` | 화구·용기 시스템부터 |
| S16 | [제작](02-SYSTEMS/progression.md) | 🔶 | `CraftingDatabase`(도면 14) · `CraftingStore` · `CraftBoard` · `AdvancedCraftPanel` | 129차 구현 — 재료 수급(벌목·채굴)·커스텀 로드/릴 성능치 잔여 |
| S17 | 퀘스트·스토리(레거시) | ⬜ | `QuestDatabase` | 레거시 16퀘 — 면허 요구조건 참조로 보존. 본편은 **S22** |
| S18 | 멀티플레이(구 항목) | — | | **S24로 이관**(143차) |
| S19 | Tauri 패키징 | ⬜ | `apps/tauri-wrapper` | Phase 9 (아이콘만 준비됨) |
| S20 | [도감·발견·dev 도구](02-SYSTEMS/discovery-wiki.md) | 🟢 | `DiscoveryStore` · `AnglerLogScene` · F10 콘솔 | 위키 상세 팝업 · FP 토스트 |
| S21 | [진행 — 레벨·스킬·생존·면허·일지](02-SYSTEMS/progression.md) | 🔶 | `Progression.ts` · `Vitals.ts`·`StatusEffects.ts` · `SkillDatabase`(**92노드 Σ=215**) · `CraftingDatabase` · `License.ts` · 패널 3종 · `CollapseOverlay` | **스킬 효과 배선 43/92**(130차) · 신규 면허 효과 1/7 · 농사 카테고리 잠김 · **P1~P9 완료**(P8 = 134차 S22) · 스토리 면허 4종 추가(보너스 제외) · 눕기 스프라이트 대기 |
| S22 | [스토리·퀘스트](02-SYSTEMS/story-quests.md) | 🔶 | **정본 [`STORY_SPEC_v4`](../../.agents/STORY_SPEC_v4.md)** · `Story.ts` · `FisheryLaw.ts` · `StoryQuestDatabase`(**186퀘 · 아크 23**) · `DayJobs`(품삯 3) · `JournalPages` · `StoryArcs` · `StoryStore` · `DialoguePanel`(**140차 재작성 — 선택지·우호도**) · `JournalPanel` · `StoryChoices` · `Affinity.ts` | **134차 데이터·엔진 + 135차 Ch1 실시스템 + 140차 선택지 분기·우호도** — 배 출조·좌판 등 계통 · Ch2+ 대사 · NPC 스프라이트 잔여 · **147차 위판 UI(M2-01)·총회 연출(M1-11)·`onMiss` 평판 감점 완료** · ~~남은 manual = 구멍치기(1-4)~~ **✅149차 — 조법 구현 + `spotKind` 장소 게이트** · **148차 가방 2~5단계 실효화 완료** |
| S23 | [캐릭터 아트](02-SYSTEMS/character-art.md) | 🟢 | `art/CharacterArt.ts`(셀 32x32 · 레이어 14) · `art/CharacterCast.ts`(41인) · `ui/CharacterSprite.ts`(**144차 `paceMult`**) · `CharacterCreateScene`(139차 UI · 140차 얼굴형 · **144차 회전·동작 버튼**) | **140차 머리 9×10·얼굴형 3종·측면 재작업 완료** · 사용자 GPT 스타일 실험 대기(`CHARACTER_SPRITE_PROMPT_SPEC`) · 대화창 초상 아트 · 눕기 프레임 · **달리기 전용 프레임**(현재는 걷기 가속) |
| S24 | [싱글/멀티플레이](02-SYSTEMS/multiplayer.md) | 🔶 | `types/Multiplayer.ts`(공용 계약) · `server/multiplayer/`(`/mp/*` REST · 세션 · 디스크 영속) · `net/MultiplayerClient.ts` · `MultiplayerLobbyScene` · `FieldEventManager` | **143차 신설 · 145차 세션 세계** — 통발 공유 · 공용 시드 · 외형/활동 · 밀어내기 · 건물 반투명 · 채팅 · 이어하기 · **유저 간 거래(공증)·정보 보기(146차)**. 진행도는 **설계상 각자**. 남은 것은 NAT 통과·서버 권위·마켓 원장 |

---

## 3. 지금 위치 (2026-09-17)

- **149차**: **구멍치기(테트라포드·사석) + M1-04 장소 게이트** — 조법 자체가 없었다
  (학습 태그·사이소 저가 세트·도현수 대사만 있었다). 반대로 **지형 판정은 114차부터 있었다**
  (`breakwaterClassAt` 2 = 피복 / 3 = 사석) — 그 위에 조법 하나와 조건 한 줄을 올린 차수다.
  ⚖ **새 단축키를 만들지 않았다** — `F` 체인은 이미 꽉 찼고(채집 스팟이 테트라포드 발밑에도
  생겨 서로 잡아먹는다) 낚시는 마우스에 둔다: 블록 위에서 **짧게 = 구멍치기 / 꾹 = 캐스팅**.
  ⚖ **장소 게이트는 라벨이 약속한 만큼만** — `spotKind: 'breakwater'`를 걸고 구멍치기가 이를
  만족하게 했다(더 요구하면 진행 중 세이브가 막힌다). ⚠ 기본 `SeabedProfile`이 발앞을 깎아
  **2.2m 구멍이 0.8m**로 그려지던 것을 실측으로 잡았다. 상세
  [워크로그 149](03-WORKLOG/2026-09-17-149-hole-fishing-spot-gate.md)
- **148차**: **인벤토리 윈도우드 스크롤 + 가방 사다리 2~5단계 실효화** — 가방 아이템은 141차에
  이미 다 있었고(`bagSlots` 3·5·8·10·12), 막고 있던 것은 **`GRID_CAPACITY_MAX = 30` 한 줄**이라
  **8·10·12가 전부 클램프**되어 세 가방이 같은 효과였다(**죽은 보상**). 그 30도 밸런스가 아니라
  **렌더 한계**였으므로 실제 작업은 `InventoryPanel` 재설계다 — **윈도우드 스크롤**(마스크는
  입력을 클립하지 않는다 · 54차 전례). 상한 **37** → **25/28/30/33/35/37** 분화 ·
  **용량 밖 '잠긴 칸'**(꺼내기 O · 넣기 X)으로 **시드 tackle 4건이 처음 화면에 나온다** ·
  칸 축소 가드 `bagShrinkBlocked`로 일반화. 상세
  [워크로그 148](03-WORKLOG/2026-09-17-148-inventory-scroll-bag-ladder.md)
- **147차**: **위판(경매 현장) + 어촌계 총회 연출 + 기한 초과 평판 감점** — 착수 조사에서
  **"통발 D2"가 이미 121차에 끝난 라벨**이고 **`AuctionEngine` 332줄이 사문**임을 확인했다.
  사문의 기전은 "안 쓰임"이 아니라 **쓸 수 없는 방향**(플레이어를 *사는 쪽*으로 모델링) —
  구매자 측을 보존한 채 `ConsignmentAuction`(파는 쪽)을 신설했다. 위판 창구는 건물 종류가 아니라
  **능력**(직판장 겸용). ⚖ 평판은 **수수료율에만**(낙찰가 불침범 실측) · 총회는 **부결 없음** ·
  기한 초과는 **재화가 아니라 평판**. M2-01 `sell` 목표 auto. 상세
  [워크로그 147](03-WORKLOG/2026-09-17-147-consignment-auction-general-meeting.md)
- **146차**: **유저 간 거래(공증) + 정보 보기 + 플리마켓 계약** — 상세
  [워크로그 146](03-WORKLOG/2026-09-17-146-p2p-trade-profile.md)
- **144차**: **달리기(Shift) + 캐릭터 만들기 프리뷰 회전·동작 버튼** — `VitalsActivity`의 `'run'`은
  125차부터 있었으나 **아무도 넘긴 적이 없어** 사문이었고, 그 빈 분기를 채웠다. Shift 홀드 = ×1.55
  (걷기 210 < 달리기 326 < 자전거 420 px/s) · 피로 85%·허기·수분 임계에서 걷기로 강등.
  캐릭터 만들기는 미니어처 4종 → **◀ ▶ 회전 + 정지/걷기/달리기 동작 버튼**. 상세
  [워크로그 144](03-WORKLOG/2026-09-17-144-run-sprint-charcreate-preview.md)
- **143차**: **싱글/멀티 진입 + 대화창·팝업 통일 + 필드 라벨 정리 + 문구 다듬기** — 상세
  [워크로그 143](03-WORKLOG/2026-09-16-143-multiplayer-ui-tone-labels.md)
- **140차**: **얼굴형·머리 축소·측면 + NPC 대화창(선택지 분기) + 우호도 + 숙련도 + 아티팩트 v4** — 상세
  [워크로그 140](03-WORKLOG/2026-09-16-140-face-shape-dialogue-choices-affinity-proficiency.md)
- **139차**: **캐릭터 만들기 UI 재정비 + 스토리 아키텍처 v4** — 생성 씬을 HUD 패널 문법
  (`paintHudPanel` 3장) · **2열 5섹션** · **실제 색 견본 스트립**(숫자 `3 / 10` 폐기 — 픽셀 팔레트에는
  이름이 없다)으로 재작성 · 미리보기 스테이지 · 푸터 `paintHudSlot` 버튼.
  **`.agents/STORY_SPEC_v4.md` 신설 = 스토리 정본**(v3의 §0.5 우선 기형을 본문 승격으로 해소 ·
  퀘 186 · 아크 23 · XP 2,809,150 · 구현 현황표). ⚠ 캐릭터 아트는 사용자 검토 중이라 보류.
  [워크로그 139](03-WORKLOG/2026-09-16-139-charcreate-ui-story-v4.md).
- **138차**: **바닐라 베이스 캐릭터 + 페이퍼돌 장비 + NPC 41인 분화 + 과증식 4종 + 퀘스트 28편** —
  아트 격자를 코드가 소유(`CharacterArt` 셀 32x32 · 정수 x2) · 바닐라 = 나체 + 언더웨어 ·
  해파리/불가사리 4종 + 훌치기(씬 전환 없음) · 퀘 158 → **186** · 만렙 200에서도 XP 누적.
  [워크로그 138](03-WORKLOG/2026-09-16-138-character-base-nuisance-quests.md).
- **137차**: **퀘스트 증설 38편(회귀 고리)** — 챕터 = 지역 1:1이라 이전 맵을 다시 갈 이유가 없던 맹점 해소.
  [워크로그 137](03-WORKLOG/2026-09-15-137-quest-expansion-return-loops.md).
- **136차**: **스풀·베일 + 밑걸림 대처 + 장비 고장 + 일지 2트랙 + NPC 마커**.
  [워크로그 136](03-WORKLOG/2026-09-15-136-spool-snag-durability.md).
- **135차**: **미완성 접시 저장 + Ch1 실시스템(품삯·사이소·가방) + 법 강제 3단계** —
  플레이팅 도중 접시를 내리면 **미완성 접시 아이템**으로 보관(상세 `6 / 16점 (38%)` · 슬롯 좌하단 % 배지 ·
  이어담기·해체). **판매 0원**(가격표가 만석 전제 — 사용자 결정), 섭취는 가능 ·
  신선도는 **가장 오래된 조각 계승**(구 구현은 항상 `fresh`라 '나쁨' 조각 세탁이 가능했다) /
  **품삯 일용직 3종** + **생활용품점 사이소** + **가방 사다리 1단계**(인벤 25 → 30칸)로
  Ch1 `manual` 목표 4건을 auto 배선 / **법 강제 = M1-06 완료 후**(기본 2 — 구세이브 회귀 0).
  점검 실버그 6건 수정. 실렌더 22/22 + 35/35 · pageerror 0.
  [워크로그 135](03-WORKLOG/2026-09-15-135-wip-plate-dayjobs-law.md).
- **134차**: **스토리 「조행록」 정립** — 사용자 스펙 v3 → `.agents/STORY_SPEC_v3.md`(+§0.5 코드 정합) ·
  `.agents/PLAYER_SCENARIO.md` · core 계약/법 규칙 5조/퀘스트 **120**/조행록 17/아크 17 ·
  `StoryStore` 진행 엔진 + 일지(J) 재작성 + NPC 대화([F]) + HUD `D-nn` + 판매 창 법 판정.
  ⚠ **법 강제는 OFF**(`TUNING.law.enforceRodSell = 0` — 사용자 결정). 실렌더 12/12 · T1~T7 · 무결성 0건.
  [워크로그 134](03-WORKLOG/2026-09-14-134-story-quests-law.md).
- **131차**: **도움말 라이브러리 현행화 + 제작 UI 영문화** — 게임 안 도움말이 123차에 멈춰 있어
  125~129차에 **이미 구현된 생존 6토픽이 '준비 중'으로 남아 있던 것**을 전부 ready로 재작성 ·
  **'제작' 카테고리 신설**(기본 = U 제작 탭 / 고급 = 설치 제작대 [F]) · 스킬 트리 토픽 3페이지
  (**Σ 215 = 만렙 200 + 면허 15** · 해금 조건 · 시너지 히든 `???`) · 실캡처 8장(ko/en × 4) /
  ⚠ **129차 제작 UI가 영문 사전에 전혀 없었다** → `buildRuntimeDict` 합류 + 사전 156·규칙 16.
  도움말 문자열 **356개 미번역 0**. 실렌더 ko 10/10 · en 13/13.
  [워크로그 131](03-WORKLOG/2026-09-11-131-help-library-craft-progression.md).
- **130차**: **스킬 트리 확장 (a)(c)(d)(e)** — 생존 지표 최대치 3노드 · 행동력 확률적 면제 ·
  해금 조건(레벨·면허·카테고리 숙련) · 시너지 히든 5종(비용 0·자동 습득) ·
  **등식 재정의 Σ 200 → 215**(세이브가 랭크만 저장하므로 비용을 깎는 대신 **예산을 늘렸다**) ·
  티어 수용 6 → 8. 실배선 43/92. core 43/43 · 실렌더 24/24.
  [워크로그 130](03-WORKLOG/2026-09-11-130-skill-tree-expansion.md).
- **129차**: **성장·생존 P7** — 제작 시스템(도면 14종 · U 탭 ↔ 고급 제작대 공유 보드) ·
  약국·제작 구급품 3종 + `applyRemedy` · **홈타운 보건소 [F] 진료 45,000원** ·
  피로 회복 음식(보양식 버프 · 카페인 리바운드) · 효과 수치 **단일 테이블 `ItemVitals`** ·
  신규 아이템 26종 전부 픽셀 아이콘. core 32/32 · 실렌더 36/36.
  [워크로그 129](03-WORKLOG/2026-09-11-129-crafting-firstaid-fatigue-food.md).
- **127차**: **성장·생존 P5·P6** — core `CastWeather.ts` 신설: **바람 3m/s 초과부터** 맞바람 비거리 감소
  (9m/s ×0.73 — 실비행 466px → 332px) · 옆바람 산포 ×1.6 + 착수점 밀림 · **비 = 유속 ×1.27 · 밑걸림 ×1.33** /
  **스킬 실배선 13 → 24/83**(생활 6·채집 속도·정투·바람 읽기 — 바람 보정은 **손실의 20%만**, 사용자 "아주 미비") /
  **조준 400ms 홀드 = 필요 파워 눈금**(`solveCastPower`) · 산포 링 · 바람 화살표 · 비행 카메라 팔로우 /
  리스펙 아이템('조업 재교육 이수증'). core 28/28 · 실렌더 19/19.
  [워크로그 127](03-WORKLOG/2026-09-10-127-cast-weather-skill-wiring.md).
- **126차**: **성장·생존 P3·P4 + UI 이모지 금지 규칙** — 상태 패널 '대'에 경험치 바 · 허기/수분 컴팩트 바 ·
  **수치 호버 팝업**(상시 숫자 제거) · **상태이상 스트립**(패널 밖 색 칩 + Ko/En 툴팁, '중/소' 회귀 0) /
  **기절·사망 FSM**(`CollapseOverlay` — 눕기 · 비네트 · 팝업 · 재화 15%·인벤 유지) /
  **UI 이모지·특수문자 금지 전면 규칙화**(AGENTS §4·§8 · CLAUDE · ui-panel 스킬). 실렌더 29/29.
  [워크로그 126](03-WORKLOG/2026-09-10-126-vitals-panel-collapse-fsm.md).
- **125차**: **성장·생존 P2** — core `Vitals.ts`(활동 드레인 6 · 행동 비용 8 · 임계 20% · 온도 · 수면) +
  `StatusEffects.ts`(11종 · 진행 체인 · 재발) · `GameState.vitals` 세이브(**활동 시간만 진행 → 오프라인 정지**) ·
  배선 9곳(드레인 · 5개 행동 비용 · 음식 회복치 · 침대 수면 · 채집 부상 → 상태이상). core 44/44 · 실렌더 12/12.
  [워크로그 125](03-WORKLOG/2026-09-10-125-vitals-status-effects.md).
- **124차**: **성장·생존 P1** — core `Progression.ts`(레벨 200 · `xpToNext = 25n^1.5+75` · 어획 XP =
  희귀도×체장 · 첫 발견 ×5) + `GameState.grantXp` 배선 4곳(손질/회 ×등급·채집·준법 방생) ·
  **스킬 트리 44→83노드 Σ=200pt**(제작 카테고리 신설 — 잠금) · 제작 설계 정정(기본 = U 창 '제작' 탭 /
  고급 = 설치 제작대 [F]). core 42/42 · 실렌더 ko/en 9/9.
  [워크로그 124](03-WORKLOG/2026-09-10-124-progression-p1-level200-skilltree.md).
- **123차**: **성장·생존 통합 스펙 v2** — 사용자 원안을 122차 코드에 정합한
  `.agents/PROGRESSION_SURVIVAL_SPEC.md`(레벨 200 · 스킬 Σ=200pt · 생존 지표 · 상태이상 · 기절/사망 ·
  P1~P9) + 도움말 '성장 · 생존' 카테고리 선반영(영문 사전 포함). 착수 순서는 124차에 확정(백로그 H).
  [워크로그 123](03-WORKLOG/2026-09-10-123-progression-survival-spec-v2.md).
- **122차**: **121차 피드백 5건** — 상호작용 **E → F**(E = 장비창) · 영문 잔여(도감·지역/구역·출처) · 팝업 ✕ 통일 ·
  HUD 명패 로케일 재배치 · **면허(L)·스킬(K)·일지(J)** 패널(S21 신설 — 스킬 40종/배선 13). 실렌더 41/41 ·
  [워크로그 122](03-WORKLOG/2026-09-09-122-feedback-fkey-i18n-panels-skills.md).
- **121차**: **인-맵 채집(해루질) 1차** — 속초 맵 갯바위·테트라포드 발밑·안벽에 시간 시드 스팟(≤220) ·
  [F] 홀드 채집(122차 E→F) · 국립해양조사원 어장 SHP → 어촌계 어장 3폴리곤 오버레이 · 강원 조례(5종 금지 → 적발/압수/벌금 ·
  판매 금지 · 산란기 도루묵) · 통발 아이템 T 설치·wall-clock 침지·[E] 수거. 상세 →
  [워크로그 121](03-WORKLOG/2026-09-09-121-inmap-foraging-fishfarms-traps.md). 116~120차는 조도 재적용·도움말·HUD·영어(각 워크로그).
- **105차**: **해안 시트 3장 에셋화·적용**(사용자 에셋 3장) — 실사 항공사진 격자 선별 +
  검정 테두리 셀 탐지(알파 기준) → 51스프라이트 · 방파제 `'b'` = **상판/사석 실사 타일**
  (그룹 톤 정규화) · 항내 안벽·외해 사석 발치 접경 · **갯바위 실사 산포**.
- **104차**: **TTP 타일 시트 그리드화·적용**(사용자 에셋 2장) — 목업 시트 실측 크롭 →
  리샘플 → 팔레트 양자화(25스프라이트) · 테트라포드 **소형 유닛 클러스터**(2밴드·플립) ·
  해변 접경 셀 4방위 회전(바다 색 투명 오버레이) · **외해 마스크**(석호·항 내측 배제).
- **103차**: **해안 지형 디테일**(사용자 캡처 7장) — 방파제 추론(coastline 조각 → `b` 2,510타일) ·
  해변-바다 연결 · 모래 웜 틴트(골든) · 서프 포말 · 수심 챔퍼+디더 · 테트라포드(외해측) ·
  섬/암초 렌더(조도). "도로 위 건물"은 위치 제보 대기.
- **102차**: **맵 후속 잔여 일괄** — 사고 차량 추월 · 회전교차로 분리섬(oneway 쌍 쐐기) ·
  편집기 새 도로 그리기 · 지면 오토타일(잔디 블롭 16조합) · 물 타일셋 · 지붕 패널·대각 컷 ·
  신호 교차로(신호등 + 대형만 스크램블 X) + **섬 지역 분류**(`access='boat'` — 울릉·독도 분리).
  101차 = dev 맵 편집기(F7)·차도 벡터 마킹·회전교차로/일방통행·차량↔캐릭터·주차 차량.
- **로드맵(사용자 확정 2026-09-01)**: 맵 확정(사용자 육안) → **OSM land 14개 확장** →
  두족류 마무리 → 해루질·통발. 스펙 = `.agents/OSM_TILEMAP_SPEC.md`(**§0.5 우선**).
- **다음 재개 지점**: ① 맵 확정 — 주간 시각·정지선 방향 + 102차 신설분 체감(사용자)
  ② OSM 확장(land 14 — terrain 대조 동반) ③ 두족류 수동 검증(무늬오징어 잔여 F9 ·
  문어 좌표 재실측). 상세 → [워크로그 102](03-WORKLOG/2026-09-01-102-map-followups-batch.md).
- 이후 순서: 갑오징어 13 → 광어 F9 잔여 → **해루질·통발 배선(S14 D2~D5) → 불요리 → 농장 경영(S8)**.
- **광어 잔여**: F9 좌표 4종(`upSep1/2`·`dnSep1/2`·`dnScore` — 엔가와·박피는 반영 완료) · 등쪽 단면 실사 투명본 대기.
- 상세: [`04-BACKLOG.md`](04-BACKLOG.md) · [`02-SYSTEMS/world-field.md`](02-SYSTEMS/world-field.md) · [`02-SYSTEMS/butchery.md`](02-SYSTEMS/butchery.md)

## 4. 새 세션 읽는 순서

1. `CLAUDE.md` (규칙·스킬 목록)
2. 이 파일 §2 대시보드 → §3 지금 위치
3. 건드릴 시스템의 [`02-SYSTEMS/*.md`](02-SYSTEMS/README.md)
4. 최근 관련 [`03-WORKLOG/`](03-WORKLOG/README.md) 항목 1~2건
5. 작업 → 검증 → **워크로그 기록**(스킬 `work-log`)
