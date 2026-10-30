/**
 * @file StoryTalkM7.ts
 * @description 290차 — 제5부 「돌아오는 길」 M7(독도 · 속초) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. M7-08(의뢰인 없음 — 혼잣말)은 쓰지 않는다.
 *
 * 인물 말투(옛 받는 말 · 끝내는 말 · 진행 중 조언에서):
 *  - 석대양(등대지기 · 울릉 등대 · 고진태 선장을 기억한다) — 「자네」 · 「~지」 · 「~야」 · 「~게」 · 짧고 무겁다. 무전으로 신호를 준다.
 *  - 동명항 어촌계(계장 — 도현수의 할아버지) — 「네가」 · 「~다」 · 「~라」 · 칭찬은 사실로만 한다.
 *  - 석독구(12 · 등대지기 손자) — 들뜬 반말 · 「~래」 · 「근데」 · 조사단 대학생을 「형들」이라 부른다.
 *  - 정옥선(71 · 만복상회 · 병실 → 요양 · 휠체어) — 짧은 반말 · 「앉아」 · 속정은 말 대신 몸짓.
 *  - 탁새벽(12 · 탁만수의 손자) — 반말 · 으쓱 · 「어른들은 왜 …」.
 * 주인공은 어른에게 존댓말, 열두 살 둘에게는 반말(옛 답 · 진행 중 물음과 같은 결). 부를 때는 이름 + 씨(어린이에게는 부르지 않는다).
 * 표시: 새 표시는 없다 — 옛 받는 답 · 보상 답의 표시(choice.m7_…)는 묶인 답이 남긴다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const D = 'seok_daeyang';
const C = 'coop';
const K = 'seok_dokgu';
const O = 'okseon';
const S = 'tak_saebyeok';
const P = 'player';

export const TALKS_M7: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // M7-01 「동도 접안」 — 받는 자리(석대양 · 울릉 등대)
  // ═══════════════════════════════════════════
  {
    id: 'm7_01_offer', questId: 'M7-01', at: 'offer', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '왔나. 독도 갈 채비는 다 됐다고 들었네.', "You're here. I hear you're all set for Dokdo.", { act: 'look_up' }),
        line(P, '네. 항해 계획도 승인받았고, 조사단 동행 허가도 났습니다.', 'Yes. My voyage plan was approved, and the permit to go with the survey team came through.'),
        line(D, '서류는 사람이 내주는 거고. 독도는 바다가 내줘야 가는 데야.', 'Papers are something people give you. Dokdo is a place you only reach when the sea gives you leave.'),
        line(P, '바다가 내준다는 건… 날씨 말씀이세요?', 'When the sea gives leave... you mean the weather?'),
        line(D, '그래. 날씨가 문이야. 동도에 배를 댈 수 있는 날은 많지 않아. 열릴 때 가는 거지.', "That's right. The weather is the door. There aren't many days you can bring a boat in at Dongdo. You go when it opens."),
        line(P, '열렸는지는 어떻게 압니까?', 'How will I know when it opens?'),
        line(D, '내가 여기 등대에서 풍속하고 파고를 보고 있다가, 됐다 싶으면 무전으로 신호를 주지.', "I watch the wind and the swell from this lighthouse, and when it looks right, I'll give you the signal over the radio.", { act: 'look_sea' }),
        line(D, '그리고 하나 더. 동도에 머무는 건 세 시간이야.', 'And one more thing. You get three hours on Dongdo.'),
        line(P, '세 시간이요?', 'Three hours?'),
        line(D, '세 시간. 그 안에 보고, 적고, 뱃머리를 돌려야 해.', 'Three hours. In that time you look, you write it down, and you turn the bow around.'),
      ], {
        choices: [
          opt('wait', '신호를 기다리겠습니다', "I'll wait for your signal", {
            say: ['신호 기다리겠습니다. 날씨가 허락할 때 가겠습니다.', "I'll wait for your signal. I'll go when the weather allows."], next: 'wait' }),
          opt('hours', '왜 세 시간뿐입니까?', 'Why only three hours?', {
            say: ['왜 세 시간뿐입니까? 더 있으면 안 됩니까?', "Why only three hours? Can't I stay longer?"], next: 'hours' }),
          opt('afraid', '…솔직히 무섭습니다', "...Honestly, I'm scared", {
            say: ['…막상 간다니 무섭습니다. 아버지가 지난 바다라서요.', "...Now that I'm actually going, I'm scared. It's the sea my father passed through."], next: 'afraid' }),
        ],
        note: ['석대양 씨는 독도는 서류가 아니라 바다가 내줘야 가는 곳이라고 했다. 날씨가 열리면 등대에서 무전으로 신호를 주겠다고, 동도에 머무는 건 세 시간뿐이라고 했다.',
          "Daeyang said papers don't get you to Dokdo — the sea has to let you. When the weather opens he'll radio me from the lighthouse, and I'll have only three hours on Dongdo."],
      }),
      wait: scene([
        line(D, '그래. 독도 앞바다는 하루에도 몇 번씩 얼굴을 바꿔. 열렸다 싶으면 닫히고.', 'Good. The sea off Dokdo changes its face several times a day. Just when it seems open, it closes.'),
        line(D, '됐다 싶으면 내가 부르지. 그 전에 나가면 안 돼. 기다리는 것도 항해야.', "When it's right, I'll call you. Don't go out before that. Waiting is part of the voyage too."),
        line(P, '명심하겠습니다.', "I'll keep that in mind."),
      ], {
        choices: [
          opt('ok', '부르실 때까지 기다리겠습니다', "I'll wait until you call", {
            say: ['알겠습니다. 부르실 때까지 기다리겠습니다.', "Understood. I'll wait until you call."],
            end: endTalk({ accept: true, offer: 'wait_signal' }) }),
          opt('battery', '신호를 놓치면 어떡합니까?', 'What if I miss the signal?', {
            say: ['신호를 놓치면 어떡합니까? 무전기 배터리가 간당간당해서요.', "What if I miss the signal? My radio battery is running low."], next: 'battery' }),
        ],
        note: ['석대양 씨는 독도 앞바다는 하루에도 몇 번씩 얼굴을 바꾼다며, 부르기 전에는 나가지 말라고 했다. 기다리는 것도 항해라고.',
          "Daeyang said the sea off Dokdo changes its face several times a day, and told me not to go out before he calls. Waiting is part of the voyage, he said."],
      }),
      battery: scene([
        act(D, 'sigh'),
        line(D, '…예비 배터리도 안 챙기고 독도를 가나.', '...Heading for Dokdo without a spare battery?'),
        line(D, '지금 충전해 둬. 신호는 될 때까지 몇 번이고 다시 준다. 놓쳤다고 혼자 들어가지만 마. 그게 제일 위험해.', "Charge it now. I'll send the signal as many times as it takes. Just don't go in on your own because you missed it. That's the most dangerous thing."),
        line(P, '네. 충전부터 하겠습니다.', "Yes. I'll charge it first."),
      ], {
        end: endTalk({ accept: true, offer: 'battery' }),
        note: ['무전기 배터리 얘기를 꺼냈다가 한숨을 들었다. 신호는 몇 번이고 다시 줄 테니, 놓쳤다고 혼자 들어가지만 말라고 했다.',
          "I mentioned my radio battery and got a sigh. He'll send the signal as many times as it takes — just don't go in alone because I missed it."],
      }),
      hours: scene([
        line(D, '날씨 때문이지. 동도에 배를 대 둘 수 있는 시간은 바다가 정해. 세 시간 넘기면 돌아오는 길이 닫힐 수 있어.', "Because of the weather. The sea decides how long you can keep a boat at Dongdo. Go past three hours and the way back can close."),
        line(D, '그리고 거기는 사람이 오래 머물 데가 아니야. 지키는 사람들 자리지.', "And it isn't a place for people to linger. It belongs to the ones who guard it."),
        line(P, '…보고, 적고, 돌아오겠습니다.', "...I'll look, write it down, and come back."),
        line(D, '그래. 그거면 돼.', "Right. That's all it takes.", { act: 'nod' }),
      ], {
        end: endTalk({ accept: true, offer: 'ask_hours' }),
        note: ['왜 세 시간뿐이냐고 물었다. 바다가 정하는 시간이고, 넘기면 돌아오는 길이 닫힐 수 있다고 했다. 거기는 지키는 사람들 자리라고.',
          'I asked why only three hours. The sea sets the time, he said, and stay past it and the way back can close. That place belongs to those who guard it.'],
      }),
      afraid: scene([
        line(D, '무서운 게 맞아. 이 바다를 우습게 보는 사람한테는 내가 신호 안 줘.', "Being scared is right. I don't give the signal to anyone who takes this sea lightly."),
        act(D, 'silence'),
        line(D, '자네 아버지도 이 앞을 지날 때 등대 쪽을 한 번은 봤을 거야. 지나가는 배들은 다 그래.', 'Your father would have looked toward the lighthouse at least once when he passed by here. Every passing boat does.'),
        line(D, '그러니 자네도 한 번 보게. 내가 불을 켜 두지.', "So you look once too. I'll keep the light on."),
        line(P, '…네.', '...Yes.'),
      ], {
        end: endTalk({ accept: true, offer: 'afraid' }),
        note: ['무섭다고 털어놓았다. 석대양 씨는 무서운 게 맞다며, 아버지도 이 앞을 지날 때 등대 쪽을 봤을 거라고 했다. 나도 한 번 보라고, 불을 켜 두겠다고 했다.',
          'I admitted I was scared. Daeyang said that was right, and that my father would have looked toward the lighthouse when he passed. Look once yourself, he said — he would keep the light on.'],
      }),
    },
  },

  // M7-01 — 끝내는 자리(석대양)
  {
    id: 'm7_01_done', questId: 'M7-01', at: 'complete', npcId: D, start: 'start',
    nodes: {
      start: scene([
        line(D, '왔나. 접안했다는 무전은 들었네.', "You're back. I heard on the radio that you made the landing.", { act: 'look_up' }),
        line(P, '네. 동도에 배를 묶고 바위에 올라섰습니다.', 'Yes. I tied up at Dongdo and stepped up onto the rocks.'),
        line(D, '세 시간, 다 썼나.', 'Did you use all three hours?'),
        line(P, '다 썼습니다. 그래도 모자랐습니다.', 'All of them. It still wasn\'t enough.'),
        line(D, '거기가 자네 아버지가 지났던 바다 끝이야. 잘 봐 뒀겠지.', "That's the edge of the sea your father passed through. I hope you took a good look.", { act: 'look_sea' }),
        line(P, '…네. 잘 봐 뒀습니다.', '...Yes. I took a good look.'),
      ], {
        choices: [
          opt('end', '바다의 끝에 다녀왔습니다', "I've been to the end of the sea", {
            say: ['바다의 끝에 다녀왔습니다.', "I've been to the end of the sea."], next: 'sea_end' }),
          opt('three', '세 시간이 짧았습니다', 'Three hours was short', {
            say: ['세 시간이 짧았습니다.', 'Three hours was too short.'],
            end: endTalk({ complete: 'three_hours',
              lineKo: '짧아야 해. 길면 돌아올 마음이 안 생겨. 세 시간 동안 다 보려고 하지 마. 하나만 제대로 보면 돼. 나머지는 다음에 또 가면 되지.',
              lineEn: "It's meant to be short. If it were long you wouldn't want to come back. Don't try to see everything in three hours. See one thing properly. The rest can wait for the next trip." }),
            note: ['세 시간이 짧았다고 했다. 석대양 씨는 짧아야 돌아올 마음이 생긴다며, 하나만 제대로 보면 된다고 했다.',
              "I said three hours was short. Daeyang said it has to be short or you'd never want to come back — see one thing properly, and that's enough."] }),
          opt('light', '신호 주셔서 고맙습니다', 'Thank you for the signal', {
            say: ['신호 주셔서 고맙습니다. 돌아오는 길에 등대 불빛이 보이니까 마음이 놓였습니다.', 'Thank you for the signal. On the way back, seeing the lighthouse light put my mind at ease.'], next: 'light' }),
        ],
        note: ['독도에서 돌아와 석대양 씨에게 동도에 다녀온 이야기를 했다. 거기가 아버지가 지났던 바다 끝이라는 말에, 대답이 잘 나오지 않았다.',
          "Back from Dokdo, I told Daeyang about Dongdo. When he said it was the edge of the sea my father passed through, the words didn't come easily."],
      }),
      sea_end: scene([
        line(D, '끝이 아니야. 거기서 돌아오는 거지. 그게 조행록이야.', "It isn't the end. It's where you turn back. That's what a fishing log is."),
        act(D, 'silence'),
        line(D, '뱃사람은 끝까지 가는 사람이 아니라, 돌아올 줄 아는 사람이야. 돌아오는 길은 내가 늘 보고 있지.', "A sailor isn't someone who goes all the way to the end. It's someone who knows how to come back. I'm always watching the way back."),
      ], {
        end: endTalk({ complete: 'end' }),
        note: ['바다의 끝에 다녀왔다고 하자, 석대양 씨는 끝이 아니라 돌아오는 곳이라고 했다. 뱃사람은 돌아올 줄 아는 사람이라고.',
          "When I said I had been to the end of the sea, Daeyang said it isn't the end but where you turn back. A sailor is someone who knows how to come back."],
      }),
      light: scene([
        line(D, '…보였나. 그 불은 22년 전에도 거기 있었지.', '...You saw it? That light was there twenty-two years ago too.', { act: 'look_away' }),
        line(D, '자네가 거기 다녀온 걸 이 불이 알아. 다음에 갈 때도 켜 두지.', "This light knows you went out there. I'll keep it on next time too."),
      ], {
        end: endTalk({ complete: 'light_seen' }),
        note: ['등대 불빛 덕분에 마음이 놓였다고 했다. 석대양 씨는 그 불이 22년 전에도 거기 있었다며, 다음에 갈 때도 켜 두겠다고 했다.',
          'I said the lighthouse light had put my mind at ease. Daeyang said that light was there twenty-two years ago too, and that he would keep it on next time.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M7-02 「조사선」 — 받는 자리(어촌계 · 조사선)
  // ═══════════════════════════════════════════
  {
    id: 'm7_02_offer', questId: 'M7-02', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '왔냐. 오늘은 조사선이다.', "You're here. Today it's the survey boat."),
        line(P, '조사선이요? 낚싯대는 챙겨 왔는데요.', "The survey boat? I brought my rod, though."),
        line(C, '대는 쓴다. 근데 잡는 게 아니다. 재고 놓는 거다.', "You'll use the rod. But you're not catching. You measure and let go."),
        line(P, '재고… 놓는다고요?', 'Measure... and let go?'),
        line(C, '표본 세 마리. 올라오는 대로 길이 재고, 사진 한 장 남기고, 그 자리에서 놓아준다.', 'Three specimens. Whatever comes up, you measure the length, take one photo, and release it right there.'),
        line(P, '기록은 누가 합니까?', 'Who keeps the records?'),
        line(C, '조사단이 한다. 저기 계측판 든 대학생들. 너는 올리고, 재고, 놓기만 해.', 'The survey team. Those university students with the measuring boards. You just bring it up, measure it, and let it go.'),
      ], {
        choices: [
          opt('cooler', '쿨러는 안 열겠습니다', "I won't open the cooler", {
            say: ['계측하고 바로 놓겠습니다. 쿨러는 안 엽니다.', "I'll measure and release right away. The cooler stays shut."], next: 'cooler' }),
          opt('survey', '조사단은 이걸로 뭘 알아냅니까?', 'What does the survey team learn from this?', { next: 'survey' }),
          opt('pick', '세 마리는 아무 종이나 됩니까?', 'Can the three be any species?', {
            say: ['세 마리는 아무 종이나 됩니까? 고르는 게 있습니까?', 'Can the three be any species? Is there anything to choose?'], next: 'pick' }),
        ],
        note: ['어촌계에서 오늘은 조사선이라고 했다. 잡는 게 아니라 표본 세 마리를 재고, 사진을 남기고, 그 자리에서 놓아주는 일이었다. 기록은 조사단 대학생들이 한다고 했다.',
          "The co-op said today was the survey boat. Not catching — measuring three specimens, taking a photo, and releasing them on the spot. The university students on the survey team would keep the records."],
      }),
      cooler: scene([
        line(C, '그래. 오늘 쿨러는 짐이다.', 'Right. Today the cooler is dead weight.'),
        line(C, '물 밖에 오래 두면 놓아줘도 못 산다. 재고, 찍고, 놓는 데 숨 한 번이면 된다.', "Leave it out of the water too long and it won't live even if you let it go. Measure, photograph, release — one breath is all it should take."),
        line(C, '손 적셔서 만져라. 마른 손으로 잡으면 비늘이 다친다.', 'Wet your hands before you touch it. Dry hands hurt the scales.'),
      ], {
        choices: [
          opt('ok', '손부터 적시겠습니다', "I'll wet my hands first", {
            end: endTalk({ accept: true, offer: 'cooler_shut' }) }),
          opt('itchy', '잡지 않는 낚시라니, 손이 근질거리겠네요', 'Fishing without catching — my hands will itch', {
            say: ['잡지 않는 낚시라니, 손이 근질거릴 것 같습니다.', "Fishing without catching anything — my hands are going to itch."], next: 'itchy' }),
        ],
        note: ['물 밖에 오래 두면 놓아줘도 못 산다고 했다. 재고 찍고 놓는 데 숨 한 번, 손은 적셔서 만지라고 했다.',
          "He said a fish left out of the water too long won't live even after release. One breath to measure, photograph and let go — and wet hands only."],
      }),
      itchy: scene([
        line(C, '근질거려도 놔라. 그 손이 오늘 배울 거다.', 'Itch or not, let go. Those hands will learn something today.'),
        act(C, 'laugh'),
        line(C, '종묘방류 때 양동이 들던 손 기억나냐. 그때는 작은 걸 놓았고, 오늘은 큰 걸 놓는다.', 'Remember your hands holding the bucket at the fry release? That time you let small ones go. Today you let big ones go.'),
        line(C, '큰 걸 놓을 줄 알아야 바다 사람이다.', 'Only someone who can let a big one go is a person of the sea.'),
      ], {
        end: endTalk({ accept: true, offer: 'itchy_hands' }),
        note: ['손이 근질거리겠다고 하자, 드물게 웃었다. 종묘방류 때는 작은 걸 놓았고 오늘은 큰 걸 놓는다며, 큰 걸 놓을 줄 알아야 바다 사람이라고 했다.',
          "When I said my hands would itch, he gave a rare laugh. At the fry release I let small ones go; today, big ones. Only someone who can let a big one go is a person of the sea."],
      }),
      survey: scene([
        line(C, '어떤 놈이 얼마만 한 게 얼마나 사는지. 해마다 재면 바다가 늘었는지 줄었는지 보인다.', 'What lives here, how big, and how many. Measure every year and you can see whether the sea is growing or shrinking.'),
        line(P, '잡아서 세면 안 됩니까?', "Couldn't they catch them and count?"),
        line(C, '잡아서 세면 바다가 줄고, 재고 놓으면 숫자만 남는다.', 'Catch to count and the sea shrinks. Measure and release, and only the numbers remain.'),
        line(C, '오늘 네가 남기는 건 숫자다. 고기는 바다에 남기고.', 'What you leave behind today is numbers. The fish you leave in the sea.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_survey' }),
        note: ['조사단이 무엇을 알아내느냐고 물었다. 해마다 재면 바다가 늘었는지 줄었는지 보인다고, 오늘 내가 남기는 건 숫자고 고기는 바다에 남긴다고 했다.',
          'I asked what the survey team learns. Measure every year, he said, and you can see whether the sea is growing or shrinking. Today I leave numbers behind, and the fish in the sea.'],
      }),
      pick: scene([
        line(C, '고르지 마라. 올라오는 대로 잰다. 고르는 순간 조사가 아니라 네 조과가 된다.', "Don't choose. You measure whatever comes up. The moment you choose, it stops being a survey and becomes your catch."),
        line(P, '큰 놈만 재면 안 되는 거군요.', "So I can't just measure the big ones."),
        line(C, '큰 놈만 재면 바다가 커 보이고, 작은 놈만 재면 작아 보인다. 바다가 주는 대로 받아 적는 거다.', 'Measure only big ones and the sea looks big; only small ones and it looks small. You write down what the sea gives you.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_pick' }),
        note: ['세 마리를 골라도 되느냐고 물었다. 고르는 순간 조사가 아니라 내 조과가 된다고, 바다가 주는 대로 받아 적는 거라고 했다.',
          "I asked whether I could choose the three. The moment I choose, it becomes my catch instead of a survey, he said. You write down what the sea gives you."],
      }),
    },
  },

  // M7-02 — 끝내는 자리(어촌계)
  {
    id: 'm7_02_done', questId: 'M7-02', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(P, '세 마리, 재고 다 놓아줬습니다.', "All three measured and released."),
        line(C, '봤다. 세 번째는 물에 넣자마자 내려가더라.', 'I saw. The third one went straight down the moment it touched the water.'),
        line(P, '네. 꼬리를 한 번 치더니 바로요.', 'Yes. One flick of its tail and it was gone.'),
        line(C, '그게 조사다. 숫자는 기록지에 남았고, 고기는 바다에 남았다.', "That's a survey. The numbers stayed on the record sheet, and the fish stayed in the sea."),
        line(C, '조행록에 오늘을 어떻게 적을지는 네가 정해.', 'How you write today in your fishing log is up to you.'),
        line(P, '…아직 잘 모르겠습니다.', "...I'm not sure yet."),
      ], {
        choices: [
          opt('light', '놓아주는 손이 가벼웠습니다', 'My hands felt light letting go', {
            say: ['놓아주는 손이 가벼웠습니다.', 'My hands felt light when I let them go.'], next: 'light' }),
          opt('record', '마릿수 말고 종을 적겠습니다', "I'll write species, not counts", {
            say: ['조행록에 마릿수가 아니라 종을 적겠습니다.', "I'll write species in my log, not how many I caught."],
            end: endTalk({ complete: 'record',
              lineKo: '그렇게 적는 사람이 열일곱 장을 채운다. 마릿수는 그날 운이고, 종은 그 바다다. 나중에 네 아버지가 적은 장들하고 나란히 놓고 봐라.',
              lineEn: "The ones who write it that way are the ones who fill all seventeen pages. A count is that day's luck; a species is that sea. Later, lay it beside the pages your father wrote." }),
            note: ['조행록에 마릿수가 아니라 종을 적겠다고 했다. 마릿수는 그날 운이고 종은 그 바다라며, 아버지가 적은 장들과 나란히 놓고 보라고 했다.',
              "I said I'd write species, not counts. A count is the day's luck and a species is the sea, he said — lay it beside the pages my father wrote."] }),
          opt('no_name', '기록에 제 이름은 안 남겨도 됩니다', "My name needn't go on the record", {
            say: ['조사 기록에는 제 이름 안 남겨도 됩니다.', "My name doesn't need to go on the survey record."],
            end: endTalk({ complete: 'no_name',
              lineKo: '조사 기록엔 조사단 이름만 들어간다. 그게 맞다. 네 이름은 조행록에 써라. 조사 기록은 바다 거고, 조행록은 네 거다.',
              lineEn: "Only the survey team's name goes on the record. That's as it should be. Write your name in your log. The survey record belongs to the sea, and the log belongs to you." }),
            note: ['조사 기록에 내 이름은 안 남겨도 된다고 했다. 조사 기록은 바다 것이고 조행록은 내 것이니, 내 이름은 조행록에 쓰라고 했다.',
              "I said my name didn't need to be on the survey record. The record belongs to the sea and the log to me, he said — write my name in the log."] }),
        ],
        note: ['표본 세 마리를 재고 모두 놓아줬다고 알렸다. 숫자는 기록지에, 고기는 바다에 남았다며, 오늘을 조행록에 어떻게 적을지는 내가 정하라고 했다.',
          "I reported that all three specimens were measured and released. The numbers stayed on the sheet and the fish in the sea, he said — how to write today in my log was up to me."],
      }),
      light: scene([
        line(C, '그 손이 조사원 손이다.', "Those are a surveyor's hands.", { act: 'nod' }),
        line(C, '무겁게 놓는 놈은 아쉬워서 그런 거다. 가볍게 놓는 놈은 바다를 믿는 거고.', 'Someone who lets go heavily is holding on to regret. Someone who lets go lightly trusts the sea.'),
      ], {
        end: endTalk({ complete: 'light' }),
        note: ['놓아주는 손이 가벼웠다고 했다. 가볍게 놓는 사람은 바다를 믿는 거라며, 그 손이 조사원 손이라고 했다.',
          'I said my hands felt light letting go. Someone who lets go lightly trusts the sea, he said — those are a surveyor\'s hands.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M7-03 「열일곱 번째 장」 — 받는 자리(석독구)
  // ═══════════════════════════════════════════
  {
    id: 'm7_03_offer', questId: 'M7-03', at: 'offer', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '왔다! 들었어? 열일곱 번째 장이래.', "You're here! Did you hear? It's the seventeenth page.", { act: 'look_up' }),
        line(P, '열일곱 번째 장?', 'The seventeenth page?'),
        line(K, '조행록 말이야. 조사단 형들이 그랬어. 마지막 칸이 돌돔이래.', 'Of the fishing log. The survey guys said so. The last box is a striped beakfish.'),
        line(P, '돌돔이라… 쉬운 고기는 아닌데.', "A striped beakfish... that's not an easy fish."),
        line(K, '그래서 내가 있잖아. 나는 사진 찍을게. 계측하고 놔 주면 돼.', "That's why I'm here. I'll take the photo. You measure it and let it go."),
        line(P, '그러면?', 'And then?'),
        line(K, '그러면 끝이래. 열일곱 장이 다 차는 거래.', "Then it's done, they said. All seventeen pages full."),
        line(P, '(끝이라…)', '(Done...)'),
        line(K, '돌돔은 더울 때 와. 여름부터 가을까지. 갯바위 틈에 숨어 있어.', 'Beakfish come when it\'s warm. Summer through autumn. They hide in the cracks of the rocks.'),
      ], {
        choices: [
          opt('photo', '좋아. 사진은 네가 맡아', "Good. You're on photos", {
            say: ['좋아. 사진은 네가 맡아라. 계측은 내가 하지.', "Good. You're in charge of the photo. I'll do the measuring."], next: 'photo' }),
          opt('ask_end', '끝이라고 누가 그래?', 'Who says it\'s the end?', {
            say: ['끝이라고 누가 그래? 조행록이 끝나는 거야?', 'Who says it\'s the end? Does the log just end?'], next: 'ask_end' }),
          opt('shake', '마지막 장이라니까 손이 떨린다', 'Last page — my hands are shaking', {
            say: ['마지막 장이라니까 손이 떨린다.', 'Hearing it\'s the last page, my hands are shaking.'], next: 'shake' }),
        ],
        note: ['석독구가 조행록 열일곱 번째 장이 돌돔이라고 알려 줬다. 자기가 사진을 찍을 테니 계측하고 놓아주면, 그걸로 열일곱 장이 다 찬다고 했다.',
          'Dokgu told me the seventeenth page of the log is a striped beakfish. He would take the photo; if I measured it and let it go, all seventeen pages would be full.'],
      }),
      photo: scene([
        line(K, '응! 나 사진 잘 찍어. 흔들리면 다시 찍으면 돼.', "Yeah! I'm good at photos. If it's blurry I'll just take another."),
        line(K, '근데 돌돔은 두 번 안 올라와. 한 번에 잘 재야 해.', "But a beakfish won't come up twice. You have to measure it right the first time."),
        line(K, '(카메라 끈을 손목에 두 번 감는다.)', '(He wraps the camera strap twice around his wrist.)'),
      ], {
        choices: [
          opt('go', '알았다. 갯바위로 가자', 'Got it. To the rocks', {
            end: endTalk({ accept: true, offer: 'you_photo' }) }),
          opt('ice', '사진 잘 나오면 아이스크림 사 줄게', "Good photo, and I'll buy you ice cream", {
            say: ['사진 잘 나오면 아이스크림 사 줄게.', "If the photo turns out well, I'll buy you ice cream."], next: 'ice' }),
        ],
        note: ['사진은 석독구에게 맡기고 계측은 내가 하기로 했다. 돌돔은 두 번 안 올라오니 한 번에 잘 재야 한다고 했다.',
          "Dokgu would take the photo and I would measure. A beakfish won't come up twice, he said, so I had to get it right the first time."],
      }),
      ice: scene([
        line(K, '진짜? 두 개! 아니, 세 개!', 'Really? Two! No, three!'),
        line(K, '근데 돌돔부터야. 못 잡으면 아이스크림도 없는 거지?', 'But beakfish first. No beakfish, no ice cream, right?'),
        line(K, '그럼 빨리 가. 내가 먼저 가서 자리 봐 둘게.', "Then hurry. I'll go ahead and find us a spot."),
      ], {
        end: endTalk({ accept: true, offer: 'ice_cream' }),
        note: ['사진이 잘 나오면 아이스크림을 사 주겠다고 했더니, 석독구는 세 개를 외치고는 먼저 자리를 봐 두겠다며 뛰어갔다.',
          "When I promised ice cream for a good photo, Dokgu shouted for three and ran off ahead to find us a spot."],
      }),
      ask_end: scene([
        line(K, '조사단 형들이 그랬어. 열일곱 장 채우면 완성이래.', 'The survey guys said so. Fill seventeen pages and it\'s complete.'),
        line(K, '근데 완성이면 끝이야? 나는 잘 모르겠어. 공책은 다 쓰면 새 공책 사잖아.', "But is complete the same as the end? I don't know. When you fill a notebook you buy a new one."),
        line(K, '어떻게 생각해?', 'What do you think?', { act: 'peer' }),
        line(P, '…글쎄.', '...I wonder.'),
        line(K, '아니, 일단 돌돔부터 잡자.', 'No — let\'s catch the beakfish first.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_end' }),
        note: ['끝이라고 누가 그러느냐고 물었다. 석독구는 완성이면 끝이냐고, 공책은 다 쓰면 새 공책을 사지 않느냐고 되물었다. 대답은 돌돔을 잡고 나서 하기로 했다.',
          "I asked who said it was the end. Dokgu asked back whether complete means the end — you buy a new notebook when one is full, don't you? The answer would wait until after the beakfish."],
      }),
      shake: scene([
        line(K, '떨면 안 돼! 아니, 떨어도 돼. 사진은 내가 안 흔들리게 찍을게.', "You can't shake! No — it's fine to shake. I'll keep the photo from blurring."),
        line(K, '손 떨리는 건 마지막이라서 그런 거지? 그럼 마지막 아니라고 생각해. 그냥 돌돔 한 마리야.', "Your hands shake because it's the last one, right? Then pretend it isn't. It's just one beakfish."),
        line(K, '나는 그렇게 생각하면 안 떨려.', "That's what I do, and then I don't shake."),
        line(P, '…그래. 돌돔 한 마리.', '...Right. Just one beakfish.'),
      ], {
        end: endTalk({ accept: true, offer: 'hands_shake' }),
        note: ['마지막 장이라 손이 떨린다고 했다. 석독구는 마지막이 아니라 그냥 돌돔 한 마리라고 생각하라고 했다. 그러면 안 떨린다고.',
          "I said my hands were shaking because it was the last page. Dokgu said to think of it as just one beakfish, not the last one. Then you don't shake, he said."],
      }),
    },
  },

  // M7-03 — 끝내는 자리(석독구)
  {
    id: 'm7_03_done', questId: 'M7-03', at: 'complete', npcId: K, start: 'start',
    nodes: {
      start: scene([
        line(K, '찍었어! 놨어! 열일곱 장!', 'Got the photo! Let it go! Seventeen pages!'),
        line(P, '그래. 다 찼다.', "Yeah. It's full."),
        line(K, '…왜 울어?', "...Why are you crying?", { act: 'peer' }),
        line(P, '안 울어.', "I'm not crying."),
        line(K, '아니야? 안 울어? …알았어.', "You're not? Not crying? ...Okay."),
        line(K, '사진 봐. 줄무늬 진짜 선명하게 나왔어.', 'Look at the photo. The stripes came out really sharp.'),
      ], {
        choices: [
          opt('opened', '닫은 게 아니라 연 거다', "I didn't close it — I opened it", {
            say: ['닫은 게 아니라 연 거다. 조행록은.', "I didn't close it. I opened it. The log, I mean."], next: 'opened' }),
          opt('photo', '네가 찍은 사진이 마지막 장이다', 'Your photo is the last page', {
            say: ['네가 찍은 사진이 마지막 장이다.', 'The photo you took is the last page.'],
            end: endTalk({ complete: 'dokgu',
              lineKo: '진짜? 내 사진이? 그럼 이거 흔들리면 안 되는데. …안 흔들렸지? 나 이거 평생 자랑할 거야. 할아버지한테도, 조사단 형들한테도.',
              lineEn: "Really? My photo? Then it can't be blurry. ...It isn't, right? I'm going to brag about this my whole life. To Grandpa, and to the survey guys too." }),
            note: ['석독구가 찍은 사진이 마지막 장이라고 했다. 아이는 카메라를 꼭 쥐고, 평생 자랑하겠다고 했다. 할아버지한테도.',
              'I told Dokgu his photo was the last page. He clutched the camera and said he would brag about it his whole life — to his grandfather too.'] }),
          opt('release', '놓아주는 손은 네가 제일 좋더라', 'You were best at letting it go', {
            say: ['놓아주는 손은 네가 제일 좋더라.', 'You had the best hands for letting it go.'],
            end: endTalk({ complete: 'good_release',
              lineKo: '…진짜? 돌돔이 꼬리로 물 튀기고 갔어. 내 얼굴에. 그건 사진 안 찍었는데, 안 찍어도 기억날 것 같아. 그건 그냥 내 거야.',
              lineEn: "...Really? The beakfish splashed me with its tail as it went. Right in the face. I didn't get a photo of that, but I think I'll remember it anyway. That one's just mine." }),
            note: ['놓아주는 손은 석독구가 제일 좋더라고 했다. 돌돔이 꼬리로 얼굴에 물을 튀기고 갔다며, 사진은 없어도 그건 자기 거라고 했다.',
              'I said Dokgu had the best hands for letting go. The beakfish splashed his face with its tail as it left, he said — no photo, but that one was his.'] }),
        ],
        note: ['돌돔을 재고, 석독구가 사진을 찍은 뒤 놓아줬다. 열일곱 장이 다 찼다. 석독구가 왜 우느냐고 물었고, 나는 안 운다고 했다.',
          'I measured the beakfish, Dokgu took the photo, and we let it go. All seventeen pages were full. Dokgu asked why I was crying, and I said I wasn\'t.'],
      }),
      opened: scene([
        line(K, '…어른들은 이상한 말을 해. 그래도 멋있어.', '...Grown-ups say weird things. It sounds cool, though.'),
        line(K, '그럼… 마지막 장에 내 이름 적어도 돼?', 'Then... can I write my name on the last page?'),
        line(P, '그래. 적어.', 'Sure. Write it.'),
      ], {
        end: endTalk({ complete: 'opened', lineKo: '진짜? 크게 쓸 거야. 아니, 작게. 아니, 그냥 잘 쓸게.', lineEn: "Really? I'll write it big. No, small. No — I'll just write it nicely." }),
        note: ['조행록은 닫은 게 아니라 연 거라고 했다. 석독구는 어른들은 이상한 말을 한다면서도, 마지막 장에 자기 이름을 적어도 되느냐고 물었다. 된다고 했다.',
          "I said I hadn't closed the log but opened it. Dokgu said grown-ups say weird things, then asked if he could write his name on the last page. I said yes."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M7-04 「사진 속 천막」 — 받는 자리(정옥선 · 병실)
  // ═══════════════════════════════════════════
  {
    id: 'm7_04_offer', questId: 'M7-04', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '왔냐. 앉아.', "You came. Sit."),
        line(P, '몸은 좀 어떠세요?', 'How are you feeling?'),
        line(O, '누워 있으니 낫다. 그보다, 사진 가져왔냐.', "Lying down helps. Never mind that — did you bring the photo?"),
        line(P, '조행록에 끼워져 있던 사진이요?', 'The one tucked into the fishing log?'),
        line(O, '그래. 그 사진. 이리 줘 봐.', 'Yes. That photo. Give it here.'),
        line(P, '네. 여기요. 제가 네 살 때 찍힌 거래요.', "Here. They say it was taken when I was four."),
        line(O, '…', '...', { act: 'receive' }),
        act(O, 'silence'),
        line(O, '그 천막, 내 거다.', 'That tent is mine.'),
        line(P, '…네?', '...Sorry?'),
        line(O, '만복상회. 22년 전. 그 천막 앞에 서 있는 꼬맹이가 너야.', 'Manbok Store. Twenty-two years ago. The little one standing in front of that tent is you.'),
      ], {
        choices: [
          opt('how', '22년 전에 저를 보셨다고요?', 'You saw me twenty-two years ago?', {
            say: ['22년 전에 저를 보셨다고요? 어떻게 기억하세요?', 'You saw me twenty-two years ago? How can you remember?'], next: 'how' }),
          opt('why', '…왜 이제야 말씀하세요?', '...Why tell me only now?', { next: 'why' }),
          opt('slow', '천천히 말씀해 주세요', 'Please, tell me slowly', {
            say: ['…천천히 말씀해 주세요.', '...Please, tell me slowly.'], next: 'slow' }),
        ],
        note: ['정옥선 씨가 조행록에 끼워져 있던 내 네 살 사진을 한참 들여다보더니, 사진 속 천막이 자기 것이라고 했다. 22년 전 만복상회 천막 앞에 서 있던 꼬맹이가 나였다.',
          "Okseon looked at my photo from age four — the one tucked into the log — for a long time, then said the tent in it was hers. The little one standing in front of the Manbok Store tent twenty-two years ago was me."],
      }),
      how: scene([
        line(O, '좌판 하는 사람은 얼굴을 안 잊는다.', 'People who run a stall never forget a face.'),
        line(O, '(사진 속 얼굴을 손가락으로 짚는다.)', '(She touches the face in the photo with one finger.)'),
        line(O, '그날 너는 울 것 같은 얼굴로 내 좌판 앞에 서 있었어.', 'That day you stood in front of my stall looking like you were about to cry.'),
        line(P, '저는… 기억이 안 나요.', "I... don't remember."),
        line(O, '얘기가 길다. 나머지는 도다리 한 마리 올리고 와서 들어. 네 살 때 서 있던 그 자리에서.', "It's a long story. Hear the rest after you bring up a flounder. From the spot where you stood when you were four."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_how' }),
        note: ['어떻게 기억하느냐고 물었다. 좌판 하는 사람은 얼굴을 안 잊는다고, 그날 나는 울 것 같은 얼굴이었다고 했다. 나머지는 네 살 때 서 있던 자리에서 도다리를 올리고 와서 들으라고 했다.',
          'I asked how she could remember. People who run a stall never forget a face, she said; that day I looked about to cry. The rest I would hear after bringing up a flounder from the spot where I stood at four.'],
      }),
      why: scene([
        line(O, '…조행록이 다 찼으니까. 열일곱 장.', '...Because the log is full. Seventeen pages.'),
        line(O, '그 전에 말했으면 너는 사진만 보고 살았을 거다. 바다는 안 보고.', "If I'd told you before, you'd have lived looking at the photo. Not at the sea."),
        act(O, 'silence'),
        line(O, '이제는 됐다. 네가 바다를 다 봤으니까. 이제는 사진을 봐도 된다.', "Now it's all right. You've seen the whole sea. Now you can look at the photo."),
        line(O, '그 전에 그 자리에 한 번 서 봐라. 네 살 때 서 있던 데서, 도다리 한 마리.', 'Before that, go and stand in that spot once. Where you stood at four. One flounder.'),
      ], {
        end: endTalk({ accept: true, offer: 'why_now' }),
        note: ['왜 이제야 말하느냐고 물었다. 그 전에 말했으면 나는 사진만 보고 바다는 안 봤을 거라고 했다. 그 전에 네 살 때 서 있던 자리에서 도다리 한 마리를 올려 오라고 했다.',
          "I asked why she was telling me only now. If she had told me before, she said, I'd have looked at the photo and not the sea. First I was to bring up a flounder from the spot where I stood at four."],
      }),
      slow: scene([
        line(O, '천천히 할 얘기가 아니라 오래 걸리는 얘기다.', "It's not a story to tell slowly. It's a story that takes long."),
        line(O, '이 천막 귀퉁이 보이냐. 비 새서 내가 덧댄 자리다.', 'See this corner of the tent? That\'s where I patched it when the rain came through.', { act: 'peer' }),
        line(P, '(정말… 만복상회 천막이다.)', "(It really is... the Manbok Store tent.)"),
        line(O, '얘기는 앉아서 하는 거고, 고기는 서서 하는 거지. 그 자리에서 도다리 한 마리 올리고 와. 얘기는 그다음이다.', "Stories you tell sitting down; fish you do standing up. Go bring up a flounder from that spot. The story comes after."),
      ], {
        choices: [
          opt('wait', '다녀와서 천천히 듣겠습니다', "I'll come back and hear it properly", {
            end: endTalk({ accept: true, offer: 'take_time' }) }),
          opt('first', '먼저 도다리부터 올려 오겠습니다', "I'll bring up the flounder first", {
            say: ['먼저 도다리부터 올려 오겠습니다. 그 자리에서요.', "I'll bring up the flounder first. From that spot."], next: 'first' }),
        ],
        note: ['정옥선 씨가 사진 속 천막 귀퉁이를 짚었다. 비가 새서 자기가 덧댄 자리라고 했다. 얘기는 그 자리에서 도다리를 올리고 온 다음이라고.',
          "Okseon pointed to a corner of the tent in the photo — where she had patched it when the rain came through. The story would come after I brought up a flounder from that spot."],
      }),
      first: scene([
        line(O, '그래, 그게 순서다.', "Right. That's the proper order.", { act: 'nod' }),
        line(O, '(사진을 베개 옆에 세워 둔다.)', '(She props the photo up beside her pillow.)'),
        line(O, '방파제는 바뀌었어도 물은 그대로다. 천천히 끌어. 다녀오면 다 말해 주마.', "The breakwater has changed, but the water is the same. Reel it in slowly. When you're back, I'll tell you everything."),
      ], {
        end: endTalk({ accept: true, offer: 'flounder_first' }),
        note: ['도다리부터 올려 오겠다고 했다. 정옥선 씨는 그게 순서라며 사진을 베개 옆에 세워 두었다. 다녀오면 다 말해 주겠다고 했다.',
          "I said I'd bring up the flounder first. Okseon said that was the proper order and propped the photo beside her pillow. When I got back, she would tell me everything."],
      }),
    },
  },

  // M7-04 — 끝내는 자리(정옥선)
  {
    id: 'm7_04_done', questId: 'M7-04', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(P, '그 자리에서 도다리 올렸어요. 사진도 같이 봤고요.', 'I brought up a flounder from that spot. And we looked at the photo together.'),
        line(O, '…봤지.', "...We did.", { act: 'look_away' }),
        line(O, '실습생이라고 배낭 하나 메고 내 좌판 앞에 섰을 때, 얼굴 보자마자 알았다.', "When you turned up at my stall as a trainee with one backpack, I knew the moment I saw your face."),
        line(P, '그래서 첫날 그렇게 말씀하셨던 거예요? 울 거면 얼음부터 나르고 울라고.', 'Is that why you said it on the first day? If you\'re going to cry, carry the ice first, then cry.'),
        line(O, '…그래서 얼음부터 나르라고 한 거야.', "...That's why I told you to carry the ice first."),
        line(O, '22년 전 그 애가 온 줄 알았으니까.', 'Because I knew the child from twenty-two years ago had come back.'),
      ], {
        choices: [
          opt('knew', '처음부터 아셨군요', 'You knew from the start', {
            say: ['처음부터 아셨군요.', 'You knew from the very start.'], next: 'knew' }),
          opt('thanks', '얼음 나르라고 해 주셔서 고맙습니다', 'Thank you for telling me to carry the ice', {
            end: endTalk({ complete: 'thanks',
              lineKo: '그게 고마울 일이냐. …그래, 고마워해라. 고마운 건 나다. 그 꼬맹이가 다시 와서 얼음 상자를 끝까지 안 떨어뜨리고 날랐으니까.',
              lineEn: "Is that something to thank me for? ...Fine, be grateful. I'm the grateful one. That little one came back and carried the ice crates all the way without dropping one." }),
            note: ['얼음을 나르라고 해 줘서 고맙다고 했다. 정옥선 씨는 웃으며, 고마운 건 자기라고 했다. 그 꼬맹이가 다시 와서 얼음 상자를 끝까지 날랐으니까.',
              'I thanked her for telling me to carry the ice. Okseon laughed and said she was the grateful one — that little one came back and carried the ice crates all the way.'] }),
          opt('spot', '네 살 때 서 있던 데서 올렸어요', 'I caught it where I stood at four', {
            say: ['그 자리에서 도다리를 올렸어요. 네 살 때 서 있던 데서요.', 'I brought up the flounder from that spot. Where I stood when I was four.'], next: 'spot' }),
        ],
        note: ['정옥선 씨는 내가 실습생으로 좌판 앞에 섰던 날, 얼굴을 보자마자 22년 전 그 아이인 줄 알았다고 했다. 첫날 얼음부터 나르라고 한 까닭이 그것이었다.',
          "Okseon said that the day I turned up at her stall as a trainee, she knew at once I was the child from twenty-two years ago. That was why she told me to carry the ice first."],
      }),
      knew: scene([
        line(O, '…알았지. 말 안 했지.', "...I knew. I didn't say."),
        line(O, '말하면 네가 도망갈 것 같아서.', 'I thought if I said, you would run away.'),
        line(O, '(사진을 돌려주지 않고 자기 베개 밑에 넣는다.)', '(Instead of giving the photo back, she slips it under her own pillow.)'),
      ], {
        end: endTalk({ complete: 'knew' }),
        note: ['처음부터 알았느냐고 했다. 말하면 내가 도망갈 것 같아서 말하지 않았다고 했다. 사진은 돌려주지 않고 자기 베개 밑에 넣었다.',
          "I said she had known all along. She hadn't told me, she said, because she thought I'd run. She kept the photo and slipped it under her pillow."],
      }),
      spot: scene([
        line(O, '…그 자리에서.', '...From that spot.'),
        act(O, 'silence'),
        line(O, '22년 동안 그 자리를 몇 번이나 봤는지 모른다. 이제 거기 서 있는 게 꼬맹이가 아니라 어부구나.', "I can't count how many times I've looked at that spot in twenty-two years. Now the one standing there isn't a little child — it's a fisher."),
      ], {
        end: endTalk({ complete: 'same_spot', lineKo: '잘 왔다. 정말 잘 왔다.', lineEn: "You did well to come. You really did." }),
        note: ['네 살 때 서 있던 자리에서 도다리를 올렸다고 했다. 정옥선 씨는 한참 말이 없다가, 이제 거기 서 있는 게 꼬맹이가 아니라 어부라고 했다. 잘 왔다고.',
          "I told her I caught the flounder where I stood at four. Okseon was silent a long while, then said the one standing there now is a fisher, not a child. You did well to come, she said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M7-05 「2층」 — 받는 자리(어촌계)
  // ═══════════════════════════════════════════
  {
    id: 'm7_05_offer', questId: 'M7-05', at: 'offer', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(C, '왔냐. 공동작업장 2층, 봤지.', "You're here. You've seen the second floor of the work shed."),
        line(P, '내려앉은 데요? 볼 때마다 그대로던데요.', 'The part that caved in? It looks the same every time I pass.'),
        line(C, '그거 세운다. 이번엔.', "We're putting it back up. This time."),
        line(P, '복구하신다고요?', "You're going to rebuild it?"),
        line(C, '자재, 인력, 기부. 셋 다 든다. 다 합치면 삼천만이다.', 'Materials, labor, donations. It takes all three. Thirty million won all told.'),
        line(P, '삼천만 원이요…', 'Thirty million won...'),
        line(C, '네가 모아.', 'You raise it.'),
        line(P, '제가요?', 'Me?'),
        line(C, '계원들이 도울 거다. 네가 준 만큼.', "The members will help. As much as you've given."),
      ], {
        choices: [
          opt('raise', '모아 오겠습니다', "I'll raise it", {
            say: ['삼천만 원, 모아 오겠습니다. 손님도 태우고 위판도 내고요.', "I'll raise the thirty million. I'll take passengers and put catches up at auction."], next: 'raise' }),
          opt('why', '2층은 왜 무너진 겁니까?', 'Why did the second floor collapse?', {
            say: ['2층은 왜 무너진 겁니까? 그동안 왜 못 고쳤습니까?', "Why did the second floor collapse? Why couldn't it be fixed all this time?"], next: 'why' }),
          opt('big', '삼천만은 너무 큽니다', 'Thirty million is too much', {
            say: ['삼천만은 너무 큽니다. 제 통장으로는 엄두가 안 납니다.', "Thirty million is too much. I can't even imagine it with what's in my account."], next: 'big' }),
        ],
        note: ['어촌계에서 공동작업장 2층을 이번에는 세운다고 했다. 자재와 인력과 기부를 합쳐 삼천만 원, 그걸 나더러 모으라고 했다. 계원들은 내가 준 만큼 도울 거라고.',
          "The co-op said they would rebuild the second floor of the work shed this time. Materials, labor and donations — thirty million won — and I was to raise it. The members would help as much as I had given."],
      }),
      raise: scene([
        line(C, '그래. 한 번에 모으려고 하지 마라. 큰돈은 작은 날이 모여서 된다.', "Good. Don't try to raise it all at once. Big money is small days added up."),
        line(C, '(장부 빈 쪽을 펼쳐 첫 줄에 날짜를 적는다.)', '(He opens the ledger to a blank page and writes the date on the first line.)'),
        line(C, '계원들은 말보다 장부를 본다. 날짜가 늘어나는 걸 보면 한 사람씩 지갑을 연다.', 'The members watch the ledger, not your words. When they see the dates add up, they open their wallets one by one.'),
      ], {
        choices: [
          opt('ok', '오늘부터 적어 가겠습니다', "I'll start filling it in today", {
            end: endTalk({ accept: true, offer: 'raise_it' }) }),
          opt('use', '2층이 서면 무엇으로 씁니까?', 'What will the second floor be for?', {
            say: ['2층이 서면 무엇으로 씁니까? 그걸 알아야 모으기 쉽습니다.', "What will the second floor be used for? It'll be easier to raise if I know."], next: 'use' }),
        ],
        note: ['모아 오겠다고 했다. 큰돈은 작은 날이 모여서 된다며, 장부 빈 쪽 첫 줄에 날짜를 적었다. 계원들은 말보다 장부를 본다고 했다.',
          "I said I'd raise it. Big money is small days added up, he said, and wrote the date on the first line of a blank ledger page. The members watch the ledger, not words."],
      }),
      use: scene([
        line(C, '계원들이 모여 앉을 자리. 그리고 지나온 기록을 둘 자리다. 조행록 같은 거.', 'A place for the members to sit together. And a place to keep the records of what has gone before. Fishing logs and the like.'),
        act(C, 'silence'),
        line(C, '낚시하러 온 사람들이 앉았다 갈 수 있으면 더 좋고. 이름은 다 서고 나서 붙이자.', "Even better if people who come to fish can sit there a while. We'll name it once it's standing."),
        line(C, '지금 붙이면 돈보다 말이 먼저 모인다.', 'Name it now, and talk will gather before money does.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_use' }),
        note: ['2층을 무엇으로 쓰느냐고 물었다. 계원들이 모여 앉고 지나온 기록을 둘 자리라고, 낚시하러 온 사람들도 앉았다 가면 좋겠다고 했다. 이름은 다 선 다음에 붙이자고.',
          'I asked what the second floor would be for. A place for members to sit and to keep old records, he said — and for visiting anglers to sit a while. The name could wait until it was standing.'],
      }),
      why: scene([
        line(C, '…오래된 얘기다. 이번엔 돈이 없고, 다음엔 사람이 없고.', "...It's an old story. One time there was no money, the next there were no people.", { act: 'look_away' }),
        line(C, '하나씩 미루다 보니 이렇게 됐다.', 'Putting it off one thing at a time, this is where it ended up.'),
        line(P, '다들 고쳐야 한다는 건 알았을 텐데요.', 'Everyone must have known it needed fixing.'),
        line(C, '알았지. 먼저 꺼내는 사람이 없었을 뿐이야. 이번엔 꺼낼 사람이 생겼다. 너다.', "They knew. There just wasn't anyone to bring it up first. This time there is someone. You."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_why' }),
        note: ['2층이 왜 무너졌느냐고 물었다. 돈이 없고 사람이 없어 하나씩 미루다 그렇게 됐다고, 다들 알았지만 먼저 꺼내는 사람이 없었다고 했다. 이번엔 그게 나라고.',
          'I asked why the second floor had collapsed. No money one time, no people the next, everything put off — everyone knew, but no one spoke first. This time, he said, that was me.'],
      }),
      big: scene([
        line(C, '혼자 내라는 게 아니다. 모으라는 거지.', "I'm not telling you to pay it alone. I'm telling you to gather it."),
        line(C, '(장부를 탁 덮는다.)', '(He shuts the ledger with a snap.)'),
        line(C, '자재는 계원들이 아는 데서 싸게 구하고, 손은 다들 보탠다. 네가 할 일은 그 판을 까는 거다.', "The members will find materials cheap through people they know, and everyone will lend a hand. Your job is to set the table."),
        line(P, '무엇을 팔고 무엇을 받을지부터 계산해 보겠습니다.', "I'll start by working out what to sell and what to take in."),
        line(C, '그래. 계산이 서면 엄두도 선다.', 'Good. Once the numbers stand up, so will your nerve.'),
      ], {
        end: endTalk({ accept: true, offer: 'too_big' }),
        note: ['삼천만은 너무 크다고 했다. 혼자 내라는 게 아니라 모으라는 거라며, 자재와 손은 계원들이 보태니 나는 판을 깔면 된다고 했다. 계산부터 해 보기로 했다.',
          "I said thirty million was too much. Not to pay it alone but to gather it, he said — the members would bring materials and hands, and I just had to set the table. I decided to start with the numbers."],
      }),
    },
  },

  // M7-05 — 끝내는 자리(어촌계)
  {
    id: 'm7_05_done', questId: 'M7-05', at: 'complete', npcId: C, start: 'start',
    nodes: {
      start: scene([
        line(P, '삼천만 원, 다 모였습니다.', 'The thirty million is all raised.'),
        line(C, '삼천. 됐다. 장부 맞춰 봤다.', "Thirty. Done. I've checked it against the ledger.", { act: 'nod' }),
        line(P, '계원분들이 조금씩 보태 주셨어요.', 'The members each chipped in a little.'),
        line(C, '네가 준 만큼 돌아온 거다.', "It came back to you as much as you'd given."),
        line(C, '이제 네가 주는 쪽이야. 허가증 받던 날 한 말, 기억하지.', "Now you're the one who gives. You remember what I said the day you got your permit."),
        line(P, '…네.', '...I do.'),
      ], {
        choices: [
          opt('hyeonsu', '도현수 씨가 제일 먼저 냈습니다', 'Hyeonsu gave first', {
            say: ['도현수 씨가 제일 먼저 냈습니다.', 'Hyeonsu was the very first to give.'], next: 'hyeonsu' }),
          opt('giver', '주는 쪽, 그 말 기억합니다', 'The one who gives — I remember', {
            say: ['주는 쪽. 그 말 기억합니다.', 'The one who gives. I remember those words.'],
            end: endTalk({ complete: 'giver',
              lineKo: '기억하면 됐다. 2층에 네 이름은 안 붙는다. 계 이름이 붙지. 주는 쪽은 이름을 안 남긴다. 받은 사람들이 기억하지.',
              lineEn: "If you remember, that's enough. Your name won't go on the second floor. The co-op's will. The one who gives leaves no name. The ones who received remember." }),
            note: ['주는 쪽이라는 그 말을 기억한다고 했다. 2층에는 내 이름이 아니라 계 이름이 붙는다고, 주는 쪽은 이름을 안 남기고 받은 사람들이 기억한다고 했다. 그게 맞다고 생각했다.',
              "I said I remembered the words — the one who gives. The co-op's name would go on the second floor, not mine, he said: the giver leaves no name, and those who received remember. I thought that was right."] }),
          opt('leftover', '남는 돈은 계 장부에 두세요', 'Keep any surplus in the co-op ledger', {
            say: ['모으고 남는 돈은 계 장부에 두세요. 다음 수리에 쓰시게요.', 'Keep whatever is left over in the co-op ledger. For the next repair.'], next: 'leftover' }),
        ],
        note: ['복구 기금 삼천만 원이 다 모였다고 알렸다. 계원들이 조금씩 보탰다고 하자, 내가 준 만큼 돌아온 거라며 이제는 내가 주는 쪽이라고 했다.',
          "I reported that the thirty million won for the repairs was all raised. When I said the members had each chipped in, he said it came back as much as I had given — and that now I was the one who gives."],
      }),
      hyeonsu: scene([
        line(C, '그 애가 그렇다. 말은 안 하고.', "That's how he is. Never says a word."),
        line('', '(기부자 명부 첫 줄에 도현수의 이름이 있다. 둘째 줄이 내 이름이다.)', "(Hyeonsu's name is on the first line of the donor list. Mine is on the second.)"),
        line(C, '표결 때도 먼저 손을 들더니 이번에도 먼저다. 그 애가 먼저 하면 뒤에 하는 사람들이 쉬워진다.', "At the vote he raised his hand first, and this time he's first again. When he goes first, it's easier for those who follow."),
      ], {
        end: endTalk({ complete: 'hyeonsu_first', lineKo: '할애비가 손자 칭찬하는 거 아니다. 사실이 그렇다는 거다.', lineEn: "That's not a grandfather praising his grandson. It's just how it is." }),
        note: ['도현수 씨가 제일 먼저 냈다고 했다. 기부자 명부 첫 줄이 도현수 씨, 둘째 줄이 나였다. 손자 칭찬이 아니라 사실이 그렇다는 거라고 했다.',
          "I said Hyeonsu was the first to give. His name was on the first line of the donor list, mine on the second. It wasn't a grandfather's praise, he said — just the fact."],
      }),
      leftover: scene([
        line(C, '…다음 수리.', '...The next repair.'),
        line(C, '그 말을 하는 놈이 있으면 2층은 다시 안 무너진다. 무너진 채 둔 건 돈이 없어서만이 아니라 다음을 생각하는 사람이 없어서였다.', "As long as someone says that, the second floor won't fall again. It stayed broken not just for lack of money, but because no one thought about next time."),
        line(C, '(장부 맨 뒤에 새 칸을 하나 만든다.)', '(He makes a new column at the very back of the ledger.)'),
      ], {
        end: endTalk({ complete: 'leftover', lineKo: '이 칸 이름은 네가 붙여라.', lineEn: 'You name this column.' }),
        note: ['남는 돈은 다음 수리에 쓰게 계 장부에 두라고 했다. 다음을 생각하는 사람이 있으면 2층은 다시 안 무너진다며, 장부 맨 뒤에 새 칸을 만들고 이름은 나더러 붙이라고 했다.',
          'I asked them to keep any surplus in the ledger for the next repair. As long as someone thinks of next time, the floor won\'t fall again, he said — and he made a new column at the back of the ledger for me to name.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M7-06 「재개관」 — 받는 자리(정옥선)
  // ═══════════════════════════════════════════
  {
    id: 'm7_06_offer', questId: 'M7-06', at: 'offer', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '왔냐. 들었지. 재개관식.', 'You came. You heard. The reopening.'),
        line(P, '네. 2층 자료관이요. 낚시방도 같이 연다고 들었어요.', 'Yes. The archive on the second floor. I heard the anglers\' room is opening with it.'),
        line(O, '테이프는 내가 자른다.', "I'm cutting the tape."),
        line(P, '직접 나오신다고요?', "You're coming yourself?"),
        line(O, '휠체어로 가면 돼. 너는 옆에서 가위나 쥐여 줘.', 'I can go in the wheelchair. You just stand beside me and put the scissors in my hand.'),
        line(O, '손 떨려도 자른다. 그건 걱정 마라.', "Even if my hands shake, I'll cut it. Don't you worry about that."),
        line(P, '…', '...'),
        line(O, '그리고 상에 올릴 회. 세 접시. 그건 네가 떠라.', "And the sashimi for the table. Three plates. That you'll slice."),
      ], {
        choices: [
          opt('push', '휠체어는 제가 밀겠습니다', "I'll push the wheelchair", {
            say: ['가위는 제가 쥐여 드리겠습니다. 휠체어도 제가 밀겠습니다.', "I'll put the scissors in your hand. And I'll push the wheelchair too."], next: 'push' }),
          opt('health', '몸은 정말 괜찮으세요?', 'Are you really well enough?', {
            say: ['몸은 정말 괜찮으세요? 식에 나오셔도 됩니까?', 'Are you really well enough? Is it all right for you to come to the ceremony?'], next: 'health' }),
          opt('cry', '자르시는 걸 보면 울 것 같아요', "I think I'll cry watching you cut it", {
            say: ['테이프 자르시는 걸 보면, 제가 울 것 같습니다.', "When I see you cut the tape, I think I'll cry."], next: 'cry' }),
        ],
        note: ['정옥선 씨가 재개관식 테이프는 휠체어를 타고 가서 자기가 자르겠다고 했다. 나는 옆에서 가위를 쥐여 드리고, 상에 올릴 회 세 접시를 떠야 한다.',
          "Okseon said she would go to the reopening in her wheelchair and cut the tape herself. My job was to put the scissors in her hand and slice three plates of sashimi for the table."],
      }),
      push: scene([
        line(O, '휠체어는 밀어도 되는데, 테이프 앞에서는 손 놔. 거기서부터는 내가 간다.', 'You can push the wheelchair, but let go in front of the tape. From there, I go myself.'),
        line(O, '(무릎 위 담요를 고쳐 덮는다.)', '(She straightens the blanket over her knees.)'),
        line(O, '자르는 건 손이 아니라 마음이 하는 거다. 손이 떨려도 마음이 안 떨리면 잘린다.', "It isn't the hand that cuts, it's the heart. If the heart holds steady, it'll cut even with a shaking hand."),
      ], {
        choices: [
          opt('ok', '가위만 잘 쥐여 드릴게요', "I'll just hand you the scissors", {
            say: ['알겠습니다. 가위만 잘 쥐여 드릴게요.', "Understood. I'll just put the scissors in your hand."],
            end: endTalk({ accept: true, offer: 'push_chair' }) }),
          opt('together', '손이 떨리시면 같이 잡고 자를까요?', 'If your hands shake, shall we cut it together?', { next: 'together' }),
        ],
        note: ['휠체어는 밀어도 되지만 테이프 앞에서는 손을 놓으라고 했다. 자르는 건 손이 아니라 마음이 하는 거라고.',
          "I could push the wheelchair, she said, but let go in front of the tape. It isn't the hand that cuts, it's the heart."],
      }),
      together: scene([
        line(O, '됐다. 그건 네가 나중에 네 테이프 자를 때 해라. 이건 내 거다.', "No need. Do that later, when you cut your own tape. This one is mine."),
        line(O, '(가위를 쥐는 시늉을 해 보인다.)', '(She mimes gripping a pair of scissors.)'),
        line(O, '떨리는 손으로 자른 테이프가 더 오래 기억난다. 반듯하게 잘리면 아무도 기억 안 해. 그러니 그냥 쥐여만 줘.', "A tape cut with a shaking hand is remembered longer. Cut it clean and nobody remembers. So just put them in my hand."),
      ], {
        end: endTalk({ accept: true, offer: 'hold_together' }),
        note: ['손이 떨리면 같이 잡고 자르자고 했다가 거절당했다. 그건 내가 나중에 내 테이프를 자를 때 하라고, 떨리는 손으로 자른 테이프가 더 오래 기억난다고 했다.',
          "I offered to cut it together if her hands shook, and she refused. Save that for when I cut my own tape, she said — a tape cut with a shaking hand is remembered longer."],
      }),
      health: scene([
        line(O, '요양 끝났다. 나가도 된다고 했어. 오래 서 있지만 말래. 그래서 휠체어다.', "My recovery's done. They said I can go out. Just not stand for long. Hence the wheelchair."),
        line(O, '(휠체어 바퀴를 손바닥으로 툭 친다.)', '(She gives the wheel of her chair a pat with her palm.)'),
        line(O, '이 식에 안 나가면 그게 더 병이 된다. 걱정은 접어 두고 회나 잘 떠 둬.', 'Missing this ceremony would make me sicker. Fold up your worrying and slice the sashimi well.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_health' }),
        note: ['몸이 정말 괜찮으냐고 물었다. 요양은 끝났고 오래 서 있지만 말라고 해서 휠체어라고, 이 식에 안 나가면 그게 더 병이 된다고 했다.',
          "I asked if she was really well enough. Her recovery was done, she said; she just couldn't stand for long, hence the wheelchair — and missing this ceremony would make her sicker."],
      }),
      cry: scene([
        line(O, '…울 거면 회부터 떠 놓고 울어. 세 접시.', '...If you\'re going to cry, slice the sashimi first, then cry. Three plates.'),
        act(O, 'laugh'),
        line(O, '개관식 상이 비면 손님들이 내 탓 한다. 다 떠 놓고, 테이프 잘리는 거 보고, 그다음에 울든 말든.', "If the opening table's empty, the guests will blame me. Slice it all, watch the tape get cut, and cry after that if you like."),
        line(O, '나는 안 운다. 아마.', "I won't cry. Probably."),
      ], {
        end: endTalk({ accept: true, offer: 'will_cry' }),
        note: ['테이프 자르는 걸 보면 울 것 같다고 했다. 정옥선 씨는 울 거면 회부터 떠 놓고 울라며 웃었다. 자기는 안 운다고 했다. 아마.',
          "I said I would probably cry watching her cut the tape. Okseon laughed and said to slice the sashimi first if I was going to cry. She wouldn't cry, she said. Probably."],
      }),
    },
  },

  // M7-06 — 끝내는 자리(정옥선)
  {
    id: 'm7_06_done', questId: 'M7-06', at: 'complete', npcId: O, start: 'start',
    nodes: {
      start: scene([
        line(O, '…잘랐지.', '...I cut it.'),
        line(P, '잘 자르셨어요. 반듯하게요.', 'You cut it well. Straight across.'),
        line(O, '봤지. 박수 소리.', 'You saw. The applause.'),
        line(O, '이제 이 방은 네 거다. …아니, 다들 거다.', "Now this room is yours. ...No. It's everyone's."),
        line(P, '이제 어디로 가시게요?', 'Where will you go now?'),
        line(O, '나는 좌판으로 간다.', "I'm going back to my stall."),
      ], {
        choices: [
          opt('scissors', '가위 쥐여 드릴 때 손이 떨렸습니다', 'My hands shook handing you the scissors', {
            say: ['가위를 쥐여 드릴 때 손이 떨렸습니다. 정옥선 씨 손도요.', 'My hands were shaking when I gave you the scissors. Yours were too, Okseon.'], next: 'scissors' }),
          opt('all', '이 방은 다들 것입니다', 'This room belongs to everyone', { next: 'all' }),
          opt('ice', '좌판 얼음은 제가 먼저 깔아 둘게요', "I'll lay the ice at your stall first", {
            say: ['좌판으로 가실 때 얼음은 제가 먼저 깔아 두겠습니다.', "When you go back to the stall, I'll have the ice laid out first."],
            end: endTalk({ complete: 'lay_ice',
              lineKo: '…그건 원래 네 일이었지. 처음부터. 좌판 앞은 휠체어 들어갈 만큼만 비워 둬. 앉아서라도 내 좌판은 내가 본다.',
              lineEn: "...That was always your job. From the very start. Leave just enough room in front of the stall for the wheelchair. Sitting or not, I mind my own stall." }),
            note: ['좌판으로 가실 때 얼음은 내가 먼저 깔아 두겠다고 했다. 정옥선 씨는 그건 처음부터 내 일이었다며 웃었다. 앉아서라도 좌판은 자기가 본다고 했다.',
              "I said I'd lay out the ice before she got back to the stall. Okseon laughed — that had been my job from the start. Sitting or not, she said, she would mind her own stall."] }),
        ],
        note: ['정옥선 씨가 휠체어에 앉아 재개관식 테이프를 잘랐다. 박수 소리가 났다. 이제 이 방은 다들 것이라며, 자기는 좌판으로 간다고 했다.',
          "Okseon cut the reopening tape from her wheelchair, and the applause came. The room was everyone's now, she said, and she was going back to her stall."],
      }),
      scissors: scene([
        line(O, '둘 다 떨렸으면 됐다.', 'If we both shook, then good.'),
        line('', '(정옥선 씨가 휠체어에서 내 손을 잡는다. 오래.)', '(From her wheelchair, Okseon takes my hand. For a long time.)'),
        line(O, '한 사람만 떨렸으면 테이프가 비뚤게 잘렸을 거다. 둘이 같이 떨리니까 반듯하게 잘렸지.', "If only one of us had shaken, the tape would have been cut crooked. Because we shook together, it came out straight."),
      ], {
        end: endTalk({ complete: 'scissors', lineKo: '…그런 거다, 사람 일이.', lineEn: "...That's how it is, with people." }),
        note: ['가위를 쥐여 드릴 때 둘 다 손이 떨렸다고 했다. 정옥선 씨는 내 손을 오래 잡고, 둘이 같이 떨리니까 반듯하게 잘린 거라고 했다.',
          "I said both our hands had shaken over the scissors. Okseon held my hand a long time and said it came out straight because we shook together."],
      }),
      all: scene([
        line(O, '그렇게 말하는 놈이 오래 간다. 처음부터 그랬어.', 'People who say that last long. You were like that from the start.'),
        line('', '(뒤에 서 있던 탁만수 씨가 고개를 끄덕인다.)', '(Behind us, Mansu gives a nod.)'),
      ], {
        end: endTalk({ complete: 'all',
          lineKo: '내 것 네 것 따지는 놈은 방을 가두고, 다들 거라는 놈은 방을 연다. 오늘 박수 소리가 그 소리다.',
          lineEn: "Those who keep score of mine and yours lock a room up; those who say it's everyone's open it. That applause today was that sound." }),
        note: ['이 방은 다들 것이라고 했다. 정옥선 씨는 그렇게 말하는 사람이 오래 간다고 했고, 뒤에 서 있던 탁만수 씨가 고개를 끄덕였다.',
          "I said this room belonged to everyone. Okseon said people who say that last long, and Mansu, standing behind us, nodded."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M7-07 「마지막 캐스팅」 — 받는 자리(탁새벽 · 독도)
  // ═══════════════════════════════════════════
  {
    id: 'm7_07_offer', questId: 'M7-07', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '왔어? 이거 봐. 대야.', "You're here? Look at this. It's the rod.", { act: 'look_up' }),
        line(P, '이건… 아버지 대?', "This is... my father's rod?"),
        line(S, '응. 부러진 마디에 새 대나무 이었어.', 'Yeah. I joined new bamboo onto the broken section.'),
        line(S, '할아버지가 손 놓고 내가 마무리했어.', 'Grandpa let go of it, and I finished it.'),
        line(P, '마지막 마디는 네가 깎은 거야?', 'You carved the last section yourself?'),
        line(S, '응. 이걸로 던져. 독도에서.', 'Yeah. Cast with it. At Dokdo.'),
        line(P, '독도 어디서?', 'Where at Dokdo?'),
        line(S, '조사선 다니던 데 있잖아. 거기 이제 아무나 던져도 된대. 영영.', 'You know where the survey boat used to go? Anyone can cast there now. For good.'),
        line(S, '거기서 한 번. 마지막으로.', 'Cast there once. The last one.'),
      ], {
        choices: [
          opt('take', '받을게. 독도에서 꼭 던지마', "I'll take it. I'll cast it at Dokdo", {
            say: ['받을게. 네가 이은 마디, 독도에서 꼭 던지마.', "I'll take it. The section you joined — I'll cast it at Dokdo, I promise."], next: 'take' }),
          opt('grandpa', '탁만수 씨가 손을 놓으셨다고?', 'Mansu let go of it?', {
            say: ['탁만수 씨가 손을 놓으셨다고? 무슨 일 있으셨어?', 'Mansu let go of it? Did something happen to him?'], next: 'grandpa' }),
          opt('retire', '마지막이라니, 나 은퇴시키려고?', 'The last one? Trying to retire me?', {
            say: ['마지막이라니, 너 나 은퇴시키려는 거냐?', 'The last one? Are you trying to retire me?'], next: 'retire' }),
        ],
        note: ['탁새벽이 아버지의 릴대를 내밀었다. 부러진 마디에 새 대나무를 잇고, 마지막 마디는 자기가 깎았다고 했다. 이제 누구나 던질 수 있게 된 독도 조사선 해역에서, 이 대로 마지막으로 던지라고 했다.',
          "Saebyeok held out my father's reel rod. He had joined new bamboo onto the broken section and carved the last part himself. Cast it once more, he said — the last one — in the Dokdo survey waters, now open to everyone."],
      }),
      take: scene([
        line(S, '응. 던질 때 마디 쪽은 보지 마. 보면 겁나서 힘을 빼게 돼.', "Okay. Don't look at the joint when you cast. If you look, you'll get scared and ease off."),
        line(S, '(대를 두 손으로 건넨다.)', '(He hands over the rod with both hands.)'),
        line(S, '이음새는 안 부러져. 내가 백 번은 휘어 봤어. 반은 할아버지 거고 반은 내 거야.', "The joint won't break. I've bent it a hundred times. Half of it's Grandpa's, half of it's mine."),
      ], {
        choices: [
          opt('ok', '알았어. 세게 던질게', "Got it. I'll cast hard", {
            end: endTalk({ accept: true, offer: 'take_rod' }) }),
          opt('breaks', '아버지 대를… 부러지면 어떡하지', "My father's rod... what if it breaks?", {
            say: ['아버지 대를 독도에서 던진다니… 부러지면 어떡하지.', "Casting my father's rod at Dokdo... what if it breaks?"], next: 'breaks' }),
        ],
        note: ['대를 두 손으로 받았다. 던질 때 마디 쪽은 보지 말라고, 이음새는 백 번은 휘어 봤으니 안 부러진다고 했다. 반은 탁만수 씨 것이고 반은 자기 것이라고.',
          "I took the rod in both hands. Don't look at the joint when you cast, he said; he'd bent it a hundred times and it wouldn't break. Half of it was his grandfather's, half his."],
      }),
      breaks: scene([
        line(S, '안 부러진다니까!', "I said it won't break!"),
        line(S, '…부러지면 내가 또 이으면 돼.', "...If it breaks, I'll just join it again."),
        line(S, '대는 부러지는 거야. 부러져도 다시 이을 사람이 있으면 그 대는 안 끝난 거야.', "Rods break. But if there's someone to join it again, that rod isn't finished."),
        line(S, '그러니까 던져. 세게.', 'So cast it. Hard.'),
      ], {
        end: endTalk({ accept: true, offer: 'if_breaks' }),
        note: ['부러지면 어떡하느냐고 했다. 탁새벽은 부러지면 또 이으면 된다고, 다시 이을 사람이 있으면 그 대는 안 끝난 거라고 했다. 세게 던지라고.',
          "I asked what if it broke. Then he'd join it again, Saebyeok said — as long as someone will join it again, a rod isn't finished. Cast it hard."],
      }),
      grandpa: scene([
        line(S, '그런 거 아니야. 할아버지가 그랬어. 이건 네가 끝내야 하는 대라고.', "It's nothing like that. Grandpa said this is a rod I have to finish."),
        line(S, '마지막 마디 앞에서 칼을 나한테 줬어. 그러고는 뒤에 앉아서 보기만 했어.', 'At the last section he gave me the knife. Then he just sat behind me and watched.'),
        line(P, '그랬구나.', 'I see.'),
        line(S, '손을 놓은 게 아니라 나한테 넘긴 거야. 할아버지는 그렇게 말 안 했지만.', "He didn't let go. He handed it to me. Not that Grandpa said so."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_grandpa' }),
        note: ['탁만수 씨가 손을 놓았다는 말에 무슨 일이 있었느냐고 물었다. 마지막 마디 앞에서 칼을 넘겨주고 뒤에서 지켜보기만 했다고, 손을 놓은 게 아니라 넘긴 거라고 했다.',
          "When he said Mansu had let go, I asked if something had happened. At the last section his grandfather handed him the knife and only watched from behind, Saebyeok said. He didn't let go — he handed it on."],
      }),
      retire: scene([
        line(S, '아니! 마지막 캐스팅이라는 거지, 마지막 낚시가 아니야.', "No! It's the last cast, not the last time fishing."),
        line(S, '이 대로 던지는 첫 번째도 되고, 독도에서 던지는 마지막도 되고. 둘 다야.', "It's the first cast with this rod, and the last cast at Dokdo. Both."),
        line(S, '어른들은 왜 마지막 소리만 들어?', 'Why do grown-ups only hear the word last?'),
      ], {
        end: endTalk({ accept: true, offer: 'retire_joke' }),
        note: ['나를 은퇴시키려는 거냐고 농담했다. 탁새벽은 발을 구르며, 마지막 캐스팅이지 마지막 낚시가 아니라고 했다. 이 대로 던지는 첫 번째이기도 하다고.',
          "I joked that he was trying to retire me. Saebyeok stamped his foot — the last cast, not the last time fishing. It would also be the first cast with this rod."],
      }),
    },
  },

  // M7-07 — 끝내는 자리(탁새벽)
  {
    id: 'm7_07_done', questId: 'M7-07', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '…올라왔어.', '...It came up.'),
        line(P, '올라왔다.', 'It did.'),
        line(S, '그 대로. 내가 이은 마디로.', 'With that rod. With the section I joined.'),
        line(S, '안 부러졌지? 봐, 이음새 그대로야.', "It didn't break, right? Look, the joint's just the same.", { act: 'peer' }),
        line(P, '끝까지 버텼어.', 'It held all the way.'),
        line(S, '근데… 이거 내 대야, {player} 씨 대야?', "But... is this my rod, or yours, {player}?"),
      ], {
        choices: [
          opt('yours', '네 대다. 네가 이었으니까', "It's yours. You joined it", {
            say: ['네 대다. 네가 이었으니까.', "It's your rod. You're the one who joined it."], next: 'yours' }),
          opt('ours', '우리 대다', "It's ours", {
            say: ['우리 대다. 아버지가 시작하고, 탁만수 씨가 봐 주고, 네가 이었으니.', "It's ours. My father started it, Mansu looked after it, and you joined it."], next: 'ours' }),
          opt('no_species', '종은 안 적을게', "I won't write down the species", {
            say: ['종은 안 적을게. 이건 조사가 아니라 낚시니까.', "I won't write down the species. This was fishing, not a survey."],
            end: endTalk({ complete: 'no_species',
              lineKo: '…응. 적지 마. 적으면 숫자가 돼. 나도 대 깎을 때 몇 번째인지 안 세. 오늘 올라온 건 그냥 오늘 거야.',
              lineEn: "...Yeah. Don't. If you write it, it turns into a number. I don't count which rod I'm on when I carve, either. What came up today is just today's." }),
            note: ['종은 적지 않겠다고 했다. 이건 조사가 아니라 낚시니까. 탁새벽은 적으면 숫자가 된다며, 오늘 올라온 건 그냥 오늘 것이라고 했다.',
              "I said I wouldn't write down the species — this was fishing, not a survey. Saebyeok said writing it turns it into a number; what came up today is just today's."] }),
        ],
        note: ['되살린 아버지의 대로 독도에서 한 마리를 올렸다. 탁새벽이 이은 마디는 끝까지 버텼다. 아이는 이게 자기 대냐, 내 대냐고 물었다.',
          "With my father's restored rod I brought up a fish at Dokdo. The section Saebyeok joined held all the way. He asked whether it was his rod or mine."],
      }),
      yours: scene([
        line(S, '…아니야. {player} 씨 아버지 대야. 나는 이은 거고.', "...No. It's your father's rod, {player}. I only joined it.", { act: 'shake_head' }),
        line(S, '내 대는 따로 있어. 내가 처음부터 깎은 거.', 'My rod is a different one. One I carved from the very start.'),
      ], {
        end: endTalk({ complete: 'yours', lineKo: '그게 내 대야.', lineEn: "That one's my rod." }),
        note: ['네가 이었으니 네 대라고 했다. 탁새벽은 고개를 저으며, 이건 아버지 대고 자기 대는 처음부터 자기가 깎은 거라고 했다.',
          "I said it was his rod because he joined it. Saebyeok shook his head: this was my father's rod, and his own was the one he carved from the start."],
      }),
      ours: scene([
        line(S, '…우리 대. 좋아.', '...Our rod. Okay.'),
        line('', '(새벽이가 손잡이 옆에 「새벽」이라고 작게 새긴다. 그 옆에 내 이름도.)', "(Saebyeok carves his name small beside the grip. Then mine next to it.)"),
        line(S, '아버지 이름은 안 새겨도 돼. 처음부터 들어 있어. 손잡이 흠집. 그게 이름이야.', "We don't need to carve your father's name. It's been there from the start. The scratches on the grip. That's the name."),
      ], {
        end: endTalk({ complete: 'ours', lineKo: '우리는 그 옆에만 쓰면 돼.', lineEn: 'We only have to write beside it.' }),
        note: ['우리 대라고 했다. 탁새벽은 손잡이 옆에 자기 이름과 내 이름을 작게 새겼다. 아버지 이름은 손잡이 흠집으로 처음부터 들어 있다고 했다.',
          "I said it was our rod. Saebyeok carved his name and mine small beside the grip. My father's name, he said, had been there from the start — in the scratches on the grip."],
      }),
    },
  },
];
