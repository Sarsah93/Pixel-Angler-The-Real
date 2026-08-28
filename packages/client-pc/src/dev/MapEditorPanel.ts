/**
 * @file MapEditorPanel.ts
 * @description dev 전용 심리스 맵 편집기 팔레트 (F7) — DOM 오버레이 (DevTuningPanel 패턴).
 *
 * 패널은 **상태(모드·브러시·선택)와 버튼만** 갖고, 실제 페인팅/재베이킹/저장은
 * RegionFieldScene이 이 상태를 읽어 수행한다 (씬이 지형·청크의 주인).
 *  - 모드: tile(지형 문자 페인트) / prop(프롭 배치) / erase(프롭 제거) / roof(지붕 팔레트 순환)
 *  - 브러시 1·3·5 (tile 전용)
 *  - 저장 = vite dev 미들웨어 POST → pixelazed/<region>/patch.json + public/data/<region>/patch.json
 *  - 조작 안내: 좌클릭·드래그 페인트 · Ctrl+Z 되돌리기 · Ctrl+좌클릭 = 순간이동(편집기 밖에서도)
 * 프로덕션 빌드에서는 import.meta.env.DEV 가드로 데드코드 제거.
 */

export type MapEditMode = 'tile' | 'prop' | 'erase' | 'roof';

export interface MapEditorState {
  mode: MapEditMode;
  tileChar: string;
  propId: string;
  brush: 1 | 3 | 5;
}

export interface MapEditorHooks {
  onSave: () => Promise<string>;
  onUndo: () => void;
  onClose: () => void;
  /** 편집기 상태 표시줄 갱신용 — 씬이 호출 */
  status?: (msg: string) => void;
}

/** 타일 팔레트 — [문자, 라벨, 견본색] (build_osm_tilemap.py PALETTE와 동일) */
export const TILE_PALETTE: [string, string, string][] = [
  ['.', '맨땅', '#cbb98d'], [',', '잔디', '#6da34d'], ['~', '바다', '#3b6fb0'],
  ['r', '차도', '#4c4f54'], ['w', '보도', '#b8bcc4'], ['s', '모래', '#e8d9a0'],
  ['b', '방파제', '#7a8894'], ['#', '건물', '#4a4a52'],
];

let root: HTMLDivElement | null = null;
let statusEl: HTMLDivElement | null = null;

export const mapEditorState: MapEditorState = { mode: 'tile', tileChar: '.', propId: 'tree', brush: 1 };

export function isMapEditorOpen(): boolean {
  return root !== null;
}

export function closeMapEditor(): void {
  root?.remove();
  root = null;
  statusEl = null;
}

export function setMapEditorStatus(msg: string): void {
  if (statusEl) statusEl.textContent = msg;
}

export function openMapEditor(
  region: string,
  propDefs: { id: string; label: string; cat?: string }[],
  hooks: MapEditorHooks,
): void {
  if (!import.meta.env.DEV) return;
  if (root) return;
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', top: '12px', right: '12px', width: '270px', maxHeight: '90vh', overflowY: 'auto', zIndex: '99998',
    background: 'rgba(10,20,30,0.94)', border: '1px solid #2a5a8a', borderRadius: '8px',
    padding: '10px', font: '12px "Noto Sans KR",sans-serif', color: '#e8f4fd',
    boxShadow: '0 4px 18px rgba(0,0,0,0.5)', userSelect: 'none',
  });
  const title = document.createElement('div');
  title.textContent = `🗺 맵 편집기 (F7) — ${region}`;
  Object.assign(title.style, { fontWeight: '700', marginBottom: '6px', color: '#9ad0ff' });
  box.appendChild(title);

  const help = document.createElement('div');
  help.innerHTML = '좌클릭·드래그 = 적용 · <b>Ctrl+Z</b> 되돌리기<br>' +
    '<b>Ctrl+좌클릭</b> = 순간이동 (미니맵 포함 · 편집기 밖에서도)';
  Object.assign(help.style, { color: '#7fa8c4', fontSize: '10px', lineHeight: '1.5', marginBottom: '6px' });
  box.appendChild(help);

  const sec = (label: string): HTMLDivElement => {
    const h = document.createElement('div');
    h.textContent = label;
    Object.assign(h.style, { margin: '8px 0 3px', color: '#7fe0b0', fontWeight: '700' });
    box.appendChild(h);
    const body = document.createElement('div');
    Object.assign(body.style, { display: 'flex', flexWrap: 'wrap', gap: '4px' });
    box.appendChild(body);
    return body;
  };
  const btn = (label: string, on: () => void, active: () => boolean): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = label;
    Object.assign(b.style, {
      padding: '3px 7px', border: '1px solid #2a5a8a', borderRadius: '4px', cursor: 'pointer',
      font: '11px "Noto Sans KR",sans-serif', color: '#e8f4fd', background: '#123048',
    });
    const refresh = (): void => { b.style.background = active() ? '#1f6f5a' : '#123048'; b.style.borderColor = active() ? '#4af2a1' : '#2a5a8a'; };
    b.onclick = () => { on(); rerender(); };
    refreshers.push(refresh);
    return b;
  };
  const refreshers: (() => void)[] = [];
  const rerender = (): void => { for (const f of refreshers) f(); };

  // 모드
  const modes = sec('모드');
  for (const [m, label] of [['tile', '지형'], ['prop', '프롭 배치'], ['erase', '프롭 제거'], ['roof', '지붕 색']] as const) {
    modes.appendChild(btn(label, () => { mapEditorState.mode = m; }, () => mapEditorState.mode === m));
  }
  // 지형 팔레트
  const tiles = sec('지형 타일');
  for (const [ch, label, color] of TILE_PALETTE) {
    const b = btn(label, () => { mapEditorState.mode = 'tile'; mapEditorState.tileChar = ch; },
      () => mapEditorState.mode === 'tile' && mapEditorState.tileChar === ch);
    const sw = document.createElement('span');
    Object.assign(sw.style, { display: 'inline-block', width: '10px', height: '10px', background: color, marginRight: '4px', verticalAlign: '-1px', border: '1px solid #000' });
    b.prepend(sw);
    tiles.appendChild(b);
  }
  // 브러시
  const brush = sec('브러시 (지형)');
  for (const n of [1, 3, 5] as const) {
    brush.appendChild(btn(`${n}×${n}`, () => { mapEditorState.brush = n; }, () => mapEditorState.brush === n));
  }
  // 프롭 — 카테고리별 그룹 (자연/시설물/건물/차량/NPC/해안)
  const cats = [...new Set(propDefs.map((d) => d.cat ?? '프롭'))];
  for (const cat of cats) {
    const body = sec(`프롭 · ${cat}`);
    for (const d of propDefs.filter((p) => (p.cat ?? '프롭') === cat)) {
      body.appendChild(btn(d.label, () => { mapEditorState.mode = 'prop'; mapEditorState.propId = d.id; },
        () => mapEditorState.mode === 'prop' && mapEditorState.propId === d.id));
    }
  }
  // 액션
  const actions = sec('');
  const save = document.createElement('button');
  save.textContent = '💾 저장 (patch.json)';
  Object.assign(save.style, { padding: '5px 10px', border: '1px solid #4af2a1', borderRadius: '4px', cursor: 'pointer', font: '12px "Noto Sans KR",sans-serif', color: '#0a1628', background: '#4af2a1', fontWeight: '700' });
  save.onclick = async () => {
    save.disabled = true;
    try { setMapEditorStatus(await hooks.onSave()); }
    catch (e) { setMapEditorStatus(`저장 실패: ${String(e)}`); }
    save.disabled = false;
  };
  actions.appendChild(save);
  const undo = document.createElement('button');
  undo.textContent = '↶ 되돌리기';
  Object.assign(undo.style, { padding: '5px 8px', border: '1px solid #2a5a8a', borderRadius: '4px', cursor: 'pointer', font: '12px "Noto Sans KR",sans-serif', color: '#e8f4fd', background: '#123048' });
  undo.onclick = () => hooks.onUndo();
  actions.appendChild(undo);
  const close = document.createElement('button');
  close.textContent = '✕';
  Object.assign(close.style, { padding: '5px 8px', border: '1px solid #2a5a8a', borderRadius: '4px', cursor: 'pointer', font: '12px "Noto Sans KR",sans-serif', color: '#e8f4fd', background: '#123048' });
  close.onclick = () => hooks.onClose();
  actions.appendChild(close);

  statusEl = document.createElement('div');
  Object.assign(statusEl.style, { marginTop: '8px', color: '#9fd0e4', fontSize: '10px', minHeight: '14px', whiteSpace: 'pre-wrap' });
  statusEl.textContent = '대기 — 지형/프롭을 고르고 맵을 클릭하세요';
  box.appendChild(statusEl);

  rerender();
  document.body.appendChild(box);
  root = box;
}
