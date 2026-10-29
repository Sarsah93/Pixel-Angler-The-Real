/**
 * @file DevConsolePanel.ts
 * @description 개발 전용 크리에이티브 콘솔 오버레이 (F10 토글)
 *
 * 마인크래프트 크리에이티브 모드 컨셉 — localhost dev 서버 전용:
 *  - 무적(갓모드): 신선도 동결 · 채비/미끼 손실 없음 · 줄터짐 없음 (DevMode.god)
 *  - 재화 조작 / 스태미나·피로 회복
 *  - 아이템 지급·제거 (시드+상점 전 카탈로그 검색)
 *  - 어종 어획물 지급 (FISH_DATABASE 전 어종 — 활어·평균 밴드 랜덤)
 *  - 287차 — 갯것(해루질) 지급(실제로 캔 것과 같은 개체 · 채집 1회로 셈 — 이야기 채집 목표가 오른다) · 작물 · 텃밭 물건 지급
 *  - 도감/위키 전체 해금·초기화 (DiscoveryStore)
 *  - 276차 — 모든 지역 열기(세계 지도 장 순서 잠금 건너뛰기 · 세이브 무관)
 *
 * DevTuningPanel(F8)과 동일한 DOM 오버레이 패턴 —
 * 프로덕션 빌드에서는 initDevConsolePanel()이 즉시 반환하고 vite가 데드코드 제거.
 */

import type Phaser from 'phaser';
import { FISH_DATABASE, SHORE_CREATURE_DATABASE, STORY_QUESTS } from '@tra/core';
import { getLicenseByType, type LicenseType } from '@tra/core';
import { GameState } from '../store/GameState.js';
import { InventoryStore } from '../store/InventoryStore.js';
import { DiscoveryStore } from '../store/DiscoveryStore.js';
import { DevMode, setAllRegionsOpen } from './DevMode.js';
import { buildItemWikiCatalog } from '../data/WikiCatalog.js';
import { StoryStore } from '../store/StoryStore.js';
import { devGrantForage } from '../scenes/field/ForageSystem.js';
import { CROP_ITEM_TEMPLATES, EARTHWORM_TEMPLATE } from '../data/CropItems.js';
import { MILL_ITEM_TEMPLATES } from '../data/MillItems.js';
import { CURE_ITEM_TEMPLATES } from '../data/CureItems.js';
import { cropOfProduce } from '@tra/core';
import type { InvItemTemplate } from '../store/InventoryStore.js';

let mounted = false;
let root: HTMLDivElement | null = null;

/** 엔트리(game.ts)에서 1회 호출 — F10 토글 리스너 등록 (DEV 전용) */
export function initDevConsolePanel(): void {
  if (!import.meta.env.DEV) return;      // 프로덕션 차단
  if (mounted) return;
  mounted = true;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'F10') { e.preventDefault(); toggle(); }
  });
}

function toggle(): void {
  if (root) { root.remove(); root = null; return; }
  root = buildPanel();
  document.body.appendChild(root);
}

// ── UI 헬퍼 ─────────────────────────────────────

function styleBtn(b: HTMLButtonElement, primary = false): void {
  Object.assign(b.style, {
    padding: '3px 8px', cursor: 'pointer', fontSize: '11px',
    background: primary ? '#1c5a3d' : '#1c3d5a', color: '#e8f4fd',
    border: '1px solid #2a5a8a', borderRadius: '4px', marginRight: '4px',
  });
}

function section(box: HTMLElement, label: string): HTMLDivElement {
  const h = document.createElement('div');
  h.textContent = label;
  Object.assign(h.style, { margin: '12px 0 6px', color: '#7fe0b0', fontWeight: '700' });
  box.appendChild(h);
  const body = document.createElement('div');
  box.appendChild(body);
  return body;
}

function flash(el: HTMLElement, msg: string): void {
  const prev = el.textContent;
  el.textContent = msg;
  setTimeout(() => { el.textContent = prev; }, 900);
}

// ── 패널 본체 ────────────────────────────────────

function buildPanel(): HTMLDivElement {
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', top: '12px', left: '12px', width: '330px',
    maxHeight: '90vh', overflowY: 'auto', zIndex: '99999',
    background: 'rgba(10,20,30,0.96)', border: '1px solid #3d8a5a',
    borderRadius: '8px', padding: '10px', font: '12px "Noto Sans KR",sans-serif',
    color: '#e8f4fd', boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
  });

  const title = document.createElement('div');
  title.textContent = '⚡ Dev Console (F10) — 크리에이티브';
  Object.assign(title.style, { fontWeight: '700', marginBottom: '4px', color: '#7fe0b0' });
  box.appendChild(title);

  const note = document.createElement('div');
  note.textContent = 'localhost dev 전용 — 프로덕션 빌드에는 존재하지 않음';
  Object.assign(note.style, { fontSize: '10px', color: '#5a8fab', marginBottom: '6px' });
  box.appendChild(note);

  buildGodSection(box);
  buildRegionSection(box);
  buildScriptPilotSection(box);
  buildPlayerSection(box);
  buildItemSection(box);
  buildFishSection(box);
  buildForageSection(box);
  buildFarmSection(box);
  buildDiscoverySection(box);
  buildLicenseSection(box);
  buildStoryActionSection(box);

  return box;
}

/** ⑥ 면허 즉시 발급 (121차 — 해루질·통발 검증용) */
function buildLicenseSection(box: HTMLElement): void {
  const body = section(box, '⑥ 면허 (해루질·통발)');
  const types: LicenseType[] = ['shore_hunting_basic', 'shore_hunting_advanced', 'trap_basic', 'trap_advanced', 'commercial_trap'];
  for (const t of types) {
    const b = document.createElement('button');
    const refresh = (): void => { b.textContent = `${getLicenseByType(t)?.nameKo ?? t}${GameState.hasLicense(t) ? ' ✓' : ''}`; };
    refresh();
    Object.assign(b.style, { display: 'block', width: '100%', marginBottom: '3px', textAlign: 'left' });
    b.onclick = () => { GameState.acquireLicense(t); GameState.markDirty(); refresh(); flash(b, '발급'); };
    body.appendChild(b);
  }
}

/** ① 무적(갓모드) 토글 */
function buildGodSection(box: HTMLElement): void {
  const body = section(box, '① 무적 (갓모드)');
  const label = document.createElement('label');
  Object.assign(label.style, { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' });
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = DevMode.god;
  cb.onchange = () => { DevMode.god = cb.checked; };
  const txt = document.createElement('span');
  txt.textContent = '신선도 동결 · 채비/미끼 손실 없음 · 줄터짐 없음';
  label.appendChild(cb);
  label.appendChild(txt);
  body.appendChild(label);
}

/**
 * ①-2 모든 지역 열기 (276차) — 세계 지도의 장 순서 잠금을 건너뛴다.
 * 이야기 진행 · 세이브는 그대로다(브라우저 저장소에만 기억). 지도가 없는 지역은 계속 잠긴다.
 * 세계 지도가 열려 있으면 그 자리에서 다시 그린다.
 */
function buildRegionSection(box: HTMLElement): void {
  const body = section(box, '①-2 모든 지역 열기');
  const label = document.createElement('label');
  Object.assign(label.style, { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' });
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = 'dev-all-regions';
  cb.checked = DevMode.allRegions;
  cb.onchange = () => {
    setAllRegionsOpen(cb.checked);
    const game = (globalThis as { __PIXEL_ANGLER_GAME?: Phaser.Game }).__PIXEL_ANGLER_GAME;
    if (game?.scene.isActive('WorldMapScene')) game.scene.getScene('WorldMapScene').scene.restart();
  };
  const txt = document.createElement('span');
  txt.textContent = '세계 지도 장 잠금 건너뛰기 (이야기 · 세이브는 그대로)';
  label.appendChild(cb);
  label.appendChild(txt);
  body.appendChild(label);
}

/**
 * ①-3 대본 시범 (286차) — N01-5 「해녀의 딸」을 받는 자리부터 다시 보고, 서귀포항(바람 · 해솔 · 부순덕이 선 곳)으로 바로 간다.
 * 그 편의 진행 · 대화 길 · 건네받기만 지운다(다른 세이브는 그대로). 장 · 레벨 · 앞 편 조건은 건너뛴다.
 */
function buildScriptPilotSection(box: HTMLElement): void {
  const body = section(box, '①-3 대본 시범 — 해녀의 딸');
  const go = document.createElement('button');
  go.textContent = '받는 자리부터 다시 · 서귀포로';
  styleBtn(go, true);
  go.onclick = () => {
    StoryStore.devOfferQuest('N01-5');
    const game = (globalThis as { __PIXEL_ANGLER_GAME?: Phaser.Game }).__PIXEL_ANGLER_GAME;
    const field = game?.scene.getScene('RegionFieldScene');
    if (game && field) {
      for (const k of ['WorldMapScene', 'HomeInteriorScene']) if (game.scene.isActive(k)) game.scene.stop(k);
      field.scene.start('RegionFieldScene', { region: 'jeju', mapId: 'jeju_seogwipo_1' });
    }
    flash(go, '바람에게 말을 걸면 시작');
  };
  body.appendChild(go);
}

/** ② 재화·상태 */
function buildPlayerSection(box: HTMLElement): void {
  const body = section(box, '② 재화 · 상태');

  const coinRow = document.createElement('div');
  Object.assign(coinRow.style, { marginBottom: '4px' });
  const coinLabel = document.createElement('span');
  const refreshCoin = (): void => {
    coinLabel.textContent = `보유 ${GameState.player.inventory.coins.toLocaleString()}원  `;
  };
  refreshCoin();
  coinRow.appendChild(coinLabel);
  for (const [label, delta] of [['+10만', 100_000], ['+100만', 1_000_000], ['0으로', 0]] as const) {
    const b = document.createElement('button');
    b.textContent = label;
    styleBtn(b);
    b.onclick = () => {
      if (delta === 0) GameState.player.inventory.coins = 0;
      else GameState.player.inventory.coins += delta;
      GameState.markDirty();
      refreshCoin();
    };
    coinRow.appendChild(b);
  }
  body.appendChild(coinRow);

  const statRow = document.createElement('div');
  const heal = document.createElement('button');
  heal.textContent = '❤️ 스태미나·피로 회복';
  styleBtn(heal, true);
  heal.onclick = () => {
    GameState.player.stamina = 100;
    GameState.player.fatigue = 0;
    GameState.markDirty();
    flash(heal, '✓ 회복됨');
  };
  statRow.appendChild(heal);
  body.appendChild(statRow);
}

/** ③ 아이템 지급/제거 — 카탈로그 검색 목록 */
function buildItemSection(box: HTMLElement): void {
  const body = section(box, '③ 아이템 지급 · 제거');

  const search = document.createElement('input');
  search.placeholder = '이름/소분류 검색…';
  Object.assign(search.style, {
    width: '100%', boxSizing: 'border-box', marginBottom: '5px', padding: '4px 6px',
    background: '#0e1c2d', color: '#e8f4fd', border: '1px solid #2a5a8a', borderRadius: '4px',
    font: '11px "Noto Sans KR",sans-serif',
  });
  body.appendChild(search);

  const list = document.createElement('div');
  Object.assign(list.style, {
    maxHeight: '190px', overflowY: 'auto', border: '1px solid #1f3d5a',
    borderRadius: '4px', padding: '3px',
  });
  body.appendChild(list);

  const renderList = (): void => {
    list.textContent = '';
    const q = search.value.trim().toLowerCase();
    const entries = buildItemWikiCatalog()
      .filter((e) => !q || e.name.toLowerCase().includes(q) || e.subCategory.toLowerCase().includes(q))
      .slice(0, 60);   // 상위 60개만 (검색으로 좁혀 쓰는 UI)
    for (const e of entries) {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 2px',
        borderBottom: '1px solid #16283a',
      });
      const held = InventoryStore.find(e.id)?.qty ?? 0;
      const name = document.createElement('span');
      name.textContent = `${e.icon} ${e.name}`;
      Object.assign(name.style, { flex: '1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' });
      name.title = `${e.subCategory} · ${e.basePrice.toLocaleString()}원`;
      const qty = document.createElement('span');
      qty.textContent = held > 0 ? `×${held}` : '';
      Object.assign(qty.style, { color: '#7fe0b0', minWidth: '28px', textAlign: 'right', fontSize: '10px' });
      row.appendChild(name);
      row.appendChild(qty);
      // '+최대' = 크리에이티브 모드식 즉시 만재 (99개 — 스택 상한과 무관하게 addItem이 소켓을 늘린다)
      for (const [label, n] of [['+1', 1], ['+10', 10], ['+최대', 99], ['−1', -1]] as const) {
        const b = document.createElement('button');
        b.textContent = label;
        styleBtn(b);
        b.style.marginRight = '0';
        b.style.padding = '1px 5px';
        b.onclick = () => {
          if (n > 0) InventoryStore.addItem(e.tpl, n);
          else InventoryStore.removeQty(e.id, 1);
          GameState.markDirty();
          renderList();
        };
        row.appendChild(b);
      }
      list.appendChild(row);
    }
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '검색 결과 없음';
      Object.assign(empty.style, { color: '#5a8fab', padding: '4px' });
      list.appendChild(empty);
    }
  };
  search.oninput = renderList;
  renderList();
}

/** ④ 어종 어획물 지급 */
function buildFishSection(box: HTMLElement): void {
  const body = section(box, '④ 어종 어획물 지급 (활어·랜덤 사이즈)');

  const search = document.createElement('input');
  search.placeholder = '어종명 검색…';
  Object.assign(search.style, {
    width: '100%', boxSizing: 'border-box', marginBottom: '5px', padding: '4px 6px',
    background: '#0e1c2d', color: '#e8f4fd', border: '1px solid #2a5a8a', borderRadius: '4px',
    font: '11px "Noto Sans KR",sans-serif',
  });
  body.appendChild(search);

  const list = document.createElement('div');
  Object.assign(list.style, {
    maxHeight: '150px', overflowY: 'auto', border: '1px solid #1f3d5a',
    borderRadius: '4px', padding: '3px',
  });
  body.appendChild(list);

  const renderList = (): void => {
    list.textContent = '';
    const q = search.value.trim();
    const fishes = FISH_DATABASE
      .filter((f) => !q || f.nameKo.includes(q))
      .slice(0, 40);
    for (const f of fishes) {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 2px',
        borderBottom: '1px solid #16283a',
      });
      const name = document.createElement('span');
      name.textContent = `🐟 ${f.nameKo}`;
      Object.assign(name.style, { flex: '1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' });
      name.title = `${f.avgSizeRangeCm[0]}~${f.avgSizeRangeCm[1]}cm`;
      row.appendChild(name);
      const b = document.createElement('button');
      b.textContent = '지급';
      styleBtn(b, true);
      b.style.marginRight = '0';
      b.style.padding = '1px 6px';
      b.onclick = () => {
        const ok = InventoryStore.devGrantFish(f.id);
        GameState.markDirty();
        flash(b, ok ? '✓' : '실패');
      };
      row.appendChild(b);
      list.appendChild(row);
    }
  };
  search.oninput = renderList;
  renderList();
}

/** 검색 입력 한 칸(아이템 · 어종 칸과 같은 모양) */
function searchInput(body: HTMLElement, placeholder: string): HTMLInputElement {
  const search = document.createElement('input');
  search.placeholder = placeholder;
  Object.assign(search.style, {
    width: '100%', boxSizing: 'border-box', marginBottom: '5px', padding: '4px 6px',
    background: '#0e1c2d', color: '#e8f4fd', border: '1px solid #2a5a8a', borderRadius: '4px',
    font: '11px "Noto Sans KR",sans-serif',
  });
  body.appendChild(search);
  return search;
}

function listBox(body: HTMLElement, maxH: number): HTMLDivElement {
  const list = document.createElement('div');
  Object.assign(list.style, { maxHeight: `${maxH}px`, overflowY: 'auto', border: '1px solid #1f3d5a', borderRadius: '4px', padding: '3px' });
  body.appendChild(list);
  return list;
}

function listRow(list: HTMLElement, label: string, title: string): HTMLDivElement {
  const row = document.createElement('div');
  Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 2px', borderBottom: '1px solid #16283a' });
  const name = document.createElement('span');
  name.textContent = label;
  name.title = title;
  Object.assign(name.style, { flex: '1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' });
  row.appendChild(name);
  list.appendChild(row);
  return row;
}

function smallBtn(row: HTMLElement, label: string, onClick: (b: HTMLButtonElement) => void, primary = false): void {
  const b = document.createElement('button');
  b.textContent = label;
  styleBtn(b, primary);
  b.style.marginRight = '0';
  b.style.padding = '1px 5px';
  b.onclick = () => onClick(b);
  row.appendChild(b);
}

/**
 * ④-2 갯것(해루질) 지급 — 287차. 실제로 캔 것과 같은 개체(크기 · 무게)가 가방에 들어온다(미끼 갯것은 미끼로).
 * 「채집으로 셈」이 켜져 있으면 채집 1회로 쳐서 이야기 채집 목표(「제주 물가에서 갯것 셋」 등)가 오른다 — 지역 조건은 지금 있는 지역.
 */
function buildForageSection(box: HTMLElement): void {
  const body = section(box, '④-2 갯것(해루질) 지급 (개체 · 랜덤 크기)');
  const opt = document.createElement('label');
  Object.assign(opt.style, { display: 'block', fontSize: '10px', color: '#8faabf', marginBottom: '4px' });
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.checked = true;
  opt.appendChild(chk);
  opt.appendChild(document.createTextNode(' 채집으로 셈(레벨 · 이야기 채집 목표 — 지금 지역)'));
  body.appendChild(opt);
  const where = document.createElement('div');
  Object.assign(where.style, { fontSize: '10px', color: '#5a8fab', marginBottom: '4px' });
  body.appendChild(where);
  const search = searchInput(body, '갯것 이름 검색…');
  const list = listBox(body, 150);
  const renderList = (): void => {
    where.textContent = `지금 지역: ${GameState.currentRegionId}`;
    list.textContent = '';
    const q = search.value.trim();
    const items = SHORE_CREATURE_DATABASE.filter((c) => !q || c.nameKo.includes(q) || c.category.includes(q));
    for (const c of items) {
      const row = listRow(list, `${c.nameKo}${c.baitItemId ? ' (미끼)' : ''}`, `${c.category} · ${c.id}`);
      for (const n of [1, 3]) {
        smallBtn(row, n === 1 ? '지급' : '×3', (b) => {
          let got = 0;
          for (let i = 0; i < n; i++) if (devGrantForage(c, chk.checked)) got++;
          GameState.markDirty();
          flash(b, got === n ? '✓' : got > 0 ? `${got}` : '가득');
        }, n === 1);
      }
    }
  };
  search.oninput = renderList;
  renderList();
}

/**
 * ④-3 작물 · 텃밭 물건 지급 — 287차. 씨앗 · 모종 · 받은 씨앗 · 농산물(3등급) · 조각 · 먹는 부산물 · 밭 부산물 · 농사 도구 ·
 * 방앗간 기름 · 갈무리 · 땅지렁이. 일반 아이템 칸(③)은 상위 60개만 보여 텃밭 물건을 찾기 어려웠다.
 * 「거두기로 셈」이 켜져 있으면 농산물을 줄 때 그 작물을 한 번 거둔 것으로 친다(이야기 「거둔다」 목표).
 */
function buildFarmSection(box: HTMLElement): void {
  const body = section(box, '④-3 작물 · 텃밭 물건 지급');
  const all: InvItemTemplate[] = [...CROP_ITEM_TEMPLATES, ...MILL_ITEM_TEMPLATES, ...CURE_ITEM_TEMPLATES, EARTHWORM_TEMPLATE];
  const subs = ['전체', ...new Set(all.map((t) => t.subCategory))];
  const bar = document.createElement('div');
  Object.assign(bar.style, { display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '4px' });
  body.appendChild(bar);
  let sub = '전체';
  const opt = document.createElement('label');
  Object.assign(opt.style, { display: 'block', fontSize: '10px', color: '#8faabf', marginBottom: '4px' });
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.checked = false;
  opt.appendChild(chk);
  opt.appendChild(document.createTextNode(' 농산물은 거두기로 셈(이야기 「거둔다」 목표)'));
  body.appendChild(opt);
  const search = searchInput(body, '작물 · 물건 이름 검색…(예: 상추 · 참깨 · 시래기)');
  const count = document.createElement('div');
  Object.assign(count.style, { fontSize: '10px', color: '#5a8fab', marginBottom: '3px' });
  body.appendChild(count);
  const list = listBox(body, 210);
  const renderList = (): void => {
    list.textContent = '';
    const q = search.value.trim();
    const hit = all.filter((t) => (sub === '전체' || t.subCategory === sub) && (!q || t.name.includes(q) || t.id.includes(q)));
    const shown = hit.slice(0, 120);
    count.textContent = `${hit.length}개${hit.length > shown.length ? ` 중 ${shown.length}개 — 검색으로 좁히세요` : ''}`;
    for (const t of shown) {
      const held = InventoryStore.find(t.id)?.qty ?? 0;
      const row = listRow(list, `${t.name}${held > 0 ? `  ×${held}` : ''}`, `${t.subCategory} · ${t.id} · ${t.basePrice.toLocaleString()}원`);
      for (const [label, n] of [['+1', 1], ['+10', 10], ['+최대', 99], ['−1', -1]] as const) {
        smallBtn(row, label, () => {
          if (n > 0) {
            if (InventoryStore.addItem({ ...t, conditionSinceMs: Date.now() }, n)) {
              DiscoveryStore.record('item', t.id, 'dev');
              const crop = chk.checked ? cropOfProduce(t.id) : undefined;
              if (crop) StoryStore.event({ kind: 'farm', action: 'harvest', cropId: crop.id });
            }
          } else InventoryStore.removeQty(t.id, 1);
          GameState.markDirty();
          renderList();
        });
      }
    }
  };
  for (const name of subs) {
    const b = document.createElement('button');
    b.textContent = name;
    styleBtn(b, name === sub);
    b.style.padding = '1px 5px';
    b.onclick = () => {
      sub = name;
      for (const x of Array.from(bar.children) as HTMLButtonElement[]) styleBtn(x, x.textContent === sub);
      renderList();
    };
    bar.appendChild(b);
  }
  search.oninput = renderList;
  renderList();
}

/** ⑤ 도감/위키 발견 조작 */
function buildDiscoverySection(box: HTMLElement): void {
  const body = section(box, '⑤ 도감 · 위키 발견');

  const status = document.createElement('div');
  Object.assign(status.style, { fontSize: '10px', color: '#8faabf', marginBottom: '4px' });
  const refreshStatus = (): void => {
    // 아이템은 카탈로그 교집합으로 센다 — 개체형(어획물 등) 발견 id가 섞여 총수를 넘기지 않게
    const catalog = buildItemWikiCatalog();
    const itemFound = catalog.filter((e) => DiscoveryStore.isDiscovered('item', e.id)).length;
    status.textContent =
      `어종 ${DiscoveryStore.countByKind('fish')}/${FISH_DATABASE.length} · ` +
      `생물 ${DiscoveryStore.countByKind('creature')}/${SHORE_CREATURE_DATABASE.length} · ` +
      `아이템 ${itemFound}/${catalog.length}`;
  };
  refreshStatus();
  body.appendChild(status);

  const unlockAll = document.createElement('button');
  unlockAll.textContent = '🔓 전체 해금';
  styleBtn(unlockAll, true);
  unlockAll.onclick = () => {
    DiscoveryStore.devUnlockAll('fish', FISH_DATABASE.map((f) => f.id));
    DiscoveryStore.devUnlockAll('creature', SHORE_CREATURE_DATABASE.map((c) => c.id));
    DiscoveryStore.devUnlockAll('item', buildItemWikiCatalog().map((e) => e.id));
    GameState.markDirty();
    refreshStatus();
    flash(unlockAll, '✓ 해금됨');
  };
  body.appendChild(unlockAll);

  const reset = document.createElement('button');
  reset.textContent = '🗑 발견 초기화';
  styleBtn(reset);
  reset.onclick = () => {
    DiscoveryStore.devResetAll();
    GameState.markDirty();
    refreshStatus();
    flash(reset, '✓ 초기화됨');
  };
  body.appendChild(reset);
}

/** ⑦ actionKey 시나리오 검증 — DEV 전용. 선행 퀘스트를 건너뛰되 실제 필드 이벤트는 그대로 탄다. */
function buildStoryActionSection(box: HTMLElement): void {
  const body = section(box, '⑦ 스토리 actionKey 테스트');
  const note = document.createElement('div');
  note.textContent = '활성화 후 콘솔을 닫고 필드에서 실제 장소·제작·검사·선택을 수행하세요.';
  Object.assign(note.style, { fontSize: '10px', color: '#8faabf', marginBottom: '5px' });
  body.appendChild(note);
  const quests = STORY_QUESTS.filter((q) => q.objectives.some((o) => !!o.actionKey));
  for (const q of quests) {
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' });
    const objIdx = q.objectives.findIndex((o) => !!o.actionKey);
    const status = document.createElement('span');
    Object.assign(status.style, { flex: '1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' });
    const refresh = (): void => { status.textContent = `${q.id} ${q.titleKo} · ${StoryStore.actionStep(q.id, objIdx)}/3`; };
    refresh();
    row.appendChild(status);
    const activate = document.createElement('button'); activate.textContent = '활성'; styleBtn(activate, true); activate.style.padding = '1px 5px';
    activate.onclick = () => { StoryStore.devActivateAction(q.id); refresh(); flash(activate, '✓'); };
    const reset = document.createElement('button'); reset.textContent = '0'; styleBtn(reset); reset.style.padding = '1px 5px';
    reset.onclick = () => { StoryStore.devSetActionStep(q.id, 0); refresh(); };
    const next = document.createElement('button'); next.textContent = '+1'; styleBtn(next); next.style.padding = '1px 5px';
    next.onclick = () => { StoryStore.devSetActionStep(q.id, StoryStore.actionStep(q.id, objIdx) + 1); refresh(); };
    row.append(activate, reset, next); body.appendChild(row);
  }
}
