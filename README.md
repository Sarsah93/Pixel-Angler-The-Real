# Pixel Angler The Real — Pixel-Perfect Korean Sea Fishing Simulator

> **2D 픽셀 퍼펙트 한국 해양 낚시 시뮬레이터 + 생활 경영 RPG**
> PC (Tauri v2 데스크톱 앱) · 추후 Steam 출시 목표

실제 지형 지도, 실측 연안 수심, 물때(1~15물), 공공 OpenAPI(바다낚시지수·경락 시세·어획량 통계)를
게임 물리에 직접 연동하는 **리얼리즘 낚시 시뮬레이터**입니다.

---

## 핵심 시스템 (구현 현황)

### 월드 & 필드
| 시스템 | 상태 | 설명 |
|---|---|---|
| 전국 지도 → 지역 줌인 | ✅ | 픽셀 전국 지도에서 지역 핀 클릭 → 이음새 없는 확대 전환. 미개방 지역 잠금 |
| 출조 구역 선택 | ✅ | 지역 확대 지도의 구역 핀(속초항/동명항) → 출조 확인 → 필드 진입 |
| 실지형 타일맵 필드 | ✅ | 실제 지형 지도를 색상 분류한 탑다운 타일맵 (속초 7맵 체인, 엣지 전환) |
| 건물 & 상점 | ✅ | 편의점/식자재마트/직판장/음식점/카페/주점 — 구매·판매, 수량/확인 팝업, 시세 연동 |
| HUD | ✅ | HP·피로도·시계·날씨 / 실지형 미니맵(M 3단계) / 퀵슬롯 8칸 / 이벤트 로그·채팅(멀티 대비) |

### 낚시 파이프라인 (1인칭)
```
탑다운 조준 캐스팅 ──→ 착수 (z ≤ 0) ──→ 1인칭 낚시 뷰 ──→ 파이팅 ──→ 랜딩/실패
  마우스 각도 + 파워          실측 수심 반영         침강·조류·정렬도        텐션 0~100
  3D 탄도(바람/중력)          여 밭 판정            뒷줄견제(H)·밑밥(C)     어종별 저항 패턴
```
| 모듈 (`@tra/core`) | 역할 |
|---|---|
| `CastingPhysicsEngine` | 완력×파워×조준 3D 탄도, 바람 편향, 그림자/찌 이원화 렌더 규약 |
| `UnderwaterSinkPhysics` | 침강 V=(W−B)/(C×(1+k·유속)), 조류 드리프트, 면사매듭/바닥 안착 |
| `LineTensionPhysics` | 뒷줄견제 제동·양력, 목줄 정렬도 A(0~1) |
| `ChumPhysics` | 밑밥 투척·확산·3차원 동조율 |
| `BiteProbabilityEngine` | P = P_base × M_지형 × (1+k·A) × M_리액션 × M_밑밥, 밑걸림 판정 |
| `FishSpawningOracle` | **어종 마스터 21종** (서식지/수심/미끼 선호/성전환/금어기/물때 활성도) |
| `FightingPhase` | 텐션 상태 머신 — 바늘털이/여박기/횡이동 어종별 패턴, 탈출 공식 |

- 낚시 실패 시 유형별 **채비 손실** (미끼 털림/목줄 터짐/찌 터짐/밑걸림) → 재장착 후 캐스팅
- 낚싯대는 **손 좌/우 착용** + 퀵슬롯 선택이 모두 되어야 캐스팅 가능

### 인벤토리 & 장비
- 카테고리 탭(장비/소모품/음식/낚시용품/기타) × 5x5 소켓, 드래그 앤 드랍 이동
- 우클릭 액션: 상세보기 / 착용(왼손·오른손) / 채비하기 / 퀵슬롯 등록 / 버리기
- 활용(U) 창: 채비 조립(원줄→면사매듭→찌→도래→목줄→봉돌→바늘·미끼) + 요리(예정)
- 스테이터스(S) / 장비(E) 창, 모든 팝업 드래그 이동·ESC LIFO 닫기

### 실데이터 연동
| 데이터 | 원천 | 게임 반영 |
|---|---|---|
| 물때 (1~15물) | 음력 계산 (`TideCalculator`) | 조류 세기, 어종 활성도 |
| **연안 수심** | 국립해양조사원 1/25,000 연안정보도 SHP | 캐스팅 거리→실측 수심 (속초항/동명항 프로필, 범위 초과 시 거리 비례 외삽) |
| **바다낚시지수** | 해양수산부 국립해양조사원 OpenAPI | 입질 확률 P_base ×0.7~1.4 |
| **경락 시세** | 농정원 도매시장 OpenAPI | 직판장 어획물 매입가 ×0.5~2.0 |
| **어획량 통계** | KOSIS 시도별 어종별 | 지역별 어종 스폰 가중 ×0.7~1.8 |

> 모든 외부 API는 스타트업 1회 수집 → 메모리 캐시 참조 구조이며, 실패 시 Mock 폴백으로 오프라인에서도 정상 구동합니다.

### 저장 & 메뉴
- 메인 메뉴: NEW GAME / LOAD GAME — **저장 슬롯 3개** (메타 표시, 덮어쓰기·삭제 2단계 확인)
- 인게임 ESC 일시정지 메뉴: 계속하기 / 저장하기 / 전국 지도 / 타이틀 화면

### 생활 콘텐츠 (기존 FieldScene 계열)
해루질(H) · 통발(T) · 요리(C) · 면허(L) · 조과첩/어종 도감 · 식당 경영 · 선상 콘도

---

## 조작 (RegionFieldScene 기준)

| 키 | 기능 |
|---|---|
| `방향키` | 이동 (맵 최외곽에서 방향키 유지 시 인접 맵 전환) |
| `좌클릭 유지` | 캐스팅 조준(마우스 각도)·차지 → 놓으면 발사 |
| `E` | 건물 거래 / 장비 창 |
| `I` / `S` / `U` | 인벤토리 / 스테이터스 / 활용(채비·요리) |
| `M` | 미니맵 크기 순환 |
| `1~8` | 퀵슬롯 |
| `ESC` | 팝업 LIFO 닫기 → 일시정지 메뉴 |

1인칭 낚시: `H` 뒷줄견제 · `C` 밑밥 · `좌클릭` 릴링 · `SPACE` 재캐스팅 · `ESC/그만하기` 복귀

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 언어 | TypeScript 5.8 (strict, noUnusedLocals) |
| 게임 엔진 | Phaser 3.90 (pixelArt 모드) |
| 빌드 | Vite 6 (client) · tsc (core/server) · Turborepo 2 + pnpm 9 |
| 데스크톱 | Tauri v2 (예정) |
| 멀티플레이 | Express + Socket.IO (예정) |
| GIS 파이프라인 | Python 3 표준 라이브러리 (지형 분류 / SHP 수심 변환) |
| Node.js | ≥ 20 |

---

## 모노레포 구조

```
Pixel Angler The Real/
├── packages/
│   ├── core/        @tra/core      순수 TS 게임 엔진 (Phaser/DOM 금지)
│   │   ├── simulation/             물때·입질·캐스팅·수중·파이팅·오라클 등 물리 엔진
│   │   ├── api-client/             공공 OpenAPI 통합 수집 (Mock 폴백 내장)
│   │   ├── db-schema/              어종·장비·스팟·레시피 등 DB
│   │   └── types/                  공용 타입 (수심 프로필, 채비, 경제 등)
│   ├── client-pc/   @tra/client-pc Phaser 씬 + UI + 전역 상태(GameState)
│   │   └── public/data/            타일맵 JSON · 수심 프로필 JSON · 에셋
│   ├── server/      @tra/server    멀티플레이 서버 (예정)
│   └── map-builder/ @tra/map-builder GIS 타일 파이프라인
├── apps/tauri-wrapper/             데스크톱 패키징 (예정)
├── tools/
│   ├── build_region_maps.py        실지형 PNG → 타일/콜리전 JSON
│   └── build_depth_profiles.py     연안정보도 수심 SHP → 거리별 수심 프로필 JSON
├── pixelazed/                      지역 실지형 픽셀 지도 원본
└── .agents/                        AI 에이전트 지침 + 구현 계획서
```

---

## 시작하기

```bash
# 요구사항: Node ≥ 20, pnpm ≥ 9
npx pnpm install

# 개발 서버 (Phaser 게임)
npx pnpm --filter @tra/client-pc run dev   # → http://localhost:5173

# 전체 빌드 / 타입 체크
npx pnpm run build
npx pnpm --filter @tra/client-pc run typecheck
```

### 데이터 파이프라인 재생성
```bash
py tools/build_region_maps.py sokcho    # 지형 지도 → 타일맵 JSON
py tools/build_depth_profiles.py        # 수심 SHP(09.수심.zip) → 수심 프로필 JSON
```

### API 키 (선택 — 없으면 Mock으로 동작)
| 변수 (.env) | 발급처 | 용도 |
|---|---|---|
| `VITE_DATA_GO_KR_API_KEY` | data.go.kr | 바다낚시지수 · 경락 시세 |
| `VITE_KOSIS_API_KEY` | kosis.kr | 시도별 어종별 어획량 |
| `VITE_KMA_API_KEY` / `VITE_KHOA_API_KEY` | 기상청 / 해양조사원 | 날씨 · 조위 |

---

## 씬 아키텍처

```
Boot → MainMenu (저장 슬롯) → WorldMap (전국 → 지역 줌인 → 구역 선택)
                                  ↓ scene.start
                             RegionFieldScene (실지형 타일맵 허브)
                                  ↓ pause + launch          ↺ 맵 간 엣지 전환 (restart)
                             FirstPersonFishingScene (1인칭 낚시)
                                  └ stop + resume → 필드 복귀 (위치 보존)

FieldScene (레거시 허브) → Fishing / NightHunting / Trap / Cook / TackleRoom / ...
```

> 규칙: 하위 씬에서 `scene.start(허브씬)` 금지 — 반드시 `scene.stop()` + `scene.resume()` (상세: `.agents/AGENTS.md`)

---

## 로드맵

- [ ] 요리(삼면뜨기 손질) 정식 구현 · 낚싯대 채비 모딩 뷰
- [ ] 어종 21종 실사 픽셀 이미지 확충 (현재 감성돔/광어)
- [ ] 여수 등 지역 확장 (타일맵 + 수심 프로필 + 잠금 해제)
- [ ] 어종 DB · 인벤토리의 API/코어 DB 정식 통합
- [ ] 멀티플레이 (낚시터 공유 · 토너먼트)
- [ ] Tauri 패키징 → Steam

## 문서

- `.agents/AGENTS.md` — 아키텍처·코딩 규칙 (AI 에이전트 필독)
- `.agents/IMPLEMENTATION_PLAN.md` — 단계별 구현 현황 및 차기 과제
