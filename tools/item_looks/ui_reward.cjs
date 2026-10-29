/**
 * @file ui_reward.cjs
 * @description 286차 — 일지 보상 카드 아이콘 6종(경험치 · 재화 · 평판 · 자격 · 기술 · 상점). 16px 손그림(`rw_*`)을 대신한다.
 *  사용자 「일지에 표시되는 '보상'의 '경험치' 아이콘 모양이 너무 이상해. 퀄리티 좋은 걸로 바꿔줘」.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/ui_reward.cjs --out <폴더>`
 *  · 설치 `--install` → `food assets/items/<파일>` → `node tools/item_cards.cjs`(→ `ITEM_IMAGE_BY_PX['px:rw_*']`).
 *  화면에서는 `ui/PixelIcon.addPixelIcon`이 24px 이상이면 이 그림을, 그보다 작으면 16px 손그림을 쓴다.
 *  글자 · 숫자 · 기호 문자(XP · ₩ 등)를 넣지 않는다(UI 텍스트 장식 금지 — AGENTS §4).
 */
'use strict';

/** 화풍 참고(ROOT 기준) — 작은 물건 아이콘 */
const REF = ['food assets/tackle/it_krill_block.png', 'food assets/items/cigarette_pack.png', 'food assets/tackle/pack_ragworm.png'];

const icon = (key, file, nameKo, nameEn, look) => ({ px: [`px:${key}`], file, nameKo, nameEn, aspect: '1:1', refs: REF, look });

module.exports = {
  item_rw_xp: icon('rw_xp', 'rw_xp.png', '경험치', 'Experience',
    '게임 보상 아이콘 하나: 반짝이는 금빛 오각 별 하나가 가운데 있고, 별 아래에서 위로 솟는 굵은 초록 화살표 하나가 별 뒤를 받친다(올라간다는 뜻). '
    + '별 둘레에 작은 반짝임 점 두세 개. 정면에서 본 평평한 아이콘 모양 · 굵고 또렷한 윤곽 · 작게 줄여도 읽히는 단순한 형태. 글자 · 숫자 · 기호 없음.'),
  item_rw_coin: icon('rw_coin', 'rw_coin.png', '재화', 'Money',
    '게임 보상 아이콘 하나: 연둣빛 종이 지폐 서너 장을 반으로 접어 갈색 고무줄로 묶은 돈다발과, 그 앞에 기댄 금빛 동전 두 개. '
    + '지폐에는 무늬만 흐릿하게 있고 글자 · 숫자 · 인물 얼굴 없음. 비스듬히 위에서 본 모습 · 굵고 또렷한 윤곽.'),
  item_rw_rep: icon('rw_rep', 'rw_rep.png', '평판', 'Reputation',
    '게임 보상 아이콘 하나: 서로 맞잡은 두 손(악수) — 한 손은 볕에 그은 어부의 손, 다른 손은 조금 밝은 손, 두 소매는 남색 작업복과 주황 우비. '
    + '정면에서 본 단순한 아이콘 모양 · 굵고 또렷한 윤곽 · 작게 줄여도 악수로 읽히게. 글자 없음.'),
  item_rw_license: icon('rw_license', 'rw_license.png', '자격', 'License',
    '게임 보상 아이콘 하나: 크림색 두꺼운 종이 증서 한 장(모서리가 조금 말려 있다)에 줄글처럼 보이는 가는 회색 선 몇 줄과, 오른쪽 아래에 찍힌 둥근 붉은 도장 하나. '
    + '줄은 글자가 아니라 선이다 — 읽히는 글자 · 숫자 없음. 비스듬히 위에서 본 모습 · 굵고 또렷한 윤곽.'),
  item_rw_skill: icon('rw_skill', 'rw_skill.png', '기술', 'Skill',
    '게임 보상 아이콘 하나: 푸른 강철빛 톱니바퀴 하나와 그 위에 겹친 금빛 낚싯바늘 하나, 맞닿은 곳에 작은 하얀 반짝임. '
    + '솜씨 · 기술이 늘었다는 느낌. 정면에서 본 단순한 아이콘 모양 · 굵고 또렷한 윤곽 · 글자 없음.'),
  item_rw_shop: icon('rw_shop', 'rw_shop.png', '상점 품목', 'Shop items',
    '게임 보상 아이콘 하나: 빨강 · 흰 줄무늬 차양을 단 작은 항구 가게 정면 — 나무 진열대에 생선 상자와 바구니가 놓여 있다. '
    + '간판 · 글자 · 숫자 없음. 정면에서 본 단순한 아이콘 모양 · 굵고 또렷한 윤곽.'),
};
