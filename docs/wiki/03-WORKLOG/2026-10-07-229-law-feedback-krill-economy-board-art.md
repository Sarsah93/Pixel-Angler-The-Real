# 229차 — 법 반영안 확정: 패류독소 · 파산 · 표지판 · 게 암수 + 크릴 경제 + 놀이 판 그림 고급화

| | |
|---|---|
| **날짜** | 2026-10-07 |
| **시스템** | `해루질` `인벤토리` `요리` `상점` `UI(가이드)` `에셋` |
| **트리거** | 사용자 회신(227 · 228차 반영안 4문항) + 추가 요청(놀이 그림 품질 · 게 암수 · 크릴 에셋 5장) |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 테스트 79/79 |

---

## 1. 배경 — 왜 했나

227차 반영안(패류독소 · 벌금 · 민꽃게 · 어장 표시)에 사용자가 답을 보냈고, 같은 메시지에 요청을 더했다(요지).

- 패류독소: 추천안대로 — 채취는 되지만 금지 기간에 캔 것을 먹으면 일정 확률로 식중독(익혀도).
  글자 「독」 대신 **보라색 물방울 아이콘**을 칸 또는 상세보기에.
- 벌금 **1천만원**. 바로 낼 수 있으면 돈을 잃고, 모자라면 **파산 엔딩** —
  「그 만한 돈이 없다. 감당할 수 없는 불행에 심장이 빨리 뛰고, 눈 앞이 깜깜하다.」(암전) → 「파산했으니 다시 시작?」 → 처음부터.
  파산 가능성과 처음부터 다시 시작함을 **자연스럽게 알려 주는 힌트**.
- 민꽃게 허가 없이 — 좋다. (「민꽃게는 종을 따로 두지 않았는데?」 → 있다: `charybdis_japonica` 「민꽃게 (돌게)」)
- 어장 표시는 **표지판만**(지도에 그리지 않는다). 도움말 · 튜토리얼 가이드. 표지판을 직접 [F]로 읽어 익히는 과정.
- 「미니게임 5종 이미지 퀄리티가 너무 떨어짐(단순 도형). 좀 더 고급 픽셀 디자인. 가이드가 텍스트로만 이루어져서도 안 된다.」
- 게는 배딱지로 암수를 가리니 잡은 뒤 상세보기에 성별. **알 밴 암컷은 자동 방생**.
- 에셋 5장: 1자형 혼무시(놀이 연출) · 급랭 백크릴(밑밥 블록) · 미끼용 곽크릴 · 다낚스 살림용 바칸 · 외포란 암꽃게.
  블록 이름은 **「급랭 백크릴 600g(밑밥 블록)」** · 해동 전엔 밑밥도 못 개고 사용 불가 · 해동 후 ① 밑밥통 ② 뜯으면 미끼용 백크릴 50마리 ·
  상온 3시간 뒤 부패 · 부패 미끼 장착/사용 시 입질 −20% · 곽크릴은 뜯으면 미끼용 크릴 20마리 · 백크릴은 입질 +2% · 그림은 같고 설명은 다르게.

---

## 2. 방법 — 판단한 것

**패류독소는 해역별 봄 발령으로 흉내 낸다** — 실제 발령은 해마다 다르다. `ShellfishToxin.ts`가 연도 · 해역 해시로
3~6월 사이 10~24일짜리 창을 2~3개(남해) · 0~1개(동해 35%) · 1~2개(서해) 만든다.
「발령 중인가」는 `toxinBanActive(regionId, date)` 하나로 묻는다.

- 금지 기간에 캔 홍합 · 바지락 · 굴 → 아이템 `toxin: true`. 쿨러 → 가방 이송에도 승계. **냄비에 넣으면 냄비가 독을 물려받아** 완성 요리에도 붙는다(익혀도).
- 먹으면 `food_poison` 확률 `TUNING.forage.toxinPoisonChance`(0.6). 글자 대신 16x16 픽셀 아이콘 `toxin`(보라 물방울) — 칸 좌하단 · 상세보기 맨 위 행.
- 알리는 곳 셋: 집 라디오 방송 한 단락 · 표지판 한 줄 · 캘 때 채널 로그.

**벌금은 정액 1천만원 · 못 내면 파산** — `rollEnforcement`가 `max(상한, 비율)`이라 사실상 정액. 호출부가 돈을 보고 모자라면 `bankrupt()`.

- 파산 연출(`beginBankruptcy`): 창 전부 닫기 → 반투명 검정 → 혼잣말 두 단락(사용자 문장) → 완전 암전 → 확인 창
  「파산했다. … 처음부터 다시 시작할까?」 — 「처음부터 다시 시작」 = 같은 슬롯 새 게임(캐릭터 만들기부터) · 「타이틀로」.
- 힌트는 세 겹: 어장 들어설 때 채널 「적발되면 벌금 1천만원 — 그만한 돈이 없으면 파산」 + 처음이면 「물가에 표지판이 서 있다」 ·
  표지판 둘째 줄(빨강) · 표지판 첫 읽기 가이드 둘째 말풍선 · 도움말.

**어장은 지도에 없다 — 표지판이 전부** — 보호 어장(마을어장 · 협동양식장)마다 외곽 링 꼭짓점에서 가장 가까운 걷는 뭍 칸에
절차 픽셀 표지판(기둥 + 흰 판 + 붉은 띠)을 하나 세운다. 1.6칸 안이면 [F] 「표지판 읽기」 → `SignboardPanel`(어장 이름 · 금지 5종 ·
벌금 · 파산 경고 · 허가 없이 잡는 것 · 패류독소) + 첫 읽기 가이드 5단계(줄마다 짚음) + 「도움말에서 더 보기」. 읽으면 `sign.farm_read`.

**게 암수 · 외포란** — `rollForageHarvest`에 `month`를 넘기면 게류(꽃게 · 민꽃게 · 쫄장게)는 50/50 성별, 암컷은 4~9월 35%로 외포란.
외포란은 `deliver` 전에 돌려보낸다 — 혼잣말 창(초상 = 외포란 꽃게 그림 · 이름 「알 밴 암컷」) 세 단락. 성별은 상세보기 행(`sex_f`/`sex_m` 아이콘).

**크릴 경제** — 신선도 프로필 둘을 추가했다.

- `krill_block`(블록 · 곽): 냉동 4시간 → 해동 3시간 → 부패. `krill_bait`(미끼용): 해동 3시간 → 부패(「나쁨」 없음).
- 블록은 `chumKind: 'krill' && frozen`이면 밑밥통 투입(`finishChumDrag`)도 포장 뜯기(`unpack`)도 거부한다 — 밑밥 통 위에 한 줄 띄운다.
- 곽크릴은 언 채로 뜯을 수 있고 안의 크릴이 곽의 상태를 잇는다. 블록을 뜯으면 **미끼용 백크릴**(`inv_krill_bag` — 시드에 없어 `UNPACK_TPL`).
- 입질: `rigBiteMult()` × `baitStateMult()` — 끼운 미끼에 부패가 하나라도 있으면 ×0.8 · 백크릴이 있으면 ×1.02.
- 다낚스 살림용 바칸(`inv_bakkan`)은 `hasCooler()`가 쿨러와 같이 센다.
- 구세이브: 이름 개명(「냉동 크릴 (밑밥 블록)」 → 급랭 백크릴 · 「크릴 (냉동)」 → 미끼용 크릴) · `condProfile` · `unpack` 시드 백필.

**놀이 판 그림** — 바닥 4종을 절차 픽셀(2px 셀 노이즈 · 균열 · 이끼 · 따개비 · 물 빛무늬 · 지층 · V자 틈 · 해초)로 220x90에 굽고 2배로 깐다.
손 도구는 손그림 24x24 도트 5종(맨손 · 장갑 · 집게 · 갈퀴 · 갈고리)으로 바꿨고, 파기 판의 갯지렁이는 **1자형 혼무시 도트**가 구멍 속에 서 있다가
이기면 구멍 밖으로 끌려 나온다(0.7초). 가이드 말풍선에는 **그림**(바닥 조각 + 생물 + 손 + 화살표 · 고리 · 막대)이 글 위에 들어간다 —
`TourStep.picture`(GuideTour 공통 기능).

---

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`core/rules/ShellfishToxin.ts`](../../../packages/core/src/rules/ShellfishToxin.ts) (+test) | 해역 · 연도별 패류독소 창 · `toxinBanActive` · `toxinBanLabel` · `isToxinShellfish` |
| 신설 | [`client/ui/SignboardPanel.ts`](../../../packages/client-pc/src/ui/SignboardPanel.ts) | 어촌계 표지판 읽기 창 + 첫 읽기 가이드 5단계 |
| 신설 | [`client/ui/ForageBoardArt.ts`](../../../packages/client-pc/src/ui/ForageBoardArt.ts) | 바닥 4종 굽기 · 도구 스프라이트 키 · 가이드 그림 5종(`makeForageDemo`) |
| 수정 | [`core/simulation/ForagingEngine.ts`](../../../packages/core/src/simulation/ForagingEngine.ts) | `ForageHarvest`(sex · berried) · `isCrabCreature` · `rollForageHarvest(…, month)` · 벌금 정액 |
| 수정 | `core/config/tuning.ts` · `types/Cooking.ts` · `types/Foraging.ts` · `db-schema/ShoreCreatureDatabase.ts` | `fineCapWon` 1천만 · `toxinPoisonChance` · `DeployedStove.toxin` · 민꽃게 허가 없음 · 갯바위 · 안벽 |
| 수정 | [`client/scenes/field/ForageSystem.ts`](../../../packages/client-pc/src/scenes/field/ForageSystem.ts) | 표지판 배치 · 근접 · 외포란 방생 · 독 표식 · 파산 분기 · 어장 진입 힌트 |
| 수정 | [`client/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `beginBankruptcy` · [F] 「표지판 읽기」 · 호스트 배선(파산 · 방생 혼잣말 · 표지판) |
| 수정 | [`client/store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | `toxin` · 크릴 프로필 2종 · 시드 개명 · `UNPACK_TPL` · `unpack` 게이트 · `baitStateMult` · 바칸 = 쿨러 · 백필 |
| 수정 | `client/data/ShopCatalog.ts` · `store/CoolerStore.ts` · `ui/CoolerPanel.ts` · `store/CookingStore.ts` | 블록 · 곽크릴 · 바칸 판매 · 쿨러 독 승계 · 냄비 독 승계 |
| 수정 | `client/ui/InventoryPanel.ts` · `ui/ItemDetailPanel.ts` · `ui/UtilizationPanel.ts` | 독 배지 · 독/암수 행(아이콘) · 채집물 상세 · 크릴 3종 설명 · 먹을 때 식중독 롤 · 언 블록 밑밥 거부 |
| 수정 | [`client/ui/ForageGamePanel.ts`](../../../packages/client-pc/src/ui/ForageGamePanel.ts) · [`ui/GuideTour.ts`](../../../packages/client-pc/src/ui/GuideTour.ts) | 구운 바닥 · 손 도구 스프라이트 · 1자형 지렁이 · 이김 연출 · `TourStep.picture` |
| 수정 | `client/data/HelpContent.ts` · `data/RadioBroadcast.ts` · `i18n/en_{help,items,ui}.ts` | 조례 도움말 4단락 · 라디오 독소 단락 · 영문 |
| 수정 | `tools/gen_pixel_icons.py` · `tools/pixelize_forage_photos.py` · `scenes/BootScene.ts` | 아이콘 `toxin` · `sex_f` · `sex_m` · `krill` · `fg_*` 6종 · 에셋 5장 + 1자형 혼무시 64px |

---

## 4. 구조상 위치

`해루질 → 법 규칙(판정 층) + 채집 결과(데이터 층) + 놀이 판(렌더 층)` · `인벤토리 → 신선도 프로필(판정) + 포장(데이터)` ·
`가이드 투어 → 말풍선 그림(렌더 — 공통 계약 `TourStep.picture`)`.
독 표식은 아이템 필드 하나(`toxin`)가 쿨러 · 냄비 · 요리까지 흐른다 — 새 보관 · 변환 경로가 생기면 그 필드를 잇는다.

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 패류독소 창 | core 테스트 `ShellfishToxin.test.ts` | 4건 통과(해역 분포 · 결정성 · 3~6월 범위) |
| 크릴 | 하네스 `r229.cjs` | 언 블록 `unpack` 거부 → 해동 뒤 백크릴 50 · 곽 → 미끼용 크릴 20 · 바칸 = 쿨러 · 배율 1.02 → 부패 0.816 |
| 독 · 암수 | 하네스 | 음식 칸 `pxi_toxin` 배지 · 상세 「패류독소」 보라 행 + 아이콘 · 「암컷 — 배딱지가 둥글고 넓다」 + 분홍 아이콘 · 먹으면 식중독 문구 |
| 표지판 | 하네스 | 어장 3 · 표지판 3 · 20px 옆에서 `nearSignFarm` · [F] 「표지판 읽기」 · 창 + 가이드 · `sign.farm_read` |
| 외포란 · 파산 | 하네스 | 혼잣말 창(외포란 꽃게 초상) · 파산 → 혼잣말 → 암전 → 확인 창(타이틀로 닫음) |
| 놀이 판 5종 | 하네스 + 스크린샷 | 바닥 `fb_bed_{rock,water,cut,crevice}` · 도구 `pxi_fg_{hand,tongs,rake,gaff}` · 1자형 지렁이 · 이기면 y 139 → 66 끌려 나옴 · 말풍선 그림 5장 |
| ko/en | 하네스 두 번 | TextOverflow 0 · pageerror 0 · 상세 행 영어(`Shellfish toxin` · `Female — round, wide abdomen`) |
| 빌드 | `pnpm run build` · typecheck | 3/3 · 0 오류 · core 79/79 |

---

## 6. 잔여

- **「미끼용 크릴」 그림** — 사용자 이미지가 채팅에 첨부되지 않았다(파일 없음). 지금은 픽셀 아이콘 `px:krill`(새우 한 마리) 자리표시.
  다시 첨부되면 `item_krill`로 바꾸고 `inv_krill` · `inv_krill_bag` 둘 다 같은 그림.
- 파산 뒤 「타이틀로」는 마지막 침대 저장분이 남는다(저장은 침대에서만 — 정책 유지). 되돌릴 수 없게 할지는 사용자 판단.
- 패류독소 발령은 지금 해역 둘(속초 동해 · 부산 남해)뿐 — 지역이 늘면 `seaZoneOf`에 한 줄.
- 외포란 판정은 월(4~9월)만 본다 — 실제 외포란 시기는 종마다 다르다(사용자 자료가 오면 종별로).
- 다낚스 바칸은 쿨러와 같은 기능 — 「해수 담긴 바칸 = 살아 있다」 차별(산소 · 수량)은 쿨러 매질 체계 확장 때.

---

## 7. 위험 · 부작용

- `rollEnforcement`가 정액이 됐다 — 비율(`fineRatio`)을 올려 상한을 넘기지 않는 한 재화와 무관하게 1천만원. 초반 적발 = 파산이다(의도).
  적발 확률 25%는 그대로라 어장 안 5종을 네 번 캐면 셋 중 둘은 파산한다. 표지판 · 채널 힌트가 그걸 미리 말한다.
- `unpack()`이 `refreshCondition`을 먼저 부른다 — 다른 포장(빵가루 반죽)에는 `condition`이 없어 영향 없음.
- `baitStateMult()`가 `rigBaitItems()`의 `condition`을 갱신한다(지연 갱신) — 입질 판정이 미끼 상태를 매 틱 읽는다(가벼움).
- 가이드 그림은 단계마다 새로 만들고 전 단계 것을 파괴한다 — `picture` 콜백이 무거운 텍스처를 매번 구우면 안 된다(바닥은 한 번 굽고 캐시).
- 표지판 칸은 「걷는 지형」에만 선다 — 어장 꼭짓점 3칸 안에 뭍이 없으면 그 어장은 표지판이 없다(속초 3/3 세워짐).

---

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 §3.1
- [x] `02-SYSTEMS/night-hunting-trap.md` §4 · §5 · §6
- [x] `04-BACKLOG.md` BG 갱신 · BH 신설
- [x] AGENTS §9 · PLAN · CLAUDE.md 요약(229 넣고 226 뺌) · 배포 65차 · 위키 재발행
