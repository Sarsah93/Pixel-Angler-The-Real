/**
 * @file StoryMeeting.ts
 * @description 291차 — 편마다 대화가 일어나는 자리(받는 자리 · 끝내는 자리 · 대화 목표).
 *
 * 의뢰인이 편의 지역에 서 있지 않은 편(76편 — 대부분 속초 인물이 다른 지역 이야기를 맡는다)만 적는다.
 * 대본이 「그 지역에서 만났다」고 쓴 자리는 `here`, 「떠나기 전 · 돌아온 뒤」라고 쓴 자리는 `home`이다.
 * 적지 않은 자리는 `any` — 의뢰인이 집에도 있고 편의 지역에도 출장 나와 있다(`rules/QuestMeeting.ts`).
 * 줄마다 위 주석 = 분류 근거(대본의 결정적인 줄). 291차에 63편(받는 61 · 끝내는 61 · 대화 목표 30)을 대본 전문으로 갈랐다.
 */
import type { QuestMeetingDef } from '../types/Story.js';

export const QUEST_MEETING: Readonly<Record<string, QuestMeetingDef>> = {
  // offer: 「부산 갈 준비는 됐냐」·note 「부산으로 떠나기 전」 / complete: 「첫 상자가 낙찰됐다더라」 hearsay
  'M2-01': { offer: 'home' },
  // offer: 「너도 감천 왔냐」「겨울엔 여기야」 / complete: 계측자에 올린 42cm를 그 자리에서 보고 대를 건넴
  'M2-03': { offer: 'here', complete: 'here' },
  // offer: 「자네 왔나. 저기 좀 보게」「덕장이야」·「리어카로 여기까지 오신 거예요?」 / complete: 「그때 내가 여기 있으면 부를게」
  'M3-04': { offer: 'here', complete: 'here' },
  // offer: 「정옥선 씨가 포항까지 오실 줄은 몰랐어요」「여기 노인들한테 물어라」 / complete: 「다 받아 적었어요. 어디 보자」 장소 없음
  'M3-06': { offer: 'here' },
  // offer: 「오늘 어촌계가 다 나온다」「저 수조에 있는 거 전부」 현장 / complete: 방류 직후 「수고했다」「다 들어갔어요」
  'M3-07': { offer: 'here', complete: 'here' },
  // offer: 「참돔 잡으러 간다」 출항 전, 장소 불명 / complete: 「배에 있던 사람은 다 봤다」 부러진 마디를 그 자리에서 천으로 싸 줌
  'M3-08': { complete: 'here' },
  // offer: 부러진 대를 들고 공방에 감 「이건 여기 둬」 / talk1: 「죽간 공방에서」 / complete: note 「공방에 들렀다」 — 전부 속초 공방
  'M3-09': { offer: 'home', complete: 'home', talks: { 1: 'home' } },
  // offer: 「왔다! 여기, 여기!」「태안까지 어떻게 왔어요?」 / complete: 「잡았어!」 포말대에서 바로
  'M4-08': { offer: 'here', complete: 'here' },
  // offer: note 「제주로 떠나기 전에 어촌계에 들렀다」「배는 어디 묶을 거냐」 / complete: 「들어왔지」 보고·영수증 — 장소 불명
  'M5-01': { offer: 'home' },
  // offer: 「남궁현 씨가 여기 계실 줄은 몰랐습니다」 / complete: 「세 마리, 계측대에 올렸습니다」 그 자리 계측
  'M5-06': { offer: 'here', complete: 'here' },
  // offer: 「결선이다」「예선 때보다 사람이 훨씬 많네요」 / complete: 「계측 부탁드립니다」「방금 속초에서 전화가 왔습니다」
  'M5-08': { offer: 'here', complete: 'here' },
  // offer: 「왔냐. 다음 총회에서…」 장소 없음 / complete #hospital 「배편은 잡아 뒀다」→병원(속초) 가는 배 = 제주 총회. N03-3도 총회장 제주
  'M5-09': { complete: 'here', talks: { 1: 'here' } },
  // offer: 「저 다리 밑에 애 하나 있어」「아까부터 혼자 앉아 있어」 / talk1: 다리 밑 / complete: 「봤어요. 전갱이가 올라오니까 처음 웃더라고요」
  'N01-2': { offer: 'here', complete: 'here', talks: { 1: 'here' } },
  // offer: 「저기 덕장 보이지」 / talk1: 덕장 주인과 대화(현장) / complete: 「대를 안 비운대」 전해 들은 결과 — 장소 없음
  'N01-3': { offer: 'here', talks: { 1: 'here' } },
  // offer: 「거제 바다는 처음인가」「바위가 정말 높네요」「저 위에서 일이 난 사람」 / complete: 「해금강까지 온 여비는 주세요」
  'N01-4': { offer: 'here', complete: 'here' },
  // offer: 「노인이 공방 문간에 서 있다」「새벽이 태안 갔다」 / talk0: 태안 대나무 숲 / complete: note 「속초로 돌아왔다」「…왔구나」
  'N02-2': { offer: 'home', complete: 'home', talks: { 0: 'here' } },
  // offer: 「왔다! 기다렸어」「제주까지 웬일이에요?」 / complete: 「올렸어요. 재 봐요」「…84!」
  'N02-3': { offer: 'here', complete: 'here' },
  // offer: 「(부산 품질관리 교육장…)」 / talk1: 「교육이 끝난 교육장」 / complete: 「아까 한 대답, 잘 들었네」 장소 없음
  'N03-2': { offer: 'here', talks: { 1: 'here' } },
  // offer: 「왔나, 선생」「제주까지 어쩐 일이세요?」 / talk1: 「총회 전날 밤, 총회장 앞 계단」(제주) / complete: 「…표결 끝났나」
  'N03-3': { offer: 'here', talks: { 1: 'here' } },
  // offer: 「방어진 간다고 들었네」「울산 쪽에 가 보려고요」「나도 가지」 출발 전 / complete: 「울산까지 온 여비는 주십시오」 방어진 직후
  'N03-6': { offer: 'home', complete: 'here' },
  // offer: 「인천 바닥은 사람이 많지」「여기까지 어떻게…」 / complete: 설명 직후·선택지 「인천 강의료는 받겠습니다」
  'N03-7': { offer: 'here', complete: 'here' },
  // talk1 진주: ask 「새벽 방파제 끝에 있을 거예요」 — 속초 방파제 현장(mo_jinju 배치 없음)
  'N04-2': { talks: { 1: 'here' } },
  // offer: 「부산이에요, 부산!」「진짜 왔네요」 / complete: 「먼저 낚으셨네요!」「배누리 씨가 달려가 귓속말」
  'N04-4': { offer: 'here', complete: 'here' },
  // offer: 「…잠깐 얘기해도 돼요?」 장소 없음 / talk1·complete: 나란히 무늬오징어 낚으며 들음·「서하린 씨가 조금 떨어진 바위에서」
  'N05-3': { complete: 'here', talks: { 1: 'here' } },
  // offer: 「오랜만이에요!」「인천에는 어쩐 일이에요?」 / talk1: 연안부두 재회 / complete: 「올렸다! 우럭이에요」
  'N05-4': { offer: 'here', complete: 'here', talks: { 1: 'here' } },
  // offer: 「첫 예약이에요」「신분증도 챙겨 왔어요… 이제 나가요, 바다」 배 앞 / talk2: 명부 / complete: 「명부 첫 줄에 두 사람 이름」
  'N05-5': { offer: 'here', complete: 'here', talks: { 2: 'here' } },
  // offer: 「두 번째야」「포항이네요」「여기 어딘가 있어」 / complete: 「그 말 들으려고 포항까지 온 건 아닌데」
  'N07-2': { offer: 'here', complete: 'here' },
  // offer: 「만리포네요. 파도가 높아요」 / complete: 「둘이 나란히 서서 만리포 물을 봤다」
  'N07-3': { offer: 'here', complete: 'here' },
  // offer: 「제주네요. 마지막이에요」 / talk1: 유작 넷을 그 자리에서 받음 / complete: 「…넷. 다 네 거야」 직후
  'N07-4': { offer: 'here', complete: 'here', talks: { 1: 'here' } },
  // offer: 「대회 연다며」「그래서 찾아왔어요」 플레이어가 찾아감 / talk1·complete: 「…대회 끝」「가슴에 단 심판 배지」 속초 대회장
  'N10-3': { offer: 'home', complete: 'here', talks: { 1: 'here' } },
  // offer: 「부산 경매장에서 뵐 줄은 몰랐어요」「뒷줄에 서 봐. 여기」 / complete: 함께 읽은 낙찰가 「세 번째 건은 제가 맞혔죠」
  'N18-2': { offer: 'here', complete: 'here' },
  // offer: 「도현수 씨? 포항엔 어쩐 일이에요?」 / complete: 함께 채록한 것을 저녁에 맞춰 봄(같은 출장)
  'N18-3': { offer: 'here', complete: 'here' },
  // offer: 「거제에 중고 배 하나 보러 가는 길이에요」「할아버지가 그러더라」「나도 가」 / complete: 함께 검수 「…균열 찾았네」
  'N18-4': { offer: 'home', complete: 'here' },
  // offer: 「여기」「인천 도매시장까지 어쩐 일이에요?」 / complete: 「한 건 확인」「봤어. 깨끗하더라」 시장 현장
  'N18-6': { offer: 'here', complete: 'here' },
  // offer: 「유하랑 씨? 울산까지 오셨어요?」「저기 앉아 있어 줘요」 / talk2·complete: 「이거 봐요. 찍힌 거」 촬영 직후
  'N20-2': { offer: 'here', complete: 'here', talks: { 2: 'here' } },
  // offer: 「어, 걸렸다! 잠깐만요, 카메라!」 현장 / talk1: 카메라 앞에서 이유 말하기 / complete: 「올렸어요. 그 영상」 나중 보고
  'N20-4': { offer: 'here', talks: { 1: 'here' } },
  // offer: 「오세찬 씨? 부산까지 오셨어요?」「만 안쪽 보세요」 / complete: 「봤어요. 만 안쪽이 좀 낫네요」
  'N21-2': { offer: 'here', complete: 'here' },
  // offer: 「울산에서 보네요」「창구는 저쪽이에요」 / talk1: 수매 창구 / complete: 「창구에 넘겼어요」「통과했죠?」
  'N21-3': { offer: 'here', complete: 'here', talks: { 1: 'here' } },
  // offer: 「왔어요? 잘됐다. 가두리 앞 보세요」 / complete: 「들었어요. 관리인이 소리 지르는 거」
  'N21-4': { offer: 'here', complete: 'here' },
  // offer: 「저기, 수면 아래요. 보여요?」 / talk1·complete: 「괜찮아요? 팔 봐요」「아까도 보셨잖아요」
  'N21-5': { offer: 'here', complete: 'here', talks: { 1: 'here' } },
  // offer: 「인천 쪽 폐채석장… 가 보세요」「저는 공방 봐야죠. 캔 건 가져와요」 / complete: 「폐채석장 다녀왔어요」
  'N22-6': { offer: 'home', complete: 'home', talks: { 2: 'home' } },
  // offer: 「포항 앞바다에서 흰 개체를 봤다는…」「따라가 봐요」「가져와요. 기록할게요」 / talk2: 「잊어버리기 전에 와요」 / complete 보고
  'N23-2': { offer: 'home' },
};
