# Pixel Angler The Real — 에이전트 작업 지침서

> **이 파일은 반드시 모든 AI 에이전트가 작업 시작 전 읽어야 합니다.**
> 이 프로젝트는 복잡한 피처 구현을 포함하므로, 하나의 LLM 세션이 끊겼다가 다른 LLM이 이어받는 경우에도 **아키텍처와 코딩 규칙이 절대 변경되어서는 안 됩니다.**

---

## 1. 프로젝트 개요

**Pixel Angler The Real** — 2D 픽셀 퍼펙트 해양 낚시 시뮬레이터

- **장르**: 리얼리즘 낚시 시뮬레이터 + 생활 경영 RPG
- **플랫폼**: PC (Tauri v2 기반 데스크톱 앱), 추후 Steam 출시 목표
- **기술 스택**: TypeScript, Phaser 3, Tauri v2, Socket.IO (멀티), Turborepo

---

## 2. 모노레포 구조 (절대 변경 금지)

```
the-real-angler/
├── packages/
│   ├── core/          ← 순수 TS 게임 엔진 (렌더링 코드 절대 금지)
│   ├── client-pc/     ← Phaser 3 + Vite 클라이언트
│   └── server/        ← Socket.IO 서버 (멀티플레이)
├── .agents/           ← 에이전트 지침서 (이 파일)
│   ├── AGENTS.md
│   └── IMPLEMENTATION_PLAN.md
```

---

## 3. 패키지별 역할 (절대 준수)

### `@tra/core`
- **순수 TypeScript 로직만 허용** — Phaser, DOM, 브라우저 API 일절 금지
- 모든 게임 계산 엔진(물때, 낚시 시뮬레이션, 해루질, 통발 등)이 여기에 위치
- `packages/core/src/index.ts`에서만 외부로 export

### `@tra/client-pc`
- Phaser 3 씬, UI 컴포넌트, 입력 처리
- 게임 로직은 `@tra/core`를 import해서 사용 (직접 구현 금지)
- `packages/client-pc/src/store/GameState.ts` — 전역 싱글톤, 씬 간 데이터 공유

### `@tra/server`
- Socket.IO 기반 멀티플레이 서버
- 낚시터 공유, 토너먼트, 실시간 플레이어 위치 동기화

---

## 4. 코딩 규칙 (절대 준수)

### TypeScript
- **strict 모드** 사용 (`tsconfig.base.json` 참고)
- `any` 타입 사용 절대 금지 (불가피한 경우 `// eslint-disable-next-line` 주석 필수)
- 모든 interface/type은 `packages/core/src/types/`에 정의
- export 누락 시 반드시 `packages/core/src/index.ts` 업데이트

### TypeScript noUnusedLocals 정책
- **빌드 설정에서 `noUnusedLocals: true`, `noUnusedParameters: true`로 설정됨**
- 미사용 import/변수/파라미터는 반드시 제거하거나 `_` 접두사 사용
- 씬 클래스에서 나중에 쓸 멤버는 `// TODO:` 주석과 함께 `_` 접두사 처리

### Phaser 씬 작성 규칙
- 씬 키(`{ key: 'SceneName' }`)는 파일명과 동일하게 유지
- `GameState` import 시 반드시 named export 방식: `import { GameState } from '../store/GameState.js'`
- `gameState` (소문자) 인스턴스는 존재하지 않음 — 항상 `GameState` (대문자) 사용

### 씬 전환 패턴 (중요 — 반드시 준수)
모든 씬 전환은 아래 패턴을 따름:

**FieldScene → 하위 씬 진입:**
```typescript
this.cameras.main.fadeOut(250, 0, 10, 20);
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.pause('FieldScene');
  this.scene.launch('TargetScene'); // start 대신 launch
});
```

**하위 씬 → FieldScene 복귀 (나가기 버튼):**
```typescript
this.cameras.main.fadeOut(220, 0, 10, 20);
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.stop();               // this.scene.stop('SelfScene') 아님
  this.scene.resume('FieldScene');
});
```

**FieldScene create() 에서 반드시:**
```typescript
this.events.on('resume', () => {
  this.cameras.main.fadeIn(300, 0, 10, 20);
});
```

**절대 사용 금지**: 하위 씬에서 `this.scene.start('FieldScene')` — FieldScene이 재생성되어 플레이어 위치, 상태 모두 초기화됨

### 한국어 주석 정책
- 모든 파일 상단 JSDoc 주석은 한국어로 작성
- 인터페이스/타입 필드의 설명 주석은 한국어로 작성
- 영어 주석도 혼용 가능하나, 핵심 설명은 한국어 우선

---

## 5. 게임 시스템 목록 및 구현 상태

### ✅ 완료된 시스템 (수정 금지)
| 시스템 | 파일 |
|--------|------|
| 물때 계산 (TideCalculator) | `core/src/simulation/TideCalculator.ts` |
| 낚시 입질 엔진 (FishBiteEngine) | `core/src/simulation/FishBiteEngine.ts` |
| 줄 물리 (LinePhysics) | `core/src/simulation/LinePhysics.ts` |
| 캐스팅 모델 (CastingModel) | `core/src/simulation/CastingModel.ts` |
| 날씨 모델 (WeatherModel) | `core/src/simulation/WeatherModel.ts` |
| 해루질 엔진 (NightHuntingEngine) | `core/src/simulation/NightHuntingEngine.ts` |
| 통발 시스템 (TrapSystem) | `core/src/simulation/TrapSystem.ts` |
| 어종 DB | `core/src/db-schema/FishDatabase.ts` |
| 장비 DB | `core/src/db-schema/GearSpecs.ts` |
| 스팟 DB | `core/src/db-schema/SpotDatabase.ts` |
| 미끼 DB | `core/src/db-schema/BaitDatabase.ts` |
| 해루질 생물 DB | `core/src/db-schema/ShoreCreatureDatabase.ts` |
| 통발 DB | `core/src/db-schema/TrapDatabase.ts` |
| 레시피 DB | `core/src/db-schema/RecipeDatabase.ts` |
| 어신앱 스팟 DB | `core/src/db-schema/AnglerAppSpots.ts` |
| 활동 타입 | `core/src/types/Activities.ts` |
| 라이선스 타입 + DB | `core/src/types/License.ts` |
| Phaser 씬: Boot | `client-pc/src/scenes/BootScene.ts` |
| Phaser 씬: MainMenu | `client-pc/src/scenes/MainMenuScene.ts` |
| Phaser 씬: WorldMap | `client-pc/src/scenes/WorldMapScene.ts` |
| Phaser 씬: RegionField (실지형 타일맵) | `client-pc/src/scenes/RegionFieldScene.ts` |
| Phaser 씬: Field (탑다운 재작성) | `client-pc/src/scenes/FieldScene.ts` |
| Phaser 씬: Fishing | `client-pc/src/scenes/FishingScene.ts` |
| Phaser 씬: TackleRoom | `client-pc/src/scenes/TackleRoomScene.ts` |
| Phaser 씬: TideChart | `client-pc/src/scenes/TideChartScene.ts` |
| Phaser 씬: AnglerLog | `client-pc/src/scenes/AnglerLogScene.ts` |
| Phaser 씬: NightHunting | `client-pc/src/scenes/NightHuntingScene.ts` |
| Phaser 씬: Trap | `client-pc/src/scenes/TrapScene.ts` |
| Phaser 씬: Restaurant | `client-pc/src/scenes/RestaurantScene.ts` |
| Phaser 씬: Condo | `client-pc/src/scenes/CondoScene.ts` |
| Phaser 씬: Cook | `client-pc/src/scenes/CookScene.ts` |
| UI: TackleSetupPanel | `client-pc/src/ui/TackleSetupPanel.ts` |
| UI: LicensePanel | `client-pc/src/ui/LicensePanel.ts` |
| UI: CoolingBoxPanel | `client-pc/src/ui/CoolingBoxPanel.ts` |
| UI: HUD (퀵슬롯+STATUS+커뮤니티) | `client-pc/src/ui/HUD.ts` |
| UI: MiniMap (3단계 크기 토글) | `client-pc/src/ui/MiniMap.ts` |
| UI: InfoOverlayPanel (인벤토리/퀘스트) | `client-pc/src/ui/InfoOverlayPanel.ts` |
| 퀘스트 DB | `core/src/db-schema/QuestDatabase.ts` |
| 경매 엔진 (AuctionEngine) | `core/src/simulation/AuctionEngine.ts` |
| 수산물 경락 시세 타입 + 어종 매핑 | `core/src/types/Economy.ts` |
| 어판장 수매가 산정 엔진 (농정원 API 연동) | `core/src/simulation/MarketPriceEvaluator.ts` |
| 통합 아이템 레이어 타입 (신선도/부패/변환 규칙) | `core/src/types/Item.ts` |
| 통합 아이템 DB (낚시점/마트/직판장/통조림) | `core/src/db-schema/UniversalItemDatabase.ts` |
| 무게추 봉돌 DB (고리/구멍/묶음추) | `core/src/db-schema/SinkerDatabase.ts` |
| 채비 추천 알고리즘 (지역/지형/물때/어종) | `core/src/simulation/RigRecommender.ts` |
| 루어 타입 + 카탈로그 (8종 17변종 — 타이라바 포함) | `core/src/types/Lure.ts` · `core/src/db-schema/LuresCatalogDB.ts` |
| 크기 등급(소/중/대) + 청물 주간·급심 게이트 | `core/src/simulation/SizeTierRules.ts` |
| 파이트 2D 물리 (측면하중·heading/displacement·movementProfile) | `core/src/simulation/FightPhysics2D.ts` |
| 회 뜨기 손질 FSM + 컷 판정 + 등급 | `core/src/simulation/ButcheryProcess.ts` · `core/src/db-schema/ButcheryProfiles.ts` · `core/src/types/Butchery.ts` |
| 회뜨기 수율 산출 (computeFilletYield — 양) + 회칼 3등급 DB | `core/src/simulation/ButcheryProcess.ts` · `core/src/db-schema/KnifeDatabase.ts` |
| UI: 회 뜨기 미니게임 패널 (방향 렌더·가이드 트레이스·회칼 게이팅·수율 결과) | `client-pc/src/ui/ButcheryPanel.ts` |
| 어종 실사 픽셀 이미지 에셋 (돌돔·용치놀래기 암/수 분기 포함 24종) | `client-pc/public/fish/` · BootScene 텍스처 등록 |
| 쿨러 스토어 — 매질(해수/얼음)·개체별 신선도 엔진·세이브 직렬화 | `client-pc/src/store/CoolerStore.ts` |
| 인벤토리 스토어 — 신선도 상태 그래프(8단계)·세이브 직렬화 | `client-pc/src/store/InventoryStore.ts` |
| UI: 쿨러 패널 (매질 3버튼·실시간 타이틀·드래그 이송·인벤토리로 넣기) | `client-pc/src/ui/CoolerPanel.ts` |
| 간이 SFX (WebAudio 합성 — 섭취음 등 오디오 에셋 전 플레이스홀더) | `client-pc/src/audio/Sfx.ts` |
| 피딩타임 계산기 (계절 시간창×조류×날씨) | `core/src/simulation/FeedingTimeCalculator.ts` |
| 보일링/스쿨링 필드 이벤트 (발생 롤·연출·착수 판정) | `client-pc/src/ui/FieldEventManager.ts` |
| 루어 채비 연산 (총중량/Cd/침강 프로파일) | `core/src/simulation/LureRig.ts` |
| 영역기반 라이브 필드 레이아웃 엔진 | `client-pc/src/data/SpotFieldLayouts.ts` |
| 포항 영일만 픽셀 지형 맵 데이터 | `client-pc/src/data/YoilBayFieldMap.ts` |
| 조류/수심 픽셀 시각화 렌더러 | `client-pc/src/ui/HydroCurrentRenderer.ts` |
| 월드맵 핀포인트 노드 타입 + DB | `core/src/types/WorldMap.ts` |
| WorldMapScene 전면 개편 (픽셀 지도 + 동적 핀 + 툴팁) | `client-pc/src/scenes/WorldMapScene.ts` |
| FieldScene 캐릭터 스프라이트 교체 (man/girl 에셋) | `client-pc/src/scenes/FieldScene.ts` |
| 에셋 이미지 공개 디렉토리 구성 | `client-pc/public/` |
| 지역 상세 타일맵 타입 + 맵 그래프 | `core/src/types/RegionMap.ts` |
| 실지형 지도 → 타일/콜리전 변환 도구 | `tools/build_region_maps.py` |
| RegionFieldScene (속초 7개 맵 타일 렌더+충돌+전환+캐스팅+수심 타일+조명·날씨) | `client-pc/src/scenes/RegionFieldScene.ts` |
| 속초 지역 타일 데이터 (7개 맵 JSON) | `client-pc/public/data/sokcho/` |
| 부산 지역 타일 데이터 (8개 맵 JSON — 감천 서·동/암남/백운포) | `client-pc/public/data/busan/` |
| 입질 시퀀스 엔진 (구부러짐 3단계·패턴 7종·챔질 판정·어종 mock) | `core/src/simulation/BiteSequenceEngine.ts` |
| 조류 물리 엔진 (조수/반탄/조경 Hit Zone/횡/본류 5존) | `core/src/simulation/TidalCurrentEngine.ts` |
| 해저 지형 프로필 (거리 기반 연속 지형 — 암초·수초·수심, 어탐 전제) | `core/src/simulation/SeabedProfile.ts` |
| 뒷줄견제 홀드 물리 (H = 그 지점 홀드 + 정렬도 진행) | `core/src/simulation/LineTensionPhysics.ts` |
| 해양기상 API (NMPNT — 전국 76개 관측소 실측 수온·시정) | `core/src/api-client/MarineWeatherApiClient.ts` + `db-schema/MarineStations.ts` |
| 기상청 단기예보 API (SKY·PTY·파고 + 지역 격자 11곳) | `core/src/api-client/KmaVilageFcstApiClient.ts` + `db-schema/KmaGridPoints.ts` |
| MAFRA 수산물 경락가 API (2023 계절 시세 재현) | `core/src/api-client/MafraAuctionApiClient.ts` |
| KOSIS 시도별 어획량 API | `core/src/api-client/KosisCatchApiClient.ts` |
| 공공 API 통합 수집 서비스 (Mock 폴백) | `core/src/api-client/ExternalApiService.ts` |
| 어판장 수매가 산정 엔진 (어종·길이·등급 반영) | `core/src/simulation/MarketPriceEvaluator.ts` |
| KST 시간 유틸 (타임존 무관 한국시간·주야간 판정) | `core/src/utils/KstTime.ts` |
| 공공데이터 출처 표기 DB (저작권 고지) | `core/src/db-schema/DataAttributions.ts` |
| Phaser 씬: FirstPersonFishing (1인칭 — 챔질/조류/조법/원투/루어/가이드) | `client-pc/src/scenes/FirstPersonFishingScene.ts` |
| Phaser 씬: Credits (데이터 출처·저작권 화면) | `client-pc/src/scenes/CreditsScene.ts` |
| Phaser 씬: Settings (조작·낚시 탭 — 로드 위치/릴 핸들) | `client-pc/src/scenes/SettingsScene.ts` |
| 게임 팩토리 (createGame + 싱글턴 가드 — 이중 생성 차단) | `client-pc/src/game.ts` |
| 외부 데이터 캐시 스토어 (API 스냅샷 + 티커/날씨/시세 접근자) | `client-pc/src/store/ExternalDataStore.ts` |
| 인벤토리/채비 스토어 (8소켓 + 루어/원투/편대 병렬 모드) | `client-pc/src/store/InventoryStore.ts` |
| 채비 추천 스토어 (지역·물때·어종 → 채비 추천 캐시) | `client-pc/src/store/RecommendationStore.ts` |
| UI: RegionHud (KST 시계·날씨 배지 2×2·미니맵·퀵슬롯·로그) | `client-pc/src/ui/RegionHud.ts` |
| UI: DraggablePanel 공통 베이스 (+화면 고정 히트 보정) | `client-pc/src/ui/DraggablePanel.ts` |
| UI: UtilizationPanel (채비 조립·루어 모드·편대·추천 배너 + 요리 탭) | `client-pc/src/ui/UtilizationPanel.ts` |
| UI: 상점/인벤토리/수량/확인 팝업 | `client-pc/src/ui/ShopPanel.ts` 외 |

### 🚧 구현 진행 중 / 미완료
상세 내용은 `IMPLEMENTATION_PLAN.md` 참고

### ⬜ 예약된 씬 (미구현)
| 씬 | 단축키 | 설명 |
|---|---|---|
| `CraftScene` | `U` | Green Hell 스타일 제작대 (드래그 앤 드롭) |
| `TournamentScene` | — | 실시간 낚시 토너먼트 |

---

## 6. FieldScene 탑다운 월드 구조 (2026-07-07 재설계)

FieldScene은 **바람의나라 스타일** 탑다운 4방향 이동 씬으로 전면 재설계됨:

- **월드 크기**: 2048 × 1536 픽셀 (TILE 16px 기준)
- **이동**: **방향키 전용** (WASD는 이동에서 분리 — 향후 별도 단축키 바인딩 예약)
- **카메라**: `startFollow(playerBody)` + `setBounds(0, 0, 2048, 1536)`
- **플레이어**: `physics.add.image` (충돌 바디) + `add.image` (실제 man 스프라이트 교체 방식)
- **구역 배치** (`ZONES` 상수):
  - 심해(상단), 낚시 포인트 3개, 통발 수역, 방파제 수평띠, 마을, 갯벌
- **건물** (`BUILDINGS` 상수): 낚시점/마트/식당/면허사무소/민박/어판장
- **근접 상호작용**: 건물에 60px 이내 접근 시 `[E]` 힌트 팝업 표시
- **씬 전환**: `pause + launch` 방식 (위 씬 전환 패턴 참고)

### FieldScene 단축키 전체 목록

| 키 | 기능 |
|---|---|
| `방향키` | 캐릭터 이동 (이동 **전용**) |
| `WASD` | 예약 — 향후 별도 기능 (`on('keydown-W', ...)` 이벤트 방식으로 추가) |
| `SPACE` / `ENTER` | 낚시 포인트 진입 |
| `E` | 건물/NPC 근접 상호작용 |
| `H` | 해루질 (NightHuntingScene) |
| `T` | 통발 관리 (TrapScene) |
| `C` | 요리 (CookScene) |
| `U` | 제작대 (CraftScene 예정; 현재 CookScene 임시 연결) |
| `L` | 면허 패널 토글 |
| `I` | 인벤토리 패널 토글 |
| `Q` | 퀘스트 저널 패널 토글 |
| `M` | 미니맵 크기 순환 (150 → 250 → 350px) |
| `V` | 조류/수심 오버레이 토글 (HydroCurrentRenderer) |
| `R` | 자전거 승·하차 (탑승 시 이동 속도 2배 — RegionFieldScene 공통, 낚시/상점 진입 시 자동 하차) |
| `1`~`8` | 퀵슬롯 선택 (상단 숫자키) |
| `ESC` | 열린 팝업 LIFO 닫기 → 마지막은 월드맵 복귀 |
| 마우스 클릭 | 클릭 위치로 자동 이동 |

---

## 6b. RegionFieldScene — 실지형 기반 지역 타일맵 (2026-07-14 신규)

WorldMapScene에서 지역(현재 속초)을 선택해 진입하는 **실제 지형 기반 탑다운 타일맵 필드**.

### 데이터 파이프라인
```
pixelazed/<region>/*.png  (실제 지형 지도)
        │  tools/build_region_maps.py  (색상 분류 → 타일 그리드 + POI)
        ▼
packages/client-pc/public/data/<region>/<mapId>.json
        │  RegionFieldScene.preload() this.load.json
        ▼
타일 렌더 + 충돌 + 맵 전환
```
- **재생성 명령**: `py tools/build_region_maps.py sokcho`
- **타일 문자 규칙**: `.`=육지/도로(이동가능) `~`=바다(이동불가·낚시) `#`=건물(충돌) `,`=잔디
- 지형 분류 규칙/색 팔레트를 바꾸려면 `tools/build_region_maps.py`의 `classify()` 수정 후 재생성.

### 씬 구조 (`RegionFieldScene.ts`)
- **top-level 씬** — FieldScene의 하위 씬이 아님. WorldMapScene에서 `scene.start('RegionFieldScene', { region })`로 진입, `ESC` → `scene.start('WorldMapScene')`.
- **맵 간 이동**: `scene.restart({ region, mapId, entryEdge, entryT })` — 지형 그래프(`SOKCHO_MAP_GRAPH`)의 링크 방향으로 엣지 접근 시 인접 맵 로드. 진입 엣지 반대편에서 스폰.
- **충돌**: 바다·건물 타일을 행 단위로 병합한 정적 바디 + `physics.add.collider`.
- **렌더**: 타일을 `generateTexture`로 1회 베이킹 후 이미지 배치(맵당 텍스처 캐시).
- **낚시 캐스팅**: 바다 인접 + 낚싯대(퀵슬롯 0) 상태에서 좌클릭 유지 → 차지 → 릴리즈 시 찌 캐스팅 연출(현재 미니게임 핸드오프 없음, 추후 FishingScene 연동 예정).

### 속초 맵 체인 (7개)
```
속초항 남측 ↕ 속초항 중앙 ↕ 속초항 북측 ↔ 연결로 ↔ 동명항 북측 ↕ 동명항 중앙 ↕ 동명항 남측(방파제)
(sokchohang_3   sokchohang_2   sokchohang_1   bridge   dongmyeonghang_1  _2  _3)
```

### 알려진 튜닝 항목
- 동명항 남측/중앙은 대부분 바다(방파제 낚시 맵) — 좁은 대각 통로는 `bridge_diagonals` 후처리로 통행성 확보했으나, 세밀 튜닝 여지 있음.
- POI는 현재 식당 아이콘 색만 자동 추출(제네릭 마커). 카페/마트 구분 및 건물별 상호작용(진입 씬 연결)은 추후.

## 6c. FirstPersonFishingScene — 1인칭 낚시 조작 (2026-07-22 기준)

캐스팅 착수 시 RegionFieldScene `pause + launch`로 진입. 종료는 `stop + resume`.

| 입력 | 기능 |
|---|---|
| `우클릭` | **챔질** — 초릿대 구부러짐 단계별 성공률 (1단계 5% / 2단계 20% / 3단계 100%, 릴리즈 구간은 실패) |
| `좌클릭 홀드` | 릴링 — 거리 좁힘. **화면 좌/우측 클릭 방향으로 채비 당김** (조류 순방향 1.4배 / 역방향 0.65배+리액션). **발앞 0.5m까지 다 감으면 채비 회수 → 탑다운 복귀**. 입질 1~2단계 중 1초 유지 시 입질 유도(70% 3단계 승격) |
| `좌클릭 탭` | 호핑 (루어 머리 들기) |
| `좌클릭 더블탭` | 트위칭/저킹 — 0.8s 쿨다운, 1m 상승 후 0.6m 하강 |
| `←`/`→` | 드리프트/착수 = **채비 횡 이동**(조류 방향·세기 연동 — 순류=크게 흐름·역강류=막힘, 릴링 병행 시 조금씩. 찌 채비는 찌 선행·속채비 후행 / 원투·루어는 직결) / 파이팅 = **로드 스티어**(횡 러닝 밀당, **+릴링 = 물고기 횡 견인**. 물고기 횡 러닝 반대쪽은 힘 상충으로 정지) |
| `↑ 홀드` | 드리프트 = 리프트(채비/루어 수심 상승, 떼면 재침강) / **파이팅 = 버티기(홀드)** (구 H) |
| `H` | (드리프트) 뒷줄견제 — **그 지점 홀드**(≈0.02m 미세 상승 후 정지, 침강·드리프트 정지, 정렬도만 진행) + 리액션 트리거. 목줄이 조류로 하류 θ(중간 조류 ~70°)만큼 스트리밍 → 밑밥 3D 겹침 동조 |
| `C` / 밑밥칸 클릭 | 밑밥 투척 (동조율) — **배합 밑밥 1회 25 소모**. **쿨러(기타 아이템) 미보유 시 불가** |
| `I` | **인벤토리 토글** — 쿨러 어획 드래그 이송 대상 + 슬롯 정리(사용/버리기). 파이팅/가이드 중 열림 불가 |
| 쿨러 좌측(어창) 클릭 | **쿨러 3x3 팝업** (쿨러 아이템 필요) — 우클릭 메뉴: 상세보기/**인벤토리로 넣기**/방생하기(확인창), **패널 밖 드래그 = 인벤 이송**. 하단 [해수 넣기(두레박+바다근처)]/[얼음 넣기(각얼음 소모)]/[비우기]. 타이틀에 매질·지속시간 실시간 표기. 탑다운은 `B` 키 |
| `SPACE` | 다시 캐스팅 (결과 화면에서) |
| `F1` / 우하단 `?` / 수심 패널 아래 가이드북 | 온보딩 가이드 4페이지 재열람 — **열람 중 낚시 진행 일시정지**(시계·날씨는 계속), 닫으면 재개 |
| `ESC` / 그만하기 | 인벤 → 쿨러 → 종료 순 LIFO. 종료 시 어획은 쿨러에 잔류(자동 이송 없음) |

- 어획 성공 시 **3선택지 팝업**: [쿨러에 보관하기(쿨러 미보유 시 비활성)] / [인벤토리에 보관하기] / [방생하기].
- 상태별 하단 조작 바가 drift/입질/파이팅에 맞춰 자동 전환.
- 파이팅: 텐션 30~80 유지, 70+에서 릴링 미끄러짐(저항), 88+ 릴링 강행 0.55s → 과부하 줄터짐.
- 설정(낚시 탭): 로드 위치 좌/우, 릴 핸들 좌/우 (로드 기준).

---

## 7. 빌드 명령어

```bash
# 전체 빌드
npx pnpm run build

# core 패키지만 빌드
npx pnpm --filter @tra/core run build

# client-pc 타입 체크만
npx pnpm --filter @tra/client-pc run typecheck

# 개발 서버 실행
npx pnpm --filter @tra/client-pc run dev
```

---

## 8. 금지 사항 (절대 위반 금지)

1. **`@tra/core`에 Phaser, DOM 관련 코드 추가 금지**
2. **`gameState` (소문자) 변수로 GameState 접근 금지** — 항상 `GameState` 싱글톤 직접 사용
3. **TideInfo 타입 변경 금지** — `highTideHeightCm`, `lowTideHeightCm` 필드는 필수
4. **SpotType 타입 임의 제거 금지** — `tidal_flat` 포함 전체 유지
5. **`@tra/core/src/index.ts` export 누락 금지** — 새 파일 추가 시 반드시 export 추가
6. **씬 키 변경 금지** — 씬 키는 파일명과 동일, 변경 시 main.ts도 함께 변경
7. **하위 씬에서 `scene.start('FieldScene')` 사용 금지** — 반드시 `scene.stop()` + `scene.resume('FieldScene')` 사용

---

## 9. 현재 빌드 상태 (2026-07-24 기준)

```
npx pnpm run build → ✅ 4/4 패키지 성공 (2026-07-24)
npx pnpm --filter @tra/client-pc run typecheck → ✅ 0 오류 (2026-07-24)
```

**최근 주요 변경 (2026-07-24 36차) — FP 조작 개편(←/→ 채비 이동·파이트 홀드 ↑) + 초릿대 색/가이드 + 인벤 신선도 실시간 + 뷰 폴리시** (사용자 7건 피드백 반영 — 빌드 4/4·typecheck 0):
- **[초릿대 색/가이드]** (`renderRod`): 5분절 전체 흰색 → **끝 2분절만 흰색(형광), 아래 3분절은 로드 블랭크색(0x16161a)**. **분절마다 원줄 가이드 링 복원** — 조인트에 `u`(로드 진행 0~1) 저장, 가이드 크기/굵기를 u로 산정(버트쪽 크게·팁쪽 작게, 분절 수 무관). 팁 최말단은 형광 마커가 대신(가이드 제외).
- **[인벤 신선도 실시간]** (`InventoryPanel`): 껐다 켜야 반영되던 문제 → **1초 주기 타이머 + 상태 시그니처 비교**로 전이 시에만 그리드 리랜더. `renderGrid`가 아이템별 `refreshCondition` 호출(렌더 시점 실상태) + `condSig` 저장. 드래그 중엔 스킵, destroy 시 타이머 해제.
- **[설정 단축키 현행화]** (`SettingsScene`): 구 필드 전용 평면 목록 폐기 → **섹션 3분류(필드/1인칭 낚시/파이팅) 2열 레이아웃**(`HOTKEY_SECTIONS`). 이번 개편(←/→ 이동, ↑ 버티기 등) 전부 반영.
- **[파이트 홀드 키 H → ↑]** (`updateFighting`): 버티기(홀드)를 **방향키 ↑**로 이동(구 H). fight/fatigue update의 holding 소스 + 안내 문구(패턴/컨트롤 바/stateText) 전부 ↑로 통일. 드리프트 뒷줄견제는 H 유지.
- **[←/→ 채비 횡 이동]** (`updateDrift` + `lateralMoveRate` — Task 7 §1·2): 구 드리프트 다트(keydown) 폐기 → **홀드 폴링 횡 이동, 조류 방향·세기 연동**. 순류=많이/과감히, 역강류=막힘(제자리, 릴링 병행 시 조금씩), 정지/역약류=보통. 찌 채비는 **찌(floatX) 선행 이동·속채비(baitX) stepUnderwater 추종**, 원투·루어는 직결. 수평뷰(§2)는 찌를 중간 노드로 한 **원줄(나→찌)+목줄(찌→미끼)** 2세그먼트 렌더로 정합.
- **[파이트 ←/→ + 릴링 = 물고기 견인]** (`updateFighting` — Task 7 §3): 릴링+방향키 시 물고기(f2dPos.x)를 그 방향으로 서서히 견인(수평/정면뷰 공유). **횡 러닝 반대쪽 견인은 힘 상충으로 정지**(조류처럼). `TUNING.fightPull.lateralStagePerSec`.
- **[FP 뷰 폴리시]** (FP_HOLD_AND_VIEW_POLISH): ① **뒷줄견제 미세 리프트** — 구 HOLD_LIFT_M 2m 급상승 → `TUNING.hold.liftM(0.02)`/`liftRateMps(0.2)` 거의 제자리 ② **조경 포말** — 착수면 전역 ±150px → **찌 실제 위치 ±`foam.spreadPx(30)`** 좁게 뭉침 ③ **정면뷰 그라데이션** — 바다 8밴드 → **14밴드 반전**(상단 어둡게/깊게→하단 옅게, `view.seaBands`), 하늘 4앵커 → **12밴드 보간**(`view.skyBands`).
- **[밑밥 3D 겹침 동조]** (`needleSyncPos` + core computeChumSync — Task 5): 동조 판정 미끼 위치를 **뒷줄견제 목줄 스트리밍**(홀드+조류로 하류 θ, 중간 조류 ~70°, 얕아짐)으로 보정 → 밑밥 파슬(같은 조류 틸트)과 3D 겹칠 때 동조 급상승. `TUNING.leader.*`(baseDeg/holdDeg/curGain/maxDeg/defaultLenM). core sync식(depthGate×horizNear=AND 겹침)은 기존 구조가 이미 충족.
- **[tuning.ts]** 신설: `hold`/`foam`/`view`/`castMove`/`fightPull`/`leader` 섹션 + META 슬라이더 13종(F8 라이브 튜닝). ⚠ 이동 강도·견인·목줄각은 **mockup 값** — 실테스트 후 조정 예정(사용자 지침).
- 잔여(차기): 밑밥 3D 겹침의 수평/수직뷰 겹침 글로우 렌더, 횡 이동 시 정면뷰 heading 미세 반영, 강도 5단계 플레이 튜닝.

**이전 변경 (2026-07-23 35차) — 로드 벤딩 rev2 (하중 side 5분절 점증 · 일자 축 재교차 금지)** (ROD_BEND_SPEC rev2 반영 — 33차 OUT_AMP 되말림 폐기. 브라우저 4케이스+극한 클램프 검증, 빌드 4/4·typecheck 0):
- **[폐기]** 33차 비대칭 증폭(OUT_AMP 2.6)의 되말림 — 누적 ~190° 회전이 로드 일자 축을 뒤로 재교차해 **"초릿대가 늘어난 것처럼"** 보이던 문제 (사용자 지적 "일자 축 뒤로 넘어오면 안 됨").
- **[renderRod rev2]** (`FirstPersonFishingScene`):
  - **§3-1 하중 side 판정**: sideSign = sign(cross(일자축, tip→하중앵커)) — 앵커 = 드리프트 시 찌/수면 진입점(groupTopWorld), **파이트 시 물고기 스크린 좌표**(신규 `fightFishScreen` — renderRigVisuals 파이팅 브랜치가 기록). 좌/우 프리셋 **자동 미러**(정적 부호 없음).
  - **§3-2 초릿대 5분절 점증**: 버트~초릿대 시작(58%)은 직선(두께·그립/블랭크 색 그라데이션 유지 — widthAt(u) 연속식), 초릿대(tipLenRatio 0.42)를 tipShare [0.08,0.14,0.20,0.26,0.32]로 분절 — **끝으로 갈수록 큰 각도**로 하중 쪽 회전.
  - **§3-3 축 재교차 금지 클램프**: 누적 벤딩 ≤ maxTipBendDeg(90°) — 팁 접선이 축 수직에서 멈춰 **어떤 극한 하중에서도 축을 되넘지 않음**(검증: bend 200° 입력 → smDeg 정확히 90) + 팁 끝 side 부호 안전장치(재교차 감지 시 벤딩 축소).
  - **§3-4 강도 가산**: raw = (입질 bendDeg+baseTension·22) × (1 + nearGain·근접 + offscreenGain·화면밖). ⚠ 드리프트 중 찌는 32차 뷰 팬 클램프(≤420px 오프셋)로 항상 화면 안 → **offscreenGain은 파이트 물고기 앵커(클램프 30~1250px)에서만 실발동** — 설계상 정합.
  - **§3-5 스무딩**: `rodBendSmDeg`(부호 포함 도, lerp 0.25) — 찌가 축을 좌↔우로 넘나들 때 0을 지나며 전환(팝 없음). 가이드 링·릴 장착면은 mountSign 정적 유지.
- **[tuning.ts]** `rod.tipSegments/tipShare/maxTipBendDeg(90)/nearGain(0.8)/offscreenGain(1.6)/tipLenRatio(0.42)/smoothLerp(0.25)` + **META 슬라이더 4종**(maxTipBendDeg·nearGain·offscreenGain·tipLenRatio — F8).
- **[검증]** 우 프리셋: 찌 우측 +56.4°(우 굴곡)/좌측 −56.4°(미러) / 극한 200° 입력 → 90° 클램프(스크린샷 = 접선 수직에서 멈춤·되말림 없음) / 좌 프리셋 + 우측 하중 → 우 굴곡(자동 미러). ⚠ IDE stale-dist 재현: tuning 신규 필드 추가 후 client가 옛 타입 봄 — `pnpm --filter @tra/core run build` 선행 필수 (31차 동일 패턴).
- **[보강 — 일직선 궤도 케이스]** (사용자 감사 질문에서 발견): 하중이 로드 일자 축 위에 있으면 측면 모멘트가 없는데, sign(cross)×풀벤딩 구현은 **임의 +측으로 풀꺾임**(cross=0 → +1)하던 빈틈 — sin(축→하중 각) **연속식**으로 교체: 정렬 시 벤딩 0으로 수렴, 이탈할수록 램프. 축 스침 시 사이드 스윕(±56° 왕복)도 자연 소거(축 근처 크기 자체가 0).
- **[보강2 — 전방 말림(포어쇼트닝) + 측면 파워 램프]** (사용자 2차 감사 질문 — "축 위라도 초릿대쪽=길이유지·손잡이쪽=2단 짧아짐", "5° 이탈은 거의 티 안 나게"):
  - **축 성분 분해**: sin(측면)·**cos(축)** 를 함께 취해, 하중이 **축 너머(cosθ>0=순수 인장)면 초릿대 길이 유지 / 손잡이(릴) 쪽(cosθ<0=축 역하중)이면 z(깊이)로 말려 투영 길이 축소**. `fold = foldMax·handleSide01·alignFrac·forceFrac`, 초릿대 분절 투영 길이 ×(1−fold·(i/4)) — 팁쪽일수록 축소, 총 축소 = fold×0.5 (**foldMax 0.8 → 강한 하중 시 최대 2/5 = 5단 중 2단**, 힘 강도 비례). 측면으로 꺾이면(alignFrac↓) 말림은 양보.
  - **측면 램프 파워 커브** `latMag = (|sinθ|/sinRef)^latRampPow(1.6)` — 축 근처 5° 소이탈은 거의 티 안 나게, alignRefDeg에서 풀 벤딩.
  - TUNING `rod.alignRefDeg(20)·latRampPow(1.6)·foldMax(0.8)` + META 슬라이더 3종. 검증(강한 하중 90° 클램프): **축 정렬(sx784) bend −0.3°·fold 0.797**(초릿대 짧고 곧음 — 스크린샷 팁 y280) / +0.5m(≈7°off) bend 4°·fold 0.763(거의 티 안 남·여전히 말림) / +6m bend 90°·fold 0(풀 측면 굴곡·전장 — 스크린샷 팁 y145). 전이 연속(fold 0.42→0.80→0.57→0.26→0.07→0).

**이전 변경 (2026-07-23 34차) — 밑밥 확산 rev2 전면 적용(CHUM_DIFFUSION_SPEC) + 지역 채널 채팅 스크롤백** (감사 문서 반영 — 브라우저 수치/시각 검증 완료, 빌드 4/4·typecheck 0):
- **[감사 판정]** rev2 스펙(3뷰 클립·8초 수명·타원 틸트·지형 코팅)은 **체크리스트 #2~#10 전부 미적용** 상태였음(외부 에이전트 미반영): 수명 55s 선형 페이드·3뷰 전부 fillCircle·마스크 없음·전역 zMaxM만 알고 국소 지형 무시(수직뷰 관통)·코팅/조류 감쇠 침강/바닥 보너스 없음. 동조 0%는 버그가 아니라 좁은 수심 창(σz 0.8) 통과 미스로 판정(파슬=미끼 위치 배치 시 100% 정상 — 경로 이상 없음).
- **[core `ChumPhysics` rev2]** `ChumParcel` 확장(vx/vd/vz 속도벡터 + contacted/contactAgeSec): ① **수명 8s**(`TUNING.chum.lifetimeMs`, ttl 기본값 교체 — `isChumExpired` = 수명 or 코팅 종료) ② **조류 감쇠 침강** `sink = max(minSink, typeSink·(1−damp·cur01))`(cur01 = |조류|/currentRefMps — 강조류일수록 느리게, 실측 grain 0.9→0.36) ③ **연속 농도 α** `chumAlpha01 = alphaStart·(1−t01^pow)`(코팅 중 coatMs 선형과 min) ④ **타원 반경** `chumEllipseRadii`(장축 = 시간+속도·elongK 신장 / 단축 rMinorMaxM 캡) ⑤ **지형 접촉**: stepChum에 `bedDepthAt` 콜백 주입 — 틸트 반영 수직 반경(zHalf)으로 관통 금지 클램프 + 접촉 시 코팅 시작(정지) ⑥ **바닥 동조 보너스**: `computeChumSync(p, bait, {baitNearBottom})` — 코팅 파슬 × 바닥층 미끼 = +bottomSyncBonus×horizNear (실측 0.87→1.0). `optimalThrowX` tSink 수명 캡·`predictChumPath` 지형 반영. index.ts export 추가.
- **[TUNING 배선]** `chum.*` 15항목(lifetimeMs/alphaStart/alphaCurvePow/minSinkMps/currentSinkDamp/currentRefMps/rMajor0/rMinor0/spreadMajorMps/spreadMinorMps/rMinorMaxM/elongK/tiltMaxDeg/coatMs/coatClearanceM/bottomSyncBonus) + `frontSplash.*`(seepFadeMs/leanK) + **META 슬라이더 7종**(F8). 종류별 기본 침강은 기존 chumTypes.sinkRate가 baseSink 역할(경단=심공 전략 유지).
- **[FP 씬 3뷰 렌더 교체]** 전용 레이어 3개 + **지오메트리 마스크**(chumFrontG 수면 밴드 / chumPlanG 수평뷰 박스 / chumDepthG 수심 게이지 박스 — 창 밖 오버플로 클립, scrollFactor 0 + shutdown 파괴): ① **정면 = 표면 착수 확산(스며듦)만** — 갈색 타원 2~3겹이 가로로 번지며 seepFadeMs(1.8s) 페이드, 조류 쪽 기움(leanK). 구 침강 구름 원 완전 제거(깊은 침강은 수직뷰 전담) ② **수평뷰** = (vx,vd) 속도 방향 **회전 타원**(`drawTiltedEllipse` — save/translate/rotateCanvas) ③ **수직뷰** = (vx,vz) 틸트 타원(수직 기준 ±tiltMaxDeg 클램프 — 완전 수평 금지) + **지형 코팅 밴드**(접촉 d 주변 바닥 윤곽 따라 갈색 띠, 슬로프 번짐 + 2s 페이드). 지오메트리 단일 소스화: PLAN_*/DP_* 모듈 상수 + planMapping()/depthGaugeYOf() (렌더·마스크·코팅 공유).
- **[검증]** ttl 8s / 9초 후 파슬 0개 / 감쇠 침강 vz 0.36 / 관통 없음(z 6.8 ≤ bed 7.34, contacted) / 인게임 동조 60% 표시 / 3뷰 스크린샷 = 타원·틸트·마스크 클립·표면 스며듦 확인. ⚠ **밸런스 함의**: 8s 수명이라 심수(6m+) 미끼는 중층 통과 동조 ≈ 0 (시뮬 실측 — 구 26차 리드 지표는 재기준 필요). rev2 밸런스 = 상층~중층 동조 + 얕은 바닥 코팅 보너스 중심, 필요 시 lifetimeMs 슬라이더(5~10s)로 조정.
- **[지역 채널 채팅 — RegionHud]** 구 "최근 7줄 하드컷 + 클립 없음"(텍스트가 입력란 아래로 관통) → **3영역 고정**(헤더/로그 뷰포트/입력란): ① 로그 컨테이너 **지오메트리 마스크**(scrollFactor 0 — 카메라 스크롤 씬 정합, 33차 교훈) = 입력란/창 밖 관통 원천 차단 ② **200줄 보존 + 스크롤백** — 워드랩 단일 멀티라인 Text를 y=−scrollY 이동 ③ **휠**(패널 호버 시만)+**스크롤바**(비율 썸, 안 넘치면 숨김, 썸 드래그/트랙 점프) ④ **auto-stick** — 하단이었으면 새 메시지에 자동 스크롤, 과거 열람 중이면 위치 유지(실측 374 유지). destroy에서 씬 입력 핸들러/마스크 정리.
- 잔여(차기): chumSyncSim 지표 재기준(8s 수명 반영 리포트 개편), 코팅 밴드 시인성 튜닝(현재 α 0.55×페이드 — 어두운 지형에서 흐릿), 채팅 [이동]/[낚시] 태그별 색 분리(현재 단색 유지).

**이전 변경 (2026-07-23 33차) — 낚싯대 벤딩 방향 동적화(측면하중 정합) + 상세보기 마스크 카메라 스크롤 버그 수정** (32차 후속 피드백 2건 — 브라우저 좌/우/마스크 검증 완료, 빌드 4/4·typecheck 0):
- **[수정] 낚싯대 벤딩 방향 = 힘의 방향(라인 앵커)** (`FirstPersonFishingScene.renderRod`): 구 `bendSign = right ? -1 : 1` 정적 고정이라, 32차에서 찌가 조류로 로드 쪽(우측 로드=우측)으로 흐르거나 물고기가 그쪽으로 저항해도 로드는 항상 좌측으로 꺾이던 물리 모순 — **앵커(찌/수면 진입점/물고기 = groupTopWorld)가 로드 축의 어느 측면에 있는지(cross 부호)로 벤딩 방향 결정**.
  - **비대칭 증폭(2.5D 원근)**: 물 쪽(장착면 방향) 벤딩 = 실제로는 앞바다로 숙이는 동작이라 원근 축소 ×1(기존 승인된 "앞으로 숙임" 유지) / 반대쪽(로드 사이드) 벤딩 = 화면 평면 내 회전이라 ×`OUT_AMP`(2.6) — 강한 입질/파이트에서 **초릿대가 찌 쪽으로 아래로 감기는 훅** 연출 (사용자 빨간 곡선 명세 반영). 부호·배율은 `rodBendLat` lerp(0.12) 스무딩 — 찌가 로드 축을 넘나들 때 팝 방지. **가이드 링·릴 장착면은 `mountSign` 정적 유지** (물리적으로 로드에 고정된 면 — 힘 방향으로 뒤집히지 않음).
  - 검증(로드 우측 설정·bend 55°): 찌 우측(+10m) = 로드가 우측으로 크게 감김 / 찌 좌측(−10m) = 기존 좌측 수평 숙임 그대로.
- **[수정] 상세보기 마스크 카메라 스크롤 어긋남** (`ItemDetailPanel`): 32차 스크롤 마스크 Graphics가 디스플레이 리스트 밖(scrollFactor 기본 1)이라, **카메라가 스크롤된 씬(RegionFieldScene 상점 등)에서 GeometryMask 지오메트리가 스크롤량만큼 어긋나 콘텐츠가 패널 중간에서 잘리던 버그**(32차 검증이 MainMenuScene 스크롤 0에서만 수행돼 누락) — `maskShape.setScrollFactor(0)` 1줄. 검증: 카메라 (420,260) 스크롤 + 강제 오버플로 상태에서 콘텐츠 정상 표시·휠로 최하단(상점 매입가) 도달·스크롤바 이동. (참고: InfoOverlayPanel 마스크는 패널·마스크가 둘 다 월드 좌표로 일관돼 미수정.)

**이전 변경 (2026-07-23 32차) — FP 찌/원줄 조류 드리프트·챔질 놓침 후 찌 복귀 + 팝업 스크롤(Tackles/상세보기)** (사용자 3건 피드백 + typecheck 교정 — 브라우저 수치/시각 검증 완료, 빌드 4/4·typecheck 0):
- **[Task 1 — 정면뷰 찌/원줄 드리프트 반영 + H 홀드 펴짐]** (`FirstPersonFishingScene.ts`):
  - **정면뷰 찌 드리프트**: `viewCenterX`가 찌(`rig.floatX`)를 추종해 정면뷰 찌가 항상 화면 중앙에 고정 → 조류 드리프트가 상쇄돼 안 보이던 문제. **뷰 중심을 캐스터(원점) 고정으로 전환**(수평뷰와 정합) + 찌가 화면 밖으로 나가려 하면 그만큼만 팬(`VIEW_EDGE_MARGIN` 220px 클램프)해 시야 유지. → 찌·원줄(로드팁→찌)이 조류 따라 흘러가는 게 보인다. **검증**: 5초에 floatX −0.34→−2.98m 흐를 때 정면뷰 찌 화면 X 631.8→568.5px(−63px) 이동.
  - **H 뒷줄견제 = 찌 정지 + 속채비 하류 펴짐**: 기존엔 `driftBrake=0`으로 찌는 멈추나 `stepUnderwater`가 baitX를 (멈춘)찌로 수렴시켜 line이 수직으로 모였음. **홀드 중 baitX를 조류 하류로 밀어**(`SUBRIG_EXTEND_K`×tide.x×(0.35+0.65·정렬도A)) 찌 하류로 벌어지게 = "조류 방향으로 펴지는" 연출. **검증**: 홀드 3초 floatX 0.000m(정지) / 속채비 하류 오프셋 baitX−floatX −2.29m(조류 부호 동일).
- **[Task 2 — 강한 입질 후 챔질 놓쳐도 찌 원위치 복귀]** (`FirstPersonFishingScene.ts`): 3단계 입질 = `floatSubmerged` 완전 잠김 래치가 회수 전까지 리셋 안 돼, 챔질 타이밍을 놓치면 찌가 잠긴 채 안 떠오르던 버그. **`seq.ended`(어신 종료)·챔질 실패 경로에서 래치 해제** + 신규 `floatSinkVisM`(잠김 보간값, dt·8 ease)을 렌더(sinkPx·bitePull)가 소비 → 찌가 **급전환 없이 부드럽게 원래 수면으로 떠오름**. init/recast 시 리셋. **검증**: 잠김(래치 true, sink 0.40) → 래치 해제 시 찌 재등장(브라우저 스크린샷).
- **[Task 3 — 팝업 오버플로 교정(캡+스크롤바)]**:
  - **Tackles 부품 선택 리스트** (`UtilizationPanel.ts`): 25+ 항목이면 listH가 패널(620)을 넘겨 `ly` 음수 → 화면 위로 잘려나가던 문제. **`mountChooserList` 공용 헬퍼** 신설 — **최대 11행 캡 + 우측 스크롤바 + 휠 스크롤**, 마스크 대신 **보이는 행만 생성(윈도우드 렌더)**해 스크롤아웃 행의 팬텀 히트 방지(드래그 패널이라 마스크+카메라 회피). `openChooser`/`openSpreaderBaitChooser` 둘 다 이 헬퍼 사용. **검증**: 30행 → 11행 표시 "(30개·휠 스크롤)" + 스크롤바 + 휠로 2~12행 이동.
  - **아이템 상세보기** (`ItemDetailPanel.ts`): 어획물 상세(이미지+어종 13행+설명+신선도)가 fullH ~700+로 화면을 넘겨 잘림. **높이 캡(`GAME_HEIGHT−20`)+위치 클램프(화면 안)** + 본문을 스크롤 컨테이너(`body`)로 분리해 초과 시 **마스크+휠+스크롤바**(InfoOverlayPanel 패턴, 마스크는 매 프레임 패널 위치 동기화·destroy 정리). 판매가는 설명 아래로 흘려 배치. **검증**: (1000,40) 요청 → x 952 클램프·bottom 608~712 ≤ 720(화면 안), 이미지 포함 렌더 정상. 고정 높이 패널(Shop 596·Inventory 596·Status 520·Equip 620 등)은 720 이내라 이상 없음.
- **[typecheck 교정]** 사용자 요청 — 원인은 소스 문제가 아니라 **stale한 `@tra/core` dist**(31차 참고). `pnpm --filter @tra/core run build` 재빌드로 0 오류, 이후 전체 `pnpm run build` 4/4 성공.
- 잔여(차기): 상세보기 스크롤은 극단적 긴 내용(현재 어획물 최대 ~694 < 700 캡)에서만 발동하는 안전망 — 실발동 케이스 관찰 필요. 다른 팝업 툴팁(ShopPanel 등) 세부 점검.

**이전 변경 (2026-07-23 31차) — 텍스트 선명도 개선 (최종 present 스무딩 — 픽셀아트 내부 렌더 유지)** (사용자 "작은 폰트 뭉개짐/가독성" 피드백 — 라이브 dev 렌더 + before/after 스크린샷 검증):
- **[근본 원인] FIT 비정수 업스케일의 NEAREST present**: 게임은 `pixelArt:true`(→`antialias:false`)라 Phaser가 캔버스에 inline `image-rendering:pixelated`를 걸고(`CreateRenderer.setCrisp`), 1280×720 프레임버퍼를 창 크기로 **계단식(NEAREST) 확대** → 대부분 모니터에서 1.5배 등 비정수 배율로 7~12px 작은 글자가 뭉개짐. Phaser 3에서 텍스트 `resolution`은 0→1 강제(`Text.js`) + FIT 고정 프레임버퍼가 병목이라 resolution만 올려도 화면 디테일이 안 늘어 효과 미미(되레 NEAREST 다운샘플 손해 가능).
- **[해법] 마지막 present 단계만 bilinear** (`packages/client-pc/index.html` — 1지점): `canvas { image-rendering: auto !important; }`. author `!important`가 Phaser의 normal inline `pixelated`를 이겨 both(스타일시트 기본 + Phaser inline) 덮어씀. **내부 렌더는 pixelArt(NEAREST) 그대로** — 타일 베이킹·도트 에셋 내부 선명도 불변, 오직 프레임버퍼→창 확대만 스무딩. res 1의 브라우저 폰트 안티앨리어싱이 1:1 블릿으로 프레임버퍼에 보존돼 스무딩 확대 시 매끄럽게 표시됨.
- **[검증] 1920×1080 뷰포트**(FIT 1.5배 업스케일): computed `image-rendering: auto` 확인(inline pixelated override 성공), backingStore 1280×720 / cssSize 1920×1080. 좌하단 실시간 데이터 패널(작은 폰트) before(pixelated)/after(auto) 크롭 비교 = 계단식 뭉개짐 → 안티앨리어싱 매끄러움. 트레이드오프: 스프라이트/타일도 비정수 배율에서 약간 부드러워짐(기존엔 들쭉날쭉 계단식 — 사용자 승인한 방향).
- ⚠️ **HTML 전용 변경이라 tsc와 무관.** (초기 진단 정정: 당시 client typecheck 실패는 소스 불일치가 아니라 **stale한 `@tra/core` dist 아티팩트**가 원인 — 소스 `tuning.ts`는 `float`/`subfloat`/`zone`/`seabed`/`retrieve.growFactor` 등을 이미 갖고 있었으나 dist가 07-22 빌드본이라 옛 타입 노출. `pnpm --filter @tra/core run build` 재빌드로 0 오류 해소. 정상 플로우 `pnpm run build`는 core→client 순 빌드라 애초에 재현 안 됨.)
- 잔여(선택): 스무딩 후에도 7~9px(약 62곳)은 크기 한계선 — 필요 시 최소 폰트 플로어(예: <10px → 10px) 별도 적용 가능(밀집 패널 레이아웃 오버플로 검증 필요).

**이전 변경 (2026-07-23 30차) — FP 찌 채비 심화 (지형 관통 클램프·구멍찌/수중찌 분리·입질 잠김 래치·연속 투명도)** (FP_FLOAT_RIG_DEPTH_SPEC 반영 — 빌드/타입체크 통과 + 수치 검증):
- **[핵심 버그 수정] 채비 지형 관통 클램프** (`updateDrift` — 수심 패널 "채비 5.2m / 바닥 3.6m" 관통 현상): `stepUnderwater`의 zMaxM은 **하강 한계일 뿐 이미 깊은 채비를 끌어올리지 않아**, 깊은 물에서 가라앉은 채비가 얕은 여밭(융기)으로 흘러올 때 릴링 상승(0.28m/s)이 융기 속도를 못 따라가 바닥을 파고들던 실버그 — **매프레임 `바닥−rigClearanceM(0.15)` 위로 followRiseMps(3.0)로 부드럽게 클램프** (찌/원투/루어 공통, 수심 패널 자동 정합. 검증: 5.2m→3.45m/0.58s). **조경지대 급수직강하 완화**: `influence.sinkMult`에 상한 `zone.sinkMultCap(1.6)`.
- **[분리] 구멍찌/수중찌** (`drawFloatShape` 흰 몸통 제거 → 주황 몸통+스템+수면 밴드 / `drawSubFloatShape` 흰 구슬 신설): 수중찌는 드리프트·파이트 내내 잠겨 숨김, **회수 후반 앵커 [appearFrom(0.90)→0, 0.95→0.10, 1.0→1.0]**로 등장하며 잠김 깊이(buoyancyDepthM 0.8)에서 구멍찌 곁까지 상승.
- **[신규] 입질 단계별 구멍찌 잠김** — 잠김 깊이 = `TUNING.float.biteDipS1~S3M`(0.06/0.14/0.40m — core 진폭 0.05/0.10/0.25 대비 배율 재매핑, core 불변) → **잠김px/biteFadeSpanPx(26) 연속 α 페이드**(1단계 α0.79 살짝→복귀 / 2단계 α0.52 / 3단계 α0 완전 잠김). **`floatSubmerged` 래치**: 3단계 진입 or 파이트 시작 = 완전 숨김 유지(원줄은 수면 진입점 종단), 회수 approach≥0.90부터 수면 위로 떠오르며 재등장(≥0.999 해제). 리셋: init/recast.
- **[헬퍼] `invLerp01`/`piecewiseLerp`** — "분기점 급전환 금지" 공통 유틸 (기존 rigApproachAlpha/shadowApproachAlpha도 piecewise로 리팩토링. 검증: 그림자 9.3/10 = 0.22 자동 보간).
- **[tuning.ts] 신설**: `seabed.rigClearanceM/followRiseMps`, `zone.sinkMultCap`, `float.biteDipS1~S3M/biteFadeSpanPx`, `subfloat.buoyancyDepthM/appearFrom` + META 슬라이더 5종 (F8 라이브 튜닝).
- 참고: 목줄/바늘 분기(§6)는 기존 구조가 이미 충족 — 활성 파이트 = 세트 숨김·그림자+목줄만(바늘 미표시) / dragIn = 그림자가 미끼 아이콘 대체 / 단순 릴링 = 후반 램프 α로 바늘·미끼 표시.

**이전 변경 (2026-07-23 29차) — 접근 연출 피드백 5건 반영 (후반 램프 α·방향 그림자·대각 이동·고스트 제거·조류 셰브론)** (인게임 스크린샷 피드백 — 빌드/타입체크 통과 + 곡선 수치 검증):
- **[정정 ①] 수중 채비 후반 램프 α** (`rigApproachAlpha` — 구 easeOutCubic(vp) α는 절반 거리에서 이미 88% 노출되던 문제): **선형 이동 비율 기준** 7/8 지점 α0.10(투명 90%) → 7.5/8 α0.55 → 도달 α1.0 그라데이션, 그 전엔 완전 숨김 (스샷 케이스 18.4m/22m = α0). **루어 = 원줄이 수면에 꽂힌 느낌**: 원줄은 수면 진입점(마커)에서 종단, 수면 아래 원줄 항상 비표시, 루어 자체도 후반 램프로만 등장.
- **[정정 ②] 파이트 물고기 = 방향 타원 그림자 전담** (`drawFishShadowOriented` — 정면 물고기 아이콘 + 구 fishShadow 타원 트윈이 겹치던 문제 → 둘 다 폐기): 장축 = heading(좁은 끝 = 머리/꼬리), **머리 끝 좌표를 반환해 목줄 연결점 보장**. `shadowApproachAlpha` 9/10 α0.10 → 9.5/10 α0.30 → 도달 α0.50(그림자는 완전 불투명 없음) + `shadowApproachGrow` 0.6→1.3배 크기 증가. 활성 파이트/dragIn(drawSetFish) 공통. 수중 목줄도 접근 램프 α(×0.6)로 함께 숨김/등장.
- **[신규 ③] 파이트 대각 이동**: 물고기 횡 견인(f2dPos.x)의 일부(×0.35×0.45, ±70px 클램프)가 **찌/원줄 앵커에 반영** — 수평뷰 좌상+수직뷰 하강 이동 시 정면뷰도 완만한 대각(~15° 체감)으로 딸려간다. 수직은 distM(줄 풀림/감김)이 기존 구동.
- **[제거 ④] 밑밥 예측 드리프트 고스트 기본 off** (`TUNING.chumThrow.predictGhost = false`): 투척점 스냅 행은 유지, 흘러갈 경로 점선·동조 피크 ✳·"(투척 예측 N%)" 표기 제거 — **수평뷰 조류를 보고 감으로 리드**를 잡는 플레이 유도 (dev 패널에서 재활성 가능).
- **[신규 ⑤] 수평뷰 조류 강도 셰브론**: 단일 화살표 → **강도 3단계 화살촉 개수** (약함 < 0.15 = 1개 / 중간 = 2개 / 매우 강함 ≥ 0.40 = 3개) — 흐름 방향으로 나란히 배치.

**이전 변경 (2026-07-23 28차) — FP 착수→침강→회수 접근 연출 (거리 기반 크기·투명도)** (FP_CAST_RETRIEVE_SPEC 반영 — 이전 "중앙·3배" 정정 → **70% 지점·2배**. 빌드/타입체크 통과 + 매핑 수치 검증):
- **[규칙] 거리 → 크기·투명도** (`updateRetrieveGroup` — approach = 1−distM/castDist, **vp = easeOutCubic(approach)** 하나로 위치·크기·투명도 전부 구동): 착수 시 채비 세트 = **castScaleMin(0.72)·수중 채비 α0(숨김)** → 릴링/파이트/전방 조류로 끌려올수록 커지고 불투명 복구 → **70% 지점(anchorYRatio 0.70) 도달 시 2배(growFactor)·완전 불투명**. 검증: distM 25→0.5에서 y 268→504·scale 0.72→1.44·수중α 0→1.
- **[규칙] 원줄 = 물고기보다 2배 투명**: 원줄 α = 채비α × **mainLineAlphaFactor(0.5)** (vp 0.5에서 물고기 0.53·원줄 0.25 — 스펙 예시 정합). 수면 위 구간은 드리프트에서도 하한(0.25)으로 연하게 보임. **비파이트 원줄색 = 연한 흰색(0xeef6ff) / 파이팅 = 텐션 색**(느슨 파랑/안전 초록/위험 빨강, α≥0.75). 물고기 그림자 α = lerp(shadowAlphaFar 0.15, shadowAlphaNear 0.90, vp).
- **[신규] SINK CAMEO** (착수 침강 연출): 착수 직후 **무입력·무조류**(합력>0.35면 생략)일 때만 수중 채비를 아주 작게 **α0.5→0으로 800ms 페이드 + 14px 하강**. 릴링/루어 액션/뒷줄견제 시작 시 즉시 취소 → RETRIEVE 규칙(α=vp)으로 전환. 재캐스팅마다 리셋(`sinkCameoStart`).
- **[신규] 로드팁 추가 휨**: 릴링/드래그인 중 approach 비례 최대 +10° — 끌려오는 채비 쪽으로 더 휜다. **[신규] 결과 팝업 지연**: 랜딩 후 420ms 세트 정착 애니 뒤 결정 패널 표시(겹침 방지). 루어 = 원줄만(수면 아래 목줄 비표시 유지).
- **[tuning.ts] retrieve 섹션 확장**: anchorYRatio **0.75→0.70** / `scaleMax`→**`growFactor`**(2.0) 개명 / **castScaleMin**(0.72 — 구 BASE_RIG_SCALE 상수 폐기) / mainLineAlphaFactor 0.5 / shadowAlphaFar·Near / sinkCameoMs 800·sinkCameoDescentPx 14 / forwardCurrentScaleK 0(선택 가산) 신설. META 슬라이더: growFactor·mainLineAlphaFactor·sinkCameoMs 추가 (F8 라이브 튜닝).

**이전 변경 (2026-07-23 27차) — 통합 가이드 시스템 (GuidePanel 허브 — 파이트·회수·밑밥·회뜨기)** (GUIDE_SYSTEM_SPEC + game_guide_hub.html 목업 반영 — 빌드/타입체크 통과):
- **[신규] 데이터 구동 가이드 허브**: `data/GuideContent.ts` — `GUIDES = [{key, label, pages:[{textureKey, heading, body, tip}]}]` 4카테고리 19페이지(파이트 5·회수 4·밑밥 5·회뜨기 5, 문구 = 목업 확정본). `ui/GuidePanel.ts` 공용 컴포넌트가 **상단 탭 + 삽화 카드(640×300 PNG) + 캡션/💡팁 + ◀▶/점 네비 + 마지막 '완료 ✕'** 렌더 — **새 시스템 가이드는 GuideCategory 데이터 하나 추가로 끝**. DraggablePanel(dim 모달) 상속, `showCategory(key)`로 열림 중 탭 전환.
- **[에셋] 삽화 19장**: `game_guide_hub.html`의 페이지 SVG를 헤드리스 크롬으로 `guide_<cat>_<n>.png` 텍스처화 → BootScene이 GUIDES 데이터 순회로 preload (키/파일명 = textureKey 일원화). 파이트 1·3페이지 로드 곡선은 다크 배경과 대비가 없어(#16161a) 밝은 톤(#c8ccd4)으로 보정 재생성. **26차 chum_guide_1~5.png/ChumGuidePanel은 허브로 흡수·폐기.**
- **[교체] FP 씬 구 텍스트 가이드 전면 대체** (410줄 제거 — toggleGuide/GUIDE_PAGES/renderGuidePage/drawGuideDiagram): F1·? 버튼·가이드북 버튼 = **허브 토글**, '밑밥'(양동이) 버튼 = 허브 '밑밥' 탭. 열림 중 낚시 진행/입력 일시정지·ESC LIFO 최우선은 기존과 동일 (`guideContainer`→`guideHub` 가드 일원화).
- **[신규] 카테고리별 최초 1회 자동표시** (`GameState.flags 'guideSeen.<cat>'` — 세이브 저장): **회수** = 1인칭 최초 진입(구 localStorage `tra_fp_guide_seen` 본 레거시 유저는 건너뜀) / **파이트** = 최초 챔질 성공(enterFight +0.7s, 열림 중 파이팅 일시정지) / **밑밥** = 최초 C 투척(구 chumGuideSeen 플래그 호환) / **회뜨기** = 최초 [손질 시작](UtilizationPanel — 가이드 닫으면 ButcheryPanel로 이어서 진행).
- 잔여(차기): 삽화를 실게임 스크린샷으로 교체(목업 SVG 대체 — 사용자 "가능하면 시뮬레이션 스크린샷" 지침), RegionFieldScene(탑다운)에서도 허브 진입 버튼, 문구 i18n 키 분리.

**이전 변경 (2026-07-22 26차) — 튜닝 중앙화(tuning.ts) + dev 튜닝 패널(F8) + 밑밥 시뮬 하네스 + 밑밥 종류별 침강 + 밑밥 운용 가이드 팝업** (TUNING_PLAN + CHUM_GUIDE_POPUP_SPEC 반영 — 빌드/타입체크 통과 + 시뮬 실행 검증):
- **[신규 core] `config/tuning.ts` — 전 시스템 튜닝값 단일 소스**: 매직넘버를 default+range+category(feel/balance)로 중앙화 — retrieve(anchorYRatio 0.75/scaleMax 2.0/mainLineWidth)·chumThrow(pointCount 13/predictGhost/cloudBaseR)·chumSync(depthSigmaM 0.8/horizSigmaM 1.2/currentDWeight 0.6/syncToBiteMul)·**chumTypes**(파우더 0.5 느림·넓음·조류1.0 / 압맥 0.9 중 / 경단 1.5 빠름·좁음·조류0.4)·fight/rod/visual + 어종 테이블(fatigueStaminaBase/yield/knife/freshness). `TUNING`(가변)+`TUNING_META`(슬라이더 path·min·max·step)+`getTuning`/`setTuning`. ⚠ fight/rod/yield 테이블은 **선언만 이전** — FightPhysics2D/ButcheryProcess 소비 전환은 차기.
- **[개편 core] 밑밥 파슬 = TUNING 소비 + 종류별 침강 차등**: `createChumParcel(x, d, type)`이 ChumTypeSpec(sinkRate/spreadGrow/driftAffinity) 주입, stepChum이 driftAffinity·currentDWeight 적용(수면 감쇠 제거 — **시뮬 하네스와 완전 동일 수식**), computeChumSync = gauss(dz, depthSigmaM)×gauss(dh, horizSigmaM+spread·0.3)×freshness. `optimalThrowX`·`predictChumPath`도 type 기반. 클라 배합→종류 매핑: `CoolerStore.chumTypeKey()` — 고비중 파우더 포함=ball / grain 다수=grain / 그 외=powder. **강조류=경단(정밀·리드 ±2), 약조류=파우더(광역·리드 ±10) 전략화.**
- **[신규 core] `scripts/chumSyncSim.ts`** — (조류 5×밑밥 3) 격자 스윕이 **실제 게임 함수(predictChumPath/optimalThrowX)를 직접 소비**(인라인 근사 금지 — 게임↔시뮬 정합). 실측: 좌강 파우더 최적 +10.0↔이론 +9.6 정합·우측 대칭 / 경단 리드 ±2 정밀·최대동조 0.81~0.84(빠른 통과 = 까다로움) / **0.7↑ 비율 8~23% — 스킬 요구 높음 신호** (관대화는 horizSigmaM/spread 슬라이더로 조정 검토). 실행: core 빌드 후 `node packages/core/dist/scripts/chumSyncSim.js`.
- **[신규 client] `dev/DevTuningPanel.ts` (F8)** — import.meta.env.DEV 게이트 DOM 오버레이: TUNING_META를 feel/balance 섹션 슬라이더로 자동 생성, 입력 즉시 TUNING 수정(씬들은 매 프레임 소비라 리빌드 없이 반영) + 'tuning-changed' 이벤트 + **스냅샷 복사**(확정값 클립보드 → tuning.ts 고정 흐름). game.ts `createGame()`에서 마운트.
- **[배선 client] FP 씬 TUNING 소비**: 회수 앵커 `GAME_HEIGHT×anchorYRatio`(구 RETRIEVE_ANCHOR_Y 상수 폐기)·세트 배율 `1+p·(scaleMax−1)`·원줄 굵기·투척점 수·구름 반경·고스트 토글·`chumSyncRate×syncToBiteMul` 전부 TUNING 경유.
- **[신규] 밑밥 운용 가이드 팝업** (`ui/ChumGuidePanel.ts` + `public/guide/chum_guide_1~5.png`): 목업 `chum_guide_popup.html`의 **SVG 5장을 헤드리스 크롬 스크린샷으로 PNG(640×300) 텍스처화** → BootScene preload(상대 경로). 5페이지(①목적 집어+동조 ②투척 스냅·C ③조류 상류 리드 ④종류별 침강 ⑤동조율 읽기) — 삽화+캡션+💡팁+◀▶/점 네비+마지막 '완료 ✕'. DraggablePanel 상속(dim 모달)·ESC LIFO 최우선 편입·열림 중 낚시 입력/진행 일시정지. **진입**: 밑밥(C) 최초 사용 시 1회 자동 표시(**GameState.flags.chumGuideSeen — 세이브 저장**, getFlag/setFlag 신설 + newGame 리셋) + 우측 가이드북 아래 '밑밥'(양동이) 버튼 상시 재열람.

**이전 변경 (2026-07-22 25차) — 부력찌/수중찌 소켓 분리 + 찌 제원(floatBuoyG) 체계** (사용자 지적 "구멍찌와 수중찌가 같은 칸" 반영 — 빌드/타입체크 통과 + 8조합 스펙 시뮬 검증):
- **[개편] 채비 소켓 8→9** (`RigStepKey`에 `subFloat` 신설): [원줄 → 면사매듭 → **부력찌** → **수중찌** → 도래 → 목줄 → 봉돌 → 바늘 → 미끼]. **부력찌(구멍찌/기울찌/잠길찌/제로찌)는 필수, 수중찌는 선택 부품** — 부력에 대한 마이너스 침력으로 찌는 수면에 세우고 채비만 내리는 무게추 역할. **좁쌀봉돌도 선택**(기존 REQUIRED_RIG에 원래 없음 — 목줄 정렬/하강 유도 운용 부품임을 주석 명문화). 제로찌 상층 공략 = 수중찌 없이 좁쌀+바늘 무게만으로 운용 가능. 판별 헬퍼 `isBuoyFloatItem`/`isSubFloatItem` + `setRigPart` 교차 장착 방어. **`isSurfRigReady`는 부력찌·수중찌 모두 비어야 원투 판정**(수중찌만 남은 상태를 원투로 오판 방지).
- **[신규] 찌 제원 필드 `InvItem.floatBuoyG`** (양수=부력/음수=침력, g 상당): 이름 휴리스틱(구멍찌 +8/수중찌 −8 고정) 대체 — computeRigSpec(U창)/computeRigParams(1인칭 침강)/getRigTotalWeightG가 소비(미보유 아이템은 이름 폴백 유지). 시드 확장: 부력찌 6종(제로찌 0호 0.4/구멍찌 0.5·0.8·1.0호/기울찌 0.5호/잠길찌 −1.5) + 수중찌 3종(−0.5/−0.8/−1.0호). 직판장 채비 코너 구멍찌 3종에 제원 부여 + 수중찌 -0.8호 판매 추가. ItemDetailPanel 찌 상세가 실제 제원·운용 설명(제로찌/잠길찌 분기) 표시.
- **[정밀화] 잠길찌 판정 마진** (`computeRigSpec`): 기존 `net > 0`(부력찌+매칭 수중찌 표준 조합까지 잠김 오판) → **잔존부력 마진 초과 시만 잠김**(`net > max(부력×0.35, 2.5g)` — 2.5g = 좁쌀+바늘+미끼 소품 무게). 검증: 0.8+-0.8호/1.0+-1.0호/0.5+-0.5호 표준 매칭 = 부유 ↔ 0.8호+-1.0호 과침력 = 잠김. advice 분기 신설: 제로찌(수중찌 유/무)·수중찌 채비 안내, 제로찌 분기가 잠김 판정보다 우선.
- **[호환] 구세이브 마이그레이션** (`deserialize`): 통합 소켓 시절 float 소켓의 수중찌를 subFloat로 자동 이동. 손실 규칙: 밑걸림/원줄 파단(찌까지 터짐) 시 수중찌 동반 손실, 목줄 터짐은 기존대로 도래 아래만. U창 소켓 9개 수용 폭 축소(SOCKET_W 110→104).

**이전 변경 (2026-07-22 24차) — FP 채비 회수·랜딩 세트(최종) + 밑밥 3D 파슬 투척·조류 동조** (FP_RETRIEVE_LANDING_CHUM_FINAL 계획 PART A+B 구현 — 빌드/타입체크 통과 + 수치 시뮬 PASS):
- **[신규 core] 밑밥 3D 파슬** (`ChumPhysics.ts` 확장 — 기존 ChumBall/ChumPhysics 클래스는 유지): `ChumParcel`(좌우 X·원근거리 D·수심 Z) + `stepChum`(z 침강 + 조류 (x,d) 드리프트 — 수면 부유분 1.0/수중 0.65 감쇠 + 확산 spreadM 증가) + `computeChumSync` = **depthGate(가우시안 수심 창 σ=0.8+spread·0.45) × horizNear((x,d) 수평 가우시안 σ=spread) × freshness** + `maxChumSync`(HUD/입질용 현재 최대) + `predictChumPath`(조준용 궤적·피크 시뮬) + `optimalThrowX`(리드 throwX* = baitX − currentX·0.72·tSink). index.ts export.
  - 시뮬 검증: 좌측 강조류(−0.35m/s, 미끼 6.2m) → 리드 공식 +7.10m ↔ 1.5m 그리드 최적 +6.0m(피크 80%) 정합·우측 대칭 / 실시간 stepChum 피크 80% @ 26.7s ≈ tSink 28.2s.
- **[개편] 1인칭 밑밥 투척 (B)**: 랜덤 ±1.2m 착수 제거 → **수면 투척점 13개(중앙 1+좌우 6, 1.5m 간격) 커서 X 최근접 스냅**(높낮이 무시) + C/밑밥칸 투척(착수 D = 현재 미끼 거리 distM). **선택 투척점의 예측 드리프트 고스트**(침강+조류 점선 궤적 + 동조 피크 ✳ 마커 — 배합 밑밥 보유 시에만 표시) + 좌측 게이지 "밑밥 동조 N% (투척 예측 M%)". 파슬 구동은 파슬 위치별 `TidalCurrentEngine.calc` — 조류 D성분이 있으면 앞/뒤로 흘러 horizNear 자동 감점(부분 동조 고증). **단일 parcel 시뮬을 정면(침강 구름+점묘)/수평뷰(plan 투영)/수직뷰(수심 게이지 구름) 세 뷰가 동시 소비.**
- **[개편] 거리 기반 회수·랜딩 세트 (A)**: `retrieveGroup` 컨테이너 — 세트 구성 모드별(**찌 채비 = 찌+목줄+좁쌀/무게추 봉돌+미끼** top 앵커=찌 상단 / **원투** = 수면 진입점+봉돌+미끼 / **루어** = 루어 단독, 원줄은 라인타이 직결). `retrieveT = 1−distM/castDist` → easeOutCubic으로 **x→화면 중앙, y→중앙~하단 중간 앵커(0.75H=540), scale→기본×2, alpha→1** 수렴 — 입질/파이트 무관 릴링 회수 시 항상 적용. **원줄(초릿대→세트 top)은 컨테이너 밖(renderRod)에서 매 프레임 재드로우**(scale로 굵기·길이 왜곡 방지 — 굵기 고정·좌표만 갱신). 구 `floatObj` 컨테이너/`FOREGROUND_Y` 매핑 폐기(찌는 setG 로컬 드로잉), `surfaceYAt`가 새 easeOutCubic 매핑으로 일원화(정면/파이트/밑밥 공용).
  - **랜딩**: 파이트 제압(dragIn) 물고기가 **세트에 편입** — 머리 카메라쪽(foreshorten 0.5) + 지친 롤(은빛 배 셰이드+요동) + fightDepthNorm 수면 부상, 발앞 3m 도달 시 기존 onLanded(어획물 아이템) 흐름. 활성 파이트(비 dragIn)는 기존 v2 정면 물고기 투영 유지(세트 그룹 숨김 — 중복 연출 금지), 원줄 연결점만 찌 상단/물고기 머리로 정합.
- 매핑 시뮬(cast 25m): distM 25→0.5에서 y 272→540·scale ×1.00→×2.00·x 중앙 수렴 (p=0/1 경계 정확).

**이전 변경 (2026-07-22 23차) — 어종 이미지 5종 + 쿨러·인벤토리 세이브 연동 + FP 인벤토리(I) + 가이드 일시정지·시각 도해** (빌드/타입체크 통과 + 세이브 경과처리 시뮬 PASS):
- **[신규] 인벤토리 세이브 연동** (`InventoryStore.serialize/deserialize/resetAll` + GameState SaveData `inventoryStore`): 아이템 전체(신선도 시각 포함)/퀵슬롯/채비 소켓/면사매듭(Z_limit·hasFloatStop)/편대(spreader)/루어 모드(_lure·_jigHead)/어획 시퀀스 저장. **신선도는 conditionSinceMs(절대 시각) lazy refresh라 저장~로드 사이 실경과가 자동 반영**. 로드 시 존재하지 않는 아이템을 가리키는 퀵슬롯/채비/편대 참조는 정리(null). 구버전 세이브(필드 없음)는 시드 리셋. newGame 시 `resetAll()`.
- **[신규 에셋] 어종 실사 이미지 5종** (`public/fish/` + BootScene + FISH_TEXTURE): 놀래미(greenling=spotbelly_greenling)/쥐노래미(fat_greenling)/망상어(surfperch=surf_perch) + **용치놀래기 암/수 2종**(multicolorfin_rainbowfish_*) — 성전환 어종이라 `resolveFishTexture`가 성별로 분기(수컷=녹색 혼인색).
- **[정정] 숭어류 표준명** (FISH_DATABASE + 오라클): striped_mullet '참숭어(숭어)'→**'숭어(보리숭어)'** / redlip_mullet '가숭어(밀치)'→**'가숭어(참숭어)'**(nameEn 'So-iuy Mullet'). MAFRA 품목 매칭 테이블은 시장 품목명 기준이라 불변.
- **[신규] 쿨러 세이브 연동** (`CoolerStore.serialize/deserialize/resetAll` + GameState SaveData `coolerBox`): 어획(개체별 신선도·경과)/매질(해수·얼음 투입 시각·만료 여부)/밑밥 상태 저장. **로드 시 저장~로드 사이 실경과 시간을 `sync()`가 그대로 반영** — 신선도 진행 + 매질 만료 강제 전이(해수→보통/얼음→해동) 처리, **밑밥은 시간 규칙 없이 그대로 사용**. newGame 시 `resetAll()`. (시뮬: 해수+활어 30분 저장→120분 로드 = 보통·경과 60분 / 얼음 5시간 방치 = 나쁨 / 밑밥 70 보존 — PASS)
- **[신규] 쿨러 판매 가드**: `RegionFieldScene.handleSell` — 내용물(어획/해수·얼음/밑밥) 있으면 판매 차단 '먼저 비우세요'. 버리기 가드도 **매질 포함**으로 보강. **[신규] 밑밥 비우기 버튼** (U 밑밥 품질 탭 — 물 넣기/섞기 옆): 재료·물·배합 밑밥이 있으면 통 리셋.
- **[신규] 1인칭 인벤토리 (I 토글)**: FP에서 `InventoryPanel` 오픈(우측) — 쿨러 어획 **드래그 이송 대상** + 슬롯 정리(사용/버리기) 가능. 열림 중 낚시 입력 차단, ESC는 인벤→쿨러→종료 순 LIFO, 파이팅/가이드 중엔 열지 않음. 상세보기는 FP 자체 ItemDetailPanel로 연결.
- **[개편] 도우미 가이드**: ① **열람 중 낚시 진행 일시정지** — update()에서 조류/침강/입질/파이팅 틱 정지(시계·날씨 연출은 계속), 닫는 순간 재개 ② **가이드북(?) 아이콘** — 우측 수심 정보 패널 바로 아래(책 모양+물음표+'가이드' 라벨), 클릭 = 가이드 재열람 (F1/우하단 ? 유지) ③ **시각 도해 2종 추가**("낚싯대 휨새 도해가 가장 이해된다" 피드백 반영 — `drawGuideDiagram`): 2페이지 **입질 타임라인**(1→2→3단계 융기 곡선 + 3단계 초록 골든존 '지금 챔질!' + 직후 '펴짐=실패' 빨간 구간) / 4페이지 **텐션 게이지 구간도**(0-30 느슨/30-80 안전/80-88 위험/88+ 줄터짐 색 바 + 유지 바늘 + 눈금).

**이전 변경 (2026-07-22 22차) — 쿨러 휴대 아이템화(기능 게이트) + 어획 3선택지 + 쿨러 드래그 이송 + 상세보기 실시간 신선도** (빌드/타입체크 통과):
- **[신규] 쿨러 = 휴대 아이템** (`inv_cooler` 쿨러(아이스박스), 기타 시드 1 + 마트 판매 55,000원. `InventoryStore.hasCooler()` 게이트):
  - 쿨러 미보유 시: 어창 열기(1인칭 보관함/탑다운 B) 차단 안내 · **밑밥 기능 전체 비활성**(U 밑밥 품질 탭 잠금 안내 + 1인칭 C 투척 차단 + 쿨러 HUD '쿨러 없음/사용 불가' 표기) · 어획 시 인벤토리 직행 유도.
  - **버리기 가드**: 쿨러 안에 어획/밑밥이 남아 있으면 쿨러 아이템 버리기 차단 (내용물 유실 방지).
- **[개편] 어획 결정 팝업 3선택지** (`showCatchDecisionPanel`): **[쿨러에 보관하기] / [인벤토리에 보관하기] / [방생하기]** — 쿨러 미보유 시 '쿨러에 보관하기' **비활성**(회색, 클릭 시 사유 안내). 인벤토리 보관은 활어 상태로 즉시 신선도 진행(10분). 쿨러 가득 시 "방생하거나 쿨러를 비우세요" 안내. `DecisionButton.disabled/disabledHint` + 3버튼 자동 배치 지원. **다관점 히트**도 쿨러 미보유 시 인벤 직행(가득 시 방생) — 태그 (어창)/(인벤토리)/(방생) 표기.
- **[신규] 쿨러 어획 드래그 앤 드랍 이송** (`CoolerPanel`): 셀을 잡아 **패널 밖으로 드래그하면 인벤토리 이송**(고스트 아이콘 표시, 패널 안 드랍 = 취소). 우클릭 = 컨텍스트 메뉴 / 좌클릭(드래그 없이) = 메뉴 (접근성 유지). **비모달화**(dim 제거 + depth 800 = InventoryPanel과 동일) — 탑다운에서 **쿨러(B)+인벤토리(I) 동시 오픈** 가능: 인벤 가득이면 그 자리에서 사용/버리기로 슬롯을 비우고 재이송. RegionFieldScene은 uiBlocked(popupStack)로 이동/캐스팅 차단 유지, 1인칭은 어창 열림 중 낚시 입력 차단 유지.
- **[개편] 상세보기 신선도 실시간화** (`ItemDetailPanel`): 전이 경로 나열 제거 → **단일 상태 표기** `신선도 상태: 활어`(상태 색상) + `다음 상태로 변경되기까지 남은 시간: 00일 00시 00분 00초`(`formatDhms`) — **1초 주기 실시간 카운트다운**(열람 중 상태 전이 시 라벨/색/배지 동기화). 쿨러 개체 상세는 `remainProvider`로 매질 규칙 남은 시간 표시(정지 = '무제한', 부패 = '종착 상태'). 생성자 6번째 인자 `remainProvider?: () => number | null`.
- **[변경] 섭취 제한**: 손질되지 않은 활어(어획물)·손질 필렛·손질 통마리·부산물은 날것이라 **'사용하기' 미제공** — 조리(요리) 후에만 섭취 가능 (요리 시스템 연동 예정).

**이전 변경 (2026-07-22 21차) — 쿨러 매질(해수/얼음) 시스템 + 신선도 상태 그래프 재설계 + 인벤토리 사용/버리기 UX** (빌드/타입체크 통과 + 매질 엔진 28항목 수치 시뮬 PASS):
- **[재설계] 신선도 상태 그래프** (`InventoryStore` — 구 5단계 선형 체인 `활어→신선→냉장→냉동→상함` 폐기. 시간이 지나면 냉장→냉동이 되던 비현실 로직 수정):
  - **8단계 상태**: 활어/신선/**보통**/냉장/냉동/**해동**/**나쁨**/부패(구 '상함' 개명). 전이는 `CONDITION_NEXT` **그래프**: ① 활어(10분)→신선(3h)→보통(5h)→나쁨(2h)→부패 ② 냉동(상온 3h)→해동(1.5h)→나쁨 ③ 냉장(상온 1h)→보통. `conditionPath()`가 현 상태부터 종착까지 실제 경로 반환(상세보기 표기). `CONDITION_DESC` 상태 설명 신설(상세보기 본문에 표시). `refreshCondition`은 그래프 워크로 재작성 (lazy 방식 유지).
  - 보통 = 조리 가능·사시미 불가 / 냉장 = 사시미 가능 — `ButcheryPanel.freshnessFactor` 재조정(냉장 0.85 > 보통 0.6 > 냉동 0.55 > 해동 0.5 > 나쁨 0.35).
- **[변경] 쿨러 자동 이송 폐지**: 1인칭 종료 시 어창→인벤 자동 이송 + 강제 방생 흐름 **제거** — 쿨러 어획은 팝업 우클릭 **'인벤토리로 넣기'**로 직접 옮겨야 한다. 이송 시 현재 신선도 상태 그대로 + **시계는 이송 시점부터 재시작**(해수 활어 → 인벤에서 10분 카운트). 인벤 공간 없으면 이송 실패 안내만.
- **[신규] 쿨러 매질 시스템** (`CoolerStore` 재작성 — 개체별 `condition`+`stateElapsedMs`(정지 구간 미누적) + lazy `sync()` 구간 분할 엔진):
  - **매질 3종**: 없음(상온과 동일 진행 — 활어 10분) / **해수**(1시간 — 활어 시계 정지=무제한, 만료 시 남은 개체 **강제 '보통'**) / **얼음**(2시간 — 활어 1시간 유지 후 신선, 신선 이하 전 상태 정지, 만료 시 **강제 '해동'**). 만료된 매질은 '비우기' 후에만 재투입 가능.
  - `sync()`는 [이전, 만료) 활성 구간 → 만료 이벤트(1회) → [만료, 현재) 비활성 구간으로 분할 적용 — 장시간 점프에도 정확(10시간 점프 시뮬 검증). `fishRemainMs` null = '무제한' 표기.
- **[개편] CoolerPanel**: ① 타이틀 **쿨러 (매질, 00시 00분 00초)** 1초 갱신 + 해수 잔여 ≤10분 시 빨간 **'! 해수 교체 필요'** ② 하단 3버튼 — **해수 넣기**('낚시용 두레박'(기타) 보유 + **바다 근처**(`isNearSea` 콜백: 1인칭=항상, 탑다운=`nearWater`) 필요. 비활성 호버 시 '바다 근처에서만 가능합니다' 등 사유 툴팁) / **얼음 넣기**('대용량 각얼음'(소모품) 클릭 즉시 1개 소모) / **비우기**(매질 있을 때만) ③ 셀 신선도 배지(색 점+라벨) + 컨텍스트 메뉴 헤더에 `상태 → 다음 단계까지 남은 시간/무제한` 표시 ④ 메뉴에 '인벤토리로 넣기' 추가. `DraggablePanel`에 `titleText`/`setTitle()` 신설.
- **[신규] 인벤토리 우클릭 UX**: ① **사용하기**(음식·소모품, 녹색) — 음식은 **섭취 SFX**(신규 `audio/Sfx.ts` WebAudio 합성 — 오디오 에셋 전 플레이스홀더)와 함께 소모(나쁨/부패는 섭취 차단), 소모품은 소모만. 효과 적용은 추후 ② **버리기/완전제거 빨간색** + **"정말 버리시겠습니까?" 예/아니오 확인창**(ConfirmDialog).
- **[신규 아이템]**: 낚시용 두레박(기타, 시드 1 + 직판장 판매 — 소모 안 됨) / 대용량 각얼음(소모품, 시드 2 + 편의점·마트 판매).
- ⚠️ 사용하기 아이템 효과(HP/버프), 쿨러 어획 '손질하기' 연결은 추후.

**이전 변경 (2026-07-22 20차) — 어종 실사 이미지 에셋 19종 + 회뜨기 수율(회칼·어종모양·체장무게·도구스킬) 시스템** (빌드/타입체크 통과):
- **[신규 에셋] 어종 실사 픽셀 이미지 19종** (`food assets/` → `packages/client-pc/public/fish/`, BootScene 텍스처 등록): 무늬오징어(squid)/갈치(hairtail)/갑오징어(cuttlefish)/청볼락(blue_rockfish)/쥐치(filefish)/황볼락(golden_rockfish)/농어(sea_bass)/부시리(amberjack)/방어(yellowtail)/숭어(striped_mullet)/가숭어(redlip_mullet)/강담돔(spotted_knifejaw)/참돔(red_seabream, 야간 night_seabream 공용)/전갱이(horse_mackerel)/고등어(chub_mackerel) + **돌돔 암/수 2종**. 텍스처 키는 **어종 ID 기준**(파일명 영문 통칭과 분리 — 매핑은 `FirstPersonFishingScene.FISH_TEXTURE` 일원화).
  - **[신규] 돌돔 성별/체장 텍스처 해소** (`resolveFishTexture`): 돌돔은 40cm를 넘어야 암수 구별(수컷만 줄무늬 소실). **40cm 미만은 성별 무관 암컷 이미지(무늬 유지)**, 40cm↑ 수컷만 수컷 이미지. onLanded/다관점 히트 모두 반영.
  - ⚠️ **DB 미등록 어종 2종**(에셋만 선로드, FISH_TEXTURE 미연결): **개볼락**(spotbelly_rockfish.png), **창꼴뚜기/한치**(swordtip_squid.png) — FISH_DATABASE/오라클 추가 후 매핑 연결 필요.
  - ⚠️ **파일명↔어종 불일치 1건**: `dark-banded_rockfish.png`(영문 통칭=볼락 dark_banded_rockfish)를 사용자 지정 **청볼락**(blue_rockfish)에 매핑함. 볼락(dark_banded_rockfish)은 이미지 없음 상태 — 이미지 실제 어종 재확인 대상.
- **[신규 core] 회뜨기 수율 시스템** (SASHIMI_YIELD_SPEC 반영 — 수율(양)과 등급(질) 분리):
  - `types/Butchery.ts`: `ButcheryProfile`에 **baseYieldRate·sliceGramBase·minFilletLengthCm·bodyRatio·filletShape** 추가, `filletCount` 2|4→**2|4|5**(대형 광어). `KnifeSpec`/`FilletYieldInput`/`FilletYieldResult`/`FilletShape` 신설.
  - `db-schema/KnifeDatabase.ts`: **회칼 3등급**(막칼 toolYield 0.85 / 회칼 1.0 / 야나기바 1.10) + `getBestKnife(ids)`(없으면 null=게이트)·`isKnifeItem`.
  - `simulation/ButcheryProcess.ts` `computeFilletYield()`: **yieldMass = 무게×baseYieldRate×칼×스킬×신선도**, sliceCount = yieldMass/(sliceGramBase/(칼얇기×스킬얇기)), 대형 광어(≥45cm) 5장 분기, 등급 = (방혈×시메×컷정확도×신선도)×칼·스킬 보정 → 특/상/중/하.
  - `db-schema/ButcheryProfiles.ts`: 어종 전수 프로필에 수율/형상 필드 채움(광어 0.48·방어/부시리 0.52·잿방어 0.53·참돔 0.42·농어 0.45·삼치 0.50·볼락류 0.38·대구 0.32·감성돔/벵에돔 0.40 등 — 통념 튜닝값 ★★).
- **[신규 client] 회칼 게이팅 + 수율 결과** (`ui/ButcheryPanel.ts`): 인벤토리 '기타'에 회칼 있어야 **회뜨기(꼬리손잡이/장뜨기/박피) 활성** — 미보유 시 손질(시메·방혈·비늘·머리·내장)까지만 하고 **잠금 오버레이 + [통마리로 마무리]**(통마리 아이템 지급). 결과 오버레이가 **수율 g·필렛 장수·슬라이스 수·등급·사용 칼·손질 스킬 Lv/XP** 표시, `computeFilletYield` 기반 가격·필렛 수 지급. `bodyRatio`로 파라메트릭 생선 체고 변형, 어종별 팔레트 확장.
- **[신규] `GameState.skills.filleting`**(level/xp, 세이브 영속) + `addFilletingXp`(성공 손질마다 XP↑, 상한 Lv.20). 회칼 3종 식자재마트 판매 등록 + 회칼(사시미) 1개 기본 지급.
- 잔여(차기 — 사용자 확인 후): 개볼락/한치 DB 추가, 청볼락 이미지 어종 재확인, 필렛 형상별 아이콘, 두족류 전용 손질 트리, 회썰기(두께/각도) 인터랙션, baseYieldRate 플레이 튜닝.

**이전 변경 (2026-07-21 19차) — 자전거 정합 + 파이트 드래그인 + 신선도 상세 + 백운포 연결 + 날씨 강화** (브라우저 6항목 PASS):
- **[수정] 자전거 정·후면 z순서**: 정면/후면일 때 자전거(핸들바·에지온 바퀴/안장·뒷바퀴)가 **캐릭터보다 앞(depth+)**, 측면은 뒤(프레임이 다리에 가림) — 물리 정합. Field/RegionField 공통.
- **[신규] 자전거 아이템 연동**: 기타 인벤토리에 `inv_bike`('자전거', 탈것) 시드 — **보유해야 R 승차 가능**(미보유 시 힌트/거부). **탑승 중 캐스팅은 완전 무반응**(어떤 안내 문구도 없이 무시 — tryStartCharge 최상단 게이트).
- **[신규] 파이트 드래그인 (거리 정합)**: 랜딩 판정(progress 100)이 나도 **수면 거리 > 3m면 즉시 랜딩하지 않는다** — `dragInMode`: 도주 시뮬 정지, 지친 고기가 수면에 떠서(fightDepthNorm→0.06) **릴링 2.4m/s로 질질 끌려오고**(방치 시 -0.15m/s 되풀림) 발앞 3m 도달 시 정식 랜딩. "제압 완료! 릴링으로 끌어오세요 — 남은 Xm" 안내. (검증: 22m 제압 → 3.0m 랜딩)
  - **수평뷰 result 유지**: 랜딩 직후 수평뷰가 사라지던 것(결과 화면에선 조작 대상이 없다고 보고 클리어) → 마지막 채비 위치를 계속 표시하도록 변경.
- **[신규] 신선도 상세 v1** (`InventoryStore` CONDITION_CHAIN/refreshCondition/conditionRemainMs + `ItemDetailPanel`): 단계 체인 **활어→신선→냉장→냉동→상함**(상온 유지 15/30/45/90분, lazy 갱신 — 열람 시 경과분만큼 진행), **변질까지 남은 시간(일/시/분/초)**, 보관 환경 계수(상온 x1 · 어창 활어=정지), 활용 보정(미끼: 활어 +25%/냉동 -50%/상함 -85% · 어획물: 경락 등급/요리 품질) 행 표시. `conditionSinceMs` 필드 신설(시드/획득/이송 시점 기록). **시드 감성돔(inv_fish_1)에 speciesId/38cm/900g 부여** — 비활어도 어종 정보 연동. 정식 부패 모델(core Item.ts) 연동은 추후.
- **[수정] 백운포 방파제 연결** (`tools/build_region_maps.py` `connect_components` 신설): 걷기 컴포넌트 13개로 조각나 있던 `busan_baegunpo_2` — **끊긴 컴포넌트를 최근접 쌍 직선 카브로 자동 연결**(4-연결 라인, 대형(30+) 간격 14/소형 8타일, 대형 육지(300+)는 연결 시도 안 함 — 만 한가운데 바위 임의 다리 방지, 건물 관통 금지). 방파제 사선 전체(끝단 체인 포함)·좌측 해안 도보길이 본토와 연결됨 (13→4 컴포넌트, 잔여는 실제 고립 바위). 부산 8맵 재생성 — 타 맵 부작용 없음(대부분 1컴포넌트).
  - ⚠️ 카브 직선은 **4-연결**이어야 함(대각 스텝 금지) — 대각 Bresenham은 걷기 판정에서 끊긴다 (구현 시 발견·수정).
- **[신규] 탑다운 날씨 연출 강화**: 비 **2레이어**(근경 굵고 빠름 2/3 + 원경 가늘고 느림 1/3) + **지면 물파문 링**(비 150ms/소나기 70ms 간격 확산·페이드) / 소나기 150개 강우 / **진눈깨비 = 비+눈+우박 혼합**(우박: 빠른 낙하 + 지면 튐 스파크 후 재투입) / 눈 70개. 강수 종류는 기상청 예보(`getWeatherKind`) 연동 (기상→이동/낚시 영향은 추후).

**이전 변경 (2026-07-21 18차) — 캐릭터 접지/크기 + 캐스팅 액션 잠금 + 배타 액션 게이트** (브라우저 3항목 PASS):
- **[수정] 캐릭터 접지 + 크기** (RegionFieldScene): 표시 높이 **42→52px** (+10px ≈ 실화면 약 0.5cm). man 스프라이트 하단 투명 여백 때문에 발이 그림자보다 떠 보이던 문제 — **`PLAYER_FOOT_SINK = 4`** 신설, 스프라이트만 +4px 아래로 내려 접지 (그림자/충돌 바디 불변).
- **[신규] 배타 플레이어 액션 게이트** (`get playerActionLocked` — 파생 getter, 상태 중복 없음): **캐스팅 차지~탄도 비행 중 이동 완전 잠금**(vx/vy 0, idle 프레임 고정) + **자전거 승·하차 거부**. ⚠️ 규칙: 추후 해루질/채집 등 새 액션은 별도 플래그를 만들지 말고 각 액션의 원 상태를 이 getter에 OR로 편입 — 액션 간 독립성(동시 진행 금지)의 단일 기준.
- **[신규] 탑승 중 낚시 금지**: `tryStartCharge` 게이트 — 자전거 탑승 상태에서 캐스팅 시도 시 "R로 내린 후 캐스팅하세요" 힌트 + 거부 (1인칭 진입 시 자동 하차는 안전망으로 유지).
- 검증(브라우저): 높이 52px·접지 +4px / 차지 중 vx 0·자전거 R 거부 / 릴리즈 비행 중 vx·vy 0 / 탑승 상태 캐스팅 거부 — 전체 PASS.
- **[배포] 3차 테스트 빌드 gh-pages 재배포 (2026-07-21, 커밋 bda25dd)** — 라이브 검증 완료(404 0건, pageerror 0건). 16~18차(FP v2/v2.1·피로·자전거·접지·액션 잠금) 전체 포함.

**이전 변경 (2026-07-21 17차) — FP v2.1 정리 + 파이트 실거리/실수심 + 조명 z순서 + 자전거 시스템** (브라우저 3항목 PASS):
- **[개선] 수평뷰 좌하단 재배치**: (16,40,186²) → **(16,408,232×212)** — 링이 사각 창 밖으로 나가던 문제를 거리 링 스케일 `min((PH-46)/maxD, (PW/2-16)/maxD)` 클램프로 해소. 정보 텍스트 블록은 좌상단(16,40) 복귀.
- **[제거] 파이트 중앙 원형 2D 무대 렌더 (중복 연출)**: 15차 무대 렌더(원·텐션 그라데이션 줄·물고기 다각형·라벨)가 v2 정면 물고기 렌더와 중복 표시되던 것 — **렌더 전부 제거, 시뮬만 유지**(`updateFight2DSim` — f2dPos/heading/fightDepthNorm을 정면/수평/수직뷰가 소비). 서지·횡 러닝 경고는 patternText로 이관(횡 러닝은 스티어 방향 표기).
- **[신규] 파이트 실거리/실수심 반영**: 물고기가 힘쓰는 만큼(thrustGate 비례) **줄이 풀려 distM 증가**(다이브 0.35/횡 0.6/러닝 0.85 배율 × 파워), 릴링 시 1.35m/s 감김(하한 1.2m). **baitZ는 fightDepthNorm×국소수심(seabed)으로 추적** → 우측 수심 정보 패널·정면 원근·상단 수면 거리 표기가 파이트 중 실시간 반응. (검증: 24→25.7m 줄 풀림 / 수심 0.78→7.87m 다이브)
- **[수정] 캐릭터/건물 z순서**: 밤 조명 중 **파사드 부착 요소(창문 불빛 2·네온사인·가로등 전구)가 depth 42 ADD로 캐릭터 위에 씻겨** 캐릭터가 건물 뒤에 있는 것처럼 보이던 문제 — 파사드 요소를 **16+y·0.001(플레이어 20+ 아래)**로 내리고 명암 오버레이(40) 아래인 만큼 알파 보상(창 0.7→0.95 등). 부드러운 주변광 글로우·바닥 광 풀만 42에 남겨 "어둠을 뚫는" 연출 유지. (검증: ADD 조명 depth [16, 42]만 잔존)
- **[신규] 자전거 시스템** (`ui/BikeComposite.ts` + `GameState.isMounted`): 캐릭터 스프라이트 발밑에 **자전거 벡터 레이어 합성** — 측면=바퀴 2(스포크 회전)+다이아 프레임+안장/핸들(좌우 부호 반전), 정면=가로 핸들바+수직 프레임+에지온 바퀴, 후면=안장+프레임(시안 반영. 빨강 프레임 = 플레이스홀더, 추후 PNG 3종 교체). **R 키 승·하차**(스펙의 B는 어창(10차)과 충돌 → R로 확정), 탑승 시 **이동 속도 2배**(RegionField 150→300 / Field 200→400), 라이더 -9px 안장 오프셋+페달링 바운스(이동 시), 걷기 프레임 idle 고정, 그림자 1.6배 확장. FieldScene·RegionFieldScene 공용 + `GameState.isMounted`(세션)로 씬 간 유지, **낚시(1인칭)/상점 진입 시 자동 하차**.
- 검증(브라우저): R 토글·vx 300·idle 고정·라이더 오프셋 / FP 진입 자동 하차 / 수평뷰 y413·링 수용 / 무대 제거·줄 풀림·릴링·다이브 — 전체 PASS.

**이전 변경 (2026-07-21 16차) — FP 정면 뷰 v2 완성 (수평뷰·피로 페이즈 배선·인벤 상세 어종정보)** (FP_VIEW_V2_SPEC/FP_RIG_ROD_SPEC 반영 후 삭제 — WIP 커밋 19893bf에서 끊긴 작업 재개·완성. 수치 시뮬 + 브라우저 4항목 PASS):
- **[신규] 좌측 수평뷰(top-down plan)** (`renderPlanView` + `planG`): 기존 임시 게이지 바 3종(정렬도/동조/밑걸림) 제거 → 그 자리에 **위에서 본 평면** — 하단 중앙=나(삼각), 위=캐스팅 방향, 10m 거리 링, 조류 화살표(우상단), 채비/물고기 마커(파이트 중엔 f2d 횡 러닝 투영). 수치 텍스트 블록은 수평뷰 아래(16,238)로 통합. **plan heading 선행 lerp**(`planPrev`/`planHeading`) — 마커가 이동 방향으로 머리를 먼저 돌린다. 정면(원근)·수평(평면)·수직(수심) 세 뷰가 같은 스냅샷(distM·rig·f2d)을 소비.
- **[배선] FishFatigueModel → 1인칭 파이트** (15차에서 core만 만들어진 것을 배선): `enterFight`에서 어종×무게(kg)로 생성 → 매 틱 `update({릴링/견제/텐션비율})` → **thrustGate가 f2d 무대 추진을 게이팅**(RUN 1.0/LULL 0.62/SURGE 0.5+버스트/SPENT 0.22 — 기존 progress 기반 감쇠 대체). SPENT = 제압 롤(subdued) 연결, 서지 버스트 = "파상 저항! 순간 폭발" 라벨 우선 표시. 파이트 UI에 **"피로: 강한 러닝 (잔여 N%)"** + 슬랙 회복 경고 + SPENT "랜딩 찬스!" 표기.
  - **[수정 core] 회복 무력화 결함**: 슬랙 회복(∝풀)이 기본 드레인(∝√풀)과 상쇄되어 작은 풀에서 순회복 ≈ 0이던 문제 — **휴식 중엔 드레인 0** (참돔 3kg 슬랙 8s → 잔여 98% 회복, SPENT 26s→38s 지연 실측). "긴장 유지"가 실제 스킬 요소가 됨.
  - 페이즈 시뮬(릴링 60% 듀티): 볼락 0.3kg SPENT 9s / 참돔 3kg 26s / 방어 8kg 43s · 서지 1/4/7회 — 사이즈 비례 지구력 확인.
- **[배선] fightDepthNorm** — f2d 무대 깊이 정규화를 정면 뷰와 공유: 파이트 중 **찌 잠김 투명도**(α = 1−dn×1.15, 하드 다이브 시 완전 소멸 — 실측 α0) + **물고기 그림자 선명도**(α = clamp(1−dn, 0.15, 0.9) — "얕음=선명" 공통 규칙).
- **[신규] 인벤토리 어획물 상세 보강** (`buildItemDetail` — Pick에 `speciesId/lengthCm/weightG` 추가): **길이/무게(kg·g 자동)/최대어 대비 %** + FISH_DATABASE 조회 **학명/영문명/제철/서식(수심·수층)** 행, desc를 어종 습성 설명으로 대체(긴 설명은 패널 높이 자동 확장). 무게 미저장 개체는 W≈a·L³ 근사.
- 검증(브라우저): 릴링 원근 y272→y496 딸려옴 / 파이트 "피로: 강한 러닝 99%"→릴링 4s 후 88% / 찌 α0·그림자 α0.15 / 상세보기 12행(감성돔 42cm·1.40kg·최대어 58%·학명·제철·바닥층) — 전체 PASS.

**이전 변경 (2026-07-21 15차) — 파이트 2D 무대 1인칭 통합 + 로드 스티어 밀당** (사용자 피드백 "파이팅 때 가시적으로 확인 안 됨" — 12차 파이트 2D는 레거시 FishingScene에만 있었음. 목업 "1인칭+파이트" 명세대로 활성 경로에 통합):
- **[신규] 1인칭 파이팅 2D 무대** (`FirstPersonFishingScene.updateFight2DStage` — depth 87 원형 뷰 R132, 텐션바 아래 중앙): **상단 앵커 수중 단면뷰** — 로드 팁(스티어로 기울어짐) → 물고기까지 **텐션 그라데이션 줄**(미색→노랑→빨강, ≥0.85 펄스·굵기↑·지터 — 텐션바 임계 동기화). 물고기 실루엣 = heading 방향 다각형+밝은 윤곽선, **깊이→투명도(최소 0.25)·축소**, 진행 82+ = **제압 근접**(머리가 앵커로 돌고 은빛 롤 + "수면 부상 — 곧 캐치!"). 모션 = FightingPhase 패턴 구동(jump=상방/dive=하방/lateral=lateralDir 좌우) + none 구간은 `MOVEMENT_PROFILES`(pickRunHeading — FightPhysics2D core 재사용) 러닝. 무대 하단 상태 라벨(횡 러닝 방향·대응 힌트). ⚠️ 클램프 순서: **수면(y) 클램프 → 반경 클램프** (역순이면 물고기가 원 밖으로 밀림 — 실버그 수정).
- **[신규 core] FightingPhase 로드 스티어 밀당**: `FightInput.steerDir(-1/0/+1)` + `lateralDir`(횡 러닝 좌/우 — FightStatus 노출). lateral 패턴 중 **같은쪽 스티어 = 텐션 -15/s + 진행 +4/s(버티기)** / **반대쪽 = 텐션 +19/s + 진행 +7/s(제압 — 위험 감수)**. 검증(60fps·릴링<텐션70 습관 시뮬): 랜딩 시간 **무스티어 45.7초 → 같은쪽 18.4초 / 반대쪽 23.9초** — 스티어가 확실한 이득, 같은쪽=안전 최속.
- **[신규] 1인칭 ←/→ 입력 이원화**: 파이팅 = 로드 스티어(폴링) / 드리프트+루어 모드 = **다트**(`doDart` — 횡 임펄스 0.7m + 0.25m 상승, 쿨다운 0.35s, "좌×3 우×3" 지그재그 — 트위칭 포즈로 lureActionMult 연동). 조작 안내(스테이트 바·컨트롤 바) 갱신.
- 정리 훅: finishFight/failAndExit/recast에서 `clearFight2DStage()` — 무대·라벨 잔상 방지.
- 참고: 12차 파이트 2D(FightPhysics2D 전체 물리·FishingFocusWindow 무대)는 레거시 FishingScene 경로에 유지 — 1인칭은 기존 FightingPhase 판정을 유지한 채 무대·스티어만 통합(중복 물리 금지 원칙).

**이전 변경 (2026-07-21 14차) — 회 뜨기(활어 손질~삼면뜨기~박피) 미니게임** (SASHIMI_BUTCHERY_SPEC 반영 — FSM 수치 시뮬 + 헤드리스 브라우저 4단계 렌더 검증):
- **핵심 아키텍처 (스펙 결정 준수)**: ① 자유 3D 회전 금지 → **방향 상태 머신** 5종(BASE/FLIP/BELLY_UP/BACK_DOWN/FLESH_UP) + orientation 게이트(불일치 시 칼질 비활성·힌트) ② 어종×방향×단계 스프라이트 폭발 방지 → **파라메트릭 생선 템플릿**(Graphics)에 ButcheryProfile(체형·색·비늘·anusRatio)만 주입.
- **[신규 core]** `types/Butchery.ts`(OrientationState/CutSpec/ButcheryStage/프리미티브 6종) + `db-schema/ButcheryProfiles.ts`(감성돔/벵에돔/긴꼬리/광어(flat·4필렛)/농어/방어 + 폴백 — anusRatio·scaleToughness·skinToughness) + `simulation/ButcheryProcess.ts`:
  - **CutValidator** `evaluateCut`: 가이드 폴리라인 32샘플 커버율 + 평균 이탈(tolerance 배수) → 품질/통과. (검증: 정확=1.0 / 흔들림=감점 / 빗나감=실패)
  - **ButcheryProcess FSM**: 프로필 → 스테이지 자동 생성 — 시메(뇌 탭)→방혈(아가미 컷+얼음물)→비늘 양면+세척→머리따기 사선 양면→개복(anusRatio→머리)→내장 긁기→세척→꼬리 손잡이→장 뜨기(등 칼집 ×3→강한 썰기, **필렛 수만큼 반복** — round 17스테이지/광어 5장뜨기 21스테이지)→박피(당김 ×필렛수). submitTap/Cut/Fill/Wash/PeelPull API — 판정 전부 core.
  - **등급**: 품질 = 시메×방혈×컷정확도평균×신선도(Item 레이어 재사용 — live 1.0~spoiled 0.25) → 특(≥0.9 ×1.5)/상(×1.25)/중/하. 채움류(비늘·내장)는 이진 완료로 평균에서 제외(희석 방지). 검증: 정밀=특 / 대충(지터)=상 20/20 / 시메·방혈 생략=중 / 신선도0.5=하. **활어가 아니면(fresh 0.9) 컷 만점에도 특 불가** — 활어회 고증.
- **[신규 client]** `ui/ButcheryPanel.ts` — UtilizationPanel 요리 탭 도마 **[손질 시작]** 버튼으로 진입(스펙 허용 ButcheryPanel 방식): 도마 배경+파라메트릭 생선(방향별 미러/배·등 밴드/비늘 반점/머리 분리 단면/내장 오버레이/필렛 슬랩+껍질층), 노란 점선 칼 가이드+시작점, **GuidedCut 트레이스**(씬 레벨 포인터 — 은색 칼선 실시간 렌더), DragScale/Scoop(문지르기 진행 바), 시메 탭 목표 링, Peel(꼬리 손잡이 존→좌로 당김, 각도·거리 품질), 세척/얼음물 버튼, Orient 버튼 5개(필요 방향 금테 강조), 결과 오버레이(등급/필렛/정확도).
- **[산출]** `{어종} 필렛 (등급)` ×filletCount (가격 = sashimiValuePerKg×중량×등급배율/필렛수, 음식 탭 '손질 필렛') + `중골·머리 (육수용)` 부산물 + **원본 생선 1마리 소모**. speciesId/lengthCm 보존 — RecipeDatabase 사시미 입력용.
- 잔여(차기): 회 썰기(두께·각도) 인터랙션, 두족류·장어 별도 손질 트리, anusRatio 어종별 재확인, 컷 tolerance 플레이 튜닝, ESC LIFO와 자식 팝업 순서(현재 ButcheryPanel은 X 버튼으로 닫기).

**이전 변경 (2026-07-21 13차) — 팝업 바깥 클릭 닫기 + 요리 도마 드래그 앤 드랍 + 필드 이벤트 육지 거리 현실화** (헤드리스 브라우저 렌더 검증):
- **[UX] 선택 팝업 바깥 클릭 자동 닫기**: `UtilizationPanel.addChooserBackdrop` — 채비 부품 선택/편대 미끼 선택 리스트 뒤에 전체 화면 투명 백드롭(topOnly로 행 클릭은 유지, 바깥 클릭은 chooser만 닫음 + 하위 UI 오클릭 방지 겸용). `CoolerPanel` 컨텍스트 메뉴에도 동일 적용. InventoryPanel은 기존 outsideCatcher 패턴 보유(동일 구조). **상세보기(ItemDetailPanel)는 직접 닫기 유지**(의도), 수량/확인 다이얼로그는 모달 결정이라 제외.
- **[신규] 요리 탭 도마 드래그 앤 드랍** (`UtilizationPanel.renderCooking`/`renderEmbeddedInventory`): **풀렌더 이미지 보유 어획물**(감성돔/광어/벵에돔/긴꼬리벵에돔 — `iconTexture` + textures.exists 판정)만 임베드 인벤토리 셀에서 드래그 가능. 드래그 중 고스트 이미지 표시 → 도마 영역(`cookBoardRect`) 드랍 시 `cookBoardFishId` 설정 → **도마에 실사 생선 대형 렌더** + 이름 라벨 + [내리기] 버튼. 아이템 소멸/텍스처 없음 시 도마 자동 비움. 손질(삼면뜨기)은 준비중 표기 유지.
- **[수정] 보일링/스쿨링 육지 최소 거리 (현실화)**: `FieldEventManager.landDistTiles`(체비쇼프 링 탐색) — **스쿨링 ≥ 10m(5타일), 보일링 ≥ 20m(10타일 — 청물은 먼 해양)**. 조건 만족 수역이 없는 얕은 내항은 발생하지 않음(의도). **거리대별 어종 구성**: 연안 스쿨링(10~20m) = 숭어 떼(striped/redlip_mullet)·연안 소형 무리 / 외양 스쿨링(20m+) = 회유 무리(고등어·전갱이·삼치·꽁치) / 보일링 = 청물(방어·부시리·잿방어·삼치). 어종 가중은 **패치별 저장**(`patch.speciesBias`)되어 착수 보너스에 그대로 전달, HUD 로그도 연안/외양 구분 안내.

**이전 변경 (2026-07-21 12차) — 파이트 2D 횡 러닝 + 루어 액션 그래머 + 파이트 UI 개편** (FIGHT_MODE_2D_SPEC.md 반영 후 삭제 — core 수치 시뮬레이션 검증):
- **대상**: 레거시 낚시 루프(`FishingScene` + `FishingFocusWindow` — FieldScene 계열). 기존 시스템(SizeTierRules/FeedingTimeCalculator/LuresCatalogDB/LinePhysics)은 **소비만** — 재구현·중복 확률식 없음.
- **[신규] `core/simulation/FightPhysics2D.ts`** — 측면하중 2D 파이트 물리:
  - `simulateFightTick2D`: LinePhysics 1D 수식(드랙 슬립/릴링/락업 0.90/파손 125%) **재사용** 위에 ① 스티어(←/→) `rodLeanAngle` 누적(무입력 시 자연 복원) ② 유효 라인각 `lineAngle − rodLean`과 heading의 차(`angleErr`)로 추진력을 **축(장력)+측면(하중)** 분해 ③ 결합 장력 = 축+측면 → 기존 위험도 임계(0.6/0.85)와 파손에 그대로 반영 ④ 측면압으로 물고기 머리를 라인 쪽으로 돌리기(제압, `turnResist` 감쇠) ⑤ `fishStamina ≤ 0.15` → 강제 회전+**옆으로 눕는 롤**(`isRolling`) ⑥ displacement = heading 추진 − 줄이 끄는 힘(뷰 스케일 주입).
  - `computeFishThrustKg`: 기존 fishRage(주기 sin+버스트) 유지하되 **버스트 dt 정규화**(`1−exp(−rate·dt)`) — 프레임레이트 의존 제거.
  - `pickRunHeading`: lateral/dive/jump/jet 성향 **가중 추첨**(모드 선택+스프레드 — 가중 "합산"은 대각선으로 뭉개져 금지) — 방향 하드코딩 없음.
  - `MOVEMENT_PROFILES` (표준 실코드 id): 청물(yellowtail/amberjack/greater_amberjack) 횡 러닝·고파워 / 참돔·광어·대구 수직박기 / 농어 상방 점프(포말) / squid·cuttlefish 뒤로 제트 / 볼락 하방. `TIER_POWER_MUL`/`TIER_STAMINA_MUL`(소0.8/중1.0/대1.3 — SizeTierRules 연동).
  - 검증(90틱 시뮬): 우측 러닝 시 **같은쪽 스티어 측면하중 0.73(버티기) ↔ 역스티어 1.78 + heading 0°→90°(제압)** / 저스태미나 2초 후 rolling + 라인각 정렬 0.09rad / 분포: 방어 횡68%·대구 하방81%.
- **[개편] `FishingFocusWindow` — 상단 앵커 2D 수중 단면 무대**: 파이팅 상태에서 찌 대신 걸린 물고기 1마리를 물리 구동 렌더(`updateFight2D`). 로드 팁 앵커 = 뷰 상단 중앙(스티어로 기울어짐) / **줄 색 = 텐션 연속 그라데이션**(미색→노랑→빨강, ≥0.85 깜빡임·굵기↑·미세 진동 — 텐션바 임계와 동일 값) / **깊이 → 투명도**(최소 알파 0.25)+축소 / 저스태미나 롤 = 납작+은빛 배. 뷰 반경 클램프는 뷰 책임(클램프 결과를 상태에 역반영해 물리 라인각 일치). + `nudgeBobber`(다트/저킹 임펄스)·`pulseShadowAttraction`(유인 반응).
- **[재배선] `FishingScene` 파이트 조작 — 십자 패드**: **←/→ = 로드 스티어**(폴링) · **↑/↓ = 드랙**(F/G 보조 유지) · **좌클릭 유지 = 릴링**(감기 전용 — 방향성 제거). 크기/tier를 **훅셋 시점에 확정**(`generateFishSize`+`classifySizeTier`) → 파이트 강도·스태미나 스케일. 러닝 heading은 `runDurationSec`마다 프로필 추첨.
- **[신규] 루어 액션 그래머 (in_water 페이즈 — 같은 키, 페이즈로 의미 분리)**: ←/→ 탭 = **다트** · ↑ = **저킹** · ↓ = **폴링 스테이** · 좌클릭 유지 = **리트리브**(600ms 주기 판정). `LureSpec.actionFlags/kind` 소비 — 다트(dart 플래그) 1.7 / 메탈지그 저킹 1.75 / 스푼·스피너·타이라바 등속 리트리브 1.55(과한 다트는 0.8 역효과) / 웜+지그헤드 **호핑 콤보**(↓→↑ 700ms 내) 1.8 / 폴링(fallLureWeight) 1.6. **리듬 보상**: 250ms 미만 과속 연타 ×0.6. **피딩타임 페이오프**: 기존 `computeFeedingActivity` 값 재사용(0.6~1.3 클램프 계수 — 새 확률식 금지). 결과 `lureActionMult`는 입질 롤에 곱하고 1.5초 유인 윈도우로 감쇠. 시각: 찌 임펄스 + 매칭 성공 시 그림자 유인.
- **통합 조작 체계**: 좌클릭 유지 = 차지/리트리브/릴링, ←→ = 다트/스티어, ↑↓ = 저킹·폴링/드랙 — 페이즈 배타로 키 충돌 없음.
- 잔여(차기): 스티어 어시스트 토글·A/D 대체 바인딩(접근성), dev 실관찰(줄색·롤·러닝 연출), 측면하중 계수/다트 리듬 간격 플레이 튜닝.

**이전 변경 (2026-07-21 11차) — 캐스팅 육지 차단 + 지깅 중대형 어종/크기 등급 + 피딩타임 + 보일링·스쿨링** (core 수치 시뮬레이션 검증):
- **[신규] 캐스팅 라인 경로 육지 차단** (`RegionFieldScene.castPathCrossesLand`): 착수점이 바다여도 **플레이어→착수점 직선(릴링 경로)이 중간에 육지(곶/방파제)를 가로지르면 강제 회수** — Bresenham 타일 레이캐스트, 발밑 선행 육지 구간은 허용하고 "물 진입 후 재육지"만 차단. 안내: "잘못된 캐스팅입니다 — 릴링 경로가 육지에 걸립니다" + HUD 로그 "캐스팅 과정에서 땅에 쓸리게 되므로 회수합니다."
- **[신규] 지깅/루어 중대형 어종 3종 + 4계층 등록** (2026-07 리서치 — 오라클 id 표준): **잿방어(greater_amberjack)·삼치(spanish_mackerel, 5월 금어기)·갑오징어(cuttlefish, egiOnly)** 를 오라클+FISH_DATABASE+SEAFOOD_AUCTION_MAPPING+MAFRA/KOSIS 매칭 전부 등록. FISH_DATABASE에 도감 미등록이던 **무늬오징어(squid)/문어(octopus)** 도 추가(총 49종). 방어 금지체장 30cm 반영(오라클+DB). ⚠️ 매칭 순서: **'잿방어'⊃'방어'라 MAFRA 테이블에서 '방어'보다 앞에 배치** / KOSIS '갑오징어'를 '오징어'보다 먼저. (기획 문서의 yellowtail_amberjack→기존 amberjack, olive_flounder→flatfish, bigfin_squid→squid로 실코드 id에 정합)
- **[갱신] 루어↔어종 매핑 (PART C 실데이터)**: 메탈지그 = 삼치/농어/대구/방어/부시리/잿방어(지깅 핵심) · 스푼/미노우 = 삼치+농어 · 소프트저크 = 농어+광어 · 웜+지그헤드 = 광어 다운샷+락피시 · 에기 spawnBinding에 cuttlefish 추가(+fallLureWeight 0.2 폴링 유인). **타이라바 신규 종류**(`LureKind 'tairaba'`, Deep Ruby 라운드 헤드 러버 45/60g — red_seabream +0.30, U창 하드 트리 등록). 참돔 baitPreference에 lure 25 추가(타이라바 반응 고증 — 검증: 타이라바 참돔 4.9%→17.7%).
- **[신규] 크기 등급(sizeTier) 시스템** (`core/simulation/SizeTierRules.ts`): 방어 출세어 기준 어종별 소/중/대 경계(`SIZE_TIER_BOUNDS` 7종) + **루어 무게↑ → 대물 tier 가중**(소형 하한은 항상 열림 — 소형 밴드는 오라클 minCm 아래 유어 구간 포함) + **청물(방어·부시리·잿방어·삼치) 야간 = 소형만**(주간 전용) + **급심 게이트**(zMax/50 비례 — 얕은 방파제 대형 저확률) + **농어 예외**(게이트 미적용 + `SpawnContext.inWashZone`(발앞 반탄류 존=포말대) × 야간 = 스폰 2.2배). `spawnFish`가 tier 등재 어종의 길이를 tier 규칙으로 roll. 검증(6천회): 방어 주간·급심·지그40g 소30/중40/대30 ↔ 야간 소형 98% ↔ 방파제12m 대형 4.4% / 농어 포말·야간 27.8%→45.3%.
- **[신규] 피딩타임 시스템** (`core/simulation/FeedingTimeCalculator.ts`): `computeFeedingActivity` = 계절 시간창(봄 07~10/15~18 · 여름 새벽/해질녘, 한낮 0.35 최저 · 가을 종일 활성 · 겨울 한낮 역전 집중) × 조류(만조 90분 전 최고/정조 급감/사리·조금) × 날씨(저기압 하강 보너스·비직전 급강하 1.3·흐린날 한낮 완화·냉수대 급감) → 0.2~1.5 배율 + 라벨(골든타임/활성/보통/저조). **동해 지역계수**(`feedingRegionProfileOf` — 조류 비중 0.45승, 시간창 1.15승). FP 입질 `baseProbPerSec`에 곱 + 좌측 게이지 "피딩 골든타임 x1.32" 표기(60초 주기 갱신). 검증: 여름 19시 조금+정조 0.70 ↔ 사리+만조전 1.50 / 동해 같은 정조 0.94.
- **[신규] 보일링/스쿨링 필드 이벤트** (`client/ui/FieldEventManager.ts`): 발생 롤 = rate × max(0, 피딩활성-0.5) (저조 시간대 미발생), 종류별 1개 상한 + 소멸 후 20~40초 쿨다운. ① **보일링**(표층·열린 수역) — 끓는 파문 3겹 링+포말+튀는 베이트+**갈매기 3마리 선회**(원거리 식별), 8~20초 회유 드리프트 후 소멸 ② **스쿨링**(구조물=육지 인접 수역) — 그림자 어영 8마리 군집 요동, 30~75초 고정. **착수점 판정**(`getLandingBonus`): 보일링 중심(<0.5R) 직격 = ×0.5 페널티(어군 흩어짐) / 가장자리 링(~1.6R) = ×1.8 + 청물 가중 + **tier 상향**(`eventTierBoost` — 소형 확률 40%를 중·대형으로 이전) / 스쿨 정확 스팟 = ×1.6 + 군집 어종 가중. `FirstPersonFishingInit.fieldEvent`로 1인칭에 전달 — 입질 배율+스폰 가중 병합+게이지 라벨 표시.
- 잔여(차기): 보일링/스쿨링 인게임 실발생 육안 확인(발생이 확률·피딩 연동이라 dev 장시간 관찰 필요), 스쿨 남획 상한(마릿수 소진 시 이동), FeedingActivity HUD 아이콘 노출, 기압 추세 실데이터(해양기상 기압 시계열) 연동.

**이전 변경 (2026-07-21 10차) — 쿨러(어창) 시스템 전면 개편 + 밑밥 배합(품질) 시스템** (헤드리스 브라우저 6항목 전체 통과):
- **[신규] CoolerStore** (`client-pc/store/CoolerStore.ts`): 어창 3x3(9칸) 세션 스토어 — 낚은 개체를 **활어 상태로 보관 (쿨러 안에서는 신선도 시계 정지 → 일반 인벤토리 보관보다 오래 유지)**, 인벤 이송 시점부터 'live'로 신선도 진행. + 밑밥 배합 상태(`chumIngredients`/`chumWaterAdded`/`chumMixed`/`chumRemaining` 0~100, `CHUM_THROW_COST` 25).
- **[개편] 어획 결과 흐름** (`FirstPersonFishingScene`): 자동 인벤토리 지급 제거 → **[쿨러에 넣기] / [방생하기] 선택** → "쿨러에 보관하였습니다." / "해당 어종을 방생하였습니다." → **[계속하기] / [그만하기]**. 도감 등록은 어획 시점 유지. 다관점 히트 추가 어획은 어창으로 직행(가득 시 '방생' 표기). 쿨러 가득(9마리) 시 넣기 차단 안내.
- **[신규] CoolerPanel 3x3 팝업** (`ui/CoolerPanel.ts`): 1인칭 쿨러 좌측(어창) 클릭 / **탑다운 B 키**로 공용 열람. 셀 우클릭(좌클릭 겸용) 컨텍스트 메뉴 — **상세보기**(ItemDetailPanel 재사용) / **방생하기**("정말 방생하시겠습니까? 예/아니오" 확인창) / **손질하기(준비중 — 비활성)**.
- **[신규] 종료 시 어창→인벤 이송 + 강제 방생 흐름**: 1인칭 종료(그만하기/ESC/실패/채비 회수) 시 어창 어획을 인벤토리(음식 탭)로 이송. **빈 소켓 부족 시 "인벤토리 공간이 모자라, 방생을 진행해야 합니다!" → [다음] → 강제 방생 모드 어창 팝업(ESC/X 닫기 차단, `lockedOpen`)** — 부족분만큼 방생해야 [계속하기]로 이송·종료가 진행된다.
- **[개편] 밑밥 체계**: 기존 '집어제 아이템 수량 연동' 제거 → **배합 밑밥 게이지**. 1인칭 쿨러 우측 '밑밥 (C)' — 미배합 시 **'비어있음'**, 배합 후 **'N / 100'**, C 투척 1회당 **25 소모**(0 도달 시 통 리셋. 추후 능력치/고급 제품으로 소모량 감소 예정). 쿨러 UI 좌우 340px 확장(어창/밑밥 2분할 + 좌측 클릭 = 어창 팝업).
- **[신규] U 밑밥 품질 탭** (`UtilizationPanel` 3번째 탭): 좌측 밑밥 통(탑뷰 흰 통) + 우측 밑밥 재료 임베드 인벤토리(`chumKind` 보유 소모품). **드래그 앤 드랍 투입 연출** — ① 파우더/빵가루: 봉투를 찢고 우측 대각선에서 가루 들이붓기 ② 냉동 크릴: 분홍 블록이 두 덩어리로 쪼개지며 낙하(Bounce) ③ 압맥/옥수수: 낱알 우수수 낙하. 재료는 투입 순서대로 통 안에 쌓여 렌더. **[물 넣기](1회, 재료 1개 이상) → [섞기](1회) → 배합 완료 100 충전**. 하단 추천 배합 코멘트(① 국민 표준 ② 고수심·빠른 조류 ③ 잡어 퇴치 + 현장 요령). 남은 밑밥이 있으면 새 배합 불가(재료 잠금).
- **[신규] 밑밥 재료 아이템 6종 시드** (`InvItem.chumKind`: powder/krill/grain): 감성돔 집어 파우더 · 고비중 파우더 · 빵가루 · 냉동 크릴 블록 · 압맥 · 옥수수 캔 (+기존 집어제도 powder 편입).
- 검증(브라우저 6항목 PASS): 결정 흐름(넣기→보관 메시지→계속/그만) / 방생 메시지 / 3x3 팝업·컨텍스트 메뉴·방생 확인창 / **강제 방생 ESC 차단→방생→복귀** / 밑밥 비어있음→C 차단→배합 100→투척 후 75/100 / 탑다운 B 어창·밑밥 탭 드래그 투입(수량 차감)·물·섞기 100/100.
- ⚠️ **검증 하네스 함정 (신규)**: 새 브라우저 프로필은 1인칭 첫 진입 가이드가 자동 표시돼 클릭을 가로챈다 — Playwright 검증 시 `localStorage 'tra_fp_guide_seen'` 프리시드 필수. `page.goto`는 외부 API 폴링 때문에 `networkidle` 대신 `domcontentloaded` + 씬 활성 `waitForFunction` 사용.
- **[배포] 2차 테스트 빌드 gh-pages 재배포 (2026-07-21, 커밋 871dc8d)** — https://sarsah93.github.io/Pixel-Angler-The-Real/ 라이브 검증 완료(404 0건, pageerror 0건, 메인 메뉴 기동). 7~10차 변경 전체 포함.

**이전 변경 (2026-07-20 9차) — 채비 회수 + 액션 반응형 지깅 + 입질 유도 + 어종 주야간/수심층 전수 검토** (핵심 시뮬레이션 + 헤드리스 브라우저 검증 완료):
- **[신규] 채비 회수 → 탑다운 복귀 (모든 조법 공통)** (`FirstPersonFishingScene.retrieveRig`): 릴링으로 수면 거리 `distM ≤ 0.5m`(발앞) 도달 시 "채비를/루어를 회수했습니다" 배너 + `fp_exit_msg` 안내와 함께 1인칭 종료 → stop/resume으로 탑다운 필드 복귀 (손실 없음, 회수 중 입질/입력 차단).
  - **[수정] 조류 드리프트 거리 하한 1m → 0.3m**: 기존 `Math.max(1, …)` 하한이 매 프레임 릴링 감소를 1m로 되돌려 **회수 지점(0.5m)에 절대 도달할 수 없던 실버그** — 브라우저 검증에서 발견·수정. 회수는 의도적 릴링으로만 발생(조류만으로는 0.3m 하한에 머묾).
- **[신규] 루어/지깅 액션 반응형 입질** (`lureActionMult`): 루어 모드는 찌낚시(기다림)와 달리 **액션이 입질을 만든다** — 방치 idle **0.15배**(루어는 움직이지 않으면 물지 않음) / 리트리브 2.2 / 리프트 1.8 / **폴 2.6**(폴링이 실제로 가장 잘 무는 순간) / 트위칭 3.0 / 호핑 2.0. 메탈지그(fast_sinking) 리프트앤폴 지깅은 추가 ×1.3. 게이지에 `[액션 x2.2]` / `[루어 방치 x0.15 — 액션 필요!]` 실시간 표기. 중대형 회유어 타겟팅은 기존 LureSpec `speciesWeightBias`가 담당(액션 배율과 곱 연동).
- **[신규] 입질 유도** (`BiteSequenceEngine.provoke`): 입질 1~2단계(또는 직후 공백) 중 **릴링 1초 유지 or 뒷줄견제(H)** → **70% 확률로 다음 단계가 3단계(완전 흡입)로 승격**(짧은 공백 0.6~1.6초 후). 시퀀스당 1회만 판정, 실패(30%) 시 페널티 없이 원 패턴 지속. 성공 시 "입질 유도 성공" 안내. (2000회 시뮬레이션: 승격 70.0%, 재호출 차단 100%, 승격 후 3단계 강제·공백 ≤1.7s 100% / 브라우저: 릴링 1s → provoke 호출 → 51° 3단계 굽힘 실관측)
- **[갱신] 오라클 주야간/수심층 전수 검토** (`FishSpawningOracle`, 실제 생태 기반 — 43종 전수):
  - **주행성 어종 야간 억제 신규**: 용치놀래기 0.1(밤에 모래에 파묻혀 잠)·쥐치 0.25·말쥐치 0.3·돌돔/강담돔 0.35(낮 시력 사냥꾼)·복어류 0.4·망상어 0.4·벵에돔 0.5·부시리/방어 0.5(여명/황혼 피딩)·문절망둑/쥐노래미/노래미 0.6·숭어류 0.6·광어 0.7·가자미류/덕대/병어 0.7.
  - **야행성 보너스 추가**: 청볼락 1.8(볼락류 정렬)·무늬오징어 1.6(야간 에깅)·감성돔 1.5(밤 대물)·문어 1.5·참돔 1.3·긴꼬리벵에돔 1.3·고등어 1.2(집어등).
  - **수심층 2단계 분리**: 층 불일치 페널티 단일 0.15 → **인접층 0.15 / 두 층 어긋남 0.03**(저서 어종이 표층에 뜨는 일 차단).
  - 검증(5000회 스폰 분포): 용치놀래기 주간 14.0% → **야간 1.7%**, 광어 표층 출현 1.0%(생미끼 추격 마진), 야간 표층은 꽁치/갈치/볼락 우세·부시리/방어 급감, 야간 바닥 여밭은 열기/황볼락/감성돔 급증 — 실제 밤낚시 조과 구성과 일치.

**이전 변경 (2026-07-20 8차) — 루어(가짜 미끼) 채비 시스템 신설** (헤드리스 브라우저 렌더 검증):
- **[신규 데이터] 루어 카탈로그** (`core/types/Lure.ts` + `core/db-schema/LuresCatalogDB.ts`): 7종 15변종 제원(원안 유지) — 웜/그럽(Nature Tail 2.5/4g)·소프트 저크베이트(Fluid 7/11.5g)·미노우(Prism Aqua 플로팅12/싱킹15.5g)·스푼(Blade Studio 14/21g)·스피너(Blade Studio 5.5/8g)·에기(Kraken 2.5호10.5/3.5호20g)·메탈지그(Iron Forge 28/40g). 물리·타겟은 전부 LureSpec **데이터로만** 표현(하드코딩 버프 금지): `dragCoefficient`(메탈지그 base×0.65=−35% 초장타)·`sinkType`/`sinkRateMps`/`diveDepthPerRetrieve`·`speciesWeightBias`·`spawnBinding`·`targetHabitatBias`·`fallLureWeight`·`actionFlags`·`snagRiskMult`(에기 0.7).
- **[신규 연산] `core/simulation/LureRig.ts`**: `computeLureRigWeight`(소프트=웜+지그헤드, 하드=자중)·`getLureCastCd`·`getLureSinkProfile`(지그헤드 무게로 침강 가속)·`JIGHEAD_WEIGHTS_G`. UI는 표시만, 계산은 core.
- **[신규] 두족류 어종 + 스폰 바인딩** (`FishSpawningOracle`): squid/octopus(egiOnly) 추가 + `SpawnContext`에 `speciesFilter`(에기 spawnBinding)·`speciesWeightBias`·`habitatBias` 신설, `weightedCandidates`가 소비(egiOnly는 필터에 있을 때만 등장).
- **[신규] 채비 모드 판별 유니온** (`InventoryStore.rigMode: 'bait'|'lure'`): 'lure'면 찌·면사매듭·수중찌·봉돌 검증을 **모드 분기로 건너뛰고**(소켓 해제 아님) 원줄+목줄+루어(+소프트면 지그헤드)만 필수. `_lure`/`_jigHead` 병렬 소켓. 'lure' 카테고리 신설 + 루어 15종·지그헤드 5종 시드(수동 검증용). `getRigDragCd`가 루어 모드에서 루어 Cd 반환.
- **[연동] 물리/엔진** (하드코딩 없이 데이터 소비): ① 비거리 — `RegionFieldScene.launchCast(airDragCd: getRigDragCd())` → 메탈지그 초장타 ② 침강 — `FirstPersonFishingScene`가 `getLureSinkProfile` 소비: floating은 리트리브로 파고들고 멈추면 부상 / sinking·fast_sinking은 고유 속도로 **투척지점 국소수심(`getBottomDepthAt` 전방호환 훅)**까지 하강 ③ 타겟 — 스폰 컨텍스트에 루어 `speciesWeightBias`/`spawnBinding`/`targetHabitatBias` 주입, 에기 `snagRiskMult`로 밑걸림 감소.
- **[신규] 손실 규칙** (사용자 지정): **루어는 입질/챔질 실패로 잃지 않는다**(`_lure` 소켓은 `loseRigParts`가 건드리지 않음) — 목줄째 터지는 경우(줄터짐/과부하/복어 절단/밑걸림)에만 `loseLureRig()`로 손실. **실미끼는 1단계 챔질 실패 시 60% 잔존**(40% 소모), 물고기가 따먹으면 교체. `hookNeedsBait()`가 루어 모드에서 false.
- **[신규 UI] 루어 채비 UI** (`UtilizationPanel`): 채비 탭 상단 **[미끼 채비]/[루어 채비] 모드 토글** + 2단계 종류 트리(소프트/하드 → 종류) + 라인업 카드 + **지그헤드 소켓**(소프트 전용) + **루어 제원 실시간 표시**(총무게 웜+지그헤드 합산·침강·C_d·타겟 가중·액션·손실규칙 안내). 계산은 core 호출, UI는 표시만.
- ⚠️ 상점 판매 등록은 그리드 오버플로 회피 위해 보류(전종 인벤토리 시드로 검증 가능) — 추후 낚시점 전용 상점 신설 시 등록.

**이전 변경 (2026-07-20 7차) — 입질 단계 차별화 + 채비 당겨짐 연출 + 원투 채비 체계 + 채비 추천 알고리즘** (헤드리스 브라우저 렌더 검증):
- **[수정] 입질 구부러짐 단계 차별화** (`core/BiteSequenceEngine` STAGE_PROFILE): 1/2/3단계 피크 각도 -10° (30→20 / 45→35 / 60→50) + **단계별 형태 명확히 분리** — 1단계 짧은 단발 톡(0.4초), 2단계 두 번 끄덕(35→18→32), 3단계 크게 실려 오래 유지(50→42 hold). 강도 보정 +8°→+4°로 낮춰 단계 간 각도차 유지. (검증: 피크 20/35/49, 형태 상이)
- **[신규] 입질/챔질 시 채비 전체 당겨짐** (`FirstPersonFishingScene.renderRigVisuals`): 초릿대 굽힘(rodBendDeg) 비례 `bitePull`(최대 44px)을 **찌·수중 라인·목줄·미끼 전체 Y에 적용** — 물고기가 미끼를 물고 끌면 채비가 함께 바다 속으로 딸려간다. 찌낚시는 찌가 수면 아래로 잠기고, 원투는 라인 진입점부터 딸려간다.
- **[신규] 원투(찌 없이 도래 직결) 채비 체계 정립**:
  - **찌 필수 조건 해제** (`InventoryStore.getMissingRigParts`): `isSurfRigReady()`(찌 비움+도래)면 **단일 봉돌 채비 포함** 찌를 필수에서 제외. "찌를 채워야 캐스팅" 경고는 찌낚시 모드에서만. 대신 원투는 **무게추 봉돌**이 필수.
  - **1인칭 원투 모드** (`surfMode`): 찌 미표시(`floatObj.setVisible(false)`), 입질은 **초릿대 끝**으로 판단, 수심 패널에 '원투 (찌 없음)/입질은 초릿대 끝' + 채비 위 무게추 봉돌 렌더.
  - **봉돌 소켓 모드 분기** (`UtilizationPanel`): 원투 → '무게추 봉돌'(좁쌀 비활성), 찌낚시 → '봉돌(좁쌀)'.
  - **[신규 DB] 무게추 봉돌** (`core/db-schema/SinkerDatabase.ts`): 무게(g)=호수×3.75. ① 고리봉돌(HaeDong 16~30호) ② 구멍봉돌(BaekKyung 10~30호 — **예신 피드백 +15%** `SINKER_HOLE_FEEDBACK_MULT`, BiteSequenceEngine `stageTimeScale`로 단계 지속 1.15배) ③ 묶음추봉돌(Sapa 16~30호 — **C_d 0.42→0.58** 비거리 페널티). 총 13종.
  - **총무게/V_z 실시간 반영**: `computeRigSpec`가 `sinkerWeightG` 합산 → 침강 속도 무게 비례 가속(75g → V_z 2.31m/s 실측), C_d는 봉돌 종류가 결정. 원투 낚싯대 허용 중량 `SURF_ROD_CAPACITY_G` 150g.
- **[신규] 채비 추천 알고리즘** (`core/simulation/RigRecommender.ts` + `client/store/RecommendationStore.ts`): 지역/지형(밑걸림 위험)/물때(조류)/대상어종(오라클 서식지·미끼 선호) → **조법·찌 호수·무게추 봉돌 종류·호수·미끼** 추천. U 채비창 상단 추천 배너 + 빈 추천 소켓 '추천' 배지 + 부품 선택 리스트 상단 정렬/배지, **낚시용품 상점(직판장 채비 코너)** 그리드 금색 '추천' 배지. (검증: 속초항=원투/구멍봉돌 20~25호 → 상점 구멍봉돌 20·25호와 크릴·갯지렁이에 배지)
- ⚠️ **헤드리스 검증**: DraggablePanel은 `scene.add.existing(panel)` 필요(Container 자동 등록 안 됨). Vite dev 재시작 후 하네스 `.ts` 임포트가 게임 인스턴스와 일치(HMR `?t=` 분화 회피).

**이전 변경 (2026-07-20 6차) — 1인칭 낚싯대 재설계(좌/우 로드·릴) + 입질 연출 완화 + UI 가시성** (헤드리스 브라우저 렌더 검증):
- **[재작성] 낚싯대 렌더** (`FirstPersonFishingScene.renderRod`): 단순 2절 베지어 → **5절 로드**(버트 그립→블랭크 3절→초릿대, 절 경계마다 가이드 링, 버트 7px→초릿대 1.5px 테이퍼). 하단 모서리에서 **스피닝릴**(스템+기어박스+스풀+베일암+핸들) 렌더.
  - **[버그 수정] 구부러짐 방향**: 초릿대가 하늘(우상단)로 휘던 문제 → **항상 물(찌·수면) 쪽으로 벤딩**. 우측 로드는 로드 직선 기준 좌하단, 좌측 로드는 우하단. 끝 3개 절만 굽힘 분담(`BEND_SHARE` 0/0/0.22/0.33/0.45).
- **[신규] 설정 '낚시' 탭** (`SettingsScene.renderFishingTab` + `GameSettings.rodSide`/`reelHandle`): ① **낚싯대 위치 좌/우** — 화면 중앙 기준 반대편에 로드 배치 ② **릴 핸들 좌/우** — 화면이 아닌 **로드(버트→팁) 기준** 좌/우로 핸들 렌더 방향 결정. `loadSettings()`가 기존 저장본에 신규 필드를 기본값 병합(`rodSide:'right'`/`reelHandle:'left'`). FP 씬 `create()`에서 로드해 반영.
  - **로드 반대편으로 하단 버튼 이동**: 우측 로드면 릴이 그만하기/도움말 버튼에 가려지므로, 두 버튼을 **로드 반대편 하단**으로 배치(`exitX`/help `bx` 로드측 분기).
- **[완화] 입질 구부러짐 연출 +0.5초** (`core/BiteSequenceEngine`): `STAGE_DURATION` 1/2/3단계 0.5/0.95/1.25s → **1.0/1.45/1.75s**, 키프레임·`STAGE3_RELEASE_START`(1.0→1.5s) 동반 조정. 챔질 타이밍 여유 확보.
- **[개선] UI 가시성**: ① 수심 정보 패널 소폭 축소(354×302→338×288, 게이지 박스 206→196) ② 상태 조작 가이드 바를 쿨러 위로 올림(H-118→H-152 — 쿨러와 겹침 해소) ③ **수중 채비 반투명**: 찌 아래 수중 라인·미끼 알파 0.55/0.38(수면 아래 채비 표현, 모자이크 아님).

**이전 변경 (2026-07-20 5차) — 메인 메뉴 하단 정보 티커 (서비스 지역 순환)** (헤드리스 브라우저 렌더 검증):
- **[개편] 하단 바 → 순환 티커** (`MainMenuScene.buildTickerMessages`/`startTicker`): 거제 구조라 고정 환경 라인(EnvironmentStore) 제거 → **서비스 중(출조 구역 보유 = `REGION_AREA_NODES`) 지역별 4종 메시지 순환** (8초 간격 페이드 전환, 첫 메시지는 즉시 표시).
  ① 실황 환경(날씨/기온/수온/풍속/파고) + **7단계 낚시 등급**(최적/좋음/양호/보통/나쁨/매우나쁨/최악) ② **경락 시세 변동 TOP5**(1~5위 품목·원/kg·▲▼%) ③ **어획량 상위 어종**(KOSIS 최신 수록월·톤) ④ **선호 어종 입질 전망**(어종(서식지형·수심층) %).
  긴 메시지는 폭 1060px 초과 시 `setScale` 자동 축소(시계/버전 표기와 겹침 방지).
- **[신규] ExternalDataStore 티커 접근자 7종**: `getServicedRegionIds`(= REGION_AREA_NODES 키) / `getRegionName`(전국 지도 노드명) / `getRegionFishingIndex`(**지명 키워드 매칭** — `REGION_TO_INDEX_KEYWORDS` 속초·부산) / `getFishingGrade`(**실데이터 합성 7단계** — 낚시지수 5단계 기저 15~85점 + 파고/풍속/강수·안개 가감 → 7구간) / `getTopMarketMovers`(**전국 거래량 × KOSIS 지역 어획 가중** 랭킹, changePct = 기본 단가 대비) / `getRegionTopCatch`(시도 필터 + 최신 period만) / `getRegionBiteOutlook`(낚시지수 배율 × 어획 가중 × 오라클 물때 활성도 × 야간 보정 → 3~92% 클램프, 서식지/수심층 라벨).
- ⚠️ **헤드리스 검증 함정**: `--virtual-time-budget` 헤드리스 크롬에서는 Phaser 게임 루프(트윈 onComplete/타이머)가 진행되지 않는다 — setText 등 즉시 반영만 스크린샷 검증 가능. 티커 첫 메시지를 트윈 없이 즉시 적용하도록 설계한 이유.

**이전 변경 (2026-07-20 4차) — 1인칭 실시간 하늘/날씨 + 메인 메뉴 API 상태 패널** (헤드리스 브라우저 렌더 검증):
- **[신규] 1인칭 배경 실시간 반영** (`FirstPersonFishingScene.buildBackdrop` 재작성): 고정 맑은 하늘 → **시간대(kstHour) × 날씨(`ExternalDataStore.getWeatherKind`) 매트릭스**.
  - 하늘 4밴드 팔레트: 야간(맑음=별 46개 트윙클+달 / 흐림·강수=더 어두운 잿빛) / 황혼(맑음=수평선 낮은 석양 해 / 흐림) / 안개(잿빛 균일+수평선 실루엣 α0.15) / 흐림·비(회색) / 주간 맑음(해 글로우). 흐린 주간엔 드리프트 구름 타원 5개.
  - **수중 그라데이션 밝기 연동**: `waterDim` 야간 0.45 / 황혼 0.7 / 흐림·강수 0.75 / 안개 0.85 곱.
  - **1인칭 날씨 파티클**: 비/진눈깨비 70개·소나기 110개(사선 낙하+바람 드리프트, depth 70 — 낚싯대 60 위·수심 패널 85 아래) / 눈 50개(사인 흔들림) / 안개(수평선 헤이즈 띠 2겹+블롭 5개, depth 58). 풀은 `init()` 리셋, `updateFpWeather(dt)`가 update 최상단에서 구동.
- **[신규] 메인 메뉴 API 연동 상태 패널** (`MainMenuScene.drawApiStatusPanel` + `ExternalDataStore.getApiStatusList()`): 좌하단 "실시간 데이터 연동" 박스 — 5개 소스(바다낚시지수/경락가 MAFRA/어획량 KOSIS/해양기상 NMPNT/기상청 단기예보) 각각 **점 색으로 상태 구분**(실데이터 초록 / Mock 주황 / 수집 중 회색) + 건수 상세(예: "76개 관측소", "11/11개 지역"). 수집 전 즉시 그려지고 `fetchAll()` 완료 시 `refreshApiStatus()` 갱신(씬 이탈 가드 `scene.isActive()`).

**이전 변경 (2026-07-20 3차) — 탑다운 수심 타일 + 낮/밤 조명 + 날씨**:
- **[개편] 바다 타일 수심 렌더** (`RegionFieldScene.renderTerrain`): 단색 바다 → **육지 거리 기반 6단계 수심 그라데이션**(멀티소스 BFS `computeWaterDistance` — 물가 모래톱→얕은 연안→…→심해). **암초/여 지대**는 mapId 해시 시드 2D 값 노이즈(임계 0.72, 타일 비율 ~17-21%)로 결정적 배치 — 주변보다 2단계 얕은 색(융기 단차) + 수중 바위 점묘, 깊은 구역엔 해구 얼룩. 맵 텍스처 베이킹 캐시(`rmaptex_`) 유지 — **알고리즘 변경 시 브라우저 풀 리로드 필요**(세션 내 캐시).
- **[신규] 낮/밤 대기 + 조명** (`setupAtmosphere`): KST 시각 기준 야간(20~05시) 0.45/황혼(17~20·05~07시) 0.24 명암 오버레이(depth 40, HUD 아래). **밤 점등**: ① 건물 — 창문 불빛 2개(텍스처 창 위치 정합)+주변광 글로우+**종류별 네온사인**(편의점 초록/마트 주황/직판장 빨강/카페 크림/주점 보라 — ADD 블렌드, 불규칙 명멸 트윈) ② **방파제 가로등** — 양옆이 바다인 통로 타일에 6타일 간격 자동 배치(`lamp_post` 텍스처, 낮에도 기둥 표시), 밤엔 전구 글로우+바닥 광 풀+명멸. 조명은 depth 42로 명암 오버레이 위에 렌더되어 어둠을 뚫는 연출.
- **[신규] 날씨 효과** (기상청 실데이터 `ExternalDataStore.getWeatherKind` 연동): 비/소나기/진눈깨비 — 사선 빗줄기 풀(80~120개, 바람 드리프트)+톤 다운 / 눈 — 흔들리며 낙하 / **안개** — 전체 헤이즈+드리프트 블롭 6개(해양기상 시정<1km 판정 포함) / 흐림 — 회색 명암. 파티클은 화면 고정(depth 45-46), 일시정지와 무관하게 `updateWeatherFx`로 흐름.

**이전 변경 (2026-07-20 2차) — 해저 지형 프로필 연동 + 뒷줄견제 재정의 + 가이드 UX**:
- **[연결] SeabedProfile → 인게임 (Q3 완료)**: 미연결 상태로 남아 있던 `core/simulation/SeabedProfile.ts`를 정식 연동. ① `rockRatio` 파라미터 신설 — 낚시터 `snagRisk` 연동(low 26% / mid 38% / high 53% 암초, 5시드 평균 실측) ② 침강 바닥 한계 = `min(Z_limit, seabed.depthAt(distM))` — 릴링 중 암초 단차를 채비가 타고 오름 ③ **여밭 판정 일원화**: 구 `isReefAt`(측면 X 해시) 제거 → `seabed.isRockAt(distM)` (입질 지형/밑걸림/스폰 컨텍스트 모두) ④ 수심 모식도 게이지 박스에 **거리 창(±12m) 해저 단면** 렌더 — 암초(거친 능선)/모래/흔들리는 수초, 릴링 시 단면이 유저 쪽 지형으로 스크롤. 우측 텍스트 열 '바닥'이 실지형 수심(소수점) 표기 + '여 밭 + 수초' 상태 추가. (추후 어탐 레이더가 같은 프로필 조회)
- **[재정의] 뒷줄견제(H) = 그 지점 홀드** (`LineTensionPhysics` 재작성): 릴에서 나오는 줄을 손으로 잡는 행위 고증 — H 누르는 순간 **0.2m만 원샷 상승(`HOLD_LIFT_M`) 후 정지**(씬 `holdAnchorZ` 앵커), 홀드 중 침강·드리프트 완전 정지(driftBrake 0), **속조류에 의한 정렬도(A)만 진행**(조류 셀수록 빠름). 연속 양력(`baitLiftMps`) 제거 — 항상 0. 리액션 트리거(바닥 안착에서 H 순간)는 유지. 릴링(거리 좁힘)과 역할 분리. 구 전유동 H 침강 정지 특례는 이 로직이 포괄.
- **[개선] 1인칭 가이드 UX**: ① 초릿대 굽힘 도해 좌우 반전 — 실게임과 같이 **팁이 왼쪽**으로 휨, 단계별 색상을 헤더/히트 문구에도 적용 ② 패널 520px 확장 + 네비 버튼 24px 안쪽 마진 — 다음 버튼 잘림/푸터 겹침 해소 ③ 2~4페이지를 **키 배지(페이지 색 강조 pill) + 설명 + note(부연 dim)/warn(경고 주황 bold)** 행 구조로 재작성 — 동일 크기·색 텍스트 나열 제거 ④ H 설명을 새 홀드 물리에 맞게 갱신.

**이전 변경 (2026-07-20 1차) — 문서 현행화 + 다음 작업 큐 등록**:
- `git reset --hard origin/main`(b9f312f) 기점으로 README.md 전면 현행화 (1인칭 챔질/조류 존/편대, 부산 8맵, GitHub Pages URL, 실데이터 표, 어종 43종 반영).
- **다음 작업은 `IMPLEMENTATION_PLAN.md` 최상단 "▶ 다음 작업 큐" 참고** — Q1 입질 1·2단계 견제/릴링 유도(3단계 확률 ×1.7), Q2 가이드 고도화(상관관계+예시 이미지), Q3 수심 모식도 동적 바닥 지형(거리 연속 프로필), Q4 어탐 레이더 대비 구조, Q5 신규 해양 API 5종(어초정보/해수유동 3분/수치조류도/자연과학용 수심/조석예보 고·저조 — 명세 수록).
- 루트 신규 자료: `격자3단계_격자번호.xlsx`(해수유동 격자), `오픈API 활용가이드_자연과학용 수심정보.hwp`, `오픈API 활용가이드_조석예보(고, 저조).hwp`.

**이전 변경 (2026-07-19 3차) — 1인칭 UI 다듬기** (브라우저 실렌더 검증 완료):
- **[수정] 낚싯대 가시성**: 초릿대 끝이 화면 밖(상단)으로 나가던 문제 — 대 전체 높이를 낮추고(bodyTip y≈300) 팁 세그먼트 길이 축소(~140px). **팁을 수심 패널 왼쪽 바깥(x≈832)에 배치**해 패널과도 겹치지 않음. 수심 패널은 전용 `panelG`(depth 85)로 분리 — 낚싯대(depth 60)보다 항상 위.
- **[개편] 우측 수심 모식도 2배 확장** (170→354px): 좌측 **넓은 게이지 박스**(206px — 수심층 가로 경계선 + **채비 좌우 편차 표시**: 찌 기준 baitX 오프셋 사선 침강 라인) + 우측 텍스트 열(찌/매듭/채비/바닥/지형/존 — 캡처 명세대로 분리). 면사매듭·바닥도 박스 전체 폭 라인.
- **[개편] 가이드를 우선순위별 4페이지 스텝으로 재구성** (한 화면 전부 나열 → 단계별 설명 + 상관성 중심):
  1. **입질 읽기** — 3단계 구부러짐 카드(도해+설명+**히트 가능성 문구**: "거의 드뭅니다(5%)"/"성공할 수 있으나 힘듭니다(20%)"/"가장 높습니다(100%), 펴지는 순간은 무조건 실패") + 찌 잠김 상관성
  2. **챔질 타이밍** — 성급한 챔질 경고·골든 타임·어종별 패턴(광어/감성돔) 학습
  3. **채비 다루기** — H/C/↑/릴링 방향성/탭·더블탭/조경지대
  4. **파이팅** — 텐션 30~80·저항·줄터짐·패턴 대응
  이전/다음 네비게이션 + 페이지 점 표시, 마지막 페이지에 "낚시 시작하기!".

**이전 변경 (2026-07-19 2차) — 1인칭 온보딩 가이드 + 이벤트 이펙트** (브라우저 실렌더 검증 완료):
- **[신규] 첫 진입 튜토리얼 오버레이**: 1인칭 최초 진입 시 자동 표시(`localStorage 'tra_fp_guide_seen'` 영속) — 3열 카드(채비 흘리기/입질 읽기/챔질·파이팅) + **초릿대 3단계 굽힘 미니 도해**(30°/45°/60° 색상 곡선). 이후 **F1 또는 우하단 ? 버튼**으로 재열람. 오버레이 열림 중 낚시 입력(챔질/릴링) 차단.
- **[신규] 상태별 하단 조작 가이드 바**: drift("우클릭 챔질 · 탭 호핑 · 더블탭 트위칭 · ↑ 리프트…") / 입질 중("3단계에 우클릭 챔질 — 1단계 5%·2단계 20%·3단계 100%") / 파이팅("텐션 30~80 · 한계 텐션 릴링 강행 = 줄터짐")으로 자동 전환.
- **[신규] 이벤트 이펙트**: ① 입질 단계 진입 1회 — 찌 파문(단계별 크기)+느낌표(!/!!/!!!)+카메라 쉐이크(강도별), **3단계는 "지금 챔질! (우클릭)" 강조 배너** ② 챔질 성공 — **HOOK UP!** 배너+화면 플래시 ③ 파이팅 텐션 85+ — **화면 테두리 붉은 비네트 펄스** ④ 조류 존 전환 토스트(조경지대 "입질 확률 급상승!" / 본류 "채비 정렬 불가" 경고 — 일반 존은 조용히).

**이전 변경 (2026-07-19 1차) — 1인칭 낚시 전면 개편 (챔질/조류/조법/편대)**:
- **[신규] BiteSequenceEngine** (core, 수치 검증 완료): 입질 이벤트 → **초릿대 구부러짐 3단계** 시퀀스 → **우클릭 챔질 성공 시에만 파이팅** (기존 자동 진입 대체).
  - 단계: 1단계 30°/0.5s(챔질 5%) · 2단계 45°→30°/0.95s(20%) · 3단계 60°→50° 1.25s(**100%**, 단 릴리즈 1.0s 이후는 100% 실패 "너무 늦게"). 실패 시 미끼 손실 + "다시 캐스팅" 가이드.
  - 패턴 7종 (30/10/20/10/10/10/10% — 1만회 분포 검증 29.8/9.6/20.1/10.7/9.4/10.6/9.7). 단계 간 간격 1~180s 랜덤, **입질 확률↑ → 간격 짧아지고 최대 5연속 반복 + 강도 보정**.
  - **어종 mock**: 광어 `[3]` 단발 / 감성돔 `[1→3]` (SPECIES_PATTERN — 추후 어종 DB 이관). 찌 잠김 1단계 0.05m/2단계 0.10m/3단계 0.25m (우측 패널 `-0.25m` 표기 + 찌 시각 잠김).
- **[신규] TidalCurrentEngine** (core): 조수(V_tide=물때×sin(2π/12.5·t), 밀물/썰물 방향 반전)·**반탄류**(발앞, +Y 수면거리 증가)·**조경지대**(입질 1.6배·침강 1.35배 Hit Zone + 수면 포말 이펙트)·**횡조류**(-Y 거리 감소·침강 저항)·**본대조류**(X 3배 급류·입질 0.35배). 존 경계는 캐스팅 거리 비례. `distM`(수면 거리)이 실시간 표기·존 판정 기준.
- **[변경] 1인칭 조작 체계** (FirstPersonFishingScene, 브라우저 실동작 검증 완료):
  - **우클릭 = 챔질** / 좌클릭 홀드 = 릴링(거리 좁힘 + **화면 좌/우측에 따라 채비 좌/우 당김**, 조류 순방향 1.4배·역방향 0.65배+리액션 유도) / **↑ 홀드 = 리프트**(수심 상승, 떼면 재침강) / 좌클릭 싱글탭 = **호핑** / 더블탭 = **트위칭·저킹**(0.8s 쿨다운, 1m 상승 후 0.6m 하강).
  - **텐션 저항**: 텐션 70+에서 릴링이 확률적으로 미끄러지고, 88+에서 릴링 강행 0.55s → **과부하 줄터짐**(`forceLineBreak`).
  - **조법**: 면사매듭 U창 토글 제거 → **전유동**(Z_limit ∞ 무한 침강 + H 견제 시 침강 정지) / **잠길찌**(잠길찌 타입 or 잔존 부력<0 → 안내 문구).
  - 낚싯대 렌더 개편: 대를 화면 위로 길게 + **초릿대 세그먼트가 rodBendDeg로 수면 대각선 방향 벤딩** (입질 시퀀스/파이팅 텐션 공용 구동).
  - 우측 수심 모식도 개편: 상단 **거리축**(채비→나, 릴링 연동 이동) + 수심층 경계 + **채비 자세 아이콘**(idle/lift/fall/retrieve(+물결)/twitch/hop — 머리는 내 쪽) + 조류 존 라벨.
- **[신규] 원투 편대 채비** (기존 rig 모델과 병렬 — 역호환): 찌 비움+도래 = `isSurfRigReady` → U창에 **편대/서브 채비 행** 활성. `NONE/T자 천평/카드 채비(열기 7단·0.3m 간격 / 고등어 5단 / 전갱이 3단 서브 토글)/학꽁치/갈치`. 카드 채비는 **MultiHookContainer**(단수별 미끼 개별 장착 + 전체 크릴 버튼). `getRigTotalWeightG()` > `ROD_CAPACITY_G`(28g) → "채비 과부하!" 가이드. 랜딩 시 **다관점 히트**(각 미끼 바늘 수심층별 오라클 확률로 추가 어획, 해당 단 미끼 소모). 수심 패널에 훅 도트+바닥 밀착 강조.
  - **[수정] 원투 캐스팅 게이트**: 편대 활성 시 '찌'를 필수에서 제외, 카드 미끼 1개 이상이면 미끼 요건 충족 (검증에서 발견한 실버그 — 원투 채비가 캐스팅 불가였음).

**이전 변경 (2026-07-17 4차)**:
- **[배포] 1차 테스트 빌드 GitHub Pages 공개** — **https://sarsah93.github.io/Pixel-Angler-The-Real/** (라이브 검증 완료: 리소스 404 0건, 메인 메뉴~부산 필드 기동, 기상청 실데이터 수신):
  - 배포 절차: `npx pnpm run build` → `../pixel-angler-gh-pages` git worktree(orphan `gh-pages` 브랜치)에 dist 복사(**소스맵 `*.map` 제외**) → commit/push. Pages 소스는 gh-pages 브랜치 루트(.nojekyll 포함). **재배포 시 같은 worktree에서 dist 덮어쓰고 push만 하면 됨.**
  - **⚠️ 에셋 경로 규칙 (중요)**: `vite base: './'` + 게임 내 모든 에셋 로드가 **상대 경로**로 전환됨(BootScene 28건, RegionFieldScene 2건). 서브패스 호스팅(github.io/레포명/) 때문 — **새 에셋 로드에 선행 `/`를 쓰면 배포에서 404**.
  - ⚠️ 번들에 공공 API 키 3종 인라인 공개됨(사용자 승인). 정적 호스팅이라 NMPNT/MAFRA/KOSIS는 Mock 폴백, **기상청은 라이브에서도 실데이터**(apis.data.go.kr CORS 허용).
- **[개편] 요리 탭 레이아웃**: 도마를 좌측으로 이동, 우측에 **임베드 인벤토리**(요리 창에 종속 — 별도 드래그 창 아님) — 카테고리 탭(음식 기본)/5×5 소켓/아이콘·수량·신선도 점/아이템 선택. 손질 시스템 구현 시 선택 아이템을 도마에 올리는 연동 예정.
- **[수정] ESC 일시정지 메뉴 클릭 관통**: 메뉴 항목 클릭이 같은 프레임 씬 pointerdown으로 흘러 물가 근처에서 "채비가 불완전합니다 (U 채비하기)" 캐스팅 힌트가 뜨던 버그 — `closePauseMenu()`에 `suppressClickUntil` 250ms 유예 추가(팝업 스택 close()와 동일 패턴).

**이전 변경 (2026-07-17 3차)**:
- **[수정] 잠금 지역 안내 문구 동적화** (`WorldMapScene.showLockedRegionAlert`): "현재는 '강원 속초'만 입장할 수 있습니다" 하드코딩 제거 → `isRegionUnlocked` 기준으로 입장 가능 지역을 동적 나열 ("입장 가능: 강원 속초 · 부산"). 지역이 추가 개방되면 자동 반영.
- **[수정] 핀 편집 Dev Tool을 dev 빌드 전용으로 게이팅**: `import.meta.env.DEV`로 버튼 생성·P키 바인딩 모두 차단 — **프로덕션 빌드에는 버튼이 렌더되지 않고 P키도 무반응** (vite preview로 dist 실검증 완료. vite가 프로덕션에서 `import.meta.env.DEV`를 false 상수로 치환해 데드코드 제거).

**이전 변경 (2026-07-17 2차)**:
- **[신규] 부산 필드 타일맵 8종 + 출조 개방** (`pixelazed/busan/` → `py tools/build_region_maps.py busan` → `public/data/busan/`, 브라우저 실렌더 검증 완료):
  - 원본 지도 캡처 8장을 파이프라인 규칙(`{mapId}.png`)으로 개명 후 생성 — 감천서 2·감천동 3·암남 1·백운포 2 (93×54 타일, 방파제 맵은 바다 78~82%).
  - **`BUSAN_MAP_GRAPH`** (core/RegionMap.ts) — 3개 분리 컴포넌트: 서방파제(감천동1↕방파제2) / 동방파제(제3부두1↕수산시장2↕방파제3, **부두1↔E↔암남1**) / 백운포(공원1↕방파제2). 구역별 스폰 맵은 RegionAreaNode.fieldMapId. `enterable: false` 전부 해제 — 부산 출조 개방. 백운포 로마자 `baekunpo`→`baegunpo` 정정.
  - **중앙 스폰 확인**: 출조 진입(entryEdge 없음)은 기존 `computeSpawnTile`이 이미 맵 중앙 `nearestWalkable` — 4구역 실측 편차 1~3타일. 맵 간 이동은 엣지 스폰 유지(실측 col=5). **신규 코드 불필요 — 기존 동작이 명세와 일치.**
  - `RegionMapGraph.depthProfileUrl` 신설 — 수심 프로필은 등록된 지역만 로드. (미등록 지역을 무조건 로드하면 Vite dev SPA 폴백이 index.html을 돌려줘 JSON 파싱 pageerror 발생 — 부산 검증에서 발견·수정. 속초만 등록됨.)
- **[신규] snagRisk → 1인칭 밑걸림 실연동**: `BiteContext.snagRiskMult`(타이머 누적 속도 × 발동 확률 모두 배율) + `SNAG_RISK_MULT`(low 0.6/mid 1.0/high 1.6) + `getAreaSnagRiskMult(GameState.currentSpotId)`. **1000회 시뮬레이션: 여밭 방치 시 평균 밑걸림 low 14.9초 / mid 8.9초 / high 5.8초** — 감천항·암남(high)에서는 뒷줄견제(H)가 필수. H 리셋 회귀 확인.
- **[신규] CORS 프록시 — NMPNT/MAFRA/KOSIS 실데이터화** (dev): `vite.config.ts server.proxy`에 `/api/nmpnt`·`/api/mafra`·`/api/kosis` → 원 서버 프록시. `ExternalApiKeys`에 `mafraBaseUrl`/`kosisBaseUrl` 신설, KOSIS 클라이언트 baseUrl 주입 가능화. ExternalDataStore가 `import.meta.env.DEV`일 때만 프록시 오리진 경유. **검증: CORS 차단 0건, 낚시지수·경락가·어획량·해양기상 76개소·기상청 11지역 전부 실데이터.** ⚠️ 프로덕션 빌드에는 vite 프록시가 없다 — 배포 시 서버 프록시 필수(HTTP 전용 MAFRA/NMPNT 포함).
  - `REGION_TO_MMSI`에 부산 추가: `994401579` 감천항유도등부표 — **실측 수온 보유**(전국 11개소 중 하나, 감천항 필드와 최적 매칭).

**이전 변경 (2026-07-17 1차)**:
- **[변경] 채비 바늘/미끼 소켓 분리** (`InventoryStore` + `UtilizationPanel` + `FirstPersonFishingScene`, 브라우저 실렌더 검증 완료):
  - `RigStepKey`의 `hookBait` 통합 소켓 → **`hook`(바늘/루어) / `bait`(미끼) 2소켓** (총 8소켓 체인, 소켓 폭 122→110px 축소로 패널 내 수용).
  - **루어(가짜미끼) 분류 신설**: `subCategory: '루어'` = 바늘 일체형(미노우 등). 판별 헬퍼 `isHookItem`/`isBaitItem`/`isLureItem` export. 시드에 미노우 90F·메탈지그 20g 추가.
  - **루어 장착 시 미끼 소켓 비활성**: `setRigPart('hook', 루어)` → 미끼 소켓 자동 비움(유령 미끼 방지), U창에서 회색 '루어 장착 중 — 미끼 불필요' 표시 + 클릭 불가. `hookNeedsBait()`로 판별.
  - **캐스팅 게이트 조건부**: `getMissingRigParts()`에서 미끼는 일반 바늘일 때만 필수 — 루어 채비는 미끼 없이 캐스팅 가능.
  - **소모/손실 규칙 변경**: 입질 시 미끼 소모는 일반 바늘만(루어는 닳지 않음). `hook_off`/`escaped`는 **미끼만 손실**(바늘은 원줄에 남음 — 기존엔 바늘째 잃었음), 루어 채비는 손실 없음("루어는 무사히 회수"). 줄터짐/복어/밑걸림은 hook+bait 모두 손실. `currentBaitKey()`는 루어 장착 시 `'lure'` 반환(오라클 미끼 가중 연동).
- **[신규] 부산 지역 출조 구역 4곳 + 낚시터 특성 카드** (실지 리서치 2026-07-16 기반):
  - `RegionAreaNode` 확장: `details`(특성 상세 줄)/`depthRangeM`/`snagRisk`(low·mid·high + `SNAG_RISK_LABEL`)/**`enterable`(false면 핀·설명은 표시하되 출조 차단 — '필드 준비중')**.
  - 부산 4구역: 감천항 서방파제(21,232)·동방파제(32,227)·암남공원/송도(52,208)·백운포 체육공원(176,137) — **전부 `enterable: false`** (타일맵 미제작. `busan_gamcheon_west_1` 등 fieldMapId는 예약). 핀 좌표는 `pixelazed/busan_2_pixelazed -pin.png`의 노란 점 4개를 픽셀 diff+클러스터링으로 추출.
  - 속초 2구역에 `details` 보강(속초항 5줄/동명항 4줄). `showAreaConfirm` 카드가 상세·수심·밑걸림을 표시하고, `enterable:false`면 '예' 버튼이 비활성 '준비중'으로 바뀜(핸들러 미등록 — 실클릭 검증 완료).
  - ⚠️ **부산은 이제 `isRegionUnlocked` 잠금 해제 상태** (REGION_AREA_NODES 존재 = 해제). 지역 줌인·핀 선택 가능, 인게임 진입만 차단. 타일맵 제작 후 `enterable: false` 제거하면 출조 개방.
- **[리팩토링] main.ts → game.ts 팩토리 분리**: import 부작용(즉시 `new Phaser.Game`) 제거 — `createGame()` + `globalThis.__PIXEL_ANGLER_GAME` 싱글턴 가드. 하네스/HMR이 main.ts를 재평가해도 이중 생성 불가(검증: import×2+createGame×2 후 canvas 1개). 씬 등록 목록은 game.ts로 이동 — **새 씬 추가 시 game.ts를 수정할 것**.
- **⚠️ 검증 하네스 함정 (Vite dev)**: `import('/src/store/InventoryStore.js')`와 `.ts`는 **별개 모듈 인스턴스**다(게임은 Vite가 리라이트한 `.ts` URL 사용). 하네스에서 게임 상태를 조작하려면 반드시 `.ts` URL로 import할 것. HMR 후에는 `?t=` 버전 분화도 생기므로 서버 재시작 후 검증 권장.

**이전 변경 (2026-07-16 5차)**:
- **[신규] 해양수산부 국립해양측위정보원 해양기상 API 연동** (`core/api-client/MarineWeatherApiClient.ts` + `core/db-schema/MarineStations.ts`, **실호출 검증 완료 — 전국 76개 관측소 76/76 수집**):
  - 엔드포인트 `http://marineweather.nmpnt.go.kr:8001/openWeatherNow.do`(최신) / `openWeatherDate.do`(날짜별, 10분 간격 ~143건/일). 인증 파라미터는 `serviceKey`(**UUID 형식** — 공공데이터포털 15033708은 LINK 유형이라 `marineweather.nmpnt.go.kr`에서 별도 발급).
  - **키는 `.env`(`VITE_NMPNT_API_KEY`)에서만 로드 — 하드코딩 금지.** `packages/client-pc/.env`에 저장(gitignore 확인됨). 기존 dev 키들(data.go.kr/MAFRA/KOSIS)은 여전히 소스 하드코딩 상태 — **배포 전 .env 이전 필요**.
  - `MARINE_STATIONS` 레지스트리 76개소/13개 기관(101 부산청 ~ 113 진도소) — 지점코드·기관코드·센서 보유 플래그. 미문서 엔드포인트 `POST /serviceReq/getStationInfo.json`에서 추출.
  - `ExternalDataStore`에 통합 — `getAllMarineWeather()`/`getMarineWeather(mmsi)`/`getRegionMarineWeather(regionId)`/`getMarineWeatherByOffice(mmaf)`. 해양기상은 독립 API라 실패해도 기존 수집을 막지 않도록 병행 실행. `REGION_TO_MMSI`는 현재 속초만 매핑(맵 개발 진행에 따라 확장).
  - **⚠️ `mmaf`(기관코드)와 `mmsi`(지점코드) 둘 다 필수** — 하나라도 빠지면 HTTP 400 `"mmaf가 없습니다."`. 한 요청의 mmsi는 **모두 같은 mmaf 소속**이어야 하므로 전국 수집은 **기관 단위 13회 호출**로 분할한다. (초기 구현이 mmaf를 누락해 전량 Mock 폴백되던 것을 실호출 검증으로 발견·수정.)
  - **⚠️ 데이터 한계 (중요 — 설계 시 반드시 고려)**:
    - **파고/파향: 0/76 관측소 — 어디서도 관측하지 않음**(`WAVE_HEIGTH`는 항상 '미제공'). 파고는 KHOA 또는 기존 바다낚시지수 API를 쓸 것.
    - **수온: 11/76 관측소만**. **동해청(속초 권역)은 수온 관측소가 전무** — 가장 가까운 수온 관측소는 포항(`1103579`).
    - **강수·운량 필드 자체가 없음 → 비/맑음/흐림 판정 불가.** 이 API는 해양 센서(풍향·풍속·기온·습도·기압·시정·수온·염분·유향유속) 전용. HUD 날씨 아이콘의 비/맑음/흐림에는 **기상청 단기예보 API가 별도로 필요**(안개는 시정 22/76으로 추정 가능, 바람은 풍속으로 가능).
    - **HTTP 전용(포트 8001)** — HTTPS 배포 시 프록시 필요(MAFRA와 동일 제약).
    - 응답 필드명 `WAVE_HEIGTH`는 **원본 API의 오탈자**(HEIGHT 아님). `dataType=2`는 결측을 '미제공'/'데이터없음'/'-' 센티널로 표기 → normalize에서 `undefined`로 제거. 에러도 HTTP 400 + `result.status='ERROR'`로 오므로 **HTTP 상태만 보지 말 것**.

**이전 변경 (2026-07-16 4차)**:
- **[수정] 어획물 판매가에 어종·길이가 전혀 반영되지 않던 문제** (`InventoryStore.getSellPrice`): 정식 엔진 `evaluateFishSellPrice`(core)가 **구현되어 있으나 어디서도 호출되지 않는 사문(dead code)** 상태였고, 실제 판매 경로는 `basePrice(= 무게 × 12원) × 0.6`이라 **어종·길이가 완전히 무시**되었음(1kg 돌돔과 1kg 눈퉁멸이 동일가). 판매 경로를 엔진에 연결 — 어종별 kg 단가 × 중량 × 등급 배율 × 길이 배율. 검증: 1kg 기준 돌돔 100,320원 ↔ 눈퉁멸 3,432원으로 분화, 감성돔 1kg의 25cm↔50cm 차 7,500원.
  - **[수정] 크기가 다른 같은 어종이 병합되며 실측치가 유실되던 버그**: `addItem`은 동일 id를 수량 병합하는데 어획물 id가 `inv_catch_{어종}`이라 30cm·50cm 감성돔이 한 스택으로 합쳐져 **뒤 개체의 크기/가격이 첫 개체 기준으로 굳었음**. `InventoryStore.nextCatchSeq()`로 개체마다 고유 id(`inv_catch_{어종}_{seq}`) 부여.
  - **[신규] `InvItem`에 어획물 실측치 필드**: `speciesId`/`lengthCm`/`weightG`. 어획물 판매가는 이 값으로 산정하며, 없으면 레거시 `basePrice` 폴백.
  - **⚠️ 시세 배율 이중 적용 주의**: `evaluateFishSellPrice`에 경락가 캐시(`getWholesaleCache`)를 넘기면 kg 단가가 당일 시세로 **대체**된다. 여기에 `getMarketPriceFactor`를 또 곱하면 이중 적용 — 곱하지 말 것.

**이전 변경 (2026-07-16 3차)**:
- **[갱신] 어종 15종 실측 데이터 반영 — 신규 12종 + 기존 4종 보정 (총 오라클 43종 / FISH_DATABASE 42종)**:
  - **신규 12종**: 개서대(`tonguefish`)·갯장어(`pike_conger`, 하모)·꽁치(`pacific_saury`)·눈볼대/금태(`blackthroat_seaperch`)·눈퉁멸(`round_herring`)·대구(`pacific_cod`)·덕대(`korean_pomfret`)·병어(`silver_pomfret`)·도다리(`frog_flounder`)·강도다리(`starry_flounder`)·도루묵(`sandfish`)·말쥐치(`black_scraper`). 4계층(오라클/FISH_DATABASE/`SEAFOOD_AUCTION_MAPPING`/MAFRA·KOSIS 매칭) 전부 등록.
  - **기존 4종 실측 보정**: ① 갈치 — 학명 `T. lepturus`→`T. japonicus`, 진흙·모래 20~150m, **금지체장·금어기 7월 신규 반영. 법정 기준은 항문장 18cm이나 게임은 전장(`lengthCm`)으로 판정하므로 전장 환산값 47cm를 사용**(검증: 야간 심해 스폰 갈치의 6.4%가 미달 판정 — 18cm 그대로였다면 최소 스폰 40cm에 막혀 규칙이 무력했음) ② 고등어 — **금어기 [5]→[4,5,6] 정정**, 수심 0~300m, 최대 60cm ③ 광어 — **금지체장 21cm→35cm 정정(기존 값 오류)**, 10~200m, 평균 40~60cm ④ 문치가자미 — 도다리/강도다리와 어종 분리에 따라 `flounder`를 '참도다리(문치가자미)'로 개명(nameEn `Starry Flounder`→`Marbled Flounder`, 강도다리에 양보).
  - **[수정] 기존 DB 드리프트 4건**: 오라클↔FISH_DATABASE 불일치 — 볼락/황볼락 금지체장(오라클 15 vs DB 0), 조피볼락·열기 이름 표기. "ID·값 표준 = 오라클" 원칙에 따라 FISH_DATABASE를 오라클로 정렬.
  - **⚠️ 매칭 테이블 순서 규칙 (신규)**: `MAFRA_ITEM_TO_SPECIES`와 `KOSIS_SPECIES_MATCH`는 **부분 일치(`includes`) + 선착순(`find`)** 이므로, 품목명이 포함 관계면 **더 긴 쪽을 반드시 먼저** 둘 것. 현재 함정: `'말쥐치'⊃'쥐치'`, `'강도다리'⊃'도다리'`, `'개서대'⊃'서대'`. 순서가 뒤바뀌면 조용히 오매칭된다.
  - **[확정] 학명 4건 (사용자 확인 완료)**: 참도다리 `Pseudopleuronectes yokohamae` / 강도다리 `Platichthys stellatus` / 덕대 `Pampus echinogaster` / 병어 `Pampus argenteus`. 덕대·병어 학명 분리 완료. (참돔 `red_seabream`↔참돔 야간 `night_seabream`의 `Pagrus major` 중복은 같은 생물종의 주/야간 엔트리 분리로 **의도된 설계** — 학명 중복 검사 시 예외.)
  - **[해소] 전갱이·쥐치 FISH_DATABASE 등록** (사용자 데이터 제공): 오라클에만 있어 도감 조회가 불가하던 2종 추가 → **오라클 43종 전부 FISH_DATABASE 등록 완료** (FISH_DATABASE 44종 = 43 + 참돔 야간 `night_seabream`. 야간 참돔은 오라클 미등록이 의도된 설계). 전갱이는 실측 반영해 오라클에 `nightBonus: 1.4` 신규 부여(기존엔 야간 보정 없었음), 쥐치는 수심 5~30m로 정정.
    - 제공 데이터의 타입 오류 2건 교정: `'boat'`→`'boat_fishing'`(SpotType에 `boat` 없음), `'krill'`→`'krill_frozen'`(BaitCategory에 `krill` 없음 — `BaitKey`의 `krill`과 혼동 주의. **두 타입은 별개 체계**).

**이전 변경 (2026-07-16 2차)**:
- **[갱신] 벵에돔 실측 보정 + 어종 2종 신규 (사용자 제공 데이터, 총 31종)**: ① 벵에돔 — 내만성 3~15m, 빵가루(50)/크릴(30)/갯지렁이(20), 최대 55cm 3.5kg, **금지체장 없음**(20~23cm 자율 방생), 약은 입질(mouthFragility 0.3) ② **긴꼬리벵에돔(longtail_blackfish)** — 외양성 암초 10~30m(밑밥 시 표층 부상 — mid+surface), 크릴 70 압도적, 이빨로 목줄 절단(`lineCutter`), 난류/제주·남해 ③ **가숭어(redlip_mullet, 밀치)** — 기수역 진흙/모래 1~15m, 숭어류 최대(100cm 8kg), 겨울(11~2월) 제철 ④ 참숭어(striped_mullet) — 표층 회유, 청갯지렁이 55, 3~5월 보리숭어로 보정. FishDatabase/오라클/MAFRA 매칭(가숭어·밀치 품종 분기)/KOSIS 숭어류 다중 매핑/Economy 기본 단가 모두 반영.
- **[신규] `bread` 미끼 분류**: BaitKey에 빵가루 경단·떡밥 추가 (기존 TODO 해소 — 숭어 corn 대체 제거). 인벤토리/식자재마트에 '빵가루 경단' 아이템(반죽미끼) 추가, 1인칭 미끼 매핑('빵'/'떡밥'→bread) 연동.

**이전 변경 (2026-07-16 1차)**:
- **[신규] MAFRA 수산물 경락가격 정식 연동** (`core/api-client/MafraAuctionApiClient.ts`, **실호출 검증 완료**): 농식품 공공데이터 포털 승인 API 2종 — ① 수산물도매시장별(`Grid_20220822000000000623_1`, UNITNAME 포함) ② 수산물품목별(`Grid_20220818000000000621_1`). 호출 형식 `http://211.237.50.150:7080/openapi/{KEY}/json/{GRID}/{START}/{END}?DATES=YYYYMMDD`(+MCLASSNAME/SCLASSNAME/MARKETNAME/CONAME 필터). 데이터 수록 2000~2023 → **현재 날짜를 2023년 동월동일로 매핑해 계절 시세 재현**, 휴장 시 최대 7일 역방향 누적(어종 8종 이상 조기 종료), 거래량 가중 평균으로 `WholesalePriceInfo` 정규화. `MAFRA_ITEM_TO_SPECIES`로 품목/품종명→어종 ID 매칭('돔'은 품종으로 세분화). ExternalApiService의 경락가 소스를 MAFRA로 교체. **주의: HTTP 엔드포인트 — HTTPS 배포 시 프록시 필요.**
- **[검증] KOSIS 새 인증키 정상**: `NjVmYzFhOTFiNmNkZTA2YjNkMTZlODhmZmJiYjU2NGE=` — 시도 11개 × 어종 56분류 × 3개월 1,140행 확인. `outputFields` 지정 시 C1_NM/C2_NM 누락되는 문제 확인 → 미지정으로 수정, 합계 행 제외 + 총중량(T002)만 사용.
- **[통합] 어종 DB 단일화 (FISH_DATABASE ↔ 오라클, ID 표준 = 오라클)**: 레거시 ID 일괄 개명 — `japanese_amberjack`→`amberjack`, `rockfish_yongchi`→`rainbow_wrasse`, `black_rockfish`(볼락)→`dark_banded_rockfish`, `korean_rockfish`(우럭)→`black_rockfish`, `yellow_rockfish`→`golden_rockfish`, `olive_flounder`→`flatfish`, `japanese_seabass`→`sea_bass` (FishDatabase/FishBehaviorDatabase/FishBiteEngine/SpotDatabase/RegionDatabase/RecipeDatabase/Economy/TacklePhysicsEngine/클라이언트 일괄). FISH_DATABASE에 **17종 신규 추가**(돌돔/강담돔/참돔(주간)/고등어/졸복어/참복어/붕장어/문절망둑/망상어/쏨뱅이/쥐노래미/노래미/청볼락/광어/도다리/농어/숭어), 오라클에 **8종 역편입**(벵에돔/갈치/방어/볼락/열기/농어/숭어/쥐치 — 총 29종). `SEAFOOD_AUCTION_MAPPING`에 신규 어종 기본 단가 추가. TODO(사용자 확인): 벵에돔 금지체장, 숭어 빵 미끼 분류.
- **[갱신] ExternalDataStore**: MAFRA/KOSIS dev 키 반영(`VITE_MAFRA_API_KEY`/`VITE_KOSIS_API_KEY` 우선), KOSIS 어종 매칭을 실측 분류명 기반 **다중 어종 매핑**으로 교체(볼락→4종, 방어→방어·부시리, 노래미→노래미·쥐노래미 등).

**이전 변경 (2026-07-15 8차)**:
- **[신규] 실측 연안 수심 연동**: 루트 `09.수심.zip`(국립해양조사원 1/25,000 연안정보도, WGIS_DEPTHWATER 포인트 46,270개, UTM-K/WGS84) → `tools/build_depth_profiles.py`(표준 라이브러리만: SHP/DBF 파싱 + TM 역변환 + 하버사인 거리 비닝) → `public/data/depth/gangwon_sokcho.json` (속초항/동명항 앵커별 100m 구간 평균 수심, 0~2.5km). `core/types/DepthProfile.ts`의 `depthAtDistance`가 캐스팅 거리→수심 선형 보간, **범위 초과 시 마지막 기울기로 거리 비례 외삽**(상한 60m). RegionFieldScene이 프로필 로드 후 `resolveCastDepth`로 1인칭 Z_max에 반영 (프로필 없으면 기존 그라디언트 폴백). 실측: 속초항 내항 1.5m → 원거리 11m / 동명항 방파제 앞 급심 12~20m.
- **[갱신] README.md 전면 재작성** (GitHub용): 구현 현황 표, 낚시 파이프라인 다이어그램, 실데이터 연동 표, 조작법, 파이프라인 명령어, 씬 아키텍처, 로드맵.

**이전 변경 (2026-07-15 7차)**:
- **[신규] 공공 OpenAPI 통합 수집 파이프라인** (`core/src/api-client/ExternalApiService.ts` + 클라이언트 3종):
  - `FishingIndexApiClient`: 국립해양조사원 바다낚시지수 (`apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2`). **실 API 응답 검증 완료(2026-07-15)** — 필드: seafsPstnNm/predcYmd/seafsTgfshNm/tdlvHrCn/minWtem·maxWtem/minWvhgt·maxWvhgt/totalIndex. 지수 라벨→5단계 레벨 정규화(`SeaFishingIndexInfo`).
  - `AuctionPriceApiClient`: 농정원 경락가격 (수산물만) → `WholesalePriceInfo` 정규화. 루트 CSV(`농림수산식품교육문화정보원_경락가격...csv`)는 **품목 코드 매핑 테이블**(수산부류 66/71/77/81). End Point는 승인 문서 확정 시 생성자 주입으로 교체. Mock은 일자 시드 기반 결정적 시세(하루 고정, ±25%).
  - `KosisCatchApiClient`: KOSIS 시도별 어종별 어획량 (orgId=146, tblId=DT_MLTM_5003049, 월간 3기). **주의: KOSIS는 별도 인증키 필요** — data.go.kr 키로는 err 11. `VITE_KOSIS_API_KEY` 설정 전까지 Mock 폴백.
  - 모든 클라이언트는 실패/키 미설정 시 Mock 폴백 → 오프라인에서도 정상 구동.
- **[신규] ExternalDataStore** (`client-pc/src/store/`): 스타트업(메인 메뉴) 1회 `fetchAll()` 캐시 싱글톤 — 인게임 루프는 네트워크 호출 없이 캐시만 참조. 키: `VITE_DATA_GO_KR_API_KEY`/`VITE_KOSIS_API_KEY` (미설정 시 dev 승인 키 폴백 — 배포 전 .env 이전).
- **[연동] 엔진 상호작용**: ① 낚시지수(1~5) → 1인칭 입질 P_base 배율 0.7~1.4 ② 경락가 → 직판장 어획물 매입가 배율 0.5~2.0 (`InventoryStore.getSellPrice`) ③ KOSIS 어획량 → 시도 매핑(`REGION_TO_SIDO`) + 어종명 매칭으로 `SpawnContext.catchWeightBySpecies` 스폰 가중(0.7~1.8) ④ 메인 메뉴 하단 바에 낚시지수 표기.

**이전 변경 (2026-07-15 6차)**:
- **[신규] 저장 슬롯 삭제**: `GameState.deleteSlot(slot)` (진행 중 슬롯이면 활성 해제) + 메인 메뉴 슬롯 화면에서 데이터 있는 슬롯 우측 삭제 버튼 — 1차 클릭 '확인' 전환(행에 경고 표시), 2차 클릭 삭제 후 목록 갱신. 키보드 이동 시 확인 상태 초기화.
- **[수정] 맵 전환 인식 범위**: `EDGE_MARGIN` 2 → 0 (최외곽 타일에 닿아야 전환 — 과거 2타일 깊이는 너무 넓었음) + **건물 근접(nearBuilding) 중에는 엣지 전환 억제** — 엣지 부근 건물의 [E] 상호작용이 우선.
- **[신규] 아이템 이미지 아이콘 시스템** (`ui/ItemIcon.ts`의 `createItemIcon`): `InvItem.iconTexture` 지정 시 이모지 대신 픽셀 이미지 렌더 — 인벤토리 소켓/상점 셀/퀵슬롯/상세보기 공용. 퀵슬롯 아이콘은 refresh 시 동적 재생성 방식으로 변경.
- **[신규] 음식/생선 에셋 배치**: `food assets/` 원본 → `client-pc/public/food/assorted_sashimi.png`(64², 회 아이콘), `public/fish/black_sea_bream.png`·`halibut.png`(1536×1024, 실사 픽셀 생선). BootScene 텍스처 키: `food_assorted_sashimi`, `fish_black_sea_bream`, `fish_halibut`.
- **[신규] 어획 연출/상세 이미지 연동**: 감성돔(black_seabream)·광어(flatfish)를 낚으면 결과 팝업에 실사 픽셀 생선 이미지 표시(`FISH_TEXTURE` 매핑), 획득 아이템 아이콘도 해당 이미지 사용, 아이템 상세보기(어획물)에 대형 이미지 표시.
- **[신규] 회(사시미) 아이템 규칙**: 식당 판매 품목 `shop_assorted_sashimi_small`(모듬회 (소)) + `shop_black_sea_bream_sashimi_small`(감성돔 회 (소)). 네이밍 규칙: `{어종}_sashimi_{중량}` / 한글 `{어종} 회 ({소/중/대})` / 영문 `{species} sashimi ({size})`. 아이콘은 당분간 모듬회 이미지로 통일.

**이전 변경 (2026-07-15 5차)**:
- **[신규] 어종 마스터 DB 21종** (`core/simulation/FishSpawningOracle.ts` 재작성): 사용자 제공 실측 데이터 — 돌돔/강담돔/부시리/참돔/고등어/전갱이/용치놀래기/졸복어/참복어/붕장어/문절망둑/망상어/쏨뱅이/쥐노래미/노래미/황볼락/청볼락/조피볼락/광어/도다리/감성돔. 스키마: 서식 지형(`HabitatTerrain`)/수심 범위/수심층/미끼 선호도(`BaitKey` 10종, 0~100)/크기·무게 분포/성전환 규칙(`sexRule` — 감성돔·참돔·용치놀래기·붕장어·광어)/금지체장·금어기/물때 활성도/야간 보정/파이팅 프로필. 스폰·입질 가중: 지형×수심층×수심범위×미끼×물때×주야간. `getBaitAffinity()`로 미끼 친화도(0.25~1.6)를 입질 기본 확률에 곱함. 추후 API 연동 매칭 예정.
- **[변경] FightingPhase 어종 패턴 + 난이도**: 패턴 3종 — jump(바늘털이: H·릴링 중지, 부시리·고등어 위주), dive(여박기: H 유지, 감성돔·우럭·쏨뱅이), **lateral(횡이동 쓸림: H를 떼고 드랙 버티기, 부시리·회유어)**. 패턴 빈도 전체 완화(3.6~8.2초×어종 배율), 릴링 진행 1.2배 완화. 입 연약도(전갱이 과텐션 바늘 빠짐), 복어류 목줄 절단(`lineCutter`).
- **[신규] 낚시 실패 = 채비 손실 + 즉시 필드 복귀**: 미끼 털림(hook_off/escaped)→바늘·미끼 소켓 손실 / 줄터짐→목줄·봉돌·미끼 손실(30% 찌까지) / 복어→목줄째 절단 / 밑걸림→찌 아래 전체 손실. 손실 부품은 인벤토리 수량 1 소모+소켓 비움(`InventoryStore.loseRigParts`), 입질 순간 미끼 1개 자동 소모(`consumeRigItem` — 수량 남으면 자동 재장착). 실패 시 2초 안내 후 1인칭 자동 해제, 복귀 사유는 `registry('fp_exit_msg')`로 필드 HUD에 표시. **캐스팅 게이트**: 필수 소켓(원줄/찌/목줄/바늘·미끼) 미장착 시 캐스팅 불가(`getMissingRigParts`).
- **[변경] 1인칭 뷰**: 해저 바닥/여밭 바위 렌더 제거 → 화면 하단은 **캐릭터가 서 있는 육지 전경**(지도 지형 기반: 잔디/모래/자갈 — `shoreKind` 브릿징). 수심 시각화는 **우측 상단 수심 정보 패널**로 이동(찌 0m/면사매듭/미끼 마커/바닥 Z_max/여밭 여부 + 실시간 수치).
- **[신규] dev 기본 장비**: 로드 '용상 파조기 1.5호 5.3m' + '다이오 2500L 스피닝릴'(장비 릴 슬롯 추가), 채비 기본 프리셋 = 감성돔 반유동(PE 원줄+구멍찌+도래+카본 목줄+좁쌀봉돌+크릴).
- **[수정] 팝업 클릭 관통**: 다이얼로그 버튼(예/아니오 등) 클릭이 같은 프레임 씬 pointerdown으로 흘러 "물가에서 던지세요" 캐스팅 힌트가 뜨던 버그 — 팝업 닫힘 후 250ms(1인칭 복귀 후 400ms) 클릭 유예(`suppressClickUntil`).

**이전 변경 (2026-07-15 4차)**:
- **[개편] MainMenuScene 전면 재작성**: 로고 잘림 수정(스케일 펄스 제거, "PIXEL ANGLER"/"THE REAL" 2단 중앙 정렬 + 그림자 정합), 한글 태그라인·구 도트 캐릭터/방파제/바닥 제거. 배경은 시간대 연동 그라데이션 하늘/바다 + 별/달빛(해빛) 수면 반사 + 등대(점멸 등불)/배/떠 있는 찌 파문/갈매기로 재구성. 메뉴는 뷰 스택 구조 — `main(게임 시작/도감/설정/게임 종료) → start(NEW GAME/LOAD GAME) → slots(슬롯 3개)`. 선택 표시는 색+좌측 바만 변경(폰트 교체로 인한 레이아웃 흔들림 버그 해결). ↑↓/Enter/ESC(뒤로) + 마우스 hover 동기화, disabled 항목 스킵.
- **[신규] 저장 슬롯 3개 시스템** (`GameState`): `SAVE_SLOT_COUNT=3`, `saveToSlot/loadFromSlot/getSlotMeta/startNewGameInSlot/activeSlot`. 슬롯 키 `tra_save_slot_{n}`, 레거시 단일 키(`tra_save_v1`)는 부팅 로드 호환 유지. NEW GAME에서 점유 슬롯 선택 시 2단계 덮어쓰기 확인. LOAD GAME은 존재 슬롯만 활성화(메타: 닉네임/Lv/재화/저장 시각 표시). `save()`는 활성 슬롯(기본 1)에 저장.
- **[신규] 인게임 저장**: RegionFieldScene ESC 일시정지 메뉴에 '저장하기' 추가 (활성 슬롯에 저장 + 로그).
- **[수정] 도감(AnglerLogScene) 흑백 화면 버그**: `onBack()`이 무조건 `FieldScene`을 resume해 메인 메뉴 진입 시 멈추던 문제 — `init({ returnScene })` 파라미터화(기본 'FieldScene'). 메인 메뉴 '도감'은 pause+launch로 진입하고 `returnScene: 'MainMenuScene'` 전달.
- 메인 메뉴에서 장비실/물때&기상 항목 제거 (인게임에서 접근) — 종료는 저장 후 `window.close()` 시도(브라우저 미지원 시 안내 문구).

**이전 변경 (2026-07-15 3차)**:
- **[신규] 1인칭 낚시 물리 파이프라인 (core 순수 TS 모듈 7종)**:
  - `CastingPhysicsEngine.ts`: 3D 탄도 캐스팅 — 완력×파워×조준 방향 초기 벡터, 바람/공기저항 수평 편향, 중력 수직 하강, z≤0 착수 판정, 궤적 미리보기(`simulateCastTrajectory`).
  - `UnderwaterSinkPhysics.ts`: 침강 V_sink=(W−B)/(C×(1+k·‖V_tide‖)), 조류 드리프트, 면사매듭(Z_limit)/바닥(Z_max) 안착, Hold 판정.
  - `LineTensionPhysics.ts`: H 뒷줄견제(드리프트 70% 제동+미끼 양력), 정렬도 A(0~1), 리액션 리프트 트리거.
  - `ChumPhysics.ts`: 밑밥 투척/조류 드리프트/Z 침강(깊을수록 확산 반경 확대), `getChumSyncRate()` 3차원 동조율.
  - `BiteProbabilityEngine.ts`: P_bite = P_base × M_terrain(여밭 Hold 2.5) × (1+k·A) × M_action(리액션 1.5초 2.0) × M_chum(최대 4.0). 밑걸림 타이머(여밭 Hold 5초+견제 없음 → Snagged).
  - `FishSpawningOracle.ts`: 어종 마스터 스키마(크기/암수/금지체장/금어기/수심층/1~15물때 활성도) + 가우시안 개체 생성 팩토리.
  - `FightingPhase.ts`: 텐션 0~100(0=바늘빠짐/100=줄터짐), 바늘털이(jump: H·릴링 중지)/여박기(dive: H 유지) 패턴, P_escape=base×M_tension×M_pattern×(1−A_tackle).
- **[신규] FirstPersonFishingScene** (`client-pc/src/scenes/`): 착수 시 RegionFieldScene pause+launch로 진입하는 1인칭 낚시 뷰. 의사 3D 레이어(하늘/수평선→파도 수면→수중 그라데이션·기포→해저 모래/여밭→찌·라인·미끼→물고기 실루엣→낚싯대 뷰). 우측 낚싯대 뷰(텐션 휨+수면 거리 표시), 좌측 게이지(정렬도 A/밑밥 동조/입질 확률/밑걸림 경고), 우측 수심 게이지(미끼 위치·매듭·바닥). 하단 중앙 2분할 쿨러(어획 보관/밑밥 — 퀵슬롯은 필드 씬에 있으므로 1인칭에서 미표시, 복귀 시 자동 복원), 우하단 그만하기 버튼(ESC 동일) → stop+resume 복귀(낚시 시점 위치 보존). 조작: H 뒷줄견제 · C/밑밥칸 밑밥 투척(집어제 소모) · 좌클릭 릴링 · SPACE 재캐스팅.
- **[변경] RegionFieldScene 캐스팅 전면 재구현**: 우하단 고정 → **마우스 조준 방향** 기반. 차지 중 조준선+실시간 탄도 점선 미리보기+착수 예상 마커(바다=초록/육지=빨강). 발사 시 그림자(XY 평면)와 찌(y−z 포물선) 이원화 비행, 바람 편향. 착수 지점이 바다면 파문→1인칭 씬 진입(거리→Z_max 그라디언트, 착수 타일 해시 여밭 시드), 육지면 회수.
- **[변경] 손 착용 시스템 + 캐스팅 게이팅**: 낚싯대/뜰채는 `tool` 손도구로 분류 — 인벤토리 우클릭 → **오른손 착용/왼손 착용** 선택(해당 손 기존 장비 자동 교체, `InventoryStore.equipHand`). 캐스팅은 "낚싯대 퀵슬롯 선택 + 해당 낚싯대 실제 손 착용" 둘 다 필요 (퀵슬롯만 등록된 미착용 낚싯대로는 불가). EquipmentPanel 손(우)/손(좌) 슬롯은 `getHandEquipped` 기반.

**이전 변경 (2026-07-15 2차)**:
- **[수정] UI 클릭 판정 어긋남 근본 해결** (`ui/DraggablePanel.ts`의 `applyScreenFixed`): Phaser는 컨테이너 자식의 입력 판정에 자식 자신의 scrollFactor(기본 1)를 사용하므로, 카메라가 스크롤되는 씬(RegionFieldScene)의 화면 고정 UI는 히트 영역이 카메라 이동량만큼 어긋났음. 모든 화면 고정 컨테이너 트리에 scrollFactor 0을 재귀 적용해 해결. **새 화면 고정 UI를 만들면 반드시 `applyScreenFixed()` 호출할 것.**
- **[신규] DraggablePanel 공통 베이스** (`ui/DraggablePanel.ts`): 모든 팝업의 헤더 드래그 이동 / 우상단 X 닫기 / 클릭 시 최상단 / 모달 딤 지원. RegionFieldScene은 `popupStack`으로 팝업을 관리하며 **ESC는 최상단 팝업부터 LIFO로 닫고, 팝업이 없을 때만 일시정지 메뉴**.
- **[신규] 단축키 팝업**: S = 스테이터스(`StatusPanel` — 근력/민첩/평형감각/조석해석력 + 물리 기여 설명), E = 장비(`EquipmentPanel` — 부위별 착용/해제 + 물리 파라미터 요약; 건물 근접 시에는 거래 상호작용 우선), U = 활용(`UtilizationPanel` — 전체 화면, 상단 탭 요리하기/채비하기. 채비 탭: 원줄→면사매듭→구멍찌/수중찌→도래→목줄→봉돌→바늘&미끼 소켓 조립 + 면사매듭 수심 한계(Z_limit) -/+ 조절 + 총무게/침강속도 실시간 합산. 요리 탭: 도마/삼면뜨기 손질 자리 — 추후 구현).
- **[신규] 인벤토리 v2** (`InventoryPanel` 재작성): 탭별 독립 5x5 소켓(아이템이 `slot` 좌표 보유), 아이템 드래그 앤 드랍 위치 이동/교환, 우클릭 메뉴에 **상세보기**(`ItemDetailPanel` — 종류별 추론 물리 스펙 목업) 및 낚싯대 한정 **채비하기**(→ U 창 채비 탭) 추가.
- **[신규] 건물 + 상점 시스템**: POI 위치에 종류별 픽셀 도트 건물 텍스처 자동 베이킹(편의점/식자재마트/직판장/음식점/카페/주점 — `data/ShopCatalog.ts`의 `BUILDING_KIND_CYCLE` 순환 배치). 입구 근접 + E → "상품을 거래하시겠습니까?" 확인 → 좌측 상점(`ShopPanel` 구매하기/판매하기 탭, 호버 툴팁, 우클릭 상세보기, 하단 구매/판매 버튼) + 우측 인벤토리 동시 오픈. 구매/판매는 수량 팝업(`QuantityDialog` — 1개 프리셋, -/+, 숫자 직접 입력) → 확인 메시지(`ConfirmDialog`) → 재화 정산. **상점 아이템은 재화 결제 없이 인벤토리로 이동 불가.**
- **[신규] core 물리 기초 타입** (`core/src/types/AnglerStats.ts`): `AnglerStats`(strength/dexterity/equilibrium/tideReading) + `ZoneDepthProfile`(Zone 0~3 한계 수심 Z_max) + `computeZoneMaxDepth` — 탑다운 다차원 캐스팅 공간(XY↔XZ/YZ) 설계의 공통 선언. 지역 추가 시 수심 프로필만 전달하면 연동되는 구조의 기초.
- **[수정] 속초항 구역 핀 좌표**: (184, 60) — 동명항(221, 49) 기준 좌측(반대쪽)으로 정정.

**이전 변경 (2026-07-15 1차)**:
- **[규칙] UI 텍스트 이모지 접두사 금지 (사용자 지시)**: 제목/부제목/버튼 라벨 앞에 이모지·아이콘을 습관적으로 붙이지 말 것. 아이콘이 필요하면 사용자가 별도 요청. (인벤토리 아이템 아이콘처럼 아이콘 자체가 콘텐츠인 경우는 예외.) WorldMapScene/RegionFieldScene 라벨에서 기존 이모지 접두사 일괄 제거함.
- **[신규] RegionFieldScene HUD** (`ui/RegionHud.ts`): 좌상단 HP/피로도 바 + 시계 + 날씨(EnvironmentStore 연동, 미연동 시 목업), 우상단 미니맵(실지형 타일 그리드 1px 베이킹, M 키 150→250→350 크기 순환), 중앙 하단 퀵슬롯 8칸(InventoryStore 배정 연동, 1~8 키/클릭), 좌하단 이벤트 로그+커뮤니티 채팅 목업(`pushLog`).
- **[신규] 인벤토리 시스템** (`store/InventoryStore.ts` + `ui/InventoryPanel.ts`): I 키 토글. 상단 카테고리 탭(장비/소모품/음식/낚시용품/기타) × 5x5 소켓 그리드. 아이템 아이콘은 종류별 통일(임시). 신선도 배지(활어/신선/냉장/냉동/상함), 착용 표시, 수량 표시. 우클릭 컨텍스트 메뉴: 착용/해제, 퀵슬롯 등록(1~8 키로 슬롯 지정), 전환하기(준비중), 버리기, 완전제거. 최하단 보유 재화(원) 표시. 추후 낚싯대 채비 모딩(소켓별 부품 선택) 뷰 연동 예정.
- **[수정] 맵 간 이동 스폰 위치** (`RegionFieldScene.edgeSpawnTile`): 기존 2D 나선 탐색 → 진입 엣지 밴드 한정 탐색으로 교체. entryT(이전 맵 이탈 지점의 상대 위치)를 유지한 채 엣지를 따라 좌우로 벌려가며 걷기 가능 + 엣지까지 통로 연결(`walkableTowardEdge`)된 타일에 스폰. 상단 가운데로 나가면 다음 맵 하단 가운데에서 등장.
- **[수정] 속초 구역 핀 좌표**: 속초항 (258,60), 동명항 (221,49) — zoom_sokcho(256²) 기준.
- **[변경] RegionFieldScene 조작**: ESC = 인벤토리 닫기 → 일시정지 메뉴 순. M = 미니맵 크기, I = 인벤토리, 1~8 = 퀵슬롯. UI 열림 중 이동/캐스팅 차단(`uiBlocked`). 조류/수심 오버레이(V 토글)는 추후 API 연동 기반으로 바다에서만 제공 예정(현재 미구현).
- **[신규] 전국→지역 이음새 없는 줌인 진입** (`WorldMapScene.ts`): 지역 클릭 시 전국 지도 배경(`nationalMapImg`)을 핀 지점 기준으로 카메라 줌인+페이드아웃한 뒤, 지역 확대 지도(`zoom_{slug}`)를 중앙에서 이어서 확대. "지도 2개가 동시에 뜨는" 느낌 제거(전국 지도 hide 처리). `renderRegionView` 복귀 시 배경 복원.
- **[신규] 지역 지도 출조 구역 핀 + 확인 팝업**: `core/types/WorldMap.ts`에 `RegionAreaNode`/`REGION_AREA_NODES`/`isRegionUnlocked`/`getRegionAreaNodes` 추가. 속초 확대 지도(256²)에 속초항(215,71)·동명항(244,56) 핀 배치, 좌측 구역 리스트와 hover 연동. 핀/리스트 클릭 → "○○로 출조하시겠습니까? 예/아니오" 팝업(`showAreaConfirm`, `areaconfirm` 뷰 상태) → '예' 시 `RegionFieldScene`(`mapId=fieldMapId`) 입장.
- **[신규] 지역 잠금**: `isRegionUnlocked`(= 구역 데이터 존재)로 속초 외 전 지역을 잠금 표시(회색 핀·🔒 라벨·정적, 클릭 시 안내). 준비되면 `REGION_AREA_NODES`에 항목 추가로 자동 해제.
- **[신규] RegionFieldScene ESC 일시정지 메뉴**: ESC → 목재/양피지 톤 도트 메뉴(계속하기/전국 지도/타이틀 화면), ↑↓/Enter/마우스 선택. 메뉴 열림 중 이동·캐스팅 차단(`isPaused`). 기존 ESC 즉시 전국 지도 복귀 동작을 메뉴로 대체.

**이전 주요 변경 (2026-07-14)**:
- **[신규] WorldMap 핀포인트 재배치 + 여수 추가 (11개)** (`core/src/types/WorldMap.ts`): 사용자 좌표로 11개 노드 재배치, `mapSlug` 필드 추가(지역 상세 지도 파일명 매핑), `jeonnam_yeosu` 노드/지역 신규 추가.
- **[신규] WorldMap 지역 줌인 진입 뷰** (`WorldMapScene.ts`): 지역 클릭 시 `pixelazed/{slug}_2_pixelazed.png`(텍스처 `zoom_{slug}`)로 확대 줌인하는 `renderRegionMapView` 추가. 지도 미준비 지역은 '준비중' 플레이스홀더. `regionmap` 뷰 상태 추가.
- **[신규] 캐릭터 렌더링 수정** (`FieldScene.ts`): 스프라이트 원점을 발밑(0.5,1)으로, 표시 높이 `PLAYER_DISPLAY_H=60`px 정규화(idle/move 종횡비 유지·크기 통일), 그림자를 발밑에 정렬. `applyPlayerSpriteSize()` 도입.
- **[신규] 실지형 기반 지역 타일맵 시스템 (속초)**:
  - `tools/build_region_maps.py`: 표준 라이브러리만으로 PNG 디코딩 → 색상 분류(바다/육지/건물/잔디) → 타일 그리드 + POI JSON 생성. 작은 물 얼룩 제거·대각 연결성 보정 후처리 포함.
  - `core/src/types/RegionMap.ts`: `RegionMapData`/`RegionMapGraph` 타입 + 속초 7개 맵 연결 그래프(`SOKCHO_MAP_GRAPH`).
  - `RegionFieldScene.ts`: JSON 소비 → 타일 RenderTexture 베이킹, 병합 정적 바디 충돌(바다·건물 이동불가), 방향키 이동/카메라, 맵 간 엣지 전환(속초항3↔2↔1↔연결로↔동명항1↔2↔3), 바다 인접 시 좌클릭 차지 캐스팅 연출, POI 마커.
  - WorldMap 속초 지역 뷰에 '속초 필드 입장' 버튼 → `RegionFieldScene` 진입.
  - `dokdo_coast` 스팟 `description` 누락 빌드오류 수정.

**이전 주요 변경**:
- 프로젝트명 전면 수정: "The Real Angler" → **"Pixel Angler The Real"** (index.html, MainMenuScene, server 로그 반영)
- `Inventory.consumables` 타입을 `ConsumableItem[]` → **`InventoryItemInstance[]`** 로 통합 (신선도/부패 연동)
- `CoolerSlotItem.condition` 타입을 `'fresh'|'good'|...` → **`ItemConditionState`** 로 통일
- `CoolerSlotItem.storedAt: Date` → **`storedAtGameMinute: number`** 로 교체 (게임 분 기반 부패 계산)
- `FishBiteEngine`: 미끼 신선도(spoiled=85%감점, frozen=50%감점, live=25%가산) 보정 로직 추가
- CoolingBoxPanel: 모든 `ItemConditionState` 레이블 지원 (🟣활어/🟢극상/🔵냉장/⚪냉동/🔴상함 등)
- WASD 이동 분리 (방향키 전용 이동, WASD 향후 단축키 예약)
- U 키 → 제작대(CraftScene) 단축키 등록
- HUD/MiniMap/InfoOverlayPanel 신규 UI 완성
- ESC LIFO 팝업 스택 시스템 완성
- **[신규] 포항 영일만 2D 픽셀 지형 맵** (`YoilBayFieldMap.ts`): 낚시 포인트 7곳, 구역 9개, 건물 7개 격자 추상화
- **[신규] 조류/수심 픽셀 시각화 렌더러** (`HydroCurrentRenderer.ts`): V 키 토글, 조류 화살표·수심 색조·포인트 마커
- `FieldScene`: 조류 렌더러 통합 (V 키 오버레이, 30초 물때 연동 자동 갱신)
- `FishingFocusWindow`: 미사용 필드 제거로 빌드 오류 수정
- **[신규] 엣지/위험 타일 채집 시스템**: 30% 미끄러짐 판정(`checkSlipHazard`), 낙수 패널티(체력/피로도 50% 차감 및 안전칸 후퇴) 및 도구별 우측 채집 패널(`attemptGather`) 연동 완료
- **[신규] 볼락류 야간 어종 DB 확장**: 조피볼락(우럭), 황볼락, 열기, 참돔(야간) 4종 데이터 추가 및 영등철 저수온기 보정 반영 완료
- **[신규] 어종별 수층 및 보일링 특정화**: `swimmingLayer: 'surface'` 및 `isBoilingSpecies: true` 속성 기반 상층/보일링 어종 구분 완료
- **[신규] 상층/보일링 물고기 그림자 시각화**: 찌 흘림 상태 시 상층 어종이 포인터에 존재할 경우 1~2개 그림자 회전, 보일링 어종 존재 시 여러 마리의 군집 그림자가 요동치며 빠르게 찌 주변을 지나는 연출(`updateShadows`) 구현 완료
- **[신규] 실시간 드랙 조정 및 파이팅 피드백**: `adjustDrag` (F/G 및 방향키 위아래), `simulateFightTick` 기반 장력/드랙 물리 틱 갱신 및 장력 90% 임계 도달 시 릴링 락업(잠김) 연출 완료
- **[신규] 장비 브랜드명 저작권 우회 개편**: 실제 브랜드명을 가상의 우회 명칭(다이와->다이오, 시마노->소마노, 선라인->솔라인, 요즈리->요즈미, 나이키->쯔리센, 메이저크래프트->마이너크래프트)으로 전면 개편 완료
- **[신규] 고증 수온 데이터 구조화 (`WaterTemperatureData`)**: 단순 표층 수온 대신 상/중/하층 수온 및 추세(trend), 변화량(delta), 냉수대 등의 수온 충격 지수(`coldWaterShockIndex`)를 관리하도록 타입 설계 완료
- **[신규] GIS 맵 빌더 패키지 및 변환 파이프라인**: 대한민국(512), 포항(1024), 임곡항(2048), 방파제(4096) 맵 계층 구조화(`MapRegistry`) 및 타일 정밀 분류 콜리전 포맷 내보내기(`TileExporter`), 타일 다운로드/결합/단순화 전처리/도트 픽셀화/게임 에셋 자동 배포 GIS 파이썬 파이프라인 구축 완료
- **[신규] WorldMapScene 전면 개편** (`WorldMapScene.ts`): 수동 폴리곤 윤곽선 → `webglmap_pixelazed.png` 배경 이미지 직접 배치, `WORLD_NODE_DATABASE` 기반 동적 핀포인트 마커, 리스트↔지도 양방향 hover 하이라이트 동기화, 클릭 시 카메라 줌인 애니메이션, 스팟 툴팁(물때/수온/어종) 완성
- **[신규] 캐릭터 스프라이트 교체** (`FieldScene.ts`): Graphics 직접 드로잉 → `packages/man/` 실제 PNG 에셋 기반 `playerSprite: Image` 교체, 4방향(front/back/left/right) × idle/move × 2프레임(200ms 교체 주기) 걷기 애니메이션 완성
- **[신규] WorldMapScene 핀 편집 Dev Tool 및 진입 UI 완성** (`WorldMapScene.ts`): `_editSelectedId` TS6133 빌드 오류 수정. 우하단 범례 상단에 `🛠️ Dev Tool (P)` 버튼을 추가하여 마우스 클릭과 P키 입력을 모두 지원. 활성 시 오렌지색 하이라이트 및 상태 텍스트 갱신. 배너 우측에 드래그된 핀 ID/좌표 실시간 표시, 지도 클릭 시 pixelX/Y 좌표를 캡처하여 클립보드에 자동 복사하는 기능 추가, `📋 전체 덤프` 버튼 구현.
- **[신규] 드래그 가능 팝업 패널 및 토글 해제**: `InfoOverlayPanel` (인벤토리, 퀘스트, 상태) 및 `LicensePanel` (라이선스)에 Phaser 드래그앤드롭 및 우측 상단 ✕ 닫기 단추 구현 완료. 플레이어가 맵을 대량 이동한 후에도 화면 뷰포트 내 절대 좌표(화면 중앙 좌/우 오프셋 레이아웃)에 고정 렌더링되도록 수정 완료
- **[신규] 팝업 휠 스크롤 및 마스크**: `InfoOverlayPanel` 본문 영역에 GeometryMask 및 마우스 휠 스크롤 리스너를 결합해 텍스트 오버플로우가 발생할 때 유연하게 스크롤해서 모든 글을 읽도록 개선함.
- **[신규] 캐스팅 차지 게이지 & 스킬샷**: 낚싯대(0번 슬롯)를 든 상태에서 마우스 좌클릭을 유지하면 정현파 형태로 0%~100%를 오가는 파워 게이지를 시각화하고 뗐을 때의 파워(`castPower`)를 `FishingScene`으로 고증 연동함.
- **[신규] 클릭 이동 차단 및 단축키 연동**: 팝업창, 미니맵, HUD 영역 클릭 시 및 팝업/모달 활성화 중에는 맵 클릭 이동을 차단해 조작 버그를 해결함. 단축키 `1`~`8` 번 입력 시 HUD 퀵슬롯 하이라이트가 즉각 갱신되도록 연동함.
- **[신규] 울릉도/독도 노드 최적화**: 지형 픽셀맵 고증을 반영하여 울릉도 노드를 우하향 재조정하고, 지도 동단 노란 체크위치에 `dokdo` (독도) 핀포인트를 신규 반영함.
- **[신규] 서브 씬 ESC & fadeOut 규격화**: 콘도, 조리, 식당, 해루질, 통발 씬에 keydown-ESC 리스너를 일괄 부여하여 나가기 동작의 fadeOut stop/resume 연출 구조를 하나로 통일함.
- **[신규] 물리 디버그 비활성화** (`PhaserConfig.ts`): `arcade.debug: import.meta.env.DEV` → `false`로 변경. 캐릭터/건물에 그려지던 분홍색 사각형(충돌 바디) 및 초록색 속도 벡터 선 완전 제거.
- **[신규] 캐릭터 크기 고정** (`FieldScene.ts`): `setScale(0.14)` → idle 텍스처 원본 해상도 기준 `setDisplaySize()` 절대 픽셀 고정. idle/move PNG 해상도 불일치로 인한 이동 시 캐릭터 축소 버그 해결.
- **[신규] 클릭 자동 이동 완전 삭제** (`FieldScene.ts`): `isMovingToTarget`, `targetX/Y` 멤버 변수 및 관련 `pointerdown` 리스너, `update()` 자동 이동 블록 전체 제거. 이동은 방향키 전용, 낚싯대 좌클릭은 캐스팅 차지게이지 전담.

---

## 10. 데이터 관련 원칙

- **공개 API 데이터** (기상청, 해양조사원): `api-client/` 폴더에 클라이언트 존재
- API 키 없을 경우 Mock 데이터 반환 (각 클라이언트에 구현됨)
- **어신앱 스팟**: `AnglerAppSpots.ts`에 실제 한국 조위 관측소 코드 매핑
- **음력/물때 계산**: `utils/LunarCalendar.ts` 기반, 모든 날짜는 한국시간(KST) 기준

---

## 11. 작업 이어받기 절차

1. 이 파일 (`AGENTS.md`) 완독
2. `IMPLEMENTATION_PLAN.md` 확인 — 현재 단계와 다음 작업 파악
3. `npx pnpm run build`로 현재 빌드 상태 확인
4. 빌드 오류 먼저 수정 후 새 기능 구현
5. 새 기능 추가 후 반드시 `npx pnpm run build`로 검증
6. 작업 완료 시 `IMPLEMENTATION_PLAN.md`와 이 파일(`AGENTS.md`) 최신 상태로 업데이트
