/**
 * @file StoryInquiry.ts
 * @description 253차 — 물어보기(조사 대화) 데이터: 공통 화제 목록 + 묶음 파일(`StoryInquiry1~3.ts`)을 합친다.
 *
 * 왜(사용자 지시 원문): 「스토리 형식에 따른 더 깊은 대화 (조사하기의 경우, 꼬리에 꼬리를 무는 대화,
 *   특정 인물 혹은 단서, 단어 등 source에 대한 추가 질문하기; 킹덤컴처럼)」.
 *
 * 구조
 *  - **화제(topic)** = 사람 · 곳 · 물건 · 낱말 · 단서. 알고 있는 화제는 아무에게나 물을 수 있다(대화창 「물어볼 게 있는데요.」).
 *    아는 길은 셋 — 처음부터(`known`) · 진행으로 저절로(`learnWhen`) · 누군가의 답에서(`opens`).
 *  - **물음(node)** = 한 사람에게 한 화제로 묻는 말과 그 답. 같은 화제라도 사람마다 답이 다르다.
 *    꼬리 질문은 `parent`(앞 물음을 들어야 보인다). 진행에 따라 열리는 말은 `requires`(스포일러 금지 — R2).
 *  - **조사 목표** — `effect.action`이 있는 물음은 그 편의 행동 목표 단계를 연다(진행 중 대화창에 질문으로 나온다).
 *
 * 쓰는 규칙(묶음 파일 공통)
 *  - 묻는 말(`ask`)은 주인공이 실제로 하는 말 — 한국어 6~36자 · 영어 80자 이하. 어른에게는 존댓말.
 *  - 답(`answer`)은 그 사람의 말투로 2~4문장 · 한국어 60~240자. 길면 빈 줄로 두 단락(한 · 영 단락 수 같게). 몸짓은 괄호 지문.
 *  - 답 속에 나온 새 사람 · 곳 · 낱말은 `opens`로 화제를 연다 — 꼬리에 꼬리.
 *  - 새 사실(인물 과거 · 정체 · 관계)을 지어내지 않는다. 그 화제가 열리는 시점까지 나레이션에 나온 것만.
 *  - 이모지 · 내부 id · 개발 용어 금지. 큰따옴표 금지(대화창이 붙인다).
 */

import type { InquiryNodeDef, InquiryTopicDef } from '../types/Story.js';
import { topic as T } from './StoryInquiryKit.js';
import { INQUIRY_TOPICS_1, INQUIRY_NODES_1 } from './StoryInquiry1.js';
import { INQUIRY_TOPICS_2, INQUIRY_NODES_2 } from './StoryInquiry2.js';
import { INQUIRY_TOPICS_3, INQUIRY_NODES_3 } from './StoryInquiry3.js';

/** 공통 화제 — 여러 사람이 함께 쓰는 사람 · 곳 · 낱말 · 단서 */
export const INQUIRY_TOPICS_BASE: InquiryTopicDef[] = [
  // ── 처음부터 아는 것 ──
  T('p_father', 'person', '아버지', 'My father',
    '아버지는 낚시 상자와 대 하나, 가족사진 한 장을 남겼다.', 'My father left a tackle box, one rod and a family photo.', { known: true }),
  T('c_photo', 'clue', '가족사진', 'The family photo',
    '어릴 적 바닷가에서 찍은 가족사진. 뒷면에 영금정이라고 눌러 적혀 있다.', 'A family photo taken by the sea when I was small. Yeonggeumjeong is pressed into the back.', { known: true }),
  T('c_father_rod', 'clue', '아버지의 대', "My father's rod",
    '아버지가 쓰던 낚싯대. 손잡이에 오래 쥔 자국이 남아 있다.', 'The rod my father used. The grip still holds the shape of his hand.', { known: true }),
  T('pl_yeonggeumjeong', 'place', '영금정', 'Yeonggeumjeong',
    '사진 뒤에 적힌 자리. 속초 바닷가의 바위 정자다.', 'The place written on the back of the photo. A pavilion on the rocks by the Sokcho shore.', { known: true }),
  // ── 속초에 와서 알게 되는 것 ──
  T('pl_market', 'place', '직판장', 'The direct market',
    '동명항 앞 수산물 직판장. 좌판이 줄지어 있다.', 'The seafood market by Dongmyeong harbour, stalls in rows.', { learnWhen: { questSeen: 'M1-01' } }),
  T('pl_dongmyeong', 'place', '동명항', 'Dongmyeong harbour',
    '영금정 옆 항구. 방파제와 직판장이 붙어 있다.', 'The harbour beside Yeonggeumjeong, with a breakwater and the market alongside.', { learnWhen: { questDone: 'M1-01' } }),
  T('p_okseon', 'person', '정옥선 씨', 'Jeong Okseon',
    '직판장 좌판 만복상회의 할머니. 말이 짧고 손이 빠르다.', 'The grandmother who runs the Manbok Store stall at the market. Few words, quick hands.', { learnWhen: { questDone: 'M1-01' } }),
  T('t_ice', 'thing', '얼음 상자', 'The ice crates',
    '좌판에서 경매장까지 나르는 얼음 상자. 생각보다 무겁다.', 'The ice crates carried from the stall to the auction floor. Heavier than they look.', { learnWhen: { questSeen: 'M1-02' } }),
  T('p_hyeonsu', 'person', '도현수', 'Do Hyeonsu',
    '어촌계장 손자. 아버지의 대를 보더니 여기다 쓰기 아깝다고 했다.', "The co-op chief's grandson. He took one look at my father's rod and said it was wasted here.", { learnWhen: { questSeen: 'M1-04' } }),
  T('w_law_five', 'word', '다섯 가지 법', 'The five rules',
    '정옥선 씨가 앉혀 놓고 들려준 바다의 법.', 'The rules of the sea Okseon sat me down to hear.', { learnWhen: { questSeen: 'M1-06' } }),
  T('w_coop_member', 'word', '계원', 'Co-op member',
    '어촌계에 든 사람. 계원이 돼도 낚싯대로 잡은 건 못 판다고 했다.', 'Someone who belongs to the fishing co-op. Even a member cannot sell what a rod caught, she said.', { learnWhen: { questSeen: 'M1-06' } }),
  T('w_size_limit', 'word', '금지체장', 'Minimum size',
    '이보다 작으면 잡아도 놓아줘야 하는 길이.', 'The length below which a fish has to go back.', { learnWhen: { questDone: 'M1-06' } }),
  T('w_closed_season', 'word', '금어기', 'Closed season',
    '그 물고기를 잡으면 안 되는 달.', 'The months when that fish must not be taken.', { learnWhen: { questDone: 'M1-06' } }),
  T('c_measure', 'clue', '낡은 계측자', 'The worn measuring rule',
    '정옥선 씨가 좌판 서랍에서 꺼내 준 계측자. 눈금 몇 개가 지워졌다.', 'The measuring rule Okseon gave me from her stall drawer. A few marks have worn away.', { learnWhen: { flag: 'choice.m1_law_story' } }),
  T('p_tak_mansu', 'person', '탁만수 씨', 'Tak Mansu',
    '죽간 공방의 노인. 짐부터 어떻게 좀 하라는 말이 첫 가르침이었다.', 'The old man of the bamboo rod workshop. Sort out your gear first was his first lesson.', { learnWhen: { questSeen: 'M1-08' } }),
  T('p_coop', 'person', '동명항 어촌계', 'Dongmyeong Fishing Co-op',
    '항구의 바다를 나눠 쓰는 사람들. 계장이 일을 나눈다.', "The people who share the harbour's sea. The chief hands out the work.", { learnWhen: [{ questSeen: 'M1-10' }, { questDone: 'M1-06' }] }),
  T('w_trap', 'word', '통발', 'Traps',
    '미끼를 넣어 바닥에 가라앉혀 두는 그물 통. 계원이면 통발로 잡은 건 팔 수 있다.', 'A baited net pot left on the bottom. A member can sell what traps catch.', { learnWhen: { questSeen: 'M1-11' } }),
  T('w_wipan', 'word', '위판', 'Consignment auction',
    '어획물을 수협 위판장에 내 경매로 파는 것.', "Selling the catch by auction on the fisheries co-op's consignment floor.", { learnWhen: { questSeen: 'M2-01' } }),
  T('pl_auction', 'place', '위판장', 'The auction floor',
    '상자가 줄지어 놓이고 경매사의 손이 올라가는 곳.', "Where the crates line up and the auctioneer's hand goes up.", { learnWhen: { questSeen: 'M2-01' } }),
  T('w_journal', 'word', '조행록', 'The fishing log',
    '잡은 것을 적는 일지. 정옥선 씨는 남기는 기록이라고 했다.', 'The log where I write what I catch. Okseon called it a record that keeps.', { learnWhen: { questSeen: 'M3-06' } }),
  T('c_pollock', 'clue', '명태', 'Pollock',
    '도감에 포획 금지로 떠 있는 물고기. 노인들은 이 바다에 가득했다고 한다.', 'A fish marked no-catch in the field guide. The old folk say this sea was full of it.', { learnWhen: { questSeen: 'M3-06' } }),
  T('p_kang', 'person', '강두철 씨', 'Kang Ducheol',
    '방파제 끝에서 채비가 엉켜 있던 노인. 낚시는 처음이라고 했다.', 'The old man at the end of the breakwater with a tangled rig. He said it was his first time fishing.', { learnWhen: [{ questSeen: 'N03-1' }, { questSeen: 'M4-11' }] }),
  T('p_bae_nuri', 'person', '배누리', 'Bae Nuri',
    '청초고 방파제부 부장. 낚으면 먹는다가 모토다.', 'Captain of the Cheongcho High breakwater club. Her motto is: catch it, eat it.', { learnWhen: { questSeen: 'N04-1' } }),
  T('p_baram', 'person', '바람', 'Baram',
    '리어카를 붙인 자전거로 항구를 도는 사람. 이름을 묻자 바람이라고만 했다.', 'A man who rides the harbours with a cart hitched to his bicycle. Asked his name, he only said Baram.', { learnWhen: [{ questSeen: 'N01-1' }, { questSeen: 'M3-04' }] }),
  T('p_oh_sechan', 'person', '오세찬 감시원', 'Warden Oh Sechan',
    '해파리와 불가사리를 세는 해양환경 감시원.', 'The marine environment warden who counts jellyfish and starfish.', { learnWhen: { questSeen: 'N21-1' } }),
  T('p_saebyeok', 'person', '탁새벽', 'Tak Saebyeok',
    '탁만수 씨의 손자. 열두 살인데 제 손으로 대를 만든다.', "Tak Mansu's grandson. Twelve years old, and he makes rods with his own hands.", { learnWhen: [{ questSeen: 'N02-6' }, { questSeen: 'M4-08' }] }),
];

/** 화제 전부(공통 + 묶음) */
export const INQUIRY_TOPICS: readonly InquiryTopicDef[] = [...INQUIRY_TOPICS_BASE, ...INQUIRY_TOPICS_1, ...INQUIRY_TOPICS_2, ...INQUIRY_TOPICS_3];

/** 물음 전부(묶음) */
export const INQUIRY_NODES: readonly InquiryNodeDef[] = [...INQUIRY_NODES_1, ...INQUIRY_NODES_2, ...INQUIRY_NODES_3];
