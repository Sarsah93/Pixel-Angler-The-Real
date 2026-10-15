# 250차 — 마우스 포인터 「찌 화살」 · main 반영 · 74차 배포 (2026-10-15)

> 시스템: UI 프레임워크(포인터) · 배포
> 계층: 에셋(포인터 원본 · 굽기 도구) + 렌더 배선(캔버스 커서 · Phaser 손 커서 대체) + 인프라(main · gh-pages)

| | |
|---|---|
| **날짜** | 2026-10-15 |
| **시스템** | `UI` `에셋` `도구` `인프라` |
| **트리거** | 사용자 지시(250차) |
| **커밋** | 이 문서가 든 커밋(구현 · 문서) · 74차 배포 기록은 두 번째 커밋 — 작업 브랜치 `claude/project-review-task-planning-yopbck` → main 빨리 감기 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 259/259 |

---

## 1. 배경 — 왜 했나

사용자 지시(원문):

- 「main 반영과 gh-pages 74차 「테스트 배포」진행해줘.」(보낸 뒤 중단하고 아래로 다시 보냈다)
- 「마우스 포인터는 1번 찌 화살로 하고, main 반영과 gh-pages 74차 「테스트 배포」진행해줘.」

포인터 시안은 247차에 Gemini로 6종을 뽑았고, 249차에 `docs/mockups/pointer_drafts/`로 옮겨 실제 게임 화면 위 실제 크기로 다시 보였다.
사용자가 그중 1번(찌 화살 · 추천안)을 골랐다.

## 2. 판단 — 무엇을 어떻게 정했나

### 2.1 기본 = 시안 그대로 · 누를 수 있는 곳 = 같은 그림 + 흰 테

- 기본 커서는 고른 23px 그림을 한 칸도 바꾸지 않았다 — 게임이 구운 1배 그림이 원본 PNG와 픽셀 단위로 같다.
- 누를 수 있는 곳(Phaser `useHandCursor` — 208곳 · 커서 값 `'pointer'`)을 운영체제 손으로 두면 도트 찌 ↔ 운영체제 손이 번갈아 나와 따로 논다.
  같은 그림 둘레에 **흰 테 1px(4방향)** 를 두른 손 커서를 만들었다 — R14 필드 글자(검은 글자 + 흰 테)와 같은 생각이다.
- 고른 근거: 5벌(기본 그대로 · 기본 + 반투명 흰 테 · 흰 테 8방향 · 흰 테 4방향 · 찌 머리를 케미 불빛 노랑으로)을
  밝은 길 · 밤(어둡게 한 필드) · 텃밭 · 어두운 가방 판 · 메뉴 단추 위에 1배로 얹어 비교했다(scratchpad `cursor250/variants*.png`).
  4방향 흰 테가 어느 바탕에서나 「눌린다」로 읽히고, 8방향보다 가늘어 모양이 그대로다. 케미 불빛은 다른 물건처럼 보였다.
- 밤 · 어두운 판에서는 기본 커서의 검은 테와 남색 몸통이 바탕에 묻힌다(빨강 · 흰 머리는 보인다).
  사용자가 고른 그림이라 기본에는 테를 더하지 않았다 — 실플레이에서 안 보이면 반투명 흰 테(비교 2번)를 더한다(§6).

### 2.2 크기 · 선명도

- **CSS 23px 그대로** — 시안을 본 1280×720 실제 크기다. 게임 창이 커져도(Scale.FIT) 포인터는 키우지 않는다.
  크롬은 32px(DIP)를 넘는 커서가 주소창 같은 브라우저 화면에 걸치면 숨긴다 — 2배(46px)로 키우면 화면 위쪽에서 운영체제 화살로 바뀐다.
- **고해상도 화면은 `image-set`** — devicePixelRatio 2 · 3에서 1배 그림을 브라우저가 늘이면 흐려진다.
  1 · 2 · 3배 그림(칸을 그대로 키운 것)을 `image-set(… 1x, … 2x, … 3x)`로 주고, 되는지는 `CSS.supports('cursor', …)`로 본다(안 되면 1배 `url()`).
- **끝점** = 찌 꼭대기 빨간 칸 (1,1). 손 커서는 테 때문에 그림이 1px 밀려 (2,2) — 화면에서는 같은 자리다.

### 2.3 그림 전달 = data URI

- 글자 격자(`data/GameCursorArt.ts` — 자동 생성)를 캔버스로 구워 data URI로 쓴다.
  파일 경로가 없어 gh-pages 하위 경로 · Tauri에서 그대로 동작하고, 처음 올릴 때 늦게 떠서 운영체제 커서가 비치는 일이 없다.
- 기본 커서 값(3벌) = 3,320자.

### 2.4 연결

- `ui/GameCursor.ts` `installGameCursor(game)` — `game.ts`가 `Phaser.Game`을 만든 직후 부른다(부팅 전이면 READY 뒤).
  `setDefaultCursor(기본)` + Phaser `InputManager.setCursor`를 감싸 `'pointer'`만 손 커서로 바꾼다.
- `restoreHandCursor`(118차 — 단추가 창을 열고 닫은 뒤 손 커서 되살리기)도 `handCursorCss()`를 쓴다.
- HUD 끌기 손잡이 `'move'`는 그대로 둔다(끌 수 있다는 운영체제 표시).

### 2.5 main 반영 · 74차 배포

- main(`6c17166` — 248차(2))은 작업 브랜치의 조상이라 **빨리 감기**로 올린다 — 249차 2커밋 + 이번 커밋.
- 배포는 「테스트 배포」 워크플로(`deploy-pages.yml` · ref `main`)가 한다 — 에이전트는 `gh-pages`에 직접 쓰지 않는다(스킬 `deploy-ghpages`).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`client-pc/src/ui/GameCursor.ts`](../../../packages/client-pc/src/ui/GameCursor.ts) | 굽기(1 · 2 · 3배) · `image-set` 판정 · `installGameCursor` · `handCursorCss` |
| 신설 | `client-pc/src/data/GameCursorArt.ts` | 자동 생성 — 기본 23×23 · 손 25×25 글자 격자 + 팔레트 + 끝점 |
| 신설 | [`tools/gen_game_cursor.cjs`](../../../tools/gen_game_cursor.cjs) | 원본 PNG → 손 커서(흰 테 4방향) · TS 생성 · 반투명 픽셀이면 멈춤 |
| 신설 | `assets/cursor/` | `arrow_float.png`(23px — 시안 1번) · `arrow_float_hand.png`(손 미리보기) · `arrow_float_gemini.png`(Gemini 원본 1,024px) |
| 수정 | `client-pc/src/game.ts` | 게임을 만든 직후 `installGameCursor(game)` |
| 수정 | `client-pc/src/ui/DraggablePanel.ts` | `restoreHandCursor` → `handCursorCss()`(키워드 `'pointer'`를 직접 넣지 않는다) |

## 4. 구조상 위치

- `UI 프레임워크 → 입력 · 커서 → 게임 포인터` — 렌더 배선 층이다. 입력 판정 · 히트 영역 · `useHandCursor` 표시는 그대로다.
- `인프라 → 테스트 배포 → 74차` — main 빨리 감기 + 워크플로 실행.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 빌드 · 타입 | `pnpm run build` · `tsc --noEmit` | 3/3 · 0 |
| core | `vitest` | 259/259 |
| 부팅 | 실렌더 `r250.cjs` — 캔버스 `style.cursor` · 계산값 | `image-set`(1 · 2 · 3배) · 계산값도 `image-set`(크롬이 받아들임) · 끝점 `1 1` · 대체 `default` |
| 메뉴 | 단추 위로 → 벗어나기 | 손 커서(키워드 `'pointer'` 아님) → 기본으로 돌아옴 |
| `restoreHandCursor` | 게임과 같은 모듈에서 부르기 | 손 커서 값 · `handCursorCss()`와 같음 |
| 필드 | HUD 단추(64×64) 위 → 빈 자리 | 손 → 기본 |
| 가방 | 가방 안 단추 위 → 벗어나기 | 손 → 기본 |
| 그림 | 게임이 구운 data URI를 꺼내 비교 | 기본 1배 = 원본 픽셀 · 손 1배 = 미리보기 · 2 · 3배 = 46 · 69 / 50 · 75px |
| 오류 | 4xx · pageerror | 0 · 0 |

재현: dev에서 `globalThis.__PIXEL_ANGLER_GAME.canvas.style.cursor`가 `image-set(url("data:image/png;base64,…`로 시작한다.
단추 위에서 값이 바뀌고 벗어나면 돌아온다. **헤드리스 스크린샷에는 커서가 찍히지 않는다** — 값으로 확인하고,
그림은 data URI를 꺼내 캡처 위에 얹어 본다(scratchpad `cursor250/live_check.png`).

## 6. 잔여 — 이번에 안 한 것

- **기본 커서의 어두운 바탕 가독성** — 밤 바다 · 어두운 판에서 검은 테 · 남색 몸통이 묻힌다. 사용자 실플레이 의견에 따라 반투명 흰 테(비교 2번)를 더한다.
- **창 크기를 따라 커지는 포인터** — 하지 않았다(32px 넘는 커서 숨김). 큰 화면에서 작게 느껴지면 설정에 「포인터 크기」를 둔다.
- **운영체제 커서로 되돌리는 설정** — 요청이 있으면 설정 창에 한 줄.
- **74차 라이브 확인 = 사용자** — 컨테이너 프록시가 `sarsah93.github.io`를 막는다.

## 7. 위험·부작용

- Phaser 내부 함수(`InputManager.setCursor` — 문서상 private · 타입 선언 없음)를 감쌌다. Phaser를 올릴 때 이름과 동작을 확인한다(3.90.0 기준).
  함수가 없으면 기본 커서만 입히고 손 커서는 운영체제 손으로 둔다(오류로 멈추지 않는다).
- 커서 값을 직접 넣는 새 코드는 `'pointer'` 대신 `handCursorCss()`를 쓴다 — 키워드를 넣으면 그 자리만 운영체제 손이 된다.
- 하네스에서 `game.scene.start`로 씬을 바꾸면 메뉴 씬이 멈추지 않아 입력 정리(커서 되돌림)가 없다.
  단추 밖에서 `restoreHandCursor`를 부르면 손 커서가 남는다 — 실제 게임은 단추 위에서만 부른다(118차 설계 그대로).

## 8. 후속 반영

- [x] 시스템 페이지 `ui-framework.md` §2 · §4 · §6
- [x] `04-BACKLOG.md` — BT ① · BV ③ ④ 닫음 · BW(250 잔여)
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 요약
- [ ] 74차 배포 결과(워크플로 · 배포본 기동 점검) — 두 번째 커밋
