# 232차 — 거래 자동 저장 · 서버 인증 · 채집 / 과증식 공유

| | |
|---|---|
| **날짜** | 2026-10-07 |
| **시스템** | `멀티플레이` `세이브` `해루질(채집)` `과증식` |
| **트리거** | 231차 전수조사 결과에 대한 사용자 결정 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 테스트 79/79 |

---

## 1. 배경 — 왜 했나

사용자 원문:

> 거래 끝나면 자동 저장으로 하고, 제안한 순서대로 진행해줘.

231차 제안 순서 = ① 거래 복제(치명) → ② 서버 인증(높음) → ③ 채집 · 과증식 공유(높음).

---

## 2. 원인 (231차 감사 — 코드 대조로 확정)

1. **거래 복제** — `applyTrade`가 서버 · localStorage에 「적용함」을 먼저 남기고 인벤토리는 메모리만 바꿨다.
   저장은 침대에서만 되므로 준 쪽이 저장 없이 끄면 세이브에 물건이 남았다(서버 기록은 이미 지워짐).
   같은 함수가 `removeQty` · `addCoins(-x)` 실패(모자람)를 무시해 상대는 그대로 받았다.
2. **사칭** — 변경 요청의 자격이 `playerId` 하나였는데 `peers`로 전원에게 공개됐다.
   통발 `ownerId` · 거래 `from/to.userId`로 남의 **재접속 열쇠**까지 내려갔다(그걸로 join하면 남의 자리를 이어받는다).
3. **채집 · 과증식 비공유** — 소비 기록(`GONE`)이 각자 클라이언트에만 있었다.
   채집 스팟은 면허 유무로 추첨 풀이 갈려 **같은 칸에 서로 다른 생물**이 떴다.
   과증식은 수거가 로컬이고, 재입장하면 같은 시드로 전부 되살아났다(싱글도 무한 수거).

---

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`client/store/GameState.ts`](../../../packages/client-pc/src/store/GameState.ts) | 세이브 필드 `mpAppliedTrades`(최근 50) · `commitTradeApplied()` = 적용 기록 + **즉시 `saveToSlot`**(침대 정책의 유일한 예외) · `hasAppliedTrade()` |
| 수정 | [`client/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `applyTrade` — 있는 만큼만 내고(모자람 경고) → 받고 → **저장한 뒤** 서버에 「적용함」. 세이브에 기록이 있으면 서버에만 알린다 · 과증식 `isTaken`/`onTaken` · 월 KST |
| 수정 | [`server/multiplayer/SessionRegistry.ts`](../../../packages/server/src/multiplayer/SessionRegistry.ts) | join이 **비밀값 `token`**(128비트) 발급 · `authed()`로 presence · 거래 · 통발 · 나가기 · retire · take 전부 대조 · 남의 `userId`를 통발 · 거래 응답에서 지움 · 채팅 제어 문자 제거 · `takeWorld` + presence `taken` 증분 |
| 수정 | [`server/multiplayer/routes.ts`](../../../packages/server/src/multiplayer/routes.ts) | 모든 변경 요청이 `token` 전달 · 신설 `POST /mp/world/take` |
| 수정 | [`core/types/Multiplayer.ts`](../../../packages/core/src/types/Multiplayer.ts) · `index.ts` | `MpJoinRes.token` · `MpPresenceRes.taken` · `MpTakenLine` · `MP_TAKEN_KEEP/TTL_MS/KEY_MAX` |
| 수정 | [`client/net/MultiplayerClient.ts`](../../../packages/client-pc/src/net/MultiplayerClient.ts) | 비밀값 보관 · 전송 · `isWorldTaken()` · `takeWorld()`(먼저 닿은 사람이 임자) · `takenSince` 증분 수신 |
| 수정 | [`client/scenes/field/ForageSystem.ts`](../../../packages/client-pc/src/scenes/field/ForageSystem.ts) | 면허를 추첨에서 빼고 표시 단계에서 거름 · 월/일 KST · 손대는 순간 선점(늦으면 「다른 사람이 먼저 …」) · 놓침 · 숨음도 공유 · 0.5초마다 남이 가져간 스팟 걷기 |
| 수정 | [`client/ui/NuisanceField.ts`](../../../packages/client-pc/src/ui/NuisanceField.ts) | 개체 키 `시드|배치 순번` · 모듈 전역 `GONE`(재입장 리스폰 차단 — 싱글 포함) · 남이 거둔 개체 걷기(끌던 중이면 놓침 로그) |
| 수정 | [`client/i18n/en.ts`](../../../packages/client-pc/src/i18n/en.ts) | 새 문구 4건 |

---

## 4. 구조상 위치

- `멀티플레이 → 거래 공증 → 적용` (판정 + 세이브 층) — 「적용 기록 = 세이브 안」으로 원자성을 세이브 한 번의 쓰기에 맡겼다.
- `멀티플레이 → 세션 → 본인 확인` (계약 + 서버) — 공개 id(`playerId`)와 비밀값(`token`) · 재접속 열쇠(`userId`)를 분리했다.
- `멀티플레이 → 공유 세계` (신규 채널) — 「같은 시드로 모두에게 같은 자리에 뜨는 것」의 소비만 공유한다. 서버는 키의 뜻을 모른다.

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 인증 · 가리기 | `scratchpad/r232_server.mjs` | 비밀값 없이 / 틀리게 presence 거부 · 남의 `playerId`로 통발 회수 · 거래 제안 거부 · B에게 A 통발 `ownerId` "" · 거래 상대 `userId` "" · 채팅 `\n` → 공백 · 틀린 비밀값 retire 무효 |
| 소비 채널 | `scratchpad/r232_take.mjs` | 먼저 알린 A `ok` · 같은 키 B `already` · 비밀값 없으면 거부 · 증분 since 0/1 · 키 96자 절단 |
| 2인 실렌더 | `scratchpad/r232.cjs`(두 브라우저 컨텍스트 + 로컬 서버) ko/en | 채집 스팟 105개 **완전 동일** · A가 가져가면 B 화면에서 사라짐 · B 같은 키 선점 `false` · 과증식 12/15개 동일 · A 수거 → B에서 사라짐 · A 재배치해도 안 살아남 |
| 거래 자동 저장 | 같은 하네스 — A가 1,000원을 B에게 | A 50,000 → 49,000 · B 51,000 · **양쪽 슬롯 세이브에 같은 돈 + 적용 id** · 미저장 표시 해제 |
| 231 회귀 | `r231.cjs` | 파산 퇴장 · 이름 해제 · 다시 시작 정상(구경꾼 스크립트는 비밀값 없어 거부 = 기대값) |
| ko/en | 두 번 | pageerror 0 |
| 빌드 | `pnpm run build` · typecheck · core test | 3/3 · 0 오류 · 79/79 |

---

## 6. 잔여

- **달아나는 생물의 움직임**은 여전히 사람마다 다르다(`Math.random` · 내 캐릭터에만 놀람). 잡히면 모두에게서 사라지는 것까지가 이번 범위.
- 거래로 규칙 우회(채집물 유통 · `earn` 잔액 목표 · 포화) · 설치물 재동기화 · 날씨 스냅샷 · 수조 독소 세탁 — 백로그 BI ④⑤.
- 소비 기록은 서버 메모리에만 있다 — 서버를 다시 켜면 길어야 한 슬롯(채집 1시간 · 과증식 6시간) 동안 이미 가져간 것이 다시 보인다.

---

## 7. 위험 · 부작용

- **거래 직후 저장은 그 순간 전체 상태를 저장한다** — 침대 밖 저장 지점이 생긴다(사용자 결정). 위치는 세이브에 없어 늘 집에서 시작하는 규칙은 그대로.
- **면허 없는 사람은 채집 스팟이 조금 적게 보인다** — 상급 허가 생물이 같은 표에서 자리를 차지하고 숨겨지기 때문. 싱글도 같다.
- 서버를 새로 켜면 저장된 자리에는 비밀값이 없다 → 모두 join을 다시 해야 한다(이어하기가 그 경로라 실사용 영향 없음).
- 옛 클라이언트(비밀값을 안 보내는 빌드)는 새 서버와 통신이 막힌다 — 같은 빌드끼리만 접속한다.

---

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 §3.1
- [x] `02-SYSTEMS/multiplayer.md` §4 · §5 · §6 · `02-SYSTEMS/night-hunting-trap.md` §5
- [x] `04-BACKLOG.md` BI ①②③ 해소
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 이어받기 요약
