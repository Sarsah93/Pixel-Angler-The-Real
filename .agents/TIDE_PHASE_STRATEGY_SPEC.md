# 물때 흐름 × 장르 × 어종 공략 스펙 (205차 구현 완료 — 수치 조율 대기)

> 2026-10-04 · 204차 조사(웹 16회 · 출처 35건 — 문서 끝). **상태: 205차 구현 · 수치 조율 대기**. 사용자 지시 원문:
> "웹 검색 등을 통해 추가로 구현할 수 있는 부분들을 finding하고, 현재 인게임에 구현된 상황에 맞게 최적으로 반영할 수 있는 방법 추천
> 및 적용 예시 정도로 알려줘. 방향 결정되면 추가로 구현할 수 있게."

## §0. 204차에 이미 들어간 것 (이 문서의 P0 + 전역 곡선 일부)

- core `simulation/TideFlowPhase.ts` — 8단계 판정(`tideFlowStateAt`) · 단계별 입질/대물/조류 성향(`TIDE_FLOW_PROFILE`) · 사리/조금 스케일.
- 전역 피딩: `computeFeedingActivity({ flowPhase, deepSpot })` — 구 근사(만조 90분 전↑·간조 45분 전↓, 물돌이에 오히려 최고치) 대신 단계 곡선.
- 대물 가중: `SpawnContext.sizeBias` → `rollTierWeights`(소형 몫 최대 35% 이전) · 가우시안 어종은 평균 +0.5σ×bias.
- 조류 위상 정합(아래 §1 「조류 물리와 만조·간조 시각이 따로 논다」): 1인칭 `tideClockHours()`가 직전 극점 경과를 반주기 6.25h로 펼쳐
  `TidalCurrentEngine`에 넣는다 → 물돌이에 유속 최소, 중들물·중날물에 최대. 엔진 자체는 무수정.
- 패시브 스킬 「물때 감각」(`fish_tide` 재배선) · 물때 타이틀 6종(초들물 · 물돌이 · 본류대 · 끝날물 · 8단계 · 사리/조금).

**205차 구현**(사용자 확정 2026-10-04 — 「전부 그대로 · 동해 감쇠 적용」):

- P1: 어종 13묶음 표(`db-schema/TidePhasePreference.ts`) → 오라클 스폰 가중 · 활성도 기준값 · 물때 곡선 정정(돌돔·강담돔 쌍봉 · 청볼락 조금 · 광어 평탄 · 갑오징어 조금).
- P2: `simulation/TidePhaseStrategy.ts` — 찌 밑밥 쌓기/풀림 · 밑밥 띠 · 원투 봉돌 구름 · 루어 종류 · 구멍치기 수위.
- P3: 어종별 대물 단계 · 해루질 간조 시간창(+들물 경고) · 통발 평균 물살 · 발견 기록(`TideLoreStore` — 잘 무는 물때에 잡으면 한 줄 + 도감).
- 동해 감쇠: `TUNING.tidePhase.eastSeaK` 0.3(어종·대물·수위·해루질·통발) · `eastSeaFlowK` 0.4(물살). 전역 피딩의 동해 지수(0.45)는 그대로.
- 안 한 것: 선상 드리프트(선상 낚시 미구현) · `TideCalculator` 수위 진폭(완료 시스템 — 대신 물때 흐름에서 수위를 잇는다).
- 상세: `docs/wiki/03-WORKLOG/2026-10-04-205-tide-species-genre.md`. 배율 숫자는 여전히 설계 초안 — F8로 조율.

---

# 물때 8구간(조류 흐름 단계) 전략 리서치 · 게임 적용안

> 조사일 2026-10-04 · 레포 읽기 전용 · 대상: `packages/core` 오라클/피딩/조류 엔진 + `FirstPersonFishingScene`
> 신뢰도 표기: **[근거]** 공공기관·복수 매체 일치 / **[커뮤니티]** 낚시 매체·블로그 1~2곳 / **[통설]** 격언·민간 지식(수치 근거 없음)
> ⚠ fishingseasons.co.kr · moolttae.com · bfg-fishing.com 본문은 egress 차단으로 **검색 요약만** 확인했다(원문 미열람).

---

## 1. 현재 구현에서 확인한 것 (꽂을 자리)

| 위치 | 지금 하는 일 | 8구간 관점의 한계 |
|---|---|---|
| `FishSpawningOracle.FishMasterSpec.tideActivity` | **1~15물(사리/조금)** 15칸 활성도. 대부분 `flatTide(v)` 또는 `sariPeak(base,peak)` | 하루 안의 들물/날물 단계는 없음 |
| `intrinsicWeight()` → `weightedCandidates` / `speciesBiteReadiness` | 수심층×수심×지형×미끼×`tideW`×주야 | 어종별 단계 배율을 곱할 **최적 지점**. `speciesBiteReadiness`의 `ideal`도 같이 고쳐야 함 |
| `FeedingTimeCalculator.tideActivityFactor` | 어종 무관. 들물 만조 90분 전 ×1.15, 날물 간조 45분 전 ×0.7 | 만조 직후·간조 직후(물돌이 후반 30분)는 페널티 없음 → 비대칭. `feedingRegionProfileOf`는 `'south_sea'`를 **반환하지 않음**(부산 = default) |
| `TidalCurrentEngine.tideFactor(hoursNow)` | `sin(2π/12.5 × 벽시계 시각)` | **TideCalculator의 만조/간조 시각과 위상이 맞지 않는다** — HUD는 「만조」인데 조류 물리는 최강일 수 있음(1889·4636행 `hoursNow = getHours()+min/60`). `isFloodTide`·세기는 씬 create 1회 고정 |
| `TideCalculator` | 음력→물때, `estimateTideTimes` 근사, 수위 = 150±100×세기(cm) | 수위 진폭이 **지역 무관**(속초 실제 대조차 ≈30cm). `currentWaterLevelCm`가 `highTides[0]`만 기준 |
| `SizeTierRules.rollTierWeights` | 루어 무게·청물 야간·급심·이벤트 | 「물돌이 대물」류 단계 편향을 넣을 `TierRollContext` 필드 자리 있음 |
| `FirstPersonFishingScene` 2273행 `baseProbPerSec` | `baitAffinity × influence.biteMult(존) × lureActionMult × feeding.activity …` | 장르(찌/원투/루어/구멍치기)별 단계 배율을 곱할 지점 |
| 밑밥 `ChumPhysics` + `TUNING.chumSync` | 투척 파셀이 조류 벡터로 흘러 동조율 산출 | 정조 때 「밑밥 쌓기」 누적 개념 없음 |
| `NightHuntingEngine` | 수위비 <0.3 +20 / <0.5 +10, 만조 70%↑ 경고 | 간조 기준 시간창(−2h~+1h)·사리 가중 없음 |
| `TrapSystem` | `context.tide`를 받지만 **미사용** | 단계 효과 0 |

현존 장르: 찌(드리프트·밑밥 동조) · 원투(`surfMode`) · 루어(`lureMode` — `LureKind` 8종:
worm_grub/soft_jerkbait/plug_minnow/spoon/spinner/egi/metal_jig/tairaba) · 구멍치기(`cfg.hole`) · 편대(원투 계열).
선상은 미구현(예정).

---

## 2. 리서치 결과 — 공통 원리

1. **물이 「움직이기 시작할 때」가 최고, 완전 정조는 최저** — [근거]
   일본 격언 「上げ三分・下げ七分」은 간조 0·만조 10으로 볼 때 **물돌이 후 1~2시간, 흐름이 붙기 시작한 때**를 뜻한다.
   한국 매체도 초들물을 「멈춘 조류가 다시 흐르며 고기들이 적극적 먹이활동」으로 설명. 영어권 가이드도 동일(최대 유속은 간만 중간).
   → 게임 8구간에서 **초들물·초날물 = 공통 상향**, **물돌이 = 공통 하향(단, 어종 예외 있음)**.
2. **물돌이 ±30분은 「멈추기 직전 / 움직이기 직전」의 짧은 찬스** — [커뮤니티]
   アオリイカ: 潮止まり 前後30分에 베이트가 고이고 움직이는 순간 스위치. 감성돔: 「의외로 물돌이에 대물」.
   チヌ(감성돔)는 정조에도 낚인다, グレ(벵에돔)는 조류에 민감해 조류 나쁘면 안 문다 — 어종 간 차이가 핵심.
3. **사리 = 조류 강·물색 탁함 / 조금 = 조류 약·물 맑음** — [근거](조석 원리) + [커뮤니티](어종 영향)
   돌돔은 「사리·조금 피한 중간물때(3~5물, 11~13물)」, 볼락은 「조금~6물」, 쭈꾸미·갑오징어 선상은 「무시~3물」,
   서해 선상 우럭·광어는 「조금 전후(11물~2물)」 — 바닥 채비가 바닥에 머물러야 하는 낚시는 약조류 선호.
   반대로 워킹(연안) 쭈꾸미는 「흘릴 물이 있어야」 사리 선호 — **같은 어종도 장르에 따라 뒤집힌다**.
4. **동해는 조차가 작다** — [근거] 국립해양조사원/해수부: 동해안 조차 **약 30cm 내외**(속초 기준검조소).
   일부 블로그의 「동해 1~2m」는 과대 — KHOA 수치를 쓴다. 동해 낚시는 「물때보다 시간대·수온·기압」이 우선(복수 매체).
5. **밑밥 쌓기** — [커뮤니티] 「중들물에 고기가 들어오는 포인트라도 간조·초들물부터 품질(밑밥) 시작해야 입질이 오래 간다」.
   グレ는 밑밥을 「점이 아니라 띠」로 — 띠 길이는 조류 속도에 비례.

---

## 3. 어종 × 8구간 선호 (사용자 예시 + 추가분)

구간 약어: **LS** 간조물돌이 · **F1** 초들물 · **F2** 중들물 · **F3** 끝들물 · **HS** 만조물돌이 · **E1** 초날물 · **E2** 중날물 · **E3** 끝날물.
배율은 「그 어종의 다른 조건이 같을 때 상대 입질 가중」 초안(1.0 = 중립). 근거 강도를 함께 적는다.

| 어종 (speciesId) | LS | F1 | F2 | F3 | HS | E1 | E2 | E3 | 근거·메모 |
|---|---|---|---|---|---|---|---|---|---|
| 감성돔 `black_seabream` | 1.10 | **1.25** | 0.95 | **1.20** | 1.15 | **1.15** | 0.90 | 1.15 | 사용자 예시 + 「끝썰물~초들물 최고」「물돌이 대물」[커뮤니티]. 정조 내성(チヌ)[커뮤니티] |
| 벵에돔 `largescale_blackfish` / 긴꼬리 | 0.75 | 1.15 | 1.10 | 1.05 | 0.75 | 1.15 | 1.10 | 1.00 | 「적당히 흐를 때·전환 시점·해질녘」, グレ 조류 민감[커뮤니티]. 사리 탁수 감점 |
| 돌돔 `stone_beakperch` / 강담돔 | 0.90 | **1.30** | 1.05 | 0.90 | 0.90 | **1.35** | 1.15 | 0.90 | 「약하다 빠르게 살아날 때」「초들물·초썰물 물돌이」「썰물이 들물보다 빠른 포인트 多」[커뮤니티] |
| 참돔 `red_seabream` | 0.60 | 1.10 | **1.30** | 1.00 | 0.60 | 1.10 | **1.30** | 1.00 | 사용자 예시(강조류) + 타이라바 「정조엔 스커트 움직임 약화→입질 감소」[커뮤니티] |
| 광어 `flatfish` · 우럭 `black_rockfish` | 0.85 | **1.30** | 0.90 | 1.00 | 0.85 | **1.30** | 0.90 | 1.00 | 사용자 예시. 강조류=바닥 채비 이탈(서해 선상 조금 선호)[커뮤니티] |
| 청볼락 `blue_rockfish` · 황볼락 · 열기 | 1.00 | 1.20 | 0.90 | 1.05 | 1.10 | 1.20 | 0.90 | 1.00 | 「약조류 선호, 만조·간조 전후·들/날물 초기」[커뮤니티]. 야행 |
| 농어 `sea_bass` | 0.80 | 1.05 | 1.05 | **1.20** | 1.15 | **1.25** | 1.05 | 0.95 | 「만조, 특히 저녁 만조」「6~9물」+ 포말 [커뮤니티]. 날물 포말은 [통설] |
| 무늬오징어 `squid` | 1.05 | 1.20 | 0.95 | 1.10 | 1.10 | 1.15 | 0.90 | 1.00 | 「완만한 흐름, 물돌이 전후」「上げ潮 약간 우세, 下げ 반전류」[커뮤니티] |
| 갑오징어 `cuttlefish` · 문어 `octopus` | 1.10 | 1.10 | 0.85 | 1.00 | 1.10 | 1.10 | 0.85 | 1.00 | 바닥 서식·약조류(무시~3물)[커뮤니티]. 워킹은 흐름 약간 필요 |
| 부시리/방어 `amberjack`·`yellowtail`·잿방어·삼치 | 0.80 | 1.15 | 1.10 | 1.15 | 0.90 | 1.15 | 1.05 | 1.00 | 「들물 초반→만조→썰물 초반」「조류 방향 바뀌자 연속 입질」[커뮤니티]. 새벽·해질녘이 더 큼 |
| 고등어·전갱이·학꽁치 (회유) | 0.90 | 1.00 | 1.05 | 1.10 | 1.10 | 1.00 | 1.00 | 0.95 | 「학꽁치는 물때 영향 작고 날씨가 중요, 들물·만조 약간 유리」[커뮤니티] — 폭 좁게 |
| 숭어 `striped_mullet`·가숭어 | 0.85 | 1.00 | 1.10 | 1.10 | 1.05 | 1.00 | 0.95 | 0.90 | 들물·만조 연안 접근 [커뮤니티/통설] |
| 노래미·쥐노래미·쏨뱅이 (구멍치기) | — | — | — | — | — | — | — | — | **단계가 아니라 수위**로(§4-4) |
| 가자미·도다리·보리멸 (원투/편대) | 0.85 | 1.15 | 1.05 | 1.10 | 0.95 | 1.10 | 1.00 | 0.95 | 「들물 초반~만조 전후」 일반론 [통설] — 어종 전용 출처 못 찾음 |
| 붕장어·갯장어 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 「일몰 후 1시간」이 지배 [커뮤니티] — 단계 무관으로 둔다 |

### 물때(1~15물) 곡선 정정 제안 (`tideActivity`)

- **돌돔** 현재 `sariPeak(0.4,0.85)` → 출처는 「사리·조금 회피, 3~5물·11~13물」 → **쌍봉 곡선**(4물·12물 피크, 8물 0.6).
- **청볼락** 현재 `sariPeak(0.5,0.85)` → 「조금~6물」 → **조금 피크**로 뒤집기.
- **광어** `sariPeak(0.4,0.75)` → 연안은 중간물때 무난, 선상(예정)은 조금 우세 → 평탄화(0.7 근처) 후 장르로 분기.
- **쭈꾸미·갑오징어**(갑오징어 `flatTide(0.65)`) → 조금(13~15·1~3물) 약간 상향.

---

## 4. 장르(채비) × 구간 — 입질이 아니라 **조작 조건**을 바꾼다

> 원칙: 어종 표는 「누가 무느냐」, 장르 표는 「채비가 제대로 일하느냐」. 둘을 섞지 말고 곱한다.
> 흐름 세기 `flow01` = 그 구간의 실유속(사리·지역 반영 — §5)을 0~1로.

1. **찌 낚시(드리프트 + 밑밥)** — 정조엔 찌가 서고 밑밥이 발밑에 고인다, 중들/중날 사리엔 찌가 본류로 달아난다.
   - 조작: 이미 `TidalCurrentEngine`이 횡류를 만든다 → **유속을 구간에 위상 고정**하면 난이도는 자동으로 생긴다(§6 P0).
   - **밑밥 쌓기(신규)**: `flow01 < 0.3`(물돌이·끝물) 동안 투척한 밑밥을 `chumBank`에 누적(상한 有), 흐름이 붙는 F1/E1에서
     `chumSyncRate`에 `+bank×0.3`을 얹고 소진. 근거 「간조·초들물부터 품질 시작」[커뮤니티].
   - 띠 길이: 밑밥 동조 `horizSigmaM`을 `1 + flow01×0.8`배 — 「점이 아니라 띠」[커뮤니티].
2. **원투·편대** — 무거운 봉돌로 바닥 고정. 강조류엔 봉돌이 구르고 원줄이 배가 불러 입질 전달·밑걸림 악화.
   - `flow01 × tideStrength > 0.6`이고 봉돌 < 기준(호수 표 상 25호 상당)이면 `snagRiskMult ×1.3`, 입질 ×0.85, 채비가 하류로 끌림.
   - 반대로 F1/E1(흐름 시작)은 냄새 확산 → ×1.1. [통설 — 원리 기반]
3. **루어** (`LureKind`별, `lureActionMult`에 곱):
   - `metal_jig`·`plug_minnow`·`spoon`·`spinner`(회유·농어·부시리): 흐름 있을 때 액션↑ — F2/E2 ×1.1, 물돌이 ×0.85.
     연안 캐스팅 루어 「초날물~중날물」(사용자 예시)과 일치.
   - `egi`: 완만한 흐름 선호 — `flow01>0.7`이면 폴링 시간 감소·라인 슬랙으로 ×0.85, 물돌이 ±30분 ×1.1 [커뮤니티].
   - `tairaba`: 등속 릴링 + 흐름이 스커트를 움직임 — 물돌이 ×0.7, 중들/중날 ×1.15 [커뮤니티]. 선상 도입 시 드리프트 0이면 ×0.5.
   - `worm_grub`·`soft_jerkbait`(바닥 다운샷·지그헤드): F1/E1 ×1.1, `flow01>0.7` 바닥 유지 실패 ×0.85.
4. **구멍치기(`cfg.hole`)** — 단계보다 **수위**: 「테트라포드 위 수심 2m 남짓, 만조 앞뒤 1시간 집중, 간조엔 블록이 드러나 입질 거의 없음」[커뮤니티].
   - `holeLevelMult = lerp(0.6, 1.2, waterLevel01)` (만조 근처 1.2, 간조 0.6). 동해는 수위 변화가 30cm라 **거의 1.0 고정**이 맞다.
5. **선상(예정)** — 물돌이 = 배가 안 흐름 → 다운샷·타이라바 입질 ×0.5(사용자 예시 · [커뮤니티] 참돔 정조 기사와 일치).
   선상 우럭·광어·쭈꾸미는 **조금 선호**(바닥 유지) — 물때 곡선을 장르로 반전.
6. **해루질** — [근거/커뮤니티 다수 일치] 「사리 7물 전후, 간조 2시간 전 진입 ~ 간조 후 1시간 철수, 야간」.
   - 창: `E3(후반) + LS + F1(초반 1h)`. 발견 보너스 = `+20 × kSpring × kRegion`. 간조+1h 이후는 **위험 경고**(이미 경고 문구 체계 有).
7. **통발** — 전용 출처는 못 찾음 [통설]: 미끼 냄새가 조류로 퍼지는 시간이 길수록 유리 → 회수 주기 동안의 평균 `flow01`로
   어획 가중 ×(0.85~1.15). 우선순위 낮음.

---

## 5. 지역·사리/조금 스케일

```
phaseMul = 1 + (T[species][phase] − 1) × kRegion × kSpring
kRegion : 남해(부산)·서해 1.0 / 동해(속초·포항) 0.3        ← 조차 30cm [근거]
kSpring : 0.5 + 0.5 × currentStrength  (조금 0.5 ~ 사리 1.0)  ← currentStrength = TideCalculator
flow01  : |sin(π × t / T_half)| × (0.35 + 0.65 × currentStrength) × kRegionFlow(동해 0.4)
```

- **동해 감쇠는 한 곳에서만** — 지금 `computeFeedingActivity`가 이미 동해 조류 지수 0.45로 깎는다. 새 단계 배율에도
  kRegion을 걸면 이중 감쇠가 되므로, **전역 피딩의 조류 근접항(proximity)을 단계 곡선으로 교체**하고 kRegion은 단계 쪽에만 둔다.
- `feedingRegionProfileOf`에 부산 → `'south_sea'` 반환 추가(현재 dead branch).
- 지역 수위 진폭: `TideCalculator`에 지역 조차 파라미터(동해 대조 ≈0.3m, 부산은 남해 동부 ≈1m 내외 — 후자는 [미확인 근사], KHOA 조회로 확정 권장).
- 사리 = 탁수 감점: 벵에돔·돌돔에 `tidePhase 7~9` × 0.9 (이미 물때 곡선으로 처리 가능).

---

## 6. 구현 권장 (core 우선 · 파일 위치)

**P0 — 위상 정합(버그성, 먼저)**

1. `core/src/simulation/TideFlowPhase.ts`(신규, `index.ts` export):
   `type TideFlowPhase = 'slack_low'|'flood_early'|'flood_mid'|'flood_late'|'slack_high'|'ebb_early'|'ebb_mid'|'ebb_late'`
   `tideFlowPhaseOf(info: TideInfo, now): { phase, progress01, flow01, isFlood, minutesFromSlack }` —
   직전/다음 만조·간조 시각으로 계산(물돌이 = 이벤트 ±30분, 나머지 3등분은 사용자 정의 경계 그대로).
2. `TidalCurrentEngine.tideFactor(hoursNow)`를 **벽시계 sin 대신 `flow01` 주입**으로(생성 시 고정 `isFloodTide`도 매 프레임 갱신 가능하게).
   → HUD 「만조」와 「찌가 안 흐름」이 일치. 기존 최소흐름 0.35 바닥은 유지(정조에도 미세 흐름).
3. `TideCalculator.currentWaterLevelCm` — 가장 가까운 만조 기준 + 지역 진폭. (`TideInfo` 타입 **필드 변경 금지** — 값만 고친다.)

**P1 — 입질 데이터**

4. `core/src/db-schema/TidePhasePreference.ts`: `Record<speciesId, Partial<Record<TideFlowPhase, number>>>`(누락 = 1.0) — §3 표.
5. `SpawnContext`에 `flowPhase?`, `tideStrength01?`, `regionTideK?` 추가(옵셔널 = 하위호환) →
   `intrinsicWeight`에서 `tideW × phaseMul`. `speciesBiteReadiness`의 `ideal`에 `max(phaseMul)` 반영(안 하면 활성도 >1 클램프로 정보 손실).
6. `FeedingTimeCalculator.tideActivityFactor`의 proximity를 대칭 단계 곡선으로 교체:
   `slack 0.80 · early 1.10 · mid 1.05 · late 1.00`(× phaseMult 사리항 유지). 어종 차이는 5번이 맡는다.
7. §3 하단 물때 곡선 정정(돌돔 쌍봉·청볼락 조금 피크 등).
8. 수치는 `TUNING.tidePhase`(스킬 `add-tuning` — F8 슬라이더)로 빼서 실플레이 조정.

**P2 — 장르 조건**: §4의 찌(밑밥 쌓기·띠), 원투(봉돌 구름), 루어 Kind 배율, 구멍치기 수위 — 모두 `FirstPersonFishingScene`
`baseProbPerSec`/`lureActionMult`/`chumSyncRate`/`snagRiskMult` 기존 곱셈 자리에 끼운다(계산 함수는 core에 두고 씬은 호출만).

**P3 — 부가**: `TierRollContext.flowPhase` → 감성돔 HS/LS ±30분 대형 tier +소형 몫 10% 이전 [커뮤니티 「물돌이 대물」],
참돔 F2/E2 사리 대형 +; 해루질 시간창; 통발 평균 유속; 선상 드리프트.
UI: 화면엔 「초들물 · 중날물」 같은 **실제 낚시 용어**만(R1 — 내부 키 `flood_early` 노출 금지). 어종별 선호는 숨김 정보로 두고
조행 기록·NPC 대사·도움말에서 **겪은 뒤에** 알려 준다(R2 · R11 — 창에 공략 문구 박지 않기).

---

## 7. 적용 예시 (숫자)

**① 부산 갯바위 감성돔 찌낚시 · 10월 06:10 · 8물(세기 1.0) · 만조 +10분(HS)**
- 어종: `tideW`(8물) 1.0 × phaseMul = 1 + (1.15−1)×1.0×1.0 = **1.15**
- 전역 피딩: 사리항 1.2 × slack 0.80 = 0.96 (현재 구현은 1.2 — 물돌이에 오히려 최고치였음)
- 장르: 찌 `flow01≈0.08`(조류 엔진은 최소흐름 0.35 바닥) → 찌가 거의 섬 → 동조 쉬움. 직전 끝들물~물돌이에 쌓은 `chumBank` 0.6 → E1 진입 시 동조 +0.18.
- 크기: HS 대형 tier 가중 이전 → 「물돌이 한 방」 연출. 30분 뒤 E1에서 phaseMul 1.15 + 밑밥 보너스로 연속 입질.

**② 같은 조건 · 속초 동명항**
- phaseMul = 1 + 0.15×**0.3**×1.0 = **1.045** — 사실상 평탄. 전역은 동해 지수 0.45가 이미 있음.
- 결과: 동해에선 「몇 시냐(새벽·해질녘)」가 지배 — 출처(동해는 시간대·수온·기압 우선)와 일치.

**③ 부산 참돔 · 3물(세기 sin(2/14·π)=0.43 → kSpring 0.72) · 타이라바**
- E2: phaseMul = 1 + 0.30×0.72 = **1.22**, 루어 Kind 1.15 → 합 ×1.40
- HS: phaseMul = 1 − 0.40×0.72 = **0.71**, 루어 0.7 → 합 ×0.50 — 「정조엔 입질 끊김」 재현, 조금이라 폭이 약간 완화.

**④ 부산 원투(봉돌 15호 상당) · 8물 · 중날물(flow01≈0.95)**
- `0.95×1.0 > 0.6` & 가벼운 봉돌 → 밑걸림 ×1.3, 입질 ×0.85, 채비 하류 이동. 25호로 바꾸면 해제 → **장비 선택이 물때로 의미를 가짐**.

**⑤ 해루질 · 부산 · 7물 · 간조 −90분, 22시**
- 창 안(E3 후반) → +20 × 1.0 × kSpring(0.97) ≈ **+19**. 간조 +70분이면 창 종료 + 들물 위험 경고.
- 속초면 kRegion 0.3 → +6: 동해 해루질은 「야간 + 위치」가 본질이고 물때 영향은 작다.

---

## 8. 롤아웃 순서 요약

1. **P0 위상 정합**(TideFlowPhase · 조류 엔진 주입 · 수위 진폭) — 이것 없이 표를 넣으면 「만조인데 물이 빠르게 흐름」 모순이 커진다.
2. **P1 데이터**(어종 표 · 물때 곡선 정정 · 전역 곡선 대칭화 · TUNING) — 가장 큰 체감, 위험 낮음(옵셔널 필드 → 세이브 무관).
3. **P2 장르 조건**(밑밥 쌓기 · 원투 봉돌 · 루어 Kind · 구멍치기 수위) — 각각 독립 PR 가능.
4. **P3**(크기 편향 · 해루질/통발 · 선상 · 도움말/NPC 대사로 공략 노출).

검증: core에 `scripts/` 시뮬(`chumSyncSim.ts` 전례)로 8구간 × 사리/조금 × 지역 입질 가중 표를 출력해 표 수치가 의도대로 나오는지 확인.

---

## 9. 근거 강도 요약

- **[근거]** 정조 저활성·흐름 시작 고활성(한·일·영 공통), 동해 조차 ≈30cm(KHOA·해수부), 해루질 = 사리·간조 전후·야간,
  사리=강조류/조금=약조류.
- **[커뮤니티]** 감성돔 끝썰물~초들물·물돌이 대물, 돌돔 중간물때·초물 물돌이·썰물 우세, 볼락 조금~6물, 참돔 정조 부진,
  쭈꾸미·갑오징어 선상 조금 선호, 구멍치기 만조 ±1h, 무늬오징어 물돌이 ±30분, 부시리 들물 초반~썰물 초반, 학꽁치 들물·만조.
- **[통설]** 농어 날물 포말, 원투 어종(가자미·보리멸) 들물~만조, 통발 유속 효과, 「上げ三分 下げ七分」 자체(격언 — 반대로 「上げ七分 下げ三分」 설도 공존).
- 구체 배율 수치는 전부 **게임 설계 초안**이다(출처에 숫자 없음) — TUNING으로 빼서 실플레이로 맞춘다.

---

## Sources

- [초들물과 중들물때 감성돔은 어디에? — 한국낚시채널(klfishing) 강좌](https://klfishing.com/talk_new/bbs/board.php?bo_table=fishing_lecture_3&wr_id=587)
- [초들물의 비밀 — 낚시춘추(검색 요약)](http://fishingseasons.co.kr/contents_view_detail.asp?b_no=1453)
- [물때란 무엇이고 어떻게 이해해야 하나요 — 부산스킨스쿠버 카페](https://m.cafe.daum.net/scuba-busan/gthc/1?svc=cafeapi)
- [감성돔·벵에돔 고수 10인의 밑밥 솔루션 — 낚시춘추(검색 요약)](https://m.fishingseasons.co.kr/news_Detail.asp?b_no=1308)
- [上げ三分に下げ七分の意味を知る](https://tou-chan.com/agesannbu-ni-sagenanabu/)
- [上げ潮と下げ潮どっちが釣れる？「上げ三分・下げ七分」 — tsuriyoho](https://tsuriyoho.com/guide/age-sage-tide)
- [海で魚が釣れる時間帯は【上げ七分と下げ三分】 — TSURINEWS](https://tsurinews.jp/329925/)
- [魚が釣れやすいタイミング — シマノ](https://fish.shimano.com/ja-JP/content/beginners/fishing/timing/index.html)
- [最干潮、潮止まりでもチヌは釣れるのか？](https://excellentcuber.hatenablog.com/entry/zensou-fukase-kancho-shiodomari)
- [チヌ・グレ釣りの時合いを紹介](https://fishing-fishing.com/2022/03/31/fishingtime001/)
- [潮止まりでもアオリイカは釣れる？前後30分がチャンス](https://tsuttarou.net/archives/262255)
- [アオリイカが釣れる時期と時間帯！上げ潮下げ潮どっちが釣れる？](https://www.fumitiyo.com/entry/2019/04/14/182239)
- [바다낚시 물때 활용법 — moolttae(검색 요약)](https://moolttae.com/guide-fishing.html)
- [무늬오징어 에깅 입문 — 낚시춘추(검색 요약)](https://m.fishingseasons.co.kr/news_Detail.asp?b_no=788)
- [6월 참돔 타이라바 — 시즌 진입 채비와 운용의 정석](https://rhyzomecorp.co.kr/journal/june-redbream-tairaba-guide/)
- [배워봅시다... 갯바위 돌돔 낚시 모든것 — 인낚](https://innak.kr/bbs/board.php?bo_table=esbegin&wr_id=431)
- [돌돔 낚시기법 — kpfa](http://kpfa.co.kr/bbs/board.php?bo_table=gr7_bbs11&wr_id=42)
- [돌돔 낚시 가이드 — ocean-fishing](https://www.ocean-fishing.com/fish/15)
- [사리? 조금? 정확히 어떤건가요 — 인낚](https://innak.kr/bbs/board.php?bo_table=Q01&wr_id=134122)
- [2026년 볼락낚시 실전 노하우 — 웰조이](https://hobby.totalwellnessarena.com/2025-rockfish-fishing-guide/)
- [바다 조류(물때) 완벽 이해 가이드 — bfg-fishing(검색 요약, 동해 조차 수치는 KHOA로 대체)](https://www.bfg-fishing.com/beginner-guide/tidal-current-complete-guide)
- [자주묻는질문 — 국립해양조사원](https://khoa.go.kr/faqList.do?type=A02)
- [바다에 나가기 전 '조석 정보' 확인은 필수 — 해양수산부 보도자료](https://www.mof.go.kr/doc/ko/selectDoc.do?docSeq=63819&listUpdtDt=2025-11-19++10:00&menuSeq=971&bbsSeq=10)
- [해루질 — 권남이 위키](https://kwonnam.pe.kr/wiki/%ED%95%B4%EB%A3%A8%EC%A7%88)
- [해루질 가려고 합니다. 어느 물때가 좋은가요 — 아하](https://www.a-ha.io/questions/45d7c766abdea4848bc09247d5ddb2c8)
- [농어루어낚시 — 다음 카페](https://m.cafe.daum.net/happydinak/5pek/1?listURI=%2Fhappydinak%2F5pek)
- [갑오징어 낚시 시즌, 주꾸미 낚시 좋은 물때](https://hifishing.whitedb2020.kr/entry/%EA%B0%91%EC%98%A4%EC%A7%95%EC%96%B4-%EB%82%9A%EC%8B%9C-%EC%8B%9C%EC%A6%8C-%EC%A3%BC%EA%BE%B8%EB%AF%B8-%EB%82%9A%EC%8B%9C-%EC%A2%8B%EC%9D%80-%EB%AC%BC%EB%95%8C-%EC%B1%84%EB%B9%84-%EB%B0%A9%EB%B2%95/)
- [서해 물때표 보는 법(워킹 쭈꾸미 갑오징어) — 다음](https://v.daum.net/v/teycBwwMlz)
- [초보자를 위한 광어 다운샷 팁 — 인낚](https://innak.kr/bbs/board.php?bo_table=columnslds&wr_id=6087)
- [벵에돔 낚시 꽝 탈출 (밑밥 동조)](https://mundorifc.com/entry/%EB%B2%B5%EC%97%90%EB%8F%94-%EB%82%9A%EC%8B%9C-%EA%BD%9D-%ED%83%88%EC%B6%9C-%ED%8F%AC%EC%9D%B8%ED%8A%B8-%EB%B0%91%EB%B0%A5-%EB%8F%99%EC%A1%B0-%EB%AF%B8%EB%81%BC-%EB%A7%8C%EB%93%A4%EA%B8%B0)
- [방어/부시리 기본 가이드 — 모아피싱](https://moafishing.com/guide/%EB%B0%A9%EC%96%B4-%EB%B6%80%EC%8B%9C%EB%A6%AC-%EA%B8%B0%EB%B3%B8/)
- [가을 부시리 갯바위낚시 — 바다낚수 카페](https://m.cafe.daum.net/badanaksu/AiXM/171?listURI=%2Fbadanaksu%2FAiXM)
- [학꽁치 낚시 시즌 계절별 공략법 — Beyond Maps](https://fishquest.yatnll.com/entry/%ED%95%99%EA%BD%81%EC%B9%98-%EB%82%9A%EC%8B%9C-%EC%8B%9C%EC%A6%8C-%EC%96%B8%EC%A0%9C%EA%B0%80-%EC%A2%8B%EC%9D%84%EA%B9%8C-%EA%B3%84%EC%A0%88%EB%B3%84-%EA%B3%B5%EB%9E%B5%EB%B2%95?category=1256639)
- [부산 민락수변공원 잠긴 테트라포드 우럭 — 낚시춘추(검색 요약)](https://m.fishingseasons.co.kr/news_Detail.asp?menub=1&b_no=90361)
- [Feeding Windows: Working With Wind, Moon & Tides — The Fisherman](https://www.thefisherman.com/article/feeding-windows-working-with-wind-moon-tides/)
- [Best Tide to Fish — jenseits-fishing](https://jenseits-fishing.com/blogs/news/best-tide-to-fish-how-tidal-movement-controls-saltwater-fishing-success)
