/**
 * f9_kama_head_lines.cjs — 333차: **가마살 어종의 머리따기 사선을 가슴지느러미 뒤로**(확정 기록을 새 규칙으로 옮긴다)
 *
 * 사용자 확인(2026-11-20 — 가마살 구조 그림): 가마살은 가슴지느러미가 붙은 채 머리와 함께 떨어진다 = 머리따기 사선은
 * 가슴지느러미 밑동 **뒤**(꼬리 쪽)를 지나 배지느러미 뒤 배까지 간다. 그전에 확정한 사선(방어 · 부시리 · 잿방어 · 참다랑어 · 눈다랑어 ·
 * 황새치)은 가슴지느러미 앞을 지나, 방혈 호와 사선 사이가 가운데에서 도마 폭의 2.5%뿐이었다(세모가 서지 않는다).
 *
 * 하는 일: `captures.json`에서 가마살 어종(core `LOIN_KAMA_SPECIES`)의 `head_base` · `head_flip`을 core `kamaHeadLine`으로 옮긴다
 *  — 위 끝은 그대로 두고, 그 어종에 확정한 가슴지느러미 밑동 선(`finectomy`의 가파른 선) 아래 끝보다 조금 뒤를 지나게 눕힌다.
 *  가슴지느러미 선이 없는 어종(황새치)은 아래 끝을 정해진 만큼 민다. 이미 지느러미 뒤를 지나는 사선은 그대로 둔다.
 *  옮긴 것은 `log.jsonl`에 한 줄씩 남기고(사람이 다시 그은 것이 아니라는 말과 함께) core 표를 다시 굽는다.
 * ⚠ 사람이 [확정]한 선이 아니다 — 사용자가 F9로 다시 확정하면 그 값이 이긴다(시각이 늦다).
 *    이 도구를 돌린 뒤 `f9_merge_captures.cjs`의 `STALE` 표에 「<어종>.head_base」 · 「<어종>.head_flip」 줄(이 시각)을 넣는다 —
 *    그 전에 다른 PC에서 그은 옛 사선이 합칠 때 다시 이기지 못하게.
 *
 * 실행: node tools/f9_kama_head_lines.cjs [--dry]   (core를 먼저 빌드한다 — `packages/core/dist`)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'tools', 'f9_captures');
const CAP = path.join(DIR, 'captures.json');
const LOG = path.join(DIR, 'log.jsonl');
const dry = process.argv.includes('--dry');

(async () => {
  const core = await import(path.join(ROOT, 'packages', 'core', 'dist', 'index.js'));
  const cap = JSON.parse(fs.readFileSync(CAP, 'utf8'));
  const at = new Date().toISOString();
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const fmt = (p) => p.map((q) => `(${q.x.toFixed(3)}, ${q.y.toFixed(3)})`).join(' → ');
  const logLines = [];
  let n = 0;
  // 이미 옮긴 사선은 다시 옮기지 않는다 — 가슴지느러미 선이 없는 어종(황새치)은 「정해진 만큼」 미는 식이라 돌릴 때마다 더 밀린다
  const moved = new Set();
  for (const line of fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n') : []) {
    if (!line.trim()) continue;
    try { const j = JSON.parse(line); if (String(j.note ?? '').startsWith('333 — 가마살 어종의 머리따기 사선')) moved.add(`${j.key}.${j.stageId}`); } catch { /* 깨진 줄은 건너뛴다 */ }
  }
  for (const sp of core.LOIN_KAMA_SPECIES) {
    const e = cap[sp];
    if (!e) { console.log(`${sp}: 확정 기록 없음 — core 기본값이 이미 지느러미 뒤로 간다`); continue; }
    const fin = e.finectomy;
    const pect = fin ? core.pectoralLineOf(fin.guidePaths?.length ? fin.guidePaths : fin.guidePath ? [fin.guidePath] : []) : undefined;
    for (const [id, headLeft] of [['head_base', true], ['head_flip', false]]) {
      const old = e[id]?.guidePath;
      if (!old || old.length < 2) continue;
      if (moved.has(`${sp}.${id}`)) { console.log(`${sp}.${id}: 그대로(이미 옮긴 선)`); continue; }
      const p = pect && !headLeft ? pect.map((q) => ({ x: 1 - q.x, y: q.y })) : pect;
      const next = core.kamaHeadLine(old, p, headLeft).map((q) => ({ x: r3(q.x), y: r3(q.y) }));
      const same = next.length === old.length && next.every((q, i) => Math.abs(q.x - old[i].x) < 1e-3 && Math.abs(q.y - old[i].y) < 1e-3);
      if (same) { console.log(`${sp}.${id}: 그대로(이미 가슴지느러미 뒤)`); continue; }
      console.log(`${sp}.${id}: ${fmt(old)}  ⇒  ${fmt(next)}${pect ? '' : '  (가슴지느러미 선 없음 — 정해진 만큼)'}`);
      e[id] = { ...e[id], guidePath: next, at };
      logLines.push(JSON.stringify({
        at, key: sp, stageId: id, speciesId: sp, scope: 'species',
        note: '333 — 가마살 어종의 머리따기 사선을 가슴지느러미 뒤로 옮김(사람이 다시 그은 것이 아니다 — 다시 확정 대상)',
        override: { guidePath: next },
      }));
      n++;
    }
  }
  // ── 둘째: 확정한 해체 선(옆줄 · 등살 · 뱃살 × 두 면)의 머리 쪽 끝을 새 사선에 맞춘다 ──
  //  사선의 아래 끝이 뒤로 가면서, 옛 사선에서 시작하던 옆줄 · 뱃살 선의 머리 쪽 끝이 떨어져 나간 머리 자리(허공)에 남는다.
  //  선이 사선을 넘는 자리에서 잘라 몸통 가장자리 바로 안쪽에서 시작하게 한다(몸통 안쪽 모양은 그대로).
  const MARGIN = 0.004;
  for (const sp of core.LOIN_KAMA_SPECIES) {
    const e = cap[sp];
    if (!e) continue;
    for (const [sd, headId, s] of [['a', 'head_base', 1], ['b', 'head_flip', -1]]) {
      const head = e[headId]?.guidePath;
      if (!head || head.length < 2) continue;
      /** 사선보다 몸통 쪽으로 얼마나 들어와 있나(음수 = 머리 쪽) */
      const inBody = (q) => s * (q.x - core.pathXAtY(head, q.y)) - MARGIN;
      for (const part of ['mid', 'back', 'belly']) {
        const id = `loin_${sd}_${part}`;
        const old = e[id]?.guidePath;
        if (!old || old.length < 2) continue;
        const headFirst = s * old[0].x <= s * old[old.length - 1].x;
        const pts = headFirst ? old.slice() : old.slice().reverse();
        // 반올림(소수 셋째 자리)으로 잘라 둔 끝점이 사선에 아슬하게 걸려도 다시 자르지 않는다(돌릴 때마다 같은 결과)
        let k = 0;
        while (k < pts.length && inBody(pts[k]) < -0.0015) k++;
        if (k === 0 || k >= pts.length) continue;           // 이미 몸통 안에서 시작한다 · 통째로 머리 쪽(건드리지 않는다)
        let lo = pts[k - 1], hi = pts[k];
        for (let i = 0; i < 24; i++) {
          const mid = { x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2 };
          if (inBody(mid) < 0) lo = mid; else hi = mid;
        }
        const cut = [{ x: r3(hi.x), y: r3(hi.y) }, ...pts.slice(k)];
        const next = headFirst ? cut : cut.reverse();
        console.log(`${sp}.${id}: 머리 쪽 끝 ${fmt([headFirst ? old[0] : old[old.length - 1]])} ⇒ ${fmt([headFirst ? next[0] : next[next.length - 1]])} (점 ${old.length} → ${next.length})`);
        e[id] = { ...e[id], guidePath: next, at };
        logLines.push(JSON.stringify({
          at, key: sp, stageId: id, speciesId: sp, scope: 'species',
          note: '333 — 옮긴 머리따기 사선에 맞춰 해체 선의 머리 쪽 끝을 잘랐다(몸통 안쪽은 확정한 그대로)',
          override: { guidePath: next },
        }));
        n++;
      }
    }
  }
  console.log(`\n옮긴 선 ${n} · 시각 ${at}${dry ? ' (--dry — 바꾸지 않음)' : ''}`);
  if (dry || !n) return;
  fs.writeFileSync(CAP, JSON.stringify(cap, null, 1) + '\n');
  fs.appendFileSync(LOG, logLines.join('\n') + '\n');
  execFileSync('node', [path.join(ROOT, 'tools', 'apply_f9_captures.cjs')], { stdio: 'inherit' });
})().catch((e) => { console.error(e.message ?? e); process.exit(1); });
