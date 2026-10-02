# 192차 — 채비 모딩 트리 (원줄 한 칸에서 좌→우로 열리는 채비창) · 부력찌 필수 폐지 · 도래/직결 매듭 · 봉돌·간편 채비·타이라바 세트

| | |
|---|---|
| **날짜** | 2026-10-02 |
| **시스템** | `낚시` `인벤·장비` `UI` `에셋` `세이브` |
| **트리거** | 사용자 QA 피드백 3건 + 설계 지시(「타르코프 MODDING SYSTEM처럼」) |
| **커밋** | (이 워크로그와 같은 커밋) |
| **빌드·타입체크** | 3/3 · 0 오류 · core vitest 9/9 |

---

## 1. 배경 — 왜 했나

QA 피드백(사용자 원문):

1. 「현재 구멍치기와 같은 미끼채비를 할 경우, 부력찌 없이 채비고정이 안됌 → 구멍치기, 원투채비 등을 할 수 있게 하려면
   부력찌 없이도 채비가 고정이 되어야 함.」
2. 「미끼채비에서 도래를 채비해야만 원줄과 목줄을 연결 시킬 수 있게 해야 함. → 직결매듭법 도입하면 상관없음.」
3. 「봉돌을 구매했음에도 채비창에서 봉돌이 표시되지 않음. → 현재 봉돌 없이 사용 가능한 상태.」

설계 지시: 소켓 9개를 한꺼번에 보여 주지 말고, **원줄 하나**에서 출발해 고른 것에 따라 오른쪽으로 칸이 열리는
모딩 방식으로. 예시 ① 핀도래 → 간편 채비 → 묶음추(핀도래·바늘 1·2·바렐 도래·봉돌·바늘 3 고정 확장 + 바늘마다 미끼),
② 직결 → 카본 목줄 → 핀도래 → 타이라바(헤드·스커트·넥타이 셋 다 채워야 완성 · 바늘 1·2에 지렁이).
앞 칸을 바꾸면 뒤에 달렸던 것은 전부 해제. 세트가 권장하는 미끼가 아니면 「권장되는 채비 유형이 아닙니다」 + 대상어종 확률 급감.

## 2. 원인 — 무엇이 문제였나

- (1) `InventoryStore.REQUIRED_RIG`가 `float`(부력찌)를 고정 필수로 두고, 「찌 소켓 둘 다 비움 + 도래」일 때만 원투로 봐서 면제했다.
  도래를 달지 않은 구멍치기·원투는 영영 「필수 소켓 비었음: 부력찌」였다.
- (2) 도래 소켓은 선택이었고 직결 개념이 없었다 — 원줄·목줄이 아무 연결 없이 이어졌다.
- (3) 봉돌 소켓의 후보 필터가 **원투 모드일 때만** 무게추(`isWeightSinker`)를 받고, 그 외에는 좁쌀(`isSplitShot`)만 받았다.
  원투 모드 조건(찌 비움 + 도래)이 안 되면 산 고리봉돌이 목록에 뜨지 않았다(캡처 3 = 봉돌 칸 「사용 가능한 부품이 없습니다」).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`packages/core/src/simulation/RigTree.ts`](../../../packages/core/src/simulation/RigTree.ts) | **채비 모딩 트리** — 부품 종류 `RigPartKind` 19종 · 칸 정의 `RIG_SLOTS`(item/choice/toggle/fixed) · 문법 `childrenOf` · 세트 `KIT_DEFS` 6종(묶음추·타이라바·카드·T자·하드·소프트) · `setRigValue`(자손 절단 + 자식 삽입) · `missingParts` · `summarize`(평면 투영값·대상어종 가중·비권장 판정) · `treeFromLegacy`(구세이브 이관) |
| 신설 | [`RigTree.test.ts`](../../../packages/core/src/simulation/RigTree.test.ts) | vitest 9건 — 확장·묶음추·타이라바(비권장 가중)·구멍치기·찌 세트·절단·이관 |
| 신설 | [`client-pc/src/store/RigParts.ts`](../../../packages/client-pc/src/store/RigParts.ts) | 아이템 → 부품 종류·미끼 키 분류기(`rigPart` 우선, 없으면 이름·제원 추정) · `rigViewOf` |
| 수정 | [`store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | `_tree` 정본 + `projectTree()`로 평면 `_rig`·`rigMode`·루어·편대 필드를 **투영**(물리·캐스팅·입질·손실 소비자 무수정) · `setRigNode` · `rigSummary`/`rigSpeciesBias` · `getMissingRigParts` = 트리 · `isSurfRigReady` = 찌 없는 바닥 채비 · `hookNeedsBait` = 세트 · 손실/소모/삭제 시 트리 동기화 · 세이브 `rigTree` + 구세이브 이관 · `InvItem.rigPart`/`kitHooks` · `inv_swivel` 「면도래 8호」→「핀 도래 8호」(그림이 스냅 도래) · 시드 바렐 도래·타이라바 부품 |
| 삭제 | `InventoryStore.setRigPart/setRigMode/setLure/setJigHead/setSpreader` · `REQUIRED_RIG` | 평면 소켓 직접 편집 경로 — 트리와 어긋나므로 폐기(편집은 `setRigNode` 하나) |
| 수정 | [`ui/UtilizationPanel.ts`](../../../packages/client-pc/src/ui/UtilizationPanel.ts) | 채비 탭 재작성 — 체인 칸 렌더(9칸/행 꺾임 · 필수 주황/선택 흐림/고정 회색/갈래 보라) · 칸별 선택창(받는 종류만 · 추천 위로) · 「추천」/「비권장」 배지 · 비권장 토스트 · 제원 상자(세트 이름 · 라인 인장) · 첫 열기 가이드 갱신. 미끼/루어 모드 토글·루어 트리·편대 행 삭제 |
| 수정 | [`scenes/FirstPersonFishingScene.ts`](../../../packages/client-pc/src/scenes/FirstPersonFishingScene.ts) | 스폰 컨텍스트에 `rigSpeciesBias()` 병합(타이라바 참돔 +60% · 비권장 미끼 −92%) · 미끼 키 분류기 공용화 |
| 수정 | [`data/ShopCatalog.ts`](../../../packages/client-pc/src/data/ShopCatalog.ts) | 직판장 채비 코너: 핀 도래(개칭) · 바렐 도래 6호 · 타이라바 헤드 60/80/100g · 스커트 · 넥타이 |
| 신설 | `public/item-icons/it_tairaba_{head_red,skirt_red,necktie_orange}.png` · `it_swivel_barrel.png` · [`tools/gen_tackle_icons.py`](../../../tools/gen_tackle_icons.py) | 사용자 제공 도트 3장 투명 정사각 변환 · 바렐 도래는 절차 생성(48×78 격자 → 16배) |
| 수정 | `scenes/BootScene.ts` · `i18n/en_rig.ts`(신설) · `en.ts` · `en_ui.ts` | 텍스처 4종 로드 · 영문 사전(칸·갈래·세트·문구·가이드·부품·도움말) + 규칙 4 |
| 수정 | `data/HelpContent.ts` · `tools/capture_help_images.cjs` · `tools/annotate_help_images.py` · `public/guide/help/help_rig_{bait,lure}{,_en}.png` | 도움말 「장비 설정 (채비)」 재작성(채비 엮기 · 간편 채비 세트 · 루어는 한 갈래) · 실캡처 ko/en 재촬영 + 콜아웃 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S1 낚시 루프 → 채비 조립 → 모딩 트리`. **계약(core 타입·문법)** + **데이터(세트·부품 종류)** + **판정(완성·추천·가중)** + **렌더(채비 탭)**.
평면 9소켓은 계약을 유지한 채 트리의 투영값이 됐다 — 1인칭 물리·캐스팅 게이트·입질 미끼 키·손실 규칙·세이브 `rig`는 그대로 읽는다.

채비 순서도(전 갈래·세트 전개·절단 규칙·경로 예시 8종): https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 — core `childrenOf`와 1:1.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 트리 문법·절단·요약·이관 | core vitest `RigTree.test.ts` | 9/9 |
| dev 시드 반유동 → 트리 이관 | 하네스 `rig192.cjs` (`__INV.resetAllDevSeed`) | 15칸 · 누락 0 |
| 원줄 칸 실마우스 → 선택창 → 비우기 → 다시 달기 | 실클릭 | 뿌리만 남음 → 원줄·원줄 부속(없음)·매듭 열림 · 누락 「매듭」 |
| 묶음추 간편 채비(도래 → 핀 도래 → 간편 채비 → 묶음추 25호) | `setRigNode` + 실렌더 | 고정 6칸(핀도래·바늘 1·2·바렐 도래·봉돌·바늘 3) + 미끼 3칸 · 누락 「미끼 1」→ 크릴 후 0 · 평면 투영 sinker=묶음추·bait=크릴 · 원투 참 · 고정 ok |
| 매듭을 직결로 바꿈 | | 도래 이하 전부 해제(4칸만 남음) |
| 타이라바(직결 → 목줄 → 도래·스냅 → 핀 도래 → 타이라바) | 실마우스로 미끼 1에 크릴 | 누락 「헤드·스커트·넥타이·바늘 1」→ 채운 뒤 「미끼 1」 · 크릴 = 비권장 배지 + 토스트 + `red_seabream −0.92` · 지렁이 = `+0.6` · 총 무게 81.7g(헤드 80) |
| 구멍치기(찌 없이 직결 → 목줄 → 좁쌀 → 바늘 → 미끼) | | 누락 0 · float null (**부력찌 필수 폐지**) |
| 세이브 왕복 | `saveToSlot(3)` → `loadFromSlot(3)` | 트리 JSON 동일 · 누락 0 |
| 구세이브 이관 | 세이브에서 `rigTree` 삭제 후 로드 | 평면 소켓에서 8칸 체인 복원 · 누락 0 |
| 손실 | `loseRigParts(['leader'])` | 목줄 칸 비고 그 아래(목줄 끝·좁쌀·바늘·미끼) 해제 |
| 영어 | 같은 하네스 `en` | 칸·갈래·세트·선택창·제원·안내 전부 영문 · pageerror 0 |
| 도움말 | `capture_help_images --only rig_bait,rig_lure` ko/en + annotate | 콜아웃 4·5개 |
| 빌드 | `pnpm run build` · typecheck | 3/3 · 0 |

## 6. 잔여 — 이번에 안 한 것

- **도래 나머지 종류 에셋**(크레인·볼베어링·쌍동이·세발·T자 · 스냅 7종) — 사용자가 작업 예정. 지금 「핀 도래 8호」는 기존 스냅 도래 그림.
  새 그림이 오면 `rigPart: 'swivel_plain' | 'swivel_snap'`만 붙여 상점에 넣으면 칸이 받는다.
- **타이라바 헤드 그림은 무게 공용**(60/80/100g 한 그림) · **리본**은 넥타이와 한 칸(`tairaba_necktie`) — 리본 도트가 오면 같은 종류로 추가.
- **고정 바늘·핀도래 아이콘은 감성돔 바늘·스냅 도래 그림 공용**(묶음추 세트 띠).
- **다단 바늘 입질**: 묶음추 바늘 3개의 미끼는 캐스팅 소모가 「미끼 1」 하나다(카드 채비만 단별 소모). 바늘 수에 따른 입질 가중은 없음.
- **직결 매듭 레벨·스킬 제한 없음**(사용자: 노상관) — 숙련도 게이트를 걸 자리는 `RIG_SLOTS.knot.options`.
- EN에서 루어 칸 라벨이 「Lures」(기본 사전 우선) — 「Lure」로 통일하려면 `EN_BASE`에서.
- 착수 조건: 사용자 실검증(이번 배포) 피드백.

## 7. 위험·부작용

- **평면 소켓을 직접 쓰던 경로가 남아 있으면 트리와 어긋난다** — `setRigPart` 등은 지웠고,
  남은 쓰기는 `consumeRigItem`·`loseRigParts`(둘 다 트리 동기화 포함). 새 코드는 `setRigNode`만 쓴다.
- `isSurfRigReady()` 의미 변경: 「찌 비움 + 도래」 → 「찌 없는 바닥 채비」. 1인칭 `surfMode`·로드 허용 무게(150g)가 찌 없는 모든 채비에 적용된다.
- `hookNeedsBait()`가 세트 기준이라 **바늘 칸에 루어를 다는 경로는 없다**(루어는 간편 채비 갈래). 구세이브의 「바늘 소켓 루어」는 이관 시 비워진다.
- 도움말 캡처 도구가 `__INV.setRigMode`를 쓰던 자리는 트리 조립으로 바꿨다 — 다른 하네스에 같은 호출이 남아 있으면 실패한다.

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인
- [x] 시스템 페이지 [S1 낚시 루프](../02-SYSTEMS/fishing-loop.md) · [S2 인벤·장비](../02-SYSTEMS/inventory-equipment.md) §2·§4·§6
- [x] 백로그 AK
- [x] AGENTS §9 · PLAN · CLAUDE.md 요약 회전(189 제거)
- [x] 스킬 `save-migration` 함정 1줄(정본 ↔ 투영)
