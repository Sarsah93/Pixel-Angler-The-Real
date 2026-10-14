/**
 * @file CropCultivationData.ts
 * @description 247차 — 작물별 재배 요소 표(정본 — 조사 정리본을 옮겼다. 값을 고칠 때는 이 파일을 고친다)
 *
 * 조사 4건(잎채소 21 · 열매 16 · 뿌리 · 곡식 20 · 산채 · 허브 19 — 농사로 · 농진청 · 산림청 · 지역 농업기술센터 · 해외 대학 확장 자료)을
 * 칸 단위 게임 값으로 옮겼다. 물 수준 → 알맞은 흙 수분: 적게 [0.2, 0.6] 조금씩 · 보통 [0.35, 0.8] 보통 · 많이 [0.5, 0.95] 흠뻑 ·
 * 물에 잠겨 [0.7, 1.0] 흠뻑(미나리 · 고추냉이). 거두기 전 물 끊기는 근거가 있는 마늘 14일 · 양파 7일 · 수박 10일뿐이다.
 * 작물별 출처는 워크로그 247 §1(조사 요약)에 있다. 표에 없는 작물은 갈래 기본값(`CropCultivationDatabase.CATEGORY_DEFAULT`)을 쓴다.
 */

import type { CropCultivation } from '../types/Farming.js';

export const CROP_CULTIVATION: Readonly<Record<string, CropCultivation>> = {
  bean_sprout: {
    water: { band: [0.6, 1.0], amount: 'deep', over: 'none' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'pull',
    noteKo: '하루 네댓 번 위에서 붓고 바로 빠지게 한다 — 물이 고이면 뿌리가 썩는다.',
    noteEn: 'Pour water over four or five times a day and let it drain straight away — standing water rots the roots.',
  },
  mung_sprout: {
    water: { band: [0.6, 1.0], amount: 'deep', over: 'none' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'pull',
    noteKo: '하루 서너 번 흠뻑 주고 바로 빼며, 뚜껑을 덮어 어둡게 둔다.',
    noteEn: 'Soak three to five times a day, drain at once, and keep the lid on so it stays dark.',
  },
  microgreens: {
    water: { band: [0.45, 0.85], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'cut',
    noteKo: '분무기로 하루 서너 번 촉촉하게 — 흠뻑 부으면 곰팡이가 핀다.',
    noteEn: 'Mist three or four times a day — pour on too much and mould sets in.',
  },
  oyster_mushroom: {
    water: { band: [0.55, 0.95], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick',
    noteKo: '물보다 공중 습도가 중요하다 — 버섯이 난 뒤 물이 고이면 갓이 기형이 된다.',
    noteEn: 'Air humidity matters more than water — once the caps form, pooled water deforms them.',
  },
  lions_mane: {
    water: { band: [0.55, 0.95], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick',
    noteKo: '15~18℃에 습도를 높게 두되, 물이 버섯에 직접 닿으면 누렇게 변한다.',
    noteEn: 'Keep it at 15–18℃ and humid, but water landing on the fruit turns it yellow.',
  },
  wood_ear: {
    water: { band: [0.55, 0.95], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick',
    noteKo: '23℃ 안팎에서 하루 서너 번 뿌린다 — 30℃ 넘게 더우면 썩는다.',
    noteEn: 'Spray three to five times a day at around 23℃ — above 30℃ it rots.',
  },
  lettuce: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '봄 · 가을 사나흘, 여름 이틀마다 고르게 준다 — 마르면 잎끝이 타고, 늦봄 더위엔 꽃대가 선다.',
    noteEn: 'Water evenly — every three to five days in spring and autumn, every two in summer. Dry soil burns the leaf tips; late-spring heat makes it bolt.',
  },
  jeokchima: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '봄 · 가을 사나흘, 여름 이틀마다 고르게 준다 — 마르면 잎끝이 타고, 늦봄 더위엔 꽃대가 선다.',
    noteEn: 'Water evenly — every three to five days in spring and autumn, every two in summer. Dry soil burns the leaf tips; late-spring heat makes it bolt.',
  },
  kkot_lettuce: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '봄 · 가을 사나흘, 여름 이틀마다 고르게 준다 — 마르면 잎끝이 타고, 늦봄 더위엔 꽃대가 선다.',
    noteEn: 'Water evenly — every three to five days in spring and autumn, every two in summer. Dry soil burns the leaf tips; late-spring heat makes it bolt.',
  },
  cheongchukmyeon: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '봄 · 가을 사나흘, 여름 이틀마다 고르게 준다 — 마르면 잎끝이 타고, 늦봄 더위엔 꽃대가 선다.',
    noteEn: 'Water evenly — every three to five days in spring and autumn, every two in summer. Dry soil burns the leaf tips; late-spring heat makes it bolt.',
  },
  jeokchukmyeon: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '봄 · 가을 사나흘, 여름 이틀마다 고르게 준다 — 마르면 잎끝이 타고, 늦봄 더위엔 꽃대가 선다.',
    noteEn: 'Water evenly — every three to five days in spring and autumn, every two in summer. Dry soil burns the leaf tips; late-spring heat makes it bolt.',
  },
  saengchae: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '봄 · 가을 사나흘, 여름 이틀마다 고르게 준다 — 마르면 잎끝이 타고, 늦봄 더위엔 꽃대가 선다.',
    noteEn: 'Water evenly — every three to five days in spring and autumn, every two in summer. Dry soil burns the leaf tips; late-spring heat makes it bolt.',
  },
  cheongromaine: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pull',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '속이 차면 칼로 포기째 벤다 — 물이 모자라면 결구가 나빠지고 잎끝이 탄다.',
    noteEn: 'Cut the whole head once it firms up — short of water, the heart stays loose and the tips burn.',
  },
  jeokromaine: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pull',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '속이 차면 칼로 포기째 벤다 — 물이 모자라면 결구가 나빠지고 잎끝이 탄다.',
    noteEn: 'Cut the whole head once it firms up — short of water, the heart stays loose and the tips burn.',
  },
  butterhead: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pull',
    timing: { best: [3, 4, 8, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '속이 차면 칼로 포기째 벤다 — 물이 모자라면 결구가 나빠지고 잎끝이 탄다.',
    noteEn: 'Cut the whole head once it firms up — short of water, the heart stays loose and the tips burn.',
  },
  perilla: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    timing: { best: [5, 6], off: 'cold' }, selfSeeds: true,
    noteKo: '잎은 한 장씩 아래부터 딴다 — 위쪽 덜 핀 두세 장은 남긴다. 장마에 물이 고이면 뿌리가 상한다.',
    noteEn: 'Pick leaves one at a time from the bottom, leaving the top two to four. Waterlogging in the rains damages the roots.',
  },
  spinach: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pull',
    timing: { best: [3, 9], off: 'bolt', offMonths: { 10: 'short' } },
    noteKo: '산성 흙에 특히 약하고, 물이 고이면 뿌리가 죽고 노균병이 생긴다. 봄에 늦으면 꽃대가 선다.',
    noteEn: 'Very sensitive to acid soil; waterlogging kills the roots and brings downy mildew. Sown late in spring it bolts.',
  },
  crown_daisy: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    noteKo: '건조에 약하다 — 퇴비를 넉넉히 넣어 흙이 물을 머금게 한다. 잎이 쉬 시들어 저녁에 딴다.',
    noteEn: 'It hates drying out — work in plenty of compost so the soil holds water. Pick in the evening; the leaves wilt fast.',
  },
  young_radish: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pull',
    timing: { best: [4, 5, 8, 9], off: 'heat' },
    noteKo: '흙이 마르면 잎줄기가 억세고 쓰다 — 여름엔 날마다, 봄 · 가을엔 이삼일에 한 번 준다.',
    noteEn: 'Dry soil makes the stems tough and bitter — water daily in summer, every two or three days in spring and autumn.',
  },
  ugeolgari: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pull',
    timing: { best: [3, 4, 8, 9], off: 'bolt' },
    noteKo: '늦게 거두면 잎이 거칠고 쓰다 — 약간 어릴 때 뽑는다. 한여름엔 무름병이 많다.',
    noteEn: 'Left late the leaves turn coarse and bitter — pull it a little young. Midsummer brings soft rot.',
  },
  chive: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'high', labor: { plant: 2, harvest: 1 }, harvestBy: 'cut',
    propagate: { by: 'division', months: [3, 4, 9], qty: [1, 2] },
    noteKo: '거름을 많이 먹는다 — 벨 때마다 웃거름과 물을 주고, 다음엔 전보다 1cm쯤 높게 벤다.',
    noteEn: 'A hungry crop — feed and water after every cutting, and cut a centimetre higher each time.',
  },
  scallion: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'pull',
    noteKo: '종구를 쪼개 하나씩 심는다 — 일찍 심으면 종구가 늙고, 늦으면 자랄 철이 모자란다.',
    noteEn: 'Split the sets and plant them one by one — too early and they age, too late and the season runs out.',
  },
  water_parsley: {
    water: { band: [0.7, 1.0], amount: 'deep', over: 'none' }, feed: 'mid', labor: { plant: 2, harvest: 3 }, harvestBy: 'cut',
    timing: { best: [8, 9], off: 'bolt' }, propagate: { by: 'cutting', months: [8, 9], qty: [1, 2] },
    noteKo: '물을 1~2cm 대고 흘려 댄다 — 고인 물이 데워지면 상한다. 찬물 속에서 베는 고된 일이다.',
    noteEn: 'Keep 1–2cm of flowing water over the bed — standing water that warms up spoils it. Cutting it in cold water is hard work.',
  },
  mallow: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick',
    timing: { best: [3, 4, 8, 9], off: 'bolt' },
    noteKo: '장마에 하루이틀만 잠겨도 죽는다 — 장마 전에 거둔다. 30cm쯤에 순을 자르면 곁가지가 는다.',
    noteEn: 'A day or two underwater in the rains kills it — harvest before the monsoon. Cut the tips at 30cm for more side shoots.',
  },
  chard: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick',
    noteKo: '몸에 물이 많은 작물이라 모자라지 않게 준다 — 아래 잎부터 꺾어 따며 오래 거둔다.',
    noteEn: 'A watery plant, so never let it go short — snap the lower leaves first and keep picking for weeks.',
  },
  kangkong: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'none' }, feed: 'mid', labor: { plant: 1, harvest: 1 }, harvestBy: 'cut',
    noteKo: '물가에서도 자랄 만큼 물을 좋아한다 — 모자라면 줄기가 질겨진다. 마디를 남기고 자르면 새순이 난다.',
    noteEn: 'So fond of water it grows at the water’s edge — short of it, the stems toughen. Cut above a node and new shoots follow.',
  },
  arugula: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'cut',
    noteKo: '매일 주면 과습으로 병이 난다 — 겉흙이 마르면 준다. 더위가 길면 잎이 억세고 꽃대가 선다.',
    noteEn: 'Daily watering invites disease — water when the surface dries. Long heat toughens the leaves and it bolts.',
  },
  amaranth: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 1 }, harvestBy: 'pick',
    selfSeeds: true,
    noteKo: '가물 때만 준다 — 더위와 가뭄에 강한 여름풀이다. 떨어진 씨로 이듬해 저절로 난다.',
    noteEn: 'Water only in a dry spell — it is a summer plant that shrugs off heat and drought. Dropped seed comes up by itself next year.',
  },
  meowi: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'rot' }, feed: 'low', labor: { plant: 2, harvest: 2 }, harvestBy: 'cut',
    propagate: { by: 'division', months: [3, 4, 9, 10], qty: [1, 2] },
    noteKo: '반그늘 촉촉한 땅을 좋아하나 뿌리가 잠기면 썩는다 — 뿌리줄기로 퍼져 해마다 거둔다.',
    noteEn: 'Likes damp half-shade, but roots under water rot. It spreads by rhizome and comes back every year.',
  },
  godeulppaegi: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'dig',
    timing: { best: [9], off: 'short' }, selfSeeds: true,
    noteKo: '씨가 작아 발아까지 겉흙이 마르면 안 된다 — 곧은뿌리라 깊게 갈고 호미로 뿌리째 캔다.',
    noteEn: 'The seed is tiny — the surface must not dry out before it sprouts. It has a taproot: dig deep and lift it whole with a homi.',
  },
  bangpung: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'cut',
    noteKo: '해안에 자라는 나물 — 순을 밑동 2~3cm 남겨 베면 새순이 다시 올라온다.',
    noteEn: 'A coastal green — cut the shoots leaving 2–3cm of stem and new ones rise again.',
  },
  gomchwi: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'pick',
    propagate: { by: 'division', months: [3, 4, 10], qty: [2, 3] },
    noteKo: '건조보다 습해에 약하다 — 과습하면 포기째 썩는다. 2~3년 이어 지으면 연작 피해가 난다.',
    noteEn: 'More easily hurt by wet than by dry — waterlogged, the whole plant rots. Grown in one spot for two or three years it sickens.',
  },
  myeongi: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'low', labor: { plant: 3, harvest: 1 }, harvestBy: 'pick',
    propagate: { by: 'division', months: [9, 10], qty: [1, 3] },
    noteKo: '거름은 보통의 절반 이하 — 잎을 따면 그해 새잎이 안 나니 맨 아래 잎 하나는 남긴다.',
    noteEn: 'Feed at half the usual rate or less — picked leaves are not replaced that year, so always leave the lowest one.',
  },
  samnamul: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'high', labor: { plant: 2, harvest: 1 }, harvestBy: 'pick',
    propagate: { by: 'division', months: [3, 4, 10], qty: [1, 2] },
    noteKo: '퇴비를 많이 줄수록 좋다 — 한 번 심으면 대여섯 해 순을 꺾는다. 여름 30℃를 넘지 않는 곳이 맞다.',
    noteEn: 'The more compost the better — plant once and cut shoots for five or six years. Suits places that stay below 30℃ in summer.',
  },
  eosuri: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 3, harvest: 1 }, harvestBy: 'pick',
    propagate: { by: 'division', months: [3, 4, 10], qty: [1, 2] },
    noteKo: '씨 휴면이 강해 말리면 이듬해에야 난다 — 받는 즉시 가을에 뿌리거나 종근을 옮겨 심는다.',
    noteEn: 'Deeply dormant seed — dried, it waits a year to sprout. Sow it fresh in autumn or plant root crowns.',
  },
  bujigaengi: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'cut',
    propagate: { by: 'division', months: [3, 4, 9], qty: [1, 2] },
    noteKo: '울릉도에만 자생하는 섬쑥부쟁이 — 한 번 심어 여러 해 순을 베고, 데쳐 말려 묵나물로 쓴다.',
    noteEn: 'The Ulleungdo aster, found wild only on that island — cut shoots for years from one planting; blanch and dry them for winter.',
  },
  dureup: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'pick',
    thorny: true, propagate: { by: 'cutting', months: [3, 4, 5], qty: [2, 4] },
    noteKo: '가시 돋친 나무 — 첫 순만 따고 2 · 3번째 순은 남긴다. 뿌리 토막을 묻어(근삽) 늘린다.',
    noteEn: 'A thorny tree — take only the first shoot and leave the second and third. Propagate by burying root cuttings.',
  },
  eomnamu: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 2, harvest: 3 }, harvestBy: 'pick',
    thorny: true, propagate: { by: 'cutting', months: [3, 4], qty: [1, 3] },
    noteKo: '굵은 가시에 높이 자라 순 따기가 고되다 — 씨는 휴면이 강해 두 해 만에 나니 뿌리삽목으로 늘린다.',
    noteEn: 'Heavy thorns and tall growth make picking hard work — the seed takes two years to sprout, so propagate by root cuttings.',
  },
  wasabi: {
    water: { band: [0.7, 1.0], amount: 'deep', over: 'none' }, feed: 'low', labor: { plant: 3, harvest: 2 }, harvestBy: 'pull',
    propagate: { by: 'offset', months: [], qty: [2, 4] },
    noteKo: '흐르는 찬물(12~15℃)이어야 한다 — 고이거나 데워지면 무름병. 거둘 때 곁눈을 떼어 다시 심는다.',
    noteEn: 'Needs flowing cold water (12–15℃) — still or warm water brings soft rot. Split off the offsets at harvest and replant them.',
  },
  chopi: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'low', labor: { plant: 2, harvest: 3 }, harvestBy: 'snip',
    thorny: true, propagate: { by: 'cutting', months: [3, 4], qty: [1, 2] },
    noteKo: '날카로운 가시 — 열매 송이를 가위로 자르고, 말리면 껍질이 벌어져 검은 씨를 골라낸다.',
    noteEn: 'Sharp thorns — clip the berry clusters with snips; dried, the husks split and you sift out the black seeds.',
  },
  gondre: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'cut',
    noteKo: '서늘하고 공중 습도가 높은 곳 — 30% 차광에서 가장 많이 난다. 데쳐 말려 묵나물로 쓴다.',
    noteEn: 'Cool, humid air suits it — it yields best under 30% shade. Blanch and dry it for winter greens.',
  },
  danggui: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 1 }, harvestBy: 'cut',
    noteKo: '발아 · 활착기에 흙이 마르면 안 된다 — 억센 잎은 밑동을 베어 새싹을 받는다.',
    noteEn: 'The soil must not dry while it sprouts and settles — cut tough plants to the base for fresh regrowth.',
  },
  myoga: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    propagate: { by: 'division', months: [3, 4], qty: [1, 2] },
    noteKo: '그늘진 촉촉한 땅 — 건조에 약해 짚 · 낙엽으로 덮는다. 땅에서 솟는 꽃이삭을 하나씩 찾아 딴다.',
    noteEn: 'Shady, damp ground — it dislikes drying out, so mulch with straw or leaves. Hunt out the flower buds pushing up from the soil.',
  },
  banga: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'snip',
    selfSeeds: true, propagate: { by: 'division', months: [4, 5], qty: [1, 2] },
    noteKo: '척박한 땅에서도 잘 자란다 — 순을 질러 잎을 받고, 떨어진 씨로 저절로 번진다.',
    noteEn: 'Grows even in poor soil — pinch the tips for more leaves; dropped seed spreads it by itself.',
  },
  shiso: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 1 }, harvestBy: 'snip',
    selfSeeds: true,
    noteKo: '씨가 작아 흙을 아주 얇게 덮는다 — 늦여름 꽃대가 서면 잎이 억세진다. 떨어진 씨로 이듬해 난다.',
    noteEn: 'Tiny seed — cover it very thinly. Late-summer flowering toughens the leaves; dropped seed comes back next year.',
  },
  dill: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'leggy' }, feed: 'low', labor: { plant: 1, harvest: 1 }, harvestBy: 'snip',
    selfSeeds: true,
    noteKo: '곧은뿌리라 옮겨심지 말고 직파 — 덥고 해가 길면 금방 꽃대가 선다. 비료가 많으면 쓰러진다.',
    noteEn: 'A taprooted plant — sow where it is to grow. Heat and long days make it bolt; too much feed and it flops over.',
  },
  fennel: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 1 }, harvestBy: 'pull',
    selfSeeds: true,
    noteKo: '알뿌리는 고른 수분이 중요하다 — 가물면 꽃대가 서고 알이 안 굵는다. 북주면 하얗고 연하다.',
    noteEn: 'The bulb needs steady moisture — in a drought it bolts and stays thin. Earthing it up keeps it white and tender.',
  },
  basil: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 1 }, harvestBy: 'snip',
    timing: { best: [5, 6], off: 'cold' },
    noteKo: '추위에 약해 늦서리 뒤에 심는다 — 겉흙이 마르면 흠뻑, 잎 말고 포기 밑에 준다.',
    noteEn: 'Frost-tender — plant out after the last frost. Soak it when the surface dries, at the base rather than over the leaves.',
  },
  chili: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'high', labor: { plant: 2, harvest: 3 }, harvestBy: 'snip',
    timing: { best: [5], off: 'cold' },
    noteKo: '뿌리가 얕아 가뭄에 약하고, 고랑에 물이 고이면 역병이 번진다 — 홍고추를 7~10일마다 허리 굽혀 딴다.',
    noteEn: 'Shallow roots make it drought-tender, and water standing in the furrows spreads blight. Red peppers are picked bent over every seven to ten days.',
  },
  cheongyang: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'high', labor: { plant: 2, harvest: 3 }, harvestBy: 'snip',
    timing: { best: [5], off: 'cold' },
    noteKo: '뿌리가 얕아 가뭄에 약하고, 고랑에 물이 고이면 역병이 번진다 — 홍고추를 7~10일마다 허리 굽혀 딴다.',
    noteEn: 'Shallow roots make it drought-tender, and water standing in the furrows spreads blight. Red peppers are picked bent over every seven to ten days.',
  },
  cherry_tomato: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'crack' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'snip',
    noteKo: '한 번에 많이 말고 조금씩 자주 — 마르다가 큰비를 맞으면 열매가 터진다.',
    noteEn: 'Little and often rather than a soaking — dry spells followed by heavy rain split the fruit.',
  },
  tomato: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'crack' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'snip',
    noteKo: '흙을 약간 촉촉하게, 마르고 젖는 차이를 작게 — 가물면 배꼽썩음, 과습하면 열과.',
    noteEn: 'Keep the soil slightly moist and the swings small — drought brings blossom-end rot, excess water splits the fruit.',
  },
  stevia_tomato: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'crack' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'snip',
    noteKo: '재배는 방울토마토와 같다 — 가게에서 파는 스테비아 토마토는 거둔 뒤 감미액을 넣은 가공품이다.',
    noteEn: 'Grown just like cherry tomatoes — the stevia tomatoes sold in shops are processed after harvest with a sweetening solution.',
  },
  cucumber: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'leggy' }, feed: 'high', labor: { plant: 2, harvest: 2 }, harvestBy: 'snip',
    timing: { best: [5], off: 'cold' },
    noteKo: '조금씩 여러 번, 맑은 날 오전에 — 마르고 젖기가 되풀이되면 쓴맛이 나고 굽은 오이가 는다.',
    noteEn: 'Little and often, on sunny mornings — alternating drought and soaking makes them bitter and crooked.',
  },
  zucchini: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'snip',
    timing: { best: [5], off: 'cold' },
    noteKo: '심은 뒤 두 주는 물을 줄여 뿌리를 내리게 한다 — 질소가 많으면 덩굴만 무성하다.',
    noteEn: 'Hold back water for two weeks after planting so it roots deep — too much nitrogen and it is all vine.',
  },
  eggplant: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'rot' }, feed: 'high', labor: { plant: 2, harvest: 2 }, harvestBy: 'snip',
    noteKo: '물을 좋아한다 — 여름엔 흙이 마르지 않게. 17℃ 아래면 더디고 8℃ 아래면 냉해를 입는다.',
    noteEn: 'A thirsty plant — never let summer soil dry out. Below 17℃ it stalls; below 8℃ it suffers chill damage.',
  },
  bitter_melon: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 1 }, harvestBy: 'snip',
    noteKo: '잎이 많아 한여름엔 물을 넉넉히 — 노랗게 익으면 터지니 녹색일 때 딴다.',
    noteEn: 'All those leaves need plenty of water in midsummer — pick them green; ripe yellow ones burst.',
  },
  okra: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'snip',
    noteKo: '꼬투리가 하루이틀에 질겨져 매일 딴다 — 잔털에 살갗이 가렵다.',
    noteEn: 'The pods turn woody in a day or two, so pick daily — the fine hairs make your skin itch.',
  },
  gourd: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 3, harvest: 2 }, harvestBy: 'snip',
    noteKo: '무거운 박을 받칠 튼튼한 덕이 필요하다 — 박꽃은 해 질 녘에 핀다.',
    noteEn: 'Needs a sturdy arbour to carry the heavy gourds — the flowers open at dusk.',
  },
  korean_melon: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'bland' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'snip',
    timing: { best: [5], off: 'cold' },
    noteKo: '익어 갈 때 물을 줄이면 달아진다 — 과습하면 단맛이 떨어지고 속이 무른다.',
    noteEn: 'Cut back the water as they ripen and they sweeten — too wet and they go bland and soft inside.',
  },
  watermelon: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'bland', stopDays: 10 }, feed: 'mid', labor: { plant: 2, harvest: 3 }, harvestBy: 'snip',
    noteKo: '거두기 열흘 전부터 물을 끊으면 당도가 오른다 — 두드려 「통통」 맑은 소리가 나면 딴다.',
    noteEn: 'Stop watering ten days before harvest and the sugar rises — pick when a tap gives a clear, hollow ring.',
  },
  strawberry: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'low', labor: { plant: 2, harvest: 2 }, harvestBy: 'pick',
    noteKo: '흙은 마르지 않게, 열매엔 물이 닿지 않게 — 짚을 깔아 잿빛곰팡이를 막는다.',
    noteEn: 'Keep the soil moist but the fruit dry — lay straw underneath to keep grey mould away.',
  },
  blueberry: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'rot' }, feed: 'low', labor: { plant: 3, harvest: 2 }, harvestBy: 'pick',
    noteKo: '뿌리가 얕고 가늘어 마르면 바로 시든다 — 비료에 민감해 조금씩. 익은 알만 여러 번 골라 딴다.',
    noteEn: 'Fine, shallow roots wilt the moment they dry — feed sparingly. Pick only the ripe berries, several passes over.',
  },
  corn: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'high', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    timing: { best: [4, 5], off: 'short' },
    noteKo: '수염이 나올 무렵 가물면 이삭 끝이 빈다 — 여러 줄로 모아 심어야 알이 찬다.',
    noteEn: 'Drought around silking leaves the tips of the ears empty — plant in a block, not a single row, for full ears.',
  },
  potato: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 3 }, harvestBy: 'dig',
    timing: { best: [3, 4], off: 'short' }, forkSpears: true,
    noteKo: '흙이 마른 맑은 날 캔다 — 젖은 흙에서 캐면 썩기 쉽다. 쇠스랑은 빠르지만 몇 개 찍힌다.',
    noteEn: 'Dig on a dry, sunny day — potatoes lifted from wet soil rot easily. A fork is faster but spears a few.',
  },
  sweet_potato: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 2, harvest: 3 }, harvestBy: 'dig',
    timing: { best: [5], off: 'short' }, forkSpears: true, vines: true,
    noteKo: '과습하면 덩이가 안 크고 덩굴만 무성하다 — 덩굴을 낫으로 걷고, 호미로 상처 없이 캔다.',
    noteEn: 'Too wet and the roots stay small while the vines run riot — clear the vines with a sickle and dig gently with a homi.',
  },
  pumpkin_sweet_potato: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 2, harvest: 3 }, harvestBy: 'dig',
    timing: { best: [5], off: 'short' }, forkSpears: true, vines: true,
    noteKo: '과습하면 덩이가 안 크고 덩굴만 무성하다 — 덩굴을 낫으로 걷고, 호미로 상처 없이 캔다.',
    noteEn: 'Too wet and the roots stay small while the vines run riot — clear the vines with a sickle and dig gently with a homi.',
  },
  radish: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'crack' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'pull',
    timing: { best: [8], off: 'short' },
    noteKo: '물은 고르게 — 마른 땅에 큰물이 들면 뿌리가 터지고, 늦게 거두면 바람이 든다.',
    noteEn: 'Water evenly — a flood after a dry spell splits the roots, and a late harvest leaves them pithy.',
  },
  napa_cabbage: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'rot' }, feed: 'high', labor: { plant: 2, harvest: 3 }, harvestBy: 'pull',
    noteKo: '속이 차기 시작하면 물을 무척 먹는다 — 가물면 속이 덜 찬다. 영하 3℃ 한파 전에 거둔다.',
    noteEn: 'Once the heart starts to fill it drinks heavily — in a drought the heads stay loose. Harvest before a −3℃ cold snap.',
  },
  carrot: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'crack' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'dig',
    timing: { best: [7], off: 'short' },
    noteKo: '마르고 젖기가 되풀이되면 갈라지고 가랑이가 진다 — 옮겨 심으면 가랑이 당근이 되어 꼭 직파한다.',
    noteEn: 'Swinging between dry and wet splits and forks the roots — transplanting forks them too, so always sow in place.',
  },
  turnip: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'crack' }, feed: 'mid', labor: { plant: 1, harvest: 1 }, harvestBy: 'pull',
    noteKo: '마른 땅에서 크면 맛이 거칠고 맵다 — 가벼운 서리를 맞으면 달아진다.',
    noteEn: 'Grown in dry soil they turn coarse and hot — a light frost sweetens them.',
  },
  garlic: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot', stopDays: 14 }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'dig',
    process: { first: 'dig', dryDays: 3, last: 'gather' }, timing: { best: [10], off: 'cold' },
    noteKo: '캐기 두 주 전부터 물을 끊는다 — 맑은 날 캐어 밭에서 사나흘 말린 뒤 거둔다.',
    noteEn: 'Stop watering two weeks before lifting — dig on a fine day and let them dry in the field for two or three days.',
  },
  onion: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot', stopDays: 7 }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'pull',
    process: { first: 'pull', dryDays: 2, last: 'gather' },
    noteKo: '잎이 쓰러지면 물을 끊는다 — 늦게까지 주면 저장 중에 썩는다. 뽑아 밭에 눕혀 하루이틀 말린다.',
    noteEn: 'Stop watering when the tops fall — watering late rots them in storage. Pull and lay them in the field to dry for a day or two.',
  },
  leek: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 2 }, harvestBy: 'dig',
    noteKo: '습해에 약하다 — 배수가 물보다 중요하다. 옆을 파서 뽑아야 흰 대가 끊기지 않는다.',
    noteEn: 'It dislikes wet feet — drainage matters more than water. Dig beside it before pulling so the white shank does not snap.',
  },
  taro: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'none' }, feed: 'high', labor: { plant: 2, harvest: 3 }, harvestBy: 'dig',
    vines: true,
    noteKo: '가뭄엔 약하고 침수엔 강하다 — 서리 전에 토란대를 베어 걷고 포기째 캔다.',
    noteEn: 'Drought-tender but flood-hardy — cut the stalks before frost, then lift the whole clump.',
  },
  yacon: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 3 }, harvestBy: 'dig',
    timing: { best: [5], off: 'cold' }, forkSpears: true, vines: true,
    noteKo: '덩이가 잘 부러져 넓게 파 올린다 — 캔 뒤 한두 달 두면 단맛이 오른다.',
    noteEn: 'The tubers snap easily, so dig wide around them — stored a month or two after digging, they grow sweeter.',
  },
  choseokjam: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 2 }, harvestBy: 'dig',
    noteKo: '물을 적게 자주 준다 — 골뱅이 모양 작은 덩이를 흙에서 하나씩 줍는 일이 많다.',
    noteEn: 'Water little and often — digging means picking the little snail-shaped tubers out of the soil one by one.',
  },
  jerusalem: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 3 }, harvestBy: 'dig',
    vines: true,
    noteKo: '거의 방치해도 자란다 — 비료가 많으면 잎만 무성하다. 키 큰 줄기를 베고 넓게 퍼진 덩이를 판다.',
    noteEn: 'It grows almost untended — over-fed it is all leaf. Cut the tall stems, then dig out the far-spreading tubers.',
  },
  ginger: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'rot' }, feed: 'high', labor: { plant: 2, harvest: 2 }, harvestBy: 'dig',
    forkSpears: true,
    noteKo: '사나흘에 한 번 물을 주되 고이면 썩는다 — 짚을 덮어 마름을 막는다. 상처 난 덩이는 저장하지 못한다.',
    noteEn: 'Water every three or four days but never let it pool — straw mulch keeps it from drying. Damaged rhizomes will not store.',
  },
  turmeric: {
    water: { band: [0.5, 0.95], amount: 'deep', over: 'rot' }, feed: 'mid', labor: { plant: 2, harvest: 3 }, harvestBy: 'dig',
    forkSpears: true, vines: true,
    noteKo: '생강과처럼 고이면 썩는다 — 서리로 잎이 마르면 줄기를 베고 덩이를 통째로 파 올린다.',
    noteEn: 'Like ginger it rots in standing water — when frost browns the leaves, cut the stems and lift the rhizomes whole.',
  },
  barley: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'leggy' }, feed: 'mid', labor: { plant: 1, harvest: 3 }, harvestBy: 'cut',
    process: { first: 'cut', dryDays: 4, last: 'thresh', winnow: true, shatterDays: 10 }, timing: { best: [10], off: 'cold' },
    noteKo: '이삭이 팬 뒤 35~40일 맑은 날 벤다 — 단으로 말려 도리깨로 털고 키로 까끄라기를 날린다.',
    noteEn: 'Cut on a fine day 35–40 days after heading — dry the sheaves, thresh with a flail and winnow out the awns.',
  },
  soybean: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 3 }, harvestBy: 'cut',
    process: { first: 'cut', dryDays: 3, last: 'thresh', winnow: true, shatterDays: 7 },
    noteKo: '꼬투리가 누렇게 마르면 벤다 — 늦으면 꼬투리가 터져 콩이 쏟아진다. 베어 2~3일 말려 턴다.',
    noteEn: 'Cut when the pods dry yellow — wait too long and they split, spilling the beans. Dry two or three days, then thresh.',
  },
  peanut: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 2 }, harvestBy: 'dig',
    process: { first: 'dig', dryDays: 5, last: 'pick' },
    noteKo: '석회가 없으면 빈 꼬투리가 든다 — 쇠스랑으로 포기째 들어 밭에서 말린 뒤 꼬투리를 딴다.',
    noteEn: 'Without lime the pods come up empty — lift whole plants with a fork, dry them in the field, then pick the pods.',
  },
  cowpea: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'low', labor: { plant: 1, harvest: 2 }, harvestBy: 'pick',
    noteKo: '꽃이 한꺼번에 피지 않아 마르는 꼬투리를 여러 번 나눠 딴다 — 늦으면 터진다.',
    noteEn: 'It flowers a little at a time, so pick the drying pods over several passes — left too long they burst.',
  },
  deulkkae: {
    water: { band: [0.35, 0.8], amount: 'normal', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 3 }, harvestBy: 'cut',
    process: { first: 'cut', dryDays: 7, last: 'thresh', winnow: true, shatterDays: 4 }, selfSeeds: true,
    noteKo: '꼬투리 60~80%가 갈색일 때 이슬이 마른 뒤 벤다 — 단으로 세워 일주일 말려 털고 키로 검불을 날린다.',
    noteEn: 'Cut once 60–80% of the pods are brown and the dew has dried — stand the bundles a week, thresh, then winnow out the chaff.',
  },
  chamkkae: {
    water: { band: [0.2, 0.6], amount: 'light', over: 'rot' }, feed: 'mid', labor: { plant: 1, harvest: 3 }, harvestBy: 'cut',
    process: { first: 'cut', dryDays: 10, last: 'thresh', winnow: true, shatterDays: 3 }, timing: { best: [5], off: 'short' }, selfSeeds: true,
    noteKo: '아래 꼬투리가 벌어지기 시작하면 벤다 — 세워 말린 뒤 거꾸로 들고 두세 번 나눠 턴다. 늦으면 깨가 쏟아진다.',
    noteEn: 'Cut when the lowest pods start to open — stand them to dry, then hold them upside down and shake them out in two or three goes. Too late and the seed spills.',
  },
};
