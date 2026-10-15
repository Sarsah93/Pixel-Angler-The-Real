/**
 * @file check_choice_depth.mjs
 * @description 253차 — 퀘스트 답 깊이(`packages/core/src/db-schema/StoryChoiceDepth{1..8}.ts`) 검사기.
 *
 *  - 묶음 파일을 **소스에서 바로** 읽는다(TypeScript `transpileModule` — core를 다시 빌드하지 않아도 된다.
 *    여러 사람이 묶음을 나눠 쓰는 동안 dist를 서로 덮지 않게).
 *  - 편 정보 · 나레이션 · 표준 답은 core 빌드본(`packages/core/dist` · 환경 변수 `CORE_DIST`)에서 온다.
 *  - 오류(✗)는 반드시 고친다 — 개수 · 길이 · 단락 짝 · 결과 종류 · 플래그 · 미루기 · 혼잣말 · 이모지 · 내부 id · 따옴표 · 영어 누락.
 *    경고(△)는 사람이 판단한다.
 *
 *  사용: node tools/check_choice_depth.mjs --batch 3 [--final]   (--final = 묶음의 모든 편이 있어야 한다)
 *        node tools/check_choice_depth.mjs --all [--final]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const DIST = process.env.CORE_DIST ? path.resolve(process.env.CORE_DIST) : path.join(ROOT, 'packages/core/dist');
const core = await import(pathToFileURL(path.join(DIST, 'index.js')).href);
const { STORY_QUESTS } = core;
const { batchOf, baseChoices } = await import(pathToFileURL(path.join(ROOT, 'tools/story_choice_context.mjs')).href);

const SRC = path.join(ROOT, 'packages/core/src/db-schema');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'choice-depth-'));
const transpile = (file, outName) => {
  const src = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const out = path.join(TMP, outName);
  fs.writeFileSync(out, js);
  return out;
};
transpile(path.join(SRC, 'StoryChoiceDepthKit.ts'), 'StoryChoiceDepthKit.js');

async function loadPart(n) {
  const out = transpile(path.join(SRC, `StoryChoiceDepth${n}.ts`), `StoryChoiceDepth${n}.js`);
  const mod = await import(`${pathToFileURL(out).href}?t=${Date.now()}`);
  return mod[`CHOICE_DEPTH_${n}`];
}

const len = (s) => [...(s ?? '')].length;
const EMOJI = /\p{Extended_Pictographic}/u;
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const QID = /\b[MN]\d{1,2}-\d{1,2}\b/;
const DEV = /(자격 사다리|서브 아크|메인 스파인|메인 퀘스트|서브 퀘스트|퀘스트|트랙(?!터)|레일|우호도|플래그|경험치|숙련도|아크)/;
const FLAG = /^choice\.[a-z0-9_]+$/;
const CID = /^[a-z][a-z0-9_]*$/;
const SKILL_CATS = new Set(['fishing', 'gathering', 'economy', 'driving', 'life', 'farming', 'crafting']);   // core `SkillCategoryId`

function main() {
  const arg = (k) => process.argv.includes(`--${k}`);
  const val = (k) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? undefined : process.argv[i + 1]; };
  const batches = arg('all') ? [1, 2, 3, 4, 5, 6, 7, 8] : [Number(val('batch'))];
  if (batches.some((b) => !(b >= 1 && b <= 8))) { console.error('--batch 1~8 또는 --all'); process.exit(2); }
  return { batches, final: arg('final') };
}

const { batches, final } = main();
let errN = 0, warnN = 0;
const stats = { quests: 0, answers: 0, replies: 0, koChars: 0 };
for (const b of batches) {
  const part = await loadPart(b);
  const quests = STORY_QUESTS.filter((q) => batchOf(q.id) === b);
  const ids = new Set(quests.map((q) => q.id));
  const errs = [], warns = [];
  const E = (id, m) => errs.push(`✗ ${id} ${m}`);
  const W = (id, m) => warns.push(`△ ${id} ${m}`);
  for (const k of Object.keys(part)) if (!ids.has(k)) E(k, `이 묶음(${b})의 편이 아니다`);
  const missing = quests.filter((q) => !part[q.id]).map((q) => q.id);
  if (final && missing.length) E(`묶음 ${b}`, `빠진 편 ${missing.length}: ${missing.join(', ')}`);

  for (const q of quests) {
    const dep = part[q.id];
    if (!dep) continue;
    stats.quests++;
    const base = baseChoices(q);
    const solo = !q.giver;
    const main = q.kind === 'main';
    const policy = q.offerPolicy ?? 'standard';

    // ── 자리별 최종 목록 ──
    if (base.hasNarrOffer && dep.offer) E(q.id, '나레이션 받는 답이 있는 편 — `offer`는 무시된다. `offerAdd` + `offerReply`로');
    if (!base.hasNarrOffer && dep.offerAdd) E(q.id, '나레이션 받는 답이 없는 편 — `offerAdd`가 아니라 `offer`로');
    if (!base.hasNarrOffer && !dep.offer) E(q.id, '받는 자리 `offer`(3~4개)가 없다');
    const offerNew = base.hasNarrOffer ? (dep.offerAdd ?? []) : (dep.offer ?? []);
    const offerFinal = base.hasNarrOffer ? [...base.offer, ...offerNew] : offerNew;
    const completeNew = dep.completeAdd ?? [];
    const completeFinal = [...base.complete, ...completeNew];
    const vis = (l) => l.filter((c) => !c.requires).length;
    if (vis(offerFinal) < 3) E(q.id, `받는 자리 늘 보이는 답 ${vis(offerFinal)}개 — 3개 이상`);
    if (offerFinal.length > 6) W(q.id, `받는 자리 답 ${offerFinal.length}개 — 많다(대화창 6줄 이하 권장)`);
    if (vis(completeFinal) < 3) E(q.id, `끝내는 자리 늘 보이는 답 ${vis(completeFinal)}개 — 3개 이상`);
    if (completeFinal.length > 6) W(q.id, `끝내는 자리 답 ${completeFinal.length}개 — 많다`);
    if (!completeNew.length) W(q.id, '끝내는 자리 더하기(`completeAdd`)가 없다 — 태도가 다른 답 하나를 권장');
    if (!solo && (policy === 'once' || policy === 'event') && !offerFinal.some((c) => c.outcome?.decline)) {
      E(q.id, `${policy} 정책 — 받는 자리에 미루기 답(dNo)이 필요하다`);
    }
    for (const [stage, list] of [['offer', offerFinal], ['complete', completeFinal]]) {
      const seen = new Set();
      for (const c of list) { if (seen.has(c.id)) E(q.id, `${stage} 답 id 중복: ${c.id}`); seen.add(c.id); }
    }

    // ── 새 답 하나하나 ──
    const checkText = (where, ko, en, isReply) => {
      if (EMOJI.test(ko) || EMOJI.test(en)) E(q.id, `${where}: 이모지`);
      if (QID.test(ko) || QID.test(en)) E(q.id, `${where}: 내부 편 id가 보인다`);
      const dev = DEV.exec(ko); if (dev) E(q.id, `${where}: 개발 용어 「${dev[1]}」`);
      if (/["“”]/.test(ko) || /["“”]/.test(en)) E(q.id, `${where}: 큰따옴표(대화창이 붙인다)`);
      if (!en || !en.trim()) E(q.id, `${where}: 영어가 없다`);
      else if (HANGUL.test(en)) E(q.id, `${where}: 영어에 한글이 섞였다`);
      if (isReply) {
        const pk = ko.split('\n\n'), pe = (en ?? '').split('\n\n');
        if (pk.length !== pe.length) E(q.id, `${where}: 단락 수 한 ${pk.length} · 영 ${pe.length}`);
        if (pk.some((p) => !p.trim()) || /\n(?!\n)/.test(ko.replace(/\n\n/g, ''))) E(q.id, `${where}: 빈 단락이나 홑줄바꿈`);
        if (pk.length > 3) W(q.id, `${where}: 단락 ${pk.length}개 — 3개 이하 권장`);
      }
    };
    const checkAnswer = (stage, c) => {
      stats.answers++; stats.replies++; stats.koChars += len(c.replyKo);
      const w = `${stage}/${c.id}`;
      if (!CID.test(c.id)) E(q.id, `${w}: id 형식(소문자 · 숫자 · _)`);
      const lk = len(c.labelKo);
      if (lk < 2 || lk > 50) E(q.id, `${w}: 답 글자 수 ${lk}(2~50)`); else if (lk > 40) W(q.id, `${w}: 답 ${lk}자 — 40자 이하 권장`);
      if (len(c.labelEn) > 110) E(q.id, `${w}: 영어 답 ${len(c.labelEn)}자(110 이하)`); else if (len(c.labelEn) > 90) W(q.id, `${w}: 영어 답 ${len(c.labelEn)}자 — 90 이하 권장`);
      const rk = len(c.replyKo);
      if (rk < 40) E(q.id, `${w}: 응답 ${rk}자 — 너무 짧다(60~220)`); else if (rk < 60) W(q.id, `${w}: 응답 ${rk}자 — 60자 이상 권장`);
      if (rk > 320) E(q.id, `${w}: 응답 ${rk}자 — 너무 길다`); else if (rk > 240) W(q.id, `${w}: 응답 ${rk}자 — 220자 안팎 권장`);
      checkText(`${w} 답`, c.labelKo, c.labelEn, false);
      checkText(`${w} 응답`, c.replyKo, c.replyEn, true);
      const o = c.outcome ?? {};
      const keys = Object.keys(o).filter((k) => o[k] !== undefined);
      if (o.flag !== undefined && !FLAG.test(o.flag)) E(q.id, `${w}: 플래그 형식 choice.<소문자_숫자>`);
      if (solo) {
        const bad = keys.filter((k) => k !== 'flag');
        if (bad.length) E(q.id, `${w}: 혼자 하는 일 — 결과는 플래그만(${bad.join(', ')})`);
        return;
      }
      if (stage === 'offer') {
        const bad = keys.filter((k) => !['affinity', 'flag', 'decline'].includes(k));
        if (bad.length) E(q.id, `${w}: 받는 자리 결과는 우호도 · 플래그 · 미루기만(${bad.join(', ')})`);
        const cap = main ? 0.06 : 0.08;
        if (o.affinity !== undefined && Math.abs(o.affinity) > cap + 1e-9) E(q.id, `${w}: 받는 자리 우호도 ±${cap} 초과(${o.affinity})`);
        if (o.decline && c.id !== 'decline') W(q.id, `${w}: 미루기 답 id는 decline 권장(dNo)`);
      } else {
        if (o.decline) E(q.id, `${w}: 끝내는 자리에 미루기`);
        const allowed = main ? ['affinity', 'flag', 'seaRep', 'harborRep', 'items'] : ['affinity', 'flag', 'seaRep', 'harborRep', 'payMult', 'proficiency', 'items', 'affinityOther'];
        const bad = keys.filter((k) => !allowed.includes(k));
        if (bad.length) E(q.id, `${w}: ${main ? '메인' : '서브'} 끝내는 자리에 쓸 수 없는 결과(${bad.join(', ')})`);
        const cap = main ? 0.1 : 0.12;
        if (o.affinity !== undefined && Math.abs(o.affinity) > cap + 1e-9) E(q.id, `${w}: 우호도 ±${cap} 초과(${o.affinity})`);
        for (const k of ['seaRep', 'harborRep']) if (o[k] !== undefined && (o[k] < -3 || o[k] > 3)) E(q.id, `${w}: ${k} ±3 초과`);
        if (o.payMult !== undefined && (o.payMult < 0.3 || o.payMult > 1.6)) E(q.id, `${w}: payMult 0.3~1.6`);
        if (o.proficiency) {
          if (!SKILL_CATS.has(o.proficiency.category ?? '') && !o.proficiency.skillId) E(q.id, `${w}: proficiency.category 이름(${o.proficiency.category})`);
          if (!(o.proficiency.xp > 0 && o.proficiency.xp <= 80)) E(q.id, `${w}: proficiency.xp 1~80`);
        }
        if (o.items?.some((i) => !i.bound)) E(q.id, `${w}: 물건은 귀속(bound)만`);
      }
    };
    const baseOfferIds = new Set(base.offer.map((c) => c.id));
    const baseCompleteIds = new Set(base.complete.map((c) => c.id));
    for (const c of offerNew) {
      if (base.hasNarrOffer && baseOfferIds.has(c.id)) E(q.id, `offer/${c.id}: 나레이션 답과 id가 겹친다`);
      checkAnswer('offer', c);
    }
    for (const c of completeNew) {
      if (baseCompleteIds.has(c.id)) E(q.id, `complete/${c.id}: 이미 있는 답과 id가 겹친다`);
      checkAnswer('complete', c);
    }

    // ── 응답 늘리기 ──
    const checkLong = (stage, map, baseList) => {
      for (const [id, pair] of Object.entries(map ?? {})) {
        const old = baseList.find((c) => c.id === id);
        const w = `${stage}Reply/${id}`;
        if (!old) { E(q.id, `${w}: 그런 답이 없다(${baseList.map((c) => c.id).join(', ')})`); continue; }
        if (!Array.isArray(pair) || pair.length !== 2) { E(q.id, `${w}: [한, 영] 두 개`); continue; }
        const [ko, en] = pair;
        stats.replies++; stats.koChars += len(ko);
        if (!ko.startsWith(old.replyKo.trim())) E(q.id, `${w}: 원래 응답을 앞에 그대로 둔다(규칙 5)`);
        if (old.replyEn !== old.replyKo && !en.startsWith(old.replyEn.trim())) W(q.id, `${w}: 영어도 원래 응답을 앞에 두는 것을 권장`);
        if (len(ko) - len(old.replyKo) < 25) W(q.id, `${w}: 늘어난 길이 ${len(ko) - len(old.replyKo)}자 — 한 단락 이상 권장`);
        if (len(ko) > 340) E(q.id, `${w}: ${len(ko)}자 — 너무 길다`);
        checkText(w, ko, en, true);
      }
    };
    checkLong('offer', dep.offerReply, base.offer);
    checkLong('complete', dep.completeReply, base.complete);
    if (!base.hasNarrOffer && dep.offerReply) E(q.id, 'offerReply는 나레이션 받는 답이 있는 편에만');
    const shortOffer = base.hasNarrOffer ? base.offer.filter((c) => len(c.replyKo) < 60 && !(dep.offerReply ?? {})[c.id]) : [];
    if (shortOffer.length) W(q.id, `받는 자리 짧은 응답이 그대로: ${shortOffer.map((c) => c.id).join(', ')}`);
    const shortComplete = base.complete.filter((c) => len(c.replyKo) < 60 && !(dep.completeReply ?? {})[c.id]);
    if (shortComplete.length) W(q.id, `끝내는 자리 짧은 응답이 그대로: ${shortComplete.map((c) => c.id).join(', ')}`);
  }

  console.log(`\n── 묶음 ${b}: ${quests.length - missing.length}/${quests.length}편 작성 · 오류 ${errs.length} · 경고 ${warns.length}`);
  if (missing.length && !final) console.log(`   남은 편: ${missing.join(', ')}`);
  for (const m of errs) console.log(m);
  for (const m of warns) console.log(m);
  errN += errs.length; warnN += warns.length;
}
console.log(`\n합계 — 편 ${stats.quests} · 새 답 ${stats.answers} · 응답 ${stats.replies}(평균 ${stats.replies ? Math.round(stats.koChars / stats.replies) : 0}자) · 오류 ${errN} · 경고 ${warnN}`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(errN ? 1 : 0);
