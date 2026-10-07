# 233차 — 채집 재생 1~2일 · 채집 중 잠금 · 퀘스트 「직접 마련」 · 개인 퀘스트 물건

| | |
|---|---|
| **날짜** | 2026-10-07 |
| **시스템** | `해루질(채집)` `멀티플레이` `스토리 · 퀘스트` `세이브` |
| **트리거** | 232차 잔여에 대한 사용자 질문 · 지시 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 테스트 79/79 |

---

## 1. 배경 — 왜 했나

사용자 원문(요약 없이 핵심 문장):

> 해루질, 채집 관련해서 하루~이틀 뒤 리스폰되는 것도 고려했을까?
>
> 잡기 위해 미니게임 진입 시에는 다른 플레이어 B가 상호작용(플레이어A와 진입 중인 채집 대상 둘 모두에게 채집중으로 인해 되지 않도록) 하는 걸 막아야할 것 같은데?
>
> 거래로 채집물 넘기는 것은 가능하나, 퀘스트 관련해서 난이도 부여 … 부분적으로 거래를 통해 얻은 것으로 제출해도 되는 퀘스트와 그렇지 않은 퀘스트(멀티여도 유저 각각 개인에게만 보여지거나 얻어지는 전용 퀘스트 아이템을 조건부 및 확률로 반영) 등으로 조정 및 배치할 것.
> 빌린 돈으로 채우는 것은 가능하도록 해주는 것이 좋을 듯.

그 뒤 남은 3건(설치물 재동기화 · 날씨 맞추기 · 수조 독소)은 **추천안만** 요청 — 이번 차수는 구현하지 않았다(§6).

---

## 2. 원인 (232차까지의 상태 — 코드 대조)

1. **재생 주기 = 시간 슬롯(1시간)** — 고갈 기록(`GONE`)이 모듈 전역이라 게임을 끄면 사라졌고,
   키가 `시드|스팟`이라 다음 슬롯에는 같은 자리에 새 생물이 떴다. 「1~2일 뒤」 개념이 없었다.
2. **선점만 있고 잠금이 없었다** — A가 놀이를 여는 순간 `takeWorld`로 선점은 했지만, 그 표시는 「가져감」이라
   B 화면에서 스팟이 바로 사라졌다(누가 무엇을 하는지 모름). A가 놓치면 B에게 다시 보일 방법도 없었다.
   A 자신도 「채집 중」 활동이 없어 거래 제안을 받을 수 있었다.
3. **퀘스트는 출처를 몰랐다** — 손질 · 회 · 요리 · 위판 이벤트에 「거래로 받은 것」 표지가 없었다.
4. **`earn`(돈 모으기)** — 거래로 받은 돈은 `addCoins(…, quiet)`라 `coins` 이벤트가 안 나서 목표가 그 자리에서 갱신되지 않았다
   (잔액 기준이라 다음 사건에서야 따라붙음).

---

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`client/store/WorldDepletionStore.ts`](../../../packages/client-pc/src/store/WorldDepletionStore.ts) | 키 → 다시 나타나는 시각. **세이브 필드 `worldDepleted`**(지난 것은 저장 때 버림) |
| 수정 | [`client/scenes/field/ForageSystem.ts`](../../../packages/client-pc/src/scenes/field/ForageSystem.ts) | 키 = **타일 기준** `f:맵|스팟` · 잡음 = 24~48h · 놓침/숨음 = 슬롯 끝 · 놀이 여는 순간 **잠금**(`busy` 2분) · 남이 잠근 스팟은 반투명 + 「○○ 님이 채집 중이다」 + [F] 거부 · `isPlaying` · 이기면 퀘스트 드롭 굴림 |
| 수정 | [`core/config/tuning.ts`](../../../packages/core/src/config/tuning.ts) | `forage.depleteMinHours 24` · `depleteMaxHours 48` |
| 수정 | [`core/types/Multiplayer.ts`](../../../packages/core/src/types/Multiplayer.ts) | `MpTakenLine.busy/by` · TTL 하한 10초 · 상한 50시간 · `MpActivity 'foraging'`(「채집 중」) · 세션 저장 `taken` |
| 수정 | [`server/multiplayer/SessionRegistry.ts`](../../../packages/server/src/multiplayer/SessionRegistry.ts) · `routes.ts` | `takeWorld(key, {ttlMs, busy, release})` — 주인만 갱신 · 해제 · 만료분은 막지 않음 · 잠금은 디스크에 안 남기고 고갈만 세션 JSON에 남김 |
| 수정 | [`client/net/MultiplayerClient.ts`](../../../packages/client-pc/src/net/MultiplayerClient.ts) | `worldTakenInfo()`(잠금 · 누가) · `takeWorld()` 결과 `{mine, busy, by}` |
| 수정 | [`client/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 활동 파생식에 `foraging`(이름표 배지 `act_forage`) — 서버가 거래 제안을 「바쁩니다」로 거절 · 과증식 키도 고갈 기록 경유 · 위판 정산 `traded` · **거래로 받은 돈 = 일반 수입**(`coins` 이벤트) |
| 수정 | [`client/ui/NuisanceField.ts`](../../../packages/client-pc/src/ui/NuisanceField.ts) | 모듈 `GONE` 제거 → 주입(`isTaken/onTaken`) |
| 수정 | `InventoryStore` · `ButcheryPanel` · `SashimiPanel` · `CookingStore` · `ConsignSettle` · `GameState.addActivityXp` | **출처 꼬리표** — 거래로 받은 원물로 만든 손질감 · 회 · 요리 · 위판에 `traded` 전파(`setTradedLineage`) |
| 수정 | [`core/types/Story.ts`](../../../packages/core/src/types/Story.ts) | 목표 `collect`(퀘스트 물건 모으기) · `ownOnly`(직접 마련한 것만) |
| 신설 | [`core/db-schema/QuestItemDrops.ts`](../../../packages/core/src/db-schema/QuestItemDrops.ts) | 퀘스트 물건 4종 · 드롭 표 4건(N13-2 태안 30% · N18-5 제주 50% · N02-5 속초 40% · N22-3 포항 50%) · 까다로운 퀘 10건 |
| 수정 | [`core/db-schema/StoryQuestDatabase.ts`](../../../packages/core/src/db-schema/StoryQuestDatabase.ts) | 4건에 `collect` 목표 · 10건 손질/회/요리/위판 목표에 `ownOnly` + 라벨 「(직접 마련한 것만)」 · 검증기(드롭 없는 `collect` 금지) |
| 수정 | [`core/rules/QuestDifficulty.ts`](../../../packages/core/src/rules/QuestDifficulty.ts) | `collect` 가중 3 · `ownOnly` 조건 깊이 +1 → 분포 가벼움 23 · 보통 112 · 어려움 47 · 매우 4 |
| 수정 | [`client/store/StoryStore.ts`](../../../packages/client-pc/src/store/StoryStore.ts) | `rollQuestDrops()`(내 클라이언트 · 내 운) · `ownOnly`면 `traded` 사건 거부 + 안내 · 완료 때 퀘스트 물건 회수 |
| 수정 | `GameState` · `ItemDetailPanel` · `I18n` · `en.ts` · `en_help.ts` · `HelpContent.ts` | 귀속 지급/회수 호스트 · 상세보기 · 영문 · 도움말 3곳 · 스토리 월 KST |
| 수정 | `tools/gen_pixel_icons.py` → `PixelIconArt.ts` | `act_forage`(활동 배지) · `qi_sample` · `qi_stone` |

---

## 4. 구조상 위치

- `해루질 → 스팟 수명` (판정 + 세이브 층) — 고갈의 정본은 **세이브**(혼자)와 **서버 세션 JSON**(여럿) 두 곳. 키가 같아 합쳐 본다.
- `멀티 → 공유 소비 채널` (계약) — 232의 「가져감」에 **잠금(busy)** 을 얹었다. 같은 키를 주인이 잠금 → 확정 · 해제로 다시 쓴다.
- `스토리 → 목표 판정` (데이터 + 판정) — 사건에 **출처**(`traded`)를 실었다. 퀘스트 데이터의 `ownOnly`가 판정을 고른다.
  개인 물건은 서버를 거치지 않는다(공유할 원장이 없다 — 남 화면에 보일 이유가 없음).

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 서버 소비 채널 | `scratchpad/r233_take.mjs` | A 잠금 ok · B 같은 키 `busy, by 갑` · A 확정 36h → B에게 `busy false` · B 해제 시도 거부(주인 유지) · A 해제 후 B 선점 ok · TTL 999h → **50h** · 서버 재생성 후 고갈 3건 복원 · 잠금만 있던 키는 버림 |
| 2인 실렌더 ko/en | `scratchpad/r233.cjs`(두 브라우저 + 로컬 서버) | A [F] → `isPlaying` · B: 스팟 보임 + `busyBy 갑돌이` + [F] 거부 문구 · B가 본 A 활동 `foraging` · B→A 거래 제안 「대상자가 바쁩니다」 |
| 고갈 1~2일 | 같은 하네스 — A 이김 | 세이브 `worldDepleted["f:sokcho_v2|fs_581_71"]` = **42h** 뒤 · B 화면에서 사라짐 · A 강제 재추첨해도 그 자리 비어 있음 |
| 퀘스트 물건 | N02-5 활성 · rng 고정 | 속초 2번 = 2개(귀속 · 거래 거부) · 확률 실패 0 · 제주 0 · 다 모은 뒤 0 · 완료하면 가방에서 **0개**(회수) · 상세보기 「부탁받은 일에 쓸 물건」 |
| 직접 마련 | N09-2 손질 목표 | 거래품 손질 → 0 · 내 것 → 1 |
| 빌린 돈 | B에 M4-01 · A가 1,000원 | B 잔액 51,000 = 목표 51,000(즉시) |
| ko/en | 두 번 | pageerror 0 |
| 빌드 | `pnpm run build` · typecheck · core test | 3/3 · 0 오류 · 79/79 |

---

## 6. 잔여

- **달아나는 생물의 움직임**은 여전히 사람마다 다르다 — 이번 잠금으로 「둘이 같은 녀석을 쫓는」 경우는 사라졌다(손대는 순간 잠김).
- **퀘스트 물건을 버리면 진행은 남는다** — 목표 진행은 「찾은 횟수」로 세고, 완료 때 가진 만큼만 회수한다. 착수 조건: 버리기 막기 요청 시.
- **낚시 드롭(`catch`)** 은 표만 열어 두었다(지금 드롭 4건은 전부 채집).
- 아래 3건은 **추천안만** — 사용자 선택 후 착수(백로그 BI ⑤):
  - 설치물 재동기화 — 접속 · 재접속 때 내 설치물 목록 대조 + 거절 응답이면 되돌리기.
  - 날씨 맞추기 — 시간 슬롯마다 먼저 받은 사람의 날씨를 세션 정본으로(공유 소비 채널 재사용) + 입력 구간화.
  - 수조 독소 — 수조 개체가 원래 아이템 표지(`toxin` · `sex` 등)를 그대로 들고 다니게.

---

## 7. 위험 · 부작용

- **세이브 크기** — `worldDepleted`는 기한이 지난 키를 저장 때 버린다. 하루 수십 건 수준이라 무시할 만하다.
- **잠금 2분** — 놀이가 2분을 넘기면 잠금이 풀린다(지금 놀이는 수십 초). 튕긴 사람의 잠금도 최대 2분 남는다.
- **추적 깊이 한 단계** — 거래로 받은 원물 → 손질감까지만 꼬리표가 붙는다. 손질감을 다시 거래하면 받은 쪽에 새로 붙는다.
  거래품과 내 것이 같은 칸에 합쳐지면 칸 전체가 거래품이 된다(보수적).
- **서버 재시작** — 고갈은 남지만 잠금은 사라진다(2분짜리라 영향 없음).

---

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 §3.1
- [x] `02-SYSTEMS/multiplayer.md` §4 · §5 · §6 · `02-SYSTEMS/night-hunting-trap.md` §5
- [x] `04-BACKLOG.md` BI ④ 해소 · ⑤ 추천안 링크
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 이어받기 요약
