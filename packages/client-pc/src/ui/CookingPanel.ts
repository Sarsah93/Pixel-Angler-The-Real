/**
 * @file CookingPanel.ts
 * @description 불요리 조리 패널 (154차 — 스펙 §9). 현장 화구 [F]와 집 주방 [F]가 **같은 패널**을 연다.
 *
 * 좌(260) 레시피/재료 · 중앙(400) 용기 단면(불꽃·국물·재료·김) + 온도 바(적정대) + 불 세기 + 진행/사건 ·
 * 우(200) 맛 미리보기 5행(픽셀 별) + 단계 가이드 + 연료·용기.
 *
 * 규칙: DraggablePanel(모달 900) · 텍스트 clamp/wordWrap · enforceTextBounds · 판정은 core(`CookingStore`가 위임).
 * 실시간: 씬 `update` 이벤트로 0.25초마다 동적 영역만 다시 그린다(패널을 닫아도 시뮬은 계속 — 열면 그 상태가 보인다).
 * ⚠ 헤드리스에서는 `scene.time` 타이머가 발화하지 않으므로(128차) 씬 update 이벤트를 쓴다.
 */

import Phaser from 'phaser';
import {
  TUNING, getFireRecipe, getCookware, getCookIngredient, getHeatSource, recipesForCookware, reqFor, unitsOf, ingredientOfItem,
  evaluateSession, effectiveHeatW, HEAT_LABEL_KO, RECIPE_FAMILY_KO, SALT_LABEL_KO, SUGAR_LABEL_KO, STAR_NAME_KO, fmtUnits,
  type DeployedStove, type HeatLevel, type FireRecipeDef, type CookwareDef, type RecipeIngredientReq,
} from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { CookingStore } from '../store/CookingStore.js';
import { InventoryStore, type InvItem } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { clampTextWidth, enforceTextBounds } from './TextFit.js';
import { addPixelIcon } from './PixelIcon.js';
import { t } from '../i18n/I18n.js';

const PANEL_W = 900;
const PANEL_H = 600;
const L_W = 262;
const C_X = 276;
const C_W = 400;
const R_X = 690;
const R_W = 196;
const FONT = '"Noto Sans KR", sans-serif';

export interface CookingPanelCallbacks {
  onClose: () => void;
  /** 인벤 변화(재료 소비·요리 지급) 알림 */
  onChanged?: () => void;
}

interface IngRow {
  item: InvItem | null;         // null = 집 수도(물)
  ing: string;
  req: RecipeIngredientReq;
  required: boolean;
  units: number;                // 스테퍼 값(spoon/cup) — g 재료는 전체
}

export class CookingPanel extends DraggablePanel {
  private cbs: CookingPanelCallbacks;
  private stove: DeployedStove;
  private staticC: Phaser.GameObjects.Container;
  private dynC: Phaser.GameObjects.Container;
  private acc = 0;
  private stepper = new Map<string, number>();
  private listScroll = 0;
  private status = '';
  private statusText?: Phaser.GameObjects.Text;
  private pickRecipe: string | null = null;
  /** 마지막으로 정적 레이아웃을 그린 모드 — 세션이 밖에서 생기거나 사라지면(완성 후 내림·탐) 전체를 다시 그린다 */
  private layoutKey = '';
  private onUpdate = (_t: number, dt: number): void => {
    this.acc += dt;
    if (this.acc <= 250) return;
    this.acc = 0;
    const key = `${this.stove.cookwareId ?? ''}|${this.stove.session?.recipeId ?? ''}|${this.stove.session?.status ?? ''}`;
    if (key !== this.layoutKey) { this.renderAll(); return; }
    this.renderDynamic();
  };
  private onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number): void => {
    if (!this.containsPointer(p)) return;
    const lx = p.x - this.x;
    if (lx > L_W + 8) return;
    this.listScroll = Math.max(0, this.listScroll + (dy > 0 ? 1 : -1));
    this.renderAll();
  };

  constructor(scene: Phaser.Scene, x: number, y: number, stove: DeployedStove, cbs: CookingPanelCallbacks) {
    super(scene, { x, y, width: PANEL_W, height: PANEL_H, title: '요리하기', onClose: cbs.onClose, dim: true, depth: 900 });
    this.cbs = cbs;
    this.stove = stove;
    this.staticC = scene.add.container(0, 0);
    this.dynC = scene.add.container(0, 0);
    this.add([this.staticC, this.dynC]);
    CookingStore.syncOne(stove, Date.now());
    this.renderAll();
    scene.events.on('update', this.onUpdate);
    scene.input.on('wheel', this.onWheel);
    this.applyFix();
  }

  /** 현재 포인터가 패널 안인가 (휠 게이트) */
  private containsPointer(p: Phaser.Input.Pointer): boolean {
    return p.x >= this.x && p.x <= this.x + PANEL_W && p.y >= this.y && p.y <= this.y + PANEL_H;
  }

  private say(msg: string): void {
    this.status = msg;
    this.statusText?.setText(msg);
  }

  private recipe(): FireRecipeDef | undefined { return CookingStore.recipeOf(this.stove); }
  private cookware(): CookwareDef | undefined { return CookingStore.cookwareOf(this.stove); }

  // ═══════════════════════════════════════════════
  // 전체 렌더
  // ═══════════════════════════════════════════════

  private renderAll(): void {
    this.layoutKey = `${this.stove.cookwareId ?? ''}|${this.stove.session?.recipeId ?? ''}|${this.stove.session?.status ?? ''}`;
    this.staticC.removeAll(true);
    this.dynC.removeAll(true);
    const sc = this.scene;
    const top = this.contentTop + 6;
    // 헤더 — 화구·용기·연료 한 줄
    const src = getHeatSource(this.stove.heatSourceId);
    const cw = this.cookware();
    const fuel = this.stove.fuelRemainMin < 0 ? '연료 무한' : `연료 ${Math.round(this.stove.fuelRemainMin)}분`;
    const head = sc.add.text(14, top, `${src?.nameKo ?? '화구'} · ${cw ? cw.nameKo : '용기 없음'} · ${fuel}${CookingStore.isHome(this.stove) ? ' · 수도 있음' : ''}`, { fontFamily: FONT, fontSize: '12px', color: '#9fd5ff', fontStyle: 'bold' });
    clampTextWidth(head, PANEL_W - 28);
    this.staticC.add(head);
    // 구획선
    const g = sc.add.graphics();
    g.lineStyle(1, 0x2a4a68, 0.9);
    g.lineBetween(C_X - 8, top + 22, C_X - 8, PANEL_H - 40);
    g.lineBetween(R_X - 8, top + 22, R_X - 8, PANEL_H - 40);
    this.staticC.add(g);
    // 상태줄 (하단 안쪽)
    this.statusText = sc.add.text(14, PANEL_H - 30, this.status, { fontFamily: FONT, fontSize: '11px', color: '#ffe0a8' });
    clampTextWidth(this.statusText, PANEL_W - 28);
    this.staticC.add(this.statusText);

    if (!this.stove.session) this.renderSetup(top + 28);
    else { this.renderIngredients(top + 28); this.renderRight(top + 28); }
    this.renderDynamic();
    enforceTextBounds(this.staticC, PANEL_W - 10, 'CookingPanel');
    this.applyFix();
  }

  // ═══════════════════════════════════════════════
  // 준비 화면 — 용기 올리기 · 연료 · 레시피 고르기
  // ═══════════════════════════════════════════════

  private renderSetup(y0: number): void {
    const sc = this.scene;
    let y = y0;
    const cw = this.cookware();
    const mkBtn = (x: number, yy: number, w: number, label: string, on: boolean, run: () => void): void => {
      const r = sc.add.rectangle(x, yy, w, 24, on ? 0x1f5a3a : 0x2a3340, 1).setOrigin(0, 0).setStrokeStyle(1, on ? 0x4af2a1 : 0x3a4a5a, 1);
      const t = sc.add.text(x + w / 2, yy + 12, label, { fontFamily: FONT, fontSize: '11px', color: on ? '#e8fff0' : '#6a7a8a', fontStyle: 'bold' }).setOrigin(0.5);
      clampTextWidth(t, w - 10);
      if (on) { r.setInteractive({ useHandCursor: true }); r.on('pointerdown', run); }
      this.staticC.add([r, t]);
    };
    // ── 좌: 용기 · 연료 ──
    const h1 = sc.add.text(14, y, cw ? `용기: ${cw.nameKo}` : '용기를 올리세요', { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd', fontStyle: 'bold' });
    this.staticC.add(h1); y += 22;
    const wares = InventoryStore.items.filter((i) => i.cookwareId && i.qty > 0);
    if (wares.length === 0 && !cw) {
      const t = sc.add.text(14, y, '가진 용기가 없습니다 — 식자재마트에서 코펠·냄비·팬·석쇠를 판다', { fontFamily: FONT, fontSize: '10px', color: '#8a97a8', wordWrap: { width: L_W - 20 } });
      this.staticC.add(t); y += t.height + 6;
    }
    for (const w of wares.slice(0, 5)) {
      const cwd = getCookware(w.cookwareId ?? '');
      mkBtn(14, y, L_W - 24, `${w.name} 올리기`, true, () => {
        const r = CookingStore.attachCookware(this.stove, w); this.say(r.message); this.cbs.onChanged?.(); this.renderAll();
      });
      y += 28;
      void cwd;
    }
    if (cw) {
      mkBtn(14, y, L_W - 24, '용기 내리기', true, () => { const r = CookingStore.detachCookware(this.stove); this.say(r.message); this.cbs.onChanged?.(); this.renderAll(); });
      y += 28;
    }
    if (!CookingStore.isHome(this.stove)) {
      const cans = InventoryStore.items.filter((i) => i.fuelId && i.qty > 0);
      const need = this.stove.fuelRemainMin <= 27;
      y += 6;
      const ft = sc.add.text(14, y, `연료 ${Math.round(Math.max(0, this.stove.fuelRemainMin))}분 (강불 기준)`, { fontFamily: FONT, fontSize: '11px', color: this.stove.fuelRemainMin <= 5 ? '#ff9a9a' : '#c8d8e8' });
      this.staticC.add(ft); y += 20;
      if (cans.length > 0) {
        mkBtn(14, y, L_W - 24, `${cans[0].name} 끼우기 (x${cans[0].qty})`, need, () => { const r = CookingStore.addFuel(this.stove, cans[0]); this.say(r.message); this.cbs.onChanged?.(); this.renderAll(); });
        y += 28;
      } else if (need) {
        const t = sc.add.text(14, y, '캐니스터가 없습니다 — 식자재마트', { fontFamily: FONT, fontSize: '10px', color: '#ff9a9a' });
        this.staticC.add(t); y += 18;
      }
    }
    // ── 중앙: 레시피 목록 (용기로 필터) ──
    let cy = y0;
    const h2 = sc.add.text(C_X, cy, cw ? `${cw.nameKo}(으)로 만들 수 있는 요리` : '용기를 올리면 만들 수 있는 요리가 보입니다', { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd', fontStyle: 'bold' });
    clampTextWidth(h2, C_W); this.staticC.add(h2); cy += 24;
    if (cw) {
      const list = recipesForCookware(cw.kind);
      for (const r of list) {
        const isSel = this.pickRecipe === r.id;
        const bg = sc.add.rectangle(C_X, cy, C_W - 4, 44, isSel ? 0x1f4a6a : 0x122236, 0.95).setOrigin(0, 0).setStrokeStyle(1, isSel ? 0x5cd0ff : 0x2a3a4a, 1);
        // 170차 — 실사 사진이 있는 레시피는 그 그림을 쓴다(같은 family라도 그림이 다르다).
        const icon: Phaser.GameObjects.GameObject | null = r.photoKey && sc.textures.exists(r.photoKey)
          ? (() => {
              const im = sc.add.image(C_X + 18, cy + 22, r.photoKey!);
              const src = sc.textures.get(r.photoKey!).getSourceImage() as HTMLImageElement;
              im.setDisplaySize(24, Math.max(1, Math.round((24 * src.height) / src.width)));
              return im;
            })()
          : addPixelIcon(sc, `it_dish_${r.family}`, C_X + 18, cy + 22, 24);
        // ⚠ 합성 문자열은 사전을 비껴간다(131차) — 조각을 먼저 번역하고 붙인다
        const name = sc.add.text(C_X + 36, cy + 5, `${t(r.nameKo)}  ·  ${t(RECIPE_FAMILY_KO[r.family])} · ${t(`약 ${r.cookMin}분`)}`, { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd', fontStyle: 'bold' });
        clampTextWidth(name, C_W - 46);
        const req = r.required.filter((q) => !q.onlyWith || q.onlyWith === cw.kind).map((q) => (Array.isArray(q.ing) ? q.ing : [q.ing]).map((id) => t(getCookIngredient(id)?.nameKo ?? id)).join('/')).join(' · ');
        const sub = sc.add.text(C_X + 36, cy + 24, `${t('필수:')} ${req}`, { fontFamily: FONT, fontSize: '10px', color: '#8fa8bf' });
        clampTextWidth(sub, C_W - 46);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => { this.pickRecipe = r.id; this.renderAll(); });
        this.staticC.add([bg, name, sub]);
        if (icon) this.staticC.add(icon);
        cy += 48;
      }
      if (list.length === 0) { const t = sc.add.text(C_X, cy, '이 용기로 만드는 요리가 아직 없습니다', { fontFamily: FONT, fontSize: '11px', color: '#8a97a8' }); this.staticC.add(t); }
    }
    // ── 우: 선택 레시피 설명 + 시작 ──
    let ry = y0;
    const r = this.pickRecipe ? getFireRecipe(this.pickRecipe) : undefined;
    if (r) {
      const t1 = sc.add.text(R_X, ry, r.nameKo, { fontFamily: FONT, fontSize: '13px', color: '#ffe08a', fontStyle: 'bold' });
      clampTextWidth(t1, R_W); this.staticC.add(t1); ry += 22;
      const t2 = sc.add.text(R_X, ry, r.descKo, { fontFamily: FONT, fontSize: '10px', color: '#c8d8e8', wordWrap: { width: R_W }, lineSpacing: 2 });
      this.staticC.add(t2); ry += t2.height + 8;
      const t3 = sc.add.text(R_X, ry, r.stages.map((s, i) => `${i + 1}. ${s.labelKo}`).join('\n'), { fontFamily: FONT, fontSize: '10px', color: '#8fa8bf', wordWrap: { width: R_W }, lineSpacing: 3 });
      this.staticC.add(t3); ry += t3.height + 10;
      const opt = r.optional.map((q) => (Array.isArray(q.ing) ? q.ing : [q.ing]).map((id) => t(getCookIngredient(id)?.nameKo ?? id)).join('|')).join(' · ');
      const t4 = sc.add.text(R_X, ry, `${t(`더 넣으면 좋은 것 (${r.maxExtraKinds}종까지):`)} ${opt}`, { fontFamily: FONT, fontSize: '10px', color: '#8fa8bf', wordWrap: { width: R_W }, lineSpacing: 2 });
      this.staticC.add(t4); ry += t4.height + 12;
      mkBtn(R_X, Math.min(ry, PANEL_H - 70), R_W, '이 요리 시작', !!cw, () => {
        const res = CookingStore.startRecipe(this.stove, r.id); this.say(res.message); if (res.ok) { this.listScroll = 0; this.stepper.clear(); } this.renderAll();
      });
    } else {
      const t = sc.add.text(R_X, ry, '요리를 고르면 순서와 재료가 여기 보입니다.', { fontFamily: FONT, fontSize: '10px', color: '#8a97a8', wordWrap: { width: R_W } });
      this.staticC.add(t);
    }
  }

  // ═══════════════════════════════════════════════
  // 조리 화면 — 좌: 재료 투입
  // ═══════════════════════════════════════════════

  private ingredientRows(): IngRow[] {
    const r = this.recipe(); const cw = this.cookware(); const s = this.stove.session;
    if (!r || !cw || !s) return [];
    const rows: IngRow[] = [];
    const seen = new Set<string>();
    // 집 수도 — 물 행
    if (CookingStore.isHome(this.stove)) {
      const hit = reqFor(r, 'water');
      if (hit) { rows.push({ item: null, ing: 'water', req: hit.req, required: hit.required, units: this.stepper.get('water:tap') ?? (hit.req.ideal ?? hit.req.min) }); seen.add('water'); }
    }
    for (const it of InventoryStore.items) {
      if (it.qty <= 0 || it.slot < 0) continue;
      const m = ingredientOfItem(it);
      if (!m) continue;
      const hit = reqFor(r, m.ing);
      if (!hit) continue;
      if (hit.req.onlyWith && hit.req.onlyWith !== cw.kind) continue;
      const def = getCookIngredient(m.ing);
      if (!def) continue;
      const key = `${m.ing}:${it.id}`;
      const dflt = def.unit === 'g' ? m.units : (hit.req.ideal ?? hit.req.min);
      rows.push({ item: it, ing: m.ing, req: hit.req, required: hit.required, units: this.stepper.get(key) ?? dflt });
      seen.add(m.ing);
    }
    rows.sort((a, b) => (a.required === b.required ? a.req.stage - b.req.stage : a.required ? -1 : 1));
    return rows;
  }

  private renderIngredients(y0: number): void {
    const sc = this.scene; const r = this.recipe()!; const s = this.stove.session!;
    const h = sc.add.text(14, y0, `재료 넣기 — ${r.nameKo}`, { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd', fontStyle: 'bold' });
    clampTextWidth(h, L_W - 20); this.staticC.add(h);
    const rows = this.ingredientRows();
    const ROW = 30;
    const maxRows = Math.floor((PANEL_H - 46 - (y0 + 22)) / ROW);
    this.listScroll = Math.max(0, Math.min(this.listScroll, Math.max(0, rows.length - maxRows)));
    const vis = rows.slice(this.listScroll, this.listScroll + maxRows);
    let y = y0 + 22;
    if (rows.length === 0) {
      const t = sc.add.text(14, y, '이 요리에 넣을 재료가 인벤토리에 없습니다. 어획물·손질 부산물·채집물·식자재마트 재료를 준비하세요.', { fontFamily: FONT, fontSize: '10px', color: '#8a97a8', wordWrap: { width: L_W - 20 } });
      this.staticC.add(t);
    }
    for (const row of vis) {
      const def = getCookIngredient(row.ing)!;
      const have = unitsOf(s, row.ing);
      const key = row.item ? `${row.ing}:${row.item.id}` : 'water:tap';
      const bg = sc.add.rectangle(10, y, L_W - 16, ROW - 3, row.required ? 0x122236 : 0x101a26, 0.95).setOrigin(0, 0).setStrokeStyle(1, have > 0 ? 0x4af2a1 : 0x2a3a4a, 0.8);
      this.staticC.add(bg);
      const nm = row.item ? row.item.name : '물 (수도)';
      const qty = row.item ? (def.unit === 'g' ? `${row.item.weightG ?? 0}g` : `x${row.item.qty}`) : '';
      const name = sc.add.text(16, y + 3, `${nm}${row.required ? '' : ' (부가)'}`, { fontFamily: FONT, fontSize: '11px', color: have > 0 ? '#8affb0' : '#e8f4fd' });
      clampTextWidth(name, L_W - 120);
      const sub = sc.add.text(16, y + 16, `${qty}${have > 0 ? ` · 들어감 ${fmtUnits(def.unit, Math.round(have * 100) / 100)}` : ''}`, { fontFamily: FONT, fontSize: '9px', color: '#8fa8bf' });
      clampTextWidth(sub, L_W - 120);
      this.staticC.add([name, sub]);
      // 스테퍼(spoon/cup) + [넣기]
      let bx = L_W - 30;
      if (def.unit !== 'g') {
        const step = def.unit === 'spoon' ? 0.25 : def.unit === 'cup' ? 0.5 : 1;
        const minus = sc.add.text(L_W - 96, y + 8, '−', { fontFamily: FONT, fontSize: '13px', color: '#9fd5ff', fontStyle: 'bold' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        const val = sc.add.text(L_W - 74, y + 10, `${row.units}`, { fontFamily: FONT, fontSize: '11px', color: '#ffe08a', fontStyle: 'bold' }).setOrigin(0.5, 0);
        const plus = sc.add.text(L_W - 52, y + 8, '+', { fontFamily: FONT, fontSize: '13px', color: '#9fd5ff', fontStyle: 'bold' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        minus.on('pointerdown', () => { this.stepper.set(key, Math.max(step, Math.round((row.units - step) * 100) / 100)); this.renderAll(); });
        plus.on('pointerdown', () => { this.stepper.set(key, Math.min(row.req.max, Math.round((row.units + step) * 100) / 100)); this.renderAll(); });
        this.staticC.add([minus, val, plus]);
        bx = L_W - 30;
      }
      const btn = sc.add.rectangle(bx, y + 13, 30, 20, 0x1f5a3a, 1).setStrokeStyle(1, 0x4af2a1, 1).setInteractive({ useHandCursor: true });
      const bt = sc.add.text(bx, y + 13, '넣기', { fontFamily: FONT, fontSize: '10px', color: '#e8fff0', fontStyle: 'bold' }).setOrigin(0.5);
      btn.on('pointerdown', () => {
        const res = row.item ? CookingStore.addIngredientItem(this.stove, row.item, row.units) : CookingStore.addWaterFromTap(this.stove, row.units);
        this.say(res.message); if (res.ok) this.cbs.onChanged?.(); this.renderAll();
      });
      this.staticC.add([btn, bt]);
      y += ROW;
    }
    if (rows.length > maxRows) {
      const t = sc.add.text(L_W - 10, PANEL_H - 44, `${this.listScroll + 1}–${Math.min(rows.length, this.listScroll + maxRows)} / ${rows.length}행 · 휠`, { fontFamily: FONT, fontSize: '9px', color: '#8a97a8' }).setOrigin(1, 0);
      this.staticC.add(t);
    }
  }

  // ═══════════════════════════════════════════════
  // 조리 화면 — 우: 맛 미리보기 · 단계 · 연료
  // ═══════════════════════════════════════════════

  private renderRight(y0: number): void {
    const sc = this.scene; const r = this.recipe()!;
    const h = sc.add.text(R_X, y0, '지금 내리면', { fontFamily: FONT, fontSize: '12px', color: '#e8f4fd', fontStyle: 'bold' });
    this.staticC.add(h);
    // 5행 자리(동적) — renderDynamic이 채운다
    let y = y0 + 22 + 5 * 22 + 8;
    const sh = sc.add.text(R_X, y, '순서', { fontFamily: FONT, fontSize: '11px', color: '#9fd5ff', fontStyle: 'bold' });
    this.staticC.add(sh); y += 18;
    const st = this.stove.session!;
    for (let i = 0; i < r.stages.length; i++) {
      const cur = i === st.stageNow;
      const t = sc.add.text(R_X, y, `${i + 1}. ${r.stages[i].labelKo}`, { fontFamily: FONT, fontSize: '10px', color: cur ? '#ffe08a' : i < st.stageNow ? '#6a7a8a' : '#c8d8e8', wordWrap: { width: R_W }, lineSpacing: 1 });
      this.staticC.add(t); y += t.height + 4;
    }
  }

  // ═══════════════════════════════════════════════
  // 동적 영역 — 중앙 단면 · 온도 · 불 세기 · 진행 · 사건 · 우측 별
  // ═══════════════════════════════════════════════

  private renderDynamic(): void {
    if (!this.scene || !this.dynC.scene) return;
    this.dynC.removeAll(true);
    const s = this.stove.session;
    const r = this.recipe(); const cw = this.cookware(); const src = getHeatSource(this.stove.heatSourceId);
    if (!s || !r || !cw || !src) return;
    CookingStore.syncOne(this.stove, Date.now());
    const sc = this.scene;
    const top = this.contentTop + 34;
    const g = sc.add.graphics();
    this.dynC.add(g);
    const cx = C_X + C_W / 2;
    // ── 단면 ──
    const potY = top + 150;   // 용기 바닥선
    const potW = cw.kind === 'grate' ? 200 : 180, potH = cw.kind === 'pot' ? 96 : 26;
    // 불꽃
    const heatOn = s.heat > 0 && CookingStore.fuelOk(this.stove);
    if (heatOn) {
      const fh = 10 + s.heat * 10 + Math.sin(Date.now() / 90) * 3;
      g.fillStyle(0xff8a3a, 0.85); g.fillEllipse(cx, potY + 10, potW * 0.7, fh);
      g.fillStyle(0xffd257, 0.9); g.fillEllipse(cx, potY + 10, potW * 0.35, fh * 0.6);
    }
    // 삼발이 + 본체
    g.fillStyle(0x2a2e33, 1); g.fillRect(cx - potW / 2 - 10, potY + 14, potW + 20, 10);
    g.fillStyle(0x4a5058, 1); g.fillRect(cx - potW / 2 - 6, potY + 16, potW + 12, 6);
    // 용기
    g.fillStyle(0x2a2e33, 1);
    if (cw.kind === 'pot') g.fillRoundedRect(cx - potW / 2, potY - potH, potW, potH, 6);
    else if (cw.kind === 'pan') { g.fillRoundedRect(cx - potW / 2, potY - potH, potW, potH, 5); g.fillRect(cx + potW / 2, potY - potH + 8, 60, 6); }
    else { g.lineStyle(3, 0x6a7580, 1); for (let x = -potW / 2; x <= potW / 2; x += 14) g.lineBetween(cx + x, potY - potH, cx + x, potY - 2); g.lineBetween(cx - potW / 2, potY - potH, cx + potW / 2, potY - potH); g.lineBetween(cx - potW / 2, potY - 2, cx + potW / 2, potY - 2); }
    g.fillStyle(0xa8b2ba, cw.kind === 'grate' ? 0 : 1);
    if (cw.kind !== 'grate') g.fillRect(cx - potW / 2 + 4, potY - potH + 4, potW - 8, potH - 8);
    // 국물
    const capMl = cw.capacityMl ?? 1;
    if (cw.kind === 'pot' && s.waterMl > 0) {
      const lvl = Math.min(1, (s.waterMl + this.solidsApprox(s)) / capMl);
      const lh = (potH - 10) * (0.25 + 0.75 * lvl);
      const col = r.family === 'stew_red' || r.family === 'braise' ? 0xc23a1a : r.family === 'porridge' ? 0xf0e4bc : 0xe8d8a8;
      g.fillStyle(col, 0.95); g.fillRect(cx - potW / 2 + 6, potY - 6 - lh, potW - 12, lh);
      if (s.boiling) { for (let i = 0; i < 6; i++) { const bx = cx - potW / 2 + 16 + ((i * 29 + (Date.now() / 60) % 29) % (potW - 32)); g.fillStyle(0xffffff, 0.5); g.fillCircle(bx, potY - 8 - lh + 2, 2); } }
    }
    // 재료 실루엣 — 익음 색(연분홍 → 익은 색 → 탄 검정)
    const solids = s.contents.filter((c) => { const d = getCookIngredient(c.ing); return d && d.cookSec > 1; });
    solids.slice(0, 10).forEach((c, i) => {
      const d = getCookIngredient(c.ing)!;
      const dn = Math.min(1.2, c.doneness);
      const base = d.kind === 'main' ? [0xffb8a8, 0xd9a860] : d.kind === 'grain' ? [0xf8f4e8, 0xf0e4bc] : [0x7ac262, 0x4a8a3a];
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(base[0]), Phaser.Display.Color.ValueToColor(base[1]), 100, Math.round(Math.min(1, dn) * 100)) as { r: number; g: number; b: number };
      const colN = c.burnt > 0.5 ? 0x2a2e33 : Phaser.Display.Color.GetColor(col.r, col.g, col.b);
      const w = d.kind === 'main' || d.kind === 'grain' ? 26 : 12, hgt = d.kind === 'main' ? 12 : 8;
      const x = cx - potW / 2 + 14 + (i % 5) * ((potW - 28) / 5), yy = potY - 12 - Math.floor(i / 5) * 14 - (cw.kind === 'pot' ? 6 : 0);
      g.fillStyle(colN, 1); g.fillRoundedRect(x, yy - hgt, w, hgt, 3);
    });
    // 김/연기
    if (s.contents.length > 0 && (s.boiling || s.status === 'burnt')) {
      const burnt = s.status === 'burnt';
      for (let i = 0; i < 4; i++) {
        const t = ((Date.now() / 1400) + i * 0.25) % 1;
        g.fillStyle(burnt ? 0x2a2e33 : 0xe8eef2, (1 - t) * (burnt ? 0.85 : 0.45));
        g.fillCircle(cx - 40 + i * 26 + Math.sin(t * 6 + i) * 6, potY - potH - 8 - t * 40, 4 + t * 5);
      }
    }
    // ── 온도 바 + 적정대 ──
    const by = top + 190, bx = C_X + 40, bw = C_W - 80;
    const tMax = cw.kind === 'pot' ? 120 : 280;
    const [lo, hi] = r.tempBand;
    g.fillStyle(0x0b1c2b, 1); g.fillRect(bx, by, bw, 12);
    g.fillStyle(0x1f5a3a, 0.8); g.fillRect(bx + bw * (lo / tMax), by, bw * ((hi - lo) / tMax), 12);
    g.fillStyle(s.tempC > hi ? 0xff5a4a : s.tempC >= lo ? 0x4af2a1 : 0x9fd5ff, 1);
    g.fillRect(bx + bw * Math.min(1, s.tempC / tMax) - 2, by - 3, 4, 18);
    const tl = sc.add.text(bx - 6, by + 6, '온도', { fontFamily: FONT, fontSize: '10px', color: '#8fa8bf' }).setOrigin(1, 0.5);
    const tv = sc.add.text(bx + bw + 6, by + 6, `${Math.round(s.tempC)}°C`, { fontFamily: FONT, fontSize: '11px', color: '#ffe08a', fontStyle: 'bold' }).setOrigin(0, 0.5);
    const bandT = sc.add.text(bx + bw * ((lo + hi) / 2 / tMax), by + 14, `적정 ${lo}~${hi}°C`, { fontFamily: FONT, fontSize: '9px', color: '#4af2a1' }).setOrigin(0.5, 0);
    this.dynC.add([tl, tv, bandT]);
    // ── 불 세기 4버튼 ──
    const hy = by + 34;
    const labels: HeatLevel[] = [0, 1, 2, 3];
    labels.forEach((lv, i) => {
      const x = C_X + 40 + i * 82;
      const on = s.heat === lv;
      const rect = sc.add.rectangle(x, hy, 76, 24, on ? 0x5a2a1a : 0x1a2430, 1).setOrigin(0, 0).setStrokeStyle(1, on ? 0xff8a3a : 0x3a4a5a, 1).setInteractive({ useHandCursor: true });
      const t = sc.add.text(x + 38, hy + 12, HEAT_LABEL_KO[lv], { fontFamily: FONT, fontSize: '11px', color: on ? '#ffd257' : '#c8d8e8', fontStyle: 'bold' }).setOrigin(0.5);
      rect.on('pointerdown', () => { const res = CookingStore.setHeat(this.stove, lv); if (!res.ok) this.say(res.message); this.renderDynamic(); });
      this.dynC.add([rect, t]);
    });
    const wl = sc.add.text(C_X + 40, hy + 28, `화력 ${Math.round(effectiveHeatW(src, s.heat, CookingStore.isHome(this.stove) ? 0 : CookingStore.windProvider(this.stove.mapId)))}W${!CookingStore.isHome(this.stove) ? ` · 바람 ${CookingStore.windProvider(this.stove.mapId).toFixed(1)}m/s` : ''}${!CookingStore.fuelOk(this.stove) ? ' · 연료 없음' : ''}`, { fontFamily: FONT, fontSize: '9px', color: '#8fa8bf' });
    this.dynC.add(wl);
    // ── 진행 · 상태 · 사건 ──
    const py = hy + 48;
    const mains = s.contents.filter((c) => { const h = reqFor(r, c.ing); return h && (h.req.role === 'main' || h.req.role === 'grain'); });
    const prog = mains.length ? Math.min(1, mains.reduce((a, c) => a + Math.min(1, c.doneness), 0) / mains.length) : 0;
    g.fillStyle(0x0b1c2b, 1); g.fillRect(bx, py, bw, 8);
    g.fillStyle(s.status === 'burnt' ? 0xff5a4a : s.status === 'done' ? 0x4af2a1 : 0xffd257, 1); g.fillRect(bx, py, bw * prog, 8);
    const lb = CookingStore.statusLabel(this.stove);
    const st = sc.add.text(cx, py + 14, lb.text, { fontFamily: FONT, fontSize: '11px', color: lb.color, fontStyle: 'bold' }).setOrigin(0.5, 0);
    clampTextWidth(st, C_W - 20);
    const ev = sc.add.text(cx, py + 32, s.events.slice(-3).join('  ·  '), { fontFamily: FONT, fontSize: '9px', color: '#8fa8bf' }).setOrigin(0.5, 0);
    clampTextWidth(ev, C_W - 20);
    this.dynC.add([st, ev]);
    // ── 액션 버튼 ──
    const ay = PANEL_H - 74;
    const mk = (x: number, w: number, label: string, on: boolean, col: number, run: () => void): void => {
      const rect = sc.add.rectangle(x, ay, w, 26, on ? col : 0x2a3340, 1).setOrigin(0, 0).setStrokeStyle(1, on ? 0x9fd5ff : 0x3a4a5a, 1);
      const t = sc.add.text(x + w / 2, ay + 13, label, { fontFamily: FONT, fontSize: '11px', color: on ? '#e8f4fd' : '#6a7a8a', fontStyle: 'bold' }).setOrigin(0.5);
      clampTextWidth(t, w - 8);
      if (on) { rect.setInteractive({ useHandCursor: true }); rect.on('pointerdown', run); }
      this.dynC.add([rect, t]);
    };
    let ax = C_X + 10;
    if (r.flipEverySec !== undefined) {
      const since = s.elapsedSec - s.lastFlipSec;
      const due = since > r.flipEverySec * 0.7;
      mk(ax, 90, r.family === 'grill' ? '뒤집기' : '젓기', s.contents.length > 0, due ? 0x7a3a1a : 0x1f3a5a, () => { CookingStore.flip(this.stove); this.say(r.family === 'grill' ? '뒤집었다' : '저었다'); this.renderDynamic(); });
      ax += 96;
    }
    const why = CookingStore.takeOffBlockReason(this.stove);
    mk(ax, 150, s.status === 'burnt' ? '탄 것 내리기' : '불 끄고 내리기', !why, 0x1f5a3a, () => {
      const res = CookingStore.takeOff(this.stove);
      this.say(res.message);
      if (res.ok) { this.cbs.onChanged?.(); this.stepper.clear(); }
      this.renderAll();
    });
    ax += 156;
    mk(ax, 70, '버리기', s.contents.length > 0, 0x5a1a1a, () => { const res = CookingStore.discard(this.stove); this.say(res.message); this.renderAll(); });
    if (why && s.contents.length > 0) {
      const wt = sc.add.text(C_X + 10, ay - 16, why, { fontFamily: FONT, fontSize: '9px', color: '#ff9a9a' });
      clampTextWidth(wt, C_W - 20); this.dynC.add(wt);
    }
    // ── 우측 5행 별 미리보기 ──
    const rank = GameState.skillRanks['life_cook'] ?? 0;
    const ev5 = evaluateSession(s, r, cw, rank);
    const scores = [ev5.season, ev5.temp, ev5.texture, ev5.fresh, ev5.finish];
    const th = TUNING.cook.starThreshold;
    const gate = scores.slice(0, 4).every((v) => v >= th);
    let ry = this.contentTop + 34 + 22;
    const seasonNote = s.contents.length ? `${SALT_LABEL_KO[ev5.seasonEval.saltLabel]}${ev5.seasonEval.sugarLabel !== 'ok' ? ' · ' + SUGAR_LABEL_KO[ev5.seasonEval.sugarLabel] : ''}` : '';
    const notes = [seasonNote, s.tempC >= r.servingC ? '뜨겁다' : '식었다', ev5.texture >= th ? '알맞다' : mains.some((c) => c.doneness < 0.9) ? '덜 익음' : '과조리', ev5.fresh >= 0.9 ? '싱싱' : ev5.fresh >= 0.6 ? '보통' : '', gate ? '' : '(넷을 먼저)'];
    for (let i = 0; i < 5; i++) {
      const earned = i < 4 ? scores[i] >= th : gate && scores[4] >= th;
      const icon = addPixelIcon(sc, earned ? 'star_on' : 'star_off', R_X + 8, ry + 8, 14);
      if (icon) this.dynC.add(icon);
      const nm = sc.add.text(R_X + 20, ry + 1, STAR_NAME_KO[i], { fontFamily: FONT, fontSize: '10px', color: '#c8d8e8' });
      g.fillStyle(0x0b1c2b, 1); g.fillRect(R_X + 64, ry + 4, 70, 8);
      g.fillStyle(earned ? 0xffd257 : 0x4a5a6a, 1); g.fillRect(R_X + 64, ry + 4, 70 * Math.max(0, Math.min(1, scores[i])), 8);
      const note = sc.add.text(R_X + 140, ry + 1, notes[i], { fontFamily: FONT, fontSize: '9px', color: '#8fa8bf' });
      clampTextWidth(note, R_W - 140);
      this.dynC.add([nm, note]);
      ry += 22;
    }
    enforceTextBounds(this.dynC, PANEL_W - 10, 'CookingPanel');
    this.applyFix();
  }

  private solidsApprox(s: NonNullable<DeployedStove['session']>): number {
    return s.contents.reduce((a, c) => { const d = getCookIngredient(c.ing); return d && !d.waterMlPerUnit ? a + (c.weightG ?? d.massGPerUnit * c.units) : a; }, 0);
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.events.off('update', this.onUpdate);
    this.scene?.input.off('wheel', this.onWheel);
    super.destroy(fromScene);
  }
}
