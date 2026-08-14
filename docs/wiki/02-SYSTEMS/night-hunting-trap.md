# S14. 해루질 · 통발

> 상태 **🔶 부분** — 엔진·DB·씬 전부 동작(레거시 FieldScene 경로), **배선·튜닝·에셋이 미완**.
> 2026-08-14 전수 조사로 실상 확정(구 대시보드 "⬜ 미착수" 표기는 오류였다) · 관련 차수 099
> 다음 대과제 1순위(사용자 지정) — 세부 로드맵은 §5.

---

## 1. 목적·범위

낚시와 병렬인 **채집 생산 축**: 밤 조간대에서 생물을 줍는 **해루질**(실시간 미니게임)과
설치 후 시간이 지나면 수거하는 **통발**(오프라인 침지 메타게임).
산출물은 쿨러 → 인벤 → 판매/손질/요리로 흐른다.

## 2. 구성

| 계층 | 파일 | 역할 | 상태 |
|---|---|---|---|
| core | `simulation/NightHuntingEngine.ts` | 채집 판정 — 발견 확률(야간·집어등·간조·희귀종)·안전 판정·세션 시뮬 | ✅ 완성 |
| core | `db-schema/ShoreCreatureDatabase.ts` | 생물 10종(조개·소라·굴·전복·꽃게·민꽃게·낙지·문어·성게·해삼) — 금어기·법정크기·시세 | ✅ 완성 |
| core | `simulation/TrapSystem.ts` | 통발 수거 — 실경과 침지시간·효율 곡선·용량·내구도·분실 위험 | ✅ 완성 |
| core | `db-schema/TrapDatabase.ts` | 통발 8종(게 2·새우·장어 2·문어 단지 2·어류 그물) + **어종 타깃(099)** | ✅ |
| client | `scenes/NightHuntingScene.ts` | 해루질 씬 — 집어등 커서·생물 스폰/클릭 채집·쿨러 정산 | ✅ 플레이 가능 |
| client | `scenes/TrapScene.ts` | 통발 씬 — 지도 마커·설치/수거/상세 팝업 | ✅ 플레이 가능 |

진입은 현재 **레거시 FieldScene의 H/T 키** — RegionFieldScene 동선은 미배선(§5 D5).

## 3. 동작 구조

```
해루질: NightHuntingScene → getHuntableCreatures(스팟·금어기·시간·집어등)
        → 클릭마다 attemptHunt(발견 확률) → 미달 방류 → GameState.addHarvestToCooler
통발:   TrapScene 설치(GameState.deployTrap) → 실경과 침지(Date 기반)
        → harvestTrap = 생물+어종 후보 풀 → 효율 곡선(최적 침지 초과 시 감소)
        → addTrapCatchToCooler (어종은 type 'fish' — 판매가·도감 연동)
```

- **어종 포획(099)**: `TrapSpec.targetFishSpecies`(FishDatabase id) — 장어 통발 = 붕장어·먹장어
  (+대형식은 갯장어), 어류 그물 = 볼락·우럭·노래미류·문절망둑·붕장어.
  진입 40% + 제철 +15, 무게 = `avgWeightRangeG` 길이 보간.
- 발견(도감) 기록: 해루질 = `night_hunting` · 통발 = `trap` — [S20](discovery-wiki.md).

## 4. 세부과제 현황

| 과제 | 상태 | 차수 |
|---|---|---|
| 해루질 엔진·생물 DB·씬 | ✅ | (초기 구축) |
| 통발 엔진·DB·씬 | ✅ | (초기 구축) |
| **D1a `'shellfish'` 카테고리 불일치** — 매칭 0 → `gastropod` 정정 | ✅ | 099 |
| **D1b 장어·어류 통발 어종 연동** — `targetFishSpecies` 신설·판정 편입 | ✅ | 099 |
| D2a 통발 종류·미끼 선택 UI (현재 `trap_crab_basic`+청갯지렁이 하드코딩) | ⬜ | — |
| D2b 통발 분실 배선 (`calculateTrapLossRisk` 구현돼 있으나 미호출) | ⬜ | — |
| D2c 해루질 안전 판정 배선 (`canPerformNightHunting` 미호출 — 강풍에도 진입됨) | ⬜ | — |
| D2d 수심·침지시간 실연동 (`depthM:5`·"4시간 후" 하드코딩) | ⬜ | — |
| D3 확률 튜닝 중앙화 (`tuning.ts` + F8 — 현재 전부 매직넘버) | ⬜ | — |
| D4 생물 스프라이트 (현재 이모지 렌더 — `spriteKey`는 예약됨) | ⬜ | 에셋 대기 |
| D5 RegionFieldScene 진입 동선 (`gather` 갯바위 → 해루질 / 물가 → 통발) | ⬜ | — |

## 5. 잔여·차기 (착수 로드맵)

**D2(배선 완성)까지가 "제대로 동작"의 기준** — 신규 엔진 0, 기존 함수 호출 연결이 대부분.

1. **D2** — 선택 UI·분실·안전·수심 배선 (규모 중).
2. **D3·D4** — 튜닝 중앙화(스킬 `add-tuning`) + 생물 도트 에셋(스킬 `asset-pipeline`).
3. **D5** — 진입 동선 + **채집물 손질 파이프라인 재사용**
   (낙지·문어·소라·전복 → 기구현 두족류/회썰기 흐름 — 신규 구현 거의 없이 콘텐츠 배가).
4. 심화(선택) — 통발 오프라인 침지 밸런스(길수록 수확↑·분실↑), 갯벌/타이드풀 지형,
   `simulateNightHuntingSession`(현재 미사용) 기반 자동 채집 모드.

## 6. 함정·불변조건

1. **`targetCategories`와 생물 DB 카테고리는 같은 유니온이어도 매칭은 데이터가 결정한다** —
   `'shellfish'`는 타입에 존재하지만 실생물 0이라 조용히 죽는 타깃이었다(099).
   새 통발 추가 시 카테고리·어종 id의 **실존 여부**를 확인할 것(오타는 필터에서 조용히 사라진다).
2. **통발 침지는 wall-clock**(`Date.now() - deployedAt`) — 게임 시계가 실시간이라 의도된 설계.
   오프라인 정지 규칙(쿨러류)과 **반대**이니 세이브 마이그레이션 시 침지 시간을 밀지 말 것.
3. `TrapCatchItem.isFishSpecies`가 쿨러 type(fish/crustacean) 분기를 결정한다(099) —
   어종인데 플래그를 빠뜨리면 판매가·도감 연동이 끊긴다.
4. 씬은 레거시 FieldScene 계열 — **신규 기능은 RegionFieldScene 쪽에 배선**(B4 이중 경로 부채).
