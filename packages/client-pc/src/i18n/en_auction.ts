/**
 * @file en_auction.ts
 * @description 147차 영어 사전 — 위판(경매 현장) · 어촌계 총회.
 *
 * ⚠ 신규 UI를 만들 때 사전을 같이 채우지 않으면 영어 로케일에서 한국어가 그대로 남는다
 *   (131차에 129차 제작 UI가 통째로 미번역인 채 발견됐다). 합성 문자열은 사전을 비껴가므로
 *   숫자·이름을 끼우기 전 조각을 규칙(`I18n` 규칙 테이블)이 잡거나, 여기에 통짜로 싣는다.
 */
export const EN_AUCTION: Record<string, string> = {
  // ── 위판 탭 (ShopPanel) ──
  '위판하기': 'Consign', '출품하기': 'Consign',
  '출품할 어획물을 먼저 고르세요.': 'Pick the catch you want to consign first.',
  '위판장은 어획물만 받습니다.': 'The auction house only takes catch.',
  '위판장은 직접 잡은 것만 받습니다 — 사거나 받은 물건은 출하할 수 없습니다.':
    'The auction house only accepts your own catch — bought or gifted seafood cannot be consigned.',
  '위판할 어획물이 없습니다.': 'You have no catch to consign.',
  '활어 경매 진행 중': 'Live-fish auction in session',
  '선어 경매 진행 중': 'Fresh-fish auction in session',
  '다음 개장 시간을 알 수 없습니다': 'Next opening time unknown',
  '지금은 파장입니다 — 선어는 01~03시, 활어는 03~07시에 경매가 섭니다.':
    'The floor is closed — fresh fish runs 01:00–03:00, live fish 03:00–07:00.',
  '경매를 열 수 없습니다.': 'The auction could not be opened.',
  '규격 상자 보유': 'standard crate on hand',
  '없음 (부르는 대로)': 'None (take the call)',
  '시세 70%': '70% of market', '시세 90%': '90% of market',
  '상점에 판매': 'Sell at a shop', '직접 소비': 'Eat it yourself',

  // 합성 문자열 조각 (131차 — 붙이기 전에 t()로 번역한다)
  '지금은 파장입니다 — 다음 개장까지': 'Floor closed — next opening in',
  '위판 수수료': 'Auction fee', '출품 선택': 'Selected', '최저 희망가': 'Reserve',
  '특급': 'Grade A', '상급': 'Grade B', '보통급': 'Grade C',
  '클릭하면 출품 목록에 담깁니다': 'Click to add it to the consignment list',

  // ── 경매 현장 (AuctionHousePanel) ──
  '위판 경매': 'Consignment Auction', '위판 정산': 'Auction Settlement',
  '경매가 진행 중입니다.': 'The auction is under way.',
  '경매가 진행 중입니다 — 끝까지 본 뒤에 나갈 수 있습니다.':
    'The auction is under way — you can leave once it finishes.',
  '끝까지 건너뛰기': 'Skip to the end', '확인': 'OK',
  '경매가 끝났습니다.': 'The auction has finished.',
  '유찰 — 되가져갑니다': 'unsold — taken back',
  '유찰된 물건은 그대로 돌려받습니다. 다음 회차에 다시 올릴 수 있습니다.':
    'Unsold lots come straight back to you. You can put them up again next session.',
  '실수령액이 입금됩니다.': 'Your net proceeds are paid in.',
  '전부 유찰되었습니다 — 물건은 그대로 돌려받았습니다.':
    'Everything went unsold — you have your catch back.',

  // ── 어촌계 총회 (GeneralMeetingPanel) ──
  '어촌계 총회': 'Fishery Co-op General Meeting',
  '안건 — 예비계원의 정계원 승격 건': 'Motion — promotion of an associate to full member',
  '계장이 서류 네 장을 확인하고 이름을 읽는다. 찬성하시는 분은 손을 들어 주십시오.':
    'The chair checks the four documents and reads the name. All in favour, raise your hand.',
  '이름을 듣는다': 'Hear your name called',
  '간신히 과반입니다. 이름값은 이제부터 만드는 것입니다.':
    'A bare majority. The name is yours to earn from here.',
};
