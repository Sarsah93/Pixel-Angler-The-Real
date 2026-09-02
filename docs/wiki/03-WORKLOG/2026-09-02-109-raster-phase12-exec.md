# 109차 — 래스터 보강 Phase 1·2 실행 (Sentinel-2 fetch → 분류 → terrain 병합)

| | |
|---|---|
| **날짜** | 2026-09-02 |
| **시스템** | `필드` `인프라` `데이터` |
| **트리거** | 사용자 결정 — 발주를 Antigravity 대신 **Claude Code 직접 실행** (108차 개정 스펙 기준) |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

발주 의도(스펙 §0.5 노트 6): *"현재 타일셋으로 적용중인 terrains가 부드럽지 않고, 실제 지도 기반
픽셀이 아니어서 변화를 시도"* + 기존 수작업 보존·차용. 개정 §9 순서(step 0 skip → 1 fetch →
2 좌표 정합 → 3 피복 병합 → 4 b diff)를 그대로 실행했다. DEM(Phase 3)은 도엽 부재로 보류(§6).

## 2. 원인 — 스펙 §3-2 검출식의 실데이터 불일치 2건 (구현 중 확정)

- **"고립 육지" 판정 → 0건**: 방파제는 뿌리가 육지라 육지 본체 flood 에 흡수된다.
- **"bright_struct 성분 + 경계 바다 비율" → 0건**: 방파제가 도심 밝은 픽셀(26만 타일)과
  한 성분으로 이어져 경계가 육지로 판정된다.
- **확정 방식**: 103차 추론과 동일한 **"얇은 런"**(양끝 바다·길이 ≤ 10타일)을 **위성 물 마스크**
  위에 적용 — 같은 정의·다른 물 마스크라 개정안 §2의 diff 와 정확히 비교된다.
- **모래 임계 실측**: 기본값 B04 > 0.10 은 항만 안벽까지 모래로 발라버렸다(과검출 1만 타일).
  terrain 집단별 분포 실측 — 모래 B04 p25 **0.290**·온도차(B04−B02) p50 **0.149** vs
  콘크리트 0.105·0.015 → `B04 > 0.22 ∧ (B04−B02) > 0.06` 확정. 결과 2,686타일(실측 s 2,645와 정합).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [fetch_region_raster.py](../../../tools/fetch_region_raster.py) | Sentinel Hub Process API — UTM 원격자 10m 그대로 수신(warp 금지) + **사이드카 meta**(지오레퍼런스 — rasterio 회피, tifffile+pyproj 만 사용). `.env` 자격증명, 값 미출력 |
| 신설 | [classify_raster.py](../../../tools/classify_raster.py) | §1-1 역방향 샘플링(게임 타일 중심→UTM→픽셀) · NDWI/NDVI · seaEdges flood · Phase 2 피복 · Phase 1 얇은 런 b(NDVI ≥ 0.25 성분 = islet 제외) · `landcover.png/.txt`·`align_check.png`·`raster_meta.json` |
| 수정 | [build_osm_tilemap.py](../../../tools/build_osm_tilemap.py) `merge_raster` | §6 병합 패스 — OSM 기본값 `'.'` 만 채움(명시 태그 불가침) · `,`/`r` 은 직교 이웃 ≥ 2 스페클 가드 · 내수면 성분 ≥ 50만 `~`(걷기 구멍 방지) · **b = 개정안 §2 4케이스**(추론 단독 유지) · `raster_b_diff.json` · `--no-raster` 플래그 |
| 수정 | [regions_config.py](../../../tools/regions_config.py) | sokcho_v2 에 `raster` 딕셔너리(§4 — 장면·임계·도엽) |
| 수정 | [DataAttributions.ts](../../../packages/core/src/db-schema/DataAttributions.ts) · [MainMenuScene.ts](../../../packages/client-pc/src/scenes/MainMenuScene.ts) | © Copernicus Sentinel data (2026) 크레딧 + 메인화면 푸터 갱신 (107차 주석의 예약 이행) |
| 재생성 | `pixelazed/sokcho_v2/` · `public/data/sokcho_v2/` | terrain(병합) · landcover · align_check · raster_b_diff · raster_diff_view(좌우 비교) · terrain_osm_only(병합 전) · seamless.json |

의존성: `py -m pip install pyproj tifffile` (Python 3.14 — rasterio 는 wheel 리스크로 회피).

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S2/S7 필드 → OSM 심리스 → 빌드 타임 데이터 보강`. **데이터 층만** — core 계약·클라이언트 렌더
무변경(크레딧 문자열 제외). 래스터는 지형 문자만 바꾸고 patch.json·tileTex·타일셋 아트 불가침.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 좌표 정합 (§9-2 관문) | terrain '~' vs 래스터 물 전 타일 대조 + align_check.png 육안 | **일치율 98.84%** (60.31% vs 59.51%) · 계통 오프셋 없음(프린지 양측 1~2타일) |
| `--no-raster` 회귀 | 재빌드 ↔ 커밋 기준선 바이트 비교(개행 무시) | **동일** — 병합 끔 = 기존과 완전 동일 |
| 병합 결과 | 빌드 로그 | 식생 58,194 · 포장 46,276 · 모래 880 · 내수면 75 · b 497 적용 |
| b diff (개정안 §2) | raster_b_diff.json | 합의 833 / 래스터만 497(가드 통과 적용) / **추론만 1,750(유지 — 삭제 0)** |
| §7 체크리스트 | sea ratio 53.61%(불변) · 패치 321 적용 · 도달성 5지점(방파제 끝단·부두 안벽·청초호 남안·해변·등대해변) 전부 O · **b 3,080타일·103성분·바다 비접촉 0** | 전부 PASS |
| 실렌더 | verify-render 하네스 — 심리스 속초 4지점 스크린샷 | 도심 잔디 블롭 오토타일 정합 · 해변 골든 모래+포말 · **FPS 60** · pageerror 0 |
| 빌드 | `pnpm run build` + typecheck | 3/3 · 0 오류 |

재현: fetch → classify → `build_osm_tilemap sokcho_v2` → `build_region_maps sokcho_v2`.
diff 뷰 = `pixelazed/sokcho_v2/raster_diff_view.png` (좌 = OSM만 / 우 = 병합).

## 6. 잔여 — 이번에 안 한 것

- **사용자 육안 확정(검수 지점 2)** — landcover.png · raster_diff_view.png · 인게임 주간 체감.
  특히 **도심 포장 'r' 46k 타일**(아스팔트 광장·주차장 톤)의 체감 — 과하면 `merge_raster` 의
  이웃 가드 상향 또는 'r' 병합 제외 한 줄.
- **Phase 3 (DEM)** — 도엽 4장이 이 PC에 없다(.env 와 같은 "다른 PC" 케이스). 국토정보플랫폼
  재다운로드(38815014/15/24/25) 후 착수. slope.png·해안 변형·음영 베이크는 미구현.
- **b/s 발판 보너스 배선**(`isFishableStandTerrain` 소비) — 발주 범위 밖, 사용자 승인 후.
- 예비 장면(07-30·07-22) 검증 — 방파제 검출이 불안정할 때만(§2 — 현재 안정).
- 타 지역 확장 — 지역별 Browser 정찰로 장면 날짜 확정 후 `raster` 딕셔너리 추가만.

## 7. 위험·부작용

- **도심 외관 대변화** — '.'(tan) 46k 가 'r'(아스팔트)·58k 가 ','(잔디)로. 의도된 변화지만
  육안 확정 전까지 되돌림 경로 유지: `--no-raster` 재빌드 한 줄.
- 래스터 'r' 은 프롭 야생 산포 판정(`wild`)에 영향 — 도심 자동 산포가 줄어든다(바람직).
- 내수면 병합은 성분 ≥ 50 가드에도 **걷기 경로를 막을 수 있다** — 도달성 5지점은 통과했으나
  전수는 아님. 문제 발견 시 patch.json 으로 지우면 영구 우선.
- landcover.txt 재생성 없이 terrain 재빌드하면 병합이 옛 분류를 쓴다 — classify 먼저.

## 8. 후속 반영

- [x] `03-WORKLOG/README.md` §3.1 인덱스
- [x] 시스템 페이지 `02-SYSTEMS/world-field.md` §4·§5
- [x] `04-BACKLOG.md` R1
- [x] `AGENTS.md` §9 요약 + `IMPLEMENTATION_PLAN.md`
- [x] 스펙 `RASTER_UPLIFT_SPEC.md` §8·§9 진행 표기
