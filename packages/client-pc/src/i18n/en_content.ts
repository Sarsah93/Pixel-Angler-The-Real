/**
 * @file en_content.ts
 * @description 콘텐츠 산문 영문 사전 (120차 ①) — 손질 스테이지 · 도감 설명 · 레시피 · 통발 · 신선도.
 *
 * ## 왜 규칙이 아니라 사전인가
 * 119차 잔여로 남은 것은 **수치가 낀 조립 문자열**과 **긴 산문** 두 종류였다.
 * 조립 문자열은 `en.ts`의 `EN_RULES`가 정규식으로 잡지만, 산문(어종 습성 설명·손질 안내문)은
 * 캡처할 변수가 없어 규칙으로 풀 수 없다 — 원문 1:1 사전만이 답이다.
 *
 * ## 수집 방법 (재현 가능)
 * 실브라우저에서 core 데이터(`ButcheryProcess.stageList` · `FISH_DATABASE` · `RECIPE_DATABASE` …)를
 * 전수로 `t()`에 통과시켜 **번역 후에도 한글이 남는 것만** 모았다.
 * 재수집 하네스는 워크로그 120 §5 참조 — 손질 18종 498스테이지 · 어종 57 · 레시피 11 등.
 *
 * 번역 원칙: 게임 안내문은 **명령형 현재시제**, 도감 설명은 **평서형**. 지명은 국립국어원
 * 로마자 표기법. 어종명은 `FISH_DATABASE.nameEn`이 이미 런타임 사전에 있으므로 그 표기를 따른다.
 */

/** 손질 스테이지 이름 (`ButcheryStage.label`) — 어류 3면뜨기 · 넙치 5장뜨기 · 두족류 공통 */
const BUTCHERY_LABELS: Record<string, string> = {
  '시메 ① — 갑–눈 사이': 'Ikejime ① — between cuttlebone and eye',
  '시메 ② — 눈–다리 사이': 'Ikejime ② — between eye and arms',
  '오징어뼈(연골) 제거': 'Remove the gladius (pen)',
  '머리 뒤집기 (외번)': 'Invert the head',
  '악판(입) 뽑아내기': 'Pull out the beak',
  '껍질 뜯기 ② — 아래로 마무리': 'Skin peel ② — finish downward',
  '1면 — 배쪽 → 척추까지': 'Side 1 — belly to the spine',
  '1면 — 갈비뼈·척추 끊어 분리': 'Side 1 — cut through ribs and spine',
  '2면 — 등쪽 → 척추까지 (1회차)': 'Side 2 — back to the spine (pass 1)',
  '등쪽 위쪽 — 경계 칼길 (1/3)': 'Back, upper — score the border (1/3)',
  '등쪽 위쪽 — 살·뼈 분리 (2/3)': 'Back, upper — part flesh from bone (2/3)',
  '등쪽 위쪽 — 필렛 분리 (3/3)': 'Back, upper — free the fillet (3/3)',
  '등쪽 아래쪽 — 경계 칼길 (1/3)': 'Back, lower — score the border (1/3)',
  '등쪽 아래쪽 — 살·뼈 분리 (2/3)': 'Back, lower — part flesh from bone (2/3)',
  '등쪽 아래쪽 — 필렛 분리 (3/3)': 'Back, lower — free the fillet (3/3)',
  '배쪽 위쪽 — 경계 칼길 (1/3)': 'Belly, upper — score the border (1/3)',
  '배쪽 위쪽 — 살·뼈 분리 (2/3)': 'Belly, upper — part flesh from bone (2/3)',
  '배쪽 위쪽 — 필렛 분리 (3/3)': 'Belly, upper — free the fillet (3/3)',
  '배쪽 아래쪽 — 경계 칼길 (1/3)': 'Belly, lower — score the border (1/3)',
  '배쪽 아래쪽 — 살·뼈 분리 (2/3)': 'Belly, lower — part flesh from bone (2/3)',
  '배쪽 아래쪽 — 필렛 분리 (3/3)': 'Belly, lower — free the fillet (3/3)',
  '엔가와 분리 (필렛 1)': 'Separate engawa (fillet 1)',
  '엔가와 분리 (필렛 2)': 'Separate engawa (fillet 2)',
  '엔가와 분리 (필렛 3)': 'Separate engawa (fillet 3)',
  '엔가와 분리 (필렛 4)': 'Separate engawa (fillet 4)',
};

/** 손질 하단 안내문 (`ButcheryStage.guide`) — 전부 명령형 */
const BUTCHERY_GUIDES: Record<string, string> = {
  '몸통과 눈 사이 중심선을 짧고 정확하게 끊으세요 (선도 유지)':
    'Cut the midline between mantle and eye — short and precise (keeps it fresh)',
  '눈과 다리 사이를 끊으세요 — 먹물 분출 위험이 크게 줄어듭니다':
    'Cut between the eyes and the arms — this greatly lowers the risk of an ink burst',
  '외투막 입구에 칼을 넣어 몸통 끝까지 한 번에 갈라주세요':
    'Slide the knife into the mantle opening and slit it to the tip in one stroke',
  '머리·다리 덩어리를 잡고 내장과 함께 뜯어 올리세요':
    'Grip the head-and-arms mass and pull it away together with the innards',
  '드러난 내장 덩어리를 잡고 통째로 떼어내세요 (먹물주머니 조심)':
    'Grip the exposed innards and lift them out whole (mind the ink sac)',
  '들린 덩어리를 잡고 끝까지 마저 뽑아내세요': 'Grip the lifted mass and pull it all the way out',
  '중심선의 투명한 연골을 몸통 끝에서 잡아 당겨 빼내세요':
    'Grip the clear gladius at the tip of the mantle and draw it straight out',
  '몸통 가장자리의 표시 지점을 클릭해 껍질을 들춰 잡으세요':
    'Click the marked spot on the mantle edge to lift and grip the skin',
  '들춰 잡은 껍질 손잡이를 조금씩 당겨 뜯기 시작하세요':
    'Pull the lifted flap of skin a little at a time to start peeling',
  '딸려 나온 껍질을 잡고 조금 더 당기세요': 'Grip the loosened skin and pull a little further',
  '절반까지 왔습니다 — 계속 당기세요': 'Halfway there — keep pulling',
  '가로 방향 마지막 — 껍질을 끝까지 당겨 뜯으세요':
    'Last of the crosswise pull — draw the skin all the way off',
  '남은 껍질을 잡고 아래로 끝까지 당겨 뜯으세요':
    'Grip the remaining skin and pull it straight down to the end',
  '껍질이 통째로 벗겨져 순살만 남았습니다': 'The skin came off in one piece — only clean flesh remains',
  '첫째 날개를 껍질째 잡고 몸통 살에서 뜯어내세요':
    'Grip the first fin with its skin and tear it from the mantle',
  '반대쪽 날개도 껍질째 잡고 뜯어내세요': 'Tear off the other fin with its skin as well',
  '첫째 날개의 날개살을 우측에서 왼쪽으로 벗겨 분리하세요':
    'Peel the flesh off the first fin from right to left',
  '반대쪽 날개의 날개살도 벗겨 분리하세요': 'Peel the flesh off the other fin as well',
  '몸통 안쪽을 왕복으로 훑어 아가미와 잔막을 걷어내세요':
    'Sweep the inside of the mantle back and forth to clear the gills and membrane',
  '머리(외투막)를 목에서 끝 방향으로 밀어 속이 밖으로 나오게 뒤집으세요':
    'Push the head from the neck toward the tip so it turns inside out',
  '뒤집었던 머리를 원래대로 되돌리세요': 'Turn the head back the right way round',
  '굵은소금을 뿌리고 몸 전체를 왕복으로 치대세요 (굵은소금 1개 소모)':
    'Scatter coarse salt and knead the whole body back and forth (uses 1 coarse salt)',
  '다리와 빨판 쪽을 집중적으로 문질러 점액과 이물을 걷어내세요':
    'Scrub the arms and suckers hard to strip off slime and grit',
  '거품과 소금기를 흐르는 물에 깨끗이 씻어내세요': 'Rinse the foam and salt away under running water',
  '다리 가운데(입)를 눌러 악판을 밀어낸 뒤 통째로 뽑으세요':
    'Press the centre of the arms to push the beak out, then pull it free',
  '다리 밑동 가운데의 부리를 눌러 밀어 올린 뒤 통째로 뽑으세요':
    'Press the beak at the base of the arms to push it up, then pull it free',
  '덩어리를 다리 / 머리 / 먹물주머니 3조각으로 가르세요 (2곳)':
    'Split the mass into three — arms, head and ink sac (two cuts)',
  '손질이 끝났습니다 — 통마리 순살 (삶은 뒤 숙회 재료)':
    'Butchery complete — whole cleaned body (boil it for sukhoe)',
};

/** 신선도 상태 설명 (`InventoryStore.CONDITION_DESC`) — 아이템 상세 본문 */
const CONDITION_DESCS: Record<string, string> = {
  '낚시 혹은 출하된 지 얼마 지나지 않은 살아있는 상태.':
    'Still alive — caught or landed only moments ago.',
  '신선한 재료의 상태. 조리(요리) 시 좋은 결과를 얻을 수 있음.':
    'A fresh ingredient. Cooks up well.',
  '상온에서 시간이 지난 상태. 조리는 문제 없으나 사시미(회)로 취급할 수 없음.':
    'Left at room temperature for a while. Fine to cook, but no longer sashimi grade.',
  '1~5도 냉장 보관 상태. 사시미(회)로 취급해도 큰 문제가 없음.':
    'Chilled at 1–5 °C. Still safe to serve as sashimi.',
  '영하에서 동결된 상태. 일부 재료(얼음 등) 외에는 냉동 그대로 조리 불가.':
    'Frozen solid. Apart from a few items (ice and such) it cannot be cooked as is.',
  '냉동 재료가 상온에서 습기를 머금으며 해동된 상태.':
    'A frozen ingredient thawed at room temperature, damp with meltwater.',
  '상온에 오래 방치된 상태. 회/직접 섭취 불가, 조리에 사용해도 문제가 생길 수 있음.':
    'Left out too long. Not safe raw, and risky even cooked.',
  '조리/요리에 사용하면 안 되며 질병이 발생할 수 있는 상태. 빨리 처분 권장.':
    'Must not be cooked or eaten — it can make you ill. Discard it.',
};

/** 통발 이름 (`TRAP_DATABASE.nameKo`) */
const TRAP_NAMES: Record<string, string> = {
  '기본 게 통발': 'Basic Crab Trap',
  '프로 게 통발 (대형)': 'Pro Crab Trap (Large)',
  '새우 통발': 'Shrimp Trap',
  '장어 통발 (원통형)': 'Eel Trap (Cylindrical)',
  '장어 통발 (대형 연결식)': 'Eel Trap (Large, Linked)',
  '문어 단지 (토기)': 'Octopus Pot (Earthenware)',
  '문어 PVC 단지': 'Octopus Pot (PVC)',
  '어류 그물 통발': 'Fish Net Trap',
};

/** 레시피 이름·설명 (`RECIPE_DATABASE`) */
const RECIPES: Record<string, string> = {
  '감성돔 회': 'Black Seabream Sashimi',
  '벵에돔 회': 'Largescale Blackfish Sashimi',
  '방어 회': 'Yellowtail Sashimi',
  '볼락 구이': 'Grilled Rockfish',
  '갈치 소금구이': 'Salt-Grilled Hairtail',
  '생선 매운탕': 'Spicy Fish Stew',
  '생선 지리 (맑은탕)': 'Clear Fish Soup',
  '꽃게탕': 'Blue Crab Stew',
  '바지락 칼국수': 'Clam Knife-Cut Noodles',
  '성게알 군함말이': 'Sea Urchin Gunkan Maki',
  '전복 버터구이': 'Butter-Grilled Abalone',

  '갓 잡은 감성돔을 포를 떠 생으로 즐기는 바다의 선물.':
    'A gift from the sea — a just-caught black seabream filleted and eaten raw.',
  '갯바위 전유동의 주인공을 즉석에서 포 떠 먹는 호사.':
    'The star of free-drift rock fishing, filleted and eaten on the spot.',
  '겨울 방어 지깅 직후 선상에서 즐기는 최고급 회.':
    'Top-grade sashimi eaten on deck straight after a winter yellowtail jig.',
  '껍질째 노릇노릇 구운 볼락. 방파제 야간 낚시의 즐거운 마무리.':
    'Rockfish grilled golden in its skin — a happy end to a night on the breakwater.',
  '야간 낚시로 잡은 싱싱한 갈치를 소금 뿌려 바로 구운 진미.':
    'Fresh night-caught hairtail, salted and grilled at once.',
  '회 뜨고 남은 생선 머리·척추뼈·갈빗대뼈로 얼큰하게 끓인 매운탕. 버릴 게 없다.':
    'A fiery stew from the head, spine and ribs left after filleting. Nothing goes to waste.',
  '생선 머리·뼈를 맑게 우려낸 담백한 지리. 해장에 좋다.':
    'A clean, light broth drawn from fish heads and bones. Good for a hangover.',
  '해루질로 잡은 꽃게를 얼큰하게 끓인 탕. 시원한 국물이 일품.':
    'Blue crabs from a night gleaning, simmered spicy. The broth is the best part.',
  '갯벌 바지락을 끓여낸 시원한 칼국수. 해루질 직후 최고의 한 끼.':
    'Knife-cut noodles in a clear clam broth — the perfect meal after a night on the flats.',
  '갓 채취한 성게알을 밥 위에 올린 군함말이. 식당 메뉴의 꽃.':
    'Freshly gathered urchin roe on rice — the jewel of the restaurant menu.',
  '전복을 껍데기째 버터로 구운 고급 요리. 간장과 청양고추로 마무리.':
    'Abalone grilled in butter in its shell, finished with soy sauce and chilli.',
};

/** 해양생물 설명 (`SHORE_CREATURE_DATABASE.description`) — 해루질 도감 */
const CREATURE_DESCS: Record<string, string> = {
  '해루질의 대표 종. 야간에 바위 표면을 기어다니므로 집어등으로 쉽게 발견 가능.':
    'The classic gleaning catch. It crawls over the rocks at night, so a lamp finds it easily.',
  '야간 해루질의 대표 수확물. 통발에도 잘 걸리며 꽃게탕, 꽃게찜으로 최고.':
    'A staple of night gleaning. It takes traps readily and is best in stew or steamed.',
  '돌 뒤를 뒤지면 자주 나오는 게. 감성돔/농어 미끼로도 최고급.':
    'Turn over a stone and you often find one. Also a premium bait for seabream and sea bass.',
  '전국 갯벌에서 채취 가능한 국민 조개. 바지락 칼국수, 바지락 술찜의 핵심 재료.':
    'The nation’s clam, gathered on tidal flats everywhere. The heart of clam noodles and steamed clams.',
  '바위에 붙어있는 굴은 장갑 끼고 돌칼로 분리. 生굴 특유의 달콤한 바다향.':
    'Oysters cling to the rock — wear gloves and prise them off with a stone knife. Raw, they carry a sweet sea scent.',
  '야간 갯바위 해루질의 최고 목표. 발견 시 재빠르게 잡아야 도망 가지 않음.':
    'The top prize of a night on the rocks. Grab it the instant you see it or it is gone.',
  '갯벌 낙지 잡기는 고도의 기술이 필요. 꼬챙이로 구멍 속을 찌르면 촉수가 올라옴.':
    'Taking octopus on the flats takes real skill — probe the burrow with a rod and an arm comes up.',
  '해루질의 로망. 작은 갈고리로 바위에서 분리. 심화 라이선스 필수.':
    'The dream of every gleaner. Prise it off the rock with a small hook. Requires the advanced licence.',
  '성게알 (생식소)은 고급 횟집 재료. 채취 시 장갑 필수.':
    'Urchin roe (the gonads) is a fine-dining ingredient. Always wear gloves to gather it.',
  '겨울이 제철인 귀한 식재료. 건해삼은 가격이 매우 비쌈.':
    'A prized winter ingredient. Dried, it fetches a very high price.',
};

/**
 * 발견 출처 라벨 (`DISCOVERY_SOURCE_LABEL`) — 도감 카드 하단 `출처 · 월/일`.
 * 날짜는 `SEP_PATTERNS`의 ` · ` 분해가 알아서 떼어내므로 라벨만 있으면 된다.
 */
const DISCOVERY_SOURCES: Record<string, string> = {
  '낚시로 어획': 'Caught fishing',
  '통발로 포획': 'Taken in a trap',
  '해루질로 채집': 'Gathered gleaning',
  '아이템 취득': 'Item acquired',
  '과거 조과 기록': 'From an old catch record',
  'dev 해금': 'dev unlock',
  '발견': 'Discovered',
  '취득': 'Acquired',
};

export const EN_CONTENT: Record<string, string> = {
  ...DISCOVERY_SOURCES,
  ...BUTCHERY_LABELS, ...BUTCHERY_GUIDES, ...CONDITION_DESCS,
  ...TRAP_NAMES, ...RECIPES, ...CREATURE_DESCS,
};
