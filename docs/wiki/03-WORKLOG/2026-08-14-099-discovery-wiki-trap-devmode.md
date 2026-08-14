# 099차 — 발견 도감·위키 + 통발 결함 2건 수정 + Dev 크리에이티브 콘솔(F10)

| | |
|---|---|
| **날짜** | 2026-08-14 |
| **시스템** | `해루질·통발` `도감` `인벤` `세이브` `인프라` |
| **트리거** | 사용자 지시 4건 — 위키 반영·통발 결함 수정·도감 발견 게이트·전체 위키·dev 모드 |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 4/4 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 지시(2026-08-14) 4건:

1. 전체 과업 조사 결과를 docs/wiki에 정식 반영하고, **해루질 결함 2건**(shellfish 카테고리 ·
   어류 통발 미연동)부터 수정할 것.
2. 어종 도감은 "**한 번이라도 특정 어종을 본 적이 있으면 보여지도록**" — 발견 게이트.
3. 어종뿐 아니라 "**전체 아이템이나 모든 구성요소 등에 대한 wiki**(발견 기준으로 구체적 설명,
   카테고리)"를 구축할 것.
4. "**마인크래프트 개발자모드처럼** localhost dev 서버에서 모든 아이템을 얻거나 제거하거나,
   무적 상태가 되거나" — dev 크리에이티브 모드.

선행 조사(같은 날, 서브에이전트 2건)로 해루질·통발은 **"엔진·DB·씬 전부 동작 / 배선·튜닝 미완"**,
농장 계열은 **"배치 시스템만 동작, 나머지는 스키마·스텁"**임을 확정했다 — S14/S8 페이지에 반영.

## 2. 원인 — 통발 결함 2건 (확정 기전)

- **`trap_crab_pro`의 `'shellfish'` 타깃은 영영 매칭되지 않았다** — `ShoreCreatureCategory`
  유니온에는 존재하지만 생물 DB 10종 중 그 값을 쓰는 생물이 0(조개류는 `bivalve`/`gastropod`).
  `calculateTrapCatch`의 `targetCategories.includes(creature.category)` 필터에서 항상 탈락.
- **장어·어류 통발은 물고기를 못 잡았다** — `targetCategories: ['crustacean']`뿐이고
  주석("내부에서 어종은 FishDatabase 참조")만 있던 미구현. 어종 연동 메커니즘 자체가 없었다.

## 3. 변경 — 어디를 어떻게

### 3-a. 통발 결함 2건 (core)

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `core/src/types/Activities.ts` | `TrapSpec.targetFishSpecies?: string[]` · `TrapCatchItem.isFishSpecies?` 신설 |
| 수정 | `core/src/db-schema/TrapDatabase.ts` | `trap_crab_pro` `'shellfish'` → `'gastropod'`(소라만 통발에 기어듦 — bivalve는 매몰형 제외) · 장어 통발 2종에 `conger_eel`/`hagfish`(+pro는 `pike_conger`) · 어류 그물에 볼락·우럭·노래미류·문절망둑·붕장어 |
| 수정 | `core/src/simulation/TrapSystem.ts` | `TrapCandidate` 유니온(생물\|어종) — 어종은 `habitatSpotTypes` 필터 + 진입 40%(제철 +15) + `avgWeightRangeG` 길이 보간. 가치 추정도 어종 분기(`sashimiValuePerKg`) |
| 수정 | `client-pc/src/store/GameState.ts` | `addTrapCatchToCooler` — `isFishSpecies`면 쿨러 type `'fish'`(speciesId = FishDatabase id → 판매가·도감 연동) |

### 3-b. 발견(도감/위키) 시스템

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `core/src/types/Discovery.ts` | `DiscoveryKind`(fish/creature/item) · `DiscoverySource`(catch/trap/night_hunting/inventory/legacy/dev) · `DiscoveryEntry` · 라벨. index.ts export |
| 신설 | `client-pc/src/store/DiscoveryStore.ts` | 발견 기록 싱글톤 — `record`(최초 1회·onNew 훅) · `isDiscovered` · serialize/deserialize(**구세이브 = 어획 기록 legacy 백필**) · `devUnlockAll`/`devResetAll` · `__DISC` dev 노출 |
| 수정 | `client-pc/src/store/GameState.ts` | SaveData `discoveries` + applySaveData/buildSaveData/newGame 배선 · `syncInventoryDiscoveries`(로드·뉴게임·**첫 부팅** 3경로 — 시드 보유 아이템 일괄 발견, onNew 억제) · 발견 소스 3곳(addCaughtFish=catch / addHarvestToCooler=night_hunting / addTrapCatchToCooler=trap) |
| 수정 | `client-pc/src/store/InventoryStore.ts` | `addItem`에 `record('item', id, 'inventory')` — 모든 취득 경로 1곳 커버 |
| 수정 | `client-pc/src/scenes/RegionFieldScene.ts` | `DiscoveryStore.onNew` → HUD 토스트("[도감] 새로운 어종 발견 — … (N 키로 확인)") + shutdown 해제 · **N 키 = 도감 pause+launch** |

### 3-c. 도감 4탭 개편 (AnglerLogScene)

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `client-pc/src/scenes/AnglerLogScene.ts` | 탭 2→**4**(어종/해양생물/아이템 위키/조과 기록 — 배열 기반) · 어종 발견 판정을 caughtFishHistory 스캔 → `DiscoveryStore`로 교체 · **미발견 = 실루엣**(`setTintFill`) + ??? + 서식 힌트(수심대·수층·야행성) · 낚시 기록 없는 발견(통발)은 "🔍 통발로 포획 · M/D + 낚시 기록 없음" 표기 |
| 신설(동일 파일) | `renderCreatures` | 해양생물 10종 카드 — 발견 = 이름/학명/카테고리/시세/금어기/발견 경로 · 미발견 = 흐린 이모지 + 조우 힌트(주야·심화 면허) |
| 신설(동일 파일) | `renderItems` | 아이템 위키 — 카테고리 필터 6종 + 카드(아이콘/이름/소분류·가격/desc 2줄/발견 경로) · 미발견 = ??? + **입수 힌트(판매처)** |
| 신설 | `client-pc/src/data/WikiCatalog.ts` | 정적 카탈로그 빌더 — 시드(`InventoryStore.seedCatalog` 신설) + `SHOP_CATALOG` dedup(desc·판매처 병합) · 개체형(어획물) 제외 · `tpl`(실지급용 원본 템플릿) |

### 3-d. Dev 크리에이티브 콘솔 (F10)

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `client-pc/src/dev/DevMode.ts` | `DevMode.god` + `isGod()`(프로덕션 = 상수 false 데드코드 제거) |
| 신설 | `client-pc/src/dev/DevConsolePanel.ts` | F10 DOM 오버레이(F8 패턴) — ①무적 토글 ②재화(+10만/+100만/0)·스태미나/피로 회복 ③아이템 검색 지급/제거(+1/+10/−1·보유량) ④어종 어획물 지급 ⑤도감 전체 해금/초기화 |
| 수정 | `client-pc/src/store/InventoryStore.ts` | god 가드 4곳(`refreshCondition` 동결·`loseRigParts`·`loseLureRig`·`consumeRigItem`) + `devGrantFish`(평균 밴드 랜덤 활어 지급) |
| 수정 | `client-pc/src/scenes/FirstPersonFishingScene.ts` | `forceLineBreak`에 god 가드(줄터짐 무시) |
| 수정 | `client-pc/src/game.ts` | `initDevConsolePanel()` 등록 |

## 4. 구조상 위치

- 통발 결함 = `S14 해루질·통발 → 통발 포획 판정(데이터+판정 층)`.
- 발견 시스템 = **신규 시스템 S20(도감·발견·dev 도구)** — 계약(core 타입) + 데이터(스토어·세이브)
  + 렌더(AnglerLogScene) 3층. 어종·생물·아이템 3종을 하나의 스토어가 담당.
- dev 콘솔 = S13(튜닝·dev 도구) 확장 — F8(튜닝)/F9(좌표)/F10(크리에이티브) 체계.

## 5. 검증

Playwright 실렌더 하네스(`scratchpad/verify_discovery.cjs`) — **19/19 PASS · pageerror 0**:

| 대상 | 방법 | 결과 |
|---|---|---|
| 통발 어종 포획 | dist 시뮬 500회×3종 | 장어 통발 = 붕장어 478·먹장어 431 / pro = +갯장어 / 어류 그물 = 볼락·우럭·노래미류·붕장어 5종 |
| shellfish 정정 | 시뮬 500회 | 프로 게 통발 = 소라(turbo_cornutus) 464 + 민꽃게 486 — 매칭 성립 |
| 발견 스토어 | `__DISC` 실스토어 | 시드 아이템 동기 >10 · 어종/생물 0 시작 · devGrantFish → source 'dev' |
| 세이브 왕복·백필 | serialize/deserialize | 왕복 보존 · **구세이브(필드 없음) = legacy 백필 2종** |
| 도감 4탭 | 실마우스 탭 클릭 + 스크린샷 4장 | 미발견 실루엣+힌트 · 발견 카드(방어 dev 해금 8/14) · 생물 2종 발견 카드 · 아이템 위키 발견 10/10 |
| Dev 콘솔 | F10 + DOM 클릭 | 열림 · 전체 해금(어종 57/생물 10/아이템 전 카탈로그) |
| god 가드 | 체크박스 ON 후 실호출 | `loseRigParts` = [](손실 0) · 활어 상태 유지 |

첫 실행에서 FAIL 2건 → **첫 부팅(세이브 없음)은 applySaveData·newGame을 안 거쳐 시드 동기 누락**
확정 → `initialize()` 말미 멱등 동기 추가로 해소(재실행 19/19).

## 6. 잔여 — 착수 조건

- 해루질·통발 배선 잔여(D2~D5 — 통발 선택 UI·분실 배선·안전 판정·튜닝 중앙화·생물 스프라이트·
  RegionFieldScene 진입 동선)는 [S14 페이지](../02-SYSTEMS/night-hunting-trap.md) §5의 로드맵으로 이관.
- 위키 카드 상세 팝업(클릭 → 큰 설명)·FP 씬 발견 토스트는 후속(현재는 RegionField HUD만).
- dev 콘솔 무적의 HP/피로 지속 무시는 소비처가 생기면 그때 가드(현재는 회복 버튼).
- 접시/통발 등 **비 인벤 경로 아이템**의 위키 발견은 addItem 커버 밖이면 개별 record 필요(발견 안 되는
  아이템 리포트가 오면 그 경로에 record 1줄).

## 7. 위험·부작용

- **발견 기록은 세이브 필수 경로**(SaveData.discoveries) — 새 종료/리셋 경로를 만들면
  DiscoveryStore.resetAll/serialize 배선을 잊지 말 것(부산물 지급 3경로 함정과 동류).
- `record`는 **onNew 훅을 발화**한다 — 로드·일괄 동기 경로에서는 훅을 억제하고 호출할 것
  (`syncInventoryDiscoveries` 패턴). 안 하면 로드 시 토스트 폭탄.
- 아이템 발견은 **raw id 기준** — 개체형(`inv_catch_*` 등)도 기록되지만 위키 카탈로그에 없어
  자연 무시된다. 카운트 UI는 반드시 **카탈로그 교집합**으로 셀 것(dev 콘솔에서 126/113 실측 후 수정).
- 통발 어종 추가는 `targetFishSpecies`에 **FishDatabase 실존 id만** — 오타는 조용히 필터에서 사라진다.

## 8. 후속 반영

- [x] 워크로그(이 문서) + 인덱스
- [x] `02-SYSTEMS/night-hunting-trap.md` 신설(S14) · `02-SYSTEMS/discovery-wiki.md` 신설(S20)
- [x] `02-SYSTEMS/home-base.md` §5 농장 경영 로드맵(E1~E5) 갱신
- [x] `04-BACKLOG.md` A(해루질 결함 완료·대과제 세분화)·B(발견 세이브 위험)
- [x] `AGENTS.md` §9 + `IMPLEMENTATION_PLAN.md` 요약 3~5줄 + 링크
- [x] `docs/wiki/README.md` 대시보드 — S14 ⬜→🔶 · S20 신규 행
