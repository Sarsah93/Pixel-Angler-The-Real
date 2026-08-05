# CLAUDE.md — Pixel Angler The Real

> 2D 픽셀 퍼펙트 한국 해양 낚시 시뮬레이터 + 생활 경영 RPG.
> TypeScript 5.8 (strict) · Phaser 3.90 · Vite 6 · Turborepo 2 + pnpm 9 · Tauri v2 · Node ≥ 20.

## 필수 선행 문서 (작업 전 반드시 읽기)

@.agents/AGENTS.md

- `.agents/AGENTS.md` — 아키텍처·코딩 규칙·금지 사항의 **단일 기준 문서** (위에 자동 임포트됨)
- `.agents/IMPLEMENTATION_PLAN.md` — 구현 단계 현황과 다음 작업 목록. 작업 완료 시 이 두 문서를 반드시 최신화할 것.
- `.agents/CEPHALOPOD_BUTCHERY_SPEC.md` — **두족류 손질 작업 시 필독** (4종 트리·프리미티브·부산물·수율).
  ⚠ **§0.5(코드 정합 v3.1)가 v3 본문보다 우선** — 원문은 레포 접근 없이 작성돼 speciesId·심볼·프리미티브 실재 여부가 실제 코드와 다르다.

## 프로젝트 스킬 (.claude/skills/ — 해당 작업 시 반드시 해당 스킬 로드)

- **`verify-render`** — Playwright 실렌더 검증 하네스 (dev 전역 `__INV`/`__GS`·`.ts` URL 함정·측정 규칙)
- **`asset-pipeline`** — 이미지 에셋 투입/교체 ("구운 스냅샷 vs 직접 로드" 구분·생성기 목록·방향 규칙)
- **`add-species`** — 신규 어종 4계층 등록 (오라클/도감/텍스처/경락 — 매칭 테이블 순서 함정)
- **`ui-panel`** — 팝업/패널 작성·검수 (z-order 밴드·윈도우드 렌더 vs 마스크·커스텀 드래그·텍스트 오버플로)
- **`save-migration`** — 세이브 하위호환 (시드 백필·유저 상태 보존·폴백 3단계·오프라인 신선도 정지)
- **`deploy-ghpages`** — 테스트 빌드 배포 (worktree 절차·소스맵 제외·상대경로·라이브 검증)
- **`f9-guide-coords`** — 손질 가이드 좌표 실측 반영 (opts 보존·core 리빌드·cov 1.00 검증)
- **`add-region`** — 신규 지역 타일맵 (파이프라인·맵 그래프·4-연결 규칙·depthProfile 함정)
- **`add-tuning`** — 튜닝 값 추가 (TUNING/META 슬라이더·stale dist 함정·스냅샷 확정 흐름)
- **`scene-transition`** — 씬 전환 규칙 (SceneFade 안전망·pause/launch·재진입 가드)

## 현재 진행 상황 (2026-08-06) — 이어받기 요약

> 상세·우선순위·로드맵은 **`IMPLEMENTATION_PLAN.md` 최상단 "🚧 다음 착수"** 참고.

- **전체 위치**: Phase 6(게임플레이 심화) 안의 **회뜨기(손질) 시스템 마무리 단계** — 낚시 루프의 서브시스템 하나.
- **직전 작업**: 80차 — **도마 90° 회전 축 신설 + 광어 포 뜨기 벌어짐 연출 + 배쪽 단면 실사 + 두족류 정합(v3.1)·에셋 15키·부리 공정**. 상세는 AGENTS 80차.
- **완료**: 원물 자유 손질(돔류+방어류) · **넙치류 다섯장뜨기(74차)** · 광어 회썰기·도마 필렛 실사(75차) · 팝업 z-order 포커스(76차) · 레포 정리 + 스킬 10종(77차) · 광어 F9 실측 1차 + 3D 렌더(78차) · **한치 어종 4계층 등록(79차)** · 회썰기 2뷰 미니게임 · 사시미 접시 플레이팅 + 가격 체계 · 재장착 체인 · 도감 정비 · 장비 시스템 개편(72차) · 외부 QA 수정(73차).
- **다음 착수 (2026-08-06 갱신)**:
  **1.** **두족류 손질 트리 구현** ← **현재 지점**. 80차에 타입·프로필 4종·가이드 좌표·부산물 19종·에셋 15키·tuning까지 **준비 완료**, **트리부터 미착수**.
     스펙 `.agents/CEPHALOPOD_BUTCHERY_SPEC.md` **§11.3 2단계부터** — 무늬오징어 14스테이지 → 렌더(1종 완주) → 한치 15 / 갑오징어 13 / 문어 11.
     ⚠ **착수 전 §0.5(코드 정합 v3.1) 필독** — v3 본문의 식별자·심볼이 실제 코드와 달라 §0.5가 우선한다.
  **2.** **광어 가이드 잔여** — `FLAT_GUIDE` 미실측 좌표(upLift/dnScore/dnLift/gutSweep/엔가와) F9 측정 + 등쪽 단면 실사(사진 2번 투명본 대기).
  **3.** **해루질 관련 작업** (손질 어종 확장 완료 직후 — 사용자 지정)
- **사용자 대기 에셋**: ① 광어 **2번 사진(등쪽 단면) 투명본** ② 두족류 **오징어 껍질·아가미·갑오징어 속껍질** 3종.
- ⚠ 방어류/돔류 손질은 마감. **퀘스트/스토리는 모든 컴포넌트 구현 후 도입.**
- **이후 대과제**: 불요리(화구·용기), 스시, CookScene 실조리·경영, CraftScene, 멀티(Phase 8), Tauri/Steam(Phase 9) → 마지막에 퀘스트/스토리 라인.

## 모노레포 구조

- `packages/core` (`@tra/core`) — 순수 TS 게임 로직. **Phaser/DOM/브라우저 API 절대 금지.** 새 파일은 반드시 `src/index.ts`에서 export.
- `packages/client-pc` (`@tra/client-pc`) — Phaser 씬 + UI. 게임 로직은 core에서 import (직접 구현 금지).
- `packages/server` (`@tra/server`) — Express + Socket.IO 멀티플레이 서버 (Phase 8 예정).
- `packages/map-builder` (`@tra/map-builder`) — GIS 타일 파이프라인 (TS + Python).
- `apps/tauri-wrapper` — Tauri v2 데스크톱 패키징 (Phase 9 예정).
- `tools/` — 루트 유틸 스크립트 (`build_region_maps.py`, `pixelize.py` 등).
- `pixelazed/` — 지역 실지형 픽셀 지도 원본 PNG (타일맵 파이프라인 입력).
- `food assets/` — 어종/손질/부산물 실사 원본 (파이프라인 입력 — **이름 변경 금지**, 도구 경로 참조 다수).
- `assets/` — 기타 원본 (2026-08-05 정리): `branding/`(타이틀·아이콘 소스) · `characters/`(man/girl 원본 — 소비본은 `public/characters/`) · `guide/`(sashimi_pixel_guide.svg — pixelize_butchery 입력).
- `docs/` — `reference/`(공공 API 활용가이드·09.수심.zip·경락 CSV 등 외부 데이터 원본) · `mockups/`(UI 목업 — game_guide_hub.html = 가이드 삽화 19장 재렌더 소스).

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

## 타일맵 · 배포 (상세 절차는 스킬 참조)

- 지역 타일맵 추가/재생성 → **스킬 `add-region`** (`py tools/build_region_maps.py <region>` — 파이프라인·타일 문자·맵 그래프·함정 일체).
- 차기 과제: 낚시점 전용 상점(루어 판매), 어탐 레이더(SeabedProfile 조회), 타 지역(여수 등) 확장, POI 세분화, 사운드 이펙트 (IMPLEMENTATION_PLAN §6-5l 차기 참고).
- 테스트 배포: https://sarsah93.github.io/Pixel-Angler-The-Real/ (gh-pages — 최근 5차 배포 2026-07-22. 재배포 절차는 **스킬 `deploy-ghpages`**).

## 작업 이어받기 절차

1. `.agents/AGENTS.md` 완독 → 2. `IMPLEMENTATION_PLAN.md`에서 현재 단계 확인 → 3. `npx pnpm run build`로 상태 검증 → 4. 빌드 오류 우선 수정 → 5. 구현 → 6. 빌드/타입체크 재검증 → 7. `AGENTS.md` + `IMPLEMENTATION_PLAN.md` 업데이트.
