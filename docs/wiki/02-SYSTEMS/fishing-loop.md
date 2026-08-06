# S1. 낚시 루프 (캐스팅 → 입질 → 파이트 → 어획)

> 상태 **🟢 운영** — 핵심 루프 완성, 확장(어탐)만 남음.
> 관련 차수 9·11·12·15~19·24·25·28~30·32~37

---

## 1. 목적·범위

탑다운 필드에서 **캐스팅 착수** → 1인칭 전환 → 물속 시뮬레이션 → 어획까지. 손질/판매는 다른 시스템.

## 2. 구성

| 계층 | 파일 | 역할 |
|---|---|---|
| core | `CastingPhysicsEngine` | 3D 탄도(완력·바람·항력) · 착수 판정 |
| core | `UnderwaterSinkPhysics` | 라인각 모델 — `tanθ = angleK·조류 / Weff^exp`, swept/침강 분기 |
| core | `TidalCurrentEngine` | 조수·반탄류·**조경지대(Hit Zone)**·횡조류·본류 5존 |
| core | `SeabedProfile` | 거리 연속 해저(암초·수초·수심) — 어탐 전제 |
| core | `LineTensionPhysics` | 뒷줄견제 = **그 지점 홀드** + 정렬도 A 진행 |
| core | `ChumPhysics` | 밑밥 파슬 3D(침강·확산·코팅) + `computeChumSync` |
| core | `BiteProbabilityEngine` · `BiteSequenceEngine` | 입질 확률 · **3단계 구부러짐 시퀀스**(패턴 7종·`provoke`) |
| core | `FightingPhase` · `FightPhysics2D` · `FishFatigueModel` | 텐션·패턴·측면하중 2D·피로 페이즈 |
| core | `FishSpawningOracle` · `SizeTierRules` · `FeedingTimeCalculator` | 어종 스폰 · 크기 등급 · 피딩타임 배율 |
| core | `LureRig` · `SinkerDatabase` · `RigRecommender` | 루어 채비 연산 · 봉돌 · 채비 추천 |
| client | `RegionFieldScene` | 조준 캐스팅(차지·탄도 미리보기·**릴링 경로 육지 차단**) |
| client | `FirstPersonFishingScene` | 1인칭 전 뷰(정면·수평·수심) · 입력 · 연출 |
| client | `FieldEventManager` | 보일링·스쿨링 |

## 3. 동작 구조

```
[탑다운] 좌클릭 유지 → 차지 → 릴리즈 → 탄도 비행
        └ 게이트: 손 착용 낚싯대 · 착수점=바다 · 릴링 경로에 육지 없음 · 자전거 미탑승
[착수] → pause+launch → 1인칭
   ① 드리프트   침강(라인각) · 조류 5존 · ←→ 채비 횡이동 · H 홀드 · C 밑밥
   ② 입질       BiteSequenceEngine 3단계(찌 잠김 α 연동) — 확률 = P_base
                 × 지형 × 정렬도 × 액션(루어) × 밑밥동조 × 피딩타임 × 낚시지수
   ③ 챔질       우클릭 — 1단계 5% / 2단계 20% / 3단계 100% (릴리즈 후 실패)
   ④ 파이트     텐션 30~80 유지 · ↑버티기 · ←→ 로드 스티어 · 피로 SPENT → dragIn
   ⑤ 회수·랜딩  거리→크기/투명도 수렴(70% 지점 2배) · 발앞 3m 랜딩
   ⑥ 결정       [쿨러] / [인벤토리] / [방생]
[회수] 릴링으로 0.5m 도달 = 채비 회수 → 탑다운 복귀
```

## 4. 세부과제 현황

| 과제 | 상태 | 차수 |
|---|---|---|
| 챔질 3단계 시퀀스 + 어종 패턴 | ✅ | 19차(1인칭 개편) |
| 조류 5존 + 조경지대 Hit Zone | ✅ | 19 |
| 채비 회수 → 필드 복귀 | ✅ | 9 |
| 루어 액션 그래머(다트·저킹·폴링·호핑) | ✅ | 12 |
| 파이트 2D 측면하중 + 로드 스티어 | ✅ | 12·15 |
| 피로 페이즈(RUN/LULL/SURGE/SPENT) | ✅ | 16 |
| 밑밥 3D 파슬 + 동조율 | ✅ | 24·26·34 |
| 접근 연출(거리→크기·α·SINK CAMEO) | ✅ | 28·29 |
| 찌/수중찌 분리 + 지형 관통 클램프 | ✅ | 25·30 |
| 로드 벤딩(하중측 5분절·축 재교차 금지·포어쇼트닝) | ✅ | 33·35 |
| 침강 라인각 모델 rev2 | ✅ | 38 |
| 크기 등급 + 피딩타임 + 보일링/스쿨링 | ✅ | 11 |
| 통합 가이드 허브 | ✅ | 27 |
| **어탐 레이더** | ⬜ | SeabedProfile 조회 UI |
| 가이드 삽화 실게임 스크린샷 교체 | ⬜ | 현재 목업 SVG 렌더 |
| 사운드 이펙트 | ⬜ | 전역 과제 |

## 5. 잔여·차기
- 어탐 레이더(D1 구조는 준비됨) · 사운드 · 삽화 교체 · 탑다운에서 가이드 허브 진입.
- 신규 해양 API 5종(어초·해수유동·수치조류도·수심·조석예보) 연동 — `IMPLEMENTATION_PLAN` Q5.

## 6. 함정·불변조건
1. **1인칭은 `pause + launch` / 복귀는 `stop + resume`** — `scene.start` 금지.
2. **조류 드리프트 거리 하한**(0.3m)이 회수 판정(0.5m)보다 커지면 영원히 회수 불가 — 19차 실버그.
3. 입질 확률 배율은 **곱 체인**이다. 새 요소를 넣을 때 기존 배율을 대체하지 말 것(중복 확률식 금지).
4. `FightingPhase`는 프레임레이트 정규화(`1−exp(−rate·dt)`)를 지킨다.
5. FP 씬 ESC는 popupStack이 아니라 **하드코딩 순서**(인벤→쿨러→종료) — 강제 방생 `lockedOpen`이 얽혀 있다.
