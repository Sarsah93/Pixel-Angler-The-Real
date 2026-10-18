/**
 * @file dump_wiki_map_data.mjs
 * @description 264차 — 위키 「지도」 탭이 쓰는 클라이언트 데이터를 JSON으로 굽는다.
 *
 * 생성기(`gen_game_wiki_data.mjs`)는 core dist만 읽으므로, 클라이언트에만 있는 표를 여기서 꺼낸다:
 *   - 이야기 인물 자리 · 장소 · 현장 지점(`data/StoryNpcs.ts`)
 *   - 가게 종류 이름 · 파는 것 · 영업시간(`data/ShopCatalog.ts`)
 *   - 가게 POI → 거래 종류 판정(`RegionFieldScene.poiBuildingKind` · `isStallPoi` — 여기 복제. ⚠ 씬 규칙을 바꾸면 같이 고친다)
 *   - 홈타운 설치물(core `HOMETOWN_OBJECTS`)
 *
 * 실행: node tools/dump_wiki_map_data.mjs   ->  tools/wiki_map_data.json
 * 구현: esbuild로 클라 모듈 그래프를 번들해 Node에서 실행한다(`dump_wiki_items.mjs`와 같은 길 — Phaser 미의존 경로).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ESB = ['@esbuild+linux-x64', '@esbuild+darwin-arm64', '@esbuild+darwin-x64', '@esbuild+win32-x64']
  .flatMap((d) => fs.existsSync(path.join(ROOT, 'node_modules/.pnpm'))
    ? fs.readdirSync(path.join(ROOT, 'node_modules/.pnpm')).filter((n) => n.startsWith(d))
      .map((n) => path.join(ROOT, 'node_modules/.pnpm', n, 'node_modules', n.split('@').slice(0, 2).join('@').replace('+', '/'), 'bin/esbuild'))
    : [])
  .find((p) => fs.existsSync(p));
if (!ESB) { console.error('esbuild 바이너리를 찾지 못했습니다 — pnpm install 후 재시도'); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wikimap-'));
const entry = path.join(ROOT, 'packages/client-pc/src/__wiki_map_entry.ts');
fs.writeFileSync(entry, `import fs from 'node:fs';
import path from 'node:path';
import { STORY_NPC_PLACEMENTS, STORY_PLACES, STORY_FIELD_TRIGGERS } from './data/StoryNpcs.js';
import { BUILDING_LABEL, BUILDING_GOODS, BUILDING_HOURS } from './data/ShopCatalog.js';
import { interiorTemplateOf } from './data/InteriorLayouts.js';
import { HOMETOWN_OBJECTS, HOMETOWN_SPAWN } from '@tra/core';

// ── RegionFieldScene.poiBuildingKind · isStallPoi · POI_LABEL 복제(264차) — 씬 규칙이 바뀌면 여기도 ──
const POI_LABEL = {
  toilet: '공중화장실', police: '파출소', ferry_terminal: '여객터미널',
  lighthouse: '등대', viewpoint: '전망 포인트', fishing_spot: '낚시터',
  market: '시장', info: '관광안내소', fuel: '주유소',
};
const kindOf = (poi) => {
  if (poi.type === 'restaurant') return 'restaurant';
  if (poi.type === 'cafe') return 'cafe';
  if (poi.type === 'market') return 'market';
  if (poi.type === 'pharmacy') return 'pharmacy';
  if (poi.type === 'shop') {
    if (/공동어시장|수협|위판|어판장|공판장|활어\\s*센터/.test(poi.name ?? '')) return 'market';
    const k = poi.shopKind ?? '';
    if (k === 'convenience') return 'convenience';
    if (k === 'supermarket' || k === 'grocery' || k === 'greengrocer') return 'mart';
    if (k === 'seafood' || k === 'fishery' || k === 'fishing') return 'market';
    if (k === 'alcohol' || k === 'beverages' || k === 'pub') return 'pub';
    if (k === 'chemist' || k === 'medical_supply' || k === 'herbalist') return 'pharmacy';
    if (k === 'general' || k === 'variety_store' || k === 'houseware' || k === 'hardware' || k === 'department_store' || k === 'kiosk') return 'daily';
    if (k === 'garden_centre' || k === 'florist' || k === 'agrarian' || k === 'farm') return 'nursery';
    return null;
  }
  return null;
};
const isStall = (poi, kind) => {
  if (kind !== 'market') return false;
  const name = poi.name ?? '';
  if (interiorTemplateOf('market', name) === 'auction') return false;
  return poi.type === 'market' || poi.shopKind === 'seafood' || /시장|난전|노점|좌판/.test(name);
};
const DATA_DIR = path.resolve(${JSON.stringify(path.join(ROOT, 'packages/client-pc/public/data'))});
const poiKinds = {};
for (const dr of fs.readdirSync(DATA_DIR)) {
  const f = path.join(DATA_DIR, dr, 'pois.json');
  if (!fs.existsSync(path.join(DATA_DIR, dr, 'meta.json')) || !fs.existsSync(f)) continue;
  const pois = JSON.parse(fs.readFileSync(f, 'utf8'));
  poiKinds[dr] = pois.map((p) => {
    const kind = kindOf(p);
    const stall = kind ? isStall(p, kind) : false;
    const auction = kind === 'market' && interiorTemplateOf('market', p.name ?? '') === 'auction';
    return { kind, stall, auction, place: !kind && ((p.name ?? '') !== '' || POI_LABEL[p.type] !== undefined) ? (POI_LABEL[p.type] ?? '') : null };
  });
}
const out = {
  placements: STORY_NPC_PLACEMENTS, places: STORY_PLACES,
  triggers: STORY_FIELD_TRIGGERS.map((t) => ({ ...t, actor: t.actor ? { nameKo: t.actor.nameKo, nameEn: t.actor.nameEn ?? '', role: t.actor.role } : undefined })),
  buildingLabel: BUILDING_LABEL, buildingGoods: BUILDING_GOODS, buildingHours: BUILDING_HOURS, poiLabel: POI_LABEL,
  hometown: { spawn: HOMETOWN_SPAWN, objects: HOMETOWN_OBJECTS.map((o) => ({ id: o.instanceId, type: o.type, tx: o.tx, ty: o.ty, fw: o.fw ?? 1, fh: o.fh ?? 1, interact: o.interact ?? null })) },
  poiKinds,
};
console.log(JSON.stringify(out));
`);
try {
  const bundle = path.join(tmp, 'bundle.mjs');
  execFileSync(ESB, [entry, '--bundle', '--platform=node', '--format=esm', `--outfile=${bundle}`,
    '--define:import.meta.env=globalThis.__VENV', '--banner:js=globalThis.__VENV={DEV:false,PROD:true};',
    '--log-level=warning'], { stdio: 'inherit' });
  const json = execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const data = JSON.parse(json);
  fs.writeFileSync(path.join(ROOT, 'tools/wiki_map_data.json'), JSON.stringify(data));
  const placed = data.placements.filter((p) => p.tx !== undefined).length;
  console.log(`wiki_map_data.json — 인물 자리 ${placed}/${data.placements.length} · 장소 ${data.places.length} · 현장 ${data.triggers.length} · 데이터 지역 ${Object.keys(data.poiKinds).length}`);
} finally {
  fs.rmSync(entry, { force: true });
  fs.rmSync(tmp, { recursive: true, force: true });
}
