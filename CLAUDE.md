# CLAUDE.md — Pixel Angler The Real

> 2D 픽셀 퍼펙트 한국 해양 낚시 시뮬레이터 + 생활 경영 RPG.
> TypeScript 5.8 (strict) · Phaser 3.90 · Vite 6 · Turborepo 2 + pnpm 9 · Tauri v2 · Node ≥ 20.

## 필수 선행 문서 (작업 전 반드시 읽기)

@.agents/AGENTS.md

- `.agents/AGENTS.md` — 아키텍처·코딩 규칙·금지 사항의 **단일 기준 문서** (위에 자동 임포트됨)
- `.agents/REFERENCE.md` — **참고 절**(완료된 시스템 표 · 필드 단축키 · `RegionFieldScene` 구조 · 1인칭 낚시 조작).
  자동으로 읽히지 않는다 — 해당 시스템을 건드릴 때 찾아 읽는다(2026-10-08 `AGENTS.md` §5 · §6에서 분리).
- `.agents/IMPLEMENTATION_PLAN.md` — 구현 단계 현황과 다음 작업 목록. 작업 완료 시 이 두 문서를 반드시 최신화할 것.
- `.agents/STORY_SPEC_v4.md` — **스토리·퀘스트 정본**(퀘 188·아크 23·법 5조·id 표·구현 현황). 퀘스트 작업 시 필독.
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

## 현재 진행 상황 (2026-10-14) — 이어받기 요약

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
  → **248 갯것 10종 · 땅지렁이 그림(Gemini) · 갯것 카드 방식 · 텃밭 땅지렁이 → 바다 미끼 · 73차 배포**.
- **로드맵(사용자 확정 2026-09-17)**: **요리 개체화 2단계 — 나머지 7개 레시피 변형(사용자 확인 대기)** → **농장**(E1 텃밭 ✅235 · 남은 것 E2~E5 · 백로그 BK).
  맵 확정(육안)·OSM land 14개·조도 재설계·외옹치/대포항 bbox 확장은 사용자 동반 병행 트랙.
- **재개 지점**: 사용자 실검증(172·173차 타일 조화 규칙 + 178·183~186차 신설분 + **239차 건물 그림**) — 부족하면 규칙 보강,
  괜찮으면 규칙을 켠 채로 새 맵 확장. 차수별 잔여는 PLAN §2-3.
- **248차**: **갯것 10종 · 땅지렁이 그림(Gemini) · 갯것 카드 방식 · 텃밭 땅지렁이 → 바다 미끼** — 사용자 「바지락 … 삿갓조개(배말) 얘네 이미지 없는 걸로 확인되네 … gemini로 …
  탑다운 뷰에서 보여질 아이콘 이미지」 · 「농사하다가 지렁이 … 바다낚시 미끼로」 → 초상 11 + 위에서 본 그림 5(`tools/gemini_forage_art.cjs` — 사용자 갯것 그림 3장 화풍 참고) ·
  갯것 카드 방식(`tools/forage_cards.cjs` · 표 `ForageTextures.ts` — 카드 300×160 · 64px 아이콘 · 판 44px · 필드 점 24px 21종 전부 · 원본 `food assets/forage/`) · 부팅 텍스처 61MB → 3.2MB ·
  땅지렁이(core `EarthwormRules` — 일구기 · 캐기 · 김매기 · 북주기 · 비우기 · 비 · 90초 · 칸에서 2px 꿈틀 · [F] 줍기) · 미끼 키 `earthworm` · `baitPrefOf`(표 밖 청갯지렁이의 4할) ·
  바닷물 1분 뒤 늘어져 4분이면 0.35배 · core 259 · 위키 Version 49 · **main 반영 · gh-pages 73차**.
  **다음 = 곤충 미끼(민물) · 시작 「지렁이」 이름(사용자) · 장비 그림 카드 방식(약 40장) · 마우스 포인터 시안 선택(사용자)**.
  상세 `docs/wiki/03-WORKLOG/2026-10-14-248-forage-art-earthworm.md`.
- **247차**: **작물별 재배 요소 · 텃밭 칸 2×2 · 칸에서 손에 든 것으로 일하기 · 필드 글자 흰 테** — 사용자 「심기부터 재배까지 고려되는 모든 환경/요소 …
  웹검색 등을 통해 찾고, 구현」 → 작물 86종 재배 표(`CropCultivationData.ts` — 물 조금 · 보통 · 흠뻑 · 알맞은 흙 띠 · 과습 탈 · 거름 · 품과 피로 · 도구 · 철 밖) ·
  들깨 · 참깨(베고 → 말리고 → 털기 → 키질) · 도구 7 · 아주 까다로운 9종 열흘에 한 번꼴 입고 · 저절로 나는 싹 · 포기 나누기 ·
  한 칸 = 2×2 타일 · 칸 그림 · 밟은 칸 테두리 · [F] = 퀵슬롯에 든 것(`FarmFieldSystem`) · 작업 장면 5 · 모종 꺼내기 창 · 필드 글자 검정 + 흰 테(R14 · `WorldLabel`) ·
  어종 원본 14장 재굽기 · 초상 100/100 · 위키 Version 48 · **main 반영 · gh-pages 72차**.
  **다음 = 마우스 포인터 시안 선택(사용자 — 6종 · 추천 1번 찌 화살) · 재배 수치 실플레이 조정**.
  상세 `docs/wiki/03-WORKLOG/2026-10-14-247-cultivation-factors-field-cells.md`.
- **246차**: **그림 없던 어종 4종(Gemini) · 어종 그림 카드 방식** — 사용자 「어종 그림 53장도 카드 방식으로 … 이미지가 없는 어종 그림부터」 →
  개서대 · 눈퉁멸 · 도루묵 · 말쥐치를 `tools/gemini_fish_art.cjs`(기존 어종 3장 화풍 참고 · 생성 해상도 그대로 + JPEG 번짐 벗기기) · 도감 「이미지 없음」 0 ·
  원본 57장 `food assets/fish/` · 게임은 카드(410×166 안) + 64px 아이콘만(`tools/fish_cards.cjs` · 표 `FISH_IMAGE_FILES` · 72px 이하 `fitFishTexture`) ·
  부팅 텍스처 194MB → 12MB · 배포 36.5MB → 4.4MB · 알파 252~253 · 유령 픽셀 카드에서 정리 · 위키 Version 47.
  **다음 = 새 4종 손질 편입 · 어종 원본 셀 재굽기 결정(사용자) · 난이도 수치 실플레이 조정 · 질감 다른 쌍 2~3(사용자)**.
  상세 `docs/wiki/03-WORKLOG/2026-10-14-246-fish-cards-gemini-4-species.md`.
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
- `assets/` — 기타 원본 (2026-08-05 정리): `branding/`(타이틀·아이콘 소스) · `characters/`(man/girl 옛 캐릭터 원본 — 보존만. 소비본과 로드는 레거시 필드와 함께 삭제) · `guide/`(sashimi_pixel_guide.svg — pixelize_butchery 입력).
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
   개발 용어·내부 id UI 노출 금지 · 미진행 정보 노출 금지(스포일러) · 대화는 타이핑+▼+본문 20px+표준 선택지 3종 ·
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
14. **필드 위 글자에 바탕 상자 금지**(2026-10-14 · 247차 R14) — 머리 위 [F] 안내 · 떠오르는 안내 · 거리 · 이름표 · 꼬리표는
   검은 글자 + 흰 테 한 벌(`ui/WorldLabel.ts` `worldLabelStyle`). 노란 글자 + 남색 상자를 되살리지 않는다.

## 타일맵 · 배포 (상세 절차는 스킬 참조)

- 지역 타일맵 추가/재생성 → **스킬 `add-region`** (`py tools/build_region_maps.py <region>` — 파이프라인·타일 문자·맵 그래프·함정 일체).
- 차기 과제: 낚시점 전용 상점(루어 판매), 어탐 레이더(SeabedProfile 조회), 타 지역(여수 등) 확장, POI 세분화, 사운드 이펙트 (IMPLEMENTATION_PLAN §6-5l 차기 참고).
- 테스트 배포: https://sarsah93.github.io/Pixel-Angler-The-Real/ (gh-pages — **최근 73차 배포 2026-10-14 = 248차(갯것 그림 · 땅지렁이)까지 포함**. 재배포는 Actions 「테스트 배포」(ref `main`) — 절차 **스킬 `deploy-ghpages`**).
  전체 위키(농사 탭 포함)는 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c — **Version 49 = 248차**(생성기 `tools/gen_game_wiki_data.mjs --html`).
  ⚠ **원격 컨테이너에서는 dev 서버(5173)가 사용자 브라우저에 닿지 않는다** — 실플레이 테스트 요청은 이 배포로 답한다.

## 작업 이어받기 절차

1. `.agents/AGENTS.md` 완독 → 2. **`docs/wiki/README.md` 대시보드 + 건드릴 시스템 페이지** 확인 →
3. `IMPLEMENTATION_PLAN.md`에서 현재 단계 확인 → 4. `npx pnpm run build`로 상태 검증 → 5. 빌드 오류 우선 수정 →
6. 구현 → 7. 빌드/타입체크 재검증 → 8. **스킬 `work-log` 절차로 기록**(워크로그 1건 + 시스템 페이지 + 백로그 + AGENTS/PLAN 요약).
