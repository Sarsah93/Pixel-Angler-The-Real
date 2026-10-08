# 학습 노트 — 1 엔지니어링

> 이 도메인에 대해 **지금 사실인 것**만 적는다(누적 금지 · 갱신). 추정은 "추정"이라고 쓴다.
> 400줄을 넘기지 않는다. 날짜별 경과는 `reports/`에 있다.

## 구조

- 워크스페이스는 `packages/core` · `client-pc` · `server` + `apps/tauri-wrapper` 4개다.
  빌드 작업이 있는 것은 앞의 3개(3/3)이고 tauri-wrapper는 `tauri` 스크립트뿐이다. `packages/map-builder`는 워크스페이스에서 빠져 있다.
- 씬 등록은 `main.ts`가 아니라 `packages/client-pc/src/game.ts`의 배열(20개)이다. `main.ts`는 `createGame()` 호출과 HMR 정리만 한다.
- core `index.ts`는 `export *`가 아니라 이름을 하나씩 적는다(284블록 · 174파일). 새 파일뿐 아니라 새 심볼도 손으로 더해야 한다.
  파일 단위 누락은 0이다. export 안 된 4파일(`api-client/mock/*` 2 · `StoryChoicesEn.ts` · `scripts/chumSyncSim.ts`)은 의도된 것이다.
- `@tra/core` 해석이 도구마다 다르다. Vite는 별칭으로 `core/src/index.ts`, `tsc`와 server는 `core/dist`를 본다.
  core를 빌드하지 않으면 타입 검사와 서버가 옛 dist를 본다.
- core 빌드는 테스트만 빼고 `scripts/`는 dist에 넣는다. `tsconfig.base.json`의 lib에 DOM이 있어 core의 DOM 금지는 지표 규칙만 막는다.
- 서버 = Express(`/api` 날씨 프록시 · `/mp` 멀티 REST 17경로 · `/health`) + Socket.IO(미사용 뼈대).
  멀티 인증은 `SessionRegistry.authed()`가 요청마다 `playerId` + `token`을 대조한다.
- 테스트는 core에만 있다(vitest · 10파일 79개 · 약 4초). client-pc와 server에는 테스트 러너가 없고 CI(`.github`)도 없다.
- 번들은 단일 청크 6.7 MB(gzip 2.0 MB)이고 소스맵 23 MB가 함께 나온다(`vite.config.ts`의 `sourcemap: true`).
- 잠금 파일의 실제 버전: TypeScript 5.9.3 · Vite 6.4.3 · Turbo 2.10.4 · Phaser 3.90.0 · vitest 3.2.7 · express 4.22.2.
- 검증 기준선(2026-10-08 · `4b86d71`): install 7초 · build 3/3 21초 · client-pc typecheck 오류 0(7초) · core test 79개 통과(5초).

## 규칙과 함정

- Phaser는 키 없는 씬을 `'default'`로 등록한다. 키 없는 씬이 둘이 되면 부팅 때 중복 키 예외가 난다.
  점검법: `scenes/*.ts`에서 `extends Phaser.Scene` 수와 `super({ key:` 수를 대조한다(지금 20 대 19 — `FishingScene`).
- 서버에서 모듈 최상위로 `process.env`를 읽으면 `dotenv.config()`보다 먼저 평가된다(ESM import 호이스팅).
- `pnpm run lint`의 성공은 아무 뜻이 없다(실행 작업 0개 — ESLint가 없다).
- 지표 `env`의 "정의됐지만 미사용" 목록은 `envKey('VITE_…')`처럼 문자열로 읽는 이름을 못 잡는다.
- 루트 `dev`는 `turbo run dev --parallel`이고 `^build` 의존이 없다. 새로 받은 저장소에서는 server가 core dist 없이 먼저 뜰 수 있다(추정).
- client-pc 스토어에 순환 묶음이 하나 있다(GameState · Prologue · CraftingStore · ShopStore · QuestItemGuard).
  낮은 층 스토어는 `ItemKeepGuard`처럼 함수 걸이로 순환을 피하는 관례가 있다. core 179파일 · server 8파일은 순환 0.
- 확정 타입(`TideInfo` · `SpotType`)은 234차에서 바뀌지 않았다. 변경분 점검 때 diff에서 `highTideHeightCm` · `tidal_flat`을 grep한다.
- 규칙 `core-no-render`는 0건이다. `window`를 직접 grep하면 영어 이야기 문장 속 단어 10건이 걸린다(오탐).
- `FishingScene`은 `AGENTS.md` §5 「완료 · 수정 금지」 표의 파일이다. 키 추가는 제안만 한다.
- 확인하지 못한 것: core `clean`이 `rimraf dist`뿐이라 `tsconfig.build.tsbuildinfo`가 남는다 — clean 뒤 재빌드 출력이 비는지.
  core · server의 `typecheck`는 검증 명령에 없다(client-pc만). `index.ts`의 심볼 단위 미export 20개가 의도된 내부 심볼인지.

## 테스트 추가 우선순위 (후보)

1. `rules/SessionWeather.ts` + `types/Multiplayer.ts`의 `mpWorldSeed` · `mpRng` · `mpTimeSlot` · `mpPlacedClash` — 서버와 모든 클라이언트의 계약.
2. `simulation/TideCalculator.ts` + `utils/KstTime.ts` + `utils/LunarCalendar.ts` — 시간대 의존을 고정 날짜로 드러낸다.
3. `rules/Upkeep.ts` + `simulation/DayLedger.ts` — 돈 · 만료 · 벌칙.
4. `simulation/ButcheryProcess.ts`의 `computeFilletYield`와 등급 판정.
5. `simulation/MarketPriceEvaluator.ts` · `ConsignmentAuction.ts` · `AuctionEngine.ts`.

## 닫힌 수정안에서 배운 것

- (없음)
