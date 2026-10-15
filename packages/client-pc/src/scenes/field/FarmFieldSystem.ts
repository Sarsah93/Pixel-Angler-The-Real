/**
 * @file FarmFieldSystem.ts
 * @description 247차 — 마당 텃밭을 칸마다 그리고, 손에 든 것으로 그 칸에 일을 하는 필드 시스템
 *              (사용자 「땅 개간 · 관리 · 씨뿌리기 · 모종 심기 등 모든 상호작용을 스타듀밸리처럼 칸 당 작물에 대해 연출과 동적 UI로 —
 *              미니게임은 해당 칸에서 상호작용 시 팝업, 끝나면 완료된 상태가 탑다운 칸에 보이게」)
 *
 * ── 칸 그림(247차 2차 — 한 칸 = 2×2 타일 · 40px. 그림은 20단위로 그려 컨테이너 배율 2로 키운다 = 맵과 같은 2px 입자) ──
 *  사용자 「한 칸이 캐릭터 머리보다 작아 어느 칸인지 알기 어렵다 — 2×2를 한 칸으로 · 그림도 키우고 · 밟은 칸 테두리만 약하게」.
 *  구세이브의 4×3 타일 구획(한 칸 = 1타일)은 씬이 자리가 나면 넓히고, 못 넓히면 1배로 그린다(칸 크기 = 발자국 ÷ 칸 수).
 *  흙(풀밭 · 일군 이랑 · 젖은 흙 · 퇴비 · 검은 비닐 · 짚) → 작물(모양 13가지 × 자람 · 익은 열매 · 쓰러짐 · 병 반점 · 벌레) →
 *  해 둔 일(지주 + 묶은 끈 수 · 유인망 · 방충망 · 새 그물 · 부직포 · 북준 흙 · 배추 묶은 띠) → 말리는 단 · 다 마른 단 · 서리 ·
 *  김맬 때가 된 칸의 잡초. 칸 위에는 「지금 할 것」 하나(익음 · 털 때 · 할 일 · 목마름)가 아이콘으로 떠 있다.
 *
 * ── 겨누기 · 손에 든 것 ──
 *  밟고 선 칸이 그 칸이다 — 그 칸 테두리만 약하게 빛난다. 무엇을 할지는 머리 위 안내(검은 글자 · 흰 테)가 말한다.
 *  [F](또는 손 닿는 칸 왼쪽 클릭)는 퀵슬롯에 든 것을 쓴다:
 *   호미 = 일구기(김매기 · 북주기 · 캐기) · 물뿌리개 = 물 주기(누르고 있는 시간 = 양: 조금 → 보통 → 흠뻑) ·
 *   씨앗 · 모종 · 종구 = 심기 · 낫 · 수확 가위 · 쇠스랑 = 거두기 · 지주대 · 끈 · 비료 · 약 · 망 … = 그 일의 작업 장면(`FarmActions`).
 *  손에 맞는 것이 없으면 그 칸의 할 일 · 거두기 · 털기 · 텃밭 창 열기를 고른다(겹치면 선택 창).
 *  칸 오른쪽 위에는 지금 할 것 하나(거둘 것 · 털 때 · 할 일의 자재 · 목마름)가 16px 아이콘으로 떠 있다.
 * ── 연출 ──
 *  흙 튐(일구기 · 캐기) · 물줄기 · 씨앗이 떨어짐 · 모종이 날아와 꽂힘 · 반짝임(작업 끝) · 거둔 것이 튀어 올라 가방으로 · 베어 눕힘.
 * ── 248차 — 땅지렁이 ──
 *  일구기 · 캐기 · 김매기 · 북주기 · 칸 비우기 뒤(그리고 비 오는 동안 텃밭 가까이에서) 흙 위로 드러난 지렁이가
 *  그 칸에서 꿈틀거린다(맵과 같은 2px 입자 · 칸마다 최대 3마리). 그 칸에서 [F](또는 손 닿는 칸 클릭)는 손에 든 것보다 먼저
 *  「지렁이 줍기」다 — 가방 생미끼 「땅지렁이」. 90초 안에 줍지 않으면 흐려지며 다시 파고든다.
 */

import Phaser from 'phaser';
import {
  FARM_COLS, FARM_CELLS, getCrop, cellStage, cellReady, ripeStageOf, startOf, cultivationOf, cropStartOfItem, wildUnknown,
  CARE_TASK_KO, PROCESS_LAST_KO, WATER_AMOUNT_KO, SICKLE_ID, HARVEST_SCISSORS_ID, FORK_ID, DISEASE_DEFS, EARTHWORM_TUNING,
  type CropDef, type FarmCellState, type MapObject, type WaterAmount, type CareTaskId,
} from '@tra/core';
import { FarmStore, HOMI_ID, WATERING_CAN_ID, type FarmActionResult, type FarmCareRow } from '../../store/FarmStore.js';
import { InventoryStore, type InvItem } from '../../store/InventoryStore.js';
import { GameState } from '../../store/GameState.js';
import { addPixelIcon } from '../../ui/PixelIcon.js';
import { worldLabelStyle } from '../../ui/WorldLabel.js';
import { a11ySig, cv, shapeCuesOn } from '../../ui/ColorAssist.js';
import { DraggablePanel } from '../../ui/DraggablePanel.js';
import { openCareTask, openProcess, type FarmActionHost, type FarmActionWhat } from '../../ui/FarmActions.js';
import { careTaskIcon } from '../../ui/FarmWorkPanel.js';
import { maybeStartTour, type TourOptions } from '../../ui/GuideTour.js';
import { shapeOf, type Shape } from '../../data/CropShapes.js';
import { FARM_WORM_TEX } from '../../data/ForageTextures.js';
import { GAME_WIDTH } from '../../PhaserConfig.js';
import { t as tl } from '../../i18n/I18n.js';
import type { InteractOption } from '../../ui/InteractChoicePanel.js';

export interface FarmFieldHost {
  scene: Phaser.Scene;
  tr: number;
  /** 마당의 텃밭 설치물 */
  plots: () => MapObject[];
  /** 발 위치(세상 좌표) · 바라보는 쪽 */
  feet: () => { x: number; y: number };
  facing: () => 'up' | 'down' | 'left' | 'right';
  /** 마우스(세상 좌표) — 캔버스 밖이면 null */
  pointer: () => { x: number; y: number } | null;
  floatingHint: (msg: string) => void;
  pushLog: (msg: string) => void;
  /** 텃밭 창(그 칸을 고른 채로) */
  openPanel: (o: MapObject, cell: number) => void;
  openPopup: (build: (close: () => void) => DraggablePanel) => void;
  /** 가방이 바뀌었다(퀵슬롯 · 인벤토리 창 갱신) */
  inventoryChanged: () => void;
  /** 창이 떠 있거나 멈춤 · 연출 중 */
  blocked: () => boolean;
}

/** 겨눈 칸 */
interface FarmTarget { o: MapObject; idx: number }

interface CellView {
  soil: Phaser.GameObjects.Container;
  soilG: Phaser.GameObjects.Graphics;
  plant: Phaser.GameObjects.Container;
  plantG: Phaser.GameObjects.Graphics;
  deco: Phaser.GameObjects.Container;
  decoG: Phaser.GameObjects.Graphics;
  sig: string;
  decoSig: string;
  ind?: Phaser.GameObjects.Image;
  indKey?: string;
  /** 251차 — 점을 만든 때의 색 보정 서명(바뀌면 다시 만든다) */
  indSig?: string;
}

/** 248차 — 흙 위로 드러난 땅지렁이 한 마리(2px 입자 그림 · 꿈틀거림) */
interface WormSprite { g: Phaser.GameObjects.Graphics; phase: number; dir: 1 | -1 }

/** 248차 — 지렁이 색(머리 · 몸 · 환대 · 그림자) */
const WORM = { head: 0x9a3442, body: 0xd8707c, band: 0xf4b8c0, shadow: 0x1c100a };

/** 손에 들면 칸에 쓰는 도구 */
const HARVEST_TOOLS = new Set([SICKLE_ID, HARVEST_SCISSORS_ID, FORK_ID]);
/** 물 붓는 시간(ms) → 양 */
const POUR_MS = { normal: 420, deep: 1000 };
/** 손 닿는 거리 — 칸 크기의 배수(발에서 그 칸 가운데까지 · 왼쪽 클릭) */
const REACH = 1.6;
/** 칸 그림 단위 — 그림은 한 칸 = 20으로 그리고 실제 칸 크기(타일 × 칸 타일 수)에 맞춰 키운다 */
const ART = 20;
/** 사람 깊이는 몸 y(= 발 − 9)로 센다(`RegionFieldScene.PLAYER_FOOT_OFFSET`) — 포기 깊이를 같은 자로 맞춘다 */
const FEET_OFFSET = 9;

// ── 색 ──
const C = {
  grass: 0x4f6a34, grassHi: 0x6a8a44, soil: 0x6a4a2c, soilWet: 0x4a3220, soilMid: 0x5a3e26, ridge: 0x8a6038, ridgeWet: 0x5c4028,
  furrow: 0x553a22, furrowWet: 0x3a2616, leaf: 0x5cb84a, leafDark: 0x3f8a34, stem: 0x3a6a2a, wood: 0x8a6038, woodDark: 0x5a3a22,
  tie: 0xf0e0b0, film: 0x15161a, straw: 0xd8b860, net: 0xe8f0f4, weed: 0x2f6a24,
};

function produceColor(crop: CropDef, cell: FarmCellState): number {
  const ripe = ripeStageOf(cell, crop);
  switch (crop.variant?.of ?? crop.id) {
    case 'chili': case 'cheongyang': return ripe === 'red' ? 0xd8281e : ripe === 'turning' ? 0x8a2a1a : 0x3f9a3a;
    case 'tomato': case 'cherry_tomato': return 0xe0402a;
    case 'eggplant': return 0x5a2a6a;
    case 'cucumber': case 'bitter_melon': return 0x4a9a34;
    case 'zucchini': return 0x6ab04a;
    case 'korean_melon': return 0xf0d040;
    case 'watermelon': return 0x2a6a2a;
    case 'gourd': return 0xc8e8a0;
    case 'okra': return 0x6ab04a;
    case 'strawberry': return 0xe8243a;
    case 'blueberry': return 0x3a4aa8;
    case 'corn': return 0xe8d070;
    case 'soybean': case 'cowpea': return 0x8ab04a;
    case 'chamkkae': return 0x9aaa5a;
    case 'deulkkae': return 0x5a7a3a;
    case 'carrot': return 0xe8802a;
    case 'radish': case 'turnip': return 0xeef0e8;
    default: return 0xe8d070;
  }
}

/** 모양별 포기 수(20px 칸에 그릴 수) */
function plantsInCell(shape: Shape, crop: CropDef, cell: FarmCellState): number {
  const st = startOf(crop, cell.start);
  if (shape === 'vine' || shape === 'shrub') return 1;
  if (shape === 'corn' || shape === 'upright') return st?.kind === 'seedling' ? Math.min(2, st.perCell) : 2;
  if (shape === 'rosette') return crop.id === 'napa_cabbage' ? 1 : 2;
  if (shape === 'bush') return st?.kind === 'seedling' && st.perCell === 1 ? 1 : 2;
  if (shape === 'grass') return 4;
  return 3;
}
const SLOTS: Record<number, number[]> = { 1: [0], 2: [-4, 4], 3: [-6, 0, 6], 4: [-7, -2, 3, 8] };

/** 픽셀 덩어리(가로 반지름 rx · 세로 반지름 ry) — 줄마다 사각형(테두리가 흐려지지 않게) */
function blob(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, color: number): void {
  g.fillStyle(color, 1);
  const r = Math.max(1, Math.round(ry));
  for (let yy = -r; yy <= r; yy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (yy / (r + 0.5)) ** 2)));
    g.fillRect(Math.round(cx - w), Math.round(cy + yy), w * 2 + 1, 1);
  }
}

export class FarmFieldSystem {
  private host: FarmFieldHost;
  private views = new Map<string, CellView[]>();
  private target: FarmTarget | null = null;
  private targetG: Phaser.GameObjects.Graphics;
  private pour: { t: FarmTarget; startMs: number; viaMouse: boolean } | null = null;
  private pourG: Phaser.GameObjects.Graphics;
  private pourText: Phaser.GameObjects.Text;
  private keyUp: () => void;
  private refreshAt = 0;
  private toured = false;
  /** 밟고 선 칸이라 잠시 감춘 「지금 할 것」 아이콘 */
  private hiddenInd?: Phaser.GameObjects.Image;
  /** 하네스 · 가이드 판정 — 이 세션에서 칸에 한 일 */
  readonly did = { till: 0, water: 0, plant: 0, harvest: 0, care: 0, worms: 0 };
  /** 248차 — 드러난 지렁이 그림(`구획:칸` → 그 칸의 지렁이들) · 비 오는 날 확인 시계 */
  private wormViews = new Map<string, WormSprite[]>();
  private rainCheckAt = 0;

  constructor(host: FarmFieldHost) {
    this.host = host;
    const scene = host.scene;
    this.targetG = scene.add.graphics().setDepth(6.45);
    this.pourG = scene.add.graphics().setDepth(62);
    this.pourText = scene.add.text(0, 0, '', worldLabelStyle(11)).setOrigin(0.5, 1).setDepth(62).setVisible(false);
    // 밟은 칸 테두리 — 약하게 숨 쉬듯(사용자 「테두리만 약하게 하이라이트」)
    scene.tweens.add({ targets: this.targetG, alpha: { from: 0.75, to: 0.35 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.keyUp = () => this.finishPour(false);
    scene.input.keyboard?.on('keyup-F', this.keyUp);
  }

  destroy(): void {
    this.host.scene.input.keyboard?.off('keyup-F', this.keyUp);
    this.clearAll();
    this.wormViews.forEach((ws) => ws.forEach((w) => w.g.destroy()));
    this.wormViews.clear();
    this.targetG.destroy();
    this.pourG.destroy();
    this.pourText.destroy();
  }

  /** 칸을 밟고 섰는가 */
  get hasTarget(): boolean { return !!this.target; }

  /** 창이 떠 있는 동안 — 겨눔 · 테두리를 걷는다(씬 update가 일찍 돌아갈 때 부른다) */
  idle(): void {
    if (!this.target) return;
    this.target = null;
    this.targetG.clear();
  }

  // ═══════════════════════════════════════
  // 칸 그림
  // ═══════════════════════════════════════

  clearAll(): void {
    this.views.forEach((vs) => vs.forEach((v) => this.destroyView(v)));
    this.views.clear();
  }

  private destroyView(v: CellView): void {
    v.soil.destroy(); v.plant.destroy(); v.deco.destroy(); v.ind?.destroy();
  }

  /** 모든 텃밭을 다시 맞춘다(바뀐 칸만 다시 그린다) */
  refreshAll(): void {
    for (const o of this.host.plots()) this.renderPlot(o);
  }

  /** 한 구획 — 칸마다 서명이 바뀐 것만 다시 그린다 */
  renderPlot(o: MapObject, pop?: { idx: number; part: 'plant' | 'deco' }): void {
    const plot = FarmStore.has(o.instanceId) ? FarmStore.plot(o.instanceId) : null;
    let vs = this.views.get(o.instanceId);
    const k = this.cellPx(o) / ART;
    if (!vs) {
      vs = [];
      for (let i = 0; i < FARM_CELLS; i++) {
        const { x: x0, y: y0, s: cs } = this.cellRect(o, i);
        const sc = this.host.scene;
        const soilG = sc.add.graphics();
        const soil = sc.add.container(x0, y0, [soilG]).setScale(k).setDepth(6.02 + y0 * 0.00001);
        // 포기 · 지주는 서 있는 물건이다 — 사람과 같은 깊이 규칙(20 + 몸 y × 0.001)으로 앞뒤를 가린다:
        //   밑동이 사람 발보다 아래(화면 아래)면 사람 앞에 선다 → 밟고 선 칸의 작물이 사람에 가려 안 보이던 것을 막는다
        const yd = 20 + (y0 + cs - FEET_OFFSET) * 0.001;
        const plantG = sc.add.graphics();
        const plant = sc.add.container(x0 + cs / 2, y0 + cs, [plantG]).setScale(k).setDepth(yd);
        const decoG = sc.add.graphics();
        const deco = sc.add.container(x0 + cs / 2, y0 + cs, [decoG]).setScale(k).setDepth(yd + 0.00005);
        vs.push({ soil, soilG, plant, plantG, deco, decoG, sig: '', decoSig: '' });
      }
      this.views.set(o.instanceId, vs);
    }
    const near = this.playerNear(o, 6);
    for (let i = 0; i < FARM_CELLS; i++) {
      const c = plot?.cells[i];
      const v = vs[i];
      const { x: x0, y: y0, s: cs } = this.cellRect(o, i);
      const sig = this.cellSig(o.instanceId, i, c);
      if (sig !== v.sig) {
        v.sig = sig;
        this.drawSoil(v.soilG, c);
        this.drawPlant(v.plantG, o.instanceId, i, c);
      }
      const decoSig = this.decoSig(c);
      if (decoSig !== v.decoSig) { v.decoSig = decoSig; this.drawDeco(v.decoG, c); }
      // 지금 할 것 하나 — 칸 오른쪽 위 모서리의 색 점(거둘 때 초록 · 털 때 금빛 · 할 일 주황 · 목마름 파랑).
      //   16px 아이콘은 20px 칸 위로 올리면 윗줄 칸을 덮어 어느 칸 것인지 헷갈린다 — 자세한 것은 겨누면 칸 정보 창이 말한다
      const ind = near && c ? this.indicatorOf(o.instanceId, i, c) : null;
      if (ind !== (v.indKey ?? null) || (ind && v.indSig !== a11ySig())) {
        v.ind?.destroy(); v.ind = undefined; v.indKey = ind ?? undefined; v.indSig = a11ySig();
        if (ind) {
          const img = cs >= 32 ? this.indicatorImage(ind, o.instanceId, i, x0 + cs - 10, y0 + 10) : null;
          const mark = img ?? this.pipImage(ind, x0 + cs - 4, y0 + 3);
          mark.setDepth(59 + y0 * 0.00001);   // 사람 · 포기보다 위(가리지 않게) · 안내 글자(60)보다 아래
          this.host.scene.tweens.add({ targets: mark, y: mark.y - (img ? 2 : 1), duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          v.ind = mark;
        }
      }
    }
    if (pop) {
      const v = vs[pop.idx];
      const obj = pop.part === 'plant' ? v.plant : v.deco;
      this.host.scene.tweens.add({ targets: obj, scaleY: { from: k * 0.3, to: k }, scaleX: { from: k * 1.3, to: k }, duration: 260, ease: 'Back.easeOut' });
    }
  }

  private cellSig(plotId: string, idx: number, c?: FarmCellState): string {
    if (!c) return 'none';
    const crop = c.cropId ? getCrop(c.cropId) : undefined;
    const st = cellStage(c);
    const g = Math.round((c.picks > 0 ? 0.7 + 0.3 * c.regrow : c.growth) * 12);
    const ws = FarmStore.waterState(plotId, idx)?.state ?? '';
    const dz = (FarmStore.diseases(plotId, idx).map((d) => `${d.id}${d.severity > 0.5 ? 2 : 1}`)).join(',');
    const weed = crop && FarmStore.careRows(plotId, idx).some((r) => r.st.def.id === 'weed' && r.st.status === 'due') ? 'w' : '';
    const ripe = crop ? ripeStageOf(c, crop) ?? '' : '';
    return [c.tilled ? 1 : 0, c.cropId ?? '', st, g, ws, c.compost ? 'c' : '', dz, weed, ripe, c.lodged ? 'L' : '', c.frostedAt ? 'F' : '',
      c.process ? (c.process.dryAt ? 'D' : `d${Math.round(c.process.dryH / 24)}`) : '', wildUnknown(c) ? 'u' : '', c.moisture >= 0.6 ? 'wet' : ''].join('|');
  }

  /** 해 둔 일(지주 · 망 · 덮개 · 북주기)만의 서명 — 바뀌면 그 겹만 다시 그리고 튀어나오게 한다 */
  private decoSig(c?: FarmCellState): string {
    if (!c?.cropId || c.process) return '';
    const cr = c.care ?? {};
    const keys: CareTaskId[] = ['stake', 'tie', 'trellis', 'net_cover', 'bird_net', 'frost_cover', 'hill_up', 'tie_head', 'ridge_mulch', 'straw_mulch', 'cover_dark'];
    return keys.map((k) => `${k}${cr[k]?.done ?? 0}`).join(',') + (this.recent(c, 'frost_cover') ? 'fc' : '') + (c.lodged ? 'L' : '');
  }

  /** 부직포처럼 철 따라 덮는 것 — 최근(150일 안)에 했는가 */
  private recent(c: FarmCellState, k: CareTaskId): boolean {
    const r = c.care?.[k];
    return !!r && r.done > 0 && Date.now() - r.lastMs < 150 * 86_400_000;
  }

  /** 흙 — 풀밭 · 이랑(마름 · 촉촉 · 젖음) · 퇴비 · 검은 비닐 · 짚(칸 왼쪽 위 = 0 · 그림 단위) */
  private drawSoil(g: Phaser.GameObjects.Graphics, c?: FarmCellState): void {
    const T = ART, x0 = 0, y0 = 0;
    g.clear();
    if (!c?.tilled) {
      g.fillStyle(C.grass, 1); g.fillRect(x0 + 1, y0 + 1, T - 2, T - 2);
      for (let yy = 3; yy < T - 2; yy += 5) for (let xx = 2 + ((yy / 5) % 2) * 2; xx < T - 2; xx += 5) { g.fillStyle(C.grassHi, 1); g.fillRect(x0 + xx, y0 + yy, 2, 2); }
      return;
    }
    const wet = c.moisture >= 0.6, mid = c.moisture >= 0.3;
    g.fillStyle(wet ? C.soilWet : mid ? C.soilMid : C.soil, 1); g.fillRect(x0 + 1, y0 + 1, T - 2, T - 2);
    for (const yy of [4, 11]) {
      g.fillStyle(wet ? C.ridgeWet : C.ridge, 1); g.fillRect(x0 + 2, y0 + yy, T - 4, 2);
      g.fillStyle(wet ? C.furrowWet : C.furrow, 1); g.fillRect(x0 + 2, y0 + yy + 3, T - 4, 2);
    }
    if (c.compost) { g.fillStyle(0x2a1a10, 0.9); for (let k = 0; k < 4; k++) g.fillRect(x0 + 3 + k * 4, y0 + T - 4, 2, 2); }
    const cr = c.care ?? {};
    if (c.cropId && (cr.ridge_mulch?.done ?? 0) > 0) {
      // 검은 비닐 — 두둑을 덮고 심는 구멍만 흙이 보인다
      g.fillStyle(C.film, 1); g.fillRect(x0 + 1, y0 + 3, T - 2, T - 6);
      g.fillStyle(0x2a2c32, 1); g.fillRect(x0 + 1, y0 + 3, T - 2, 1);
      g.fillStyle(wet ? C.soilWet : C.soil, 1); for (const dx of [-4, 4]) g.fillRect(x0 + T / 2 + dx - 2, y0 + T - 6, 4, 2);
    }
    if (c.cropId && (cr.straw_mulch?.done ?? 0) > 0) {
      g.lineStyle(1, C.straw, 1);
      for (let k = 0; k < 6; k++) g.lineBetween(x0 + 2 + k * 3, y0 + T - 3, x0 + 5 + k * 3, y0 + T - 8);
    }
  }

  /** 작물(뿌리 · 자람 · 익음 · 쓰러짐 · 병 · 벌레) — 컨테이너 원점 = 칸 아래 가운데 */
  private drawPlant(g: Phaser.GameObjects.Graphics, plotId: string, idx: number, c?: FarmCellState): void {
    g.clear();
    const T = ART;
    if (!c?.tilled) return;
    const crop = c.cropId ? getCrop(c.cropId) : undefined;
    // 잡초(김맬 때) — 칸 모서리
    const weedDue = !!crop && FarmStore.careRows(plotId, idx).some((r) => r.st.def.id === 'weed' && r.st.status === 'due');
    if (weedDue) for (const dx of [-8, 7]) { g.fillStyle(C.weed, 1); g.fillRect(dx, -3, 1, 3); g.fillRect(dx - 1, -4, 1, 2); g.fillRect(dx + 1, -5, 1, 3); }
    if (!crop) return;
    const stage = cellStage(c);
    // 말리는 단 · 다 마른 단
    if (stage === 'drying' || stage === 'dried') { this.drawDrying(g, crop.id, stage === 'dried'); return; }
    // 거둔 뒤 쉬는 여러해살이 — 벤 밑동
    if (stage === 'resting') { g.fillStyle(0x7a5a3a, 1); for (const dx of [-5, 0, 5]) g.fillRect(dx, -4, 1, 3); return; }
    const gr = c.picks > 0 ? 0.7 + 0.3 * c.regrow : c.growth;
    const shape = wildUnknown(c) ? 'rosette' : shapeOf(crop);
    const ready = stage === 'ready';
    // 씨앗만 — 이랑에 박힌 씨
    if (stage === 'seeded' && gr < 0.06) {
      g.fillStyle(0xd8c890, 1); for (const dx of [-6, -2, 2, 6]) g.fillRect(dx, -T + 13, 1, 1);
      return;
    }
    const k = Math.max(0.18, Math.min(1, 0.18 + 0.82 * gr));
    const n = plantsInCell(shape, crop, c);
    const leaf = crop.id.startsWith('jeok') || crop.id === 'shiso' ? 0xa04a5a : C.leaf;
    const fruit = produceColor(crop, c);
    const lean = c.lodged ? 0.6 : 0;
    // 유인망은 작물 뒤에
    if ((c.care?.trellis?.done ?? 0) > 0) {
      g.lineStyle(1, 0xd8e8d0, 0.7);
      for (let yy = -6; yy >= -26; yy -= 4) g.lineBetween(-9, yy, 9, yy);
      for (let xx = -9; xx <= 9; xx += 4) g.lineBetween(xx, -4, xx, -26);
      g.fillStyle(C.wood, 1); g.fillRect(-10, -27, 1, 24); g.fillRect(9, -27, 1, 24);
    }
    for (const dx of SLOTS[n] ?? [0]) this.drawShape(g, shape, dx, -4, k, ready, leaf, fruit, lean, crop);
    // 병 반점 · 벌레
    const dz = FarmStore.diseases(plotId, idx);
    for (const d of dz) {
      const pest = DISEASE_DEFS[d.id].kind !== 'disease';
      const col = pest ? (d.id === 'aphid' ? 0xc8f080 : 0x1a1a1a) : d.id === 'powdery_mildew' ? 0xf4f6f0 : d.id === 'rust' ? 0xe8781a : 0x6a4a2a;
      g.fillStyle(col, 1);
      const nSpots = d.severity > 0.5 ? 3 : 2;
      for (let s = 0; s < nSpots; s++) g.fillRect(-5 + s * 5, -6 - Math.round(6 * k) + (s % 2) * 2, 1, 1);
    }
    if (c.frostedAt) { g.fillStyle(0xdff0ff, 0.9); for (const [dx, dy] of [[-6, -6], [3, -9], [6, -4], [-2, -11]]) g.fillRect(dx, dy, 1, 1); }
  }

  /** 모양별 포기 하나 — (x, by) = 밑동 */
  private drawShape(g: Phaser.GameObjects.Graphics, shape: Shape, x: number, by: number, k: number, ready: boolean, leaf: number, fruit: number, lean: number, crop: CropDef): void {
    const px = (xx: number, yy: number, w: number, h: number, col: number): void => { g.fillStyle(col, 1); g.fillRect(Math.round(xx), Math.round(yy), w, h); };
    switch (shape) {
      case 'upright': {
        const h = Math.round(4 + 13 * k);
        for (let i = 0; i < h; i++) px(x + i * lean, by - i, 1, 1, C.stem);
        for (let j = 2; j < h; j += 3) { px(x - 2 + j * lean, by - j, 2, 1, leaf); px(x + 1 + j * lean, by - j - 1, 2, 1, leaf); }
        px(x - 1 + h * lean, by - h - 1, 3, 2, leaf);
        if (ready && crop.category === 'fruit') { px(x - 2 + h * 0.5 * lean, by - Math.round(h * 0.5), 1, 2, fruit); px(x + 2 + h * 0.6 * lean, by - Math.round(h * 0.65), 1, 2, fruit); }
        if (ready && (crop.id === 'chamkkae' || crop.id === 'deulkkae')) for (let j = 4; j < h; j += 3) px(x + 1 + j * lean, by - j, 1, 2, fruit);
        return;
      }
      case 'rosette': {
        const big = crop.id === 'napa_cabbage' ? 1.5 : 1;
        const rx = Math.max(1.5, 1.5 + 4 * k * big), ry = Math.max(1, 1 + 3 * k * big);
        blob(g, x, by - ry, rx, ry, C.leafDark);
        blob(g, x, by - ry - 1, Math.max(1, rx - 1), Math.max(1, ry - 1), leaf);
        if (k > 0.5) px(x, by - ry * 2 + 1, 1, 1, 0xb8e890);
        return;
      }
      case 'root': {
        const h = Math.round(3 + 8 * k);
        for (const dx of [-1, 0, 1]) for (let i = 0; i < h; i++) px(x + dx + (dx * i) / 4, by - i - 1, 1, 1, i > h - 3 ? leaf : C.leafDark);
        if (ready) px(x - 1, by - 1, 3, 2, fruit);
        return;
      }
      case 'allium': {
        const h = Math.round(4 + 11 * k);
        const col = crop.id === 'garlic' || crop.id === 'onion' ? 0x6aa04a : 0x4aa040;
        px(x - 1, by - h + 2, 1, h - 2, col); px(x, by - h, 1, h, col); px(x + 1, by - h + 1, 1, h - 1, col);
        if (ready && (crop.id === 'garlic' || crop.id === 'onion')) px(x - 1, by - 1, 3, 2, crop.id === 'onion' ? 0xc89a5a : 0xeee6d4);
        return;
      }
      case 'bush': {
        const r = Math.max(1.5, 1.5 + 4.5 * k);
        blob(g, x, by - r * 0.9, r, r * 0.8, C.leafDark);
        blob(g, x - 1, by - r * 1.1, Math.max(1, r - 1), Math.max(1, r * 0.6), leaf);
        if (ready && (crop.id === 'soybean' || crop.id === 'cowpea')) { px(x - 2, by - r, 1, 2, fruit); px(x + 2, by - r - 1, 1, 2, fruit); }
        return;
      }
      case 'vine': {
        const w = Math.round(2 + 7 * k);
        px(x - w, by - 1, w * 2 + 1, 1, C.stem);
        for (let dx = -w; dx <= w; dx += 3) blob(g, x + dx, by - 3, 1.5, 1.5, leaf);
        if (ready) { blob(g, x - 3, by - 1, 2, 1.5, fruit); blob(g, x + 4, by - 1, 2, 1.5, fruit); }
        return;
      }
      case 'corn': {
        const h = Math.round(5 + 24 * k);
        for (let i = 0; i < h; i++) px(x + i * lean, by - i, 1, 1, 0x4a8a2a);
        for (let j = 3; j < h; j += 4) { px(x - 3 + j * lean, by - j, 3, 1, leaf); px(x + 1 + j * lean, by - j - 2, 3, 1, leaf); }
        if (ready) { px(x + h * lean - 1, by - h - 2, 3, 2, 0xe8d070); px(x + 1 + h * 0.5 * lean, by - Math.round(h * 0.5), 2, 3, 0x8ac860); }
        return;
      }
      case 'grass': {
        const h = Math.round(3 + 9 * k);
        const col = ready ? 0xd8b860 : 0x6ab04a;
        for (const dx of [-1, 0, 1]) px(x + dx + (dx === 0 ? 0 : dx * 0.5), by - h + Math.abs(dx), 1, h - Math.abs(dx), col);
        if (k > 0.7) px(x - 1 + h * lean, by - h - 2, 2, 3, ready ? 0xe8c870 : 0x8ac860);
        return;
      }
      case 'shrub': {
        const h = Math.round(5 + 11 * k);
        px(x, by - h, 1, h, 0x6a4a2c);
        blob(g, x - 3, by - h + 2, 3, 2, leaf); blob(g, x + 3, by - h + 1, 3, 2, leaf); blob(g, x, by - h - 1, 3, 2, C.leafDark);
        if (ready && crop.id === 'blueberry') { px(x - 3, by - h + 4, 1, 1, fruit); px(x + 2, by - h + 3, 1, 1, fruit); px(x, by - h + 1, 1, 1, fruit); }
        return;
      }
      case 'strawberry': {
        blob(g, x, by - 2, 2 + 2 * k, 1.5 + k, C.leafDark);
        blob(g, x, by - 3, 1 + 2 * k, 1 + k, leaf);
        if (ready) { px(x - 3, by - 1, 1, 2, fruit); px(x + 3, by - 1, 1, 2, fruit); }
        return;
      }
      default: {
        blob(g, x, by - 3, 2 + 3 * k, 2 + 2 * k, leaf);
      }
    }
  }

  /** 말리는 단(콩 · 깨 · 보리 — 눕힌 다발) · 알뿌리(마늘 · 양파 · 땅콩 — 줄지어) */
  private drawDrying(g: Phaser.GameObjects.Graphics, cropId: string, dry: boolean): void {
    const bulb = cropId === 'garlic' || cropId === 'onion' || cropId === 'peanut';
    for (const yy of [-12, -5]) {
      if (bulb) {
        g.fillStyle(dry ? 0xc8b070 : 0x7a8a40, 1); g.fillRect(-8, yy, 7, 1);
        g.fillStyle(cropId === 'onion' ? 0xc89a5a : cropId === 'peanut' ? 0xc8a870 : 0xeee6d4, 1);
        for (const dx of [0, 3, 6]) g.fillRect(dx, yy - 1, 2, 2);
      } else {
        g.lineStyle(1, dry ? 0xd8b860 : 0x8a9a4a, 1);
        for (const d of [-1, 0, 1]) g.lineBetween(-8, yy + d, 8, yy + d - 2);
        g.fillStyle(C.tie, 1); g.fillRect(-3, yy - 2, 1, 3);
      }
    }
  }

  /** 해 둔 일 — 지주(묶은 끈) · 방충망 · 새 그물 · 부직포 · 북준 흙 · 배추 띠 · 검은 천 */
  private drawDeco(g: Phaser.GameObjects.Graphics, c?: FarmCellState): void {
    g.clear();
    if (!c?.cropId || c.process) return;
    const crop = getCrop(c.cropId);
    if (!crop) return;
    const cr = c.care ?? {};
    const shape = shapeOf(crop);
    const n = plantsInCell(shape, crop, c);
    const gr = c.picks > 0 ? 1 : c.growth;
    const k = Math.max(0.18, Math.min(1, 0.18 + 0.82 * gr));
    // 북주기 — 포기 밑동에 흙을 모은 둔덕
    if ((cr.hill_up?.done ?? 0) > 0) for (const dx of SLOTS[n] ?? [0]) { g.fillStyle(0x5a3e26, 1); g.fillRect(dx - 3, -5, 7, 2); g.fillRect(dx - 2, -6, 5, 1); }
    // 지주 + 묶은 끈(지주 세울 때 한 번 + 유인 횟수)
    if ((cr.stake?.done ?? 0) > 0) {
      const ties = 1 + (cr.tie?.done ?? 0);
      for (const dx of SLOTS[n] ?? [0]) {
        const sx = dx + 2;
        g.fillStyle(C.woodDark, 1); g.fillRect(sx + 1, -21, 1, 18);
        g.fillStyle(C.wood, 1); g.fillRect(sx, -22, 1, 19);
        g.fillStyle(C.tie, 1);
        for (let tI = 0; tI < Math.min(4, ties); tI++) g.fillRect(sx - 2, -6 - tI * 4, 3, 1);
      }
    }
    // 배추 묶기 — 포기 허리의 띠
    if ((cr.tie_head?.done ?? 0) > 0) { g.fillStyle(C.tie, 1); g.fillRect(-4, -7, 9, 1); }
    // 방충망(한랭사 터널) · 새 그물 · 부직포 · 검은 천
    const tunnel = (col: number, a: number, mesh: number | null): void => {
      const h = Math.max(8, Math.round(6 + 10 * k));
      g.fillStyle(col, a); g.fillRect(-9, -h, 18, h - 2);
      g.fillStyle(col, Math.min(1, a + 0.25)); g.fillRect(-9, -h, 18, 1); g.fillRect(-10, -h + 1, 1, h - 3); g.fillRect(9, -h + 1, 1, h - 3);
      if (mesh !== null) { g.fillStyle(mesh, 0.8); for (let yy = -h + 2; yy < -3; yy += 3) for (let xx = -8; xx < 9; xx += 3) g.fillRect(xx, yy, 1, 1); }
    };
    if ((cr.net_cover?.done ?? 0) > 0) tunnel(C.net, 0.35, 0xffffff);
    if ((cr.bird_net?.done ?? 0) > 0) tunnel(0x202024, 0.18, 0x202024);
    if (this.recent(c, 'frost_cover')) tunnel(0xf4f6f8, 0.6, null);
    if ((cr.cover_dark?.done ?? 0) > 0 && !(cr.uncover_light?.done ?? 0)) tunnel(0x15151a, 0.85, null);
  }

  // ── 칸 위 「지금 할 것」 ──

  private indicatorOf(plotId: string, idx: number, c: FarmCellState): string | null {
    if (!c.cropId || wildUnknown(c)) return null;
    if (c.process?.dryAt) return 'process';
    if (cellReady(c) && !c.process && !c.nursery) return 'ready';
    const rows = FarmStore.careRows(plotId, idx).filter((r) => r.st.status === 'due');
    if (rows.length) return `care:${rows[0].st.def.id}`;
    const ws = FarmStore.waterState(plotId, idx);
    if (ws && ws.state === 'dry') return 'dry';
    return null;
  }

  /** 큰 칸(2×2 타일) — 지금 할 것을 16px 아이콘으로(거둘 것 · 털기 도리깨 · 목마름 물방울 · 할 일의 자재 · 도구) */
  private indicatorImage(key: string, plotId: string, idx: number, x: number, y: number): Phaser.GameObjects.Image | null {
    const scene = this.host.scene;
    const c = FarmStore.plot(plotId).cells[idx];
    const crop = c?.cropId ? getCrop(c.cropId) : undefined;
    if (!crop && key !== 'dry') return null;
    if (key === 'ready' && crop) return addPixelIcon(scene, crop.harvest.ripenTo && ripeStageOf(c, crop) === 'red' ? crop.harvest.ripenTo.itemId : crop.harvest.itemId, x, y, 16);
    if (key === 'process' && crop) return addPixelIcon(scene, cultivationOf(crop).process?.last === 'thresh' ? 'it_flail' : crop.harvest.itemId, x, y, 16);
    if (key === 'dry') return addPixelIcon(scene, 'hydration', x, y, 16);
    if (key.startsWith('care:')) {
      const row = FarmStore.careRows(plotId, idx).find((r) => `care:${r.st.def.id}` === key);
      return row ? careTaskIcon(scene, row.st, x, y, 16, crop) : null;
    }
    return null;
  }

  /**
   * 모서리 색 점(5px · 검은 테 · 가운데 밝은 점) — 상태별 색.
   * 251차 — 색 구분 보정 · 「모양으로도 표시」면 상태별 모양(거둘 때 네모 · 털 때 + · 목마름 물방울 · 할 일 !).
   */
  private pipImage(key: string, x: number, y: number): Phaser.GameObjects.Image {
    const col = cv(key === 'ready' ? 0x6ae08a : key === 'process' ? 0xffd257 : key === 'dry' ? 0x4fb8e0 : 0xffa040);
    const shape = shapeCuesOn() ? (key === 'ready' ? 'sq' : key === 'process' ? 'plus' : key === 'dry' ? 'drop' : 'bang') : 'sq';
    const tex = `farm_pip_${col.toString(16)}_${shape}`;
    const scene = this.host.scene;
    if (!scene.textures.exists(tex)) {
      const g = scene.add.graphics();
      // 7×7 — 글자 = 칸(# 색 · o 테). 테는 모양 둘레 한 칸
      const PIP: Record<string, string[]> = {
        sq: ['.ooooo.', 'o#####o', 'o#####o', 'o#####o', 'o#####o', 'o#####o', '.ooooo.'],
        plus: ['..ooo..', '..o#o..', 'ooo#ooo', 'o#####o', 'ooo#ooo', '..o#o..', '..ooo..'],
        drop: ['..ooo..', '.oo#oo.', '.o###o.', 'o#####o', 'o#####o', 'o#####o', '.ooooo.'],
        bang: ['.ooooo.', '.o###o.', '.o###o.', '.o###o.', '.ooooo.', '.o###o.', '.ooooo.'],
      };
      PIP[shape].forEach((row, yy) => {
        for (let xx = 0; xx < row.length; xx++) {
          if (row[xx] === '.') continue;
          g.fillStyle(row[xx] === 'o' ? 0x10141a : col, 1);
          g.fillRect(xx, yy, 1, 1);
        }
      });
      if (shape === 'sq') { g.fillStyle(0xffffff, 0.85); g.fillRect(2, 2, 2, 2); }
      g.generateTexture(tex, 7, 7);
      g.destroy();
    }
    return scene.add.image(x, y, tex);
  }

  // ═══════════════════════════════════════
  // 겨누기 · 칸 정보
  // ═══════════════════════════════════════

  /** 이 구획 한 칸의 크기(px) — 발자국 ÷ 칸 수(8×6 타일 → 2타일 = 40px · 구세이브 4×3 → 20px) */
  private cellPx(o: MapObject): number {
    return this.host.tr * Math.max(1, Math.round((o.fw ?? FARM_COLS) / FARM_COLS));
  }

  /** 칸 왼쪽 위(세상 좌표) · 크기 */
  private cellRect(o: MapObject, idx: number): { x: number; y: number; s: number } {
    const s = this.cellPx(o);
    return { x: o.tx * this.host.tr + (idx % FARM_COLS) * s, y: o.ty * this.host.tr + Math.floor(idx / FARM_COLS) * s, s };
  }

  private cellAt(x: number, y: number): FarmTarget | null {
    const tr = this.host.tr;
    for (const o of this.host.plots()) {
      const s = this.cellPx(o);
      const lx = Math.floor((x - o.tx * tr) / s), ly = Math.floor((y - o.ty * tr) / s);
      if (lx >= 0 && lx < FARM_COLS && ly >= 0 && ly < FARM_CELLS / FARM_COLS) return { o, idx: ly * FARM_COLS + lx };
    }
    return null;
  }

  private cellCenter(t: FarmTarget): { x: number; y: number } {
    const r = this.cellRect(t.o, t.idx);
    return { x: r.x + r.s / 2, y: r.y + r.s / 2 };
  }

  private playerNear(o: MapObject, tiles: number): boolean {
    const tr = this.host.tr;
    const s = this.cellPx(o);
    const f = this.host.feet();
    const w = FARM_COLS * s, h = (FARM_CELLS / FARM_COLS) * s;
    const cx = o.tx * tr + w / 2, cy = o.ty * tr + h / 2;
    return Math.abs(f.x - cx) < w / 2 + tiles * tr && Math.abs(f.y - cy) < h / 2 + tiles * tr;
  }

  /** 겨눈 칸 = 밟고 선 칸(발 자리) — 사용자 「경계를 캐릭터가 밟았을 때 그 칸 테두리만 약하게」 */
  private computeTarget(): FarmTarget | null {
    if (this.devLock) return this.devLock;
    const f = this.host.feet();
    return this.cellAt(f.x, f.y - 2);
  }

  update(delta: number): void {
    // 시간이 흐르면 자람 · 흙이 바뀐다 — 2초마다 다시 맞춘다(바뀐 칸만)
    this.refreshAt += delta;
    if (this.refreshAt > 2000) { this.refreshAt = 0; for (const o of this.host.plots()) this.renderPlot(o); }
    // 248차 — 비가 오면 일군 칸에서 지렁이가 기어 나온다(가까이 있을 때만) · 드러난 지렁이는 꿈틀거린다
    this.rainCheckAt += delta;
    if (this.rainCheckAt > EARTHWORM_TUNING.rainCheckMs) {
      this.rainCheckAt = 0;
      if (!this.host.blocked()) {
        for (const o of this.host.plots()) {
          if (!this.playerNear(o, 6)) continue;
          const found = FarmStore.rainWorms(o.instanceId);
          if (found.length) this.host.floatingHint('빗물에 지렁이가 기어 나왔다');
        }
      }
    }
    this.syncWorms(delta);
    if (this.pour) { this.drawPour(); return; }
    const t = this.host.blocked() ? null : this.computeTarget();
    this.target = t;
    this.targetG.clear();
    // 밟고 선 칸의 「지금 할 것」 아이콘은 감춘다 — 사람 몸 위에 떠서 들고 있는 것처럼 보인다(머리 위 안내가 대신 말한다)
    const ind = t ? this.views.get(t.o.instanceId)?.[t.idx]?.ind : undefined;
    if (this.hiddenInd !== ind) { if (this.hiddenInd?.active) this.hiddenInd.setVisible(true); this.hiddenInd = ind; }
    ind?.setVisible(false);
    if (!t) return;
    this.drawCellBorder(this.targetG, t, !!this.heldAction(t));
    if (!this.toured) { this.toured = true; maybeStartTour(this.host.scene, () => this.buildTour()); }
  }

  /**
   * 칸 테두리만 약하게(사용자 지시) — 안쪽으로 1px 들인 흰 선 + 바깥 1px 어두운 선(밝은 흙 · 풀밭 어디서도 보이게).
   * 손에 든 것을 그 칸에 쓸 수 있으면 테가 따뜻한 빛(노랑)이다.
   */
  private drawCellBorder(g: Phaser.GameObjects.Graphics, t: FarmTarget, usable: boolean): void {
    const r = this.cellRect(t.o, t.idx);
    g.lineStyle(1, 0x101418, 0.55); g.strokeRect(r.x + 0.5, r.y + 0.5, r.s - 1, r.s - 1);
    g.lineStyle(2, usable ? cv(0xffe9a0) : 0xffffff, 0.85); g.strokeRect(r.x + 2, r.y + 2, r.s - 4, r.s - 4);
    // 251차 — 「모양으로도 표시」: 쓸 수 있으면 안쪽 한 줄 더(노랑 ↔ 흰 테가 흰빛으로 섞이는 눈)
    if (usable && shapeCuesOn()) { g.lineStyle(1, cv(0xffe9a0), 0.85); g.strokeRect(r.x + 5, r.y + 5, r.s - 10, r.s - 10); }
  }

  // ═══════════════════════════════════════
  // 손에 든 것 · [F] 선택지
  // ═══════════════════════════════════════

  private held(): InvItem | undefined {
    const id = InventoryStore.quickslots[GameState.player.activeQuickslotIndex];
    return id ? InventoryStore.find(id) : undefined;
  }

  /** 손에 든 것으로 이 칸에 할 일(없으면 null) — 테두리 색 · [F] · 왼쪽 클릭 */
  private heldAction(t: FarmTarget): InteractOption | null {
    // 248차 — 드러난 지렁이가 있으면 손에 든 것보다 먼저 줍는다(곧 다시 파고든다)
    if (FarmStore.wormsAt(t.o.instanceId, t.idx) > 0) return { label: '지렁이 줍기', run: () => this.pickWorms(t), action: 'farm' };
    const held = this.held();
    if (!held || held.qty <= 0) return null;
    const plotId = t.o.instanceId;
    const c = FarmStore.plot(plotId).cells[t.idx];
    if (!c) return null;
    const crop = c.cropId ? getCrop(c.cropId) : undefined;
    const id = held.id;
    if (id === HOMI_ID) {
      if (!c.tilled) return { label: '호미로 일구기', run: () => this.till(t), action: 'farm' };
      if (crop && !c.process) {
        const row = this.dueRows(t).find((r) => (r.st.def.id === 'weed' || r.st.def.id === 'hill_up') && r.missing.length === 0);
        if (row) return { label: CARE_TASK_KO[row.st.def.id], run: () => this.care(t, row.st.def.id), action: 'farm' };
        if (cellReady(c) && (cultivationOf(crop).process?.first ?? cultivationOf(crop).harvestBy) === 'dig') return { label: '호미로 캐기', run: () => this.harvest(t), action: 'farm' };
      }
      return null;
    }
    if (id === WATERING_CAN_ID) {
      if (!c.tilled) return null;
      // 이 작물이 좋아하는 양을 꼬리에(이름 모를 싹 · 빈 칸은 없이) — 「행위의 정도」
      // 안내는 짧게(사용자 「캐릭터 주변 글자가 지저분하다」) — 누르고 있는 시간 = 양은 처음 가이드 · 붓는 동안의 눈금이 말한다
      const pref = crop && !wildUnknown(c) && !c.process ? ` · ${crop.nameKo} ${WATER_AMOUNT_KO[cultivationOf(crop).water.amount]}씩` : '';
      return { label: '물 주기', hint: `[F] ${tl('물 주기')}${pref}`, run: () => this.beginPour(t, false), action: 'farm' };
    }
    if (cropStartOfItem(id)) {
      if (!c.tilled || c.cropId) return null;
      return { label: `${tl('심기')} — ${tl(held.name)}`, run: () => this.plant(t, held), action: 'farm' };
    }
    if (HARVEST_TOOLS.has(id) && crop && (cellReady(c) && !c.nursery && !c.process)) {
      return { label: FarmStore.harvestLabel(plotId, t.idx) ?? '거두기', run: () => this.harvest(t), action: 'farm' };
    }
    // 자재 · 도구가 드는 할 일
    if (crop && !c.process) {
      const row = this.dueRows(t).find((r) => (r.st.def.needs?.some((n) => n.itemId === id) || r.st.def.tools?.includes(id)) && r.missing.length === 0);
      if (row) return { label: CARE_TASK_KO[row.st.def.id], run: () => this.care(t, row.st.def.id), action: 'farm' };
    }
    return null;
  }

  private dueRows(t: FarmTarget): FarmCareRow[] {
    return FarmStore.careRows(t.o.instanceId, t.idx).filter((r) => r.st.status === 'due');
  }

  /** [F] 선택지 — 손에 든 것이 맞으면 그 하나, 아니면 그 칸의 털기 · 거두기 · 할 일 + 텃밭 창 */
  options(): InteractOption[] {
    const t = this.target;
    if (!t || this.pour) return [];
    const act = this.heldAction(t);
    if (act) return [act];
    const plotId = t.o.instanceId;
    const c = FarmStore.plot(plotId).cells[t.idx];
    const out: InteractOption[] = [];
    if (!c) return out;
    const crop = c.cropId ? getCrop(c.cropId) : undefined;
    if (crop && c.process?.dryAt) out.push({ label: PROCESS_LAST_KO[cultivationOf(crop).process?.last ?? 'thresh'], run: () => this.process(t), action: 'farm' });
    if (crop && cellReady(c) && !c.process && !c.nursery) out.push({ label: FarmStore.harvestLabel(plotId, t.idx) ?? '거두기', run: () => this.harvest(t), action: 'farm' });
    if (crop && !c.process && !wildUnknown(c)) {
      for (const r of this.dueRows(t)) {
        if (r.missing.length) continue;
        const id = r.st.def.id;
        out.push({ label: CARE_TASK_KO[id], run: () => this.care(t, id), action: 'farm' });
      }
    }
    out.push({ label: '텃밭 창 열기', note: crop ? (wildUnknown(c) ? '이름 모를 싹' : crop.nameKo) : undefined, run: () => this.host.openPanel(t.o, t.idx), action: 'obj:till' });
    return out;
  }

  /** 왼쪽 클릭 — 손 닿는 칸 위에서 손에 든 것이 그 칸에 쓰이면 처리하고 true(낚시 차지로 넘기지 않는다) */
  pointerDown(): boolean {
    if (this.host.blocked() || this.pour) return false;
    const p = this.host.pointer();
    const hit = p ? this.cellAt(p.x, p.y) : null;
    if (!hit) return false;
    // 손 닿는 칸만(밟은 칸 · 바로 이웃 칸) — 멀리 있는 칸을 누르면 낚시 차지처럼 무시
    const cc = this.cellCenter(hit);
    const f = this.host.feet();
    if (Math.hypot(cc.x - f.x, cc.y - (f.y - 4)) > this.cellPx(hit.o) * REACH) return false;
    const act = this.heldAction(hit);
    if (!act) return false;
    // 누른 칸을 잠깐 짚는다(밟은 칸이 아니어도 어느 칸에 했는지 보이게)
    const flash = this.host.scene.add.graphics().setDepth(6.46);
    this.drawCellBorder(flash, hit, true);
    this.host.scene.tweens.add({ targets: flash, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
    if (this.held()?.id === WATERING_CAN_ID && FarmStore.wormsAt(hit.o.instanceId, hit.idx) <= 0) { this.beginPour(hit, true); return true; }
    act.run?.();
    return true;
  }

  pointerUp(): void { if (this.pour?.viaMouse) this.finishPour(true); }

  // ═══════════════════════════════════════
  // 일 · 연출
  // ═══════════════════════════════════════

  private cellPlotId(t: FarmTarget): string { return t.o.instanceId; }

  private report(r: FarmActionResult): void {
    this.host.floatingHint(r.message);
    if (r.ok) {
      for (const h of r.harvested ?? []) this.host.pushLog(`[텃밭] ${h.name} ×${h.qty}`);
      this.host.inventoryChanged();
    }
    // 248차 — 드러난 지렁이는 다음 프레임에 그 칸에 그려진다(흙 튐을 한 번 더)
    if (r.worms?.length) this.syncWorms(0);
  }

  // ── 248차 — 땅지렁이 ──

  /** 드러난 지렁이 그림을 스토어와 맞추고 꿈틀거리게 한다(파고들기 8초 전부터 흐려진다) */
  private syncWorms(delta: number): void {
    const now = Date.now();
    const live = FarmStore.exposedWorms(now);
    const keep = new Set<string>();
    const plots = this.host.plots();
    for (const w of live) {
      const o = plots.find((p) => p.instanceId === w.plotId);
      if (!o) continue;
      const key = `${w.plotId}:${w.idx}`;
      keep.add(key);
      const want = Math.min(3, w.n);
      let ws = this.wormViews.get(key);
      if (!ws || ws.length !== want) {
        ws?.forEach((x) => x.g.destroy());
        ws = this.spawnWorms(o, w.idx, want);
        this.wormViews.set(key, ws);
      }
      const left = w.untilMs - now;
      const alpha = left < 8000 ? Math.max(0.2, left / 8000) : 1;
      for (const x of ws) { x.phase += delta * 0.007; this.drawWorm(x, alpha); }
    }
    for (const [k, ws] of this.wormViews) if (!keep.has(k)) { ws.forEach((x) => x.g.destroy()); this.wormViews.delete(k); }
  }

  /** 한 칸에 지렁이 n마리 — 칸 아래쪽 흙 위(포기 밑동 양옆) · 흙이 튀며 나온다 */
  private spawnWorms(o: MapObject, idx: number, n: number): WormSprite[] {
    const scene = this.host.scene;
    const r = this.cellRect(o, idx);
    const spots: [number, number][] = [[0.28, 0.7], [0.72, 0.6], [0.5, 0.86]];
    const depth = 20 + (r.y + r.s - FEET_OFFSET) * 0.001 + 0.0002;   // 그 칸 포기보다 조금 앞(잎에 묻히지 않게)
    const out: WormSprite[] = [];
    for (let k = 0; k < n; k++) {
      const [fx, fy] = spots[k];
      // 2px 격자에 맞춘다(맵 입자)
      const x = Math.round((r.x + r.s * fx) / 2) * 2, y = Math.round((r.y + r.s * fy) / 2) * 2;
      const g = scene.add.graphics().setPosition(x, y).setDepth(depth);
      out.push({ g, phase: Math.random() * Math.PI * 2, dir: k % 2 ? -1 : 1 });
      this.fxDirt(x, y, 0x6a4a2c, 4);
      scene.tweens.add({ targets: g, scaleY: { from: 0, to: 1 }, duration: 220, delay: k * 90, ease: 'Back.easeOut' });
    }
    return out;
  }

  /** 지렁이 한 마리 — 2px 마디 7개가 사인 물결로 꿈틀(머리 짙게 · 환대 밝게 · 아래 그림자) */
  private drawWorm(w: WormSprite, alpha: number): void {
    const g = w.g;
    g.clear();
    for (let i = 0; i < 7; i++) {
      const x = (i * 2 - 6) * w.dir;
      const y = Math.round(Math.sin(w.phase + i * 0.95)) * 2;
      g.fillStyle(WORM.shadow, 0.4 * alpha); g.fillRect(x, y + 2, 2, 2);
      g.fillStyle(i === 0 ? WORM.head : i === 2 || i === 3 ? WORM.band : WORM.body, alpha);
      g.fillRect(x, y, 2, 2);
    }
  }

  /** 드러난 지렁이를 줍는다 — 가방으로 날아간다 */
  private pickWorms(t: FarmTarget): void {
    const key = `${t.o.instanceId}:${t.idx}`;
    const views = this.wormViews.get(key) ?? [];
    const r = FarmStore.pickWorms(t.o.instanceId, t.idx);
    if (!r.ok) { this.host.floatingHint(r.message); return; }
    this.did.worms++;
    const f = this.host.feet();
    const scene = this.host.scene;
    for (const [k, v] of views.entries()) {
      const { x, y } = v.g;
      v.g.destroy();
      if (!scene.textures.exists(FARM_WORM_TEX)) continue;
      const img = scene.add.image(x, y, FARM_WORM_TEX).setDepth(21).setScale(0.5);
      scene.tweens.add({ targets: img, x: f.x, y: f.y - 26, scale: 0.3, alpha: 0.4, duration: 420, delay: k * 90, ease: 'Sine.easeIn', onComplete: () => img.destroy() });
    }
    this.wormViews.delete(key);
    this.report(r);
  }

  private till(t: FarmTarget): void {
    const r = FarmStore.till(this.cellPlotId(t), t.idx);
    if (!r.ok) { this.host.floatingHint(r.message); return; }
    this.did.till++;
    const cc = this.cellCenter(t);
    this.fxTool('it_homi', cc);
    this.fxDirt(cc.x, cc.y, 0x6a4a2c, 10);
    this.renderPlot(t.o);
    this.report(r);
  }

  private beginPour(t: FarmTarget, viaMouse: boolean): void {
    if (this.pour) return;
    if (!FarmStore.plot(t.o.instanceId).cells[t.idx]?.tilled) { this.host.floatingHint('먼저 땅을 일군다'); return; }
    this.pour = { t, startMs: performance.now(), viaMouse };
    this.pourText.setVisible(true);
    this.drawPour();
  }

  private pourAmount(): WaterAmount {
    const ms = this.pour ? performance.now() - this.pour.startMs : 0;
    return ms >= POUR_MS.deep ? 'deep' : ms >= POUR_MS.normal ? 'normal' : 'light';
  }

  /** 붓는 동안 칸 위 게이지(조금 · 보통 · 흠뻑) · 물줄기 */
  private drawPour(): void {
    const p = this.pour;
    if (!p) return;
    const cc = this.cellCenter(p.t);
    const ms = performance.now() - p.startMs;
    const k = Math.min(1, ms / (POUR_MS.deep * 1.15));
    const g = this.pourG;
    g.clear();
    const w = 40, x = cc.x - w / 2, y = cc.y - 26;
    g.fillStyle(0x0d1a28, 0.9); g.fillRect(x, y, w, 5);
    g.fillStyle(0x4aa0e0, 1); g.fillRect(x, y, Math.round(w * k), 5);
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(x + Math.round(w * POUR_MS.normal / (POUR_MS.deep * 1.15)), y - 1, 1, 7);
    g.fillRect(x + Math.round(w * POUR_MS.deep / (POUR_MS.deep * 1.15)), y - 1, 1, 7);
    // 물줄기
    g.fillStyle(0x8ddcf5, 0.9);
    for (let i = 0; i < 4; i++) g.fillRect(cc.x - 4 + i * 3, cc.y - 10 + ((Math.floor(ms / 60) + i * 3) % 8), 1, 2);
    this.pourText.setText(tl(`물 ${WATER_AMOUNT_KO[this.pourAmount()]}`)).setPosition(cc.x, y - 2);
  }

  private finishPour(viaMouse: boolean): void {
    const p = this.pour;
    if (!p || p.viaMouse !== viaMouse) return;
    const amount = this.pourAmount();
    this.pour = null;
    this.pourG.clear();
    this.pourText.setVisible(false);
    const r = FarmStore.water(p.t.o.instanceId, amount, [p.t.idx]);
    if (r.ok) {
      this.did.water++;
      const cc = this.cellCenter(p.t);
      this.fxWater(cc.x, cc.y, amount);
      this.renderPlot(p.t.o);
    }
    this.report(r);
  }

  private plant(t: FarmTarget, item: InvItem): void {
    const found = cropStartOfItem(item.id);
    const r = FarmStore.plant(this.cellPlotId(t), t.idx, item.id);
    if (!r.ok) { this.host.floatingHint(r.message); return; }
    this.did.plant++;
    const cc = this.cellCenter(t);
    const f = this.host.feet();
    const kind = found?.start.kind ?? 'seed';
    if (kind === 'seedling') {
      this.fxFly(item.iconTexture?.replace(/^px:/, '') ?? item.id, f.x, f.y - 20, cc.x, cc.y + 4, () => {
        this.fxDirt(cc.x, cc.y + 6, 0x5a3e26, 6);
        this.renderPlot(t.o, { idx: t.idx, part: 'plant' });
      });
    } else {
      this.fxSeeds(cc.x, cc.y);
      this.renderPlot(t.o, { idx: t.idx, part: 'plant' });
    }
    this.report(r);
  }

  private harvest(t: FarmTarget): void {
    const plotId = this.cellPlotId(t);
    const before = FarmStore.plot(plotId).cells[t.idx];
    const crop = before?.cropId ? getCrop(before.cropId) : undefined;
    const r = FarmStore.harvest(plotId, t.idx);
    if (!r.ok) { this.host.floatingHint(r.message); return; }
    this.did.harvest++;
    const cc = this.cellCenter(t);
    const f = this.host.feet();
    const by = crop ? cultivationOf(crop).process?.first ?? cultivationOf(crop).harvestBy : 'pick';
    if (by === 'cut') this.fxTool('it_sickle', cc);
    if (by === 'dig') { this.fxTool('it_homi', cc); this.fxDirt(cc.x, cc.y, 0x6a4a2c, 8); }
    for (const [k, h] of (r.harvested ?? []).entries()) {
      this.host.scene.time.delayedCall(k * 120, () => this.fxFly(h.itemId.replace(/_(special|good|normal)$/, ''), cc.x, cc.y - 4, f.x, f.y - 26, undefined, true));
    }
    this.renderPlot(t.o, { idx: t.idx, part: 'plant' });
    this.report(r);
  }

  /** 작업 장면 — 관리 작업 */
  private care(t: FarmTarget, task: CareTaskId): void {
    const why = openCareTask(this.actionHost(t), this.cellPlotId(t), t.idx, task);
    if (why) this.host.floatingHint(why);
  }

  /** 작업 장면 — 털기 → 키질 */
  private process(t: FarmTarget): void {
    const why = openProcess(this.actionHost(t), this.cellPlotId(t), t.idx);
    if (why) this.host.floatingHint(why);
  }

  private actionHost(t: FarmTarget): FarmActionHost {
    return {
      scene: this.host.scene,
      openPopup: this.host.openPopup,
      at: () => ({ x: GAME_WIDTH / 2 - 300, y: 110 }),
      after: (r: FarmActionResult, what: FarmActionWhat) => this.afterScene(t, r, what),
    };
  }

  /** 장면이 끝난 뒤 — 해 둔 일이 칸에 생긴다(튀어나옴 + 반짝임) · 거둔 것은 가방으로 */
  private afterScene(t: FarmTarget, r: FarmActionResult, what: FarmActionWhat): void {
    const cc = this.cellCenter(t);
    if (r.ok) {
      if (what.kind === 'care') this.did.care++;
      this.fxSparkle(cc.x, cc.y - 6);
      if (what.kind === 'process') {
        const f = this.host.feet();
        for (const [k, h] of (r.harvested ?? []).entries()) {
          this.host.scene.time.delayedCall(k * 120, () => this.fxFly(h.itemId.replace(/_(special|good|normal)$/, ''), cc.x, cc.y - 4, f.x, f.y - 26, undefined, true));
        }
      }
    }
    this.renderPlot(t.o, r.ok ? { idx: t.idx, part: what.kind === 'care' ? 'deco' : 'plant' } : undefined);
    this.report(r);
  }

  // ── 연출 조각 ──

  /** 흙 튐 */
  private fxDirt(x: number, y: number, col: number, n: number): void {
    const scene = this.host.scene;
    for (let i = 0; i < n; i++) {
      const p = scene.add.rectangle(x, y, 2, 2, i % 3 === 0 ? 0x8a6038 : col).setDepth(6.6);
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      scene.tweens.add({ targets: p, x: x + Math.cos(a) * (6 + Math.random() * 6), y: y + Math.sin(a) * 4 - 6 - Math.random() * 4, alpha: 0, duration: 380 + Math.random() * 160, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    }
  }

  /** 물방울 — 양에 따라 수가 다르다 */
  private fxWater(x: number, y: number, amount: WaterAmount): void {
    const scene = this.host.scene;
    const n = amount === 'deep' ? 14 : amount === 'normal' ? 8 : 4;
    for (let i = 0; i < n; i++) {
      const sx = x - 7 + Math.random() * 14;
      const p = scene.add.rectangle(sx, y - 18 - Math.random() * 6, 1, 2, 0x8ddcf5).setDepth(6.6);
      scene.tweens.add({ targets: p, y: y + Math.random() * 6 - 2, duration: 260 + Math.random() * 140, delay: i * 30, ease: 'Quad.easeIn', onComplete: () => {
        p.destroy();
        const s = scene.add.rectangle(sx, y + 2, 3, 1, 0xbfefff, 0.9).setDepth(6.6);
        scene.tweens.add({ targets: s, scaleX: 2, alpha: 0, duration: 220, onComplete: () => s.destroy() });
      } });
    }
  }

  /** 씨앗이 이랑에 떨어진다 */
  private fxSeeds(x: number, y: number): void {
    const scene = this.host.scene;
    for (let i = 0; i < 5; i++) {
      const p = scene.add.rectangle(x - 6 + i * 3, y - 14, 1, 1, 0xd8c890).setDepth(6.6);
      scene.tweens.add({ targets: p, y: y + 3, duration: 240, delay: i * 50, ease: 'Bounce.easeOut', onComplete: () => p.destroy() });
    }
    this.host.scene.time.delayedCall(320, () => this.fxDirt(x, y + 3, 0x5a3e26, 5));
  }

  /** 반짝임(작업 끝) */
  private fxSparkle(x: number, y: number): void {
    const scene = this.host.scene;
    for (let i = 0; i < 5; i++) {
      const sx = x - 8 + Math.random() * 16, sy = y - 6 + Math.random() * 10;
      const g = scene.add.graphics().setDepth(6.7);
      g.fillStyle(0xfff4b0, 1); g.fillRect(-1, 0, 3, 1); g.fillRect(0, -1, 1, 3);
      g.setPosition(sx, sy).setScale(0.4);
      scene.tweens.add({ targets: g, scale: 1.4, alpha: 0, y: sy - 6, duration: 520, delay: i * 70, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
    }
  }

  /** 도구가 칸을 향해 한 번 휘두른다 */
  private fxTool(icon: string, cc: { x: number; y: number }): void {
    const f = this.host.feet();
    const right = cc.x >= f.x;
    const img = addPixelIcon(this.host.scene, icon, (f.x + cc.x) / 2 + (right ? 4 : -4), Math.min(f.y, cc.y) - 12, 16);
    if (!img) return;
    img.setDepth(21).setFlipX(!right).setAngle(right ? -50 : 50);
    this.host.scene.tweens.add({ targets: img, angle: right ? 40 : -40, y: img.y + 8, duration: 200, ease: 'Quad.easeIn', onComplete: () => {
      this.host.scene.tweens.add({ targets: img, alpha: 0, duration: 160, onComplete: () => img.destroy() });
    } });
  }

  /** 아이콘이 포물선으로 날아간다(모종 → 칸 · 거둔 것 → 가방) */
  private fxFly(icon: string, x0: number, y0: number, x1: number, y1: number, onLand?: () => void, toBag = false): void {
    const scene = this.host.scene;
    const img = addPixelIcon(scene, icon, x0, y0, 16);
    if (!img) { onLand?.(); return; }
    img.setDepth(21);
    const peak = Math.min(y0, y1) - 18;
    const s = { k: 0 };
    scene.tweens.add({
      targets: s, k: 1, duration: toBag ? 520 : 360, ease: 'Sine.easeInOut',
      onUpdate: () => {
        const k = s.k;
        img.setPosition(x0 + (x1 - x0) * k, (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * peak + k * k * y1);
        if (toBag) img.setScale(1 - 0.5 * k);
      },
      onComplete: () => { img.destroy(); onLand?.(); },
    });
  }

  // ═══════════════════════════════════════
  // 가이드 · 하네스
  // ═══════════════════════════════════════

  private screenRectOf(t: FarmTarget, pad = 2): Phaser.Geom.Rectangle {
    const cam = this.host.scene.cameras.main;
    const r = this.cellRect(t.o, t.idx);
    return new Phaser.Geom.Rectangle((r.x - cam.worldView.x) * cam.zoom - pad, (r.y - cam.worldView.y) * cam.zoom - pad, r.s * cam.zoom + pad * 2, r.s * cam.zoom + pad * 2);
  }

  private buildTour(): TourOptions | null {
    const t = this.target;
    if (!t) return null;
    const keep = t;
    return {
      id: 'farm_field',
      anchor: () => this.screenRectOf(keep, 40),
      alive: () => !!this.target,
      steps: [
        { text: '텃밭 한 칸(2×2)을 밟고 서면 그 칸 테두리가 약하게 빛난다. [F]는 그 칸에 한다.', target: () => this.screenRectOf(this.target ?? keep) },
        { text: '퀵슬롯에 든 것에 따라 [F]로 하는 일이 바뀐다 — 호미는 일구기, 물뿌리개는 물(누르고 있을수록 많이), 씨앗 · 모종은 심기, 지주대 · 끈 · 약은 그 일. 손 닿는 이웃 칸은 눌러서 해도 된다.', target: () => this.screenRectOf(this.target ?? keep, 6) },
        { text: '칸 오른쪽 위 그림은 지금 할 것이다 — 거둘 것 · 털 때 · 할 일의 자재 · 목마름. 손에 맞는 것이 없으면 [F]로 그 칸의 일을 고르거나 텃밭 창을 연다.', target: () => this.screenRectOf(this.target ?? keep, 10) },
      ],
    };
  }

  /** 하네스: 지금 겨눈 칸 */
  devTarget(): { plotId: string; idx: number } | null { return this.target ? { plotId: this.target.o.instanceId, idx: this.target.idx } : null; }
  /** 하네스: 칸을 직접 겨눈 채로 둔다(사람 위치와 상관없이 — 그림 · 칸 정보 확인용). idx < 0이면 푼다 */
  devAim(plotId: string, idx: number): void {
    const o = this.host.plots().find((x) => x.instanceId === plotId);
    this.devLock = o && idx >= 0 ? { o, idx } : null;
  }
  private devLock: FarmTarget | null = null;
  /** 하네스: 칸 그림 서명 */
  devSig(plotId: string, idx: number): { sig: string; deco: string; ind?: string } | null {
    const v = this.views.get(plotId)?.[idx];
    return v ? { sig: v.sig, deco: v.decoSig, ind: v.indKey } : null;
  }
  /** 하네스: 드러난 지렁이 그림 수(칸 키별) */
  devWormViews(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, ws] of this.wormViews) out[k] = ws.length;
    return out;
  }
  /** 하네스: 물 붓기(ms 만큼 누른 것으로) */
  devPour(ms: number): void {
    const t = this.target;
    if (!t) return;
    this.beginPour(t, false);
    if (this.pour) this.pour.startMs = performance.now() - ms;
    this.finishPour(false);
  }
}
