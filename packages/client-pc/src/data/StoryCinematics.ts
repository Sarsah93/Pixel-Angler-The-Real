/**
 * @file StoryCinematics.ts
 * @description 컷씬 각본 (165차 신설)
 *
 * 각본은 **배우 키**(`player` · NPC id)와 스텝만 갖는다. 실제 배우를 어디서
 * 데려올지는 씬이 정하므로, 같은 각본을 다른 지역에서 재생해도 그대로 돈다.
 *
 * ⚠ 대사는 플레이어가 읽는 말이다 — 내부 id·구조 명칭을 쓰지 않는다(AGENTS §8-9).
 */

import type { CineScript } from '../ui/StoryCinematicPanel.js';

/** M1-01 ① 영금정 도착 — 기억을 더듬는 혼잣말 */
export const CINE_M1_YEONGGEUMJEONG: CineScript = {
  id: 'm1-yeonggeumjeong',
  placeKo: '속초 영금정',
  placeEn: 'Yeonggeumjeong, Sokcho',
  steps: [
    { kind: 'focus', who: 'player', ms: 520 },
    { kind: 'face', who: 'player', dir: 'down' },
    { kind: 'say', who: 'player', thought: true, text: '예전에 부모님과 수산시장 같은 곳이 주차장 근처에 있었던 것 같은데…', textEn: 'There used to be a fish market near the parking lot… I came here with my parents.' },
    { kind: 'emote', who: 'player', emote: 'think', ms: 800 },
    { kind: 'face', who: 'player', dir: 'right' },
    { kind: 'say', who: 'player', thought: true, text: '영금정에서 보이는 방파제 쪽이었던 것 같아. 동명항 방파제 쪽으로 이동해볼까?', textEn: 'It was toward the breakwater you can see from Yeonggeumjeong. Should I head to the Dongmyeong breakwater?' },
  ],
};

/** M1-01 ② 정옥선 좌판 근처 — 할머니가 계속 지켜보고 있었다 */
export const CINE_M1_OKSEON_STALL: CineScript = {
  id: 'm1-okseon-stall',
  placeKo: '동명항 방파제 · 좌판 거리',
  placeEn: 'Dongmyeong Harbour breakwater · stall row',
  steps: [
    { kind: 'focus', who: 'player', ms: 520 },
    { kind: 'face', who: 'player', dir: 'up' },
    { kind: 'say', who: 'player', thought: true, text: '아, 여기였지 참. 많이 바뀌긴 했구나.', textEn: 'Ah, this was the place. It has changed a lot.' },
    { kind: 'move', who: 'player', dxTiles: 1, dyTiles: -1, ms: 760 },
    { kind: 'say', who: 'player', thought: true, text: '기억이 새록새록 나네… 눈물이 나올 것만 같다.', textEn: 'The memories keep coming back… I feel like I could cry.' },
    { kind: 'emote', who: 'player', emote: 'sad', ms: 900 },
    { kind: 'say', who: 'player', thought: true, text: '앞으로 어떻게 해야 할까…?', textEn: 'What should I do from here…?' },
    // 할머니가 먼저 플레이어를 향한다 — 대사보다 그림이 먼저 알려준다
    { kind: 'focus', who: 'okseon', ms: 560 },
    { kind: 'face', who: 'okseon', dir: 'down' },
    { kind: 'emote', who: 'okseon', emote: 'surprise', ms: 700 },
    { kind: 'focus', who: 'player', ms: 480 },
    { kind: 'say', who: 'player', thought: true, text: '…음? 할머니가 날 계속 쳐다보고 계셨네…', textEn: '…Hm? That grandmother has been watching me the whole time…' },
    { kind: 'say', who: 'okseon', text: '...' },
    { kind: 'say', who: 'player', thought: true, text: '할머니께 고민 상담을 해볼까?', textEn: 'Should I ask her for advice?' },
  ],
};

/** M1-02 — 얼음 상자를 지정 위치에 내려놓는 순간 */
export const CINE_M1_ICE_DROP: CineScript = {
  id: 'm1-ice-drop',
  placeKo: '동명항 경매장 · 얼음 하역 위치',
  placeEn: 'Dongmyeong auction hall · ice unloading spot',
  steps: [
    { kind: 'focus', who: 'player', ms: 460 },
    { kind: 'face', who: 'player', dir: 'down' },
    { kind: 'say', who: 'player', thought: true, text: '여기다. 하역대 바로 옆… 바닥이 젖어 있으니 미끄러지지 않게.', textEn: 'Here. Right beside the unloading dock… the floor is wet, so careful not to slip.' },
    { kind: 'emote', who: 'player', emote: 'joy', ms: 700 },
    { kind: 'say', who: 'coop', text: '어, 만복상회 얼음이네. 거기 놓고 가면 돼. 수고했어요.', textEn: 'Oh, Manbok Store ice. You can leave it right there. Thanks for the work.' },
    { kind: 'say', who: 'player', thought: true, text: '이제 할머니께 돌아가서 다 옮겼다고 말씀드리자.', textEn: 'Now back to Grandma to tell her it is all moved.' },
  ],
};

/**
 * N18-6 ① 도매시장 후문 — 인계 장면 목격 (167차 — 사용자 각본 그대로)
 *
 * 무대(속초 동명항 경매장 뒤): 수상한 사람 1은 경매장 동쪽 벽(592,154)에 숨어 있다가 [F]로 말을 걸면
 * 곧바로 이 장면이 시작된다. 플레이어는 경매장 북쪽 벽(588,152)에 붙어 숨고, 2는 동쪽(601,154)에서 걸어온다.
 * 두 사람은 마주 서서 말풍선 `...`을 좌우로 교차하며(아래 대사창 순서대로) 말하고, 2가 수정한 명부를
 * 건넨 뒤 오른쪽으로 사라진다. 1은 플레이어 쪽으로 걸어오다 숨은 나를 못 보고 지나간다.
 */
export const CINE_N186_WATCH: CineScript = {
  id: 'n18-6-watch',
  placeKo: '도매시장 후문',
  placeEn: 'Wholesale market back gate',
  steps: [
    { kind: 'focus', who: 'player', ms: 480 },
    { kind: 'say', who: 'player', thought: true, text: '(시장 뒤에 누가 서 있다. 저 사람… 뭘 기다리는 거지? 벽에 붙어서 좀 보자.)', textEn: '(Someone is standing behind the market. What is he waiting for? Let me get behind the wall and watch.)' },
    { kind: 'moveTo', who: 'player', tx: 588, ty: 152, face: 'right' },
    { kind: 'fade', who: 'player', alpha: 0.55, ms: 280 },
    { kind: 'focus', who: 's1', ms: 560 },
    { kind: 'face', who: 's1', dir: 'right' },
    { kind: 'fade', who: 's2', alpha: 1, ms: 320 },
    { kind: 'moveTo', who: 's2', tx: 594, ty: 154, face: 'left' },
    { kind: 'moveTo', who: 's1', tx: 593, ty: 154, face: 'right' },
    { kind: 'say', who: 's1', bubble: '...', text: '...! 왔구만 그래.', textEn: '...! So you came.' },
    { kind: 'say', who: 's2', bubble: '...', text: '아무도 없는 게 맞겠지?', textEn: 'Nobody around, right?' },
    { kind: 'say', who: 's1', bubble: '...', text: '우리가 하루 이틀 해온 것도 아니고, 돈은 어디있어? 저번부터 많이 까먹던데? 오늘은 확실하지?', textEn: 'We have done this plenty of times. Where is the money? You have been coming up short lately. It is certain today?' },
    { kind: 'say', who: 's2', bubble: '...', text: '돈은 처리된 것까지 확인하고 그 장소에서 전달한다. 저번과 같은 금액이야. 서두르지마.', textEn: 'The money comes once I confirm it is handled, at the place. Same amount as last time. Do not rush.' },
    { kind: 'give', from: 's2', to: 's1', item: 'book', ms: 1000 },
    { kind: 'say', who: 's2', bubble: '...', text: '곧 그 장소에서 만나지. 마무리 잘 하시게.', textEn: 'See you at the place soon. Finish it cleanly.' },
    { kind: 'say', who: 's1', bubble: '...', text: '...', textEn: '...', ms: 1200 },
    { kind: 'moveTo', who: 's2', tx: 601, ty: 154, face: 'right' },
    { kind: 'fade', who: 's2', alpha: 0, ms: 360 },
    { kind: 'remove', who: 's2' },
    { kind: 'moveTo', who: 's1', tx: 592, ty: 151, face: 'up' },
    { kind: 'moveTo', who: 's1', tx: 583, ty: 151, face: 'left' },
    { kind: 'fade', who: 's1', alpha: 0, ms: 360 },
    { kind: 'remove', who: 's1' },
    { kind: 'focus', who: 'player', ms: 520 },
    { kind: 'fade', who: 'player', alpha: 1, ms: 240 },
    { kind: 'emote', who: 'player', emote: 'surprise', ms: 800 },
    { kind: 'say', who: 'player', thought: true, text: '(이건 아무래도 큰일인데...? 어서 빨리 알려야겠어. 그 장소는 어디일까? 고민할 시간이 없어...!)', textEn: '(This is bad... I have to tell someone, fast. Where is that place? No time to think it over...!)' },
  ],
};

/** N18-6 ② 명부 대조 */
export const CINE_N186_LEDGER: CineScript = {
  id: 'n18-6-ledger',
  placeKo: '도매시장 기록대',
  placeEn: 'Wholesale market ledger desk',
  steps: [
    { kind: 'focus', who: 'player', ms: 460 },
    { kind: 'say', who: 'player', thought: true, text: '잉크가 마른 지 얼마 안 됐다. 원래 글씨와 덧쓴 글씨의 결이 다르다.', textEn: 'The ink is barely dry. The overwritten strokes differ from the original hand.' },
    { kind: 'emote', who: 'player', emote: 'think', ms: 760 },
    { kind: 'say', who: 'player', thought: true, text: '수량, 어종, 원산지 순서가 서로 맞지 않아. 이대로 두면 위판 기록이 바뀐다.', textEn: 'Quantity, species, and origin are out of order. Left alone, the auction record changes.' },
    { kind: 'say', who: 'player', thought: true, text: '명부의 페이지와 흔적을 남겨 두자. 말로만 전하면 증거가 사라진다.', textEn: 'Keep the page and the marks. Word of mouth alone loses the evidence.' },
  ],
};

/** N18-6 ③ 도현수에게 보고 */
export const CINE_N186_REPORT: CineScript = {
  id: 'n18-6-report',
  placeKo: '도매시장 앞',
  placeEn: 'In front of the wholesale market',
  steps: [
    { kind: 'focus', who: 'watcher', ms: 520 },
    { kind: 'face', who: 'watcher', dir: 'down' },
    { kind: 'say', who: 'watcher', text: '그 명부… 어디서 봤어? 섣불리 이름부터 말하지는 마.', textEn: 'That ledger… where did you see it? Do not go naming names too soon.' },
    { kind: 'say', who: 'player', text: '후문에서 인계 장면을 봤어. 수정 전후의 순서와 시간을 적어 왔어.', textEn: 'I saw the handoff at the back gate. I wrote down the order and times before and after the edits.' },
    { kind: 'say', who: 'watcher', text: '알겠어. 이번엔 내가 신고서에 붙일게. 같이 확인한 걸로 남기자.', textEn: 'Got it. This time I will attach it to the report. We will record that we checked it together.' },
  ],
};

export const STORY_CINEMATICS: Record<string, CineScript> = {
  [CINE_M1_YEONGGEUMJEONG.id]: CINE_M1_YEONGGEUMJEONG,
  [CINE_M1_OKSEON_STALL.id]: CINE_M1_OKSEON_STALL,
  [CINE_M1_ICE_DROP.id]: CINE_M1_ICE_DROP,
  [CINE_N186_WATCH.id]: CINE_N186_WATCH,
  [CINE_N186_LEDGER.id]: CINE_N186_LEDGER,
  [CINE_N186_REPORT.id]: CINE_N186_REPORT,
};

/** i18n 런타임 사전용 — 각본의 (한국어, 영어) 쌍을 전부 낸다 */
export function allCinematicLines(): [string, string][] {
  const out: [string, string][] = [];
  for (const sc of Object.values(STORY_CINEMATICS)) {
    if (sc.placeEn) out.push([sc.placeKo, sc.placeEn]);
    for (const st of sc.steps) if (st.kind === 'say' && st.textEn) out.push([st.text, st.textEn]);
  }
  return out;
}
