# 101차 — dev 맵 편집기(F7)·순간이동 + 차도 벡터 마킹(노란 중앙선·대각선) + 프롭 10종

| | |
|---|---|
| **날짜** | 2026-08-28 |
| **시스템** | `필드·타일맵(S2·S7)` `dev 도구(S13)` |
| **트리거** | 사용자 피드백 3건 (100차 후속 스크린샷 리뷰) |
| **커밋** | 미커밋 (커밋 대기) |
| **빌드·타입체크** | 4/4 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 원문 요지:

1. "지도 자체를 dev 모드에서 즉각 수정할 수 있도록 타일 편집기 및 마인크래프트의 크리에이티브
   모드처럼 … 아이템을 마스터모드에서 바로 최대 수량 … 단축키+클릭 조합으로 순간이동" —
   "맵 전체에서 부분적으로 수정하기 힘들기 때문에, 수동검증을 통해 찾으려는 것".
2. "중앙선은 노란색 실선이고, 차선 변경이 가능한 선은 점선 흰색 … 도로가 대각선으로 표현될 때,
   타일이 대각선 형이 없어" (100차 타일 휴리스틱 점선은 가로/세로만).
3. "건물, 나무, 지형 등 좀 더 디테일한 다각적 요소들을 반영한 타일을 추가 … 편집 모드로 볼 수 있게".

## 2. 원인 — 대각선이 없던 이유

100차 마킹은 **타일 단위 휴리스틱**(`roadAxis` — 이웃 스팬으로 남북/동서 판정)이라 격자 축
2방향밖에 표현할 수 없었다. 도로는 OSM 벡터에서 래스터라이즈되므로 **벡터 자체가 정답**을 갖고
있다 → 래스터라이저가 차도 중심선 폴리라인을 `roads.json`으로 함께 내보내고, 클라이언트가
벡터를 임의 각도 선분으로 그린다(타일은 계단식이어도 마킹은 매끈).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `tools/build_osm_tilemap.py` | 차도 way → `roads.json`(cls·폭 타일·타일좌표 폴리라인) 동반 출력 |
| 수정 | `tools/build_region_maps.py` | `patch.json` 타일 오버라이드를 seamless.json에 굽기 · `roads.json`/`patch.json`을 `public/data/<region>/`에 **항상** 복사(빈 패치라도 — SPA 폴백 pageerror 방지) |
| 수정 | [vite.config.ts](../../packages/client-pc/vite.config.ts) | **dev 미들웨어** `POST /__dev/region-patch?region=` → `pixelazed/<region>/patch.json`(정본) + `public/data/<region>/patch.json`(런타임) 저장 |
| 수정 | [RegionMap.ts](../../packages/core/src/types/RegionMap.ts) | `RegionRoad` · `RegionProp` · `RegionPatch` 타입 (index export) |
| 수정 | [SeamlessChunks.ts](../../packages/client-pc/src/scenes/SeamlessChunks.ts) | **벡터 마킹**(`drawRoadMarkings` — 노란 중앙 실선 ≥2타일 · 흰 점선 차선 방향당 2차로↑ ±3.5m · 가장자리 실선 ≥3타일 · 교차부 인셋) · 청크별 도로 인덱스 · **프롭 10종 절차 텍스처**(`PROP_DEFS`: 활엽수 2·침엽수·덤불·바위·벤치·가로등·화단·기념탑·어선) · `setProps`/`setRoofOverrides`/`buildingKeyAt` · **`invalidateTiles`**(수심 BFS·건물 라벨 재계산 + 영향 청크 충돌/프롭 재구성 + 재베이킹 큐 선두) · `rebakeResident`. 구 `roadAxis` 폐기 |
| 신설 | [dev/MapEditorPanel.ts](../../packages/client-pc/src/dev/MapEditorPanel.ts) | DOM 팔레트(F7) — 모드(지형/프롭 배치/프롭 제거/지붕 색) · 타일 8종 견본 · 브러시 1/3/5 · 프롭 10종 · 저장/되돌리기 |
| 수정 | [RegionFieldScene.ts](../../packages/client-pc/src/scenes/RegionFieldScene.ts) | roads/patch 로드 + 패치 타일 런타임 적용 · **F7 편집기**(드래그 페인트 → pointerup 스트로크 확정 → `invalidateTiles` · 프롭/지붕 즉시 `rebakeResident` · Ctrl+Z 스트로크 되돌리기 · 패치 = 원본 대비 diff로 재구성) · **Ctrl+좌클릭 순간이동**(맵/미니맵 — `devTeleport`: 청크 즉시 상주) · 저장 POST |
| 수정 | [RegionHud.ts](../../packages/client-pc/src/ui/RegionHud.ts) | 미니맵 이미지 인터랙티브 → `minimap-click(nx, ny, ctrl)` 이벤트 |
| 수정 | [DevConsolePanel.ts](../../packages/client-pc/src/dev/DevConsolePanel.ts) | 아이템 지급 행에 **`+최대`(99)** 버튼 — 크리에이티브식 즉시 만재 |
| 산출 | `pixelazed/sokcho_v2/roads.json` · `public/data/sokcho_v2/{roads,patch}.json` | 차도 벡터 821개 · 빈 패치 |

## 4. 구조상 위치

`S2·S7 필드 → 심리스 렌더/데이터` — 데이터(roads/patch 계약 신설) · 렌더(벡터 마킹·프롭) ·
dev 도구(편집기 — 프로덕션 데드코드, `import.meta.env.DEV` 가드). 게임플레이 판정 무변경.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 벡터 마킹 | 실렌더 스크린샷(스폰 도심·대각선 tertiary) | 노란 중앙 실선 + 흰 점선 차선 + 가장자리선, **대각선(52°) 도로에서 매끈** |
| 편집기 페인트 | F7 → '~' 3×3 클릭 | 9타일 전환 · `blocked` true · 청크 재베이킹(잔여 0) · 패치 tiles 9 |
| 되돌리기 | Ctrl+Z | 원문자 복원 · 패치 tiles 0 |
| 프롭 배치·저장 | 침엽수 클릭 → 저장 POST | 스프라이트 렌더 · `pixelazed/…/patch.json` + `public/data/…/patch.json` 디스크 기록 확인 |
| 순간이동 | Ctrl+클릭(맵) / Ctrl+클릭(미니맵) | 좌표 이동 + 청크 9 상주 · 충돌 즉시 |
| 회귀 | 빌드·typecheck | 4/4 · 0 오류 · pageerror 0 |

재현: scratchpad `verify_editor.cjs` (마지막에 빈 패치로 정리). 스크린샷 `ed_1~4*.png`.

## 6. 잔여

- 교차부 마킹은 세그먼트 인셋으로만 완화 — 실제 교차로 박스(정지선·횡단보도)는 후속.
- 편집기 지형 변경은 미니맵 텍스처(1회 베이크)에 미반영 — F5 후 반영.
- 프롭은 충돌 없음(장식). 충돌 프롭·프리팹 건물(§11 L2)은 에셋 도착 시.
- L4 NPC 스폰 미착수.

## 7. 위험·부작용

- `patch.json`은 **재빌드 시 build_region_maps가 굽는다** — terrain.png를 손수정해도 패치가 우선 덮는다.
- `invalidateTiles`는 전맵 BFS·라벨을 재계산(76만 타일 ≈ 수십 ms) — dev 전용이라 허용.
- vite 미들웨어는 dev 서버에만 존재 — 프로덕션에서 편집기 저장 호출 경로 자체가 없다(F7도 DEV 가드).

## 8. 후속 반영

- [x] `02-SYSTEMS/world-field.md` §2·§4·§6 갱신
- [x] `04-BACKLOG.md`
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 스펙 §0.5 10항 · 스킬 `add-region`

---

## 후속 (같은 날) — 차선 연속성·차도 폭 + 오픈소스/생성 타일셋 통합 (사용자 피드백 3건)

**사용자 리포트 원문 요지**: ① "차선의 연결성이 보장되지 않고 … 타일 위에 그냥 선이 그어진 느낌"
② "왕복 2차선이면 선들은 보도와 겹치면 안 되고 차도 타일 안에 … 도로 타일이 더 넓어야"
③ `pixelazed/tileset/` 4종(Kenney·TopDownCityPack·RPG 아이콘·Gemini 생성본) — "현재 타일셋을 폐지하지
말고 업그레이드에 활용 … 점으로 표시되는 건물을 교체 … 편집기 프롭 품질 통일". 추가 지시:
"이미 나눠진 오픈소스는 별도 그리드 분할 말고 목업을 참고해 시트에서 잘라 적용".

**원인(①)**: 100차 마킹이 세그먼트마다 양끝을 `halfW·0.9` 인셋해 **폴리라인 정점마다 끊겼다**.

**변경**:

- **차선**: `offsetPolyline`(정점 평균 법선 미터 조인, 예각 2배 클램프)로 **연속 오프셋 선** ·
  점선 위상을 세그먼트 간 이월 · 인셋은 **폴리라인 양 끝점만**(교차부) ·
  차로 기하 = `(halfW − 0.35타일) / lanes`로 균등 배치 → 마킹이 **차도 타일 안**에 들어온다.
- **차도 폭**: 클래스별 `ROAD_W_M` 재산정(primary 30m=6타일·secondary 22·tertiary 20·residential 14) +
  `ROAD_LANES`(방향당 차로 수)를 `roads.json`에 동반(`RegionRoad.lanes`) · 재래스터라이즈(r 5.4→8.4%).
- **타일셋 추출기** `tools/extract_tileset_assets.py`(Pillow): Gemini 19장 알파 트림 ·
  TopDown = 알파 연결요소 검출 → 인덱스 컨택트시트 → 선택 22종 · Kenney = **마젠타 키잉 + 17px 마진
  제거 정규화** → 연결요소 → 차량 12·노점 2(bbox 직접)·나무 6·가로등 2·휴지통.
  ⚠ Kenney `_transparent` 판도 마젠타 배경 + 마진선이다(그대로 자르면 스프라이트 한가운데 빈 줄).
  산출 → `public/tileset/{gem,td,kn}/` + [TilesetManifest.ts](../../packages/client-pc/src/data/TilesetManifest.ts)
  (심리스 preload 일괄 로드).
- **프롭 팔레트 전환**(`PROP_DEFS` — 카테고리 자연/시설물/건물/차량/NPC/해안, 편집기 그룹 렌더):
  절차 도트 → 타일셋(나무·야자·측백·벤치·가로등·신호등·표지판·주택·고층·팝업·횟집·노점·차량·NPC·
  테트라·부두 경계). 바위·화단·기념탑·어선만 절차 잔존(대응 에셋 없음). Kenney는 **2배 정수 확대**,
  NPC는 **0.5**(2:1 다운샘플), 나머지 원본 1배.
- **POI 건물 프리팹**(`poiVisualTex` — 의미 일치만): 횟집 = 음식점/수산 상점 중 이름 횟집·회센터·활어·
  물회·해물·수산 계열 → Gemini 횟집 2종(11곳) · 팝업 = 시장·기념품·잡화·수산물 판매·난전/노점/시장
  이름 → 팝업 4종(10곳) · 호텔/은행 → 고층 5종 · 민박 → TopDown 주택 2종(9곳). 프리팹은
  **건물 풋프린트 하단 중앙** 앵커(y-sort) · 마커 점은 숨김 · 편의점/카페 등 비일치는 그대로 점.
- **고층 자동 프리팹**: ≥60타일 건물 컴포넌트(POI 예약 제외)에 Gemini 빌딩 해시 배정(청크 소유 규칙).
- **차량**: 차도 벡터(폭 ≥ 3)를 따라 9타일 간격 결정적 산포 · 우측통행 차로 오프셋 · 세그먼트 각도 회전.
- **NPC(L4 최소)**: POI 타입별 정적 배치 — 경찰관(파출소)·생선 장수(시장/수산)·관광객(전망/카페/숙소)·
  할아버지·아빠와 아이(식당/터미널) — 73곳. 상호작용 없음(후속 훅).
- 크레딧: DataAttributions에 Kenney(CC0)·FisherG(Custom) 추가.

**검증**: 실렌더 5지점(스폰·횟집 거리·벼룩시장·이마트 고층·6차로 primary) — 노란 중앙선 곡선/대각선
연속 · 흰 점선·가장자리선 차도 내부 · 프리팹/차량/NPC 정합 · 60FPS · pageerror 0 · 빌드 4/4 · typecheck 0.

**잔여**: RPG 아이콘 팩은 NPC 상호작용 도입 시 · 차량 교차부 정렬 · 바위 에셋 없음.

---

## 후속 2 — 심리스 TR 32 전환 + Kenney 지면 타일 베이스 (사용자 결정 "TR 32로 진행")

**결정 근거**(비교 후 사용자 확정): Kenney 16px ×2 = 정수 배율(픽셀 보존) · 지면 풀세트(아스팔트·보도·
잔디·흙·포장) · CC0(Steam 안전). TopDown 12px@24는 지면 커버리지·라이선스에서 열세.

**변경**:

- `RegionFieldScene`: `TR`을 `let`으로 — **심리스 32 / legacy 20**(init에서 모드별 확정, legacy 무영향) ·
  청크 64→**32타일**(1024px RT — VRAM 12×4MB) · 이동 속도 심리스 210px/s(타일 체감 보정).
- `SeamlessChunks.ensureGroundTextures`: `ts_kn_ground_*`(16px)를 CanvasTexture로 **×(tr/16) 정수 재베이크**
  (imageSmoothing off) → `bakeChunk`가 RT에 `batchDraw`로 베이스를 깔고 절차 레이어(포말·젖은 모래·연석·
  계선벽 캡·계선주·지붕·그림자·벡터 마킹)를 위에 얹는다. tr가 16의 배수가 아니면 절차 렌더 폴백.
  지형 매핑: `.`=베이지 포장(항구 도시 광장 톤) · `,`=잔디 · `r`=아스팔트 · `w`=회색 벽돌 보도 ·
  `s`=크림 모래 · `b`=청회색 포장. 바다·건물은 절차 유지(수심 그라데이션·지붕 컴포넌트).
- 추출기 `ground`/`zoom` 모드: **자동 색 통계 선별은 환기구·균열 셀을 잡아 반복 무늬가 생겼다**(실측)
  → `_survey/kenney_ground_zoom.png`(4배 셀 라벨)로 수동 확정한 `GROUND_CELLS` 명시 표.
  (잔디 (0,25)는 흙 테두리 코너 변형 — 무지 셀 (1,26)/(2,26)/(1,27)로 교체.)

**검증**: 실렌더 5지점(TR 32) — 지면 반복 무늬 0 · 차선/차량/프리팹 정합 · 9청크 상주 · **60FPS** ·
pageerror 0 · 빌드 4/4 · typecheck 0. 하네스는 `T = worldW/cols`로 타일 px를 씬에서 읽는다(20 하드코딩 금지).

**잔여**: 지면 오토타일 전이(잔디↔포장 경계 셀 — Kenney 행 25~27에 코너/엣지 변형 있음) · 물 타일셋
(수심 그라데이션과 충돌 — 보류) · 건물 지붕 Kenney 타일링 · 편집기 지형 미니맵 즉시 갱신.
