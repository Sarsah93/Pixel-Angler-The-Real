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
const list = buildItemWikiCatalog().map((e) => ({
  id: e.id, name: e.name, iconTexture: e.iconTexture,
  category: e.category, subCategory: e.subCategory, basePrice: e.basePrice,
  desc: e.desc ?? '', soldAt: e.soldAt, isSeed: e.isSeed, tpl: e.tpl,
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
