---
name: f9-guide-coords
description: Pixel Angler 손질 가이드 좌표 F9 실측 → core 반영 워크플로. 사용자가 dev F9 편집기로 측정한 절단선/스윕 좌표를 전달하거나, 유도선 위치 조정·좌표 확정 작업이면 반드시 로드. "F9", "좌표 실측", "가이드선", "유도선 반영", "측정본" 작업이면 이 스킬을 따른다.
---

# F9 가이드 좌표 실측 → core 반영

## 흐름

**315차부터 기본은 [확정] 단추**(사용자 지시 — 「좌표값을 일일이 복사 붙여넣기 하지 않아도 확정」):

1. 사용자가 dev 서버 위 게임에서 F9로 선을 맞추고 **[확정]**(이 어종) 또는 **[군 확정]**(어종군 전체 — 두족류 · 장어류는 없음)을 누른다.
2. dev 서버(`vite.config.ts` `devButcheryGuidePlugin`)가 `tools/f9_captures/captures.json`(정본)에 합치고 `log.jsonl`에 한 줄을 남긴 뒤
   `node tools/apply_f9_captures.cjs`로 core 표 `ButcheryGuideOverrides.ts`(자동 생성)를 굽는다.
3. 에이전트는 `log.jsonl` 새 줄을 읽고 → `npx pnpm --filter @tra/core run build` → 아래 「검증」(가이드 그대로 그으면 cov 1.00) → 커밋.
   - 컨테이너 dev 서버로 확정했으면 파일이 이 컨테이너에 바로 생긴다. 실시간으로 받으려면 백그라운드로 `log.jsonl` 줄 수를 지켜본다
     (`until [ $(wc -l < tools/f9_captures/log.jsonl) -gt N ]; do sleep 5; done` — 끝나면 에이전트가 다시 깨어난다).
   - 사용자 PC dev 서버로 확정했으면 그 PC 저장소에 생긴다 — 사용자가 커밋 · 푸시한 뒤 읽는다.
- 확정 표는 **좌표만** 바꿔 끼운다(`applyGuideOverrides` — 스테이지를 다 지은 뒤) — 판정 옵션(strong · tolerance · guidePaths 수)은 core 스테이지 그대로라 아래 함정 1이 없다.
- 찾는 순서: dev 서버에서 받아 둔 어종 → 저장 어종 → dev 군 → 저장 군. 군 좌표(`familyFrame: true`)는 온마리 선(`isBodyGuideStage`)만 어종 그림 자리로 옮긴다.
- 확정 표는 dev 서버가 지켜보지 않는다(`server.watch.ignored` — 굽는 순간 화면이 새로 고쳐져 손질이 끊긴다). 같은 판에서 다시 연 창은 서버 정본(GET)을 받아 쓴다.
- 손으로 다듬은 값을 기존 표(`GUIDE_COORDS` 등)로 옮겨 굳히고 싶을 때만 아래 옛 흐름을 쓴다.

옛 흐름: 사용자가 dev(F9) 편집기에서 선을 조정 → [복사] 스니펫 전달 → **core 데이터에 반영** → core 리빌드 → 판정 검증. F9 편집은 런타임 전용이라 코드 반영 없이는 휘발된다.

## 반영 위치 (전부 `packages/core/src/simulation/ButcheryProcess.ts`)

| 대상 | 위치 |
|---|---|
| 돔류/방어류 가이드 좌표 | `GUIDE_COORDS: Record<'bream'|'amberjack', GuideCoordSet>` — 시메 tapPoint·방혈·머리 앞/뒤·비늘 스윕·지느러미 3선·꼬리 등 9세트 |
| 넙치류(광어) | `FLAT_GUIDE` — 시메·방혈·머리 S커브(7점)·비늘 스윕·꼬리·중앙선·상/하 경계 칼길·포 뜨기·내장·엔가와 |
| 개별 스테이지 컷 | `cut('id', 'ORIENT', [{x,y},…], opts)` 헬퍼 / `tapPoint` / `sweepPath` |
| **[확정] 표**(315 — 자동 생성) | `packages/core/src/db-schema/ButcheryGuideOverrides.ts` ← `tools/f9_captures/captures.json` — 손으로 고치지 않는다 |
| **장어류**(315) | `EelGuideGeometry.ts`(자동 생성 — `tools/gen_eel_views.cjs`가 그림과 같은 몸 윤곽에서) — 실측은 [확정]으로(생성기를 다시 돌리면 덮인다) |
| **어종별 실측**(313) | `SPECIES_GUIDE_COORDS[어종]`(측면 9항목 — 어종군 세트를 덮는다) · 넙치류 `FLAT_SPECIES_GUIDE[어종]` — **그 어종 그림 위에서 잰 값 그대로**(옮기지 않는다) |

### 313 — 어종 그림 자리로 옮긴 선
- 도마는 어종 실사 온마리(`SPECIES_WHOLE` 28 · 넙치 `FLAT_SPECIES_SPRITES` 5)를 그리고, 그림은 종횡비대로 도마의 다른 자리에 선다.
  그래서 측면(넙치는 탑뷰 몸통) 유도선은 **어종군 대표 그림 rect → 어종 그림 rect 비례로 옮겨** 그린다(client `butcherGuideFrame` → core `guideFrame`).
- 사용자가 어떤 어종에서 F9로 선을 고쳐 보내면 그 값은 **이미 그 어종 그림 위 좌표**다 → `GUIDE_COORDS`(어종군 세트)가 아니라
  `SPECIES_GUIDE_COORDS[그 어종]`의 같은 항목(`ikejime` · `bleed` · `headBase` · `headFlip` · `scaleBase` · `scaleFlip` · `finectomy` · `tailA` · `tailB`)에 넣는다.
  어종군 세트를 고치면 그 군 모든 어종이 함께 움직인다(대표 그림 — 감성돔 · 잿방어 · 광어 — 위에서 잰 값일 때만 어종군 세트).
- 개복 뒤 전용 뷰(복면 · 체강 · 장뜨기 · 필렛 · 엔가와 · 박피) 좌표는 옮기지 않는다 — 어종 실측 표도 없다(어종군 공용 그림).

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
