# 085차 — 포 뜨기 개방 범위 머리쪽 확장(S컷 곡선 클리핑) + 필렛 아이콘 반쪽 에셋 교체(내장 유무 매핑)

| | |
|---|---|
| **날짜** | 2026-08-07 |
| **시스템** | `손질`(S3) · `에셋` |
| **트리거** | 사용자 피드백 2건 + 신규 에셋 2장 (캡처 2장) |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 4/4 · 0 오류 |

---

## 1. 배경 (사용자 지시 — 원문 요지)

1. *"머리쪽 열려지는 부분이 (빨간 동그라미처럼) 조금 더 위까지 확장되어도 될 것 같아. …
   캡처의 등쪽 한 면 포 뜨는 작업에만 적용하지 말고, **전체 포 뜨는 과정에서 적용되는 범위를 늘리라**"*
2. *"현재 적용중인 필렛 이미지는 등쪽/배쪽의 **포 2개가 한번에 붙어있는**(3면뜨기용) 이미지 —
   수정해서 올려둔 `skinned_upper_pillet_halibut.png` / `skinned_under_pillet_halibut.png` 로 변경할 것"*
   + 보충: **"upper pillet은 내장이 없는 쪽 필렛, under pillet이 내장쪽 필렛"**
3. **광어 가이드가 다 끝나야 두족류를 시작** (우선순위 확정 — 두족류 트리는 광어 잔여 뒤로).

## 2. 원인

| # | 기전 | 확정 근거 |
|---|---|---|
| ① 개방이 머리 못 미침 | 가이드 경로(score/sep)는 머리 절단면(x≈0.262)까지 닿는데, **렌더 엔벌로프가 세로선 `bodyL = 0.28`에서 잘려** S컷 절단면(곡선, x 0.208~0.288)과의 사이 쐐기 구간이 안 열렸다 | `PixelButcherFish.ts` 구 `bodyL` 상수 + FLAT_GUIDE 좌표 대조 |
| ② 필렛 아이콘 오배정 | `trim_fillet_engw_halibut_1/2` = **3면뜨기 결과물용**(등·배 포 2장이 한 덩어리) 이미지를 다섯장뜨기 반쪽 필렛에 배정 + 선택 기준도 섹션(등/배)뿐이라 위/아래 반쪽 구분 자체가 없었다 | `ButcheryPanel.ts` 구 927행 |

내장쪽 반의 위치는 **면마다 반대** (082차 확정): 배면(FLIP) 위 = 내장쪽 / 등면(BASE) 아래 = 내장쪽.
→ 작업 id 매핑: `t_flb_upper`(배·위)·`t_flk_lower`(등·아래) = 내장쪽 = **under** / 나머지 2작업 = **upper**.

## 3. 변경

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `public/trimmings/` | `skinned_upper_pillet_halibut.png`(262×107) · `skinned_under_pillet_halibut.png`(250×98) 복사 — 테두리 투명 검사 0/248·0/234 통과(누끼 불요) |
| 수정 | `scenes/BootScene.ts` | `trim_fillet_engw_halibut_upper`/`_under` 키 신설. **구 `_1`/`_2` 키는 구세이브 아이콘 호환으로만 유지**(기지급 아이템의 iconTexture 문자열이 세이브에 남음) |
| 수정 | `ui/ButcheryPanel.ts` | `buildYieldRows(yields, taskId?)` — **taskId 스레딩**(`showByproductPopup` 5번째 인자 · `accrueYields` 2번째 인자 · 호출부 3곳). `flatFillet` 케이스: `gutSide = taskId === 't_flb_upper' \|\| taskId === 't_flk_lower'` → under/upper 선택 |
| 재작성 | `ui/PixelButcherFish.ts` `drawFlatFish` | **개방 한계 = 머리 S컷 절단면 곡선**: `cutXatY(y)`(headCutPath 보간 — y 단조) + `clipSpan(x, a, b)`(컬럼 y스팬을 절단면 몸통 쪽으로 클리핑 — 최장 허용 런 + 경계 선형 보간) 신설. `bodyL = max(0.19, S컷 최소 x ≈ 0.208)`로 확장, `boneRegion`(폴리곤·갈비 빗살·척추 마디)·`flapOverlay`(플랩·가장자리·살결) 전부 컬럼별 클리핑, 컬럼 N 12→16 |
| 신설 | 〃 | `centerL = 0.28` 분리 — 중앙선 칼집 자국은 F9 실측 랜드마크 그대로(개방 확장과 무관하게 불변) |

## 4. 구조상 위치
`S3 손질 → B1b 넙치류 → 포 뜨기`. ①은 **렌더 층만**(판정·트리·가이드 좌표 무변경 — headCutPath는 55차
erase 메커니즘이 이미 프레임 정규화로 공급). ②는 **지급(데이터) 층** — taskId 스레딩은 옵션 인자라
어류 다른 경로·두족류 무영향, 아이콘 문자열만 변경.

## 5. 검증 (Playwright 실렌더 — scratchpad `verify_fillet_assets_open.cjs` · `verify_mid_flap.cjs`)

| 대상 | 결과 |
|---|---|
| 텍스처 | upper/under/구 _1 전부 로드 ✓ |
| 아이콘 매핑 4케이스 | `t_flb_upper→under` · `t_flb_lower→upper` · `t_flk_upper→upper` · `t_flk_lower→under` — 4/4 PASS |
| 실지급 경로 | devJumpToTask 경유 지급 3건 = 배·위 under / 배·아래 upper / 등·위 upper ✓ (taskId가 accrue까지 관통) |
| 개방 확장 (등면) | 위 포 완료 스크린샷 — 노출 영역이 꼬리 칼집→**머리 S컷 절단면까지** 도달, S커브 불룩 구간(중앙 부근)은 정확히 남음 (`zoom_shot_back_up_done.png`) |
| 개방 확장 (배면) | 동일 확장 확인 (`zoom_shot_belly_up_done.png`) |
| 중간 상태(플랩) | sep1 완료(깊이 0.55) — 분홍 플랩+갈비 노출이 머리까지 확장, **몸 밖 삐져나감 0** (`zoom_back_up_mid.png` — 사용자 캡처와 동일 상태 재현) |
| 공통 | pageerror 0 · 빌드 4/4 · typecheck 0 |

## 6. 잔여

| 항목 | 왜 | 착수 조건 |
|---|---|---|
| F9 실측 — `upSep1/2`·`dnSep1/2`·`dnScore`·`engawa` | 084차 목록 그대로(이번 변경은 렌더 클리핑이라 좌표 무변경) | **사용자 측정** (084 화면 기준 유효) |
| 등쪽 단면 실사 (`halibut_back_open`) | 사용자 사진 2번 투명본 대기 | 에셋 입수 |
| 칼 연출 체감 튜닝 (delay/speed/tilt) | F8 초기값 | 실플레이 |
| **광어 완료 → 두족류 트리 착수** | 사용자 우선순위 확정 (085 지시 3) | 위 광어 잔여 소화 후 |

## 6-b. 후속 (같은 날) — 엔가와 분리 **도마 슬랩**도 반쪽 실사로 (사용자 재지시)

> *"필렛 1~4번 껍질 분리 시 사용되는 이미지가 돔류(bream)의 필렛으로 적용되어 있네. …
> `skinned_upper_pillet_halibut`와 `skinned_under_pillet_halibut`를 각각 2개씩 나눠서 적용해야"*

아이콘(§3)만이 아니라 **엔가와 분리 스테이지의 도마 슬랩**(FLESH_UP 뷰)도 반쪽 실사여야 한다는 지시.
구 슬랩은 `pure_fillet_halibut`(엔가와 **제거본** — 물리 상태도 안 맞았다) 단일 이미지였다.

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `food assets/butchery/` | `fillet_upper_halibut.png` · `fillet_under_halibut.png`(trimmings 원본 복사 — 파일명 = 키) |
| 수정 | `tools/pixelize_butchery.cjs` | `MIRROR_KEYS` 2건 추가 — 원본 머리 왼쪽 → **필렛 규칙(꼬리 왼쪽·머리 오른쪽)** 반전 |
| 재생성 | `data/PixelFishStages.ts` | `fillet_upper_halibut`(128×38) · `fillet_under_halibut`(128×47) — 기존 18키 무변경 |
| 수정 | `ui/PixelButcherFish.ts` | `PixelFishState.flatFilletKind` 신설 + FLESH_UP 슬랩이 `fillet_{kind}_halibut` 우선. **반쪽 실사엔 파라메트릭 엔가와 스트립을 겹쳐 그리지 않는다**(사진에 엔가와 포함) |
| 신설 | `ui/ButcheryPanel.ts` | `flatFilletKind()` — 통짜 = `engawa_N` 지급 순서 매핑(**1·4 = 내장쪽 under / 2·3 = upper**) · 재장착 = 원물 iconTexture로 판정 · 구세이브 합체 아이콘(_1/_2) = undefined(순수 필렛 폴백) |

검증(실렌더): 필렛 1 = under(갈비·배벽 구조) / 필렛 2 = upper(매끈한 반달) 스크린샷 — 꼬리 왼쪽 정합·
스트립 중복 없음 / kind 4매핑(1 under·2 upper·3 upper·4 under) PASS / pageerror 0 / 빌드 4/4·typecheck 0.
참고: **박피 단계는 무변경** — 박피 대상은 엔가와 제거된 필렛이라 기존 `pure_fillet_halibut`이 물리 정합.

## 7. 위험·부작용

- **구세이브 기지급 필렛은 구 합체 아이콘 유지** — iconTexture 문자열이 세이브에 저장되므로 소급 변경하지
  않았다(반쪽 정보(위/아래)를 아이템 id에서 복원할 수 없음). 구 `_1`/`_2` 키 로드를 지우면 speciesId 폴백
  (온마리 사진)으로 떨어지니 **BootScene의 호환 로드 2줄을 지우지 말 것**.
- `clipSpan`은 headCutPath **y 단조**를 전제(FLAT_GUIDE.headScut이 위→아래 단조). 비단조 경로를 넣으면
  보간이 첫 매칭 세그먼트로 떨어져 경계가 어긋난다 — S컷 좌표 재측정 시 순서 유지.
- 플랩은 절단면에서 잘린다(몸 밖으로 안 젖혀짐) — 물리적으로는 젖힌 살이 절단면 밖으로 늘어질 수 있으나
  도마 위 부유 픽셀을 막는 쪽을 택했다. 어색하면 플랩만 클리핑 제외 검토.
- 헤드컷 미보유 폴백(비 flat/데이터 결손)은 구 동작(0.28 세로선) 그대로 — 회귀 없음.
- (6-b) 엔가와 슬랩 kind 매핑은 **엔가와 스테이지 번호 = 필렛 지급 순서**(배위1·배아래2·등위3·등아래4)를
  전제 — `mkLift` 호출 순서나 `sec_engawa` 스테이지 번호 체계를 바꾸면 1·4↔2·3 매핑도 함께 손볼 것.

## 8. 후속 반영
- [x] `02-SYSTEMS/butchery.md` §4·§5
- [x] `04-BACKLOG.md` A1
- [x] `03-WORKLOG/README.md` 인덱스
- [x] `AGENTS.md` §9 요약
- [x] `IMPLEMENTATION_PLAN.md` 직전 완료·다음 착수(우선순위 — 광어 완료 후 두족류)
