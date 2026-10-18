# 262차 — 부산 심리스(감천 · 백운포) · 육지 8지역 OSM 확장 · Actions 수집 워크플로 · 구역별 내리는 자리 · 게임 상호 자동 변환

| | |
|---|---|
| **날짜** | 2026-10-18 |
| **시스템** | `지도` `필드` `도구` `인프라` `위키` `문서` |
| **트리거** | 사용자 지시 「이제 다른 맵 작업도 시작해야 할 것 같아. 부산 먼저 진행하고, 다른 맵들도 진행해줘.」 |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` — `8328095` · `2fbc59b` · `a971e74` · `c6f30a2` + 러너 커밋(`89f4d29` 부산 · 3차 데이터) + 마무리 커밋(아래 §8) |
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

(3차 수집 결과를 받은 뒤 채운다 — 지역별 표 · 하네스 · 도달성 · 빌드)

## 6. 잔여 — 이번에 안 한 것

(3차 수집 결과를 받은 뒤 채운다)

## 7. 위험·부작용

- 바다 판정 방식이 바뀌어 **속초를 다시 구우면** 바다 비율은 같지만(53.61%) 성분 경계 한두 칸이 달라질 수 있다 — 속초는 이번에 다시 굽지 않았다(래스터 병합 · 패치 보존).
- 자동 변환 상호는 규칙 산출물이라 어색한 이름(「여소식당」 · 「해금겅횟집」)이 있다 — `auto: true` 항목을 표에서 고치면 다음 병합부터 그 이름이 선다. 실제 상호가 평문으로 남지 않는 것은 그대로.
- 새 지역은 래스터 보강(Sentinel-2) 없이 OSM만이라 식생 · 모래가 속초보다 적다. `d` · `t` · `c` 어휘는 태그가 있는 곳(제주 농경지 1.0% · 만리포 2.8%)에서 자동으로 섰다.
- `REGION_AREA_NODES` 키가 늘어 `isRegionUnlocked`가 7지역을 더 연다 — 전국 지도 핀 · 메인 메뉴 티커(`getServicedRegionIds`) · 추천 컨텍스트(`regionOfSpot`)가 새 id를 본다.
  핀 좌표(`pixelX/Y`)는 256×256 줌 지도 위 대략값이다.
- 여수 구항은 OSM 건물 8,157채 · POI 1,393 · 걷기 성분 1,414로 속초의 15배 밀도다 — 청크 굽기 · 합성 발자국 비용은 실플레이에서 본다.
- 세이브 스키마 변화 없음. 구 세이브의 `currentSpotId`(busan_area_*)는 그대로 유효하다.

## 8. 후속 반영

- [x] 시스템 페이지 — [필드 · 지도](../02-SYSTEMS/world-field.md) §2 · §3 · §4 · §6 · 대시보드 S7
- [ ] [`04-BACKLOG.md`](../04-BACKLOG.md) CJ
- [ ] `AGENTS.md` §9 요약 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 새 함정 → 필드 §6 · 스킬 `add-region`(Actions 수집 · 요청 파일 · 구역 매핑 · spawnLatLon)
- [ ] 아티팩트 4개(절대 규칙 15)
