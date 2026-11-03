/**
 * @file en_fest.ts
 * @description 298차 — 지역 축제(일지 「나날」 · 직판장 축제 매대 · 알림 · 도움말) 영문. 축제 이름 · 자리는 core 표의 Ko/En 쌍이 정본이다.
 */

type Tr = (s: string) => string;
type FestRule = [RegExp, (m: RegExpExecArray, tr: Tr) => string];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const EN_FEST: Record<string, string> = {
  '지역 축제': 'Local festivals',
  '지금 한창': 'On now',
  '축제 달': 'Festival month',
  '축제 달 · 절정 지남': 'Festival month · peak over',
  '축제 시계: 실시간': 'Festival clock: real time',
  // 도움말
  '고장마다 해마다 같은 때에 축제가 섭니다 — 속초 양미리·도루묵(11월) · 부산 자갈치(10월) · 구룡포 과메기(11월) · 거제 대구(12월) · 모슬포 방어(11월) · 울릉도 오징어(8월) · 안면도 대하(9월) · 소래포구(9월) · 여수 섬슐랭(11월). 열린 고장의 축제는 일지 「나날」에 뜨고, 라디오가 알려 줍니다.':
    'Every town holds its festival at the same time each year — Sokcho sand lance & sandfish (Nov), Busan Jagalchi (Oct), Guryongpo gwamegi (Nov), Geoje cod (Dec), Moseulpo yellowtail (Nov), Ulleungdo squid (Aug), Anmyeondo prawn (Sep), Soraepogu (Sep), Yeosu island food (Nov). Festivals in towns you have opened appear in the journal “Days” and on the radio.',
  '축제 달에는 그 고장 가게가 그 축제의 특산을 1.1배로 쳐주고, 직판장 축제 매대의 가공품이 쌉니다. 실제 축제가 열리는 절정 주에는 1.3배, 거리가 두 배로 붐비고, 그 고장 사람이 축제 일손을 부탁합니다(품삯 1.3배). 절정이 시작되면 손목시계가 알립니다.':
    'During the festival month, shops in that town pay 1.1× for the festival specialty and the direct-sale festival stall sells processed goods cheaper. In the peak week, when the real festival runs, it is 1.3×, the streets are twice as busy, and a local asks for festival help (wages ×1.3). Your wristwatch rings when the peak begins.',
  '축제 값은 그 고장에서 얻은 특산을 그 고장에서 팔 때만 붙습니다. 다른 고장에 가져가 파는 택배 차익과는 따로입니다.':
    'The festival price applies only when a specialty obtained in that town is sold in that town. It is separate from the shipping premium for selling in another town.',
};

export const EN_FEST_RULES: FestRule[] = [
  [/^(\d+)월 (\d+)일 ~ (\d+)일$/, (m) => `${MONTH_EN[Number(m[1]) - 1]} ${m[2]}–${m[3]}`],
  [/^(\d+)월 (\d+)일 ~ (\d+)월 (\d+)일$/, (m) => `${MONTH_EN[Number(m[1]) - 1]} ${m[2]} – ${MONTH_EN[Number(m[3]) - 1]} ${m[4]}`],
  [/^(\d+)일 뒤$/, (m) => `in ${m[1]} days`],
  [/^축제 달 · (\d+)일 뒤 절정$/, (m) => `Festival month · peak in ${m[1]} days`],
  [/^축제 매대 — (.+?)\((.+?)\) · (\d+)% 싸게 · (.+)$/, (m, tr) => `Festival stall — ${tr(m[1]!)} (${tr(m[2]!)}) · ${m[3]}% off · ${tr(m[4]!)}`],
  [/^\[축제\] (.+)$/, (m, tr) => `[Festival] ${tr(m[1]!)}`],
  [/^(.+)가 열렸다 — (.+) · (.+)\. 축제장 매대에서 (.+?)(?:을|를) 더 쳐준다\.$/, (m, tr) => `${tr(m[1]!)} has opened — ${tr(m[2]!)} · ${tr(m[3]!)}. The festival stalls pay more for ${tr(m[4]!)}.`],
];
