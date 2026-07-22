/**
 * @file DevTuningPanel.ts
 * @description 개발 전용 튜닝 슬라이더 오버레이 (client-pc). F8 토글.
 *
 * import.meta.env.DEV 에서만 마운트. TUNING_META를 feel/balance 섹션으로 나눠
 * 슬라이더로 렌더하고, 입력 시 TUNING을 실시간 수정(리빌드 없이 화면 반영 —
 * 씬들은 TUNING을 매 프레임 읽으므로 별도 리스너 없이 즉시 반영된다).
 * '스냅샷 복사'로 확정값을 클립보드에 덤프 → tuning.ts에 고정하는 흐름.
 *
 * DOM 오버레이 방식(Phaser 캔버스 위) — 개발 편의. 프로덕션 빌드에서는
 * initDevTuningPanel()이 즉시 반환하고 vite가 데드코드로 제거한다.
 */

import { TUNING_META, getTuning, setTuning } from '@tra/core';

let mounted = false;
let root: HTMLDivElement | null = null;

/** 엔트리(game.ts)에서 1회 호출 — F8 토글 리스너 등록 (DEV 전용) */
export function initDevTuningPanel(): void {
  if (!import.meta.env.DEV) return;      // 프로덕션 차단
  if (mounted) return;
  mounted = true;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'F8') { e.preventDefault(); toggle(); }
  });
}

function toggle(): void {
  if (root) { root.remove(); root = null; return; }
  root = buildPanel();
  document.body.appendChild(root);
}

function buildPanel(): HTMLDivElement {
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', top: '12px', right: '12px', width: '288px',
    maxHeight: '86vh', overflowY: 'auto', zIndex: '99999',
    background: 'rgba(10,20,30,0.94)', border: '1px solid #2a5a8a',
    borderRadius: '8px', padding: '10px', font: '12px "Noto Sans KR",sans-serif',
    color: '#e8f4fd', boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
  });

  const title = document.createElement('div');
  title.textContent = '🛠 Dev Tuning (F8)';
  Object.assign(title.style, { fontWeight: '700', marginBottom: '8px', color: '#9ad0ff' });
  box.appendChild(title);

  let curCat = '';
  for (const m of TUNING_META) {
    if (m.category !== curCat) {
      curCat = m.category;
      const h = document.createElement('div');
      h.textContent = curCat === 'feel' ? '· feel (눈)' : '· balance (시뮬)';
      Object.assign(h.style, { margin: '10px 0 4px', color: '#7fe0b0', fontWeight: '700' });
      box.appendChild(h);
    }
    box.appendChild(buildRow(m));
  }

  // 스냅샷 복사 — 확정값을 tuning.ts에 고정하기 위한 덤프
  const btn = document.createElement('button');
  btn.textContent = '📋 스냅샷 복사';
  Object.assign(btn.style, {
    marginTop: '10px', width: '100%', padding: '6px', cursor: 'pointer',
    background: '#1c3d5a', color: '#e8f4fd', border: '1px solid #2a5a8a', borderRadius: '5px',
  });
  btn.onclick = () => {
    const snap = TUNING_META.map((m) => `${m.path} = ${getTuning(m.path)}`).join('\n');
    void navigator.clipboard?.writeText(snap);
    btn.textContent = '✓ 복사됨';
    setTimeout(() => (btn.textContent = '📋 스냅샷 복사'), 1200);
  };
  box.appendChild(btn);
  return box;
}

function buildRow(m: { path: string; min: number; max: number; step: number; label: string }): HTMLDivElement {
  const row = document.createElement('div');
  Object.assign(row.style, { margin: '6px 0' });

  const head = document.createElement('div');
  Object.assign(head.style, { display: 'flex', justifyContent: 'space-between' });
  const lbl = document.createElement('span');
  lbl.textContent = m.label;
  const val = document.createElement('span');
  val.textContent = String(getTuning(m.path));
  Object.assign(val.style, { color: '#ffce54' });
  head.append(lbl, val);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(m.min);
  slider.max = String(m.max);
  slider.step = String(m.step);
  slider.value = String(getTuning(m.path));
  Object.assign(slider.style, { width: '100%' });
  slider.oninput = () => {
    const v = parseFloat(slider.value);
    setTuning(m.path, v);
    val.textContent = String(v);
    // 씬 즉시 반영 훅 (프레임 단위 소비라 필수는 아님 — 원샷 캐시 씬 대비)
    window.dispatchEvent(new CustomEvent('tuning-changed', { detail: m.path }));
  };

  row.append(head, slider);
  return row;
}
