# 301차 — 독도 도로 정리(토막 · 차량 예산) · 전 지역 도로 감사 · 전갱이 · 삼치 손질 · 채비 침강(떠오르지 않음) · 칼 판매처 · 생선 값 바닥

| | |
|---|---|
| **날짜** | 2026-11-05 |
| **시스템** | `필드` `낚시` `손질` `인벤` `경제` `데이터` `배포` |
| **트리거** | 사용자 리포트(독도 캡처) + 지시(전갱이 · 삼치) + 피드백 셋(침강 · 칼 · 생선 값) |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` (해시는 §8) |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 시험 514 · 하네스 r301 16/16 · pageerror 0 |

---

## 1. 배경 — 왜 했나

사용자 지시 · 리포트 원문.

- 독도 캡처: 「차선/차량 수 통제/ 도로와 다른 타일들/해안선과 육로의 경계가 완전 뒤섞여있어서 엄청 지저분하고 버그가 많이 생길 우려가 크고 …
  뭘 표현/표시하고 싶었는 지 도무지 이해할 수가 없는 장면이야. 깔끔하게 수정하고, 다른 지역에서도 … 전수조사 & 수정해줘.」
- 「전갱이와 삼치 또한 방어류 회뜨기로 우선 적용시켜줘.」 · 「위 작업 이후 main반영 & 재배포 진행해줘.」
- 피드백 1(침강): 「캐스팅 후 오른쪽 위 채비침강이 중간중간에 위로 떠오름 … 아무리 3g짜리 봉돌이라 하더라도 물에 던지면 잠길 수 밖에 없는데 …
  봉돌 무게에 따라 침강 속도가 빠르냐 느리냐가 구분되는 것이지 봉돌무게가 가볍다고해서 전체 채비가 부상해버리는 건 말이안됨.
  … 전체 물리를 리얼월드와 교차 검증」.
- 피드백 2(칼): 「기본칼 혹은 손질도구가 없어서 퀘스트 진행이 안됌(모든 편의점, 상점에 현재 팔고 있지 않음) …
  편의점에 야나기바 정도의 고퀄리티 칼은 없지만 회칼(사시미칼)은 실제로 파는 곳들이 많이 있었음. 또한 사이소에도 저급~중급 야나기바가 있는 걸 실제로 확인
  … 생초보를 위한 기본 채비 물품들도 있었음」.
- 피드백 3(값): 「생선 가격이 너무 낮음...(꽁치 및 학꽁치 기준:거의 100원) … 실제는 마리당 1~2천원은 되어야함. 원물가의 출처를 다시확인할것.」

## 2. 원인 — 무엇이 문제였나

**독도(확정 — `tools/audit_roads.mjs` 실측 · 스크린샷 `scratchpad/r301/before`)**

- 독도 `roads.json`은 접안시설 `service` 셋(합 34타일 = 170m)뿐인데 `RegionFieldScene`이 지역마다 **차량 36대를 고정**으로 내보냈다
  (`new TrafficSystem(…, 36, …)` 두 곳). 36대가 170m 안에서 겹쳐 돌고 주차 차량 패스까지 그 옆에 차를 세웠다.
- 그 service 토막 하나는 테트라포드(`b`) 위로 그어져 있어 `SeamlessChunks.drawRoadBands`가 **보도 + 연석 + 아스팔트 띠**를 방파제 위에 그렸다 —
  「해안선과 육로의 경계가 뒤섞인」 그림의 정체.
- 전수 감사(15 지역): 지도 안쪽 고립 토막은 **독도(service 3) · 여수(track 22.6타일 @321,510 + service 다섯 @330,325)** 뿐.
  바다 · 방파제 위 도로는 포항 구룡포 안벽 service 7 · 제주시 unclassified 2 · 울릉 도동 방파제 residential 1(모두 간선에 이어진 실제 길 — 스크린샷으로 둠) · 독도 2.

**침강(확정 — 코드 · core 시험)**

- `FirstPersonFishingScene` 스윕 가지가 `baitZ = max(0.2, baitZ − 0.5·dt)` — 조류를 못 뚫으면 채비를 **0.5m/s로 수면 0.2m까지 끌어올렸다**.
  조류 세기가 스윕각(72°) 경계에서 흔들리면 「가라앉다 → 떠오르다」를 되풀이해 HUD 수심이 중간중간 위로 튀었다(리포트 그대로). 물에 없는 부력이다.
- 틀렸던 가설: 「원줄이 플로팅이라 떠오른다」 — 찌 채비 `stepUnderwater`는 `net = max(0, W − B)`라 수직 상승이 없다(시험으로 확인). 범인은 루어 · 봉돌 가지였다.

**칼(확정 — `BUILDING_HOURS` · 카탈로그)**

- 칼 세 자루는 **식자재마트(`mart` · 10~22시)에만** 있었다. 편의점 · 사이소 · 낚시용품점은 24시간이지만 칼이 없어, 밤에 「부엌의 순서」(M1-07 `butcher` 1)가 막혔다.

**값(확정 — 사슬 계산 · 하네스)**

- 꽁치 25cm = 49g(LWR `0.0012 × L^3.3`) × kg 5,000원 × 등급 0.85(400g 미만) × 크기 1.21 = **252원** → 상점 6할 = 151원 → Mock 시세 흔들림(0.75) · 「보통」 등급 0.9면 **120원**. 학꽁치 28cm = 38g도 같은 길.
- kg 5,000원은 원양 **냉동** 꽁치(대만 · 일본산 경락) 밴드다. 국내 냉동 도매(중품) 9kg 75,000원 ≈ 8,300원/kg(Tridge 2025-04) · 생물 산지 위판 6,000~12,000원/kg(가을 주문진 · 구룡포 — 2025 어획 40% 증가로 하락).
  학꽁치는 급냉 1kg 소매 13,900원(쿠팡 통영 · 거제산) — kg 14,000은 그대로 두고 마리 값은 바닥이 받친다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/src/rules/RoadNetwork.ts`](../../../packages/core/src/rules/RoadNetwork.ts) | `pruneRoads`(지도 안쪽 간선 없는 토막 < 40타일 · 지도 안 표본 ≥ 50% 바다) · `vehicleBudget`(간선 300타일 미만 0 · 150타일당 1 · 상한 36) · `isUndrivableRoadClass`(track · construction) · `roadComponents` |
| 신설 | `core/src/rules/RoadNetwork301.test.ts` · `core/src/simulation/FishPrice301.test.ts` | 도로 8 · 값 · 침강 7 시험(실데이터 독도 0 · 속초 36 포함) |
| 신설 | [`tools/audit_roads.mjs`](../../../tools/audit_roads.mjs) | 15 지역 도로망 감사 표(성분 · 간선 · 토막 · 물가 · 차량 예산 · 먼 보도) |
| 수정 | [`RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `fieldRoads()` = `pruneRoads(regionRoads, terrain)` — 청크 · 교통 · 편집 확정 세 곳 · 차량 수 = `vehicleBudget` · `noVehicles` |
| 수정 | [`SeamlessChunks.ts`](../../../packages/client-pc/src/scenes/SeamlessChunks.ts) | cfg `noVehicles` — 노상 · 주차장 차량 두 패스 생략 |
| 수정 | [`TrafficSystem.ts`](../../../packages/client-pc/src/scenes/TrafficSystem.ts) | `drivable`에서 track · construction 제외 |
| 수정 | [`ButcheryProfiles.ts`](../../../packages/core/src/db-schema/ButcheryProfiles.ts) · `PixelButcherFish.ts` · `ButcheryPanel.ts` · `InventoryStore.ts` | 전갱이 · 삼치 → `BUTCHERY_IMPLEMENTED_SPECIES` · `AMBERJACK_SPECIES` · 이름 폴백 「삼치」 · dev 생선 둘 · 안내 글 · 도움말(한 · 영) |
| 수정 | [`tuning.ts`](../../../packages/core/src/config/tuning.ts) · [`UnderwaterSinkPhysics.ts`](../../../packages/core/src/simulation/UnderwaterSinkPhysics.ts) | `sink.sweptHysteresisDeg` 6 · `computeSinkRate(…, prevSwept)` — 쓸리던 채비는 스윕각 − 6° 아래에서 풀림 · 실세계 대조 주석 |
| 수정 | [`FirstPersonFishingScene.ts`](../../../packages/client-pc/src/scenes/FirstPersonFishingScene.ts) | 스윕 가지 = 잔류 침강(`sinkRateMps`) + 하류 쓸림 · **상승 삭제** · HUD 「라인각 N° 쓸림」(실제 각) · `en.ts` 규칙 |
| 수정 | [`KnifeDatabase.ts`](../../../packages/core/src/db-schema/KnifeDatabase.ts) | `knife_yanagiba_basic` 야나기바 (보급형) — tier yanagiba · 수율 1.05 · 두께 1.15 |
| 수정 | [`ShopCatalog.ts`](../../../packages/client-pc/src/data/ShopCatalog.ts) | 칼 정의 `KNIFE_*` 하나 · 편의점 = 막칼 · 회칼 · 사이소 = 보급형(65,000) · 장인 야나기바 + `SAISO_BASIC_RIG` 7(목줄 2호 · 감성돔 바늘 · 고리 · 구멍봉돌 3호 · 좁쌀봉돌 · 핀 도래 · 구멍찌 0.8호 — 직판장과 같은 객체) · 도움말 · `en_items` |
| 수정 | [`Economy.ts`](../../../packages/core/src/types/Economy.ts) · [`MarketPriceEvaluator.ts`](../../../packages/core/src/simulation/MarketPriceEvaluator.ts) · `InventoryStore.ts` | 꽁치 kg 5,000 → 8,000(근거 주석) · `minPieceKrw` · `FISH_PIECE_FLOOR_KRW` 1,000 · `fishPieceFloorKrw` — core 마리 값 바닥 · 가방 판매 사슬은 상점 6할 뒤 `바닥 × 상태 배율`을 다시 깐다 |
| 삭제 | FP 씬 스윕 상승 `max(0.2, baitZ − 0.5·dt)` | 물리에 없는 부력(§2) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- `필드 → 심리스 도로 · 교통 → 그릴 · 달릴 도로 고르기` — **판정 층**(core 규칙) + 렌더 입구(씬이 넘기는 목록). 데이터(`roads.json` · 편집기 `regionRoads`)는 그대로.
- `낚시 → 1인칭 드리프트 → 루어 · 봉돌 침강` — core 판정(`computeSinkRate`) + 씬 적분 한 가지.
- `손질 → B1 어류 → 방어류 흐름` — 가족 집합 둘 + 이름 폴백(데이터 층).
- `인벤 · 상점 → 카탈로그` — 데이터 층(같은 객체를 여러 가게가 나눠 씀).
- `경제 → 어획물 판매가` — core 계약(`AuctionMappingDef.minPieceKrw`) + 판정(`evaluateFishSellPrice`) + 가방 사슬.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 도로 규칙 | core 시험 `RoadNetwork301`(성분 · 토막 · 가장자리 보존 · 바다 · 지형 없음 · 예산 · 실데이터) | 8/8 — 독도 3 → 0 · 속초 821 → 97% 넘게 유지 · 예산 36 |
| 독도 화면 | 하네스 r301 + `shot_region.cjs dokdo` 3컷(`scratchpad/r301/after`) | 차 0 · 그리는 도로 0 · `noVehicles` · 방파제 위 띠 없음 · pageerror 0 |
| 속초 · 여수 | r301 · `shot_region.cjs jeonnam_yeosu` @321,510 · @330,325 | 속초 차 36 · 도로 827(고가 분할) · 여수 농로 토막 띠 사라짐 · 차 36 |
| 손질 가족 | r301 — `getButcheryFamily` · `butcherFamilyOf` · 안내 글 | 전갱이 · 삼치 finfish · amberjack · 꽁치 unsupported |
| 침강 물리 | core 시험 `FishPrice301`(종단속도 밴드 · 어느 조류에서도 > 0 · 히스테리시스 · 찌 채비 비상승) + r301 | 3g 0.67 · 11g 1.13 · 75g 2.43 m/s · 최소 0.03 · 0.2m/s 3g 처음 안 쓸림 → 쓸리던 중이면 쓸림 |
| 칼 · 채비 | r301 — 카탈로그 id · 그림 · 도구 · 값 · 낚시용품점 getter · 영어 | 편의점 2 · 사이소 2 + 7 · 마트 4 그대로 · `Yanagiba (Basic)` |
| 생선 값 | core 시험 + r301 실 스토어(`__INV.getSellPrice` · `getMarketValue`) | 꽁치 25cm 상점 1,000 · 시세 1,000 · 45cm 상점 3,308 · 보통 500 · 학꽁치 28cm 1,000 · kg 환산 전 종 > 1,000 |
| 전체 | `npx pnpm run build` · 루트 typecheck · core 시험 | 3/3 · 4/4 · 514(+15) |

재현: `node tools/audit_roads.mjs --verbose dokdo yeosu_city` → 토막 목록. `node scratchpad/r301.cjs`(dev 5173).

**실세계 대조표(침강)** — 모델 값은 `computeSinkRate(0, g, 'sinker')`.

| 봉돌 | 모델 종단속도 | 실세계 어림 | 근거 |
|---|---|---|---|
| 3g(약 1호) | 0.67 m/s | 0.6~0.8 | 납 구 하나는 1.5 m/s지만 3호 나일론(Ø0.285mm) 10m 표면 마찰 `0.5·ρ·Cf(0.01)·π·d·L·v²` ≈ 수중 무게 0.027N → 0.78 |
| 11g(3호) | 1.13 m/s | 1.0~1.3 | 같은 식 · 무게 3.7배 |
| 75g(20호) | 2.43 m/s | 2.0~2.6 | 상한 `vTermMax` 2.6 |
| 3g · 조류 0.2m/s | 쓸림(잔류 0.03) | 줄 20m 횡저항 `0.5·ρ·1.2·d·L·v²` ≈ 0.14N = 수중 무게 5배 | 가라앉기는 하되 하류로 끌린다 — **떠오르지는 않는다** |

## 6. 잔여 — 이번에 안 한 것

- **방파제 · 안벽 위 실제 길**(구룡포 service 7 · 울릉 도동 residential · 제주시 2)은 간선에 이어져 있어 뒀다 — 띠 그림이 거슬리면 「`b` 위 구간은 띠 없이 선만」 규칙(백로그 DH).
- **가로등**은 방파제 데크 끝에 그대로 선다(독도 캡처의 가로등 셋) — 사용자 확인 뒤.
- 침강 **실플레이 조율** — 히스테리시스 6° · 잔류 0.03 m/s는 F8 `sink.*`로 조율(라이브). 스윕 중 수심 HUD가 거의 멈추는 것이 맞는 그림인지 사용자 확인.
- 전갱이(15cm 이상) · 삼치(40cm 이상)는 **잿방어 형태 도마 스프라이트**로 선다(실사 온마리 없음 · 300 D 고등어와 같음) — 전용 그림은 에셋 뒤.
- 꽁치 밖 소형 종 kg 단가(눈퉁멸 3,000 · 도루묵 6,000 · 복섬 5,000)는 바닥(1,000)이 받친다 — 표 전수 재조사는 KAMIS · 수협 시세 연동 때.
- 보급형 야나기바 그림은 장인 야나기바와 같은 그림(`art_knife_yanagiba`) — 전용 그림은 Gemini 한 장(백로그 DH).

## 7. 위험·부작용

- `pruneRoads`가 **지도 안쪽 짧은 service 묶음**을 지운다 — 가게 진입로가 간선에 안 이어진 지역이면 그 길의 띠 · 차가 사라진다(걷기 칸 `r`은 그대로). 15 지역 감사에서는 독도 · 여수 토막뿐.
- 편집기(F7) 도로 툴: 저장은 원본 `regionRoads`라 영향 없음. 그러나 **토막을 새로 그리면 화면에 안 보인다**(규칙이 뺀다) — 간선에 잇거나 40타일을 넘겨야 보인다.
- 차량 예산이 간선 길이에 묶여 **작은 지역(간선 300~600타일)은 2~4대**다 — 북적임이 줄어 보이면 `VEHICLE_BUDGET.tilesPerCar`.
- 한 마리 바닥 1,000원은 **모든 식용 어획물**에 깔린다(상점 6할 뒤 · 상태 배율) — 자리돔(13cm)처럼 작은 종이 묶음 값보다 비싸질 수 있다(`minPieceKrw`로 종별 조정).
- 스윕 히스테리시스는 `prevSwept`를 넘기는 호출(FP 씬)에서만 켜진다 — 다른 호출(없음)은 종전 판정.

## 8. 후속 반영

- [x] 시스템 페이지 `world-field` · `fishing-loop` · `butchery` · `economy-data` · `inventory-equipment` §4 · §5 · §6
- [x] `04-BACKLOG.md` DH
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` §2-3 · §3 · `CLAUDE.md`
- [x] 아티팩트 4개 — 남은 과업 설계 Version 50 · 구현 라이브러리 49 · 채비 모딩 순서도 43(「301차 기준」 줄) · 위키 102 (판 번호는 발행 뒤 확정 — CLAUDE.md 「타일맵 · 배포」 절이 정본)
- [ ] 커밋 · 푸시 · main 빨리 감기 · 105차 배포 — 해시는 CLAUDE.md 「타일맵 · 배포」 절
