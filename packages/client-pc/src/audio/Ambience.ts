/**
 * @file Ambience.ts
 * @description 배경음 — 파도 · 비 · 바람 · 천둥 (211차 파도 · 비 → 253차 날씨 환경음 · 실내 먹먹함 · 합성 잡음 — 소리 파일 없음).
 *
 * 정식 녹음 전까지 **그 자리에 서 있는 느낌**을 합성음으로 낸다.
 *  - 파도: 잡음을 낮게 거르고, 느린 물결(약 8초 주기)로 세기를 밀고 당긴다.
 *  - 비(253차 — 세기 0~1): 높은 쉬익(빗줄기) + 가운데 쏴아(굵은 비일수록) + 톡톡 빗방울(미리 구운 4초 고리).
 *  - 바람(253차): 분홍 잡음을 대역으로 거르고, 2.5~7초마다 돌풍이 세기 · 높이를 함께 밀어 올린다.
 *    세지면(0.55 이상) 좁은 대역의 「휘잉」이 얹힌다.
 *  - 천둥(253차): 12~45초마다 한 번(세기가 클수록 자주) — 먼 우르릉(낮게 · 천천히 구른다)이 많고,
 *    가끔 가까운 「콰광」(높은 갈라짐 + 묵직한 쿵 + 구르는 여운). 한 번 친 뒤 다음까지 다시 뽑는다.
 *  - 실내(253차): 날씨 소리 묶음을 저역 거르개(약 650Hz)로 먹먹하게 하고 0.6배로 줄인다 — 벽 너머 비 · 바람 · 천둥.
 *
 * 씬이 `setAmbience({ sea, rain, wind, thunder, indoor })`로 목표(0~1)를 정하면 1초 안팎에 걸쳐 따라간다.
 * 날씨 값은 `audio/WeatherSound.ts`(`weatherSoundLevels`)가 기상 실데이터(날씨 종류 · 시간당 강수 · 풍속)로 정한다.
 * 볼륨은 설정의 「배경음」을 따른다(Sfx `amb` 버스).
 *
 * 그래프 짜기(`buildWeather`)와 일정 넣기(`scheduleGust` · `scheduleThunder`)는 컨텍스트를 받는다 —
 * 실시간은 0.25초 박자로 다음 돌풍 · 천둥을 미리 넣고, 미리 듣기(`renderWeatherPreview`)는 OfflineAudioContext에 같은 함수로 넣는다.
 */

import { audioContext, busOf, noteSfx } from './Sfx.js';

/** 목표 세기(0~1) · 실내 여부 */
export interface AmbienceTarget {
  sea?: number;
  rain?: number;
  wind?: number;
  thunder?: number;
  indoor?: boolean;
}

interface Levels { sea: number; rain: number; wind: number; thunder: number; indoor: boolean }

const ZERO: Levels = { sea: 0, rain: 0, wind: 0, thunder: 0, indoor: false };

// ── 잡음 버퍼(컨텍스트마다 · 4초 — 1초 고리는 귀가 되풀이를 알아챈다) ─────────────

const bufCache = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

function cached(ctx: BaseAudioContext, key: string, make: () => AudioBuffer): AudioBuffer {
  let m = bufCache.get(ctx);
  if (!m) { m = new Map(); bufCache.set(ctx, m); }
  let b = m.get(key);
  if (!b) { b = make(); m.set(key, b); }
  return b;
}

/** 흰 잡음 4초 */
function whiteBuf(ctx: BaseAudioContext, key = 'white'): AudioBuffer {
  return cached(ctx, key, () => {
    const len = ctx.sampleRate * 4;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  });
}

/** 분홍 잡음 4초(Paul Kellet 근사 — 낮은 소리가 두툼해 바람 · 굵은 비 · 천둥에 맞다) */
function pinkBuf(ctx: BaseAudioContext, key = 'pink'): AudioBuffer {
  return cached(ctx, key, () => {
    const len = ctx.sampleRate * 4;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return b;
  });
}

/** 갈색 잡음 4초(적분 — 천둥의 구르는 저음) */
function brownBuf(ctx: BaseAudioContext): AudioBuffer {
  return cached(ctx, 'brown', () => {
    const len = ctx.sampleRate * 4;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    return b;
  });
}

/** 빗방울 4초 고리 — 높이 · 세기가 제각각인 짧은 「톡」을 초당 약 55개 흩뿌린다 */
function dropsBuf(ctx: BaseAudioContext): AudioBuffer {
  return cached(ctx, 'drops', () => {
    const sr = ctx.sampleRate;
    const len = sr * 4;
    const b = ctx.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    const n = 220;
    for (let k = 0; k < n; k++) {
      const at = Math.floor(Math.random() * (len - sr * 0.05));
      const f = 1800 + Math.random() * 4200;           // 톡 높이
      const decay = 0.004 + Math.random() * 0.012;      // 4~16ms
      const amp = Math.pow(Math.random(), 2.2) * 0.9 + 0.05;   // 대부분 작고 가끔 가까운 큰 방울
      const m = Math.floor(sr * decay * 5);
      for (let i = 0; i < m && at + i < len; i++) {
        const tt = i / sr;
        const env = Math.exp(-tt / decay);
        const chirp = f * (1 - 0.25 * (tt / (decay * 5)));   // 살짝 내려가는 물방울
        d[at + i] += amp * env * Math.sin(2 * Math.PI * chirp * tt) * (i < 3 ? i / 3 : 1);
      }
    }
    let peak = 0;
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
    if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak;
    return b;
  });
}

function loopSrc(ctx: BaseAudioContext, buf: AudioBuffer, rate = 1): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.playbackRate.value = rate;
  return s;
}

function filter(ctx: BaseAudioContext, type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode {
  const bq = ctx.createBiquadFilter();
  bq.type = type; bq.frequency.value = f; bq.Q.value = q;
  return bq;
}

function gainNode(ctx: BaseAudioContext, v = 0): GainNode {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
}

// ── 그래프 ────────────────────────────────────────────────

/** 날씨 소리 묶음 — 층마다 세기 손잡이(GainNode) */
interface WeatherGraph {
  ctx: BaseAudioContext;
  sea: GainNode;
  rainHiss: GainNode;
  rainBody: GainNode;
  rainDrops: GainNode;
  wind: GainNode;
  windGust: GainNode;
  windBand: BiquadFilterNode;
  howl: GainNode;
  howlBand: BiquadFilterNode;
  /** 천둥이 붙는 곳(실내 거르개 앞) */
  thunderIn: GainNode;
  indoorLp: BiquadFilterNode;
  indoorGain: GainNode;
  stoppers: AudioScheduledSourceNode[];
}

/** 실내 거르개 · 세기 */
const INDOOR_LP = 650;
const INDOOR_GAIN = 0.6;

/**
 * 층 세기 표 — 세기(0~1) → 손잡이 값. A 가중 RMS로 맞춘 값(253차 실측 · 바닷가 파도 0.85 = 기준 0dB):
 * 보통 비(0.55) 약 -2dB · 굵은 비(1) 약 +2dB · 바람 0.3 ≈ -12dB · 0.5 ≈ -6dB · 0.9(강풍) ≈ +1dB.
 */
const MIX = {
  sea: (v: number): number => v * 0.5,
  rainHiss: (r: number): number => 0.088 * Math.pow(r, 0.8),
  rainBody: (r: number): number => 0.2 * Math.pow(r, 1.6),
  rainDrops: (r: number): number => 0.11 * Math.pow(r, 0.6),
  wind: (w: number): number => 1.15 * Math.pow(w, 1.3),
  howl: (w: number): number => (w < 0.55 ? 0 : 0.5 * Math.pow((w - 0.55) / 0.45, 1.3)),
};

function buildWeather(ctx: BaseAudioContext, dest: AudioNode): WeatherGraph {
  const stoppers: AudioScheduledSourceNode[] = [];
  const indoorLp = filter(ctx, 'lowpass', 20000, 0.5);
  const indoorGain = gainNode(ctx, 1);
  // 끝에 누르개 — 바닷가 · 폭우 · 가까운 천둥이 겹쳐도(배경음 100%) 소리가 깨지지 않게 봉우리만 누른다
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -8; comp.knee.value = 4; comp.ratio.value = 10; comp.attack.value = 0.004; comp.release.value = 0.3;
  indoorLp.connect(indoorGain).connect(comp).connect(dest);

  // 파도 — 211차 그대로(느린 물결로 밀고 당김)
  const seaSrc = loopSrc(ctx, whiteBuf(ctx, 'white_sea'), 0.35);
  const seaLp = filter(ctx, 'lowpass', 520, 0.4);
  const swell = gainNode(ctx, 0.55);
  const swellLfo = ctx.createOscillator();
  swellLfo.frequency.value = 0.12;
  const swellAmt = gainNode(ctx, 0.4);
  swellLfo.connect(swellAmt).connect(swell.gain);
  const sea = gainNode(ctx);
  seaSrc.connect(seaLp).connect(swell).connect(sea).connect(indoorLp);
  stoppers.push(seaSrc, swellLfo);

  // 비 — 쉬익(고역) · 쏴아(가운데) · 톡톡(빗방울)
  const hissSrc = loopSrc(ctx, whiteBuf(ctx, 'white_rain'));
  const rainHiss = gainNode(ctx);
  hissSrc.connect(filter(ctx, 'highpass', 3000, 0.5)).connect(filter(ctx, 'lowpass', 11000, 0.5)).connect(rainHiss).connect(indoorLp);
  const bodySrc = loopSrc(ctx, pinkBuf(ctx, 'pink_rain'), 1.1);
  const rainBody = gainNode(ctx);
  bodySrc.connect(filter(ctx, 'bandpass', 900, 0.5)).connect(rainBody).connect(indoorLp);
  const dropSrc = loopSrc(ctx, dropsBuf(ctx));
  const rainDrops = gainNode(ctx);
  dropSrc.connect(filter(ctx, 'highpass', 900, 0.5)).connect(rainDrops).connect(indoorLp);
  stoppers.push(hissSrc, bodySrc, dropSrc);

  // 바람 — 분홍 잡음 대역(돌풍이 높이를 민다) · 돌풍 세기 · 센 바람의 휘잉
  const windSrc = loopSrc(ctx, pinkBuf(ctx, 'pink_wind'), 0.9);
  const windBand = filter(ctx, 'bandpass', 380, 0.8);
  const windGust = gainNode(ctx, 0.6);
  const wind = gainNode(ctx);
  windSrc.connect(windBand).connect(windGust).connect(wind).connect(indoorLp);
  const howlSrc = loopSrc(ctx, pinkBuf(ctx, 'pink_howl'), 1.0);
  const howlBand = filter(ctx, 'bandpass', 700, 12);
  const howl = gainNode(ctx);
  howlSrc.connect(howlBand).connect(howl).connect(windGust);
  stoppers.push(windSrc, howlSrc);

  const thunderIn = gainNode(ctx, 1);
  thunderIn.connect(indoorLp);

  for (const s of stoppers) s.start();
  return { ctx, sea, rainHiss, rainBody, rainDrops, wind, windGust, windBand, howl, howlBand, thunderIn, indoorLp, indoorGain, stoppers };
}

/** 세기 맞추기 — tc = 따라가는 시간 상수(초) */
function applyLevels(g: WeatherGraph, L: Levels, t: number, tc: number): void {
  g.sea.gain.setTargetAtTime(MIX.sea(L.sea), t, tc);
  g.rainHiss.gain.setTargetAtTime(MIX.rainHiss(L.rain), t, tc);
  g.rainBody.gain.setTargetAtTime(MIX.rainBody(L.rain), t, tc);
  g.rainDrops.gain.setTargetAtTime(MIX.rainDrops(L.rain), t, tc);
  g.wind.gain.setTargetAtTime(MIX.wind(L.wind), t, tc);
  g.howl.gain.setTargetAtTime(MIX.howl(L.wind), t, tc);
  g.indoorLp.frequency.setTargetAtTime(L.indoor ? INDOOR_LP : 20000, t, tc * 0.5);
  g.indoorGain.gain.setTargetAtTime(L.indoor ? INDOOR_GAIN : 1, t, tc * 0.5);
}

/**
 * 돌풍 하나 — 1.5~3.5초에 걸쳐 세기 · 높이를 새 값으로(센 돌풍일수록 높고 크다).
 * @returns 다음 돌풍까지(초)
 */
function scheduleGust(g: WeatherGraph, t: number, wind: number, rnd: () => number): number {
  const k = 0.3 + rnd() * 0.7;                       // 이번 돌풍 세기
  const ramp = 1.5 + rnd() * 2;
  g.windGust.gain.setTargetAtTime(0.35 + 0.65 * k, t, ramp / 3);
  g.windBand.frequency.setTargetAtTime(240 + 520 * k * (0.6 + 0.4 * wind), t, ramp / 3);
  g.howlBand.frequency.setTargetAtTime(520 + 700 * k, t, ramp / 2.5);
  return 2.5 + rnd() * 4.5;
}

/**
 * 천둥 한 번. near = 가까운 「콰광」(갈라짐 + 쿵 + 구르는 여운) · 아니면 먼 우르릉.
 * 실내 거르개를 지나므로 집 안에서는 갈라짐이 무뎌지고 우르릉만 남는다.
 * @returns 이 천둥 길이(초)
 */
function scheduleThunder(g: WeatherGraph, t: number, near: boolean, rnd: () => number): number {
  const ctx = g.ctx;
  const len = near ? 5 + rnd() * 2.5 : 4 + rnd() * 3.5;
  const peak = near ? 0.8 + rnd() * 0.2 : 0.5 + rnd() * 0.3;
  const stopAt = t + len * 1.4 + 0.5;   // 여운이 충분히 사그라든 뒤 멈춘다(끊기는 딸깍 없게)

  // 구르는 소리 — 3~6번 밀려오는 우르릉. 가운데 소리(분홍 잡음 · 저역 거르개가 천천히 내려간다)가 작은 스피커에서도 들리게 하고,
  //   묵직한 바닥(갈색 잡음 · 150Hz 아래)을 함께 깐다. 두 층이 한 봉투를 쓴다.
  const rumbleSrc = loopSrc(ctx, pinkBuf(ctx, 'pink_thunder'), 0.7 + rnd() * 0.3);
  const lp = filter(ctx, 'lowpass', near ? 1300 : 650, 0.5);
  const rg = gainNode(ctx);
  rumbleSrc.connect(lp).connect(rg).connect(g.thunderIn);
  const deepSrc = loopSrc(ctx, brownBuf(ctx), 0.8 + rnd() * 0.4);
  const deepLp = filter(ctx, 'lowpass', 150, 0.6);
  const deepG = gainNode(ctx, 0.3);
  deepSrc.connect(deepLp).connect(deepG).connect(rg);
  const attack = near ? 0.06 : 0.5 + rnd() * 0.7;
  rg.gain.setValueAtTime(0.0001, t);
  rg.gain.linearRampToValueAtTime(peak * (near ? 1 : 0.7), t + attack);
  let tt = t + attack;
  const bumps = 3 + Math.floor(rnd() * 4);
  const bodyEnd = t + len * 0.55;
  for (let i = 0; i < bumps && tt < bodyEnd; i++) {
    tt += 0.25 + rnd() * 0.7;
    rg.gain.linearRampToValueAtTime(peak * (0.35 + rnd() * 0.65), Math.min(tt, bodyEnd));
  }
  rg.gain.setTargetAtTime(0.0001, Math.max(tt, bodyEnd), len * 0.16);
  lp.frequency.setTargetAtTime(near ? 260 : 200, t + attack, len * 0.3);   // 멀어지며 더 낮게
  rumbleSrc.start(t, rnd() * 3);
  rumbleSrc.stop(stopAt);
  deepSrc.start(t, rnd() * 3);
  deepSrc.stop(stopAt);

  if (near) {
    // 갈라짐 — 찢어지는 「콰르릉」: 높은 잡음의 터짐 6~9번(30~80ms 간격 · 0.3~0.6초) · 높이가 내려간다
    const crackSrc = loopSrc(ctx, whiteBuf(ctx, 'white_crack'));
    const hp = filter(ctx, 'bandpass', 2000, 0.5);
    const cg = gainNode(ctx);
    crackSrc.connect(hp).connect(cg).connect(g.thunderIn);
    cg.gain.setValueAtTime(0.0001, t);
    let ct = t;
    const n = 6 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      // 터짐마다 다음 터짐 전에 사그라든다(일정이 시간 순서를 지키게)
      const gap = 0.03 + rnd() * 0.05;
      const a = (0.55 + rnd() * 0.45) * 1.2 * Math.pow(0.86, i);
      cg.gain.linearRampToValueAtTime(a, ct + 0.004);
      cg.gain.exponentialRampToValueAtTime(0.004, ct + gap * 0.95);
      ct += gap;
    }
    cg.gain.setTargetAtTime(0.0001, ct, 0.05);
    hp.frequency.setTargetAtTime(600, t, 0.25);
    crackSrc.start(t, rnd() * 3);
    crackSrc.stop(ct + 0.6);

    // 쿵 — 낮은 사인이 떨어진다
    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(58, t + 0.02);
    thump.frequency.exponentialRampToValueAtTime(32, t + 0.7);
    const tg = gainNode(ctx);
    tg.gain.setValueAtTime(0.0001, t + 0.02);
    tg.gain.linearRampToValueAtTime(0.2, t + 0.05);
    tg.gain.exponentialRampToValueAtTime(0.0005, t + 0.9);
    thump.connect(tg).connect(g.thunderIn);
    thump.start(t + 0.02);
    thump.stop(t + 1);
  }
  return len;
}

// ── 실시간 ────────────────────────────────────────────────

let live: WeatherGraph | null = null;
let current: Levels = { ...ZERO };
let driver: ReturnType<typeof setInterval> | null = null;
let nextGustAt = 0;
let nextThunderAt = 0;

/** 다음 천둥까지(초) — 세기가 클수록 자주(1이면 12~28초 · 0.3이면 약 25~60초) */
function thunderGap(th: number, rnd: () => number): number {
  return (12 + rnd() * 16) / Math.max(0.25, th) * 0.55 + 4;
}

function tick(): void {
  const g = live;
  if (!g) return;
  const t = g.ctx.currentTime;
  if (current.wind > 0.02 && t >= nextGustAt) nextGustAt = t + scheduleGust(g, t + 0.05, current.wind, Math.random);
  if (current.thunder > 0.02) {
    if (nextThunderAt === 0) nextThunderAt = t + 4 + Math.random() * thunderGap(current.thunder, Math.random) * 0.5;
    else if (t >= nextThunderAt) {
      const near = Math.random() < 0.15 + 0.35 * current.thunder;
      const len = scheduleThunder(g, t + 0.05, near, Math.random);
      noteSfx(near ? 'amb_thunder_near' : 'amb_thunder_far');
      nextThunderAt = t + len + thunderGap(current.thunder, Math.random);
    }
  } else nextThunderAt = 0;
}

/** 배경 목표 세기(0~1) — 빠진 값은 0(메인 메뉴 = 파도만). 같은 값이면 아무것도 하지 않는다 */
export function setAmbience(target: AmbienceTarget): void {
  const c01 = (v: number | undefined): number => Math.max(0, Math.min(1, v ?? 0));
  const next: Levels = { sea: c01(target.sea), rain: c01(target.rain), wind: c01(target.wind), thunder: c01(target.thunder), indoor: !!target.indoor };
  const same = Math.abs(next.sea - current.sea) < 0.02 && Math.abs(next.rain - current.rain) < 0.02 && Math.abs(next.wind - current.wind) < 0.02
    && Math.abs(next.thunder - current.thunder) < 0.02 && next.indoor === current.indoor;
  if (same && live) return;
  current = next;
  if (import.meta.env.DEV) (globalThis as unknown as { __AMB: Levels }).__AMB = { ...current };
  const ac = audioContext();
  const bus = busOf('amb');
  if (!ac || !bus) return;
  if (!live) {
    if (next.sea <= 0 && next.rain <= 0 && next.wind <= 0 && next.thunder <= 0) return;   // 소리가 하나도 없으면 아직 짜지 않는다
    live = buildWeather(ac, bus);
  }
  applyLevels(live, next, ac.currentTime, 0.6);
  if (!driver) driver = setInterval(tick, 250);
}

/** 지금 목표 세기 — 검증용 */
export function ambienceLevel(): Levels { return { ...current }; }

/** dev — 천둥을 바로 한 번(하네스 · 귀 확인) */
export function devThunderNow(near = true): void {
  if (!live) return;
  scheduleThunder(live, live.ctx.currentTime + 0.05, near, Math.random);
  noteSfx(near ? 'amb_thunder_near' : 'amb_thunder_far');
}
if (import.meta.env.DEV) (globalThis as unknown as { __AMB_THUNDER: typeof devThunderNow }).__AMB_THUNDER = devThunderNow;

// ── 미리 듣기(오프라인) ─────────────────────────────────────

/** 정해진 씨앗의 난수(미리 듣기를 다시 뽑아도 같은 소리) */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 미리 듣기 — OfflineAudioContext에 날씨 한 장면을 seconds초 그린다(하네스가 WAV로 뽑아 들려준다).
 * 실시간과 같은 그래프 · 같은 돌풍 · 천둥 함수. thunderAt을 주면 그 시각(초)에 천둥을 친다(없으면 실시간처럼 뽑는다).
 */
export function renderWeatherPreview(ctx: BaseAudioContext, dest: AudioNode, target: AmbienceTarget, seconds: number,
  opts: { seed?: number; thunderAt?: readonly { t: number; near: boolean }[] } = {}): void {
  const rnd = seeded(opts.seed ?? 253);
  const L: Levels = { sea: target.sea ?? 0, rain: target.rain ?? 0, wind: target.wind ?? 0, thunder: target.thunder ?? 0, indoor: !!target.indoor };
  const g = buildWeather(ctx, dest);
  // 처음부터 그 세기로(미리 듣기는 0.3초 만에 다 오른다)
  applyLevels(g, L, 0, 0.1);
  if (L.wind > 0.02) for (let t = 0.05; t < seconds;) t += scheduleGust(g, t, L.wind, rnd);
  if (opts.thunderAt) for (const th of opts.thunderAt) scheduleThunder(g, th.t, th.near, rnd);
  else if (L.thunder > 0.02) {
    for (let t = 2 + rnd() * 4; t < seconds - 3; ) {
      const len = scheduleThunder(g, t, rnd() < 0.15 + 0.35 * L.thunder, rnd);
      t += len + thunderGap(L.thunder, rnd);
    }
  }
  for (const s of g.stoppers) s.stop(seconds);
}
