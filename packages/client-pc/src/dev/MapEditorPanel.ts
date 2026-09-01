/**
 * @file MapEditorPanel.ts
 * @description dev 전용 심리스 맵 편집기 팔레트 (F7) — DOM 오버레이 (DevTuningPanel 패턴).
 *
 * 패널은 **상태(모드·브러시·선택)와 버튼만** 갖고, 실제 페인팅/재베이킹/저장은
 * RegionFieldScene이 이 상태를 읽어 수행한다 (씬이 지형·청크의 주인).
 *  - 탭(101차 후속 4 — 사용자 지시 "타일을 직접 보고 골라서"): **지형 타일 / 오브젝트 / 도구**.
 *    지형 탭 = Kenney 지면 타일 썸네일, 오브젝트 탭 = 카테고리별 스프라이트 썸네일(아이템창처럼)
 *  - 모드: tile(지형 문자 페인트) / prop(프롭 배치) / erase(프롭 제거) / roof(지붕 팔레트 순환)
 *  - 브러시 1·3·5 (tile 전용) · 배치 미리보기 격자(녹/황/적)는 씬이 그린다
 *  - 저장 = vite dev 미들웨어 POST → pixelazed/<region>/patch.json + public/data/<region>/patch.json
 *  - 조작 안내: 좌클릭·드래그 페인트 · Ctrl+Z 되돌리기 · Ctrl+좌클릭 = 순간이동(편집기 밖에서도)
 * 프로덕션 빌드에서는 import.meta.env.DEV 가드로 데드코드 제거.
 */

export type MapEditMode = 'tile' | 'prop' | 'erase' | 'roof' | 'road' | 'roadNew';

export interface MapEditorState {
  mode: MapEditMode;
  tileChar: string;
  propId: string;
  brush: 1 | 3 | 5;
  /** 새 도로 그리기 프리셋 — roads.json 실측 분포(서비스 2 · 주택가 3 · 일반 4 · 대로 6)와 정합 */
  roadCls: string;
  roadW: number;
  roadLanes: number;
}

/** 새 도로 프리셋 — [라벨, cls, w, lanes] */
export const ROAD_PRESETS: [string, string, number, number][] = [
  ['골목 2', 'service', 2, 1],
  ['주택가 3', 'residential', 3, 1],
  ['일반 4', 'tertiary', 4, 2],
  ['대로 6', 'primary', 6, 3],
];

export interface MapEditorHooks {
  onSave: () => Promise<string>;
  onUndo: () => void;
  onClose: () => void;
  /** 편집기 상태 표시줄 갱신용 — 씬이 호출 */
  status?: (msg: string) => void;
}

export interface MapEditorPropEntry {
  id: string;
  label: string;
  cat?: string;
  /** 썸네일 경로 (public 상대) — 없으면 라벨만 */
  thumb?: string | null;
  scale?: number;
}

/** 타일 팔레트 — [문자, 라벨, 견본색, 썸네일] (build_osm_tilemap.py PALETTE와 동일) */
export const TILE_PALETTE: [string, string, string, string | null][] = [
  ['.', '맨땅(포장)', '#cbb98d', 'tileset/kn/ground_tan_0.png'],
  [',', '잔디', '#6da34d', 'tileset/kn/ground_grass_0.png'],
  ['~', '바다', '#3b6fb0', null],
  ['r', '차도', '#4c4f54', 'tileset/kn/ground_asphalt_0.png'],
  ['w', '보도', '#b8bcc4', 'tileset/kn/ground_pave_0.png'],
  ['s', '모래', '#e8d9a0', 'tileset/kn/ground_sand_0.png'],
  ['b', '방파제', '#7a8894', 'tileset/kn/ground_pier_0.png'],
  ['#', '건물', '#4a4a52', 'tileset/kn/roof_gray_in.png'],
];

let root: HTMLDivElement | null = null;
let statusEl: HTMLDivElement | null = null;

export const mapEditorState: MapEditorState = {
  mode: 'tile', tileChar: '.', propId: 'tree', brush: 1,
  roadCls: 'residential', roadW: 3, roadLanes: 1,
};

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

const BTN_CSS = {
  padding: '3px 7px', border: '1px solid #2a5a8a', borderRadius: '4px', cursor: 'pointer',
  font: '11px "Noto Sans KR",sans-serif', color: '#e8f4fd', background: '#123048',
};

export function openMapEditor(region: string, propDefs: MapEditorPropEntry[], hooks: MapEditorHooks): void {
  if (!import.meta.env.DEV) return;
  if (root) return;
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', top: '12px', right: '12px', width: '316px', maxHeight: '92vh', overflowY: 'auto', zIndex: '99998',
    background: 'rgba(10,20,30,0.95)', border: '1px solid #2a5a8a', borderRadius: '8px',
    padding: '10px', font: '12px "Noto Sans KR",sans-serif', color: '#e8f4fd',
    boxShadow: '0 4px 18px rgba(0,0,0,0.5)', userSelect: 'none',
  });
  const title = document.createElement('div');
  title.textContent = `🗺 맵 편집기 (F7) — ${region}`;
  Object.assign(title.style, { fontWeight: '700', marginBottom: '4px', color: '#9ad0ff' });
  box.appendChild(title);
  const help = document.createElement('div');
  help.innerHTML = '좌클릭·드래그 = 적용 · <b>Ctrl+Z</b> 되돌리기 · <b>Ctrl+좌클릭</b> = 순간이동<br>' +
    '배치 격자: <span style="color:#4af2a1">■ 가능</span> <span style="color:#f2d24a">■ 애매(차도/보도)</span> <span style="color:#f25a4a">■ 불가(겹침·바다·건물)</span>';
  Object.assign(help.style, { color: '#7fa8c4', fontSize: '10px', lineHeight: '1.5', marginBottom: '6px' });
  box.appendChild(help);

  const refreshers: (() => void)[] = [];
  const rerender = (): void => { for (const f of refreshers) f(); };

  // ── 탭 ──
  type Tab = 'tiles' | 'objects' | 'tools';
  let tab: Tab = mapEditorState.mode === 'prop' ? 'objects' : 'tiles';
  const tabBar = document.createElement('div');
  Object.assign(tabBar.style, { display: 'flex', gap: '4px', marginBottom: '6px' });
  box.appendChild(tabBar);
  const pages: Record<Tab, HTMLDivElement> = { tiles: document.createElement('div'), objects: document.createElement('div'), tools: document.createElement('div') };
  const showTab = (t: Tab): void => { tab = t; for (const k of Object.keys(pages) as Tab[]) pages[k].style.display = k === t ? 'block' : 'none'; rerender(); };
  for (const [t, label] of [['tiles', '지형 타일'], ['objects', '오브젝트'], ['tools', '도구']] as const) {
    const b = document.createElement('button');
    b.textContent = label;
    Object.assign(b.style, { ...BTN_CSS, flex: '1', padding: '5px 0', fontWeight: '700' });
    b.onclick = () => showTab(t);
    refreshers.push(() => { b.style.background = tab === t ? '#1f6f5a' : '#123048'; b.style.borderColor = tab === t ? '#4af2a1' : '#2a5a8a'; });
    tabBar.appendChild(b);
  }
  for (const t of Object.keys(pages) as Tab[]) box.appendChild(pages[t]);

  const sec = (parent: HTMLElement, label: string, grid = false): HTMLDivElement => {
    if (label) {
      const h = document.createElement('div');
      h.textContent = label;
      Object.assign(h.style, { margin: '8px 0 3px', color: '#7fe0b0', fontWeight: '700' });
      parent.appendChild(h);
    }
    const body = document.createElement('div');
    Object.assign(body.style, grid
      ? { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }
      : { display: 'flex', flexWrap: 'wrap', gap: '4px' });
    parent.appendChild(body);
    return body;
  };
  const btn = (label: string, on: () => void, active: () => boolean): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = label;
    Object.assign(b.style, BTN_CSS);
    refreshers.push(() => { b.style.background = active() ? '#1f6f5a' : '#123048'; b.style.borderColor = active() ? '#4af2a1' : '#2a5a8a'; });
    b.onclick = () => { on(); rerender(); };
    return b;
  };
  /** 아이템창식 아이콘 셀 — 썸네일(픽셀 보존) + 라벨 */
  const iconCell = (label: string, thumb: string | null, color: string | null, on: () => void, active: () => boolean): HTMLDivElement => {
    const cell = document.createElement('div');
    Object.assign(cell.style, {
      border: '1px solid #2a5a8a', borderRadius: '4px', cursor: 'pointer', background: '#0e2438',
      padding: '3px 2px', textAlign: 'center', fontSize: '9px', lineHeight: '1.2', color: '#cfe4f2', overflow: 'hidden',
    });
    const pic = document.createElement('div');
    Object.assign(pic.style, { width: '44px', height: '44px', margin: '0 auto 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a2c3c', borderRadius: '3px' });
    if (thumb) {
      const img = document.createElement('img');
      img.src = thumb;
      Object.assign(img.style, { maxWidth: '44px', maxHeight: '44px', imageRendering: 'pixelated' });
      pic.appendChild(img);
    } else if (color) {
      Object.assign(pic.style, { background: color });
    } else {
      pic.textContent = '∙';
    }
    cell.appendChild(pic);
    const lb = document.createElement('div');
    lb.textContent = label;
    Object.assign(lb.style, { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
    cell.appendChild(lb);
    cell.title = label;
    cell.onclick = () => { on(); rerender(); };
    refreshers.push(() => { cell.style.borderColor = active() ? '#4af2a1' : '#2a5a8a'; cell.style.background = active() ? '#1f6f5a' : '#0e2438'; });
    return cell;
  };

  // ── 지형 타일 탭 ──
  const tiles = sec(pages.tiles, '지형 타일 (클릭·드래그 페인트)', true);
  for (const [ch, label, color, thumb] of TILE_PALETTE) {
    tiles.appendChild(iconCell(label, thumb, color, () => { mapEditorState.mode = 'tile'; mapEditorState.tileChar = ch; },
      () => mapEditorState.mode === 'tile' && mapEditorState.tileChar === ch));
  }
  const brush = sec(pages.tiles, '브러시');
  for (const n of [1, 3, 5] as const) {
    brush.appendChild(btn(`${n}×${n}`, () => { mapEditorState.brush = n; }, () => mapEditorState.brush === n));
  }
  const roofSec = sec(pages.tiles, '건물 지붕');
  roofSec.appendChild(btn('지붕 색 순환 (건물 클릭)', () => { mapEditorState.mode = 'roof'; }, () => mapEditorState.mode === 'roof'));

  // ── 오브젝트 탭 — 카테고리별 아이콘 그리드 ──
  const cats = [...new Set(propDefs.map((d) => d.cat ?? '프롭'))];
  for (const cat of cats) {
    const body = sec(pages.objects, cat, true);
    for (const d of propDefs.filter((p) => (p.cat ?? '프롭') === cat)) {
      body.appendChild(iconCell(d.label, d.thumb ?? null, null, () => { mapEditorState.mode = 'prop'; mapEditorState.propId = d.id; },
        () => mapEditorState.mode === 'prop' && mapEditorState.propId === d.id));
    }
  }
  const eraseSec = sec(pages.objects, '');
  eraseSec.appendChild(btn('🗑 오브젝트 제거 (3×3)', () => { mapEditorState.mode = 'erase'; }, () => mapEditorState.mode === 'erase'));

  // ── 도구 탭 ──
  const roadSec = sec(pages.tools, '도로 벡터 (roads.json 오버라이드)');
  roadSec.appendChild(btn('🛣 도로 정점 편집', () => { mapEditorState.mode = 'road'; }, () => mapEditorState.mode === 'road'));
  roadSec.appendChild(btn('➕ 새 도로 그리기', () => { mapEditorState.mode = 'roadNew'; }, () => mapEditorState.mode === 'roadNew'));
  // 새 도로 폭 프리셋 — 다음에 그릴 도로에 적용
  const presetRow = document.createElement('div');
  Object.assign(presetRow.style, { display: 'flex', gap: '3px', margin: '4px 0' });
  for (const [label, cls, w, lanes] of ROAD_PRESETS) {
    const b = document.createElement('button');
    b.textContent = label;
    Object.assign(b.style, { ...BTN_CSS, flex: '1', padding: '3px 0', fontSize: '10px' });
    b.onclick = () => { mapEditorState.roadCls = cls; mapEditorState.roadW = w; mapEditorState.roadLanes = lanes; rerender(); };
    refreshers.push(() => {
      const on = mapEditorState.roadW === w && mapEditorState.roadCls === cls;
      b.style.background = on ? '#1f6f5a' : '#123048';
      b.style.borderColor = on ? '#4af2a1' : '#2a5a8a';
    });
    presetRow.appendChild(b);
  }
  roadSec.appendChild(presetRow);
  const roadHelp = document.createElement('div');
  roadHelp.innerHTML = '<b>정점 편집</b>: 정점(○) 드래그 = 이동 · 선 클릭 = 정점 삽입 후 드래그 · <b>우클릭</b> = 정점 삭제.<br>' +
    '<b>새 도로</b>: 클릭 = 정점 추가(기존 정점·선 근처는 자동 접속) · <b>우클릭</b> = 마지막 정점 취소 · ' +
    '<b>Enter</b>/같은 자리 재클릭 = 확정.<br>' +
    '놓는 순간 청크 재베이킹 + 차량 재배치. 그림은 벡터, 걷기 판정은 타일 — 도로를 옮기거나 새로 그리면 지형 탭에서 <code>r</code>/<code>w</code>도 칠하세요.';
  Object.assign(roadHelp.style, { color: '#7fa8c4', fontSize: '10px', lineHeight: '1.5', margin: '4px 0 6px' });
  pages.tools.appendChild(roadHelp);
  const actions = sec(pages.tools, '저장 · 되돌리기');
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
  Object.assign(undo.style, { ...BTN_CSS, padding: '5px 8px', font: '12px "Noto Sans KR",sans-serif' });
  undo.onclick = () => hooks.onUndo();
  actions.appendChild(undo);
  const close = document.createElement('button');
  close.textContent = '✕ 닫기';
  Object.assign(close.style, { ...BTN_CSS, padding: '5px 8px', font: '12px "Noto Sans KR",sans-serif' });
  close.onclick = () => hooks.onClose();
  actions.appendChild(close);
  const note = document.createElement('div');
  note.innerHTML = '오브젝트는 풋프린트(타일 수)만큼 자리를 차지하고 <b>겹쳐 놓을 수 없다</b>.<br>' +
    '건물 타일(#)은 자동으로 지붕+벽 키트가 채워진다 — 지붕 색은 지형 탭에서 순환.';
  Object.assign(note.style, { color: '#7fa8c4', fontSize: '10px', lineHeight: '1.5', marginTop: '8px' });
  pages.tools.appendChild(note);

  // 공통 하단 — 빠른 액션 + 상태
  const quick = sec(box, '');
  const qs = document.createElement('button');
  qs.textContent = '💾';
  Object.assign(qs.style, { ...BTN_CSS, borderColor: '#4af2a1' });
  qs.title = '저장';
  qs.onclick = () => save.click();
  quick.appendChild(qs);
  const qu = btn('↶', () => hooks.onUndo(), () => false);
  qu.title = '되돌리기';
  quick.appendChild(qu);
  quick.appendChild(btn('✕', () => hooks.onClose(), () => false));

  statusEl = document.createElement('div');
  Object.assign(statusEl.style, { marginTop: '6px', color: '#9fd0e4', fontSize: '10px', minHeight: '14px', whiteSpace: 'pre-wrap' });
  statusEl.textContent = '대기 — 타일/오브젝트를 고르고 맵을 클릭하세요';
  box.appendChild(statusEl);

  showTab(tab);
  document.body.appendChild(box);
  root = box;
}
