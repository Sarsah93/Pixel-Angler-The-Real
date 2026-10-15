/**
 * @file gemini_bgm.cjs
 * @description 253차 — 배경음(BGM) 후보 초안을 Gemini 음악 모델(Lyria)로 뽑는다.
 *
 *  - 모델: `lyria-3-pro-preview`(기본 — 약 3분 · 구간 표시 [[A0]] [[B1]] … · 응답 기록상 lyria-3.5) ·
 *    `lyria-3-clip-preview`(30초 클립 — 분위기만 빨리 볼 때). 둘 다 `generateContent` · 응답은 audio/mpeg(44.1kHz 스테레오 192kbps).
 *  - 값(253차 확인 기준 · 바뀔 수 있다): 클립 한 곡 약 0.04달러 · Pro 한 곡 약 0.08달러. 선불 크레딧이 바닥나면 402 「prepayment credits are depleted」.
 *  - 키는 환경의 네트워크 시크릿을 에이전트 프록시가 붙인다(이 스크립트 · 저장소에는 키가 없다).
 *    ⚠ Node 내장 fetch는 HTTPS_PROXY를 읽지 않는다 — 반드시 `NODE_USE_ENV_PROXY=1`로 돌린다.
 *  - 곡 표(`TRACKS`)는 장면 하나에 한 줄 — 영어 프롬프트(모델용)와 한국어 설명(문서 · 보고용). 반복 재생을 전제로
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

/** 장면별 후보 — key · 한국어 설명 · 프롬프트 */
const TRACKS = {
  menu: {
    ko: '메인 메뉴 — 새벽 항구 · 따뜻한 칩튠 아르페지오 · 잔잔한 파도 · 그리움',
    prompt: 'Title screen theme for a Korean seaside fishing game at dawn. Warm nostalgic chiptune: soft 8-bit square-wave arpeggios, '
      + 'a gentle pulse bass, a simple memorable lead melody, light seagull-like synth chirps, distant ocean wave texture. 82 BPM, major key with a hint of longing.',
  },
  field_day: {
    ko: '낮 항구 필드(속초) — 어쿠스틱 기타 · 우쿨렐레 · 가벼운 퍼커션 · 느긋하고 밝게',
    prompt: 'Daytime harbor town exploration music for a fishing life-sim set in Sokcho, Korea. Relaxed acoustic guitar picking, ukulele strums, '
      + 'soft shaker and light hand percussion, warm upright bass, a breezy whistle-like synth melody. 96 BPM, sunny, easygoing, unhurried.',
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
    ko: '1인칭 낚시(기다림) — 미니멀 · 맑은 벨 · 물결 같은 아르페지오 · 집중',
    prompt: 'Calm focus music for waiting for a bite while fishing from a breakwater. Minimal and hypnotic: gentle rippling arpeggio on a clean '
      + 'electric piano, glassy bell tones, soft pad underneath, very light pulse. 76 BPM, patient, meditative, never distracting.',
  },
  home: {
    ko: '집 · 실내 — 로파이 피아노 · 테이프 질감 · 포근하게',
    prompt: 'Cozy indoor home theme for a small seaside room at evening. Lo-fi hip hop feel: warm felt piano chords, mellow muted guitar, '
      + 'soft dusty drum loop with gentle vinyl crackle, round bass. 74 BPM, peaceful, safe, a little sleepy.',
  },
  farm: {
    ko: '텃밭 — 목가풍 포크 · 어쿠스틱 기타 · 리코더 · 한낮의 여유',
    prompt: 'Pastoral garden farming theme for a small vegetable plot by the sea. Folk instrumentation: fingerpicked acoustic guitar, soft recorder '
      + 'or wooden flute melody, light glockenspiel, gentle hand drum. 90 BPM, sunny afternoon, humble and content.',
  },
  market: {
    ko: '시장 · 마을 — 가야금 · 대금 느낌 + 칩튠 · 활기 있게(한국 색)',
    prompt: 'Lively traditional fish market theme with a Korean flavor: plucked gayageum-like zither melody, a breathy daegeum-like bamboo flute, '
      + 'janggu-style hand drum pattern blended with soft chiptune bass and claps. 104 BPM, busy morning market, friendly and warm.',
  },
  rain: {
    ko: '비 오는 날 — 잔잔한 피아노 · 첼로 · 빗소리 질감 · 쓸쓸하지만 따뜻하게',
    prompt: 'Rainy day theme in a coastal town. Gentle solo piano with a soft cello line, light rain texture, sparse warm pad, '
      + 'no drums. 68 BPM, melancholic but tender, reflective, quiet.',
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
