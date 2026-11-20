/**
 * @file LeaveGuard.ts
 * @description 332차 — **진행 중인 판을 브라우저 쪽에서 벗어나게 하는 길을 막는다.**
 *
 * 사용자 리포트(2026-11-20): 「F5(새로고침) 누르니까, 메인화면으로 로딩되면서 돌아가고 있음. 아무리 특정 환경이라도 이러한 취약점으로 인해
 *  게임 상태에 영향을 주지 않도록 해야 할 것 같음. 다른 취약점들이 있는 지 찾아보고 보수할 것.
 *  (다른 방법 등으로 진행 중인 화면이나 상태에 대한 이탈을 유도할 수 있는 경로가 있는 지)」
 *
 * 저장은 집 침대에서만 한다(`GameState.save` — HOMETOWN_HOME_SPEC). 그래서 페이지가 한 번 다시 실리면 그날 진행이 통째로 사라지고 타이틀로 돌아간다.
 * 게임 안의 나가는 길(일시정지 메뉴 「타이틀 화면」 · 월드맵 ESC)은 「한 번 더」 확인을 거치지만, 브라우저 쪽 길은 아무것도 막지 않고 있었다.
 *
 * 막는 길(판이 진행 중일 때 — `inSession`):
 *  1. **새로고침 키** — F5 · Ctrl/⌘+R(Shift 포함). 키를 삼키고 까닭을 잠깐 띄운다.
 *  2. **뒤로 · 앞으로** — Alt+← · Alt+→ · ⌘+[ · ⌘+] · Alt+Home · 브라우저 뒤로 키 · 글 칸 밖의 Backspace · 마우스 옆 단추(4 · 5번).
 *     단추 · 터치패드 쓸기로 들어온 「뒤로」는 **히스토리 덫**이 받는다(가짜 항목 하나를 밀어 두고, 빠지면 다시 민다 — 페이지는 그대로다).
 *  3. **브라우저 창을 띄워 화면을 가로채는 키** — F1(도움말) · F3 · Ctrl+F · Ctrl+G(찾기) · F6(주소 칸) · F7(커서 브라우징 묻기) · F10(메뉴 줄) ·
 *     Ctrl+S(페이지 저장) · Ctrl+P(인쇄) · Ctrl+O(파일 열기 — 그 파일로 넘어간다) · Ctrl+U(소스 보기) · Ctrl+D · Ctrl+E · Ctrl+K · Alt 한 번(메뉴 줄 포커스) · Tab(포커스가 캔버스를 떠난다).
 *     기본 동작만 끈다(`preventDefault`) — 게임의 같은 키(F1 도움말 · F7 · F8 · F10 dev)는 그대로 듣는다.
 *  4. **끌어다 놓기** — 파일 · 링크를 창에 떨어뜨리면 브라우저가 그것을 연다(게임이 사라진다). 언제나 막는다.
 *  5. **오른쪽 클릭 메뉴** — 「뒤로」 · 「새로 고침」 · 「이미지 저장」이 달린 브라우저 메뉴. 필드 · 1인칭 씬만 끄고 있었다 → 글 칸 밖은 언제나 끈다.
 *  6. **확대 · 당겨서 새로고침** — Ctrl+휠(터치패드 오므리기) 확대 · 사파리 제스처는 끄고, 당겨서 새로고침 · 가장자리 쓸기는 `index.html`의 `overscroll-behavior`로 끈다.
 *  7. **막을 수 없는 길**(브라우저의 새로고침 단추 · 탭 닫기 · 주소 입력 · Ctrl+W · Alt+F4) — 저장하지 않은 진행이 있으면 브라우저의 「나가시겠습니까」 확인을 띄운다(`beforeunload`).
 *
 * 타이틀 화면(진행이 없다)에서는 새로고침 · 뒤로 가기를 막지 않는다 — 잃을 것이 없고, 개발 중에는 거기서 다시 싣는다.
 * dev 서버에서는 Ctrl+Shift+R(강제 새로고침)을 열어 둔다(코드를 고친 뒤 일부러 다시 싣는 길).
 * 글을 치는 DOM 입력(`ui/TextInput`) 안에서는 Backspace · Tab · 복사/붙여넣기를 건드리지 않는다.
 *
 * ⚠ 이 모듈은 「못 나가게」 하는 것이 아니라 「실수로 나가지 않게」 하는 것이다 — 나가는 길은 ESC 메뉴(타이틀 화면)와 브라우저의 확인 창이다.
 * ⚠ 다시 실린 뒤 그 자리에서 이어 하기(중단 저장)는 여기서 하지 않는다 — 「저장은 침대에서만」 규칙을 바꾸는 일이라 사용자 결정이 먼저다.
 */
import type Phaser from 'phaser';
import { GameState } from './store/GameState.js';
import { t } from './i18n/I18n.js';

/** 진행 중인 판의 씬 — 이 가운데 하나라도 떠 있으면(멈춰 있어도) 판이 진행 중이다 */
const SESSION_SCENES = ['CharacterCreateScene', 'WorldMapScene', 'RegionFieldScene', 'HomeInteriorScene', 'FirstPersonFishingScene'] as const;

/** 무엇을 막았는가(안내 글 · 하네스 확인용) */
export type LeaveBlock = 'reload' | 'history' | 'browser-ui' | 'drop' | 'zoom';

interface LeaveGuardState {
  installed: boolean;
  game: Phaser.Game | null;
  /** 히스토리 덫(가짜 항목)이 걸려 있는가 */
  armed: boolean;
  /** 막은 횟수(종류마다) — dev 하네스가 읽는다 */
  blocked: Record<LeaveBlock, number>;
}
const HOLDER_KEY = '__TRA_LEAVE_GUARD__';
type Holder = typeof globalThis & { [HOLDER_KEY]?: LeaveGuardState };

function stateOf(): LeaveGuardState {
  const h = globalThis as Holder;
  return (h[HOLDER_KEY] ??= { installed: false, game: null, armed: false, blocked: { reload: 0, history: 0, 'browser-ui': 0, drop: 0, zoom: 0 } });
}

/** 판이 진행 중인가 — 타이틀 · 부팅 · 타이틀에서 연 설정/기록/크레딧은 아니다 */
export function inSession(game: Phaser.Game | null = stateOf().game): boolean {
  const sm = game?.scene;
  if (!sm) return false;
  return SESSION_SCENES.some((k) => sm.isActive(k) || sm.isPaused(k) || sm.isSleeping(k));
}

/**
 * 창을 닫거나 다시 실을 때 브라우저의 확인을 띄울 것인가 — 판이 진행 중이고 저장하지 않은 진행이 있을 때.
 * 자동화(하네스)는 확인 창에 걸려 멈추므로 뺀다(`force`로 판정만 볼 수 있다).
 */
export function shouldConfirmLeave(force = false): boolean {
  if (!force && typeof navigator !== 'undefined' && navigator.webdriver) return false;
  return inSession() && GameState.isDirty;
}

/** 글을 치는 자리인가(DOM 입력 · 편집 영역) */
function isTyping(ev: Event): boolean {
  const el = ev.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

/** 키 하나가 어떤 길인가 — 막을 것이 아니면 null */
export function classifyLeaveKey(ev: { key: string; code: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }, typing: boolean, dev: boolean): LeaveBlock | null {
  const mod = ev.ctrlKey || ev.metaKey;
  const code = ev.code;
  // 1) 새로고침
  if (code === 'F5' || ev.key === 'F5') return 'reload';
  if (mod && code === 'KeyR') return dev && ev.shiftKey ? null : 'reload';
  // 2) 뒤로 · 앞으로
  if (ev.altKey && (code === 'ArrowLeft' || code === 'ArrowRight' || code === 'Home')) return 'history';
  if (ev.metaKey && (code === 'BracketLeft' || code === 'BracketRight')) return 'history';
  if (ev.key === 'BrowserBack' || ev.key === 'BrowserForward' || ev.key === 'BrowserHome' || ev.key === 'BrowserRefresh') return ev.key === 'BrowserRefresh' ? 'reload' : 'history';
  if (code === 'Backspace' && !typing) return 'history';
  // 3) 브라우저 창 · 포커스
  if (code === 'F1' || code === 'F3' || code === 'F6' || code === 'F7' || code === 'F10') return 'browser-ui';
  if (mod && !ev.altKey && (code === 'KeyF' || code === 'KeyG' || code === 'KeyS' || code === 'KeyP' || code === 'KeyO' || code === 'KeyU' || code === 'KeyD' || code === 'KeyE' || code === 'KeyK')) return 'browser-ui';
  // Alt 한 번 = 메뉴 줄 포커스. 한/영 키(오른쪽 Alt 자리 — key가 'HangulMode')와 AltGr(글자 조합)은 건드리지 않는다
  if (ev.key === 'Alt' && !mod && !typing) return 'browser-ui';
  if (code === 'Tab' && !typing && !ev.altKey) return 'browser-ui';
  return null;
}

// ── 안내 글 — 검은 글자 + 흰 테(R14 · 상자 없음). 어느 씬이 떠 있든 보이도록 DOM에 띄운다 ──
let toastEl: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(game: Phaser.Game | null, msgKo: string): void {
  if (typeof document === 'undefined') return;
  const rect = game?.canvas?.getBoundingClientRect();
  const px = Math.max(13, Math.round((rect?.height ?? 720) * (20 / 720)));
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.setAttribute('data-leave-guard', '1');
    document.body.appendChild(toastEl);
  }
  const o = Math.max(1, Math.round(px / 9));
  const sh: string[] = [];
  for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) sh.push(`${dx * o}px ${dy * o}px 0 #fff`);
  toastEl.style.cssText = `position:fixed;left:${Math.round((rect?.left ?? 0) + (rect?.width ?? window.innerWidth) / 2)}px;`
    + `top:${Math.round((rect?.top ?? 0) + (rect?.height ?? window.innerHeight) * 0.14)}px;transform:translateX(-50%);z-index:9000;`
    + `pointer-events:none;white-space:nowrap;font:700 ${px}px "Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;`
    + `color:#101418;text-shadow:${sh.join(',')};opacity:1;transition:opacity .35s ease;`;
  toastEl.textContent = t(msgKo);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (toastEl) toastEl.style.opacity = '0'; }, 2600);
}

const MSG_RELOAD = '진행 중에는 새로고침이 막혀 있습니다 — 나갈 때는 ESC 메뉴를 쓰세요';
const MSG_HISTORY = '진행 중에는 뒤로 가기가 막혀 있습니다 — 나갈 때는 ESC 메뉴를 쓰세요';

/**
 * 설치 — 게임을 만든 직후 한 번(HMR로 게임을 다시 만들어도 리스너는 한 번만 걸고 게임 참조만 바꾼다).
 */
export function installLeaveGuard(game: Phaser.Game): void {
  const st = stateOf();
  st.game = game;
  if (st.installed || typeof window === 'undefined') return;
  st.installed = true;
  const dev = !!import.meta.env.DEV;
  const note = (kind: LeaveBlock): void => { st.blocked[kind]++; };

  /** 히스토리 덫 — 사용자 입력 안에서만 건다(입력 없이 민 항목은 브라우저가 「뒤로」에서 건너뛴다) */
  const arm = (): void => {
    if (st.armed || !inSession(st.game)) return;
    try { history.pushState({ traLeaveGuard: 1 }, ''); st.armed = true; } catch { /* 샌드박스 · 파일 주소 — 덫 없이 간다(확인 창이 남는다) */ }
  };

  // ── 키 ──
  window.addEventListener('keydown', (ev) => {
    arm();
    if (!inSession(st.game)) return;
    const kind = classifyLeaveKey(ev, isTyping(ev), dev);
    if (!kind) return;
    ev.preventDefault();   // 기본 동작만 끈다 — 게임(Phaser)은 이 키를 그대로 듣는다
    note(kind);
    if (ev.repeat) return;
    if (kind === 'reload') toast(st.game, MSG_RELOAD);
    else if (kind === 'history' && ev.code !== 'Backspace') toast(st.game, MSG_HISTORY);
  }, { capture: true });
  // Alt를 뗄 때 브라우저 메뉴 줄로 포커스가 넘어간다(윈도우 · 리눅스) — 뗄 때도 끈다
  window.addEventListener('keyup', (ev) => {
    if (!inSession(st.game)) return;
    if (ev.key === 'Alt' && !isTyping(ev)) ev.preventDefault();
  }, { capture: true });

  // ── 마우스 옆 단추(뒤로 4번 = button 3 · 앞으로 5번 = button 4) ──
  for (const type of ['mousedown', 'mouseup', 'auxclick'] as const) {
    window.addEventListener(type, (ev) => {
      if (type === 'mousedown') arm();
      if (ev.button !== 3 && ev.button !== 4) return;
      if (!inSession(st.game)) return;
      ev.preventDefault();
      if (type === 'mouseup') { note('history'); toast(st.game, MSG_HISTORY); }
    }, { capture: true });
  }
  window.addEventListener('pointerdown', arm, { capture: true });

  // ── 히스토리 덫 — 단추 · 쓸기로 들어온 「뒤로」: 가짜 항목이 빠졌으니 다시 민다(페이지는 그대로) ──
  window.addEventListener('popstate', () => {
    st.armed = false;
    if (!inSession(st.game)) return;
    try { history.pushState({ traLeaveGuard: 1 }, ''); st.armed = true; } catch { /* 위와 같다 */ }
    note('history');
    toast(st.game, MSG_HISTORY);
  });

  // ── 끌어다 놓기 — 파일 · 링크를 떨어뜨리면 브라우저가 그것을 연다 ──
  for (const type of ['dragover', 'drop'] as const) {
    window.addEventListener(type, (ev) => {
      if (isTyping(ev)) return;
      ev.preventDefault();
      if (type === 'drop') note('drop');
    }, { capture: true });
  }
  // 캔버스 그림을 끌어 내는 것(끌다 놓으면 새 탭 · 이동)
  window.addEventListener('dragstart', (ev) => { if (!isTyping(ev)) ev.preventDefault(); }, { capture: true });

  // ── 오른쪽 클릭 메뉴 — 글 칸 밖은 언제나 끈다(씬마다 따로 끄던 것을 한 곳에서) ──
  window.addEventListener('contextmenu', (ev) => { if (!isTyping(ev)) ev.preventDefault(); }, { capture: true });

  // ── 확대 — Ctrl+휠 · 터치패드 오므리기(브라우저는 Ctrl+휠로 보낸다) · 사파리 제스처 ──
  window.addEventListener('wheel', (ev) => {
    if (!(ev.ctrlKey || ev.metaKey)) return;
    ev.preventDefault();
    note('zoom');
  }, { capture: true, passive: false });
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    window.addEventListener(type, (ev) => ev.preventDefault(), { capture: true });
  }

  // ── 막을 수 없는 길 — 저장하지 않은 진행이 있으면 브라우저 확인 창 ──
  window.addEventListener('beforeunload', (ev) => {
    if (!shouldConfirmLeave()) return;
    ev.preventDefault();
    // 옛 브라우저는 returnValue를 본다(문구는 브라우저가 정한다)
    (ev as BeforeUnloadEvent).returnValue = '';
  });

  // dev — 하네스가 판정 · 횟수를 읽는다
  if (dev) {
    (globalThis as typeof globalThis & { __LEAVE?: unknown }).__LEAVE = {
      state: st, inSession: () => inSession(st.game), shouldConfirmLeave, classifyLeaveKey,
    };
  }
}
