/**
 * @file Sfx.ts
 * @description 효과음 (WebAudio 합성 — 오디오 에셋 없이 동작)
 *
 * 211차 — 사운드 1차. 정식 녹음 에셋 전까지 **합성음으로 손맛을 먼저 잡는다**:
 *  - 낚시: 캐스팅 휙 · 착수 풍덩 · 입질 톡(단계별) · 챔질 · 헛챔질 · 릴 감는 딸깍(기어비가 빠르기를 정한다) ·
 *    드랙 풀리는 지지직 · 줄터짐 · 랜딩 팡파르
 *  - 생활: 돈 · 아이템 줍기 · 퀘스트 완료 · 하루 결산 · 버튼 · 먹기 · 타이틀
 *  - 버스 3개(효과음 · 대사 · 배경) — 설정의 볼륨 슬라이더(`pixelAngler_settings`)를 따른다.
 *
 * AudioContext 생성 실패(비지원/권한) 시 전부 무음 무해. 브라우저 자동재생 정책 때문에
 * 첫 입력(클릭 · 키) 때 컨텍스트를 깨운다(`installAudioUnlock`).
 */

let audioCtx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let voiceBus: GainNode | null = null;
let ambBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

/** 설정 볼륨 캐시 — 글자마다 localStorage를 읽지 않게 0.5초 단위로 갱신 */
const vol = { sfx: 0.7, voice: 0.6, bgm: 0.5, at: -1 };

function readVolumes(): void {
  const now = Date.now();
  if (now - vol.at < 500) return;
  vol.at = now;
  try {
    const raw = localStorage.getItem('pixelAngler_settings');
    if (!raw) return;
    const s = JSON.parse(raw) as { sfxVolume?: number; voiceVolume?: number; bgmVolume?: number };
    if (typeof s.sfxVolume === 'number') vol.sfx = s.sfxVolume;
    if (typeof s.voiceVolume === 'number') vol.voice = s.voiceVolume;
    if (typeof s.bgmVolume === 'number') vol.bgm = s.bgmVolume;
  } catch { /* 무시 — 기본값 */ }
}

/** 설정을 저장한 직후 부른다 — 다음 소리부터 새 볼륨 */
export function refreshAudioVolumes(): void {
  vol.at = -1;
  readVolumes();
  applyBusVolumes();
}

function applyBusVolumes(): void {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  sfxBus?.gain.setTargetAtTime(vol.sfx, t, 0.05);
  voiceBus?.gain.setTargetAtTime(vol.voice, t, 0.05);
  ambBus?.gain.setTargetAtTime(vol.bgm, t, 0.3);
}

/** dev 하네스용 — 최근에 낸 소리 이름(소리가 실제로 들리는지는 헤드리스가 못 듣는다) */
const devLog: string[] = [];
function note(name: string): void {
  if (!import.meta.env.DEV) return;
  devLog.push(name);
  if (devLog.length > 200) devLog.shift();
}
if (import.meta.env.DEV) (globalThis as unknown as { __SFX: { log: string[] } }).__SFX = { log: devLog };

export function audioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
      sfxBus = audioCtx.createGain(); sfxBus.connect(audioCtx.destination);
      voiceBus = audioCtx.createGain(); voiceBus.connect(audioCtx.destination);
      ambBus = audioCtx.createGain(); ambBus.connect(audioCtx.destination);
      readVolumes();
      sfxBus.gain.value = vol.sfx; voiceBus.gain.value = vol.voice; ambBus.gain.value = vol.bgm;
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    readVolumes();
    applyBusVolumes();
    return audioCtx;
  } catch {
    return null;
  }
}

export function busOf(kind: 'sfx' | 'voice' | 'amb'): GainNode | null {
  return kind === 'sfx' ? sfxBus : kind === 'voice' ? voiceBus : ambBus;
}

/** 1초짜리 흰 잡음 — 물소리 · 바람 · 드랙 · 착수에 공용 */
export function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const len = ac.sampleRate;
  noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** 첫 입력에 오디오를 깨운다(자동재생 정책) — 게임 생성 시 한 번 */
export function installAudioUnlock(): void {
  const wake = (): void => { audioContext(); };
  window.addEventListener('pointerdown', wake, { once: false, passive: true });
  window.addEventListener('keydown', wake, { once: false, passive: true });
}

// ═══════════════════════════════════════════════════════════════
// 합성 도구
// ═══════════════════════════════════════════════════════════════

interface ToneOpts {
  type?: OscillatorType; f0: number; f1?: number; at?: number; dur: number;
  peak: number; attack?: number; bus?: 'sfx' | 'voice';
}

function tone(ac: AudioContext, o: ToneOpts): void {
  const t = ac.currentTime + (o.at ?? 0.005);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = o.type ?? 'triangle';
  osc.frequency.setValueAtTime(o.f0, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + o.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.peak, t + (o.attack ?? 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(busOf(o.bus ?? 'sfx') ?? ac.destination);
  osc.start(t);
  osc.stop(t + o.dur + 0.02);
}

interface NoiseOpts {
  at?: number; dur: number; peak: number; attack?: number;
  filter: BiquadFilterType; f0: number; f1?: number; q?: number;
}

function noise(ac: AudioContext, o: NoiseOpts): void {
  const t = ac.currentTime + (o.at ?? 0.005);
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const bq = ac.createBiquadFilter();
  bq.type = o.filter;
  bq.Q.value = o.q ?? 1;
  bq.frequency.setValueAtTime(o.f0, t);
  if (o.f1) bq.frequency.exponentialRampToValueAtTime(Math.max(30, o.f1), t + o.dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.peak, t + (o.attack ?? 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(bq).connect(g).connect(sfxBus ?? ac.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + o.dur + 0.05);
}

// ═══════════════════════════════════════════════════════════════
// 생활
// ═══════════════════════════════════════════════════════════════

/** 음식 섭취음 — 짧은 "냠냠냠" 3연타 (하강 스퀘어 블립) */
export function playEatSfx(): void {
  const ac = audioContext();
  if (!ac) return;
  note('eat');
  for (let i = 0; i < 3; i++) tone(ac, { type: 'square', f0: 190 - i * 22, f1: 85, at: 0.01 + i * 0.11, dur: 0.09, peak: 0.16, attack: 0.012 });
}

/** 203차 — 숨은 업적(타이틀) 달성 징글: 짧게 올라가는 4음 + 마지막 음 길게. 레어도가 높을수록 한 음 더 */
export function playTitleJingle(steps = 4): void {
  const ac = audioContext();
  if (!ac) return;
  note('title');
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5].slice(0, Math.max(3, Math.min(5, steps)));
  notes.forEach((f, i) => {
    const last = i === notes.length - 1;
    tone(ac, { f0: f, at: 0.02 + i * 0.1, dur: last ? 0.55 : 0.12, peak: 0.12, attack: 0.015 });
  });
}

/** 버튼 · 선택지 — 아주 짧은 나무 딸깍 */
export function playUiClick(): void {
  const ac = audioContext();
  if (!ac) return;
  note('click');
  tone(ac, { type: 'triangle', f0: 1400, f1: 900, dur: 0.035, peak: 0.07, attack: 0.002 });
}

/** 창 열기 — 종이 펼치는 짧은 잡음 + 낮은 톤 */
export function playUiOpen(): void {
  const ac = audioContext();
  if (!ac) return;
  note('open');
  noise(ac, { dur: 0.09, peak: 0.05, filter: 'bandpass', f0: 2600, f1: 4200, q: 1.2 });
  tone(ac, { f0: 520, f1: 660, dur: 0.07, peak: 0.04 });
}

/** 돈 — 동전 두 번 짤랑(액수가 크면 한 번 더) */
export function playCoin(amountWon = 0): void {
  const ac = audioContext();
  if (!ac) return;
  note('coin');
  const n = amountWon >= 50_000 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    tone(ac, { type: 'square', f0: 1976, dur: 0.06, peak: 0.05, at: 0.005 + i * 0.075, attack: 0.002 });
    tone(ac, { type: 'square', f0: 2637, dur: 0.16, peak: 0.045, at: 0.04 + i * 0.075, attack: 0.002 });
  }
}

/** 아이템 줍기 — 올라가는 두 음 */
export function playPickup(): void {
  const ac = audioContext();
  if (!ac) return;
  note('pickup');
  tone(ac, { f0: 660, dur: 0.07, peak: 0.08 });
  tone(ac, { f0: 990, dur: 0.12, peak: 0.08, at: 0.07 });
}

/** 퀘스트 목표 · 완료 — 완료면 화음 세 음, 목표 하나면 두 음 */
export function playQuestChime(complete = false): void {
  const ac = audioContext();
  if (!ac) return;
  note(complete ? 'quest_complete' : 'quest_step');
  const seq = complete ? [587.33, 739.99, 880, 1174.66] : [698.46, 1046.5];
  seq.forEach((f, i) => tone(ac, { f0: f, at: 0.01 + i * 0.09, dur: i === seq.length - 1 ? 0.5 : 0.14, peak: 0.09 }));
}

/** 하루 결산 — 저녁 종소리(낮게 울리는 두 음 + 맑은 한 음) */
export function playDayChime(): void {
  const ac = audioContext();
  if (!ac) return;
  note('day');
  tone(ac, { type: 'sine', f0: 392, dur: 1.4, peak: 0.1, attack: 0.02 });
  tone(ac, { type: 'sine', f0: 587.33, dur: 1.2, peak: 0.07, at: 0.22, attack: 0.02 });
  tone(ac, { type: 'sine', f0: 1174.66, dur: 0.9, peak: 0.04, at: 0.44, attack: 0.02 });
}

/** 결산 카드 한 장 넘길 때 — 종이 */
export function playPageFlip(): void {
  const ac = audioContext();
  if (!ac) return;
  note('page');
  noise(ac, { dur: 0.14, peak: 0.05, filter: 'highpass', f0: 1800, f1: 3500, q: 0.7 });
}

// ═══════════════════════════════════════════════════════════════
// 낚시
// ═══════════════════════════════════════════════════════════════

/** 캐스팅 — 낚싯대가 공기를 가르는 휙(세게 던질수록 길고 높게) */
export function playCast(power01 = 0.7): void {
  const ac = audioContext();
  if (!ac) return;
  note('cast');
  const p = Math.max(0.2, Math.min(1, power01));
  noise(ac, { dur: 0.22 + p * 0.18, peak: 0.08 + p * 0.06, attack: 0.04, filter: 'bandpass', f0: 600, f1: 2400 + p * 1600, q: 1.6 });
  // 원줄이 스풀에서 풀리는 사르륵
  noise(ac, { at: 0.12, dur: 0.5 + p * 0.4, peak: 0.025, attack: 0.05, filter: 'highpass', f0: 5000, q: 0.5 });
}

/** 착수 — 풍덩(채비가 무거울수록 낮고 크게) */
export function playSplash(size01 = 0.4): void {
  const ac = audioContext();
  if (!ac) return;
  note('splash');
  const s = Math.max(0.1, Math.min(1, size01));
  noise(ac, { dur: 0.25 + s * 0.35, peak: 0.08 + s * 0.12, attack: 0.006, filter: 'lowpass', f0: 2400 - s * 900, f1: 300, q: 0.8 });
  tone(ac, { type: 'sine', f0: 320 - s * 120, f1: 110, dur: 0.12 + s * 0.1, peak: 0.06 + s * 0.06 });
}

/** 입질 — 초릿대 끝이 톡(1단계) · 톡톡(2단계) · 쿡(3단계) */
export function playBiteTick(stage: number): void {
  const ac = audioContext();
  if (!ac) return;
  note(`bite${stage}`);
  const n = stage >= 3 ? 1 : stage;
  for (let i = 0; i < n; i++) {
    tone(ac, { type: 'triangle', f0: stage >= 3 ? 520 : 880, f1: stage >= 3 ? 180 : 600, at: 0.005 + i * 0.12, dur: stage >= 3 ? 0.18 : 0.05, peak: stage >= 3 ? 0.14 : 0.07, attack: 0.002 });
  }
  if (stage >= 3) noise(ac, { dur: 0.2, peak: 0.05, filter: 'lowpass', f0: 900, f1: 200 });
}

/** 챔질 성공 — 낚싯대가 휘청 + 줄이 팽팽해지는 소리 */
export function playHookSet(): void {
  const ac = audioContext();
  if (!ac) return;
  note('hookset');
  noise(ac, { dur: 0.16, peak: 0.12, attack: 0.003, filter: 'bandpass', f0: 1800, f1: 600, q: 1.2 });
  tone(ac, { type: 'sawtooth', f0: 140, f1: 70, dur: 0.22, peak: 0.1, attack: 0.004 });
  tone(ac, { type: 'triangle', f0: 1320, f1: 1180, dur: 0.3, peak: 0.04, at: 0.05 });
}

/** 헛챔질 — 허공을 가르는 짧은 휙 + 낮게 떨어지는 음 */
export function playHookMiss(): void {
  const ac = audioContext();
  if (!ac) return;
  note('hookmiss');
  noise(ac, { dur: 0.18, peak: 0.07, filter: 'bandpass', f0: 1600, f1: 500, q: 1.4 });
  tone(ac, { f0: 330, f1: 196, dur: 0.3, peak: 0.06, at: 0.08 });
}

/**
 * 릴 감는 딸깍 — 핸들 한 바퀴의 일부마다 한 번. 부르는 쪽이 감은 길이로 빈도를 정한다
 * (기어비가 높은 릴은 같은 손놀림에 더 많이 감겨 딸깍이 빨라진다). 무거울수록 낮고 둔하다.
 */
export function playReelTick(load01 = 0): void {
  const ac = audioContext();
  if (!ac) return;
  note('reel');
  const l = Math.max(0, Math.min(1, load01));
  tone(ac, { type: 'square', f0: 2400 - l * 1100, dur: 0.018, peak: 0.022 + l * 0.01, attack: 0.001 });
}

/** 드랙이 풀린다 — 스풀이 역회전하는 지지직(세기 0~1 — 넘친 장력만큼 촘촘하게) */
export function playDragZing(intensity01 = 0.5): void {
  const ac = audioContext();
  if (!ac) return;
  note('drag');
  const k = Math.max(0.1, Math.min(1, intensity01));
  const n = 3 + Math.round(k * 5);
  for (let i = 0; i < n; i++) {
    tone(ac, { type: 'square', f0: 3200 + Math.random() * 600, dur: 0.012, peak: 0.03, at: 0.005 + i * (0.05 - k * 0.025), attack: 0.001 });
  }
}

/** 줄터짐 — 팅 끊기는 소리 + 낮게 떨어지는 줄 울림 */
export function playLineSnap(): void {
  const ac = audioContext();
  if (!ac) return;
  note('snap');
  noise(ac, { dur: 0.06, peak: 0.22, attack: 0.001, filter: 'highpass', f0: 2500, q: 0.7 });
  tone(ac, { type: 'sawtooth', f0: 900, f1: 90, dur: 0.45, peak: 0.08, at: 0.02, attack: 0.002 });
}

/** 랜딩 — 물 밖으로 들어 올리는 첨벙 + 팡파르(희귀할수록 한 음 더) */
export function playCatchFanfare(tier = 0): void {
  const ac = audioContext();
  if (!ac) return;
  note('catch');
  noise(ac, { dur: 0.3, peak: 0.12, filter: 'lowpass', f0: 2600, f1: 500, q: 0.8 });
  const seq = [523.25, 659.25, 783.99, 1046.5, 1318.5].slice(0, 3 + Math.max(0, Math.min(2, tier)));
  seq.forEach((f, i) => tone(ac, { f0: f, at: 0.18 + i * 0.09, dur: i === seq.length - 1 ? 0.6 : 0.12, peak: 0.1 }));
}

/** 놓아주기 — 물에 미끄러져 들어가는 첨벙 */
export function playRelease(): void {
  const ac = audioContext();
  if (!ac) return;
  note('release');
  noise(ac, { dur: 0.35, peak: 0.09, filter: 'lowpass', f0: 1800, f1: 260, q: 0.8 });
  tone(ac, { type: 'sine', f0: 600, f1: 300, dur: 0.25, peak: 0.04, at: 0.1 });
}
