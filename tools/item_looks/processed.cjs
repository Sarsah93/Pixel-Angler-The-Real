/**
 * @file processed.cjs
 * @description 295차 — 지역 가공품 다섯(과메기 · 명이 장아찌 · 오징어순대 · 대구포 · 반건조 옥돔 — core `rules/RegionalProcessing.ts` `PROCESSED_ITEMS`).
 *  생성 `NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/processed.cjs --out <폴더>`
 *  · 설치 `--install` → `food assets/items/<파일>` → `node tools/item_cards.cjs`.
 */
'use strict';

const REF_FOOD = ['packages/client-pc/public/food/stew_red_whole.png', 'food assets/crops/asis/crop_strawberry.png', 'food assets/tackle/it_krill_block.png'];
const REF_FISH = ['food assets/fish/saury.png', 'food assets/fish/pacific_cod.png', 'food assets/tackle/it_krill_block.png'];
const REF_JAR = ['food assets/items/oil_sesame_350.png', 'food assets/crops/asis/crop_lettuce.png', 'food assets/tackle/it_krill_block.png'];

const item = (id, file, nameKo, nameEn, aspect, refs, look, opt = {}) => ({ ids: [id], file, nameKo, nameEn, aspect, refs, look, ...opt });

module.exports = {
  item_proc_gwamegi: item('proc_gwamegi', 'proc_gwamegi.png', '과메기 (1마리)', 'Gwamegi, half-dried saury', '16:9', REF_FISH,
    '반으로 갈라 펼쳐 말린 꽁치 과메기 한 마리를 비스듬히 위에서 본 모습. 살은 짙은 적갈색에 기름이 돌아 윤기가 나고, 가장자리는 더 짙게 말랐으며 가운데 등뼈 자국이 길게 보인다. 껍질 쪽은 검푸른 은빛. 접시 · 바구니 없이 그것만, 순백색 배경.'),
  item_proc_myeongi_jangajji: item('proc_myeongi_jangajji', 'proc_myeongi_jangajji.png', '명이 장아찌 (1통)', 'Pickled alpine leek, a tub', '4:3', REF_JAR,
    '투명한 네모난 플라스틱 반찬통에 담긴 명이(산마늘) 장아찌. 넓고 길쭉한 짙은 올리브색 잎들이 간장 빛 갈색 장물에 잠겨 겹겹이 차 있고, 뚜껑은 흰색. 라벨 · 글자 없음. 통만, 순백색 배경.'),
  item_proc_squid_sundae: item('proc_squid_sundae', 'proc_squid_sundae.png', '오징어순대 (1마리)', 'Squid sundae', '16:9', REF_FOOD,
    '속을 채워 쪄 낸 오징어순대 한 마리를 비스듬히 위에서 본 모습. 통통한 흰 오징어 몸통 안에 두부 · 당면 · 당근 · 부추 다진 속이 가득 차 끝이 비치고, 머리 쪽은 이쑤시개로 막았다. 겉은 연한 분홍빛이 도는 흰색으로 반질하다. 접시 없이 그것만, 순백색 배경.'),
  item_proc_daegupo: item('proc_daegupo', 'proc_daegupo.png', '대구포 (1장)', 'Dried cod, a sheet', '16:9', REF_FISH,
    '등 쪽으로 갈라 넓게 펼쳐 말린 대구포 한 장을 위에서 본 모습. 살은 연한 황백색으로 바싹 말라 결이 갈라져 보이고, 가운데 등뼈와 가시 자국이 좌우로 퍼지며, 꼬리가 붙어 있다. 가장자리는 조금 누렇다. 접시 없이 그것만, 순백색 배경.'),
  item_proc_dried_tilefish: item('proc_dried_tilefish', 'proc_dried_tilefish.png', '반건조 옥돔 (1마리)', 'Half-dried red tilefish', '16:9', REF_FISH,
    '등 쪽으로 갈라 펼친 반건조 옥돔 한 마리를 위에서 본 모습. 살은 희고 촉촉하게 굵은 소금 알갱이가 흩어져 있으며, 바깥 껍질은 붉은 주홍빛에 노란 줄무늬, 머리는 네모지고 꼬리지느러미에 노란 줄. 접시 없이 그것만, 순백색 배경.'),
};
