# 240차 — 알림 가이드 · 위키 「농사」 탭(아이템 상세 전부 · 교차 링크) · 도감 카드 상세 · 71차 배포

| | |
|---|---|
| **날짜** | 2026-10-12 |
| **시스템** | `UI` `가이드` `위키` `홈` `인프라` |
| **트리거** | 사용자 지시 — 「인게임 알림 가이드/도움말 업데이트 → wiki 업데이트(농사 · 아이템 클릭 시 모든 상세) → 배포」 |
| **커밋** | (작업 브랜치 `claude/project-review-task-planning-yopbck`) · gh-pages `3bf5f41`(71차) · 위키 아티팩트 Version 39 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 164/164 |

---

## 1. 배경 — 왜 했나

사용자 지시(원문): 「우선 인게임 내 알림 가이드/도움말 업데이트하고, wiki 업데이트 한 후, 배포해줘. (스크린샷 캡처된 부분 실검증으로 확인해볼테니)
wiki에 농사 반영 시에, 아이템 클릭 시 해당 되는 모든 상세정보 같이 나오도록 해야 해. 어떻게 개선할 지 스스로 사고하고 반영해야 해.
(유저 입장에서 친화적인 방향으로 구현할 것; 최대한 웹 검색을 통해, 다른 게임들의 예시를 학습해야 함)」

- 도움말(F1)은 238차까지 텃밭 항목이 서 있었지만 **낡은 문구**(「텃밭은 아직 자라지 않고 수조는 열리지 않습니다」)가 남아 있었고,
  239차 건물 · 간판은 없었으며, 게임이 보내는 **알림을 한 곳에 모은 항목**이 없었다.
- 전체 위키 아티팩트(169차~)에는 농사가 없었다 — 씨앗 · 수확물 · 농자재가 아이템 탭에 「거래」 두 줄로만 서 있었다.
- 인게임 도감(N) 아이템 위키 카드는 눌러도 아무 일이 없었다(시스템 페이지 §4 「카드 상세 팝업 ⬜」).

## 2. 타 게임 위키 항목 구조(웹 조사) → 설계

| 게임 · 위키 | 항목이 주는 것 | 가져온 것 |
|---|---|---|
| Stardew Valley Wiki(작물 · 씨앗) | 인포박스(씨앗 · 자라는 날 · 계절 · 판매가 등급별) · 단계별 자람 · 달력 · 씨앗 파는 곳과 값 · 쓰이는 요리 · 번들 · 퀘스트 | 「한눈에」 · 심는 법 표(물건 · 값 · 파는 곳) · 등급 값 · 달별 값 막대 · 쓰이는 요리 · 할 일 |
| Terraria Wiki(아이템) | 「Obtained from」 표 → 「Used in」 표 — 얻는 법과 쓰임이 늘 같은 자리 · 자동 교차 참조(Itemsource) | 아이템 상세의 「농사」 절(어느 작물에서 · 어디에 쓰이나) · 농자재의 「이 자재가 드는 일」 |
| Fields of Mistria Wiki(작물 표) | 씨앗 파는 곳 · 자라는 날 · 판매가 · 「Used In」(요리 · 장식)을 한 표에 | 작물 카드 메타 줄(갈래 · 난이도 · 자라는 달) · 쓰이는 곳 절 |
| Minecraft Wiki 스타일 가이드 | 「Obtaining」 → 「Usage」 절 순서 고정 · 쓰임은 다른 항목에서 역참조로 생성 | 절 순서 고정 · `byItem` 역참조 맵(아이템 → 작물) |
| Lookup Anything(Stardew 모드) | 대상을 가리키고 한 키로 「언제 거두나」 등 전부 | 인게임 도감 카드 클릭 → 가방 [상세보기]와 같은 창 |

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`packages/client-pc/src/data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) | ① 홈타운 설치물 문구 현행화(텃밭 · 수조 · 작업대 · 화구 → 각 항목으로) ② 속초 맵에 239 건물(종류별 생김새 · 문은 남쪽 · 뒤에 서면 비침) · 간판 규칙 ③ **「알림 — 무엇이 언제 뜨나」 토픽 신설**(알림 자리 셋 · 텃밭 · 레벨 문턱 · 정기 지출 · 거치대 · 항구 신뢰 · 위판 · 도감 · 숙련 · 업적 · 상태 이상) ④ 도감 토픽에 카드 클릭 상세 |
| 수정 | [`packages/client-pc/src/i18n/en_help.ts`](../../../packages/client-pc/src/i18n/en_help.ts) | 새 문구 14건 영어 |
| 수정 | [`packages/client-pc/src/scenes/AnglerLogScene.ts`](../../../packages/client-pc/src/scenes/AnglerLogScene.ts) | 아이템 위키 **발견한 카드 클릭 → `ItemDetailPanel`**(카탈로그 템플릿을 1개짜리 물건으로 — 씨앗 · 수확물 · 농자재 줄 그대로) · 호버 테두리 · ESC LIFO · 탭 바꾸면 닫힘 |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) | `farming` 블록 — 작물 68(갈래 · 심는 곳 · 자라는 달 · 물 · 빠르기 · 난이도 · 자격 · 까다로운 점 · 갖출 것 · 희귀도) · 시작물(씨앗/모종/종구 — 값 · 칸당 · 싹 · 날 · 달 · 육묘 · 난이도 · 파는 곳) · 거두기(칸당 · 반복 · 포기당 · 익는 단계 · 중간 수확 · 둘 수 있는 날 · 덤) · 관리 작업 표(때 · 반복 · 준비물 · 손놀림 · 효과 · 놓치면 · 방법) · 병 3종 · 값(기준 · 변동폭 · 달별 12 · 등급 · KAMIS) · 쓰임(요리 재료 → 레시피 · 밑밥 · 시루 · 할 일) · 농자재 17(드는 일 · 기르는 작물) · `byItem` 326 |
| 수정 | [`tools/game_wiki_template.html`](../../../tools/game_wiki_template.html) | 「농사」 탭(갈래 11 + 농자재 · 난이도 4 세부) · `cropDetail`(7절) · `toSupplyCard` · 아이템 상세 「농사」 절 · **교차 링크 `a.xl[data-open=탭:키]`** → `openByKey`(탭 전환 + 카드 열기 · 조행록은 `go`) · 달별 값 막대 CSS |
| 신설 | `tools/wiki_img/px_*.png` 177장(gitignore) | Pillow 없는 컨테이너 — `PixelIconArt` 16×16을 순수 파이썬 PNG(zlib)로 6배 렌더(작물 · 씨앗 · 모종 · 종구 · 농자재). manifest는 공개된 아티팩트 파일 목록에서 복원 |
| 수정 | [`packages/client-pc/src/dev/MapEditorPanel.ts`](../../../packages/client-pc/src/dev/MapEditorPanel.ts) | (239 누락) 편집기 도움 문구 — 건물 키트 → OSM 윤곽 |
| 배포 | gh-pages `3bf5f41` | 71차 테스트 빌드 — 235~240차 포함(worktree `../pixel-angler-gh-pages` 새로 만듦) |
| 발행 | 위키 아티팩트 Version 39 | https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c — 파일 244 → 421(그림 177 추가) |

## 4. 구조상 위치

`S10 UI → 도움말 라이브러리(F1)` · `S20 도감 · 위키 → 전체 위키 아티팩트 → 농사 탭 · 아이템 상세` · `S20 → 인게임 도감 → 카드 상세 팝업`.
건드린 층 = **문서(도움말 · 위키 데이터)** · **렌더(위키 템플릿 · 도감 팝업)**. 게임 규칙 · 데이터(core)는 한 줄도 바꾸지 않았다 — 위키 수치는 전부 dist에서 읽는다.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 위키 농사 탭 | Playwright(로컬 파일) — 탭 · 분류 · 검색 「고추」 · 카드 → 시트 | 68 / 68건 · 갈래 11 · 난이도 4 · 고추 시트 7절(한눈에 · 심는 법 · 거두기 · 손이 가는 일 · 드는 병 · 값 · 쓰이는 곳) · 표 17행 · 교차 링크 26 · 달 막대 12 |
| 교차 링크 | 시트 안 밑줄 클릭 | 고추 → `고추 씨앗 (1칸 분)`(아이템 탭 · 「거래」 + 「농사」 절) → 고추 → `서더리 매운탕`(요리 탭) · 농자재 「지주대」 → 고추 · 방울토마토 · 오이 · 가지 · 여주 |
| 그림 | `img.naturalWidth === 0` 전수 | 깨진 그림 0 · pageerror 0 |
| 인게임 도감 | 실렌더 — `__DISC.devUnlockAll('item', …)` → 아이템 위키 소모품 2쪽 「고추 씨앗」 카드 클릭 | `ItemDetailPanel` 열림(depth 880) · pageerror 0 |
| 도움말 | typecheck · 빌드 | 0 오류 · 3/3 |
| 배포 | worktree → `tar --exclude='*.map'` → commit → push | `41f13f9 → 3bf5f41` · 소스맵 0 · 선행 `/` 로드 0 |
| 라이브 검증 | Playwright → `sarsah93.github.io` | **컨테이너 프록시가 github.io CONNECT를 403으로 막아 못 했다** — 사용자 실검증으로 대신(스크린샷 캡처 지점) |

재현: `node tools/dump_wiki_items.mjs && node tools/gen_game_wiki_data.mjs --html > <out>/index.html` → `wiki_check.cjs`(scratchpad).

## 6. 잔여 — 이번에 안 한 것

- **라이브 배포 검증**은 사용자 몫(프록시 차단). 도움말 「알림」 · 속초 건물 · 도감 카드 클릭을 실플레이로 봐 주면 된다.
- 위키 「할 일」 교차 참조는 목표 글 · 보상 이름에 작물 이름이 들어간 것만 잡는다 — 서사 선택지 보상(정옥선 풋고추 10 · 상추씨)은 안 잡힌다(StoryNarrative는 생성기가 안 읽는다).
- 위키 그림 파이프라인(`gen_wiki_images.py`)은 여전히 Pillow가 필요하다 — 이번 177장은 순수 파이썬으로 구웠고 manifest는 아티팩트 목록 복원이라, 실사 썸네일을 다시 굽는 PC에서는 원래 절차를 쓴다.
- 인게임 도감 어종 · 해양생물 · 요리 카드는 아직 클릭 상세가 없다(아이템만).
- 도움말 EN 전수 하네스(238차 107/107 방식)는 이번에 돌리지 않았다 — 새 문구 14건은 손으로 사전에 넣었다.

## 7. 위험·부작용

- `AnglerLogScene`에 `DraggablePanel`을 처음 올렸다 — 카메라 스크롤이 없는 씬이라 `applyFix` 없이 좌표가 맞는다. 다른 탭으로 가면 닫는다.
- 위키 템플릿 `openByKey`는 분류를 초기화한 「전체」 목록에서 키를 찾는다 — 전체에 없는 카드(없음)면 검색어로 남긴다.
- **빌드(`pnpm run build`)가 dev 서버를 죽인다**(이번 세션 두 번 실측) — 빌드 뒤 하네스는 dev 재시작부터.
- gh-pages worktree는 이 컨테이너에 새로 만들었다(`git worktree add ../pixel-angler-gh-pages gh-pages`).

## 8. 후속 반영

- [x] `02-SYSTEMS/discovery-wiki.md` §2 · §4 · §5 · `ui-framework.md` §4
- [x] `04-BACKLOG.md` BP
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`(배포 71차)
- [x] 스킬 `deploy-ghpages`(worktree 생성 · 빌드가 dev 서버를 죽임 · github.io 프록시 차단) · `verify-render`
