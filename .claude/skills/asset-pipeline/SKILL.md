---
name: asset-pipeline
description: Pixel Angler 이미지 에셋 투입/교체 절차. 사용자가 새 PNG(어종 실사·손질 단계·부산물 trimmings·필렛·가이드 일러스트)를 제공하거나 기존 에셋을 교체할 때 반드시 로드. "에셋", "이미지 교체", "픽셀화", "스프라이트 생성", "trimmings", "재생성" 작업이면 이 스킬을 따른다.
---

# 에셋 파이프라인 (투입·교체·재생성)

## ⓪ 가장 중요한 구분 — "구운 스냅샷" vs "PNG 직접 로드"

PNG만 바꾸면 되는지, 생성기를 돌려야 하는지부터 판별한다:

| 소비 형태 | 대상 | PNG 교체 시 |
|---|---|---|
| **PNG 직접 로드** (BootScene `load.image`) | `public/fish/`(어획 팝업·인벤·도감) · `public/trimmings/`(부산물 아이콘) · `public/food/` · `public/guide/` · `public/sashimi/*.png` · `public/ui/` | 교체만으로 자동 반영 (브라우저 F5) |
| **구운 TS 스냅샷** (생성기가 도트 매트릭스로 인코딩) | `data/PixelFishStages.ts` · `data/PixelFishFlat.ts` · `data/PixelFishViews.ts` · `data/PixelFishSprites.ts` · `data/SashimiFilletProfiles.ts` | **생성기 재실행 필수** — PNG만 바꾸면 옛 그림이 계속 나온다 (76차 광어 사례) |

주의: `public/sashimi/*.png`는 직접 로드지만 **그 PNG 자체가 생성물** — 원본(`food assets/trimmings/…`)이 바뀌면 `gen_sashimi_fillet.cjs` 재실행.

## ① 생성기 목록 (전부 `node tools/<파일>` — Playwright+설치 Chrome, 자동 탐색)

| 도구 | 입력 | 출력 | 용도 |
|---|---|---|---|
| `pixelize_butchery.cjs` | `food assets/butchery/*.png` (**파일명 = 키**) | `data/PixelFishStages.ts` | 손질 단계 실사 → 도트 (누끼 BFS + 128폭 다운샘플 + 44색) |
| `gen_sashimi_fillet.cjs` | `food assets/trimmings/{fam}/pure_pillet_*` 등 (FAMILIES 배열) | `public/sashimi/fillet_{top,side}_{fam}.png` + `piece_{fam}.png` + `SashimiFilletProfiles.ts` | 회썰기 필렛 3뷰 |
| `gen_flatfish_sprites.cjs` | `public/fish/halibut.png` | `data/PixelFishFlat.ts` | 광어 도마 온마리 (등면 + 배면 파생) |
| `gen_butchery_views.cjs` | (파라메트릭 — 입력 없음) | `data/PixelFishViews.ts` | 복면/체강/장뜨기 뷰 |
| `gen_octo_assets.cjs` | `reference/cephalopod/octopus/` 투명 PNG 4종 + `octo_clean` 도트 | `public/trimmings/octo_boiled{,_head,_leg}.png` · `public/sashimi/piece_octopus.png` · `public/trimmings/octo_whole.png` | 삶은 문어 계열 직접 로드 아이콘 (098차) |
| `py tools/build_region_maps.py <region>` | `pixelazed/<region>/*.png` | `public/data/<region>/*.json` | 지역 타일맵 |
| `py tools/extract_tileset_assets.py survey\|build\|contact` | `pixelazed/tileset/` (Gemini 개별 PNG · TopDown 시트 · Kenney 시트) | `public/tileset/{gem,td,kn}/*.png` + `_survey/` 컨택트시트 | 심리스 프리팹·프롭·차량·NPC (101차). survey로 인덱스 컨택트 → 표(`TOPDOWN_PICK`/`KENNEY_PICK`) 갱신 → build → contact로 검수. 새 키는 `data/TilesetManifest.ts`에 등록 |
| `py tools/extract_tileset_assets.py ttp` | `pixelazed/tileset/1.png`·`2.png` (사용자 제작 TTP 목업 시트) | `public/tileset/ttp/*.png` (25장) | 테트라포드·해안 접경 (104차). ⚠ **목업 스크린샷이라 격자가 아니다** — 셀 경계 실측표(`TTP_SHEET1/2`) → area 리샘플 → k-means 양자화. 접경 셀은 `cut_water`로 바다를 투명으로 판다(게임 물 색과 다름). 타일은 **32px = TR 1:1** |
| `py tools/extract_tileset_assets.py coast` | `pixelazed/tileset/돌 방파제 그리드.png` · `방파제 바위 및 바다 경계면 모서리.png` · `부두 플랫폼 모서리.png` | `public/tileset/coast/*.png` (51장) | 방파제 상판·사석·부두 모서리·갯바위 (105차). 실사 사진 격자는 선 실측(`STONE_XS/YS`) 후 **선별** 크롭, 테두리 셀 시트는 **불투명 AND 근검정** 마스크로 탐지(흰 배경 = 알파 0 함정). 군 단위 **톤 정규화**(`_clean(match=)`) 필수 — 안 맞추면 바둑판 이음매 |

- 생성물 TS는 헤더에 "자동 생성 — 수동 편집 금지" — 절대 손으로 고치지 말고 재생성.
- 도구의 playwright 경로는 자동 탐색(로컬 → `%LOCALAPPDATA%/npm-cache/_npx`) — 특정 계정 경로 하드코딩 금지. ⚠ `.cjs` 주석에 `_npx/*/…` 글롭을 쓰면 `*/`가 블록 주석을 조기 종료시킨다 — 라인 주석 사용.

### ①-b `pixelize_butchery.cjs` 입력 방식 2종

| 방식 | 언제 | 설정 |
|---|---|---|
| **파일명 = 키** (기본) | `food assets/butchery/*.png` 루트. ASCII 파일명일 때 | 없음 |
| **명시 매핑** | 사용자가 **한글·공정 순서 이름**으로 하위 폴더에 관리할 때 (두족류 `reference/cephalopod/`) | `CEPH_SRC` 같은 `{파일명: 키}` 테이블 + 폴더 상수 — **ASCII로 복제하지 말 것**(사본이 갈라진다) |

- **긴 축 기준 다운샘플**(`FIT_LONG_PREFIX`) — 세로로 찍힌 원본은 가로 기준(GRID_W 128)이면 다운샘플이
  거의 안 걸린다. bbox가 좁으면 `cell=1`이 되어 **원본 행이 그대로 구워진다**(실측: 121×449 → 449행).
  종횡비가 흔들리는 어군(두족류 0.27~2.6)은 접두 등록해 긴 축 기준으로 통일한다.
  가로 원본(bw ≥ bh)은 `longPx === bw`라 **기존 결과와 바이트 동일** — 회귀는 `git diff`의 삭제 0줄로 확인.
- **KEEP_POLY**(피사체 폴리곤 — 098차 신설): 손·싱크대·트레이가 프레임을 채우는 **공정 실사**는 배경
  BFS로 분리가 안 된다(젖은 회색 피사체 ≈ 스테인리스 색 — `BG_TOL`을 4로 사실상 끄고 폴리곤 전담).
  키별 폴리곤(정규화 0~1, 복수 가능) **바깥을 전부 제거** — ERASE_POLY와 별개·둘 다 회전/미러보다 먼저.
  좌표는 **그리드 오버레이**(0.1 간격 좌표선을 얹은 프리뷰 — scratchpad `grid_overlay.cjs` 패턴)로
  트레이스하고, `render_octo_preview.cjs` 패턴(레지스트리 → PNG)으로 육안 검수하며 조인다.
  ⚠ 폴리곤은 **구도 종속** — 같은 키에 다른 구도 사진을 넣으면 재실측 필수.
  ⚠ 100차부터 문어(`octo_*`)는 **투명 픽셀 에셋**(`octopus/손질 가이드에 적용할 픽셀 투명 에셋 이미지/0~9.png`)
  이 정본 — 알파 경로 자동이라 KEEP_POLY/BG_TOL 불필요(테이블은 비어 있음).
- ⚠ **두족류 소스 폴더는 사용자 구조 종속** — 무늬오징어는 `reference/cephalopod/무늬오징어 레퍼런스/`
  (100차 이동 반영). 폴더가 또 이동되면 파이프라인이 "입력 없음" **경고만 내고 건너뛰어 재생성 시
  해당 키가 소실**된다 — 재생성 로그에 경고가 보이면 `CEPH_SRC_DIR`/`OCTO_PIXEL_DIR`부터 확인.

## ② 방향 규칙 (전 필렛 뷰 공통 컨벤션)

- **온마리(도마)**: 머리 **왼쪽** (돔류/방어류/광어 전부. 광어는 BASE=등면·FLIP=배면, 좌우 미러 없음).
- **두족류(도마)**: **다리·외투막 입구 = 왼쪽 / 외투막 끝 = 오른쪽**. 세로로 찍힌 원본은 `ROTATE_KEYS` **cw**.
  굽고 나서 **열별 실루엣 프로파일**(좁은 끝이 어느 쪽인지)로 수치 확인하면 눈대중 오판을 막는다.
- **필렛류(도마 박피·회썰기 탑/측면)**: **꼬리 왼쪽 · 머리 오른쪽** — 박피 peel_grip(꼬리 칼집)·회썰기 컷 순서(머리부터)가 이 기준.
- 원본 사진이 반대 방향이면: `pixelize_butchery.cjs`의 **`MIRROR_KEYS`**(도마용) / `gen_sashimi_fillet.cjs`의 **`flipX`/`flipTop`**(회썰기용)에 등록해 굽는 시점에 반전. 렌더 코드에서 뒤집지 않는다.

## ③ 투입 체크리스트

1. **테두리 불투명 검사**: 투명 배경 전제 에셋에 흰/근백색 배경이 구워져 있는지 확인 (65차 — skinned_pillet 2장 사례). 불투명이면 테두리 BFS 누끼 후 `public/`에 배치. **원본(`food assets/`)은 수정하지 않는다** — 재복사 시 재적용 필요함을 인지.
2. 원본은 `food assets/`(어종군 하위 폴더: `trimmings/{bream,amberjack,halibut}/`)에 보존, 게임 소비본은 `packages/client-pc/public/`에 복사.
3. BootScene `load.image('키', '상대/경로.png')` — **선행 `/` 절대 금지** (gh-pages 서브패스에서 404).
4. 어종 실사는 `data/FishTextures.ts`의 `FISH_TEXTURE` 맵에도 등록 (키 규칙 `fish_<speciesId>` — 성별/체장 분기는 `resolveFishTexture`).
5. 어종군 판정은 `PixelButcherFish.butcherFamilyOf(speciesId)` 단일 소스 — 로컬 셋 중복 생성 금지.
6. 재생성 후 `git diff --stat`으로 생성물 변화 확인 → **실렌더 스크린샷 검증** (verify-render 스킬) → 빌드 4/4 · typecheck 0.

## ④ 아이콘/렌더 배선 참고

- 아이템 아이콘 = `InvItem.iconTexture` (createItemIcon 8개 호출처 공용, speciesId 폴백 있음).
- 어종별 색 변형(머리 틴트 등)은 캔버스 베이크(`bakeTintedTrim` 패턴) — 원본 1장 + 런타임 합성.
- 도마 단계 스프라이트 조회 = `stageSpr('키')` (PixelFishStages 레지스트리, 없으면 파라메트릭 폴백).
