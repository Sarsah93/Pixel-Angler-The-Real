# 학습 노트 — 3 파일·문서

> 이 도메인에 대해 **지금 사실인 것**만 적는다(누적 금지 · 갱신). 추정은 "추정"이라고 쓴다.
> 400줄을 넘기지 않는다. 날짜별 경과는 `reports/`에 있다.

## 구조

- 범위 564개: `food assets/` 194(112 MB) · `pixelazed/` 217 · `scratchpad/` 83 · `assets/` 29 · `packages/map-builder/` 12 ·
  `docs/archive` 10 · `docs/reference` 11 · `docs/mockups` 8.
- `food assets/`를 읽는 도구는 4개뿐이다.
  - `pixelize_butchery.cjs`: `butchery/*.png` 루트 전부(파일명 = 키) + `reference/cephalopod/**` 명시 표 + `trimmings/octopus/`의 한 장.
  - `gen_sashimi_fillet.cjs`: `trimmings/{bream,amberjack}/pure_pillet_*` · `trimmings/halibut/skinned_pillet_without_engawa_halibut.png`.
  - `gen_octo_assets.cjs`: `reference/cephalopod/octopus/` PNG 4 + 픽셀 세트 + 손질 완료된 문어 1장.
  - `pixelize_forage_photos.py`: `forage/` 13개(옛 사진 2장은 보존만).
- `food assets/` 루트 어종 44개와 `trimmings/` 대부분은 도구가 읽지 않는 수동 복사 원본이다.
  소비본은 `public/fish` · `public/trimmings`에 ASCII 이름으로 복사돼 BootScene이 직접 로드한다.
- `reference/halibuts/` 11개 · `octopus/*.jpg` 12개 · mp4 1개는 사람이 보는 참고 자료다(도구 입력 아님).
- `pixelazed/`: 지역 폴더(`sokcho` · `busan` · `hometown` · `sokcho_v2`) = 타일맵 입력.
  루트 `<지역>_2_pixelazed.png` 12개 = 월드맵 확대도 원본(소비본 `public/pixelazed/`, 도구 미참조).
- `pixelazed/tileset/_survey/` 20개는 `extract_tileset_assets.py survey` 산출물이지만 좌표 표의 근거라 커밋 유지다.
- `pixelazed/sokcho_v2/{roads,patch,pois}.json`은 `public/data/sokcho_v2/`와 같은 내용이다(정본 + 런타임 이중 저장 — 의도).
- `scratchpad/`: 스크린샷 76장(5.3 MB) + 스크립트 7개(091~097차). core 하네스 2개는 `packages/core/dist`를 import한다.
- `packages/map-builder/`: README 없음 · TS 3개 + 파이썬 6개. 워크스페이스 제외. `tools/build_map.py`가 아직 이 파이썬을 import한다.
- `docs/archive/`: 원장 2 · specs 5 · patches 2 + README. 2026-09-30 이동 뒤 내용 추가 흔적 없음(186차 이후 유입 0).
  `docs/archive/README.md`가 `RASTER_UPLIFT_AMENDMENT.md` §4를 「아직 유효」로 인정하므로, 현행 문서가 그것을 가리키는 것은 위반이 아니다.

## 중복 · 대용량 (지표 `duplicates` 126묶음 · 67 MB)

| 구분 | 용량 | 판정 |
|---|---|---|
| `food assets/` → `public/` | 46.5 MB | 의도된 복사(BootScene 직접 로드) |
| `food assets/` 내부 — 도구가 읽지 않는 사본 | 15.3 MB | 정리 가능(제안만) |
| `food assets/` 내부 — 두 도구가 이름만 달리 읽는 입력 | 3.2 MB | 도구 매핑을 먼저 바꿔야 정리 가능 |
| `assets/` → `public/` (26묶음) | 1.7 MB | 의도된 복사 |
| `pixelazed/` → `public/` (14묶음) | 0.6 MB | 의도된 복사 |

- 대용량 중 도구 입력이 아닌 것: 무늬오징어 껍질벗기기 mp4 3.8 MB · `reference/halibuts/halibut_ref_3_open_cross.png` 1.8 MB ·
  `food assets/assorted_sashimi.png` 1.5 MB(소비본은 축소본). 외부 보관 후보(제안만).

## 규칙과 함정

- 지표 `duplicates`는 1 KB 미만 묶음을 뺀다(추정 — `public/tileset/coast` 10묶음이 빠져 126 대 136).
- 중복 판정은 「도구가 그 경로를 읽는가」로 한다. 같은 바이트가 `butchery/`(fillet)와 `trimmings/`(pillet)에 다른 이름으로 있고
  서로 다른 도구가 읽는다 — 한쪽만 지우면 생성기가 깨진다.
- `public/trimmings/skinned_pillet_with(out)_ribs.png`는 누끼 처리본이라 원본과 바이트가 다르다. 중복 묶음에 안 잡히는 것이 정상이다.
- 문서의 「scratchpad」는 대부분 세션 임시 폴더를 뜻한다. 저장소 `scratchpad/`와 같다고 가정하지 않는다.
- `docs/reference/gis/`는 shp/shx/dbf만 무시한다(한 단계 깊이). prj · cpg · 컬럼 매핑 xlsx는 추적한다.
- 한글 · 공백 2칸 파일명은 `pixelize_butchery.cjs` 표와 글자 단위로 묶여 있다. 폴더가 옮겨지면 경고만 내고 키가 사라진다.
- `.gitignore` 대조 결과: 추적 파일 중 무시 규칙에 걸리는 것은 `tools/__pycache__/*.pyc` 1개뿐이다(5 도메인 발견).
  `pixelazed/_rastercache/` 없음 · `_osmcache/` 1개 추적 — 규칙대로다. `scratchpad/` 정책은 없다.
- 확인하지 못한 것: `pixelazed/busan_2_pixelazed.png`(23,320 B)와 `public/pixelazed/busan_2_pixelazed.png`(20,402 B)가 다르다 —
  어느 쪽이 정본인지. `pnpm-lock.yaml`은 어느 도메인 범위에도 없다.
- 아직 바이너리 일괄 확인을 하지 않은 폴더: `pixelazed/{sokcho,busan,hometown,sokcho_v2}/` · `pixelazed/tileset/`의 Kenney 등 다른 팩 ·
  `assets/guide/`.

## 닫힌 수정안에서 배운 것

- (없음)
