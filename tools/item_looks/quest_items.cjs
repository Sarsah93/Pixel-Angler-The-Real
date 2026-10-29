/**
 * @file quest_items.cjs
 * @description 286차 — 개인 퀘스트 물건(core `QUEST_ITEMS` — 233차) 4종. 16px 손그림(`px:it_photo` · `qi_sample` · `it_wood` · `qi_stone`)을
 *  가방 칸(48 ~ 64px)에 3 ~ 4배로 키워 쓰던 것을 그림으로 바꾼다(사용자 「픽셀레이트가 낮은 … 미개정 부분 점검」).
 *  아이템 id로 잇는다(`ITEM_IMAGE_BY_ID`) — 같은 16px 키를 쓰는 다른 물건은 그대로.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/quest_items.cjs --out <폴더>` → `--install` → `node tools/item_cards.cjs`.
 */
'use strict';

const REF = ['food assets/tackle/it_krill_block.png', 'food assets/items/cigarette_pack.png', 'food assets/tackle/pack_ragworm.png'];
const item = (id, file, nameKo, nameEn, look) => ({ ids: [id], file, nameKo, nameEn, aspect: '1:1', refs: REF, look });

module.exports = {
  item_qi_cleanup_photo: item('qi_cleanup_photo', 'qi_cleanup_photo.png', '물에 젖은 단체사진', 'Water-Stained Group Photo',
    '바닷물에 젖어 가장자리가 울고 색이 번진 낡은 인화 사진 한 장 — 흰 테두리 안에 방파제 앞에 줄지어 선 사람 여럿이 작고 흐릿하게 보인다(얼굴은 알아볼 수 없다). '
    + '한쪽 모서리가 접혀 있고 물얼룩이 번졌다. 글자 · 날짜 없음. 비스듬히 위에서 본 모습.'),
  item_qi_tide_sample: item('qi_tide_sample', 'qi_tide_sample.png', '조간대 표본', 'Tideline Sample',
    '코르크 마개를 끼운 작은 유리 표본병 하나 — 안에 바닷물과 작은 고둥 껍데기 하나, 초록 해초 한 가닥, 모래가 담겨 있고, 병목에 흰 종이 꼬리표를 노끈으로 묶었다(꼬리표에 글자 없음). 세워 놓고 비스듬히 위에서 본 모습.'),
  item_qi_bamboo_piece: item('qi_bamboo_piece', 'qi_bamboo_piece.png', '쓸 만한 대나무 토막', 'Usable Length of Bamboo',
    '마디가 두 개 있는 곧은 대나무 토막 하나를 비스듬히 눕혀 놓았다 — 연한 황록빛 겉껍질에 마디가 또렷하고, 양 끝은 톱으로 깨끗하게 잘려 속이 빈 단면이 보인다. 단독 · 글자 없음.'),
  item_qi_sinker_stone: item('qi_sinker_stone', 'qi_sinker_stone.png', '봉돌감 돌', 'Sinker Stone',
    '갯가에서 주운 매끈하고 납작한 회색 조약돌 하나 — 손바닥에 들어갈 크기, 가운데가 살짝 오목하고 하얀 줄무늬가 한 줄 지나간다. 봉돌로 깎아 쓰기 좋은 모양. 단독 · 글자 없음.'),
};
