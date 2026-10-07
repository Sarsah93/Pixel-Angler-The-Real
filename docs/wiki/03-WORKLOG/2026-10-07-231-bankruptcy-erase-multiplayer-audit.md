# 231차 — 파산 = 세이브 삭제 · 멀티 퇴장 · 멀티플레이 전수조사

| | |
|---|---|
| **날짜** | 2026-10-07 |
| **시스템** | `세이브` `멀티플레이` `해루질(법)` |
| **트리거** | 사용자 지시 — 파산을 되돌릴 수 없게 + 멀티 고려 + 멀티 전수조사 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 테스트 79/79 |

---

## 1. 배경 — 왜 했나

사용자 원문:

> 파산하면 저장 파일도 지워서 되돌릴 수 없게 해줘. 이 경우 멀티플레이도 고려해야 할 것 같은데?
> 다른 부분들도 멀티플레이 시, 고려해야 할 사항들은 없을 지 전수조사해보자.

229차 파산 엔딩은 세이브를 지우지 않았다. 저장은 침대에서만 되므로 「타이틀로」 → 「이어하기」,
또는 탭 닫기만으로 마지막 침대 저장으로 돌아갈 수 있었다(백로그 BH ②).

---

## 2. 원인 · 조사 결과

### 2.1 파산 되돌리기 경로 (확정 — 코드 대조)

- 「타이틀로」 단추 → `MainMenuScene` → 「이어하기」 = 마지막 침대 저장.
- 혼잣말·확인 창이 떠 있는 동안 탭 닫기 / F5 — 웹에는 `beforeunload` 저장이 없다.
- `deleteSlot`은 `_activeSlot`만 비우고 메모리의 캐릭터를 남긴다 — 뒤이은 `save()`가 `activeSlot ?? 1`로 **슬롯 1을 덮을 수 있었다**.

### 2.2 멀티에서 파산이 남기는 것 (확정)

- 서버는 파산을 모른다. `/mp/leave`는 자리를 「오프라인」으로 7일 남긴다 → 이름 · 통발 · 위치(이어하기) · 미적용 거래가 남는다.
- **멀티 id(`userId`)가 브라우저당 하나**였다 — 슬롯 1~3의 캐릭터가 세션의 **한 자리**를 나눠 썼다.
  파산 뒤 새 캐릭터가 같은 id로 들어가면 옛 자리(위치 · 통발 소유 · **확정 미적용 거래**)를 물려받는다.
  확정 거래가 남아 있으면 새 캐릭터가 상대가 준 물건만 받는다(파산 우회 통로).
- 파산 연출 중에도 위치 보고가 `'field'`라 남에게는 「서 있는 사람」으로 보이고 거래 제안이 들어올 수 있었다.

### 2.3 전수조사 — 멀티 고려 사항 (감사 에이전트 2개 · 읽기 전용)

이번 차수에 고친 것은 ✅, 나머지는 위험도 순 잔여(§6).

| 위험 | 항목 | 핵심 근거 | 이번 |
|---|---|---|---|
| 치명 | 거래 적용 + 침대 저장 = **복제** — 준 쪽이 저장 없이 끄면 세이브에 물건이 남는데 서버 기록은 「적용됨」으로 지워진다 | `RegionFieldScene.applyTrade` · `markTradeApplied` 선행 | 잔여 |
| 치명 | 같은 함수가 `removeQty` · `addCoins(-x)` 실패를 무시 — 잔액이 모자라도 상대는 받는다 | `GameState.addCoins` false 반환 | 잔여 |
| 높음 | 서버 인증 없음 — `playerId`가 `peers`로 전원에게 뿌려진다 → 남의 이름으로 거래 확정 · 통발 회수 · 채팅 | `SessionRegistry.presence` | 잔여 |
| 높음 | 채집 스팟 소비가 공유되지 않음 — 같은 전복을 두 사람이 다 캔다. 스팟 목록도 면허 · 스킬로 사람마다 다르다 | `ForageSystem` `GONE` · `rollForageSpots` | 잔여 |
| 높음 | 과증식(해파리 · 불가사리) 수거가 로컬 — 둘이 같은 개체를 수거해 보상 2배 · 재입장 리스폰(싱글도) | `NuisanceField.remove` | 잔여 |
| 중간 | 설치물(통발 · 화구 · 거치대) 서버 거절 무시 · 재동기화 없음 · 유령 설치물 | `TrapFieldSystem` · `StoveFieldSystem` · `RodHolderSystem` | 일부 ✅ |
| 중간 | 거래로 규칙 우회 — 채집물 유통 금지 · 판매처 포화 · `earn` 목표(잔액 기준) · `traded` 표식 미사용 | `tradeBlockReason` · `StoryStore` | 잔여 |
| 중간 | 실내 · 연출 중에도 활동이 매 프레임 `'field'`로 덮어써짐 | `syncPeers` | ✅ |
| 중간 | 이어하기 위치는 서버 최신 · 인벤은 침대 시점 · **슬롯끼리 자리 공유** | `join` userId 매칭 | ✅(자리 공유) |
| 중간 | 날씨 입력이 접속 시각마다 달라 공용 시드 보일링이 한쪽에만 뜰 수 있음(추정) | `ExternalDataStore` 1회 수집 | 잔여 |
| 중간 | 홈타운: 피어는 보이는데 집 오브젝트는 각자 것 — 남의 울타리를 뚫고 선다 | `getWorldObjects` 로컬 | 잔여(사용자 판단) |
| 낮음 | 채팅은 사실상 세션 전체 · 속도 제한 없음 · 줄바꿈 주입으로 가짜 시스템 줄(추정) | `MpChatLine` region 없음 | 잔여 |
| 낮음 | 거래 수신 시 가방이 차면 받은 물건 소실 · 시간대(OS 로컬 월/일) 혼용 · 배경 차량 충돌은 내 화면만 | — | 잔여 |
| 낮음 | 탭을 닫아도 `/mp/leave` 없음(30초 얼음) · 같은 id 두 탭이면 첫 탭이 조용히 끊김 · 로비가 `lastCode`를 안 읽음 | `MultiplayerClient` | 잔여 |
| 기타(싱글) | **수조를 거치면 패류독소(`toxin`)가 사라진다** — 쿨러 → 수조 → 가방 | `HomeStore.addToTank` | 잔여 |

문제없음으로 확인된 것: KST 세계 시계 · 물때 · 하루 경계 · NPC 일과 · 패류독소 발령창 · 보일링 위치 스케줄 ·
통발 포획물(소유자만) · 거치대 · 화구 · 귀속 아이템 거래 차단 · 거래 이중 적용 방지 · 컷씬 중 「바쁨」 · dev 핫키 차단.

---

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`client/store/GameState.ts`](../../../packages/client-pc/src/store/GameState.ts) | `declareBankruptcy()` — 활성 슬롯 삭제 + `_bankrupt` 잠금. `saveToSlot`은 잠금 중 거부(`save()` · Tauri 종료 저장 포함). `loadFromSlot` · `startNewGameInSlot`이 잠금 해제 |
| 수정 | 같은 파일 | **캐릭터별 멀티 id** `mpUserId`(세이브 필드) — 새 게임 = 새 id · 구세이브 = 브라우저 id 물려받음(이어하기 보존) |
| 수정 | [`client/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | `beginBankruptcy` 첫 줄에서 세이브 삭제 + 멀티 `retire()` · 확인 창 문구 「지난 기록은 모두 사라졌다」 · 파산 중 `syncTrade` 차단 · 활동 파생에 실내(`indoor`) · 연출(`cinematic`) |
| 수정 | [`client/net/MultiplayerClient.ts`](../../../packages/client-pc/src/net/MultiplayerClient.ts) | `retire()` · 서버 무응답이면 `pendingRetire`(세션 코드 + 그 캐릭터 id)에 남겨 다음 `claimName` 앞에서 재전송 · `legacyUserId` · `newCharacterId` · `useCharacterId` · 늦게 온 presence 응답 무시 |
| 신설 | [`server/multiplayer/routes.ts`](../../../packages/server/src/multiplayer/routes.ts) | `POST /mp/retire {code, playerId?, userId?}` |
| 수정 | [`server/multiplayer/SessionRegistry.ts`](../../../packages/server/src/multiplayer/SessionRegistry.ts) | `retire()` — 자리 삭제(이름 즉시 해제) · 그 사람 설치물 삭제 · 제안/편집 중 거래 `gone` 취소 · 확정 거래는 소멸한 쪽만 적용 완료 · 즉시 저장. `sweep`이 7일 지난 자리를 지울 때 설치물도 함께 |
| 수정 | [`core/types/Multiplayer.ts`](../../../packages/core/src/types/Multiplayer.ts) · `index.ts` | 계약 `MpRetireRes` |
| 수정 | [`client/i18n/en_ui.ts`](../../../packages/client-pc/src/i18n/en_ui.ts) | 새 확인 창 문구 영문 |

---

## 4. 구조상 위치

- `세이브 → 슬롯 수명` (판정 층) — 저장 잠금은 `saveToSlot` 한 곳에 걸어 모든 저장 경로가 거친다.
- `멀티플레이 → 세션 자리 수명` (계약 + 서버 판정) — `leave`(자리 유지)와 `retire`(자리 소멸)가 갈렸다.
- `멀티플레이 → 신원` (데이터 층) — 재접속 열쇠가 브라우저에서 캐릭터(세이브)로 내려왔다.

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 서버 `retire` 계약 | `scratchpad/r231_server.mjs`(dist 직접) | 통발 1개 회수 · 상대 화면 피어 0 · 통발 0 · 진행 중 거래 「상대가 자리를 떠났습니다」 · 이름 즉시 사용 가능 · 같은 id 재참가 = resume 없음 |
| 확정 거래 + 파산 | 같은 스크립트(`userId`로 retire = 오프라인 재시도 경로) | 상대는 committed를 그대로 받음 · 파산 쪽 `applied=true` · 상대 적용 후 기록 소멸 |
| 클라 파산 | 하네스 `r231.cjs`(dev + 로컬 서버 4000) | 파산 즉시 슬롯 3 삭제 · `saveToSlot(3)` · `saveToSlot(1)` · `save()` 모두 false · 슬롯 1 생성 안 됨 · 슬롯 2 무사 |
| 클라 멀티 | 같은 하네스 | 파산 전 서버 1명 「파산왕」 → 직후 0명 · `pendingRetire` 응답 뒤 [] · 연결 해제(single) |
| 다시 시작 | 같은 하네스 — 확인 창 실클릭 | `CharacterCreateScene` · 슬롯 3 새로 생성 · 잠금 해제 · 멀티 id 교체 |
| 캐릭터별 id | 같은 하네스 | 새 게임 id ≠ 브라우저 id · `mpUserId` 지운 구세이브 로드 = 브라우저 id |
| ko/en | 두 번 · 스크린샷 육안 | 확인 창 3줄 창 안 · pageerror 0 |
| 빌드 | `pnpm run build` · typecheck · core test | 3/3 · 0 오류 · 79/79 |

재현: 필드 씬의 `beginBankruptcy(10000000)`을 직접 부르고 0.4초 뒤 `localStorage` 슬롯 키를 확인한다.

---

## 6. 잔여

전수조사 표(§2.3)의 「잔여」 전부 — 백로그 `BI`로 올렸다. 착수 순서 제안:

1. **거래 복제(치명)** — 거래 적용 직후 그 슬롯을 강제 저장하는 예외(침대 저장 정책 변경 → 사용자 판단),
   또는 「적용함」 기록을 세이브 안에 넣어 롤백 시 재적용. `removeQty` · `addCoins` 실패 시 적용 중단.
2. **서버 인증** — join 때 비공개 토큰 발급 · 모든 변경 요청에 요구 · `peers`에는 공개 id만.
3. **채집 스팟 · 과증식 수거 공유** — 통발과 같은 세션 채널(`goneSpots`) + 로컬 슬롯 단위 `GONE`.
4. 거래 규칙 우회(채집물 유통 · `earn`) · 설치물 재동기화 · 날씨 스냅샷 공유 · 수조 독소 세탁.

- 「친구에게 재산을 맡겼다가 새 캐릭터로 돌려받기」는 사람 사이 약속이라 코드로 완전히 막을 수 없다
  — 새 캐릭터가 새 id가 된 것까지가 이번 범위다.
- 클라이언트 localStorage를 직접 백업했다 되돌리는 것은 원리상 못 막는다(서버 권위 과제).

---

## 7. 위험 · 부작용

- **구세이브 멀티 이어하기는 그대로** — `mpUserId`가 없으면 브라우저 id를 물려받는다.
  단, 구세이브 둘(슬롯 1 · 2)은 여전히 같은 자리를 공유한다(처음 만든 새 게임부터 갈라진다).
- 새 게임마다 새 id라 **같은 세션에 새 캐릭터로 들어가면 옛 자리와 이름이 7일 남는다**(파산은 `retire`가 지운다).
- 파산 확인 창의 ✕도 「타이틀로」와 같다 — 세이브는 이미 없으므로 되돌릴 길이 없다.

---

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 §3.1
- [x] `02-SYSTEMS/multiplayer.md` §4 · §5 · §6
- [x] `02-SYSTEMS/night-hunting-trap.md` §5(파산)
- [x] `04-BACKLOG.md` BH ② 해소 · BI 신설
- [x] `AGENTS.md` §9 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 이어받기 요약
