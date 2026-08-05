---
name: add-tuning
description: Pixel Angler 게임플레이 튜닝 값 추가/조정 절차 (core tuning.ts + F8 dev 슬라이더). 새 밸런스·연출 파라미터를 추가하거나 매직넘버를 중앙화할 때 반드시 로드. "튜닝", "TUNING", "슬라이더", "F8", "밸런스 값", "매직넘버" 작업이면 이 스킬을 따른다.
---

# 튜닝 값 추가 (TUNING / F8 슬라이더)

## 원칙

- 게임플레이 수치(연출 시간·물리 계수·확률 배율)는 **하드코딩 금지** — `packages/core/src/config/tuning.ts`의 `TUNING`에 중앙화. 소비처는 매 프레임/매 호출 `TUNING.x.y`를 읽는다 (캐싱하면 F8 라이브 반영이 죽음).
- 순수 렌더 전용 상수(색·패딩)는 core tuning에 넣지 않는다 — client 로컬 상수.
- 초기값은 mockup임을 주석에 명시하고, 실플레이 조율 후 확정값을 스냅샷으로 고정.

## 추가 절차

1. `tuning.ts`의 해당 섹션(없으면 신설)에 필드 + 한국어 주석(의미·단위) 추가.
2. **F8 슬라이더 대상이면 `TUNING_META`에 등록**:
   ```ts
   { path: '섹션.필드', min, max, step, category: 'feel' | 'balance', label: '한국어 라벨' },
   ```
   - `feel` = 연출/조작감 · `balance` = 밸런스. DevTuningPanel(F8, dev 전용)이 자동으로 슬라이더 생성.
3. 소비처 배선 — client는 `TUNING.` 직접 참조 (구 로컬 상수는 제거).

## ⚠ stale dist 함정 (반복 발생 — 31·32차)

tuning.ts에 **필드를 추가한 직후 client typecheck가 "없는 필드" 오류**를 내면, 소스 문제가 아니라 **`@tra/core/dist`가 옛 빌드본**인 것:

```bash
npx pnpm --filter @tra/core run build    # 이걸로 해소 — client 검증 전 core 선빌드
```

정상 전체 플로우(`npx pnpm run build`)는 core→client 순이라 재현되지 않는다. **typecheck만 단독으로 돌릴 때** 걸리는 함정.

## 조율·확정 흐름

- dev에서 F8 열고 실플레이 조율 → 패널의 **스냅샷 복사** 버튼(클립보드) → 확정값을 `tuning.ts` 기본값으로 반영.
- F8 조정은 런타임 전용(세이브 안 됨) — 코드 반영 없이는 휘발.
- 수치 캘리브레이션이 필요한 물리 값은 core 시뮬 스크립트(예: `scripts/chumSyncSim.ts` 패턴 — **실게임 함수를 직접 소비**, 인라인 근사 재구현 금지)로 스윕 검증.
