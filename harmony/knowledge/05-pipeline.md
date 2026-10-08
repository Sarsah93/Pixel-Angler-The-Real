# 학습 노트 — 5 파이프라인

> 이 도메인에 대해 **지금 사실인 것**만 적는다(누적 금지 · 갱신). 추정은 "추정"이라고 쓴다.
> 400줄을 넘기지 않는다. 날짜별 경과는 `reports/`에 있다.

## 구조 — 배선도

| 묶음 | 도구(`tools/`) | 입력 | 출력 |
|---|---|---|---|
| 지도 · OSM | `regions_config.py`(17지역) → `fetch_region_osm.py` | Overpass(온라인) | `pixelazed/_osmcache/<r>.part_*.json`(커밋 유지 · 지금은 `sokcho_v2`만) |
| | `build_osm_tilemap.py` | osmcache + `landcover.txt` | `pixelazed/<r>/terrain.png·txt` · `pois` · `meta` · `roads` |
| | `build_region_maps.py`(무의존) | `meta.json` 있으면 심리스(`terrain.png` + `patch.json`) / 없으면 레거시 PNG | `public/data/<r>/…json` |
| 지도 · 래스터 | `fetch_region_raster.py` → `classify_raster.py` | CDSE(루트 `.env`) → `_rastercache`(무시) | `landcover.png·txt` · `raster_meta` |
| 지도 · 후처리 | `backfill_poi_nameen.py` · `backfill_hospital_poi.py` → `merge_capture_pois.py`(반드시 마지막) | osmcache · `capture_pois.json` | `pois.json` 정본 + 런타임 |
| | `extract_lights.py` · `extract_fishfarms.py` · `build_depth_profiles.py` | osmcache · 어장 SHP(무시) · `09.수심.zip` | `lights.json` · `fishfarms.json` · `data/depth/*.json` |
| 지도 · 수동 저작 | `author_yeonggeumjeong.py` · `author_sokcho_coast.py` · `pixelize_islet.py` | `public/…/seamless.json` + 사진 | `patch.json` 양쪽 · 섬 시트 |
| 타일셋 | `extract_tileset_assets.py` | `pixelazed/tileset/**` | `public/tileset/{gem,td,kn,ttp,coast}` · `TileCatalog.ts` |
| 손질 · 회 | `pixelize_butchery.cjs` · `gen_butchery_views.cjs` · `gen_species_sprites.cjs` · `gen_flatfish_sprites.cjs` · `gen_sashimi_fillet.cjs` · `gen_octo_assets.cjs` | `food assets/**` · `assets/guide/*.svg` · `public/fish/*.png` | `src/data/PixelFish*.ts` · `SashimiFilletProfiles.ts` · `public/sashimi · trimmings` |
| 아이콘 | `gen_pixel_icons.py` · `gen_skill_icons.py` · `gen_tackle_icons.py` · `gen_card_rig_icons.py` · `pixelize_forage_photos.py` | 스크립트 안 아트 / `assets/items` · `food assets/forage` | `PixelIconArt.ts`(109키) · `SkillIconArt.ts`(93) · `public/item-icons` · `forage-board` |
| 도움말 | `capture_help_images.cjs` → `annotate_help_images.py` · `compose_fight_guide.py` | dev 서버 실캡처 | `public/guide/help/*` |
| 위키 | `dump_wiki_items.mjs` · `dump_quest_scenes.cjs` · `gen_wiki_images.py` → `gen_*_wiki_data.mjs` | 클라 카탈로그 · core dist | `tools/wiki_items.json` · `quest_scenes.json` · HTML |
| 검증 | `ui_overlap_audit.js` · `render_char_preview.mjs` | 페이지 주입 · core dist | `__uiAudit` 결과 · 검수 PNG |
| 고아 | `pixelize.py` · `build_map.py` · `gen_char_base.py` | 없음 / 폐기 패키지 | 소비처 없음 |

- `public/data` 실측: 속초 레거시 7 · 부산 8 · 홈타운 1 · depth 1 · `sokcho_v2` 7종 파일. 문서의 「속초 7 · 부산 8」과 일치한다.
- `sokcho_v2`는 1179×642타일(5m) · POI 559 · 차도 821 · 패치 키 8종(tiles 2,633 · tileTex 1,074 · levels 168 등).
- `packages/core/src/scripts/chumSyncSim.ts`는 밑밥 동조 시뮬 하네스다. `dist/scripts/`로 빌드되지만 `index.ts`에서 export하지 않는다.
- turbo 작업 6개(build · dev · typecheck · test · lint · clean) 중 build · typecheck는 3패키지가 가진다. test는 core만, lint는 0개다.
- `.github/`는 없고 배포는 스킬 `deploy-ghpages`의 수동 절차다. vite는 `base: './'` + `sourcemap: true`라 복사 때 `*.map`을 빼는 것이 수동 단계다.
- 234차 diff는 이 도메인 범위를 건드리지 않았다.

## 규칙과 함정

- `build_region_maps.py <region>`은 `pixelazed/<region>/meta.json`이 있으면 심리스, 없으면 레거시로 갈린다.
  인자 없이 돌리면 레거시 3지역 전부를 다시 쓰고, 모르는 지역 이름은 `KeyError`다.
- 현행 심리스 지역 키는 `sokcho_v2`다. 문서 예시의 `sokcho`는 레거시 경로다.
- `pois.json`을 쓰는 도구는 4개이고 `merge_capture_pois`가 항상 마지막이다. `build_region_maps`는 정본을 런타임으로 복사만 한다.
- `build_osm_tilemap` 재실행은 손수정 정본 `terrain.png`를 덮어쓴다.
- 커밋된 `seamless.json`은 「부분만 구운」 상태다(패치 2,633타일 중 271타일). 전부 구운 것으로도, 하나도 안 구운 것으로도 가정하지 않는다.
  런타임은 로드할 때 패치를 다시 덮으므로 최종 지형 차이는 0이다.
- 읽기 전용 대조법: `python3 -B`로 `build_region_maps`를 import해 `decode_png` · `classify_osm` · `build_grid`를 부르면
  파일을 쓰지 않고 산출물과 비교할 수 있다. `-B`가 없으면 `.pyc`가 생긴다.
- 체크아웃 직후라 mtime이 전부 같다. 신선도는 내용 대조로만 본다.
- 브라우저 · Playwright 탐색의 본보기는 `tools/capture_help_images.cjs`의 `resolvePlaywright` + `launchOpts`다(Windows와 컨테이너 모두 처리).
- 이 컨테이너에는 `py` 런처 · `rsync` · PowerShell이 없다. `python3` · `node` · `/opt/pw-browsers/chromium`은 있다.
- 어장 SHP 원본과 `_rastercache`는 무시 대상이라 없다. `extract_fishfarms` · `classify_raster`는 원본을 다시 받아야 돈다.
- 스킬 `asset-pipeline`의 `grid_overlay.cjs` · `render_octo_preview.cjs`는 「scratchpad 패턴」 이름이고 저장소에는 없다.
- 검증 루틴(build + client-pc typecheck)은 core 테스트 파일의 타입을 보지 않는다. 루트 `pnpm run typecheck`가 본다.
- 확인하지 못한 것: 굽고 난 뒤 저작 스크립트를 다시 돌리면 patch가 실제로 달라지는지 ·
  `tools/dump_wiki_items.mjs`가 Windows에서 esbuild를 찾는지 · `tools/quest_scenes.json`과 `wiki_items.json`이 지금 데이터와 같은지.

## 닫힌 수정안에서 배운 것

- (없음)
