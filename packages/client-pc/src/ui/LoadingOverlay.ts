/**
 * @file LoadingOverlay.ts
 * @description 로딩 가림막 (219차 — 사용자 지시)
 *
 * 「배포 주소로 들어갈 때 파일 이름이 하나씩 지나가는 게 이상하다 · 지역 진입 때 검은 화면이 오래 간다 —
 *  'Loading...' 같은 걸로 보여 주고, 다 불러오면 보여 주자. 파일 하나하나 대신 맵 로딩 중 · 구성요소 로딩 중으로」.
 *
 * - **HTML 한 장**(`index.html`의 `#loading-overlay`)을 캔버스 위에 덮는다. 씬이 바뀌어도 그대로 남고,
 *   무거운 `create()`가 메인 스레드를 막는 동안에도 이미 그려진 가림막은 화면에 남는다(캔버스는 검게 굳는다).
 * - 문구는 **단계 이름**만 — 파일 이름 · 키를 내보내지 않는다(R1 · 사용자 지시).
 * - 보이기 → 화면에 실제로 그려진 뒤(rAF 두 번) 다음 일을 시작한다 — 같은 틱에 무거운 일을 시작하면 가림막이 그려지기 전에 멈춘다.
 * - 감추기 → 다음 씬이 첫 화면을 그린 뒤(`postrender` 두 번) 서서히.
 */
import type Phaser from 'phaser';
import { t } from '../i18n/I18n.js';

const ID = 'loading-overlay';
/** 안전망 — 무엇이 잘못돼도 가림막이 화면을 영원히 덮지 않는다 */
const MAX_SHOW_MS = 45000;

let safety: number | undefined;
let stageNow = '';

function el(): HTMLElement {
  let root = document.getElementById(ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ID;
    root.innerHTML = '<div class="lo-title">Loading...</div><div class="lo-stage"></div>'
      + '<div class="lo-bar"><div class="lo-fill"></div></div>';
    document.body.appendChild(root);
  }
  return root;
}

function part(cls: string): HTMLElement | null {
  return el().querySelector(`.${cls}`);
}

/** 단계 이름(한국어 원문 — 현재 언어로 바꿔 쓴다) */
export function setLoadingStage(stage: string): void {
  if (stage === stageNow) return;
  stageNow = stage;
  const s = part('lo-stage');
  if (s) s.textContent = t(stage);
}

/** 진행 막대 0..1 — 모르면 부르지 않는다(막대는 숨긴 채로) */
export function setLoadingProgress(v: number): void {
  const bar = part('lo-bar');
  const fill = part('lo-fill');
  if (!bar || !fill) return;
  bar.style.visibility = 'visible';
  fill.style.width = `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`;
}

export function isLoadingShown(): boolean {
  const root = document.getElementById(ID);
  return !!root && !root.classList.contains('lo-hidden');
}

export function showLoading(stage: string): void {
  const root = el();
  root.classList.remove('lo-hidden', 'lo-fading');
  const bar = part('lo-bar');
  if (bar) bar.style.visibility = 'hidden';
  const fill = part('lo-fill');
  if (fill) fill.style.width = '0%';
  stageNow = '';
  setLoadingStage(stage);
  window.clearTimeout(safety);
  safety = window.setTimeout(() => hideLoadingNow(), MAX_SHOW_MS);
}

export function hideLoadingNow(): void {
  const root = document.getElementById(ID);
  if (!root) return;
  window.clearTimeout(safety);
  root.classList.add('lo-fading');
  window.setTimeout(() => {
    if (root.classList.contains('lo-fading')) root.classList.add('lo-hidden');
  }, 260);
}

/** 가림막을 보이고, 실제로 그려진 다음 `action`을 시작한다(씬 전환 · 무거운 생성 앞에) */
export function showLoadingThen(stage: string, action: () => void): void {
  showLoading(stage);
  requestAnimationFrame(() => requestAnimationFrame(() => action()));
}

/** 다음 씬이 첫 화면을 그린 뒤 감춘다 */
export function hideLoadingAfterRender(game: Phaser.Game, frames = 2): void {
  if (!isLoadingShown()) return;
  let left = frames;
  const tick = (): void => {
    left -= 1;
    if (left > 0) { game.events.once('postrender', tick); return; }
    hideLoadingNow();
  };
  game.events.once('postrender', tick);
}

/**
 * 로더 파일 → 단계 이름. 파일 이름을 보여 주지 않고 무엇을 불러오는지만 말한다.
 * `kind`가 지역 진입이면 데이터 파일은 「맵」, 첫 접속이면 「지도」다.
 */
export function stageForFile(file: { key?: string; url?: unknown; type?: string }, entering = false): string {
  const url = typeof file.url === 'string' ? file.url : '';
  const key = `${file.key ?? ''} ${url}`;
  if (file.type === 'json' || /\.json\b/.test(url)) return entering ? '맵 데이터 불러오는 중' : '지도 불러오는 중';
  if (/pixelazed|korea_pixel_map|zoom_|tileset|tiles?\//i.test(key)) return entering ? '맵 그림 불러오는 중' : '지도 불러오는 중';
  if (/characters|npc|portrait/i.test(key)) return '인물 불러오는 중';
  if (/fish|food|butcher|sashimi|creature/i.test(key)) return '물고기 그림 불러오는 중';
  if (/guide|help/i.test(key)) return '안내 그림 불러오는 중';
  if (file.type === 'audio' || /\.(mp3|ogg|wav)\b/.test(url)) return '소리 불러오는 중';
  return '구성요소 불러오는 중';
}
