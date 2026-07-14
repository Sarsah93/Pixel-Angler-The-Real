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
| 영역기반 라이브 필드 레이아웃 엔진 | `client-pc/src/data/SpotFieldLayouts.ts` |
| 포항 영일만 픽셀 지형 맵 데이터 | `client-pc/src/data/YoilBayFieldMap.ts` |
| 조류/수심 픽셀 시각화 렌더러 | `client-pc/src/ui/HydroCurrentRenderer.ts` |
| 월드맵 핀포인트 노드 타입 + DB | `core/src/types/WorldMap.ts` |
| WorldMapScene 전면 개편 (픽셀 지도 + 동적 핀 + 툴팁) | `client-pc/src/scenes/WorldMapScene.ts` |
| FieldScene 캐릭터 스프라이트 교체 (man/girl 에셋) | `client-pc/src/scenes/FieldScene.ts` |
| 에셋 이미지 공개 디렉토리 구성 | `client-pc/public/` |

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
| `1`~`8` | 퀵슬롯 선택 (상단 숫자키) |
| `ESC` | 열린 팝업 LIFO 닫기 → 마지막은 월드맵 복귀 |
| 마우스 클릭 | 클릭 위치로 자동 이동 |

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

## 9. 현재 빌드 상태 (2026-07-14 기준)

```
npx pnpm run build → ✅ 4/4 패키지 성공 (2026-07-14)
npx pnpm --filter @tra/client-pc run typecheck → ✅ 0 오류 (2026-07-14)
```

**최근 주요 변경**:
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
