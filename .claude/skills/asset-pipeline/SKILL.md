---
name: asset-pipeline
description: Pixel Angler 이미지 에셋 투입/교체 절차. 사용자가 새 PNG(어종 실사·손질 단계·부산물 trimmings·필렛·가이드 일러스트)를 제공하거나 기존 에셋을 교체할 때 반드시 로드. "에셋", "이미지 교체", "픽셀화", "스프라이트 생성", "trimmings", "재생성" 작업이면 이 스킬을 따른다.
---

# 에셋 파이프라인 (투입·교체·재생성)

## ⓪ 가장 중요한 구분 — "구운 스냅샷" vs "PNG 직접 로드"

PNG만 바꾸면 되는지, 생성기를 돌려야 하는지부터 판별한다:

| 소비 형태 | 대상 | PNG 교체 시 |
|---|---|---|
| **PNG 직접 로드** (BootScene `load.image`) | `public/trimmings/`(부산물 아이콘) · `public/food/` · `public/guide/` · `public/sashimi/*.png` · `public/ui/` | 교체만으로 자동 반영 (브라우저 F5) |
| **구운 카드 · 아이콘** (246 — 원본은 `food assets/fish/` · 작물은 `food assets/crops/`) | `public/fish/` · `public/fish/icon/`(어획 팝업 · 인벤 · 도감 · 도마 미리보기) · `public/crops/<id>_card.png` · `_icon.png` | **`node tools/fish_cards.cjs`**(어종) · `pixelize_crops.cjs`(작물) 재실행 — `public/fish/`를 직접 고치지 않는다(다음 굽기에 덮인다) |
| **구운 TS 스냅샷** (생성기가 도트 매트릭스로 인코딩) | `data/PixelFishStages.ts` · `data/PixelFishFlat.ts` · `data/PixelFishViews.ts` · `data/PixelFishSprites.ts` · `data/SashimiFilletProfiles.ts` | **생성기 재실행 필수** — PNG만 바꾸면 옛 그림이 계속 나온다 (76차 광어 사례) |

주의: `public/sashimi/*.png`는 직접 로드지만 **그 PNG 자체가 생성물** — 원본(`food assets/trimmings/…`)이 바뀌면 `gen_sashimi_fillet.cjs` 재실행.

**공용 부산물 원본은 한 벌만 둔다** — 여러 어군이 같이 쓰는 그림(`fish_skin` · `pin_bone` · `pile_of_fish_guts` ·
`skinned_pillet_with(out)_ribs`)은 `food assets/trimmings/` 루트에만 두고 어군 폴더에 복제하지 않는다.
삶은 문어 계열 4장도 도구가 읽는 `butchery/reference/cephalopod/octopus/`에만 둔다(사본은 갈라진다).

## ① 생성기 목록 (전부 `node tools/<파일>` — Playwright+설치 Chrome, 자동 탐색)

| 도구 | 입력 | 출력 | 용도 |
|---|---|---|---|
| `pixelize_butchery.cjs` | `food assets/butchery/*.png` (**파일명 = 키**) | `data/PixelFishStages.ts` | 손질 단계 실사 → 도트 (누끼 BFS + 128폭 다운샘플 + 44색) |
| `gen_sashimi_fillet.cjs` | `food assets/trimmings/{fam}/pure_pillet_*` 등 (FAMILIES 배열) | `public/sashimi/fillet_{top,side}_{fam}.png` + `piece_{fam}.png` + `SashimiFilletProfiles.ts` | 회썰기 필렛 3뷰 |
| `gen_flatfish_sprites.cjs` | `food assets/fish/halibut.png` | `data/PixelFishFlat.ts` | 광어 도마 온마리 (등면 + 배면 파생) |
| `fish_cards.cjs` (246) | `food assets/fish/*.png` · 표 `FishTextures.ts` `FISH_IMAGE_FILES` | `public/fish/<파일>`(카드 · 410×166 안) · `public/fish/icon/<파일>`(64px) | 어종 그림 게임판 — Playwright 불필요(순수 Node). `--check` = 표 ↔ 원본 ↔ 출력 대조 |
| `gen_butchery_views.cjs` | (파라메트릭 — 입력 없음) | `data/PixelFishViews.ts` | 복면/체강/장뜨기 뷰 |
| `gen_octo_assets.cjs` | `reference/cephalopod/octopus/` 투명 PNG 4종 + `octo_clean` 도트 | `public/trimmings/octo_boiled{,_head,_leg}.png` · `public/sashimi/piece_octopus.png` · `public/trimmings/octo_whole.png` | 삶은 문어 계열 직접 로드 아이콘 (098차) |
| `py tools/item_art/build.py` | `tools/item_art/icons_*.py` | `public/item-icons/drawn/*.png` + `data/ItemArtManifest.ts` | 코드로 그린 아이템 그림(2026-10-08). 아이템 id로 고른다(`itemArtKeyOf`) — 백필 불필요 · PNG 손편집 금지 |
| `py tools/build_region_maps.py <region>` | `pixelazed/<region>/*.png` | `public/data/<region>/*.json` | 지역 타일맵 |
| `py tools/extract_tileset_assets.py survey\|build\|contact` | `pixelazed/tileset/` (Gemini 개별 PNG · TopDown 시트 · Kenney 시트) | `public/tileset/{gem,td,kn}/*.png` + `_survey/` 컨택트시트 | 심리스 프롭·차량·지면 (101차). survey로 인덱스 컨택트 → 표(`TOPDOWN_PICK`/`KENNEY_PICK`) 갱신 → build → contact로 검수. 새 키는 `data/TilesetManifest.ts`에 등록. ⚠ **261차 — 건물 프리팹(횟집 · 팝업 · 고층 · 주택 · 노점)과 지붕 키트는 게임이 더 로드하지 않는다**(파일만 남긴다 · 건물은 `field/BuildingArt.ts`) — 매니페스트에 다시 넣지 말 것 |
| `py tools/extract_tileset_assets.py ttp` | `pixelazed/tileset/1.png`·`2.png` (사용자 제작 TTP 목업 시트) | `public/tileset/ttp/*.png` (25장) | 테트라포드·해안 접경 (104차). ⚠ **목업 스크린샷이라 격자가 아니다** — 셀 경계 실측표(`TTP_SHEET1/2`) → area 리샘플 → k-means 양자화. 접경 셀은 `cut_water`로 바다를 투명으로 판다(게임 물 색과 다름). 타일은 **32px = TR 1:1** |
| `py tools/extract_tileset_assets.py coast` | `pixelazed/tileset/돌 방파제 그리드.png` · `방파제 바위 및 바다 경계면 모서리.png` · `부두 플랫폼 모서리.png` | `public/tileset/coast/*.png` (147장) | 방파제 상판·사석·부두 모서리·갯바위 (105차 → **106차에 96셀 전량 개별화**). 실사 격자는 선 실측(`STONE_XS/YS`), 테두리 셀 시트는 **불투명 AND 근검정** 마스크(흰 배경 = 알파 0 함정). 군 단위 **톤 정규화**(`_clean(match=)`) 필수. **`grain=2` 필수** — 1:1로 구우면 그 타일만 입자가 절반이다 |
| `py tools/extract_tileset_assets.py catalog` | 위 추출물(coast·ttp) | `src/data/TileCatalog.ts` (타일 126 · 오브젝트 27) | **F7 편집기 팔레트 단일 소스**(106차). 시트를 늘리면 `coast`/`ttp` 뒤에 반드시 이 모드를 돌린다 — 안 돌리면 새 셀이 팔레트·매니페스트에 안 뜬다 |
| `py tools/extract_tileset_assets.py gem` | `pixelazed/tileset/Gemini generated and edited/*` | `public/tileset/gem/*.png` (19장) | Gemini 생성본 **도트 리베이크**(106차 — 22색 + 2px 입자). 원본은 그대로 두고 출력만 재가공. ⚠ TopDown(`td`)은 네이티브 도트(3~9색)라 **다시 굽지 않는다** |

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

### ①-c 도트 입자 규칙 (106차 — 전 세트 공통)

맵의 기준 입자는 **2px**(Kenney 16px ×2 · 절차 물 디더). 실사/생성 에셋을 32px 1:1로 구우면
그 타일만 입자가 절반이라 인접 대비가 4~20배로 튄다(실측: 잔디 0.85 ↔ 사석 15~20).

- 새 시트는 `_clean(..., grain=2)`로 굽는다(`COAST_GRAIN`/`TTP_GRAIN`/`GEM_GRAIN` 상수).
- 트림 스프라이트는 **짝수 크기**로 맞춘다(홀수면 마지막 열/행이 1px 입자로 남는다).
- 배치 오프셋도 **짝수 스냅** — 홀수로 놓으면 입자가 어긋난다.
- 예외: **TopDownCityPack**은 원래 도트(3~9색)라 재베이크가 손해다.

## ② 방향 규칙 (전 필렛 뷰 공통 컨벤션)

- **온마리(도마)**: 머리 **왼쪽** (돔류/방어류/광어 전부. 광어는 BASE=등면·FLIP=배면, 좌우 미러 없음).
- **두족류(도마)**: **다리·외투막 입구 = 왼쪽 / 외투막 끝 = 오른쪽**. 세로로 찍힌 원본은 `ROTATE_KEYS` **cw**.
  굽고 나서 **열별 실루엣 프로파일**(좁은 끝이 어느 쪽인지)로 수치 확인하면 눈대중 오판을 막는다.
- **필렛류(도마 박피·회썰기 탑/측면)**: **꼬리 왼쪽 · 머리 오른쪽** — 박피 peel_grip(꼬리 칼집)·회썰기 컷 순서(머리부터)가 이 기준.
- 원본 사진이 반대 방향이면: `pixelize_butchery.cjs`의 **`MIRROR_KEYS`**(도마용) / `gen_sashimi_fillet.cjs`의 **`flipX`/`flipTop`**(회썰기용)에 등록해 굽는 시점에 반전. 렌더 코드에서 뒤집지 않는다.

### ①-d 「투명 배경」이 아닌 에셋 — 체커보드 벗기기 (174차)

투명을 뜻하는 **회색 체커보드가 실픽셀로 구워진 채** 오는 경우가 있다(사용자 캡처·편집 실패본).
육안으로는 투명과 구별되지 않으니 **받자마자 확인**한다.

```python
im = Image.open(p)          # mode가 'RGB'면 알파 자체가 없다
im = im.convert('RGBA'); px = im.load()
# 테두리 알파 표본 — 전부 0이어야 "진짜 투명"
```

실측 규격(174차 병어·덕대): 칸 **약 11.9px** · 두 회색 **L 34 / L 102** · 전부 무채색(R=G=B).

⚠ **밝기 밴드만으로 훑으면 안 된다** — 은백색 피사체(병어·덕대)는 배경과 밝기가 겹쳐,
어두운 윤곽선을 다리 삼아 **몸통 안으로 샌다**. 반대로 순정 회색만 훑으면 JPEG가 뭉갠
칸 경계(L 45~90)가 벽이 되어 **칸 하나에 갇힌다**(제거율 22.6%).

**3단 절차**로 벗긴다.

1. **격자 모델 BFS** — 체커는 완전히 주기적이므로 칸 크기·위상·명암 반전을 추정해
   「이 칸이 기대하는 회색」과 비교한다. 같은 회색이라도 피사체는 패턴을 안 따라 경계에서 멈춘다.
2. **최대 연결요소만 보존** — 남는 얼룩은 전부 피사체와 떨어져 있다.
   불투명 연결요소를 세어 가장 큰 덩어리만 남긴다(174차 실측 1,163개 → 1개).
3. **실루엣 프린지 제거** — 윤곽선에 *붙어* 버린 칸은 1을 통과한다.
   바깥(투명)에서 다시 BFS로 들어가 순정 회색만 지운다(허용 오차를 한 번 넓혀 2회).

끝나면 `getbbox()` 타이트 크롭 + **투명 여백 2px 패드**(에지 클리핑 방지).
결과는 **어두운 패널색(0x1a1c22) 위에 합성해 육안 확인** — 흰/체커 헤일로가 남으면 실패다.

### ①-e 교체 전에 **실제 파일명**을 확인한다 (175차)

텍스처 키와 파일명은 **같지 않을 수 있다.** 실사례: `fish_hairtail`(갈치)이 읽던 파일은
**`Cutlassfish.png`(대문자 C)** 였다 — `public/fish/`의 나머지 50개가 전부 소문자인데 하나만 예외였다.

- 이걸 모르고 어종 id(`hairtail.png`)나 소문자 통칭으로 파일을 쓰면
  **게임이 한 번도 읽지 않는 새 파일이 생기고 구 이미지가 그대로 남는다.**
  빌드도 통과하고 에러도 없어서 "교체했는데 안 바뀐다"로만 나타난다.
- 절차: 교체 전에 **실제 파일명**을 확인하고 그 파일을 덮어쓴다. 어종은 246차부터 `FishTextures.ts`의 **`FISH_IMAGE_FILES` 표**가 정본이고
  (BootScene은 그 표를 반복해 싣는다), 원본은 `food assets/fish/<파일>` — 덮어쓴 뒤 `node tools/fish_cards.cjs --only <파일>`. 그 밖의 에셋은 `BootScene.ts`의 `load.image` 줄을 grep.
- gh-pages는 **대소문자를 구분**한다. 새 파일은 **소문자로 통일**하고,
  기존 대문자 파일을 정리하면 표(`FISH_IMAGE_FILES`) · `BootScene` 경로도 같이 고친다(`So-iuy_mullet.png` 하나 남음 — 사용자 결정).

## ③ 투입 체크리스트

1. **테두리 불투명 검사**: 투명 배경 전제 에셋에 흰/근백색 배경이 구워져 있는지 확인 (65차 — skinned_pillet 2장 사례). 불투명이면 테두리 BFS 누끼 후 `public/`에 배치. **원본(`food assets/`)은 수정하지 않는다** — 재복사 시 재적용 필요함을 인지.
2. 원본은 `food assets/`(어종군 하위 폴더: `trimmings/{bream,amberjack,halibut}/`)에 보존, 게임 소비본은 `packages/client-pc/public/`에 복사.
3. BootScene `load.image('키', '상대/경로.png')` — **선행 `/` 절대 금지** (gh-pages 서브패스에서 404).
4. 어종 실사는 원본을 `food assets/fish/`에 두고 `data/FishTextures.ts`의 **`FISH_IMAGE_FILES`(키 → 파일)** · **`FISH_TEXTURE`(어종 id → 키)** 에 등록 →
   `node tools/fish_cards.cjs`(키 규칙 `fish_<speciesId>` — 성별/체장 분기는 `resolveFishTexture`). 상세는 ⑦.
5. 어종군 판정은 `PixelButcherFish.butcherFamilyOf(speciesId)` 단일 소스 — 로컬 셋 중복 생성 금지.
6. 재생성 후 `git diff --stat`으로 생성물 변화 확인 → **실렌더 스크린샷 검증** (verify-render 스킬) → 빌드 3/3 · typecheck 0.

## ④ 아이콘/렌더 배선 참고

- 아이템 아이콘 = `InvItem.iconTexture` (createItemIcon 8개 호출처 공용, speciesId 폴백 있음).
- 코드로 그린 아이템 그림은 **아이템 id → `ITEM_ART_BY_ID`/접두사/`px:` 키** 순으로 고른다(사용자 래스터 `iconTexture`가 있으면 그쪽이 이긴다).
- 어종별 색 변형(머리 틴트 등)은 캔버스 베이크(`bakeTintedTrim` 패턴) — 원본 1장 + 런타임 합성.
- 도마 단계 스프라이트 조회 = `stageSpr('키')` (PixelFishStages 레지스트리, 없으면 파라메트릭 폴백).

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

## ⑤ 작물 초상 — 사진 → 어종 기준 도트 (241차)

어종 원본(`food assets/fish/` — 246차에 `public/fish/`에서 옮김)은 셀 6px · 가로 약 192셀 · 8비트 RGBA · 팔레트 양자화 없음(실측 `node tools/check_art_quality.cjs "food assets/fish"`).
작물 초상은 같은 기준으로 굽는다 — Pillow · numpy 없이(순수 Node `tools/lib_png.cjs`).

```bash
# 입력: food assets/crops/<수확물 기본 id>.(png|jpg|webp)  — 흰(단색) 배경 사진 또는 투명 PNG · 파일명 = crop_peanut 같은 기본 id
node tools/pixelize_crops.cjs                 # 전부 · --only crop_peanut · --tol 30(배경 허용) · --close 4(파인 홈 닫기) · --cells 192 · --cell 6
#   기본 --style pixelart = 툰 추상화(8단 φ5 → DoG 먹선 → 셀 → 윤곽 = 안쪽 이웃 55%) — 팔레트 · 평활 없음(241 3차 + 242 감자 · 13쌍 손실 62.8 → 17.9)
#   손잡이: --levels 8 · --phi 5 · --sat 1.25 · --contrast 0.95 · --edge 3(선 진하기) · --dog 1.4(선 굵기) · --colors 0 · --outlineDark 0.55 · --shadow 0.25 · --bilateral 0 · --outline 1(2 = 안쪽 먹선 추가)
#   --style photo = 사진 블록(어종 PixelOE 느낌 · 픽셀 아트 grade 아님) · --style kuwahara = v2(얼룩 — 비교용)
node tools/check_art_quality.cjs packages/client-pc/public/crops     # 5기준 재측정 — 긴 변 · 셀 · 색 · sdL · 노이즈 · 깃발
```

- 출력 `public/crops/<id>.png`(셀 6px 원본 · 위키 재료) + `<id>_card.png`(244 — 상세 창 카드 · 게임이 `cropimg_`로 싣는다)
  + `<id>_icon.png`(64px · 가방 칸) + `src/data/CropPortraits.ts`(자동 목록 — 손으로 고치지 않는다).
- 배선은 `ui/ItemIcon.ts` `cropPortraitTexture` — `px:crop_*` 키에 초상이 있으면 그것, 없으면 16px 손그림. 등급 꼬리 · 조각도 같은 키를 쓴다.
- JPEG · WebP는 Playwright 크롬 캔버스로 디코드한다(`/opt/node-tools` 또는 npx 캐시). 16비트 · 인터레이스 PNG도 그 경로.
- 어종 점검 깃발: 「알파 전면 <255」(252~253 — `--fix-alpha`로 `.fixed.png` 사본) · 「셀 없음」(사진 그대로) · 「셀 굵음 ≥ 12」 · 「대문자 파일명」. 교체는 사용자 결정 뒤.
- ⚠ **사진을 셀로 내려 찍기만 한 것은 픽셀 아트 grade가 아니다**(241 사용자 지적) — 주력 물건은 사용자 변환 흐름(AI 변환 → piskel), 도구는 정규화 · 대체본.
- **사용자 변환본은 `food assets/crops/asis/<id>.png`에 넣는다** — 양식화 없이 192셀로 리샘플만(`--style asis`). 같은 id가 사진에도 있으면 asis가 이긴다.
  자동 판정은 없다(AI 변환본은 격자 점수 1.1~1.3 · 같은 색 런 2~56%로 사진과 겹친다 — 241 3차 실측).
- **보정(참고본 쌍으로 손잡이 맞추기)**: 쌍은 `food assets/crops/_calib/{photo,ref}/<id>.png`(사진 ↔ 변환본).
  `node tools/crop_calib.cjs --eval`(쌍별 표 · 가중 손실) · `--sweep --rounds 2`(좌표 하강 → `_calib/best.json`) · `--render <폴더>`(출력 + 시트).
  통계 자 = `tools/crop_grade.cjs`(192셀 면적 평균 셀 그림에서 채도 · 밝기 편차 · k90 · 윤곽 비 · 질감 · 먹점 · 밝은 점 · 같은 이웃 + 유사도 corr/rgb/iou).
  best.json은 기본값에 **손으로** 옮긴다(`DEFAULTS`) — 근거를 `photo-pixel-art.md` §3.6~3.7에 남긴다. 상추 격자처럼 한 장에 여러 품종이면 `tools/lettuce_grid_split.cjs` 패턴으로 먼저 가른다.
- 작은 사진(긴 변 < 200px)은 키워도 질감이 없다 — **한 물건당 400px 이상**을 받는다. 키우는 리샘플은 `resample`(쌍선형)이지 `areaResize`가 아니다(격자 구멍).
- 위키 그림: 초상을 다시 구우면 `node tools/wiki_crop_img.cjs`(1/3 면적 평균 → `tools/wiki_img/px_crop_*.png` + manifest w/h) → `node tools/gen_game_wiki_data.mjs --html > …/index.html` → 아티팩트 재발행.
- 시험용 `--out` 폴더로 돌리면 `CropPortraits.ts`는 그대로 둔다(기본 폴더일 때만 목록 재생성).
- **그림 한 장 = 수확물 한 단위(가방 칸 하나)**(243) — 「딸기 (1개)」는 한 알, 「한 줌」은 한 줌. 포장한 팩은 별도 id(`crop_<x>_pack`)라
  팩 초상은 `crop_<x>_pack.png`로 넣는다(목록 정규식이 잡고, 팩 아이콘 키 `px:crop_<x>_pack`이 그 초상을 찾는다). 없으면 16px 손그림(투명 용기).
  남은 파일 이름 전부는 `docs/wiki/02-SYSTEMS/photo-pixel-art.md` §5.1.

## ⑥ 작물 초상 — 사진 없이 Gemini로 그리기 (244차)

사진이 없는 작물은 Gemini 그림 모델(기본 `gemini-nano-banana-2.1`)에 「생김새 설명 + 화풍 참고 그림 3장(딸기 · 청치마 · 감자 변환본)」을 보내 그린다.

```bash
# 키는 환경의 네트워크 시크릿이 붙인다(호스트 generativelanguage.googleapis.com · 헤더 x-goog-api-key · 접두사 없음)
# ⚠ Node 내장 fetch는 프록시를 안 탄다 — NODE_USE_ENV_PROXY=1 필수(빼먹으면 403 「unregistered callers」)
NODE_USE_ENV_PROXY=1 node tools/gemini_crop_art.cjs --out <스테이징 폴더> --dry          # 프롬프트만 본다
NODE_USE_ENV_PROXY=1 node tools/gemini_crop_art.cjs --out <스테이징 폴더> --jobs 4       # 초상 없는 작물 전부(이미 뽑은 것은 건너뜀)
NODE_USE_ENV_PROXY=1 node tools/gemini_crop_art.cjs --out <폴더> --only crop_a --tag v2 --force   # 다시 뽑기(다른 판)
node tools/gemini_crop_art.cjs --out <스테이징 폴더> --install                          # 검수 뒤 640px로 asis/에
node tools/pixelize_crops.cjs                                                           # 초상 · 카드 · 아이콘 · CropPortraits.ts
```

- **생김새 설명은 `LOOKS` 표**(수확물 기본 id → 한 줄)에 있다. 새 작물을 넣으면 여기에 한 줄을 더한다 — 없으면 경고와 함께 건너뛴다.
  우리 산나물(곰취 · 어수리 · 눈개승마 등)은 모델이 모를 수 있어 **잎 모양 · 줄기 색 · 묶음 형태**를 구체적으로 쓴다.
- 그림 한 장 = 수확물 한 단위: 「한 줌」은 한 줌, 「(1개)」는 한 개, 「1kg」은 서너 개 무더기, 「한 단」은 끈으로 묶은 다발.
- 응답은 1024px **JPEG**다 — 도구가 `convert`로 PNG32로 바꾼다. 저장소 `asis/`에는 **긴 변 640px**만 넣는다(1,024px 원본과 초상 결과 corr 0.99 · 용량 절반).
- 검수는 시트로 한다(12장씩 · 칸 아래 id): `montage -label '%t' … -tile 4x -geometry 230x230+4+4`. 틀린 모양은 `LOOKS`를 고쳐 `--tag`로 다시 뽑고, 고른 판을 `<id>.png`로 바꿔 둔다.
- 값: 2.1은 1K 한 장 약 0.034달러(72장 ≈ 2.5달러). 결제가 꺼져 있으면 429 「free_tier … limit: 0」.
- 게임은 **카드 판**(`crops/<id>_card.png` · 상세 창 칸 228×90에 맞춘 면적 평균)과 64px 아이콘만 싣는다. 셀 6px 원본(1,170px)은 위키 재료다.
- **씨 · 낟알 무더기**(247 들깨 · 참깨)는 알 하나의 모양 · 크기 · 색을 이웃 작물과 갈라 적는다(「들깨 = 둥근 회갈색 2mm · 그물 무늬」 ↔ 「참깨 = 납작한 물방울 아이보리」)
  — 「깻잎 · 꼬투리 없이 씨만」을 붙여야 잎 · 꼬투리를 같이 그리지 않는다.
- **중간 수확물 · 팩은 `--set extra` · `--set pack`**(245 — 14장). 팩은 용기가 그림의 일부라 도구가 `kind: 'pack'`이면 조건 문구를 바꾼다
  (「포장한 한 팩 · 비스듬히 위에서 · 라벨 · 가격표 · 글자 없음」). 일반 조건(「한 단위만 · 바구니 없음」)으로 부르면 용기를 빼고 그린다.
- **잎 · 줄기 사이에 갇힌 흰 배경**(245)은 테두리 BFS가 못 닿아 어두운 창에서 흰 점이 된다 — `pixelize_crops.cjs`의 `holes`(기본 180)가
  둘레가 어두운 흰 섬만 뺀다(흰 작물 하이라이트는 둘레가 밝아 남는다). 초상을 다시 구우면 전부에 걸리므로 `git diff --stat`으로 바뀐 수를 본다(245 = 71장).
- 초상을 다시 구운 뒤 위키: `python3.13 tools/gen_wiki_images.py`(Pillow는 3.13에만 있다) → `node tools/wiki_crop_img.cjs` → `node tools/dump_wiki_items.mjs`(새 아이템이 있으면)
  → `node tools/gen_game_wiki_data.mjs --html`. 아티팩트에는 바뀐 그림만 `files`로 올린다(245 = 105장).

## ⑦ 어종 그림 — 원본 · 카드 · 아이콘 · 사진 없는 어종 Gemini (246차)

게임은 어종 원본(511~2,172px)을 싣지 않는다 — 원본 53장을 싣던 때 부팅 텍스처가 약 181MB였다.

```bash
node tools/fish_cards.cjs                         # 표에 있는 전부 → public/fish/<파일>(카드) + public/fish/icon/<파일>(64px)
node tools/fish_cards.cjs --only black_scraper.png
node tools/fish_cards.cjs --check                 # 표 ↔ 원본 ↔ 출력 대조(빠진 카드가 있으면 exit 1)
```

- **표 하나**: `data/FishTextures.ts`의 `FISH_IMAGE_FILES`(텍스처 키 `fish_<…>` → 파일). BootScene 로드 · 카드 굽기 · 위키 그림(`gen_wiki_images.py`)이 함께 읽는다.
  BootScene은 카드를 `fish_<…>`, 아이콘을 `fishicon_<…>`로 싣는다(`fishIconKey`).
- **카드 = 410×166 안**(가장 큰 칸 = 손질 도마 미리보기 · 도마 480×240 − 70 · 74)에 비율대로 면적 평균. 어획 결과 창(360×146) · 상세(300×120) · 도감(84×66)은 줄여 그린다.
  비율이 원본 그대로라 화면마다 그려지는 크기는 원본 때와 같다. 칸을 키우면 `CARD_W` · `CARD_H`도 키운다.
- **72px 이하 칸은 아이콘** — 화면 코드는 `fitFishTexture(scene.textures, key, boxW, boxH)`로 판과 크기를 함께 받는다(가방 · 쿨러 교체 · 수조 · 세로 긴 어종 도감 칸).
  어종 키가 아니면 받은 키 그대로라 아이콘 공용 경로(`createItemIcon` · `makeFishPreview`)에 넣어도 안전하다.
- 면적 평균이 알파를 문턱(0.3 · 0.85)으로 굳혀, 원본의 전면 알파 252~253 · 유령 픽셀이 카드에서 사라진다(원본은 그대로).
- 도마 스냅숏(`gen_species_sprites.cjs` · `gen_flatfish_sprites.cjs`)은 원본(`food assets/fish/`)을 읽는다 — **이 컨테이너 크로뮴으로 돌리면 사용자 PC 크롬과 픽셀이 달라진다**
  (246 실측 — 벵에돔 64줄). 다시 굽기는 사용자 PC에서, 컨테이너에서는 데이터 diff를 되돌린다.

**사진 없는 어종 → Gemini**(`tools/gemini_fish_art.cjs` · 작물 ⑥과 같은 키 · `NODE_USE_ENV_PROXY=1`):

```bash
NODE_USE_ENV_PROXY=1 node tools/gemini_fish_art.cjs --out <스테이징> --dry            # 프롬프트만
NODE_USE_ENV_PROXY=1 node tools/gemini_fish_art.cjs --out <스테이징> --only sandfish  # 생성(원본 없는 것만 · --tag v2 --force로 다른 판)
node tools/gemini_fish_art.cjs --out <스테이징> --install [--force]                   # 고른 판(<id>.png) → food assets/fish/<파일>
node tools/fish_cards.cjs --only <파일>
```

- `LOOKS`에 어종 id → 파일 이름(영어 통칭 · 소문자) · 비율(긴 몸 21:9) · 화풍 참고 3장(체형이 가까운 기존 원본) · 생김새를 적는다. 이웃 종과 다른 점을 쓴다(쥐치 ↔ 말쥐치).
- 모델은 몸 비율을 넙치 · 정어리 쪽으로 끌어간다 — 「몸 폭 ≤ 길이의 4분의 1」 같은 **숫자 비율**을 적어야 따른다(개서대 v4 · 눈퉁멸 v2).
- `--install`은 192셀로 **리샘플하지 않는다**(면적 평균은 윤곽을 흐린다) — 247부터 끝에 **격자 정규화**(`--grid 192` 기본 · 칸마다 최빈색 · 셀 6px)를 건다.
  화풍이 어긋난 기존 원본(사진 그대로 · 도트 굵음)은 `--redraw`(표 `REDRAW` — 원본을 함께 보내 같은 종 · 자세 · 무늬) → `--install --redraw --force`.
  원본을 보내면 굵은 도트를 베끼는 종(감성돔)은 생김새 설명만으로 새로 그린 판을 고른다. **그림자 걷기를 끈다**(은빛 배 가장자리를 지운다) ·
  JPEG 번짐(윤곽선 바깥 1px 회색 띠 · 계단 모서리 흰 삼각형)을 `peelFringe`로 걷는다. 검수는 어두운 바탕(0x1a1c22)에 가장자리 6배 확대.
- 투입 뒤: `FISH_IMAGE_FILES` · `FISH_TEXTURE`에 한 줄씩 → `fish_cards.cjs` → 위키 `python3.13 tools/gen_wiki_images.py` → `node tools/wiki_crop_img.cjs`(manifest 복원) → `gen_game_wiki_data.mjs --html`.

## ⑦ 갯것 · 땅지렁이 그림 — Gemini + 카드 방식 (248차)

해루질 생물(21종)과 생미끼 그림도 어종처럼 **원본은 `food assets/`, 게임은 굽는 것만** 싣는다.

```bash
NODE_USE_ENV_PROXY=1 node tools/gemini_forage_art.cjs --out <스테이징> --dry                 # 프롬프트만
NODE_USE_ENV_PROXY=1 node tools/gemini_forage_art.cjs --out <스테이징> [--view portrait|top|both] [--only id] [--tag v2 --force]
node tools/gemini_forage_art.cjs --out <스테이징> --install [--force]                        # 검수 뒤(고른 판은 태그 없는 이름으로)
node tools/forage_cards.cjs [--sheet <png>]                                                  # 카드 · 아이콘 · 판 · 점 그림
node tools/forage_cards.cjs --check                                                          # 표 ↔ 원본 ↔ 출력 대조
```

- 생김새 설명표 `LOOKS`(생물 id → 이름 · 학명 · 비율 · 화풍 참고 · `look` · 위에서 본 그림 `top`) — 화풍 참고는 **사용자가 그려 온 갯것 그림**(`food assets/forage/art/`).
  이웃 종과 다른 점(전복 ↔ 오분자기 · 낙지 ↔ 주꾸미 · 민꽃게 ↔ 꽃게 · 땅지렁이 ↔ 갯지렁이)을 설명에 적는다.
- 위에서 본 그림은 **모양이 바뀌는 것만**(소라 · 전복 · 낙지 · 보말 · 삿갓조개). 위에서 보면 읽히지 않는 것(거북손)은 초상을 쓴다.
- 설치: 초상 = 격자 정규화(192칸 · 셀 6px) → `food assets/forage/art/<id>.png` · 위에서 본 그림 = 긴 변 640px → `food assets/forage/top/<id>.png`.
- 굽기 출력: 카드 `public/forage/<파일>`(300×160 안) · 아이콘 `public/forage/icon/<파일>`(64px · 키 `<카드 키>__icon`) ·
  판 `public/forage-board/<id>.png`(44px · 머리 왼쪽 · 사용자 손질 5장 `KEEP_BOARD`는 건너뜀) · 점 `public/forage-dot/<id>.png`(24px · 필드 1배).
  판 · 점은 면적 평균 → 알파 0.45 끊기 → 채도 · 대비 조금 → **바깥 윤곽 1px**(작게 줄이면 원본 윤곽선이 녹는다).
- 표 = `packages/client-pc/src/data/ForageTextures.ts` `FORAGE_IMAGE_FILES`(새 생물 · 생미끼는 원본 + 한 줄). BootScene은 표 · `SHORE_CREATURE_DATABASE`를 돌며 싣는다.
- 위키 그림은 `gen_wiki_images.py`가 같은 표로 원본을 읽는다. ⚠ 시트를 만들 때 `grep -v top`으로 거르지 않는다 — 「octopus」에 「top」이 들어 있다.

## ⑧ 낚시 장비 그림 — 카드 방식 · 대체 그림 Gemini (249차)

장비 그림(대 · 릴 · 찌 · 봉돌 · 루어 · 미끼 갑 · 옷 · 가방 · 해루질 도구 · 통발)도 **원본은 `food assets/tackle/`, 게임은 굽는 것만** 싣는다.

```bash
NODE_USE_ENV_PROXY=1 node tools/gemini_tackle_art.cjs --out <스테이징> --dry                 # 프롬프트만
NODE_USE_ENV_PROXY=1 node tools/gemini_tackle_art.cjs --out <스테이징> [--group rod|reel|lure|line|bait|chum|tool|wear|bag|gather|trap|care] [--only 키] [--tag v2 --force]
node tools/gemini_tackle_art.cjs --out <스테이징> --install [--force]                        # 검수 뒤(고른 판은 태그 없는 이름 <키>.png로)
node tools/tackle_cards.cjs [--sheet <png>] [--only 파일]                                    # 카드(228×90 안) · 아이콘(64px)
node tools/tackle_cards.cjs --check                                                          # 표 ↔ 원본 ↔ 출력 대조
python3.13 tools/item_art/build.py --only __none__                                           # 표에 오른 art_* 코드 그림 빼기 · 매니페스트
```

- **표 하나**: `packages/client-pc/src/data/TackleTextures.ts` `TACKLE_IMAGE_FILES`(텍스처 키 → 파일). BootScene · 카드 굽기 · 위키 그림 · `build.py`가 함께 읽는다.
- **`art_*` 키**(코드로 그린 임시 그림이던 장비)는 키를 그대로 두고 그림만 바꾼다 — 표에 오르면 `build.py`가 drawn PNG를 지우고 id 연결만 남긴다.
- **대 · 릴 · 줄 그림 키는 손으로 적지 않는다** — `rodArtKey`(core `rodSpecFor().use`) · `reelArtKey` · `lineArtKey`. 옛 세이브는 `refreshTackleArtKey`가 빌려 쓰던 키일 때만 바꾼다.
- 생성 화풍 참고 = 사용자 장비 그림 3장(묶음 `REF_*`). 대는 참고처럼 **초릿대 끝 왼쪽 위 · 손잡이 오른쪽 아래 · 릴 없음**, 릴은 참고 스피닝릴과 같은 각도.
- 설치: 흰 배경 벗기기는 **떨어진 조각도 남긴다**(장갑 한 켤레 · 경단) · 윤곽선에 갇힌 순백 배경을 뺀다 · 그물 장비는 `mesh: true` · 격자 정규화(192칸 · 셀 6px).
  흰 물건(쿨러 · 목장갑 · 위판 상자)이 비지 않는지 **어두운 바탕 시트**로 본다(`montage -background '#2a3440'`).
- 굽기: 면적 평균 + **불투명도 보존**(대 · 바늘 선이 30px 칸에서 끊기지 않게) · 사용자 그림은 캔버스(작은 부속 여백) 그대로.
- 위키: `gen_wiki_images.py`가 같은 표로 원본을 읽는다. **아티팩트 한 판 파일 상한 511 · 한 번 발행 255** — `gen_game_wiki_data.mjs`가 8KB 이하 그림을
  HTML 안에 넣고(`tools/wiki_img/inlined.txt`) 파일로 둘 것만 `used.txt`에 적는다. 발행은 바뀐 · 새 그림만 올리고, 아티팩트에 있는데 `used.txt`에 없는 것은 `null`.

## ⑨ 장비 밖 아이템 그림 — Gemini · 합성 · 별칭 · 요리 사진 (255차)

코드로 그린 임시 그림(`art_*` — `tools/item_art/`) · 16px 손그림(`px:*`) · 그림이 없던 아이템(가구)을 249차 장비와 같은 카드 방식으로 바꾼다.

```bash
# 생김새 표 = 묶음마다 파일 하나: tools/item_looks/<묶음>.cjs (밑줄 파일은 표가 아니다 — _alias · _dishes)
NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/food.cjs --out <폴더> --jobs 3   # 생성(여러 사람이 동시에 돌리면 --group 말고 --looks)
node tools/gemini_item_art.cjs --looks tools/item_looks/food.cjs --out <폴더> --sheet <png>                # 검수 시트(12장씩)
node tools/gemini_item_art.cjs --looks tools/item_looks/food.cjs --out <폴더> --install --force           # → food assets/items/<파일>
node tools/seed_packets.cjs                     # 씨앗 = 빈 봉투 틀(Gemini 한 장) + 작물 초상 합성 → food assets/items/seed_*.png + item_looks/seeds.cjs
node tools/item_cards.cjs [--sheet <png>]       # 카드(228×90 안) · 64px 아이콘 → public/items/ + src/data/ItemImages.ts (한 사람만 · 마지막에 한 번)
python3.13 tools/item_art/build.py              # 이제 Gemini가 맡은 art_* 키를 굽지 않고 drawn/ PNG를 지운다
node tools/dish_photos.cjs --from <폴더>         # 불요리 완성 요리(레시피 하나에 한 장) → food assets/dishes/(셀 6px) · public/food/(셀 3px · 긴 변 192칸) · food/icon/ 64px
```

- **키 규칙**: 옛 코드 그림 키(`art_*`)는 **같은 키**로 그림만 바꾼다(세이브 · 카탈로그 `iconTexture`를 안 고친다). 16px 키는 새 키 `item_<x>` + `px: ['px:it_x']`,
  가구처럼 텍스처 키가 필드 그림인 것은 `ids: ['furn_x']`. 고르는 순서는 `ui/ItemIcon.ts` — 작물 초상(별칭 포함) → `itemImageKeyOf`(id → 16px 키 → 같은 음식 별칭) → 코드 그림 → 원래 키.
- **별칭부터 본다**(`tools/item_looks/_alias.cjs`) — 이미 있는 그림이 같은 물건이면 새로 그리지 않는다. 상점 채소 재료 → 작물 초상(`CROP_PORTRAIT`),
  상점 매운탕 · 전복죽 · 장어구이 · 예전 요리의 `px:it_dish_<계열>` → 레시피 사진(`TEXTURE`). 가리키는 그림이 없으면 `item_cards`가 별칭을 싣지 않는다(코드 그림이 남는다).
- **한 켤레는 `pair: true`** — 「두 짝이 겹쳐 한 덩어리」 문구는 손가락 엉킨 장갑 · 세 짝 신발을 낳았다(255차 사용자 지적 — 기모 장갑 · 갯바위 단화). 「왼쪽 한 짝 + 오른쪽 한 짝, 정확히 두 짝」.
- 흰 물건(소금 · 붕대 · 흰 접시 · 병 · 라벨 · 조명 띠)은 `keepWhite: true` — 고리 손잡이 · 바퀴살 · 격자처럼 속이 비치는 틈이 있으면 끈다.
  뚫린 그물은 `mesh: true` — 단 **반짝이는 철사 격자(석쇠)에는 쓰지 않는다**(은색 반짝임까지 구멍으로 먹는다). 설치 뒤 **어두운 바탕 시트**로 구멍 · 흰 테를 본다.
- 갇힌 배경 섬 빼기는 **그림 면적 3%까지** — 그보다 큰 틈(울타리 가로대 사이 4.2% · 전정가위 손잡이 사이 4.6%)은 흰 채로 남는다.
  원본의 그 틈만 같은 판정으로 투명하게 만들어 다시 설치한다(다시 생성하면 같은 틈이 또 생긴다).
- 요리 사진은 매운탕 두 장(셀 3px · 505~565px)과 같은 규격 · 국물 요리는 같은 검은 양수 냄비. 배선 = `FireRecipeDatabase.photoKey` + `BootScene` 한 줄.
- **크레딧**: 2026-10-16 선불 크레딧 소진(HTTP 402) — 결제 문제라 우회하지 않는다. 남은 코드 그림 7은 `tools/item_looks/misc.cjs`에 표만 있다.
- **어두운 칸에 묻히는 물건은 `outline: true`**(256 — 새 그물 · 육묘 트레이) — `item_cards.cjs`가 바깥 윤곽에 흰 테(`tools/outline.cjs`)를 두른다.
  두께는 화면에서 1px: 카드 1px · 64px 아이콘 2px(가방 칸 30px로 줄여 그린다). 그물코 안에는 두르지 않는다(닫힘 r 2). 원본 · 위키 그림은 그대로다.
  후보는 칸 바탕(#0e1d2e)과 색 거리 60 미만인 물건 픽셀 비율로 찾는다(0.9 넘으면 묻힌다).
  **장비 그림은 `tools/tackle_cards.cjs`의 `OUTLINED` 집합**(259 — 게 통발 둘 · 어류 그물 통발 · 필드백 · 감성돔 바늘 · 뜰채 · 장어 통발 둘 = 8장).
  새로 넣고 `--only <파일>`로 다시 굽는다(`git status`로 그 파일 카드 · 아이콘 둘씩만 바뀌었는지 본다).
  ⚠ 20px 안팎 칸에서는 2px 테가 점선이 된다(NEAREST 축소) — 그런 칸은 24px 이상으로 그리거나, 작은 칸 전용 아이콘을 따로 굽는다.
- 씨앗 봉투 창은 그림의 25%라 `cutoutMulti`의 갇힌 흰 섬 제거(3% 미만)에 안 걸린다 — `seed_packets.cjs`가 「가장 큰 불투명 순백 덩어리」로 창을 따로 찾는다.
  띠 색은 작물 갈래(잎 · 열매 · 뿌리 · 곡물 · 콩 · 향채 · 나물 · 싹)마다 색상만 돌린다(틀 초록이 짙어 밝기를 조금 올린다).
- 위키: `dump_wiki_items.mjs`가 게임과 같은 순서로 `imgKey`를 적고, `gen_wiki_images.py`가 `ITEM_IMAGE_FILES`(원본) · `public/food/*.png`를 읽는다.

## ⑧ 그림 얼굴 초상 — 인물 · 주인공 판 · 얼굴형 판 · 입 모양은 코드 (268 · 269차)

대화창 · 혼잣말 · 일지 초상은 Gemini 흉상(192×192 · 셀 2px)이 먼저다(`ui/FacePhoto.ts`). 원본은 저장소에 두지 않고 `public/faces/<키>.png`가 정본이다.

```bash
NODE_USE_ENV_PROXY=1 node tools/gemini_face_art.cjs --out <폴더> --set cast|player [--only okseon] --ref <화풍 앵커 png>   # 인물 42 · 주인공 24(계란형 · 다문 입)
NODE_USE_ENV_PROXY=1 node tools/gemini_face_art.cjs --out <폴더> --set player --shapes round,square --ref <앵커>       # 269 — 얼굴형 판 48(기본 판을 같은 인물 앵커로)
node tools/gemini_face_art.cjs --out <폴더> --sheet <png>          # 12장씩 검수 시트
node tools/gemini_face_art.cjs --out <폴더> --install [--force]     # 배경 벗기기 → 정사각(어깨 바닥) → 96칸 → public/faces + data/FacePortraits.ts(+ 인물은 tools/wiki_img)
```

- **화풍 · 밀도 앵커 한 장은 필수**(268) — 앵커 없이는 128칸급 · 32칸급 밀도가 섞인다. 앵커가 없으면 `public/faces` 두 장을 자동으로 붙인다.
- **얼굴형 판은 기본 판을 같은 인물 앵커로** 붙인다(`--shapes` — `_refs/base_<키>.png` 3배) — 같은 사람 · 머리 · 배색을 두고 턱선 · 볼만 바뀐다(시범 4장 실측 — 차이는 작지만 일관).
  키 = `<기본 키>_<round|square>` · `FacePhoto.playerBaseKey`가 얼굴형 판을 먼저 찾고 없으면 계란형 판으로 돌아간다.
- **입 모양 4 · 볼 홍조는 그림이 아니라 코드**(269 — 216장 ≈ 1만 3천 원이라) — `findMouth`(입술 선 성분 + 분홍 입술살) → `applyMouth`(웃는 입 = 입꼬리 1~2px ↑ · 작은 입 = 0.72배 · 벌린 입 = 2px 틈) ·
  `applyBlush`(입 상자 기준 좌우 위 타원). 치환 전에 기준 피부 위에서 한다. 틀(96칸 · 어깨 바닥)을 바꾸면 `MOUTH_WIN` · 흰자 행을 다시 잰다(scratchpad `face_mouth_proto.cjs` · `face_lip_colors.cjs` 패턴).
- 값(269 실측 · 공식 단가): 한 장 ≈ $0.043~0.047(입력 2.7~4.1K 토큰 · 출력 1.8~1.9K — 이미지 1,120 + 글 · 생각) — 얼굴 66장 ≈ 4,400원 · 얼굴형 48장 ≈ 3,100원 · 아이템 7장 ≈ 440원.
