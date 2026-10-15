/**
 * @file gemini_bgm.cjs
 * @description 253차 — 배경음(BGM) 후보 초안을 Gemini 음악 모델(Lyria)로 뽑는다.
 *
 *  - 모델: `lyria-3-pro-preview`(기본 — 약 3분 · 구간 표시 [[A0]] [[B1]] … · 응답 기록상 lyria-3.5) ·
 *    `lyria-3-clip-preview`(30초 클립 — 분위기만 빨리 볼 때). 둘 다 `generateContent` · 응답은 audio/mpeg(44.1kHz 스테레오 192kbps).
 *  - 값(253차 확인 기준 · 바뀔 수 있다): 클립 한 곡 약 0.04달러 · Pro 한 곡 약 0.08달러. 선불 크레딧이 바닥나면 402 「prepayment credits are depleted」.
 *  - 키는 환경의 네트워크 시크릿을 에이전트 프록시가 붙인다(이 스크립트 · 저장소에는 키가 없다).
 *    ⚠ Node 내장 fetch는 HTTPS_PROXY를 읽지 않는다 — 반드시 `NODE_USE_ENV_PROXY=1`로 돌린다.
 *  - 곡 표(`TRACKS`)는 장면 하나에 한 줄(253차 2판 — 사용자 의견 반영 · `rain` 뺌 · 집 · 시장은 두 판) — 영어 프롬프트(모델용)와 한국어 설명(문서 · 보고용). 반복 재생을 전제로
 *    「보컬 없음 · 시작과 끝이 같은 분위기 · 큰 클라이맥스 없음」을 공통 꼬리(`COMMON`)로 붙인다.
 *
 *  사용:
 *    NODE_USE_ENV_PROXY=1 node tools/gemini_bgm.cjs --out <폴더> [--only menu,field_day] [--model lyria-3-clip-preview]
 *        [--jobs 3] [--tries 3] [--tag v2] [--force] [--dry]
 *    결과: <폴더>/<키>[.<tag>].mp3 + <폴더>/_log.jsonl(모델 · 걸린 시간 · 길이 · 구간 표시 · 프롬프트)
 *  게임에 넣는 것은 사용자가 고른 뒤다(반복 이음매 · 볼륨 맞추기 — 백로그 BZ).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const API = 'https://generativelanguage.googleapis.com/v1beta/models';

/** 모든 곡 공통 — 게임 배경음으로 반복해 틀 것 */
const COMMON = ' Instrumental only, absolutely no vocals or choir words. Designed as looping background music for a cozy pixel-art game: '
  + 'steady energy from start to end, no big climax, no abrupt stop, ending in the same mood it began so it can loop. Clean mix, not loud.';

/**
 * 장면별 후보 — key · 한국어 설명 · 프롬프트.
 * 253차 사용자 의견(1판 → 2판): menu · field_day_chip · field_night 「괜찮아 보임」(그대로) ·
 *  field_day 「너무 신남 → 산뜻하게 절제」 · fishing_wait 「더 느리게」 · home 「카페 노래 같음 → 주인공 집이라는 설정」 ·
 *  farm 「조금 더 느긋하게」 · market 「중국풍 · 신남 → 절제」(두 판) · rain 「필요 없음 — 빗소리는 효과음으로」(뺐다).
 */
const TRACKS = {
  menu: {
    ko: '메인 메뉴 — 새벽 항구 · 따뜻한 칩튠 아르페지오 · 잔잔한 파도 · 그리움',
    prompt: 'Title screen theme for a Korean seaside fishing game at dawn. Warm nostalgic chiptune: soft 8-bit square-wave arpeggios, '
      + 'a gentle pulse bass, a simple memorable lead melody, light seagull-like synth chirps, distant ocean wave texture. 82 BPM, major key with a hint of longing.',
  },
  field_day: {
    ko: '낮 항구 필드(속초) 2판 — 산뜻하되 절제 · 손가락으로 뜯는 기타 · 목관 선율 · 타악 거의 없음 · 84BPM',
    prompt: 'Daytime harbor town exploration music for a fishing life-sim set in Sokcho, Korea. Fresh and airy but restrained: gentle fingerpicked acoustic guitar, '
      + 'soft glockenspiel accents, warm upright bass, a clear simple woodwind melody (flute or clarinet), very light brushed percussion or none at all. '
      + 'No strumming, no driving beat, not dance-like, not energetic. 84 BPM, laid-back, breezy morning sea air, calm and pleasant.',
  },
  field_day_chip: {
    ko: '낮 항구 필드 · 다른 결 — 16비트 콘솔 풍(마림바 · 플루트 신스 · 통통 튀는 베이스)',
    prompt: '16-bit console era overworld theme for a seaside fishing village. Bright marimba and flute synth melody, bouncy slap-style synth bass, '
      + 'soft drum machine with brushed snare, little bell accents like boat buoys. 100 BPM, cheerful but calm, cozy SNES-like warmth.',
  },
  field_night: {
    ko: '밤바다 필드 — 신스 패드 · 낮은 피아노 · 파도와 바람 · 고요하게',
    prompt: 'Night harbor ambience music: slow warm synth pads, sparse low piano notes, a soft electric piano motif, gentle sub bass swells, '
      + 'faint waves and wind texture, distant lighthouse feeling. 70 BPM, calm, a little lonely but comforting, very spacious.',
  },
  fishing_wait: {
    ko: '1인칭 낚시(기다림) 2판 — 더 느리게 · 박자 없음 · 넓은 패드 · 띄엄띄엄 피아노 · 물결 반짝임',
    prompt: 'Very slow, calm focus music for waiting for a bite on a breakwater. Ambient and spacious: slowly evolving warm pads, '
      + 'a sparse soft piano or clean electric piano motif with long gaps between phrases, a gentle water-like shimmer, no percussion and no pulse. '
      + 'Around 56 BPM feel, patient and meditative, like watching a float bob on calm water at sunset.',
  },
  home: {
    ko: '집 2판(가) — 아버지가 남긴 옛집 · 가까이서 녹음한 업라이트 피아노 · 나일론 기타 · 오르골 · 드럼 없음',
    prompt: "Theme for the main character's home: an old family house left by their late father in a quiet Korean country hometown. "
      + 'Intimate solo upright piano recorded close with soft felt, playing a simple tender melody; gentle nylon-string guitar arpeggios underneath; '
      + 'a faint music-box (celesta) motif like a childhood memory; very soft strings. No drums, no hip-hop beat, no jazz chords, no vinyl crackle — not cafe music. '
      + '72 BPM, warm lamplight in a small wooden room, nostalgic and a little bittersweet, but safe and comforting: a place to rest after a day at sea.',
  },
  home_b: {
    ko: '집 2판(나) — 시골 마을 옛 목조집의 저녁 · 기타 아르페지오 · 풍금 긴 화음 · 클라리넷 · 드럼 없음',
    prompt: "Quiet evening theme for an old wooden house in a quiet Korean village, the home the main character inherited from their late father. "
      + 'Soft acoustic guitar fingerpicking and a gentle reed organ holding long simple chords, a lonely clarinet melody that comes and goes, faint room ambience. '
      + 'Plain folk harmony; no drums, not jazz, not lo-fi, not cafe-like. 72 BPM, tender, reflective, homely and safe.',
  },
  farm: {
    ko: '텃밭 2판 — 더 느긋하게 · 손가락 기타 · 나무 피리 · 글로켄슈필 · 손북 아주 드물게 · 76BPM',
    prompt: 'Pastoral garden farming theme for a small vegetable plot by the sea, slow and unhurried. Fingerpicked acoustic guitar, '
      + 'soft wooden flute or recorder melody, light glockenspiel, a gentle hand drum played very sparsely. 76 BPM, lazy sunny afternoon, humble, content, relaxed.',
  },
  market: {
    ko: '시장 · 마을 2판(가) — 절제 · 나일론 기타 · 아코디언 · 비브라폰 · 서양 포크 화성(5음계 · 중국풍 악기 없음) · 88BPM',
    prompt: 'Restrained morning fish-market theme for a Korean seaside town, gentle and warm rather than festive. Nylon-string guitar and a soft accordion melody, '
      + 'warm upright bass, light brushed snare and shaker, a little vibraphone. Major key with simple Western folk harmony; '
      + 'avoid pentatonic or Chinese-sounding melodies; no gongs, no erhu, no guzheng, no taiko, no festival drums. 88 BPM, friendly background bustle, calm and unhurried.',
  },
  market_b: {
    ko: '시장 · 마을 2판(나) — 절제 · 부드러운 칩튠 선율 + 어쿠스틱 기타 · 가벼운 손 타악 · 장조 · 86BPM',
    prompt: 'Calm harbor market theme for a cozy pixel-art fishing game: a soft chiptune square-wave lead blended with acoustic guitar and piano, '
      + 'round bass, light hand percussion (shaker, soft claps far in the background). Major key, simple diatonic melody; '
      + 'no Asian pentatonic clichés, no gongs or traditional festival drums. 86 BPM, everyday life at the harbor, warm, restrained.',
  },
};

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function durationOf(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' });
    return Math.round(parseFloat(out) * 10) / 10;
  } catch { return null; }
}

async function generate(key, P) {
  const t = TRACKS[key];
  const prompt = t.prompt + COMMON;
  const file = path.join(P.out, `${key}${P.tag ? `.${P.tag}` : ''}.mp3`);
  if (fs.existsSync(file) && !P.force) { console.log(`[건너뜀] ${key} — 이미 있다(${path.basename(file)})`); return; }
  if (P.dry) { console.log(`[미리보기] ${key} (${P.model})\n  ${prompt}`); return; }
  const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  for (let attempt = 1; attempt <= P.tries; attempt++) {
    const t0 = Date.now();
    let res;
    try {
      res = await fetch(`${API}/${P.model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch (e) {
      console.log(`[재시도] ${key} ${attempt}/${P.tries} — 연결 실패 ${e.message}`);
      await sleep(5000 * attempt);
      continue;
    }
    const txt = await res.text();
    if (!res.ok) {
      console.log(`[실패] ${key} ${attempt}/${P.tries} — ${res.status} ${txt.slice(0, 200)}`);
      if (res.status === 402) return;   // 크레딧 소진 — 더 해도 같다
      await sleep((res.status === 429 ? 20000 : 6000) * attempt);
      continue;
    }
    const j = JSON.parse(txt);
    const parts = j.candidates?.[0]?.content?.parts ?? [];
    const audio = parts.find((p) => p.inlineData?.mimeType?.startsWith('audio/'));
    if (!audio) { console.log(`[실패] ${key} — 응답에 소리가 없다`); await sleep(4000); continue; }
    fs.writeFileSync(file, Buffer.from(audio.inlineData.data, 'base64'));
    const sections = parts.filter((p) => typeof p.text === 'string').map((p) => p.text).join(' ').replace(/\s+/g, ' ');
    const rec = { key, file: path.basename(file), model: P.model, served: j.modelVersion, ms: Date.now() - t0, sec: durationOf(file), sections, ko: t.ko, prompt };
    fs.appendFileSync(path.join(P.out, '_log.jsonl'), `${JSON.stringify(rec)}\n`);
    console.log(`[완료] ${key} — ${rec.sec}s · ${(rec.ms / 1000).toFixed(1)}초 · ${rec.served}`);
    return;
  }
}

(async () => {
  const P = {
    out: arg('out', null),
    model: arg('model', 'lyria-3-pro-preview'),
    jobs: Math.max(1, Number(arg('jobs', 3))),
    tries: Math.max(1, Number(arg('tries', 3))),
    tag: arg('tag', '') === true ? '' : arg('tag', ''),
    force: !!arg('force', false),
    dry: !!arg('dry', false),
  };
  if (!P.out || P.out === true) { console.error('--out <폴더>가 필요하다'); process.exit(1); }
  fs.mkdirSync(P.out, { recursive: true });
  const only = arg('only', null);
  const keys = only && only !== true ? String(only).split(',').filter((k) => TRACKS[k]) : Object.keys(TRACKS);
  const queue = [...keys];
  await Promise.all(Array.from({ length: P.jobs }, async () => {
    while (queue.length) await generate(queue.shift(), P);
  }));
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
