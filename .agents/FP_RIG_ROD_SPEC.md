# 1인칭 정면 뷰 개편 — 채비 상태 연동 + 로드 벤딩 물리 구현 계획서

> 대상: Pixel Angler The Real · `packages/client-pc/src/scenes/FirstPersonFishingScene.ts`(138KB) · 실행: Antigravity IDE agent
> 두 개편을 하나로: **A) 정면 찌/줄/채비를 수평(조류)·수직(침강)·포즈 상태의 함수로** + **B) 로드를 파워/액션·부하에 따라 곡선(∩)으로**.
> 원칙: **core 물리(`stepUnderwater` 등)는 손대지 않음.** 렌더러(client-pc) + `RodSpec` 데이터만 확장. 한국어 주석 · `any` 금지 · index.ts export.

---

## 0. 현재 코드 진단 (실측)
씬은 이미 단일 물리 상태를 갖고 있음:
- `updateDrift()`(~1627) → core `stepUnderwater()`로 `this.rig`(`floatX`·`baitX`·`baitZ`·`settled`) 매 프레임 갱신.
- 부속 상태: `distM`(거리), `tidal`(TidalCurrentEngine), `lineTension.alignmentIndex`(정렬도 0~1), `seabed`(SeabedProfile), `rigPose`('idle'|'lift'|'fall'|'retrieve'|'twitch'|'hop')·`poseTimer`, `floatSinkM`, `rodBendDeg`.
- **수직뷰** `renderDepthPanel()`(~2401)/`renderSeabedSection()`(~2565)는 이 상태를 풍부히 소비(거리축·`baitX-floatX` 편차·`baitZ`·해저 단면).
- **정면 뷰** `renderRigVisuals()`(~2341)는 얕게 소비: 찌 X=`screenX(rig.floatX)`, 미끼=`(screenX(baitX), depthY(baitZ))`, 줄 활 `(1-alignmentIndex)*14`. 세로 흔들림은 **고정 사인파 `Math.sin(now/500)*2.2`**, 조류·침강속도·`rigPose`가 정면에 미반영.
- **로드** `renderRod()`(~2676)는 이미 5절 곡선(2711~2727)이나, **`BEND_SHARE=[0,0,0.22,0.33,0.45]`(2700) 고정**(사실상 엑스트라패스트 테이퍼) + **`totalBendRad`(2704)가 `rodBendDeg`+`baseTension`만 반영**(부하·파워 무관).

---

## PART A. 정면 뷰 채비 연동

### A-1. 프레임당 RigKinematics 스냅샷 (단일 소스 → 두 렌더러 공유)
`updateDrift` 직후 스냅샷 1개를 만들어 `renderRigVisuals`·`renderDepthPanel` 양쪽에 주입(각자 `this.rig` 직접 읽기 → 어긋남 방지).
```ts
interface RigKinematics {
  floatX: number; baitX: number; baitZ: number;   // this.rig
  driftX: number;                                  // tide.x 부호·세기 (수평 조류)
  currentSpeed: number;                            // hypot(tide.x, tide.y)
  sinkVel: number;                                 // (baitZ - prevBaitZ)/dt
  alignment: number;                               // lineTension.alignmentIndex
  settled: boolean;                                // this.rig.settled
  pose: RigPose; posePhase: number;                // rigPose, poseTimer 기반 0~1
  chop: number;                                    // 날씨 파고(수면 흔들림 진폭)
  lateralDev: number;                              // baitX - floatX (하류 끌림)
}
```

### A-2. renderRigVisuals 매핑 (고정 사인파 → 상태 구동)
| 상태 | 정면 연출 |
|---|---|
| `driftX`/`currentSpeed`(수평) | 찌가 드리프트 방향으로 tilt, 수면 라인 진입각을 조류·정렬도로, 찌 뒤 표면 유선(streak) 1가닥 |
| `sinkVel>0`(침강 중) | 찌가 비스듬히 낮게 눕고 목줄 슬랙 |
| `settled`/`alignment↑` | 찌가 **직립(찌가 서는 연출)**하며 균형 수위로 부상, 줄이 곧게 정렬(settle 트윈) |
| `lateralDev`(수직뷰와 동일값) | 정면에서 미끼가 하류로 끌려 사선 |
| `pose=lift` | 줄 팽팽 + 미끼 상승 |
| `pose=fall` | 줄에 배 + 미끼 팔랑이며 침강(폴링 강조) |
| `pose=twitch` | 찌·미끼 옆으로 톡(다트) — `posePhase`로 감쇠 |
| `pose=hop` | 바닥 튕김 |
| `pose=retrieve` | 찌·미끼 유저 쪽 이동 + 앞 물결 |
| `chop`(날씨) | bob 진폭 = 상수 대신 파고 비례 |
- 세로 흔들림 상수 `2.2` 제거 → `chop` 기반. 줄 활 `(1-alignmentIndex)*14`는 유지하되 settle 트윈과 연결.

---

## PART B. 로드 벤딩 물리 (파워·액션·부하)

### B-1. RodSpec 확장 (데이터 — Gear 타입 + GearSpecs)
```ts
// 기존 RodSpec에 추가
power: 'UL'|'L'|'ML'|'M'|'MH'|'H'|'XH';
action: 'slow'|'moderato'|'regular'|'moderatoFast'|'fast'|'extraFast';
```
매핑(캡처 두 표 = 이 표):
| power | powerCapacityKg(풀벤딩 하중) | | action | actionTipBias | 버트:팁 |
|---|---|---|---|---|---|
| UL | 1.5 | | slow | 0.40 | 4:6 |
| L | 2.5 | | moderato | 0.50 | 5:5 |
| ML | 4.0 | | regular | 0.60 | 6:4 |
| M | 6.0 | | moderatoFast | 0.70 | 7:3 |
| MH | 9.0 | | fast | 0.80 | 8:2 |
| H | 13.0 | | extraFast | 0.90 | 9:1 |
| XH | 20.0 | | | | |
> 수치는 근사 초기값(튜닝). GearSpecs 기존 로드에 power·action 채우고, 손잡이/스펙 UI에 사용가능 루어중량 범위 표기(캡처 각주).

### B-2. 액션 → 휨 분배 BEND_SHARE (하드코딩 → 보간)
`actionTipBias(tb)`로 두 프로파일 lerp:
```
SLOW   = [0.05, 0.12, 0.22, 0.28, 0.33]   // 버트까지 퍼짐(포물선 ∩)
XFAST  = [0.00, 0.00, 0.10, 0.30, 0.60]   // 팁 집중
BEND_SHARE[i] = lerp(SLOW[i], XFAST[i], (tb-0.4)/0.5); // 정규화 후 합=1로 리스케일
```

### B-3. 파워+부하 → 휨 크기 totalBendRad
```
bendFraction = clamp(loadKg / powerCapacityKg, 0, 1.2);
totalBendRad = bendFraction * MAX_BEND_RAD;   // MAX_BEND_RAD ≈ 1.15 rad(≈66°)
```
- UL+대물 → fraction 1.2 → 온몸 ∩. XH+같은부하 → 소폭. (荷重1kg 차트 재현)
- 고부하 곡선이 각지지 않게 `SUB`(2706)을 4→6~8.

### B-4. 부하 loadKg 소스 (어종·무게·처박는 힘)
- **입질 대기**: `rodBendDeg`(찌 당김) × 어종 크기(tier) 가중.
- **파이팅**: 2D 파이트 물리의 `fishPullKg`/`combinedTension`(difficulty×tier×스태미나×rage의 축방향 = "아래로 처박는 힘")을 그대로 loadKg로 사용 → 파이트 시스템과 자연 연동.
- **스티어 연동**: `←/→` steer를 로드 전체 좌우 기울기로(현 `bendSign`(2703)은 물 쪽 방향만 처리 → steer lean 각 가산). "옆으로 눕혀 버티기"가 로드 곡선에도 반영.

---

## 1. 구현 순서 & 파일
1. **client-pc/FirstPersonFishingScene.ts**
   - `updateDrift` 호출부 뒤에 `buildRigKinematics()` 스냅샷 생성(prevBaitZ 보관 for sinkVel).
   - `renderRigVisuals(snap)` 재작성: 고정 `wave`/`sinkPx` → 스냅샷 매핑(A-2).
   - `renderDepthPanel(snap)`도 스냅샷 인자화(동일 상태 보장).
   - `renderRod()`: `BEND_SHARE`(2700)→B-2, `totalBendRad`(2704)→B-3, `bendDeg` 대신 `loadKg`, `SUB` 상향, steer lean 가산.
   - `computeRodLoadKg()` 헬퍼(입질/파이팅 분기 B-4).
2. **core**: `RodSpec`(Gear 타입)에 `power`·`action` 추가 + `rodPowerCapacityKg()`/`rodActionTipBias()` 매핑 유틸. `GearSpecs.ts` 기존 로드에 값 채움. index.ts export.
3. **연동 확인**: 파이트 2D `fishPullKg`(FightPhysics2D)와 loadKg 배선, movementProfile의 dive 성분이 큰 어종일수록 처박음→깊은 휨으로 자연 반영.
4. **검증**: core build → client typecheck → 전체 build. 벤딩 곡선·정면 연동은 dev 서버 관찰(스냅샷 값은 콘솔/게이지로 확인 가능).
5. **문서**: AGENTS.md·IMPLEMENTATION_PLAN 갱신.

## 2. 리스크 & 튜닝
- 리스크 낮음(core 물리 불변, 렌더러+데이터만). `RodSpec` 필드 추가 시 기존 로드 전수 채움 필요(빌드 오류 방지).
- 튜닝: powerCapacityKg 스케일, MAX_BEND_RAD, SLOW/XFAST 분배, chop→bob 진폭 계수, streak 세기, twitch 감쇠 — 플레이 테스트.

---

### 부록. 기존 시스템 연동 요약
- 상태 소스: `this.rig`·`distM`·`tidal`·`lineTension.alignmentIndex`·`seabed`·`rigPose`(전부 기존).
- 부하 소스: 파이트 2D `fishPullKg`(FightPhysics2D 스펙) 재사용 → 로드 벤딩=파이트 물리의 시각화.
- 수직뷰(renderDepthPanel)와 정면뷰가 같은 스냅샷 소비 → "세 뷰 동일 움직임" 구조적 보장.
