# S3. 손질 (회뜨기) 시스템

> 상태 **🚧 진행 중** — 어류 3어종군 마감, 두족류 트리 미착수.
> 최종 갱신 2026-08-06 (80차) · 관련 차수 14·20·41·43·45·47~63·65·67·70·74·75·78·80

---

## 1. 목적·범위

낚은 **원물 1마리 → 부위별 부산물 + 순수 필렛**으로 바꾸는 미니게임. 낚시 루프의 하위 시스템이며,
산출물은 [회썰기·플레이팅](sashimi-cooking.md)과 [경제](economy-data.md)로 넘어간다.

**책임지는 것**: 손질 공정 FSM · 컷 판정 · 부산물 지급/회수 · 도마 렌더 · 가이드 좌표 · 수율/등급.
**책임지지 않는 것**: 썰기(S4) · 조리(S15) · 어종 데이터(오라클) · 아이템 저장(S5).

---

## 2. 구성

### core (`@tra/core`)
| 파일 | 역할 |
|---|---|
| `types/Butchery.ts` | 계약 — 뷰(orientation)·프리미티브·스테이지·프로필·수율·**회전축**(80차) |
| `simulation/ButcheryProcess.ts` | **FSM 본체** — 스테이지 트리 생성(`buildButcheryStages`/`buildFlatStages`) · `evaluateCut` · 수율 `computeFilletYield` · 어종군 판정 `getButcheryFamily` |
| `db-schema/ButcheryProfiles.ts` | 어종별 프로필(체형·수율·필렛 수·최소 체장·비늘/껍질 강도) |
| `db-schema/ButcherySections.ts` | 섹션(순서 강제) → 작업(선택) 정의 + `sectionsForBodyShape` |
| `db-schema/ButcheryGuideCuts.ts` | 돔류 47컷 가이드 시트 매핑(`LIVE_STAGE_GUIDE`) |
| `db-schema/KnifeDatabase.ts` | 회칼 3등급(막칼/사시미/야나기바) — 수율·등급 배율·게이트 |
| `db-schema/CephalopodProfiles.ts` · `CephalopodGuides.ts` | **두족류 준비(80차)** — 프로필 4종·부산물 19·가이드 좌표 |
| `config/tuning.ts` | `butchery.*` · `ceph.*` 29키 (F8 슬라이더) |

### client (`@tra/client-pc`)
| 파일 | 역할 |
|---|---|
| `ui/ButcheryPanel.ts` | 손질 모달(1080×620) — 작업 선택·입력·연출·부산물 팝업·결과·dev 도구 |
| `ui/PixelButcherFish.ts` | 도마 생선 렌더 — 어종군 분기(`butcherFamilyOf`) · `drawFlatFish`(넙치) · 원형 틀 고정 + 부위 삭제 |
| `ui/FishTemplateRenderer.ts` | 파라메트릭 생선 템플릿(폴백·프리뷰 공용) |
| `data/PixelFishSprites/Stages/Views/Flat.ts` | **구운 스냅샷** — PNG를 바꿔도 생성기 재실행 전엔 반영 안 됨 |
| `ui/UtilizationPanel.ts` | 도마(요리 탭) — 드래그 투입·[손질 시작]·재장착 체인·조각 스테이징 |
| `tools/pixelize_butchery.cjs` · `gen_flatfish_sprites.cjs` · `gen_butchery_views.cjs` | 에셋 → 도트 파이프라인 |

---

## 3. 동작 구조

### 3층 모델 (52차 대개편)
```
섹션(순서 강제)  →  작업(섹션 안에서 선택)  →  스테이지(실제 조작 1회분)
  sec_prep            t_head (머리 제거)         head_base / head_flip
  ...                                            └ 프리미티브: tap / guided_cut /
                                                    drag_fill / scoop / wash / peel
```
- 섹션 완료 시 **부산물 팝업**([보관]/[버리기]) → **[확인] 즉시 인벤 지급**(63차).
- 체크포인트(`exitAfter`) 이후 이탈 = 그 시점 정산 / 그 전 이탈 = **원물 복구 + 지급분 회수**.
- 조작 축 3종: **좌우 뒤집기(F)** · **상하 뒤집기(V)** · **90° 회전(R/Shift+R — 80차 신설, 독립축)**.

### 판정
`evaluateCut(가이드 폴리라인, 그은 획)` = **커버율**(32샘플) + **평균 이탈**(tolerance 배수) → 품질·통과.
채움류(비늘·내장·박피)는 `sweepPath` 44샘플 **커버리지 게이지**(제자리 흔들기 차단).

### 수율·등급
```
yieldMass = 무게 × baseYieldRate × 칼계수 × 스킬 × 신선도
등급      = (방혈 × 시메 × 컷정확도평균 × 신선도) × 칼·스킬 보정 → 특/상/중/하
           ※ 막칼은 '특' 캡 = '상'  ※ 활어가 아니면 '특' 불가
```

### 재장착 체인 (중간 산출물을 도마에 다시 올림)
```
inv_filletribs_ → sec_rib(갈빗대)   inv_filletpin_ → sec_pin(지아이)
inv_filletskin_ → sec_peel(박피)    inv_filletengw_ → sec_engawa(엔가와)
inv_engwskin_   → sec_peel → 순수 엔가와
```

---

## 4. 세부과제 현황

### B1. 어류 손질
| 과제 | 상태 | 차수 | 비고 |
|---|---|---|---|
| 자유 순서 3층 구조(섹션·작업·달성도) | ✅ | 52 | 자동 뒤집기 폐지, 수동 2축 |
| 손 장착 회칼 게이트 + 소프트 폴백 | ✅ | 43·52 | 막칼 진행 가능, 등급 캡 |
| 부산물 즉시 지급 + 회수 안전망 | ✅ | 59~63 | destroy/ESC/버튼 3경로 전부 |
| 단계 스프라이트(실사 픽셀화) | ✅ | 52·56 | 파이프라인 `pixelize_butchery.cjs` |
| 가이드 좌표 어종군 분리(돔/방어) | ✅ | 70 | `GUIDE_COORDS` 9세트 + 제거영역 |
| 박피 2단계 + 껍질 붙은 필렛 | ✅ | 57·58 | 톱질 연출, peel_pull |
| 넙치류 다섯장뜨기(필렛4+중골) | ✅ | 74 | S자 머리·엔가와 4장·재장착 3체인 |
| 광어 실사 에셋(회썰기·도마·박피) | ✅ | 75 | `MIRROR_KEYS` 방향 규칙 |
| 광어 F9 실측 1차(7종) + 3D 플랩 렌더 | ✅ | 78 | cov 1.00 검증 |
| 90° 회전축 + 벌어짐 보간 | ✅ | 80 | `flatOpenMs` 연속 보간 |
| **포 뜨기 실사 5단계** + 파이프라인 회전 지원 | ✅ | 82 | [워크로그](../03-WORKLOG/2026-08-06-082-halibut-photo-stages.md) |
| **광어 F9 잔여 5종** | 🔶 | — | §5-① |
| 실사 에셋 보정 3건 | 🔶 | — | §5-② (사용자 대기) |

### B2. 두족류 손질 — 🚧 **트리 미착수**
| 과제 | 상태 | 근거 |
|---|---|---|
| 스펙 정합 v3.1 (§0.5) | ✅ 80차 | `.agents/CEPHALOPOD_BUTCHERY_SPEC.md` — **본문보다 §0.5가 우선** |
| 타입(뷰 9·프리미티브 11) · 프로필 4종 · 부산물 19 | ✅ 80차 | `types/Butchery.ts` · `CephalopodProfiles.ts` |
| 가이드 좌표 상수 | ✅ 80차 | `CephalopodGuides.ts` |
| `tuning.ceph` 29키 + F8 10종 | ✅ 80차 | |
| trimmings 에셋 15키 + 아이콘 분기 | ✅ 80차 | squid 12 · octopus 3 |
| 한치 어종 4계층 등록(선행) | ✅ 79차 | `swordtip_squid` |
| 가이드 SVG 4장 | ✅ 80차 | `docs/mockups/{squid,hanchi,gapo,octo}_guide.svg` |
| **스테이지 트리 4종** | ⬜ | 무늬오징어14 · 한치15 · 갑오징어13 · 문어11 |
| **섹션 매핑**(1:1 작업, `anyOrder:false`) | ⬜ | 스펙 §0.5.4 |
| **신규 프리미티브 판정** | ⬜ | `nerve_cut`·`mantle_slit`·`lift_flap`·`drag_out`·`vessel_cut`·`fin_cut`·`hold_scrub`·`result` + `bone_lift`·`invert`·`salt_apply`·`flip` |
| **`CephalopodTemplateRenderer`** | ⬜ | 종별 레이어 세트 |
| `getButcheryFamily` 스텁 해제 | ⬜ | 해제 시 [손질 시작] 활성 |

### B3. 복어 손질 — ⬜ (License 게이트 선행)

---

## 5. 잔여·차기

**① 광어 F9 좌표 5종** — `FLAT_GUIDE`의 `upLift` · `gutSweep` · `dnScore` · `dnLift` · `engawa`가 근사값.
  ⚠ 78·80·82차로 **렌더가 바뀌었으므로 새 화면 기준 재측정**. 절차 → 스킬 `f9-guide-coords`.
**② 실사 에셋 보정 3건**(82차) — `lift_b` 나무 도마 혼입 · `fin_score` 대각 기울기 · `lift_a` 스케일/톤(부분 확대 + 양식 갈색 얼룩).
  ⚠ 갈색 얼룩 자동 흰색화는 **불가** — 등면 껍질과 색으로 구분되지 않는다. 소스 보정이 안전.
**③ 두족류 트리** — 착수 순서(스펙 §11.3):
```
② 무늬오징어 14스테이지 + ButcheryProcess 분기 + 게이트 해제
③ SquidLayers 렌더  → 1종 완주 가능
④ 한치 15 (peelStopBand)      ⑤ 갑오징어 13 (bone_lift·속껍질)
⑥ 문어 11 (invert·salt_apply·flip·radial 뷰)
⑦ 수율·등급 연동             ⑧ 슬라이싱(whole 모드) 연동
```
  선행 부족: 소모품 2종 미등록(`coarse_salt`·`kitchen_towel` — ⑤⑥에서 필요),
  에셋 3종 미보유(`ceph_skin`·`ceph_gill`·`ceph_inner_skin` — 아이콘만 비고 진행 가능).

---

## 6. 함정·불변조건 (건드리면 깨진다)

1. **도마 스프라이트는 구운 스냅샷** — `public/fish/*.png`를 바꿔도 `gen_*_sprites.cjs`를 다시 돌리지 않으면 반영 안 된다(어획 팝업/인벤은 PNG 직접 로드라 자동 반영 — 이 비대칭이 반복 함정).
2. **유도선은 도마 rect 고정 매핑** — 스프라이트를 갈아끼우면 좌표가 어긋난다. 그래서 **온마리 원형 틀 고정 + 부위 영역 삭제**(55차) 방식이다. 개복 이후 전용 뷰는 예외(뷰 자체 스케일).
3. **연출이 끝나기 전에 다음 상태를 그리지 않는다** — 액션/뒤집기 재생 중 완료 처리는 `pendingAfterAction` 큐로 미룬다(53차).
4. **부산물 지급 경로는 3개**(버튼·ESC·destroy) — 새 종료 경로를 만들면 반드시 정산/회수를 태운다(59~63차에서 3번 재발).
5. **F9 [복사] 스니펫은 `opts`(strong·tolerance)를 포함하지 않는다** — 붙여넣을 때 기존 opts를 보존할 것.
6. **좌표 반영은 core 리빌드 필요** — F9 편집은 런타임 전용.
7. **`submitTap`은 거리(number) 인자** — 좌표 객체를 넘기면 quality가 NaN이 된다(하네스 함정).
8. **두족류 스펙은 §0.5(v3.1)가 본문보다 우선** — v3 본문은 레포 접근 없이 작성돼 speciesId·심볼이 실제와 다르다.
9. **넙치류 내장 위치는 면마다 반대다** (사용자 확인 2026-08-06 + 해부도): 장축으로 뒤집으면 위/아래 가장자리가 바뀐다 —
   **배면(FLIP) 위 = 내장 위쪽 / 등면(BASE) 위 = 내장 아래쪽**. 내장은 **머리 뒤 앞쪽 주머니에 국한**(심장·위·유문수·장 → 항문까지)이고
   몸통 전장에 걸치지 않는다. 렌더 선택(`gutIsUp`)·`gutSweep` 좌표·섹션 순서가 이 규칙을 함께 따라야 한다.
10. **실사 스프라이트는 "가로·머리 왼쪽"으로 굽는다** — 세로 배치는 패널 회전축(80차)이 만든다.
   원본이 세로면 `ROTATE_KEYS`에 등록해 **굽는 시점에** 눕힌다. 렌더에서 또 돌리면 이중 회전.
11. **정지 실사는 트윈할 수 없다** — 벌어짐 보간 중(`FlatSideState.opening`)에는 파라메트릭 플랩이 그린다. 두 값은 한 쌍.
