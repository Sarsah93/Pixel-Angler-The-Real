# Pixel Angler The Real — 참고 절 (REFERENCE)

> **이 파일은 세션에 자동으로 읽히지 않는다.** 해당 시스템을 건드릴 때 찾아 읽는 표와 설명이다.
> 규칙(코딩 규칙 · 금지 사항)은 `.agents/AGENTS.md` §4 · §8에 있고, 시스템별 현재 상태는 `docs/wiki/02-SYSTEMS/*.md`가 정본이다.
>
> 2026-10-08에 `AGENTS.md` §5 · §6 · §6b · §6c를 그대로 옮겼다(사용자 결정 — 자동으로 읽히는 분량 줄이기).
> 내용은 옮길 때의 것 그대로다. 수치(어종 수 · 맵 수)가 낡았을 수 있으니 코드와 시스템 페이지로 확인한다.

---

## 1. 게임 시스템 목록 및 구현 상태 (구 AGENTS §5)

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
| Phaser 씬: AnglerLog | `client-pc/src/scenes/AnglerLogScene.ts` |
| UI: LicensePanel | `client-pc/src/ui/LicensePanel.ts` |
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
| 월드맵 핀포인트 노드 타입 + DB | `core/src/types/WorldMap.ts` |
| WorldMapScene 전면 개편 (픽셀 지도 + 동적 핀 + 툴팁) | `client-pc/src/scenes/WorldMapScene.ts` |
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

## 2. 필드 단축키 (`RegionFieldScene`) (구 AGENTS §6)

> 2026-07-07에 재설계했던 레거시 `FieldScene`(탑다운 2048 × 1536 월드)과 그 하위 씬 묶음(Fishing · Trap · NightHunting ·
> Cook · Condo · TackleRoom · Restaurant · TideChart)은 **삭제했다**(2026-10-08 사용자 결정). 필드는 §3의 `RegionFieldScene` 하나다.

아래는 `RegionFieldScene.setupInput()` 기준이다.

| 키 | 기능 |
|---|---|
| `방향키` | 캐릭터 이동 (일시정지 메뉴에서는 ↑↓ = 항목 이동) |
| `F` | **상호작용**(122차 E→F) — 오브젝트 > 건물 거래 > 채집 스팟(길게) > 통발 수거. 겹치면 고르는 창(178차) · `Shift+F` = 회수 |
| `E` | 장비창 (122차 — 상호작용에서 분리) |
| `I` | 인벤토리 |
| `S` | 상태 창 |
| `U` | 활용 창 (`UtilizationPanel` — 채비 조립 등) |
| `B` | 쿨러 |
| `T` | 통발 놓기 (121차 인-맵) |
| `L` / `K` / `J` | 면허 · 허가 / 스킬 트리 / 일지 (122차) |
| `N` | 도감 · 조과첩 (`AnglerLogScene` — `pause + launch`) |
| `M` | 전체 지도 오버레이 (155차 — 미니맵 크기는 타이틀바 단추) |
| `R` | 자전거 승·하차 (탑승 시 이동 속도 2배 — 낚시/상점 진입 시 자동 하차) |
| `1`~`8` | 퀵슬롯 선택 (상단 숫자키) |
| `Enter` | 지역 채널 채팅 (145차) · 일시정지 메뉴에서는 선택 |
| `F1` | 도움말 라이브러리 |
| `ESC` | 설치 취소 → 맨 위 팝업 닫기 → 실내면 밖으로 → 일시정지 메뉴 |

---

## 3. RegionFieldScene — 실지형 기반 지역 타일맵 (구 AGENTS §6b · 2026-07-14 신규)

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
- **top-level 씬**. WorldMapScene에서 `scene.start('RegionFieldScene', { region })`로 진입, `ESC` → `scene.start('WorldMapScene')`.
- **맵 간 이동**: `scene.restart({ region, mapId, entryEdge, entryT })` — 지형 그래프(`SOKCHO_MAP_GRAPH`)의 링크 방향으로 엣지 접근 시 인접 맵 로드. 진입 엣지 반대편에서 스폰.
- **충돌**: 바다·건물 타일을 행 단위로 병합한 정적 바디 + `physics.add.collider`.
- **렌더**: 타일을 `generateTexture`로 1회 베이킹 후 이미지 배치(맵당 텍스처 캐시).
- **낚시 캐스팅**: 바다 인접 + 낚싯대(퀵슬롯 0) 상태에서 좌클릭 유지 → 차지 → 릴리즈 시 찌 캐스팅 → 착수하면 `FirstPersonFishingScene`(§4)을 `pause + launch`.

### 속초 맵 체인 (7개)
```
속초항 남측 ↕ 속초항 중앙 ↕ 속초항 북측 ↔ 연결로 ↔ 동명항 북측 ↕ 동명항 중앙 ↕ 동명항 남측(방파제)
(sokchohang_3   sokchohang_2   sokchohang_1   bridge   dongmyeonghang_1  _2  _3)
```

### 알려진 튜닝 항목
- 동명항 남측/중앙은 대부분 바다(방파제 낚시 맵) — 좁은 대각 통로는 `bridge_diagonals` 후처리로 통행성 확보했으나, 세밀 튜닝 여지 있음.
- POI는 현재 식당 아이콘 색만 자동 추출(제네릭 마커). 카페/마트 구분 및 건물별 상호작용(진입 씬 연결)은 추후.

## 4. FirstPersonFishingScene — 1인칭 낚시 조작 (구 AGENTS §6c · 2026-07-22 기준)

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
- 화면 위 상태 줄은 **상황만** 말한다(채비 흘리는 중 · 입질 감지 · 챔질 성공 · 스풀 개방). 하단 조작 띠는 199차에 삭제(R11) — 키는 상황 가이드·F1 가이드북.
- 파이팅: 텐션 30~80 유지, 70+에서 릴링 미끄러짐(저항), 88+ 릴링 강행 0.55s → 과부하 줄터짐.
- 설정(낚시 탭): 로드 위치 좌/우, 릴 핸들 좌/우 (로드 기준).
