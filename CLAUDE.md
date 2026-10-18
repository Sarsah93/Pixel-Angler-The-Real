# CLAUDE.md — Pixel Angler The Real

> 2D 픽셀 퍼펙트 한국 해양 낚시 시뮬레이터 + 생활 경영 RPG.
> TypeScript 5.8 (strict) · Phaser 3.90 · Vite 6 · Turborepo 2 + pnpm 9 · Tauri v2 · Node ≥ 20.

## 필수 선행 문서 (작업 전 반드시 읽기)

@.agents/AGENTS.md

- `.agents/AGENTS.md` — 아키텍처·코딩 규칙·금지 사항의 **단일 기준 문서** (위에 자동 임포트됨)
- `.agents/REFERENCE.md` — **참고 절**(완료된 시스템 표 · 필드 단축키 · `RegionFieldScene` 구조 · 1인칭 낚시 조작).
  자동으로 읽히지 않는다 — 해당 시스템을 건드릴 때 찾아 읽는다(2026-10-08 `AGENTS.md` §5 · §6에서 분리).
- `.agents/IMPLEMENTATION_PLAN.md` — 구현 단계 현황과 다음 작업 목록. 작업 완료 시 이 두 문서를 반드시 최신화할 것.
- `.agents/STORY_SPEC_v4.md` — **스토리·퀘스트 정본**(퀘 191·아크 24·법 5조·id 표·구현 현황 · 254차 이어지는 대화 · 결말 §8-1). 퀘스트 작업 시 필독.
- **`docs/wiki/README.md` — 구조화 뷰(위키)**. 시스템별 현황·세부과제·잔여·위험을 한 눈에.
  작업 **착수 전** 해당 시스템 페이지(`docs/wiki/02-SYSTEMS/*.md`)를 읽고, **완료 후** 스킬 `work-log` 절차로 기록한다.
- `.agents/FIRE_COOKING_SPEC.md` · **`.agents/FIRE_COOKING_EXPANSION_SPEC.md`** — **불요리 작업 시 필독**
  (확장본 = 「레시피 ≠ 요리」 개체화 기획. ⚠ **§0.5(코드 정합)가 본문보다 우선** — 실 심볼·id 대조표).
- `docs/archive/` — 완료·대체된 스펙(`specs/`), 1~186차 원장(`AGENTS-LEDGER-001-186.md`), 구 계획서 원문. **새 기록은 쓰지 않는다.**
- `.agents/CEPHALOPOD_BUTCHERY_SPEC.md` — **두족류 손질 작업 시 필독** (4종 트리·프리미티브·부산물·수율).
  ⚠ **§0.5(코드 정합 v3.1)가 v3 본문보다 우선** — 원문은 레포 접근 없이 작성돼 speciesId·심볼·프리미티브 실재 여부가 실제 코드와 다르다.

## 프로젝트 스킬 (.claude/skills/ — 해당 작업 시 반드시 해당 스킬 로드)

- **`verify-render`** — Playwright 실렌더 검증 하네스 (dev 전역 `__INV`/`__GS`·`.ts` URL 함정·측정 규칙)
- **`asset-pipeline`** — 이미지 에셋 투입/교체 ("구운 스냅샷 vs 직접 로드" 구분·생성기 목록·방향 규칙)
- **`add-species`** — 신규 어종 4계층 등록 (오라클/도감/텍스처/경락 — 매칭 테이블 순서 함정)
- **`ui-panel`** — 팝업/패널 작성·검수 (z-order 밴드·윈도우드 렌더 vs 마스크·커스텀 드래그·텍스트 오버플로)
- **`save-migration`** — 세이브 하위호환 (시드 백필·유저 상태 보존·폴백 3단계·오프라인 신선도 정지)
- **`deploy-ghpages`** — 테스트 빌드 배포 (수동 실행 워크플로 「테스트 배포」·소스맵 제외·상대경로·라이브 검증)
- **`f9-guide-coords`** — 손질 가이드 좌표 실측 반영 (opts 보존·core 리빌드·cov 1.00 검증)
- **`add-region`** — 신규 지역 타일맵 (파이프라인·맵 그래프·4-연결 규칙·depthProfile 함정)
- **`add-tuning`** — 튜닝 값 추가 (TUNING/META 슬라이더·stale dist 함정·스냅샷 확정 흐름)
- **`scene-transition`** — 씬 전환 규칙 (SceneFade 안전망·pause/launch·재진입 가드)
- **`work-log`** — **작업 기록·문서 체계** (docs/wiki 4층·8절 양식·갱신 체크리스트). **모든 작업 완료 시 필수**
- **`doc-readability`** — **문서 가독성 규칙** (빈 줄·줄 길이 상한·블록인용 제한·차수 요약 양식). **문서 기록·갱신 시 `work-log`와 함께 로드**

## 현재 진행 상황 (2026-10-18) — 이어받기 요약

> 로드맵·다음 착수·잔여는 **`.agents/IMPLEMENTATION_PLAN.md`**, 차수 본문은 **`docs/wiki/03-WORKLOG/`**
> (색인 `03-WORKLOG/README.md` §3.1). 이 절에는 **최근 3개 차수만** 둔다 — 새 차수를 넣으면 가장 오래된 것을 지운다.
> 구 이어받기 요약(118~186차 누적)은 `docs/archive/AGENTS-LEDGER-001-186.md`와 각 워크로그에 있다.

- **전체 위치**: Phase 6(게임플레이 심화). 성장·생존 P1~P9 · 스토리 「조행록」 · 위판 · 인벤 스크롤 · 구멍치기 ·
  불요리 · 요리 개체화 1단계 · **텃밭(235 — 농장 E1 · 236 구획 상한 · 사용료 · 실제 시세 경로 · 237 입문 퀘스트 · 난이도 단계 · 238 관리 작업 · 병해 · 육묘 · 종묘사)** 완료
  → 183~186차 속초 맵 트랙(고도 층 · 위성 대조 · 금강대교 고가) → **239 벡터 건물(OSM 윤곽 · 2.5D 벽 · 지붕) · 간판 자리 규칙**
  → **240 알림 가이드 · 위키 농사 탭 · 도감 상세 · 71차 배포** → **241 새 작물 5 · 개량종 3 · 날로 먹기 · 작물 초상 기준(사진 → 도트)**
  → **242 상추 품종 9종 · 감자 쌍 보정(13쌍) · 초상 12** → **243 낱개 수확 · 포장하기 · 농산물 칸 이름표 · 말투 규칙** → **244 작물 초상 84/84(Gemini 자동 생성) · 카드 초상**
  → **245 작물 84종 전부 관리 작업(난이도) · 병해충 16 · 묶음 작업 · 초상 98/98** → **246 그림 없던 어종 4종(Gemini) · 어종 그림 카드 방식**
  → **247 작물별 재배 요소 · 텃밭 칸 2×2 · 칸에서 손에 든 것으로 일하기 · 필드 글자 흰 테 · main 반영 · 72차 배포**
  → **248 갯것 10종 · 땅지렁이 그림(Gemini) · 갯것 카드 방식 · 텃밭 땅지렁이 → 바다 미끼 · 73차 배포**
  → **249 낚시 장비 그림 카드 방식 · 대체 · 없는 장비 그림 74장(Gemini) · 위키 그림 상한 정리 · F-0088 판정**
  → **250 마우스 포인터 「찌 화살」 · main 반영 · 74차 배포** → **251 설정 「접근성」 탭(포인터 색 · 테 · 크기) · 색 구분 보정 · 모양으로도 표시 · 75차 배포**
  → **252 타이틀 로고(코드로 굽기) · 시세 띠 도감 이름 · 영어 · 행동 효과음 63종 · 76차 배포**
  → **253 받는 자리 답 3개 이상 · 긴 응답 · 물어보기(조사 대화) · 배경음 후보(Lyria 1 · 2판) · 고양이 · 날씨 효과음**
  → **254 이어지는 대화(갈래) · 결말 1~3 · 인물 가게 조건 · 새 이야기 「건너편 가게」 · 이야기 넷 다시 쓰기**
  → **255 요리 그림 7 · 요리 이름 규칙(주재료별 이름 · 효과) · 장갑 · 단화 한 켤레 · 채소 재료 → 작물 초상 · 아이템 그림 223장(Gemini) · 위키 선반 탭**
  → **256 의자 등받이 짜임 · 어두운 칸 얇은 흰 테 · 같은 물건 두 id 하나로 · main 반영 · 77 · 78차 배포 · 날씨 Mock 정합**
  → **257 대사 문장마다 줄바꿈 · 쉬는 구간 · 떠오르는 안내 글 흰 테(28곳)**
  → **258 건물 윤곽 충돌 · 의뢰 표시 이름표 옆 · 가이드 말풍선 모달 비키기 · 대화창 효과 줄 빼기 · 채비 목줄 중간**
  → **259 제작 창 클릭 · 의뢰 표시 다시 그리기 · 지도 이름 흰 테 · 수면 빗방울 · 어두운 장비 그림 흰 테 · main 반영 · 79차 배포**
  → **260 아티팩트 3개 현행화(남은 과업 설계 · 구현 라이브러리 · 채비 모딩 순서도) · 아티팩트 4개 갱신 규칙**
  → **261 구 에셋 건물 그림 폐기 · 가게 자리 합성 발자국 · 가게마다 문 · 레거시 맵 벡터 건물 · 배경 음악 · 냉동 오징어 되살아남**
  → **262 부산 심리스(감천 · 백운포) · 육지 8지역 OSM 확장(데이터 지역 13 · 출조 구역 17) · Actions 수집 워크플로 · 구역별 내리는 자리 · 게임 상호 자동 변환**
  → **263 지역 장 순서 잠금 · 속초 밖 인물 25명 배치 · 감천 bbox 확장(남항 · 부산공동어시장) · N18-6 인천 무대**.
- **로드맵(사용자 확정 2026-09-17)**: ~~요리 개체화 2단계 — 나머지 레시피 변형~~ ✅255(남은 것 = 아이템 라이브러리 · 표시만 되는 효과 다섯 · 조율 — 백로그 CC)
  → **농장**(E1 텃밭 ✅235 · 남은 것 E2~E5 · 백로그 BK).
  맵 확정(육안)·~~OSM land 14개~~(✅262 데이터 지역 13 — 남은 것 육안 검수 · 상호 검토 · 인물 좌표)·조도 재설계·외옹치/대포항 bbox 확장은 사용자 동반 병행 트랙.
- **재개 지점**: 사용자 실검증(172·173차 타일 조화 규칙 + 178·183~186차 신설분 + **239차 건물 그림 + 261차 합성 발자국 + 262차 새 지역 12곳 terrain · 핀 + 263차 인물 자리 25곳 · 남항**) — 부족하면 규칙 보강.
  새 지역은 워크플로로 굽고(스킬 `add-region` 262 절) 장 데이터(`STORY_CHAPTERS.regionIds`)에 넣어야 열린다(263). 차수별 잔여는 PLAN §2-3.
- **263차**: **지역 장 순서 잠금 · 속초 밖 인물 25명 배치 · 감천 bbox 확장(남항 · 부산공동어시장) · N18-6 인천 무대** —
  사용자 결정 「지역은 장 순서대로 잠그고, 부산 위판장은 bbox 확장으로 해줘.」(262 이야기 연계 점검의 두 물음) →
  core `chapterOfRegion` · `isRegionOpenAtChapter`(구역 노드 + 여는 장 ≤ 지금 장 — 1장 속초 · 2장 부산 · 3장 울산 · 포항 · 4장 거제 · 여수 · 태안 · 5장 제주 · 6장 인천 · 시험 3) ·
  월드맵 「아직 갈 수 없는 곳」(장 번호 안 냄 · 잠금은 월드맵 출조만) · `STORY_NPC_PLACEMENTS` 25명 칸 · 행동(POI 옆 걷는 칸 — 울릉 4명은 배 출조 뒤) ·
  배치 · 트리거 · 장소 `dataRegion`(데이터 지역이 여럿인 부산 · 거제 · 태안 · 제주) · 안내 「다른 구역 — ○○」 · N18-6 ①·② 인천 종합어시장 동쪽 벽(각본 6칸) · N13-3 안흥항 ·
  감천 bbox 북쪽 35.095(요청 5 refetch · 1,093 × 1,067 · 바다 50.6% · 걷기 성분 하나) · 출조 구역 「남항 · 공동어시장」(`busan_namhang_1`) · 부산공동어시장(`shop=supermarket`) = 위판장(`poiBuildingKind` 이름 규칙 · `AUCTION_NAME`) ·
  하네스 15필드(인물 25 걷는 칸 · N18-6 각본 8칸 · 남항 `auction` · pageerror 0) · 빌드 3/3 · core 325/325 · 도달성 잃은 문 0 · 아티팩트 4개(위키 60 · 셋 Version 5).
  **다음 = 사용자 육안(인물 자리 25 · 남항 — 81차 배포 뒤) · 새 인물 집 · 일과 · 물어보기 · 울릉 4명(배) · N18-4 거제 현장 · 호미곶(포항 bbox) 결정(백로그 CK) · main 반영 · 81차 배포(요청 시)**.
  상세 `docs/wiki/03-WORKLOG/2026-10-18-263-story-linkage-chapter-lock-npcs-namhang.md`.
- **262차**: **부산 심리스(감천 · 백운포) · 육지 8지역 OSM 확장 · Actions 수집 워크플로 · 구역별 내리는 자리 · 게임 상호 자동 변환** —
  사용자 「이제 다른 맵 작업도 시작해야 할 것 같아. 부산 먼저 진행하고, 다른 맵들도 진행해줘.」 「계속해서 진행해줘.」 →
  컨테이너는 Overpass · OSM 미러가 막혀(403) **워크플로 「OSM 지역 수집」**(`.github/workflows/osm-region.yml` — `pixelazed/_osm_request.txt` 푸시 트리거 ·
  지역별 이어 가기 · fetch 90초 4번 · 러너가 실행 브랜치에 커밋 · main에 없는 워크플로는 dispatch 404)로 수집 —
  데이터 지역 13(속초 + 부산 감천 · 백운포 + 울산 방어진 · 포항 구룡포 · 거제 지세포 · 해금강 · 여수 구항 · 태안 안흥 · 만리포 · 제주 도두 · 모슬포 · 서귀포 · 인천 연안부두 — bbox 전부 속초 크기) ·
  출조 구역 17(`REGION_AREA_NODES` 새 노드 11) · core `SEAMLESS_AREA_REGIONS`(구역 fieldMapId → 데이터 지역) · `seamlessRegionOf(region, mapId)` · `RegionAreaNode.spawnLatLon`(구역별 내리는 자리) ·
  `build_osm_tilemap.py` 바다 = 해안선 방향 투표(성분별 다수결 — 가장자리 시드 침수 지세포 99% 해결) · `merge_capture_pois.py --auto`(게임 상호 자동 변환 3,516곳 · `auto: true`) ·
  위키 「출조 지역」 탭 · 해금강 스폰 보정(설정 좌표가 바다 → 도장포 유람선 터미널 POI 실측 칸) ·
  하네스 17/17(걷는 칸 · dist ≤ 2.8 · pageerror 0) · 도달성(잃은 문 해금강 1 · 나머지 0) · 빌드 3/3 · core 322/322 · 아티팩트 4개(위키 59 · 셋 Version 4).
  main 빨리 감기(`6851660`) · 「테스트 배포」 80차(gh-pages `dbb11ac` — 정적 파일 1,921 같음 · 하위 경로 기동 한 · 영 · pageerror 0).
  감천 요청 4 재굽기(75.3 → 63.7% · 러너 `110bc78`) · 이야기 연계 점검 = 지도 층만 열림(인물 29명 자리 없음 · 9지역 처음부터 열림 · 부산 위판장 없음 — 백로그 CK).
  **다음 = 사용자 육안(80차 배포본 — 새 지역 12곳 terrain · 전국 지도 핀) · 자동 변환 상호 검토(CJ) · 이야기 연계 263차(CK — 장 잠금 · 부산 위판장은 사용자 결정)**.
  상세 `docs/wiki/03-WORKLOG/2026-10-18-262-busan-and-regions-seamless.md`.
- **261차**: **구 에셋 건물 그림 폐기 · 가게 자리 합성 발자국 · 가게마다 문 · 레거시 맵 벡터 건물 · 배경 음악 · 냉동 오징어 되살아남** —
  사용자 「구 에셋 건물 이미지들 … 전부 사용하지 않고 … 지도 기반 건물로만 … 표지판이 있는 위치가 해당 상가 건물들」 「냉동 오징어 2개를 팔았는데 … 하나 더 생겨져 있음」
  「배경음악 초안 … 제일 최근에 변경한 부분들로 우선 적용」 →
  Gemini 횟집 · 팝업 · 고층 · TopDown 주택 · Kenney 노점 · 지붕 키트 로드 폐기(PNG 98장 — 파일은 `public/tileset/`에 그대로 · `ui/BuildingVariant.ts` 삭제) ·
  가게 389곳 중 건물 없는 자리 336곳에 발자국(`RegionFieldScene.synthesizePoiBuildings` — 종류 · 층수 · 크기 표 · 문 칸 후보 · 차도 밴드 · 다른 가게 · 물 회피 · 2차 보도 → 지형 '#' + 윤곽) ·
  건물마다 가게 수만큼 문(`BuildingUnit.doors` · `assignUnitDoors`) = 그림 · [F] 문 앞 칸 · 간판 한 점 · 홈타운 집 · 보건소 · 부산 가게도 같은 벡터 건물(`planLegacyBuildings`) ·
  발 끝이 윤곽 안인 칸은 걷는 칸 아님(`isWalkable`) · 오징어 = `repairPrologue`가 판 뒤 되살림 → `prologue.sell` 깃발(A/B 5회) ·
  Lyria 2판 7 + 1판 3 = 10곡 → `audio/Music.ts`(자리마다 곡 · 반복 이음매 굽기 · 2초 교차 · 10분 고정) · 설정 「배경 음악」 「환경음」 ·
  빌드 3/3 · core 322/322 · 실렌더(구 텍스처 0 · 발자국 336 · 자리 없음 6 · [F] · 홈타운 · 부산 · 음악 · pageerror 0) · 아티팩트 4개 재발행(위키 58 · 셋 Version 3).
  **다음 = 사용자 육안(발자국 크기 · 층수 표 · 좌판 차양) · 배경 음악 실청취 · main 반영 · 80차 배포(요청 시)(백로그 CI)**.
  상세 `docs/wiki/03-WORKLOG/2026-10-18-261-vector-buildings-only-bgm-squid.md`.
- **상시 방침**:
  - 지형 고도(DEM)는 **낚시 확립 후** — B(해안 변형) 우선, 경사로 통행을 막지 않는다
    (`docs/archive/specs/RASTER_UPLIFT_AMENDMENT.md` §4).
  - 채집(해루질)·광질은 실제 재현이 아니라 **농사·건축 제작 재료 + 이벤트**용 — 고도·경사는 자원 배치 태그.
  - 방어류/돔류 손질은 마감. 사용자 대기 에셋 목록은 PLAN §2-4.

## 모노레포 구조

- `packages/core` (`@tra/core`) — 순수 TS 게임 로직. **Phaser/DOM/브라우저 API 절대 금지.** 새 파일은 반드시 `src/index.ts`에서 export.
- `packages/client-pc` (`@tra/client-pc`) — Phaser 씬 + UI. 게임 로직은 core에서 import (직접 구현 금지).
- `packages/server` (`@tra/server`) — Express 멀티플레이 서버(`/mp` REST — 세션 · 위치 · 거래 · 설치물 공유) + 날씨 프록시.
- `packages/map-builder` — **deprecated**(2026-09-02, 워크스페이스 제외 — 빌드 미참여). 정본 파이프라인은 루트 `tools/`. 8차 GIS 잔재 보존용.
- `apps/tauri-wrapper` — Tauri v2 데스크톱 패키징 (Phase 9 예정).
- `tools/` — 루트 유틸 스크립트 (`build_region_maps.py`, `pixelize.py` 등).
- `pixelazed/` — 지역 실지형 픽셀 지도 원본 PNG (타일맵 파이프라인 입력).
- `food assets/` — 어종/손질/부산물 실사 원본 (파이프라인 입력 — **이름 변경 금지**, 도구 경로 참조 다수).
  `food assets/fish/` = 어종 원본 57장(246) — 게임은 `node tools/fish_cards.cjs`가 굽는 `public/fish/` 카드 · 아이콘만 싣는다.
  `food assets/forage/art/` · `top/` = 갯것 · 땅지렁이 원본(248) — 게임은 `node tools/forage_cards.cjs`가 굽는 카드 · 아이콘 · 판 · 점 그림만 싣는다.
  `food assets/tackle/` = 낚시 장비 원본 115장(249 — 사용자 그림 41 · Gemini 74) — 게임은 `node tools/tackle_cards.cjs`가 굽는 `public/tackle/` 카드 · 아이콘만 싣는다.
  `food assets/items/` = 장비 밖 아이템 원본 223장(255 — Gemini · 씨앗 봉투 틀 `_template/`) — 게임은 `node tools/item_cards.cjs`가 굽는 `public/items/` 카드 · 아이콘만 싣는다.
  `food assets/dishes/` = 완성 요리 사진 원본 7장(255) — `node tools/dish_photos.cjs`가 `public/food/` 사진 · 칸 아이콘으로 굽는다.
- `assets/` — 기타 원본 (2026-08-05 정리): `branding/`(타이틀·아이콘 소스) · `characters/`(man/girl 옛 캐릭터 원본 — 보존만. 소비본과 로드는 레거시 필드와 함께 삭제) · `guide/`(sashimi_pixel_guide.svg — pixelize_butchery 입력).
  `assets/cursor/` = 게임 마우스 포인터 원본(250 — 찌 화살 · Gemini 원본) — `node tools/gen_game_cursor.cjs`가 `data/GameCursorArt.ts`를 굽는다.
- `docs/` — `reference/`(공공 API 활용가이드·09.수심.zip·경락 CSV 등 외부 데이터 원본) · `mockups/`(UI 목업 — game_guide_hub.html = 가이드 삽화 19장 재렌더 소스) ·
  `artifacts/`(claude.ai 아티팩트 원본 3장 + 주소표 — 260).

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
   - **예외(2026-10-08 지시)**: 하모니 일일 점검 예약 작업은 `harmony-state`와 `harmony/`로 시작하는 브랜치에만 푸시하고
     풀 리퀘스트를 연다. `main` · `gh-pages` 푸시와 병합은 여전히 사용자만 한다. 일반 세션에는 이 예외가 없다.
     (기록과 절차는 `harmony-state` 브랜치의 `harmony/README.md`)
1. `@tra/core`에 렌더링/브라우저 코드 금지.
2. 필드에서 연 하위 씬에서 `scene.start('RegionFieldScene')` 금지 — 반드시 `scene.stop()` + `scene.resume('RegionFieldScene')`.
3. `GameState`(대문자 싱글톤)만 사용, `gameState` 소문자 인스턴스 없음.
4. 씬 키 = 파일명. 변경 시 `main.ts` 동시 수정.
5. `TideInfo`·`SpotType` 등 확정 타입 임의 변경 금지.
6. 파일 상단 JSDoc 및 핵심 주석은 한국어.
7. **인게임 표현 규칙 R1~R10** (2026-09-17 · 150차 사용자 지시 — 상세는 AGENTS §4 「인게임 표현 규칙」):
   개발 용어·내부 id UI 노출 금지 · 미진행 정보 노출 금지(스포일러) · 대화는 타이핑+▼+본문 20px+표준 선택지 3종 · 문장마다 줄바꿈 + 쉼(257) ·
   나레이션은 정의문 요약 금지 · 초상은 얼굴 확대 · 텍스트는 창 **아래** 경계도 넘지 않음 ·
   한글 입력은 `ui/TextInput.ts`(IME) · 차량은 캐릭터보다 크게 · 도로 위 건물은 문 좌표를 민다 · 가리면 반투명.
8. **UI 이모지·특수문자 금지 + 텍스트 약어 배지 금지**(2026-09-10 · 128차 정정) — 막는 것은 ① 이모지 ② `[아이콘] [타이틀]`식 텍스트 장식이고, **시각 아이콘은 권장**이다. 아이콘 = **16x16 손그림 픽셀 아이콘**(`tools/gen_pixel_icons.py` → `PixelIconArt` → `ui/PixelIcon.ts`) / 절차 픽셀 그래픽 / 스프라이트. 예외 글리프는 `✕ ◀▶ ◱◐`. 상세 AGENTS §4.
9. **창에 조작 안내 문구 금지**(2026-10-01 · 188차 R11) — `우클릭: … / 드래그: …` 같은 글자 대신 **처음 열 때 체험 가이드**
   (`ui/GuideTour.ts` — 말풍선·하이라이트·직접 해 보기). 새 기능창은 가이드 단계도 함께 만든다. 다시 읽는 곳은 도움말(F1).
   화면 위 「지금 할 일 · 목표 / 방법」 나열 띠도 금지(191차) — 다음 할 일은 말풍선 코치(`ui/PrologueCoach.ts`)가 잇는다.
10. **화면 고정 UI 겹침 금지**(2026-10-02 · 198차) — 상시 단추·트레이를 `GAME_WIDTH - 16 - w` 같은 화면 끝 상수로 놓지 않는다.
   자기 콘텐츠에 앵커 + 필드 HUD 위면 `ui/ScreenReserve`로 피하고, `tools/ui_overlap_audit.js` 부분 겹침 0 + 스크린샷 육안.
   되돌릴 수 없는 행동(방생·버리기)은 `ConfirmDialog` 재확인(대상 목록 + 행동 이름 단추).
11. **퀘스트를 특정 시각에 묶지 않는다**(2026-10-04 · 212차 R12) — 「밤에」 · 「물이 빠질 때」 · 계절 같은 넓은 때만(시각 창은 최소 3시간).
12. **사용자에게 하는 설명·보고·질문은 전부 한국어**(2026-10-07 사용자 지시) — 표 제목 · 소제목 · 질문 선택지까지 영어로 쓰지 않는다.
   코드 심볼 · 파일 경로 · 커밋 트레일러처럼 원문 그대로 둬야 하는 것만 예외.
   - **말투는 공손한 합니다체**(2026-10-13 · 243차 사용자 지시 — 「말투가 -입니다 · -습니다에서 짧게 -다로 끝나고 있네. 다시 공손하게」).
     보고 · 설명 · 질문의 문장은 `-습니다` · `-입니다`로 끝낸다. 표 칸 · 목록의 짧은 명사구는 예외다.
     문서(워크로그 · 위키) · 코드 주석 · 인게임 문구는 각자의 기존 문체를 따른다 — 이 규칙은 사용자에게 직접 하는 말에 적용한다.
13. **건물 둘레에 격자가 드러나는 그림 금지**(2026-10-12 · 239차 R13) — 건물은 OSM 윤곽 + 2.5D 벽 + 지붕(`scenes/field/BuildingArt.ts`).
   타일 지붕 셀 · 타일 에이프런 · 타일 그림자 띠를 되살리지 않는다. 간판 · 프롭은 차도 밴드 · 건물 타일 · 지붕 아래를 피한다(`shopSignSpot`).
   충돌도 그림 윤곽 띠(`unitBodyRects` — 258차)다 — '#' 칸 충돌(아래 두 줄만 막기)을 되살리지 않는다.
   **261차부터 건물 그림 에셋(프리팹 · 키트)은 로드하지 않는다** — 가게 자리에 건물이 없으면 발자국을 합성한다(`synthesizePoiBuildings`). 레거시 맵도 같은 함수.
14. **필드 위 글자에 바탕 상자 금지**(2026-10-14 · 247차 R14) — 머리 위 [F] 안내 · 떠오르는 안내 · 거리 · 이름표 · 꼬리표는
   검은 글자 + 흰 테 한 벌(`ui/WorldLabel.ts` `worldLabelStyle`). 노란 글자 + 남색 상자를 되살리지 않는다.
   257차부터 떠오르는 안내 글(저장 알림 · 토스트 · 경고 · 결과 띠)도 같은 한 벌 — 경고는 글자색만(`WORLD_LABEL_WARN`). 칸 안 배지 · 단추 · HUD 상시 칸은 제외.
   259차부터 지도 표시 이름(전체 지도 · 세계 지도)도 같은 한 벌.
15. **인게임 설계가 바뀌면 아티팩트 4개를 모두 갱신**(2026-10-17 · 260차 사용자 지시) — 남은 과업 설계 · 구현 라이브러리 · 채비 모딩 순서도 · 위키.
   같은 URL에 다시 발행한다(원본 `docs/artifacts/*.html` · 위키는 생성기). 문서 · 도구만 고친 차수는 제외.
   채비 문법이 그대로면 순서도는 「N차 기준」 줄만 올린다. 주소 · 절차 = `docs/artifacts/README.md` · 스킬 `work-log` §2의 7번.

## 타일맵 · 배포 (상세 절차는 스킬 참조)

- 지역 타일맵 추가/재생성 → **스킬 `add-region`** (`py tools/build_region_maps.py <region>` — 파이프라인·타일 문자·맵 그래프·함정 일체).
  **262차부터 OSM 수집은 워크플로 「OSM 지역 수집」**(`.github/workflows/osm-region.yml`) — 이 컨테이너는 Overpass가 막혀 있다(403 · 환경 네트워크 정책).
  작업 브랜치에서는 `pixelazed/_osm_request.txt`에 지역 키를 적어 푸시하면 러너가 굽고 그 브랜치에 커밋한다(main에 들어가면 Actions 탭 Run workflow).
  ⚠ 러너가 도는 동안 같은 브랜치에 푸시하지 않는다(러너 푸시가 non-fast-forward로 거부돼 산출물을 잃는다).
  **지역은 장 순서대로 열린다**(263 — `isRegionOpenAtChapter` · `STORY_CHAPTERS.regionIds` — 노드만 더하면 열리지 않는다) · 인물 · 트리거 · 장소 칸은 `dataRegion`으로 데이터 지역을 가른다.
  심리스 데이터 지역 13 = 속초 `sokcho_v2` · 부산 `busan_gamcheon`(263 북쪽 35.095 — 남항 · 공동어시장 · 1.17M 타일) · `busan_baegunpo` · `ulsan` · `pohang_guryongpo` · `geoje_east` · `geoje_south` · `yeosu_city` ·
  `taean_anheung` · `taean_manripo` · `jeju_city` · `jeju_moseulpo` · `jeju_seogwipo`(core `SEAMLESS_REGIONS` + 구역 표 `SEAMLESS_AREA_REGIONS` · 구역 스폰 `spawnLatLon`).
- 차기 과제: 낚시점 전용 상점(루어 판매), 어탐 레이더(SeabedProfile 조회), POI 세분화, 사운드 이펙트 (IMPLEMENTATION_PLAN §6-5l 차기 참고).
- 테스트 배포: https://sarsah93.github.io/Pixel-Angler-The-Real/ (gh-pages — **최근 80차 배포 2026-10-18 = 262차까지 포함** — 260~262는 80차에 처음 실렸다 · main `6851660`).
  재배포는 Actions 「테스트 배포」(ref `main`) — 절차 **스킬 `deploy-ghpages`**).
  전체 위키(농사 · 출조 지역 탭 포함)는 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c — **Version 60 = 263차**(생성기 `tools/gen_game_wiki_data.mjs --html` — 8KB 이하 그림은 HTML 안 · 아티팩트 한 판 파일 상한 511).
  아티팩트 4개(절대 규칙 15 — 원본 · 절차 `docs/artifacts/README.md`):
  남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 (Version 5 = 263차 기준 · 비공개) ·
  구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 (Version 5 = 263차 기준) ·
  채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 (Version 5 = 263차 기준 · 문법은 258차) · 위키(위 줄).
  ⚠ **원격 컨테이너에서는 dev 서버(5173)가 사용자 브라우저에 닿지 않는다** — 실플레이 테스트 요청은 이 배포로 답한다.

## 작업 이어받기 절차

1. `.agents/AGENTS.md` 완독 → 2. **`docs/wiki/README.md` 대시보드 + 건드릴 시스템 페이지** 확인 →
3. `IMPLEMENTATION_PLAN.md`에서 현재 단계 확인 → 4. `npx pnpm run build`로 상태 검증 → 5. 빌드 오류 우선 수정 →
6. 구현 → 7. 빌드/타입체크 재검증 → 8. **스킬 `work-log` 절차로 기록**(워크로그 1건 + 시스템 페이지 + 백로그 + AGENTS/PLAN 요약).
