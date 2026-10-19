# 267차 — 첫 실플레이 피드백 여섯(지도 끌기 · 대화창 쪽 넘김 · 영업시간 단서 · 미끼 묶음 「열기」 · 집 ESC · 화살표 둘) · 그림 얼굴 초상의 길

> 2026-10-19 · 브랜치 `claude/project-review-task-planning-yopbck` · 상태 ✅ 완결(그림 초상은 Gemini 결제 대기)

| | |
|---|---|
| **날짜** | 2026-10-19 |
| **시스템** | `UI` `대화` `스토리` `지도` `인벤` `홈` `소리` `캐릭터` `도구` |
| **트리거** | 사용자 실플레이 피드백(82차 배포본) |
| **커밋** | 작업 브랜치(main 반영 · 배포는 요청 없음) |
| **빌드·타입체크** | 3/3 · 0 오류 · core 332/332 |

---

## 1. 배경 — 왜 했나

82차 배포본을 처음 끝까지 해 본 사용자의 피드백 여섯과 추가 요청 셋.

> 「처음 튜토설명 때 지도 끌어보라고 하는데 안끌어지고 바로 그 다음으로 넘어감. -> 지도가 작아서 끌리지 않는 것 같은데,
> wiki에 반영된 지도 드래깅되는 것처럼 구현할 것.」

> 「사이소 영수증 퀘스트 진행 중 실제 시간반영 때문인지 22시 이후로는 퀘스트 진행 불가. -> 퀘스트를 건네 받을 때 …
> 빨간색 텍스트로 "영업시간을 반드시 확인해야 할 거야. 보통 사이소는 저녁 10시까지 일거야." 같은 단서 주기.」

> 「미끼(20개입, 8개입)들이 한 번 사용하고 바로 사라짐. -> '열기 (unbox)'하면 낱개의 미끼들이 나오도록.」

> 「집 안에서 esc 누르면 집 밖으로 나가짐 → ESC 누르면 바로 나가지는 것 금지.」

> 「퀘스트 진행 시 주고받는 대화가 앞에 내용이 겹쳐서 나옴 -> 바로 내용이 이어지게.
> (처음 말 걸었을 때 나오는 대화가 그대로 나온다던지, 앞에 말했던 내용이 똑같이 그대로 점멸할 때도 있고 …)
> 대화창에서는 대화하듯 … 진행 상황을 전개/설명하듯이 notice 해야 하는데 … 단순히 진행 상황을 텍스트로만 나열하듯 적혀지고 있는게 이질감.」

> 「메인퀘 체크 풀고, 서브퀘 체크 넣어도 메인퀘 안내 표시만 나옴 -> 두 개 별도로 indicator 분리(노란색 · 파란색) 각각 추적·표시.」

> 「각 인물 별로 얼굴 이미지를 따로 따서 넣기 — gemini imaging 사용 · 정옥선(할머니라 흰머리 장발, 모자) 특징 반영.
> 주인공 얼굴도 선택한 모델형에 따라 디폴트값 — 캐릭터 생성 모델링 요소 모두 고려. 집 안에서도 파도 소리 들림 -> 줄이거나(전자 선호).」

## 2. 원인 — 확정된 기전

### 2-1. 지도가 안 끌린다

- `FullMapPanel.clampPan`이 지도가 뷰보다 **작은 축은 가운데에 못 박았다**(`panX = (view.w - w) / 2`).
  홈타운(48×32칸)은 처음 배율 ×2.2로도 뷰에 다 들어와 두 축 모두 못 박혔다 — 끌어도 0px.
- 가이드 「끌어 보자」는 **포인터가 움직였는지**로 통과시켰다. 지도가 못 박힌 채 포인터만 움직여 다음 단계로 넘어갔다(사용자 「안끌어지고 바로 그 다음으로」).
- 하네스 첫 판은 가이드 방패에 막혀 `moved 0.0`으로 **오진**했다 — `import('/src/ui/GuideTour.ts')`가 HMR 분화로 게임과 다른 인스턴스라
  `active`가 늘 null이었고, 설명 단계 방패가 화면 전체를 덮어 실마우스 끌기를 삼켰다. dev 전역 `__TOUR`로 바꾸자 재현 · 검증이 됐다.
- 고친 뒤 두 번째 발견: 홈타운은 처음 배율이 **최대(×8)** 라 휠 확대가 막혀 가이드 「휠 한 번」이 확대 방향으로는 안 넘어갔다(축소는 됐다).

### 2-2. 대화가 겹친다 · 점멸한다

- `DialoguePanel.play(keepLog)`가 화면(발주 → 진행 → 답)을 **앞 글 아래에 이어 붙였다**. 로그(172px)를 넘기면 앞 문장이 반쯤 잘린 채 위로 밀렸다.
  답 화면은 `nextParas`만 비우고 로그를 남겨 **처음 말 걸었을 때 글이 그대로 보이는** 상태에서 새 글이 밑에 찍혔다(사용자 「그대로 나오고 다음 내용이 나옴」).
- 긴 단락은 `paceSentences`가 문장마다 빈 줄을 넣어 6줄을 쉽게 넘겼다(257 §6에 이미 경고). 257차 캡처 `dlg267b`로 확인 — 쪽 높이 212 > 172.
- 진행 중 화면 글은 목표 `labelKo`(「저가 릴대를 산다 (0/1)」)를 **글머리로 나열**했다 — 사용자 「텍스트로만 나열」.

### 2-3. 미끼가 한 번에 사라진다

- `isBaitItem`이 청갯지렁이 1갑(`pack_ragworm` — 상점 `bundle` 8마리)과 곽크릴(`pack_krill_box` — `unpack` 20마리)을 **미끼로 쳤다**.
  묶음째 바늘에 꿰이고 한 번 쓰면 `qty 1`이 통째로 사라졌다. 산 자리에서는 `handleBuy`가 풀어 주지만 옛 세이브 · 보상 · 줍기로 묶음째 든 것은 풀 길이 없었다.

### 2-4. 나머지

- `HomeInteriorScene.onEscape`의 마지막 갈래가 `exitToField()`였다(열린 창이 없으면 밖으로).
- `drawQuestArrow`가 **화살표 하나**만 그렸다 — `buildTrackerEntry(main, true)`가 자리를 가져가면 서브는 `claimArrow=false`로 줄만 올렸다.
- 집 안 파도 `sea: 0.12`.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`packages/core/src/rules/KoreanPhrase.ts`](../../../packages/core/src/rules/KoreanPhrase.ts) | 받침 · 조사(`particle`) · 목표 명사화(`objectiveNominalKo` — 「…는다」→「…는 것」 · ㄴ 받침 탈락) · `joinKo` · `spokenProgressKo` · `spokenDoneKo` |
| 신설 | `packages/core/src/rules/KoreanPhrase.test.ts` | 7건(명사화 · 조사 · 진행 문장 · 끝 문장) |
| 수정 | `packages/core/src/types/Story.ts` · `db-schema/StoryNarrative.ts` · `StoryNarrativeEn.ts` | `QuestNarrative.hint/hintEn` · `NpcLines.hint` · M1-04 사이소 영업시간 단서(한 · 영) · `allNarrativeLines`에 포함 |
| 수정 | [`ui/DialoguePanel.ts`](../../../packages/client-pc/src/ui/DialoguePanel.ts) | 화면마다 새 쪽(`play`) · 단락 · 문장 끝 쪽 가름(`startNextPara` — 나머지 재큐잉 때 따옴표 · `HINT_PREFIX` 복원) · 단서 쪽(`setHintPage` · `COL_CAUTION`) · 진행 말(`progressNarration`) · 「나 — "…"」 답 줄 · 초상 `npcId` 전달 |
| 수정 | [`ui/FullMapPanel.ts`](../../../packages/client-pc/src/ui/FullMapPanel.ts) | `clampPan` 여백 48(작은 맵도 끌림) · 「끌어 보자」 = 지도 24px 이동 · 처음 배율 `min(MAX_ZOOM×0.7, max(minZoom×1.6, 2.2))` |
| 수정 | [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `questSubTargetPos` · `questSubGuideG/Lbl` · `drawGuideArrow` 셋(메인 노랑 46 · 서브 파랑 54 · 핀 하늘 60) · `nudgeGuideLabel` 서브 회피 · `buildTrackerEntry`가 `pos` 반환 |
| 수정 | [`store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) · `ui/InventoryPanel.ts` · `i18n/en_panels.ts` | `isBaitItem` 묶음 · 포장 제외 · `isBundlePack` · `bundlePartsOf` · `openBundle` · 가방 메뉴 「열기」(Open) |
| 수정 | [`scenes/HomeInteriorScene.ts`](../../../packages/client-pc/src/scenes/HomeInteriorScene.ts) | `onEscape` 나가기 삭제 · `INDOOR_SEA = 0.04` |
| 신설 | [`tools/gemini_face_art.cjs`](../../../tools/gemini_face_art.cjs) · [`tools/face_looks.cjs`](../../../tools/face_looks.cjs) | 인물 42 + 주인공 24 대상 · 캐스트 설정 → 생김새 문장 · 절차 초상 앵커(8배) · `--list/--dry/--sheet/--install`(192px · 셀 2px) · 402 안내 |
| 신설 | [`ui/FacePhoto.ts`](../../../packages/client-pc/src/ui/FacePhoto.ts) · [`data/FacePortraits.ts`](../../../packages/client-pc/src/data/FacePortraits.ts) | `photoPortraitKey`(인물 `face_<id>` · 주인공 기본 얼굴 + `recolorFace` 치환) · 자동 목록(지금 0키) |
| 수정 | `ui/CharacterSprite.ts` · `scenes/BootScene.ts` · `ui/MonologuePanel.ts` · `ui/JournalPanel.ts` | `ensureFacePortrait(…, who)` 그림 우선 · 부팅 `face_<키>` 로드 · 호출부 `'player'` · 일지 상세 `setDisplaySize(faceW)` |
| 수정 | `docs/artifacts/*.html` | 셋 267차 기준(라이브러리 항목 6 · 과업 §01 · §06 · 바닥 줄) |

## 4. 구조상 위치

- `S22 스토리 → 대화창 표현형(150 · 253 · 257) → 267 쪽 단위 · 말하듯 진행 · 단서` — **렌더 층**(쪽 모델) + **데이터 층**(`hint`) + **core 규칙**(`KoreanPhrase`).
- `S7 월드 → 전체 지도(155) → 267 끌기 범위 · 가이드 판정` — 렌더 · 입력 층. `S7 → 추적기 · 화살표(155) → 267 둘` — 렌더 층.
- `S5 인벤 → 미끼 판정(`isBaitItem`) · 묶음 열기` — **판정 층**(바늘 소켓 후보가 바뀐다 — 묶음은 후보에서 빠진다).
- `S8 홈 → 실내 입력 · 소리` — 입력 층.
- `S23 캐릭터 → 대화 초상(152) → 267 그림 초상 경로` — 렌더 층 + 도구. 그림이 없으면 동작이 전과 같다(목록 0키).

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 지도 가이드 흐름(홈타운) | `map267c.cjs` — `__TOUR` · Enter 두 번 → 휠 → 포인터만 → 실마우스 끌기 | 처음 ×5.6 · 휠 뒤 ×6.61 → 「끌어 보자」 · 포인터만은 머묾(pan 그대로 · `tourDragged` false) · 끌기 144px → 다음 단계(아이콘 단계는 홈타운에 이름 있는 표식이 없어 건너뜀) |
| 끌기 한계 · 큰 맵 | 같은 하네스 — 가이드 없이 끌기 · 멀리 끌기 · 속초 | 홈타운 180px · 한계 (915, 353) = 뷰 − 지도 − 48 · 반대 (48, 48) · 속초 ×2.2 184px |
| 화살표 둘 | M1-01~03 완료 → M1-04 받을 수 있음(메인) · N01-1 2단계 서브 고정 → `updateQuestGuide(500)` | 메인 「도현수 · 326m」 노랑 · 서브 「바람 · 298m」 파랑 둘 다 보임 · 추적기 두 줄 · 캡처 `D_arrows_crop.png` |
| 대화창 쪽 | `dlg_repro.cjs` — M1-04 발주 · 진행 · 완료 화면 · 답 | 모든 쪽 높이 ≤ 153(로그 172) · y 0 · 단서 쪽 `#ff8f7f` · 진행 말 「해야 할 것은 사이소에서 저가 릴대를 사는 것과 …이다.」 · pageerror 0 |
| 집 ESC · 파도 | `bait267b.cjs` — 새 게임 집 안 · 혼잣말 넘김 · M1-01 완료(문 잠금 해제) → ESC 두 번 · `onEscape` 직접 | 집 그대로(`exitToField` 호출 0) · `__AMB.sea` 0.04(실내) |
| 미끼 묶음 | 같은 하네스 — `pack_ragworm` 2 · `pack_krill_box`(냉동) 주입 → `isBaitItem` · `openBundle` · `unpack` · 가방 메뉴 | 아래 §5-1 |
| 그림 초상 경로 | `photo267.cjs` — 가짜 `face_okseon` · `face_player_m_short`(기준색) 주입 | 그림 없음 → `face2_…`(절차) · 있음 → 대화창 `face_okseon` 192×192 · 주인공 치환 키 `…_v_3_7_3` · 머리 `#e8e6e0` · 피부 `#ac7550` · 눈 `#3f6b3a` = 기대값 · 그늘 밝기 비 유지 · 흰자 · 윤곽 그대로 · 같은 옵션 재굽기 없음 · 기준색이면 기본 판 |
| 얼굴 도구 | `--list` · `--dry --only okseon,player_m_short` · `--install`(그림 없이) | 66장(인물 42 · 주인공 24) · 참고 그림 256px · 목록 0키 · 요청 0건(결제 402는 이전 프로브) |
| core · 빌드 | `vitest` · `pnpm run build` · typecheck | 332/332(+7) · 3/3 · 0 |
| 아티팩트 | `check_artifact_page.cjs` 셋 · 발행 | PASS(넘침 · 겹침 · pageerror 0) · Version 8 셋 |

### 5-1. 미끼 묶음 결과

- `pack_ragworm` · `pack_krill_box` 둘 다 `isBaitItem` false(바늘 소켓 후보에서 빠진다).
- 「열기」 1회 = 1갑 → 청갯지렁이 +8(시작 15 → 23 · 미끼 ✓) · 2회 = 31 · 세 번째(묶음 0)는 「열 묶음이 아니다」.
- 곽크릴(미끼용 20마리)은 「포장 뜯기」 = 크릴 20(미끼 ✓). 냉동 가림(「꽁꽁 얼어 있다」)은 집어제 블록(`chumKind: 'krill'`)에만 걸린다 —
  미끼용 곽은 전부터 그대로 뜯긴다(267 범위 밖 · 바꾸지 않았다).
- 가방 메뉴에 「상세보기 · 열기 · …」 줄이 선다.

## 6. 잔여 — 이번에 안 한 것

- **그림 얼굴 초상 66장** — Gemini 결제가 비어 있다(HTTP 402 「prepayment credits are depleted」). 충전 뒤
  `NODE_USE_ENV_PROXY=1 node tools/gemini_face_art.cjs --out <폴더>` → `--sheet` 검수 → `--install` → 부팅 로드 점검 → 위키 발행.
- 주인공 **얼굴형 3 · 입 4**는 치환하지 못한다 — 판을 더 뽑거나(×12) 포기(사용자 결정). 치환 허용 `CHROMA_TOL` 0.13은 실제 그림으로 조율.
- 영업시간 단서는 M1-04만 넣었다 — 가게에 가는 다른 의뢰에 `hint` 보강.
- 진행 말 어미는 규칙으로 만든다 — 목표 363줄의 명사화 결과를 전수 육안하지 않았다(「…(0/1)」 꼬리는 지금처럼 붙는다).
- 사용자 실플레이 확인 · 83차 배포(요청 시).

## 7. 위험·부작용

- `isBaitItem` 변경으로 묶음 · 포장이 바늘 소켓 후보에서 빠진다 — 묶음째 꿰어 둔 옛 세이브는 로드 때 소켓이 비어 보일 수 있다(묶음은 가방에 남는다).
- 대화창 쪽 모델은 로그를 지우므로 「앞 글 다시 보기」가 없다 — 긴 응답은 ▼로 넘긴다(일지 수첩에 답 첫머리가 남는다).
- 전체 지도 처음 배율이 홈타운에서 ×8 → ×5.6으로 낮아졌다(지도 384×256 → 269×179px).
- 가이드 하네스는 `__TOUR` 전역을 쓴다 — dev 전용 노출이라 배포본에는 없다(검증만).

## 8. 후속 반영

- [x] 시스템 페이지 — story-quests · world-field · inventory-equipment · home-base · character-art · ui-framework §4 · §6
- [x] `04-BACKLOG.md` CN
- [x] `AGENTS.md` §9 요약 + §4 R3 한 줄 · `IMPLEMENTATION_PLAN.md` §2-3 · §3 · `CLAUDE.md`
- [x] 아티팩트 — 남은 과업 설계 Version 8 · 구현 라이브러리 Version 8 · 채비 모딩 순서도 Version 8(「267차 기준」 줄) · 위키는 입력 불변(그림 초상이 들어오면 발행)
- [x] 새 함정 → 시스템 페이지 §6(대화창 쪽 · `__TOUR` · 묶음 미끼 · 집 ESC)
