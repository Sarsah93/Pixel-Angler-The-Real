/**
 * @file talk.cjs
 * @description 286차 — 대본(주고받는 장면)에서 건네받는 물건. 1종.
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/talk.cjs --out <폴더>`
 *  · 설치 `--install` → `food assets/items/<파일>` → `node tools/item_cards.cjs`.
 *
 *  - 담배 한 갑(`inv_cigarette_pack`) — N01-5 「해녀의 딸」에서 바람이 「내가 신뢰하는 사람에겐 담배 한 갑도 곧바로 줄 수 있다네」 하며 건넨다.
 *    실제 상표를 흉내 내지 않는다 — 무늬 없는 무지 종이갑(상표 · 글자 · 경고 문구 없음).
 */
'use strict';

/** 화풍 참고(ROOT 기준) — 포장된 작은 물건 */
const REF_PACK = ['food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png', 'food assets/tackle/it_krill_box.png'];

const item = (id, file, nameKo, nameEn, aspect, refs, look, opt = {}) => ({ ids: [id], file, nameKo, nameEn, aspect, refs, look, ...opt });

module.exports = {
  item_cigarette_pack: item('inv_cigarette_pack', 'cigarette_pack.png', '담배 한 갑', 'A pack of cigarettes', '3:4', REF_PACK,
    '뚜껑을 반쯤 젖힌 종이 담배갑 하나. 갑은 무늬 없는 짙은 남색 종이에 윗부분만 흰 띠가 둘러져 있고, 열린 뚜껑 사이로 주황빛 필터 담배 몇 개비 끝이 가지런히 보인다. '
    + '모서리가 살짝 닳고 구겨져 주머니에 넣고 다니던 티가 난다. 상표 · 로고 · 글자 · 경고 문구 · 그림 없음 — 종이갑과 담배만. 세워 놓고 비스듬히 위에서 본 모습.'),
};
