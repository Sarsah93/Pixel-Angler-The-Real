# The Real Angler — 구현 계획서 (IMPLEMENTATION_PLAN)

> **최종 업데이트**: 2026-07-08
> **작업 기준**: 이 계획서가 모든 구현의 기준입니다. 작업 완료 시 반드시 업데이트하세요.

---

## 전체 구현 단계 현황

```
Phase 1: Core 엔진 & 타입 정의            ✅ 완료
Phase 2: DB 스키마 & 데이터               ✅ 완료
Phase 3: Phaser 씬 기본 구조              ✅ 완료
Phase 4: GameState 연동 & 빌드 안정화     ✅ 완료
Phase 5: FieldScene UI 고도화             ✅ 완료
Phase 6: 게임플레이 심화 (낚시·퀘스트)    🚧 진행 중
Phase 7: CraftScene 구현                  ⬜ 대기
Phase 8: 서버 & 멀티플레이                ⬜ 대기
Phase 9: Tauri v2 통합 & Steam 패키징     ⬜ 대기
```

---

## ✅ 완료된 작업 전체 목록

### Phase 1–3: 기반 구조

| 항목 | 파일 |
|---|---|
| 물때 계산 엔진 | `core/src/simulation/TideCalculator.ts` |
| 낚시 입질 엔진 | `core/src/simulation/FishBiteEngine.ts` |
| 줄 물리 | `core/src/simulation/LinePhysics.ts` |
| 캐스팅 모델 | `core/src/simulation/CastingModel.ts` |
| 날씨 모델 | `core/src/simulation/WeatherModel.ts` |
| 해루질 엔진 | `core/src/simulation/NightHuntingEngine.ts` |
| 통발 시스템 | `core/src/simulation/TrapSystem.ts` |
| 어종 DB | `core/src/db-schema/FishDatabase.ts` |
| 장비 DB | `core/src/db-schema/GearSpecs.ts` |
| 스팟 DB | `core/src/db-schema/SpotDatabase.ts` |
| 미끼 DB | `core/src/db-schema/BaitDatabase.ts` |
| 해루질 생물 DB | `core/src/db-schema/ShoreCreatureDatabase.ts` |
| 통발 DB | `core/src/db-schema/TrapDatabase.ts` |
| 레시피 DB | `core/src/db-schema/RecipeDatabase.ts` |
| 퀘스트 DB | `core/src/db-schema/QuestDatabase.ts` |
| 어신앱 스팟 DB | `core/src/db-schema/AnglerAppSpots.ts` |
| 활동 타입 | `core/src/types/Activities.ts` |
| 라이선스 타입 + DB | `core/src/types/License.ts` |

### Phase 3: Phaser 씬

| 씬 | 파일 | 비고 |
|---|---|---|
| BootScene | `client-pc/src/scenes/BootScene.ts` | 완료 |
| MainMenuScene | `client-pc/src/scenes/MainMenuScene.ts` | 네온 타이틀 로고 강화 |
| WorldMapScene | `client-pc/src/scenes/WorldMapScene.ts` | 완료 |
| FieldScene | `client-pc/src/scenes/FieldScene.ts` | 탑다운 재설계 완료 |
| FishingScene | `client-pc/src/scenes/FishingScene.ts` | 완료 |
| TackleRoomScene | `client-pc/src/scenes/TackleRoomScene.ts` | 완료 |
| TideChartScene | `client-pc/src/scenes/TideChartScene.ts` | 완료 |
| AnglerLogScene | `client-pc/src/scenes/AnglerLogScene.ts` | GameState 연동 미완 |
| NightHuntingScene | `client-pc/src/scenes/NightHuntingScene.ts` | 완료 |
| TrapScene | `client-pc/src/scenes/TrapScene.ts` | 완료 |
| RestaurantScene | `client-pc/src/scenes/RestaurantScene.ts` | 완료 |
| CondoScene | `client-pc/src/scenes/CondoScene.ts` | 완료 |
| CookScene | `client-pc/src/scenes/CookScene.ts` | 완료 |

### Phase 4–5: GameState 연동 & UI 고도화

| 항목 | 결과 |
|---|---|
| GameState 확장 (stamina, fatigue, activeQuickslotIndex) | ✅ |
| TrapScene / CookScene / NightHuntingScene ↔ GameState 연동 | ✅ |
| LicensePanel ↔ GameState 연동 | ✅ |
| HUD: 좌상단 STATUS (Stamina/Fatigue/Coins) | ✅ |
| HUD: 중앙하단 퀵슬롯 8개 (단축키 1~8) | ✅ |
| HUD: 좌하단 커뮤니티 채팅 플레이스홀더 | ✅ |
| MiniMap: 우상단 직사각형 배치 + M키 3단계 크기 변환 | ✅ |
| InfoOverlayPanel: 인벤토리(I) / 퀘스트(Q) 팝업 | ✅ |
| ESC LIFO 팝업 스택 시스템 | ✅ |
| 마우스 클릭 자동 이동 | ✅ |
| WASD ↔ 방향키 완전 분리 (이동은 방향키 전용) | ✅ |
| U 키: 제작대(CraftScene) 단축키 등록 | ✅ |
| noUnusedLocals 전면 준수 (미사용 변수 정리) | ✅ |
| 단축키 팝업 창 (Inventory, Quest, Status, License) 드래그앤드롭 및 토글 해제 | ✅ |
| 팝업 창 우측 상단 ✕ 네모 닫기 단추 구현 및 화면비 절대좌표 뷰포트 배치 | ✅ |
| 팝업 본문 텍스트 GeometryMask 기반 마우스 휠 스크롤 지원 | ✅ |
| 낚싯대 캐스팅 시 파워 차지 게이지(스킬샷) 인터랙션 추가 및 낚시 씬 연동 | ✅ |
| 팝업·미니맵·HUD 활성화 시 클릭이동 차단 및 퀵슬롯 단축키(1~8) HUD 즉시 갱신 | ✅ |
| 울릉도 핀포인트 좌표 최적화 및 독도 노드(지도 동단 노란 체크위치) 신규 추가 | ✅ |
| 모든 서브 씬(Cook, Condo, Restaurant, NightHunting, Trap) ESC 단축키 & fadeOut 복귀 일관성 적용 | ✅ |

---

## 🚧 Phase 6: 게임플레이 심화 & 실데이터 연동

### 6-0. 실데이터 기반 기반 구조 및 시장 경제 (✅ 완료)

| 항목 | 결과 |
|---|---|
| `FishingSpotInfo` 타입에 `dotMapX/Y`, `tideStationCode`, `kmaGridX/Y`, `seasonalSpecies` 확장 | ✅ |
| `CoordinateUtils.ts`: 위경도 ↔ 도트맵/기상청 격자 변환 유틸 | ✅ |
| `FishBehaviorDatabase.ts`: 10종 고증 입질 프로파일 | ✅ |
| `Economy.ts` & `MarketPriceEvaluator.ts` : 수산물 경락 시세 및 kg단가/중량/등급 기반 가변 수매가 책정 | ✅ |
| `Item.ts` & `UniversalItemDatabase.ts` : 신선도/부패(live~fresh~spoiled) 및 쿨러 보관(chilled) 통합 아이템 시스템 | ✅ |
| `AuctionEngine.ts` : 선어(01~03시) 및 활어(03~07시) 시간대별 경매 개폐장, NPC 카운터 경쟁 입찰 | ✅ |
| `FieldScene.ts` : 기존 고정 수식 어판장 수매 로직을 고증 경락가 산정 엔진(`evaluateFishSellPrice`)으로 마이그레이션 | ✅ |
| `index.ts` export 추가 | ✅ |

### 6-0b. 포항 영일만 맵 & 조류 시각화 시스템 (✅ 완료, 2026-07-08)

| 항목 | 결과 |
|---|---|
| `YoilBayFieldMap.ts`: 실제 영일만 지형을 2048×1536 픽셀 격자로 추상화 | ✅ |
| 낚시 포인트 7곳 (북방파제 끝단/중단, 홈통, 남방파제 끝단/내항, 내만, 갯벌 통발) | ✅ |
| 지형 구역(Zone) 9개: 외해/북방파제/홈통/남방파제/내만/조간대/마을 | ✅ |
| 건물 7개 (민박, 낚시점, 면허사무소, 하나로마트, 횟집, 어판장, 화장실) | ✅ |
| 조류 타입별 포인트 속성 (MAIN/COUNTER/EDDY/CONVERGENCE/NONE) | ✅ |
| 수심 및 바닥 지형(reef/gravel/sand/mud) 속성 | ✅ |
| `HydroCurrentRenderer.ts`: Phaser Graphics 기반 조류/수심 픽셀 렌더러 | ✅ |
| 조류 화살표 (방향+길이로 속도 표현, 색상 코딩) | ✅ |
| 수심 색조 배경 레이어 (얕음→깊음 청색 그라데이션) | ✅ |
| 낚시 포인트 마커 (원형 + 이름 + 수심 텍스트) | ✅ |
| 조경지대(CONVERGENCE) 황금색 테두리 강조 | ✅ |
| `FieldScene.ts`: 조류 렌더러 통합 (V 키 토글, 30초 물때 연동 자동 갱신) | ✅ |

### 6-1. FishBiteEngine V2 — 고증 알고리즘 강화 (✅ 완료)

**파일**: `packages/core/src/simulation/FishBiteEngine.ts`

현재 단순 가중합산 구조를 아래 단계로 고도화:
- `getSeasonScore()`: 현재 월 기반 `seasonActivity` + 영등철/회유 시즌 보정
- `getTideTimingScore()`: 만조/간조 시각과 현재 시각 차이로 `highTideWindow` 내 여부 판단 (단순 tideStrength 배수 대비 훨씬 현실적)
- `getTempScoreV2()`: `tempActivityCurve` + `interpolateTempActivity()` 선형 보간
- `getRigBonus()`: 전유동/반유동/루어/바닥 채비별 어종 보너스
- `getHabitatScore()`: 스팟 타입 vs `preferredHabitat` 매칭
- `isClosedSeason()` 체크: 금어기 자동 경고

### 6-1b. 채집 시스템, 야간 볼락류 DB 확장, 드랙 파이팅 & 상층/보일링 그림자 연출 (✅ 완료)

| 항목 | 결과 |
|---|---|
| 위험/엣지 타일 감지 및 30% 슬립 판정 (`checkSlipHazard`) | ✅ |
| 낙수 패널티 처리 (체력 50% 차감, 피로도 50% 가산, 이전 안전 타일 강제 후퇴) | ✅ |
| 우측 채집 선택지 UI & 도구별 채집 연동 (`attemptGather` / 성게·뜰채, 거북손·칼, 갯강구·맨손) | ✅ |
| 볼락류 야간 어종 4종 추가 (`korean_rockfish` 우럭, `yellow_rockfish` 황볼락, `red_snapper_rockfish` 열기, `night_seabream` 야간참돔) | ✅ |
| 어종별 swimmingLayer('surface'/'mid'/'bottom') 및 isBoilingSpecies 필드 정의 및 특정화 | ✅ |
| 찌 흘림/어신 대기 상태 시 상층/보일링 타겟 어종 존재 시 동적 그림자(Shadows) 표현 | ✅ |
| 보일링 어종 존재 시 여러 마리의 군집 그림자가 빠르게 요동치며 지나가는 시각 연출 | ✅ |
| 실시간 드랙 조절 (`adjustDrag` / F/G 단축키 및 방향키 위아래 연동) 및 kg단위 변환 피드백 | ✅ |
| 파이팅 틱 시뮬레이션 (`simulateFightTick` / 릴링 시 장력 가산 및 드랙 속도 줄풀림/줄감기 물리 반영) | ✅ |
| 장력 90% 임계점 초과 시 릴링 락업(잠김) 처리 및 경고 피드백 | ✅ |

### 6-1c. GIS 맵 빌더 패키지 및 파이프라인 자동화 (✅ 완료)

| 항목 | 결과 |
|---|---|
| `packages/map-builder` 신규 패키지 및 tsconfig/package.json 모노레포 연동 | ✅ |
| `MapRegistry.ts`: 대한민국(512), 포항(1024), 임곡항(2048), 방파제(4096) 맵 계층 및 해상도 명세 정의 | ✅ |
| `TileExporter.ts`: 16px 정밀 타일 지형 분류(land, water, breakwater_edge, safe_zone 등) 및 콜리전 매핑 익스포터 구축 | ✅ |
| `download_tiles.py`: Bounding Box 및 Zoom 레벨별 VWorld/KHOA 타일 지도 이미지 다운로드 스크립트 | ✅ |
| `merge_tiles.py`: 조각 세그먼트 타일들을 단일 대형 위성지도로 자동 합성 및 결합 | ✅ |
| `preprocess.py`: 자질구레한 노이즈 억제를 위한 미디언 필터 및 16색 제한 대표색 전처리 단순화 필터 | ✅ |
| `pixelize.py`: PyTorch PixelOE 모델 및 PIL Nearest Neighbor 도트화 대체 Fallback | ✅ |
| `export.py`: 완성된 도트 맵 복사 및 색상 기반 자동 타일링과 충돌 격자 JSON 내보내기 | ✅ |
| `pipeline.py` & `tools/build_map.py`: 루트 및 빌더 내에서 GIS 픽셀화 맵 배포 통합 기동 래퍼 스크립트 | ✅ |

### 6-1d. 수온 고증 구조화 및 브랜드명 우회 (✅ 완료)

| 항목 | 결과 |
|---|---|
| `WaterTemperatureData` 인터페이스 구조화 (surface, mid, bottom 수층별 수온 및 coldWaterShockIndex, trend 정의) | ✅ |
| `WeatherData` 타입에 고도화된 수온 정보 연동 | ✅ |
| `GearSpecs.ts` 저작권 우회 브랜드명 개편 (다이와->다이오, 시마노->소마노, 선라인->솔라인, 요즈리->요즈미, 나이키->쯔리센, 메이저크래프트->마이너크래프트) | ✅ |
| `FishingScene.ts` 하드코딩 기본 채비 브랜드명 우회 변경 | ✅ |

### 6-2. DB 스키마 일관성 보완 및 리팩토링 (차기 예정)

현시점 골격화(Skeletalization) 평가 결과 도출된 데이터 모델 불일치를 해소하기 위한 단계:
- **인벤토리 모델 일원화**: `PlayerState` 내의 `ConsumableItem[]`과 `CoolerSlotItem[]` 구조를 `InventoryItemInstance[]` 형태로 완전 대체.
- **조과기록 메타데이터 통합**: `livewell`에 보관된 `CaughtFishRecord` 정보를 `InventoryItemInstance` 내의 가변 메타데이터(`lengthCm`, `weightGram` 등)로 탑재하여 아이템 인스턴스로 일원화.
- **채비(TackleSetup) 미끼 인스턴스 연동**: `BaitItem` 대신 인벤토리의 특정 `baitInstanceId`를 참조하게 하여 남은 수량 및 부패 상태(spoiled 미끼 사용 시 입질 패널티)가 실제 물리 엔진과 유기적으로 연동되도록 개선.
- **현실 오프라인 시간 보정 유틸**: 게임 세이브/로드 시 `lastSavedAt` 차이를 구하여 오프라인 경과 시간만큼 게임 내 분으로 환산 후 쿨러 외부 생선의 부패 상태를 로드 즉시 벌크 업데이트.

### 6-3. AnglerLogScene 실데이터 연동
**파일**: `packages/client-pc/src/scenes/AnglerLogScene.ts`
- `GameState.player.caughtFishHistory` 실데이터 표시
- 어종별 최대어 기록, 날짜/스팟별 필터 UI

### 6-4. 퀘스트 시스템 완성
- `QuestDatabase` 연동 → 활성 퀘스트 조건 체크 (어종 포획, 라이선스 취득 등)
- 퀘스트 달성 시 알림 팝업 + `GameState` 업데이트

### 6-5. WorldMapScene → 도트 월드맵 렌더링 전환 (✅ 완료, 2026-07-13)
**파일**: `packages/client-pc/src/scenes/WorldMapScene.ts`

| 항목 | 결과 |
|---|---|
| `FishingSpotNode` 인터페이스 및 `WORLD_NODE_DATABASE` (10개 사이트) | ✅ |
| `webglmap_pixel.png` 배경 이미지 배치 (수동 폴리곤 윤곽선 제거) | ✅ |
| `WORLD_NODE_DATABASE` 기반 동적 핀포인트 마커 렌더링 | ✅ |
| 리스트 hover ↔ 지도 마커 양방향 하이라이트 동기화 | ✅ |
| 클릭 시 카메라 줌인 애니메이션 (1.5x) 후 스팟 뷰 전환 | ✅ |
| 스팟 툴팁 (물때/수온/어종, 지역 노드 툴팁) | ✅ |
| 범례 (방파제/갯바위/선상/갯벌/해수욕장) | ✅ |
| 에셋 public 배포 (`client-pc/public/webglmap_pixel.png`) | ✅ |

### 6-1e. 캐릭터 스프라이트 교체 (✅ 완료, 2026-07-13)

| 항목 | 결과 |
|---|---|
| `packages/man/` 12개 PNG → `client-pc/public/characters/man/` 복사 | ✅ |
| `packages/girl/` 12개 PNG → `client-pc/public/characters/girl/` 복사 | ✅ |
| `BootScene.ts` preload()에 25개 이미지 로드 (남자 12 + 여자 12 + 지도 1) | ✅ |
| `FieldScene.ts`: `player: Graphics` → `playerSprite: Image` 교체 | ✅ |
| 4방향(front/back/left/right) × idle/move × 2프레임 걷기 애니메이션 (200ms 주기) | ✅ |
| 발 아래 반투명 그림자 타원 (`registry '_playerShadow'` 동기화) | ✅ |

### 6-6. WeatherEventEmitter — 돌발 기상 이벤트
**신규 파일**: `packages/core/src/services/WeatherEventEmitter.ts`
- `sudden_wind`, `passing_rain`, `tide_reversal`, `baitfish_school` 등 이벤트 타입
- 출조 중 시간 경과에 따라 확률적 발동
- 기상 예보와 실제 출조 간 '리얼한 변수' 제공

### 6-7. 환경 데이터 실연동 (API 키 확보 후)
**파일**: `packages/core/src/api-client/`

**진행 순서**:
1. 공공데이터포털 `PUBLIC_DATA_API_KEY` 발급 → `PublicDataClient.parseSpotApiResponse()` 구현
2. KHOA `KHOA_API_KEY` 발급 → `OceanApiClient.parseTideResponse()` 구현
3. KMA `KMA_API_KEY` 발급 → `WeatherApiClient.parseWeatherResponse()` 구현
4. 수집 스크립트 작성: `packages/core/src/scripts/crawl-fishing-spots.ts`
5. 스크립트 실행 → `SpotDatabase.ts` 자동 확장 (실제 낚시터 수백 곳 좌표 추가)

---

## ⬜ Phase 7: CraftScene (제작대)

> **단축키**: `U` | **참조 게임**: Green Hell 제작 시스템

### UX 기조

- 인벤토리에서 재료 아이템을 **드래그 앤 드롭** 으로 제작대 슬롯 위에 올리거나,
  아이템을 **클릭(선택)** 하면 제작대 슬롯으로 자동 이동
- 슬롯에 올려진 재료가 레시피와 **완전 매칭** 되면 제작 버튼 활성화 → 결과물 생성
- 재료 조합이 틀리면 빨간 테두리 피드백

### 제작대 종류

| 제작대 | 설명 | 생산물 예시 |
|---|---|---|
| **도마 (조리대)** | 음식 재료 가공 | 손질된 생선, 포, 건어물 |
| **낚시 채비 조합대** | 채비·루어 제작 | 목줄 채비, 지그헤드, 카로리나 리그 |
| *(추후 확장)* | 수산물 가공, 통발 수리 등 | — |

### 구현 목록

- [ ] `packages/client-pc/src/scenes/CraftScene.ts` 신규 작성
- [ ] `main.ts`에 CraftScene 등록
- [ ] `RecipeDatabase.ts` 확장: `craftRecipes` 테이블 추가
- [ ] 드래그 앤 드롭 인터랙션 (Phaser `setInteractive({ draggable: true })` + `on('drag/drop')`)
- [ ] FieldScene `U` 키 → `'CookScene'`에서 `'CraftScene'`으로 교체

---

## ⬜ Phase 8: 서버 & 멀티플레이

### 8-1. 낚시터 실시간 공유
**파일**: `packages/server/src/socket/PlayerSync.ts`
- 같은 스팟 접속 플레이어 도트 표시 (FieldScene 미니맵 연동)
- 채팅 메시지 전달 (FieldScene 좌하단 커뮤니티 UI와 연동)

### 8-2. 날씨/물때 서버 브로드캐스트
- 서버에서 KMA·KHOA API 호출 후 Socket.IO로 브로드캐스트
- 클라이언트 Mock 데이터 → 서버 실데이터 수신으로 전환

### 8-3. 토너먼트 시스템 (TournamentScene)
**신규 파일**: `packages/client-pc/src/scenes/TournamentScene.ts`
**서버 파일**: `packages/server/src/socket/TournamentManager.ts`
- 실시간 어획량 랭킹 브로드캐스트
- 제한 시간 내 최다 점수 방식

---

## ⬜ Phase 9: Tauri v2 통합 & Steam 패키징

### 9-1. Tauri v2 앱 설정
- `apps/tauri-wrapper/src-tauri/` 완성
- 윈도우 해상도 1280×720 고정 (`resizable: false`)
- 앱 아이콘, 번들 메타데이터 설정

### 9-2. 로컬 파일 세이브 마이그레이션
- `localStorage` → Tauri `fs` 플러그인으로 전환
- 저장 경로: `%APPDATA%/TheRealAngler/save.json`
- 세이브 버전 마이그레이션 로직

### 9-3. Steam SDK 연동 (장기)
- Steamworks SDK 도전과제 연동
- Steam Cloud 세이브 연동
- 리치 프레즌스 (현재 낚시 중인 스팟 표시)

---

## 고려되어야 할 추가 항목

### 지형 & 타일 시스템
- **기획 방향**: 구글 기반 대한민국 지도 API 연동을 베이스로, 실제 낚시 스팟 지형을 기반으로 직접 타일을 제작할 예정
- 행동(낚시, 방파제, 갯벌, 마을 등)은 특정 **랜드타일 종류**에서만 수행 가능하도록 타일 속성 부여
- 현재 FieldScene의 절차적 구역(`ZONES` 상수)은 임시 구현 — 실제 타일맵으로 교체 예정
- Phaser `Tilemaps` 또는 직접 제작 타일셋 + `SpotType` enum 연동 설계 필요

### 인벤토리 시스템 실체화
- 현재 `InfoOverlayPanel`의 인벤토리는 읽기 전용 목록 표시 수준
- **향후**: 아이템 상세 보기, 장비 장착/해제, 퀵슬롯 드래그 배정, 아이템 정렬/필터링 기능 필요

### 퀵슬롯 아이템 배정 시스템
- 현재 퀵슬롯 1~8은 인덱스 번호만 관리 (실제 아이템 연결 없음)
- 인벤토리 아이템을 퀵슬롯에 드래그 앤 드롭으로 배정하는 UI 구현 필요
- 퀵슬롯 활성화 시 실제로 해당 장비를 장착하는 GameState 반영

### 플레이어 스프라이트 & 애니메이션
- 현재 플레이어는 `Graphics`로 직접 드로우한 픽셀 캐릭터 (임시)
- 향후: 실제 픽셀 아트 스프라이트시트 + `AnimationManager` 4방향 걷기 애니메이션

### 세이브/로드 시스템 강화
- 현재: `localStorage` 기반 JSON 저장
- 슬롯 저장 (3~5 세이브 슬롯), 자동 저장, 건물 진입 시 세이브 안내

---

## 씬 전환 아키텍처

```
MainMenuScene
    ↓ scene.start (페이드)
WorldMapScene
    ↓ scene.start (페이드)
FieldScene  ← 탑다운 월드 허브 (pause 상태 유지)
    ↓ scene.pause + scene.launch (페이드)
    ├─ FishingScene         → stop + resume('FieldScene')
    ├─ NightHuntingScene    → stop + resume('FieldScene')
    ├─ TrapScene            → stop + resume('FieldScene')
    ├─ CookScene            → stop + resume('FieldScene')
    ├─ CraftScene [예정]    → stop + resume('FieldScene')  [U 키]
    ├─ TackleRoomScene      → stop + resume('FieldScene')
    ├─ AnglerLogScene       → stop + resume('FieldScene')
    ├─ RestaurantScene      → stop + resume('FieldScene')
    ├─ CondoScene           → stop + resume('FieldScene')
    └─ TournamentScene [예정] → stop + resume('FieldScene')
```

> ⚠️ **절대 규칙**: 하위 씬에서 `scene.start('FieldScene')` 사용 금지
> 반드시 `this.scene.stop()` + `this.scene.resume('FieldScene')` 사용

---

## 현재 빌드 상태 (2026-07-13)

```bash
pnpm run build                                  → ✅ 4/4 패키지 성공
pnpm --filter @tra/client-pc run typecheck      → ✅ 0 오류
```

### FieldScene 단축키 목록 (업데이트)

| 키 | 기능 |
|---|---|
| `방향키` | 캐릭터 이동 (전용) |
| `SPACE` / `ENTER` | 낚시 포인트 진입 |
| `E` | 건물/NPC 근접 상호작용 |
| `H` | 해루질 (NightHuntingScene) |
| `T` | 통발 관리 (TrapScene) |
| `C` | 요리 (CookScene) |
| `U` | 제작대 (CraftScene 예정) |
| `L` | 면허 패널 토글 |
| `I` | 인벤토리 패널 토글 |
| `Q` | 퀘스트 저널 패널 토글 |
| `M` | 미니맵 크기 순환 |
| **`V`** | **조류/수심 오버레이 토글 (신규)** |
| `1`~`8` | 퀵슬롯 선택 |
| `ESC` | 열린 팝업 LIFO 닫기 → 월드맵 복귀 |

---

## 파일 작성 템플릿

### 새 Phaser 씬

```typescript
/**
 * @file XxxScene.ts
 * @description [씬 설명 — 한국어]
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';

export class XxxScene extends Phaser.Scene {
  constructor() {
    super({ key: 'XxxScene' }); // 파일명과 동일
  }

  create(): void {
    this.cameras.main.fadeIn(250, 0, 10, 20); // 항상 페이드인
  }

  // 나가기 버튼 패턴
  private onBack(): void {
    this.cameras.main.fadeOut(220, 0, 10, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('FieldScene');
    });
  }
}
```

---

## 주요 참고 자료

- **어신앱 스팟 정보**: `core/src/db-schema/AnglerAppSpots.ts`
- **KHOA (해양조사원) API**: `core/src/api-client/OceanApiClient.ts`
- **기상청 API**: `core/src/api-client/WeatherApiClient.ts`
- **공공데이터포털**: `core/src/api-client/PublicDataClient.ts`
- **레시피 DB**: `core/src/db-schema/RecipeDatabase.ts` (CraftScene 확장 예정)
- **퀘스트 DB**: `core/src/db-schema/QuestDatabase.ts`
