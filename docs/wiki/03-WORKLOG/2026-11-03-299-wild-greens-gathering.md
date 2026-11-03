# 299차 — 산나물 캐기(산자락에서 뜯고 캐고 꺾는다 — 종 8 · 산자락 스팟 · 지역 · 제철 · 특산 꼬리표) · 297(2) 선물 마무리 글 · 칭호 「산타」 · 「박애주의자」 · main 반영 · 100차 배포

| | |
|---|---|
| **날짜** | 2026-11-03 |
| **시스템** | `채집(해루질)` `경제(특산)` `필드` `도감` `스토리(선물)` `진행(칭호)` `도움말` `dev` |
| **트리거** | 사용자 지시(2026-11-03) — 「1) '선물 칭호에 한 사람 더.'는 넣지 마 … '아주 좋아하는 것 같다.' 2) 선물 보따리 → 산타 · 동네 산타 → 박애주의자 · 박애주의자 = 선물우호도 및 가게 할인율 소급 적용 3) 산지에서 나는 나물 관련해서 작업 시작해줘 4) … main 반영하고 재배포」 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 492(+5) |

---

## 1. 배경 — 왜 했나

297차 보고에 사용자가 넷을 지시했다. 1 · 2는 선물 마무리 글과 칭호 이름 · 효과, 3은 297차 추천(산나물 「산것 캐기」 — 해루질 엔진 재사용)의 착수, 4는 main 반영 · 재배포.

- 1) 「아주 좋아하는 것을 처음 건넸다 — 선물 칭호에 한 사람 더.」는 **칭호 획득 조건을 알리는 글**이라 뺐다. 아주 좋아하는 반응이면 「(아주 좋아하는 것 같다.)」로 마무리한다.
- 2) 「선물 보따리」 → **「산타」**(선물 우호도 +25%), 「동네 산타」 → **「박애주의자」**(선물 우호도 +50% **+ 상점 구매가 −3%**). id(`gift_bundle` · `santa`)는 세이브 호환을 위해 그대로.
  「가게 할인율 소급 적용」은 **낮은 칭호의 효과(선물 우호도)를 그대로 안고 가게 할인(`buyDiscount` 전설 눈금 3%)을 더한다**로 읽었다 — 한 번에 하나만 다는 칭호 체계에서 위 칭호가 아래 칭호를 품는다.
- 3) 산나물은 **갯것과 같은 손놀림 놀이**로 거두되, 거둔 것은 **텃밭 수확물과 같은 물건**(작물 초상 · 농산물 칸 · 특산 꼬리표)으로 들어온다.

## 2. 원인 — 설계 근거(버그 아님)

- **종 8은 작물 초상(244 · 84/84)이 있는 산채만** 골랐다 — 곰취 · 산마늘(명이) · 눈개승마 · 부지깽이 · 어수리 · 두릅 · 곤드레 · 엄나무순(`CROP_DATABASE` `category: 'wild'`). 그림을 새로 뽑지 않아도 가방 · 도감 · 위키에 바로 그림이 선다.
- **산자락 후보** = 숲(`wood` — OSM `landuse=forest` · `natural=wood|scrub`) · 풀밭(`grass`) 칸 가운데 둘레 3×3이 풀 · 숲 · 맨땅 · 흙이고 **반지름 3 안에 길 · 보도 · 집 · 포장 · 물 · 모래 · 부두가 없는 곳**(마을 공동산 — 길가 · 집 옆은 아니다). 숲 칸이거나 숲이 셋 이상 닿으면 바로, 순 풀밭은 5×5가 전부 풀 · 숲일 때만. 속초 실측 3,857칸.
- **따로 굴린다** — 바다 후보(갯바위 475 · 안벽 800 · 얕은 물 558)와 섞으면 산자락 3,857칸이 스팟 220개를 다 먹는다. 산자락은 100칸당 0.6 · 상한 24(`TUNING.forage.hill*`) · 물때 · 동해 배율 무관 · 씨앗은 바다 씨앗과 다르게.
- **지역**(`regions`)은 실제 산지로 — 명이 · 삼나물 · 부지깽이는 울릉(명이는 강원 고지대도), 곰취 · 어수리 · 곤드레는 강원 · 경북, 두릅 · 엄나무는 거의 전국. **제철**은 `absentMonths`(봄 중심 — 곤드레 5~7월) · **낮에만**(`discoveryTime: 'day'`).
- **풍랑 · 너울 · 미끄러짐 판정 밖**(바다가 아니다) · 면허 없음 · 두릅 · 엄나무는 `handInjury`(가시).
- 특산 표에 **설악 곰취**(`sokcho_gomchwi` · 4~6월 · ×1.3)를 더했다 — 울릉 명이 · 삼나물 · 부지깽이(294)는 이미 `crop_*` 열쇠라 울릉에서 뜯으면 바로 특산(295차 「작물 특산 13은 홈타운 텃밭뿐이라 못 얻는다」가 이 셋은 풀렸다).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`core/src/types/Activities.ts`](../../../packages/core/src/types/Activities.ts) · [`types/Foraging.ts`](../../../packages/core/src/types/Foraging.ts) | 분류 `wild_green` · 사는 모양 `leaf · root · shoot` · 스팟 종류 `hill_grass` |
| 수정 | [`core/src/db-schema/ShoreCreatureDatabase.ts`](../../../packages/core/src/db-schema/ShoreCreatureDatabase.ts) | 필드 `harvestItemId · harvestQty · regions` · **산나물 8**(`green_*`) |
| 수정 | [`core/src/simulation/ForagingEngine.ts`](../../../packages/core/src/simulation/ForagingEngine.ts) | `creatureTools`(맨손) · `forageBehaviorOf`(leaf) · `forageGameKindOf`(leaf → pick · root → dig · shoot → pry) · `isWildGreen` · `WILD_GREEN_GAME_LABEL` · `rollForageSpots` 옵션 `spotsPerHundred` · `regions` 거름 |
| 수정 | [`core/src/config/tuning.ts`](../../../packages/core/src/config/tuning.ts) · [`db-schema/RegionalSpecialty.ts`](../../../packages/core/src/db-schema/RegionalSpecialty.ts) | `forage.hillSpotsPerHundred 0.6 · hillMaxSpots 24` · 특산 「설악 곰취」(51) |
| 신설 | [`core/src/rules/Greens299.test.ts`](../../../packages/core/src/rules/Greens299.test.ts) | 시험 5 — 표 · 놀이 갈래 · 굴림(산자락만 · 지역 · 달 · 밤) · 갯바위엔 안 남 · 특산 |
| 수정 | [`client/src/scenes/field/ForageSystem.ts`](../../../packages/client-pc/src/scenes/field/ForageSystem.ts) | `computeHillCandidates` · 따로 굴림 · `forageSpotTexKey`(작물 아이콘 `cropicon_*`) · 잎 도트 폴백 · 산자락은 안전 판정 밖 · `deliver`(작물 묶음 1~2 · `originRegion`) · dev 지급 · `devMonth`(검증) |
| 수정 | [`client/src/ui/ForageGamePanel.ts`](../../../packages/client-pc/src/ui/ForageGamePanel.ts) · [`ui/ForageBoardArt.ts`](../../../packages/client-pc/src/ui/ForageBoardArt.ts) | 제목 「뜯기 · 캐기 · 꺾기」(`forageGameTitleLabel`) · 산나물 가이드 문장 셋 · 바탕 `meadow`(풀밭 — 캐기는 흙 단면 그대로) |
| 수정 | [`client/src/scenes/BootScene.ts`](../../../packages/client-pc/src/scenes/BootScene.ts) · [`scenes/AnglerLogScene.ts`](../../../packages/client-pc/src/scenes/AnglerLogScene.ts) · [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 산나물은 판 · 점 그림을 싣지 않는다(4xx 0) · 도감 분류 「산나물」 · 요약 줄 · 도감 알림 「새로운 산나물 발견」 |
| 수정 | [`client/src/data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) · [`i18n/en_panels.ts`](../../../packages/client-pc/src/i18n/en_panels.ts) | 도움말 「해루질 › 산나물 캐기」 · 영문(뜯기 · 캐기 · 꺾기 · 산나물) |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) | 시스템 항목 `wild_greens_299` · 갯것 카드에 산나물(작물 초상 · 나는 고장 · 거두면) · 선물 칭호 글 |
| **297(2)** 수정 | [`client/src/ui/DialoguePanel.ts`](../../../packages/client-pc/src/ui/DialoguePanel.ts) · [`core/src/db-schema/TitleDatabase.ts`](../../../packages/core/src/db-schema/TitleDatabase.ts) · [`types/Titles.ts`](../../../packages/core/src/types/Titles.ts) · `HelpContent` · `en_gift` · `Gifts297.test` | 마무리 글 「(아주 좋아하는 것 같다.)」(힌트 쪽 삭제) · 「산타」 · 「박애주의자」(효과 `giftAndDiscount` = 선물 우호도 + `buyDiscount` 눈금) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S9 채집(해루질) → 스팟 후보 · 굴림 → 산자락` + `S19 경제 → 특산 → 산나물 꼬리표` + `S21 진행 → 타이틀 → 선물 칭호 둘` + `S22 스토리 → 선물 → 마무리 글`.

- **계약**: `ShoreCreatureCategory` · `ForageBehavior` · `ForageSpotKind` · `ShoreCreature.harvestItemId · harvestQty · regions` · `RollForageOpts.spotsPerHundred` · `TitleEffectKind`.
- **데이터**: 산나물 8 · 특산 51 · 튜닝 2 · 칭호 이름 · 효과.
- **판정**: 후보(클라이언트 지형 규칙) · `rollForageSpots`(지역 · 달 · 낮) · 수확(작물 템플릿 + 얻은 지역) · `titleModifiers`.
- **렌더**: 작물 아이콘 표식 · 놀이 창 제목 · 풀밭 바탕 · 도감 · 도움말.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 표 8 · 수확물 · 지역 · 산자락 · 낮 · 맨손 · 놀이 갈래 · 굴림(속초 5월 울릉 전용 없음 · 울릉엔 있음 · 11월 0 · 밤 0 · 갯바위 0 · 밀도) · 특산 | core vitest `Greens299.test.ts` · `Gifts297`(이름 · 효과) · `Specialty295`(51) · `Forage288`(산나물 제외) | 전체 492/492 |
| 칭호 — 산타(+25%) · 박애주의자(선물 우호도 +50% · 상점 구매가 −3% · `buyMult` 0.97) | 하네스 `r299.cjs` A | PASS |
| 막걸리 → 정옥선 — 「(아주 좋아하는 것 같다.)」 · 「칭호」 · 「처음 건넸다」 없음 | B + `00_gift_close.png` | PASS |
| 속초 산자락 후보 3,857 · 11월(실시간) 산나물 자리 0 | C | PASS |
| `devMonth = 5` 굴림 — 산나물 자리 23(상한 24) · 전부 산나물 · 숲 · 풀 칸 · 울릉 전용 없음 · 바다 자리 그대로 · 표식 23 | D + `05_marker_zoom.png`(두릅 묶음 표식 28px) | PASS |
| 자리 옆 [F] → 「산마늘(명이) — 뜯기」(줍기 판 · 풀밭 바탕) | E + `02_game_pluck.png` | PASS |
| 이김 → `crop_myeongi` ×2(농산물 · `originRegion` 속초) · 자리 비움 · 채집 로그 「2묶음 — 가방(농산물)」 · 토스트 | F + `03_after.png` | PASS |
| dev 놀이 — 두릅 「꺾기」(떼기 판 · 풀밭) | G + `04_game_snap.png` | PASS |
| 도움말 · 영어(Pluck · Snap off · Gomchwi (wild)) · 특산(설악 곰취 · 울릉 명이) | H | PASS |
| 4xx 0(바깥 KAMIS 제외) — 산나물 판 · 점 그림을 싣지 않는다 | I | PASS |
| pageerror · 빌드 · 타입체크 | 하네스 · `pnpm run build` · 루트 typecheck | 0 · 3/3 · 4/4 |

하네스 10/10. 재현: 봄(3~7월) 낮에 속초 뒷산 풀밭 · 숲 안쪽을 걷는다 — 작물 그림 표식이 보이면 [F]. 지금(11월)은 dev `__FIELD.forage.devMonth = 5; refreshSpots(true)`.

## 6. 잔여 — 이번에 안 한 것

- 뿌리 나물(더덕 · 도라지 · 달래 — 「캐기」 = 파기 판)은 작물 초상이 없어 넣지 않았다 — 작물 DB · 초상(Gemini)부터.
- 산나물 전용 미끼 · 요리 변형 없음(기존 「나물 볶음」 · 장아찌 레시피가 작물 id로 받는다).
- 산자락 표식은 64px 작물 아이콘을 28px로 줄인 것(정수 배율 아님 — 사진풍 아이콘이라 허용). 점 그림을 따로 구우면 `forage-dot/green_*.png`로 바꾼다.
- 허가가 필요한 산(국립공원 · 사유림) · 입산 허가 · 하루 상한은 두지 않았다(마을 공동산만 — 도움말에 적음).
- 울릉 · 독도 실측(울릉 숲 칸이 얼마나 되는지) 미확인 — 울릉 bbox 동쪽 해안이라 산자락이 적을 수 있다.
- 300 지역 텃밭 제한 · 1단계는 예시 창(`docs/mockups/regional_plot_window.svg`) 사용자 의견 뒤.

## 7. 위험·부작용

- `SHORE_CREATURE_DATABASE`를 도는 코드(도감 · 위키 · dev 목록 · BootScene · i18n 이름)는 산나물을 함께 본다 — BootScene은 `harvestItemId`로 건너뛴다. 새 소비처를 쓰면 `isWildGreen`으로 갈라야 한다.
- 산자락 후보 계산은 지역 입장 때 한 번(속초 757k칸 × 최대 7×7) — 부산 감천(1.17M)에서 체감 지연이 있으면 샘플 간격을 둔다.
- 작물 묶음은 `cropItemTemplate(id)`(상 등급) — 가방 칸이 농산물 규칙(등급 꼬리 · 포장)을 그대로 따른다.
- 칭호 id를 바꾸지 않았다 — 얻은 칭호가 세이브에 남아 있어도 이름만 바뀐다.

## 8. 후속 반영

- [x] 시스템 페이지 `night-hunting-trap.md` §4 · §5 · `economy-data.md` §4 · `progression.md` §4 · `story-quests.md` §4
- [x] `04-BACKLOG.md` · `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 위키 생성기 · 아티팩트 셋 원본(「299차 기준」 · 항목 · 칭호 이름)
- [x] 발행 판 — 남은 과업 설계 44 · 구현 라이브러리 43 · 채비 모딩 순서도 41 · 위키 96(그림은 작물 초상 재사용 — 새 `files` 없음)
- [x] main 빨리 감기(`1f8e536` → `b461a07` — 297 · 298 · 299 세 커밋) ·
  **100차 배포(gh-pages `0a98430` · 실행 29 · main `b461a07` · 정적 2,157 · 소스맵 0 · 기동 9.6초 · 4xx 0(바깥 1 = KAMIS) · pageerror 0)** —
  워크플로가 매긴 번호는 100차(99차 `eeb1fe9` 다음). gh-pages를 로컬로 띄워 점검(scratchpad `deploy299.cjs`) —
  작물 아이콘(곰취 62×64 · 두릅 54×64) 실림 · 산나물 판 텍스처 0(BootScene 생략) · 바다 판 22 그대로.
