# 296차 — 집 앞 우편함(유찰품 · 받지 못한 물건의 길) · 하모니 PR #16 · #17 병합 · main 반영 · 99차 배포

| | |
|---|---|
| **날짜** | 2026-11-02 |
| **시스템** | `홈` `필드` `경제(위판)` `인벤` `통발` `불요리` `UI` `가이드` `세이브` `하모니` `배포` |
| **트리거** | 하모니 일일 점검(2026-11-02 · ① 아이템 · 재화 배선)의 「사용자 결정이 필요한 것」에 대한 사용자 결정 |
| **커밋** | `35c59b9`(코드 · 문서) · 배포 기록은 다음 커밋 |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 475 |

---

## 1. 배경 — 왜 했나

하모니 점검이 F-0048(위판 「찾아오기」로 물건 소실 — PR #17)을 고치면서 자동 경로를 물었다.
「회차 정산에서 유찰품이 돌아오는 자동 경로(`settleDueConsignments`)도 가방이 차면 같은 식으로 사라질 수 있습니다. … 바닥에 두는지 대기열에 남기는지 정해 주세요.」

사용자 결정(원문): 「집 앞에 '우편함' 그래픽(탑다운 타일뷰에서) 추가하고, 상호작용 가능하도록 할 것.
상호작용 '우편함 열기(F)'을 통해, 팝업되는 메일함에서 첨부파일로 유찰 아이템 및 거래 과정에서 가방이 가득차 대기열로 빠져야하는 물건들 등
유실 경로를 우편함(메일함)으로 다루면 될 것 같아. … 좋은 아이디어라고 생각되면 착수/반영 후 main 재배포까지 해줘. 그리고, PR 16과 17은 너가 검토하고 알아서 잘 반영해줘.」

판단: 좋은 설계다 — 「받지 못한 물건이 가는 곳」이 세상 안의 한 자리로 모이고(장르 관용 — 농장 · 생활 게임의 우편함), 조용히 사라지는 길이 없어진다.
뒤에 올 편지(축제 안내 · 인물 편지)의 자리도 된다.

## 2. 원인 — 무엇이 문제였나

- `ConsignSettle.returnItems`가 `addItem` 반환값을 보지 않았다 — 가방이 가득하면 유찰품이 사라졌다(하모니 F-0048 자동 경로). 어디에 있든 가방에 바로 넣는 것도 위판장이 「돌려보낸다」는 그림과 맞지 않았다.
- 같은 모양(F-0009): 걷은 통발 되살리기(`TrapFieldSystem.returnTrapItem`) · 화구 회수(`CookingStore.recover`)가 `recoverPlaceable` 실패를 무시했다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`client/store/MailboxStore.ts`](../../../packages/client-pc/src/store/MailboxStore.ts) | 편지(보낸 곳 · 제목 · 본문 · 첨부 · 읽음 · 알림) · 세이브 `mailbox` · `flagUp`(안 읽음 또는 첨부 남음) · dev `__MAIL` |
| 신설 | [`client/store/MailDeliver.ts`](../../../packages/client-pc/src/store/MailDeliver.ts) | `mailUnsold · mailConsignFailed`(위판장이 돌려보낸다) · `addItemOrMail`(가방 → 안 되면 우편함) · `takeMail · takeAllMail`(들어간 것만 떼고 신선도는 든 동안 멈춤) · `deleteMail` |
| 수정 | `client/store/ConsignSettle.ts` | 유찰 · 회차 실패 반환 → **언제나 집 우편함**(보고서에 `mailed`) — 경매 전 찾아오기(PR #17 자리 확인)는 그대로 가방 |
| 수정 | `client/scenes/field/TrapFieldSystem.ts` · `store/CookingStore.ts` · `store/InventoryStore.ts` | 걷은 통발은 `addItemOrMail` · 화구 회수는 `canRecoverPlaceable`로 먼저 거부(스토브) · 용기는 우편함 |
| 수정 | [`core/types/HomeBase.ts`](../../../packages/core/src/types/HomeBase.ts) | `MapObjectType · MapObjectInteract` + `mailbox` · `HOMETOWN_OBJECTS` `mailbox_1`(24, 10 — 문 앞 길 오른쪽 · 벽 띠 아래 두 칸) |
| 수정 | `client/scenes/RegionFieldScene.ts` | 코드 그림(기둥 · 빨간 상자 · 투입구 · 이름판 20×32 · 깃발 10×14) · 이름표 「우편함」 · `[F] 우편함 열기` · `refreshMailMark`(깃발 · 머리 위 느낌표 · 미니맵 「우편함」) · `openMailbox` |
| 신설 | [`client/ui/MailboxPanel.ts`](../../../packages/client-pc/src/ui/MailboxPanel.ts) | 목록(최신 앞 · 안 읽음 점 · 「물건 N」 칩 · 휠) + 고른 편지(본문 · 첨부 그림 · 「받기」/「지우기」 · 「모두 받기」) · 가이드 `mailbox` 3단계 |
| 수정 | `client/ui/MillNotifier.ts` | 편지가 오면 같은 길로 알린다 — 채널 `[우편]` · 손목시계 알람 · `notified` |
| 수정 | `client/store/GameState.ts` | 세이브 `mailbox` 직렬화 · 복원(구세이브 = 빈 우편함) · 새 게임 초기화 |
| 수정 | `client/data/HelpContent.ts` · `i18n/en_mail.ts`(신설) · `en.ts` · `ConsignListPanel.ts` · `HomeInteriorScene.ts` | 도움말 「상점 · 경제 › 우편함」 · 영문 · 「안 팔린 것은 집 우편함으로」 문구 |
| 수정 | `client/dev/DevConsolePanel.ts` | ③-2 우편함 시험 편지(물건 2) · 비우기 |
| 병합 | 하모니 PR #16(`bd5ad9e`) · #17(`56f5a57`) | 가이드 허브 팁 줄 이모지 → 「팁 — 」 · 찾아오기 자리 확인(`consignRetrieveBlock`) — squash 병합 뒤 `origin/main`을 작업 브랜치에 merge |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S12 홈 → 집 앞 설치물(우편함)` · `S10 경제 → 위판 정산 반환 경로` · `S9 통발 · S6 불요리 → 회수 반환 경로`.
계약(`MapObjectType` · 세이브 `mailbox`) + 데이터(홈타운 오브젝트) + 판정(`addItemOrMail` · `takeMail`) + 렌더(그림 · 깃발 · 창 · 알림).

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 실렌더 r296 | Playwright 13항목(scratchpad `r296.cjs`) — 새 게임 → 집 안 프롤로그를 문 매트처럼 나와 홈타운 필드 | 오브젝트(24,10) · 그림 3 · 깃발 숨김 → 편지 1통에 깃발 · 느낌표 · 5초 펌프 `[우편]` 채널 · `[F] 우편함 열기` · 창 · 받기(가방 2종) · 지우기(깃발 내림) · 가방 가득(첨부 남음 · 사유 줄) · 위판 회차 실패 → 편지(consign · 속초 위판장 · 대기열 0) · 세이브 `mailbox` 키 왕복 · 영어 · pageerror 0 |
| 그림 | 확대 3배 스크린샷 | 빨간 상자 · 기둥 · 깃발 · 「우편함」 이름표 · 느낌표가 벽 띠에 가리지 않는다(처음 (24, 8)은 벽 띠와 겹쳐 옮겼다) |
| 위판 유찰 길 | `ConsignSettle` 코드 · `mailUnsold` | 유찰품 · 회차 실패 반환이 우편함으로(가방 가득과 무관) |
| core · 빌드 | vitest · build · 루트 typecheck | 475 · 3/3 · 4/4 |

재현 절차: dev F10 「③-2 우편함 시험 편지」 → 홈타운 집 앞 우편함 깃발 · 느낌표 → [F] → 받기 · 지우기.

## 6. 잔여 — 이번에 안 한 것

- **위판 홀 현장 경매의 유찰**은 물건이 가방을 떠나지 않으므로(현장) 우편함과 무관하다 — 도움말 그대로.
- **이야기 보상이 가방에 안 들어갈 때**는 234차대로 완료를 막는다(사람 앞에서 받는 것) — 우편함으로 돌리지 않았다.
- `QuestItemGuard`가 되살리는 맡은 물건(얼음 상자 · 자전거)은 가방이 가득하면 다음 점검까지 미뤄진다 — 우편함 후보(하모니 F-0009 셋째).
- 통발 포획물이 쿨러 · 가방 모두 가득할 때는 **방류**(기존 설계)다 — 우편함으로 보내지 않았다(살아 있는 것은 우편으로 못 보낸다).
- 우편함은 홈타운 집 앞 하나다 — 다른 지역에 집이 생기면 그 집 앞에도(지역 텃밭 설계와 함께).
- 편지 수 상한 없음 — 첨부가 든 편지는 지울 수 없어 쌓이지 않는다.

## 7. 위험·부작용

- 유찰품이 가방으로 바로 오지 않는다 — 플레이어는 집에 가서 받는다(사용자 결정). 채널 · 집 안 알림 문구를 「집 우편함으로」로 바꿨다.
- 첨부의 `conditionSinceMs`는 받을 때 든 시간만큼 뒤로 민다 — 꺼 둔 시간도 포함(완전 정지).
- 옛 세이브에는 `mailbox` 키가 없다 — 빈 우편함. 홈타운 오브젝트는 초기 목록에 더했으므로 옛 세이브에도 선다(`removedIds`에 없다).
- 하네스 함정: 새 게임은 집 안 프롤로그로 들어간다 — 필드를 보려면 `HomeInteriorScene`을 stop하고 필드를 resume한다. 홈타운은 `TR = 20`(심리스 32 아님).

## 8. 후속 반영

- [x] 시스템 페이지 [`home-base.md`](../02-SYSTEMS/home-base.md) · [`economy-data.md`](../02-SYSTEMS/economy-data.md) · [`inventory-equipment.md`](../02-SYSTEMS/inventory-equipment.md) ·
  [`night-hunting-trap.md`](../02-SYSTEMS/night-hunting-trap.md)
- [x] `04-BACKLOG.md`(DF 신설) · `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 아티팩트 4개 — 판은 아래 「발행」 줄
- [x] 발행 — 남은 과업 설계 https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 **Version 40** · 구현 라이브러리 https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 **Version 40** ·
  채비 모딩 순서도 https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 **Version 38**(「296차 기준」 줄만) · 위키 https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c **Version 93**
  (시스템 「집 앞 우편함」 · 「섬 어종 다섯 · 명산지 꼬리표 · 산지 매대 · 가공장 · 지역 레시피」 · 새 그림 3을 `files`로 · 파일 456)
- [x] main 빨리 감기(`56f5a57` → `35c59b9`) · **99차 배포(gh-pages `eeb1fe9` · 실행 28 · main `35c59b9` · 정적 2,157 · 소스맵 0 · 기동 15.0초 · 4xx 0(바깥 1 = KAMIS) · pageerror 0)** — 워크플로가 매긴 번호는 99차(98차 `5806b7e` 다음). 라이브 주소는 컨테이너에서 닿지 않아 gh-pages를 로컬로 띄워 점검(scratchpad `deploy296.cjs`).
