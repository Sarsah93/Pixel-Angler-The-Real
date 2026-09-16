/**
 * @file StoryArcs.ts
 * @description NPC 23아크 + 메인 3인 (134차 17 → 137차 +N18·N19 → 138차 +N20~N23)
 *
 * 29편 원작에서 가져온 것은 관계 원형 한 줄뿐 — 인물명·고유 설정·장면은 옮기지 않는다(원칙 §1-5).
 * 아크 완주 = `questIds` 전부 완료. 조행록 장의 두 번째 조건이 이것이다.
 */

import type { StoryArcDef, StoryNpcDef } from '../types/Story.js';

/** 메인 3인 — 발주 NPC (아크 아님) */
export const STORY_MAIN_NPCS: StoryNpcDef[] = [
  { id: 'player', nameKo: '한여름', nameEn: 'Han Yeoreum', roleKo: '22세 · 주인공 (이름·성별 변경 가능)', roleEn: '22 · the player (name and gender editable)' },
  { id: 'okseon', nameKo: '정옥선', nameEn: 'Jeong Ok-seon', roleKo: '71세 · 동명동 직판장 좌판 「만복상회」', roleEn: '71 · stall "Manbok Store" at the Dongmyeong fish market' },
  { id: 'hyeonsu', nameKo: '도현수', nameEn: 'Do Hyeon-su', roleKo: '24세 · 어촌계장 손자, 라이벌', roleEn: '24 · the co-op chief\'s grandson, rival' },
  { id: 'coop', nameKo: '동명항 어촌계', nameEn: 'Dongmyeong Fishing Co-op', roleKo: '실습 · 공동작업 · 총회', roleEn: 'Training · community work · general meeting' },
];

export const STORY_ARCS: StoryArcDef[] = [
  { id: 'N01', titleKo: '바람 — 이름을 말하지 않는 떠돌이', titleEn: 'Baram — the drifter with no name', regionId: 'gangwon_sokcho',
    npcs: [{ id: 'baram', nameKo: '바람', nameEn: 'Baram', roleKo: '리어카 자전거로 전국 항구를 도는 무적(無籍) 조사', roleEn: 'An unregistered angler touring every port on a cart-bicycle' }],
    relationKo: '떠돌며 한 마리로 매듭을 푸는 해결사', relationEn: 'A wanderer who unties knots with a single fish',
    angleKo: '소속 없이 사는 삶의 다른 답', angleEn: 'Another answer to living without belonging',
    questIds: ['N01-1', 'N01-2', 'N01-3', 'N01-4', 'N01-5', 'N01-6', 'N01-7'] },
  { id: 'N02', titleKo: '탁만수·탁새벽 — 죽간 공방 조손', titleEn: 'Tak Man-su & Tak Sae-byeok — the bamboo-rod workshop', regionId: 'gangwon_sokcho',
    npcs: [{ id: 'tak_mansu', nameKo: '탁만수', nameEn: 'Tak Man-su', roleKo: '78세 · 속초 죽간 공방의 마지막 대', roleEn: '78 · last master of the Sokcho bamboo-rod workshop' },
      { id: 'tak_saebyeok', nameKo: '탁새벽', nameEn: 'Tak Sae-byeok', roleKo: '12세 · 천재 손자', roleEn: '12 · the prodigy grandchild' }],
    relationKo: '장인 조부 + 천재 손자', relationEn: 'Master grandfather and prodigy grandchild',
    angleKo: '물려줄 사람이 있는 집', angleEn: 'A house with someone to pass things to',
    questIds: ['N02-1', 'N02-5', 'N02-6', 'N02-2', 'N02-3', 'N02-4'], repeatableKo: '죽간 손질 의뢰', repeatableEn: 'Bamboo-rod maintenance' },
  { id: 'N03', titleKo: '강두철 — 채비 못 묶는 초보, 실은 수협 조합장', titleEn: 'Kang Du-cheol — the "beginner" who runs the co-op', regionId: 'gangwon_sokcho',
    npcs: [{ id: 'kang_ducheol', nameKo: '강두철', nameEn: 'Kang Du-cheol', roleKo: '63세 · 초보 행세하는 수협 조합장', roleEn: '63 · co-op president posing as a beginner' }],
    relationKo: '신분을 모르는 사제 역전', relationEn: 'Teacher and student, identity unknown',
    angleKo: '처음으로 가르치는 입장', angleEn: 'The first time you are the one teaching',
    questIds: ['N03-1', 'N03-5', 'N03-2', 'N03-6', 'N03-3', 'N03-7', 'N03-4'] },
  { id: 'N04', titleKo: '청초고 방파제부', titleEn: 'Cheongcho High Breakwater Club', regionId: 'gangwon_sokcho',
    npcs: [{ id: 'bae_nuri', nameKo: '배누리', nameEn: 'Bae Nu-ri', roleKo: '17세 · 부장', roleEn: '17 · club president' },
      { id: 'ha_sua', nameKo: '하수아', nameEn: 'Ha Su-a', roleKo: '16세 · 부원', roleEn: '16 · member' },
      { id: 'mo_jinju', nameKo: '모진주', nameEn: 'Mo Jin-ju', roleKo: '17세 · 외톨이 실력자', roleEn: '17 · the loner who can really fish' }],
    relationKo: '초보 입부기 + 외톨이 실력자 + 부원 낚기 개그', relationEn: 'Rookie joins, loner expert, recruit-a-member comedy',
    angleKo: '처음 어른 취급을 받는 관계', angleEn: 'The first people who treat you as the adult',
    questIds: ['N04-1', 'N04-2', 'N04-3', 'N04-4', 'N04-5', 'N04-6'], repeatableKo: '방파제부 도시락', repeatableEn: 'Club lunchbox run' },
  { id: 'N05', titleKo: '서하린·나기범 — 캐치&이트 콤비', titleEn: 'Seo Ha-rin & Na Gi-beom — catch & eat duo', regionId: 'busan',
    npcs: [{ id: 'seo_harin', nameKo: '서하린', nameEn: 'Seo Ha-rin', roleKo: '26세 · 화려한 초보 유튜버', roleEn: '26 · flashy beginner streamer' },
      { id: 'na_gibeom', nameKo: '나기범', nameEn: 'Na Gi-beom', roleKo: '28세 · 내향 달인', roleEn: '28 · quiet expert' }],
    relationKo: '화려한 초보 + 내향 달인', relationEn: 'Flashy beginner and quiet expert',
    angleKo: '취미로 하는 사람들의 시선', angleEn: 'How people who fish for fun see it',
    questIds: ['N05-1', 'N05-2', 'N05-6', 'N05-7', 'N05-3', 'N05-4', 'N05-5'] },
  { id: 'N06', titleKo: '씨바스터즈 — 해양대 루어 동아리', titleEn: 'Seabassters — the university lure club', regionId: 'busan',
    npcs: [{ id: 'go_hosu', nameKo: '고호수', nameEn: 'Go Ho-su', roleKo: '농구부인 줄 알고 가입', roleEn: 'Joined thinking it was basketball' },
      { id: 'mo_taejo', nameKo: '모태조', nameEn: 'Mo Tae-jo', roleKo: '광기의 선배', roleEn: 'The manic senior' },
      { id: 'baek_haneul', nameKo: '백하늘', nameEn: 'Baek Ha-neul', roleKo: '알바생에게 반해 입문', roleEn: 'Started fishing for a crush' },
      { id: 'yeo_gangsan', nameKo: '여강산', nameEn: 'Yeo Gang-san', roleKo: 'OB', roleEn: 'Alumni' }],
    relationKo: '착각 입부 + 불순한 동기 + 괴어 사냥', relationEn: 'Accidental recruit, impure motives, monster hunt',
    angleKo: '주인공에게 없는 20대', angleEn: 'The twenties the player never had',
    questIds: ['N06-1', 'N06-2', 'N06-3', 'N06-4'], repeatableKo: '동아리 대결', repeatableEn: 'Club challenge' },
  { id: 'N07', titleKo: '짐 강 — 유작 루어 넷', titleEn: 'Jim Kang — four last lures', regionId: 'busan',
    npcs: [{ id: 'jim_kang', nameKo: '짐 강', nameEn: 'Jim Kang', roleKo: '58세 · 요절한 루어 장인의 유작을 찾는 사람', roleEn: '58 · hunting the four last lures of a craftsman who died young' }],
    relationKo: '흩어진 전설 루어 수집', relationEn: 'Collecting scattered legendary lures',
    angleKo: '유품을 쓰는 법', angleEn: 'How to use what the dead left',
    questIds: ['N07-1', 'N07-2', 'N07-3', 'N07-4'] },
  { id: 'N08', titleKo: '고만석·고해나 — 방어진 「고래마루」', titleEn: 'Go Man-seok & Go Hae-na — the "Goraemaru"', regionId: 'ulsan',
    npcs: [{ id: 'go_manseok', nameKo: '고만석', nameEn: 'Go Man-seok', roleKo: '58세 · 험상궂은 낚시어선 선장', roleEn: '58 · gruff angling-boat captain' },
      { id: 'go_haena', nameKo: '고해나', nameEn: 'Go Hae-na', roleKo: '24세 · 선장의 딸', roleEn: '24 · the captain\'s daughter' }],
    relationKo: '험상궂은 선장과 딸, 승객마다의 인생', relationEn: 'A gruff captain, his daughter, and every passenger\'s story',
    angleKo: '장래 직업 미리보기', angleEn: 'A preview of your future trade',
    questIds: ['N08-1', 'N08-2', 'N08-3', 'N08-4'], repeatableKo: '고래마루 승객 사연', repeatableEn: 'Goraemaru passenger stories' },
  { id: 'N09', titleKo: '이수연·한봄 — 구룡포 의붓자매', titleEn: 'Lee Su-yeon & Han Bom — Guryongpo stepsisters', regionId: 'gyeongbuk_pohang',
    npcs: [{ id: 'lee_suyeon', nameKo: '이수연', nameEn: 'Lee Su-yeon', roleKo: '17세 · 상실을 품은 소녀', roleEn: '17 · a girl carrying a loss' },
      { id: 'han_bom', nameKo: '한봄', nameEn: 'Han Bom', roleKo: '17세 · 요리광 의붓자매', roleEn: '17 · cooking-mad stepsister' }],
    relationKo: '상실을 품은 소녀 + 요리광 의붓자매', relationEn: 'A grieving girl and a cooking-mad stepsister',
    angleKo: '상실을 다루는 거울', angleEn: 'A mirror for handling loss',
    questIds: ['N09-1', 'N09-2', 'N09-3', 'N09-4'] },
  { id: 'N10', titleKo: '남궁현 — 물류창고 야간 관리인, 전직 전설', titleEn: 'Namgung Hyeon — night warehouse keeper, former legend', regionId: 'gyeongbuk_pohang',
    npcs: [{ id: 'namgung_hyeon', nameKo: '남궁현', nameEn: 'Namgung Hyeon', roleKo: '61세 · 낚시용품 물류창고 야간 관리인', roleEn: '61 · night keeper at a tackle warehouse' }],
    relationKo: '은퇴한 전설이 정장 차림으로 압도', relationEn: 'A retired legend who still dominates in a suit',
    angleKo: '실력과 생계의 거리', angleEn: 'The distance between skill and a living',
    questIds: ['N10-1', 'N10-2', 'N10-4', 'N10-3'] },
  { id: 'N11', titleKo: '채금자·채파도 — 지세포 「동백마루」', titleEn: 'Chae Geum-ja & Chae Pa-do — the "Dongbaekmaru"', regionId: 'gyeongnam_geoje',
    npcs: [{ id: 'chae_geumja', nameKo: '채금자', nameEn: 'Chae Geum-ja', roleKo: '29세 · 조타 일류·낚시 서툰 여선장', roleEn: '29 · ace helmswoman, clumsy angler' },
      { id: 'chae_pado', nameKo: '채파도', nameEn: 'Chae Pa-do', roleKo: '23세 · 덜렁이 신입', roleEn: '23 · the scatterbrained rookie' }],
    relationKo: '조타 일류·낚시 서툰 여선장 + 덜렁이 신입', relationEn: 'Expert pilot who can\'t fish, plus a clumsy rookie',
    angleKo: '안전을 이유로 거절하는 법', angleEn: 'How to say no for safety',
    questIds: ['N11-1', 'N11-2', 'N11-3', 'N11-4'] },
  { id: 'N12', titleKo: '오가윤·정우미 — 여수', titleEn: 'Oh Ga-yun & Jeong U-mi — Yeosu', regionId: 'jeonnam_yeosu',
    npcs: [{ id: 'oh_gayun', nameKo: '오가윤', nameEn: 'Oh Ga-yun', roleKo: '29세 · 여수 호텔 직원', roleEn: '29 · Yeosu hotel staff' },
      { id: 'jeong_umi', nameKo: '정우미', nameEn: 'Jeong U-mi', roleKo: '35세 · 캠핑카 앵글러', roleEn: '35 · camper-van angler' }],
    relationKo: '다툰 날 만난 언니, "못 낚아도 괜찮다"', relationEn: 'The older sister you met on a bad day — "it\'s fine not to catch"',
    angleKo: '조과로 자신을 재지 않기', angleEn: 'Not measuring yourself by the catch',
    questIds: ['N12-1', 'N12-2', 'N12-3'] },
  { id: 'N13', titleKo: '송기백·마감기 — 신진도', titleEn: 'Song Gi-baek & Ma Gam-gi — Sinjindo', regionId: 'chungnam_taean',
    npcs: [{ id: 'song_gibaek', nameKo: '송기백', nameEn: 'Song Gi-baek', roleKo: '81세 · 폐어선 개조 거처에 사는 노인', roleEn: '81 · lives in a converted derelict boat' },
      { id: 'ma_gamgi', nameKo: '마감기', nameEn: 'Ma Gam-gi', roleKo: '34세 · 마감에서 도망친 작가', roleEn: '34 · a writer on the run from a deadline' }],
    relationKo: '배에 사는 노인 + 마감에서 도망친 작가', relationEn: 'An old man on a boat and a writer fleeing a deadline',
    angleKo: '오래 산 사람의 시간 감각', angleEn: 'How time feels to someone who has lived long',
    questIds: ['N13-1', 'N13-2', 'N13-3'] },
  { id: 'N14', titleKo: '오세린·마라·유리아 — 제주 3인', titleEn: 'Oh Se-rin, Mara & Yu Ri-a — the Jeju three', regionId: 'jeju',
    npcs: [{ id: 'oh_serin', nameKo: '오세린', nameEn: 'Oh Se-rin', roleKo: '19세 · 대회 지망생', roleEn: '19 · tournament hopeful' },
      { id: 'mara', nameKo: '마라', nameEn: 'Mara', roleKo: '19세 · 꿈을 버린 친구', roleEn: '19 · the friend who gave up' },
      { id: 'yu_ria', nameKo: '유리아', nameEn: 'Yu Ri-a', roleKo: '33세 · 한물간 케이블 MC', roleEn: '33 · washed-up cable host' }],
    relationKo: '어릴 적 선언·버린 꿈·한물간 스타', relationEn: 'A childhood vow, an abandoned dream, a faded star',
    angleKo: '재능 없이 시작한 사람의 질문', angleEn: 'The question of someone who started without talent',
    questIds: ['N14-1', 'N14-2', 'N14-3', 'N14-4', 'N14-5'] },
  { id: 'N15', titleKo: '오세라·연태오 — 울릉', titleEn: 'Oh Se-ra & Yeon Tae-o — Ulleung', regionId: 'ulleungdo',
    npcs: [{ id: 'oh_sera', nameKo: '오세라', nameEn: 'Oh Se-ra', roleKo: '34세 · 울릉 야간 편의점 점주', roleEn: '34 · runs the Ulleung night convenience store' },
      { id: 'yeon_taeo', nameKo: '연태오', nameEn: 'Yeon Tae-o', roleKo: '27세 · 숨긴 제자', roleEn: '27 · the secret apprentice' }],
    relationKo: '혼자가 좋은 앵글러 + 숨긴 사제관계', relationEn: 'An angler who prefers solitude, and a hidden apprenticeship',
    angleKo: '혼자와 외로움의 차이', angleEn: 'The difference between alone and lonely',
    questIds: ['N15-1', 'N15-2'] },
  { id: 'N16', titleKo: '석독구 — 등대지기 손자', titleEn: 'Seok Dok-gu — the lighthouse keeper\'s grandson', regionId: 'dokdo',
    npcs: [{ id: 'seok_dokgu', nameKo: '석독구', nameEn: 'Seok Dok-gu', roleKo: '12세 · 공부는 꽝, 낚시는 천재', roleEn: '12 · hopeless at school, a genius with a rod' },
      { id: 'seok_daeyang', nameKo: '석대양', nameEn: 'Seok Dae-yang', roleKo: '등대지기 · 고진태 선장을 기억한다', roleEn: 'Lighthouse keeper who remembers Captain Go' }],
    relationKo: '공부는 꽝, 낚시는 천재인 섬 꼬마', relationEn: 'The island kid who fails at school and shines at fishing',
    angleKo: '처음 물려주는 상대', angleEn: 'The first person you pass something to',
    questIds: ['N16-1', 'N16-2', 'N16-3', 'N16-4'] },
  { id: 'N17', titleKo: '단철호·하민지 — 인천 짬낚시', titleEn: 'Dan Cheol-ho & Ha Min-ji — Incheon lunch-break fishing', regionId: 'incheon',
    npcs: [{ id: 'dan_cheolho', nameKo: '단철호', nameEn: 'Dan Cheol-ho', roleKo: '52세 · 부장님', roleEn: '52 · the department head' },
      { id: 'ha_minji', nameKo: '하민지', nameEn: 'Ha Min-ji', roleKo: '26세 · 첼로 단원', roleEn: '26 · orchestra cellist' }],
    relationKo: '업무 틈 짬낚시 + 도심 속 비밀', relationEn: 'Fishing between meetings, a secret in the city',
    angleKo: '생활 속에 낚시를 끼우는 법', angleEn: 'How to fit fishing into a life',
    questIds: ['N17-1', 'N17-2', 'N17-3'] },
  // ── 137차 신설 — 챕터를 가로지르는 두 아크 ──
  { id: 'N18', titleKo: '도현수 — 라이벌에서 우리로', titleEn: 'Do Hyeon-su — from rival to "us"', regionId: 'gangwon_sokcho',
    npcs: [{ id: 'hyeonsu', nameKo: '도현수', nameEn: 'Do Hyeon-su', roleKo: '24세 · 어촌계장 손자, 라이벌', roleEn: '24 · the co-op chief\'s grandson, rival' }],
    relationKo: '먼저 도착해 있던 사람 — 7챕터 전부에 한 편씩',
    relationEn: 'The one who got there first — one episode in every chapter',
    angleKo: '경쟁이 동행으로 바뀌는 지점', angleEn: 'Where rivalry turns into company',
    questIds: ['N18-1', 'N18-2', 'N18-3', 'N18-4', 'N18-5', 'N18-6', 'N18-7'] },
  { id: 'N19', titleKo: '정옥선 · 탁만수 — 오십 년의 거리', titleEn: 'Jeong Ok-seon & Tak Man-su — fifty years apart', regionId: 'gangwon_sokcho',
    npcs: [{ id: 'okseon', nameKo: '정옥선', nameEn: 'Jeong Ok-seon', roleKo: '71세 · 동명동 직판장 좌판 「만복상회」', roleEn: '71 · stall "Manbok Store" at the Dongmyeong fish market' },
      { id: 'tak_mansu', nameKo: '탁만수', nameEn: 'Tak Man-su', roleKo: '78세 · 속초 죽간 공방의 마지막 대', roleEn: '78 · last master of the Sokcho bamboo-rod workshop' }],
    relationKo: '서로를 향한 마음을 끝내 말하지 못한 두 노인 — 심부름꾼은 늘 나다',
    relationEn: 'Two old people who never said it — and you are always the errand runner',
    angleKo: '속초를 계속 돌아오게 만드는 이유', angleEn: 'The reason you keep coming back to Sokcho',
    questIds: ['N19-1', 'N19-2', 'N19-3', 'N19-4', 'N19-5', 'N19-6'] },
  // ── 138차 증설 4아크 — 과증식 대응 · 어종 관리 · 콘텐츠 제작 · 생활 기반 ──
  { id: 'N20', titleKo: '유하랑 — 카메라를 든 사람', titleEn: 'Yu Ha-rang — the one with the camera', regionId: 'busan',
    npcs: [{ id: 'yu_harang', nameKo: '유하랑', nameEn: 'Yu Ha-rang', roleKo: '27세 · 구독자 300명의 낚시 방송인', roleEn: '27 · a fishing streamer with 300 subscribers' }],
    relationKo: '찍는 사람과 찍히는 사람', relationEn: 'The one filming and the one filmed',
    angleKo: '보여 주려고 하는 낚시와 하려고 하는 낚시', angleEn: 'Fishing to be seen, and fishing to fish',
    questIds: ['N20-1', 'N20-2', 'N20-3', 'N20-4', 'N20-5', 'N20-6', 'N20-7'] },
  { id: 'N21', titleKo: '오세찬 — 바다가 넘칠 때', titleEn: 'Oh Se-chan — when the sea overflows', regionId: 'gangwon_sokcho',
    npcs: [{ id: 'oh_sechan', nameKo: '오세찬', nameEn: 'Oh Se-chan', roleKo: '41세 · 해양환경 감시원 (해파리·불가사리 모니터링)', roleEn: '41 · marine monitor tracking jellyfish and seastar blooms' }],
    relationKo: '치우는 사람 곁의 손', relationEn: 'A second pair of hands for the one who cleans up',
    angleKo: '잡는 것 말고 치우는 것도 바다 일이다', angleEn: 'Clearing the sea is sea work too',
    questIds: ['N21-1', 'N21-2', 'N21-3', 'N21-4', 'N21-5', 'N21-6', 'N21-7'], repeatableKo: '과증식 구역 수거', repeatableEn: 'Bloom-zone clearing' },
  { id: 'N22', titleKo: '하늬 — 손으로 짓는 것', titleEn: 'Ha-nui — things made by hand', regionId: 'busan',
    npcs: [{ id: 'ha_nui', nameKo: '하늬', nameEn: 'Ha-nui', roleKo: '35세 · 생활공방(목공·수리) 주인', roleEn: '35 · runs a maker workshop for woodwork and repairs' }],
    relationKo: '사는 대신 만드는 법을 가르치는 사람', relationEn: 'Someone who teaches making instead of buying',
    angleKo: '집이 잠만 자는 방에서 돌아올 곳이 되는 과정', angleEn: 'How a room you sleep in becomes somewhere you return to',
    questIds: ['N22-1', 'N22-2', 'N22-3', 'N22-4', 'N22-5', 'N22-6', 'N22-7', 'N22-8'], repeatableKo: '공방 수리 의뢰', repeatableEn: 'Workshop repair jobs' },
  { id: 'N23', titleKo: '채수림 — 세는 사람', titleEn: 'Chae Su-rim — the one who counts', regionId: 'busan',
    npcs: [{ id: 'chae_surim', nameKo: '채수림', nameEn: 'Chae Su-rim', roleKo: '33세 · 수산질병·양식 관리사', roleEn: '33 · aquaculture health inspector' }],
    relationKo: '몇 마리가 아니라 몇 종을 적는 사람', relationEn: 'Someone who records species, not numbers',
    angleKo: '잡은 것을 세는 눈', angleEn: 'The eye that counts what was caught',
    questIds: ['N23-1', 'N23-2', 'N23-3', 'N23-4', 'N23-5', 'N23-6'] },
];

export function getStoryArc(id: string): StoryArcDef | undefined {
  return STORY_ARCS.find((a) => a.id === id);
}

/** npc id → 정의 (메인 3인 + 아크 NPC) */
export function getStoryNpc(id: string): StoryNpcDef | undefined {
  const m = STORY_MAIN_NPCS.find((n) => n.id === id);
  if (m) return m;
  for (const a of STORY_ARCS) { const n = a.npcs.find((x) => x.id === id); if (n) return n; }
  return undefined;
}

/** npc id → 소속 아크 id (메인 NPC는 undefined) */
export function arcOfNpc(id: string): string | undefined {
  return STORY_ARCS.find((a) => a.npcs.some((n) => n.id === id))?.id;
}
