# 학습 노트 — 2 코드

> 이 도메인에 대해 **지금 사실인 것**만 적는다(누적 금지 · 갱신). 추정은 "추정"이라고 쓴다.
> 400줄을 넘기지 않는다. 날짜별 경과는 `reports/`에 있다.

## 구조

- 범위는 360파일 · 150,611줄이다. `client-pc/src/ui` 87 · `core/src/simulation` 59 · `core/src/db-schema` 53 · `data` 35 · `scenes` 31 · `store` 27.
- `scenes/field/`에 7개 시스템(3,789줄)이 있다. 「Host 인터페이스 + GameState 소유 상태 + wall-clock」 문법이고,
  `RegionFieldScene`이 만들고 `shutdown`에서 `destroy`한다. `RegionFieldScene` 분할의 기존 선례다.
- 퀘스트 물건 지키기는 2층이다. 낮은 층 저장소는 `ItemKeepGuard.itemKeepReason`만 묻고(순환 import 회피),
  본체 `QuestItemGuard.questKeepReason`이 모듈 로드 때 등록된다. `GameState`가 임포트하므로 항상 로드된다.
- `repairQuestItems`는 로드 직후 · 필드 진입 · `inventory-changed`에서 불린다.
- 날씨 흐름: core `SessionWeather`(카드 인코딩 · 구간화) → `net/WeatherSync`(5초 tick) → `ExternalDataStore`(실황 · 세션 카드)
  → `MultiplayerClient.takeWorld('w:지역|슬롯')`.
- `MultiplayerClient.post/get`은 예외를 삼키고 `null`을 돌려준다. `void x().then()` 패턴에 unhandled rejection은 없다.
- 설치물 3종(통발 · 화구 · 거치대)은 같은 `/mp/trap/place` 채널을 `kind`로 나눠 쓴다.
  `ok:false + conflict`만 「거절」이고, 못 닿음은 `unreachable`로 처리한 뒤 `placedNeedSync`로 다음 폴링에 대조한다.
- 쿨러에는 갓 잡은 것만 들어간다(가방 → 쿨러 경로 없음). 수조는 `toxin` · `traded`를 보존한다.
- 어획물 판매가는 `basePrice`가 아니라 어종 · 중량으로 계산한다. 채집물은 0원이다.
- 레거시 `FieldScene` 스택(FieldScene · FishingScene · TrapScene · NightHuntingScene · CondoScene · CookScene · TackleRoomScene 등 약 5,000줄)은
  `WorldMapScene`의 dev 전용 단추로만 들어가지만 `game.ts`에 등록돼 프로덕션 번들에 들어간다.
- 에셋 로드와 아이콘 해소 구조(`BootScene` · `ItemIcon` · `TilesetManifest` · `FishTextures`)는 4 디자인·미디어 노트에 적었다.
- 1,500줄 초과는 범위 안 16개다. 자동 생성 · 데이터 6개(`PixelFishStages` · `PixelFishViews` · `PixelIconArt` · `SkillIconArt` ·
  `StoryNarrative` · `tuning`)는 분할 대상이 아니다. 코드 10개: `RegionFieldScene` 7,921 · `SeamlessChunks` 6,078 ·
  `FirstPersonFishingScene` 5,223 · `ButcheryPanel` 4,327 · `InventoryStore` 2,670 · `UtilizationPanel` 2,581 · `RegionHud` 2,255 ·
  `GameState` 2,034 · `HomeInteriorScene` 1,886 · `WorldMapScene` 1,696.

## 규칙과 함정

- **고정 오탐**(다음에도 같다): `no-scene-start-field` 1건(`WorldMapScene.ts` — 최상위 씬 · dev 단추) ·
  `no-lowercase-gamestate` 1건(`ForageGamePanel.ts`의 하네스용 게터) · `no-bare-fadeout-wait` 3건(대형 씬의 자체 fadeOutThen —
  폴백 타이머 · 이중 실행 가드 있음) · `no-any` 중 `RegionFieldScene.ts`의 문자열 `'shop:any'` 1건.
- `no-any` 26건 = 오탐 1 + `api-client/**` 13(전부 주석 있음 — 7 도메인) + 주석 있는 예외 6 + **주석 없는 위반 6줄**.
- 지표 `markers.XXX` 3건은 `InteriorLayouts.ts`의 ASCII 배치도다(오탐). TODO 9건이 실제다.
- 글자 그대로 빈 `catch {}`는 0건이다(catch 83개). 주석만 있는 catch 10곳과 Promise 삼킴 6곳은 묻혀도 되는 것이다.
- `console.log(` 36건은 `src/dev/` 안 0건 — client-pc 24 · core 5 · server 7(서버 로그는 정상 범위).
- 아이템을 되돌리는 함수는 넷이고 의미가 다르다. 결과를 무시하면 물건이 증발한다.
  - `giveBack`: 모양 그대로, bool 반환.
  - `recoverPlaceable`: 스택 +1 또는 템플릿. 통발 id는 표에 없어 false가 난다.
  - `returnParkedGear`: 못 넣은 것 목록을 돌려준다.
  - `addItem`: 분류 칸이 없으면 false.
  - 정석은 234차 거치대 방식이다(`parkedGearFits` 사전 확인 + `dropAtFeet`).
- 「먼저 빼고 나중에 넣는」 순서는 실패 때 유실을 만든다. 넣기가 성공한 뒤에 빼야 한다(`QuestItemGuard`가 반대로 돼 있다).
- 세이브 아이템 마이그레이션은 `InventoryStore.deserialize` 안에 인라인이라 다른 저장소가 재사용할 수 없다.
  새 정적 필드를 더할 때 집 · 냉장고 · 바닥 · 거치대의 아이템은 빠진다.
- `GroundItemStore.drop`은 수량 · 템플릿 검증 없이 같은 칸 같은 id를 합친다. `mapKey`가 없으면 그 지역 모든 맵에서 보인다.
- `HomeStore.deserialize`는 견고하지만 보관함 칸 수를 줄이면 넘치는 칸은 조용히 버려진다.
- 통발 내구도는 `DeployedTrap`에만 있고 아이템에는 없다(누적되지 않는 원인).
- `CookScene.showFinalMessage`의 `console.log`는 지우면 `noUnusedParameters`에 걸린다. 매개변수를 `_heal`로 같이 바꿔야 한다.
- 미임포트 모듈 탐지는 basename 임포트 검색 근사다. dev 하네스가 `import('/src/…')`로 직접 여는 경우가 있어
  삭제 전에 `tools/`와 스킬 문서를 한 번 더 본다(이번에는 0건).
- 확인하지 못한 것: `commitTradeApplied`가 false여도 서버에 「적용함」을 알리는 것이 의도인지(6 도메인 발견과 같은 자리) ·
  `SceneFade`의 `inFlight`가 페이드 중 밖에서 stop되면 영구 잠금이 되는지(그런 호출 경로는 못 찾음).

## 대형 파일 분할 경계 (제안용 · 섹션 주석 기준)

- `RegionFieldScene`: dev 맵 편집기(2048~2674) → `dev/` · 대기 · 조명 · 날씨(4231~4649) · 스토리 NPC · 컷씬(5126~5700) ·
  멀티 피어 · 거래(5728~6208) · 퀘스트 화살표(6208~6519) · 건물 실내 · 위판(3148~3566) · ESC 메뉴(7732~끝).
- `SeamlessChunks`: 방파제 스프라이트 · 거리장 · 고도 층 · 계단 · 프롭 산포 · 시각 베이킹.
- `FirstPersonFishingScene`: 밑밥 3뷰 · 파이트 물리 · 로드 벤딩 · 채비 렌더 · 거치대 · 밑걸림.
- `ButcheryPanel`: F9 가이드선 편집 · dev 항법 → `dev/` · 두족류 렌더러 · 넙치 다섯장뜨기 · 부산물 정산.
- `InventoryStore`: 시드 카탈로그 · 신선도 모델 · 채비 트리 · 세이브 마이그레이션.

## 닫힌 수정안에서 배운 것

- (없음)
