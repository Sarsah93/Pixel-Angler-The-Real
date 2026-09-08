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

## 현재 진행 상황 (2026-09-08) — 이어받기 요약

> 상세·우선순위·로드맵은 **`IMPLEMENTATION_PLAN.md` 최상단 "🚧 다음 착수"** 참고.

- **전체 위치**: Phase 6(게임플레이 심화) — **맵 인프라 마무리 단계**(OSM 심리스 + 래스터 보강 +
  타일 디테일 완료) + 손질 마무리 + 다음 대과제(해루질→불요리→농장 경영) 진입 준비.
- **로드맵(사용자 확정 2026-09-01)**: 맵 확정(사용자 육안) → **OSM land 14개 확장** →
  두족류 마무리 → 해루질·통발.
- **직전 작업**: 119차 — 118차 피드백 8건: **HUD 타이틀바(캡션바) 규칙 신설**(상태 패널 밴드 · ◱◐ ↔ HP 바 4px
  겹침 해소 · 채널 밴드 최소 높이) · 지역 채널 **3단계 표시**(시각 제거 / 10자 말줄임) · 월드맵 홈 버튼이
  뒤로가기 **클릭을 삼키던 버그** + 흐름 배치 · 랜딩 후 **조류·바람 정지 + 발앞 수렴 + 결과창 좌클릭 차단** ·
  수심 물고기 아이콘 좌우 반전·1.2배·희귀도 색 · **i18n 규칙 캡처 재번역**(`applyTemplate`) + 사전 656항목 +
  지명(`i18n/places.ts`) + **캡처 주석 영문판 21장**(`--lang en`) · 버튼 '도움말' · 수량 우측 상단.
  ⚠ 신규 UI 규칙 2건: **타이틀바 전용 영역** · **wordWrap 아래 고정 y 금지(흐름 배치)**.
  118차 — 117차 피드백 8건: **HUD 실버그 2**(상태 패널 미표시·채널 중복) · 캐스팅 힌트 = 맵 직접
  클릭만 · **영어 설정**(`i18n/` Text.setText 훅 사전 ≈620 — 미수록은 한국어 잔존) · ESC [환경설정] · 도움말 실캡처
  21장 + 파이트 튜토리얼 합성 삽화(`__FP.devForceFight`) · 상태 패널 3단계 정보량 축소 + 호버 툴팁 · 단축키 버튼 토글. 117차 — **도움말 라이브러리**(F1·단축키 버튼 · 8카테고리 39토픽 · 실캡처 주석) +
  **HUD 크기·투명 단계** + **테스터 피드백 7건**(파이팅 **물리 텐션** = 체중×어종군 가속×대응 ÷ 라인 강도 ·
  희귀도 6단계 색 · 입질 튜토리얼 선표시 · 루어 전용 원줄·목줄 소켓 · 줄·바늘 상점 · 지그헤드 봉돌 면제).
  `TUNING.fightPhys`는 **mockup — F8 조율 대기**. 116차 — 조도 시트 **실제 위치**(794,427) 재적용(면적 72×60).
  115차 — **조도 드론 사진 → 갯바위 타일 시트**(`tools/pixelize_islet.py` —
  HSV 분류·휘도 순위 균등화·2px 그레인·물 투명 · 시트 1장 런타임 슬라이스).
  114차 — 방파제 **단면 자동 분류**(테트라포드/사석/상판) + **항로표지 등대**(`extract_lights.py`).
  113차 — 차량 배치 재설계(주차장 구역 한정 40~70% · 도로 위 정차 0 · 노상 0.8대/화면).
  상세는 `docs/wiki/03-WORKLOG/` 112~118 + `IMPLEMENTATION_PLAN.md` 이어받기 절.
- **🚧 재개 지점**: ① **맵 확정 — 사용자 육안**(109~115차 신설분: 래스터 도심 `'r'`·교차부 마킹·
  **차량 밀도**·**방파제 테트라포드+등대**·**조도 갯바위 주간 톤**) ② **OSM land 14개 확장**
  (지역마다 terrain ↔ OSM 대조·스폰 검수는 사용자 동반, 서해 taean은 seaEdges 조정 가능성)
  ③ **두족류 수동 검증**(무늬오징어 잔여 F9 + 문어 좌표 **재실측** — 100차 스프라이트 교체로
  subjectRect 변동) ④ **해루질·통발**(S14 D2~D5) — ③과의 선후는 **사용자 결정 대기**.
- **완료**: 원물 자유 손질(돔류+방어류) · 넙치류 다섯장뜨기 · 회썰기 2뷰 + 사시미 플레이팅 ·
  무늬오징어 20스테이지 · 한치·문어 개방 + 두족류 회뜨기 · 발견 도감 · **OSM 심리스 속초**(100차) ·
  맵 편집기 F7·도로 벡터·교통(101~102) · 해안 타일셋 3종(103~106) · **래스터 보강 Phase 1·2**(107~109) ·
  교차부 마킹 클리핑(110) · **차량 배치 3연속**(111~113) · **방파제 단면+등대**(114) ·
  **조도 사진 갯바위**(115~116) · **도움말 라이브러리 + 파이팅 물리 + 희귀도**(117) · **HUD 수정 + 영어 설정 + 실캡처**(118).
- **지형 고도(DEM) 방침**(2026-09-03 사용자 결정): **낚시 확립 후**로 후순위. 착수 시
  **B(해안 지형 변형) 최우선**, **경사로 통행을 막지 않는다**(채집·광질·이벤트 후보 보존).
  근거·방침 = `.agents/RASTER_UPLIFT_AMENDMENT.md` §4. 선행 조건: `pip install rasterio`(미설치).
- **향후 시스템**(사용자 계획): **채집(해루질 포함)·광질** — 실제 재현이 아니라 **농사·건축 제작
  재료 + 이벤트**용. 고도·경사는 차단이 아니라 **자원 배치 태그**로 소비한다.
- **사용자 대기 에셋**: ① 오징어 **껍질 완전 분리본·아가미 붙은 안쪽면·3분할 결과**
  ② 광어 **등쪽 단면 투명본** ③ 갑오징어 속껍질 ④ 한치 전용 실사(현재 무늬오징어 공유)
  ⑤ OSM §11 비주얼 4레이어 에셋(타일셋 7군·프리팹 8종·프롭 6종·NPC 4종).
- ⚠ 방어류/돔류 손질은 마감. **퀘스트/스토리는 모든 컴포넌트 구현 후 도입.**
- **이후 대과제**: 불요리(화구·용기), 스시, CookScene 실조리·경영, CraftScene, 멀티(Phase 8),
  Tauri/Steam(Phase 9).

## 모노레포 구조

- `packages/core` (`@tra/core`) — 순수 TS 게임 로직. **Phaser/DOM/브라우저 API 절대 금지.** 새 파일은 반드시 `src/index.ts`에서 export.
- `packages/client-pc` (`@tra/client-pc`) — Phaser 씬 + UI. 게임 로직은 core에서 import (직접 구현 금지).
- `packages/server` (`@tra/server`) — Express + Socket.IO 멀티플레이 서버 (Phase 8 예정).
- `packages/map-builder` — **deprecated**(2026-09-02, 워크스페이스 제외 — 빌드 미참여). 정본 파이프라인은 루트 `tools/`. 8차 GIS 잔재 보존용.
- `apps/tauri-wrapper` — Tauri v2 데스크톱 패키징 (Phase 9 예정).
- `tools/` — 루트 유틸 스크립트 (`build_region_maps.py`, `pixelize.py` 등).
- `pixelazed/` — 지역 실지형 픽셀 지도 원본 PNG (타일맵 파이프라인 입력).
- `food assets/` — 어종/손질/부산물 실사 원본 (파이프라인 입력 — **이름 변경 금지**, 도구 경로 참조 다수).
- `assets/` — 기타 원본 (2026-08-05 정리): `branding/`(타이틀·아이콘 소스) · `characters/`(man/girl 원본 — 소비본은 `public/characters/`) · `guide/`(sashimi_pixel_guide.svg — pixelize_butchery 입력).
- `docs/` — `reference/`(공공 API 활용가이드·09.수심.zip·경락 CSV 등 외부 데이터 원본) · `mockups/`(UI 목업 — game_guide_hub.html = 가이드 삽화 19장 재렌더 소스).

## 자주 쓰는 명령어 (Windows, 레포 루트 기준)

```bash
npx pnpm install                                     # 의존성 설치
npx pnpm run build                                   # 전체 빌드 (3패키지 — core·client-pc·server)
npx pnpm --filter @tra/core run build                # core만 빌드
npx pnpm --filter @tra/client-pc run typecheck       # 클라이언트 타입 체크
npx pnpm --filter @tra/client-pc run dev             # 개발 서버 → http://localhost:5173
py tools/build_region_maps.py <region>               # 지역 타일맵 JSON 재생성 (예: sokcho)
```

- 검증 루틴: 작업 후 `npx pnpm run build` + `npx pnpm --filter @tra/client-pc run typecheck` 통과 필수 (기준: 2026-09-02 **3/3** 성공, 0 오류 — map-builder 워크스페이스 제외로 4/4 → 3/3).
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
- 테스트 배포: https://sarsah93.github.io/Pixel-Angler-The-Real/ (gh-pages — 최근 9차 배포 2026-09-03 = 89~115차 포함. 재배포 절차는 **스킬 `deploy-ghpages`**).

## 작업 이어받기 절차

1. `.agents/AGENTS.md` 완독 → 2. **`docs/wiki/README.md` 대시보드 + 건드릴 시스템 페이지** 확인 →
3. `IMPLEMENTATION_PLAN.md`에서 현재 단계 확인 → 4. `npx pnpm run build`로 상태 검증 → 5. 빌드 오류 우선 수정 →
6. 구현 → 7. 빌드/타입체크 재검증 → 8. **스킬 `work-log` 절차로 기록**(워크로그 1건 + 시스템 페이지 + 백로그 + AGENTS/PLAN 요약).
