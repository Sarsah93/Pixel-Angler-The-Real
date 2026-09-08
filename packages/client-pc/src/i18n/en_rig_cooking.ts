/**
 * @file en_rig_cooking.ts
 * @description 채비하기·요리하기 창 영어 사전 (119차 ⑥)
 *
 * 키 = 코드에 적힌 한국어 원문 그대로. `en.ts`의 EN_DICT에 합쳐진다.
 *
 * 수집 범위: UtilizationPanel(채비/요리/밑밥 탭) · RigRecommender(조법·추천 사유) ·
 * LuresCatalogDB(sizeLabel) · SashimiPanel(회썰기) · ButcheryPanel/ButcheryProcess/
 * ButcherySections(손질 섹션·작업 라벨·단계 안내).
 * 어종명·루어 제품명은 런타임 사전(nameKo↔nameEn)이 담당하므로 여기 넣지 않는다.
 */
export const EN_RIG_COOKING: Record<string, string> = {
  // ═══════════════════════════════════════════════
  // 채비하기 (Tackle) — 탭·소켓·안내
  // ═══════════════════════════════════════════════
  '루어 장착 중': 'Lure equipped',
  '미끼 불필요': 'no bait needed',
  '잘못된 장착': 'Wrong part',
  '최대 공략 수심 (Z_limit)': 'Max working depth (Z_limit)',
  '총 무게': 'Total weight',
  '부력 합': 'Total buoyancy',
  '침강 속도 (V_z)': 'Sink rate (V_z)',
  '공기 저항 계수 (C_d)': 'Air drag coefficient (C_d)',
  '필수 소켓이 비었습니다': 'Required sockets are empty',
  '채워야 캐스팅할 수 있습니다.': 'fill them before you can cast.',

  // 채비 조언 (computeRigSpec advice)
  '잠길찌 채비 상태입니다. 캐스팅 후 찌가 수중으로 하강합니다.':
    'This is a submerging-float rig. After the cast the float sinks below the surface.',
  '수중찌 채비 — 부력찌는 수면에 세우고, 수중찌 침력이 채비를 조류에 태워 내립니다.':
    'Sinking-float rig — the buoyant float stands on the surface while the sinking float rides the rig down with the current.',
  '제로찌 + 수중찌 조합입니다 — 상층 공략이 목적이면 수중찌를 빼는 운용도 있습니다.':
    'A zero-buoyancy float paired with a sinking float — if you are working the upper layer, running it without the sinking float is also an option.',
  '제로찌 상층 공략 채비 — 수중찌 없이 좁쌀봉돌·바늘(미끼) 무게만으로 천천히 내립니다.':
    'Zero-buoyancy upper-layer rig — with no sinking float it eases down on the weight of the split shot and baited hook alone.',
  '원투 채비 — 찌 없이 초릿대 끝으로 입질을 봅니다. 무게추 봉돌로 바닥을 공략하세요.':
    'Surf rig — no float; read bites off the rod tip. Work the bottom with a weight sinker.',
  '원투 채비 (구멍 봉돌) — 이물감이 적어 예신 타이밍 피드백 +15%. 초릿대 끝으로 입질을 보세요.':
    'Surf rig (hole sinker) — less resistance for the fish, +15% pre-bite feedback. Read bites off the rod tip.',
  '원투 채비 (묶음추 봉돌) — 공기 저항이 커 비거리 페널티. 초릿대 끝으로 입질을 보세요.':
    'Surf rig (bundle sinker) — high air drag costs casting distance. Read bites off the rod tip.',

  '전유동 채비입니다. 면사매듭을 제거하면 채비가 무한 침강합니다 — 뒷줄견제(H)로 수심을 세워 흘리세요.':
    'This is a free-drift rig. Remove the stopper knot and the rig sinks without limit — hold the line (H) to set the depth as it drifts.',

  // 편대/서브 채비

  // 소켓 선택 리스트 제목 (`${label} 선택`)
  '원줄 선택': 'Select main line',
  '면사매듭 선택': 'Select stopper knot',
  '부력찌 선택': 'Select float',
  '수중찌 (선택) 선택': 'Select sinking float',
  '도래 선택': 'Select swivel',
  '목줄 선택': 'Select leader',
  '봉돌 선택': 'Select sinker',
  '무게추 봉돌 선택': 'Select weight sinker',
  '봉돌 (좁쌀) 선택': 'Select split shot',
  '바늘/루어 선택': 'Select hook / lure',
  '미끼 선택': 'Select bait',

  // ═══════════════════════════════════════════════
  // 루어 채비 (Lure rig)
  // ═══════════════════════════════════════════════
  '침강': 'Sink',
  '공기저항 C_d': 'Air drag C_d',
  '타겟 가중': 'Target bias',
  '액션': 'Action',
  '두족류 전용': 'Cephalopods only',
  '서식 성향 가중': 'Habitat bias',

  // 루어 규격 라벨 (LuresCatalogDB.sizeLabel)
  '2인치': '2 in',
  '3인치': '3 in',
  '4인치': '4 in',
  '5인치': '5 in',
  '2.5호': 'size 2.5',
  '3.5호': 'size 3.5',

  // ═══════════════════════════════════════════════
  // 채비 추천 (RigRecommender) — 조법 라벨·근거
  // ═══════════════════════════════════════════════
  '반유동 찌낚시': 'Semi-fixed float fishing',
  '전유동 찌낚시': 'Free-drift float fishing',
  '원투 (던질낚시)': 'Surf casting',
  '지역 대상어': 'local target fish',
  '조법 원투': 'Method Surf casting',
  '조법 원투 (던질낚시)': 'Method Surf casting',
  '조법 반유동 찌낚시': 'Method Semi-fixed float',
  '조법 전유동 찌낚시': 'Method Free-drift float',
  '조법 루어': 'Method Lure',
  '찌 0.8호': 'Float #0.8',
  '찌 1호': 'Float #1',
  '찌 1.5호': 'Float #1.5',
  '봉돌 구멍 16~20호': 'Sinker hole #16-20',
  '봉돌 구멍 20~25호': 'Sinker hole #20-25',
  '봉돌 구멍 25~30호': 'Sinker hole #25-30',
  '봉돌 고리 16~20호': 'Sinker ring #16-20',
  '봉돌 고리 20~25호': 'Sinker ring #20-25',
  '봉돌 고리 25~30호': 'Sinker ring #25-30',
  '구멍 봉돌(이물감↓, 예신 피드백 +15%)': 'hole sinker (less resistance, +15% pre-bite feedback)',
  '여밭·암초 대상어종 — 채비를 띄우는 반유동 찌낚시로 밑걸림을 피하세요.':
    'Reef and rocky-bottom targets — keep the rig up with a semi-fixed float to avoid snags.',
  '모래·뻘 바닥 대상어종 — 무게추 봉돌로 바닥을 공략하는 원투가 유리합니다.':
    'Sand and mud bottom targets — surf casting with a weight sinker works the bottom best.',
  '외양 회유어 — 야간엔 반유동 찌낚시로 표·중층을 노리세요.':
    'Open-water roamers — at night work the surface and mid layers with a semi-fixed float.',
  '외양 회유어 — 루어로 넓게 탐색하세요.': 'Open-water roamers — cover water widely with lures.',
  '수심이 깊고 조류가 세어 원투로 바닥을 잡는 편이 안정적입니다.':
    'The water is deep and the current strong, so surf casting holds the bottom more reliably.',
  '수심이 얕아 반유동 찌낚시가 무난합니다.': 'The water is shallow, so a semi-fixed float rig is a safe bet.',
  '다만 밑걸림 위험이 커(여밭) 원투는 채비 손실 위험 — 반유동으로 전환 권장.':
    'That said, the snag risk is high (rocky bottom) and surf casting may cost you the rig — switch to a semi-fixed float.',
  '강풍/원투 비거리 필요 시 묶음추는 저항이 커 피하세요.':
    'In strong wind, or when you need distance, avoid bundle sinkers — they drag too much.',

  // ═══════════════════════════════════════════════
  // 요리하기 (Cooking) — 도마·안내
  // ═══════════════════════════════════════════════
  '· 생선을 도마에 올리고 [손질 시작]으로 회를 뜹니다 (넣기·빼기·교환 = 드래그)':
    '· Put a fish on the board and press [Start Dressing] to fillet it (drag to add, remove or swap).',
  '· 원형어 = 삼면뜨기(양살 2필렛) / 광어·도다리 = 다섯장뜨기(4~5필렛)':
    '· Round fish = three-piece fillet (2 fillets) / flatfish = five-piece fillet (4-5 fillets).',
  '· 순수 필렛을 올리면 [일반 회뜨기]/[고급 사시미 뜨기(야나기바)]로 회를 썹니다':
    '· Put a clean fillet on the board to slice it with [Basic Sashimi] / [Fine Sashimi (yanagiba)].',
  '· 썰어진 회 조각은 아래 [사시미 만들기] 접시에 담아 완성 (모듬/단품)':
    '· Arrange the slices on a plate in [Make Sashimi] below to finish the dish (assorted or single species).',
  '· 신선도가 높을수록 회 등급이 오릅니다 (활어회는 활어 상태에서만 특 가능)':
    '· The fresher the fish, the higher the sashimi grade (only a live fish can reach Prime).',
  '· 복어(자격·독)·두족류(오징어·문어·갑오징어)는 준비 중입니다':
    '· Pufferfish (licence and toxin handling) and cephalopods (squid, octopus, cuttlefish) are still in progress.',
  '회칼을 손에 장착해야 손질할 수 있습니다 — 인벤토리(기타)에서 회칼 우클릭 → 착용':
    'You must hold a sashimi knife to dress a fish — right-click a knife in your inventory (Misc) → Equip.',
  '회칼을 손에 장착해야 합니다 — 인벤토리(기타)에서 회칼 우클릭 → 착용':
    'You must hold a sashimi knife — right-click a knife in your inventory (Misc) → Equip.',
  '회칼을 손에 장착해야 회를 뜰 수 있습니다 — 인벤토리(기타)에서 회칼 우클릭 → 착용':
    'You must hold a sashimi knife to slice sashimi — right-click a knife in your inventory (Misc) → Equip.',
  '고급 사시미 뜨기는 야나기바 이상 회칼을 손에 장착해야 합니다':
    'Fine sashimi slicing requires a yanagiba (or better) in hand.',

  // 선택 아이템 안내 (selHint)
  '도마로 드래그하면 갈빗대 제거부터 이어서 진행합니다': 'Drag it to the board to resume from rib removal.',
  '도마로 드래그하면 지아이뼈 분리부터 이어서 진행합니다': 'Drag it to the board to resume from pin-bone removal.',
  '도마로 드래그하면 엔가와 분리부터 이어서 진행합니다': 'Drag it to the board to resume from engawa separation.',
  '도마로 드래그하면 박피부터 이어서 진행합니다': 'Drag it to the board to resume from skinning.',
  '도마로 드래그하면 엔가와 회썰기(총 2컷)를 진행합니다': 'Drag it to the board to slice the engawa (2 cuts in total).',
  '도마로 드래그하면 오징어 회뜨기(가운데 1컷 + 세로 10컷 = 22점)를 진행합니다':
    'Drag it to the board to slice squid sashimi (1 center cut + 10 lengthwise cuts = 22 pieces).',
  '도마로 드래그하면 날개살 회뜨기(날개당 1컷 = 4점)를 진행합니다':
    'Drag it to the board to slice the fin meat (1 cut per fin = 4 pieces).',
  '도마로 드래그하면 촉완 분리(촉완 ×2 + 다리부)를 진행합니다 — 회가 아닌 요리 재료':
    'Drag it to the board to separate the tentacles (2 tentacles + arm cluster) — a cooking ingredient, not sashimi.',
  '도마로 드래그하면 다리 분리(3컷 — 삶은 문어 머리 1 + 다리 8)를 진행합니다':
    'Drag it to the board to separate the legs (3 cuts — 1 boiled octopus head + 8 legs).',
  '도마로 드래그하면 숙회 썰기(사선 7컷 = 8점)를 진행합니다':
    'Drag it to the board to slice sukhoe (7 diagonal cuts = 8 pieces).',

  // ═══════════════════════════════════════════════
  // 사시미 접시 (플레이팅)
  // ═══════════════════════════════════════════════
  '사시미 접시를 이곳에 드래그': 'Drag a sashimi plate here',
  '(인벤토리 · 기타 탭)': '(Inventory · Misc tab)',
  '접시는 아래 [사시미 만들기] 영역에 놓으세요': 'Plates go in the [Make Sashimi] area below.',
  '배치 방위': 'Active quadrant',
  '한 점씩 아래 접시로 드래그하세요': 'drag them one piece at a time onto the plate below',

  // ═══════════════════════════════════════════════
  // 밑밥 품질 (Chum)
  // ═══════════════════════════════════════════════
  '밑밥 재료가 없습니다': 'No chum ingredients',
  '마트/편의점에서 파우더·냉동 크릴·압맥을 구매하세요':
    'Buy powder, frozen krill and pressed barley at the mart or convenience store',
  '재료를 여기로 드래그 앤 드랍': 'Drag and drop ingredients here',
  '쿨러가 없습니다.': 'You have no cooler.',
  '밑밥 배합은 쿨러(아이스박스)가 있어야 사용할 수 있습니다.': 'Mixing chum requires a cooler (ice box).',
  '식자재마트에서 쿨러를 구할 수 있습니다.': 'You can get one at the grocery mart.',

  // ═══════════════════════════════════════════════
  // 회썰기 (SashimiPanel)
  // ═══════════════════════════════════════════════
  '일반 회뜨기': 'Basic Sashimi',
  '고급 사시미 뜨기': 'Fine Sashimi',
  '오징어 회뜨기 (22점)': 'Squid sashimi (22 pieces)',
  '노란 유도선을 위 → 아래로 드래그해 썰어냅니다.': 'Drag along the yellow guide line from top to bottom to slice.',
  '사선 (소기즈쿠리) — 옆에서 본 뷰': 'Diagonal (sogizukuri) — side view',
  '세로 (히라즈쿠리) — 위에서 본 뷰': 'Straight down (hirazukuri) — top view',
  '컷: 가운데 가로 1회(두 덩어리) + 세로 10회 — 양 덩어리를 관통해 총 22점':
    'Cuts: 1 crosswise cut down the middle (two slabs) + 10 lengthwise cuts through both slabs = 22 pieces.',
  '컷: 날개당 1회 — 좌우 날개를 각각 반으로 (총 4점)': 'Cuts: 1 per fin — halve the left and right fins (4 pieces in total).',
  '컷: 1회 — 촉완 2가닥을 다리 뭉치에서 분리 (회가 아닌 요리 재료)':
    'Cuts: 1 — separate the two tentacles from the arm cluster (a cooking ingredient, not sashimi).',
  '컷: 3회 — 머리 밑동을 따라 다리를 잘라냅니다 (삶은 문어 머리 1 + 다리 8)':
    'Cuts: 3 — cut the legs away along the base of the head (1 boiled octopus head + 8 legs).',
  '컷: 사선 7회 — 다리 결을 따라 얇게 썰어 숙회 8점을 냅니다':
    'Cuts: 7 diagonals — slice thin along the grain of the leg for 8 pieces of sukhoe.',
  '촉완 분리 완료!': 'Tentacles separated!',
  '다리 분리 완료!': 'Legs separated!',
  '촉완(긴 다리)': 'Tentacle (long arm)',
  '다리부는 회가 아닌 요리 재료입니다 — 촉완은 판매·미끼로도 쓸 수 있습니다':
    'The arm cluster is a cooking ingredient, not sashimi — tentacles can also be sold or used as bait.',
  '다리를 도마에 올리면 [숙회 썰기 (8점)]로 문어 숙회를 낼 수 있습니다':
    'Put a leg on the board to turn it into octopus sukhoe with [Sukhoe slicing (8 pieces)].',
  '요리 탭 [사시미 만들기]에서 접시에 담아 사시미를 완성하세요 (모듬/단품)':
    'Plate them in [Make Sashimi] on the Cooking tab to finish the dish (assorted or single species).',
  "고급 회 조각은 '스시' 요리 재료로도 쓸 수 있습니다 (추후)":
    'Fine sashimi slices can also be used as an ingredient for sushi (coming later).',
  '사용 칼': 'Knife used',
  '평균 정확도': 'Average accuracy',

  // ═══════════════════════════════════════════════
  // 손질 (ButcheryPanel) — 진행 라벨·판정 문구
  // ═══════════════════════════════════════════════
  '작업 선택': 'choose a task',
  '삼면뜨기 픽셀 가이드 — 선행 9컷 + 본편 38컷 (드래그 이동 · 휠 스크롤)':
    'Three-piece fillet pixel guide — 9 prep cuts + 38 main cuts (drag to move, wheel to scroll)',
  '가이드 켜짐': 'Guide on',
  '가이드 꺼짐 — 유도선만 표시': 'Guide off — only the cut lines are shown',
  '[좌우 뒤집기] 필요 — F 또는 버튼': '[Flip left/right] needed — press F or the button',
  '[상하 뒤집기] 필요 — V 또는 버튼': '[Flip top/bottom] needed — press V or the button',
  '[좌우(F)] + [상하(V)] 뒤집기 필요': 'Flip both [left/right (F)] and [top/bottom (V)]',
  '[90° 회전] 필요 — R (반대: Shift+R)': '[Rotate 90°] needed — R (reverse: Shift+R)',
  '필렛 뷰 전환 필요': 'Switch to the fillet view',
  '두족류는 공정에 맞춰 자동으로 배치됩니다': 'Cephalopods are laid out automatically to match each step.',
  '빗나갔습니다 — 눈 뒤 지점을 다시 탭하세요': 'Missed — tap the spot behind the eye again.',
  '빗나갔습니다 — 표시된 가장자리 지점을 클릭하세요': 'Missed — click the marked edge point.',
  '너무 짧습니다 — 시작점에서 끝점까지 길게 드래그하세요': 'Too short — drag all the way from the start point to the end point.',
  '당김이 약합니다 — 잡은 지점에서 유도선 방향으로 길게 당기세요':
    'Too weak a pull — pull far along the guide line from where you gripped it.',
  '표시된 지점을 잡고 시작하세요': 'Grip the marked point to start.',
  '왼쪽 껍질을 잡고 시작하세요': 'Grip the skin on the left to start.',
  '꼬리 쪽 손잡이를 잡고 시작하세요': 'Grip the tail-end handle to start.',
  '뜯어냈습니다!': 'Peeled off!',
  '굵은소금 1개 사용 — 몸 전체를 왕복으로 치대세요': 'Uses 1 coarse salt — rub it back and forth over the whole body.',
  '굵은소금이 필요합니다 — 식자재마트에서 구매하세요': 'You need coarse salt — buy it at the grocery mart.',
  '막칼(폴백)': 'Utility knife (fallback)',
  '(식자재마트에서 막칼/회칼/야나기바 구매)': '(Buy a utility knife, sashimi knife or yanagiba at the grocery mart)',
  '회뜨기(장 뜨기·박피)는 인벤토리 기타 아이템에 회칼이 있어야 합니다.':
    'Filleting and skinning require a sashimi knife in your Misc inventory.',
  '시메·방혈·손질(비늘/머리/내장)까지 마쳤습니다.': 'Ikejime, bleeding and prep (scaling, heading, gutting) are done.',
  '손질 완료 (통마리)': 'Dressing complete (whole fish)',
  '부산물 발생': 'By-product obtained',
  '(지급 대상 없음)': '(nothing to hand out)',
  '필렛은 나중에 도마에 다시 올려 이어서 손질할 수 있습니다 (추후 재장착 지원).':
    'You can put the fillet back on the board later and carry on dressing it.',
  '손질 스킬 Lv.20 (MAX)': 'Dressing skill Lv.20 (MAX)',
  '껍질이 붙어있는 필렛': 'Skin-on fillet',
  '껍질+엔가와 붙은 필렛': 'Fillet with skin and engawa',
  '껍질 붙은 엔가와': 'Skin-on engawa',
  '엔가와 제거된 껍질 필렛': 'Skin-on fillet with the engawa removed',

  // 뷰·배치 라벨 (ORIENTATION_LABEL / ROTATION_LABEL / CEPH_VIEW_LABEL)
  '기본 (머리 왼쪽)': 'Default (head to the left)',
  '뒤집기 (머리 오른쪽)': 'Flipped (head to the right)',
  '배 위로': 'Belly up',
  '등 위로 (머리 오른쪽)': 'Back up (head to the right)',
  '살 위로 (필렛)': 'Flesh up (fillet)',
  '가로 (머리 왼쪽)': 'Horizontal (head to the left)',
  '가로 (머리 오른쪽)': 'Horizontal (head to the right)',
  '세로 (머리 위·꼬리 아래)': 'Vertical (head up, tail down)',
  '세로 (머리 아래·꼬리 위)': 'Vertical (head down, tail up)',
  '등면 위 (통몸통)': 'Dorsal up (whole mantle)',
  '배면 위 (개복면)': 'Ventral up (opened side)',
  '배면 위 (통몸통 — 절개면)': 'Ventral up (whole mantle — cut face)',
  '펼친 시트 (내장면)': 'Opened sheet (gut side)',
  '펼친 시트 (껍질면)': 'Opened sheet (skin side)',
  '펼친 시트 (껍질면 위)': 'Opened sheet (skin side up)',
  '펼친 시트 (살코기면)': 'Opened sheet (flesh side)',
  '펼친 시트 (살코기면 위)': 'Opened sheet (flesh side up)',
  '분리 결과 확인': 'Check the separated parts',
  '분리 덩어리 (도마 배치)': 'Separated pieces (laid on the board)',
  '통마리 (등면 위)': 'Whole (dorsal up)',
  '통몸 (다리 왼쪽)': 'Whole body (arms to the left)',
  '머리 뒤집힘 (속면)': 'Head inverted (inside out)',
  '머리 뒤집힘 (외번 — 속면)': 'Head inverted (everted — inside out)',
  '구면 정면 (빨판·입)': 'Oral side (suckers and beak)',
  '입면 위 (다리 방사)': 'Oral side up (arms splayed)',

  // ═══════════════════════════════════════════════
  // 손질 섹션·작업 라벨 (ButcherySections)
  // ═══════════════════════════════════════════════
  '시메·방혈': 'Ikejime & Bleeding',
  '시메 (즉살)': 'Ikejime (spiking)',
  '시메 (신경 차단)': 'Ikejime (nerve spike)',
  '방혈': 'Bleeding',
  '밑손질 (자유 순서)': 'Prep (any order)',
  '머리 제거': 'Remove the head',
  '지느러미 제거': 'Remove the fins',
  '비늘치기': 'Scaling',
  '비늘치기 (앞면)': 'Scaling (front side)',
  '비늘치기 (뒷면)': 'Scaling (back side)',
  '비늘치기 (등면)': 'Scaling (dark side)',
  '비늘치기 (배면)': 'Scaling (white side)',
  '머리 S자 절단 (내장 동반)': 'S-curve head cut (guts come with it)',
  '배따기·내장 제거': 'Gutting & Cleaning',
  '개복 → 내장 꺼내기': 'Open the belly → take the guts out',
  '개복 · 내장 분리': 'Gutting & guts removal',
  '내장 떼어내기': 'Pull the guts out',
  '핏줄 긁기': 'Scrape the blood line',
  '척추 아래 혈관 긁기': 'Scrape the vessel under the spine',
  '세척': 'Rinse',
  '흐르는 물 세척': 'Rinse under running water',
  '내장 자리 세척': 'Rinse the gut cavity',
  '꼬리 칼집 (앞/뒤)': 'Tail score (front / back)',
  '꼬리 칼집 (앞면)': 'Tail score (front side)',
  '꼬리 칼집 (뒷면)': 'Tail score (back side)',
  '꼬리 칼집 (등면)': 'Tail score (dark side)',
  '꼬리 칼집 (배면)': 'Tail score (white side)',
  '1면 뜨기 (자유 순서)': 'Fillet side 1 (any order)',
  '2면 뜨기 (자유 순서)': 'Fillet side 2 (any order)',
  '등쪽 → 척추까지': 'Dorsal cut down to the spine',
  '등쪽 → 척추까지 + 갈비뼈 끊기': 'Dorsal cut to the spine + cut the ribs',
  '꼬리쪽 → 배쪽 분리': 'Tail side → separate along the belly',
  '배쪽 → 척추 + 갈비뼈 끊어 분리': 'Belly side → cut through spine and ribs to separate',
  '중앙선 칼집': 'Center-line score',
  '위쪽(내장 위치) 포 뜨기': 'Fillet the upper half (gut side)',
  '위쪽 포 뜨기': 'Fillet the upper half',
  '아래쪽 포 뜨기': 'Fillet the lower half',
  '등쪽 뜨기 (2장)': 'Fillet the dark side (2 pieces)',
  '배쪽 뜨기 (흰 면 — 2장)': 'Fillet the white side (2 pieces)',
  '갈빗대 제거 (자유 순서)': 'Rib removal (any order)',
  '필렛 A 갈빗대': 'Fillet A ribs',
  '필렛 B 갈빗대': 'Fillet B ribs',
  '지아이뼈 분리': 'Pin-bone removal',
  '필렛 A 지아이 라인 ×2': 'Fillet A pin-bone lines ×2',
  '필렛 B 지아이 라인 ×2': 'Fillet B pin-bone lines ×2',
  '엔가와 분리 (자유 순서)': 'Engawa separation (any order)',
  '필렛 1 엔가와': 'Fillet 1 engawa',
  '필렛 2 엔가와': 'Fillet 2 engawa',
  '필렛 3 엔가와': 'Fillet 3 engawa',
  '필렛 4 엔가와': 'Fillet 4 engawa',
  '박피 (껍질 벗기기)': 'Skinning',
  '껍질 벗기기': 'Skin it',
  '꼬리 손잡이 만들기': 'Make the tail grip',
  '손질 완료': 'Dressing complete',
  '시메 ① 갑–눈 사이': 'Ikejime (1) between the cuttlebone and the eyes',
  '시메 ② 눈–다리 사이': 'Ikejime (2) between the eyes and the arms',
  '외번 · 내장 분리': 'Everting & guts removal',
  '머리 뒤집기(외번)': 'Turn the head inside out',
  '내장 분리 1/2': 'Guts removal 1/2',
  '내장 분리 2/2': 'Guts removal 2/2',
  '머리 되돌리기': 'Turn the head back',
  '몸통 절개': 'Open the mantle',
  '오징어뼈(연골) 빼기': 'Pull out the pen (cartilage)',
  '연골 제거': 'Remove the cartilage',
  '날개 · 아가미 정리': 'Fins & gills cleanup',
  '날개살 분리 1/2': 'Fin flesh separation 1/2',
  '날개살 분리 2/2': 'Fin flesh separation 2/2',
  '날개 뜯기(껍질째) 1/2': 'Tear the fin off with the skin 1/2',
  '날개 뜯기(껍질째) 2/2': 'Tear the fin off with the skin 2/2',
  '아가미 제거 · 내장면 닦기': 'Remove the gills & wipe the gut side',
  '껍질 분리': 'Skin removal',
  '껍질 분리 완료': 'Skin removal complete',
  '뒤집어 껍질 잡기': 'Flip it over and grip the skin',
  '껍질 뜯기(가로) 1/4': 'Tear the skin sideways 1/4',
  '껍질 뜯기(가로) 2/4': 'Tear the skin sideways 2/4',
  '껍질 뜯기(가로) 3/4': 'Tear the skin sideways 3/4',
  '껍질 뜯기(가로) 4/4': 'Tear the skin sideways 4/4',
  '껍질 뜯기 ② (아래로)': 'Tear the skin (2) downward',
  '머리부 분할': 'Split the head section',
  '머리부 3분할': 'Split the head section in three',
  '부리 빼내기': 'Pull out the beak',
  '악판(입) 제거': 'Remove the beak (mouth)',
  '악판 뽑아내기': 'Pull the beak out',
  '굵은소금 치대기': 'Rub with coarse salt',
  '소금 치대기 · 세척 · 완료': 'Salt rub · rinse · finish',
  '거품 · 점액 문지르기': 'Rub off the foam and slime',

  // ═══════════════════════════════════════════════
  // 손질 스테이지 라벨·안내 (ButcheryProcess)
  // ═══════════════════════════════════════════════
  '1면': 'Side 1',
  '2면': 'Side 2',
  '5장': '5-piece',
  '등쪽': 'Dorsal',
  '배쪽': 'Belly',
  '위쪽': 'Upper',
  '아래쪽': 'Lower',
  '눈 뒤 뇌 지점을 정확히 탭하세요 — 신경 차단으로 선도가 유지됩니다':
    'Tap exactly on the brain spot behind the eye — spiking the nerve keeps it fresh.',
  '방혈 — 아가미 절개': 'Bleeding — cut the gills',
  '아가미 안쪽을 세로로 그어 피를 빼세요': 'Draw a vertical cut inside the gills to bleed it.',
  '방혈 — 얼음물 담그기': 'Bleeding — ice-water bath',
  '얼음물에 담가 방혈을 완료하세요 (잡내 감소·선도 향상)':
    'Soak it in ice water to finish bleeding (less off-flavour, better freshness).',
  '꼬리→머리 역결 방향으로 지그재그로 문질러 비늘을 전부 벗기세요':
    'Scrub in a zigzag from tail to head, against the grain, until every scale is off.',
  '뒤집어서 반대면 비늘도 전부 벗기세요': 'Flip it over and scale the other side completely.',
  '뒤집어서 흰 면 비늘도 전부 벗기세요': 'Flip it over and scale the white side completely.',
  '비늘 부스러기를 씻어내세요': 'Rinse off the scale debris.',
  '비늘을 말끔히 벗겼습니다': 'Scaled clean.',
  '머리따기 (앞면 사선)': 'Heading (front diagonal)',
  '머리따기 (뒷면 사선 → 분리)': 'Heading (back diagonal → separate)',
  '아가미 뒤에서 가슴지느러미 쪽으로 사선을 넣으세요': 'Cut on a diagonal from behind the gills toward the pectoral fin.',
  '뒤집어 같은 사선을 맞추면 머리가 분리됩니다': 'Flip it over and match the same diagonal — the head comes free.',
  '머리 S자 절단': 'S-curve head cut',
  '내장 주머니를 피해 S자로 머리를 잘라내세요 — 내장은 머리와 함께 딸려 나옵니다':
    'Cut the head off in an S-curve around the gut pocket — the guts come away with it.',
  '지느러미 제거 (등·뒷·가슴)': 'Fin removal (dorsal, anal, pectoral)',
  '등·뒷·가슴 지느러미 밑동을 따라 각각 칼집을 넣어 뽑으세요 (3곳 — 순서 자유)':
    'Score along the base of the dorsal, anal and pectoral fins and pull each one out (3 spots, any order).',
  '개복 (항문→머리 경계)': 'Gutting (vent → head)',
  '항문에서 머리 경계까지 배를 가르세요': 'Slit the belly from the vent up to the head.',
  '내장 비우기': 'Empty the cavity',
  '갈빗대 안쪽 내장 덩어리를 긁어 통째로 꺼내세요': 'Scrape the gut mass out of the rib cage in one piece.',
  '내장을 통째로 꺼냈습니다': 'Guts removed in one piece.',
  '핏줄(신장) 긁기': 'Scrape the blood line (kidney)',
  '내장 자리 천장 — 척추뼈 아래 검붉은 혈관막을 긁어 남은 피를 제거하세요':
    'Along the roof of the cavity, scrape the dark red membrane under the spine to clear the remaining blood.',
  '척추 아래 핏줄을 긁어냈습니다': 'Blood line under the spine scraped out.',
  '뱃속 세척': 'Rinse the cavity',
  '뱃속을 흐르는 물에 깨끗이 씻으세요': 'Rinse the cavity clean under running water.',
  '꼬리 쪽에 얕은 홈을 내 박피 손잡이를 만드세요 (앞면)':
    'Cut a shallow notch at the tail to make a skinning grip (front side).',
  '뒤집어 반대면 꼬리에도 얕은 홈을 내세요': 'Flip it over and notch the tail on the other side too.',
  '꼬리 끝 쪽에 얕은 칼집을 넣으세요 (등면)': 'Make a shallow score near the tail tip (dark side).',
  '뒤집어 배면 꼬리에도 얕은 칼집을 넣으세요': 'Flip it over and score the tail on the white side too.',
  '등쪽 — 중앙선 칼집': 'Dorsal — center-line score',
  '배쪽 — 중앙선 칼집': 'Belly — center-line score',
  '머리 경계에서 꼬리까지 몸통 중앙(척추선)을 따라 칼집을 넣으세요':
    'Score along the center of the body (the spine line) from the head cut down to the tail.',
  '뒤집어 등면도 중앙(척추선)을 따라 칼집을 넣으세요':
    'Flip it over and score along the center (spine line) on the dark side too.',
  '몸통 중앙선을 기준으로 한쪽 반신의 지느러미 경계를 따라 얕은 칼집 3회':
    'Working from the center line, make three shallow scores along the fin edge of one half.',
  '등 지느러미 자리를 따라 머리쪽(우) → 꼬리쪽(좌)으로 칼집을 넣어 척추뼈까지 뜨세요 (1회차)':
    'Score along the dorsal fin line from the head (right) to the tail (left), down to the spine (pass 1).',
  '등 지느러미 자리를 따라 머리쪽(우) → 꼬리쪽(좌)으로 칼집을 넣어 척추뼈까지 뜨세요 (3회 — 점점 깊게)':
    'Score along the dorsal fin line from the head (right) to the tail (left), down to the spine (3 passes, deeper each time).',
  '벌어진 틈을 따라 한 번 더 깊게 그어 척추뼈까지 완전히 뜨세요 (2회차)':
    'Run the knife deeper along the opened gap until you reach the spine (pass 2).',
  '2면 — 등쪽 → 척추까지 (2회차)': 'Side 2 — dorsal down to the spine (pass 2)',
  '2면 — 갈비뼈·척추 연결부 끊기': 'Side 2 — cut the rib-to-spine joint',
  '2면 — 배쪽 갈비뼈·척추 연결부 끊기': 'Side 2 — cut the belly-side rib-to-spine joint',
  '2면 — 꼬리쪽 → 배쪽 분리': 'Side 2 — tail side, separate along the belly',
  '머리쪽에 드러난 척추뼈와 갈비뼈가 연결된 지점을 끊어 2면을 완전히 떼어내세요':
    'Cut through where the exposed spine meets the ribs at the head end to free side 2 completely.',
  '머리(배)쪽에 드러난 척추뼈와 갈비뼈가 연결된 지점을 끊어 2면을 완전히 떼어내세요':
    'Cut through where the exposed spine meets the ribs at the head (belly) end to free side 2 completely.',
  '꼬리쪽(우)에서 머리(배)쪽으로 척추뼈와 살덩어리 사이를 그어 분리하세요 (2회 — 점점 깊게)':
    'Run the knife between the spine and the flesh from the tail (right) toward the head (belly) end (2 passes, deeper each time).',
  '꼬리 칼집(우)에서 항문 위 뱃살을 지나 아가미까지 척추뼈 바로 위를 일자로 뜨세요 (2회 — 점점 깊게)':
    'From the tail score (right), run straight just above the spine, past the belly flesh over the vent, up to the gills (2 passes, deeper each time).',
  '아가미 지느러미 쪽 갈비뼈와 척추뼈 사이를 등쪽 지느러미 방향으로 강하게 썰어 뼈를 끊고 윗면 살을 떠내세요':
    'Cut firmly between the ribs and the spine near the gill fin, toward the dorsal fin, to break the bone and lift the upper fillet off.',
  '거의 중앙선까지 — 칼끝이 중앙선 칼집에 닿게 갈라 필렛을 떠내세요':
    'Almost to the center line — open it until the knife tip meets the center score, then lift the fillet off.',
  '머리에서 꼬리로 — 만들어둔 칼길을 따라 살과 뼈를 더 깊이 가르세요':
    'Head to tail — follow the path you cut and split flesh from bone more deeply.',
  '중앙 뼈(중골) 위를 강하게 썰어 반신 한 장을 분리 — 상·하 양측으로 남은 장 반복':
    'Cut firmly over the center frame to free one half — repeat for the remaining pieces above and below.',
  '갈빗대 제거 (필렛 A)': 'Rib removal (fillet A)',
  '갈빗대 제거 (필렛 B)': 'Rib removal (fillet B)',
  '척추뼈 자리에서 내장막 쪽으로 대각선 칼집 — 갈빗대 판만 얇게 도려내세요':
    'Cut on a diagonal from the spine line toward the gut membrane — pare off just the rib plate.',
  '반대쪽 필렛도 같은 방식으로 갈빗대 판을 도려내세요': 'Pare the rib plate off the other fillet the same way.',
  '지아이뼈 분리 (필렛 A)': 'Pin-bone removal (fillet A)',
  '지아이뼈 분리 (필렛 B)': 'Pin-bone removal (fillet B)',
  '가운데 지아이뼈 라인을 따라 세로로 2회 잘라 등살/지아이뼈/뱃살로 분리하세요':
    'Make two lengthwise cuts along the pin-bone line to split it into loin, pin-bone strip and belly.',
  '반대쪽 필렛도 지아이 라인을 2회 잘라 분리하세요': 'Cut the pin-bone line on the other fillet twice as well.',
  '필렛 가장자리의 지느러미살(엔가와)과 살코기 경계를 칼로 갈라 분리하세요':
    'Cut along the border between the fin meat (engawa) and the flesh at the edge of the fillet to separate it.',
  '꼬리에서 머리 방향으로 지느러미(엔가와) 경계를 따라 칼길을 내세요 (칼날 위쪽)':
    'Run the knife from tail to head along the fin (engawa) border, blade angled up.',
  '박피 ① 꼬리 손잡이 만들기': 'Skinning (1) make the tail grip',
  '박피 ② 껍질과 살 사이 칼 넣기': 'Skinning (2) slide the knife between skin and flesh',
  '박피 ③ 껍질 잡고 분리': 'Skinning (3) grip the skin and pull it off',
  '꼬리(왼쪽) 살코기에 작은 칼집을 넣어 잡을 손잡이를 만드세요':
    'Nick the flesh at the tail (left) to make a grip you can hold.',
  '측면에서 껍질과 살코기 경계면을 따라 칼을 넣으세요': 'From the side, slide the knife along the line between skin and flesh.',
  '측면에서 껍질(회색)과 살코기 경계면을 따라 칼을 넣으세요':
    'From the side, slide the knife along the line between the skin (grey) and the flesh.',
  '껍질을 잡고 도마 왼쪽으로 지그재그로 당겨 벗기세요':
    'Grip the skin and pull it off toward the left of the board in a zigzag.',
};
