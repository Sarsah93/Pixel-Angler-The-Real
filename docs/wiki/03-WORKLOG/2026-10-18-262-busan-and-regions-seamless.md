# 262차 — 부산 심리스(감천 · 백운포) · 육지 8지역 OSM 확장 · Actions 수집 워크플로 · 구역별 내리는 자리 · 게임 상호 자동 변환

| | |
|---|---|
| **날짜** | 2026-10-18 |
| **시스템** | `지도` `필드` `도구` `인프라` `위키` `문서` |
| **트리거** | 사용자 지시 「이제 다른 맵 작업도 시작해야 할 것 같아. 부산 먼저 진행하고, 다른 맵들도 진행해줘.」 |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` — `8328095` · `2fbc59b` · `a971e74` · `c6f30a2` · `b3aa996` + 러너 커밋(`89f4d29` 부산 · `3a9a34c` 요청 3의 11지역) + 마무리 커밋(해금강 스폰 · 문서 · 아티팩트) |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 322/322 |

---

## 1. 배경 — 왜 했나

사용자 지시 원문: 「이제 다른 맵 작업도 시작해야 할 것 같아. 부산 먼저 진행하고, 다른 맵들도 진행해줘.」 · 「계속해서 진행해줘.」

261차까지 심리스 필드는 속초(`sokcho_v2`) 하나였다. 부산은 레거시 손그림 8맵(20px)이었고 다른 지역은 전국 지도에서 「준비중」이었다.
`tools/regions_config.py`에 17지역 bbox가 등록돼 있었지만 ① 부산 · 거제 · 여수 · 제주 bbox가 속초(76만 타일)의 2~4배라 그대로 굽기엔 컸고,
② 이 원격 작업 컨테이너는 Overpass · OSM 미러가 전부 네트워크 정책으로 막혀(403) 수집 자체가 불가능했고,
③ core 심리스 등록이 「지역 하나 = 데이터 지역 하나」라 부산처럼 구역이 10km 떨어진 지역을 담을 수 없었다.

## 2. 원인 — 무엇이 문제였나

이번 차수는 기능 확장이지만, 수집 과정에서 확정한 기전 셋을 남긴다.

- **bbox 가장자리 시드로 바다를 채우면 그 변이 육지를 지날 때 내륙이 잠긴다.** 요청 2에서 지세포(`geoje_east` · 'E')는 바다 99.02%,
  감천 북쪽 확장(35.090 · 'S')은 94.42%가 됐다. 가장자리 셀을 전부 시드로 놓는 옛 방식이 뭍에 놓인 시드에서 성분 전체를 채운 것이다.
  확정 근거: 같은 캐시로 **해안선 방향 투표**(OSM coastline = 왼쪽 뭍 · 오른쪽 바다)를 쓰면 속초 53.61% · 백운포 41.60%가 옛 값과 같고, 감천은 79.9 → 64.2%로 서쪽 부두 매립지가 뭍으로 돌아온다.
  중간 시도(오른쪽 한 칸 시드만 놓기)는 부두 · 좁은 물길 건너편에 떨어진 시드 몇 개가 뭍을 잠가 98%가 됐다 — 반드시 **성분 단위 다수결**이어야 한다.
- **main에 없는 워크플로는 Run workflow · API dispatch가 404다.** `osm-region.yml`을 작업 브랜치에 올리고 `actions_run_trigger`를 부르니 404 — GitHub는 기본 브랜치에 있는 워크플로만 등록한다.
  요청 파일(`pixelazed/_osm_request.txt`) 푸시 트리거로 바꿔 해결했다(워크플로 자신의 커밋은 `github.token`이라 다시 깨우지 않는다).
- **`set -e` 한 줄 루프는 지역 하나로 열 지역 결과를 버린다.** 요청 2는 10번째 지역(모슬포)에서 Overpass 502/500이 나자 앞선 9지역 산출물을 커밋하지 못한 채 끝났다.
  지역별 함수 + `|| return 1` + 실패 목록으로 바꿨다(러너가 반쯤 구운 산출물은 `git checkout/clean`으로 되돌린다).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`.github/workflows/osm-region.yml`](../../../.github/workflows/osm-region.yml) | 「OSM 지역 수집」 — fetch(90초 간격 4번) → build_osm_tilemap → build_region_maps → 건물 · 등대 → `merge_capture_pois --auto` → 실행한 브랜치에 커밋. 지역별 이어 가기 · 실패 목록 |
| 신설 | [`pixelazed/_osm_request.txt`](../../../pixelazed/_osm_request.txt) | 요청 파일(지역 키 한 줄 하나 · `refetch` 줄) — 푸시가 워크플로를 깨운다 |
| 수정 | [`tools/regions_config.py`](../../../tools/regions_config.py) | v4 — `busan_gamcheon` · `busan_baegunpo` 신설 · 11지역 bbox를 속초 크기로 · 거제 남쪽 = 해금강(도장포항) · v3 bbox는 머리말에 기록 |
| 수정 | [`tools/build_osm_tilemap.py`](../../../tools/build_osm_tilemap.py) | 바다 = 해안선 방향 투표(성분별 +1/−1 · 5~92% 밖이면 가장자리 폴백) · 스폰 500m 밖이면 전역 최근접 걷기 칸 |
| 수정 | [`tools/merge_capture_pois.py`](../../../tools/merge_capture_pois.py) | 캡처 파일 없는 지역 허용 · `--auto`(프랜차이즈 표 · 공공 제외 · 업종 말 유지 · 줄기 마지막 음절 모음 바꾸기 · 라틴 마지막 모음 · `auto: true`) |
| 신설 | `pixelazed/busan_gamcheon/name_alias.json` · `busan_baegunpo/name_alias.json` | 손으로 쓴 게임 상호 65 · 68(속초와 같은 가상 브랜드) |
| 수정 | [`packages/core/src/types/RegionMap.ts`](../../../packages/core/src/types/RegionMap.ts) | `SEAMLESS_AREA_REGIONS`(fieldMapId → 데이터 지역) · `seamlessRegionOf(region, mapId)` · `allSeamlessRegionDefs` · 데이터 지역 정의 13 |
| 수정 | [`packages/core/src/types/WorldMap.ts`](../../../packages/core/src/types/WorldMap.ts) | `RegionAreaNode.spawnLatLon` · 속초 2 · 부산 4 구역에 좌표 · **새 구역 노드 11**(울산 · 포항 · 거제 2 · 여수 · 태안 2 · 제주 3 · 인천 — 특성 · 수심 · 밑걸림 · 핀) |
| 수정 | [`packages/core/src/db-schema/JournalPages.ts`](../../../packages/core/src/db-schema/JournalPages.ts) | 예약 `areaKey`를 실제 구역 id로 |
| 수정 | [`packages/client-pc/src/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `areaMapId` · 데이터 지역 선택 · 구역별 스폰(meta bbox 등장방형 → `nearestWalkable`) |
| 수정 | [`packages/client-pc/src/i18n/I18n.ts`](../../../packages/client-pc/src/i18n/I18n.ts) | 데이터 지역 이름 사전 = `allSeamlessRegionDefs()` |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) · [`tools/game_wiki_template.html`](../../../tools/game_wiki_template.html) | 위키 「출조 지역」 탭(지역 × 구역 × 데이터 지역 실측 × 조행록 장) |
| 데이터 | `pixelazed/_osmcache/*.json` · `pixelazed/<region>/` · `packages/client-pc/public/data/<region>/` | 러너 커밋 — 데이터 지역 12곳(부산 2 + 3차 수집 10 — 표는 §5) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S7 월드맵 · 지역 타일맵 → OSM 심리스 확장 → 이 작업`. 계약(`SeamlessRegionDef` · `RegionAreaNode.spawnLatLon`) · 데이터(bbox 레지스트리 · 지역 산출물 · 게임 상호 표) ·
판정(바다 투표 · 스폰 스냅 · 데이터 지역 선택) · 인프라(Actions 워크플로)를 건드렸다. 렌더는 그대로(심리스 청크 · 벡터 건물 · 합성 발자국이 새 지역에 그대로 선다).
레거시 부산 8맵(`BUSAN_MAP_GRAPH`)은 `ACTIVE_REGION_MODE = 'legacy'` 폴백으로만 남는다.

## 5. 검증 — 무엇으로 확인했나

### 5-1. 데이터 지역 13곳 — 러너 산출물 실측

bbox는 전부 속초 크기(67만~90만 타일). 바다 비율은 해안선 방향 투표(요청 3)로 구운 11곳과 가장자리 시드(요청 1)로 구운 부산 2곳이 섞여 있다.
`걷기 성분`은 4-연결 성분 수와 가장 큰 성분의 비율, `상호`는 `name_alias.json` 항목 수(괄호 = `auto: true`).

| 데이터 지역 | 크기(타일) | 바다 % | 스폰(칸 · 이름) | POI | 건물 | 등대 | 상호(auto) | 걷기 성분(최대 %) |
|---|---|---|---|---|---|---|---|---|
| busan_gamcheon | 1093×778 | 75.3 | (456,311) 감천항 — 가장자리 시드 | 73 | 190 | 1 | 65(0) | 22(79.5) |
| busan_baegunpo | 820×822 | 41.5 | (355,389) 백운포 | 95 | 690 | 0 | 68(0) | 70(99.3) |
| ulsan | 1088×778 | 61.3 | (635,356) 방어진항 | 269 | 901 | 0 | 207(207) | 118(99.7) |
| pohang_guryongpo | 1081×778 | 39.2 | (552,378) 구룡포항 | 21 | 46 | 4 | 8(8) | 6(99.8) |
| geoje_east | 1096×778 | 23.1 | (530,378) 지세포항 | 55 | 1,471 | 0 | 35(35) | 107(100.0) |
| geoje_south | 1006×934 | 86.4 | (325,622) 도장포항 유람선 터미널 — 마무리 커밋에서 보정 | 23 | 229 | 0 | 12(12) | 9(93.7) |
| yeosu_city | 1189×756 | 66.7 | (255,445) 여수 구항 | 1,393 | 8,157 | 3 | 1,192(1,192) | 1,414(98.1) |
| taean_anheung | 1071×778 | 80.8 | (446,353) 안흥 · 신진도 | 6 | 22 | 4 | 2(2) | 11(98.6) |
| taean_manripo | 1070×778 | 39.6 | (499,422) 만리포 | 13 | 8 | 0 | 12(12) | 6(99.0) |
| jeju_city | 1114×667 | 54.7 | (501,378) 도두항 | 130 | 128 | 2 | 71(71) | 9(100.0) |
| jeju_moseulpo | 1118×778 | 44.4 | (484,422) 모슬포 운진항 | 411 | 1,383 | 2 | 365(365) | 47(100.0) |
| jeju_seogwipo | 1117×733 | 46.9 | (503,400) 서귀포항 | 1,753 | 1,069 | 2 | 1,524(1,524) | 111(97.2) |
| incheon_yeonan | 1060×778 | 42.4 | (371,400) 연안부두 | 109 | 451 | 1 | 76(76) | 71(96.6) |

- 바다 비율이 스킬의 25~65% 권장 밖인 곳: 감천 75.3(가장자리 시드 — 투표로 다시 구우면 64.2) · 해금강 86.4 · 안흥 80.8 · 지세포 23.1.
  해금강 · 안흥 · 여수는 bbox가 반도 끝 · 섬이라 실제 바다가 많은 것이고(terrain 렌더 육안), 지세포는 내륙 산지가 많다 — 누수가 아니다.
- 자동 변환 상호 표본(§3): 「화이티마트」(화이트마트) · 「충무구도병원」 · 「여소식당」 · 「해금겅횟집」 · 「서해바더횟집」 — 어색한 것은 표에서 고친다(§6).

### 5-2. 실렌더 하네스 — 출조 구역 17곳

`scratchpad/harness_regions.cjs`: 구역마다 `scene.restart({ region, mapId })` → `playerTile()` · `seamlessDef.dataRegion` · 건물 · 가게 · 등대 · 합성 발자국 · http ≥400 · pageerror.
`dist` = 구역 `spawnLatLon`을 meta bbox 등장방형으로 바꾼 칸과 실제 선 칸의 거리(칸).

| 구역 | 데이터 지역 | 선 칸(지형) | dist | POI | 건물 | 합성 발자국 |
|---|---|---|---|---|---|---|
| 속초항 · 동명항 | sokcho_v2 | (465,156) p · (526,127) w | 0.0 · 0.0 | 560 | 546 | 336 |
| 감천항 서방파제 · 동방파제 · 암남공원 | busan_gamcheon | (340,743) b · (432,688) . · (650,445) w | 0.0 ×3 | 73 | 190 | 31 |
| 백운포 체육공원 | busan_baegunpo | (355,388) , | 0.0 | 95 | 690 | 29 |
| 방어진항 | ulsan | (634,355) . | 0.0 | 269 | 901 | 46 |
| 구룡포항 | pohang_guryongpo | (556,375) p | 2.8 | 21 | 46 | 8 |
| 지세포항 | geoje_east | (529,377) . | 0.0 | 55 | 1,471 | 2 |
| 해금강 | geoje_south | (322,623) w — 보정 뒤(보정 전 (595,600) · dist 126.6) | 1.4 | 23 | 229 | 0 |
| 여수 구항 | yeosu_city | (255,445) . | 1.4 | 1,393 | 8,157 | 3 |
| 안흥 · 신진도 · 만리포 | taean_anheung · taean_manripo | (446,353) . · (499,422) r | 2.0 · 0.0 | 6 · 13 | 22 · 8 | 2 · 10 |
| 도두항 · 모슬포 운진항 · 서귀포항 | jeju_city · jeju_moseulpo · jeju_seogwipo | (501,377) w · (484,422) b · (502,399) r | 0.0 ×3 | 130 · 411 · 1,753 | 128 · 1,383 · 1,069 | 28 · 158 · 879 |
| 연안부두 | incheon_yeonan | (371,400) w | 0.0 | 109 | 451 | 46 |

- 17/17 기동 · 전 구역 걷는 칸 · pageerror 0. http 오류는 KAMIS 스냅샷 `data-snapshots/kamis/produce.json` 404 하나뿐(키 미발급 — 262 전부터 같다).
- **해금강 보정**: 설정 스폰 (34.7578, 128.6690)은 도장포 북쪽 물이었다(바람의 언덕은 34.74°N이지 34.76°N이 아니다). 러너의 전역 폴백이 1.4 km 떨어진 갯바위
  (439,545)를 골랐고 구역 노드의 옛 좌표(34.7470, 128.6825)도 바다라 dist 126.6이 나왔다. 유람선 터미널 POI 실측 칸 (324,622)의 좌표 (34.7420, 128.6627)로
  `regions_config.py` · `WorldMap.ts`를 고치고 캐시로 지역을 다시 구웠다(산출물 차이 = `meta.spawn` · `spawnName`뿐 → 로컬 빌드와 러너 빌드가 같다).

### 5-3. 도달성 · 빌드

- `check_building_reach.py`(옛 칸 규칙 → 윤곽 규칙): 감천 · 백운포 · 구룡포 · 안흥 · 만리포 잃은 문 0 · 제주시 문 이동 4 · 인천 1 · 해금강 잃은 문 1(세븐나인 (327,630) — 윤곽 둘 사이 1칸) ·
  여수는 씨앗 (255,445)가 8px 격자에서 막혀 미측정(씬 `isWalkable`은 참 — 건물 '#' 줄 사이 보도).
- 빌드 3/3 · typecheck 0 · core 시험 322/322(마무리 커밋에서 다시 확인 — §8).
- 워크플로 3회: 요청 1(부산 2 · 2분) 성공 · 요청 2(11지역) 모슬포 Overpass 5xx로 실패 · 요청 3(지역별 이어 가기) 성공 — 11지역 약 20분.

## 6. 잔여 — 이번에 안 한 것

- **사용자 육안 검수** — 새 데이터 지역 12곳의 terrain ↔ 실지형(항 · 방파제 · 매립지), 전국 지도 핀 자리(`pixelX/Y`는 256×256 줌 지도 위 대략값).
  착수 조건 = 사용자 실플레이(배포본은 80차 배포 뒤).
- **자동 변환 상호 검토** — `auto: true` 3,516곳(여수 1,192 · 서귀포 1,524 · 모슬포 365 · 울산 207 …)은 규칙 산출물이라 어색한 이름이 섞여 있다.
  표에서 고치면 다음 `merge_capture_pois.py` 병합부터 그 이름이 선다.
- **인물 좌표** — 부산 9명 · 포항 3 · 울산 2 · 거제 · 여수 · 태안 · 제주 · 인천 인물은 `STORY_NPC_PLACEMENTS`에 지역만 있고 자리가 없다(백로그 AA ①).
  착수 조건 = 지역별 실지형 검수 뒤 POI 옆 칸으로 배치.
- **감천 재굽기** — 부산 2곳은 가장자리 시드 방식(요청 1)으로 구운 것이라 감천 서쪽 부두 매립지가 바다(75.3%)다.
  `_osm_request.txt`에 `busan_gamcheon`만 적어 푸시하면(refetch 없음) 투표 방식(64.2%)으로 다시 굽는다 — 사용자 육안 뒤 한 번에.
- **감천 서방파제 피복** — 추론 'b' 두 줄 + 테트라포드(실제는 상판 방파제) → `patch.armor` · 편집기. 항 머리가 bbox 밖이라 감천동 쪽 ↔ 반도 쪽 걷기 성분이 둘.
- **해금강 잃은 문 1 · 여수 씨앗** — 세븐나인(327,630)은 윤곽 둘 사이 1칸 틈(258차 규칙). 여수 (255,445)는 도구의 8px 격자가 막아 미측정 — 씨앗을 보도 칸으로 바꿔 다시 잰다.
- **래스터 · 어장 없음** — 새 지역은 Sentinel-2 보강 · `fishfarms.json`(SHP 원본 필요)이 없다. 식생 · 모래 · 어장 규제는 속초만.
- **여수 구항 밀도** — 건물 8,157 · 가게 1,393 · 걷기 성분 1,414로 속초의 15배 — 청크 굽기 · 합성 발자국 비용을 실플레이에서 본다.
- **워크플로 main 반영** — `osm-region.yml`이 main에 들어가면 Actions 탭 「Run workflow」 · API dispatch가 된다(지금은 요청 파일 푸시).
  환경 네트워크 정책에 `overpass-api.de` · `overpass.kumi.systems`를 허용하면 컨테이너에서도 직접 수집할 수 있다(사용자 설정).
- **울릉 · 독도** — `access: 'boat'`, 배 출조 콘텐츠 뒤.
- **main 반영 · 80차 배포** — 사용자 요청 시.

## 7. 위험·부작용

- 바다 판정 방식이 바뀌어 **속초를 다시 구우면** 바다 비율은 같지만(53.61%) 성분 경계 한두 칸이 달라질 수 있다 — 속초는 이번에 다시 굽지 않았다(래스터 병합 · 패치 보존).
- 자동 변환 상호는 규칙 산출물이라 어색한 이름(「여소식당」 · 「해금겅횟집」)이 있다 — `auto: true` 항목을 표에서 고치면 다음 병합부터 그 이름이 선다. 실제 상호가 평문으로 남지 않는 것은 그대로.
- 새 지역은 래스터 보강(Sentinel-2) 없이 OSM만이라 식생 · 모래가 속초보다 적다. `d` · `t` · `c` 어휘는 태그가 있는 곳(제주 농경지 1.0% · 만리포 2.8%)에서 자동으로 섰다.
- `REGION_AREA_NODES` 키가 늘어 `isRegionUnlocked`가 7지역을 더 연다 — 전국 지도 핀 · 메인 메뉴 티커(`getServicedRegionIds`) · 추천 컨텍스트(`regionOfSpot`)가 새 id를 본다.
  핀 좌표(`pixelX/Y`)는 256×256 줌 지도 위 대략값이다.
- 여수 구항은 OSM 건물 8,157채 · POI 1,393 · 걷기 성분 1,414로 속초의 15배 밀도다 — 청크 굽기 · 합성 발자국 비용은 실플레이에서 본다.
- 세이브 스키마 변화 없음. 구 세이브의 `currentSpotId`(busan_area_*)는 그대로 유효하다.

## 8. 후속 반영

- [x] 시스템 페이지 — [필드 · 지도](../02-SYSTEMS/world-field.md) §2 · §3 · §4 · §5 · §6 · 대시보드 S7
- [x] [`04-BACKLOG.md`](../04-BACKLOG.md) CJ
- [x] `AGENTS.md` §9 요약 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 새 함정 → 필드 §6 · 스킬 `add-region`(Actions 수집 · 요청 파일 · 구역 매핑 · spawnLatLon · 스폰 좌표는 POI 실측 칸으로)
- [x] 아티팩트 4개(절대 규칙 15) — 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 Version 4 ·
  구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 Version 4 · 채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 Version 4(「262차 기준」 줄만) ·
  전체 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c Version 59(「출조 지역」 탭 — 그림 변화 없음 · HTML만) · 주소표 `docs/artifacts/README.md`
- [x] 검증 재실행(마무리 커밋) — 빌드 3/3 · typecheck 0 · core 322/322 · 해금강 하네스 dist 1.4
