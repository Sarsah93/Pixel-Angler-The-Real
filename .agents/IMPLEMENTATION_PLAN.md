# The Real Angler — 구현 계획서 (IMPLEMENTATION_PLAN)

> **최종 업데이트**: 2026-07-14
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
| 에셋 public 배포 (`client-pc/public/webglmap_pixelazed.png`) | ✅ |

### 6-5b. WorldMapScene 핀 편집 Dev Tool (✅ 완료, 2026-07-14)
**파일**: `packages/client-pc/src/scenes/WorldMapScene.ts`

| 항목 | 결과 |
|---|---|
| P 키 토글 핀 편집 모드 진입/종료 | ✅ |
| **개발자 도구 진입용 UI 버튼 추가** (`🛠️ Dev Tool (P)` 버튼 구현 및 상태 실시간 갱신) | ✅ |
| 핀 드래그 → 지도 pixelX/Y 좌표 실시간 표시 (라벨 + 하단 패널) | ✅ |
| dragend 시 클립보드 자동 복사 (`pixelX: N, pixelY: N, // nodeId`) | ✅ |
| 배너 우측: 선택 핀 ID 강조 표시 + 드래그 확정 좌표 업데이트 | ✅ |
| 지도 빈 공간 클릭 → 새 핀 좌표 캡처 + 클립보드 복사 (TS 코드 형태) | ✅ |
| 마우스 이동 시 현재 지도 픽셀 좌표 실시간 표시 | ✅ |
| 전체 덤프 버튼: `WORLD_NODE_DATABASE` 전체 좌표 콘솔/클립보드 출력 | ✅ |
| `_editSelectedId` TS6133 빌드 오류 수정 | ✅ |

### 6-1e. 캐릭터 스프라이트 교체 (✅ 완료, 2026-07-13)

| 항목 | 결과 |
|---|---|
| `packages/man/` 12개 PNG → `client-pc/public/characters/man/` 복사 | ✅ |
| `packages/girl/` 12개 PNG → `client-pc/public/characters/girl/` 복사 | ✅ |
| `BootScene.ts` preload()에 25개 이미지 로드 (남자 12 + 여자 12 + 지도 1) | ✅ |
| `FieldScene.ts`: `player: Graphics` → `playerSprite: Image` 교체 | ✅ |
| 4방향(front/back/left/right) × idle/move × 2프레임 걷기 애니메이션 (200ms 주기) | ✅ |
| 발 아래 반투명 그림자 타원 (`registry '_playerShadow'` 동기화) | ✅ |

### 6-5c. WorldMap 핀 재배치·여수 추가·지역 줌인 진입 (✅ 완료, 2026-07-14)
**파일**: `core/src/types/WorldMap.ts`, `core/src/db-schema/RegionDatabase.ts`, `client-pc/src/scenes/WorldMapScene.ts`, `client-pc/src/scenes/BootScene.ts`

| 항목 | 결과 |
|---|---|
| 11개 핀포인트 좌표 재배치 (사용자 지정 좌표) | ✅ |
| `FishingSpotNode.mapSlug` 필드 추가 (지역 상세 지도 파일 매핑) | ✅ |
| 전남 여수(`jeonnam_yeosu`) 노드 + 지역 DB 추가 | ✅ |
| 지역 클릭 → `zoom_{slug}` 텍스처로 확대 줌인 진입 (`renderRegionMapView`, `regionmap` 뷰) | ✅ |
| 지도 미준비 지역 '준비중' 플레이스홀더 | ✅ |
| 11개 지역 상세 지도(`pixelazed/*_2_pixelazed.png`) BootScene 로드 + loaderror 안전처리 | ✅ |

### 6-5d. 캐릭터 렌더링 수정 (✅ 완료, 2026-07-14)
**파일**: `client-pc/src/scenes/FieldScene.ts`

| 항목 | 결과 |
|---|---|
| 스프라이트 원점 발밑(0.5,1) + 그림자 발밑 정렬 (공중 뜸 해소) | ✅ |
| 표시 높이 `PLAYER_DISPLAY_H=60`px 정규화 (크기 확대) | ✅ |
| idle/move 종횡비 유지하며 크기 통일 (`applyPlayerSpriteSize`) | ✅ |

### 6-5e. 실지형 기반 지역 타일맵 시스템 — 속초 (✅ 완료 v1, 2026-07-14)
**파일**: `tools/build_region_maps.py`, `core/src/types/RegionMap.ts`, `client-pc/src/scenes/RegionFieldScene.ts`, `client-pc/public/data/sokcho/*.json`

| 항목 | 결과 |
|---|---|
| PNG 지형 지도 → 색상 분류(바다/육지/건물/잔디) 타일 그리드 변환 도구 (표준 라이브러리만) | ✅ |
| 작은 물 얼룩 제거 + 대각 연결성 보정(`bridge_diagonals`) 후처리 | ✅ |
| POI(식당 아이콘) 자동 추출 | ✅ |
| `RegionMapData`/`RegionMapGraph` 타입 + 속초 7개 맵 연결 그래프 | ✅ |
| 타일 RenderTexture 베이킹 렌더링 + 모래톱/모래사장/건물 외곽선 디테일 | ✅ |
| 바다·건물 병합 정적 바디 충돌 (이동 불가) | ✅ |
| 방향키 이동 + 카메라 팔로우 + 캐릭터 스프라이트(발밑/크기 통일) | ✅ |
| 맵 간 엣지 전환 (속초항3↔2↔1↔연결로↔동명항1↔2↔3) | ✅ |
| 바다 인접 시 좌클릭 차지 캐스팅 연출 (찌 투척·파문·회수) | ✅ |
| WorldMap 속초 뷰 '필드 입장' 버튼 → RegionFieldScene | ✅ |

### 6-5f. WorldMap 구역 선택 + RegionField HUD/인벤토리 (✅ 완료 v1, 2026-07-15)
**파일**: `core/src/types/WorldMap.ts`, `client-pc/src/scenes/WorldMapScene.ts`, `client-pc/src/scenes/RegionFieldScene.ts`, `client-pc/src/ui/RegionHud.ts`, `client-pc/src/ui/InventoryPanel.ts`, `client-pc/src/store/InventoryStore.ts`

| 항목 | 결과 |
|---|---|
| 전국→지역 이음새 없는 줌인 (전국 지도 페이드아웃 → 지역 지도 확대 연속 연출) | ✅ |
| 지역 확대 지도 출조 구역 핀 (속초항 258,60 / 동명항 221,49) + 좌측 리스트 hover 연동 | ✅ |
| 출조 확인 팝업 (예/아니오) → RegionFieldScene 해당 구역 맵 입장 | ✅ |
| 속초 외 전 지역 잠금 (`isRegionUnlocked` — REGION_AREA_NODES 데이터 존재 여부) | ✅ |
| 맵 간 이동 스폰: 진입 엣지 밴드 한정 + 엣지 통로 연결 검증(`edgeSpawnTile`) | ✅ |
| ESC 일시정지 메뉴 (계속하기/전국 지도/타이틀, 목재 도트 패널) | ✅ |
| HUD: HP/피로도 바 + 시계 + 날씨 (좌상단) | ✅ |
| HUD: 미니맵 — 지형 그리드 축소 렌더, M 키 3단계 크기 | ✅ |
| HUD: 퀵슬롯 8칸 (1~8 키/클릭, InventoryStore 배정 연동) | ✅ |
| HUD: 이벤트 로그 + 커뮤니티 채팅 목업 (좌하단, 멀티플레이 대비) | ✅ |
| 인벤토리(I): 카테고리 탭 5종 × 5x5 소켓, 신선도 배지, 착용 표시 | ✅ |
| 인벤토리 우클릭 액션 (착용/해제, 퀵슬롯 등록, 전환(준비중), 버리기, 완전제거) | ✅ |
| 인벤토리 하단 보유 재화(원) 표시 | ✅ |

### 6-5g. 팝업 UI 체계 + 상점/건물 시스템 (✅ 완료 v1, 2026-07-15 2차)
**파일**: `ui/DraggablePanel.ts`, `ui/ItemDetailPanel.ts`, `ui/StatusPanel.ts`, `ui/EquipmentPanel.ts`, `ui/UtilizationPanel.ts`, `ui/ShopPanel.ts`, `ui/Dialogs.ts`, `data/ShopCatalog.ts`, `core/src/types/AnglerStats.ts`

| 항목 | 결과 |
|---|---|
| 클릭 판정 어긋남 수정 (컨테이너 자식 scrollFactor 재귀 적용 `applyScreenFixed`) | ✅ |
| 팝업 공통 베이스: 드래그 이동 / X 닫기 / ESC 최상단 LIFO | ✅ |
| 아이템 우클릭 상세보기 (종류별 추론 물리 스펙 목업) | ✅ |
| 인벤토리 탭별 독립 5x5 소켓 + 드래그 앤 드랍 이동/교환 | ✅ |
| 낚싯대 우클릭 채비하기 → U 창 채비 탭 전환 | ✅ |
| Status(S) — 물리 스탯 4종 + 기여 설명 | ✅ |
| Equipment(E) — 부위별 착용/해제 + 물리 파라미터 요약 | ✅ |
| Utilization(U) — 요리하기/채비하기 탭, 채비 소켓 조립 + Z_limit 조절 + 스펙 합산 | ✅ |
| 건물 도트 텍스처 6종 (편의점/마트/직판장/식당/카페/주점) + POI 배치 | ✅ |
| 거래 확인 팝업 → 상점(좌) + 인벤토리(우) 동시 오픈 | ✅ |
| 상점 구매/판매 탭 + 수량 팝업(-/+/직접입력) + 확인 메시지 + 재화 정산 | ✅ |
| core AnglerStats/Zone 수심 프로필(Z_max) 기초 타입 | ✅ |

### 6-5h. 1인칭 낚시 물리 파이프라인 (✅ 완료 v1, 2026-07-15 3차)
**파일**: `core/src/simulation/CastingPhysicsEngine.ts`, `UnderwaterSinkPhysics.ts`, `LineTensionPhysics.ts`, `ChumPhysics.ts`, `BiteProbabilityEngine.ts`, `FishSpawningOracle.ts`, `FightingPhase.ts`, `client-pc/src/scenes/FirstPersonFishingScene.ts`

| 항목 | 결과 |
|---|---|
| 1단계: 3D 탄도 캐스팅 (조준각·완력·바람, 그림자/찌 이원화, z≤0 착수) | ✅ |
| 캐스팅 조준 UI (조준선 + 실시간 탄도 점선 + 착수 예상 마커) | ✅ |
| 2단계: 1인칭 씬 전환 + 의사 3D 레이어 (하늘/파도/수중/해저/실루엣/로드 뷰) | ✅ |
| 3단계: 침강 V_sink + 조류 드리프트 + H 뒷줄견제(제동/양력/정렬도 A) | ✅ |
| 입질 커널: P_base×M_terrain(여밭 Hold 2.5)×(1+k·A)×M_action×M_chum + 밑걸림 | ✅ |
| Phase 1: 밑밥 투척/확산/3차원 동조율 `getChumSyncRate` + 게이지 UI | ✅ |
| Phase 3: 어종 오라클 (물때 1~15 활성도·수심층·규제, 가우시안 개체 생성) | ✅ |
| Phase 4: 파이팅 텐션 상태 머신 (바늘털이/여박기 패턴, P_escape 공식) | ✅ |
| 1인칭 UI: 2분할 쿨러(어획/밑밥), 그만하기 버튼, 퀵슬롯 미표시→복귀 복원 | ✅ |
| 손 좌/우 착용 시스템 + 캐스팅 장비 게이팅 (퀵슬롯+착용 이중 조건) | ✅ |

### 6-5i. 메인 메뉴 개편 + 저장 슬롯 시스템 (✅ 완료 v1, 2026-07-15 4차)
**파일**: `client-pc/src/scenes/MainMenuScene.ts`, `client-pc/src/store/GameState.ts`, `client-pc/src/scenes/AnglerLogScene.ts`

| 항목 | 결과 |
|---|---|
| 로고 잘림/이중 겹침 수정 + 태그라인·구 도트 배경 제거 | ✅ |
| 시간대 연동 배경 (하늘·바다 그라데이션/별/반사광/등대/배/찌) | ✅ |
| 메뉴 뷰 스택: 게임 시작 → NEW/LOAD → 슬롯 3개 선택 | ✅ |
| 저장 슬롯 3개 (메타 표시·덮어쓰기 확인·레거시 호환) | ✅ |
| 인게임 일시정지 메뉴 '저장하기' | ✅ |
| 도감 복귀 씬 파라미터화 (메인 메뉴 흑백 화면 버그 수정) | ✅ |
| 키보드 내비 폰트 흔들림 수정 (선택 = 색+바만 변경) | ✅ |

**차기 (메인 메뉴 고도화)**:
- 슬롯 삭제 버튼, 슬롯별 스크린샷 썸네일
- 설정에 해상도/키 리맵, 언어 영문 번역 실적용
- Tauri 종료 API 연동 (`window.close()` → appWindow.close())
- BGM/파도 앰비언트 사운드 도입 (설정 볼륨 연동)

### 6-5j. 어종 마스터 21종 + 채비 손실 루프 + FP 뷰 개선 (✅ 완료 v1, 2026-07-15 5차)
**파일**: `core/simulation/FishSpawningOracle.ts`, `core/simulation/FightingPhase.ts`, `client-pc/src/store/InventoryStore.ts`, `client-pc/src/scenes/FirstPersonFishingScene.ts`, `RegionFieldScene.ts`

| 항목 | 결과 |
|---|---|
| 어종 마스터 DB 21종 (서식지/수심/미끼 선호도/성전환/규제/물때/야간) | ✅ |
| 미끼 친화도 `getBaitAffinity` → 입질 확률 연동 | ✅ |
| 파이팅 패턴 3종 (바늘털이/여박기/횡이동) 어종별 가중치 | ✅ |
| 난이도 완화 (패턴 빈도↓, 릴링 진행 1.2배) + 입 연약도/목줄 절단 | ✅ |
| 실패 유형별 채비 손실 → 즉시 1인칭 해제 → 재장착 후 캐스팅 | ✅ |
| 캐스팅 필수 채비 게이트 (원줄/찌/목줄/바늘·미끼) | ✅ |
| FP 뷰: 해저 렌더 제거 + 육지 전경(shoreKind) + 우측 상단 수심 패널 | ✅ |
| dev 기본 장비 (용상 파조기/다이오 2500L/반유동 프리셋) | ✅ |
| 팝업 클릭 관통 → 캐스팅 힌트 버그 수정 | ✅ |

**추가 (2026-07-15 6차)**: 맵 전환 인식 최외곽 1타일로 축소 + 건물 근접 시 전환 억제 / 아이템 이미지 아이콘 시스템(`ItemIcon.ts`) / 음식·생선 에셋 배치(`public/food/`, `public/fish/`) / 감성돔·광어 어획 팝업·상세 실사 이미지 / 회(사시미) 네이밍 규칙 및 식당 품목 추가.

### 6-5k. 1인칭 낚시 전면 개편 — 챔질/조류/조법/편대 (✅ 완료 v1, 2026-07-19)
**파일**: `core/simulation/BiteSequenceEngine.ts`(신규), `core/simulation/TidalCurrentEngine.ts`(신규), `client-pc/scenes/FirstPersonFishingScene.ts`, `store/InventoryStore.ts`, `ui/UtilizationPanel.ts`

| 항목 | 결과 |
|---|---|
| 초릿대 3단계 구부러짐 (30/45/60° 프로파일) + 낚싯대 연장 렌더 | ✅ 수치+실렌더 검증 |
| 우클릭 챔질 (1단계 5%/2단계 20%/3단계 100%, 릴리즈 늦챔질 실패) | ✅ 1단계 실측 5.2% |
| 입질 패턴 7종 확률 분포 + 간격 1~180s + 확률 비례 반복(최대 5) | ✅ 1만회 분포 검증 |
| 어종 mock: 광어 [3] / 감성돔 [1→3] | ✅ |
| 조류 5존 (조수/반탄/조경 Hit Zone/횡/본류) + 포말 + 수면거리 변동 | ✅ |
| 릴링 방향성(화면 좌/우) + 조류 순/역방향 속도차 + 리프트(↑) | ✅ |
| 루어 액션: 리트리브/리프트앤폴/트위칭(더블탭)/호핑(싱글탭)/드래깅 | ✅ |
| 텐션 저항 (릴링 미끄러짐 + 과부하 줄터짐) | ✅ |
| 조법: 전유동(면사 제거 토글·H 침강 정지)/잠길찌 안내 | ✅ |
| 원투 편대 (T자/카드 3종/학꽁치/갈치 + 멀티훅 + 과부하 + 다관점 히트) | ✅ |
| 우측 수심 모식도 (거리축+자세 아이콘+훅 도트+존 라벨) | ✅ |

**추가 (2026-07-19 2차) — 온보딩 가이드 + 이펙트**: ✅ 첫 진입 튜토리얼(3열 카드+초릿대 도해, localStorage 영속, F1/? 재열람, 열림 중 입력 차단) / ✅ 상태별 하단 조작 바(drift/입질/파이팅 자동 전환) / ✅ 입질 단계 이펙트(파문+느낌표+쉐이크, 3단계 "지금 챔질!" 배너) / ✅ HOOK UP! 배너+플래시 / ✅ 텐션 85+ 붉은 비네트 / ✅ 조류 존 전환 토스트.

**추가 (2026-07-19 3차) — 1인칭 UI 다듬기**: ✅ 낚싯대 높이 축소+팁 화면 내 가시화(패널 왼쪽 바깥 배치) / ✅ 수심 패널 전용 레이어(z순서 — 낚싯대 위) / ✅ 수심 모식도 2배 확장(넓은 게이지 박스+채비 좌우 편차+우측 텍스트 열) / ✅ 가이드 4페이지 스텝 재구성(입질 읽기→챔질 타이밍→채비→파이팅, 단계별 히트 가능성 문구).

**차기**: 어종별 입질 형태 전체 확장(SPECIES_PATTERN → FishMasterSpec 이관) / 조경지대 시각 마커 고도화 / 잠길찌 아이템 시드 추가 / 편대 채비별 엉킴 확률(T자 -50%) 실연동 / 파이팅 중 릴링 게이지 시각화 / 사운드 이펙트(입질 알림음·드랙음 — 오디오 에셋 확보 시).

**차기 (1인칭 낚시 고도화)**:
- 어종별 실사 픽셀 이미지 확충 (현재 감성돔/광어 2종 → 43종. 사용자가 차근차근 추가 예정 — 신규 12종 `spriteKey`는 `fish_{id}` 규칙으로 이미 예약됨)
- 어종별 단일 회 아이콘 분리 (현재 모듬회 이미지로 통일)
- 어종 DB API 연동 매칭 (현재 core 하드코딩 43종)
- 기상 API 실연동 (바람/파고/조류 벡터를 목업 → 실데이터로)
- 여 밭 배치를 해시 시드 → 실제 해저 지형 데이터 기반으로
- 채비 부품별 무게/부력 DB 정식 연동 (현재 이름 기반 목업 수치)
- 어종 오라클 ↔ FISH_DATABASE/조과첩 도감 통합 (성전환 생태 노트 표시)
- 붕장어 줄꼬임/복어 와이어 바늘 대응 등 특수 채비 카운터
- 파이팅 릴링 사운드/로드 진동 연출, 뜰채(왼손) 랜딩 미니게임
- 물고기 실루엣 원근 접근 연출 고도화 (스케일/알파 + 수평선 스폰)

**차기 (RegionField 고도화)**:
- 세부 낚시 포인트 지정 + 캐스팅 → FishingScene 정식 연동 (다차원 캐스팅 물리: 스탯/기상 벡터/Z_max 그라디언트 적용)
- 요리하기 탭 정식 구현 (도마 + 삼면뜨기 손질, 회칼 장비 필요, 생선 이미지 에셋 업로드 후)
- 채비 모딩 고도화 (부품별 무게/부력 DB 연동, 채비 세트 저장)
- 인벤토리/상점 ↔ @tra/core UniversalItemDatabase 정식 연동 (현재 클라이언트 목업 시드)
- 상점 재고/시세 API 연동 (농정원 경락 시세 등 — API 키 확보 후)
- 해류/수심 정보 표시 (API 연동 기반, 바다 타일에서만 — 단축키 토글 아님)
- 건물 위치를 지도 데이터 기반으로 정밀 배치 (현재 POI 순환 배정)
- 나머지 지역(여수 등) 타일 데이터 생성 및 그래프 확장 + 잠금 해제
- 방파제 좁은 통로 통행성 세밀 튜닝, 물결 애니메이션

### 6-6. WeatherEventEmitter — 돌발 기상 이벤트
**신규 파일**: `packages/core/src/services/WeatherEventEmitter.ts`
- `sudden_wind`, `passing_rain`, `tide_reversal`, `baitfish_school` 등 이벤트 타입
- 출조 중 시간 경과에 따라 확률적 발동
- 기상 예보와 실제 출조 간 '리얼한 변수' 제공

### 6-6b. 공공 OpenAPI 통합 수집 + 엔진 연동 (✅ 완료 v1, 2026-07-15 7차)
**파일**: `core/src/api-client/{ExternalApiService,FishingIndexApiClient,AuctionPriceApiClient,KosisCatchApiClient}.ts`, `client-pc/src/store/ExternalDataStore.ts`

| 항목 | 결과 |
|---|---|
| 바다낚시지수 API (fcstFishingv2) — 실 응답 검증 및 파서 확정 | ✅ |
| 경락가격 클라이언트 (품목 코드 CSV 매핑, End Point 주입형) | ✅ (엔드포인트 확정 대기) |
| KOSIS 어획량 클라이언트 (시도×어종, 월간) | ✅ (KOSIS 전용 키 필요 — Mock 폴백 중) |
| 스타트업 1회 수집 → 캐시 싱글톤 → 엔진은 캐시만 참조 | ✅ |
| 낚시지수 → 입질 P_base 0.7~1.4배 / 경락가 → 직판장 매입가 0.5~2.0배 / 어획량 → 스폰 가중 0.7~1.8배 | ✅ |
| 전 API Mock 폴백 (오프라인/트래픽 초과 안정성) | ✅ |

**추가 (2026-07-16 1차)**: ✅ MAFRA 수산물 경락가격 2종 정식 연동(Grid 621/623, 실호출 검증, 2023 동월동일 계절 시세 + 7일 누적) / ✅ KOSIS 새 인증키 검증(1,140행, 총중량 필터) / ✅ 어종 DB 단일화(레거시 ID 개명 + FISH_DATABASE 17종 추가 + 오라클 8종 역편입 = 29종) / ✅ MAFRA 품목명·KOSIS 분류명 → 어종 ID 매칭 테이블.

**추가 (2026-07-16 2차)**: ✅ 벵에돔 실측 보정(금지체장 없음 확정) / ✅ 긴꼬리벵에돔·가숭어 신규 (총 31종) / ✅ `bread` 미끼 분류 + 빵가루 경단 아이템 — 기존 TODO 2건 해소.

**추가 (2026-07-16 3차)**: ✅ 신규 12종 — 개서대/갯장어/꽁치/눈볼대(금태)/눈퉁멸/대구/덕대/병어/도다리/강도다리/도루묵/말쥐치 (**오라클 43종 / FISH_DATABASE 42종**) / ✅ 기존 4종 실측 보정 — 갈치(학명·금어기 7월·**금지체장 항문장 18cm → 전장 환산 47cm**), 고등어(금어기 [5]→[4,5,6]), **광어(금지체장 21→35cm 오류 정정)**, 문치가자미→'참도다리'로 개명(도다리·강도다리 분리) / ✅ 오라클↔FISH_DATABASE 드리프트 4건 정렬(볼락·황볼락 금지체장, 조피볼락·열기 표기) / ✅ MAFRA·KOSIS 매칭 확장(21건 매칭 검증 통과) / ✅ 학명 4건 확정(참도다리 `Pseudopleuronectes`, 강도다리 `Platichthys`, 덕대 `P. echinogaster`, 병어 `P. argenteus`).

> **금지체장 단위 규칙**: 게임의 금지체장 판정은 **전장(`SpawnedFish.lengthCm`)** 기준. 법정 기준이 항문장·체장 등 다른 단위인 어종은 **반드시 전장으로 환산해서** 입력할 것 (갈치: 항문장 18cm → 전장 47cm). 환산 없이 넣으면 스폰 최소 크기에 막혀 규칙이 조용히 무력해진다.

> ⚠️ **매칭 테이블 순서 규칙**: `MAFRA_ITEM_TO_SPECIES`/`KOSIS_SPECIES_MATCH`는 부분 일치(`includes`)+선착순(`find`) 구조 — 품목명이 포함 관계면 **더 긴 쪽을 먼저** 둘 것 (`'말쥐치'⊃'쥐치'`, `'강도다리'⊃'도다리'`, `'개서대'⊃'서대'`). 어종 추가 시 반드시 확인.
>
> **사용자 확인 대기**: 학명 4건(참도다리·강도다리 속명, 덕대·병어가 동일 학명 `Pampus argenteus`) — 제공 데이터 그대로 입력함. 전갱이·쥐치는 오라클에만 존재(FISH_DATABASE 미등록 → 도감 조회 불가, 기존 이슈).

**차기**: 낚시지수 placeName↔게임 지역 매핑 정밀화(속초·동명항 인근 포인트 지정) / 수집 주기(일 1회 갱신) 스케줄링 / MAFRA·NMPNT HTTP 엔드포인트 → HTTPS 배포 시 프록시 + **브라우저 CORS 프록시**(NMPNT/MAFRA/KOSIS는 브라우저에서 CORS 차단 → 현재 Mock 폴백. 기상청 apis.data.go.kr만 CORS 통과).

### 6-6e. 채비 분리 + 부산 구역 + 팩토리 (✅ 완료, 2026-07-17 1차)
**파일**: `client-pc/src/store/InventoryStore.ts`, `ui/UtilizationPanel.ts`, `scenes/FirstPersonFishingScene.ts`, `core/types/WorldMap.ts`, `scenes/WorldMapScene.ts`, `src/game.ts`(신규), `src/main.ts`

| 항목 | 결과 |
|---|---|
| 채비 `hookBait` → `hook`/`bait` 소켓 분리 (8소켓 체인) | ✅ |
| 루어(바늘 일체형) 분류 + 장착 시 미끼 소켓 비활성 + 미끼 없이 캐스팅 | ✅ |
| 입질 소모/실패 손실 규칙 세분화 (루어 무손실, 바늘빠짐은 미끼만) | ✅ |
| `RegionAreaNode` 특성 확장 (details/depthRangeM/snagRisk/enterable) | ✅ |
| 부산 4구역 핀 (좌표는 핀 이미지 픽셀 추출) + 특성 카드 + 출조 차단 | ✅ |
| 속초 2구역 특성 상세 보강 | ✅ |
| main.ts → game.ts 팩토리 (싱글턴 가드 — 하네스 이중 생성 해소) | ✅ |

**차기**: ~~부산 4구역 타일맵 제작 후 enterable 해제~~ ✅ / ~~snagRisk 1인칭 실연동~~ ✅ (6-6f) / `depthRangeM`을 RegionFieldScene 수심 프로필 폴백에 연동(잔여).

### 6-6f. 부산 필드 + snagRisk 연동 + CORS 프록시 (✅ 완료, 2026-07-17 2차)
**파일**: `tools/build_region_maps.py`, `core/types/RegionMap.ts`(BUSAN_MAP_GRAPH·depthProfileUrl), `core/types/WorldMap.ts`, `core/simulation/BiteProbabilityEngine.ts`, `client-pc/vite.config.ts`, `store/ExternalDataStore.ts`, `public/data/busan/`(8종)

| 항목 | 결과 |
|---|---|
| 부산 타일맵 8종 생성 (감천서2/감천동3/암남1/백운포2) | ✅ |
| BUSAN_MAP_GRAPH — 명세 링크 6건 (동방파제1↔E↔암남 포함) | ✅ 브라우저 검증 |
| 출조 진입 중앙 스폰 (편차 1~3타일) / 맵 전환 엣지 스폰 유지 | ✅ 기존 로직이 명세 충족 |
| 부산 4구역 출조 개방 (enterable 해제) | ✅ |
| snagRisk→밑걸림 배율 (low 14.9s/mid 8.9s/high 5.8s, 1000회 시뮬) | ✅ |
| CORS 프록시 — NMPNT/MAFRA/KOSIS dev 실데이터화 (차단 0건) | ✅ |
| 부산 실측 수온 매핑 (감천항유도등부표 994401579) | ✅ |

**부산 맵 체인**:
```
[감천항 서방파제]  감천동(west_1) ↕ 방파제(west_2)
[감천항 동방파제]  제3부두(east_1) ↕ 수산시장(east_2) ↕ 방파제(east_3)
                   제3부두(east_1) ↔E↔ 암남공원 주차장(amnam_1)
[백운포]           체육공원(baegunpo_1) ↕ 방파제(baegunpo_2)
```

**차기**: 프로덕션 서버 프록시(배포 시 필수 — vite 프록시는 dev 전용) / 부산 수심 프로필(`build_depth_profiles.py` 부산 앵커) / depthRangeM 폴백 연동.

### 6-6c. 실측 연안 수심 프로필 연동 (✅ 완료 v1, 2026-07-15 8차)
**파일**: `tools/build_depth_profiles.py`, `core/src/types/DepthProfile.ts`, `client-pc/public/data/depth/gangwon_sokcho.json`, `RegionFieldScene.resolveCastDepth`

| 항목 | 결과 |
|---|---|
| 연안정보도 수심 SHP 파싱 (표준 라이브러리 — SHP/DBF + UTM-K 역변환) | ✅ (전국 46,270 포인트) |
| 속초항/동명항 앵커 100m 구간 수심 프로필 (0~2.5km) | ✅ |
| 캐스팅 거리 → 실측 수심 보간 + 범위 초과 거리 비례 외삽 | ✅ |
| 프로필 미존재 지역 그라디언트 폴백 | ✅ |

**차기**: 지역 확장 시 `REGIONS`에 앵커 추가 후 재실행 / 방향별(방위각) 프로필 분리(현재 반경 평균) / 여 밭 배치를 수심 급변 구간과 연계.

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
    ├─ scene.start → RegionFieldScene  (실지형 타일맵, top-level)
    │      ↕ scene.restart (맵 간 엣지 전환)
    │      ↑ ESC → scene.start('WorldMapScene')
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

## 현재 빌드 상태 (2026-07-14)

```bash
pnpm --filter @tra/core build                   → ✅ 성공
pnpm --filter @tra/client-pc run typecheck      → ✅ 0 오류
pnpm --filter @tra/client-pc build              → ✅ 성공 (vite 빌드)
```

> ⚠️ **지도 데이터 재생성**: `pixelazed/<region>/` 지형 지도를 수정/추가하면
> `py tools/build_region_maps.py <region>` 로 `public/data/<region>/*.json` 을 다시 생성해야 함.

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
