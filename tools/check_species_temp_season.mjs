// 289차 — 어종 적수온(`preferredTempC`) ↔ 제철(`peakSeasonMonths`) ↔ 주 바다 평년 수온 대조. 제철에 수온 가중 평균이 0.7 아래면 찍는다.
// 사용: node tools/check_species_temp_season.mjs (core를 먼저 빌드)
const c = await import(new URL('../packages/core/dist/index.js', import.meta.url).href);
const ST = { east: ['gangwon_sokcho', 'gyeongbuk_pohang', 'ulsan', 'ulleungdo'], south: ['busan', 'gyeongnam_geoje', 'jeonnam_yeosu'], west: ['chungnam_taean', 'incheon'], jeju: ['jeju'] };
const fd = new Map(c.FISH_DATABASE.map((f) => [f.id, f]));
const flags = [];
for (const s of c.ORACLE_FISH_DB) {
  const f = fd.get(s.speciesId); const sw = c.SPECIES_SEA_WEIGHT[s.speciesId];
  if (!f || !sw) { console.log('NO DATA', s.speciesId); continue; }
  const rows = [];
  for (const sea of Object.keys(ST)) {
    if (sw[sea] < 0.8) continue;
    for (const r of ST[sea]) {
      const ws = f.peakSeasonMonths.map((m) => c.tempPresence(s.speciesId, c.climatologySstC(r, m)));
      const avg = ws.reduce((a, b) => a + b, 0) / ws.length;
      rows.push([r, avg, f.peakSeasonMonths.map((m) => c.climatologySstC(r, m)).join('/')]);
    }
  }
  const worst = rows.sort((a, b) => a[1] - b[1])[0];
  if (worst && worst[1] < 0.7) flags.push(`${s.speciesId} ${f.nameKo} T${f.preferredTempC.join('-')} peak[${f.peakSeasonMonths}] worst ${worst[0]} ${worst[1].toFixed(2)} sst ${worst[2]}`);
}
console.log(flags.join('\n') || 'none');
