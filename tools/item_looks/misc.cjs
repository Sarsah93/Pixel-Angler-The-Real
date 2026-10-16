/**
 * @file misc.cjs
 * @description 255차 — 위키 아이템 목록 밖에 있던 코드 그림 7종(제작 결과물 · 이야기 물건 · 가방 칸 그림자).
 *  위키 아이템 탭에는 없지만 가방 · 제작 창 · 일지 보상 칸에 뜬다. 생김새만 적어 둔다 —
 *  원본(`food assets/items/<파일>`)이 생기기 전까지는 `item_cards.cjs`가 이 항목을 싣지 않으므로 코드 그림이 그대로 나온다.
 *  생성: NODE_USE_ENV_PROXY=1 node tools/gemini_item_art.cjs --looks tools/item_looks/misc.cjs --out <폴더>
 */
'use strict';

const REF_PACK = ['food assets/tackle/it_krill_block.png', 'food assets/tackle/pack_ragworm.png', 'food assets/tackle/it_krill_box.png'];
const REF_BAG = ['food assets/tackle/it_bakkan_danax.png', 'food assets/tackle/it_krill_box.png', 'food assets/tackle/it_spinning_reel.png'];
const REF_METAL = ['food assets/tackle/it_spinning_reel.png', 'food assets/tackle/it_swivel_v2.png', 'food assets/tackle/it_bakkan_danax.png'];

module.exports = {
  art_rig_card: { file: 'rig_card.png', nameKo: '수제 묶음 채비', nameEn: 'Hand-tied rig', aspect: '3:4', refs: REF_METAL, keepWhite: true,
    look: '손으로 묶은 낚시 채비 한 벌을 감아 둔 채비 감개 하나 — 손바닥만 한 연한 나무색 판지 감개(양끝이 오목하게 파인 납작한 판)에 '
      + '투명한 목줄이 여러 번 감겨 있고, 한쪽 끝에 작은 금빛 바늘 하나와 검은 도래 하나, 붉은 구슬 한 알이 매달려 있다. 글자 없음.' },
  art_backpack_rough: { file: 'backpack_rough.png', nameKo: '간이 백팩', nameEn: 'Rough backpack', aspect: '1:1', refs: REF_BAG,
    look: '손으로 만든 간이 백팩 하나 — 거친 황토색 무명천 자루를 굵은 노끈으로 여미고, 노끈 어깨끈 두 줄, 덧댄 천 조각과 굵은 바늘땀이 보인다. '
      + '비스듬히 앞에서 본 모습. 공장 제품처럼 반듯하지 않고 투박하다.' },
  art_backpack: { file: 'backpack.png', nameKo: '가방', nameEn: 'Backpack', aspect: '1:1', refs: REF_BAG,
    look: '평범한 등산용 배낭 하나 — 짙은 남색 몸통, 위 덮개와 앞주머니 하나, 회색 어깨끈 두 줄. 비스듬히 앞에서 본 모습. 로고 · 글자 없음.' },
  art_wet_photo: { file: 'wet_photo.png', nameKo: '물에 젖은 단체사진', nameEn: 'Water-stained group photo', aspect: '4:3', refs: REF_PACK, keepWhite: true,
    look: '바닷물에 젖은 단체사진 한 장 — 흰 테두리 인화지가 물에 불어 모서리가 말려 있고, 사진 속에는 갯바위 앞에 선 사람 여럿(얼굴은 알아볼 수 없을 만큼 번졌다), '
      + '얼룩진 물자국과 번진 색. 비스듬히 위에서 본 모습. 글자 없음.' },
  art_tide_sample: { file: 'tide_sample.png', nameKo: '조간대 표본', nameEn: 'Tideline sample', aspect: '3:4', refs: REF_PACK,
    look: '조간대 표본을 담은 작은 투명 플라스틱 채집병 하나 — 파란 돌림 뚜껑, 안에 바닷물과 작은 조개껍데기 · 해초 한 가닥 · 모래가 들어 있다. '
      + '병 옆에 흰 이름표 띠(글자 없음).' },
  art_bamboo_piece: { file: 'bamboo_piece.png', nameKo: '쓸 만한 대나무 토막', nameEn: 'Usable length of bamboo', aspect: '4:3', refs: REF_BAG,
    look: '갯가에서 주운 대나무 토막 하나 — 팔 길이쯤 되는 곧은 마른 대나무 한 대, 마디가 서너 개, 한쪽 끝은 비스듬히 잘렸다. 바닷바람에 바래 누르스름하다. 비스듬히 눕혀 놓은 모습.' },
  art_sinker_stone: { file: 'sinker_stone.png', nameKo: '봉돌감 돌', nameEn: 'Sinker stone', aspect: '1:1', refs: REF_METAL,
    look: '봉돌로 쓸 만한 매끈한 갯돌 하나 — 달걀만 한 납작하고 둥근 짙은 회색 돌, 물에 닳아 반들반들하고 허리에 가는 흰 줄무늬 하나. 비스듬히 위에서 본 모습.' },
};
