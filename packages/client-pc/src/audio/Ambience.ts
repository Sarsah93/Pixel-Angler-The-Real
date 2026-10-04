/**
 * @file Ambience.ts
 * @description 배경음 — 파도 · 비 (211차 · 합성 잡음 루프).
 *
 * 정식 배경음악 · 녹음 전까지 **바닷가에 서 있는 느낌**만 먼저 낸다.
 *  - 파도: 갈색 잡음을 낮게 거르고, 느린 물결(약 8초 주기)로 세기를 밀고 당긴다.
 *  - 비: 흰 잡음을 높게 걸러 바닥에 깐다.
 * 씬이 `setAmbience({ sea, rain })`로 목표 세기(0~1)를 정하면 1초에 걸쳐 따라간다.
 * 볼륨은 설정의 「배경음」을 따른다(Sfx `amb` 버스).
 */

import { audioContext, busOf, noiseBuffer } from './Sfx.js';

interface Layer { gain: GainNode; level: number }

let sea: Layer | null = null;
let rain: Layer | null = null;
let current = { sea: 0, rain: 0 };

function makeSea(ac: AudioContext, bus: GainNode): Layer {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  src.playbackRate.value = 0.35;                    // 느리게 = 낮고 굵은 물소리
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.4;
  const swell = ac.createGain();
  swell.gain.value = 0.55;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.12;                       // 파도가 밀려왔다 빠지는 주기
  const lfoAmt = ac.createGain();
  lfoAmt.gain.value = 0.4;
  lfo.connect(lfoAmt).connect(swell.gain);
  const out = ac.createGain();
  out.gain.value = 0;
  src.connect(lp).connect(swell).connect(out).connect(bus);
  src.start(); lfo.start();
  return { gain: out, level: 0 };
}

function makeRain(ac: AudioContext, bus: GainNode): Layer {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 2200; hp.Q.value = 0.3;
  const out = ac.createGain();
  out.gain.value = 0;
  src.connect(hp).connect(out).connect(bus);
  src.start();
  return { gain: out, level: 0 };
}

/** 배경 목표 세기(0~1). 같은 값이면 아무것도 하지 않는다 */
export function setAmbience(target: { sea?: number; rain?: number }): void {
  const next = { sea: Math.max(0, Math.min(1, target.sea ?? 0)), rain: Math.max(0, Math.min(1, target.rain ?? 0)) };
  if (Math.abs(next.sea - current.sea) < 0.02 && Math.abs(next.rain - current.rain) < 0.02) return;
  current = next;
  if (import.meta.env.DEV) (globalThis as unknown as { __AMB: typeof current }).__AMB = { ...current };
  const ac = audioContext();
  const bus = busOf('amb');
  if (!ac || !bus) return;
  if (next.sea > 0 && !sea) sea = makeSea(ac, bus);
  if (next.rain > 0 && !rain) rain = makeRain(ac, bus);
  const t = ac.currentTime;
  if (sea) { sea.level = next.sea; sea.gain.gain.setTargetAtTime(next.sea * 0.5, t, 0.6); }
  if (rain) { rain.level = next.rain; rain.gain.gain.setTargetAtTime(next.rain * 0.12, t, 0.6); }
}

/** 지금 목표 세기 — 검증용 */
export function ambienceLevel(): { sea: number; rain: number } { return { ...current }; }
