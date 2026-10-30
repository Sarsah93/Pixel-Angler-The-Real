# 288 — Bite connectivity audit (region · weather/env · SST · habitat · method → which fish, how often, related events)

> 288차 조사 원문(영어 · 읽기 전용 감사 — 커밋 `7ea9f3a` 기준). 요약 · 고친 것 · 결정 대기는 [288 워크로그](../../docs/wiki/03-WORKLOG/2026-10-30-288-forage-legal-size-dev-games-bite-audit.md).
> 아래에 적힌 scratchpad 스크립트(`sim_*.mjs` 등)는 세션 임시 폴더라 저장소에 없다.

Read-only audit of commit `7ea9f3a` (287차). No repository file was changed.
Scripts and their raw output are in this scratchpad directory:

- `sim_species.mjs` — species distribution per region × month × day/night × rig (replicates `buildSpawnCtx` + mock KOSIS weights)
- `sim_extras.mjs` — egi (cephalopods) by region/season, deep-sea leak, KOSIS inversion, unreachable bait keys
- `sim_midwater_reef.mjs` — the `inReef` terrain misclassification for mid-water floats
- `sim_forage.mjs` — shore-foraging pool by region/month
- `db_consistency.mjs` — encyclopedia DB (`FISH_DATABASE`) vs bite DB (`ORACLE_FISH_DB`)
- `proto_presence.mjs` — prototype of the proposed presence factor (season × SST × sea) on top of the live oracle
- `temp_season_conflict.mjs` — `preferredTempC` vs `peakSeasonMonths` sanity check

All scripts import `packages/core/dist/index.js` (dist is current for the oracle — built 10-26/10-29, oracle source last changed 10-14).

---

## 1. The actual pipeline (live vs dead)

```
RegionFieldScene ──launch──► FirstPersonFishingScene (cfg.region, zMaxM from real depth profile, reefSeed, hole, fieldEvent)
                                   │
   every frame (scene 2467-2634)   ▼
   ┌───────────────────────────────────────────────────────────────────────────────┐
   │ FREQUENCY  baseProbPerSec = 0.035 (scene 2554)                                 │
   │   × baitAffinity  = oracle getBaitAffinity (avg pref/40, 0.25–1.6)  [live]    │
   │   × indexModifier = getFishingIndexModifier() → NATIONAL list[0]    [bug F06]  │
   │   × influence.biteMult (tidal zone 1.6 / 0.35)                      [live]    │
   │   × lureActionMult (pose · jig · lureKindTideMult)                  [live]    │
   │   × feeding.activity = computeFeedingActivity(hour KST, month LOCAL,          │
   │        tide flow, weatherKind, east_sea profile)                    [live,     │
   │        species-agnostic; pressure/coldShock never passed]                    │
   │   × fieldEvent.biteMult × skills/titles (weather, night=KST seasonal)         │
   │   × rigBiteMult × flasher × tideGenre × earthworm soak              [live]    │
   │ BiteProbabilityEngine.update (core 117-149): × terrain(reef hold 2.5)         │
   │   × (1+alignment) × action(2.0) × chum(1–4) → Math.random() < p·dt            │
   └───────────────────────────────────────────────────────────────────────────────┘
                                   │ 'bite'
                                   ▼
   SPECIES PICK  spawnFish(buildSpawnCtx(inReef)) — oracle 1031
     weightedCandidates (953-972) = intrinsicWeight (913-940)
         layerW (1/0.15/0.03) × depthW (1 or 0.2, line 924) × terrainFit (901-908, reef vs not-reef)
         × baitW (pref/50) × tideW (15-day table) × dayNightW (nightBonus) × phaseW (flow-phase table)
       × catchW (KOSIS, line 963) × lureBias × habitatBias(1.3) × washW (sea bass)
     NOT IN THE FORMULA: month/season, SST, sea/region distribution, weather, waves, mud vs sand, light
   SIZE   SizeTierRules (lure weight, night pelagic = small, zMax/50 gate, sizeBias) or gaussian;
          LWR × conditionFactorFor(month)  ← the only month effect on the fish itself
   FLAGS  closed season (month/day — LOCAL date), undersize, Gangwon octopus ordinance (only region use)
   SCHOOL rollSchoolHookup(month ∈ peakSeasonMonths, readiness)  ← second month effect (multi-hook only)
                                   ▼
   BITE TIMING  BiteSequenceEngine.start — 7 random patterns; fixed patterns only for 광어 · 감성돔 (62-65);
                stage gaps 1–180 s scaled by probPerSec
                                   ▼
   FIGHT  FightingPhase(powerFactor = basePower × size, fight profile, bodyForm)  — no SST/season effect
```

`buildSpawnCtx` inputs (scene 2769-2830):

| Input | Source | Status |
|---|---|---|
| depthZ / zMax | rig.baitZ / real depth profile | live |
| region | cfg.region | passed, but used only for KOSIS weights, tide K, octopus ordinance |
| tidePhase | `calculateTideInfo()` — national lunar model, no region (TideCalculator 80, 111) | live |
| month / day | `new Date()` local (2777) | live, local-time bug (F13); only affects weight/closed flags |
| flowPhase / strength / K | `tideNow()` | live |
| baitKey | `baitKeyOf` names (RigParts 66-81) | live; 4 keys unreachable (F10) |
| inReef | `nearBottom && seabed.isRockAt` (2467-2468) | live, wrong meaning (F07) |
| isNight | local `hour >= 20 \|\| hour < 5` (2786) | live, inconsistent (F14) |
| catchWeightBySpecies | KOSIS (mock in deploy) | live for 2/9 regions (F03-F05) |
| lure / hole / rig kit / hometown / flasher / wash / field-event biases | various | live |
| **SST, weather, wave, wind, pressure, visibility, substrate kind** | — | **never passed** |

Dead or orphaned:

- `FishBiteEngine.calculateBiteChance` / `pickFishByWeight` / `generateFishSize` (FishBiteEngine 237/393/412, exported index.ts:155) — zero callers. It is the **only** code that ever used SST, `seasonActivity`, a weather score, rig-type bonus and a storm gate.
- `FISH_BEHAVIOR_DB` (14 profiles with temperature curves; includes `night_seabream`, which is not an oracle species) — only consumer is the dead engine.
- `FISH_DATABASE.preferredTempC` (56/56), `peakSeasonMonths` (55/56 non-trivial), `preferredBaits` (BaitCategory vocabulary), `activeTidePhases` — not read by rod spawning (peak months are read by traps and school hookup only).
- `FeedingTimeInput.pressureTrendHpaPerHour` / `coldWaterShockIndex` — never supplied.
- `ShoreCreature.canBeUsedAsBait = true` on 소라 · 굴 · 홍합 · 거북손 — no `baitItemId`, so never becomes bait.

Related events:

| Event | Region-aware | Season-aware | Notes |
|---|---|---|---|
| Field boiling/schooling (FieldEventManager 91-106, 213-245) | no | no (frequency = feeding activity) | 삼치/방어 boiling anywhere, any month |
| Main-menu bite outlook (ExternalDataStore 687) | KOSIS only → empty for 7 regions | no | |
| Radio (RadioBroadcast 25-28) | Sokcho · Busan only; tide is national | — | |
| Rig recommendation (RecommendationStore 45-54) | KOSIS → fallback list with bad id | no | |
| Story catch goals | — | **yes** (`season: W/SU`) | engine doesn't make those seasons better |
| Shore foraging (ForagingEngine 193-250) | east-sea weight, regional closed seasons | **yes** (absentMonths, night, tide, wind/wave gates) | most connected subsystem |
| Traps (TrapSystem 186) | no | yes (peak months +15) | ignores eastSeaWeight/absentMonths |
| Nuisance blooms (NuisanceField 136) | no | yes (bloomMonths) | |

---

## 2. Findings

Severity: **B** = bug · **R** = realism gap · **D** = dead code/data · **I** = data inconsistency. Priority P0 (core of 288) / P1 / P2.
Size: S ≤ ½ day · M 1–3 days · L > 3 days or needs a design.

| ID | Sev | Pri | What happens now (evidence) | Why it matters | Proposed fix | Size |
|---|---|---|---|---|---|---|
| F01 | R | P0 | **Month has zero effect on which species bites.** `intrinsicWeight` (oracle 913-940) has no month term; month only feeds `conditionFactorFor` (1066), closed-season flags (1075) and the octopus ordinance (1074). Simulated total-variation distance Jan vs Aug = **0.00 %** for all 3 rigs, both Sokcho and Jeju. | Seasonality is the backbone of Korean fishing (겨울 방어 · 가을 삼치 · 늦가을 도루묵 · 여름 한치). Quests already require seasons (방어 겨울 ×4, 한치 여름, 도루묵 겨울) the engine doesn't support. | Add `seasonW` to `intrinsicWeight`: peak month 1.0 / adjacent 0.7 / other `floor` (0.3–0.4, director). Data already exists: `FISH_DATABASE.peakSeasonMonths` (55/56). Build a `speciesId → peakMonths` map once (SchoolHookup already imports FISH_DATABASE). Include it in `speciesBiteReadiness` numerator so school hookups follow too. | S |
| F02 | R | P0 | **SST is never used for bites.** `getWaterTempC` (ExternalDataStore 416) is read only by MainMenuScene 808 (display). Session weather cards already carry `waterC`. `REGION_TO_MMSI` (146-149) maps only Sokcho (station has **no** SST sensor) and Busan. Unmapped stations **with** SST exist: 인천 ×3 (1021000, 1021040, 994401001), 대산항 4422880 (→ 태안), 여수 1030384, 영일만 1103579 (→ 포항). No station for 제주 · 거제 · 울산 · 속초. Logbook SST comes from `EnvironmentStore` (default 20 °C, GameState 668), not ExternalDataStore. | Water temperature decides presence and activity (벵에돔 15 °C↑, 감성돔 영등철, 대구 냉수). Fetching it and dropping it is the most visible "fake realism". | Add `SpawnContext.waterTempC?`; `tempW = 1` inside `preferredTempC`, linear to `floor 0.03` at ±5 °C (or `FISH_BEHAVIOR_DB.tempActivityCurve` when present — `interpolateTempActivity` already exists). Source order: live station → 바다낚시지수 point `waterTempC` (the index API returns SST per point) → region × month climatology table (new core data). Map the 4 extra stations. Logbook: use the same SST. | M |
| F03 | R | P0 | **Region barely matters.** The only regional species term is KOSIS (`catchW`). Deploy has no KOSIS key and prod has no proxy → mock data → only Sokcho & Busan get weights (see F04). Jeju ≡ Taean ≡ Ulsan (**TVD 0.00 %**); Sokcho vs Jeju 0.8–10 %. Examples: 긴꼬리벵에돔 = **2.5 %** of Sokcho January reef-float bites; 도루묵 = **6.5 %** of Jeju August surf bites; egi in Sokcho January = 무늬오징어 **44.6 %** + 한치 **34.0 %**; 대문어 (East-Sea cold-water) = **7 %** of egi in Jeju. | "어디서 낚느냐" is half the game; 13 data regions now look different but fish the same. | Per-species sea distribution `seaW: { east, south, west, jeju }` (0–1) as data in the oracle spec (55 rows; notes already say e.g. 도다리 "군산/목포/여수/마산/진해/부산", 도루묵 동해, 대문어 동해, 긴꼬리 제주/남해 먼바다, 한치 제주·남해). One core helper `seaOf(regionId)` used by spawn, forage, feeding profile, tide K. KOSIS becomes a mild ±20 % modulation. | M (data) + S (logic) |
| F04 | B | P0 | `getCatchWeights` uses `row.regionName.startsWith(sido)` (554) with `REGION_TO_SIDO` short names (67-79: '경북', '경남', '전남', '충남'), but KOSIS/mock names are full ('경상북도', '경상남도', '전라남도' — KosisCatchApiClient 34-41). Mock rows for 경북/경남/전남 are silently dropped → 포항 · 거제 · 여수 · 태안 · 울릉 · 독도 always `{}`. | Even the only regional signal is missing for 7 regions. | Map each region to an alias list (`['경북','경상북도']` …) and match any. | S |
| F05 | B | P1 | KOSIS weight inversion: listed species get `0.7 + 1.1·v/max` (566), **unlisted get 1.0** (oracle 963 `?? 1`). Sokcho 감성돔 (60 t) → 0.857 < 긴꼬리벵에돔 (0 t) → 1.0. Measured: 감성돔 share 4.9 % → 4.2 % because it *is* caught in Gangwon. | Penalises species for being recorded. | Unlisted = the region's minimum (0.7) or normalise listed weights to mean 1 and clamp 0.8–1.25. | S |
| F06 | B | P1 | Fishing-index bite modifier is national: scene 2530 calls `getFishingIndexModifier()` without a place → `list[0]` (511). `REGION_TO_INDEX_KEYWORDS` (51-54) has only Sokcho/Busan; others fall back to `list[0]` (592). Deploy injects `VITE_DATA_GO_KR_API_KEY` (deploy-pages.yml:55), so this is real data from an arbitrary point. | Every region's bite rate is scaled 0.7–1.4 by some other coast's index. | Pass the region: `getRegionFishingIndex(cfg.region)`; add keywords for all 9 regions (울산 방어진/슬도 · 포항 구룡포/영일만 · 거제 지세포/구조라/해금강 · 여수 돌산 · 태안 안흥/만리포/신진도 · 제주 도두/모슬포/서귀포 · 인천 연안부두); no match → 1.0, never `list[0]`. | S |
| F07 | B | P0 | **Terrain = "bait within 1.2 m of a rocky bottom"** (`inReef = nearBottom && isRockAt`, scene 2467-2468). A mid-water float over a reef is scored as *sand* by `terrainFit` → reef-only species ×0.25, `open` species ×1. Busan July, bread float at 6 m over a 12 m reef: 벵에돔 **11.5 %** (38.3 % if the reef counted); with krill 긴꼬리벵에돔 **16.8 %** vs 벵에돔 **1.6 %** (reality: the reverse). 쥐치 · 망상어 · 말쥐치 ×3.5 under-weighted. | Breaks the iconic 찌낚시 target in the exact rig used for it. | Split the two meanings: spawn gets `bottomKind = seabed.isRockAt(distM) ? 'reef' : 'sand'` regardless of bait height; `BiteProbabilityEngine` keeps "bait touching reef" for its terrain/hold multiplier. | S |
| F08 | R | P1 | Mud vs sand indistinguishable; substrate is random. `terrainFit` knows only reef/not-reef; `open` counts as sand-like. `SeabedProfile` rock ratio comes only from `snagRisk` (scene 641-647). 태안/인천 mudflats ≡ 속초 sand. | 서해 갯벌 species (개서대 · 가숭어 · 양태) need mud. | `RegionAreaNode.bottomMix {rock, sand, mud}` → SeabedProfile emits 3 kinds → `terrainFit` 3-way (mud species ×1 on mud, ×0.5 on sand …). | M |
| F09 | R | P1 | Depth gate leaks deep species to shore: `depthW = 1` or `0.2` (924). 12 m breakwater, night, fish strip: 눈볼대 (100–400 m) **2.6 %**, 태평양 대구 (45–450 m) **1.0 %**. | Deep-sea premium fish from a harbour wall. | Graded falloff below `minDepthM·0.5`: `exp(-3·deficit/minDepth)`, floor 0.003 (or a `shoreReachable` flag). | S |
| F10 | D | P1 | **Unreachable bait keys**: `urchin`, `shellfish`, `corn`, `livefish` have no hookable item (bait items are only 크릴 · 백크릴 · 청갯지렁이 · 혼무시 · 지렁이 · 땅지렁이 · 빵가루 · 생선 조각 · 쫄장게(crab) · 갯강구(slater)). 28 species carry dead preference mass; **12 species' top preference is unreachable**: 돌돔 · 강담돔 (urchin), 부시리 · 방어 · 우럭 · 광어 · 대구 · 양태 (livefish), 참복 · 쥐치 · 말쥐치 (shellfish). Corn exists only as chum `옥수수 캔 (밑밥용)` (InventoryStore 793 — `partKindOf` → null); chum kind `grain` affects physics only. `canBeUsedAsBait` true on 소라/굴/홍합/거북손 (ShoreCreatureDatabase 131/160/376/422) but no `baitItemId`; 성게 is `false`. | Classic methods (돌돔 성게 · 감성돔 옥수수 · 활어 광어/부시리) can't be done; lure becomes the only path to those species. | Data: give 홍합 · 굴 · 거북손 a `baitItemId` (→ shellfish), 말똥성게/보라성게 → urchin (set `canBeUsedAsBait`), add a shop `미끼용 옥수수` (corn) — with seed backfill (skill `save-migration`). `livefish` needs a live-bait design (keep small 전갱이/망둑 alive in 살림통 + 기포기) → director. | S (3 keys) / L (livefish) |
| F11 | D | P2 | `FishBiteEngine` (whole file) + `FISH_BEHAVIOR_DB` unused (see §1). | Two "bite engines" confuse every future reader; real curves are buried there. | Move `tempActivityCurve`/`seasonActivity` into the F01/F02 factor (or drop), then delete or `@deprecated` the engine and its index exports. | S |
| F12 | I | P1 | Encyclopedia ≠ bite engine. `db_consistency.mjs`: nocturnal mismatch 5 (참돔 · 고등어 · 긴꼬리 · 갑오징어 · 양태 — oracle `nightBonus` > 1, guide says diurnal), depth mismatch 4 (감성돔 guide 2–25 m vs oracle 10–40 m; 부시리 · 우럭 · 방어), layer 1 (용치놀래기). Guide shows FISH_DATABASE (AnglerLogScene 455, ItemDetailPanel 848). Two bait vocabularies (BaitCategory in FISH_DATABASE vs BaitKey in oracle). | Players follow the guide and it lies. | Make the oracle the source for depth/layer/night in the guide, or align the 10 rows. Drop/convert `preferredBaits`. | S |
| F13 | B | P1 | Fishing uses local OS time: `buildSpawnCtx` hour/month/day (2770, 2777) and `refreshFeedingActivity` month (2716) use `new Date()`. Foraging fixed this in 232차 (`kstParts` · `isNightNow`). | Overseas/OS-timezone players get wrong night, season and closed-season day; multiplayer peers disagree. | `kstParts()` / `kstHour()` everywhere in the fishing scene. | S |
| F14 | B | P1 | Night is defined twice: oracle 20–05 fixed (2786) vs core `isNightHour` seasonal (KstTime 68-76: winter 17–07) used by skills (2765), forage and visuals. Winter 17–20 h: dark screen + night skill, but oracle treats it as day (갈치 nb 2.5 → ×0.55). No dawn/dusk term though ~9 species are commented "여명/황혼 피딩". | Night/twilight is the strongest lever (day vs night TVD 22–41 %), so its boundary matters. | `isNight: isNightNow()`; optional `twilightW` (±1 h around sunrise/sunset) for crepuscular species (data flag). | S (+S) |
| F15 | R | P2 | Tide is national and two-class: `calculateTideInfo`/`tideFlowStateAt` take no region (same high/low times in 인천 and 속초); `tideRegionK` is 0.3 (east) or 1 (all else) — 서해 (6–9 m range) = 부산 (~1.2 m); 울산 → 1. | 서해 물때 should matter *more*; 동해 less; times differ by hours. | Region tide profile table (K, flowK, phase offset min) keyed by `seaOf`/region; `TIDE_STATION_CODES` exists for later real offsets. | S (K) / M (offsets) |
| F16 | B | P1 | `isEastSeaRegion` (ForagingEngine 147) and `feedingRegionProfileOf` (FeedingTimeCalculator 192) both miss `ulsan`. 오분자기 (`eastSeaWeight 0`) = 1.7 % of Ulsan night shallows; also appears in 태안/인천 (no west gate) and 꽃게 in 인천 January. | Wrong coast class for one region; forage also lacks a west/Jeju dimension. | One `seaOf(regionId)` in core; creatures get `seaWeight {east,south,west,jeju}` replacing `eastSeaWeight` (keep it as fallback). | S |
| F17 | R | P2 | Weather is thin and species-agnostic: only `weatherActivityFactor` (rain ×1.05, snow ×0.85, fog ×0.92) + skill multipliers. Waves affect only sinker rolling/hole slip; no storm gate for rod fishing (forage has wind/wave gates); pressure trend never supplied (NMPNT has 기압). | 농어 · 감성돔 파도/흐림 강세, 벵에돔 맑은 날 경계, 폭풍 출조 불가 — none expressible. | Species weather affinity data (`roughWaterBonus`, `clearWaterShy`), pass `waveHeightM`/pressure trend; storm gate → director. | M |
| F18 | R | P2 | Feeding hour windows are one curve for every species (`seasonTimeWindow` 85): summer 12–17 h ×0.35 for all. | Volume knob, acceptable, but hides species timing. | Leave; fold species timing into F14 twilight + nightBonus. | — |
| F19 | R | P2 | Tide data thin: 42/55 species have a flat 15-day `tideActivity`; flow-phase table covers 30/55. | Moon-phase strategy only for a few species. | Data pass (group defaults by family). | M |
| F20 | R | P1 | Field events use static species lists (FieldEventManager 91-106): 삼치/방어/부시리 boiling in Sokcho January. | Visible "wrong" event; also boosts tier. | Multiply event bias by the presence factor; drop species with presence < 0.2 from the bias. | S (after F01-F03) |
| F21 | R | P2 | Area texts promise patterns the engine can't make (busan_area_baekunpo "벵에돔은 초여름(수온 15℃↑)", 속초 "여름 오징어 · 겨울 볼락", 감천 "감성돔 피크 겨울"). Sokcho's real summer squid (살오징어) is not a species; egi there yields 무늬/한치. | Narrative ≠ simulation. | Falls out of F01-F03; consider adding 살오징어 (skill `add-species`). | M |
| F22 | I | P2 | Season handled inconsistently: traps (TrapSystem 186) and school hookup (SchoolHookup 48-50) use `peakSeasonMonths`, forage uses `absentMonths`, nuisance `bloomMonths`, rod spawn nothing. | Same fish is "in season" for a trap but not a rod. | One `seasonW(speciesId, month)` in core used by all. | S (with F01) |
| F23 | B | P2 | RecommendationStore fallback `['black_seabream','flatfish','rockfish']` (53) — `rockfish` doesn't exist (silently skipped). Fallback is used for 7/9 regions (KOSIS `{}`); top baits = livefish/crab/lure → "추천" never marks a buyable bait. | Recommendation is generic and partly empty. | `black_rockfish`; build targets from `seaW × seasonW` instead of KOSIS. | S |
| F24 | I | P2 | 돌문어 forage id `octopus_vulgaris` ≠ oracle `octopus`. Rules agree (5.16–6.30), texture shared (BootScene 141), but encyclopedia/market/butchery treat them separately. | Two identities for one animal. | Alias in market/butchery/discovery (`ItemIdAlias`) or shared `speciesId`. | S–M |
| F25 | R | P1 | External data coverage: MMSI 2 regions, index keywords 2, radio 2, main-menu outlook empty for 7 regions. (KMA weather grid covers all 11 — weather kind/wind/wave **are** regional.) | Data panels and radio are Sokcho/Busan-only in a 13-region world. | Data tables (+ F06). | S |
| F26 | B (latent) | P0-prereq | When no candidate survives, `spawnFish` draws **uniformly over all 55 species** incl. egi-only and filtered ones (oracle 1032-1035), and `getBaitAffinity` returns 0.25 (not 0) so bites still occur. Probe: 0/324 hometown contexts hit it today — but any hard gate (season/sea floor = 0) will trigger random fish. | Prerequisite for F01-F03 if floors can reach 0. | Callers check `candidateCount(ctx) === 0` → no bite (as the flasher path already does, scene 2527-2528); `spawnFish` keeps the fallback only as a last resort. | S |
| F27 | R | P2 | Size not seasonal (겨울 대방어 bigger); month only changes weight via condition factor. | Minor. | Season tier shift for listed species. | S |
| F28 | R | P2 | No light attraction (집어등/항 가로등) though 고등어 · 전갱이 · 갈치 · 꽁치 · 한치 notes cite it; `lights.json` exists per region. | Night harbour realism. | `nearLight` ctx flag → ×1.3–1.6 for photophilic species. | M |
| F29 | R | P2 | Bite signatures: fixed patterns only for 광어 · 감성돔 (BiteSequenceEngine 62-65); others random. | 벵에돔 약은 입질 · 복어 갉기 not felt. | Per-species pattern weights (data). | M |
| F30 | I | P2 | Trap creature pool ignores `eastSeaWeight`/`absentMonths` (TrapSystem 124-129) unlike forage. | 꽃게 trap in Sokcho at full rate. | Reuse the forage filter. | S |

Count: **B 9** (F04 F05 F06 F07 F13 F14 F16 F23 F26-latent) · **R 15** (F01 F02 F03 F08 F09 F15 F17 F18 F19 F20 F21 F25 F27 F28 F29) · **D 2** (F10 F11) · **I 4** (F12 F22 F24 F30) — 30 total.

### Earlier notes — confirmed / refuted

| Note | Verdict |
|---|---|
| SST fetched but never used | **Confirmed** (display only). Worse: only Busan even has a mapped SST station; 4 SST stations are unmapped (F02). |
| Region = KOSIS 0.7–1.8 only, warm species in Sokcho | **Confirmed** and worse: only Sokcho/Busan get any weight (prefix bug F04), and unlisted species get 1.0 > small listed ones (F05). 긴꼬리벵에돔 2.5 % in Sokcho January. |
| Month doesn't affect spawn | **Confirmed** (TVD 0.00 %). Month only affects weight, closed flags, school hookup, and the species-agnostic hour window. |
| No urchin/shellfish/live-fish bait items → dead preferences | **Confirmed**, plus `corn`; 12 species' top preference unreachable; `canBeUsedAsBait` flags dead (F10). |
| 감성돔 corn 30 but corn only as chum | **Confirmed** (InventoryStore 793; grain chum has no species effect). |
| `calculateBiteChance` dead | **Confirmed** (+ `pickFishByWeight`, `generateFishSize`, `FISH_BEHAVIOR_DB`). |
| RecommendationStore `'rockfish'` | **Confirmed**; impact larger than it looks (fallback used in 7/9 regions). |
| 돌문어 forage id ≠ oracle id | **Confirmed** (`octopus_vulgaris` vs `octopus`); legal rules are consistent — low severity. |
| Ulsan `isEastSeaRegion` false | **Confirmed**; also `feedingRegionProfileOf('ulsan')` = default → tide K 1. |
| External data only Sokcho & Busan | **Confirmed** for MMSI, index keywords, radio, KOSIS (effectively). **Refined**: KMA weather covers all 11 regions, so weather kind/wind/wave are regional — they just barely affect bites. |

New, not in the earlier notes: F06 (national fishing index), F07 (mid-water reef = sand — biggest single distortion), F09 (deep-sea leak), F12 (guide ≠ engine), F13/F14 (local time, two night definitions), F20 (events), F26 (uniform fallback).

---

## 3. Quantification

Same terrain/bait in every row; tide fixed (8물, `flood_mid`, strength 0.7); weights from mock KOSIS exactly as the deployed build computes them.

**Catch weights actually produced** (mock KOSIS): Sokcho 10 species (가자미류 1.8 …, 감성돔 0.86), Busan 2 (고등어 1.8, 전갱이 1.19), **Jeju / Taean / Ulsan / Pohang / Geoje / Yeosu / Incheon: none.**

**Total-variation distance between species distributions** (0 % = identical, 100 % = disjoint):

| Comparison | Reef float, krill (12 m) | Sand surf, worm (8 m) | Surface lure (15 m) |
|---|---|---|---|
| Season — Sokcho Jan vs Aug, day | 0.00 % | 0.00 % | 0.00 % |
| Season — Jeju Jan vs Aug, day | 0.00 % | 0.00 % | 0.00 % |
| Region — Sokcho vs Jeju, Aug day | 3.10 % | 10.24 % | 1.51 % |
| Region — Jeju vs Taean, Aug day | 0.00 % | 0.00 % | 0.00 % |
| Region — Sokcho vs Busan, Jan day | 4.50 % | 10.48 % | 2.72 % |
| Day vs night — Sokcho Aug | 27.32 % | 22.05 % | 40.80 % |

Night is the only strong lever. Region differences come entirely from mock KOSIS rows.

**Top bites, Sokcho January daytime surface lure:** 삼치 26.4 % · 방어 16.1 % · 부시리 14.6 % · 농어 11.9 % — identical to Jeju August (삼치 26.9 % · 방어 16.4 % · 부시리 14.8 % · 농어 11.8 %).

**Egi (spawnBinding filter)** — Sokcho January day: 무늬오징어 44.6 % · 한치 34.0 % · 갑오징어 7.5 % · 돌문어 7.0 % · 대문어 7.0 %; Jeju is within 1 point of that in every month.

**Base bite-rate inputs** (07:30 KST, reef float krill): mean wait before bonuses Sokcho Jan 70 s / Aug 42 s; Jeju Jan 56 s / Aug 36 s. The season difference here is the *hour window* (winter mornings 0.42 vs summer 0.65) applied to all species alike; `baitAffinity` ≈ 1.02 everywhere.

**Prototype presence factor** (`proto_presence.mjs` — `tempW(preferredTempC, rough SST climatology) × seasonW(peakSeasonMonths: 1/0.7/0.4) × seaW` with only 11 illustrative `seaW` rows):

| Rig | TVD season (Sokcho) now → proposed | TVD region (Sokcho vs Jeju, Jan) now → proposed |
|---|---|---|
| Reef float krill | 0.0 % → 56.2 % | 1.5 % → 19.6 % |
| Sand surf worm | 0.0 % → 54.9 % | 0.8 % → 23.3 % |
| Surface lure | 0.0 % → 61.6 % | 0.9 % → 44.8 % |

Examples: 긴꼬리벵에돔 Sokcho Jan 2.54 % → 0.00 %, Jeju Aug 2.65 % → 7.00 %; 도루묵 Jeju Aug 6.51 % → 0.00 %, Sokcho Jan 6.59 % → 11.7 %; 삼치 Sokcho Jan lure 26.7 % → 2.8 %.
The prototype also exposed a data problem: 방어 `preferredTempC` 18–26 °C contradicts its winter peak (`[11,12,1]`) — a naive SST factor deletes 방어 in its own season (Sokcho Jan 16.2 % → 4.3 %). `temp_season_conflict.mjs` flags 방어 and 도루묵 as tight; the temperature ranges need a review before SST is wired (real 방어 range ≈ 14–20 °C).

**Mid-water reef misclassification** (F07, Busan July, float at 6 m over 12 m reef): bread — 벵에돔 11.5 % (38.3 % if the reef counted); krill — 벵에돔 1.6 % (5.9 %) while 긴꼬리벵에돔 16.8 %.

**Deep-sea leak** (F09, 12 m, night, fish strip): 눈볼대 2.6 %, 태평양 대구 1.0 %.

**Forage** (`sim_forage.mjs`, night shallows, 200 seeds): 오분자기 Ulsan Aug 1.7 %, Taean Aug 1.7 %, Incheon Jan 2.4 %; Jeju Aug 0 % (regional closed season works); 해삼 Jan 1.5 % / Aug 0 % (absentMonths works). Forage already responds to month, night, tide, wind/wave and east sea — it is the model the rod side should copy.

---

## 4. Recommended fix order

Smallest high-impact first. "Data" = tables only; "Logic" = code; ⚑ = needs a director decision.

**Step A — bugs that need no decision (each S, ~1–1.5 days total)**

1. **F07** spawn terrain = bottom under the bait, not "bait touching reef" — logic. Biggest single distortion; fixes 벵에돔/쥐치/망상어 in 찌낚시.
2. **F13 + F14** KST time and one night definition (`isNightNow`) in the fishing scene — logic.
3. **F06** fishing index per region + keywords for 9 regions, no `list[0]` fallback — logic + data.
4. **F04 + F05** KOSIS region aliases and neutral weight for unlisted species — data + logic.
5. **F16** one `seaOf(regionId)` helper (east/south/west/jeju; Ulsan = east) used by forage, feeding profile and tide K — logic. Foundation for F03.
6. **F26** no candidate → no bite (callers check `candidateCount`) — logic. Prerequisite for any zero floor.
7. **F23** `'rockfish'` → `'black_rockfish'` — data.

**Step B — the presence factor (the core of 288, ~3–5 days)**

8. **F01** `seasonW` from `peakSeasonMonths` (data exists) inside `intrinsicWeight` and `speciesBiteReadiness`; also used by traps/school (F22) — logic S. ⚑ floor value and whether off-season can be 0.
9. **F03** `seaW` per species × `seaOf(region)` — data M (55 rows) + logic S. ⚑ which species are absent (0) vs rare per sea; whether egi species (한치 · 무늬 · 대문어) get sea limits; whether to add 살오징어 (F21).
10. **F02** SST: `waterTempC` in `SpawnContext`, `tempW`, climatology table, 4 more stations, index-point SST fallback, logbook uses it — logic + data M. ⚑ climatology source (NIFS/KHOA monthly means) and SST precedence. **Review `preferredTempC` first** (방어 conflicts with its own season).
11. **F09** graded depth falloff — logic S.
12. **F20** field events multiplied by presence — logic S.
13. **F11** harvest `FISH_BEHAVIOR_DB` curves into step 10, then delete `FishBiteEngine` — logic S.

New `SpawnContext` fields stay optional with neutral defaults, so `SchoolHookup.test` · `ClosedSeason.test` · `Earthworm248.test` keep passing. `TideInfo`/`SpotType` are untouched.

**Step C — bait and data alignment (~2 days + design)**

14. **F10** shellfish/urchin/corn hook baits (홍합 · 굴 · 거북손 · 성게 `baitItemId`, shop `미끼용 옥수수`) — data S + seed backfill (`save-migration`). ⚑ `livefish` live-bait system — L.
15. **F12** align encyclopedia with the oracle (10 rows) and drop the BaitCategory vocabulary — data S.
16. **F25** radio/outlook/MMSI coverage — data S.
17. **F19** tide tables for the 25 uncovered species — data M.

**Step D — larger realism (later)**

18. **F08** mud/sand/rock mix per area — M.
19. **F15** regional tide K and time offsets — S/M.
20. **F17** species weather affinity + wave/pressure inputs — M. ⚑ storm gate for rod fishing (forage already blocks).
21. **F28** lights, **F29** bite signatures, **F27** seasonal size, **F24** octopus alias, **F30** trap filter — S–M each.

**Director decisions needed (⚑)**

- D1 — Floors: should off-season / off-sea species be **impossible** or **rare**? Quests matter here: catch goals are not region-locked (only when `o.regionId`), but several goals have no season (방어 lines 249/670/776/974, 한치 789, 돌돔 816/1243), and **N02-3 asks for a 태평양 대구 80 cm+ at 서귀포 (Jeju)** — a cold-water fish in the warmest region. A hard zero would make it effectively impossible there.
- D2 — SST source and climatology table; multiplayer already shares `waterC` through session weather cards.
- D3 — Live-bait (`livefish`) scope.
- D4 — Storm/wave gate for rod fishing.
- D5 — KOSIS role after `seaW` exists (minor modulation or remove from spawn).
- D6 — Add 살오징어 for the East Sea; limit egi species by sea.
