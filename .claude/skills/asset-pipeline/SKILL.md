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
- 절차: 교체 전에 `BootScene.ts`에서 **해당 `load.image` 줄을 grep**해 경로를 확인하고, 그 파일을 덮어쓴다.
- gh-pages는 **대소문자를 구분**한다. 새 파일은 **소문자로 통일**하고,
  기존 대문자 파일을 정리하면 `BootScene` 경로도 같이 고친다.

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

어종(`public/fish/`)은 셀 6px · 가로 약 192셀 · 8비트 RGBA · 팔레트 양자화 없음(실측 `node tools/check_art_quality.cjs packages/client-pc/public/fish`).
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
- **중간 수확물 · 팩은 `--set extra` · `--set pack`**(245 — 14장). 팩은 용기가 그림의 일부라 도구가 `kind: 'pack'`이면 조건 문구를 바꾼다
  (「포장한 한 팩 · 비스듬히 위에서 · 라벨 · 가격표 · 글자 없음」). 일반 조건(「한 단위만 · 바구니 없음」)으로 부르면 용기를 빼고 그린다.
- **잎 · 줄기 사이에 갇힌 흰 배경**(245)은 테두리 BFS가 못 닿아 어두운 창에서 흰 점이 된다 — `pixelize_crops.cjs`의 `holes`(기본 180)가
  둘레가 어두운 흰 섬만 뺀다(흰 작물 하이라이트는 둘레가 밝아 남는다). 초상을 다시 구우면 전부에 걸리므로 `git diff --stat`으로 바뀐 수를 본다(245 = 71장).
- 초상을 다시 구운 뒤 위키: `python3.13 tools/gen_wiki_images.py`(Pillow는 3.13에만 있다) → `node tools/wiki_crop_img.cjs` → `node tools/dump_wiki_items.mjs`(새 아이템이 있으면)
  → `node tools/gen_game_wiki_data.mjs --html`. 아티팩트에는 바뀐 그림만 `files`로 올린다(245 = 105장).
