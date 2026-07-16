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

## 9. 현재 빌드 상태 (2026-07-14 기준)

```
npx pnpm run build → ✅ 4/4 패키지 성공 (2026-07-15)
npx pnpm --filter @tra/client-pc run typecheck → ✅ 0 오류 (2026-07-15)
```

**최근 주요 변경 (2026-07-16 2차, 최신)**:
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
