/**
 * @file CharacterVoice.ts
 * @description 인물 목소리 결정 + 글자별 음정 (211차).
 *
 * - 인물 표(`CAST_TRAITS` — 성별 · 나이)에서 기준 음높이를 정하고, id 해시로 ±8% 개인차를 준다
 *   (외형과 같은 규칙 — 결정적이라 세이브에 저장하지 않는다).
 * - 글자 음정은 **모음**이 정한다: 한글은 중성(ㅏ·ㅓ·ㅗ·ㅜ·ㅡ·ㅣ…), 영문은 a·e·i·o·u.
 *   ㅣ·ㅔ는 높게, ㅜ·ㅗ·ㅡ는 낮게 — 「안녕하세요」가 오르내리는 소리가 된다.
 * - 공백 · 문장부호는 소리를 내지 않는다(쉼). 순수 TS — 오디오 출력은 client `audio/Voice.ts`.
 */

import type { CharSex } from './CharacterArt.js';
import { CAST_TRAITS, type CharAge } from './CharacterCast.js';
import type { VoiceProfile } from '../types/Voice.js';

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

/** 성별 · 나이별 기준 음높이(Hz) */
const BASE_HZ: Record<CharSex, Record<CharAge, number>> = {
  m: { child: 300, teen: 200, young: 150, mid: 132, elder: 118 },
  f: { child: 340, teen: 300, young: 265, mid: 240, elder: 215 },
};

/** 나이별 말 빠르기(블립 간격 ms) — 노인은 느릿하게, 아이는 재잘재잘 */
const GAP_MS: Record<CharAge, number> = { child: 48, teen: 54, young: 58, mid: 64, elder: 76 };

/** 성별 · 나이로 목소리를 만든다. `seed`가 같으면 같은 목소리 */
export function voiceFor(sex: CharSex, age: CharAge, seed: string): VoiceProfile {
  const h = hash32(seed);
  const jitter = 0.92 + ((h >>> 3) % 1000) / 1000 * 0.16;   // ±8%
  const roundish = sex === 'f' || age === 'child';
  return {
    baseHz: Math.round(BASE_HZ[sex][age] * jitter),
    wave: roundish ? ((h >>> 11) & 1 ? 'triangle' : 'sine') : ((h >>> 11) & 1 ? 'square' : 'sawtooth'),
    gapMs: GAP_MS[age] + ((h >>> 17) % 9) - 4,
    blipMs: age === 'elder' ? 46 : 38,
    inflection: age === 'elder' ? 0.7 : age === 'child' ? 1.3 : 1,
  };
}

/** 스토리 인물 id → 목소리. 표에 없는 사람(일반 NPC 등)은 id 해시로 성별 · 나이를 고른다 */
export function voiceOfNpc(npcId: string): VoiceProfile {
  const t = CAST_TRAITS[npcId];
  if (t) return voiceFor(t.sex, t.age, npcId);
  const h = hash32(npcId);
  const ages: CharAge[] = ['young', 'mid', 'teen', 'elder'];
  return voiceFor((h >>> 1) & 1 ? 'f' : 'm', ages[(h >>> 5) % 4], npcId);
}

/** 주인공 목소리 — 캐릭터 생성에서 고른 성별, 20대 */
export function voiceOfPlayer(sex: CharSex): VoiceProfile {
  return voiceFor(sex, 'young', `player_${sex}`);
}

/** 안내(가이드 말풍선) 목소리 — 높낮이가 작은 부드러운 소리 */
export const GUIDE_VOICE: VoiceProfile = { baseHz: 420, wave: 'sine', gapMs: 62, blipMs: 30, inflection: 0.5 };

/** 한글 중성 21자 → 반음 오프셋(ㅏ ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅘ ㅙ ㅚ ㅛ ㅜ ㅝ ㅞ ㅟ ㅠ ㅡ ㅢ ㅣ) */
const JUNG_SEMI = [0, 3, 1, 3, -2, 4, -1, 4, -4, -2, 1, 2, -3, -6, -4, 2, 3, -5, -5, 1, 6];
const LATIN_SEMI: Record<string, number> = { a: 0, e: 4, i: 6, o: -4, u: -6, y: 3 };

/**
 * 이 글자가 소리를 내나 · 내면 기준음 대비 반음 몇 개 위/아래인가.
 * 공백 · 문장부호 · 숫자 기호는 null(쉼). 자음뿐인 영문 글자는 앞뒤 모음 없이 작은 오프셋.
 */
export function voiceSemitone(ch: string): number | null {
  const c = ch.charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) return JUNG_SEMI[Math.floor(((c - 0xac00) % 588) / 28)] ?? 0;
  if (c >= 0x3131 && c <= 0x318e) return 0;          // 낱자(ㅋㅋ · ㅎ)
  const l = ch.toLowerCase();
  if (l >= 'a' && l <= 'z') return LATIN_SEMI[l] ?? ((c % 5) - 2);
  if (l >= '0' && l <= '9') return (c % 4) - 1;
  return null;
}
