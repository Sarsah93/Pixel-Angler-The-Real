/**
 * @file en_panels.ts
 * @description 122차 영어 사전 — 면허/스킬/일지 패널 · 도감 잔여 라벨 · 상호작용 키 F · 지역 카드 라벨 · 퀘스트.
 * 면허·스킬 이름/설명은 데이터(`nameEn`/`descriptionEn`/`descEn`)가 정본이라 `I18n.buildRuntimeDict`가 합친다 — 여기는 UI 문구만.
 */
export const EN_PANELS: Record<string, string> = {
  // ── 도감 잔여 (121차 캡처 리포트) ──
  '야행성': 'nocturnal', '주야 해루질': 'day/night gleaning', '야간 해루질': 'night gleaning', '주간 해루질': 'daytime gleaning',
  '심화 면허': 'advanced permit', '표층': 'Surface', '중층': 'Mid', '바닥층': 'Bottom',
  '거제 방파제': 'Geoje Breakwater', '거제 갯바위': 'Geoje Rocks', '양양 낙산': 'Yangyang Naksan', '제주 성산': 'Jeju Seongsan', '여수 선상': 'Yeosu Boat',
  '최신순': 'Newest', '최대어순': 'Largest', '무게순': 'Heaviest',
  'ESC 키 또는 우측 상단 ✕ 버튼을 누르면 월드로 귀환합니다.': 'Press ESC or the ✕ at top right to return.',
  // ── 지역 카드 ──
  '밑걸림 낮음': 'low snag risk', '밑걸림 주의': 'snag caution', '밑걸림 위험 (여밭·암반)': 'high snag risk (reefs/rock)',
  '지도의 핀 또는 아래 목록에서\n활동할 구역을 선택하세요.\n\n[ESC] 전국 지도로 돌아가기': 'Pick an area from the pins or the list below.\n\n[ESC] Back to national map',
  // ── 상호작용 키 F (122차 — E는 장비창 전용) ──
  '[F] 회수': '[F] Pick up', '[F] 집으로 들어가기': '[F] Enter home', '[F] 출조 버스 (전국 지도)': '[F] Trip bus (national map)',
  '[F] 수조 열기': '[F] Open tank', '[F] 벌목 (추후)': '[F] Chop (later)', '[F] 채굴 (추후)': '[F] Mine (later)',
  '[F] 채집 (추후)': '[F] Gather (later)', '[F] 보트 (추후)': '[F] Boat (later)', '[F]': '[F]',
  '[F] 침대 — 저장하고 쉬기': '[F] Bed — save and rest', '[F] 나가기': '[F] Leave', '[F] 주방 (요리 준비중)': '[F] Kitchen (cooking coming soon)',
  '[F] 냉장고 열기': '[F] Open fridge', '[F] 수납 (추후)': '[F] Storage (later)',
  // ── 면허 패널 ──
  '면허 · 허가': 'Licences · Permits', '보유': 'held', '미보유': 'not held', '해금 요구사항': 'Requirements',
  '• 선행 조건 없음 (바로 발급 가능)': '• No prerequisites (available now)', '선행 면허가 필요합니다': 'Prerequisite licence required',
  '조건 미충족': 'Requirements not met', '코인 부족': 'Not enough coins', '유효하게 소지하고 있는 면허입니다.': 'You hold this licence.',
  '낚시': 'Fishing', '해루질': 'Gleaning', '토지 · 주거': 'Land · Housing', '선박 · 어업': 'Vessel · Fishery', '사업': 'Business',
  // ── 스킬 패널 ──
  '스킬': 'Skills', '잠김 — 열람만': 'Locked — view only', '예정': 'planned', '최대 랭크': 'Max rank', '선행 없음 (루트 스킬)': 'No prerequisite (root skill)',
  '스킬 포인트가 부족합니다': 'Not enough skill points', '선행 스킬이 필요합니다': 'Prerequisite skill required', '이미 최대 랭크입니다': 'Already at max rank',
  '이 카테고리는 아직 잠겨 있습니다': 'This category is still locked', '알 수 없는 스킬': 'Unknown skill',
  '채집 · 통발': 'Gathering · Traps', '경제': 'Economy', '운전 · 이동': 'Driving · Travel', '생활': 'Life', '농사': 'Farming',
  // ── 일지 ──
  '일지': 'Journal', '스토리 라인': 'Storyline', '프롤로그 — 준비 중': 'Prologue — coming soon', '아직 없음 — 채집·통발·업적 퀘스트 예정': 'None yet — gathering, trap and achievement quests planned',
  '완료': 'Done', '진행 가능': 'Available', '잠김': 'Locked', '메인 · 입문': 'Main · Intro', '메인 · 면허 도전': 'Main · Licence challenge',
  '서브 · 활동': 'Side · Activity', '서브 · 업적': 'Side · Achievement', '목표': 'Objectives', '보상': 'Rewards',
  '프롤로그는 준비 중입니다. 낚시·손질·채집·통발·요리·농장 등 모든 컴포넌트가 구현된 뒤 스토리와 메인/서브 퀘스트가 도입됩니다. 지금은 메인 퀘스트 목록에서 입문 과제와 면허 도전 과제를 확인할 수 있습니다.':
    'The prologue is coming soon. The story and main/side quests arrive once every component — fishing, filleting, gathering, traps, cooking and farming — is in place. For now, check the intro tasks and licence challenges under Main Quests.',
  '낚시터 방문': 'Visit a fishing spot', '물고기 낚기': 'Catch fish', '특정 조건 어획': 'Catch under a condition', '출조 횟수': 'Trips completed',
  '요리 완성': 'Complete a dish', '코인 보유': 'Coins held', '면허 취득': 'Acquire a licence',
  '첫 번째 캐스팅': 'First Cast', '물고기 3마리 낚기': 'Catch Three Fish', '탐방꾼의 시작': 'The Explorer Begins', '출조 5회 달성': 'Five Trips',
  '첫 대물': 'First Big One', '해루질 입문 허가 도전': 'Gleaning Permit Challenge', '통발 조업 면허 도전': 'Trap Licence Challenge',
  '첫 캐치앤쿡': 'First Catch & Cook', '식품위생법 영업허가 도전': 'Food Service Licence Challenge', '선상 낚시 면허 도전': 'Boat Angling Licence Challenge',
  '해양관광사업 등록 도전': 'Marine Tourism Registration Challenge',
  '첫 해루질 채취': 'First Gleaning Haul', '첫 통발 수거': 'First Trap Haul', '어획 10kg 달성': '10kg of Catch', '식당 개업!': 'Restaurant Open!',
  '감성돔 첫 포획': 'First Black Seabream',
  '해루질로 조개류나 소라를 처음 채취해보세요.': 'Gather shellfish or a top shell by gleaning for the first time.',
  '통발을 설치하고 하루가 지난 뒤 수거해보세요.': 'Set a trap and haul it after a day.',
  '쿨러에 담긴 어획물의 총 무게 10kg을 달성해보세요.': 'Reach 10kg of total catch weight in the cooler.',
  '처음으로 식당을 열고 포장마차 단계를 시작해보세요.': 'Open your first restaurant and start at the food-stall stage.',
  '감성돔을 처음으로 낚아보세요. 겨울 방파제나 갯바위에서 잘 낚입니다.': 'Catch your first black seabream. Winter breakwaters and rocky shores are best.',
  '낚시터로 이동해 처음으로 채비를 물에 던져보세요.': 'Go to a fishing spot and cast your rig for the first time.',
  '어종에 상관없이 물고기 3마리를 낚아보세요.': 'Catch three fish of any species.',
  '서로 다른 낚시터 3곳을 방문해보세요.': 'Visit three different fishing spots.',
  '낚시터 방문을 포함한 총 출조 횟수 5회를 채워보세요.': 'Complete five trips in total.',
  '길이 40cm 이상의 물고기를 낚아보세요.': 'Catch a fish 40cm or longer.',
  '해루질 허가를 취득하기 위해 출조 10회, 거제 구조라 방파제 방문을 완료하세요.': 'Complete 10 trips and visit Geoje Gujora Breakwater to earn the gleaning permit.',
  '출조 20회, 어획 50마리를 달성하면 통발 면허를 취득할 수 있습니다.': 'Complete 20 trips and 50 catches to earn the trap licence.',
  '잡은 물고기로 처음 요리를 완성해보세요. 낚시터 근처 갯바위에서 가능합니다.': 'Cook your first dish from a fish you caught. Possible on the rocks near a spot.',
  '캐치앤쿡 완성, 보유 코인 50,000원, 어획 100마리를 달성해야 식당 개업이 가능합니다.': 'Complete a catch & cook, hold ₩50,000 and land 100 fish to open a restaurant.',
  '출조 5회를 완료하면 선상 낚시를 즐길 수 있는 면허를 취득할 수 있습니다.': 'Complete five trips to earn the boat angling licence.',
  '선상 낚시 면허, 식당 영업허가, 평판 60 이상, 코인 200,000원을 달성해야 선상콘도 운영이 가능합니다.': 'Boat angling licence, food service permit, reputation 60+ and ₩200,000 are needed to run the floating condo.',
  '청갯지렁이 ×20': 'Blue sandworm ×20', '해루질 입문 허가': 'Basic gleaning permit', '통발 조업 기본 면허': 'Basic trap licence', '식품위생법 영업허가': 'Food service permit',
  '선상 낚시 면허': 'Boat angling licence', '해양관광사업 등록': 'Marine tourism registration',
  // ── 출처 화면 ──
  '데이터 출처 및 저작권': 'Data Sources & Credits',
  '위 공공데이터는 각 제공기관의 이용약관에 따라 출처를 표시하고 이용합니다.': "The open data above is used with attribution under each provider's terms.",
  '실시간 데이터는 제공기관 사정에 따라 지연·중단될 수 있으며, 이 경우 게임 내부 대체 데이터로 동작합니다.': 'Live data may be delayed or interrupted by the provider; the game then falls back to built-in data.',
  '게임 내 장비 브랜드명은 실존 브랜드와 무관한 가상의 명칭입니다.': 'In-game gear brand names are fictional and unrelated to real brands.',
  // ── 131차 — 제작 보드(129차 P7) UI 문구 ──
  '제작 (Crafting)': 'Crafting',
  '도면': 'Blueprints',
  '상세': 'Details',
  '필요 재료': 'Materials',
  '도면이 없습니다.': 'No blueprints.',
  '재료가 부족합니다.': 'Not enough materials.',
  '최대': 'Max',
  '제작': 'Craft',
  '고급 제작대': 'Advanced Workbench',
  '고급 제작대 — 로드·릴·루어 튜닝 전용': 'Advanced workbench — rods, reels and lure tuning only',
  '밑밥 배합은 [밑밥 품질] 탭에서 합니다 · 고급 품목은 설치한 제작대에서 [F]': 'Mix chum in the [Chum] tab · advanced items need a placed workbench ([F])',
  '산출': 'Output',
  '성공률': 'Success',
  '재료 절약': 'Material saving',
  // ── 131차 — 스킬 트리 확장(130차) 라벨 ──
  '시너지': 'Synergy',
  '조건': 'Cond.',
  '배우기': 'Learn',
  '조건 충족 시 자동': 'Granted automatically',
};
