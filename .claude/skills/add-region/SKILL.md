---
name: add-region
description: Pixel Angler 신규 지역(타일맵 필드) 추가 절차 — 실지형 PNG → 타일 JSON → 맵 그래프 → 출조 개방. 새 지역/맵 추가, 타일맵 재생성, 맵 연결·스폰 문제 작업이면 반드시 로드. "지역 추가", "타일맵", "build_region_maps", "출조 구역", "맵 연결" 작업이면 이 스킬을 따른다.
---

# 신규 지역(타일맵) 추가

> ⚠ **100차부터 신규 지역의 기본 경로는 OSM 심리스(아래 §OSM)** — 손그림 legacy 파이프라인은
> 기존 지역(부산·홈타운) 유지보수용으로만 남는다.

## OSM 심리스 파이프라인 (v2 — 2026-08-27, 스펙 `.agents/OSM_TILEMAP_SPEC.md`)

```
tools/regions_config.py 에 지역 bbox 등록 (17개 기등록 — 신규는 bbox·seaEdges·spawn 한 줄)
  → py tools/fetch_region_osm.py <region>     (Overpass 1회 온라인 — 파츠 캐시, 재수집 = 파일 삭제)
  → py tools/build_osm_tilemap.py <region>    (→ pixelazed/<region>/terrain.png·pois·meta)
  → py tools/build_region_maps.py <region>    (meta.json 존재 = 심리스 분기 → seamless.json + 복사)
  → core RegionMap.ts SEAMLESS_REGIONS 등록 + WorldMap.ts REGION_AREA_NODES 구역 노드
  → RegionFieldScene가 자동으로 심리스 모드(SeamlessChunks 청크 스트리밍)로 연다
```

- **스펙 §0.5 코드 정합 노트가 본문보다 우선** — **1타일 = 5m · 심리스 TR 32px**(legacy 20) ·
  타일 8종(`. ~ # , r w s b` — `w` = 보도) · 도로 폭 미터 기준(`ROAD_W_M`) ·
  캐스팅 = 기존 물가 규칙(b/s 전용 아님) · POI 거래 매핑 범위 · worldX 금지.
- 비주얼은 `SeamlessChunks.bakeChunk`(Kenney 지면 베이스 + 절차 전이) — 지역 추가 시 별도 작업 불필요.
  **도로 그림은 `roads.json` 벡터 밴드**(보도→연석→아스팔트 — 타일 `r`/`w`는 걷기·스폰 판정 전용) ·
  차선·중앙선은 교차 정점에서 조각 인셋(축 정렬은 타일 중앙 스냅). 건물 = **2.5D**(하단 2줄 충돌 · Kenney
  키트 지붕+벽 RenderTexture y-sort), 주행 차량 = `TrafficSystem`(모든 정점 노드 그래프 · 맵 안 도로만).
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

그리고 core `SEAMLESS_REGIONS[<id>].hasLights = true`. ⚠ 파일 없이 플래그만 켜면 Vite dev SPA 폴백이
index.html을 돌려줘 JSON 파싱 pageerror(함정 — depthProfileUrl과 동일). 방파제 단면(테트라포드/사석/
상판)은 `computeBreakwaters`가 지형에서 자동 산출하므로 별도 데이터가 없다.

## 섬 드론 사진 → 갯바위 타일 (115차)

```bash
py tools/pixelize_islet.py <photo.png> --region <region> --name <islet> --grid 32x27 --center <c>,<r> [--dry]
```

- 시트 `public/tileset/<islet>/sheet.png`(물 투명) + `patch.json`(정본·런타임) 병합. `--dry`로 본토 충돌 먼저 확인.
- 런타임 등록 = `TilesetManifest.ISLET_SHEETS`에 이름 추가(셀은 `ensureSheetCell`이 자동 슬라이스).
- 그리드는 사진 종횡비를 보존해 정한다(왜곡 금지). 램프는 휘도 **순위 균등화** — 분위 정규화는 밝은 사진에서 너무 밝다.
