/**
 * @file Music.ts
 * @description 배경 음악 (261차 — 253차 Lyria 초안 2판을 게임에 넣는다).
 *
 * 곡은 `public/audio/bgm/*.mp3`(128kbps · 10곡)이고, 장면이 **자리**(`MusicPlace`)만 말하면 이 모듈이 곡을 고른다:
 *  - 메뉴 · 낚시(1인칭) · 집 · 텃밭(홈타운 필드) · 시장(가게 · 위판 · 실내 가게) · 필드(속초 같은 출조지 — 낮 / 밤).
 *  - 같은 자리에 곡이 둘이면(집 가/나 · 시장 가/나 · 낮 필드 어쿠스틱/칩튠) 번갈아 튼다 — 단 10분 안에 그 자리로 돌아오면
 *    듣던 곡을 잇는다(가게에 잠깐 들렀다 나왔는데 필드 곡이 바뀌면 어색하다).
 *  - 밤(19~04시 KST)은 밤바다 곡 — 필드 씬이 1초마다 `playMusic('field')`를 다시 불러 시간이 바뀌면 곡이 바뀐다.
 *
 * 소리 쪽:
 *  - 파일을 받아 디코드한 뒤 앞뒤 무음을 잘라 내고, **끝 1.5초와 처음 1.5초를 겹쳐 구운 버퍼**를 반복한다(이음매 없음 —
 *    Lyria 출력은 「같은 분위기로 끝난다」일 뿐 딱 떨어지지 않는다).
 *  - 곡이 바뀔 때는 2초 교차 페이드. 같은 곡이면 아무것도 하지 않는다.
 *  - 디코드한 버퍼는 둘까지만 들고 있는다(한 곡 ≈ 56MB) — 자리를 오가면 다시 받는다(브라우저 캐시).
 *  - 볼륨은 설정 「배경 음악」(`bgmVolume` — Sfx `music` 버스). 브라우저 자동재생 정책으로 컨텍스트가 잠겨 있으면
 *    첫 입력에 풀리는 순간 시작한다(`statechange`).
 *
 * 헤드리스는 소리를 못 듣는다 — dev 전역 `__MUSIC`(지금 곡 · 자리 · 상태)로 하네스가 확인한다.
 */

import { kstParts } from '@tra/core';
import { audioContext, busOf } from './Sfx.js';

/** 장면이 말하는 자리 */
export type MusicPlace = 'menu' | 'field' | 'fishing' | 'home' | 'farm' | 'market' | 'none';

export type MusicTrackId =
  | 'menu' | 'field_day' | 'field_day_chip' | 'field_night' | 'fishing_wait'
  | 'home' | 'home_b' | 'farm' | 'market' | 'market_b';

interface TrackDef {
  file: string;
  /** 설정 창 · 로그에 쓰는 이름(사람 말) */
  titleKo: string;
  /** 곡마다 조금씩 다른 음량을 맞추는 배율(전곡 −12.3 LUFS 안팎이라 1.0) */
  trim: number;
}

export const MUSIC_TRACKS: Record<MusicTrackId, TrackDef> = {
  menu:           { file: 'audio/bgm/menu.mp3',           titleKo: '새벽 항구(메뉴)',       trim: 1.0 },
  field_day:      { file: 'audio/bgm/field_day.mp3',      titleKo: '낮 항구',               trim: 1.0 },
  field_day_chip: { file: 'audio/bgm/field_day_chip.mp3', titleKo: '낮 항구(칩튠)',         trim: 1.0 },
  field_night:    { file: 'audio/bgm/field_night.mp3',    titleKo: '밤바다',                trim: 1.0 },
  fishing_wait:   { file: 'audio/bgm/fishing_wait.mp3',   titleKo: '기다림(낚시)',          trim: 1.0 },
  home:           { file: 'audio/bgm/home.mp3',           titleKo: '옛집(가)',              trim: 1.0 },
  home_b:         { file: 'audio/bgm/home_b.mp3',         titleKo: '옛집(나)',              trim: 1.0 },
  farm:           { file: 'audio/bgm/farm.mp3',           titleKo: '텃밭',                  trim: 1.0 },
  market:         { file: 'audio/bgm/market.mp3',         titleKo: '시장(가)',              trim: 1.0 },
  market_b:       { file: 'audio/bgm/market_b.mp3',       titleKo: '시장(나)',              trim: 1.0 },
};

/** 자리마다 번갈아 트는 곡 — 낮 필드는 시간대가 가른다(`resolveTrack`) */
const PLACE_TRACKS: Record<Exclude<MusicPlace, 'none' | 'field'>, MusicTrackId[]> = {
  menu: ['menu'],
  fishing: ['fishing_wait'],
  home: ['home', 'home_b'],
  farm: ['farm'],
  market: ['market', 'market_b'],
};
const FIELD_DAY_TRACKS: MusicTrackId[] = ['field_day', 'field_day_chip'];

/** 교차 페이드(곡 ↔ 곡) 초 */
const XFADE_SEC = 2.0;
/** 반복 이음매(끝 ↔ 처음 겹침) 초 */
const LOOP_XFADE_SEC = 1.5;
/** 앞뒤 무음 자르기 문턱(진폭 — 약 −48dB) */
const SILENCE_AMP = 0.004;
/** 효과음 아래에 깔리도록 음악 전체를 낮추는 배율(설정 볼륨과 별개) */
const MUSIC_BED = 0.55;
/** 디코드 버퍼 보관 수 */
const CACHE_MAX = 2;
/** 이 시간 안에 같은 자리로 돌아오면 듣던 곡을 잇는다(ms) */
const STICKY_MS = 10 * 60 * 1000;

/** 밤 = 19~04시(R12 「밤에」와 같은 띠) */
export function isNightHourKst(d: Date = new Date()): boolean {
  const h = Number(kstParts(d).hh);
  return h >= 19 || h < 5;
}

interface Playing {
  id: MusicTrackId;
  src: AudioBufferSourceNode;
  gain: GainNode;
}

interface MusicState {
  place: MusicPlace;
  /** 지금 들리는(또는 들리려는) 곡 */
  current: MusicTrackId | null;
  /** 받는 중인 곡(아직 안 들림) */
  loading: MusicTrackId | null;
  /** 컨텍스트 상태(헤드리스 확인용 — 없으면 'none') */
  ctx: AudioContextState | 'none';
  /** 자리별 번갈아 틀기 횟수 */
  rotation: Record<string, number>;
  /** 받은 곡 수 · 받다 실패한 곡 */
  loaded: MusicTrackId[];
  failed: MusicTrackId[];
}

const state: MusicState = { place: 'none', current: null, loading: null, ctx: 'none', rotation: {}, loaded: [], failed: [] };
const cache = new Map<MusicTrackId, AudioBuffer>();
let playing: Playing | null = null;
let fading: Playing[] = [];
let musicBus: GainNode | null = null;
let unlockHooked = false;
/** 받기 요청 번호 — 늦게 도착한 옛 요청이 새 곡을 덮지 않게 */
let seq = 0;
/** 마지막 선택(자리 + 곡) — 같은 자리를 다시 부르면 이 곡을 유지한다 */
let lastPicked: { place: MusicPlace; id: MusicTrackId } | null = null;
/** 자리마다 마지막으로 튼 곡과 그때(ms) — 10분 안에 돌아오면 같은 곡 */
const lastByPlace = new Map<MusicPlace, { id: MusicTrackId; at: number }>();

/** 기본 경로 — vite `base: './'`라 상대 경로(gh-pages 하위 경로) */
function urlOf(file: string): string {
  const base = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/');
  return base + file;
}

/**
 * 자리 → 곡. 같은 자리를 다시 부르면(1초 틱) 마지막 선택을 유지하고, 10분 안에 돌아온 자리도 듣던 곡을 잇는다.
 * 필드는 낮 ↔ 밤이 바뀌면 곡을 바꾼다(밤은 한 곡).
 */
function resolveTrack(place: MusicPlace, now: Date): MusicTrackId | null {
  if (place === 'none') return null;
  const night = place === 'field' && isNightHourKst(now);
  const list = place === 'field' ? (night ? ['field_night' as MusicTrackId] : FIELD_DAY_TRACKS) : PLACE_TRACKS[place];
  const keep = (id: MusicTrackId | undefined): id is MusicTrackId => !!id && list.includes(id);
  if (lastPicked?.place === place && keep(lastPicked.id)) return lastPicked.id;
  const prev = lastByPlace.get(place);
  if (prev && keep(prev.id) && now.getTime() - prev.at < STICKY_MS) return prev.id;
  return rotate(place === 'field' ? 'field_day' : place, list);
}

function rotate(key: string, list: MusicTrackId[]): MusicTrackId {
  const n = state.rotation[key] ?? 0;
  state.rotation[key] = n + 1;
  return list[n % list.length];
}

/**
 * 앞뒤 무음을 잘라 내고 끝 X초와 처음 X초를 겹쳐(등전력) 구운 **반복용 버퍼**.
 * 길이 = (잘린 길이 − X). 끝에서 처음으로 넘어갈 때 원본의 (끝 − X) 지점이 그대로 이어지고,
 * 그 위에서 X초 동안 꼬리가 사라지며 머리가 올라온다 — 이음매가 들리지 않는다.
 */
export function bakeLoopBuffer(ctx: BaseAudioContext, src: AudioBuffer, xfadeSec = LOOP_XFADE_SEC, silenceAmp = SILENCE_AMP): AudioBuffer {
  const ch = src.numberOfChannels;
  const sr = src.sampleRate;
  const data: Float32Array[] = [];
  for (let c = 0; c < ch; c++) data.push(src.getChannelData(c));
  // 앞뒤 무음(모든 채널이 문턱 아래) 찾기
  let s = 0, e = src.length;
  const loud = (i: number): boolean => { for (let c = 0; c < ch; c++) if (Math.abs(data[c][i]) > silenceAmp) return true; return false; };
  while (s < e && !loud(s)) s++;
  while (e > s && !loud(e - 1)) e--;
  const L = e - s;
  const X = Math.min(Math.floor(xfadeSec * sr), Math.floor(L / 4));
  const N = L - X;
  if (N <= sr) return src;   // 너무 짧으면 그대로
  const out = ctx.createBuffer(ch, N, sr);
  for (let c = 0; c < ch; c++) {
    const i = data[c];
    const o = out.getChannelData(c);
    for (let k = 0; k < X; k++) {
      const th = (Math.PI / 2) * (k / X);
      o[k] = i[s + k] * Math.sin(th) + i[s + (L - X) + k] * Math.cos(th);
    }
    o.set(i.subarray(s + X, s + N), X);
  }
  return out;
}

function ensureBus(ctx: AudioContext): GainNode {
  if (!musicBus) {
    musicBus = ctx.createGain();
    musicBus.gain.value = MUSIC_BED;
    musicBus.connect(busOf('music') ?? ctx.destination);
  }
  return musicBus;
}

async function load(id: MusicTrackId, ctx: AudioContext): Promise<AudioBuffer | null> {
  const hit = cache.get(id);
  if (hit) { cache.delete(id); cache.set(id, hit); return hit; }   // 최근 사용 순
  try {
    const res = await fetch(urlOf(MUSIC_TRACKS[id].file));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.arrayBuffer();
    const decoded = await ctx.decodeAudioData(raw);
    const buf = bakeLoopBuffer(ctx, decoded);
    cache.set(id, buf);
    while (cache.size > CACHE_MAX) { const first = cache.keys().next().value as MusicTrackId; cache.delete(first); }
    if (!state.loaded.includes(id)) state.loaded.push(id);
    return buf;
  } catch (err) {
    if (!state.failed.includes(id)) state.failed.push(id);
    console.warn('[Music] 곡을 받지 못했다', id, err);
    return null;
  }
}

function stopWithFade(p: Playing, ctx: AudioContext, sec: number): void {
  const t = ctx.currentTime;
  p.gain.gain.cancelScheduledValues(t);
  p.gain.gain.setValueAtTime(p.gain.gain.value, t);
  p.gain.gain.linearRampToValueAtTime(0, t + sec);
  fading.push(p);
  try { p.src.stop(t + sec + 0.05); } catch { /* 이미 멈춤 */ }
  p.src.onended = () => { fading = fading.filter((f) => f !== p); try { p.gain.disconnect(); } catch { /* 무시 */ } };
}

function start(id: MusicTrackId, buf: AudioBuffer, ctx: AudioContext): void {
  const bus = ensureBus(ctx);
  const gain = ctx.createGain();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.loopStart = 0;
  src.loopEnd = buf.duration;
  src.connect(gain).connect(bus);
  const t = ctx.currentTime;
  const target = MUSIC_TRACKS[id].trim;
  if (playing) {
    stopWithFade(playing, ctx, XFADE_SEC);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(target, t + XFADE_SEC);
  } else {
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(target, t + 0.8);
  }
  src.start(t);
  playing = { id, src, gain };
  state.current = id;
}

/** 컨텍스트가 잠겨 있으면(자동재생 정책) 풀리는 순간 다시 시도한다 */
function hookUnlock(ctx: AudioContext): void {
  if (unlockHooked) return;
  unlockHooked = true;
  ctx.addEventListener('statechange', () => {
    state.ctx = ctx.state;
    if (ctx.state === 'running' && state.place !== 'none' && !playing) void playMusic(state.place, true);
  });
}

/**
 * 자리를 말한다. 같은 자리면(곡이 그대로면) 아무것도 하지 않는다 — 1초 틱에서 불러도 된다.
 * @param force 같은 곡이라도 다시 시작(컨텍스트가 풀린 뒤)
 */
export async function playMusic(place: MusicPlace, force = false): Promise<void> {
  state.place = place;
  const ctx = audioContext();
  if (!ctx) { state.ctx = 'none'; return; }
  state.ctx = ctx.state;
  hookUnlock(ctx);
  const now = new Date();
  const id = resolveTrack(place, now);
  if (!id) { stopMusic(); return; }
  lastPicked = { place, id };
  lastByPlace.set(place, { id, at: now.getTime() });
  if (!force && (playing?.id === id || state.loading === id)) return;
  if (ctx.state !== 'running') return;   // 풀리면 statechange가 다시 부른다
  const my = ++seq;
  state.loading = id;
  const buf = await load(id, ctx);
  if (my !== seq) return;   // 그 사이 다른 곡을 골랐다
  state.loading = null;
  if (!buf) return;
  if (playing?.id === id) return;
  if (lastPicked?.id !== id) return;
  start(id, buf, ctx);
}

/** 음악을 멈춘다(페이드 아웃). 자리는 `none`. */
export function stopMusic(): void {
  state.place = 'none';
  state.current = null;
  lastPicked = null;
  seq++;
  const ctx = audioContext();
  if (playing && ctx) { stopWithFade(playing, ctx, 1.0); playing = null; }
}

/** 지금 곡 이름(사람 말) — 설정 · 로그 */
export function currentMusicTitle(): string | null {
  return state.current ? MUSIC_TRACKS[state.current].titleKo : null;
}

/** dev 하네스 — 상태 읽기 */
export function musicState(): Readonly<MusicState> & { playing: MusicTrackId | null; fading: number; cached: MusicTrackId[] } {
  return { ...state, playing: playing?.id ?? null, fading: fading.length, cached: [...cache.keys()] };
}

if (import.meta.env.DEV) {
  (globalThis as unknown as { __MUSIC: unknown }).__MUSIC = { state: musicState, play: playMusic, stop: stopMusic, tracks: MUSIC_TRACKS, bake: bakeLoopBuffer, isNight: isNightHourKst };
}
