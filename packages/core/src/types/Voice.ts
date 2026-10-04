/**
 * @file Voice.ts
 * @description 대사 목소리 (211차 — 사용자 지시 「동물의 숲처럼 대사 사운드」).
 *
 * 실제 음성 녹음이 아니라, 글자가 찍힐 때마다 짧은 음(블립)을 낸다.
 * 인물마다 **기준 음높이 · 파형 · 말 빠르기**가 다르고, 글자의 모음이 음정을 조금씩 바꿔
 * 같은 사람이라도 문장마다 억양이 생긴다. 렌더(오디오 출력)는 client가 맡는다.
 */

/** 블립 파형 — 남성 · 노인은 각진 소리, 여성 · 아이는 둥근 소리 */
export type VoiceWave = 'square' | 'triangle' | 'sine' | 'sawtooth';

/** 한 인물의 목소리 */
export interface VoiceProfile {
  /** 기준 음높이(Hz) */
  baseHz: number;
  wave: VoiceWave;
  /** 블립 사이 최소 간격(ms) — 클수록 느릿하게 말한다 */
  gapMs: number;
  /** 블립 길이(ms) */
  blipMs: number;
  /** 모음 음정 폭(반음 배율) — 클수록 억양이 크다 */
  inflection: number;
}
