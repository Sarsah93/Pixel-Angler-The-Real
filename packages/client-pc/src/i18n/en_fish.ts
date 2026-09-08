/**
 * @file en_fish.ts
 * @description 어종 도감 설명 영문 사전 (120차 ①) — `FISH_DATABASE.description` 57종 전수.
 *
 * 도감 카드 본문은 변수가 없는 산문이라 규칙(`EN_RULES`)으로 풀 수 없다 — 원문 1:1 사전이다.
 * 어종 **이름**은 `FISH_DATABASE.nameEn` 이 런타임 사전에 이미 합류하므로 여기에는 없다.
 *
 * ⚠ 키는 원문 그대로여야 한다(공백·중점·물결 포함). 설명을 고치면 여기 키도 함께 고칠 것 —
 * 안 고치면 조용히 한국어로 남는다(깨지지는 않는다). 잔여 점검은 워크로그 120 §5 하네스로.
 */
export const EN_FISH: Record<string, string> = {
  '\'바다의 폭군\'. 방어·부시리보다 힘이 세고 최대 2m·40kg급까지 자라는 심해 지깅 대물. 여름~가을 남해·제주 급심에서 대형 메탈지그에 반응한다. 이마가 각지고 눈을 가로지르는 사선 줄무늬로 방어와 구분한다.':
    'The tyrant of the sea. Stronger than yellowtail or amberjack, it reaches 2 m and 40 kg and is a deep-jigging prize. From summer into autumn it takes large metal jigs in the deep water off the South Sea and Jeju. Tell it from yellowtail by the angular forehead and the diagonal band across the eye.',
  '거친 여 밭의 제왕. 단단한 이빨로 성게 껍질째 깨부수는 갯바위 최고급 대상어. 수컷 성어는 주둥이가 검게 변한다(강구).':
    'King of the rough reef. With teeth hard enough to crush urchins whole, it is the finest quarry on the rocks. Mature males turn black about the snout.',
  '겨울철 대표 선상 지깅 대상어. 메탈지그로 공략하며 표층에서 집단으로 베이트피시를 몰고 다녀 화려한 보일링을 형성한다.':
    'The classic winter boat-jigging target. Worked with metal jigs, it herds baitfish at the surface in packs and raises spectacular boils.',
  '고급 식재료지만 전신에 치명적인 맹독. 이빨 힘이 강해 와이어가 아니면 채비를 끊는다. 전문 조리 자격 필요.':
    'A delicacy carrying lethal toxin throughout its body. Its jaws are strong enough to bite through a rig if you do not use wire. Requires a licensed preparer.',
  '기수역·하구 진흙 바닥의 1년생 어종. 식탐이 엄청나 미끼를 넣자마자 삼킨다. 가을 생활낚시의 스타.':
    'A one-year fish of brackish, muddy estuary bottoms. So greedy it swallows the bait the moment it lands. The star of autumn casual fishing.',
  '납작한 마름모꼴 은빛 몸통에 뼈가 연해 통째로 썰어 먹는 여름 별미. 모래·뻘 0~100m의 남해/서해에 6~9월 분포 및 회유.':
    'A flat silver diamond of a fish with bones soft enough to eat whole — a summer treat. Found over sand and mud from 0 to 100 m in the South and West Seas, migrating there June to September.',
  '눈 사이에 가시가 솟은 표준명 도다리. 문치가자미와 달리 군산·목포·여수·마산·진해·부산 등 남해 서부에 국지 분포한다. 모래·뻘 50~100m.':
    'The true frog flounder, with spines between the eyes. Unlike marbled flounder it is local to the western South Sea — Gunsan, Mokpo, Yeosu, Masan, Jinhae and Busan. Sand and mud, 50–100 m.',
  '눈 테두리가 선명한 노란색인 숭어류 최대종(방언: 참숭어). 진흙 섞인 연안과 강 하구에 무리 짓는다. 산란기 5~6월, 겨울(11~2월) 기름 오른 밀치회가 별미.':
    'The largest of the mullets, marked by a vivid yellow eye ring. It schools in muddy inshore water and river mouths. It spawns in May and June; in winter, from November to February, the oil-rich flesh makes fine sashimi.',
  '눈동자가 검고 꼬리가 V자로 깊게 갈라진 표층 회유어(방언: 개숭어). 보리 익을 무렵(3~5월)이 제철이라 보리숭어라 불린다. 겨울엔 눈에 기름눈꺼풀(백태)이 낀다.':
    'A surface-roaming migrant with a dark pupil and a deeply forked tail. It is at its best when the barley ripens, from March to May. In winter a fatty film covers the eye.',
  '눈이 유난히 큰 소형 청어류. 표층·중층 50~150m에 대군을 이루며 대형어의 주 먹이(베이트피시)라 생미끼로도 쓰인다. 12월 제주/남해, 1~8월 일본>남해>제주 회유.':
    'A small herring with strikingly large eyes. It massing at 50–150 m in the surface and mid layers and is prime forage for larger fish, so it also serves as live bait. Off Jeju and the South Sea in December, migrating Japan → South Sea → Jeju from January to August.',
  '다소 깊은 암초·구조물에 서식하는 난태생 볼락류(불볼락과 별종). 밤에 활발히 먹이 활동하며 선상 볼락 낚시의 대상어.':
    'A live-bearing rockfish of deeper reefs and structure (a separate species from the red rockfish). It feeds hard after dark and is a mainstay of boat rockfish trips.',
  '동해 냉수대 암초 바닥의 대형 문어(피문어). 작은 개체부터 팔을 벌리면 사람만 한 초대형까지 편차가 매우 크다. 동해안이 주 서식지이며 겨울~봄에 특히 굵은 놈이 붙는다.':
    'A large octopus of the cold reef bottoms of the East Sea. Sizes vary enormously, from small ones to giants as broad as a person with their arms spread. The East Sea coast is its home ground, and the heaviest come on from winter into spring.',
  '등에 흰 줄무늬와 노란 지느러미가 특징인 대형 참복류. 테트로도톡신 독을 지녀 이빨로 목줄을 끊는다. 전문 조리 자격이 있어야 식용 가능.':
    'A large pufferfish with white stripes on the back and yellow fins. It carries tetrodotoxin and bites through leaders with its teeth. Edible only when prepared by a licensed cook.',
  '따뜻한 남해·서해 연안 암초·구조물 바닥에 붙는 돌문어. 에기·문어볼로 바닥을 노리며, 붙는 힘이 강해 초반에 바닥에서 띄우는 것이 관건이다. 대문어보다 소형이다.':
    'The common octopus of warm inshore reefs and structure in the South and West Seas. Work egi or octopus balls along the bottom; it grips so hard that lifting it clear at the first pull is everything. Smaller than the giant Pacific octopus.',
  '루어 낚시의 제왕. 여름밤 연안으로 붙어 베이트를 사냥하며 화려한 에라 세척(점프 바늘털이)을 보여준다.':
    'The king of lure fishing. On summer nights it moves inshore to hunt bait and puts on spectacular head-shaking jumps.',
  '모래 속에 몸을 숨기고 있다가 미끼가 위를 지날 때 폭발적으로 솟구치는 국민 횟감. 두 눈이 왼쪽. 7~12월 제주>서해>제주, 4~6월 제주>남해>동해로 회유. 금지체장 35cm.':
    'The nation’s favourite raw fish, lying buried in sand until prey passes overhead, then erupting upward. Both eyes on the left. It migrates Jeju → West Sea → Jeju from July to December and Jeju → South Sea → East Sea from April to June. Minimum size 35 cm.',
  '모래·펄 바닥에 몸을 묻고 매복하는 여름 대표 어종. 넓적한 머리와 큰 입으로 소어·갯지렁이를 삼킨다. 담백한 흰살로 여름 횟감·매운탕에 인기.':
    'A summer staple that buries itself in sand and mud to ambush. It engulfs small fish and worms with a broad head and a wide mouth. The lean white flesh is popular as sashimi and in spicy stew.',
  '무리 지어 맹렬히 회유하는 등푸른 생선. 찌를 사방으로 끌고 다니는 방정맞은 입질이 특징. 7~12월 제주>전라>서해, 4~12월 제주>남해>일본으로 회유하며 금어기는 4~6월.':
    'A blue-backed fish that migrates hard in schools. The bite is a wild, skittish run that drags the float in every direction. It migrates Jeju → Jeolla → West Sea from July to December and Jeju → South Sea → Japan from April to December; closed season April to June.',
  '바다낚시 입문자부터 고수까지 모두 노리는 대상어. 조류가 강한 사리 전후로 대물이 나온다.':
    'The quarry every angler chases, beginner and expert alike. The big ones come around the spring tides, when the current runs hard.',
  '바다의 왕. 암초와 모래가 섞인 깊은 수심의 회유어. 이마가 튀어나온 개체는 수컷 성어.':
    'King of the sea. A migratory fish of deep water where reef meets sand. A bulging forehead marks a mature male.',
  '바닥에 붙지 않고 중층에 무리 지어 피어올라 조류를 타는 회유성 볼락. 찌낚시의 주 타겟.':
    'A migratory rockfish that rises off the bottom to hang in the mid layer and ride the current. The main target of float fishing.',
  '바닥에서 20~50cm 단차로 붙는 연안 에깅 대상. 봄·가을 시즌에 에기 2.5~3.5호로 얕은 연안에서도 잘 낚인다. 주야 무관하게 먹는 에깅 입문 어종.':
    'An inshore egi target that holds 20–50 cm off the bottom. In spring and autumn it takes size 2.5–3.5 egi even in shallow water. It feeds day and night, which makes it the beginner’s squid.',
  '바위 틈에 도사리다 눈앞의 미끼를 순간 낚아채 틈새로 파고드는 여박기의 명수. 죽어도 맛있다는 남해 별미.':
    'A master of the rock crevice — it lurks in the gaps, snatches whatever passes and bolts straight back in. A South Sea delicacy said to taste good however you cook it.',
  '밤에 경계심이 풀려 갯바위나 방파제 가장자리로 접근하는 참돔 소물. 밤낚시 찌낚시의 짜릿한 불청객.':
    'A small red seabream that drops its guard at night and comes right up to the rocks or the breakwater edge. The thrilling gatecrasher of night float fishing.',
  '방어보다 더 강한 파이팅의 대형 어종. 갯바위나 연안 표층을 빠른 속도로 헤엄쳐 다녀 큰 파장을 일으킨다.':
    'A big fish that fights even harder than yellowtail. It races along the surface by the rocks and inshore, throwing a heavy wake.',
  '방파제 입문 낚시의 단골 손님. 낚아도 먹기 껄끄러운 잡어지만 어린 낚시꾼들의 첫 물고기.':
    'A regular of beginner breakwater fishing. Awkward eating and treated as a nuisance, but it is many a young angler’s first fish.',
  '방파제와 갯바위 근처 수중여에 서식하는 대표적인 야행성 어종. 집어등에 잘 반응하며, 밤이 되면 상층으로 피딩하러 올라와 끓어오르는 보일링을 형성하기도 한다.':
    'A classic nocturnal fish of the sunken reefs by breakwaters and rock ledges. It responds well to a fishing lamp, and after dark it rises to the upper layer to feed, sometimes raising a boil.',
  '병어와 쏙 닮은 소형종. 입이 아주 작아 큰 바늘에는 걸리지 않는다. 모래·뻘 0~100m의 남해/서해에 6~9월 분포.':
    'A small fish almost identical to the silver pomfret. Its mouth is so small that a large hook will not take. Sand and mud, 0–100 m in the South and West Seas, June to September.',
  '봄 도다리 쑥국의 주인공. 광어와 반대로 두 눈이 오른쪽. 입이 작고 예민해 소형 바늘 원투에 잘 잡힌다. 모래·뻘 10~100m의 대한민국 전 해역에 분포하며 시장에서 흔히 도다리로 유통된다. 금어기 12~1월.':
    'The fish behind spring flounder and mugwort soup. Unlike olive flounder, both eyes are on the right. The small, fussy mouth takes best on small hooks cast long. Sand and mud, 10–100 m in every Korean sea, and commonly sold at market as dodari. Closed season December to January.',
  '아가미 테두리의 검은 띠와 제비꼬리가 특징인 외양성 벵에돔. 난류를 좋아해 제주/남해 먼바다 섬에 분포. 육식 성향이 강해 크릴에 압도적으로 반응하며 이빨이 날카로워 목줄을 잘 끊는다.':
    'An offshore blackfish marked by a dark rim to the gill cover and a forked tail. It favours warm water and is found around the outer islands of Jeju and the South Sea. Strongly carnivorous, it goes for krill above all, and its sharp teeth cut leaders readily.',
  '아랫턱이 바늘처럼 길게 뻗은 표층 회유어. 무리 지어 수면을 스치며 크릴 밑밥에 잘 모인다. 은은한 단맛의 봄·가을 별미 회.':
    'A surface migrant whose lower jaw runs out to a needle point. It skims the surface in schools and gathers well to krill chum. The faintly sweet flesh is a spring and autumn treat as sashimi.',
  '아카무츠라 불리는 심해 고급어. 목구멍이 검고 눈이 크며 기름기가 풍부해 최고급 횟감으로 친다. 모래·진흙 저층 100~400m(10~20°C). 7~8월 제주, 8~6월 제주>남해>일본 회유.':
    'A prized deep-water fish, known as akamutsu. Black-throated, large-eyed and rich in oil, it is considered top-grade sashimi. Sand and mud bottoms, 100–400 m at 10–20 °C. Off Jeju in July and August, migrating Jeju → South Sea → Japan from August to June.',
  '야간 원투 낚시의 제왕(아나고). 60cm 넘는 용가리급은 99% 암컷. 잡히면 원줄을 몸으로 배배 꼬아버린다.':
    'King of the night surfcast. Anything over 60 cm is female nine times out of ten. Hooked, it twists its body into the line and knots it.',
  '얕은 연안 돌바닥의 친근한 손님. 쥐노래미와 달리 측선이 1개뿐이고 꼬리 끝이 둥근 부채꼴.':
    'A friendly regular of shallow rocky inshore bottoms. Unlike the fat greenling it has only one lateral line, and its tail is rounded like a fan.',
  '에깅의 꽃. 가을 연안 시즌과 봄 대형 산란기가 최성기다. 밤이면 얕은 곳으로 붙으며 에기 폴링에 달려든다. 전장 45cm급 대물은 1.2~1.3kg에 이른다.':
    'The jewel of egi fishing. Its peaks are the autumn inshore run and the big spring spawners. At night it moves shallow and hits egi on the fall. A 45 cm fish runs 1.2–1.3 kg.',
  '여름 남해의 최고급 별미 하모. 단검 같은 이빨로 목줄을 단숨에 끊고 손까지 물어뜯는 난폭한 장어. 모래·암초 20~50m. 4~7월 제주>서해, 10~12월 서해>제주 회유하며 남해/동해에도 소규모 분포.':
    'Hamo, the finest summer delicacy of the South Sea. A violent eel that cuts a leader in one bite with dagger teeth, and will take a hand with it. Sand and reef, 20–50 m. It migrates Jeju → West Sea from April to July and West Sea → Jeju from October to December, with smaller numbers in the South and East Seas.',
  '여름 모래 해변 원투낚시의 대표 손맛. 갯지렁이 미끼에 잘 물며 은백색 몸이 파도밭을 훑는다. 담백한 흰살로 튀김·회 모두 좋다.':
    'The classic pull of summer surfcasting off a sand beach. It takes lugworm well, its silver body working the surf line. The lean white flesh is good fried or raw.',
  '연안을 회유하는 대표적인 등푸른 생선. 무리를 지어 다니며 방파제나 선상에서 카고·사비키 채비로 노린다. 야간 집어등 불빛에 강하게 반응해 밤낚시 대상어로 인기가 높다.':
    'A blue-backed fish that migrates inshore. It moves in schools and is taken from breakwaters or boats on cage and sabiki rigs. It reacts strongly to a fishing lamp, which makes it a favourite after dark.',
  '일명 우럭. 연안의 바위틈이나 방파제 테트라포드 주위에 서식하는 대표적인 락피시. 밤에 매우 활발히 먹이활동을 한다.':
    'Known as ureok. The definitive rockfish of inshore crevices and the tetrapods around breakwaters. It feeds very hard at night.',
  '입이 머리만큼 큰 한류성 대형 저서어. 겨울 거제·진해 대구탕의 주인공으로 주로 남해에 분포한다. 45~450m. 12월 제주/남해, 1~8월 일본>남해>제주 회유. 금어기 1/16~2/15.':
    'A cold-water bottom fish with a mouth as big as its head. The star of winter cod soup in Geoje and Jinhae, it is found mainly in the South Sea at 45–450 m. Off Jeju and the South Sea in December, migrating Japan → South Sea → Jeju from January to August. Closed 16 Jan – 15 Feb.',
  '작고 오므린 입으로 미끼만 톡톡 따먹어 "미끼 도둑"으로 불리는 어종. 여름~가을 방파제와 갯바위 수중여 주변에 흔하다. 입질 파악이 까다로워 예민한 채비가 필요하며, 살과 간이 별미로 회·조림 대상어로 친다.':
    'Called the bait thief for the way its small pursed mouth nibbles the bait clean off. Common around breakwaters and sunken reefs from summer into autumn. The bite is hard to read, so a sensitive rig is needed; the flesh and liver are both prized, raw or braised.',
  '제주·남해 여름 밤바다의 주인공. 몸통이 창처럼 가늘고 길며 지느러미가 몸통의 60% 이상을 덮는다. 낮에는 깊은 중층에 머물다 밤이면 집어등 불빛을 따라 20~30m권까지 떠오른다. 오징어류 중 회 맛이 가장 좋아 시세도 높다.':
    'The star of summer nights off Jeju and the South Sea. Its body is slender as a spear, with fins covering more than 60 % of the mantle. By day it holds in the deeper mid layer; after dark it rises to 20–30 m following the lamps. The best-eating squid there is, and priced accordingly.',
  '쥐치보다 크고 길쭉한 쥐포의 주 원료. 작은 입으로 미끼만 갉아먹는 악명 높은 미끼 도둑. 내만·암초·해조류 70~100m. 1~3월 제주, 4~11월 남해>동해, 6~10월 제주>서해 회유. 금어기 5~7월.':
    'Larger and longer than the filefish, and the main source of dried filefish snacks. A notorious bait thief that gnaws the bait away with a tiny mouth. Inner bays, reef and weed, 70–100 m. Off Jeju January to March, South Sea → East Sea April to November, Jeju → West Sea June to October. Closed season May to July.',
  '지느러미의 검은 줄무늬가 선명한 냉수성 가자미. 20~40cm급은 전 해역의 기수지역(주로 울산 강 하구)에 붙는다. 모래·뻘 20~250m.':
    'A cold-water flounder with bold dark bars on the fins. Fish of 20–40 cm hold in brackish water throughout Korean seas, chiefly the river mouths around Ulsan. Sand and mud, 20–250 m.',
  '집어등을 이용한 야간 방파제/선상 낚시의 핵심. 진흙·모래 바닥 위를 회유하며 여름엔 50~100m, 겨울엔 70~120m에 머문다. 4~6월 제주/서해, 7~10월 서해/남해로 회유. 법정 금지체장은 항문장 18cm(전장 약 47cm)이며 금어기는 7월 한 달.':
    'The heart of night fishing from breakwater or boat under a lamp. It ranges over mud and sand bottoms, holding at 50–100 m in summer and 70–120 m in winter. It migrates to Jeju and the West Sea from April to June and to the West and South Seas from July to October. The legal minimum is 18 cm anal length (about 47 cm total), and July is closed.',
  '큰 가슴지느러미 아래 발가락 모양 유리기조로 모래 바닥을 기어 먹이를 찾는다. 잡으면 부레로 개구리 소리를 낸다. 살이 단단해 탕·구이가 별미.':
    'It walks the sand on finger-like rays beneath its great pectoral fins, hunting as it goes. Handled, it croaks like a frog with its swim bladder. The firm flesh is best in soup or grilled.',
  '태생(새끼를 낳는) 희귀 생태의 겨울 방파제 단골. 봄에 완전히 자란 새끼 수십 마리를 직접 출산한다.':
    'A winter breakwater regular with the rare habit of bearing live young — in spring it gives birth to dozens of fully formed fry.',
  '턱이 없는 원구류(곰장어). 펄 바닥에 숨어 밤에 죽은 물고기를 파고드는 청소부. 위협받으면 점액을 대량 분비한다. 껍질째 구워 먹는 별미.':
    'A jawless cyclostome, the hagfish. It hides in mud and burrows into dead fish at night as a scavenger. Threatened, it pours out slime. Grilled in its skin it is a delicacy.',
  '평소 모래·진흙 140~150m에 살다가 10~12월 산란을 위해 동해 연안 2~10m 해조류로 몰려든다. 알이 가득 찬 암컷이 별미.':
    'It normally lives over sand and mud at 140–150 m, but from October to December it crowds into seaweed 2–10 m deep along the East Sea coast to spawn. A roe-laden female is the prize.',
  '표범 무늬의 난류성 대물. 같은 체장의 돌돔보다 무겁다. 수컷 성어는 주둥이가 하얗게 변한다(백화).':
    'A leopard-spotted warm-water heavyweight, heavier than a knifejaw of the same length. Mature males turn white about the snout.',
  '표준명 불볼락. 무리를 지어 생활하는 습성이 있어 야간 선상 카드채비나 수중여 주변에서 다수 낚인다.':
    'Properly the red rockfish. It lives in schools, so numbers come at once on a night boat with a card rig or around sunken reefs.',
  '표층·중층 0~50m를 빠르게 스치는 가늘고 긴 등푸른 회유어. 집어등 불빛에 몰린다. 4~7월 제주>남해>동해>북한, 9~12월 동해>남해>제주>일본으로 회유.':
    'A slim, long, blue-backed migrant that streaks through the surface and mid layers from 0 to 50 m. It gathers to a fishing lamp. It migrates Jeju → South Sea → East Sea → North Korea from April to July and East Sea → South Sea → Jeju → Japan from September to December.',
  '표층을 고속 회유하는 이빨 포식자. 메탈지그·스푼 고속 릴링에 반응하며 해뜰녘·해질녘 1~2시간에 입질이 집중된다. 5월 금어기. 이빨에 목줄이 쓸리기 쉬워 굵은 쇼크리더가 필수다.':
    'A toothed predator that runs fast along the surface. It responds to metal jigs and spoons retrieved quickly, and the bite concentrates in the hour or two around dawn and dusk. Closed in May. Its teeth chafe leaders, so a heavy shock leader is essential.',
  '한국 찌낚시의 꽃. 해조류 무성한 내만성 갯바위의 잡식성 — 빵가루 경단에 반응이 좋다. 수온·소음에 극도로 예민해 이물감이 느껴지면 바로 뱉는 약은 입질의 대명사.':
    'The flower of Korean float fishing. An omnivore of weed-rich inshore rock ledges — it responds well to breadcrumb paste. Extremely sensitive to water temperature and noise, it spits the bait the instant it feels anything wrong: the byword for a delicate bite.',
  '항·방파제에 흔한 소형 복어. 테트로도톡신 맹독을 지닌 미끼 도둑으로, 날카로운 이빨로 바늘과 목줄을 갉아 끊는다. 식용 주의.':
    'A small pufferfish, common in harbours and around breakwaters. A bait thief carrying tetrodotoxin, it gnaws through hooks and leaders with sharp teeth. Eat with caution.',
  '해조류 여 밭의 터줏대감. 산란기 수컷은 황금색 혼인색으로 변해 알을 지킨다. 금어기 11~12월.':
    'The old resident of the weed beds. In the spawning season the male turns golden in nuptial colour and guards the eggs. Closed season November to December.',
  '혓바닥처럼 길쭉한 서대류. 진흙·갯벌·모래 20~100m에 붙으며 입이 작아 미끼를 빨아들이듯 삼킨다. 4~6월 제주/서해, 7~10월 서해/남해로 회유.':
    'A tonguefish, long as a tongue. It holds over mud, tidal flat and sand from 20 to 100 m, and its small mouth takes the bait as if sucking it in. It migrates to Jeju and the West Sea from April to June and to the West and South Seas from July to October.',
};
