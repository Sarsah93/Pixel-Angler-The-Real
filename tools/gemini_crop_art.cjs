/**
 * @file gemini_crop_art.cjs
 * @description 244차 — 작물 초상을 Gemini 그림 모델로 그린다(사진 없이 「생김새 설명 + 화풍 참고 그림」).
 *
 *  키는 환경의 네트워크 시크릿(호스트 `generativelanguage.googleapis.com` · 헤더 `x-goog-api-key`)을
 *  에이전트 프록시가 붙인다 — 이 스크립트 · 저장소에는 키가 없다.
 *  ⚠ Node 내장 fetch는 HTTPS_PROXY를 읽지 않는다 — 반드시 `NODE_USE_ENV_PROXY=1`로 돌린다(Node ≥ 22.21).
 *    빼먹으면 프록시를 건너뛰어 403 「unregistered callers」가 난다(2026-10-14 실측).
 *
 *  사용:
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_crop_art.cjs --out <폴더> [--only crop_a,crop_b] [--set main|extra|pack|byproduct|bag|all]
 *        [--model gemini-nano-banana-2.1] [--jobs 3] [--tries 4] [--tag v2] [--force] [--dry]
 *    결과: <폴더>/<id>[.<tag>].png(PNG32 — JPEG 응답을 ImageMagick `convert`로 바꾼다) + <폴더>/_log.jsonl(모델 · 토큰 · 시간)
 *    검수 뒤 `--install`(고른 판은 `<id>.png` 이름으로 둔다)이 긴 변 640px PNG로 `food assets/crops/asis/`에 넣고,
 *    `node tools/pixelize_crops.cjs`를 돌린다. 640px 원본의 초상은 1,024px 원본의 것과 사실상 같다(244 실측 corr 0.99 · IoU 0.99~1)
 *    — 저장소에 넣는 원본 용량을 절반으로 줄인다.
 *
 *  화풍 참고 그림 = 사용자가 Gemini 앱으로 변환한 기존 초상 3장(딸기 · 청치마 · 감자 — `asis/`).
 *  그림 한 장 = 수확물 한 단위(가방 칸 하나)다 — 「한 줌」은 한 줌, 「(1개)」는 한 개, 「1kg」은 서너 개 무더기.
 *  생김새 설명(LOOKS)은 수확물 기본 id 기준이고, 이름 · 단위는 core 작물 DB에서 읽는다.
 *  284차 — `--set byproduct`(먹는 부산물 — 무청 · 배추 겉잎 · 토란대 · 깻순) · `--set bag`(낟알 봉지 — 용기가 그림의 일부 ·
 *   낱알 초상을 「담을 내용물」로 함께 보낸다 — `CONTENT_REF`).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ASIS = path.join(ROOT, 'food assets', 'crops', 'asis');
const PUBLIC_CROPS = path.join(ROOT, 'packages', 'client-pc', 'public', 'crops');
const REFS = ['crop_strawberry', 'crop_lettuce', 'crop_potato'];
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

/** 수확물 기본 id → 그림에 담을 생김새(모델이 모를 수 있는 우리 작물은 모양을 구체적으로) */
const LOOKS = {
  // ── 본 수확물 72 ──
  crop_bean_sprout: '노란 콩 머리가 달린 길고 흰 줄기의 콩나물 한 줌. 가는 뿌리 꼬리가 아래로 늘어진다.',
  crop_mung_sprout: '작은 연둣빛 떡잎 머리에 통통하고 짧은 흰 줄기의 숙주나물 한 줌. 콩나물보다 짧고 굵다.',
  crop_microgreens: '무순 · 브로콜리 · 적양배추 새싹을 섞은 한 줌. 가는 흰색 · 보라색 줄기 끝에 작은 하트 모양 떡잎 두 장씩.',
  crop_oyster_mushroom: '회갈색 부채꼴 갓이 여러 겹 겹쳐 핀 느타리버섯 한 송이. 갓 아래 흰 주름과 한데 붙은 흰 밑동이 보인다.',
  crop_perilla: '둥근 하트 모양에 가장자리 톱니가 있는 짙은 초록 깻잎 20장을 차곡차곡 겹친 묶음. 잎자루가 한쪽으로 모인다.',
  crop_spinach: '짙은 초록 주걱 모양 잎과 분홍빛 붉은 뿌리 밑동의 시금치 한 단. 밑동을 끈으로 묶었다.',
  crop_crown_daisy: '깃털처럼 깊게 갈라진 연초록 잎과 가는 줄기의 쑥갓 한 줌.',
  crop_young_radish: '긴 초록 잎에 손가락 굵기의 작고 흰 뿌리가 달린 어린 무(열무) 한 단. 가운데를 끈으로 묶었다.',
  crop_ugeolgari: '속이 차지 않은 어린 배추(얼갈이) 한 단. 넓고 주름진 연초록 잎과 흰 잎줄기, 끈으로 묶었다.',
  crop_chive: '가늘고 납작한 긴 초록 잎이 곧게 모인 부추 한 단. 밑동은 흰빛, 끈으로 묶었다.',
  crop_scallion: '가는 원통형 초록 잎 아래 작은 흰 알뿌리와 잔뿌리가 달린 쪽파 한 단. 끈으로 묶었다.',
  crop_water_parsley: '길고 마디진 연초록 줄기 끝에 톱니 있는 작은 잎이 달린 미나리 한 줌.',
  crop_mallow: '손바닥처럼 얕게 갈라진 둥근 잎(가장자리 물결)과 긴 잎자루의 아욱 한 단.',
  crop_chard: '넓고 윤기 나는 짙은 초록 잎과 굵은 흰 잎줄기의 근대 한 단.',
  crop_godeulppaegi: '가장자리가 들쭉날쭉한 길쭉한 잎(자줏빛이 도는 초록)과 흰 뿌리가 달린 고들빼기 한 단.',
  crop_bangpung: '세 갈래로 갈라지고 가장자리 톱니가 있는 두껍고 윤기 나는 청록색 잎과 자줏빛 잎자루의 방풍나물 한 단.',
  crop_gomchwi: '크고 둥근 하트 모양 잎(가장자리 톱니)에 긴 잎자루가 달린 짙은 초록 곰취 잎 묶음.',
  crop_myeongi: '넓은 타원형의 매끈한 초록 잎(은방울꽃 잎처럼)과 아래쪽 자줏빛 잎자루의 산마늘(명이) 잎 묶음.',
  crop_samnamul: '붉은 갈색의 연한 줄기 끝에 깃꼴로 접힌 작은 잎이 모인 눈개승마(삼나물) 어린순 묶음.',
  crop_eosuri: '깃꼴로 크게 갈라진 넓은 잎(셀러리 잎과 비슷)과 연초록 잎자루의 어수리 나물 묶음.',
  crop_bujigaengi: '긴 타원형 잎 가장자리에 굵은 톱니가 있는 연초록 부지깽이(섬쑥부쟁이) 나물 묶음.',
  crop_dureup: '굵은 연초록 두릅 새순 여러 개를 묶은 다발. 아래는 갈색 비늘 껍질, 위로 연한 잎이 막 펼쳐지려 한다.',
  crop_wasabi_root: '울퉁불퉁한 마디 자국이 있는 초록 원통형 고추냉이 뿌리줄기 하나. 위쪽에 잘린 잎자루 흔적.',
  crop_chili_green: '윤기 나는 초록 풋고추 하나. 꼭지가 달렸고 살짝 휘었다.',
  crop_cherry_tomato: '빨간 방울토마토 한 알. 초록 별 모양 꼭지.',
  crop_cucumber: '길쭉한 연초록 오이(백다다기) 하나. 표면에 작은 돌기, 한쪽 끝은 더 진한 초록.',
  crop_zucchini: '연한 초록의 매끈한 원통형 애호박 하나. 꼭지가 달렸다.',
  crop_eggplant: '길쭉하고 윤기 나는 짙은 보라색 가지 하나. 초록 꼭지.',
  crop_corn: '연초록 껍질을 반쯤 벗긴 찰옥수수 한 자루. 흰 알과 보라 알이 섞였고 갈색 수염이 달렸다.',
  crop_bitter_melon: '울퉁불퉁한 혹이 많은 초록 여주 하나. 양 끝이 뾰족한 방추형.',
  crop_okra: '각진 초록 꼬투리 열 개를 모은 오크라 한 줌.',
  crop_sweet_potato: '붉은 자주색 껍질의 방추형 고구마 서너 개를 모은 무더기.',
  crop_radish: '굵고 통통한 흰 조선무 하나. 윗부분은 연초록, 잎은 짧게 잘렸다.',
  crop_napa_cabbage: '속이 꽉 찬 길쭉한 배추 한 통. 바깥 잎은 진초록, 밑동은 흰색.',
  crop_carrot: '주황색 당근 하나. 위에 짧게 남긴 초록 잎.',
  crop_garlic: '흰 껍질에 자줏빛 줄이 있는 통마늘 한 통. 밑에 잔뿌리.',
  crop_onion: '황갈색 껍질의 둥근 양파 하나.',
  crop_leek: '굵고 긴 대파 한 대를 비스듬히 놓은 모습. 엄지손가락 굵기의 흰 줄기가 전체 길이의 절반쯤 이어지고 밑에 잔뿌리, 위로 진초록 원통 잎이 갈라진다. 쪽파보다 훨씬 굵다.',   // 1차는 쪽파처럼 가늘었다
  crop_taro: '갈색 털 같은 껍질에 둥근 고리 무늬가 있는 동그란 토란 알 여러 개를 모은 무더기.',
  crop_yacon: '고구마처럼 생긴 연갈색 길쭉한 야콘 덩이뿌리 서너 개.',
  crop_choseokjam: '마디가 잘록잘록한 작고 흰 누에 모양의 초석잠 덩이줄기 여러 개를 모은 무더기.',
  crop_jerusalem: '생강처럼 울퉁불퉁한 연갈색 · 자줏빛 돼지감자 덩이줄기 여러 개를 모은 무더기.',
  crop_ginger: '손가락처럼 갈라진 연한 황갈색 생강 뿌리줄기 두 덩이.',
  crop_barley: '껍질 벗긴 황금빛 보리 낟알이 소복이 쌓인 작은 더미.',
  crop_soybean: '노란 백태 콩알이 소복이 쌓인 작은 더미.',
  // 247차 — 깨(베고 말려 털고 키질한 씨) — 알 모양 · 색이 서로 다르다(들깨 = 둥글고 굵은 회갈색 · 참깨 = 납작한 물방울 아이보리)
  crop_deulkkae: '작고 둥근 회갈색 · 짙은 갈색 들깨 알갱이가 소복이 쌓인 작은 더미. 알은 지름 2mm 안팎으로 둥글고 겉에 가는 그물 무늬가 있다. 깻잎 · 줄기 없이 씨만.',
  crop_chamkkae: '작고 납작한 물방울 모양의 아이보리 · 연한 노란빛 참깨 알갱이가 소복이 쌓인 작은 더미. 알은 들깨보다 작고 납작하며 은은한 윤기가 난다. 꼬투리 없이 씨만.',
  crop_gondre: '긴 타원형 잎(가장자리 가는 가시 톱니)과 연한 줄기의 곤드레(고려엉겅퀴) 나물 묶음.',
  crop_danggui: '세 갈래로 갈라진 겹잎에 톱니가 있는 윤기 나는 짙은 초록 당귀 잎과 자줏빛 잎자루 묶음.',
  crop_kangkong: '속이 빈 긴 연초록 줄기와 화살촉 모양 잎의 공심채 한 단.',
  crop_arugula: '가장자리가 깊게 갈라진 짙은 초록 루꼴라 잎을 한 줌 모은 모습. 봉지 · 포장 없이 잎만.',   // 「한 봉」을 봉지로 그렸다(244 1차)
  crop_myoga: '분홍빛 자줏색 비늘잎이 겹겹이 싼 통통한 양하 꽃봉오리 여러 개.',
  crop_gourd: '연초록의 매끈하고 둥근 어린 박 하나. 짧은 꼭지.',
  crop_turnip: '윗부분은 진한 보랏빛, 아래는 흰 팽이 모양의 강화순무 하나. 잎은 짧게 잘렸고 가는 꼬리뿌리.',
  crop_banga: '깻잎보다 작은 하트 모양 톱니 잎이 달린 연초록 방아(배초향) 줄기 한 줌.',
  crop_shiso: '짙은 자주색 깻잎 모양 잎(가장자리 톱니 · 주름) 20장을 겹친 차조기잎 묶음.',
  crop_chopi: '작고 둥근 초피 열매가 송이로 달린 한 줌. 초록과 붉은빛이 섞였고 표면이 오톨도톨하다.',
  crop_dill: '실처럼 가늘게 갈라진 깃털 모양 연초록 잎의 딜 묶음.',
  crop_fennel: '흰빛 연둣빛의 둥근 펜넬 구근 하나. 위로 짧게 자른 줄기와 깃털 같은 잎 조금.',
  crop_basil: '윤기 나는 볼록한 타원형 초록 잎이 마주 달린 바질 줄기 한 줌.',
  crop_lions_mane: '흰 털 뭉치 같은 둥근 노루궁뎅이 버섯 한 송이. 아래로 늘어진 가는 가시가 빽빽하다.',
  crop_wood_ear: '귀 모양으로 주름진 반투명 갈색 생목이버섯 한 장.',
  crop_cowpea: '가늘고 긴 초록 동부 콩꼬투리 여러 개를 모은 한 줌.',
  crop_amaranth: '둥근 마름모꼴 연초록 잎과 연한 줄기의 비름나물 한 줌.',
  crop_eomnamu: '손바닥 모양으로 펼쳐지는 연초록 엄나무 새순 여러 개. 줄기에 작은 가시, 밑동에 갈색 비늘.',
  crop_meowi: '둥근 콩팥 모양의 큰 잎과 긴 연초록 · 붉은빛 잎자루의 머위 묶음.',
  crop_turmeric: '생강처럼 생긴 갈색 울금 뿌리줄기 몇 덩이. 하나는 잘려서 선명한 주황색 속살이 보인다.',
  crop_korean_melon: '샛노란 껍질에 흰 세로 줄무늬가 있는 타원형 참외 하나.',
  crop_watermelon: '진초록 바탕에 검푸른 물결 줄무늬가 있는 둥근 수박 한 통. 짧은 꼭지.',
  crop_blueberry: '분이 하얗게 낀 남보라색 블루베리 한 알. 위에 별 모양 꽃받침 자국.',
  crop_tomato: '빨갛게 익은 둥근 토마토 서너 개를 모은 무더기. 초록 꼭지.',
  crop_stevia_tomato: '길쭉한 대추 모양의 작고 빨간 토마토(대추방울토마토) 열 개 남짓을 모은 무더기.',
  crop_pumpkin_sweet_potato: '붉은 자주색 껍질의 통통한 호박고구마 서너 개. 하나는 잘려서 진한 주황색 속이 보인다.',
  crop_cheongyang: '작고 가는 짙은 초록 청양고추 하나. 꼭지가 달렸다.',
  // ── 중간 · 익은 뒤 수확물 8 ──
  crop_wasabi_leaf: '둥근 하트 모양 잎(가장자리 톱니)과 긴 잎자루의 고추냉이 잎 묶음.',
  crop_chili_red: '윤기 나는 새빨간 홍고추 하나. 초록 꼭지, 살짝 휘었다.',
  crop_pepper_leaf: '작고 갸름한 연초록 고춧잎이 달린 여린 줄기 한 줌.',
  crop_pumpkin_leaf: '손바닥만 한 둥근 호박잎(잔털 · 가장자리 얕은 갈래) 여러 장을 겹친 묶음.',
  crop_sweetpotato_stem: '자줏빛 도는 긴 고구마순 줄기를 모은 한 단. 줄기 끝에 하트 모양 잎이 조금.',
  crop_thinned_radish: '솎아 낸 어린 무 한 줌. 연초록 잎에 가는 흰 뿌리.',
  crop_thinned_cabbage: '솎아 낸 어린 배추 한 줌. 작고 연한 초록 잎에 흰 밑동.',
  crop_garlic_scape: '길고 가는 초록 마늘종을 모은 한 단. 끝에 작은 꽃봉오리 주머니.',
  // ── 팩 6(243) — 포장 용기에 담은 모습(245 — 내용물이 낱개 그림과 같은 작물로 읽히게 생김새를 함께 적는다) ──
  crop_microgreens_pack: '뚜껑 달린 낮은 투명 플라스틱 용기에 새싹채소(가는 흰색 · 보라색 줄기 끝에 작은 하트 모양 떡잎 두 장)를 가득 담은 한 팩.',
  crop_oyster_mushroom_pack: '흰 스티로폼 접시에 회갈색 부채꼴 갓의 느타리버섯 두 송이를 담고 투명 랩을 씌운 한 팩.',
  crop_cherry_tomato_pack: '뚜껑 달린 투명 플라스틱 용기에 초록 꼭지가 달린 빨간 방울토마토 스무 알 남짓을 가득 담은 한 팩.',
  crop_wood_ear_pack: '뚜껑 달린 투명 플라스틱 용기에 귀 모양으로 주름진 반투명 갈색 생목이버섯 여러 장을 담은 한 팩.',
  crop_blueberry_pack: '뚜껑 달린 작은 투명 플라스틱 용기에 분이 하얗게 낀 남보라색 블루베리를 가득 담은 한 팩.',
  crop_strawberry_pack: '투명 플라스틱 용기에 빨간 딸기 스무 개 남짓을 꼭지가 위로 오게 가지런히 담은 한 팩.',
  // ── 284차 — 먹는 부산물 4(`CropDef.byproducts` kind 'food') — 본 수확물과 헷갈리지 않게 「무엇이 없는지」를 적는다 ──
  crop_radish_greens: '무에서 잘라 낸 무청 한 묶음. 길고 거친 짙은 초록 잎(깃꼴로 깊게 갈라져 들쭉날쭉하고 잔털이 있다)이 연초록의 굵고 긴 잎줄기에 달려 있고, '
    + '잎줄기 밑동을 모아 끈으로 묶었다. 밑동은 가지런히 잘린 연초록 단면 — 흰 무 뿌리는 없다.',
  // 1차는 배추 반 통처럼 오므라진 덩어리였다 → 낱장으로 펼쳐 겹친다 · 통 · 밑동 없음
  crop_cabbage_outer: '배추 한 통에서 한 장씩 떼어 낸 겉잎 넉 장을 부채처럼 펼쳐 겹쳐 놓은 모습. 잎 한 장 한 장은 길쭉하고 끝이 둥글며, 짙은 초록에 거칠게 주름지고 가장자리가 물결친다. '
    + '잎마다 아래쪽에 넓적하고 두툼한 흰 · 연초록 잎줄기가 있고, 아래 끝은 한 장씩 떼어 낸 낱장 끝이다. '
    + '잎들이 한 덩어리로 오므라져 있지 않고 낱장으로 펼쳐져 겹친다 — 배추 통 · 노란 속잎 · 뿌리 밑동 없음.',
  crop_taro_stem: '잎을 잘라 낸 토란대(토란 잎자루) 한 묶음. 매끈하고 곧은 긴 줄기 대여섯 대 — 아래쪽은 붉은 자줏빛, 위로 갈수록 연초록이고 '
    + '잘린 끝 단면은 스펀지 같은 연초록 — 를 가운데에서 끈으로 묶었다. 넓은 토란 잎 · 둥근 토란 알 없음.',
  crop_perilla_shoot: '순지르기한 깻순 한 줌. 짧고 연한 초록 줄기 끝에 작고 여린 연두색 깻잎(둥근 하트 모양 · 가장자리 톱니 · 잔털)이 서너 장씩 오므라져 모인 새순 여러 개. '
    + '손바닥만 한 큰 깻잎 · 씨 · 꽃 없음.',
  // ── 284차 — 낟알 봉지 7(`harvest.bags`) — 같은 곡물 봉투(크라프트 지퍼 봉투 · 앞면 투명 창)에 담았다. 큰 봉지는 꽉 차 불룩, 작은 봉지는 덜 차 위가 접힌다
  //   (초상은 긴 변을 맞춰 그려지므로 크기 대신 「찬 정도 · 생김새」로 가른다). 속 낟알은 낱알 초상을 함께 보내 같은 알로 그린다(`CONTENT_REF`)
  crop_deulkkae_b500: '크라프트 종이 지퍼 곡물 봉투(위에 지퍼 입구 · 바닥이 넓어 세워진다 · 앞면 가운데에 큰 투명 직사각형 창) 작은 것 하나. '
    + '들깨 500g은 봉투의 아래 절반만 채운다 — 투명 창의 아래 절반에만 작고 둥근 회갈색 · 짙은 갈색 들깨 알(지름 2mm 안팎 · 가는 그물 무늬)이 차 있고, 창 위쪽 절반은 비어 봉투 안쪽이 들여다보인다. '
    + '빈 윗부분은 홀쭉하게 쭈글쭈글 주름져 있다(꽉 찬 큰 봉투와 한눈에 갈리게).',
  crop_deulkkae_b1000: '크라프트 종이 지퍼 곡물 봉투(위에 지퍼 입구 · 바닥이 넓어 세워진다 · 앞면 가운데에 큰 투명 직사각형 창) 큰 것 하나. '
    + '들깨 1kg이 지퍼 바로 아래까지 꽉 차서 봉투가 통통하게 불룩하고 묵직하게 서 있다. 투명 창 가득 작고 둥근 회갈색 · 짙은 갈색 들깨 알이 빽빽하다.',
  crop_chamkkae_b300: '크라프트 종이 지퍼 곡물 봉투(위에 지퍼 입구 · 바닥이 넓어 세워진다 · 앞면 가운데에 큰 투명 직사각형 창) 작은 것 하나. '
    + '참깨 300g은 봉투의 아래 절반만 채운다 — 투명 창의 아래 절반에만 작고 납작한 물방울 모양의 아이보리 · 연한 노란빛 참깨 알이 차 있고, 창 위쪽 절반은 비어 봉투 안쪽이 들여다보인다. '
    + '빈 윗부분은 홀쭉하게 쭈글쭈글 주름져 있다(꽉 찬 큰 봉투와 한눈에 갈리게).',
  crop_chamkkae_b500: '크라프트 종이 지퍼 곡물 봉투(위에 지퍼 입구 · 바닥이 넓어 세워진다 · 앞면 가운데에 큰 투명 직사각형 창) 큰 것 하나. '
    + '참깨 500g이 지퍼 바로 아래까지 꽉 차서 봉투가 통통하게 불룩하고 묵직하게 서 있다. 투명 창 가득 작고 납작한 아이보리 · 연한 노란빛 참깨 알이 빽빽하다.',
  crop_soybean_b500: '크라프트 종이 지퍼 곡물 봉투(위에 지퍼 입구 · 바닥이 넓어 세워진다 · 앞면 가운데에 큰 투명 직사각형 창) 작은 것 하나. '
    + '콩 500g은 봉투의 아래 절반만 채운다 — 투명 창의 아래 절반에만 둥글고 매끈한 연노랑 백태 콩알이 차 있고, 창 위쪽 절반은 비어 봉투 안쪽이 들여다보인다. '
    + '빈 윗부분은 홀쭉하게 쭈글쭈글 주름져 있다(꽉 찬 큰 봉투와 한눈에 갈리게).',
  crop_soybean_b1000: '크라프트 종이 지퍼 곡물 봉투(위에 지퍼 입구 · 바닥이 넓어 세워진다 · 앞면 가운데에 큰 투명 직사각형 창) 큰 것 하나. '
    + '콩 1kg이 지퍼 바로 아래까지 꽉 차서 봉투가 통통하게 불룩하고 묵직하게 서 있다. 투명 창 가득 둥글고 매끈한 연노랑 백태 콩알이 빽빽하다.',
  crop_barley_b1000: '크라프트 종이 지퍼 곡물 봉투(위에 지퍼 입구 · 바닥이 넓어 세워진다 · 앞면 가운데에 큰 투명 직사각형 창) 큰 것 하나. '
    + '보리 1kg이 지퍼 바로 아래까지 꽉 차서 봉투가 통통하게 불룩하고 묵직하게 서 있다. 투명 창 가득 껍질 벗긴 황금빛 보리 낟알(길쭉한 타원 · 가운데 세로 골)이 빽빽하다.',
};

/** 284차 — 봉지 그림에 함께 보내는 「담을 내용물」 그림(낱알 초상 — `asis/<id>.png`). 봉지 속 알을 낱알 그림과 같은 알로 그리게 한다 */
const CONTENT_REF = {
  crop_deulkkae_b500: 'crop_deulkkae', crop_deulkkae_b1000: 'crop_deulkkae',
  crop_chamkkae_b300: 'crop_chamkkae', crop_chamkkae_b500: 'crop_chamkkae',
  crop_soybean_b500: 'crop_soybean', crop_soybean_b1000: 'crop_soybean',
  crop_barley_b1000: 'crop_barley',
};

const STYLE_INTRO = '첨부한 그림 세 장은 화풍 참고용입니다. 이 그림들과 같은 픽셀 아트 화풍으로 새 그림 한 장을 그려 주세요. '
  + '같은 도트 크기, 진한 윤곽선, 밝은 하이라이트와 어두운 그늘의 단계, 선명한 색을 맞춥니다. '
  + '참고 그림 속 물체(딸기 · 상추 · 감자)는 그리지 마세요.';
// 팩은 포장 용기가 그림의 일부다 — 「접시 · 바구니 없음」 대신 「한 팩 · 비스듬히 위에서 · 라벨 없음」(245)
// 284차 — 낟알 봉지(`kind: 'bag'`)도 용기가 그림의 일부다 — 팩과 같은 생각으로 「봉지 하나 · 창 너머 낟알 · 쏟아진 알 없음」
const taskText = (it) => `그릴 것: ${it.nameKo} (${it.nameEn}). ${it.look}\n` + (it.kind === 'pack'
  ? '조건: 순백색 단색 배경. 포장한 한 팩만 화면 가운데에 크게, 비스듬히 위에서 본 모습이라 용기 속 내용물이 잘 보인다. '
    + '라벨 · 가격표 · 글자 · 바닥 그림자 · 테두리 없음. 사진이 아니라 픽셀 아트.'
  : it.kind === 'bag'
    ? '조건: 순백색 단색 배경. 낟알을 담은 봉투 하나만 화면 가운데에 크게, 비스듬히 앞 위에서 본 모습이라 봉투 앞면 투명 창 너머 낟알이 잘 보인다. '
      + '봉투 밖으로 쏟아진 낟알 · 숟가락 · 그릇 · 바닥 그림자 · 테두리 없음. 라벨 · 스티커 · 가격표 · 글자 · 숫자 · 로고 없음. 사진이 아니라 픽셀 아트.'
    : '조건: 순백색 단색 배경. 물체는 화면 가운데에 크게, 한 단위(하나 · 한 줌 · 한 묶음 · 한 무더기)만. '
      + '바닥 그림자 · 접시 · 바구니 · 글자 · 테두리 없음. 사진이 아니라 픽셀 아트.');
const CONTENT_TEXT = '마지막 그림은 이 봉투에 담을 낟알입니다(이미 게임에 있는 그림). 봉투 창 너머 알갱이를 이 그림과 같은 색 · 모양 · 크기로 그리세요. '
  + '이 낟알 더미를 봉투 밖에 따로 그리지는 마세요.';

function parseArgs(argv) {
  const P = { out: '', only: null, set: 'main', model: 'gemini-nano-banana-2.1', jobs: 3, tries: 4, tag: '', force: false, dry: false, install: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--out') P.out = v();
    else if (a === '--only') P.only = new Set(v().split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--set') P.set = v();
    else if (a === '--model') P.model = v();
    else if (a === '--jobs') P.jobs = Math.max(1, +v());
    else if (a === '--tries') P.tries = Math.max(1, +v());
    else if (a === '--tag') P.tag = v();
    else if (a === '--force') P.force = true;
    else if (a === '--dry') P.dry = true;
    else if (a === '--install') P.install = true;
  }
  if (!P.out) { console.error('--out <폴더>가 필요하다'); process.exit(1); }
  return P;
}

/** 대상 목록 — core 작물 DB의 수확물 이름 · 영어 이름(본 · 중간 · 익은 뒤 · 팩) */
async function targets(set) {
  const core = await import(path.join(ROOT, 'packages/core/dist/index.js'));
  const out = [];
  for (const c of core.CROP_DATABASE) {
    const h = c.harvest;
    if (set === 'main' || set === 'all') out.push({ id: h.itemId, nameKo: h.nameKo, nameEn: h.nameEn, kind: 'main' });
    if (set === 'extra' || set === 'all') {
      if (h.ripenTo) out.push({ id: h.ripenTo.itemId, nameKo: h.ripenTo.nameKo, nameEn: h.ripenTo.nameEn ?? h.ripenTo.nameKo, kind: 'extra' });
      if (c.interim) out.push({ id: c.interim.itemId, nameKo: c.interim.labelKo, nameEn: c.interim.labelEn, kind: 'extra' });
    }
    if ((set === 'pack' || set === 'all') && h.pack) out.push({ id: h.pack.itemId, nameKo: h.pack.nameKo, nameEn: h.pack.nameEn, kind: 'pack' });
    // 284차 — 먹는 부산물(무청 · 겉잎 · 토란대 · 깻순 — 밭에 넣는 부산물 `kind: 'residue'`는 아이템 그림 `item_looks/mill.cjs`) · 낟알 봉지
    if (set === 'byproduct' || set === 'all') {
      for (const b of c.byproducts ?? []) if (b.kind === 'food') out.push({ id: b.itemId, nameKo: b.nameKo, nameEn: b.nameEn, kind: 'byproduct' });
    }
    if (set === 'bag' || set === 'all') for (const b of h.bags ?? []) out.push({ id: b.itemId, nameKo: b.nameKo, nameEn: b.nameEn, kind: 'bag' });
  }
  // 같은 부산물이 두 작물에 걸릴 수 있다(깻순 = 깻잎 · 들깨) — id 하나에 한 장
  const seen = new Set();
  return out.filter((t) => !seen.has(t.id) && seen.add(t.id));
}

/** 참고 그림 — 긴 변 512px PNG로 줄여 한 번만 만든다(요청 크기 · 토큰 절약) */
function refParts(outDir) {
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  return REFS.map((id) => {
    const dst = path.join(dir, `${id}.png`);
    if (!fs.existsSync(dst)) execFileSync('convert', [path.join(ASIS, `${id}.png`), '-resize', '512x512>', `PNG32:${dst}`]);
    return { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 284차 — 봉지의 「담을 내용물」 그림(낱알 초상 asis → 긴 변 512px) — 없으면 빈 배열 */
function contentParts(outDir, id) {
  const src = CONTENT_REF[id];
  if (!src) return [];
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, `${src}.png`);
  if (!fs.existsSync(dst)) execFileSync('convert', [path.join(ASIS, `${src}.png`), '-resize', '512x512>', `PNG32:${dst}`]);
  return [{ text: CONTENT_TEXT }, { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } }];
}

async function generateOne(it, P, refs) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: STYLE_INTRO }, ...refs, { text: taskText(it) }, ...contentParts(P.out, it.id)] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } },
  };
  let last = '';
  for (let attempt = 1; attempt <= P.tries; attempt++) {
    const t0 = Date.now();
    let res, j;
    try {
      res = await fetch(`${API}/${P.model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      j = await res.json();
    } catch (e) { last = `fetch ${e.message}`; await sleep(5000 * attempt); continue; }
    const ms = Date.now() - t0;
    if (!res.ok) {
      last = `HTTP ${res.status} ${(j?.error?.message ?? '').slice(0, 160)}`;
      if (res.status === 403) throw new Error(`${last} — NODE_USE_ENV_PROXY=1로 돌렸는지, 시크릿 · 결제를 확인`);
      await sleep((res.status === 429 ? 20000 : 6000) * attempt);
      continue;
    }
    const parts = j.candidates?.[0]?.content?.parts ?? [];
    const img = parts.map((p) => p.inlineData ?? p.inline_data).find((d) => d?.data);
    if (!img) { last = `그림 없음 finish=${j.candidates?.[0]?.finishReason ?? '?'}`; await sleep(3000); continue; }
    const name = P.tag ? `${it.id}.${P.tag}` : it.id;
    const tmp = path.join(os.tmpdir(), `gca_${name}_${process.pid}`);
    fs.writeFileSync(tmp, Buffer.from(img.data, 'base64'));
    execFileSync('convert', [tmp, '-depth', '8', `PNG32:${path.join(P.out, `${name}.png`)}`]);
    fs.rmSync(tmp, { force: true });
    const u = j.usageMetadata ?? {};
    fs.appendFileSync(path.join(P.out, '_log.jsonl'), JSON.stringify({
      id: it.id, file: `${name}.png`, model: P.model, attempt, ms, mime: img.mimeType ?? img.mime_type,
      inTok: u.promptTokenCount, outTok: u.candidatesTokenCount, at: new Date().toISOString(),
    }) + '\n');
    return { ok: true, ms, attempt };
  }
  return { ok: false, err: last };
}

/** 검수를 마친 `<out>/<id>.png`를 긴 변 640px PNG로 `asis/`에 넣는다(이미 있는 asis 파일은 --force 없이 덮지 않는다) */
function install(P) {
  const files = fs.readdirSync(P.out).filter((f) => /^crop_[a-z_0-9]+\.png$/.test(f)).filter((f) => !P.only || P.only.has(f.slice(0, -4)));
  let n = 0;
  for (const f of files) {
    const dst = path.join(ASIS, f);
    if (fs.existsSync(dst) && !P.force) { console.log(`${f}: asis에 이미 있어 건너뛴다(--force로 덮기)`); continue; }
    execFileSync('convert', [path.join(P.out, f), '-filter', 'Lanczos', '-resize', '640x640>', `PNG32:${dst}`]);
    n++;
  }
  console.log(`asis에 ${n}장 넣음 → 이제 node tools/pixelize_crops.cjs`);
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  fs.mkdirSync(P.out, { recursive: true });
  if (P.install) { install(P); return; }
  // 이미 게임에 초상이 있는 것(public/crops/<id>.png — 사진 · 변환본 어느 쪽이든)은 --only로 집지 않는 한 건너뛴다
  const havePortrait = (id) => fs.existsSync(path.join(PUBLIC_CROPS, `${id}.png`));
  let list = (await targets(P.set)).filter((t) => (P.only ? P.only.has(t.id) : !havePortrait(t.id)));
  const missing = list.filter((t) => !LOOKS[t.id]).map((t) => t.id);
  if (missing.length) console.warn('생김새 설명이 없어 건너뛴다:', missing.join(', '));
  list = list.filter((t) => LOOKS[t.id]).map((t) => ({ ...t, look: LOOKS[t.id] }));
  // 이미 뽑은 것은 건너뛴다(--force면 다시 · 다른 판은 --tag)
  list = list.filter((t) => P.force || !fs.existsSync(path.join(P.out, `${P.tag ? `${t.id}.${P.tag}` : t.id}.png`)));
  console.log(`대상 ${list.length}장 · 모델 ${P.model} · 동시 ${P.jobs}`);
  if (P.dry) { for (const t of list) console.log(`${t.id}\n${taskText(t)}\n`); return; }
  const refs = refParts(P.out);
  let next = 0, done = 0, fail = 0;
  const failed = [];
  const worker = async () => {
    while (next < list.length) {
      const it = list[next++];
      const r = await generateOne(it, P, refs);
      if (r.ok) { done++; console.log(`[${done + fail}/${list.length}] ${it.id} — ${r.ms}ms${r.attempt > 1 ? ` (시도 ${r.attempt})` : ''}`); }
      else { fail++; failed.push(it.id); console.log(`[${done + fail}/${list.length}] ${it.id} — 실패: ${r.err}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(P.jobs, list.length) }, worker));
  console.log(`끝: 성공 ${done} · 실패 ${fail}${failed.length ? ` (${failed.join(', ')})` : ''}`);
}

module.exports = { LOOKS, CONTENT_REF, STYLE_INTRO, taskText, targets };
if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
