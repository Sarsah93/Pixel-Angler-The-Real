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
│   ├── server/        ← Socket.IO 서버 (멀티플레이)
│   └── map-builder/   ← ⚠ deprecated (2026-09-02 워크스페이스 제외 — 빌드 3/3. 정본은 루트 tools/)
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
- **타이틀바(캡션바)는 전용 영역** — 제목·조절 버튼만 들어가고 컨텐츠는 밴드 아래에서 시작한다. 밴드 높이는 상수 하나(`HEADER_H`/`HUD_HEADER_H`)로 관리하고, 축소 단계에서도 버튼(16px)이 들어갈 하한을 건다.
- **wordWrap 텍스트 아래는 고정 y 금지** — `앞 요소.y + height + gap` 흐름 배치. 높이를 미리 알아야 하면 텍스트를 먼저 만들어 실측한다(영어 번역이 길어지면 한국어에서 안 겹치던 것도 겹친다).
- 모든 패널은 신규·수정 시 **오버플로·겹침·스크롤/클립 3항 검수** + 가장 긴 콘텐츠로 실렌더 확인.
- 인터랙티브 목록 = 윈도우드 렌더(마스크는 팬텀 히트) / 화면 고정 마스크 = `setScrollFactor(0)` / z-order 밴드(일반 800대·모달 900대) / 드래그 = 커스텀 포인터 방식 — 전부 스킬 참조.

### 인게임 표현 규칙 (2026-09-17 사용자 지시 — 150차 · **상시 적용**)

> 배경: 실검증에서 "요구 사항 자체는 잘 반영했으나 **표현형이 AI가 함축된 텍스트로 direct하게
> 표시하려는 느낌**이 강하다. UI/UX적으로 미흡하다"는 지적을 받았다. 아래는 그때 지정된 것들을
> **일회성 수정이 아니라 규칙으로** 고정한 것이다. 새 화면·새 문구를 만들 때마다 이 절을 지킨다.

**R1. 개발 내부 용어·ID를 UI에 노출하지 않는다.**
`자격 사다리` · `서브 아크` · `메인 스파인` · `트랙` · `레일` 같은 **구조 명칭**과
`N04` · `M1-06` 같은 **내부 id**는 우리가 컴포넌트를 부르기 쉬우라고 붙인 이름이지 플레이어의 말이 아니다.
화면에는 사람이 쓰는 말을 쓴다(`자격 취득` · `이야기` · 이야기 제목). 구조 명칭은 **코드 주석에만** 남긴다.

**R2. 진행하지 않은 것은 보여주지 않는다(스포일러 금지).**
퀘스트·조행록 장·인물 이야기·챕터 목표는 **해금된 것만** 연다. 활성 목표 하나가 선두에 서고,
완료 → NPC 대화 → 그때 다음 줄이 열린다. 완료분은 **토글**(`완료 표시`)로 선택 열람하고 기본은 가린다.
목록에 미래 항목을 회색으로라도 나열하지 않는다 — 회색으로 보여도 스포일러다.

**R3. 대화는 한 번에 쏟지 않는다.**
NPC 대사는 좌→우로 **타이핑**되고, 넘치면 앞 줄이 위로 밀리며 새 줄이 아래에 쓰인다.
단락이 끝나면 우측 하단 **흰 역삼각형(▼)** 으로 "더 있다"를 알린다. 본문은 **20px 이상**.
표준 선택지는 `내가 도와줄 수 있는 게 있을까요?` / `물건을 볼 수 있을까요?`(거래하는 사람만) / `나가기`.
**NPC를 누르자마자 의뢰서가 펼쳐지지 않는다.**

**R4. 나레이션은 정의문 요약이 아니다.**
퀘스트 설명은 `descKo` 같은 설계 요약을 그대로 쓰지 않는다. **NPC가 실제로 한 말 + 주인공이
받아들인 것·느낀 것**을 1인칭 산문으로 엮는다(`StoryNarrative`). 길면 **그 텍스트 박스만** 스크롤한다.

**R5. 초상은 얼굴이다.**
대화창 초상은 전신을 키우지 말고 **얼굴 창만 확대**한다(증명사진 — `ensureFacePortrait`).
전신을 키우면 초상 칸을 몸통·다리가 다 먹는다.

**R6. 텍스트는 창 아래 경계에도 걸리지 않는다.**
가로 넘침은 `enforceTextBounds`가 말줄임으로 고치지만 **세로는 잘라 낼 수 없다** — 배치를 고쳐야 한다.
하단 고정 요소(버튼·사유 줄·상태줄)는 **패널 안쪽으로 들이고**, 사유·주석은 버튼 **위**에 둔다.
신규·수정 패널은 `DraggablePanel.auditBottom()`으로 전수 확인한다.

**R7. 한글 입력은 IME로 받는다.**
Phaser `keydown`의 `ev.key`로는 한글이 들어오지 않는다(조합 중 `'Process'` · 완성 글자는 `input`/
`compositionend`). 텍스트 입력은 **`ui/TextInput.ts`(숨김 DOM 입력)** 을 쓴다. 직접 `ev.key.length === 1`로
글자를 모으는 코드를 새로 만들지 않는다.

**R8. 크기는 사람 기준으로 읽힌다.**
탈것·오브젝트가 캐릭터(세로 52px)보다 작으면 이질감이 난다. 차량은 **가장 작은 차의 세로가 캐릭터보다
길게** 유지한다(주행 `CAR_SCALE` · 주차 `PARKED_CAR_SCALE`). 배율은 언제나 정수 우선(§8-비정수 배율 금지).

**R9. 지형 위에 얹힌 것은 보정한다.**
OSM 실측 기반이라도 **도로 위에 선 건물·간판은 틀린 그림**이다. 도로 벡터 밴드 안이면
`SeamlessChunks.nudgeOffRoad`로 땅으로 민다. ⚠ **그림이 아니라 문(door) 좌표를 민다** —
거래 판정·NPC·미니맵 핀이 한 좌표를 공유하므로 그림만 옮기면 "보이는 곳과 [F] 되는 곳"이 어긋난다.

**R10. 가려지면 비친다.**
캐릭터가 건물 뒤로 들어가면 **상호작용 건물이든 타일 건물이든** 반투명해진다.
원점이 제각각이므로 판정은 **경계 상자(`getBounds`)** 로 한다.

**R11. 기능을 글자로 설명하지 않는다 — 처음 열 때 직접 해 보게 한다.** (2026-10-01 · 188차 사용자 지시)
`우클릭: 아이템 액션 / 드래그: 위치 이동` 같은 **조작 안내 문구를 창에 박지 않는다**(타이틀바·하단 줄·툴팁 꼬리 전부).
화면 위에 `지금 할 일 · 목표 / 방법`을 **글자로 나열하는 띠**도 같다(191차 — 사용자 지적으로 집 안 띠 삭제) — 다음 할 일은 말풍선(`ui/PrologueCoach.ts`)이 잇는다.
대신 그 창을 **처음 열 때** 체험 가이드(`ui/GuideTour.ts`)가 말풍선으로 구성 요소를 하나씩 짚고,
가능한 단계는 **실제로 해 보게**(`wait()`) 한다. 다시 읽는 곳은 도움말 라이브러리(F1)다.
새 기능창을 만들면 가이드 단계도 함께 만든다(창별 needs에 맞게 — 다른 창 것을 복사하지 않는다).

### UI 특수문자·이모지 금지 / 픽셀 아이콘 원칙 (2026-09-10 사용자 지시 · 128차 정정)

> **금지 대상은 두 가지다.**
> ① **이모지·장식용 특수문자**(🐟💊⚠✅❌🔒 …) — 게임은 픽셀아트 세계관인데 이모지는
> OS 폰트가 그리는 컬러 벡터라 도트 톤과 섞이지 않는다.
> ② **"[아이콘] [타이틀]" · "[강조 특수문자] [설명]" 식의 텍스트 장식**(15차 접두사 금지의 본뜻).
>
> ⚠ **시각적 아이콘 자체를 금지한 것이 아니다.** 오히려 그림으로 한 번에 읽히게 하는 쪽이 정답이다.

- **아이콘이 필요하면**: ① **16x16 손그림 픽셀 아이콘**(`tools/gen_pixel_icons.py` → `data/PixelIconArt.ts`
  → `ui/PixelIcon.ts` 굽기 — 상태이상 11종·허기·수분 전례) ② 절차 생성 픽셀 그래픽
  (`Graphics`/`generateTexture` — 프롭·부산물) ③ 실사·타일셋 스프라이트(`public/**` 텍스처 키).
- **텍스트 약어로 의미를 압축하지 말 것**(128차 사용자 지시) — `식`/`FP` 같은 1~2자 배지는
  **유저가 해석해야 하는 UI**다. 통일된 칩 프레임은 유지하되 **내용물은 아이콘 그림**으로 한다.
  약어 라벨은 아이콘을 도저히 그릴 수 없을 때의 최후 수단이다.
- **아이콘은 조잡한 도형 조합(원+사각)이 아니라 픽셀 단위로 그린다** — 형태가 안 서면
  스톡 이미지를 요청할 것(사용자 승인 사항).
- **상태·등급·수량 표시**는 아이콘 + 색 + 도형(사각·링·바)으로. 체크/경고 표식도 마찬가지 —
  `✅`/`⚠`/`❌` 대신 색(초록·주황·빨강) 칩이나 `[경고]` 같은 말머리를 쓴다.
- **예외**: ① 기존 UI 관용 기호 `✕`(닫기) · `◀▶`(페이지) · `◱◐`(HUD 크기·투명) — 이미 확립된 조작 글리프
  ② 코드 주석·문서·로그의 `→`·`⚠`(렌더 대상이 아님).
- 신규 데이터에 `icon` 류 필드를 만들 때는 **이모지 문자열을 넣지 말 것** — 픽셀 아이콘 키 또는 텍스처 키.
- ⚠ 레거시 잔재: `InventoryStore` 시드/`ShopCatalog` 아이템의 `icon` 이모지는 `iconTexture` 폴백용으로 남아 있다
  (백로그 정리 대상). **새 아이템은 이모지 없이** 텍스처 키로 등록한다.

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
- **근접 상호작용**: 건물에 60px 이내 접근 시 `[E]` 힌트 팝업 표시 (레거시 FieldScene — 심리스 `RegionFieldScene`은 `[F]`, 122차)
- **씬 전환**: `pause + launch` 방식 (위 씬 전환 패턴 참고)

### FieldScene 단축키 전체 목록

| 키 | 기능 |
|---|---|
| `방향키` | 캐릭터 이동 (이동 **전용**) |
| `WASD` | 예약 — 향후 별도 기능 (`on('keydown-W', ...)` 이벤트 방식으로 추가) |
| `SPACE` / `ENTER` | 낚시 포인트 진입 |
| `F` | **상호작용**(122차 E→F) — 오브젝트 > 건물 거래 > 채집 스팟(길게) > 통발 수거 |
| `E` | 장비창 토글 (122차 — 상호작용에서 분리) |
| `H` | (레거시 FieldScene) 해루질 씬 — 심리스 필드는 인-맵 채집 `F` |
| `T` | 통발 설치(121차 인-맵) / 레거시 FieldScene은 TrapScene |
| `C` | 요리 (CookScene) |
| `U` | 제작대 (CraftScene 예정; 현재 CookScene 임시 연결) |
| `L` | 면허 · 허가 패널 (122차 재작성) |
| `K` | 스킬 트리 (122차) |
| `J` | 일지 — 스토리 · 메인/서브 퀘스트 (122차) |
| `I` | 인벤토리 패널 토글 |
| `Q` | (레거시 FieldScene) 퀘스트 저널 — 심리스 필드는 `J` |
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
8. **UI에 이모지·장식용 특수문자 금지 · 텍스트 약어 배지 금지** (2026-09-10 · 128차 정정) — 아이콘은 **16x16 손그림 픽셀 아이콘**(`PixelIconArt`) / 절차 픽셀 그래픽 / 스프라이트 텍스처로. 상세·예외는 §4 「UI 특수문자·이모지 금지 / 픽셀 아이콘 원칙」.
9. **개발 내부 용어·ID를 UI에 노출 금지** (2026-09-17 · 150차 R1) — `자격 사다리`·`서브 아크`·`N04` 같은 구조 명칭/내부 id는 주석에만.
10. **진행하지 않은 퀘스트·장·인물 정보 노출 금지** (150차 R2) — 회색으로 보여줘도 스포일러다.
11. **텍스트 입력에 Phaser `keydown` 글자 수집 금지** (150차 R7) — 한글이 안 들어온다. `ui/TextInput.ts` 사용.
12. **에이전트의 `git commit`/`git push` 금지** (사용자 지시 2026-08-14) — 커밋과 푸시는 **사용자가 직접** 한다.
   에이전트는 파일 변경까지만 하고, 작업 완료 시 "커밋 대기 상태"임을 보고한다.
   (배경: 원격 세션 크리덴셜이 push 권한이 없어 403 — 이후로도 버전 관리 결정권은 사용자가 가진다.)
13. **창에 조작 안내 문구 금지** (188차 R11) — 첫 열기 체험 가이드(`GuideTour`)와 도움말 라이브러리가 맡는다.

---

## 9. 빌드 상태 · 최근 변경

```
npx pnpm run build → ✅ 3/3 패키지 성공 (2026-10-01 · map-builder 워크스페이스 제외)
npx pnpm --filter @tra/client-pc run typecheck → ✅ 0 오류
```

> **이 절은 최근 3개 차수만 둔다.** 차수 본문은 `docs/wiki/03-WORKLOG/`(색인 `03-WORKLOG/README.md` §3.1),
> 1~186차 원장(80차 이하 원문 포함)은 [`docs/archive/AGENTS-LEDGER-001-186.md`](../docs/archive/AGENTS-LEDGER-001-186.md).
> 새 차수를 넣으면 가장 오래된 항목 하나를 지운다(워크로그에 이미 있다).
> 작업 방법·함정은 히스토리가 아니라 **`.claude/skills/` 12종**을 먼저 본다.

**최근 변경 (2026-10-01 191차) — 프롤로그 말풍선 코치 · 상단 「지금 할 일」 띠 폐지 · 씬 재사용 파괴 객체 참조 전수 정리**

- 프롤로그 = 말풍선 코치(`ui/PrologueCoach.ts`)가 집(상자 → I → 대 → E·릴 → 사진 → J → 오징어 → 저장 → 매트) → 마당 → 속초 직판장까지 잇는다.
  집 상단 「지금 할 일」 띠·금색 자리 표시 삭제(R11 보강) · 첫 걸음 테두리 중복·꼬리·위치·문안 정정 · 상자 = 가방 · 저장 전 집 밖 금지.
- **캐릭터 두 번째 생성 멈춤**(`drawImage` null) = 씬 재사용 + 지연 생성 Text 미리셋 — 캐릭터 만들기·월드맵·필드·레거시 필드·가이드 대기열 전수 리셋
  + `game.ts` `installStaleTextGuard`(최후 방어). 상세: [191차 워크로그](../docs/wiki/03-WORKLOG/2026-10-01-191-prologue-coach-stale-refs.md).

**이전 변경 (2026-10-01 190차) — 집 살림: 창·조명 · 라디오 물때 방송 · 식탁 · 고양이 · 벽 장식 · 가구 판매 · 관상 수조**

- 창·조명 = 실시각(KST)·홈타운 날씨(`ui/HomeAmbience.ts`) — 밤 어둠(불빛 자리를 지우는 RenderTexture) · 협탁 스탠드 [F] · 창밖 노을·비.
- 라디오 [F](소파에서도) = 오늘·내일 물때 + 속초·부산 날씨 예보(core `KmaDailyOutlook`) · 식탁 의자 「식사하기」 허기 +25%.
- 고양이(`ui/HomeCat.ts`) · 벽 장식 [F](도감·물때표 · 달력 납부일 · 어탁 최대어) · 사이소 가구 8종 → 넣어 둔 가구 · 관상 수조.
  상세: [190차 워크로그](../docs/wiki/03-WORKLOG/2026-10-01-190-home-life.md).

**이전 변경 (2026-10-01 189차) — 집 실내 정리 · 가구 배치 모드 · 앉기/보관함/물 주기 · 현관 매트**

- 「살펴보기」 폐지 — 실내 [F]는 기능 있는 가구만(닿는 거리 26px) · 문 → 현관 매트(밟고 아래로 걸어 나가면 밖).
- **가구 배치 모드**(`ui/HomeDecorMode.ts` · `store/HomeStore.ts` · `data/HomeFurniture.ts`) — 들기·돌리기·넣어 두기·꺼내기 · BFS 길 판정 · SaveData `home`.
- 소파 2인용 4방향 + 앉기·휴식 확장 패널 · 의자 · 옷장(장비)/수납 선반 · 물뿌리개 물 주기 · 냉장고 R11 문구 삭제 + 가이드.
  상세: [189차 워크로그](../docs/wiki/03-WORKLOG/2026-10-01-189-home-interior-furniture.md).

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
