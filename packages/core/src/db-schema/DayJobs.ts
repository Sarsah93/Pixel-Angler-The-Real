/**
 * @file DayJobs.ts
 * @description 일용직(품삯) 일감 — Ch1 「얼음 나르기」·공동작업의 실시스템 (135차, STORY_SPEC_v3 §2 튜토리얼)
 *
 * 스토리가 "실습생은 가난하다"를 성립시키려면 **낚싯대 어획물 판매 없이도 굴러가는 수입원**이
 * 먼저 있어야 한다(§0.5-6). 품삯이 그 자리다 — NPC에게 말을 걸어 하루 몇 번 일하고 돈을 받는다.
 *
 * 설계 원칙
 *  - **행동력을 쓴다**: 피로↑ · 허기·수분↓ (`applyVitalsAction` 과 같은 축). 공짜 돈이 아니다.
 *  - **하루 상한**(`perDay`)이 있다. 하루는 침대 수면으로만 넘어가므로(125차 활동 시간 규칙)
 *    무한 반복 파밍이 불가능하다.
 *  - 완료 시 `questKey`(= `custom` 목표의 placeKey)를 스토리 이벤트로 흘려 퀘스트 목표를 자동으로 닫는다.
 *
 * ⚠ 수치는 전부 **초기값**이다 — 실플레이 조율은 `TUNING.job` 슬라이더(F8).
 * 292차 — 속초 밖 8지역 인물 18편(지역마다 2~3 · 그 사람이 서 있는 지역에서만 — 출장(291) 나온 사람은 자기 지역 일감을 들고 오지 않는다).
 */

import type { StoryLicenseId } from '../types/Story.js';

export interface DayJobDef {
  id: string;
  /** 발주 NPC (StoryArcs npcId) */
  npcId: string;
  /** 지역 id — 해당 지역에서만 노출 */
  regionId: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  /** 품삯 (원) */
  wage: number;
  /** 소요 활동 시간(분) — 안내 표기 + 드레인 산정 기준 */
  minutes: number;
  /** 피로 증가 (0~100 축) */
  fatigue: number;
  /** 허기 감소 (%) */
  hunger: number;
  /** 수분 감소 (%) */
  hydration: number;
  /** 하루 최대 횟수 */
  perDay: number;
  /** 최소 레벨 */
  minLevel: number;
  /** 항구 평판 증가 (없으면 0) */
  rep?: number;
  /** 어촌계 공동작업 — 실습생 증(unlock.trainee) 이후에만 열린다 */
  needsTrainee?: boolean;
  /** 요구 자격 (없으면 누구나) */
  requires?: StoryLicenseId;
  /**
   * 완료 시 흘릴 스토리 이벤트 키 — `custom` 목표의 `placeKey`와 매칭된다.
   * (`communityWork` 목표는 `job:coop_work` 를 별도로 인정한다 — StoryStore.match)
   */
  questKey: string;
  /** 작업 로그 한 줄 (완료 안내) */
  flavorKo: string;
  flavorEn: string;
}

export const DAY_JOBS: DayJobDef[] = [
  {
    id: 'ice_haul',
    npcId: 'okseon',
    regionId: 'gangwon_sokcho',
    nameKo: '얼음 나르기', nameEn: 'Hauling Ice',
    descKo: '좌판 뒤 얼음 상자를 경매장까지. 한 번에 두 개씩, 허리로 들지 말 것.',
    descEn: 'Ice crates from behind the stall to the auction house. Two at a time, lift with your legs.',
    wage: 12000, minutes: 50, fatigue: 9, hunger: 6, hydration: 8,
    perDay: 2, minLevel: 1, rep: 1,
    questKey: 'job:ice_haul',
    flavorKo: '얼음 상자를 다 옮겼다. 손끝이 아리다.',
    flavorEn: 'The crates are moved. Your fingertips sting.',
  },
  {
    id: 'net_mend',
    npcId: 'kang_ducheol',
    regionId: 'gangwon_sokcho',
    nameKo: '그물 손질 거들기', nameEn: 'Helping Mend Nets',
    descKo: '찢어진 코를 골라 묶는다. 매듭 하나에 한 번씩 잔소리가 붙는다.',
    descEn: 'Pick out the torn meshes and tie them. One lecture per knot.',
    wage: 8000, minutes: 40, fatigue: 6, hunger: 4, hydration: 4,
    perDay: 3, minLevel: 1,
    questKey: 'job:net_mend',
    flavorKo: '매듭 스무 개. 손은 기억한다.',
    flavorEn: 'Twenty knots. The hands remember.',
  },
  {
    id: 'coop_work',
    npcId: 'coop',
    regionId: 'gangwon_sokcho',
    nameKo: '어촌계 공동작업', nameEn: 'Co-op Community Work',
    descKo: '양망 보조와 미역 정리. 이름 대신 "실습생"으로 불린다.',
    descEn: 'Net hauling and sorting seaweed. They call you "trainee", not by name.',
    wage: 25000, minutes: 120, fatigue: 18, hunger: 14, hydration: 16,
    perDay: 1, minLevel: 1, rep: 2, needsTrainee: true,
    questKey: 'job:coop_work',
    flavorKo: '허리가 끊어질 것 같지만, 저녁에 국을 한 그릇 얻어먹었다.',
    flavorEn: 'Your back is breaking, but they gave you a bowl of soup at dusk.',
  },

// 292차 — 속초 밖 지역의 품삯 일감
  // ── busan ──
  {
    id: 'fish_prep_assist',
    npcId: 'na_gibeom',
    regionId: 'busan',
    nameKo: '가게 손질 거들기', nameEn: 'Helping at the Fish Stall',
    descKo: '…비늘 치고, 도마 닦고, 얼음 다시 깔아요. 말은 안 해도 돼요.',
    descEn: "...Scale the fish, wipe the boards, lay fresh ice. You don't have to talk.",
    wage: 10000, minutes: 45, fatigue: 7, hunger: 5, hydration: 5,
    perDay: 2, minLevel: 1,
    questKey: 'job:fish_prep_assist',
    flavorKo: '칼 소리만 났다. 그게 편했다.',
    flavorEn: 'Only the knives made a sound. That suited me.',
  },
  {
    id: 'tank_count_assist',
    npcId: 'chae_surim',
    regionId: 'busan',
    nameKo: '수조 검역 보조', nameEn: 'Quarantine Tank Assistant',
    descKo: '수조 물 갈고, 폐사 수 세서 적어요. 느낌 말고 숫자로요. 규정대로.',
    descEn: 'Change the tank water, count the dead and write it down. Numbers, not impressions. By the book.',
    wage: 14000, minutes: 60, fatigue: 6, hunger: 4, hydration: 5,
    perDay: 2, minLevel: 2, rep: 1,
    questKey: 'job:tank_count_assist',
    flavorKo: '여덟 수조, 폐사 셋. 숫자로 적었다.',
    flavorEn: 'Eight tanks, three dead. I wrote it down as numbers.',
  },
  {
    id: 'old_tackle_sort',
    npcId: 'jim_kang',
    regionId: 'busan',
    nameKo: '옛 채비 상자 가리기', nameEn: 'Sorting Old Tackle Boxes',
    descKo: '상자째 들여온 옛 채비다. 녹슨 건 버리고 쓸 만한 건 골라. 루어는 손대지 마.',
    descEn: 'Old tackle, bought by the crate. Toss the rust, keep what still works. Leave the lures alone.',
    wage: 9000, minutes: 40, fatigue: 5, hunger: 3, hydration: 3,
    perDay: 2, minLevel: 1,
    questKey: 'job:old_tackle_sort',
    flavorKo: '녹슨 바늘 한 통. 루어는 보기만 했다.',
    flavorEn: 'A tin of rusted hooks. The lures I only looked at.',
  },
  // ── ulsan ──
  {
    id: 'deck_wash',
    npcId: 'go_manseok',
    regionId: 'ulsan',
    nameKo: '갑판 물청소 · 얼음 싣기', nameEn: 'Deck Wash and Ice Loading',
    descKo: '손님 내리면 갑판에 물 뿌리고 솔질. 얼음은 창고에서 날라 실어. 미끄러지면 네 탓이다.',
    descEn: "Once the passengers are off, hose and scrub the deck. Haul the ice from the shed and load it. Slip, and that's on you.",
    wage: 15000, minutes: 60, fatigue: 11, hunger: 7, hydration: 10,
    perDay: 1, minLevel: 1, rep: 1,
    questKey: 'job:deck_wash',
    flavorKo: '갑판에서 비린내 대신 물 냄새가 난다. 턱짓 한 번이 품삯 영수증이다.',
    flavorEn: 'The deck smells of water instead of fish. One nod of his chin is my receipt.',
  },
  {
    id: 'lifejacket_sort',
    npcId: 'go_haena',
    regionId: 'ulsan',
    nameKo: '구명조끼 · 명단 맞추기', nameEn: 'Life Jackets and the Passenger List',
    descKo: '내일 손님 열두 분이에요. 구명조끼 크기별로 걸어 두고, 명단이랑 수 맞춰 주세요.',
    descEn: 'Twelve passengers tomorrow. Hang the life jackets by size and match the count to the list.',
    wage: 8000, minutes: 35, fatigue: 5, hunger: 3, hydration: 3,
    perDay: 2, minLevel: 1,
    questKey: 'job:lifejacket_sort',
    flavorKo: '열두 벌, 열두 이름. 하나도 안 비었다.',
    flavorEn: 'Twelve jackets, twelve names. Nothing missing.',
  },
  // ── gyeongbuk_pohang ──
  {
    id: 'night_stock_sort',
    npcId: 'namgung_hyeon',
    regionId: 'gyeongbuk_pohang',
    nameKo: '야간 입고 정리', nameEn: 'Night Stock Intake',
    descKo: '야간 입고. 상자 까서 선반. 전표대로. 질문은 안 받아.',
    descEn: 'Night intake. Open the crates, shelve them. As the slip says. No questions.',
    wage: 22000, minutes: 110, fatigue: 14, hunger: 10, hydration: 8,
    perDay: 1, minLevel: 2,
    questKey: 'job:night_stock_sort',
    flavorKo: '새벽에 셔터가 반쯤 내려왔다. 질문은 하나만 했다.',
    flavorEn: 'The shutter came halfway down at dawn. I asked one question.',
  },
  {
    id: 'rock_kitchen_carry',
    npcId: 'han_bom',
    regionId: 'gyeongbuk_pohang',
    nameKo: '갯바위 조리 짐 나르기', nameEn: 'Carrying the Rock-Kitchen Gear',
    descKo: '버너랑 냄비랑 도마요! 등대 밑 갯바위까지요. 제가 들면 꼭 하나 떨어뜨려요.',
    descEn: 'The burner, the pot, the cutting board! Down to the rocks under the lighthouse. When I carry them, I always drop one.',
    wage: 7000, minutes: 30, fatigue: 6, hunger: 4, hydration: 4,
    perDay: 2, minLevel: 1,
    questKey: 'job:rock_kitchen_carry',
    flavorKo: '냄비 하나 안 떨어뜨렸다. 갯바위가 부엌이 됐다.',
    flavorEn: 'Not a single pot dropped. The rocks became a kitchen.',
  },
  // ── gyeongnam_geoje ──
  {
    id: 'mooring_check',
    npcId: 'chae_geumja',
    regionId: 'gyeongnam_geoje',
    nameKo: '계류줄 · 방현재 점검', nameEn: 'Mooring Line and Fender Check',
    descKo: '계류줄 닳은 데 보고, 방현재는 물때 맞춰 높이 다시 매요. 배 얘기니까 대충은 안 돼요.',
    descEn: "Check the mooring lines for chafe and re-hang the fenders for the tide. It's the boat, so no shortcuts.",
    wage: 11000, minutes: 45, fatigue: 6, hunger: 4, hydration: 5,
    perDay: 2, minLevel: 1, rep: 1,
    questKey: 'job:mooring_check',
    flavorKo: '줄 세 가닥, 방현재 여섯. 배가 부두를 긁지 않는다.',
    flavorEn: 'Three lines, six fenders. The boat no longer scrapes the pier.',
  },
  {
    id: 'bait_set_count',
    npcId: 'chae_pado',
    regionId: 'gyeongnam_geoje',
    nameKo: '손님 미끼통 챙기기', nameEn: 'Packing the Passenger Bait Kits',
    descKo: '손님 수대로 미끼통이랑 뜰채랑 걸레요! 저 혼자 세면 꼭 하나 빠져요. 선장님한테 또 혼나요.',
    descEn: 'One bait bucket, net and rag per passenger! When I count alone, one always goes missing. And the skipper gets me again.',
    wage: 7000, minutes: 30, fatigue: 5, hunger: 3, hydration: 3,
    perDay: 3, minLevel: 1,
    questKey: 'job:bait_set_count',
    flavorKo: '열 세트, 열 손님. 파도 씨가 두 번 세고 안심했다.',
    flavorEn: 'Ten kits, ten passengers. Pado counted twice before he relaxed.',
  },
  // ── jeonnam_yeosu ──
  {
    id: 'hotel_luggage',
    npcId: 'oh_gayun',
    regionId: 'jeonnam_yeosu',
    nameKo: '호텔 짐 나르기', nameEn: 'Hotel Luggage Run',
    descKo: '…단체 손님 짐이에요. 로비에서 객실까지. 말은 안 걸어도 돼요. 저도 안 할 거라서요.',
    descEn: "...A tour group's luggage. Lobby to the rooms. You don't have to make conversation. I won't either.",
    wage: 13000, minutes: 50, fatigue: 8, hunger: 5, hydration: 6,
    perDay: 2, minLevel: 1,
    questKey: 'job:hotel_luggage',
    flavorKo: '가방 서른 개. 엘리베이터 거울에 비친 얼굴이 둘 다 피곤했다.',
    flavorEn: 'Thirty bags. Both faces in the elevator mirror looked tired.',
  },
  {
    id: 'camper_tidy',
    npcId: 'jeong_umi',
    regionId: 'jeonnam_yeosu',
    nameKo: '캠핑카 정리', nameEn: 'Tidying the Camper',
    descKo: '물탱크 채우고, 어닝 걷고, 의자 넷 접어요. 좁은 데 사는 건 정리가 반이에요.',
    descEn: 'Fill the water tank, roll up the awning, fold the four chairs. Living small is half tidying.',
    wage: 8000, minutes: 35, fatigue: 5, hunger: 3, hydration: 4,
    perDay: 2, minLevel: 1,
    questKey: 'job:camper_tidy',
    flavorKo: '의자 넷을 접으니 캠핑카가 다시 집이 됐다.',
    flavorEn: 'Four chairs folded, and the camper was a home again.',
  },
  // ── chungnam_taean ──
  {
    id: 'hulk_rust_scrape',
    npcId: 'song_gibaek',
    regionId: 'chungnam_taean',
    nameKo: '뱃전 녹 긁기 · 칠하기', nameEn: 'Scraping and Painting the Hull',
    descKo: '뱃전 녹을 긁고 칠해 주게. 이 배는 내 집이라, 비 새면 곤란하구먼.',
    descEn: "Scrape the rust off the hull and paint it. This boat's my house. A leak would be a bother.",
    wage: 16000, minutes: 75, fatigue: 11, hunger: 8, hydration: 10,
    perDay: 1, minLevel: 1, rep: 1,
    questKey: 'job:hulk_rust_scrape',
    flavorKo: '붉은 녹이 회색 칠 밑으로 들어갔다. 노인은 고맙다는 말 대신 차를 내왔다.',
    flavorEn: 'The red rust went under grey paint. Instead of thanks, the old man brought tea.',
  },
  {
    id: 'storyboard_sort',
    npcId: 'ma_gamgi',
    regionId: 'chungnam_taean',
    nameKo: '콘티 종이 맞추기', nameEn: 'Sorting the Storyboard Pages',
    descKo: '콘티 종이가 바람에 다 섞였어요. 번호대로 맞춰 주세요. 아마요, 마흔두 장일 거예요. 아니, 마흔셋.',
    descEn: 'The wind shuffled all my storyboard pages. Put them back in order. Probably forty-two of them. No, forty-three.',
    wage: 7000, minutes: 30, fatigue: 5, hunger: 3, hydration: 3,
    perDay: 2, minLevel: 1,
    questKey: 'job:storyboard_sort',
    flavorKo: '마흔세 장이었다. 한 장은 갈매기 그림이었다.',
    flavorEn: 'Forty-three pages. One of them was a drawing of a seagull.',
  },
  // ── jeju ──
  {
    id: 'haenyeo_locker_tidy',
    npcId: 'bu_sundeok',
    regionId: 'jeju',
    nameKo: '해녀 탈의장 정리', nameEn: "Tidying the Divers' Changing Hut",
    descKo: '탈의장 바닥 닦고 테왁은 벽에 걸어라. 남의 망사리는 손대지 말고.',
    descEn: "Mop the changing hut floor and hang the floats on the wall. Don't touch anyone's catch net.",
    wage: 9000, minutes: 40, fatigue: 6, hunger: 4, hydration: 5,
    perDay: 2, minLevel: 1, rep: 1,
    questKey: 'job:haenyeo_locker_tidy',
    flavorKo: '테왁 아홉 개를 벽에 걸었다. 하나는 임자가 쉬는 중이다.',
    flavorEn: 'Nine floats on the wall. One of them belongs to someone resting.',
  },
  {
    id: 'contest_flyer',
    npcId: 'oh_serin',
    regionId: 'jeju',
    nameKo: '대회 전단 돌리기', nameEn: 'Handing Out Contest Flyers',
    descKo: '항구 한 바퀴 돌면서 낚시하는 분들께 전단 나눠 주세요! 제 계산으로는요, 쉰 장이면 돼요.',
    descEn: 'Walk the harbor and hand these flyers to anyone fishing! By my count, fifty should do it.',
    wage: 7000, minutes: 30, fatigue: 5, hunger: 3, hydration: 4,
    perDay: 1, minLevel: 1,
    questKey: 'job:contest_flyer',
    flavorKo: '쉰 장을 다 돌렸다. 두 장은 바람이 먼저 받아 갔다.',
    flavorEn: 'All fifty handed out. The wind took two before anyone else could.',
  },
  {
    id: 'shoot_assist',
    npcId: 'yu_ria',
    regionId: 'jeju',
    nameKo: '촬영 보조', nameEn: 'Shoot Assistant',
    descKo: '반사판 들고, 구도 들어가면 숨 참아요. 진짜로요, 한 컷에 열 번은 찍어요.',
    descEn: "Hold the reflector, and when we're in frame, hold your breath. Really. Ten takes per shot.",
    wage: 12000, minutes: 60, fatigue: 6, hunger: 4, hydration: 6,
    perDay: 1, minLevel: 1,
    questKey: 'job:shoot_assist',
    flavorKo: '열한 번째에 됐다. 반사판 든 팔이 떨린다.',
    flavorEn: 'The eleventh take was the one. My reflector arm is shaking.',
  },
  // ── incheon ──
  {
    id: 'club_tackle_tidy',
    npcId: 'dan_cheolho',
    regionId: 'incheon',
    nameKo: '회사 동호회 채비 정리', nameEn: 'Tidying the Company Club Tackle',
    descKo: '동호회 채비 가방 열 개요. 엉킨 줄 풀고 바늘 수 맞춰 줘요. 총무가 그만뒀거든요. 십 년 만에.',
    descEn: 'Ten tackle bags from the company club. Untangle the lines and count the hooks. Our treasurer quit. After ten years.',
    wage: 9000, minutes: 40, fatigue: 5, hunger: 3, hydration: 3,
    perDay: 2, minLevel: 1,
    questKey: 'job:club_tackle_tidy',
    flavorKo: '가방 열 개, 엉킨 줄 열한 뭉치. 총무가 왜 그만뒀는지 알 것 같다.',
    flavorEn: 'Ten bags, eleven tangles. I think I know why the treasurer quit.',
  },
  {
    id: 'stage_stand_carry',
    npcId: 'ha_minji',
    regionId: 'incheon',
    nameKo: '보면대 · 악기 나르기', nameEn: 'Carrying Stands and Instruments',
    descKo: '보면대 서른 개랑 첼로 케이스요. 부두 무대까지요. 첫 음 전에는 다 서 있어야 해요.',
    descEn: 'Thirty music stands and the cello cases. Down to the pier stage. Everything has to be standing before the first note.',
    wage: 10000, minutes: 45, fatigue: 7, hunger: 5, hydration: 5,
    perDay: 1, minLevel: 1,
    questKey: 'job:stage_stand_carry',
    flavorKo: '보면대 서른 개가 바닷바람에 서 있다. 첫 음은 못 들었다.',
    flavorEn: 'Thirty stands standing in the sea wind. I missed the first note.',
  },
];

export function dayJobsOfNpc(npcId: string, regionId: string): DayJobDef[] {
  return DAY_JOBS.filter((j) => j.npcId === npcId && j.regionId === regionId);
}

export function getDayJob(id: string): DayJobDef | undefined {
  return DAY_JOBS.find((j) => j.id === id);
}
