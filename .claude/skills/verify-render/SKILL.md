---
name: verify-render
description: Pixel Angler 실렌더/실동작 검증 하네스 작성 규칙. dev 서버 + Playwright(설치 Chrome)로 게임을 실제 렌더해 UI·패널·스프라이트·스토어 동작을 검증할 때 반드시 로드. "실렌더 검증", "스크린샷 검증", "하네스", "Playwright", "__INV", "브라우저에서 확인" 작업이면 이 스킬을 따른다.
---

# 실렌더 검증 하네스 (Playwright + dev 서버)

이 프로젝트의 표준 검증 방식. 헤드리스 추측 금지 — **실제 게임 인스턴스를 띄워 실마우스/실렌더로 확인**하고 스크린샷을 남긴다.

## 준비

```bash
npx pnpm --filter @tra/client-pc run dev   # → http://localhost:5173 (백그라운드 실행)
```

- typecheck가 통째로 깨져 보이면 십중팔구 **stale `@tra/core` dist** — `npx pnpm --filter @tra/core run build` 선행 (31·32차 반복 함정).
- Playwright는 설치하지 않는다 — npx 캐시 재사용 (아래 보일러플레이트). 없을 때만 `npx -p playwright@1.62.1 node ...`.
- ⚠ **core를 고쳤으면 `packages/client-pc/node_modules/.vite`를 지우고 dev를 재시작한다**(127차 실측) —
  vite dev는 `@tra/core`를 **사전 번들(deps)로 캐시**하므로, core를 다시 빌드해도 브라우저는 **옛 core를 계속 본다**.
  씬 코드(HMR)만 새 값이라 "배선은 맞는데 수치가 안 바뀐다"로 보이고, 조용히 잘못된 결론을 낸다.
- ⚠ **i18n·에셋을 고친 뒤에도 dev 재시작** — HMR `?t=` 분화로 하네스의 `/src/...ts` import가
  게임과 **다른 모듈 인스턴스**를 잡는다(120차). `setLocale(l)`은 **`setLocale(l, game)`으로 부를 것** —
  game 인자가 없으면 `refreshAll`이 안 돌아 이미 그려진 Text가 한국어로 남는다(127차 오진 1회).

## 하네스 보일러플레이트 (.cjs — scratchpad에 작성)

```js
const fs = require('fs');
const path = require('path');
function resolvePlaywright() {
  try { return require('playwright'); } catch { /* npx 캐시 탐색 */ }
  const base = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const p = path.join(base, d, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error('playwright not found');
}
const { chromium } = resolvePlaywright();

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });   // 설치된 Chrome 재사용 — 다운로드 금지
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));            // pageerror 0 = 필수 어서션
  await page.addInitScript(() => localStorage.setItem('tra_fp_guide_seen', '1'));  // 1인칭 첫진입 가이드 차단
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });    // networkidle 금지(외부 API 폴링)
  await page.waitForFunction(() => {
    const g = globalThis.__PIXEL_ANGLER_GAME;
    return g && g.scene.isActive('MainMenuScene');                // 대상 씬 활성 대기
  }, { timeout: 30000 });
  // ... 검증 본문 ...
  console.log('[pageerror]', errors.length, errors.slice(0, 3));
  await browser.close();
})();
```

## 게임 상태 접근 — 절대 규칙

| 대상 | 올바른 접근 | 함정 |
|---|---|---|
| 게임 인스턴스 | `globalThis.__PIXEL_ANGLER_GAME` | — |
| 인벤토리 스토어 | `globalThis.__INV` (dev 전용 노출) | `import('/src/store/InventoryStore.ts')`는 **게임과 별개 모듈 인스턴스** (17·59차 실측) — 조작이 게임에 반영 안 됨 |
| GameState | `globalThis.__GS` (dev 전용) | 위와 동일 함정 (72차 실측) |
| 1인칭 낚시 씬 | `globalThis.__FP` (dev 전용) — `devForceBite()` / `devForceFight('dive'|'jump'|'lateral'|'none', dir)` · 패턴을 유지하려면 `fight.patternTimer = 9`도 같이 | 입질을 기다리지 말 것 — 강제한다(118차). 캐스팅은 물 쪽(우하)으로 조준: `mouse.move(900,440) → down 400ms → up` |
| 맵 편집기(F7) 상태 | `globalThis.__MAPEDIT` (dev 전용 — `state`/`rotate`/`flip`/`toggleOverlap`/`isOpen`) | import한 `MapEditorPanel`은 게임과 별개 인스턴스 (106차 실측 — `mapEditorState` 동일성 false) |
| 채집·통발 필드 시스템 | `globalThis.__FIELD` (dev 전용 — `forage`(`allSpots`/`devForceSpot`/`candidateStats`) · `trapField`(`placing` 주입 → `confirmAt`/`devRewind`/`harvest`) · `cooler` · `tuning`(TUNING 실인스턴스) · `getTrapById`) | **실데이터 파고 ≥1.5m·풍속 ≥12m/s면 [E]가 거부된다**(121차 실측 2.1m) — `__FIELD.tuning.forage.maxWaveM = 9`로 올리고 진행. 적발 확률은 `tuning.forage.enforcementChance = 1`. 씬 진입은 `__GS.startNewGameInSlot(3)` → `scene.start('RegionFieldScene',{region:'gangwon_sokcho'})` |
| 불요리 | `globalThis.__COOK` (dev 전용 — `CookingStore` 실인스턴스) + `__FIELD.stoveField`(`placing` 주입 → `confirmAt` · `placeCheck` · `onInteractKey(shift)`) | 시간은 벽시계라 **`st.lastTickMs -= N·1000` 되감기 후 `__COOK.syncAll()`**(실 10초 = 조리 1분). 패널이 열린 채 스토어를 바꿔도 250ms 틱의 레이아웃 키가 따라온다 |
| 모듈 함수(렌더러 등) | `await import('/src/…​.ts')` — **`.ts` URL** | `.js` URL은 별개 모듈. 상태 없는 순수 함수 호출에만 사용 |

- **패널 직접 생성 시** `scene.add.existing(panel)` 필수 — DraggablePanel(Container)은 자동 등록되지 않는다 (7차).
- HMR 후에는 `?t=` 버전 분화 가능 — 이상하면 dev 서버 재시작 후 검증.
- ⚠ **vite dev는 `@tra/core`를 `@fs` 소스로 직접 서빙한다**(154차 실측) — core `tsc` 빌드가 **실패해도** 브라우저는 새 소스를
  그대로 돌린다. 타입 오류로 빠진 `TUNING` 키는 `undefined`가 되어 비교문이 조용히 통과한다(용량 판정이 그렇게 통과했다).
  하네스 전에 반드시 `npx pnpm --filter @tra/core run build`의 **오류 0**을 확인할 것.
- **dev 서버를 `| head`로 파이프하지 말 것**(122차) — head가 닫히면 vite가 SIGPIPE로 죽어 하네스가 ECONNREFUSED. 로그는 `> vite.log 2>&1`로.
- **core 데이터가 하네스에 필요하면 `await import('/@id/@tra/core')`**(122차 — `REGION_DATABASE`·`FISH_DATABASE` 등. 상태 없는 데이터 전용).
- 도감 카드 전부 채우기 = `__DISC.devUnlockAll('fish', ids)` / `('creature', ids)` — **(kind, ids) 2인자**(122차).
- ⚠ **i18n 검증은 특히 위험** — `i18n/*.ts` 를 고친 뒤 하네스가 `import('/src/i18n/I18n.ts')` 하면
  HMR 분화로 **게임과 다른 인스턴스**(locale 기본 `ko`)를 잡아 `t()`가 전부 원문을 돌려준다.
  "고쳤는데 전 항목 미번역"으로 보인다(120차에 두 번). **i18n 수정 → dev 서버 재시작 → 스캔.**
  게임의 Text 객체를 직접 훑는 방식(`__i18nSrc` vs `text` 비교)은 이 함정이 없다 — 그쪽을 우선한다.
- **대화창은 단락이 여럿이면 `▼`에서 멈춘다**(167차) — 선택지 행(`panel.rows`)이 뜰 때까지 `panel.advance()`를 반복 호출한다.
  컷씬은 `cinematicActive`가 풀릴 때까지 폴링하되, 헤드리스는 fps 13·delta 16.7 고정이라 **벽시계로 약 4배** 걸린다(43초 각본 = 실 3분).
  퀘스트 상태는 `globalThis.__STORY`(dev 전용 — `devActivateQuest`·`devActivateAction`·`devSetActionStep`).
- **헤드리스 rAF는 프레임 간격이 300ms를 넘는다**(149·155차) — 시간 누적으로 도는 갱신(퀘스트 화살표 `updateQuestGuide` 400ms 등)은
  `waitForTimeout`으로 기다리지 말고 **씬 메서드를 직접 호출**(`s.updateQuestGuide(500)`). 2.5초를 기다려도 null이 나온다.
- **`update()`가 매 프레임 `nearWater`를 다시 계산한다**(155차) — 캐스팅 게이트를 하네스로 두드릴 때는 `s.nearWater = true`를
  **호출 직전마다** 다시 넣는다(한 번 넣고 두 번째 `tryStartCharge`를 부르면 `charging false`).
- 필드 화살표·추적기 검증은 `__STORY.setTracked(id)` → `s.updateQuestGuide(500)` → `s.hud.trackerC.list`(Text)·`s.questArrowG.visible`.
- **모듈 데이터 객체의 동일성(===) 비교 금지** (98차 실측) — 하네스가 import한 레지스트리와 게임/모듈이
  든 레지스트리는 인스턴스가 갈라질 수 있다(서버 재시작 직후에도 재현). 스프라이트 비교는
  **값 시그니처**(`w x h : rows[0]` 등)로 할 것.

## 자주 틀리는 시그니처·측정

- 맵 편집 하네스: `s.toggleMapEditor()` → `__MAPEDIT.state` 설정 → `s.editBeginStroke(ptr)`/`s.editFinishStroke()`.
  포인터는 **스크린 좌표**(`tile*32 - camera.scrollX`)로 만든다. 저장 왕복을 테스트하면 `patch.json`이
  덮이므로 **백업 후 복원**할 것(106차 — 사용자 편집분 보호).
- `drawPixelButcherFish(g, geom, tint, state, sprites)` — sprites가 **5번째** (3번째 아님).
- 텍스트 오버플로 측정은 **origin 보정**: 우측 끝 = `x + width * (1 - originX)` — origin 0.5를 `x+width`로 재면 오판 (54차).
- InventoryPanel 그리드: 셀 피치 = SLOT(66) + GAP(7) = **73px**, 시작 = `panel.x + gridX0` / `panel.y + gridY0`.
- 실마우스: `page.mouse.click(x, y)` / 우클릭 `{ button: 'right' }` / 드래그 = `mouse.move → down → move(스텝) → up`.
- ⚠ **`page.keyboard.press`는 아래 씬(MainMenuScene 메뉴 등)까지 구동한다** (97차 실측 — Enter 연타로
  NEW GAME이 시작돼 `InventoryStore.resetAll()`이 중간 지급분을 지움). 마우스는 topOnly 게이트가 있지만
  **키보드에는 없다** — 패널 버튼류 확정은 `panel.onKey({ code: 'Enter', shiftKey: false })` 직접 호출로.
- 헤드리스에서 `--virtual-time-budget` 방식은 Phaser 트윈/타이머가 진행되지 않는다 — 트윈 결과 검증은 실브라우저 + `waitForTimeout`.
- ⚠ **헤드리스에서 "게임 시간"을 벽시계로 재지 말 것**(132차 실측) — 헤드리스 크롬의 rAF는 **초당 2회** 수준이고
  `update()`의 `dt`는 `Math.min(0.05, …)`로 클램프되므로, 게임은 실시간의 **1/10 속도**로 흐른다
  (10m 파이트가 벽시계 **110초**로 측정됐다). 지속 시간·속도를 재려면 **씬의 `update(now, 16.67)`를 수동 스텝**으로
  돌리고(`for (…) fp.update(performance.now(), 16.67)`) 씬이 누적한 게임 시간 필드(예: `fightElapsedSec`)를 읽는다.
  같은 이유로 `page.waitForTimeout` 기반의 "N초 뒤 상태" 어서션은 전부 실제보다 훨씬 적게 진행된 상태를 본다.
- ⚠ **`pkill -f <스크립트명>`은 하네스가 아니라 자기 자신을 죽인다**(132차) — 호출한 bash의 커맨드라인에도 그 문자열이
  들어 있어 셸이 먼저 종료된다(exit 144). `ps -eo pid,args | awk '$2 ~ /node$/ && /<이름>/ {print $1}' | xargs kill`처럼
  **프로세스 실행 파일까지 좁혀서** 지정할 것.
- ⚠ **하네스 실행 중에는 소스를 고치지 말 것**(132차) — vite HMR이 페이지를 리로드해
  `page.evaluate: Execution context was destroyed`로 죽는다. 코드 수정 → 빌드 → dev 재시작 → 하네스 순으로.
- ⚠ **실브라우저(playwright) 헤드리스에서도 `scene.time` 타이머 이벤트가 발화하지 않는다**(128차 실측 —
  씬 status 5·`time.paused` false·`time.now` 증가인데도 **새로 등록한 프로브 이벤트조차 0회**).
  1초 루프로 갱신되는 HUD(시계·상태 패널·스트립)는 **콜백을 직접 호출**해 검증할 것(`hud.updateStatus()`).
- ⚠ **`__GS.vitals`는 게터가 매번 새 객체를 만든다**(128차) — `__GS.vitals.hunger = 62`는 버려진다.
  `__GS.commitVitals({ ...__GS.vitals, hunger: 62, hydration: 41 })`로 실필드에 쓸 것.
- ⚠ **픽셀 아이콘·도트 아트는 반드시 실사이즈(16px) 스크린샷을 육안 확인**(128차) — 10배 미리보기에서는
  다 그럴듯해 보이지만 16px에서 형태가 뭉개진다(마스크가 흰 알약, 뼈가 나비넥타이로 읽혀 3종 재작업).
  판정 어서션으로는 절대 못 잡는 종류의 결함이다.
- **손질 완주 하네스는 부산물 팝업(모달·depth 1600)에 막힌다**(92차) — 작업/섹션 완료마다 뜨며 이후 입력이 전부 무시된다.
  settle 루프에서 `if (panel.byproductPopup) panel.confirmByproductPopup(false)`(확인 후 계속)를 태울 것.
- `process.jumpTo` 직접 호출은 `renderedOrientation`/`renderedRotation`을 스냅하지 않는다 — 하네스 점프는 `panel.devJumpToTask(secIdx, taskId)` 사용(둘 다 스냅).

## 검증 종료 기준

1. 시나리오별 수치 어서션(depth·좌표·아이템 수량 등) 콘솔 출력 → PASS 판정.
2. **스크린샷** 저장(scratchpad) 후 Read로 육안 확인 — 레이아웃/겹침/방향은 눈으로 본다. **HUD/패널이 "보이는지"도 반드시 눈으로**
   (118차: `statusC.add(statusC)`로 상태 패널이 통째로 안 그려졌는데 상태값 어서션은 전부 PASS였다).
3. `pageerror 0` 확인.
4. 마지막에 `npx pnpm run build`(3/3) + `npx pnpm --filter @tra/client-pc run typecheck`(0 오류).

## 좀비 프로세스 (117차 실측)

- 하네스가 타임아웃/크래시로 죽으면 **헤드리스 Chrome과 node가 남아** 다음 하네스의 스크린샷을 덮어쓰거나(백그라운드
  하네스가 같은 파일명으로 저장) dev 서버를 느리게 만든다. 이상하면 먼저 정리:
  `Get-CimInstance Win32_Process | ? { $_.CommandLine -match 'headless' } | % { Stop-Process -Id $_.ProcessId -Force }`
- 백그라운드로 띄운 하네스는 **끝나기 전에 같은 출력 파일명으로 새 하네스를 돌리지 말 것**(116차 — 재캡처로 복구).
- "Target crashed"가 **포인터 이동만으로** 나면 코드 문제(중첩 컨테이너 + GeometryMask + 인터랙티브 자식 — ui-panel 스킬)다.
  `git stash`로 이등분해 원인 파일을 좁힌다.
