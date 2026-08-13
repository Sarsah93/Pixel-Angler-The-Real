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
| 모듈 함수(렌더러 등) | `await import('/src/…​.ts')` — **`.ts` URL** | `.js` URL은 별개 모듈. 상태 없는 순수 함수 호출에만 사용 |

- **패널 직접 생성 시** `scene.add.existing(panel)` 필수 — DraggablePanel(Container)은 자동 등록되지 않는다 (7차).
- HMR 후에는 `?t=` 버전 분화 가능 — 이상하면 dev 서버 재시작 후 검증.
- **모듈 데이터 객체의 동일성(===) 비교 금지** (98차 실측) — 하네스가 import한 레지스트리와 게임/모듈이
  든 레지스트리는 인스턴스가 갈라질 수 있다(서버 재시작 직후에도 재현). 스프라이트 비교는
  **값 시그니처**(`w x h : rows[0]` 등)로 할 것.

## 자주 틀리는 시그니처·측정

- `drawPixelButcherFish(g, geom, tint, state, sprites)` — sprites가 **5번째** (3번째 아님).
- 텍스트 오버플로 측정은 **origin 보정**: 우측 끝 = `x + width * (1 - originX)` — origin 0.5를 `x+width`로 재면 오판 (54차).
- InventoryPanel 그리드: 셀 피치 = SLOT(66) + GAP(7) = **73px**, 시작 = `panel.x + gridX0` / `panel.y + gridY0`.
- 실마우스: `page.mouse.click(x, y)` / 우클릭 `{ button: 'right' }` / 드래그 = `mouse.move → down → move(스텝) → up`.
- ⚠ **`page.keyboard.press`는 아래 씬(MainMenuScene 메뉴 등)까지 구동한다** (97차 실측 — Enter 연타로
  NEW GAME이 시작돼 `InventoryStore.resetAll()`이 중간 지급분을 지움). 마우스는 topOnly 게이트가 있지만
  **키보드에는 없다** — 패널 버튼류 확정은 `panel.onKey({ code: 'Enter', shiftKey: false })` 직접 호출로.
- 헤드리스에서 `--virtual-time-budget` 방식은 Phaser 트윈/타이머가 진행되지 않는다 — 트윈 결과 검증은 실브라우저 + `waitForTimeout`.
- **손질 완주 하네스는 부산물 팝업(모달·depth 1600)에 막힌다**(92차) — 작업/섹션 완료마다 뜨며 이후 입력이 전부 무시된다.
  settle 루프에서 `if (panel.byproductPopup) panel.confirmByproductPopup(false)`(확인 후 계속)를 태울 것.
- `process.jumpTo` 직접 호출은 `renderedOrientation`/`renderedRotation`을 스냅하지 않는다 — 하네스 점프는 `panel.devJumpToTask(secIdx, taskId)` 사용(둘 다 스냅).

## 검증 종료 기준

1. 시나리오별 수치 어서션(depth·좌표·아이템 수량 등) 콘솔 출력 → PASS 판정.
2. **스크린샷** 저장(scratchpad) 후 Read로 육안 확인 — 레이아웃/겹침/방향은 눈으로 본다.
3. `pageerror 0` 확인.
4. 마지막에 `npx pnpm run build`(4/4) + `npx pnpm --filter @tra/client-pc run typecheck`(0 오류).
