# The Real Angler (픽셀 앵글러 더 리얼)

> **하이퍼 리얼리즘 2D 도트 바다 낚시 시뮬레이터**
> TypeScript · Phaser 3 · Tauri v2 · Turborepo Monorepo

---

## 📁 프로젝트 구조

```
the-real-angler/
├── packages/
│   ├── core/          # 순수 TS 게임 엔진 (시뮬레이션 로직, DB 스키마, API 클라이언트)
│   ├── client-pc/     # PC/Steam 클라이언트 (Phaser 3 + Vite)
│   └── server/        # 멀티플레이 백엔드 (Express + Socket.io)
└── apps/
    └── tauri-wrapper/ # Steam 패키징용 Tauri v2 래퍼
```

## 🚀 시작하기

### 사전 요구사항
- Node.js >= 20
- pnpm >= 9
- Rust (Tauri 빌드 시)

### 설치 및 실행

```bash
# 패키지 매니저 설치
npm install -g pnpm

# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력 (없으면 Mock 데이터로 자동 대체)

# 개발 서버 전체 기동
pnpm dev

# 개별 패키지 기동
pnpm dev:client    # Phaser 클라이언트 (localhost:5173)
pnpm dev:server    # 백엔드 서버 (localhost:4000)
```

## 🎣 주요 기능

| 시스템 | 설명 |
|---|---|
| 실시간 환경 동기화 | 기상청·해양조사원·공공데이터청 API 일일 연동 (물때, 수온, 파고) |
| 하드코어 채비 시스템 | 찌낚시/원투/지깅/카드채비 등 장르별 직접 채비, 장비 제원/스펙 DB |
| 코어 낚시 메커니즘 | 찌 어신 UI, 라인 텐션 게이지, 드랙 조절의 2D 심리전 손맛 |
| 앵글러 라이프 | 현지 횟집 손질 시스템, 출조지 마트 부재료 구매 |
| 토너먼트 | 실제 대회(거제 벵에돔 등) 방식 고증의 인게임 낚시 대회 |
| 멀티플레이 (예정) | WebSocket 기반 동시 출조, 방파제 옹기종기 동기화 |

## 🛠️ 기술 스택

| 레이어 | 기술 |
|---|---|
| 게임 렌더러 | [Phaser 3](https://phaser.io/) (Canvas 2D, 픽셀 퍼펙트) |
| 언어 | TypeScript 5.x (전 스택) |
| 모노레포 | [Turborepo](https://turbo.build/) + pnpm workspaces |
| 클라이언트 빌드 | [Vite](https://vitejs.dev/) |
| Steam 패키징 | [Tauri v2](https://tauri.app/) (경량 Rust 래퍼) |
| 백엔드 | Node.js + Express + Socket.io |
| 테스트 | [Vitest](https://vitest.dev/) |

## 📡 연동 API

| API | 용도 | 발급처 |
|---|---|---|
| 공공데이터포털 | 바다낚시터 정보 | [data.go.kr](https://www.data.go.kr/) |
| 기상청 (날씨허브) | 날씨, 풍속, 강수 | [apihub.kma.go.kr](https://apihub.kma.go.kr/) |
| 국립해양조사원 | 조위, 수온, 파고 | [khoa.go.kr](https://www.khoa.go.kr/) |

> 💡 `.env.example` 복사 후 API 키 없이 `VITE_USE_MOCK_DATA=true`로 개발 가능

## 📦 패키지 스크립트

```bash
pnpm build          # 전체 빌드
pnpm typecheck      # 전체 타입 체크
pnpm test           # 전체 테스트
pnpm lint           # 전체 린트
pnpm clean          # 빌드 산출물 및 node_modules 정리
```

---

*개발자: 실제 낚시꾼 출신 개발자의 하드코어 시뮬레이터*
