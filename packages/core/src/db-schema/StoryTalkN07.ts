/**
 * @file StoryTalkN07.ts
 * @description 290차 — N07 「짐 강 — 유작 루어 넷」 받는 자리 · 끝내는 자리 대본(주고받는 장면).
 *   규칙 = `StoryTalks.ts` 머리 · `.agents/inputs/290_talk_brief.md`.
 *
 * 인물: 짐 강(58 · 요절한 루어 장인의 유작을 서른 해 찾는 사람 — 짧게 끊는 반말 · 「너」 · 「…봤다.」 ·
 *   자기는 던지지 않고 주인공의 손만 본다 · 장인이 누군지는 셋째 자리 끝에서야 「내 동생이었어」라고 한다 —
 *   그 전 대본은 「그 사람」 · 「일찍 간 사람」으로만 부른다(스포일러 금지)).
 * 호칭(290): 주인공은 「짐 강 씨」(옛 답의 「형님」을 걷어 냈다) · 영어 Jim. 짐 강은 주인공을 「너」로.
 * 순서: 속초(대결 · 같은 루어) → 포항(지그 · 방어) → 만리포(서프 · 미노우 · 농어) → 제주(에기 · 무늬오징어 · 넷을 넘긴다).
 * 표시: 옛 받는 답 · 보상 답의 표시를 그대로 쓴다(choice.n07_1_* · choice.n07_ask · n07_2_* · n07_3_* · n07_throw · n07_4_*).
 *   새 표시는 만들지 않았다.
 */

import type { StoryTalkDef } from '../types/Story.js';
import { opt, endTalk, line, act, scene } from './StoryTalkKit.js';

const JK = 'jim_kang';
const P = 'player';

export const TALKS_N07: StoryTalkDef[] = [
  // ═══════════════════════════════════════════
  // N07-1 「공방 터」 — 받는 자리(부산 영도)
  // ═══════════════════════════════════════════
  {
    id: 'n07_1_offer', questId: 'N07-1', at: 'offer', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '…찾았어.', "...Found it.", { act: 'look_up' }),
        line(P, '짐 강 씨? 뭘요?', "Jim? Found what?"),
        line(JK, '도면. 영도 폐공방에서.', "The plans. In an abandoned workshop on Yeongdo."),
        line(P, '폐공방이요?', 'An abandoned workshop?'),
        line(JK, '루어 만들던 사람 공방이야. 비어 있었어. 도면만 남아 있었고.', "A lure maker's workshop. Empty. Only the plans were left."),
        line(P, '(접힌 종이를 꺼냈다가, 펼치지 않고 다시 넣는다.)', '(He takes out a folded sheet of paper, then puts it back without opening it.)'),
        line(JK, '시험 장소가 속초라고 적혀 있어.', "It says the test site was Sokcho."),
        line(JK, '같이 가. 대결하자. 같은 루어, 같은 자리.', "Come with me. Let's have a match. Same lure, same spot."),
        line(P, '대결이요?', 'A match?'),
        line(JK, '세 마리.', "Three fish."),
      ], {
        choices: [
          opt('whose', '누구 도면이에요?', 'Whose plans are they?', {
            say: ['누구 도면이에요? 그렇게 찾던 거였어요?', "Whose plans are they? Is this what you've been looking for?"], next: 'whose' }),
          opt('doubt', '대결이라니요. 제가 상대가 될까요?', "A match? Could I even give you a contest?", { next: 'doubt' }),
          opt('accept', '같은 루어, 같은 자리라면 해 볼 만해요', "Same lure, same spot — that's worth a try", {
            say: ['같은 루어, 같은 자리라면 해 볼 만해요. 가요.', "Same lure, same spot — that's worth a try. Let's go."], next: 'accept' }),
        ],
        note: ['짐 강 씨가 영도 폐공방에서 루어 장인의 도면을 찾았다고 했다. 시험 장소가 속초라고 적혀 있다며, 속초에 같이 가서 같은 루어, 같은 자리로 세 마리 대결을 하자고 했다.',
          "Jim said he'd found a lure maker's plans in an abandoned workshop on Yeongdo. They named Sokcho as the test site, and he wanted us to go there together for a three-fish match — same lure, same spot."],
      }),
      whose: scene([
        line(JK, '일찍 간 사람.', "Someone who went too soon.", { act: 'look_sea' }),
        line(JK, '누군지는 나중에 말해. 지금은 이게 진짜 물에서 도는지가 먼저야.', "Who, I'll tell you later. Right now what matters is whether this really swims in the water."),
      ], {
        choices: [
          opt('go', '알겠어요. 속초로 가요', "All right. Let's go to Sokcho", {
            end: endTalk({ accept: true, offer: 'ask_plan',
              lineKo: '속초. 같은 루어, 같은 자리.',
              lineEn: "Sokcho. Same lure, same spot." }),
            note: ['누구 도면인지 물었더니, 일찍 간 사람이라고만 했다. 누군지는 나중에 말하겠다고. 지금은 그게 진짜 물에서 도는지가 먼저라고.',
              "When I asked whose plans they were, he only said someone who went too soon. He'd tell me who later; first, he had to see whether it really swam."] }),
          opt('why_sokcho', '왜 속초예요? 부산에도 바다는 많은데요', "Why Sokcho? Busan has plenty of sea", {
            say: ['그런데 왜 속초예요? 부산에도 바다는 많은데요.', "But why Sokcho? There's plenty of sea in Busan."], next: 'why_sokcho' }),
        ],
        note: ['도면의 주인은 일찍 간 사람이라고만 했다. 누군지는 나중에 말하겠다고.', "The plans belonged to someone who went too soon, he said. Who, he'd tell me later."],
      }),
      why_sokcho: scene([
        line(JK, '도면에 그렇게 적혀 있어. 시험 장소 속초. 그 사람이 거기서 돌려 봤다는 거지.', "That's what the plans say. Test site: Sokcho. It means that's where they tried it out."),
        line(JK, '만든 사람이 시험한 물에서 던져야 제대로 보여. 다른 물에선 다른 루어야.', "You only see it properly if you cast it in the water its maker tested it in. In other water, it's a different lure."),
        line(JK, '가자. 너 속초 물 알잖아.', "Let's go. You know Sokcho's water."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_sokcho' }),
        note: ['왜 속초냐고 물었다. 도면에 시험 장소가 속초라고 적혀 있고, 만든 사람이 시험한 물에서 던져야 제대로 보인다고 했다. 내가 속초 물을 안다고.',
          "I asked why Sokcho. The plans named it as the test site, and you only see a lure properly in the water its maker tested it in. And I knew Sokcho's water, he said."],
      }),
      doubt: scene([
        line(JK, '상대가 되든 말든 상관없어. 나는 네 손을 봐야 돼.', "Whether you're a match for me doesn't matter. I need to see your hands."),
        line(P, '(내 손을 한참 본다. 무엇을 보는지는 말하지 않는다.)', "(He studies my hands for a long while. He doesn't say what he's looking for.)"),
        line(JK, '이기고 지는 건 내가 정해. 넌 던지기만 해. 세 마리. 그거면 돼.', "I'll decide who wins and loses. You just cast. Three fish. That's all."),
      ], {
        end: endTalk({ accept: true, offer: 'doubt' }),
        note: ['내가 상대가 되겠느냐고 했더니, 짐 강 씨는 상관없다며 내 손을 봐야 한다고 했다. 무엇을 보는지는 말하지 않았다.',
          "When I asked if I'd even be a contest, Jim said it didn't matter — he needed to see my hands. He didn't say what he was looking for."],
      }),
      accept: scene([
        line(JK, '그래. 루어는 준비해 놨어. 두 개. 똑같은 걸로.', "Good. I've got the lures ready. Two. Identical."),
        line(P, '(나무 루어다. 아직 칠도 하지 않았다.)', "(Wooden lures. Not even painted yet.)"),
        line(JK, '같은 루어면 손만 남아. 그걸 보고 싶은 거야. 속초 물에서.', "With the same lure, all that's left is the hands. That's what I want to see. In Sokcho's water."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['해 볼 만하다고 했다. 짐 강 씨는 아직 칠도 하지 않은 똑같은 나무 루어 두 개를 꺼내며, 같은 루어면 손만 남는다고 했다.',
          "I said it was worth a try. Jim took out two identical wooden lures, not yet painted. With the same lure, he said, only the hands are left."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N07-1 — 끝내는 자리(속초 대결 뒤)
  // ═══════════════════════════════════════════
  {
    id: 'n07_1_done', questId: 'N07-1', at: 'complete', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '…봤다.', '...I saw.', { act: 'nod' }),
        line(P, '누가 이겼어요?', 'Who won?'),
        line(JK, '그건 말 안 해.', "I won't say.", { act: 'shake_head' }),
        line(JK, '네 손이 그 사람 손을 닮았어.', "Your hands are like that person's."),
        line(P, '그 사람이요?', "That person's?"),
        line(JK, '다음 장소가 있다. 포항이야.', "There's a next place. Pohang."),
      ], {
        choices: [
          opt('ask_who', '그 장인이 누구였어요?', 'Who was the craftsman?', { next: 'ask_who' }),
          opt('lesson', '그 루어 액션, 폴링에 비밀이 있었던 것 같아요', 'I think the secret of that lure is in the fall', {
            say: ['그 루어 액션, 제가 보기엔 폴링에 비밀이 있었던 것 같아요.', "That lure's action — the way I see it, the secret was in the fall."], next: 'lesson' }),
          opt('pay', '속초까지 왔으니 여비는 주세요', "I came all the way to Sokcho. Cover my travel", {
            end: endTalk({ complete: 'pay',
              lineKo: '그래야지. 내가 끌고 온 거니까. 속초까지 먼 길이었지. 그 사람도 도면 하나 들고 그 길을 다녔을 거야. …넉넉히 넣었어. 다음 길도 멀거든.',
              lineEn: "Fair. I'm the one who dragged you here. It's a long way to Sokcho. That person probably travelled it too, with nothing but the plans. ...I put in plenty. The next road is long as well." }),
            note: ['여비를 청했다. 짐 강 씨는 자기가 끌고 왔으니 당연하다며 넉넉히 넣어 줬다. 그 사람도 도면 하나 들고 그 길을 다녔을 거라고, 다음 길도 멀다고.',
              "I asked for travel money. Jim said it was only right, since he'd dragged me here, and was generous. That person must have walked the same road with nothing but the plans, he said — and the next road was long too."] }),
          opt('throw_more', '여비는 됐어요. 해 질 때까지 더 던져 볼게요', "No need for travel money. I'll cast it until sundown", {
            say: ['여비는 됐어요. 그 루어, 해 질 때까지 더 던져 볼게요.', "Keep the travel money. I'll cast that lure some more, until the sun goes down."], next: 'throw_more' }),
        ],
        note: ['속초에서 같은 루어, 같은 자리로 짐 강 씨와 대결했다. 누가 이겼는지는 말하지 않았다. 내 손이 그 사람 손을 닮았다고만 했다. 다음 장소는 포항이라고.',
          "In Sokcho, Jim and I fished it out with the same lure in the same spot. He wouldn't say who won — only that my hands were like that person's. The next place was Pohang."],
      }),
      ask_who: scene([
        line(JK, '…나중에. 네 번째 자리에서 말해 준다.', "...Later. I'll tell you at the fourth place."),
        line(JK, '지금 말하면 네가 그 사람처럼 던지려고 할 거야. 그럼 안 돼.', "If I tell you now, you'll try to cast like them. That won't do."),
        line(JK, '네 손 그대로 던져야 내가 볼 수 있어. 그때까지 도면 사본은 갖고 있어.', "You have to cast with your own hands for me to see. Keep a copy of the plans until then."),
      ], {
        end: endTalk({ complete: 'ask_who' }),
        note: ['그 장인이 누구냐고 물었다. 짐 강 씨는 네 번째 자리에서 말해 주겠다며 도면 사본 한 장을 접어 줬다. 지금 말하면 내가 그 사람처럼 던지려 할 거라고.',
          "I asked who the craftsman was. Jim said he'd tell me at the fourth place, and folded a copy of the plans for me. Tell me now, he said, and I'd try to cast like them."],
      }),
      lesson: scene([
        line(JK, '눈이 있네. 폴링이 맞아.', "You've got an eye. It's the fall."),
        line(JK, '가라앉을 때 몸을 흔들면서 떨어져. 그때 물어. 감을 때가 아니라.', "As it sinks it shimmies on the way down. That's when they bite. Not on the retrieve."),
        line(JK, '이걸 아는 사람은 많지 않아. 그 사람은 알고 깎았어.', "Not many people know that. That person knew it, and carved for it."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['그 루어의 비밀이 폴링에 있는 것 같다고 했더니, 짐 강 씨는 눈이 있다며 가라앉을 때 몸을 흔들며 떨어질 때 문다고 알려 줬다. 그 사람은 그걸 알고 깎았다고.',
          "When I guessed the lure's secret was in the fall, Jim said I had an eye: it shimmies as it sinks, and that's when fish bite. Its maker knew that and carved for it."],
      }),
      throw_more: scene([
        line(JK, '…돈보다 루어라.', "...The lure over the money."),
        line(P, '(입가가 조금 움직였다. 웃었다고 해야 할지 모르겠다.)', "(The corner of his mouth moves a little. I'm not sure it counts as a smile.)"),
        line(JK, '던져. 해 질 때까지. 그 사람도 그랬을 거야. 루어는 던질수록 제 길을 찾아.', "Cast it. Until sundown. That person would have done the same. The more you cast a lure, the more it finds its own way."),
      ], {
        end: endTalk({ complete: 'throw_more' }),
        note: ['여비 대신 그 루어를 해 질 때까지 더 던지겠다고 했다. 짐 강 씨의 입가가 조금 움직였다. 그날 해 질 녘까지 던졌다. 방파제 사람들이 그 나무 루어를 기억한다.',
          "Instead of travel money, I said I'd keep casting the lure until sundown. The corner of Jim's mouth moved. I cast until dusk, and the people on the breakwater remember that wooden lure."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N07-2 「두 번째」 — 받는 자리(포항 앞바다 · 지깅)
  // ═══════════════════════════════════════════
  {
    id: 'n07_2_offer', questId: 'N07-2', at: 'offer', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '두 번째야.', "The second.", { act: 'look_sea' }),
        line(P, '포항이네요.', "So it's Pohang."),
        line(JK, '포항 앞바다. 지그. 방어 한 마리.', "Off Pohang. Jigs. One yellowtail."),
        line(JK, '두 번째 조각이 여기 어딘가 있어.', "The second piece is somewhere around here."),
        line(P, '이번엔 같이 던지세요?', 'Are you casting this time?'),
        line(JK, '나는 또 안 던진다.', "I won't cast. Again.", { act: 'shake_head' }),
        line(JK, '네 저킹만 본다.', "I'll just watch your jerking."),
      ], {
        choices: [
          opt('piece', '두 번째 조각이라니, 그게 뭐예요?', "The second piece? What's that?", { next: 'piece' }),
          opt('measure', '제 저킹을 보신다고요? 뭘 보시는 거예요?', "You'll watch my jerking? Watching for what?", { next: 'measure' }),
          opt('accept', '지켜봐 주세요. 방어 한 마리 올릴게요', "Watch me, then. I'll land one yellowtail", { next: 'accept' }),
        ],
        note: ['포항 앞바다에서 짐 강 씨와 두 번째 자리. 지그로 방어 한 마리. 유작의 두 번째 조각이 여기 어딘가 있다고 했다. 짐 강 씨는 이번에도 던지지 않고 내 저킹만 보겠다고 했다.',
          "Off Pohang, the second place with Jim. One yellowtail, on a jig. The second piece of the legacy was somewhere around here, he said. Once again he wouldn't cast — he'd only watch my jerking."],
      }),
      piece: scene([
        line(JK, '그 사람 루어는 한데 안 남았어. 흩어졌지. 도면 하나, 지그 하나. 하나씩 찾는 거야.', "That person's lures didn't stay in one place. They scattered. One set of plans, one jig. I'm finding them one at a time."),
        line(JK, '두 번째는 지그야. 그 사람이 포항 물에 맞춰 만들었다고 나는 믿어.', "The second is a jig. I believe it was made for Pohang's water."),
        line(P, '믿는다고요?', 'You believe?'),
        line(JK, '믿는 거지, 아직 본 건 아니야. 그래서 네 손이 필요해. 방어 한 마리.', "Believe. I haven't seen it yet. That's why I need your hands. One yellowtail."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_piece' }),
        note: ['두 번째 조각이 뭐냐고 물었다. 그 사람의 루어는 흩어져서, 도면 하나, 지그 하나씩 찾는 거라고 했다. 두 번째는 포항 물에 맞춘 지그라고 믿는다고.',
          "I asked what the second piece was. That person's lures had scattered, he said — he was finding them one by one, plans first, then a jig. He believed the second was a jig made for Pohang's water."],
      }),
      measure: scene([
        line(JK, '끝나고 말해. 지금 말하면 네 손이 그걸 의식해.', "I'll tell you after. Tell you now, and your hands will be thinking about it.", { act: 'shake_head' }),
        line(P, '(팔짱을 낀다. 더 묻지 말라는 자세다.)', '(He folds his arms. A posture that says: no more questions.)'),
        line(JK, '의식한 저킹은 저킹이 아니야. 평소대로 해. 네 박자로.', "Self-conscious jerking isn't jerking. Do it like you always do. Your own rhythm."),
      ], {
        choices: [
          opt('as_usual', '알겠어요. 평소대로 할게요', "All right. I'll do it like I always do", {
            end: endTalk({ accept: true, offer: 'ask_measure',
              lineKo: '그래. 방어는 빠른 걸 좋아한다더라. 그것도 신경 쓰지 마. 네 박자로.',
              lineEn: "Good. They say yellowtail like it fast. Don't think about that either. Your own rhythm." }),
            note: ['무엇을 보는지 물었지만, 짐 강 씨는 끝나고 말하겠다고 했다. 지금 말하면 손이 의식한다고. 평소대로 내 박자로 하기로 했다.',
              "I asked what he'd be watching for, but Jim said he'd tell me after — tell me now and my hands would be self-conscious. I'd jig as I always do, in my own rhythm."] }),
          opt('unsure', '지깅은 아직 손에 덜 익었는데 괜찮을까요?', "Jigging isn't second nature to me yet — is that okay?", {
            say: ['지깅은 아직 손에 덜 익었어요. 괜찮을까요?', "I'm still not used to jigging. Is that all right?"], next: 'unsure' }),
        ],
        note: ['무엇을 보는지는 끝나고 말하겠다고 했다. 지금 말하면 손이 의식한다고.', "What he'd be watching for, he'd tell me after. Tell me now, and my hands would know."],
      }),
      unsure: scene([
        line(JK, '덜 익은 게 좋아. 다 익은 손은 버릇이 박혀서 안 보여.', "Not used to it is good. Practised hands have habits baked in. You can't see past them.", { act: 'nod' }),
        line(JK, '속초에서 네 손 봤어. 그걸로 충분해.', "I saw your hands in Sokcho. That's enough."),
        line(JK, '포항 물은 깊어. 바닥 찍고 올리는 것만 잊지 마. 방어 한 마리.', "Pohang's water is deep. Just don't forget to touch bottom before you work it up. One yellowtail."),
      ], {
        end: endTalk({ accept: true, offer: 'unsure' }),
        note: ['지깅이 덜 익었다고 했더니, 짐 강 씨는 덜 익은 게 좋다고 했다. 다 익은 손은 버릇이 박혀서 안 보인다고. 포항 물은 깊으니 바닥 찍고 올리는 것만 잊지 말라고.',
          "When I said I wasn't used to jigging, Jim said that was good — practised hands hide behind habit. Pohang's water was deep; just don't forget to touch bottom first."],
      }),
      accept: scene([
        line(JK, '그래. 나는 보기만 해. 손은 안 대.', "Good. I'll only watch. I won't lay a hand on it."),
        line(P, '(배 난간에 등을 기댄다.)', '(He leans his back against the boat rail.)'),
        line(JK, '포항 앞바다 방어는 힘이 세. 한 번 차고 나가면 버텨. 버티는 것도 저킹만큼 볼 거야. 가자.', "Yellowtail off Pohang are strong. Once one runs, you hold on. I'll watch the holding on as closely as the jerking. Let's go."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['지켜봐 달라고, 방어 한 마리 올리겠다고 했다. 짐 강 씨는 배 난간에 등을 기대며, 포항 방어는 힘이 세니 버티는 것도 저킹만큼 보겠다고 했다.',
          "I told him to watch — I'd land one yellowtail. Jim leaned on the boat rail and said Pohang yellowtail were strong; he'd watch me hold on as closely as he watched me jig."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N07-2 — 끝내는 자리
  // ═══════════════════════════════════════════
  {
    id: 'n07_2_done', questId: 'N07-2', at: 'complete', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '…봤다.', '...I saw.', { act: 'nod' }),
        line(P, '방어, 꽤 버텼어요.', 'That yellowtail put up a fight.'),
        line(JK, '버티는 손도 봤어.', "I saw your hands hold on, too."),
        line(P, '(이번에도 짐 강 씨는 지그를 한 번도 던지지 않았다.)', "(Once again, Jim didn't cast his jig even once.)"),
        line(JK, '두 번째 조각도 네 손에 맞겠어.', "The second piece will suit your hands too."),
        line(JK, '다음은 태안. 서프.', "Next is Taean. Surf."),
      ], {
        choices: [
          opt('lesson', '무엇을 재신 거예요? 알려 주세요', 'What were you measuring? Please tell me', { next: 'lesson' }),
          opt('ask', '왜 직접 던지지 않으세요?', "Why don't you cast yourself?", { next: 'ask' }),
          opt('pay', '실측 도우미 값은 있겠죠?', "There's a fee for being measured, I assume?", { next: 'pay' }),
          opt('follow', '여비는 됐어요. 다음 자리도 따라갈게요', "Keep the travel money. I'll follow you to the next place", { next: 'follow' }),
        ],
        note: ['포항 앞바다에서 지깅으로 방어 한 마리를 올렸다. 짐 강 씨는 이번에도 자기 지그를 던지지 않고 내 저킹만 봤다. 두 번째 조각도 내 손에 맞겠다고, 다음은 태안 서프라고 했다.',
          "Off Pohang, I landed a yellowtail on a jig. Again Jim didn't cast his own — he only watched me jig. The second piece would suit my hands too, he said. Next: Taean, surf."],
      }),
      lesson: scene([
        line(JK, '리듬. 그 사람 리듬과 네 리듬의 차이.', "Rhythm. The difference between that person's rhythm and yours."),
        line(JK, '그 사람은 쉬는 박자에 맞춰 이 지그를 깎았어. 무게가 뒤로 몰려 있지. 쉬면 눕고, 누우면 물어.', "They carved this jig for the pause. The weight sits towards the back. Pause, it lies down. Lies down, they bite."),
        line(JK, '너는 거의 안 쉬더라. 그래도 물었어. 그 차이를 재고 있었던 거야.', "You hardly paused at all. And it still bit. That gap is what I was measuring."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['무엇을 쟀는지 물었다. 리듬이라고 했다. 그 사람은 쉬는 박자에 맞춰 무게가 뒤로 몰린 지그를 깎았는데, 나는 거의 안 쉬어도 물었다고. 그 차이를 쟀다고.',
          "I asked what he'd been measuring. Rhythm, he said. That person carved the jig for the pause, weight towards the back — yet I barely paused and still got bit. He'd been measuring that gap."],
      }),
      ask: scene([
        line(JK, '…내 손은 그 사람 손이 아니야. 네 손이 더 가까워.', "...My hands aren't that person's. Yours are closer."),
        line(P, '…', '...'),
        line(JK, '내가 던지면 그 루어가 내 루어가 돼. 그건 싫어. 그 사람 루어로 남아야 해.', "If I cast it, the lure becomes mine. I don't want that. It has to stay that person's lure.", { act: 'look_sea' }),
        line(JK, '그래서 네가 던지는 거야. 너는 그 사람을 모르니까.', "That's why you cast it. Because you never knew them."),
      ], {
        end: endTalk({ complete: 'ask' }),
        note: ['왜 직접 던지지 않느냐고 물었다. 자기가 던지면 그 루어가 자기 루어가 되니 싫다고, 그 사람 루어로 남아야 한다고 했다. 내가 그 사람을 모르니까 내가 던지는 거라고.',
          "I asked why he never cast himself. If he did, the lure would become his, he said, and it had to stay that person's. That's why I cast it — because I never knew them."],
      }),
      pay: scene([
        line(JK, '있지. 서른 해를 찾은 사람이 인색하면 안 되지.', "There is. A man who's searched for thirty years can't be stingy."),
        line(JK, '…서른 해. 말하고 나니 길다. 찾는 동안은 몰랐어.', "...Thirty years. Saying it out loud, it's long. I didn't notice while I was searching.", { act: 'look_sea' }),
        line(JK, '너한테 주는 여비가 그 서른 해 동안 제일 잘 쓴 돈일 거야. 받아.', "The travel money I give you might be the best money I've spent in those thirty years. Take it."),
      ], {
        end: endTalk({ complete: 'pay' }),
        note: ['실측 도우미 값을 청했다. 짐 강 씨는 서른 해를 찾은 사람이 인색하면 안 된다며 넉넉히 줬다. 서른 해, 말하고 나니 길다고 했다.',
          "I asked for a fee for being measured. Jim said a man who'd searched thirty years couldn't be stingy, and paid generously. Thirty years, he said — saying it out loud, it was long."],
      }),
      follow: scene([
        line(JK, '…따라온다고.', "...You'll follow.", { act: 'peer' }),
        line(JK, '그 말 들으려고 포항까지 온 건 아닌데. 듣고 나니 됐다.', "I didn't come all the way to Pohang to hear that. But now that I have, it's enough."),
        line(JK, '네가 온다면, 나는 또 안 던질 거다.', "If you come, I still won't cast."),
      ], {
        end: endTalk({ complete: 'follow' }),
        note: ['여비는 됐고 다음 자리도 따라가겠다고 했다. 짐 강 씨는 나를 오래 보더니, 그 말을 들으려고 온 건 아닌데 듣고 나니 됐다고 했다. 포항 항구 사람들이 그날 내 저킹을 기억한다.',
          "I turned down the money and said I'd follow him to the next place. Jim looked at me a long time, then said he hadn't come to hear that, but now that he had, it was enough. The people of Pohang harbour remember my jigging that day."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N07-3 「세 번째」 — 받는 자리(만리포 서프)
  // ═══════════════════════════════════════════
  {
    id: 'n07_3_offer', questId: 'N07-3', at: 'offer', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '세 번째.', "The third.", { act: 'look_sea' }),
        line(P, '만리포네요. 파도가 높아요.', "Manripo. The waves are high."),
        line(JK, '서프. 미노우. 농어 한 마리.', "Surf. Minnow. One sea bass."),
        line(P, '이번에도…', 'And this time too...'),
        line(JK, '나는 또 안 던져.', "I won't cast. Again."),
        line(P, '(예상은 했다.)', '(I saw that coming.)'),
      ], {
        choices: [
          opt('surf', '파도치는 데서 미노우를 던져요?', 'You cast a minnow into breaking waves?', {
            say: ['서프라니요. 파도치는 데서 미노우를 던져요?', "Surf? You cast a minnow where the waves are breaking?"], next: 'surf' }),
          opt('piece', '세 번째 조각은 이미 찾으셨어요?', 'Have you already found the third piece?', { next: 'piece' }),
          opt('accept', '만리포까지 왔으니, 한 마리는 꼭 올릴게요', "We've come all the way to Manripo. I'll land one", {
            say: ['만리포까지 왔으니, 한 마리는 꼭 올릴게요.', "We've come all the way to Manripo. I'll land one for sure."], next: 'accept' }),
        ],
        note: ['만리포 서프, 짐 강 씨의 세 번째 자리. 미노우로 농어 한 마리. 짐 강 씨는 이번에도 던지지 않겠다고 했다. 예상은 했다.',
          "Manripo surf: Jim's third place. One sea bass, on a minnow. Once again he wouldn't cast. I'd seen that coming."],
      }),
      surf: scene([
        line(JK, '파도 안쪽. 파도가 깨진 자리. 거품 밑에 먹이가 뒤집혀. 농어는 거기로 들어와.', "Inside the waves. Where they break. Bait gets churned up under the foam. That's where sea bass come in."),
        line(P, '(모래사장 쪽으로 흰 거품 줄이 길게 늘어서 있다.)', '(A long white line of foam stretches along the beach.)'),
        line(JK, '거스르지 마. 파도랑 싸우면 진다. 네 손이 그걸 알아내는지 볼 거야. 한 마리.', "Don't fight it. Fight the waves and you lose. I'll see whether your hands figure that out. One fish."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_surf' }),
        note: ['서프에서는 파도가 깨진 자리, 거품 밑에 먹이가 뒤집혀 농어가 들어온다고 했다. 파도랑 싸우면 진다고, 내 손이 그걸 알아내는지 보겠다고.',
          "In the surf, he said, bait gets churned up under the foam where the waves break, and sea bass come in for it. Fight the waves and you lose — he'd see whether my hands worked that out."],
      }),
      piece: scene([
        line(JK, '…찾았어. 주머니에 있어.', "...I've found it. It's in my pocket."),
        line(P, '(주머니 위를 손으로 누를 뿐, 꺼내지는 않는다.)', "(He only presses a hand over the pocket. He doesn't take it out.)"),
        line(JK, '네가 올리면 꺼낼게. 물에서 도는 걸 봐야 진짜인지 알아. 만리포 물에서. 그게 순서야.', "When you land one, I'll take it out. I only know it's real once I see it swim. In Manripo's water. That's the order of things."),
      ], {
        choices: [
          opt('show', '그럼 올려서 보여 드릴게요', "Then I'll land one and show you", {
            end: endTalk({ accept: true, offer: 'ask_piece' }),
            note: ['세 번째 조각은 이미 찾아 주머니에 있다고 했다. 내가 올리면 꺼내겠다고, 물에서 도는 걸 봐야 진짜인지 안다고.',
              "He'd already found the third piece; it was in his pocket. He'd take it out once I landed one — only seeing it swim would tell him it was real."] }),
          opt('cast_together', '이번엔 같이 던지시죠. 세 번째인데요', "Cast with me this time. It's the third", { next: 'cast_together' }),
        ],
        note: ['세 번째 조각은 이미 주머니에 있다고 했다.', 'The third piece was already in his pocket.'],
      }),
      cast_together: scene([
        line(JK, '안 던져. 내 손은 그 물에 안 맞아.', "No. My hands don't suit that water.", { act: 'look_away' }),
        line(P, '(말끝을 흐린다. 이유는 거기서 멈췄다.)', '(He trails off. The reason stops there.)'),
        line(JK, '대신 끝까지 볼게. 네가 파도에 밀리면 소리쳐 줄게. 그 정도는 해. 미노우 챙겨.', "But I'll watch to the end. If the waves push you back, I'll shout. That much I'll do. Bring your minnow."),
      ], {
        end: endTalk({ accept: true, offer: 'cast_together' }),
        note: ['이번엔 같이 던지자고 했지만, 짐 강 씨는 자기 손은 그 물에 안 맞는다며 말끝을 흐렸다. 대신 끝까지 보고, 파도에 밀리면 소리쳐 주겠다고 했다.',
          "I asked him to cast with me this time, but Jim said his hands didn't suit that water, and trailed off. He'd watch to the end instead, and shout if the waves pushed me back."],
      }),
      accept: scene([
        line(JK, '꼭은 없어. 바다는 같은 걸 두 번 안 줘.', "There's no for sure. The sea never gives the same thing twice."),
        line(P, '(그래도 미노우를 건네는 손이 오래 머문다.)', '(Still, his hand lingers as he passes me the minnow.)'),
        line(JK, '발밑 조심해. 서프는 한 번씩 큰 파도가 와.', "Watch your footing. In the surf, a big wave comes every so often."),
        line(JK, '…오늘은 할 말이 있을지도 몰라. 네가 올리면.', "...Today I might have something to say. If you land one."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['한 마리는 꼭 올리겠다고 했다. 짐 강 씨는 꼭은 없다고 했지만, 미노우를 건네는 손이 오래 머물렀다. 오늘은 할 말이 있을지도 모른다고 했다.',
          "I promised to land one. Jim said there was no for sure — but his hand lingered as he gave me the minnow. Today, he said, he might have something to say."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N07-3 — 끝내는 자리(장인이 누구였는지 처음 말한다)
  // ═══════════════════════════════════════════
  {
    id: 'n07_3_done', questId: 'N07-3', at: 'complete', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '…셋.', "...Three.", { act: 'look_sea' }),
        line(P, '세 번째 조각이에요?', 'Is that the third piece?'),
        line(JK, '그래. 물에서 도는 거 봤어.', "Yes. I saw it swim."),
        act(JK, 'silence'),
        line(JK, '그 사람은… 내 동생이었어.', "That person... was my younger brother."),
        line(P, '…동생이요?', '...Your brother?'),
        line(JK, '네 번째는 제주. 에기.', "The fourth is Jeju. Egi.", { act: 'look_away' }),
      ], {
        choices: [
          opt('brother', '동생분 이야기, 더 듣고 싶어요', "I'd like to hear more about your brother", { next: 'brother' }),
          opt('lesson', '서프 리트리브, 짐 강 씨 눈으로 봐 주세요', 'Look over my surf retrieve with your eye, Jim', {
            say: ['서프 미노우 리트리브, 짐 강 씨 눈으로 교정받고 싶어요.', "I'd like you to correct my surf minnow retrieve, Jim."], next: 'lesson' }),
          opt('pay', '세 번째 여비도 주세요', "I'll take the third round of travel money", {
            end: endTalk({ complete: 'pay',
              lineKo: '그래. 태안은 멀었지. 다음은 제주야. 더 멀어. 그래도 거기가 마지막이야. 끝까지 와 줘.',
              lineEn: "All right. Taean was a long way. Next is Jeju. Further still. But that's the last one. Come all the way to the end." }),
            note: ['세 번째 여비를 받았다. 서른 해를 찾은 사람의 돈이었다. 다음은 제주, 더 멀지만 거기가 마지막이니 끝까지 와 달라고 했다.',
              "I took the third round of travel money — money from a man who'd searched for thirty years. Next was Jeju, further still, but it was the last; he asked me to come to the end."] }),
          opt('watch_sea', '여비는 됐어요. 오늘은 이 바다를 같이 볼게요', "No travel money. Today I'll just watch this sea with you", { next: 'watch_sea' }),
        ],
        note: ['만리포 서프에서 농어 한 마리를 올렸다. 세 번째 조각이 짐 강 씨의 주머니에서 나왔다. 유작 넷 중 셋. 짐 강 씨가 처음으로 말했다. 그 장인은 자기 동생이었다고. 그 말만 하고 바다를 봤다.',
          "I landed a sea bass in the Manripo surf. The third piece came out of Jim's pocket — three of the four. For the first time, Jim told me: the craftsman was his younger brother. He said only that, and looked at the sea."],
      }),
      brother: scene([
        line(JK, '…제주에서. 넷 다 모이면.', "...In Jeju. Once all four are together."),
        line(JK, '오늘은 이만큼만 하자. 동생이라는 말이 아직 입에 설어.', "That's as far as I go today. The word brother still feels strange in my mouth."),
        line(JK, '한 번에 다 하면 이 바다에 다 쏟을 것 같아.', "If I said it all at once, I think I'd pour the whole thing into this sea."),
      ], {
        end: endTalk({ complete: 'brother' }),
        note: ['동생 이야기를 더 듣고 싶다고 했다. 짐 강 씨는 제주에서 넷이 다 모이면 하겠다며, 유작 세 번째의 사본인 미노우 하나를 줬다. 동생이라는 말이 아직 입에 설다고.',
          "I said I wanted to hear more about his brother. Jim said he'd tell me in Jeju, once all four were together, and gave me a minnow — a copy of the third piece. The word brother still felt strange to say, he said."],
      }),
      lesson: scene([
        line(JK, '파도 타이밍이야. 밀려올 때 감아.', "It's the timing of the waves. Reel as it rolls in."),
        line(JK, '빠질 때는 멈춰. 미노우가 파도에 끌려가면서 저절로 흔들려.', "Stop as it pulls back. The wave drags the minnow and it wobbles on its own."),
        line(JK, '그게 제일 좋은 액션이야. 손이 아니라 바다가 하는 거지. 동생도 그렇게 깎았어.', "That's the best action there is. The sea does it, not your hand. My brother carved it that way."),
      ], {
        end: endTalk({ complete: 'lesson' }),
        note: ['짐 강 씨에게 서프 리트리브를 교정받았다. 파도가 밀려올 때 감고, 빠질 때 멈춘다. 그러면 미노우가 파도에 끌려가며 저절로 흔들린다고. 동생도 그렇게 깎았다고.',
          "Jim corrected my surf retrieve: reel as the wave rolls in, stop as it pulls back, and the wave drags the minnow into its own wobble. His brother carved it for exactly that."],
      }),
      watch_sea: scene([
        line(JK, '…그래.', "...All right."),
        act(JK, 'silence'),
        line(P, '(둘이 나란히 서서 만리포 물을 봤다. 한참 아무 말도 하지 않았다.)', "(We stand side by side and watch the water at Manripo. For a long time, neither of us says a word.)"),
        line(JK, '고맙다. 이런 건 돈으로 못 갚아. 그러니 돈은 안 줄게.', "Thank you. This kind of thing can't be repaid with money. So I won't give you any."),
        line(JK, '제주에선 다 말할게. 그건 약속하지.', "In Jeju, I'll tell you everything. That I promise."),
      ], {
        end: endTalk({ complete: 'watch_sea' }),
        note: ['여비 대신 오늘은 이 바다를 같이 보겠다고 했다. 둘이 나란히 서서 한참 만리포 물을 봤다. 짐 강 씨는 이런 건 돈으로 못 갚는다며, 제주에선 다 말하겠다고 약속했다.',
          "Instead of travel money, I said I'd watch the sea with him today. We stood side by side looking at the water at Manripo for a long time. Jim said this couldn't be repaid with money, and promised to tell me everything in Jeju."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N07-4 「네 번째」 — 받는 자리(제주 에기)
  // ═══════════════════════════════════════════
  {
    id: 'n07_4_offer', questId: 'N07-4', at: 'offer', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '네 번째.', "The fourth.", { act: 'look_sea' }),
        line(P, '제주네요. 마지막이에요.', "Jeju. The last one."),
        line(JK, '제주 에기. 무늬오징어 한 마리.', "Jeju. Egi. One bigfin squid."),
        line(JK, '그러면 넷이 모여.', "Then all four are together."),
        line(P, '(짐 강 씨는 에기를 손바닥에 올려놓고 한참 보고 있었다.)', '(Jim has been holding an egi on his palm, looking at it for a long time.)'),
        line(JK, '동생 에기야. 이번에도 나는 안 던져.', "My brother's egi. This time too, I won't cast."),
      ], {
        choices: [
          opt('after', '넷이 다 모이면, 그다음엔 어떻게 하실 거예요?', 'Once all four are together — what then?', { next: 'after' }),
          opt('egi', '동생분 에기는 뭐가 달라요?', "What makes your brother's egi different?", {
            say: ['동생분 에기는 다른 에기와 뭐가 달라요?', "How is your brother's egi different from other egi?"], next: 'egi' }),
          opt('accept', '넷을 모으는 자리, 끝까지 함께할게요', "I'll see the gathering of the four through to the end", { next: 'accept' }),
        ],
        note: ['제주 에기, 짐 강 씨의 네 번째 자리. 무늬오징어 한 마리를 올리면 유작 넷이 모인다고 했다. 짐 강 씨는 동생의 에기를 손바닥에 올려놓고 오래 봤다. 이번에도 던지지 않겠다고 했다.',
          "Jeju egi — Jim's fourth place. Land one bigfin squid, and the four pieces of the legacy would be together. Jim held his brother's egi on his palm and looked at it for a long time. Again, he wouldn't cast."],
      }),
      after: scene([
        act(JK, 'silence'),
        line(JK, '…모르겠어.', "...I don't know."),
        line(JK, '서른 해 동안 모으는 것만 생각했어. 모은 다음은 생각해 본 적이 없다.', "For thirty years I only thought about gathering them. I never once thought about after."),
        line(JK, '오늘 올리면 생각날지도 몰라. 그러니까 올려. 무늬오징어 한 마리. 동생 에기로.', "Maybe it'll come to me if you land one today. So land one. One bigfin squid. On my brother's egi."),
      ], {
        end: endTalk({ accept: true, offer: 'ask_after' }),
        note: ['넷이 모이면 그다음엔 어떻게 할 거냐고 물었다. 짐 강 씨는 서른 해 동안 모으는 것만 생각했다며, 모은 다음은 생각해 본 적이 없다고 했다. 오늘 올리면 생각날지도 모른다고.',
          "I asked what he'd do once all four were together. Jim said that in thirty years he'd only thought about gathering them — never about after. Maybe it would come to him if I landed one today."],
      }),
      egi: scene([
        line(JK, '가라앉는 게 달라. 천천히, 수평으로. 오징어가 올려다볼 시간을 줘.', "It sinks differently. Slowly, level. It gives the squid time to look up at it."),
        line(P, '(에기를 기울여 보인다. 꼬리 쪽이 조금 무겁다.)', '(He tilts the egi to show me. The tail end is a little heavier.)'),
        line(JK, '동생은 폴링에 다 걸었어. 감는 건 덤이야. 오늘은 네가 그 가라앉음을 줘 봐.', "My brother bet everything on the fall. The retrieve is an afterthought. Today, you give it that sink."),
      ], {
        choices: [
          opt('give_fall', '그 폴링, 제가 줘 볼게요', "I'll give it that fall", {
            end: endTalk({ accept: true, offer: 'ask_egi' }),
            note: ['동생의 에기는 천천히 수평으로 가라앉아, 오징어가 올려다볼 시간을 준다고 했다. 꼬리 쪽이 조금 무거웠다. 그 가라앉음을 내가 줘 보기로 했다.',
              "His brother's egi sinks slowly and level, giving the squid time to look up at it; the tail end was a little heavier. I'd try to give it that sink."] }),
          opt('unsure', '마지막 자리를 제가 던져도 될까요?', "Is it really right for me to cast at the last place?", {
            say: ['마지막 자리를 제가 던져도 되는 거예요?', "Is it really right for me to be the one casting at the last place?"], next: 'unsure' }),
        ],
        note: ['동생의 에기는 천천히, 수평으로 가라앉는다고 했다.', "His brother's egi sinks slowly, and level."],
      }),
      unsure: scene([
        line(JK, '너라서 되는 거야. 속초에서부터 네 손만 봤어. 이제 와서 다른 손은 안 돼.', "It's right because it's you. Since Sokcho, I've watched only your hands. No other hands now."),
        line(P, '(말이 평소보다 길다.)', '(He says more than usual.)'),
        line(JK, '마지막이라고 무겁게 던지지 마. 동생 에기는 가볍게 던져야 가볍게 가라앉아. 한 마리면 돼.', "Don't throw it heavy just because it's the last. My brother's egi sinks light only if you cast it light. One squid is all."),
      ], {
        end: endTalk({ accept: true, offer: 'unsure' }),
        note: ['마지막 자리를 내가 던져도 되느냐고 물었다. 짐 강 씨는 속초에서부터 내 손만 봤다며, 이제 와서 다른 손은 안 된다고 했다. 마지막이라고 무겁게 던지지 말라고.',
          "I asked if it was right for me to cast at the last place. Jim said he'd watched only my hands since Sokcho — no other hands now. Don't cast it heavy just because it's the last, he said."],
      }),
      accept: scene([
        line(JK, '…그래. 그 말 들으니 이제 실감이 난다. 넷이라는 게.', "...Right. Hearing you say it, it finally feels real. That there'll be four."),
        act(JK, 'sigh'),
        line(JK, '제주 물은 맑아. 오징어가 다 봐. 사람 그림자까지. 발소리 줄이고 던져. 한 마리.', "Jeju's water is clear. The squid see everything. Even your shadow. Step quietly and cast. One squid."),
      ], {
        end: endTalk({ accept: true, offer: 'accept' }),
        note: ['넷을 모으는 자리, 끝까지 함께하겠다고 했다. 짐 강 씨는 짐을 내려놓듯 숨을 내쉬며, 제주 물은 맑아 오징어가 그림자까지 다 보니 발소리를 줄이고 던지라고 했다.',
          "I said I'd see the gathering of the four through to the end. Jim let out a breath, as if setting down a load. Jeju's water is clear, he said — the squid see even your shadow — so step quietly."],
      }),
    },
  },

  // ═══════════════════════════════════════════
  // N07-4 — 끝내는 자리(유작 넷을 넘긴다)
  // ═══════════════════════════════════════════
  {
    id: 'n07_4_done', questId: 'N07-4', at: 'complete', npcId: JK, start: 'start',
    nodes: {
      start: scene([
        line(JK, '…넷.', '...Four.', { act: 'look_up' }),
        line(P, '다 모였네요.', "They're all together."),
        line(JK, '다 네 거야.', "They're all yours.", { act: 'nod' }),
        line(P, '네? 이걸 다요?', 'What? All of them?'),
        line(JK, '박제하려고 찾은 게 아니야. 던지려고 찾은 거야.', "I didn't find them to put them in a case. I found them to be cast."),
        line(JK, '동생도 그랬을 거야.', "My brother would have wanted the same."),
        line(P, '(서른 해를 찾은 것을, 한 번에 내게 넘겼다.)', "(What he spent thirty years finding, he handed to me all at once.)"),
      ], {
        choices: [
          opt('throw', '전부 던질게요. 박제하지 않을게요', "I'll cast every one. They won't go in a case", { next: 'throw' }),
          opt('one_back', '하나는 짐 강 씨가 가지세요', 'Keep one for yourself, Jim', { next: 'one_back' }),
          opt('pay', '네 번째 여비도 주세요', "I'll take the fourth round of travel money", {
            end: endTalk({ complete: 'pay',
              lineKo: '그래. 마지막 여비. 속초, 포항, 태안, 제주. 네가 다 따라왔어. 그 길값이야. 유작은 값을 매기면 안 되니까 따로 주는 거고. 섞지 마. 동생이 들으면 화낼 거야.',
              lineEn: "All right. The last of the travel money. Sokcho, Pohang, Taean, Jeju. You followed me all the way. This is for the road. The lures can't have a price on them, so they come separately. Don't mix the two. My brother would be angry if he heard." }),
            note: ['네 번째 여비를 받았다. 짐 강 씨는 속초, 포항, 태안, 제주 길값이라며, 유작은 값을 매기면 안 되니 따로 준다고 했다. 섞으면 동생이 화낼 거라고.',
              "I took the fourth round of travel money. Jim called it payment for the road — Sokcho, Pohang, Taean, Jeju. The lures were separate; you can't put a price on them. Mix the two and his brother would be angry."] }),
          opt('name_lures', '넷에 하나씩, 던졌던 바다 이름을 붙일게요', "I'll name each of the four after the sea where I cast it", { next: 'name_lures' }),
        ],
        note: ['제주에서 에기로 무늬오징어 한 마리를 올렸다. 이번에도 짐 강 씨는 던지지 않았다. 네 점이 모였고, 짐 강 씨는 그 넷을 전부 내게 넘겼다. 박제하려고 찾은 게 아니라 던지려고 찾은 거라고.',
          "In Jeju I landed a bigfin squid on the egi. Again Jim didn't cast. All four pieces were together — and he handed all four to me. He hadn't found them to put them in a case, he said, but to be cast."],
      }),
      throw: scene([
        line(JK, '그래. 그게 답이야.', "Good. That's the answer."),
        line(P, '(넷 다 동생의 이름이 새겨져 있다.)', "(All four are engraved with his brother's name.)"),
        line(JK, '박제된 루어는 아무것도 못 잡아. 동생은 그걸 제일 싫어했을 거야.', "A lure in a case catches nothing. My brother would have hated that most of all."),
        line(JK, '물에 들어가면 닳겠지. 그래도 돼. 닳으라고 만든 거니까.', "They'll wear down in the water. That's fine. They were made to wear down."),
      ], {
        end: endTalk({ complete: 'throw' }),
        note: ['전부 던지겠다고, 박제하지 않겠다고 했다. 넷 다 짐 강 씨 동생의 이름이 새겨져 있었다. 물에 들어가면 닳겠지만, 닳으라고 만든 거라고 했다.',
          "I promised to cast every one and never put them in a case. All four were engraved with his brother's name. They'd wear down in the water, Jim said — they were made to."],
      }),
      one_back: scene([
        line(JK, '…아니. 넷이어야 해. 그 사람은 넷을 만들었어.', "...No. It has to be four. He made four.", { act: 'shake_head' }),
        line(JK, '하나라도 내 서랍에 들어가면, 나는 그걸 꺼내 보면서 또 서른 해를 살 거야. 그러니 넷 다 가져가.', "If even one goes in my drawer, I'll spend another thirty years taking it out and looking at it. So take all four."),
        line(JK, '…마음은 받을게. 그건 여기 둔다.', "...But I'll take the thought. I'll keep that here."),
      ], {
        end: endTalk({ complete: 'one_back' }),
        note: ['하나는 짐 강 씨가 가지라고 했다. 짐 강 씨는 넷이어야 한다며, 하나라도 서랍에 들어가면 또 서른 해를 살 거라고 했다. 마음은 받겠다며 가슴께를 두드렸다.',
          "I asked Jim to keep one. He said it had to be four — even one in his drawer and he'd live another thirty years looking at it. He'd take the thought, he said, and tapped his chest."],
      }),
      name_lures: scene([
        line(JK, '…속초, 포항, 만리포, 제주.', "...Sokcho, Pohang, Manripo, Jeju."),
        line(P, '(짐 강 씨가 손가락으로 하나씩 짚었다. 목소리가 조금 흔들렸다.)', "(Jim touches each one with a finger. His voice shakes a little.)"),
        line(JK, '좋다. 그 물에서 다 돌았으니 그 이름이 맞아.', "Good. They all swam in those waters, so those names are right."),
        line(JK, '이제 네 거야. 부르면서 던져. 동생도 그 이름들이 마음에 들 거야.', "They're yours now. Call them by name as you cast. My brother would like those names."),
      ], {
        end: endTalk({ complete: 'name_lures' }),
        note: ['넷에 하나씩, 던졌던 바다 이름을 붙이겠다고 했다. 속초, 포항, 만리포, 제주. 짐 강 씨는 손가락으로 하나씩 짚으며, 동생도 그 이름들이 마음에 들 거라고 했다.',
          "I said I'd name each of the four after the sea I'd cast it in: Sokcho, Pohang, Manripo, Jeju. Jim touched each one and said his brother would like those names."],
      }),
    },
  },
];
