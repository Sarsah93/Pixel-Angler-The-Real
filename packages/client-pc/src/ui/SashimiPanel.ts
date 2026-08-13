/**
 * @file SashimiPanel.ts
 * @description 회썰기(사시미) 미니게임 — 순수 필렛을 측면 뷰에서 유도선을 따라 썬다 (2026-08-03).
 *
 * 손질하기(ButcheryPanel)와 **별도 과정**:
 *  - 일반 회뜨기 (14컷, 세로) — 야나기바 미만 회칼. 막칼은 등급 '특' 불가(상 캡 — 손질과 동일 규칙).
 *  - 고급 사시미 뜨기 (16컷, 사선) — **야나기바 이상 손 장착 시에만** (UtilizationPanel 버튼 게이트).
 *  컷 순서 = 머리쪽(오른쪽)부터 왼쪽으로 — 썰린 조각이 오른쪽으로 눕는 사시미 정석 연출.
 *
 * 스프라이트 = tools/gen_sashimi_fillet.cjs 생성 측면 뷰(원본 실사 리매핑, 384×144).
 * 컷 판정 = core evaluateCut 재사용(커버율+이탈), 유도선 배치 = core buildSashimiCutPaths.
 * 중단(X/ESC) = 필렛 보존 단순 취소 / 완료 후 = 사시미 지급 완료 상태라 그대로 닫힘.
 */

import Phaser from 'phaser';
import {
  evaluateCut, CutPoint, SASHIMI_MODES, SashimiMode, SashimiModeSpec, buildSashimiCutPaths,
  sashimiGradeFromQuality, getBestKnife, FISH_DATABASE, ENGAWA_CUTS, ENGAWA_PIECES,
  SASHIMI_CUT_OVERRIDES, cephByproductIcon,
} from '@tra/core';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { InventoryStore, InvItem } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { DraggablePanel, applyScreenFixed } from './DraggablePanel.js';
import { SASHIMI_FILLET_PROFILES, SASHIMI_FILLET_TEX, SashimiFilletFamily } from '../data/SashimiFilletProfiles.js';
import { butcherFamilyOf } from './PixelButcherFish.js';

const PANEL_W = 1080;
const PANEL_H = 620;

export interface SashimiCallbacks {
  /** 중단(필렛 보존) 닫기 */
  onClose: () => void;
  /** 완료 — 회 조각 지급 + 필렛 소모 후 호출. grantedId = 지급된 조각 아이템 id (도마 스테이징용) */
  onComplete: (grantedId?: string) => void;
}

export class SashimiPanel extends DraggablePanel {
  private readonly source: InvItem;
  private readonly cbs: SashimiCallbacks;
  private readonly mode: SashimiMode;

  private readonly fam: SashimiFilletFamily;
  /** 뷰 — 일반 = 탑뷰(위에서 본 필렛) / 고급 = 측면 뷰 (사용자 정정 2026-08-03) */
  private readonly view: 'top' | 'side';
  /**
   * 엔가와(넙치류 지느러미살) 스트립 모드 — **총 2컷 = 3조각** (사용자 지시 2026-08-05).
   * 실사 스트립 에셋(trim_engawa)을 탑뷰로 놓고 세로 2컷만 긋는다.
   */
  private readonly engawa: boolean;
  /**
   * 두족류 부산물 모드 (097차) — 엔가와와 같은 "특수 원물 분기" 문법:
   *  - mantle: 몸통살 — 가운데 가로 1컷(두 덩어리) + 세로 10컷(양 덩어리 관통) = **22점**
   *  - fin: 날개살 — 좌우 날개 2장 렌더, 각 1컷 = **4점**
   *  - arms: 다리부 — 1컷으로 촉완 분리 = **촉완 ×2 + 촉완이 제거된 다리부** (회 아님)
   *  - octoWhole: **삶은 문어** — 머리 밑동 3컷 = 삶은 문어 머리 ×1 + 다리 ×8 (098차 — 회 아님)
   *  - octoLeg: **삶은 문어 다리** — 사선 7컷 = 문어 숙회 한 점 ×8 (098차)
   */
  private readonly ceph: 'mantle' | 'fin' | 'arms' | 'octoWhole' | 'octoLeg' | null;
  /** 유효 모드 스펙 — 엔가와는 컷 수만 2로 오버라이드 */
  private readonly spec: SashimiModeSpec;
  /** 필렛/엔가와 표시 텍스처 키 */
  private readonly texKey: string;
  /** 필렛 표시 rect (패널 로컬 px) — 뷰별 스프라이트 비율에 맞춰 산출 */
  private readonly fr: { x: number; y: number; w: number; h: number };
  private readonly cutPaths: CutPoint[][];
  /** 컷 순서 인덱스(오른쪽→왼쪽) → cutPaths 인덱스 */
  private readonly cutOrder: number[];

  private cutIdx = 0;                       // 완료한 컷 수 = 다음 목표(cutOrder 인덱스)
  private readonly qualities: number[] = [];
  private done = false;

  private tracing = false;
  private tracePoints: CutPoint[] = [];
  /** 완료 시 지급된 회 조각 아이템 id — onComplete로 전달 (도마 스테이징) */
  private grantedPieceId?: string;

  // ── dev(F9) 유도선 편집 — 엔가와/순수 필렛 전 레이아웃 공통 (2026-08-07 사용자 지시) ──
  private editMode = false;
  private editDrag?: { path: number; pt: number };
  private editG?: Phaser.GameObjects.Graphics;
  private editC?: Phaser.GameObjects.Container;
  private f9Handler?: () => void;

  private filletImg!: Phaser.GameObjects.Image;
  private readonly pieces: Phaser.GameObjects.Image[] = [];
  /** 날개살 모드 — 좌우 날개 이미지 (컷 성공 시 반쪽 2장으로 교체) */
  private readonly finWings: (Phaser.GameObjects.Image | undefined)[] = [undefined, undefined];
  /** 몸통살 모드 — 가로 1컷 후의 위/아래 덩어리 (세로 컷마다 왼쪽 영역만 재굽기) */
  private mantleTopImg?: Phaser.GameObjects.Image;
  private mantleBotImg?: Phaser.GameObjects.Image;
  private mantleTopKey?: string;
  private mantleBotKey?: string;
  /** 베이킹 텍스처 키 일련번호 — 패널을 여러 번 열어도 키가 겹치지 않게 */
  private static bakeSeq = 0;
  /** 대각 절단면 베이킹으로 만든 캔버스 텍스처 키 — destroy에서 전부 해제 (87차) */
  private readonly bakedKeys: string[] = [];
  /** 남은 몸통 전용 캔버스 키 (컷마다 왼쪽 영역만 다시 굽는다) */
  private bodyBakeKey?: string;
  private boardG!: Phaser.GameObjects.Graphics;
  private guideG!: Phaser.GameObjects.Graphics;
  private traceG!: Phaser.GameObjects.Graphics;
  private flashG!: Phaser.GameObjects.Graphics;
  private uiC!: Phaser.GameObjects.Container;
  private progressTxt!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;

  private readonly sashimiMoveHandler: (p: Phaser.Input.Pointer) => void;
  private readonly sashimiUpHandler: (p: Phaser.Input.Pointer) => void;
  private readonly sashimiDownHandler: (p: Phaser.Input.Pointer) => void;

  /** 두족류 부산물 판별 — UtilizationPanel.cephSliceKind와 동일 id 규칙 (097차/098차) */
  private static cephKindOf(item: InvItem): 'mantle' | 'fin' | 'arms' | 'octoWhole' | 'octoLeg' | null {
    if (item.id.startsWith('inv_ceph_ceph_mantle_fillet_')) return 'mantle';
    if (item.id === 'inv_ceph_ceph_fin_meat') return 'fin';
    if (item.id === 'inv_ceph_ceph_arms') return 'arms';
    if (item.id === 'inv_octo_boiled_leg') return 'octoLeg';
    if (item.id.startsWith('inv_octo_boiled_') && item.id !== 'inv_octo_boiled_head') return 'octoWhole';
    return null;
  }

  private static cephLabel(kind: 'mantle' | 'fin' | 'arms' | 'octoWhole' | 'octoLeg'): string {
    return kind === 'mantle' ? '몸통살 회뜨기 (22점)'
      : kind === 'fin' ? '날개살 회뜨기 (4점)'
      : kind === 'octoWhole' ? '다리 분리 (머리 1 + 다리 8)'
      : kind === 'octoLeg' ? '숙회 썰기 (8점)' : '촉완 분리';
  }

  constructor(scene: Phaser.Scene, source: InvItem, mode: SashimiMode, cbs: SashimiCallbacks) {
    const spec = SASHIMI_MODES[mode];
    const cephKind = SashimiPanel.cephKindOf(source);
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2,
      y: (GAME_HEIGHT - PANEL_H) / 2,
      width: PANEL_W, height: PANEL_H,
      title: `회뜨기 — ${source.name} · ${cephKind ? SashimiPanel.cephLabel(cephKind) : spec.label}`,
      onClose: cbs.onClose, dim: true, depth: 910,
    });
    this.source = source;
    this.cbs = cbs;
    this.mode = mode;
    this.fam = butcherFamilyOf(source.speciesId ?? '');
    this.ceph = cephKind;
    // 엔가와 스트립 — 총 2컷 (사용자 지시 2026-08-05). 뷰는 항상 탑뷰(실사 스트립 에셋).
    this.engawa = !this.ceph && (source.subCategory === '엔가와' || source.id.startsWith('inv_engawa_'));
    this.spec = this.ceph
      ? {
        ...spec, label: SashimiPanel.cephLabel(this.ceph),
        cuts: this.ceph === 'mantle' ? 11 : this.ceph === 'fin' ? 2
          : this.ceph === 'octoWhole' ? 3 : this.ceph === 'octoLeg' ? 7 : 1,
        tolerance: Math.max(spec.tolerance, 0.1), minCoverage: Math.min(spec.minCoverage, 0.55),
      }
      : this.engawa ? { ...spec, cuts: ENGAWA_CUTS } : spec;
    // 일반 = 탑뷰(y plane 정면 — 위에서 본 필렛) / 고급 = 측면(z plane 정면) — 사용자 정정 2026-08-03
    this.view = this.engawa || this.ceph ? 'top' : mode === 'advanced' ? 'side' : 'top';
    this.texKey = this.ceph === 'octoWhole' ? 'trim_octo_boiled'          // 삶은 문어 실사 (098차)
      : this.ceph === 'octoLeg' ? 'trim_octo_boiled_leg'                  // 삶은 문어 다리 실사
      : this.ceph
        ? (cephByproductIcon(
          this.ceph === 'mantle' ? 'ceph_mantle_fillet' : this.ceph === 'fin' ? 'ceph_fin_meat' : 'ceph_arms',
          source.speciesId) ?? 'trim_ceph_mantle_squid')
        : this.engawa ? 'trim_engawa' : SASHIMI_FILLET_TEX[this.view][this.fam];

    // 닫기(X/ESC) — 완료 전 = 단순 취소(필렛 보존) / 완료 후 = onComplete로 정리
    this.requestClose = (): void => {
      if (this.done) this.cbs.onComplete(this.grantedPieceId);
      else this.cbs.onClose();
    };

    // ── 표시 rect — 뷰별 스프라이트 비율 유지 (폭 640 고정, 스테이지 세로 중앙) ──
    //  엔가와 = 실사 스트립 실제 비율 (512×74 ≈ 6.9:1 — 얇고 길게)
    const profAll = SASHIMI_FILLET_PROFILES[this.fam];
    const frW = 640;
    let aspect: number;
    if (this.engawa || this.ceph) {
      const src = this.scene.textures.get(this.texKey).getSourceImage() as { width: number; height: number };
      const texAspect = src.width && src.height ? src.width / src.height : 512 / 74;
      // 날개살 = 좌우 날개 2장 병렬 배치 → 표시 rect 종횡비는 (2장 + 간격) 기준
      aspect = this.ceph === 'fin' ? texAspect * 2.15 : texAspect;
    } else {
      aspect = this.view === 'top' ? profAll.top.aspect : 384 / 120;
    }
    const frH = Math.min(300, Math.round(frW / aspect));
    // 두족류 — 높이 캡에 걸리면 폭을 줄여 원본 비율 유지 (몸통살 사진이 왜곡되지 않게)
    const frW2 = this.ceph ? Math.min(frW, Math.round(frH * aspect)) : frW;
    this.fr = { x: 70 + Math.round((frW - frW2) / 2), y: 300 - Math.round(frH / 2), w: frW2, h: frH };

    // ── 두족류 — 고정 배치 컷 (윤곽 콜백 불필요. F9 오버라이드는 아래 공통 경로가 적용) ──
    if (this.ceph) {
      let paths: CutPoint[][];
      let order: number[];
      if (this.ceph === 'mantle') {
        // ① 가운데 가로 1컷(두 덩어리) → ② 세로 10컷 — 오른쪽부터 (양 덩어리 관통 = 22점)
        paths = [[{ x: 0.02, y: 0.5 }, { x: 0.98, y: 0.5 }]];
        for (let k = 1; k <= 10; k++) {
          const u = k / 11;
          paths.push([{ x: u, y: 0.04 }, { x: u, y: 0.96 }]);
        }
        order = [0, ...Array.from({ length: 10 }, (_, i) => 10 - i)];
      } else if (this.ceph === 'fin') {
        // 좌우 날개 각 1컷 — 오른쪽 날개부터
        paths = [
          [{ x: 0.245, y: 0.08 }, { x: 0.245, y: 0.92 }],
          [{ x: 0.755, y: 0.08 }, { x: 0.755, y: 0.92 }],
        ];
        order = [1, 0];
      } else if (this.ceph === 'octoWhole') {
        // 삶은 문어 — 머리 밑동을 감싸는 3컷 (좌 사선 → 아래 가로 → 우 사선. 근사 — F9 실측 대상)
        paths = [
          [{ x: 0.26, y: 0.30 }, { x: 0.38, y: 0.56 }],
          [{ x: 0.38, y: 0.62 }, { x: 0.60, y: 0.62 }],
          [{ x: 0.62, y: 0.56 }, { x: 0.73, y: 0.30 }],
        ];
        order = [0, 1, 2];
      } else if (this.ceph === 'octoLeg') {
        // 삶은 문어 다리 — 굵은 단면(오른쪽)부터 다리 결을 따라 **사선 7컷** (근사 — F9 실측 대상)
        paths = [
          [{ x: 0.82, y: 0.20 }, { x: 0.76, y: 0.52 }],
          [{ x: 0.74, y: 0.16 }, { x: 0.67, y: 0.48 }],
          [{ x: 0.65, y: 0.14 }, { x: 0.59, y: 0.45 }],
          [{ x: 0.56, y: 0.15 }, { x: 0.51, y: 0.47 }],
          [{ x: 0.47, y: 0.19 }, { x: 0.44, y: 0.52 }],
          [{ x: 0.38, y: 0.26 }, { x: 0.38, y: 0.60 }],
          [{ x: 0.29, y: 0.36 }, { x: 0.33, y: 0.68 }],
        ];
        order = [0, 1, 2, 3, 4, 5, 6];
      } else {
        // 다리부 — 촉완(오른쪽) 분리 1컷 (근사 — F9 실측 대상)
        paths = [[{ x: 0.70, y: 0.06 }, { x: 0.72, y: 0.94 }]];
        order = [0];
      }
      const cephOv = SASHIMI_CUT_OVERRIDES[this.overrideKey()];
      this.cutPaths = cephOv && cephOv.length === paths.length
        ? cephOv.map((path) => path.map((pt) => ({ ...pt })))
        : paths;
      this.cutOrder = order;

      this.buildBody();
      this.sashimiMoveHandler = (p): void => this.onMove(p);
      this.sashimiUpHandler = (p): void => this.onUp(p);
      this.sashimiDownHandler = (p): void => this.onDown(p);
      scene.input.on('pointermove', this.sashimiMoveHandler);
      scene.input.on('pointerup', this.sashimiUpHandler);
      scene.input.on('pointerdown', this.sashimiDownHandler);
      if (import.meta.env.DEV) {
        this.f9Handler = (): void => this.toggleEdit();
        scene.input.keyboard?.on('keydown-F9', this.f9Handler);
      }
      this.refreshGuide();
      applyScreenFixed(this);
      return;
    }

    // ── 컷 유도선 — 뷰별 윤곽 콜백으로 살코기 구간을 찾아 균등 배치 ──
    const interp = (arr: number[], u: number): number => {
      const n = arr.length;
      const f = Math.min(n - 1.001, Math.max(0, u * (n - 1)));
      const i = Math.floor(f), t = f - i;
      return arr[i] + (arr[Math.min(n - 1, i + 1)] - arr[i]) * t;
    };
    let topAt: (u: number) => number;
    let botAt: (u: number) => number;
    let meatH: (u: number) => number;
    let minMeat: number;
    if (this.engawa) {
      // 엔가와 스트립 — 평평한 밴드 (상·하 여백만 제외). 2컷 = 3등분
      topAt = () => 0.14;
      botAt = () => 0.86;
      meatH = () => 0.72;
      minMeat = 0.1;
    } else if (this.view === 'top') {
      // 탑뷰 — 유도선이 필렛 폭(상·하 윤곽 사이)을 가로지른다
      const tp = profAll.top;
      topAt = (u) => Math.min(0.98, interp(tp.topEdge, u));
      botAt = (u) => Math.min(0.98, interp(tp.botEdge, u));
      meatH = (u) => botAt(u) - topAt(u);
      minMeat = 0.3;
    } else {
      // 측면 — 윗면 실루엣 → 접지 라인
      const sp = profAll.side;
      topAt = (u) => {
        const v = interp(sp.top, u);
        return v >= 0.999 ? sp.baseY : Math.min(sp.baseY, v);
      };
      botAt = () => sp.baseY;
      meatH = (u) => sp.baseY - topAt(u);
      minMeat = 0.16;
    }
    // 살코기 구간 = 컷 길이가 충분한 u 범위 (얇은 끝단 제외)
    let u0 = 0.5, u1 = 0.5;
    for (let u = 0; u <= 1; u += 0.01) {
      if (meatH(u) >= minMeat) { u0 = u; break; }
    }
    for (let u = 1; u >= 0; u -= 0.01) {
      if (meatH(u) >= minMeat) { u1 = u; break; }
    }
    // 실측 오버라이드(dev F9 → SASHIMI_CUT_OVERRIDES) 우선 — 컷 수가 스펙과 다르면 자동 배치 폴백
    const built = buildSashimiCutPaths(this.spec, topAt, botAt, u0 + 0.01, u1 - 0.01, this.fr.w / this.fr.h);
    const ov = SASHIMI_CUT_OVERRIDES[this.overrideKey()];
    if (ov && ov.length !== this.spec.cuts) {
      console.warn(`[Sashimi] 오버라이드 '${this.overrideKey()}' 컷 수 불일치 (${ov.length} ≠ ${this.spec.cuts}) — 자동 배치 사용`);
    }
    this.cutPaths = ov && ov.length === this.spec.cuts
      ? ov.map((path) => path.map((pt) => ({ ...pt })))    // 사본 — 편집이 core 상수를 오염하지 않게
      : built;
    // 컷 순서 — 아랫점 x 내림차순(머리쪽 오른쪽부터)
    this.cutOrder = this.cutPaths.map((_, i) => i)
      .sort((a, b) => this.cutPaths[b][1].x - this.cutPaths[a][1].x);

    this.buildBody();

    // 씬 레벨 포인터 (트레이스가 rect 밖으로 나가도 추적 — ButcheryPanel 방식)
    this.sashimiMoveHandler = (p) => this.onMove(p);
    this.sashimiUpHandler = (p) => this.onUp(p);
    this.sashimiDownHandler = (p) => this.onDown(p);
    scene.input.on('pointermove', this.sashimiMoveHandler);
    scene.input.on('pointerup', this.sashimiUpHandler);
    scene.input.on('pointerdown', this.sashimiDownHandler);

    if (import.meta.env.DEV) {
      this.f9Handler = (): void => this.toggleEdit();
      scene.input.keyboard?.on('keydown-F9', this.f9Handler);
    }

    this.refreshGuide();
    applyScreenFixed(this);
  }

  /** 오버라이드 키 — 레이아웃 결정 인자(두족류 부위 / 엔가와 여부 / 어종군×모드) 단위 */
  private overrideKey(): string {
    return this.ceph ? `ceph_${this.ceph}` : this.engawa ? 'engawa' : `${this.fam}_${this.mode}`;
  }

  /** ESC 위임 진입점 (UtilizationPanel.onEscIntercept → 여기) */
  escClose(): void {
    this.requestClose();
  }

  // ═══════════════ 레이아웃 ═══════════════

  private buildBody(): void {
    const { x: fx, y: fy, w: fw, h: fh } = this.fr;
    const spec = this.spec;

    // 도마 — 탑뷰 = 필렛 뒤 전체 도마판 / 측면 = 접지 라인 나무 바
    this.boardG = this.scene.add.graphics();
    if (this.view === 'top') {
      const pad = 30;
      this.boardG.fillStyle(0x8a6a44, 1);
      this.boardG.fillRoundedRect(fx - pad, fy - pad, fw + pad * 2, fh + pad * 2, 12);
      this.boardG.fillStyle(0xa8845a, 1);
      this.boardG.fillRoundedRect(fx - pad + 10, fy - pad + 10, fw + pad * 2 - 20, fh + pad * 2 - 20, 10);
      this.boardG.lineStyle(2, 0x5a4028, 1);
      this.boardG.strokeRoundedRect(fx - pad, fy - pad, fw + pad * 2, fh + pad * 2, 12);
    } else {
      const barY = fy + SASHIMI_FILLET_PROFILES[this.fam].side.baseY * fh;
      this.boardG.fillStyle(0x8a6a44, 1);
      this.boardG.fillRoundedRect(fx - 26, barY, fw + 64, 22, 6);
      this.boardG.fillStyle(0xa8845a, 1);
      this.boardG.fillRoundedRect(fx - 22, barY + 3, fw + 56, 12, 5);
      this.boardG.lineStyle(1.5, 0x5a4028, 1);
      this.boardG.strokeRoundedRect(fx - 26, barY, fw + 64, 22, 6);
    }
    this.add(this.boardG);

    if (this.ceph === 'fin') {
      // 날개살 — **좌우 날개 2장** 병렬 (왼쪽은 미러. 097차 사용자 지시 "둘 다 한 번에")
      const wingW = fw * 0.45, gap = fw * 0.1;
      for (const s of [0, 1]) {
        const wing = this.scene.add.image(
          fx + (s === 0 ? wingW / 2 : wingW * 1.5 + gap), fy + fh / 2, this.texKey);
        wing.setDisplaySize(wingW, fh * 0.92);
        wing.setFlipX(s === 0);
        this.add(wing);
        this.finWings[s] = wing;
      }
      // 파이프라인 참조용 filletImg는 만들지 않는다 — fin 컷 연출은 finSliceFx가 전담
    } else {
      // 필렛 이미지 (뷰별 스프라이트 — 원본 실사 다운샘플/리매핑)
      this.filletImg = this.scene.add.image(fx + fw / 2, fy + fh / 2, this.texKey);
      this.filletImg.setDisplaySize(fw, fh);
      this.add(this.filletImg);
    }

    this.guideG = this.scene.add.graphics();
    this.traceG = this.scene.add.graphics();
    this.flashG = this.scene.add.graphics();
    this.uiC = this.scene.add.container(0, 0);
    this.add([this.guideG, this.traceG, this.flashG, this.uiC]);

    // ── 우측 사이드바 ──
    const sx = 760;
    const knife = getBestKnife(
      InventoryStore.items.filter((i) => i.tool === 'knife' && i.equipped).map((i) => i.id));
    const head = this.scene.add.text(sx, 96, spec.label, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '18px', color: '#ffd257', fontStyle: 'bold',
    });
    const sub = this.scene.add.text(sx, 126, [
      `사용 칼: ${knife?.nameKo ?? '없음'}`,
      this.ceph === 'mantle'
        ? '컷: 가운데 가로 1회(두 덩어리) + 세로 10회 — 양 덩어리를 관통해 총 22점'
        : this.ceph === 'fin' ? '컷: 날개당 1회 — 좌우 날개를 각각 반으로 (총 4점)'
        : this.ceph === 'arms' ? '컷: 1회 — 촉완 2가닥을 다리 뭉치에서 분리 (회가 아닌 요리 재료)'
        : this.ceph === 'octoWhole' ? '컷: 3회 — 머리 밑동을 따라 다리를 잘라냅니다 (삶은 문어 머리 1 + 다리 8)'
        : this.ceph === 'octoLeg' ? '컷: 사선 7회 — 다리 결을 따라 얇게 썰어 숙회 8점을 냅니다'
        : this.engawa
          ? `컷: 총 ${spec.cuts}회 — 짧은 지느러미살 스트립을 3등분합니다`
          : `컷 방향: ${this.mode === 'advanced' ? '사선 (소기즈쿠리) — 옆에서 본 뷰' : '세로 (히라즈쿠리) — 위에서 본 뷰'}`,
      '',
      this.ceph ? '노란 유도선 순서대로 드래그해 썰어냅니다.' : '머리쪽(오른쪽)부터 왼쪽으로,',
      this.ceph ? '유도선을 벗어나면 실패 — 다시 그으면 됩니다.' : '노란 유도선을 위 → 아래로 드래그해 썰어냅니다.',
      this.ceph ? '' : '유도선을 벗어나면 실패 — 다시 그으면 됩니다.',
    ].filter(Boolean).join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '12px', color: '#9fc0d4', lineSpacing: 6,
      wordWrap: { width: PANEL_W - sx - 30 },
    });
    this.progressTxt = this.scene.add.text(sx, 260, '', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#cfe3f2', lineSpacing: 8,
    });
    const escHint = this.scene.add.text(sx, PANEL_H - 48, 'ESC / X = 중단 (필렛은 그대로 보존)', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#5a6a78',
    });
    this.uiC.add([head, sub, this.progressTxt, escHint]);

    // dev: 유도선 편집 토글 버튼 (F9 동일 — 프로덕션 미렌더)
    if (import.meta.env.DEV) {
      const devBtn = this.scene.add.text(70, PANEL_H - 48, '[dev: 유도선 편집·F9]', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#66e2ff',
      }).setInteractive({ useHandCursor: true });
      devBtn.on('pointerdown', () => this.toggleEdit());
      this.uiC.add(devBtn);
    }
    this.refreshProgress();
  }

  // ═══════════════ dev(F9) 유도선 편집 ═══════════════

  /**
   * 유도선 편집 모드 — 각 컷의 위/아래 끝점을 드래그로 조정하고 [복사]로
   * `SASHIMI_CUT_OVERRIDES` 스니펫을 출력한다 (엔가와·순수 필렛·고급 전 레이아웃 공통).
   * F9 편집은 런타임 전용 — core 반영(붙여넣기 + 리빌드) 없이는 휘발된다.
   */
  private toggleEdit(): void {
    if (!import.meta.env.DEV || this.done) return;
    this.editMode = !this.editMode;
    this.editDrag = undefined;
    if (this.editMode && !this.editG) {
      this.editG = this.scene.add.graphics();
      this.add(this.editG);
      this.editC = this.scene.add.container(0, 0);
      const label = this.scene.add.text(70, PANEL_H - 76, `편집 중: '${this.overrideKey()}' — 끝점 드래그 · 썰기 입력 잠금`, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#ffd257',
      });
      const copyBg = this.scene.add.rectangle(320, PANEL_H - 42, 64, 22, 0x1a3a52)
        .setOrigin(0, 0.5).setStrokeStyle(1, 0x66e2ff).setInteractive({ useHandCursor: true });
      const copyTx = this.scene.add.text(352, PANEL_H - 42, '복사', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#cfe9f7',
      }).setOrigin(0.5);
      copyBg.on('pointerdown', () => this.copyEditSnippet());
      this.editC.add([label, copyBg, copyTx]);
      this.add(this.editC);
    }
    this.editG?.setVisible(this.editMode);
    this.editC?.setVisible(this.editMode);
    if (this.editMode) this.drawEditHandles();
    else this.editG?.clear();
    this.refreshGuide();
  }

  /** 편집 핸들 — 컷별 위(하늘)/아래(주황) 끝점 링. 완료 컷은 흐리게 */
  private drawEditHandles(): void {
    const g = this.editG;
    if (!g) return;
    g.clear();
    const doneSet = new Set(this.cutOrder.slice(0, this.cutIdx));
    this.cutPaths.forEach((path, i) => {
      const dim = doneSet.has(i);
      path.forEach((pt, j) => {
        const p = this.toPx(pt);
        g.lineStyle(2, j === 0 ? 0x66e2ff : 0xffa257, dim ? 0.35 : 0.95);
        g.strokeCircle(p.x, p.y, 7);
        g.fillStyle(j === 0 ? 0x66e2ff : 0xffa257, dim ? 0.2 : 0.6);
        g.fillCircle(p.x, p.y, 2.5);
      });
    });
  }

  /** 현재 유도선 전체를 SASHIMI_CUT_OVERRIDES 스니펫으로 복사 (클립보드 + 콘솔) */
  private copyEditSnippet(): void {
    const body = this.cutPaths.map((path) =>
      `  [${path.map((q) => `{ x: ${q.x.toFixed(3)}, y: ${q.y.toFixed(3)} }`).join(', ')}],`).join('\n');
    const snip = `'${this.overrideKey()}': [\n${body}\n],`;
    // eslint-disable-next-line no-console
    console.log('[SashimiPanel F9] SASHIMI_CUT_OVERRIDES 스니펫:\n' + snip);
    void navigator.clipboard?.writeText(snip).catch(() => { /* http 컨텍스트 등 — 콘솔로 대체 */ });
    this.flashToast('스니펫 복사됨 — core SASHIMI_CUT_OVERRIDES에 붙여넣고 리빌드');
  }

  // ═══════════════ 유도선 렌더 ═══════════════

  private toPx(p: CutPoint): { x: number; y: number } {
    return { x: this.fr.x + p.x * this.fr.w, y: this.fr.y + p.y * this.fr.h };
  }

  private refreshGuide(): void {
    const g = this.guideG;
    g.clear();
    if (this.done) return;
    const doneSet = new Set(this.cutOrder.slice(0, this.cutIdx));
    const curPath = this.cutOrder[this.cutIdx];
    for (let i = 0; i < this.cutPaths.length; i++) {
      const [top, bot] = this.cutPaths[i];
      const a = this.toPx(top), b = this.toPx(bot);
      // 완료 컷은 표시하지 않는다 — 조각이 오른쪽으로 이동해 원 좌표 자국은 잔상이 된다
      //  (분리·팬아웃 자체가 완료 피드백). dev 편집 중엔 전 선을 보여준다.
      if (!this.editMode && doneSet.has(i)) continue;
      const cur = i === curPath;
      // 점선 (현재 = 노랑 강조 / 대기 = 흐림)
      g.lineStyle(cur ? 2.5 : 1.2, cur ? 0xffe28a : 0x7a8a98, cur ? 0.98 : 0.4);
      const segs = 12;
      for (let s = 0; s < segs; s += 2) {
        const t0 = s / segs, t1 = (s + 1) / segs;
        g.lineBetween(
          a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0,
          a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1);
      }
      if (cur) {
        // 시작(위) 초록 링 / 끝(아래) 붉은 사각 / 진행 화살촉
        g.lineStyle(2, 0x4af2a1, 1);
        g.strokeCircle(a.x, a.y, 6);
        g.fillStyle(0xff6a5a, 1);
        g.fillRect(b.x - 4, b.y - 4, 8, 8);
        const mx = a.x + (b.x - a.x) * 0.6, my = a.y + (b.y - a.y) * 0.6;
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        g.fillStyle(0xffe28a, 1);
        g.fillTriangle(
          mx + Math.cos(ang) * 8, my + Math.sin(ang) * 8,
          mx + Math.cos(ang + 2.5) * 6, my + Math.sin(ang + 2.5) * 6,
          mx + Math.cos(ang - 2.5) * 6, my + Math.sin(ang - 2.5) * 6);
      }
    }
  }

  private refreshProgress(): void {
    const spec = this.spec;
    const avg = this.qualities.length
      ? this.qualities.reduce((s, q) => s + q, 0) / this.qualities.length : 0;
    this.progressTxt.setText([
      `컷  ${this.cutIdx} / ${spec.cuts}`,
      `평균 정확도  ${this.qualities.length ? Math.round(avg * 100) + '%' : '—'}`,
    ].join('\n'));
  }

  // ═══════════════ 입력 — 트레이스 & 판정 ═══════════════

  /** 패널 로컬 → 필렛 rect 정규화 */
  private toNorm(p: Phaser.Input.Pointer): CutPoint {
    return { x: (p.x - this.x - this.fr.x) / this.fr.w, y: (p.y - this.y - this.fr.y) / this.fr.h };
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.done || this.tracing) return;
    // dev 편집 — 핸들 잡기 (썰기 입력은 잠금)
    if (this.editMode) {
      const lx = p.x - this.x, ly = p.y - this.y;
      let best: { path: number; pt: number } | undefined;
      let bd = 14;
      this.cutPaths.forEach((path, i) => path.forEach((pt, j) => {
        const q = this.toPx(pt);
        const d = Math.hypot(q.x - lx, q.y - ly);
        if (d < bd) { bd = d; best = { path: i, pt: j }; }
      }));
      this.editDrag = best;
      return;
    }
    const n = this.toNorm(p);
    if (n.x < -0.08 || n.x > 1.08 || n.y < -0.15 || n.y > 1.15) return;   // 필렛 영역 근처만
    this.tracing = true;
    this.tracePoints = [n];
  }

  private onMove(p: Phaser.Input.Pointer): void {
    // dev 편집 — 잡은 끝점을 끌어 이동 (도마 밖 소폭 허용)
    if (this.editMode) {
      if (!this.editDrag) return;
      const n = this.toNorm(p);
      const pt = this.cutPaths[this.editDrag.path][this.editDrag.pt];
      pt.x = Math.max(-0.1, Math.min(1.1, n.x));
      pt.y = Math.max(-0.1, Math.min(1.1, n.y));
      this.refreshGuide();
      this.drawEditHandles();
      return;
    }
    if (!this.tracing) return;
    const n = this.toNorm(p);
    const last = this.tracePoints[this.tracePoints.length - 1];
    if (Math.hypot(n.x - last.x, n.y - last.y) < 0.004) return;
    this.tracePoints.push(n);
    // 트레이스 실버 라인
    const g = this.traceG;
    g.clear();
    g.lineStyle(2.5, 0xdfe9f2, 0.9);
    for (let i = 1; i < this.tracePoints.length; i++) {
      const a = this.toPx(this.tracePoints[i - 1]), b = this.toPx(this.tracePoints[i]);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  private onUp(_p: Phaser.Input.Pointer): void {
    if (this.editMode) { this.editDrag = undefined; return; }
    if (!this.tracing) return;
    this.tracing = false;
    this.traceG.clear();
    if (this.done) return;
    const spec = this.spec;
    const pathIdx = this.cutOrder[this.cutIdx];
    const r = evaluateCut(this.tracePoints, {
      id: `sashimi_${this.mode}_${pathIdx}`,
      orientationRequired: 'BASE', tool: 'knife',
      guidePath: this.cutPaths[pathIdx],
      tolerance: spec.tolerance, minCoverage: spec.minCoverage,
    });
    this.tracePoints = [];
    if (!r.passed) {
      this.flashToast(`커버율 부족 (${Math.round(r.coverage * 100)}%) — 유도선을 따라 다시 그으세요`);
      return;
    }
    this.qualities.push(r.quality);
    this.playSliceFx(pathIdx);
    this.cutIdx++;
    this.refreshGuide();
    this.refreshProgress();
    if (this.cutIdx >= spec.cuts) this.showResult();
  }

  // ═══════════════ 썰림 연출 ═══════════════

  /** 컷 성공 — 칼 섬광 + 조각 분리(오른쪽으로 눕기) */
  private playSliceFx(pathIdx: number): void {
    const [top, bot] = this.cutPaths[pathIdx];
    const a = this.toPx(top), b = this.toPx(bot);
    // 칼 섬광
    const f = this.flashG;
    f.clear();
    f.lineStyle(4, 0xffffff, 0.95);
    f.lineBetween(a.x, a.y, b.x, b.y);
    this.scene.tweens.addCounter({
      from: 1, to: 0, duration: 220,
      onUpdate: (tw) => f.setAlpha(tw.getValue() ?? 0),
      onComplete: () => { f.clear(); f.setAlpha(1); },
    });

    // 두족류 전용 연출 — 몸통살(가로 분리 + 양 덩어리 관통 세로컷) / 날개살(날개별 반쪽)
    if (this.ceph === 'mantle') { this.mantleSliceFx(pathIdx); return; }
    if (this.ceph === 'fin') { this.finSliceFx(pathIdx); return; }
    // 삶은 문어 다리 분리 — 조각 베이크 없이 몸이 살짝 벌어지는 진동 (결과는 완료 팝업이 보여준다)
    if (this.ceph === 'octoWhole') { this.octoWholeSliceFx(pathIdx); return; }
    // octoLeg(숙회)는 아래 기본 경로 그대로 — 조각이 잘려 오른쪽으로 밀리는 팬아웃 연출을 공유한다

    // ── 분리 조각 — 이번 컷(왼쪽 경계)과 직전 컷(오른쪽 경계) 사이 **대각 영역** ──
    //  구 구현은 setCrop(직사각)이라 컷이 기울어도 절단면이 수직으로 남았다 (사용자 리포트 2026-08-07).
    const tex = this.scene.textures.get(this.texKey).getSourceImage() as { width: number; height: number };
    const texW = tex.width, texH = tex.height;
    const left = this.cutLineTexX(pathIdx, texW);
    const right = this.cutIdx === 0
      ? { top: texW, bot: texW }                                   // 첫 조각의 오른쪽 = 텍스처 끝
      : this.cutLineTexX(this.cutOrder[this.cutIdx - 1], texW);

    const baked = this.bakeRegion(
      `sashimi_piece_${SashimiPanel.bakeSeq++}`,
      [[left.top, 0], [right.top, 0], [right.bot, texH], [left.bot, texH]],
      texW, texH,
    );
    if (baked) {
      const { w: frW, h: frH, x: frX, y: frY } = this.fr;
      const piece = this.scene.add.image(
        frX + ((baked.minX + baked.maxX) / 2 / texW) * frW, frY + frH / 2, baked.key,
      );
      piece.setDisplaySize(((baked.maxX - baked.minX) / texW) * frW, frH);
      this.addAt(piece, this.getIndex(this.guideG));   // 유도선 아래 레이어
      this.pieces.push(piece);
      // 새 조각이 오른쪽으로 눕는다 (사시미 팬 아웃)
      this.scene.tweens.add({
        targets: piece, x: piece.x + 8, angle: 2.5, duration: 240, ease: 'Cubic.easeOut',
      });
    }
    // 남은 몸통 = 이번 컷 **왼쪽 대각 영역**만 (전체 크기 캔버스로 다시 구워 위치·크기 불변)
    this.bakeBody([[0, 0], [left.top, 0], [left.bot, texH], [0, texH]], texW, texH);
    // 기존 조각도 조금씩 더 벌어짐
    for (let i = 0; i < this.pieces.length - 1; i++) {
      const pc = this.pieces[i];
      this.scene.tweens.add({ targets: pc, x: pc.x + 5, duration: 240, ease: 'Cubic.easeOut' });
    }
  }

  /** 캔버스 텍스처에 "원본을 그리고 poly만 남기기" — 몸통살 위/아래 덩어리 재굽기 공용 */
  private repaintCanvasRegion(key: string, poly: [number, number][], texW: number, texH: number): void {
    const cv = this.scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    const ctx = cv.getContext();
    ctx.clearRect(0, 0, texW, texH);
    ctx.drawImage(this.scene.textures.get(this.texKey).getSourceImage() as CanvasImageSource, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    poly.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    cv.refresh();
  }

  /**
   * 몸통살 연출 (097차) — 컷 ①(가로) = 위/아래 두 덩어리로 분리(아래가 살짝 내려앉음),
   * 컷 ②~⑪(세로) = **양 덩어리를 동시에 관통**해 각 덩어리에서 조각 1점씩 떨어져 나간다.
   */
  private mantleSliceFx(pathIdx: number): void {
    const tex = this.scene.textures.get(this.texKey).getSourceImage() as { width: number; height: number };
    const texW = tex.width, texH = tex.height;
    const { x: frX, y: frY, w: frW, h: frH } = this.fr;

    if (pathIdx === 0) {
      // ── 가로 1컷 — 위/아래 전체 크기 캔버스 2장 (표시 위치·크기 불변, 반대편은 투명) ──
      const mk = (y0: number, y1: number): string | null => {
        const key = `sashimi_mhalf_${SashimiPanel.bakeSeq++}`;
        if (!this.scene.textures.createCanvas(key, texW, texH)) return null;
        this.bakedKeys.push(key);
        this.repaintCanvasRegion(key, [[0, y0], [texW, y0], [texW, y1], [0, y1]], texW, texH);
        return key;
      };
      const tk = mk(0, texH / 2), bk = mk(texH / 2, texH);
      if (!tk || !bk) return;
      this.mantleTopKey = tk;
      this.mantleBotKey = bk;
      this.filletImg.setVisible(false);
      const mkImg = (key: string): Phaser.GameObjects.Image => {
        const img = this.scene.add.image(frX + frW / 2, frY + frH / 2, key);
        img.setDisplaySize(frW, frH);
        this.addAt(img, this.getIndex(this.guideG));
        return img;
      };
      this.mantleTopImg = mkImg(tk);
      this.mantleBotImg = mkImg(bk);
      this.scene.tweens.add({ targets: this.mantleTopImg, y: this.mantleTopImg.y - 4, duration: 240, ease: 'Cubic.easeOut' });
      this.scene.tweens.add({ targets: this.mantleBotImg, y: this.mantleBotImg.y + 7, duration: 240, ease: 'Cubic.easeOut' });
      return;
    }

    // ── 세로 컷 — 이번 컷(왼쪽)과 직전 세로 컷(오른쪽) 사이 스트립을 위/아래 각각 분리 ──
    const left = this.cutLineTexX(pathIdx, texW);
    // cutIdx 1 = 첫 세로 컷 (cutOrder[0]은 가로 컷이라 오른쪽 경계는 텍스처 끝)
    const right = this.cutIdx <= 1
      ? { top: texW, bot: texW }
      : this.cutLineTexX(this.cutOrder[this.cutIdx - 1], texW);
    const halves: { img?: Phaser.GameObjects.Image; key?: string; y0: number; y1: number; dy: number }[] = [
      { img: this.mantleTopImg, key: this.mantleTopKey, y0: 0, y1: texH / 2, dy: -4 },
      { img: this.mantleBotImg, key: this.mantleBotKey, y0: texH / 2, y1: texH, dy: 7 },
    ];
    for (const hh of halves) {
      if (!hh.img || !hh.key) continue;
      const baked = this.bakeRegion(
        `sashimi_piece_${SashimiPanel.bakeSeq++}`,
        [[left.top, hh.y0], [right.top, hh.y0], [right.bot, hh.y1], [left.bot, hh.y1]],
        texW, texH,
      );
      if (baked) {
        const piece = this.scene.add.image(
          frX + ((baked.minX + baked.maxX) / 2 / texW) * frW, frY + frH / 2 + hh.dy, baked.key);
        piece.setDisplaySize(((baked.maxX - baked.minX) / texW) * frW, frH);
        this.addAt(piece, this.getIndex(this.guideG));
        this.pieces.push(piece);
        this.scene.tweens.add({
          targets: piece, x: piece.x + 8, angle: hh.y0 === 0 ? 2 : -2, duration: 240, ease: 'Cubic.easeOut',
        });
      }
      // 남은 덩어리 = 이번 컷 왼쪽 영역만
      this.repaintCanvasRegion(hh.key, [[0, hh.y0], [left.top, hh.y0], [left.bot, hh.y1], [0, hh.y1]], texW, texH);
    }
    // 기존 조각도 조금씩 벌어짐
    for (let i = 0; i < this.pieces.length - 2; i++) {
      const pc = this.pieces[i];
      this.scene.tweens.add({ targets: pc, x: pc.x + 5, duration: 240, ease: 'Cubic.easeOut' });
    }
  }

  /**
   * 삶은 문어 다리 분리 연출 (098차) — 컷 방향으로 몸이 살짝 밀렸다 돌아오는 진동.
   * 3컷이 서로 다른 방향(좌 사선/가로/우 사선)이라 조각 베이크 대신 촉감만 준다 —
   * 실제 분리 결과(머리 1 + 다리 8)는 완료 팝업과 지급 아이템이 보여준다.
   */
  private octoWholeSliceFx(pathIdx: number): void {
    const img = this.filletImg;
    if (!img) return;
    const dx = pathIdx === 0 ? -5 : pathIdx === 2 ? 5 : 0;
    const dy = pathIdx === 1 ? 5 : 2;
    this.scene.tweens.add({
      targets: img, x: img.x + dx, y: img.y + dy, angle: dx * 0.5,
      yoyo: true, duration: 110, ease: 'Sine.easeInOut',
    });
  }

  /** 날개살 연출 (097차) — 해당 날개를 반쪽 2장으로 교체 후 벌어지는 팬아웃 */
  private finSliceFx(pathIdx: number): void {
    const wingIdx = pathIdx === 0 ? 0 : 1;
    const wing = this.finWings[wingIdx];
    if (!wing) return;
    const tex = this.scene.textures.get(this.texKey).getSourceImage() as { width: number; height: number };
    const texW = tex.width, texH = tex.height;
    const l = this.bakeRegion(`sashimi_finh_${SashimiPanel.bakeSeq++}`,
      [[0, 0], [texW / 2, 0], [texW / 2, texH], [0, texH]], texW, texH);
    const r = this.bakeRegion(`sashimi_finh_${SashimiPanel.bakeSeq++}`,
      [[texW / 2, 0], [texW, 0], [texW, texH], [texW / 2, texH]], texW, texH);
    if (!l || !r) return;
    const dw = wing.displayWidth, dh = wing.displayHeight;
    const mkHalf = (key: string, texLeft: boolean): Phaser.GameObjects.Image => {
      // 미러(flipX) 날개는 텍스처 왼쪽 반이 화면 오른쪽에 보인다 — 배치 부호 반전
      const side = texLeft !== wing.flipX ? -1 : 1;
      const img = this.scene.add.image(wing.x + side * dw / 4, wing.y, key);
      img.setDisplaySize(dw / 2, dh);
      img.setFlipX(wing.flipX);
      this.addAt(img, this.getIndex(this.guideG));
      this.pieces.push(img);
      this.scene.tweens.add({
        targets: img, x: img.x + side * 7, angle: side * 2.5, duration: 240, ease: 'Cubic.easeOut',
      });
      return img;
    };
    mkHalf(l.key, true);
    mkHalf(r.key, false);
    wing.destroy();
    this.finWings[wingIdx] = undefined;
  }

  /**
   * 컷 경로를 텍스처 상·하단(y=0 / y=texH)까지 연장한 x (텍스처 px).
   * 컷은 2점(윗점·아랫점)이지만 살 밖에서 시작·끝나므로 경계까지 외삽해야 영역이 닫힌다.
   * 수평에 가까운 퇴화 경로는 아랫점 기준 수직선으로 폴백.
   */
  private cutLineTexX(pathIdx: number, texW: number): { top: number; bot: number } {
    const path = this.cutPaths[pathIdx];
    const a = path[0], b = path[path.length - 1];
    const clamp = (v: number): number => Math.max(0, Math.min(texW, v));
    if (Math.abs(b.y - a.y) < 1e-4) return { top: clamp(b.x * texW), bot: clamp(b.x * texW) };
    const slope = (b.x - a.x) / (b.y - a.y);                 // dx/dy (정규화)
    return {
      top: clamp((a.x + slope * (0 - a.y)) * texW),
      bot: clamp((a.x + slope * (1 - a.y)) * texW),
    };
  }

  /**
   * 다각형 영역만 남긴 캔버스 텍스처를 굽는다 (bbox로 잘라 최소 크기).
   * `destination-in` 합성 — 50차 `bakeTintedTrim`과 같은 패턴. 마스크를 쓰지 않는 이유는
   * GeometryMask가 **월드 좌표**라 패널 드래그·조각 트윈마다 재계산이 필요하기 때문.
   */
  private bakeRegion(key: string, poly: [number, number][], texW: number, texH: number):
  { key: string; minX: number; maxX: number } | null {
    const xs = poly.map((p) => p[0]);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const maxX = Math.min(texW, Math.ceil(Math.max(...xs)));
    const w = maxX - minX;
    if (w < 1) return null;
    const cv = this.scene.textures.createCanvas(key, w, texH);
    if (!cv) return null;
    const ctx = cv.getContext();
    ctx.clearRect(0, 0, w, texH);
    ctx.drawImage(this.scene.textures.get(this.texKey).getSourceImage() as CanvasImageSource, -minX, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    poly.forEach(([px, py], i) => (i ? ctx.lineTo(px - minX, py) : ctx.moveTo(px - minX, py)));
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    cv.refresh();
    this.bakedKeys.push(key);
    return { key, minX, maxX };
  }

  /** 남은 몸통 재굽기 — 전체 크기 캔버스라 filletImg의 위치·표시 크기는 그대로 유지된다 */
  private bakeBody(poly: [number, number][], texW: number, texH: number): void {
    if (!this.bodyBakeKey) {
      const key = `sashimi_body_${SashimiPanel.bakeSeq++}`;
      if (!this.scene.textures.createCanvas(key, texW, texH)) return;
      this.bodyBakeKey = key;
      this.bakedKeys.push(key);
    }
    const cv = this.scene.textures.get(this.bodyBakeKey) as Phaser.Textures.CanvasTexture;
    const ctx = cv.getContext();
    ctx.clearRect(0, 0, texW, texH);
    ctx.drawImage(this.scene.textures.get(this.texKey).getSourceImage() as CanvasImageSource, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    poly.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    cv.refresh();
    if (this.filletImg.texture.key !== this.bodyBakeKey) {
      const { w, h } = this.fr;
      this.filletImg.setTexture(this.bodyBakeKey);
      this.filletImg.setDisplaySize(w, h);
    }
  }

  private flashToast(msg: string): void {
    this.toast?.destroy();
    const t = this.scene.add.text(this.fr.x + this.fr.w / 2, this.fr.y - 26, msg, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#ff9a8a', fontStyle: 'bold',
      backgroundColor: '#0a1628ee', padding: { x: 12, y: 6 },
    }).setOrigin(0.5);
    this.add(t);
    this.toast = t;
    this.scene.time.delayedCall(1600, () => {
      t.destroy();
      if (this.toast === t) this.toast = undefined;
    });
  }

  // ═══════════════ 완료 — 사시미 지급 ═══════════════

  private showResult(): void {
    this.done = true;
    this.guideG.clear();
    const spec = this.spec;
    const speciesId = this.source.speciesId ?? '';
    const fishDef = FISH_DATABASE.find((fd) => fd.id === speciesId);
    const nameKo = fishDef?.nameKo ?? '생선';

    const avg = this.qualities.reduce((s, q) => s + q, 0) / Math.max(1, this.qualities.length);
    let { grade, mult } = sashimiGradeFromQuality(avg);
    // 막칼(utility)은 '특' 불가 — 손질과 동일한 캡 규칙
    const knife = getBestKnife(
      InventoryStore.items.filter((i) => i.tool === 'knife' && i.equipped).map((i) => i.id));
    if (knife?.tier === 'utility' && grade === '특') { grade = '상'; mult = 1.25; }

    // ── 다리부 촉완 분리 (097차) — 회 조각이 아니라 **촉완 ×2 + 촉완이 제거된 다리부** ──
    if (this.ceph === 'arms') {
      const seqA = InventoryStore.nextCatchSeq();
      InventoryStore.addItem({
        id: 'inv_ceph_ceph_tentacle', name: '촉완(긴 다리)', icon: '🦑',
        iconTexture: cephByproductIcon('ceph_tentacle', speciesId),
        category: 'food', subCategory: '부산물', basePrice: 700,
        condition: 'live', conditionSinceMs: Date.now(), equippable: false, speciesId,
      }, 2);
      InventoryStore.addItem({
        id: `inv_ceph_arms_only_${speciesId}_${seqA}`,
        name: `촉완이 제거된 ${nameKo} 다리부`, icon: '🦑',
        iconTexture: cephByproductIcon('ceph_arms', speciesId, { tentacleRemoved: true }),
        category: 'food', subCategory: '부산물',
        basePrice: Math.max(1200, Math.round((this.source.basePrice || 1800) * 0.8)),
        condition: 'live', conditionSinceMs: Date.now(), equippable: false, speciesId,
      }, 1);
      InventoryStore.removeQty(this.source.id, 1);
      this.grantedPieceId = undefined;                       // 회 조각 아님 — 도마 스테이징 없음
      const xpA = Math.round(6 + avg * 10);
      const lvA = GameState.addFilletingXp(xpA);
      this.buildResultOverlay('촉완 분리 완료!', [
        `촉완(긴 다리) ×2 + 촉완이 제거된 ${nameKo} 다리부 ×1`,
        `평균 정확도 ${Math.round(avg * 100)}%  ·  손질 스킬 +${xpA} XP${lvA.leveledUp ? `  ★ 레벨업! Lv.${lvA.level} ★` : ''}`,
        '다리부는 회가 아닌 요리 재료입니다 — 촉완은 판매·미끼로도 쓸 수 있습니다',
      ]);
      return;
    }

    // ── 삶은 문어 다리 분리 (098차) — 회 조각이 아니라 **머리 ×1 + 다리 ×8** ──
    if (this.ceph === 'octoWhole') {
      const gW = this.source.weightG ?? 640;
      const headG = Math.max(1, Math.round(gW * 0.28));
      const legG = Math.max(1, Math.round((gW - headG) / 8));
      const basePrice = this.source.basePrice || 2500;
      InventoryStore.addItem({
        id: 'inv_octo_boiled_head', name: '삶은 문어 머리', icon: '🐙',
        iconTexture: 'trim_octo_boiled_head',
        category: 'food', subCategory: '요리(삶음)',
        basePrice: Math.max(500, Math.round(basePrice * 0.2)),
        condition: 'fresh', conditionSinceMs: Date.now(), equippable: false, weightG: headG,
      }, 1);
      InventoryStore.addItem({
        id: 'inv_octo_boiled_leg', name: '삶은 문어 다리', icon: '🐙',
        iconTexture: 'trim_octo_boiled_leg',
        category: 'food', subCategory: '요리(삶음)',
        basePrice: Math.max(400, Math.round(basePrice * 0.8 / 8)),
        condition: 'fresh', conditionSinceMs: Date.now(), equippable: false,
        speciesId, weightG: legG,
      }, 8);
      InventoryStore.removeItem(this.source.id, false);
      this.grantedPieceId = undefined;                       // 회 조각 아님 — 도마 스테이징 없음
      const xpW = Math.round(8 + avg * 12);
      const lvW = GameState.addFilletingXp(xpW);
      this.buildResultOverlay('다리 분리 완료!', [
        `삶은 문어 머리 ×1 (${headG}g) + 삶은 문어 다리 ×8 (${legG}g/개)`,
        `평균 정확도 ${Math.round(avg * 100)}%  ·  손질 스킬 +${xpW} XP${lvW.leveledUp ? `  ★ 레벨업! Lv.${lvW.level} ★` : ''}`,
        '다리를 도마에 올리면 [숙회 썰기 (8점)]로 문어 숙회를 낼 수 있습니다',
      ]);
      return;
    }

    const weightG = this.source.weightG
      ?? (this.ceph === 'mantle' ? 350 : this.ceph === 'fin' ? 60 : this.ceph === 'octoLeg' ? 150 : 200);
    // 회 조각 — 접시 플레이팅 재료 (가격 개편 2026-08-03: 완성 사시미 가치는 **접시 완성 시**
    //  모듬/단품 가격표로 산정. 조각 자체는 원물 필렛 가치를 점수로 분할해 승계).
    //  엔가와 = 2컷 → **3조각** / 몸통살 = 11컷 → **22점**(양 덩어리 관통) / 날개살 = 2컷 → **4점**
    const pieceCount = this.ceph === 'mantle' ? 22 : this.ceph === 'fin' ? 4
      : this.ceph === 'octoLeg' ? 8
      : this.engawa ? ENGAWA_PIECES : spec.cuts;
    const perPieceG = Math.max(1, Math.round(weightG / pieceCount));
    const pieceValue = Math.max(100, Math.round((this.source.basePrice || 2000) * (mult / 1.5) / pieceCount * spec.priceMult));
    const xp = Math.round((this.engawa ? 6 : this.ceph === 'fin' ? 8 : this.ceph === 'mantle' ? 12 : 10) + avg * 20 + (this.mode === 'advanced' ? 8 : 0));
    const lv = GameState.addFilletingXp(xp);

    // 회 조각 지급 + 원물 필렛/엔가와/부산물 소모 (고급 = id 'adv' — 접시/스시 판별)
    //  아이콘 = 엔가와는 실사 스트립 / 두족류는 부위 실사 / 필렛은 탑뷰 슬라이스(sashimi_piece_{fam})
    //  문어 숙회(098차)는 전용 실사('문어 숙회 한점') — 이름도 사용자 지정 명칭 그대로.
    const partLbl = this.ceph === 'mantle' ? '몸통살 ' : this.ceph === 'fin' ? '날개살 '
      : this.engawa ? '엔가와 ' : '';
    const seq = InventoryStore.nextCatchSeq();
    const grantedId = `inv_sashimi_cut_${this.mode === 'advanced' ? 'adv_' : ''}`
      + `${this.ceph ? `ceph_${this.ceph}_` : this.engawa ? 'engw_' : ''}${speciesId}_${seq}`;
    const octoLeg = this.ceph === 'octoLeg';
    const grantedName = octoLeg
      ? `문어 숙회 한 점 (${grade}) ${perPieceG}g`
      : `${nameKo} ${spec.namePrefix}${partLbl}회 조각 (${grade}) ${perPieceG}g`;
    InventoryStore.addItem({
      id: grantedId,
      name: grantedName,
      icon: '🍣',
      iconTexture: octoLeg ? 'sashimi_piece_octopus'
        : this.ceph ? this.texKey : this.engawa ? 'trim_engawa' : `sashimi_piece_${this.fam}`,
      category: 'food', subCategory: '회(사시미)',
      basePrice: pieceValue,
      condition: 'fresh', conditionSinceMs: Date.now(),
      equippable: false,
      speciesId, weightG: perPieceG,
    }, pieceCount);
    this.grantedPieceId = grantedId;
    // 날개살·삶은 문어 다리는 공유 스택 — 1개만 소모 (몸통살/필렛은 개체 아이템 통째)
    if (this.ceph === 'fin' || octoLeg) InventoryStore.removeQty(this.source.id, 1);
    else InventoryStore.removeItem(this.source.id, false);

    this.buildResultOverlay(`${spec.label} 완료!`, [
      octoLeg
        ? `문어 숙회 한 점 (${grade}) ×${pieceCount}점  —  ${perPieceG}g/점`
        : `${nameKo} ${spec.namePrefix}${partLbl}회 조각 (${grade}) ×${pieceCount}점  —  ${perPieceG}g/점`,
      `평균 정확도 ${Math.round(avg * 100)}%  ·  조각당 ${pieceValue.toLocaleString()}원`,
      `손질 스킬 +${xp} XP${lv.leveledUp ? `  ★ 레벨업! Lv.${lv.level} ★` : ''}`,
      '요리 탭 [사시미 만들기]에서 접시에 담아 사시미를 완성하세요 (모듬/단품)',
      this.mode === 'advanced' ? "고급 회 조각은 '스시' 요리 재료로도 쓸 수 있습니다 (추후)" : '',
    ]);
  }

  /** 결과 오버레이 — 필렛/엔가와/두족류 공용 (제목 + 본문 + [확인] → onComplete) */
  private buildResultOverlay(titleTxt: string, lines: string[]): void {
    const c = this.scene.add.container(0, 0);
    // 두족류처럼 표시 rect가 좁아도 본문이 감기지 않게 최소 폭 520 보장 (fr 중앙 정렬)
    const bw = Math.max(520, this.fr.w - 120);
    const bx = this.fr.x + this.fr.w / 2 - bw / 2;
    const by = this.fr.y - 30, bh = Math.max(240, this.fr.h + 60);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.96);
    bg.fillRoundedRect(bx, by, bw, bh, 8);
    bg.lineStyle(2, 0x4af2a1, 0.95);
    bg.strokeRoundedRect(bx, by, bw, bh, 8);
    c.add(bg);
    const title = this.scene.add.text(bx + bw / 2, by + 34, titleTxt, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffd257', fontStyle: 'bold',
    }).setOrigin(0.5);
    const body = this.scene.add.text(bx + bw / 2, by + 64, lines.filter(Boolean).join('\n'), {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#cfe3f2',
      lineSpacing: 8, align: 'center', wordWrap: { width: bw - 60 },
    }).setOrigin(0.5, 0);
    c.add([title, body]);
    const okBg = this.scene.add.graphics();
    okBg.fillStyle(0x0d4a2e, 0.96);
    okBg.fillRoundedRect(bx + bw / 2 - 60, by + bh - 52, 120, 32, 6);
    okBg.lineStyle(1.5, 0x4af2a1, 0.95);
    okBg.strokeRoundedRect(bx + bw / 2 - 60, by + bh - 52, 120, 32, 6);
    const okTxt = this.scene.add.text(bx + bw / 2, by + bh - 36, '확인', {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#4af2a1', fontStyle: 'bold',
    }).setOrigin(0.5);
    const okHit = this.scene.add.rectangle(bx + bw / 2, by + bh - 36, 120, 32, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    okHit.on('pointerdown', () => this.cbs.onComplete(this.grantedPieceId));
    c.add([okBg, okTxt, okHit]);
    this.add(c);
    applyScreenFixed(this);
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.input?.off('pointermove', this.sashimiMoveHandler);
    this.scene?.input?.off('pointerup', this.sashimiUpHandler);
    this.scene?.input?.off('pointerdown', this.sashimiDownHandler);
    if (this.f9Handler) this.scene?.input?.keyboard?.off('keydown-F9', this.f9Handler);
    // 대각 절단면 캔버스 텍스처 해제 — 안 지우면 세션마다 누적된다 (조각당 1장 + 몸통 1장)
    this.bakedKeys.forEach((k) => this.scene?.textures?.remove(k));
    this.bakedKeys.length = 0;
    super.destroy(fromScene);
  }
}
