/**
 * @file StoryProgressAsk3.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) — 강두철 · 채수림 · 탁새벽 · 단철호 · 마감기 · 정우미 편.
 */
import { pa } from './StoryProgressAskKit.js';
import type { ProgressAskDef } from '../types/Story.js';

export const PROGRESS_ASKS_3: Record<string, ProgressAskDef[]> = {
  // ── 강두철 ──
  'M4-11': [
    pa(['배는 속초 부두에 댔나?', 'Have you brought the boat in to the Sokcho pier?'],
      ['…아직 부두에 대지 못했습니다.', "...I haven't made the pier yet."],
      ['서두를 것 없네. 날씨 보면서 동해안을 끼고 쭉 올라오게. 나하고 탁 씨는 부두에서 기다리고 있겠네.', "No rush. Keep an eye on the weather and follow the east coast up. Tak and I will be waiting at the pier."]), // 0 — 속초 부두까지
    pa(['우리 둘은 언제 태우고 나갈 텐가?', 'So when are you taking the two of us out?'],
      ['…아직 준비가 덜 됐습니다. 곧 모시겠습니다.', "...I'm not quite ready yet. I'll take you out soon."],
      ['천천히 하게. 늙은이 둘은 기다리는 데 익숙하네. 대신 값은 정가로 받는 거, 잊지 말고.', "Take your time. Two old men are used to waiting. Just don't forget: you charge us full price."]), // 1 — 두 노인을 태우고
  ],
  'N03-1': [
    pa(['이 엉킨 채비, 지금 좀 봐 줄 수 있겠나?', 'Could you take a look at this tangled rig now?'],
      ['…조금 이따가 봐 드리겠습니다.', "...I'll take a look in a little while."],
      ['그래, 기다리지. 원줄하고 목줄이 실뭉치가 돼 버려서, 나는 어디부터 손대야 할지 모르겠네.', "All right, I'll wait. The main line and leader have balled up together, and I can't tell where to even start."]), // 0 — 채비를 풀어 준다
    pa(['고기는 좀 올라왔나?', 'Anything biting yet?'],
      ['…아직 소식이 없습니다.', '...Nothing yet.'],
      ['나야 잘 모르지만, 물때가 바뀔 때 입질이 온다고들 하더군. 옆에 앉아 있을 테니 같이 기다려 보세.', "Not that I'd know, but they say the bite comes when the tide turns. I'll sit right here. Let's wait it out together."]), // 1 — 함께 1마리
  ],
  'N03-2': [
    pa(['교육장 앞바다에서 전갱이는 좀 올려 봤나?', 'Had any horse mackerel off the training center yet?'],
      ['…아직 다 채우지 못했습니다.', "...I haven't got enough yet."],
      ['전갱이는 떼로 다니네. 한 마리 물면 같은 자리, 같은 깊이에 바로 다시 넣어 보게. 이제 와서 모르는 척할 것도 없지.', "Horse mackerel run in schools. When one bites, drop straight back in at the same spot and depth. No point pretending I don't know that now."]), // 0 — 전갱이 2마리
    pa(['계속 가르쳐 줄 건지, 생각은 좀 해 봤나?', "Have you thought about whether you'll keep teaching me?"],
      ['…조금만 더 생각해 보겠습니다.', '...Let me think on it a little longer.'],
      ['그래, 천천히 하게. 속인 건 나니까, 기다리는 것도 내 몫이야.', "All right, take your time. I'm the one who lied, so the waiting is on me."]), // 1 — 교육장에서 재회
  ],
  'N03-3': [
    pa(['표결 전에 위판장에 물건은 좀 냈나?', 'Have you put any catch through the auction before the vote?'],
      ['…아직 세 건을 못 채웠습니다.', "...I haven't made three lots yet."],
      ['나는 손 안 대네. 다만 표결 전에 사람들이 보는 건 말이 아니라 위판 실적이야. 물 좋은 걸로 꾸준히 내게.', "I'm keeping my hands off. But before a vote, people look at your auction record, not your words. Keep sending in good, fresh fish."]), // 0 — 위판 3건
    pa(['표결 전에, 나하고 잠깐 얘기 좀 하겠나?', 'Before the vote, will you sit and talk with me a moment?'],
      ['…조금 이따가 찾아뵙겠습니다.', "...I'll come and see you in a little while."],
      ['그러게. 나는 어디 안 가. 표결 날까지는 가만히 있는 게 내 일이니까.', "Do that. I'm not going anywhere. Staying still until the vote is my whole job."]), // 1 — 표결 전 대화
  ],
  'N03-4': [
    pa(['2층 자재로 만들 건 다 만들었나?', 'Have you made everything from the second-floor materials?'],
      ['…아직 다 만들지 못했습니다.', "...I haven't finished them yet."],
      ['자재는 조합에서 넉넉히 보냈으니 아끼지 말고 쓰게. 서두르다 망치는 것보다 하나씩 제대로 만드는 게 낫지.', "The union sent plenty of materials, so don't skimp. Better to make them one at a time and properly than to rush and ruin them."]), // 0 — 자재로 3점
    pa(['은퇴하기 전에, 이 엉킨 채비 좀 풀어 주겠나?', "Before I retire, would you untangle this rig for me?"],
      ['…조금 있다가 풀어 드리겠습니다.', "...I'll untangle it for you in a bit."],
      ['그러게. 처음 만난 날 자네가 십 분 걸렸지. 그때처럼 천천히 해도 되네.', 'Do. The day we met, it took you ten minutes. Take it slow, same as then.']), // 1 — 은퇴 인사
  ],
  'N03-5': [
    pa(['자네가 묶은 채비로 고기는 좀 올렸나?', 'Caught anything on the rigs you tied?'],
      ['…아직 보여 드릴 만큼은 못 올렸습니다.', "...Not enough to show you yet."],
      ['매듭은 거짓말을 안 하네. 고기가 당길 때 안 풀리면 제대로 묶은 거야. 줄에 침 한 번 바르고 천천히 조이게.', "A knot doesn't lie. If it holds when the fish pulls, you tied it right. Wet the line first and cinch it down slowly."]), // 0 — 묶은 채비로 3마리
    pa(['스무 번, 다 묶어 봤나?', 'Have you tied all twenty?'],
      ['…아직 스무 번을 못 채웠습니다.', "...I haven't reached twenty yet."],
      ['급하게 하면 열 번째쯤에서 다 풀리네. 손이 기억할 때까지 하나씩 묶게. 세는 건 내가 해 주지.', "Rush it and they all come loose around the tenth. Tie them one by one until your hands remember. I'll do the counting."]), // 1 — 스무 번 묶어 보인다
  ],
  'N03-6': [
    pa(['울산 방어진에는 가 봤나?', 'Have you been to Bangeojin in Ulsan yet?'],
      ['…아직 방어진에는 못 갔습니다.', "...I haven't made it to Bangeojin yet."],
      ['울산은 머니까 길을 넉넉히 잡게. 나도 그쪽으로 가 있겠네. 서른 해 만에 보는 얼굴이라, 혼자 마주하기는 좀 그래서 말이야.', "Ulsan's a long way, so give yourself plenty of time. I'll head there too. Thirty years since I've seen that face. I'd rather not face it alone."]), // 0 — 울산 방어진으로
    pa(['고만석이는 만나 봤나?', 'Have you met Go Manseok yet?'],
      ['…아직 찾아뵙지 못했습니다.', "...I haven't gone to see him yet."],
      ['만나거든 나도 같이 앉혀 주게. 우리 둘은 한자리에 있어야 옛날 얘기가 나오는 사람들이야. 자네는 그냥 들어 주면 되네.', "When you do, sit me down with him. The two of us only get into the old days side by side. All you need to do is listen."]), // 1 — 고만석과 옛 이야기
  ],
  'N03-7': [
    pa(['자네 물건이 어디로 가는지, 위판 내면서 따라가 봤나?', 'Have you followed where your catch goes, putting lots through the auction?'],
      ['…아직 끝까지 따라가 보지 못했습니다.', "...I haven't followed it all the way yet."],
      ['위판장에 내고 나서가 시작이야. 누가 받아서 어디로 넘기는지, 한 건씩 끝까지 지켜보게.', "Handing it in at the auction is only the start. Watch each lot to the end: who takes it, and where they pass it on."]), // 0 — 위판 4건
    pa(['경로 하나, 이제 설명해 볼 텐가?', 'Ready to walk me through a route now?'],
      ['…조금 더 정리해서 말씀드리겠습니다.', '...Let me sort it out a little more first.'],
      ['그러게. 처음부터 하면 되네. 어디서 잡혔는지부터 어디서 팔리는지까지. 나는 뒤에서 듣기만 하지.', "Do that. Start from the beginning: from where it was caught to where it's sold. I'll just stand back and listen."]), // 1 — 유통 경로 설명
  ],

  // ── 채수림 ──
  'N23-1': [
    pa(['광어는 다 잡아서 계측했어요?', 'Have you caught and measured all the flounder?'],
      ['…아직 계측을 다 못 했습니다.', "...I haven't finished measuring yet."],
      ['잡으면 바로 길이랑 무게부터 재요. 지느러미 끝이 닳았거나 몸에 비해 살이 유난히 많으면 양식일 가능성이 커요.', "Measure length and weight as soon as you land one. Worn fin tips, or unusually heavy for its length, and it's probably farmed."]), // 0 — 광어 3마리 계측
    pa(['잡은 광어, 양식인지 같이 가려 볼까요?', 'Shall we sort out which of your flounder are farmed?'],
      ['…조금 이따가 가져와서 보여 드리겠습니다.', "...I'll bring them to show you in a little while."],
      ['네, 계측한 숫자랑 같이 가져와요. 숫자가 있어야 표에 적을 수 있거든요.', 'Sure. Bring the measurements with them. I need the numbers to fill in the table.']), // 1 — 양식 개체 가려내기
  ],
  'N23-2': [
    pa(['소문에 나온 그 자리, 가서 서 봤어요?', 'Have you gone and stood at the spot from the rumour?'],
      ['…아직 그 자리까지는 못 가 봤습니다.', "...I haven't gotten to that spot yet."],
      ['소문은 결국 자리랑 물때 얘기예요. 누가 어디서, 물이 어떨 때 봤는지부터 정리해 보면 서야 할 데가 나와요.', "Rumours always come down to place and tide. Sort out who saw it, where, and on what water, and you'll know where to stand."]), // 0 — 소문이 가리키는 자리
    pa(['그 물때에 맞춰서 한 마리 건졌어요?', 'Did you land one on that tide?'],
      ['…아직 물때를 못 맞췄습니다.', "...I haven't caught the right tide yet."],
      ['자리만 맞으면 안 돼요, 물때까지 맞아야 해요. 무엇이 올라오든 그 조건에서 건진 거면 기록할 가치가 있어요.', "The right spot isn't enough. The tide has to match too. Whatever comes up, if you landed it under those conditions, it's worth logging."]), // 1 — 그 물때에 1마리
    pa(['건진 개체, 지금 기록할까요?', 'Shall we log your specimen now?'],
      ['…조금 이따가 가져오겠습니다.', "...I'll bring it by in a little while."],
      ['네. 자리랑 물때도 같이 적어야 하니까 잊어버리기 전에 와요. 기록이 돼야 소문이 아니게 돼요.', "Okay. We need the spot and the tide too, so come before you forget. It stops being a rumour once it's on record."]), // 2 — 개체 기록
  ],
  'N23-3': [
    pa(['특급 회는 떠 왔어요?', 'Did you bring me top-grade sashimi?'],
      ['…아직 내놓을 만한 접시를 못 만들었습니다.', "...I haven't made a plate worth serving yet."],
      ['직접 마련한 활어로 하세요. 시메하고, 피 빼고, 결을 따라 뜨는 것까지 하나도 건너뛰면 안 돼요. 상급으로는 증명이 안 돼요.', "Use a live fish you got yourself. Spike it, bleed it, slice along the grain. Don't skip a step. Second grade doesn't prove anything."]), // 0 — 회를 떠서 낸다
    pa(['뜬 회, 지금 등급 확인해 볼까요?', 'Shall we check the grade on your sashimi now?'],
      ['…접시를 다듬어서 다시 오겠습니다.', "...I'll tidy up the plate and come back."],
      ['네. 썰어 두고 오래 두면 결이 죽으니까, 뜨면 바로 가져와요.', 'Sure. Sliced fish loses its texture if it sits, so bring it straight over once you cut it.']), // 1 — 등급 확인
  ],
  'N23-4': [
    pa(['금어기 개체, 다섯 번 다 재고 돌려보냈어요?', 'Have you measured and released all five protected fish?'],
      ['…아직 다섯 번을 못 채웠습니다.', "...I haven't made it to five yet."],
      ['꼭 자로 재고 돌려보내요. 눈대중은 기록이 안 돼요. 오래 들고 있으면 개체가 약해지니까 재는 건 빨리 하고요.', "Always measure with a rule before you let them go. Eyeballing doesn't count as a record. And be quick about it; holding them too long weakens them."]), // 0 — 계측 후 방생 5회
  ],
  'N23-5': [
    pa(['조사표에 올릴 어획, 다 모았어요?', 'Have you gathered all the catches for the survey sheet?'],
      ['…아직 다 모으지 못했습니다.', "...I haven't gathered them all yet."],
      ['같은 종만 여러 번 올리면 조사표가 비어 보여요. 잡을 때마다 무슨 종인지 확인하고 적어 두세요.', 'Log the same species over and over and the sheet looks empty. Check what each one is as you catch it, and write it down.']), // 0 — 어획 5건
    pa(['도감은 40종까지 채웠어요?', 'Have you filled the codex to forty species?'],
      ['…아직 40종이 안 됩니다.', "...It's not at forty yet."],
      ['늘 잡던 데서만 잡으면 보던 종만 올라와요. 자리나 물때, 미끼를 바꿔서 못 본 종을 찾아보세요. 인천 앞바다는 종이 많아요.', "Fish the same old place and you get the same old species. Change the spot, the tide or the bait and look for ones you haven't seen. Incheon's waters hold a lot."]), // 1 — 도감 40종
    pa(['조사표, 지금 넘겨줄래요?', 'Want to hand in the survey sheet now?'],
      ['…조금만 더 채워서 드리겠습니다.', "...I'll fill it in a bit more before I hand it over."],
      ['네, 서두르지 않아도 돼요. 몇 마리가 아니라 몇 종인지가 남는 거니까, 빠진 칸 없이 적어서 가져와요.', "Sure, no hurry. What stays on record is how many species, not how many fish. Bring it with every entry filled in."]), // 2 — 조사표를 넘긴다
  ],
  'N23-6': [
    pa(['기록에 남길 회 한 접시, 떴어요?', 'Have you sliced the plate of sashimi for the record?'],
      ['…아직 뜨지 못했습니다.', "...I haven't sliced it yet."],
      ['이번엔 조사가 아니에요. 계측하고 놓아주는 게 아니라, 직접 마련한 걸로 먹을 한 접시를 뜨세요.', 'This time it isn\'t a survey. Not measure-and-release: slice a plate to actually eat, from something you got yourself.']), // 0 — 한 접시를 뜬다
    pa(['기록에 남길 요리 한 접시는 만들었어요?', 'Have you cooked the dish for the record?'],
      ['…아직 만들지 못했습니다.', "...I haven't made it yet."],
      ['거창하지 않아도 돼요. 직접 마련한 재료로, 당신이 먹고 싶은 걸 만들면 그게 기록이에요.', "It doesn't have to be fancy. Make what you want to eat, with ingredients you got yourself. That's the record."]), // 1 — 한 접시를 만든다
    pa(['조사표 마지막 장, 지금 받을래요?', 'Do you want the last page of the survey now?'],
      ['…조금 이따가 받으러 오겠습니다.', "...I'll come back for it in a little while."],
      ['그래요. 마지막 장은 비워 둘게요. 당신이 본 걸 적을 자리니까 서두를 것 없어요.', "All right. I'll leave the last page blank. It's where you'll write what you saw, so there's no rush."]), // 2 — 마지막 장을 받는다
  ],

  // ── 탁새벽 ──
  'M4-08': [
    pa(['파도 속 농어, 올렸어?', 'Got the sea bass out of the surf yet?'],
      ['…아직 못 올렸다.', '...Not yet.'],
      ['밤에 파도 하얗게 부서지는 데 있잖아. 그 안쪽 말고 딱 그 자리에 넣어. 농어는 거기서 먹이 기다려.', "At night, where the waves break white. Not inside it, right on that line. That's where the sea bass wait for food."]), // 0 — 포말대 야간 농어
  ],
  'M7-07': [
    pa(['독도에서 그 대로 한 마리 올렸어?', 'Did you land one at Dokdo with that rod?'],
      ['…아직, 그 대로는 못 올렸다.', "...Not with that rod, not yet."],
      ['독도 조사 해역 열렸잖아. 거기 가서 던져. 할아버지가 손 놓고 내가 마무리한 대니까 안 부러져.', "The Dokdo survey waters are open. Go cast there. Grandpa let go and I finished it, so it won't break."]), // 0 — 유품 릴대로 독도에서
  ],
  'N02-3': [
    pa(['돌무덤의 주인, 잡았어?', 'Did you catch the Lord of the Rock Pile?'],
      ['…아직 그놈은 못 만났다.', "...Haven't met that one yet."],
      ['바닥으로 박힐 때 드랙 조여. 거기서 풀어 주면 돌에 감겨. 내 대 안 부러지니까 걱정하지 말고.', "When it dives for the bottom, tighten the drag. Give it line there and it wraps the rocks. My rod won't break, so don't worry."]), // 0 — 대구 80cm+
  ],
  'N02-4': [
    pa(['나랑 같이 대 손보는 거, 다 했어?', 'Did we finish working on the rod together?'],
      ['…아직 다 못 했다.', '...Not all of it yet.'],
      ['이음새는 한 번에 안 없어져. 한 번 손보고 나서 한 번 더 봐야 해. 대충 하면 독도에서 부러져.', "The joint won't disappear in one go. Work it once, then go over it again. Do it sloppy and it snaps at Dokdo."]), // 0 — 대를 손본다 2회
    pa(['이 대, 이제 받을래?', 'Will you take the rod now?'],
      ['…조금 있다가 받으러 오겠다.', "...I'll come back for it in a bit."],
      ['응, 여기 둘게. 이음새 안 보이지. 독도에서 던질 대니까 꼭 받아 가.', "Okay, I'll keep it here. You can't see the joint, right. It's the rod you'll cast at Dokdo, so make sure you take it."]), // 1 — 되살린 릴대를 받는다
  ],
  'N02-6': [
    pa(['속초 공방엔 들렀어?', 'Have you been back to the Sokcho workshop?'],
      ['…아직 공방엔 못 들렀다.', "...Haven't made it to the workshop yet."],
      ['밤 되기 전에만 가 있으면 돼. 내 대로 밤에 한 마리 낚는 거니까.', 'Just get there before dark. The fish has to come up on my rod, at night.']), // 0 — 속초 공방으로
    pa(['내 대로 한 마리 낚았어?', 'Did you catch one with my rod?'],
      ['…아직 못 낚았다.', "...Not yet."],
      ['얇아도 대야. 초릿대가 살아 있어서 작은 입질도 다 보여. 밤에 끝을 잘 봐.', "Thin is still a rod. The tip's alive, so it shows even the small bites. Keep your eyes on it at night."]), // 1 — 새벽의 대로 1마리
  ],

  // ── 단철호 ──
  'M6-04': [
    pa(['연안부두 우럭, 30 넘는 놈 올렸어요?', 'Landed a rockfish over thirty at the pier yet?'],
      ['…아직 30을 넘는 놈은 못 만났습니다.', "...Haven't met one over thirty yet."],
      ['우럭은 밤에 부두 안쪽, 바닥 가까이 붙어 있어요. 멀리 던지지 말고 발밑부터 천천히 훑어 봐요.', "At night, rockfish hug the bottom on the inside of the pier. Don't cast far. Work slowly from right under your feet."]), // 0 — 가을 밤 우럭 30cm+
  ],
  'N17-1': [
    pa(['20분 안에 한 마리, 올렸어요?', 'Get one in under twenty minutes?'],
      ['…아직 20분 안에는 못 올렸습니다.', "...Not inside twenty minutes yet."],
      ['20분 넘기면 그날은 접어요. 내일 또 하면 되니까. 채비는 미리 묶어 두고, 가까운 데서 바로 시작하는 게 요령이에요.', "Go past twenty and you call it a day. There's always tomorrow. The trick is to tie your rig in advance and start close by, right away."]), // 0 — 20분 안에 1마리
    pa(['잡은 거, 식당에 갖다줬어요?', 'Did you take the fish to the restaurant?'],
      ['…조금 이따가 갖다 드리겠습니다.', "...I'll take it over in a little while."],
      ['팔면 안 돼요. 그냥 주는 거예요. 돈이 오가면 그건 습관이 아니라 장사니까요.', "Don't sell it. You just give it. Once money changes hands, it's not a habit anymore, it's business."]), // 1 — 식당에 무상 전달
  ],
  'N17-3': [
    pa(['30분 안에 세 마리, 됐어요?', 'Three fish in thirty minutes, done?'],
      ['…아직 30분 안에 다 채우지 못했습니다.', "...Haven't managed it inside thirty yet."],
      ['채비 나눠 주는 시간도 30분 안에 들어가요. 팀원 반은 대를 처음 잡으니까, 미리 묶어 두면 시간이 남아요.', "Handing out rigs counts inside the thirty. Half the team has never held a rod, so tie them ahead and you'll have time to spare."]), // 0 — 30분 안에 3마리
  ],

  // ── 마감기 ──
  'M4-09': [
    pa(['갑오징어는 올라왔어요?', 'Any cuttlefish come up yet?'],
      ['…아직 먹물 구경도 못 했습니다.', "...Haven't even seen a drop of ink yet."],
      ['에기를 바닥까지 내리고 두 번 튕긴 다음 기다려요. 세 번은 많아요. 저는 그동안 콘티 그리고 있을게요.', "Drop the egi to the bottom, twitch it twice, then wait. Three is too many. I'll be drawing my storyboards meanwhile."]), // 0 — 가을 주간 에깅 갑오징어
  ],
  'N13-1': [
    pa(['갑오징어 두 마리, 다 올렸어요?', 'Got both cuttlefish up?'],
      ['…아직 두 마리를 못 채웠습니다.', "...I haven't got two yet."],
      ['저는 계속 그리고 있을게요. 끌어올릴 때 먹물을 쏘니까 얼굴은 살짝 돌리고요. 어차피 콘티 끝날 때까지는 안 내려요.', "I'll keep drawing. They squirt ink when you haul them up, so turn your face a little. I'm not getting off till the storyboards are done anyway."]), // 0 — 갑오징어 2마리
  ],

  // ── 정우미 ──
  'N12-2': [
    pa(['갈치 두 마리, 올라왔어요?', 'Have the two hairtail come up?'],
      ['…아직 두 마리가 안 됩니다.', "...Not two yet."],
      ['갈치는 밤이 깊을수록 위로 올라와요. 커플은 신경 쓰지 말고 낚시만 해요. 따뜻한 건 제가 챙길게요.', "Hairtail rise higher the deeper the night gets. Don't mind the couple, just fish. I'll take care of keeping things warm."]), // 0 — 갈치 2마리 (야간)
  ],
};
