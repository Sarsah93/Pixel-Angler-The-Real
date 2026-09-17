# 145차 — 멀티 세션 세계: 설치물 공유 · 공용 시드 · 외형/활동 · 피어 밀어내기 · 건물 반투명 · 채팅 · 이어하기

> 2026-09-17 · 사용자 지시 7건(143차 §8 "멀티에서 걸리는 것들"에 대한 결정) + 의견 요청 3건
> 빌드 3/3 · typecheck 0 · 2인 실렌더 교차 확인 · pageerror 0

---

## 1. 배경

143차에서 멀티를 세우고 나서, 워크로그 143 §8에 "무엇이 공유되고 무엇이 안 되는가"를 전수로 적었다.
사용자가 그 목록을 하나씩 판단해 돌려준 것이 이번 차수의 입력이다. 원문 요지:

- 1) 진행도가 각자인 것은 **그대로 간다**("서로 진행도나 분기점 등이 다를테니까").
  **다만 통발은 예외** — "설치하는 순간 다른 유저에게도 보이도록 하는 게 좋겠어.
  (서로 안보이면 같은 세션 내 타일, 자원 등을 같이 공유하는 중인데 버그나 충돌이 생길 것 같음)"
- 2) 무작위는 **"같은 서버 세션 내, 공용 시드로 바꾸자"**. 경쟁이 일어나도 감수한다.
  단 예외: "유저 A가 퀘스트를 통해 진입 혹은 발생할 수 있는 리소스들이 … 유저 B가 공유하게 될 경우는
  문제가 생길 수 있으므로, **퀘스트 한정 이벤트나 그런 것들이 걸리는 부분이 있다면 예외 처리할 것**."
- 3) 1인칭·상점에 들어간 사람이 마지막 자리에 서 있는 것은 그대로 두되,
  "낚시 1인칭 SCENE 진입 시, 캐릭터 이름 우측에 낚시중 fabicon 같은 걸 띄우던가."
- 4) 피어 충돌 — 레이어 정렬 + 부드러운 밀어내기(스타듀 방식). **의견 요청.**
- 5) 건물 뒤로 가면 지붕/벽 반투명(30~50%) + 0.2초 트윈. **의견 요청.**
- 6) 이어하기 — 세션 ID화 · 영속 · 재접속 핸드셰이크 · P2P vs 전용 서버. **의견 요청.**
- 7) 착수 순서: 설치물 공유 → 공용 시드 → 외형 동기화 → 채팅 → 서버 권위.

---

## 2. 조사와 판단 (의견 요청 3건)

### 2-1. Y-정렬은 이미 있었다 (4번)

착수 전 실코드를 훑어 **정렬은 이미 매 프레임 돌고 있음**을 확인했다 —
플레이어 `20 + y*0.001`(`RegionFieldScene`), 피어 `20 + peer.y*0.001`,
건물 프리팹 `20 + by*0.001 + 0.0005`, 상점 프리팹 `20 + sy*0.001`, POI NPC `+0.0006`.
그래서 4번에 남은 일은 **밀어내기뿐**이었다(피어에게는 물리 바디가 아예 없었다).

⚖ **결정: 피어에게 바디를 달지 않는다.** 피어 좌표는 1초 폴링이라 스냅샷이 튄다.
정지 바디를 달면 순간이동한 유령에 내가 끼인다. 대신 **내 바디만** 분리 속도를 받는다 —
양쪽이 각자 자기를 밀므로 결과가 대칭이고, 지터에 면역이며, 이동이 막히는 일이 원리적으로 없다.

### 2-2. 건물은 트리거 대신 기하 판정 (5번)

⚖ **결정 ①: 트리거 콜라이더를 새로 달지 않는다.** 건물 몸통은 청크 텍스처에 구워져 있고
그 위에 얹히는 것이 POI 프리팹이다. POI 187곳에 트리거를 다는 대신 **프리팹 배치에 이미 쓰는
사각형**에 발끝을 넣어 본다(새 물리 바디 0개).

⚖ **결정 ②: 페이드 대상은 프리팹·파사드 레이어다.** 구워진 몸통만 알파를 뺄 수는 없다.
파사드 요소는 depth 16이라 애초에 캐릭터(20)를 가리지 않으므로, 실제로 가리는 것은 프리팹 그림뿐이다.

### 2-3. P2P에 동의 (6번)

동의한다. 근거는 **공유 표면이 아주 작다**는 것이다 — 지도·시간·위치·설치물뿐이고 공유 경제·랭킹·거래가 없다.
전용 서버의 존재 이유인 "공유 원장에 대한 권위"가 적용될 대상 자체가 없는데 비용만 영구적이다.

단서 2가지를 워크로그에 남긴다.

1. **P2P는 서버를 없애는 게 아니라 옮기는 것이다.** 호스트가 같은 `@tra/server`를 자기 PC에서 돌린다.
   코드 경로는 그대로고 배포·NAT 이야기만 달라진다. 그래서 이번에 만든 영속은 두 모델 모두에서 돈다.
2. **NAT 통과는 공짜가 아니다.** 브라우저가 남의 공유기 뒤 IP에 평문 HTTP로 붙지 못한다.
   현실 경로는 ① 지금은 LAN·포트포워딩 ② 나중에 얇은 릴레이 ③ Phase 9 Steam 네트워킹.
   로비의 서버 주소 입력칸은 그대로 두고 "전용 서버"는 **배포 선택지**로 취급한다.

저장 소유권이 여기서 깔끔하게 갈린다 — **호스트는 세계(설치물·시드·시간), 각자는 자기 캐릭터.**
1번에서 "진행도는 각자"로 정한 선과 정확히 같다.

---

## 3. 변경

### 3-1. 신설

| 파일 | 무엇 |
|---|---|
| `packages/core/src/types/Multiplayer.ts` (확장) | `MpWorldState` · `MpPlacedTrap` · `MpActivity` · `MpSharedRngKind` · `MpChatLine` · `MpIdentity` · `MpSavedSession` · `MpResume` + `mpWorldSeed`/`mpTimeSlot`/`mpRng`/`isFieldActive` |
| `tools/gen_pixel_icons.py` → `data/PixelIconArt.ts` | 활동 배지 4종 `act_fish`·`act_shop`·`act_home`·`act_away` (10x10) — 아이콘 44 → **48종** |

### 3-2. 수정

| 파일 | 무엇 |
|---|---|
| `packages/server/src/multiplayer/SessionRegistry.ts` | 세션이 **공용 시드·설치 통발·채팅**을 보관 · `userId` 기반 인물 식별 · **디스크 영속**(`MP_SESSION_DIR`, 기본 `.mp-sessions/`) · `leave`는 지우지 않고 `offline` 표시(자리 보존 7일) |
| `packages/server/src/multiplayer/routes.ts` | `POST /mp/trap/place` · `/mp/trap/remove` 신설 · join/name-check가 `userId`·`look` 수용 · presence가 `activity`·`look`·`say`·`chatSince` 수용 |
| `packages/client-pc/src/net/MultiplayerClient.ts` | `userId`(localStorage 영속) · `worldSeed` · `traps`/`peerTraps` · `chatInbox`/`say`/`drainChat` · `resume` · `setLook`/`setActivity` |
| `packages/client-pc/src/scenes/RegionFieldScene.ts` | 피어 외형·활동 배지·흐림 · `applyPeerPush` · `updateOccluders` · `startCompose`/`endCompose` · 이어하기 스폰 · 과증식/교통/날씨 시드 · `feedingAt(atMs)` |
| `packages/client-pc/src/ui/FieldEventManager.ts` | 발생 롤을 **맵 격자 칸 × 시간 슬롯 스케줄**로 재작성 (구: 매 프레임 `Math.random()` + 플레이어 기준 위치) |
| `packages/client-pc/src/ui/NuisanceField.ts` | 표류를 **벽시계** 기준으로 + 배치 시각부터 되감아 재생(`catchUpDrift`) |
| `packages/client-pc/src/ui/RegionHud.ts` | 채팅 입력 목업 → **실입력**(`beginCompose`/`typeCompose`/`commitCompose`/`cancelCompose`) |
| `packages/client-pc/src/scenes/field/TrapFieldSystem.ts` | 남의 통발 부표 렌더 · 설치·회수 시 세션 알림 · 겹침 판정에 남의 통발 포함 |
| `packages/client-pc/src/scenes/MainMenuScene.ts` | LOAD 슬롯 + 멀티 = **이어하기**(`rejoinSession`) |
| `packages/client-pc/src/scenes/CharacterCreateScene.ts` | 입장 시 외형 동봉 |
| `packages/client-pc/src/store/ExternalDataStore.ts` | `rerollHometownWeather(seed?)` |
| `packages/client-pc/src/scenes/TrafficSystem.ts` | 시드 주입 가능(초기 편성 결정적) |

### 3-3. 삭제

| 무엇 | 이유 |
|---|---|
| `RegionFieldScene.hashSeed()` | `mpWorldSeed`가 대체(세션 시드까지 섞는다) |
| `FieldEventManager`의 `spawn`/`findSpot`/`cooldownUntil` | 플레이어 기준 발생을 **맵 앵커 스케줄**로 대체 |
| HUD 채팅 목업 3줄(`안개낀바다: …` 등) | 실채팅이 들어와 자리를 대신한다 |

---

## 4. 구조상 위치

`S24 멀티플레이 → 세션 세계 → 이 작업`.

층으로 보면 네 곳을 동시에 건드렸다.

- **계약**: `core/types/Multiplayer.ts` — 클라이언트·서버가 같이 읽는 유일한 정본.
- **데이터/권위**: 서버 `SessionRegistry` — 시드·통발·채팅·자리를 들고 디스크에 남긴다.
- **판정**: `mpWorldSeed` 기반 순수 함수 — 이벤트·과증식·날씨가 **서버 왕복 없이** 같은 답에 도달한다.
- **렌더**: 필드 씬 — 피어 외형·배지·밀어내기·건물 알파.

---

## 5. 검증

### 5-1. 서버 계약 (`scratchpad/mpapi.mjs`)

| 항목 | 결과 |
|---|---|
| 두 사람 입장 시드 동일 | `2967272332` = `2967272332` ✅ |
| 같은 이름 다른 userId 입장 | `{ok:false, duplicate:true}` ✅ |
| presence 왕복에 `look`·`activity` 보존 | B가 본 A에 `look.sex='m'`, `activity:'field'` ✅ |
| 같은 칸 통발 중복 설치 | 거절 `그 자리에는 이미 통발이 있습니다.` ✅ |
| 남의 통발 회수 | 거절 `남의 통발입니다.` ✅ |
| 채팅 전달 | B가 `돌섬: 여기 갈치 물어요` 수신 ✅ |
| 이어하기(같은 userId) | `resume {gangwon_sokcho, 100, 200}` · 시드 유지 ✅ |

### 5-2. 영속 (서버 프로세스 완전 재시작)

기존 프로세스를 **죽이고** 새로 띄웠다(1차 시도는 포트가 살아 있어 옛 인스턴스가 응답 — 무효였다).

```
[mp] 저장된 세션 1개 복원
재시작 후 세션 조회: playerCount 0 (전원 offline — 설계대로)
이어하기: seed 2967272332 (동일) · resume {gangwon_sokcho, 100, 200}
통발 보존: t1 (ownerName 돌섬)
```

### 5-3. 2인 실렌더 교차 확인 (`scratchpad/mp3.mjs`)

| 항목 | 결과 |
|---|---|
| ① 외형 동기화 | A 본인 시트 `chr_1ck1m1q_2` = **B가 본 A** · B 본인 `chr_1sz1a1j_2` = A가 본 B ✅ |
| ② 소프트 푸시 | 겹침 30px → 2초 후 19px(평형 14px로 수렴) ✅ |
| ③ 활동 배지 | A가 본 B `badge:'act_fish'` · `alpha 0.55` · **밀어내기 대상 0** ✅ |
| ④ 채팅 | B 로그 마지막 줄 `돌섬:여기 갈치 물어요` ✅ |
| ⑤ 피어 통발 | B 설치 → A 화면 부표 1개 · 소유자 `푸른바다` ✅ |
| ⑥ 이벤트 스케줄 | A 계산 = B 계산 **완전 일치**(`schooling:21,6:39769172@16272,5072#39`) ✅ |
| pageerror | A 0 · B 0 ✅ |

### 5-4. 밀어내기·반투명 단위 확인 (`scratchpad/push.mjs`)

| 항목 | 결과 |
|---|---|
| 정확히 겹침(분리 방향 0벡터) | 1초에 **13.98px** 분리 — 평형 14px ✅ |
| 막힌 칸 방어 | 바다 경계 `x=18176` 앞 `18175.7`에서 정지 · 지형 `land` 유지 ✅ |
| 건물 반투명 | 뒤 `alpha 0.38` / 앞 `alpha 1.00` (프리팹 56x74) ✅ |

### 5-5. 채팅 입력 격리 (`scratchpad/chat.mjs`)

| 항목 | 결과 |
|---|---|
| Enter → 입력 열림 | `> _` · `uiBlocked true` ✅ |
| `abc` 타이핑 + 방향키 2회 | `> abc_` · 플레이어 x **16880 불변** ✅ |
| Backspace | `> ab_` ✅ |
| ESC | 입력만 취소 · **일시정지 메뉴 안 열림** · `uiBlocked false` ✅ |
| 전송 | 로그 `이름없는꾼:hi` ✅ |

---

## 6. 잔여

- **7번의 "서버 권위"는 착수하지 않았다.** 이번 차수는 그 앞 네 단계(설치물·시드·외형·채팅)와
  이어하기의 토대까지다. 권위 이전(어획 판정·경제)은 공유 경제가 생기는 시점의 과제다 — 지금은 공유할 원장이 없다.
- **NAT 통과**(P2P 실사용)는 미착수. 지금은 LAN·포트포워딩 전제. 착수 조건 = 릴레이 또는 Steam 네트워킹 결정.
- **교통 차량은 초기 편성만 같다.** 걸음이 프레임 dt로 밀리므로 시간이 지나면 위치가 갈린다.
  좌표를 계속 주고받으면 맞출 수 있지만 **배경 차량에 그만한 대역폭을 쓸 이유가 없다**(게임플레이 영향 0).
- **구워진 건물 몸통은 반투명이 안 된다.** 프리팹·파사드만 페이드한다. 몸통까지 원하면
  캐릭터 실루엣을 위에 덧그리는 별도 작업이 필요하다.
- **이어하기 진입은 "불러오기 슬롯"에서만** 된다. 로비에 "이 방에 이어서 들어가기" 전용 버튼은 없다.

---

## 7. 위험·부작용

- ⚠ **이름이 7일간 잠긴다.** 접속을 끊어도 자리를 남기므로(이어하기) 그 이름을 다른 `userId`가 쓸 수 없다.
  `OFFLINE_KEEP_MS`(7일)가 지나면 풀린다. 같은 사람이면 `userId`가 같으므로 문제되지 않는다.
- ⚠ **`userId`는 브라우저 localStorage에 있다.** 브라우저를 바꾸거나 저장소를 지우면 **다른 사람**이 된다
  (이어하기 실패 + 이름 중복). 계정 개념이 생기면 그쪽으로 옮겨야 한다.
- ⚠ **필드 이벤트의 발생 확률은 피딩 활성도를 본다.** 피딩은 물때·계절·**날씨**로 계산되는데,
  실지역 날씨는 각자 API에서 받는다. 두 사람의 캐시가 다르면 스케줄이 갈릴 수 있다
  (홈타운은 이번에 시드로 묶었다). 실측에서는 갈리지 않았다.
- ⚠ **과증식 배치가 6시간마다 새로 굴러간다**(구: 맵 해시 고정). 되감기 상한이 여기서 나온다.
- ⚠ 채팅 입력 중에는 **Phaser 키보드가 통째로 꺼진다.** 씬을 떠날 때 `endCompose()`가 반드시 돌아야
  키보드가 다시 켜진다 — `shutdown`에 걸어 두었다.

---

## 8. 함정 (새로 발견)

### 8-1. Phaser는 `stopPropagation`으로 막히지 않는다

일반 `keydown` 리스너에서 삼키고 `ev.stopPropagation()`을 불러도, Phaser는 **같은 DOM 이벤트로
`keydown-B`·`keydown-ESC` 같은 조합 이벤트를 따로 emit**한다.
실측: 채팅에 `b`를 치면 **쿨러 창이 열렸다**(`uiBlocked`가 true로 남아 발견).
→ 입력 중에는 `input.keyboard.enabled = false`로 플러그인을 끄고 window에서 직접 받는다.

### 8-2. 시드만 맞춰도 "플레이어 기준 위치"면 소용없다

구 `FieldEventManager`는 발생 지점을 **플레이어 좌표 ±26타일**에서 골랐다.
시드를 아무리 공유해도 두 사람의 기준점이 다르면 다른 자리가 나온다.
→ 이벤트를 **맵 격자 칸의 성질**로 바꿔야 비로소 같은 것이 보인다.

### 8-3. 분리 벡터가 0이 되는 경우

두 사람이 정확히 같은 좌표면 `(dx, dy) = (0, 0)`이라 밀어내기가 **영영 동작하지 않는다**.
`d < 0.001`이면 `playerId` 비교로 서로 반대 방향을 고르게 해야 한다(양쪽이 자기를 미므로 대칭).

### 8-4. 상점은 씬을 멈추지 않는다

1인칭·실내는 `scene.pause`라 `syncPeers`가 아예 안 돌고 `setActivity`가 그대로 남는다.
**상점은 팝업**이라 매 프레임 `reportPosition`이 활동을 덮어쓴다 → 활동을 그 자리에서 파생시켜야 한다.

### 8-5. 서버 "재시작" 검증은 포트를 확인할 것

옛 프로세스가 살아 있으면 새 인스턴스가 `EADDRINUSE`로 죽고 **옛 메모리가 응답**한다.
`[mp] 저장된 세션 N개 복원` 로그만 보고 통과시키면 영속을 검증한 것이 아니다.

---

## 9. 후속 반영

- [x] 워크로그 (이 문서)
- [x] `03-WORKLOG/README.md` 인덱스
- [x] `02-SYSTEMS/multiplayer.md`(S24) 갱신
- [x] `04-BACKLOG.md`
- [x] `.agents/AGENTS.md` §9 · `.agents/IMPLEMENTATION_PLAN.md` · `CLAUDE.md` · `README.md`
