/**
 * @file StoryChapters.ts
 * @description 메인 「조행록」 5부 7챕터 + 자격 사다리 (134차, STORY_SPEC_v3 §6·§9·§10)
 *
 * `contract`는 §8-1 수치 계약 — `validateStoryQuests()`가 퀘스트 DB의 챕터별 수·XP 합계와 대조한다.
 */

import type { StoryChapterDef } from '../types/Story.js';

export const STORY_CHAPTERS: StoryChapterDef[] = [
  {
    chapter: 1, part: 1, partTitleKo: '실습생', partTitleEn: 'Trainee',
    titleKo: '속초 — 첫 캐스팅', titleEn: 'Sokcho — First Cast', levelBand: [1, 20],
    regionIds: ['gangwon_sokcho'],
    questionKo: '아무 자격도 없이 도착한 항구에서, 무엇부터 배워야 하나.',
    questionEn: 'You arrive with no standing at all. What do you learn first?',
    qualification: {
      chapter: 1, labelKo: '신고어업(맨손어업) + 어촌계원', labelEn: 'Reported fishery + co-op member',
      licenseIds: ['reported_fishery', 'coop_member'],
      deadlineKo: 'D-180 (실습생 증 수령일부터)', deadlineEn: 'D-180 from the trainee card',
      onMissKo: '실습 재신청 퀘 1개 추가 · 숙소 임대료 발생', onMissEn: 'One extra re-application quest · lodging rent starts',
      unlocksKo: '위판·경매, 부산 출조', unlocksEn: 'Auctions, Busan trips',
    },
    contract: { mainCount: 11, mainXp: 4400, subCount: 10, subXp: 3500 },
  },
  {
    chapter: 2, part: 2, partTitleKo: '위판', partTitleEn: 'The Auction',
    titleKo: '부산 1·2·3 — 잡는 것과 파는 것', titleEn: 'Busan — Catching Is Not Selling', levelBand: [20, 45],
    regionIds: ['busan'],
    questionKo: '잡는 것과 파는 것은 완전히 다른 일이다.',
    questionEn: 'Catching and selling are entirely different jobs.',
    qualification: {
      chapter: 2, labelKo: '수산물 품질관리 교육 이수 + 계원 지위 유지', labelEn: 'Seafood quality training + keep co-op standing',
      licenseIds: [], deadlineKo: '분기 총회', deadlineEn: 'Quarterly general meeting',
      onMissKo: '다음 분기로 연기', onMissEn: 'Deferred to the next quarter',
      unlocksKo: '대량 납품, 상점 계약, 울산·포항', unlocksEn: 'Bulk delivery, shop contracts, Ulsan · Pohang',
    },
    contract: { mainCount: 11, mainXp: 32450, subCount: 13, subXp: 18850 },
  },
  {
    chapter: 3, part: 3, partTitleKo: '겨울 배', partTitleEn: 'Winter Boat',
    titleKo: '울산·포항 — 사라진 것들', titleEn: 'Ulsan · Pohang — What Has Gone', levelBand: [45, 70],
    regionIds: ['ulsan', 'gyeongbuk_pohang'],
    questionKo: '사라진 것들 앞에서 무엇을 할 수 있나.',
    questionEn: 'What can you do in front of what has disappeared?',
    qualification: {
      chapter: 3, labelKo: '소형선박조종사 면허', labelEn: 'Small vessel operator licence',
      licenseIds: ['boat_operator'], deadlineKo: '시험 회차', deadlineEn: 'Exam session',
      onMissKo: '재응시(응시료)', onMissEn: 'Re-sit (fee)',
      unlocksKo: '선상 낚시, 지깅, 거제·여수·태안', unlocksEn: 'Boat fishing, jigging, Geoje · Yeosu · Taean',
    },
    contract: { mainCount: 9, mainXp: 67950, subCount: 13, subXp: 44200 },
  },
  {
    chapter: 4, part: 3, partTitleKo: '내 배', partTitleEn: 'My Boat',
    titleKo: '거제·여수·태안 — 손님을 태운다는 것', titleEn: 'Geoje · Yeosu · Taean — Carrying Passengers', levelBand: [70, 100],
    regionIds: ['gyeongnam_geoje', 'jeonnam_yeosu', 'chungnam_taean'],
    questionKo: '손님을 태운다는 건 목숨을 맡는다는 뜻이다.',
    questionEn: 'To carry a passenger is to hold a life.',
    qualification: {
      chapter: 4, labelKo: '낚시어선업 신고 + 선박 등록·검사', labelEn: 'Angling-boat business + vessel registration',
      licenseIds: ['angling_boat_biz'], deadlineKo: '성어기 개시 전', deadlineEn: 'Before the peak season',
      onMissKo: '한 시즌 손해', onMissEn: 'One season lost',
      unlocksKo: '손님 승선, 제주 항로', unlocksEn: 'Passengers aboard, the Jeju route',
    },
    contract: { mainCount: 11, mainXp: 161700, subCount: 15, subXp: 87750 },
  },
  {
    chapter: 5, part: 4, partTitleKo: '손님', partTitleEn: 'Guests',
    titleKo: '제주 — 항구를 지키는 방법', titleEn: 'Jeju — Ways to Keep a Harbour', levelBand: [100, 130],
    regionIds: ['jeju'],
    questionKo: '항구를 지키는 방법이 하나가 아니라면 나는 어느 쪽에 서나.',
    questionEn: 'If there is more than one way to keep a harbour, which side do you take?',
    qualification: {
      chapter: 5, labelKo: '해양관광업 등록 + 안전교육', labelEn: 'Marine tourism registration + safety course',
      licenseIds: ['marine_tourism'], deadlineKo: '대회 전', deadlineEn: 'Before the tournament',
      onMissKo: '다음 해 대회', onMissEn: 'Next year\'s tournament',
      unlocksKo: '가이드 영업, 울릉·인천', unlocksEn: 'Guide business, Ulleung · Incheon',
    },
    contract: { mainCount: 9, mainXp: 230850, subCount: 15, subXp: 138750 },
  },
  {
    chapter: 6, part: 5, partTitleKo: '먼 항로', partTitleEn: 'The Far Route',
    titleKo: '울릉·인천 — 기록은 누구를 위한 것인가', titleEn: 'Ulleung · Incheon — Who Is the Record For', levelBand: [130, 160],
    regionIds: ['ulleungdo', 'incheon'],
    questionKo: '기록은 누구를 위한 것인가.',
    questionEn: 'Who is the record for?',
    qualification: {
      chapter: 6, labelKo: '원거리 항해 계획 승인', labelEn: 'Long-range voyage plan approval',
      licenseIds: [], deadlineKo: '결항 시즌 전', deadlineEn: 'Before the cancellation season',
      onMissKo: '결항 누적', onMissEn: 'Cancellations pile up',
      unlocksKo: '독도 조사 동행', unlocksEn: 'Joining the Dokdo survey',
    },
    contract: { mainCount: 9, mainXp: 367650, subCount: 13, subXp: 212550 },
  },
  {
    chapter: 7, part: 5, partTitleKo: '조행록', partTitleEn: 'The Fishing Log',
    titleKo: '독도 — 물려받은 것을 물려주기', titleEn: 'Dokdo — Passing On What Was Passed Down', levelBand: [160, 200],
    regionIds: ['dokdo'],
    questionKo: '물려받은 것을 어떻게 물려주나.',
    questionEn: 'How do you pass on what was passed to you?',
    qualification: {
      chapter: 7, labelKo: '(자격 아님 — 인수) 조행록 완성', labelEn: '(not a licence — inheritance) Complete the log',
      licenseIds: [], deadlineKo: '조행록 완성', deadlineEn: 'When the log is complete',
      onMissKo: '—', onMissEn: '—',
      unlocksKo: '2층 공동작업장 재개관', unlocksEn: 'Reopening the second-floor workshop',
    },
    contract: { mainCount: 8, mainXp: 602800, subCount: 11, subXp: 442200 },
  },
];

export function getStoryChapter(ch: number): StoryChapterDef | undefined {
  return STORY_CHAPTERS.find((c) => c.chapter === ch);
}
