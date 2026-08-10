# 088차 — 검은 화면 전수검사(방어 4종) + 무늬오징어 체장-무게 실측 정합 + 한치 아이콘 동기화 + PLAN 가독성/스킬

| | |
|---|---|
| **날짜** | 2026-08-10 |
| **시스템** | `씬 전환/부트`(world-field·ui-framework) · `어종 DB`(economy-data) · `문서 체계` |
| **트리거** | 사용자 리포트 3건 — ① "한치 사진 교체했는데 인벤 아이콘이 구본" ② "NEW GAME 진입 시 검은 화면 — 전역 씬 전환·코드 전수검사" ③ "무늬오징어 체장·무게 밸런스를 캡처 기준으로 (30cm 미만 1kg 금지)" + PLAN 가독성 지시 |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 4/4 · 0 오류 |
| **검증 상태** | 자동 검증 6/6 PASS (Playwright 실렌더·실키입력) + 무게 곡선 수치 검증 |

---

## 1. 배경

1. **한치 아이콘** — *"'swordtip_squid'의 사진이 교체되었는데, 인벤토리 한치 어종 아이콘으로 아직도 이전 이미지를 사용하고 있는 것 같아."*
2. **검은 화면** — *"기존 로드 데이터를 삭제하고, NEW GAME으로 진입 시도했는데, 갑자기 검은 화면으로 랜더링되는 버그가 잡혔네. 한 번 전역 씬 전환 및 로그 확인하고, 코드 상 문제까지 전수검사해서 수정해놔줘."* (스크린샷: localhost:5173 전면 검정, 에러 표시 없음)
3. **무늬오징어 밸런스** — *"체장(cm)과 무게(g)에 따라 … 캡처사진 참고해서 적용 … 터무니없이 30cm가 안되는데 1kg가 넘는다거나 그렇게 설계되지 않도록"* (캡처: 전장 30cm·몸통 10cm = 400~500g / 전장 45cm·몸통 18cm = 1,200~1,300g)
4. **PLAN 가독성** — *"섹션별로는 잘 나눠놨는데, 띄워쓰기가 너무 안되어있어서 가독성이 너무 떨어져. … 기록할 때 skill로도 빼놔."*

## 2. 원인 / 실측

### 한치 아이콘 (확정)

사용자가 8/5에 `food assets/swordtip_squid.png`(194,229B)를 교체했으나 게임이 로드하는
`public/fish/swordtip_squid.png`는 7/22 구본(289,136B) 그대로 — MD5 불일치 확인.
`fish_swordtip_squid`는 PNG 직접 로드 방식이라 **복사만으로 반영**(asset-pipeline §⓪).

### 검은 화면 (사용자 케이스는 미재현 — 방어선 구축으로 대응)

재현 시도 4종 전부 정상 렌더(Playwright 실키입력·실렌더, pageerror 0):

| 경로 | 결과 |
|---|---|
| 세이브 전무 → NEW GAME 슬롯1 | 정상 (홈타운 렌더) |
| 새 게임 → ESC 타이틀 복귀 → 슬롯 삭제(마우스 2클릭) → NEW GAME 재진입 | 정상 |
| 세이브 보유 부팅(자동 로드) → 삭제 → NEW GAME | 정상 |
| 전환 중 Enter 연타 8회 · 타이틀 왕복 | 정상 |

코드 전수검사에서 **"에러 표시 없이 검게 멈추는" 잠복 결함 4건**을 확정:

| # | 결함 | 기전 |
|---|---|---|
| ① | WebGL 컨텍스트 유실 무대응 | GPU 부하·드라이버 리셋 시 캔버스가 JS 에러 0으로 검게 멈춤(씬은 활성). 사용자 증상(전면 검정·무에러·지속)과 가장 정합 — 당시 검증용 Chrome 다수 동시 실행 중이었음(추정 원인) |
| ② | `RegionFieldScene.create` 맵 JSON 캐시 미스 가드 없음 | 로드 실패 시 `this.mapData.cols`에서 TypeError → create 중단 → 검은 화면 (RegionFieldScene.ts:279) |
| ③ | 전역 런타임 예외 무표시 | 씬 create 중 예외 = 그리다 만 채 멈춤. 콘솔 안 열면 원인 인지 불가 |
| ④ | `MainMenuScene.quitGame` 소프트락 | `window.close()`는 스크립트가 안 연 탭에서 무시되는데 `isTransitioning`이 true로 남아 **메뉴 영구 잠김** (실측: 잠금 후 Enter/ESC/클릭 전부 무반응) |

측정 함정 1건: WebGL 캔버스 `drawImage` 픽셀 샘플은 `preserveDrawingBuffer=false`라 **항상 검정**
— 밝기 판정은 Playwright 스크린샷 버퍼를 브라우저 안에서 디코드해야 한다(초기 오판 1회).

### 무늬오징어 무게 (확정 — 기준 혼선)

무게 모델은 `W(g) = weightFactor × L³` 단일식(FishSpawningOracle.ts:72).
현재 squid는 **기준이 뒤섞여** 어느 해석으로도 실측과 어긋났다:

| 해석 | 계산 | 실측(캡처) | 판정 |
|---|---|---|---|
| 외투장 20cm (87차 dev 주석 기준) | 0.02·8000 = 160g | ≈1.5kg급 | ×9 과소 |
| 전장 45cm (오라클 밴드 기준) | 0.02·91125 = 1,823g | 1,200~1,300g | +46% 과대 |

## 3. 변경

### A. 검은 화면 방어 4종

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `client/src/game.ts` `installCrashGuards` | ① **WebGL 컨텍스트 유실 오버레이**(webglcontextlost → DOM 안내 + 클릭 새로고침, restored 시 자동 제거) ② **전역 에러 배너**(window error/unhandledrejection → 상단 1회 배너, 리소스 로드 실패 제외) |
| 수정 | `client/src/scenes/RegionFieldScene.ts` create | 맵 JSON 캐시 미스 시 안내 텍스트 + 2.2초 후 메인 메뉴 복귀. `bootFailed` 필드 신설 + `update()` 최상단 가드 |
| 수정 | `client/src/scenes/MainMenuScene.ts` quitGame | 안내 표시 2.6초 후 문구 제거 + `isTransitioning` 해제 (메뉴 재활성) |
| 수정 | `client/src/scenes/MainMenuScene.ts` 입력 4곳 | `isTransitioning` 중 행 클릭·Enter/Space·슬롯 선택(`onSlotPicked`)·삭제 버튼 차단 — 페이드 중 `startNewGameInSlot` 이중 실행 방지 |

### B. 무늬오징어 실측 정합

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `core/simulation/FishSpawningOracle.ts` squid | `weightFactor` 0.02 → **0.015** + **lengthCm = 전장 기준 명시**(두족류 외투장 관례의 예외 — 캡처 정합 주석) |
| 수정 | `client/src/store/InventoryStore.ts` dev 지급 | squid 밴드 20~40 → 22~42(전장) · wf 0.020 → 0.015, 주석에 예외 2종(무늬오징어·문어 = 전장) 명시 |
| 수정 | `core/db-schema/FishDatabase.ts` squid | `avgWeightRangeG` [300, 3000] → **[50, 500]**(avgSize 15~30cm 곡선 정합) · description "3kg 오버" → "전장 45cm급 1.2~1.3kg"(신 곡선 정합) |

### C. 에셋·문서

| 구분 | 위치 | 내용 |
|---|---|---|
| 교체 | `public/fish/swordtip_squid.png` | 신본 복사(568×472·테두리 투명 0/2080 검사 통과·MD5 일치). 직접 로드라 F5만으로 반영 |
| 재구성 | `.agents/IMPLEMENTATION_PLAN.md` | **3행 한 줄 8,183자 히스토리 블록 제거**(AGENTS §9 전부 중복 + 80차에서 멈춘 낡은 상태 → 87차 포인터 5줄) · "다음 착수"/"다음 작업 큐"/회썰기 아카이브의 blockquote 벽 → 목록+빈 줄 구조 · 457자 문단 목록화 |
| 신설 | `.claude/skills/doc-readability/SKILL.md` | 문서 가독성 규칙(빈 줄·줄 길이 상한·blockquote 제한·차수 요약 양식·자기 검사). CLAUDE.md 목록·AGENTS §4(11종→12종)·work-log 스킬 §4에 등록 |

## 4. 구조상 위치

- A = `씬 전환/부트` **렌더+판정 층** — 게임 로직 무변경, 실패 시 안내로 전환하는 방어선. 접점은 game.ts 팩토리 1곳 + 씬 2곳.
- B = `어종 DB` **데이터 층** — 무게식 자체(W=wf·L³)는 불변, squid 계수·주석·도감 값만. 판매가는 무게 경유라 자동 하향(재캘리브레이션 불필요).
- C = 문서/에셋 층 — 코드 무관.

## 5. 검증

### 자동 검증 6/6 PASS (`scratchpad/verify_fixes.cjs` — 실키입력·실렌더)

| 대상 | 결과 |
|---|---|
| quit: 안내 중 잠금 → 2.6s 후 해제 | mid=true → after=false |
| quit 복구 후 메뉴 동작 | '게임 시작' → start 뷰 진입 |
| NEW GAME 진입(연타 6회 포함) | 정상 렌더 (스크린샷 밝기 111) |
| 전역 에러 배너 | 합성 예외 → 배너에 메시지 노출 |
| 컨텍스트 유실 오버레이 | `WEBGL_lose_context.loseContext()` 실유실 → 오버레이 표시 (스크린샷) |
| 컨텍스트 복구 | `restoreContext()` → 오버레이 자동 제거 |

### 무게 곡선 (core dist 실행 수치)

| 전장 | 신 무게 | 목표(캡처) |
|---|---|---|
| 26cm(평균) | 264g | — (가을 에깅 평균대와 정합) |
| 30cm | 405g | 400~500g ✓ |
| 40.5cm | 996g | **1kg 돌파 하한 — "30cm 미만 1kg" 원천 불가** ✓ |
| 45cm(최대) | 1,367g | 1,200~1,300g (+8% 대물 마진) ✓ |

재현 절차(회귀): `node scratchpad/verify_fixes.cjs` (dev 서버 5173 필요) — 검은 화면 재현 하네스 4종은
`repro_newgame/fullloop/bootload/sweep.cjs`.

## 6. 잔여

| 항목 | 왜 | 착수 조건 |
|---|---|---|
| 사용자 검은 화면 **원인 확정** | 입력 경로 4종 재현 실패 — 컨텍스트 유실(추정)은 환경 의존이라 원격 확정 불가 | **재발 시** — 이제 오버레이/배너가 원인을 화면에 자가 보고한다. 문구를 캡처해 주면 확정 |
| 한치·갑오징어·문어 무게 곡선 실측 정합 | 사용자 캡처가 무늬오징어만 | 종별 실측 캡처 제공 시 (한치는 79차 사용자 확정값이라 보류) |
| 구세이브의 기존 dev 무늬오징어 | 이미 지급된 개체는 구 무게 유지(재계산 안 함) | 새 게임/재지급부터 신 곡선 |

## 7. 위험·부작용

- `installCrashGuards`의 전역 error 리스너는 **표시만** 한다(예외를 삼키지 않음) — Vite dev 오버레이·콘솔 로그와 공존.
- quitGame 2.6초 잠금 해제는 "종료 안내 중 재클릭" 방지를 유지하면서 풀리는 구조 — 종료 의사가 진심이면 탭을 닫는다.
- squid 무게 하향으로 **판매가·수율(g)이 함께 하향**된다(의도 — 실측 정합). 87차 검증 로그의 "몸통 순살 362g"류 수치는 재기준.
- `bootFailed` 가드는 정상 경로에서 항상 false — create 정상 완료 시 오버헤드 없음.

## 8. 후속 반영

- [x] `02-SYSTEMS/world-field.md` §6 함정 (컨텍스트 유실·mapData 가드)
- [x] `02-SYSTEMS/economy-data.md` §6 함정 (두족류 길이 기준 예외)
- [x] `04-BACKLOG.md`
- [x] `03-WORKLOG/README.md` 인덱스
- [x] `AGENTS.md` §9 요약
- [x] `IMPLEMENTATION_PLAN.md` 직전 완료
