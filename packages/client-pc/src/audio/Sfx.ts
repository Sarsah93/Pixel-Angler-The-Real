/**
 * @file Sfx.ts
 * @description 간이 효과음 (WebAudio 합성 — 오디오 에셋 없이 동작하는 플레이스홀더)
 *
 * 정식 사운드 에셋 도입(IMPLEMENTATION_PLAN 사운드 이펙트 과제) 전까지
 * 짧은 합성음으로 대체한다. AudioContext 생성 실패(비지원/권한) 시 무음 무해.
 */

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** 음식 섭취음 — 짧은 "냠냠냠" 3연타 (하강 스퀘어 블립) */
export function playEatSfx(): void {
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + 0.01;
  for (let i = 0; i < 3; i++) {
    const t = t0 + i * 0.11;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(190 - i * 22, t);
    osc.frequency.exponentialRampToValueAtTime(85, t + 0.07);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }
}
