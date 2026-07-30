# CLAUDE.md — Pixel Angler The Real

> 2D 픽셀 퍼펙트 한국 해양 낚시 시뮬레이터 + 생활 경영 RPG.
> TypeScript 5.8 (strict) · Phaser 3.90 · Vite 6 · Turborepo 2 + pnpm 9 · Tauri v2 · Node ≥ 20.

## 필수 선행 문서 (작업 전 반드시 읽기)

@.agents/AGENTS.md

- `.agents/AGENTS.md` — 아키텍처·코딩 규칙·금지 사항의 **단일 기준 문서** (위에 자동 임포트됨)
- `.agents/IMPLEMENTATION_PLAN.md` — 구현 단계 현황과 다음 작업 목록. 작업 완료 시 이 두 문서를 반드시 최신화할 것.

## 현재 진행 상황 (2026-07-31) — 이어받기 요약

> 상세·우선순위·로드맵은 **`IMPLEMENTATION_PLAN.md` 최상단 "★★ 작업 이어받기"** 참고.

- **전체 위치**: Phase 6(게임플레이 심화) 안의 **회뜨기(손질) 시스템 구현 중** — 낚시 루프의 서브시스템 하나.
- **현재 진행(사용자 수동 검증)**: 회뜨기 **가이드 좌표 dev F9 실측 튜닝** + **2면 스프라이트 육안 확인**. (코드는 대기)
- **다음 착수(코드, 순서)**: ① UI 전수조사 고순위 4건 수정 ② 필렛 재장착 배선 + 껍질 있는 필렛 스프라이트 ③ 회 썰기(12단계) 미니게임 + 측면 뷰 에셋.
- **회뜨기 완결 후 차기 대과제**: 퀘스트/스토리 라인, CookScene 실조리·경영, CraftScene, 멀티(Phase 8), Tauri/Steam(Phase 9).

## 모노레포 구조

- `packages/core` (`@tra/core`) — 순수 TS 게임 로직. **Phaser/DOM/브라우저 API 절대 금지.** 새 파일은 반드시 `src/index.ts`에서 export.
- `packages/client-pc` (`@tra/client-pc`) — Phaser 씬 + UI. 게임 로직은 core에서 import (직접 구현 금지).
- `packages/server` (`@tra/server`) — Express + Socket.IO 멀티플레이 서버 (Phase 8 예정).
- `packages/map-builder` (`@tra/map-builder`) — GIS 타일 파이프라인 (TS + Python).
- `apps/tauri-wrapper` — Tauri v2 데스크톱 패키징 (Phase 9 예정).
- `tools/` — 루트 유틸 스크립트 (`build_region_maps.py`, `pixelize.py` 등).
- `pixelazed/` — 지역 실지형 픽셀 지도 원본 PNG (타일맵 파이프라인 입력).

## 자주 쓰는 명령어 (Windows, 레포 루트 기준)

```bash
npx pnpm install                                     # 의존성 설치
npx pnpm run build                                   # 전체 빌드 (4패키지)
npx pnpm --filter @tra/core run build                # core만 빌드
npx pnpm --filter @tra/client-pc run typecheck       # 클라이언트 타입 체크
npx pnpm --filter @tra/client-pc run dev             # 개발 서버 → http://localhost:5173
py tools/build_region_maps.py <region>               # 지역 타일맵 JSON 재생성 (예: sokcho)
```

- 검증 루틴: 작업 후 `npx pnpm run build` + `npx pnpm --filter @tra/client-pc run typecheck` 통과 필수 (기준: 2026-07-20 4/4 성공, 0 오류).
- `noUnusedLocals`/`noUnusedParameters` 활성화 — 미사용 심볼은 제거하거나 `_` 접두사.

## 절대 규칙 요약 (상세는 AGENTS.md §8)

1. `@tra/core`에 렌더링/브라우저 코드 금지.
2. 하위 씬에서 `scene.start('FieldScene')` 금지 — 반드시 `scene.stop()` + `scene.resume('FieldScene')`.
3. `GameState`(대문자 싱글톤)만 사용, `gameState` 소문자 인스턴스 없음.
4. 씬 키 = 파일명. 변경 시 `main.ts` 동시 수정.
5. `TideInfo`·`SpotType` 등 확정 타입 임의 변경 금지.
6. 파일 상단 JSDoc 및 핵심 주석은 한국어.

## 타일맵 작업 흐름 (현재 진행 중인 영역)

```
pixelazed/<region>/*.png  →  py tools/build_region_maps.py <region>
  →  packages/client-pc/public/data/<region>/<mapId>.json
  →  RegionFieldScene 렌더 (타일 텍스처 베이킹 + 병합 충돌 바디 + 엣지 맵 전환)
```

- 타일 문자: `.`=육지/도로 `~`=바다(이동불가·낚시) `#`=건물(충돌) `,`=잔디
- 지형 분류 색 팔레트 변경 → `tools/build_region_maps.py`의 `classify()` 수정 후 재생성.
- 맵 연결 그래프: `core/src/types/RegionMap.ts` (`SOKCHO_MAP_GRAPH` — 속초 7맵 체인).
- 차기 과제: 낚시점 전용 상점(루어 판매), 어탐 레이더(SeabedProfile 조회), 타 지역(여수 등) 확장, POI 세분화, 사운드 이펙트 (IMPLEMENTATION_PLAN §6-5l 차기 참고).
- 테스트 배포: https://sarsah93.github.io/Pixel-Angler-The-Real/ (gh-pages — 최근 5차 배포 2026-07-22. 재배포 절차는 AGENTS.md 참고).

## 작업 이어받기 절차

1. `.agents/AGENTS.md` 완독 → 2. `IMPLEMENTATION_PLAN.md`에서 현재 단계 확인 → 3. `npx pnpm run build`로 상태 검증 → 4. 빌드 오류 우선 수정 → 5. 구현 → 6. 빌드/타입체크 재검증 → 7. `AGENTS.md` + `IMPLEMENTATION_PLAN.md` 업데이트.
