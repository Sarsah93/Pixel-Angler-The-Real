/**
 * @file TextInput.ts
 * @description 한글(IME) 입력을 받는 숨김 DOM 입력 (150차 — 사용자 리포트 "한글 타이핑 안 됨")
 *
 * ⚠ **Phaser `keydown`으로는 한글을 받을 수 없다.** 한글은 조합(composition)을 거쳐 완성되므로
 * 조합 중에는 `KeyboardEvent.key`가 `'Process'`(또는 미완성 자모)로 오고, 완성 글자는 `keydown`이
 * 아니라 `input`/`compositionend`로 전달된다. 구 구현은 `ev.key.length === 1`만 받아
 * **영문·숫자만 입력되고 한글은 통째로 사라졌다**(캐릭터 만들기 이름·지역 채팅·로비 코드 공통).
 *
 * 그래서 화면 밖 `<input>`을 하나 띄워 브라우저 IME에 입력을 맡기고, 값이 바뀔 때마다
 * `onChange`로 게임 쪽 텍스트를 갱신한다. Phaser는 렌더만 한다.
 *
 * ⚠ 입력 중에는 **Phaser 키보드 플러그인을 통째로 끈다**(145차 함정) — `stopPropagation()`으로는
 * `keydown-B` 같은 조합 이벤트가 따로 emit되는 것을 못 막아 채팅에 'b'를 치면 쿨러가 열렸다.
 */

import Phaser from 'phaser';

export interface TextInputOptions {
  /** 최대 글자 수 (조합 완성 기준) */
  maxLength?: number;
  /** 초기값 */
  value?: string;
  /** 값이 바뀔 때마다 (조합 중간 포함 — 미리보기용) */
  onChange?: (value: string) => void;
  /** Enter */
  onSubmit?: (value: string) => void;
  /** Escape */
  onCancel?: () => void;
  /** 입력 문자 필터 — false면 그 글자는 버린다 */
  filter?: (value: string) => string;
}

/**
 * 숨김 DOM 입력 하나를 열고 포커스를 준다. `close()`를 부를 때까지 살아 있다.
 * 같은 시점에 여러 개를 열지 말 것(포커스가 하나뿐이다).
 */
export class TextInput {
  private readonly el: HTMLInputElement;
  private readonly scene: Phaser.Scene;
  private readonly opts: TextInputOptions;
  private composing = false;
  private closed = false;
  private readonly keyHandler: (ev: KeyboardEvent) => void;
  private readonly onShutdown: () => void;

  constructor(scene: Phaser.Scene, opts: TextInputOptions = {}) {
    this.scene = scene;
    this.opts = opts;

    const el = document.createElement('input');
    el.type = 'text';
    el.value = opts.value ?? '';
    el.autocomplete = 'off';
    el.autocapitalize = 'off';
    el.spellcheck = false;
    if (opts.maxLength) el.maxLength = opts.maxLength * 3;   // 조합 중 자모가 늘어날 수 있다
    // 화면 밖 — 보이지 않지만 포커스는 받는다(display:none이면 포커스가 안 간다)
    el.style.cssText = [
      'position:fixed', 'left:-9999px', 'top:0', 'width:1px', 'height:1px',
      'opacity:0', 'border:0', 'padding:0', 'z-index:-1',
    ].join(';');
    document.body.appendChild(el);
    this.el = el;

    el.addEventListener('compositionstart', () => { this.composing = true; });
    el.addEventListener('compositionend', () => { this.composing = false; this.emit(); });
    el.addEventListener('input', () => { this.emit(); });

    // Enter/Escape는 input 이벤트로 오지 않는다 — 여기서 받는다.
    this.keyHandler = (ev: KeyboardEvent) => {
      if (this.closed) return;
      // 조합 중 Enter는 "글자 확정"이므로 제출로 보면 안 된다(IME 표준 신호: keyCode 229)
      if (this.composing || ev.isComposing || ev.keyCode === 229) return;
      if (ev.key === 'Enter') { ev.preventDefault(); this.opts.onSubmit?.(this.value); return; }
      if (ev.key === 'Escape') { ev.preventDefault(); this.opts.onCancel?.(); }
    };
    el.addEventListener('keydown', this.keyHandler);

    // Phaser 키보드는 입력이 끝날 때까지 정지 (145차 — 조합 이벤트가 씬 단축키를 때린다)
    if (scene.input.keyboard) scene.input.keyboard.enabled = false;

    this.onShutdown = () => this.close();
    scene.events.once('shutdown', this.onShutdown);
    scene.events.once('destroy', this.onShutdown);

    el.focus();
    // 커서를 끝으로
    try { el.setSelectionRange(el.value.length, el.value.length); } catch { /* 일부 브라우저 */ }
  }

  /** 지금 값 (필터·길이 제한 적용 후) */
  get value(): string { return this.el.value; }

  /** 조합 중인지 — 미리보기에 '조합 중' 표시를 하고 싶을 때 */
  get isComposing(): boolean { return this.composing; }

  setValue(v: string): void {
    this.el.value = v;
    this.opts.onChange?.(v);
  }

  private emit(): void {
    let v = this.el.value;
    if (this.opts.filter) v = this.opts.filter(v);
    // 길이 제한은 **조합이 끝난 뒤에만** 자른다 — 조합 중에 자르면 글자가 깨진다
    const max = this.opts.maxLength;
    if (!this.composing && max !== undefined && [...v].length > max) {
      v = [...v].slice(0, max).join('');
    }
    if (v !== this.el.value) this.el.value = v;
    this.opts.onChange?.(v);
  }

  /** 입력 종료 — DOM 제거 + Phaser 키보드 복구 */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.el.removeEventListener('keydown', this.keyHandler);
    this.el.blur();
    this.el.remove();
    this.scene.events.off('shutdown', this.onShutdown);
    this.scene.events.off('destroy', this.onShutdown);
    if (this.scene.input?.keyboard) this.scene.input.keyboard.enabled = true;
  }
}
