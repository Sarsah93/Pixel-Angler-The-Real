# 🎣 The Real Angler — Pixel-Perfect Korean Sea Fishing Simulator

> **2D 픽셀 퍼펙트 해양 낚시 시뮬레이터 + 생활 경영 RPG**
> PC (Tauri v2 기반 데스크톱 앱) · 추후 Steam 출시 목표

---

## 게임 핵심 기획

### 장르 & 콘셉트
한국 남해/서해 실제 조위 관측소 데이터와 기상청 API를 연동한 **리얼리즘 낚시 시뮬레이터**.  
단순한 낚시 미니게임이 아닌, 물때·날씨·어종 생태를 반영하는 **생활 경영 RPG** 를 목표로 합니다.

### 핵심 시스템
| 시스템 | 설명 |
|---|---|
| **물때 & 조위** | 국립해양조사원(KHOA) API 기반 실제 간조/만조 시각 연동. 음력 기반 물때(1~15물) 계산 |
| **낚시 시뮬레이션** | 어종별 입질 패턴, 시간대·수온·날씨 보정, 캐스팅 거리/정확도 모델 |
| **라인 물리** | 줄 장력, 드랙 설정, 파이팅 체력 소모 시뮬레이션 |
| **해루질** | 야간 갯벌 채집 시스템 (야광 조명, 생물 분포, 채집 성공률 연산) |
| **통발** | 통발 배치 → 시간 경과 → 회수 수확. 배치 수역/수심/미끼에 따라 어획 결정 |
| **요리 & 제작대** | 낚은 어획물로 음식 제조. Green Hell 스타일 드래그 앤 드롭 제작 (CraftScene 예정) |
| **식당 경영** | 요리 판매, 메뉴 구성, 방문객 만족도 기반 수익 시뮬레이션 |
| **라이선스 시스템** | 낚시 면허(해수·민물), 해루질 면허, 통발 면허별 해금 콘텐츠 분기 |
| **퀘스트 & 로그** | 튜토리얼/일일/생활 퀘스트, 어획 이력 기록 및 어신앱 스팟 연동 |
| **멀티플레이** | 낚시터 공유, 토너먼트, 실시간 플레이어 위치 동기화 (Phase 6 예정) |

### 이동 & 필드
- **탑다운 바람의나라 스타일** 4방향 자유 이동 (월드 크기: 2048×1536px)
- 구역: 심해·낚시 포인트·통발 수역·방파제·마을·갯벌
- 건물 6종: 낚시점 / 마트 / 식당 / 면허사무소 / 민박(세이브) / 어판장
- `[E]` 키 근접 상호작용 + 건물별 씬 전환

### 단축키 (FieldScene 기준)
| 키 | 기능 |
|---|---|
| `방향키` | 캐릭터 이동 |
| `WASD` | 예약 (향후 별도 기능 할당) |
| `SPACE` / `ENTER` | 낚시 포인트 진입 |
| `E` | 건물/NPC 상호작용 |
| `H` | 해루질 |
| `T` | 통발 관리 |
| `C` | 요리 (CookScene) |
| `U` | 제작대 (CraftScene 구현 전까지 CookScene 임시 연결) |
| `L` | 면허 패널 |
| `I` | 인벤토리 |
| `Q` | 퀘스트 저널 |
| `M` | 미니맵 크기 전환 (150 → 250 → 350px 순환) |
| `1`~`8` | 퀵슬롯 |
| `ESC` | 팝업 LIFO 닫기 → 마지막은 월드맵 복귀 |
| 마우스 클릭 | 클릭 위치로 자동 이동 |

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| **언어** | TypeScript 5.8 (strict mode) |
| **게임 엔진** | Phaser 3.90 |
| **빌드** | Vite 6 (client), tsc (core/server) |
| **모노레포** | Turborepo 2 + pnpm 9 workspace |
| **데스크톱 패키징** | Tauri v2 |
| **멀티플레이 서버** | Express 4 + Socket.IO 4 |
| **Node.js 요구** | ≥ 20.0.0 |
| **pnpm 요구** | ≥ 9.0.0 |

---

## 모노레포 구조

```
the-real-angler/
├── packages/
│   ├── core/          @tra/core    — 순수 TS 게임 엔진 (렌더링 코드 금지)
│   ├── client-pc/     @tra/client-pc — Phaser 3 + Vite 클라이언트
│   └── server/        @tra/server  — Socket.IO 멀티플레이 서버
├── apps/
│   └── tauri-wrapper/ @tra/tauri-wrapper — Tauri v2 데스크톱 패키징
├── .agents/           — AI 에이전트 작업 지침 및 구현 계획서
├── tsconfig.base.json — 전체 공통 TypeScript 설정
└── turbo.json         — Turborepo 태스크 파이프라인
```

### 패키지 역할

**`@tra/core`** — 순수 게임 로직
- 시뮬레이션: `TideCalculator`, `FishBiteEngine`, `LinePhysics`, `CastingModel`, `WeatherModel`, `NightHuntingEngine`, `TrapSystem`
- DB 스키마: `FishDatabase`, `GearSpecs`, `SpotDatabase`, `BaitDatabase`, `ShoreCreatureDatabase`, `TrapDatabase`, `RecipeDatabase`, `QuestDatabase`, `AnglerAppSpots`
- 타입: `PlayerState`, `InventoryState`, `Activities`, `License` 등

**`@tra/client-pc`** — Phaser 씬 및 UI
- 씬: Boot → MainMenu → WorldMap → Field → (Fishing / NightHunting / Trap / Cook / TackleRoom / AnglerLog / Restaurant / Condo / TideChart)
- UI 컴포넌트: `HUD`, `MiniMap`, `LicensePanel`, `InfoOverlayPanel`, `CoolingBoxPanel`, `EnvironmentHUD`, `BiteIndicator` 등
- 전역 상태: `GameState` (싱글톤)

**`@tra/server`** — 멀티플레이 백엔드
- Express REST + Socket.IO WebSocket
- 낚시터 공유, 토너먼트, 환경 데이터 프록시 (Phase 6 예정)

**`@tra/tauri-wrapper`** — 데스크톱 래퍼
- Tauri v2 기반 Steam 패키징 (Phase 7 예정)

---

## 개발 환경 설정

### 사전 요구사항
```bash
node --version   # v20 이상
pnpm --version   # v9 이상
```

### 초기 설치
```bash
git clone <repo>
cd the-real-angler
pnpm install
```

### 환경 변수 설정
```bash
cp .env.example .env
# .env 파일에서 API 키 입력 (없어도 Mock 데이터로 동작)
```

필요한 API 키:
| 변수 | 발급처 | 필수 여부 |
|---|---|---|
| `PUBLIC_DATA_API_KEY` | data.go.kr | 권장 (없으면 Mock) |
| `KMA_API_KEY` | apihub.kma.go.kr | 권장 (없으면 Mock) |
| `KHOA_API_KEY` | khoa.go.kr | 권장 (없으면 Mock) |

### 개발 서버 실행
```bash
# client-pc 개발 서버 (Phaser 게임)
pnpm dev:client
# → http://localhost:5173

# 멀티플레이 서버 (별도 실행)
pnpm dev:server
# → http://localhost:4000 / ws://localhost:4001
```

---

## 빌드 & 검증

```bash
# 전체 빌드 (core → client-pc → server → tauri-wrapper)
pnpm build

# core만 빌드
pnpm --filter @tra/core run build

# client-pc 타입 체크
pnpm --filter @tra/client-pc run typecheck

# 전체 타입 체크
pnpm typecheck
```

### 현재 빌드 상태 (2026-07-08 기준)

```
pnpm run build                                   → ✅ 3/3 패키지 성공
pnpm --filter @tra/client-pc run typecheck       → ✅ 0 오류
```

---

## 씬 전환 아키텍처

```
Boot → MainMenu → WorldMap
                     ↓ scene.start (페이드)
                  FieldScene  ← 탑다운 허브 (pause 유지)
                     ↓ pause + launch (페이드)
          ┌──────────┼──────────────────┐
     FishingScene  NightHuntingScene  TrapScene
     CookScene     TackleRoomScene    AnglerLogScene
     RestaurantScene  CondoScene      CraftScene (예정)
          └──────────────── stop + resume('FieldScene')
```

> **규칙**: 하위 씬에서 `scene.start('FieldScene')` **절대 금지** — 반드시 `scene.stop()` + `scene.resume('FieldScene')` 사용

---

## 에이전트 작업 지침

`.agents/AGENTS.md` — 모든 AI 에이전트가 작업 전 반드시 읽어야 하는 규칙 및 코딩 컨벤션  
`.agents/IMPLEMENTATION_PLAN.md` — 전체 구현 단계별 계획 및 미구현 항목 추적
