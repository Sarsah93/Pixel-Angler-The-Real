/**
 * @file en_rig.ts
 * @description 192차 채비 모딩 트리 영문 — 칸·갈래·세트 라벨 · 채비창 문구 · 첫 열기 가이드 · 새 부품 이름 · 도움말 「장비 설정 (채비)」
 *
 * 키 = 코드에 적힌 한국어 원문 그대로. `en.ts`의 EN_DICT에 합쳐진다.
 */

export const EN_RIG: Record<string, string> = {
  // ── 칸 라벨 (core RIG_SLOTS / RIG_PART_LABEL) ──
  '원줄 부속': 'Line add-on', '면사매듭': 'Stopper knot', '구슬': 'Bead', '부력찌': 'Float', '쿠션고무': 'Cushion', '수중찌': 'Sub-float',
  '유동 봉돌': 'Sliding sinker', '매듭': 'Knot', '도래': 'Swivel', '다음': 'Next', '목줄': 'Leader', '목줄 끝': 'Leader end',
  '연결 도래': 'Connector', '좁쌀봉돌': 'Split shot', '바늘': 'Hook', '미끼': 'Bait', '간편 채비': 'Ready rig', '묶음추': 'Bundle sinker',
  '헤드': 'Head', '스커트': 'Skirt', '넥타이': 'Necktie', '단수': 'Tiers', '봉돌': 'Sinker', '루어': 'Lure', '지그헤드': 'Jig head', '웜': 'Worm',
  '고정': 'Fixed', '스냅 도래': 'Snap swivel', '묶음추 채비': 'Bundle-sinker rig', '타이라바 헤드': 'Tairaba head',
  '타이라바 스커트': 'Tairaba skirt', '타이라바 넥타이': 'Tairaba necktie',
  '바늘 1': 'Hook 1', '바늘 2': 'Hook 2', '바늘 3': 'Hook 3', '미끼 1': 'Bait 1', '미끼 2': 'Bait 2', '미끼 3': 'Bait 3',
  '미끼 4': 'Bait 4', '미끼 5': 'Bait 5', '미끼 6': 'Bait 6', '미끼 7': 'Bait 7',
  '핀도래': 'Pin swivel', '바렐 도래': 'Barrel swivel',
  '가지바늘 1': 'Branch hook 1', '가지바늘 2': 'Branch hook 2', '가지바늘 3': 'Branch hook 3', '가지바늘 4': 'Branch hook 4',
  '가지바늘 5': 'Branch hook 5', '가지바늘 6': 'Branch hook 6', '가지바늘 7': 'Branch hook 7',

  // ── 갈래 선택지 ──
  '없음 (바로 매듭)': 'None (straight to the knot)', '찌 세트': 'Float set', '직결 매듭': 'Direct knot',
  '도래·스냅': 'Swivel / snap', '간편 채비 직결': 'Ready rig, tied direct',
  '원줄에 아무것도 꿰지 않는다 — 구멍치기·루어·간편 채비.': 'Nothing threaded on the main line — hole fishing, lures, ready rigs.',
  '면사매듭 → 구슬 → 부력찌 → 쿠션 → 수중찌 순으로 꿴다.': 'Thread stopper knot → bead → float → cushion → sub-float.',
  '고리·구멍 봉돌을 원줄에 꿰는 원투 채비.': 'Surf rig with a ring or hole sinker sliding on the main line.',
  '원줄과 목줄을 매듭으로 바로 잇는다 (FG 노트 등).': 'Tie the main line straight to the leader (FG knot etc.).',
  '도래로 잇는다 — 꼬임이 적고 채비 교체가 쉽다.': 'Join with a swivel — less twist, easy rig swaps.',
  '도래 반대편에 목줄을 묶는다.': 'Tie a leader to the other eye of the swivel.',
  '묶음추·편대·루어처럼 완제품을 바로 건다.': 'Clip on a ready-made rig — bundle sinker, spreader, lure.',
  '목줄 끝에 바늘을 묶는다 (좁쌀봉돌은 선택).': 'Tie a hook to the leader end (split shot optional).',
  '목줄 끝에 핀도래·스냅을 달아 세트를 건다.': 'Add a pin swivel or snap at the leader end and hang a ready rig.',
  '세트의 어시스트 라인·아이를 목줄에 바로 묶는다.': 'Tie the rig’s assist line or eye straight to the leader.',
  '전갱이 (3단)': 'Horse mackerel (3 tiers)', '고등어 (5단)': 'Mackerel (5 tiers)', '열기 (7단)': 'Rockfish (7 tiers)',

  // ── 세트 ──
  '타이라바 채비': 'Tairaba rig', '카드 채비': 'Card rig', 'T자 천평 편대': 'T-bar spreader', '하드 베이트': 'Hard bait', '소프트 베이트': 'Soft bait',
  '봉돌과 바늘이 묶여 나오는 원투 간편 채비. 핀도래에 걸고 미끼만 끼우면 된다.': 'Ready surf rig with sinker and hooks tied together. Clip it to a pin swivel and just add bait.',
  '헤드·스커트·넥타이를 조립하는 참돔 러버지그. 바늘에는 혼무시·청갯지렁이를 끼운다.': 'Red seabream rubber jig built from head, skirt and necktie. Bait the hooks with king ragworm or blue ragworm.',
  '가지바늘이 여러 단 달린 편대. 단마다 미끼를 끼운다.': 'Spreader with several branch hooks. Bait each tier.',
  '봉돌과 목줄을 금속 프레임이 벌려 주는 원투 편대. 꼬임이 적다.': 'Surf spreader whose metal frame keeps sinker and leader apart. Less tangling.',
  '미노우·스푼·스피너·에기·메탈지그·완성 타이라바. 미끼를 끼우지 않는다.': 'Minnow, spoon, spinner, egi, metal jig, finished tairaba. No bait.',
  '지그헤드에 웜을 끼운다. 미끼를 따로 끼우지 않는다.': 'Thread a worm onto a jig head. No separate bait.',

  // ── 채비창 문구 ──
  '선택': 'Choose', '비어 있음 (선택)': 'Empty (optional)', '뺌 (전유동)': 'Removed (free-drift)', '묶음': 'Tied', '비권장': 'Not advised',
  '권장되는 채비 유형이 아닙니다.': 'This is not the advised bait for this rig.',
  '권장되는 채비 유형이 아닙니다 — 이 세트는 다른 미끼를 쓰면 대상어종이 거의 물지 않는다.': 'Not the advised bait for this rig — with other bait the target species will hardly bite.',
  '채비 물리 스펙 (실시간 합산)': 'Rig physics (live)', '제한 없음 (바닥까지)': 'No limit (to the bottom)',
  '사용 가능한 부품이 없습니다 — 직판장 채비 코너': 'No usable parts — fish market tackle corner',

  // ── 첫 열기 가이드 ──
  '채비는 「원줄」 한 칸에서 시작한다. 칸에 무엇을 다느냐에 따라 오른쪽에 다음 칸이 열린다 — 직접 엮어 가는 방식이다.':
    'A rig starts from one slot: the main line. What you put in a slot opens the next slot to its right — you build it up yourself.',
  '원줄을 달면 「매듭」 칸이 열린다. 직결로 목줄을 바로 묶거나, 도래를 달아 간편 채비를 걸 수 있다. 앞 칸을 바꾸면 그 뒤에 달렸던 것은 전부 풀린다.':
    'With the main line on, the Knot slot opens. Tie a leader direct, or add a swivel and clip on a ready rig. Change an earlier slot and everything after it comes off.',
  '부품을 달 때마다 아래 상자에서 채비 무게와 가라앉는 속도, 닿는 수심이 다시 계산된다. 금색 「추천」은 지금 자리에 맞는 부품이 가방에 있다는 뜻이다.':
    'Every part you add updates the box below: rig weight, sink rate and reachable depth. A gold "Pick" means your bag has a part that suits that slot.',

  // ── 새 부품 ──
  '핀 도래 8호': 'Pin swivel #8', '바렐 도래 6호': 'Barrel swivel #6', '타이라바 헤드 60g': 'Tairaba head 60g',
  '타이라바 헤드 80g': 'Tairaba head 80g', '타이라바 헤드 100g': 'Tairaba head 100g',
  '타이라바 스커트 (빨강)': 'Tairaba skirt (red)', '타이라바 넥타이 (주황)': 'Tairaba necktie (orange)',
  '핀(스냅)이 달린 도래 — 묶음추·타이라바 같은 간편 채비를 걸고 뺀다.': 'Swivel with a pin snap — clip ready rigs like bundle sinkers and tairaba on and off.',
  '통 모양 몸통의 일반 도래 — 원줄과 목줄의 꼬임을 줄인다.': 'Plain barrel-bodied swivel — keeps main line and leader from twisting.',
  '참돔 러버지그 헤드(유동식). 얕은 수심·약한 조류.': 'Red seabream rubber-jig head (free-sliding). Shallow water, light current.',
  '참돔 러버지그 헤드(유동식). 중간 수심의 표준.': 'Red seabream rubber-jig head (free-sliding). The standard for mid depths.',
  '참돔 러버지그 헤드(유동식). 깊은 수심·센 조류.': 'Red seabream rubber-jig head (free-sliding). Deep water, strong current.',
  '참돔 러버지그 헤드(유동식). 대심도·급류.': 'Red seabream rubber-jig head (free-sliding). Very deep water, racing current.',
  '헤드 뒤에 다는 고무 스커트 — 새우·게 다리처럼 흔들린다.': 'Rubber skirt behind the head — flutters like shrimp or crab legs.',
  '길게 늘어뜨린 넥타이 — 등속 릴링에서 꼬리처럼 흐른다.': 'Long trailing necktie — streams like a tail on a steady retrieve.',

  // ── 193차 — 다중 미끼 · 한 바늘에 두 미끼 · 반짝이 카드 채비 ──
  '카드 채비 반짝이 3단': 'Flasher card rig, 3 tiers', '카드 채비 반짝이 5단': 'Flasher card rig, 5 tiers',
  '카드 채비 민바늘 7단': 'Plain card rig, 7 tiers',
  '가지바늘 3단 — 바늘마다 반짝이는 깃이 달려 미끼 없이도 전갱이가 문다.': 'Three branch hooks, each with a flashy skin — horse mackerel bite even without bait.',
  '가지바늘 5단 반짝이 깃 — 고등어·전갱이 떼를 노린다.': 'Five flasher branch hooks — for schools of mackerel and horse mackerel.',
  '깃 없는 가지바늘 7단 — 단마다 미끼를 끼워 열기를 노린다.': 'Seven plain branch hooks — bait each tier for rockfish.',
  '남은 미끼가 모자랍니다': 'Not enough bait left',
  '같은 미끼가 두 마리 이상 남아 있어야 합니다': 'You need at least two of the same bait left',
  '반짝이 바늘만 달린 채비 — 미끼가 없어 전갱이만 작은 멸치로 보고 덤빈다.': 'Flasher hooks only — with no bait, only horse mackerel take them for tiny anchovies.',
  '「한 바늘에 두 미끼」를 배웠다. 미끼 칸 아래 x2를 켜면 같은 미끼를 두 마리 꿴다 — 던질 때마다 두 개씩 줄지만 입질이 조금 오른다.':
    'You learned Two Baits, One Hook. Turn on x2 under a bait slot to thread two of the same bait — it uses two per cast, but bites come a little more often.',

  // ── 도움말 「장비 설정 (채비)」 ──
  '도래 뒤나 목줄 끝에서 「간편 채비」를 고르면 세트가 펼쳐집니다. 묶음추 채비: 묶음추 하나를 고르면 핀도래 · 바늘 1 · 2 · 바렐 도래 · 봉돌 · 바늘 3이 고정으로 열리고, 바늘마다 미끼 칸이 붙습니다. 바늘마다 다른 미끼를 끼울 수 있고, 어느 바늘이든 하나만 끼우면 완성입니다.':
    'Choose Ready rig after a swivel or at the leader end and the set unfolds. Bundle-sinker rig: pick one bundle sinker and pin swivel · hook 1 · 2 · barrel swivel · sinker · hook 3 open as fixed parts, with a bait slot after each hook. Each hook can take a different bait, and baiting any one hook completes the rig.',
  '카드 채비(반짝이 3단 · 반짝이 5단 · 민바늘 7단 — 직판장) · T자 천평 편대 · 하드 베이트(미노우 · 스푼 · 스피너 · 에기 · 메탈지그 · 완성 타이라바) · 소프트 베이트(지그헤드 + 웜)도 같은 자리에서 고릅니다. 루어 세트는 미끼를 끼우지 않습니다. 반짝이 깃 카드 채비는 미끼 없이도 고정되며, 그때는 전갱이만 미끼를 끼웠을 때의 10% 정도로 덤빕니다.':
    'Card rigs (flasher 3 · flasher 5 · plain 7 tiers — fish market), the T-bar spreader, hard baits (minnow · spoon · spinner · egi · metal jig · finished tairaba) and soft baits (jig head + worm) are chosen in the same place. Lure sets take no bait. A flasher card rig locks even with no bait; then only horse mackerel bite, at about 10% of the baited rate.',
  '미끼 여러 개 · 한 바늘에 두 미끼': 'Several baits · two baits on one hook',
  '미끼를 단 바늘이 하나 늘 때마다 입질이 2% 오릅니다(바늘 3개 = +4%). 이웃한 바늘에 같은 미끼가 이어지면 1%가 더해집니다. 바늘이 많은 카드 채비는 오르는 몫이 모두 합쳐 10%까지입니다. 오른 만큼은 채비 제원 상자 제목 끝에 보입니다.':
    'Each extra baited hook raises bites by 2% (three hooks = +4%). The same bait on neighbouring hooks adds another 1%. Card rigs, with their many hooks, top out at +10% in all. The total shows at the end of the rig-spec box title.',
  '미끼는 가방의 같은 미끼를 바늘끼리 나눠 씁니다 — 남은 수보다 많은 바늘에 같은 미끼를 끼울 수 없고, 입질이 오면 문 바늘의 미끼만 줄어듭니다. 가방에 남은 미끼가 있으면 그 바늘에 그대로 다시 꿰어져 있습니다.':
    'Hooks share the bait in your bag — you cannot put the same bait on more hooks than you have, and a bite only uses up the bait on the hook that was taken. If more of that bait is left, the hook stays baited.',
  '채비를 고정해도 미끼 칸은 바꿀 수 있습니다 — 낚시 뒤 미끼만 다시 끼우면 됩니다. 미끼가 하나도 없으면 고정 · 캐스팅이 되지 않습니다(반짝이 카드 채비 제외).':
    'Bait slots stay editable even on a locked rig — after fishing, just re-bait. With no bait at all the rig cannot be locked or cast (except a flasher card rig).',
  '스킬 「한 바늘에 두 미끼」(낚시)를 배우면 미끼 칸 아래 x2 단추가 생깁니다. 켜면 같은 미끼를 두 마리 꿰어 던질 때마다 2개씩 줄고, 켠 바늘마다 입질이 1% 더 오릅니다(두 미끼로 오르는 몫은 최대 2%).':
    'Learning the Fishing skill Two Baits, One Hook adds an x2 button under each bait slot. Turned on, the hook carries two of the same bait — two are used per cast, and each such hook adds another 1% to bites (up to 2% in total from doubled hooks).',
  '채비 엮기 (찌 · 원투 · 구멍치기)': 'Building a Rig (float · surf · hole)',
  '원줄 한 칸에서 시작': 'Start from the main line',
  'U → 채비하기 탭 — ① 추천 한 줄 ② 채비 체인(원줄부터 오른쪽으로 열린다) ③ 채비 제원 ④ 채비 고정 버튼':
    'U → Tackles tab — ① recommendation line ② rig chain (opens rightward from the main line) ③ rig specs ④ lock buttons',
  '채비는 「원줄」 한 칸에서 시작합니다. 칸을 누르면 가방에서 그 자리에 맞는 부품만 보이고, 하나를 달면 오른쪽에 다음 칸이 열립니다. 원줄 → 원줄 부속(없음 · 찌 세트 · 유동 봉돌) → 매듭(직결 · 도래) → 목줄 또는 간편 채비 → 바늘 → 미끼 순으로 엮습니다.':
    'A rig starts from a single Main line slot. Click a slot to see only the parts in your bag that fit it; add one and the next slot opens to the right. Order: main line → line add-on (none · float set · sliding sinker) → knot (direct · swivel) → leader or ready rig → hook → bait.',
  '찌낚시: 원줄 부속을 「찌 세트」로 고르면 면사매듭 · 구슬 · 부력찌 · 쿠션고무 · 수중찌 칸이 열립니다(부력찌만 필수). 원투: 「유동 봉돌」에 고리 · 구멍 봉돌을 꿰거나, 도래에 묶음추 채비를 겁니다. 구멍치기: 부속 없이 직결 → 목줄 → 바늘(좁쌀봉돌은 선택)로 끝냅니다 — 부력찌는 필수가 아닙니다.':
    'Float fishing: choose Float set as the line add-on to open stopper knot · bead · float · cushion · sub-float slots (only the float is required). Surf: slide a ring or hole sinker on via Sliding sinker, or clip a bundle-sinker rig to a swivel. Hole fishing: no add-on, direct knot → leader → hook (split shot optional) — a float is not required.',
  '원줄과 목줄은 「직결 매듭」으로 바로 잇거나 「도래」로 잇습니다. 핀(스냅) 도래는 묶음추 · 타이라바 같은 완제품 세트를 걸고 빼기 쉽고, 바렐 도래는 꼬임을 줄입니다.':
    'Join main line and leader with a Direct knot or a Swivel. A pin (snap) swivel makes clipping ready rigs like bundle sinkers and tairaba on and off easy; a barrel swivel reduces twist.',
  '앞 칸을 바꾸면 그 뒤에 달렸던 것은 전부 풀립니다(원줄을 빼면 처음부터). 비어 있는 주황 테두리 칸이 지금 채워야 할 자리입니다. 금색 「추천」은 그 자리에 맞는 부품이 가방에 있다는 뜻입니다.':
    'Change an earlier slot and everything after it comes off (remove the main line and you start over). An empty orange-bordered slot is what to fill next. A gold "Pick" means your bag holds a part that suits that slot.',
  '간편 채비 세트': 'Ready-rig sets',
  '타이라바 채비: 헤드 · 스커트 · 넥타이 셋을 다 채워야 완성되고, 바늘 1(필수) · 2(선택)에 미끼를 끼웁니다. 혼무시 · 청갯지렁이가 권장 미끼이며, 크릴 같은 다른 미끼를 끼우면 「권장되는 채비 유형이 아닙니다」가 뜨고 참돔이 거의 물지 않습니다.':
    'Tairaba rig: head, skirt and necktie must all be filled, then bait hook 1 (required) and hook 2 (optional). King ragworm and blue ragworm are the advised baits; other bait such as krill shows "not the advised bait" and red seabream will hardly bite.',
  '오른쪽 아래 [채비 고정]을 누르면 지금 채비가 잠깁니다(필수 칸이 다 차 있어야 합니다). 고정 중에는 칸을 바꾸려 하면 「고정 해제」 안내가 뜨고, [고정 해제]로 풉니다. 캐스팅에 고정이 꼭 필요하지는 않습니다.':
    'Press [Lock rig] at the bottom right to lock the current rig (all required slots must be filled). While locked, trying to change a slot shows an unlock notice; [Unlock rig] releases it. Casting does not require a lock.',
  '줄터짐 · 밑걸림으로 잃은 부품 자리는 고정 중에도 비워집니다 — 목줄을 잃으면 그 아래 바늘 · 미끼도 같이 풀립니다. 다시 채우려면 고정을 풀어야 합니다.':
    'Parts lost to break-offs or snags are emptied even while locked — lose the leader and the hook and bait below it come off too. Unlock to refill.',
  '루어는 간편 채비의 한 갈래': 'Lures are one kind of ready rig',
  '루어 체인 — ① 원줄 → 직결 → 목줄 ② 목줄 끝 「간편 채비 직결」 ③ 하드 / 소프트 베이트 ④ 루어 · 지그헤드 칸 ⑤ 채비 제원':
    'Lure chain — ① main line → direct knot → leader ② "ready rig, tied direct" at the leader end ③ hard / soft bait ④ lure · jig head slots ⑤ rig specs',
  '원줄 → 매듭 → 목줄까지 엮은 뒤 목줄 끝에서 「간편 채비 직결」(또는 스냅 도래 → 간편 채비)을 고르고 「하드 베이트」나 「소프트 베이트」를 고릅니다. 소프트 베이트는 지그헤드 칸과 웜 칸이 함께 열리고, 하드 베이트는 루어 한 칸으로 끝납니다. 미끼 칸은 열리지 않습니다.':
    'Build main line → knot → leader, then at the leader end choose "ready rig, tied direct" (or snap swivel → ready rig) and pick Hard bait or Soft bait. Soft bait opens a jig-head slot and a worm slot together; hard bait ends with a single lure slot. No bait slot opens.',
  '원줄 · 목줄 · 바늘 · 찌 · 봉돌 · 도래 · 미끼는 수산물 직판장에서 사서 활용(U) → 채비하기에서 원줄부터 차례로 엮습니다.':
    'buy main line · leader · hooks · floats · sinkers · swivels · bait at the fish market and build them up from the main line in Utilize (U) → Tackles.',
};

/** 수치·세트 이름이 끼는 문장 */
export const EN_RIG_RULES: [RegExp, (m: RegExpMatchArray, tr: (s: string) => string) => string][] = [
  [/^채비 물리 스펙 \(실시간 합산\) · (.+)$/, (m, tr) => `Rig physics (live) · ${tr(m[1])}`],
  [/^라인 인장: (.+) kg$/, (m) => `Line strength: ${m[1]} kg`],
  [/^(.+) 선택$/, (m, tr) => `Choose ${tr(m[1])}`],
  [/^(.+)  ·  (.+)$/, (m, tr) => `${tr(m[1])}  ·  ${tr(m[2])}`],
  // 193차
  [/^입질 \+(\d+)%$/, (m) => `Bites +${m[1]}%`],
  [/^(.+) 두 마리$/, (m, tr) => `${tr(m[1])} ×2`],
  [/^반짝이 바늘 (\d+)$/, (m) => `Flasher hook ${m[1]}`],
  [/^타이라바 헤드 (\d+)g$/, (m) => `Tairaba head ${m[1]}g`],
];
