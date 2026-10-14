/**
 * @file gemini_forage_art.cjs
 * @description 248차 — 그림이 없던 갯것(해루질 생물) 10종 · 땅지렁이를 Gemini 그림 모델로 그린다.
 *
 *  어종 도구(`gemini_fish_art.cjs`)와 같은 길이다 — 생김새 설명 + 사용자가 그려 온 갯것 그림 3장을 화풍 참고로 보낸다.
 *  키는 환경의 네트워크 시크릿을 에이전트 프록시가 붙인다(이 스크립트 · 저장소에는 키가 없다).
 *  ⚠ Node 내장 fetch는 HTTPS_PROXY를 읽지 않는다 — 반드시 `NODE_USE_ENV_PROXY=1`로 돌린다.
 *
 *  그림은 두 가지다.
 *   - **초상**(`<id>.png`) — 가방 · 상세 · 도감 · 위키. 사용자 그림처럼 그 생물이 가장 잘 읽히는 모습.
 *   - **위에서 본 그림**(`<id>.top.png`) — 채집 놀이 판(44px)과 필드 점 그림(16px). 탑다운 화면에 놓인 모습.
 *     초상이 이미 위에서 본 모습인 것(게 · 조개 · 굴 · 홍합 · 지렁이)은 따로 그리지 않고 초상을 쓴다(표의 `top`이 없다).
 *     판 그림은 **머리(앞)가 왼쪽**이다 — 판이 오른쪽으로 달릴 때 좌우로 뒤집는다(`ForageGamePanel.setCreature`).
 *
 *  사용:
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_forage_art.cjs --out <폴더> [--view portrait|top|both] [--only turbo_cornutus,earthworm]
 *        [--model gemini-nano-banana-2.1] [--jobs 3] [--tries 4] [--tag v2] [--force] [--dry]
 *    결과: <폴더>/<id>[.top][.<tag>].png(PNG32) + <폴더>/_log.jsonl
 *    검수 뒤 `--install`(고른 판은 태그 없는 이름으로 둔다): 배경 벗기기 → 번짐 벗기기 → 타이트 크롭 →
 *      초상은 격자 정규화(긴 변 192칸 · 셀 6px — 어종 기준) 뒤 `food assets/forage/art/<id>.png`,
 *      위에서 본 그림은 긴 변 640px로만 줄여 `food assets/forage/top/<id>.png`(작게 줄여 쓰므로 격자를 맞추지 않는다).
 *    그다음 `node tools/forage_cards.cjs`가 게임용 카드 · 아이콘 · 판 그림 · 점 그림을 굽는다.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ART = path.join(ROOT, 'food assets', 'forage', 'art');
const TOP = path.join(ROOT, 'food assets', 'forage', 'top');
const API = 'https://generativelanguage.googleapis.com/v1beta/models';
/** 위에서 본 그림 원본의 긴 변(작게 줄여서만 쓴다) */
const TOP_MAX = 640;

/** 화풍 참고 묶음(`food assets/forage/art/` — 사용자가 그려 온 갯것 그림) */
const REF_SHELL = ['haliotis_diversicolor.png', 'aplysia_kurodai.png', 'stichopus_japonicus.png'];
const REF_CRAB = ['portunus_trituberculatus.png', 'hemigrapsus_sanguineus.png', 'haliotis_diversicolor.png'];
const REF_SOFT = ['aplysia_kurodai.png', 'stichopus_japonicus.png', 'haliotis_diversicolor.png'];
const REF_WORM = ['perinereis_aibuhitensis.png', 'aplysia_kurodai.png', 'haliotis_diversicolor.png'];

/**
 * 생물 id(core `SHORE_CREATURE_DATABASE` · 땅지렁이는 `earthworm`) → 이름 · 비율 · 참고 · 생김새.
 * `top`이 있으면 위에서 본 그림을 따로 그린다. 이웃 종과 헷갈리기 쉬운 것은 다른 점을 적는다(전복 ↔ 오분자기 · 낙지 ↔ 주꾸미 · 민꽃게 ↔ 꽃게).
 */
const LOOKS = {
  clam_varicosa: {
    nameKo: '바지락', nameEn: 'Manila clam', sci: 'Ruditapes philippinarum', aspect: '4:3', refs: REF_SHELL,
    // 248차 1판은 꼭지가 가운데인 둥근 삼각형(백합 · 대합 꼴)이었다 — 꼭지 위치와 긴 뒤끝을 짚는다
    look: '바지락 한 개를 껍데기 바깥면이 보이게 옆에서 본 모습. 가로로 긴 타원 · 둥근 사다리꼴 조개(길이가 높이의 1.5배쯤)로, 작은 꼭지(각정)가 가운데가 아니라 왼쪽 3분의 1 지점에 치우쳐 있고, '
      + '꼭지 오른쪽(뒤쪽) 껍데기가 길게 늘어나 끝이 뭉툭하고 네모지게 둥글다. 백합 · 대합처럼 꼭지가 가운데인 둥근 삼각형이 아니다. '
      + '껍데기 겉에 꼭지에서 퍼지는 가는 줄(방사륵)과 가로로 겹친 성장선이 엇갈려 잔 격자 무늬가 된다. '
      + '색은 회백색 · 크림 바탕에 갈색 · 짙은 회갈색 물결(지그재그) 무늬와 얼룩이 섞여 있다(개체마다 무늬가 다른 바지락 특유의 모습). 껍데기는 닫혀 있다.',
  },
  turbo_cornutus: {
    nameKo: '소라', nameEn: 'Horned turban', sci: 'Turbo cornutus', aspect: '1:1', refs: REF_SHELL,
    look: '소라(뿔소라) 한 개를 옆에서 본 모습. 두껍고 단단한 팽이 모양 고둥으로, 나층(돌아가는 층)마다 굵은 대롱 모양 가시(뿔)가 한 줄씩 바깥으로 뻗어 있다(어깨 줄 가시가 가장 크다). '
      + '껍데기 겉은 거친 짙은 녹갈색 · 올리브색에 하얀 석회 얼룩이 조금 붙어 있다. 아래쪽에 둥근 입구가 보이고, 그 입구를 두껍고 흰 석회질 뚜껑(매끈한 하얀 단추 모양에 소용돌이 무늬)이 막고 있다.',
    top: { aspect: '1:1',
      look: '소라를 위에서 똑바로 내려다본 모습. 꼭대기(뾰족한 탑)가 가운데에 있고 나층이 소용돌이로 돌아 나가며, 각 층의 대롱 모양 가시가 바깥으로 별처럼 뻗는다. '
        + '짙은 녹갈색 · 올리브색 껍데기에 하얀 석회 얼룩, 가시 끝은 밝은 갈색. 입구와 뚜껑은 아래에 있어 보이지 않는다.' },
  },
  oyster_gigas: {
    nameKo: '굴', nameEn: 'Pacific oyster', sci: 'Crassostrea gigas', aspect: '4:3', refs: REF_SHELL,
    look: '참굴 한 개를 닫힌 채 위(평평한 윗껍데기)에서 본 모습. 길쭉한 물방울 · 혀 모양으로 왼쪽(꼭지 쪽)이 좁고 오른쪽이 넓다. '
      + '껍데기 가장자리가 얇은 판이 여러 겹 겹친 주름(프릴)처럼 울퉁불퉁 물결치고, 겉면은 거칠게 겹겹이 일어난 층 무늬다. '
      + '색은 회백색 · 연회색 바탕에 보랏빛 · 갈색 줄과 얼룩. 바위에서 떼어 낸 한 개만.',
  },
  haliotis_discus: {
    nameKo: '전복(참전복)', nameEn: 'Pacific abalone', sci: 'Haliotis discus hannai', aspect: '4:3', refs: REF_SHELL,
    look: '참전복 한 마리를 비스듬히 위에서 본 모습. 귀 모양의 납작한 타원형 껍데기(길이 10cm쯤)로, 오른쪽 끝에 작게 말린 꼭지(나탑)가 있다. '
      + '껍데기 겉은 거칠고 짙은 녹갈색 · 적갈색 바탕에 물결 같은 성장 주름. 한쪽 가장자리를 따라 구멍 줄이 늘어서고, 그중 앞쪽 4~5개만 대롱처럼 솟은 채 뚫려 있다(나머지는 막힌 혹). '
      + '껍데기 아래로 두툼한 근육 발과 가장자리의 검은 녹색 촉수 술이 조금 보인다. 오분자기보다 크고, 뚫린 구멍이 적으며 솟아 있다.',
    top: { aspect: '4:3',
      look: '참전복을 위에서 똑바로 내려다본 모습. 길쭉한 귀 모양 타원 껍데기, 오른쪽 끝에 작은 꼭지, 한쪽 가장자리를 따라 솟은 구멍 4~5개와 막힌 혹 줄. '
        + '짙은 녹갈색 · 적갈색 껍데기에 성장 주름. 껍데기 둘레로 검은 녹색 촉수 술이 살짝 비어져 나온다.' },
  },
  charybdis_japonica: {
    nameKo: '민꽃게(돌게)', nameEn: 'Asian paddle crab', sci: 'Charybdis japonica', aspect: '4:3', refs: REF_CRAB,
    look: '민꽃게(돌게)를 등 쪽에서 위로 내려다본 모습(참고 그림의 꽃게처럼 집게발이 위로 오게). 등딱지는 폭이 길이보다 조금 넓은 부채꼴 · 육각형에 가깝고, 앞쪽 양옆 가장자리에 날카로운 톱니가 6개씩 있다. '
      + '몸 색은 짙은 올리브 녹색 · 녹갈색에 보랏빛이 돌고, 집게발은 크고 단단하며 가시가 있고 끝이 짙은 갈색 · 보라색이다. 걷는 다리 세 쌍과 맨 뒤의 납작한 노 모양 헤엄다리 한 쌍. '
      + '꽃게처럼 등딱지 양 끝에 길게 뻗은 가시는 없다.',
  },
  octopus_minor: {
    nameKo: '낙지', nameEn: 'Long-arm octopus', sci: 'Octopus minor', aspect: '4:3', refs: REF_SOFT,
    look: '낙지 한 마리를 옆에서 본 모습. 몸통(외투막)은 길쭉한 달걀꼴로 작고, 다리 여덟 개는 몸통보다 서너 배 길고 가늘다 — 문어처럼 굵지 않고 실처럼 가늘고 길다. '
      + '몸 색은 회갈색 · 연한 적갈색, 매끈한 피부에 잔 점 무늬. 눈은 작고 볼록하다. 다리는 아래와 옆으로 느슨하게 늘어지며 안쪽에 작은 빨판이 줄지어 있다. '
      + '주꾸미처럼 눈 아래 금빛 고리 무늬는 없다.',
    top: { aspect: '16:9',
      look: '낙지를 갯벌 위에서 위로 내려다본 모습. 몸통(외투막)이 왼쪽에 있고, 가늘고 긴 다리 여덟 개가 오른쪽으로 물결치듯 퍼져 뻗는다(다리 길이가 몸통의 서너 배). '
        + '회갈색 · 연한 적갈색 매끈한 피부, 작은 눈 두 개가 몸통 오른쪽 끝(다리가 시작되는 곳)에 보인다.' },
  },
  mytilus_coruscus: {
    nameKo: '홍합(섭)', nameEn: 'Korean mussel', sci: 'Mytilus coruscus', aspect: '16:9', refs: REF_SHELL,
    look: '섭(참홍합) 한 개를 닫힌 채 옆에서 본 모습. 길쭉한 쐐기 · 물방울 모양(길이 12cm쯤)으로 왼쪽 끝(꼭지)이 뾰족하고 오른쪽이 넓고 둥글다. '
      + '껍데기는 두껍고 겉은 윤기 있는 검갈색 · 흑자색, 가장자리 쪽은 갈색 껍질층이며 성장선이 동심원으로 겹겹이 있다. '
      + '겉에 작은 따개비 두세 개가 붙어 있고, 뾰족한 끝 아래로 갈색 수염(족사) 한 줌이 삐져나온다. 진주담치보다 크고 두껍다.',
  },
  omphalius_rusticus: {
    nameKo: '보말(팽이고둥)', nameEn: 'Top shell', sci: 'Omphalius rusticus', aspect: '1:1', refs: REF_SHELL,
    look: '보말(팽이고둥) 한 개를 옆에서 본 모습. 작고 단단한 팽이(원뿔) 모양 고둥으로 높이와 폭이 비슷하다. 나층마다 비스듬한 굵은 주름이 있고, '
      + '색은 짙은 회갈색 · 검은빛에 갈색 · 회색 얼룩. 아래쪽 바닥은 평평하고, 둥근 입구 안쪽과 배꼽 둘레가 진주처럼 하얗게 빛난다.',
    top: { aspect: '1:1',
      look: '보말(팽이고둥)을 위에서 똑바로 내려다본 모습. 둥근 원 안에서 꼭대기를 중심으로 나층이 소용돌이로 돌아 나가고, 나층마다 비스듬한 굵은 주름이 있다. '
        + '짙은 회갈색 · 검은빛 껍데기에 갈색 · 회색 얼룩, 꼭대기는 닳아 하얗게 드러났다.' },
  },
  capitulum_mitella: {
    nameKo: '거북손', nameEn: 'Turtle-hand barnacle', sci: 'Capitulum mitella', aspect: '3:4', refs: REF_SHELL,
    look: '거북손 한 개체를 옆에서 본 모습. 아래는 짧고 굵은 자루(살 부분)로, 겉이 작은 알갱이 비늘로 촘촘히 덮여 뱀 껍질처럼 보이는 회갈색 · 올리브색이다. '
      + '그 위에 단단한 석회 판 여러 장이 거북의 발처럼 모여 위로 부채꼴로 솟는다 — 큰 판 8장 안팎이 가운데 모이고 아래 둘레에 작은 판이 빽빽하다. '
      + '판은 회백색 · 연녹회색이고 끝은 크림색. 바위에서 떼어 낸 한 개만.',
    // 248차 — 위에서 본 그림(판 끝이 모인 길쭉한 꽃 모양)은 거북의 등딱지 · 씨앗처럼 읽혔다 → 판 · 필드도 초상(옆모습)을 쓴다
  },
  cellana_grata: {
    nameKo: '삿갓조개(배말)', nameEn: 'Limpet', sci: 'Cellana grata', aspect: '4:3', refs: REF_SHELL,
    look: '삿갓조개(배말) 한 개를 비스듬히 옆에서 본 모습. 납작한 삿갓(원뿔) 모양 타원 껍데기(길이 4cm쯤)로, 꼭지가 가운데보다 조금 왼쪽에 있다. '
      + '꼭지에서 가장자리로 굵고 가는 줄기(방사륵)가 퍼지고, 가장자리는 줄기 끝이 살짝 톱니처럼 나온다. 색은 크림 · 올리브 회색 바탕에 꼭지에서 퍼지는 짙은 갈색 · 검은 방사 줄무늬.',
    top: { aspect: '4:3',
      look: '삿갓조개를 위에서 똑바로 내려다본 모습. 둥근 타원 안에서 꼭지(가운데보다 조금 왼쪽)를 중심으로 줄기가 사방으로 퍼지고, '
        + '크림 · 올리브 회색 바탕에 짙은 갈색 · 검은 방사 줄무늬. 가장자리는 톱니처럼 살짝 물결친다.' },
  },
  earthworm: {
    nameKo: '땅지렁이', nameEn: 'Earthworm', sci: 'Megascolecidae', aspect: '4:3', refs: REF_WORM,
    look: '땅지렁이 한 마리를 위에서 본 모습. 매끈한 원통형 몸이 S자로 느슨하게 굽어 있고, 머리는 왼쪽 · 꼬리는 오른쪽이다. 몸 색은 적갈색 · 자줏빛 분홍, 마디 사이는 조금 밝다. '
      + '몸 전체에 가는 고리 마디가 촘촘하고, 머리 쪽 3분의 1쯤에 두툼하고 밝은 띠(환대)가 하나 있다. 머리 끝은 뾰족하고 꼬리 끝은 조금 납작하다. '
      + '다리 · 털 · 지느러미 없음 — 갯지렁이처럼 몸 옆에 다리 술이 달려 있지 않다.',
  },
};

const STYLE_INTRO = '첨부한 그림 세 장은 화풍 참고용입니다. 이 그림들과 같은 픽셀 아트 화풍으로 바닷가 · 땅의 작은 생물 하나를 새로 그려 주세요. '
  + '같은 도트 크기, 진한 윤곽선, 밝은 하이라이트와 어두운 그늘의 단계, 사실적인 색과 껍데기 · 피부 질감 표현을 맞춥니다. 참고 그림 속 생물은 그리지 마세요.';
const taskText = (it, view) => {
  const look = view === 'top' ? it.top.look : it.look;
  const viewNote = view === 'top' ? ' 탑다운 게임 화면에서 바닥에 놓인 것을 보는 시점입니다.' : '';
  return `그릴 것: ${it.nameKo} (${it.nameEn}, ${it.sci}). ${look}${viewNote}\n`
    + '조건: 순백색 단색 배경. 하나만, 화면 가운데에 크게, 끝까지 잘리지 않게. 물 · 바위 · 모래 · 흙 · 그림자 · 거품 · 글자 · 테두리 없음. 사진이 아니라 픽셀 아트.';
};

function parseArgs(argv) {
  const P = { out: '', only: null, view: 'both', model: 'gemini-nano-banana-2.1', jobs: 3, tries: 4, tag: '', force: false, dry: false, install: false, grid: 192 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--out') P.out = v();
    else if (a === '--only') P.only = new Set(v().split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--view') P.view = v();
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
  if (!['portrait', 'top', 'both'].includes(P.view)) { console.error('--view는 portrait · top · both'); process.exit(1); }
  return P;
}

/** 작업 목록 — (id, 시점). 초상은 원본이 없을 때만(--only면 그것만), 위에서 본 그림은 `top`이 있는 것만 */
function targets(P) {
  const out = [];
  for (const [id, L] of Object.entries(LOOKS)) {
    if (P.only && !P.only.has(id)) continue;
    if (P.view !== 'top' && (P.only || !fs.existsSync(path.join(ART, `${id}.png`)))) out.push({ id, view: 'portrait', aspect: L.aspect, ...L });
    if (P.view !== 'portrait' && L.top && (P.only || !fs.existsSync(path.join(TOP, `${id}.png`)))) out.push({ id, view: 'top', ...L, aspect: L.top.aspect });
  }
  return out;
}

const outName = (t, tag) => `${t.id}${t.view === 'top' ? '.top' : ''}${tag ? `.${tag}` : ''}`;

/** 참고 그림 — 흰 바탕에 얹어 긴 변 512px PNG로 한 번만 만든다 */
function refPart(outDir, file) {
  const dir = path.join(outDir, '_refs');
  fs.mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, file);
  if (!fs.existsSync(dst)) execFileSync('convert', [path.join(ART, file), '-background', 'white', '-alpha', 'remove', '-resize', '512x512>', `PNG24:${dst}`]);
  return { inlineData: { mimeType: 'image/png', data: fs.readFileSync(dst).toString('base64') } };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateOne(it, P) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: STYLE_INTRO }, ...it.refs.map((f) => refPart(P.out, f)), { text: taskText(it, it.view) }] }],
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
    const name = outName(it, P.tag);
    // ⚠ 임시 파일 이름에 확장자 `.raw`를 쓰지 않는다 — ImageMagick이 날 픽셀로 읽는다(247)
    const tmp = path.join(os.tmpdir(), `gfo_${name}_${process.pid}`);
    fs.writeFileSync(tmp, Buffer.from(img.data, 'base64'));
    execFileSync('convert', [tmp, '-depth', '8', `PNG32:${path.join(P.out, `${name}.png`)}`]);
    fs.rmSync(tmp, { force: true });
    const u = j.usageMetadata ?? {};
    fs.appendFileSync(path.join(P.out, '_log.jsonl'), JSON.stringify({
      id: it.id, view: it.view, file: `${name}.png`, model: P.model, attempt, ms, mime: img.mimeType ?? img.mime_type,
      inTok: u.promptTokenCount, outTok: u.candidatesTokenCount, at: new Date().toISOString(),
    }) + '\n');
    return { ok: true, ms, attempt };
  }
  return { ok: false, err: last };
}

/**
 * 검수를 마친 `<out>/<id>.png` · `<out>/<id>.top.png` → 배경 벗기기(그림자 걷기 끔) → 번짐 벗기기 → 타이트 크롭 + 투명 여백 →
 * 초상은 격자 정규화(셀 6px) 뒤 `food assets/forage/art/`, 위에서 본 그림은 `food assets/forage/top/`. 있으면 --force 없이 덮지 않는다.
 */
async function install(P) {
  const { DEFAULTS, decodeAny, cutout, areaResize } = require('./pixelize_crops.cjs');
  const { peelFringe, regrid } = require('./gemini_fish_art.cjs');
  const { encode } = require('./lib_png.cjs');
  fs.mkdirSync(ART, { recursive: true });
  fs.mkdirSync(TOP, { recursive: true });
  const PAD = 2;
  let n = 0;
  for (const id of Object.keys(LOOKS)) {
    if (P.only && !P.only.has(id)) continue;
    for (const view of ['portrait', 'top']) {
      if (P.view !== 'both' && P.view !== view) continue;
      const src = path.join(P.out, `${id}${view === 'top' ? '.top' : ''}.png`);
      if (!fs.existsSync(src)) continue;
      const dst = path.join(view === 'top' ? TOP : ART, `${id}.png`);
      if (fs.existsSync(dst) && !P.force) { console.log(`${path.relative(ROOT, dst)}: 이미 있어 건너뛴다(--force로 덮기)`); continue; }
      const img = await decodeAny(src);
      const w = img.w, h = img.h;
      const cut = cutout(img, { ...DEFAULTS, shadow: 0 });
      const d = Buffer.from(cut.data);
      const pf = peelFringe(d, w, h);
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { console.error(`${id}(${view}): 전경이 없다`); continue; }
      const bw = x1 - x0 + 1 + PAD * 2, bh = y1 - y0 + 1 + PAD * 2;
      const out = Buffer.alloc(bw * bh * 4);
      for (let y = y0; y <= y1; y++) d.copy(out, ((y - y0 + PAD) * bw + PAD) * 4, (y * w + x0) * 4, (y * w + x1 + 1) * 4);
      for (let i = 0; i < bw * bh; i++) if (out[i * 4 + 3] === 0) out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0;
      let fin = { w: bw, h: bh, data: out }, gridNote = '';
      if (view === 'top') {
        // 위에서 본 그림은 판(44px) · 점(24px)으로만 줄여 쓴다 — 긴 변 640px이면 넉넉하다(원본 1MB → 수백 KB)
        const k = Math.min(1, TOP_MAX / Math.max(bw, bh));
        if (k < 1) {
          const tw = Math.max(1, Math.round(bw * k)), th = Math.max(1, Math.round(bh * k));
          fin = { w: tw, h: th, data: areaResize(out, bw, bh, tw, th) };
          gridNote = ` · 긴 변 ${TOP_MAX}px로 줄임`;
        }
      }
      if (view === 'portrait' && P.grid > 0) {
        const g = regrid(out, bw, bh, P.grid, DEFAULTS.cell);
        const pw = g.w + DEFAULTS.cell * 2, ph = g.h + DEFAULTS.cell * 2, padded = Buffer.alloc(pw * ph * 4);
        for (let y = 0; y < g.h; y++) g.data.copy(padded, ((y + DEFAULTS.cell) * pw + DEFAULTS.cell) * 4, y * g.w * 4, (y + 1) * g.w * 4);
        fin = { w: pw, h: ph, data: padded };
        gridNote = ` · 격자 ${g.cw}×${g.ch}칸(셀 ${DEFAULTS.cell}px)`;
      }
      const bytes = encode(fin.w, fin.h, fin.data, dst);
      console.log(`${id}(${view}) → ${path.relative(ROOT, dst)}: ${w}x${h} → ${fin.w}x${fin.h} (${(bytes / 1024).toFixed(0)}KB) · ${cut.note} · 번짐 ${pf.peeled}px · 부스러기 ${pf.crumbs}px${gridNote}`);
      n++;
    }
  }
  console.log(`${n}장 설치 → 이제 node tools/forage_cards.cjs`);
}

async function main() {
  const P = parseArgs(process.argv.slice(2));
  fs.mkdirSync(P.out, { recursive: true });
  if (P.install) { await install(P); return; }
  const list = targets(P).filter((t) => P.force || !fs.existsSync(path.join(P.out, `${outName(t, P.tag)}.png`)));
  console.log(`대상 ${list.length}장 · 모델 ${P.model} · 동시 ${P.jobs}`);
  if (P.dry) { for (const t of list) console.log(`${outName(t, P.tag)} [${t.aspect} · 참고 ${t.refs.join(', ')}]\n${STYLE_INTRO}\n${taskText(t, t.view)}\n`); return; }
  let next = 0, done = 0, fail = 0;
  const failed = [];
  const worker = async () => {
    while (next < list.length) {
      const it = list[next++];
      const r = await generateOne(it, P);
      if (r.ok) { done++; console.log(`[${done + fail}/${list.length}] ${outName(it, P.tag)} — ${r.ms}ms${r.attempt > 1 ? ` (시도 ${r.attempt})` : ''}`); }
      else { fail++; failed.push(outName(it, P.tag)); console.log(`[${done + fail}/${list.length}] ${outName(it, P.tag)} — 실패: ${r.err}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(P.jobs, list.length) }, worker));
  console.log(`끝: 성공 ${done} · 실패 ${fail}${failed.length ? ` (${failed.join(', ')})` : ''}`);
}

module.exports = { LOOKS, STYLE_INTRO, taskText };
if (require.main === module) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
