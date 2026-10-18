---
name: add-region
description: Pixel Angler 신규 지역(타일맵 필드) 추가 절차 — 실지형 PNG → 타일 JSON → 맵 그래프 → 출조 개방. 새 지역/맵 추가, 타일맵 재생성, 맵 연결·스폰 문제 작업이면 반드시 로드. "지역 추가", "타일맵", "build_region_maps", "출조 구역", "맵 연결" 작업이면 이 스킬을 따른다.
---

# 신규 지역(타일맵) 추가

> ⚠ **100차부터 신규 지역의 기본 경로는 OSM 심리스(아래 §OSM)** — 손그림 legacy 파이프라인은
> 기존 지역(부산·홈타운) 유지보수용으로만 남는다.

## OSM 심리스 파이프라인 (v2 — 2026-08-27, 스펙 `.agents/OSM_TILEMAP_SPEC.md`)

```
tools/regions_config.py 에 지역 bbox 등록 (v4 — 262차: 속초 크기 bbox 규칙 · 신규는 bbox·seaEdges·spawn 한 줄)
  → py tools/fetch_region_osm.py <region>     (Overpass 1회 온라인 — 파츠 캐시, 재수집 = 파일 삭제)
  → py tools/build_osm_tilemap.py <region>    (→ pixelazed/<region>/terrain.png·pois·meta)
  → py tools/build_region_maps.py <region>    (meta.json 존재 = 심리스 분기 → seamless.json + 복사)
  → py tools/extract_osm_buildings.py · extract_lights.py · merge_capture_pois.py <region>   (건물 · 등대 · 게임 상호 — 순서 고정)
  → core RegionMap.ts SEAMLESS_REGIONS 등록 + WorldMap.ts REGION_AREA_NODES 구역 노드
     (등록 시 **nameEn 도 함께 채운다** — 지명은 사전이 아니라 데이터가 정본, 120차)
  → RegionFieldScene가 자동으로 심리스 모드(SeamlessChunks 청크 스트리밍)로 연다
```

### 262차 — 수집은 GitHub Actions · 지역 하나에 데이터 지역 여럿 · 구역별 스폰

- **원격 작업 컨테이너는 Overpass · OSM 미러가 전부 막혀 있다**(403 — 환경 네트워크 정책). 수집은 워크플로
  **「OSM 지역 수집」**(`.github/workflows/osm-region.yml`)이 러너에서 fetch → build → 건물 · 등대 · 게임 상호까지 돌리고
  산출물(`pixelazed/_osmcache/<region>*` · `pixelazed/<region>/` · `public/data/<region>/`)을 **실행한 브랜치에 커밋**한다.
  - main에 이 파일이 있으면 Actions 탭 「Run workflow」(브랜치 · regions · refetch). **main에 없는 브랜치에서는 Run workflow · API dispatch가 404**다 —
    `pixelazed/_osm_request.txt`에 지역 키를 적어(한 줄 하나 · `refetch` 줄 = 캐시 지우고 다시) 푸시하면 그 푸시가 수집을 깨운다(요청 번호 주석을 올려 파일을 바꾼다).
  - 끝나면 `git pull`. 러너 로그에 sea ratio · 스폰 스냅 · 걷기 성분 · 「표에 없는 가게 이름」이 찍힌다 — 그 이름으로 `pixelazed/<region>/name_alias.json`을 쓰고
    `python tools/merge_capture_pois.py <region>`을 다시 돌린다(캡처 파일이 없는 지역은 게임 상호만 적용 — 262차).
  - 12지역 한 번에 돌리면 약 10분. 구역 셋이 한 bbox에 들면 bbox 하나(속초), 10km 떨어지면 데이터 지역을 나눈다(부산 감천 · 백운포).
- **bbox는 속초 크기(약 3.5~4.3 × 5.4~6 km · 75만~105만 타일)** — v3의 큰 bbox(1.3~3.3M)는 수집 안 하고 기록만 남겼다(`regions_config.py` 머리말).
  `seaEdges`는 **바다가 확실한 변만**(육지가 걸리는 변에 시드를 두면 내륙이 침수 — 백운포는 남쪽이 신선대 부두라 'E'만).
  항 머리가 bbox 밖이면 양안이 다른 걷기 성분이 된다(감천 요청 1 — N 35.082 → 35.090으로 다시).
- **지역 하나 안에 데이터 지역이 여럿**이면 core `SEAMLESS_AREA_REGIONS[fieldMapId]`(구역 → 데이터 지역)에 넣는다.
  `seamlessRegionOf(regionId, mapId)` — 표에 없는 구역은 `SEAMLESS_REGIONS[regionId]`(지역 기본). 레거시 맵 그래프는 없어도 된다(심리스 모드).
- **구역별 스폰은 `RegionAreaNode.spawnLatLon`(WGS84)** — 필드가 meta bbox 등장방형으로 타일을 구해 `nearestWalkable`로 스냅한다.
  bbox를 다시 잘라도 좌표는 그대로 쓸 수 있다. 자리는 `terrain.txt`(걷기 성분 · 'b' 띠)에서 고르고 하네스로 `dist 0.0`을 확인한다.
  ⚠ **스폰 좌표를 기억으로 적지 말 것**(262차 해금강 — 「바람의 언덕 34.76°N」이 실제는 34.74°N이라 설정 스폰이 바다였고, 러너의 전역 폴백이 1.4 km 밖 갯바위를 골랐다).
  `pois.json`의 이름 있는 POI 칸(유람선 터미널 · 항 수협 · 방파제 등대)을 bbox로 되돌린 위도 · 경도를 쓴다 — `lat = N − (ty+0.5)/H·(N−S)` · `lon = W + (tx+0.5)/W·(E−W)`.
  `meta.spawnApprox`는 항상 true라 판정 근거가 아니다 — 러너 로그의 `[warn] 스폰 스냅 실패`와 하네스 `dist`로 본다. 캐시가 있으면 로컬 재굽기(`python3.13 tools/build_osm_tilemap.py <r> --no-raster` …)로 `meta.spawn`만 바뀐다.
  구역의 `pixelX/Y`(zoom_{slug} 256×256 위 핀)는 대략값 — 핀 편집 Dev Tool로 다듬는다.
- **지역이 열리는 조건은 둘이다(263차)** — 구역 노드가 있고(`isRegionUnlocked`) **그 지역을 여는 장이 왔을 때**(`isRegionOpenAtChapter` · `STORY_CHAPTERS.regionIds`).
  새 지역 id를 장 데이터에 넣지 않으면 처음부터 열린다. 월드맵 잠긴 줄은 「아직 갈 수 없는 곳」 — 장 번호를 화면에 내지 않는다(R2).
- **인물 · 트리거 · 장소 칸은 데이터 지역에 묶는다(263차)** — `STORY_NPC_PLACEMENTS` · `STORY_FIELD_TRIGGERS` · `STORY_PLACES`의 `dataRegion`.
  데이터 지역이 여럿인 지역(부산 · 거제 · 태안 · 제주)에서 빠뜨리면 모든 필드에 같은 칸으로 선다. bbox를 바꾸면 그 지역의 `tx/ty`는 전부 다시 잰다(위도 · 경도 스폰만 그대로).
  칸 고르기 = scratchpad `place_npcs.py` 패턴(POI 옆 · 큰 걷기 성분 · 낚시는 물가 2칸 안) — 지역만 있던 줄은 **제자리에서** 갱신한다(안내 화살표가 첫 항목을 본다).
- **위판장은 OSM 종류가 아니라 이름으로 판정한다(263차)** — 부산공동어시장은 `shop=supermarket`. `poiBuildingKind` 이름 규칙(공동어시장 · 수협 · 위판 · 어판장 · 공판장 · 활어센터) + `AUCTION_NAME`.
- **하네스**: 출조 구역마다 `scene.restart({ region, mapId })` → `playerTile()` · `seamlessDef.dataRegion` · 건물 · 가게 · 등대 · 404 · pageerror
  (262차 `harness_regions.cjs` 패턴 — 18구역 전부 `dist 0.0` · pageerror 0).

- **스펙 §0.5 코드 정합 노트가 본문보다 우선** — **1타일 = 5m · 심리스 TR 32px**(legacy 20) ·
  타일 8종(`. ~ # , r w s b` — `w` = 보도) · 도로 폭 미터 기준(`ROAD_W_M`) ·
  캐스팅 = 기존 물가 규칙(b/s 전용 아님) · POI 거래 매핑 범위 · worldX 금지.
- 비주얼은 `SeamlessChunks.bakeChunk`(Kenney 지면 베이스 + 절차 전이) — 지역 추가 시 별도 작업 불필요.
  **도로 그림은 `roads.json` 벡터 밴드**(보도→연석→아스팔트 — 타일 `r`/`w`는 걷기·스폰 판정 전용) ·
  차선·중앙선은 교차 정점에서 조각 인셋(축 정렬은 타일 중앙 스냅). 건물 = **OSM 윤곽 + 2.5D 벽 + 지붕**(`BuildingArt` · 239차),
  주행 차량 = `TrafficSystem`(모든 정점 노드 그래프 · 맵 안 도로만).
- **건물 충돌 = 그림 윤곽 4px 띠**(258차 · `unitBodyRects`) — 윤곽이 덮은 '#' 칸에는 칸 몸체가 없다(옛 「하단 2줄 충돌」 아님).
  걷기 칸 · 가게 문 자리는 몸(14px)이 서는 칸만(`SeamlessChunks.tileFitsBody`). 윤곽 둘이 맞붙은 1칸 틈은 막힌다.
  새 지역 · 윤곽 갱신 뒤 `python3.13 -I tools/check_building_reach.py <데이터 폴더> <씨앗 x> <씨앗 y>`로
  「옛 규칙에서 닿던 문 · 인물 자리가 새 규칙에서 안 닿는가」를 본다(속초 = 잃은 문 1 · 문 이동 24).
- 프롭은 `PROP_DEFS` 한 줄 = 충돌·편집기 격자·겹침 판정까지 자동(`propFootprint`). 타일셋 크롭 추가는
  `_survey/*_zoom.png` 격자 라벨로 좌표를 확정한 뒤 `extract_tileset_assets.py`에 bbox로 넣는다.
- **수동 손질은 dev 맵 편집기(F7)** — 지형/프롭/지붕 페인트 + **도로 벡터 툴**(도구 탭 — 정점 이동/삽입/
  삭제, 저장 시 `patch.json.roads` 전체 오버라이드가 roads.json을 대체) → 저장하면 `pixelazed/<region>/patch.json`
  (정본). `build_region_maps`가 패치를 굽고 `roads.json`/`patch.json`을 `public/data/`에 **항상** 복사
  (없으면 SPA 폴백 pageerror). Ctrl+클릭 = 순간이동(맵·미니맵)으로 검수 지점 이동.
- 빌드 후 **필수 검수**(§9): terrain.png ↔ OSM 화면 육안 대조 · sea ratio 25~65%(밖이면 해안선
  누수 — PNG에서 막고 재실행) · 스폰이 최대 걷기 컴포넌트에 있는지(build_region_maps 리포트) ·
  섬은 도보 불가.
- terrain.png = **손수정 정본**(파이프라인 재실행이 덮어쓴다 — 수정본은 별도 백업 후 재실행 주의).
- ⚠ 대형 지역 수집은 수백 MB·수십 분 가능(요청 간 5초 대기). 서해(taean)는 seaEdges 경고 시 조정.
- ⚠ `pointer.worldX/Y` 사용 금지 — 스크롤 카메라에서 미갱신. `RegionFieldScene.pointerWorld` 경유.
- 청크 크기(64) 변경 시 `SeamlessChunks` 기본값과 `RegionFieldScene.SEAMLESS_CHUNK_TILES` 동시 수정.

## legacy 파이프라인 (손그림 — 부산·홈타운)

```
pixelazed/<region>/<mapId>.png  (실지형 픽셀 지도 — 파일명 = mapId)
  → tools/build_region_maps.py REGIONS 딕셔너리에 지역 등록
  → py tools/build_region_maps.py <region>
  → packages/client-pc/public/data/<region>/<mapId>.json
  → core/src/types/RegionMap.ts 맵 그래프 등록
  → RegionFieldScene 자동 렌더 (타일 베이킹 + 병합 충돌 + 엣지 전환)
```

- 타일 문자: `.`=육지/도로 `~`=바다(이동불가·낚시) `#`=건물(충돌) `,`=잔디
- 지형 분류 색 팔레트 변경 = `classify()` 수정 후 재생성.
- 후처리 순서(스크립트 내장): `bridge_diagonals` → `connect_components` → `bridge_diagonals` 재보정.
  - **connect_components**: 끊긴 걷기 컴포넌트를 최근접 쌍 직선 카브로 자동 연결 — **연결선은 반드시 4-연결**(대각 스텝은 걷기 판정에서 끊김 — 19차 실측), 대형 육지(300+)는 임의 다리 방지로 연결 안 함. 재생성 후 잔여 컴포넌트 수 확인(고립 바위 몇 개는 정상).

## core 등록 (`core/src/types/RegionMap.ts`)

1. `<REGION>_MAP_GRAPH` 작성 — 맵 체인·엣지 링크(방향별 인접 맵). 엣지 없음 = 4방 경계 이동 불가(홈타운 패턴).
2. `REGION_MAP_GRAPHS`에 등록.
3. **`depthProfileUrl`은 실측 수심 JSON이 있는 지역만** 지정 — 미등록 지역에 무조건 로드시키면 Vite SPA 폴백이 index.html을 돌려줘 **JSON 파싱 pageerror** (17차 부산 검증에서 실측). 수심 JSON은 `tools/build_depth_profiles.py`.
4. 출조 개방 = `WorldMap.ts`의 `REGION_AREA_NODES`에 구역 노드 추가 (핀 좌표·fieldMapId·details·depthRangeM·snagRisk). **노드 존재 = `isRegionUnlocked` 자동 해제** / 타일맵 미완성이면 `enterable: false`(핀·설명만 표시, 진입 차단).

## 스폰·검증

- 출조 진입(entryEdge 없음) = 맵 중앙 `nearestWalkable` 자동 / 맵 간 이동 = 진입 엣지 밴드 한정 스폰(entryT 유지) — 신규 코드 불필요, 기존 로직이 처리.
- 검증: 실렌더로 ① 스폰 위치 정상(걷기 가능) ② 바다/건물 충돌 ③ 엣지 전환 왕복 ④ pageerror 0 (verify-render 스킬). 방파제 맵은 바다 비율(70%+)과 통로 연결성 확인.
- 지역 실측 데이터 연동(선택): `REGION_TO_MMSI`(해양기상 관측소) · `REGION_TO_SIDO`(KOSIS) · `REGION_TO_INDEX_KEYWORDS`(낚시지수) — 매칭 가능한 것만.

## 항로표지 등대 (114차)

지형 빌드 뒤 **등대는 따로** 뽑는다 — 파이프라인 POI는 이름 있는 노드만 남겨 방파제 두부 등대
(이름 없는 `seamark:type=light_minor`)가 빠진다.

```bash
py tools/extract_lights.py <region>        # → public/data/<region>/lights.json
```

## POI 상호명 영문 (120차)

`build_osm_tilemap.py` 는 OSM `name:en` 을 `pois.json.nameEn` 으로 함께 내보낸다 — 신규 지역은 자동이다.
**이미 구워둔 지역**만 백필이 필요하다(전체 재빌드는 래스터 병합·검증까지 다시 돌아 비싸다):

```bash
py tools/backfill_poi_nameen.py <region>   # 정본 + public 사본 동시, 멱등
```

~~`name:en` 이 없는 상호는 `en_pois.ts` 에 손으로 넣는다~~ — **218차부터 가게 이름은 게임 상호**다(아래).

## 게임 상호 · 캡처 POI (217 · 218차 — 필수)

가게 이름은 **실제 상호를 조금씩 바꾼 게임 상호**로 나간다(사용자 지시 — 상호명 저작권).
표 = `pixelazed/<region>/name_alias.json`(원래 이름 → `{ko, en}`), 적용 = 병합 스크립트:

```bash
py tools/merge_capture_pois.py <region>   # 캡처 POI 병합 + 게임 상호 적용 — pois.json 정본 · public 동시, 멱등
```

- **`pois.json`을 쓰는 도구(`build_osm_tilemap.py` · `backfill_poi_nameen.py`) 다음에는 반드시 이것을 마지막에** 돌린다 —
  안 돌리면 캡처 가게가 사라지고 이름이 실제 상호로 돌아간다.
- 스크립트가 「표에 없는 가게 이름」을 찍으면 표에 추가한다(공공 · 협동조합 · 지명은 일부러 뺀다).
  업종 말(횟집 · 물회 · 활어 · 호텔 · 포차 · 약국 · 편의점 · 마트)은 남긴다 — 간판 그림 · 실내 틀이 그 말로 갈린다.
  프랜차이즈는 가상 브랜드(GX24 · QU · 스타빈스 · 사이소) — 다른 지역에서도 같은 이름을 쓴다.
- 가게 영어 이름을 `en_pois.ts`에 적지 않는다(실제 상호가 번들에 남는다). 거기는 공공 시설 · 지명 · 수협만.
- 사용자 지도 캡처 정합: 캡처마다 **배율부터** 잰다(확대 단계가 바뀐다). OSM 이름 붙은 장소 5곳 이상 최소제곱 → 도로선 겹쳐 보기로 확인
  (상세 217 · 218 워크로그 §2).

그리고 core `SEAMLESS_REGIONS[<id>].hasLights = true`. ⚠ 파일 없이 플래그만 켜면 Vite dev SPA 폴백이
index.html을 돌려줘 JSON 파싱 pageerror(함정 — depthProfileUrl과 동일). 방파제 단면(테트라포드/사석/
상판)은 `computeBreakwaters`가 지형에서 자동 산출하므로 별도 데이터가 없다.

## 건물 윤곽 · 종류 · 층수 (239차 — 필수 · 262차부터 워크플로가 함께 뽑는다)

건물 그림은 `'#'` 타일이 아니라 **OSM 폴리곤**으로 선다(`scenes/field/BuildingArt.ts`). 지형 빌드 뒤 따로 뽑는다:

```bash
py tools/extract_osm_buildings.py <region>   # → public/data/<region>/buildings.json + pixelazed/<region>/buildings.json
```

- core `SEAMLESS_REGIONS[<id>].hasBuildings = true` — `hasLights`와 같은 SPA 폴백 함정(파일 없이 플래그만 켜면 pageerror).
- 폴리곤이 `'#'`을 하나도 안 덮으면(지형 패치로 지워진 자리) 그리지 않는다 · 폴리곤이 없는 `'#'` 성분은 타일 윤곽(DP 0.85타일)으로 선다 —
  `trimBuildingsOnRoads`가 깎은 자리도 폴리곤 범위 안이면 그림은 폴리곤을 따른다(걷기는 타일).
- 종류 매핑은 `KIND_OF`(apartments · commercial · house · public · industrial · roof · yes) — 새 OSM 값은 거기에 더한다. `amenity=shelter`는 프롭(정자)이라 뺀다.
- 지역 캐시(`pixelazed/_osmcache/<region>*.json`)가 있어야 한다 — `fetch_region_osm.py` 산출.

## 어촌계 어장 폴리곤 (121차)

```bash
py tools/extract_fishfarms.py <region>      # → public/data/<region>/fishfarms.json (지역 bbox 교차 폴리곤만)
```

- 원본 = `docs/reference/gis/khoa_fishfarm_20250813/TL_DIST_FSHFRM.*`(국립해양조사원 어장정보, EPSG:5179, 114MB —
  **gitignore**, 없으면 공공데이터포털 15130109에서 다시 받아 같은 폴더명으로). 파생 JSON(수 KB)만 커밋.
- core `SEAMLESS_REGIONS[<id>].hasFishFarms = true` — `hasLights`와 같은 SPA 폴백 함정(파일 없이 플래그만 켜면 pageerror).
- 마을어업(`village`)·협동양식업(`coop`)이 강원 조례 금지 구역. 다른 도는 조례가 다르다 — 지역 추가 시 규제 상수 확인.
- 채집 스팟 후보는 지형에서 자동(`ForageSystem.computeCandidates`) — 별도 데이터 불요.

## 섬 드론 사진 → 갯바위 타일 (115차)

```bash
py tools/pixelize_islet.py <photo.png> --region <region> --name <islet> --grid 32x27 --center <c>,<r> [--dry]
```

- 시트 `public/tileset/<islet>/sheet.png`(물 투명) + `patch.json`(정본·런타임) 병합. `--dry`로 본토 충돌 먼저 확인.
- 런타임 등록 = `TilesetManifest.ISLET_SHEETS`에 이름 추가(셀은 `ensureSheetCell`이 자동 슬라이스).
- 그리드는 사진 종횡비를 보존하되 **본섬 bbox가 인게임 섬 성분 bbox와 같아지게** 크기를 정한다(조도 72×60 → 41×33 정합).
  `--center` = 인게임 성분 무게중심 · `--islet-max` = 그 성분 타일 수 이상(래스터 `'r'` 섞인 섬은 600을 넘는다).
- ⚠ 섬 위치는 `islet` 플래그가 아니라 **`lights.json`·POI 좌표**로 확정한다(116차 — 엉뚱한 섬에 적용한 전례).
- 램프는 휘도 **순위 균등화** — 분위 정규화는 밝은 사진에서 너무 밝다.

## 위키 지도 탭 캡처 (264차)

새 지역을 굽거나 지형 · 가게 · 인물 자리를 바꾸면 위키 「지도」 탭의 그림도 다시 찍는다(게임 렌더러 그대로 — 검수용 조감도).

```bash
npx pnpm --filter @tra/client-pc run dev                      # dev 서버(5173)
node tools/capture_wiki_maps.cjs <출력 폴더> [데이터 지역 …]   # 지역을 안 적으면 15지도 전부(지역당 약 4분 · 홈타운 포함)
node tools/dump_wiki_map_data.mjs                             # 인물 자리 · 장소 · 현장 · 가게 종류 → tools/wiki_map_data.json
node tools/gen_game_wiki_data.mjs --html > <폴더>/index.html   # 지도 탭 데이터는 meta.json · pois.json · lights.json · fishfarms.json에서
```

- 새 데이터 지역은 `capture_wiki_maps.cjs`의 `MAPS` 표에 `[지역 id, 구역 fieldMapId]` 한 줄을 더한다(어느 구역이든 같은 데이터 지역이면 같은 지도).
- 하네스는 페이지 `Date`를 정오 KST로 밀고(밤 명암 · 가로등 없음) 사람 · 차 · 날씨 · HUD · 글자를 숨긴 뒤, 화면을 3,072px로 키우고
  `chunks.update`를 쥐어(`__force`일 때만 원래 갱신) 청크 3×3 블록마다 `preloadAround` → `postrender`에서 캔버스를 1/4(타일당 8px)로 누적한다.
  카메라 bounds는 떼야 가장자리 블록 중심을 잡는다. 산출 = `maps/<지역>/s_<col>_<row>.webp`(4,096 시트) · `overview.webp`(2px) · `index.json`.
- 아티팩트에는 바뀐 지역의 시트만 `files`로 올린다(파일 상한 511 — 그림 283 + 지도 + index.html). 가게 종류 핀은 씬 규칙 복제(`dump_wiki_map_data.mjs`)라 씬을 고치면 같이 고친다.
