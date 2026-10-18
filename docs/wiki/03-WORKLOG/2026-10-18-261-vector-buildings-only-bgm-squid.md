# 261차 — 구 에셋 건물 그림 폐기 · 가게 자리 합성 발자국 · 가게마다 문 · 레거시 맵 벡터 건물 · 배경 음악 · 냉동 오징어 되살아남

| | |
|---|---|
| **날짜** | 2026-10-18 |
| **시스템** | `필드` `지도` `에셋` `홈` `소리` `UI` `스토리` `세이브` |
| **트리거** | 사용자 지시 3건(건물 그림 · 오징어 버그 · 배경 음악) |
| **커밋** | `5b6152e` (작업 브랜치 `claude/project-review-task-planning-yopbck` — main 반영 · 배포는 사용자 요청 시) |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 322/322 |

---

## 1. 배경 — 왜 했나

사용자 지시(2026-10-18) 원문:

> 1) 구 에셋 건물 이미지들 (횟집 이미지, 건물 이미지 등) 전부 사용하지 않고, 이번에 새로 적용한 지도 기반 건물로만 표현할 거야.
> 구 에셋 이미지들은 우선 그냥 사용하지 않는 쪽으로 빼두고, 구 에셋 건물 이미지들이 적용된 모든 부분들에도 새로 적용한 지도 기반 건물들로 바꿔줘.
> 그리고, 표지판이 있는 위치가 해당 상가 건물들일텐데 거기에 반영을 잘 해줘.
> 2) 냉동 오징어 2개를 팔았는데, 퀘스트 물품 4개(원줄, 목줄, 봉돌, 바늘) 구매 후, 확인해보니 냉동 오징어가 하나 더 생겨져 있음.
> 버그 같으니 확인하고 수정할 것. (교환 시스템에서 점검할 필요가 있음)
> 3) 배경음악 초안 뽑은 것들 중에 제일 최근에 변경한 부분들로 우선 적용해줘.

- 239차 벡터 건물 뒤에도 가게 POI 110곳(횟집 28 · 숙소 62 · 은행 19 · 좌판 1)은 Gemini 횟집 · 팝업 · 고층 파사드 · TopDown 주택 그림이
  문 앞에 따로 섰고, 대형 '#' 성분(≥ 60칸)에는 고층 파사드가 얹혔다. 레거시 맵(홈타운 · 부산)은 173차 타일 기와 + `bld_<kind>` 도트 건물이었다.
- 배경 음악은 253차에 Lyria 후보 두 판(1판 9곡 · 2판 7곡)을 뽑아 두고 게임에는 넣지 않았다.

## 2. 원인 — 무엇이 문제였나

### 냉동 오징어가 되살아남(확정)

- 프롤로그 M1-01은 `ordered`라 팔기 목표(13)는 장보기 목표(12 — 다섯 갈래)가 닫힌 뒤에만 닫힌다. 오징어 2마리를 먼저 팔면
  목표 13은 「안 끝남」으로 남고 가방에는 오징어가 0이다.
- `store/Prologue.ts`의 안전망 `repairPrologue()`(가방이 바뀔 때마다)는 「오징어를 챙겼고(`prologue.squid`) · 팔기 단계가 안 끝났고 · 가방에 없으면」
  냉장고에서 꺼내거나 **새로 넣는다**(219차 — 냉장고에 다시 넣고 막히던 리포트의 안전망). 장보기 4갈래를 사면 `inventory-changed`가 돌며 오징어 1마리가 생겼다.
- 확정 근거: `git stash`로 옛 `Prologue.ts`만 되돌린 A/B — 팔고 바로 재동기화하면 오징어 1(5회 관측), 고친 코드는 두 순서(먼저 팔기 · 다섯 사고 팔기) 모두 0.
  하네스 scratchpad `r261b.cjs`.

### 구 그림 자리에 건물이 없었다(실측)

- 속초 POI 110곳과 건물 단위(OSM 폴리곤 527 · 타일 윤곽 0) 거리를 오프라인으로 재면 **안 24 · 1칸 안 2 · 4칸 넘게 떨어짐 83**.
  그림만 빼면 간판 83개가 빈 땅에 홀로 선다 — 그래서 발자국을 합성한다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`client-pc/src/audio/Music.ts`](../../../packages/client-pc/src/audio/Music.ts) | 자리(`menu · field · fishing · home · farm · market`) → 곡. 낮 둘 번갈아 · 밤(19~04시) · 10분 고정 · 반복 이음매 굽기(`bakeLoopBuffer` — 앞뒤 무음 자르고 1.5초 교차) · 곡 사이 2초 교차 · 디코드 캐시 2 · 자동재생 풀림 대기 · dev `__MUSIC` |
| 신설 | `client-pc/public/audio/bgm/*.mp3` | 10곡 26MB(128kbps) — 2판 7(field_day · fishing_wait · home · home_b · farm · market · market_b) + 1판 3(menu · field_night · field_day_chip) |
| 수정 | [`field/BuildingArt.ts`](../../../packages/client-pc/src/scenes/field/BuildingArt.ts) | `BuildingUnit.doors`(가게마다 문 x) · `doorEdgeOf` · `doorPointsOf` · `labelBuildingComps`(성분 라벨링 공유) · `BuildingPlanInput.minGroup · tileEps · groupKind`(레거시) |
| 수정 | [`SeamlessChunks.ts`](../../../packages/client-pc/src/scenes/SeamlessChunks.ts) | `PROP_DEFS` 건물 프리팹 21항목 제거 · Kenney 키트 굽기 제거 · 고층 파사드 산포 제거 · `reservedBuildingKeys` 제거 · `unitAt · unitNear · unitById · setUnitDoors · unitDoorPoints` · `ROOFS · palIdx · big` 제거 |
| 수정 | [`RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `synthesizePoiBuildings`(발자국) · `poiSynthSpec`(종류 · 층수 · 크기 표) · `assignUnitDoors`(가게마다 문) · 문 앞 칸 = 문 점 반 칸 남쪽(차도 밴드는 마지막) · 프리팹 가지 삭제 · `drawPois` 간판만 · `renderTerrain` 건물 칸 = 땅 · `fillWallRects` 윤곽 사각형 · `planLegacyBuildings · renderLegacyBuildings · coveredByBuildingArt · insideBuildingArtAt` · `isWalkable` 발 끝 조건 · `lightBuildings` 문 앞 불빛으로 통일 · 집 문 · 보건소 도트 그림 생략 · `synthTiles` 편집기 diff 제외 · `syncMusic` |
| 수정 | [`data/TilesetManifest.ts`](../../../packages/client-pc/src/data/TilesetManifest.ts) | gem 11 · td 8 · kn 2 · 키트 77 = **PNG 로드 98장 제거**(파일은 `public/tileset/`에 그대로) |
| 수정 | `audio/Sfx.ts` · `scenes/SettingsScene.ts` · `i18n/en.ts` · `data/HelpContent.ts` · `i18n/en_help.ts` | 음악 버스 · 설정 「배경 음악」 「환경음」(`ambVolume` — 구 세이브는 `bgmVolume` 폴백) · 영어 · 도움말 |
| 수정 | `MainMenuScene` · `HomeInteriorScene` · `FirstPersonFishingScene` · `RegionFieldScene` | `playMusic` 호출(메뉴 · 집 · 낚시 · 필드/텃밭/시장) |
| 수정 | [`store/Prologue.ts`](../../../packages/client-pc/src/store/Prologue.ts) | 한 번이라도 팔았으면(`prologue.sell`) 오징어를 다시 넣지 않고 보호도 놓는다 |
| 삭제 | `ui/BuildingVariant.ts` | 프리팹 벽 색 · 차양 변주(138차) — 프리팹이 없어졌다 |
| 삭제 | `RegionFieldScene` `ensureBuildingTexture · poiVisualTex` · 레거시 타일 기와 · 창 불빛 · 네온 · `COL.build*` · `isNightNow` | 구 그림 전용 |

### 합성 발자국 규칙(`synthesizePoiBuildings`)

- 대상 = 거래하는 가게 전부(`poiBuildingKind`) + 숙소 · 은행. 앵커가 '#'이거나 8이웃에 '#'이 있으면 그 건물의 가게다(만들지 않는다).
- 크기 · 종류 · 층수(`poiSynthSpec`): 횟집 3×2 상가 1~2층 · 좌판 2×1 차양 · 호텔 4×3 상가 5~7층 · 모텔 3×3 상가 4층 · 민박 3×2 주택 2층 ·
  은행 3×2 상가 3층 · 위판장 4×3 창고 · 편의점 · 카페 · 주점 · 약국 2×2 · 마트 · 음식점 · 생활용품 · 종묘사 · 수산 3×2.
- 문 칸 후보 = 앵커(걷는 땅이면) + 3칸 안 땅을 가까운 순으로 전부. 발자국은 문 칸 **북쪽**, 열은 문 칸 가운데 ±2.
  칸 조건 = 맨땅 · 잔디 · 흙 · 광장(2차는 보도) · 기존 '#' · OSM 윤곽 · 다른 가게 앵커 · 차도 벡터 밴드(반폭 + 0.35칸) 밖.
  안 되면 한 칸씩 줄여서(최소 2×2) → 그래도 없으면 간판만(dev 로그).
- 결과는 지형 '#' + `RegionBuilding` 윤곽(`syn_<osmId>`) — 걷기 · 충돌 · 미니맵 · 문 · 간판이 같은 칸을 본다. 지형 JSON은 그대로(`synthTiles`가 편집기 diff에서 뺀다).

### 가게마다 문(`assignUnitDoors`)

- 가게 POI → 건물 단위(합성이면 id 1:1 · 아니면 앵커 1.6칸 안) → 그 단위의 문 변(가장 아래 남향 변) 위에 앵커 x를 사영하고 24px 간격으로 벌린다.
  그림의 문 · [F] 문 앞 칸 · 간판이 모두 이 점을 쓴다. 문 앞 칸은 문 점 반 칸 남쪽(몸이 서는 칸 · 차도 밴드는 마지막 수단).

## 4. 구조상 위치 — 어느 계층의 무엇인가

- `S2 필드 → 벡터 건물(239 · 258) → 261 구 그림 폐기 · 합성 발자국 · 가게마다 문 · 레거시 맵` — 데이터 층(지형 '#' 런타임 변환) + 판정 층(문 칸 · 걷기 · 충돌) + 렌더 층.
- `S10 UI → 소리 4차(배경 음악)` — 렌더 · 설정 층. `S22 스토리 → 프롤로그 안전망` — 판정 층(깃발 하나).

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 구 그림 텍스처 | 실렌더 `game.textures.exists` 9키 | **0건** 로드 |
| 속초 발자국 | 실렌더(`r261a.cjs`) | 336채(1,770칸) · 자리 없음 6(관광수산시장 골목) · 종류 = 상가 1층 120 · 2층 154 · 3층 11 · 4~7층 12 · 주택 37 · 차양 1 · 창고 1 |
| 가게 문 | 같은 하네스 | 가게 389 · 문 둘 이상 건물 17 · 문이 차도 밴드 위 75 → **50**(차도 뒤로 미루기) · 문이 윤곽 안 1(옛 BFS 폴백) |
| 간판 · [F] | 동명항 3×3 청크 · 문 앞 순간이동 | 간판 41 · 대성횟집 · 청정바다횟집 · 관광수산시장(좌판 · 상인) [F] 됨 · 발자국 안 충돌 바디 ≥ 1 |
| 인물 자리 | 스폰 근처 `바람` | 발 끝이 OSM 윤곽 안(520,131 · y 4,224 > 윤곽 위 4,209.6) → `isWalkable` 조건 뒤 (518,131) 밖 |
| 홈타운 | 실렌더 | 단위 2(집 = 주택 2층 · 문 x 470 · 보건소 = 공공 1층) · 집 · 보건소 안 충돌 바디 · [F] 집 문 · 보건소 · 구 도트 그림 0 · 가림 대상 2 |
| 부산(감천 서 1) | 실렌더 | 단위 8(합성 4 · 주택 2 · 타일 2) · 간판 4 · pageerror 0 |
| 배경 음악 | 실렌더(`r261c.cjs` · 자동재생 허용) | 메뉴 → 낮 필드 → 시장(가게) → 필드(같은 곡) → 집 → 필드 → 낚시 → 텃밭(홈타운) 순서대로 · mp3 8요청 전부 200 · 이음매 0.0157 ≤ 신호 한 단계 0.0222 · 설정 탭 4줄(y 210 · 302 · 394 · 486) · `ambVolume` 폴백 0.3 |
| 오징어 | A/B(`r261b.cjs`) | 옛 코드 1 · 새 코드 0(두 순서) |
| 빌드 | `pnpm run build` · typecheck · core 시험 | 3/3 · 0 · 322/322 |

재현(건물): 새 게임 → 속초 → `sc.devTeleport(560*32, 108*32)` → 동명항 거리에 가게 건물 · 간판 · `[F] 꼬치네맛집 — 들어가기`. 줌 0.5 캡처 scratchpad `r261/a_dongmyeong_zoom05.png`.

## 6. 잔여 — 이번에 안 한 것

- 합성 발자국 **자리 없음 6곳**(텐포인트커피 · 다복홍게라면 · 신포아바이네식당 · 갯배가을이야기생선구이 · 대게특별구 · 빼꼼다방 — 시장 골목이 차도 밴드로 꽉 찼다) → 간판만. 보도까지 허용해도 안 됐다.
- 종류별 크기 · 층수 표와 좌판 차양(2×1)은 어림 — 사용자 육안 조율 뒤. 발자국은 축에 맞는 직사각형뿐(기울어진 길은 OSM 윤곽만).
- 문이 차도 밴드 위인 가게 50 — 길에 바짝 붙은 OSM 건물(옛 BFS 폴백) — 지도 트랙(R9).
- 편집기(F7)에서 타일을 고치면 단위를 다시 계획해 가게 문 분배가 사라진다(dev 전용 · 지역 재진입 복구).
- 레거시(홈타운 · 부산) 20px 건물은 작다(1칸 = 20×20). 부산 확장 때 TR 32 전환과 함께 본다.
- 배경 음악: 곡 평가 · 음량(`MUSIC_BED` 0.55) · 밤 곡 1 · 비 올 때 곡은 그대로(환경음이 대신) · 집 B곡 · 시장 B곡 번갈아 — 사용자 실청취 뒤.
- 구 건물 PNG 98장(`public/tileset/gem · td · kn`)과 `extract_tileset_assets.py`의 건물 출력은 파일만 남았다(「우선 빼두고」) — 정리는 사용자 결정.
- 오징어: 팔기 목표(13)가 장보기 뒤에 닫히는 순서(`ordered`)는 그대로다 — 팔고 나서도 목표 줄은 장보기가 끝나야 닫힌다.

## 7. 위험·부작용

- 합성 '#'는 걷기 그리드에도 들어간다 — 마을 사람 · 인물 길찾기가 그 칸을 막힘으로 본다. 차도 밴드 · 다른 가게 앵커 · 물은 피했지만 2차 보도 허용 자리는 보도 폭을 먹는다.
- `isWalkable` 발 끝 조건으로 스폰 · 인물 · 문 · 집 문 자리가 한 칸 옮겨질 수 있다(실측 1곳 — 바람). 구 세이브 좌표에는 영향 없다(서버 이어하기도 `nearestWalkable`).
- 합성 비용: 가게 400 × 후보 칸 수십 — 세그먼트 격자 색인(16칸) + 칸 기억으로 ms 단위. 로그 한 줄.
- 구 패치(`patch.json` props)에 프리팹 id가 있으면 `PROP_DEFS`에 없어 조용히 빠진다(속초는 정자 2뿐).
- 설정 `ambVolume`이 없는 구 설정은 `bgmVolume`을 물려받는다 — 음악만 0으로 두었던 사용자는 환경음도 0이 된다(설정에서 올리면 된다).
- 세이브 스키마 변화 없음(깃발 `prologue.sell`은 이미 있었다).

## 8. 후속 반영

- [x] 시스템 페이지 — [필드](../02-SYSTEMS/world-field.md) §2 · §4 · §5 · §6 · [UI](../02-SYSTEMS/ui-framework.md) §4 · §5 · §6 · [스토리](../02-SYSTEMS/story-quests.md) §6 · [홈](../02-SYSTEMS/home-base.md) §4
- [x] [`04-BACKLOG.md`](../04-BACKLOG.md) CI
- [x] `AGENTS.md` §4 R13 · §8-16 · §9 요약 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 새 함정 → 필드 §6(43~46) · UI §6 · 스킬 `verify-render`(홈타운 새 게임은 집 안) · `asset-pipeline`(건물 프리팹 로드 폐기)
- [x] 아티팩트 4개(절대 규칙 15) — 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 Version 3 ·
  구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 Version 3 · 채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 Version 3(「261차 기준」 줄만 — 문법은 258 그대로) ·
  전체 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c Version 58
