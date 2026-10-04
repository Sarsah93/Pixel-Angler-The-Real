/**
 * @file Voice.ts
 * @description 대사 목소리 출력 (211차 — 동물의 숲식 블립).
 *
 * 타이핑 패널(대화창 · 혼잣말 · 가이드 말풍선 · 컷씬)이 글자를 찍을 때마다 `say(ch)`를 부른다.
 * 블립 간격(`gapMs`)보다 빨리 찍히는 글자는 건너뛴다 — 타이핑 속도와 무관하게 말 빠르기가 인물마다 일정하다.
 * 클릭으로 한 번에 다 찍으면 소리를 내지 않는다(`say`를 부르지 않으면 된다).
 * 인물 목소리 · 글자 음정 규칙은 core `CharacterVoice`.
 */

import { voiceSemitone, type VoiceProfile } from '@tra/core';
import { audioContext, busOf } from './Sfx.js';

export class VoiceTyper {
  private lastAt = -1e9;
  private count = 0;

  constructor(private profile: VoiceProfile) {}

  /** 말하는 사람이 바뀌었다(컷씬) */
  setProfile(p: VoiceProfile): void { this.profile = p; }

  /** 글자 하나 — 소리 낼 차례면 블립 */
  say(ch: string): void {
    const semi = voiceSemitone(ch);
    if (semi === null) return;
    const now = performance.now();
    if (now - this.lastAt < this.profile.gapMs) return;
    this.lastAt = now;
    const ac = audioContext();
    const bus = busOf('voice');
    if (!ac || !bus) return;
    this.count++;
    if (import.meta.env.DEV) {
      const g = globalThis as unknown as { __VOICE?: { blips: number } };
      g.__VOICE = { blips: (g.__VOICE?.blips ?? 0) + 1 };
    }
    const p = this.profile;
    // 모음 억양 + 아주 작은 흔들림(같은 글자가 이어져도 기계음처럼 들리지 않게)
    const wobble = (Math.random() - 0.5) * 0.6;
    const hz = p.baseHz * Math.pow(2, (semi * p.inflection + wobble) / 12);
    const t = ac.currentTime + 0.003;
    const dur = p.blipMs / 1000;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    const lp = ac.createBiquadFilter();
    osc.type = p.wave;
    osc.frequency.setValueAtTime(hz * 1.04, t);
    osc.frequency.exponentialRampToValueAtTime(hz, t + dur * 0.5);
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(4200, hz * 6);   // 각진 파형의 쇳소리를 깎는다
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp).connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** 지금까지 낸 블립 수 — 검증용 */
  get blips(): number { return this.count; }
}
