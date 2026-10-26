# 272차 — 소모 채비 묶음 판매(바늘 10 · 봉돌 6 · 묶음추 4 · 좁쌀봉돌 20 · 반달구슬 16 · 도래 10) · 구멍봉돌 그림(관통 구멍) · 하모니 PR #12 · #11 병합

| | |
|---|---|
| **날짜** | 2026-10-26 |
| **시스템** | `경제·상점` `인벤토리·장비` `에셋` `도구` |
| **트리거** | 사용자 지시(묶음 판매 · 봉돌 그림) · 하모니 일일 점검 PR 병합 승인 |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` — `63afeb1` · (2) `14542a7` · 85차 배포 gh-pages `d15b6cd` |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 332/332 |

---

## 1. 배경 — 왜 했나

사용자 지시(2026-10-26) 셋.

- **PR 병합**: 「병합해줘. #12 먼저, 그 다음 #11.」 — 하모니 PR #12(core TS6133 — `CropCareSim.test.ts` 2줄) · #11(`STORY_SPEC_v4.md` Σ 215 → 216).
- **묶음 판매**: 「상점 내 소모용 낚시 용품들에서 바늘, 봉돌, 묶음추봉돌(set)를 각각 하나 씩 구매 시, 한 번 소모된 이후로는 사라지고 있게 설정되어 있잖아?
  … 그 방향 자체는 맞는데, 실제로 팔 때, 바늘 1개를 저 가격에 팔지 않아. 바늘 10개 정도를 3500원 정도에 파는 게 맞지. … 구멍봉돌 20호 75g 짜리를 하나 사는데 4500원?
  너무 비싸고 현실적으로 맞지 않아. … 한 묶음으로 팔아야 해. 바늘은 구매하면 10개씩, 봉돌은 6개씩, 묶음추 봉돌은 4개씩 들어있는 걸로 하자.
  좁쌀봉돌과 반달구슬(캡처보면 알겠지만 한 팩 사면 16개 이상 들어있어)도 마찬가지야.」(캡처 = HDF 반달구슬 한 팩).
- **봉돌 그림**: 「'구멍봉돌'은 싱커 내부를 원줄/목줄이 지나갈 수 있는 길(일자로 구멍이 나있음)이 있어서 통과시키는 형태. '고리봉돌'은 위에 동그란 소켓에
  원줄/목줄을 끼우는 형태. … 지금 인게임 내 적용된 구멍봉돌 이미지에서 일부가 고리봉돌 이미지라는 거야. 확인하고 수정해줘.」

## 2. 원인 — 무엇이 문제였나

- **값이 묶음인데 수량은 낱개였다.** 바늘(`inv_chinu3`)은 3,500원에 1개, 구멍봉돌 20호는 `SinkerDatabase.price = 1,500 + 30원/g`(75g → 3,750 × 1.2 = 4,500원)에 1개였다.
  채비 손실(`RigLoss`)은 바늘 · 봉돌 · 도래를 한 번에 잃으니 손실 체감이 실제의 약 10배였다.
- **구멍봉돌 6종이 전부 한 그림(`sinker_pillar.png`)을 쓰는데 그 그림이 고리봉돌 모양이었다.** 원통 위에 철사 고리가 달린 사용자 그림(129차 계열)이라
  구멍봉돌(몸통을 줄이 관통)로 읽히지 않았다. 고리봉돌 그림(`sinker_ring.png` — 배 모양 + 고리)은 맞다. 카드 채비의 고정 봉돌 아이콘(`RigTree` `fixedIcon`)도
  `sinker_pillar`였는데, 스냅에 거는 봉돌은 고리봉돌이다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 병합 | GitHub `main` | PR #12 → `7e7d3bf` · PR #11 → `0415a0d`(둘 다 시험 병합 충돌 0) · 작업 브랜치를 main 위로 빨리 감기 |
| 수정 | [`core/db-schema/SinkerDatabase.ts`](../../../packages/core/src/db-schema/SinkerDatabase.ts) | `price` = **한 개** 값(고리 · 구멍 150원 + 7원/g · 묶음추 500원 + 8원/g · 10원 단위) · `packQty`(고리 · 구멍 6 · 묶음추 4) · `SINKER_PACK_QTY`(index export) |
| 수정 | [`core/simulation/RigTree.ts`](../../../packages/core/src/simulation/RigTree.ts) | 카드 채비 고정 봉돌 아이콘 `sinker_pillar` → `sinker_ring` |
| 수정 | [`data/ShopCatalog.ts`](../../../packages/client-pc/src/data/ShopCatalog.ts) | `ShopEntry.packQty` · `packQtyOf` · `packLabelOf` · `packShopPrice`(한 개 × 묶음 × 1.2 · 100원 단위) · 바늘 300/3,500/10 · 좁쌀봉돌 100/2,500/20 · 핀 도래 250/3,000/10 · 바렐 도래 180/2,200/10 · 반달구슬 90/1,800/16 · 봉돌 `sinkerShopEntry` · 1회 최대 5묶음 |
| 수정 | [`store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | 시드 기준가 5종 한 개 값 · 불러올 때 `PACK_UNIT_IDS`(시드) · `getWeightSinkerSpec`(봉돌)으로 기준가만 정정(수량 · 칸 · 장착 보존) |
| 수정 | [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `handleBuy` — 묶음 수 × `packQtyOf` 낱개 지급 · `packQty`는 가방에 싣지 않음 · 로그 「(10개입) x1」 |
| 수정 | [`ui/ShopPanel.ts`](../../../packages/client-pc/src/ui/ShopPanel.ts) · [`ui/ShopCartDialog.ts`](../../../packages/client-pc/src/ui/ShopCartDialog.ts) | 칸 왼쪽 위 「10개입」(추천 띠가 있으면 그 아래) · 이름 꼬리 「(10개입)」 · 말풍선 「한 묶음 10개 · 개당 약 350원」 · 장바구니 `CartLine.pack` · 「묶음당 3,500원 · 10개입」 |
| 수정 | `i18n/en.ts` · `en_help.ts` · `data/HelpContent.ts` | 규칙 3(「(N개입)」 · 「N개입」 · 「한 묶음 N개 · 개당 약 …」) · 도움말 「어디서 무엇을 사나」 한 단락 + 영어 |
| 수정 | `data/WikiCatalog.ts` · `tools/dump_wiki_items.mjs` · `gen_game_wiki_data.mjs` · `game_wiki_template.html` | 위키 아이템 「묶음 판매 — N개입 값 (개당 약 …)」 줄 · 기준가에 「(한 개)」 |
| 수정 | [`tools/gemini_tackle_art.cjs`](../../../tools/gemini_tackle_art.cjs) | `sinker_pillar` 생김새(원통 · 위 끝면 가운데 구멍 · 줄 한 가닥 관통 · 고리 · 도래 · 소켓 없음) — 3판 생성 뒤 `c`를 골라 `--install --force` |
| 교체 | `food assets/tackle/sinker_pillar.png` · `public/tackle/sinker_pillar.png` · `public/tackle/icon/sinker_pillar.png` | 732×1164(격자 120×192칸) · 카드 57×90 · 아이콘 40×64(`tackle_cards.cjs --only`) |
| 갱신 | `docs/artifacts/{library,tasks,rig_flow}.html` · 위키 | 라이브러리 「소모 채비 묶음 판매」 항목 · 「272차 기준」 · 위키 Version 69 |

### 3-1. (2) 쿠션고무 5개입 · 트레블 훅 3개입(사용자 「쿠션고무도 묶음으로 넣고, 트레블 훅은 3개씩으로 하고, 배포해줘」)

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `data/ShopCatalog.ts` | 종형 · 원형 쿠션고무 2호 `packQty` 5 · 기준가 250 · 진열 1,500원 · **트레블 훅 직판장 신규**(`inv_treble` — 3개입 3,200원 · 기준가 900 · 시작 아이템뿐이라 잃으면 살 곳이 없었다) |
| 수정 | `store/InventoryStore.ts` | 시드 기준가 트레블 900 · 쿠션고무 250 · `PACK_UNIT_IDS`에 셋 추가(구세이브 정정) |
| 수정 | `store/Prologue.ts` | 첫 장보기 「바늘」 판정에서 `inv_treble` 제외(루어용 — 원투 채비 바늘이 아니다) |
| 수정 | 도움말 · `en_help.ts` · 라이브러리 · 위키 | 묶음 목록 16종 |

검증(하네스 `shop272b.cjs`): 묶음 16종 · 트레블 `buyKindOf` null(감성돔 바늘 hook) · 구매(트레블 1 · 종형 1 · 원형 2) → 3 · 5 · 10개 · −7,700원 ·
구세이브 4,000 → 900 · 1,200 → 250 · 404 0 · pageerror 0 · typecheck 0 · 라이브러리 점검 PASS(Version 17) · 위키 Version 70(묶음 16).

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S6 경제·상점 → 상점 → 묶음 판매`. 층은 셋이다 — **데이터**(`packQty` · 한 개 기준가 · core 봉돌 표) · **판정**(`handleBuy` 지급 수 · 되팔기 `basePrice` ·
구세이브 기준가 정정) · **렌더**(칸 · 말풍선 · 장바구니 · 위키). `S5 인벤토리`의 세이브 정적 값 정정은 `deserialize` 한 줄이고, 봉돌 그림은 에셋 층(장비 그림 표의 파일 교체)이다.
채비 트리 문법(`RigTree.childrenOf`)은 그대로다(순서도는 「272차 기준」 줄만).

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| PR 병합 | GitHub 병합 · 시험 병합(`git merge-tree`) · core `tsc --noEmit` | 충돌 0 · 0 · main `0415a0d` · TS6133 0 |
| core | `vitest run` · `tsc` | 332/332 · 0 오류 |
| 빌드 | `npx pnpm run build` · client typecheck | 3/3 · 0 오류 |
| 묶음 항목 | 하네스 — `SHOP_CATALOG.market` `packQty` 항목 | 13종 — 바늘 10개 3,500 · 구멍 · 고리봉돌 3호 6개 1,700 · 15호 3,900 · 20호 4,900 · 25호 5,800 · 묶음추 25호 4개 6,000 · 좁쌀봉돌 20개 2,500 · 핀 도래 10개 3,000 · 바렐 도래 10개 2,200 · 반달구슬 16개 1,800 |
| 구매 지급 | 하네스 — `handleBuy`(바늘 1 · 구멍봉돌 20호 1 · 묶음추 25호 2 · 반달구슬 1) | 가방 10 · 6 · 8 · 16 · 돈 50,000 → 27,800(−22,200) · 바늘 기준가 300 · `packQty` 미저장 · 바늘 10개 매입가 180원 |
| 구세이브 | 하네스 — 세이브에 바늘 3,000 · 구멍봉돌 4,500 · 좁쌀봉돌 2,000을 심고 `deserialize` | 300 · 680 · (없는 칸 그대로) · 수량 7 보존 |
| 상점 칸 | 스크린샷(찾기 「바늘」 · 「봉돌」) | 「10개입」 · 「6개입」 · 「4개입」 · 「20개입」 글자 · 값 · 추천 띠 아래 자리 · 새 구멍봉돌 아이콘 4칸 |
| 상세 창 | `openItemDetail(구멍봉돌 20호)` 스크린샷 | 새 카드(관통 구멍 · 줄) · 형태 「기둥형 구멍봉돌」 · 보유 6개 · 기준가 680원 · 매입가 408원 |
| 텍스처 | 부팅 뒤 `textures.get` | 카드 57×90 · 아이콘 40×64(새 파일) · 404 0 · pageerror 0 |
| 아티팩트 | `check_artifact_page.cjs library.html` | PASS(밝음 · 어두움 · 폰 · 넘침 0 · 겹침 0) |
| 위키 | `dump_wiki_items`(854 · 묶음 13) · `gen_wiki_images.py`(764장) · `--html`(9.3MB · HTML 안 그림 387) | Version 69 |
| **85차 배포** | 「테스트 배포」 실행 14(작업 브랜치 `14542a7`) → gh-pages `d15b6cd` · `git archive` 대조 · http.server 4173 + `deploy272.cjs` | 정적 2,004(소스맵 0 · 얼굴 층 31) · public 대조 같음 2,001 · 다름 0 · 빠짐 0 · 구멍봉돌 카드 · 아이콘 바이트 동일 · 번들에 「개입」 21곳 · 하위 경로 기동 9.4초 · 텍스처 1,409 · 404 0(밖의 KAMIS 스냅샷 1 = 기존) · pageerror 0 |

재현 절차 — scratchpad `shop272.cjs`(dev 서버 5173): 새 게임 → `openShop('market')` → `query` 「바늘」 · 「봉돌」 스크린샷 → `handleBuy` → `serialize` 값 고쳐 `deserialize`.

## 6. 잔여 — 이번에 안 한 것

- ~~쿠션고무 · 트레블 훅 묶음 여부~~ → (2)에서 사용자 지시로 넣었다(쿠션고무 5개입 · 트레블 훅 3개입 직판장 판매).
- **봉돌 주조 레시피**(`bp_sinker_ring` · `bp_sinker_hole` · 묶음추 — 2개 산출)의 산출 가치가 한 개 값으로 줄었다(20호 2개 = 7,500 → 1,360원) — 제작 손익 재조율은 별도 차수.
- 사용자 실검증(상점 칸 · 장바구니 · 구멍봉돌 그림 — 가방 · 상세 · 채비창) — ~~다음 배포에 포함~~ ✅85차 배포(2026-10-26 · gh-pages `d15b6cd`).

## 7. 위험·부작용

- 구세이브의 묶음 값 기준가(바늘 3,000 · 봉돌 3,750~4,890 · 도래 2,500 · 구슬 1,500)는 불러올 때 한 개 값으로 바뀐다 — 되팔 때 뻥튀기 없음. 수량 · 칸 · 장착은 그대로.
- 프롤로그 첫 장보기(236)는 영향 없다 — 가장 싼 봉돌 묶음 1,700원(종전 2,200) · 바늘 3,500원(같음) · `prologueBuyAid`는 `price`(묶음 값)로 센다.
- 위키 · 상세 창의 「기준가」가 한 개 값으로 작아 보인다 — 위키는 「묶음 판매」 줄, 상세 창은 「보유 수량」 옆에 그대로 두었다.
- 상점 재고(`ShopStock`)는 묶음 수 단위다(소모품 갈래 하루 재고 그대로). 아이템 이름 · id는 바뀌지 않아 `ItemIdAlias` 무관.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/economy-data.md` §4 · §6 · `inventory-equipment.md` §6
- [x] `04-BACKLOG.md` CO
- [x] `AGENTS.md` §9 요약 + 링크
- [x] `IMPLEMENTATION_PLAN.md` §2-3 · §3
- [x] `CLAUDE.md` 이어받기 요약 · 아티팩트 판
- [x] 아티팩트 4개 — 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 (Version 15) ·
  구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 (Version 16 → (2) 17) ·
  채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 (Version 15 · 문법 258차) ·
  전체 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c (Version 69 → (2) 70)
