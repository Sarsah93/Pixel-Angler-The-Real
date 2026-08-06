# 084차 — 광어 포 뜨기 공정 재정의: 3단계 × 4작업 + 칼 팔로우 연출 + 내장·머리 동반 + 실사 직접 렌더 폐지

| | |
|---|---|
| **날짜** | 2026-08-07 |
| **시스템** | `손질`(S3) · `에셋` |
| **트리거** | 사용자 공정 설명 + 캡처 3장 (1/3·2/3·3/3 연출 명세) |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 4/4 · 0 오류 |

---

## 1. 배경 (사용자 지시 — 원문 요지)

1. *"광어의 내장은 머리 제거 시 같이 딸려져 나오는 구조이므로, 머리 제거 시 같이 손질 부산물로 획득되도록"*
2. *"(1/2)의 그림과 (2/2)의 그림이 달라지는 게 이상함. … **실사 사진을 그대로 박아넣는 게 아니라**, 해당 실사를 바탕으로 자체 픽셀 그림을 만들어 애니메이션 연출까지 연결지어 활용하자"*
3. *"'위쪽(내장 위치) 포 뜨기'는 총 3단계로 구성해야 함. (다른 남은 3개의 위치도 마찬가지)"* —
   (1/3) 꼬리→머리 지느러미 경계 칼길(칼날 위) → (2/3) 머리→꼬리, 칼길 따라 살·뼈 분리(더 안쪽) →
   (3/3) 거의 중앙선 — 칼끝이 중앙선 칼집에 닿으며 필렛 분리.
4. **칼 연출**: reference 사시미칼 · **칼끝은 살에 파묻혀 비표시** · 드래그 경로 = 칼날 접점(노란 점선) ·
   드래그 0.1초 뒤 칼이 각도를 바꿔가며 **천천히 경로 끝까지** 따라옴 · **칼이 지나가면 두더지가
   땅 지나가듯 살이 들림**(왼손으로 잡아당기는 실제 동작의 표현).

## 2. 원인 *(리워크 — 82차까지의 2가지 오해 교정)*

| 오해 | 실제 (사용자 확정) |
|---|---|
| 포 뜨기 = 같은 경로 3회 긋기(score 1 + lift 3strokes) | **회차마다 경로가 다르다** — 경계→안쪽→중앙선으로 파고드는 3개 독립 경로 (56차 원칙과 동일 구조) |
| 실사 스테이지 사진을 도마에 직접 렌더(82차) | 실사는 **해부 참고자료** — 도마는 자체 픽셀 + 파라메트릭 연출로 통일 (중간에 그림체가 바뀌는 이질감 제거) |

벌어짐 기하도 교정: 구 78차 플랩은 **중앙선 고정 힌지**(중앙→경계로 컷 진행 전제)였으나,
실제 공정은 경계→중앙선으로 파고들므로 **힌지가 이동**한다(경계→중앙선). 자유로워진 살은
현재 절단선(힌지)을 축으로 반대편으로 젖혀지고, 힌지가 중앙선에 닿으면 반쪽 전체가 넘어간다.

## 3. 변경

| 구분 | 위치 | 내용 |
|---|---|---|
| 재구성 | `core/simulation/ButcheryProcess.ts` | `mkLift(side, half)` — 반쪽마다 `_score`/`_sep1`/`_sep2` 3스테이지(각 1회·독립 경로·sep2에 `yieldsFillet`). `flat_gut_scoop` 삭제. 머리 guide에 내장 동반 명시. **30스테이지**(구 27+... → 12 포뜨기) |
| 수정 | 〃 `FLAT_GUIDE` | `upSep1/upSep2/dnSep1/dnSep2` 신설(실측 경계·중앙선 보간 파생 — 머리→꼬리 순서) · `dnScore`를 중앙선 대칭 미러로 교체 · `upLift`/`dnLift`/`gutSweep` 삭제 |
| 수정 | `core/db-schema/ButcherySections.ts` | `t_head` yields `['head','viscera']` · `t_flb_guts` 삭제 · 포뜨기 task stageIds 3개 |
| 신설 | `core/config/tuning.ts` | `butchery.knifeFollowDelayMs(100)/knifeFollowSpeedPx(240)/knifeLenPx(74)/knifeTiltDeg(34)` + F8 슬라이더 4종. `flatOpenMs` 폐지 |
| 신설 | `public/butchery/knife_sashimi.png` | **자체 픽셀 아트 야나기바**(74×12 — ref5 실사 비례: 날:손잡이 7:3·세장비 8:1). 규약: **가로·칼끝 오른쪽·칼날 아래**. 생성 스크립트 scratchpad `gen_knife.cjs` |
| 재작성 | `ui/PixelButcherFish.ts` | `FlatSideState` = `{center, upDepth, dnDepth, upTaken, dnTaken, live?, scaled}` · **이동 힌지 렌더**(`depthAt`/`hingeY` — 노출 [경계..힌지] + 플랩 [힌지..미러]) · live 엔벌로프(칼 통과 구간만 열림 + 국소 융기 bump) · **82차 실사 스테이지 선택 블록 삭제** |
| 신설 | `ui/ButcheryPanel.ts` | 칼 팔로우 시스템 — `startKnifeFollow/feedKnife/tickKnife(33ms)/updateKnifeVisual/finishKnife/failKnife/completeKnife/stopKnifeFx` + `knifeImg`(crop = 칼끝 30% 파묻힘·원점 = 접점) |
| 삭제 | 〃 | 80차 후연출(`flatOpenAnim`/`startFlatOpenAnim`/`pendingFlatOpen`) · `flatLiftProgress` — 칼 팔로우가 대체 |

**칼 배치 일반식** (면/방향/회전 무관): 접점 = 경로 호길이 위치, 각도 = 진행각 ± `knifeTiltDeg`
중 **손잡이가 생선 바깥으로 가는 쪽**(중심 벡터 내적으로 선택), 칼날 방향 = 에지 법선·안쪽 내적으로 `flipY`.
칼 몸체·손잡이 경로(캡처의 빨간·검정 점선)는 이 식에서 자동 파생된다.

**딜레이 추종**: 드래그 좌표를 경로에 투영(최근접 세그먼트·단조 증가) → `{s, t}` 샘플 →
`knifeFollowDelayMs` 지난 샘플만 목표로 승격 → `knifeFollowSpeedPx`로 제한 추종.
컷 성공 = `finishing`(목표 = 경로 끝) + **`actionAnim` 가드로 입력 차단**, 완주 시
`doRefresh + runPendingAfterAction`(53차 "연출 완료 전 전환 금지" 규칙에 편입). 실패 = 칼 페이드 + 벌어짐 원복.

82차 실사 6키(`halibut_fin_score` 등)는 **데이터 잔존·참조 0** (파이프라인 재생성 대상이라 소스 유지 — 참고자료).

## 4. 구조상 위치
`S3 손질 → B1b 넙치류 → 포 뜨기`. **판정(스테이지 트리·좌표) + 렌더(이동 힌지) + 연출(칼 팔로우) 3층 동시 개편** —
계약 층은 `FlatSideState` 인터페이스만 변경(어류 다른 경로·두족류 무영향). 부산물 흐름은 yields 배열 이동뿐(경로 불변).

## 5. 검증 (Playwright 실렌더 — scratchpad `verify_knife_follow.cjs` · `verify_head_viscera.cjs`)

| 대상 | 결과 |
|---|---|
| 트리 정합 | 30스테이지 · 포뜨기 12 · gut 스테이지/작업 0 · 섹션 참조 누락 0 · 고아 0 |
| 경로 방향 | score y 400→254(꼬리↑머리) / sep1 y 254→400(머리↓꼬리) ✓ |
| 칼 팔로우 | mid-drag travel 92.7/161.7 · 딜레이 목표 추종 · 칼 표시·각도 −123°(진행각+기울기) · 스크린샷 = 접점 파묻힘·손잡이 바깥 |
| 두더지 벌어짐 | live 엔벌로프(xKnife 전달) — 칼 지나간 구간만 들림 스크린샷 / 정착 0.18 → 0.55 → 1.0 |
| 3/3 완료 | `upTaken` · 플랩 소멸·뼈 전장 노출 · **부산물 팝업 "껍질과 엔가와가 붙어있는 광어(넙치) 필렛 252g"** · 필렛 1/4 |
| 머리+내장 | 머리 S컷 완료 → 팝업 rows = **["광어(넙치) 머리 216g", "생선 내장"]** ✓ |
| 공통 | pageerror 0 · 빌드 4/4 · typecheck 0 |

## 6. 잔여

| 항목 | 왜 | 착수 조건 |
|---|---|---|
| **F9 실측 — 잔여 좌표 목록 갱신됨** | `upSep1/2`·`dnSep1/2`(보간 파생) + `dnScore`(미러 근사) + `engawa` — 구 목록(upLift/gutSweep)은 폐지 | **사용자 측정** (이 재구성 화면 기준) |
| 칼 연출 체감 튜닝 | delay 100ms·240px/s·기울기 34°는 초기값 | F8 슬라이더로 실플레이 조율 |
| 등쪽(BASE) 실드래그 확인 | 배쪽 완주로 검증 — 등쪽은 동일 코드 경로(자동 대칭) | 실플레이 |

## 7. 위험·부작용

- **knifeFx와 actionAnim은 한 쌍** — finishing 중 `actionAnim=true`를 세우고 `completeKnife`가 해제+`runPendingAfterAction`을 실행한다. 칼 세션을 우회 종료(뒤집기·destroy)하면 `stopKnifeFx`를 반드시 태울 것(playFlipAnim·destroy에 편입됨).
- **칼 텍스처 규약**: 가로·칼끝 오른쪽·칼날 아래. 교체 시 이 규약을 지키지 않으면 crop(칼끝 파묻힘)·flipY(칼날 방향) 판정이 반대로 뒤집힌다.
- `FlatSideState` 필드 교체 — 구 `upLift/dnLift/gutsExposed/opening`을 참조하는 외부 코드는 없음(빌드로 확인). 재장착·회수 흐름은 yields 기반이라 무영향.
- 구세이브: 손질은 **세션 상태**(진행 중 저장 없음)라 스테이지 id 변경의 세이브 마이그레이션 불요.
- 딜레이/속도 극단값(F8)에서 드래그보다 칼이 크게 뒤처지면 완주 연출이 길어진다 — finishing은 경로 끝 도달까지 입력을 막으므로 speedPx 하한 80 유지.

## 8. 후속 반영
- [x] `02-SYSTEMS/butchery.md` §3·§4·§5·§6
- [x] `04-BACKLOG.md` A1
- [x] `03-WORKLOG/README.md` 인덱스
- [x] `AGENTS.md` §9 요약
- [x] `IMPLEMENTATION_PLAN.md` 직전 완료·다음 착수(F9 좌표 목록 갱신)
