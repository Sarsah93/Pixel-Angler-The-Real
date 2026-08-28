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

> **절차·함정 노하우는 `.claude/skills/` 12종 스킬로 추출됨** (목록·한 줄 요약은 CLAUDE.md) —
> 해당 작업 시 반드시 해당 스킬을 로드한다: verify-render(실렌더 검증) · asset-pipeline(에셋) ·
> add-species(어종 등록) · ui-panel(UI 검수) · save-migration(세이브) · deploy-ghpages(배포) ·
> f9-guide-coords(가이드 좌표) · add-region(타일맵) · add-tuning(튜닝) · scene-transition(씬 전환) ·
> doc-readability(문서 가독성 — 문서 기록·갱신 시) ·
> **work-log(작업 기록 — 모든 작업 완료 시 필수)**.
> 이 문서(§4·§8)는 **상시 적용 절대 규칙 요약**만 유지한다.

### 작업 기록 정책 (2026-08-06 — 사용자 지시) → 상세는 **스킬 `work-log`**
- 구조화 뷰는 **`docs/wiki/`** 4층(구조 / 시스템별 과제 / 워크로그 / 백로그). 착수 전 해당 시스템 페이지를 읽는다.
- **본문 기록은 `docs/wiki/03-WORKLOG/` 1건**(8절 양식)에 쓰고, **이 문서 §9와 PLAN에는 요약 3~5줄 + 링크**만 남긴다.
- 시스템 페이지(`02-SYSTEMS/*.md`)는 **누적이 아니라 갱신** — "지금 상태"를 답하는 문서다. 새 함정은 그 §6에 올린다.

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

### 씬 전환 패턴 (중요 — 반드시 준수) → 상세는 **스킬 `scene-transition`**
- 필드 → 하위 씬 = `pause` + `launch` / 복귀 = `this.scene.stop()`(인자 없이) + `resume`. **하위 씬에서 `scene.start('FieldScene')` 절대 금지**(필드 재생성 = 상태 초기화). 필드 create()에 `on('resume', fadeIn)` 필수.
- 페이드아웃 대기는 bare `camerafadeoutcomplete` 금지 — **`scenes/SceneFade.ts`의 `fadeOutThen`**(폴백 타이머+이중 실행 가드) 경유 (73차 전수 적용. 대형 씬 3곳은 자체 fadeOutThen 유지).
- 재진입 가드(`isTransitioning`)는 **create()에서 리셋** + 비용 차감은 가드 통과 후.

### 한국어 주석 정책
- 모든 파일 상단 JSDoc 주석은 한국어로 작성
- 인터페이스/타입 필드의 설명 주석은 한국어로 작성
- 영어 주석도 혼용 가능하나, 핵심 설명은 한국어 우선

### UI 텍스트·레이아웃 검수 정책 (2026-07-25/30 — 사용자 지시) → 상세는 **스킬 `ui-panel`**
- 모든 텍스트는 컨테이너 경계 밖 금지 — wordWrap / 우측정렬 / `clampTextWidth` 중 하나로 방어.
- 모든 패널은 신규·수정 시 **오버플로·겹침·스크롤/클립 3항 검수** + 가장 긴 콘텐츠로 실렌더 확인.
- 인터랙티브 목록 = 윈도우드 렌더(마스크는 팬텀 히트) / 화면 고정 마스크 = `setScrollFactor(0)` / z-order 밴드(일반 800대·모달 900대) / 드래그 = 커스텀 포인터 방식 — 전부 스킬 참조.

### 세이브 하위호환 · 시드 복원 정책 (2026-07-30 — 사용자 지시) → 상세는 **스킬 `save-migration`**
- **세이브는 항상 과거 스키마일 수 있다** — 아이템 정적 필드 추가 시 `deserialize` 시드 백필(`?? seed` — 누락분만), **유저 상태(qty/condition/equipped/slot 등)는 절대 덮어쓰지 않음**.
- 신규 필드 소비 로직은 폴백 3단계(시드 백필 → 휴리스틱 → 안전 기본값) 없이 강제 참조 금지.
- 적용은 세이브 로드 시점 — 라이브 세션은 재로드 필요(사용자 안내 포함). 백필/주입 패턴·검증법은 스킬 참조.

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
8. **에이전트의 `git commit`/`git push` 금지** (사용자 지시 2026-08-14) — 커밋과 푸시는 **사용자가 직접** 한다.
   에이전트는 파일 변경까지만 하고, 작업 완료 시 "커밋 대기 상태"임을 보고한다.
   (배경: 원격 세션 크리덴셜이 push 권한이 없어 403 — 이후로도 버전 관리 결정권은 사용자가 가진다.)

---

## 9. 현재 빌드 상태 (2026-08-06 기준)

```
npx pnpm run build → ✅ 4/4 패키지 성공 (2026-08-09)
npx pnpm --filter @tra/client-pc run typecheck → ✅ 0 오류 (2026-08-09)
```

> **아래 차수 히스토리는 "무엇을·왜 바꿨나"의 변경 기록이다.** 히스토리 곳곳에 흩어져 있던
> 반복 절차·함정(검증 하네스·에셋 파이프라인·어종 등록·UI 검수·세이브 마이그레이션·배포·
> F9 좌표·타일맵·튜닝·씬 전환·문서 가독성)은 **`.claude/skills/` 12종으로 추출·정리됨** — 작업 방법을
> 찾을 때는 히스토리를 뒤지지 말고 해당 스킬을 먼저 로드할 것.
>
> ⚠ **81차부터는 여기에 길게 쓰지 않는다** (2026-08-06 정책 — 이 절이 375 KB까지 커져 세션 컨텍스트를 잠식했다):
> 본문은 **`docs/wiki/03-WORKLOG/<날짜>-<차수>-<슬러그>.md`**, 여기엔 **요약 3~5줄 + 링크**.
> "지금 무엇이 어디까지 되어 있나"는 **`docs/wiki/README.md` 대시보드**와 `02-SYSTEMS/*.md`를 본다.
> 80차 이하 원문은 아래에 **그대로 보존**(불변 원장) — 구조화 인덱스는 `03-WORKLOG/README.md` §3.1.

**최근 변경 (2026-08-28 101차) — dev 맵 편집기(F7)·순간이동 + 차도 벡터 마킹(노란 중앙선·대각선) + 프롭 10종** (사용자 피드백 3건 — 실렌더 PASS·pageerror 0, 빌드 4/4·typecheck 0):

- **맵 편집기(F7, dev)**: 지형 8종 페인트(브러시 1/3/5)·프롭 배치/제거·지붕 색 순환 — 스트로크마다
  `SeamlessChunks.invalidateTiles`(수심/건물 재계산 + 영향 청크 충돌·재베이킹) · Ctrl+Z ·
  **저장 = vite dev 미들웨어**(`/__dev/region-patch`) → `pixelazed/<region>/patch.json`(정본, 재빌드 시 굽힘)
  + `public/data/<region>/patch.json`(런타임 F5 반영).
- **순간이동**: Ctrl+좌클릭(맵) · Ctrl+클릭(미니맵 — `minimap-click` 이벤트). F10 콘솔 아이템 **'+최대'**(99).
- **차도 마킹 = 벡터**: 래스터라이저가 `roads.json` 동반 출력 → 노란 중앙 실선(≥2타일)·흰 점선
  차선(방향당 2차로↑ ±3.5m)·가장자리선 — **대각선 도로 대응**(타일 휴리스틱 `roadAxis` 폐기).
- 프롭 10종 절차 텍스처(`PROP_DEFS` — 침엽수·덤불·바위·벤치·가로등·화단·기념탑·어선 …).
- **후속(같은 날 — 피드백 3건)**: 차선 **연속 오프셋 폴리라인**(정점 인셋 폐기) + 차도 폭 차로 기준
  재산정(마킹이 차도 안) · **타일셋 통합** — `tools/extract_tileset_assets.py`(Gemini 트림·TopDown
  연결요소·Kenney 마젠타 키잉+마진 제거) → `data/TilesetManifest.ts` → `PROP_DEFS` 40여종(카테고리) ·
  POI 의미 일치 프리팹(횟집 11·팝업 10·고층/주택) · 대형 건물 고층 자동 · 도로 벡터 차량 · POI NPC 73 ·
  크레딧(Kenney CC0·FisherG).
- **후속 2 — TR 32 전환**(사용자 결정): 심리스 타일 32px(legacy 20 유지) · 청크 32타일 · 이동 210px/s ·
  Kenney 지면 베이스(`GROUND_CELLS` 수동 확정 — 자동 색 선별은 반복 무늬 함정) ×2 재베이크 +
  절차 전이 레이어. 실렌더 5지점 · 60FPS.
- **후속 3 — 사용자 리포트 7건**: 건물 **2.5D**(하단 2줄만 충돌 · 지붕 = 컴포넌트 스프라이트 y-sort로
  캐릭터 가림) · 상점 프리팹은 문 앞 별도 오브젝트 + 자체 충돌 · 도로선 타일 중앙 스냅 + 격자 위상 점선 ·
  **`TrafficSystem`**(도로 그래프 우측통행 70대 · 정차는 연석 극소수) · 지면 접경선은 지형 접경에만
  (무테·무균열 셀 픽셀 분석 확정).
- **후속 4 — 에셋 학습 재구성(08-29, 리포트 11건)**: 시트 격자 서베이로 크롭 확정(주택 6×7·펜스 세트·문) ·
  **Kenney 건물 키트**(지붕 3×3 오토타일 + 벽 모듈 하단 2줄)로 건물 타일 채움 · **직각삼각형 대각 엣지** ·
  전 오브젝트 충돌(`propFootprint` 단일 기준) + 편집기 배치 격자(녹/황/적)·겹침 거부 · 편집기 탭 팔레트
  (썸네일) · 교통 정점 그래프 + U턴 보간 · 보행자 NPC · 문 탐색 도로 회피 · 어선 ×2.
- **후속 5 — 도로 벡터 밴드(08-29, 리포트 6건)**: `r`/`w` 타일 그림 폐기 → 청크 베이킹 시 **보도→연석→아스팔트
  굵은 선 + 라운드 조인**(곡선 그대로, 교차부 자동 합류) · 마킹은 교차 정점 조각 인셋(교차로 박스) · 교통:
  막다른 끝 페이드 재등장(U턴 폐기)·차간 정지·교차 양보·주행 폭 ≥ 2 · 지면 셀 4행 주기 반복 셀만 · 소형
  건물 지붕만 · POI NPC 깊이.
- **후속 6**: 편집기 **도로 벡터 툴**(정점 이동/삽입/삭제 → `RegionPatch.roads` 오버라이드, 청크·교통 즉시
  재구성) · 횡단보도·정지선 벡터(조각 교차부 끝) · Kenney 아스팔트 톤 `#404040` + 반점 · 보행자 밴드 거리 판정.
- **후속 7 — 교통 규범(그림 3장 학습)**: OSM `junction=roundabout`/`oneway` → roads.json 플래그(속초 링 3) ·
  회전교차로 = 중앙 교통섬 + 양보선 + 링 우선 반시계 · 왕복 4차로 이중 황색선 · 횡단보도 겹침 줄무늬 생략 ·
  **차량↔캐릭터**: 접근 시 정지 대기, 부딪히면 넉백 + HP −20% + 차량 180초 정지. 주차 차량은 도로가 아니라
  **건물 옆 맨땅**(TopDown 승용차·픽업 4방향 프레임 — 벽 방향 프레임 선택, 회전 금지).
- 상세: `docs/wiki/03-WORKLOG/2026-08-28-101-map-editor-road-vectors.md`

**이전 변경 (2026-08-27 100차) — 문어 픽셀 에셋 10장 매핑 + OSM 실지형 심리스 맵 v2(속초 청크 스트리밍)** (사용자 지시 2건 + 전달 파일 4종 — 실렌더 3하네스 PASS·60FPS·pageerror 0, 빌드 4/4·typecheck 0):

- **문어 에셋**: 사용자 픽셀 투명 에셋 0~9.png → `octo_*` 전량 교체(KEEP_POLY/BG_TOL 폐기 —
  알파 경로) · `octo_invert1` 드래그 중간 프레임 신설 · 부리 아이콘 = 7.png ·
  오징어 레퍼런스 폴더 이동(`무늬오징어 레퍼런스/`)에 `CEPH_SRC_DIR` 정합(키 소실 함정 해소).
- **OSM 심리스**: `tools/` 3종(fetch/build/regions 17개) + `.agents/OSM_TILEMAP_SPEC.md`(§0.5 정합
  노트 신설) 배치 → 속초 v2 완주 — 589×321 단일 맵 · 타일 r/s/b 신설 · `SeamlessChunks`(64타일
  청크·RT 풀 12 LRU·3×3 상주·프레임당 1베이킹·근접 충돌) · OSM POI 310(문 규칙·거래 매핑) ·
  meta 스폰 · ODbL 크레딧. legacy 그래프(부산·홈타운·속초 7맵)는 폴백 보존.
- **잠복 실버그 수정**: `pointer.worldX/Y`가 스크롤 카메라에서 미갱신(스크린 좌표 그대로 — 소형 맵은
  스크롤 ≈ 0이라 잠복) → 조준·설치를 `camera.getWorldPoint` 경유로 교체.
- **후속(같은 날 — 사용자 피드백 2건)**: **스케일 2배**(`TILE_M 5` — 속초 1179×642 · 도로 폭
  미터 기준 `ROAD_W_M` · 보도 타일 `w` 신설 + 차도 양옆 프린지) · **§11 L1·L3 절차 구현**
  (스페클 질감·차선 점선·연석·신축이음·계선주·포말·배·박공/패널 지붕+그림자·나무 y-sort) ·
  **HUD 픽셀 패널 공용화**(`ui/HudPanelStyle.ts` — 상태/로그/퀵슬롯/미니맵/타이틀 명패) ·
  심리스 야간 발광 수정(허공 halo 제거) · 안개 = 픽셀 구름 텍스처.
- 검증: 심리스 진입·이동·충돌·POI 거래·캐스팅→1인칭 진입/복귀(실측 수심 소비)·**60FPS 고정** ·
  문어 스프라이트 회귀 0(키별 md5) · 부산/홈타운 회귀 스모크 · 실렌더 4지점 스크린샷.
- 상세: `docs/wiki/03-WORKLOG/2026-08-27-100-octo-pixel-osm-seamless.md`

**이전 변경 (2026-08-14 99차) — 발견 도감·위키 + 통발 결함 2건 + Dev 크리에이티브 콘솔(F10)** (사용자 지시 4건 — 실렌더 19/19·pageerror 0, 빌드 4/4·typecheck 0):

- **통발 결함 2건 수정**: `trap_crab_pro`의 `'shellfish'` 타깃은 생물 DB에 실생물 0이라 **영영 매칭 불가**였다
  → `gastropod`(소라) 정정 · 장어/어류 통발에 **`targetFishSpecies` 신설**(FishDatabase 연동 —
  붕장어·먹장어·갯장어·볼락류 실포획, 쿨러 이송 시 type 'fish' = 판매가·도감 연동).
- **발견 시스템(신규 S20)**: `core/types/Discovery.ts` + `client/store/DiscoveryStore.ts` —
  "한 번이라도 조우한 것만 도감/위키 공개"의 단일 기준. 세이브 영속 + **구세이브 legacy 백필** +
  발견 소스 4곳(어획 catch/통발 trap/해루질 night_hunting/취득 inventory) + HUD 토스트 + **N 키 도감**.
- **도감 4탭 개편**(AnglerLogScene): 어종(미발견 = **실루엣**+???+서식 힌트)/해양생물/
  **아이템 위키**(시드+상점 카탈로그 `WikiCatalog.ts` — 미발견 = 판매처 입수 힌트)/조과 기록.
- **Dev 크리에이티브 콘솔(F10)**: `dev/DevMode.ts`(god — 신선도 동결·채비/미끼 손실 없음·줄터짐 없음) +
  `dev/DevConsolePanel.ts`(재화·아이템 검색 지급/제거·어종 지급 `devGrantFish`·도감 전체 해금). 프로덕션 데드코드 제거.
- ⚠ 함정: 발견 기록은 리셋/로드/**첫 부팅** 3경로 전부 배선 필요(첫 부팅은 applySaveData를 안 거침 — 실측 FAIL로 발견) ·
  일괄 동기는 onNew 훅 억제 · 아이템 카운트는 카탈로그 교집합으로.
- 상세: `docs/wiki/03-WORKLOG/2026-08-14-099-discovery-wiki-trap-devmode.md` ·
  신설 페이지: `02-SYSTEMS/night-hunting-trap.md`(S14) · `02-SYSTEMS/discovery-wiki.md`(S20)

**이전 변경 (2026-08-13 98차) — 문어 실사 스프라이트 + 삶기 · 다리 분리 · 숙회 · 플레이팅** (사용자 실사 9장 + PNG 4종 — 실렌더 32/32, 빌드 4/4·typecheck 0):

- **실사 9장 → `octo_*` 9키**: 파이프라인 **KEEP_POLY 신설**(피사체 폴리곤 — 손·싱크대·트레이 제거,
  BFS는 BG_TOL 4로 사실상 끔) + 스테이지 **재배열**(부리 제거를 소금 앞으로 — 사진 넘버링 = 실제 공정) +
  드래그 진행 프레임(외번 1→2 · 내장 3→4 · 악판 5→7) + 완료 도마·통마리 아이콘 = '손질 완료' 실사 도트.
- **삶기 체인**: 통마리 우클릭 **[삶기]**(`boilOctopus` — ×0.8g·**'신선'** 시작·불요리 전 간이 경로) →
  **삶은 문어만 도마 가능** → 3컷 다리 분리(머리 ×1 + 다리 ×8) → **사선 7컷 숙회**('문어 숙회 한 점' ×8 —
  밀림 팬아웃 공유·접시 조각 = 숙회 실사 이미지). `gen_octo_assets.cjs` 신설(PNG 4종 + 아이콘).
- 부수 정정: ceph 부산물 `byproductKind`를 내장류 3종에 한정 — 통마리·몸통살에 '만들기'(밑밥 전환)가
  뜨던 097차 유래 함정 제거.
- 가이드 좌표(OCTO_*·octoWhole 3컷·octoLeg 7컷)는 실사 기준 재근사 — **전부 F9 실측 대상**.
- **098-b (08-14)**: 사용자 완성본 교체 — 시작 = `octo_live`(손질 전 투명본 · 구 손 사진 1 폐기) ·
  완료/통마리 아이콘 = `octo_clean`('손질 완료된 문어' 투명본 직접 다운스케일). 재검증 32/32.
- 상세: `docs/wiki/03-WORKLOG/2026-08-13-098-octopus-photo-boil-sukhoe.md`

**이전 변경 (2026-08-13 97차) — 두족류 부산물 개편 + 회뜨기 3모드 + 한치 개방 + 문어 8스테이지 트리** (사용자 지시 — core 38/38 + 회귀 61/61 · 실렌더 32/32, 빌드 4/4·typecheck 0):

- **부산물 개편**: 껍질·아가미 **미지급** · 뼈 = '무늬오징어 뼈'/'갑오징어 뼈' · 몸통살 명명 ·
  **두족류 순수 필렛 최종 지급 제거**(몸통살이 곧 필렛 — 원물 판매가 ×0.75 승계).
- **회뜨기 3모드**(부산물 → 도마 드래그 — `cephSliceKind`): 몸통살 = 가로 1 + 세로 10컷 = **22점** ·
  날개살 = 좌우 2장 각 1컷 = **4점** · 다리부 = 1컷 → **촉완 ×2 + 촉완 제거 다리부**(회 아님).
- **한치** = 무늬오징어 트리·섹션·실사 공유 라우팅 · **문어 8스테이지**(외번→내장→되돌림→**굵은소금
  치대기**(1개 소모 — 시드+마트 등록)→문지르기→세척→악판→완료) + OCTO 3뷰 파라메트릭(실사 대기).
- ⚠ 하네스 함정: `page.keyboard.press`는 아래 씬 메뉴까지 구동(NEW GAME → 인벤 리셋) —
  버튼 확정은 `panel.onKey()` 직접 호출 (verify-render 스킬 반영).
- 상세: `docs/wiki/03-WORKLOG/2026-08-13-097-ceph-byproducts-slicing-octopus.md`

**이전 변경 (2026-08-13 96차) — 작업 패널 침범 해소 + 회전 배치 크기 통일 + 연출 후 전환 규칙 재적용 + 3분할 조각 밀림 (실측 4스윕)** (사용자 캡처 리포트 7건 — core 61/61 · 실렌더 30/30, 빌드 4/4·typecheck 0):

- **작업 패널 3열**(7작업 = 3×3 — 하단 148 ≤ 도마 프레임 164, 침범 해소) ·
  **회전 배치 크기 통일** — 표시 스프라이트의 회전 후 세로를 고정 목표 250px로(`cephRotScaleFor` —
  프레임 전환 크기 널뜀·도마 이탈 해소).
- **연출 후 전환 규칙 재적용**(53차 규칙) — 결과 프레임 전환·조각 밀림은 스윕 연출이 끝난 뒤
  (`CEPH_SWITCH_T` 0.7). `cephAnimStageId`로 연출 중 표시 스테이지 고정(advance 선실행 대비).
- **3분할 = 조각 밀림 연출**(`drawHeadmass` — 회썰기 문법) + **부리 = 가운데 조각만**(subjectRect
  불변 — 실측 좌표 유지). 가로 4스윕 실측 반영 · 플랩 재채색(좌 껍질톤/우 흰색).
- 상세: `docs/wiki/03-WORKLOG/2026-08-13-096-squid-layout-size-splitfx.md`

**이전 변경 (2026-08-13 95차) — 무늬오징어 껍질 가로 뜯기 4단계 분할 + 플랩 목업 베이크 + 날개살 드래그 후 전환 (17→20스테이지)** (사용자 피드백 3건 — core 실판정 61/61 · 실렌더 27/27, 빌드 4/4·typecheck 0):

- **껍질 가로 뜯기 = 4단계 분할** — 라이브 프레임 전환 폐기(사용자: "조금씩 드래깅해서 다음 사진으로").
  각 단계 = 시작 사진 위 짧은 당김 → 완료 연출이 다음 사진(0-1→1-2→2→3→4.1). 뜯기 ② 완료 = **4.2 원본**.
  2~4/4 당김 좌표는 근사 — **사용자 단계별 수동 지정 예정**.
- **peel 당김 품질 = 스윕 길이 비례** — 구 절대거리(along×1.5)는 분할로 스윕이 짧아지자 **가이드를
  끝까지 따라도 임계 미달**(1/4 실측 0.237 < 0.25). `along/swLen` 정규화 (두족류 전용 — 어류 무영향).
- **들추기 플랩 = 목업 0-1 직접 베이크**(절차 합성 폐기 — "이상한 걸 넣어놨네"). 파생 정리 4단
  (도마색 보더 플러드·검은 띠·프린지 침식·연결요소). **날개살** = 드래그 후 전환(5.1 좌우+상하반전).
- ⚠ 파이프라인 함정 2건: ERASE_POLY가 캡처를 **알파 경로로 오판**시켜 배경 제거가 꺼짐 ·
  목업 캡처는 투명 여백 탓에 도마색이 남음(보더 플러드 필수 — 색근접+따뜻함 병용).
- 상세: `docs/wiki/03-WORKLOG/2026-08-13-095-squid-peel-4step-flap-bake.md`

**이전 변경 (2026-08-13 94차) — 무늬오징어 내장 분리 2분할(미러 정정) + 날개 순서 재정의 + 3분할·부리 F9 실측 (16→17스테이지)** (사용자 피드백 4건 + F9 실측 4건 — core 실판정 53/53 · 실렌더 23/23 · 어류 회귀 6/6, 빌드 4/4·typecheck 0):

- **내장 분리 = 드래그 2회 분할** — 뽑기 1·2 실사가 개복 화면과 좌우 반대라 **미러 재베이크** +
  "연결 프레임이 아니라 단계"(사용자): 1/2 완료 = 뽑기 1 화면 · 2/2(추가 당김) 완료 = 뽑기 2 + 부산물 팝업.
- **날개 순서 재정의** — **날개살 분리 1/2·2/2 → 껍질째 뜯기 1/2·2/2** (구 순서 반대). 날개살 실측
  수평 2선 반영 + 5.1 프레임 **상하반전**(`FLIPV_KEYS` 신설 — 살이 아래로 들림).
- **3분할·부리 실측** — 세로 2선(x 0.771/0.510) · 부리 (0.575,0.613)→(0.493,0.559)
  (93차 「이빨 제거」 목업 미해결 해소).
- ⏸ 잔여: 내장 2/2 당김(근사)·뜯기 ①② 스윕·날개 껍질째 2경로 F9 + 합성·파생 품질 확인.
- 상세: `docs/wiki/03-WORKLOG/2026-08-13-094-squid-viscera-split-fin-order.md`

**이전 변경 (2026-08-13 93차) — 무늬오징어 껍질·날개 detail 시퀀스 반영: 진행 프레임 5장 + 들추기 손잡이 연출 + 탭 좌표 정정 + 날개 실시간 들림** (사용자 detail 에셋 12장 — core 실판정 49/49 · 실렌더 20/20 · 어류 회귀 6/6, 빌드 4/4·typecheck 0):

- **껍질 섹션 = 회전 뷰(270) 유지 재구성**: 들추기 탭(성공 = 껍질이 살짝 들려 **손잡이 플랩** 연출 —
  `squid_skin_lift` 파생) → 뜯기 ① 우→좌 곡선(목업 추출) · **진행 프레임 5장**(들춤→1-2→2→3→4.1) →
  뜯기 ② 상→하 당김(4.1→합성B · 완료 연출 4.2) → 분리 완료 = **실사 6**(구 92차 파생 대체).
- **탭 좌표 정정** — 캡처 「벗기기 0」이 링을 화면 우상단에 표시 → 92차 로컬 해석은 오독.
  로컬 = `[1−v, u]` 역변환으로 확정. 신규 사진은 전부 **cw 베이크**(표시 270이 촬영 방향 복원),
  `squid_skin_grip`(4.1)도 cw 재배향.
- **날개살 분리** — 시작본 `squid_fin0`(껍질 속 날개살 온전) 신설, path 드래그에도 진행 주입
  (`CEPH_DRAG_FRAMES` 일반화) → 드래그 중 **실시간으로** 5.1/5.2로 들림. 실패 시 시작 프레임 복귀.
- ⏸ 잔여: 뜯기 ①②·날개 4경로·부리 F9 실측(「이빨 제거.png」 목업은 확대 크롭이라 좌표 특정 불가) ·
  플랩/프레임 임계 체감 확인 · 날개 들림 방향(위쪽 — 반대면 ROTATE_KEYS 한 줄).
- 상세: `docs/wiki/03-WORKLOG/2026-08-13-093-squid-skin-detail-sequence.md`

**이전 변경 (2026-08-13 92차) — 무늬오징어 껍질 3구간 회전 뷰·진행 프레임 재구성 + 날개 각 2단 분할 + 아가미 합성 (14→16스테이지)** (사용자 피드백 6건 + F9 실측 3건 — core 실판정 48/48 · 실렌더 17/17 · 어류 회귀 6/6, 빌드 4/4·typecheck 0):

- **껍질 구간**: 들추기 = **탭 1회 + 좌 90° 회전 뷰**(실측 7점) → 뜯기 ① = 실측 스윕 + **진행 프레임**
  (`peelDragT` — 온전→4.1) → 뜯기 ② = **우 90° 회전** · 4.1→합성B + 완료 연출 4.2 → 분리 완료 =
  **순살만**(`squid_skin_done` 파생 — 4.2 껍질 제거 + 연결요소 필터).
- **날개 각 2단 분할**(×2 스테이지): 껍질째 2/2 = 미러 베이크(`_m` 2키) / 날개살은 5.1·5.2 사진 배정.
  **아가미** = `squid_gill_on` 합성(clean + 2.2 기관 색 추출) + 실측 스윕. 섹션 trim 3→5작업.
- **회전 체계**: 두족류는 `advance()`가 회전 자동 스냅(수동 R 차단) + `renderedRotation`(연출 중 옛 회전
  유지 — 어류 표시 경로 공용) + `cephRotScale`(프레임별 세로 예산 동적 산출).
- ⚠ 하네스: 부산물 팝업(모달)이 완주를 막는다 — settle에서 `confirmByproductPopup(false)` 필요(스킬 반영).
- ⏸ 잔여: 뜯기 ②·날개 4경로 F9 재실측 + 합성·파생 품질 사용자 확인 + 들추기 회전 방향 확인(반대면 270↔90).
- 상세: `docs/wiki/03-WORKLOG/2026-08-13-092-squid-skin-rotation-fin-split.md`

**이전 변경 (2026-08-12 91차) — 무늬오징어 3구간 재구성: 껍질 2회 뜯기(추론 합성 2종) + 내장 뽑기 연출 2프레임 + 날개 2단 분리 (12→14스테이지)** (사용자 에셋 4점 + 지시 — core 실판정 28/28 · 실렌더 스테이지별 + 연출 프레임 실측, 빌드 4/4·typecheck 0):

- **"뜯기 전" 상태 실사가 없어 추론 합성**(사용자 지시) — `deriveSkinOver`(그리드 레벨 · deriveLiftA 전례):
  `squid_skin_on`(껍질 온전 — clean 실루엣 + 4.1 껍질 톤) · `squid_skin_down`(아래로 뜯기 시작) ·
  `squid_finskin_on`(필렛+껍질+날개 온전). 질감 기준은 영상(껍질벗기기.mp4 — ffmpeg 프레임 실측).
- **트리 12→14**: `ceph_skin_finish`(껍질 뜯기 ② 아래로 — 90차 실측 스윕 `CEPH_PEEL_FINISH_SWEEP` 배선) ·
  `ceph_finskin_off`(날개 뜯기 ① 껍질째 — 2경로) 신설. **아가미·닦기는 날개 뒤로 이동**(완료본 실사 정합).
- **peel 판정 일반화**: 잡기 = `tapPoint` 반경 · 당김 품질 = **스윕 방향 투영** — 구 "x>0.72 + 좌로 당김"
  하드코딩이면 대각 마무리 스윕이 q 0.084(<0.25)로 **가이드를 그대로 따라도 실패**했다. peel은 두족류 전용(어류 무영향).
- **연출**: 내장 뽑기 = 실사 2프레임 `cephAnimOverride`(lift1→lift2 — doRefresh가 해제, subjectRect 미반영) ·
  peel 연출 = 스윕 경로 추종 + 그립 링(칼 글리프 제거).
- ⚠ 하네스 함정: `process.jumpTo`는 `renderedOrientation`을 스냅하지 않는다 — 방향 불일치로 `willFlip`
  경로에 빠져 액션 연출이 생략된다(`devJumpToTask`만 스냅).
- ⏸ 다음: 신설 좌표(`CEPH_FINSKIN_PATHS` 등) F9 실측 + **합성 3종 품질 사용자 확인**.
- 상세: `docs/wiki/03-WORKLOG/2026-08-12-091-squid-skin-viscera-fin-rework.md`

**이전 변경 (2026-08-11 90차) — 무늬오징어 가이드 F9 실측 반영(1~3단계) + 트리 2스테이지 제거(14→12) + 당김 연출 분리** (사용자 측정본 5건 + 지시 — core 실판정 33/33 · 실마우스 실렌더 5스테이지 완주, 빌드 4/4·typecheck 0):

- **좌표 실측 반영**: 시메①②·개복·내장·연골 5경로(피사체 rect 기준) + `CEPH_PEEL_FINISH_SWEEP`
  (껍질 마무리 스윕 — 4단계 재구성용 보관·미배선). "전체적으로 커버율 부족" 해소.
- **트리 개편(사용자 지시)**: `ceph_mantle_spread`(펼치기)·`ceph_split_check`(결과 확인) 제거 —
  개복 완료 화면이 곧 펼쳐진 화면이고, 결과는 **머리+다리+내장 덩어리 부산물 팝업**이 보여준다
  (`ceph_head_mass` yields를 `t_ceph_viscera`로 이동).
- **`evalNerveCut` 재작성**: 구 "중점 시작 + 절대 길이 0.03~0.12"는 실측 시메 선(0.28~0.32)에서
  가이드 시작 링에서 그어도 실패 → **선 위 시작 + 선 길이 비례** 판정 (어류 무영향 — nerve_cut은 두족류 전용).
- **당김 연출 분리**: `drag_out`·`lift_flap`(내장·연골·부리·들추기)은 칼 글리프·스파크 대신
  **그립 링 + 당김 잔선** ("칼로 절삭하는 행위가 아님").
- ⏸ 4단계(껍질 분리) 재구성은 **에셋 대기** — 껍질 온전 몸통(필수)·분리 완료(권장)·껍질 단독(아이콘) 요청함.
- 상세: `docs/wiki/03-WORKLOG/2026-08-11-090-squid-guide-coords-stage-trim.md`

**이전 변경 (2026-08-10 89차) — 무늬오징어 도마 실사 도트 배선(사진 11장 → 14스테이지) + 좌표계 피사체 기준화 + 머리+다리 덩어리 아이콘** (사용자 에셋 투입·지시 — 실렌더 검증 PASS, 빌드 4/4·typecheck 0):

- ⚠ **실사 도마 렌더 정책은 어군별로 다르다** — 어류는 84차대로 "실사 = 참고자료, 도마 = 자체 픽셀",
  **두족류는 사진이 곧 도마 그림**(사용자 지시 2026-08-10). 84차 결정을 두족류에 적용해 사진을 걷어내지 말 것.
- **파이프라인**(`pixelize_butchery.cjs`): `CEPH_SRC`(한글 파일명 → `squid_*` 명시 매핑 — 원본 복제 없이
  사용자 폴더를 단일 소스로 유지) + **`FIT_LONG_PREFIX`**(긴 축 기준 다운샘플 — 가로 기준이면 bbox가 좁은
  세로 원본이 다운샘플 없이 449행으로 구워진다) + 세로 7키 `ROTATE_KEYS` cw.
  가로 원본은 결과 불변 — **기존 20 스프라이트 바이트 동일**(0 삭제).
- **렌더**: `CephalopodFish`가 **실사 우선 · 파라메트릭 폴백**(`SQUID_STAGE_SPRITE` 14스테이지 —
  사진 11장 공유 배정, 날개 2곳은 `finPathsDone`으로 5.1→5.2). `drawStageSprite` = 정확 맞춤 셀
  (어류 정수 셀 경로는 무변경 — 통합 금지).
- **좌표계**: **`subjectRect`** 신설 — 유도선(`toPanelPx`)·입력(`toNorm`)·F9 드래그 3경로가 공유.
  **두족류만** 스프라이트 실점유 rect(뷰 종횡비가 0.27~2.6이라 도마 기준이면 `tolerance`의 실제 관대함이
  뷰마다 달라진다), 어류는 생선 rect 그대로.
- **아이콘**: `ceph_head_mass`가 내장 주변부 대체본을 쓰던 것 → 전용 `trim_ceph_head_mass`로 교체.
- 검증: 실렌더 15/15 배선 · `cephFitRect`↔그려진 rect 오차 0 · 도마 이탈 0 / **어류 회귀 cov 1.00** / pageerror 0.
- ⏸ 다음: 사용자 dev 모드 **가이드 좌표 F9 실측** — 좌표계 변경으로 87차 근사값은 전량 재측정 대상.
- 상세: `docs/wiki/03-WORKLOG/2026-08-10-089-squid-photo-stage-sprites.md`

**이전 변경 (2026-08-10 88차) — 검은 화면 방어 4종 + 무늬오징어 무게 실측 정합 + 한치 아이콘 동기화 + PLAN 가독성/`doc-readability` 스킬** (사용자 리포트 3건 + 지시 — 실렌더 검증 6/6, 빌드 4/4·typecheck 0):

- **검은 화면 전수검사**: 사용자 케이스(NEW GAME 진입 시 전면 검정·무에러)는 입력 경로 4종 재현 실패 —
  대신 "에러 표시 없는 검은 화면"을 만드는 잠복 결함 4건 확정·수정: ① WebGL 컨텍스트 유실 무대응 →
  `game.ts installCrashGuards` 오버레이(+복구 시 자동 제거) ② 전역 런타임 예외 무표시 → 상단 배너
  ③ `RegionFieldScene.create` 맵 JSON 캐시 미스 → TypeError 검정 → `bootFailed` 가드 + 메뉴 복귀
  ④ `quitGame` 소프트락(`window.close()` 무시 후 `isTransitioning` 영구 true) → 2.6s 후 해제.
- **무늬오징어 무게**: 기준 혼선(외투장 라벨 ↔ 전장 어림 wf — ×9 과소/+46% 과대)을 **전장 기준·wf 0.015**로
  확정(실측 캡처: 전장 30cm 405g ✓ / 45cm 1,367g ✓ / **1kg = 전장 40.5cm+**). 오라클·dev 지급·도감 3곳 정합.
- **한치 아이콘**: 8/5 교체된 원본이 `public/fish/`에 미복사였던 것 동기화(직접 로드 — F5 반영).
- **문서**: PLAN 3행 한 줄 8,183자 히스토리 블록 제거(§9와 중복) + blockquote 벽 해체 · **스킬 `doc-readability` 신설**(12종).
- 상세: `docs/wiki/03-WORKLOG/2026-08-10-088-blackscreen-guards-squid-balance.md`

**이전 변경 (2026-08-09 87차) — 두족류 손질 잠금 해제: 무늬오징어 14스테이지 완주 + 어종별 도마 스프라이트 + 돌돔 성별 배선** (사용자 지시 3건 — core 실판정 12/12·실렌더 완주·부산물 10종 실지급, 빌드 4/4·typecheck 0):
- ⚠ **잠금은 플래그가 아니었다** — 80차는 재료 준비였고 트리·프리미티브 판정·렌더러가 **전부 0건**이었다. 스텁만 풀면 오징어가 어류 트리를 타고 도마엔 감성돔이 뜬다. 해제 = 구현.
- **두족류 트리**: `CephalopodStages.ts`(무늬오징어 14스테이지 — §1.1 13 + §0.5.6 부리) · `SQUID_SECTIONS`(6섹션 14작업 · **스테이지 1개=작업 1개**·전부 순서강제) · `ButcheryProcess` 분기(+`cephalopod` 플래그·뷰 자동 스냅·`evalNerveCut`) · **`primitiveInput()`**(프리미티브 19종 → 조작 5종 분류 — 패널 분기 15곳 정규화) · **`canButcherSpecies`**(분류 ≠ 구현 여부 — squid만 개방) · `ui/CephalopodFish.ts` 6뷰 렌더(파라메트릭 플레이스홀더).
- **어종별 도마 온마리**: `gen_species_sprites.cjs` 신설 → `PixelFishSpecies.ts` 10키(돔류 6 + 돌돔 암/수 + 방어류 3). 개복 전 측면 뷰 전용 · `wholeNative`로 온마리만 무틴트. **긴꼬리벵에돔 원본만 머리 오른쪽**이라 미러.
- **돌돔 성별**: `isStripelessMale` 공용 술어(40cm↑ 수컷) + **`InvItem.sex` 신설**(쿨러엔 있는데 인벤 이송에서 유실되던 것) 4경로 배선. 두족류 dev 어획 4종 지급.
- 검증: core 12/12 ALL PASS(14스테이지 완주·섹션 1:1·nerve_cut 실패 케이스·게이트·어류 회귀) / 실렌더 6뷰·패널 완주·**부산물 10종 지급**(몸통 순살 362g = 786g×0.46)·중도 이탈 체크포인트 / pageerror 0.
- ⏸ **수동 실플레이 검증은 미완**(2026-08-09 시간 부족) — 다음 세션 최우선. 나머지 3종 확장은 그 뒤.
- 상세: `docs/wiki/03-WORKLOG/2026-08-09-087-cephalopod-squid-tree.md`

**최근 변경 (2026-08-07 86차) — 광어 박피 F9 실측 반영 + 회썰기 유도선 dev 편집기(F9)·오버라이드 테이블 신설** (사용자 측정본 2건 + 지시 — core 실판정·실렌더 검증, 빌드 4/4·typecheck 0):
- **박피 좌표**: 넙치류 트리 `peel_grip` 실측 7점 · `peel_insert` 실측 교체 (opts 보존 · **돔류/방어류 블록 무변경**). 가이드 트레이스 cov 1.00·이탈 실패·원형어 회귀 없음.
- **회썰기 편집기**: `SashimiPanel`에 dev F9 — 컷 끝점 링 핸들 실마우스 드래그(편집 중 썰기 잠금) + [복사] = core **`SASHIMI_CUT_OVERRIDES`**(신설 — 키 `'engawa'`|`'{fam}_{mode}'`, 컷 수 불일치 시 자동 배치 폴백) 스니펫. 엔가와·순수 필렛·고급 전 레이아웃 공통. 오버라이드 값은 비어 있음 — 사용자 측정 대기.
- 검증: 엔가와 2컷 드래그·복사·런타임 오버라이드 소비·halibut_basic 14컷×28핸들 스크린샷·pageerror 0.
- 상세: `docs/wiki/03-WORKLOG/2026-08-07-086-peel-coords-sashimi-editor.md`

**이전 변경 (2026-08-07 85차) — 포 뜨기 개방 범위 머리쪽 확장(S컷 곡선 클리핑) + 필렛 아이콘 반쪽 에셋 교체(내장 유무 매핑)** (사용자 피드백 2건 + 신규 에셋 2장 — 실렌더 검증, 빌드 4/4·typecheck 0):
- **개방 확장**: 렌더 엔벌로프가 세로선 `bodyL 0.28`에서 잘려 머리 S컷 절단면(곡선 x 0.208~0.288)과의 쐐기가 안 열리던 것 → `drawFlatFish`에 `cutXatY`/`clipSpan`(headCutPath 기준 컬럼별 클리핑) 신설, 개방·플랩·빗살·척추 마디 전부 절단면까지 확장(4개 포 공통 — 렌더 층만, 좌표 무변경).
- **필렛 아이콘**: 구 `_1/_2`(3면뜨기용 합체 이미지) → `skinned_upper/under_pillet_halibut`(upper=내장 없는 쪽 / under=내장쪽 — 사용자 확정). `buildYieldRows`에 taskId 스레딩, `t_flb_upper`·`t_flk_lower`(내장쪽 반) = under. 구 키 2종은 구세이브 아이콘 호환으로 로드 유지.
- **후속 — 엔가와 분리 도마 슬랩도 반쪽 도트화**: 파이프라인 투입(`fillet_upper/under_halibut` — MIRROR로 꼬리 왼쪽 정합) + `PixelFishState.flatFilletKind`(통짜 = engawa_N 지급 순서 1·4=under·2·3=upper / 재장착 = 원물 아이콘 판정) — 구 `pure_fillet_halibut`(엔가와 제거본 — 물리 부정합) 단일 슬랩 대체. 박피는 무변경(제거본이 정합).
- **우선순위 확정(사용자)**: 광어 가이드 완료 후 두족류 착수.
- 검증: 아이콘 4매핑 + 실지급 3건 + 등/배·중간(플랩) 스크린샷(절단면 도달·몸 밖 삐짐 0) + pageerror 0.
- 상세: `docs/wiki/03-WORKLOG/2026-08-07-085-flat-open-extent-fillet-assets.md`

**이전 변경 (2026-08-07 84차) — 광어 포 뜨기 공정 재정의: 3단계 × 4작업 + 칼 팔로우 연출 + 내장·머리 동반 + 실사 직접 렌더 폐지** (사용자 공정 명세 + 캡처 3장 — 실렌더 검증, 빌드 4/4·typecheck 0):
- 포 뜨기 = 반쪽마다 **독립 경로 3단계**(경계 칼길 꼬리→머리 / 분리1·2 머리→꼬리 — 회차마다 경로 상이) · `flat_gut_scoop` 폐지(**내장은 머리 S컷과 동반 지급** — t_head yields) · 82차 실사 도마 직접 렌더 폐지(실사 = 참고자료, 도마 = 자체 픽셀).
- **칼 팔로우 연출**: 자체 픽셀 야나기바(74×12 · 칼끝 30% 파묻힘 crop = 드래그 접점) — 딜레이(100ms)·제한 속도(240px/s) 추종 + **이동 힌지 벌어짐**(경계→중앙선 — 칼 지나간 구간만 두더지처럼 들림). tuning 4키 + F8.
- 검증: 트리 30스테이지·참조 무결 / score→sep1→sep2 실드래그 완주(깊이 0.18→0.55→1→필렛 팝업) / 머리 팝업 = 머리 216g + **생선 내장** / pageerror 0.
- 상세: `docs/wiki/03-WORKLOG/2026-08-07-084-flat-lift-3stage-knife.md`

**이전 변경 (2026-08-06 83차) — 90° 회전 재설계: 도마 가로 고정·생선만 회전 + 자국 방향 버그 + HUD 겹침 해소** (사용자 리포트 3건 — 실렌더 검증, 빌드 4/4·typecheck 0):
- 80차 "도마 프레임 세로 전환" 폐기 → **board rect(가로 고정) / fish rect(회전 반영) 분리** — 오버레이·플래시·dev 목록 등 앵커 9곳 board 기준, 트레이스·F9 핸들은 `toPanelPx` 경유(직접 매핑이 자국을 가로로 눕히던 버그). `jumpTo`는 방향·회전 모두 스냅(dev 점프 조용한 입력 차단 해소).
- 후속(사용자 승인): 세로 생선은 **도마 밖 허용·창 안 제한** — `PANEL_H` 620→656 + `ROT_SCALE` 0.55(생선 141~449, 상단 작업 패널·하단 상태줄 사이) + 도마 아래 요소 +22px 이동.
- 상세: `docs/wiki/03-WORKLOG/2026-08-06-083-rotation-fish-only.md`

**이전 변경 (2026-08-06 82차) — 광어 포 뜨기 실사 5단계 픽셀화·배선 + 파이프라인 회전/합성** (실사 투명본 5장 = 한 필렛의 연속 공정):
- `fin_score`/`lift_a_up·dn`(합성 파생)/`lift_b`/`lift_done`/`gut_lift` 6키 굽기 + `drawFlatFish` 진행도 기반 선택 + `ROTATE_KEYS`·`ERASE_POLY` 파이프라인 신설. 구 면 기준 키 3개 삭제(상태 기준 명명).
- 상세: `docs/wiki/03-WORKLOG/2026-08-06-082-halibut-photo-stages.md`

**이전 변경 (2026-08-06 81차) — 작업 기록 체계 전환 (docs/wiki 4층 + `work-log` 스킬)**:
- 81차부터 상세 본문은 `docs/wiki/03-WORKLOG/`, 이 절과 PLAN에는 요약+링크만. 시스템 현황은 `02-SYSTEMS/*.md`, 잔여/위험은 `04-BACKLOG.md`.
- 상세: `docs/wiki/03-WORKLOG/2026-08-06-081-wiki-worklog-system.md`

**이전 변경 (2026-08-06 80차) — 도마 90° 회전 축 신설 + 광어 포 뜨기 벌어짐 연출 + 배쪽 단면 실사 + 두족류 스펙 정합(v3.1)·에셋 15키·부리 공정** (사용자 지시 다건 — 실렌더 검증, 빌드 4/4·typecheck 0):
- **[신규 축] 도마 90° 회전** (`BoardRotation` 0/90/180/270) — 좌우·상하 뒤집기와 **독립 축**. 넙치류 지느러미쪽 칼길·포 뜨기는 **꼬리를 아래로 세운 세로 배치**에서 꼬리→머리로 긋는다(사용자 지시 + `docs/mockups/자세한 뷰.pdf` 전 페이지가 세로 뷰).
  - core: `ButcheryStage.rotationRequired` · `process.rotation`/`rotate(±1)`/`rotationOk()` · `canAct()`에 회전 조건 편입 · `jumpTo`는 회전 자동 스냅(dev 항법이 수동 회전 대기로 멈추지 않게) · `ROTATION_LABEL`.
  - client: 사이드바 **2×2 버튼**(뒤집기 2 + 회전 2) · **R / Shift+R** 키 · 회전 시 도마가 **세로 프레임**으로 전환(`fishX/Y/W/H`를 getter화 — 기존 ~50개 사용처 무수정) · 좌표 변환 `rotNorm`/`unrotNorm`(유도선·입력·F9 편집 핸들 공통) · 스프라이트는 **캔버스 변환**(save/rotateCanvas/scaleCanvas)으로 회전해 유도선 매핑과 수학적으로 동일 · 회전 어긋남은 뒤집기 힌트보다 **우선 안내**.
  - ⚠ 세로 배치 레이아웃 실측: `ROT_SCALE 0.50` · `ROT_CY 350` — 도마 프레임 184~516이라 상단 작업 패널(≈180)·하단 dev 상태줄(≈534)과 겹치지 않는다(첫 시도 0.55/중심 295는 작업 패널을 침범해 실렌더로 잡음).
- **[배선] 배쪽·등쪽 11스테이지 `rotationRequired: 90`** + `upScore`/`dnScore` 점 순서를 **꼬리 → 머리로 반전**(화살촉·유도 큐가 실제 손질 방향을 따른다).
- **[연출] 포 뜨기 벌어짐** (사용자 지시 "칼 따라가기와 동시에 하지 말고, 칼이 지나간 뒤 열리게"): 칼질 성공 시 직전 진행값을 `pendingFlatOpen`에 기록 → **액션 연출 완료 시점**에 `startFlatOpenAnim`이 from→to를 `TUNING.butchery.flatOpenMs`(650ms, Sine.easeOut)로 보간. 구조는 **바닥은 고정, 위쪽 덩어리만 중앙선을 힌지로 젖혀 열림**(78차 flapOverlay 기하 유지, 이산 단계 → 연속 보간으로 교체). destroy 정리 + F8 슬라이더.
- **[에셋] 배쪽 벌어진 단면 실사** — 사용자 사진 5장 중 **3번(배쪽·내장쪽 단면)** 투명본을 픽셀화 → `halibut_belly_open`(128×93·투명 20.4%). `drawFlatFish`가 **`gutsExposed`**(배면 위 필렛 떠낸 후 · 내장 제거 전 = 사진과 정확히 같은 상태)에서 이 실사를 렌더. 나머지 4장은 주방 배경이라 `food assets/butchery/reference/`로 보존(파이프라인은 하위 폴더 미스캔). **2번 = 등쪽 위쪽 단면**이므로 투명본 입수 시 `halibut_back_open`으로 동일 배선 예정.
- **[파이프라인 수정 3건 — `pixelize_butchery.cjs`]** (누끼가 오래 사문이었음):
  ① **`processImage`가 `bgTol`을 `pageHtml`에 안 넘겨 `TH`가 `undefined`** → 비교가 NaN이 되어 **배경 제거가 통째로 무력**했다(임계를 46→10→4로 낮춰도 결과가 동일했던 것이 증거).
  ② **배경색 추정을 평균 → 중앙값**으로. 피사체가 프레임 가장자리에 닿으면 평균이 밀려(흰 배경인데 bg≈230) 임계를 좁힐수록 오히려 아무것도 안 지워진다.
  ③ **알파 경로 신설** — 전체 픽셀 중 투명 비율 >3%면 알파로 판정(테두리만 보면 타이트 크롭 누끼본을 놓친다) + 순백 매트 동시 제거. `BG_TOL` 키별 임계 테이블.
  ⚠ 이 수정으로 기존 사진 스프라이트도 1~2px 재계산됨(회귀 없음 확인).
- **[두족류] 스펙 정합 v3.1 + 에셋 + 부리 공정**:
  - **`CEPHALOPOD_BUTCHERY_SPEC.md` §0.5 신설** — v3은 레포 접근이 끊긴 채 작성돼 다수가 실제와 달랐다: **speciesId 4건 전면 치환**(`bigfin_reef_squid`→`squid` / `golden_cuttlefish`→`cuttlefish` / `common_octopus`→`octopus`, 17곳) · **어류 프리미티브는 10종이 아니라 6종**(v3이 "기존"이라 전제한 `lift_flap`·`drag_out`·`vessel_cut`·`fin_cut`은 미존재 → 신설 대상) · 참조 문서 `SASHIMI_GUIDE_OVERLAY_SPEC.md` 부재 · **산란기 필드 없음**(→ `CephalopodProfile.spawningMonths` 신설) · 심볼 대조표(`FishUV`→`CutPoint` 등) · 구조 결정(**스테이지 1개 = 작업 1개**, `result` 스테이지를 섹션 경계로) · 부록 미해결 4건 중 3건 해소.
  - **core 1단계 구현**: 뷰 유니온 2종(`CephOrientation` 6 + `OctopusOrientation` 3) · `FlipKind` · 프리미티브 11종 추가 · `ButcheryStage` 확장(flipBefore/reversible/peelStopBand/peelTool/regionPoly/radialSpace) · `CephalopodProfiles.ts`(프로필 4종 + 대문어 공유 + 부산물 19종) · `CephalopodGuides.ts`(§4.6 좌표 `{x,y}` 이식) · `tuning.ceph` 29키 + F8 슬라이더 10종.
  - ⚠ **`ButcheryStage.orientation` 위드닝**(`ButcheryOrientation`)으로 어류 경로 10곳이 깨졌으나, **어류 렌더는 건드리지 않고** 경계 어댑터 `asFishOri`로 좁혀 해소.
  - **에셋 15키 배선** — `food assets/trimmings/{squid,octopus}/` 15장(한글 파일명 → ASCII 키명 정규화 복사, 테두리 투명 검사 통과). `cephByproductIcon(id, speciesId, opts)`가 상태 분기: 몸통은 `skinOn`(박피 전 = 껍질 붙은 몸통)·갑오징어 전용, 다리는 `tentacleRemoved`(촉완 분리 후 = 촉완 없는 다리부).
  - **부리 공정 추가** (사용자 지시): v3은 문어만 악판을 뽑고 오징어류는 `ceph_head_split` 3분할로 끝나 부리가 산출물에서 빠져 있었다 → **`ceph_beak` 부산물 + `ceph_beak_out` 스테이지**(drag_out · CEPH_PARTS · 다리 밑동에서 뽑기 · `CEPH_BEAK_CENTER`/`PATH`) 신설. 스테이지 수 13→14 / 14→15 / 12→13, `beakRemoval` 4종 전부 `'dedicated'`. **실사 사진에 없는 유일한 추가 스테이지**라 스펙에 "사진 1:1 규칙의 명시적 예외"로 명기(시트에 카드 추가 필요).
  - **촉완/다리는 별개 부산물 유지** — 한치는 전용 분리 스테이지가 있고 값·식감이 다르다.
- **[검증]** 회전: 세로 렌더·유도선이 지느러미 경계에 정착(시작=꼬리 아래/끝=머리 위)·중앙선 세로·**4방향 좌표 왕복 변환 오차 0**·회전 힌트·R 복구 / 벌어짐: 보간 진행·중앙선 개방 스크린샷·완료 정리 / 실사: `gutsExposed` 상태에서 실사 렌더(흰 매트 없음) / 두족류: 텍스처 15/15 로드·아이콘 분기 6케이스 / pageerror 0.
- ⚠ **잔여**: 등쪽(2번 사진) 투명본 대기 · 두족류 전용 에셋 3종(`ceph_skin`·`ceph_gill`·`ceph_inner_skin`) 대기 · 두족류 **트리 구현은 §11.3 2단계부터 미착수**(현재 타입·프로필·가이드·에셋만 완비, `getButcheryFamily`는 여전히 cephalopod 스텁) · FLAT_GUIDE 잔여 좌표(upLift/dnScore/dnLift/gutSweep/엔가와) F9 실측.

**이전 변경 (2026-08-05 79차) — 한치(창꼴뚜기) 어종 4계층 등록 (두족류 손질 선행 작업)** (사용자 지정 순서 2번 착수 — core 시뮬 + 도감 실렌더 검증, 빌드 4/4·typecheck 0):
- **[배경]** 한치는 20차부터 **에셋(`public/fish/swordtip_squid.png`)만 선로드**되고 어종 DB에는 없던 상태 — 두족류 손질(문어·무늬오징어·한치·갑오징어) 착수 전 등록이 선행 조건이었다.
- **[① 오라클]** `swordtip_squid` 신설 — 난류성 연안 두족류(Uroteuthis edulis, 2026-08 리서치: **외투장 35~40cm · 서식 30~170m · 제주/남해 여름 밤 집어등 채낚기 · 공략 수심 20~30m · 수온 18~24℃**). habitat `['open','structure']` · 15~120m · **preferredLayers `['mid','surface']`**(야간 부상) · `baitPreference {lure:95}` · **egiOnly** · 12~40cm(외투장 기준 — 두족류 공통 관례) · wf 0.016(무늬오징어 0.02보다 가늘고 길다) · **nightBonus 1.9**(두족류 최고) · flatTide(0.65) · fight basePower 0.35·lateral 0.6·mouthFragility 0.45(촉수 걸림). 금지체장·금어기 없음(창꼴뚜기는 살오징어 규정 대상 아님).
- **[② 도감]** FISH_DATABASE 엔트리(학명 Uroteuthis edulis · 제철 5~9월 · isNocturnal · sashimiValuePerKg 35,000 — 오징어류 최고가). **오라클↔도감 드리프트 0** 확인.
- **[③ 텍스처]** `FISH_TEXTURE.swordtip_squid = 'fish_swordtip_squid'` 배선(BootScene 로드는 기존) → 도감·어획 팝업·인벤·상세보기가 speciesId 폴백으로 자동 공유. BootScene 주석의 "(FISH_DATABASE 미등록)" 표기 해소.
- **[④ 경락 3곳]** Economy `SEAFOOD_AUCTION_MAPPING`(32,000원/kg · sizeF 1.1 · itemCode는 무늬오징어와 오징어류 코드 공유) / **MAFRA `'한치' → 구 squid에서 swordtip_squid로 정정`** + `'창꼴뚜기'` 추가 / KOSIS **전용 `['한치','창꼴뚜기']` 항목을 `'오징어'`보다 앞에 배치**(선착순 매칭 — 구 `['오징어','한치']` 한 줄이 한치를 무늬오징어로 흘렸음) + `'오징어'` 항목에 swordtip_squid 편입.
- **[⑤ 에기 spawnBinding]** `LURES_CATALOG_DB` 에기 2종(2.5·3.5호)에 `swordtip_squid` 추가 — **egiOnly 어종은 spawnBinding에 없으면 영영 스폰되지 않는다**(필수 배선. 주석으로 명문화).
- **[검증]** core 시뮬 — 야간 표층 12m **한치 83.6%**(집어등 부상 정합) / 중층 25m 44.1%(무늬오징어와 경쟁) / 바닥 60m 12.3%(갑오징어·문어 우세) = **수심층 분리 성립**, 생미끼 채비(필터 없음)에선 두족류 0%(egiOnly 정상) / 판매가 15·22·30·40cm 단조 증가(1,711 → 47,186원) / MAFRA 6케이스 매칭 전 PASS / 도감 **실렌더**(5/5페이지 카드 — 실사 이미지 84×31·학명·제철·kg당 35,000원, pageerror 0).
- **[부수 정정]** 오라클 DB 주석 "49종"이 실제 수(55)와 어긋나 있던 것 → **56종**으로 정정(FISH_DATABASE는 57종 = 오라클 56 + 야간 참돔 `night_seabream`).
- ⚠ **손질은 아직 불가** — `getButcheryFamily`가 egiOnly → `cephalopod` 스텁("두족류 손질은 준비 중")을 반환하는 것이 정상. 손질 트리·전용 렌더·trimmings 에셋이 다음 단계. dev 테스트 지급(`createDevFishDefs`)도 손질 구현 시점에 함께 추가한다(74차 광어 전례).

**이전 변경 (2026-08-05 78차) — 광어 F9 실측 1차 반영 + 배쪽 포 뜨기 3D 렌더 개편 + 작업 패널 2열** (사용자 F9 측정 7종 + 스케치 2장 + 피드백 3건 — core 실판정 완주·실렌더 4단계 검증, 빌드 4/4·typecheck 0):
- **[FLAT_GUIDE 실측 반영]** 시메 tapPoint {0.230,0.400} / 방혈 7점 / 머리 S커브 7점 / **비늘 스윕 면별 분리**(`scaleSweepBase`·`scaleSweepFlip` 각 17점 — 구 공용 scaleSweep 폐기, scale_base/scale_flip 배선) / 꼬리 칼집 {0.732, 0.393→0.574}(등·배 공통) / **중앙선 = 머리 절단면→꼬리 칼집 전장 연장** {0.280,0.500}→{0.732,0.488}(실측 0.288→0.718을 양끝 랜드마크로 — 사용자 지시) / 위 경계 칼길(upScore) 7점. 잔여 근사: upLift/dnScore/dnLift/gutSweep/엔가와(사용자 후속 F9 — 포 뜨기 렌더 확정 후).
- **[포 뜨기 = 3회]** lift 4스테이지(배 위/아래·등 위/아래) strokesRequired 2→**3** + 문구 "(3회 — 점점 깊게)" (사용자 "세 번 정도"). ⚠ 일괄 치환이 원형어 sever·belly 문구 2곳을 오염 — diff로 발견·원복 (flat 스코프만).
- **[drawFlatFish 3D 개편]** (사용자 스케치 — 광어 단면 구조): ① 경계 곡선 = **실측 upScore 7점 보간**(구 파라메트릭 근사 폐기, dnEdge = 중앙선 대칭 미러 — dnScore 실측 시 교체) ② `boneRegion` — 떠진 자리 = 중앙선(척추 라인)에서 경계로 p 비례 확장되는 크림 바탕 + **갈비뼈 부챗살 빗살** ③ `flapOverlay` — 뜬 살 = **중앙선을 힌지로 미러되어 반대편(흰 배)을 덮는 분홍 절단면 플랩**(가장자리 어두운 컷라인 + 살결 2줄, p≥1 = 필렛 회수 → 플랩 소멸) ④ 렌더 순서 = 뼈(양쪽) → 플랩(양쪽 — 반대편 위 덮음) ⑤ **경계 칼길 검정선 렌더 제거**(사용자 지시 — 판정만, 자국 없음) ⑥ 중앙선 자국 = 전장(cyAt 보간 — 실측 기울기), 포 시작 후엔 척추 라인이 대체 ⑦ bodyL 0.28(S컷 절단면)·bodyR 0.732(꼬리 칼집) 실측 정렬.
- **[작업 패널 2열]** `drawTaskPanel` — 작업 **4개 이상 = 2열 그리드**(216px 열 × 행 우선 배치, 왼쪽 확장·헤더 폭 자동): 광어 배쪽 섹션(4작업)이 세로 스택으로 도마 프레임을 11px 침범하던 것 해소(실측 하단 180 ≤ 프레임 176 → 2행 130). 3개 이하 섹션은 기존 1열 유지.
- **[검증]** core 실판정: 실측 반영 전 구간(방혈·S컷·꼬리×2·중앙선·경계 칼길) **가이드 트레이스 cov 1.00** + lift 3회 진행(3→2→1→0) + **35스테이지 완주** + 이탈 트레이스 passed:false(cov 0.34)·정타 1.00 / 실렌더: lift 4단계(중앙선 전장 → 1/3 → 2/3 → 완료+내장) 스크린샷 — 뼈 성장·플랩 덮음·완료 시 소멸 정합 + 작업 패널 2×2. pageerror 0. ⚠ 하네스: `jumpTo`는 방향을 안 바꿈 — `process.orientation` 직접 대입(공개 필드) / `devJumpToTask(secIdx, taskId)` 2인자.
- 잔여(사용자 재진입 예정): upLift/dnScore/dnLift/gutSweep/엔가와 좌표 F9 재실측(새 렌더 기준) · 등쪽(BASE) 포 뜨기도 같은 플랩 구조 공유(어두운 면 위 — 톤 확인) · dnEdge 실측 교체.

**이전 변경 (2026-08-05 77차) — 레포 파일 정리 (루트 잡파일 이동·폐기 삭제·프로젝트 스킬 10종 도입)** (사용자 지시 — 전 파일 참조 조사 후 실행, 생성기 재실행·빌드 4/4·typecheck 0 검증):
- **[스킬 도입]** `.claude/skills/` 10종 신설 (verify-render/asset-pipeline/add-species/ui-panel/save-migration/deploy-ghpages/f9-guide-coords/add-region/add-tuning/scene-transition — 목록은 CLAUDE.md) + **AGENTS §4 중복 정책 3건을 스킬 포인터로 축약**(씬 전환 코드 예시는 73차 SceneFade 이전의 낡은 패턴이라 교체가 정정 효과) + §9 히스토리 상단 "작업 방법은 스킬 먼저" 안내.
- **[삭제 6건]** (전부 git tracked — 히스토리 복구 가능): 폐기 스펙 삽화 `sashimi_guide_fix.svg`·`sashimi_board_dnd.svg`(참조 0) / 1회성 상태 덱 `sashimi_impl_status_deck.html` / 27차 허브로 흡수·폐기된 `chum_guide_popup.html` / 루트 `webglmap_pixelazed.png`(public+pixelazed 사본 존재 — 중복) / `public/webglmap_pixel.png`(미로드 — 주석 언급만).
- **[이동 — git mv]** ① `docs/reference/` = 공공 API 활용가이드(hwp 2·xlsx 2·docx)·경락 CSV·**09.수심.zip**(build_depth_profiles 입력 — ZIP_PATH 갱신) ② `docs/mockups/` = game_guide_hub.html(가이드 삽화 재렌더 소스)·hometown 목업 svg 2 ③ `assets/branding/` = 타이틀/아이콘 원본 PNG ④ `assets/characters/{man,girl}/` = **구 packages/man·girl**(패키지 아님 — 소비본은 public/characters, diff 동일 확인) ⑤ `assets/guide/` = sashimi_pixel_guide.svg(**pixelize_butchery SVG_PATH 갱신** — bream 스테이지 추출 입력).
- **[유지 판정]** `food assets/`(파이프라인 경로 참조 다수 — 이름 변경 금지) / `pixelazed/`(타일맵 입력 + WorldMap zoom 원본) / `tools/` 전체(build_map.py·pixelize.py는 지도 픽셀화 재사용 대비).
- **[검증]** pixelize_butchery 재실행 = 12 스프라이트 동일 / build_depth_profiles 재실행 = 속초 JSON diff 0 / 빌드 4/4·typecheck 0. README ZIP 경로 표기 갱신.

**이전 변경 (2026-08-05 76차) — 팝업 z-order 포커스 시스템 (클릭 = 최상단) + ESC 포커스 정합 + 광어 온마리 신규 에셋 재추출 + dev 광어 지급** (사용자 리포트 "인벤 우클릭 메뉴가 장비창 뒤에 가려짐 — 상호작용 중인 패널이 최상단이어야" — 실마우스 5시나리오 검증, 빌드 4/4·typecheck 0):
- **[근본 원인 — bringSelfToTop 사문]** `DraggablePanel.bringSelfToTop()`의 구 구현 `scene.children.bringToTop()`은 **디스플레이 리스트 순서만** 바꾸는데, Phaser 렌더/입력 정렬은 **depth 값이 우선**이라 정적 depth가 다른 패널(인벤 800 vs 장비 810)끼리는 완전히 무력했다 — "패널 클릭 시 최상단" 기능이 도입(15차) 이후 줄곧 동작한 적 없음. 인벤 우클릭 컨텍스트 메뉴는 패널의 **자식**이라 패널 depth(800)에 갇혀 장비창(810)에 항상 가려졌고, Phaser 입력도 depth 우선이라 **가려진 메뉴 항목 클릭을 장비창이 가로챘다**.
- **[재작성 — depth 기반 동적 최상단 + 밴드]** `bringSelfToTop()` = 같은 밴드 피어들의 max depth + 1로 `setDepth`(dim은 항상 depth−1 동행). **밴드 규칙 신설**: 일반 팝업 [800, 899)(인벤/장비/상점/쿨러/상세보기 — 클릭으로 자유 전환) / 모달 [900~)(손질/회썰기/가이드/다이얼로그) — **일반 팝업은 모달 밴드 침범 금지**(캡 898, 다이얼로그 950이 항상 위 보장), 밴드 포화 시 depth 서열 유지 재정규화. 정적 depth는 "처음 열릴 때 초기 서열"로만 의미.
- **[포커스 캡처 — 씬 레벨 pointerdown]** 자식 인터랙티브 요소(그리드 셀 등)를 누르면 basePlate가 이벤트를 못 받아 최상단이 안 되던 것 → 씬 `pointerdown`에서 "포인터가 패널 rect 안 + **나를 덮는 상위 패널 없음 + 위에 모달(dim) 없음**"이면 raise. 겹침 영역은 최상단 패널만 올라오고, 모달 dim 뒤 클릭은 서열 불변.
- **[ESC = 포커스 정합]** `RegionFieldScene.closeTopPopup` — 구 스택 LIFO(마지막 연 것)에서 **depth 최고(=시각적 최상단) 팝업부터** 닫도록 변경(동률이면 기존 LIFO와 동일). onEscIntercept 위임 유지.
- **[광어 온마리 신규 에셋]** 사용자 교체 `food assets/halibut.png`(8/4 고품질본) → `public/fish/halibut.png` 교체 + `gen_flatfish_sprites.cjs` 재실행(100×51 — **도마 스프라이트는 PixelFishFlat.ts에 구워둔 스냅샷이라 PNG 교체만으론 반영 안 됨**, 재생성 필수. `fish_halibut` 텍스처(어획 팝업·인벤·도감)는 PNG 직접 로드라 자동 반영). 생성기 playwright 경로 하드코딩도 자동 탐색으로 교체(75차와 동일).
- **[dev 광어 지급]** `createDevFishDefs`에 광어(flatfish, 40~80cm·wf 0.013) 추가 — 다섯장뜨기 수동 검증용. 기존 세이브도 재로드 시 주입(minFilletLengthCm 30이라 전 밴드 회뜨기 가능).
- **[검증 — 실마우스 5시나리오]** 초기 800/810 → 인벤 클릭 812(raise) → **셀 우클릭 = 자동 raise + 메뉴가 장비창 위 렌더**(스크린샷 — 사용자 캡처 상황 재현) → 장비 클릭 814(상호 전환) → 모달 다이얼로그(950 dim) 중 뒤 패널 클릭 = raise 차단. pageerror 0. + 광어 온마리 등면/배면 신규 스프라이트 렌더.
- ⚠ 잔여: FP 씬 ESC는 popupStack이 아닌 하드코딩 순서(인벤→쿨러→종료 — 강제 방생 lockedOpen이 얽혀 있어 이번 스코프 제외. 쿨러·인벤 포커스 전환 자체는 공통 적용됨).

**이전 변경 (2026-08-05 75차) — 광어 회썰기·도마 필렛 실사 에셋 마무리 (bream 폴백 해소)** (사용자 지시 "엔가와 + skinned_pillet_without_engawa 2에셋으로 마무리 — skinned 네이밍이지만 순살과 공용(껍질 분리 연출이 돔류·방어류와 동일)" — 실렌더 4스크린샷 검증, 빌드 4/4·typecheck 0):
- **[회썰기 3뷰]** `gen_sashimi_fillet.cjs` FAMILIES에 halibut 추가(`flipX/flipTop: true` — 원본이 머리 왼쪽이라 **머리 오른쪽 규칙**으로 미러) → `public/sashimi/fillet_top_halibut.png`(384×107)·`fillet_side_halibut.png`(384×120)·`piece_halibut.png`(회 조각 아이콘) 생성 + `SashimiFilletProfiles`에 **`SashimiFilletFamily`('bream'|'amberjack'|'halibut') 타입 신설**·PROFILES/TEX 3군 확장. BootScene 3텍스처 로드.
- **[어종군 판정 일원화]** `PixelButcherFish.butcherFamilyOf(speciesId)` 신설 — AMBERJACK/FLAT 셋 기반 'amberjack'|'halibut'|'bream' 판정을 **SashimiPanel**(구 로컬 AMBERJACK_SPECIES 셋 폐기)·**UtilizationPanel.renderSlicedBoard**(구 인라인 셋 폐기)가 공유. 광어 순수 필렛(`inv_fillet_flatfish_*`)을 도마에 올리면 fam 'halibut' → 전용 뷰·조각 아이콘 자동.
- **[도마 실사 슬랩]** `food assets/butchery/pure_fillet_halibut.png`(= skinned_pillet_without_engawa 복사) 투입 → `pixelize_butchery.cjs` 재실행(128×36·44색). **`MIRROR_KEYS` 신설** — 도마 필렛 방향 규칙 = **꼬리 왼쪽·머리 오른쪽**(박피 peel_grip 꼬리 칼집·회썰기 컷 순서와 동일 컨벤션)인데 광어 원본은 머리 왼쪽이라 굽는 시점 행 반전. `drawFlatFish` FLESH_UP 슬랩이 `pure_fillet_halibut` 우선 픽업(구 bream 폴백 해소), `drawPeelTop`도 skin_fillet_halibut 부재 → pure_fillet_halibut 폴백으로 자동 실사화.
- **[도구 이식성]** `gen_sashimi_fillet.cjs`의 playwright 경로가 특정 사용자 계정(`C:/Users/dungy/…`) 하드코딩이던 것 → **로컬 require → `%LOCALAPPDATA%/npm-cache/_npx` 자동 탐색**으로 교체. ⚠ 주석에 `_npx/*/…` 글롭을 쓰면 `*/`가 블록 주석을 조기 종료시킨다(실수 1회 — 라인 주석 사용).
- **[검증 — 실렌더]** ① SashimiPanel 광어 필렛: 일반 = 탑뷰 14컷(fam halibut·texKey top_halibut·머리 오른쪽에서 첫 컷) / 고급 = 측면 슬랩 16컷 ② 도마: 엔가와 분리 단계 = 실사 슬랩 + 엔가와 스트립 / 박피 당김 = **미러 후 꼬리 왼쪽·회색 껍질 바가 꼬리쪽에서 당겨짐**(돔류 지오메트리 정합) — pageerror 0. ⚠ drawPixelButcherFish 시그니처 = `(g, geom, tint, state, sprites)` — 하네스에서 sprites를 3번째로 넣는 실수 주의.
- 잔여: FLAT_GUIDE 좌표 F9 실측(사용자 진행 예정 — 76차) / skin_fillet_halibut 전용 에셋은 pure와 공용 유지(사용자 결정).

**이전 변경 (2026-08-05 74차) — 넙치류(광어·도다리) 다섯장뜨기 손질 구현** (사용자 순서도 + 캡처 8장 — core 정합/FSM 완주/실 스토어·실렌더 완주/재장착 3체인 검증 전 PASS, 빌드 4/4·typecheck 0):
- **[구조]** 다섯장뜨기 = **필렛 4장 + 중골(뼈 프레임) = 5장**. **척추뼈 끊기 작업 없음**(중앙 척추 기준 4면을 각각 뜬다 — 사용자 명시). 구 computeFilletYield "대형 ≥45cm = 5필렛" 분기는 오해였음 — **filletCount 4 고정**으로 정정.
- **[core 스테이지 트리]** `buildFlatStages`(ButcheryProcess — flat이면 최상단 조기 분기, 27스테이지): 시메 → 방혈 → [**머리 S자 절단**(`flat_head_scut` — 내장 주머니를 피하는 S 커브, 캡처 1) / 비늘 2면 — 자유] (**지느러미 제거 없음** — 엔가와로 뜬다) → 꼬리 앞뒤 칼집 → **배쪽(흰 면·FLIP) 먼저**: 중앙선 → 위(내장 위치) 경계 칼길+포 뜨기(×2 strong) → **내장 긁어내기**(개복 없음 — 필렛 뜨면 드러나는 좌상단 주머니, 캡처 1 빨간 영역) → 아래 칼길+포 → **등쪽(BASE)** 동일 5스테이지 → **엔가와 분리 ×4**(FLESH_UP — 지느러미살/살코기 경계) → 박피(peel_grip/insert/pull — **id 공유로 기존 전용 렌더 재사용**). `FLAT_GUIDE` 좌표는 근사 기본값(F9 실측 예정).
- **[core 섹션 트리]** `FLAT_FISH_SECTIONS` + `sectionsForBodyShape(bodyShape)`(export): 7섹션 — 시메·방혈 / 밑손질(자유: S머리·비늘) / 꼬리 / **배쪽 뜨기**[exitAfter] / **등쪽 뜨기**(yields spine)[exitAfter] / **엔가와 분리**(자유 4작업)[exitAfter] / 박피. 신규 yield 3종: `flatFillet`(포 작업마다 껍질+엔가와 필렛 1장 — 총 4) · `engawaSkin`(분리마다 껍질 붙은 엔가와 1) · `flatSkinFillet`(엔가와 섹션 완료 — 기존 flatFillet **대체 지급**, id `inv_filletskin_` = 기존 박피 재장착 체인 그대로 재사용).
- **[게이트]** BUTCHERY_IMPLEMENTED_SPECIES += flatfish/flounder/**frog_flounder/starry_flounder**(프로필 신설 — flounder 복제) → `getButcheryFamily` finfish. NOTICE 문구 갱신("돔류·방어류·넙치류 지원").
- **[도마 스프라이트]** 신규 `tools/gen_flatfish_sprites.cjs` → `data/PixelFishFlat.ts`(자동 생성): 사용자 신규 `public/fish/halibut.png`(선명 픽셀아트·머리 좌·등면)에서 **HALIBUT_DARK**(100×50·44색) 추출 + **HALIBUT_WHITE**(배면 파생 — 실루엣 테두리 2셀 = 갈색 프린지 유지·안쪽 = 원본 명암 3단 크림 리매핑, 캡처 3 정합). 재생성 = `node tools/gen_flatfish_sprites.cjs`.
- **[client 렌더]** `PixelButcherFish` — `ButcherSpriteSet.flat/flatWhite/familyKey 'halibut'` + **`drawFlatFish`**(탑뷰 고정: BASE=등면/FLIP=배면 — **뒤집어도 머리 왼쪽·좌우 미러 없음**): ① 머리 = **S 절단선 erase**(55차 headErasePoly 재사용 — F9로 선 옮기면 잘린 모양 자동 추종, flat은 미러 없이 양면 같은 선) ② `FlatSideState`(면별 독립 — 반대쪽 포는 위에서 안 보임 = 물리 정확): 중앙선/경계 칼길 자국 → **포 뜨기 진행 = 중앙선에서 경계로 벌어지는 분홍 살 → 완료 = 갈비살 결 부챗살 + 척추 라인 노출**(캡처 6~8) ③ 내장 주머니 노출(배면 위 필렛 후·긁기 전) ④ 엔가와 스테이지 = 필렛 슬랩 + 하단 지느러미살 스트립 ⑤ peel_insert는 bream 단면 폴백.
- **[client 배선]** ButcheryPanel — `sections = sectionsForBodyShape(...)` / `buildFlatSideState`(doneStages 파생·진행 중 strokes 반영) / trimFamily·trimHeadKey·trimFilletKey 'halibut' 분기(순수 필렛 아이콘 = 엔가와 제거 필렛 에셋 대용 — 전용 에셋 요청 대상) / 체크포인트: 배·등쪽 뜨기 = 'fillets'·엔가와 = 'ribs' / `removeGrantedFlatFillets`(대체 지급 회수) / **orientLabel**(flat: BASE='등면 (어두운 면 위)'·FLIP='배면 (흰 면 위)' — 원형어 '머리 오른쪽' 라벨 오표기 정정) / showResult: 통짜 = **순수 필렛 ×4 + 순수 엔가와 ×4**(엔가와skin 대체 회수 — 재장착 세션은 회수 제외) · 엔가와 재장착 박피 = **'순수 엔가와'** 산출(subCategory '엔가와'·아이콘 trim_engawa_icon).
- **[재장착 3체인]** UtilizationPanel: `inv_filletengw_` → sec_engawa(형제 3작업 완료 처리 — 1장 세션) / `inv_filletskin_` → sec_peel(기존) / `inv_engwskin_` → sec_peel(**순수 엔가와** 산출). 검증: A 300g engw필렛 → 엔가와 6g + 순수 필렛 264g + 껍질 / B 260g → 229g / C 44g 엔가와 → 39g 순수 엔가와 — 전 PASS.
- **[에셋 등록]** halibut trimmings 9종 public 복사(BootScene 9키): head/spine/**rib(예비)**/fillet_engw_1·2(배·등쪽 아이콘 분리)/fillet_skinonly/engawa_skin/engawa/engawa_icon. ⚠ 소스 오탈자 `rib_bone_hailbut` → 복사 시 정정 · 공백 파일명 `inventory icon` → `engawa_halibut_icon`.
- **[박피 연출 수정 — 전 어종]** (사용자 지시): peel_pull 게이지 완료 시 **선 따라 칼 스윕 연출 제거** — 드래그 중 위아래 톱질 연출이 이미 재생되므로 중복. drag_fill 완료 핸들러에서 `stage.id !== 'peel_pull'` 조건.
- **[검증]** core: 27스테이지·섹션 참조 누락 0·고아 0·yieldsFillet 4곳·가이드 따라 그리기 전 스테이지 통과·FSM 완주·60cm 대형 filletCount 4 / **실 스토어(__INV)+실렌더 완주**: 2.2kg 58cm 광어 → 머리 264g·내장·중골 132g·껍질 + **순수 필렛 (특) 251g ×4 + 순수 엔가와 (특) 39g ×4**, 원물 소모, pageerror 0 + 스크린샷(등면 온마리/S자 머리 절단면/배면 포+내장/등쪽 4장 완료/엔가와) / 재장착 3체인 PASS. ⚠ 하네스 함정: `submitTap`은 **거리(number)** 인자 — 좌표 객체를 넘기면 quality NaN 오염(검증 중 발견 — 코드 정상).
- **[후속 — 엔가와 회썰기 (사용자 지시 2026-08-05)]** ① **광어 순수 필렛 아이콘 = `skinned_pillet_without_engawa_halibut` 확정**(trimFilletKey 'halibut' → trim_fillet_skinonly_halibut — 대용이 아니라 정식) ② **순수 엔가와도 회썰기 대상** — core `ENGAWA_CUTS = 2`/`ENGAWA_PIECES = 3`(**총 2컷 = 스트립 3등분**, 필렛 14/16컷과 다름): UtilizationPanel `isPureEngawa`(subCategory '엔가와' + `inv_engawa_`) — 도마 드래그/드롭/[일반·고급 회뜨기] 버튼/사시미 영역 관련성 전부 필렛과 동일 흐름 편입. SashimiPanel **엔가와 분기**(source로 자동 감지): 뷰 = 항상 탑뷰·텍스처 = **실사 `trim_engawa` 스트립**(512×74 실비율 rect)·평평한 실루엣 콜백(topAt 0.14/botAt 0.86 — 2컷이 u≈0.26/0.74에 배치 = 3등분)·산출 = `inv_sashimi_cut_engw_{species}` **엔가와 회 조각 ×3**(아이콘 = 실사 스트립·가치 3분할 승계·isSashimiPiece → 접시 플레이팅 재료 인정). 검증: 39g 특 엔가와 → 2컷 → 조각 13g ×3 (특·325원)·원물 소모·접시 재료 인정·실렌더(스트립+우측 첫 유도선) 전 PASS.
- ⚠ **잔여(피드백 대기)**: FLAT_GUIDE 좌표 F9 실측 · 회썰기(사시미)는 광어 필렛도 돔류(bream) 필렛 스프라이트 폴백(엔가와는 실사 완료) · 배쪽 상·하 뜨는 순서 고정(anyOrder false — 중앙선 → 위(내장) → 내장 → 아래) · S커브·포뜨기 경계 곡선은 근사 실루엣.

**이전 변경 (2026-08-05 73차) — 외부 QA 버그 수정 2건: 접시 회전 렌더 실버그 + 씬 전환 검은 화면 전수조사** (외부 테스트 URL QA 리포트 — 실렌더/전환 회귀 검증 전 PASS, 빌드 4/4·typecheck 0):
- **[접시 돌리기 "3번째부터 안 돌아감" — 렌더 실버그]** (`UtilizationPanel.drawPlate`): 조각 배치 수식의 sin 부호가 하단 두 방위(좌하/우하)에서 항상 위쪽으로 계산돼 **좌하 조각이 우상 위치에, 우하 조각이 좌상 위치에 겹쳐 그려짐** → 3번째 회전부터 화면이 안 변해 "회전 고장"으로 보임(회전 상태 자체는 정상 진행이었음). **방위별 타원 호 시작각 테이블**(`QUAD_BASE_DEG` 우상 -90→0 / 좌상 180→270 / 좌하 90→180 / 우하 0→90)로 재작성 — 16점 만석 시 접시 전체 링 분포 실렌더 확인.
- **[접시 회전 UX]** (사용자 지시): ① **가득 찬 방위가 있어도 양방향 회전 항상 가능**(원래 차단 없었음 — 렌더 버그가 원인) ② 가득 찬 방위로 돌리면 **토스트 "해당 방위는 가득 찼습니다 — 다른 방위로 돌려 배치하세요"** + **접시 아래 상시 안내 텍스트**(활성 방위 만석 동안 유지, §4 준수 — 우측 컨트롤 열은 [완성] 버튼과 겹쳐 접시 하단 중앙 배치·라벨 단축) ③ 배치는 `placePiece`가 계속 차단 ④ **활성 방위 녹색 호 + '배치 방위' 라벨 삭제**(조각이 놓이는 걸 보면 알 수 있음).
- **[씬 전환 검은 화면 전수조사 — 결함 3종 수정]**:
  ① **`WorldMapScene.isTransitioning` 재진입 미리셋 (재현 확정)** — Phaser 씬은 1회 생성 후 재사용이라 필드 초기값이 재진입에 적용 안 됨. 첫 출조/귀가 후 월드맵 재진입 시 플래그가 true로 남아 **'집으로 돌아가기'·출조 클릭 전부 먹통**(QA "집으로 돌아가기" 리포트와 라벨 정합 — 월드맵 버튼명). `create()` 최상단 리셋. + **`enterFieldArea` 요금 차감 전 전환 가드** — 페이드 중 더블클릭 시 요금 이중 차감되던 버그(연타 3회 → 1회분 10,000만 차감 검증).
  ② **'집으로 가기' 확인 팝업이 일시정지 메뉴 뒤에 렌더** (스크린샷 확정) — ConfirmDialog depth 950 < 메뉴 1000이라 "아무 일도 안 일어나는" 것처럼 보임. `confirmGoHome`이 **메뉴를 먼저 닫고** 팝업 생성 + `setDepth(1200)` 이중 안전.
  ③ **bare `camerafadeoutcomplete` 단독 대기 17곳 일괄 안전망** — fadeIn 진행 중 fadeOut 요청은 Phaser FadeEffect가(forceRestart=false) **조용히 무시**해 완료 이벤트가 영영 안 옴 = 검은 화면/프리즈의 실제 기전(46·52·71차 개별 수정 패턴의 공용화). **신규 `scenes/SceneFade.ts`** — `fadeOutThen(scene, action, fadeMs, rgb)`: 폴백 타이머(fadeMs+150) + 호출 가드 + **씬 단위 WeakSet 가드**(ESC 연타로 pause+launch 이중 실행 방지, action 실행 시 해제). 적용 14파일: AnglerLog/Condo/Cook/Credits/HomeInterior/Restaurant/Settings/Trap/TideChart/NightHunting×2/TackleRoom×2/Fishing/**FirstPersonFishing(낚시 종료)**/Field×4. (MainMenu/RegionField/WorldMap은 자체 안전망 유지.)
- **[검증]** 접시: 4방위 순차 채움 [4,4,4,4]·만석 배치 차단·좌/우 왕복 회전·상시 안내 실렌더 / 전환: 출조 연타 요금 1회분·귀가 hometown 도달·**월드맵 2회차 goHome 정상**(구버그 재현 케이스)·실내 진입 60ms 즉시 ESC·ESC 2연타 전부 복귀 OK·pageerror 0.
- ⚠ 참고: QA가 본 테스트 URL(gh-pages)은 **08-04 01:34 배포(≈69차)** — 70~72차 미포함. 도감 잘림·캐스팅 힌트 등 일부 리포트는 71·72차에서 기수정. **재배포 필요**(로컬 gh-pages worktree는 07-21에 멈춰 있어 origin/gh-pages로 먼저 동기화할 것). → 사용자가 커밋+재배포 완료(2026-08-05).
- **[후속 — trimmings 소스 폴더 어종군 재정리]** (사용자 정리 2026-08-05): `food assets/trimmings/`가 **`bream/`·`amberjack/`·`halibut/` 하위 폴더**로 재구성됨(공용 부위는 각 폴더에 복사본 + 상위에도 잔존). **전 파일 해시 검증**: 어종별·공용 파일 전부 `public/trimmings/`와 SAME — 게임 매핑(BootScene 키) 무영향. `skinned_pillet_with_ribs/without_ribs` 2장의 소스↔public DIFF는 **정상**(public만 누끼 처리본 — 65차 규칙: 소스에서 재복사 금지, 재투입 시 누끼 재적용). 수정 1건: `tools/gen_sashimi_fillet.cjs` 소스 경로를 하위 폴더로 갱신(재생성 검증 — 출력 6장 바이트 동일·프로필 TS 무변경). **넙치류 신규 에셋 12장 사전 검사 완료**: 전부 RGBA·테두리 투명 OK(누끼 불필요 — 엔가와(지느러미살)+아이콘·머리·중골·갈빗대·필렛 4종 등, 다섯장뜨기 대비). ⚠ 파일명 오탈자 주의: `rib_bone_hailbut.png`(hailbut ≠ halibut) — 넙치 손질 구현 시 이 이름 그대로 참조하거나 개명할 것.

**이전 변경 (2026-08-05 72차) — 장비 시스템 개편: 착용품 인벤토리 이탈 + 인체 배치형 장비창(캐릭터 렌더·드래그 장착·우클릭 해제) + 캐스팅 힌트 장비 게이트** (사용자 지시 3건 — 실마우스 실렌더 검증, 빌드 4/4·typecheck 0):
- **[캐스팅 힌트 게이트]** (`RegionFieldScene.tryStartCharge`): 구 코드는 **물가 판정을 먼저** 해서 퀵슬롯이 비고 낚싯대 미착용이어도 아무 데나 클릭하면 "바다 가까이에서 캐스팅하세요"가 떴다(사용자 캡처) → **장비 게이팅 최우선**: ① 손에 낚싯대 미착용 = **안내 없이 무시**(단 퀵슬롯에 낚싯대가 올라와 있으면 = 낚시 의도 → 착용 안내만) ② 착용 + 뭍 = "바다 가까이…" ③ 착용 + 물가 = 차지 시작. 물가 promptText도 착용 기준으로 재작성. **퀵슬롯 선택 요건 폐지** — 캐스팅 = 손 착용 단일 기준.
- **[착용품 = 인벤토리 그리드 이탈]** (`InventoryStore` — `SLOT_EQUIPPED = -1` 신설): 장착 시 소켓 반납(그리드에서 사라짐 — 소켓 확보), 해제 시 **빈 소켓 필요**. 전 착용 API를 **`EquipResult { ok, reason }` 리턴 체계로 전환**(`equipItem`/`unequipItem`/`toggleEquip`/`equipHand`) — 칸 부족 시 `'아이템 창 공간이 부족합니다.'` 사유 반환 + 착용 상태 불변(손 도구 교체는 롤백 안전). 시드(장착 장비 slot=-1)·`freeSlotCount`(slot≥0만 집계)·**세이브 마이그레이션**(deserialize에서 `equipped → SLOT_EQUIPPED` — 구세이브 소켓 자동 반납, 손실 없음)·**상점 판매 목록 착용품 제외**(ShopPanel — 해제 후 판매) 동반. 인벤 '착용' 배지/테두리 제거(그리드 아이템 = 항상 미착용).
- **[장비창 전면 개편]** (`EquipmentPanel` 재작성 — 382×674 인체 배치형, 사용자 도식): **중앙 캐릭터 렌더**(man-idle-front + 발밑 글로우/그림자 + '착용 N부위 · 총가치') / **상단 4칸 머리**(모자·안경·마스크*·넥워머*) / **좌 6칸**(어깨*→상의→팔토시*→장갑→손(좌)→반지*) / **우 6칸**(어깨*→릴→시계→장갑→손(우)→반지*) / **하단 좌·우 세로 3칸 다리**(하의·양말*·신발 — pair 장비는 양쪽 슬롯에 함께 표시). `*` = 예약 슬롯(흐린 실루엣 — 대응 아이템 등장 시 subCategory 매핑만 추가). **우클릭 = 해제** · 호버 툴팁(물리 파라미터 3행 + 조작 안내) · 호출부 (GAME_WIDTH−420, 22)로 이동(하단 696 ≤ 720).
- **[RPG식 드래그 장착]** InventoryPanel이 **그리드 밖 드랍** 시 `inventory-drop(item, pointer, res)` 씬 이벤트 발행 → 장비창이 자기 영역/슬롯 히트 판정(슬롯 밖 패널 여백 = **자동 부위 배정**, 손 도구 = 오른손 우선) 후 `res.handled/message` 회신, 양 패널 상태줄 동시 표기 — 수신자 없으면(1인칭 인벤 등) 조용히 무시되는 느슨한 연결(`InvDropResult`). 인벤 우클릭 메뉴 정리('착용하기'/'오른손·왼손 착용'만 — 해제는 장비창).
- **[검증 — 실마우스]** 시드 rod/reel slot=-1·그리드 비착용만·gearFree 17 / 게이트 5케이스(**빈 퀵슬롯 = 뭍·물가 모두 무반응** 포함) / 장비창 우클릭 해제 → slot 8 복귀 / gear 25칸 만석 해제 → 사유 안내 + 착용 유지(스토어·UI 양 경로) / **인벤 → 손(우) 실드래그 장착** + 양 패널 상태줄 정합. pageerror 0.
- **[하네스 함정 — `__GS` 신설]** 하네스의 `import('/src/store/GameState.ts')`도 **게임 인스턴스와 별개**임을 실측 확정(59차 `__INV`와 동일 함정 — updatePlayer가 게임에 반영 안 됨) → `GameState.ts`에 dev 전용 `globalThis.__GS` 노출. **이후 하네스에서 GameState 조작은 반드시 `__GS` 사용.**
- **[후속 — 하단 다리 블록 레이아웃 조정]** (사용자 캡처 지시): 다리 6칸(하의/양말/신발 × 좌우)을 **중앙 밀착 2열**(표준 GAP 6px — 구 LEG_GAP 40 폐기)로 붙이고, 하단을 **6열 그리드 폭(342px)으로 예약** — `[예약][예약][왼발][오른발][예약][예약]` × 3행, 좌·우 바깥 2열(6칸씩)은 추후 확장 공간으로 **빈 채 유지**(슬롯 미렌더). 상단 머리 행 좌우 모서리 빈 영역도 동일 예약. 실렌더: 다리 열 x=136/194(간격 6) 정합.
- ⚠ 잔여: FieldScene(레거시)은 구 게이트 유지 / `addItem`이 동일 id를 착용 인스턴스에 병합하는 엣지(시드 장비 재구매)는 현 카탈로그에 해당 없음 / 예약 슬롯 6종 + 예약 영역(상단 모서리 2·하단 좌우 12칸)은 아이템 타입 등장 대기.

**이전 변경 (2026-08-05 71차) — 도마 도움말 팝업(드래그·중앙·X) + 도감 전면 정비(페이징·실사 카드·헤더 겹침) + 메인메뉴 씬 전환 안전망** (사용자 지시 2건 — 실렌더 실측 검증, 빌드 4/4·typecheck 0):
- **[도마 도움말 [?]]** (`UtilizationPanel`): ① 버튼을 **도마 바깥 우상단**(`boardX + boardW + 2, top - 14`)으로 이동 — 도마 위 콘텐츠(조각 스테이징·유도선)를 가리지 않게 ② 팝업을 구 "패널 로컬 고정 + 아무 데나 클릭하면 닫힘" → **공통 `DraggablePanel`**(520×268, **화면 중앙** (380,226), depth 900, `applyScreenFixed`)로 교체: **헤더 드래그 이동 · ✕ 닫기 · 같은 버튼 재클릭 = 토글** ③ **ESC LIFO에 편입** — `onEscIntercept()`가 **도움말 → 회썰기 → 손질** 순으로 닫고, destroy에서도 정리.
  **검증(실렌더)**: 중앙 배치·콘텐츠 우측 900/하단 494(화면 안)·scrollFactor 0 / 헤더 드래그 (380,226)→(440,286) 정확 이동 / **ESC 1회 = 도움말만 닫히고 U패널 유지**.
- **[도감(AnglerLogScene) 하단 잘림 — 실버그]** 어종 도감 탭이 **페이징 없이 FISH_DATABASE 전 종을 한 번에 그려**(startY 160·행 170px·4열 = 14행) **y ≈ 2200까지 렌더 → 화면(720) 밖 대부분이 잘려 보이지 않았다**(페이징은 조과 기록 탭 안에만 있었음). 수정:
  ① **`renderPageNav(maxPage, w, h)` 공용 추출** — 두 탭이 공유(구: renderHistory 인라인).
  ② **도감 페이징** — 네비(height−45) 위까지 들어가는 행만 계산(`rowsPerPage` = 3행 → **12종/페이지 · 5페이지**), 슬라이스 렌더. **`switchTab`에서 페이지 리셋**(탭마다 페이지 수가 달라 넘김 상태가 새는 것 방지) + 범위 밖 페이지 클램프.
  ③ **발견 카드 개편** — 이름/학명(전체 폭 clamp) + **어종 실사 픽셀 이미지**(`FISH_TEXTURE` 폴백, 84×66 박스에 종횡비 유지 축소, 없으면 '이미지 없음') + 우측 스탯 4행(최대어·누적·**제철**·kg당 횟값, 폭 상한 clamp). 우상단 **`발견 N / M종` 요약**.
  ④ **조과 기록 탭** — 1페이지 5 → **7행**(210 + 6×60 + 50 = 620 ≤ 네비 675) + 어종명/상세줄 `clampTextWidth`(§4).
  ⑤ **헤더 라벨↔버튼 겹침 수정** — `출조지 필터:`(우측 끝 102) 아래로 첫 버튼이 **x=120 고정**이라 좌측 85에서 겹쳤다 → **라벨 실측 폭 기반 배치**(첫 버튼 좌측 114). 정렬 버튼 3개는 **우측 끝(width−40)에서 역산**하고 라벨을 그 왼쪽으로 밀어냄(라벨 1011 ≤ 버튼 1048).
- **[메인메뉴 씬 전환 안전망]** (`MainMenuScene.fadeOutThen` + `isTransitioning`): 도감/데이터 출처/설정/게임 시작/종료 **5개 전환이 전부 `camerafadeoutcomplete` 단독 대기**였다 — 복귀 직후 fadeIn(220ms) 중에 같은 항목을 다시 고르면 **이벤트 미발화로 검정 화면에서 멈추는** 알려진 경로(46차 RegionFieldScene·52차 WorldMapScene와 동일). **폴백 타이머(fadeMs+150) + 이중 실행 가드 + 복귀 시 잠금 해제**(`onReturnFadeIn`)로 일원화.
  **검증**: fadeIn 중 재진입·같은 프레임 연타 모두 멈춤 없이 정상 복귀(rows 5·`isTransitioning` false·pageerror 0).
- ⚠ **잔여**: 도감은 **메인 메뉴에서만 진입**(인게임 단축키 없음 — `returnScene` 기본값 'FieldScene'은 레거시 폴백). 어종 실사 텍스처가 없는 종은 카드에 '이미지 없음' 표기(에셋 투입 시 자동 반영).

**이전 변경 (2026-08-04 70차) — 방어류 원물 손질 가이드 좌표 어종군 분리 + 방어류 전용 제거 영역 + 타이틀 로고 배치 튜닝** (사용자 F9 실측 6구간 + 캡처 지시 — core 실판정·실렌더 검증, 빌드 4/4·typecheck 0):
- **[가이드 좌표 어종군 분리]** 구 `buildButcheryStages`는 **돔류 실측값을 전 어종에 하드코딩**해, 방추형 방어류에서는 선이 몸통과 안 맞았다. `GUIDE_COORDS: Record<'bream'|'amberjack', GuideCoordSet>` 신설 + `AMBERJACK_GUIDE_SPECIES`(방어/부시리/잿방어)로 분기 — 시메 tapPoint · 방혈 7점 · 머리 앞/뒷면 · 비늘 앞(14점)/뒤(15점) · 지느러미 3선 · 꼬리 앞/뒷면 **9개 좌표 세트**를 어종군별로 보유. **검증: 두 어종군 모두 전 구간 cov 1.00**(돔류 회귀 없음).
- **[방어류 제거 영역 — `FIN_ERASE.amberjack`]** 사용자 실측 지느러미 밑동 선(등 선2 / 배 선3)이 **몸통 윤곽을 그대로 따라가는** 것을 프로파일로 확인(선 바깥 = 지느러미, 선 안쪽 = 몸통) → **선을 그대로 경계로 폴리곤을 닫아** 등지느러미(1·2등지느러미+꼬리쪽 잔가시)·배(뒷)지느러미를 제거. u>0.78을 건드리지 않아 **꼬리지느러미는 보존**.
  ⚠ 돔류는 측정선이 옆구리를 가로질러(윤곽을 안 따라감) 같은 방식을 쓸 수 없다 — 기존 사각 영역 테이블 유지.
- **[머리 확장 제거 — `HEAD_EXTRA_ERASE`]** 신설: 방어류는 머리와 함께 **아가미 뒤 목덜미·가슴지느러미 자리까지** 떨어져 나간다(사용자 캡처 좌측 빨간 점선 = "앞에 제거된 머리보다 더 넓게"). 경계는 실측 가슴지느러미 선(선1)을 따르고, **아래로 갈수록 좁아지게 테이퍼**(수직으로 닫으면 뱃살이 네모나게 잘림 — 1차 렌더에서 발견·수정).
- **[타이틀 로고]** `TITLE_LOGO` 튜닝 블록 신설(`offsetX`/`y`/`width`/`backingScale`/`backingOffsetX·Y`) — 로고를 **왼쪽 90px**로 옮겨 우측 메뉴 패널(x≥844)과 배킹이 겹치던 것 해소(범위 390~890 → 300~800), 배킹 3겹 전체를 **0.85배**(632×285 → 537×242). ⚠ `backingScale` 하한 ≈ **0.83** — 최외곽 폭이 `632×scale`이라 그 아래면 로고(500)가 배킹 밖으로 나간다.
- **[검증]** core: 돔류/방어류 각 30스테이지·9좌표 세트 cov 1.00 / 실렌더: 방어류 4상태(온마리·머리만·지느러미만·둘다) — 머리는 절단선+목덜미 테이퍼 제거, 등·배 지느러미만 제거되고 몸통·꼬리 보존 확인.
- ⚠ **잔여**: 방어류 **단계 스프라이트 실사 4장 미투입**(`food assets/butchery/amberjack_*.png` → `pixelize_butchery.cjs`) — 복면/체강/장뜨기 뷰는 아직 파라메트릭·돔류 공용. 배따기·내장·장뜨기·박피 좌표는 돔류 값 공용(방어류 재실측 필요).

**이전 변경 (2026-08-04 69차) — 사용자 피드백 8건 (뷰/좌표/방향/스테이징/아이콘/에셋/로고)** (실렌더·실 스토어 검증 PASS, 빌드 4/4·typecheck 0):
- **[①③ 순수 필렛 뷰]** 지아이뼈 분리 단계 + 손질 완료(팝업 뒤) 렌더가 구 파라메트릭 FISH_FILLET 폴백이던 것 → `pickStageSprite`가 **실사 `pure_fillet_{fam}`**(pure_pillet 픽셀화) 반환 (`finished || FLESH_UP` 분기 — pin_b는 미러. 박피 단계 전용 렌더는 유지).
- **[② 2면 좌표 실측 반영]** `fillet_1_ribcut` `[{0.819,0.610},{0.640,0.670}]` / `fillet_1_bellyribcut` `[{0.180,0.565},{0.367,0.702}]` (사용자 F9 — opts(strong·tolerance) 보존).
- **[④ 일반 회뜨기 탑뷰 방향]** 꼬리가 오른쪽(첫 컷 자리)에 있던 것 → **꼬리 = 왼쪽, 컷은 오른쪽(머리)부터** — 생성기 `flipTop` 파라미터 분리(탑뷰만 반전, 측면 뷰 불변).
- **[⑤ 도마 조각 스테이징]** 회썰기 완료 → 모달 닫히면 **썰린 조각들이 도마 위에 부채꼴 진열**(`renderSlicedBoard` — 재고 = 인벤 스택과 동기, [치우기]) + 사시미 만들기 영역 자동 확장 → **한 점씩 아래 접시로 드래그**(`onComplete(grantedId)` → `boardSlicedItemId`). 인벤의 회 조각을 도마에 드래그해도 동일 스테이징(접시·조각의 도마 직행 오배치 차단 포함).
- **[⑥ 회 조각 아이콘]** 구 모듬회 사진 → **탑뷰 살코기 한 점 슬라이스**(`sashimi_piece_{fam}` — 생성기가 탑뷰 중앙 스트립 크롭 출력). 인벤 아이콘·도마 진열·드래그 고스트 공용.
- **[⑦ 모듬회 사진 교체]** 사용자 신규 `food assets/assorted_sashimi.png`(1024², 투명 배경 확인) → 256² 고품질 다운스케일 후 `public/food/` 교체 — `food_assorted_sashimi` 키 공유라 상점/접시 아이템 전부 자동 반영.
- **[⑧ 타이틀 로고 가시성]** 어두운 밤하늘에서 짙은 골드 'Pixel Angler'가 묻히는 문제 → 로고 뒤 **밝은 반투명 라운드 배킹 3겹**(α 0.05/0.08/0.12 — 바깥으로 옅어지는 소프트 글로우, 부유 트윈 동기).
- 재생성 절차: `node tools/gen_sashimi_fillet.cjs`(탑/측면/피스 3종 출력) · 모듬회 교체 시 투명 검사+다운스케일 필요.

**이전 변경 (2026-08-04 68차) — 단품 사시미 = 횟집 괴리율 보정식 (실수율 × 인분 마진)** (사용자 실측 가격 지시 "참돔 단품 소 55k·벵에돔 소 70k — kg 시세와 횟집가의 괴리를 수식으로" — 가격 매트릭스 검증 PASS, 빌드 4/4·typecheck 0):
- **[공식]** `판매가 = 원물 kg시세 × 필요 원물량(kg) × 인분 마진` — 필요 원물량 = **완성 회 중량(sashimiG) ÷ 실수율(yieldRate)**. core `SINGLE_SASHIMI_PRICING`(구 `SINGLE_SASHIMI_KG_FACTOR` 폐기) + `singleSashimiPlatePrice(kgPrice, mode, size)`:
  - **일반**: 실수율 0.35 · 회중량 350/550/750/1200g · 인분마진 1.60/1.45/1.35/1.25 (큰 접시 = 단위 마진 소폭 하락)
  - **고급**: 실수율 0.28(야나기바 정교 손질 = 다듬어 버리는 살 많음) · 320/500/700/1000g · 마진 1.85/1.68/1.55/1.45
  - 구 KG_FACTOR(1.0/1.5/2.0/2.5kg)는 사실상 `350g÷0.35` 근사값이었음 — 이제 실수율·마진이 **명시 분리**.
- **[캘리브레이션]** 인게임 kg시세는 소비자 시세대(참돔 37,125/벵에돔 41,700 — 경락 15~20k 아님)라 마진 소 1.6으로 목표 정합: **참돔 단품 소 59,400(실측 목표 55k) · 벵에돔 소 66,720(목표 70k)** · 돌돔(102k/kg) 소 163,200 · 특대 고급 참돔 192,254. **고급 > 일반 프리미엄 전 구간 유지.**
- **[경제 구조]** 조각/필렛 체인 = **원물가 승계(원가 기반)** 유지, 괴리율 마진은 **접시 완성 시점에만 실현**(손질+썰기+플레이팅 노력의 부가가치) — 모듬 고정표(사용자 지정 판매가)는 불변. 실플레이트 검증: 감성돔 단품 (소) 58,000원(판매가 동일 — 0.6 할인 미적용).

**이전 변경 (2026-08-04 67차) — 갈빗대 재장착 세션 필렛 소실 버그 수정 (모프 대체 지급)** (사용자 리포트 "갈빗대 제거 후 순살 필렛이 생성되지 않음" — 실 스토어 4항목 PASS, 빌드 4/4·typecheck 0):
- **[원인 — 확정]** 갈빗대 필렛 **재장착 세션**에서 `morphPendingFilletsToSkinOnly()`가 **grantedLog(이번 세션 지급분)만 순회**하는데, 재장착 세션의 필렛은 지급분이 아니라 **원물(source)** — 모프 대상 0건. 이후 체크포인트 정산(`settleAtCheckpoint`/destroy)이 `removeItem(source)`로 필렛 자체를 소모 → **대체 지급 없이 증발**. (사용자 인벤 = 갈빗대뼈 2칸·필렛 0 — 재장착 세션 2회 흔적과 정합. 통짜 세션은 필렛이 grantedLog에 있어 정상이었음.)
- **[수정 4건]** ① **모프 대체 지급** — 재장착 세션(sec_rib)에서 갈빗대 완료 시 `inv_filletpin_{species}_{seq}` '껍질이 붙어있는 {어종} 필렛'을 **새로 지급**(중량 = 원물 − 갈빗대 몫 · **가치 = 원물 basePrice 승계**, grantedLog 기록) ② **`inv_filletpin_` 재장착 매핑** — 도마에 올리면 **지아이 분리(sec_pin)부터** 재개(`resumeSectionOf`·B면 작업 완료 처리·안내문) ③ **지아이 연속 진행 시 대체 회수** — `removeGrantedRibFillets`가 `inv_filletpin_`도 회수(순살 필렛 2장으로 분할되므로 중복 방지) ④ **재장착 세션 순살 필렛 중량/가치 정상화** — `buildYieldRows` skinFillet이 bypWeights('통짜 생선' % — 880g 필렛 → 97g 반쪽이 되던 결함) 대신 **원물 실중량/가치를 반씩 분할**(863g → 431g×2 · basePrice/2씩). + showResult 최종 회수도 재장착 세션은 **박피된 1장만 회수**(2장 전량 회수 시 반쪽 증발).
- **[검증 — 실 스토어(__INV)]** ① 재장착→갈빗대 완료→이탈: 대체 필렛 863g/12,000원 지급 + 원물 소모 + 갈빗대뼈 ✅ ② 연속 진행(sec_pin): 대체 회수 + 순살 필렛 431g×2 ✅ ③ `inv_filletpin_` → 'sec_pin' 매핑 ✅ ④ **통짜 세션 회귀 없음**(필렛 2장 제자리 모프·대체 중복 없음) ✅.
- ⚠ 사용자의 기소실 필렛은 소급 복구 불가(과거 세션에서 이미 소모) — 재손질 필요. 통짜 세션 모프 아이템이 `inv_filletribs_` id를 유지해 재장착 시 sec_rib를 재진행하는 기존 quirk(갈빗대 중복 획득 가능)는 잔여.

**이전 변경 (2026-08-04 66차) — 사시미 접시 플레이팅 + 가격 체계 개편 + 요리 탭 재배치 + 상세보기 겹침 수정** (사용자 도식 2장 + 가격표 지시 — 실 스토어/실렌더 7항목 PASS, 빌드 4/4·typecheck 0):
- **[상세보기 겹침 수정 — §4 재발]** 긴 이름(중간 필렛)이 배지/소분류/구분선과 겹침(사용자 리포트 "전수조사 했는데 또") — 구 레이아웃이 **제목 1줄 고정 가정**(sub +32/구분선 +52 고정 y)이었다. 제목 wrap 172(배지 열 회피) + **hShift 흐름 배치**(제목 실측 높이만큼 소분류·구분선·이미지·행·신선도·설명 전체 하향) + fullH에 titleExtra 반영. 검증: 제목 2줄·우측 228 ≤ 배지 277·스크린샷 정합.
- **[가격 체계 개편]** (사용자: "350g 필렛을 만원에 사먹을 수 없다"):
  ① **순수 필렛 합가 = 원물 판매가 그대로 분할** — `showResult`가 `InventoryStore.getSellPrice(원물)`을 필렛 수로 나눔(구 kg횟값×수율 폐기. 재장착 1장 세션은 source.basePrice 승계).
  ② **회썰기 산출 = 완성 사시미 → 회 조각(`inv_sashimi_cut_{adv_}...`, 컷 수만큼 스택·조각당 g/가격 승계)** — 완성 가치는 접시에서 발생.
  ③ **모듬 사시미**(2종 이상) = 고정 가격표+g 하한(core `MIXED_SASHIMI_PRICING` — 일반 소35k/350g·중55k/550g·대70k/750g·특대110k/1.2kg / 고급 40k/320g·60k/500g·80k/700g·125k/1.0kg) / **단품**(1종) = **원물 kg 시세 × 계수**(`SINGLE_SASHIMI_KG_FACTOR` — 일반 1.0/1.5/2.0/2.5kg·고급 1.25/1.75/2.25/2.75kg, `evaluateFishSellPrice`로 산정) ④ **완성 접시는 0.6 매입 할인 미적용**(getSellPrice `inv_sashimi_plate_` 분기 — 책정가 그대로 판매 = 노력 가치 보전).
- **[요리 탭 재배치]** 도마 아래 안내 텍스트 블록 삭제 → **[?] 도움말 팝업**(도마 헤더 — 내용 이동+회썰기/플레이팅 안내 추가). 그 자리에 **2버튼 서브 영역**(순수 필렛 도마 위/회 조각 보유/플레이팅 중일 때 표시): **[사시미 만들기(접시 필요)]**(접시 미보유 시 비활성+안내) / **[불을 이용한 요리 만들기(화구·용기 필요)]**(미구현 비활성). 선택 시 **좌측 확대·우측 축소 스트립으로 밀어내는 확장 연출**(240ms tween — 도마/패널 영역 침범 없음).
- **[사시미 접시 플레이팅]** (`renderSashimiArea` — 사용자 도식 4번):
  ① **접시 아이템 4종**(`inv_plate_s/m/l/xl` 식기 — 시드 소1 + 식자재마트 4종 판매) — 임베드 인벤(기타 탭)에서 **드래그 장착**(장착 시 1개 소모·스냅샷 보관) ② **크기별 접시 렌더**(스케일 소0.62~특대1.0 타원+림+링) ③ **4방위**(우상·좌상·좌하·우하) — **화면 우상 = 활성 방위**(초록 호+'배치 방위'), **[접시 돌리기 ↶↷]** 로 방위 전환 ④ **회 조각 드래그 배치**(활성 방위에 1점씩 — 방위당 **소4/중5/대6/특대7점**(`SASHIMI_PLATE_SPECS`), 만석 시 "접시를 돌리세요") ⑤ **[사시미 완성]** = 전 방위 만석 → 2종 이상 = 모듬(g 하한 미달 차단) / 1종 = 단품 — `inv_sashimi_plate_{adv|std}_` 지급(고급 = 전 조각 adv), 접시 소모 ⑥ **[접시 빼기]/패널 destroy = 접시+조각 전부 반환**(아이템 유실 방지 — 61차 안전망 규칙).
- **[검증]** 상세보기 겹침 해소 / 회 조각 14스택·30g/점·가격 승계 / 접시 장착 소모·14점 완성 차단·**모듬 (소) 480g → 35,000원**(판매가 동일) / **단품 감성돔 (중) → 54,375원**(1.5kg 시세) / 만석 방위 차단·회전 / 파괴 시 접시+조각 반환 — 전 PASS + 접힘/확장/배치 실렌더 스크린샷.
- ⚠ 잔여: 불요리 실구현(화구·용기) · 스시('요리하기' 스텁 — 대상 = `inv_sashimi_cut_adv_`/`plate_adv_`) · 조각 배치 상태는 **세션 메모리**(패널 닫으면 반환 — 세이브 미포함) · 사용자 도식의 "도마에서 접시로 직접 드래그"는 현재 **회썰기(모달) 산출 조각을 인벤에서 드래그**로 구현(도마 인라인 썰기 통합은 차기 검토).

**이전 변경 (2026-08-03 65차) — 회썰기(사시미) 미니게임 + 고품질 측면 필렛 스프라이트** (사용자 도식 "14/16컷 배치" + 지시 "원본 퀄리티를 최대한 살린 측면 스프라이트" — 실렌더 6항목 PASS, 빌드 4/4·typecheck 0):
- **[신규 도구] `tools/gen_sashimi_fillet.cjs`** — `food assets/trimmings/pure_pillet_{bream,amberjack}.png`(고해상 2050×496/1824×592)를 **원본 픽셀 그대로 컬럼 샘플링해 측면(z plane) 마운드 실루엣으로 리매핑**(파라메트릭으로 새로 그리지 않음 — 셰브론 힘줄·혈합육 질감 보존). 제어점 코사인 실루엣(꼬리 좌 테이퍼→돔 피크 u≈0.6→머리 우 뭉툭)+윗면 시트지 하이라이트+접지 그림자. 출력: `public/sashimi/fillet_side_{fam}.png`(384×144 RGBA)+`data/SashimiFilletProfiles.ts`(윗면 실루엣 프로필 — 유도선 배치용, 자동 생성·수동 편집 금지). 재생성 = `node tools/gen_sashimi_fillet.cjs`(Playwright+설치 Chrome).
- **[신규 core] `db-schema/SashimiSlicing.ts`** (index.ts export): `SASHIMI_MODES` — **basic '일반 회뜨기' 14컷 세로(틸트 7°)** / **advanced '고급 사시미 뜨기' 16컷 사선(38° 소기즈쿠리, minKnifeTier 'yanagiba')**, tolerance/minCoverage/priceMult(고급 1.5)/namePrefix. + `sashimiSizeTier(weightG)`(**소<200/중<400/대<700/특대** — 밸런스 튜닝값) + `sashimiGradeFromQuality`(특/상/중/하 = 손질과 동일 배율) + **`buildSashimiCutPaths`**(실루엣 topAt 콜백 기반 균등 배치 — 윗점은 tiltDeg만큼 머리쪽(+x) 기움·aspect 보정·고정점 3회 수렴. 좌표는 실루엣에서 자동 산출이라 F9 실측 불필요).
- **[신규 client] `ui/SashimiPanel.ts`** — ButcheryPanel 모델의 형제 패널(DraggablePanel·씬 레벨 포인터·**core `evaluateCut` 재사용**): 측면 필렛 이미지+도마 바, **컷 순서 = 머리쪽(우)→왼쪽**(사시미 정석 — 썰린 조각이 오른쪽으로 눕는 방향), 유도선(현재=노랑 점선+시작 초록 링/끝 붉은 사각/화살촉, 대기=흐림, **완료 자국은 미표시** — 조각 이동으로 잔상이 되므로 분리 자체가 피드백), 성공 시 **칼 섬광+setCrop 조각 분리 팬아웃**(새 조각 +8px·기존 +5px 우측 벌어짐), 실패 = 커버율 토스트+재시도. 완료 = `inv_sashimi_{adv_}?{species}_{seq}`(`{어종} {고급 }사시미 ({크기}·{등급}) {g}g`, subCategory '회(사시미)'·icon food_assorted_sashimi·**막칼 특→상 캡**(손질 동일 규칙)·가격 = sashimiValuePerKg×kg×등급×모드 배율) 지급+필렛 소모+XP. **중단(X/ESC) = 필렛 보존 단순 취소**(체크포인트 복잡도 없음 — 손질과 다른 점).
- **[client 배선] UtilizationPanel** — `isPureFillet`(id `inv_fillet_` 접두 — filletskin/ribs와 겹치지 않음) 도마 드래그·드롭 수용 + 도마 버튼 분기: 순수 필렛이면 [손질 시작] 대신 **[일반 회뜨기](손 장착 회칼 필요 — 막칼 포함) + [고급 사시미 뜨기](야나기바 이상 장착 시만 활성)**. `openSashimi`/`sashimiPanel` 필드(butcheryPanel 병렬)·`onEscIntercept` 회썰기 우선 LIFO·destroy·교체 확인창 편입. + **InventoryPanel 우클릭 '요리하기'**(`inv_sashimi_adv_` 고급 사시미 전용 — 스시 만들기 연계, 현재 준비 중 스텁). 사시미는 '회(사시미)' 서브카테고리라 '사용하기'(섭취) 기본 제공.
- **[검증 — 실 스토어(__INV)+실렌더]** ① 일반: 14컷·5컷 중간 팬아웃 스크린샷·완주 → `감성돔 사시미 (중·특) 352g` 26,400원 지급+필렛 소모 ② 고급: 16컷·사선(윗점 +x 0.106)·방어류 스프라이트 amberjack·완주 → `잿방어 고급 사시미 (특대·특) 780g` 38,610원(`inv_sashimi_adv_`) ③ 실패: 가로 긋기 → cutIdx 0(컷 미진행) ④ 결과 오버레이 렌더(레벨업 표기 `addFilletingXp` 반환 = **객체 {leveledUp, level}** — `Lv.[object Object]` 버그 발견·수정). ⚠ 도마 실마우스 드래그·버튼 실렌더는 실플레이 확인 권장(로직·게이트는 검증됨).
- 잔여(차기): **스시 만들기 실구현**('요리하기' 스텁 해소 — 고급 사시미 소비), 회 접시 플레이팅/판매(경매·레스토랑 납품), 사시미 전용 아이콘(현재 모듬회 공용 — 기존 규칙), 컷별 두께 균일성 판정(현재 커버율·이탈만), 측면 스프라이트 실사 교체 훅(같은 키 PNG 교체로 자동).
- **[후속 2 — 뷰 매핑 정정: 일반 = 탑뷰 / 고급 = 완만한 슬랩 측면 뷰]** (사용자 정정 2026-08-03 "일반 회뜨기는 y plane 정면뷰(위에서 본 뷰), 고급의 측면 뷰는 스케치처럼 높낮이 완만하게"):
  ① **일반 회뜨기(14컷) = 탑뷰** — 원본 `pure_pillet_*`가 이미 탑뷰 사진이라 **리매핑 없이 고품질 박스 다운샘플만**(`fillet_top_{fam}.png`, 원본 비율 유지 — 충실도 최대). 도마 = 필렛 뒤 전체 도마판, 유도선 = 필렛 상·하 윤곽(topEdge/botEdge) 사이 관통.
  ② **고급 회뜨기(16컷) = 측면 뷰** — 구 돔형 마운드 폐기 → **낮고 완만한 슬랩**(384×120, 좌측 완만 상승 → 긴 평탄부 우측으로 살짝 상승 → 우측 뭉툭 낙하 — 사용자 스케치 제어점).
  ③ `SashimiFilletProfiles`가 뷰별 구조(top: topEdge/botEdge/aspect · side: top/baseY)로 개편, **`buildSashimiCutPaths`는 topAt+botAt 콜백으로 일반화**(탑뷰 = 윤곽 관통 / 측면 = 접지 라인). BootScene 4텍스처(`sashimi_fillet_{top,side}_{fam}`), SashimiPanel 뷰별 rect(스프라이트 비율 유지)·도마(탑뷰 = 도마판/측면 = 바) 분기. 재검증 6항목 전 PASS + 양 뷰 실렌더 스크린샷 정합.
- **[후속 — 중간 필렛 에셋 흰 배경 투명화]** (사용자 리포트 "이미지 배경이 투명이었던 것 같은데" — 도마/인벤 아이콘에 흰 박스): trimmings 15종 전수 검사 결과 **`skinned_pillet_with_ribs.png`(껍질+갈빗대 필렛 = trim_fillet_ribs)·`skinned_pillet_without_ribs.png`(trim_fillet_skin) 2장만 흰 배경(rgb254)이 불투명**하게 구워져 있었음(나머지 13종은 정상 투명). **테두리 BFS 누끼**(근백색 연결 배경만 알파 0 — 살 내부 흰 힘줄·갈빗대는 테두리 비연결이라 보존)+경계 밝기 페더링으로 `public/trimmings/` 2장 덮어쓰기. 인게임 렌더 검증: 어두운 패널 위 흰 박스 없이 투명 PASS. ⚠ **원본 `food assets/trimmings/`는 미수정**(사용자 소스 보존) — 재복사 시 흰 배경이 되살아나므로 재투입 시 누끼 재적용 필요. **규칙**: 새 trimmings/에셋 투입 시 **테두리 불투명 검사**(투명 전제 에셋에 배경이 구워져 있는지) 후 등록.

**이전 변경 (2026-08-03 64차) — 브랜딩 적용: exe/윈도우 아이콘 + 메인 메뉴 타이틀 로고** (사용자 지시 — 실렌더 검증, 빌드 4/4·typecheck 0):
- **[타이틀 로고]** 메인 메뉴의 구 텍스트 2단 로고(`PIXEL ANGLER`/`THE REAL`, Press Start 2P)를 **투명 PNG 이미지로 교체** — `Pixel Angler The Real_title_transparent.png`(991×359) → `public/ui/title_logo.png` + BootScene `load.image('title_logo', 'ui/title_logo.png')`(상대경로 — gh-pages 규칙) + `MainMenuScene.drawTitle()`가 `add.image(중앙, 158)` 목표폭 500px 종횡비 유지 + 기존 부유 트윈 유지. ⚠ `Image`에는 `setShadow` 없음(Text 전용) — 넣으면 typecheck 실패. 실렌더: 타이틀 텍스처 991×359 로드·중앙 렌더 확인.
- **[exe/윈도우 아이콘]** `Pixel Angler The Real_icon_rectangle.png`(930×930 정사각)에서 **`tauri icon`으로 전 아이콘 재생성** → `apps/tauri-wrapper/src-tauri/icons/`(32/128/128@2x·`icon.ico`·`icon.icns`·`icon.png` 512·Windows Square*Logo·StoreLogo). `tauri.conf.json` bundle.icon이 이미 참조(무변경). exe·윈도우 타이틀바 아이콘 공용. ⚠ `tauri icon`이 딸려 만든 `android/`·`ios/` 폴더는 PC/Steam 스코프 밖이라 제거. (exe 실제 아이콘은 `tauri build` 시 반영 — Phase 9. Rust 필요라 여기선 아이콘 파일 생성까지.)
- **[파비콘]** 브라우저 탭(웹/gh-pages 테스트)용 `index.html`에 `<link rel="icon" href="ui/app_icon.png">` 추가(`public/ui/app_icon.png` = 아이콘 PNG 복사본). 실렌더: favicon href·doc.title 확인.
- **[아이콘 재생성 절차]** 소스 교체 시: `./apps/tauri-wrapper/node_modules/.bin/tauri icon "<정사각 소스>.png" -o apps/tauri-wrapper/src-tauri/icons` → 생성된 `android/ios` 폴더 제거. (정사각·≥1024 권장 — 930도 동작하나 소폭 업스케일됨.)

**이전 변경 (2026-08-03 63차) — 부산물 = 팝업 확인 즉시 지급 (레저 정산 폐지) + 보관/버리기 2버튼 UI** (사용자 4차 리포트 + 지시 "과정마다 지급하면 고쳐지려나" — 스크린샷의 [버리기] 토글이 결정적 단서, 빌드 4/4·typecheck 0):
- **[UI 함정 확정]** 부산물 팝업의 [보관/버리기]가 **단일 토글(현재 상태 표시)**이라, '보관'이라 떠 있을 때 누르면 **오히려 버리기로 뒤집혔다** — 액션 버튼으로 읽히는 상태 표시. 사용자 스크린샷에 [버리기] 상태로 찍혀 있던 것이 증거(정상 플레이에서 부산물이 계속 사라진 실제 경로로 추정). → **[보관][버리기] 선택형 2버튼**(선택된 쪽만 강조)으로 교체.
- **[구조 개편 — 즉시 지급]** (사용자 제안 채택): "레저 적립 → 정산 시 일괄 지급" 폐지 → **팝업 [확인] 순간 인벤토리에 바로 지급**(`grantRows` + `inventory-changed` emit). 정산(settle/showResult)은 원물 소모 + XP + 오버레이만.
  - **원물 복구 규칙 유지** — `grantedLog`([id, qty])로 이번 세션 지급분을 기록, **체크포인트 전 이탈 시 전량 회수**(`revokeGranted` — 손질 중엔 인벤을 열 수 없어(모달) 회수 시점에 소비됐을 수 없음).
  - **중복 방지 변환**: 갈빗대 완료 = 지급된 `inv_filletribs_*` 아이템을 **제자리 갱신**(morph — 이름/아이콘/무게) / 지아이 분리(skinFillet 지급) = 갈빗대 필렛 **회수 후** 4장 지급 / 최종 완료 = 남은 중간 필렛 회수 후 순수 필렛 지급.
  - dev 항법(`accrueYields`)도 동일하게 즉시 지급.
- **[검증 — 실 스토어]** ① 머리 제거 팝업 [확인] → **즉시** `감성돔 머리 192g` 인벤 확인 ② 그 상태로 체크포인트 전 destroy → **머리 회수 + 원물 보존** ③ 2면 뜨기 → [보관 후 마치기] → 5종 잔존·원물 소모 ④ dev 건너뛰기 경로 5종 지급 유지. 콘솔 진단(`[Butchery] 부산물 지급/회수`)으로 각 시점 로그 확인.

**이전 변경 (2026-08-03 62차) — 부산물 미지급 잔여 원인: dev 항법이 레저를 적립하지 않음 (팝업 스킵 함정 폐지)** (사용자 3차 리포트 — 원물 소모·부산물 0의 유일한 잔여 경로를 재현·수정, 빌드 4/4·typecheck 0):
- **[진단 확정 과정]** ① `import('/src/…ts')`가 `__INV`를 재할당하지 않음(`reassigned:false`) = **게임 그래프도 `.ts` URL** → 61차까지의 지급 검증은 실제 게임 스토어가 맞았다 ② 사용자 스크린샷: **원물(벵에돔)은 소모**됐는데 부산물 0 = 정산은 돌았고 **레저가 비어 있었다** ③ 레저가 비는 유일한 흐름 = **dev [섹션 건너뛰기]/[개별 작업] 점프** — 부산물 팝업을 건너뛰어 적립 자체를 안 했다(55차에 "dev 건너뛰기는 부산물 미지급"으로 문서화된 한계 — 실사용에서 함정이라 폐지).
- **[수정]** `accrueYields()` 신설 — dev 항법이 완료 처리하는 작업/섹션의 yields를 **팝업 없이 [보관] 적립**: `devSkipSection`(현재 섹션 작업+섹션 yields, sec_rib면 morph) / `devJumpToTask`(레저 리셋 후 앞 구간 전체 재적립). + `grantPending`에 **dev 콘솔 진단**(`[Butchery] 부산물 지급: …` — 레저 비면 "(레저 비어있음!)" 표기).
- **[검증 — 사용자 시나리오 그대로]** dev 건너뛰기 ×8(시메→2면 뜨기) → destroy 이탈: 레저 5종 적립(`head/viscera/filletA/filletB/spine`)·checkpoint 'fillets'·**벵에돔 머리 54g·내장·껍질갈빗대 필렛 99g ×2·척추뼈 27g 지급 + 원물 소모** ✅ (구 동작: 레저 0 → 지급 0 = 사용자가 본 증상과 일치).
- ⚠ 55차 잔여 노트 "dev 건너뛰기는 부산물을 지급하지 않음"은 **본 차수로 무효**.

**이전 변경 (2026-07-31 61차) — 부산물 소실 최종 원인: 씬 ESC가 requestClose를 우회 (destroy 직행)** (사용자 재리포트 "여전히 반영 안 됨" — destroy 경로 실검증, 빌드 4/4·typecheck 0):
- **[최종 원인 — 확정]** ButcheryPanel은 ESC를 처리하지 않는다(시트 뷰어만). 씬 ESC → `closeTopPopup` → popupStack 최상단 = **UtilizationPanel**의 close → `UtilizationPanel.destroy()` → **`butcheryPanel.destroy()` 직행**. 60차까지 고친 `requestClose`(X 버튼) 경로가 **통째로 우회**되어 레저가 조용히 소실됐다. 실플레이 ESC = 항상 이 경로 → "부산물이 안 들어옴".
- **[수정 3중]**
  ① **destroy 지급 안전망** — `ButcheryPanel.destroy()`에서 `!done && checkpoint !== 'none'`이면 **열린 팝업의 [보관] 선택분 흡수 → 레저 지급 → 원물 소모 → XP**. requestClose를 거치지 않는 **모든 파괴 경로**(씬 ESC·교체 확인·씬 셧다운)에서 아이템을 잃지 않는다. 체크포인트 전이면 기존 규칙(원물 보존·레저 폐기).
  ② **ESC 인터셉트 (LIFO)** — `UtilizationPanel.onEscIntercept()`: 손질이 열려 있으면 U패널 대신 `butcheryPanel.escClose()`(공개 래퍼 → requestClose)로 **손질부터 닫는다**. `RegionFieldScene.closeTopPopup`이 `top.panel.onEscIntercept?.()`를 먼저 시도(덕타이핑 — 다른 패널 무영향).
  ③ **`absorbByproductPopup()` 공용화** — 팝업 [보관] 흡수+닫기를 confirm/destroy가 공유.
- **[검증 — 실 스토어(__INV)]** 2면 뜨기 팝업이 뜬 상태에서 **`p.destroy()` 직접 호출**(구 씬 ESC와 동일 경로) → `머리 ×1 · 내장 ×1 · 껍질갈빗대 필렛 ×2 · 척추뼈 ×1` 지급 + 원물 소모 ✅. 버튼/requestClose 경로도 60차와 동일 PASS — **세 이탈 경로 전부 지급 확인**.
- ⚠ **주의**: 지급은 세션 메모리 — **저장은 침대에서만**이므로 저장 없이 게임을 재시작하면 사라진다(세이브 정책 §44차, 버그 아님).

**이전 변경 (2026-07-31 60차) — 체크포인트 이탈 시 부산물 지급(ESC 폐기 버그) + 2면 연출 플래시 수정 + 갈빗대 필렛 재장착** (사용자 리포트 3건 — 실판정·실렌더 검증, 빌드 4/4·typecheck 0):
- **[부산물 미지급 — 원인 ②(핵심)]** `checkpoint`가 **`advanceSection`에서야** 설정됐다. 2면 뜨기 완료 팝업이 뜬 시점엔 아직 `'none'`이라, **팝업에서 ESC로 나가면 `requestClose`가 "체크포인트 전 이탈"로 판단해 레저를 통째로 폐기**했다(= "여기까지 하고 나가면 아이템이 하나도 안 보임"). **수정**: ① `exitAfter` 섹션은 **완료 즉시(팝업 전) 체크포인트 확정** ② `requestClose`가 **부산물 팝업이 떠 있으면 [보관] 선택분을 먼저 적립하고 정산**. 검증: 2면 뜨기 팝업에서 ESC → `checkpoint: 'fillets'`·정산 도달·레저 잔여 0 (수정 전 `none`으로 그냥 닫힘).
- **[2면 연출 플래시]** `filletOpenPending`의 벌어짐 단계가 `strokesBefore + 1`이라 **1스트로크 스테이지(ribcut/bellyribcut)에서 1**이 되어, 연출 순간 "살짝만 열린" 그림이 튀었다(사용자 캡처 3/3). **수정**: 연결부 끊기 단계는 **3 고정**, 2면 score/sever는 **완료된 앞 단계까지 누적**해 계산. 배쪽 판정도 `'belly'` 포함으로 보정(구: `'sever'`만 봐서 `bellyribcut`이 dorsal로 새어나감).
- **[갈빗대 필렛 재장착]** 인벤의 **'껍질과 갈빗대가 붙어있는 …필렛'(`inv_filletribs_*`)** 을 도마에 드래그 → **`resumeSectionId: 'sec_rib'`** 로 갈빗대 제거부터 재개(`resumeSectionOf` 헬퍼로 skinFillet=박피/ribFillet=갈빗대 분기). **재장착 = 필렛 1장 세션**이므로 `t_rib_b`·`t_pin_b`를 완료 처리하고 부산물 수량을 축소(rib 2→1, pin 2→1, skinFillet 4→2).
- **[검증 하네스 함정 해소 — `globalThis.__INV`]** dev 하네스가 `import('/src/…')`로 얻는 `InventoryStore`는 **게임 번들이 쓰는 인스턴스와 다르다**(URL이 다르면 별개 모듈 — `panelStore: 'different'` 실측). 이 때문에 인벤 반영 검증이 계속 불가능했다. **`InventoryStore.ts`에서 `import.meta.env.DEV`일 때 `globalThis.__INV`로 실싱글턴을 노출**(프로덕션 미노출) → 이후 검증은 반드시 `__INV`를 쓸 것.
- **[검증 — 실 스토어(`__INV`) 기준]** ① **2면 뜨기 완료 → [보관 후 손질 마치기]**: `머리 192g ×1 · 생선 내장 ×1 · 껍질과 갈빗대가 붙어있는 필렛 352g ×2 · 척추뼈 96g ×1` 지급 + 원물 소모 ✅ (사용자 명세와 일치) ② **같은 지점에서 ESC**: 동일하게 5종 지급·`checkpoint 'fillets'` ✅ ③ **갈빗대 필렛 재장착 세션**: `checkpoint 'ribs'` · 부산물 **갈빗대 ×1** ✅. 전 케이스 `grantFailed 0`·레저 잔여 0.

**이전 변경 (2026-07-31 59차) — 손질 부산물 소실 버그 수정 (섹션 desync 자가복구) + 지급 실패 경고 + 방어류 껍질 필렛 에셋** (사용자 리포트 "손질이 다 끝났는데 부산물은 없고 순수 필렛만 나옴" — 완주 하네스로 원인 재현·수정 검증, 빌드 4/4·typecheck 0):
- **[원인 — 섹션 desync (확정)]** `onStageComplete`가 완료 스테이지의 소속 작업을 **현재 섹션에서만** 찾고, 못 찾으면 `if (!task) return`으로 **조용히 무시**했다. 섹션 전환이 한 번이라도 어긋나면(연출 큐 유실 등) 그 뒤 스테이지 완료가 전부 무시돼 **부산물 팝업·정산이 통째로 사라진다**. 완주 하네스 실측: 수정 전 `sec_rib`에 섹션이 멈춘 채 스테이지만 소진(`sec_rib/pin_a` → `sec_rib/peel_pull` → 스테이지 없음) → **팝업 4종만 발생**(head·viscera·filletA·filletB+spine), rib/pin/skinFillet/skin **전부 미발생**·`showResult` 미도달.
- **[수정 3건]**
  ① **자가 복구** — 완료 스테이지가 현재 섹션에 없으면 **그 스테이지가 속한 섹션으로 `sectionIdx`를 동기화**하고 계속 진행.
  ② **`pendingAfterAction` 덮어쓰기 방지** — 연출 중 완료 처리가 큐에 이미 있으면 **덮어쓰지 않고 체이닝**(앞 완료 처리 유실 방지).
  ③ **`addItem` 무음 실패 노출** — 칸 부족 시 `addItem`이 조용히 false를 반환하므로 `grantFailed`에 모아 **결과 화면에 "⚠ 인벤토리 칸 부족 — N종 미지급"** 표기.
- **[검증]** 수정 후 완주(`done: true`) + **부산물 팝업 7종 전부 발생**(head / viscera / filletA / filletB+spine / **rib×2** / **pin×2+skinFillet×4** / **skin×1**) + `pendingItems` 잔여 0(정산 통과).
  ⚠ **하네스 한계**: 인벤토리 실반영은 확인 불가 — dev 서버에서 `import('/src/…')`로 얻은 `InventoryStore`가 **게임이 쓰는 인스턴스와 다르다**(`.ts` ↔ `.js` URL이 별개 모듈: `same:false` 실측, 17차 함정의 연장). 래핑한 `addItem`이 한 번도 호출되지 않는 것으로 확정. **부산물 지급 자체는 실플레이 확인 필요.**
- **[에셋]** `skinned_pillet_amberjack.png` 반영 — `public/trimmings/` + BootScene **어종군 분리**(`trim_fillet_skinonly_{bream,amberjack}`) + 픽셀화(`skin_fillet_amberjack` 128×38, 박피 도마 뷰). 구 공용 키 폐기.

**이전 변경 (2026-07-31 58차) — 2면 배쪽 구조 등쪽과 대칭화 + 전환 플래시 수정 + 갈빗대/박피 좌표·에셋 반영** (사용자 F9 실측 + 캡처 지시 — core 실판정 + 실렌더 검증, 빌드 4/4·typecheck 0):
- **[전환 플래시 수정]** 등쪽 3단계 완료 직후 **덜 벌어진 그림(spine2)이 순간 노출**되던 문제 — `spineOpen`이 `score`+`score2`만 세어, `ribcut` 완료 후 스테이지가 넘어가는 순간 n=2로 되돌아갔다. **ribcut까지 합산(최대 3)** 해 마지막 상태가 유지되도록 수정.
- **[2면 배쪽 = 등쪽과 대칭 구조]** (사용자 지시): `fillet_1_sever`(**2회**, 실측 `[{0.798,0.657},{0.190,0.647}]`) → **`fillet_1_bellyribcut` 신설**(머리(배)쪽 척추↔갈비뼈 연결부 끊기·strong·yieldsFillet). `t_fb_belly.stageIds` 2개 → 표기 (n/2).
  - **[들림 방향 반전]** 배쪽이 **머리쪽부터** 들리던 것을 **꼬리쪽부터**로 수정 — `makeSpineFillet`에 `liftFrom: 'tail'` 옵션 신설(엔벨로프 t 반전). 배쪽 컷이 꼬리(우)→머리(좌) 방향이므로 정합.
  - **[신규 뷰]** `{fam}_bellyspineribs` — 배쪽 완전 벌어짐 + 머리(좌)쪽 갈비뼈 노출.
  - **⚠ [belly 뷰 판정 버그 수정]** `pickStageSprite`가 belly/dorsal을 **id의 'sever' 포함 여부**로만 갈라서 `fillet_1_bellyribcut`을 등쪽으로 오판 → 방향 불일치 → null → **온마리 측면 폴백**이 떴다. `'belly'` 포함도 belly로 인정하도록 수정.
- **[갈빗대]** `rib_a`/`rib_b` 좌표 실측 반영(각 7점 곡선) + **부산물 2개**(필렛 A/B 각각 — qty 1→2, 무게 절반씩).
- **[껍질 붙은 필렛 에셋]** `food assets/trimmings/skinned_pillet_bream.png` → `public/trimmings/`(BootScene `trim_fillet_skinonly`) = **지아이 분리 산출물 4장의 아이콘** + 픽셀화(`skin_fillet_bream` 128×30) = **박피 단계 도마 이미지**(구 `pure_fillet_*` 대체).
- **[박피 톱질 연출]** `peel_pull`에서 **드래그하는 동안** 칼이 제자리에서 위아래 왕복 — `peelSawPhase`(40ms 타이머, `tracing` 중에만 진행)로 `sin` 구동, 도마 그래픽만 재드로우(doRefresh 아님). 스테이지 이탈·destroy 시 타이머 해제.
- **[검증]** core: 30스테이지·참조 누락 0·고아 0 / 신규·변경 좌표 전 구간 cov 1.00 / **배쪽 순차**(sever ×2 → bellyribcut → rib_a) PASS. 실렌더: 배쪽 1회 후 **꼬리쪽부터 들림** · bellyribcut = 배쪽 갈비뼈 노출 뷰 · 박피 = 껍질 붙은 필렛 이미지.
- ⚠ **잔여**: `peel_pull` 지그재그 좌표 F9 실측 · 칼 실사 에셋(현재 파라메트릭 글리프) · 방어류 `skin_fillet_amberjack`(현재 돔류 에셋 공용).

**이전 변경 (2026-07-31 57차) — 박피 2단계 재설계 + 껍질 붙은 필렛 4장 부산물 + 필렛 재장착(박피부터 재개)** (사용자 캡처 2장 + 지시 — core 실판정 + 실렌더 검증, 빌드 4/4·typecheck 0):
- **[부산물 흐름 재정의]** 지아이뼈 분리(`sec_pin`) = **지아이뼈 2개 + 껍질 붙은 순살 필렛 4장**(1·2면에서 각 2장 — `skinFillet` yield 신설) + **`exitAfter: true`**(4장 들고 종료 가능) / 박피(`sec_peel`) = **필렛 1장** 처리 → **생선 껍질 1장 + 순수 필렛 1개**.
- **[박피 = 2단계]** (구 단일 `peel`(pullsRequired) 폐기):
  - **① `peel_grip`** — 꼬리(**도마 왼쪽**)쪽 살코기에 작은 칼집 = 손잡이 만들기(guided_cut).
  - **② 껍질 분리** = 2스테이지 — **`peel_insert`**(측면 단면 뷰에서 껍질(회색)↔살 경계에 칼 긋기) → **`peel_pull`**(탑뷰에서 **껍질 클릭 후 좌측으로 지그재그 드래그**, `drag_fill` 14점 스윕·fillTarget 0.9 → 완주 약 4~5초). 껍질이 아닌 곳(x>0.42)에서 시작하면 "왼쪽 껍질을 잡고 시작하세요" 안내.
  - 섹션 표기: `t_peel_grip`(1스테이지) / `t_peel_skin`(2스테이지).
- **[뷰 3종]** ① **`pure_fillet_{fam}`** — `food assets/trimmings/pure_pillet_*.png` 픽셀화(파이프라인 투입, 128×30/37·44색) = 박피 섹션 기본 탑뷰 ② **`{fam}_peelcross`**(신규 파라메트릭) — 측면 단면(도마+**회색 껍질층 6px**+살 마운드), 유도선이 껍질 상단 경계(실측 y≈0.812)를 지난다 ③ **탑뷰 동적 렌더 `drawPeelTop`** — 껍질(회색)이 살 **아래**에 깔리고 `peelProgress`만큼 **왼쪽으로 늘어나며 주름 생성**, 살코기는 그 방향으로 조금씩 밀린다(shift). 늘어남은 **도마 안으로 클램프**.
- **[필렛 재장착]** (백로그 ⓑ 해소): `ButcheryCallbacks.resumeSectionId` 신설 — 인벤의 **'껍질이 붙어있는 …순살 필렛'(`inv_filletskin_*`)을 도마에 드래그**하면 `resumeAtSection('sec_peel')`로 **앞 26스테이지를 완료 처리하고 박피부터 시작**. UtilizationPanel: `isSkinFillet` 판별 → 드래그 자격·드롭 수용·안내 문구. 정산은 `resumed` 분기로 **순수 필렛 1개**(무게 = 원본×0.88)만 지급(원물 수율 계산 미적용).
- **[검증]** core: 29스테이지·섹션 참조 누락 0·고아 0 / `peel_grip`→`peel_insert` cov 1.00 순차 통과 / `peel_pull` drag_fill 14점. 실렌더(재장착 경로 그대로): 박피 섹션 시작·앞 26스테이지 완료 / ①꼬리 유도선이 꼬리쪽 껍질-살 경계에 위치 / ②단면 뷰 유도선이 회색 껍질 상단 정확히 통과 / ③진행 0.62에서 껍질이 좌측으로 늘어나고 살 밀림.
- **[후속 — 박피 좌표 실측 + 당기기 연출 재구성 + 상세보기 확대 이미지]** (사용자 지시 2026-07-31):
  ① **좌표 실측 반영** — `peel_grip` `[{0.106,0.350},{0.065,0.562}]` / `peel_insert` `[{0.209,0.779},{0.281,0.783}]`(껍질↔살 경계에 칼끝을 꽂는 짧은 컷).
  ② **꼬리 손잡이 단계는 회색 바 미표시** — 살코기만 그린다(`pulling` 분기).
  ③ **당기기(peel_pull) 연출 = z순서 [도마 → 회색 껍질 바 → 칼 → 살코기]** — 칼은 **세로**(칼끝 위·손잡이 아래) 글리프로 **x축 anchor 고정**, `sin(prog)`로 **y만 위아래** 움직임(캡처 연출 노트). 껍질 바가 **도마 왼쪽으로 이동**(도마 안 클램프·주름), **동시에 살코기도 왼쪽으로 조금씩 밀림**(shift). 칼 길이는 손잡이가 살 아래로 나오되 칼끝은 살 안쪽에 머물게 조정. ⚠ 칼 에셋 이미지 미구현 — 파라메트릭 글리프 플레이스홀더.
  ④ **상세보기 확대 이미지 일반화** — `ItemDetailPanel`이 구 "어획물만" 조건을 버리고 **`iconTexture`가 로드된 모든 아이템**에 대형 이미지를 표시(부산물 `trim_*`·필렛 등). 어획물은 기존 speciesId 폴백 유지. 실측: 머리 86×90 · 껍질필렛 185×90 · 방어 227×80(회귀 없음) · 픽셀아트 없는 통조림 0개(정상).
- ⚠ **잔여**: 박피 지그재그(`peel_pull`) 스윕 좌표는 근사 기본값 — F9 실측 예정. 칼 실사 에셋 교체. 옆면 뷰(y plane)는 연출 이해용이라 미구현(사용자 명시). 칼 연출(살코기 위 칼 레이어)은 기존 액션 애니 재사용.

**이전 변경 (2026-07-31 56차) — 가이드 좌표 실측 반영(6구간) + 2면 뜨기 3단계 재구성 + 신규 뷰 3종(갈비뼈 노출·2면 배쪽·갈빗대 실사) + 박피 오버레이 제거** (사용자 F9 실측본 + 캡처 지시 — core 실판정 + 실렌더 검증, 빌드 4/4·typecheck 0):
- **[좌표 실측 반영]** (사용자 F9 측정본, 55차 원형 틀 고정 프레임 기준): ① `finectomy` 3선 전면 교체(등/뒷/가슴) ② `scale_base` 12점·`scale_flip` 13점 스윕 ③ `gut_open` 컷·`gut_scoop` 스윕(복면 뷰 기준) ④ `fillet_1_score` 1회차. **판정 검증: 가이드를 그대로 따라 그으면 전 구간 cov 1.00 PASS.**
- **[2면 등쪽 = 3단계 재구성]** (사용자 지시 "3단계까지 있어야 함"): 구조는 `fillet_1_score`(1회차) → **`fillet_1_score2`(2회차, 신설)** → `fillet_1_ribcut`(갈비뼈·척추 연결부 끊기)로 재편, `t_fb_back.stageIds` 3개 → 작업 표기 **(n/3)**. 1면(fillet_0)은 불변.
  - **[커버율 부족 원인 — 확정]** 코드 버그 아님. 구 구조는 `fillet_1_score` **strokesRequired 3 = 같은 선을 3번** 요구인데, 1회차 성공 시 스프라이트가 벌어져(spine1→2) 살이 선에서 멀어진다 → 플레이어는 **선이 아니라 벌어진 살을 따라 긋게 되고** 커버율이 떨어졌다. **회차별 실측 경로를 각각의 스테이지로 분리**해 해소(각 1회·독립 좌표). `strong`은 판정에 관여하지 않음(저장만)을 확인. ⚠ 별개로 `jumpTo`는 autoOrient=false에서 방향을 바꾸지 않아 방향 불일치 시 `canAct()` false → cov 0으로 조용히 실패한다(실플레이는 뒤집기로 정렬하므로 정상, 하네스 시뮬 주의).
  - **[스프라이트 누적 진행]** 3스테이지로 쪼개면 스테이지마다 `strokesDone`이 리셋돼 **벌어졌던 살이 다시 닫힌다** → `PixelFishState.spineOpen`(완료 등쪽 스테이지 수) 신설, 패널이 `doneStages`에서 계산해 전달. 실측: 1회차 0 → 2회차 1 → 갈비뼈 끊기 2.
- **[신규 뷰 3종]** (`tools/gen_butchery_views.cjs` — `makeSpineFillet`에 `skin`/`ribs` 옵션 추가):
  - **`{fam}_spineribs`** — 3단계 전용. 완전히 벌어진 상태 + **머리쪽에서 척추뼈와 들린 살을 잇는 갈비뼈 5대** 노출(캡처의 "척추뼈와 갈비뼈 사이 연결된 뼈대" 자리).
  - **`{fam}_bellyspine0~3`** — **2면 전용 배쪽 뷰**(은백 뱃살·머리 좌/꼬리 우). 양쪽 살이 다 붙은 장뜨기 `{fam}_belly` 재활용을 금지(사용자 지시) — `fillet_1_sever`가 이걸 사용.
  - **`fillet_ribs`(실사)** — 갈빗대 제거 단계. `food assets/trimmings/skinned_pillet_with_ribs.png`를 `food assets/butchery/fillet_ribs.png`로 투입해 `tools/pixelize_butchery.cjs` 실행(128×47·44색). 구 파라메트릭 `FISH_FILLET` 폴백은 갈빗대가 안 보였다. rib_b는 좌우 미러.
- **[박피 오버레이 제거]** (사용자 지시): `filletView`의 **회색 껍질층 바(0x4a555c) + 갈색 꼬리 손잡이 블럭(0x3a2c1e)** 삭제 — 실제 필렛 형태와 맞지 않음. 박피 연출은 추후 재설계.
- **[검증]** core: 27스테이지·섹션 참조 누락 0·고아 0 / 전 구간 cov 1.00 / **2면 3단계 순차 진행**(score→score2→ribcut→sever) PASS. 실렌더: 갈빗대=실사 픽셀(갈비뼈·지아이 라인·혈합육 보임) · 3단계=갈비뼈 노출 뷰에 유도선이 머리쪽 세로로 정합 · 배쪽=척추+2면 살 덩어리 · 박피=바/블럭 없음.
- ⚠ **잔여(사용자 예정)**: 갈빗대·3단계(`fillet_1_ribcut`)·2면 배쪽 유도 좌표는 **교체된 이미지 기준으로 F9 재실측 후 전달** 예정(현재 근사 기본값). 박피 추가 작업은 사용자 구상 중.

**이전 변경 (2026-07-31 55차) — 밑손질 자유 순서 유도선 틀어짐 수정 (원형 틀 고정 + 영역 부분 삭제) + dev 항법(섹션 건너뛰기·개별 작업 점프)** (사용자 리포트 "작업 순서에 따라 픽셀 이미지가 달라져 가이드 선이 다 틀어진다" — 실렌더 실측 검증, 빌드 4/4·typecheck 0):
- **[원인 — 수치 확정]** 유도선은 **도마 rect 고정 매핑**(`toPanelPx` = fishX + x·fishW)인데, `drawSprite`가 **스프라이트마다** `min(geom.w/spr.w, geom.h/spr.h)`로 셀 크기를 따로 잡고 각자 중앙정렬했다. 도마(560×210) 기준 실측: **온마리(128×66) 셀3 → 폭 384(x 144~528) / 머리 제거(bream_headless 96×74) 셀2 → 폭 192(절반!) / 지느러미 제거(bream_finless 118×52) 셀4 → 폭 472(2.5배)**. 밑손질은 자유 순서라 어느 작업을 먼저 하느냐에 따라 생선이 확대·축소·이동 → 좌표가 전부 어긋났다.
- **[해법 — 원형 틀 고정 + 부분 삭제]** (사용자 지시): 스프라이트를 갈아끼우지 않고 **항상 온마리를 기준 틀로 그리고, 없어진 부위 영역만 지운다**.
  - `computeFishFrame(ref, geom)` 신설 — **기준 스프라이트(온마리) 1장으로 프레임(cell/ox/oy/dw/dh) 산출**. 4상태(온마리/머리/지느러미/둘다) 실측 **전부 144·384 / 196·198 동일** ✅
  - `drawSprite`에 `{ frame, erase }` 옵션 — 프레임의 셀 크기를 그대로 쓰고(확대·축소 없음), **삭제 영역과 겹치는 런은 쪼개서** 남는 부분만 그린다(`pointInPoly`, 셀 중심 판정).
  - **머리 = 실제 절단선을 따라 삭제** — `headErasePoly`가 head 스테이지 `guidePath`(패널이 프레임 좌표로 환산해 `state.headCutPath`로 전달)를 선분 방향으로 연장해 머리 쪽 전체를 덮는다. **F9로 절단선을 옮기면 잘리는 모양도 자동으로 따라온다.** 좌표 없으면 머리 비율 근사 폴백.
  - **지느러미 = 어종군 영역 테이블**(`FIN_ERASE`) — 등(가시열)/배/뒷 **돌출부만** 제거(FLIP은 x 반전). **가슴지느러미는 몸통 표면에 겹쳐 그려져 있어 지우면 구멍이 나므로 제외.**
  - **적용 범위 = 개복 전 측면 뷰(BASE/FLIP)만** (`useBaseFrame`). 개복 이후(복면/체강/장뜨기 전용 뷰)는 **기존 동작 그대로** — 사용자가 뒷 단계는 수동 점검 예정.
- **[dev 항법 — 좌측 하단]** 앞 단계를 다 해야만 넘어가는 구조라 뒤쪽 확인이 번거롭다는 지적:
  - **[dev: 섹션 건너뛰기]** — 현재 섹션의 전 작업을 완료 처리 후 `advanceSection`(체크포인트 갱신 포함, 부산물 팝업/지급은 건너뜀).
  - **[dev: 개별 작업(확장)]** — **11섹션 × 19작업 전체 목록**을 열어 클릭 점프. **그 앞의 모든 섹션·작업을 완료 처리**하므로 픽셀 이미지·달성도가 그 시점 상태로 나온다(`devJumpToTask` → doneStages/doneTasks 재구성 + `syncDerivedFromDone`(비늘 면수·머리·체크포인트 파생) + `jumpTo` + 방향 스냅).
  - 열 수 **자동 결정**(3→6열, 들어갈 때까지) — 초기 고정 3열이 8~11번 섹션을 조용히 버려서 수정(검증: 누락 섹션 0·작업 0). 좌표 편집(F9)과 자리가 겹쳐 **상호 배타 토글**.
- **[검증 — 실렌더]** ① 4상태 프레임 동일(144/384·196/198) + 머리는 유도선을 따라 절단·지느러미 3부위만 제거(미리보기 렌더) ② **역순 실동작**(비늘치기 100% 완료 → 머리 제거 선택)에서 머리 유도선이 아가미 뒤에 정확히 얹힘(스크린샷) ③ dev 점프(갈빗대 › 필렛 B): 섹션 9/11·stage `rib_b`·앞 스테이지 22개 완료·headOff/gutted/filletA 완료·**목표 작업 자신은 미완료**·checkpoint 'fillets'·scaledSides 2 ④ 기존 측정 좌표(지느러미 3선·비늘 20점 스윕) **전부 프레임 안(oob 0)** — 재측정 없이 유효.
- **[후속 — dev 편집 HUD 겹침 4건 수정]** (사용자 캡처 리포트 "기능·로그가 서로 침범"):
  ① **마더 HUD 확장** — 고정 높이 64(y452~516)라 긴 좌표 로그가 박스 밖으로 흘러 버튼·하단을 침범하던 것을, **dev 항법 버튼 바로 위까지**(y462~584, 높이 122 — 버튼 top 590과 6px 여유) 확장.
  ② **좌표 로그 스크롤** — `getWrappedText`로 워드랩 줄을 뽑아 **보이는 만큼만 슬라이스**(윈도우드 렌더, 마스크 불필요) + **로그와 우측 버튼 사이(x=로그우측+6)에 세로 스크롤바** + 휠(로그 영역 위에서만). 실측: 17줄 중 6줄 표시·max 11·스크롤 시 내용 전환 확인.
  ③ **선 선택기(◀ 선 n/N ▶) 위치** — 구 `by+bh-20`(=496)이 툴 버튼 2행(488~514)과 겹쳤다 → **버튼 2행 아래**(by+78 = 540, 행2 하단 524와 16px 여유).
  ④ **dev 상태 텍스트(flash)** — 구 `fishY+fishH+34`·13px가 도마 바깥 테두리(하단 426)를 물었다 → **+44·11px**(434~454)로 내리고 축소, 도마와 8px·HUD와 8px 여유. devExpand 목록도 그 아래(+58)로 내리고 라벨을 `clampTextWidth` 한 줄 고정(열이 좁아져도 줄바꿈으로 높이가 밀리지 않게).
- ⚠ **잔여**: 비늘 스윕 좌상단 몇 점이 등선 위로 살짝 벗어남(원 측정값 특성 — F9 미세조정 여지) / 개복 이후 뷰(복면·체강·장뜨기)는 여전히 뷰마다 자체 스케일이므로, 그 구간 좌표를 측정할 때는 **해당 뷰 안에서만** 유효(차기 동일 방식 확장 여부는 사용자 점검 후 결정) / dev 건너뛰기는 부산물을 지급하지 않음(정산 흐름 확인엔 정상 플레이 필요).

**이전 변경 (2026-07-31 54차) — UI 전수조사 고순위 4건 수정 (상점 그리드 스크롤·이름 오버플로 2건·결과창 겹침) + 텍스트 상한 공용 헬퍼** (§4 UI 레이아웃 검수 정책 적용 — **Playwright(설치된 Chrome channel) + dev 서버 실렌더 실측 검증**, 빌드 4/4·typecheck 0):
- **[신규] `ui/TextFit.ts`** — §4 정책의 방어 수단을 공용화: **`clampTextWidth(t, maxW)`**(이진 탐색 말줄임 — wordWrap을 쓰면 아래 행과 겹치는 **한 줄 고정 행** 전용 = 정책 3번 "라벨 단축") + **`fitTextHeight(t, maxH, minScale)`**(줄 수가 유동적인 블록이 아래 요소와 겹칠 때만 축소 — 정책 1번의 세로 보완).
- **[ShopPanel] 그리드 스크롤 신설** (구 구조는 **행 수 무제한 + 마스크/스크롤 전무** — 43품목이면 y786까지 그려 패널 596 밖으로 흘렀다. 현 authored 상점은 최대 4행이라 무증상이었으나 **판매 탭은 인벤 25칸(5행)까지 차서 푸터를 침범**): **윈도우드 렌더**(뷰포트 `PANEL_H-124`=472 기준 4행 20칸/페이지, 보이는 행만 생성) + **휠 스크롤**(`containsPointer` 게이트 — 동시에 열리는 인벤토리 휠을 가로채지 않음) + **스크롤바**(행 비례 썸 + 드래그/트랙 클릭 점프) + **`n–m / N행` 표기**(조용한 잘림 금지). 탭 전환 시 `scrollRow=0`, 목록 축소 시 clamp, destroy에서 wheel/pointermove/pointerup 해제.
  - ⚠ **마스크 대신 윈도우드 렌더인 이유**: Phaser는 **마스크로 입력을 클립하지 않아** 스크롤아웃된 셀의 히트가 그대로 남는다(팬텀 히트 → 패널 밖 오클릭). 드래그 팝업 안의 **인터랙티브 목록**은 `UtilizationPanel.mountChooserList`와 동일하게 "보이는 행만 생성"으로 처리한다. (마스크 방식은 `ItemDetailPanel`처럼 **비인터랙티브 본문**에만 — 그 경우 `setScrollFactor(0)` 필수, 33차 교훈.)
  - **실측**: 43품목=9행 → maxScrollRow 5 / 휠 1클릭 → scrollRow 1 / **최하단(scrollRow 5)에서도 셀 하단 401 ≤ 뷰포트 472 ≤ 안내문 상단 478** / 스크롤바 우측 끝 449 ≤ 460 / 위치 표기 y460(초기 y480은 안내문과 5px 겹쳐 뷰포트 안쪽으로 이동 — 실측으로 발견·수정).
- **[EquipmentPanel] 아이템명 오버플로** — 이름·파라미터 열(x=116)이 **wordWrap 없이** [해제] 버튼(x=342)을 침범. **실측: 초장문 낚싯대명 오른쪽 끝 420 = 패널 우측 끝(버튼을 78px 침범) → 클램프 후 330** ✅. 상수화(`NAME_X`/`UNEQUIP_X`/`NAME_MAX_W`=216·빈 슬롯 `EMPTY_MAX_W`=280) + 이름/파라미터/빈슬롯 note 전부 `clampTextWidth`.
- **[LicensePanel] 면허명 오버플로** — ① **목록 행**: 최장 `🔒 통발 조업 심화 면허 (장어·문어)` **실측 202 ≤ 비용 열 230 — 현재는 넘치지 않는 잠재 위험**(폰트 폴백·신규 장문 면허명에서 터짐)이라 `clampTextWidth(212)`로 상한 고정(현 렌더 무변경) ② **상세 뷰**: 제목 `wordWrap(220)` + **상단 블록 흐름 배치**(제목 2줄이면 설명이 밀려나고, 요구사항도 `max(110, 설명 아래)`로 흐름 — 고정 y라 겹치던 구조 해소) + 요구사항/보유 문구 wordWrap·실제 높이만큼 행 증가. **실측 회귀 없음**(제목 1줄 216≤220, 설명 y34, 요구사항 110 유지).
- **[ButcheryPanel] 결과창 desc↔버튼 겹침 (실버그 확정)** — **실측: 구 desc 264→367 vs 버튼 상단 356 = 11px 겹침**. fontSize 12→11·lineSpacing 7→4·`wordWrap(fishW-140=420)`(긴 칼 이름·레벨업 문구의 가로 이탈도 차단) + descTop `fishY+68` + **`fitTextHeight(descMaxH=90)` 안전망**(줄바꿈으로 줄 수가 늘어도 버튼 침범 불가) → **신 258→344, 버튼까지 12px 여유** ✅.
- **[검증 하네스]** `npx -p playwright@1.62.1` + **`channel:'chrome'`(설치된 Chrome 재사용 — Chromium 다운로드 불필요)**, `NODE_PATH`를 npx 캐시 `node_modules`로 지정해 실행. 게임 인스턴스는 `globalThis.__PIXEL_ANGLER_GAME`, 모듈은 **`.ts` URL로 import**(17차 하네스 함정), `DraggablePanel`은 `scene.add.existing()` 필요(7차). ⚠ 측정 시 **origin 보정**(`x + width*(1-originX)`) — origin 0.5 라벨을 그냥 `x+width`로 재면 오버플로로 오판한다(1차 측정에서 실제로 오판).
- ⚠ **잔여(별도 이슈)**: `LicensePanel.renderLicenseList`의 `if (y > 300) return`은 **10번째 면허부터 조용히 누락**(현재 9개라 무증상 — 면허 추가 시 목록 스크롤 필요). 나머지 팝업 저순위 검수(ⓕ)는 계속 진행.

**이전 변경 (2026-07-30 53차) — 회칼 손 장착 버그(구세이브 마이그레이션) 수정** (사용자 리포트 "사시미 칼을 좌/우손 장착하게 구현했는데 지금 안 됨" — dev 신규게임+구세이브 시뮬 검증, 빌드 4/4·typecheck 0):
- **[원인]** `InventoryStore.deserialize`가 저장 아이템을 **verbatim 복원**(정적 속성 미보정)이라, 52차 "회칼 = 손 도구(tool:'knife')" 개편 **이전에 저장된 세이브**의 `knife_sashimi`는 `tool`/`equippable`이 없어 인벤 우클릭에서 **왼손/오른손 착용 메뉴가 안 뜨고**([손질 시작] 게이트 `i.tool==='knife' && i.equipped`도 항상 실패) 기타 아이템으로만 취급됐다. `serialize`는 full spread라 현행 세이브는 tool을 보존 — **레거시 세이브 한정 버그**(신규게임은 정상 확인).
- **[수정]** deserialize에 **시드 정적 속성 백필 마이그레이션** 추가: `createSeedItems()` id→시드 맵을 만들어, 저장 아이템 id가 시드와 같으면 **누락된 `tool`·`equippable`·`placeKey`만 `??`로 복원**(qty/신선도/equipped/slot 등 유저 상태는 불변, 명시적 false도 보존). 회칼(손 도구)뿐 아니라 낚싯대/뜰채·**설치형 아이템(placeKey 배치 게이트)** 레거시 세이브에 안전망.
- **[적용 시점 — 사용자 질문 "기존 세이브에 적용되나?"]** deserialize는 **세이브 로드 시**(GameState.loadFromSlot → applySaveData → InventoryStore.deserialize) 실행 → **기존 세이브도 재로드하면 마이그레이션 적용**. 단 **이미 로드된 라이브 세션은 재로드 필요**(메인메뉴 → 불러오기 or 게임 재시작). 게이팅/스프라이트/에디터/아이콘 등은 코드 레벨이라 세이브 무관하게 즉시 적용.
- **[검증]** 신규게임: 회칼 tool='knife'·equipHand(R)→게이트 PASS / **실제 로드 경로(localStorage 슬롯에 구세이브 심기 — knife tool/equippable + 설치형 placeKey 제거 → loadFromSlot)**: 마이그레이션으로 3필드 전부 복원 → equipHand(R)→게이트 PASS·placeKey='farm_plot' 복원 PASS.
- **[후속 — 회칼 마이그레이션 강화 + 세이브 적용 검증]** 사용자 재리포트("사시미칼 반영 안 됨") — 원인은 **실행 중 세션이 수정 전 코드로 로드된 상태**(마이그레이션은 로드 시점에만 실행 → 하드리프레시 필요). 추가 강화: 시드 id 매칭에 더해 **`isKnifeItem`으로 회칼 3종(막칼/사시미/야나기바, 상점 구매분 포함) tool 강제 복원** + **`placeKey`(설치형)** 백필. **실제 로드 경로 검증**: localStorage 슬롯에 구세이브(회칼 tool/equippable·placeKey 제거) 심고 loadFromSlot → 3필드 복원·장착·게이트 PASS. 부팅 로드(initialize→load→applySaveData→deserialize)도 동일 경로.
- **[후속 — 연출 완료 전 스프라이트 전환 방지]** (사용자 리포트 "3번째 칼집 연출 전 다음 이미지가 잠깐 뜸 / 칼 지나가는데 뒤 픽셀이 빠르게 바뀜"): 원인 = 컷 성공 시 `refresh()`(post-cut 스프라이트)가 `playActionAnim` **앞에** 호출돼 다음 상태가 먼저 그려짐(autoOrient=false라 3번째도 flip 아닌 playActionAnim 경로 — 다음 스테이지 스프라이트를 옛 방향에 렌더). **수정**: 5개 액션 핸들러(tap/wash/drag_fill·scoop/peel/guided_cut)를 **연출 재생 시 pre-refresh 생략 → 연출 완료(playActionAnim onComplete)에서만 `doRefresh`**로 재배치(방향 전환은 flip 연출이 담당하므로 즉시 refresh) + `onStageComplete` 중간 refresh도 `if (!actionAnim)` 가드. **규칙화**: "다음 단계로 넘어가기 전에 연출이 다 끝나야 한다"(사용자 지시). **검증(doRefresh 타이밍 계측)**: submitCut 즉시 감소(3→2)·**연출 중 doRefresh 0회**(pre-cut 유지)·연출 완료(2003ms)에 doRefresh 1회 PASS. ⚠ actionAnimMs=2000(2s)은 초기값 — 체감 조율은 F8 슬라이더.
- **[후속 2 — 작업/섹션 완료 처리도 연출 완료 후로]** (사용자 재리포트 "지느러미 제거 마지막 단계 후 칼 애니 진행 중인데 머리·지느러미 잘린 이미지가 먼저 뜸"): 위 defer는 액션 핸들러의 pre-refresh만 잡았고, **`onStageComplete`의 작업/섹션 완료 경로**(anyOrder → `awaitingSelect=true; refresh()` / 부산물 팝업 / `advanceSection`)는 연출 중 그대로 실행돼 **finless 스프라이트·작업 목록·팝업이 칼질 연출 위에 먼저 떴다**(finectomy는 sec_prep anyOrder 작업이라 완료 시 즉시 awaitingSelect refresh). **수정**: `pendingAfterAction` 큐 신설 — 완료 처리(팝업+전환)를 `runCompletion`으로 묶어, **`actionAnim || flipping` 재생 중이면 큐잉 → playActionAnim/playFlipAnim `onComplete`의 `doRefresh` 뒤에 실행**. 렌더-영향 상태(`awaitingSelect`)는 즉시 확정해 연출 완료 doRefresh가 올바른 상태를 그린다. **검증(finectomy 3선 중 마지막)**: 연출 중 pending=true·**doRefresh 0회**(finless 미표시)·awaitingSelect 상태만 세팅 / 연출 완료(2002ms) doRefresh 실행+큐 소진+작업선택 전환 PASS. **규칙 일반화**: 스프라이트 전환·작업 목록·부산물 팝업 등 **모든 다음-단계 전환은 진행 중인 연출(액션/뒤집기)이 끝난 뒤에만**.
- **[후속 3 — 배쪽 뜨기 개편 + 좌우 전환 플래시]** (사용자 배쪽 상세 피드백 + 두 번째 캡처 그림): ① `fillet_${f}_sever` 좌표 `[{0.796,0.470},{0.189,0.470}]`·**`strokesRequired:2`(배쪽도 2회 분리·벌어짐)**·`yieldsFillet` 제거 ② **`fillet_${f}_ribsever` 신설**(BELLY_UP·strong·yieldsFillet) — 아가미 지느러미 쪽 내장막 감싼 갈비뼈와 척추뼈 사이를 등쪽 방향으로 강하게 썰어 뼈 끊고 윗면 살 떠내 1면 완전 분리. `t_fa_belly`/`t_fb_belly` stageIds에 편입(섹션↔프로세스 정합 검증 PASS·누락 0) ③ **좌우 전환 플래시 수정**: 배쪽 벌어짐 연출(openOverride) 중 `mirrorX`가 **진행 스테이지 id**(자름 직후 다음 필렛으로 advance → fillet_1)를 봐서 좌우 미러가 순간 켜졌다 — `openOverride`에 **`mirrorX`(방금 자른 필렛 기준)** 를 실어 pickStageSprite가 그걸 쓰도록(진행 무관). belly 뷰 판정도 `endsWith('_sever')`→**`includes('sever')`**(ribsever 포함). ribsever는 배쪽이 이미 열린 상태라 벌어짐 3 고정(재닫힘 방지). **검증(core+로직)**: sever 2회·좌표·ribsever strong/yields·섹션 정합·미러=false 전부 PASS. ⚠ 차기: ribsever 전용 "갈비뼈·척추 겹침" 실사 스프라이트 + 뼈 부러뜨리는 연출(현재 belly3 뷰 + strong 컷 재사용), 배쪽/ribsever 좌표 F9 실측 튜닝.
- **[후속 4 — 2면 전용 스프라이트(척추뼈 붙은 2면 덩어리)]** (사용자 지시 "2면은 1면이 이미 분리됐으니 양쪽 살 붙은 이미지를 쓰면 안 됨"): 2면은 [**척추뼈 + 2면 살**] 한 덩어리라 1면과 다른 그림 필요. `tools/gen_butchery_views.cjs`에 **`makeSpineFillet` + `{fam}_spine0~3` 신설** — 척추뼈가 도마 바닥에 깔리고(고정 밴드·마디) 그 위에 2면 살이 얹힌 **측면 단면**, 살-뼈 경계를 칼집으로 갈라 state 0(닫힘)→3(살이 뼈에서 들림)으로 벌어짐. 돔류/방어류 2세트(SPINE_FLESH 프로필). `PixelButcherFish.pickStageSprite`: **fillet_1(2면)이면 `{fam}_spine{n}`(미러 없음) 우선** 반환(등쪽/배쪽 공용 측면 뷰). **프리뷰 검증**: spine0(닫힘·뼈 바닥+살+skin 엣지)→spine2(살 들림·경계 노출) 렌더 확인. ⚠ 차기: 2면 컷 좌표(fillet_1_*)는 현재 1면 루프 공유 — 사용자 F9 실측 후 루프 분리, spine 뷰 실사 교체(pixelize).
- **[후속 5 — spine 뷰 개방 진행 수정(닫힘→3단계)]** (사용자 지시 2026-07-31 "현재 그림은 이미 여러 번 그은 후 단면 — state 0은 껍질 덮인 살이 척추뼈에 붙어 연결돼 있어야"): `makeSpineFillet` 재작성 — ① **살 = 대부분 껍질(skin)** 겉면, 붉은 절단면은 **뼈에서 들린 하단에서만** 노출(구 구현은 전 길이 붉은 밴드) ② **점진·비대칭 들림**: state 1=머리(우)만 조금 · 2=머리~중간 · 3=꼬리(좌)까지 전부 + 뼈-살 사이 그늘 틈. **프리뷰 검증**: spine0(닫힘·껍질 덮인 연결 덩어리)→spine3(완전 들림·붉은 단면+그늘 노출), filled 3827→5091 점증. ⚠ **차기(사용자 백로그 — 확인 후 착수)**: 2면 4단계(3회 척추경계 컷 + ④머리쪽 z-index 갈비뼈 부러뜨려 내장쪽 절단) 스테이지화 + **배쪽 작업 재정의**('배쪽→척추+갈비뼈 끊어 분리' → **'꼬리쪽→배쪽 분리'**, 척추는 등쪽서 이미 끊어 재절단 불필요, 꼬리→아가미 다회 컷) + **정면 배쪽 뷰 신규 파라메트릭**(머리 좌·꼬리 우). ⚠ 설계결정: 1면(fillet_0)도 같은 구조로 갈지 2면만 분리할지 — fillet_0/1 루프 공유라 조건 분기 필요.
- **[좌표 실측 적용]** 사용자 F9 측정본 `fillet_0_score`(등쪽 1·2면 등쪽→척추) 경로를 `[{0.798,0.575},{0.197,0.490}]`로 교체(strokesRequired:3·tolerance:0.09 유지 — F9 [복사] 스니펫은 opts 누락되므로 항상 보존). **다회 칼집 판정은 회차마다 동일 선·동일 tolerance 독립 판정**(회차 escalation 없음) — 2번째 커버율 부족은 코드 버그 아닌 트레이스 일관성(옛 기본선이 생선 형태와 안 맞아 손이 쏠림). F9 편집은 런타임 전용이라 코드 반영엔 core 리빌드 필요.
- **★ 작업 이어받기 (2026-08-06 기준) — 진행 상황 & 다음 착수 지점**:
  - **[완료 상태]** 원물 자유 손질(52~63차 — 돔류·방어류) · **넙치류 다섯장뜨기(74차)** · 회썰기 미니게임 2뷰(65·69차) · 사시미 접시 플레이팅 + 가격 체계(66·68차) · 재장착 체인(67차) · 도감/도움말/메인메뉴 안전망(71차) · 장비 시스템 개편(72차) · 외부 QA 수정(73차) · **한치 어종 등록(79차)** · **도마 90° 회전 축 + 광어 벌어짐 연출 + 배쪽 단면 실사 + 두족류 정합/에셋(80차)**.
  - **[다음 착수 — 2026-08-06 갱신]** (상세 체크리스트는 IMPLEMENTATION_PLAN "🚧 다음 착수")
    **1. 두족류 손질 트리 구현** ← **현재 지점**. 타입·프로필·가이드 좌표·에셋 15키·tuning은 80차에 완비됐고, **트리부터가 미착수**다.
       스펙 `CEPHALOPOD_BUTCHERY_SPEC.md` **§11.3 순서 2단계부터** — 무늬오징어 **14**스테이지(부리 공정 포함) + 섹션 매핑 + `ButcheryProcess` 신규 프리미티브 분기 + `getButcheryFamily` cephalopod 스텁 해제 → 3단계 `SquidLayers` 렌더로 **1종 완주** → 한치 15 / 갑오징어 13 / 문어 11.
       ⚠ 착수 전 **§0.5(코드 정합 v3.1)를 먼저 읽을 것** — v3 본문의 식별자·심볼이 실제 코드와 다르고, §0.5가 우선한다.
    **2. 광어 가이드 잔여** — `FLAT_GUIDE`의 upLift/dnScore/dnLift/gutSweep/엔가와 F9 실측(78차 이후 새 렌더 기준) + **등쪽 단면 실사**(사용자 사진 2번 투명본 입수 시 `halibut_back_open`으로 배쪽과 동일 배선).
    **3. 해루질 관련 작업** (사용자 지정 — 손질 어종 확장 완료 후. NightHuntingScene/NightHuntingEngine 기반 확장).
  - ⚠ **방어류/돔류 손질은 여기서 마감**(사용자 판단 2026-08-05): 기존 단계 스프라이트가 **원래 방어 실사 기반**이라 방어류 잔여 2건(실사 4장 투입·후속 좌표 재실측)은 **그대로 둔다**. 어종별로 실제 다른 것은 **밑손질(체형·크기)뿐**이고 그건 70차에서 어종군 분리로 해결됨. 손보게 된다면 오히려 돔류 쪽.
  - **[전체 로드맵 위치]** 회뜨기 = **Phase 6(게임플레이 심화 — 낚시·손질) 내부 서브시스템** 하나. 이후 대과제: 불요리(화구·용기)·스시(고급 조각 '요리하기' 스텁)·CookScene 실조리·경영(식당 납품/판매)·CraftScene(U)·멀티(Phase 8)·Tauri 패키징(Phase 9). **퀘스트/스토리는 모든 컴포넌트 구현 후 도입**(사용자 방침 2026-08-05).
  - **커밋 상태 (2026-08-06 갱신)**: 73~78차는 main에 커밋 완료(`8654ee7`). **79차(한치 등록)·80차(회전·연출·실사·두족류)는 미커밋** — 사용자가 직접 커밋 예정. gh-pages 배포본은 73차 dist(08-04 21:54)라 **74차 이후 전부 미배포** — 재배포 시 스킬 `deploy-ghpages`.
  - **[사용자 대기 항목]** ① 광어 **2번 사진(등쪽 위쪽 단면) 투명본** — 주면 `halibut_back_open`으로 굽고 등쪽(BASE) 벌어짐에 배선 ② 두족류 전용 에셋 3종 — **오징어 껍질(`ceph_skin`) · 아가미(`ceph_gill`) · 갑오징어 속껍질(`ceph_inner_skin`)** ③ (선택) 머리+다리+내장 덩어리 · 문어 먹물주머니.

**이전 변경 (2026-07-30 52차) — 회뜨기 자유 손질 대개편 (섹션/작업 달성도·수동 뒤집기·손 장착 회칼·부산물 팝업/레저·체크포인트 종료) + 귀가 멈춤 수정 + trimmings 어종군 매핑 + dev 테스트 어획** (사용자 대형 백로그 — 섹션↔스테이지 정합 수치검증 + 부팅 스모크, 빌드 4/4·typecheck 0):
- **[귀가 검정화면 멈춤 수정]** (`WorldMapScene.fadeOutThen` 신규): '집으로 돌아가기'/출조 진입/ESC→메인메뉴/스팟 진입 4곳의 `camerafadeoutcomplete` 단독 대기를 **폴백 타이머(fadeMs+150) + 이중클릭 가드**로 일원화 (46차 RegionFieldScene 헬퍼와 동일 패턴 — fadeIn 중 재fadeOut 시 이벤트 미발화가 원인).
- **[dev 테스트 어획 6종]** (`createDevFishDefs` — InventoryStore): 감성돔/돌돔/벵에돔(largescale_blackfish)/잿방어/방어/부시리 각 1마리, **크기·무게 랜덤**(종별 밴드 + W=k·L³), 활어. `import.meta.env.DEV` 게이트 — 새 게임 시드 + **기존 세이브 로드 시에도 없으면 주입**. 프로덕션 미시드.
- **[trimmings 어종군 매핑]** (사용자 13에셋 확정): `public/trimmings/` 신 에셋 동기화(구 4파일 삭제) + BootScene 13키 — **머리/척추뼈/갈빗대/순수 필렛 = 돔류(bream)·방어류(amberjack) 분리**(`trim_head_bream/amberjack` 등) / **껍질·내장·지아이뼈 = 공통**(trim_skin/guts/pin) / **중간 필렛 2종 공통**(trim_fillet_ribs=skinned_pillet_with_ribs·trim_fillet_skin=without). `trimFamily(speciesId)` 헬퍼. **명명 규칙**: 어종군 부위 = 어종명 접두("잿방어 머리 720g") / 공통 = "생선 내장" 등 **제네릭 + 공유 id(어종 무관 스택)** / 중간 필렛 = "껍질과 갈빗대가 붙어있는 잿방어 필렛"(공통 에셋 + 어종명). 방어류 머리/필렛은 실색(틴트 무), 돔류는 기존 색 변형 유지.
- **[자유 손질 대개편 — core]** ① `db-schema/ButcherySections.ts` 신규: **섹션 11개 순서 강제 + 섹션 내 작업(anyOrder) 자유 선택** — 시메·방혈 → 밑손질(머리/지느러미/비늘 자유) → 배따기·내장 → 핏줄 → 세척 → 꼬리(앞/뒤) → 1면 뜨기(등/배 자유) → 2면 뜨기(+척추) **[exitAfter]** → 갈빗대 **[exitAfter]** → 지아이 → 박피. yields(head/viscera/filletA·B/spine/rib/pin/skin/pureFillet) 선언 ② FSM 스테이지 24개로 확장: `vessel_scrub`(핏줄 스쿱)·`tail_grip_b`(꼬리 뒷면)·`rib_a/b`(갈빗대 대각 도려내기)·`pin_a/b`(지아이 세로 ×2) 신설, gut_scoop=내장만·fillet 라벨 등/배쪽 의미로 재정의 ③ `ButcheryProcess.jumpTo(stageId)`(자유 항법 — FLESH_UP만 뷰 스냅 예외)/`stageList`/`forceFinish` ④ **TUNING.butchery.autoOrient=false**(자동 뒤집기 폐지) ⑤ LIVE_STAGE_GUIDE 신규 스테이지 바인딩(vessel→pre8·rib→p18~23·pin→p25/26/29/30). **정합 검증: 섹션 참조 스테이지 누락 0 · 고아 스테이지 0**.
- **[자유 손질 대개편 — client ButcheryPanel]** ① **작업 선택 목록**(도마 우측 상단) — 섹션명 + 작업 버튼, anyOrder 섹션은 클릭 선택(awaitingSelect 동안 손질 입력 차단+안내), 완료 작업 = **'완료됨 (정확도 N%)' 도장** ② **수동 뒤집기 2버튼** — [좌우 뒤집기(F/Space)]=BASE↔FLIP·BELLY↔BACK / [상하 뒤집기(V)]=BASE↔BELLY·FLIP↔BACK (구 5방향 버튼·원터치 정렬·1~5키 폐지. FLESH_UP 필렛 뷰는 뒤집기 비활성) ③ **부산물 팝업** — 섹션 완료 시 모달([보관]/[버리기] 토글·Enter 확인·exitAfter 섹션은 [보관 후 손질 마치기]) ④ **보관 레저(pendingItems)** — 팝업 보관분은 즉시 지급하지 않고 **정산 시점**(체크포인트 종료/최종 완료)에 실지급 → **체크포인트 전 이탈(X/ESC) = 레저 폐기 + 원물 복구**(중간 상태 에셋 없음 규칙), fillets/ribs 체크포인트 후 이탈 = 그 시점 정산(requestClose 가로채기) ⑤ 갈빗대 완료 시 레저 필렛 morph(ribs→skin-only 에셋/명칭) ⑥ 최종 완료 = 레저 지급 + 순수 필렛(수율 계산) — showResult의 구 부산물 직접 지급 제거 ⑦ 가이드 컷 팝업 좌상단 이동(작업 목록 자리 양보) + awaitingSelect 중 가이드/큐 숨김(**가이드-생선 진행도 불일치 수정**).
- **[손 장착 회칼 게이트]** `HandTool`에 'knife' 추가 — 회칼 3종(시드+상점) equippable+tool:'knife'(인벤 우클릭 → 왼손/오른손 착용). **UtilizationPanel [손질 시작] = 손 장착 회칼 필수**(미장착 토스트), ButcheryPanel 수율·등급 칼 판정도 손 장착 기준.
- **[후속 1 — 손질 단계 실사/도트 스프라이트 시스템 (사용자 실사 4장 + "돔류도 동일 구조" 지시)]** ① **`tools/pixelize_butchery.cjs` 파이프라인 신규** — 실사 사진(`food assets/butchery/*.png`, 파일명=키) → 누끼(테두리 BFS 배경 제거) → 폭128 그리드 박스평균 다운샘플 → 미디언컷 44색 → `data/PixelFishStages.ts` 자동 생성. 잿방어 실사로 end-to-end 검증(128×46·44색). **방어류 사진 4장은 채팅 첨부라 파일 미확보** — `food assets/butchery/amberjack_vessel.png / amberjack_fillet1~3.png`로 저장 후 `node tools/pixelize_butchery.cjs` 실행하면 자동 편입(사진이 같은 키의 SVG 추출분보다 우선) ② **돔류는 가이드 시트 SVG에서 자동 추출**(세장뜨기 구조 공유) — `bream_vessel`(선-8 핏줄 뷰)/`bream_fillet1~3`(본편 3·5·7 길내기→벌어짐→3층 분리), 키별 지우기 영역(SVG_ERASE)으로 칼날 잔재 제거, 시각검증 PASS ③ **PixelButcherFish 단계 스프라이트 선택**(`pickStageSprite` — 어종군 제네릭): BELLY_UP 핏줄/세척 = `{fam}_vessel` / BACK_DOWN 장뜨기 = strokesDone 연동 `{fam}_fillet1~3`(2면은 좌우 미러), 레지스트리 미보유 시 **폴백 오버레이**(혈관 라인·절개선 깊어짐 — 방어류 사진 대기 상태 커버) ④ ButcheryPanel이 strokesDone 전달.
- **[후속 2 — ESC 메뉴 '집으로 가기' (사용자 지시)]** 출조지(비홈타운) 일시정지 메뉴의 '전국 지도' → **'집으로 가기'**: ConfirmDialog "정말로 집으로 돌아가시겠습니까?" → '예' = 홈타운 이동(fadeOutThen 안전망·귀가 무료) / '아니오' = 닫기. 홈타운 자체는 항목 없음.
- **[후속 3 — dev 가이드선 곡선 편집 (사용자 재지적 "직선밖에 안 되냐")]** 구 편집기는 끝점 2개 드래그 = 직선만 가능했다. **곡선 편집 3수단 추가** (`ButcheryPanel` — dev F9):
  - **[곡선 그리기] 토글** — ON이면 도마 위 드래그가 자유곡선 캡처(원시 궤적 0.006 간격 누적 → 실시간 시안 미리보기) → 놓으면 **Chaikin 스무딩 ×2 + 호길이 균등 리샘플(editCurveN 7점)** 후 경로 교체. 너무 짧은 드래그(<0.08)는 오조작으로 무시.
  - **[+ 점]** — 각 세그먼트 중점 삽입(2→3→5→9…, 상한 15). 직선을 세분화한 뒤 중간 핸들을 끌어 곡선화.
  - **[스무딩]** — Chaikin 1회 + 같은 점 수 리샘플(모서리 완화, 형태 유지). **핸들 우클릭 = 점 삭제**(최소 2점 유지).
  - `resampleNorm`/`smoothNorm`/`replaceEditPath`(**splice 제자리 교체** — guidePath·sweepOverride는 가변 참조라 배열 교체 시 렌더/판정이 옛 배열을 봄) 헬퍼. 편집 박스를 **도마 아래**(fishY+fishH+52)로 이동 — 도마 위는 가이드 컷 팝업·작업 선택 목록 자리라 겹침 방지, editMode 중 가이드 팝업 숨김. 핸들은 곡선 모드에서 60% 축소·반투명(참고용), 중간점은 식별 링 표기.
  - **검증(core 실판정)**: 아치형 곡선 7점 리샘플(끝점 보존·직선 대비 최대 이탈 0.140) → `evaluateCut` **곡선 따라감 cov 1.00·quality 1.00 통과** / **곡선 가이드에 직선으로 그음 cov 0.44 실패** — 곡선이 렌더뿐 아니라 판정까지 실제 반영됨을 확인. 렌더(strokeGuideLine)·판정(resamplePath/distToPath)은 원래부터 다점 폴리라인 지원이라 데이터만 곡선이면 그대로 동작.
- **[후속 4 — 자유 손질 실플레이 버그 4건 (사용자 캡처 리포트)]**
  - **① 좌상단 가이드 컷 팝업/캡션 폐지** — 47컷 시트는 1~38 순차 나열이라 자유 손질 섹션/작업 진행과 매칭되지 않아 오히려 혼란(사용자 지적). `drawGuideCutPopup`·캡션·`currentGuideCutKey` 제거, **[가이드 시트(47컷)] 수동 열람 버튼만 잔존**(popupTween/lastPopupKey 정리).
  - **② 작업 선택 전 유도선이 먼저 뜨던 문제** — `drawGuide`에 **awaitingSelect·부산물 팝업 가드** 추가(구 가드는 currentGuideCutKey/startGuideAnim에만 있어 유도선 본체는 그대로 그려졌음). 과제를 고르기 전에는 아무 유도도 지급하지 않는다.
  - **③ 유도선이 엉뚱한 위치(꼬리)에 그려지던 실버그** — 캡처의 꼬리 사선은 `head_flip`(뒷면 x0.825→0.73) 좌표를 **뒤집지 않은 BASE 화면**에 그린 것. 구 가드는 `process.orientation !== renderedOrientation`만 비교해 **stage.orientation 불일치를 못 잡았다**(autoOrient=false 전환 후 노출). 이제 stage 방향까지 비교해 선을 숨기고 **도마 중앙 `drawFlipNeededHint`**(필요 뒤집기 종류 계산 — 좌우 F / 상하 V / 둘 다 + 목표 방향 라벨) 표시.
  - **④ 부산물 팝업이 작업 완료 시점에 안 뜨던 문제** — `ButcheryTaskDef.yields` 신설(core): **머리 = t_head 작업 완료 시 / 내장 = t_gut 작업 완료 시** 즉시 팝업(구 구조는 섹션 전체 완료 후라 "머리 제거했는데 머리가 안 나옴"). 필렛·척추뼈·갈빗대·지아이·껍질은 섹션 단위 유지. 팝업에 `onDone` 콜백 도입 — 확인 후 **작업 완료면 남은 작업 재선택(awaitingSelect) / 섹션 완료면 다음 섹션**으로 정확히 이어진다(구 구현은 무조건 advanceSection이라 자유 순서가 끊겼음).
  - **작업 패널 보강**: 완료 작업 **딤 처리(α 0.55/0.75) + `✔ 완료됨 (N%)`**, 진행 중 작업은 **하위 스테이지 진행도 `(1/2)`** 표기(머리 제거 = 앞면·뒷면 2스테이지라 "한 번 잘랐는데 완료 안 됨" 혼동 제거).
  - **헤더 타이틀 변경**(사용자 지시): `생선 손질 — 회 뜨기 (벵에돔 (33cm))` → **`손질하기 — {작업} ({어종}, {무게}, {길이})`** — 작업 = 원물 손질 / 필렛 손질(rib·pin·peel 섹션) / 회뜨기(추후 썰기). `phaseLabel()`+`refreshTitle()`, doRefresh마다 갱신.
  - **검증(컨트롤러 시뮬 — 실 core 데이터)**: 자유 순서 2케이스(머리먼저·비늘먼저) 모두 **24스테이지·19작업 완주**, 팝업 순서 `t_head:head → t_gut:viscera → filletA → filletB+spine → rib → pin → skin+pureFillet`, **섹션 전환 11건으로 FINISH 도달**(섹션 연결성 보장).
- **[후속 5 — 손질 중간 상태 스프라이트 + 가이드 좌표 1차 확정 (사용자 캡처 리포트)]**
  - **① 진행도 불일치 수정 (핵심)** — 머리 제거 직후인데 **배가 정리되고 지느러미 3종이 모두 사라진** 그림이 나오던 문제. 원인: `headOff`만 보고 곧장 `FISH_DRESSED`(본편 1 = 머리·지느러미·내장 **전부** 제거 상태)를 썼다. **중간 상태 2종을 시트에서 추가 추출**(`bream_headless` ← 선-4 머리만 분리·지느러미 有·내장 有 / `bream_finless` ← 선-6 지느러미 제거·내장 有, 칼 잔재 SVG_ERASE로 제거) 후 `bodySpriteFor()` 4단계 전이로 교체: **온마리 → 머리만 제거 → 지느러미 제거 → 내장 제거(dressed)**. 어종군 전용 중간 스프라이트가 없으면(방어류 — 사진 대기) dressed 폴백. 4상태 렌더 시각검증 PASS.
  - **② 상태 파생 방식 변경** — `this.headOff/this.gutted` 플래그 → **`doneStages` 집합에서 파생**(head_flip/finectomy/gut_scoop). 자유 순서에서 화면과 실제 진행이 어긋나지 않는다(구 `gutted`는 vessel_scrub(scoop)에도 켜지는 문제가 있었음).
  - **③ 흰 점 3개 일직선 아티팩트** (사용자 질문) — 원본 도트가 아니라 **비늘 반짝임 오버레이**(비늘치기 전 "비늘 남음" 표시)였고, 배치식 `(i*73)%100`·`(i*37)%100`의 주기 겹침으로 점이 **격자·직선**으로 정렬됐다. **황금비 무리수 산포**(PHI/G2)로 교체해 균일 분포.
  - **④ 가이드 좌표 1차 확정** (dev F9 편집기 실측 — 돔류): 시메 `tapPoint {0.239, 0.410}` / **방혈 = 7점 곡선**(아가미 안쪽 호 — 곡선 편집기 첫 실적용) / 머리(좌) `[{0.283,0.307},{0.346,0.867}]` / 머리(우) `[{0.703,0.300},{0.649,0.867}]`. 나머지 단계 좌표는 **에셋 정합 후 진행**(사용자 지시).
- **[후속 6 — 다중 유도선 (한 스테이지에 절단선 여러 개) + dev 선 추가/삭제]** 지느러미는 **등·뒷·가슴 3곳**이라 스테이지당 유도선 1개 구조로는 표현 불가(사용자 요청).
  - **[core] `CutSpec.guidePaths?: CutPoint[][]` 신설** — 각 선을 1회씩 그어야 스테이지 완료, **순서 자유**. `submitCut`이 미완료 선 중 **커버율이 가장 높은 선으로 매칭**(그은 획 → 해당 선 완료 처리), `pathsDone: Set<number>` 추적 + `donePathIndices` getter. `resetStageCounters`가 선 개수를 strokesLeft로 세팅(strokesRequired보다 우선). `cut()` 헬퍼에 guidePaths 관통.
  - **[core] finectomy = 3선 구성** — 등지느러미(4점 곡선)/뒷지느러미(3점)/가슴지느러미(3점). 라벨·안내문 갱신("3곳 — 순서 자유"). 좌표는 실루엣 근사 기본값 → dev 편집기로 실측 예정.
  - **[client] 렌더** — 다중 선 전부 표시, **완료선은 흐린 실선+체크 점**(strokeGuideLine `done` 인자), dev 편집 중에는 **편집 대상 선만 또렷**. 유도 화살표 큐는 **아직 안 그은 첫 선**을 따라간다. 사이드바 `남은 절단선: n / 3곳 (순서 자유)` 표기.
  - **[client] dev 편집기 다중 선 UI** — 툴 버튼 3×2로 확장: `[곡선 그리기] [+ 점] [+ 선]` / `[스무딩] [복사] [선 삭제]` + **`◀ 선 n / N ▶` 선택기**(선 2개 이상일 때). `editableLines()`가 단일 `guidePath`를 `guidePaths[0]`로 **동일 참조 승격**(splice 제자리 편집이 guidePath에도 전파 — 검증 PASS), `[+ 선]`은 현재 선을 y+0.18 오프셋 복제해 즉시 편집 대상 전환(최대 6선), `[선 삭제]`는 최소 1선 유지 + guidePath 재동기화. **[복사]가 다중 선 스니펫**(`cut(id, ORI, [..], { guidePaths: [ /* 선1 */ [..], ... ] })`) 출력.
  - **검증(core 실판정)**: 3선을 **역순(가슴→등→뒷)으로 그어도 각각 cov 1.00 매칭**·3번째에 stageDone·다음 스테이지 진입 / 선 1개만 그으면 미완료(남음 2) / **같은 선 재차 그으면 실패(cov 0.00)** — 한 곳만 반복해 넘기는 편법 차단 / 단일→다중 승격 시 guidePath 참조 유지·선 추가 시 strokesLeft 동기화.
- **[후속 7 — 지느러미 3선 실측 좌표 + 선마다 칼 연출 + 비늘치기 스윕 게이지·비늘 튐]** (사용자 dev 편집기 실측 좌표 3건 + 버그 3건):
  - **[core] finectomy 3선 실측 좌표 확정** — 등(0.338,0.282→0.557,0.421)·뒷(0.362,0.729→0.568,0.594)·가슴(0.400,0.467→0.367,0.548) 각 7점 곡선(dev F9 편집기 측정본). 구 실루엣 근사 기본값 폐기.
  - **[client] 칼 연출이 "방금 그은 그 선"을 따라간다** — 구 `playActionAnim`은 항상 `cut.guidePath`(=1번 선)만 스윕해 2·3번 선을 그어도 첫 선에서만 칼이 지나갔다(사용자 리포트). `submitCut` 반환에 **`matchedPath`(매칭된 선 인덱스)** 신설 → 호출측이 `guidePaths[matchedPath]`를 `playActionAnim(stage, path)`로 전달. 유도 화살표 큐는 기존대로 미완료 첫 선 추적.
  - **[core] 비늘치기 스윕 경로 = 스테이지 데이터** — `ButcheryStage.sweepPath?: CutPoint[]` 신설(drag_fill·scoop·peel 공통). scale_base(20점 지그재그)·scale_flip(13점) 실측 좌표 + gut_scoop(정중선 항문→머리)·vessel_scrub(척추 홈 0.74→0.16) 배선. client `sweepPathFor`는 **stage.sweepPath를 참조로 사용**(dev 편집이 제자리 반영, [복사] 스니펫도 `sweepPath: [...]` 형식으로 변경).
  - **[client] 채움 게이지 = 스윕 커버리지** (사용자 지시 "지정한 스윕을 전부 충족할 때 100% — 좀 더 오래 하는 느낌") — 구 `submitFill(이동거리 × 0.28)`은 제자리에서 흔들어도 찼다. 경로를 **44등분 샘플 + 커서 반경 0.06 체크**해 `진행 = 체크수/전체`, `fillTarget` 0.92(비늘)·0.85(내장·핏줄). 검증: 전 구간 훑음 1.000(통과) / 절반 0.568 / **제자리 흔들기 400회 0.045**(편법 차단).
  - **[client] 비늘 튐 연출 2종** — ① **커서 호버 위치마다 즉시 튐**(`spawnScaleBurst` — 40ms 스로틀, 진행 방향 부채꼴 4~5조각 Rectangle + 회전·낙하·페이드 트윈, destroy 시 일괄 정리. 내장·핏줄은 붉은 조각) ② **마무리 액션 애니 방향 수정** — 고정 수평선 3줄 → **실제 스윕 경로를 따라가는 칼 스윕**, 부스러기는 **날 진행 방향 앞쪽**으로 분사(구 구현은 칼 뒤쪽으로 튀어 방향이 어긋났음). 유도 화살표도 스윕 시작→끝 방향에서 산출.
- **[후속 8 — 복면(뱃살 정면) 뷰 + 체강 탑뷰 + 뱃살 아래 배치]** (사용자 캡처 3장 지시):
  - **[client] 상하 미러 폐지 — 뱃살은 항상 아래쪽** (`drawPixelButcherFish`): 구 `BELLY_UP/BACK_DOWN = 상하 미러`가 배를 화면 위로 올려 측면 그림이 뒤집혀 보였다. 미러 제거 + 항문 마커/내장 폴백 오버레이를 아래쪽 기준으로 재배치. "배 위로"는 미러가 아니라 **전용 뷰 스프라이트**로 표현한다.
  - **[신규] `tools/gen_butchery_views.cjs` → `data/PixelFishViews.ts`** (자동 생성): **`{fam}_ventral`**(뱃살을 정면에서 본 복면 뷰 — 방추 은백 몸통·정중선 홈·항문 점·좌우 대칭 가슴/배지느러미·갈라진 미기) + **`{fam}_cavity`**(내장 꺼낸 체강 탑뷰 — 벌어진 뱃살 플랩·은막·척추 아래 검붉은 고인 피 홈·갈빗대·응혈), 돔류/방어류 2세트(체고 파라미터 분리). 실사 사진이 들어오면 `pixelize_butchery.cjs`로 같은 키를 생성해 덮어쓰면 자동 교체(`stageSpr`가 사진 레지스트리 우선 조회).
  - **[client] 단계별 뷰 배선** (`pickStageSprite`): BELLY_UP + `gut_open`·`gut_scoop` → **복면 뷰**(개복선 = 정중선, 내장 꺼내기 중엔 정중선 사이 내장 덩어리 오버레이) / BELLY_UP + `vessel_scrub`·`gut_wash` → **체강 탑뷰**(세척 단계는 물기 오버레이 = 고인 피 씻김). 구 시트 추출 `{fam}_vessel`(측면 그림)은 폴백으로만 유지.
  - **검증**: 실제 렌더러(`PixelButcherFish`)를 esbuild로 번들해 Graphics→canvas 셰임으로 6상태 렌더 — 온마리 배=아래 / 배따기·내장 복면 뷰 / 핏줄·세척 체강 탑뷰 / 비늘 반짝임 전부 PASS(스크린샷). ⚠ 첫 렌더에서 `{fam}_vessel`이 우선 조회돼 측면 그림이 나오던 것을 발견·우선순위 교정.
- **[후속 9 — 장뜨기 뷰(등쪽·배쪽) + 칼집 벌어짐 4단계 + 벌어지는 연출 + 꼬리칼집 실측]** (사용자 실사 3장 + 배쪽 칼질 3구간 설명):
  - **[core] 꼬리 칼집 실측 좌표** — 앞면 `[{0.732,0.376},{0.736,0.627}]` / 뒷면 `[{0.274,0.395},{0.273,0.624}]`(dev F9 측정본).
  - **[core] 장뜨기 = 등/배 각각 전용 자세** — 등쪽(`fillet_*_score`) `BACK_DOWN`(**라벨 '등 아래로(항문 위)' → '등 위로 (머리 오른쪽)'** — 이 방향은 장뜨기 전용이라 안전), 배쪽(`fillet_*_sever`)은 `BACK_DOWN` → **`BELLY_UP`**(배를 카메라 쪽으로 = 실사 정합. 두 작업 사이 뒤집기 1회). 등쪽 가이드 = 머리(우) → 꼬리(좌) 3점, **배쪽 가이드 = 사용자 지정 3구간 5점**(꼬리 칼집(우) → 항문 → 아가미까지 척추 바로 위 일자 → 척추에 걸리는 지점에서 **왼쪽 대각선 위**로 깊게 = 1면 분리).
  - **[client] 장뜨기 뷰 스프라이트 8종/어종군** (`gen_butchery_views.cjs` 확장 → `{fam}_dorsal0~3`·`{fam}_belly0~3`): 등쪽 = 머리 우·짙은 등 껍질 / 배쪽 = 꼬리 우·은백 뱃살. **칼집 회차별 벌어짐 4단계** — 0 닫힘 / 1 붉은 살 조금(실사 2번째) / 2 뼈 노출(3번째) / 3 반대쪽까지 벌어짐 + 척추 마디·근막 흰선(4번째). `pickStageSprite`가 `strokesDone`으로 선택하고, **방향 불일치 시 뷰를 바꾸지 않고 측면 몸통으로 폴백**(뒤집기 유도 유지).
  - **[client] 칼이 지나간 뒤 벌어지는 연출** — `playActionAnim` guided_cut을 **전반 = 칼 스윕 / 후반 = 벌어짐** 2단으로 분할(`strokePathOffset` 신설 — 절개선 양쪽이 법선 방향으로 밀려남). 스테이지가 넘어가는 마지막 칼집(3회째·분리)에서도 연출 동안 벌어짐이 보이도록 **`PixelFishState.openOverride`**(연출 종료 시 해제 + 정상 리렌더) 도입.
  - **검증(core 실판정 + 실렌더)**: 등쪽 3회 cov 1.00·벌어짐 단계 1→2→3·3회째 `fillet_0_sever` 전환 / 배쪽 5점 경로 cov 1.00·필렛 1장·`fillet_1_score` 진입 / 섹션 참조 스테이지 누락 0(24스테이지) / 렌더 6케이스 = 닫힘·1·2·3(override)·배쪽 은백(꼬리 우)·BASE 불일치 폴백 전부 PASS.
- **[후속 10 — 2면(fillet_1)만 새 구조 (1면 유지) — 사용자 확인 "2면만 새 구조"]** 1면은 이미 분리돼 [척추뼈+2면 살] 덩어리이므로 **양쪽 살 붙은 1면 스프라이트를 재사용하면 안 됨**(사용자 지적). `buildButcheryStages` fillet 루프를 `if (f === 1 && !flat)` 분기:
  - **[core] 2면 스테이지 = score + ribcut + sever** (구 sever+ribsever 폐기): ① `fillet_1_score`(등쪽→척추, BACK_DOWN, 3회) ② **`fillet_1_ribcut`**(신설 — 갈비뼈 끊기: 머리쪽 깊이·z축, BACK_DOWN, **strong**) ③ `fillet_1_sever`(**꼬리쪽→배쪽 분리**, BELLY_UP, 3회, **yieldsFillet** — 척추 끊긴 상태라 배쪽에서 추가 끊기 불필요). **1면(fillet_0)은 불변** = score+sever+ribsever.
  - **[core] 섹션 정합** (`ButcherySections.ts` sec_fillet_b): `t_fb_back = [fillet_1_score, fillet_1_ribcut]` / `t_fb_belly = [fillet_1_sever]`(라벨 '꼬리쪽 → 배쪽 분리'). 1면 sec_fillet_a 불변.
  - **[client] 뷰 배선** (`PixelButcherFish.pickStageSprite` fillet_1 분기): **등쪽/갈비뼈끊기(dorsal) = 측면 spine 뷰**(`{fam}_spine{n}` — 척추 노출 덩어리, 머리 우) / **배쪽 분리(belly·sever) = 정면 배쪽 뷰**(`{fam}_belly{n}` — 머리 좌·꼬리 우·은백 뱃살, **미러 없음**). 1면 sever도 동일 belly 뷰 공유. ⚠ `{fam}_belly`는 장뜨기(후속 9) 뷰 재사용 — 2면 전용 덩어리 배쪽 뷰가 필요하면 후속에서 분리(현재 기능·형태 정합).
  - **검증(core 실구조 + 뷰 키)**: 돌돔(stone_beakperch) `fillet_1 = [score, ribcut, sever]`·ribsever 제거 / ribcut strong·BACK_DOWN / sever 3회·yields·BELLY_UP / **1면 유지 = [score, sever, ribsever]** / 섹션 t_fb_back·belly 정합·참조 스테이지 누락 0 / `bream/amberjack_spine0~3`·`_belly0~3` 키 전부 존재. 빌드 4/4·typecheck 0. **가이드 좌표는 사용자 F9 실측 예정**(현재 근사 기본값).
- 잔여(차기 — 사용자 백로그): **방어류 실사 4장 파일 투입 + 배쪽(belly) 사진**(사용자 제공 예정 — `amberjack_belly_score1~3.png` 권장) 후 파이프라인 재실행, **복면/체강 뷰 실사 교체**(현재 파라메트릭 — `{fam}_ventral.png`/`{fam}_cavity.png`로 저장 후 파이프라인 실행), **배따기·내장·핏줄 유도 좌표 실측**(새 뷰 기준 — F9 편집기), **필렛 재장착**(인벤 필렛 드래그 → 도마 → 갈빗대부터 재개 — ButcheryProgress 스키마·trim_fillet_ribs 아이템은 준비됨, 도마 수용/재개 배선 남음), **회뜨기 썰기 미니게임**(세로 9등분=사시미/야나기바 대각 11등분=고급사시미 — 소/중/대/특대 크기 연동, 측면 뷰 에셋 필요), **회뜨기 유도 연출 개정 md**(영역 유도·홀드 게이지·VENTRAL 뷰 — 자유 손질과 통합 예정), **UI 전수조사**(오버플로/겹침/스크롤 — 별도 패스), 새 스테이지(vessel/tail_b/rib/pin) 가이드선 좌표를 **곡선 편집기로 실측 튜닝**(직선 기본값 → 생선 실루엣·지느러미 형태에 맞는 곡선), 광어(flat) 섹션 트리 분리.

**이전 변경 (2026-07-30 51차) — 가이드선 dev 드래그 에디터 + 손질 어종 게이팅(돔류+방어류) + 방어류 픽셀 생선(잿방어 추출) + 부산물 rib/pin 에셋** (사용자 4건 지시 — dev 실렌더 검증, 빌드 4/4·typecheck 0):
- **[가이드선 편집 에디터 — dev 전용, F9]** (ButcheryPanel): 사용자가 유도선 위치를 직접 조정하도록 **끝점 드래그 에디터**. `import.meta.env.DEV` 게이트 + **F9 키 / 사이드바 [dev: 가이드선 편집·F9] 버튼** 토글. editMode 시: 현재 스테이지 편집점(가변 참조 — guided_cut=`stage.cut.guidePath`(core) / tap=`stage.tapPoint` / 비늘·내장·박피=`sweepOverride` Map 합성선)에 **시안 링 핸들 + 드래그**(onPointerDown/Move/Up 최상단 editMode 분기 — 손질 입력 차단) + **도마 위 좌표 리드아웃**(`cut('id','ORIENT',[{x,y}...])` / `tapPoint: {x,y}` 코드 스니펫) + **[복사] 버튼**(navigator.clipboard + console). 드래그는 유도선/핸들/리드아웃만 경량 갱신(doRefresh 없이). 편집한 좌표를 ButcheryProcess.ts/drawGuide에 붙여넣어 확정. 검증: F9 핸들 1개(시메)·드래그 (0.16,0.38)→(0.30,0.57)·복사.
- **[손질 지원 어종 게이팅]** (core `getButcheryFamily` 재작성): **BUTCHERY_IMPLEMENTED_SPECIES**(돔류 7 + 방어류 3 = yellowtail/amberjack/greater_amberjack)만 `finfish`(손질 가능), **그 외 finfish(넙치류 flatfish/flounder·농어 sea_bass·고등어 등)는 `unsupported`(banned — 추후 구현)**. 두족류=cephalopod·복어=pufferfish 스텁 유지. UtilizationPanel 도마 게이트(family==='finfish')·드래그 자격·[다음 생선]·[손질 시작]이 전부 이 분류 소비(자동 반영). notice 갱신("현재 돔류·방어류만 지원 — 넙치류 등 추후"). **id 정합 수정**: SASHIMI_GUIDE_GROUP·trimHeadKey의 벵에돔 키 `blackfish`→`largescale_blackfish`(실제 어종 id — 구 오기 정정, 벵에돔 가이드 시트·머리 변형 정상화). 검증: 돔류+방어류 finfish / 넙치·농어 unsupported / 오징어 cephalopod / 복섬 pufferfish 전부 PASS.
- **[방어류 도마 픽셀 생선 — 잿방어 추출]** (data/PixelFishSprites `FISH_WHOLE_AMBERJACK`/`FISH_DRESSED_AMBERJACK` 신설): 돔류(deep-body)와 형태가 다른 방어류를 위해 **greater_amberjack.png에서 방추형 픽셀 스프라이트 추출**(scratchpad/extract_amberjack.cjs — 헤드리스 크롬 다운샘플+팔레트 양자화 128×44·46색, bbox 타이트·머리 좌향, DRESSED=머리 좌15% 컷). `PixelButcherFish.butcherSpritesFor(speciesId)` — 방어류=잿방어 세트(nativeColor=틴트금지, 실색) / 그 외=감성돔 세트. drawFish가 세트+틴트(방어류·돔류=무틴트) 소비. 검증: 방어 도마 = 방추형 잿방어(등 청록·측선 노랑·배 은색·꼬리 갈라짐, 11887 draw ops) 렌더.
- **[부산물 rib/pin 에셋]** 사용자 매핑 확정 + 2에셋 추가: 갈비뼈=`rib_bone`(구 중골 공용 → 전용 `trim_rib`), **지아이뼈(핀본)=`pin_bone`** — core `ButcheryByproducts.pinBoneG`(무게 2%) 신설 + 손질 완료 시 `가시뼈` 부산물 지급(byproductKind 'pin', trim_pin). 5+2=7 trimmings 전부 아이콘 연동(머리/중골/갈비/가시/내장/껍질/필렛).
- 잔여(차기): 방어류 FILLET 상태는 공용 스프라이트 재사용(방어 전용 필렛 도트 미추출) / 방어류 가이드 시트(47컷 일러스트)는 돔류 전용이라 팝업 없음(유도선+에디터로 커버 — 사용자 dev 좌표 작업 예정) / 넙치류·두족류 손질은 별도 구현 예약 / pin bone은 소재 아이템(레시피 미연동).

**이전 변경 (2026-07-30 50차) — 손질 부산물 실사 아이콘(trimmings 5종) + 머리 어종별 색 변형** (사용자 지시 "trimmings 5종을 아이템 아이콘으로, 머리는 돔류별 색 변형(참돔 붉게·돌돔 아가미 줄무늬)" — dev 실렌더 검증, 빌드 4/4·typecheck 0):
- **[에셋]** `food assets/trimmings/` 5종 → `public/trimmings/` 복사 + BootScene 로드: `trim_head`(black_sea_bream_head=감성돔 머리)·`trim_spine`(rests_main_spine=중골)·`trim_guts`(pile_of_fish_guts=내장)·`trim_skin`(fish_skin=껍질)·`trim_fillet`(pure_pilet=로인 필렛). 상대경로(배포 규칙 — 선행 `/` 금지).
- **[머리 색 변형 — ButcheryPanel.trimHeadKey + bakeTintedTrim]** 감성돔 원본(trim_head)을 **캔버스 멀티플라이 틴트(+선택 줄무늬)로 어종별 재합성** → `Phaser.Textures.createCanvas`(게임 레벨 TextureManager — 씬 재시작에도 유지, RenderTexture 라이프사이클 회피). 아이콘용 200px 축소. HEAD_MULT 맵: **감성돔=원본 / 참돔(red_seabream)·야간=붉은 발색(0xff7a55) / 돌돔(stone_beakperch)·강담돔(spotted_knifejaw)=유사+아가미 세로 줄무늬(source-atop 3바) / 벵에돔·긴꼬리=회청** / 미등재 어종=`blendColor(흰, getFishColors.body, 0.45)` 종별색. 감성돔은 원본 키 재사용(`trim_head`). 틴트 = multiply + `destination-in`(원본 알파 클립, 투명 배경 유지).
- **[부산물/필렛 배선 — showResult]** `byproductTex(kind)`: 머리 → `trimHeadKey(speciesId)` / 중골·갈빗대 → `trim_spine`(뼈 공용) / 내장 → `trim_guts` / 껍질 → `trim_skin`. **필렛**: 48차 파라메트릭 `bakeFilletIcon`(filletShape 3종) 폐기 → **`trimFilletKey`(pure_pilet 로인 사진 + 은은한 어종 색 26% 블렌드)**. `createItemIcon`이 iconTexture(존재 시)로 렌더 → 인벤/상점/상세/퀵슬롯 전 경로 자동(42차 speciesId 폴백 유지 — 리로드 시 baked 키 없으면 어종 이미지로 폴백, 파라메트릭 시절과 동일 패턴).
- **[검증]** dev 실렌더: 8아이콘 베이크·존재·렌더 PASS(스크린샷 = 참돔 붉은 머리·돌돔 줄무늬·방어 회청·감성돔 원본 + 중골/내장/껍질/필렛) + 손질 완주 산출물 iconTexture 배선(방어: fillet=trimfillet_3e5a74·head=trimhead_yellowtail·spine/rib=trim_spine·skin=trim_skin, 전부 textures.exists) PASS. `FilletShape` import·bakeFilletIcon 제거(noUnusedLocals).
- 잔여(차기): 리로드 후 머리/필렛 baked 변형은 어종 이미지로 폴백(base 4종은 상시 로드라 유지) — 완전 영속은 세이브에 baked 재생성 훅 필요 시. 갈빗대(rib)는 전용 에셋 없어 중골 공용. 강담돔은 줄무늬로 근사(반점 미구현). 필렛 실사 사진이 흰살 어종엔 다소 붉을 수 있음(로인 사진 특성 — 필요 시 흰살/붉은살 2에셋 분기).

**이전 변경 (2026-07-30 49차) — 회뜨기 가이드 켜기/끄기 토글 (유도선은 항상 유지)** (사용자 지시 "가이드를 켜고 끌 수 있도록 하되, 유도선 표시만은 유지" — dev 실마우스 검증 + 무회귀 확인, 빌드 4/4·typecheck 0):
- **[세션 시작 정리]** 진입 시 client typecheck 5건 오류 = **stale `@tra/core/dist`**(48차 부산물 세분화 headG/spineG/ribG/visceraG 소스는 반영됐으나 dist 미빌드 — `ButcheryByproducts`가 구 boneHeadG 노출). `pnpm --filter @tra/core run build` 재빌드로 0 오류(정상 플로우 `pnpm run build`는 core→client 순이라 애초 무해). `sashimi_impl_status_deck.html`의 "오류"가 이것.
- **[유도선 복원 — ButcheryPanel.drawGuide]** 48차에 원물 위 오버레이가 전면 제거(빈 함수)됐던 것을 **스테이지별 온-피시 절단 유도선으로 재구현(상시 표시)**: guided_cut = `stage.cut.guidePath` 점선 + **시작(초록 링)/끝(붉은 사각) 마커 + 진행 방향 화살촉**(경로 80% 지점) / tap(시메) = 목표점 링+점 / drag_fill·scoop = 몸통 가로 스윕(꼬리→머리 좌향) / peel = 꼬리 손잡이(우)→머리(좌) 당김 / wash = 없음(버튼). 헬퍼 `dashSeg`/`drawArrowHead`/`strokeGuideLine`. **칼 모양(글리프)은 원물 위에 그리지 않음**(48차 "원물 위 칼 금지" 준수 — 선+마커+화살촉만). 방향 불일치 시 좌표 어긋남 방지로 숨김(autoOrient로 대부분 정렬).
- **[가이드 토글 — guideOff]** 사이드바 하단 **[가이드 켜짐·[G] 끄기]/[가이드 꺼짐(유도선 유지)·[G] 켜기] 버튼** + **G 키**(`onKey` — 손질 진행 중에만) + **`GameState.flags.butcheryGuideOff` 영속**(재오픈·세션 넘어 유지). `drawGuideToggle`는 전 어종 공통(guideSpeciesOk 무관 — 외곽 화살표는 전 어종 발생). `toggleGuide` = 플래그 저장 + 리렌더.
- **[OFF 시 숨김 대상 = "가이드"뿐, 유도선은 유지]** guideOff이면: ① `startGuideAnim`(원물 밖 주황 화살표 큐) 정지 — 가드에 `if (guideOff) return` + doRefresh에서 `stopGuideAnim` ② `drawGuideCutPopup`(도마 위 시트 컷 일러스트 팝업)·캡션 숨김 — `drawGuideSlot`이 시트 버튼(수동 열람)만 남기고 early-return(lastPopupKey 리셋). **`drawGuide`(유도선)는 토글과 무관하게 항상 호출** — OFF에서도 절단 유도선 그대로.
- **[검증]** dev 실키/실렌더 2스크립트: ① 유도선 커맨드 ON 27 → G OFF 27(유지)·화살표 tween 정지·팝업 숨김·**플래그 영속(재오픈 시 OFF로 시작)**·재-G 켜기 복원 ② 매핑 스테이지(비늘치기 scale_base→pre1)에서 **ON=팝업+유도선(line 292)·OFF=팝업X·유도선 유지(292)·화살표 정지** 전부 PASS. 스크린샷 = ON(유도선+선-1 팝업+주황 화살표+캡션+"켜짐" 버튼) / OFF(유도선만+"꺼짐" 버튼). **무회귀**: 48차-현행 actionAnim 대기 반영 완주 스크립트로 손질 끝까지 완주(방어 필렛 특 739g·부산물 head/spine/rib·껍질·스킬 Lv1) — 가이드 변경이 렌더 루프/입력 무영향(doRefresh 기본 경로는 원본과 동일, drawGuide는 렌더만 추가). ⚠ 기존 45차 butcheryP1.cjs는 48차 드리프트(byproductKind boneHead→head/spine/rib·actionAnim 대기 누락)로 어서션 스테일 — butcheryComplete.cjs로 대체 검증.
- 잔여(차기): 유도선 색은 게임 기존 관례(노란 점선) 유지(스펙 SASHIMI_GUIDE_FIX의 붉은 점선·21스테이지·VENTRAL·부산물 팝업 풀 리워크는 별도 대작업 — 이번은 토글+유도선 유지만). 시메/방혈은 LIVE_STAGE_GUIDE 미매핑이라 팝업 원래 없음(정상).

**이전 변경 (2026-07-29 48차) — 손질 가이드/액션 애니메이션 + 부산물 세분화(어종명 접두·내장 밑밥 전환)** (사용자 2건 지시 — 수치검증(부산물 분리 900g→270g 정합), 빌드 4/4·typecheck 0):
- **[가이드/액션 애니 — ButcheryPanel]** 전용 레이어 2장(guideAnimG/actionAnimG — fishG·guideG 위, uiC 아래) + 폴리라인 호길이 보간 헬퍼(`pathPointAt`/`strokePathPartial`) + **회칼 글리프**(`drawKnifeGlyph` — 블레이드+손잡이, 진행각 회전):
  - **가이드 루프**(2s 반복, `TUNING.butchery.guideAnimMs`): 칼이 지나갈 길 프리뷰 — guided_cut = 경로 하이라이트+이동 칼 / tap = 맥동 링 / drag_fill·scoop = 지그재그 문지르기 궤적 / peel = 좌진행 칼. canAct(방향 일치)·비잠금 시에만, doRefresh마다 재시작.
  - **액션 연출**(2s, `actionAnimMs`, **입력 차단** actionAnim 가드 — pointerdown/move/onKey 편입): 성공 시 프리미티브별 — 칼질 = 흰 절개선+여열 글로우+스파크 스윕 / 시메 = 3중 확산 링 / 비늘·내장 = 3연속 스와이프+부스러기 / 박피 = 껍질 스트립 벗겨짐 / 세척 = 물방울+세척광. **플립(방향 전환)이 이어지는 성공은 스킵**(willFlip 캡처 — 플립 연출이 피드백, 좌표 어긋남 방지). 완료 시 가이드 루프 재시작. 훅 5곳(컷/탭/문지르기 완료/박피/세척×2). destroy/playFlipAnim에서 정리. ⚠ 2s는 초기값 — 실검증 후 F8 슬라이더(guideAnimMs·actionAnimMs META 등록)로 조율 예정(사용자 지침).
- **[부산물 세분화 — core]** `ButcheryByproducts` 재구성: 구 boneHeadG(22%) → **headG 12% + spineG 6% + ribG 4%** + **visceraG 8%** 신설(+skinPieces 유지). computeFilletYield 소비·RecipeDatabase 매운탕/지리 훅을 `byproduct_soup_bones`(= byproductKind head|spine|rib 통칭, 구 boneHead 호환)로 갱신.
- **[부산물 지급 — showResult]** **어종명 접두 개별 아이템 5종**: `감성돔 생선 머리 108g`(head)/`척추뼈 54g`(spine)/`갈빗대뼈 36g`(rib — 3종 = 매운탕/지리 재료, category food라 요리 탭 임베드 인벤에 노출)/`내장 72g`(viscera)/`껍질`(skin). **필렛 포함 전 산출물 = 활어 시작·새 시계**(사용자 지정 "처음은 활어로" — 구 원본 신선도 승계 폐기). byproductKind 확장('head'|'spine'|'rib'|'viscera' 추가, 구 'boneHead' 레거시 호환). 결과 오버레이 부산물 행 갱신.
- **[내장 특수 신선도 — InventoryStore]** `InvItem.condProfile: 'viscera'` 신설 — **활어(10분) → 곧바로 나쁨 → 1시간 후 부패**(VISCERA_NEXT/DURATION 오버레이, 프로필에 없는 상태는 기본 그래프 폴백 — 냉장고 냉동 경로 안전). refreshCondition/conditionRemainMs/conditionPath가 프로필 소비(Pick 확장 — 시그니처 호환).
- **[내장 '만들기' — 밑밥 전환]** 인벤 우클릭 메뉴에 **'만들기'**(viscera 전용, 녹색): `InventoryStore.makeChumFromViscera` — 1개 소모 → `{어종} 내장 밑밥`(consumable·집어제/밑밥·**chumKind 'krill'** = U 밑밥 탭 배합 재료로 즉시 사용 가능, 어종별 id 스택). **부패 내장은 전환 불가**. 통발 미끼 활용은 추후(안내 문구 표기).
- **[후속 수정 — 도마 픽셀 생선 (사용자 피드백 "물고기 형상이 아예 물고기가 아님")]** 구 파라메트릭 타원 생선(FishTemplateRenderer — 회색 덩어리)을 **가이드 시트에서 추출한 도트 생선으로 교체**: ① `data/PixelFishSprites.ts` 신규 — **SVG 패널에서 rect 도트 매트릭스 직접 추출**(선-3=온마리 128×66·54색 / 본편1=손질 몸통 118×52 / 본편38=필렛 120×38. 마커색(빨간 절단선·화살표·칼) 제외 + 행 인페인트 + 최대 연결요소 필터 — 추출 스크립트 scratchpad/extract_fish.js, 시각검증 PASS) ② `ui/PixelButcherFish.ts` 신규 — 정수 셀 스케일 + 행 런 병합 fillRect 렌더러: FSM 상태로 3스프라이트 선택(온마리→손질 몸통(headOff)→필렛(FLESH_UP/완료)), FLIP=좌우 미러·BELLY_UP/BACK_DOWN=상하 미러, 오버레이(비늘 반짝임/내장 블롭/박피 껍질층+꼬리 손잡이/항문 마커) ③ ButcheryPanel.drawFish 교체 — **돔류는 가이드 원색(회색) 그대로, 타 어종은 어종 색 22% 틴트**. UtilizationPanel 도마 프리뷰(makeFishPreview)는 기존 유지.
- **[후속 수정 2 — 가이드 = 원물 주변 팝업 유도 (사용자 피드백 "원물 위 방향선·칼 금지, 유도는 주변 팝업")]** ① **원물 위 가이드 오버레이 전면 제거** — drawGuide의 노란 점선 칼선·시작점·박피 화살표 폐기(원물만 표시), 가이드 루프의 경로 하이라이트+이동 칼도 폐기 ② **유도 = 원물 주변 큐 2종**: (a) `drawGuideCutPopup` — 현재 스테이지의 **시트 컷 일러스트가 도마 위쪽에서 팝업**(168×99 + 번호 칩, 스테이지/회차 전환 시 Back.easeOut 팝인 — 일러스트 안의 시트 화살표·절단선이 "안내하듯" 유도. lastPopupKey 추적, 트윈은 doRefresh/destroy에서 정리) (b) `drawSheetArrow` — **시트와 동일한 주황(#e0592c) 화살표가 원물 밖**(경로에 가까운 가장자리 — 수평 컷=위/아래, 수직 컷=좌/우)에서 진행 방향으로 슬라이드+페이드 루프 ③ **예외: 시메(tap)만 목표점 맥동 링 유지**(탭 좌표 = 게임플레이, 선/칼 아님) ④ 사이드바 일러스트 슬롯 → [가이드 시트] 버튼+캡션만 잔류(일러스트는 팝업으로 이동). **액션 성공 연출(칼 스윕 등)은 유지** — 금지 대상은 "가이드 제공 시"의 사전 표시이고, 조작 후 액션 애니는 별도 지시로 승인된 것.
- 잔여(차기): 애니 2s 실플레이 조율(다회 칼집 스테이지 체감 속도), 통발 미끼로 내장 밑밥 소비 배선, 매운탕 조리 플로우의 byproduct_soup_bones 실소비, 내장 밑밥 전용 침강/동조 특성(현재 krill 프로필 공유), 픽셀 생선 중간 상태 확장(개복 분홍 밴드·장뜨기 진행별 슬랩 노출 — 현재 3상태+오버레이), 납작형(광어) 전용 도트 스프라이트, 가이드선 제거에 따른 컷 난이도 실측(tolerance 0.08 유지 여부).

**이전 변경 (2026-07-29 47차) — 삼면뜨기 픽셀 가이드 47컷 인게임 적용 (시트 프레임·스테이지 바인딩·가이드 슬롯·시트 뷰어·선행 스테이지)** (SASHIMI_PIXEL_GUIDE_SPEC — 테이블 정합성 수치검증 + 프레임 크롭 시각검증, 빌드 4/4·typecheck 0):
- **[에셋]** 루트 `sashimi_pixel_guide.svg`(2024×2154, 감성돔 47컷 = 선행 9 + 본편 38)를 **헤드리스 크롬으로 1:1 PNG 렌더** → `public/guide/sashimi_pixel_guide.png`. **개별 47장으로 굽지 않고 시트 1장을 단일 텍스처로 로드 후 그리드 프레임 등록** (`data/SashimiGuideFrames.ts` — 프레임 키 `sg_pre1~9`/`sg_p01~38`, BootScene create에서 1회). 그리드 지오메트리는 core `SASHIMI_GUIDE_SHEET`가 단일 소스(패널 316×186 · x=24+col·332 · y=112+row·254 · 6열). 스펙의 "고유 28컷+반복 매핑" 최적화는 개별 파일 전제라 불필요(시트 프레임 = 중복 비용 0, pre9=p01 별칭 자동 해소).
- **[core 신규] `db-schema/ButcheryGuideCuts.ts`** (index.ts export): ① **캐노니컬 47행 테이블** `SASHIMI_GUIDE_CUTS`(pre/panel 번호·스펙 stageId·pass·캡션·orientation·startEdge — §1-A/§2 대조표 그대로) + `getGuideCuts`/`guideCutByKey`/`guideCutFrameRect`/`allGuideCutKeys` ② **LIVE 브리지** `LIVE_STAGE_GUIDE`: 기존 검증된 FSM id(scale_base→pre1 · head_flip→pre4 · gut_open→pre6 · tail_grip→p34(박피① 손잡이) · fillet_0_score→[p02,p03,p04] 스트로크 회차 전환 · fillet_0_sever→[p05,p07] · fillet_1_*→[p09~p13] · peel→[p35,p36,p37] 당김 회차) + `resolveLiveGuideCut(liveStageId, passIndex)`. **47-스테이지 풀 트리 재작성 없이 그림만 바인딩** — 스펙 §0 "로직 신규 정의가 아니라 바인딩 규격" 준수, 풀 트리는 차기에 1:1 수렴 ③ **`SASHIMI_GUIDE_GROUP`** — 돔류 7종(감성돔·참돔·참돔야간·벵에돔·긴꼬리·돌돔·강담돔) → 'seabream' 시트 공유(등재 어종만 가이드 활성. 광어 오면뜨기·장어·두족류·복어 미등재 = §5-2) ④ `SEABREAM_GUIDE_PROFILE`(§5-1 파라메트릭 9필드 포함) ⑤ **부산물 테이블** `BUTCHERY_BYPRODUCT_TABLE`(§6-C 16행 — cutKey·productId·remountable·nextStageId).
- **[core 타입] `types/Butchery.ts`**: `ButcheryGuideProfile`(depthRatio/headRatio/snout/dorsalSpan/ventPos/scaleType 등 — 어종 시트 자동 재생성 파라미터) + **§6 스키마** `ButcheryProductId`(13종)/`ButcheryProgress`(stageId·panel·side·flags)/`ButcheryYieldPopup`/`canStack()`(progress 보유 = 항상 비스택, 부산물만 어종+등급 스택 — §6-F 일반 인벤토리 결정).
- **[core FSM] `buildButcheryStages(profile, opts?)`**: ① **`finectomy` 스테이지 신설**(선-5 지느러미 제거 — head_flip 뒤·gut_open 앞, guided_cut ×2. 감성돔 17→18 스테이지) ② **`skipDescale` 분기**(§3-2 — 비늘치기 선-1·2 스킵 가능. 스킵 개체 껍질 부산물 등급 하락은 데이터 훅만, 클라 선택 UI는 차기). ButcheryProcess 생성자 3번째 opts 관통(비파괴).
- **[client] ButcheryPanel**: ① **가이드 슬롯** — 사이드바 하단(700, H-238)에 현재 스테이지의 컷 일러스트(190×112 프레임)+번호 칩(`가이드 선-3`/`12 / 38`)+캡션. 다회 스테이지는 **스트로크/당김 회차로 컷 자동 전환**(fillet score ①→②→③, peel ②→③→④), 완료 시 p38. 시메/방혈은 범위 밖(슬롯 숨김) ② **[가이드 시트 (47컷)] 버튼 → 전체 시트 뷰어** — 화면고정 오버레이(딤+마스크 scrollFactor 0 — 33차 교훈), 네이티브 스케일 **드래그 팬 + 휠 스크롤**, ESC/X 닫기(열림 중 손질 입력 차단) ③ **dev 어서션** — LIVE_STAGE_GUIDE 전 키의 컷 행/프레임 등록 검사(문제 시 console.warn).
- **[검증]** 테이블: 47행·중복 0·프레임 rect 시트 경계 내 0 OOB·allKeys↔행 1:1·브리지 전부 해소·감성돔 18 스테이지 중 시메/방혈 외 **미매핑 0**·skipDescale 15 스테이지 / **프레임 크롭 시각검증**(pre5=지느러미 제거·p01=손질 몸통·p36=박피③ — 3점 크롭이 기대 컷과 픽셀 정합) / dev 서버 시트+모듈 서빙 200.
- **[돔류 팔레트]** 참돔 등 변형 시트는 **SVG 팔레트 스왑 → 재렌더**로 생성 예정(§5-1 — 작업량 최소화. 스왑 전까지 돔류 전체가 감성돔 시트 공유 = 사용자 지침 "원본 차용 가능" 반영).
- 잔여(차기): **47-스테이지 풀 트리**(fil_spine/rib/pin/loin/lift 개별 스테이지 — 브리지 1:1 수렴), **부산물 팝업 모달(보관/버리기) + 도마 재장착**(§6-B/D — ButcheryProgress·resumeStagesFrom 배선, 스키마는 완비), 인벤 progress 배지, 참돔 팔레트 시트, skipDescale 선택 UI(요리 의도 분기), 도감 시트 해금(첫 삼면뜨기 어종), 무린어(갈치·장어) 선-1·2 자동 스킵.

**이전 변경 (2026-07-28 46차) — 홈타운 버그 수정 6건 (씬 전환 멈춤·출조 게이팅·집 냉장고·어획 규제·랜덤 날씨/물살·실내 접지)** (사용자 피드백 6건 — 빌드 4/4·typecheck 0·dev 서버 부팅+모듈 트랜스폼 확인):
- **[씬 전환 안전망]** (`RegionFieldScene.fadeOutThen` 신규): `camerafadeoutcomplete` 이벤트가 안 오는 엣지 케이스(fadeIn 중 재fadeOut 등)로 전환이 멈추던 문제 → **폴백 타이머(fadeMs+150)** 로 액션 보장 실행. exitToWorldMap/gotoTitle/checkEdgeTransition(scene.start·restart)·enterHomeInterior/enterFirstPersonFishing(pause+launch, keepTransitioning=false)를 전부 이 헬퍼로 일원화. **resume 핸들러에 `isTransitioning=false` 안전망**(하위 씬 복귀 시 이동 잠김 잔존 방지).
- **[출조 게이팅]** 홈타운 ESC 일시정지 메뉴에서 **'전국 지도' 항목 제거** — 홈타운 이탈은 **출조 버스 [E]로만**(→ 전국 지도 → 지역 선택 시 교통비 차감 = 비용 지불). 타 지역은 '전국 지도' 유지.
- **[집 냉장고]** (`store/FridgeStore.ts` + `ui/FridgePanel.ts` 신규): 냉동고 8칸(4×2) + 냉장고 16칸(4×4). 보관 시 냉동('frozen')/냉장('chilled') 전환·신선도 시계 정지, 꺼낼 때 재시작. **GameState SaveData.fridge 영속**. HomeInteriorScene 냉장고 [E] → 패널(구획 토글·인벤 음식 클릭 보관/보관물 클릭 꺼내기). ⚠ Phaser Container 예약 프로퍼티 `body` 충돌 → 필드명 `gridC`.
- **[어획 규제]** (`FirstPersonFishingScene.buildSpawnCtx`): region==='hometown'이면 `ctx.speciesFilter = HOMETOWN_SPECIES`(볼락류 5종 + 보리멸) — 루어 바인딩보다 우선. spawnFish 후보 0 시 전체 폴백이라 크래시 없음.
- **[랜덤 날씨/물살]** 홈타운 실데이터 없음 → 날씨 `ExternalDataStore.rerollHometownWeather()`(방문마다 추첨, HUD/조명/날씨효과 공유) / 물살 FP create `Math.random()`(홈타운 한정 curStrength·밀물썰물 랜덤).
- **[실내 접지]** (`HomeInteriorScene`): 캐릭터 붕뜸 → `PLAYER_FOOT_SINK=6`(스프라이트만 아래로, 그림자는 발밑 — RegionFieldScene 동일 패턴). 스폰·update 양쪽 적용.
- 잔여(차기): 냉장고 드래그 이송(현재 클릭)·신선도 보존 곡선(현재 정지)·가구 텍스처 실사화, 씬 전환 멈춤 근본원인(카메라 페이드 이벤트) 실플레이 재확인.

**이전 변경 (2026-07-28 45차) — 회뜨기 P1 완결성 (부산물·필렛 아이콘·스킬 루프·연속 손질) + P0 정리** (회뜨기 백로그 P1 — Playwright 실마우스 완주+산출물 검증, 빌드 4/4·typecheck 0):
- **[P0 확인]** SASHIMI_BOARD_DND_SPEC Phase A/B는 41·42차에 전부 구현됨(DnD family 게이트·FishTemplateRenderer 공유·교환/빼기·round/flat 프리뷰·CookScene 일원화). 잔여 = **스테일 주석 3곳** 정리(UtilizationPanel 헤더·섹션, CookScene 헤더 — 실동작과 정합). **1~5 방향키 ↔ 퀵슬롯 겹침**: 실경로(U창=openPopup→popupStack→uiBlocked) 게이팅 검증 — 손질 중 Digit3 → 퀵슬롯 0→0 불변·방향만 BELLY_UP(43차 "무해" 노트는 popupStack 미경유 테스트 아티팩트였음. 프로덕션 누수 없음).
- **[P1-1 부산물]** (`computeFilletYield` + `FilletYieldResult.byproducts` 신설): 손질 완료 시 필렛 외 **중골·머리(육수용, 무게 22% 비례가)** + **껍질(박피 어종 skinToughness≥0.4, 필렛 수만큼)** 지급. **원본 신선도 승계**(condition/conditionSinceMs 동일 시점부터 감쇄). RecipeDatabase **매운탕/지리**(itemId 'byproduct_boneHead' — 부산물 소비 데이터 훅, 조리 플로우 연동은 후속). `InvItem.byproductKind`('boneHead'|'skin'). 검증: 방어 3kg → 중골·머리 660g(1,980원·live) + 껍질 x2.
- **[P1-2 필렛 아이콘]** (`ButcheryPanel.filletIconKey`/`bakeFilletIcon`): filletShape 3종 파라메트릭 아이콘(loin_thick 두꺼운 붉은살+혈합육 라인 / flat_wide 넓은 흰살 / small 소형) × **어종 색 22% 블렌드 틴트** + 껍질 엣지. 필렛 아이템명 규격화 `방어 필렛 (특) 739g`(등급+장당 무게) + weightG 저장(상세 패널 어종 정보 스레딩). 텍스처 키 `fillet_<shape>_<colorHex>`(색 공유 어종 dedup). 검증: 필렛 tex=fillet_loin_thick_3e5a74.
- **[P1-3 스킬 루프]** 사이드바에 **손질 스킬 Lv.N · XP/next 상시 표시** + 결과 화면 **★ 레벨업! Lv.N ★ 배너**(스케일 튄 강조). XP 실누적 확인(레벨업 임박 90+지급 → Lv.1). 상한 Lv.20(MAX 표기).
- **[P1-4 엣지 UX]** ① **[다음 생선 손질] 버튼** — 인벤에 finfish 어획물 남아 있으면 결과 화면에 [다음 생선 손질]+[확인] 2버튼, 클릭 시 다음 어획물을 도마에 올려 바로 이어서(연속 흐름). `ButcheryCallbacks.onNext`. ② **통마리 유도** — 회칼 미보유 OR **체장 미달**(minFilletLengthCm) 시 사이드바 경고 + [통마리로 마무리] 상시 제공. ③ **ESC 중단 = 단순 취소** — 원본은 showResult까지 미소모라 어떤 닫힘(ESC/X)에도 원본 보존(반손질 아이템 없음).
- **[잔여 — 백로그 순서대로]** P2-1 회썰기(rhythm_cut 미니게임 — sliceCount 실인터랙션화), P2-2 회 접시 플레이팅+판매(경매 gradeMult·레스토랑 납품), **P2-3 숙성(냉장고 agedHours 곡선 — 홈타운 냉장고 스키마 서는 시점)·활어수조 freshnessFactor 1.0 루트·아일랜드 테이블 회 먹기 버프**, P2-4 연출/사운드, P3-1 두족류 손질 트리·P3-2 복어(License 게이트)·P3-3 수율/등급 몬테카를로 시뮬(별도 스펙). ItemDetailPanel 필렛 상세 등급 전용 행은 이름에 등급 병기로 대체(스킬 스레딩은 미적용).

**이전 변경 (2026-07-28 44차) — 홈타운(집) 거점 + 출조 요금 + 집 침대 저장 게이트 + 칸 단위 자유 배치 (스키마&스켈레톤 Phase 1·2)** (HOMETOWN_HOME_SPEC rev4 — Playwright 전 항목 검증, 빌드 4/4·typecheck 0):
- **[data] 홈타운 단일 맵** — `pixelazed/hometown/hometown_home.png`(768×512, scratchpad gen 스크립트로 목업 레이아웃 생성: 바다27%+모래4%/땅70%, classify 팔레트 정합·지붕색 POI 미검출) → 파이프라인 REGIONS 등록 → `public/data/hometown/hometown_home.json`(48×32, POI 0). **`HOMETOWN_MAP_GRAPH`**(엣지 없음 = 4방 경계 이동 불가) REGION_MAP_GRAPHS 등록.
- **[core 신규] `types/HomeBase.ts`** (index.ts export): ① **MapObject 인스턴스 스키마**(instanceId/type/tx·ty/fw·fh/collides/interact/movable/removable/placedByPlayer/itemId/specId — 나무·바위=벌목·채굴 예약, 문·버스 트리거) + **WorldObjectState**(removedIds/moved/placed) + `effectiveObjects()`(초기 − removed + moved + placed) ② **칸 단위 배치**: PlacementRule(footprint/allowedTerrain/scope) + `canPlaceAt()`(칸별 판정 — 프리뷰용 cells 반환) + PLACEMENT_DEFS(텃밭 4×3 잔디만/울타리 1×1/활어수조 3×2/관상수조 2×1 실내전용) ③ **수족관 2종 스키마**(AquariumSpec — live_commercial freshnessMult 0.1 / ornamental·AquariumState 골격) ④ HouseTier(0 원룸→1 평수+주방→2 지하→3 2층) ⑤ TransportProfile + `computeTravelFare`(일괄 ₩10,000 — 자전거는 필드 이동수단이라 불포함) + HOMETOWN_OBJECTS(초기 19개 — 문/버스/우물/선착장/나무11/바위2/갯바위2)·HOMETOWN_SPAWN(집 문 앞 23,9). tuning: `travel(10000/귀가0)/save.allowedTags(['hometown_interior'])/hometown`.
- **[client] RegionFieldScene 홈타운 통합**: 오브젝트 유효 상태 산출→**blocked 그리드 선반영**(병합 충돌·걷기·스폰 판정 공유, fillWallRects 추출로 재베이크 지원)→파라메트릭 오브젝트 텍스처(나무/바위/우물/선착장/버스/문/울타리/텃밭/수조 — 실사 에셋 교체 자리)→근접 [E] 힌트/상호작용(문→실내 pause+launch·버스→전국지도·벌목/채굴/채집/보트=추후 안내). **설치 모드**: 인벤 '설치하기'(placement-request 이벤트) → 그리드 오버레이 + footprint 프리뷰(**초록=가능/빨강=불가**) → 클릭 설치(아이템 1 소모·placed 등록·markDirty·충돌 재베이크) / 우클릭·ESC 취소 / **[E] 회수**(아이템 반환 — 이동 = 회수→재설치로 충족, 드래그 이동은 후속). InvItem.placeKey + 설치형 시드 4종(텃밭 키트/울타리 x6/수조 2종) + `recoverPlaceable`.
- **[client 신규] HomeInteriorScene** (game.ts 등록): Tier 0 원룸 12×10 파라메트릭 렌더(침대 저장★+협탁/냉장고/아일랜드/소파/러그+고양이/서랍장/선반/화분/하단 문/지하실·평수 확장 예약 표기) — 간이 AABB 이동 + **[E] 침대 = [저장하고 쉬기]/[그냥 쉬기]**(유일한 디스크 저장 지점) + 문/ESC = stop+resume 복귀. 가구는 MapObject 스키마(이동/배치 스탠바이 — 이번엔 정적).
- **[client] 저장 정책 (SavePolicy)**: `GameState.locationTag`(씬 진입 시 설정) + `canSaveHere()`(TUNING.save.allowedTags) + **`save()` 게이트**(불가 위치 false 반환 — 일시정지 메뉴 '저장하기'가 "집 침대에서만" 안내) + `markDirty()/isDirty`. **구 자동 save() 8곳 제거**(Cook×3/Fishing/NightHunting/TackleRoom/Trap×2 → markDirty) + MainMenu 종료 자동저장 제거(미저장 경고 문구) + 일시정지 '타이틀 화면' 미저장 2단 확인. `startNewGameInSlot`은 saveToSlot 프리미티브 직접 사용(게이트 없음).
- **[client] 출조 플로우**: 새 게임/이어하기 → **RegionFieldScene(hometown) 집 문 앞 스폰**(구 WorldMapScene 직행 폐지). WorldMapScene `enterFieldArea` 확정 지점에 **교통비 차감**(computeTravelFare — 부족 시 토스트+차단) + 좌상단 **[집으로 돌아가기]**(귀가 무료) + 홈타운 버스정류장 [E] → 전국 지도. SaveData에 `worldObjects` 영속.
- **[검증 — 전 항목 PASS]**: 새게임 스폰 (23,9) 문 앞·오브젝트 19·바다/집/우물/나무 차단·엣지 없음 / 필드 저장 거부 → 실내 진입(pause+launch·tag hometown_interior) → **침대 저장 OK + dirty 해제** → stop+resume 복귀 / 설치: 잔디 OK·바다/집/길 불가·설치 2건(텃밭 비충돌·울타리 충돌·키트 소모·겹침 금지)·**씬 재시작 영속**·회수(아이템 반환+충돌 해제) / 요금: 15,000→5,000 차감·속초 진입·지역 저장 거부·부족(5,000) 차단·귀가 무료. 스크린샷 = 홈타운 필드(집·우물·선착장·버스)/실내 원룸/설치된 텃밭·울타리.
- **[설계 노트]** 초기 오브젝트는 JSON objects 배열 대신 **core TS 데이터(HOMETOWN_OBJECTS)** — 타입 안전 + 파이프라인 재생성 없이 조정 가능(타 지역 오브젝트 확산 시 JSON 스키마 이관 검토). 실내는 파라메트릭(타일맵 JSON 아님 — HouseTier.interiorMapId가 교체 자리).
- **[후속 수정 2건 (사용자 피드백)]** ① **실내 캐릭터 스프라이트 교체** — HomeInteriorScene 플레이어가 임시 Rectangle(파란 몸통+살색 머리 = "이상한 픽셀")이던 것을 RegionFieldScene와 동일한 실제 스프라이트(`man-idle/move-{front/back/left/right}`, 4방향 + 2프레임 200ms 걷기 + 발밑 그림자·표시높이 정규화)로 교체 + **주방 추가**(좌측 상단 코너 — 냉장고·싱크대(개수대+수도)·가스레인지 2구, interact 'cook' core 신설, "요리는 U 도마 — 추후 실내 연결" 안내). ② **인벤토리 선택 요약에 남은 시간 병기** — InventoryPanel 하단 요약("이름 · 소분류 · 신선도")에 **"· 다음 상태까지 HH시 MM분 SS초"** 추가(compactRemain — 상위 0단위 생략, 종착=`종착 상태`, 시계정지=`변질 정지`) + **1초 주기 실시간 카운트다운**(freshnessTimer 연동, summaryItemId 추적 — 다른 안내로 전환 시 해제). 검증: 실내 man 스프라이트 렌더+주방 3종 표시 / 잿방어 요약 "다음 상태까지 02시 59분 59초→58초" 카운트다운.
- 잔여(차기): 아트 폴리시(집 스프라이트·계절감), 울타리 제작(재료→제작) 시스템, 실내 가구 배치 모드(스키마 완비 — 배선만), 수조 패널(넣기/꺼내기/판매 — AquariumState 골격 완비), 벌목/채굴/텃밭 농사/보트 본구현, 하우스 Tier 1~3, 주방↔CookScene/도마 실내 연결, 침대 수면=날짜 진행/피로 회복 결합(로드맵 4·5), 민박 저장 태그 확장.

**이전 변경 (2026-07-28 43차) — 회뜨기 머리따기 이후 진행 불가 수정 (자동 방향 전환·먹통 방지·회칼 소프트 페널티·키보드)** (SASHIMI_STAGE_FLOW_FIX_SPEC — core 시뮬 + Playwright 실마우스 17스테이지 완주 검증, 빌드 4/4·typecheck 0):
- **[원인 확정]** ① `ButcheryProcess.advance()`가 단계를 넘겨도 방향을 유지("client가 버튼으로 전환") + 모든 submit이 `canAct()`(현재방향==요구방향) 게이트로 **조용히 실패**, `drawGuide`도 불일치 시 가이드 숨김 → 수동 방향 전환을 놓치면 "가이드도 없고 클릭도 안 먹는" 먹통. 머리따기 이후 요구 방향이 연쇄 전환(FLIP→BELLY_UP→BACK_DOWN→FLESH_UP)이라 여기서 도드라짐 ② `knifeLocked()` 하드 입력 차단(회칼 미보유 시 장뜨기 벽) ③ 키보드 미구현.
- **[핵심 수정 — 자동 방향 전환]** `advance()`가 다음 스테이지 요구 방향으로 **자동 스냅**(`TUNING.butchery.autoOrient` 기본 on). 클라이언트는 `renderedOrientation`(화면 표시 방향) 분리 + **뒤집기 연출**(`playFlipAnim` — 가로 접힘 220ms, 접힌 시점에 새 방향 교체, 연출 중 `flipping` 입력 가드) 후 리렌더. 수동 방향 버튼/키는 학습용 유지.
- **[먹통 방지 (autoOrient off/수동 이탈 대비)]** ① `drawGuide` 불일치 시 숨김 → **고스트(α0.28) 표시** ② 생선 영역 클릭 시 조용한 무시 → **플래시 안내**("먼저 [○○] 방향으로 뒤집으세요 — F키/[뒤집기]") ③ 사이드바 **원터치 뒤집기 대형 버튼**(요구 방향 스냅). 입력이 무반응인 상태가 존재하지 않음.
- **[회칼 하드월 → 소프트 페널티]** `knifeLocked()`를 `TUNING.butchery.knifeHardLock`(기본 false) 게이트로 — 회칼 없어도 **막칼 폴백 진행**(computeFilletYield 기존 null→수율 0.85) + **등급 '특' 캡 = '상'**(core 신규 — 회칼 없이 특급 사시미 불가 고증) + 사이드바 "회칼 없음 — 막칼로 손질 중" 안내 + [통마리로 마무리] 선택지 유지(강제 아님). 회칼 3종 상점 편입은 기완료(41차 B6) — 잠금 안내가 가리키던 구매처 실존.
- **[키보드]** `F`/`Space` = 요구 방향 뒤집기 · `1~5` = BASE/FLIP/BELLY_UP/BACK_DOWN/FLESH_UP 직접 · `Enter` = 세척/얼음물 확정. 사이드바 키 힌트 표기, destroy 시 해제. (RegionHud '[ENTER] 대화'는 플레이스홀더 텍스트라 충돌 없음 확인.)
- **[tuning.ts]** `butchery.autoOrient(true)/flipAnimMs(220)/knifeHardLock(false)` + META 슬라이더(flipAnimMs).
- **[검증]** ① core 시뮬: 감성돔(21스테이지)·광어(29)·방어(21) **수동 전환 0회 완주** + 등급 캡(야나기바 특/무회칼 상·수율 475→367g) ② **Playwright 실마우스 E2E**: 무회칼 상태로 탭·트레이스 컷·문지르기·박피 당김·Enter 세척 전부 실입력 — **17스테이지 완주(canAct 실패 0)**, 머리따기 이후 BELLY_UP/BACK_DOWN/FLESH_UP 자동 전환 확인, 필렛 x2(상) 지급 ③ 불일치 테스트(autoOrient off): 클릭 → 플래시 안내 PASS, F키 → 방향 스냅 PASS. 스크린샷 = BACK_DOWN 단계 정상 조작 + 결과(상등급·막칼 폴백).
- 잔여(차기): 부록 좌표 일관성(방향별 가이드·입력 변환 통일)은 실플레이에서 특정 방향 컷 실패 관찰 시 별도 이슈로, 1~5 방향키가 탑다운 퀵슬롯(1~8)과 공유되는 문제(패널 모달 중 퀵슬롯 하이라이트 변경 — 무해하나 정리 여지).

**이전 변경 (2026-07-28 42차) — 어종 이미지 에셋 연동(대구·잿방어 텍스처 + 문어 2종 분화 대문어/참문어)** (사용자 에셋 13종 추가 — 대부분 기연동, 신규 4종 배선 + 문어 분화. 브라우저 텍스처·어획 이미지 검증 완료, 빌드 4/4·typecheck 0):
- **[배경] 사용자 제공 13종 중 9종은 이미 연동됨** (41차/38차 — 까치복·꽁치·학꽁치·붕장어·먹장어·갯장어·보리멸·성대·양태). 신규 배선 필요분: **태평양 대구(pacific_cod)·잿방어(greater_amberjack)** 텍스처 미로드 + **문어 2종 분화**.
- **[텍스처 배선 4종]** `public/fish/`에 pacific_cod·greater_amberjack·common_octopus·giant_pacific_octopus.png 복사 → BootScene `load.image` 4건(`fish_pacific_cod`/`fish_greater_amberjack`/`fish_octopus`/`fish_giant_octopus`) + FISH_TEXTURE 맵 4건. 검증: 4 텍스처 로드(대구 1592×656 등) + 어획 팝업 실사 이미지 정상.
- **[문어 2종 분화]** 구 단일 `octopus`(문어) → **참문어(돌문어)** + **대문어(피문어)** 2종:
  - `octopus` = **참문어(돌문어)** (Octopus vulgaris, 남해·서해 소형·최대 ~4kg) — nameKo 개명, 텍스처 `common_octopus.png`(얼룩덜룩 소형), maxCm 65·weightFactor 0.018. speciesId 유지(egi spawnBinding·Economy·KOSIS 참조 보존).
  - `giant_octopus` = **대문어(피문어)** 신규 (Enteroctopus dofleini, **동해 냉수대 대형·개체 편차 큼**, minCm 30~maxCm 200·weightFactor 0.006) — 오라클·FISH_DATABASE·Economy(weightExp 0.5로 대물 가격 폭증 완화)·egi spawnBinding·KOSIS('문어'/'대문어') 등재. 손질 분류 = **cephalopod**(egiOnly 파생 — 손질 스텁 유지). 검증: 대문어 판매가 초대형 48kg 279k(폭증 완화)·소형 13.6k.
  - **⚠ 파일명↔어종 매칭 정정**: 사용자 메시지의 영문 파일명 페어링(대문어=common_octopus / 참문어=giant_pacific_octopus)이 **이미지 내용·크기 설명과 반대**여서(common_octopus.png=얼룩 소형=참문어 / giant_pacific_octopus.png=적갈색 대형=대문어) **이미지 내용 + 사용자 설명(대문어=동해·대형, 참문어=소형) 기준으로 연결**. 영문 통칭 혼동으로 판단 — 필요 시 텍스처 1줄 스왑으로 정정 가능(BootScene 주석 표기).
- **[후속 수정 — 어획물 이미지 폴백(2단)]** 사용자 리포트("잿방어 인벤/상세 이미지 미표시") 원인 = **텍스처 배선(42차) 전에 낚은 구세이브 어획물은 `iconTexture`가 비어** 이미지 대신 emoji/공백(신규 캐치는 정상 렌더됨을 브라우저 확인). 해결: FP 씬의 `FISH_TEXTURE`/`resolveFishTexture`를 **공용 모듈 `data/FishTextures.ts`로 추출**(FP 씬 import) + `iconTexture` 없거나 미로드 시 **`item.speciesId`로 텍스처 폴백 해소** 를 두 렌더 경로 모두에 적용:
  - ① **`createItemIcon`**(인벤/상점/퀵슬롯 소켓 소형 아이콘) — 검증: iconTexture 없는 잿방어도 speciesId('greater_amberjack')로 Image 렌더(구 emoji→Image).
  - ② **`ItemDetailPanel` 대형 생선 이미지**(상세보기 헤더 아래) — 이건 createItemIcon과 별도 경로라 42차 폴백에 안 잡혀 **잿방어 상세보기에만 큰 이미지가 통째로 빠져 있던 것**(방어는 정상, 사용자 캡처로 발견). `fishTexKey` 폴백 해소로 수정 — 검증: iconTexture 없는 잿방어 상세보기에 대형 이미지(196×69) 렌더(방어 패널과 동일 레이아웃).
  - ③ **`ShopPanel` 상점 셀** — 사용자 재지적("상점에서는 연동 안 됨"). 원인: `renderCell`이 `{icon, iconTexture, name, ...}` **부분 DTO만 넘겨 speciesId가 유실** → createItemIcon 폴백 불발(인벤은 되는데 상점만 emoji). 구매/판매 탭 셀에 **`speciesId`/`lengthCm` 전달** 추가 — 검증: iconTexture 없는 잿방어/대구 상점 판매 셀에 fish_ 텍스처 렌더.
  - ④ **`makeFishPreview`**(도마 프리뷰·드래그 고스트) — iconTexture 없으면 파라메트릭 폴백만 하던 것을 **speciesId 실사 폴백** 우선으로 보강(구세이브 어획물도 도마에 실사 표시).
  - **[전수조사]** 모든 아이콘 렌더 경로 점검 완료 — createItemIcon 8개 호출처(InventoryPanel·RegionHud 퀵슬롯·CoolerPanel[toInvItem에 speciesId 포함]·UtilizationPanel 임베드·ItemDetailPanel 소형·ShopPanel[수정]·밑밥셀[N/A]) + 직접 iconTexture 경로(ItemDetailPanel 대형[수정]·makeFishPreview[수정]·FP 캐치팝업[resolveFishTexture 직접]·ButcheryPanel[파라메트릭 설계]) 전부 확인. speciesId만 있으면 낚은 시점 무관하게 어종 이미지 표시.
  - ⚠ 잔여: 잿방어 원본 PNG가 초광폭(1729×608)이라 소형 아이콘이 34×12 얇게 보임(전 광폭 어종 공통 — 별도 아이콘 크롭/사이징은 차기).
- 잔여(차기): 대문어 동해 지역 스폰 가중(현재 habitat/수심 기반, region 하드게이트 없음), 두족류 전용 손질 트리(현재 cephalopod 스텁), MAFRA '문어' 시세를 대문어에도 tier 연동(현재 대문어는 Economy 기본단가 폴백).

**이전 변경 (2026-07-27 41차) — 회뜨기 도마 본격화 (DnD 전 어종 확장·파라메트릭/실사 프리뷰·손질 형태 분류·CookScene 일원화)** (SASHIMI_BOARD_DND_SPEC Phase A+B — 브라우저 렌더·family 검증 완료, 빌드 4/4·typecheck 0):
- **[신규 core] `ButcheryFamily` + `getButcheryFamily(speciesId)`** (`types/Butchery.ts`·`db-schema/ButcheryProfiles.ts` — index.ts export): 손질 형태 4분류 `finfish`(round/flat 프로필 = 삼면/다섯장뜨기 FSM 구현) / `cephalopod`(오라클 **egiOnly** 파생 — 오징어·문어·갑오징어, 스텁) / `pufferfish`(**speciesId 'puffer' 규칙** — 복섬·참복·까치복, 자격·독 스텁) / `unsupported`(붕장어 등 프로필 미정). **하드코딩 최소화** — 두족은 egiOnly 의미 태그, 복어는 id 규칙에서 파생. `BUTCHERY_FAMILY_NOTICE`(안내 문구) 동반. 검증: 감성돔/방어/광어/대구/갈치=finfish · 오징어/문어/갑오징어=cephalopod · 복섬/참복/까치복=pufferfish · 붕장어/미지정=unsupported.
- **[신규 client] `FishTemplateRenderer.ts`** — 파라메트릭 생선 템플릿 공용 렌더러(ButcheryPanel.drawFish의 본체 로직을 **회귀 없이** 추출): `drawFishTemplate(g, geom, profile, colors, state)`(FSM 상태 주입 — 방향/머리분리/비늘/개복/필렛) + `makeFishPreview(scene, {speciesId, iconTexture, boxW, boxH})`(**실사 iconTexture 있으면 실사 Image, 없으면 파라메트릭 Graphics 컨테이너**) + `FISH_COLORS`/`getFishColors`. ButcheryPanel은 도마 배경만 그리고 이 렌더러 호출 — 미니게임·도마 프리뷰·드래그 고스트가 **동일 소스** 사용. **[B1] round/flat 시각 구분**: 납작형(광어)은 몸통 폭↑(0.84W)·눈 위쪽 편위(−0.30) 반영.
- **[개편 client] 도마 DnD 전면 확장** (`UtilizationPanel.renderCooking`/`renderEmbeddedInventory` + 헬퍼): ① **[A5] 드래그 자격** = 구 "실사 이미지 4종만" → **finfish 전체(~24종) + cephalopod**(복어/미지원은 드래그 불가). 고스트도 `makeFishPreview` 폴백(실사/파라메트릭) ② **[A4] 도마 프리뷰** = `makeFishPreview`로 실사 없는 어종도 파라메트릭 생선 표시(대구=파라메트릭 렌더 확인) ③ **[A6] 드롭 게이트** = finfish/cephalopod 올림·복어/미지원 차단+토스트. **손질 시작** 버튼은 finfish만 활성, 두족은 회색+준비중 안내 ④ **[A7] 빼기 양방향** = 도마 생선을 도마 밖으로 드래그하면 내려감(+기존 '내리기' 버튼) ⑤ **[A8] 교환** = 점유 중 새 생선 드롭 = 교체("교환됨" 플래시, 손질 진행 중이면 ConfirmDialog) ⑥ **[A9] 드롭존 하이라이트** = 드래그 중 도마 위 hover 시 초록 테두리. 전용 헬퍼 `overBoard`/`spawnDragGhost`/`dropFishOnBoard`/`trySwapBoard`/`flashBoardToast` + destroy 정리.
- **⚠️ [드래그 방식 교정 — 41차 후속(2026-07-28)]** 초기 구현이 Phaser 네이티브 `setInteractive({draggable})`를 썼으나 **dev 실플레이에서 드래그가 전혀 안 됨** (사용자 리포트). **실측 진단**(실 마우스 드래그): `dragstart`는 발화하나 `drag`/`dragend`가 **한 번도 안 옴** — **scrollFactor 0 화면고정 UI + 스크롤 카메라(RegionFieldScene) 조합에서 Phaser drag 업데이트가 월드좌표 불일치로 죽는 알려진 이슈**. 해결: 밑밥 탭이 이미 쓰던 **커스텀 포인터 방식**(cell `pointerdown`→씬 레벨 `pointermove`/`pointerup` 추적)으로 교체 — `startCookDrag(item, 'add'|'remove', p)` + `onCookDragMove`(6px 임계 초과 시 고스트 생성·하이라이트)/`onCookDragUp`(드롭/내리기, 이동 없으면 클릭=선택). 인벤 셀·도마 grab 모두 네이티브 draggable 제거. **검증(실 마우스 드래그)**: 농어→도마 PASS / 통조림(비어획물)→차단 PASS / 문어→교환 PASS / 도마→밖=내리기 PASS + 클릭 선택 유지. ⚠️ **규칙**: DraggablePanel(scrollFactor 0) 계열 UI의 드래그는 **네이티브 draggable 금지, 커스텀 포인터 방식 사용**(헤더 드래그·밑밥·도마 모두 이 방식).
- **[B2 core] flat 가이드 문구 보강** (`ButcheryProcess.buildButcheryStages`): 다섯장뜨기 스테이지가 "중앙선 기준 반신 경계 칼집 → 중골 위 분리 → 상·하 양측 반복"으로 명확화(round는 기존 삼면뜨기 문구 유지). 사이드 라벨 "다섯장뜨기 N/M장". 죽은 `filletPairs` 제거.
- **[B4 client] 스테일 제거**: 구 "추후 정식 구현 예정 / 회칼 미보유 / 실사 4종만" 모순 안내문 삭제 → 실제 흐름 안내(삼면/다섯장뜨기·복어·두족류 준비중·활어회 등급)로 교체.
- **[B5 client] CookScene 일원화** (`showProcessingPanel`): 옛 3단계 가짜 손질 체크리스트(비늘→내장→포뜨기 흉내) 제거 → "회뜨기는 요리(U) 도마에서 진행" 안내 + 조리 진행 버튼. 미사용 `processingSteps`/`currentStepIndex`/`FishProcessingStep` 정리.
- **[B6 확인] 회칼 경제 = 이미 완비**: KnifeDatabase 3종(막칼/회칼/야나기바) 전부 식자재마트 카탈로그 등록(15k/45k/150k) + `knife_sashimi` 기본 지급 + ButcheryPanel이 `getBestKnife(InventoryStore.items)` 실게이트 사용 중 — 추가 작업 불필요.
- **[A10 설계 노트] tuning.butchery 생략**: 스펙의 cephalopodIds/pufferIds는 **데이터 파생(egiOnly·id 규칙)으로 대체**해 id 리스트 튜닝 자체가 불필요. swapConfirm(진행 중 확인)·실사 우선 프리뷰는 합리적 기본값으로 baked. 순수 렌더 토글을 core tuning에 넣지 않음.
- 잔여(차기): 두족류 손질(눈 위 신경·먹물·다리)·복어 손질(자격/독·목줄째) 실로직, 회썰기(두께/각도) 인터랙션, 부산물(중골/머리/껍질) 활용 트리, 두족류 전용 프리뷰 템플릿(현재 기본 원형어로 폴백), 가이드 팝업 round/flat 2케이스 삽화(B3 — 기존 guide_butchery PNG 유지, 신규 삽화 생성은 후속).

**이전 변경 (2026-07-27 40차) — 어획물 이미지 개체 크기 반영(어획 팝업 + 인벤 상세보기)** (사용자 피드백 1건 — 브라우저 수치·스크린샷 검증 완료, 빌드 4/4·typecheck 0):
- **[신규 core] `fishImageSizeScale(speciesId, lengthCm)`** (`SizeTierRules.ts` — index.ts export): 개체 길이를 어종 "보통 사이즈"와 비교해 **소형은 작게 / 대형·특대는 크게** 보이는 표시 배율(1.0 = 보통). 기준 길이(ref) = tier 등재 어종(방어 등)은 **중형 밴드 중앙**(`SIZE_TIER_BOUNDS` 평균), 그 외는 **FISH_DATABASE avgSizeRangeCm 중앙값**. 비대칭 커브(소형 지수 0.38·대형 0.55) + [0.80, 1.35] 클램프. 미등록 어종/길이 0 = 1.0 안전값.
- **[배선] 어획 팝업 이미지** (`FirstPersonFishingScene`): `fishDisplaySize(src, refW, refH, capW, capH, sizeMul)` 공용 헬퍼 — 보통 개체를 refBox(264×107)에 맞춘 뒤 sizeMul 곱, capBox(360×146)로 레이아웃 보호. `buildDecisionPanel`(쿨러/인벤/방생 결정 + 보관 후 안내)·`showResultPanel`(방생·결과)에 `imgScale` 인자 배선, `onLanded`/`showCatchDecisionPanel`에서 `fishImageSizeScale`로 산출·전달. 다관점 히트 추가 어획은 팝업 이미지 없음(텍스트만)이라 무관.
- **[배선] 인벤토리 상세보기 이미지** (`ItemDetailPanel`): 어획물 이미지에 동일 로직(refBox 228×90, capBox 300×120 — imgH 126 슬롯·W 320 패널 안). `item.speciesId`/`lengthCm` 있을 때만 적용.
- **[설계] 단조 증가 + 캡**: 소형<보통<대형<특대 순으로 이미지가 커지되(각 tier 구별), capBox로 팝업/텍스트/패널 경계는 절대 안 넘음. 보통은 refBox 기준(구 full-box 대비 ~82%)이라 대형·특대가 구 "현재" 크기를 상회. **검증(방어 fish_yellowtail)**: 어획 팝업 소형30cm 213w → 보통52cm 263w → 대형80cm 333w → 특대120cm 356w(단조·특대/소형 1.67배, 패널 460w 안) / 상세 184w→227w→287w→300w(특대 폭 300·높이 106 ≤ 캡). 스크린샷 = 소형 컴팩트·특대 패널 폭 채움, 제목/본문/버튼 겹침 없음.
- 잔여(차기): 상세보기 신선도 실시간 카운트다운은 이미지 스케일과 독립(기존 유지), 손질/회뜨기 패널의 생선 렌더는 파라메트릭(bodyRatio)이라 별개.

**이전 변경 (2026-07-25 39차) — 어획물 즉시 부패 버그(오프라인 신선도 정지) + 상태별 판매가 배율 + 방어류 시세 실측 반영** (사용자 2건 피드백 — 브라우저 수치 검증 완료, 빌드 4/4·typecheck 0):
- **[치명 버그 수정] 어획물 즉시 부패 = 오프라인 wall-clock 감쇠**: `CoolerStore.deserialize`가 `lastSyncMs`를 저장시각으로 두고 `sync()`로 **저장~로드 실경과(wall-clock) 전체를 적용** → 상온 활어→부패가 ~10.2시간이라, 하루 뒤(또는 dev 반복 로드) 재접속 시 방금 넣은 어획까지 전부 부패로 점프. **오프라인(게임 종료) 중엔 신선도 정지**로 변경 — deserialize에서 오프라인 갭만큼 `lastSyncMs`·`mediumSetAtMs`를 앞으로 밀어 경과 미적용(매질 잔여시간 보존). **InventoryStore도 동일** — `savedAtMs` 필드 신설, 로드 시 각 아이템 `conditionSinceMs`를 갭만큼 밀어 정지. 신선도는 **활성 플레이 중에만** 진행. 검증: 24h 전 저장 로드 → 쿨러·인벤 둘 다 활어 유지.
- **[상태별 판매가 배율]** (`conditionSellMultiplier` 신설 + `getSellPrice` 배선): **활어/신선 = 각각 활어/선어 시세**(getWholesaleCache tier — 데이터 구분 없으면 동일) · **냉장/냉동/해동 = 선어 동일(1.0)** · **보통 = 50%** · **나쁨 = 10%** · **부패 = 0(판매 불가)**. `getSellPrice`가 `evaluateFishSellPrice`(경락 API 캐시/기본단가) × 상태배율. 검증(2kg 방어): 활어=신선=냉장=냉동 46,600 / 보통 23,300 / 나쁨 4,660 / 부패 0.
- **[시세 API tier 구조]** `WholesalePriceInfo.tier?('live'|'fresh')` + `getWholesaleCache(id, tier)` — API가 활어/선어 분리 제공 시 tier 매칭, 단일(구분 없음)이면 공통 적용. 현재 MAFRA는 단일/Mock이라 활어=선어 동일가(사용자 규칙 "구분 없으면 동일").
- **[방어류 시세 폭증 완화 — weightExp]** 방어 오라클 meanCm 90cm(≈8.7kg)인데 구 모델(kg단가×무게×등급×크기 이중곱)이 **359,000원**(실측 중형 4.5만의 8배!) 산출. `AuctionMappingDef.weightExp`(기본 1=선형) 신설 — `price ∝ weightKg^weightExp`. 방어 exp 0.4·sizeFactor 0.15·단가 27,000 → **소형 1kg 28,620원(실측 2.5~3만 부합)·전형 8.7kg ~9만**(폭증 해소). 부시리/잿방어/삼치도 대형이라 sub-linear 적용. 검증(방어 크기별): 0.3kg 15k·1kg 28.6k·2kg 46k·4kg 62k.
- 잔여(차기): 방어 실측은 소형~중형 마리당 평탄(step)인데 게임은 크기 비례 스케일 유지(게임성) — 완전 평탄화는 미적용. 활어/선어 실데이터 분리(MAFRA fish_live/fish_fresh 동시 수집) 연동, 오프라인 정지의 매질 만료 UI 표기 점검.

**이전 변경 (2026-07-25 38차) — 어종 11종 추가·졸복→복섬·볼락 다종화 + 침강 물리 rev2(라인각 모델) + 수심뷰 라인각 텍스트 오버플로 + 텍스트 전수조사** (사용자 4건 피드백 + 웹서치 리서치 3건 — 브라우저 검증 완료, 빌드 4/4·typecheck 0):
- **[신규 어종 11종 — 에셋+DB 4계층]** (`food assets/` → `public/fish/` 11장): 기존 오라클 有 4종 텍스처만(삼치 spanish_mackerel·붕장어 conger_eel·갯장어 pike_conger·꽁치 pacific_saury) + **졸복→복섬 개명** + **신규 6종 풀 DB**(까치복 yellowfin_puffer·양태 bartail_flathead·성대 bluefin_searobin·먹장어 hagfish·학꽁치 halfbeak·보리멸 northern_whiting). 각 종 **오라클(ORACLE_FISH_DB)+FISH_DATABASE(도감)+FISH_TEXTURE/BootScene+SEAFOOD_AUCTION_MAPPING(판매가)** 4계층 등록. 실측 데이터(FishBase/국립수산과학원) 웹서치 — 서식지형·수심층·미끼선호·크기·야행성·파이팅·목줄절단(복어류) 반영. 오라클 43→49종. **검증**: 신규 7종 전부 스폰 가능, 양태 66.5cm 어획 팝업 실사 이미지 정상, 텍스처 11장 로드 확인.
- **[졸복→복섬 개명]** 표준명 이슈 — 구 `fine_puffer`(졸복어) → `grass_puffer`(복섬, Takifugu alboplumbeus). 오라클·FISH_DATABASE·ExternalDataStore(KOSIS '복' 매칭) 3곳 일괄. 소형 항·방파제 복어, lineCutter·독 유지.
- **[볼락 다종화 검증 + 정확화]** 오라클엔 이미 볼락류 5종(볼락 dark_banded·조피볼락/우럭 black·황볼락 golden·청볼락 blue·열기/불볼락 red_snapper) — **인게임 실제로 5종 분화 스폰 확인**(암초 야간 4천 스폰: dark_banded 503·열기 441·황볼락 138·청볼락 102·조피 15). 리서치 정정: **황볼락 = Sebastes owstoni**(불볼락 thompsoni와 별종), 수심 15→20~90m 심화, 법정 금지체장(근거 없음) 제거 / **조피볼락 야행성 완화**(nightBonus 1.4→1.2 — 텔레메트리상 강한 야행성 아님), 수심 3~100m. 오라클·FISH_DATABASE 정합.
- **[침강 물리 rev2 — 라인각 모델]** (`computeSinkRate` 재작성 — 37차 이진 임계 모델 폐기): 구 모델은 **10g 지그헤드(softPlastic weff 6.25g < thr0 8) → 무조류에서도 못 가라앉던 버그** + `cur01` 클램프가 약~강조류를 전부 1로 뭉갬. 실측 리서치(약조류<0.2m/s→10g도 바닥, 스윕 온셋 10g@0.3·30g@0.6·60g@1.0) 반영 → **라인각 θ 모델**: `tanθ = angleK·curMps / Weff^weightExp`(경량·강조류일수록 θ↑), `v_sink = v_terminal(무게 약비례)·cosθ`, θ≥sweptAngle(72°)면 표층 흐름(swept). 호출부 raw m/s 전달(클램프 폐기). **검증(수치)**: 약조류 0.05~0.15 → 10g v 0.51→0.33(침강) / 0.4 → 10g swept·30g+ 침강 / 0.82(사리) → 60g만 — 리서치 온셋 정합. 게임 조류 조금(0.04~0.12)~사리(0.8+) 범위라 약조류에서 10g 침강 복원. TUNING.sink 재정의(angleK/weightExp/sweptAngleDeg/vTermRefMps/vTermWeightExp) + META 슬라이더.
- **[수심뷰 라인각 텍스트 오버플로 (P1)]** (`renderDepthPanel` 우측 텍스트 열): `depthValsText`(x=1152, wordWrap 없음)에 "라인각 ~80° · 못 뚫음(쓸림)"(~145px)이 패널 우측(1266)을 넘쳐 화면 밖으로 삐짐 — **라벨 단축**("~80° 쓸림"/"52° 적정") + **wordWrap(열 폭 108px)** 추가. 검증: 스윕 상태 텍스트 우측 끝 1232 ≤ 1266.
- **[텍스트 전수조사 (감사 에이전트)]** P2 EnvironmentHUD(tide/lunar, wordWrap 200) · P3 TideWidget(물때 라벨, wordWrap 92) · P4 CoolingBoxPanel(신선도/무게 우측정렬로 조리버튼 침범 방지) 수정. ⚠ **신규 규칙 §4 추가**: 모든 텍스트 컴포넌트는 컨테이너 경계 밖으로 나가지 않게 wordWrap/우측정렬/단축 처리 + 코딩 시 전수 검수.
- 잔여(차기): 볼락류 전용 텍스처(현재 청볼락/황볼락만 이미지, 조피·볼락·열기는 폴백), 침강 depth 의존(얕은 물 얕은 침강 완화), 신규 어종 손질 프로필(ButcheryProfiles) 확장.

**이전 변경 (2026-07-24 37차) — 루어/봉돌 침강 물리 (조류 세기 × 유효무게 → 중력)** (LURE_SINK_PHYSICS 반영 — 3케이스 수치 재현 PASS, 빌드 4/4·typecheck 0):
- **[신규 core] `computeSinkRate(cur01, weightG, bodyType, threshMult)`** (`UnderwaterSinkPhysics.ts`): 무게가 조류 임계 `Wthr = thr0 + thrSlope·cur01`(약19/중41/강63)를 뚫어야 가라앉는다. **유효무게 Weff = Wg / dragC**(유선형일수록 잘 뚫음). Weff ≤ Wthr → **swept(표층 유지 + 조류 방향 쓸림)** / 초과 → **종단속도 포화 침강** `vT·(1−e^(−(Weff−Wthr)/scaleG))`. 라인각 `78 − 30·(Weff/Wthr − 1)` 클램프(45~60=적정). `SinkRateResult{swept, sinkRateMps, lineAngleDeg, weffG, wthrG}`.
- **[신규 core] `lureBodyType(kind)`** (`LureRig.ts`): 루어 kind → `SinkBodyType`(metalJig/minnow/egi/softPlastic). 봉돌 채비는 'sinker'(dragC 0.7 — 잘 뚫음).
- **[배선 client] `updateDrift` 침강 교체**: 고정 sinkRate 폐기 → **루어(무게=`getLureRigWeightG`)·봉돌 채비(무게=`getSinkerWeightG` 신설)** 모두 `computeSinkRate` 소비. stepUnderwater 수직 침강은 `baitZ=prevZ`로 취소(수평 드리프트만 유지 — 이중적용 방지). 조류 존은 `threshMult = 1/influence.sinkMult`로 임계에 반영(조경지대=임계↓). swept 시 `baitX/floatX += tide.x·sweptDriftK·dt` 표층 쓸림. 플로팅 루어는 기존 부력(리트리브 파고듦/부상) 유지.
- **[HUD] 라인각 표기** (수심 패널): `라인각 52° · 적정 무게`(45~60) / `무게 충분(수직)`(≤45) / `무게 부족`(>60) / `~80° · 못 뚫음(쓸림)`. 수직뷰 채비 형태(단일 루어 하강 / 봉돌+목줄 트레일)는 기존 baitX/baitZ 렌더가 이미 반영.
- **[tuning.ts] `sink` 섹션** + `SinkBodyType` 타입: thr0(8)/thrSlope(55)/scaleG(25)/currentRefMps(0.45)/dragC/vTerminal/reelAngleDeg(45)/sweptDriftK(1.0) + META 슬라이더 8종. **검증(수치)**: 약+50g softPlastic → 0.35m/s(~10s) / 중+50g softPlastic → swept(0) / 중+50g 봉돌 → 1.13m/s(~8s) — 3케이스 정합.
- 잔여(차기): 다운샷(봉돌 위 바늘) hookAboveSinker 데이터 훅, 로드 Max weight 초과 페널티, 카탈로그 루어 무게/종류 밴드 재배정, 라인각 수직뷰 각도 정밀 렌더.

**이전 변경 (2026-07-24 36차) — FP 조작 개편(←/→ 채비 이동·파이트 홀드 ↑) + 초릿대 색/가이드 + 인벤 신선도 실시간 + 뷰 폴리시** (사용자 7건 피드백 반영 — 빌드 4/4·typecheck 0):
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
2. **`docs/wiki/README.md`** 대시보드 → **건드릴 시스템의 `docs/wiki/02-SYSTEMS/*.md`**(§4 과제·§5 잔여·§6 함정) 확인
3. `IMPLEMENTATION_PLAN.md` 확인 — 현재 단계와 다음 작업 파악
4. `npx pnpm run build`로 현재 빌드 상태 확인
5. 빌드 오류 먼저 수정 후 새 기능 구현
6. 새 기능 추가 후 반드시 `npx pnpm run build` + `typecheck`로 검증
7. **작업 완료 시 스킬 `work-log` 절차 실행** — 워크로그 1건(8절) → 시스템 페이지 갱신 → `04-BACKLOG.md` → **`IMPLEMENTATION_PLAN.md`·이 파일 §9는 요약 3~5줄 + 링크**
