# S14. 해루질 · 통발

> 상태 **🟢 운영(인-맵 1차)** — 121차에 **속초 심리스 맵 위에서** 채집·어장 규제·통발이 동작한다.
> 레거시 별도 씬(`NightHuntingScene`/`TrapScene`)은 FieldScene 경로에만 남아 있고 폐기 후보.
> 관련 차수 099(조사·결함 2건) · **121(인-맵 채집·어장·조례·통발)** — 세부 로드맵은 §5.

---

## 1. 목적·범위

낚시와 병렬인 **채집 생산 축**. 동해안 실태(리서치 121차 §2)를 그대로 옮긴다 —
갯바위·방파제 발밑·암반 조간대에서 소라·홍합·성게·해삼·문어를 **줍거나 뜰채·갈고리로 건지는** 해루질과,
물가에서 던져 두고 실시간 침지 후 수거하는 **통발**. 산출물은 쿨러 → 인벤 → 요리/자가 소비
(**채집물은 판매·유통 금지** — 강원 조례).

## 2. 구성

| 계층 | 파일 | 역할 | 상태 |
|---|---|---|---|
| core | `types/Foraging.ts` | 도구·접근·스팟·어장 폴리곤 타입 · `farmAt` · 조례 상수 · 판매 금지 상수 | ✅ 121 |
| core | `simulation/ForagingEngine.ts` | 시드 스팟 롤링 · 안전 판정 · 도구/홀드 · 채집 결과 · 조례 위반·적발 · 통발 산란기 위반 | ✅ 121 |
| core | `db-schema/ShoreCreatureDatabase.ts` | 생물 12종(동해 4종 신설) — 도구·스팟 종류·맨손 부상·보호종 | ✅ |
| core | `simulation/TrapSystem.ts` · `db-schema/TrapDatabase.ts` | 수거·효율 곡선·분실 롤·면허 등급·가격 · 통발 8종(+도루묵) | ✅ |
| core | `config/tuning.ts` `forage`·`trap` | 밀도·성공·도주·적발·벌금·분실 배율 (F8 11종 — **mockup**) | 🔶 조율 대기 |
| data | `public/data/<region>/fishfarms.json` ← `tools/extract_fishfarms.py` | 어촌계 어장 폴리곤(EPSG:5179 SHP 클립 · 타일 좌표) | ✅ 속초 3개 |
| client | `scenes/field/ForageSystem.ts` | 후보 타일 → 스팟 렌더 · 어장 오버레이 · 랜턴 가시성 · [F] 홀드 · 수확 · 단속 · 미끄러짐 | ✅ 121 |
| client | `scenes/field/TrapFieldSystem.ts` · `ui/TrapDeployPanel.ts` | 통발 선택 → 물 위 설치 · 부표 · [F] 수거 · 반환 | ✅ 121 |
| client | `RegionFieldScene` 배선 | E 우선순위 · T 키 · 설치 클릭/ESC · `depthAtWaterTile` · `__FIELD`(dev) | ✅ 121 |
| client(legacy) | `scenes/NightHuntingScene.ts` · `TrapScene.ts` · `GameState.addHarvestToCooler` | 별도 씬(이모지 클릭) · 화면에 없는 legacy 쿨러 | ⚠ 폐기 후보 |

## 3. 동작 구조

```
채집: 지형 규칙(섬/암초=갯바위 · 사석/TTP=발밑 · 상판+항만=안벽 · 자연 뭍=갯바위/웅덩이)
      → 후보 3,836타일 → rollForageSpots(시간 슬롯 시드 · 밀도 5/100 · 간조 보너스 · 시장가 역가중) → 스팟 ≤220
      → 가시성(낮: 랜턴 0 생물 / 밤: 헤드랜턴 루멘×0.55타일 반경)
      → [F] 홀드(forageSafety 풍속·파고 게이트 → 미끄러짐 롤) → attemptForage(도구·부상·도주·법정 크기)
      → CoolerStore(활어) 또는 인벤 '채집물'(forageCatch) → 도감 → 어장 안 보호종이면 rollEnforcement → 압수+벌금
통발: T / 인벤 '통발 놓기' → TrapDeployPanel(통발×미끼) → 물 타일(플레이어 4타일·육지 거리 ≤3) 클릭
      → validateTrapDeployment(면허 등급·개수·수심) → 통발 1 + 미끼 1 소모 → DeployedTrap(mapId·depthM·durability)
      → wall-clock 침지 → [E] 확인 → rollTrapLoss 1회 → harvestTrap → 쿨러/인벤 → 통발 반환(내구도 0 = 파손)
```

- 어장 폴리곤은 실데이터(마을어업속초9·협동양식속초5·6). 조례 보호 5종 = 전복·해삼·성게·홍합·문어.
- 발견(도감) 기록: 채집 = `night_hunting` · 통발 = `trap` — [S20](discovery-wiki.md).

## 4. 세부과제 현황

| 과제 | 상태 | 차수 |
|---|---|---|
| 해루질 엔진·생물 DB · 통발 엔진·DB | ✅ | (초기) |
| D1 통발 결함 2건(`shellfish`·어종 타깃) | ✅ | 099 |
| D2a 통발 종류·미끼 선택 UI | ✅ `TrapDeployPanel` | 121 |
| D2b 통발 분실 배선 | ✅ `rollTrapLoss` 1회(수거 시) | 121 |
| D2c 안전 판정 배선 | ✅ `forageSafety` — 실데이터 풍속/파고(파고 2.1m 실측 차단) | 121 |
| D2d 수심·침지 실연동 | ✅ `depthAtWaterTile`(육지 거리×수심 프로필) · `baitDurationHours` | 121 |
| D3 확률 튜닝 중앙화 | 🔶 신규 시스템은 `TUNING.forage/trap` · 레거시 `NightHuntingEngine` 매직넘버 잔존 | 121 |
| D4 생물 스프라이트 | ⬜ 절차 도트 아이콘(`forage_<id>`) — 실사 에셋 대기 | — |
| D5 RegionFieldScene 진입 동선 | ✅ 인-맵 [F]·T (122차 E→F) — 별도 씬 없음 | 121 |
| 스킬 배율 훅(스팟 반경·균형·맨손 부상·문어 도주·통발 분실) + 어촌계원(`fishery_member`) 조례 면제 | ✅ | 122 — `attemptForage(…, mods)` · `rollTrapLoss(…, riskMult)` 기본값은 종전과 동일 |
| F1 어촌계 어장 실폴리곤 | ✅ `extract_fishfarms.py` → 오버레이·진입 안내 | 121 |
| F2 강원 조례 재현 | ✅ 5종 금지·적발/압수/벌금·판매 금지·산란기 도루묵·스쿠버 없음 | 121 |
| F3 야간 실검증 | ⬜ 실시간 시계라 낮에만 검증 — 야간 생물·랜턴 반경 미검증 | — |
| F4 접근 확장(wade/dive) | ⬜ `ForageAccess` 자리만 — 가슴장화·스킨/스쿠버(사용자 계획) | — |

## 5. 잔여·차기 (착수 로드맵)

1. **야간 검증 + F8 조율**(밀도·성공·적발·벌금) — 야간 세션 또는 시각 오버라이드 dev 훅.
2. **D4 실사 스프라이트** 12종(스킬 `asset-pipeline`) — 키 `forage_<id>` 교체만.
3. **wade/dive 접근** — 물 안 이동 규칙·장비 아이템(가슴장화·수경/스노클·스쿠버) + 스쿠버 = 조례상 비어업인 금지라
   면허/어업인 루트 설계 필요.
4. 레거시 씬·legacy 쿨러 폐기(사용자 결정) · HUD 로그 영어 규칙 재수집(120차 전수 하네스) · 미니맵 스팟/어장 표시.
5. 채집물 sink = 불요리 대과제(S15) — 섭국·보말죽·성게알 등 레시피.

## 6. 함정·불변조건

1. **`targetCategories`와 생물 DB 카테고리는 같은 유니온이어도 매칭은 데이터가 결정한다**(099) — 새 통발·생물 추가 시 실존 확인.
2. **통발 침지는 wall-clock**(`Date.now() - deployedAt`) — 오프라인 정지 규칙(쿨러류)과 반대. 마이그레이션 시 밀지 말 것.
3. `TrapCatchItem.isFishSpecies`가 쿨러 type 분기(099). 어종인데 빠뜨리면 판매가·도감이 끊긴다.
4. **`hasFishFarms` 없는 지역에서 `fishfarms.json` 로드 금지** — SPA 폴백 pageerror(`hasLights`와 같은 함정). 지역 추가 시 `extract_fishfarms.py` 실행 + 플래그.
5. **실데이터 파고가 채집을 막는다** — 파고 ≥1.5m·풍속 ≥12m/s면 `[F]`가 거부된다(정상). 하네스는 `__FIELD.tuning.forage.maxWaveM`을 올려 진행(121차 실측 2.1m).
6. **채집물 판매 금지는 3경로** — `InventoryStore.getSellPrice`(0) · `ShopPanel` 필터 · `CoolerPanel` 이송(`forageCatch`). 새 판매 경로엔 `forageCatch` 확인.
7. `TrapSpec.licenseTier/priceWon` **필수** — 통발 추가 시 누락하면 typecheck 오류(의도). 상점 아이템 id = `inv_trap_<specId>`(구세이브 백필도 이 규칙).
8. 구세이브 통발은 `mapId`가 없어 `mapId ?? spotId`로 비교 — 심리스 맵에 부표가 안 뜬다(레거시 TrapScene에서만).
9. **스팟 상한이 작으면 맵에 흩어져 안 보인다** — 후보 3,836타일에 40개면 조도 화면에 0개(실측). 상한 220·밀도 5/100.
10. i18n 규칙은 `(m, tr)`의 **`tr()`로 캡처를 재번역**해야 런타임 사전(생물 `nameEn`·지명)이 먹는다 — `EN_DICT[...]` 직접 조회는 정적 사전만.
11. **홀드 폴링 키 = 시작 키** — 122차 E→F 전환 때 `keyE.isDown` 폴링이 남아 F 홀드가 다음 프레임에 취소됐다(하네스 실측). 키를 바꾸면 `addKey`도 함께.
12. **홀드 라벨은 y−80** — 플로팅 힌트(y−40 → −62 트윈)·홀드 바(y−66)와 겹치지 않게(122차 스크린샷 실측).
