/**
 * @file StoryTalkN13.ts
 * @description 290차 — 이야기 「송기백·마감기 — 신진도」(N13-1~3) 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 끝은 옛 받는 답(`end.offer`) · 보상 답(`end.complete`)에 묶는다.
 *
 * 인물: 마감기(34 · 마감에서 도망친 만화 작가 · 들뜨고 말이 많은 존댓말 · 「아마요」 · 송기백을 「할아버지」 · 주인공을 「{player} 씨」) ·
 *   송기백(81 · 신진도 폐어선을 고쳐 사는 노인 · 짧은 반말 · 「자네」 · 「~구먼」 · 부탁을 빚으로 여겨 말을 아낀다).
 * 주인공은 「마감기 씨」 · 「송기백 씨」로 부른다(작가님 · 할아버지 없이).
 * N13-1은 한 번뿐인 곁가지 — 옛 미루는 답 `decline`(도주 조력은 곤란)으로 미루는 끝이 있다.
 * N13-3은 대화 상대가 송기백이지만 말을 아끼는 그를 대신해 마감기가 거의 다 말한다(옛 받는 말 · 끝내는 말이 마감기의 말이다).
 * 표시(옛 답에서 그대로): choice.n13_1_asked_deadline · choice.n13_1_in_boards · choice.n13_2_asked_cleanup · choice.n13_shared_photo ·
 *   choice.n13_3_asked_silence.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const M = 'ma_gamgi';
const S = 'song_gibaek';
const P = 'player';

export const TALKS_N13: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N13-1 「마감 도주」 — 받는 자리(마감기) · 한 번뿐
  // ═══════════════════════════════════════════
  {
    id: 'n13_1_offer', questId: 'N13-1', at: 'offer', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '저기요! 잠깐만요! 숨 좀…', "Excuse me! Wait! Let me catch my breath...", { act: 'look_away' }),
        line(P, '괜찮으세요? 누구한테 쫓기세요?', "Are you all right? Is someone after you?"),
        line(M, 'PD요. PD가 쫓아와요.', "My producer. My producer's chasing me."),
        line(P, 'PD요…?', "Your producer...?"),
        line(M, '저 마감기예요. 만화 그려요. 아니, 그려야 해요.', "I'm Ma Gamgi. I draw comics. Or rather — I'm supposed to be drawing them."),
        line(M, '배 태워 주세요. 갑오징어 배요.', "Take me out on a boat. A cuttlefish boat."),
        line(P, '배를요? 갑자기요?', "A boat? Just like that?"),
        line(M, '배 위에서 콘티 끝낼게요. 갑오징어 두 마리만 올리는 동안요.', "I'll finish the storyboard on the boat. Just while you land two cuttlefish."),
      ], {
        choices: [
          opt('go', '타세요. 갑오징어 배 출항이에요', "Climb aboard. The cuttlefish boat sails", {
            say: ['타십시오. 갑오징어 배, 출항합니다.', "Climb aboard. The cuttlefish boat is setting out."],
            next: 'go' }),
          opt('deadline', '마감이 얼마나 남았어요?', "How long until your deadline?", {
            say: ['PD가 쫓아온다니, 마감이 얼마나 남았어요?', "If your producer's chasing you — how long until your deadline?"],
            next: 'deadline' }),
          opt('decline', '도주를 돕는 건 좀 곤란해요', "I can't really help you run away", {
            say: ['죄송하지만, 도주 조력은 곤란합니다.', "I'm sorry, but I can't help you make a getaway."],
            next: 'decline' }),
        ],
        note: ['신진도에서 숨을 헐떡이는 만화 작가 마감기 씨를 만났다. PD가 쫓아온다며 갑오징어 배를 태워 달라고, 내가 갑오징어 두 마리를 올리는 동안 배 위에서 콘티를 끝내겠다고 했다.',
          "In Sinjindo I met Ma Gamgi, a breathless comic artist. His producer was chasing him; he asked me to take him out on a cuttlefish boat and said he'd finish his storyboard while I landed two cuttlefish."],
      }),
      go: scene([
        line(M, '살았다! 고마워요!', "Saved! Thank you!"),
        line(M, '구명조끼는 어디 있어요? 아, 입을게요.', "Where are the life jackets? Oh — I'll put one on."),
        line(M, '마감보다 목숨이 먼저라고 PD가 그랬어요. 마감 지키라는 말 다음으로 제일 많이 한 말이에요.', "My producer says life comes before deadlines. It's what he says most, right after keep your deadline."),
      ], {
        choices: [
          opt('ok', '그럼 꽉 잡으세요', "Then hold on tight", {
            say: ['그럼 꽉 잡으세요. 출항합니다.', "Then hold on tight. We're setting out."],
            end: endTalk({ accept: true, offer: 'go' }),
            note: ['갑오징어 배에 태워 주겠다고 했다. 마감기 씨는 살았다며 구명조끼부터 입었다. 마감보다 목숨이 먼저라는 건 PD가 두 번째로 많이 한 말이라고.', "I said I'd take him out on the cuttlefish boat. Gamgi cried that he was saved and put on a life jacket first — life before deadlines was his producer's second most frequent saying."] }),
          opt('joke', '돕긴 할게요. 대신 공범으로 제 이름은 빼 주세요', "I'll help — but leave my name out as accomplice", {
            say: ['도주는 돕겠습니다. 대신 공범으로 제 이름은 빼 주십시오.', "I'll help with the escape. But leave my name out of it as an accomplice."],
            next: 'joke' }),
        ],
        note: ['마감기 씨는 살았다며 고맙다고 했다. 구명조끼를 찾아 입으며 PD 이야기를 했다.', "Gamgi thanked me — saved! — and talked about his producer as he found and put on a life jacket."],
      }),
      joke: scene([
        line(M, '공범이요? 아니죠, 선장이죠. 저는 손님이고요.', "Accomplice? No, no — captain. I'm the passenger."),
        line(M, '손님이 배에서 뭘 하든 그건 손님 사정이잖아요.', "Whatever a passenger does on a boat is the passenger's business, right?"),
        line(P, '(확신에 찬 얼굴인데, 근거는 없어 보인다.)', "(He looks completely sure of himself, with no apparent grounds.)"),
        line(M, '이름은 안 넣을게요. 대신 콘티 구석에 선장 하나 그려 넣을지도 몰라요. 그 정도는 봐줘요.', "I won't put your name in. But I might sketch a captain in the corner of the storyboard. Let me get away with that much."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_accomplice' }),
        note: ['도주는 돕되 공범으로 내 이름은 빼 달라고 했다. 마감기 씨는 나는 공범이 아니라 선장이고 자기는 손님일 뿐이라고 우겼다. 대신 콘티 구석에 선장 하나쯤 그려 넣을지도 모른다고.',
          "I said I'd help him escape as long as my name stayed out of it. Gamgi insisted I was no accomplice but the captain, and he merely a passenger — though he might sketch a captain into a corner of the storyboard."],
      }),
      deadline: scene([
        line(M, '어제요.', "Yesterday."),
        line(M, '마감은 어제였어요. 오늘은 연장이고, 내일은 사과문이에요.', "The deadline was yesterday. Today is the extension, and tomorrow is the apology."),
        line(P, '(휴대폰이 울린다. 마감기 씨는 화면도 안 보고 뒤집어 놓는다.)', "(His phone rings. Gamgi turns it face down without even looking at the screen.)"),
        line(M, '그래서 배가 필요해요. 배 위까지는 PD가 못 와요. 전화는 와도 못 들은 척할 수 있고요.', "That's why I need a boat. My producer can't follow me onto a boat. Calls can come, but I can pretend I didn't hear."),
        line(M, '거기선 그리는 것밖에 할 게 없어요. 그게 제 유일한 마감 비법이에요.', "Out there, there's nothing to do but draw. That's my one and only deadline trick."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_deadline' }),
        note: ['마감이 얼마나 남았느냐고 물었다. 마감기 씨는 어제였다고, 오늘은 연장이고 내일은 사과문이라고 했다. 울리는 휴대폰을 뒤집어 놓으며, 배 위에선 그리는 것밖에 할 게 없는 게 유일한 마감 비법이라고 했다.',
          "I asked how long until his deadline. Yesterday, Gamgi said — today was the extension, tomorrow the apology. Turning his ringing phone face down, he said his only trick is a boat, where there's nothing to do but draw."],
      }),
      decline: scene([
        line(M, '…네.', "...Right."),
        act(M, 'sigh'),
        line(M, '그럼 잡히러 갈게요. 마감은… 지키겠죠, 아마.', "Then I'll go and get caught. The deadline... I'll make it, probably."),
        line(P, '(작업실로 돌아가는 뒷모습이 이상하게 홀가분해 보였다.)', "(His back, heading off to the studio, looked strangely light.)"),
      ], {
        end: endTalk({ decline: true, offer: 'decline' }),
        note: ['도주 조력은 곤란하다고 했다. 마감기 씨는 한숨을 쉬고 잡히러 가겠다고 했다. 그날 배는 뜨지 않았다. 작업실로 돌아가는 뒷모습이 이상하게 홀가분해 보였다.',
          "I said I couldn't help him run. Gamgi sighed and said he'd go and get caught. No boat sailed that day. His back, heading off to the studio, looked strangely light."],
      }),
    },
  },
  // N13-1 — 끝내는 자리(마감기)
  {
    id: 'n13_1_done', questId: 'N13-1', at: 'complete', npcId: M, start: 'start',
    nodes: {
      start: scene([
        line(M, '끝났어요, 콘티!', "It's done — the storyboard!"),
        line(P, '갑오징어 두 마리 올리는 동안, 정말 펜을 안 놓으시던데요.', "You really didn't put down your pen the whole time I was landing those two cuttlefish."),
        line(M, '보세요, 이 장. 먹물 튄 거.', "Look at this page. The ink splatter."),
        line(P, '갑오징어가 쏜 거죠. 다시 그리셔야겠네요.', "That's from the cuttlefish. You'll have to redraw it."),
        line(M, '아니요, 그대로 낼래요. 이보다 나은 마감은 없어요.', "No, I'm handing it in as is. There's no better deadline than this."),
        act(M, 'laugh'),
        line(M, '마감 도주, 성공!', "Deadline escape — success!"),
      ], {
        choices: [
          opt('pay', '도주 조력비는 받을게요', "I'll take my getaway fee", {
            say: ['도주 조력비 받겠습니다.', "I'll take my fee for the getaway."],
            next: 'pay' }),
          opt('lesson', '배 위에서 집중하는 법, 배우고 싶어요', "Teach me how you focus on a boat", {
            say: ['마감기 씨가 배 위에서 집중하는 법, 배우고 싶습니다.', "The way you focus on a boat — I'd like to learn that."],
            end: endTalk({ complete: 'lesson',
              lineKo: '흔들리는 데서 그리면 손이 덜 떨려요. 이상하죠.\n\n땅에선 손이 떨리면 내 탓이에요. 배에선 배 탓을 할 수 있으니까 힘이 빠져요. 힘 빠진 손이 제일 정확해요. 낚싯대도 그럴 거예요.',
              lineEn: "Drawing somewhere that rocks, my hands shake less. Strange, right?\n\nOn land, if my hands shake it's my fault. On a boat I can blame the boat, so I relax. A relaxed hand is the most precise. It'll be the same with a fishing rod." }),
            note: ['배 위에서 집중하는 법을 배우고 싶다고 했다. 마감기 씨는 흔들리는 데서는 배 탓을 할 수 있어 힘이 빠지고, 힘 빠진 손이 제일 정확하다고 했다. 낚싯대도 그럴 거라고.', "I asked how he focused on a boat. Gamgi said that where things rock, you can blame the boat and relax — and a relaxed hand is the most precise. A fishing rod would be the same."] }),
          opt('decline', '마감 끝났으면 됐어요', "If the deadline's met, that's enough", {
            say: ['마감 끝났으면 됐습니다.', "If your deadline's done, that's enough."],
            end: endTalk({ complete: 'decline',
              lineKo: '…그 말, 편집자한테 들은 적 없어요.\n\n편집자는 마감이 끝나면 다음 마감 얘기부터 해요. 끝났으면 됐다는 말은 처음이에요. 그 말, 책 첫 장에 넣을게요. 이번엔 물어보고요.',
              lineEn: "...I've never heard that from an editor.\n\nWhen a deadline's done, editors start on the next one. Nobody's ever told me that done is enough. I'll put that line on the first page of the book. And this time I'll ask first." }),
            note: ['마감 끝났으면 됐다고 했다. 마감기 씨는 편집자한테 그런 말은 들어 본 적이 없다며, 그 말을 책 첫 장에 넣겠다고 했다. 이번엔 물어보고.', "I said the deadline being done was enough. Gamgi said no editor had ever told him that, and that he'd put it on the first page of the book — asking first this time."] }),
          opt('boards', '이번 콘티에 저도 나와요?', "Am I in this storyboard?", {
            say: ['이번 콘티에 제가 나옵니까?', "Do I appear in this storyboard?"],
            next: 'boards' }),
        ],
        note: ['갑오징어 두 마리를 올리는 동안 마감기 씨는 펜을 놓지 않았다. 갑오징어 먹물이 콘티 한 장에 튀었는데, 그대로 내겠다고 했다. 이보다 나은 마감은 없다고.',
          "While I landed two cuttlefish, Gamgi never put down his pen. Cuttlefish ink splattered one page of the storyboard; he said he'd hand it in like that. There's no better deadline, he said."],
      }),
      pay: scene([
        line(M, '당연하죠! 원고료에서!', "Of course! From my manuscript fee!"),
        act(M, 'give', { to: P }),
        line(M, '…아직 안 받은 원고료라, 지금은 반이에요.', "...It's a fee I haven't received yet, so for now it's half."),
        line(P, '반이요?', "Half?", { act: 'receive' }),
        line(M, '원고료는 늘 늦게 와요. 마감은 빨리 오는데. 세상이 공평하지 않아요. 그래도 반이라도 드려야 공범이 입을 다물죠.', "Fees always come late. Deadlines come fast. The world isn't fair. But I have to pay at least half, or my accomplice won't keep quiet."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['도주 조력비를 받겠다고 했다. 마감기 씨는 아직 안 받은 원고료라 지금은 반이라며 건넸다. 원고료는 늦게 오고 마감은 빨리 온다고, 반이라도 줘야 공범이 입을 다문다고.',
          "I asked for my getaway fee. Gamgi handed over half — the manuscript fee hadn't arrived yet. Fees come late and deadlines come fast, he said; half would keep his accomplice quiet."],
      }),
      boards: scene([
        line(M, '나오죠! 갑오징어가 먹물 쏘는 컷, 맞는 사람 역이에요.', "You sure are! The panel where the cuttlefish squirts ink — you're the one who gets hit."),
        line(P, '(먹물 튄 장 구석에, 내 얼굴이 작게 있다.)', "(In a corner of the ink-splattered page, there's a small drawing of my face.)", { act: 'peer' }),
        line(M, '이름은 안 넣었어요. 넣어도 돼요? 아니, 물어보고 넣을게요.', "I didn't put your name in. Can I? No — I'll ask before I do."),
        line(M, '마감 지킨 사람은 그런 거 물어보거든요.', "People who make their deadlines ask about things like that."),
      ], {
        end: endTalk({ complete: 'in_boards' }),
        note: ['이번 콘티에 내가 나오느냐고 물었다. 마감기 씨는 갑오징어 먹물에 맞는 사람 역이라며 먹물 튄 장을 보여 주었다. 구석에 내 얼굴이 작게 있었다. 이름은 물어보고 넣겠다고 했다.',
          "I asked if I was in the storyboard. Gamgi showed me the ink-splattered page — I was the one who gets hit by the cuttlefish ink, a small face in the corner. He'd ask before adding my name."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N13-2 「두고 온 것」 — 받는 자리(송기백)
  // ═══════════════════════════════════════════
  {
    id: 'n13_2_offer', questId: 'N13-2', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '자네, 눈 좋은가.', "You — are your eyes any good?", { act: 'look_up' }),
        line(P, '네? 나쁘진 않은데요.', "Sorry? They're not bad."),
        line(S, '평생 찾은 게 있어.', "There's something I've been looking for my whole life."),
        line(P, '평생이요? 뭘요?', "Your whole life? What is it?"),
        line(S, '사진이야. 방제 봉사 때 찍은 거.', "A photograph. One taken during the cleanup volunteering."),
        line(P, '방제 봉사요…?', "Cleanup volunteering...?"),
        line(S, '이 배 어딘가에 있어. 아니면 배 둘레 갯가 어디쯤.', "It's somewhere on this boat. Or somewhere on the shore around it.", { act: 'look_away' }),
        line(S, '같이 찾아 줘.', "Help me look."),
      ], {
        choices: [
          opt('help', '같이 찾을게요. 어디부터 뒤질까요?', "I'll help. Where should I start?", {
            say: ['같이 찾겠습니다. 어디부터 뒤지면 되겠습니까?', "I'll help you look. Where should I start searching?"],
            next: 'help' }),
          opt('cleanup', '방제 봉사라면, 그때 무슨 일이 있었어요?', "Cleanup — what happened back then?", {
            say: ['방제 봉사라면, 그때 이 바다에 무슨 일이 있었습니까?', "Cleanup volunteering — what happened to this sea back then?"],
            next: 'cleanup' }),
          opt('doubt', '평생 못 찾으신 걸, 제가 찾을 수 있을까요?', "If you couldn't find it in a lifetime, can I?", {
            say: ['평생 못 찾으신 걸, 제가 찾을 수 있을까요?', "If you couldn't find it in a whole lifetime, could I really?"],
            next: 'doubt' }),
        ],
        note: ['신진도 폐어선에 사는 송기백 씨가 평생 찾던 것이 있다고 했다. 방제 봉사 때 찍은 사진이라고, 이 배 어딘가나 배 둘레 갯가 어디쯤에 있을 거라며 같이 찾아 달라고 했다.',
          "Gibaek, who lives on a derelict boat in Sinjindo, said there was something he'd been searching for all his life — a photo from the cleanup volunteering. It would be somewhere on the boat or the shore around it, and he asked me to help him look."],
      }),
      help: scene([
        line(S, '조타실부터. 아니, 기관실. 아니…', "Start in the wheelhouse. No — the engine room. No..."),
        line(S, '다 뒤져. 나도 어디 뒀는지 몰라. 그래서 평생 찾은 거야.', "Search everywhere. I don't know where I put it either. That's why I've been looking all my life."),
        line(P, '(손전등을 건네주신다. 불빛이 약하다.)', "(He hands me a flashlight. The beam is weak.)"),
        line(S, '배 둘레 갯가도 봐. 문짝이 바람에 열린 적이 몇 번 있어. 물에 젖었어도 상관없어. 얼굴만 알아보면 돼.', "Check the shore around the boat too. The door's blown open in the wind a few times. Doesn't matter if it's wet. As long as you can make out the faces."),
      ], {
        choices: [
          opt('ok', '배 안부터 갯가까지, 다 뒤져 볼게요', "From the boat to the shore — I'll search it all", {
            say: ['배 안부터 갯가까지, 다 뒤져 보겠습니다.', "From inside the boat to the shore — I'll search it all."],
            end: endTalk({ accept: true, offer: 'help_search' }),
            note: ['어디부터 뒤지면 되느냐고 물었다. 송기백 씨는 조타실, 기관실 하다가 다 뒤지라고 했다. 자기도 어디 뒀는지 몰라 평생 찾은 거라고. 약한 손전등을 받아 들고, 배 둘레 갯가도 보기로 했다.', "I asked where to start. Gibaek named the wheelhouse, then the engine room, then said to search everything — he didn't know where he'd put it, which was why he'd searched all his life. I took his weak flashlight; I'd check the shore around the boat too."] }),
          opt('joke', '배가 집이면, 집 안에서 잃어버리신 거네요', "If the boat's your home, you lost it at home", {
            say: ['배가 집이면, 집 안에서 물건을 잃어버리신 거네요.', "If the boat is your home, then you've lost something inside your own house."],
            next: 'joke' }),
        ],
        note: ['송기백 씨는 자기도 어디 뒀는지 몰라서 평생 찾았다고 했다. 사진이 젖었어도 얼굴만 알아보면 된다고.', "Gibaek said he'd searched all his life because he didn't know where he'd put it. Wet was fine, as long as the faces could be made out."],
      }),
      joke: scene([
        line(S, '…그렇지. 늙으면 집이 제일 넓어.', "...That's right. When you're old, your house is the widest place there is."),
        act(S, 'laugh'),
        line(S, '이 배는 칸이 많아. 그물 넣던 칸, 얼음 넣던 칸.', "This boat has plenty of compartments. One for the nets, one for the ice."),
        line(S, '버린 배에도 자리는 그대로 남아 있지. 그 어느 칸에 있을 거야. 천천히 찾아.', "Even on an abandoned boat, the places stay where they were. It's in one of them. Take your time."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_house' }),
        note: ['배가 집이면 집 안에서 잃어버린 거라고 했다. 송기백 씨는 늙으면 집이 제일 넓다며 어깨를 들썩이며 웃었다. 그물 칸, 얼음 칸, 그 어느 칸에 있을 테니 천천히 찾으라고 했다.',
          "I said if the boat was his home, he'd lost it at home. Gibaek laughed, shoulders shaking — when you're old, home is the widest place. It was in one of the compartments, nets or ice; I should take my time."],
      }),
      cleanup: scene([
        line(S, '기름이 왔어. 시커멓게. 갯벌도 바위도 다.', "The oil came. Pitch black. The mudflats, the rocks — all of it."),
        line(P, '(손바닥을 펴 보신다. 오래 문지른 손이다.)', "(He opens his palm. It's a hand that has scrubbed for a long time.)"),
        line(S, '전국에서 사람들이 왔지. 걸레랑 양동이 들고. 바위를 하나씩 닦았어.', "People came from all over the country. With rags and buckets. We wiped the rocks one by one."),
        line(P, '…', '...'),
        line(S, '그때 다 같이 찍은 사진이야. 그 얼굴들이 보고 싶어서 찾는 거야.', "It's the photo we all took together then. I'm searching because I want to see those faces."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_cleanup' }),
        note: ['방제 봉사 때 무슨 일이 있었느냐고 물었다. 송기백 씨는 기름이 시커멓게 왔고, 전국에서 사람들이 걸레와 양동이를 들고 와 바위를 하나씩 닦았다고 했다. 그때 다 같이 찍은 사진의 얼굴들이 보고 싶다고.',
          "I asked what happened back then. Gibaek said the oil came, pitch black, and people came from all over with rags and buckets to wipe the rocks one by one. He wants to see the faces in the photo they took together."],
      }),
      doubt: scene([
        line(S, '내가 못 찾은 건 눈이 늙어서야. 자네 눈은 젊지.', "I couldn't find it because my eyes got old. Yours are young."),
        act(S, 'laugh'),
        line(S, '그리고 혼자 찾는 거랑 둘이 찾는 건 달라.', "And searching alone isn't the same as searching with two."),
        line(S, '혼자면 찾다가 그만두는데, 둘이면 그만두자는 말을 서로 못 해. 그러니까 찾아질 거야.', "Alone, you give up partway. With two, neither can bring themselves to say let's stop. So it'll turn up."),
      ], {
        end: endTalk({ accept: true, offer: 'doubt_find' }),
        note: ['평생 못 찾은 걸 내가 찾을 수 있겠느냐고 했다. 송기백 씨는 헛웃음을 짓고, 자기 눈이 늙어서 못 찾은 거라고 했다. 둘이면 그만두자는 말을 서로 못 하니 찾아질 거라고.',
          "I wondered if I could find what he hadn't in a lifetime. Gibaek gave a dry laugh: his eyes had simply got old. With two of us, neither could say let's stop — so it would turn up."],
      }),
    },
  },
  // N13-2 — 끝내는 자리(송기백)
  {
    id: 'n13_2_done', questId: 'N13-2', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(P, '찾았어요. 갯가 돌 틈에 끼어 있었어요. 좀 젖었지만…', "I found it. It was wedged between stones on the shore. It's a little wet, but..."),
        line(S, '…이거다.', "...This is it.", { act: 'peer' }),
        act(S, 'silence'),
        line(S, '이 사람, 이 사람. 다 갔어.', "This one, and this one. All gone."),
        line(S, '나만 남았지.', "Only I'm left."),
        line(P, '…', '...'),
        line(S, '자네도 사진 있지. 그 얼굴이야.', "You've got a photograph too. It's in your face.", { act: 'look_up' }),
        line(P, '(네 살의 나와, 좌판 천막. 우리 가족사진이 떠올랐다.)', "(Me at four, and a market-stall tent. Our family photo came to mind.)"),
      ], {
        choices: [
          opt('share', '저도 가족사진이 있어요. 네 살 때요', "I have a family photo too. From when I was four", {
            say: ['저도 가족사진이 있습니다. 네 살 때입니다.', "I have a family photo too. From when I was four."],
            next: 'share' }),
          opt('lesson', '폐어선을 집으로 만든 솜씨, 배우고 싶어요', "I'd like to learn how you made a hulk a home", {
            say: ['폐어선을 거처로 만든 솜씨, 배우고 싶습니다.', "The way you turned a derelict boat into a home — I'd like to learn that."],
            end: endTalk({ complete: 'lesson',
              lineKo: '배는 버려도 집이 돼.\n\n물 새는 데부터 막고, 바람 드는 데는 그다음. 배는 원래 물을 막으려고 만든 거라 조금만 손보면 집보다 따뜻해. 사람이 살면 배도 덜 늙어.',
              lineEn: "Even an abandoned boat can be a home.\n\nPlug the leaks first, then the draughts. A boat was built to keep water out, so with a little work it's warmer than a house. And when someone lives in her, a boat ages slower." }),
            note: ['폐어선을 집으로 만든 솜씨를 배우고 싶다고 했다. 송기백 씨는 물 새는 데부터 막고 바람 드는 데는 그다음이라고, 배는 원래 물을 막으려고 만든 거라 손보면 집보다 따뜻하다고 했다. 사람이 살면 배도 덜 늙는다고.', "I asked to learn how he'd made the boat a home. Plug the leaks first, then the draughts, Gibaek said — a boat is built to keep water out, so it's warmer than a house. Lived in, a boat ages slower."] }),
          opt('pay', '찾아 드린 값은 받을게요', "I'll take something for finding it", {
            say: ['찾아 드린 값은 받겠습니다.', "I'll take payment for finding it."],
            next: 'pay' }),
          opt('no_charge', '값은 됐어요. 사진이 주인한테 돌아갔으니까요', "No charge. The photo's back with its owner", {
            say: ['찾아 드린 값은 됐습니다. 사진이 주인한테 돌아갔으니까요.', "There's no charge. The photo is back with its owner."],
            end: endTalk({ complete: 'no_charge',
              lineKo: '…값을 안 받으면 늙은이가 빚을 지는 거야.\n\n그럼 빚으로 두지. 갚을 날이 오겠지. 신진도 사람들은 빚진 걸 안 잊어.',
              lineEn: "...If you won't take payment, this old man is in your debt.\n\nThen I'll leave it as a debt. The day to repay it will come. Sinjindo folk never forget what they owe." }),
            note: ['값은 됐다고, 사진이 주인한테 돌아갔으니까라고 했다. 송기백 씨는 사진을 가슴께에 대고 오래 서 있다가, 그럼 빚으로 두겠다고 했다. 신진도 사람들은 빚진 걸 안 잊는다고.', "I said there was no charge — the photo was back with its owner. Gibaek stood a long time with the photo against his chest, then said he'd leave it as a debt. Sinjindo folk never forget what they owe."] }),
        ],
        note: ['배 둘레 갯가에서 물에 젖은 단체사진을 찾아 송기백 씨에게 드렸다. 노인은 사진 속 얼굴을 하나씩 짚으며 다 갔고 자기만 남았다고 했다. 나도 사진이 있지 않느냐는 말에 우리 가족사진이 떠올랐다.',
          "I found the wet group photo on the shore around the boat and gave it to Gibaek. He touched the faces one by one — all gone, only he was left. When he said I must have a photo too, our family photo came to mind."],
      }),
      share: scene([
        line(S, '…보여 줘.', "...Show me."),
        act(S, 'silence'),
        line(P, '(오래 보시더니, 자기 사진 옆에 나란히 놓으셨다.)', "(He looks at it a long time, then sets it beside his own.)"),
        line(S, '천막 앞에 선 꼬마가 자네구먼.', "So the little one standing in front of the tent is you."),
        line(S, '사진은 남는 사람 거야. 자네 사진도 언젠가 누가 오래 볼 거야. 그러니까 버리지 마.', "Photos belong to the ones who stay behind. Someday someone will look at yours for a long time too. So don't throw it away."),
      ], {
        end: endTalk({ complete: 'share' }),
        note: ['나도 네 살 때 가족사진이 있다고 했다. 송기백 씨는 그 사진을 오래 보더니 자기 사진 옆에 나란히 놓았다. 천막 앞의 꼬마가 나라고, 사진은 남는 사람 것이니 버리지 말라고 했다.',
          "I told him I had a family photo from when I was four. Gibaek looked at it a long time and set it beside his own. The little one in front of the tent was me, he said — photos belong to those who remain, so don't throw it away."],
      }),
      pay: scene([
        line(S, '…그러세. 늙은이 돈.', "...Fair enough. An old man's money."),
        act(S, 'give', { to: P }),
        line(P, '(동전까지 세서 주신다.)', "(He counts it out, down to the coins.)", { act: 'receive' }),
        line(S, '받을 건 받아야지. 자네도 먹고살아야 하니까.', "What's owed should be taken. You've got to make a living too."),
        line(S, '동전은 세다 보면 손이 따뜻해져. 늙은이가 셀 게 그것밖에 없어서 그래.', "Counting coins warms your hands. It's the only thing an old man has left to count."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['찾아 드린 값을 받겠다고 했다. 송기백 씨는 동전까지 세어 주며, 받을 건 받아야 한다고 했다. 동전을 세다 보면 손이 따뜻해진다고.',
          "I said I'd take something for finding it. Gibaek counted it out to the last coin — what's owed should be taken, he said. Counting coins warms the hands."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N13-3 「폐어선의 겨울」 — 받는 자리(송기백 · 마감기가 대신 말한다)
  // ═══════════════════════════════════════════
  {
    id: 'n13_3_offer', questId: 'N13-3', at: 'offer', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(S, '…왔나.', "...You came.", { act: 'look_up' }),
        line(M, '{player} 씨! 잘 왔어요. 신진도 바람, 올겨울 유난히 차요.', "{player}! Good, you're here. The wind in Sinjindo is especially cold this winter."),
        line(P, '마감기 씨도 계셨네요. 무슨 일 있어요?', "Gamgi, you're here too. Is something wrong?"),
        line(M, '할아버지 난로가 고장 났어요.', "Grandpa Song's stove is broken."),
        line(S, '괜찮아. 괜한 소리야.', "It's fine. He's talking nonsense.", { act: 'look_sea' }),
        line(M, '안 괜찮아요. 말을 안 해서 그렇지. 그래서 제가 대신 해요.', "It's not fine. He just won't say so. So I'm saying it for him."),
        line(P, '(송기백 씨는 대답 대신 바다 쪽만 본다.)', "(Instead of answering, Gibaek just looks out to sea.)"),
        line(M, '고쳐 줄래요?', "Will you fix it?"),
      ], {
        choices: [
          opt('fix', '고칠게요. 어디가 고장인지부터 봐요', "I'll fix it. Let's see what's wrong first", {
            say: ['고치겠습니다. 어디가 고장인지부터 보죠.', "I'll fix it. Let's start by seeing what's broken."],
            next: 'fix' }),
          opt('silence', '송기백 씨, 왜 고쳐 달라고 안 하셨어요?', "Gibaek, why didn't you ask to have it fixed?", {
            say: ['송기백 씨, 왜 고쳐 달라는 말을 안 하셨어요?', "Gibaek, why didn't you ask anyone to fix it?"],
            next: 'silence' }),
          opt('never', '난로는 고쳐 본 적이 없지만, 해 볼게요', "I've never fixed a stove, but I'll try", {
            say: ['난로는 고쳐 본 적이 없습니다만, 해 보겠습니다.', "I've never fixed a stove before, but I'll give it a try."],
            next: 'never' }),
        ],
        note: ['신진도의 겨울, 송기백 씨의 난로가 고장 났다. 송기백 씨는 괜찮다고만 했고, 마감기 씨가 대신 고쳐 달라고 했다.',
          "Winter in Sinjindo, and Gibaek's stove had broken. Gibaek only said he was fine; Gamgi asked me to fix it for him."],
      }),
      fix: scene([
        line(M, '고마워요! 할아버지는 아무 말도 안 하겠지만, 그게 고맙다는 뜻이에요.', "Thank you! Grandpa Song won't say a word, but that means thank you."),
        line(P, '(폐어선 연통에서 연기가 안 난다.)', "(No smoke is coming from the hulk's chimney pipe.)"),
        line(M, '불은 붙는데 금방 꺼져요. 부품 하나가 나간 것 같아요. 아마요.', "It lights, but goes out right away. I think one part's gone. Probably."),
        act(S, 'silence'),
        line(M, '둘이 보면 금방일 거예요.', "With two of us looking, it won't take long."),
      ], {
        end: endTalk({ accept: true, offer: 'fix_it' }),
        note: ['어디가 고장인지부터 보자고 했다. 마감기 씨는 송기백 씨가 아무 말도 안 하는 게 고맙다는 뜻이라고 했다. 불은 붙는데 금방 꺼진다고, 부품 하나가 나간 것 같다고.',
          "I said we'd start by finding what was broken. Gamgi said Gibaek's silence meant thank you. The stove lit but soon went out — probably a part had gone."],
      }),
      silence: scene([
        act(S, 'silence'),
        line(M, '할아버지는 부탁을 빚으로 생각해요. 빚지는 걸 제일 싫어하고요.', "Grandpa Song thinks of asking a favour as a debt. And debt is what he hates most."),
        line(M, '춥다는 말도 안 해요.', "He won't even say he's cold."),
        line(P, '(마감기 씨가 언 손을 비빈다.)', "(Gamgi rubs his frozen hands together.)"),
        line(M, '그래서 제가 대신 말해요. 저는 부탁하는 데 익숙하거든요. 마감 연장 부탁만 백 번은 했어요.', "So I say it for him. I'm used to asking favours. I've asked for deadline extensions a hundred times at least."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_silence' }),
        note: ['송기백 씨에게 왜 고쳐 달라고 안 했느냐고 물었다. 송기백 씨는 말이 없었고, 마감기 씨가 대신 답했다. 송기백 씨는 부탁을 빚으로 여기고 춥다는 말도 안 한다고. 자기는 마감 연장 부탁에 익숙해서 대신 말한다고.',
          "I asked Gibaek why he hadn't asked for help. He said nothing; Gamgi answered for him. Gibaek counts a favour as a debt and won't even say he's cold — so Gamgi, used to begging deadline extensions, asks for him."],
      }),
      never: scene([
        line(M, '저도 난로는 처음이에요. 그래도 배 엔진보다는 쉽겠죠. 난로는 바다에 안 떠 있으니까요.', "It's my first stove too. But it must be easier than a boat engine. A stove doesn't float on the sea."),
        line(P, '(공구 가방을 내미는데, 볼펜이 섞여 있다.)', "(He holds out a tool bag. There are ballpoint pens mixed in.)"),
        line(M, '하나씩 풀어 보면 돼요. 푼 순서대로 늘어놓고요. 콘티 그리듯이요.', "We just take it apart piece by piece. Lay them out in the order they came off. Like drawing a storyboard."),
        line(M, '거꾸로 조립하면 원래대로 돌아와요. 아마요.', "Put it back in reverse and it goes back to how it was. Probably."),
      ], {
        choices: [
          opt('ok', '순서대로 늘어놓으면서 해 볼게요', "I'll lay them out in order as I go", {
            say: ['네. 푼 순서대로 늘어놓으면서 해 볼게요.', "All right. I'll lay the parts out in order as I go."],
            end: endTalk({ accept: true, offer: 'never_fixed' }),
            note: ['난로는 고쳐 본 적이 없지만 해 보겠다고 했다. 마감기 씨는 자기도 처음이라며, 볼펜이 섞인 공구 가방을 내밀었다. 콘티 그리듯 푼 순서대로 늘어놓고 거꾸로 조립하면 된다고.', "I said I'd never fixed a stove but would try. Gamgi said it was his first too, and held out a tool bag with pens mixed in. Lay the parts out in order like a storyboard, then reassemble in reverse."] }),
          opt('joke', '이번엔 마감 도주가 아니라 난로 도주예요?', "So this time it's a stove escape, not a deadline one?", {
            say: ['이번엔 마감 도주가 아니라 난로 도주입니까?', "So this time it's not a deadline escape but a stove escape?"],
            next: 'joke' }),
        ],
        note: ['마감기 씨도 난로는 처음이라고 했다. 그래도 바다에 안 떠 있으니 배 엔진보다는 쉬울 거라고.', "Gamgi said it was his first stove too — but it doesn't float, so it should be easier than a boat engine."],
      }),
      joke: scene([
        act(M, 'laugh'),
        line(M, '아니에요. 이번엔 진짜 마감이 있어요. 겨울이요. 겨울은 연장이 안 돼요.', "No. This time there's a real deadline. Winter. Winter doesn't get extensions."),
        line(P, '(웃다가 금세 진지해진다.)', "(He laughs, then quickly turns serious.)"),
        line(M, '여든한 번째 겨울이래요. 할아버지 말로는요.', "It's his eighty-first winter, he says."),
        line(M, '그 숫자는 저도 콘티에 못 그리겠어요. 그러니까 오늘 고쳐요.', "That number's something even I can't draw in a storyboard. So we fix it today."),
      ], {
        end: endTalk({ accept: true, offer: 'joke_escape' }),
        note: ['이번엔 난로 도주냐고 농담했다. 마감기 씨는 웃다가 금세 진지해져, 이번엔 겨울이라는 진짜 마감이 있다고 했다. 송기백 씨의 여든한 번째 겨울이라고, 그러니 오늘 고치자고.',
          "I joked that this was a stove escape. Gamgi laughed, then turned serious: this time the deadline was real — winter, which can't be extended. It was Gibaek's eighty-first. We'd fix it today."],
      }),
    },
  },
  // N13-3 — 끝내는 자리(송기백 · 마감기가 대신 말한다)
  {
    id: 'n13_3_done', questId: 'N13-3', at: 'complete', npcId: S, start: 'start',
    nodes: {
      start: scene([
        line(M, '불 붙었어요!', "It's lit!"),
        line(P, '부품 하나만 갈면 되는 거였네요.', "So it just needed one part replaced."),
        line(M, '할아버지가 손 쬐었어요. 봤어요?', "Grandpa Song's warming his hands. Did you see?"),
        act(S, 'silence'),
        line(P, '(송기백 씨는 난로 앞에서 손만 쬐고 있다. 아무 말이 없다.)', "(Gibaek just holds his hands to the stove. He says nothing.)"),
        line(M, '고맙다는 말은… 안 해요. 대신 자리 하나 더 만들었대요.', "He won't say thank you... but he says he's made one more place."),
        line(P, '자리요?', "A place?"),
        line(S, '…사진 앞에. 거기 앉아.', "...In front of the photograph. Sit there."),
      ], {
        choices: [
          opt('lesson', '난로 고치는 법, 마감기 씨한테 배울게요', "I'll learn stove repair from you, Gamgi", {
            say: ['난로 고치는 법, 마감기 씨가 어깨너머로 배운 거죠. 저도 배우겠습니다.', "Gamgi, you picked up stove repair by watching, didn't you? I'll learn it too."],
            next: 'lesson' }),
          opt('pay', '부품값과 품삯은 받을게요', "I'll take the cost of the part and my wage", {
            say: ['부품값과 품삯 받겠습니다.', "I'll take the cost of the part, and my wage."],
            next: 'pay' }),
          opt('decline', '자리 하나 만들어 주셨으면 됐어요', "Making me a place is enough", {
            say: ['자리 하나 만들어 주셨으면 됐습니다.', "Making me a place is thanks enough."],
            next: 'decline' }),
          opt('cold', '폐어선에서 겨울 나는 법, 여쭤봐도 될까요?', "May I ask how to winter on the hulk?", {
            say: ['송기백 씨, 폐어선에서 겨울 나는 법 좀 여쭤봐도 될까요?', "Gibaek, may I ask how you get through winter on the hulk?"],
            next: 'cold' }),
        ],
        note: ['태안 신진도로 돌아가 송기백 씨의 난로를 손봤다. 부품 하나였다. 불이 붙자 송기백 씨는 손을 쬐었다. 고맙다는 말은 없었고, 대신 사진 앞에 내 자리를 하나 더 만들어 주었다.',
          "Back in Sinjindo, Taean, I fixed Gibaek's stove — it was one part. When it lit, he warmed his hands. There was no thank-you; instead, he made one more place for me in front of the photograph."],
      }),
      lesson: scene([
        line(M, '배 위에서 뭐든 고쳐요, 저는. 원고 빼고.', "I fix anything on a boat. Except manuscripts."),
        line(M, '기계는 거짓말을 안 해요. 안 되는 데가 꼭 소리를 내요.', "Machines don't lie. The part that's wrong always makes a noise."),
        line(P, '원고는요?', "And manuscripts?"),
        line(M, '원고는 안 되는 데가 조용해서 못 고치는 거예요. 소리부터 들어요.', "With a manuscript, the broken part is silent — that's why I can't fix them. Listen for the noise first."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['난로 고치는 법을 마감기 씨에게 배우겠다고 했다. 마감기 씨는 원고 빼고 뭐든 고친다며, 기계는 안 되는 데가 꼭 소리를 내니 소리부터 들으라고 했다. 원고는 조용해서 못 고친다고.',
          "I said I'd learn stove repair from Gamgi. He fixes anything except manuscripts, he said — machines always make a noise where they're broken, so listen first. Manuscripts are silent, which is why he can't fix them."],
      }),
      pay: scene([
        line(M, '네. 원고료 들어왔어요, 드디어.', "Sure. My manuscript fee finally came in."),
        act(M, 'give', { to: P }),
        line(P, '(이번엔 봉투가 봉투답다.)', "(This time the envelope actually feels like one.)", { act: 'receive' }),
        line(M, '부품값은 영수증대로, 품삯은 넉넉히요. 할아버지가 그러래요. 빚지기 싫다고요.', "The part at cost, and a generous wage. Grandpa Song's orders. He doesn't want to be in debt."),
        line(M, '저는 빚져도 되는데, 할아버지는 안 된대요.', "I'm allowed to owe people, but he says he isn't."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['부품값과 품삯을 받겠다고 했다. 마감기 씨는 드디어 원고료가 들어왔다며 넉넉한 봉투를 건넸다. 빚지기 싫다는 송기백 씨의 뜻이라고.',
          "I said I'd take the cost of the part and a wage. Gamgi's manuscript fee had finally come in, and he handed over a proper envelope — Gibaek's wish, since he hates owing anyone."],
      }),
      decline: scene([
        line(M, '…그 자리, 저도 있어요. 옆에.', "...I've got one of those places too. Right beside yours."),
        line(P, '(송기백 씨의 사진 앞에, 셋의 자리가 있다.)', "(In front of Gibaek's photograph, there are places for three.)"),
        line(M, '할아버지는 자리를 만들어 주는 걸로 고맙다고 해요. 말 대신요.', "Grandpa Song says thank you by making a place for you. Instead of words."),
        line(M, '이제 세 자리네요. 겨울에 셋이면 난로가 하나여도 따뜻할 거예요.', "So now there are three. With three of us in winter, one stove will be warm enough."),
      ], {
        end: endTalk({ complete: 'decline' }),
        note: ['자리 하나 만들어 줬으면 됐다고 했다. 마감기 씨는 그 옆에 자기 자리도 있다고 했다. 송기백 씨의 사진 앞에 셋의 자리가 생겼다. 겨울에 셋이면 난로가 하나여도 따뜻할 거라고.',
          "I said the place he'd made for me was enough. Gamgi said his own was right beside it. In front of Gibaek's photo there were now three places — with three, one stove would keep a winter warm."],
      }),
      cold: scene([
        act(S, 'silence'),
        line(P, '(마감기 씨가 송기백 씨 쪽으로 몸을 숙여 귓속말을 하고 돌아온다.)', "(Gamgi leans toward Gibaek, whispers in his ear and comes back.)"),
        line(M, '바닥부터 막으래요. 바람은 위가 아니라 아래로 들어온대요.', "He says block the floor first. The wind comes in from below, not above."),
        line(M, '그리고 잘 때 양말 두 겹. 그건 제가 덧붙인 거예요.', "And two pairs of socks at night. That part I added."),
        line(S, '…맞아.', "...That's right.", { act: 'nod' }),
        line(M, '들었죠? 할아버지한테는 그게 고맙다는 말이에요.', "You heard that? For Grandpa Song, that's a thank-you."),
      ], {
        end: endTalk({ complete: 'cold_tip' }),
        note: ['폐어선에서 겨울 나는 법을 물었다. 송기백 씨 대신 마감기 씨가 귓속말로 듣고 와서, 바람은 아래로 들어오니 바닥부터 막으라고 전했다. 양말 두 겹은 자기가 덧붙였다고. 송기백 씨가 맞다고 고개를 끄덕였다.',
          "I asked how to get through winter on the hulk. Gamgi whispered with Gibaek and relayed it: the wind comes in from below, so block the floor first. Two pairs of socks was his own addition. Gibaek nodded — that's right."],
      }),
    },
  },
];
