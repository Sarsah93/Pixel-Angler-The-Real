# OSM 실지형 타일맵 재구축 스펙 — 속초 심리스 v2 (`sokcho_v2`)

> ## §0.5 코드 정합 노트 (2026-08-27 구현 — 본문과 다른 확정 사항, **본문보다 우선**)
>
> 1. **타일 픽셀 = 32px** (`RegionFieldScene TR = seamlessDef ? 32 : 20` — 101차 후속 2에서
>    20 → 32 전환, 20px는 legacy 그래프 맵 전용). 청크 **32타일 = 1024px** RenderTexture,
>    3×3 상주 + LRU 풀 12장. §0-1의 크기 수치는 32px·32타일 기준으로 재계산해 읽을 것.
>    (2026-09-02 정정 — 구 표기 "20px·청크 64타일"은 101차 후속 2 이전 값이었다.)
> 2. **캐스팅 판정은 §5의 "b/s 전용"이 아니라 기존 물가 규칙 유지** — 속초 OSM에
>    `man_made=breakwater|pier|quay` 태그가 거의 없어(실측 `b` 25타일 / 방파제는 해안선
>    폴리곤 육지로 그려짐) 스펙대로면 낚시가 사실상 불가. 판정 = **걷기 가능 타일 + 인접 8방향
>    바다**(b/s 포함). `isFishableStandTerrain`(core)은 b/s 보너스용으로 예약만 해 둠.
> 3. **POI 상호작용은 거래 가능 매핑만 개방** — OSM shop 종류 → 기존 SHOP_CATALOG 6종
>    (convenience/supermarket→마트/seafood→직판장/식당/카페/주점). 화장실·파출소 등
>    비거래 시설은 마커+라벨만 (전용 씬 후속).
> 4. **심리스 여부는 지역 등록으로 판정** — `core/RegionMap.ts`의 `SEAMLESS_REGIONS`
>    (`gangwon_sokcho` → `sokcho_v2`) × `ACTIVE_REGION_MODE`. 부산·홈타운 등 미등록 지역은
>    모드와 무관하게 legacy 그래프로 동작한다 (전역 플래그 하나로 전 지역이 바뀌지 않음).
> 5. **잠복 실버그 수정 동반**: `pointer.worldX/Y`는 스크롤된 카메라에서 갱신되지 않아
>    스크린 좌표가 그대로 들어온다 (소형 맵은 스크롤 ≈ 0이라 우연히 정답 — 심리스에서 발현).
>    조준/설치는 `camera.getWorldPoint` 경유로 교체 (`RegionFieldScene.pointerWorld`).
> 6. seamless.json의 `pois` 필드는 비워 두고 **OSM POI는 별도 `pois.json`**(RegionPoi 스키마)을
>    쓴다. 문(door) 자동 배치는 걷기 타일 전체를 허용하되 r/. 를 우선한다.
> 7. **`TILE_M = 5` 확정** (101차 — 사용자 "건물·도로가 캐릭터보다 작게 체감, 맵 2배로").
>    속초 1179×642(≈76만 타일). §12 표의 타일 수·§0-1 수치는 ×4로 재계산해 읽을 것.
>    **도로 폭은 미터 기준**(`ROAD_W_M`)으로 전환 — TILE_M 변경에도 실폭 유지, 차도는 게임
>    체감상 다소 관대(주간선 22~28m). 차도 양옆에 보도 프린지(+2타일) 자동 생성.
> 8. **타일 문자 8종** — §2의 7종에 **`w` 보도/인도**(#b8bcc4, walkable) 추가.
>    차도(r)와 분리해 연석·차선 렌더의 기준이 된다.
> 9. **§11 L1·L3는 절차(procedural) 구현으로 선반영** (101차 — SeamlessChunks 베이커):
>    잔디/맨땅/모래 스페클 · 차선 점선(도로 축 자동 판정)·연석 · 보도/부두 신축이음 ·
>    계선주·해안 포말·파도·배 · 건물 = 연결요소 박공/패널 지붕 + 그림자 · 나무 스프라이트(y-sort).
>    에셋 타일셋(§11 최소 에셋 세트)이 오면 같은 자리에서 교체한다. L4(NPC)는 미착수.
> 10. **차선·중앙선은 벡터**(101차) — 래스터라이저가 `roads.json`(차도 폴리라인·폭)을 동반 출력하고
>     클라이언트가 임의 각도로 그린다(노란 중앙 실선 ≥ 2타일 · 흰 점선 차선 · 대각선 대응).
>     **dev 맵 편집기(F7)** = `patch.json`(타일/프롭/지붕 오버라이드 — §11 L3 `props.json` 역할 통합):
>     vite dev 미들웨어가 `pixelazed/<region>/patch.json`(정본)에 저장, `build_region_maps`가 굽는다.
> 11. **§11 L2·L3·L4 에셋 = `pixelazed/tileset/` 통합**(101차 후속) — Gemini 생성본(빌딩·팝업·횟집·
>     정자·테트라·경계·NPC 5) + TopDownCityPack(FisherG) + Kenney Roguelike City(CC0).
>     추출 = `tools/extract_tileset_assets.py`(survey→build), 매니페스트 = `data/TilesetManifest.ts`,
>     배치 규칙 = `SeamlessChunks.PROP_DEFS`/`RegionFieldScene.poiVisualTex`. 지면 타일셋(L1)은
>     TR 32 전환(101차 후속 2)으로 **Kenney 16px ×2 정수 재베이크 적용됨**(`ensureGroundTextures`)
>    — 구 "비정수비로 미적용" 표기는 TR 20 시절 값(2026-09-02 정정).
>     차도 폭은 `ROAD_LANES`(방향당 차로) 기준 재산정, 마킹은 차도 타일 안에 들어온다.
> 12. **심리스 TR = 32px**(사용자 확정 2026-08-28 — 1항의 20px 갱신). Kenney 16px 지면 타일 ×2 정수
>     배율. 청크 32타일 = 1024px RT · 이동 210px/s · legacy 맵은 20 유지(`RegionFieldScene` init 분기).
>     지면 L1 = Kenney 베이스(`GROUND_CELLS` 명시 셀) + 절차 전이 레이어. 바다·건물은 절차 유지.
> 13. **건물 = 2.5D**(101차 후속 3): `#` 충돌은 풋프린트 **하단 2줄만**, 지붕은 컴포넌트 스프라이트
>     y-sort(위쪽 줄 진입 시 캐릭터 가림). 상점 프리팹(팝업/횟집)은 문 앞 별도 오브젝트 + 자체 충돌.
>     주행 차량 = `TrafficSystem`(roads.json 그래프·우측통행). 정차 차량은 연석 쪽 극소수.
> 14. **도로 그림 = 벡터 밴드**(101차 후속 5~7): 타일 `r`/`w`는 판정 전용. roads.json에 `roundabout`/`oneway`
>     플래그(pts 순서 = 주행 방향). 회전교차로 = 교통섬·양보선·링 우선, 왕복 4차로 = 이중 황색선, 횡단보도·정지선은
>     교차 정점 조각 끝(겹침은 줄무늬 생략). 편집기 도로 툴은 `patch.json.roads`로 roads.json을 대체한다.


> 목표: 손그림 추정 지형("테두리만 육지, 나머지 바다") 폐기.
> **OpenStreetMap 벡터 데이터**를 10m/타일로 래스터라이즈해 실지형 심리스 단일 맵을 만든다.
> 사진·타일 이미지를 갖다 붙이는 방식이 아니라, **벡터 → 자체 팔레트 픽셀**이므로
> 라이선스는 ODbL(크레딧 "© OpenStreetMap contributors" 표기)로 해결된다.
> 기존 속초 7맵 체인은 삭제하지 않고 **비활성 보존**한다.

---

## 0. 확정 결정사항

| 항목 | 결정 |
|---|---|
| 구조 | **심리스 단일 맵** (7맵 엣지 전환 제거, 사용자 확정) |
| 범위 | 청초호 ~ 속초항 ~ 동명항 ~ 영금정, 동쪽 바다 조도 포함 |
| bbox | 남서 (38.183, 128.570) ~ 북동 (38.218, 128.635) |
| 스케일 | **1타일 = 10 m** (`TILE_M` 상수 하나 — 벡터 원본이므로 언제든 5m로 재생성 가능) |
| 격자 | **569 × 389 타일** (실측 5.69 × 3.89 km, ≈ 221,000타일) |
| 데이터 | OSM Overpass API 1회 수집 → 로컬 캐시 → 오프라인 반복 빌드 |
| 손수정 | 산출 PNG(1px=1타일)가 기존처럼 **직접 그려 고치는 원본** — 파이프라인 재실행 시 덮어쓰므로 수정본은 별도 파일명 유지 |

### 0-1. "맵이 엄청 커지는가"에 대한 수치 답변

커진다. 하지만 전부 관리 가능한 규모다:

- **데이터**: 221k 타일 문자 ≈ 222 KB (JSON). 문제 없음.
- **월드 크기**: 타일 32px 기준 18,208 × 12,448 px. 캐릭터 이동속도 200px/s 가정 시
  **동서 횡단 약 91초** — 한 지역 규모로 적당하다.
- **렌더링**: 통짜 베이킹은 **불가능**하다(GPU 최대 텍스처 16,384px 초과, RGBA로 911 MB).
  → §6의 **청크 스트리밍 베이킹**이 필수 변경점이다. 64×64타일(2048px) 청크 63개 중
  카메라 주변 9개만 상주 ≈ VRAM 150 MB. 충돌 바디도 청크 단위로만 생성.
- **캐릭터 크기**: 그대로. 다만 1타일=10m이므로 건물이 상대적으로 작아진다
  (동명항 어시장급 60×20m 건물 = 6×2타일). 밀도감이 부족하면 `TILE_M=5`로 재생성
  (1138×778타일, 여전히 청크 방식으로 문제없음) — **코드 수정 없이 상수 1개**.

---

## 1. 파이프라인 전체 그림

```
[1회, 온라인]  py tools/fetch_region_osm.py sokcho_v2
                 → pixelazed/_osmcache/sokcho_v2.json   (Overpass 원본 캐시)

[반복, 오프라인] py tools/build_osm_tilemap.py sokcho_v2
                 → pixelazed/sokcho_v2/terrain.png   1px=1타일 지형 원본 (손수정 대상)
                 → pixelazed/sokcho_v2/terrain.txt   같은 내용 문자 그리드 (diff·검증용)
                 → pixelazed/sokcho_v2/pois.json     상호작용 POI (타일좌표)
                 → pixelazed/sokcho_v2/meta.json     bbox·스케일·크기·팔레트

[기존 확장]     py tools/build_region_maps.py sokcho_v2
                 → client-pc/public/data/sokcho_v2/seamless.json (단일 맵 JSON)

[클라이언트]    RegionFieldScene: 청크 스트리밍 렌더 (§6)
```

두 스크립트는 이 스펙과 함께 전달됨(`tools/`에 배치). 합성 데이터로 E2E 검증 완료
(해안선 flood·호수·도로·건물·방파제·POI 9개 체크 전부 PASS).

## 2. 타일 문자 확장 — 4종 → 7종

| 문자 | 의미 | 이동 | 낚시 | PNG 색 |
|---|---|---|---|---|
| `~` | 바다·호수 | ✕ | ✓ | `#3b6fb0` |
| `.` | 육지 | ✓ | ✕ | `#cbb98d` |
| `#` | 건물 | ✕(충돌) | ✕ | `#4a4a52` |
| `,` | 잔디·공원·숲 | ✓ | ✕ | `#6da34d` |
| **`r`** | 도로(신규) | ✓ | ✕ | `#8a8a8a` |
| **`s`** | 모래사장(신규) | ✓ | ✓(원투) | `#e8d9a0` |
| **`b`** | 방파제·부두(신규) | ✓ | ✓★ | `#7a8894` |

- `r`은 이동 규칙상 `.`과 같지만 **시각 구분 + 추후 자전거 속도 보정**(BICYCLE_SYSTEM_SPEC 연동)을 위해 분리.
- `b`는 낚시 게임의 핵심 — 방파제 타일에서 인접 `~` 방향으로 캐스팅 가능 판정.
- 래스터 우선순위(뒤가 덮음): 육지 < 바다(flood) < 내수면 < 잔디 < 모래 < 도로 < 방파제 < 건물.

## 3. 지형 생성 알고리즘 (build_osm_tilemap.py 구현 내용)

1. **투영**: 국지 등장방형. `tx=(lon−W)·m_lon/10`, `ty=(N−lat)·m_lat/10`,
   `m_lat=111,132`, `m_lon=111,320·cos(38.2°)≈87,490`. 6km 범위에서 왜곡 <0.1%.
2. **바다**: `natural=coastline`을 3px 두께 장벽으로 래스터 → **동쪽 경계에서 flood fill**.
   조도(폐합 해안선 섬)는 장벽에 갇혀 자동으로 육지로 남는다. 장벽 셀은 최종적으로 육지 처리.
   `sea ratio`가 25~65% 밖이면 해안선 누수 경고 출력 → terrain.png에서 손으로 막고 재실행.
3. **내수면**: `natural=water` way/relation(청초호). relation은 outer/inner 링 조립(멀티폴리곤).
4. **피복**: landuse(grass·forest·meadow 등)·leisure(park 등)·wetland → `,` / `natural=beach` → `s`.
5. **도로**: `highway=*` 폴리라인을 클래스별 폭으로 스트로크(주간선 2~3타일=20~30m, 골목·보도 1타일).
6. **방파제·부두**: `man_made=breakwater|pier|groyne|quay`. 폐합 way는 면, 개방 way는 폭 2 스트로크.
7. **건물**: `building=*` way/relation 폴리곤 채움 → `#`.

## 4. POI 레이어 — 타일과 분리된 `pois.json`

건물을 지우지 않고 상호작용을 붙이기 위해 POI는 **별도 JSON**이다.

```jsonc
[{ "type": "toilet", "name": "공중화장실", "tx": 124, "ty": 151, "osmId": 1018 },
 { "type": "shop", "shopKind": "seafood", "name": "속초회센터", "tx": 123, "ty": 142, "osmId": 4 }]
```

추출 타입: `shop`(전 종류, shopKind 보존) · `toilet` · `police`(파출소) ·
**`ferry_terminal`(여객터미널 — 배낚시 확장 훅)** · `fuel` · `restaurant` · `cafe` ·
`market` · `bank` · `pharmacy` · `lighthouse`(등대) · `info` · `viewpoint`(영금정) ·
`lodging` · `fishing_spot`(OSM leisure=fishing 실제 낚시터 태그!).

**출입구 배치 규칙(클라이언트)**: POI 앵커 타일이 `#` 안이면, 앵커에서 가장 가까운
`r` 또는 `.` 타일을 문 위치로 삼아 상호작용 트리거를 놓는다. 자동 배치가 어색한 곳은
`pois.json`에 `"door": [tx,ty]` 필드를 손으로 추가하면 우선한다.

## 5. core 타입 변경 (`@tra/core`)

```ts
/** 지역 메타 — meta.json 로드 결과 */
export interface RegionMeta {
  region: string; bbox: [number, number, number, number];
  tileMeters: number; width: number; height: number;
}
export type PoiType = 'shop'|'toilet'|'police'|'ferry_terminal'|'fuel'|'restaurant'
  |'cafe'|'market'|'bank'|'pharmacy'|'lighthouse'|'info'|'viewpoint'|'lodging'|'fishing_spot';
export interface RegionPoi { type: PoiType; shopKind?: string; name: string;
  tx: number; ty: number; door?: [number, number]; osmId: number; }
```

- 타일 문자 유니언에 `'r' | 's' | 'b'` 추가. 이동 판정: `walkable = c==='.'||c===','||c==='r'||c==='s'||c==='b'`.
- 캐스팅 판정: `fishableFrom = (c==='b'||c==='s') && 인접8방향에 '~'` — 기존 "물가 육지" 규칙을 대체.
- `SOKCHO_MAP_GRAPH`는 **삭제하지 않는다**. `RegionMap.ts`에 `ACTIVE_REGION_MODE: 'legacy'|'seamless'`
  플래그를 추가하고 seamless일 때 그래프를 무시. (확정 타입 동결 규칙 §8 위반 아님 — 추가만 있음)

## 6. RegionFieldScene 변경 — 청크 스트리밍 (핵심 공정)

현재: 맵 전체를 1장으로 텍스처 베이킹 + 병합 충돌 바디. 569×389에서는 불가능(§0-1).

1. **청크 격자**: 64×64타일 = 2048×2048px(타일 32px 기준). 9열×7행 = 63청크.
2. **베이킹 풀**: `RenderTexture` 12개 LRU 풀. 카메라 중심 3×3청크를 상주시키고
   경계 넘을 때 가장 먼 것부터 재사용. 베이킹은 프레임당 1청크로 분할(스파이크 방지).
3. **충돌**: 청크 로드시 해당 청크의 `~`/`#` run-length 병합 스태틱 바디 생성, 언로드시 파괴.
   플레이어 주변 3×3청크만 바디 존재 — 전맵 동시 생성 금지.
4. **엣지 전환 코드**: seamless 모드에서 비활성(삭제 금지 — legacy 모드 폴백용).
5. **스폰**: 동명항 방파제 입구 부근 타일을 meta에 `spawn: [tx,ty]`로 지정(초기값은 Antigravity가
   terrain.txt 보고 결정).
6. **POI 렌더**: 상주 청크 내 POI만 아이콘/트리거 활성화. 상호작용 씬 진입은 기존 규칙
   그대로 `scene.stop()`+`scene.resume()` (절대규칙 2).

## 7. 기존 알고리즘에서 바뀌는 부분 요약

| 위치 | 현재 | 변경 |
|---|---|---|
| `tools/` | build_region_maps.py (색→4문자) | fetch/build 2종 **추가**, classify()에 신규 3색 추가 |
| `pixelazed/sokcho/` | 손그림 7장 | 보존(legacy). `sokcho_v2/` 신설 |
| `core/RegionMap.ts` | SOKCHO_MAP_GRAPH 체인 | `ACTIVE_REGION_MODE` 플래그 + RegionMeta/RegionPoi 타입 추가 |
| `RegionFieldScene` | 전맵 1장 베이킹·전맵 충돌 | 청크 스트리밍 베이킹·근접 충돌(§6) |
| 낚시 판정 | 물가 육지 캐스팅 | `b`/`s` 타일 기반 `fishableFrom` |
| 데이터 | `data/sokcho/<mapId>.json` ×7 | `data/sokcho_v2/seamless.json` 1개(+pois·meta) |

## 8. Antigravity 작업 순서 (그대로 지시문으로 사용)

```
0. git 커밋으로 현 상태 스냅샷. .agents/IMPLEMENTATION_PLAN.md에 본 작업 항목 추가.
1. tools/fetch_region_osm.py, tools/build_osm_tilemap.py 배치(전달본 그대로).
   py tools/fetch_region_osm.py sokcho_v2 실행 → 캐시 생성 확인.
2. py tools/build_osm_tilemap.py sokcho_v2 실행.
   terrain.png를 열어 OSM 화면과 대조: 청초호 윤곽·속초항 부두·동명항 방파제·조도 확인.
   sea ratio 경고가 뜨면 해안선 누수 지점을 PNG에서 육지색으로 막고 재실행.
3. build_region_maps.py의 classify()에 신규 3색(r/s/b) 추가, sokcho_v2를
   단일 seamless.json으로 출력하는 분기 추가. 실행 → JSON 생성 확인.
4. @tra/core: 타일 유니언 확장, RegionMeta/RegionPoi 타입, ACTIVE_REGION_MODE,
   walkable/fishableFrom 판정 함수. index.ts export. 빌드 통과 확인.
5. RegionFieldScene 청크 스트리밍(§6 1~3항). 이 단계가 가장 크다 —
   먼저 청크 로드/언로드만(충돌 없이) 눈으로 확인 후 충돌 바디 추가.
6. POI 로드·아이콘·문 위치 규칙·상호작용 트리거(§4). 상점/화장실/파출소/여객터미널
   각 1곳씩 실제 진입 테스트.
7. 낚시 판정 교체(§5) — 방파제 끝에서 캐스팅되는지, 모래사장 원투 되는지.
8. 검증 루틴: npx pnpm run build + typecheck 0오류, dev 서버에서
   청초호→동명항→조도 앞바다까지 도보 순회하며 FPS 확인(목표 60 유지).
9. .agents/AGENTS.md·IMPLEMENTATION_PLAN.md 갱신, 크레딧 화면에
   "지도 데이터 © OpenStreetMap contributors (ODbL)" 추가.
```

## 9. 검증 체크리스트

- [ ] terrain.png ↔ OSM 스크린샷 오버레이 정합(청초호·방파제 2본·조도 위치)
- [ ] flood 누수 없음(sea ratio 25~65% 및 육지 한복판 `~` 없음)
- [ ] 도보 도달성: 스폰 → 동명항 방파제 끝 / 영금정 / 청초호 남안 / 해변 전부 도달 가능(flood-fill 테스트)
- [ ] 조도는 도달 **불가**(배 없이) — 섬이 도보 연결되면 데이터 오류
- [ ] POI 전수: 파출소·화장실·여객터미널·등대·시장 위치가 실지도와 일치
- [ ] 성능: 상주 청크 ≤ 12, 이동 중 베이킹 스파이크 없음, 60 FPS

## 10. 확장 규약 (여수 등 타 지역)

`REGIONS`에 bbox 한 줄 추가 → fetch → build → classify → 동일 클라이언트 코드.
지역별로 달라지는 것은 bbox와 스폰 좌표뿐이어야 하며, 지역 특화 로직이 필요해지면
이 스펙에 조항을 추가한 뒤 구현한다. 스케일 변경(5m/타일)도 `TILE_M` 하나로 전 지역 일괄.

## 부록 — 남은 결정(사용자)

1. ~~타일 픽셀 크기~~ → **32px 확정**(심리스 TR 32 · 청크 32타일 — §0.5-1, 2026-09-02).
2. 조도를 배낚시 전 콘텐츠로 열어둘지(여객터미널 POI가 훅).
3. legacy 7맵을 언제 완전 제거할지(v2 안정화 후 권장).

---

## 11. 비주얼 레이어 — 데이터 뼈대와 픽셀아트 스킨의 분리 (증보)

**OSM 산출물(terrain/pois)은 화면에 그대로 내보내는 물건이 아니다.** 그것은 충돌·배치의
"진실"(뼈대)이고, 화면에 보이는 것은 그 위에 입히는 4개 레이어다. 같은 그리드를 두 방식으로
렌더한 `mock_flat.png`(뼈대 그대로 = 단색 사각형) vs `mock_styled.png`(목표 룩)를 비교할 것.
목업은 속초항여객선터미널 일대(수복탑사거리·수복탑공원·부두·난전·바다)를 실지도 배치 그대로 옮긴 것이다.

### L1. 오토타일 스킨 (청크 베이크에 포함)
타일 문자 → 8이웃 마스크로 타일셋 변형 선택(표준 47-blob, 축소하면 16마스크로 시작 가능).
반드시 만들어야 하는 전이쌍:

| 전이 | 표현 |
|---|---|
| `~`↔`b` | 계선벽 어두운 캡 + 포말 라인(흰 점 애니 2프레임) |
| `~`↔`s` | 파도 밀려오는 젖은 모래 띠 |
| `r`↔`w` | 연석 1px 하이라이트 |
| `,`↔`.` | 디더 경계(딱 떨어지는 직선 금지) |
| `r` 중앙 | 차선 점선, 교차부 정지선/횡단보도 |
| `b` 이음 | 콘크리트 신축이음 세로줄(3타일 간격) |

### L2. 건물 프리팹 (스프라이트 오브젝트)
`#` 풋프린트는 충돌 전용. 시각은 풋프린트 크기 × POI 타입으로 프리팹 선택:
`terminal`(대형·박공지붕) / `market` / `shop_s·m`(차양+간판) / `house_s·m·l`(지붕색 변주) /
`police` / `lighthouse`. 문 위치 = §4 door 규칙과 동일 타일. 지붕은 캐릭터보다 위 depth.

### L3. 프롭 자동 배치 + 수동 오버라이드
규칙 배치(결정론적 — 시드는 타일좌표 해시): 계선주=quay 바다측 가장자리 4타일 간격 ·
가로수=도로변 잔디 · 테트라포드=방파제 바다측 · 난전 스톨=`shop:seafood` POI 위치 ·
들꽃/자갈=해시 스프링클. 수동 배치는 `props.json`(타일좌표+프롭id)이 자동 규칙에 우선.

### L4. NPC 스폰
`pois.json` → 스폰 테이블: shop→상인, restaurant/cafe→주인, police→경관,
ferry_terminal→매표원, market→난전 상인 여럿. 이동 루틴은 기존 NPC 시스템 재사용.

### 렌더 순서와 청크
L1은 §6 청크 베이크에 굽는다. L2~L4는 베이크하지 않고 청크 로드시 생성하는 스프라이트
오브젝트(y-sort). 프리팹·프롭은 상주 청크 밖이면 파괴 — POI 아이콘과 동일 수명.

### 최소 에셋 세트 (Antigravity 발주 목록)
타일셋 7군(각 16마스크) + 전이 6쌍 / 프리팹 8종 / 프롭 6종(계선주·가로수·스톨·테트라포드·
기념탑·어선) / NPC 4종. 이 목업의 16px/타일 기준 팔레트를 시작점으로 쓰되 어종·시간대
틴트는 후속.

### §8 작업 순서에 추가
```
10. L1 오토타일: 16마스크 룰셋 + 전이 6쌍 타일셋 제작, 청크 베이커에 마스크 조회 추가.
11. L2~L3: 프리팹 8종·프롭 규칙 배치(계선주·가로수·스톨), props.json 오버라이드 로더.
12. L4: pois.json 스폰 테이블 → NPC 배치, 상호작용 연결(§4 door 규칙).
    각 단계마다 mock_styled.png와 나란히 스크린샷 비교로 룩 검수.
```

---

## 12. 지역 레지스트리 최종판 — 17개 (2026-08-27 확정)

사용자 제공 13개 bbox 중 초대형 6개(거제·여수·제주·인천·태안·포항)를 **물가 중심
서브지역으로 분할**하고, busan1↔busan3 겹침을 제거한 결과다. 원본 bbox는
`regions_config.py` 주석에 백업. 전 지역 ≤ 3.3M타일, **합계 28.2M(분할 전 214.7M, −87%)**
— 청크 파일 분할 로드 없이도 지역당 terrain ≤ 3.3MB라 §6 스트리밍만으로 충분해졌다.

| 지역 | 대상 | 크기(km) | 타일 | 도보횡단 | 시드 | 스폰(★검수) |
|---|---|---|---|---|---|---|
| sokcho_v2 | 청초호~동명항~조도 | 5.9×3.2 | 589×321 | 1.6분 | E | 동명항 방파제 입구 |
| ulleung | 울릉도 전역 | 23.8×13.0 | 2380×1295 | 6.3분 | 전방향 | 도동항 |
| dokdo | 독도 | 3.0×1.6 | 299×162 | 0.8분 | 전방향 | 동도 접안시설 |
| pohang_guryongpo | 구룡포·호미곶 | 9.0×16.7 | 900×1667 | 2.4분 | E | 구룡포항 |
| ulsan | 방어진 일대 | 24.4×13.3 | 2444×1330 | 6.5분 | S·E | 방어진항 |
| busan2 | 광안리~기장 | 24.5×13.3 | 2452×1334 | 6.5분 | S·E | 민락수변공원 |
| busan1 | 다대~감천~암남~영도 | 24.6×13.4 | 2455×1336 | 6.5분 | S | 다대포항 |
| busan3 | 가덕도 (동측 컷) | 16.9×13.4 | 1685×1337 | 4.5분 | S·E | 가덕도 천성항 |
| geoje_east | 장승포·지세포·구조라 | 9.1×16.7 | 914×1667 | 2.4분 | E | 지세포항 |
| geoje_south | 저구·다대·해금강 | 13.7×12.2 | 1373×1222 | 3.7분 | S | 저구항 |
| yeosu_city | 여수시내·돌산도·향일암 | 11.0×22.2 | 1099×2223 | 2.9분 | S·E | 여수 구항 |
| incheon_yeonan | 연안부두·월미도 | 7.1×7.8 | 707×778 | 1.9분 | W | 인천 연안부두 |
| taean_anheung | 신진도·안흥·마도 | 8.9×7.8 | 893×778 | 2.4분 | W | 신진도항 |
| taean_manripo | 만리포·모항 | 8.0×7.8 | 802×778 | 2.1분 | W | 만리포항 |
| jeju_city | 도두항~제주항 북안 | 18.6×11.1 | 1856×1111 | 4.9분 | N | 도두항 |
| jeju_moseulpo | 모슬포 (방어 지깅 성지) | 10.2×8.9 | 1024×889 | 2.7분 | S·W | 운진항 |
| jeju_seogwipo | 서귀포항·법환 | 10.2×7.8 | 1024×778 | 2.7분 | S | 서귀포항 |

### 12-1. 겹침·시 구분 처리 (확정)
- **busan3 동쪽 경계 128.91529로 컷** → busan1과의 다대포 중복 제거. 두 맵의 접선은
  가덕수로(바다)라 지도상 경계가 자연스럽다.
- **busan3에 부산광역시(admin_level=4) 경계 마스킹** → 서쪽 진해(창원시) 육지 자동 제거.
  **geoje 2개 지역에 거제시(admin_level=6) 마스킹** → 통영측 부속섬 제거. 시 구분 확실.
- 바다 겹침은 서브지역 분할로 소멸(거제 bbox가 부산·남해도까지 뻗던 문제 해소).
  여수 bbox에 있던 남해도는 **남해군이 별도 행정구역이므로 지역에서 제외** — 추후
  `namhae_*`로 따로 등록.

### 12-2. 리스폰 정책
- 현재: 지역당 1지점(위 표), ★전부 대략 좌표(±수백 m) — build가 최근접 이동가능 타일로
  스냅해 `meta.json.spawn` 기록, terrain.txt에서 최종 검수.
- 후속(사용자 결정 반영): **리스폰 다중화** — 낚시터별/대중교통 정류장 인접 지점을
  `meta.spawns[]` 배열로 확장, 랜덤 또는 선택 스폰. 스키마 자리만 예약해 두고 선구현은 1지점.

### 12-3. 파이프라인 v2 기능 (전부 합성 데이터 검증 PASS)
분할 수집(0.25° 격자·파츠 재개) · bytearray 그리드 · seaEdges 방향 시드 ·
행정경계 마스킹(admin_level 파라미터) · 스폰 스냅(BFS ≤1km) · 파츠 병합 중복 제거.

---

## 13. 핸드오프 — Claude Code / Antigravity 실행 자료

이 스펙과 함께 전달되는 파일 4종이 실행 자료의 전부다. 웹(프로젝트 문서)은 기록용이고,
실작업은 레포에서 한다.

### 13-1. 파일 배치
```
tools/regions_config.py      ← 신규 (지역 17개 레지스트리)
tools/fetch_region_osm.py    ← 신규 (Overpass 수집기)
tools/build_osm_tilemap.py   ← 신규 (래스터라이저)
문서: 본 스펙(OSM_TILEMAP_SPEC.md)을 .agents/ 밑에 두고 IMPLEMENTATION_PLAN에서 링크
참고: mock_flat.png / mock_styled.png (비주얼 목표 비교컷 — §11)
```

### 13-2. 실행 순서 (Antigravity 지시문 — §8·§11 상세의 요약판)
```
0. git 스냅샷 커밋 → 1. 스크립트 3종 배치 → 2. fetch sokcho_v2 → build sokcho_v2
   → terrain.png를 OSM과 육안 대조(청초호·방파제·조도) + sea ratio 정상 확인
3. classify() 신규 3색(r/s/b) + seamless.json 출력 분기
4. core 타입(§5: 문자 유니언·RegionMeta·RegionPoi·ACTIVE_REGION_MODE·walkable/fishableFrom)
5. RegionFieldScene 청크 스트리밍(§6) — 렌더 먼저, 충돌 나중
6. POI·문 규칙·상호작용(§4) → 7. 낚시 판정 교체(§5) → 8. 검증(§9 체크리스트)
9. 문서 갱신 + ODbL 크레딧 → 10~12. 비주얼 레이어(§11: 오토타일→프리팹·프롭→NPC)
속초 완주 후 나머지 16개 지역은 fetch→build→스폰 검수만 반복(코드 변경 없음).
```

### 13-3. 검증 명령
```
npx pnpm run build && npx pnpm --filter @tra/client-pc run typecheck   # 0 오류 유지
py tools/fetch_region_osm.py sokcho_v2 && py tools/build_osm_tilemap.py sokcho_v2
```

### 13-4. 사용자(사람)가 하는 일
terrain.png 통행성 손질(생성물은 초벌) · 스폰 최종 위치 검수 · §11 에셋 제작/발주
(타일셋 7군·프리팹 8종·프롭 6종·NPC 4종) · 대형 지역 이동수단(자전거 스펙 기존재) 결정.

### 13-5. 미결(후속 결정)
리스폰 다중화 스키마(12-2) · 태안 갯벌/조수차 표현 · 남해군 지역 등록 여부 ·
독도 콘텐츠 성격(도보 극소 — 배낚시 거점) · legacy 7맵 제거 시점.
~~타일 픽셀 크기 확인~~ → **32px 확정**(§0.5-1, 2026-09-02 실측 정정).
