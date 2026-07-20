/**
 * @file BootScene.ts
 * @description 부트 씬 — 에셋 프리로드 및 로딩 화면
 *
 * 게임 시작 시 가장 먼저 실행되는 씬.
 * 모든 에셋을 로드하고 MainMenuScene으로 이동합니다.
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingScreen();
    this.loadAssets();
  }

  create(): void {
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

    // ─── 음식/생선 아이템 이미지 에셋 ───
    // food/: 아이템 아이콘 (인벤토리/상점 소켓용, 64x64 도트)
    // fish/: 어획 연출용 실사 픽셀화 생선 이미지 (낚시 성공 팝업/상세보기)
    this.load.image('food_assorted_sashimi', 'food/assorted_sashimi.png');
    this.load.image('fish_black_sea_bream', 'fish/black_sea_bream.png');
    this.load.image('fish_halibut', 'fish/halibut.png');
    this.load.image('fish_largescale_blackfish', 'fish/large_scale_blackfish.png');   // 벵에돔
    this.load.image('fish_longtail_blackfish', 'fish/small_scale_blackfish.png');     // 긴꼬리벵에돔

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
