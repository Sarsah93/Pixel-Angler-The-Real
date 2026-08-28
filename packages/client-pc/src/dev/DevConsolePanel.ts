/**
 * @file DevConsolePanel.ts
 * @description 개발 전용 크리에이티브 콘솔 오버레이 (F10 토글)
 *
 * 마인크래프트 크리에이티브 모드 컨셉 — localhost dev 서버 전용:
 *  - 무적(갓모드): 신선도 동결 · 채비/미끼 손실 없음 · 줄터짐 없음 (DevMode.god)
 *  - 재화 조작 / 스태미나·피로 회복
 *  - 아이템 지급·제거 (시드+상점 전 카탈로그 검색)
 *  - 어종 어획물 지급 (FISH_DATABASE 전 어종 — 활어·평균 밴드 랜덤)
 *  - 도감/위키 전체 해금·초기화 (DiscoveryStore)
 *
 * DevTuningPanel(F8)과 동일한 DOM 오버레이 패턴 —
 * 프로덕션 빌드에서는 initDevConsolePanel()이 즉시 반환하고 vite가 데드코드 제거.
 */

import { FISH_DATABASE, SHORE_CREATURE_DATABASE } from '@tra/core';
import { GameState } from '../store/GameState.js';
import { InventoryStore } from '../store/InventoryStore.js';
import { DiscoveryStore } from '../store/DiscoveryStore.js';
import { DevMode } from './DevMode.js';
import { buildItemWikiCatalog } from '../data/WikiCatalog.js';

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
  buildPlayerSection(box);
  buildItemSection(box);
  buildFishSection(box);
  buildDiscoverySection(box);

  return box;
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
