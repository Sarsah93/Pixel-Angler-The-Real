/**
 * @file SfxBank.ts
 * @description 252차 — 행동 · 상호작용 효과음 「레시피」 모음 (WebAudio 합성 — 소리 파일 없음).
 *
 * - 소리 하나 = 층(음 `tone` · 잡음 `noise`) 몇 개의 **데이터**다. 숫자만 고치면 소리가 바뀐다.
 *   음은 높이(`f0 → f1` 미끄러짐) · 파형 · 길이 · 세기, 잡음은 거르개(저역 · 고역 · 대역) 주파수 · 공명을 쓴다.
 *   `vib`(떨림) · `am`(세기 떨림 — 물 · 지글거림 · 바스락)으로 결을 낸다. `repeat`로 같은 층을 몇 번 되풀이한다.
 * - `playSfx(name)` — 효과음 버스(설정 「효과음」 볼륨)로 낸다. 같은 소리가 너무 촘촘하면 거른다(`minGapMs`).
 *   매번 음높이를 살짝 흔들어(`jitter`) 같은 소리가 기계처럼 반복되지 않게 한다.
 * - `renderSfx(ctx, dest, name)` — 어떤 컨텍스트에도 그린다(하네스가 OfflineAudioContext로 WAV를 뽑아 들려준다).
 * - 낚시 손맛 소리(캐스팅 · 입질 · 챔질 · 릴 · 드랙 · 줄터짐 · 랜딩)와 돈 · 줍기 · 퀘스트는 `Sfx.ts`(211차)에 그대로 있다.
 * - 253차 — 목소리 결: 음 층이 세 점 높이(`f0 → f1 → f2` · 꺾이는 곳 `split`) · 입 모양 거르개(`formant` — 열리고 닫히는 모음)
 *   · 세기 떨림(`am` — 굴리는 「르르」)을 받는다. 집 고양이 소리 8가지가 이것으로 만든다. `playSfx`는 좌우(`pan`)도 받는다.
 *
 * 왜 합성인가: Gemini API에는 효과음 모델이 없다(252차 확인 — 음성 TTS · 음악 Lyria · 영상 Veo뿐).
 * 합성음은 파일이 없어 배포 크기가 늘지 않고, 손맛을 고칠 때 숫자만 바꾸면 된다.
 */

import { audioContext, busOf, noteSfx } from './Sfx.js';

/** 음 층 */
interface ToneLayer {
  k: 'tone';
  wave?: OscillatorType;
  /** 시작 · 끝 높이(Hz) — f1이 있으면 지수로 미끄러진다 */
  f0: number;
  f1?: number;
  /** 시작 지연(초) */
  at?: number;
  /** 길이(초) */
  dur: number;
  /** 최고 세기(0~1) */
  peak: number;
  /** 올라가는 시간(초) */
  attack?: number;
  /** 최고 세기를 버티는 시간(초) — 없으면 바로 줄어든다 */
  hold?: number;
  /** 떨림 [빠르기 Hz, 깊이 Hz] */
  vib?: readonly [number, number];
  /** 253차 — 셋째 높이(Hz). 있으면 f0 → f1(길이의 `split` 지점) → f2(끝)로 오르내린다(「야옹」의 올라갔다 내려오는 높이) */
  f2?: number;
  /** f1에 닿는 지점(길이 비율 0~1 · 기본 0.4) — 입 모양 거르개도 같은 지점에서 꺾인다 */
  split?: number;
  /** 253차 — 입 모양 거르개 중심(Hz) [시작, 꺾임, 끝?] — 모음이 열리고 닫히는 결(목소리 높이와 따로 움직인다) */
  formant?: readonly [number, number, number?];
  /** 입 모양 거르개 종류(기본 대역) · 공명(기본 2.5) */
  ftype?: BiquadFilterType;
  fq?: number;
  /** 253차 — 세기 떨림 [빠르기 Hz, 깊이 0~1] — 굴리는 「르르」 · 골골 */
  am?: readonly [number, number];
}

/** 잡음 층 */
interface NoiseLayer {
  k: 'noise';
  filter: BiquadFilterType;
  f0: number;
  f1?: number;
  q?: number;
  at?: number;
  dur: number;
  peak: number;
  attack?: number;
  hold?: number;
  /** 세기 떨림 [빠르기 Hz, 깊이 0~1] — 물 흐름 · 지글거림 · 바스락 */
  am?: readonly [number, number];
}

type Layer = ToneLayer | NoiseLayer;

interface Recipe {
  layers: readonly Layer[];
  /** 같은 층을 n번 — every초 간격, 회마다 세기 × decay · 높이 × (1 + pitchStep) */
  repeat?: { n: number; every: number; decay?: number; pitchStep?: number };
  /** 음높이 흔들림(±비율 — 기본 0.04) */
  jitter?: number;
  /** 같은 소리 최소 간격(ms — 기본 35) */
  minGapMs?: number;
}

const tone = (f0: number, dur: number, peak: number, o: Partial<ToneLayer> = {}): ToneLayer => ({ k: 'tone', f0, dur, peak, ...o });
const noise = (filter: BiquadFilterType, f0: number, dur: number, peak: number, o: Partial<NoiseLayer> = {}): NoiseLayer => ({ k: 'noise', filter, f0, dur, peak, ...o });

/**
 * 레시피 표 — 이름은 행동(무엇을 했나)으로 짓는다. 쓰는 곳은 각 이름 옆 주석.
 * 세기는 211차 소리(0.04~0.16)와 맞춘다 — 상호작용 소리가 낚시 손맛보다 크지 않게.
 */
export const SFX_RECIPES = {
  // ── 창 · 단추 ───────────────────────────────────────────
  /** 창 열기 — 종이 펼치는 짧은 사락 + 낮은 톤 */
  panel_open: { layers: [noise('bandpass', 2200, 0.1, 0.045, { f1: 4400, q: 1.2 }), tone(520, 0.08, 0.035, { wave: 'triangle', f1: 700 })] },
  /** 창 닫기 — 거꾸로 접히는 사락 */
  panel_close: { layers: [noise('bandpass', 3600, 0.09, 0.04, { f1: 1800, q: 1.2 }), tone(620, 0.07, 0.03, { wave: 'triangle', f1: 440 })] },
  /** 탭 바꾸기 — 가벼운 톡 */
  tab: { layers: [tone(1800, 0.03, 0.05, { wave: 'triangle', f1: 1500, attack: 0.002 }), tone(900, 0.04, 0.025, { wave: 'sine', at: 0.015 })] },
  /** 켬 · 끔 */
  toggle_on: { layers: [tone(900, 0.05, 0.035, { wave: 'square', f1: 1300, attack: 0.002 })] },
  toggle_off: { layers: [tone(1100, 0.05, 0.035, { wave: 'square', f1: 700, attack: 0.002 })] },
  /** 안 됨(막힌 칸 · 가방 꽉 참 · 돈 모자람) — 낮은 「뿌뿌」 */
  deny: { layers: [tone(220, 0.07, 0.05, { wave: 'square', f1: 180, attack: 0.003 }), noise('lowpass', 800, 0.05, 0.02)], repeat: { n: 2, every: 0.09 }, minGapMs: 250 },
  /** 확인 · 결정 — 올라가는 두 음 */
  confirm: { layers: [tone(784, 0.07, 0.07, { wave: 'triangle' }), tone(1175, 0.14, 0.07, { wave: 'triangle', at: 0.06 })] },
  /** 알림 — 맑은 두 음(필드 로그의 경고 · 안전 · 주의 줄은 낮춰서 낸다 — RegionHud.pushLog) */
  notice: { layers: [tone(1047, 0.06, 0.05, { wave: 'sine' }), tone(1568, 0.12, 0.04, { wave: 'sine', at: 0.05 })], minGapMs: 120 },
  /** 말 걸기(대화창 열림) — 퐁 */
  talk: { layers: [tone(440, 0.07, 0.05, { wave: 'sine', f1: 660 }), noise('bandpass', 3000, 0.04, 0.015, { q: 2 })] },

  // ── 가방 · 물건 ─────────────────────────────────────────
  /** 땅에 내려놓기 — 둔탁한 툭 */
  item_drop: { layers: [tone(160, 0.12, 0.12, { wave: 'sine', f1: 70, attack: 0.003 }), noise('lowpass', 900, 0.1, 0.06, { f1: 200, attack: 0.002 })] },
  /** 칸 옮기기 · 바꾸기 — 나무 톡 */
  item_move: { layers: [tone(700, 0.045, 0.06, { wave: 'triangle', f1: 480, attack: 0.002 }), noise('bandpass', 1800, 0.03, 0.025, { q: 1.5, attack: 0.001 })] },
  /** 장비 차기 — 쇠 찰칵 */
  equip: { layers: [tone(1760, 0.05, 0.03, { wave: 'square', attack: 0.001 }), tone(2640, 0.12, 0.03, { wave: 'triangle', at: 0.03 }), noise('highpass', 4000, 0.04, 0.03, { attack: 0.001 })] },
  /** 장비 풀기 — 낮은 찰칵 */
  unequip: { layers: [tone(1320, 0.05, 0.03, { wave: 'square', attack: 0.001 }), tone(990, 0.1, 0.03, { wave: 'triangle', at: 0.03 }), noise('highpass', 3500, 0.04, 0.025, { attack: 0.001 })] },
  /** 버리기 — 구기는 바스락 + 떨어짐 */
  discard: { layers: [noise('bandpass', 1400, 0.22, 0.06, { q: 0.9, am: [28, 0.8] }), tone(260, 0.15, 0.04, { wave: 'sine', f1: 120, at: 0.05 })] },
  /** 쿨러 · 냉장고에 넣기 — 얼음 짤랑 + 물 출렁 */
  cooler_in: { layers: [tone(3135, 0.08, 0.05, { wave: 'sine', attack: 0.001 }), tone(4186, 0.1, 0.04, { wave: 'sine', at: 0.04, attack: 0.001 }), noise('bandpass', 900, 0.18, 0.07, { f1: 400, q: 0.8, at: 0.02 })] },
  /** 보관함 · 상자에 넣기 — 나무 상자 쿵 */
  storage_in: { layers: [tone(180, 0.1, 0.1, { wave: 'triangle', f1: 110, attack: 0.002 }), noise('lowpass', 1200, 0.08, 0.05, { f1: 300 })] },
  /** 물건 쓰기(먹을 것 말고) — 휙 */
  use_item: { layers: [noise('bandpass', 2500, 0.12, 0.03, { q: 3 }), tone(660, 0.12, 0.05, { wave: 'sine', f1: 990 })] },
  /** 마시기 — 꿀꺽 세 번 */
  drink: { layers: [tone(300, 0.08, 0.05, { wave: 'sine', f1: 500 }), noise('lowpass', 900, 0.06, 0.02)], repeat: { n: 3, every: 0.12, decay: 0.85 } },
  /** 포장하기 — 비닐 바스락 + 딸깍 */
  pack: { layers: [noise('bandpass', 2400, 0.18, 0.04, { q: 1, am: [40, 0.9] }), tone(900, 0.05, 0.04, { wave: 'triangle', f1: 600, at: 0.16 })] },

  // ── 텃밭 ───────────────────────────────────────────────
  /** 일구기 · 북주기(괭이) — 흙 퍽 */
  farm_till: { layers: [noise('lowpass', 700, 0.16, 0.12, { f1: 160, q: 0.7, attack: 0.004 }), tone(110, 0.12, 0.1, { wave: 'sine', f1: 60, attack: 0.002 }), noise('bandpass', 2400, 0.06, 0.03, { at: 0.02 })] },
  /** 캐기(삽) — 흙 긁고 퍽 두 번 */
  farm_dig: { layers: [noise('bandpass', 1600, 0.12, 0.07, { f1: 500, q: 1.2, attack: 0.01 }), tone(140, 0.08, 0.07, { wave: 'sine', f1: 80, at: 0.06 })], repeat: { n: 2, every: 0.16, decay: 0.85 } },
  /** 심기 · 씨 뿌리기 — 톡톡톡톡 */
  farm_plant: { layers: [noise('highpass', 3000, 0.025, 0.035, { attack: 0.001 }), tone(1200, 0.02, 0.015, { wave: 'sine' })], repeat: { n: 4, every: 0.055, pitchStep: 0.08 } },
  /** 물 주기 — 물뿌리개 졸졸 */
  farm_water: { layers: [noise('bandpass', 1300, 0.6, 0.06, { q: 2.2, attack: 0.05, hold: 0.35, am: [9, 0.5] }), noise('highpass', 5000, 0.5, 0.015, { attack: 0.05 })], minGapMs: 520 },
  /** 거두기 — 똑 따는 소리 */
  farm_harvest: { layers: [noise('highpass', 2600, 0.12, 0.04), tone(320, 0.09, 0.08, { wave: 'sine', f1: 760, at: 0.03, attack: 0.004 })] },
  /** 김매기 · 순 따기 — 풀 바스락 */
  farm_weed: { layers: [noise('highpass', 2200, 0.08, 0.04, { attack: 0.004 })], repeat: { n: 3, every: 0.07, decay: 0.9 } },
  /** 거름 · 비료 — 알갱이 사르륵 */
  farm_fertilize: { layers: [noise('bandpass', 3200, 0.35, 0.09, { q: 1.5, attack: 0.02, am: [35, 0.9] })] },
  /** 약 치기 — 분무 칙 */
  farm_spray: { layers: [noise('highpass', 4500, 0.45, 0.045, { attack: 0.04, hold: 0.3 }), noise('bandpass', 7000, 0.4, 0.015, { q: 2, attack: 0.04 })], minGapMs: 380 },
  /** 작업 장면 한 단계 해냄 — 짧은 딩 */
  work_step: { layers: [tone(988, 0.08, 0.05, { wave: 'triangle' }), tone(1319, 0.14, 0.045, { wave: 'triangle', at: 0.06 })], minGapMs: 120 },
  /** 작업 장면 실수 — 떨어지는 음 */
  work_miss: { layers: [tone(330, 0.2, 0.05, { wave: 'triangle', f1: 196 })], minGapMs: 200 },
  /** 땅지렁이 줍기 — 꼼지락 */
  worm: { layers: [tone(220, 0.18, 0.06, { wave: 'sine', vib: [14, 80], attack: 0.01 }), noise('lowpass', 600, 0.12, 0.04)] },

  // ── 갯것 · 통발 ─────────────────────────────────────────
  /** 모래 · 펄 파기 — 긁는 사각 두 번 */
  forage_dig: { layers: [noise('bandpass', 2200, 0.1, 0.12, { f1: 900, q: 1, attack: 0.006 })], repeat: { n: 2, every: 0.12, decay: 0.85 } },
  /** 집게로 비집기 — 딱 */
  forage_pry: { layers: [noise('highpass', 3000, 0.03, 0.1, { attack: 0.001 }), tone(2500, 0.03, 0.03, { wave: 'square', f1: 1800, attack: 0.001 }), tone(400, 0.06, 0.05, { wave: 'triangle', f1: 250, at: 0.02 })] },
  /** 잡았다 — 물 뚝뚝 + 두 음 */
  forage_get: { layers: [noise('lowpass', 1600, 0.14, 0.06, { f1: 400 }), tone(660, 0.07, 0.07, { wave: 'triangle', at: 0.05 }), tone(990, 0.12, 0.07, { wave: 'triangle', at: 0.11 })] },
  /** 놓쳤다 — 맥 빠지는 음 */
  forage_miss: { layers: [tone(300, 0.18, 0.06, { wave: 'triangle', f1: 180 }), noise('lowpass', 500, 0.1, 0.03)], minGapMs: 200 },
  /** 통발 · 설치물 물에 넣기 — 풍덩 */
  trap_place: { layers: [noise('lowpass', 1800, 0.3, 0.08, { f1: 300, q: 0.8, attack: 0.005 }), tone(260, 0.14, 0.06, { wave: 'sine', f1: 120 })] },
  /** 통발 걷기 — 물 줄줄 + 밧줄 */
  trap_haul: { layers: [noise('lowpass', 1200, 0.45, 0.11, { f1: 500, attack: 0.05, am: [6, 0.6] }), tone(90, 0.4, 0.015, { wave: 'sawtooth', f1: 110, attack: 0.05 })] },

  // ── 손질 · 회 ───────────────────────────────────────────
  /** 칼질 한 번 끝 — 슥 + 도마 톡 */
  knife_cut: { layers: [noise('bandpass', 3200, 0.12, 0.07, { f1: 1600, q: 1.4, attack: 0.005 }), noise('lowpass', 700, 0.05, 0.06, { at: 0.09, attack: 0.001 }), tone(150, 0.06, 0.06, { wave: 'sine', f1: 90, at: 0.09, attack: 0.001 })], minGapMs: 80 },
  /** 비늘 긁기 — 짧은 사각(문지를 때마다) */
  knife_scale: { layers: [noise('highpass', 3800, 0.05, 0.05, { attack: 0.002 })], minGapMs: 70 },
  /** 내장 빼기 — 질척 */
  knife_gut: { layers: [noise('lowpass', 900, 0.2, 0.07, { am: [18, 0.7] }), tone(180, 0.16, 0.04, { wave: 'sine', vib: [12, 60] })], minGapMs: 200 },
  /** 씻기 · 얼음물 — 촤아 */
  rinse: { layers: [noise('bandpass', 1500, 0.35, 0.07, { f1: 800, q: 1, attack: 0.02, am: [12, 0.5] }), noise('highpass', 6000, 0.25, 0.015)], minGapMs: 250 },
  /** 뒤집기 · 돌리기 — 젖은 철썩 */
  flip: { layers: [noise('lowpass', 1100, 0.1, 0.1, { f1: 300, attack: 0.002 }), tone(170, 0.1, 0.08, { wave: 'sine', f1: 90, attack: 0.002 })], minGapMs: 120 },
  /** 접시 완성 — 사기 띵 */
  plate: { layers: [tone(1568, 0.9, 0.05, { wave: 'sine', attack: 0.003 }), tone(2349, 0.6, 0.03, { wave: 'sine', attack: 0.003 }), tone(3136, 0.35, 0.015, { wave: 'sine', attack: 0.003 })] },

  // ── 불요리 ─────────────────────────────────────────────
  /** 불에 올리기 — 지글 */
  sizzle: { layers: [noise('highpass', 4200, 0.7, 0.05, { attack: 0.03, hold: 0.3, am: [21, 0.55] }), noise('bandpass', 2500, 0.5, 0.015, { q: 3 })], minGapMs: 300 },
  /** 뒤집기 · 젓기 — 철썩 + 지글 */
  cook_flip: { layers: [noise('lowpass', 1200, 0.08, 0.07, { f1: 400 }), noise('highpass', 4500, 0.35, 0.045, { at: 0.06, am: [25, 0.6] })], minGapMs: 200 },
  /** 다 됐다 — 딩동 */
  cook_done: { layers: [tone(1319, 0.1, 0.06, { wave: 'triangle' }), tone(1760, 0.3, 0.05, { wave: 'triangle', at: 0.09 })] },
  /** 탔다 — 푸식 + 낮은 경고 */
  cook_burnt: { layers: [noise('lowpass', 900, 0.3, 0.07, { f1: 200 }), tone(196, 0.25, 0.035, { wave: 'square', f1: 130, at: 0.05 })], minGapMs: 500 },
  /** 화구 불 붙이기 — 딸깍 + 화르륵 */
  ignite: { layers: [tone(3000, 0.015, 0.03, { wave: 'square', attack: 0.001 }), noise('bandpass', 400, 0.35, 0.12, { f1: 2400, q: 0.8, attack: 0.05 })] },
  /** 끓는 냄비 — 보글보글(낮은 거품 세 번 · 높이를 크게 흔든다) */
  boil: { layers: [tone(200, 0.06, 0.035, { wave: 'sine', f1: 380, attack: 0.004 }), noise('lowpass', 500, 0.08, 0.018)], repeat: { n: 3, every: 0.21, decay: 0.8, pitchStep: 0.15 }, jitter: 0.2, minGapMs: 600 },
  /** 재료 넣기 — 퐁당(올라가는 물방울 음 + 낮은 잡음) */
  plop: { layers: [tone(500, 0.09, 0.06, { wave: 'sine', f1: 1300, attack: 0.002 }), noise('lowpass', 1200, 0.1, 0.03)], jitter: 0.1, minGapMs: 90 },

  // ── 제작 ───────────────────────────────────────────────
  /** 만드는 중 — 망치 땅땅땅 */
  hammer: { layers: [tone(1300, 0.05, 0.04, { wave: 'square', f1: 1000, attack: 0.001 }), tone(2100, 0.08, 0.025, { wave: 'triangle', attack: 0.001 }), noise('highpass', 3000, 0.04, 0.04, { attack: 0.001 }), tone(140, 0.06, 0.05, { wave: 'sine' })], repeat: { n: 3, every: 0.16, decay: 0.9 } },
  /** 다 만들었다 — 올라가는 세 음 */
  craft_done: { layers: [tone(784, 0.08, 0.06, { wave: 'triangle' }), tone(988, 0.08, 0.06, { wave: 'triangle', at: 0.07 }), tone(1319, 0.3, 0.06, { wave: 'triangle', at: 0.14 })] },

  // ── 필드 · 세상 ─────────────────────────────────────────
  /** 문 열기 — 끼익 + 걸쇠 */
  door_open: { layers: [tone(180, 0.35, 0.035, { wave: 'sawtooth', f1: 260, attack: 0.05, vib: [9, 40] }), noise('bandpass', 900, 0.3, 0.05, { q: 4, attack: 0.05 }), tone(1400, 0.03, 0.04, { wave: 'triangle', at: 0.32 })], minGapMs: 400 },
  /** 문 닫기 — 쿵 + 걸쇠 */
  door_close: { layers: [tone(200, 0.1, 0.1, { wave: 'triangle', f1: 110, attack: 0.002 }), noise('lowpass', 900, 0.08, 0.06), tone(1600, 0.02, 0.025, { wave: 'square', at: 0.05 })], minGapMs: 400 },
  /** 설치하기 — 내려놓는 쿵 */
  place: { layers: [tone(140, 0.14, 0.12, { wave: 'sine', f1: 80, attack: 0.002 }), noise('lowpass', 1400, 0.12, 0.06, { f1: 300 }), noise('highpass', 2500, 0.06, 0.02, { at: 0.08 })] },
  /** 설치물 걷기 — 들어 올림 */
  unplace: { layers: [tone(90, 0.12, 0.08, { wave: 'sine', f1: 160 }), noise('lowpass', 1000, 0.1, 0.04)] },
  /** 자전거 — 따르릉 */
  bike_bell: { layers: [tone(2093, 0.4, 0.05, { wave: 'sine', attack: 0.002 }), tone(2794, 0.3, 0.03, { wave: 'sine', attack: 0.002 })], repeat: { n: 2, every: 0.14, decay: 0.8 }, minGapMs: 600 },
  /** 출조 · 이동(버스 · 배) — 엔진 부릉 */
  travel: { layers: [noise('lowpass', 300, 0.9, 0.16, { attack: 0.1, hold: 0.4, am: [14, 0.4] }), tone(70, 0.9, 0.03, { wave: 'sawtooth', attack: 0.1, vib: [6, 6] })], minGapMs: 1500 },
  /** 잠자기 — 내려가는 세 음 */
  sleep: { layers: [tone(659, 0.35, 0.05, { wave: 'sine' }), tone(523, 0.35, 0.05, { wave: 'sine', at: 0.3 }), tone(392, 0.8, 0.05, { wave: 'sine', at: 0.6 })], minGapMs: 1500 },
  /** 저장 — 펜 사각 + 두 음 */
  save: { layers: [noise('highpass', 3000, 0.15, 0.02, { am: [30, 0.8] }), tone(880, 0.1, 0.05, { wave: 'sine', at: 0.12 }), tone(1319, 0.25, 0.05, { wave: 'sine', at: 0.2 })], minGapMs: 800 },
  /** 밑밥 던지기 — 휙 + 흩어지는 첨벙 */
  chum: { layers: [noise('bandpass', 900, 0.18, 0.05, { f1: 2400, q: 1, attack: 0.02 }), noise('lowpass', 2000, 0.35, 0.07, { f1: 400, at: 0.2 })] },

  // ── 성장 ───────────────────────────────────────────────
  /** 레벨 업 — 올라가는 다섯 음 + 반짝 */
  level_up: { layers: [
    ...[523, 659, 784, 1047, 1319].map((f, i, a) => tone(f, i === a.length - 1 ? 0.6 : 0.1, 0.07, { wave: 'triangle', at: 0.02 + i * 0.08 })),
    noise('highpass', 6000, 0.6, 0.01, { at: 0.3, am: [20, 0.6] }),
  ], minGapMs: 1000 },
  /** 기술 배우기 — 반짝이는 세 음 */
  skill_learn: { layers: [tone(1047, 0.12, 0.05, { wave: 'sine' }), tone(1568, 0.12, 0.05, { wave: 'sine', at: 0.06 }), tone(2093, 0.4, 0.05, { wave: 'sine', at: 0.12 }), noise('highpass', 7000, 0.5, 0.012, { am: [20, 0.6], at: 0.06 })], minGapMs: 400 },
  /** 면허 받기 — 도장 쿵 + 두 음 */
  license: { layers: [tone(120, 0.1, 0.12, { wave: 'sine', f1: 70, attack: 0.002 }), noise('lowpass', 1200, 0.08, 0.07), tone(784, 0.12, 0.06, { wave: 'triangle', at: 0.15 }), tone(1175, 0.35, 0.06, { wave: 'triangle', at: 0.25 })], minGapMs: 800 },

  // ── 집 고양이(253차) ─────────────────────────────────────
  //   목소리 = 톱니파(배음이 많은 성대) → 입 모양 거르개(「ㅁ」 닫힘 → 「아」 열림 → 「옹」 닫힘) + 같은 높이의 세모파(몸통 울림).
  //   높이는 올라갔다 내려온다(f0 → f1 → f2). 부를 때마다 높이를 크게 흔들어(jitter) 같은 「야옹」이 되풀이되지 않게 한다.
  //   거리 · 좌우는 `HomeCat`이 정한다(멀면 작게 · 화면 왼쪽이면 왼쪽에서).
  /** 「야옹」 — 보통 울음(평소 가끔) */
  cat_meow: { layers: [
    tone(520, 0.56, 0.053, { wave: 'sawtooth', f1: 760, f2: 470, split: 0.38, formant: [700, 1900, 850], fq: 2.2, attack: 0.06, hold: 0.2, vib: [6, 12] }),
    tone(520, 0.56, 0.024, { wave: 'triangle', f1: 760, f2: 470, split: 0.38, attack: 0.06, hold: 0.2, vib: [6, 12] }),
    noise('bandpass', 1400, 0.12, 0.006, { q: 1.5, attack: 0.03 }),
  ], jitter: 0.08, minGapMs: 900 },
  /** 「냥」 — 짧고 높은 대답(다가가 [F] · 평소 가끔) */
  cat_mew: { layers: [
    tone(700, 0.26, 0.057, { wave: 'sawtooth', f1: 950, f2: 760, split: 0.45, formant: [1000, 2200, 1300], fq: 2.5, attack: 0.03, hold: 0.08, vib: [8, 15] }),
    tone(700, 0.26, 0.026, { wave: 'triangle', f1: 950, f2: 760, split: 0.45, attack: 0.03, hold: 0.08 }),
  ], jitter: 0.08, minGapMs: 700 },
  /** 「냐아아옹」 — 배고파 조르는 길고 끈질긴 울음 */
  cat_beg: { layers: [
    tone(480, 0.85, 0.05, { wave: 'sawtooth', f1: 820, f2: 400, split: 0.5, formant: [800, 2100, 700], fq: 2.0, attack: 0.08, hold: 0.42, vib: [5.5, 18] }),
    tone(480, 0.85, 0.023, { wave: 'triangle', f1: 820, f2: 400, split: 0.5, attack: 0.08, hold: 0.42, vib: [5.5, 18] }),
    noise('bandpass', 1300, 0.15, 0.005, { q: 1.4, attack: 0.04 }),
  ], jitter: 0.06, minGapMs: 1500 },
  /** 「브르릅」 — 반가워 굴리는 소리(곁에 와 앉을 때 · 평소 가끔) */
  cat_trill: { layers: [
    tone(380, 0.32, 0.09, { wave: 'sawtooth', f1: 620, formant: [800, 1500], fq: 1.8, attack: 0.02, hold: 0.14, am: [24, 0.9] }),
    tone(380, 0.32, 0.038, { wave: 'triangle', f1: 620, attack: 0.02, hold: 0.14, am: [24, 0.9] }),
  ], jitter: 0.06, minGapMs: 900 },
  /** 골골 — 쓰다듬을 때(숨 들이쉬고 내쉬는 세 번) · 잠결에 작게 */
  cat_purr: { layers: [
    tone(27, 1.0, 0.1, { wave: 'sawtooth', formant: [600, 480], ftype: 'lowpass', fq: 0.8, attack: 0.25, hold: 0.4 }),
    noise('bandpass', 420, 1.0, 0.036, { q: 0.8, attack: 0.25, hold: 0.4, am: [27, 0.95] }),
  ], repeat: { n: 3, every: 1.15, decay: 0.9, pitchStep: -0.04 }, jitter: 0.05, minGapMs: 3000 },
  /** 오도독 — 밥 먹는 소리(씹을 때마다 바삭 두 번 + 낮은 쩝) */
  cat_eat: { layers: [
    noise('bandpass', 3200, 0.04, 0.22, { q: 1.2, attack: 0.002 }),
    noise('bandpass', 2400, 0.035, 0.16, { q: 1.4, at: 0.07, attack: 0.002 }),
    noise('lowpass', 700, 0.07, 0.11, { at: 0.02 }),
  ], repeat: { n: 6, every: 0.42, decay: 0.93 }, jitter: 0.12, minGapMs: 2000 },
  /** 킁킁 — 배불러 냄새만 맡고 돌아앉을 때 */
  cat_sniff: { layers: [noise('bandpass', 2600, 0.06, 0.11, { q: 0.9, attack: 0.012 })], repeat: { n: 3, every: 0.11, decay: 0.85 }, jitter: 0.1, minGapMs: 1200 },
  /** 하품 — 자다 깨어 기지개 켤 때(높게 끽 올라갔다 길게 내려온다) */
  cat_yawn: { layers: [
    tone(820, 0.95, 0.045, { wave: 'sawtooth', f1: 1050, f2: 380, split: 0.25, formant: [1200, 2600, 600], fq: 1.8, attack: 0.05, hold: 0.3, vib: [4, 10] }),
    tone(820, 0.95, 0.02, { wave: 'triangle', f1: 1050, f2: 380, split: 0.25, attack: 0.05, hold: 0.3 }),
    noise('bandpass', 1600, 0.9, 0.0075, { q: 0.8, attack: 0.1, hold: 0.4 }),
  ], jitter: 0.05, minGapMs: 4000 },
} satisfies Record<string, Recipe>;

export type SfxName = keyof typeof SFX_RECIPES;

/** 컨텍스트마다 1초 흰 잡음(오프라인 렌더는 따로 만든다) */
const noiseBufs = new WeakMap<BaseAudioContext, AudioBuffer>();
function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const hit = noiseBufs.get(ctx);
  if (hit) return hit;
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBufs.set(ctx, buf);
  return buf;
}

/** 세기 봉투 — 올라가고(attack) · 버티고(hold) · 줄어든다 */
function envelope(g: GainNode, t: number, L: Layer, gain: number): void {
  const peak = Math.max(0.0002, L.peak * gain);
  const attack = L.attack ?? (L.k === 'tone' ? 0.008 : 0.01);
  const holdEnd = t + attack + Math.max(0, L.hold ?? 0);
  // ⚠ GainNode 기본값은 1이다 — 첫 자동화(t) 전까지 1로 열려 있어, 고역 잡음이 시작하는 첫 표본이 그대로 새어
  //   0.8까지 튀었다(252차 실측 — farm_weed 0.86). 처음부터 0으로 닫아 둔다.
  g.gain.value = 0;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  if (holdEnd > t + attack) g.gain.setValueAtTime(peak, holdEnd);
  g.gain.exponentialRampToValueAtTime(0.0001, Math.max(holdEnd + 0.01, t + L.dur));
}

function renderLayer(ctx: BaseAudioContext, dest: AudioNode, L: Layer, t0: number, pitch: number, gain: number): void {
  const t = t0 + (L.at ?? 0);
  const g = ctx.createGain();
  envelope(g, t, L, gain);
  if (L.k === 'tone') {
    const osc = ctx.createOscillator();
    osc.type = L.wave ?? 'triangle';
    const tSplit = t + L.dur * (L.split ?? 0.4);
    osc.frequency.setValueAtTime(L.f0 * pitch, t);
    if (L.f1 && L.f2) {
      // 253차 — 세 점 높이(올라갔다 내려온다)
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, L.f1 * pitch), tSplit);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, L.f2 * pitch), t + L.dur);
    } else if (L.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, L.f1 * pitch), t + L.dur);
    if (L.vib) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = L.vib[0];
      depth.gain.value = L.vib[1] * pitch;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + L.dur + 0.02);
    }
    let tail: AudioNode = osc;
    if (L.formant) {
      // 253차 — 입 모양 거르개: 목소리 높이와 따로, 모음이 열리고(꺾임) 닫힌다(끝)
      const [fa, fb, fc] = L.formant;
      const bq = ctx.createBiquadFilter();
      bq.type = L.ftype ?? 'bandpass';
      bq.Q.value = L.fq ?? 2.5;
      bq.frequency.setValueAtTime(fa, t);
      if (fc !== undefined) {
        bq.frequency.exponentialRampToValueAtTime(fb, tSplit);
        bq.frequency.exponentialRampToValueAtTime(fc, t + L.dur);
      } else bq.frequency.exponentialRampToValueAtTime(fb, t + L.dur);
      osc.connect(bq);
      tail = bq;
    }
    if (L.am) {
      // 253차 — 세기 떨림(굴리는 소리) — 1 - depth/2 ± depth/2
      const trem = ctx.createGain();
      trem.gain.value = 1 - L.am[1] / 2;
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = L.am[0];
      depth.gain.value = L.am[1] / 2;
      lfo.connect(depth).connect(trem.gain);
      lfo.start(t);
      lfo.stop(t + L.dur + 0.02);
      tail.connect(trem);
      tail = trem;
    }
    tail.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + L.dur + 0.02);
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const bq = ctx.createBiquadFilter();
  bq.type = L.filter;
  bq.Q.value = L.q ?? 1;
  bq.frequency.setValueAtTime(L.f0 * pitch, t);
  if (L.f1) bq.frequency.exponentialRampToValueAtTime(Math.max(30, L.f1 * pitch), t + L.dur);
  let tail: AudioNode = bq;
  if (L.am) {
    // 세기 떨림 — 1 - depth/2 ± depth/2
    const trem = ctx.createGain();
    trem.gain.value = 1 - L.am[1] / 2;
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = L.am[0];
    depth.gain.value = L.am[1] / 2;
    lfo.connect(depth).connect(trem.gain);
    lfo.start(t);
    lfo.stop(t + L.dur + 0.05);
    bq.connect(trem);
    tail = trem;
  }
  src.connect(bq);
  tail.connect(g).connect(dest);
  src.start(t, Math.random() * 0.5);
  src.stop(t + L.dur + 0.05);
}

/** 레시피 한 벌을 그린다 — 어떤 컨텍스트 · 목적지에도(실시간 버스 · 오프라인 렌더) */
export function renderSfx(ctx: BaseAudioContext, dest: AudioNode, name: SfxName, t0: number, pitch = 1, gain = 1): void {
  const r: Recipe = SFX_RECIPES[name];
  const n = r.repeat?.n ?? 1;
  for (let i = 0; i < n; i++) {
    const tt = t0 + i * (r.repeat?.every ?? 0);
    const gg = gain * Math.pow(r.repeat?.decay ?? 1, i);
    const pp = pitch * (1 + (r.repeat?.pitchStep ?? 0) * i);
    for (const L of r.layers) renderLayer(ctx, dest, L, tt, pp, gg);
  }
}

/** 레시피 길이(초) — 오프라인 렌더 버퍼 크기 */
export function sfxDuration(name: SfxName): number {
  const r: Recipe = SFX_RECIPES[name];
  const one = Math.max(...r.layers.map((L) => (L.at ?? 0) + L.dur));
  return one + ((r.repeat?.n ?? 1) - 1) * (r.repeat?.every ?? 0) + 0.1;
}

export const SFX_NAMES = Object.keys(SFX_RECIPES) as SfxName[];

const lastAt = new Map<SfxName, number>();

/**
 * 효과음 하나 — 설정 「효과음」 볼륨 버스로. 같은 소리가 너무 촘촘하면 거른다.
 * `pan`(253차) — 좌우 -1~1(소리 나는 것이 화면 어느 쪽인가 · 집 고양이).
 */
export function playSfx(name: SfxName, opts?: { pitch?: number; gain?: number; pan?: number }): void {
  const ac = audioContext();
  if (!ac) return;
  const r: Recipe = SFX_RECIPES[name];
  const now = performance.now();
  if (now - (lastAt.get(name) ?? -1e9) < (r.minGapMs ?? 35)) return;
  lastAt.set(name, now);
  noteSfx(name);
  const jit = r.jitter ?? 0.04;
  const pitch = (opts?.pitch ?? 1) * (1 + (Math.random() * 2 - 1) * jit);
  let dest: AudioNode = busOf('sfx') ?? ac.destination;
  if (opts?.pan && typeof ac.createStereoPanner === 'function') {
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, opts.pan));
    p.connect(dest);
    dest = p;
  }
  renderSfx(ac, dest, name, ac.currentTime + 0.005, pitch, opts?.gain ?? 1);
}
