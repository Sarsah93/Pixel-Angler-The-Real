/**
 * @file StoryNarrativeEn.ts
 * @description 퀘스트 나레이션 영문판 186편 (151차 — 백로그 O1 해소)
 *
 * 왜 따로 두나
 *  - 141차가 나레이션 186편을 쓰면서 "영문은 후속"으로 미뤄 두었다. 한 파일에 ko/en을 섞으면
 *    한국어 원고를 손볼 때마다 영문이 끼어들어 읽기 어려워진다 — 그래서 **같은 키를 쓰는 짝 파일**로 둔다.
 *  - `narrativeOf()`가 두 파일을 합쳐 `introEn`·`offerEn`… 으로 얹고, 클라이언트 i18n 사전이
 *    `allNarrativeLines()`로 ko→en 쌍을 받아 간다(원문이 곧 키 — 호출부는 한 줄도 안 바뀐다).
 *
 * 번역 규칙 (한국어판 §쓰는 규칙과 짝)
 *  - `intro` = 1인칭 현재형. 정의문으로 요약하지 않는다. 한국어가 감각으로 쓴 자리는 영문도 감각으로 쓴다.
 *  - `offer`/`progress`/`done` = NPC의 **말**만(따옴표 없음). 화자의 말투(할머니의 퉁명, 노인의 느린 말)를 살린다.
 *  - 고유명사는 로마자 표기(Sokcho, Yeonggeumjeong, Do Hyeonsu)로 두고, 직함·계 이름은 뜻으로 옮긴다.
 *  - 선택지(`complete`/`offerChoices`) 영문은 **아직 없다** — 그쪽은 `labelEn = labelKo` 폴백(미수록 규칙)이 유지된다.
 */

export interface NarrativeEnEntry {
  intro: string;
  offer?: string;
  progress?: string;
  done?: string;
  objectives?: string[];
  epilogue?: string;
}

interface EnLines { offer?: string; progress?: string; done?: string; obj?: string[]; epi?: string }
const E = (intro: string, l: EnLines = {}): NarrativeEnEntry =>
  ({ intro, offer: l.offer, progress: l.progress, done: l.done, objectives: l.obj, epilogue: l.epi });

export const STORY_NARRATIVE_EN: Record<string, NarrativeEnEntry> = {
  // ═══════════════════════════════════════════
  // Part I "The Trainee" — Ch1 Sokcho
  // ═══════════════════════════════════════════
  'M1-01': E(
    "I locked the mountain house and dropped the key in the mailbox. I didn't look back, because looking back would have taken me inside again. There is one last bus and it goes to Sokcho. One backpack, one of my father's reel rods, and that is everything I own. I get off at the end of the line and smell the sea. Twenty-two years old, standing alone in front of it for the first time. Two words penciled on the back of the family photo: Yeonggeumjeong. That is where I will start.",
    { obj: ["Walk to Yeonggeumjeong, the place written on the back of the photo"],
      epi: "I am standing in front of the same rock as the photo. I remember visiting a fish market with my parents — somewhere near the breakwater I can see from here. Should I walk toward Dongmyeonghang?" }),
  'M1-02': E(
    "I followed the breakwater toward Dongmyeonghang. The old woman at the stall kept watching me. This was the place. It has changed, but the memories are coming back — enough to make my eyes sting. What should I do? Maybe I should ask her for advice.",
    { offer: "You came looking for the memory in that photo. Cry if you need to. But could you carry one ice box from behind the stall to the auction hall? Start with something you can do.",
      progress: "There are still boxes left. Come back when they're all moved.",
      done: "Your wages. At least this much is your own money. The shop inside the market sells ice and bait. Prices move every day, so learn them with your eyes.",
      obj: ["Check Ok-seon's errand ice crate in the inventory", "Carry the ice crate to the marked place near the auction hall", "Place the ice crate at the marked location", "Report the ice crate delivery to Ok-seon"],
      epi: "The envelope was thin. Still, it is the first money with my name on it." }),
  'M1-03': E(
    "They said there was an old fishery cooperative dormitory behind the stall. When I opened the door, dust and mildew came out first. One bed, one refrigerator, one window. The old woman held out a trainee card. Nobody here becomes a member on their first day, she said. One hundred and eighty days. The moment I took that number I understood I no longer had a place to go back to, I had a place to stay.",
    { offer: "Key to the room behind the stall. You beat the dust out yourself. This is a trainee card, and our cooperative takes six months. Other places take three years. Learn the work first.",
      progress: "Have you actually slept in the room yet? A day only ends if you sleep in a bed.",
      done: "One hundred and eighty days from today. Write it on a calendar. And here, a tackle pouch an old member left behind. Seemed a waste to throw out. You use it.",
      obj: ["Open the door of the dormitory behind the stall", "Lie down on the bed and get through the first night"],
      epi: "Trainee. It isn't a name, but now there is a word people can call me by." }),
  'M1-04': E(
    "I was unfolding my rod on the breakwater when somebody clicked their tongue behind me. My age. Do Hyeonsu. I found out later he is the cooperative chief's grandson. He looked at my father's reel rod and said it was too good to waste here. Buy a ten-thousand-won rod at Saiso and drop your rig into the tetrapod gaps, he said. I want to ignore him, but the shadow between the blocks is real. A cheap rod is fine. Today I want to see one fish.",
    { offer: "That rod's too good, don't use it here. Go to Saiso and buy a cheap one. Hole fishing is for rods you won't miss when they snap.",
      progress: "Still empty-handed. Look right under the gap. You don't need to cast far.",
      done: "...well, you caught it. Don't throw away the Saiso receipt. Fishing starts with counting what your gear costs.",
      obj: ["Buy a cheap reel rod at Saiso", "Bring up one fish from a tetrapod gap"] }),
  'M1-05': E(
    "I unfold my father's reel rod for the first time. Twelve guide rings, one of them slightly bent. Do Hyeonsu nags me from behind under the pretext of fixing my casting stance. The float stands, sinks, and the tip trembles. My wrist moved before I did. The weight of the first hookset travels up my arm. Today I think I am learning, for the first time, whose hand this rod remembers.",
    { offer: "Unfold it. Learn casting again from the start. Watch the float go under, count three, then strike.",
      progress: "Two fish. One is luck, two is skill.",
      done: "...the rod fits your hand. I'll give you that. Loosen the drag a bit. It's your father's rod, isn't it? Crank it down like that and it snaps.",
      obj: ["Cast with your father's reel rod and land two fish"],
      epi: "The scratches left on the grip line up with the lines of my palm. This rod is mine to hold now." }),
  'M1-06': E(
    "A juvenile black seabream came up. I was about to put a fish barely two knuckles long into the cooler when the old woman caught me at it. I heard five laws right there on the spot. What you catch, you eat. What you take with a rod you may never sell, even as a member. The small ones go back. My hand feels clumsy lowering a small fish into the water. Still, I think the line about the sea surviving because someone keeps these rules will stay with me a long time.",
    { offer: "Put that down. What you catch, you eat. That's the law. Even as a member you can't sell what a rod caught. Sit. Hear all five before you go.",
      progress: "Did you release even one small one? Measure it with a ruler and let it go. Eyeballing it isn't the law.",
      done: "That's the beginning. That's what you learn before you learn to catch. Write it in your log. Minimum sizes, closed seasons. Ask if you don't know. Pretending to know is the dangerous part.",
      obj: ["Measure with a ruler and return undersized or closed-season fish to the sea", "Hear all five laws through from Jeong Okseon"] }),
  'M1-07': E(
    "It looks like I will eat a proper meal for the first time in two years. The old woman gave me the board and started with how to hold the knife. Spiking, bleeding, scaling, the head, and then the order for a three-piece fillet. The flesh is slippery and the knife is heavy. My first sashimi came out in uneven thicknesses. Still, it is a fish I caught and dressed myself. I know I will repeat this order until my body remembers it.",
    { offer: "If you caught it, dress it, and then it's your fish. Sit at the board. Start with the spike, in order. Rush it and you cut your hand.",
      progress: "Take it all the way to sashimi. Thickness comes later; following the grain comes first.",
      done: "Edible enough. This knife is the one I used. See if it fits your hand. Freshness is a clock. Save on cooler ice and you get feed, not sashimi.",
      obj: ["Dress one whole fish", "Slice the dressed loin into sashimi"],
      epi: "One plate. The slices are uneven, but tonight I set my own table." }),
  'M1-08': E(
    "I knocked on the door of the bamboo workshop. Old Tak looked at my luggage first. One backpack with a rod, a cooler and a bait tub dangling off it. Do something about that load, he said, and that was the first lesson. I take a plan and make something with my own hands for the first time. A rough backpack. The straps are short and the stitching runs crooked. But on my back it frees both hands. With both hands free I can do more of anything.",
    { offer: "Do something about that load first. Like that you'll drop half of it off the breakwater. I'll give you a plan, open the crafting tab. Make one by hand and you'll know what's worth buying.",
      progress: "If you made it, wear it. Making something and not using it is the stupidest thing there is.",
      done: "...crooked. But it looks all right on your back. Next time you cut the wood. Hands are taught by hands.",
      obj: ["Make one item from a plan in the crafting tab", "Make the rough backpack and wear it"] }),
  'M1-09': E(
    "I read a tide table with my own hands for the first time. Low water at two in the morning. I switch on one headlamp and climb down to the rocks. My footing slips and the wind freezes my fingertips. The old woman told me twice never to cross into the village fishery grounds. Something moves inside the lamplight. One, then two. My hands are not shaking only from the cold. I think I am starting to understand what people mean when they say the night sea is more honest than the day.",
    { offer: "Can you read a tide table? Low water is before dawn today. Take a lamp, and don't cross inside the ground markers. Cross that and it isn't me who catches you, it's the law.",
      progress: "Still short of two? Don't just watch your feet, watch where the water pulled back from.",
      done: "Coming home alive is half of it. Cold hands, eh. This lamp is what the cooperative gives its trainees. Brighter than yours.",
      obj: ["Climb down to the rocks at low water and gather two specimens"] }),
  'M1-10': E(
    "It is the cooperative's communal work day. Nobody calls me by my name. Trainee, hey, trainee. I helped haul nets, sorted seaweed, and in the leftover time I fixed an abandoned bicycle. When I push the pedals the harbour gets a hand's width closer. In the evening I open the skill window and spend my first point. Even without a name, the things I can do keep adding up one at a time. That is enough for today.",
    { offer: "Trainee. Communal work starts now. Net hauling first. When it's done, fix that bicycle behind the shed and ride it. The harbour's too wide on foot.",
      progress: "Is the work finished? And the bicycle, did you ride it? Ride it first, then talk.",
      done: "Good work, trainee. Your wages. You know how to spend a skill point? The first one can be anything. It'll tell you what you want to do out there.",
      obj: ["Take part in a full day of cooperative communal work", "Get on the repaired bicycle and push the pedals"] }),
  'M1-11': E(
    "D-11. I walk into the assembly hall with four documents. The reported-fishery registration, the candidate member recommendation, the trainee log, and a guarantee stamped with Jeong Okseon's seal. Do Hyeonsu is sitting in the back row. The chief reads my name. A name nobody called for one hundred and eighty days fills the meeting room through a microphone. I could not count how many hands went up. I only know that I am a person of this harbour now.",
    { offer: "The assembly is in three days. Four documents, your level, and what you did for a hundred and eighty days. Stand up with that. Your name gets called that day.",
      progress: "You don't meet the conditions yet. Get your level up and come back.",
      done: "Approved as a member. From today the Busan consignment floor is your place too. Your name got called. Don't forget, anything done under that name is the cooperative's work.",
      obj: ["Build yourself up to level 18", "Stand at the cooperative assembly and hear your name called"],
      epi: "When I came out of the hall the old woman from the stall was standing there. She pointed at the ice boxes without a word. I carry them again today. Under my own name now." }),
  'N01-1': E(
    "A man with a cart hitched to his bicycle is standing in front of the stall. When I asked his name he only said Baram. He noticed before anyone else that the old woman was fretting because she could not get a marbled flounder for her grandson's birthday table. He teaches me how to throw a surf rig and how to measure a fish. Land one flounder, leave it at the stall, and he will hand over a cart plan. I have decided not to ask why he does this.",
    { offer: "That old lady wants a flounder for her grandson's birthday table. Can you throw a surf rig? Bring one back and I'll give you a cart plan.",
      progress: "Flounder sit on the bottom. Throw the rig far and wait.",
      done: "There we go. Did you see her face? That's enough. Here's the plan. A cart isn't luggage, it's legs." }),
  'N02-1': E(
    "I brought my father's reel rod to the bamboo workshop. Old Tak handled it for a long while and said nothing. Instead his twelve-year-old grandson Saebyeok challenged me to a halfbeak contest. While his grandfather looks at the rod, whoever lands a halfbeak first on the breakwater wins. If the boy wins, he says his grandfather won't tell me the story of my rod. I do not want to lose to a twelve-year-old. Strangely, I am taking this seriously.",
    { offer: "Leave that rod here. I'll look at it. Meanwhile go catch halfbeak with Saebyeok. The boy likes a wager.",
      progress: "Saebyeok landed his first, I hear. Try again.",
      done: "The rod is alive. One joint is crying, but it can still cast. If Saebyeok beat you, listen to him. His eyes are better than mine." }),
  'N02-5': E(
    "Three bamboo culms stand against the workshop wall. Old Tak tells me to pick the usable one and puts his hands behind his back. One thick, one beautifully coloured, and one plain. I handle them for a long time. The nodes. Under my hand only one of them has its nodes evenly spaced. I picked the plain one. The old man did not even smile. Still, I was glad that when he asked why, I had an answer.",
    { offer: "Three culms on the wall. Pick the usable one. And tell me why.",
      progress: "Picked one? Pick it by feel. You don't pick it by looking.",
      done: "...you looked at the nodes. Not thickness, not colour, the nodes. Even nodes carry force evenly. It took me fifty years and you saw it in a day." }),
  'N03-1': E(
    "An old man with a tangled rig is sitting at the end of the breakwater. His main line and leader have become a ball of thread. He said his name was Kang Ducheol. He is embarrassed, says fishing is new to him. It took ten minutes to work it loose. I sat beside him and we watched his first bite together. For a second I thought the way he struck did not look like a beginner's hand, but I let it go. It does not feel bad, teaching someone.",
    { offer: "This knot keeps coming undone. Young man, do you know rigs? I'd be grateful if you sat with me.",
      progress: "Nothing yet. Is this waiting really what fishing is?",
      done: "It's up, it's up! I'll be calling you teacher. This old man learned one thing today." }),
  'N03-5': E(
    "Old Kang Ducheol bought twenty swivels. Tie them until your hands remember, he says. A beginner teaching a beginner, except the eyes of the old man counting out twenty are strange somehow. From the tenth my fingers moved on their own. By the twentieth the line does not slip. My fingers understood before I did what people mean when they say the one teaching learns more.",
    { offer: "Twenty swivels here. Tie them until your hands remember. I'll count for you. One, two.",
      progress: "That's not twenty yet. Rush it and they all come undone at the tenth.",
      done: "Twenty. That's it. You could tie it with your eyes shut now. That knot will save your rig a few times." }),
  'N04-1': E(
    "Bae Nuri, captain of the Cheongcho High breakwater club, came over shaking a sabiki rig. Catch it and eat it, that's the motto, she says. We landed two halfbeaks together and grilled them right there on the breakwater. Sitting inside the laughter of seventeen-year-olds, I forget for a moment that I am twenty-two. She tells me to join. A high school club, at twenty-two. Still, tonight was warm.",
    { offer: "Oh, are you alone? We're the breakwater club, we catch halfbeak and grill it. Catch it and eat it! That's the motto. Want to join?",
      progress: "Two! Two of them! You have to shake the sabiki gently.",
      done: "Good, right? Catching and eating is the best. So, about joining?" }),
  'N04-2': E(
    "A sign at the festival booth reads Catching People. Bae Nuri's real target is a loner named Mo Jinju. They say Jinju lands sandfish alone on the breakwater before dawn, surf rig. I follow her to that spot and cast into a winter dawn. Jinju says nothing and fishes precisely. Today I learn that catching a person is harder than catching a fish.",
    { offer: "The Catching People booth! The real target is Mo Jinju. She catches sandfish alone at dawn. Come with me and talk her into it.",
      progress: "Did you find Jinju? End of the breakwater, before dawn. She runs if you speak to her, so just fish beside her.",
      done: "Jinju says she'll join! How did you do it? You just fished? And that worked..." }),
  'N04-3': E(
    "They say the breakwater club may be shut down. Three members. Bae Nuri talks Ha Sua out of putting up flyers and insists that showing people the catch is enough. I land two in front of a student who came to watch. I put the rod in the kid's hand and the hand shakes. It is my hand on the day I first held a rod. Nuri was right that the hand beats a flyer.",
    { offer: "The club might get dissolved. Flyers? No. Just show them a catch. Put the rod in the hand of whoever comes to watch.",
      progress: "You need two before they'll watch. One is luck, somebody said.",
      done: "One person joined! The kid you handed the rod to. As club captain, thank you!" }),
  'N18-1': E(
    "Do Hyeonsu recognised my reel rod. Where did you get that. His voice is low. Instead of answering I told him to hook one each from the same spot. We cast side by side. His casting has nothing wasted in it; mine still has my shoulder in it. I tried to think it did not matter who landed one first, but it mattered. The first quarrel and the first comparison. I think I will be measuring myself against this person for a long time.",
    { offer: "That rod. Where did you get it. ...never mind. Let's just hook one each from the same spot. Then I'll know.",
      progress: "Not yet? One fish, from the spot beside me. Other spots don't count.",
      done: "...I saw it. The rod is real. Take your shoulder out of it. That rod isn't thrown with strength." }),
  'N19-1': E(
    "Old Tak has carved a bamboo ice rest. Set it under the stall's ice box and the water drains so the ice lasts. But he cannot deliver it. Leave it on your way past, he says, and don't tell her it was me. Jeong Okseon looked at the rest and said nothing for a long while. She ran her hand over the nodes, then set the ice box on top of it. I do not know what passed between these two old people. Better that the errand boy does not.",
    { offer: "Take this to Manbok Store on your way past. It's a rest for the ice box. Don't tell her it came from me.",
      progress: "Did you leave it? What did she say.",
      done: "...she did? I see. (The hand carving the rod stops.) I may ask you again. Sorry to keep bothering you." }),
  'N21-1': E(
    "Starfish are scattered under the breakwater. Oh Sechan, a marine environment monitor, asks me to tell two species apart. The bat star with short broad arms, and the northern seastar with long arms curled up at the tips. I pick up three and lay them on my palm. They feel different. The monitor writes down numbers. How many, and where. I am seeing for the first time that the sea has counting work in it, not only catching.",
    { offer: "Could you pick up some starfish? Two species. Short and broad arms is the bat star, long with upturned tips is the northern seastar. Sort them.",
      progress: "Three. Feel them with your hand and they're different. Hands before eyes.",
      done: "Right, that's a northern one. Well sorted. I'll put it in the record. Who picked them up, too." }),

  // ── Ch2 Busan ──
  'M2-01': E(
    "The Busan consignment floor is about twenty times the size of the Sokcho stall. I stand at the registration counter with the chief's letter of introduction. I pack the trap catch into regulation boxes and lay ice over it. My name goes on the side of the box. A grader glances once and moves on. The law that rod-caught fish may not be sold becomes real here for the first time. Only what the traps took, to regulation, under my name.",
    { offer: "First thing in Busan, register at the consignment floor. Trap catch only. Keep to the box regulation. Don't even touch what a rod caught.",
      progress: "Did you lift the traps? The box regulation comes first. Not size, regulation.",
      done: "Your first box sold, I hear. If you learned to read faces on that floor you've got nerve enough for an auction. Here's the box money. And regulation boxes, you can buy them now.",
      obj: ["Lift a trap once and secure the catch", "Pack trap catch into a regulation box and put it up for consignment"] }),
  'M2-02': E(
    "I went light on ice. One box failed to sell. The grader drew an X beside the freshness label without a word. I opened the cooler and half the ice had melted into water. The box I lost is worth ten times the ice I saved. The chief only told me to go back over it. My body learns that ice is not a cost, it is part of the price of the box.",
    { offer: "Failed to sell, did it. Open the cooler. See how much ice is left. That's what going back over it means.",
      progress: "Haven't gone over it yet? Start by telling me why the ice melted.",
      done: "Save on ice and you lose the box. Now you know. Learn it once and you don't do it twice.",
      obj: ["Pack the ice properly again and get three lots sold", "Review your cooler ice handling and tell the chief why the box failed to sell"] }),
  'M2-03': E(
    "The winter wind at Gamcheon blows differently from Sokcho. Snags are constant. I lost two rigs and barely recovered the third. Do Hyeonsu says beside me that a black seabream has to clear forty centimetres to count. The float sinks slowly and my wrist goes heavy. What came up was forty-two. In front of the measuring board, Do Hyeonsu said nothing for the first time.",
    { offer: "Gamcheon is nothing but snags. Learn how to lose a rig first. Land a black seabream over forty and I'll give it to you.",
      progress: "Still under forty? Winter seabream sit deep. Give the float more depth.",
      done: "...forty-two. All right. This rod is tuned for the Gamcheon wind. If you'd rather not snap yours, use it.",
      obj: ["Land a black seabream of 40cm or more at Gamcheon in winter"] }),
  'M2-04': E(
    "Na Gibeom's sashimi restaurant has no customers and only the tank running. I agreed to bring trap catch three times. He said he was buying consistency, not the price. The first time was awkward, the second familiar, and on the third he set out a chair in front of the tank. There is no contract. Trust is written in counts, not on paper.",
    { offer: "Trap catch. Bring it three times. Price comes later. I want to see if you're consistent.",
      progress: "That's not three yet. Miss once and it starts over.",
      done: "Three. That chair by the tank, sit in it. You're a regular now. We'll set the rate later.",
      obj: ["Haul the traps three times to build a supply", "Butcher three before handing them over"] }),
  'M2-05': E(
    "The seafood quality control course. Do Hyeonsu is in the next seat. Hygiene, traceability labels, the cold chain. When the instructor started on lure fishing, Do Hyeonsu opened his notebook for the first time. So did I. Finish the course and I can use lures. Sitting side by side in a classroom writing down the same thing was strangely comfortable.",
    { offer: "Quality control training, mandatory for members. Finish it and lure rigs open up for you. Do Hyeonsu is going too. Don't fight.",
      progress: "Is the course done? Bring the certificate when it is.",
      done: "Certified. Lures are yours now. You can buy starter lures at the direct market too. Try fishing without the smell of bait on your hands.",
      obj: ["Butcher two by the hygiene procedure you were taught", "Slice one plate and write its trail", "Sit through the quality control course and receive the certificate"] }),
  'M2-06': E(
    "Night at Amnam Park. Seo Harin sets up a camera and throws night lures. A school of horse mackerel came in. I cast too. I change the retrieve speed and the rod tip knocks. During the day I built one trap. A trap made by hand and a lure thrown by hand. Harin said she wants to film both of those. I am still awkward in front of a camera.",
    { offer: "Horse mackerel come up on night lures! Cast with me. I'd like to film you building a trap in the daytime too, is that all right?",
      progress: "No mackerel yet? Try changing the retrieve. Did you build the trap?",
      done: "Got them both! I'll edit it and show you. Oh, and this is a camera crew bag. You carry more than I do." ,
      obj: ["Catch horse mackerel on a lure on a winter night", "Build one trap by hand"] }),
  'M2-07': E(
    "There is a control line across the breakwater. They say there was an accident. Some people slip past it. I decided not to. The chief named three routes: going out with the cooperative, entering a fishing park, or a boat. I pick one. It is true that the sea inside the line looks better. But the moment I cross it my name becomes the cooperative's name.",
    { offer: "You saw the control line. Don't cross it. Three legal ways: with the cooperative, the fishing park, or a boat. Pick one.",
      progress: "Have you picked? I know the name of everyone who sneaks across.",
      done: "That route will do. A control line protects people, not anglers. Your name is still clean.",
      obj: ["Catch two from the rocks without crossing the line", "Choose one of the three legal routes and tell the chief"] }),
  'M2-08': E(
    "At Baegunpo a man called Jim Kang switches on a fish light. Small night species gather under it. Three rockfish. He does not cast his own lure, he watches mine. He says he is looking for a posthumous rod. I do not yet know what that means, but I know his eyes stayed on my reel rod for a long time while the rockfish came up.",
    { offer: "I'll put the light on. Rockfish hold at the edge of it. Bring up three. I won't cast. I'll just watch.",
      progress: "That's not three. The middle of the light is empty. The edge.",
      done: "Three. Good rod. Do you know who made it? ...you don't. We'll talk later.",
      obj: ["Land three rockfish under the fish light at Baegunpo"] }),
  'M2-09': E(
    "Quarterly assembly. A review of member standing. They said harbour trust feeds into it. Do Hyeonsu raised his hand and voted against. He did not say why. It passed anyway. On the way out of the hall he said from behind me, it isn't because I dislike you. I thought about that for a long time.",
    { offer: "Quarterly assembly. Standing review. What you did in Busan becomes votes. I'll say nothing.",
      progress: "Stand in the hall. Standing and listening is part of the review.",
      done: "Passed. Do Hyeonsu voted against. Ask him for the reason yourself. This is an allowance from the cooperative. You know where it goes.",
      obj: ["Build a record of five consigned lots for the review", "Stand at the quarterly assembly and hear the review result"] }),
  'M2-11': E(
    "I came back to Sokcho with the box regulation I learned in Busan. The Manbok Store stall still has boxes of every size. The old woman's hands are not what they were. She handles ice noticeably slower now. While I fixed the display she sat beside me and only watched, instead of nagging. That bothers me more.",
    { offer: "...you're back? How was Busan. Look at the stall. My hands don't listen these days.",
      progress: "How will you fix the display? The Busan way? Go on then.",
      done: "...it looks good. Now I see what's good about those Busan regulations. Sorry my hands are slow. It's fine now that you're here.",
      obj: ["Return to Manbok Store in Sokcho", "Rebuild the stall display to the Busan regulation"] }),
  'M2-10': E(
    "The chief said you only know the winter sea if you can run a boat. Licence school, written exam. Navigation, weather, regulations. Sitting at a desk is harder than fishing. When the pass notice came, Ulsan and Pohang opened up on the map. The first page of the qualification to go out on a winter sea.",
    { offer: "You only know the winter sea if you can run a boat. Start with the written exam. Pass it and I'll open the road to Ulsan and Pohang.",
      progress: "Have you sat the exam? Failing is fine. Sit it again.",
      done: "Passed. There's a skipper called Ko Manseok at Bangeojin in Ulsan. Get on his boat. This reel is for a winter sea. It turns even when the drag freezes.",
      obj: ["Pay for the course with four consigned lots", "Pass the written exam for the small-craft operator licence"] }),
  'N01-2': E(
    "A runaway middle schooler is sitting under a Busan bridge. Baram spotted him first and brought me along. His father is out on a deep-sea boat and he says he cannot press the call button. We just fished for horse mackerel beside him. When one came up the boy smiled for the first time. Then he took out his phone. I did not listen to what he said.",
    { offer: "There's a kid under the bridge. Ran away. I think one horse mackerel would do it. Come with me.",
      progress: "No bite yet? The kid's watching. One is enough.",
      done: "He called. That's all it needed. Kids come loose over one fish, I've found." }),
  'N05-1': E(
    "Seo Harin's first boat shoot. All glamour. She even came in lipstick. Na Gibeom quietly fixes her rig beside her. I learn boat manners from him too. Don't cross the next person's line, don't run on deck, listen when the skipper speaks. A flashy beginner and an introverted master. Today I understood a little of how these two became a pair.",
    { offer: "My first boat trip! Gibeom will teach you the manners. I'll listen too, honestly it's my first time as well.",
      progress: "Did you hear it all from Gibeom? He's quiet, you have to ask.",
      done: "You learned the manners, right? Me too. He said don't run on the deck and I ran three times." }),
  'N05-2': E(
    "I ended up in one of Harin's videos. It caused an argument. The question was whether I consented to my face being shown. Harin came to apologise. I told her to set rules instead of apologising. Filming consent, image rights. The camera was off while we took two horse mackerel on night lures. I found out she fishes better with the camera off.",
    { offer: "I'm sorry... about your face being in it. I didn't ask. I'll keep the camera off today. Let's just fish.",
      progress: "Two horse mackerel. It goes better with no camera, strangely.",
      done: "Thank you for setting the rules. I made a consent form. Yours is the first signature." }),
  'N06-1': E(
    "Go Hosu joined the Seabusters thinking it was the basketball club. It is a maritime university lure club. Seeing him standing on the breakwater holding a basketball made me laugh. We go after his first sea bass on a lure together. The minnow cuts the surface and something follows it. He hooked up. The basketball is still beside him.",
    { offer: "I thought it was the basketball club... turns out it's a lure club. What's a sea bass? Catch one with me, please.",
      progress: "Not yet? A senior said you cut the minnow across the surface.",
      done: "Got it! A sea bass! It's bigger than the basketball! ...I'm going to keep doing this." }),
  'N06-2': E(
    "Senior Mo Taejo has a mania about him. He intends to turn Baek Haneul, who joined because he fell for a part-timer, into a serious angler. There is one method: measuring lure choice against conditions. Current, depth, turbidity, change the lure and land three. Haneul was somewhere else at first, and from the second fish his eyes changed. An impure motive is still a motive.",
    { offer: "I need to make Haneul serious. The method is measurement. Lure by condition. Three fish. Cast with us.",
      progress: "Three? Conditions change, so the lure changes. Three on the same lure doesn't count.",
      done: "Did you see Haneul's eyes? They changed. That's what I wanted. Thank you." }),
  'N06-3': E(
    "The typhoon has passed and the water is stained. Yeo Gangsan, an alumnus, called to say the monster sea bass are in. The three of us work it together. One holds the line, one works the net, one casts. Something over sixty centimetres split the surface. We named it Meokbo. Yeo Gangsan pulled off his tackle vest and threw it over. It's yours now, he said.",
    { offer: "Stained water after a typhoon. Now's the time. The monster comes in. Three of us together. You in?",
      progress: "It has to clear sixty to be Meokbo. Under that it's just a sea bass.",
      done: "Meokbo! Did you see it? Wear this vest. I'm an alumnus. The casting is your job now." }),
  'N07-1': E(
    "Jim Kang found a plan in an abandoned workshop on Yeongdo. It is the last design of a lure maker who died young. The testing ground written on it is Sokcho. He proposed a match. Same lure, same spot. I did not expect the road back to Sokcho to come this soon. He never said who won the match. The plan stayed in his pocket.",
    { offer: "I found the plan. It says the testing ground is Sokcho. Come with me and let's settle it. Same lure, same spot.",
      progress: "Not yet? The match happens once. Cast first, then talk.",
      done: "...I saw it. Your hand resembles his. There's a next place. Pohang." }),
  'N18-2': E(
    "Do Hyeonsu is standing at the back of the Busan auction hall. Not as a member's son but as a broker's apprentice. Nobody here knows your name, he said. Mine either. We stand side by side and read the hammer prices. How fast the numbers climb and in what order the hands go up. What he knows and what I know came to half each.",
    { offer: "Stand at the back of the hall. Nobody here knows your name. Same for me. Let's read the prices together.",
      progress: "Haven't read it yet? Don't only watch the numbers, watch the hands.",
      done: "...half of it you got right and half I did. That's not bad." }),
  'N19-2': E(
    "Word went round the stall that Old Tak had taken to his bed. Jeong Okseon packs a food container and hesitates. Is it funny, she asks, an old person worrying about an old person. I said it was not funny. On the bus from Busan to Sokcho I held the container on my knees so it would not go cold. I left it at the workshop door. There was coughing inside.",
    { offer: "They say Tak is laid up. This... it's food. An old woman fussing over an old man, is that funny to you. Take it. Don't tell him I sent it.",
      progress: "Did you go? Leaving it at the door is enough. You don't have to see his face.",
      done: "...he ate it? Good. That's enough. Who else would have gone, if not you." }),
  'N04-4': E(
    "The breakwater club's first away trip. They came all the way to Busan and started with the lunchboxes. Bae Nuri takes photos, Ha Sua counts the gimbap, Mo Jinju casts without a word. Jinju landed first. I had promised to land before the students. I got impatient. Even knowing that impatience is the wrong thing.",
    { offer: "First away trip! Busan! The adult member has to land before the students. Except Jinju. Jinju's cheating.",
      progress: "Jinju landed first, apparently. The adult member's dignity...",
      done: "You landed! After Jinju, but still. Away trip successful! And the lunchboxes are gone." }),
  'N05-6': E(
    "Seo Harin's live stream has three viewers. One of them is Na Gibeom and one is me. Gibeom sits with his back to the camera and dresses fish in silence. It's fine if it's dull as long as it's real, he said. I dress one whole fish on air. My hands shook. Not because of the camera, but because his knife was so quiet.",
    { offer: "Three viewers... I'm streaming anyway. Show them dressing a fish. Gibeom will keep his back turned.",
      progress: "Not dressed yet? Don't mind the camera. Nobody's watching, honestly.",
      done: "Done. It went up to five viewers! He said it, didn't he. Dull is fine as long as it's real." }),
  'N02-6': E(
    "Tak Saebyeok finished his first rod at twelve. His grandfather said it was thin without even looking. Saebyeok did not cry. Instead he told me to fish with it at night. I go back to the Sokcho workshop and pick up the boy's rod. It really is thin. But the tip is alive. One fish came up that night. Saebyeok pretended to be asleep on the porch.",
    { offer: "Mister. I made this rod. Grandpa says it's thin. Catch one with it at night. Then he'll look at it.",
      progress: "Not yet? Thin is still a rod. Trust the tip.",
      done: "You caught one?! ...did you see? Did Grandpa see? No, he doesn't have to. You saw it." }),
  'N21-2': E(
    "The inner bay is covered in moon jellyfish. Oh Sechan says they get hauled in with the nets and spoil the catch. Clear them wherever I see them. I throw a snagging hook and drag them in. One is heavier than I expected. After clearing five I had the illusion the water in the bay looked a little clearer. The illusion was fine by me.",
    { offer: "Summer's here. Look at the inner bay. Moon jellyfish. They come up in the nets. Clear just five for me.",
      progress: "Five. Drag them in with a snagging hook. They're heavy, be careful.",
      done: "Five. The inner bay looks better. It's like this every summer. I'll call you next summer too." }),
  'N23-1': E(
    "A typhoon tore open a fish farm cage. Chae Surim, the management officer, says the escaped flounder have to be counted. Farmed individuals have worn fins and abnormally high condition factors. You can tell from the detail view. I catch and measure three flounder. One has worn fin tips. This one is farmed, she says, writing it into the table. Even a fish in open water has an origin.",
    { offer: "A cage tore open. We have to count the escaped flounder. Catch three and measure them. Farmed fish have worn fins.",
      progress: "Three. Look at the condition factor in the detail view. Abnormally high means farmed.",
      done: "This one is farmed. Well sorted. I'll put it in the table." }),
  'N20-1': E(
    "There is a man talking to himself with a tripod set up. Yu Harang, three hundred subscribers. He asks whether I could just catch one for him. Because the shot isn't working. I cast in front of the camera. Strangely my hands stiffen. Still, one came up. After the stream he said, three hundred people saw that. No, twelve of the three hundred.",
    { offer: "Um... could you just catch one? The shot isn't working. I have three hundred subscribers and twelve are watching now.",
      progress: "It's the camera, isn't it? Same for me. Just one.",
      done: "Got it! Did you see, all twelve! Thank you. Really." }),
  'N22-1': E(
    "Hanui's craft workshop smells of woodwork. Buying things is one way, she says, but you only know what to buy after you have made one. Anything can be made from a single plan. I picked a sinker mould. My hands are clumsy and the finish is rough. Still, when I showed her what I made she smiled for the first time. Rough is normal.",
    { offer: "Buying is one way, but you only know what to buy after you've made one. Pick a plan and make something.",
      progress: "Did you make it? Rough is fine. Bring it here.",
      done: "Rough is normal. From the second one it gets smooth. You've put up a workbench now." }),
  'N03-2': E(
    "Old Kang Ducheol is sitting in the front row at the Busan quality control course. The instructor called him chairman. He was never a beginner who could not tie a rig. Chairman of the fisheries cooperative federation. I looked at him for a long time. He came over first and said, will you keep teaching me, or keep your distance now. The answer was mine to give.",
    { offer: "...found out. I'm the chairman. I'm sorry. But the breakwater you sat down on with me was real. Will you keep teaching me?",
      progress: "You haven't answered yet. Take your time.",
      done: "...let's do that then. A teacher is a teacher. Not a chairman." }),

  // ── Ch3 Ulsan / Pohang ──
  'M3-01': E(
    "The Goraemaru is tied up at the Bangeojin pier. Skipper Ko Manseok looks rough and speaks short. The chief said this is the last stretch where I learn riding on other people's boats. I write my name on the boarding list and put on a life vest. The moment the boat leaves the pier the ground moves under me and my stomach turns over. Still, it is the first time I have seen the horizon move at eye level. I have to get used to this motion before anything comes next.",
    { offer: "If you're coming, write your name on the list. Vest on. Run on my boat and you get off. That's all of it.",
      progress: "One trip out is what counts as boarding. Watching from the pier isn't boarding.",
      done: "...came back alive. I saw you throw up. Everyone does. Jigging next. Bring a rod.",
      obj: ["Land one yellowtail where the Goraemaru puts you", "Board the Goraemaru and complete one trip out"] }),
  'M3-02': E(
    "Jigging. Drop the metal jig to the bottom and work it up with jerks. My arms tire before anything else. Ko Manseok watched my jerking rhythm without a word and took my hand once. Do it at that rhythm. Something knocked during the fall. A forty-three centimetre yellowtail. My first real fish from a boat. The skipper did not smile, but he threw me another jig.",
    { offer: "Jigging. Drop it to the bottom and jerk. They take it on the fall. Get a yellowtail over forty.",
      progress: "Arms hurt, eh. It's rhythm. Not strength.",
      done: "Forty-three. That'll do. This rod is for jigging. Jerk with yours and the tip goes. Use this. And jigging is a skill you can learn now.",
      obj: ["Land a yellowtail of 40cm or more by jigging on a winter sea"] }),
  'M3-03': E(
    "The practical exam. Mooring, course change, man overboard. On the first attempt I scraped the pier during the mooring and failed. The chief said failing once is all right. On the second, my hands shook less. I took the certificate and became a person who can run a boat. I still have no boat. But a qualification is a qualification.",
    { offer: "The practical. Mooring, course change, rescue. Failing once is fine. I won't excuse twice.",
      progress: "Did you fail? Sit it again. Everyone scrapes the pier once.",
      done: "Passed. Small-craft operator. You're qualified to run a boat now. A congratulations payment from the cooperative. Nowhere near the price of a boat, mind.",
      obj: ["Pass the practical exam for the small-craft operator licence"] }),
  'M3-04': E(
    "No herring is coming into the Pohang drying racks. The rails where gwamegi should hang are empty. Baram smoked a cigarette next to the rack owner and said, if the sea changes, people have to change. I learn drying and curing. Catching a fish and drying it run on different clocks. I did not know waiting was this much work.",
    { offer: "The racks are empty. No herring. Want to learn drying and curing? If the sea changes, people have to change.",
      progress: "Still drying, right. Waiting is work too.",
      done: "You dried it. That's gwamegi now. Even if it isn't herring. You've become someone who can wait.",
      obj: ["Catch three fish to hang on the racks", "Carry one drying and curing craft through to the end"] }),
  'M3-05': E(
    "Sea fog rolls in. I cannot see ten metres ahead. Ko Manseok throttles down and looks at me. What will you do. I had heard before that turning back without pushing is also skill. Return to port. No catch. But the moment I stepped onto the pier, news from another boat told me the call had been right.",
    { offer: "Sea fog. Can't see ahead. You decide. Push on, or turn back.",
      progress: "Haven't decided? Fog doesn't wait for you.",
      done: "You came back. Coming back with no catch is skill. You heard about the other boat. That's your answer.",
      obj: ["Land two before the fog closes in", "Decide to turn back in the sea fog and return to the pier"] }),
  'M3-06': E(
    "Jeong Okseon came all the way to Pohang. She asks old people whether they ever saw pollock and writes down what they say. In the field guide pollock is listed as prohibited. I write down three people's stories. The sea pollock used to come into, the winter the nets tore, the year that sea disappeared. For the first time I understand what the log is for. It is not a record of catching, it is a record of keeping.",
    { offer: "Ask the old ones. Whether they ever saw pollock. Write it down. Three people. That's what the log does.",
      progress: "Still short of three? Old people don't say it twice. Listen properly.",
      done: "...you wrote it. This is the log. Not catching, keeping. I wonder if your father knew this too.",
      obj: ["Meet the fish they spoke of, and let it go", "Hear and write down three old people's stories about pollock"] }),
  'M3-07': E(
    "Fry release. Tens of thousands of juveniles go into buckets and down into the sea. I stand in a line with the cooperative and watch the water splash. Things smaller than my palm vanish into the sea. How many will come back. The chief said not to count. Sea reputation rises. Something that does not show as a number went into the sea today.",
    { offer: "Fry release. Take a bucket. Don't count. The moment you count you can't let go.",
      progress: "Not all released? One bucket at a time. Slowly.",
      done: "Good work. Nobody knows how many come back. But you let them go. That bag is for expeditions. Use it when you go far.",
      obj: ["Return five buckets of fry to the sea"] }),
  'M3-08': E(
    "Winter red seabream. I drop the tairaba to the bottom and reel slowly. Knock, knock, and then a heavy resistance. A big one. The drag sings and the rod tip touches the water. That was when the sound came. A joint broke. My father's reel rod is in my hands in two pieces. The seabream came into the net. I looked at the broken rod for a long time. I still do not know what to do with it.",
    { offer: "Winter seabream is tairaba. Reel slowly. If a big one hits, trust the drag. The rod... a rod has limits.",
      progress: "Not yet? Seabream is dawn or dusk. They don't take at midday.",
      done: "...it broke. That rod. And you got the seabream. That's what a gear limit is. Go see Old Tak. He's the one who makes rods.",
      obj: ["Land a red seabream on tairaba at dawn or dusk"] }),
  'M3-09': E(
    "I took the broken rod to the bamboo workshop. Old Tak felt the joint and said nothing for a long time. Then he held out a new bamboo blank. One he had cut himself. Go and look at a boat with this, he said. A used boat has come up in Geoje. I left the broken rod at the workshop. He said to ask Saebyeok whether it can be saved.",
    { offer: "Let me see. ...it broke. Leave it here. Take this blank. Go and look at a boat. Geoje.",
      progress: "Did you take the blank? Then go. A boat doesn't wait.",
      done: "Fish with this one for a while. Saebyeok and I will look at yours. Rod building — it's your turn to learn it. I've arranged for you to buy workshop tools too.",
      obj: ["Build eight consigned lots as seed money for a boat", "Receive a new bamboo blank from Tak Mansu at the workshop"] }),
  'N01-3': E(
    "The rack owner said the gwamegi line looks like it will end with him. No herring comes in. Baram smokes beside him. If the sea changes, people have to change. I talked with the owner for a long time. What can be dried, what still comes in. There was no answer. But he said he would not leave the rails empty.",
    { offer: "The rack owner's struggling. Listen to him a while. There's no answer, but it's different when someone listens.",
      progress: "Did you listen? All the way through. Don't cut in halfway.",
      done: "He won't leave the rails empty. That's enough. If the sea changes, people change." }),
  'N07-2': E(
    "Second match with Jim Kang, off Pohang. Jigs. He believes the second piece of the posthumous lure is somewhere here. I bring up one yellowtail by jigging. He never cast his own jig. He only watched my jerking. Measurement, he called it. I do not know what he is measuring.",
    { offer: "Second one. Pohang jigs. One yellowtail. I won't cast again. I'll only watch your jerking.",
      progress: "Not yet? A jig gets taken on the fall. The jerk is the preparation before it.",
      done: "...I saw it. The second piece fits your hand too. Next is Taean. Surf." }),
  'N08-1': E(
    "Watch assignments on my first Goraemaru trip. The skipper put me at the bow. Boat rigs are not land rigs. Short, thick, heavy. Lunch is raw fish soup on deck. One passenger starts telling his own story. The skipper pretends not to listen and hears every word. I learn from the back of his head that listening to passengers is also the work of a boat.",
    { offer: "Stand at the bow. Use this rig. Bring a land rig aboard and you're a joke. Lunch is mulhoe.",
      progress: "One trip out is what counts. Did you eat the mulhoe?",
      done: "Good work. You heard the passenger's story. That's boat work too. From the next trip I'll open up passenger requests." }),
  'N08-2': E(
    "Ko Haena said she wants to go to culinary school. Her father Ko Manseok is against it. She asked me to catch one winter yellowtail. She will set her father's table with it. Her knife is precise when she cuts the sashimi. The skipper ate without a word. Two bowls. Whether that was an answer, I still do not know.",
    { offer: "Please catch me one yellowtail. A winter one. I'll set my dad's table with it. I'll cut the sashimi myself.",
      progress: "The yellowtail? I'm cutting it myself, so you don't have to dress it.",
      done: "Dad had two bowls. He didn't say anything, but... two bowls." }),
  'N09-1': E(
    "A student slipped on the rocks at Homigot. I reached out and caught her. She said her name was Hanbom. She introduced herself as someone mad about cooking. She was holding a feathered hook. Belonging to the father of her stepsister, Lee Suyeon. I learned that day that the hand that catches a person on a rock is faster than the hand that holds a rod.",
    { offer: "Ah, thank you! I didn't know it was slippery. I'm Hanbom. I'm mad about cooking. This feathered hook, it's my sister's dad's...",
      progress: "I haven't finished the story. About my sister. Will you listen?",
      done: "I'll introduce my sister. Lee Suyeon. She doesn't talk much. Let's eat together anyway." }),
  'N09-2': E(
    "Lee Suyeon catches, Hanbom cooks on the spot. I landed two and took over the dressing. Hanbom proved on a plate that good dressing makes good cooking. Suyeon says nothing. But the hand that sets her fish on my board is precise. The hand of someone carrying a loss, Bom said.",
    { offer: "My sister catches and I cook. You do the dressing. Good dressing makes good cooking. Two fish.",
      progress: "Two dressings. Leave meat on the bone and my sister will notice.",
      done: "See? Good dressing, so the cooking worked. My sister ate two pieces. My sister did." }),
  'N09-3': E(
    "We restored the fly pattern of Lee Suyeon's father. Bom dug up an old photo and I tied it exactly. One red seabream came up on that hook. The three of us at a table for the first time. Suyeon spoke for the first time. That's Dad's hook. I brought up my own parents there for the first time. I do not know why. The table made it happen.",
    { offer: "Dad's fly pattern... I found a photo. Could you tie it? Then one red seabream on it. The three of us eat together.",
      progress: "The seabream? On that hook. No other hook.",
      done: "...that's Dad's hook. (Lee Suyeon said it. Hanbom cried. I talked about my parents.)" }),
  'N10-1': E(
    "Namgung Hyeon, night keeper at a tackle warehouse. He gives me a stock-sorting shift. I moved boxes all night and went out for a smoke at dawn. He was casting off the pier. Once. There was no sound. Far enough that I could not see where the line went. I pretended not to see. It seemed to be what he wanted.",
    { offer: "Night stocktake. Hourly. All night. Finishes at dawn. No questions.",
      progress: "Boxes left. Go when they're all moved.",
      done: "Good work. Your day's pay. ...were you on the pier at dawn. Let's say you weren't." }),
  'N18-3': E(
    "Do Hyeonsu followed me to Pohang saying he would help with the interviews. The old people grab hold of him and will not let go. Not because he is the chief's grandson but because he listens well. There are two writing hands now. Two people write one person's words differently. We compared the gap in the evening. I was a little bitter that his handwriting is neater than mine.",
    { offer: "I'm helping with the interviews. The old ones like me. ...I just came along.",
      progress: "One session. Write it down with me. Then we compare yours and mine.",
      done: "...three lines you missed, two I missed. With two of us it works." }),
  'N03-6': E(
    "Kang Ducheol turned up at Bangeojin. He says he sailed with Ko Manseok on the same boat thirty years ago. Instead of greeting each other the two old men looked at each other's hands. They are people with more left in their hands than in words. I sat between them and listened to old stories. I never heard the name of that boat. Neither of them said it.",
    { offer: "I heard you were at Bangeojin. I'll go too. Ko Manseok. We were on the same boat thirty years back. Will you sit for the old talk?",
      progress: "Haven't met them both yet? They have to be sat down together before anything comes out.",
      done: "...neither said the boat's name. Both of them. That belongs to the men who were on it." }),
  'N19-3': E(
    "Since the food container came back, Old Tak has been carving again. This time not for himself, a rest for the stall. The second one. I went back to Sokcho and set it on the stall. Jeong Okseon said nothing again. She only set it down beside the first one. With two of them, something looked different.",
    { offer: "The second one. A rest. On your way past... you know. Don't tell her it was me.",
      progress: "Did you leave it? Was it set beside the first?",
      done: "...beside the first? Good. Then that's enough. (The sound of carving goes soft.)" }),
  'N05-7': E(
    "Na Gibeom opened a small shop. No customers and only the tank running. Seo Harin washes dishes instead of filming. I went back to Busan and cut sashimi in that shop. There were still no customers. Even so, three of us sat at the counter and ate. Harin said, I don't want to film today. Gibeom smiled for the first time.",
    { offer: "I opened a shop. Customers... none. Would you cut some sashimi. No customers, but you still cut sashimi or it isn't a shop.",
      progress: "The sashimi? Use what's in the tank. There's nowhere to sell it anyway.",
      done: "...that's good. Harin says she won't film today. I like it better that way." }),
  'N08-3': E(
    "Ko Haena practises at the helm behind her father's back. The skipper knows and pretends not to. I rode along on that trip. Haena's hands take the wheel. The boat wanders at first and then runs straight. One passenger photographed it. The skipper stood at the bow with his back turned. His shoulders were smiling a little.",
    { offer: "Behind Dad's back. Helm practice. Stay beside me for one trip. He'll... he'll know. Still.",
      progress: "Haven't gone out yet? While Dad's up at the bow.",
      done: "It ran straight, didn't it? Do you think Dad saw. ...he must have. His back was smiling." }),
  'N21-3': E(
    "The local government buys northern seastars by the kilo. Oh Sechan warned me that if I mix in bat stars the counter sends the whole lot back. I sort eight into the bucket. Only the ones with upturned arm tips. The clerk turns each one over. Passed. The one who counts, the one who sells and the one who gathers line up in a row.",
    { offer: "Eight northern ones. Mix in a bat star and it comes back. Only upturned tips. The counter's over there.",
      progress: "Eight. One bat star and you come back again.",
      done: "Passed, right? The counter is fussy. That's what makes it accurate." }),
  'N23-2': E(
    "Word is going round that someone saw a white specimen. Chae Surim told me to follow the rumour. The rumour turned out to be a story about a spot and a tide. You have to stand in those conditions to meet it. I stood where the rumour pointed at that tide. One came up. It was not white. I recorded it anyway. A rumour stops being a rumour the moment it becomes a record.",
    { offer: "Someone says they saw a white one. Follow the rumour. It'll end up being about a spot and a tide. One fish under those conditions.",
      progress: "Did you stand in that spot? The tide has to match.",
      done: "Not white after all. Record it anyway. The rumour became a record." }),
  'N20-2': E(
    "Yu Harang said he needed a shot of the sun going down. No catch necessary, just hold the spot until sunset. I sat on the Bangeojin breakwater and watched the sun come down. It is the first time I have gone out to fish and not fished. The camera runs behind my back. We watched the footage together. My back was smaller than I expected.",
    { offer: "I need a sunset shot. No catch needed. Just sit until the sun's down.",
      progress: "Sun's not down yet. A bit longer.",
      done: "Look at this. Your back is... good. I'm using this for the thumbnail." }),
  'N22-2': E(
    "Sleeping somewhere and living somewhere are different, Hanui said. Start by deciding what goes in the room. I put one piece of furniture in the dormitory. One chair. Sitting in it, the room looked different. A room I only slept in became a room I sit in for a moment. When I showed it to her she nodded. It's a start.",
    { offer: "Sleeping somewhere and living somewhere are different. Start with what goes in the room. Put one thing in and show me.",
      progress: "Did you put it in? One is enough. Put in many and it's a storeroom.",
      done: "It's a start. The room looks like a person now." }),
  'N22-3': E(
    "If the price of sinkers stings, pick your own, Hanui said. Where to break the rock is something you learn separately. I quarry stone at the site. Finding stones of the right weight took an hour. She looked at what I picked and took two out. This one works, this one doesn't. You know why once you hold it, she said.",
    { offer: "If sinker money stings, pick your own. At the quarry site. Where to break it... that you learn separately.",
      progress: "Did you quarry? The weight has to match. You can't do it by eye.",
      done: "This one works, this one doesn't. You know once you hold it. Two keepers." }),

  // ── Ch4 Geoje ──
  'M4-01': E(
    "The Jisepo shipyard. Skipper Chae Geumja showed me a used boat. Hull inspection, repair estimate. I do not have enough money. We settled on fixing half now and the rest as I earn. Five million won. For the first time I calculate what and how much I have to catch to put that number in a bankbook. The chief's line about a boat being something you endure rather than buy is finally visible as a figure.",
    { offer: "This boat floats if you fix half of it. The estimate is this much. You need five million to start. Go and save it.",
      progress: "Not at five million yet. The boat waits. The yard doesn't.",
      done: "Five million. Good. Half fixed, half fixed while you run her. Every first boat is like that.",
      obj: ["Save five million won and get the first hull repair estimate"] }),
  'M4-02': E(
    "I name the boat myself. My hand shook painting it on the bow. I start the engine for the first time and pull away from the pier. It is not someone else's boat. The motion and the noise are mine. Chae Geumja watched from the pier with her arms folded instead of waving. Chae Pado told me later that this is her way of congratulating someone.",
    { offer: "Decided the name? Write it on the bow. First run is one lap of the harbour. Don't go far.",
      progress: "Haven't gone out yet? Start her and go. A named boat has to float.",
      done: "You're back. First run. Boat handling, learn it as a skill now. And this is a congratulations payment for your first boat. Fuel money.",
      obj: ["Land the first three fish from your own boat", "Complete your first run on your own named boat"] }),
  'M4-03': E(
    "Night at Jisepo. Chae Pado brought out a small light boat. They call her scatterbrained, but on a boat she is precise. Flounder on a down-shot. Tap the bottom and wait. Something took it. A flounder's white belly turns over in the dark. Pado nearly missed with the net. We both laughed. It has been a while since I laughed on a night sea.",
    { offer: "Let's go out at night! I'll run the light boat! Flounder is down-shot. Tap the bottom. I'll work the net! Probably.",
      progress: "Not yet? Keep it on the bottom. Flounder means the bottom.",
      done: "Got it! The near miss with the net is a secret. From the skipper, anyway.",
      obj: ["Land a flounder on a down-shot from a small light boat"] }),
  'M4-04': E(
    "Vessel safety inspection. Life-saving gear, extinguishers, flares, a thirty-item checklist. One item failed. A life vest past its expiry date. Re-inspection. I lost a day and replaced one vest. The inspector taught me without a word that one person's life is worth one vest.",
    { offer: "Safety inspection. Thirty items. One failure and you re-sit it. Start with the vest expiry.",
      progress: "Re-inspection, I hear. Did you change the vest? Change it and come back.",
      done: "Passed. One day for one vest. That's what the sea charges. Don't forget it.",
      obj: ["Make the two items the checklist is short of", "Pass all thirty items of the vessel safety inspection"] }),
  'M4-05': E(
    "Yeosu. Oh Gayun came down to the pier after her hotel shift. A night trip, fish lights, hairtail. A silver ribbon rises into the light. The teeth are sharp. I watched a hairtail cut the leader twice and used wire on the third. Gayun looked like she was crying at the hairtail, but I did not ask. The nights in Yeosu are long.",
    { offer: "Let's go night fishing for hairtail. I'll run the lights. Mind the teeth. They cut your leader.",
      progress: "The hairtail? Leader cut, right. Use wire.",
      done: "You got one. Silver... it's pretty. I cried a bit today. Don't ask.",
      obj: ["Land a hairtail under fish lights on a Yeosu night sea"] }),
  'M4-06': E(
    "The charter-boat registration is done. Boarding list, safety briefing, seasickness plan. My first customers are two middle-aged men. Thirty minutes out one of them went flat on his back. I gave him a tablet and sat him at the bow. The fishing was good. On the way back the man who had been lying down said he would come again next week. For the first time I took money and carried people.",
    { offer: "Charter registration's done. First customers. List, briefing, tablets. Even if a customer goes flat, the boat comes back.",
      progress: "Haven't gone out yet? Customers don't wait.",
      done: "You're back. He's coming again? That's the business. This reel is a skipper's. It has to wind before the customers' do.",
      obj: ["Land two in front of the guest", "Slice one plate on deck", "Take your first customers out on a trip"] }),
  'M4-07': E(
    "The West Sea. The opposite of the East. The water travels hundreds of metres twice a day. Old Song Gibaek taught me how to walk the tidal flat from his home in a scrapped boat. How to pull a foot free, when the tide turns back. I dug three specimens out of the flat. One shoe stuck in the mud and I lost it. The old man laughed. Everyone loses a shoe their first time.",
    { offer: "First time on the West Sea. A tidal flat isn't walked, it's sunk into. Watch the tide. Dig three and come out.",
      progress: "Not out yet? The water's coming. Come out even if you haven't got three.",
      done: "Lost a shoe. Everyone does. Three is enough. The West Sea starts here.",
      obj: ["Arrive at Taean", "Dig three specimens from the flat on the right tide"] }),
  'M4-08': E(
    "Manripo surf. Tak Saebyeok had come all the way to Taean. Not twelve any more, somewhere in his teens now. The boy knows how to throw a surf lure before I do. Night on the foam line. Put the minnow where the waves break. A sea bass came up out of the surf. He said he is a person who makes rods, not one who throws them, and then threw better than me.",
    { offer: "Mister! For surf you throw into the foam. At night. Sea bass are inside the waves. Throw it with the rod I made.",
      progress: "Not yet? Where the wave breaks. Not inside it, right at it.",
      done: "Got it! That rod, I cut it for surf. It's yours. You can learn surf proficiency now.",
      obj: ["Land a sea bass on a night surf lure at the foam line"] }),
  'M4-09': E(
    "A writer on deadline had a cuttlefish boat booked. He said he ran away from his producer. Autumn, daytime. Drop the egi to the bottom and twitch it twice. A cuttlefish came up spraying ink. The writer drew storyboards on deck. I lost another egi. Egi fishing has opened up. He says the deadline still has not ended.",
    { offer: "I booked a cuttlefish boat. Somewhere my producer can't find me. Twitch the egi twice and wait. I'll draw the boards.",
      progress: "Not yet? Twice off the bottom. Three is too many.",
      done: "Ink! And the boards are done. Egi is open now, right? The direct market's getting the better egi in too.",
      obj: ["Land a cuttlefish on an autumn daytime egi"] }),
  'M4-11': E(
    "With the charter registration done I ran the boat all the way to Sokcho. A day and a half down the east coast. Chairman Kang Ducheol and Old Tak Mansu were standing on the pier. My first paying customers. The old man who pretended he could not tie a rig and the old man who cut me a bamboo blank sat side by side and looked at the sea without a word. They each brought up one fish. I was at the wheel. On my own boat, nobody else's.",
    { offer: "Bring the boat up to Sokcho. Your first customers are Tak and me. Charge the list price. No discounts.",
      progress: "Not in Sokcho yet? Follow the east coast up. We'll wait at the pier.",
      done: "...good boat. Tak says so too. Here's the fare. List price. You don't discount your first customers.",
      obj: ["Run the boat up to the Sokcho pier", "Take the two old men out onto the Sokcho sea"] }),
  'M4-10': E(
    "The Jeju route. Long-passage preparation. Fuel, weather, emergency rations. Do Hyeonsu came aboard for the first time. The moment he stepped onto my boat felt strange. A rival becoming neither a customer nor a crewman. Just someone going along. We prepared the departure together. He calculated the fuel and I read the weather.",
    { offer: "You're going to Jeju, I hear. I'm coming. I'll do the fuel. You read the weather. That's better.",
      progress: "Not ready? The fuel's done. Have you read the weather?",
      done: "...done. We sail. See you in Jeju. No — we're going together.",
      obj: ["Make three items of long-voyage stores", "Finish preparations for the Jeju passage with Do Hyeonsu"] }),
  'N01-4': E(
    "There is a man who quit fishing after an accident on the rocks. Baram suggested we take him to Haegeumgang. The man did not pick up a rod. I went after the largescale blackfish alone. Early summer rocks. When one came up the man looked toward the sea for the first time. He looked at the foot of the cliff for a long while. Then he took the net. He still has not held a rod.",
    { offer: "There's a man who quit after an accident on the rocks. Come to Haegeumgang with us. He won't cast. You cast.",
      progress: "No blackfish yet? Early summer rocks. He's watching.",
      done: "He took the net. That's enough. Next time he might pick up a rod." }),
  'N02-2': E(
    "Tak Saebyeok has run away. They say he went to Taean to find a giant bamboo. His grandfather looked at me without a word. I went to Taean and found the boy. He was tapping on the nodes in a bamboo grove behind the flat. He picked one giant culm, shouldered it, and we landed a sea bass together. The boy slept on the bus back. The bamboo scraped the window.",
    { offer: "Saebyeok went to Taean. Looking for a giant culm. ...bring him back. He won't come if I go.",
      progress: "Found him? It's a bamboo grove. Where you hear tapping on nodes.",
      done: "...you came. And the culm? That's a good one. Let the boy sleep." }),
  'N07-3': E(
    "Manripo surf. Jim Kang's third. A minnow. He did not cast this time either. I brought a sea bass out of the surf. The third piece came out of his hand. Three of the four. For the first time he said a little about himself. That maker was my younger brother. He said only that and looked at the sea.",
    { offer: "Third one. Manripo surf. Minnow. One sea bass. I'm not casting again.",
      progress: "The foam line. Surf means inside the wave. Not yet?",
      done: "...three. He was my younger brother. The fourth is Jeju. Egi." }),
  'N11-1': E(
    "Skipper Chae Geumja is first rate at the helm, clumsy at fishing, and cannot cook at all. I made the boat meal instead. From one flounder. In return I got a lesson in route judgement. Current, wind, fuel. When she speaks in front of the wheel she is a different person. Not a skipper who cannot cook. Just a skipper.",
    { offer: "Make the boat meal, would you. I can't. I'll teach you route judgement instead. That I'm good at.",
      progress: "The flounder? Flounder is easiest for a boat meal. And the lesson happens at the wheel.",
      done: "That's good. The lesson — you got it? You read the current first. Wind comes after." }),
  'N11-2': E(
    "Chae Pado lost an auction lot. He says he forgot the delivery. Emergency fishing before dawn. Two trap lifts covered the shortfall. Pado kept apologising all through it. The skipper said nothing. When the numbers matched, Pado held out a dry bag. Bought with his first pay. The one he had meant to use himself.",
    { offer: "I lost the lot... two trap lifts before dawn, please. The skipper doesn't know yet. No, she'll know.",
      progress: "Two. One more. Quickly, please.",
      done: "We covered it... take this. I bought it with my first pay. You use it." }),
  'N11-3': E(
    "The night before a typhoon. A customer is pushing to go out. He will pay double. Chae Geumja refused. She told me to learn how to refuse. The customer left angry. The next day I heard that another boat had not come back. That day I learned what a refusal protects.",
    { offer: "The customer's pushing to sail. The night before a typhoon. Refuse. Learn how to refuse. Even at double.",
      progress: "Haven't refused yet? The moment money comes up, refuse faster.",
      done: "You refused. Did you hear about the other boat? ...that's what a refusal protects." }),
  'N12-1': E(
    "Oh Gayun is sitting on the breakwater. She said it was a day she had a fight. She asks me to stay beside her until sunset, fishing optional. I cast. Nothing took it. Neither of us said anything while the sun came down. Zero catch. Still, as she stood up she said thank you. That was the whole of it.",
    { offer: "...I had a fight today. You don't have to fish. Would you just sit beside me until sunset. Only today.",
      progress: "The sun isn't down yet. A bit longer.",
      done: "Thank you. That's all I needed. Today." }),
  'N12-2': E(
    "Beside Jeong Umi's camper, a couple signed up for a night-sea guide. Whether it ends in making up or breaking up, keep it warm, Umi said. We landed two hairtail at night. The couple laughed at the hairtail and then cried. I do not know how it ended. Calm, Umi called that night.",
    { offer: "A couple's guide. Making up or breaking up, keep it warm. Two hairtail should do it. At night.",
      progress: "Two hairtail. Don't mind the couple.",
      done: "It was calm. That's all of it. The conclusion belongs to them." }),
  'N13-1': E(
    "The writer on deadline hid on a cuttlefish boat to dodge his producer. He said the storyboards get finished at sea. He never put the pen down while I brought up two cuttlefish. Ink splashed across one board. He said he would leave it as it is. Deadline escape. There is no better deadline than this, he said.",
    { offer: "The producer's chasing me. Take me out. A cuttlefish boat. I'll finish the boards at sea. Just two.",
      progress: "Two. I'm drawing. Mind the ink.",
      done: "Done, the boards. I'll submit the inked page as it is. Deadline escape successful." }),
  'N13-2': E(
    "What Old Song Gibaek had been looking for all his life was a group photo taken during a cleanup volunteer drive. I found it inside the scrapped boat. The old man pointed at the faces one by one. This one's gone, and this one. I thought of my own family photo. Me at four and the stall awning. A photo belongs to whoever is left.",
    { offer: "There's something I've looked for all my life. A photo. From the cleanup drive. It's somewhere on this boat. Help me find it.",
      progress: "Not found? Under the wheelhouse. No, the engine room.",
      done: "...this is it. This one, and this one. All gone. Only me left. You have a photo too, don't you. That face." }),
  'N18-4': E(
    "I went to look at the used boat with Do Hyeonsu. He looked at the price and I looked at the hull bottom. For the first time our two ways of looking were useful. We both wrote on the inspection sheet. I found a crack he missed and he found an estimate line I missed. With one boat between us, we were a team for the first time.",
    { offer: "You're going to look at the boat. I'm coming. I'll take the price. You take the bottom.",
      progress: "Finished the inspection? There's one crack. You find it.",
      done: "...you found the crack. I took the estimate lines. With two of us it works." }),
  'N04-5': E(
    "Bae Nuri is wondering whether to go to the fisheries high school. She said she needed one adult and that adult is me. A bench in front of Cheongcho High in Sokcho. I listened all the way through. I gave no advice. It was not a club captain sitting there, it was a seventeen-year-old. When it was done she said, it's enough that you listened. I am not sure whether that is all being an adult takes.",
    { offer: "The fisheries high school... should I go. I need one adult. There aren't any around me. So, you.",
      progress: "I haven't finished. All the way through.",
      done: "It's enough that you listened. I'll decide myself. But the one who listened was you." }),
  'N19-4': E(
    "Two bamboo rests sit on the stall now. Jeong Okseon says nothing and the old man passes by at the same time every day. I sat the two of them down together. The method was simple. I put two chairs in front of the stall and called them both over while I carried ice. Ten minutes. Not a word. But they sat together.",
    { offer: "...Tak goes past every day. I can't tell him to sit. Could you. No, never mind. No — could you.",
      progress: "Did you sit them down? Both? Ten minutes is enough.",
      done: "...they sat. Ten minutes. Not a word. But they sat. You did that." }),
  'N09-4': E(
    "Lee Suyeon sold her father's boat. Hanbom said they should open a restaurant with the money. A kitchen goes up on the ground a loss passed through. I dressed the fish for the opening table. Suyeon watched beside me. She said it was her father's knife. I finished the dressing with that knife. Spring in Guryongpo. That is the restaurant's name.",
    { offer: "I sold the boat. Bom says we should open a restaurant. Would you dress the fish for the opening table. With Dad's knife.",
      progress: "The dressing? Dad's knife is right here.",
      done: "...thank you. The restaurant is called Spring in Guryongpo. Bom chose it. I didn't object." }),
  'N11-4': E(
    "Chae Pado takes a party of customers alone for the first time. Chae Geumja stands on the pier with her back turned, only listening. I rode along. Pado takes the wheel, seats the customers, hands out rigs. He was not a scatterbrain. On the way back a customer tipped him. Pado showed the tip to the skipper first.",
    { offer: "I'm taking customers alone. First time. Just ride along. You don't have to do anything. Just be there.",
      progress: "Haven't gone out? The customers are here. Get aboard.",
      done: "I got a tip! I showed the skipper! ...thank you. All you did was be there." }),
  'N21-4': E(
    "The front of the fish farm cage is blocked with moon jellyfish. Oh Sechan says they have to be cleared before they reach the intake. Ten of them. I drag them in one at a time with a snagging hook. My arms go numb. When the tenth came up the cage keeper shouted. The intake's open. For the first time, clearing something kept something alive.",
    { offer: "The cage front is blocked. If they reach the intake the farm dies. Ten. Now.",
      progress: "Ten. Arms hurt, right. Mine too.",
      done: "The intake's open. Ten of them. The farm lives. Because of you." }),
  'N23-3': E(
    "Chae Surim told me not to say in words that it was a good specimen. Bring it back as top-grade sashimi. The dressing is the proof. Spike the live fish, bleed it, cut along the grain. The grading came out top. She looked at the plate and nodded. She said nothing. The plate had said it.",
    { offer: "Don't tell me in words that it was a good one. Bring it back as top grade. The dressing is the proof.",
      progress: "Top grade. Second grade doesn't count. Start again from the spike.",
      done: "...top. Good. The plate said it." }),
  'N20-3': E(
    "Yu Harang asked for a joint stream. He said he would come to my home ground instead. The camera followed me all the way to Sokcho. We set up in front of Manbok Store and landed two side by side. We watched the edit together. There was a shot of the old woman from the stall walking past behind us. Harang said he would keep that cut.",
    { offer: "Let's stream together! I'll come to your home ground instead. Sokcho! And film the stall. Oh, with permission.",
      progress: "I'm in Sokcho. Found a spot? Two fish between us.",
      done: "You saw the edit? The cut with the old lady walking past, I'm keeping it. That was the best part." }),

  // ── Ch5 Jeju ──
  'M5-01': E(
    "Unjin Harbour. Arrival procedures for an outside port, and the harbour dues. I handed over the papers and the clerk said something in dialect. I had to ask three times. Do Hyeonsu laughed beside me. In Jeju both the sea and the speech are different. Without the chief's letter it would have taken another day. After tying up I felt the Jeju wind for the first time. The wind is salty.",
    { offer: "Unjin Harbour in Jeju. There's an arrival procedure. Take the letter. Ask three times for the dialect. Don't get angry.",
      progress: "Not arrived yet? Pay the dues and come back.",
      done: "You're in. A congratulations payment for opening Jeju. Enough for the dues and fuel. From here you're the one taking customers.",
      obj: ["Complete the arrival procedure at Unjin Harbour and tie up"] }),
  'M5-02': E(
    "The bulteok. The hearths where haenyeo warmed themselves. Baram taught me the manners of entering someone else's sea. Gather only outside the village fishery rights. I checked three boundary stones and gathered three specimens beyond them. A haenyeo looked at me as she passed. She said nothing. Whether that look was permission or watching, I still do not know.",
    { offer: "It's someone else's sea. Watch for the village rights markers. Only outside them. Three. If a haenyeo is watching, greet her.",
      progress: "Outside the markers, yes? If it's inside, don't. Hands off.",
      done: "A haenyeo saw you. If she said nothing, that's fine. Manners for entering someone else's sea, that's all of it.",
      obj: ["Gather three specimens outside the village fishery markers"] }),
  'M5-03': E(
    "Dodu Harbour. Oh Serin, who says she is a competition hopeful, taught me night lights for swordtip squid. Nineteen. Fast hands. Squid rise under the fish light. A light twitch of the egi and the tentacles wrap. Three of them. Serin compared it with her own record. Still a long way off, she said. Those were the eyes of someone going to a competition.",
    { offer: "Squid! At night with the lights on. Three. I catch ten. You're still a long way off, mister.",
      progress: "Not three yet? Twitch the egi lightly. Hard and they run.",
      done: "Three. Well, slower than me, but... fine. You're entering the competition, right? The qualifier.",
      obj: ["Land three swordtip squid under fish lights on a summer night"] }),
  'M5-04': E(
    "Marine tourism registration. Eight hours of safety training. I have become the one who takes customers. The chief explained the guiding loop. Booking, boarding, the spot, the catch, photos, the review. Not fishing myself but making someone else fish. The first booking came in. I looked at the name and I knew it.",
    { offer: "Register for marine tourism. Eight hours of safety training. Now you're the one taking customers. From booking to review.",
      progress: "Is the training done? Bring the certificate.",
      done: "Registered. Here's a guide bag. Spare customer vests, seasickness tablets, a measuring rule. All in there. It isn't yours, it's the customers'.",
      obj: ["Check the spot you will show guests — two swordtip squid", "Complete marine tourism registration and safety training"] }),
  'M5-05': E(
    "A briefing on the fishing park. Yu Ria asked me to cover both sides. A cable presenter past her prime, but the knack for drawing words out of people is still there. The supporters talk about jobs and the opponents talk about the sea. Both positions have to be written as sound. That is the hard part. I have not decided which side I am on.",
    { offer: "Cover the briefing for me. Both for and against. Don't take a side. That's the hardest part.",
      progress: "You only did one side. The other too. Soundly.",
      done: "You wrote both as sound. That's reporting. The vote makes the conclusion.",
      obj: ["Work the proposed park tideline yourself, three times", "Hear the supporters' case all the way through", "Hear the opponents' case all the way through"] }),
  'M5-06': E(
    "The competition qualifier. I pay the entry fee and read the measurement rules. Namgung Hyeon is at the judges' table. Not the night warehouse keeper, a judge. I put three fish on the measuring board. He measures and records. He said nothing. By the rules. That was his way.",
    { offer: "The qualifier. Entry fee. Read the measurement rules. Three fish. I'm the judge. No favours.",
      progress: "That's not three. Put them on the board. By the rules.",
      done: "Through. By the rules. See you in the final.",
      obj: ["Put three fish meeting the qualifier measurement standard on the board"] }),
  'M5-07': E(
    "Seogwipo egi fishing. Mara teaches me. A friend who says she gave up her dream. Even so, she never gave up the hand that twitches an egi. Autumn night, shallow water. A bigfin reef squid takes the egi. Mara did not cast her own; she only corrected my fall angle. She said she is not entering the competition. Still, tonight she cast.",
    { offer: "...I'll teach you egi. Serin asked me to. I'm not entering. But I'll watch your fall.",
      progress: "Not yet? Shallow water. The fall angle. That's all of it.",
      done: "You got one. ...I cast too, today. Don't tell Serin.",
      obj: ["Land a bigfin reef squid on egi in shallow water on an autumn night"] }),
  'M5-08': E(
    "The final. A winter yellowtail, a big one. Something over eighty centimetres took it. The drag sings and my arms go numb. Fifteen minutes. The moment it came into the net my phone rang. Word that Jeong Okseon had collapsed. I put the yellowtail on the board and went to the boat without hearing the result. Namgung Hyeon packed my competition gear for me. There was a prize set inside it.",
    { offer: "The final. Yellowtail over eighty. That's the standard for this one. Turn your phone off. ...no. Leave it on.",
      progress: "Not eighty yet? The final happens once.",
      done: "...measured. It's your yellowtail. Hear the result later. Go. I'll pack your gear. Your prize is here.",
      obj: ["Land a yellowtail of 80cm or more in the winter final"] }),
  'M5-09': E(
    "The assembly vote. The fishing park motion. They said accumulated reputation and participation feed into it. I was watching the order of the hands when Do Hyeonsu looked over at me. He raised his hand on the same side. The first time. The hand stayed with me longer than the result did. Ulleungdo and Incheon opened up. Jeong Okseon is still in hospital.",
    { offer: "The vote. The fishing park. Your reputation becomes votes. Raise your own hand. Don't read anyone's face.",
      progress: "Stand in the hall. You vote standing.",
      done: "Vote's done. Do Hyeonsu was on your side. Did you see that. Ulleung and Incheon are open. And go to the hospital first.",
      obj: ["Leave a record of participation — five consigned lots before the vote", "Attend the assembly vote and raise your hand"] }),
  'N01-5': E(
    "A daughter who wants to stop diving and a mother who wants to stop her. Baram stood me between the two of them. The border between shore gathering and diving. I gathered three specimens on the Jeju rocks. The mother underwater, me at the edge. The daughter watched both. The decision is hers. Baram only parked his cart and smoked.",
    { offer: "The haenyeo's daughter wants to quit diving. Her mother's against it. Gather with them. At the edge. So the daughter sees.",
      progress: "Three. At the edge. Under the water is her mother's place.",
      done: "The daughter saw. The decision is hers. We just gathered." }),
  'N02-3': E(
    "Tak Saebyeok proposed going after the deep water monster at Seogwipo. The owner of the stone mound. Pacific cod over eighty. It tests the limit of drag control. With the rod Saebyeok cut. When the fish drives for the bottom I tighten, release, tighten. My arms felt like they would come off. What came up was eighty-four. Saebyeok felt the rod tip and laughed that it had not broken.",
    { offer: "Mister, the owner of the stone mound. Cod over eighty. With my rod. It's a drag test. If it breaks that's my fault.",
      progress: "Not yet? Tighten when it drives for the bottom. Loosen and it wraps the rock.",
      done: "Eighty-four! The rod didn't break! It's my rod! I'm telling Grandpa!" }),
  'N03-3': E(
    "The night before the vote Kang Ducheol came to see me. He declared he would not intervene. If a federation chairman touches a cooperative vote, it is not a vote. My teacher will handle it. He said that and took out his seal to show me. He did not stamp it. That day I learned there are seals that go unstamped.",
    { offer: "I wanted to say it before the vote. I won't intervene. If a chairman touches it, it isn't a vote. My teacher will handle it.",
      progress: "Still before the vote. I'll stay out of it.",
      done: "...vote done? Well done. Whichever way. Here's the seal I didn't stamp." }),
  'N05-3': E(
    "Na Gibeom said he is quitting his job. He will live by fishing. Seo Harin could neither stop him nor help him. I listened to his decision. I could have stopped him or helped him. The shop has no customers. Even so he said he will not put the knife down. He will remember what I said.",
    { offer: "...I'm quitting. I'll live by fishing. Harin won't say anything. What will you say.",
      progress: "Haven't heard it yet? Hear all of it. He's already decided.",
      done: "You listened. ...thank you. You tell Harin for me." }),
  'N07-4': E(
    "Jeju egi. Jim Kang's fourth. One bigfin reef squid. He did not cast this time either. Four pieces gathered. He handed all four to me. I didn't look for them to mount them. I looked for them to throw them. I heard the whole story of his brother that day. Thirty years. The four last works went into my tackle box.",
    { offer: "Fourth. Jeju egi. One bigfin reef squid. Then the four are together.",
      progress: "Not yet? Egi is the fall. My brother built them that way.",
      done: "...four. They're all yours. I didn't find them to mount them. I found them to throw them. He'd have said the same." }),
  'N10-2': E(
    "A measurement dispute at the competition. One competitor appealed that his fish was over the standard. Namgung Hyeon called me as a witness. I testified by the rules. I took nobody's side. The competitor was someone I knew. When the testimony ended Namgung Hyeon nodded once. I think I understood a little of why he left competitions twenty years ago.",
    { offer: "Measurement dispute. I need a witness. Say only what the rules say. Even if you know him.",
      progress: "Haven't testified yet? By the rules.",
      done: "You did it by the rules. That's everything a judge wants. Twenty years ago I couldn't." }),
  'N14-1': E(
    "Yu Ria's first location shoot. Assisting the filming. One yellowtail and a composition for broadcast. A cable presenter past her prime comes back to life in front of a camera. I landed the yellowtail behind her and passed it into frame. She held it and laughed. I could not tell whether it was a real laugh or a broadcast laugh. She could have.",
    { offer: "My first location shoot. Assist me, please. One yellowtail. I'll set the composition. It's been a while, I'm nervous.",
      progress: "The yellowtail? Hand it into frame.",
      done: "That's it. I laughed in front of a camera after a long time. Really." }),
  'N14-2': E(
    "I found Mara on the Seogwipo rocks. Oh Serin asked me to. Mara refused a reunion. She sat some distance off while I caught one bigfin reef squid. I did not speak to her. But when I got up to leave she set an egi down at my feet and left. It was Serin's.",
    { offer: "Please find Mara. The Seogwipo rocks. I can't go. She won't see me. Just... be there while you fish for squid.",
      progress: "Did you find her? Don't speak to her. Just be there.",
      done: "...she left an egi? That's mine. That one. She still hasn't thrown it away." }),
  'N14-3': E(
    "Youth team registration. Oh Serin, Mara, and me. Yu Ria as nominal coach. Joint jigging practice, three fish. Mara came. Without a word. Serin left a place open without a word. The three of us jerked side by side. The rhythms were different. By the time the third fish came up the rhythm matched.",
    { offer: "I registered the team! Youth division! Mara will... come. Probably. Joint jigging practice. Three fish.",
      progress: "Three. Match your rhythm between the three of you. Did Mara come?",
      done: "The rhythm matched, right? All three. ...Mara came. She didn't say anything, but." }),
  'N14-4': E(
    "The final. Finishing matters regardless of placing, Serin said. Three swordtip squid. For the final Mara registered under her own name for the first time. From the commentary desk Yu Ria called all three names. Each with their own ending. Serin finished, Mara cast, Yu Ria spoke. I landed three.",
    { offer: "The final. Placing doesn't matter. Finishing does. Three swordtip squid. Mara registered. Under her own name.",
      progress: "Three. Just finish. Don't look at the placings.",
      done: "Finished! All three of us! ...Mara cast. Under her own name. That's the ending." }),
  'N18-5': E(
    "The night before the fishing park vote, Do Hyeonsu came with the opposition's material. If you're right then I've lost, he said. He brought it anyway. The two of us sorted both cases through the night. He organised the case against and I organised the case for. At dawn neither of us said which side we were on. We would find out at the vote.",
    { offer: "The opposition's material. If you're right then I've lost. ...let's sort it together anyway.",
      progress: "Not finished? You take the case for. I'll take the case against.",
      done: "...done. See you at the vote. Which side comes out then." }),
  'N06-4': E(
    "The Seabusters are disbanding. Graduation. They named me as the opponent for the last match. Go Hosu still turns up with a basketball. I went back to Busan and landed two in the match. Mo Taejo said it was the last one and shared out his lure box among the juniors. There was a share for me. As an honorary member.",
    { offer: "We're disbanding. Graduation. You're the opponent for the last match. Come to Busan. Hosu'll bring the basketball.",
      progress: "Two fish. It's a match. No holding back.",
      done: "...I lost. Or did I win. Doesn't matter. Take this. The honorary member's share." }),
  'N08-4': E(
    "Ko Manseok mentioned retirement for the first time. He is thinking of putting the boat up. Ko Haena said nothing. I went back to Ulsan and listened to the skipper. That day's fishing was the best of the year. The skipper did not smile at it. He looked at the boat for a long time.",
    { offer: "...I'm thinking of putting the boat up. First time I've said it. Haena doesn't know. No, she'll know. Come and listen.",
      progress: "You're here. Sit. Good fishing today. That's the problem.",
      done: "...you heard it. Nothing's decided. But saying it is half of it." }),
  'N13-3': E(
    "The winter of eighty-one. Old Song Gibaek's stove is broken and he will not ask anyone to fix it. The writer on deadline said it for him. I went back to Sinjindo in Taean and worked on the stove. One part. When the fire caught, the old man warmed his hands. There was no thank you. Instead he made one more place for me in front of the photograph.",
    { offer: "Grandpa's stove is broken. He won't say it. So I'm saying it. Will you fix it?",
      progress: "The stove? It's one part. Probably.",
      done: "The fire caught. Grandpa warmed his hands. He won't say thank you... he made another place instead." }),
  'N12-3': E(
    "Jeong Umi's camper has been parked at the hotel lot for half a year. Oh Gayun sits in front of it after her shift. I went back to Yeosu and the three of us went night fishing. We sat on the breakwater. No hairtail took. Umi said, I think this van can stay still now. Gayun said nothing. She smiled.",
    { offer: "The camper's been here half a year. It's Umi's. I sit in front of it after work. ...let's go night fishing, the three of us.",
      progress: "Haven't gone out? The three of us. It's fine if the hairtail don't take.",
      done: "...Umi said it. That it can stay still now. I smiled." }),
  'N21-5': E(
    "A huge brown shadow passes under the surface. Nomura's jellyfish. One of them goes over a hundred kilos. It took twenty minutes to hook and drag it in. I nearly took a tentacle to the arm. Oh Sechan checked my gloves and checked my arm. It's fine. He said it three times. One of them. That was all of it, and that was everything.",
    { offer: "See the brown shadow. That's a Nomura. Over a hundred kilos. Just one. Don't get stung. Two layers of gloves.",
      progress: "Not yet? It takes twenty minutes. Slowly.",
      done: "Are you all right? Show me your arm. ...it's fine. One of them. That's everything." }),
  'N23-4': E(
    "Closed-season fish just need measuring and returning. The record stays and the animal lives. That is Chae Surim's line. Five times. Measure with a rule and release. Five lines pile up in the record book. A day I went out to fish and let five go. Strangely my heart was lighter than on days with a catch.",
    { offer: "Closed-season fish, measure and return them. Five times. The record stays and the animal lives.",
      progress: "Five times. With a rule. Eyeballing doesn't become a record.",
      done: "Five lines. In the record. And the animals lived." }),
  'N20-4': E(
    "A closed-season fish took the hook. Yu Harang said, just hold it a second, only for the shot. I could have held it or refused. I measured it and released it immediately. The camera caught that. I said why. Harang uploaded it without cutting that part. That stayed longer than the view count.",
    { offer: "Ah, closed season... just hold it a second. Only for the angle. It'll be quick.",
      progress: "You released it? ...yes. I know. That was my fault.",
      done: "I didn't cut that part. You saying why. That stayed longer than the views." }),
  'N22-4': E(
    "Are you going to buy chum ingredients every time, Hanui asked. One row of corn lasts a season. I planted one row in the plot. Soil gets under my nails. It felt strange for an angler to be handling soil. She checked what I had planted and wrote down the watering times. A plot timetable appeared next to the tide table.",
    { offer: "Are you buying chum ingredients every time? One row of corn lasts a season. Plant some.",
      progress: "Planted it? One row. Water in the morning.",
      done: "You planted it. I'll write down the watering times. Pin it next to your tide table." }),
  'N22-5': E(
    "An ornamental tank is not for selling or eating. You just keep it and look at it. Hanui's words. I put a tank at the window of the house. I could not decide what to put in it and looked at an empty tank for a day. A tank with only water in it was strangely good. She said, empty is also something you put in.",
    { offer: "An ornamental tank. Not for selling or eating. Just to keep and look at. Put it at the window.",
      progress: "Put it in? Take your time deciding what goes in it.",
      done: "It's empty? Empty is also something you put in. Some people look at it that way." }),

  // ── Ch6 Ulleung / Incheon ──
  'M6-01': E(
    "Ulleungdo. The ferry was cancelled. A night I cannot go back. Only the light of Oh Sera's night convenience store is on. I get through one night on the island. Cup noodles and a stove. Sera cleaned her rod during the hours with no customers. So did I. Without the cancellation this night would not exist.",
    { offer: "Cancelled. You're not getting out today. Sit here. I'll leave the stove on. Cup noodles are self-serve.",
      progress: "It's still night. There may be no boat in the morning either.",
      done: "You survived. One cancelled night. That's what the island is like. You're half an Ulleung person now.",
      obj: ["Arrive at Ulleungdo", "Get through a night stranded by a cancelled ferry"] }),
  'M6-02': E(
    "Amberjack. Yeon Taeo taught me popping. He said he is a hidden apprentice. He did not say whose. A big pelagic splits the surface and takes the popper. The drag screams. Taeo said not one word beside me. After the landing he said, my teacher taught me that way. By not speaking.",
    { offer: "Popping. Amberjack. On the surface. I won't speak. My teacher taught me that way.",
      progress: "Not yet? A popper gets taken on the pause. Not on the throw.",
      done: "...you landed it. It worked without me speaking. Who my teacher is... another time.",
      obj: ["Land an amberjack on a popper in summer or autumn"] }),
  'M6-03': E(
    "The lighthouse. Old Seok Daeyang records the weather. Wind speed, wave height, visibility. Written by hand on paper. When he heard my name he looked at me for a long time. He asked whether I knew Skipper Ko Jintae. That is my father's name. He remembered my father. A boat that passed this lighthouse twenty-two years ago. I could not say anything.",
    { offer: "...what did you say your name was. Are you Skipper Ko Jintae's son. Sit down. Help me with the weather log, and let's talk.",
      progress: "You haven't heard all of it. We'll talk when the log is done.",
      done: "...that boat, twenty-two years back, it passed right out there. I saw it. This lantern belongs to the lighthouse. Your father saw this light too.",
      obj: ["Land one amberjack below the lighthouse", "Help lighthouse keeper Seok Daeyang with the weather log and hear his story"] }),
  'M6-04': E(
    "Incheon coastal pier. Manager Dan Cheolho explained the distribution chain. Origin labelling, wholesale, retail. The road by which something caught in the East Sea is sold in a West Sea market. Black rockfish over thirty centimetres. An autumn night. The manager said he was just dropping by on his way home and stayed two hours. Incheon opened up.",
    { offer: "First time in Incheon. The coastal pier. It's all distribution here. Black rockfish over thirty. At night. I'll just look in on my way home.",
      progress: "Not yet? Night rockfish. Inside the pier.",
      done: "Over thirty. Incheon's open. A minute turned into two hours. It always does.",
      obj: ["Land a black rockfish of 30cm or more at the coastal pier on an autumn night"] }),
  'M6-05': E(
    "A hospital room. Jeong Okseon is lying there. The care schedule presses on my trips out. Hospital systems, guardian signatures, medication times. She pulled the last volume of the log from under her pillow. It was your father's. You write the rest. My hands shook. Hers did too.",
    { offer: "...you came. Sit. It's under the pillow. The log. The last volume. It was your father's. You write the rest.",
      progress: "Haven't taken it? Under the pillow, I said.",
      done: "You took it. It's yours now. I should sleep a while. The ice... you carry it.",
      obj: ["Haul Manbok Store ice three times for the hospital bills", "Visit Jeong Okseon in hospital and receive the last volume of the log"] }),
  'M6-06': E(
    "I sit at the Manbok Store stall for the first time. In her place. Stock, customers, prices. Three days. On the first day a customer recognised me and asked where the old woman was. On the second I quoted a price wrong. On the third I watched the stall while carrying ice. The trainee is minding the stall. That line went round the harbour.",
    { offer: "The stall, you mind it. Just three days. Stock, customers, prices. Get a price wrong and the customers will teach you.",
      progress: "That's not three days. Got a price wrong, I hear. It's fine.",
      done: "Three days. You saw what a stall is. Now you know why carrying ice came first.",
      obj: ["Build three consigned lots as goods for the stall", "Run the Manbok Store stall for three days"] }),
  'M6-09': E(
    "Ko Manseok decided to put the boat up. He called me as the customer for the last trip. Do you remember where you sat the first time you came aboard. The bow. I sat there. Ko Haena stood in the wheelhouse. The skipper sat on deck and looked at the sea like a customer. The Goraemaru's last trip. I did not record the catch.",
    { offer: "I'm putting the boat up. It's the last trip. Come as a customer. Do you remember where you sat the first time.",
      progress: "Not here yet? It's the last one. Haena takes the wheel.",
      done: "...it's over. The Goraemaru. Haena ran her. I was a customer. So were you.",
      obj: ["Return to Bangeojin in Ulsan", "Board the Goraemaru's last trip as a customer"] }),
  'M6-07': E(
    "Passage plan approval. Weather, maintenance, contingency documents. The last qualification for the long passage to Dokdo. The chief turned the pages one at a time. He flagged one item in the contingency plan. Fuel reserve. I recalculated. The approval stamp went on. What is left is the permit.",
    { offer: "File a long passage plan. Weather, maintenance, contingency. On paper. Dokdo is a sea you reach on paper.",
      progress: "The fuel reserve in the contingency plan. Recalculate it. It's short.",
      done: "Approved. The last qualification. All that's left is the survey escort permit.",
      obj: ["Put together three items of emergency stores", "Get the long passage plan documents approved"] }),
  'M6-08': E(
    "The survey escort permit. Three gates. Level 160, marine tourism registration, Part 6 complete. Escorting the Dokdo academic survey team. The last gate opened. The chief handed me a voyage bag. This is the last thing the cooperative gives you. From now on you are the one giving to the cooperative.",
    { offer: "Survey escort permit. Three gates. Level, marine tourism, Part 6 complete. Fill all three and it's Dokdo.",
      progress: "Your level isn't there yet. Get out on the water. Come back when it is.",
      done: "Permit granted. Dokdo. This bag is the last thing the cooperative gives you. From now on you're the one giving.",
      obj: ["Reach level 160 and meet the survey escort requirement"] }),
  'N01-6': E(
    "A night on the island with a business traveller stranded by the cancellation. Baram brought him to the convenience store. He was a man with a lot of luggage. I can travel light now, Baram said, and gave me his mountain backpack. The cart man is reducing his load. I think I will find out what that means in the next chapter.",
    { offer: "A traveller's stuck here from the cancellation. Stay the night with him. And take this bag. I can travel light now.",
      progress: "It's still night. Listen to him.",
      done: "Morning. He got his boat. The bag is yours. Me... I'll see you at the next harbour." }),
  'N05-4': E(
    "Seo Harin was transferred to Incheon. We met again at the coastal pier. No camera. We landed one black rockfish at night. The second winter. She said, Gibeom's shop has customers now. They came after seeing the video I shot. The dull one. I laughed. So did she.",
    { offer: "I've been transferred to Incheon. The coastal pier. Let's meet without a camera. One rockfish.",
      progress: "The rockfish? It's night. It goes better with no camera, doesn't it.",
      done: "Gibeom's shop has customers. From my video. The dull one." }),
  'N15-1': E(
    "Oh Sera refused to fish together. I like being alone. We agreed to compete without trespassing on her spot. Manner distance. One amberjack. I cast a hundred metres away. She landed first. Then she raised a hand once. The distance was kept and the greeting was exchanged.",
    { offer: "I like being alone. No fishing together. Let's compete instead. Don't trespass on my spot. Manner distance.",
      progress: "Not yet? You're keeping the distance. That's enough.",
      done: "...I raised my hand. You saw. And the distance held. That's the manner." }),
  'N15-2': E(
    "I ran into Yeon Taeo at night. He was fishing in hiding too. Behind Sera's back. The moment we met was a comedy. Both of us going shh. In the end we joined up for the night. Two amberjack. A night we nearly got caught. Sera said nothing at the store the next day. With a face that knew everything.",
    { offer: "Shh. Don't tell Sera. I snuck out too. ...let's do it together. At night. Two amberjack.",
      progress: "Two. Quietly. You can see the store lights.",
      done: "Did she catch us... no, she didn't. Probably. Sera saying nothing is the scarier part." }),
  'N16-1': E(
    "Seok Dokgu, twelve. Mainlanders can't catch them. He challenged me to a rockfish match. Bait sourced locally. The boy digs something out of the rocks and threads it on a hook. Three rockfish. He filled his three first. I lost. The boy held out an old Saiso reel. Passing it down, he said. From the winner to the loser.",
    { offer: "Mainlanders can't catch them. Rockfish match. Three. Get your bait here. Shop-bought is cheating.",
      progress: "Not three yet? I've already got three. What bait did you use?",
      done: "I won. Take this reel. It's old but it works. The winner gives it, that's how our island does it." }),
  'N16-2': E(
    "Dokgu came with a letter. A letter for his grandfather. An errand up to the lighthouse. The boy did not answer when I asked why he would not go himself. I walked all the way up. Old Seok Daeyang read the letter and stood there a long time. His grandson's handwriting. That day the old man began to talk about my father for the first time.",
    { offer: "A letter for Grandpa. To the lighthouse. I can't go. Don't ask why. Just take it.",
      progress: "Haven't gone? The lighthouse. On foot. There's no boat.",
      done: "...he read it? What did he say. No, don't tell me. It's fine." }),
  'N17-1': E(
    "Manager Dan Cheolho's twenty-minute fishing on the way home. One fish. It goes to his regular restaurant for free. Not sold. Landing one fish in twenty minutes is less fishing than habit. He said that habit got him through ten years. The restaurant owner took the rockfish and left the manager's seat open.",
    { offer: "Twenty minutes on the way home. One fish. Give it to the restaurant. Can't sell it. Ten years of that habit.",
      progress: "Twenty minutes up? One fish. If not, tomorrow.",
      done: "You gave it to the restaurant. Not sold. That's Article 3. The manager's seat is always open." }),
  'N17-2': E(
    "The day of Ha Minji's recital. She came to the breakwater carrying a cello case. A catch party. Two black rockfish. Fishing before a recital. She said, it loosens my hands. The two of them volunteered to play at the reopening ceremony. Cello and the manager's harmonica. I wrote that down. I think I will need it in Part 7.",
    { offer: "The recital's today. Fishing before it. It loosens my hands. Two rockfish. Let's have a catch party.",
      progress: "Two. Three hours until the recital.",
      done: "My hands are loose. The reopening? We'll play. With the manager's harmonica." }),
  'N18-6': E(
    "Incheon wholesale market. Do Hyeonsu caught an origin labelling violation. Not a chief's grandson's eyes, an inspector's. We verified one case together. He taught me the order in which to read a label. He said he is preparing for the inspector exam now, not brokering in Busan. Both of us were turning into different people.",
    { offer: "There's an origin violation here. Look. The label order. I'm sitting the inspector exam. ...check it with me.",
      progress: "One case. Start with the label. See it?",
      done: "One case verified. That's an inspector's eye. Not a chief's grandson's." }),
  'N19-5': E(
    "The corridor of the hospital where Jeong Okseon is admitted. Old Tak cannot go in and stands leaning on the wall. In his hand is the third rest. I sent the old man into the room. There was no method. I just told him to open the door and go in. He went in. The door closed. I waited in the corridor. Ten minutes, fifty years later.",
    { offer: "...the room. I have to go in. This, the third one. I have to go in.",
      progress: "Did he go in? Still in the corridor?",
      done: "...he went in. Ten minutes. After fifty years. You opened the door." }),
  'N03-7': E(
    "Kang Ducheol turned up at the Incheon distribution floor. This time he did not play the beginner. Instead he stood behind me and watched. I explained one distribution route. Where it was caught and where it is sold. He neither nodded nor shook his head. When I finished he said, my teacher has grown up.",
    { offer: "This time I'll stand behind you. One distribution route. You explain it. I'll only listen.",
      progress: "Haven't explained it? From the start. Beginning with where it was caught.",
      done: "...my teacher has grown up. The day has come when a chairman learns." }),
  'N10-4': E(
    "Namgung Hyeon is leaving the warehouse. His last night shift. Before turning off the lights he took out his own rod for the first time. The Pohang pier. One fish each, side by side with a legend. His casting made no sound. Far enough that I could not see where the line went. Mine made a sound. He said, sound is fine. Twenty years ago mine made a sound too.",
    { offer: "Last shift. Before I turn the lights off... I'll take out the rod. Cast beside me. One fish.",
      progress: "Not yet? Side by side. Sound is fine.",
      done: "...one each, side by side. That's it. Lights off on the warehouse. Next is the judges' table." }),
  'N17-3': E(
    "Manager Dan Cheolho brought his whole team out. Thirty minutes of fishing with twelve people is a staff dinner. Three fish in thirty minutes. Half the team had never held a rod. I spent fifteen minutes handing out rigs. Three fish in the remaining fifteen. The manager played his harmonica.",
    { offer: "I brought the whole team. Twelve people. Thirty minutes. Three fish. This is a staff dinner, not fishing.",
      progress: "Thirty minutes. Three fish. Handing out rigs counts inside the thirty.",
      done: "Three! In fifteen minutes! Staff dinner successful. You heard the harmonica." }),
  'N21-6': E(
    "A swarm of Nomura's jellyfish came into the Ulleung waters. The kind that tears nets. There is no method but clearing them one at a time. Three of them. Oh Sechan counted from the boat. What we cleared and what was left. What was left was more. Still, three is three.",
    { offer: "A Nomura swarm at Ulleung. They tear nets. One at a time. Just three. There's no other way.",
      progress: "Three. Twenty minutes each. That's an hour.",
      done: "Three. More left than cleared, yes. But three is three." }),
  'N23-5': E(
    "Write down how many species you saw, not how many fish you caught. Chae Surim's words. The field guide becomes the survey sheet. Forty species. I opened the guide and counted. Short. I spent days off Incheon looking for species I had not seen. I filled the fortieth and handed over the sheet. What was left was species, not numbers.",
    { offer: "Not how many fish, how many species. Forty in the guide. That's the survey sheet. Fill it and hand it over.",
      progress: "Not forty yet? Look for species you haven't seen. Incheon has many.",
      done: "Forty species. That's a survey sheet. Species left behind, not numbers." }),
  'N20-5': E(
    "A few subscribers came all the way to Ulleung. Yu Harang turned the camera off. I just want to fish today. Three fish, no camera. The subscribers held rods too. Afterwards we ate together. In front of the convenience store. Harang said, this is what offline is. There is no footage to upload, and there is something left.",
    { offer: "Some subscribers came all the way to Ulleung. I'll turn the camera off. Let's just fish today. Three fish. And eat together.",
      progress: "Three. No camera. Comfortable?",
      done: "This is offline. Nothing to upload, and something left over." }),
  'N22-6': E(
    "Word is there is something still worth taking at an abandoned quarry near Incheon. Hanui told me to go and look. I dug out minerals. Not lead for sinkers, something else. She suggested splitting what I dug. Half the workshop, half me. Calling it a vein was an exaggeration, but it covered a season of sinkers.",
    { offer: "They say there's something left at the abandoned quarry near Incheon. Go and see. We split what you dig. Half and half.",
      progress: "Did you dig? Half and half. If it's heavy bring only half.",
      done: "A vein was an exaggeration. Still, a season of sinkers. Half and half." }),

  // ── Ch7 Dokdo ──
  'M7-01': E(
    "Dokdo. Berthing at the east islet. The farthest sea. The weather gate closed twice and opened on the third. Three hours ashore. Old Seok Daeyang gave the berthing signal by radio from the lighthouse. I tie up and set foot on the rock. The end of the sea my father passed twenty-two years ago. I came this far.",
    { offer: "Berthing at Dokdo. A weather gate. Go when it opens. Three hours ashore. I'll signal from the lighthouse.",
      progress: "The gate's closed. Wait. Until the sea opens it.",
      done: "You berthed. Three hours. It's the end of the sea your father passed. Look at it properly.",
      obj: ["Berth at Dokdo's east islet when the weather gate opens"] }),
  'M7-02': E(
    "The survey boat. The first fishing where catching is not the point. Measure the specimen and release it at once. Three fish. Measure with a rule, photograph, let go. A student from the survey team records it. Fishing where the angler does not fish. My hand was strangely light letting the third one go. I still do not know how to write this day in the log.",
    { offer: "This is a survey boat. Not catching. Measure and release. Three fish. The team records them.",
      progress: "Three. Measure then release. Don't open the cooler.",
      done: "Three released. That's a survey. How you write it in the log is yours to decide.",
      obj: ["Measure three specimens and release them at once"] }),
  'M7-03': E(
    "The seventeenth page. The log's completion check. Measure a striped beakperch and release it. Seok Dokgu was beside me. Twelve years old, as a survey assistant. A striped beakperch came up. The bands are sharp. I measured, the boy photographed, and we let it go. Seventeen pages filled. I closed the log my father began. No — I opened it.",
    { offer: "Mister, it's the seventeenth page. Striped beakperch. I'll take the photo. Measure and let it go. Then it's done.",
      progress: "Not yet? Striped beakperch. Summer and autumn. Under the rocks.",
      done: "Took it! Let it go! Seventeen pages! ...why are you crying, mister. No, you're not. All right.",
      obj: ["Measure and release a striped beakperch at Dokdo in summer or autumn"] }),
  'M7-04': E(
    "The awning in the photo. The stall in the picture of me at four was Manbok Store. Jeong Okseon looked at the photo from her hospital bed. That awning is mine. Twenty-two years ago you stood right there. A memory. The day she first saw me was twenty-two years ago. I did not know and she did. If you're going to cry, carry the ice first. Now I know why that line came so fast.",
    { offer: "Bring the photo. That one. ...that awning is mine. Twenty-two years ago. You were standing right there.",
      progress: "You've seen the photo. Sit. It's a long story.",
      done: "...that's why I told you to carry the ice first. I thought that child from twenty-two years ago had come back.",
      obj: ["Land one flounder from the same spot as when you were four", "Look at the photo from when you were four together with Jeong Okseon in the hospital room"] }),
  'M7-05': E(
    "The second floor. The cooperative's communal workshop has been in ruins for a long time. Restoration. Materials, labour, donations. Thirty million won. Looking at the balance I worked out what to sell, what to burn and what to accept. The members each put in a little. Do Hyeonsu first. When thirty million was gathered the chief said, now you are the one giving.",
    { offer: "Restoring the second floor. Materials, labour, donations. Thirty million. You gather it. The members will help. As much as you gave.",
      progress: "Not thirty million yet. Get on the boat. Take customers. The members are watching.",
      done: "Thirty million. Good. Now you're the one giving. You remember what I said in Part 6.",
      obj: ["Raise thirty million won for the restoration fund"] }),
  'M7-06': E(
    "Reopening. An archive and a tackle room in one. Jeong Okseon finished her convalescence and attended in a wheelchair. I put the scissors for the ribbon in her hand. Her hand shook. She cut it. Applause. Old Tak stood at the back. Three bamboo rests sit at the entrance to the archive. There was the sound of a cello and a harmonica.",
    { offer: "The reopening. I cut the ribbon. A wheelchair is fine. Put the scissors in my hand. My hand shakes but it cuts.",
      progress: "Ceremony not started? Everyone's here.",
      done: "...I cut it. You saw. This room is yours now. No — everyone's. I'm going back to the stall.",
      obj: ["Slice three plates for the opening table", "Attend the reopening and watch Jeong Okseon cut the ribbon"] }),
  'M7-07': E(
    "The last cast. The Dokdo survey waters have been permanently opened. I hold my father's reel rod, brought back by Tak Saebyeok. New bamboo has been joined onto the broken section. The boy cut it. I cast. Into the sea my father passed twenty-two years ago. One fish came up. I do not write down the species. This is not a survey, it is fishing.",
    { offer: "Mister. The rod. Grandpa let go and I finished it. Cast with this. At Dokdo. The last one.",
      progress: "Not yet? The Dokdo survey waters. They're open. Cast.",
      done: "...it came up. With that rod. With the joint I made. Mister, is this my rod or your rod?",
      obj: ["Land one fish at the Dokdo-only spot with the restored heirloom reel rod"] }),
  'M7-08': E(
    "A trainee. A twenty-two-year-old with one backpack is standing in front of the stall. Looking at me. With a face about to cry. I pointed at the ice boxes. If you're going to cry, carry the ice first and cry after. That line came out of my mouth. Twenty-two years ago the old woman said it to me, and before that someone said it to her. The log starts again here.",
    { obj: ["Reach level 199 and hand the first page of the log to the next person"],
      epi: "The ice boxes are heavy. That one will know it soon. That you need even this much money to start anything at all." }),
  'N01-7': E(
    "Baram told me his real name. He was a skipper who lost a boat and people thirty years ago. He went round the country's harbours with a cart looking for the families of the people he lost. He never gave his name because the name was heavy. He sat down for the first time at the reopening. Cart parked outside. That seat was the first seat he has taken.",
    { offer: "...I'll tell you the name. I lost a boat thirty years ago. And people. The cart was for finding their families. I'll sit at the reopening. For the first time.",
      progress: "It's before the ceremony. I'll sit. Cart stays outside.",
      done: "I sat. After thirty years. Thanks to you. The wind blew the right way." }),
  'N02-4': E(
    "The last bamboo. Old Tak let go and Saebyeok finished it. My father's broken reel rod came back to life. New bamboo joined onto the broken section, and the joint is invisible. The old man only watched from a corner of the workshop. The boy handed me the rod. The rod to cast at the end of Part 7. My hand shook taking it.",
    { offer: "Mister. It's done. Grandpa let go and I did it. You can't see the joint. Take it. Cast it at Dokdo.",
      progress: "Haven't taken it? It's right here. Take it.",
      done: "You took it. Grandpa saw. He said nothing. That's his highest praise." }),
  'N03-4': E(
    "Teachers' Day. Kang Ducheol is retiring. He left number one on the membership roll empty. The federation supplied the materials for the second floor. A retirement greeting. He came with his rig tangled, like the day we first met on the breakwater. I worked it loose. Ten minutes. He laughed. Teacher, that was the last lesson.",
    { offer: "I'm retiring. I left number one on the roll empty. It's your seat. The federation covers the materials. And... this rig. It's tangled.",
      progress: "Not loose yet? Ten minutes should do it.",
      done: "You got it loose. That was the last lesson, teacher. It's Teachers' Day today." }),
  'N05-5': E(
    "The first booking after the reopening is two people. Seo Harin and Na Gibeom. The first friends I take out for money. Writing their names on the list felt strange. On the boat Harin turned the camera on. This time she asked first. Gibeom cut sashimi. Two customers cut sashimi and gave it to the skipper. I charged the list price. Because that is the rule.",
    { offer: "First booking! The two of us! We're paying. List price, because we're friends. The camera... I'll ask.",
      progress: "Haven't gone out? It's the booking time.",
      done: "We paid list price. Because we're friends. And he cut the sashimi. You're a real skipper now." }),
  'N10-3': E(
    "The reopening tournament. Namgung Hyeon took the judge's seat. He stands at a competition for the first time in twenty years. Before sitting down he called me over and handed me the rulebook. It's your tournament. You set the rules. I only measure. He pinned on a judge's badge. An old one. There is no warehouse key any more.",
    { offer: "Judging. I'll take it. First time in twenty years. You set the rules. It's your tournament. I only measure.",
      progress: "Rules set? Set them and I'll take the table.",
      done: "...tournament's over. The judges' table after twenty years. I took nobody's side. Not this time." }),
  'N16-3': E(
    "Dokgu's first sea. Riding along as a survey assistant with a guardian's consent. His grandfather's last shift change. A twelve-year-old aboard a survey boat. Measure a striped beakperch and release it. The boy held the rule. His grandfather called in on the radio. Change of watch. The boy spoke into the handset. Grandpa, I measured a beakperch. The old man was a long time answering.",
    { offer: "Mister! I'm going on the survey boat! Grandpa said yes! Measure a beakperch and let it go. I'll do the measuring. It's Grandpa's last shift.",
      progress: "Not yet? A beakperch. I'll hold the rule.",
      done: "Grandpa... isn't answering. On the radio. ...no, he did. He said well done. That's the first time." }),
  'N18-7': E(
    "Preparing the reopening. Do Hyeonsu carries chairs. It isn't opening under your name. It's opening under our name. He said our for the first time. The two of us carried a hundred chairs. The man who clicked his tongue at me on the breakwater at twenty. Setting down the last chair he said, sit. We carried them, after all.",
    { offer: "Carry the chairs. A hundred. It isn't opening under your name. It's opening under our name.",
      progress: "That's not a hundred. Carry them with me.",
      done: "...a hundred. Sit down. We carried them, after all." }),
  'N19-6': E(
    "Jeong Okseon finished her convalescence and came out to the stall in a wheelchair. The three bamboo rests are lined up. Old Tak sits in the next seat. I made a place for the two of them. Two chairs, between the ice boxes. Neither said anything. Fifty years to hold a hand. I pretended not to see that hand.",
    { offer: "...I'm out at the stall. They say Tak is coming. A place, could you. No, never mind. Make a place for us.",
      progress: "Did you make it? Two. Between the ice boxes.",
      done: "...we sat. We held hands. You pretended not to see. Good lad." }),
  'N04-6': E(
    "The graduated members. Bae Nuri is in her final year at the fisheries high school, Ha Sua at university, Mo Jinju works a boat. The three of them came to the reopening carrying the club flag. Cheongcho High Breakwater Club. Catch it and eat it. We hung the flag on the second floor. Jinju spoke to me first for the first time. I'm on a boat. Not yours, though.",
    { offer: "Hey! We're here! With the flag! Hang it on the second floor. Jinju's on a boat. Not yours, she says.",
      progress: "Haven't hung it? Second floor. Somewhere it shows.",
      done: "It's up! Catch it and eat it! You're our adult member. Forever." }),
  'N16-4': E(
    "Dokgu's first apprentice. A twelve-year-old teaching a survey student the rocks. Don't step there, it's slippery. The teaching face is familiar. It is my face. Jeong Okseon to me, me to Dokgu, Dokgu to the student. The two of them measured and released two fish. What I was given goes straight across.",
    { offer: "Mister, I've got an apprentice. The survey guy. I'm teaching him the rocks. Measure and release two with us. I'll teach him.",
      progress: "Two. With my apprentice. You just watch.",
      done: "Released! My apprentice is good. Because I taught him. ...exactly the way you taught me." }),
  'N14-5': E(
    "Jeju again. Oh Serin is on the tournament committee now. Mara holds a camera and Yu Ria sits at the commentary desk. All three stayed in their own way. I heard the opening declaration. Serin took the microphone and said, placing does not matter. Finish. Mara filmed it. Yu Ria commented, I taught her that line.",
    { offer: "Mister! I'm on the committee! Come and hear the opening! Mara's on camera, Ria's on commentary. All three of us stayed.",
      progress: "Not here yet? Ten minutes to the opening.",
      done: "You heard it? Placing does not matter. Finish. I said it. Me." }),
  'N21-7': E(
    "An overflowing sea. Oh Sechan leaves a last record before retiring. It has to stay as numbers or the next person cannot act. Dokdo. Two Nomura, ten moon jellyfish. Cleared, counted, written down. He handed over the observation records. Fifteen years of them. The next person was me.",
    { offer: "It's my last. Retiring. A last record at Dokdo. Two Nomura, ten moon jellies. It has to stay as numbers or the next person can't act.",
      progress: "Not yet? Two and ten. Counting as you go.",
      done: "I'll hand over the records. Fifteen years of them. The next person is... you." }),
  'N23-6': E(
    "What to leave. The survey sheet goes to the next person. Chae Surim told me to leave the last page empty. For you to write what you saw. I made one plate to leave in the record. Not something measured and released at Dokdo, something eaten. One plate. She photographed it and pasted it into the sheet. The last page is empty.",
    { offer: "The sheet goes to the next person. Leave the last page empty. For you to write what you saw. Before that, one plate. A plate for the record.",
      progress: "The plate? A plate to eat. Not a survey.",
      done: "I pasted the photo. I left the last page empty. It's yours." }),
  'N20-6': E(
    "The last live stream. Yu Harang said he would broadcast from Dokdo. Knowing the signal drops there and nobody will watch. I went along on the Dokdo trip. One fish during the stream. Zero viewers. Harang spoke to the camera anyway. You do it even when nobody sees. That was my channel.",
    { offer: "I want to go live from Dokdo. The signal drops. Nobody will watch. I know. Even so. Come with me.",
      progress: "We're live. Zero viewers. One fish.",
      done: "Zero. You saw. I did it anyway. You do it even when nobody sees. That was my channel." }),
  'N20-7': E(
    "A video with no subtitles. The one uploaded with no editing and no subtitles lasted the longest. Harang is going to the next harbour. He asked me to pick one cut for the video. I picked it. That moment at Dokdo with zero viewers. Harang put that cut at the end. I heard about the next harbour. He has not decided where it is.",
    { offer: "I'm going to the next harbour. I haven't decided where. Pick one cut for the last video. I'll upload it with no subtitles.",
      progress: "Picked a cut? Just one.",
      done: "That cut. Zero viewers. I put it at the end. At the next harbour... no, I won't say." }),
  'N22-7': E(
    "Seeds. Hanui handed me a seed packet. Find somewhere to plant them yourself. I planted seeds received at Dokdo in the Sokcho plot. The packet does not say what will come up. I promised a harvest. That whatever comes, I will bring it to the workshop. She said, come even if nothing comes up.",
    { offer: "Seeds. Find somewhere to plant them yourself. What comes up... I don't know either. Bring it when you harvest. And come if nothing comes up.",
      progress: "Did you plant them? Where? Never mind, I won't ask.",
      done: "You planted them. A harvest promised. Come even if nothing comes up. That's the promise." }),
  'N22-8': E(
    "Home. When I first came it was a room I only slept in. Now it is a place to come back to. I finished the room. A chair, a tank, the window, and a shelf for the log. A housewarming. Hanui came. Jeong Okseon came in her wheelchair. Old Tak brought one more rest. The fourth. For this house, he said.",
    { offer: "Finish the house. If it's a place to come back to, that's a housewarming. I'll come. Call everyone.",
      progress: "Finished it? What about the shelf. For the log.",
      done: "It's a home. A room you only slept in. Did you see the fourth rest? From Tak." }),
};
