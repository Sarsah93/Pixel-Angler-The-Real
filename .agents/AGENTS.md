# The Real Angler — 에이전트 작업 지침서

> **이 파일은 반드시 모든 AI 에이전트가 작업 시작 전 읽어야 합니다.**
> 이 프로젝트는 복잡한 피처 구현을 포함하므로, 하나의 LLM 세션이 끊겼다가 다른 LLM이 이어받는 경우에도 **아키텍처와 코딩 규칙이 절대 변경되어서는 안 됩니다.**

---

## 1. 프로젝트 개요

**The Real Angler** — 2D 픽셀 퍼펙트 해양 낚시 시뮬레이터

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

### 🚧 구현 진행 중 / 미완료
상세 내용은 `IMPLEMENTATION_PLAN.md` 참고

---

## 6. FieldScene 탑다운 월드 구조 (2026-07-07 재설계)

FieldScene은 **바람의나라 스타일** 탑다운 4방향 이동 씬으로 전면 재설계됨:

- **월드 크기**: 2048 × 1536 픽셀 (TILE 16px 기준)
- **이동**: WASD + 방향키, 대각선 정규화 (0.707 보정)
- **카메라**: `startFollow(playerBody)` + `setBounds(0, 0, 2048, 1536)`
- **플레이어**: `physics.add.image` (충돌 바디) + `add.graphics` (픽셀 스프라이트 직접 드로우)
- **구역 배치** (`ZONES` 상수):
  - 심해(상단), 낚시 포인트 3개, 통발 수역, 방파제 수평띠, 마을, 갯벌
- **건물** (`BUILDINGS` 상수): 낚시점/마트/식당/면허사무소/민박/어판장
- **근접 상호작용**: 건물에 60px 이내 접근 시 `[E]` 힌트 팝업 표시
- **씬 전환**: `pause + launch` 방식 (위 씬 전환 패턴 참고)

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

## 9. 현재 빌드 상태 (2026-07-07 기준)

```
npx pnpm run build → ✅ 3/3 패키지 성공
npx pnpm --filter @tra/client-pc run typecheck → ✅ 0 오류
```

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
