# 1. 전체 구조 · 화면 정의 · 기능 분해도

> 코드 실측 기준(2026-08-06, `a67a7e8`). 화면 해상도 **1280 × 720** (FIT 스케일, 픽셀아트 내부 렌더 + present만 스무딩).

---

## 1.1 모노레포 · 레이어

```
apps/tauri-wrapper        데스크톱 패키징 (Phase 9 — 아이콘만 준비)
packages/
  core        @tra/core       순수 TS. 규칙·물리·DB. ★ Phaser/DOM 금지
    ├ types/        17종   계약(타입) — 확정 타입 임의 변경 금지
    ├ db-schema/    23종   정적 데이터 (어종·장비·손질 프로필·아이템…)
    ├ simulation/   29종   판정 엔진 (물때·입질·파이트·손질·밑밥·수율…)
    ├ api-client/   10종   공공 API + Mock 폴백
    ├ config/       tuning.ts (TUNING / TUNING_META — F8 슬라이더 원천)
    └ index.ts             ★ 신규 파일은 반드시 여기서 export
  client-pc   @tra/client-pc  Phaser 3 씬 + UI. 로직은 core에서 import만
    ├ scenes/  19종  씬 (+ SceneFade 공용 안전망)
    ├ ui/      33종  패널·HUD·렌더러 (DraggablePanel 계열)
    ├ store/    7종  세션 상태 싱글톤 (GameState 외)
    └ data/    11종  구운 스프라이트 스냅샷 · 카탈로그 · 텍스처 매핑
  server      @tra/server     Socket.IO 멀티 (Phase 8 미착수)
  map-builder @tra/map-builder GIS 타일 파이프라인
tools/        생성기(py/cjs) — 타일맵·수심·픽셀화·스프라이트
docs/         reference(원본 데이터) · mockups(가이드 SVG) · wiki(이 문서)
```

**의존 방향은 단방향**: `client-pc → core`. core가 client를 알면 안 된다(§AGENTS 8-1).

---

## 1.2 데이터 흐름 (런타임)

```
 [공공 API 5종] ──fetchAll()(메인 메뉴 1회)──► ExternalDataStore ─┐
                                                                 │ 캐시만 참조
 [세이브 슬롯 3]──GameState.loadFromSlot()──► GameState ◄─────────┤
                                              │  ▲               │
              InventoryStore / CoolerStore ───┘  │               │
              FridgeStore / EnvironmentStore     │               │
                     │                           │               │
                     ▼                           │               ▼
             ┌───────────────────────────────────┴──────────────────┐
             │  Phaser 씬 (렌더·입력)  ──질의──►  core 판정 엔진      │
             │  RegionField / FP낚시 / 패널들      (결과만 되받음)     │
             └───────────────────────────────────────────────────────┘
```

- **저장 시점은 집 침대 1곳** (`GameState.canSaveHere()` + `locationTag`). 그 외 씬은 `markDirty()`만.
- 신선도는 **절대 시각(`conditionSinceMs`) lazy 계산** — 오프라인(게임 종료) 구간은 정지.

---

## 1.3 씬 그래프 (현행 경로)

```
BootScene ──► MainMenuScene ─┬─► [게임 시작] → 슬롯 → RegionFieldScene(hometown)
                             ├─► AnglerLogScene(도감)   ┐
                             ├─► SettingsScene          │ pause+launch, returnScene 지정
                             └─► CreditsScene           ┘

RegionFieldScene(hometown) ──[E] 버스정류장──► WorldMapScene ──지역 선택(교통비)──► RegionFieldScene(region)
        │                                          └──[집으로 돌아가기](무료)──► hometown
        ├──[E] 집 문──► HomeInteriorScene      (pause + launch / stop + resume)
        ├──캐스팅 착수──► FirstPersonFishingScene (pause + launch / stop + resume)
        └──ESC──► 일시정지 메뉴(계속·저장·집으로 가기·타이틀)

[레거시 경로] FieldScene ─► FishingScene / TackleRoom / TideChart / NightHunting / Trap /
                            Restaurant / Condo / Cook      (탑다운 구버전 — 유지만)
```

**전환 규칙**(위반 시 상태 초기화·검은 화면) → 스킬 `scene-transition`
- 하위 씬에서 `scene.start('FieldScene')` **금지** — `scene.stop()` + `scene.resume()`.
- 페이드아웃 대기는 `scenes/SceneFade.ts`의 `fadeOutThen()` 경유(폴백 타이머 + 이중 실행 가드).
- 재진입 가드(`isTransitioning`)는 **create()에서 리셋**, 비용 차감은 가드 통과 후.

---

## 1.4 화면 정의서

| 씬 키 | 역할 | 진입 | 복귀 | 주 UI | 상태 |
|---|---|---|---|---|---|
| `BootScene` | 에셋 프리로드(어종·손질·trimmings·가이드) | 자동 | — | — | 🟢 |
| `MainMenuScene` | 타이틀·슬롯·도감/설정/출처 | 자동 | — | 뷰 스택(main→start→slots) + API 상태 패널 + 티커 | 🟢 |
| `WorldMapScene` | 전국 지도·지역 핀·출조 결제 | 홈타운 버스 / ESC | 홈타운·메인 | 지역 리스트·핀 툴팁·확인 팝업 | 🟢 |
| `RegionFieldScene` | **주 필드** 탑다운(타일맵·이동·캐스팅) | 월드맵/새 게임 | — (top-level) | `RegionHud`(시계·날씨·미니맵·퀵슬롯·로그) | 🟢 |
| `HomeInteriorScene` | 집 실내(침대 저장·냉장고·주방) | 필드 문 [E] | stop+resume | `FridgePanel` | 🔶 |
| `FirstPersonFishingScene` | **1인칭 낚시**(입질·챔질·파이트·밑밥) | 캐스팅 착수 | stop+resume | 수심 패널·수평뷰·쿨러·가이드 | 🟢 |
| `AnglerLogScene` | 도감(어종 12종/페이지) · 조과 기록 | 메인 메뉴 | returnScene | 페이징·실사 카드 | 🟢 |
| `SettingsScene` | 조작/낚시 탭(로드·릴 방향) | 메인 메뉴 | fadeOutThen | 섹션 2열 단축키표 | 🟢 |
| `CreditsScene` | 공공데이터 출처·저작권 | 메인 메뉴 | fadeOutThen | — | ✅ |
| `FieldScene` | 레거시 탑다운 월드 | 레거시 | — | `HUD`/`MiniMap`/`InfoOverlayPanel` | 🔶 유지 |
| `FishingScene` | 레거시 찌 낚시 + 파이트 | FieldScene | stop+resume | `FishingFocusWindow` | 🔶 유지 |
| `NightHuntingScene` | 해루질 | FieldScene `H` | stop+resume | — | ⬜ 확장 예정 |
| `TrapScene` | 통발 | FieldScene `T` | stop+resume | — | ⬜ |
| `CookScene` | 요리(현재 안내 + 진행 버튼) | FieldScene `C` | stop+resume | — | ⬜ 실조리 미구현 |
| `RestaurantScene` / `CondoScene` / `TackleRoomScene` / `TideChartScene` | 레거시 건물 | FieldScene | stop+resume | — | 🔶 |

### 주요 팝업(패널) — z-order 밴드
| 밴드 | depth | 대상 | 규칙 |
|---|---|---|---|
| 일반 | `[800, 899)` | 인벤토리·장비·상점·쿨러·상세보기 | 클릭 = 동적 최상단(피어 max+1), 모달 밴드 침범 금지(캡 898) |
| 모달 | `[900, ∞)` | 손질·회썰기·가이드·확인/수량 다이얼로그 | dim이 아래 입력 흡수, dim = depth−1 |

ESC는 **시각적 최상단(depth 최고)** 팝업부터 닫는다(동률이면 LIFO). 상세 → 스킬 `ui-panel`.

---

## 1.5 기능 분해도 (L1 도메인 → L2 시스템 → L3 기능)

범례: ✅완결 🟢운영 🔶부분 🚧진행 ⬜미착수

```
A. 낚시 루프
   A1 캐스팅            🟢 조준 탄도·바람편향·착수판정 / 육지 차단(릴링 경로 레이캐스트) / 장비 게이트
   A2 채비              🟢 9소켓(원줄→매듭→부력찌→수중찌→도래→목줄→봉돌→바늘→미끼) / 루어 병렬 / 편대(원투)
   A3 침강·조류         🟢 라인각 모델(무게×조류) / 조류 5존 / 지형 관통 클램프 / 뒷줄견제 홀드
   A4 입질              🟢 BiteSequenceEngine 3단계·패턴 7종 / 피딩타임 배율 / 밑밥 3D 동조
   A5 챔질·파이트       🟢 우클릭 챔질(5/20/100%) / 텐션 30~80 / 2D 측면하중·로드 스티어 / 피로 페이즈
   A6 어획 처리         🟢 3선택지(쿨러/인벤/방생) / 도감 등록 / 크기 등급
   A7 밑밥              🟢 배합(재료→물→섞기) / 파슬 3D 확산·코팅 / 투척점 스냅
   A8 필드 이벤트       🟢 보일링·스쿨링(육지 거리 규칙·착수 보너스)
   A9 어탐 레이더       ⬜ SeabedProfile 조회 기반 예정

B. 손질·조리                                    ← ★ 현재 작업 축
   B1 어류 손질         🟢 섹션→작업→스테이지 3층 / 자유 순서 / 부산물 즉시 지급 / 체크포인트
      B1a 돔류·방어류   ✅ 마감(70차)
      B1b 넙치류        🔶 다섯장뜨기 완료, F9 좌표 5종·등쪽 실사 잔여
   B2 두족류 손질       🚧 준비 완비 / **트리 미착수**(4종)
   B3 복어 손질         ⬜ License 게이트 필요
   B4 회썰기            🟢 일반 14컷(탑뷰) / 고급 16컷(측면) / 엔가와 2컷
   B5 플레이팅          🟢 접시 4종·4방위·회전 / 모듬·단품 가격식
   B6 불요리·스시       ⬜ 화구·용기 시스템 선행

C. 아이템·경제
   C1 인벤토리          🟢 카테고리 5탭 × 5×5 소켓 / 드래그 이동 / 우클릭 메뉴
   C2 장비              🟢 인체 배치형(머리4·좌6·우6·다리6) / 착용품 그리드 이탈 / 드래그 장착
   C3 보관·신선도       🟢 8단계 상태 그래프 / 쿨러 매질(해수·얼음) / 냉장고 정지
   C4 상점              🟢 6종 건물 / 구매·판매 탭 / 윈도우드 스크롤
   C5 시세·판매가       🟢 경락 API + 등급·길이·상태 배율
   C6 세이브            🟢 슬롯 3 + 집 침대 전용 저장

D. 월드
   D1 전국 지도         🟢 11노드 / 지역 잠금 / 교통비
   D2 지역 타일맵       🔶 속초7·부산8·홈타운1 (파이프라인 py)
   D3 홈베이스          🔶 실내 Tier0 / 칸 단위 설치 / 수조·농사 미구현
   D4 환경              🟢 KST 시계·조명·날씨 파티클·물때

E. 플랫폼·인프라
   E1 UI 프레임워크     🟢 DraggablePanel(드래그·X·z-order) / TextFit / 윈도우드 목록
   E2 씬 전환 안전망    🟢 SceneFade
   E3 가이드 허브       🟢 4카테고리 19페이지 · 최초 1회 자동
   E4 튜닝             🟢 TUNING + F8 슬라이더 + 스냅샷
   E5 검증 하네스       🟢 Playwright(설치 Chrome) + `__INV`/`__GS`
   E6 배포             🔶 gh-pages(73차 dist에서 정지) · Tauri ⬜
   E7 멀티            ⬜
```

---

## 1.6 와이어프레임 (핵심 3화면)

### (a) `RegionFieldScene` — 탑다운 필드 (1280×720)
```
┌──────────────────────────────────────────────────────────────┐
│ [HP/피로] [KST 시계] [날씨 2×2]                  ┌──────────┐│
│                                                  │ 미니맵    ││ M: 150/250/350
│                    (타일맵 · 카메라 추종)         │          ││
│                                                  └──────────┘│
│              ☗ 건물(E)      ~~~바다~~~                       │
│                    ⛹ 플레이어(방향키)                        │
│                                                              │
│ ┌───────────────────────┐        ┌────────────────────────┐ │
│ │ 이벤트 로그 / 채팅     │        │ 퀵슬롯 1..8            │ │
│ └───────────────────────┘        └────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
 단축키: 방향키 이동 · 좌클릭 유지=캐스팅 차지 · E 상호작용 · I 인벤 · B 쿨러
         U 활용(채비/요리/밑밥) · S 스탯 · E 장비 · M 미니맵 · R 자전거 · ESC 팝업/메뉴
```

### (b) `FirstPersonFishingScene` — 1인칭 낚시
```
┌──────────────────────────────────────────────────────────────┐
│                     (하늘 — 시간대·날씨 연동)                 │
│ ─────────────────────── 수평선 ───────────────────────────── │
│ ┌────────────┐                                  ┌──────────┐ │
│ │ 수평뷰(plan)│         ● 찌 / 채비 세트          │ 수심 패널 │ │
│ │ 거리링·조류 │      (거리→크기·투명도 수렴)      │ 게이지·   │ │
│ └────────────┘                                  │ 해저 단면 │ │
│  피딩/동조/정렬 게이지                           └──────────┘ │
│                                        ╱ 초릿대(하중측 벤딩) │
│ ┌──────────────┐                                    ▐ 릴     │
│ │ 쿨러 | 밑밥  │        [상태별 조작 가이드 바]              │
│ └──────────────┘                         [그만하기] [? 가이드]│
└──────────────────────────────────────────────────────────────┘
 조작: 우클릭=챔질 · 좌클릭 유지=릴링 · ←→=채비 횡이동/파이트 스티어
       ↑=리프트/버티기 · H=뒷줄견제 · C=밑밥 · I=인벤 · F1=가이드
```

### (c) `ButcheryPanel` — 손질(모달 1080×620, depth 900대)
```
┌─ 손질하기 — 원물 손질 (광어, 2.2kg, 58cm) ───────────────[✕]┐
│ ┌──────────────────────────┐ ┌──────────────────────────┐   │
│ │        도 마              │ │ 섹션: 배쪽 뜨기           │   │
│ │   (생선 + 유도선 + 칼)    │ │ ┌─────────┬─────────┐    │   │
│ │   ※ 회전축 R/Shift+R      │ │ │ 작업1   │ 작업3   │    │   │ 4개↑ = 2열
│ │   ※ 가이드 컷 팝업        │ │ ├─────────┼─────────┤    │   │
│ │                          │ │ │ 작업2   │ 작업4   │    │   │
│ └──────────────────────────┘ │ └─────────┴─────────┘    │   │
│  [좌우 뒤집기 F] [상하 V]     │ 손질 스킬 Lv.N  XP …      │   │
│  [dev: F9 좌표 / 항법]        │ [가이드 시트] [가이드 ON]  │   │
└──────────────────────────────────────────────────────────────┘
   부산물 팝업(모달): [보관] / [버리기] → 확인 시 즉시 인벤 지급
```

---

## 1.7 확장 지점 (새 기능을 붙일 자리)

| 하고 싶은 것 | 손대는 곳 | 스킬 |
|---|---|---|
| 새 어종 | 오라클 → FISH_DATABASE → 텍스처 → 경락 매핑 (4계층) | `add-species` |
| 새 지역 | `pixelazed/` PNG → `build_region_maps.py` → 맵 그래프 → 출조 노드 | `add-region` |
| 새 손질 어종군 | `ButcheryProfiles` + 스테이지 트리 + 섹션 + 렌더 분기 | `f9-guide-coords` |
| 이미지 에셋 | `food assets/` → 생성기(cjs) → `public/` → BootScene 키 | `asset-pipeline` |
| 밸런스 값 | `core/config/tuning.ts` + `TUNING_META` | `add-tuning` |
| 새 팝업 | `DraggablePanel` 상속 + 밴드 선택 + 3항 검수 | `ui-panel` |
| 아이템 필드 | `InvItem` + `deserialize` 시드 백필 | `save-migration` |
| 검증 | dev 서버 + Playwright + `__INV`/`__GS` | `verify-render` |
