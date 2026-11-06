/**
 * @file en_visit.ts
 * @description 305 · 306 · 307차 — 홈타운 소유 · 방문(집 구경 · 집 안 구경) · 미끼를 따먹힌 빈 바늘 영문.
 *
 * 규칙은 이름이 섞인 문장(「OO 씨가 집 구경을 …」 · 「[홈타운] …」 채널 줄)만 둔다.
 */

type Tr = (s: string) => string;
type VisitRule = [RegExp, (m: RegExpExecArray, tr: Tr) => string];

export const EN_VISIT: Record<string, string> = {
  // 305 — 남의 집에서 막힌 행동 · 내 집으로 돌아온 까닭
  '남의 집에는 들어갈 수 없습니다.': 'You cannot go into someone else’s house.',
  '남의 집 우편함입니다.': 'That is someone else’s mailbox.',
  '남의 집 텃밭은 손댈 수 없습니다.': 'You cannot touch someone else’s garden.',
  '남의 집 마당에는 물건을 놓을 수 없습니다.': 'You cannot place things in someone else’s yard.',
  '남의 집 물건은 거둘 수 없습니다.': 'You cannot pick up someone else’s things.',
  '남의 집 마당에서는 캘 수 없습니다.': 'You cannot dig in someone else’s yard.',
  '남의 집에서는 할 수 없습니다.': 'You cannot do that in someone else’s home.',
  '함께하기 연결이 끊겨 내 집으로 돌아왔습니다.': 'The co-op connection dropped, so you came back to your own home.',
  '집주인이 자리를 비워 내 집으로 돌아왔습니다.': 'The host stepped away, so you came back to your own home.',
  '방문 허락이 없어 내 집으로 돌아왔습니다.': 'You have no invitation, so you came back to your own home.',
  '내 집으로 돌아왔습니다.': 'You came back to your own home.',
  // 306 — 집 구경
  '집 구경 청하기': 'Ask to visit their home',
  '청한 집 구경 거두기': 'Withdraw the visit request',
  '집 구경 마치기': 'End the visit',
  '집 구경 가기': 'Go visit',
  '손님 배웅하기': 'See the guest off',
  '내 집으로 가기': 'Go to my home',
  '들이기': 'Let in',
  '사양하기': 'Decline',
  '가기': 'Go',
  '나중에': 'Later',
  '내 집입니다.': 'That is your own home.',
  '그 사람의 집을 찾을 수 없습니다.': 'Their home could not be found.',
  '그 사람은 지금 함께하기에 없습니다.': 'They are not in the co-op session right now.',
  '이미 청했거나 방문 중입니다.': 'You have already asked, or a visit is under way.',
  '먼저 청한 방문의 답을 기다리는 중입니다.': 'You are still waiting for an answer to your earlier request.',
  '집주인만 답할 수 있습니다.': 'Only the host can answer.',
  '내 방문이 아닙니다.': 'That is not your visit.',
  '이미 답한 방문입니다.': 'That request has already been answered.',
  '들인 방문이 아닙니다.': 'That visit has not been accepted.',
  '집 모습이 너무 큽니다.': 'The home snapshot is too large.',
  '지금은 방문을 더 청할 수 없습니다.': 'No more visits can be requested right now.',
  '집주인이 이번에는 사양했습니다.': 'The host declined this time.',
  '집주인이 답하지 않았습니다.': 'The host did not answer.',
  '집주인이 집 구경을 마쳤습니다.': 'The host ended the visit.',
  '손님이 집 구경을 마쳤습니다.': 'The guest ended the visit.',
  '집주인이 자리를 비웠습니다.': 'The host stepped away.',
  '손님이 자리를 비웠습니다.': 'The guest stepped away.',
  '청하지 못했습니다.': 'Could not send the request.',
  // 307 — 집 안 구경
  '[F] 집 안 구경하기': '[F] Look around inside',
  '집 안 모습을 아직 받지 못했습니다. 잠시 뒤에 다시 해 보세요.': 'The inside of the house has not arrived yet. Try again in a moment.',
  '남의 집 안이다. 만지지 말고 구경만 하자.': 'Someone else’s home. Look, but don’t touch.',
  // 306 — 미끼를 따먹힌 빈 바늘
  '입질이 끊겼습니다 — 미끼를 따먹힌 것 같습니다. 빈 바늘로는 물지 않습니다.':
    'The bite stopped — the bait seems to have been stolen. Nothing bites a bare hook.',
};

export const EN_VISIT_RULES: VisitRule[] = [
  [/^(.+) 씨가 집 구경을 오고 싶어 합니다\.\n들이시겠습니까\?$/, (m) => `${m[1]} would like to visit your home.\nLet them in?`],
  [/^(.+) 씨가 집 구경을 허락했습니다\.\n지금 가 보시겠습니까\?$/, (m) => `${m[1]} invited you over.\nGo now?`],
  [/^(.+) 씨 집 구경 가기$/, (m) => `Visit ${m[1]}’s home`],
  [/^(.+) 씨 집 안이다\. 만지지 말고 구경만 하자\.$/, (m) => `${m[1]}’s home. Look, but don’t touch.`],
  [/^\[홈타운\] (.+) 씨에게 집 구경을 청했습니다 — 답을 기다립니다$/, (m) => `[Hometown] Asked ${m[1]} for a visit — waiting for an answer`],
  [/^\[홈타운\] (.+) 씨를 집 구경에 들였습니다$/, (m) => `[Hometown] You let ${m[1]} in for a visit`],
  [/^\[홈타운\] (.+) 씨가 집 구경을 허락했습니다$/, (m) => `[Hometown] ${m[1]} invited you over`],
  [/^\[홈타운\] (.+)$/, (m, tr) => `[Hometown] ${tr(m[1]!)}`],
];
