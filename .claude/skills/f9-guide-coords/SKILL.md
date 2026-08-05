---
name: f9-guide-coords
description: Pixel Angler 손질 가이드 좌표 F9 실측 → core 반영 워크플로. 사용자가 dev F9 편집기로 측정한 절단선/스윕 좌표를 전달하거나, 유도선 위치 조정·좌표 확정 작업이면 반드시 로드. "F9", "좌표 실측", "가이드선", "유도선 반영", "측정본" 작업이면 이 스킬을 따른다.
---

# F9 가이드 좌표 실측 → core 반영

## 흐름

사용자가 dev(F9) 편집기에서 선을 조정 → [복사] 스니펫 전달 → **core 데이터에 반영** → core 리빌드 → 판정 검증. F9 편집은 런타임 전용이라 코드 반영 없이는 휘발된다.

## 반영 위치 (전부 `packages/core/src/simulation/ButcheryProcess.ts`)

| 대상 | 위치 |
|---|---|
| 돔류/방어류 가이드 좌표 | `GUIDE_COORDS: Record<'bream'|'amberjack', GuideCoordSet>` — 시메 tapPoint·방혈·머리 앞/뒤·비늘 스윕·지느러미 3선·꼬리 등 9세트 |
| 넙치류(광어) | `FLAT_GUIDE` — 시메·방혈·머리 S커브(7점)·비늘 스윕·꼬리·중앙선·상/하 경계 칼길·포 뜨기·내장·엔가와 |
| 개별 스테이지 컷 | `cut('id', 'ORIENT', [{x,y},…], opts)` 헬퍼 / `tapPoint` / `sweepPath` |

## ⚠ 함정 (반복 발생)

1. **[복사] 스니펫은 opts를 누락한다** — 기존 `{ strong, tolerance, strokesRequired, yieldsFillet, guidePaths }` 등 옵션을 **반드시 보존**하고 좌표 배열만 교체. 스니펫을 통째로 붙여넣으면 판정 옵션이 사라진다.
2. **core 리빌드 필수**: 반영 후 `npx pnpm --filter @tra/core run build` — 하지 않으면 client가 stale dist의 옛 좌표를 봄 (31·32차 패턴).
3. 좌표는 **도마 rect 정규화 (0~1)** — 측정 시점의 뷰/방향(BASE/FLIP/BELLY_UP…)과 스테이지 orientation이 일치해야 한다. 개복 이후 전용 뷰(복면/체강)는 **그 뷰 안에서만** 유효한 좌표.
4. 55차 원형 틀 고정(computeFishFrame) 이후 개복 전 측면 뷰 좌표는 스프라이트 교체와 무관하게 유효 — 재측정 불요. 단 **뷰 자체가 바뀌면**(신규 전용 뷰 도입) 그 구간은 재측정.
5. 머리 절단선은 삭제 영역(headErasePoly)도 자동으로 따라온다 — 선만 반영하면 됨.

## 다중 선·스윕 규칙

- 지느러미처럼 선이 여러 개면 `opts.guidePaths: CutPoint[][]` — 각 선 1회씩·순서 자유·같은 선 재긋기 실패. 선 수가 strokesLeft를 결정.
- 문지르기류(비늘/내장/핏줄)는 `sweepPath` — 커버리지 게이지(44샘플·반경 0.06)가 경로 전체 훑기를 요구.
- 다회 칼집(장뜨기 회차)은 **회차별 독립 스테이지 + 각자 실측 좌표**가 원칙 (같은 선 3회 요구는 벌어진 살과 어긋남 — 56차 교훈).

## 검증 (반영 후 필수)

core 실판정 스크립트로 **"가이드를 그대로 따라 그으면 cov 1.00 통과"** 확인:
- `evaluateCut`에 가이드 경로 자체를 트레이스로 입력 → coverage 1.00 · 통과.
- 순차 진행 케이스(스테이지 전환)와 **역방향/이탈 트레이스 실패**도 1건씩.
- ⚠ 하네스에서 `jumpTo`는 autoOrient=false면 방향을 안 바꿔 canAct false → cov 0으로 조용히 실패 — 방향 스냅 후 판정.
- 렌더 확인은 verify-render 스킬 (유도선이 몸통 위 정위치인지 스크린샷).
