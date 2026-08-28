# CLAUDE.md — Pixel Angler The Real

> 2D 픽셀 퍼펙트 한국 해양 낚시 시뮬레이터 + 생활 경영 RPG.
> TypeScript 5.8 (strict) · Phaser 3.90 · Vite 6 · Turborepo 2 + pnpm 9 · Tauri v2 · Node ≥ 20.

## 필수 선행 문서 (작업 전 반드시 읽기)

@.agents/AGENTS.md

- `.agents/AGENTS.md` — 아키텍처·코딩 규칙·금지 사항의 **단일 기준 문서** (위에 자동 임포트됨)
- `.agents/IMPLEMENTATION_PLAN.md` — 구현 단계 현황과 다음 작업 목록. 작업 완료 시 이 두 문서를 반드시 최신화할 것.
- **`docs/wiki/README.md` — 구조화 뷰(위키)**. 시스템별 현황·세부과제·잔여·위험을 한 눈에.
  작업 **착수 전** 해당 시스템 페이지(`docs/wiki/02-SYSTEMS/*.md`)를 읽고, **완료 후** 스킬 `work-log` 절차로 기록한다.
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
- **`work-log`** — **작업 기록·문서 체계** (docs/wiki 4층·8절 양식·갱신 체크리스트). **모든 작업 완료 시 필수**
- **`doc-readability`** — **문서 가독성 규칙** (빈 줄·줄 길이 상한·블록인용 제한·차수 요약 양식). **문서 기록·갱신 시 `work-log`와 함께 로드**

## 현재 진행 상황 (2026-08-27) — 이어받기 요약

> 상세·우선순위·로드맵은 **`IMPLEMENTATION_PLAN.md` 최상단 "🚧 다음 착수"** 참고.

- **전체 위치**: Phase 6(게임플레이 심화) — 손질 마무리 + **맵 인프라 OSM 심리스 전환 진행** +
  다음 대과제(해루질→불요리→농장 경영) 진입 준비.
- **직전 작업**: 100차 — **문어 픽셀 에셋 10장 매핑 + OSM 실지형 심리스 맵 v2(속초 완주)**:
  `octo_*` 전량 교체(scrub 품질 해소·`octo_invert1` 신규) · OSM 파이프라인 3종(`tools/`) ·
  `SeamlessChunks` 청크 스트리밍(64타일·RT 풀 12·3×3 상주·근접 충돌) · OSM POI 310 거래 연동 ·
  잠복 `pointer.worldX` 조준 버그 수정 · ODbL 크레딧.
  **후속(사용자 피드백)**: 스케일 2배(**1타일=5m** · 도로 미터 폭 · 보도 `w`) + §11 L1·L3 절차
  렌더(차선·연석·지붕·나무·포말·배) + HUD 픽셀 패널(`HudPanelStyle` — 타이틀 명패·구름 텍스처).
  **101차(08-28)**: **dev 맵 편집기 F7**(지형/프롭/지붕 페인트 → `patch.json` 저장, Ctrl+Z) ·
  **Ctrl+클릭 순간이동**(맵·미니맵) · F10 '+최대' · **차도 벡터 마킹**(노란 중앙선·흰 점선·대각선·연속) ·
  **타일셋 통합**(`pixelazed/tileset/` Gemini·TopDown·Kenney → `tools/extract_tileset_assets.py` →
  `data/TilesetManifest.ts` → POI 프리팹(횟집/팝업/고층/주택)·차량·NPC·프롭 40여종) ·
  **심리스 TR 32**(Kenney 16px 지면 ×2 베이스 · legacy 20 유지 · 청크 32타일).
  상세는 `docs/wiki/03-WORKLOG/2026-08-28-101-map-editor-road-vectors.md`.
  스펙 = **`.agents/OSM_TILEMAP_SPEC.md`** (⚠ **§0.5 코드 정합 노트가 본문보다 우선**).
  100차 상세는 `docs/wiki/03-WORKLOG/2026-08-27-100-octo-pixel-osm-seamless.md`.
- **🚧 재개 지점**: ① **OSM 지역 16개 확장**(fetch→build→`SEAMLESS_REGIONS` 등록 —
  지역마다 terrain ↔ OSM 육안 대조·스폰 검수는 사용자 동반, 서해 taean은 seaEdges 조정 가능성)
  ② **두족류 수동 검증** — 무늬오징어 잔여 F9(내장 2/2·뜯기 ②·날개 껍질째) +
  **문어 좌표 재실측**(100차 스프라이트 교체로 subjectRect 변동 — 키 `ceph_octoWhole`/`ceph_octoLeg` 포함).
- **완료**: 원물 자유 손질(돔류+방어류) · 넙치류 다섯장뜨기 · 광어 포 뜨기+칼 팔로우(84~86차) ·
  회썰기 2뷰 미니게임 · 사시미 접시 플레이팅 · 장비 개편 · 무늬오징어 20스테이지(90~96차) ·
  한치·문어 개방 + 두족류 회뜨기(97차) · 문어 실사화 + 삶기·숙회 체인(98차) · 발견 도감·위키(99차) ·
  **문어 픽셀 에셋 + OSM 심리스 속초(100차)**.
- **다음 착수**:
  **0.** OSM 지역 확장(검수 동반) + 두족류 수동 검증 ← **현재 지점**
  **1.** 갑오징어 13 (스펙 §4.3 — bone_lift·속껍질·kitchen_towel) + 두족류 수율·등급 연동
  **2.** 광어 F9 잔여 (`upSep1/2`·`dnSep1/2`·`dnScore`) + 등쪽 단면 실사
  **3.** 해루질 관련 작업 (사용자 지정)
- **사용자 대기 에셋**: ① 오징어 **껍질 완전 분리본·아가미 붙은 안쪽면·3분할 결과**(합성/근사 교체용)
  ② 광어 **등쪽 단면(사진 2번) 투명본** ③ 갑오징어 속껍질 ④ 한치 전용 실사(현재 무늬오징어 공유)
  ⑤ OSM §11 비주얼 4레이어 에셋(타일셋 7군·프리팹 8종·프롭 6종·NPC 4종 — 발주 대상).
  ~~문어 중간 스테이지 완성본~~ = **100차 반영 완료**.
- ⚠ 방어류/돔류 손질은 마감. **퀘스트/스토리는 모든 컴포넌트 구현 후 도입.**
- **이후 대과제**: 불요리(화구·용기), 스시, CookScene 실조리·경영, CraftScene, 멀티(Phase 8), Tauri/Steam(Phase 9).

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

0. **`git commit`/`git push`는 사용자가 직접** (2026-08-14 지시) — 에이전트는 파일 변경까지만,
   완료 시 변경 목록과 함께 "커밋 대기"로 보고.
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

1. `.agents/AGENTS.md` 완독 → 2. **`docs/wiki/README.md` 대시보드 + 건드릴 시스템 페이지** 확인 →
3. `IMPLEMENTATION_PLAN.md`에서 현재 단계 확인 → 4. `npx pnpm run build`로 상태 검증 → 5. 빌드 오류 우선 수정 →
6. 구현 → 7. 빌드/타입체크 재검증 → 8. **스킬 `work-log` 절차로 기록**(워크로그 1건 + 시스템 페이지 + 백로그 + AGENTS/PLAN 요약).
