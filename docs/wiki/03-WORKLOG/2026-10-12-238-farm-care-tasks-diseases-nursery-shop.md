# 238차 (2026-10-12) — 텃밭 관리 작업(작업 장면) · 병해 3종 · 육묘 트레이 · 종묘사 · 풋고추/홍고추

> 상태 ✅ 완결 · 시스템 [S8 홈베이스](../02-SYSTEMS/home-base.md)
> 관련 [236](2026-10-09-236-surf-tutorial-farm-plots-rent-power-mushroom-kamis.md) · [237](2026-10-11-237-farm-intro-quests-crop-tiers-organic-cert.md)

## 1. 배경

사용자 제안(2026-10-12 원문 요지):

> 농사 작물의 '까다로움(difficulty)'을 인게임 내에서 상호작용(단순 '~~하기' 클릭 등 흔히 말하는 딸깍)이 아닌, 실제 동작(action)을 모방한
> 미니게임 혹은 단순 상호작용이어도 좋으니 과정을 UI로 보여준다거나, 시간을 소모한다던가 하는 방식으로 표현할 수 없을까?

고추를 본보기로 여섯 단계(파종 · 발아 → 육묘 · 가식 → 정식 → 초기 생장 · 방아다리 → 개화 · 착과 · 추비 · 방제 → 수확 · 마감)를 주셨다.
함께 요구한 것:

- ① 모종을 사는 실제 경로(종묘사 · 화원 · 육묘장을 지도에서 찾을 것)
- ② 지지대 · 노끈을 사거나 만들어 1~2회 설치(횟수는 내 판단)
- ③ 활착기 물 · 방아다리 첫 꽃 · 곁순
- ④ 비료 · 농약 · 병해(역병 · 탄저병 · 바이러스병)를 실제처럼 — 안 쓰면 병에 약해지되 **아예 없어도 수확은 되게**, 세 병이 다 들면 한 개 날까 말까
- ⑤ 풋고추 · 홍고추 분할 수확과 검붉은 색 ⑥ 포기당 평균 수량에서 랜덤 ⑦ 작물 표 보고

새 작물(참외 · 수박 · 블루베리 · 토마토 · 고구마)과 개량종은 **다음 차수**로 대기(사용자 지시).

## 2. 원인 · 판단

- 237차까지 텃밭은 심고(딸깍) · 물 주고 · 거두기뿐이었다 — 난이도는 「열리는 순서」(레벨 · 자격)에만 반영됐고 재배 과정은 없었다.
- 설계 결정:
  - **작업(chore) 표** — 작물마다 할 일을 심은 날 기준 **차례**로 연다(처음 창 · 이후 간격). 놓치면 자동으로 넘어가고 벌을 준다.
    방제는 차례가 아니라 **철(5~9월) + 보호가 끝났는가**로 「할 일」 — 안 쳐도 벌은 없다(벌 = 병).
    걷어 내기는 병이 있을 때만.
  - **작업 장면** — 작업 종류 6가지(누르기 · 차례로 박기 · 타이밍 묶기 · 누르고 있다 띠에서 떼기 · 뿌리기 · 트레이 옮기기)로 손놀림을 흉내 낸다.
    **걸리는 시간(초 · 벽시계)** 이 다 차야 끝난다 — 「시간을 소모」. 서툴면(실수 · 타이밍) 효과 절반.
  - **지주 1회 + 유인줄 2회**(사용자가 맡긴 판단 — 심은 즉시 지주, 자라는 대로 25일 · 50일 유인). 지주를 안 세우면 젖은 날 25%로 쓰러진다(수확 ×0.75).
  - **병 3종**은 하루 한 번 결정적 해시로 든다(철 · 비 뒤 하루 ×2 · 멀칭 ×0.6/0.7 · 하우스 · 곁순 안 땀 ×1.3 · 약 보호 · 방제 스킬).
    역병은 **섬(포기 수)** 을 깎고(바닥 0.25), 탄저 · 바이러스는 거둘 때 수량을 깎는다(최대 60% · 50%).
    세 병이 다 번지면 25개 → 1개.
  - **웃거름 안 주면 0.7배**(작물 DB 수량은 제대로 관리한 밭의 값 — 2024 소득조사). 첫 꽃 · 곁순 · 유인을 거르면 0.92~0.95씩.
  - **육묘 트레이** — 고추 씨앗은 밭에 바로 못 뿌린다. 2~3월 집 안 선반 트레이에 뿌려 75일 기르면 모종 20~30포기(가식을 거르면 0.6배).
    모종은 **늦서리(4월 10~24일 · 해마다 결정적) 뒤** 4월 하순~5월 상순에만 옮겨 심는다(실황 기온 10℃ 밑이면 4월에도 막힘).
  - **가을 첫서리**(10월 25일~11월 13일)를 맞으면 더 자라지 않고 사흘 안에 거두면 끝 — 안 거두면 칸이 빈다. 하우스는 예외.
  - **검붉은 고추** — 익은 뒤 4일까지 풋고추 · 10일까지 검붉게 · 그 뒤 홍고추. 검붉은 채로 거두면 홍고추로 치되 품질 −0.12.
  - **종묘사** — 식자재마트의 모종 · 종구 · 배지를 옮기고 농자재 9종(트레이 · 지주대 · 유인끈 · 멀칭 비닐 · 복합비료 · 살균제 · 아인산 · 칼슘액비 · 살충제)을
    판다. 실제 가게 위치는 **확인하지 못했다**(컨테이너가 네이버 · 카카오 · 공공데이터 포털에 닿지 않는다) —
    중앙시장 청과골목 남쪽에 게임 상호 「설악종묘사」로 두었다(§6).
- 다른 작물은 까다로운 점에서 표를 뽑는다(`carePlanOf`): 지주(`support`) · 열매 작물 병해(`pests`) · 웃거름(열매 · 긴 작물 — 겨울나기 · 여러해살이 제외).
  잎 · 뿌리 작물의 벌레는 235차 품질 깎임 그대로.

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | `packages/core/src/db-schema/CropCareDatabase.ts` | 작업 정의(13종) · 고추 표 · 육묘 표 · 병 이름 · 증상 · 막는 법 · 농자재 id · `carePlanOf` · `carePlanSummaryKo` |
| 신설 | `packages/core/src/simulation/CropCareSim.ts` | 차례 상태 `careStatusList` · `doCare` · 놓침 `skipExpiredRounds` · 병 발생 · 번짐 · 쓰러짐 · 서리 `dailyCare` · 활착 `establishHour` · `diseaseYieldMult` · `ripeStageOf` · `frostBlockKo` · `CARE_TUNING` |
| 신설 | `packages/core/src/simulation/CropCareSim.test.ts` | 18건(표 · 자재 · 육묘 · 늦서리 · 첫서리 · 차례 · 서툼 · 웃거름 0.7 · 활착 · 병 · 세 병 → 1개 · 걷어 내기 · 익는 단계) |
| 수정 | `packages/core/src/types/Farming.ts` | `CropDisease` · `CareTaskId` · `CareWorkKind` · `CareTaskDef` · `CropCarePlan` · `CropStart.nursery` · `ripenTo.turningDays` · 칸 상태(`care` · `diseases` · `protect` · `lodged` · `frostedAt` · `careYield` · `nursery` · `wetH`) · `FarmPlantCtx.hasTray/tempC` · 수확 결과(`seedling` · `careMult` · `diseaseMult` · `turning` · `frosted`) |
| 수정 | `packages/core/src/simulation/FarmSim.ts` | 시간마다 활착 · 젖음, 날마다 `dailyCare`(표 있는 작물은 235 벌레 대신), 서리 뒤 72h 비움, `canPlant` 트레이 · 늦서리, `harvestCell` 모종 · 병 · 관리 · 검붉은 · 서리, `harvestPreview`, `cellReady` ε |
| 수정 | `packages/core/src/db-schema/CropDatabase.ts` | 고추 씨앗 → 트레이 파종(2~3월 · 75일 · 모종 20~30) · 모종 4~5월 · `turningDays 4` · 농자재 9종(`shop: 'nursery'` · `icon`) |
| 수정 | `packages/core/src/types/Story.ts` · `index.ts` | `farmAction: 'care'` · 새 심볼 export |
| 수정 | `packages/core/src/simulation/FarmSim.test.ts` | 고추 모종 철 3월 → 4~5월 |
| 신설 | `packages/client-pc/src/ui/FarmWorkPanel.ts` | 작업 장면(6종 손놀림 · 벽시계 시간 · 점수 · 가이드 `farm_work` · `devFinish` · `devSkipTime`) |
| 수정 | `packages/client-pc/src/ui/FarmPanel.ts` | 단계 · 익음 · 포기당 · 병(아이콘 · 심한 정도 · 막는 법) · 쓰러짐 · 활착기 · 할 일 단추(자재 모자라면 흐림 + 사유) · 다음 할 일 · 격자 병 표식 · 서리 막 · 육묘 칸 · 높이 580 |
| 수정 | `packages/client-pc/src/store/FarmStore.ts` | `careRows` · `careCheck` · `doCare`(자재 소모 · 품 · 이야기 이벤트) · `establishment` · `diseases` · 알림 `takeNotices` · `hasTray/tempC` · 모종 거두기(등급 꼬리 없음 · 횟수에 안 셈) · 수확 문구 |
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` · `HomeInteriorScene.ts` | 작업 장면 팝업 · 20초마다 텃밭 굴려 알림(첫 줄 떠오름 · 나머지 로그) · POI `garden_centre/florist/agrarian/farm` → `nursery` · 건물 · 간판 · 네온 · 미니맵 아이콘 |
| 수정 | `packages/client-pc/src/data/ShopCatalog.ts` · `CropItems.ts` · `InteriorLayouts.ts` · `ui/FullMapPanel.ts` | `BuildingKind 'nursery'`(종묘사 · 8~19시) · `nurseryFarmEntries`(씨앗 · 모종 · 종구 · 배지 · 자재) · 마트 모종 제거 · 가게 안 · 범례 |
| 수정 | `packages/client-pc/src/ui/ItemDetailPanel.ts` | 「손이 가는 일」 줄 · 트레이 씨앗 줄(심는 곳 · 모종까지 · 거두는 것) |
| 수정 | `packages/client-pc/src/data/HelpContent.ts` | 텃밭 항목 3개 신설(손이 가는 일 · 병해 3종 · 육묘 · 종묘사 · 풋/홍고추) · 가게 9종 · 모종 = 종묘사 |
| 수정 | `packages/client-pc/src/i18n/en_farm.ts` · `en.ts` | 사전 60여 줄 + 규칙 20여 개(차례 · 할 때 · 병 · 모종 · 서리 · 수확 문구 · 요약) · 가게 이름 |
| 수정 | `tools/gen_pixel_icons.py` → `data/PixelIconArt.ts` | 아이콘 13종(자재 9 · 병 표식 3 · 미니맵 종묘사) |
| 수정 | `pixelazed/sokcho_v2/capture_pois.json` · `tools/merge_capture_pois.py` · `pois.json` ×2 | 분류 `S`(종묘사 = `shop/garden_centre`) · 「설악종묘사」(tx 380 · ty 294 · osmId −83067) |

## 4. 구조상 위치

`S8 홈베이스 → 텃밭(E1) → 관리 작업 · 병해 · 육묘 · 종묘사`.
계약(`Farming.ts`) · 데이터(`CropCareDatabase` · `CropDatabase`) · 판정(`CropCareSim` · `FarmSim`) · 렌더(`FarmPanel` · `FarmWorkPanel` · 가게 · POI) 네 층 모두.
세이브는 칸 상태에 필드가 **더해지기만** 한다(구세이브는 `undefined` → 표가 있어도 심은 날부터 차례를 센다 —
이미 자라던 고추는 놓친 차례가 쌓여 수확이 준다. 다시 심으면 정상).

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| core | vitest | **164/164**(새 18건) |
| 빌드 · 타입 | `pnpm run build` · typecheck | 3/3 · 0 오류 |
| 지주 세우기 | 실마우스 — 둘째를 먼저 눌러 실수 → 차례대로 3개 → 10초 대기 | 끝나며 `care.stake.done 1` · 지주대 9 → 6 · 끈 4 → 3 · 피로 +6 · 할 일에서 사라짐 |
| 곁순 따기 | 줄기(빈 곳) 한 번 실수 → 9개 모두 | 점수 0.85 · 「곁순 따기 (1/2) — 했다」 |
| 웃거름 · 걷어 내기 · 가식 | 장면 열기 → `devFinish`/실클릭 6 | 비료 6 → 5 · 탄저 0.5 → 0.1 · 가식 뒤 모종 20포기 거둠 |
| 약 치기(hold) · 유인(tie) | 직접 연 장면 — 게이지 띠 · 위상 맞춤 | 1/2 · 3/4 → 점수 0.5 · 0.75로 끝남(헤드리스 프레임 300ms 때문 — 실브라우저는 60fps) |
| 검붉은 고추 | 익은 뒤 6일 · 탄저 0.1 | 「홍고추 · 보통 2개 — 검붉게 덜 익은 것이라 품질이 떨어진다」 |
| 알림 | 2 · 20 · 70 · 30일 전 심은 칸 | 할 일 7줄 · 탄저 · 역병 · 쓰러짐 3줄 |
| 종묘사 | `openShop('nursery')` · 마트 | 48종(모종 · 종구 8 · 씨앗 31 · 자재 9) · 마트 농사 품목 0 |
| POI | 속초 `buildings` · 미니맵 | `nursery` 1(설악종묘사 · `gangwon_sokcho:osm:-83067`) · `mm_nursery` 1 |
| 영어 | 107 문장 | 107/107 |
| 화면 오류 | pageerror | 0(404는 236 KAMIS 스냅샷 — 사용자 병합 대기, 기존) |

스크린샷: `scratchpad/shots/238_*.png`(칸 자세히 4 · 작업 장면 7 · 육묘 · 가게 · POI).

## 6. 잔여 — 이번에 안 한 것

- **실제 종묘사 위치** — 네이버 · 카카오 · 공공데이터(전국농약및비료판매업체표준데이터 data.go.kr 15139234)에 닿지 못했다.
  사용자가 캡처로 찾아 주면 `capture_pois.json`의 「설악종묘사」 위경도를 바꾸고 `merge_capture_pois.py`를 돌린다(상호는 게임 상호).
- **새 작물 · 개량종**(참외 · 수박 · 블루베리 · 토마토 · 고구마 · 스테비아 토마토 · 호박고구마 · 청양고추) — 사용자 지시로 다음 차수.
- 겨울나기 · 여러해살이 작물의 웃거름은 **철 기준 차례**(이른 봄)가 필요해 넣지 않았다(심은 날 기준이면 휴면과 어긋나 놓침이 영영 남는다).
- 잎 · 뿌리 작물의 벌레(벼룩잎벌레 · 배추좀나방)는 235차 품질 깎임 그대로 — 살충제 작업으로 바꾸려면 「벌레」 상태가 따로 필요하다.
- 작업 장면은 절차 그래픽(줄기 · 잎 · 열매 사각) — 작물별 그림 · 손 그림 · 효과음은 에셋 트랙.
- 방제 자재 값(칸 한 번 분 400~800원)은 게임 값 — 한 작기 다 하면 약 2만 원 vs 고추 한 칸 수입 약 3만 원. 체감 뒤 조율.
- 트레이 파종은 고추만 — 배추 · 부추 · 곤드레 · 당귀는 바로 뿌리기 그대로(백로그).

## 7. 위험 · 부작용

- **구세이브의 자라던 고추 · 토마토 · 가지 · 오이**는 로드 직후 날마다 놓친 차례가 한꺼번에 넘어가 `careYield`가 준다
  (최대 0.7 × 0.92 × 0.95² × 0.95² ≈ 0.57). 의도(관리 안 한 밭)지만 체감이 거칠면 `plantedAt`이 238 이전인 칸은 벌을 면제하는 백필을 넣는다.
- 병 발생은 결정적 해시(날 · 심은 시각 · 칸 · 작물) — 같은 세이브는 같은 날 같은 병. 세이브 복원 · 시험에 유리하고 되돌리기(세이브 로드)로 피할 수는 없다.
- `FarmWorkPanel`은 벽시계(`performance.now`) — 백그라운드 탭에서도 시간이 흐른다(의도 — 「일에는 시간이 든다」).
  Phaser delta로 세면 헤드리스 · 백그라운드에서 10초가 몇 분이 된다.
- `careDue`가 20초마다 모든 칸을 다시 센다(구획 7 × 12칸 × 작업 11) — 가볍다(수백 μs).
- 식자재마트에서 모종이 사라졌다 — 237차 하네스 `r237b.cjs` 「마트 모종 진열」 검사는 종묘사로 바꿔야 한다. 정옥선 선물(N19-7)은 가방에 바로 주므로 무관.

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 `03-WORKLOG/README.md`
- [x] 시스템 페이지 `02-SYSTEMS/home-base.md` §2 · §4 · §5 · §6
- [x] `04-BACKLOG.md` BN(238 잔여)
- [x] `.agents/AGENTS.md` §9 · `.agents/IMPLEMENTATION_PLAN.md` · `CLAUDE.md` · `docs/wiki/README.md`
