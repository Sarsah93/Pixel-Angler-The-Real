/**
 * @file gemini_tackle_art.cjs
 * @description 249차 — 낚시 장비 그림을 Gemini 그림 모델로 그린다(어종 · 갯것 도구와 같은 길).
 *
 *  대상은 두 갈래다.
 *   - **코드로 그린 임시 그림을 쓰던 장비**(`art_*` — 뜰채 · 루어 · 밑밥 · 옷 · 가방 · 해루질 도구 · 통발 등) — 키는 그대로 두고 그림만 바꾼다
 *     (세이브 · 카탈로그가 든 `iconTexture`를 고치지 않아도 된다). 코드 그림은 `tools/item_art/build.py`가 알아서 빼고 id 연결만 남긴다.
 *   - **다른 종류 그림을 빌려 쓰던 장비**(`item_*` — 원투대 · 쇼어지깅대 · 죽간 · 레버브레이크 릴 · 합사 스풀 · 잠길찌 등) — 새 키.
 *     어느 아이템이 어느 키를 쓰는지는 `packages/client-pc/src/data/TackleTextures.ts`(rodArtKey · reelArtKey · lineArtKey)가 정한다.
 *  사용자가 그려 온 장비 그림(스피닝릴 · 구멍찌 · 바칸 등 — `food assets/tackle/`)을 화풍 참고로 3장씩 보낸다.
 *  키는 환경의 네트워크 시크릿을 에이전트 프록시가 붙인다(이 스크립트 · 저장소에는 키가 없다).
 *  ⚠ Node 내장 fetch는 HTTPS_PROXY를 읽지 않는다 — 반드시 `NODE_USE_ENV_PROXY=1`로 돌린다.
 *
 *  사용:
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_tackle_art.cjs --out <폴더> [--only art_cap,item_rod_surf] [--group rod]
 *        [--model gemini-nano-banana-2.1] [--jobs 4] [--tries 4] [--tag v2] [--force] [--dry]
 *    결과: <폴더>/<키>[.<tag>].png(PNG32) + <폴더>/_log.jsonl
 *    검수 뒤 `--install`(고른 판은 태그 없는 이름으로 둔다): 배경 벗기기(여러 조각 유지) → 번짐 벗기기 → 타이트 크롭 →
 *      격자 정규화(긴 변 192칸 · 셀 6px — 어종 · 갯것 기준) 뒤 `food assets/tackle/<파일>`.
 *    그다음 `node tools/tackle_cards.cjs`가 게임용 카드(228×90 안) · 아이콘(64px)을 굽는다.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'food assets', 'tackle');
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

/** 화풍 참고 묶음(`food assets/tackle/` — 사용자가 그려 온 장비 그림) */
const REF_ROD = ['it_spinning_rod_v2.png', 'it_bait_rod.png', 'it_spinning_reel.png'];
const REF_REEL = ['it_spinning_reel.png', 'it_bait_reel.png', 'it_float_hole_v2.png'];
const REF_LURE = ['it_minnow.png', 'it_metal_jig.png', 'it_soft_worm.png'];
const REF_TAIRABA = ['it_tairaba_head_red.png', 'it_tairaba_skirt_red.png', 'it_tairaba_necktie_orange.png'];
const REF_LINE = ['line_spool_saiso.png', 'it_float_hole_v2.png', 'it_spinning_reel.png'];
const REF_FLOAT = ['it_float_hole_v2.png', 'it_subfloat_heavy_v2.png', 'it_float_tilt_v2.png'];
const REF_PACK = ['it_krill_block.png', 'pack_ragworm.png', 'it_krill_box.png'];
const REF_BAG = ['it_bakkan_danax.png', 'it_krill_box.png', 'it_spinning_reel.png'];
const REF_METAL = ['it_spinning_reel.png', 'it_swivel_v2.png', 'it_bakkan_danax.png'];

/**
 * 텍스처 키 → 파일 · 이름 · 비율 · 참고 · 생김새. `group`은 --group으로 골라 돌릴 때 쓴다.
 * 대는 참고 그림처럼 **초릿대 끝이 왼쪽 위 · 손잡이가 오른쪽 아래** 대각선이고 릴을 달지 않는다.
 */
const LOOKS = {
  // ── 낚싯대(종류별 — 갯바위 찌낚시대는 사용자 그림 item_spinning_rod · 선상 베이트대는 item_bait_rod 그대로) ──
  item_rod_surf: { group: 'rod', file: 'rod_surf.png', nameKo: '원투 낚싯대', nameEn: 'Surf casting rod', aspect: '1:1', refs: REF_ROD,
    look: '굵고 곧은 원투 낚싯대 한 대(4m 급). 참고 그림의 낚싯대처럼 초릿대 끝이 왼쪽 위, 손잡이가 오른쪽 아래인 대각선으로 화면을 가로지른다. '
      + '초릿대 끝 한 뼘은 형광 주황 · 노랑(입질을 보는 색 초리), 블랭크는 짙은 남색 · 검정 광택. 줄 고리(가이드)는 대여섯 개뿐이고 손잡이 쪽으로 갈수록 크게 커진다(첫 가이드가 가장 크다). '
      + '손잡이는 길고 곧은 검정 EVA 스펀지 그립과 은색 금속 릴시트. 릴은 달지 않는다.' },
  item_rod_shorejig: { group: 'rod', file: 'rod_shorejig.png', nameKo: '쇼어지깅 낚싯대', nameEn: 'Shore jigging rod', aspect: '1:1', refs: REF_ROD,
    look: '굵고 빳빳한 쇼어지깅 낚싯대 한 대(3m 안팎). 참고 그림처럼 초릿대 끝이 왼쪽 위, 손잡이가 오른쪽 아래인 대각선. '
      + '블랭크는 짙은 청색 · 회청색 메탈릭 광택이고 끝까지 굵기가 크게 줄지 않는다. 가이드는 크고 튼튼한 은색 고리(K형)가 듬성듬성. '
      + '손잡이는 짧은 앞 그립 + 금속 릴시트 + 긴 뒤 그립(검정 EVA), 끝에 고무 버트캡. 릴 없음.' },
  item_rod_light: { group: 'rod', file: 'rod_light.png', nameKo: '라이트게임 낚싯대', nameEn: 'Light game rod', aspect: '1:1', refs: REF_ROD,
    look: '아주 가늘고 짧은 라이트게임 낚싯대 한 대(2.3m). 참고 그림처럼 초릿대 끝이 왼쪽 위, 손잡이가 오른쪽 아래인 대각선. '
      + '블랭크는 실처럼 가늘고 낭창하며 진한 회색, 초릿대 끝은 흰색 · 진주색(솔리드 팁). 가이드는 아주 작고 촘촘하다. '
      + '손잡이는 짧은 코르크 그립 두 토막(앞 · 뒤로 나뉜 스플릿 그립)과 작은 은색 릴시트. 릴 없음.' },
  item_rod_eging: { group: 'rod', file: 'rod_eging.png', nameKo: '에깅 낚싯대', nameEn: 'Eging rod', aspect: '1:1', refs: REF_ROD,
    look: '무늬오징어 에깅 낚싯대 한 대(2.5m). 참고 그림처럼 초릿대 끝이 왼쪽 위, 손잡이가 오른쪽 아래인 대각선. '
      + '빳빳하고 곧은 블랭크는 진한 자줏빛 · 와인색 광택(에깅대 특유의 색), 가이드는 작은 은색 고리가 고르게. '
      + '손잡이는 짧은 앞 그립 + 금속 릴시트 + 블랭크가 드러난 구간 + 짧은 뒤 그립(검정 EVA 스플릿 그립). 릴 없음.' },
  item_rod_hole: { group: 'rod', file: 'rod_hole.png', nameKo: '구멍치기 낚싯대', nameEn: 'Tetrapod hole rod', aspect: '1:1', refs: REF_ROD,
    look: '짧고 뭉툭한 테트라포드 구멍치기 낚싯대 한 대(2.1m — 다른 낚싯대의 절반 길이). 초릿대 끝이 왼쪽 위, 손잡이가 오른쪽 아래인 대각선이지만 '
      + '화면 대각선의 3분의 2 길이만 차지하게 짧게 그린다. 굵고 단단한 블랭크는 짙은 녹색 · 검정, 초릿대 끝은 흰색. '
      + '가이드는 서너 개뿐, 손잡이 쪽에 작은 금속 릴시트와 짧은 코르크 손잡이. 릴 없음.' },
  item_rod_budget: { group: 'rod', file: 'rod_budget.png', nameKo: '싸구려 짧은 낚싯대', nameEn: 'Budget telescopic rod', aspect: '1:1', refs: REF_ROD,
    look: '싸구려 짧은 접는 낚싯대 한 대(2.4m, 마디를 빼서 늘이는 식). 초릿대 끝이 왼쪽 위, 손잡이가 오른쪽 아래인 대각선, 화면 대각선의 4분의 3 길이. '
      + '블랭크는 탁한 하늘색 · 회색 유리섬유이고 마디 이음마다 조금 굵어지는 고리 자국이 보인다. 가이드는 작은 은색 고리 몇 개, '
      + '손잡이는 얇은 검정 플라스틱 릴시트와 검정 고무 손잡이. 장식 없이 소박하다. 릴 없음.' },
  item_rod_bamboo: { group: 'rod', file: 'rod_bamboo.png', nameKo: '대나무 죽간 낚싯대', nameEn: 'Bamboo rod', aspect: '1:1', refs: REF_ROD,
    look: '대나무를 깎아 만든 전통 죽간 낚싯대 한 대. 초릿대 끝이 왼쪽 위, 손잡이가 오른쪽 아래인 대각선. '
      + '누런 황갈색 대나무 블랭크에 볼록한 마디가 일정한 간격으로 있고, 마디 사이 몇 군데를 실로 감아 옻칠한 검붉은 띠. '
      + '가이드는 작은 놋쇠 고리, 손잡이는 실을 촘촘히 감은 짙은 갈색 그립과 놋쇠 이음쇠. 릴 없음. 손으로 만든 귀한 물건.' },
  // ── 릴(종류별 — 범용 스피닝릴 · 베이트릴은 사용자 그림 그대로) ──
  item_reel_small: { group: 'reel', file: 'reel_small.png', nameKo: '소형 스피닝릴', nameEn: 'Small spinning reel', aspect: '1:1', refs: REF_REEL,
    look: '작고 가벼운 1000번 스피닝릴 하나. 참고 그림의 스피닝릴과 같은 각도 · 같은 구성(위에 스풀, 다리와 몸통, 옆으로 뻗은 손잡이)이지만 '
      + '몸집이 작고 날씬하다. 몸통은 무광 은회색 · 흰색, 스풀 테는 은색이고 가는 주황색 줄이 감겨 있다. 손잡이 끝 노브는 작은 둥근 코르크.' },
  item_reel_lever: { group: 'reel', file: 'reel_lever.png', nameKo: '레버브레이크 스피닝릴', nameEn: 'Lever-brake spinning reel', aspect: '1:1', refs: REF_REEL,
    look: '갯바위 찌낚시용 레버브레이크 스피닝릴 하나. 참고 그림의 스피닝릴과 같은 각도 · 같은 크기. 몸통 아래 다리 앞쪽으로 '
      + '손가락으로 당기는 길쭉한 브레이크 레버(빨간 금속, 끝이 둥글다)가 앞으로 튀어나와 있는 것이 가장 큰 특징이다. '
      + '몸통은 진한 검정에 금색 장식 줄, 스풀은 금색 테에 은빛 투명 나일론 줄.' },
  item_reel_surf: { group: 'reel', file: 'reel_surf.png', nameKo: '원투 전용 대형 스피닝릴', nameEn: 'Surf casting reel', aspect: '1:1', refs: REF_REEL,
    look: '원투 전용 대형 스피닝릴(5000번) 하나. 참고 그림의 스피닝릴과 같은 각도. 스풀이 앞뒤로 길쭉한 원뿔꼴(앞이 좁고 긴 롱캐스트 스풀)이라 '
      + '일반 릴보다 앞뒤로 길다. 몸통은 크고 은색 · 짙은 회색, 손잡이 팔이 길고 노브가 크다. 스풀에 형광 노랑 나일론 줄.' },
  item_reel_sw: { group: 'reel', file: 'reel_sw.png', nameKo: '쇼어지깅 스피닝릴', nameEn: 'Saltwater jigging reel', aspect: '1:1', refs: REF_REEL,
    look: '쇼어지깅용 튼튼한 4000번 고기어 스피닝릴 하나. 참고 그림의 스피닝릴과 같은 각도지만 더 크고 각진 금속 몸통(짙은 남색 아노다이징에 은색 테), '
      + '굵은 손잡이 팔 끝에 큰 T자 파워 노브, 스풀에 형광 녹색 합사가 꽉 감겨 있다. 바닷물에 강한 단단한 느낌.' },
  // ── 루어 ──
  item_lure_shad: { group: 'lure', file: 'lure_shad.png', nameKo: '섀드 웜', nameEn: 'Paddle-tail shad worm', aspect: '4:3', refs: REF_LURE,
    look: '섀드 웜(말랑한 고무 소프트 루어) 하나를 옆에서 본 모습, 머리는 왼쪽. 작은 물고기 모양 몸통 끝에 둥글고 넓적한 노(패들) 모양 꼬리가 세로로 붙어 있다. '
      + '등은 반투명 녹갈색에 은색 반짝이, 배는 흰색 · 연분홍. 바늘 · 지그헤드는 꽂혀 있지 않다. 참고 그림의 꼬리가 말린 웜과 달리 꼬리가 노 모양이다.' },
  art_lure_spoon: { group: 'lure', file: 'lure_spoon.png', nameKo: '스푼 루어', nameEn: 'Spoon lure', aspect: '3:4', refs: REF_LURE,
    look: '스푼 루어 하나, 세운 모습. 숟가락 머리처럼 오목하고 길쭉한 물방울 모양 금속판(은색 거울 광택, 가운데에 빨간 줄과 금색 비늘 무늬), '
      + '위쪽 끝 작은 구멍에 쪼개진 고리와 도래, 아래 끝 고리에 트레블 훅 하나.' },
  art_lure_spinner: { group: 'lure', file: 'lure_spinner.png', nameKo: '스피너 루어', nameEn: 'Inline spinner', aspect: '3:4', refs: REF_LURE,
    look: '스피너 루어 하나, 세운 모습. 가운데 곧은 철사 축 맨 위에 고리, 그 아래 작은 고리쇠로 매단 물방울 모양 회전 날개(금색 블레이드)가 축 옆으로 비스듬히 펼쳐져 있고, '
      + '그 아래 놋쇠 구슬 몇 개와 원통 몸통, 맨 아래 빨간 깃털 장식이 달린 트레블 훅.' },
  art_lure_egi: { group: 'lure', file: 'lure_egi.png', nameKo: '에기', nameEn: 'Egi squid jig', aspect: '4:3', refs: REF_LURE,
    look: '에기(무늬오징어 낚시용 새우 모양 루어) 하나를 옆에서 본 모습, 머리는 왼쪽. 새우를 닮은 유선형 몸통에 주황 · 분홍 천이 씌워져 있고 금빛 줄무늬, '
      + '등에 작은 깃털 두 장, 머리 아래 턱에 납 봉돌, 큰 눈알. 꼬리 끝에 가시 없는 가는 바늘 여러 개가 우산살처럼 둥글게 두 겹으로 펼쳐진 갈고리.' },
  art_lure_tairaba: { group: 'lure', file: 'lure_tairaba.png', nameKo: '타이라바', nameEn: 'Tai rubber jig', aspect: '3:4', refs: REF_TAIRABA,
    look: '타이라바(완성된 루어 한 벌) 하나. 위에 빨간 금속 구슬 모양 둥근 머리(헤드)가 있고, 그 아래로 가는 고무 실 다발 스커트(빨강 · 주황)와 '
      + '물결치는 넓적한 고무 넥타이 두 가닥(주황)이 늘어져 있으며, 그 사이에 작은 바늘 두 개가 숨어 있다. 참고 그림의 타이라바 부품 셋을 하나로 조립한 모습이다.' },
  art_lure_set: { group: 'lure', file: 'lure_set.png', nameKo: '입문 루어 세트', nameEn: 'Starter lure set', aspect: '4:3', refs: REF_LURE,
    look: '입문 루어 세트 한 벌 — 종이 뒷판에 투명 플라스틱 블리스터를 씌운 포장 하나 안에, 작은 미노우 하나 · 은색 스푼 하나 · 분홍 웜 두 개가 칸칸이 들어 있다. '
      + '종이 뒷판은 짙은 남색 단색, 글자 · 그림 없음. 정면에서 조금 비스듬히 본 모습.' },
  art_egi_set: { group: 'lure', file: 'egi_set.png', nameKo: '고급 에기 세트', nameEn: 'Premium egi set', aspect: '4:3', refs: REF_LURE,
    look: '고급 에기 세트 — 뚜껑이 투명한 납작한 플라스틱 케이스 하나 안에 에기 두 개(하나는 주황, 하나는 분홍 · 크기가 조금 다르다)가 나란히 누워 있다. '
      + '케이스 바닥은 검정 스펀지. 비스듬히 위에서 본 모습.' },
  // ── 줄 · 찌 ──
  item_line_pe: { group: 'line', file: 'line_pe.png', nameKo: '합사(PE) 원줄 스풀', nameEn: 'PE braid spool', aspect: '1:1', refs: REF_LINE,
    look: '합사(PE) 낚싯줄 스풀 하나. 첫 번째 참고 그림의 낚싯줄 스풀과 같은 모양 · 같은 각도 · 같은 검정 플라스틱 테 스풀이지만, '
      + '감긴 줄이 여러 색 띠(빨강 · 노랑 · 초록 · 파랑 · 분홍이 일정 간격으로 바뀌는 5색 합사)다. 옆면 라벨은 글자 없이 주황색 띠만.' },
  item_line_leader: { group: 'line', file: 'line_leader.png', nameKo: '카본 목줄 스풀', nameEn: 'Fluorocarbon leader spool', aspect: '1:1', refs: REF_LINE,
    look: '카본 목줄(쇼크리더) 스풀 하나. 첫 번째 참고 그림의 낚싯줄 스풀보다 폭이 좁고 납작한 투명 플라스틱 스풀(옆면이 반투명 연청색)에, '
      + '투명하고 연분홍빛이 도는 가는 줄이 감겨 있다. 옆면 라벨은 글자 없이 빨간 띠만. 같은 각도.' },
  item_float_sink: { group: 'line', file: 'float_sink.png', nameKo: '잠길찌', nameEn: 'Sinking float', aspect: '3:4', refs: REF_FLOAT,
    look: '잠길찌(천천히 가라앉는 찌낚시용 찌) 하나, 세운 모습. 첫 번째 참고 그림의 구멍찌와 같은 크기 · 같은 모양(위가 둥근 원뿔꼴, 위아래로 줄이 지나는 구멍)이지만, '
      + '윗부분은 형광 녹색 띠, 몸통 아래쪽은 짙은 남색 · 검정, 몸통 가운데에 은색 줄 하나가 둘러 있다.' },
  // ── 미끼 · 밑밥 ──
  art_breadball: { group: 'bait', file: 'breadball.png', nameKo: '빵가루 경단', nameEn: 'Bread dough balls', aspect: '4:3', refs: REF_PACK,
    look: '빵가루 경단(반죽 미끼) 세 알 — 엄지손톱만 한 동글동글한 연노랑 · 황토색 빵가루 반죽 공 세 개가 서로 붙어 한 무더기. 겉에 거친 빵가루 알갱이가 보인다.' },
  art_breadpack: { group: 'bait', file: 'breadpack.png', nameKo: '빵가루 반죽 미끼 한 봉지', nameEn: 'Bread dough bait pouch', aspect: '3:4', refs: REF_PACK,
    look: '빵가루 반죽 미끼 한 봉지(200g) — 위에 지퍼가 달린 세워 놓는 비닐 파우치. 앞면 가운데 투명 창으로 연노랑 반죽이 보이고, 위아래는 노랑 · 흰색 띠. 글자 없음.' },
  art_fishcut: { group: 'bait', file: 'fishcut.png', nameKo: '생선 조각 미끼', nameEn: 'Cut fish bait', aspect: '4:3', refs: REF_PACK,
    look: '생선 조각 미끼 — 은빛 껍질의 꽁치 · 고등어 살을 비스듬히 썬 길쭉한 토막 네 개가 흰 스티로폼 접시 위에 가지런히 겹쳐 있다. 붉은 살과 은색 · 청색 껍질이 또렷하다.' },
  art_chum_mix: { group: 'chum', file: 'chum_mix.png', nameKo: '집어제(크릴 배합) 한 봉지', nameEn: 'Krill chum mix bag', aspect: '3:4', refs: REF_PACK,
    look: '밑밥 집어제 한 봉지 — 두툼한 직사각형 비닐 포대(가루가 가득 차 불룩하다). 앞면은 빨강 · 주황 바탕에 분홍 크릴(새우) 그림 하나, 글자 없음. 위는 접어 봉한 이음.' },
  art_chum_powder: { group: 'chum', file: 'chum_powder.png', nameKo: '감성돔 집어 파우더 한 봉지', nameEn: 'Black seabream chum powder', aspect: '3:4', refs: REF_PACK,
    look: '감성돔 집어 파우더 한 봉지 — 직사각형 비닐 포대(불룩하다). 앞면은 짙은 녹색 · 검정 바탕에 은회색 감성돔 한 마리 그림, 글자 없음.' },
  art_chum_powder_heavy: { group: 'chum', file: 'chum_powder_heavy.png', nameKo: '고비중 집어 파우더 한 봉지', nameEn: 'Heavy sinking chum powder', aspect: '3:4', refs: REF_PACK,
    look: '고비중(빨리 가라앉는) 집어 파우더 한 봉지 — 직사각형 비닐 포대가 무겁게 꽉 차 있다. 앞면은 짙은 남색 · 검정 바탕에 아래로 향한 굵은 노란 화살표 무늬와 작은 은회색 물고기 그림, 글자 없음.' },
  art_chum_bread: { group: 'chum', file: 'chum_bread.png', nameKo: '밑밥용 빵가루 한 봉지', nameEn: 'Bread crumb chum bag', aspect: '3:4', refs: REF_PACK,
    look: '밑밥용 빵가루 한 봉지 — 투명 비닐 봉지에 연노랑 굵은 빵가루가 가득 차 있고, 위를 빨간 끈으로 묶었다. 글자 없음.' },
  art_chum_apmac: { group: 'chum', file: 'chum_apmac.png', nameKo: '압맥(눌린 보리) 한 봉지', nameEn: 'Pressed barley chum', aspect: '3:4', refs: REF_PACK,
    look: '압맥(납작하게 눌린 보리) 한 봉지 — 투명 비닐 봉지에 연한 황갈색 납작한 보리 알이 가득, 위를 매듭으로 묶었다. 글자 없음.' },
  art_chum_corn: { group: 'chum', file: 'chum_corn.png', nameKo: '옥수수 통조림', nameEn: 'Canned sweet corn', aspect: '3:4', refs: REF_PACK,
    look: '옥수수 통조림 한 캔 — 원통형 깡통, 노란 옥수수 알 그림이 있는 초록 · 노랑 라벨(글자 없음), 위 뚜껑은 따는 고리가 있는 은색. 비스듬히 위에서 본 모습.' },
  art_chum_viscera: { group: 'chum', file: 'chum_viscera.png', nameKo: '생선 내장 밑밥 한 통', nameEn: 'Fish guts chum tub', aspect: '1:1', refs: REF_PACK,
    look: '생선 내장 밑밥 — 뚜껑을 연 작은 반투명 흰 플라스틱 통에 짓이긴 붉은 · 검붉은 생선 내장이 가득 담겨 있다. 비스듬히 위에서 본 모습.' },
  // ── 낚시 도구 ──
  art_landing_net: { mesh: true, group: 'tool', file: 'landing_net.png', nameKo: '뜰채', nameEn: 'Landing net', aspect: '1:1', refs: REF_METAL,
    look: '뜰채 하나. 긴 접이식 자루(검정 · 은색 마디가 이어진 대롱)가 오른쪽 아래에서 왼쪽 위로 뻗고, 왼쪽 위 끝에 둥근 금속 테(지름이 자루 길이의 3분의 1쯤)와 '
      + '그 아래로 늘어진 짙은 녹색 그물망. 대각선 구도.' },
  art_rod_holder: { group: 'tool', file: 'rod_holder.png', nameKo: '원투 거치대(삼발이)', nameEn: 'Tripod rod holder', aspect: '3:4', refs: REF_METAL,
    look: '원투 낚싯대 거치대(삼발이) — 은색 알루미늄 다리 세 개가 아래로 벌어진 삼각대, 꼭대기 가로대에 낚싯대를 걸치는 V자 검정 고무 받침 홈 두세 개. 낚싯대는 걸려 있지 않다.' },
  art_bucket: { group: 'tool', file: 'bucket.png', nameKo: '낚시용 두레박', nameEn: 'Fishing water bucket', aspect: '1:1', refs: REF_BAG,
    look: '낚시용 두레박 — 접이식 원통형 천 두레박(파란 방수천에 흰 띠, 입구에 금속 테)에 손잡이가 있고, 손잡이에 감긴 흰 밧줄 한 다발이 매달려 있다.' },
  art_cooler: { group: 'tool', file: 'cooler.png', nameKo: '낚시용 아이스박스(쿨러)', nameEn: 'Fishing cooler box', aspect: '4:3', refs: REF_BAG,
    look: '낚시용 아이스박스 하나 — 직사각형 하드 쿨러, 흰색 몸통에 파란 뚜껑, 옆에 어깨끈을 거는 고리, 뚜껑 위에 작은 투입구 덮개. 비스듬히 위에서 본 모습. 글자 없음.' },
  art_fish_crate: { group: 'tool', file: 'fish_crate.png', nameKo: '위판 규격 생선 상자', nameEn: 'Fish auction crate', aspect: '4:3', refs: REF_BAG,
    look: '위판장 규격 생선 상자 하나 — 얕은 직사각형 흰 스티로폼 어상자, 옆면에 손잡이 구멍, 안에 잘게 부순 얼음이 조금. 비스듬히 위에서 본 모습. 글자 없음.' },
  art_ice_bag: { group: 'tool', file: 'ice_bag.png', nameKo: '대용량 각얼음 한 봉지', nameEn: 'Bag of ice cubes', aspect: '3:4', refs: REF_PACK,
    look: '대용량 각얼음 한 봉지 — 두툼한 투명 비닐 봉지 안에 하얗고 반투명한 네모 얼음 조각이 가득, 위를 묶었다. 봉지 앞면에 파란 띠(글자 없음).' },
  // ── 옷 · 몸에 거는 것 ──
  art_cap: { group: 'wear', file: 'cap.png', nameKo: '낚시 모자', nameEn: 'Fishing cap', aspect: '4:3', refs: REF_BAG,
    look: '낚시 모자 하나 — 남색 캡 모자(챙이 길다), 앞면에 작은 흰 물고기 모양 패치, 뒤쪽 조절 끈. 비스듬히 옆에서 본 모습.' },
  art_vest: { group: 'wear', file: 'vest.png', nameKo: '낚시 조끼', nameEn: 'Fishing vest', aspect: '1:1', refs: REF_BAG,
    look: '낚시 조끼 하나를 펼쳐 놓은 앞모습 — 카키 · 올리브색 천 조끼, 앞판에 뚜껑 달린 작은 주머니가 여러 개와 지퍼, 어깨에 금속 D링, 가슴에 작은 도구 고리.' },
  art_pants: { group: 'wear', file: 'pants.png', nameKo: '방수 바지', nameEn: 'Waterproof pants', aspect: '3:4', refs: REF_BAG,
    look: '방수 낚시 바지 하나를 펼친 앞모습 — 짙은 남색 · 회색 방수 원단, 무릎에 덧댄 짙은 보강 패드, 허리에 고무줄과 끈, 발목에 조임 밴드.' },
  art_shoes: { group: 'wear', file: 'shoes.png', nameKo: '갯바위 단화', nameEn: 'Rock fishing shoes', aspect: '4:3', refs: REF_BAG,
    pair: true,
    look: '갯바위 낚시 단화 한 켤레 — 발목이 낮은 신발, 회색 · 검정 갑피에 빨간 테, 밑창 가장자리로 금속 징(스파이크)이 박힌 펠트 바닥이 살짝 보인다. '
      + '왼발 한 짝과 오른발 한 짝을 앞코가 같은 쪽(오른쪽 아래)을 보게 나란히 세워 놓고 비스듬히 위에서 본다. 밑창을 따로 뒤집어 보여 주지 않는다.' },
  art_boots_wading: { group: 'wear', file: 'boots_wading.png', nameKo: '해루질 장화', nameEn: 'Wading boots', aspect: '1:1', refs: REF_BAG,
    look: '무릎까지 오는 고무 장화 한 켤레 — 짙은 녹색 고무, 위쪽 테는 노랑, 밑창은 굵은 무늬. 두 짝이 살짝 겹쳐 한 덩어리로 서 있다.' },
  art_glasses: { group: 'wear', file: 'glasses.png', nameKo: '편광 선글라스', nameEn: 'Polarized sunglasses', aspect: '4:3', refs: REF_METAL,
    look: '편광 선글라스 하나 — 검정 테, 렌즈는 파랑 · 초록빛으로 반사되는 미러 코팅. 다리를 편 채 비스듬히 앞에서 본 모습.' },
  art_gloves_fleece: { group: 'wear', file: 'gloves_fleece.png', nameKo: '기모 낚시 장갑', nameEn: 'Fleece fishing gloves', aspect: '1:1', refs: REF_BAG,
    pair: true,
    look: '기모 낚시 장갑 한 켤레 — 회색 · 검정 기모 원단, 엄지 · 검지 · 중지 세 손가락 끝이 잘려 손끝이 나오는 장갑, 손목에 찍찍이 띠. '
      + '왼손 한 짝과 오른손 한 짝을 손등이 위로 오게 나란히 펼쳐 놓은 모습(두 짝이 거울처럼 마주 보고, 엄지는 서로 안쪽). 손가락 다섯 개가 짝마다 또렷하다.' },
  art_gloves_rubber: { group: 'wear', file: 'gloves_rubber.png', nameKo: '해루질 고무장갑', nameEn: 'Heavy rubber gloves', aspect: '1:1', refs: REF_BAG,
    look: '두꺼운 고무장갑 한 켤레 — 주황 · 빨간 고무, 팔목이 길고 손바닥에 오돌토돌한 미끄럼 방지 무늬. 두 짝이 겹쳐 한 덩어리.' },
  art_gloves_work: { group: 'wear', file: 'gloves_work.png', nameKo: '목장갑', nameEn: 'Cotton work gloves', aspect: '1:1', refs: REF_BAG,
    look: '목장갑 한 켤레 — 흰 면 장갑에 손바닥 쪽만 빨간 고무 코팅, 손목에 색 실 테. 두 짝이 겹쳐 한 덩어리. 흰 부분도 진한 윤곽선으로 또렷하게.' },
  art_watch: { group: 'wear', file: 'watch.png', nameKo: '조과 기록 손목시계', nameEn: 'Catch log watch', aspect: '3:4', refs: REF_METAL,
    look: '디지털 아웃도어 손목시계 하나 — 검정 고무 시곗줄(위아래로 뻗은 모습), 큰 사각 액정에 숫자 대신 작은 물고기 아이콘 · 물결 · 막대 그래프, 몸통 옆에 단추 네 개.' },
  // ── 가방 ──
  art_tackle_pouch: { group: 'bag', file: 'tackle_pouch.png', nameKo: '오래 쓴 채비 주머니', nameEn: 'Old tackle pouch', aspect: '1:1', refs: REF_BAG,
    look: '오래 쓴 채비 주머니 — 손때 묻은 갈색 가죽 · 캔버스 허리 주머니, 뚜껑을 똑딱단추로 여미고, 옆 천에 낚싯바늘 몇 개와 작은 찌 하나가 꽂혀 있다. 낡고 정든 느낌.' },
  art_bag_field: { group: 'bag', file: 'bag_field.png', nameKo: '촬영 스태프 필드백', nameEn: 'Film crew field bag', aspect: '1:1', refs: REF_BAG,
    look: '촬영 스태프용 필드백 — 검정 나일론 상자형 숄더백(카메라 가방 모양), 앞 주머니 두 개, 어깨끈, 앞면에 은색 반사 띠 한 줄.' },
  art_bag_expedition: { group: 'bag', file: 'bag_expedition.png', nameKo: '어촌계 원정 가방', nameEn: 'Expedition backpack', aspect: '1:1', refs: REF_BAG,
    look: '어촌계 원정용 큰 배낭 — 남색 몸통에 주황 덮개, 위쪽은 말아 접는 입구(롤톱), 옆에 낚싯대를 꽂는 고리와 물병 주머니.' },
  art_bag_guide: { group: 'bag', file: 'bag_guide.png', nameKo: '가이드 가방', nameEn: 'Guide backpack', aspect: '1:1', refs: REF_BAG,
    look: '낚시 가이드 배낭 — 빨간 방수 배낭, 앞면에 흰 십자(구급) 패치, 옆에 접은 주황 구명조끼가 끈으로 묶여 있고, 노란 줄자(계측자) 끝이 주머니에서 삐져나와 있다.' },
  art_bag_voyage: { group: 'bag', file: 'bag_voyage.png', nameKo: '원거리 항해 가방', nameEn: 'Voyage duffel bag', aspect: '4:3', refs: REF_BAG,
    look: '원거리 항해용 더플백 — 노란 방수 원통형 가방(옆으로 누운 모습, 굵은 박음질), 양쪽 끝 손잡이와 어깨끈, 은색 반사 띠.' },
  art_bag_mountain: { group: 'bag', file: 'bag_mountain.png', nameKo: '마운틴 백팩', nameEn: 'Mountain backpack', aspect: '1:1', refs: REF_BAG,
    look: '등산 배낭 — 초록 배낭, 앞면에 흰 지그재그 산 무늬, 허리 벨트와 가슴 끈, 바닥에 말아 묶은 매트.' },
  art_tackle_vest: { group: 'bag', file: 'tackle_vest.png', nameKo: '태클 베스트', nameEn: 'Tackle vest', aspect: '1:1', refs: REF_BAG,
    look: '루어 낚시용 태클 베스트(부력재가 든 구명조끼형) 하나를 펼친 앞모습 — 회색 · 검정 두툼한 판, 앞판에 큰 수납 주머니 두 개와 빨간 지퍼, 가슴에 집게 고리.' },
  art_dry_bag: { group: 'bag', file: 'dry_bag.png', nameKo: '드라이백', nameEn: 'Dry bag', aspect: '3:4', refs: REF_BAG,
    look: '방수 드라이백 — 하늘색 · 파랑 원통형 가방을 세운 모습, 위쪽을 세 번 말아 검정 버클로 잠근 롤톱, 몸통에 흰 물결 무늬 한 줄, 어깨끈.' },
  // ── 해루질 도구 ──
  art_headlamp: { group: 'gather', file: 'headlamp.png', nameKo: '헤드랜턴', nameEn: 'Headlamp', aspect: '4:3', refs: REF_METAL,
    look: '헤드랜턴 하나 — 파란 · 검정 탄력 머리끈이 둥글게 고리를 이루고, 앞쪽에 회색 플라스틱 램프 몸통(둥근 흰 LED 렌즈 하나)이 달려 있다. 비스듬히 앞에서 본 모습.' },
  art_headlamp_trainee: { group: 'gather', file: 'headlamp_trainee.png', nameKo: '실습생 헤드랜턴', nameEn: 'Trainee headlamp', aspect: '4:3', refs: REF_METAL,
    look: '헤드랜턴 하나 — 주황 탄력 머리끈이 둥글게 고리를 이루고, 앞쪽에 조금 큰 노란 테두리 램프 몸통(LED 렌즈 두 개)이 달려 있다. 비스듬히 앞에서 본 모습.' },
  art_lantern_keeper: { group: 'gather', file: 'lantern_keeper.png', nameKo: '등대지기의 랜턴', nameEn: "Lighthouse keeper's lantern", aspect: '3:4', refs: REF_METAL,
    look: '오래된 놋쇠 손잡이 랜턴 하나 — 둥근 유리 갓 안에 따뜻한 노란 불빛, 위쪽에 굴뚝 갓과 둥근 고리 손잡이, 아래 받침. 금색 · 갈색 금속에 손때.' },
  art_tongs: { group: 'gather', file: 'tongs.png', nameKo: '채집 집게', nameEn: 'Shore gathering tongs', aspect: '1:1', refs: REF_METAL,
    look: '갯것 채집 집게 하나 — 긴 스테인리스 집게(두 팔이 이어진 가위 · 핀셋형), 끝이 톱니 모양으로 맞물리고 손잡이 쪽은 빨간 고무. 대각선으로 놓인다.' },
  art_gaff: { group: 'gather', file: 'gaff.png', nameKo: '채집 갈고리', nameEn: 'Gathering hook', aspect: '1:1', refs: REF_METAL,
    look: '채집 갈고리 하나 — 짧은 나무 자루 끝에 반원으로 휜 날카로운 쇠 갈고리, 손잡이 끝에 손목끈. 대각선으로 놓인다.' },
  art_rake: { group: 'gather', file: 'rake.png', nameKo: '갯지렁이 갈퀴', nameEn: 'Worm rake', aspect: '1:1', refs: REF_METAL,
    look: '갯지렁이 캐는 손갈퀴 하나 — 짧은 나무 자루 끝에 아래로 휜 쇠발 세 개(작은 쇠스랑 모양). 대각선으로 놓인다.' },
  // ── 통발 ──
  art_trap_crab_basic: { mesh: true, group: 'trap', file: 'trap_crab_basic.png', nameKo: '게 통발', nameEn: 'Crab pot', aspect: '4:3', refs: REF_BAG,
    look: '게 통발 하나 — 납작한 원통형(북 모양) 접이식 그물 통발, 녹색 그물에 검정 테 두 개, 옆면에 깔때기 모양 입구 두 개, 위에 줄을 묶는 고리. 비스듬히 위에서 본 모습.' },
  art_trap_crab_pro: { mesh: true, group: 'trap', file: 'trap_crab_pro.png', nameKo: '대형 게 통발', nameEn: 'Large crab trap', aspect: '4:3', refs: REF_BAG,
    look: '대형 게 통발 하나 — 직사각형 철망 상자형 통발(짙은 녹색 코팅 철사), 양옆에 깔때기 입구, 위쪽에 빨간 그물 미끼 주머니. 비스듬히 위에서 본 모습.' },
  art_trap_shrimp_basic: { mesh: true, group: 'trap', file: 'trap_shrimp_basic.png', nameKo: '새우 통발', nameEn: 'Shrimp trap', aspect: '4:3', refs: REF_BAG,
    look: '새우 통발 하나 — 작은 원통형 고운 그물 통발(파랑 · 하늘색 그물, 은색 철사 테), 양 끝에 깔때기 입구, 위에 줄 고리. 옆으로 누운 모습.' },
  art_trap_eel_basic: { group: 'trap', file: 'trap_eel_basic.png', nameKo: '장어 통발', nameEn: 'Eel trap tube', aspect: '4:3', refs: REF_BAG,
    look: '장어 통발 하나 — 검정 플라스틱 원통(길이가 지름의 서너 배인 대롱)이 옆으로 누워 있고, 한쪽 끝에 깔때기 마개, 몸통에 작은 물구멍 줄. 줄 매는 고리.' },
  art_trap_eel_pro: { group: 'trap', file: 'trap_eel_pro.png', nameKo: '연결식 장어 통발', nameEn: 'Linked eel traps', aspect: '4:3', refs: REF_BAG,
    look: '연결식 장어 통발 한 벌 — 검정 플라스틱 원통 통발 세 개가 나란히 누워 굵은 줄 하나로 이어져 있다(한 덩어리).' },
  art_trap_octopus_earthen: { group: 'trap', file: 'trap_octopus_earthen.png', nameKo: '문어 단지(토기)', nameEn: 'Clay octopus pot', aspect: '4:3', refs: REF_BAG,
    look: '문어 단지 하나 — 둥근 항아리 모양 적갈색 질그릇(토기)이 옆으로 누워 입구가 보이고, 목에 굵은 밧줄이 감겨 있다.' },
  art_trap_octopus_pvc: { group: 'trap', file: 'trap_octopus_pvc.png', nameKo: '문어 PVC 단지', nameEn: 'PVC octopus pot', aspect: '4:3', refs: REF_BAG,
    look: '문어 PVC 단지 하나 — 회색 PVC 관을 잘라 한쪽 끝을 막은 짧은 원통이 옆으로 누워 있고, 열린 입구 둘레에 검정 테, 몸통에 줄을 꿴 구멍.' },
  art_trap_fish_net: { mesh: true, group: 'trap', file: 'trap_fish_net.png', nameKo: '어류 그물 통발', nameEn: 'Fish net trap', aspect: '4:3', refs: REF_BAG,
    look: '어류 그물 통발 하나 — 사각 철 테 여러 개에 초록 그물을 씌운 큰 상자형 접이식 통발, 앞뒤에 깔때기 입구. 비스듬히 위에서 본 모습.' },
  // ── 장비 관리 ──
  art_reel_oil: { group: 'care', file: 'reel_oil.png', nameKo: '릴 오일', nameEn: 'Reel oil', aspect: '3:4', refs: REF_METAL,
    look: '릴 오일 한 병 — 끝이 가는 바늘 꼭지(정밀 주유구)가 달린 작은 투명 플라스틱 병, 안에 황금색 기름이 보이고 빨간 뚜껑. 글자 없음.' },
  art_carekit: { group: 'care', file: 'carekit.png', nameKo: '도구 케어 세트', nameEn: 'Tackle care kit', aspect: '4:3', refs: REF_METAL,
    look: '낚시 도구 손질 세트 — 뚜껑이 열린 작은 회색 플라스틱 케이스 안에 오일 병 하나, 그리스 튜브 하나, 작은 솔, 접힌 노란 천이 칸칸이 들어 있다. 비스듬히 위에서 본 모습.' },
  art_junk_parts: { group: 'care', file: 'junk_parts.png', nameKo: '낡은 릴 부품', nameEn: 'Old reel parts', aspect: '4:3', refs: REF_METAL,
    look: '낡은 릴 부품 한 무더기 — 녹슨 금속 톱니바퀴 몇 개, 휜 반원 철사(베일), 작은 나사 · 스프링, 금이 간 스풀 하나가 서로 엉켜 한 무더기.' },
  art_toolset_rod: { group: 'care', file: 'toolset_rod.png', nameKo: '로드 빌딩 공구 세트', nameEn: 'Rod building tool roll', aspect: '4:3', refs: REF_METAL,
    look: '로드 빌딩 공구 세트 — 펼친 갈색 캔버스 공구말이 안에 작은 줄칼, 가이드를 감는 실 실패 두 개(빨강 · 금색), 작은 붓, 작은 칼이 주머니마다 꽂혀 있다.' },
  art_spray: { group: 'care', file: 'spray.png', nameKo: '장비용 방청 스프레이', nameEn: 'Gear protectant spray', aspect: '3:4', refs: REF_METAL,
    look: '낚시 장비용 방청 · 윤활 스프레이 한 캔 — 원통형 스프레이 깡통(파랑 · 은색 라벨, 글자 없음), 위에 흰 분사 꼭지와 투명 뚜껑.' },
};

const STYLE_INTRO = '첨부한 그림 세 장은 화풍 참고용입니다. 이 그림들과 같은 픽셀 아트 화풍으로 낚시 장비(또는 낚시꾼의 물건) 하나를 새로 그려 주세요. '
  + '같은 도트 크기, 물건 둘레 전체를 감싸는 진한 윤곽선, 밝은 하이라이트와 어두운 그늘의 단계, 사실적인 색과 재질(금속 · 플라스틱 · 천 · 고무 · 나무) 표현을 맞춥니다. '
  + '참고 그림 속 물건은 그리지 마세요(설명이 같은 모양 · 같은 각도를 요구할 때만 따라 합니다).';
/** 수량 문구 — 「한 덩어리로」만 쓰면 짝이 엉켜 세 짝 · 네 짝으로 보인다(255차 사용자 지적 — 기모 장갑 · 갯바위 단화). 짝 물건은 `pair: true` */
const quantityText = (it) => (it.pair
  ? '수량: 한 켤레 = 왼쪽 한 짝과 오른쪽 한 짝, 정확히 두 짝만. 세 짝 이상 · 한 짝만 · 따로 떨어진 밑창이나 조각을 그리지 않는다. '
    + '두 짝은 나란히 놓고(살짝만 겹쳐도 됨) 짝마다 모양 전체(손가락 다섯 개 · 신발 앞코부터 뒤꿈치까지)가 보이게. '
  : '그 물건 하나만(한 벌은 한 덩어리로), ');
const taskText = (it) => `그릴 것: ${it.nameKo} (${it.nameEn}). ${it.look}\n`
  + `조건: 순백색 단색 배경. ${quantityText(it)}화면 가운데에 크게, 끝까지 잘리지 않게. `
  + '사람 손 · 물 · 바위 · 바닥 · 그림자 · 글자 · 숫자 · 로고 · 상표 · 테두리 없음. 사진이 아니라 픽셀 아트.';

function parseArgs(argv) {
  const P = { out: '', only: null, group: '', model: 'gemini-nano-banana-2.1', jobs: 4, tries: 4, tag: '', force: false, dry: false, install: false, grid: 192 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--out') P.out = v();
    else if (a === '--only') P.only = new Set(v().split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--group') P.group = v();
    else if (a === '--model') P.model = v();
    else if (a === '--jobs') P.jobs = Math.max(1, +v());
    else if (a === '--tries') P.tries = Math.max(1, +v());
    else if (a === '--tag') P.tag = v();
    else if (a === '--force') P.force = true;
    else if (a === '--dry') P.dry = true;
    else if (a === '--install') P.install = true;
    else if (a === '--grid') P.grid = Math.max(0, +v());
  }
  if (!P.out) { console.error('--out <폴더>가 필요하다'); process.exit(1); }
  return P;
}

const picked = (P, key) => (!P.only || P.only.has(key)) && (!P.group || LOOKS[key].group === P.group);
const outName = (key, tag) => `${key}${tag ? `.${tag}` : ''}`;

/** 참고 그림 — 흰 바탕에 얹어 긴 변 512px PNG로 한 번만 만든다 */
function refPart(outDir, file) {
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, file);
  if (!fs.existsSync(dst)) execFileSync('convert', [path.join(SRC, file), '-background', 'white', '-alpha', 'remove', '-resize', '512x512>', `PNG24:${dst}`]);
  return { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateOne(key, it, P) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: STYLE_INTRO }, ...it.refs.map((f) => refPart(P.out, f)), { text: taskText(it) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: it.aspect } },
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
    const name = outName(key, P.tag);
    // ⚠ 임시 파일 이름에 확장자 `.raw`를 쓰지 않는다 — ImageMagick이 날 픽셀로 읽는다(247)
    const tmp = path.join(os.tmpdir(), `gta_${name}_${process.pid}`);
    fs.writeFileSync(tmp, Buffer.from(img.data, 'base64'));
    execFileSync('convert', [tmp, '-depth', '8', `PNG32:${path.join(P.out, `${name}.png`)}`]);
    fs.rmSync(tmp, { force: true });
    const u = j.usageMetadata ?? {};
    fs.appendFileSync(path.join(P.out, '_log.jsonl'), JSON.stringify({
      key, file: `${name}.png`, model: P.model, attempt, ms, mime: img.mimeType ?? img.mime_type,
      inTok: u.promptTokenCount, outTok: u.candidatesTokenCount, at: new Date().toISOString(),
    }) + '\n');
    return { ok: true, ms, attempt };
  }
  return { ok: false, err: last };
}

/**
 * 배경 벗기기 — 테두리에서 닿는 배경색(흰색) 픽셀을 지우고, **가장 큰 덩어리의 2% 이상인 조각은 모두 남긴다**
 * (장갑 한 켤레 · 경단 세 알처럼 떨어진 조각 — 작물 도구 `cutout`은 가장 큰 덩어리 하나만 남긴다).
 * 윤곽선 안에 갇힌 순백 배경(그물코 · 손잡이 고리)도 뺀다 — 표에서 `keepWhite: true`면 끈다(순백 면이 넓은 물건).
 * 섬은 12px 이상만 뺀다(눈알 반짝임 같은 작은 하이라이트를 지키려고) — 그물 장비(`mesh: true`)는 2px 그물코까지 뺀다.
 */
function cutoutMulti(img, tol, holes = true, mesh = false) {
  const { w, h, data } = img;
  const samp = [[], [], []];
  const push = (x, y) => { const o = (y * w + x) * 4; samp[0].push(data[o]); samp[1].push(data[o + 1]); samp[2].push(data[o + 2]); };
  for (let x = 0; x < w; x += 2) { push(x, 0); push(x, 1); push(x, h - 1); push(x, h - 2); }
  for (let y = 0; y < h; y += 2) { push(0, y); push(1, y); push(w - 1, y); push(w - 2, y); }
  const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
  const bg = [med(samp[0]), med(samp[1]), med(samp[2])];
  const L = (o) => 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  const lightBg = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) > 200;
  const sat = (o) => { const mx = Math.max(data[o], data[o + 1], data[o + 2]), mn = Math.min(data[o], data[o + 1], data[o + 2]); return mx ? (mx - mn) / mx : 0; };
  const bgLike = (o) => (Math.hypot(data[o] - bg[0], data[o + 1] - bg[1], data[o + 2] - bg[2]) < tol && sat(o) < 0.12) || (lightBg && sat(o) < 0.07 && L(o) > 228);
  const mark = new Uint8Array(w * h);
  const st = [];
  for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
  while (st.length) {
    const i = st.pop();
    if (mark[i] || !bgLike(i * 4)) continue;
    mark[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w);
  }
  const comp = new Int32Array(w * h).fill(-1);
  const sizes = [];
  for (let s = 0; s < w * h; s++) {
    if (mark[s] || comp[s] >= 0) continue;
    const id = sizes.length; let n = 0; const q = [s]; comp[s] = id;
    while (q.length) {
      const i = q.pop(); n++;
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !mark[j] && comp[j] < 0) { comp[j] = id; q.push(j); }
    }
    sizes.push(n);
  }
  const big = Math.max(0, ...sizes);
  const keep = new Set(sizes.map((n, id) => (n >= Math.max(300, big * 0.02) ? id : -1)).filter((id) => id >= 0));
  // 갇힌 배경 섬(그물코 · 손잡이 고리 · 가이드 고리 안) — 작물 도구(245차)와 같은 기준: 무채 흰 섬의 둘레 평균 밝기 < 180이고
  //   섬 색이 배경과 같은 순백(최소 채널 평균 ≥ 248)일 때만 뺀다. 흰 물건의 면(쿨러 · 목장갑)은 그늘이 있어 248 아래라 남는다.
  const hole = new Uint8Array(w * h);
  let nh = 0, hpx = 0;
  if (holes && lightBg) {
    // 그물(`mesh`)은 선이 가늘어 둘레에 번진 밝은 픽셀이 섞인다 — 흰 기준 · 둘레 기준을 넓히고 2px 그물코까지 뺀다
    const whiteish = mesh ? (o) => sat(o) < 0.10 && L(o) > 215 : (o) => sat(o) < 0.06 && L(o) > 235;
    const minHole = mesh ? 2 : 12, ringMax = mesh ? 230 : 180, whiteMin = mesh ? 232 : 248;
    const seen = new Uint8Array(w * h);
    for (let s0 = 0; s0 < w * h; s0++) {
      if (mark[s0] || seen[s0] || !whiteish(s0 * 4)) continue;
      const q = [s0]; seen[s0] = 1; const mem = []; const ring = new Set(); let minSum = 0;
      while (q.length) {
        const i = q.pop(); mem.push(i);
        const o = i * 4; minSum += Math.min(data[o], data[o + 1], data[o + 2]);
        const x = i % w, y = (i / w) | 0;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
          if (j < 0) continue;
          if (!mark[j] && whiteish(j * 4)) { if (!seen[j]) { seen[j] = 1; q.push(j); } } else ring.add(j);
        }
      }
      if (mem.length < minHole) continue;
      let ringL = 0;
      for (const j of ring) ringL += L(j * 4);
      if (ringL / ring.size < ringMax && minSum / mem.length >= whiteMin && mem.length < w * h * 0.03) { for (const i of mem) hole[i] = 1; nh++; hpx += mem.length; }
    }
  }
  const out = Buffer.from(data);
  let dropped = 0;
  for (let i = 0; i < w * h; i++) {
    if (mark[i] || hole[i] || !keep.has(comp[i])) { if (!mark[i] && !hole[i]) dropped++; out[i * 4 + 3] = 0; }
  }
  return { data: out, note: `조각 ${keep.size}/${sizes.length} · 버린 부스러기 ${dropped}px · 갇힌 배경 ${nh}곳 ${hpx}px` };
}

/** 검수를 마친 `<out>/<키>.png` → 배경 벗기기 → 번짐 벗기기 → 타이트 크롭 + 투명 여백 → 격자 정규화(셀 6px) → `food assets/tackle/<파일>` */
async function install(P) {
  const { DEFAULTS, decodeAny } = require('./pixelize_crops.cjs');
  const { peelFringe, regrid } = require('./gemini_fish_art.cjs');
  const { encode } = require('./lib_png.cjs');
  fs.mkdirSync(SRC, { recursive: true });
  const PAD = 2;
  let n = 0;
  for (const [key, it] of Object.entries(LOOKS)) {
    if (!picked(P, key)) continue;
    const src = path.join(P.out, `${key}.png`);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(SRC, it.file);
    if (fs.existsSync(dst) && !P.force) { console.log(`${path.relative(ROOT, dst)}: 이미 있어 건너뛴다(--force로 덮기)`); continue; }
    const img = await decodeAny(src);
    const w = img.w, h = img.h;
    const cut = cutoutMulti(img, DEFAULTS.tol, !it.keepWhite, !!it.mesh);
    const d = cut.data;
    const pf = peelFringe(d, w, h);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { console.error(`${key}: 전경이 없다`); continue; }
    const bw = x1 - x0 + 1 + PAD * 2, bh = y1 - y0 + 1 + PAD * 2;
    const out = Buffer.alloc(bw * bh * 4);
    for (let y = y0; y <= y1; y++) d.copy(out, ((y - y0 + PAD) * bw + PAD) * 4, (y * w + x0) * 4, (y * w + x1 + 1) * 4);
    for (let i = 0; i < bw * bh; i++) if (out[i * 4 + 3] === 0) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0;
    let fin = { w: bw, h: bh, data: out }, gridNote = '';
    if (P.grid > 0) {
      const g = regrid(out, bw, bh, P.grid, DEFAULTS.cell);
      const pw = g.w + DEFAULTS.cell * 2, ph = g.h + DEFAULTS.cell * 2, padded = Buffer.alloc(pw * ph * 4);
      for (let y = 0; y < g.h; y++) g.data.copy(padded, ((y + DEFAULTS.cell) * pw + DEFAULTS.cell) * 4, y * g.w * 4, (y + 1) * g.w * 4);
      fin = { w: pw, h: ph, data: padded };
      gridNote = ` · 격자 ${g.cw}×${g.ch}칸(셀 ${DEFAULTS.cell}px)`;
    }
    const bytes = encode(fin.w, fin.h, fin.data, dst);
    console.log(`${key} → ${path.relative(ROOT, dst)}: ${w}x${h} → ${fin.w}x${fin.h} (${(bytes / 1024).toFixed(0)}KB) · ${cut.note} · 번짐 ${pf.peeled}px${gridNote}`);
    n++;
  }
  console.log(`${n}장 설치 → 이제 node tools/tackle_cards.cjs`);
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  fs.mkdirSync(P.out, { recursive: true });
  if (P.install) { await install(P); return; }
  const list = Object.keys(LOOKS).filter((k) => picked(P, k))
    .filter((k) => P.force || !fs.existsSync(path.join(P.out, `${outName(k, P.tag)}.png`)));
  console.log(`대상 ${list.length}장 · 모델 ${P.model} · 동시 ${P.jobs}`);
  if (P.dry) { for (const k of list) console.log(`${outName(k, P.tag)} [${LOOKS[k].aspect} · 참고 ${LOOKS[k].refs.join(', ')}]\n${taskText(LOOKS[k])}\n`); return; }
  let next = 0, done = 0, fail = 0;
  const failed = [];
  const worker = async () => {
    while (next < list.length) {
      const k = list[next++];
      const r = await generateOne(k, LOOKS[k], P);
      if (r.ok) { done++; console.log(`[${done + fail}/${list.length}] ${outName(k, P.tag)} — ${r.ms}ms${r.attempt > 1 ? ` (시도 ${r.attempt})` : ''}`); }
      else { fail++; failed.push(outName(k, P.tag)); console.log(`[${done + fail}/${list.length}] ${outName(k, P.tag)} — 실패: ${r.err}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(P.jobs, list.length) }, worker));
  console.log(`끝: 성공 ${done} · 실패 ${fail}${failed.length ? ` (${failed.join(', ')})` : ''}`);
}

module.exports = { LOOKS, STYLE_INTRO, taskText, cutoutMulti };
if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
