/**
 * @file gen_game_wiki_data.mjs
 * @description 조행록 퀘스트 아티팩트를 게임 전체 위키 데이터로 확장한다.
 *
 * 실행:
 *   node tools/gen_game_wiki_data.mjs          -> JSON
 *   node tools/gen_game_wiki_data.mjs --html   -> tools/game_wiki_template.html 주입 HTML
 * 선행: pnpm --filter @tra/core run build
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Windows Node는 C:\ 절대 경로를 ESM specifier로 받지 않으므로 file:// URL로 변환한다.
const core = await import(pathToFileURL(path.join(ROOT, 'packages/core/dist/index.js')).href);

const questJson = execFileSync(process.execPath, [path.join(ROOT, 'tools/gen_quest_wiki_data.mjs')], {
  cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
});
const quests = JSON.parse(questJson);

const itemSource = [
  'packages/client-pc/src/data/WikiCatalog.ts',
  'packages/client-pc/src/data/ShopCatalog.ts',
  'packages/client-pc/src/data/QuestRewardItems.ts',
  'packages/client-pc/src/store/InventoryStore.ts',
].map((file) => fs.readFileSync(path.join(ROOT, file), 'utf8')).join('\n');
const itemNames = [...itemSource.matchAll(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)]
  .map((m) => ({ id: m[1], name: m[2] }))
  .filter((entry, index, all) => all.findIndex((x) => x.id === entry.id) === index);

const readSystemPages = () => fs.readdirSync(path.join(ROOT, 'docs/wiki/02-SYSTEMS'))
  .filter((name) => name.endsWith('.md'))
  .sort()
  .map((name) => {
    const text = fs.readFileSync(path.join(ROOT, 'docs/wiki/02-SYSTEMS', name), 'utf8');
    const heading = text.match(/^#\s+(.+)$/m)?.[1] ?? name.replace(/\.md$/, '');
    const summary = text.split(/\r?\n\r?\n/).find((part) => part.trim() && !part.trim().startsWith('#'))
      ?.replace(/[`*_]/g, '').replace(/\r?\n/g, ' ').trim().slice(0, 320) ?? '';
    return { id: name.replace(/\.md$/, ''), title: heading, summary };
  });

const recipes = core.FIRE_RECIPES.map((r) => ({
  id: r.id, name: r.nameKo, nameEn: r.nameEn, family: r.family, desc: r.descKo,
  cookware: r.cookware, main: r.required.find((q) => q.role === 'main')?.ing ?? null,
  optional: r.optional.length,
}));
const ingredients = core.COOK_INGREDIENTS.map((i) => ({
  id: i.id, name: i.nameKo, unit: i.unit, category: i.category, desc: i.descKo ?? '',
}));
const fish = core.FISH_DATABASE.map((f) => ({
  id: f.id, name: f.nameKo, scientific: f.scientificName, habitat: f.habitatKo ?? '',
}));
const blueprints = core.CRAFT_BLUEPRINTS.map((b) => ({
  id: b.id, name: b.nameKo, group: core.CRAFT_GROUP_LABEL[b.group]?.ko ?? b.group,
  station: b.station, desc: b.descKo ?? '',
}));

const out = {
  generatedFrom: '@tra/core dist + client wiki catalog + docs/wiki/02-SYSTEMS',
  generatedAt: new Date().toISOString(),
  counts: {
    quests: quests.counts.quests, recipes: recipes.length, ingredients: ingredients.length,
    fish: fish.length, crafting: blueprints.length, items: itemNames.length,
  },
  quests, recipes, ingredients, fish, blueprints,
  items: itemNames,
  systems: readSystemPages(),
};

const json = JSON.stringify(out);
if (process.argv.includes('--html')) {
  const tpl = fs.readFileSync(path.join(ROOT, 'tools/game_wiki_template.html'), 'utf8');
  process.stdout.write(tpl.replace('__DATA__', json.replace(/<\//g, '<\\/')));
} else {
  process.stdout.write(json);
}
