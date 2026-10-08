# 학습 노트 — 4 디자인·미디어

> 이 도메인에 대해 **지금 사실인 것**만 적는다(누적 금지 · 갱신). 추정은 "추정"이라고 쓴다.
> 400줄을 넘기지 않는다. 날짜별 경과는 `reports/`에 있다.

## 구조

- 소비 그림 731개는 전부 `packages/client-pc/public/`에 있고 로드 경로는 셋이다.
  1. `BootScene.loadAssets`의 직접 경로와 작은 반복문(키 201개)
  2. `data/TilesetManifest.ts`가 조립한 목록을 `RegionFieldScene`이 일괄 로드(키 `ts_<폴더>_<파일명>`)
  3. `index.html` 파비콘(`ui/app_icon.png`)
- 폴더별 로드 방식

| 폴더 | 개수 · 용량 | 로드 방식 | 비고 |
|---|---|---|---|
| `fish/` | 53 · 38.2 MB | 직접 53줄 — 키 `fish_<어종id>`, 매핑 `data/FishTextures.ts` | 1 MB 초과 13개 |
| `trimmings/` | 45 · 27.1 MB | 직접 — 소비는 `trim_head_${fam}` 같은 조립 키 | 구세이브 호환 키 2개 유지 |
| `item-icons/` | 53 · 18.8 MB | `ITEM_ICON_ASSETS` 맵 반복 | 1254×1254 30개 · 로드 안 됨 1개 |
| `guide/help/` | 96 · 17.75 MB | `HELP_IMAGE_KEYS` 48 × (한국어 + `_en`) 반복 | 전부 688×387 |
| `guide/*.png` | 22 · 0.42 MB | `GUIDES[].pages[].textureKey` 반복 | |
| `pixelazed/` | 11 · 0.36 MB | 슬러그 반복(`zoom_${slug}`) | 전부 256×256 |
| `characters/` | 24 · 1.4 MB | 직접 24줄 | man 12 = dev 레거시만 · girl 12 = 사용처 0 |
| `tileset/{kn,td,ttp,coast,jodo}/` | 382 | 매니페스트 조립 | 파일과 목록 완전 일치 |
| `tileset/gem/` | 19 | 매니페스트 14 | `npc_*.png` 5개 로드 안 됨 |

- 아이템 아이콘 해소 순서(`ui/ItemIcon.ts`): 래스터 별칭 → `iconTexture` 텍스처 → `px:<키>` 픽셀 아이콘 → `speciesId` 폴백 → `icon` 문자열을 글자로.
- `PixelIconArt.ts`는 자동 생성 데이터다(고칠 곳은 `tools/gen_pixel_icons.py`).
  아이콘 109개 = 16×16 86 · 10×10 17 · 24×24 5 · 12×12 1. 행 길이 · 행 수 · 팔레트 문자 불일치는 0건이다.
- `ui/PixelIcon.ts`는 정수 배율로 캔버스 텍스처를 굽는다(키 `pxi_<키>_<배율>`).
  `addPixelIcon`은 24×24 아이콘을 12px로 그리는 식이면 비정수 축소가 된다.
- `packages/core/src/art/` 5개 파일은 RGBA 버퍼 · 표 · 해시만 만든다(Phaser · DOM · 캔버스 0건).
  캐릭터 셀 32×32 × 정수 2배 = 몸 52px. 초상은 별도 32×32 격자. NPC 외형은 `CAST_TRAITS`(41명) + id 해시 + `CAST_OVERRIDE`.
- 프로덕션 캐릭터는 `CharacterArt` 절차 도트다. `man-*` · `girl-*` PNG는 옛 캐릭터다.
- 새 게임 지급품은 없다(188차). `createSeedItems()`는 구세이브 백필 · dev용이라,
  이모지 폴백이 플레이어에게 보이는 주 경로는 `ShopCatalog` 판매품이다.

## 규칙과 함정

- **`no-ui-emoji` 303건의 실체**: 프로덕션에서 보이는 것은 `GuidePanel.ts`의 1건과 이모지 폴백 정의 87건(`iconTexture` 없음)이다.
  나머지는 dev 전용 레거시 씬 133 · 미사용 파일 26 · 텍스처가 있는 폴백 44 · 오탐 12.
- 추적 지표: **`icon` 이모지 + `iconTexture` 없음 = 87건**(ShopCatalog 43 · InventoryStore 43 · TrapFieldSystem 1).
  **`icon: ''` + 텍스처 없음(빈 칸) = 6건.**
- 규칙 정규식이 U+2600~27BF · U+2B50 · U+231A를 안 봐서 ★ ✓ ☀ ☁ ☂ ❄ ⛅ ⌚ ♪ 약 40줄이 빠진다.
  그중 프로덕션은 HUD 날씨 배지와 장식 글리프 목록(원장 참조)이다. 정규식 보강은 두 번째로 확인되면 올린다(`✕`는 예외).
- `no-screen-edge-anchor` 5건은 **고정 오탐**이다. `HomeDecorMode`는 방 액자가 기준이고 `columnGap`으로 걸러지며,
  `RegionHud` 3건은 HUD 자신의 잠깐 뜨는 알림이다. 규칙의 대상은 상시 단추 · 트레이 · 범례다.
- `assertClear`는 겹침을 막지 않고 dev 콘솔에 경고만 낸다. 피하는 일은 `columnGap`이 한다.
- `icon` 필드는 `iconTexture`가 있어도 지우면 안 되는 곳이 있다(구세이브 폴백).
- `i18n/I18n.ts`의 `GLYPH_PREFIX`가 「글리프 + 공백」 접두를 떼고 본문만 번역한다.
  문구 앞 이모지를 말머리로 바꾸면 영어 번역 경로가 달라지고, 접두를 아예 빼면 사전 정확 일치로 간다.
- 지표 `possibly_unreferenced` 194개는 거의 전부 조립 키 오탐이다(`${key}_en` · 매니페스트). 로드 코드가 없는 것은 6개뿐이다.
- 구세이브 호환으로만 남긴 텍스처가 있다(`trim_fillet_engw_halibut_1/2`). 「안 쓰는 키」로 보고 지우면 구세이브 아이콘이 깨진다.
- R1(내부 용어 노출)은 주석 아닌 줄 0건. R11 정확 패턴(`우클릭:` · `드래그:`)의 프로덕션 창 문구는 0건이다(도움말 라이브러리는 허용).
- 규격 편차: 어종 그림 가로 511~2172px(중앙값 1259). 1 MB 넘는 소비 에셋은 22개 · 27.3 MB.
- 실렌더가 필요한 판단(색 글리프 여부 · 빈 칸 · 아이콘 축소 뭉개짐 · 상투 잘림)은 예약 실행에서 확인하지 못한다.
- 아이콘 재사용 후보(새 그림 없이): `inv_cap → px:eq_hat` · `inv_glasses → px:eq_glasses` · `inv_top → px:eq_shirt` ·
  `inv_gloves → px:it_gloves` · `inv_watch → px:eq_watch` · `inv_pants → px:eq_pants` · `inv_shoes → px:eq_shoes` ·
  `inv_bandage → px:it_bandage` · `inv_potion`/`inv_seasick → px:it_medicine` · `inv_veges → px:it_veg`.
  새 16×16이 필요한 것: 칼 · 헤드랜턴 · 증서 · 날씨 9종.
- 백로그의 「에셋 대기」 항목과 실제 파일 유무 대조는 아직 하지 않았다.

## 닫힌 수정안에서 배운 것

- (없음)
