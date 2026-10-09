#!/usr/bin/env node
/**
 * @file kamis_snapshot.mjs
 * @description 236차 — KAMIS 농산물 소매가격 하루치 스냅샷 (GitHub Actions가 하루 한 번 돌린다)
 *
 * 정적 배포(gh-pages)의 브라우저는 KAMIS를 직접 부를 수 없다(CORS 차단). 이 스크립트가 받아 JSON 하나로 쓰고,
 * 워크플로(`.github/workflows/kamis-snapshot.yml`)가 그 파일을 `data-snapshots` 브랜치에 올린다.
 * 게임은 그 파일을 읽어 「오늘 값 ÷ 평년」으로 텃밭 수확물 값을 출렁인다(core `rules/ProduceMarket.ts`).
 *
 * 사용:
 *   KAMIS_CERT_KEY=… KAMIS_CERT_ID=… node tools/kamis_snapshot.mjs --out kamis-out/produce.json
 *   node tools/kamis_snapshot.mjs --regday 2026-10-08 …   # 조사일을 정해서(비우면 오늘부터 거꾸로 값이 찬 날)
 *   node tools/kamis_snapshot.mjs --fixture <폴더> --regday 2026-10-08 --out …   # 받아 둔 응답(<폴더>/<부류코드>.json)으로 파싱만
 *
 * ⚠ 응답의 값 열(dpr1~dpr7)은 **열 제목(day1~day7의 「당일」 · 「평년」)으로 찾는다**. 제목이 없을 때만
 *   자리(1 = 당일, 7 = 평년)로 본다. 어느 쪽을 썼는지는 스냅샷 `columns.mode`에 남긴다(첫 실행 때 확인).
 * 의존성 없음(Node 20 내장 fetch).
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE = 'https://www.kamis.or.kr/service/price/xml.do';
/** 부류 — 식량작물(콩 · 감자 · 고구마) · 채소류 · 특용작물(땅콩 · 버섯) */
const CATEGORIES = [
  { code: '100', name: '식량작물' },
  { code: '200', name: '채소류' },
  { code: '300', name: '특용작물' },
];
/** 값이 찬 줄이 이보다 적은 날은 조사가 없던 날로 본다(주말 · 공휴일) */
const MIN_FILLED = 20;
/** 오늘부터 며칠 앞까지 거꾸로 찾나 */
const LOOKBACK_DAYS = 7;
/** 요청 사이 간격(ms) — KAMIS에 몰아서 부르지 않는다 */
const GAP_MS = 1200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** KST 날짜(YYYY-MM-DD) — offsetDays일 전 */
function kstDate(offsetDays = 0) {
  return new Date(Date.now() + 9 * 3_600_000 - offsetDays * 86_400_000).toISOString().slice(0, 10);
}

/** "3,452" → 3452 · "-" · 빈 값 → null */
function num(v) {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** 응답의 줄들 — `data`가 배열이거나 `data.item`(배열 · 한 개) */
function rowsOf(json) {
  const d = json?.data;
  if (Array.isArray(d)) return typeof d[0] === 'string' ? [] : d;
  if (d && typeof d === 'object') {
    const it = d.item;
    if (Array.isArray(it)) return it;
    if (it && typeof it === 'object') return [it];
  }
  return [];
}

/** 오류 코드(정상 = null) — `data: ["001"]` 꼴이거나 `data.error_code`가 "000"이 아니면 */
function errorCodeOf(json) {
  const d = json?.data;
  if (Array.isArray(d) && typeof d[0] === 'string') return d[0];
  if (d && typeof d === 'object' && !Array.isArray(d) && d.error_code && String(d.error_code) !== '000') return String(d.error_code);
  return null;
}

/** 열 제목(day1~day7)으로 당일 · 평년 · 1년 전 · 1개월 전 열 번호를 찾는다 */
function columnsOf(rows) {
  const labels = {};
  for (let k = 1; k <= 7; k++) {
    const hit = rows.find((r) => typeof r[`day${k}`] === 'string' && r[`day${k}`].trim());
    if (hit) labels[k] = hit[`day${k}`].trim();
  }
  const find = (re) => {
    const k = Object.keys(labels).find((x) => re.test(labels[x]));
    return k ? Number(k) : null;
  };
  const today = find(/당일/), normal = find(/평년/);
  if (today && normal) return { mode: 'label', today, normal, yearAgo: find(/1년/), monthAgo: find(/1개월/), labels };
  return { mode: 'position', today: 1, normal: 7, yearAgo: 6, monthAgo: 5, labels };
}

async function callKamis(params, key, id) {
  const q = new URLSearchParams({ action: 'dailyPriceByCategoryList', ...params, p_cert_key: key, p_cert_id: id, p_returntype: 'json' });
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE}?${q}`, { signal: AbortSignal.timeout(45_000) });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return JSON.parse(text);
    } catch (e) {
      last = e;
      if (attempt < 3) await sleep(2000 * attempt);
    }
  }
  throw last;
}

/** 하루치 — 부류 셋을 받아 품목명 → 줄들 */
async function collectDay(day, { key, id, fixture }) {
  const items = {};
  const errors = [];
  let filled = 0;
  let rowsTotal = 0;
  let cols = null;
  for (const cat of CATEGORIES) {
    let json;
    try {
      if (fixture) {
        json = JSON.parse(readFileSync(join(fixture, `${cat.code}.json`), 'utf8'));
      } else {
        json = await callKamis({ p_product_cls_code: '01', p_item_category_code: cat.code, p_regday: day, p_convert_kg_yn: 'N' }, key, id);
        await sleep(GAP_MS);
      }
    } catch (e) {
      errors.push(`${cat.name}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    const err = errorCodeOf(json);
    if (err) { errors.push(`${cat.name}: 오류 코드 ${err}`); continue; }
    const rows = rowsOf(json);
    const c = columnsOf(rows);
    cols = cols ?? c;
    for (const r of rows) {
      const name = String(r.item_name ?? '').trim();
      if (!name) continue;
      const rec = {
        kind: String(r.kind_name ?? '').trim(),
        rank: String(r.rank ?? '').trim(),
        unit: String(r.unit ?? '').trim(),
        today: num(r[`dpr${c.today}`]),
        normal: num(r[`dpr${c.normal}`]),
        yearAgo: c.yearAgo ? num(r[`dpr${c.yearAgo}`]) : null,
        monthAgo: c.monthAgo ? num(r[`dpr${c.monthAgo}`]) : null,
      };
      (items[name] ??= []).push(rec);
      rowsTotal++;
      if (rec.today) filled++;
    }
  }
  return { items, errors, filled, rowsTotal, cols };
}

/** 대표 품목 몇 개의 「오늘 ÷ 평년」 — 실행 요약용 */
function sampleRatios(items) {
  const out = [];
  for (const name of ['배추', '무', '양파', '대파', '상추', '시금치', '감자', '오이', '깻잎', '느타리버섯']) {
    const rows = (items[name] ?? []).filter((r) => r.today && r.normal);
    const top = rows.some((r) => r.rank === '상품') ? rows.filter((r) => r.rank === '상품') : rows;
    if (!top.length) { out.push([name, '자료 없음']); continue; }
    const r = top[0];
    out.push([name, `${r.kind} ${r.unit} — 오늘 ${r.today.toLocaleString()}원 · 평년 ${r.normal.toLocaleString()}원 (×${(r.today / r.normal).toFixed(2)})`]);
  }
  return out;
}

async function main() {
  const out = arg('--out') ?? 'kamis-out/produce.json';
  const fixture = arg('--fixture');
  const fixedDay = (arg('--regday') ?? '').trim();
  if (fixedDay && !/^\d{4}-\d{2}-\d{2}$/.test(fixedDay)) {
    console.error(`::error::조사일은 YYYY-MM-DD 꼴이어야 합니다 (받은 값: ${fixedDay})`);
    process.exit(1);
  }
  const key = (process.env.KAMIS_CERT_KEY ?? '').trim();
  const id = (process.env.KAMIS_CERT_ID ?? '').trim();
  if (!fixture && (!key || !id)) {
    console.error('::error::KAMIS_CERT_KEY · KAMIS_CERT_ID 가 비어 있습니다 — 저장소 Settings → Secrets and variables → Actions 에 넣어 주세요.');
    process.exit(1);
  }

  const days = fixedDay ? [fixedDay] : Array.from({ length: LOOKBACK_DAYS + 1 }, (_, i) => kstDate(i));
  const tried = [];
  for (const day of days) {
    const got = await collectDay(day, { key, id, fixture });
    tried.push(`${day}: 값이 찬 줄 ${got.filled}/${got.rowsTotal}${got.errors.length ? ` · ${got.errors.join(' / ')}` : ''}`);
    console.log(tried[tried.length - 1]);
    if (got.filled < MIN_FILLED) continue;

    const snapshot = {
      v: 1,
      source: 'KAMIS 농산물유통정보 — 일별 부류별 소매가격(전국 평균) · 한국농수산식품유통공사',
      regday: day,
      fetchedAt: new Date().toISOString(),
      columns: { mode: got.cols?.mode ?? 'position', labels: got.cols?.labels ?? {} },
      items: got.items,
    };
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(snapshot)}\n`, 'utf8');

    const names = Object.keys(got.items).length;
    const lines = [
      `조사일 ${day} · 품목 ${names}개 · 줄 ${got.rowsTotal}개(값 있음 ${got.filled}) · 열 찾기 ${snapshot.columns.mode}`,
      `열 제목: ${JSON.stringify(snapshot.columns.labels)}`,
      ...sampleRatios(got.items).map(([n, v]) => `  ${n}: ${v}`),
    ];
    console.log(lines.join('\n'));
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
        `## 농산물 시세 스냅샷 — ${day}`, '',
        `품목 ${names}개 · 줄 ${got.rowsTotal}개(값 있음 ${got.filled}) · 열 찾기 \`${snapshot.columns.mode}\``, '',
        '| 품목 | 오늘 ÷ 평년 |', '|---|---|',
        ...sampleRatios(got.items).map(([n, v]) => `| ${n} | ${v} |`), '',
      ].join('\n'));
    }
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `regday=${day}\n`);
    return;
  }
  console.error(`::error::값이 찬 조사일을 찾지 못했습니다 — 스냅샷을 쓰지 않습니다(지난 스냅샷이 그대로 남습니다).\n${tried.join('\n')}`);
  process.exit(1);
}

main().catch((e) => {
  console.error(`::error::${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  process.exit(1);
});
