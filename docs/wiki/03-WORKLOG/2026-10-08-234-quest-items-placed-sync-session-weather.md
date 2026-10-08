# 234차 — 퀘스트 물건 수명 감사 · 설치물 대조 · 세션 날씨 · 수조 표지 · 농사 시간 검토

| | |
|---|---|
| **날짜** | 2026-10-08 |
| **시스템** | `스토리 · 퀘스트` `인벤토리` `멀티플레이` `날씨` `홈` `세이브` |
| **트리거** | 사용자 질문 3건(퀘스트 물건 버리기 · 233차 추천안 3건 진행 · 농사 시간 설계) |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 테스트 79/79 |

---

## 1. 배경 — 왜 했나

사용자 원문(핵심 문장):

> 1) 퀘스트 진행 물건을 버렸을 때, 퀘스트가 꼬이는 부분은 없는 지, 퀘스트 진행 물건을 버렸을 때는 아예 소멸하게끔 해야
> 버그 사유가 없을 것 같아. 어떻게 생각해? 그리고 내가 체크하고 싶어하는 부분 외에도 다른 문제는 없는 지 찾아봐줘.
>
> 2) 추천안 대로 세 가지 다 진행해줘.
>
> 3) 농사 관련해서, 리얼타임 요소를 반영하고 있어버리게 되면 … 내 집의 탑다운 필드에서는 유독 신기하게 작물이 …
> 3배 정도 빠르게 성장한다는 조건이 붙으면 어떨까? … 나와는 왠만하면 다른 의견으로 너의 추천도 알려줘.

2)의 세 가지는 233차 보고의 추천안이다 — 설치물 재동기화(접속 대조 + 거절 되돌리기) · 날씨 맞추기(세션 정본 + 구간화) · 수조 독소 표지.

---

## 2. 원인 — 감사 결과 (읽기 전용 감사 에이전트 + 코드 대조로 전부 확인)

### 치명 (메인 이야기가 막힘)

1. **프롤로그 냉동 오징어를 어디에도 팔 수 없었다** — 224차 매입 규칙(`shopBuysItem`)이 「손님이 잡거나 만든 먹을거리」만 사는데,
   오징어(`inv_frozen_squid`, 소분류 「수산물」, 어종 없음)는 빠졌다. 새 게임이 M1-01 「얼린 오징어를 직판장에 판다」에서 멈췄다.
   224차(2026-10-06 배포 60차)부터 이번 배포 전까지 **새로 시작한 판은 전부** 해당.
2. **M1-02 얼음 상자를 버리면 영구히 막혔다** — 버리기 보호가 프롤로그 물건뿐이었고, 상자를 다시 주는 길(수락 때 한 번)이 없었다.
3. **M1-10 자전거** — 가방이 차면 조용히 미지급(반환값 무시) · 타기 전에 버리거나 멀티 거래로 넘기면 「자전거에 탑승한다」를 닫을 수 없었다
   (상점에 자전거 없음).
4. **장소 방문 기록(`firedPlaces`)이 세션 내내 남았다** — 씬 인스턴스가 재사용돼 파산 · 새 게임 · 다른 슬롯에서도 안 지워졌고,
   **퀘스트를 받기 전에 지나간 자리**(경매장 하역 표시 등)는 그 세션 동안 다시 잡히지 않아 진행이 막혔다.
5. **구세이브 M1-02** — 목표가 2개(일감 · 상점) → 4개(상자 확인 · 운반 · 하역 · 보고)로 바뀌었는데 옛 진행값이 엉뚱한 자리에 앉았다.

### 높음 · 중간

- **보상이 가방이 차면 사라졌다** — `complete()`가 먼저 `done`으로 바꾸고 지급 실패는 알림만(선택지 보상도 같음). 귀속 보상은 다시 얻을 길이 없다.
- **거치대 회수 때 대 · 릴이 사라질 수 있었다** — `returnParkedGear`가 `addItem` 결과를 무시.
- **귀속 보상 장비는 확인 한 번에 영구 소멸 · 집에 둘 곳도 없었다**(`HomeStore.accepts`가 귀속 거부).
- **행동 목표가 엉뚱한 사건으로 올랐다** — 출처(`eventOrigins`)를 정하지 않은 목표는 같은 계통 사건이면 무엇이든 받았다.
  예: 아무 의뢰나 세 번 수락하면 M2-10 「선박조종면허 필기 합격」이 닫히고, 아무 일감 세 번에 N19-1 「받침 전달」이 끝났다.

### 낮음

- 하역 자리에서 인벤토리 창의 「내려놓기」 = 「내려놓았습니다」만 뜨고 실제로는 아무 일 없음(창이 열려 있으면 `uiBlocked`).
- 바닥에 둔 `qi_*`는 완료 뒤에도 남음 · 부산(맵 8장) 바닥 물건이 모든 맵 같은 칸에 보임.
- 프롤로그 보호 물건이 거래로는 넘어가 `repairPrologue`가 다시 줌(복제) · 손질 이탈 정산 부산물에 거래품 꼬리표 누락(계보 모드를 먼저 끔).
- `applyOutcome`가 `bound`를 안 넘김 · 냉장고 오징어 2마리를 꺼내 1마리만 넣음 · 구세이브 시드 자전거 + 수락 지급 = 2대.

### 질문(「버리면 소멸」)에 대한 판단

물건마다 답이 다르다 — **모으는 물건은 소멸이 정답, 맡은 물건은 소멸이 버그 원인**이었다.

| 물건 | 버리면 | 이유 |
|---|---|---|
| 모으는 퀘스트 물건(`qi_*`) | **소멸** + 진행도 가방 보유 수로 다시 셈 | 다시 주우면 된다(드롭이 다시 굴러간다) |
| 맡은 물건(얼음 상자 · 타기 전 자전거) | **막는다**(버리기 · 넘기기 · 집 보관) + 사라졌으면 되살림 | 남이 맡긴 것 · 다시 얻는 길이 없으면 영구 막힘 |
| 가족사진(이야기 기념품) | **막는다** | 뒤 장(M7-04)이 다시 꺼내는 유일한 물건 |
| 귀속 보상 장비(`qr_*`) | 버릴 수 있되 **「다시 얻을 수 없다」** 확인 | 장비라 정리하고 싶을 수 있다 · 집 보관 허용 |

---

## 3. 변경

### #1 퀘스트 물건

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`client/store/QuestItemGuard.ts`](../../../packages/client-pc/src/store/QuestItemGuard.ts) | `questKeepReason`(프롤로그 + 얼음 상자 + 타기 전 자전거 + 가족사진) · `repairQuestItems`(구세이브 M1-02 재배치 → 상자 · 자전거 되살림 — 가방 · 바닥 · 집 선반을 먼저 봐서 복제 없음) |
| 신설 | [`client/store/ItemKeepGuard.ts`](../../../packages/client-pc/src/store/ItemKeepGuard.ts) | 저장소가 순환 import 없이 묻는 판정 걸이(`itemKeepReason`) |
| 수정 | [`client/data/ShopCatalog.ts`](../../../packages/client-pc/src/data/ShopCatalog.ts) | 직판장이 프롤로그 오징어를 산다(치명-1) |
| 수정 | [`client/store/StoryStore.ts`](../../../packages/client-pc/src/store/StoryStore.ts) | `collect` 진행 = 가방 보유 수(`syncHeldQuestItems` · `progress()` · 드롭 · 완료 전) · 보상 자리 사전 확인(`rewardRoomShortfall` · `lastRefusal`) · 수락 물건 자리 · 자전거 중복 지급 막기 · `resetIfLayoutChanged` · `wantsVisit` · 행동 목표 출처 게이트(`actionEngaged`) · 완료 시 바닥 사본까지 회수 · `applyOutcome` 귀속 |
| 수정 | [`client/store/GameState.ts`](../../../packages/client-pc/src/store/GameState.ts) | 호스트 `countItem` · `roomFor`(분류별 「장비 칸 2개」) · `takeQuestItems` 바닥 정리 · 불러오기 직후 `repairQuestItems` |
| 수정 | [`client/store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | `slotShortfall`(addBundle과 같은 셈) · `returnParkedGear` 넘친 것 반환 · `parkedGearFits` · 거래 차단에 맡은 물건 |
| 수정 | [`client/store/HomeStore.ts`](../../../packages/client-pc/src/store/HomeStore.ts) | 귀속 장비 집 보관 허용 · 맡은 물건 보관 거부 |
| 수정 | [`client/store/GroundItemStore.ts`](../../../packages/client-pc/src/store/GroundItemStore.ts) | `mapKey`(레거시 다중 맵 — 없으면 모든 맵, 구세이브 호환) |
| 수정 | [`client/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 장소 도착 = **들어선 진입마다** + 기다리는 목표가 있을 때만(`insidePlaces` · `placeActionSent`, `init`에서 비움) · 상자 하역은 창이 열려 있어도(`fromUi`) · 상자는 하역 자리 밖에 못 내려놓음 · 진입 · 인벤토리 변화 때 되살리기 · 바닥 맵 구분 |
| 수정 | [`client/scenes/field/RodHolderSystem.ts`](../../../packages/client-pc/src/scenes/field/RodHolderSystem.ts) | [F] 거두기 전 자리 확인 · 자동 거두기(지역 이동 · 서버 거절)는 넘친 것을 발밑에 |
| 수정 | [`client/ui/InventoryPanel.ts`](../../../packages/client-pc/src/ui/InventoryPanel.ts) | 버리기 · 먹기 · 분해 보호 = 맡은 물건 판정 · 내려놓기는 심부름 물건 + 귀속 장비만 · 귀속 버리기 = 「다시 얻을 수 없습니다」 + 「버리기/취소」 |
| 수정 | [`client/ui/DialoguePanel.ts`](../../../packages/client-pc/src/ui/DialoguePanel.ts) · [`ButcheryPanel.ts`](../../../packages/client-pc/src/ui/ButcheryPanel.ts) · [`store/Prologue.ts`](../../../packages/client-pc/src/store/Prologue.ts) | 거절 까닭 표시 · 이탈 정산 뒤에 계보 끄기 · 냉장고 오징어 수량 그대로 |

### #2 추천안 3건 (설치물 · 날씨 · 수조)

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`core/types/Multiplayer.ts`](../../../packages/core/src/types/Multiplayer.ts) | `mpPlacedClash`(종류별 같은 칸 — 내 거치대끼리는 허용) · `MpPlaceItem` · `MP_PLACED_MAX_PER_OWNER 64` · `MpPlacedSyncRes` · 소비 줄 `val`(160자) |
| 수정 | [`server/multiplayer/SessionRegistry.ts`](../../../packages/server/src/multiplayer/SessionRegistry.ts) · `routes.ts` | 설치 = 같은 id 재시도 ok · 남의 id · 같은 칸 · 상한은 `conflict` + 까닭 · `POST /placed/sync`(내 몫 대조) · `takeWorld` `val`(주인 재기록 때 유지) |
| 수정 | [`client/net/MultiplayerClient.ts`](../../../packages/client-pc/src/net/MultiplayerClient.ts) | 새 토큰(접속 · 재접속) · 닿지 못한 설치 뒤 `syncPlaced` · `placeTrap` → `{ok, reasonKo, unreachable}` |
| 수정 | `TrapFieldSystem` · `StoveFieldSystem` · `RodHolderSystem` · `CookingStore.undoPlace` · `InventoryStore.giveBack` | 거절이면 되돌리기(통발 + 미끼 · 화구 + 연료 + 용기 · 낚싯대 한 벌) + 한 줄 |
| 신설 | [`core/rules/SessionWeather.ts`](../../../packages/core/src/rules/SessionWeather.ts) | 카드(종류 · 바람 · 파고 · 기온 · 강수 · 수온 · 시정) 부호화 · 검증 · `sharedWeatherKind` · `quantizeShared` |
| 신설 | [`client/net/WeatherSync.ts`](../../../packages/client-pc/src/net/WeatherSync.ts) | 지역 × 1시간 슬롯 카드 — 먼저 실황을 받은 사람이 올리고 나머지는 따른다 · 홈타운은 세션 시드 × 슬롯으로 매시 다시 |
| 수정 | [`client/store/ExternalDataStore.ts`](../../../packages/client-pc/src/store/ExternalDataStore.ts) | 실황 1시간마다 다시 받기 · 카드가 조회값을 이긴다 · 목업 기상청 값은 올리지 않음 · `weatherKindAt` |
| 수정 | [`client/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 날씨 연출 다시 그리기(`applyWeatherFx`) · 보일링 스케줄은 구간화한 공용 날씨(`sharedFeedingAt`) |
| 수정 | [`client/ui/AquariumPanel.ts`](../../../packages/client-pc/src/ui/AquariumPanel.ts) · `HomeStore.TankFish` · `CoolerPanel` | 수조가 `toxin` · `traded`를 들고 다님 · 수조 칸 · 후보 줄 독 아이콘 |

### 공통

- `i18n/en.ts`(새 문구 규칙 · 사전 — 이야기 보상 장비 23종 이름 포함) · `en_cook.ts` · `en_help.ts` · `HelpContent.ts`(할 일 · 내려놓기 · 수조 · 여럿이 · 거치대 · HUD).
- 화구 설치 로그 영어(「Stove 설치 — 연료 55분」처럼 반쯤 남던 기존 누락)도 메웠다.

---

## 4. 구조상 위치

- `스토리 → 목표 판정`(판정 층) — 모으기 목표의 정본이 「주운 횟수」에서 **가방**으로 옮겨 갔다. 장소 도착은 「한 번 본 곳」이 아니라 **기다리는 목표**가 판정한다.
- `인벤토리 → 잃는 경로`(계약 층) — 버리기 · 거래 · 집 보관이 `ItemKeepGuard` 한 곳을 묻는다. 새 맡은 물건은 `QuestItemGuard`에만 더한다.
- `멀티 → 설치물`(계약 + 판정) — 서버가 **같은 칸 판정의 정본**이고 클라이언트는 거절을 되돌린다. 접속마다 세이브를 정본으로 서버를 맞춘다.
- `멀티 → 날씨`(데이터 층) — 공용 추첨에 들어가는 날씨는 **세션 카드**와 **구간화** 두 겹으로 맞춘다.

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 서버 계약 | `scratchpad/r234_server.mjs` | 설치 재시도 ok · 같은 칸 거절 · 종류 다르면 허용 · 내 거치대 겹침 허용 · 남의 거치대 거절 · 나쁜 토큰 · 쓰레기 값 거절 · 대조 `{added 1, removed 1}` · 남의 것 못 건드림 · 상한 64 · 날씨 `val` 먼저 온 사람 · 160자 자름 · 재시작 후 유지 |
| 2인 실렌더 ko/en | `scratchpad/r234mp.cjs` | **B1** 같은 칸 동시 설치 → 승자 1 · 패자는 화구 · 연료 · 냄비 돌려받음 + 「그 자리에는 이미 갑돌이 님의 화구가 있습니다」 · **B2** 세이브에만 있던 통발(5,5) 올라감 · 서버 유령(7,7) 지워짐 · **C** A 실황(비 13.4°C · 바람 6.2) → B 같은 카드 · 둘 다 비 연출 · 홈타운 4슬롯 같음 · 보일링 판정값 0.96 같음 · **D** 독 · 거래품 표지 수조 왕복 유지 |
| 1인 실렌더 ko/en | `scratchpad/r234q.cjs` 12항목 | 오징어 매입 · 상자 보호/되살림/바닥 회수 · 구세이브 M1-02 · **수락 전 지나간 하역 자리가 수락 뒤 잡힘** + 창 열린 채 하역 · 하역 자리 밖 거부 · 자전거 보호/집 보관 거부/되살림/탄 뒤 해제 · 보상 자리 부족 → 완료 거부(「장비 칸 2개」) → 비우면 완료 · 모으기 = 보유 수(버리면 2→1) · 행동 목표 엉뚱한 사건 무시 · 거치대 넘침 발밑 · 귀속 확인 창 · 바닥 맵 구분 — **12/12** |
| pageerror | 위 하네스 4회 | 0 |
| 빌드 | `pnpm run build` · typecheck · core test | 3/3 · 0 오류 · 79/79 |

스크린샷: `scratchpad/r234h/` — `c_B_rain_ko.png`(B 화면 비 + 상태 창 A 카드 값) · `d_tank_ko.png`(수조 칸 독 아이콘) · `b1_B_en.png`(거절 영어 줄) · `q11_confirm_*.png`.

---

## 6. 잔여

- **농사 시간 설계 — 사용자 결정 대기**(아래 요약, 전문은 [`02-SYSTEMS/home-base.md`](../02-SYSTEMS/home-base.md) §5):
  - 사용자 안: 집 텃밭만 실제의 약 3배.
  - 내 추천: 작물 시간 · 계절은 실제 그대로 두고, ① 원래 빠른 작물(콩나물 · 새싹 · 잎 따기 · 베고 다시 자람)로 매일 거둘 거리를 만들고,
    ② 긴 작물은 실제 중간 수확(솎음 · 마늘종 · 고구마순)으로 잇고, ③ 모종 구매 = 육묘 건너뛰기, ④ 빨라지는 건 은신처 **시설**로 번다
    (퇴비 ×1.15 · 하우스 ×1.25 · 수경 랙 ×1.6~2 — 잎채소 상한 ×2 · 철 작물 상한 ×1.4), ⑤ 쓸모 = 직접 기른 꼬리표(요리 별점) ·
    낚시 재료(옥수수 · 압맥) · 마트에 없는 것 · 채소값 출렁임 · 김장/추석.
- **M7-04 「정옥선과 사진을 본다」** 는 사진을 검사하지 않는다 — 이제 사진을 버릴 수 없어 서사는 맞는다. 장면에서 사진을 쓰게 하는 연출은 착수 조건: 해당 장 작업 때.
- **행동 목표 출처 지정** — 이번엔 「방식을 고른 뒤의 사건만」으로 막았다. 목표마다 진짜 출처(`eventOrigins`)를 정하는 작업은 착수 조건: 행동 목표 연출 정비 때.
- 손질 계보 수정은 코드 대조로만 확인(손질 완주 하네스는 돌리지 않음).

---

## 7. 위험 · 부작용

- **모으기 진행이 줄 수 있다** — 233차 세이브에서 목표를 다 채우고 물건을 버린 사람은 진행이 내려간다(드롭으로 다시 채움). 의도된 변화.
- **행동 목표가 더 까다로워졌다** — 제작 · 운반 · 검사 · 현장 계통은 의뢰인에게 **방식을 한 번 골라야** 사건을 센다. 진행 중이던 세이브는 대화창에서 고르면 이어진다.
  대화 · 선택 계통은 장면으로만 오른다(다른 의뢰 수락 · 면허 취득으로 오르던 길은 닫혔다).
- **장소 도착 로그가 줄었다** — 기다리는 목표가 없는 장소에는 「[장소] …에 도착했습니다」가 뜨지 않는다.
- **날씨 카드는 실황을 받은 사람이 있을 때만** — 배포판은 기상청만 실데이터라 그 사람이 정본이 된다. 아무도 실황이 없으면 각자 목업 · 지난 값을 보되,
  공용 추첨은 구간화로 대부분 같은 칸에 떨어진다.
- **보상 자리 확인은 분류별 빈 칸만 센다** — 완료 때 회수되는 퀘스트 물건이 비우는 칸은 계산에 넣지 않는다(드물게 한 칸 더 요구 — 안전한 쪽).

---

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 §3.1
- [x] `02-SYSTEMS/story-quests.md` · `multiplayer.md` · `home-base.md` · `inventory-equipment.md` §4 · §5 · §6
- [x] `04-BACKLOG.md` BI ⑤ 해소 · 농사 결정 대기(D)
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 이어받기 요약 · 배포 줄
