/**
 * @file StoryActionRegistry.ts
 * @description 수동 custom 목표를 실제 행동 절차로 전환하기 위한 공통 단계 정의.
 *
 * 각 목표는 세 번의 실제 성공 이벤트를 요구한다. 대화 계통은 명시적인
 * 대화 행동 선택에서, 나머지는 제작·운반·검사·선택·현장 시스템의 성공 지점에서
 * 같은 actionKey 이벤트를 발행한다. 대화창을 열거나 대사를 넘기는 것만으로는 진행하지 않는다.
 */

import type { StoryActionKey } from '@tra/core';

export interface StoryActionSpec {
  /** 행동이 주로 일어나는 계통 — 후속 시스템 배선 기준 */
  source: StoryActionSource;
  /** 계통 안에서 플레이어가 경험하는 진행 방식 */
  flow: StoryActionFlow;
  stepsKo: string[];
  stepsEn: string[];
  /** 계통별 행동 전략 분기. 비대화 계통은 선택 기록과 실제 시스템 이벤트를 분리한다. */
  choices: StoryActionChoice[];
  /** 단계별 실제 사건 출처. 지정하면 다른 화면을 열어서는 진행되지 않는다. */
  eventOrigins?: readonly string[];
}

export interface StoryActionScene {
  titleKo: string;
  titleEn: string;
  placeKo: string;
  placeEn: string;
  /** 실제 단계 성공 직후 보여 줄 개인 시점의 짧은 장면 */
  linesKo: readonly [string, string];
  linesEn: readonly [string, string];
}

/** 실제 게임 시스템이 행동 목표를 발행하는 여섯 가지 사건 계통 */
export type StoryActionSource = 'dialogue' | 'craft' | 'delivery' | 'inspection' | 'selection' | 'field';

/** action 목표를 실제 플레이 흐름으로 분류하는 공통 계약 */
export type StoryActionFlow = 'dialogue-crosscheck' | 'evidence-report' | 'field-gate' | 'branching-choice' | 'production' | 'delivery';

export interface StoryActionChoice {
  id: string;
  labelKo: string;
  labelEn: string;
  replyKo: string;
  replyEn: string;
  /** 선택 직후 발주 NPC 우호도 변화 */
  affinityDelta: number;
}

const DIALOGUE_CHOICES: StoryActionChoice[] = [
  { id: 'challenge', labelKo: '의심하고 교차 확인한다', labelEn: 'Challenge and cross-check', replyKo: '제가 알고 있는 정보와 다릅니다. 누구의 말이 맞는지 확인해 보겠습니다.', replyEn: 'That differs from what I know. I will check whose account is right.', affinityDelta: -0.03 },
  { id: 'trust', labelKo: '일단 믿고 다음 정보를 듣는다', labelEn: 'Trust them for now', replyKo: '알겠습니다. 다만 다음 이야기도 앞뒤가 맞는지 확인해 보겠습니다.', replyEn: 'All right. I will still check whether the next account adds up.', affinityDelta: 0.03 },
  { id: 'neutral', labelKo: '판단을 미루고 양쪽을 더 듣는다', labelEn: 'Stay neutral and listen', replyKo: '두 정보가 다르군요. 어느 쪽이 맞는지 조금 더 확인하겠습니다.', replyEn: 'The accounts differ. I will gather a little more before deciding.', affinityDelta: 0 },
];

const SELECTION_CHOICES: StoryActionChoice[] = [
  { id: 'route_a', labelKo: '첫 번째 선택지를 택한다', labelEn: 'Choose the first option', replyKo: '첫 번째 방법으로 진행하겠습니다.', replyEn: 'I will proceed with the first option.', affinityDelta: 0.02 },
  { id: 'route_b', labelKo: '두 번째 선택지를 택한다', labelEn: 'Choose the second option', replyKo: '두 번째 방법이 지금 상황에 맞겠습니다.', replyEn: 'The second option fits the situation better.', affinityDelta: 0 },
  { id: 'route_c', labelKo: '세 번째 선택지를 택한다', labelEn: 'Choose the third option', replyKo: '세 번째 방법을 시도해 보겠습니다.', replyEn: 'I will try the third option.', affinityDelta: -0.02 },
];

const INSPECTION_CHOICES: StoryActionChoice[] = [
  { id: 'detail', labelKo: '세부 기록부터 확인한다', labelEn: 'Check the detailed record first', replyKo: '수치와 흔적을 먼저 대조해 보겠습니다.', replyEn: 'I will compare the figures and traces first.', affinityDelta: 0.02 },
  { id: 'compare', labelKo: '현장 정보와 대조한다', labelEn: 'Compare it with the scene', replyKo: '기록만 믿지 않고 현장과 맞춰 보겠습니다.', replyEn: 'I will compare the record with what happened on site.', affinityDelta: 0 },
  { id: 'report', labelKo: '확인한 내용을 바로 보고한다', labelEn: 'Report what I found', replyKo: '확인한 사실을 숨기지 않고 바로 전달하겠습니다.', replyEn: 'I will report what I found without hiding it.', affinityDelta: -0.02 },
];

const FIELD_CHOICES: StoryActionChoice[] = [
  { id: 'safe', labelKo: '안전을 먼저 확인한다', labelEn: 'Check safety first', replyKo: '서두르지 않고 안전부터 확인하겠습니다.', replyEn: 'I will check safety before rushing.', affinityDelta: 0.03 },
  { id: 'fast', labelKo: '가장 빠른 방법으로 진행한다', labelEn: 'Take the fastest route', replyKo: '시간을 아끼는 방법으로 진행해 보겠습니다.', replyEn: 'I will proceed in the way that saves the most time.', affinityDelta: -0.02 },
  { id: 'help', labelKo: '주변 사람의 도움을 구한다', labelEn: 'Ask nearby people for help', replyKo: '혼자 판단하지 않고 주변에 먼저 묻겠습니다.', replyEn: 'I will ask nearby people instead of deciding alone.', affinityDelta: 0.01 },
];

const PRODUCTION_CHOICES: StoryActionChoice[] = [
  { id: 'precise', labelKo: '정확도를 우선한다', labelEn: 'Prioritize precision', replyKo: '시간이 걸려도 매듭과 규격을 정확히 맞추겠습니다.', replyEn: 'I will match the knot and measurements precisely, even if it takes time.', affinityDelta: 0.03 },
  { id: 'efficient', labelKo: '재료를 아껴 효율적으로 만든다', labelEn: 'Work efficiently and save materials', replyKo: '재료를 낭비하지 않는 방법으로 만들겠습니다.', replyEn: 'I will make it without wasting materials.', affinityDelta: 0.01 },
  { id: 'fast', labelKo: '일단 완성해 보고 고친다', labelEn: 'Finish first and refine later', replyKo: '먼저 형태를 완성한 뒤 부족한 부분을 고치겠습니다.', replyEn: 'I will finish the shape first and refine what is lacking.', affinityDelta: -0.02 },
];

const DELIVERY_CHOICES: StoryActionChoice[] = [
  { id: 'direct', labelKo: '직접 전달하고 확인받는다', labelEn: 'Deliver it personally and get confirmation', replyKo: '제가 직접 전달하고 받은 사람의 확인까지 받겠습니다.', replyEn: 'I will deliver it personally and get confirmation from the recipient.', affinityDelta: 0.03 },
  { id: 'protect', labelKo: '상태가 상하지 않게 먼저 챙긴다', labelEn: 'Protect its condition first', replyKo: '전달 속도보다 물건의 상태를 먼저 챙기겠습니다.', replyEn: 'I will protect the item’s condition before prioritizing speed.', affinityDelta: 0.02 },
  { id: 'delegate', labelKo: '믿을 만한 사람에게 전달을 부탁한다', labelEn: 'Ask someone reliable to deliver it', replyKo: '혼자 들고 가지 않고 믿을 만한 사람에게 부탁하겠습니다.', replyEn: 'I will ask someone reliable instead of carrying it alone.', affinityDelta: -0.01 },
];

const flowOf = (source: StoryActionSource): StoryActionFlow => {
  switch (source) {
    case 'dialogue': return 'dialogue-crosscheck';
    case 'inspection': return 'evidence-report';
    case 'field': return 'field-gate';
    case 'selection': return 'branching-choice';
    case 'craft': return 'production';
    case 'delivery': return 'delivery';
  }
};

const s = (source: StoryActionSpec['source'], stepsKo: string[], stepsEn: string[], eventOrigins?: readonly string[]): StoryActionSpec => {
  const flow = flowOf(source);
  const choices = flow === 'dialogue-crosscheck' ? DIALOGUE_CHOICES
    : flow === 'branching-choice' ? SELECTION_CHOICES
      : flow === 'evidence-report' ? INSPECTION_CHOICES
        : flow === 'field-gate' ? FIELD_CHOICES
          : flow === 'production' ? PRODUCTION_CHOICES : DELIVERY_CHOICES;
  return {
    source, flow, stepsKo, stepsEn,
    choices,
    ...(eventOrigins ? { eventOrigins } : {}),
  };
};

export const STORY_ACTIONS: Record<StoryActionKey, StoryActionSpec> = {
  cooler_ice_review: s('inspection', ['쿨러를 열어 얼음 상태를 확인한다', '선도와 보관 기록을 대조한다', '유찰 원인을 기록한다'], ['Open the cooler and check the ice', 'Compare freshness with the storage log', 'Record the reason for the failed sale'], ['cooler-open', 'cooler-open', 'cooler-open']),
  quality_course: s('dialogue', ['품질관리 교육 자료를 펼친다', '위생·선도 확인 항목을 읽는다', '교육 이수를 확인한다'], ['Open the quality course', 'Read the hygiene and freshness checklist', 'Confirm course completion']),
  legal_route_choice: s('selection', ['세 가지 합법 경로를 비교한다', '하나의 경로를 선택한다', '선택한 경로를 알린다'], ['Compare the three legal routes', 'Choose one route', 'Tell the chief which route you chose']),
  stall_display_rebuild: s('field', ['부산 상자 규격을 확인한다', '좌판 진열을 다시 배치한다', '정옥선에게 진열 상태를 보여 준다'], ['Check the Busan crate standard', 'Rebuild the stall display', 'Show Ok-seon the finished display']),
  vessel_exam: s('selection', ['필기시험 접수를 확인한다', '안전·항해 문제를 푼다', '합격 결과를 확인한다'], ['Confirm written-exam registration', 'Answer the safety and navigation questions', 'Confirm the passing result']),
  oral_history: s('dialogue', ['채록할 사람의 허락을 구한다', '이야기를 듣고 기록한다', '기록 내용을 저장한다'], ['Ask permission to record', 'Listen and write the account', 'Save the entry']),
  vessel_safety_inspection: s('inspection', ['안전 점검표를 펼친다', '부족한 장비를 대조한다', '검사관에게 점검을 신청한다'], ['Open the safety checklist', 'Check the missing equipment', 'Request the inspection']),
  marine_tourism_registration: s('selection', ['관광업 등록 서류를 제출한다', '안전교육을 수강한다', '등록 완료를 확인한다'], ['Submit the tourism registration', 'Take the safety course', 'Confirm registration']),
  stall_operation_day: s('field', ['오늘의 재고와 가격을 정한다', '손님에게 물건을 건넨다', '하루 운영을 마감한다'], ['Set today\'s stock and prices', 'Serve a customer', 'Close the day\'s operation']),
  long_voyage_plan: s('selection', ['항로와 기상 예보를 확인한다', '비상 보급품을 계획에 넣는다', '항해 계획 승인을 신청한다'], ['Check the route and forecast', 'Add emergency stores to the plan', 'Submit the voyage plan']),
  tray_delivery: s('delivery', ['대나무 받침을 챙긴다', '만복상회 좌판에 놓는다', '전달 사실을 알린다'], ['Take the bamboo tray', 'Place it at the Manbok stall', 'Confirm the delivery']),
  rig_tying: s('craft', ['첫 채비를 묶는다', '매듭을 확인하고 다시 묶는다', '스무 번째 채비를 보여 준다'], ['Tie the first rig', 'Check and retie the knot', 'Show the twentieth rig']),
  bamboo_selection: s('field', ['대나무의 마디 간격을 살핀다', '쓸 만한 대를 고른다', '고른 이유를 표시한다'], ['Inspect the bamboo node spacing', 'Choose a usable pole', 'Mark why you chose it']),
  auction_price_review: s('inspection', ['경매 낙찰 목록을 연다', '두 건의 낙찰가를 확인한다', '도현수와 가격을 대조한다'], ['Open the auction results', 'Check the hammer prices', 'Compare them with Hyeon-su'], ['auction-open', 'auction-open', 'auction-open']),
  food_container_delivery: s('delivery', ['반찬통을 챙긴다', '죽간 공방에 전달한다', '받는 사람의 확인을 받는다'], ['Take the food container', 'Deliver it to the workshop', 'Get delivery confirmation']),
  oral_history_entry: s('dialogue', ['채록 준비를 한다', '한 건의 구술을 받아 적는다', '기록을 함께 검토한다'], ['Prepare the recording', 'Write down one account', 'Review the entry together']),
  second_tray_delivery: s('delivery', ['두 번째 받침을 챙긴다', '좌판에 전달한다', '전달 완료를 확인한다'], ['Take the second tray', 'Deliver it to the stall', 'Confirm delivery']),
  hull_inspection: s('inspection', ['중고 선체 점검표를 연다', '선체와 기관을 직접 확인한다', '검수 결과를 기록한다'], ['Open the used-boat checklist', 'Inspect the hull and engine', 'Record the inspection result']),
  reconcile_okseon_tak: s('selection', ['두 사람의 자리를 준비한다', '두 사람을 같은 자리에 부른다', '대화를 끝까지 지켜본다'], ['Prepare seats for both', 'Bring them to the same place', 'Stay until they finish talking']),
  sort_arguments: s('selection', ['찬성 자료와 반대 자료를 나눈다', '근거를 항목별로 정리한다', '정리한 자료를 함께 확인한다'], ['Separate the supporting and opposing papers', 'Sort the evidence by topic', 'Review the organized file together']),
  stove_repair: s('field', ['고장 난 부분을 확인한다', '난로를 수리한다', '불이 붙는지 확인한다'], ['Find the broken part', 'Repair the stove', 'Check that it lights']),
  label_violation_review: s('inspection', ['원산지 표기를 확인한다', '위반 표시를 기록한다', '담당자에게 신고 내용을 보여 준다'], ['Check the origin label', 'Record the violation', 'Show the report to the inspector'], [
    'n18-6:watch-cinematic', 'n18-6:ledger-inspect', 'n18-6:report',
  ]),
  hospital_assistance: s('field', ['병실 출입을 확인한다', '노인의 이동을 돕는다', '병실 안까지 동행한다'], ['Check the ward entrance', 'Help the elder move', 'Walk him into the ward']),
  distribution_route_explain: s('inspection', ['유통 경로 자료를 연다', '한 경로를 순서대로 설명한다', '강두철의 질문에 답한다'], ['Open the distribution records', 'Explain one route in order', 'Answer Du-cheol\'s questions']),
  reopening_preparation: s('field', ['재개관식 준비 목록을 확인한다', '필요한 비품을 배치한다', '준비 완료를 함께 확인한다'], ['Check the reopening list', 'Set out the required fittings', 'Confirm the setup together']),
  codex_species_review: s('inspection', ['도감의 미등록 종을 확인한다', '마흔 종 이상 기록을 검토한다', '조사표에 반영한다'], ['Check the uncatalogued species', 'Review forty or more records', 'Add them to the survey sheet'], ['codex-open', 'codex-open', 'codex-open']),
  video_frame_selection: s('selection', ['촬영본을 연다', '사용할 장면을 비교한다', '한 컷을 선택해 저장한다'], ['Open the footage', 'Compare the usable shots', 'Save one selected frame']),
};

/**
 * actionKey마다 소재가 겹치지 않도록 잡은 짧은 후속 장면. 긴 대사를 한 곳에
 * 몰아넣지 않고, 실제 플레이 행동이 끝난 직후 “무슨 변화가 있었는가”만 보여준다.
 */
export const STORY_ACTION_SCENES: Record<StoryActionKey, StoryActionScene> = {
  cooler_ice_review: { titleEn: 'Ice crate check', placeEn: 'Harbour cold store', linesEn: ['I trace the melted patch with a fingertip.', 'I noted a temperature trace that does not match the log.'], titleKo: '얼음 상자 점검', placeKo: '항구 냉장창고', linesKo: ['얼음이 녹은 자리를 손끝으로 짚어 본다.', '기록과 맞지 않는 온도 흔적을 남겼다.'] },
  quality_course: { titleEn: 'Quality course', placeEn: 'Seafood hygiene classroom', linesEn: ['I glance between the freshness chart and the real scales.', 'I resolved not to forget this order at the next auction.'], titleKo: '품질 교육', placeKo: '수산물 위생 교육실', linesKo: ['선도표의 사진과 실제 비늘을 번갈아 본다.', '다음 위판에서는 이 순서를 잊지 않기로 했다.'] },
  legal_route_choice: { titleEn: 'Choosing a legal route', placeEn: 'Port office corridor', linesEn: ['I spread the three sets of papers across the desk.', 'The chosen route now carries the officer stamp.'], titleKo: '합법 경로 선택', placeKo: '항만 관리실 복도', linesKo: ['세 갈래 서류를 책상 위에 펼쳐 놓는다.', '선택한 경로에는 책임자의 도장이 남는다.'] },
  stall_display_rebuild: { titleEn: 'Rebuilding the stall', placeEn: 'Manbok Store stall', linesEn: ['I turn the wet side of the crate face down.', 'The display now faces the way customers reach for it.'], titleKo: '좌판 재배치', placeKo: '만복상회 좌판', linesKo: ['상자의 젖은 면을 아래로 돌려 놓는다.', '손님이 집기 편한 방향으로 진열이 바뀌었다.'] },
  vessel_exam: { titleEn: 'Captain exam', placeEn: 'Vessel safety exam hall', linesEn: ['I press flat the wave stain on the edge of the answer sheet.', 'I marked which questions I knew and which I did not.'], titleKo: '선장 시험', placeKo: '선박안전 시험장', linesKo: ['답안지 가장자리의 파도 자국을 눌러 편다.', '아는 문제와 모르는 문제를 구분해 표시했다.'] },
  oral_history: { titleEn: 'Testimony of the sea', placeEn: 'Bench at the breakwater end', linesEn: ['The recorder clicked on and an old name came out first.', 'I wrote at their pace without cutting in.'], titleKo: '바다의 증언', placeKo: '방파제 끝 벤치', linesKo: ['녹음기를 켜자 오래된 이름 하나가 먼저 나왔다.', '말을 끊지 않고 그 사람의 속도로 받아 적었다.'] },
  vessel_safety_inspection: { titleEn: 'Vessel safety inspection', placeEn: 'Fishing boat moorings', linesEn: ['I shine a torch on the wear inside the life ring.', 'One more item to fix before departure.'], titleKo: '선박 안전 점검', placeKo: '어선 계류장', linesKo: ['구명환 안쪽의 마모를 손전등으로 비춘다.', '출항 전에 고칠 항목이 한 줄 늘었다.'] },
  marine_tourism_registration: { titleEn: 'Tour boat registration', placeEn: 'Marine tourism counter', linesEn: ['I double-check the hull number on the insurance certificate.', 'The clerk marked the next step for me.'], titleKo: '관광선 등록', placeKo: '해양관광 창구', linesKo: ['보험 증서의 선박번호를 다시 대조한다.', '접수창구 직원이 다음 절차를 표시해 주었다.'] },
  stall_operation_day: { titleEn: 'A day at the stall', placeEn: 'Morning fish market', linesEn: ['The pick of the first customer goes onto the scale.', 'The haggling carried all the way down the alley.'], titleKo: '좌판 하루 장사', placeKo: '아침 어시장', linesKo: ['첫 손님이 고른 생선을 저울에 올린다.', '가격을 흥정한 목소리가 골목 안쪽까지 번졌다.'] },
  long_voyage_plan: { titleEn: 'Long voyage plan', placeEn: 'Chart table in the wheelhouse', linesEn: ['I pencil a detour where the forecast changed.', 'Today the way around is the fastest way.'], titleKo: '장거리 항해 계획', placeKo: '선장실 해도 테이블', linesKo: ['예보가 바뀐 구간에 연필로 우회선을 긋는다.', '돌아가는 길이 오늘은 가장 빠른 길이다.'] },
  tray_delivery: { titleEn: 'Bamboo tray delivery', placeEn: 'Behind the Dongmyeong stalls', linesEn: ['The wet fish crate finds level as the tray goes down.', 'The receiver checked the corners once more.'], titleKo: '대나무 받침 전달', placeKo: '동명항 좌판 뒤편', linesKo: ['받침을 내려놓자 젖은 생선 상자가 수평을 찾는다.', '받는 사람이 물건의 모서리를 한 번 더 확인했다.'] },
  rig_tying: { titleEn: 'Rig knots', placeEn: 'Hand workbench', linesEn: ['The tension in my fingertips evened out on the pull.', 'This time I checked the loop direction before cutting.'], titleKo: '채비 매듭', placeKo: '손 제작대', linesKo: ['매듭을 당길 때 손끝의 장력이 일정해졌다.', '이번에는 줄을 자르기 전에 고리 방향부터 확인했다.'] },
  bamboo_selection: { titleEn: 'Bamboo selection', placeEn: 'Materials yard by the breakwater', linesEn: ['I measure node spacing by hand and push aside the warped poles.', 'Writing down why I chose one made the material look different.'], titleKo: '대나무 선별', placeKo: '방파제 옆 자재장', linesKo: ['마디 사이를 손가락으로 재며 휘어진 대를 밀어낸다.', '고른 이유를 적어 두니 재료가 다르게 보였다.'] },
  auction_price_review: { titleEn: 'Hammer price check', placeEn: 'Under the auction hall board', linesEn: ['Yesterday and today stop side by side in numbers.', 'The gap had more to do with arrival time than the fish.'], titleKo: '낙찰가 대조', placeKo: '위판 경매장 전광판 아래', linesKo: ['어제와 오늘의 숫자가 나란히 멈춘다.', '가격의 차이는 생선보다 들어온 시간에 가까웠다.'] },
  food_container_delivery: { titleEn: 'Side-dish container delivery', placeEn: 'Back door of the bamboo workshop', linesEn: ['I hand over the handle without opening the lid.', 'Chopsticks clinked somewhere inside the workshop.'], titleKo: '반찬통 전달', placeKo: '죽간 공방 뒷문', linesKo: ['뚜껑을 열지 않은 채 손잡이만 건넨다.', '공방 안쪽에서 젓가락 놓는 소리가 났다.'] },
  oral_history_entry: { titleEn: 'Sorting the oral record', placeEn: 'Village hall archive', linesEn: ['The same event has two dates in two memories.', 'I kept both as notes instead of picking the wrong one.'], titleKo: '구술 기록 정리', placeKo: '마을회관 기록장', linesKo: ['같은 사건의 날짜가 두 사람의 기억에서 다르다.', '틀린 쪽을 고르지 않고 둘 다 주석으로 남겼다.'] },
  second_tray_delivery: { titleEn: 'Second delivery', placeEn: 'Beside the Manbok Store tank', linesEn: ['I wrapped an extra cloth so less water soaks through.', 'This time the receiver signed on the spot.'], titleKo: '두 번째 전달', placeKo: '만복상회 수조 옆', linesKo: ['지난번보다 물기가 덜 묻도록 천을 한 겹 둘렀다.', '이번에는 전달받은 사람이 바로 서명했다.'] },
  hull_inspection: { titleEn: 'Used hull survey', placeEn: 'Boatyard repair bay', linesEn: ['Rust bleeding under the paint rings with each hammer tap.', 'The inner bracing turned out older than the skin.'], titleKo: '중고 선체 검수', placeKo: '상가 수리장', linesKo: ['도장 아래로 번진 녹이 망치 소리에 따라 울린다.', '겉면보다 안쪽 보강재가 더 오래된 것을 확인했다.'] },
  reconcile_okseon_tak: { titleEn: 'Seats for two', placeEn: 'Window table at the harbour diner', linesEn: ['I pick seats where they need not face each other.', 'I stayed after the talk stopped.'], titleKo: '두 사람의 자리', placeKo: '항구 식당 창가', linesKo: ['서로 마주 보지 않아도 되는 자리를 먼저 잡는다.', '말이 끊긴 뒤에도 자리를 뜨지 않고 기다렸다.'] },
  sort_arguments: { titleEn: 'Sorting the papers', placeEn: 'Port office filing shelf', linesEn: ['I square the edges of the for and against papers.', 'I reordered them so the evidence shows before the claim.'], titleKo: '자료 분류', placeKo: '항구 사무실 서류장', linesKo: ['찬성 자료와 반대 자료의 모서리를 맞춘다.', '주장이 아니라 근거부터 보이도록 순서를 바꿨다.'] },
  stove_repair: { titleEn: 'Stove repair', placeEn: 'Cabin corner', linesEn: ['A handful of soot drops from the blocked flue.', 'When the flame caught, hands in the room started moving.'], titleKo: '난로 수리', placeKo: '선실 구석', linesKo: ['막힌 연통에서 그을음이 한 줌 떨어진다.', '불꽃이 다시 붙자 방 안의 손들이 움직이기 시작했다.'] },
  label_violation_review: { titleEn: 'Origin label violation', placeEn: 'Incheon wholesale market back gate', linesEn: ['The altered letters sit off the printed line.', 'I decided to keep the ledger unfolded, as it is.'], titleKo: '원산지 위반 확인', placeKo: '인천 도매시장 후문', linesKo: ['바뀐 글씨와 원래 인쇄선의 높이가 맞지 않는다.', '명부를 접지 않고 그대로 보관하기로 했다.'] },
  hospital_assistance: { titleEn: 'Walking to the ward', placeEn: 'Harbour clinic corridor', linesEn: ['Half a step toward the rail each time the walk stops.', 'I let go only at the door.'], titleKo: '병실 동행', placeKo: '항구 보건소 복도', linesKo: ['걸음이 멈출 때마다 난간 쪽으로 반 발 먼저 간다.', '문 앞에 도착한 뒤에야 손을 놓았다.'] },
  distribution_route_explain: { titleEn: 'Explaining the route', placeEn: 'Seafood brokerage office', linesEn: ['I trace one crate from boat to restaurant.', 'Who is responsible changes at every step, I learned.'], titleKo: '유통 경로 설명', placeKo: '수산물 중개 사무실', linesKo: ['상자 하나가 배에서 식당까지 가는 길을 짚는다.', '누가 책임지는지가 단계마다 달라진다는 것을 알았다.'] },
  reopening_preparation: { titleEn: 'Reopening prep', placeEn: 'Closed exhibition hall entrance', linesEn: ['I retighten the screws on the dusty sign.', 'Even before the doors open, there is plenty to show.'], titleKo: '재개관 준비', placeKo: '닫힌 전시관 입구', linesKo: ['먼지 쌓인 안내판의 나사를 다시 조인다.', '문을 열기 전에도 보여 줄 것은 이미 많았다.'] },
  codex_species_review: { titleEn: 'Reviewing unlisted species', placeEn: 'Log reading room', linesEn: ['I overlay similar fins one sheet at a time.', 'I left the unnamed box empty and pinned an observation note.'], titleKo: '미등록 종 검토', placeKo: '조행록 열람실', linesKo: ['비슷한 지느러미를 한 장씩 겹쳐 본다.', '아직 이름 없는 칸을 비워 둔 채 관찰 메모를 붙였다.'] },
  video_frame_selection: { titleEn: 'Choosing the frame', placeEn: 'Harbour video editing room', linesEn: ['I split frames hidden by waves from frames showing hands.', 'I chose the one shot that holds evidence, not the prettiest one.'], titleKo: '기록 장면 선택', placeKo: '항구 영상 편집실', linesKo: ['파도에 가려진 프레임과 사람의 손이 보이는 프레임을 나눈다.', '가장 예쁜 장면 대신 증거가 남는 한 컷을 골랐다.'] },
};

export function storyActionSpec(key: StoryActionKey): StoryActionSpec {
  return STORY_ACTIONS[key];
}

export function storyActionScene(key: StoryActionKey): StoryActionScene {
  return STORY_ACTION_SCENES[key];
}
