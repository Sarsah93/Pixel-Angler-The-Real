# 두족류 손질 트리 v3 — 4종 통합 (무늬오징어 · 한치 · 갑오징어 · 문어)

> 대상: core `types/Butchery.ts` · `cephalopod/` 모듈 · `buildCephalopodStages` · client `ButcheryPanel` / `CephalopodTemplateRenderer` / `tuning.ts` · 실행: Antigravity IDE agent
> 관계: `ButcheryFamily 'cephalopod'` 스텁 해제. 기존 어류 손질 파이프(`CutPoint`·`ButcheryStage`·`evaluateCut`·ButcheryPanel 부산물 팝업)를 **그대로 재사용**한다.
> ⚠ **먼저 §0.5(코드 정합 v3.1 패치)를 읽을 것** — v3 본문은 레포 접근이 끊긴 상태에서 작성돼 식별자·심볼 다수가 실제 코드와 다르다. 충돌 시 §0.5가 우선한다. (v3이 참조한 `SASHIMI_GUIDE_OVERLAY_SPEC.md`는 이 레포에 존재하지 않는다.)
> 시각 기준(4시트, 각 패널 = 스테이지 1개의 픽셀 레퍼런스):
> `squid_guide.svg` (무늬오징어 13패널) · `hanchi_guide.svg` (한치 14패널) · `gapo_guide.svg` (갑오징어 12패널) · `octo_guide.svg` (문어 11패널 + 정보카드 5장)
> 원본: `무늬오징어 손질.pdf` 11컷 · `한치창꼴뚜기 손질.pdf` 13컷(⑬은 회뜨기 공정이라 미사용) · `갑오징어 손질.pdf` 10컷 · `문어 손질 과정.pdf` 11컷 + 사용자 지정 시메 2단계(오징어류 3종).

---

## 0. 요지 · v2에서 무엇이 바뀌었나

v2는 무늬오징어 1종 13스테이지 단독 문서였다. v3은 **한 문서에서 4종을 다룬다.** 종마다 별도 스펙 문서를 만들면 공통 FSM·부산물·수율 규칙이 네 벌로 복제되어 곧 어긋난다. 대신 트리만 `kind`별로 분기하고 나머지는 전부 공유한다.

v2 대비 확정된 변경은 다섯 가지다.

**`kind`가 3분기가 되고 트리도 3분기가 된다.** `squid`(무늬오징어·한치) / `cuttlefish`(갑오징어) / `octopus`(문어). 같은 `squid`라도 무늬오징어와 한치는 스테이지 수가 다르므로(13 vs 14), 트리는 `kind`가 아니라 **`speciesId`로 고른다.** `kind`는 렌더러와 프로필 기본값을 고르는 데만 쓴다.

**문어는 칼을 한 번도 쓰지 않는다.** 실사 11컷 어디에도 절삭 공정이 없다. `octo_guide.svg`에 빨간 절개선 오버레이가 하나도 없는 것이 그 근거다. 문어 트리는 `invert`·`drag_out`·`salt_apply`·`hold_scrub`·`wash`·`flip`·`result`만으로 구성된다. 시메 스테이지도 없다 — 사진에 없는 공정을 넣지 않는다는 규칙을 문어에도 그대로 적용했다.

**뷰 상태 유니온이 둘로 갈라진다.** 오징어류의 `CEPH_OPEN`·`CEPH_SKIN_UP`은 "몸통을 갈라 펼친 시트"를 전제하는데, 문어는 개복 자체를 하지 않는다. `OctopusOrientation` 3종을 따로 만들고 `CephOrientation`은 오징어·갑오징어 전용으로 남긴다.

**신규 프리미티브 3종 + 뷰 반전의 정식화.** `bone_lift`(갑오징어 갑 들어내기), `invert`(문어 외번), `salt_apply`(소금 도포)를 추가한다. v2에서 S8의 "장축 180° 회전"을 `lift_flap` 안에 묻어두었던 것을 꺼내 `flip` 프리미티브 + `StageDef.flipBefore` 필드로 정식화한다.

**부산물이 8종 늘어난다.** `ceph_tentacle`·`ceph_cuttlebone`·`ceph_inner_skin`(오징어류·갑오징어) + `octo_viscera`·`octo_ink_sac`·`octo_beak`·`octo_slime`·`octo_whole`(문어).

v2에서 유지되는 결정: 먹물주머니 별도 정밀 컷 없음, 실패가 스테이지를 막지 않고 결과물 질만 떨어뜨림, 채썰기는 이 트리 밖(P2-1 슬라이싱 트리 소관).

---

## 0.5 코드 정합 — v3.1 패치 (2026-08-05, 레포 실측)

스펙 v3은 레포 접근이 끊긴 상태에서 작성돼 **가정한 식별자·심볼이 실제 코드와 여러 곳에서 어긋난다.** 구현 전에 이 절에서 전부 확정한다. 아래 표가 v3 본문보다 우선한다.

### 0.5.1 speciesId — 4건 확정 (본문 전체 치환 완료)

| v3 가정 | 실제 코드 id | 확인 |
|---|---|---|
| ~~`bigfin_reef_squid`~~ | **`squid`** | 파일명만 `bigfin_reef_squid.png`. 텍스처 키는 `fish_squid` |
| ~~`golden_cuttlefish`~~ | **`cuttlefish`** | 학명 *Sepia esculenta* — v3 가정과 동일 |
| ~~`common_octopus`~~ | **`octopus`**(참문어·돌문어) | 학명 현재 *Octopus vulgaris* |
| `swordtip_squid` | **`swordtip_squid`** ✅ | 79차 4계층 등록 완료 (v3 §12가 요구한 `SWORDTIP_SQUID_DB_SPEC` 항목 해소) |

트리 상수명(`BIGFIN_TREE` 등)은 식별자일 뿐이라 그대로 둔다. **`giant_octopus`(대문어)는 v3 범위 밖** — 참문어 트리를 그대로 공유시키되(`getCephalopodProfile`이 `octopus` 프로필로 폴백), 크기 편차가 커 수율만 프로필 배율로 조정한다. 별도 트리를 만들지 않는다.

### 0.5.2 심볼 대조표 — v3 이름 → 실제 코드

| v3 표기 | 실제 코드 | 비고 |
|---|---|---|
| `FishUV { u, v }` | **`CutPoint { x, y }`** (`types/Butchery.ts`) | 정규화 0~1. **필드명이 다르므로 §4.6 상수는 `{x,y}`로 옮겨 적는다** |
| `StageDef` | **`ButcheryStage`** | |
| `StageDef.byproducts` | **없음** — 부산물은 `ButcheryTaskDef.yields` / `ButcherySectionDef.yields` | §0.5.4 참조 |
| `ByproductId` | **`ButcherySectionYield`**(core) + `InvItem.byproductKind`(client) | 두족류 18종을 양쪽에 추가 |
| `evaluateStroke` / `evaluateSlit` / `evaluatePeel` | **`evaluateCut`** (`ButcheryProcess.ts`) | 커버율 + 평균 이탈 판정. 신규 프리미티브는 여기에 형제 함수로 추가 |
| `ByproductPopup.ts` | **`ButcheryPanel` 인라인 부산물 팝업** | 별도 파일 아님. `forced` 처리는 이 팝업에 추가 |
| `computeSashimiGrade` | **`computeFilletYield`** 내부 등급 산출 | 특/상/중/하 배율은 기존 규칙 재사용 |
| `FISH_DATABASE.spawningMonths` | **존재하지 않음** | §0.5.3 |
| `tuning.ceph` | 신설 (`config/tuning.ts`) | META 노출은 §10 목록대로 |

### 0.5.3 v3이 "기존/확정"으로 전제했으나 레포에 없는 것

1. **v2 문서(`SASHIMI_GUIDE_OVERLAY_SPEC.md`)가 레포에 없다.** §3.1이 "v2에서 확정, 변경 없음"이라고 넘긴 `nerve_cut`·`mantle_slit`·`peel`·`result` 판정은 **§3.1 본문의 한 문단이 유일한 정의원**이다. 그 문단(중점 반경 + 스트로크 길이 0.03~0.12 / 커버리지 + 깊이 편차 / 연속 당김 거리 ÷ 목표 + 뗄 때마다 `peelBreaks` / `canAct()` 항상 true)을 정의로 채택해 구현한다.
2. **어류 프리미티브는 10종이 아니라 6종이다.** 실제: `tap` · `guided_cut` · `drag_fill` · `scoop` · `wash` · `peel`. v3이 "기존"으로 든 `slice` · `fin_cut` · `lift_flap` · `drag_out` · `vessel_cut` **5종은 존재하지 않으므로 v3 신규 7종과 함께 신설 대상**이다(총 12종 추가). 판정은 다음으로 정한다 — `lift_flap`/`drag_out`/`vessel_cut`/`fin_cut`은 §3의 신규 3종과 같은 계열(경로 추종 + 진행률)이라 `evaluateCut` 파생으로 충분하고, `slice`는 이 트리에서 쓰지 않으므로 만들지 않는다.
3. **산란기 데이터가 없다.** `FISH_DATABASE`엔 `peakSeasonMonths`(제철)만 있고 두족류의 오라클 `closedMonths`는 비어 있다. `ceph_gonad` 판정은 **`CephalopodProfile.spawningMonths` 필드를 신설**해 프로필이 직접 들고 있는다(어종 DB를 건드리지 않는다).
4. **소모품 2종 미등록** — `coarse_salt`(굵은소금) · `kitchen_towel`(키친타월). 인벤토리 시드 + 식자재마트 판매로 신설한다. 없을 때의 불이익(§3.4 · §4.3)이 스펙대로 동작하려면 "존재하되 안 살 수도 있는" 물건이어야 한다.

### 0.5.4 구조 결정 — 스테이지 ↔ 섹션·작업 매핑

v3은 스테이지 평면 나열이지만, 이 레포의 `ButcheryPanel`은 **섹션(순서 강제) → 작업(선택) → 스테이지** 3층과 그 위의 부산물 팝업·체크포인트·재장착에 강하게 결합돼 있다. 두족류는 다음으로 태운다.

- **스테이지 1개 = 작업 1개** (1:1). v3의 스테이지별 부산물이 `ButcheryTaskDef.yields`로 그대로 살아난다.
- 작업들을 논리 섹션으로 묶고 **전부 `anyOrder: false`**(두족류 공정은 순서가 고정이다). 섹션 경계는 v3의 `result` 스테이지 = 구간 종료 지점을 그대로 쓴다.
- `exitAfter`는 **몸통 순살이 확정되는 섹션 이후**에만 준다(오징어류 = 껍질 완료 / 문어 = 세척 완료). 그 전 이탈은 기존 규칙대로 원물 복구.
- `result` 프리미티브는 조작이 없으므로 작업 패널에서 **[확인] 버튼 1탭**으로 통과시킨다.

### 0.5.6 오징어류 부리 제거 스테이지 추가 (사용자 지시 2026-08-05)

v3은 부리를 **문어만** 따로 뽑고(`octo_beak_out`), 오징어류는 `ceph_head_split`의 3분할(머리·다리·먹물주머니)로 끝나 부리가 산출물에서 빠져 있었다. 실제 손질에서는 **오징어도 다리 밑동에서 부리를 빼낸다.** 다음을 추가한다.

- **신규 부산물 `ceph_beak`**(입/부리 — 폐기, 스택 20, 판매가 0). 문어의 `octo_beak`와 별개 id지만 성격은 같다. 에셋은 `trim_ceph_beak`(squid 폴더 `입(beak).png` — 오징어류 3종 공용).
- **신규 스테이지 `ceph_beak_out`** — `drag_out` · 뷰 `CEPH_PARTS` · 부산물 `ceph_beak ×1`.
  위치는 **머리부 처리 직후**: 무늬오징어·갑오징어는 `ceph_head_split` 다음, 한치는 `ceph_tentacle_cut` 다음(한치는 3분할이 없다).
  가이드 좌표 = `CEPH_BEAK_CENTER`/`CEPH_BEAK_PATH`(다리 밑동이 모이는 중심 → 바깥으로 뽑기).
  ⚠ 실사 사진에 없는 유일한 추가 스테이지다 — "사진 1컷 = 스테이지 1개" 규칙의 **명시적 예외**(사용자 지정)이므로 시트에도 카드 추가가 필요하다.
- 스테이지 수: 무늬오징어 13→**14** · 한치 14→**15** · 갑오징어 12→**13** · 문어 11(불변).
- 프로필 `beakRemoval`: 오징어류 3종 전부 **`'dedicated'`**(구 `with_head_split` / 한치 `none` 폐기).

### 0.5.7 촉완 vs 다리 — 별개 부산물 유지

`ceph_arms`(짧은 팔 8개)와 `ceph_tentacle`(긴 촉완 2가닥)은 **분리된 부산물**이다(한치는 전용 스테이지 `ceph_tentacle_cut`로 따로 자른다). 길이·식감·값이 달라 합치지 않는다. 전용 에셋이 올 때까지 아이콘만 `trim_ceph_arms`를 공용한다.

### 0.5.8 부산물 ↔ 에셋 대응 (2026-08-05 투입분)

| 에셋 (food assets/trimmings) | 부산물 id | 텍스처 키 |
|---|---|---|
| squid/무늬오징어, 한치 몸통살 | `ceph_mantle_fillet` (오징어·한치) | `trim_ceph_mantle_squid` |
| squid/갑오징어 몸통살 | `ceph_mantle_fillet` (갑오징어) | `trim_ceph_mantle_cuttlefish` |
| squid/무늬오징어, 한치 날개 | `ceph_fin_meat` | `trim_ceph_fin` |
| squid/무늬오징어 연골 | `ceph_pen` | `trim_ceph_pen` |
| squid/갑오징어 뼈 | `ceph_cuttlebone` | `trim_ceph_cuttlebone` |
| squid/다리 | `ceph_arms` (+ `ceph_tentacle` 공용) | `trim_ceph_arms` |
| squid/머리 | `ceph_head` | `trim_ceph_head` |
| squid/입 | **`ceph_beak`** (신규) | `trim_ceph_beak` |
| squid/내장 주변부 | `ceph_ink_sac` · `ceph_gonad` (+ `ceph_head_mass` 대체) | `trim_ceph_viscera` |
| octopus/손질된 문어 | `octo_whole` | `trim_octo_whole` |
| octopus/문어 내장 | `octo_viscera` (+ `octo_ink_sac` 공용) | `trim_octo_viscera` |
| octopus/입 | `octo_beak` | `trim_octo_beak` |

**전용 에셋 미보유**: `ceph_skin` · `ceph_gill` · `ceph_inner_skin` (아이콘 없이 텍스트 표기 — 추후 투입 시 `icon`만 추가).
종별 분기가 필요한 것은 `cephByproductIcon(id, speciesId)`가 해소한다(현재 몸통 순살 1건).

### 0.5.5 시각 정본 — SVG 4장

4개 시트는 **4px 셀 픽셀아트를 `<rect>`로 그린 1438×1518 캔버스**다(패널당 76×40 셀 = 304×160px). 52차 돔류가 `sashimi_pixel_guide.svg`에서 스테이지 뷰를 자동 추출한 것과 같은 방식으로, 패널 바운딩박스 안의 rect를 4px 그리드에 스냅해 **`data/PixelCephStages.ts`를 생성**한다(신규 도구 `tools/gen_ceph_stages.cjs`). trimmings 실사 에셋은 사용자 제공 예정이므로, 그 전까지 부산물 아이콘도 시트의 해당 패널 크롭을 쓴다.

---

## 1. 원본 대응표 (감사 추적용)

Antigravity가 스테이지를 임의로 병합하지 않도록 사진↔스테이지 1:1 대응을 코드 주석에 그대로 남긴다. **`S1`~`S14`는 스테이지 번호, `①`~`⑬`·`시메①②`는 사진 번호다. 섞어 쓰지 않는다.**

### 1.1 무늬오징어 (`squid`) — 13스테이지 / 실사 11컷

시메①② + PDF ①~⑪이 **순서 그대로** S1~S13이 된다. 병합·생략·삽입·재배치가 하나도 없는 유일한 종이다.

| S | 사진 | id | 근거 |
|---|---|---|---|
| 1 | 시메① | `ceph_shime_mantle` | 사용자 3번 — 갑–눈 사이 신경 차단 |
| 2 | 시메② | `ceph_shime_arms` | 사용자 3번 — 눈–다리 사이 신경 차단 |
| 3 | ① | `ceph_mantle_open` | 몸통 절개 |
| 4 | ② | `ceph_mantle_spread` | 펼치기 · 내장 노출 |
| 5 | ③ | `ceph_viscera_pull` | 머리를 들어올려 내장 분리 |
| 6 | ④ | `ceph_split_check` | 분리 결과 확인 |
| 7 | ⑤ | `ceph_pen_out` | 오징어뼈(연골) 제거 |
| 8 | ⑥ | `ceph_flip_skin` | 뒤집어 껍질 시작점 잡기 |
| 9 | ⑦ | `ceph_skin_peel` | 껍질 분리 |
| 10 | ⑧ | `ceph_skin_done` | 껍질 분리 완료 |
| 11 | ⑨ | `ceph_gill_wash` | 아가미 제거 · 내장면 닦기 |
| 12 | ⑩ | `ceph_fin_off` | 날개 제거 |
| 13 | ⑪ | `ceph_head_split` | 머리부 3분할 |

### 1.2 한치·창꼴뚜기 (`swordtip_squid`) — 14스테이지 / 실사 13컷 중 12컷 사용

| S | 사진 | id | 근거 |
|---|---|---|---|
| 1 | 시메① | `ceph_shime_mantle` | 사용자 1번 — 무늬오징어와 동일 |
| 2 | 시메② | `ceph_shime_arms` | 사용자 1번 |
| 3 | ① | `ceph_mantle_open` | 몸통–머리 사이 공간에 칼/가위를 넣어 몸통 끝까지 절개 |
| 4 | ② | `ceph_mantle_spread` | 몸통 개방, 내장 노출 |
| 5 | ③ | `ceph_viscera_pull` | 다리·머리를 잡고 내장을 위로 뜯어냄 |
| 6 | ④ | `ceph_split_check` | 아가미를 제외한 내장부가 다 뜯어진 상태 |
| 7 | ⑤ | `ceph_pen_gill_out` | 가운데 뼈 제거 **+ 아가미 제거**(사용자 지정 병합) |
| 8 | ⑥ | `ceph_flip_skin` | 뒤로 뒤집어 몸통 꼭대기에서 머리 방향으로 껍질 시작 |
| 9 | ⑦ | `ceph_skin_peel` | 껍질 분리 진행 |
| 10 | ⑧ | `ceph_skin_peel_end` | 껍질이 거의 다 제거된 상태 |
| 11 | ⑨ | `ceph_skin_cut` | 완전히 떼기 직전 멈추고 경계면 절단 |
| 12 | ⑩ | `ceph_skin_done` | 절단 결과 확인 |
| 13 | ⑫ | `ceph_mantle_trim` | 내장면으로 되뒤집어 전체면 정리 |
| 14 | ⑪ | `ceph_tentacle_cut` | 촉완 2가닥 절단 — **사용자 지정으로 몸통 공정 뒤로 이동** |

사진 ⑬(몸통 세로 칼집)은 회뜨기 공정이므로 이 트리에서 제외했다(사용자 지정). 사진 ⑪과 ⑫의 순서를 바꾼 것도 사용자 지정이며, 그 외의 순서 변경·병합·삽입은 없다. ⑤의 아가미 병합만이 유일한 병합이고 이 역시 사용자가 "+ 아가미도 뜯어서 제거하는 과정으로 추가할 것"이라고 명시했다.

### 1.3 갑오징어 (`cuttlefish`) — 12스테이지 / 실사 10컷

| S | 사진 | id | 근거 |
|---|---|---|---|
| 1–2 | 시메①② | `ceph_shime_mantle` / `ceph_shime_arms` | 무늬오징어와 동일 |
| 3 | ① | `ceph_mantle_open` | 몸통 절개 |
| 4 | ② | `ceph_mantle_spread` | 펼치기 · 내장 노출 |
| 5 | ③ | `ceph_viscera_pull` | 내장 분리 — **아가미가 이때 동반 이탈** |
| 6 | ④ | `ceph_bone_membrane` | 갑을 덮은 막을 좌우로 젖힘 |
| 7 | ⑤ | `ceph_bone_out` | 갑 윤곽을 따라 판 전체를 들어냄 |
| 8 | ⑥ | `ceph_bone_check` | 갑 / 갑 자리 홈이 남은 몸통 |
| 9 | ⑦ | `ceph_flip_skin` | 장축 180° 회전 후 개복부 모서리에서 껍질 들춤 |
| 10 | ⑧ | `ceph_skin_peel` | 겉껍질 벗기기 |
| 11 | ⑨ | `ceph_inner_skin` | **속껍질 제거 (키친타월)** — 갑오징어 전용 |
| 12 | ⑩ | `ceph_head_split` | 머리부 3분할 |

사용자 설명은 "무늬오징어와 전체적으로 동일. 다만 뼈의 모양과 크기가 다름"이었다. 그 한 문장이 실제로는 스테이지 두 개(④⑤ 막 젖히기 + 갑 들어내기)와 속껍질 스테이지(⑨) 세 개의 차이를 만든다 — 갑은 얇은 펜과 달리 막에 덮인 강체 판이고, 갑오징어 껍질은 2겹이기 때문이다. 아가미 단독 제거 컷과 날개 제거 컷은 사진에 없으므로 만들지 않았다.

### 1.4 문어 (`octopus`) — 11스테이지 / 실사 11컷

| S | 사진 | id | 근거 |
|---|---|---|---|
| 1 | ① | `octo_head_invert` | 머리를 뒤집어 까는 과정 |
| 2 | ② | `octo_head_inverted` | 머리가 뒤집어 까진 사진 |
| 3 | ③ | `octo_viscera_seen` | 몸통(머리) 안에 내장이 보이는 사진 |
| 4 | ④ | `octo_viscera_pull` | 내장을 전부 뜯어서 제거 |
| 5 | ⑤ | `octo_flip_oral` | 입 부분이 정면으로 보이게 뒤집음 |
| 6 | ⑥ | `octo_beak_out` | 악판(이빨) 제거 |
| 7 | ⑦ | `octo_beak_done` | 분리된 악판 확인 |
| 8 | ⑧ | `octo_salt` | 굵은소금을 뿌림 |
| 9 | ⑨ | `octo_slime_scrub` | 빨판 부위까지 비벼 이물질 제거 |
| 10 | ⑩ | `octo_rinse` | 물로 세척 |
| 11 | ⑪ | `octo_done` | 손질 완료 — 머리를 되돌린 통마리 |

사용자 설명은 10항목인데 사진은 11컷이다. 10번("물로 한번 세척한 과정 → 손질 완료")이 사진 두 컷에 걸쳐 있다. 실사 ⑩은 **머리가 아직 뒤집힌 채로** 헹궈진 상태이고, ⑪에서 비로소 머리가 원래대로 복원된 통마리가 된다. 그래서 세척 **동작** 패널(S10)과 복원 **결과** 패널(S11)로 나눴다. 이렇게 해야 "사진 1컷 = 패널 1장"이 유지되고, 뷰 상태 전이(`OCTO_INVERTED → OCTO_WHOLE`)가 일어나는 지점도 명확해진다.

---

## 2. 좌표계와 뷰 상태

### 2.1 UV 규약 — 4종 공통

어류와 동일한 `FishUV {u, v}` 정규화를 쓴다. 기준 배치는 **다리·머리가 좌측(u=0), 몸통(외투막) 끝이 우측(u=1)**이다. 원본 사진 4종 전부 좌우가 반대지만, 돔류·방어류 가이드가 모두 "머리 좌측"이므로 캔버스 규약에 맞춰 정규화했다. 이는 개체를 뒤집는 것이 아니라 **템플릿 기준 방향의 선택**이므로 장축 180° 회전 불변(좌우 반전 금지) 규칙과 충돌하지 않는다.

**정규화 기준은 시트 그리드다.** 4개 시트가 모두 76×40 셀 캔버스에 그려져 있으므로 `u = x / 76`, `v = y / 40`이다. 몸 전장으로 정규화하지 않는 이유는 §4.6의 가이드 상수가 전부 시트 오버레이 좌표에서 뽑혀 나왔기 때문이다 — 두 정규화를 섞으면 상수와 표가 어긋난다. 따라서 몸 끝은 u=1.00이 아니라 0.93~0.95 언저리에 온다(캔버스 여백).

오징어류 3종은 랜드마크 표를 공유하고, 문어는 부위 구성이 달라 별도 표가 필요하다.

| u | 오징어류 부위 (무늬오징어 · 한치 · 갑오징어 공통) |
|---|---|
| 0.00 | 촉완·팔 끝 |
| 0.25 | 팔 밑동 — 머리부 앞단 |
| 0.33 | 눈 중심 |
| 0.39 | 머리–몸통 경계(외투막 입구) — **개복 절개의 시작점** |
| 0.45 | 누두(깔때기) — `CEPH_VENTRAL`에서만 보임 |
| 0.39 ~ 0.95 | 외투막 본체. 지느러미(날개)가 같은 구간 양측에 붙음 |
| 0.72 | 내장 덩어리 중심 — 소화선·먹물주머니·생식소 |
| 0.95 | 외투막 끝(몸통 꼭대기) — 껍질 벗기기 시작점 |

갑오징어의 갑과 오징어류의 펜은 둘 다 외투막 구간(u 0.39~0.95)의 중심선 위에 놓이지만 폭이 다르다. 펜은 v 0.48~0.52의 가는 막대이고, 갑은 v 0.34~0.66까지 퍼지는 넓은 타원판이다 — 이 폭 차이가 `bone_lift`가 `drag_out`과 다른 프리미티브여야 하는 이유다(§3.2). 정확한 윤곽 폴리곤은 `gapo_guide.svg` 패널 ⑤·⑥의 갑 실루엣에서 추출한다. 한치는 몸통이 길어 같은 u 구간이 실제로는 더 긴 거리에 대응하지만 정규화 좌표는 종에 관계없이 동일하다 — 실 픽셀 길이는 렌더러가 종별 종횡비로 늘린다.

| u | 문어 부위 |
|---|---|
| 0.00 | 팔 끝(8가닥) |
| 0.16 | 구면 중심 — 악판(입) 위치 |
| 0.30 | 팔 밑동이 모이는 웹(web) 경계 |
| 0.38 | 눈 중심 |
| 0.46 | 목(외투막 입구) — 외번의 기점 |
| 0.70 | 내장 덩어리 중심 |
| 0.93 | 외투막(머리주머니) 끝 |

문어의 v는 0=위쪽 가장자리, 1=아래쪽. `OCTO_ORAL`(구면 정면) 뷰에서는 팔이 방사형이라 u·v가 몸 축이 아니라 **화면 평면 좌표**로 의미가 바뀐다 — 이 뷰에서만 `guide.space: 'radial'` 플래그를 켜고 중심을 `{u:0.42, v:0.50}`으로 둔다.

### 2.2 뷰 상태 — 두 유니온

```ts
/** 오징어·갑오징어 — 개복해 펼치는 종. */
export type CephOrientation =
  | 'CEPH_DORSAL'    // 통몸통, 등(갑) 면이 위 — 시메 단계
  | 'CEPH_VENTRAL'   // 통몸통, 배(깔때기) 면이 위 — 개복 절개면
  | 'CEPH_OPEN'      // 개복 후 펼친 시트, 내장/아가미/연골(갑)이 보이는 면
  | 'CEPH_SKIN_UP'   // 펼친 시트, 껍질 면이 위 (장축 180° 회전 후)
  | 'CEPH_FLESH_UP'  // 펼친 시트, 살코기 면이 위
  | 'CEPH_PARTS';    // 도마 위 분리된 덩어리 배치 — 확인 전용

/** 문어 — 개복하지 않고 외번하는 종. */
export type OctopusOrientation =
  | 'OCTO_WHOLE'     // 통마리, 등(외투막 겉면)이 위
  | 'OCTO_INVERTED'  // 머리(외투막)가 뒤집힌 상태 — 속면이 밖
  | 'OCTO_ORAL';     // 구면(빨판·입)이 정면 — 방사 배치

export type ButcheryOrientation =
  | OrientationState        // 어류 5종
  | CephOrientation
  | OctopusOrientation;
```

전이 그래프:

```
오징어류  CEPH_DORSAL → CEPH_VENTRAL → CEPH_OPEN → CEPH_SKIN_UP → CEPH_FLESH_UP
문어      OCTO_WHOLE → OCTO_INVERTED → OCTO_ORAL → OCTO_WHOLE
```

`CEPH_PARTS`는 결과 확인 전용이라 체인에 끼어들지 않고 `result` 스테이지에서 잠깐 떴다가 이전 뷰로 돌아온다. 문어에는 `PARTS` 뷰가 없다 — 분리 결과물(내장·악판)이 한 덩어리씩이고, 확인 패널이 본체와 같은 화면에 함께 놓이기 때문이다.

문어의 `OCTO_WHOLE`은 S1과 S8~S11에서 두 번 등장하지만 **머리 상태가 다르다.** S8~S10은 "통마리 실루엣이되 머리는 뒤집힌 채"이므로 뷰 상태만으로는 렌더가 결정되지 않는다. `ButcheryProcess`가 들고 있는 `headInverted: boolean` 플래그를 렌더러가 함께 읽어야 한다. 실사 ⑩까지 머리가 뒤집혀 있고 ⑪에서 복원되는 것이 근거다.

### 2.3 뷰 반전의 정식화

v2는 "장축 180° 회전"을 S8 `lift_flap` 안에 묻어두었다. v3에서는 꺼낸다.

```ts
export type FlipKind =
  | 'longAxis180'   // 장축 180° 회전 — 등↔배 교대, 머리는 계속 좌측 (오징어류 S8/S9)
  | 'fleshUp'       // 껍질면 → 내장면으로 되뒤집기 (한치 S13)
  | 'oralUp'        // 구면(빨판·입)이 위로 오게 반전 (문어 S5)
  | 'headRestore';  // 외번했던 머리를 되돌림 — headInverted를 false로 (문어 S11)

interface StageDef {
  // …
  readonly flipBefore?: FlipKind;   // 이 스테이지 진입 시 선행 반전
}
```

`flip` 프리미티브는 **반전만 하고 끝나는 스테이지**에 쓴다(문어 S5). 반전 뒤에 다른 동작이 이어지는 스테이지(오징어류 `ceph_flip_skin`, 한치 `ceph_mantle_trim`)는 본 프리미티브를 유지한 채 `flipBefore`만 붙인다. 시트에 `prim='flip+lift_flap'`으로 표기된 것이 이 조합이다.

UI는 반전 종류마다 다른 배지를 띄운다. `longAxis180`은 **장축 회전 호(弧)** 아이콘 — 좌우 반전 아이콘(⇄)을 쓰면 안 된다. `oralUp`은 구면이 돌아나오는 회전 호. 배지 문구는 시트의 `flip` 오버레이 텍스트를 그대로 쓴다.

`headRestore`만 성격이 다르다. 나머지 셋은 도마 위 자세(뷰 상태)를 바꾸지만 `headRestore`는 자세가 아니라 **`headInverted` 플래그를 false로 되돌리는 형상 복원**이다. 뷰는 `OCTO_WHOLE`로 유지되고 실루엣만 S1 이전 모습으로 돌아간다(§2.2). 문어 S11에만 쓰이며, 조작 판정이 없는 연출이므로 배지 대신 복원 애니메이션 한 번으로 처리한다.

---

## 3. 프리미티브

기존 어류 10종(`tap`·`guided_cut`·`wash`·`peel`·`slice`·`hold_scrub`·`fin_cut`·`lift_flap`·`drag_out`·`vessel_cut`)을 최대한 재사용하고, 꼭 필요한 것만 추가한다.

```ts
export type ButcheryPrimitive =
  | /* 어류 기존 10종 그대로 */
  // ── v2 신규 ──
  | 'nerve_cut'    // 짧은 정밀 절단 1회. 위치 정확도 단독 판정(길이 무관)
  | 'mantle_slit'  // 강내 삽입 후 장축 롱드래그. 깊이 게이지 동반
  | 'result'       // 비조작 확인 프레임. 입력 없이 '확인' 1탭으로 통과
  // ── v3 신규 ──
  | 'bone_lift'    // 강체 판(갑)을 각도 유지한 채 통째로 들어냄
  | 'invert'       // 주머니를 안팎으로 뒤집음. 진행률 + 속도 판정
  | 'salt_apply'   // 영역 위에 입자 도포. 양(量) 밴드 판정
  | 'flip';        // 뷰 반전 단독. 반전 방향만 맞으면 성공
```

`peel`은 어류와 이름을 공유하되 판정 파라미터를 프로필에서 받는다(어류: 허용 중단 2회 / 두족류: 0회). 새 이름을 만들지 않는다.

### 3.1 v2 프리미티브 판정 (변경 없음)

`nerve_cut`·`mantle_slit`·`peel`·`result`의 판정 규칙은 v2에서 확정된 것을 그대로 쓴다(변경 없음). `nerve_cut`은 경로 중점 반경 `nerveTolerance` 안에서 시작 + 스트로크 길이 `0.03~0.12`, `mantle_slit`은 커버리지 + 깊이 편차 `slitDepthBand`, `peel`은 연속 당김 거리 / 목표 거리이고 포인터를 뗄 때마다 `peelBreaks += 1`, `result`는 `canAct()`가 항상 true다.

### 3.2 `bone_lift` — 갑 들어내기 (갑오징어 S7)

갑은 강체다. 각도를 크게 주면 부러져 파편이 살에 남는다. 판정은 **경로 추종이 아니라 각도 유지**다.

```ts
interface BoneLiftResult {
  progress: number;        // 앞끝(둥근 쪽) → 뒤끝(각침) 진행률
  maxAngleDeg: number;     // 들어올린 최대 각도
  fragments: number;       // 파손 조각 수
}
// maxAngleDeg > tuning.ceph.boneLiftAngleMax → fragments += 1
// fragments > 0 → mantleG ×= (1 - fragments × tuning.ceph.boneBreakPenalty)
//               → 이후 CEPH_FLESH_UP 스테이지의 요구 커버리지 +0.15 (파편 제거)
```

선행 스테이지 `ceph_bone_membrane`(S6, `lift_flap`)에서 막을 젖히지 않고 넘어오면 `boneLiftAngleMax`가 절반으로 좁아진다 — 막이 걸려 갑이 매끄럽게 빠지지 않는 상태를 이렇게 모델링한다.

각침(rostrum)이 몸통 끝을 뚫고 나와 있을 수 있으므로 진행 방향은 **앞끝 → 뒤끝** 고정이다. 반대로 끌면 즉시 `fragments += 1`.

### 3.3 `invert` — 외번 (문어 S1)

외투막 입구에 손가락을 넣어 끝을 안쪽으로 밀어 넣는 동작. 당기는 게 아니라 **미는** 입력이므로 `drag_out`과 방향 의미가 반대다.

```ts
interface InvertResult {
  progress: number;     // 목(u=0.46) → 외투막 끝(u=1.00) 정규화 진행률
  peakSpeed: number;    // 정규화 속도 최대값
  tears: number;        // 목 살 찢김 횟수
}
// peakSpeed > tuning.ceph.invertSpeedMax → tears += 1
// progress < tuning.ceph.invertProgressTarget 로 스테이지 통과 시
//   → 내장 접근 불가. S4 drag_out 의 요구 커버리지 +0.30
// tears > 0 → octo_whole 등급 1단계 하락 (외관 손상)
```

되돌리기가 가능한 유일한 스테이지다(사용자가 잘못 밀었을 때 원상복구). `StageDef.reversible: true`.

### 3.4 `salt_apply` — 소금 도포 (문어 S8)

영역 위를 훑어 입자를 뿌린다. 커버리지가 아니라 **양(量) 밴드** 판정이다. 적으면 점액이 안 떨어지고, 과하면 살이 짜지고 조직이 조여 등급이 내려간다.

```ts
interface SaltResult { amount: number; coverage: number; }
// amount ∈ tuning.ceph.saltAmountBand → 성공
// amount < band[0] → 다음 hold_scrub 의 slimeScrubTarget +0.20
// amount > band[1] → gradeMult ×= 0.94, freshness 변화 없음
// coverage < 0.7  → 덜 뿌려진 부위에 점액 잔존 표시(렌더 얼룩)
```

소모품 `coarse_salt`를 인벤토리에서 차감한다. 없으면 스테이지를 건너뛸 수 있고, 그 경우 `slimeScrubTarget`이 0.95로 올라가고 `slimeScrubCycles`가 2배가 된다 — **강제하지 않고 불리하게 만든다**는 v2의 원칙 그대로다.

### 3.5 `flip` — 뷰 반전 단독 (문어 S5)

드래그 방향이 반전 방향과 일치하면 성공. 실패 페널티 없음, 재시도 무제한. `freshness`도 깎지 않는다. 실질적으로는 "확인 + 방향 학습" 스테이지이므로 `result`에 가깝지만, 플레이어가 방향을 직접 만들어야 다음 뷰의 좌우 기준이 몸에 남는다.

---

## 4. 스테이지 트리 — `speciesId`로 분기

```ts
export function buildCephalopodStages(speciesId: string): readonly StageDef[] {
  const p = getCephalopodProfile(speciesId);
  switch (speciesId) {
    case 'squid': return BIGFIN_TREE;   // 13
    case 'swordtip_squid':    return SWORDTIP_TREE; // 14
    case 'cuttlefish': return CUTTLE_TREE;   // 12
    case 'octopus':    return OCTOPUS_TREE;  // 11
    default: throw new Error(`손질 트리 미등록 두족류: ${speciesId}`);
  }
}
```

`kind`로 분기하지 않는 이유는 §0에 적었다. 무늬오징어와 한치는 둘 다 `kind: 'squid'`인데 트리가 다르다.

### 4.1 무늬오징어 — 13스테이지

v2 §4와 내용이 같으나, v2 문서가 이 문서로 대체되었으므로 표를 여기에 다시 싣는다. v3 변경사항은 S8에 `flipBefore: 'longAxis180'`을 명시적으로 붙인 것 하나뿐이다.

| # | 사진 | id | primitive | 뷰 | 내용 | 부산물 |
|---|---|---|---|---|---|---|
| 1 | 시메① | `ceph_shime_mantle` | `nerve_cut` | CEPH_DORSAL | 갑–눈 사이 1차 신경 차단 | — (선도 +2단계) |
| 2 | 시메② | `ceph_shime_arms` | `nerve_cut` | CEPH_DORSAL | 눈–다리 사이 2차 신경 차단 | — (먹물 분출 위험 −60%) |
| 3 | ① | `ceph_mantle_open` | `mantle_slit` | CEPH_VENTRAL | 몸통–머리 사이에서 몸통 끝까지 절개 | — |
| 4 | ② | `ceph_mantle_spread` | `lift_flap` | CEPH_OPEN | 펼쳐 내장 노출 | — |
| 5 | ③ | `ceph_viscera_pull` | `drag_out` | CEPH_OPEN | 머리를 들어올려 내장 분리 | — |
| 6 | ④ | `ceph_split_check` | `result` | CEPH_PARTS | 분리 결과 확인 | `ceph_head_mass` ×1 |
| 7 | ⑤ | `ceph_pen_out` | `drag_out` | CEPH_OPEN | 오징어뼈(연골) 제거 | `ceph_pen` ×1 |
| 8 | ⑥ | `ceph_flip_skin` | `lift_flap` `flipBefore:'longAxis180'` | CEPH_SKIN_UP | 뒤집어 껍질 시작점 잡기 | — |
| 9 | ⑦ | `ceph_skin_peel` | `peel` | CEPH_SKIN_UP | 껍질 분리 (완주가 성공 조건) | — |
| 10 | ⑧ | `ceph_skin_done` | `result` | CEPH_PARTS | 껍질 분리 완료 | `ceph_skin` ×1 |
| 11 | ⑨ | `ceph_gill_wash` | `hold_scrub` | CEPH_FLESH_UP | 아가미 제거 · 내장면 닦기 | `ceph_gill` ×2 |
| 12 | ⑩ | `ceph_fin_off` | `fin_cut` | CEPH_FLESH_UP | 날개(지느러미) 제거 | `ceph_fin_meat` ×1 |
| 13 | ⑪ | `ceph_head_split` | `vessel_cut` | CEPH_PARTS | 머리부 3분할 | `ceph_arms` ×1 · `ceph_head` ×1 · `ceph_ink_sac` ×1 |
| 14 | — | `ceph_beak_out` | `drag_out` | CEPH_PARTS | **다리 밑동에서 부리 빼내기** (v3.1 추가) | `ceph_beak` ×1 |

한치와의 차이는 네 곳이다. 무늬오징어는 뼈 제거(S7)와 아가미 제거(S11)가 **떨어져 있고**, 껍질을 **끝까지** 벗기며(S9 완주), 날개 제거 스테이지가 **있고**, 머리부를 3분할한다. 한치는 뼈·아가미를 한 스테이지로 합치고(S7), 껍질을 중간에 **멈춰** 경계를 자르며(S10~S11), 날개 스테이지가 없고, 3분할 대신 촉완 2가닥만 자른다. 같은 `kind: 'squid'`인데 트리를 `speciesId`로 골라야 하는 이유가 이것이다.

### 4.2 한치·창꼴뚜기 — 14스테이지

| # | id | primitive | 뷰 | 내용 | 부산물 |
|---|---|---|---|---|---|
| 1 | `ceph_shime_mantle` | `nerve_cut` | CEPH_DORSAL | 갑–눈 사이 1차 신경 차단 | — |
| 2 | `ceph_shime_arms` | `nerve_cut` | CEPH_DORSAL | 눈–다리 사이 2차 신경 차단 | — |
| 3 | `ceph_mantle_open` | `mantle_slit` | CEPH_VENTRAL | 몸통–머리 사이 공간에서 몸통 끝까지 절개 | — |
| 4 | `ceph_mantle_spread` | `lift_flap` | CEPH_OPEN | 펼쳐 내장 노출 (아가미 2장 양옆 부착) | — |
| 5 | `ceph_viscera_pull` | `drag_out` | CEPH_OPEN | 다리·머리를 잡고 내장을 위로 뜯어냄 | — |
| 6 | `ceph_split_check` | `result` | CEPH_PARTS | 아가미 제외 내장부 분리 완료 | `ceph_head_mass` ×1 |
| 7 | `ceph_pen_gill_out` | `drag_out` | CEPH_OPEN | 가운데 뼈 뽑기 **+ 아가미 2장 제거** | `ceph_pen` ×1 · `ceph_gill` ×2 |
| 8 | `ceph_flip_skin` | `lift_flap` `flipBefore:'longAxis180'` | CEPH_SKIN_UP | 뒤집어 몸통 꼭대기에서 껍질 들춤 | — |
| 9 | `ceph_skin_peel` | `peel` | CEPH_SKIN_UP | 꼭대기 → 머리 방향으로 껍질 당김 | — |
| 10 | `ceph_skin_peel_end` | `peel` | CEPH_SKIN_UP | 머리쪽 경계만 남긴 채 **정지** | — |
| 11 | `ceph_skin_cut` | `guided_cut` | CEPH_SKIN_UP | 남은 경계선을 곧게 절단 | — |
| 12 | `ceph_skin_done` | `result` | CEPH_PARTS | 껍질+테두리 / 몸통 순살 | `ceph_skin` ×1 |
| 13 | `ceph_mantle_trim` | `hold_scrub` `flipBefore:'fleshUp'` | CEPH_FLESH_UP | 내장면으로 되뒤집어 전체면 잔막·점액 정리 | — |
| 14 | `ceph_tentacle_cut` | `vessel_cut` | CEPH_PARTS | 촉완 2가닥 밑동 절단 | `ceph_tentacle` ×2 |
| 15 | `ceph_beak_out` | `drag_out` | CEPH_PARTS | **다리 밑동에서 부리 빼내기** (v3.1 추가) | `ceph_beak` ×1 |

S10이 `peel`인데 **완주가 아니라 정지가 성공 조건**인 유일한 스테이지다. 진행률이 `peelStopBand`(0.82~0.94) 안에서 포인터를 떼야 통과하고, 1.0까지 당겨버리면 S11의 절단선이 사라져 `ceph_skin`에 테두리가 붙지 않는다(수율 소폭 손실 + 등급 유지). 사용자 9번 문장("완전히 다 제거하기 직전에 멈추고, 그 경계면을 자르는")이 근거다.

한치 트리에는 **날개 제거 스테이지가 없다.** 창꼴뚜기의 후방 지느러미는 얇아 S11 절단 때 껍질과 함께 떨어진다. 머리부 3분할도 없다 — 사진에 없다.

### 4.3 갑오징어 — 12스테이지

| # | id | primitive | 뷰 | 내용 | 부산물 |
|---|---|---|---|---|---|
| 1–2 | `ceph_shime_mantle` / `ceph_shime_arms` | `nerve_cut` | CEPH_DORSAL | 시메 2단계 | — |
| 3 | `ceph_mantle_open` | `mantle_slit` | CEPH_VENTRAL | 몸통 절개 | — |
| 4 | `ceph_mantle_spread` | `lift_flap` | CEPH_OPEN | 펼치기 · 내장 노출 (생식소 2엽 · 먹물주머니) | — |
| 5 | `ceph_viscera_pull` | `drag_out` | CEPH_OPEN | 내장 분리 — **아가미 동반 이탈** | `ceph_head_mass` ×1 |
| 6 | `ceph_bone_membrane` | `lift_flap` | CEPH_OPEN | 갑을 덮은 막을 좌우로 젖힘 | — |
| 7 | `ceph_bone_out` | `bone_lift` | CEPH_OPEN | 갑 윤곽대로 판 전체 들어내기 | — |
| 8 | `ceph_bone_check` | `result` | CEPH_PARTS | 갑 / 갑 자리 홈이 남은 몸통 | `ceph_cuttlebone` ×1 |
| 9 | `ceph_flip_skin` | `lift_flap` `flipBefore:'longAxis180'` | CEPH_SKIN_UP | 개복부 **모서리**에서 껍질 들춤 | — |
| 10 | `ceph_skin_peel` | `peel` | CEPH_SKIN_UP | 겉껍질 벗기기 | `ceph_skin` ×1 |
| 11 | `ceph_inner_skin` | `peel` (`peelTool:'towel'`) | CEPH_SKIN_UP | 속껍질 제거 — 키친타월 필수 | `ceph_inner_skin` ×1 |
| 12 | `ceph_head_split` | `vessel_cut` | CEPH_PARTS | 머리부 3분할 | `ceph_arms` ×1 · `ceph_head` ×1 · `ceph_ink_sac` ×1 |
| 13 | `ceph_beak_out` | `drag_out` | CEPH_PARTS | **다리 밑동에서 부리 빼내기** (v3.1 추가) | `ceph_beak` ×1 |

S9의 껍질 시작점이 무늬오징어(몸통 끝 가장자리)와 다르다. 갑오징어는 몸통 끝이 두껍고 각침이 남을 수 있어 **개복부 모서리**에서 잡는다 — 실사 ⑦의 손 위치가 근거다. `CEPH_SKIN_GRIP` 상수를 종별로 분리해야 하는 이유이기도 하다.

S11이 `peel`이면서 도구를 강제하는 유일한 스테이지다. 속껍질은 미끄러워 맨손으로 잡히지 않는다. `peelTool: 'towel'`이면 인벤토리의 `kitchen_towel`을 요구하고, 없으면 `peelBreakPenalty`가 3배가 된다(맨손 시도 = 계속 미끄러짐).

### 4.4 문어 — 11스테이지

| # | id | primitive | 뷰 | 내용 | 부산물 |
|---|---|---|---|---|---|
| 1 | `octo_head_invert` | `invert` | OCTO_WHOLE | 눈 뒤 외투막 입구로 손가락을 넣어 머리 끝을 안으로 밀어 넣음 | — |
| 2 | `octo_head_inverted` | `result` | OCTO_INVERTED | 속면이 완전히 밖으로 나옴 (목에만 겉피부 잔존) | — |
| 3 | `octo_viscera_seen` | `result` | OCTO_INVERTED | 노란 소화선 + 올리브색 내장이 막에 싸인 채 노출 | — |
| 4 | `octo_viscera_pull` | `drag_out` | OCTO_INVERTED | 목 쪽 부착부에서 끊어 내장을 뜯어냄 | `octo_viscera` ×1 · `octo_ink_sac` ×1 |
| 5 | `octo_flip_oral` | `flip` (`oralUp`) | OCTO_ORAL | 빨판 면이 위로 오게 반전 — 중심에 악판 노출 | — |
| 6 | `octo_beak_out` | `drag_out` | OCTO_ORAL | 악판을 눌러 밀어 올린 뒤 흰 기부까지 통째로 뽑음 | `octo_beak` ×1 |
| 7 | `octo_beak_done` | `result` | OCTO_ORAL | 몸에는 둥근 구멍만 남음 | — |
| 8 | `octo_salt` | `salt_apply` | OCTO_WHOLE | 몸 전체에 굵은소금 도포 | — (`coarse_salt` 소모) |
| 9 | `octo_slime_scrub` | `hold_scrub` | OCTO_WHOLE | 다리·빨판 사이를 왕복 문지름 | `octo_slime` ×1 |
| 10 | `octo_rinse` | `wash` | OCTO_WHOLE | 흐르는 물로 헹굼 (머리는 아직 뒤집힌 상태) | — |
| 11 | `octo_done` | `result` `flipBefore:'headRestore'` | OCTO_WHOLE | 머리를 되돌린 통마리 손질 완료 | `octo_whole` ×1 |

**문어 트리에 없는 것들** — 시메(사진에 없음), 개복(외번으로 대체), 뼈·펜·갑 제거(문어에 없음), 껍질 벗기기(문어는 껍질째 사용), 아가미 단독 제거(S4에서 내장과 동반 이탈), 날개 제거(문어에 지느러미 없음), 촉완 절단(문어는 팔 8가닥뿐, 촉완 없음). 전부 사진에 근거가 없어서 만들지 않은 것이며, 이 목록 자체를 `octo_guide.svg`의 「의도적으로 없는 공정」 카드에 남겨 두었다.

S11이 `result`이면서 뷰 상태를 바꾸는 유일한 스테이지다. 머리 복원은 조작 판정이 아니라 완료 연출이다(실사 ⑪이 결과 컷이므로).

완주 시 메인 산출물은 `octo_whole` ×1이고, 오징어류 3종은 `ceph_mantle_fillet` ×1이다. 둘 다 슬라이싱 트리의 입력이 되지만 `sliceMode`가 다르다(§6).

### 4.5 표에 없는 두 부산물

§4.1~§4.4 표에 `ceph_mantle_fillet`과 `ceph_gonad`가 보이지 않는데, 빠뜨린 것이 아니라 **스테이지가 직접 내놓지 않기 때문이다.**

`ceph_mantle_fillet`은 어느 스테이지의 `byproducts`에도 들어가지 않는다. 몸통 순살은 떼어내는 물건이 아니라 **다 떼고 남은 것**이므로, 트리 완주 시점에 `ButcheryProcess.complete()`가 자동으로 1개 산출한다. 문어의 `octo_whole`이 S11 표에 적혀 있는 것과 대비되는데, 문어는 마지막 컷 자체가 결과물 확인 패널(실사 ⑪)이라 스테이지 산출로 두는 편이 시트와 맞기 때문이다. 구현에서는 둘 다 `forced: true`라 버릴 수 없다는 점이 같다.

`ceph_gonad`는 조건부 산출이다. 무늬오징어·한치 S13(`ceph_head_split`)과 갑오징어 S12에서 `ceph_ink_sac`과 같은 내장 덩어리에 딸려 나오는데, `spawningMonths` 밖에서 잡힌 개체에는 아예 없다(§5). 그래서 고정 산출 목록이 아니라 `gonadChance` 판정을 통과할 때만 팝업에 한 줄이 추가된다. 시트의 "내장(먹물주머니·간·생식소) ×1" 문구가 이 묶음을 가리킨다.

### 4.6 가이드 UV 상수

절개선·박리 경로는 종마다 시작점과 방향이 달라 **단일 상수로 둘 수 없다.** `Record<speciesId, …>`로 분리한다.

```ts
// 공통 — 3종 오징어류가 같은 값을 쓴다
export const CEPH_SLIT_PATH  = [{ u: 0.39, v: 0.50 }, { u: 0.95, v: 0.50 }] as const; // 개복 절개
export const CEPH_SHIME_1    = { u: 0.36, v: 0.50 } as const;   // 갑–눈 사이
export const CEPH_SHIME_2    = { u: 0.29, v: 0.50 } as const;   // 눈–다리 사이

// 종별 분리 필요 — 시작점·경로가 실사에서 서로 다르다
export const CEPH_SKIN_GRIP: Record<string, FishUV> = {
  squid: { u: 0.90, v: 0.44 },   // 몸통 끝 가장자리
  swordtip_squid:    { u: 0.93, v: 0.46 },   // 몸통 꼭대기
  cuttlefish: { u: 0.28, v: 0.16 },   // 개복부 모서리
};
export const CEPH_PEEL_PATH: Record<string, readonly FishUV[]> = {
  // 무늬오징어·한치는 몸통 끝 → 머리 방향(우→좌). 시트 ⑦의 방향 화살표와 같다.
  squid: [{ u: 0.90, v: 0.44 }, { u: 0.66, v: 0.45 }, { u: 0.42, v: 0.46 }],
  // 한치는 S10에서 머리쪽 부착부를 남기고 멈춘다 — 끝점이 그 부착부(시트 ⑧ ring).
  swordtip_squid:    [{ u: 0.93, v: 0.46 }, { u: 0.61, v: 0.47 }, { u: 0.29, v: 0.55 }],
  // 갑오징어만 방향이 반대다(좌→우). 개복부 모서리에서 시작해 반대편으로 밀어낸다.
  cuttlefish: [{ u: 0.28, v: 0.16 }, { u: 0.58, v: 0.15 }, { u: 0.87, v: 0.15 }],
};
export const CEPH_INNER_SKIN_PATH = [{ u: 0.61, v: 0.15 },
                                     { u: 0.89, v: 0.15 }] as const; // 갑오징어 전용
export const CEPH_TOWEL_GRIP      = { u: 0.22, v: 0.28 } as const;   // 키친타월 쥐는 위치
export const CEPH_BONE_OUTLINE    = [/* 갑 윤곽 8점 — gapo_guide.svg ⑤⑥에서 추출 */] as const;

// 문어 전용
export const OCTO_INVERT_PATH   = [{ u: 0.46, v: 0.50 }, { u: 0.93, v: 0.50 }] as const;
export const OCTO_VISCERA_GRIP  = { u: 0.70, v: 0.46 } as const;
export const OCTO_VISCERA_PATH  = [{ u: 0.70, v: 0.46 }, { u: 0.92, v: 0.34 }] as const;
export const OCTO_BEAK_CENTER   = { u: 0.42, v: 0.50 } as const;   // radial space
export const OCTO_BEAK_PATH     = [{ u: 0.42, v: 0.50 }, { u: 0.16, v: 0.34 }] as const;
export const OCTO_SALT_REGION   = [{ u: 0.03, v: 0.06 }, { u: 0.95, v: 0.06 },
                                   { u: 0.95, v: 0.94 }, { u: 0.03, v: 0.94 }] as const;
export const OCTO_SCRUB_REGION  = [{ u: 0.03, v: 0.10 }, { u: 0.44, v: 0.10 },
                                   { u: 0.44, v: 0.92 }, { u: 0.03, v: 0.92 }] as const;
```

값은 4개 시트의 오버레이 좌표를 76×40 그리드에서 정규화한 것이다. 시트를 수정하면 이 상수도 같이 고쳐야 한다 — **시트가 정본이다.**

---

## 5. 부산물

`ByproductId`에 두족류 18종을 둔다(v2의 10종 + v3의 8종). 어류 7종은 그대로다.

```ts
export type ByproductId =
  | 'fish_head' | 'fish_scale' | 'fish_fin'
  | 'viscera' | 'fish_skin' | 'fish_bone' | 'fish_blood'
  // ─ 두족류 공통 ─
  | 'ceph_head_mass' | 'ceph_pen' | 'ceph_skin' | 'ceph_gill'
  | 'ceph_fin_meat' | 'ceph_arms' | 'ceph_head' | 'ceph_ink_sac'
  | 'ceph_gonad' | 'ceph_mantle_fillet'
  // ─ v3 신규 ─
  | 'ceph_tentacle' | 'ceph_cuttlebone' | 'ceph_inner_skin' | 'ceph_beak'
  | 'octo_viscera' | 'octo_ink_sac' | 'octo_beak' | 'octo_slime' | 'octo_whole';
```

| id | 이름 | 쓰임새 | 기본 | 스택 | 판매가 |
|---|---|---|---|---|---|
| `ceph_head_mass` | 머리+다리+내장 덩어리 | 중간 산출물 | **보관(강제)** | 1 | — |
| `ceph_pen` | 오징어뼈(연골) | 폐기 · 공예 소품 | 버리기 | 20 | 0 |
| `ceph_cuttlebone` | 갑(석회질 판) | 폐기 · 공예 · 사료 | 버리기 | 10 | 50 |
| `ceph_skin` | 껍질(겉껍질) | 밑밥 재료 | 버리기 | 10 | 100 |
| `ceph_inner_skin` | 속껍질(얇은 막) | 폐기 | 버리기 | 20 | 0 |
| `ceph_gill` | 아가미 | 밑밥 재료 | 버리기 | 10 | 50 |
| `ceph_fin_meat` | 날개살 | 식용 · 판매 | **보관** | 5 | 1,200 |
| `ceph_arms` | 다리부 | 식용 · 판매 (숙회 · 구이) | **보관** | 5 | 1,800 |
| `ceph_tentacle` | 촉완(긴 다리) | 식용 · 판매 · 미끼 | **보관** | 10 | 700 |
| `ceph_head` | 머리부 | 식용 (부리 · 눈 제거 후) | **보관** | 5 | 900 |
| `ceph_beak` | 입(부리) — 오징어류 | 폐기 | 버리기 | 20 | 0 |
| `ceph_ink_sac` | 먹물주머니 | 요리 재료 | **보관** | 10 | 2,500 |
| `ceph_gonad` | 생식소(알집) | 계절 별미 — 산란기 한정 | **보관** | 5 | 1,500 |
| `ceph_mantle_fillet` | 몸통 순살 | 메인 수율 → 슬라이싱 트리 | **보관(강제)** | 1 | — |
| `octo_viscera` | 문어 내장 덩어리 | 폐기 · 밑밥 | 버리기 | 5 | 30 |
| `octo_ink_sac` | 문어 먹물주머니 | 요리 재료 (오징어보다 소량) | **보관** | 10 | 900 |
| `octo_beak` | 악판(입) | 폐기 | 버리기 | 20 | 0 |
| `octo_slime` | 점액 · 이물 | 폐기 전용 (인벤토리 미적재) | 자동 폐기 | — | — |
| `octo_whole` | 문어 통마리 순살 | 메인 수율 → 숙회 · 슬라이싱 | **보관(강제)** | 1 | — |

`ceph_head_mass`·`ceph_mantle_fillet`·`octo_whole`은 손질 진행에 필수인 산출물이라 버리기 선택지를 막는다(`ByproductDef.forced: true`).

`octo_slime`은 유일하게 인벤토리에 들어가지 않는 부산물이다. 팝업에도 뜨지 않고 "제거: 점액·이물"이라는 스테이지 결과 칩으로만 표시된다. 목록에 남겨두는 이유는 **스테이지가 무엇을 없앴는지 로그에 남기기 위해서**다.

`ceph_gonad`는 `FISH_DATABASE`의 `spawningMonths` 안에서 잡힌 개체에만 나온다. 산란기 밖이면 팝업 목록에서 빠진다. 갑오징어는 생식소가 크고 뚜렷해 등장 확률이 다른 종보다 높다(`gonadChance` 프로필 필드로 조정).

`ceph_ink_sac`·`octo_ink_sac`은 먹물이 터졌으면(§7) 목록에서 빠지고 "먹물 터짐" 경고로 대체된다.

---

## 6. 프로필

```ts
export interface CephalopodProfile {
  readonly speciesId: string;
  readonly kind: 'squid' | 'cuttlefish' | 'octopus';

  // ── 공정 형태 ──
  readonly shimeStages: 0 | 2;             // 문어 0, 오징어류 2
  readonly needsInversion: boolean;        // 외번 — 문어만 true
  readonly needsSaltScrub: boolean;        // 소금 문지르기 — 문어만 true
  readonly skinLayers: 0 | 1 | 2;          // 문어 0, 오징어·한치 1, 갑오징어 2
  readonly hasPen: boolean;                // 얇은 투명 연골
  readonly hasCuttlebone: boolean;         // 두꺼운 석회질 판
  readonly beakRemoval: 'with_head_split' | 'dedicated' | 'none';
  readonly gillRemoval: 'separate' | 'with_pen' | 'with_viscera' | 'none';
  readonly hasTentacles: boolean;          // 촉완 2가닥 — 문어 false

  // ── 수율 비율 ──
  readonly mantleRatio: number;
  readonly finRatio: number;
  readonly armsRatio: number;
  readonly tentacleRatio: number;
  readonly headRatio: number;
  readonly boneRatio: number;              // 갑·펜이 차지하는 중량 비율
  readonly baseYieldRate: number;

  // ── 리스크 ──
  readonly inkAmount: number;              // 0~1
  readonly gonadChance: number;            // 산란기 내 생식소 등장 확률

  readonly sliceMode: 'strip' | 'whole';
}
```

| 필드 | 무늬오징어 | 한치 | 갑오징어 | 문어 |
|---|---|---|---|---|
| `kind` | squid | squid | cuttlefish | octopus |
| `shimeStages` | 2 | 2 | 2 | **0** |
| `needsInversion` | false | false | false | **true** |
| `needsSaltScrub` | false | false | false | **true** |
| `skinLayers` | 1 | 1 | **2** | **0** |
| `hasPen` / `hasCuttlebone` | true / false | true / false | **false / true** | false / false |
| `beakRemoval` | with_head_split | **none** | with_head_split | **dedicated** |
| `gillRemoval` | separate | **with_pen** | **with_viscera** | with_viscera |
| `hasTentacles` | true | true | true | **false** |
| `mantleRatio` | 0.46 | 0.50 | 0.42 | 0.22 |
| `finRatio` | 0.11 | 0.04 | 0.06 | 0.00 |
| `armsRatio` | 0.19 | 0.13 | 0.16 | **0.56** |
| `tentacleRatio` | 0.00¹ | 0.05 | 0.00¹ | 0.00 |
| `headRatio` | 0.06 | 0.05 | 0.06 | 0.00² |
| `boneRatio` | 0.01 | 0.01 | **0.08** | 0.00 |
| `inkAmount` | 0.55 | 0.45 | **0.90** | 0.30 |
| `gonadChance` | 0.35 | 0.30 | **0.60** | 0.20 |
| `baseYieldRate` | 0.72 | 0.74 | 0.66 | **0.78** |
| `sliceMode` | strip | strip | strip | **whole** |

¹ 촉완을 별도 분리하는 스테이지가 트리에 없으므로 `armsRatio`에 포함된다. 한치만 S14에서 분리한다.
² 문어는 머리를 따로 떼지 않는다 — 통마리 산출이라 `octo_whole` 하나로 합산된다.

```ts
export const COMMON_OCTOPUS: CephalopodProfile = {
  speciesId: 'octopus', kind: 'octopus',
  shimeStages: 0, needsInversion: true, needsSaltScrub: true,
  skinLayers: 0, hasPen: false, hasCuttlebone: false,
  beakRemoval: 'dedicated', gillRemoval: 'with_viscera', hasTentacles: false,
  mantleRatio: 0.22, finRatio: 0.00, armsRatio: 0.56, tentacleRatio: 0.00,
  headRatio: 0.00, boneRatio: 0.00, baseYieldRate: 0.78,
  inkAmount: 0.30, gonadChance: 0.20, sliceMode: 'whole',
};
```

`sliceMode: 'whole'`은 슬라이싱 트리가 문어를 **채썰기(strip)가 아니라 어슷썰기/숙회 슬라이스**로 받아야 한다는 뜻이다. 문어 회는 삶은 뒤 다리를 어슷하게 써는 것이 표준이라 오징어 채썰기 판정을 그대로 쓰면 어색해진다. 이 분기는 P2-1 슬라이싱 트리 쪽 과제이며 여기서는 플래그만 넘긴다.

---

## 7. 리스크 — 시메 · 먹물 · 점액

### 7.1 시메 (오징어류 3종)

v2에서 확정된 규칙을 그대로 쓴다. 몸통(갑) 시작부–눈 사이가 1차, 눈–다리 사이가 2차. 성공하면 색소포가 풀리며 갈색 → 유백색으로 바뀌고, 이 색 전환이 성공 피드백의 전부이므로 렌더가 반드시 지원해야 한다.

```ts
freshnessBonus = mantleCut && armsCut ? +2 : mantleCut || armsCut ? +1 : 0;
inkBurstRisk  *= armsCut ? (1 - tuning.ceph.shimeInkRiskCut) : 1;
```

`shimeStages: 0`인 문어는 이 계산을 건너뛰고 `freshnessBonus = 0`이다. 문어에 시메 보너스가 없다는 뜻이 아니라 **이 트리에 시메 공정이 없다**는 뜻이다. 활문어 시메는 낚시 씬의 처리 단계 소관이며, 손질 도마에 올라온 시점의 `freshness`를 그대로 물려받는다.

### 7.2 먹물

터지는 경로는 종별로 다르다.

| 종 | 경로 1 | 경로 2 |
|---|---|---|
| 무늬오징어 · 한치 | S3 `mantle_slit` 과심 (`depthViolations` 초과) | 내장 당김 속도 > `inkBurstSpeed` |
| 갑오징어 | 위와 동일 | 위와 동일 + S7 `bone_lift` 파손 시 먹물주머니 손상 |
| 문어 | — (개복 없음) | S4 `octo_viscera_pull` 속도 초과 **단독** |

갑오징어는 `inkAmount 0.90`으로 두족류 중 먹물이 가장 많다. 터지면 얼룩 세척 부담이 최대이고, 껍질이 2겹이라 얼룩이 속껍질 아래까지 스며 `ceph_inner_skin` 스테이지의 요구 커버리지도 함께 올라간다.

문어는 먹물주머니가 작아 터져도 등급 페널티가 절반이다(`inkPenaltyMult`를 종별로 보간). 대신 터지면 `octo_ink_sac`을 잃고 S9 `hold_scrub`의 목표가 0.95로 올라간다.

```ts
function inkBurst(profile: CephalopodProfile): void {
  // 잉크 스플래시 연출 + ink_sac 소실
  const sev = profile.inkAmount;                       // 0~1
  gradeMult   *= 1 - (1 - tuning.ceph.inkPenaltyMult) * sev;
  scrubDemand += tuning.ceph.inkStainScrubAdd * sev;
}
```

터진 뒤에도 손질은 계속 진행된다. 실패가 스테이지를 막지 않고 결과물의 질만 떨어뜨린다 — 어류 트리의 핏물 처리와 같은 철학이다.

### 7.3 점액 (문어 전용)

문어 표면 점액은 **소금 → 문지르기 → 헹굼** 3스테이지가 한 세트다. 어느 하나가 부실하면 다음이 무거워진다.

```
salt_apply 부족  →  hold_scrub 목표 +0.20
hold_scrub 부족  →  wash 후에도 slimeLeft > 0 → octo_whole 등급 1단계 하락
salt_apply 과다  →  gradeMult ×0.94 (조직이 조여 식감 손실)
```

`slimeLeft`는 렌더에도 반영한다 — 남은 점액이 있으면 완성 패널(S11)의 빨판 주변에 흰 잔여 얼룩이 남는다. 플레이어가 결과를 보고 원인을 역추적할 수 있어야 한다.

---

## 8. 수율

```ts
const q = toolYield × skillYield × freshness × gradeMult;

// 오징어류 3종
mantleG   = weightG × (mantleRatio - boneRatio × boneShare) × q
          × (1 - peelBreaks × peelBreakPenalty)
          × (1 - fragments × boneBreakPenalty);
finG      = weightG × finRatio      × q;
armsG     = weightG × armsRatio     × q;
tentacleG = weightG × tentacleRatio × q;      // 한치만 > 0
headG     = weightG × headRatio     × q;

// 문어
wholeG    = weightG × (mantleRatio + armsRatio) × q
          × (1 - tears × 0.05)
          × (slimeLeft > 0 ? 0.96 : 1);

inkG      = inkBurst ? 0 : weightG × inkAmount × 0.02;
```

`boneShare`는 갑이 몸통 살코기에서 차지하던 자리의 비율이다. 갑오징어만 유의미하다(0.08 전량 차감). 펜은 무게가 거의 없어 `boneRatio 0.01`로 두고 사실상 무시한다.

등급은 `computeSashimiGrade`를 재사용하되 입력 매핑을 바꾼다. 어류의 `bled`(피 뽑기 성공) 자리에 **오징어류는 `완전 시메 && !inkBurst`, 문어는 `!inkBurst && slimeLeft === 0 && tears === 0`**을 넣는다. 컷 정확도는 종별로 다르다.

| 종 | 정확도 평균에 들어가는 스테이지 |
|---|---|
| 무늬오징어 | S3 `mantle_slit` · S7 `pen_out` · S9 `skin_peel` |
| 한치 | S3 · S7 `pen_gill_out` · S9~S10 `skin_peel` · S11 `skin_cut` |
| 갑오징어 | S3 · S7 `bone_lift` · S10 `skin_peel` · S11 `inner_skin` |
| 문어 | S1 `invert` · S4 `viscera_pull` · S6 `beak_out` · S9 `slime_scrub` |

회칼 게이트는 어류와 동일(소프트 페널티, 막칼 폴백). 시메는 가위로도 가능하므로 가위 소지 시 `nerveTolerance`가 1.4배 넓어진다. **문어 트리는 칼을 요구하지 않으므로 회칼 게이트 자체를 적용하지 않는다** — 도마 진입 조건에서 문어만 예외 처리한다.

---

## 9. 렌더 — `CephalopodTemplateRenderer`

어류 `FishTemplateRenderer`에 분기를 더하지 말고 별도 렌더러를 쓴다(v2 결정 유지). v3에서는 이 렌더러 안에서 `kind`로 다시 갈라진다.

```
CephalopodTemplateRenderer
 ├─ SquidLayers      — 외투막 튜브 · 날개 · 촉완 2 + 팔 8 · 펜(반투명) · 아가미 2
 ├─ CuttlefishLayers — 위 + 갑(불투명 석회질 판) · 속껍질 시트 · 좁은 프릴형 날개
 └─ OctopusLayers    — 머리주머니 · 외번 주머니 · 팔 8(굵고 말림) · 구면(빨판 방사) · 악판
```

4개 시트가 그대로 상태별 픽셀 레퍼런스다. 특히 다음 다섯 가지는 시트를 보고 그대로 옮겨야 한다.

**시메 색 전환.** 살아있을 때(갈색 `#a8724c` + 청록 발색점 `#31b8a2`)와 시메 후(유백색 `#e7edf1`)의 두 상태. 색소포 발색점은 등쪽 띠로 두 줄 찍고 시메 성공 시 페이드아웃한다. `squid_guide.svg` S1·S2 패널.

**`peel` 진행률.** 껍질 시트가 살코기 시트에서 박리선을 기준으로 갈라져 말려 올라가고, 진행률에 따라 박리선 u좌표가 이동한다. 두 조각이 **분리된 것처럼 보이면 안 된다** — 박리선에서 이어져 있어야 "아직 벗기는 중"이 읽힌다.

**갑 vs 펜.** `gapo_guide.svg`의 「갑 — 오징어 펜과의 차이」 카드가 규격이다. 갑은 두껍고 불투명한 흰 판에 가로 성장선이 촘촘하고 뒤끝에 각침이 있다. 펜은 얇고 투명한 스트립이다. 두 에셋을 절대 공유하지 않는다.

**문어 외번.** `octo_guide.svg` ①~④가 규격이다. 겉피부는 회갈색 얼룩(해시 기반 스페클 — 선형 합을 쓰면 대각선 줄무늬가 생긴다), 속면은 유백색 두툼한 주름이며 목에만 겉피부가 좁은 칼라로 남는다. 외번 진행률에 따라 유백색 영역이 목 → 끝 방향으로 자란다.

**악판.** 뽑아낸 악판은 검은 부리가 아니라 **유백색 구근(협낭) 위에 검은 키틴 갈고리가 얹힌 덩어리**다. `octo_guide.svg` ⑦의 14×16 도트 템플릿이 정본이다. 제자리 악판(⑤)은 크림색 원반 한가운데의 작은 검은 점으로 따로 그린다 — 분리컷의 확대 덩어리와 크기·형태를 혼동하면 안 된다.

`CEPH_PARTS` 뷰는 도마 위 배치라 레이아웃이 다르다. 상단 1덩어리 / 구분선 / 하단 2덩어리 그리드를 고정으로 쓰고 덩어리마다 태그 라벨을 붙인다.

`OCTO_ORAL` 뷰는 방사 배치라 또 다르다. 중심(악판) 기준 8방향 팔이 등각으로 뻗고, 빨판이 각 팔을 따라 2열로 찍힌다. 이 뷰에서만 `guide.space: 'radial'`이 켜진다(§2.1).

---

## 10. tuning.ts

```ts
ceph: {
  // ── v2 유지 ──
  nerveTolerance:      0.045,
  nerveScissorsBonus:  1.4,
  shimeInkRiskCut:     0.6,
  slitDepthBand:       0.035,
  slitDepthFailCount:  3,
  slitBandNoShime:     0.5,
  inkBurstSpeed:       0.6,
  inkPenaltyMult:      0.85,
  inkStainScrubAdd:    0.25,
  peelBreakPenalty:    0.06,
  peelTargetCoverage:  0.92,
  penPullTolerance:    0.05,
  unlockSkillLv:       0,

  // ── v3 신규 · 껍질/뼈 ──
  peelStopBand:        [0.82, 0.94],  // 한치 S10 — 완주가 아니라 정지가 성공
  peelTowelMissMult:   3.0,           // 키친타월 없이 속껍질 시도 시 중단 페널티 배율
  boneLiftAngleMax:    22,            // 갑 들어내기 허용 각도(도)
  boneLiftNoMembrane:  0.5,           // 막 미젖힘 시 허용 각도 배율
  boneBreakPenalty:    0.10,          // 파편 1개당 몸통 수율 감소
  boneFragScrubAdd:    0.15,          // 파편 발생 시 정리 커버리지 가산

  // ── v3 신규 · 문어 ──
  invertProgressTarget: 0.90,         // 외번 완료 판정
  invertSpeedMax:       0.55,         // 초과 시 목 살 찢김
  invertTearGradeDrop:  1,            // 찢김 1회당 등급 하락 단계
  beakPullTolerance:    0.05,         // 악판 뽑기 경로 허용 이탈
  saltAmountBand:       [0.60, 1.00], // 소금 양 밴드
  saltMissScrubAdd:     0.20,         // 소금 부족 시 문지르기 목표 가산
  saltOverGradeMult:    0.94,         // 소금 과다 시 등급 배율
  slimeScrubTarget:     0.85,         // 점액 제거 목표 커버리지
  slimeScrubCycles:     6,            // 왕복 횟수
  slimeLeftGradeDrop:   1,            // 점액 잔존 시 등급 하락 단계
}
```

META 노출: `nerveTolerance · inkBurstSpeed · peelBreakPenalty · slitDepthBand · boneLiftAngleMax · invertSpeedMax · saltAmountBand · slimeScrubTarget · unlockSkillLv`.

---

## 11. 파일 · 작업 순서 · 검증

### 11.1 `packages/core/src/`

`types/Butchery.ts` — `CephOrientation`(v2 유지) · `OctopusOrientation`(신규) · `ButcheryOrientation` 합집합 · `FlipKind` · `StageDef.flipBefore?` · `StageDef.reversible?` 추가. `ButcheryPrimitive`에 `bone_lift`·`invert`·`salt_apply`·`flip` 추가. `ByproductId`에 v3 8종 추가. `CephalopodProfile` §6 형태로 확장.

`cephalopod/profiles.ts` — `BIGFIN_REEF_SQUID`·`SWORDTIP_SQUID`·`GOLDEN_CUTTLEFISH`·`COMMON_OCTOPUS` 4종 + `getCephalopodProfile(speciesId)`.

`cephalopod/stageGuides.ts` — §4.6 상수. 종별 `Record`가 되는 `CEPH_SKIN_GRIP`·`CEPH_PEEL_PATH` 2개를 특히 주의(나머지는 공통 상수다).

`cephalopod/trees/` — `bigfinTree.ts`(13) · `swordtipTree.ts`(14) · `cuttlefishTree.ts`(12) · `octopusTree.ts`(11). `buildCephalopodStages.ts`가 `speciesId`로 고른다.

`cephalopod/shime.ts` · `cephalopod/ink.ts` · `cephalopod/slime.ts`(문어 전용) · `cephalopod/yield.ts`(§8).

`strokeEval.ts` — `evaluateSlit`(v2) · `evaluatePeel`(v2, `peelStopBand` 지원 추가) · `evaluateBoneLift`(신규) · `evaluateInvert`(신규) · `evaluateSaltApply`(신규).

`ButcheryProcess.ts` — 신규 프리미티브 4종 분기 + `flipBefore` 처리 + `headInverted` 플래그. `getButcheryFamily()`의 `'cephalopod'` 스텁 해제.

모든 신규 파일은 `src/index.ts`에서 export한다.

### 11.2 `packages/client-pc/src/ui/`

`CephalopodTemplateRenderer.ts`(§9, 3레이어 세트) · `FlipBadge.ts`(`FlipKind`별 아이콘) · `PeelGauge.ts`(진행률 + 중단 + 정지 밴드 표시) · `BoneAngleGauge.ts`(갑 각도) · `InvertGauge.ts`(외번 진행 + 속도) · `SaltMeter.ts`(양 밴드) · `InkSplash.ts`. `ByproductPopup.ts`에 `forced` 처리 추가. `ButcheryPanel.ts`가 `getButcheryFamily` → `kind`로 렌더러를 고르도록 분기하되 **기존 어류 경로는 건드리지 않는다.**

### 11.3 순서

1. core 타입 확장 + 프로필 4종 + 가이드 상수 (렌더 없이 빌드 통과 확인)
2. `bigfinTree` 13스테이지 + `ButcheryProcess` 분기 + `getButcheryFamily` 해제 — **v2 범위를 먼저 끝낸다**
3. `SquidLayers` 렌더 + 기존 UI 3종 → 무늬오징어 1종 완주 가능 상태
4. `swordtipTree` 14 (신규 판정: `peelStopBand`)
5. `cuttlefishTree` 12 + `CuttlefishLayers` + `bone_lift` + 속껍질
6. `octopusTree` 11 + `OctopusLayers` + `invert`·`salt_apply`·`flip` + `OCTO_ORAL` 방사 뷰
7. 수율·등급 연동 + `RecipeDatabase`에 먹물·숙회 레시피
8. `tuning.ts` §10 + P2-1 slice `strip`/`whole` 분기 연동

각 단계 끝에서 `npx pnpm run build` + `npx pnpm --filter @tra/client-pc run typecheck` 0 오류를 확인한다. 종을 하나씩 붙이는 순서라 중간에 멈춰도 앞선 종은 정상 동작해야 한다.

### 11.4 검증

**공통.** 뷰 전이가 §2.2 그래프대로 자동으로 흐르는지. `result` 스테이지에서 `CEPH_PARTS`가 잠깐 떴다 돌아오는지. 부산물이 §5 표대로 정확히 지급되는지. `forced` 3종이 버리기 불가인지. `npx pnpm run build` + typecheck 0 오류.

**무늬오징어.** 아가미가 S11에서 2장 나오는지(S6에서 머리 덩어리와 함께 나오면 **버그**). 시메 건너뛴 판과 완전 시메 판의 등급이 최소 한 단계 차이 나는지. 껍질 당김을 3회 끊으면 수율이 약 18% 줄고, 진행률 0.92 미만 통과 시 등급이 한 단계 내려가는지. 먹물 2경로 각각 재현.

**한치.** S7에서 뼈 1개 + 아가미 2장이 **함께** 지급되는지. S10에서 진행률 1.0까지 당겨버리면 S11 절단선이 사라지고 `ceph_skin`에 테두리가 붙지 않는지. S14 촉완 절단이 몸통 공정 **뒤에** 오는지(트리 순서가 사용자 지정대로인지). 날개 제거·머리 3분할 스테이지가 **없는지**.

**갑오징어.** S6를 건너뛰고 S7에 들어가면 허용 각도가 절반이 되는지. 각도를 초과해 들어올리면 파편이 생기고 몸통 수율이 깎이는지. S11에서 키친타월 없이 시도하면 중단 페널티가 3배가 되는지. 아가미가 S5에서 내장과 **함께** 빠지고 별도 스테이지가 없는지. `inkAmount 0.90` 때문에 먹물 터짐 시 세척 부담이 다른 종보다 큰지.

**문어.** 시메 스테이지가 **없는지**. 트리 전체에 `guided_cut`·`vessel_cut`·`mantle_slit`이 **하나도 없는지**(칼 공정 0). S1 외번을 되돌릴 수 있는지(`reversible`). 진행률 0.9 미만으로 통과하면 S4 요구 커버리지가 올라가는지. S5~S7이 `OCTO_ORAL` 방사 뷰이고 `guide.space === 'radial'`인지. S8~S10 동안 `headInverted === true`이고 S11에서만 false로 바뀌는지 — **⑩ 렌더에 머리가 복원되어 보이면 버그다.** 소금 없이 S8을 건너뛰면 `slimeScrubTarget`이 0.95로 오르고 왕복 횟수가 2배가 되는지. 회칼 게이트가 문어에만 적용되지 않는지.

E2E에 4종 각 1마리 완주 시나리오를 추가한다.

---

## 12. 범위와 후속

**이번 범위:** 두족류 4종(`squid`·`swordtip_squid`·`cuttlefish`·`octopus`). 각 종의 손질 트리는 실사 사진 1컷 = 스테이지 1개로 고정이며, 시각 정본은 4개 SVG 시트다.

**어종 DB.** ✅ **4종 전부 등록 완료** — 무늬오징어(`squid`)·갑오징어(`cuttlefish`)·참문어(`octopus`)는 기존 등록분, 한치(`swordtip_squid`)는 79차(2026-08-05)에 4계층 + 에기 spawnBinding까지 등록했다. 별도 DB 등록안 문서는 불필요하다.

**보류:** 낙지·주꾸미(문어 트리 축약형으로 재사용 가능해 보이나 실사 레퍼런스 없음), 대왕오징어류. 근거 없는 초안은 만들지 않는다.

**후속:** 두족류 전용 요리(먹물 파스타 · 숙회 접시 · 문어 라면), 활어 수족관 두족류 수용, 복어(P3-2 별도 — License 게이트), P2-1 슬라이싱 트리의 `whole` 모드(문어 어슷썰기).

---

## 부록 — 미해결 질문 (2026-08-05 레포 실측으로 3건 해소)

**~~무늬오징어의 `speciesId`~~ → 해소.** 실제 id는 **`squid`**다(`bigfin_squid`도 `bigfin_reef_squid`도 아니다 — 후자는 에셋 파일명일 뿐이고, `FISH_DATABASE.spriteKey`에 `fish_bigfin_squid`라는 **존재하지 않는 키**가 박혀 있어 혼동을 키웠다. 79차에서 `fish_squid`로 정정). 본문 전체 치환 완료 — §0.5.1.

**~~갑오징어·문어의 `speciesId`~~ → 해소.** **`cuttlefish`**(*Sepia esculenta* — 가정과 동일) · **`octopus`**(참문어·돌문어). 학명은 현재 *Octopus vulgaris*로 등록돼 있다. *O. sinensis* 전환은 **이 트리와 무관한 도감 표기 문제**이므로 두족류 손질 범위에서 분리한다(어종 DB 정정 건으로 따로 다룬다). 추가로 **`giant_octopus`(대문어)가 v3 범위에 없었다** — 참문어 트리 공유로 확정(§0.5.1).

**~~한치 4계층 등록~~ → 해소.** 79차에서 오라클·도감·텍스처·경락 3곳·에기 spawnBinding까지 완료. `SWORDTIP_SQUID_DB_SPEC.md`는 불필요해졌다.

**아가미 부산물의 쓰임새.** (미해소) 표에는 밑밥 재료(판매가 50원)로 넣었다. 폐기 전용으로 할지, 밑밥 시스템의 실제 재료로 연결할지는 밑밥 DB 쪽 결정이 필요하다. `ceph_skin`·`octo_viscera`도 같은 질문을 공유한다. — **구현 시 기본값: 판매 가능한 잡부산물로 두고 밑밥 연결은 보류**(밑밥 재료는 `chumKind`를 갖는 별도 체계라, 근거 없이 편입하면 배합 밸런스가 흔들린다).

**문어 통마리의 후속 공정.** (미해소) `octo_whole`은 "손질 완료"이지 "먹을 수 있는 상태"는 아니다. 실제로는 삶는 공정이 하나 더 있다. — **구현 시 기본값: 손질 트리는 세척까지로 끝내고 삶기는 요리 시스템(불요리)으로 넘긴다.** 실사 11컷이 세척까지만 다루므로 트리에 넣을 근거가 없고, 불요리는 이미 별도 대과제로 잡혀 있다.
