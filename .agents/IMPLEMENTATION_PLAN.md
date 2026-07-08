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

### 6-1. FishBiteEngine V2 — 고증 알고리즘 강화

**파일**: `packages/core/src/simulation/FishBiteEngine.ts`

현재 단순 가중합산 구조를 아래 단계로 고도화:
- `getSeasonScore()`: 현재 월 기반 `seasonActivity` + 영등철/회유 시즌 보정
- `getTideTimingScore()`: 만조/간조 시각과 현재 시각 차이로 `highTideWindow` 내 여부 판단 (단순 tideStrength 배수 대비 훨씬 현실적)
- `getTempScoreV2()`: `tempActivityCurve` + `interpolateTempActivity()` 선형 보간
- `getRigBonus()`: 전유동/반유동/루어/바닥 채비별 어종 보너스
- `getHabitatScore()`: 스팟 타입 vs `preferredHabitat` 매칭
- `isClosedSeason()` 체크: 금어기 자동 경고

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

### 6-5. WorldMapScene → 도트 월드맵 렌더링 전환
**파일**: `packages/client-pc/src/scenes/WorldMapScene.ts`

> **설계 문서**: `realdata_architecture.md` 참고

- 픽셀 스타일 한국 해안선 배경 그리기
- `SPOT_DATABASE` 순회 → `dotMapX/Y` 기반 노드 배치
- 스팟 타입별 색상 구분 (방파제=하늘색, 갯바위=산호색, 선상=금색 등)
- 마우스 오버: 현재 물때·날씨·추천 어종 미리보기 카드
- 라이선스 없는 스팟: 잠금 표시 + 면허사무소 안내

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

## 현재 빌드 상태 (2026-07-08)

```bash
pnpm run build                                  → ✅ 3/3 패키지 성공
pnpm --filter @tra/client-pc run typecheck      → ✅ 0 오류
```

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
