/**
 * @file TitleDatabase.ts
 * @description 타이틀(칭호) 업적 30종 + 레어도별 효과 크기 + 순수 판정 함수.
 *
 * 203차 첫 묶음 12종 → **204차 재설계**(사용자 지시 2026-10-04):
 *  - **문턱**: 레어도가 높을수록 어렵게. 전설은 레벨 문턱(`minLevel`)까지 — 저레벨 전설 획득 금지
 *    (구 「대물 사냥꾼」 60cm 10마리는 초반에 끝났다).
 *  - **네이밍**: 조건을 그대로 읽는 이름 대신 낚시꾼의 말맛으로(「들어뽕 조사」 · 「오로시 장인」 · 「6짜 수집가」 · 「꽝 조사」).
 *  - **완화는 숫자만 깎지 않는다**:
 *    ① 시간대 겹침 — 밤(20~04)과 새벽(02~06)이 02~04시에 겹쳐 한 번의 새벽 출조가 두 타이틀을 함께 채운다.
 *    ② 가중 점수 — 대물은 60cm대 1 · 70cm대 3 · 80cm↑ 6점. 큰 놈 한 마리가 잔챙이 여럿보다 값지다.
 *    ③ 대체 경로 — 「6짜 수집가」 · 「오로시 장인」은 다른 플레이 조합으로도 닿는다(`paths`).
 *    ④ 공유 누적 — 한 마리가 밤 · 물때 · 날씨 · 구멍치기 타이틀에 동시에 쌓인다.
 *  - **물때**: 초들물 · 중들물/중날물 · 끝날물 · 물돌이 · 사리 · 조금 + 8단계 모두(204차 물때 흐름 단계와 같은 판정).
 *
 * 수치는 실플레이를 보고 조정한다(목표만 바꾸면 된다 — 이미 얻은 타이틀은 지켜진다).
 */

import type { TideFlowPhase } from '../types/TideFlow.js';
import type {
  TitleDef, TitleEffectKind, TitleModifiers, TitleRarity, TitleReq, TitleStats,
} from '../types/Titles.js';
import { TIDE_FLOW_LABEL_KO } from '../simulation/TideFlowPhase.js';

const r = (stat: TitleReq['stat'], goal: number): TitleReq => ({ stat, goal });

export const TITLE_DATABASE: TitleDef[] = [
  // ───────── 203차 12종(204차 문턱·이름 재조정 — id는 그대로) ─────────
  {
    id: 'savior', nameKo: '구원자', nameEn: 'Savior', rarity: 'rare', paths: [[r('release', 200)]], effect: 'biteRate',
    storyKo: '놓아준 고기가 이백 마리를 넘었다. 바다가 기억해 줄지도 모른다.',
    storyEn: 'I have let more than two hundred fish go. Maybe the sea will remember.',
  },
  {
    id: 'night_sea', nameKo: '야간 전문 조사', nameEn: 'Night Shift Angler', rarity: 'rare', paths: [[r('nightCatch', 200)]], effect: 'nightBite',
    storyKo: '해 지고 나서 건져 올린 고기가 이백 마리다. 이제 어둠 속 초릿대가 더 잘 보인다.',
    storyEn: 'Two hundred fish landed after dark. I read my rod tip better at night now.',
  },
  {
    id: 'dawn_line', nameKo: '새벽 첫 줄', nameEn: 'First Line at Dawn', rarity: 'rare', paths: [[r('dawnCast', 300)]], effect: 'dawnBite',
    storyKo: '동트기 전 바다에 던진 채비가 삼백 번을 넘었다. 새벽 공기가 몸에 붙었다.',
    storyEn: 'Three hundred casts before sunrise. The dawn air has settled into my bones.',
  },
  {
    id: 'trophy', nameKo: '6짜 수집가', nameEn: 'Sixty-Plus Collector', rarity: 'legend', minLevel: 60,
    paths: [[r('trophyPts', 60)], [r('trophyPts', 30), r('slackBigCatch', 40)]], effect: 'lineStrength',
    storyKo: '육십 넘는 놈들이 줄줄이 손을 거쳐 갔다. 이제는 무게가 먼저 말을 건다.',
    storyEn: 'Fish over sixty centimeters have passed through my hands one after another. Now the weight speaks first.',
  },
  {
    id: 'landing_ache', nameKo: '들어뽕 조사', nameEn: 'The Yank-Up Angler', rarity: 'common', paths: [[r('landingDrop', 15)]], effect: 'landingDropCut',
    storyKo: '뜰채 없이 들어 올리다 놓친 게 열다섯 번이다. 그래도 들어뽕이 손맛이다.',
    storyEn: 'Fifteen fish lost yanking them up without a net. Still, the yank is half the fun.',
  },
  {
    id: 'line_breaker', nameKo: '원줄 기부왕', nameEn: 'Line Donor to the Sea', rarity: 'common', paths: [[r('lineBreak', 30)]], effect: 'lineStrength',
    storyKo: '바다에 기부한 원줄이 서른 가닥이다. 용왕님도 내 이름은 아실 거다.',
    storyEn: 'Thirty lines donated to the sea. The Dragon King must know my name by now.',
  },
  {
    id: 'empty_cooler', nameKo: '꽝 조사', nameEn: 'Skunked Again', rarity: 'common', paths: [[r('emptyTrip', 10)]], effect: 'buyDiscount',
    storyKo: '빈 쿨러로 돌아온 날이 열 번이다. 가게 주인이 말없이 미끼를 하나 더 얹어 준다.',
    storyEn: 'Ten trips home with an empty cooler. The shopkeeper quietly throws in an extra pack of bait.',
  },
  {
    id: 'regular', nameKo: '외상 되는 손님', nameEn: 'Good for Credit', rarity: 'rare', paths: [[r('shopRegular', 150)]], effect: 'buyDiscount',
    storyKo: '한 가게에서 백오십 번을 사고팔았다. 이제 지갑을 놓고 와도 웃으며 보내 준다.',
    storyEn: 'A hundred and fifty deals at the same shop. Now they smile and wave me off even when I forget my wallet.',
  },
  {
    id: 'knife_master', nameKo: '오로시 장인', nameEn: 'Oroshi Master', rarity: 'rare',
    paths: [[r('sashimiFiveStar', 25)], [r('sashimiFiveStar', 15), r('butcherDone', 150)]], effect: 'sellPrice',
    storyKo: '세 장 뜨기가 손에 붙었다. 칼이 뼈를 타고 저절로 흐른다.',
    storyEn: 'Three-piece filleting has become second nature. The blade glides along the bone on its own.',
  },
  {
    id: 'cat_butler', nameKo: '고양이 집사', nameEn: 'Cat Butler', rarity: 'common', paths: [[r('catPet', 100)]], effect: 'biteRate',
    storyKo: '고양이를 백 번 쓰다듬었다. 집을 나설 때마다 행운을 빌어 주는 것 같다.',
    storyEn: 'A hundred pats for the cat. It seems to wish me luck every time I leave.',
  },
  {
    id: 'night_owl', nameKo: '헛걸음 조사', nameEn: 'Wasted Trips', rarity: 'common', paths: [[r('closedDoor', 10)]], effect: 'fatigueCut',
    storyKo: '셔터 내린 가게 앞에서 열 번을 돌아섰다. 이제 헛걸음에도 다리가 덜 아프다.',
    storyEn: 'Ten times I turned back at a shuttered shop. My legs hardly mind the wasted walk anymore.',
  },
  {
    id: 'sea_atlas', nameKo: '걸어 다니는 도감', nameEn: 'Walking Field Guide', rarity: 'legend', minLevel: 50,
    paths: [[r('speciesFound', 45)]], effect: 'sellPrice',
    storyKo: '마흔다섯 가지 바다 생물을 직접 보고 기록했다. 고기를 보면 값이 먼저 보인다.',
    storyEn: 'Forty-five kinds of sea life seen and logged with my own eyes. I can tell a catch’s worth at a glance.',
  },

  // ───────── 204차 물때 ─────────
  {
    id: 'tide_flood_early', nameKo: '초들물 출근 도장', nameEn: 'Clocked In at First Flood', rarity: 'rare',
    paths: [[r('floodEarlyCatch', 80)]], effect: 'phaseBite', effectPhases: ['flood_early'],
    storyKo: '물이 다시 들기 시작하면 몸이 먼저 갯바위로 간다. 초들물에만 여든 마리를 올렸다.',
    storyEn: 'When the water turns to flood again, my body heads to the rocks first. Eighty fish in the first flood alone.',
  },
  {
    id: 'tide_slack', nameKo: '물돌이 잠복꾼', nameEn: 'Slack-Water Stalker', rarity: 'rare',
    paths: [[r('slackBigCatch', 20)]], effect: 'phaseBite', effectPhases: ['slack_high', 'slack_low'],
    storyKo: '물이 멈추면 잔챙이가 조용해지고 큰 놈이 나온다. 그 순간만 기다리는 법을 배웠다.',
    storyEn: 'When the water stops, the small fry go quiet and the big ones come out. I have learned to wait for that moment.',
  },
  {
    id: 'tide_rush', nameKo: '본류대 체질', nameEn: 'Built for the Rip', rarity: 'common',
    paths: [[r('midFlowCatch', 60)]], effect: 'phaseBite', effectPhases: ['flood_mid', 'ebb_mid'],
    storyKo: '물살이 콸콸 흐를 때 오히려 마음이 편하다. 거센 물에서 예순 마리를 건졌다.',
    storyEn: 'I feel most at ease when the current is roaring. Sixty fish pulled from the rushing water.',
  },
  {
    id: 'tide_scraps', nameKo: '끝물 이삭줍기', nameEn: 'Gleaning the Last Ebb', rarity: 'common',
    paths: [[r('ebbLateCatch', 25)]], effect: 'phaseBite', effectPhases: ['ebb_late'],
    storyKo: '다들 짐을 쌀 때 한 번 더 던졌다. 끝날물에도 고기는 있었다.',
    storyEn: 'While everyone else packed up, I cast one more time. There were fish in the last of the ebb too.',
  },
  {
    id: 'tide_almanac', nameKo: '물때표 인간', nameEn: 'Living Tide Table', rarity: 'legend', minLevel: 40,
    paths: [[r('phasesCovered', 8), r('speciesFound', 20)]], effect: 'biteRate',
    storyKo: '초들물부터 간조 물돌이까지, 여덟 물때를 모두 몸으로 겪었다. 이제 시계 대신 물을 본다.',
    storyEn: 'From the first flood to low-water slack, I have fished every one of the eight tides. I read the water instead of the clock now.',
  },
  {
    id: 'spring_tide', nameKo: '사리 물때 꾼', nameEn: 'Spring-Tide Regular', rarity: 'common',
    paths: [[r('springCatch', 80)]], effect: 'lineStrength',
    storyKo: '물이 가장 세게 흐르는 사리에만 여든 마리다. 센 물에는 센 줄이 답이다.',
    storyEn: 'Eighty fish on spring tides alone, when the water runs hardest. Strong water calls for strong line.',
  },
  {
    id: 'neap_tide', nameKo: '조금도 간다', nameEn: 'Even on Neaps', rarity: 'common',
    paths: [[r('neapCatch', 40)]], effect: 'biteRate',
    storyKo: '물이 죽은 조금에도 나갔다. 조금이라도 잡히면 그걸로 됐다.',
    storyEn: 'I went out even on neap tides when the water barely moves. A little is still something.',
  },

  // ───────── 204차 그 밖의 플레이 ─────────
  {
    id: 'rain_angler', nameKo: '비 오는 날 출조병', nameEn: 'Rain Fever', rarity: 'common',
    paths: [[r('foulCatch', 40)]], effect: 'foulBite',
    storyKo: '비 소리만 들려도 채비를 챙긴다. 젖은 소매로 마흔 마리를 올렸다.',
    storyEn: 'The sound of rain alone makes me reach for my tackle. Forty fish landed in soaked sleeves.',
  },
  {
    id: 'ttp_fairy', nameKo: '삼발이 요정', nameEn: 'Tetrapod Sprite', rarity: 'common',
    paths: [[r('holeCatch', 40)]], effect: 'landingDropCut',
    storyKo: '테트라포드 틈을 마흔 번 털었다. 블록 위를 걷는 발이 가벼워졌다.',
    storyEn: 'Forty fish pulled from the gaps between tetrapods. My feet feel light on the blocks now.',
  },
  {
    id: 'double_hook', nameKo: '쌍걸이 복권', nameEn: 'Double-Header Jackpot', rarity: 'rare',
    paths: [[r('doubleHook', 15)]], effect: 'biteRate',
    storyKo: '한 번에 두 마리가 올라온 게 열다섯 번이다. 운도 실력이라 믿기로 했다.',
    storyEn: 'Fifteen times two fish came up at once. I have decided luck counts as skill.',
  },
  {
    id: 'low_tide_commuter', nameKo: '물 빠지면 출근', nameEn: 'Low-Tide Commuter', rarity: 'common',
    paths: [[r('forage', 200)]], effect: 'fatigueCut',
    storyKo: '물이 빠질 때마다 갯바위를 뒤졌다. 이백 번 허리를 굽히니 허리가 알아서 굽는다.',
    storyEn: 'Every low tide I combed the rocks. After two hundred bends, my back bends on its own.',
  },
  {
    id: 'trap_chief', nameKo: '통발 이장님', nameEn: 'Pot Village Chief', rarity: 'common',
    paths: [[r('trapHarvest', 60)]], effect: 'sellPrice',
    storyKo: '통발을 예순 번 걷어 올렸다. 동네 통발 사정은 내가 제일 잘 안다.',
    storyEn: 'Sixty pots hauled up. Nobody knows this neighborhood’s pots better than I do.',
  },
  {
    id: 'fire_taste', nameKo: '불맛 조사', nameEn: 'Fire-Kissed Angler', rarity: 'common',
    paths: [[r('cookDone', 40)]], effect: 'fatigueCut',
    storyKo: '잡은 고기로 끓이고 구운 게 마흔 그릇이다. 따뜻한 한 그릇이면 다음 날도 버틴다.',
    storyEn: 'Forty bowls cooked from my own catch. One warm bowl keeps me going the next day.',
  },
  {
    id: 'cutting_board', nameKo: '도마 위의 30년', nameEn: 'Thirty Years at the Board', rarity: 'rare',
    paths: [[r('butcherDone', 300)]], effect: 'sellPrice',
    storyKo: '삼백 마리를 도마에 올렸다. 손질만 보고도 사람들이 값을 더 쳐 준다.',
    storyEn: 'Three hundred fish across my cutting board. People pay more just from seeing my work.',
  },
  {
    id: 'auction_bigshot', nameKo: '위판장 큰손', nameEn: 'Big Hand at the Auction', rarity: 'rare',
    paths: [[r('auctionSold', 60)]], effect: 'sellPrice',
    storyKo: '위판장에서 예순 번 낙찰을 받았다. 중매인들이 내 상자부터 들여다본다.',
    storyEn: 'Sixty lots sold at the fish auction. The brokers check my crates first now.',
  },
  {
    id: 'burnout', nameKo: '몸 갈아 넣는 조사', nameEn: 'Running on Empty', rarity: 'common',
    paths: [[r('faint', 5)]], effect: 'fatigueCut',
    storyKo: '낚시하다 다섯 번이나 쓰러졌다. 몸이 알아서 힘을 아끼기 시작했다.',
    storyEn: 'Five times I collapsed mid-trip. My body has started saving its strength on its own.',
  },
  {
    id: 'license_collector', nameKo: '자격증 부자', nameEn: 'License Hoarder', rarity: 'rare',
    paths: [[r('licenses', 8)]], effect: 'buyDiscount',
    storyKo: '지갑이 자격증으로 두툼해졌다. 어딜 가도 서류 걱정은 없다.',
    storyEn: 'My wallet is thick with licenses. No paperwork worries wherever I go.',
  },
  {
    id: 'sea_raised', nameKo: '바다가 키운 사람', nameEn: 'Raised by the Sea', rarity: 'legend', minLevel: 100,
    paths: [[r('titlesOwned', 20)]], effect: 'biteRate',
    storyKo: '돌아보니 바다에서 얻은 이름이 스무 개다. 이 바다가 나를 키웠다.',
    storyEn: 'Looking back, the sea has given me twenty names. This sea raised me.',
  },
];

/** 효과 크기 — [흔함, 드묾, 전설]. 비율형(바늘 빠짐·피로)은 확률/양 자체를 그 비율만큼 줄인다 */
export const TITLE_EFFECT_SCALE: Record<TitleEffectKind, [number, number, number]> = {
  biteRate: [0.01, 0.02, 0.03],
  nightBite: [0.01, 0.02, 0.03],
  dawnBite: [0.01, 0.02, 0.03],
  // 특정 단계만 듣는 효과는 시간이 짧은 만큼 조금 더 크게
  phaseBite: [0.02, 0.04, 0.06],
  foulBite: [0.02, 0.04, 0.06],
  lineStrength: [0.01, 0.02, 0.03],
  landingDropCut: [0.10, 0.20, 0.30],
  sellPrice: [0.01, 0.02, 0.03],
  buyDiscount: [0.01, 0.02, 0.03],
  fatigueCut: [0.03, 0.06, 0.09],
};

const RARITY_INDEX: Record<TitleRarity, 0 | 1 | 2> = { common: 0, rare: 1, legend: 2 };

/** 레어도 이름(UI) */
export const TITLE_RARITY_LABEL_KO: Record<TitleRarity, string> = { common: '흔함', rare: '드묾', legend: '전설' };

export function getTitleById(id: string | null | undefined): TitleDef | null {
  if (!id) return null;
  return TITLE_DATABASE.find((t) => t.id === id) ?? null;
}

/** 이 타이틀 효과의 크기(0.02 = 2%) */
export function titleEffectValue(def: TitleDef): number {
  return TITLE_EFFECT_SCALE[def.effect][RARITY_INDEX[def.rarity]];
}

/** 효과 한 줄(UI) — 「입질 +2%」 · 「밤(20~04시) 입질 +2%」 · 「초들물 입질 +4%」 … */
export function titleEffectLabelKo(def: TitleDef): string {
  const p = Math.round(titleEffectValue(def) * 100);
  switch (def.effect) {
    case 'biteRate': return `입질 +${p}%`;
    case 'nightBite': return `밤(20~04시) 입질 +${p}%`;
    case 'dawnBite': return `새벽(02~06시) 입질 +${p}%`;
    case 'phaseBite': return `${(def.effectPhases ?? []).map((ph) => TIDE_FLOW_LABEL_KO[ph]).join('·')} 입질 +${p}%`;
    case 'foulBite': return `비·눈 오는 날 입질 +${p}%`;
    case 'lineStrength': return `줄 강도 +${p}%`;
    case 'landingDropCut': return `랜딩 바늘 빠짐 -${p}%`;
    case 'sellPrice': return `상점 판매가 +${p}%`;
    case 'buyDiscount': return `상점 구매가 -${p}%`;
    case 'fatigueCut': return `행동 피로 -${p}%`;
  }
}

/** 단 타이틀의 배율 묶음 — 없으면 전부 1 */
export function titleModifiers(def: TitleDef | null): TitleModifiers {
  const m: TitleModifiers = {
    biteMult: 1, nightBiteMult: 1, dawnBiteMult: 1, phaseBiteMult: 1, phases: [], foulBiteMult: 1,
    lineMult: 1, landingDropMult: 1, sellMult: 1, buyMult: 1, fatigueMult: 1,
  };
  if (!def) return m;
  const v = titleEffectValue(def);
  switch (def.effect) {
    case 'biteRate': m.biteMult = 1 + v; break;
    case 'nightBite': m.nightBiteMult = 1 + v; break;
    case 'dawnBite': m.dawnBiteMult = 1 + v; break;
    case 'phaseBite': m.phaseBiteMult = 1 + v; m.phases = [...(def.effectPhases ?? [])]; break;
    case 'foulBite': m.foulBiteMult = 1 + v; break;
    case 'lineStrength': m.lineMult = 1 + v; break;
    case 'landingDropCut': m.landingDropMult = 1 - v; break;
    case 'sellPrice': m.sellMult = 1 + v; break;
    case 'buyDiscount': m.buyMult = 1 - v; break;
    case 'fatigueCut': m.fatigueMult = 1 - v; break;
  }
  return m;
}

/** 밤 시간(20:00~03:59 KST) — 204차 22시 → 20시로 넓힘 */
export function isTitleNightHour(hour: number): boolean { return hour >= 20 || hour < 4; }
/** 새벽(02:00~05:59 KST) — 캐스팅 세기 · 새벽 입질 효과 공용(밤과 02~04시 겹침) */
export function isTitleDawnHour(hour: number): boolean { return hour >= 2 && hour < 6; }

/** 대물 점수 — 60cm대 1 · 70cm대 3 · 80cm 이상 6 · 60cm 미만 0 */
export function trophyPointsOf(lengthCm: number): number {
  if (lengthCm >= 80) return 6;
  if (lengthCm >= 70) return 3;
  if (lengthCm >= 60) return 1;
  return 0;
}

/** 이 시각·물때·날씨의 입질 배율 — 단 타이틀 효과만 */
export function titleBiteMultAt(
  m: TitleModifiers, hour: number, phase?: TideFlowPhase | null, foulWeather = false,
): number {
  return m.biteMult
    * (isTitleNightHour(hour) ? m.nightBiteMult : 1)
    * (isTitleDawnHour(hour) ? m.dawnBiteMult : 1)
    * (phase && m.phases.includes(phase) ? m.phaseBiteMult : 1)
    * (foulWeather ? m.foulBiteMult : 1);
}

/** 경로 하나가 채워졌는가 */
function pathMet(path: TitleReq[], stats: TitleStats): boolean {
  return path.every((q) => (stats[q.stat] ?? 0) >= q.goal);
}

/** 이 타이틀의 조건(레벨 문턱 포함)을 지금 채웠는가 */
export function titleConditionMet(def: TitleDef, stats: TitleStats, level: number): boolean {
  if ((def.minLevel ?? 0) > level) return false;
  return def.paths.some((p) => pathMet(p, stats));
}

/** 지금 누적 수·레벨로 새로 얻는 타이틀(이미 가진 것은 빼고) */
export function titlesNewlyEarned(stats: TitleStats, owned: ReadonlySet<string>, level = 1): TitleDef[] {
  return TITLE_DATABASE.filter((t) => !owned.has(t.id) && titleConditionMet(t, stats, level));
}

/** 위키·도움말용 — 조건 한 줄(사람 말) */
export const TITLE_STAT_LABEL_KO: Record<TitleReq['stat'], string> = {
  release: '놓아준 고기', nightCatch: '밤(20~04시) 어획', dawnCast: '새벽(02~06시) 캐스팅',
  trophyPts: '대물 점수(60cm대 1·70cm대 3·80cm↑ 6)', landingDrop: '랜딩 중 바늘 빠짐', lineBreak: '줄 터짐',
  emptyTrip: '빈손 출조', shopRegular: '한 가게 거래', sashimiFiveStar: '별 다섯 사시미', catPet: '고양이 쓰다듬기',
  closedDoor: '문 닫은 가게 앞', speciesFound: '도감 생물 수', floodEarlyCatch: '초들물 어획',
  slackBigCatch: '물돌이 50cm↑ 어획', midFlowCatch: '중들물·중날물 어획', ebbLateCatch: '끝날물 어획',
  phasesCovered: '10마리 이상 잡아 본 물때 단계 수', springCatch: '사리(6~9물) 어획', neapCatch: '조금(12~15물) 어획',
  foulCatch: '비·눈 오는 날 어획', holeCatch: '구멍치기 어획', doubleHook: '쌍걸이', forage: '채집 성공',
  trapHarvest: '통발 수거', cookDone: '불요리 완성', butcherDone: '원물 손질', auctionSold: '위판 낙찰',
  faint: '쓰러짐', licenses: '가진 자격 수', titlesOwned: '얻은 타이틀 수',
};

/** 사람이 읽는 조건 — 「놓아준 고기 200」 · 경로가 여럿이면 「또는」 */
export function titleConditionLabelKo(def: TitleDef): string {
  const paths = def.paths.map((p) => p.map((q) => `${TITLE_STAT_LABEL_KO[q.stat]} ${q.goal}`).join(' + ')).join(' 또는 ');
  return def.minLevel ? `${paths} (Lv.${def.minLevel} 이상)` : paths;
}

/** 무결성 — id 중복 · 경로 없음 */
{
  const seen = new Set<string>();
  for (const t of TITLE_DATABASE) {
    if (seen.has(t.id)) console.warn(`[TitleDatabase] 중복 id ${t.id}`);
    seen.add(t.id);
    if (t.paths.length === 0 || t.paths.some((p) => p.length === 0)) console.warn(`[TitleDatabase] ${t.id} 빈 경로`);
    if (t.effect === 'phaseBite' && !(t.effectPhases?.length)) console.warn(`[TitleDatabase] ${t.id} phaseBite인데 단계 없음`);
  }
}
