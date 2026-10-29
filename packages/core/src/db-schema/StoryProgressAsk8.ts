/**
 * @file StoryProgressAsk8.ts
 * @description 287차 — 진행 중 물음(목표마다 물음 · 내 답 · 조언) — 동명항 어촌계 · 유리아 · 이수연 편.
 */
import { pa } from './StoryProgressAskKit.js';
import type { ProgressAskDef } from '../types/Story.js';

export const PROGRESS_ASKS_8: Record<string, ProgressAskDef[]> = {
  // ── 동명항 어촌계 ──
  'M1-10': [
    pa(['공동작업은 하루 다 채웠나?', 'Did you put in the full day of communal work?'],
      ['…아직 다 채우지 못했습니다.', '...Not the full day yet.'],
      ['양망 보조부터 시작해. 미역 정리까지 거들어야 하루를 채운 거다.', "Start by helping haul the nets. It isn't a full day until the seaweed's sorted too."]), // 0 — 공동작업 하루
    pa(['창고 뒤 자전거는 타 봤나?', 'Have you ridden that bike from behind the shed?'],
      ['…아직 타 보지 못했습니다.', "...I haven't ridden it yet."],
      ['고쳐서 타 봐. 걸어서 돌기엔 이 항구가 너무 넓다.', "Fix it up and ride it. This harbour's too big to cover on foot."]), // 1 — 자전거 페달
  ],
  'M1-11': [
    pa(['총회에 설 만큼 몸은 만들었나?', 'Have you built yourself up enough to stand at the assembly?'],
      ['…아직 몸이 덜 됐습니다.', "...I'm not there yet."],
      ['서류 네 장만으론 못 선다. 바다에 더 나가서 몸으로 채우고 다시 와.', "Four papers won't stand you up there. Get out on the water, earn the rest, then come back."]), // 0 — 몸 만들기
    pa(['총회장에 설 준비는 됐나?', 'Ready to stand in the assembly hall?'],
      ['…조금 더 추스르고 서겠습니다.', '...Let me collect myself a little first.'],
      ['서류 네 장 챙기고, 백팔십 일 동안 한 일 들고 서. 이름은 그날 부른다.', 'Bring your four papers and the hundred and eighty days you put in. Your name gets called that day.']), // 1 — 총회에서 이름
  ],
  'M2-01': [
    pa(['통발은 걷어 봤나?', 'Have you lifted a trap yet?'],
      ['…아직 걷지 못했습니다.', "...Not yet, I haven't."],
      ['위판장엔 통발로 잡은 것만 낸다. 낚싯대로 잡은 건 손도 대지 마.', "Only trap catch goes to the auction. Don't even touch what you caught on a rod."]), // 0 — 통발 걷기
    pa(['상자는 위판에 올렸나?', 'Got a box up for auction yet?'],
      ['…아직 올리지 못했습니다.', "...I haven't put one up yet."],
      ['위판장 등록부터 하고, 얼음 깐 규격 상자에 담아. 크기가 아니라 규격이 먼저다.', 'Register at the auction house first, then pack it in a regulation box over ice. Regulation comes before size.']), // 1 — 규격 상자 위판
  ],
  'M2-02': [
    pa(['이번엔 얼음 넉넉히 챙겨서 상자 냈나?', 'Have you sent boxes out again, with enough ice this time?'],
      ['…아직 다 내지 못했습니다.', '...Not all of them yet.'],
      ['얼음은 아끼는 게 아니다. 경매장까지 가는 동안 녹을 몫까지 깔아.', "Ice isn't something you save on. Lay in enough to cover what melts on the way to the auction."]), // 0 — 위판 세 건
    pa(['얼음이 왜 녹았는지, 되짚어 봤나?', 'Have you worked out why the ice melted?'],
      ['…아직 다 되짚어 보지 못했습니다.', "...I haven't worked it all through yet."],
      ['쿨러를 열어 남은 얼음부터 봐. 얼마나 넣었고 얼마나 걸렸는지, 그걸 짚는 게 복기다.', "Open the cooler and look at what ice is left. How much you put in, how long it took — going over that is the review."]), // 1 — 유찰 복기
  ],
  'M2-05': [
    pa(['배운 위생 절차대로 손질은 해 봤나?', 'Have you butchered any by the hygiene procedure you learned?'],
      ['…아직 다 해 보지 못했습니다.', '...Not all of them yet.'],
      ['도마랑 칼부터 깨끗이 하고, 손질한 건 바로 차게 둬. 교육에서 들은 냉장 사슬 그대로다.', "Clean the board and knife first, and get what you've cut straight into the cold. The cold chain, just like the course said."]), // 0 — 위생 손질 두 마리
    pa(['회 한 접시, 이력 적어서 떠 봤나?', 'Sliced a plate yet, with its trail written down?'],
      ['…아직 뜨지 못했습니다.', "...I haven't sliced it yet."],
      ['어디서 언제 잡았는지 먼저 적고 떠. 이력 없는 회는 계원 손에서 나가면 안 된다.', "Write down where and when it was caught, then slice. No plate leaves a member's hands without its trail."]), // 1 — 이력 적은 회
    pa(['품질관리 교육은 끝까지 들었나?', 'Did you sit through the quality control course?'],
      ['…아직 다 듣지 못했습니다.', "...I haven't finished it yet."],
      ['도현수도 같이 듣는다. 싸우지 말고, 끝나면 수료증 들고 와.', "Do Hyeonsu's taking it too. Don't pick fights, and bring the certificate when you're done."]), // 2 — 교육 수료
  ],
  'M2-07': [
    pa(['통제선 바깥 갯바위에서 좀 낚았나?', 'Caught anything off the rocks outside the line?'],
      ['…아직 다 낚지 못했습니다.', '...Not enough yet.'],
      ['안쪽 바다가 더 좋아 보여도 바깥에서 낚아. 몰래 넘어간 사람 이름은 내가 다 안다.', 'The water inside may look better, but fish outside. I know the name of everyone who sneaks over.']), // 0 — 통제선 밖 두 마리
    pa(['세 길 중에 어느 쪽으로 갈지 정했나?', "Decided which of the three ways you're going?"],
      ['…아직 정하지 못했습니다.', "...I haven't decided yet."],
      ['계 동행, 낚시공원, 선상. 셋 다 합법이다. 뭘 골라도 좋으니 통제선만 넘지 마.', "With the co-op, the fishing park, or a boat. All three are legal. Pick any of them — just don't cross the line."]), // 1 — 합법 경로 고르기
  ],
  'M2-09': [
    pa(['심사에 낼 위판 실적은 쌓고 있나?', 'Building up your auction record for the review?'],
      ['…아직 다 쌓지 못했습니다.', "...It isn't built up yet."],
      ['부산에서 한 일이 그대로 표가 된다. 규격 상자로 꾸준히 내.', 'What you do in Busan turns straight into votes. Keep sending regulation boxes.']), // 0 — 위판 다섯 건
    pa(['총회장에 설 각오는 됐나?', 'Ready to stand at the assembly?'],
      ['…조금 이따가 서겠습니다.', "...I'll take my place a little later."],
      ['서서 듣는 것도 심사다. 무슨 말이 나와도 끝까지 서 있어.', 'Standing there and listening is part of the review. Whatever gets said, stay on your feet to the end.']), // 1 — 분기 총회 심사
  ],
  'M2-10': [
    pa(['학원비는 마련했나?', 'Got the money for the course?'],
      ['…아직 다 모으지 못했습니다.', "...I haven't got it all yet."],
      ['위판으로 벌어. 통발 걷어서 규격 상자로 꾸준히 내면 된다.', 'Earn it at the auction. Lift your traps and keep sending regulation boxes.']), // 0 — 학원비 위판 네 건
    pa(['필기는 봤나?', 'Sat the written exam?'],
      ['…아직 붙지 못했습니다.', "...I haven't passed yet."],
      ['떨어져도 된다. 다시 보면 돼. 항법, 기상, 법규는 책상에 앉아서 하나씩 익혀.', "It's fine to fail — just sit it again. Navigation, weather, regulations: stay at the desk and learn them one at a time."]), // 1 — 면허 필기
  ],
  'M3-03': [
    pa(['실기는 붙었나?', 'Pass the practical?'],
      ['…아직 합격하지 못했습니다.', "...I haven't passed it yet."],
      ['한 번 떨어지는 건 괜찮다. 계류할 땐 서두르지 말고 부두에 천천히 붙여.', "Failing once is fine. When you moor, don't rush — ease her up to the pier."]), // 0 — 실기 합격
  ],
  'M3-07': [
    pa(['치어는 다 놓아줬나?', 'Released all the fry?'],
      ['…아직 다 놓아주지 못했습니다.', '...Not all of them yet.'],
      ['한 양동이씩 천천히 내려. 세지 마. 세는 순간 못 놓는다.', "One bucket at a time, slowly. Don't count. The moment you count, you can't let go."]), // 0 — 치어 다섯 양동이
  ],
  'M4-04': [
    pa(['모자란 장비 두 점은 만들었나?', 'Made the two items you were short?'],
      ['…아직 다 만들지 못했습니다.', "...I haven't made them all yet."],
      ['체크리스트에서 미달된 항목부터 채워. 조끼 유효기간도 다시 보고.', 'Fill whatever came up short on the checklist first. And check the life jacket dates again.']), // 0 — 모자란 장비 두 점
    pa(['안전 검사 서른 항목, 다 통과했나?', 'Pass all thirty items of the safety inspection?'],
      ['…아직 통과하지 못했습니다.', "...I haven't passed yet."],
      ['하나라도 미달이면 재검이다. 구명장비, 소화기, 신호탄, 하나씩 짚고 가.', "One miss and it's a re-inspection. Life-saving gear, extinguishers, flares — go through them one by one."]), // 1 — 서른 항목 통과
  ],
  'M4-06': [
    pa(['손님 앞에서 고기는 올렸나?', 'Landed any in front of the guests?'],
      ['…아직 못 올렸습니다.', '...Not yet.'],
      ['네 줄보다 손님 줄이 먼저다. 손님이 보는 앞에서 올려야 손님이 또 온다.', "The guests' lines come before yours. Land fish where they can see it, and they'll come back."]), // 0 — 손님 앞 두 마리
    pa(['배 위에서 회는 떠 봤나?', 'Sliced a plate on deck yet?'],
      ['…아직 배 위에서는 못 떠 봤습니다.', "...I haven't tried it on deck yet."],
      ['배가 흔들리니 몸을 낮추고 칼질은 천천히 해. 갓 잡은 걸로 떠야 손님이 맛을 안다.', 'The deck moves, so keep low and cut slow. Slice it from fresh catch and the guests will taste the difference.']), // 1 — 배 위 회 한 접시
    pa(['첫 손님 태우고 나갈 채비는 됐나?', 'Ready to take your first guests out?'],
      ['…조금만 더 챙기고 나가겠습니다.', '...Let me get a few more things ready first.'],
      ['명부, 안전교육, 멀미약. 손님이 드러누워도 배는 돌아와야 한다.', 'Passenger list, safety briefing, seasickness pills. Even if a guest goes down, the boat comes back.']), // 2 — 첫 손님 출조
  ],
  'M5-01': [
    pa(['운진항 입항은 마쳤나?', 'Done your arrival at Unjin Harbour?'],
      ['…아직 들어가지 못했습니다.', "...I haven't got in yet."],
      ['소개장 챙기고 항비 내. 방언은 못 알아들으면 세 번 물어. 화내지 말고.', "Bring the letter of introduction and pay the harbour dues. If you can't follow the dialect, ask three times. Don't lose your temper."]), // 0 — 운진항 입항
  ],
  'M5-04': [
    pa(['손님한테 보여 줄 자리는 확인했나?', "Checked the spot you'll show the guests?"],
      ['…아직 확인하지 못했습니다.', "...I haven't checked it yet."],
      ['네가 먼저 한치를 올려 봐야 손님을 데려간다. 자리도 모르고 손님 태우면 그 예약은 끝이다.', "You land squid there yourself before you bring anyone. Take guests out blind and that booking's finished."]), // 0 — 한치 두 마리
    pa(['등록이랑 안전교육은 마쳤나?', 'Finished the registration and the safety training?'],
      ['…아직 다 마치지 못했습니다.', '...Not all of it yet.'],
      ['안전교육은 여덟 시간이다. 끝까지 듣고 등록증 들고 와.', 'The safety training is eight hours. Sit through it and bring me the registration.']), // 1 — 해양관광업 등록
  ],
  'M5-09': [
    pa(['표결 전에 위판 실적은 남겼나?', 'Left your auction record before the vote?'],
      ['…아직 모자랍니다.', "...I'm still short."],
      ['평판도 참여도 다 표에 들어간다. 표결 전까지 위판에 꾸준히 내.', 'Reputation and turnout both count in the vote. Keep putting lots up until then.']), // 0 — 위판 다섯 건
    pa(['표결하러 들어갈 준비는 됐나?', 'Ready to go in and vote?'],
      ['…조금 이따가 들어가겠습니다.', "...I'll go in a bit later."],
      ['표결은 서서 한다. 손은 네가 들어. 누구 눈치도 보지 말고.', "The vote's taken standing. Raise your own hand, and don't look to anyone else."]), // 1 — 총회 표결
  ],
  'M6-07': [
    pa(['비상 보급 세 점은 갖췄나?', 'Got your three emergency stores together?'],
      ['…아직 다 갖추지 못했습니다.', "...I don't have them all yet."],
      ['비상계획에 적은 건 배에 실려 있어야 한다. 서류에만 있는 보급은 바다에서 소용없다.', "Whatever's in the emergency plan has to be aboard. Stores that exist only on paper are no use at sea."]), // 0 — 비상 보급 세 점
    pa(['항해 계획 서류는 다 됐나?', 'Are the passage plan papers done?'],
      ['…아직 손볼 데가 남았습니다.', "...There's still some work left on them."],
      ['연료 예비량은 넉넉히 다시 계산해. 기상, 정비, 비상, 한 장씩 다 넘겨 볼 거다.', "Recalculate your fuel reserve, and be generous. I'll go through weather, maintenance and emergency page by page."]), // 1 — 항해 계획 승인
  ],
  'M6-08': [
    pa(['독도 갈 만큼 몸은 다 만들었나?', 'Built yourself up enough for Dokdo?'],
      ['…아직 덜 됐습니다.', '...Not yet.'],
      ['바다에 더 나가서 채우고 와. 세 문 중에 그건 누가 대신 열어 줄 수가 없다.', "Get out on the water more and come back when you're there. Of the three doors, that's one nobody can open for you."]), // 0 — 조사 동행 자격
  ],
  'M7-02': [
    pa(['표본 세 마리, 재고 놓아줬나?', 'Measured and released the three specimens?'],
      ['…아직 다 재지 못했습니다.', "...I haven't measured them all yet."],
      ['자로 재고 사진 찍고 바로 놓아. 쿨러는 열지 마. 잡으러 간 게 아니다.', "Measure, photograph, release right away. Don't open the cooler. You're not there to catch."]), // 0 — 계측 후 방류
  ],
  'M7-05': [
    pa(['복구 기금은 좀 모였나?', 'Has the restoration fund come together?'],
      ['…아직 삼천에는 못 미칩니다.', "...It's still short of thirty million."],
      ['배를 타. 손님을 태워. 계원들이 보고 있다. 네가 준 만큼 돌아온다.', "Take the boat out. Carry guests. The members are watching — you'll get back what you give."]), // 0 — 복구 기금 삼천만
  ],
  'N24-3': [
    pa(['문필구 씨는 만나 봤나?', 'Have you seen Mun Pilgu?'],
      ['…아직 뵙지 못했습니다.', "...I haven't seen him yet."],
      ['작업 수첩 얘기를 청해 보게. 본 대로 말하려면 먼저 봐야지.', 'Ask him about his workshop notebook. To tell what you saw, you have to see it first.']), // 0 — 문필구 수첩
    pa(['차영배 씨는 찾아가 봤나?', 'Have you been to see Cha Yeongbae?'],
      ['…아직 찾아가지 못했습니다.', '...Not yet.'],
      ['찢겨 나간 장이 있다더군. 그걸 물어보게. 회의 날은 정해져 있으니 너무 미루지는 말고.', "There's a page torn out, I hear. Ask about that. The meeting day's set, so don't put it off too long."]), // 1 — 차영배 찢긴 장
  ],

  // ── 유리아 ──
  'M5-05': [
    pa(['공원 예정지 조간대, 직접 훑어 봤어요?', "Have you worked the park site's tideline yourself?"],
      ['…아직 다 훑지 못했습니다.', "...I haven't covered it all yet."],
      ['물 빠질 때 가서 직접 걸어 봐요. 그 바다를 먼저 알아야 양쪽 말이 제대로 들려요.', "Go when the tide's out and walk it yourself. Know that water first, and you'll actually hear both sides."]), // 0 — 조간대 세 번
    pa(['찬성 측 이야기, 지금 끝까지 들어 볼래요?', "Want to hear the supporters' case through, right now?"],
      ['…조금 이따가 듣겠습니다.', "...I'll hear it a bit later."],
      ['찬성 쪽은 일자리 얘기를 할 거예요. 중간에 끊지 말고, 편들지도 말고 끝까지 받아 적어요.', "The supporters will talk about jobs. Don't cut in, don't take sides — just get it all down."]), // 1 — 찬성 측
    pa(['반대 측 이야기는 어촌계에 가서 들어 봤어요?', 'Have you been to the co-op to hear the opposition?'],
      ['…아직 어촌계에 가 보지 못했습니다.', "...I haven't been to the co-op yet."],
      ['반대 쪽은 바다 얘기를 할 거예요. 한쪽만 들으면 취재가 아니니까, 똑같이 끝까지 들어요.', "The opposition will talk about the sea. Hearing one side isn't reporting, so hear them out just the same."]), // 2 — 반대 측(어촌계)
  ],
  'N14-1': [
    pa(['방어는 낚았어요?', 'Got the yellowtail?'],
      ['…아직 못 낚았습니다.', "...Not yet, I haven't."],
      ['낚으면 프레임 안으로 바로 건네줘요. 구도는 제가 잡을게요. 오랜만이라 저도 좀 떨리네요.', "When you land it, pass it straight into frame. I'll handle the shot. It's been a while, so I'm a little nervous too."]), // 0 — 방어 1마리
  ],

  // ── 이수연 ──
  'N09-3': [
    pa(['아빠 바늘로… 참돔 올렸어요?', "With Dad's fly… did you get the red seabream?"],
      ['…아직 못 올렸습니다.', '...Not yet.'],
      ['다른 바늘은 안 돼요. 아빠가 감던 그대로, 그 바늘로 올려 줘요.', "No other hook. Just the way Dad tied it — bring it up on that one."]), // 0 — 참돔 1마리
    pa(['이제… 셋이 같이 먹을래요?', 'Shall the three of us… eat together now?'],
      ['…조금 있다가 같이 먹겠습니다.', "...I'll join you in a little while."],
      ['괜찮아요. 준비되면 와요. 봄이도 기다리고 있을 거예요.', "It's okay. Come when you're ready. Bom will be waiting too."]), // 1 — 첫 식탁
  ],
  'N09-4': [
    pa(['구룡포에는 들렀어요?', 'Have you been back to Guryongpo?'],
      ['…아직 들르지 못했습니다.', "...I haven't made it back yet."],
      ['개업 상은 구룡포에서 차려요. 아빠 칼 챙겨 놓고 기다릴게요.', "We're setting the opening table in Guryongpo. I'll have Dad's knife ready and wait for you."]), // 0 — 구룡포로
    pa(['개업 상에 올릴 거, 손질했어요?', 'Did you prep the fish for the opening table?'],
      ['…아직 칼을 대지 못했습니다.', "...I haven't put a knife to it yet."],
      ['아빠 칼 여기 있어요. 쓰던 칼이랑 무게가 다를 테니까, 천천히 해도 돼요.', "Dad's knife is right here. It'll weigh different from yours, so take your time."]), // 1 — 개업 상 손질
  ],
};
