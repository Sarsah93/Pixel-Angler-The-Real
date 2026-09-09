# 121차 — 인-맵 채집(해루질) · 어촌계 어장 실폴리곤 · 강원 조례 · 통발 아이템 설치/수거

| | |
|---|---|
| **날짜** | 2026-09-09 |
| **시스템** | `해루질·통발` `필드` `인벤` `경제` `UI` `i18n` `데이터` |
| **트리거** | 로드맵(S14 D2) 착수 + 사용자 지시("실제로 해루질 및 해산물 채집이 가능한 리얼 요소를 현재 구현된 맵 내에 발현") |
| **커밋** | 미커밋 (커밋 대기) |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

S14(해루질·통발) 다음 대과제 1순위인 **D2 배선**을 시작하려던 참에 사용자가 방향을 재정의했다:

> "웹 검색 등을 통해, 실제로 해루질 및 해산물 채집이 가능한 리얼미터 요소들을 현재 구현된 맵 내에
> 발현하는 게 가장 중요한 목적이야. (추상적으로 요구사항을 제시하지만, 최대한 의견을 물어보면서 진행할 것)"

코드 실상은 해루질·통발이 **레거시 FieldScene에서만 열리는 별도 씬(이모지 클릭)** 이라, D2 배선만 하면
별도 씬을 고치는 데 그친다. 리서치(§2) 후 선택지를 제시했고 사용자가 확정한 결정은 다음과 같다.

- 채집 방식 = **인-맵 즉시 채집**(별도 씬 없음) · 규제 = **강원 조례 전부 재현**
- 어장 경계 = **공공데이터 실폴리곤**(사용자가 `해양수산부 국립해양조사원_어장정보_20250813` 폴더 제공) + 데이터 디렉토리 재조정
- 통발 = 이번 범위 포함 · **아이템 구매·소유·설치 소모·수거 반환**
- 도구 = 기본 4종(맨손·집게·뜰채·갈고리) + 홀드 판정. **스쿠버 진입은 후속 확장**(사용자 계획 — `ForageAccess` 축으로 자리만 확보)
- 단속 = **적발 확률 + 압수 + 벌금(보유 재화 비율·상한)** — 실제 1천만 원은 경제 규모상 파산급

## 2. 리서치 — 무엇을 근거로 설계했나

웹 조사 2026-09-09 (출처는 `types/Foraging.ts` 헤더 주석에 요약).

- **동해안 해루질은 서해식이 아니다.** 조차 수십 cm·수심 깊은 암반 지형 → 갯바위·방파제 발밑·암반 조간대에서
  소라·홍합·성게·해삼·문어를 줍거나 뜰채/갈고리로 건진다. 스킨 잠수('물질')는 별개 축. 모래 해변엔 대상이 없다.
- **강원특별자치도 조례(2024-07-26 시행)**: 어촌계 어장(마을어장·협동양식장) 안 **전복·해삼·성게·홍합·문어 5종 금지**
  (1천만 원 이하 벌금) · 산란기 도루묵(10~12월)·대문어 8kg↑(3~5월) 제한 · 스쿠버 금지 · 채집물 **판매·유통 금지**(과태료 200만 원).
- **시행령 허용 도구**: 투망·뜰채·반두·손들망·외줄낚시·가리·통발·집게·갈고리·호미·삽·손(동력 금지).
- **어장 실데이터**: 공공데이터포털 15130109 SHP(EPSG:5179, 14,858건 전국). 속초 맵 bbox와 교차하는 폴리곤 3개 —
  **마을어업속초9**(70ha, 동명항·영금정 앞), **협동양식속초5**(115ha), **협동양식속초6**(18ha). 조도(794,427)는 어장 **밖**.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`tools/extract_fishfarms.py`](../../../tools/extract_fishfarms.py) | SHP/DBF 표준 라이브러리 파서 + EPSG:5179 역변환 + bbox 교차 클립 + Douglas-Peucker 0.35타일 간소화(2,996점 → 249점) → `fishfarms.json` |
| 신설 | `docs/reference/gis/khoa_fishfarm_20250813/` + [`README.md`](../../reference/gis/README.md) | 원본 SHP 보관소(루트에서 이동 · **ASCII 폴더명** · `.gitignore`에 `*.shp/*.shx/*.dbf` 114MB 제외) |
| 신설 | `packages/client-pc/public/data/sokcho_v2/fishfarms.json` | 속초 어장 3폴리곤(5KB, 커밋 대상) |
| 신설 | [`core/types/Foraging.ts`](../../../packages/core/src/types/Foraging.ts) | `ForageTool/Access/SpotKind/Spot` · `FishFarm/RegionFishFarms` · `pointInRing/farmAt` · `GANGWON_FORAGE_ORDINANCE` · `FORAGE_CATCH_SELLABLE=false` |
| 신설 | [`core/simulation/ForagingEngine.ts`](../../../packages/core/src/simulation/ForagingEngine.ts) | 시드 PRNG(`mulberry32`·`forageSeed` 시간 슬롯) · `forageSafety`(풍속/파고/너울) · 스팟 롤링(밀도·간조 보너스·시장가 역가중) · `attemptForage`(도구 게이트·맨손 부상·문어 도주·법정 크기 방류) · 조례 판정·적발 롤·통발 산란기 위반 |
| 수정 | [`core/db-schema/ShoreCreatureDatabase.ts`](../../../packages/core/src/db-schema/ShoreCreatureDatabase.ts) | `tools/spotKinds/handInjury/access/ordinanceProtected` 필드 + 기존 8종 배선 + **동해 4종 신설**(홍합(섭)·보말·거북손·삿갓조개) |
| 수정 | [`core/db-schema/TrapDatabase.ts`](../../../packages/core/src/db-schema/TrapDatabase.ts) · `types/Activities.ts` | `TrapSpec.licenseTier/priceWon` 필수 · 어류 그물에 **도루묵** · `DeployedTrap` optional `depthM/lossRolled/durability/mapId` |
| 수정 | [`core/simulation/TrapSystem.ts`](../../../packages/core/src/simulation/TrapSystem.ts) | `rollTrapLoss`(1회 롤) · 개체 내구도 · `validateTrapDeployment` 심화 면허 등급 |
| 수정 | [`core/config/tuning.ts`](../../../packages/core/src/config/tuning.ts) | `forage` 20키 · `trap` 4키 + F8 슬라이더 11종(mockup) |
| 수정 | `core/types/License.ts` · `RegionMap.ts` · `index.ts` | 해루질 입문 허가의 **'거제 스팟 방문' 조건 제거**(심리스 속초에선 달성 불가) · `SeamlessRegionDef.hasFishFarms` · export |
| 신설 | [`client/scenes/field/ForageSystem.ts`](../../../packages/client-pc/src/scenes/field/ForageSystem.ts) | 후보 타일(갯바위·사석/TTP 발밑·안벽·웅덩이) → 스팟 롤링·렌더 · 어장 오버레이(점선+라벨) · 랜턴 반경 가시성 · [E] 홀드 게이지 · 쿨러/인벤 수확 · 조례 단속 · 미끄러짐 |
| 신설 | [`client/scenes/field/TrapFieldSystem.ts`](../../../packages/client-pc/src/scenes/field/TrapFieldSystem.ts) | 설치(범위·육지 거리·실측 수심·면허·아이템 소모) · 부표 렌더 · [E] 수거(확인 팝업 → 분실 롤 → 포획 → 반환) · 산란기 단속 |
| 신설 | [`client/ui/TrapDeployPanel.ts`](../../../packages/client-pc/src/ui/TrapDeployPanel.ts) | 통발(면허 등급 표시) × 미끼 선택 → 설치 모드 |
| 수정 | [`client/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `fishfarms.json` 로드 · `initFieldSystems` · E 우선순위(오브젝트 > 건물 > 채집 > 통발 > 장비) · **T 키** · 설치 클릭/프리뷰/ESC · `depthAtWaterTile` · dev `__FIELD` |
| 수정 | [`client/scenes/SeamlessChunks.ts`](../../../packages/client-pc/src/scenes/SeamlessChunks.ts) | 공개 접근자 `isIsletAt/waterDistAt/isHarborAt` |
| 수정 | [`client/store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | `lampLumens/forageTool/trapSpecId/forageCatch` 필드 · 시드 3종(헤드랜턴·집게·기본 게 통발) · 구세이브 백필+1회 주입 · **채집물 판매가 0** |
| 수정 | `ShopCatalog.ts` · `ShopPanel.ts` · `InventoryPanel.ts` · `CoolerPanel.ts` | 직판장 채집·통발 코너(통발 8종 = `TRAP_DATABASE` 파생) · 매입 목록에서 채집물 제외+안내 · '통발 놓기' 메뉴 · 쿨러→인벤 이송 시 생물은 `채집물`+`forageCatch` |
| 수정 | `i18n/en.ts` + 신설 `en_forage.ts` | 사전 60항목 + 규칙 27건(`tr()` 캡처 재번역 — 생물명·어장 면허명 로마자) |
| 수정 | `data/HelpContent.ts` · `dev/DevConsolePanel.ts` | 도움말 카테고리 '채집 · 통발'(3토픽) · dev 면허 즉시 발급 ⑥ |
| 수정 | `.agents/AGENTS.md` §2 | 트리 안에 잘못 붙은 스테일 텍스트 조각 제거(114차에 해소된 노트) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S14 해루질·통발 → D2(배선)·D5(진입 동선) → 인-맵 채집·통발`. 네 층을 전부 건드렸다.

- 계약(타입): `Foraging.ts` 신설 · `TrapSpec` 필수 필드 2개 추가(**새 통발을 추가하면 반드시 채워야 한다**) · `DeployedTrap` optional 4개
- 데이터: 생물 DB 12종(+4) · 통발 8종 · `fishfarms.json` · 시드/상점 아이템 · tuning
- 판정: `ForagingEngine`(전부 core — 씬엔 확률식 없음) · `TrapSystem` 분실/면허
- 렌더·입력: `ForageSystem`·`TrapFieldSystem`(씬은 접근자만 넘김) · `TrapDeployPanel`

레거시 `NightHuntingScene`/`TrapScene`은 **무수정**(FieldScene 경로에서만 열림 — 폐기 후보).

## 5. 검증 — 무엇으로 확인했나

dev 서버 + Playwright(설치 Chrome) 실렌더 + 실 스토어(`__INV`/`__GS`/`__FIELD`). 하네스 =
scratchpad `verify_forage.cjs`·`verify_forage2.cjs`. **전 하네스 pageerror 0.**

| 대상 | 방법 | 결과 |
|---|---|---|
| 어장 클립 | `extract_fishfarms.py sokcho_v2` + 점 포함 판정 | 3폴리곤(5,381B) · (700,250)=협동양식속초5 · 조도(794,427)·스폰(527,128)=밖 |
| 후보·스팟 | `__FIELD.forage.candidateStats()` | 갯바위 1,002 · 사석/TTP 1,526 · 웅덩이 40 · 안벽 1,268 → 스팟 **211**(초기 상한 40은 맵에 흩어져 조도 화면에 0개 — 220으로 상향) |
| 안전 게이트 | 실키 E 홀드 6회 | **실데이터 파고 2.1m가 진입 차단**(`[안전] 파고 2.1m — 1.5m 초과`) — 설계대로. 하네스는 임계를 올려 진행 |
| 채집 | E 홀드 1.7s (굴·안벽 스팟) | 쿨러 0→1(굴 7.7cm 124g·live) · 스팟 40→39 · 도감 토스트 |
| 조례 단속 | 마을어업속초9 안 스팟에 홍합 강제 + 적발 확률 1 | 채집 → **압수(쿨러 1→1) + 벌금 15,000원(50,000×0.3)** · HUD `[단속]` 로그 · 진입 시 `[어장]` 안내 1회 |
| 통발 설치 | `placing` 주입 → `confirmAt` 물 타일 | 통발 1→0 · 갯지렁이 15→14 · `depthM 1.0`(항내) · 부표 1 · `[통발] … 최적 수거 09:29` |
| 통발 수거 | `devRewind 9h` → `harvest` | 라벨 `침지 9.0h · 수거 적기` · 민꽃게 1,711g → 쿨러 · 통발 반환 qty 1 · 내구도 88/100 · 부표 0 |
| core 순수 | `import('/node_modules/@tra/core/dist/index.js')` | 분실 위험 0.5(상한)·롤 0.01 분실/0.99 유지 · 도루묵 11월 위반 · 문어 마을어장 위반·소라 비위반 · 벌금 30,000(10만×0.3) |
| 영어 | `setLocale('en')` 후 Text 실측 | `[Hold E] Gather — Pacific Oyster (tongs)` · `Co-op Farm Sokcho No.5 — co-op farm (no gathering)` · 통발 패널 전 항목 영문 |
| 육안 | 스크린샷 7장 | 조도 갯바위 스팟 아이콘+힌트 · 동명항 테트라포드 위 어장 점선 · 부표+라벨 · 통발 패널(겹침 0) |
| 빌드 | `npx pnpm run build` / typecheck | 3/3 · 0 오류 |

재현: dev → `__GS.startNewGameInSlot(3)` → `scene.start('RegionFieldScene',{region:'gangwon_sokcho'})` →
`__FIELD.tuning.forage.maxWaveM = 9`(실파고 대응) → `allSpots()`에서 `minLampLumens===0` 스팟 → `devTeleport` → E 홀드.

## 6. 잔여 — 이번에 안 한 것

- **야간 실검증** — 게임 시계가 실시간이라 하네스는 낮에만 돌았다. 야간 전용 생물(소라·문어·꽃게)·랜턴 반경(800lm ≈ 4.4타일)은 코드 경로만 확인. 착수 조건: 야간 세션 또는 시각 오버라이드 dev 훅.
- **실사 스프라이트(D4)** — 생물 12종은 절차 도트 아이콘(`forage_<id>` 16×14 ×1.5). `spriteKey` 예약 그대로. 에셋 오면 텍스처 키만 교체.
- **wade/dive 접근** — `ForageAccess`·`ShoreCreature.access` 자리만. 가슴장화·스킨/스쿠버 진입은 사용자 계획(물 안 이동 충돌 규칙 변경 필요).
- **F8 조율** — `TUNING.forage/trap` 전부 mockup(밀도 5/100·상한 220·성공 0.72·도주 0.35·적발 0.25·벌금 30%/30만).
- **레거시 씬 폐기 여부** — `NightHuntingScene`/`TrapScene`·`GameState.addHarvestToCooler`(화면에 없는 legacy 쿨러) 정리는 사용자 결정 대기.
- **스팟 미니맵 표시·어장 미니맵 표시** 없음. 채집물 요리 sink는 불요리 대과제.
- **한국어 HUD 로그 일부 영어 규칙 미수록**(통발 설치/수거 로그 등 — 27건 외). 120차 전수 하네스로 재수집 예정.
- 산란기 도루묵 실검증은 11월에만 가능(코드 경로는 core 순수 테스트로 확인).

## 7. 위험·부작용

- `TrapSpec.licenseTier/priceWon`가 **필수** — 통발 데이터 추가 시 누락하면 typecheck가 잡는다(의도).
- 구세이브의 통발(`spotId 'geoje_…'`, `mapId` 없음)은 `mapId ?? spotId` 비교라 **어떤 심리스 맵에도 부표가 안 뜬다** — 레거시 TrapScene에서만 보인다. 손실은 아니다.
- 채집물 판매 금지가 3경로에 흩어져 있다(`getSellPrice` 0 · `ShopPanel` 필터 · `CoolerPanel` 이송 시 `forageCatch`). 새 판매 경로를 만들면 `forageCatch`를 봐야 한다.
- i18n 규칙 `^(.+) — (.+) 필요$`는 광역 — 다른 문장이 `— … 필요`로 끝나면 잡힌다(현재 코드베이스 그 형태 문자열 없음 — 실측). 규칙 블록은 EN_RULES 최상단.
- 해루질 입문 허가 요건에서 '거제 방문'을 뺐다 — 면허 밸런스 변경(출조 10회만).
- 성능: 후보 계산은 create 1회(757k 타일 순회) · 스팟 최대 220 Image · 어장 Graphics 1개. 실측 FPS 영향 없음(하네스 중 지연 없음).
- `E` 키 우선순위가 바뀌었다(장비창 앞에 채집·통발). 스팟/통발 근접이 아니면 종전과 동일.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/night-hunting-trap.md` §2·§3·§4·§5·§6 갱신
- [x] `04-BACKLOG.md` A1·A3 갱신
- [x] `AGENTS.md` §9 요약 + 링크
- [x] `IMPLEMENTATION_PLAN.md` 직전 완료·다음 착수 갱신 · `CLAUDE.md` 이어받기 요약 · `docs/wiki/README.md` 대시보드
- [x] 새 함정 → 시스템 페이지 §6 · 스킬 `add-region`(어장 추출 절차) · `verify-render`(`__FIELD`·실파고 게이트)
