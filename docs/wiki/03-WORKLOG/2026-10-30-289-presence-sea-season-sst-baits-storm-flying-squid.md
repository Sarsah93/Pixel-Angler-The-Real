# 289차 — 입질 B 단계: 바다 · 철 · 수온 존재 가중 · 드문 하한 · 새 미끼 셋 · 풍랑 통제 · 살오징어

| | |
|---|---|
| **날짜** | 2026-10-30 |
| **시스템** | `낚시` `해루질` `데이터` `경제` `에셋` `위키` `배포` |
| **트리거** | 288차 입질 감사의 설계 결정 D1~D6 — 사용자 「추천대로 추가해주고, main 반영 및 재배포, wiki 업데이트도 해줘」 |
| **커밋** | 작업 브랜치 → main 빨리 감기 · 96차 배포(아래 §8) |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 시험 438 |

---

## 1. 배경 — 왜 했나

288차 입질 감사([원문](../../../.agents/inputs/288_bite_audit.md))가 찾은 것: **달이 어종을 바꾸지 않는다(분포 차 0.00 %) · 수온을 쓰지 않는다 · 지역 차는 통계(KOSIS)뿐**.
결정이 필요한 여섯을 추천과 함께 올렸고, 사용자가 추천대로 정했다.

| 결정 | 추천(= 확정) |
|---|---|
| D1 철 · 바다 밖 어종 | 0이 아니라 **드물게** — 서귀포에서 태평양 대구 80cm를 찾는 N02-3이 있다 |
| D2 수온 출처 | 지역 × 달 **평년 수온표** 먼저(관측소는 지역 절반) · 방어 적수온 모순을 함께 고친다 |
| D3 살아 있는 미끼 | 성게 · 조개 · 옥수수 미끼는 바로 · 살아 있는 미끼(`livefish`)는 따로 한 차수 |
| D4 폭풍 | 해루질처럼 파고 기준으로 낚싯대 낚시를 막는다 |
| D5 KOSIS | 약한 보정으로 남긴다 |
| D6 동해 오징어 | 살오징어 추가 · 에기 어종 바다 제한 |

## 2. 원인 — 무엇이 문제였나

- 스폰 가중(`intrinsicWeight`)에 달 · 바다 · 수온 항이 없었다. 계절은 비만도 · 금어기 표시 · 무리 걸림에만 걸렸다.
- `FISH_DATABASE.peakSeasonMonths` · `preferredTempC`는 도감 표시용으로만 쓰였다. 수온은 메인 화면에만 보였다.
- 미끼 종류 넷(`urchin` · `shellfish` · `corn` · `livefish`)은 오라클에 선호값이 있는데 그 이름을 가진 미끼 아이템이 없었다 — 돌돔 성게 · 감성돔 옥수수 같은 대표 조법이 막혀 있었다.
- 배포본의 해양기상 관측은 막혀 **Mock 난수**(수온 10~25℃ · 시정 0.5~20km)가 들어온다 — 이 값이 수온 · 안개를 정하면 날마다 제멋대로 바뀐다(이번에 「실측 수온」 출처로 쓰려다 발견).
- 적수온 데이터 다섯 종이 자기 제철과 모순이었다(방어 18~26℃ ↔ 겨울 제철 등 — `tools/check_species_temp_season.mjs`로 찾음).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `packages/core/src/rules/SpeciesPresence.ts` | `seaOf`(동해 · 남해 · 서해 · 제주) · 종별 바다 가중 56종(`SPECIES_SEA_WEIGHT`) · 연안 평년 수온 10열 × 12달(`SST_CLIMATOLOGY_C` · 달 가운데 기준 보간) · 계절 · 수온 · 바다 가중 · 이야기 어종 하한 · `presenceBreakdown` |
| 수정 | `packages/core/src/simulation/FishSpawningOracle.ts` | 후보를 거른 **뒤** 존재 가중을 곱한다(드문 어종이 후보에서 빠지지 않는다) · 무리 걸림 활성도에 바다 × 수온 · `presenceBiteRate`(입질 빈도 배율) · 문맥 `waterTempC` · `storyTargets` · `presenceOff` · 살오징어 · 금지체장 · 금지체중 「이하」는 288 |
| 수정 | `packages/core/src/config/tuning.ts` | `TUNING.presence`(제철 앞뒤 0.7 · 철 밖 0.35 · 수온 6℃ · 하한 0.12 · 바다 하한 0.015 · 이야기 0.25 · 빈도 지수 0.5 · 기준 0.5 · 하한 0.4) · `castWeather.closeWaveM` 3 · `closeWindMps` 14 · F8 슬라이더 10 |
| 수정 | `packages/core/src/db-schema/FishDatabase.ts` | 적수온 정정 5(방어 11~21 · 도루묵 2~15 · 쏨뱅이 · 까치복 · 감성돔 10~) · 살오징어 |
| 신설 | 살오징어 4계층 + 두족류 표 | 오라클(에기 전용 · 외투장 15cm 이하 · 4.1~5.31) · 도감 · 경락(2.2만 원/kg) · 시장 이름(「오징어」 → 살오징어, 갑 · 무늬 · 한치 다음) · KOSIS · 에기 묶임 둘 · 한치 손질 트리 공유 · 요리 재료 · 요리 이름 「오징어볶음」 · 희귀도 · 물때 무리 · 위키 |
| 신설 | `food assets/fish/japanese_flying_squid.png` · 카드 · 아이콘 | Gemini 2장 중 1장(지느러미가 몸통 끝 마름모 — 한치와 다르다) · `tools/gemini_fish_art.cjs` `LOOKS` |
| 수정 | `packages/core/src/simulation/ForagingEngine.ts` | `FORAGE_BAIT_KEY` · `forageBaitKeyOf`(성게 = urchin · 홍합 · 굴 · 바지락 = shellfish · 소라 · 거북손 = crab) · `rodFishingClosure` |
| 수정 | `packages/client-pc/src/data/ShopCatalog.ts` | 직판장 미끼 셋 — 옥수수 1캔(40알) · 돌돔 성게(10개) · 조개살 1팩(20개) — 생미끼 갑과 같은 「열기」 |
| 수정 | `packages/client-pc/src/store/RigParts.ts` · `InventoryStore.ts` | 캔 갯것을 미끼 칸에 그대로 꿴다(종으로 미끼 종류) |
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` | 던지기 직전 풍랑 통제(물가 판정 다음 · 채비 점검 전) |
| 수정 | `packages/client-pc/src/scenes/FirstPersonFishingScene.ts` | 스폰 문맥에 실측 수온 · 이야기 어종 · 입질 확률에 존재 빈도 배율 |
| 수정 | `packages/client-pc/src/store/StoryStore.ts` | `rodCatchTargets()` — 열린 낚싯대 어획 목표의 어종 |
| 수정 | `packages/client-pc/src/ui/FieldEventManager.ts` | 보일링 · 스쿨링 빈도 × 무리 어종 존재(1월 속초 삼치 보일링 — 감사 F20) |
| 수정 | `packages/client-pc/src/store/ExternalDataStore.ts` | 해양기상 Mock 값을 수온 · 안개 · 세션 날씨 카드에 쓰지 않는다(`liveMarine`) · KOSIS 「오징어」에 살오징어 |
| 수정 | `packages/client-pc/src/scenes/MainMenuScene.ts` | 실측이 없으면 시세 띠에 「수온 약 N°C」(평년) |
| 수정 | `HelpContent.ts` · `en_help.ts` · `en.ts` · `en_panels.ts` · `en_fish.ts` | 도움말 셋(바다 · 철 · 수온 / 풍랑 / 새 미끼) · 영어 |
| 신설 | `packages/core/src/rules/Presence289.test.ts` · `tools/check_species_temp_season.mjs` | 시험 15 · 적수온 ↔ 제철 대조 도구 |
| 수정 | `tools/gen_game_wiki_data.mjs` · `tools/wiki_items.json` | 어종 카드 「사는 바다」 · 시스템 「바다 · 철 · 수온 · 풍랑 · 새 미끼」 · 미끼 셋 |
| 수정 | `.claude/skills/add-species/SKILL.md` | 5층 — 바다 가중 · 적수온 대조 · 두족류 표 · 그림 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`낚시 → 입질 → 어종 고르기 · 입질 빈도`. 판정 계층(오라클 가중)과 데이터(바다 · 수온 표)가 새로 생겼다.

- **존재 가중** = 바다 × 계절 × 수온(각 하한 · 전체 하한 0.005 · 이야기 어종 0.25). 기존 가중(미끼 · 지형 · 수심층 · 물때 · 주야 · KOSIS · 채비)에 곱한다.
- **빈도 배율** = (존재 가중 후 / 전)의 합 비 ÷ 기준 0.5, 제곱근, [0.4, 1]. 제철 · 맞는 바다(실측 분포 상위 약 30 %)는 288차와 같은 빈도다.
- 수온 출처: 실측(Mock 아님) → 평년(`climatologySstC`). 결정성은 날짜와 지역만 쓰므로 같은 세션이면 같다(필드 이벤트 145차 규칙 유지).

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 분포 | 시뮬(`sim289.mjs` — `speciesBiteShare` · 존재 가중 끔/켬) | 계절 차(속초 1월 ↔ 8월) 0.0 % → 53~69 % · 지역 차(속초 ↔ 제주 1월) 0.0 % → 33~39 % · (제주 ↔ 태안 8월) 0.0 % → 30~43 % |
| 에기 바다 | 같은 시뮬(밤) | 속초 10월 살오징어 74 % · 제주 7월 한치 68 % · 태안 5월 갑오징어 45 % · 돌문어 43 % · 속초 1월 대문어 12 % |
| N02-3 | 서귀포 1월 60m 생선 조각 | 대구 몫 0.28 %(드물게) · 이야기 진행 중 6.0 %(288차 8.7 %) · 속초 같은 자리 20.6 % |
| 빈도 | 9지역 × 12달 × 채비 3 × 주야 | 제철 바다 1.0 · 겨울 태안 0.4(하한) · 중앙 약 0.9 |
| core 시험 | `Presence289.test.ts` 15 + 전체 | 438 통과 |
| 실게임 | 하네스 `r289.cjs` · `r289s.cjs`(속초 · dev 서버) | 9/9 · 3/3 — 살오징어 그림 · 시세 띠 「수온 약 18°C」 · 미끼 갑 셋 「열기」(40 · 10 · 20) · 낱개 미끼 종류 · 캔 갯것 미끼 · 전복은 미끼 아님 · 1인칭 문맥(수온 · 이야기 어종) · 빈도 배율 · 속초 가을 에기 1순위 살오징어 · 풍랑 통제(파고 · 풍속 · 기준 안이면 다음 단계) · pageerror 0 |
| 위키 | `wikichk289.cjs` | 시스템 항목 · 살오징어 카드(그림 · 「사는 바다」 · 15cm 이하 · 4.1~5.31) · 방어 적수온 11~21 · pageerror 0 |
| 빌드 | `npx pnpm run build` · 루트 `npx pnpm run typecheck` | 3/3 · 4/4 |

## 6. 잔여 — 이번에 안 한 것

- **살아 있는 미끼(`livefish`)** — D3에서 따로 한 차수로 정했다(살림통 · 기포기 · 작은 고기 살려 두기). 광어 · 부시리 · 방어 · 우럭 등이 1순위 미끼를 아직 못 쓴다.
- 감사의 결정 없이 되는 나머지 — 깊은 바다 어종 새기(F09) · 도감 ↔ 엔진 10종 정합(F12) · 지역 물때(F15) · 진흙 · 모래 · 여 구분(F08) · 날씨 어종 선호(F17) · 집어등(F28).
- 관측소 지도(`REGION_TO_MMSI`)를 넓히는 일 — 배포본은 어차피 Mock이라 평년 표가 실제 출처다. 서버 프록시가 생기면 다시 본다.
- 수치(바다 가중 56 · 평년 수온 · `TUNING.presence`)는 근사 — 실플레이로 조율(F8).
- 살오징어 손질은 한치 트리 그림을 쓴다(색만 조금 다르다).

## 7. 위험·부작용

- **입질 체감이 바뀐다** — 제철이 아닌 바다 · 계절은 입질이 줄고(겨울 서해 약 절반 아래), 나오는 고기가 지역마다 달라진다. 288차까지의 「어디서나 같은 고기」를 기대하던 사람에게는 낯설다.
- 이야기 어획 목표 중 어종 · 지역이 엇갈린 것(대구 서귀포)은 이야기 하한(0.25)으로 받쳤다 — 그 밖의 엇갈림은 289 → 290 맵 확장 점검 때 함께 본다.
- 풍랑 통제는 실제 기상청 파고 · 풍속을 쓴다 — 실제로 풍랑주의보가 난 날은 게임에서도 그 지역 바다낚시가 막힌다(설계 의도). 홈타운은 막지 않는다.
- Mock 해양기상을 버리면서 부산 시세 띠 · 세션 카드의 수온이 사라질 수 있다(대신 「수온 약」 평년).
- 옛 세이브 영향 없음(데이터 · 규칙만).

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/fishing-loop.md` · `night-hunting-trap.md`
- [x] `04-BACKLOG.md`(DD 닫음 · D 질문 두 줄 정리 · livefish 새 줄)
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 스킬 `add-species`
- [x] 아티팩트 4개 · main 빨리 감기 · 96차 배포(아래 갱신)
