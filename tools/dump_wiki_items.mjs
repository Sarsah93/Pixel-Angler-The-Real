/**
 * @file dump_wiki_items.mjs
 * @description 클라이언트 아이템 위키 카탈로그(`data/WikiCatalog.ts`)를 JSON으로 굽는다.
 *
 * 위키 생성기가 정규식으로 `id/name`만 긁던 것을 대체한다 — 분류·가격·설명·판매처·제원이
 * 전부 실제 카탈로그에서 나온다(게임과 드리프트 없음).
 *
 * 실행: node tools/dump_wiki_items.mjs   ->  tools/wiki_items.json
 * 구현: esbuild로 클라 모듈 그래프를 번들해 Node에서 실행한다(Phaser 미의존 경로).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ESB = ['@esbuild+linux-x64', '@esbuild+darwin-arm64', '@esbuild+darwin-x64', '@esbuild+win32-x64']
  .flatMap((d) => fs.existsSync(path.join(ROOT, 'node_modules/.pnpm'))
    ? fs.readdirSync(path.join(ROOT, 'node_modules/.pnpm')).filter((n) => n.startsWith(d))
      .map((n) => path.join(ROOT, 'node_modules/.pnpm', n, 'node_modules', n.split('@').slice(0, 2).join('@').replace('+', '/'), 'bin/esbuild'))
    : [])
  .find((p) => fs.existsSync(p));
if (!ESB) { console.error('esbuild 바이너리를 찾지 못했습니다 — pnpm install 후 재시도'); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wikiitems-'));
const entry = path.join(ROOT, 'packages/client-pc/src/__wiki_items_entry.ts');
fs.writeFileSync(entry, `import { buildItemWikiCatalog } from './data/WikiCatalog.js';
import { ITEM_ART_BY_ID, ITEM_ART_BY_PREFIX, ITEM_ART_BY_PX } from './data/ItemArtManifest.js';
import { ITEM_IMAGE_BY_ID, ITEM_IMAGE_BY_PX, ITEM_CROP_PORTRAIT_ALIAS, ITEM_TEXTURE_ALIAS } from './data/ItemImages.js';
// 255차 — 게임(ui/ItemIcon.ts createItemIcon)과 같은 순서로 그림 키를 고른다(위키 manifest 키 · imgKey).
//  작물 초상(별칭 포함) → Gemini 아이템 그림(id · 16px 키) → 같은 음식 별칭 → 코드 그림 키 → 원래 텍스처 키
const artKeyOf = (id, t) => {
  if (t && !t.startsWith('px:')) return undefined;
  if (id) {
    if (ITEM_ART_BY_ID[id]) return ITEM_ART_BY_ID[id];
    for (const [p, k] of ITEM_ART_BY_PREFIX) if (id.startsWith(p)) return k;
  }
  return t ? ITEM_ART_BY_PX[t] : undefined;
};
const imgKeyOf = (e) => {
  const t = e.iconTexture || '', art = artKeyOf(e.id, t);
  const crop = ITEM_CROP_PORTRAIT_ALIAS[t] || (art && ITEM_CROP_PORTRAIT_ALIAS[art]);
  if (crop) return 'px:' + crop;
  if (t.startsWith('px:crop_')) return t;
  return ITEM_IMAGE_BY_ID[e.id] || ITEM_IMAGE_BY_PX[t] || ITEM_TEXTURE_ALIAS[t] || (art && ITEM_TEXTURE_ALIAS[art]) || art || t;
};
const list = buildItemWikiCatalog().map((e) => ({
  id: e.id, name: e.name, iconTexture: e.iconTexture, imgKey: imgKeyOf(e),
  category: e.category, subCategory: e.subCategory, basePrice: e.basePrice,
  desc: e.desc ?? '', soldAt: e.soldAt, isSeed: e.isSeed, tpl: e.tpl,
  pack: e.pack ?? null,   // 272차 — 묶음 판매(한 묶음 개수 · 묶음 값)
}));
console.log(JSON.stringify(list));
`);
try {
  const bundle = path.join(tmp, 'bundle.mjs');
  execFileSync(ESB, [entry, '--bundle', '--platform=node', '--format=esm', `--outfile=${bundle}`,
    '--define:import.meta.env=globalThis.__VENV', '--banner:js=globalThis.__VENV={DEV:false,PROD:true};',
    '--log-level=warning'], { stdio: 'inherit' });
  const json = execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const list = JSON.parse(json);
  fs.writeFileSync(path.join(ROOT, 'tools/wiki_items.json'), JSON.stringify(list));
  console.log(`wiki_items.json — ${list.length}건`);
} finally {
  fs.rmSync(entry, { force: true });
  fs.rmSync(tmp, { recursive: true, force: true });
}
void pathToFileURL;
