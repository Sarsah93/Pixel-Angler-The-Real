# 080차 — 도마 90° 회전축 · 포 뜨기 벌어짐 연출 · 배쪽 단면 실사 · 두족류 정합(v3.1)

| | |
|---|---|
| **날짜** | 2026-08-06 |
| **시스템** | `손질`(S3) · `UI`(S10) · `에셋` |
| **트리거** | 사용자 지시 다건(세로 뷰 손질 · 연출 순서 · 사진 투입) + 두족류 착수 준비 |
| **커밋** | `a67a7e8` (79차 동봉) |
| **빌드·타입체크** | 4/4 · 0 오류 |

> 이 항목은 **기존 평문 기록을 새 8절 양식으로 옮긴 시범본**이다. 원문: `.agents/AGENTS.md` §9 "80차".

---

## 1. 배경
1. 넙치류 지느러미쪽 칼길·포 뜨기는 실제로 **꼬리를 아래로 세운 세로 배치**에서 꼬리→머리로 긋는다(사용자 지시 + `docs/mockups/자세한 뷰.pdf` 전 페이지가 세로 뷰). 기존 도마는 가로 고정이라 표현할 수 없었다.
2. 포 뜨기 벌어짐이 칼 이동과 **동시에** 진행돼 어색했다 — 사용자: *"칼 따라가기와 동시에 하지 말고, 칼이 지나간 뒤 열리게."*
3. 광어 단면이 파라메트릭이라 실사 사진을 넣기로 함(사진 5장 중 3번 = 배쪽 단면).
4. 두족류 착수 전, v3 스펙이 **레포 접근 없이 작성**돼 식별자·심볼이 실제와 어긋나 있었다.

## 2. 원인 *(파이프라인 3건 — 누끼가 오래 사문이었음)*
| # | 확정 기전 | 확정 근거 |
|---|---|---|
| ① | `processImage`가 `bgTol`을 `pageHtml`에 넘기지 않아 **`TH`가 undefined** → 비교가 NaN → 배경 제거 전체 무력 | 임계를 46→10→4로 낮춰도 **결과가 동일**했던 것 |
| ② | 배경색 추정이 **평균** — 피사체가 프레임 가장자리에 닿으면 흰 배경인데 bg≈230으로 밀림 → 임계를 좁힐수록 오히려 안 지워짐 | 중앙값 교체로 해소 |
| ③ | 테두리만 검사해 **타이트 크롭 누끼본**을 놓침 | 알파 비율(>3%) 경로 신설 + 순백 매트 동시 제거 |

⚠ 초기 진단(“누끼가 살을 먹었다”)은 **틀렸다** — 실제로는 아무것도 지워지지 않고 있었다.

## 3. 변경
| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `core/types/Butchery.ts` | `BoardRotation`(0/90/180/270) · `ButcheryStage.rotationRequired` · `ROTATION_LABEL` |
| 수정 | `core/simulation/ButcheryProcess.ts` | `rotation`/`rotate(±1)`/`rotationOk()` · `canAct()` 편입 · `jumpTo` 회전 자동 스냅 |
| 수정 | `client/ui/ButcheryPanel.ts` | 2×2 버튼(뒤집기2+회전2) · `R`/`Shift+R` · **세로 프레임**(`fishX/Y/W/H` getter화로 ~50개 사용처 무수정) · `rotNorm`/`unrotNorm` · 캔버스 변환 렌더 · 회전 우선 힌트 · `pendingFlatOpen`/`startFlatOpenAnim` |
| 수정 | `core` 넙치 트리 | 배·등쪽 **11스테이지 `rotationRequired: 90`** + `upScore`/`dnScore` 점 순서 **꼬리→머리 반전** |
| 수정 | `client/ui/PixelButcherFish.ts` | 벌어짐 = 이산 단계 → **연속 보간**(바닥 고정·위 덩어리만 중앙선 힌지) · `gutsExposed` 실사 렌더 |
| 신설 | `data/PixelFishStages.ts` | `halibut_belly_open`(128×93·투명 20.4%) |
| 수정 | `tools/pixelize_butchery.cjs` | §2의 3건 + `BG_TOL` 키별 임계 테이블 |
| 신설 | `core/db-schema/CephalopodProfiles.ts` · `CephalopodGuides.ts` | 프로필 4종(+대문어 공유) · 부산물 19 · 좌표 상수 |
| 수정 | `core/types/Butchery.ts` | 뷰 유니온 2종(`CephOrientation` 6 + `OctopusOrientation` 3) · `FlipKind` · 프리미티브 11 추가 · 스테이지 확장(flipBefore/reversible/peelStopBand/peelTool/regionPoly/radialSpace) |
| 신설 | `config/tuning.ts` | `ceph` 29키 + F8 슬라이더 10종 · `butchery.flatOpenMs`(650ms) |
| 신설 | `public/trimmings/ceph_*·octo_*` 15키 + BootScene | 한글 파일명 → ASCII 키 정규화 복사 |
| 신설 | 스펙 `§0.5` | speciesId 4건 치환(17곳) · 심볼 대조표 · 구조 결정 · 부리 공정 · 부록 3건 해소 |
| 이동 | `food assets/butchery/reference/` | 주방 배경 사진 4장 보존(파이프라인은 하위 폴더 미스캔) |

## 4. 구조상 위치
- `S3 손질 → 조작 축` : **회전은 뒤집기와 독립된 3번째 축**(계약 변경 = `types/Butchery.ts`).
- `S3 손질 → B1b 넙치류` : 트리(데이터) + 렌더(연출) + 에셋.
- `S3 손질 → B2 두족류` : **계약·데이터·에셋만**. 판정·트리·렌더는 미착수.
- 파급: `ButcheryStage.orientation` 위드닝으로 **어류 경로 10곳**이 타입 파손 → 어류 렌더는 건드리지 않고 경계 어댑터 `asFishOri`로 좁혀 해소.

## 5. 검증
| 대상 | 방법 | 결과 |
|---|---|---|
| 회전 | 실렌더 + 좌표 왕복 | 세로 렌더·유도선이 지느러미 경계에 정착(시작=꼬리 아래/끝=머리 위)·**4방향 왕복 변환 오차 0**·힌트·`R` 복구 |
| 벌어짐 | 실렌더 | 보간 진행·중앙선 개방 스크린샷·완료 정리 |
| 실사 | 실렌더 | `gutsExposed` 상태에서 실사 렌더, **흰 매트 없음** |
| 두족류 | 텍스처/아이콘 | 15/15 로드 · `cephByproductIcon` 분기 6케이스 |
| 회귀 | 미리보기 | 기존 사진 스프라이트 1~2px 재계산(`pure_fillet_bream` 30→29) — 회귀 없음 |
| 공통 | — | pageerror 0 · 빌드 4/4 · typecheck 0 |

**레이아웃 실측**: `ROT_SCALE 0.50` · `ROT_CY 350` → 도마 프레임 184~516. 상단 작업 패널(≈180)·하단 dev 상태줄(≈534)과 미충돌.
첫 시도(0.55 / 중심 295)는 작업 패널을 침범 — **실렌더로 잡았다**.

## 6. 잔여
| 항목 | 왜 안 했나 | 착수 조건 |
|---|---|---|
| 등쪽 단면 실사 `halibut_back_open` | 사진 2번 투명본 미입수 | 사용자 제공 |
| `ceph_skin`·`ceph_gill`·`ceph_inner_skin` | 전용 에셋 미보유 | 사용자 제공(없어도 트리는 진행 가능) |
| **두족류 트리 본체** | 이번 범위가 계약·데이터까지 | 스펙 §11.3 ②단계부터 |
| `FLAT_GUIDE` 좌표 5종 | 렌더가 바뀌어 재측정 필요 | 새 화면 기준 F9 실측 |
| 부리 카드(가이드 시트) | 실사 사진에 없는 스테이지 | 시트 SVG에 카드 추가 |

## 7. 위험·부작용
- **`orientation` 위드닝**은 계약 변경이다. 어류 경로는 어댑터로 막았으나, **새 어류 코드가 `ButcheryOrientation`을 그대로 받으면 두족류 뷰가 새어든다** — `asFishOri` 경계를 유지할 것.
- 누끼 임계 변경으로 **모든 사진 스프라이트가 재계산**된다. 새 에셋 투입 시 기존 키 회귀를 미리보기로 확인할 것.
- `jumpTo` 회전 자동 스냅은 dev 항법 전용 편의 — 실플레이 판정(`rotationOk`)을 우회하지 않는지 유지 확인.
- 부리 공정은 **사진 1:1 규칙의 명시적 예외** — 규칙을 아는 사람만 이해 가능하므로 스펙·시트 양쪽에 표기 유지.

## 8. 후속 반영
- [x] `02-SYSTEMS/butchery.md` §4·§5·§6
- [x] `04-BACKLOG.md`
- [x] `AGENTS.md` §9 (원문 기록 — 이 항목의 출처)
- [x] `IMPLEMENTATION_PLAN.md` 다음 착수
