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
| 영역기반 라이브 필드 레이아웃 엔진 | `client-pc/src/data/SpotFieldLayouts.ts` |
| 포항 영일만 픽셀 지형 맵 데이터 | `client-pc/src/data/YoilBayFieldMap.ts` |
| 조류/수심 픽셀 시각화 렌더러 | `client-pc/src/ui/HydroCurrentRenderer.ts` |
| 월드맵 핀포인트 노드 타입 + DB | `core/src/types/WorldMap.ts` |
| WorldMapScene 전면 개편 (픽셀 지도 + 동적 핀 + 툴팁) | `client-pc/src/scenes/WorldMapScene.ts` |
| FieldScene 캐릭터 스프라이트 교체 (man/girl 에셋) | `client-pc/src/scenes/FieldScene.ts` |
| 에셋 이미지 공개 디렉토리 구성 | `client-pc/public/` |
| 지역 상세 타일맵 타입 + 맵 그래프 | `core/src/types/RegionMap.ts` |
| 실지형 지도 → 타일/콜리전 변환 도구 | `tools/build_region_maps.py` |
| RegionFieldScene (속초 7개 맵 타일 렌더+충돌+전환+캐스팅) | `client-pc/src/scenes/RegionFieldScene.ts` |
| 속초 지역 타일 데이터 (7개 맵 JSON) | `client-pc/public/data/sokcho/` |

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

## 9. 현재 빌드 상태 (2026-07-20 기준)

```
npx pnpm run build → ✅ 4/4 패키지 성공 (2026-07-20)
npx pnpm --filter @tra/client-pc run typecheck → ✅ 0 오류 (2026-07-20)
```

**최근 주요 변경 (2026-07-20 6차) — 1인칭 낚싯대 재설계(좌/우 로드·릴) + 입질 연출 완화 + UI 가시성** (헤드리스 브라우저 렌더 검증):
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
