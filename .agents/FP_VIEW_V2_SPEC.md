# FP 정면 뷰 v2 + 채비/물고기 드로잉 + 파이트 피로 + 인벤토리 보강

> 대상: Pixel Angler The Real · 실행: Antigravity IDE agent
> 관계: `FP_RIG_ROD_SPEC.md`의 **로드 벤딩(PART B)은 그대로 유효**. 정면뷰 채비연동(PART A)은 **이 문서(v2)로 대체**.
> 원칙: core 물리는 최소 변경(피로 모델만 추가). 렌더러·데이터·UI 위주. 한국어 주석·`any` 금지·index.ts export.

---

## 1. 정면 뷰 v2 레이아웃 (동적 채비 + 좌 수평뷰 + 우 수직뷰)

### 1-1. 동적 채비 — 착수는 멀리, 릴링하면 화면 아래로
- 지금 찌가 고정점(waterline 상단)인 것을 **거리 원근 매핑**으로 교체.
- `surfaceY(distM)`: 먼 거리 → 화면 위(수평선 근처, 착수점), `distM↓`(릴링) → 아래로 내려와 **플레이어 쪽으로 딸려옴**.
  ```ts
  private surfaceY(distM: number): number {
    const t = Phaser.Math.Clamp(distM / this.cfg.castDistanceM, 0, 1);
    return Phaser.Math.Linear(FOREGROUND_Y, WATERLINE, t); // 가까움=아래(FOREGROUND_Y) / 멀리=위(WATERLINE)
  }
  ```
- 채비 앵커 = `(screenX(rig.floatX), surfaceY(distM) + bob)`. 미끼는 그 아래 `depthY` 오프셋. 릴링 로직(`distM` 감소·`floatX/baitX` 이동)은 그대로 두고 **렌더가 이 값을 세로 위치로 읽게만** 변경.
- 물고기 이동(좌 뒤로=distM↑·floatX 좌 / 좌하단 대각=baitZ↑·baitX 좌 / 릴링=distM↓)이 정면 채비·줄에 실시간 반영.

### 1-2. 좌측 = 수평뷰(top-down plan) [신규]
- 화면 좌측단(기존 임시 게이지 자리 → **게이지 제거**, 그 자리에 배치).
- 위에서 본 평면: 하단중앙=나, 상단=캐스팅 방향, 채비/물고기 마커 + 거리 링 + 조류 화살표. 물고기 좌우/전후 이동을 명확히.

### 1-3. 우측 상단 = 수직뷰(유지)
- 채비↔나 거리축 + 수심 게이지 + 해저 단면(기존 `renderDepthPanel` 유지).

### 1-4. 축 모호함 해소
정면=원근(거리 세로), 좌=평면(가로·거리), 우=수심 — 세 뷰가 각자 한 투영 담당, **모두 같은 스냅샷(distM·rig·heading) 소비** → 동시 반응.

> ⚠️ 좌상단 "피딩 골든타임 ×1.32 / 조류 본류대"는 목업 예시였음(실제 미배치). v2에선 그 자리 = 수평뷰. 피딩·조류 표시가 필요하면 별도 소형 배지로 분리.

### 1-5. 찌 투명도·침강 연출 + 물고기 그림자 선명도 (입질 단계 + 파이트)
깊이(z)를 **알파+세로위치**로 이중 표현. "얕을수록 선명, 깊을수록 투명"이 공통 규칙.

- **입질 단계별 찌 잠김·투명**: 1/2/3단계로 갈수록 찌가 더 깊이 물속으로 들어가며 alpha 감소. 기존 `floatSinkM`(1단계 0.05 / 2단계 0.10 / 3단계 0.25) 깊이에 alpha 매핑 — 1단계 살짝 흐림, 3단계 거의 잠겨 반투명.
- **파이트 중 찌**: 히트되면 찌는 **기본적으로 물속에 잠긴 반투명** 상태. 물고기 수직 위치(`baitZ`/깊이)에 따라 alpha·Y 실시간 변동 — 깊이 내려갈수록 투명, **강한 수직 박기(sinkVel 큼 or 바닥 근접) 시 alpha→0(아예 안 보임)**, 위로 올라오면 다시 진해지며 상승.
  ```ts
  // depthNorm = clamp(baitZ / zMaxM, 0, 1)
  bobberAlpha = clamp(1 - depthNorm * 1.15, 0, 1);   // 깊을수록 0, 하드다이브=완전 소멸
  bobberY     = surfaceY(distM) + depthNorm * DIVE_PIX; // 잠김 깊이만큼 아래로
  ```
- **물고기 그림자 선명도**: 수면 위로(얕게) 올수록 **선명**(alpha↑·blur↓·size↑), 깊을수록 흐림. 찌와 같은 "얕음=선명" 방향.
  ```ts
  shadowAlpha = clamp(1 - depthNorm, 0.15, 0.9); // 얕음 진함 / 깊음 옅음(최소 0.15)
  ```
- 로드 벤딩과 연동: 파이트 중 찌가 잠긴 상태 + 로드 크게 휨(FP_RIG_ROD_SPEC PART B). 찌 소멸 구간엔 로드 휨·줄 각도·그림자로 물고기 위치를 읽게 함.

---

## 2. 채비/미끼/루어/물고기 아이콘 드로잉 (황색 원 → 종류별·방향성)

### 2-1. 통합 드로잉 함수
황색 원 고정을 **파라메트릭 벡터 드로잉**으로 교체:
```ts
type RigIconKind =
  | { t: 'lure'; kind: LureKind }         // metal_jig/minnow/egi/spoon/spinner/worm_grub/soft_jerkbait
  | { t: 'bait'; kind: 'worm'|'shrimp'|'strip' } // 생/냉동/선어 미끼
  | { t: 'chum' }                          // 떡밥/집어제 (현재 통일 아이콘)
  | { t: 'fish'; speciesId: string };      // 파이트 중

/** g에 headingRad 방향으로 아이콘을 그린다. foreshorten으로 ~360° 커버 */
function drawRigIcon(g, cx, cy, icon: RigIconKind, headingRad: number, scale: number): void
```
- **종류별 실루엣**: 메탈지그=길쭉한 총알/마름모, 미노우=몸통+립+꼬리, 에기=새우형+천꼬리, 스푼=휘어진 블레이드, 스피너=블레이드+와이어, 웜/그럽=곱은 소프트바디+지그헤드, 떡밥=덩어리 군집.
- 색·크기는 LuresCatalogDB / BaitDatabase에서 주입(무게·호수 반영).

### 2-2. ~360° 방향성 (스프라이트시트 없이 2.5D)
- 회전(`rotate(headingRad)`) + **진행축 foreshorten**(`scaleX *= |cos(viewAngle)|`)으로 정면/후면은 짧게, 측면은 길게 — 좌우앞뒤가 하나의 벡터로 표현됨.
- 고정 이미지가 도는 게 아니라 매 프레임 heading으로 다시 그림 → 자연스러운 방향 전환.

---

## 3. 물고기 표현 (마름모 → 타원 + 머리/꼬리 + 목줄 연결 + heading 선행)

- **형상**: 타원 몸통 + **뒤쪽 삼각 꼬리** + 앞쪽 둥근 **머리(눈 점)** → 머리/꼬리 명확 구분. (기존 마름모 폐기)
- **목줄 연결**: 수중 낚싯줄의 끝(목줄)이 **물고기 머리 꼭짓점에 부착**(몸통 중앙 아님).
- **heading 선행(중요)**: 스프라이트 회전 = 물고기 `heading`(도주 의지, FightPhysics2D). 위치(displacement)보다 **heading을 빠른 lerp로 먼저 돌려**, 물고기가 가려는 방향으로 **머리가 먼저 향한 뒤 몸이 따라가게**. (좌 뒤로/좌하단 대각/릴링 딸려옴 모두 머리 선행으로 읽힘)
- 정면·수평뷰·수직뷰 모두 이 오벌-머리 드로잉 사용(2-1의 `fish` 케이스).

---

## 4. 파이트 피로 구간 (어종·사이즈별, mock 데이터)

> API 아님 — 웹 통념 + mock. movementProfile(staminaScale/runPower)에 **피로 페이즈 모델** 추가. 기존 `fishStamina`/`fishFatigueDelta` 소비.

### 4-1. 스태미나 풀 (어종 × 사이즈)
```
staminaMax = staminaBase(species) × sizeFactor(weightKg)   // sizeFactor ≈ weightKg^0.6
```
- 대물일수록 풀이 크지만(오래 버팀) thrust도 큼. 소형은 풀 작고 금방 지침.

### 4-2. 4페이즈 (잔여 스태미나 비율 r = stamina/staminaMax)
| 페이즈 | r 구간 | 거동 | 플레이 |
|---|---|---|---|
| RUN(강한 러닝) | r>0.65 | thrust 최대, 긴 러닝, 줄 풀림 | 버티기(드랙·스티어) |
| LULL(소강) | 0.35~0.65 | thrust 중간, 짧은 이동 | 펌핑으로 줄 회수 |
| SURGE(파상 저항) | 0.15~0.35 | 간헐 폭발(머리 흔들기·마지막 다이브) | 줄 터짐 위험 최고, 신중 |
| SPENT(제압) | ≤0.15 | thrust 붕괴, 옆으로 롤·부상 | 랜딩 윈도우 |

### 4-3. 회복·서지
- **회복**: 플레이어가 슬랙(릴링 정지·드랙 과이완)을 주면 물고기가 스태미나 소폭 회복 → "긴장 유지" 스킬 요소(고증: 쉬게 두면 다시 뜀).
- **서지 윈도우**: 주기적 짧은 버스트(진폭 = 잔여 스태미나 × runPower). SURGE 페이즈에서 빈도↑.
- 소비 배선: 페이즈가 `computeFishThrustKg`의 출력 상한을 게이팅, SPENT에서 저스태미나 롤(기존 FightPhysics2D)로 연결.

### 4-4. mock 초기값(어종 staminaBase, 튜닝)
청물(yellowtail/amberjack/greater_amberjack) 1.6~1.9 · 삼치 1.0 · 대구 1.2 · 참돔 1.1 · 농어 0.95 · 광어 0.7 · 두족류(squid/cuttlefish) 0.55 · 볼락 0.6. (movementProfile.staminaScale와 정합/대체)

---

## 5. 인벤토리 상세 보강 (어획물 무게·어종정보) [1인칭과 무관]

**실측 문제**: `ItemDetailPanel.buildItemDetail`의 `'어획물'` 케이스(118~124행)가 신선도·요리버프만 표시. 함수 인자 `Pick<InvItem, 'id'|'name'|'subCategory'|'category'|'qty'|'basePrice'|'condition'>`에 **길이·무게·어종 필드가 없어** 표시 불가.

**수정**:
1. `InvItem`(어획물)에 인스턴스 메타 `lengthCm`·`weightGram`·`speciesId` 보유(없으면 CaughtFishRecord에서 승계). 무게 미저장 시 길이-체중식 `W = a·L^b`(어종별 계수)로 산출.
2. `buildItemDetail` 인자 Pick에 위 3필드 추가.
3. `'어획물'` 케이스에 행 추가:
   - `길이` `{lengthCm} cm`, `무게` `{weightGram≥1000 ? (kg) : (g)}`, (있으면) `최대어 대비` 백분율.
   - **어종 정보**: FISH_DATABASE[speciesId] 조회 → `학명`(scientificName)·`영문명`·`제철`·`서식 수심/수층`·대표 습성. `desc`를 어종 description으로 대체/보강.
4. 요리/판매가 로직은 유지.

---

## 6. 구현 순서 & 검증
1. **client-pc/FirstPersonFishingScene**: `surfaceY(distM)` + 채비 앵커 세로 매핑, 좌측 수평뷰 렌더 추가, 임시 게이지 제거, `drawRigIcon` 도입(황색 원 교체), 물고기 오벌-머리 드로잉 + heading 선행 lerp.
2. **core**: FatigueModel(페이즈·회복·서지) → FightPhysics2D/`computeFishThrustKg` 연동, movementProfile에 staminaBase. index.ts export.
3. **client-pc/ItemDetailPanel + store**: 어획물 메타(lengthCm/weightGram/speciesId) 스레딩 + 어종정보 행(FISH_DATABASE 조회).
4. **아이콘 데이터**: LuresCatalogDB/BaitDatabase에서 실루엣·색 파라미터 주입.
5. **검증**: core build → client typecheck → 전체 build. 피로 페이즈 분포·surfaceY·heading 선행은 수치 시뮬 + dev 관찰. AGENTS/PLAN 갱신.

### 부록. 재사용 연결
- 물고기 heading/스태미나: FightPhysics2D(기존 스펙) 재사용. 로드 벤딩 부하: 동일 `fishPullKg`.
- 아이콘 파라미터: LuresCatalogDB·BaitDatabase. 어종정보: FISH_DATABASE.
- 세 뷰 동기화: 단일 RigKinematics 스냅샷(FP_RIG_ROD_SPEC PART A의 스냅샷을 v2 레이아웃으로 소비).
