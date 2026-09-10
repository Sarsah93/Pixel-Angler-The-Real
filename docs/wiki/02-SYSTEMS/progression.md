# S21 진행 — 면허 · 스킬 · 일지 (L / K / J)

> 신설 2026-09-09 (122차) · 124차 P1 · 125차 P2 · **126차 P3·P4** 반영. 상태 🔶 —
> **레벨 200 곡선 + XP + 트리 83노드(Σ=200pt)** · **생존 지표 4종 · 상태이상 11종** ·
> **상태 패널 노출 + 기절·사망 FSM** 가동. 스킬 효과 실배선은 13/83 · 치료 수단은 P5·P7 미착수.

## 1. 목적·범위

- **책임**: 플레이어 성장의 세 축 — 면허(허가·권한 게이트) · 스킬(레벨 포인트로 사는 수치 배율) · 일지(스토리·퀘스트 열람).
- **책임**(124·125차 확장): 플레이어 레벨·XP(`Progression.ts`) + **생존 지표·상태이상**(`Vitals.ts`·`StatusEffects.ts`).
- **책임 아님**: 퀘스트 진행 판정(S17). 상태 패널 렌더는 S9 UI 소유지만 **생존 지표 표시 규격은 여기(126차 P3)**.

## 2. 구성

| 층 | 파일 | 역할 | 상태 |
|---|---|---|---|
| core 계약 | `types/Progression.ts` | `MAX_LEVEL 200` · `xpToNext(n)=round(25n^1.5)+75` · `cumulativeXp` · `catchXp`(희귀도×체장 0.5~3.0) · `activityXp` 5종 · `GRADE_XP_MULT` | ✅ 124 |
| core 계약 | `types/Skills.ts` | `SkillDef{tier,maxRank,costPerRank,requires,effect{key,perRank,mode},wired}` · `SkillRanks` · `skillPointsForLevel(level)` = 레벨×1 · effect key 78종 | ✅ 122·124 |
| core 데이터 | `db-schema/SkillDatabase.ts` | 카테고리 7(낚시 19 · 채집/통발 10 · 경제 10 · 운전/이동 10 · 생활 13 · **농사 9 = `locked`** · **제작 12 = `locked`**) — **Σ=200pt** + 무결성 검사(Σ·고아·티어당 ≤6) | ✅ 122·124 |
| core 튜닝 | `config/tuning.ts` `xp` | 희귀도 5단 기본 XP · 첫 발견 ×5 · 활동 기본 5종 · 준법 방생 ×0.5 | ✅ 124 |
| core 계약 | `types/Vitals.ts` | `VitalsState`(HP·피로·허기·수분) · 활동 드레인 6종 · 행동 비용 8종 · 임계 20% · 온도 계수 · 수면 | ✅ 125 |
| core 계약 | `types/StatusEffects.ts` | 11종 정의(Ko/En) · `aggregateStatus` · `tickStatuses`(진행 체인·자연치유) · `cureStatus`(재발) | ✅ 125 |
| core 튜닝 | `config/tuning.ts` `vitals`·`status` | 드레인·비용·임계·온도·수면 / 진행 주기·확률·자연치유·재발·회복기 | ✅ 125 |
| core 계약 | `types/License.ts` | `LicenseCategory` 6군(낚시·해루질·통발·토지/주거·선박/어업·사업) · 16종(122차 +7) · `nameEn/descriptionEn/plannedNote` | ✅ 122 |
| client 상태 | `store/GameState.ts` | `skillTree` 세이브 · `canLearnSkill/learnSkill` · `skillMult/skillBonus` · **`grantXp`·`addActivityXp`·`addLawfulReleaseXp`** · **`vitals`/`maxHp`/`maxFatigue`·`tickVitals`·`applyVitalsAction`·`applyIntake`·`sleepRecover`·`statuses`·`moveSpeedMult`** | ✅ 122·124·125 |
| client 배선 | `RegionFieldScene`·`FirstPersonFishingScene`·`ForageSystem`·`HomeInteriorScene`·`InventoryPanel` | 드레인 틱(활동 자동 판정) · 행동 비용 5곳 · 음식 회복치 · 침대 수면 · 채집 부상 → 상태이상 승격 | ✅ 125 |
| client UI | `ui/LicensePanel.ts` | 720×500 · 카테고리 그룹 윈도우드 목록(휠·스크롤바·`n–m / N`) · 요구사항(`checkUnlockRequirements`) · 발급 · `plannedNote` | ✅ 122 재작성 |
| client UI | `ui/SkillTreePanel.ts` | 1080×656 · 좌 카테고리 · 우 티어 열 트리(선행선·Lv 라벨) · 하단 상세 + [배우기] · 상태 5종 | ✅ 122 |
| client UI | `ui/JournalPanel.ts` | 스토리(프롤로그 준비 중) / 메인(tutorial+license) / 서브(activity+achievement) · 상세(목표·보상·선행·상태 칩) | ✅ 122 골격 |
| client 입력 | `scenes/RegionFieldScene.ts` | `keydown-L/K/J` → `togglePanel` · ESC LIFO 편입 | ✅ 122 |

## 3. 동작 구조

```
XP: 어획 catchXp(희귀도×체장, 첫 발견 ×5) · 활동 activityXp(손질/회 ×등급, 채집) · 준법 방생 ×0.5
    ──▶ GameState.grantXp ──▶ while(exp ≥ xpToNext(level)) 레벨업 · MAX_LEVEL 200 캡 (만렙 = 200SP = 트리 전체)

레벨 N ──skillPointsForLevel──▶ 총 포인트 N
                                  − skillPointsSpent(ranks) = 사용 가능
canLearnSkill(id): 알 수 없음 → 카테고리 잠김 → 최대 랭크 → 선행(requires {id,rank}) → 포인트 부족 → ok
learnSkill(id): ranks[id]++ · markDirty   (세이브 `skillTree`)
소비: GameState.skillMult('cast_distance') 등 — 배우기 전 1.0 (기존 수치 불변)

생존(125차): 씬 update() ──(활동 시간만)──▶ GameState.tickVitals(dt, activity, {feelsLikeC})
   허기·수분 −드레인 · 피로 +가중 · 상태이상 진행/자연치유 · 0% → HP −2/분 → starving/fainted 신호
행동(캐스팅·파이팅·손질·회뜨기·출조) ──▶ applyVitalsAction   섭취 ──▶ applyIntake   침대 ──▶ sleepRecover
```

**실배선 13/83** (`wired: true` — 124차 신설 39노드는 전부 `wired: false` 예정): `fish_cast`(캐스팅 완력) · `fish_bite` · `fish_weather` · `fish_night`(FP 입질 배율) ·
`gath_eye`(스팟 반경) · `gath_knot`(통발 분실) · `gath_hands`(맨손 부상) · `gath_octo`(문어 도주) ·
`eco_haggle`(구매가 −3%/랭크) · `eco_regular`(판매가) · `drv_run` · `drv_bike`(이동 속도) · `life_balance`(미끄러짐).
나머지는 `wired: false` — 패널에 '예정' 태그, 배우기는 가능(포인트 소모).

면허: `LICENSE_CATEGORY_ORDER`로 그룹 · `fishery_member`(어촌계원)만 122차 실효과(조례 면제) · 나머지 신규 6종은 `plannedNote`.

## 4. 세부과제 현황

| 과제 | 상태 | 차수 |
|---|---|---|
| 스킬 계약·DB·포인트·학습 판정·세이브 | ✅ | 122 |
| **레벨 200 곡선 + 어획/활동 XP (스펙 P1)** | ✅ | 124 — `Progression.ts`·`grantXp`·배선 4곳 |
| **트리 83노드 Σ=200 + 제작 카테고리(잠금)** | ✅ | 124 — 기존 44노드 id·비용 보존(세이브 호환) |
| 스킬 패널(트리·선행선·상세·배우기) | ✅ | 122 · 124(행 간격 동적 압축 — 티어 6노드) |
| 스킬 효과 실배선 | 🔶 **24/83** | 122(13) · **127(+11 — 생활 6·채집 속도·정투·바람 읽기, 스펙 P5)** |
| 면허 카테고리화 + 신규 7종 + 패널 재작성(스크롤) | ✅ | 122 |
| 신규 면허 효과 배선 | 🔶 1/7 | 어촌계원만 · 나머지 '예정' |
| 일지 패널 골격(스토리·메인/서브) | ✅ | 122 |
| 스토리·퀘스트 본편 | ⬜ | S17 — 사용자 방침 "모든 컴포넌트 후" |
| 농사 카테고리 해제 | ⬜ | 농장 경영(S8 E1~) 착수 시 `locked: false` |
| 제작 카테고리 해제 | ⬜ | U 창 '제작' 탭(스펙 P7) 구현 시 `locked: false` |
| **생존 지표 4종 + 상태이상 11종 (스펙 P2)** | ✅ | 125 — core 2종 + 세이브 + 배선 9곳 |
| **상태 패널 '대' 개편(경험치·허기/수분 바·호버 팝업·상태이상 스트립)** | ✅ | 126 — `barRects` 단일 소스 · '중/소' 회귀 0 |
| **기절·사망 FSM + 연출** | ✅ | 126 — `CollapseOverlay` · `TUNING.collapse` · 눕기 스프라이트는 플레이스홀더 |
| **날씨 캐스팅 물리(비거리·산포·횡풍) + 조준 홀드 가이드 (스펙 P6)** | ✅ | 127 — core `CastWeather.ts` · `speedMult`·`solveCastPower` |
| **스킬 포인트 환급(리스펙)** | ✅ | 127 — '조업 재교육 이수증'(직판장 20만원) → `GameState.resetSkills` |
| 도움말 `cast-scatter` planned → ready | ✅ | 127 — P9의 부분 선반영(구현된 토픽만) |
| **상태이상·생존 지표 픽셀 아이콘 + 앵커 호버 팝업** | ✅ | 128 — `PixelIconArt` 13종 · `StatusBadge.icon` · 텍스트 약어 제거 |
| 상태이상 치료 아이템·병원 POI | ⬜ | P7 — 붕대/부목/상비약 + `amenity=hospital` |

## 5. 잔여·차기

- **확장 정본 = `.agents/PROGRESSION_SURVIVAL_SPEC.md`(123차 v2 · 124차 제작 정정)** — P1~P6 완료.
  **다음 = P7 제작(U '제작' 탭 핸드크래프팅 + 고급 제작대 [F]) → P8 퀘스트 XP → P9 도움말 ready 전환**.
  이후 대과제(사용자 확정 2026-09-10): 통발 심화 → 불요리 → 농장.
- **눕기 전용 스프라이트 대기** — 눈 감은 2프레임(man/girl). 현재는 idle 90° 회전 + 호흡 스케일 플레이스홀더.
- 스킬 59종 배선 대기(24/83) — 제작 12종은 P7, 농사는 농장 단계, 요리 계열은 불요리 단계에 `effect.key` 소비.
- 음식 회복치는 대표 14종만 입력(전수 일괄은 P9) · 요리·제작 행동 비용은 P7 이후.
- 요리(cook) 활동 XP — `activityXp('cook')` 산식만 존재, CookScene 실조리(불요리) 구현 시 배선.
- 스킬 툴팁 실효과 수치 표기(현재 설명 문구만) · 리스펙 아이템의 퀘스트 보상 지급 경로(P8).
- 퀘스트 진행 판정 + 일지 상태 실갱신(현재 `GameState.quests` 상태만 읽음) — 스펙 P8.

## 6. 함정·불변조건

1. **효과 소비처는 `GameState.skillMult/skillBonus`만** — 랭크를 직접 읽어 계산하지 말 것(배선 여부·mode를 한 곳에서 관리).
2. **`wired: false` 스킬은 배우기가 막히지 않는다**(포인트만 소모) — 실배선 전에 툴팁 '예정'을 지우지 말 것.
3. `skillPointsForLevel`을 바꾸면 기존 세이브의 사용 포인트가 총량을 넘을 수 있다 — `skillPointsAvailable`은 0 하한이지만 환급 로직은 없음.
4. 면허 `category`는 필수 — 빠지면 패널 그룹에서 조용히 사라진다(`LICENSE_CATEGORY_ORDER` 순회).
5. 패널 3종은 `openPopup` 경유 → **새 팝업이 밴드 최상단**(122차 `raiseToTop`) · ESC LIFO. 직접 `add.existing`으로 띄우지 말 것.
6. **게이지 rect는 `RegionHud.barRects()` 하나만 본다**(126차) — 렌더와 호버 히트가 같은 소스를 써야
   레이아웃 수정 시 툴팁 판정이 어긋나지 않는다. 새 게이지는 이 함수에 행을 추가하는 방식으로만 늘린다.
   허기·수분은 라벨 Text 대신 **픽셀 아이콘**을 쓴다(`VITAL_LABEL[key].icon`) — `vitalLabels` 맵에
   들어가지 않으므로 라벨을 전제한 코드를 새로 쓰지 말 것(128차).
7. **쓰러짐 연출은 씬을 넘기지 않는다**(126차) — `collapsing`이 `uiBlocked`에 들어가므로 정리를 빠뜨리면
   조작이 영구 잠긴다. `create()`·`shutdown` 양쪽에서 `collapseCleanup?.()` + `collapsing = false`.
   1인칭에서 기절·사망이 나면 **필드 씬이 연출을 전담**한다(캐릭터 스프라이트가 거기 있다).
8. **부활은 저장하지 않는다** — `markDirty()`만. 저장은 집 침대에서만이라는 정책(`TUNING.save.allowedTags`)을 건드리지 말 것.
9. **스킬 트리 배치 제약(124차): 티어 0~3 · 티어당 최대 6노드** — `SkillTreePanel.nodePos`가 6노드에서 행 간격을
   92→≈78px로 압축하는데 7노드부터는 dy < NODE_H(72)로 겹친다. DB 하단 무결성 검사가 초과를 console.warn.
10. **드레인은 "활동 시간"만** — `tickVitals`는 씬 `update()`의 **일시정지·모달 가드 뒤**에서만 부른다.
   저장 구조에 타임스탬프가 없으므로(설계) 가드 앞에서 부르면 메뉴·팝업 시간까지 소모되고,
   오프라인 정지 규약이 깨진다. 새 씬을 추가하면 그 씬의 활동 종류를 정해 같은 자리에서 부를 것.
11. **HP 원본은 `player.stamina`** — `vitals.hp`는 그 값을 읽는 뷰다. 새 코드에서 HP를 따로 들고 있지 말 것.
12. **XP는 반드시 `GameState.grantXp` 경유** — `player.experience`를 직접 더하면 레벨업·만렙 캡·markDirty를 놓친다.
   임계는 `xpToNext(level)`(core) — 구 `level×100` 식을 어디에도 되살리지 말 것.
13. **캐스팅 날씨 계수는 `computeCastWeather` 한 곳에서만 만든다**(127차) — 발사·조준 미리보기·파워 역산
   **세 경로가 같은 계수**를 써야 예상 착수 마커가 거짓말을 하지 않는다.
14. **비거리 배율은 완력이 아니라 `speedMult`(수평 속도 전체)에 먹인다**(127차) — 완력은 초기 속도의 15%뿐이라
   `strength × 0.73`은 실제 비거리를 **7%밖에** 안 줄인다(실측 466px → 431px). `speedMult`로는 466 → 332px.
15. **맞바람 손실과 횡풍 밀림을 이중으로 넣지 말 것**(127차) — 비거리 감소는 `distanceMult`(발사 시점),
   옆으로 밀림은 `crossWind`(비행 중 가속). `windForce`가 **횡 성분만** 넘기는 이유다.
16. **풍향은 "불어오는 방향"**(기상청 관례 — 북동풍 = 45) — 진행 방향은 +180°.
   변환은 `windUnitFromBearing` 하나만 쓴다(화면 y는 아래로 증가: `{-sin, +cos}`).
13. **상태이상 배지는 텍스트 약어가 아니라 픽셀 아이콘**(128차 사용자 지시) — `StatusBadge = { icon, color }`.
    신규 상태이상을 추가하면 `tools/gen_pixel_icons.py`에 **같은 id로 아트를 그리고 재생성**해야 한다
    (아트가 없으면 칩만 그려지고 그림이 빠진다 — `addPixelIcon`이 null을 돌려준다).
