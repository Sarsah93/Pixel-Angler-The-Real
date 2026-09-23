/**
 * @file BootScene.ts
 * @description 부트 씬 — 에셋 프리로드 및 로딩 화면
 *
 * 게임 시작 시 가장 먼저 실행되는 씬.
 * 모든 에셋을 로드하고 MainMenuScene으로 이동합니다.
 */

import Phaser from 'phaser';
import { GUIDES } from '../data/GuideContent.js';
import { HELP_IMAGE_KEYS } from '../data/HelpContent.js';
import { SASHIMI_GUIDE_TEXTURE, registerSashimiGuideFrames } from '../data/SashimiGuideFrames.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingScreen();
    this.loadAssets();
  }

  create(): void {
    // 삼면뜨기 픽셀 가이드 시트 → 47컷 그리드 프레임 등록 (지오메트리 = core 단일 소스)
    registerSashimiGuideFrames(this);
    this.scene.start('MainMenuScene');
  }

  private createLoadingScreen(): void {
    const { width, height } = this.cameras.main;

    // 배경
    this.add.rectangle(0, 0, width, height, 0x0a0e14).setOrigin(0, 0);

    // 로딩 바 배경
    const barBg = this.add.rectangle(width / 2, height / 2, 400, 8, 0x1a2535).setOrigin(0.5);
    // 로딩 바 (실제 진행)
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 8, 0x4af2a1).setOrigin(0, 0.5);

    // 타이틀 텍스트
    this.add
      .text(width / 2, height / 2 - 60, 'THE REAL ANGLER', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '24px',
        color: '#e8f4fd',
        shadow: { offsetX: 3, offsetY: 3, color: '#001a33', blur: 0, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 28, '더 리얼 앵글러', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#5a8fab',
      })
      .setOrigin(0.5);

    const loadingText = this.add
      .text(width / 2, height / 2 + 30, '채비 중...', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#5a8fab',
      })
      .setOrigin(0.5);

    void barBg;

    // 로딩 진행률 업데이트
    this.load.on('progress', (value: number) => {
      bar.width = 400 * value;
    });

    this.load.on('fileprogress', (file: { key: string }) => {
      loadingText.setText(`로딩 중: ${file.key}`);
    });

    this.load.on('complete', () => {
      loadingText.setText('출조 준비 완료!');
    });
  }

  private loadAssets(): void {
    // ─── 폰트 로드 (Google Fonts — 온라인 환경)
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+KR:wght@400;700&display=swap';
    document.head.appendChild(fontLink);

    // ─── 월드맵 픽셀 배경 이미지 ───
    // webglmap_pixelazed.png: VWorld 위성 이미지를 픽셀화 처리한 대한민국 지도
    this.load.image('korea_pixel_map', 'webglmap_pixelazed.png');

    // ─── 지역 상세 픽셀 지도 (줌인 진입용) ───
    // pixelazed/{slug}_2_pixelazed.png → 텍스처 키 zoom_{slug}
    // WORLD_NODE_DATABASE.mapSlug 와 매핑됨. 아직 준비되지 않은 지역(예: taean)은
    // 파일이 없어 loaderror가 발생하지만, WorldMapScene에서 존재 여부를 확인해 안전 처리.
    const REGION_MAP_SLUGS = [
      'sokcho', 'incheon', 'taean', 'pohang', 'ulsan',
      'busan', 'geoje', 'yeosu', 'jeju', 'ulleung', 'dokdo',
    ];
    REGION_MAP_SLUGS.forEach((slug) => {
      this.load.image(`zoom_${slug}`, `pixelazed/${slug}_2_pixelazed.png`);
    });

    // 준비되지 않은 지역 지도(404) 로드 실패는 치명적이지 않으므로 조용히 로그만 남김
    this.load.on('loaderror', (file: { key: string }) => {
      if (file.key.startsWith('zoom_')) {
        console.warn(`[BootScene] 지역 지도 미준비: ${file.key} (해당 지역은 '준비중'으로 표시됨)`);
      }
    });

    // ─── 통합 가이드 허브 삽화 19장 (game_guide_hub.html SVG → PNG 640×300) ───
    // 파이트 5 · 회수 4 · 밑밥 5 · 회뜨기 5 — 텍스처 키/문구는 data/GuideContent.ts
    const guideKeys = new Set<string>();   // 같은 삽화를 여러 페이지가 공유(116차 bite 카테고리) — 중복 로드 방지
    for (const cat of GUIDES) {
      for (const pg of cat.pages) {
        if (guideKeys.has(pg.textureKey)) continue;
        guideKeys.add(pg.textureKey);
        this.load.image(pg.textureKey, `guide/${pg.textureKey}.png`);
        // 영어판 삽화 — 현재 guide_fight_6만 존재(나머지 목업 SVG는 한국어판 유지)
        if (pg.textureKey === 'guide_fight_6') this.load.image(`${pg.textureKey}_en`, `guide/${pg.textureKey}_en.png`);
      }
    }

    // ─── 도움말 라이브러리 실캡처 (116차 — tools/capture_help_images.cjs 산출, 주석 오버레이 포함) ───
    for (const key of HELP_IMAGE_KEYS) this.load.image(key, `guide/help/${key}.png`);
    // 영어 로케일용 주석판 — 파일이 없으면 로드 실패로 끝나고(404 무해)
    // 패널은 textures.exists로 한국어판에 폴백한다 (119차 ⑥)
    for (const key of HELP_IMAGE_KEYS) this.load.image(`${key}_en`, `guide/help/${key}_en.png`);

    // ─── 삼면뜨기 픽셀 가이드 시트 (선행 9컷 + 본편 38컷, 2024×2154 단일 시트) ───
    // 개별 컷은 자르지 않고 create()에서 그리드 프레임으로 등록 (SashimiGuideFrames)
    this.load.image(SASHIMI_GUIDE_TEXTURE, 'guide/sashimi_pixel_guide.png');

    // ─── 음식/생선 아이템 이미지 에셋 ───
    // food/: 아이템 아이콘 (인벤토리/상점 소켓용, 64x64 도트)
    // fish/: 어획 연출용 실사 픽셀화 생선 이미지 (낚시 성공 팝업/상세보기)
    this.load.image('food_assorted_sashimi', 'food/assorted_sashimi.png');
    // 불요리 완성 요리 실사 — 서더리(stew_red)와 통생선(stew_red_whole)은 재료 구성이 달라 그림도 다르다(170차)
    this.load.image('food_stew_red', 'food/stew_red.png');                   // 서더리 매운탕
    this.load.image('food_stew_red_whole', 'food/stew_red_whole.png');       // 통생선 매운탕

    // ─── 과증식 해양생물 실사 4종 (170차) ───
    // 필드 렌더는 core `NuisanceArt` 절차 도트가 담당하고, 이 실사는 상세보기·도감용이다.
    this.load.image('nuisance_moon_jelly', 'nuisance/moon_jelly.png');       // 보름달물해파리
    this.load.image('nuisance_nomura_jelly', 'nuisance/nomura_jelly.png');   // 노무라입깃해파리
    this.load.image('nuisance_blue_bat_star', 'nuisance/blue_bat_star.png'); // 별불가사리
    this.load.image('nuisance_amur_star', 'nuisance/amur_star.png');         // 아무르불가사리

    // ─── 어종 외 아이템·해루질 자원 투명 도트 아이콘 ───
    // 인벤토리 슬롯과 상세보기에서 같은 키를 공유한다. 누락 시 기존 px/절차 아이콘으로 폴백.
    const ITEM_ICON_ASSETS: Record<string, string> = {
      // v2: 베이트로드와 같은 방향·해상도, 릴이 제거된 순수 스피닝로드
      item_spinning_rod: 'item-icons/it_spinning_rod_v2.png',
      item_bait_rod: 'item-icons/it_bait_rod.png',
      item_spinning_reel: 'item-icons/it_spinning_reel.png',
      item_bait_reel: 'item-icons/it_bait_reel.png',
      item_jighead: 'item-icons/it_jighead.png',
      item_worm: 'item-icons/it_worm.png',
      item_soft_worm: 'item-icons/it_soft_worm.png',
      item_treble: 'item-icons/it_treble_hook.png',
      // 167차 — 사용자 제공 도트: 혼무시(생미끼) · 감성돔 바늘(단일 바늘).
      item_honmushi: 'item-icons/it_honmushi.png',
      item_hook_chinu: 'item-icons/it_hook_chinu.png',
      item_minnow: 'item-icons/it_minnow.png',
      item_metal_jig: 'item-icons/it_metal_jig.png',
      line_spool_saiso: 'item-icons/line_spool_saiso.png',
      sinker_ring: 'item-icons/sinker_ring.png',
      sinker_pillar: 'item-icons/sinker_pillar.png',
      sinker_bundle: 'item-icons/it_sinker_bundle_v2.png',
      // 166차 — 제로찌 전용 도트(몸통에 '00' 각인). 런타임 호수 라벨은 붙이지 않는다(ItemIcon labelKeys 제외).
      float_zero: 'item-icons/it_float_zero_v2.png',
      float_hole: 'item-icons/it_float_hole_v2.png',
      float_tilt: 'item-icons/it_float_tilt_v2.png',
      subfloat_light: 'item-icons/it_subfloat_light_v2.png',
      subfloat_heavy: 'item-icons/it_subfloat_heavy_v2.png',
      splitshot: 'item-icons/it_splitshot_v2.png',
      swivel: 'item-icons/it_swivel_v2.png',
      cushion_bell: 'item-icons/it_cushion_bell_v2.png',
      cushion_round: 'item-icons/it_cushion_round_v2.png',
      bead_halfmoon: 'item-icons/it_bead_halfmoon_v2.png',
      forage_haliotis_diversicolor: 'item-icons/forage_haliotis_diversicolor.png',
      forage_heliocidaris_crassispina: 'item-icons/forage_heliocidaris_crassispina.png',
      forage_aplysia_kurodai: 'item-icons/forage_aplysia_kurodai.png',
      forage_hemigrapsus_sanguineus: 'item-icons/forage_hemigrapsus_sanguineus.png',
      forage_portunus_trituberculatus: 'item-icons/forage_portunus_trituberculatus.png',
    };
    for (const [key, path] of Object.entries(ITEM_ICON_ASSETS)) this.load.image(key, path);
    // 회썰기(사시미) 미니게임 — 필렛 2뷰 (tools/gen_sashimi_fillet.cjs 생성, 원본 실사 리매핑)
    //  탑뷰 = 일반 회뜨기(위에서 본 필렛) / 측면 = 고급 회뜨기(완만한 슬랩)
    this.load.image('sashimi_fillet_top_bream', 'sashimi/fillet_top_bream.png');
    this.load.image('sashimi_fillet_top_amberjack', 'sashimi/fillet_top_amberjack.png');
    this.load.image('sashimi_fillet_top_halibut', 'sashimi/fillet_top_halibut.png');
    this.load.image('sashimi_fillet_side_bream', 'sashimi/fillet_side_bream.png');
    this.load.image('sashimi_fillet_side_amberjack', 'sashimi/fillet_side_amberjack.png');
    this.load.image('sashimi_fillet_side_halibut', 'sashimi/fillet_side_halibut.png');
    // 회 조각 아이콘 — 탑뷰 살코기 한 점 슬라이스 (인벤 아이콘 + 도마 조각 스테이징)
    this.load.image('sashimi_piece_bream', 'sashimi/piece_bream.png');
    this.load.image('sashimi_piece_amberjack', 'sashimi/piece_amberjack.png');
    this.load.image('sashimi_piece_halibut', 'sashimi/piece_halibut.png');
    // 메인 메뉴 타이틀 로고 (투명 배경 PNG — 구 텍스트 2단 로고 대체)
    this.load.image('title_logo', 'ui/title_logo.png');
    // trimmings/: 손질 부산물 아이콘 (회뜨기 산출 — 머리/중골/내장/껍질/필렛).
    // 머리는 감성돔 기준 원본 → 타 돔류는 런타임 색 변형(참돔 붉게·돌돔 아가미 줄무늬 등, ButcheryPanel.trimHeadKey).
    // 손질 부산물(trimmings) — 어종군(돔류/방어류) 분리 + 공통 3종 (2026-07-30 사용자 매핑):
    //  머리/척추뼈/갈빗대/순수 필렛 = 돔류(bream)·방어류(amberjack) 별도 에셋,
    //  껍질/내장/지아이뼈 = 물고기류 공통. 필렛 중간 산출물 2종(갈빗대 유/무)은 공통 에셋
    //  + 어종명 접두 아이템명("껍질과 갈빗대가 붙어있는 잿방어 필렛").
    this.load.image('trim_head_bream', 'trimmings/head_black_sea_bream.png');
    this.load.image('trim_head_amberjack', 'trimmings/head_amberjack.png');
    this.load.image('trim_spine_bream', 'trimmings/rests_main_spine_bream.png');
    this.load.image('trim_spine_amberjack', 'trimmings/rests_main_spine_amberjack.png');
    this.load.image('trim_rib_bream', 'trimmings/rib_bone_bream.png');
    this.load.image('trim_rib_amberjack', 'trimmings/rib_bone_amberjack.png');
    this.load.image('trim_fillet_bream', 'trimmings/pure_pillet_bream.png');
    this.load.image('trim_fillet_amberjack', 'trimmings/pure_pillet_amberjack.png');
    this.load.image('trim_fillet_ribs', 'trimmings/skinned_pillet_with_ribs.png');
    this.load.image('trim_fillet_skin', 'trimmings/skinned_pillet_without_ribs.png');
    // 지아이뼈 분리 후 나오는 '껍질이 붙어있는 순살 필렛' — 어종군 분리 (사용자 지시 2026-07-31)
    this.load.image('trim_fillet_skinonly_bream', 'trimmings/skinned_pillet_bream.png');
    this.load.image('trim_fillet_skinonly_amberjack', 'trimmings/skinned_pillet_amberjack.png');
    this.load.image('trim_pin', 'trimmings/pin_bone.png');
    this.load.image('trim_guts', 'trimmings/pile_of_fish_guts.png');
    this.load.image('trim_skin', 'trimmings/fish_skin.png');
    // ── 넙치류(광어) 다섯장뜨기 부산물 (2026-08-05 — 사용자 에셋 12종 중 9종 사용) ──
    //  ⚠ 소스 파일명 오탈자 rib_bone_hailbut → 복사 시 rib_bone_halibut로 정정 /
    //    'inventory icon' 공백 파일명 → engawa_halibut_icon으로 정정.
    this.load.image('trim_head_halibut', 'trimmings/head_halibut.png');
    this.load.image('trim_spine_halibut', 'trimmings/main_spine_bone_halibut.png');
    this.load.image('trim_rib_halibut', 'trimmings/rib_bone_halibut.png');   // 예비 (현 트리 미사용)
    //  껍질+엔가와 필렛 = **반쪽 단위 에셋** (2026-08-07 사용자 교체 — 구 _1/_2는 등·배 포 2장이
    //  한 덩어리로 붙은 3면뜨기용 이미지라 다섯장뜨기 결과물과 어긋났다):
    //  upper = 내장이 **없는** 쪽 반 필렛 / under = **내장쪽** 반 필렛 (사용자 확정 명명).
    this.load.image('trim_fillet_engw_halibut_upper', 'trimmings/skinned_upper_pillet_halibut.png');
    this.load.image('trim_fillet_engw_halibut_under', 'trimmings/skinned_under_pillet_halibut.png');
    //  구 키 2종은 **구세이브 아이콘 호환**으로만 유지 (기지급 아이템의 iconTexture 문자열이 세이브에 남음)
    this.load.image('trim_fillet_engw_halibut_1', 'trimmings/skinned_pillet_with_ribs_halibut_1.png');
    this.load.image('trim_fillet_engw_halibut_2', 'trimmings/skinned_pillet_with_ribs_halibut_2.png');
    this.load.image('trim_fillet_skinonly_halibut', 'trimmings/skinned_pillet_without_engawa_halibut.png');
    this.load.image('trim_engawa_skin', 'trimmings/skinned_engawa_halibut.png');   // 껍질 붙은 엔가와
    this.load.image('trim_engawa', 'trimmings/engawa_halibut.png');                // 순수 엔가와 (스트립)
    this.load.image('trim_engawa_icon', 'trimmings/engawa_halibut_icon.png');      // 순수 엔가와 인벤 아이콘
    // 손질 연출 — 사시미칼(야나기바) 픽셀 스프라이트 (포 뜨기 칼 팔로우 연출.
    //  ref5 실사 비례를 따라 자체 제작 — 규약: 가로·칼끝 오른쪽·칼날 아래쪽. 84차)
    this.load.image('butchery_knife', 'butchery/knife_sashimi.png');
    this.load.image('fish_black_sea_bream', 'fish/black_sea_bream.png');
    // ── 두족류 부산물 (2026-08-05 — food assets/trimmings/{squid,octopus}) ──
    //  squid 폴더: 이름에 어종이 없으면 오징어류 3종 공용 / '무늬오징어, 한치' = 갑오징어 제외 /
    //  '갑오징어' = 갑오징어 전용. 한글 파일명은 복사 시 ASCII 키명으로 정규화했다.
    this.load.image('trim_ceph_mantle_squid', 'trimmings/ceph_mantle_squid.png');           // 무늬오징어·한치 몸통살
    this.load.image('trim_ceph_mantle_cuttlefish', 'trimmings/ceph_mantle_cuttlefish.png'); // 갑오징어 몸통살
    this.load.image('trim_ceph_fin', 'trimmings/ceph_fin_squid.png');                       // 무늬오징어·한치 날개
    this.load.image('trim_ceph_pen', 'trimmings/ceph_pen.png');                             // 무늬오징어 연골
    this.load.image('trim_ceph_cuttlebone', 'trimmings/ceph_cuttlebone.png');               // 갑오징어 갑(뼈)
    this.load.image('trim_ceph_mantle_skin', 'trimmings/ceph_mantle_skin.png');             // 껍질 붙은 몸통 (박피 전)
    this.load.image('trim_ceph_arms', 'trimmings/ceph_arms.png');                           // 다리 (촉완 포함 — 분리 전)
    this.load.image('trim_ceph_arms_only', 'trimmings/ceph_arms_only.png');                 // 촉완 제거된 다리부
    this.load.image('trim_ceph_tentacle', 'trimmings/ceph_tentacle.png');                   // 촉완 2가닥
    this.load.image('trim_ceph_head', 'trimmings/ceph_head.png');                           // 머리 (공용)
    this.load.image('trim_ceph_beak', 'trimmings/ceph_beak.png');                           // 입 (공용)
    this.load.image('trim_ceph_viscera', 'trimmings/ceph_viscera.png');                     // 내장 주변부 (공용)
    this.load.image('trim_ceph_head_mass', 'trimmings/ceph_head_mass.png');                 // 촉완 붙은 다리부+머리부 (분할 전 덩어리)
    this.load.image('trim_octo_whole', 'trimmings/octo_whole.png');                         // 손질된 문어 (098차 — 손질 완료 실사 도트)
    this.load.image('trim_octo_viscera', 'trimmings/octo_viscera.png');                     // 문어 내장
    this.load.image('trim_octo_beak', 'trimmings/octo_beak.png');                           // 문어 입(악판)
    // ── 삶은 문어 계열 (098차 — gen_octo_assets.cjs 생성. 불요리 산출 → 다리 분리 → 숙회) ──
    this.load.image('trim_octo_boiled', 'trimmings/octo_boiled.png');                       // 삶은 문어 (통) — 아이콘·도마
    this.load.image('trim_octo_boiled_head', 'trimmings/octo_boiled_head.png');             // 삶은 문어 머리
    this.load.image('trim_octo_boiled_leg', 'trimmings/octo_boiled_leg.png');               // 삶은 문어 다리 — 아이콘·회뜨기 도마
    this.load.image('sashimi_piece_octopus', 'sashimi/piece_octopus.png');                  // 문어 숙회 한 점 (접시 조각)

    this.load.image('fish_halibut', 'fish/halibut.png');
    this.load.image('fish_largescale_blackfish', 'fish/large_scale_blackfish.png');   // 벵에돔
    this.load.image('fish_longtail_blackfish', 'fish/small_scale_blackfish.png');     // 긴꼬리벵에돔

    // 어종별 실사 픽셀 생선 이미지 (2026-07-22 추가 — food assets/).
    // 텍스처 키는 어종 ID(오라클/FISH_DATABASE 표준) 기준 — 파일명(영문 통칭)과 분리해
    // 매핑은 FISH_TEXTURE(FirstPersonFishingScene)에서 일원화한다.
    this.load.image('fish_squid', 'fish/bigfin_reef_squid.png');            // 무늬오징어
    this.load.image('fish_hairtail', 'fish/cutlassfish.png');               // 갈치 — 2026-09-23 픽셀아트 교체(구 대문자 파일명 폐기)
    this.load.image('fish_cuttlefish', 'fish/cuttlefish.png');              // 갑오징어
    this.load.image('fish_blue_rockfish', 'fish/dark-banded_rockfish.png');  // 청볼락 (171차 사용자 확인)
    this.load.image('fish_filefish', 'fish/filefish.png');                  // 쥐치
    this.load.image('fish_golden_rockfish', 'fish/owstons_rockfish.png');   // 황볼락
    this.load.image('fish_sea_bass', 'fish/sea_bass.png');                  // 농어 — 2026-09-23 픽셀아트 교체
    this.load.image('fish_amberjack', 'fish/yellowtail_amberjack.png');     // 부시리
    this.load.image('fish_yellowtail', 'fish/yellowtail_fish.png');         // 방어
    this.load.image('fish_striped_mullet', 'fish/flathead_grey_mullet.png');// 숭어
    this.load.image('fish_redlip_mullet', 'fish/So-iuy_mullet.png');        // 가숭어
    this.load.image('fish_spotted_knifejaw', 'fish/spotted_knifejaw.png');  // 강담돔
    this.load.image('fish_red_seabream', 'fish/red_sea_bream.png');         // 참돔 (야간 참돔 night_seabream 공용)
    this.load.image('fish_horse_mackerel', 'fish/jack_mackerel.png');       // 전갱이
    this.load.image('fish_chub_mackerel', 'fish/mackerel.png');             // 고등어
    // 돌돔 — 30cm↑ 수컷은 무늬 소실(수컷 이미지), 그 외(30cm↓ 전부 + 30cm↑ 암컷)는 무늬 유지(암컷 이미지)
    this.load.image('fish_stone_beakperch_female', 'fish/barred_knifejaw_female.png');
    this.load.image('fish_stone_beakperch_male', 'fish/barred_knifejaw_male.png');
    // DB 미등록 어종 — 어종 추가 시 FISH_TEXTURE에 매핑만 연결하면 됨 (에셋은 선(先)로드)
    // ⚠ 170차에 "두 파일이 바이트 동일한 중복"이라고 적었던 것은 **public 사본이 덮어써져 있었기**
    //   때문이다(171차 정정). `food assets/` 원본은 서로 다른 사진이고, 사용자 확인대로
    //   spotbelly_greenling = 쏨뱅이 · spotbelly_rockfish = 놀래미다.
    this.load.image('fish_scorpionfish', 'fish/spotbelly_greenling.png');      // 쏨뱅이
    this.load.image('fish_swordtip_squid', 'fish/swordtip_squid.png');         // 한치(창꼴뚜기) — 2026-08-05 DB 등록 완료 (FISH_TEXTURE 배선됨)
    // 2026-07-22 2차 추가 (놀래미/쥐노래미/망상어 + 용치놀래기 암/수)
    this.load.image('fish_greenling', 'fish/spotbelly_rockfish.png');          // 놀래미(노래미)
    this.load.image('fish_fat_greenling', 'fish/fat_greenling.png');           // 쥐노래미
    this.load.image('fish_surfperch', 'fish/surf_perch.png');                  // 망상어
    // 용치놀래기 — 암컷→수컷 성전환 어종 (수컷 = 화려한 녹색 혼인색) — 성별별 이미지 분기
    this.load.image('fish_rainbow_wrasse_female', 'fish/multicolorfin_rainbowfish_female.png');
    this.load.image('fish_rainbow_wrasse_male', 'fish/multicolorfin_rainbowfish_male.png');

    // 2026-07-25 추가 — 신규 어종 이미지 11종 (기존 4종 텍스처 + 복섬 개명 + 신규 6종)
    this.load.image('fish_spanish_mackerel', 'fish/spanish_mackerel.png');            // 삼치
    this.load.image('fish_conger_eel', 'fish/conger_eel.png');                        // 붕장어
    this.load.image('fish_pike_conger', 'fish/daggertooth_pike_conger.png');          // 갯장어(하모)
    this.load.image('fish_pacific_saury', 'fish/saury.png');                          // 꽁치
    this.load.image('fish_grass_puffer', 'fish/grass_puffer.png');                    // 복섬 (구 졸복)
    this.load.image('fish_yellowfin_puffer', 'fish/yellowfin_puffer.png');            // 까치복
    this.load.image('fish_tiger_puffer', 'fish/tiger_puffer.png');                    // 참복어(자주복) — 2026-09-23 신규
    this.load.image('fish_bartail_flathead', 'fish/bartail_flathead.png');            // 양태
    this.load.image('fish_bluefin_searobin', 'fish/bluefin_searobin.png');            // 성대
    this.load.image('fish_hagfish', 'fish/hagfish.png');                              // 먹장어(곰장어)
    this.load.image('fish_halfbeak', 'fish/halfbeak.png');                            // 학꽁치
    this.load.image('fish_northern_whiting', 'fish/northern_whiting.png');            // 보리멸

    // 2026-07-28 추가 — 대구·잿방어 텍스처 + 문어 2종 분화(대문어/참문어)
    this.load.image('fish_pacific_cod', 'fish/pacific_cod.png');                      // 태평양 대구 — 2026-09-23 픽셀아트 교체
    this.load.image('fish_greater_amberjack', 'fish/greater_amberjack.png');          // 잿방어
    // ⚠ 문어 파일명↔어종: 이미지 내용 기준 매칭 (사용자 메시지의 영문 파일명은 뒤바뀜 —
    //   설명("대문어=동해·대형", "참문어=소형")과 이미지 내용이 일치하는 쪽으로 연결)
    this.load.image('fish_octopus', 'fish/common_octopus.png');                       // 참문어(돌문어) — 얼룩덜룩 소형
    this.load.image('fish_giant_octopus', 'fish/giant_pacific_octopus.png');          // 대문어(피문어) — 흰 매트 제거(2026-09-23)

    // 2026-09-22 추가 (170차) — 볼락류 어종별 실사
    this.load.image('fish_red_snapper_rockfish', 'fish/red_snapper_rockfish.png');    // 열기(불볼락)
    this.load.image('fish_black_rockfish', 'fish/black_rockfish.png');                // 조피볼락(우럭)

    // 2026-09-22 추가 (174차) — 사용자 제공 실사 7종
    this.load.image('fish_blackthroat_seaperch', 'fish/blackthroat_seaperch.png');    // 눈볼대(금태)
    this.load.image('fish_yellowfin_goby', 'fish/yellowfin_goby.png');                // 문절망둑
    this.load.image('fish_flounder', 'fish/flounder.png');                            // 문치가자미
    this.load.image('fish_starry_flounder', 'fish/starry_flounder.png');              // 강도다리
    this.load.image('fish_frog_flounder', 'fish/frog_flounder.png');                  // 도다리
    this.load.image('fish_silver_pomfret', 'fish/silver_pomfret.png');                // 병어 — 2026-09-23 픽셀아트 교체
    this.load.image('fish_korean_pomfret', 'fish/korean_pomfret.png');                // 덕대 — 2026-09-23 픽셀아트 교체

    // ─── 남자 캐릭터 스프라이트 (12장) ───
    // 정지 4방향
    this.load.image('man-idle-front', 'characters/man/man-idle-front.png');
    this.load.image('man-idle-back',  'characters/man/man-idle-back.png');
    this.load.image('man-idle-left',  'characters/man/man-idle-left.png');
    this.load.image('man-idle-right', 'characters/man/man-idle-right.png');
    // 이동 4방향 × 2프레임
    this.load.image('man-move-front-1', 'characters/man/man-move-front-1.png');
    this.load.image('man-move-front-2', 'characters/man/man-move-front-2.png');
    this.load.image('man-move-back-1',  'characters/man/man-move-back-1.png');
    this.load.image('man-move-back-2',  'characters/man/man-move-back-2.png');
    this.load.image('man-move-left-1',  'characters/man/man-move-left-1.png');
    this.load.image('man-move-left-2',  'characters/man/man-move-left-2.png');
    this.load.image('man-move-right-1', 'characters/man/man-move-right-1.png');
    this.load.image('man-move-right-2', 'characters/man/man-move-right-2.png');

    // ─── 여자 캐릭터 스프라이트 (12장, 향후 캐릭터 선택 시 사용) ───
    this.load.image('girl-idle-front', 'characters/girl/girl-idle-front.png');
    this.load.image('girl-idle-back',  'characters/girl/girl-idle-back.png');
    this.load.image('girl-idle-left',  'characters/girl/girl-idle-left.png');
    this.load.image('girl-idle-right', 'characters/girl/girl-idle-right.png');
    this.load.image('girl-move-front-1', 'characters/girl/girl-move-front-1.png');
    this.load.image('girl-move-front-2', 'characters/girl/girl-move-front-2.png');
    this.load.image('girl-move-back-1',  'characters/girl/girl-move-back-1.png');
    this.load.image('girl-move-back-2',  'characters/girl/girl-move-back-2.png');
    this.load.image('girl-move-left-1',  'characters/girl/girl-move-left-1.png');
    this.load.image('girl-move-left-2',  'characters/girl/girl-move-left-2.png');
    this.load.image('girl-move-right-1', 'characters/girl/girl-move-right-1.png');
    this.load.image('girl-move-right-2', 'characters/girl/girl-move-right-2.png');

    this.load.on('complete', () => {
      console.log('[BootScene] 에셋 로드 완료 — 픽셀 지도 + 캐릭터 스프라이트');
    });
  }
}
