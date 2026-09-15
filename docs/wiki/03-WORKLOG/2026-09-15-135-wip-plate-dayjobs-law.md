# 135차 — 미완성 접시 저장 + Ch1 실시스템(품삯·사이소·가방) + 법 강제 3단계

| | |
|---|---|
| **날짜** | 2026-09-15 |
| **시스템** | `회썰기` `인벤` `스토리` `경제` `UI` `제작` `에셋` |
| **트리거** | 사용자 지시 3건 (① 미완성 접시 저장 ② 전체 플로우 사용 오류 점검 ③ 법 강제 판단 → Ch1 manual 목표 실시스템화) |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

**① 미완성 접시.** 회 조각이 접시 만석 수(소 16점)에 못 미치면 접시를 완성할 수 없고,
`[접시 빼기]`로 내리면 조각이 낱개로 흩어졌다. 잔량이 애매하게 남는 구조.

"미완성 접시 판매 허용"은 **반대**했고(가격표가 만석을 전제한다 — 모듬 = 크기별 고정가 + g 하한 /
단품 = `kg시세 × (회중량 ÷ 실수율) × 인분 마진`), 사용자도 동의했다:

> 내 생각도 동의해. 그에 따라, 플레이팅 진행 정도를 '(미완성)'으로 저장할 수 있도록 구현하자.
> 다만, 추가로 미완성 접시는 진행률을 담긴 정도에 따라, 아이템 상세보기 시, 정보에 표시
> ('소'의 경우, 9/16 ("진행률 숫자" %)) 및 해당 아이템 슬롯 좌하단 … 진행률을 텍스트 %로 작게 표기.
> 신선도 자체도 너가 말한 대로 유지하고, 가치는 완성되지 않으면 팔지 못하게 …. 섭취는 가능하되.

**② 사용 오류 점검.** "전체적인 게임 플로우와 함께 사용 오류(의도한 사용 에러,
의도하지 않은 사용 에러 등)가 없을 지 파악해줘."

**③ 다음 착수.** 134차가 남긴 재개 지점 — 법 강제(`TUNING.law.enforceRodSell`) 판단과
Ch1의 `manual` 목표(대화로만 닫히던 것) 실시스템화.

## 2. 원인 — 무엇이 문제였나

점검(②)에서 확정한 **실버그 6건**. 전부 코드를 읽어 기전을 특정하고 하네스로 재현했다.

| # | 기전 | 확정 근거 |
|---|---|---|
| 1 | `finalizePlate`가 완성 접시 신선도를 **항상 `'fresh'`** 로 굳혔다 | '나쁨' 조각(판매 배율 **0.10**)만 16점 담아 완성하면 배율 **1.00** 접시가 된다 = **10배 세탁** |
| 2 | 도마 사시미 영역 게이트 `hasPlate`가 **빈 접시만** 셌다 | 미완성 접시만 보유하면 영역 자체가 안 열려 **이어담기 불가**(막다른 길) |
| 3 | `placePiece`에 신선도 가드가 없었다 | **부패 조각**도 접시에 올라갔다 |
| 4 | HUD D-day가 `` `D-${dl}` `` 문자열 결합 | `deadlineDaysLeft()`는 음수를 반환한다 → 기한 초과 시 **`D--3`** |
| 5 | 미완성 접시 섭취 시 **접시(식기)까지 소멸** | 담긴 건 회지만 `plateWip.plate`가 아이템 안에 들어 있다 |
| 6 | 진행률 배지 y = `SLOT-24` | 배지 하단 `sy+55`가 이름 라벨 상단 `sy+52`를 **3px 침범**(실측) |

## 3. 변경 — 어디를 어떻게

### A. 미완성 접시 (진행률 아이템화)

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `client-pc/src/store/InventoryStore.ts` | `PlateWipPiece`·`PlateWipData` · `InvItem.plateWip` · `plateWipProgress()` · `msToSpoiled()`·`worstCondition()` · `dismantlePlateWip()` |
| 수정 | 〃 `getSellPrice` | `item.plateWip` → **0원**(판매 불가) |
| 수정 | `client-pc/src/ui/UtilizationPanel.ts` | `unmountPlate(silent)` = 미완성 아이템 생성 / `mountPlate` = 복원(방위·회전 포함) / `finalizePlate` **최악 신선도 계승** / `placePiece` 부패 차단·'나쁨' 경고 / `[미완성으로 빼기]` / `hasPlate` 게이트 / destroy 우선 보관 |
| 수정 | `client-pc/src/ui/ItemDetailPanel.ts` | 미완성 접시 전용 행 — 접시 크기 · **플레이팅 진행 `6 / 16점 (38%)`** · 담긴 어종 · 판매(불가) · 담긴 중량 |
| 수정 | `client-pc/src/ui/InventoryPanel.ts` | 슬롯 **좌하단 % 배지** · 우클릭 **[해체하기]** |
| 수정 | `client-pc/src/ui/ShopPanel.ts` | 판매 목록에서 제외 + 사유 안내 |

**신선도** — 가장 오래된(=종착까지 남은 시간이 가장 짧은) 조각을 계승한다. 라벨 서열이 아니라
`msToSpoiled()`(상태 그래프의 남은 시간 합)로 비교해야 냉동·냉장·활어가 섞여도 옳게 고른다.

### B. 법 강제 3단계

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `core/src/config/tuning.ts` | `law.enforceRodSell` **0 = 끔 / 1 = 항상 / 2 = M1-06 완료 후**(기본 **2**) |
| 신설 | 〃 | `job: { wageMult, costMult, fatigueLimit 88 }` + F8 슬라이더 3종 |
| 신설 | `client-pc/src/store/StoryStore.ts` | `lawEnforced()` — `sellVerdict`가 이걸 먼저 본다 |

### C. Ch1 manual 목표 실시스템화

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `core/src/db-schema/DayJobs.ts` | **일용직 3종** — 얼음 나르기(정옥선 12,000원·2회) · 그물 손질(강두철 8,000원·3회) · 어촌계 공동작업(25,000원·1회·실습생 증 필요) |
| 신설 | `client-pc/src/store/StoryStore.ts` | `jobsOfNpc`·`jobRemaining`·`work()` + 세이브 `jobs` · `match()`가 `communityWork` 목표에 `job:coop_work` 인정 |
| 신설 | `client-pc/src/store/GameState.ts` | `spendLabor(허기, 수분, 피로)` — 행동력 원시 벡터(`action_free` 면제 없음) |
| 수정 | `client-pc/src/ui/DialoguePanel.ts` | **일감(품삯) 스트립**(품삯·피로·남은 횟수·잠금 사유·[일하기]) · 패널 높이를 일감 수로 산출 |
| 신설 | `client-pc/src/data/ShopCatalog.ts` | **생활용품점 사이소**(`daily`) — 저가 릴대 12,000 · 저가 릴 8,000 · 나일론 원줄 · 목장갑 · 헤드랜턴. 매입 없음 |
| 수정 | `client-pc/src/scenes/RegionFieldScene.ts` | OSM `general`·`variety_store` 등 → `daily`(속초 실데이터 **17곳**) · 구매 시 `buy:<아이템id>` 이벤트 |
| 신설 | `core/src/db-schema/CraftingDatabase.ts` | 도면 `bp_backpack_rough`(그물망 1 + 목재 2 + 철사 2 = **11,800원**어치) |
| 신설 | `client-pc/src/data/CraftOutputs.ts` · `tools/gen_pixel_icons.py` | `craft_backpack_rough`(`bagSlots: 5`) + **픽셀 아이콘 `it_backpack`**(28 → 29종) |
| 신설 | `client-pc/src/store/InventoryStore.ts` | `gridCapacity()`(25 → **최대 30**) · `bagUnequipBlocked()` · `equipItem`이 `equip:bag` 이벤트 |
| 수정 | `client-pc/src/ui/EquipmentPanel.ts` | 예약 슬롯 `shoulder_l` → **`가방`** |
| 수정 | `core/src/db-schema/StoryQuestDatabase.ts` | M1-02·M1-04·M1-08·M1-10 목표를 `manual` → **`auto`**(품삯·구매·착용·공동작업 이벤트) |

### D. 점검에서 나온 수정 (§2 표)

전부 이번 차수에 고쳤다. 추가로 `createSeedItems`에 **기본 용량 초과 경고**(dev)를 넣었다 — §7 참조.

## 4. 구조상 위치

- **S16 회썰기 → 접시 플레이팅 → 진행 상태 영속화**: 계약(`PlateWipData`)·판정(신선도 계승·판매 0)·렌더(배지·상세) 3층 전부.
- **S22 스토리 → Ch1 자격 사다리 → manual 목표 해소**: 데이터(`DayJobs`·퀘스트 목표)·엔진(`StoryStore.work`)·UI(대화 스트립).
- **S12 인벤 → 용량**: `gridCapacity()` 하나로 좁혔다(그리드·히트·빈칸 계산·이송 판정이 전부 이걸 본다).

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 미완성 접시 전 경로 | 실렌더 + 실 스토어(`__INV`) `verify135a.cjs` | **22/22 PASS** — 생성·진행률 6/16 38%·최악 신선도 계승·판매 0원·복원(회전 포함)·destroy 보관·해체·세이브 왕복 |
| 품삯·사이소·가방·법 | 실렌더 `verify135d.cjs` | **35/35 PASS** |
| 품삯 | 〃 | 12,000원 지급 · 피로 0 → 9 · 허기 100 → 94 · 하루 상한 2회 · 초과/자격/피로 88 차단 사유 표기 |
| 가방 | 〃 | 착용 시 25 → **30칸** · 확장 칸 점유 시 **해제 차단**(사유 표기) · 비운 뒤 해제 · 재착용 |
| 법 3단계 | 〃 | 0 = 판정 없음 / 1 = 낚싯대 금지(대안 4개) · 비어업인 통발도 자가소비 · **신고어업 보유 시 통발만 허용, 낚싯대는 여전히 금지** / 2 = M1-06 전 허용 |
| 퀘스트 DB | `validateStoryQuests()` | 문제 **0건** (M1-08 목표 = `custom placeKey 'equip:bag'`) |
| UI 겹침 | 실렌더 실측 | 인벤 6행 하단 **499** ≤ 상태줄 상단 ≈ 524 · 대화창 콘텐츠 하단 441 ≤ 496 · pageerror **0** |
| 빌드 | `pnpm run build` · `typecheck` | **3/3 · 0 오류** |

재현 절차(회귀 테스트): 하네스 2종은 `scratchpad/verify135a.cjs`·`verify135d.cjs`.
부트스트랩은 `__GS.startNewGameInSlot(3)` → `scene.start('RegionFieldScene', { region: 'gangwon_sokcho' })`.

## 6. 잔여 — 이번에 안 한 것

- **`deadline.onMiss: 'cost'` 미구현** — D-day가 지나도 아무 일도 없다(표기만 `D+n (기한 초과)`로 고쳤다).
  벌칙 내용이 스펙에 수치로 없어 **사용자 결정 대기**.
- **시드 tackle 4건이 기본 25칸을 넘는다** — §7.
- **가방 2단계 이상**(중형·대형)은 미도입. 도입 시 `equipItem` 교체 경로에도 `bagUnequipBlocked`와
  같은 **칸 축소 가드**가 필요하다(현재는 5칸 가방 1종뿐이라 도달 불가).
- 품삯 수치(12,000 / 8,000 / 25,000 · 피로 9 / 6 / 18)는 **초기값** — F8 `job.*` 슬라이더로 조율.

## 7. 위험·부작용

- ⚠ **법 강제 기본 2의 실제 파급**: M1-06을 끝내면 **어획물 판매가 전면 막힌다**
  (낚싯대는 영구 금지 / 통발도 비어업인은 자가소비). `reported_fishery`는 **M1-11 총회**에서 나오므로
  **M1-06 → M1-11 구간(약 8~10 스토리 일차)** 은 품삯이 유일한 현금 수입이다.
  일당 상한 = 12,000×2 + 8,000×3 + 25,000 = **73,000원**(피로 54 — 상한 88 아래).
  스토리를 진행하지 않은 구세이브·테스터 세이브는 **M1-06 미완료라 회귀 0**.
  끄려면 F8 `law.enforceRodSell` = 0.
- ⚠ **시드가 기본 용량을 넘는다** — `tackle`은 29개라 slot 25~28(쿠션고무·고리/구멍/묶음추 봉돌 3종)이
  **그리드에 그려지지 않는다**. 기능은 살아 있다(채비 선택창·상점 판매 목록은 slot을 안 본다).
  가방을 착용하면 6행이 열려 보이기 시작한다. 시드를 줄일지 용량을 올릴지는 데이터 결정이라
  **`createSeedItems`에 dev 경고만** 넣고 남긴다.
- ⚠ **M1-09(해루질 2개체)는 실데이터 파고 ≥ 1.5m면 막힌다**(121차 설계대로 · 사유는 화면에 표시된다).
  현실 날씨가 며칠 이어지면 퀘스트가 그만큼 지연된다 — D-180이라 치명적이진 않다.
- ⚠ **구세이브 어획물에는 `catchMethod`가 없다** → `?? 'rod'`로 낚싯대 취급. 단계 2에서는
  M1-06 전까지 판정 자체가 없으므로 무해하지만, 단계 1로 켜면 구세이브 어획물이 전부 판매 불가가 된다.
- ⚠ **U 패널 destroy 시 인벤이 완전히 만석이면** 여전히 조각이 사라질 수 있다(61차 안전망의 한계).
  미완성 아이템은 **1칸**만 필요해 위험이 크게 줄었지만 0은 아니다.
- ✅ **브라우저 강제 종료는 안전** — 저장은 침대에서만 하고(44차), 침대로 가려면 씬이 바뀌어
  패널이 destroy되며 미완성 접시가 먼저 저장된다. 강제 종료는 마지막 세이브로 되돌아갈 뿐이다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/story-quests.md` · `sashimi-cooking.md` · `progression.md` 갱신
- [x] `04-BACKLOG.md` 갱신
- [x] `AGENTS.md` §9 요약 + 링크
- [x] `IMPLEMENTATION_PLAN.md` 다음 착수 갱신
- [x] 새 함정 → 시스템 페이지 §6
