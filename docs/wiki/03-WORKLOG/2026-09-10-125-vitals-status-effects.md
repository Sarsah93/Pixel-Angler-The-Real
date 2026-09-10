# 125차 — 성장·생존 P2: 생존 지표(허기·수분·피로) + 상태이상 11종 + 세이브

| | |
|---|---|
| **날짜** | 2026-09-10 |
| **시스템** | `진행` `데이터` `필드` `인벤` `세이브` |
| **트리거** | 로드맵 — PROGRESSION_SURVIVAL_SPEC v2 §11 **P2**(124차 P1 후속) |
| **커밋** | 미커밋 (123·124차분과 함께 사용자 직접 커밋 예정) |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

124차에서 P1(레벨 200 곡선·활동 XP·스킬 83노드)을 마쳤고, 사용자가 "계속해서 진행"을 지시했다.
스펙 §11의 다음 단계가 **P2 — core `Vitals.ts`/`StatusEffects.ts` + `GameState.vitals` 세이브**다.

기존 상태는 `player.stamina`(HP)·`player.fatigue`(피로도) 두 값만 있었고, 그마저도
**소모되는 곳이 사고(차량 충돌)·채집 부상뿐**이라 생존 압박이 없었다. 허기·수분은 아예 없었다.

## 2. 원인 — *(버그 아님 — 신규 구현)*

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `packages/core/src/types/Vitals.ts` | `VitalsState` · 활동 드레인 `tickVitals` · 행동 비용 `applyVitalsAction` · `applyIntake`/`applySleep` · 임계 판정(`isVitalsLow`·`vitalsSpeedMult`·`vitalsFatigueMult`) · 온도 계수 |
| 신설 | `packages/core/src/types/StatusEffects.ts` | 11종 정의표(Ko/En) · `aggregateStatus`(효과 합산) · `tickStatuses`(진행 체인·자연치유) · `addStatus`/`cureStatus`(재발 롤) |
| 수정 | `packages/core/src/config/tuning.ts` | `TUNING.vitals`(드레인 6 · 행동 비용 8 · 임계 · 온도 · 수면) · `TUNING.status`(진행 주기/확률·자연치유·재발·회복기) |
| 수정 | `packages/core/src/index.ts` | Vitals·StatusEffects export |
| 수정 | `client-pc/src/store/GameState.ts` | `maxHp`(= 100 + ⌊Lv×0.5⌋ + `stamina_max` − 상태이상) · `maxFatigue` · `vitals` 뷰 + `commitVitals` · `tickVitals`/`applyVitalsAction`/`applyIntake`/`sleepRecover` · `statuses`/`addStatus`/`cureStatus`/`statusModifiers` · `moveSpeedMult`/`canRideBike` · `SaveData.vitals` |
| 수정 | `client-pc/src/store/InventoryStore.ts` | `InvItem.hungerRestore`/`hydrationRestore`/`hpRestore` |
| 수정 | `client-pc/src/data/ShopCatalog.ts` | 음식 12종에 회복치 부여 + **생수 500ml·주먹밥 신설**(편의점) |
| 수정 | `client-pc/src/ui/InventoryPanel.ts` | '사용하기' = 실제 회복 적용(`applyIntakeOf`) · **'나쁨' 음식 섭취 허용 + 식중독 롤 30%**(부패는 계속 금지) |
| 수정 | `client-pc/src/scenes/RegionFieldScene.ts` | 매 프레임 `tickVitals`(idle/walk/bike/forage 자동 판정 · 체감온도 주입) · 이동 속도에 `moveSpeedMult` 곱 · 캐스팅 1회 비용 · 고갈/상태이상 로그 |
| 수정 | `client-pc/src/scenes/FirstPersonFishingScene.ts` | 낚시 중 idle 드레인(가이드 열람 중 정지) · 파이팅 성공/실패 비용 |
| 수정 | `client-pc/src/scenes/field/ForageSystem.ts` | `isHolding` 게터(채집 드레인) · **미끄러짐 → 골절 20%/출혈 35% · 맨손 부상 → 생물중독(독성종)·출혈 60%** 승격 |
| 수정 | `client-pc/src/scenes/HomeInteriorScene.ts` | 침대 '쉬기' 2종 → `sleepRecover()` 실회복 + 결과 문구 |
| 수정 | `client-pc/src/ui/ButcheryPanel.ts` · `SashimiPanel.ts` · `scenes/WorldMapScene.ts` | 손질/회뜨기/출조 행동 비용 |

### 시계 규약 (⚖ 핵심)

드레인은 **활동 세션 시간**으로만 진행한다. 저장 구조에 타임스탬프가 없고, 씬 `update()`가
**일시정지·모달 가드(`uiBlocked`/`isTransitioning`) 뒤에서만** `tickVitals`를 부르므로
오프라인·메뉴·팝업 중에는 아무 일도 일어나지 않는다(쿨러·인벤의 `savedAtMs` 정지와 같은 결과를
더 단순한 방법으로 얻는다 — 로드 시 보정 코드 자체가 불필요).

## 4. 구조상 위치

`S21 진행(성장·생존) → P2 생존 지표·상태이상`.

- **계약**: `Vitals.ts`·`StatusEffects.ts` 신설 · `InvItem` 필드 3종 추가(선택 필드 — 구세이브 무영향).
- **데이터**: `TUNING.vitals`/`status` · 음식 회복치.
- **판정**: 드레인·임계·온도·상태이상 진행/치유 — 전부 core.
- **렌더**: 없음(P3에서 상태 패널 '대' 개편으로 노출). 현재는 지역 채널 로그로만 보인다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 드레인 표(§4-2) 5종·앉기 회복·행동 비용·임계·0% HP·온도·수면·섭취·상태이상 11종/체인/합산/재발 | core 수치 스크립트(`scratchpad/verify_p2_core.mjs`) | **44/44 PASS** (표 값 ±0%) |
| GameState 배선 — 씬 드레인 가동·행동 비용·섭취·수면·골절 효과·치료·maxHp·세이브 왕복 | 실렌더(Playwright, `verify_p2_render.mjs`) | **12/12 PASS** · pageerror 0 |
| 인게임 표시 | 스크린샷 육안 | 지역 채널에 `[경고] 허기·수분이 바닥났습니다 — 체력이 줄고 있습니다` 실출력 확인 |
| 빌드 | `pnpm run build` + client typecheck | 3/3 · 0 오류 |

재현: `node scratchpad/verify_p2_core.mjs` · `node scratchpad/verify_p2_render.mjs`(dev 서버 필요).

⚠ 실렌더에서 새 게임 직후 허기가 정확히 100이 아니라 99.9997인 것은 **씬 드레인이 이미 돌고 있다는 증거**다
(첫 어서션을 그 기준으로 고쳤다).

## 6. 잔여 — 이번에 안 한 것

- **UI 없음** — 허기·수분 바, 상태이상 아이콘 스트립, 호버 팝업은 **P3**(상태 패널 '대' 개편).
- **기절·사망 FSM** — `tickVitals`가 `fainted` 신호를 반환하지만 소비처가 없다. **P4**.
- **치료 아이템·병원** — `cureStatus`는 있으나 붕대·부목·상비약 아이템과 병원 POI가 없다(P5·P7).
- **스킬 배선** — `life_hunger`/`life_thirst`/`life_sleep`/`life_immune` 등은 `wired:false` 유지. **P5**.
- 음식 회복치는 대표 12종 + 신규 2종만 입력(전수 일괄 입력은 **P9**). 요리/제작 행동 비용도 P7 이후.

## 7. 위험·부작용

- **매 프레임 객체 생성** — `GameState.vitals`(스냅샷)·`statusModifiers`가 프레임마다 작은 객체를 만든다.
  상태이상이 보통 0개라 루프 비용은 사실상 0이지만, 프로파일에서 GC가 보이면 캐시할 자리다.
- **기존 HP 소비처와 공존** — 차량 충돌·채집 부상은 여전히 `updatePlayer({stamina})`로 직접 깎는다.
  `vitals.hp`는 그 값을 그대로 읽으므로 충돌은 없다(원본이 하나이기 때문).
- **최대치 하락 시 즉시 클램프** — 골절·감기 부여 시 현재 피로도가 새 상한을 넘으면 잘린다(설계 의도).
- 구세이브: `vitals` 필드가 없으면 **만복(100/100)·상태이상 없음**으로 시작. 데이터 손실 없음.
- '나쁨' 음식이 이제 섭취 가능해졌다 — 구 동작(차단)에 의존한 UX는 없지만 식중독이 실제로 붙는다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/progression.md` §2·§4·§5·§6 갱신
- [x] `04-BACKLOG.md` H 항목 P2 완료 반영
- [x] `AGENTS.md` §9 요약 + 링크
- [x] `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 이어받기 갱신
- [x] 새 함정 → `progression.md` §6 (활동 시간 규약 · 드레인 호출 위치)
