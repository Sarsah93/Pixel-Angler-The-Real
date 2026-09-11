# 129차 — 성장·생존 P7: 제작 시스템 + 구급품·보건소 + 피로 회복 음식

| | |
|---|---|
| **날짜** | 2026-09-11 |
| **시스템** | `제작` `성장·생존` `인벤토리` `홈타운` `UI` |
| **트리거** | 사용자 지시 — "(b)는 P7(제작·구급품·요리 재료)과 자연스럽게 붙으니 P7에 얹고, (a)(c)(d)(e)는 스킬 트리 구조 변경이라 P7 이후 별도 차수로 묶어서 작업하자. 계속해서 시작해줘." |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

`PROGRESSION_SURVIVAL_SPEC` §11의 **P7(제작·구급품·요리 재료)** 착수 차례였다.
128차 말미에 제안한 확장안 5건 중 사용자가 범위를 갈랐다:

- **(b) 피로 회복 음식 → 이번 P7에 포함.**
- **(a) 생활 스킬 최대치 증가 / (c) 저확률 행동력 미소비 / (d) 스킬 해제 조건 경우의 수 /
  (e) 시너지 히든 스킬 → 스킬 트리 구조 변경이므로 P7 이후 별도 차수.**

125차에 상태이상 11종을 만들면서 **치료 수단(`cure`)만 선언하고 실물은 없었다** —
`bandage`/`splint`/`medicine`/`hospital`을 요구하는 상태이상에 걸려도 고칠 방법이 게임에 없었다.
124차에 만든 제작 스킬 12종도 전부 `wired: false`에 카테고리 자체가 잠겨 있었다.

## 2. 원인 — 무엇이 문제였나 *(이번에 발견한 실버그 3건)*

### ① 설치형 오브젝트의 기능이 [F]로 영영 열리지 않았다 (선행 버그)

`interactWithObject`의 첫 줄이

```ts
if (o.placedByPlayer && o.removable) { this.recoverPlacedObject(o); return; }
```

라서, **플레이어가 설치한 물건은 종류를 불문하고 [F] = 회수**였다.
새로 만든 고급 제작대가 이 경로에 걸려 팝업이 한 번도 뜨지 않는 것으로 확정했고
(실렌더: `[F] → 고급 제작대 팝업 — {"panels":0}`), 같은 이유로 **44차부터 있던
설치형 수조(`interact: 'aquarium'`)도 열 수 없는 상태**였다는 것이 함께 드러났다.

### ② 개량 통발 도면의 재료 id가 실제 아이템과 달랐다

`bp_trap_improved`의 입력을 `trap_crab_basic`으로 적었는데, 인벤토리 통발 아이템의
id 규칙은 **`inv_trap_<specId>`**(= `inv_trap_trap_crab_basic`)다. 그대로 뒀으면
재료를 아무리 들고 있어도 `0 / 1`로 보이는 도면이 됐다. 산출 id 2건도 같은 오류였다.

### ③ `skillMult('firstaid')`가 조용히 무효 (자체 발견)

`life_firstaid`는 `add('firstaid', 0.10)` **add 모드**인데 `skillMult`는 `mult` 항목만 합산한다 —
등록된 mult가 없어 **항상 1**을 돌려주므로 응급처치 스킬이 통째로 무시된다.
`skillBonus`로 교체하고 코드에 경고 주석을 남겼다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `packages/core/src/db-schema/CraftingDatabase.ts` | 도면 **14종**(hand 8 / workbench 6) · `CraftStation`·`CraftGroup`·`CraftMaterial`·`CraftBlueprint` · `craftSuccessRate`·`materialSaveChance` |
| 신설 | `packages/client-pc/src/data/ItemVitals.ts` | 소모품 효과 **단일 테이블**(음식 회복치·보양식 버프·구급품) + `applyItemVitals` |
| 신설 | `packages/client-pc/src/data/CraftOutputs.ts` | 산출 id → 인벤토리 템플릿 (상점에 이미 있는 물건은 카탈로그 재사용) |
| 신설 | `packages/client-pc/src/store/CraftingStore.ts` | 재료 판정·소비·성공 롤·XP·행동 비용 |
| 신설 | `packages/client-pc/src/ui/CraftBoard.ts` | 제작 보드 (U 탭과 제작대 팝업이 **공유**) |
| 신설 | `packages/client-pc/src/ui/AdvancedCraftPanel.ts` | 고급 제작대 [F] 팝업 |
| 신설 | `tools/backfill_hospital_poi.py` | 이미 구운 지역 `pois.json`에 병원 POI 머지 (네트워크 필요) |
| 수정 | `packages/core/src/types/Vitals.ts` | `applyIntake`에 **피로 회복 인자** 추가 (양수 = 피로 감소) |
| 수정 | `packages/core/src/types/HomeBase.ts` | `clinic`·`workbench` 오브젝트 타입 · `craft`·`clinic` 상호작용 · 홈타운 **보건소** 배치 · `PLACEMENT_DEFS.workbench` |
| 수정 | `packages/core/src/config/tuning.ts` | `TUNING.craft` 5키 + F8 슬라이더 3종 |
| 수정 | `packages/core/src/db-schema/SkillDatabase.ts` | **제작 카테고리 잠금 해제** · 제작 스킬 9종 `wired: true` (24 → **33/83**) |
| 수정 | `packages/client-pc/src/store/GameState.ts` | `applyRemedy` · `scheduleFatigueRebound` · `applyDrainBuff` · 리바운드/버프를 **활동 시간**으로 차감 |
| 수정 | `packages/client-pc/src/store/InventoryStore.ts` | `fatigueRestore`·`fatigueRebound(+Min)`·`cureKind`·`medicQuality`·`drainBuff*`·`craftMaterial` 필드 + **세이브 로드 백필** |
| 수정 | `packages/client-pc/src/ui/InventoryPanel.ts` | `applyIntakeOf` 확장 (피로·버프·리바운드·구급품 치료) |
| 수정 | `packages/client-pc/src/ui/UtilizationPanel.ts` | **'제작' 탭 신설** (4번째 탭) |
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` | 약국 건물 · 보건소/제작대 텍스처·힌트·상호작용 · **[F]=기능 / [Shift+F]=회수** |
| 수정 | `packages/client-pc/src/data/ShopCatalog.ts` | **약국** 신설 · 보양식 2종 · 제작 재료 10종 · 제작대 판매 · ITEM_VITALS 주입 패스 |
| 수정 | `tools/gen_pixel_icons.py` → `data/PixelIconArt.ts` | **16x16 손그림 아이콘 15종 신설** (13 → 28종) |
| 수정 | `packages/client-pc/src/ui/ItemIcon.ts`·`ItemDetailPanel.ts` | `iconTexture: 'px:<키>'` = 픽셀 아이콘 경로 |
| 수정 | `tools/fetch_region_osm.py`·`build_osm_tilemap.py` | OSM 질의·POI_TAGS에 `hospital`·`clinic`·`doctors` 추가 |

### 설계 결정

- **도면은 12종이 아니라 14종.** 스펙 §11 P7은 "12종"이라 적었지만 §2-5가 열거한 품목을
  전부 만들면 14종이다(채비 3·봉돌 2·구급품 3 / 루어 1·에기 1·통발 2·로드 1·릴 1).
  숫자를 맞추려 품목을 빼지 않고 14종으로 구현하고, 어긋남을 DB 주석에 남겼다.
  밑밥 배합은 기존 'U 밑밥 품질' 탭이 전담하므로 도면으로 중복 정의하지 않는다.
- **피로 부호 = 회복량 방향.** `fatigueRestore: 20` = 피로도 −20 (허기·수분과 같은 방향).
  상점 설명의 '피로 −20'과 데이터가 1:1로 읽힌다.
- **리바운드·보양식 버프는 활동 시간으로 잰다.** 실시각으로 재면 접속을 끊어 카페인 빚을
  피할 수 있다 — §4-1 오프라인 정지 규약을 리바운드만 예외로 두지 않는다.
- **수면과 경쟁하지 않는다.** 일반 음식은 피로 회복 0, 국물류·커피 8~20, 보양식 30~40.
  침대만 피로 0 전량 회복이다.
- **효과 수치는 `ItemVitals` 한 곳.** 상점 카탈로그 리터럴에만 적으면 **이미 세이브에 들어간
  아이템에는 영원히 반영되지 않는다**(53차 회칼 버그와 같은 함정) → 상점·시드·**세이브 로드 백필**
  세 경로가 같은 테이블을 읽는다.
- **제작대 설치는 홈타운 한정**(기존 `startPlacement` 규칙), scope는 exterior만 —
  실내 배치 모드가 아직 없어서(44차 잔여) 놓을 수 없는 곳을 목록에 띄우지 않는다.

## 4. 구조상 위치

`S21 성장·생존 → P7 제작·구급품·요리 재료 → 이 작업`
(스펙 §2-5 제작 2단 구조 · §4-3 섭취 회복 · §5 상태이상 치료 수단)

건드린 층: **계약(타입) + 데이터 + 판정 + 렌더 전부.**
core는 도면 데이터와 지표 수식만, 클라이언트가 아이템 템플릿·UI·씬 배선을 갖는다
(`@tra/core`에 인벤토리·렌더 개념을 넣지 않는다는 §3 규칙).

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 도면 DB·수식·스킬 Σ·치료 종류·피로 부호 | core 실판정 스크립트 | **32/32 PASS** |
| 제작 탭·제작 실행·구급품·보양식·리바운드·제작대·보건소 | 실렌더(Playwright) + 실 스토어(`__INV`/`__GS`) | **36/36 PASS · pageerror 0** |
| 신규 픽셀 아이콘 15종 | 96px 확대 + **16px 실사이즈** 스크린샷 육안 | 15/15 렌더 · 2종 재작화 |
| 약국·보양식·카페 데이터 | 실렌더 카탈로그 덤프 | 구급품 3 + 재료 2 · `drainBuff 0.68/60분` · `리바운드 10/120분` |
| 전체 | `pnpm run build` · `typecheck` | **3/3 · 0 오류** |

주요 실측:

- 장어구이 → 피로 60 → 20, 드레인 버프 `{mult: 0.68, leftMs: 3600000}`
- 커피 → 즉시 −20, **60분 후 미만료 · 121분 후 만료 시 +10 복귀**
- 붕대 사용 → 출혈만 치료, 골절은 잔존(치료 종류 분리 확인)
- 붕대 2회 제작 → 무명천 6 → 2 · 산출 4개 · `cureKind` 자동 주입
- 보건소 진료 → 100,000 → 55,000원 · 독감 치료 · HP 50 → 100
- 제작대 [F] → 팝업 1개 · **회수되지 않음** / Shift+F → 회수됨

재현 절차(회귀 테스트): dev 서버 기동 후
`node <scratchpad>/verifyCraft.mjs` · `node <scratchpad>/renderCraft.mjs /tmp/shots`

## 6. 잔여 — 이번에 안 한 것

- **출조 지역 병원 POI** — OSM 질의에 병원 태그가 아예 빠져 있어 캐시에도 없다.
  질의·`POI_TAGS`·백필 도구는 넣었지만 **이 환경은 Overpass 접근이 egress 정책으로 차단**
  (실측: `CONNECT tunnel failed, 403`)이라 실행하지 못했다.
  → 네트워크가 열린 곳에서 `py tools/backfill_hospital_poi.py sokcho_v2` 1회.
  그때까지 병원 기능은 **홈타운 보건소**(절차 배치라 OSM 무관)로 항상 동작한다.
- **재료 수급 경로** — 지금은 전부 상점 구매다. 벌목·채굴·약초 채집이 붙으면 그쪽으로 옮긴다.
- **미배선 제작 효과 3종** — `trap_durability`·`lure_tuning`·`egi_tuning`은 도면 해금에만 쓰이고
  실효과는 통발 내구/루어 성능 편차 시스템이 생길 때 배선한다.
- **커스텀 로드·릴의 실제 성능치** — 현재 템플릿만 있고 `GearSpecs` 물리값과 연결되지 않았다.
- **(a)(c)(d)(e) 스킬 트리 확장** — 사용자 결정으로 **P7 이후 별도 차수**.
- 레거시 아이템 이모지(구 `InventoryStore` 시드·`ShopCatalog`)는 그대로 — 백로그 H2.

## 7. 위험·부작용

- **[F] 동작 변경**: 기능이 있는 설치물은 이제 [F]가 회수가 아니라 기능을 연다.
  기능 없는 설치물(울타리·텃밭)은 종전대로 [F] = 회수. 라벨에 `[Shift+F] 회수`를 병기한다.
- **세이브 백필이 매 로드마다 돈다** — `applyItemVitals`는 비어 있는 필드만 채우므로
  유저 상태를 덮어쓰지 않지만, 테이블 값을 바꾸면 **구세이브 아이템의 효과도 같이 바뀐다**(의도).
- `BuildingKind`에 `pharmacy`가 늘어 `Record<BuildingKind, …>` 테이블 3곳이 컴파일로 강제된다
  (팔레트·네온·라벨 — 이미 채움).
- 성능 영향 없음. 제작 보드는 보이는 행만 생성하고 씬 휠 핸들러는 destroy에서 해제한다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/progression.md` §4·§5 갱신
- [x] `04-BACKLOG.md` 갱신
- [x] `AGENTS.md` §9 요약 + 링크
- [x] `IMPLEMENTATION_PLAN.md` 다음 착수 갱신
- [x] 새 함정 → 시스템 페이지 §6
