/**
 * @file WorldMapScene.ts
 * @description 한국 지도 출조지 선택 씬 — 픽셀 지도 배경 + 동적 핀포인트 노드
 *
 * 상태 머신:
 *  REGION_SELECT → 지역 핀/리스트 클릭 → 줌인 애니메이션 → SPOT_SELECT
 *                                                            → 스팟 클릭 → CONFIRM_MODAL
 *                              ← ESC / [뒤로가기] ←
 *
 * 구조 원칙:
 *  - WORLD_NODE_DATABASE만 수정하면 지도에 핀이 자동으로 추가됨
 *  - 리스트 hover ↔ 지도 마커 양방향 하이라이트 동기화
 *  - 클릭 시 카메라 줌인 후 스팟 선택 뷰 전환
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';
import {
  SPOT_DATABASE,
  REGION_DATABASE,
  RegionDef,
  FishingSpotInfo,
  calculateTideInfo,
  FISH_DATABASE,
  LicenseType,
  WORLD_NODE_DATABASE,
  FishingSpotNode,
  REGION_MAP_GRAPHS,
} from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { ConfirmTripModal } from '../ui/ConfirmTripModal.js';

// ── 뷰 상태 머신 ────────────────────────────────────────
// region    : 전국 지도 + 지역 핀/리스트 선택
// regionmap : 지역 클릭 후 해당 지역 픽셀 지도로 줌인 진입 (포인트는 추후 구현)
// spot      : (임시) 위경도 기반 낚시터 리스트 — regionmap에서 임시 진입
// confirm   : 출조 확인 모달
type ViewState = 'region' | 'regionmap' | 'spot' | 'confirm';

// ── 범례 설정 ────────────────────────────────────────────
const LEGEND_ITEMS: { type: string; color: number; label: string }[] = [
  { type: 'BREAKWATER', color: 0x00d2ff, label: '방파제' },
  { type: 'REEF',       color: 0xff6b6b, label: '갯바위' },
  { type: 'BOAT',       color: 0xffd700, label: '선상' },
  { type: 'MUD',        color: 0x78e08f, label: '갯벌' },
  { type: 'BEACH',      color: 0xffe066, label: '해수욕장' },
];

// ── 지도 영역 설정 (화면 내 지도 배치 좌표) ──────────────
// webglmap_pixel.png 이미지를 화면 오른쪽 절반에 배치
const MAP_IMAGE_KEY = 'korea_pixel_map';
// 지도 이미지 크기 기준 (실제 webglmap_pixelazed.png 원본 해상도)
const MAP_NATIVE_W = 256;
const MAP_NATIVE_H = 256;
// 게임 화면 내 지도 배치 영역 (우측 영역)
const MAP_DISPLAY_X = 380;   // 지도 좌상단 X
const MAP_DISPLAY_Y = 60;    // 지도 좌상단 Y
const MAP_DISPLAY_W = 580;   // 지도 표시 너비
const MAP_DISPLAY_H = 580;   // 지도 표시 높이

export class WorldMapScene extends Phaser.Scene {
  // ── 상태 머신 ────────────────────────────────────────
  private viewState: ViewState = 'region';

  // ── 컨테이너 ─────────────────────────────────────────
  private regionContainer!: Phaser.GameObjects.Container;
  private spotContainer!: Phaser.GameObjects.Container;
  private pinContainer!: Phaser.GameObjects.Container;   // 지도 핀포인트 레이어
  private confirmModal: ConfirmTripModal | null = null;

  // ── 툴팁 ─────────────────────────────────────────────
  private tooltipContainer?: Phaser.GameObjects.Container;

  // ── 핀 마커 참조 (양방향 동기화용) ───────────────────
  /** nodeId → { dot, ring, label } */
  private pinMarkerMap = new Map<string, {
    dot: Phaser.GameObjects.Arc;
    ring: Phaser.GameObjects.Arc;
    label: Phaser.GameObjects.Text;
  }>();

  // ── 줌인 상태 ─────────────────────────────────────────
  private isZooming = false;

  // ── 현재 진입한 지역 (regionmap/spot 뷰 컨텍스트) ────────
  private _currentRegion?: RegionDef;

  // ── 핀 편집 모드 (개발자 도구: P 키 토글) ────────────
  private _pinEditMode = false;
  /** 편집 모드 UI 컨테이너 */
  private _editOverlay?: Phaser.GameObjects.Container;
  /** 편집 모드 중 마우스 좌표 표시 텍스트 */
  private _editCoordText?: Phaser.GameObjects.Text;
  /** 배너에 선택된 핀 ID 표시 텍스트 */
  private _editBannerSelText?: Phaser.GameObjects.Text;
  /** 클릭으로 캡처된 새 핀 좌표 표시 텍스트 */
  private _editClickCaptureText?: Phaser.GameObjects.Text;
  /** 마지막으로 드래그/선택된 핀의 nodeId (배너 강조용) */
  private _editSelectedId?: string;

  /** 개발자 도구 진입 버튼 배경 */
  private _devToolBtnBg?: Phaser.GameObjects.Graphics;
  /** 개발자 도구 진입 버튼 텍스트 */
  private _devToolBtnText?: Phaser.GameObjects.Text;
  /** 개발자 도구 진입 버튼 인터랙션 영역 */
  private _devToolBtnHit?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create(): void {
    // 배경 (어두운 해양 색조)
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050b14).setOrigin(0, 0);

    // ── 픽셀 지도 배경 이미지 ────────────────────────────
    this.placeMapImage();

    // ── 툴팁 초기화 ──────────────────────────────────────
    this.createTooltipContainer();

    // ── 컨테이너 생성 ────────────────────────────────────
    this.pinContainer = this.add.container(0, 0).setDepth(10);
    this.regionContainer = this.add.container(0, 0).setDepth(20);
    this.spotContainer = this.add.container(0, 0).setDepth(20);

    // ── ESC 핸들링 ───────────────────────────────────────
    this.input.keyboard?.on('keydown-ESC', () => this.handleEsc());

    // ── P 키: 핀 위치 편집 모드 토글 (개발자 도구) ──────────
    this.input.keyboard?.on('keydown-P', () => this.togglePinEditMode());

    // ── 지도 위 마우스 이동 시 편집 모드에서 좌표 실시간 표시
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this._pinEditMode || !this._editCoordText) return;
      const px = ((pointer.x - MAP_DISPLAY_X) / MAP_DISPLAY_W) * MAP_NATIVE_W;
      const py = ((pointer.y - MAP_DISPLAY_Y) / MAP_DISPLAY_H) * MAP_NATIVE_H;
      if (px >= 0 && px <= MAP_NATIVE_W && py >= 0 && py <= MAP_NATIVE_H) {
        this._editCoordText.setText(`마우스 픽셀 좌표: pixelX=${Math.round(px)}, pixelY=${Math.round(py)}`);
      } else {
        this._editCoordText.setText('마우스를 지도 위로 이동하세요');
      }
    });

    // ── 초기 상태: 지역 뷰 ──────────────────────────────
    this.renderRegionView();

    // ── 개발자 도구 토글 버튼 생성 ────────────────────────
    this.createDevToolToggleButton();

    this.cameras.main.fadeIn(300, 0, 10, 20);
  }

  // ═══════════════════════════════════════════════════════
  // 핀 위치 편집 모드 (P 키 토글)
  // ═══════════════════════════════════════════════════════
  private togglePinEditMode(): void {
    this._pinEditMode = !this._pinEditMode;

    if (this._pinEditMode) {
      this.enterPinEditMode();
    } else {
      this.exitPinEditMode();
    }

    this.drawDevToolButtonState(false);
  }

  private enterPinEditMode(): void {
    // 오버레이 생성
    this._editOverlay = this.add.container(0, 0).setDepth(200);

    // 상단 배너
    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0xff6b00, 0.92);
    bannerBg.fillRect(0, 0, GAME_WIDTH, 42);

    // 배너 좌측: 안내 텍스트
    const bannerText = this.add.text(16, 21,
      '📍 핀 편집 모드 [P] 종료  |  핀 드래그: 위치 조정  |  지도 클릭: 새 좌표 캡처',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#fff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

    // 배너 우측: 선택된 핀 표시
    this._editBannerSelText = this.add.text(GAME_WIDTH - 16, 21,
      '선택: —',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffee44',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);

    // 배너 우측: 전체 덤프 버튼
    const dumpBtnBg = this.add.graphics();
    dumpBtnBg.fillStyle(0xffffff, 0.18);
    dumpBtnBg.fillRoundedRect(GAME_WIDTH - 200, 6, 110, 28, 4);
    const dumpBtnText = this.add.text(GAME_WIDTH - 145, 20, '📋 전체 덤프', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const dumpHit = this.add.rectangle(GAME_WIDTH - 145, 20, 110, 28, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    dumpHit.on('pointerdown', () => this.dumpAllPinCoords());
    dumpHit.on('pointerover', () => { dumpBtnBg.clear(); dumpBtnBg.fillStyle(0xffffff, 0.32); dumpBtnBg.fillRoundedRect(GAME_WIDTH - 200, 6, 110, 28, 4); });
    dumpHit.on('pointerout',  () => { dumpBtnBg.clear(); dumpBtnBg.fillStyle(0xffffff, 0.18); dumpBtnBg.fillRoundedRect(GAME_WIDTH - 200, 6, 110, 28, 4); });

    // 하단 패널 (마우스 좌표 + 클릭 캡처)
    const panelY = MAP_DISPLAY_Y + MAP_DISPLAY_H + 8;

    // 마우스 좌표 텍스트
    this._editCoordText = this.add.text(MAP_DISPLAY_X, panelY,
      '마우스를 지도 위로 이동하세요',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffcc44',
        backgroundColor: '#060f1eee',
        padding: { x: 6, y: 3 },
      });

    // 클릭 캡처 텍스트 (지도 빈 공간 클릭 시 업데이트)
    this._editClickCaptureText = this.add.text(MAP_DISPLAY_X, panelY + 26,
      '지도 빈 공간을 클릭하면 새 핀 좌표가 캡처됩니다',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#88ddff',
        backgroundColor: '#060f1eee',
        padding: { x: 6, y: 3 },
      });

    this._editOverlay.add([
      bannerBg, bannerText,
      this._editBannerSelText,
      dumpBtnBg, dumpBtnText, dumpHit,
      this._editCoordText,
      this._editClickCaptureText,
    ]);

    // ── 지도 빈 공간 클릭 → 새 핀 좌표 캡처 ──────────────
    this.input.on('pointerdown-edit', (pointer: Phaser.Input.Pointer) => {
      // 핀 드래그 중에는 무시 (Phaser가 drag 이벤트로 먼저 소비)
      if (!this._pinEditMode || !this._editClickCaptureText) return;
      const px = Math.round(((pointer.x - MAP_DISPLAY_X) / MAP_DISPLAY_W) * MAP_NATIVE_W);
      const py = Math.round(((pointer.y - MAP_DISPLAY_Y) / MAP_DISPLAY_H) * MAP_NATIVE_H);
      if (px >= 0 && px <= MAP_NATIVE_W && py >= 0 && py <= MAP_NATIVE_H) {
        const tsCode = `  { id: 'NEW_NODE', name: '새 지점', shortName: '새 지점', region: '지역명',\n    regionDatabaseId: 'region_id', pixelX: ${px}, pixelY: ${py},\n    spotsCount: 1, availableTypes: ['BREAKWATER'] },`;
        console.log('[WorldMap 클릭 캡처]', tsCode);
        this._editClickCaptureText.setText(`클릭 캡처: pixelX=${px}, pixelY=${py}  (콘솔에 TS 코드 출력됨)`);
        // 클립보드 복사 시도
        void navigator.clipboard.writeText(tsCode).then(() => {
          if (this._editClickCaptureText) {
            this._editClickCaptureText.setText(`✅ 클립보드 복사 완료: pixelX=${px}, pixelY=${py}`);
          }
        }).catch(() => {
          // 클립보드 API 없을 시 무시 (콘솔에는 출력됨)
        });
      }
    });

    // pointerdown 리스너 (핀 위가 아닌 지도 영역 클릭 감지)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this._pinEditMode || !this._editClickCaptureText) return;
      const px = Math.round(((pointer.x - MAP_DISPLAY_X) / MAP_DISPLAY_W) * MAP_NATIVE_W);
      const py = Math.round(((pointer.y - MAP_DISPLAY_Y) / MAP_DISPLAY_H) * MAP_NATIVE_H);
      if (px >= 0 && px <= MAP_NATIVE_W && py >= 0 && py <= MAP_NATIVE_H) {
        const tsCode = `  { id: 'NEW_NODE', name: '새 지점', shortName: '새 지점', region: '지역명', regionDatabaseId: 'region_id', pixelX: ${px}, pixelY: ${py}, spotsCount: 1, availableTypes: ['BREAKWATER'] },`;
        console.log('[WorldMap 클릭 캡처]', `pixelX: ${px}, pixelY: ${py}`);
        this._editClickCaptureText.setText(`클릭 → pixelX=${px}, pixelY=${py}  (콘솔 출력 완료)`);
        void navigator.clipboard.writeText(tsCode).then(() => {
          if (this._editClickCaptureText) {
            this._editClickCaptureText.setText(`✅ 클립보드 복사: pixelX=${px}, pixelY=${py}`);
          }
        }).catch(() => {});
      }
    });

    // 편집 모드에서 핀 드래그 활성화
    this.pinMarkerMap.forEach(({ dot, ring, label }, nodeId) => {
      dot.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
      this.input.setDraggable(dot);

      dot.on('dragstart', () => {
        this._editSelectedId = nodeId;
        // 배너에 선택된 핀 ID 표시
        if (this._editBannerSelText) {
          this._editBannerSelText.setText(`선택: ${nodeId}`);
        }
        dot.setFillStyle(0xffffff);
        ring.setAlpha(0);
      });

      dot.on('drag', (_ptr: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        dot.setPosition(dragX, dragY);
        ring.setPosition(dragX, dragY);
        label.setPosition(dragX, dragY + 14);

        // 지도 픽셀 좌표로 변환
        const px = Math.round(((dragX - MAP_DISPLAY_X) / MAP_DISPLAY_W) * MAP_NATIVE_W);
        const py = Math.round(((dragY - MAP_DISPLAY_Y) / MAP_DISPLAY_H) * MAP_NATIVE_H);
        label.setText(`${nodeId}\npixelX:${px}, pixelY:${py}`);
        label.setFontSize(8);
        label.setColor('#ffcc44');
      });

      dot.on('dragend', (_ptr: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        const px = Math.round(((dragX - MAP_DISPLAY_X) / MAP_DISPLAY_W) * MAP_NATIVE_W);
        const py = Math.round(((dragY - MAP_DISPLAY_Y) / MAP_DISPLAY_H) * MAP_NATIVE_H);

        // _editSelectedId 활용: 배너에 확정 좌표 표시
        const selId = this._editSelectedId ?? nodeId;
        const output = `[${selId}] pixelX: ${px}, pixelY: ${py}`;
        console.log('[WorldMap 편집]', output);

        // 하단 마우스 좌표 텍스트에 결과 표시
        if (this._editCoordText) {
          this._editCoordText.setText(`✅ 드래그 확정: ${output}`);
        }
        // 배너에도 업데이트
        if (this._editBannerSelText) {
          this._editBannerSelText.setText(`확정: ${output}`);
        }

        // 클립보드 복사 시도
        const tsLine = `  pixelX: ${px}, pixelY: ${py},  // ${selId}`;
        void navigator.clipboard.writeText(tsLine).then(() => {
          if (this._editCoordText) {
            this._editCoordText.setText(`✅ 클립보드 복사: ${output}`);
          }
        }).catch(() => {});

        // 원래 노드 색으로 복원
        const node = WORLD_NODE_DATABASE.find((n: FishingSpotNode) => n.id === nodeId);
        const primaryType = node?.availableTypes[0];
        const baseColor = LEGEND_ITEMS.find((l) => l.type === primaryType)?.color ?? 0x4af2a1;
        dot.setFillStyle(baseColor);
        ring.setAlpha(1);
      });
    });
  }

  /** 편집 모드: 현재 모든 핀의 pixelX/Y 좌표를 콘솔에 덤프 */
  private dumpAllPinCoords(): void {
    const lines: string[] = ['// WORLD_NODE_DATABASE 현재 좌표 덤프 (드래그 반영 전 원본)'];
    WORLD_NODE_DATABASE.forEach((node: FishingSpotNode) => {
      lines.push(`  // ${node.name}  pixelX: ${node.pixelX}, pixelY: ${node.pixelY}`);
    });
    const dump = lines.join('\n');
    console.log(dump);
    if (this._editCoordText) {
      this._editCoordText.setText('📋 전체 핀 좌표 콘솔에 출력 완료 (개발자 도구 열어 확인)');
    }
    void navigator.clipboard.writeText(dump).then(() => {
      if (this._editCoordText) {
        this._editCoordText.setText('📋 전체 핀 좌표 클립보드 복사 완료');
      }
    }).catch(() => {});
  }

  private exitPinEditMode(): void {
    this._editOverlay?.destroy();
    this._editOverlay = undefined;
    this._editCoordText = undefined;
    this._editBannerSelText = undefined;
    this._editClickCaptureText = undefined;
    this._editSelectedId = undefined;

    // pointerdown 리스너 정리
    this.input.off('pointerdown');

    // 드래그 비활성화 및 원래 위치/색상 복원
    this.pinMarkerMap.forEach(({ dot, ring, label }, nodeId) => {
      this.input.setDraggable(dot, false);
      dot.removeAllListeners();

      const node = WORLD_NODE_DATABASE.find((n: FishingSpotNode) => n.id === nodeId);
      if (!node) return;
      const { x, y } = this.nodeToPinXY(node);
      const primaryType = node.availableTypes[0];
      const baseColor = LEGEND_ITEMS.find((l) => l.type === primaryType)?.color ?? 0x4af2a1;

      dot.setPosition(x, y).setFillStyle(baseColor);
      ring.setPosition(x, y);
      label.setPosition(x, y + 14).setText(node.shortName).setFontSize(9).setColor('#c8e8ff');

      // 편집 모드 종료 후 원래 클릭 핸들러 복원
      dot.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
      dot.on('pointerover', () => {
        dot.setFillStyle(0xffffff);
        this.showNodeTooltip(node, x, y);
      });
      dot.on('pointerout', () => {
        dot.setFillStyle(baseColor);
        this.hideTooltip();
      });
      dot.on('pointerdown', () => {
        const region = REGION_DATABASE.find((r) => r.id === node.regionDatabaseId);
        if (region) this.navigateToRegion(region, node);
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  // 픽셀 지도 배경 배치
  // ═══════════════════════════════════════════════════════
  private placeMapImage(): void {
    // 지도 이미지를 지정 영역에 맞게 스케일 조정
    const scaleX = MAP_DISPLAY_W / MAP_NATIVE_W;
    const scaleY = MAP_DISPLAY_H / MAP_NATIVE_H;

    const mapImg = this.add.image(MAP_DISPLAY_X, MAP_DISPLAY_Y, MAP_IMAGE_KEY)
      .setOrigin(0, 0)
      .setScale(scaleX, scaleY)
      .setDepth(1);

    // 지도 라벨 (우하단 — 매우 작고 반투명하게)
    this.add.text(MAP_DISPLAY_X + MAP_DISPLAY_W - 10, MAP_DISPLAY_Y + MAP_DISPLAY_H + 2,
      'VWorld 기반 픽셀 지도', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#1a2d40',
      }).setOrigin(1, 0).setDepth(3).setAlpha(0.4);

    void mapImg;
  }

  // ═══════════════════════════════════════════════════════
  // 핀포인트 좌표 변환 유틸
  // (webglmap_pixel.png 기준 픽셀 → 화면 표시 좌표)
  // ═══════════════════════════════════════════════════════
  private nodeToPinXY(node: FishingSpotNode): { x: number; y: number } {
    const rx = node.pixelX / MAP_NATIVE_W;
    const ry = node.pixelY / MAP_NATIVE_H;
    return {
      x: MAP_DISPLAY_X + rx * MAP_DISPLAY_W,
      y: MAP_DISPLAY_Y + ry * MAP_DISPLAY_H,
    };
  }

  // ═══════════════════════════════════════════════════════
  // ESC 계층 복귀
  // ═══════════════════════════════════════════════════════
  private handleEsc(): void {
    if (this.isZooming) return;
    switch (this.viewState) {
      case 'confirm':
        this.closeConfirmModal();
        break;
      case 'spot': {
        // 임시 낚시터 리스트 → 지역 지도로 복귀
        const region = this._currentRegion;
        const node = region
          ? WORLD_NODE_DATABASE.find((n: FishingSpotNode) => n.regionDatabaseId === region.id)
          : undefined;
        if (region) this.renderRegionMapView(region, node);
        else this.switchToRegionView();
        break;
      }
      case 'regionmap':
        this.switchToRegionView();
        break;
      case 'region':
      default:
        this.cameras.main.fadeOut(300, 0, 10, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MainMenuScene');
        });
        break;
    }
  }

  // ═══════════════════════════════════════════════════════
  // 지역 뷰 (REGION_SELECT)
  // ═══════════════════════════════════════════════════════
  private renderRegionView(): void {
    this.viewState = 'region';
    this.regionContainer.removeAll(true);
    this.spotContainer.removeAll(true);
    this.pinContainer.removeAll(true);
    this.pinMarkerMap.clear();

    // 카메라 줌 초기화
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // ── 타이틀 영역 ─────────────────────────────────────
    const title = this.add.text(20, 22, '🗺  출조지 선택', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '20px',
      color: '#4af2a1',
      fontStyle: 'bold',
    });
    const hint = this.add.text(20, 50, '지역을 클릭하거나 지도의 핀을 선택해 출조지를 고르세요  [ESC] 메인 메뉴', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px',
      color: '#607b8e',
    });
    this.regionContainer.add([title, hint]);

    // ── 지역 목록 (왼쪽 패널) ────────────────────────────
    REGION_DATABASE.forEach((region, idx) => {
      const itemY = 80 + idx * 52;
      const node = WORLD_NODE_DATABASE.find((n: FishingSpotNode) => n.regionDatabaseId === region.id);
      this.addRegionListItem(region, node, itemY);
    });

    // ── 지도 위 핀포인트 마커 (데이터 기반) ──────────────
    WORLD_NODE_DATABASE.forEach((node: FishingSpotNode) => {
      this.drawWorldNodePin(node);
    });

    // ── 범례 ─────────────────────────────────────────────
    this.drawLegend();
  }

  // ── 지역 리스트 아이템 ───────────────────────────────
  private addRegionListItem(region: RegionDef, node: FishingSpotNode | undefined, itemY: number): void {
    const btn = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e1c2d, 0.9);
    bg.fillRoundedRect(16, itemY, 340, 44, 4);
    bg.lineStyle(1.5, 0x1f3d5a, 0.8);
    bg.strokeRoundedRect(16, itemY, 340, 44, 4);

    const nameText = this.add.text(40, itemY + 8, region.nameKo, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '15px',
      color: '#d0e8f5',
      fontStyle: 'bold',
    });
    const subText = this.add.text(40, itemY + 26, `포인트 ${region.subSpotIds.length}개${node ? '  ·  ' + node.availableTypes.map((t: string) => LEGEND_ITEMS.find((l) => l.type === t)?.label ?? t).join(' / ') : ''}`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '9px',
      color: '#607b8e',
    });

    btn.add([bg, nameText, subText]);

    const hit = this.add.rectangle(186, itemY + 22, 340, 44, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x162a40, 0.95);
      bg.fillRoundedRect(16, itemY, 340, 44, 4);
      bg.lineStyle(1.5, 0x2a5a8a, 1);
      bg.strokeRoundedRect(16, itemY, 340, 44, 4);
      nameText.setColor('#4af2a1');
      // 지도 마커 하이라이트
      if (node) this.highlightPin(node.id, true);
    });
    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0e1c2d, 0.9);
      bg.fillRoundedRect(16, itemY, 340, 44, 4);
      bg.lineStyle(1.5, 0x1f3d5a, 0.8);
      bg.strokeRoundedRect(16, itemY, 340, 44, 4);
      nameText.setColor('#d0e8f5');
      // 하이라이트 해제
      if (node) this.highlightPin(node.id, false);
      this.hideTooltip();
    });
    hit.on('pointerdown', () => {
      this.navigateToRegion(region, node);
    });
    btn.add(hit);

    this.regionContainer.add(btn);
  }

  // ── 지도 위 핀포인트 마커 그리기 ────────────────────
  private drawWorldNodePin(node: FishingSpotNode): void {
    const { x, y } = this.nodeToPinXY(node);

    // 주 타입 색상
    const primaryType = node.availableTypes[0];
    const color = LEGEND_ITEMS.find((l) => l.type === primaryType)?.color ?? 0x4af2a1;

    const dot = this.add.circle(x, y, 6, color);
    const ring = this.add.circle(x, y, 12, color, 0);
    ring.setStrokeStyle(1.5, color);

    // 펄스 애니메이션
    this.tweens.add({
      targets: ring,
      scaleX: 2.2, scaleY: 2.2, alpha: 0,
      duration: 1600, repeat: -1, ease: 'Sine.easeOut',
    });

    const label = this.add.text(x, y + 14, node.shortName, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '9px',
      color: '#c8e8ff',
      backgroundColor: '#060f1ecc',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 0);

    // 핀 인터랙션
    dot.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
    dot.on('pointerover', () => {
      dot.setFillStyle(0xffffff);
      this.showNodeTooltip(node, x, y);
      // 리스트 하이라이트 불가 (리스트 참조 없음 — 핀→리스트 방향은 반응색으로 처리)
    });
    dot.on('pointerout', () => {
      dot.setFillStyle(color);
      this.hideTooltip();
    });
    dot.on('pointerdown', () => {
      const region = REGION_DATABASE.find((r) => r.id === node.regionDatabaseId);
      if (region) this.navigateToRegion(region, node);
    });

    this.pinContainer.add([dot, ring, label]);
    this.pinMarkerMap.set(node.id, { dot, ring, label });
  }

  // ── 핀 하이라이트 (리스트 hover → 지도 마커) ────────
  private highlightPin(nodeId: string, on: boolean): void {
    const marker = this.pinMarkerMap.get(nodeId);
    if (!marker) return;
    const node = WORLD_NODE_DATABASE.find((n: FishingSpotNode) => n.id === nodeId);
    const primaryType = node?.availableTypes[0];
    const baseColor = LEGEND_ITEMS.find((l) => l.type === primaryType)?.color ?? 0x4af2a1;

    if (on) {
      marker.dot.setFillStyle(0xffffff);
      marker.dot.setRadius(9);
      marker.label.setColor('#4af2a1');
    } else {
      marker.dot.setFillStyle(baseColor);
      marker.dot.setRadius(6);
      marker.label.setColor('#c8e8ff');
    }
  }

  // ── 지역 클릭 → 줌인 애니메이션 → 스팟 뷰 ─────────
  private navigateToRegion(region: RegionDef, node: FishingSpotNode | undefined): void {
    if (this.isZooming) return;

    if (node) {
      // 클릭된 핀 위치로 카메라 줌인 (리드인 연출) → 지역 상세 지도 진입
      const { x, y } = this.nodeToPinXY(node);
      this.isZooming = true;
      this.cameras.main.pan(x, y, 400, 'Cubic.easeInOut');
      this.cameras.main.zoomTo(1.5, 400, 'Cubic.easeInOut', false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          this.isZooming = false;
          // 짧은 딜레이 후 지역 지도 뷰로 전환
          this.time.delayedCall(120, () => {
            this.cameras.main.setZoom(1);
            this.cameras.main.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
            this.renderRegionMapView(region, node);
          });
        }
      });
    } else {
      this.renderRegionMapView(region, undefined);
    }
  }

  // ═══════════════════════════════════════════════════════
  // 지역 상세 지도 뷰 (REGION_MAP) — pixelazed 지도로 줌인 진입
  // 지도 내 세부 포인트 지정은 추후 구현 (타일맵 에셋 준비 후)
  // ═══════════════════════════════════════════════════════
  private renderRegionMapView(region: RegionDef, node: FishingSpotNode | undefined): void {
    this.viewState = 'regionmap';
    this._currentRegion = region;
    this.regionContainer.removeAll(true);
    this.spotContainer.removeAll(true);
    this.pinContainer.removeAll(true);
    this.pinMarkerMap.clear();
    this.hideTooltip();

    // ── 지도 배치 영역 (우측에 크게) ─────────────────────
    const mapSize = 560;
    const cx = 720;                 // 지도 중심 X
    const cy = GAME_HEIGHT / 2;     // 지도 중심 Y
    const fullScale = mapSize / MAP_NATIVE_W;
    const texKey = node ? `zoom_${node.mapSlug}` : '';
    const hasMap = texKey !== '' && this.textures.exists(texKey);

    // ── 지도 프레임 (테두리) ─────────────────────────────
    const frame = this.add.graphics();
    frame.lineStyle(2, 0x1f3d5a, 0.9);
    frame.strokeRect(cx - mapSize / 2 - 2, cy - mapSize / 2 - 2, mapSize + 4, mapSize + 4);
    this.spotContainer.add(frame);

    if (hasMap) {
      // 픽셀 지도 이미지 — 핀 위치에서 작게 시작해 중앙으로 확대(줌인 연출)
      const start = node ? this.nodeToPinXY(node) : { x: cx, y: cy };
      const mapImg = this.add.image(start.x, start.y, texKey).setOrigin(0.5);
      mapImg.setScale(fullScale * 0.14);
      this.spotContainer.add(mapImg);

      this.tweens.add({
        targets: mapImg,
        x: cx, y: cy,
        scaleX: fullScale, scaleY: fullScale,
        duration: 460,
        ease: 'Cubic.easeOut',
      });
    } else {
      // 지도 미준비 지역 (예: 태안) — 플레이스홀더
      const ph = this.add.graphics();
      ph.fillStyle(0x0a1826, 0.95);
      ph.fillRect(cx - mapSize / 2, cy - mapSize / 2, mapSize, mapSize);
      ph.lineStyle(1, 0x24435f, 0.8);
      for (let gx = -mapSize / 2; gx <= mapSize / 2; gx += 40) {
        ph.lineBetween(cx + gx, cy - mapSize / 2, cx + gx, cy + mapSize / 2);
        ph.lineBetween(cx - mapSize / 2, cy + gx, cx + mapSize / 2, cy + gx);
      }
      const phText = this.add.text(cx, cy, `🗺️  ${region.nameKo}\n지도 준비중`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '16px', color: '#5f7d92', align: 'center', lineSpacing: 8,
      }).setOrigin(0.5);
      this.spotContainer.add([ph, phText]);
    }

    // ── 좌측 정보 패널 ───────────────────────────────────
    // 뒤로가기 버튼
    const backBtn = this.add.container(0, 0);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x1f3045, 0.9);
    backBg.fillRoundedRect(16, 14, 130, 30, 4);
    backBg.lineStyle(1, 0x2a5a8a, 0.8);
    backBg.strokeRoundedRect(16, 14, 130, 30, 4);
    const backText = this.add.text(81, 29, '← 전국 지도', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px', color: '#8faabf', fontStyle: 'bold',
    }).setOrigin(0.5);
    backBtn.add([backBg, backText]);
    const backHit = this.add.rectangle(81, 29, 130, 30, 0xffffff, 0).setInteractive({ useHandCursor: true });
    backHit.on('pointerdown', () => this.switchToRegionView());
    backHit.on('pointerover', () => backText.setColor('#4af2a1'));
    backHit.on('pointerout', () => backText.setColor('#8faabf'));
    backBtn.add(backHit);
    this.spotContainer.add(backBtn);

    // 지역 타이틀
    const title = this.add.text(20, 62, `📍 ${region.nameKo}`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '22px', color: '#4af2a1', fontStyle: 'bold',
    });
    const desc = this.add.text(20, 96, region.description, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px', color: '#8faabf', lineSpacing: 5,
      wordWrap: { width: 320 },
    });
    this.spotContainer.add([title, desc]);

    // 안내 문구 (포인트 준비중)
    // 이 지역에 타일맵 필드(RegionFieldScene)가 준비되어 있는지
    const hasFieldMap = !!REGION_MAP_GRAPHS[region.id];

    const note = this.add.text(20, GAME_HEIGHT - 200,
      hasFieldMap
        ? '✅ 이 지역은 실제 지형 기반 타일맵\n   필드가 준비되어 있습니다.\n   아래 버튼으로 입장하세요.\n\n   [ESC] 전국 지도로 돌아가기'
        : '🚧 이 지역의 세부 낚시 포인트는\n   준비중입니다 (타일맵 에셋 제작 예정).\n\n   [ESC] 전국 지도로 돌아가기', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11px', color: hasFieldMap ? '#7fe6b0' : '#607b8e', lineSpacing: 5,
      });
    this.spotContainer.add(note);

    // 타일맵 필드 입장 버튼 (준비된 지역만)
    if (hasFieldMap) {
      const fbY = GAME_HEIGHT - 112;
      const fieldBtn = this.add.container(0, 0);
      const fieldBg = this.add.graphics();
      fieldBg.fillStyle(0x0e3a52, 0.95);
      fieldBg.fillRoundedRect(16, fbY, 320, 42, 5);
      fieldBg.lineStyle(2, 0x33b0e0, 1);
      fieldBg.strokeRoundedRect(16, fbY, 320, 42, 5);
      const fieldText = this.add.text(176, fbY + 21, `🗺️ ${region.shortNameKo} 필드 입장`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '14px', color: '#9fe4ff', fontStyle: 'bold',
      }).setOrigin(0.5);
      fieldBtn.add([fieldBg, fieldText]);
      const fieldHit = this.add.rectangle(176, fbY + 21, 320, 42, 0xffffff, 0).setInteractive({ useHandCursor: true });
      fieldHit.on('pointerover', () => fieldText.setColor('#d6f4ff'));
      fieldHit.on('pointerout', () => fieldText.setColor('#9fe4ff'));
      fieldHit.on('pointerdown', () => {
        this.cameras.main.fadeOut(280, 0, 10, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('RegionFieldScene', { region: region.id });
        });
      });
      fieldBtn.add(fieldHit);
      this.spotContainer.add(fieldBtn);
    }

    // (임시) 낚시터 목록 진입 버튼 — 세부 포인트 구현 전까지 출조 유지
    const tempBtn = this.add.container(0, 0);
    const tbY = GAME_HEIGHT - 64;
    const tempBg = this.add.graphics();
    tempBg.fillStyle(0x123a2c, 0.9);
    tempBg.fillRoundedRect(16, tbY, 320, 40, 5);
    tempBg.lineStyle(1.5, 0x2f7d5a, 0.9);
    tempBg.strokeRoundedRect(16, tbY, 320, 40, 5);
    const tempText = this.add.text(176, tbY + 20, '🎣 낚시터 선택 (임시)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px', color: '#7fe6b0', fontStyle: 'bold',
    }).setOrigin(0.5);
    tempBtn.add([tempBg, tempText]);
    const tempHit = this.add.rectangle(176, tbY + 20, 320, 40, 0xffffff, 0).setInteractive({ useHandCursor: true });
    tempHit.on('pointerover', () => { tempText.setColor('#b6ffd8'); });
    tempHit.on('pointerout', () => { tempText.setColor('#7fe6b0'); });
    tempHit.on('pointerdown', () => this.renderSpotView(region));
    tempBtn.add(tempHit);
    this.spotContainer.add(tempBtn);
  }

  // ═══════════════════════════════════════════════════════
  // 스팟 뷰 (SPOT_SELECT)
  // ═══════════════════════════════════════════════════════
  private renderSpotView(region: RegionDef): void {
    this.viewState = 'spot';
    this.regionContainer.removeAll(true);
    this.spotContainer.removeAll(true);
    this.pinContainer.removeAll(true);
    this.pinMarkerMap.clear();
    this.hideTooltip();

    // ── 뒤로가기 버튼 ────────────────────────────────────
    const backBtn = this.add.container(0, 0);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x1f3045, 0.9);
    backBg.fillRoundedRect(16, 14, 120, 30, 4);
    backBg.lineStyle(1, 0x2a5a8a, 0.8);
    backBg.strokeRoundedRect(16, 14, 120, 30, 4);
    const backText = this.add.text(76, 29, '← 지역 지도', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px', color: '#8faabf', fontStyle: 'bold',
    }).setOrigin(0.5);
    backBtn.add([backBg, backText]);

    const backNode = WORLD_NODE_DATABASE.find((n: FishingSpotNode) => n.regionDatabaseId === region.id);
    const backHit = this.add.rectangle(76, 29, 120, 30, 0xffffff, 0).setInteractive({ useHandCursor: true });
    backHit.on('pointerdown', () => this.renderRegionMapView(region, backNode));
    backHit.on('pointerover', () => backText.setColor('#4af2a1'));
    backHit.on('pointerout', () => backText.setColor('#8faabf'));
    backBtn.add(backHit);
    this.spotContainer.add(backBtn);

    const title = this.add.text(152, 20, `📍 ${region.nameKo}`, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '18px', color: '#4af2a1', fontStyle: 'bold',
    });
    const hintText = this.add.text(152, 44, '포인트 클릭 → 이동 확인  [ESC] 지역 지도로', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px', color: '#607b8e',
    });
    this.spotContainer.add([title, hintText]);

    // ── 해당 지역 스팟 목록 ──────────────────────────────
    const spots = region.subSpotIds
      .map((id) => SPOT_DATABASE.find((s) => s.id === id))
      .filter((s): s is FishingSpotInfo => s !== undefined);

    spots.forEach((spot, idx) => {
      const itemY = 70 + idx * 54;
      const reqLicense = this.getRequiredLicense(spot.spotType);
      const hasLicense = GameState.hasLicense(reqLicense);
      const spotColor = this.getMarkerColor(spot.spotType);

      const itemBg = this.add.graphics();
      itemBg.fillStyle(hasLicense ? 0x0e1c2d : 0x111111, 0.9);
      itemBg.fillRoundedRect(16, itemY, 340, 46, 4);
      itemBg.lineStyle(1.5, hasLicense ? 0x2a5a8a : 0x333333, 0.8);
      itemBg.strokeRoundedRect(16, itemY, 340, 46, 4);

      const typeDot = this.add.circle(40, itemY + 23, 5, hasLicense ? spotColor : 0x444444);
      const nameText = this.add.text(54, itemY + 6, spot.name, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '13px', color: hasLicense ? '#e8f4fd' : '#555555', fontStyle: 'bold',
      });
      const speciesStr = spot.mainSpeciesIds.slice(0, 3)
        .map((id) => FISH_DATABASE.find((f) => f.id === id)?.nameKo ?? id).join(' / ');
      const subInfo = this.add.text(54, itemY + 25, `${this.getSpotTypeLabel(spot.spotType)}  ·  ${speciesStr}`, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '9px', color: hasLicense ? '#8faabf' : '#444444',
      });

      if (!hasLicense) {
        const lockIcon = this.add.text(334, itemY + 14, '🔒', { fontSize: '13px' });
        this.spotContainer.add(lockIcon);
      }

      const hit = this.add.rectangle(186, itemY + 23, 340, 46, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        itemBg.clear();
        itemBg.fillStyle(hasLicense ? 0x162a40 : 0x111111, 0.95);
        itemBg.fillRoundedRect(16, itemY, 340, 46, 4);
        itemBg.lineStyle(1.5, hasLicense ? 0x4af2a1 : 0x333333, 1);
        itemBg.strokeRoundedRect(16, itemY, 340, 46, 4);
        this.showSpotTooltip(spot, 370, itemY);
      });
      hit.on('pointerout', () => {
        itemBg.clear();
        itemBg.fillStyle(hasLicense ? 0x0e1c2d : 0x111111, 0.9);
        itemBg.fillRoundedRect(16, itemY, 340, 46, 4);
        itemBg.lineStyle(1.5, hasLicense ? 0x2a5a8a : 0x333333, 0.8);
        itemBg.strokeRoundedRect(16, itemY, 340, 46, 4);
        this.hideTooltip();
      });
      hit.on('pointerdown', () => {
        if (!hasLicense) { this.showLicenseBlockAlert(); return; }
        this.showConfirmModal(spot);
      });

      this.spotContainer.add([itemBg, typeDot, nameText, subInfo, hit]);

      // 지도 위 스팟 마커 (위경도 기반)
      this.drawSpotPinFromLatLon(spot, hasLicense);
    });
  }

  // ── 스팟 핀 (위경도 → 화면 좌표 변환) ──────────────
  private drawSpotPinFromLatLon(spot: FishingSpotInfo, hasLicense: boolean): void {
    // 한반도 위경도 범위 → 지도 이미지 상의 픽셀 좌표로 변환
    // 한반도 대략 범위: lat 33~38.5°, lon 124.5~130°
    const LAT_MIN = 33.0, LAT_MAX = 38.8;
    const LON_MIN = 124.3, LON_MAX = 130.5;
    const rx = (spot.longitude - LON_MIN) / (LON_MAX - LON_MIN);
    const ry = 1 - (spot.latitude - LAT_MIN) / (LAT_MAX - LAT_MIN);
    const x = MAP_DISPLAY_X + rx * MAP_DISPLAY_W;
    const y = MAP_DISPLAY_Y + ry * MAP_DISPLAY_H;

    const color = hasLicense ? this.getMarkerColor(spot.spotType) : 0x444444;
    const dot = this.add.circle(x, y, 5, color);
    const ring = this.add.circle(x, y, 10, color, 0);
    ring.setStrokeStyle(1.2, color);
    this.tweens.add({ targets: ring, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 1200, repeat: -1 });

    const label = this.add.text(x, y + 12, spot.name, {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '8px', color: hasLicense ? '#c8e8ff' : '#555555',
      backgroundColor: '#060f1ecc', padding: { x: 2, y: 1 },
    }).setOrigin(0.5, 0);

    dot.setInteractive(new Phaser.Geom.Circle(0, 0, 12), Phaser.Geom.Circle.Contains);
    dot.on('pointerdown', () => {
      if (!hasLicense) { this.showLicenseBlockAlert(); return; }
      this.showConfirmModal(spot);
    });

    this.pinContainer.add([dot, ring, label]);
  }

  // ═══════════════════════════════════════════════════════
  // 확인 모달 (CONFIRM_MODAL)
  // ═══════════════════════════════════════════════════════
  private showConfirmModal(spot: FishingSpotInfo): void {
    this.viewState = 'confirm';
    this.closeConfirmModal();

    this.confirmModal = new ConfirmTripModal(this, spot, {
      onConfirm: () => {
        this.closeConfirmModal();
        GameState.setCurrentSpot(spot.id);
        this.cameras.main.fadeOut(300, 0, 10, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('FieldScene', { spotId: spot.id });
        });
      },
      onCancel: () => {
        this.closeConfirmModal();
      },
    });
    this.add.existing(this.confirmModal);
  }

  private closeConfirmModal(): void {
    if (this.confirmModal) {
      this.confirmModal.destroy();
      this.confirmModal = null;
    }
    if (this.viewState === 'confirm') {
      this.viewState = 'spot';
    }
  }

  private switchToRegionView(): void {
    this.hideTooltip();
    this.renderRegionView();
  }

  // ═══════════════════════════════════════════════════════
  // 범례
  // ═══════════════════════════════════════════════════════
  private drawLegend(): void {
    const lx = GAME_WIDTH - 140;
    const ly = GAME_HEIGHT - 130;

    const bgG = this.add.graphics();
    bgG.fillStyle(0x06111e, 0.88);
    bgG.fillRoundedRect(lx - 10, ly - 10, 132, LEGEND_ITEMS.length * 22 + 24, 4);
    bgG.lineStyle(1, 0x1f3d5a, 0.7);
    bgG.strokeRoundedRect(lx - 10, ly - 10, 132, LEGEND_ITEMS.length * 22 + 24, 4);

    const legendTitle = this.add.text(lx + 50, ly - 4, '낚시 유형', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '9px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5, 1);

    this.regionContainer.add([bgG, legendTitle]);

    LEGEND_ITEMS.forEach((item, i) => {
      const dot = this.add.circle(lx + 6, ly + i * 22 + 6, 5, item.color);
      const label = this.add.text(lx + 18, ly + i * 22 - 1, item.label, {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '10px', color: '#a0b8c8',
      });
      this.regionContainer.add([dot, label]);
    });
  }

  // ═══════════════════════════════════════════════════════
  // 툴팁
  // ═══════════════════════════════════════════════════════
  private createTooltipContainer(): void {
    this.tooltipContainer = this.add.container(0, 0).setDepth(300).setVisible(false);

    const bg = this.add.graphics();
    const titleTxt = this.add.text(12, 10, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '13px', color: '#4af2a1', fontStyle: 'bold',
    });
    const bodyTxt = this.add.text(12, 30, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px', color: '#ccddee', lineSpacing: 4,
      wordWrap: { width: 200 },
    });
    const typeLine = this.add.text(12, 76, '', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '10px', color: '#8faabf',
    });
    this.tooltipContainer.add([bg, titleTxt, bodyTxt, typeLine]);
  }

  private showNodeTooltip(node: FishingSpotNode, x: number, y: number): void {
    if (!this.tooltipContainer) return;

    let px = x + 15;
    let py = y - 90;
    if (px + 230 > GAME_WIDTH) px = x - 245;
    if (py < 10) py = y + 15;

    this.tooltipContainer.setPosition(px, py);

    const bg = this.tooltipContainer.getAt(0) as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0x050f1e, 0.96);
    bg.fillRoundedRect(0, 0, 230, 100, 4);
    bg.lineStyle(1.5, 0x4af2a1, 0.9);
    bg.strokeRoundedRect(0, 0, 230, 100, 4);

    (this.tooltipContainer.getAt(1) as Phaser.GameObjects.Text).setText(node.name);
    (this.tooltipContainer.getAt(2) as Phaser.GameObjects.Text).setText(
      `포인트 ${node.spotsCount}개  ·  ${node.region}`
    );
    const typeLabels = node.availableTypes
      .map((t: string) => LEGEND_ITEMS.find((l) => l.type === t)?.label ?? t).join(' / ');
    (this.tooltipContainer.getAt(3) as Phaser.GameObjects.Text).setText(`낚시 유형: ${typeLabels}`);

    this.tooltipContainer.setVisible(true);
  }

  private showSpotTooltip(spot: FishingSpotInfo, x: number, y: number): void {
    if (!this.tooltipContainer) return;

    const date = new Date();
    const tide = calculateTideInfo(date);
    const mockTempC = 14 + Math.sin(((date.getMonth() + 1) / 6) * Math.PI) * 9;

    let px = x;
    let py = y - 10;
    if (px + 230 > GAME_WIDTH) px = x - 248;
    if (py < 10) py = 10;

    this.tooltipContainer.setPosition(px, py);

    const bg = this.tooltipContainer.getAt(0) as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0x050f1e, 0.96);
    bg.fillRoundedRect(0, 0, 230, 115, 4);
    bg.lineStyle(1.5, 0x4af2a1, 0.9);
    bg.strokeRoundedRect(0, 0, 230, 115, 4);

    (this.tooltipContainer.getAt(1) as Phaser.GameObjects.Text).setText(spot.name);

    const speciesNames = spot.mainSpeciesIds.slice(0, 3)
      .map((id) => FISH_DATABASE.find((f) => f.id === id)?.nameKo ?? id).join(', ');
    (this.tooltipContainer.getAt(2) as Phaser.GameObjects.Text).setText(
      `물때: ${tide.tidePhaseLabel}\n수온: ${(mockTempC - 1.2).toFixed(1)}°C\n주요 어종: ${speciesNames}`
    );
    (this.tooltipContainer.getAt(3) as Phaser.GameObjects.Text).setText(
      `[${this.getSpotTypeLabel(spot.spotType)}]`
    );

    this.tooltipContainer.setVisible(true);
  }

  private hideTooltip(): void {
    this.tooltipContainer?.setVisible(false);
  }

  private showLicenseBlockAlert(): void {
    const alertTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 56,
      '🔒 면허가 없어 이동할 수 없습니다. 필드에서 면허사무소를 이용해 주세요.', {
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '12px', color: '#ff4444',
        backgroundColor: '#050f1ecc', padding: { x: 12, y: 6 }, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(400);
    this.time.delayedCall(2800, () => alertTxt.destroy());
  }

  // ═══════════════════════════════════════════════════════
  // 유틸
  // ═══════════════════════════════════════════════════════
  private getMarkerColor(spotType: string): number {
    switch (spotType) {
      case 'breakwater':    return 0x00d2ff;
      case 'rocky_shore':   return 0xff6b6b;
      case 'boat_fishing':  return 0xffd700;
      case 'tidal_flat':    return 0x78e08f;
      case 'beach':         return 0xffe066;
      default:              return 0xffffff;
    }
  }

  private getSpotTypeLabel(spotType: string): string {
    const labels: Record<string, string> = {
      breakwater: '방파제', rocky_shore: '갯바위',
      boat_fishing: '선상', tidal_flat: '갯벌', beach: '해수욕장',
    };
    return labels[spotType] ?? spotType;
  }

  private getRequiredLicense(spotType: string): LicenseType {
    if (spotType === 'boat_fishing' || spotType === 'overnight_boat') return 'boat_angling';
    if (spotType === 'tidal_flat') return 'shore_hunting_basic';
    return 'basic_angling';
  }

  // ── 개발자 도구 진입 버튼 관련 ────────────────────────
  private createDevToolToggleButton(): void {
    const bx = GAME_WIDTH - 150;
    const bw = 132;
    const by = GAME_HEIGHT - 170;
    const bh = 32;

    this._devToolBtnBg = this.add.graphics().setDepth(250);
    this._devToolBtnText = this.add.text(bx + bw / 2, by + bh / 2, '🛠️ Dev Tool (P)', {
      fontFamily: '"Noto Sans KR", sans-serif',
      fontSize: '11px',
      color: '#a0b8c8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(251);

    this._devToolBtnHit = this.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0xffffff, 0)
      .setOrigin(0.5)
      .setDepth(252)
      .setInteractive({ useHandCursor: true });

    this._devToolBtnHit.on('pointerdown', () => {
      this.togglePinEditMode();
    });

    this._devToolBtnHit.on('pointerover', () => {
      if (this._pinEditMode) return;
      this.drawDevToolButtonState(true);
    });

    this._devToolBtnHit.on('pointerout', () => {
      if (this._pinEditMode) return;
      this.drawDevToolButtonState(false);
    });

    this.drawDevToolButtonState(false);
  }

  private drawDevToolButtonState(hover: boolean): void {
    if (!this._devToolBtnBg || !this._devToolBtnText) return;
    this._devToolBtnBg.clear();

    const bx = GAME_WIDTH - 150;
    const bw = 132;
    const by = GAME_HEIGHT - 170;
    const bh = 32;

    if (this._pinEditMode) {
      // 활성화 상태 (오렌지 배너 테마색)
      this._devToolBtnBg.fillStyle(0xff6b00, 0.95);
      this._devToolBtnBg.fillRoundedRect(bx, by, bw, bh, 4);
      this._devToolBtnBg.lineStyle(1.5, 0xffcc44, 1);
      this._devToolBtnBg.strokeRoundedRect(bx, by, bw, bh, 4);
      this._devToolBtnText.setColor('#ffffff');
      this._devToolBtnText.setText('🛠️ Dev Tool ON');
    } else {
      // 비활성화 상태 (일반 버튼)
      const bgColor = hover ? 0x162a40 : 0x0f253d;
      const strokeColor = hover ? 0x4af2a1 : 0x2a5a8a;
      const textColor = hover ? '#4af2a1' : '#a0b8c8';

      this._devToolBtnBg.fillStyle(bgColor, 0.9);
      this._devToolBtnBg.fillRoundedRect(bx, by, bw, bh, 4);
      this._devToolBtnBg.lineStyle(1.5, strokeColor, 0.8);
      this._devToolBtnBg.strokeRoundedRect(bx, by, bw, bh, 4);
      this._devToolBtnText.setColor(textColor);
      this._devToolBtnText.setText('🛠️ Dev Tool (P)');
    }
  }
}
