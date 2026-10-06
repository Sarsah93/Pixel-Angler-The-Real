# 223차 — 제작 기획 C5: 도면 얻기(상점 도면 종이 · 분해) · 도면 40종 · 레벨 차 보정

| | |
|---|---|
| **날짜** | 2026-10-06 |
| **시스템** | `제작` `경제` `UI` `i18n` `위키` |
| **트리거** | 사용자 지시 — 「우선, 다른거 진행해줘」(해루질 현실화는 사용자 답 대기) → 로드맵상 진행 중인 제작 기획의 다음 단계 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 테스트 51/51 |

---

## 1. 배경 — 왜 했나

사용자 원문:

> "취소 반환은 일단 지금 방식으로 두고 실검증해볼게. 해루질 채집 현실화 관련해서는 고민해서 알려줄게. 우선, 다른거 진행해줘."

결정이 필요 없는 다음 일로 **제작 확장 기획(`.agents/CRAFTING_EXPANSION_SPEC.md`) §8의 C5**를 골랐다.
222차가 C1~C4·C6(시간 · 대기열 · 창 · HUD · 도움말)을 끝냈고, 남은 것은 다음 넷이었다.

- 도면을 얻는 길(§7 「도면 얻기」 — 상점 · 분해)
- 도면 15 → 약 40종
- 레벨 차 성공 보정(§5)
- 아직 모르는 도면 숨기기(R2)

## 2. 방법 — 판단한 것

- **구세이브 보호**: 222차까지의 26종은 `learn`이 없으므로 **처음부터 안다**. 새 13종만 얻어야 한다 → 백필 없이 잃는 것이 없다.
- **산출물은 이미 있는 물건만**: 카드 채비 5단 · 묶음추 25호 · 수중찌 · 구멍찌 1.5호 · 타이라바 헤드/넥타이 · 메탈지그 · 지그헤드 ·
  새우 통발 · 뜰채 7m · 멸균 붕대 · 모기향 · 크릴. 새 아이템을 만들지 않아 채비 트리 · 루어 · 통발 계통에 그대로 들어간다.
  상점에 없고 시작 가방(시드)에만 있는 지그헤드 · 메탈지그는 `CraftOutputs.fromSeed`로 모양을 가져온다.
- **분해로 배우는 도면은 「살 수 있는 물건」만** — 메탈지그를 처음엔 분해로 두었으나 가게에서 팔지 않아 풀어 볼 물건이 없었다(하네스 중 발견).
  메탈지그는 상점 도면으로 돌리고, 분해 깨침은 묶음추 · 수중찌 · 타이라바 헤드 3종.
- **분해 경제**: 재료 1단위마다 `scrapReturn(0.4) / 산출 수` — 묶음추(2개 나옴)를 하나 풀면 기대 재료값 약 2,400원 < 가게값 5,184원.
  사서 풀어 재료를 버는 길이 없다(core 테스트가 「산출 수로 나눈 몫보다 적게」를 검사).

## 3. 변경

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | [`core/db-schema/CraftingDatabase.ts`](../../../packages/core/src/db-schema/CraftingDatabase.ts) | `CraftLearn`(shop · scrap) · `learn?` 필드 · 새 도면 14종(맨손 5 · 작업대 8 · 고급 1) → 40종 · `blueprintPaperId` · `blueprintsByOutput` · `CRAFT_SCRAP_GROUPS` |
| 수정 | [`core/simulation/CraftRules.ts`](../../../packages/core/src/simulation/CraftRules.ts) | `craftLevelBonus`(10레벨마다 +3% · 상한 9%) · `craftModifiers(…, levelBonus)` · `craftScrapReturn` · `craftScrapLearnChance` |
| 수정 | `core/config/tuning.ts` | `craft.levelBonusPer10/Cap` · `scrapReturn` · `scrapLearnPerDex/Cap` + F8 2종 |
| 신설 | [`core/simulation/CraftRules.test.ts`](../../../packages/core/src/simulation/CraftRules.test.ts) | 도면 id · 종이 id 중복 · 얻는 길 유효성 · 기술 조건이 잠긴 스킬이 아님 · 레벨 차 · 분해 기대값 (7건) |
| 수정 | `client/store/CraftingStore.ts` | `known`(세이브) · `knows` · `learn` · `readPaper` · `scrapTarget` · `scrap` · 목록에서 모르는 도면 제외 · `check`가 모르는 도면 거부 · 레벨 차 보정 |
| 수정 | `client/store/InventoryStore.ts` | `InvItem.blueprintId` |
| 수정 | `client/data/CraftOutputs.ts` | 시드 템플릿 폴백(`fromSeed`) |
| 수정 | `client/data/ShopCatalog.ts` | 도면 DB의 `learn.shop`으로 도면 종이 자동 진열(직판장 7 · 약국 2 · 생활용품점 1) |
| 수정 | `client/ui/ShopPanel.ts` | 아는 도면의 종이는 목록에서 뺀다 |
| 수정 | `client/ui/InventoryPanel.ts` | 우클릭 「도면 읽기」 · 「분해하기」(확인 창 — 「분해하기」/「취소」) |
| 수정 | `client/ui/ItemDetailPanel.ts` | 도면 종이 상세(만드는 곳 · 갈래 · 조건 · 익힘) |
| 수정 | `tools/gen_pixel_icons.py` → `data/PixelIconArt.ts` | `it_blueprint` — 위아래가 말린 파란 두루마리(16px 실사이즈 확인) |
| 수정 | `client/data/HelpContent.ts` · `i18n/en_help.ts` | 제작 창 토픽에 「도면 얻기 · 분해」 페이지 |
| 수정 | `i18n/en.ts` · `en_panels.ts` | 223 블록(규칙 6 · 사전 14) — `EN_RULES` 맨 위 |
| 수정 | `tools/gen_game_wiki_data.mjs` · `tools/wiki_items.json` | 도면 `learn` 표기 · 도면 종이 10종 |

## 4. 구조상 위치

`S16 제작 → 제작 확장 기획 C5 → 도면 얻기 · 분해`.
**데이터**(도면 DB · 상점 진열) · **판정**(core 규칙) · **상태**(CraftingStore 세이브) · **렌더**(가방 메뉴 · 상세 · 상점 필터) 네 층.
계약 변경은 선택 필드 추가(`learn?` · `blueprintId?` · 세이브 `known?`)뿐이라 구세이브 · 기존 호출측 영향 없음.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| core 규칙 · DB | `vitest` | 51/51 (새 7건) |
| 분해 기대값 | 브라우저 2만 회 몬테카를로 | 타이라바 헤드 1.60단위/회(설계 4 × 0.4) |
| 모르는 도면 숨김 | 하네스 `r223.cjs` ko/en | 맨손 12 · 작업대 15 · 카드 채비 없음 · `check` = 「모르는 도면이다」 |
| 도면 종이 진열 · 구매 | 직판장 `buyables()` + `handleBuy` | 7종 진열 · 15,000원 차감 · 읽은 뒤 6종(아는 것 빠짐) |
| 읽기 · 제작 | `readPaper` → `start` → 진행 | 종이 소모 · 목록에 등장 · 카드 채비 5단(`rigPart card_rig` · 5단) 지급 |
| 레벨 차 | 붕대 Lv1 → Lv41 | 성공 95% → 99%(상한) |
| 분해 | 타이라바 헤드 25회 | 두 번째에 도면 깨침 · 붕대 · 크릴은 분해 대상 아님 |
| 확인 창 | 실마우스(우클릭 메뉴 → 분해하기) | ko 「… 1개를 분해합니다.」 / en 「Take apart 1 × Tairaba head 80g.」 · 단추 「분해하기」/「취소」 |
| 세이브 | serialize → reset → deserialize · `known` 없는 구세이브 | 아는 도면 복원 · 구세이브는 붕대 앎 · 카드 모름 |
| 영어 | en 하네스 메뉴 · 토스트 · 확인 창 | 「Read blueprint」 · 「Blueprint: Tie a 5-hook Horse…」 · 잔존 한국어 0 |
| 오류 | pageerror · `[TextOverflow]` | 0 · 0 |

재현: `node r223.cjs ko|en`(scratchpad) — dev 서버 5173, core를 고쳤으면 `.vite` 지우고 재시작.

## 6. 잔여

- **도면을 주는 퀘스트 · 인물 우호도 보상** — `rewards.items`에 `inv_bp_*`를 넣으면 바로 된다(종이가 아이템이다). 어느 이야기에 붙일지는 사용자 결정.
- 도움말 제작 그림 2장은 재촬영하지 않았다(목록에 「밑밥 크릴에서 미끼 고르기」 1줄이 늘었을 뿐).
- 광질 · 재료 체인 · 작업대 업그레이드는 다음 단계(기획 §2 「고급 작업대」).
- 가방 우클릭 메뉴의 「전환하기」는 예전부터 「준비중」 안내만 한다(이번 범위 밖).

## 7. 위험 · 부작용

- 상점 목록이 길어졌다(직판장 +7칸). 재고 규칙상 도면 종이는 하루 재고가 있으며 「기타」 칩으로 걸러 볼 수 있다.
- 분해는 즉시 끝나고 시간이 걸리지 않는다(재료 일부만 돌아오므로 남용 이득이 없다고 판단). 실플레이에서 어색하면 맨손 대기열로 옮긴다.
- 「보관 요령」 등 222차 효과와 겹치는 부분 없음.

## 8. 후속 반영

- [x] 워크로그 인덱스 · 시스템 페이지(진행 S21) · 백로그
- [x] AGENTS §9 · PLAN · CLAUDE.md 최근 3개(220차 내림)
- [x] 위키 아티팩트 재발행(v31 — 도면 종이 10종 · 도면 얻는 길)
- [x] 제작 기획서 §8 C5 상태 표기
