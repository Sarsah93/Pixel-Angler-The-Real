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

  private filletImg!: Phaser.GameObjects.Image;
  private readonly pieces: Phaser.GameObjects.Image[] = [];
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

  constructor(scene: Phaser.Scene, source: InvItem, mode: SashimiMode, cbs: SashimiCallbacks) {
    const spec = SASHIMI_MODES[mode];
    super(scene, {
      x: (GAME_WIDTH - PANEL_W) / 2,
      y: (GAME_HEIGHT - PANEL_H) / 2,
      width: PANEL_W, height: PANEL_H,
      title: `회뜨기 — ${source.name} · ${spec.label}`,
      onClose: cbs.onClose, dim: true, depth: 910,
    });
    this.source = source;
    this.cbs = cbs;
    this.mode = mode;
    this.fam = butcherFamilyOf(source.speciesId ?? '');
    // 엔가와 스트립 — 총 2컷 (사용자 지시 2026-08-05). 뷰는 항상 탑뷰(실사 스트립 에셋).
    this.engawa = source.subCategory === '엔가와' || source.id.startsWith('inv_engawa_');
    this.spec = this.engawa ? { ...spec, cuts: ENGAWA_CUTS } : spec;
    // 일반 = 탑뷰(y plane 정면 — 위에서 본 필렛) / 고급 = 측면(z plane 정면) — 사용자 정정 2026-08-03
    this.view = this.engawa ? 'top' : mode === 'advanced' ? 'side' : 'top';
    this.texKey = this.engawa ? 'trim_engawa' : SASHIMI_FILLET_TEX[this.view][this.fam];

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
    if (this.engawa) {
      const src = this.scene.textures.get(this.texKey).getSourceImage() as { width: number; height: number };
      aspect = src.width && src.height ? src.width / src.height : 512 / 74;
    } else {
      aspect = this.view === 'top' ? profAll.top.aspect : 384 / 120;
    }
    const frH = Math.min(300, Math.round(frW / aspect));
    this.fr = { x: 70, y: 300 - Math.round(frH / 2), w: frW, h: frH };

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
    this.cutPaths = buildSashimiCutPaths(this.spec, topAt, botAt, u0 + 0.01, u1 - 0.01, this.fr.w / this.fr.h);
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

    this.refreshGuide();
    applyScreenFixed(this);
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

    // 필렛 이미지 (뷰별 스프라이트 — 원본 실사 다운샘플/리매핑)
    this.filletImg = this.scene.add.image(fx + fw / 2, fy + fh / 2, this.texKey);
    this.filletImg.setDisplaySize(fw, fh);
    this.add(this.filletImg);

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
      this.engawa
        ? `컷: 총 ${spec.cuts}회 — 짧은 지느러미살 스트립을 3등분합니다`
        : `컷 방향: ${this.mode === 'advanced' ? '사선 (소기즈쿠리) — 옆에서 본 뷰' : '세로 (히라즈쿠리) — 위에서 본 뷰'}`,
      '',
      '머리쪽(오른쪽)부터 왼쪽으로,',
      '노란 유도선을 위 → 아래로 드래그해 썰어냅니다.',
      '유도선을 벗어나면 실패 — 다시 그으면 됩니다.',
    ].join('\n'), {
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
    this.refreshProgress();
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
      //  (분리·팬아웃 자체가 완료 피드백)
      if (doneSet.has(i)) continue;
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
    const n = this.toNorm(p);
    if (n.x < -0.08 || n.x > 1.08 || n.y < -0.15 || n.y > 1.15) return;   // 필렛 영역 근처만
    this.tracing = true;
    this.tracePoints = [n];
  }

  private onMove(p: Phaser.Input.Pointer): void {
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

    // 분리 조각 — 이번 컷(왼쪽 경계)과 직전 컷(오른쪽 경계) 사이 세로 크롭
    const texKey = this.texKey;
    const tex = this.scene.textures.get(texKey).getSourceImage();
    const texW = tex.width, texH = tex.height;
    const leftU = this.cutPaths[pathIdx][1].x;
    const rightU = this.cutIdx === 0
      ? 1
      : this.cutPaths[this.cutOrder[this.cutIdx - 1]][1].x;
    const cropX = Math.floor(leftU * texW);
    const cropW = Math.max(2, Math.ceil((rightU - leftU) * texW));
    const piece = this.scene.add.image(this.filletImg.x, this.filletImg.y, texKey);
    piece.setDisplaySize(this.fr.w, this.fr.h);
    piece.setCrop(cropX, 0, cropW, texH);
    this.addAt(piece, this.getIndex(this.guideG));   // 유도선 아래 레이어
    this.pieces.push(piece);
    // 남은 몸통 = 이번 컷 왼쪽만 표시
    this.filletImg.setCrop(0, 0, cropX, texH);
    // 새 조각 + 기존 조각 오른쪽으로 벌어짐 (사시미 눕는 팬 아웃)
    this.scene.tweens.add({ targets: piece, x: piece.x + 8, angle: 2.5, duration: 240, ease: 'Cubic.easeOut' });
    for (let i = 0; i < this.pieces.length - 1; i++) {
      const pc = this.pieces[i];
      this.scene.tweens.add({ targets: pc, x: pc.x + 5, duration: 240, ease: 'Cubic.easeOut' });
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

    const weightG = this.source.weightG ?? 200;
    // 회 조각 — 접시 플레이팅 재료 (가격 개편 2026-08-03: 완성 사시미 가치는 **접시 완성 시**
    //  모듬/단품 가격표로 산정. 조각 자체는 원물 필렛 가치를 점수로 분할해 승계).
    //  엔가와 = 2컷 → **3조각**(스트립 3등분 — 잔여 없음. ENGAWA_PIECES)
    const pieceCount = this.engawa ? ENGAWA_PIECES : spec.cuts;
    const perPieceG = Math.max(1, Math.round(weightG / pieceCount));
    const pieceValue = Math.max(100, Math.round((this.source.basePrice || 2000) * (mult / 1.5) / pieceCount * spec.priceMult));
    const xp = Math.round((this.engawa ? 6 : 10) + avg * 20 + (this.mode === 'advanced' ? 8 : 0));
    const lv = GameState.addFilletingXp(xp);

    // 회 조각 지급 + 원물 필렛/엔가와 소모 (고급 = id 'adv' — 접시/스시 판별)
    //  아이콘 = 엔가와는 실사 스트립 / 필렛은 탑뷰 한 점 슬라이스(sashimi_piece_{fam})
    const seq = InventoryStore.nextCatchSeq();
    const grantedId = `inv_sashimi_cut_${this.mode === 'advanced' ? 'adv_' : ''}${this.engawa ? 'engw_' : ''}${speciesId}_${seq}`;
    InventoryStore.addItem({
      id: grantedId,
      name: this.engawa
        ? `${nameKo} ${spec.namePrefix}엔가와 회 조각 (${grade}) ${perPieceG}g`
        : `${nameKo} ${spec.namePrefix}회 조각 (${grade}) ${perPieceG}g`,
      icon: '🍣', iconTexture: this.engawa ? 'trim_engawa' : `sashimi_piece_${this.fam}`,
      category: 'food', subCategory: '회(사시미)',
      basePrice: pieceValue,
      condition: 'fresh', conditionSinceMs: Date.now(),
      equippable: false,
      speciesId, weightG: perPieceG,
    }, pieceCount);
    this.grantedPieceId = grantedId;
    InventoryStore.removeItem(this.source.id, false);

    // 결과 오버레이
    const c = this.scene.add.container(0, 0);
    const bx = this.fr.x + 60, by = this.fr.y - 30, bw = this.fr.w - 120, bh = this.fr.h + 60;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x081422, 0.96);
    bg.fillRoundedRect(bx, by, bw, bh, 8);
    bg.lineStyle(2, 0x4af2a1, 0.95);
    bg.strokeRoundedRect(bx, by, bw, bh, 8);
    c.add(bg);
    const title = this.scene.add.text(bx + bw / 2, by + 34, `${spec.label} 완료!`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '20px', color: '#ffd257', fontStyle: 'bold',
    }).setOrigin(0.5);
    const body = this.scene.add.text(bx + bw / 2, by + 64, [
      `${nameKo} ${spec.namePrefix}${this.engawa ? '엔가와 ' : ''}회 조각 (${grade}) ×${pieceCount}점  —  ${perPieceG}g/점`,
      `평균 정확도 ${Math.round(avg * 100)}%  ·  조각당 ${pieceValue.toLocaleString()}원`,
      `손질 스킬 +${xp} XP${lv.leveledUp ? `  ★ 레벨업! Lv.${lv.level} ★` : ''}`,
      '요리 탭 [사시미 만들기]에서 접시에 담아 사시미를 완성하세요 (모듬/단품)',
      this.mode === 'advanced' ? "고급 회 조각은 '스시' 요리 재료로도 쓸 수 있습니다 (추후)" : '',
    ].filter(Boolean).join('\n'), {
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
    super.destroy(fromScene);
  }
}
