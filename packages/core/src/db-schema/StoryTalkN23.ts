/**
 * @file StoryTalkN23.ts
 * @description 290차 — 곁가지 「채수림 — 세는 사람」(N23-1 ~ N23-6) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md` · 기준 = `StoryTalkN01.ts`(286차 시범).
 *
 * 인물: 채수림(33 · 수산질병 · 양식 관리사 · 짧고 정확한 해요체 · 「규정대로」 · 「느낌 말고 숫자로요」 ·
 *   토막 말(「…특. 됐어요.」) · 농담은 잘 받지 않고 웃음은 작다 · 주인공을 「당신」이라 부른다 · 담배는 피우지 않는다).
 * 주인공은 「채수림 씨」라고 부른다(영어 Su-rim). 관리사 앞이라 말끝이 조금 더 단정하다(합니다 · 해요 섞음).
 * 받는 끝은 옛 받는 답(`end.offer`)에, 끝내는 끝은 옛 보상 답(`end.complete`)에 묶는다 — 옛 표시(`choice.n23_*`)는 묶인 답이 남긴다.
 * 새 표시는 만들지 않는다. 물러서는 길: N23-1(때가 있는 곁가지) 옛 미루는 답 · N23-3 「칼부터 마련하고 다시」(미루기) ·
 * N23-5 「40종은 못 하겠다」(거절 = 실패).
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const CS = 'chae_surim';
const P = 'player';

export const TALKS_N23: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N23-1 「탈출한 광어」 — 받는 자리 (태풍 뒤 — 때가 있는 곁가지)
  // ═══════════════════════════════════════════
  {
    id: 'n23_1_offer', questId: 'N23-1', at: 'offer', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(CS, '실례지만, 여기서 낚시하세요?', 'Excuse me — do you fish around here?', { act: 'look_up' }),
        line(P, '네. 무슨 일 있으세요?', 'Yes. Is something wrong?'),
        line(CS, '수산질병 관리사 채수림이에요. 태풍에 앞바다 가두리가 터졌어요.', "I'm Chae Su-rim, an aquaculture health inspector. The typhoon burst the fish pens offshore."),
        line(P, '그럼 안에 있던 물고기들은요?', 'Then the fish that were in them?'),
        line(CS, '나갔죠. 대부분 광어예요. 탈출한 걸 세야 해요.', 'Got out. Mostly flounder. I need to count the escapees.'),
        line(P, '바다로 나간 걸 어떻게 세요?', 'How do you count fish that are out in the sea?'),
        line(CS, '잡아서요. 광어 세 마리만 잡아서 계측해 주세요. 길이, 무게.', 'By catching them. Catch three flounder and measure them for me. Length, weight.'),
        line(P, '잡은 게 양식인지 자연산인지는 어떻게 가려요?', 'And how do I tell whether one is farmed or wild?'),
        line(CS, '양식은 지느러미가 닳아 있어요. 비만도도 이상하게 높고요.', 'Farmed ones have worn fins. And their condition factor is oddly high.'),
        line(CS, '잡아서 가져오면 같이 가려요.', "Bring them to me and we'll sort them together."),
      ], {
        choices: [
          opt('go', '지금 세어야겠군요. 하겠습니다', 'It has to be counted now. I will do it', {
            say: ['태풍 뒤라면 지금 세어야 하겠군요. 하겠습니다.', "Right after a typhoon, it has to be counted now. I'll do it."], next: 'go' }),
          opt('condition', '물고기한테도 살찐 게 있어요?', 'Fish can be fat too?', {
            say: ['비만도요? 물고기한테도 살찐 게 있어요?', 'Condition factor? Fish can be fat too?'], next: 'condition' }),
          opt('not_now', '지금은 어렵겠습니다', "I can't right now", {
            say: ['지금은 어렵습니다. 다음 태풍 뒤에 다시 불러 주세요.', "I can't right now. Call on me again after the next typhoon."], next: 'later' }),
        ],
        note: ['수산질병 관리사 채수림 씨를 만났다. 태풍에 앞바다 가두리가 터져 탈출한 광어를 세야 한다며, 광어 세 마리를 잡아 계측해 오면 양식인지 같이 가리자고 했다. 양식은 지느러미가 닳고 비만도가 높다고 했다.',
          'I met Chae Su-rim, an aquaculture health inspector. The typhoon had burst the offshore pens and she needed to count the escaped flounder. Catch and measure three, she said, and we would sort out the farmed ones together — farmed fish have worn fins and a high condition factor.'],
      }),
      go: scene([
        line(CS, '맞아요. 지금이에요.', 'Right. Now.', { act: 'nod' }),
        line(CS, '며칠 지나면 흩어져요. 양식이든 자연산이든 다 섞이면 셀 수가 없어요.', "In a few days they'll scatter. Once farmed and wild are all mixed, there's no counting them."),
        line(P, '잡으면 바로 볼 데가 있어요?', 'Is there something I should check as soon as I catch one?'),
        line(CS, '상세보기부터 열어요. 비만도 칸이요.', 'Open the details first. The condition factor line.'),
      ], {
        end: endTalk({ accept: true, offer: 'go' }),
        note: ['지금 세어야 한다는 말에 하겠다고 했다. 며칠 지나면 다 섞인다며, 잡으면 상세보기의 비만도부터 보라고 했다.', 'I agreed, since it had to be counted now. In a few days they would all be mixed, she said — once I caught one, check the condition factor in the details first.'],
      }),
      condition: scene([
        line(CS, '있어요. 같은 길이인데 더 무거우면 비만도가 높은 거예요.', 'They can. Same length but heavier means a higher condition factor.'),
        line(CS, '양식은 사료를 배불리 먹고 자라서 몸이 두꺼워요. 자연산은 먹이를 찾아 헤엄쳐야 하니까 날씬하고요.', "Farmed fish grow up full of feed, so they're thick. Wild ones have to swim around hunting, so they're lean."),
        line(P, '상세보기에 나와요?', 'Does it show in the details?'),
        line(CS, '나와요. 이상하게 높으면 양식이에요. 세 마리요.', "It does. If it's oddly high, it's farmed. Three fish."),
      ], {
        choices: [
          opt('ok', '세 마리, 재 오겠습니다', "I'll measure three", { end: endTalk({ accept: true, offer: 'ask_condition' }),
            note: ['비만도가 뭐냐고 물었다. 같은 길이에 더 무거우면 높은 것이고, 사료를 먹고 자란 양식은 몸이 두껍다고 했다.', 'I asked what a condition factor was. Heavier at the same length means higher, she said — farmed fish raised on feed are thick.'] }),
          opt('price', '양식이면 더 비싸게 쳐 주지 않아요?', "Don't farmed ones fetch more?", {
            say: ['양식이면 오히려 비싸게 쳐 주는 거 아니에요?', "Wouldn't farmed fish fetch a better price, if anything?"], next: 'price' }),
        ],
      }),
      price: scene([
        line(CS, '반대예요. 자연산이 더 비싸요.', 'The opposite. Wild fetches more.', { act: 'shake_head' }),
        line(P, '아, 그럼 섞이면…', 'Ah, so if they get mixed...'),
        line(CS, '곤란해요. 양식을 자연산이라고 내놓는 일이 생기거든요.', "That's the problem. Farmed fish get sold as wild."),
        line(CS, '그러니까 가려야 해요. 비만도, 지느러미. 느낌 말고 숫자로요.', 'So they have to be sorted. Condition factor, fins. With numbers, not feelings.'),
      ], {
        end: endTalk({ accept: true, offer: 'price_joke' }),
        note: ['양식이 더 비싸지 않으냐고 물었다가 반대라는 답을 들었다. 섞이면 양식이 자연산으로 팔리니, 느낌 말고 숫자로 가려야 한다고 했다.', 'I asked if farmed fish fetched more and heard the opposite. If they mix, farmed fish get sold as wild — so sort them by numbers, not feelings.'],
      }),
      later: scene([
        act(CS, 'silence'),
        line(CS, '…네. 태풍은 또 오니까요.', "...All right. There'll be another typhoon."),
        line(CS, '이번에 나간 건 이번에 세야 하는데, 괜찮아요. 다른 사람을 찾아볼게요.', "What got out this time has to be counted this time, but it's fine. I'll find someone else."),
        line(CS, '다음 태풍 뒤엔 먼저 연락할게요.', "After the next typhoon, I'll get in touch first."),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['지금은 어렵다고 했다. 채수림 씨는 이번 것은 다른 사람을 찾겠다며, 다음 태풍 뒤에 먼저 연락하겠다고 했다.', "I said I couldn't right now. Su-rim said she would find someone else for this one, and get in touch first after the next typhoon."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-1 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_1_done', questId: 'N23-1', at: 'complete', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(P, '채수림 씨, 광어 세 마리 잡아서 쟀어요.', 'Su-rim, I caught three flounder and measured them.'),
        line(CS, '숫자부터 줘요.', 'Numbers first.', { act: 'look_up' }),
        line(P, '길이랑 무게 다 적었어요. 그런데 이 한 마리는 지느러미 끝이 닳아 있었어요.', 'I wrote down length and weight for each. But this one had worn fin tips.'),
        line(CS, '비만도도 높네요. 같은 길이 두 마리보다 한참 무거워요.', 'Its condition factor is high, too. Much heavier than the other two at the same length.', { act: 'peer' }),
        line(CS, '이 개체는 양식이네요. 잘 가려냈어요.', "This one's farmed. Good sorting."),
        line(P, '바다에서 잡았는데도 출신이 있네요.', 'Caught in the open sea, and it still has somewhere it came from.'),
        line(CS, '있죠. 표에 적을게요.', "It does. I'll put it in the table.", { act: 'nod' }),
      ], {
        choices: [
          opt('data', '가리는 기준, 더 배우고 싶습니다', "I'd like to learn more about how to tell them apart", {
            say: ['양식과 자연산을 가리는 기준, 더 배우고 싶습니다.', "I'd like to learn more about how to tell farmed from wild."],
            end: endTalk({ complete: 'data',
              lineKo: '지느러미, 비만도, 그리고 눈. 지느러미는 그물에 쓸려서 끝이 닳고, 비만도는 사료 때문이에요. 눈은 설명보다 많이 보는 게 빨라요. 열 마리쯤 재 보면 손이 먼저 알아요.',
              lineEn: 'Fins, condition factor, and your eye. Fins wear at the tips from rubbing on the nets; the condition factor comes from the feed. For the eye, seeing a lot beats any explanation. Measure about ten and your hands will know first.' }),
            note: ['양식을 가리는 셋을 배웠다. 그물에 닳은 지느러미, 사료로 높아진 비만도, 그리고 많이 봐서 생기는 눈.', 'I learned the three signs of a farmed fish: fins worn by the nets, a condition factor raised by feed, and an eye that comes from seeing many.'] }),
          opt('pay', '조사 협력비는 있습니까?', 'Is there a fee for helping with the survey?', {
            end: endTalk({ complete: 'pay',
              lineKo: '있어요. 규정대로요. 조사비에서 나가는 거라 많지는 않아요. 그래도 영수증에 이름이 남아요. 누가 조사를 도왔는지 적히는 거예요.',
              lineEn: "There is. By the rules. It comes out of the survey budget, so it isn't much. But your name goes on the receipt. It records who helped with the survey." }),
            note: ['조사 협력비를 받았다. 영수증에 조사 협력이라고 내 이름이 적혔다.', 'I took the survey fee. My name went on the receipt as a survey helper.'] }),
          opt('volunteer', '협력비는 됐습니다. 다음에도 불러 주세요', 'No fee needed. Call me next time too', {
            say: ['협력비는 됐습니다. 다음 조사에도 불러 주세요.', 'No need for the fee. Call me for the next survey too.'], next: 'volunteer' }),
          opt('measure', '잴 때마다 길이가 들쭉날쭉합니다', 'My lengths come out different every time', {
            say: ['잴 때마다 길이가 들쭉날쭉합니다. 재는 법이 따로 있습니까?', 'My lengths come out different every time I measure. Is there a proper way to do it?'], next: 'measure' }),
        ],
        note: ['잡아 잰 광어 세 마리 중 지느러미 끝이 닳은 한 마리를 채수림 씨가 양식으로 가려냈다. 비만도도 높았다. 바다에 나온 물고기에도 출신이 있었다.',
          'Of the three flounder I caught and measured, Su-rim marked the one with worn fin tips as farmed. Its condition factor was high, too. Even fish out in the sea have a place they came from.'],
      }),
      volunteer: scene([
        act(CS, 'silence'),
        line(CS, '…부를게요. 진짜로요.', "...I'll call you. I mean it."),
        line(P, '진짜로요?', 'You mean it?'),
        line(CS, '협력자 칸은 늘 비어 있었어요.', 'The helper column has always been empty.', { act: 'look_away' }),
      ], {
        end: endTalk({ complete: 'volunteer',
          lineKo: '돈 받고 돕는 사람도 드문데, 안 받는 사람은 더 드물어요. 첫 줄은 그냥 안 올려요.',
          lineEn: "People who help for pay are rare, and people who help for nothing are rarer. I don't put just anyone on the first line." }),
        note: ['협력비는 됐다고 했다. 채수림 씨는 조사표 협력자 칸 첫 줄에 내 이름을 올렸다.', 'I turned down the fee. Su-rim put my name on the first line of the survey\'s helper column.'],
      }),
      measure: scene([
        line(CS, '있어요. 판에 눕히고, 입은 다물리고, 꼬리는 모아서 끝까지.', 'There is. Lay it on the board, close the mouth, gather the tail and measure to the very end.'),
        line(P, '꼬리를 모아요?', 'Gather the tail?'),
        line(CS, '그게 전장이에요. 지느러미를 펼친 채 재면 매번 달라져요.', "That's total length. Measure with the fin spread and you get a different number each time."),
      ], {
        end: endTalk({ complete: 'measure_tip',
          lineKo: '펄떡일 때 재면 매번 달라요. 숫자가 흔들리면 표가 흔들려요.',
          lineEn: 'Measure while it flaps and it changes every time. When the numbers wobble, the table wobbles.' }),
        note: ['전장 재는 법을 배웠다. 판에 눕히고, 입을 다물리고, 꼬리를 모아 끝까지 잰다.', 'I learned to measure total length: lay it on the board, close the mouth, gather the tail and measure to the end.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-2 「흰 그림자」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_2_offer', questId: 'N23-2', at: 'offer', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(CS, '포항 앞바다에서 흰 개체를 봤다는 사람이 있어요.', 'Someone says they saw a white one off Pohang.', { act: 'look_up' }),
        line(P, '흰 개체요?', 'A white one?'),
        line(CS, '하얀 물고기요. 종은 몰라요. 말마다 달라요.', "A white fish. Species unknown. Every telling's different."),
        line(P, '그럼 소문이네요.', "So it's a rumor."),
        line(CS, '소문이에요. 그래도 따라가 봐요.', 'It is. Follow it anyway.'),
        line(P, '소문을 어떻게 따라가요?', 'How do you follow a rumor?'),
        line(CS, '결국 자리랑 물때 얘기일 거예요. 어디서, 물이 어떨 때 봤는지.', "In the end it'll be about a spot and a tide. Where, and what the water was doing."),
        line(CS, '그 자리에 서서, 그 물때에 한 마리 건져요. 그리고 가져와요. 기록할게요.', "Stand on that spot and land one fish on that tide. Then bring it to me. I'll record it."),
        line(P, '흰 게 안 올라와도요?', "Even if it's not a white one?"),
      ], {
        choices: [
          opt('follow', '자리랑 물때부터 따라가 보겠습니다', "I'll follow the spot and tide first", {
            say: ['소문이라도 따라가 보겠습니다. 자리랑 물때부터요.', "Rumor or not, I'll follow it. Starting with the spot and the tide."], next: 'follow' }),
          opt('white', '흰 개체가 뭐예요?', 'What is a white one, exactly?', {
            say: ['흰 개체가 뭐예요? 하얀 물고기가 따로 있어요?', 'What is a white one? Is there such a thing as a white fish?'], next: 'white' }),
          opt('witness', '본 사람한테 직접 물어보면 안 돼요?', "Can't we just ask the person who saw it?", {
            say: ['누가 봤다는 거예요? 그 사람한테 직접 물어보면 안 돼요?', "Who saw it? Can't we just ask them directly?"], next: 'witness' }),
        ],
        note: ['포항 앞바다에서 흰 개체를 봤다는 소문이 돈다고 채수림 씨가 말했다. 소문은 결국 자리와 물때 이야기일 테니, 그 자리에 그 물때에 서서 한 마리를 건져 가져오면 기록하겠다고 했다.',
          "Su-rim said a rumor was going round about a white fish off Pohang. In the end it would come down to a spot and a tide, she said — stand there on that tide, land one fish and bring it to her, and she would record it."],
      }),
      follow: scene([
        line(CS, '좋아요. 소문은 말이 부풀어요. 그래도 자리랑 물때는 안 부풀어요.', "Good. Rumors puff up the words. But a spot and a tide don't puff up."),
        line(P, '거기만 건지면 되는 거군요.', 'So I just need to pin those down.'),
        line(CS, '흰 게 나오면 좋고, 안 나와도 그 조건에서 건진 한 마리는 기록이 돼요.', "If a white one turns up, great. If not, one fish landed under those conditions still makes a record."),
      ], {
        end: endTalk({ accept: true, offer: 'follow' }),
        note: ['소문을 따라가 보겠다고 했다. 채수림 씨는 지도 위 포항 앞바다에 점 하나를 찍으며, 말은 부풀어도 자리와 물때는 안 부푼다고 했다.', 'I said I would follow the rumor. Su-rim marked a dot off Pohang on her map — words puff up, she said, but a spot and a tide don\'t.'],
      }),
      white: scene([
        line(CS, '색소 없이 태어나는 개체예요. 어느 종이든 아주 드물게 나와요.', 'One born without pigment. It happens in any species, very rarely.'),
        line(P, '그럼 바닷속에서 엄청 눈에 띄겠네요.', 'Then it must stand out like crazy underwater.'),
        line(CS, '그래서 오래 못 살아요. 봤다는 말이 돌면 기록할 값어치가 있어요. 정말이든 아니든요.', "So it doesn't live long. When word goes round that someone saw one, it's worth recording. True or not."),
      ], {
        choices: [
          opt('ok', '일단 그 자리에 서 보겠습니다', "I'll go stand on that spot", { end: endTalk({ accept: true, offer: 'ask_white' }),
            note: ['흰 개체가 뭐냐고 물었다. 색소 없이 태어나 눈에 띄는 탓에 오래 못 사는 개체라, 봤다는 말만 돌아도 기록할 값어치가 있다고 했다.', 'I asked what a white one was. One born without pigment, she said — it stands out and doesn\'t live long, so even word of a sighting is worth recording.'] }),
          opt('sell', '흰 걸 잡으면 값이 꽤 나가겠는데요?', 'A white one must be worth a lot', {
            say: ['흰 걸 잡으면 꽤 값이 나가겠는데요?', "If I caught a white one, it'd be worth a fair bit, wouldn't it?"], next: 'sell' }),
        ],
      }),
      sell: scene([
        line(CS, '낚싯대로 잡은 건 못 팔아요. 알잖아요.', "You can't sell what you catch with a rod. You know that.", { act: 'shake_head' }),
        line(CS, '흰 거면 더더욱이요. 그건 돈이 아니라 기록이에요.', "Even less a white one. That's not money — it's a record."),
        line(P, '…괜한 소리를 했네요.', "...I shouldn't have said that."),
        line(CS, '잡으면 재고, 사진 찍고, 적고. 그다음은 그때 정해요.', 'If you catch it: measure, photograph, write it down. The rest we decide then.'),
      ], {
        end: endTalk({ accept: true, offer: 'sell_white' }),
        note: ['흰 걸 잡으면 값이 나가겠다고 했다가 한 소리 들었다. 낚싯대로 잡은 건 못 팔고, 흰 것은 돈이 아니라 기록이라고 했다.', "I said a white one would be worth money and got told off. You can't sell a rod catch, she said — a white one is a record, not money."],
      }),
      witness: scene([
        line(CS, '물어봤어요. 다들 다른 사람이 봤대요.', 'I asked. Everyone says someone else saw it.'),
        line(P, '소문이 원래 그렇죠.', "That's how rumors go."),
        line(CS, '그래도 이야기마다 겹치는 게 있었어요. 자리 하나, 물때 하나.', 'Still, every version overlapped somewhere. One spot, one tide.'),
        line(CS, '거기서부터예요.', "That's where we start."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_witness' }),
        note: ['본 사람에게 직접 물어보자고 했다. 채수림 씨는 이미 물었지만 다들 다른 사람이 봤다고 했고, 그래도 이야기마다 자리 하나와 물때 하나가 겹쳤다고 했다.', 'I suggested asking the witness directly. Su-rim already had — everyone said someone else saw it — but every story shared one spot and one tide.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-2 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_2_done', questId: 'N23-2', at: 'complete', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(P, '채수림 씨, 그 자리에서 그 물때에 섰어요. 한 마리 올라왔어요.', 'Su-rim, I stood on that spot on that tide. One came up.'),
        line(CS, '흰 거였어요?', 'Was it white?', { act: 'look_up' }),
        line(P, '…아니요. 흰 건 아니었어요.', "...No. It wasn't white."),
        line(CS, '그래도 기록.', 'Record it anyway.', { act: 'nod' }),
        line(P, '흰 게 아니어도요?', "Even though it wasn't white?"),
        line(CS, '그 자리, 그 물때에 뭐가 올라오는지가 기록이에요.', "What comes up on that spot, on that tide — that's the record."),
        line(CS, '소문이 기록이 됐어요. 기록이 되면 소문이 아니에요.', "The rumor's become a record. Once it's a record, it's no longer a rumor."),
      ], {
        choices: [
          opt('data', '자리와 물때를 기록으로 바꾸는 법, 배우고 싶습니다', "I'd like to learn how to turn spot and tide into records", {
            end: endTalk({ complete: 'data',
              lineKo: '표에 적는 순서가 있어요. 자리, 물때, 개체, 그리고 날짜. 날짜는 안 틀려요. 자리랑 물때가 제일 잘 틀려요. 그래서 기억이 생생할 때 그것부터 적어요.',
              lineEn: "There's an order to the table. Spot, tide, fish, then date. Dates don't go wrong. Spot and tide go wrong the most. So you write those first, while the memory is fresh." }),
            note: ['표에 적는 순서를 배웠다. 자리, 물때, 개체, 날짜. 잘 틀리는 자리와 물때를 기억이 생생할 때 먼저 적는다.', 'I learned the order for the table: spot, tide, fish, date — the spot and tide, which go wrong most, are written first while memory is fresh.'] }),
          opt('pay', '조사 협력비 받겠습니다', "I'll take the survey fee", {
            end: endTalk({ complete: 'pay',
              lineKo: '규정대로요. 소문 쫓은 값이라고 적을 수는 없어서 조사 협력으로 적었어요. 틀린 말은 아니에요. 소문을 확인하는 것도 조사예요.',
              lineEn: "By the rules. I couldn't write it down as a fee for chasing rumors, so I put survey assistance. That's not wrong. Checking a rumor is surveying too." }),
            note: ['조사 협력비를 받았다. 채수림 씨는 소문을 확인하는 것도 조사라며 정확하게 영수증을 썼다.', 'I took the survey fee. Su-rim wrote the receipt precisely — checking a rumor counts as surveying, she said.'] }),
          opt('volunteer', '협력비는 됐습니다. 흰 게 나오면 불러 주세요', 'No fee. Call me if a white one turns up', {
            say: ['협력비는 됐습니다. 흰 개체 나오면 불러 주세요.', 'No need for the fee. Call me if a white one turns up.'],
            end: endTalk({ complete: 'volunteer',
              lineKo: '…나오면 제일 먼저 연락할게요. 흰 게 안 나와도 남는 게 있어요. 그 자리, 그 물때에 누가 서 있었다는 기록이요. 다음 소문을 거를 때 그게 기준이 돼요.',
              lineEn: "...If one turns up, you'll be the first I call. Even with no white one, something remains: a record that someone stood on that spot on that tide. That becomes the yardstick for sifting the next rumor." }),
            note: ['협력비 대신 흰 개체가 나오면 불러 달라고 했다. 채수림 씨는 협력자 명단 첫 줄에 내 이름을 적었다.', 'Instead of the fee, I asked to be called if a white one turned up. Su-rim wrote my name on the first line of her helper list.'] }),
          opt('release', '흰 게 나오면 재고 놓아주고 싶습니다', 'If a white one turns up, I would measure it and let it go', {
            say: ['흰 게 정말 나오면… 저는 재고 놓아주고 싶습니다.', "If a white one really turns up... I'd like to measure it and let it go."], next: 'release' }),
        ],
        note: ['소문의 자리에 그 물때에 서서 한 마리를 건졌다. 흰 것은 아니었다. 채수림 씨는 그래도 기록이라며, 소문이 기록이 되면 더는 소문이 아니라고 했다.',
          'I stood on the rumored spot on that tide and landed one fish. It wasn\'t white. Su-rim said to record it anyway — once a rumor becomes a record, it is no longer a rumor.'],
      }),
      release: scene([
        act(CS, 'silence'),
        line(CS, '…그것도 방법이에요. 재고, 사진 찍고, 놓아주고.', "...That's one way. Measure, photograph, release."),
        line(P, '숫자는 남으니까요.', 'The numbers stay, after all.'),
        line(CS, '숫자는 남고 물고기는 바다로 가요.', 'The numbers stay and the fish goes back to the sea.', { act: 'nod' }),
      ], {
        end: endTalk({ complete: 'would_release',
          lineKo: '그 말, 기억해 둘게요. 흰 게 나오는 날 제일 먼저 꺼낼 말이에요.',
          lineEn: "I'll remember you said that. It's the first thing I'll bring up the day a white one appears." }),
        note: ['흰 개체가 나오면 재고 놓아주고 싶다고 했다. 채수림 씨는 표 귀퉁이에 작게 방생이라고 적어 두고, 그 말을 기억하겠다고 했다.', 'I said I would measure a white one and let it go. Su-rim wrote the word release small in a corner of her table and said she would remember.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-3 「접시 위의 증명」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_3_offer', questId: 'N23-3', at: 'offer', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(CS, '요즘 뭐 좋은 거 잡았어요?', 'Caught anything good lately?', { act: 'look_up' }),
        line(P, '네. 어제 한 마리 올렸는데, 살이 정말 좋았어요.', 'Yes. I landed one yesterday — the flesh was really something.'),
        line(CS, '다들 그렇게 말해요. 좋은 개체였다고.', 'Everyone says that. That it was a good one.'),
        line(P, '진짜 좋았어요.', 'It really was.'),
        line(CS, '그럼 말로 하지 마시고요. 특급으로 회 떠 오세요.', "Then don't tell me. Bring me sashimi graded top class."),
        line(P, '회로요?', 'Sashimi?'),
        line(CS, '손질이 증명이에요. 직접 잡은 걸로, 직접 떠서요. 사 온 건 안 돼요.', 'The knife work is the proof. From a fish you caught, cut by you. Nothing bought.'),
        line(P, '등급판정에서 특이 나와야 하는 거죠? 상급이면요?', 'So the grading has to say top class? What about first class?'),
        line(CS, '상은 안 받아요. 특이요. 등급은 제가 확인할게요.', "I won't take first class. Top class. I'll check the grade myself.", { act: 'shake_head' }),
      ], {
        choices: [
          opt('prove', '말 대신 접시로 보여 드리겠습니다', "I'll show you with a plate, not words", {
            say: ['말 대신 접시로 보여 드리겠습니다. 특으로요.', "I'll show you with a plate instead of words. Top class."], next: 'prove' }),
          opt('ikejime', '시메가 정확히 뭐예요?', 'What exactly is ikejime?', {
            say: ['시메가 정확히 뭐예요? 그냥 빨리 잡는 거 아니에요?', "What exactly is ikejime? Isn't it just killing it fast?"], next: 'ikejime' }),
          opt('trust', '제가 말하면 안 믿으실 거예요?', "You wouldn't believe me if I told you?", {
            say: ['좋은 개체였다고 제가 말하면 안 믿으실 거예요?', "If I tell you it was a good fish, you won't believe me?"], aff: { [CS]: -0.02 }, next: 'trust' }),
        ],
        note: ['좋은 개체를 잡았다고 하자, 채수림 씨는 말로 하지 말고 직접 잡은 것으로 특급 회를 떠 오라고 했다. 손질이 곧 증명이고, 상급은 받지 않는다고 했다.',
          'When I said I had caught a good fish, Su-rim told me not to say it but to bring top-class sashimi from a fish I caught myself. The knife work is the proof, she said — she would not accept first class.'],
      }),
      prove: scene([
        line(CS, '좋아요. 그 말도 접시 다음에 해요.', 'Good. Save that line for after the plate, too.'),
        line(P, '…네.', '...Right.'),
        line(CS, '시메, 방혈, 칼질, 신선도. 넷이 다 맞아야 특이 나와요.', 'Ikejime, bleeding, knife work, freshness. All four have to be right for top class.'),
        line(CS, '하나라도 빠지면 특은 어려워요.', 'Miss even one and top class is hard.'),
      ], {
        end: endTalk({ accept: true, offer: 'prove_it' }),
        note: ['접시로 보여 주겠다고 했다. 채수림 씨는 시메, 방혈, 칼질, 신선도 넷이 다 맞아야 특이 나온다고 했다.', 'I said I would prove it with a plate. Su-rim said ikejime, bleeding, knife work and freshness all have to be right for top class.'],
      }),
      ikejime: scene([
        line(CS, '빨리가 아니라 바르게예요. 뇌를 먼저 찔러 몸부림을 멈추는 거예요.', 'Not quickly — properly. You spike the brain first to stop it thrashing.'),
        line(P, '몸부림을 멈추면 뭐가 달라요?', 'What difference does stopping the thrashing make?'),
        line(CS, '버둥대면 살이 지쳐서 맛이 떨어져요. 그다음이 방혈이에요. 피를 빼야 살이 맑아요.', 'Thrashing tires the flesh and it loses flavor. Then comes bleeding. Draining the blood keeps the flesh clear.'),
        line(CS, '순서가 바뀌면 접시에 다 보여요.', 'Get the order wrong and it all shows on the plate.'),
      ], {
        choices: [
          opt('ok', '순서대로 해 보겠습니다', "I'll do it in order", { end: endTalk({ accept: true, offer: 'ask_ikejime' }),
            note: ['시메가 뭐냐고 물었다. 뇌를 먼저 찔러 몸부림을 멈추고, 그다음 피를 빼야 살이 맑다고 했다. 순서가 바뀌면 접시에 다 보인다고 했다.', 'I asked about ikejime. Spike the brain first to stop the thrashing, then bleed it so the flesh stays clear — get the order wrong and the plate shows it.'] }),
          opt('knife', '막칼밖에 없는데 특이 나옵니까?', 'Can I get top class with a cheap knife?', {
            say: ['막칼밖에 없는데, 그걸로도 특이 나옵니까?', 'All I have is a cheap knife — can that get top class?'], next: 'knife' }),
        ],
      }),
      knife: scene([
        line(CS, '안 나와요. 막칼은 상이 끝이에요. 칼이 살을 눌러서 결이 뭉개져요.', "It won't. A cheap knife tops out at first class. It presses the flesh and crushes the grain.", { act: 'shake_head' }),
        line(P, '혹시 빌려주실 수는…', 'Could I possibly borrow...'),
        line(CS, '그건 안 돼요. 회칼부터 마련해요.', 'No. Get a sashimi knife first.'),
        line(CS, '증명은 손이 하는데, 그 손도 칼을 잘 만나야 해요.', 'The hand makes the proof, but even the hand needs to meet the right knife.'),
      ], {
        choices: [
          opt('ok', '회칼부터 마련해서 해 보겠습니다', "I'll get a sashimi knife and do it", { end: endTalk({ accept: true, offer: 'ask_knife' }),
            note: ['막칼로는 상이 끝이라고 했다. 자기 회칼은 칼집째 보여 주기만 하고 빌려주지는 않았다. 회칼부터 마련하기로 했다.', 'A cheap knife tops out at first class, she said. She showed me her own sashimi knife in its sheath but wouldn\'t lend it. I decided to get one first.'] }),
          opt('later', '칼을 갖추고 다시 오겠습니다', "I'll come back once I have a knife", {
            say: ['칼부터 갖추고, 그때 다시 오겠습니다.', "I'll get the knife first and come back then."], next: 'later' }),
        ],
      }),
      later: scene([
        line(CS, '그래요. 칼이 준비되면 와요.', "All right. Come when the knife's ready."),
        line(CS, '특은 기다려 줘요. 개체는 안 기다려 주지만요.', "Top class will wait. The fish won't, though."),
      ], {
        end: endTalk({ decline: true }),
        note: ['칼부터 갖추고 다시 오겠다고 했다. 채수림 씨는 특은 기다려 준다고 했다.', 'I said I would come back once I had the knife. Su-rim said top class would wait.'],
      }),
      trust: scene([
        line(CS, '믿어요. 그런데 표에는 못 적어요. 말은 칸이 없어요.', "I believe you. But I can't put it in the table. Words don't have a column."),
        line(P, '칸이요?', 'A column?'),
        line(CS, '등급은 칸이 있어요. 특, 상, 중, 하.', 'Grades have a column. Top, first, middle, low.'),
        line(CS, '거기 적히면 저 말고 다른 사람도 믿어요. 특으로 떠 와요.', 'Once it\'s written there, people other than me believe it too. Bring me top class.'),
      ], {
        end: endTalk({ accept: true, offer: 'just_trust' }),
        note: ['내 말은 안 믿느냐고 했다. 채수림 씨는 믿지만 말은 표에 칸이 없다며, 등급 칸에 적혀야 남도 믿는다고 했다.', "I asked if she didn't believe me. Su-rim said she did, but words have no column in the table — only a grade written down makes others believe."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-3 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_3_done', questId: 'N23-3', at: 'complete', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(P, '채수림 씨, 회 떠 왔어요. 직접 잡아서 시메하고, 피 빼고, 결 따라 떴어요.', 'Su-rim, I\'ve brought sashimi. I caught it myself, did the ikejime, bled it, and cut along the grain.'),
        line(CS, '접시 줘 봐요.', 'Let me see the plate.', { act: 'peer' }),
        act(CS, 'silence'),
        line(CS, '…특.', '...Top class.'),
        line(P, '특이요?', 'Top class?'),
        line(CS, '됐어요. 접시가 말했네요.', "That's it. The plate's done the talking."),
        line(P, '칭찬은 그게 다예요?', 'Is that all the praise I get?'),
        line(CS, '접시가 했잖아요. 피도 잘 빠졌어요. 물가에서부터 잘했다는 뜻이에요.', 'The plate gave it. And it bled well. That means you did it right from the water\'s edge.'),
      ], {
        choices: [
          opt('data', '등급이 왜 갈리는지 관리사 눈으로 배우고 싶습니다', "I'd like to see grades the way an inspector does", {
            end: endTalk({ complete: 'data',
              lineKo: '혈합육 색, 그리고 시메 시점. 혈합육은 살 가운데 붉은 줄이에요. 검붉으면 피가 덜 빠진 거예요. 시메가 늦었거나요. 접시에서 제일 먼저 보는 데가 거기예요.',
              lineEn: "The color of the dark meat, and when the ikejime was done. The dark meat is the red line through the middle. If it's blackish red, the blood didn't drain — or the ikejime came late. That's the first place I look on a plate." }),
            note: ['접시에서 제일 먼저 보는 곳을 배웠다. 살 가운데 붉은 줄, 혈합육이 검붉으면 피가 덜 빠졌거나 시메가 늦은 것이다.', 'I learned where to look first on a plate: if the red line of dark meat is blackish, the blood didn\'t drain or the ikejime came late.'] }),
          opt('pay', '증명 값은 받겠습니다', "I'll take payment for the proof", {
            end: endTalk({ complete: 'pay',
              lineKo: '규정대로. 조사 협력이요. 회 한 접시를 조사로 적은 건 저도 처음이에요. 그래도 틀린 말은 아니에요. 이 접시가 그 개체의 마지막 기록이니까요.',
              lineEn: "By the rules. Survey assistance. It's my first time logging a plate of sashimi as survey work. But it isn't wrong. This plate is that fish's last record." }),
            note: ['증명 값을 받았다. 영수증에 특급 회 한 접시라고 적혔다.', 'I took payment for the proof. The receipt said one plate of top-class sashimi.'] }),
          opt('volunteer', '접시가 말했으면 됐습니다', 'If the plate did the talking, that is enough', {
            end: endTalk({ complete: 'volunteer',
              lineKo: '…그 말도 접시가 한 것 같네요. 말을 아끼는 사람은 칼도 아껴서 써요. 결이 하나도 안 뭉개졌어요. 그게 제일 큰 증명이에요.',
              lineEn: "...Sounds like the plate said that too. People sparing with words are sparing with the knife. Not a single bit of grain is crushed. That's the biggest proof." }),
            note: ['접시가 말했으면 됐다고 했다. 채수림 씨는 여수 조사 협력자 명단 첫 줄에 내 이름을 적었다.', 'I said if the plate had spoken, that was enough. Su-rim put my name on the first line of the Yeosu survey helper list.'] }),
          opt('from_water', '물가에서부터라면, 잡는 법도 배우고 싶습니다', 'If it starts at the water, I want to learn to catch right', { next: 'from_water' }),
        ],
        note: ['직접 잡아 시메하고 피를 빼고 결 따라 뜬 회를 채수림 씨에게 냈다. 한참 말이 없다가 특이라고 했다. 말은 안 했다. 접시가 말했으니까.',
          'I gave Su-rim sashimi from a fish I caught, spiked, bled and cut along the grain. She was silent a long while, then said top class. No more words — the plate had said it.'],
      }),
      from_water: scene([
        line(CS, '맞아요. 등급은 도마가 아니라 물가에서 시작해요.', 'Right. The grade starts at the water, not the cutting board.'),
        line(P, '어떻게 잡아야 해요?', 'How should I land them?'),
        line(CS, '오래 끌면 살이 지쳐요. 걸면 빨리 올리고, 살려 두었다가 바로 시메요.', 'Fight it too long and the flesh tires. Once it\'s hooked, bring it up fast, keep it alive, then ikejime right away.'),
      ], {
        end: endTalk({ complete: 'from_water',
          lineKo: '잡는 사람이 접시의 반을 떠요. 나머지 반만 칼이 해요.',
          lineEn: 'Whoever catches it cuts half the plate. The knife only does the other half.' }),
        note: ['등급은 물가에서 시작된다고 배웠다. 오래 끌지 말고 빨리 올려 살려 뒀다가 바로 시메한다.', 'I learned the grade starts at the water: don\'t fight it long, bring it up fast, keep it alive, then ikejime at once.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-4 「금어기의 자」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_4_offer', questId: 'N23-4', at: 'offer', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(CS, '요즘 잡은 거, 다 가져가요?', 'These days, do you keep everything you catch?', { act: 'look_up' }),
        line(P, '작은 건 놓아줘요. 그 외엔 대부분 가져가고요.', 'I let the small ones go. Most of the rest I keep.'),
        line(CS, '금어기인 것도요?', 'Even ones in closed season?'),
        line(P, '…솔직히 다 알지는 못해요.', "...Honestly, I don't know them all."),
        line(CS, '그럼 이번엔 이렇게 해요. 금어기 개체, 금지체장 개체는 재고 돌려보내요.', "Then let's do this. Fish in closed season, fish under the size limit — measure them and send them back."),
        line(P, '그냥 놓아주는 게 아니라, 재고요?', 'Not just let them go — measure them first?'),
        line(CS, '자로 재고 놓아요. 다섯 번.', 'Measure with a ruler, then release. Five times.'),
        line(P, '다섯 번이나요?', 'Five whole times?'),
        line(CS, '기록은 남고, 개체는 살아요. 다섯 번 채우면 기록 들고 와요.', 'The record stays and the fish lives. When you have five, bring me the record.'),
      ], {
        choices: [
          opt('five', '다섯 번 재고, 다섯 번 놓아주겠습니다', "Five measured, five released", { next: 'five' }),
          opt('season', '금어기 개체는 어떻게 알아봐요?', 'How do I recognize closed-season fish?', {
            say: ['금어기 개체는 어떻게 알아봐요? 철마다 다르잖아요.', 'How do I recognize a fish in closed season? It changes with the season.'], next: 'season' }),
          opt('waste', '애써 잡은 걸 놓아주려니 아깝네요', 'It feels like a waste to let them go', {
            say: ['애써 잡은 걸 다섯 번이나 놓아주려니 좀 아깝네요.', 'Letting go of fish I worked to catch, five times over — it feels a bit of a waste.'], next: 'waste' }),
        ],
        note: ['채수림 씨가 금어기 개체와 금지체장 개체는 자로 재고 돌려보내라고 했다. 다섯 번. 기록은 남고 개체는 산다며, 다 채우면 기록을 들고 오라고 했다.',
          'Su-rim told me to measure fish in closed season or under the size limit and send them back. Five times. The record stays and the fish lives, she said — bring her the record when I had five.'],
      }),
      five: scene([
        line(CS, '좋아요. 대신 재는 데 오래 걸리면 안 돼요.', "Good. But don't take long measuring."),
        line(P, '물 밖에 오래 있으면 약해지니까요.', 'Because the longer they are out of the water, the weaker they get.'),
        line(CS, '네. 젖은 손, 젖은 자. 재고 바로 놓아요. 마른 손은 비늘을 상하게 해요.', 'Yes. Wet hands, wet ruler. Measure and release right away. Dry hands damage the scales.', { act: 'nod' }),
      ], {
        end: endTalk({ accept: true, offer: 'five_five' }),
        note: ['다섯 번 재고 놓아주겠다고 했다. 채수림 씨는 자에 바닷물을 끼얹어 보이며, 젖은 손과 젖은 자로 재고 바로 놓으라고 했다.', 'I said I would measure and release five. Su-rim splashed seawater on her ruler to show me — wet hands, wet ruler, measure and release at once.'],
      }),
      season: scene([
        line(CS, '종마다, 달마다 달라요. 알 낳는 철에 맞춰서 정해요.', "It differs by species and by month. It's set around spawning season."),
        line(P, '알 낳으러 온 걸 잡으면…', 'If you catch one that came to spawn...'),
        line(CS, '내년이 없죠. 외우기 어려우면 잡을 때마다 확인해요.', "There's no next year. If it's hard to memorize, check every time you catch one."),
        line(CS, '모르겠으면 재고 놓아요. 놓아줘서 문제 되는 일은 없어요.', "If you're not sure, measure and release. Letting one go never causes trouble."),
      ], {
        choices: [
          opt('ok', '모르면 재고 놓겠습니다', "If unsure, I'll measure and release", { end: endTalk({ accept: true, offer: 'ask_season' }),
            note: ['금어기는 알 낳는 철에 맞춰 종마다 달마다 정한다고 배웠다. 모르겠으면 재고 놓으면 된다고 했다.', 'I learned closed seasons are set around spawning, by species and month. If unsure, measure and release, she said.'] }),
          opt('calm', '재는 동안 가만히 있어 줄까요?', 'Will it keep still while I measure?', {
            say: ['그런데 재는 동안 물고기가 가만히 있어 줄까요?', 'But will the fish keep still while I measure it?'], next: 'calm' }),
        ],
      }),
      calm: scene([
        line(CS, '안 있어요. 그래서 눈을 가려요.', "It won't. That's why you cover its eyes."),
        line(CS, '젖은 수건으로 머리를 덮으면 조용해져요.', 'Cover its head with a wet towel and it calms down.'),
        line(P, '농담처럼 물었는데, 진짜 방법이 있네요.', 'I half meant it as a joke, but there really is a way.'),
        line(CS, '버둥대는 걸 억지로 누르면 비늘이 상해요. 놓아줬는데 죽으면 그건 놓아준 게 아니에요.', "Pin down a struggling fish and you damage the scales. If it dies after release, you didn't really release it."),
      ], {
        end: endTalk({ accept: true, offer: 'hold_still' }),
        note: ['재는 동안 물고기가 가만히 있겠느냐고 물었다. 채수림 씨는 농담으로 받지 않고, 젖은 수건으로 머리를 덮으면 조용해진다고 진지하게 보여 줬다.', 'I asked if the fish would keep still while I measured. Su-rim did not treat it as a joke — she showed me, seriously, that a wet towel over the head calms it.'],
      }),
      waste: scene([
        line(CS, '아까운 게 정상이에요. 다들 그래요.', 'Feeling it\'s a waste is normal. Everyone does.'),
        line(CS, '그런데 놓아준 다섯은 내년에 알을 낳아요. 그 알이 몇 마리가 되는지 생각해 봐요.', 'But the five you let go will spawn next year. Think how many fish those eggs become.'),
        line(P, '…그렇게 생각하면 아까운 쪽이 바뀌네요.', '...Put that way, the waste is on the other side.'),
        line(CS, '다섯 번이요.', 'Five times.', { act: 'nod' }),
      ], {
        end: endTalk({ accept: true, offer: 'waste' }),
        note: ['놓아주기 아깝다고 했다. 채수림 씨는 아까운 게 정상이라며, 놓아준 다섯이 내년에 낳을 알을 생각해 보라고 했다. 그러자 아까운 쪽이 바뀌었다.', 'I said it felt like a waste. Su-rim said that was normal, and told me to think of the eggs those five would lay next year. Then the waste was on the other side.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-4 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_4_done', questId: 'N23-4', at: 'complete', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(P, '채수림 씨, 다섯 번 재고 다섯 번 놓아줬어요.', 'Su-rim, I measured five and released five.'),
        line(CS, '기록장 줘 봐요.', 'Let me see the log.', { act: 'receive' }),
        line(CS, '다섯 줄. 기록에 남았어요. 개체는 살았고요.', 'Five lines. They\'re on record. And the fish lived.', { act: 'peer' }),
        line(P, '낚시하러 나가서 다섯 마리를 놓아준 날이었어요.', 'I went out to fish and let five go.'),
        line(CS, '어땠어요?', 'How was it?'),
        line(P, '이상하게, 많이 잡은 날보다 마음이 가벼웠어요.', 'Strangely, I felt lighter than on days I catch a lot.'),
        line(CS, '그런 사람이 다음에도 재요.', 'People like that measure next time, too.', { act: 'nod' }),
      ], {
        choices: [
          opt('data', '방생 기록이 어디에 쓰이는지 알고 싶습니다', "I'd like to know what release records are used for", {
            end: endTalk({ complete: 'data',
              lineKo: '자원량 추정이요. 당신 다섯 줄이 내년 금어기를 정해요. 한 사람 다섯 줄은 작아요. 그런데 다섯 줄씩 적는 사람이 백 명이면 바다가 보여요. 그래서 한 줄도 대충 적으면 안 돼요.',
              lineEn: "Stock estimates. Your five lines help set next year's closed season. Five lines from one person is small. But a hundred people writing five lines each, and you can see the sea. That's why not one line can be sloppy." }),
            note: ['방생 기록은 자원량을 추정해 내년 금어기를 정하는 데 쓰인다고 배웠다. 다섯 줄씩 백 명이면 바다가 보인다고 했다.', "I learned release records feed stock estimates that set next year's closed season. A hundred people with five lines each, and you can see the sea."] }),
          opt('pay', '조사 협력비 받겠습니다', "I'll take the survey fee", {
            end: endTalk({ complete: 'pay',
              lineKo: '규정대로. 다섯 건이요. 놓아준 물고기에 값을 매기는 건 이상하죠. 그래도 잰 시간에는 값이 있어요. 방생도 조사예요.',
              lineEn: "By the rules. Five entries. Putting a price on fish you let go is odd, isn't it. But the time spent measuring is worth something. Releasing is surveying too." }),
            note: ['조사 협력비를 받았다. 영수증에 다섯 줄이 적혔다. 방생도 조사라고 했다.', 'I took the survey fee — five lines on the receipt. Releasing counts as surveying, she said.'] }),
          opt('volunteer', '개체가 살았으면 됐습니다', 'If the fish lived, that is enough', {
            end: endTalk({ complete: 'volunteer',
              lineKo: '…그 말, 표에 적을 수는 없지만 기억할게요. 개체가 살았으면 됐다는 사람은 다음에도 놓아줘요. 조사표는 결국 그런 사람들이 채워요. 조용히요.',
              lineEn: "...I can't put that in the table, but I'll remember it. People who say it's enough that the fish lived let them go next time too. In the end, it's people like that who fill the survey. Quietly." }),
            note: ['개체가 살았으면 됐다고 했다. 채수림 씨는 표에 적을 수는 없지만 기억하겠다고 했다.', 'I said it was enough that the fish lived. Su-rim said she could not write that in the table, but would remember it.'] }),
          opt('shore', '갯것에도 금지체장이 있습니까?', 'Do shore creatures have size limits too?', {
            say: ['갯것에도 금지체장이 있습니까? 해루질할 때도요?', 'Do shore creatures have size limits too? Even when gathering at night?'], next: 'shore' }),
        ],
        note: ['다섯 번 재고 다섯 번 놓아준 기록을 채수림 씨에게 냈다. 많이 잡은 날보다 마음이 가벼웠다고 하자, 그런 사람이 다음에도 잰다고 했다.',
          'I handed Su-rim the record of five measured and released. When I said I had felt lighter than on big-catch days, she said people like that measure next time too.'],
      }),
      shore: scene([
        line(CS, '있어요. 전복, 소라, 꽃게도요. 갯것도 자로 재요.', 'They do. Abalone, turban shells, blue crabs too. Shore creatures get measured as well.'),
        line(P, '그럼 해루질할 때도 자를 챙겨야겠네요.', "Then I'd better bring a ruler when I go gathering too."),
        line(CS, '그런데 여기선 그 전에 볼 게 있어요.', "But around here, there's something to check before that."),
      ], {
        end: endTalk({ complete: 'shore_size',
          lineKo: '전복, 소라는 마을 바다 거예요. 크기보다 손대도 되는 사람인지가 먼저예요.',
          lineEn: 'Abalone and turban shells belong to the village sea. Before size, the question is whether you are allowed to touch them at all.' }),
        note: ['갯것에도 금지체장이 있다고 배웠다. 다만 전복과 소라는 마을 바다 것이라, 크기보다 손대도 되는 사람인지가 먼저라고 했다.', 'I learned shore creatures have size limits too. But abalone and turban shells belong to the village sea — whether you may touch them comes before size.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-5 「종을 세는 일」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_5_offer', questId: 'N23-5', at: 'offer', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(CS, '요즘 하루에 몇 마리 잡아요?', 'How many do you catch a day these days?', { act: 'look_up' }),
        line(P, '날마다 달라요. 많은 날은 스무 마리도 넘고요.', 'Depends on the day. On good days, more than twenty.'),
        line(CS, '그거 말고요. 몇 종이요.', 'Not that. How many species?'),
        line(P, '종이요? …세어 본 적은 없어요.', "Species? ...I've never counted."),
        line(CS, '몇 마리가 아니라 몇 종이에요. 이번 조사표는 그걸 적어요.', "Not how many fish — how many kinds. That's what this survey records."),
        line(P, '어디에 적어요?', 'Where do I write it?'),
        line(CS, '도감이요. 도감이 곧 조사표예요. 40종 채워요.', 'Your codex. The codex is the survey. Fill it to forty species.'),
        line(P, '40종이요?', 'Forty?'),
        line(CS, '그리고 새로 잡은 다섯 건을 조사표에 올려요. 다 채우면 넘겨요.', 'And add five new catches to the survey sheet. When it\'s all filled, hand it over.'),
      ], {
        choices: [
          opt('open', '도감부터 열어 보겠습니다', "I'll open my codex first", {
            say: ['몇 마리 말고 몇 종. 도감부터 열어 보겠습니다.', "Not how many, but how many kinds. I'll start by opening my codex."], next: 'open' }),
          opt('why', '마릿수 말고 종을 세는 이유가 있어요?', 'Why count species instead of fish?', { next: 'why' }),
          opt('doubt', '40종은 며칠로는 안 될 것 같은데요', "Forty won't happen in a few days", {
            say: ['40종이요? 그건 며칠로는 안 될 것 같은데요.', "Forty species? That won't happen in a few days."], next: 'doubt' }),
        ],
        note: ['채수림 씨가 몇 마리가 아니라 몇 종을 적는 조사라고 했다. 도감이 곧 조사표라며 40종을 채우고, 새로 잡은 다섯 건을 조사표에 올려 다 채우면 넘겨 달라고 했다.',
          'Su-rim said this survey records how many species, not how many fish. The codex is the survey — fill it to forty species, add five new catches to the sheet, and hand it over when it is done.'],
      }),
      open: scene([
        line(CS, '좋아요. 열어 보면 생각보다 빈칸이 많을 거예요. 그게 정상이에요.', "Good. Open it and you'll find more blanks than you expect. That's normal."),
        line(P, '벌써 겁나네요.', "I'm nervous already."),
        line(CS, '잡은 걸 또 잡으면 숫자만 늘어요. 못 본 걸 찾아야 종이 늘어요.', 'Catch what you caught before and only the count grows. Species grow when you find what you haven\'t seen.'),
        line(CS, '인천은 종이 많아요.', 'Incheon has plenty of species.'),
      ], {
        end: endTalk({ accept: true, offer: 'open_guide' }),
        note: ['도감부터 열어 보겠다고 했다. 채수림 씨는 빈칸이 많은 게 정상이라며, 못 본 것을 찾아야 종이 는다고 했다.', 'I said I would start by opening my codex. Su-rim said lots of blanks were normal — species only grow when you find what you haven\'t seen.'],
      }),
      why: scene([
        line(CS, '마릿수는 그날 운이에요. 떼를 만나면 백 마리고, 못 만나면 영이에요.', "The head count is that day's luck. Meet a school and it's a hundred; miss it and it's zero."),
        line(P, '종은 다르고요?', 'And species are different?'),
        line(CS, '종은 운을 덜 타요. 한 바다에 몇 종이 사는지가 그 바다 건강이에요.', "Species depend less on luck. How many species live in a sea is that sea's health."),
        line(CS, '종이 줄면 숫자가 많아도 아픈 바다예요.', "If species drop, it's a sick sea no matter how many fish there are."),
      ], {
        choices: [
          opt('ok', '40종, 채워 보겠습니다', "I'll fill in forty", { end: endTalk({ accept: true, offer: 'ask_species' }),
            note: ['왜 종을 세느냐고 물었다. 마릿수는 그날 운이지만, 몇 종이 사는지는 그 바다의 건강이라고 했다.', 'I asked why species are counted. The head count is luck, she said, but how many species live in a sea is its health.'] }),
          opt('rules', '이미 도감에 있는 종도 세요?', 'Do species already in my codex count?', {
            say: ['도감에 이미 있는 종도 세는 거예요? 새로 잡은 것만요?', 'Do species already in my codex count? Or only new catches?'], next: 'rules' }),
        ],
      }),
      rules: scene([
        line(CS, '이미 있는 것도 다 세요. 지금까지 본 게 다 조사예요.', 'Everything already there counts. All you\'ve seen so far is survey.', { act: 'nod' }),
        line(P, '그럼 다섯 건은요?', 'Then what about the five catches?'),
        line(CS, '그건 새로 잡아야 해요. 날짜가 있어야 하거든요. 옛날 기억은 날짜가 흐려요.', 'Those have to be new. They need dates. Old memories have blurry dates.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_rules' }),
        note: ['도감에 이미 있는 종도 세느냐고 물었다. 지금까지 본 것도 다 세지만, 조사표에 올릴 다섯 건은 날짜가 있어야 해서 새로 잡아야 한다고 했다.', 'I asked whether species already in my codex counted. They all do, she said — but the five survey catches must be new, because they need dates.'],
      }),
      doubt: scene([
        line(CS, '안 되죠. 며칠로는요.', 'It won\'t. Not in a few days.'),
        line(P, '…미안한 기색이 하나도 없으시네요.', "...You don't sound the least bit sorry."),
        line(CS, '미안할 일이 아니니까요. 서두르지 마요. 대신 같은 자리만 가지 마요.', 'Because there\'s nothing to be sorry about. Don\'t rush. Just don\'t keep going to the same spot.'),
        line(CS, '갯바위, 모래, 밤, 낮. 자리를 바꾸면 종이 바뀌어요.', 'Rocks, sand, night, day. Change where you are and the species change.'),
      ], {
        choices: [
          opt('ok', '자리를 바꿔 가며 채워 보겠습니다', "I'll keep changing spots and fill it in", { end: endTalk({ accept: true, offer: 'forty_doubt' }),
            note: ['40종은 며칠로는 안 된다고 했더니, 채수림 씨는 조금도 미안한 기색 없이 서두르지 말고 자리를 바꿔 가라고 했다.', "When I said forty wouldn't happen in a few days, Su-rim, not the least bit sorry, told me not to rush and to keep changing spots."] }),
          opt('give_up', '그만큼은 제가 못 할 것 같습니다', "I don't think I can manage that much", {
            say: ['…솔직히 그만큼은 제가 못 할 것 같습니다.', "...Honestly, I don't think I can manage that much."], next: 'refuse' }),
        ],
      }),
      refuse: scene([
        act(CS, 'silence'),
        line(CS, '…알겠어요. 억지로 채운 표는 쓸모가 없어요.', '...Understood. A table filled out under pressure is useless.'),
        line(CS, '이 조사표는 다른 사람한테 맡길게요.', "I'll give this survey to someone else."),
        line(P, '죄송합니다.', "I'm sorry."),
      ], {
        end: endTalk({ fail: true }),
        note: ['40종은 못 하겠다고 했다. 채수림 씨는 억지로 채운 표는 쓸모없다며, 그 조사표를 다른 사람에게 맡기겠다고 했다. 그 일은 내 손을 떠났다.', 'I said I could not manage forty species. Su-rim said a table filled under pressure is useless and gave that survey to someone else. It left my hands.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-5 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_5_done', questId: 'N23-5', at: 'complete', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(P, '채수림 씨, 도감 40종 채웠어요. 조사표에 올릴 다섯 건도요.', "Su-rim, I've filled my codex to forty species. And the five catches for the survey."),
        line(CS, '마지막으로 채운 게 뭐예요?', 'What was the last one you filled in?', { act: 'look_up' }),
        line(P, '인천 앞바다에서 처음 본 녀석이요. 그거 하나 찾느라 며칠을 썼어요.', "One I'd never seen before, off Incheon. I spent days finding just that one."),
        line(CS, '40종. 조사표 됐어요.', "Forty species. That's a survey.", { act: 'peer' }),
        line(CS, '숫자가 아니라 종이 남았네요.', "What's left isn't a number — it's species."),
        line(P, '세어 보니까, 생각보다 많이 봤더라고요.', 'When I counted, I had seen more than I thought.'),
        line(CS, '본 걸 세는 사람은 드물어요. 다들 잡은 걸 세죠.', 'Few people count what they\'ve seen. Everyone counts what they\'ve caught.'),
      ], {
        choices: [
          opt('data', '종을 세는 눈, 관리사 눈으로 배우고 싶습니다', "I'd like to count species with an inspector's eye", {
            end: endTalk({ complete: 'data',
              lineKo: '지느러미 수, 그리고 입 모양. 비슷한 종은 몸 색보다 지느러미 가시 수가 정확해요. 색은 죽으면 변해요. 가시는 안 변해요.',
              lineEn: 'Fin counts, and mouth shape. For similar species, the number of fin spines is more reliable than body color. Color changes when they die. Spines don\'t.' }),
            note: ['비슷한 종은 몸 색보다 지느러미 가시 수로 가린다고 배웠다. 색은 죽으면 변하지만 가시는 안 변한다.', 'I learned to tell similar species by fin spines rather than color — color changes after death; spines don\'t.'] }),
          opt('pay', '조사표 값은 받겠습니다', "I'll take payment for the survey", {
            end: endTalk({ complete: 'pay',
              lineKo: '규정대로. 40종이면 등급이 높아요. 마릿수 많은 표보다 종 많은 표가 값이 나가요. 이상하죠. 그게 맞는 거예요. 바다를 더 많이 보여 주니까요.',
              lineEn: "By the rules. Forty species ranks high. A table with many species is worth more than one with many fish. Odd, isn't it. But that's right. It shows more of the sea." }),
            note: ['조사표 값을 받았다. 영수증 숫자가 길었다. 종 많은 표가 바다를 더 많이 보여 준다고 했다.', 'I took payment for the survey — a long number on the receipt. A table with many species shows more of the sea, she said.'] }),
          opt('volunteer', '종이 남았으면 됐습니다', 'If the species remain, that is enough', {
            end: endTalk({ complete: 'volunteer',
              lineKo: '…당신 도감이 조사표예요. 진짜로요. 다음 사람이 이 도감을 보면 어디부터 찾아야 할지 알 거예요. 빈칸이 어디인지가 제일 쓸모 있는 기록이에요.',
              lineEn: "...Your codex is the survey. Truly. Whoever looks at it next will know where to start searching. Where the blanks are is the most useful record of all." }),
            note: ['종이 남았으면 됐다고 했다. 채수림 씨는 내 도감이 조사표라며 인천 조사 협력자 명단 첫 줄에 내 이름을 올렸다.', 'I said it was enough that the species remained. Su-rim said my codex was the survey, and put my name first on the Incheon helper list.'] }),
          opt('shore', '갯것도 종으로 세는 법이 있습니까?', 'Is there a way to count shore creatures by species?', {
            say: ['갯것도 종으로 세는 법이 있습니까? 게나 고둥 같은 거요.', 'Is there a way to count shore creatures by species? Crabs, whelks, that sort of thing.'], next: 'shore' }),
        ],
        note: ['도감 40종과 조사표에 올릴 다섯 건을 채워 채수림 씨에게 넘겼다. 마지막 한 종을 찾느라 며칠을 썼다. 숫자가 아니라 종이 남았다고 했다.',
          'I handed Su-rim my codex at forty species and the five survey catches. Finding the last one took days. What remained was species, not numbers, she said.'],
      }),
      shore: scene([
        line(CS, '있어요. 게는 집게랑 등딱지 무늬, 고둥은 껍데기 입구 모양.', 'There is. For crabs, the claws and shell pattern; for whelks, the shape of the shell opening.'),
        line(P, '물고기 지느러미처럼, 볼 데를 하나 정하는 거네요.', "Like fins for fish — you pick one place to look."),
        line(CS, '네. 한 군데만 정확히 보면 나머지가 따라와요.', 'Yes. Look at one place precisely and the rest follows.', { act: 'nod' }),
      ], {
        end: endTalk({ complete: 'shore_species',
          lineKo: '조사표엔 물고기만 올라가요. 그래도 세는 눈은 같아요.',
          lineEn: 'Only fish go on the survey. But the counting eye is the same.' }),
        note: ['갯것을 종으로 세는 법을 배웠다. 게는 집게와 등딱지 무늬, 고둥은 껍데기 입구 모양을 본다.', 'I learned to count shore creatures by species: crabs by claws and shell pattern, whelks by the shape of the shell opening.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-6 「남길 것」 — 받는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_6_offer', questId: 'N23-6', at: 'offer', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(CS, '조사표, 이번이 마지막 장이에요.', 'This is the last page of the survey.', { act: 'look_sea' }),
        line(P, '마지막이요? 조사가 끝나요?', 'The last? Is the survey ending?'),
        line(CS, '제 조사는요. 조사표는 다음 사람한테 가요.', 'Mine is. The survey goes on to the next person.'),
        line(P, '다음 사람이요?', 'The next person?'),
        line(CS, '마지막 장은 비워 둘게요. 당신이 본 걸 적으라고요.', "I'll leave the last page blank. For you to write what you've seen."),
        line(P, '제가요?', 'Me?'),
        line(CS, '그 전에 한 접시. 기록에 남길 접시요.', 'Before that, a plate. One to leave in the record.'),
        line(P, '이번에도 계측하고 놓아주는 게 아니라요?', 'Not measuring and releasing this time?'),
        line(CS, '이번엔 먹을 접시예요. 회 한 접시, 익힌 거 한 접시. 직접 잡고 직접 만든 걸로요.', 'This time it\'s a plate to eat. One of sashimi, one cooked. From fish you caught, made by you.'),
      ], {
        choices: [
          opt('own', '제 손으로 만들어 오겠습니다', "I'll make them with my own hands", {
            say: ['기록에 남길 접시, 제 손으로 만들어 오겠습니다.', "The plates for the record — I'll make them with my own hands."], next: 'own' }),
          opt('next', '다음 사람은 누구예요? 정해졌어요?', "Who's the next person? Is it decided?", {
            say: ['조사표를 받을 다음 사람은 누구예요? 정해졌어요?', 'Who is the next person to get the survey? Has it been decided?'], next: 'next_one' }),
          opt('page', '마지막 장엔 뭘 적어야 해요?', 'What should go on the last page?', {
            say: ['마지막 장을 왜 비워 둬요? 제가 뭘 적어야 하는데요?', 'Why leave the last page blank? What am I supposed to write?'], next: 'page' }),
        ],
        note: ['채수림 씨가 이번이 조사표 마지막 장이라고 했다. 조사표는 다음 사람에게 가고, 마지막 장은 내가 본 것을 적으라고 비워 두겠다고 했다. 그 전에 직접 잡아 만든 회 한 접시와 익힌 요리 한 접시를 가져오라고 했다.',
          'Su-rim said this was the last page of the survey. It would go on to the next person, and she would leave the last page blank for me to write what I had seen. Before that, she asked for one plate of sashimi and one cooked dish, from fish I caught and made myself.'],
      }),
      own: scene([
        line(CS, '그래요. 재고 놓아준 것 말고, 먹은 것도 기록이에요.', "Good. Not just what you measured and released — what you ate is a record too."),
        line(P, '사 온 건 안 되고요.', 'And nothing bought.'),
        line(CS, '안 돼요. 그건 남의 바다예요.', "No. That's someone else's sea.", { act: 'shake_head' }),
      ], {
        end: endTalk({ accept: true, offer: 'own_plate' }),
        note: ['내 손으로 접시를 만들어 오겠다고 했다. 채수림 씨는 조사표 마지막 장을 손바닥으로 눌러 두며, 먹은 것도 기록이고 사 온 것은 남의 바다라고 했다.', 'I said I would make the plates myself. Su-rim pressed the last page down with her palm — what you eat is a record too, and anything bought is someone else\'s sea.'],
      }),
      next_one: scene([
        line(CS, '누가 될지는… 접시 보고요.', "Who it'll be... we'll see after the plate.", { act: 'look_away' }),
        line(P, '…', '...'),
        line(CS, '조사표는 누가 받을지 모르고 넘기는 거예요. 그래서 깨끗하게 남겨야 해요. 누가 받아도 읽을 수 있게요.', "You hand a survey on without knowing who'll get it. So you leave it clean. So anyone can read it."),
        line(CS, '접시부터요.', 'The plate first.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_next' }),
        note: ['다음 사람이 누구냐고 물었다. 채수림 씨는 말끝을 흐리며 접시를 보고 정하겠다고 했다. 조사표는 누가 받을지 모르고 넘기니 깨끗하게 남겨야 한다고 했다.', 'I asked who the next person was. Su-rim trailed off — she would see after the plate. A survey is handed on without knowing who gets it, so it must be left clean.'],
      }),
      page: scene([
        line(CS, '당신이 본 거요. 숫자 말고요.', "What you've seen. Not numbers."),
        line(CS, '몇 종, 몇 마리, 몇 센티는 앞에 다 있어요. 마지막 장엔 칸이 없어요.', 'Species, counts, centimeters — all that is in the front. The last page has no columns.'),
        line(P, '칸이 없으면 뭘 어떻게 적어요?', 'With no columns, how do I write anything?'),
        line(CS, '칸이 없어야 적을 수 있는 게 있어요. 지금 정하지 않아도 돼요.', "Some things can only be written where there are no columns. You don't have to decide now."),
      ], {
        choices: [
          opt('ok', '접시부터 만들어 오겠습니다', "I'll make the plates first", { end: endTalk({ accept: true, offer: 'ask_page' }),
            note: ['마지막 장에 뭘 적느냐고 물었다. 숫자 말고 내가 본 것, 칸이 없어야 적을 수 있는 것이라고 했다.', 'I asked what goes on the last page. What I have seen, not numbers, she said — things that can only be written where there are no columns.'] }),
          opt('strange', '먹는 접시가 기록이라니 낯설어요', 'A plate to eat as a record feels strange', {
            say: ['먹는 접시가 기록이 된다니, 좀 낯설어요.', 'A plate you eat becoming a record — it feels a little strange.'], next: 'strange' }),
        ],
      }),
      strange: scene([
        act(CS, 'laugh'),
        line(CS, '낯설죠. 조사표에 접시 사진을 붙이는 조사원은 없을 거예요.', 'It is strange. I doubt any surveyor sticks photos of plates in a survey.'),
        line(P, '그런데도요?', 'And yet?'),
        line(CS, '바다에서 건진 것 중에 사람 입에 들어간 것도 있어야 기록이 끝나요. 세기만 하고 먹지 않는 바다는 반쪽이에요.', "The record isn't finished until some of what came out of the sea went into someone's mouth. A sea you only count and never eat is half a sea."),
      ], {
        end: endTalk({ accept: true, offer: 'strange' }),
        note: ['먹는 접시가 기록이라니 낯설다고 했다. 채수림 씨는 작게 웃으며, 세기만 하고 먹지 않는 바다는 반쪽이라고 했다.', 'I said a plate to eat as a record felt strange. Su-rim gave a small laugh: a sea you only count and never eat is half a sea.'],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N23-6 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n23_6_done', questId: 'N23-6', at: 'complete', npcId: CS, start: 'start',
    nodes: {
      start: scene([
        line(P, '채수림 씨, 두 접시요. 회 한 접시, 익힌 거 한 접시. 직접 잡아서 만들었어요.', 'Su-rim, two plates. One sashimi, one cooked. I caught and made them myself.'),
        line(CS, '사진부터 찍을게요.', 'Let me take a photo first.', { act: 'peer' }),
        act(CS, 'silence'),
        line(CS, '찍었어요. 조사표에 붙일게요.', "Done. I'll put it in the survey."),
        line(P, '독도까지 와서 먹을 걸 만든 건 처음이에요.', "First time I've come all the way to Dokdo to make something to eat."),
        line(CS, '계측하고 놓아준 게 아니라 먹은 거. 이 바다 기록에 그게 빠져 있었어요.', 'Not measured and released — eaten. That was missing from this sea\'s record.'),
        line(CS, '사진 붙였어요. 마지막 장은 비워 뒀어요.', "Photo's in. I've left the last page blank."),
        line(P, '그럼 이 조사표는…', 'Then this survey...'),
        line(CS, '{player} 씨 거예요.', "It's yours, {player}.", { act: 'look_up' }),
      ], {
        choices: [
          opt('empty_page', '마지막 장, 비워 두겠습니다', "I'll keep the last page blank", {
            say: ['마지막 장, 비워 두겠습니다. 다음 사람 것이니까요.', "I'll keep the last page blank. It belongs to the next person."], next: 'empty_page' }),
          opt('lesson', '기록에 남길 접시, 무엇이 기준입니까', 'What makes a plate worth recording?', {
            end: endTalk({ complete: 'lesson',
              lineKo: '먹고 싶은 접시요. 그게 기록이에요. 조사표의 숫자는 남들이 읽어요. 접시는 먹은 사람만 기억해요. 둘 다 있어야 그 바다를 알았다고 할 수 있어요.',
              lineEn: "A plate you want to eat. That's the record. Others read the survey's numbers. Only the one who ate remembers the plate. You need both to say you knew that sea." }),
            note: ['기록에 남길 접시의 기준은 먹고 싶은 접시라고 배웠다. 숫자는 남이 읽고, 접시는 먹은 사람만 기억한다.', 'I learned the plate worth recording is one you want to eat. Others read numbers; only the eater remembers the plate.'] }),
          opt('pay', '마지막 조사 협력비 받겠습니다', "I'll take the last survey fee", {
            end: endTalk({ complete: 'pay',
              lineKo: '규정대로. 마지막이니까 등급 최고. 마지막 영수증도 정확하게 적었어요. 마지막이라고 대충 하면 앞에 적은 것까지 의심받아요.',
              lineEn: "By the rules. It's the last, so the top grade. I wrote the last receipt precisely too. Get sloppy because it's the last, and everything written before gets doubted." }),
            note: ['마지막 조사 협력비를 받았다. 영수증 숫자가 제일 길었고, 마지막까지 정확했다.', 'I took the last survey fee. The longest number yet on the receipt — and precise to the end.'] }),
          opt('eye', '세는 눈으로 낚시를 다시 배우고 싶습니다', 'I want to relearn fishing with a counting eye', {
            say: ['세는 눈으로 낚시를 다시 배우고 싶습니다. 무엇부터입니까?', 'I want to relearn fishing with a counting eye. Where do I start?'], next: 'eye' }),
        ],
        note: ['회 한 접시와 익힌 요리 한 접시를 채수림 씨에게 냈다. 채수림 씨는 사진을 찍어 조사표에 붙이고, 마지막 장은 비워 둔 채 조사표를 내게 넘겼다.',
          'I gave Su-rim a plate of sashimi and a cooked dish. She photographed them, put the photo in the survey, and handed the survey to me with the last page left blank.'],
      }),
      empty_page: scene([
        act(CS, 'silence'),
        line(CS, '…그래서 당신한테 준 거예요.', "...That's why I gave it to you."),
        line(CS, '비워 둘 줄 아는 사람한테 맡겨야 다음 사람한테도 빈 장이 가요. 이제 협력자 말고 조사원이에요.', 'Leave it with someone who knows how to keep a page blank, and the next person gets a blank page too. You\'re not a helper now — you\'re a surveyor.'),
      ], {
        end: endTalk({ complete: 'empty_page',
          lineKo: '언젠가 당신도 넘길 거예요. 그때까지 들고 다녀요.',
          lineEn: 'Someday you\'ll hand it on too. Until then, carry it with you.' }),
        note: ['마지막 장을 다음 사람을 위해 비워 두겠다고 했다. 채수림 씨는 그래서 내게 준 거라며, 이제 협력자가 아니라 조사원이라고 했다.', 'I said I would keep the last page blank for the next person. Su-rim said that was exactly why she gave it to me — I was a surveyor now, not a helper.'],
      }),
      eye: scene([
        line(CS, '같은 자리, 같은 방법, 오래요.', 'The same spot, the same method, for a long time.'),
        line(P, '잘 잡는 게 아니라요?', 'Not catching well?'),
        line(CS, '잘 잡는 것보다 똑같이 잡는 게 어려워요. 그게 조사원 낚시예요.', "Catching the same way is harder than catching well. That's surveyor's fishing."),
      ], {
        end: endTalk({ complete: 'surveyor_eye',
          lineKo: '쓴 미끼, 물때, 몇 번 던졌는지. 매번 같은 칸에 적어요. 그러면 바다가 바뀐 게 보여요.',
          lineEn: 'The bait you used, the tide, how many casts. Write them in the same columns every time. Then you can see when the sea changes.' }),
        note: ['조사원의 낚시는 같은 자리에서 같은 방법으로 오래 하는 것이라고 배웠다. 매번 같은 칸에 적으면 바다가 바뀐 게 보인다.', 'I learned surveyor\'s fishing means the same spot and method for a long time — write it in the same columns every time, and you see the sea change.'],
      }),
    },
  },
];
