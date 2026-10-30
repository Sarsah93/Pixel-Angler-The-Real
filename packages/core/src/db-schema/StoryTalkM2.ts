/**
 * @file StoryTalkM2.ts
 * @description 254차 — 제2부 「위판」 이어지는 대화 · 290차 — 받는 자리 · 끝내는 자리 대본(주고받는 장면)으로 다시 썼다(M2-01 ~ M2-11).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`. 시범(문체 기준) = `StoryTalkN01.ts`.
 *
 * 왜(사용자 지시 원문 요지): 「혼자서 대답을 다해버리고 … 정보를 한번에 전달하는 형태야. 그건 잘못된 대화 방법이야」 —
 *  의뢰인이 한 덩어리로 쏟던 말을, 주인공이 묻고 되묻는 사이에 조금씩 나오게 했다. 「호칭은 'OOO씨'로 통일」 —
 *  주인공은 인물을 「도현수 씨」 · 「나기범 씨」로 부르고(영어는 이름만), 어촌계 사람(계장 · 사무실)은 부르는 말 없이 말한다.
 *
 * 인물 말투
 *  - 동명항 어촌계 계장(도현수의 할아버지) — 짧게, 규칙으로 말한다 · 나를 「너」 · 「계장이 한 사람 편 들면 그날로 계가 아니다」. 주인공은 합니다체.
 *  - 도현수(24 · 라이벌) — 퉁명스러운 반말 · 인정은 한마디만. 주인공은 해요체로 맞받는다.
 *  - 나기범(28 · 횟집 · 내향) — 말수 적은 해요체 · 말 대신 의자 · 수조로 말한다.
 *  - 서하린(26 · 초보 유튜버) — 들뜬 해요체 · 「~래요!」 · 들은 얘기를 솔직히 들은 얘기라고 한다.
 *  - 짐 강(58 · 유작 루어를 찾는 사람) — 짧은 반말 · 묻는 말에 늦게, 조금만 답한다.
 *  - 정옥선(71 · 만복상회) — 무뚝뚝한 반말 · 손이 예전 같지 않은 것을 감춘다.
 *
 * M2-09 「총회」(254차 갈래)는 단계 id · 고를 말 id · 표시 · 우호도 · 조건 · 끝을 그대로 두고 대사 꼴만 장면으로 바꿨다.
 *  290차 — 받는 끝마다 옛 받는 답(`end.offer`)을 묶었고, 옛 답 「편을 안 드시느냐」(ask_silence)에 닿는 말 하나(rival/silence)를 더했다.
 *  정본: 메인 편이라 받는 자리는 늘 받는다 · 반대표의 까닭은 끝내 나오지 않는다(나레이션 · 물어보기와 같다 — 「표는 표야」).
 *  갈래는 계장 · 도현수의 마음과, 정옥선의 마음(보증서 도장 — 총회장에서 손자 탓을 하면 그 도장이 같이 욕먹는다)만 바꾼다.
 *
 * 표시(남기는 곳 → 읽는 곳)
 *  - choice.m2_09_asked_favor     받는 자리(계장에게 손자에게 한마디 넣어 달라 했다) → 끝내는 자리(도현수에게 그것 때문이냐고 묻는다)
 *  - choice.m2_09_owned_unsold    받는 자리(유찰된 상자를 내 입으로 먼저 꺼내겠다) → 끝내는 자리(그게 표가 됐느냐고 묻는다)
 *  그 밖의 표시는 새로 만들지 않았다 — 끝마다 묶인 옛 답(`end.offer` · `end.complete`)의 표시 · 결과가 그대로 붙는다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const COOP = 'coop';
const HS = 'hyeonsu';
const OK = 'okseon';
const NG = 'na_gibeom';
const HR = 'seo_harin';
const JK = 'jim_kang';
const P = 'player';

export const TALKS_M2: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // M2-01 「첫 위판」 — 받는 자리(어촌계장) · 부산으로 떠나기 전
  // ═══════════════════════════════════════════
  {
    id: 'm2_01_offer', questId: 'M2-01', at: 'offer', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(COOP, '부산 갈 준비는 됐냐.', 'Ready to go to Busan?'),
        line(P, '짐은 쌌습니다. 그런데 가서 뭘 먼저 해야 할지 모르겠습니다.', "I've packed. But I don't know what to do first when I get there."),
        line(COOP, '위판장부터 등록해라.', 'Register at the auction floor first.'),
        line(P, '위판장에는 뭘 내면 됩니까?', 'What do I put up at the auction?'),
        line(COOP, '통발 어획물만 낸다. 통발 한 번 걷어서 나온 걸로.', 'Only trap catch. Haul your traps once and put up what comes out.'),
        line(P, '낚싯대로 잡은 건요?', 'And what I catch with a rod?'),
        line(COOP, '손도 대지 마. 계원이 돼도 그건 못 판다고 들었을 거다.', "Don't even touch it. You'll have heard — even members can't sell that."),
        line(P, '…네. 정옥선 씨한테 들었습니다.', '...Yes. Okseon told me.'),
        line(COOP, '그리고 상자 규격 지키고.', 'And stick to the crate standard.'),
        line(P, '(…내 이름이 붙는 첫 상자다.)', '(...The first crate with my name on it.)'),
      ], {
        choices: [
          opt('first', '제 이름으로 내는 첫 상자입니다. 규격대로 하겠습니다', "My first crate under my name. I'll keep to standard", {
            say: ['제 이름으로 내는 첫 상자입니다. 규격대로 하겠습니다.', "It's the first crate I'll put up under my own name. I'll keep to the standard."],
            next: 'first' }),
          opt('crate', '상자 규격이요? 크기 말고 또 뭐가 있습니까?', 'The crate standard? What is there besides size?', { next: 'crate' }),
          opt('busan', '부산 위판장은 속초하고 많이 다릅니까?', 'Is the Busan auction very different from Sokcho?', { next: 'busan' }),
        ],
        note: ['부산으로 떠나기 전, 계장은 위판장부터 등록하라고 했다. 통발 어획물만 내고, 낚싯대로 잡은 건 손도 대지 말고, 상자 규격을 지키라고. 내 이름이 붙는 첫 상자다.',
          "Before I left for Busan, the chief told me to register at the auction floor first. Put up only trap catch, don't even touch what I'd caught with a rod, and keep to the crate standard. It would be the first crate with my name on it."],
      }),
      first: scene([
        line(COOP, '그래. 규격은 사람들이 서로 안 속이려고 만든 거다.', "Good. The standard was made so people don't cheat each other."),
        line(COOP, '상자 크기, 얼음 깔기, 무게 표시. 하나라도 어긋나면 판정원이 네 상자 앞에 오래 선다.', "Crate size, the ice, the weight label. Get any one wrong and the grader stands in front of your crate a long time."),
        line(P, '…하나도 어긋나지 않게 하겠습니다.', "...I won't get any of it wrong."),
        line(COOP, '첫 상자부터 그런 꼴 당하지 마라.', "Don't let that happen with your very first crate."),
      ], {
        end: endTalk({ accept: true, offer: 'first_crate' }),
        note: ['내 이름으로 내는 첫 상자이니 규격대로 하겠다고 했다. 규격은 서로 안 속이려고 만든 것이고, 하나라도 어긋나면 판정원이 상자 앞에 오래 선다고 했다.', "I said it was the first crate under my own name and I'd keep to the standard. The standard exists so people don't cheat each other, I was told — get anything wrong and the grader stands at your crate a long time."],
      }),
      crate: scene([
        line(COOP, '크기는 기본이고. 한 상자에 한 어종, 얼음은 위아래로, 무게는 적힌 대로.', "Size is the basics. One species per crate, ice above and below, and the weight as written."),
        line(P, '섞어 담으면 안 됩니까?', "Can't I mix them?"),
        line(COOP, '섞어 담으면 제일 못한 놈 값으로 친다.', 'Mix them and the whole crate is priced at the worst fish in it.'),
        line(COOP, '규격은 사는 사람이 상자를 안 열어 보고도 믿게 하는 약속이다.', "The standard is a promise that lets the buyer trust the crate without opening it."),
      ], {
        choices: [
          opt('ok', '규격대로 담아 오겠습니다', "I'll pack it to standard", {
            end: endTalk({ accept: true, offer: 'ask_crate' }),
            note: ['규격대로 담아 오겠다고 했다.', 'I said I would pack it to standard.'] }),
          opt('regret', '낚싯대로 잡은 게 더 크고 좋은데, 아깝네요', "What I caught on the rod is bigger and better. Such a waste", { next: 'regret' }),
        ],
        note: ['상자 규격이 크기 말고 뭐가 더 있느냐고 물었다. 한 상자에 한 어종, 얼음은 위아래로, 무게는 적힌 대로. 규격은 사는 사람이 상자를 안 열어 보고도 믿게 하는 약속이라고 했다.', "I asked what the crate standard covered besides size. One species per crate, ice above and below, the weight as written. The standard is a promise that lets a buyer trust a crate without opening it."],
      }),
      regret: scene([
        line(COOP, '아까우면 먹어. 그게 법이다.', "If it's a waste, eat it. That's the law."),
        act(COOP, 'silence'),
        line(COOP, '위판장엔 그런 거 슬쩍 섞는 사람들이 꼭 있다. 한 번 걸리면 그 사람 이름 붙은 상자는 다시 아무도 안 본다.', "There are always people who slip that sort of thing in at the auction. Get caught once and nobody looks at a crate with that name on it again."),
        line(P, '…', '...'),
        line(COOP, '상자 하나 때문에 이름 버리지 마라.', "Don't throw away your name for one crate."),
      ], {
        end: endTalk({ accept: true, offer: 'rod_regret' }),
        note: ['낚싯대로 잡은 게 더 크고 좋아서 아깝다고 했다. 아까우면 먹으라고, 그게 법이라고 짧게 잘랐다. 상자 하나 때문에 이름을 버리지 말라고.', "I said it was a waste, since what I'd caught on the rod was bigger and better. If it's a waste, eat it — that's the law, came the short reply. Don't throw away your name for one crate."],
      }),
      busan: scene([
        line(COOP, '크다. 사람도 많고 목소리도 크다.', "It's big. Lots of people, and loud ones."),
        line(COOP, '거기선 아무도 네 얼굴 모른다. 그러니 상자가 네 얼굴이다.', "Nobody there knows your face. So your crate is your face."),
        line(P, '상자가 제 얼굴이요.', 'My crate is my face.'),
        line(COOP, '소개장은 내가 써 준다. 창구에 내밀고 등록부터 해라.', "I'll write you a letter of introduction. Hand it in at the window and register first."),
      ], {
        end: endTalk({ accept: true, offer: 'busan_big' }),
        note: ['부산 위판장이 속초와 많이 다르냐고 물었다. 크고 시끄럽고, 아무도 내 얼굴을 모르니 상자가 내 얼굴이라고 했다. 소개장을 써 줄 테니 창구에서 등록부터 하라고.', "I asked if the Busan auction was very different from Sokcho. Big and loud, I was told — nobody would know my face, so my crate would be my face. He'd write a letter of introduction; I was to register at the window first."],
      }),
    },
  },

  // M2-01 — 끝내는 자리(어촌계장)
  {
    id: 'm2_01_done', questId: 'M2-01', at: 'complete', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(COOP, '첫 상자가 낙찰됐다더라.', "I hear your first crate sold."),
        line(P, '네. 경매사가 손을 드는데, 숨도 못 쉬겠더라고요.', "Yes. When the auctioneer raised his hand, I could hardly breathe."),
        line(COOP, '다들 그렇다.', 'Everyone feels that.'),
        line(COOP, '위판장에서 사람 눈치 읽는 법을 배웠으면 경매장 배짱도 생겼겠지.', "If you learned to read people on the auction floor, you'll have picked up some nerve for the sale too."),
        act(COOP, 'give', { to: P }),
        line(COOP, '상자값이다.', 'The money for your crate.'),
        line(P, '…감사합니다.', '...Thank you.', { act: 'receive' }),
        line(COOP, '그리고 규격 상자, 이제 직판장에서 살 수 있게 해 뒀다.', "And I've arranged for you to buy standard crates at the direct-sale market now."),
      ], {
        choices: [
          opt('watch', '경매사가 손 드는 순서를 보고 있었습니다', 'I was watching the order the hands went up', {
            say: ['경매사가 손을 드는 순서를 보고 있었습니다. 다음엔 더 잘 읽을 것 같습니다.', "I was watching the order the auctioneer's hands went up. I think I'll read it better next time."],
            end: endTalk({ complete: 'watch',
              lineKo: '그 눈이 배짱이다. 배짱도 익히면 는다. 경매사 손만 보지 말고 중매인 얼굴도 봐. 사고 싶은 사람은 손보다 눈이 먼저 움직인다. 그걸 읽으면 언제 상자를 내야 할지 보인다.',
              lineEn: "That eye is nerve. Nerve grows with practice. Don't just watch the auctioneer's hands — watch the brokers' faces too. Someone who wants to buy moves their eyes before their hands. Read that and you'll see when to put your crate up." }),
            note: ['경매사가 손 드는 순서를 보고 있었다고 했다. 그 눈이 배짱이라고, 중매인 얼굴도 보라고 했다. 사고 싶은 사람은 손보다 눈이 먼저 움직인다고.', "I said I'd been watching the order the hands went up. That eye was nerve, I was told — watch the brokers' faces too. Someone who wants to buy moves their eyes before their hands."] }),
          opt('nervous', '제 이름이 상자에 붙는 게 아직 어색합니다', 'Seeing my name on a crate still feels strange', {
            end: endTalk({ complete: 'nervous',
              lineKo: '어색해야 정상이다. 익숙해지면 그때부터 조심해. 이름 붙은 상자는 네가 없는 데서도 네 대신 말한다. 얼음 덜 깐 상자는 네가 게으르다고 말하고. 그러니 그 어색한 마음 그대로 담아.',
              lineEn: "It should feel strange. Once it doesn't, be careful. A crate with your name on it speaks for you where you aren't. A crate with too little ice says you're lazy. So pack it with that strange feeling just as it is." }),
            note: ['내 이름이 상자에 붙는 게 아직 어색하다고 했다. 어색해야 정상이라고, 이름 붙은 상자는 내가 없는 데서도 나 대신 말한다고 했다.', "I said seeing my name on a crate still felt strange. It should, I was told — a crate with your name on it speaks for you where you aren't."] }),
          opt('grader', '판정원이 한 번 보고 지나가던데, 좋은 겁니까?', 'The grader just glanced and moved on. Is that good?', {
            end: endTalk({ complete: 'grader_pass',
              lineKo: '좋은 거다. 판정원이 오래 서 있으면 뭔가 걸린 거야. 한 번 보고 지나가는 상자가 제값을 받는다. 다음에도 그렇게 담아. (말끝에 고개를 한 번 끄덕인다.)',
              lineEn: "It's good. If the grader stands there long, something's caught his eye. The crate he glances at and passes gets its full price. Pack it like that next time too. (He nods once as he finishes.)" }),
            note: ['판정원이 한 번 보고 지나가던데 좋은 거냐고 물었다. 좋은 거라고, 오래 서 있으면 뭔가 걸린 거라고 했다. 말끝에 고개를 한 번 끄덕였다.', "I asked whether the grader glancing and moving on was good. It was — if he lingers, something's wrong. He nodded once as he said it."] }),
        ],
        note: ['내 이름이 붙은 첫 상자가 낙찰됐다. 계장은 다들 그렇다며 상자값을 건넸고, 이제 직판장에서 규격 상자를 살 수 있게 해 뒀다고 했다.',
          "My first crate with my name on it sold. The chief said everyone felt the same, handed me the money for it, and said he'd arranged for me to buy standard crates at the direct-sale market."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M2-02 「유찰」 — 받는 자리(어촌계장) · 얼음을 아낀 대가
  // ═══════════════════════════════════════════
  {
    id: 'm2_02_offer', questId: 'M2-02', at: 'offer', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(COOP, '유찰됐다며.', "I hear it went unsold."),
        line(P, '…벌써 들으셨습니까.', '...You heard already.'),
        line(COOP, '판정원이 선도 라벨 옆에 줄 그었다는 것까지 들었다.', 'I even heard the grader drew a line beside your freshness label.'),
        line(P, '아무 말도 없이 긋더라고요.', 'He drew it without a word.'),
        line(COOP, '말할 필요가 없으니까.', "Because he didn't need to say one."),
        line(COOP, '쿨러 열어 봐. 얼음이 얼마나 남았는지.', 'Open your cooler. See how much ice is left.'),
        line(P, '쿨러를요?', 'My cooler?'),
        line(COOP, '그걸 복기라고 한다.', "That's what's called a review."),
        line(COOP, '다 보고 나면 얼음 다시 챙겨서 세 건 내. 왜 그랬는지는 그다음에 나한테 말하고.', "Once you've looked, get your ice again and put up three lots. Then tell me why it happened."),
      ], {
        choices: [
          opt('open', '…열어 보겠습니다. 제 눈으로 보겠습니다', "...I'll open it. I'll see for myself", {
            say: ['…열어 보겠습니다. 뭐가 틀렸는지 제 눈으로 보겠습니다.', "...I'll open it. I'll see with my own eyes what went wrong."],
            next: 'open' }),
          opt('review', '복기요? 바둑에서 하는 그거 말입니까?', 'A review? Like in baduk?', { next: 'review' }),
          opt('cost', '얼음값도 만만치 않습니다. 아낄 수밖에 없었습니다', "Ice isn't cheap. I had no choice but to save", { next: 'cost' }),
        ],
        note: ['상자 하나가 유찰됐다. 판정원은 아무 말 없이 선도 라벨 옆에 줄을 그었다. 계장은 쿨러를 열어 얼음이 얼마나 남았는지 보라고, 그게 복기라고 했다. 얼음을 다시 챙겨 세 건을 내고 왜 그랬는지 말하라고.',
          "One of my crates went unsold. The grader had drawn a line beside its freshness label without a word. The chief told me to open my cooler and see how much ice was left — that was a review. Then get ice again, put up three lots, and tell him why."],
      }),
      open: scene([
        line(COOP, '그래. 남한테 들은 건 잊어도 제 눈으로 본 건 안 잊는다.', "Good. You forget what others tell you, but not what you see yourself."),
        line(P, '(쿨러를 연다. 얼음이 반쯤 녹아 물이 되어 있다.)', '(I open the cooler. Half the ice has melted into water.)'),
        line(COOP, '얼음이 물이 됐으면 그게 답이다. 녹은 물에 잠긴 고기는 살이 물러진다.', "If the ice has turned to water, there's your answer. Fish sitting in meltwater go soft."),
        line(COOP, '판정원은 그걸 손가락 한 번 눌러 보고 안다.', 'The grader knows with one press of his finger.'),
      ], {
        choices: [
          opt('go', '얼음부터 다시 챙기겠습니다', "I'll get more ice first", {
            end: endTalk({ accept: true, offer: 'open_cooler' }),
            note: ['얼음부터 다시 챙기기로 했다.', 'I decided to get more ice first.'] }),
          opt('ashamed', '이름 붙은 상자가 유찰되니까… 창피했습니다', 'When a crate with my name went unsold... I was ashamed', { next: 'ashamed' }),
        ],
        note: ['쿨러를 열었다. 얼음이 반쯤 녹아 물이 되어 있었다. 녹은 물에 잠긴 고기는 살이 물러지고, 판정원은 손가락 한 번 눌러 보고 안다고 했다.', "I opened the cooler. Half the ice had melted into water. Fish sitting in meltwater go soft, I was told, and a grader can tell with one press of the finger."],
      }),
      ashamed: scene([
        line(COOP, '창피한 건 하루면 간다. 같은 짓 두 번 하면 그건 오래 간다.', "Shame lasts a day. Do the same thing twice and that lasts a long time."),
        line(COOP, '이름 붙은 상자는 다 한 번씩 그렇게 떨어진다. 다들 그렇게 배웠어.', "Every crate with a name on it goes unsold like that once. That's how everyone learned."),
        line(P, '…다들요.', '...Everyone.'),
        line(COOP, '얼음 다시 챙겨.', 'Go get more ice.'),
      ], {
        end: endTalk({ accept: true, offer: 'ashamed' }),
        note: ['이름 붙은 상자가 유찰되니 창피했다고 털어놓았다. 창피한 건 하루면 가지만 같은 짓을 두 번 하면 오래 간다고, 다들 그렇게 배웠다고 했다.', "I admitted I'd been ashamed when a crate with my name went unsold. Shame lasts a day, I was told, but doing the same thing twice lasts much longer — everyone learned that way."],
      }),
      review: scene([
        line(COOP, '그래, 그거. 둔 수를 처음부터 다시 놓아 보는 거.', 'Yes, that. Laying out the moves you played again from the start.'),
        line(COOP, '상자도 같다. 언제 잡았고, 얼음은 언제 얼마나 넣었고, 뚜껑은 몇 번 열었는지.', "Crates are the same. When you caught it, when and how much ice went in, how many times you opened the lid."),
        line(P, '처음부터 짚어 보면…', 'If I go through it from the start...'),
        line(COOP, '어디서 녹았는지 나온다.', "You'll find where it melted."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_review' }),
        note: ['복기가 바둑에서 하는 그거냐고 물었다. 둔 수를 처음부터 다시 놓아 보듯, 언제 잡았고 얼음을 언제 얼마나 넣었고 뚜껑을 몇 번 열었는지 짚어 보면 어디서 녹았는지 나온다고 했다.', "I asked if a review was like the one in baduk. Just as you lay out the moves again from the start, I was told, go through when I caught it, when and how much ice went in and how often I opened the lid — and I'd find where it melted."],
      }),
      cost: scene([
        line(COOP, '얼음값 아끼고 상자값 날렸지. 그게 아낀 거냐.', "You saved on ice and lost the crate. Is that saving?"),
        line(P, '…', '...'),
        line(COOP, '얼음은 비용이 아니다. 상자값에 들어 있는 거다. 상자 하나 유찰되면 얼음 열 번 살 돈이 날아가.', "Ice isn't a cost. It's part of the crate's price. One unsold crate and you've lost enough to buy ice ten times."),
        line(COOP, '계산은 그렇게 하는 거다. 얼음부터 다시 챙겨.', "That's how you do the sums. Go get more ice first."),
      ], {
        end: endTalk({ accept: true, offer: 'ice_cost' }),
        note: ['얼음값이 만만치 않아 아낄 수밖에 없었다고 했다. 얼음값을 아끼고 상자값을 날렸으니 그게 아낀 거냐고, 얼음은 비용이 아니라 상자값에 들어 있는 거라고 했다.', "I said ice wasn't cheap and I'd had to save. I'd saved on ice and lost the crate, I was told — was that saving? Ice isn't a cost; it's part of the crate's price."],
      }),
    },
  },

  // M2-02 — 끝내는 자리(어촌계장)
  {
    id: 'm2_02_done', questId: 'M2-02', at: 'complete', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(P, '세 건 다 냈습니다. 이번엔 얼음 넉넉히 깔았습니다.', "I put up all three lots. This time I laid plenty of ice."),
        line(COOP, '들었다. 판정원이 그냥 지나갔다더라.', 'I heard. The grader walked straight past.'),
        line(COOP, '그래서. 지난번엔 왜 녹았냐.', 'So. Why did it melt last time?'),
        line(P, '…', '...'),
        line(COOP, '말해 봐. 네 입으로.', 'Say it. In your own words.'),
      ], {
        choices: [
          opt('own', '제 잘못입니다. 얼음을 아꼈습니다', 'It was my fault. I skimped on ice', { next: 'own' }),
          opt('excuse', '경매장까지 거리가 멀었습니다', 'It was a long way to the auction house', {
            end: endTalk({ complete: 'excuse',
              lineKo: '거리는 네가 잰 거지. 얼음도 네가 넣은 거고. 멀면 얼음을 더 넣으면 된다. 거리는 못 바꿔도 얼음은 바꿀 수 있어. 못 바꾸는 걸 핑계로 대면 배우는 게 없다.',
              lineEn: "You measured the distance. You put in the ice, too. If it's far, put in more ice. You can't change the distance, but you can change the ice. Blame what you can't change and you learn nothing." }),
            note: ['경매장까지 거리가 멀었다고 했다. 거리는 못 바꿔도 얼음은 바꿀 수 있다고, 못 바꾸는 걸 핑계로 대면 배우는 게 없다고 했다.', "I said the auction house had been a long way off. You can't change the distance but you can change the ice, I was told — blame what you can't change and you learn nothing."] }),
          opt('log', '얼음 넣은 때랑 뚜껑 연 횟수를 적어 두겠습니다', "I'll write down when I add ice and how often I open the lid", {
            say: ['다음부터 얼음 넣은 때랑 뚜껑 연 횟수를 적어 두겠습니다.', "From now on I'll write down when I put ice in and how many times I open the lid."],
            end: endTalk({ complete: 'ice_log',
              lineKo: '적는 사람은 안 잊는다. (내 쪽을 똑바로 본다.) 바다 일은 기억으로 하면 틀린다. 적어 둔 게 다음 상자를 살린다. 그게 쌓이면 네 장부가 되는 거다.',
              lineEn: "People who write things down don't forget. (He looks straight at me.) Do sea work from memory and you get it wrong. What you write down saves the next crate. Pile it up and it becomes your ledger." }),
            note: ['얼음 넣은 때와 뚜껑 연 횟수를 적어 두겠다고 했다. 적는 사람은 안 잊는다고, 그게 쌓이면 내 장부가 된다고 했다.', "I said I'd write down when I added ice and how often I opened the lid. People who write things down don't forget, I was told — and it all builds into a ledger of my own."] }),
        ],
        note: ['얼음을 넉넉히 깔아 위판 세 건을 다 냈다. 판정원은 그냥 지나갔다고 했다. 계장은 지난번엔 왜 녹았는지 내 입으로 말해 보라고 했다.',
          "I laid plenty of ice and put up all three lots. The grader walked straight past this time. The chief told me to say, in my own words, why it had melted before."],
      }),
      own: scene([
        line(COOP, '그렇게 말하는 놈은 다음 상자를 안 잃는다.', "Someone who says that won't lose the next crate.", { act: 'nod' }),
        act(COOP, 'give', { to: P }),
        line(COOP, '이번 한 번은 계가 얼음값을 대 준다. 다음은 없다.', "Just this once, the co-op will cover your ice. There won't be a next time."),
      ], {
        end: endTalk({ complete: 'own',
          lineKo: '남 탓 하는 사람은 같은 데서 또 넘어진다. 제 탓 하는 사람은 넘어진 자리를 기억하고. 얼음 아끼면 상자를 잃는다. 한 번 배우면 두 번 안 한다.',
          lineEn: "People who blame others trip in the same place again. People who blame themselves remember where they fell. Skimp on ice and you lose the crate. Learn it once and you won't do it twice." }),
        note: ['내 잘못이라고, 얼음을 아꼈다고 말했다. 그렇게 말하는 사람은 다음 상자를 안 잃는다며, 이번 한 번은 계가 얼음값을 대 준다고 했다. 다음은 없다고.', "I said it was my fault — I'd skimped on ice. Someone who says that won't lose the next crate, I was told, and the co-op covered my ice just this once. There would be no next time."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M2-03 「감천항의 겨울」 — 받는 자리(도현수)
  // ═══════════════════════════════════════════
  {
    id: 'm2_03_offer', questId: 'M2-03', at: 'offer', npcId: HS, start: 'start',
    nodes: {
      start: scene([
        line(HS, '너도 감천 왔냐.', "You came to Gamcheon too?", { act: 'look_up' }),
        line(P, '도현수 씨도 와 있었네요.', "You're here too, Hyeonsu."),
        line(HS, '겨울엔 여기야. 감성돔.', "In winter, it's here. Black porgy."),
        line(P, '여기 바닥은 어때요?', "What's the bottom like here?"),
        line(HS, '감천항은 밑걸림 천지야.', 'Gamcheon Harbour is snags everywhere.'),
        line(HS, '채비 잃는 법부터 배워.', 'Learn how to lose your rig first.'),
        line(P, '잃는 법이요?', 'How to lose it?'),
        line(HS, '그리고 감성돔. 40 넘는 거 올려.', 'And black porgy. Land one over forty.'),
        line(HS, '그럼 인정해 줄게.', "Then I'll give you credit."),
        line(P, '(…인정. 그 말을 도현수 씨 입에서 들을 수 있을까.)', "(...Credit. Will I ever hear that from Hyeonsu's mouth?)"),
      ], {
        choices: [
          opt('over', '40, 넘겨 볼게요. 인정한다는 말 꼭 들어야겠어요', "I'll top forty. I want to hear you give me credit", { next: 'over' }),
          opt('lose', '채비 잃는 법이요? 안 잃는 법이 아니고요?', "How to lose a rig? Not how not to lose one?", { next: 'lose' }),
          opt('record', '인정은 됐고요, 도현수 씨 기록부터 말해 봐요', "Forget credit. Tell me your own record first", { next: 'record' }),
        ],
        note: ['겨울 감천항에서 도현수 씨를 다시 만났다. 감천은 밑걸림 천지라 채비 잃는 법부터 배우라고, 감성돔 40cm 넘는 걸 올리면 인정해 주겠다고 했다.',
          "I ran into Hyeonsu again at Gamcheon Harbour in winter. Gamcheon is snags everywhere, he said, so learn how to lose a rig first — and if I landed a black porgy over forty centimetres, he'd give me credit."],
      }),
      over: scene([
        line(HS, '말은 쉽지. 겨울 감성돔은 바닥에서 꼼짝을 안 해.', "Easy to say. Winter porgy don't budge from the bottom."),
        line(HS, '찌는 깊게. 걸리면 잡아당기지 말고 줄부터 늦춰.', "Set the float deep. When you snag, don't yank — slacken the line first."),
        line(P, '당기면요?', 'And if I pull?'),
        line(HS, '억지로 당기면 채비도 잃고 자리도 잃어.', 'Force it and you lose the rig and the spot both.'),
      ], {
        choices: [
          opt('ok', '찌는 깊게, 걸리면 줄부터. 알겠어요', 'Float deep, slack off when it snags. Got it', {
            end: endTalk({ accept: true, offer: 'over_forty' }),
            note: ['찌는 깊게, 걸리면 줄부터 늦추기로 했다.', 'Float deep, and slack the line first when it snags — I kept that in mind.'] }),
          opt('cold', '부산 겨울바람이 이렇게 매운 줄 몰랐어요', "I never knew Busan's winter wind was this bitter", { next: 'cold' }),
        ],
        note: ['40을 넘겨 인정받겠다고 했다. 도현수 씨는 말은 쉽다며, 겨울 감성돔은 바닥에서 꼼짝을 안 하니 찌를 깊게 주고 걸리면 당기지 말고 줄부터 늦추라고 했다.', "I said I'd top forty and earn his credit. Easy to say, Hyeonsu said — winter porgy don't budge from the bottom, so set the float deep and slacken the line, not yank it, when it snags."],
      }),
      cold: scene([
        line(HS, '겨울 감천은 원래 그래. 바람이 항구 안까지 파고들어.', "Gamcheon in winter is like that. The wind digs right into the harbour."),
        line(HS, '장갑 낀 채로 줄 만지는 것도 익혀 둬.', 'Learn to handle line with your gloves on, too.'),
        line(P, '장갑 끼고는 감이 잘 안 오던데요.', "I can't really feel anything with gloves on."),
        line(HS, '손 시리다고 맨손으로 하다가는 챔질 타이밍 다 놓쳐.', "Go bare-handed because it's cold and you'll miss every strike."),
      ], {
        end: endTalk({ accept: true, offer: 'cold_wind' }),
        note: ['부산 겨울바람이 이렇게 매운 줄 몰랐다고 했다. 겨울 감천은 원래 그렇다고, 손 시리다고 맨손으로 하다간 챔질 타이밍을 다 놓치니 장갑 낀 채로 줄 만지는 걸 익히라고 했다.', "I said I'd never known Busan's winter wind was so bitter. Gamcheon is like that in winter, he said — learn to handle line with gloves on, or you'll miss every strike."],
      }),
      lose: scene([
        line(HS, '안 잃는 법 같은 건 없어. 감천은 바닥이 다 돌이랑 버려진 줄이야.', "There's no such thing as not losing it. Gamcheon's bottom is all rocks and abandoned line."),
        line(P, '그럼 덜 잃는 법은요?', 'Then how do I lose less?'),
        line(HS, '목줄을 원줄보다 약하게 묶어 둬. 걸리면 목줄만 끊어지게.', "Tie your leader weaker than your main line. So when it snags, only the leader breaks."),
        line(HS, '그게 잃는 법이야.', "That's how you lose a rig."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_lose' }),
        note: ['안 잃는 법이 아니라 잃는 법이냐고 물었다. 감천 바닥은 다 돌이랑 버려진 줄이라 안 잃는 법은 없다고, 목줄을 원줄보다 약하게 묶어 걸리면 목줄만 끊어지게 하라고 했다.', "I asked why it was how to lose a rig, not how not to. Gamcheon's bottom is all rocks and old line, he said, so there's no not losing — tie the leader weaker than the main line so only the leader breaks."],
      }),
      record: scene([
        line(HS, '…내 기록 알아서 뭐 하게.', '...What do you want my record for?', { act: 'look_up' }),
        line(P, '비교라도 해 보게요.', 'Just to compare.'),
        line(HS, '40 넘기고 나서 물어. 그럼 말해 줄지도 모르지.', "Ask after you've topped forty. Maybe I'll tell you then."),
        line(HS, '그 전엔 내 숫자 들어 봐야 네 손만 굳어.', "Before that, hearing my numbers will only stiffen your hands."),
      ], {
        end: endTalk({ accept: true, offer: 'your_record' }),
        note: ['인정은 됐고 기록부터 말해 보라고 했다. 도현수 씨는 눈썹을 올리고, 40을 넘기고 나서 물으라고 했다. 그 전엔 자기 숫자를 들어 봐야 내 손만 굳는다고.', "I told him to forget credit and tell me his record. Hyeonsu raised his eyebrows: ask after I'd topped forty. Before that, his numbers would only stiffen my hands."],
      }),
    },
  },

  // M2-03 — 끝내는 자리(도현수) · 계측자 앞
  {
    id: 'm2_03_done', questId: 'M2-03', at: 'complete', npcId: HS, start: 'start',
    nodes: {
      start: scene([
        line(P, '계측자에 올려 볼게요.', "I'll put it on the measuring board."),
        line(HS, '…', '...', { act: 'peer' }),
        act(HS, 'silence'),
        line(HS, '…42.', '...Forty-two.'),
        line(HS, '알겠어.', 'All right.'),
        line(P, '그게 다예요?', "That's it?"),
        act(HS, 'give', { to: P, item: 'qr_rod_gamcheon' }),
        line(HS, '이 대는 감천 바람에 맞춰 튜닝한 거야. 네 거 부러뜨리기 아까우면 이걸 써.', "This rod's tuned for the Gamcheon wind. If you don't want to break yours, use this."),
        line(P, '…이걸 저한테요?', "...You're giving this to me?", { act: 'receive' }),
      ], {
        choices: [
          opt('rival', '인정한다는 말, 들은 걸로 할게요', "I'll take that as the credit you promised", {
            end: endTalk({ complete: 'rival',
              lineKo: '한 번이다. 두 번은 아직. 다음 겨울에도 40 넘기면 그때 두 번이라고 해 줄게. 그 대, 초릿대가 예민하니까 밑걸림 났을 때 확 세우지 마. 부러져.',
              lineEn: "Once. Not twice yet. If you top forty again next winter, I'll call it twice. That rod's tip is sensitive, so don't yank it up when you snag. It'll snap." }),
            note: ['인정한다는 말을 들은 걸로 하겠다고 했다. 도현수 씨는 한 번이라고, 두 번은 아직이라고 했다. 다음 겨울에도 40을 넘기면 그때 두 번이라고.', "I said I'd take that as his credit. Once, Hyeonsu said — not twice yet. If I topped forty again next winter, he'd call it twice."] }),
          opt('lost', '채비를 두 번 잃었어요. 배운 게 더 많은 바다네요', "I lost my rig twice. This sea taught me more", {
            say: ['채비를 두 번 잃었어요. 감천은 배운 게 더 많은 바다네요.', "I lost my rig twice. Gamcheon is a sea I learned more from."],
            end: endTalk({ complete: 'lost_rigs',
              lineKo: '잃은 채비 수만큼 바다를 아는 거야. 그 대는 여기 바람에 맞춰 튜닝했어. 써. 나도 여기 바닥에 채비 꽤 묻었어. 언젠가 네 바늘에 내 채비가 같이 올라와도 놀라지 마. 감천은 그런 데야.',
              lineEn: "You know the sea by as many rigs as you've lost. That rod's tuned for the wind here. Use it. I've buried plenty of rigs on this bottom myself. If your hook brings one of mine up someday, don't be surprised. That's Gamcheon." }),
            note: ['채비를 두 번 잃었고 감천은 배운 게 더 많은 바다라고 했다. 잃은 채비 수만큼 바다를 아는 거라고, 자기도 여기 바닥에 채비를 꽤 묻었다고 했다.', "I said I'd lost my rig twice and Gamcheon had taught me more. You know a sea by the rigs you've lost, Hyeonsu said — he'd buried plenty on this bottom himself."] }),
          opt('credit', '수심 더 주라고 한 거, 그게 먹혔어요', "Setting the float deeper, like you said — that worked", {
            say: ['수심 더 주라고 한 거, 그게 먹혔어요. 반은 도현수 씨 거예요.', "Setting the float deeper, like you told me — that's what worked. Half of it's yours, Hyeonsu."],
            end: endTalk({ complete: 'credit_rival',
              lineKo: '…반은 무슨. 올린 건 네 손이야. (계측자에서 눈을 떼지 않는다.) 말은 누구나 해 줄 수 있어. 그 말 듣고 버티는 건 아무나 못 하고. 그 대 써. 감천 바람엔 그게 맞아.',
              lineEn: "...Half, nothing. Your hands brought it up. (He doesn't take his eyes off the measuring board.) Anyone can give advice. Not everyone can listen to it and hold on. Use that rod. It's right for the Gamcheon wind." }),
            note: ['수심을 더 주라는 말이 먹혔으니 반은 도현수 씨 거라고 했다. 반은 무슨, 올린 건 내 손이라고 했다. 계측자에서 눈을 떼지 않았다.', "I said his advice about the depth had worked, so half the fish was his. Half nothing, he said — my hands had brought it up. He didn't take his eyes off the measuring board."] }),
        ],
        note: ['감성돔을 계측자에 올렸다. 42cm. 도현수 씨는 한참 말이 없다가 알겠다고만 했다. 그러고는 감천 바람에 맞춰 튜닝한 자기 대를 내밀었다.',
          "I laid the black porgy on the measuring board. Forty-two centimetres. Hyeonsu was silent a long while, then just said all right — and held out his own rod, tuned for the Gamcheon wind."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M2-04 「남의 가게」 — 받는 자리(나기범) · 손님 없는 횟집, 수조만 돈다
  // ═══════════════════════════════════════════
  {
    id: 'm2_04_offer', questId: 'M2-04', at: 'offer', npcId: NG, start: 'start',
    nodes: {
      start: scene([
        line(NG, '…어서 오세요.', '...Welcome.', { act: 'look_up' }),
        line(P, '아, 손님은 아니에요. 지나가다가 수조가 비어 있길래요.', "Oh, I'm not a customer. I was passing and saw the tanks were empty."),
        line(NG, '…네. 비어 있어요.', '...Yes. They are.', { act: 'look_away' }),
        act(NG, 'silence'),
        line(NG, '통발 하세요?', 'Do you work traps?'),
        line(P, '네. 계원이라 통발은 걷어요.', "Yes. I'm a co-op member, so I haul traps."),
        line(NG, '그럼 통발 것, 세 번만 가져와 봐요.', 'Then bring me trap catch. Just three times.'),
        line(P, '세 번이요? 값은 얼마나 쳐 주시는데요?', 'Three times? How much would you pay?'),
        line(NG, '값은 나중이고요. 꾸준한지 보고 싶어요.', "The price can wait. I want to see if you're steady."),
        line(NG, '넘기기 전에 손질해서요. 세 마리.', "Cleaned before you hand them over. Three fish."),
        line(P, '(손님 없는 가게에, 수조 모터 소리만 돌아간다.)', '(In the empty shop, only the hum of the tank motors goes on.)'),
      ], {
        choices: [
          opt('steady', '값보다 꾸준함이라면, 그건 자신 있어요', "If it's steadiness over price, I can do that", { next: 'steady' }),
          opt('ask', '꾸준함을 산다는 건 무슨 뜻이에요?', 'What do you mean, buying steadiness?', {
            say: ['꾸준함을 산다는 건 무슨 뜻이에요? 값이 아니라요?', 'What do you mean by buying steadiness? Not the price?'],
            next: 'ask' }),
          opt('empty', '손님도 없는데… 납품이 꼭 필요하세요?', "With no customers... do you really need deliveries?", { next: 'empty' }),
        ],
        note: ['손님 없이 수조만 돌아가는 횟집에서 나기범 씨를 만났다. 통발 것을 세 번만, 넘기기 전에 손질해서 가져와 보라고 했다. 값은 나중이고 꾸준한지 보고 싶다고.',
          "I met Na Gibeom in a sashimi restaurant with no customers, only the tanks running. He asked me to bring him trap catch three times, cleaned before handing it over. The price could wait — he wanted to see if I was steady."],
      }),
      steady: scene([
        line(NG, '…그 말, 다들 해요.', '...Everyone says that.', { act: 'look_away' }),
        line(NG, '세 번째까지 오는 사람이 드물어요. 오면 그때 얘기해요.', "Few people make it to the third time. If you do, we'll talk then."),
        line(P, '손질은 어디까지 해 오면 될까요?', 'How far should I take the cleaning?'),
        line(NG, '피 뺀 거랑 안 뺀 거, 수조 앞에서 다 보여요.', "Bled or not bled — it all shows in front of the tank."),
      ], {
        end: endTalk({ accept: true, offer: 'steady_vow' }),
        note: ['꾸준함이라면 자신 있다고 했다. 나기범 씨는 그 말은 다들 한다고, 세 번째까지 오는 사람이 드물다고 했다. 피를 뺐는지 안 뺐는지는 수조 앞에서 다 보인다고.', "I said I could do steadiness. Everyone says that, Gibeom replied — few make it to the third time. Whether a fish was bled or not shows in front of the tank."],
      }),
      ask: scene([
        line(NG, '횟집은 손님이 올지 안 올지 몰라요. 그래도 수조는 늘 차 있어야 해요.', "A sashimi place never knows if customers will come. But the tanks always have to be full."),
        line(P, '그래서 꾸준한 사람이요?', "So you need someone steady?"),
        line(NG, '싸게 한 번 주는 사람보다, 제값에 매번 오는 사람이 필요해요.', "I need someone who comes every time at a fair price, more than someone who sells cheap once."),
        line(NG, '그런 사람이 있으면 저는 가게만 보면 되니까요. 세 번, 기다릴게요.', "With someone like that, I only have to mind the shop. Three times. I'll wait."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_steady' }),
        note: ['꾸준함을 산다는 게 무슨 뜻이냐고 물었다. 횟집은 손님이 올지 모르지만 수조는 늘 차 있어야 해서, 싸게 한 번 주는 사람보다 제값에 매번 오는 사람이 필요하다고 했다.', "I asked what he meant by buying steadiness. A sashimi place never knows if customers will come, but the tanks must always be full — so he needed someone who came every time at a fair price, not someone who sold cheap once."],
      }),
      empty: scene([
        act(NG, 'silence'),
        line(NG, '…없으니까요. 있을 때 준비하면 늦어요.', "...Because there aren't any. If you wait until there are, it's too late."),
        line(P, '…죄송해요. 말이 좀 그랬네요.', "...Sorry. That came out wrong."),
        line(NG, '수조가 비어 있으면 손님이 문 앞에서 돌아가요. 그래서 꾸준한 사람이 필요한 거예요.', "When the tanks are empty, customers turn back at the door. That's why I need someone steady."),
        line(NG, '세 번, 가져와 봐요.', 'Bring it three times.'),
      ], {
        end: endTalk({ accept: true, offer: 'empty_shop' }),
        note: ['손님도 없는데 납품이 필요하냐고 물었다가 아차 싶었다. 나기범 씨는 잠깐 말이 없다가, 없으니까 필요하다고 했다. 수조가 비어 있으면 손님이 문 앞에서 돌아간다고.', "I asked whether he needed deliveries with no customers, and regretted it at once. Gibeom went quiet, then said that was exactly why — when the tanks are empty, customers turn back at the door."],
      }),
    },
  },

  // M2-04 — 끝내는 자리(나기범) · 세 번째
  {
    id: 'm2_04_done', questId: 'M2-04', at: 'complete', npcId: NG, start: 'start',
    nodes: {
      start: scene([
        line(P, '세 번째예요. 손질해서 가져왔어요.', "This is the third time. I've brought it cleaned."),
        line(NG, '…피도 잘 뺐네요.', '...Bled properly, too.', { act: 'peer' }),
        act(NG, 'silence'),
        line(NG, '세 번.', 'Three times.'),
        line(NG, '(수조 앞에 의자를 하나 내놓는다.) 수조 앞 의자, 그거 앉으세요.', '(He sets a chair out in front of the tank.) That chair by the tank. Have a seat.'),
        line(P, '의자요?', 'The chair?'),
        line(NG, '이제 단골이에요. 단가는 다음에 정하고요.', "You're a regular now. We'll settle the price next time."),
      ], {
        choices: [
          opt('steady', '값은 나중이라도 좋아요. 계속 가져올게요', "The price can wait. I'll keep bringing it", {
            end: endTalk({ complete: 'steady',
              lineKo: '그 말이 계약이에요. (수조 옆에 내 이름을 쓴 종이를 붙인다.) 종이 계약서는 서랍에 들어가면 잊어요. 수조 옆에 붙은 이름은 매일 봐요. 빠지는 날이 생기면 그 종이가 먼저 알아요.',
              lineEn: "Those words are the contract. (He tapes a slip of paper with my name on it beside the tank.) A paper contract gets forgotten in a drawer. A name by the tank gets seen every day. If you ever miss a day, that slip will know first." }),
            note: ['값은 나중이라도 계속 가져오겠다고 했다. 나기범 씨는 그 말이 계약이라며, 수조 옆에 내 이름을 쓴 종이를 붙였다.', "I said the price could wait and I'd keep bringing it. Those words were the contract, Gibeom said, and taped a slip with my name on it beside the tank."] }),
          opt('price', '단가는 지금 정하고 싶어요', "I'd like to settle the price now", { next: 'price' }),
          opt('chair', '의자… 앉아도 돼요? 이런 건 처음이라서요', "The chair... can I sit? I've never had this", {
            end: endTalk({ complete: 'took_chair',
              lineKo: '앉으라고 내놓은 거예요. 서서 기다리는 사람은 금방 가요. …말은 잘 못해요. 그래서 의자로 말한 거예요. 다음에 와서도 거기 앉아요.',
              lineEn: "I put it out for you to sit on. People who wait standing leave soon. ...I'm not good with words. So I said it with a chair. Sit there next time too." }),
            note: ['의자에 앉아도 되느냐고 물었다. 앉으라고 내놓은 거라고, 말은 잘 못해서 의자로 말한 거라고 했다.', "I asked if I could really sit in the chair. He'd put it out for me to sit on, Gibeom said — he wasn't good with words, so he'd said it with a chair."] }),
        ],
        note: ['세 번째로 손질한 통발 것을 가져갔다. 나기범 씨는 피도 잘 뺐다며 수조 앞에 의자를 하나 내놓았다. 이제 단골이라고, 단가는 다음에 정하자고 했다.',
          "I brought cleaned trap catch for the third time. Gibeom said I'd bled it properly and set a chair out in front of the tank. I was a regular now, he said; we'd settle the price next time."],
      }),
      price: scene([
        line(NG, '…급하네요.', "...You're in a hurry."),
        line(NG, '그래도 세 번 왔으니까요. (계산기를 두드린다.)', 'Still, you came three times. (He taps at a calculator.)'),
        act(NG, 'give', { to: P }),
        line(P, '(…첫 단가는 낮았다.)', '(...The first price was low.)', { act: 'receive' }),
      ], {
        end: endTalk({ complete: 'price',
          lineKo: '첫 단가는 원래 낮아요. 단가는 숫자로 정하는 게 아니라 횟수로 쌓는 거예요. 세 번은 이제 시작이에요.',
          lineEn: "First prices are always low. A price isn't set with numbers — it's built up with visits. Three is just the start." }),
        note: ['단가를 지금 정하고 싶다고 했다. 나기범 씨는 급하다면서도 계산기를 두드려 값을 쳐 주었다. 첫 단가는 낮았다. 단가는 횟수로 쌓는 거라고 했다.', "I said I wanted to settle the price now. Gibeom said I was in a hurry, but tapped at his calculator and paid me. The first price was low — a price is built up with visits, he said."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M2-05 「품질관리 교육」 — 받는 자리(어촌계장)
  // ═══════════════════════════════════════════
  {
    id: 'm2_05_offer', questId: 'M2-05', at: 'offer', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(COOP, '품질관리 교육 날짜 나왔다.', 'The date for the quality control course is out.'),
        line(P, '품질관리요?', 'Quality control?'),
        line(COOP, '수산물 위생, 이력 표기, 냉장. 계원은 필수다.', 'Seafood hygiene, traceability labels, cold storage. Required for members.'),
        line(P, '교실에서 듣는 겁니까?', 'Is it in a classroom?'),
        line(COOP, '듣고, 손으로도 해 본다. 배운 대로 두 마리 손질하고, 이력 적어서 회 한 접시.', "You listen, and you do it by hand too. Clean two fish the way you're taught, then write up the record and slice a plate of sashimi."),
        line(COOP, '이수하면 루어 채비도 열어 주지.', "Finish it and we'll open up lure tackle for you."),
        line(P, '루어요?', 'Lures?'),
        line(COOP, '그리고 도현수도 간다.', 'And Do Hyeonsu is going too.'),
        line(P, '…같은 교실입니까?', '...The same classroom?'),
        line(COOP, '싸우지 말고.', "Don't fight."),
      ], {
        choices: [
          opt('attend', '빠짐없이 듣겠습니다. 루어도 배우고 싶었습니다', "I'll attend every session. I've wanted to learn lures", { next: 'attend' }),
          opt('lure', '품질관리 교육이랑 루어가 무슨 상관입니까?', 'What has quality control got to do with lures?', { next: 'lure' }),
          opt('gripe', '싸우지 말라니요. 도현수 씨가 먼저 시비 거는 겁니다', "Don't fight? He's the one who always starts it", {
            say: ['싸우지 말라니요. 도현수 씨가 먼저 시비 거는 겁니다.', "Don't fight? Hyeonsu's the one who always picks it."],
            next: 'gripe' }),
        ],
        note: ['수산물 품질관리 교육 날짜가 나왔다. 위생, 이력 표기, 냉장은 계원 필수라고, 배운 대로 두 마리를 손질하고 이력을 적어 회 한 접시를 뜨라고 했다. 이수하면 루어 채비를 열어 준다고. 도현수 씨도 간다고 했다.',
          "The date for the seafood quality control course was out. Hygiene, traceability labels and cold storage were required for members — clean two fish the way I was taught, write up the record and slice a plate of sashimi. Finish it and lure tackle would open up. Hyeonsu was going too."],
      }),
      attend: scene([
        line(COOP, '루어는 덤이다. 교육은 네 상자를 사는 사람을 위한 거다.', 'Lures are a bonus. The course is for the people who buy your crates.'),
        line(COOP, '어디서 언제 잡아서 어떻게 왔는지 적을 줄 알아야 계원 상자다.', "It's only a member's crate if you can write down where and when it was caught and how it got here."),
        line(P, '…졸지 않겠습니다.', "...I won't doze off."),
        line(COOP, '그래. 졸지 말고 들어.', "Right. Don't doze, and listen."),
      ], {
        end: endTalk({ accept: true, offer: 'attend' }),
        note: ['빠짐없이 듣겠다고, 루어도 배우고 싶었다고 했다. 루어는 덤이고 교육은 내 상자를 사는 사람을 위한 거라고 했다. 어디서 언제 잡아 어떻게 왔는지 적을 줄 알아야 계원 상자라고.', "I said I'd attend every session and had wanted to learn lures. Lures were a bonus, I was told — the course was for the people buying my crates. It's only a member's crate if you can write down where and when it was caught and how it got there."],
      }),
      lure: scene([
        line(COOP, '계원은 기본이 먼저다. 위생도 이력도 모르는 사람한테 루어부터 쥐여 주면 순서가 거꾸로다.', "For members, the basics come first. Handing lures to someone who knows nothing of hygiene or records gets the order backwards."),
        line(P, '순서요.', 'The order.'),
        line(COOP, '그리고 루어는 잃어버리면 바다 밑에 쇳덩이로 남는다.', 'And a lost lure stays on the seabed as a lump of metal.'),
        line(COOP, '바다 아끼는 법을 배운 사람한테 여는 거다. 교육부터 받아.', "It's opened to people who've learned to care for the sea. Take the course first."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_lure' }),
        note: ['품질관리 교육이랑 루어가 무슨 상관이냐고 물었다. 기본이 먼저라고, 그리고 잃어버린 루어는 바다 밑에 쇳덩이로 남으니 바다 아끼는 법을 배운 사람한테 여는 거라고 했다.', "I asked what quality control had to do with lures. Basics first, I was told — and a lost lure stays on the seabed as a lump of metal, so it's opened only to those who've learned to care for the sea."],
      }),
      gripe: scene([
        line(COOP, '알아. 그 애가 그렇다.', "I know. That's how he is."),
        act(COOP, 'sigh'),
        line(COOP, '그래도 교실에선 둘 다 계원이다. 옆자리면 필기나 같이 해.', "Still, in the classroom you're both members. If you're sitting together, take notes together."),
        line(COOP, '싸우는 것보다 그게 그 애한테 더 따끔하다.', "That'll sting him more than any fight."),
      ], {
        end: endTalk({ accept: true, offer: 'rival_gripe' }),
        note: ['도현수 씨가 먼저 시비를 건다고 했다. 계장은 그 애가 그렇다고 한숨을 쉬고, 교실에선 둘 다 계원이니 옆자리면 필기나 같이 하라고 했다. 그게 싸우는 것보다 더 따끔할 거라고.', "I said Hyeonsu was the one who always picked fights. The chief sighed — that's how he is — and said that in the classroom we were both members, so if we sat together, we should take notes together. That would sting him more than a fight."],
      }),
    },
  },

  // M2-05 — 끝내는 자리(어촌계장)
  {
    id: 'm2_05_done', questId: 'M2-05', at: 'complete', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(P, '수료증 받았습니다.', "I've got my certificate."),
        line(COOP, '수료했지.', 'You finished.', { act: 'nod' }),
        line(COOP, '루어는 이제 네 거다. 직판장에서 입문 루어도 살 수 있게 해 뒀다.', "Lures are yours now. I've arranged for you to buy starter lures at the direct-sale market."),
        line(P, '미끼 없이 낚는 거 말입니까?', 'You mean fishing without bait?'),
        line(COOP, '미끼 냄새 안 나는 낚시. 배워 봐.', "Fishing that doesn't smell of bait. Learn it."),
        line(COOP, '옆자리는 어땠냐.', 'And how was the seat next to you?'),
        line(P, '…생각보다 조용했습니다.', '...Quieter than I expected.'),
      ], {
        choices: [
          opt('notes', '도현수 씨랑 필기를 비교해 봤습니다', 'I compared notes with Hyeonsu', {
            say: ['도현수 씨랑 필기를 비교해 봤습니다. 도현수 씨가 더 꼼꼼했습니다.', "I compared notes with Hyeonsu. His were more thorough."],
            end: endTalk({ complete: 'notes',
              lineKo: '알아. 그 애는 그런 애다. 너는 다른 게 있고. 그 애는 적고, 너는 해 본다. 둘 다 있어야 한다. …필기 비교했다는 얘기, 그 애한테는 하지 마라. 우쭐해서 한 달은 간다.',
              lineEn: "I know. That's him. You've got something else. He writes things down; you try them. You need both. ...Don't tell him you compared notes. He'll be smug about it for a month." }),
            note: ['도현수 씨와 필기를 비교해 봤더니 그쪽이 더 꼼꼼했다고 했다. 그 애는 적고 나는 해 본다고, 둘 다 있어야 한다고 했다. 필기 비교 얘기는 본인한테 하지 말라고.', "I said I'd compared notes with Hyeonsu and his were more thorough. He writes things down and I try them, the chief said — you need both. Just don't tell him we compared notes."] }),
          opt('lure', '루어를 빨리 던져 보고 싶습니다', "I can't wait to cast a lure", {
            end: endTalk({ complete: 'lure',
              lineKo: '던지기 전에 액션부터 배워. 루어는 미끼가 아니라 손이 미끼다. 미끼는 냄새로 부르고 루어는 움직임으로 부른다. 같은 루어도 감는 속도에 따라 다른 고기가 된다. 직판장 입문 루어로 연습부터 해.',
              lineEn: "Learn the action before you cast. With a lure, it's not the lure that's bait, it's your hand. Bait calls with smell; a lure calls with movement. The same lure becomes a different fish depending on how fast you reel. Practise with a starter lure from the market first." }),
            note: ['루어를 빨리 던져 보고 싶다고 했다. 루어는 손이 미끼라고, 미끼는 냄새로 부르고 루어는 움직임으로 부른다고 했다. 입문 루어로 연습부터 하라고.', "I said I couldn't wait to cast a lure. With a lure, your hand is the bait, I was told — bait calls with smell, a lure with movement. Practise with a starter lure first."] }),
          opt('home', '배운 위생 절차, 속초 좌판에도 알려 드리고 싶습니다', "I'd like to share the hygiene steps with the Sokcho stalls", {
            end: endTalk({ complete: 'bring_home',
              lineKo: '좋은 생각이다. 배운 건 돌려줘야 계 일이다. 다만 좌판 어른들한테 가르친다는 말은 하지 마라. 보여 주기만 해. 그 양반들은 보고 배우지 듣고 안 배운다.',
              lineEn: "Good thinking. What you learn has to be given back — that's co-op work. But don't say you're teaching the stall elders. Just show them. They learn by watching, not by listening." }),
            note: ['배운 위생 절차를 속초 좌판에도 알려 드리고 싶다고 했다. 좋은 생각이라고, 다만 가르친다는 말은 하지 말고 보여 주기만 하라고 했다.', "I said I'd like to share the hygiene steps with the stalls in Sokcho. Good thinking, I was told — but don't say I'm teaching; just show them."] }),
        ],
        note: ['품질관리 교육을 수료했다. 계장은 루어는 이제 내 것이라며 직판장에서 입문 루어도 살 수 있게 해 뒀다고 했다. 옆자리는 어땠느냐고 물었다.',
          "I finished the quality control course. Lures were mine now, the chief said, and he'd arranged for me to buy starter lures at the direct-sale market. Then he asked how the seat next to me had been."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M2-06 「암남공원의 밤」 — 받는 자리(서하린)
  // ═══════════════════════════════════════════
  {
    id: 'm2_06_offer', questId: 'M2-06', at: 'offer', npcId: HR, start: 'start',
    nodes: {
      start: scene([
        line(HR, '저기요! 혹시 낚시하시는 분 맞죠?', 'Excuse me! You fish, right?'),
        line(P, '…네. 맞는데요.', "...Yes, I do.", { act: 'look_up' }),
        line(HR, '잘됐다! 오늘 밤에 여기 암남공원에 전갱이 들어온대요. 야간 루어로요!', "Perfect! They say horse mackerel are coming into Amnam Park tonight. Night lure fishing!"),
        line(P, '전갱이요?', 'Horse mackerel?'),
        line(HR, '네! 같이 던져요. 저 카메라도 가져왔어요.', "Yes! Let's cast together. I brought my camera, too."),
        line(P, '카메라는 왜요?', 'Why the camera?'),
        line(HR, '아, 제가 낚시 영상을 찍거든요.', 'Oh, I make fishing videos.'),
        line(HR, '그리고 낮에 통발 하나 만드는 것도 찍고 싶은데… 괜찮죠?', "And I'd love to film you making a trap during the day, too... that's okay, right?"),
        line(P, '통발을 손으로 만드는 걸요?', 'Making a trap by hand?'),
        line(HR, '네! 손으로 뭘 만드는 장면이 진짜 낚시 같잖아요.', 'Yes! Making something by hand looks like real fishing, you know?'),
      ], {
        choices: [
          opt('together', '좋아요. 루어는 배운 지 얼마 안 됐지만 같이 던져요', "Sure. I've only just learned lures, but let's cast together", { next: 'together' }),
          opt('channel', '찍어서 어디에 올리시는 거예요?', 'Where do you post what you film?', { next: 'channel' }),
          opt('shy', '카메라는 좀… 낚시만 같이 하면 안 될까요?', "I'm not sure about the camera... could we just fish?", { next: 'shy' }),
        ],
        note: ['암남공원에서 서하린 씨가 먼저 말을 걸어왔다. 오늘 밤 야간 루어로 전갱이가 들어온다며 같이 던지자고, 낮에 통발 하나 만드는 것도 찍고 싶다고 했다. 낚시 영상을 찍는 사람이었다.',
          "At Amnam Park, Seo Harin came up and spoke to me first. Horse mackerel were coming in tonight for night lure fishing, she said — let's cast together — and she wanted to film me making a trap during the day too. She made fishing videos."],
      }),
      together: scene([
        line(HR, '저도요! 그럼 초보끼리네요.', "Me too! So we're both beginners."),
        act(HR, 'laugh'),
        line(HR, '가로등 불빛 밑에 떼로 들어온대요. 느리게 감다가 한 번씩 톡, 하고 쳐 주래요.', "They say they school up under the lamplight. Reel slowly, then give it a little twitch now and then."),
        line(P, '그것도 들은 얘기예요?', 'Is that something you heard too?'),
        line(HR, '…다 들은 얘기예요. 같이 확인해 봐요!', "...It's all things I heard. Let's find out together!"),
      ], {
        end: endTalk({ accept: true, offer: 'cast_together' }),
        note: ['루어는 배운 지 얼마 안 됐지만 같이 던지자고 했다. 서하린 씨는 초보끼리라며 웃고, 불빛 밑에 전갱이가 떼로 들어온다는 것도 다 들은 얘기라고 털어놓았다. 같이 확인해 보자고.', "I said I'd only just learned lures but would cast with her. Harin laughed — two beginners, then — and admitted that what she knew about mackerel schooling under the lights was all hearsay. Let's find out together, she said."],
      }),
      channel: scene([
        line(HR, '제 채널이요! 낚시 채널인데… 아직 작아요. 많이 작아요.', "My channel! It's a fishing channel... it's still small. Very small."),
        line(P, '얼마나요?', 'How small?'),
        line(HR, '…그건 말 안 할래요.', "...I'm not telling you that."),
        line(HR, '그래서 진짜 낚시하는 사람 손이 필요해요. 제 손은 아직 어설퍼서 화면에서 티가 나요. 얼굴 싫으시면 손만 찍을게요.', "That's why I need the hands of someone who really fishes. Mine are still clumsy, and it shows on screen. If you don't want your face in it, I'll just film your hands."),
      ], {
        choices: [
          opt('ok', '손만이라면 괜찮아요', 'Just my hands is fine', {
            end: endTalk({ accept: true, offer: 'ask_channel' }),
            note: ['손만이라면 찍어도 괜찮다고 했다.', 'I said she could film my hands, if that was all.'] }),
          opt('why', '낚시하는 사람 많은데, 왜 저예요?', "Lots of people fish. Why me?", { next: 'why' }),
        ],
        note: ['찍어서 어디에 올리느냐고 물었다. 서하린 씨의 낚시 채널인데 아직 많이 작다고, 자기 손은 어설퍼서 화면에서 티가 나니 진짜 낚시하는 사람의 손이 필요하다고 했다.', "I asked where she posted her videos. Her fishing channel, Harin said — still very small. Her own hands were clumsy and it showed on screen, so she needed the hands of someone who really fished."],
      }),
      why: scene([
        line(HR, '음… 아까 던지는 거 봤어요. 손이 조용했어요.', "Hmm... I watched you cast earlier. Your hands were quiet."),
        line(HR, '화려한 사람은 많은데, 조용한 손은 드물어요.', "There are lots of flashy people, but quiet hands are rare."),
        line(P, '…그게 다예요?', "...That's it?"),
        act(HR, 'laugh'),
        line(HR, '그리고 솔직히, 다른 분들은 다 거절했어요. 그러니까 같이 해요!', "And honestly, everyone else said no. So let's do it!"),
      ], {
        end: endTalk({ accept: true, offer: 'why_me' }),
        note: ['왜 하필 나냐고 물었다. 아까 던지는 걸 봤는데 손이 조용했다고, 화려한 사람은 많아도 조용한 손은 드물다고 했다. 그리고 솔직히 다른 사람들은 다 거절했다며 웃었다.', "I asked why me. She'd watched me cast, Harin said, and my hands were quiet — flashy people were everywhere, quiet hands were rare. Then she laughed: honestly, everyone else had said no."],
      }),
      shy: scene([
        line(HR, '아… 네, 그럼 낚시 먼저요!', 'Oh... sure, fishing first, then!'),
        line(HR, '(삼각대를 반쯤 접다가 멈춘다.) 그래도 통발 만드는 손은 꼭 찍고 싶은데… 그건 이따 다시 여쭤볼게요.', "(She half folds the tripod, then stops.) I'd still really love to film your hands making the trap, though... I'll ask you again later."),
        line(P, '…생각해 볼게요.', "...I'll think about it."),
        line(HR, '일단 던져요!', "For now, let's cast!"),
      ], {
        end: endTalk({ accept: true, offer: 'camera_shy' }),
        note: ['카메라는 좀 그렇다고, 낚시만 같이 하자고 했다. 서하린 씨는 삼각대를 접다 말고, 통발 만드는 손은 꼭 찍고 싶으니 이따 다시 묻겠다고 했다.', "I said I wasn't sure about the camera — could we just fish? Harin stopped halfway through folding her tripod: she'd still love to film my hands making the trap, and would ask again later."],
      }),
    },
  },

  // M2-06 — 끝내는 자리(서하린)
  {
    id: 'm2_06_done', questId: 'M2-06', at: 'complete', npcId: HR, start: 'start',
    nodes: {
      start: scene([
        line(HR, '둘 다 찍었어요! 전갱이도, 통발도요!', 'I got both! The mackerel and the trap!'),
        line(P, '저는 손만 바빴던 것 같은데요.', 'All I did was keep my hands busy.'),
        line(HR, '그게 제일 좋아요. 편집해서 보여 드릴게요.', "That's the best part. I'll edit it and show you."),
        line(HR, '아, 그리고 이거요!', 'Oh, and this!'),
        act(HR, 'give', { to: P, item: 'qr_bag_field' }),
        line(HR, '촬영 스태프 가방인데, {player} 씨가 저보다 많이 들고 다니시니까요.', "It's a film crew bag. You carry more stuff around than I do, {player}."),
        line(P, '가방이요? 이걸 받아도 돼요?', 'A bag? Are you sure I can have this?', { act: 'receive' }),
        line(HR, '그럼요! 근데요… 영상에 얼굴 나와도 돼요?', 'Of course! But um... is it okay if your face is in the video?'),
      ], {
        choices: [
          opt('no', '얼굴은 찍지 말아 주세요', "Please don't film my face", {
            end: endTalk({ complete: 'camera_no',
              lineKo: '네! 손이랑 대만. 손이 더 멋있어요, 사실. 손은 거짓말을 못 하거든요. 표정은 꾸밀 수 있는데 손은 못 꾸며요. 아까 전갱이 걸렸을 때 그 손, 진짜 좋았어요.',
              lineEn: "Got it! Just hands and rod. Hands look cooler anyway, honestly. Hands can't lie, you know. You can fake a face, but not hands. Your hands when that mackerel hit — they were really good." }),
            note: ['얼굴은 찍지 말아 달라고 했다. 서하린 씨는 손이 더 멋있다고, 손은 거짓말을 못 한다고 했다.', "I asked her not to film my face. Harin said hands looked cooler anyway — hands can't lie."] }),
          opt('ok', '찍어도 돼요. 어차피 아는 사람도 없어요', "Go ahead. Nobody knows me anyway", {
            end: endTalk({ complete: 'camera_ok',
              lineKo: '고마워요! 첫 출연자예요. 사실 카메라 앞에서 제일 떠는 건 저예요. 같이 떨어 주는 사람이 있으니까 좀 낫네요. 다음에도 던질 때 불러도 돼요?',
              lineEn: "Thank you! You're my first guest. Honestly, I'm the one who gets most nervous in front of the camera. Having someone to be nervous with helps. Can I call you next time I'm casting?" }),
            note: ['찍어도 된다고, 어차피 아는 사람도 없다고 했다. 서하린 씨는 첫 출연자라며, 사실 카메라 앞에서 제일 떠는 건 자기라고 했다.', "I said she could film my face — nobody knew me anyway. Harin said I was her first guest, and that she was actually the most nervous one in front of the camera."] }),
          opt('credit', '리트리브를 바꾸니까 바로 물더라고요', 'The moment I changed the retrieve, they bit', {
            say: ['리트리브를 바꾸니까 바로 물더라고요. 서하린 씨 덕이에요.', "The moment I changed the retrieve, they bit. That's thanks to you, Harin."],
            next: 'credit' }),
        ],
        note: ['전갱이도, 통발 만드는 손도 다 찍었다고 서하린 씨가 들떠 있었다. 저보다 많이 들고 다닌다며 촬영 스태프 가방을 건네고, 영상에 얼굴이 나와도 되는지 물었다.',
          "Harin was thrilled — she'd filmed both the mackerel and my hands making the trap. Saying I carried more than she did, she handed me a film crew bag, then asked if my face could be in the video."],
      }),
      credit: scene([
        line(HR, '제 덕이요? 저 그거 영상에서 본 거예요!', "Thanks to me? I got that from a video!"),
        line(HR, '(화면을 돌려 내 캐스팅을 다시 본다.) …근데 진짜 됐네요.', '(She turns the screen and watches my cast again.) ...But it really worked.'),
        line(P, '들은 얘기도 맞을 때가 있네요.', 'Sometimes hearsay turns out right.'),
      ], {
        end: endTalk({ complete: 'credit_retrieve',
          lineKo: '그럼 오늘 영상 제목은 리트리브로 할래요. 초보가 초보한테 배운 거요.',
          lineEn: "Then today's video title is going to be about the retrieve. A beginner learning from a beginner." }),
        note: ['리트리브를 바꾸니 바로 물었다고, 서하린 씨 덕이라고 했다. 영상에서 본 거라며 놀라더니, 오늘 영상 제목을 초보가 초보한테 배운 리트리브로 하겠다고 했다.', "I said the mackerel bit as soon as I changed the retrieve — thanks to her. Harin was surprised; she'd only seen it in a video. Today's title would be about the retrieve, she said: a beginner learning from a beginner."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M2-07 「통제선」 — 받는 자리(어촌계장) · 몰래 넘는 길은 없다
  // ═══════════════════════════════════════════
  {
    id: 'm2_07_offer', questId: 'M2-07', at: 'offer', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(COOP, '방파제에 통제선 쳐진 건 봤지.', "You've seen the control line across the breakwater."),
        line(P, '네. 줄이 쳐져 있더군요. 그런데 그 너머로 넘어가는 사람들도 있던데요.', "Yes, there's a line strung across. But I saw people going past it."),
        line(COOP, '넘어가지 마.', "Don't cross it."),
        line(P, '안쪽 자리가 좋다던데요.', "They say the spots inside are good."),
        line(COOP, '좋아 보이는 거 안다. 그래도 넘지 마.', "I know they look good. Don't cross anyway."),
        line(COOP, '합법으로 가는 길이 세 가지 있다.', 'There are three legal ways in.'),
        line(P, '세 가지요?', 'Three?'),
        line(COOP, '계 동행, 낚시공원, 선상. 하나 골라.', 'Going with the co-op, the fishing park, or a boat. Pick one.'),
        line(COOP, '고를 때까진 통제선 바깥 갯바위에서 낚아. 두 마리면 된다.', "Until you've picked, fish the rocks outside the line. Two will do."),
      ], {
        choices: [
          opt('wont', '넘을 생각 없습니다. 제 이름이 계 이름이니까요', "I won't cross. My name is the co-op's name", { next: 'wont' }),
          opt('accident', '사고가 있었다던데… 무슨 일이었습니까?', 'I heard there was an accident... what happened?', { next: 'accident' }),
          opt('others', '다들 넘어가던데요. 저만 돌아가면 손해 아닙니까?', "Everyone else crosses. Don't I lose out going the long way?", { next: 'others' }),
        ],
        note: ['방파제에 출입통제선이 쳐졌다. 계장은 넘지 말라고, 합법으로 가는 길은 계 동행, 낚시공원, 선상 세 가지니 하나 고르라고 했다. 고를 때까진 통제선 바깥 갯바위에서 두 마리를 낚으라고.',
          "A no-entry line went up across the breakwater. The chief told me not to cross it — there were three legal ways: going with the co-op, the fishing park, or a boat. Pick one, and until then catch two on the rocks outside the line."],
      }),
      wont: scene([
        line(COOP, '그래. 그걸 아는 사람은 줄 앞에서 안 망설인다.', "Good. Someone who knows that doesn't hesitate at the line."),
        line(COOP, '세 길 다 시간이 걸린다. 몰래 넘는 사람들이 빨라 보여도 오래 못 간다.', "All three ways take time. The ones sneaking across may look quicker, but they don't last."),
        line(P, '셋 중 하나…', 'One of the three...'),
        line(COOP, '골라서 와.', 'Pick one and come back.'),
      ], {
        choices: [
          opt('ok', '생각해 보고 고르겠습니다', "I'll think it over and choose", {
            end: endTalk({ accept: true, offer: 'wont_cross' }),
            note: ['셋 중 하나를 생각해 보고 고르기로 했다.', 'I said I would think it over and choose one of the three.'] }),
          opt('cost', '세 길 중에 돈이 덜 드는 건 어느 쪽입니까?', 'Which of the three costs least?', { next: 'cost' }),
        ],
        note: ['넘을 생각 없다고, 내 이름이 계 이름이라고 했다. 그걸 아는 사람은 줄 앞에서 안 망설인다고, 몰래 넘는 사람들이 빨라 보여도 오래 못 간다고 했다.', "I said I had no intention of crossing — my name was the co-op's name. Someone who knows that doesn't hesitate at the line, I was told. Those who sneak across may look quicker, but they don't last."],
      }),
      cost: scene([
        line(COOP, '계 동행이 제일 싸다. 대신 날짜를 계에 맞춰야 하고.', "Going with the co-op is cheapest. But you have to fit the co-op's dates."),
        line(COOP, '낚시공원은 입장료, 선상은 뱃삯이 든다.', 'The fishing park costs an entry fee, a boat costs fare.'),
        line(P, '돈이냐, 시간이냐네요.', "So it's money or time."),
        line(COOP, '돈, 시간, 사람. 셋 중에 뭘 쓸지 정하면 길은 저절로 나온다.', "Money, time, people. Decide which of the three to spend and the way shows itself."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_cost' }),
        note: ['세 길 중 돈이 덜 드는 쪽을 물었다. 계 동행이 제일 싸지만 날짜를 맞춰야 하고, 낚시공원은 입장료, 선상은 뱃삯이 든다고 했다. 돈, 시간, 사람 중 뭘 쓸지 정하면 길은 저절로 나온다고.', "I asked which way cost least. Going with the co-op was cheapest but meant fitting their dates; the park cost an entry fee and a boat cost fare. Decide whether to spend money, time or people, I was told, and the way shows itself."],
      }),
      accident: scene([
        line(COOP, '누가 다쳤다. 누군지는 묻지 마라.', "Someone was hurt. Don't ask who.", { act: 'look_away' }),
        line(P, '…네.', '...All right.'),
        line(COOP, '방파제 끝은 파도 한 번이면 사람을 끌고 간다. 테트라포드 틈에 빠지면 혼자서는 못 나온다.', "At the end of the breakwater, one wave can drag a person away. Fall into the tetrapod gaps and you can't get out alone."),
        line(COOP, '통제선은 그래서 있는 거다. 셋 중에 골라.', "That's why the line is there. Pick one of the three."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_accident' }),
        note: ['무슨 사고였느냐고 물었다. 누가 다쳤다고만, 누군지는 묻지 말라고 했다. 방파제 끝은 파도 한 번이면 사람을 끌고 가고, 테트라포드 틈에 빠지면 혼자서는 못 나온다고.', "I asked what the accident had been. Someone was hurt, was all I was told — don't ask who. At the end of the breakwater one wave can drag a person away, and someone who falls into the tetrapod gaps can't get out alone."],
      }),
      others: scene([
        line(COOP, '손해 맞다. 오늘은.', "You do lose out. Today."),
        line(COOP, '넘어간 사람이 누군지, 나는 다 안다.', 'I know exactly who crossed.'),
        line(COOP, '그 사람들이 나중에 계에 부탁할 일 생기면 어떻게 될 것 같냐.', "When those people need something from the co-op one day, how do you think that'll go?"),
        line(P, '…', '...'),
        line(COOP, '손해는 그때 보는 거다. 돌아서 가.', "That's when they'll lose out. Go the long way."),
      ], {
        end: endTalk({ accept: true, offer: 'others_cross' }),
        note: ['다들 넘어가는데 나만 돌아가면 손해 아니냐고 했다. 오늘은 손해가 맞다고, 하지만 넘어간 사람이 누군지 다 안다고 했다. 그 사람들이 계에 부탁할 일이 생길 때 손해를 보는 거라고.', "I asked if I'd lose out going the long way when everyone else crossed. I would — today, I was told. But he knew exactly who had crossed, and they'd be the ones losing out when they needed something from the co-op."],
      }),
    },
  },

  // M2-07 — 끝내는 자리(어촌계장) · 세 길 중 하나
  {
    id: 'm2_07_done', questId: 'M2-07', at: 'complete', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(P, '바깥 갯바위에서 두 마리 낚았습니다. 통제선은 안 넘었습니다.', 'I caught two on the rocks outside. I never crossed the line.'),
        line(COOP, '안다. 통제선은 낚시꾼이 아니라 사람을 지키는 거다.', "I know. The line isn't there to protect anglers. It's there to protect people.", { act: 'look_up' }),
        line(COOP, '네 이름 아직 깨끗하다.', 'Your name is still clean.'),
        line(COOP, '그래서, 세 길 중에 어느 쪽으로 갈 거냐.', 'So. Which of the three ways will you take?'),
        line(P, '생각해 봤는데요…', "I've thought about it..."),
      ], {
        choices: [
          opt('coop', '어촌계 동행으로 가겠습니다', "I'll go with the co-op", {
            say: ['어촌계 동행으로 가겠습니다. 사람과 같이 가는 게 좋습니다.', "I'll go with the co-op. I'd rather go with people."],
            end: endTalk({ complete: 'coop',
              lineKo: '그래. 그게 계원 답이다. (다음 동행 일정에 내 이름을 올린다.) 동행 날엔 내 말이 법이다. 물때 보고 들어가고, 물때 보고 나온다. 혼자 더 있겠다는 소리는 하지 마라. 같이 간 사람은 같이 나온다.',
              lineEn: "Good. That's a member's answer. (My name goes onto the next outing's list.) On outing days, my word is law. We go in by the tide and come out by the tide. Don't ask to stay on alone. People who go in together come out together." }),
            note: ['어촌계 동행으로 가겠다고 했다. 그게 계원 답이라며 다음 동행 일정에 내 이름을 올렸다. 같이 간 사람은 같이 나온다고.', "I chose to go with the co-op. That was a member's answer, I was told, and my name went onto the next outing. People who go in together come out together."] }),
          opt('park', '낚시공원 입장권을 사겠습니다', "I'll buy a fishing park ticket", {
            say: ['낚시공원 입장권을 사겠습니다. 돈으로 해결되는 게 편합니다.', "I'll buy a ticket for the fishing park. Paying my way in is simpler."],
            end: endTalk({ complete: 'park',
              lineKo: '편한 길도 길이다. 입장료는 네 돈이고. (입장료를 계에서 반만 대 준다.) 낚시공원엔 난간이 있고 관리인이 있다. 돈 내고 사는 건 고기가 아니라 안전이다. 그거 알고 내면 아깝지 않다.',
              lineEn: "An easy way is still a way. The fee is yours to pay. (The co-op covers half of it.) The park has railings and staff. What you pay for isn't fish, it's safety. Pay knowing that and it isn't wasted." }),
            note: ['낚시공원 입장권을 사겠다고 했다. 편한 길도 길이라며 입장료 반을 계에서 대 주었다. 돈 내고 사는 건 고기가 아니라 안전이라고.', "I chose the fishing park ticket. An easy way is still a way, I was told, and the co-op covered half the fee. What you pay for there isn't fish, it's safety."] }),
          opt('boat', '선상으로 가겠습니다. 배를 타 보고 싶었습니다', "I'll go by boat. I've wanted to go out on one", {
            end: endTalk({ complete: 'boat',
              lineKo: '…배는 아직 이르다. 그래도 그 마음, 적어 두지. 배를 타려면 먼저 배를 알아야 한다. 멀미도, 물때도, 선장 말 듣는 법도. 서두르지 마라. 바다는 기다려 준다.',
              lineEn: "...It's too early for boats. Still, I'll make a note of that wish. To go out on a boat you first have to know boats. Seasickness, tides, how to listen to a skipper. Don't rush. The sea will wait." }),
            note: ['선상으로 가겠다고, 배를 타 보고 싶었다고 했다. 배는 아직 이르다면서도 그 마음은 적어 두겠다고 했다. 바다는 기다려 준다고.', "I said I'd go by boat — I'd wanted to go out on one. It was still too early for boats, I was told, but the wish would be noted. The sea will wait."] }),
          opt('tempted', '솔직히 넘고 싶었습니다', 'Honestly, I wanted to cross', {
            say: ['솔직히 넘고 싶었습니다. 안쪽 바다가 더 좋아 보여서요.', 'Honestly, I wanted to cross. The water inside looked better.'],
            next: 'tempted' }),
        ],
        note: ['통제선 바깥 갯바위에서 두 마리를 낚았다. 계장은 통제선은 낚시꾼이 아니라 사람을 지키는 거라고, 내 이름이 아직 깨끗하다고 했다. 세 길 중 어느 쪽으로 갈지 물었다.',
          "I caught two on the rocks outside the control line. The chief said the line was there to protect people, not anglers, and that my name was still clean. Then he asked which of the three ways I'd take."],
      }),
      tempted: scene([
        line(COOP, '솔직해서 좋다.', 'I like that you said so.'),
        line(COOP, '다들 그렇게 보인다. 안 그렇게 보이는 사람이 이상한 거지.', "It looks that way to everyone. Anyone it doesn't look that way to is the odd one."),
        line(P, '…그래도 안 넘었습니다.', "...But I didn't cross."),
      ], {
        end: endTalk({ complete: 'tempted',
          lineKo: '보이는 거랑 넘는 거 사이에 네가 서 있었다. 그거면 됐다. (명부의 내 이름 옆에 작은 표시를 한다.)',
          lineEn: "Between seeing it and crossing it, you stood your ground. That's enough. (A small mark goes beside my name in the register.)" }),
        note: ['솔직히 넘고 싶었다고 털어놓았다. 솔직해서 좋다고, 다들 그렇게 보인다고 했다. 보이는 것과 넘는 것 사이에 내가 서 있었으니 그거면 됐다며, 명부의 내 이름 옆에 작은 표시를 했다.', "I admitted I'd wanted to cross. He liked that I'd said so — it looks that way to everyone. Between seeing and crossing, I'd stood my ground, and that was enough. A small mark went beside my name in the register."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M2-08 「백운포의 볼락」 — 받는 자리(짐 강) · 집어등 아래
  // ═══════════════════════════════════════════
  {
    id: 'm2_08_offer', questId: 'M2-08', at: 'offer', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '낚시하러 왔어?', 'Here to fish?', { act: 'look_up' }),
        line(P, '네. 밤에 백운포에 볼락이 붙는다고 해서요.', 'Yes. I heard rockfish gather at Baegunpo at night.'),
        line(JK, '붙어. 빛만 있으면.', 'They do. As long as there is light.'),
        line(JK, '집어등 켤게.', "I'll switch on the fish lamp."),
        line('', '(집어등이 켜지고, 물빛이 하얗게 번진다.)', '(The fish lamp comes on, and a white glow spreads across the water.)'),
        line(P, '같이 하시는 거예요?', 'Are you fishing too?'),
        line(JK, '나는 안 던져. 보기만 해.', "I won't cast. I'll just watch."),
        line(P, '보기만요?', 'Just watch?'),
        line(JK, '찾는 게 따로 있어서. 어떤 사람이 남긴 루어.', "I'm looking for something else. Lures someone left behind."),
        line(JK, '볼락은 빛 가장자리에 붙어. 세 마리 올려 봐.', 'Rockfish hold to the edge of the light. Bring up three.'),
      ], {
        choices: [
          opt('edge', '빛 가장자리군요. 세 마리, 올려 볼게요', "The edge of the light. I'll try for three", { next: 'edge' }),
          opt('legacy', '누가 남긴 루어인데요?', 'Who left the lures behind?', {
            say: ['루어를 찾으신다고요? 누가 남긴 건데요?', "You're looking for lures? Who left them?"],
            next: 'legacy' }),
          opt('nerves', '구경만 하시면, 볼락보다 제가 더 긴장되는데요', "If you just watch, I'll be more nervous than the rockfish", { next: 'nerves' }),
        ],
        note: ['백운포에서 짐 강 씨가 집어등을 켜 주었다. 자기는 던지지 않고 보기만 한다고, 찾는 건 따로 있다고 했다. 어떤 사람이 남긴 루어라고. 볼락은 빛 가장자리에 붙으니 세 마리를 올려 보라고 했다.',
          "At Baegunpo, Jim Kang switched on a fish lamp for me. He wouldn't cast, he said — just watch. He was looking for something else: lures someone had left behind. Rockfish hold to the edge of the light, he told me; bring up three."],
      }),
      edge: scene([
        line(JK, '그래. 볼락은 겁이 많아.', 'Right. Rockfish are timid.'),
        line(JK, '밝은 데는 무서워하고, 어두운 데는 먹이가 없지. 그 사이에 숨어서 기다려.', "They're scared of the bright part, and there's no food in the dark. So they hide in between and wait."),
        line(P, '그럼 채비는요?', 'So where do I put my rig?'),
        line(JK, '빛 경계에 흘려. 천천히. 볼락은 위를 보고 있어.', "Drift it along the border of the light. Slowly. Rockfish are looking up."),
      ], {
        end: endTalk({ accept: true, offer: 'light_edge' }),
        note: ['빛 가장자리에서 세 마리를 올려 보겠다고 했다. 볼락은 겁이 많아 밝은 데는 무서워하고 어두운 데는 먹이가 없으니 그 사이에 숨는다고, 채비를 빛 경계에 천천히 흘리라고 했다.', "I said I'd try for three at the edge of the light. Rockfish are timid, Jim said — scared of the bright part, with no food in the dark — so they hide in between. Drift the rig slowly along the border of the light."],
      }),
      legacy: scene([
        line(JK, '…일찍 간 사람. 루어를 깎던 사람이야.', '...Someone who left too early. A man who carved lures.', { act: 'look_sea' }),
        act(JK, 'silence'),
        line(JK, '그 이상은 아직이야.', "That's all, for now."),
        line(P, '…', '...'),
        line(JK, '(빛 쪽으로 턱을 든다.) 볼락 올리면 얘기할지도 모르지. 안 할지도 모르고.', "(He lifts his chin towards the light.) Bring up some rockfish and maybe I'll tell you. Maybe not."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_legacy' }),
        note: ['누가 남긴 루어냐고 물었다. 일찍 간 사람, 루어를 깎던 사람이라고만 했다. 그 이상은 아직이라고, 볼락을 올리면 얘기할지도 모른다고.', "I asked who had left the lures. Someone who left too early — a man who carved lures, was all Jim said. That was all for now; if I brought up some rockfish, maybe he'd tell me more."],
      }),
      nerves: scene([
        line(JK, '긴장해도 돼. 나는 볼락 말고 네 손을 보는 거니까.', "Be nervous, then. I'm not watching the rockfish, I'm watching your hands."),
        line(P, '제 손이요? 왜요?', 'My hands? Why?'),
        line(JK, '왜냐고는 묻지 마.', "Don't ask why."),
        act(JK, 'laugh'),
        line(JK, '손이 굳으면 볼락이 먼저 알아. 어깨 내리고, 나는 없는 사람이라고 생각해.', "If your hands stiffen, the rockfish know first. Drop your shoulders and pretend I'm not here."),
      ], {
        end: endTalk({ accept: true, offer: 'watched_nerves' }),
        note: ['구경만 하면 내가 더 긴장된다고 했다. 짐 강 씨는 볼락이 아니라 내 손을 보는 거라고, 왜냐고는 묻지 말라며 소리 없이 웃었다. 어깨를 내리고 자기는 없는 사람이라고 생각하라고.', "I said I'd be more nervous than the rockfish if he only watched. He wasn't watching the rockfish but my hands, Jim said, and laughed without a sound — don't ask why. Drop my shoulders and pretend he wasn't there."],
      }),
    },
  },

  // M2-08 — 끝내는 자리(짐 강)
  {
    id: 'm2_08_done', questId: 'M2-08', at: 'complete', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(P, '세 마리예요.', 'That makes three.'),
        line(JK, '셋.', 'Three.', { act: 'nod' }),
        line(JK, '릴대 좋네.', "That's a good rod."),
        line(P, '이거요?', 'This one?'),
        line(JK, '누가 만든 건지 아나.', 'Do you know who made it?', { act: 'peer' }),
        line(P, '…', '...'),
        line(JK, '…모르겠지. 나중에 얘기하자.', "...You wouldn't. We'll talk about it later."),
      ], {
        choices: [
          opt('ask_rod', '이 릴대가 왜 궁금하세요?', 'Why are you curious about this rod?', {
            end: endTalk({ complete: 'ask_rod',
              lineKo: '…비슷한 손을 본 적이 있어서. 그건 다음에. (집어등을 끄며 덧붙인다.) 묻는 건 잘했어. 나도 묻고 다니는 사람이니까. 대답이 늦는 건 내 사정이야. 네 탓 아니고.',
              lineEn: "...I've seen hands like that before. Another time. (He adds, switching off the lamp.) You did right to ask. I'm someone who goes around asking too. If my answer's slow, that's my business. Not your fault." }),
            note: ['이 릴대가 왜 궁금하냐고 물었다. 비슷한 손을 본 적이 있어서라고, 그건 다음에 하자고 했다. 대답이 늦는 건 자기 사정이라고.', "I asked why he was curious about the rod. He'd seen hands like that before, Jim said — another time. If his answer was slow, that was his business."] }),
          opt('just', '볼락 세 마리. 오늘은 그걸로 충분해요', "Three rockfish. That's enough for today", { next: 'just' }),
          opt('father', '아버지가 쓰시던 대예요', 'It was my father\'s rod', {
            say: ['아버지가 쓰시던 대예요. 누가 만들었는지는 저도 몰라요.', "It was my father's. I don't know who made it either."],
            next: 'father' }),
        ],
        note: ['집어등 아래에서 볼락 세 마리를 올렸다. 짐 강 씨는 셋이라며 고개를 끄덕이고, 내 릴대가 좋다고 했다. 누가 만든 건지 아느냐고 묻더니, 모르겠지, 나중에 얘기하자고 했다.',
          "I brought up three rockfish under the lamp. Jim nodded — three — and said my rod was a good one. He asked if I knew who'd made it, then answered himself: I wouldn't. We'd talk about it later."],
      }),
      just: scene([
        line(JK, '그렇게 말하는 낚시꾼이 오래 한다.', 'Anglers who say that last a long time.'),
        act(JK, 'give', { to: P }),
        line(JK, '집어등 배터리값이야.', 'For the lamp battery.'),
        line(P, '…감사합니다.', '...Thank you.', { act: 'receive' }),
      ], {
        end: endTalk({ complete: 'just_fish',
          lineKo: '욕심내는 사람은 넷째 마리 올리다 대를 부러뜨려. 셋에서 멈출 줄 아는 손이 다음 날도 던져. 그거면 됐어.',
          lineEn: "Greedy people break their rods going for the fourth. Hands that know to stop at three are the ones casting again the next day. That'll do." }),
        note: ['볼락 세 마리면 오늘은 충분하다고 했다. 그렇게 말하는 낚시꾼이 오래 한다며, 집어등 배터리값이라고 돈을 조금 쥐여 주었다.', "I said three rockfish was enough for today. Anglers who say that last a long time, Jim said, and pressed a little money on me for the lamp battery."],
      }),
      father: scene([
        line(JK, '…아버지 거였구나.', '...So it was your father\'s.'),
        act(JK, 'silence'),
        line(JK, '…', '...', { act: 'peer' }),
      ], {
        end: endTalk({ complete: 'father_rod',
          lineKo: '그럼 그 대가 기억하는 손은 아버지 손이겠네. 잘 써. 대는 쓰는 사람 손을 따라가. 오늘은 볼락 셋이면 됐어.',
          lineEn: "Then the hands that rod remembers are your father's. Use it well. A rod follows the hands that use it. Three rockfish is enough for today." }),
        note: ['아버지가 쓰던 대라 누가 만들었는지 나도 모른다고 했다. 짐 강 씨는 한참 대를 보더니, 그 대가 기억하는 손은 아버지 손이겠다고 했다.', "I said it had been my father's and I didn't know who'd made it either. Jim looked at the rod for a long while, then said the hands it remembered must be my father's."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // M2-09 「총회」 — 받는 자리(어촌계장) · 메인 — 미루는 끝이 없다
  // ═══════════════════════════════════════════
  {
    id: 'm2_09_offer', questId: 'M2-09', at: 'offer', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(COOP, '(서류철을 탁자에 내려놓는다.) 분기 총회다.', '(He sets a file down on the table.) The quarterly meeting.'),
        line(P, '총회요? 이번엔 뭘 정합니까?', 'A general meeting? What does this one decide?'),
        line(COOP, '지위 심사. 네가 부산에서 한 일이 표가 된다.', 'A review of your standing. What you did in Busan turns into votes.'),
        line(COOP, '네 이름이 항구에서 어떻게 도는지도 같이 본다.', 'How your name goes round the harbour gets weighed too.'),
        line(P, '뭘 준비하면 됩니까?', 'What should I prepare?'),
        line(COOP, '위판 다섯 건은 채워 와. 그 밑으로는 아무리 성실해도 손이 안 올라간다.', "Bring in five consigned lots. Below that, however hard you've worked, no hands go up."),
        line(P, '다섯 건이요.', 'Five lots.'),
        line(COOP, '그리고 나는 그날 아무 말 안 한다.', 'And on the day, I say nothing.'),
        line(P, '(…아무 말도?)', '(...Nothing at all?)'),
      ], {
        choices: [
          opt('five_lots', '다섯 건 채워서 서겠습니다.', "I'll fill the five and stand.",
            { stance: 'giver', aff: { [COOP]: 0.03 }, end: endTalk({ accept: true, offer: 'no_hiding',
              lineKo: '그래. 그날은 서 있어라. 서서 듣는 것도 심사다.',
              lineEn: 'Good. On the day, stay on your feet. Standing and listening is part of the review.' }),
              note: ['다섯 건 채워서 서겠다고 했다. 그날은 서 있으라고, 서서 듣는 것도 심사라고 했다.', "I said I'd fill the five lots and stand. Stay on your feet that day, I was told — standing and listening is part of the review."] }),
          opt('ask_rival', '도현수 씨도 그날 손을 듭니까?', 'Will Hyeonsu raise his hand that day too?',
            { stance: 'mid', next: 'rival' }),
          opt('unsold', '부산에서 한 일이면, 유찰된 상자 얘기도 나오겠군요.', "If it's what I did in Busan, the unsold crate will come up too.",
            { stance: 'self', next: 'record' }),
        ],
        note: ['분기 총회에서 계원 지위 심사가 있다고 했다. 부산에서 한 일이 표가 되니 위판 다섯 건을 채워 오라고, 자기는 그날 아무 말도 하지 않는다고 했다.',
          "There would be a review of my standing at the quarterly meeting. What I'd done in Busan would turn into votes, so I was to bring in five lots — and on the day, the chief would say nothing."],
      }),
      rival: scene([
        line(COOP, '계원이면 다 든다. 그 애도. (안경을 고쳐 쓴다.)', 'Every member does. Him too. (He pushes his glasses up.)'),
        line(P, '어느 쪽으로 들지는…', 'Which way he votes...'),
        line(COOP, '누가 어디에 손 드는지는 미리 묻는 게 아니다. 그날 보면 안다.', "You don't ask ahead where people's hands will go. You'll see on the day."),
        line(COOP, '어디에 들든 그건 그 애 표다.', "Wherever his goes, it's his vote."),
      ], {
        choices: [
          opt('his_vote', '도현수 씨 표는 도현수 씨 거지요. 저는 제 실적만 챙기겠습니다.', "Hyeonsu's vote is his. I'll look after my own record.",
            { stance: 'other', aff: { [COOP]: 0.03, [HS]: 0.02 }, end: endTalk({ accept: true, offer: 'rival_vote',
              lineKo: '(처음으로 고개를 끄덕인다.) 그 말이면 됐다. 다섯 건 채워서 서라.',
              lineEn: '(For the first time, he nods.) That\'ll do. Fill your five and stand.' }),
              note: ['도현수 씨 표는 그 사람 것이니 나는 내 실적만 챙기겠다고 했다. 계장이 처음으로 고개를 끄덕였다.', "I said Hyeonsu's vote was his, and I'd look after my own record. For the first time, the chief nodded."] }),
          opt('put_word', '집안 어른이시니, 한마디 넣어 주실 수는 없겠습니까?', "You're family to him. Couldn't you put in a word?",
            { stance: 'self', aff: { [COOP]: -0.06, [HS]: -0.03 }, flags: ['choice.m2_09_asked_favor'], next: 'no_favor' }),
          opt('silence', '아무 말 안 하신다는 건… 편을 안 드신다는 겁니까?', "When you say you'll say nothing... you mean you won't take sides?",
            { stance: 'mid', next: 'silence' }),
        ],
        note: ['도현수 씨도 그날 손을 드느냐고 물었다. 계원이면 다 든다고, 누가 어디에 드는지는 미리 묻는 게 아니라고 했다. 어디에 들든 그건 그 애 표라고.', "I asked if Hyeonsu would raise his hand that day too. Every member does, I was told — you don't ask ahead where hands will go. Wherever his went, it was his vote."],
      }),
      silence: scene([
        line(COOP, '그래. 그 자리에선 계장이 누구 편도 아니다. 손자 편도.', "That's right. In that room the chief is on nobody's side. Not even his grandson's."),
        line(COOP, '네 편은 네가 한 일이 든다. 상자, 얼음, 위판 기록. 그게 나 대신 말할 거다.', "What you did takes your side. Crates, ice, auction records. Those will speak in my place."),
        line(P, '그럼 제 일이 저 대신 서는 거네요.', 'So my work stands up for me.'),
        line(COOP, '그래. 다섯 건 채워서 서라.', 'Right. Fill your five and stand.'),
      ], {
        end: endTalk({ accept: true, offer: 'ask_silence' }),
        note: ['아무 말도 않는다는 게 편을 안 든다는 뜻이냐고 물었다. 그 자리에선 손자 편도 아니라고, 내 편은 내가 한 일이 든다고 했다. 상자, 얼음, 위판 기록이 대신 말할 거라고.', "I asked if saying nothing meant not taking sides. In that room he took nobody's side, I was told — not even his grandson's. What I'd done would take my side: crates, ice, auction records."],
      }),
      no_favor: scene([
        line(COOP, '(서류철을 덮는다.) 손자다. 그래서 더 안 봐준다.', "(He closes the file.) He's my grandson. Which is exactly why he gets no favours."),
        line(COOP, '계장이 한 사람 편 들면 그날로 계가 아니다.', 'The day the chief takes one person\'s side, it stops being a co-op.'),
        line(P, '…', '...'),
        line(COOP, '그리고 그 말, 그 애 귀에도 들어간다. 계는 좁아. 네가 그런 부탁을 했다는 것까지 다 돈다.', "And what you just said will reach his ears too. The co-op is a small world. Even the fact that you asked will go round."),
      ], {
        choices: [
          opt('withdraw', '제가 잘못 여쭸습니다. 실적으로만 서겠습니다.', "I shouldn't have asked. I'll stand on my record alone.",
            { stance: 'giver', aff: { [COOP]: 0.03 }, end: endTalk({ accept: true, offer: 'rival_vote',
              lineKo: '그래. 그게 계원 답이다. 다섯 건, 잊지 마라.',
              lineEn: "Right. That's a member's answer. Five lots. Don't forget." }),
              note: ['잘못 여쭸다고, 실적으로만 서겠다고 물렀다. 그게 계원 답이라고 했다.', "I took it back — I shouldn't have asked; I'd stand on my record alone. That was a member's answer, I was told."] }),
          opt('only_asked', '여쭤본 것뿐입니다.', 'I was only asking.',
            { stance: 'self', aff: { [COOP]: -0.02 }, end: endTalk({ accept: true, offer: 'rival_vote',
              lineKo: '묻는 것도 표다. (서류철을 내 쪽으로 민다.) 가서 다섯 건이나 채워 와.',
              lineEn: 'Asking is a vote too. (He pushes the file towards me.) Go and fill your five.' }),
              note: ['여쭤본 것뿐이라고 했다. 묻는 것도 표라는 말이 돌아왔다.', "I said I'd only been asking. Asking is a vote too, came the reply."] }),
        ],
        note: ['집안 어른이니 손자에게 한마디 넣어 줄 수 없느냐고 했다가 서류철이 덮였다. 손자라서 더 안 봐준다고, 그 부탁을 했다는 것까지 그 애 귀에 들어갈 거라고 했다.', "I asked whether, being family, he couldn't put in a word with his grandson — and the file snapped shut. Being his grandson was exactly why there'd be no favours, and even the fact that I'd asked would reach his ears."],
      }),
      record: scene([
        line(COOP, '나온다. 얼음 아껴서 유찰된 것까지 다. (서류철을 한 장 넘긴다.)', 'It will. Right down to the lot that went unsold because you skimped on ice. (He turns a page in the file.)'),
        line(COOP, '심사는 잘한 것만 보는 자리가 아니다.', "A review isn't only for looking at what went well."),
        line(P, '…그럼 숨길 수는 없겠네요.', "...So there's no hiding it."),
        line(COOP, '감추면 감춘 게 나오고, 꺼내면 꺼낸 게 나온다. 어느 쪽이 표가 되는지는 너도 알 거다.', "Hide it and the hiding comes out. Bring it up and the bringing up comes out. You know which one turns into votes."),
      ], {
        choices: [
          opt('own_it', '제가 먼저 꺼내겠습니다. 얼음을 아낀 건 제 잘못입니다.', "I'll bring it up myself. Skimping on ice was my mistake.",
            { stance: 'giver', aff: { [COOP]: 0.05 }, flags: ['choice.m2_09_owned_unsold'], end: endTalk({ accept: true, offer: 'no_hiding',
              lineKo: '(서류철에 무언가를 적는다.) 그 말 그대로 총회장에서 해라. 손이 올라갈 거다.',
              lineEn: '(He writes something in the file.) Say exactly that at the meeting. Hands will go up.' }),
              note: ['유찰된 상자 얘기는 내가 먼저 꺼내겠다고 했다. 계장은 서류철에 무언가를 적으며 그 말 그대로 총회장에서 하라고 했다.', "I said I'd bring up the unsold crate myself. The chief wrote something in the file and told me to say exactly that at the meeting."] }),
          opt('leave_out', '그 얘기는 빼 주시면 안 됩니까?', "Couldn't that part be left out?",
            { stance: 'self', aff: { [COOP]: -0.05 }, end: endTalk({ accept: true, offer: 'can_fail',
              lineKo: '(안경 너머로 나를 본다.) 나는 아무 말 안 한다고 했다. 꺼낼지 말지는 계원들이 정한다. 다섯 건이나 채워 와.',
              lineEn: '(He looks at me over his glasses.) I told you I say nothing. Whether it comes up is for the members. Just fill your five.' }),
              note: ['그 얘기는 빼 줄 수 없느냐고 했다. 안경 너머로 나를 보며, 꺼낼지 말지는 계원들이 정한다고 했다. 떨어질 수도 있다는 생각이 처음 들었다.', "I asked if that part could be left out. He looked at me over his glasses: whether it came up was for the members to decide. For the first time, I thought I might fail."] }),
        ],
        note: ['유찰된 상자 얘기도 나오겠느냐고 물었다. 심사는 잘한 것만 보는 자리가 아니라고, 감추면 감춘 게 나오고 꺼내면 꺼낸 게 나온다고 했다.', "I asked whether the unsold crate would come up. A review isn't only for what went well, I was told — hide it and the hiding comes out; bring it up and that comes out."],
      }),
    },
  },

  // M2-09 — 끝내는 자리(어촌계장). 총회가 끝난 회의실 — 도현수가 문간에서 걸음을 멈춘다
  {
    id: 'm2_09_done', questId: 'M2-09', at: 'complete', npcId: COOP, start: 'start',
    nodes: {
      start: scene([
        line(COOP, '(회의실 의자가 하나둘 비어 간다. 명부를 덮는다.) 통과다.', '(The chairs in the meeting room empty one by one. He closes the roll.) Passed.'),
        line(P, '…통과요.', '...Passed.'),
        line(COOP, '도현수가 반대했지. 하나.', 'Do Hyeonsu voted against. One.'),
        line(P, '(…뒷줄에서 손 하나가 올라가던 게 보였다.)', '(...I had seen one hand go up in the back row.)'),
        line(COOP, '이유는 그 애한테 들어.', 'Ask him for the reason.'),
        line(COOP, '나는 거기 계장으로 앉아 있었다. 할아버지로 앉아 있던 게 아니다.', 'I sat there as the chief. Not as his grandfather.'),
      ], {
        choices: [
          opt('ask_him', '도현수 씨한테 직접 묻겠습니다.', "I'll ask Hyeonsu myself.",
            { stance: 'giver', next: 'door' }),
          opt('as_grandpa', '집안 어른으로서는, 그 표가 어떠셨습니까?', 'And as family? How did that vote sit with you?',
            { stance: 'mid', next: 'grandpa' }),
          opt('shamed', '손자분이 모두 앞에서 저를 망신 준 셈 아닙니까.', "Isn't that your grandson shaming me in front of everyone?",
            { stance: 'self', aff: { [COOP]: -0.05, [HS]: -0.04, [OK]: -0.02 }, next: 'shame' }),
          opt('one_is_fine', '하나쯤은 괜찮습니다. 통과했으니까요.', "One's fine. I passed.",
            { stance: 'self', end: endTalk({ complete: 'ignore',
              lineKo: '그것도 방법이다. 다만 그 하나가 누군지는 잊지 마라. (봉투를 내민다.)\n\n계에서 격려금이다. 쓸 데 알지.',
              lineEn: "That's one way. Just don't forget whose one it was. (He holds out an envelope.)\n\nAn allowance from the co-op. You know what it's for." }),
              note: ['반대표 하나쯤은 괜찮다고, 통과했으니까 됐다고 했다. 그것도 방법이지만 그 하나가 누군지는 잊지 말라며 격려금 봉투를 내밀었다.', "I said one vote against was fine — I'd passed. That was one way, I was told, but not to forget whose vote it was. He held out an envelope: an allowance from the co-op."] }),
        ],
        note: ['분기 총회를 통과했다. 반대표는 하나, 도현수 씨였다. 계장은 이유는 그 애한테 들으라고, 자기는 거기 계장으로 앉아 있었지 할아버지로 앉아 있던 게 아니라고 했다.',
          "I passed the quarterly review. One vote against — Hyeonsu's. The chief told me to ask him for the reason; he'd sat there as the chief, he said, not as a grandfather."],
      }),
      door: scene([
        line(HS, '(문간을 나서다 걸음을 멈춘다. 돌아보지는 않는다.) …네가 싫어서가 아니야.', "(On his way out through the door, he stops. He doesn't turn round.) ...It isn't because I dislike you."),
        line(P, '(…도현수 씨는 그 말만 하고 서 있다. 더 붙일 말은 없어 보인다.)', "(...Having said it, Hyeonsu just stands there. He doesn't seem to have anything to add.)"),
      ], {
        choices: [
          opt('then_why', '그럼 왜 반대했어요?', 'Then why vote against?',
            { stance: 'giver', aff: { [HS]: -0.02 }, next: 'vote_is_vote' }),
          opt('thanks_no', '반대표, 고마워요. 덕분에 제 숫자를 다시 봤어요.', 'Thanks for the no. It made me look at my numbers again.',
            { stance: 'other', aff: { [HS]: 0.07, [COOP]: 0.02 }, next: 'thanked' }),
          opt('favor_q', '혹시 제가 한마디 넣어 달라고 했던 것 때문이에요?', 'Is it because I asked for someone to put in a word with you?',
            { stance: 'mid', aff: { [HS]: -0.03 }, requires: { flag: 'choice.m2_09_asked_favor' }, next: 'favor' }),
          opt('nod_back', '(그 등에 대고 고개만 끄덕인다.)', '(I just nod at his back.)',
            { stance: 'self', aff: { [HS]: 0.02 }, end: endTalk({ complete: 'ask_hyeonsu',
              lineKo: '(도현수가 나가고 문이 닫힌다. 그제야 봉투를 건넨다. 생각보다 두툼하다.) …그 애한테는 그걸로 됐다. 따지고 들면 입부터 닫는 애다.\n\n격려금이다. 얼음을 사든 상자를 사든 네 마음대로 써라.',
              lineEn: "(Hyeonsu leaves and the door closes. Only then does he hand me an envelope. It's thicker than I expected.) ...With him, that's enough. Push him and the first thing he does is shut his mouth.\n\nYour allowance. Spend it on ice or crates, however you like." }),
              note: ['도현수 씨 등에 대고 고개만 끄덕였다. 그 애한테는 그걸로 됐다며, 계장이 생각보다 두툼한 격려금 봉투를 건넸다.', "I only nodded at Hyeonsu's back. That was enough with him, the chief said, and handed me an envelope thicker than I'd expected."] }),
        ],
        note: ['도현수 씨가 문간에서 걸음을 멈추고, 돌아보지도 않은 채 네가 싫어서가 아니라고 했다. 더 붙일 말은 없어 보였다.', "Hyeonsu stopped in the doorway and, without turning round, said it wasn't because he disliked me. He didn't seem to have anything to add."],
      }),
      vote_is_vote: scene([
        line(HS, '표는 표야. (주머니에 손을 넣는다.)', "A vote's a vote. (He puts his hands in his pockets.)"),
        line(HS, '이유를 달면 그때부터 표가 아니라 말싸움이 돼.', "Hang reasons on it and from then on it isn't a vote, it's an argument."),
        line(P, '…', '...'),
        line(HS, '통과했으면 됐잖아. …다음 총회 때 보자.', "You passed, didn't you. ...See you at the next meeting."),
      ], {
        choices: [
          opt('see_you_next', '알았어요. 다음 총회 때 봬요.', 'Fine. See you at the next one.',
            { stance: 'other', aff: { [HS]: 0.03 }, end: endTalk({ complete: 'ask_hyeonsu',
              lineKo: '(문이 닫힌다. 그제야 봉투를 건넨다. 액수가 생각보다 크다.) 물을 땐 따지지 말고 물어라. 그 애는 따지고 들면 입부터 닫는다.\n\n격려금이다. 쓸 데 알지.',
              lineEn: "(The door closes. Only then does he hand me an envelope. There's more in it than I expected.) When you ask, ask. Don't accuse. Push him and the first thing he does is shut his mouth.\n\nYour allowance. You know what it's for." }),
              note: ['다음 총회 때 보자는 말에 그러자고 했다. 문이 닫히자 계장이 격려금을 건네며, 물을 땐 따지지 말고 물으라고 했다.', "I agreed to see him at the next meeting. Once the door closed, the chief handed me the allowance and said that when I asked, I should ask, not accuse."] }),
          opt('argue_then', '말싸움이라도 좋으니까 말해 봐요.', "I don't care if it's an argument. Tell me.",
            { stance: 'self', aff: { [HS]: -0.05 }, end: endTalk({ complete: 'ignore',
              lineKo: '(도현수가 대답 없이 나간다. 문이 세게 닫힌다. 한숨을 쉰다.) …봤지. 따지면 입부터 닫는 애다.\n\n(봉투를 내민다.) 격려금이다. 반대표는 적이 아니라 숙제다. 그 하나가 누군지는 잊지 마라.',
              lineEn: "(Hyeonsu leaves without answering. The door slams. He sighs.) ...You saw. Push him and the first thing he does is shut his mouth.\n\n(He holds out an envelope.) Your allowance. A vote against isn't an enemy, it's homework. Don't forget whose it was." }),
              note: ['말싸움이라도 좋으니 말해 보라고 다그쳤다. 도현수 씨는 대답 없이 나갔고 문이 세게 닫혔다. 반대표는 적이 아니라 숙제라는 말과 함께 격려금을 받았다.', "I pushed him to tell me, argument or not. Hyeonsu left without a word and the door slammed. I was handed the allowance with the words: a vote against isn't an enemy, it's homework."] }),
        ],
        note: ['왜 반대했느냐고 물었다. 도현수 씨는 표는 표라고, 이유를 달면 말싸움이 된다고 했다. 다음 총회 때 보자고.', "I asked why he'd voted against. A vote's a vote, Hyeonsu said — hang reasons on it and it becomes an argument. See you at the next meeting."],
      }),
      thanked: scene([
        line(HS, '(처음으로 돌아본다.) …고맙다고? 반대표가?', '(For the first time, he turns round.) ...Thanks? For a vote against?'),
        line(P, '네. 진심이에요.', 'Yes. I mean it.'),
        line(HS, '(한참 나를 본다.) 별나네, 너.', "(He looks at me a long while.) You're an odd one."),
        line(HS, '(그래도 입꼬리가 조금 올라간다.) 숫자 다시 봤으면 됐네. 다음엔 반대 안 할 수도 있고. …할 수도 있고.', "(Still, the corner of his mouth lifts a little.) If you looked at your numbers again, good. Next time I might not vote against. ...Or I might."),
      ], {
        choices: [
          opt('see_you', '네. 다음 총회 때 봬요.', 'Right. See you at the next meeting.',
            { stance: 'other', aff: { [HS]: 0.02 }, end: endTalk({ complete: 'ask_hyeonsu',
              lineKo: '(도현수가 나가고 문이 닫힌다. 한참 문 쪽을 본다.) …그 애가 돌아보는 건 나도 오랜만에 본다.\n\n(봉투를 건넨다. 생각보다 두툼하다.) 격려금이다. 쓸 데 알지.',
              lineEn: "(Hyeonsu leaves and the door closes. He looks at the door for a long while.) ...It's been a long time since I saw him turn round, myself.\n\n(He hands me an envelope. It's thicker than I expected.) Your allowance. You know what it's for." }),
              note: ['다음 총회 때 보자고 했다. 도현수 씨가 나간 뒤, 계장은 그 애가 돌아보는 건 자기도 오랜만에 본다고 했다.', "I said I'd see him at the next meeting. After Hyeonsu left, the chief said it had been a long time since even he had seen him turn round."] }),
        ],
        note: ['반대표가 고맙다고, 덕분에 내 숫자를 다시 봤다고 했다. 도현수 씨가 처음으로 돌아보더니 별나다고 했다. 입꼬리가 조금 올라가 있었다.', "I thanked him for the vote against — it had made me look at my numbers again. Hyeonsu turned round for the first time and called me an odd one. The corner of his mouth had lifted a little."],
      }),
      favor: scene([
        line(HS, '…그런 말 들으면 손 더 들고 싶어지긴 하지.', '...Hearing that does make you want to raise your hand all the more.'),
        line(HS, '(돌아본다.) 근데 그것 때문은 아니야. 그건 진짜야.', "(He turns round.) But that's not why. That much is true."),
        line(HS, '할아버지는 원래 아무 말 안 해. 너도 알잖아.', 'Grandfather never says anything anyway. You know that.'),
      ], {
        choices: [
          opt('my_mistake', '그 부탁은 제가 잘못했어요.', 'Asking him was wrong of me.',
            { stance: 'other', aff: { [HS]: 0.04 }, end: endTalk({ complete: 'ask_hyeonsu',
              lineKo: '(도현수가 고개를 한 번 까딱하고 나간다.) …사과할 줄 아는 놈이면 표는 다음에 따라온다.\n\n(봉투를 건넨다.) 격려금이다. 쓸 데 알지.',
              lineEn: '(Hyeonsu gives a single nod and leaves.) ...If you know how to apologise, the votes come round next time.\n\n(He hands me an envelope.) Your allowance. You know what it\'s for.' }),
              note: ['그 부탁은 내가 잘못했다고 사과했다. 도현수 씨는 고개를 한 번 까딱하고 나갔다. 사과할 줄 알면 표는 다음에 따라온다는 말을 들었다.', "I apologised for having asked. Hyeonsu gave a single nod and left. If you know how to apologise, I was told, the votes come round next time."] }),
        ],
        note: ['내가 한마디 넣어 달라고 했던 것 때문이냐고 물었다. 그런 말 들으면 손을 더 들고 싶어지긴 한다면서도, 그것 때문은 아니라고 했다. 그건 진짜라고.', "I asked if it was because I'd asked for someone to put in a word. Hearing that did make him want to raise his hand all the more, Hyeonsu said — but that wasn't why. That much was true."],
      }),
      grandpa: scene([
        line(COOP, '어떻긴. 총회에선 손자도 계원 하나다. (명부 위에 손을 얹는다.)', 'How should it sit? At a general meeting my grandson is just one member. (He rests a hand on the roll.)'),
        act(COOP, 'silence'),
        line(COOP, '…그 애 표는 그 애 거다. 이유도 그 애 거고.', '...His vote is his. So is his reason.'),
        line(COOP, '다만 그 애는 아무 이유 없이 손 드는 애가 아니다. 그건 알아 둬라.', "But he isn't one to raise his hand for no reason. Know that much."),
      ], {
        choices: [
          opt('hear_someday', '알겠습니다. 이유는 언젠가 본인한테 듣겠습니다.', "Understood. Someday I'll hear the reason from him.",
            { stance: 'giver', aff: { [COOP]: 0.03 }, end: endTalk({ complete: 'ask_grandfather',
              lineKo: '그래. 언젠가. (봉투를 내민다.) 계에서 격려금이다.\n\n그 애 얘기는 그 애한테 들어라. 할아버지가 하는 손자 얘기는 다 팔이 안으로 굽은 얘기다.',
              lineEn: 'Right. Someday. (He holds out an envelope.) An allowance from the co-op.\n\nHear about him from him. Anything a grandfather says about his grandson bends his way.' }),
              note: ['이유는 언젠가 본인한테 듣겠다고 했다. 할아버지가 하는 손자 얘기는 다 팔이 안으로 굽은 얘기라며 격려금을 내밀었다.', "I said I'd hear the reason from him someday. Anything a grandfather says about his grandson bends his way, I was told, as the allowance was held out to me."] }),
          opt('owned_q', '유찰 얘기는 제가 먼저 꺼냈습니다. 그게 표가 됐습니까?', 'I brought up the unsold lot myself. Did that turn into votes?',
            { stance: 'mid', aff: { [COOP]: 0.03 }, requires: { flag: 'choice.m2_09_owned_unsold' }, end: endTalk({ complete: 'ask_grandfather',
              lineKo: '(처음으로 웃는다. 아주 조금.) 됐지. 감추는 놈한테는 손이 안 올라간다. 그 애 손 빼고는 다 올라갔다.\n\n(봉투를 건넨다.) 격려금이다. 쓸 데 알지.',
              lineEn: "(For the first time, he smiles. Only a little.) It did. Hands don't go up for someone who hides things. Every hand went up but his.\n\n(He hands me an envelope.) Your allowance. You know what it's for." }),
              note: ['유찰 얘기를 내가 먼저 꺼낸 게 표가 됐느냐고 물었다. 처음으로 아주 조금 웃으며, 감추는 사람한테는 손이 안 올라간다고, 그 애 손 빼고는 다 올라갔다고 했다.', "I asked whether bringing up the unsold lot myself had turned into votes. For the first time he smiled, just a little: hands don't go up for someone who hides things — every hand went up but his grandson's."] }),
        ],
        note: ['집안 어른으로서는 그 표가 어땠느냐고 물었다. 총회에선 손자도 계원 하나라고, 다만 그 애는 아무 이유 없이 손 드는 애가 아니라는 건 알아 두라고 했다.', "I asked how the vote sat with him as family. At a general meeting his grandson was just one member, he said — but I should know he wasn't one to raise his hand for no reason."],
      }),
      shame: scene([
        line(COOP, '(명부를 덮던 손이 멈춘다.) 망신? 표 하나가 망신이면 계원 노릇 못 한다.', "(His hand stops on the roll.) Shamed? If one vote shames you, you're not fit to be a member."),
        line(P, '…', '...'),
        line(COOP, '그리고 그 말, 여기서만 해라.', 'And you say that here and nowhere else.'),
        line(COOP, '정옥선 그 양반 도장 받아서 들어온 사람이 총회장에서 손자 탓을 했다는 말이 돌면, 그 도장이 같이 욕먹는다.', "If word goes round that someone who came in on Jeong Okseon's seal blamed my grandson at the meeting, that seal takes the blame with you."),
      ], {
        choices: [
          opt('spoke_wrong', '제가 말이 지나쳤습니다.', 'I spoke out of turn.',
            { stance: 'giver', aff: { [COOP]: 0.03 }, end: endTalk({ complete: 'ignore',
              lineKo: '(한숨을 쉰다.) 그래. 반대표는 적이 아니라 숙제다. 다음 총회 때 그 손이 어디로 가는지 봐라.\n\n(봉투를 내민다.) 격려금이다. 쓸 데 알지.',
              lineEn: "(He sighs.) Right. A vote against isn't an enemy, it's homework. Watch where that hand goes at the next meeting.\n\n(He holds out an envelope.) Your allowance. You know what it's for." }),
              note: ['말이 지나쳤다고 물렀다. 반대표는 적이 아니라 숙제라고, 다음 총회 때 그 손이 어디로 가는지 보라고 했다.', "I admitted I'd spoken out of turn. A vote against isn't an enemy but homework, I was told — watch where that hand goes at the next meeting."] }),
          opt('deserve_reason', '그래도 이유 정도는 들을 자격이 있습니다.', 'Still, I deserve to hear the reason at least.',
            { stance: 'self', aff: { [COOP]: -0.03 }, next: 'door' }),
        ],
        note: ['손자가 모두 앞에서 나를 망신 준 셈 아니냐고 했다가 계장의 손이 멈췄다. 표 하나가 망신이면 계원 노릇 못 한다고, 정옥선 씨 도장 받아 들어온 사람이 손자 탓을 했다는 말이 돌면 그 도장이 같이 욕먹는다고 했다.', "I said his grandson had shamed me in front of everyone, and the chief's hand stopped. If one vote shamed me, I wasn't fit to be a member — and if word went round that someone who came in on Okseon's seal blamed his grandson, her seal would take the blame too."],
      }),
    },
  },

  // ── M2-11 · M2-10 ──
];
