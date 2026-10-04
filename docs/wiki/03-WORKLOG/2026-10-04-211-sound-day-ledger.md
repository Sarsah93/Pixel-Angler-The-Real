# 211차 — 사운드 1차 · 대사 목소리 · 하루 결산

| | |
|---|---|
| **날짜** | 2026-10-04 |
| **시스템** | `UI` `낚시` `홈` `세이브` `진행` |
| **트리거** | 사용자 지시 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 원문:

> "처음 2시간 다듬기부터 진행해줘 — 사운드 1차(위 추천 사운드 항목과 함께 퀘스트 진행 시 나오는 타이핑 텍스트에도
> 동물의 숲처럼 대사 사운드 같은 게 들어가면 좋을듯?)랑 하루 결산 화면(아마도 세이브 시스템 수정이 되어야 할 것 같고,
> 결산 내용도 낚시부분만 들어갈 게 아니라 인게임 내 모든 변화를 보여주게 될 것 같네?)."

직전 스타듀 비교에서 짚은 「처음 2시간」 약점 두 가지 — **소리가 거의 없다**(섭취음 · 타이틀 징글뿐)와
**하루가 끝나도 무엇이 남았는지 보이지 않는다** — 를 먼저 메운다.
실시간(KST) 시계는 사용자 뜻대로 **유지**한다(결산 화면이 하루 경계를 대신 만든다).

## 2. 원인 — 무엇이 문제였나

버그 아님(기능 신설). 단, 구현 중 확정한 결함 2건:

- **지난 하루가 안 떴다** — 미확인 장 표시는 `GuideTour.busy`를 기다렸는데, 프롤로그의 **수동 말풍선 코치**(`coach_bag`)도
  busy로 잡혀 영원히 대기했다. → `GuideTour.blocking`(입력을 막는 투어만)으로 바꾸고, 프롤로그 중(`prologueRunning()`)은 보류,
  2초 간격 최대 30회 재시도.
- **dev 시계를 되돌리면 장이 쪼개졌다** — 날짜 비교가 `!==`였다. → **앞으로 넘어갈 때만**(`today > openedYmd`) 자정 마감.

## 3. 변경

### 신설

| 파일 | 내용 |
|---|---|
| [core/types/Voice.ts](../../../packages/core/src/types/Voice.ts) | `VoiceProfile`(기본 음높이 · 파형 · 글자 간격 · 길이 · 억양) |
| [core/art/CharacterVoice.ts](../../../packages/core/src/art/CharacterVoice.ts) | `voiceOfNpc`(인물 성별 · 나이대 + id 해시 흔들림) · `voiceOfPlayer` · `GUIDE_VOICE` · `voiceSemitone`(한글 중성 / 영문 모음 → 반음) |
| [core/types/DayLedger.ts](../../../packages/core/src/types/DayLedger.ts) | `CoinReason` 14종 · `DayLedgerPage`(돈 · 어획 · 놓친 것 · 얻은/쓴 것 · 이야기 · 우호도 · 성장 · 발견 · 생활 · 장비 · 다닌 곳 · 머문 시간) · `LedgerCard` |
| [core/simulation/DayLedger.ts](../../../packages/core/src/simulation/DayLedger.ts) | `buildLedgerCards` — 무엇을 보여 줄지 판단(카드 9갈래 · 카드당 5줄 · 빈 갈래 생략) |
| [client/audio/Voice.ts](../../../packages/client-pc/src/audio/Voice.ts) | `VoiceTyper` — 타이핑 글자마다 짧은 음(공백 · 문장부호 쉼 · 간격 제한) |
| [client/audio/Ambience.ts](../../../packages/client-pc/src/audio/Ambience.ts) | 파도(저역 노이즈 + 0.12Hz 너울) · 빗소리(고역 노이즈) — 씬이 목표 크기만 준다 |
| [client/store/LedgerStore.ts](../../../packages/client-pc/src/store/LedgerStore.ts) | 하루 장부 — 잠 / 자정 마감 · 닫힌 장 14개 보관 · 세이브 · 불러오기 중 기록 정지 |
| [client/ui/DayReportPanel.ts](../../../packages/client-pc/src/ui/DayReportPanel.ts) | 「오늘 하루 / 지난 하루」 — 2×3 카드 · 카드 넘김 · 날짜 넘김 · 확인 · 첫 열기 가이드(`day_report` 3단계) |

### 수정

| 파일 | 내용 |
|---|---|
| [client/audio/Sfx.ts](../../../packages/client-pc/src/audio/Sfx.ts) | 버스 3개(효과음 · 대사 · 배경) + 설정 음량 · 첫 입력 잠금 해제 · 효과음 19종(동전 · 줍기 · 퀘스트 · 하루 · 책장 · 캐스팅 · 착수 · 입질 단계 · 챔질 · 헛챔질 · 릴 · 드랙 · 줄 터짐 · 낚음 · 방생 …) |
| `DialoguePanel` · `MonologuePanel` · `GuideTour` · `StoryCinematicPanel` | 타이핑에 목소리(NPC = 그 사람 목소리 · 혼잣말 = 주인공 · 가이드 = 맑은 사인파) · 선택지 클릭음 |
| `FirstPersonFishingScene` | 착수 · 입질 1~3단계 · 챔질/헛챔질 · 릴 소리(**핸들 ¼바퀴마다 — 기어비가 귀로 들린다**) · 드랙(`dragSlipKg > 0`) · 줄 터짐 · 파도/비 배경 · 장부(놓침 · 방생 · 머문 시간) |
| `RegionFieldScene` · `HomeInteriorScene` · `MainMenuScene` | 퀘스트 차임 · 줍기 · 캐스팅 · 배경 크기 · 미확인 지난 하루 표시 · 침대 → 결산 · 「지난 날 돌아보기」 |
| `GameState` | `SaveData.ledger` · `addCoins(amount, quiet, reason)` · 어획 · 경험치 · 숙련 · 스킬 · 사망 · 정기 지출 · 수면 마감 훅 |
| `InventoryStore` · `StoryStore` · `TitleStore` · `DiscoveryStore` · `TrapFieldSystem` · `ForageSystem` · `CookScene` · `LicensePanel` · `ShopPanel` · `WorldMapScene` | 장부 기록 훅 · 돈 사유(판매 · 의뢰 · 구매 · 면허 · 수리 · 이동 · 벌금 · 이용료) |
| `SettingsScene` | 3번째 음량 줄 「대사 소리」(`voiceVolume` 기본 0.6) · 놓으면 미리 듣기 |
| `HelpContent` · `en_help` · `en` | 「집」에 결산 문단 · 설정 음향 줄 · 영문 사전/규칙(날짜 줄 · 머문 시간 · 돈/낚시/이야기/성장/생활/가방 줄) |

### 삭제

없음.

## 4. 구조상 위치

- **UI 프레임워크 → 소리**: 계약(core `VoiceProfile`) · 판정(core `voiceOfNpc`) · 렌더(client WebAudio 합성).
  실제 오디오 에셋이 오면 `Sfx.ts` 함수 몸통만 샘플 재생으로 바꾸면 된다(호출부 불변).
- **홈 · 세이브 → 하루 결산**: 계약(core `DayLedgerPage`) · 판정(core `buildLedgerCards`) · 데이터(client `LedgerStore` + `SaveData.ledger`) · 렌더(`DayReportPanel`).
  기록은 **각 스토어의 실제 변경 지점**에 붙인다(UI가 아니라) — 어느 경로로 바뀌어도 장부에 남는다.

## 5. 검증

하네스 `scratchpad/r211.cjs`(ko / en) — dev 서버 + Playwright.

| 대상 | 방법 | 결과 |
|---|---|---|
| 대사 목소리 | 탁만수 대화 열고 타이핑 | 블립 3(ko) / 8(en) · 노년 남성 114Hz square · 간격 73ms |
| 장부 → 효과음 | 판매 · 의뢰 · 구매 · 줍기 | `coin ×3 · pickup` |
| 1인칭 소리 | 강제 입질 → 챔질 → 약한 릴 파이팅 → 과부하 | splash 1 · bite1 1 · bite3 1 · hookset 2 · drag 14 · reel 3~4 · snap 1 · 장부 줄터짐 1 |
| 배경 | 메뉴 / 1인칭(비) / 집 | 0.3 / 0.9 + 비 0.8 / 0.12 |
| 장부 내용 | 위 시나리오 후 `peekCurrent` | 수입 판매 12,000 · 의뢰 5,000 · 지출 구매 3,500 · 참돔 보관 · 우럭 놓아줌 · 우호도 · 요리 1 |
| 오늘 하루 | 침대 「그냥 쉬기」 | 카드 8장 / 2쪽 · 가이드 · 소리(하루 + 책장) · 아래 경계 침범 0 |
| 세이브 왕복 | `buildSaveData → applySaveData` | 닫힌 장 1 → 1 · 마지막 장 번호 동일 |
| 자정 마감 | `__LEDGER.devSetYmd('20991231')` 후 집 재진입 | 「지난 하루」 자동 표시(closedBy midnight) · 침대 메뉴에 「지난 날 돌아보기」 |
| 돌아보기 | 날짜 ◀ | 2 → 1장 이동 |
| 영문 | 같은 시나리오 en | 한글 잔존 0 |
| 오류 | pageerror · 콘솔 경고 | 0 · 0 |

- 레이아웃 1차 스크린샷에서 **부제가 카드 밑에 깔리고(부제 하단 ≈ 88 > 카드 시작 84)** 집 창빛이 반투명 배경을 두 톤으로 비쳤다
  → 카드 시작 100 · 카드 높이 108 · 본문 불투명 배경. 낚시 카드 머리글을 오른쪽 끝으로, 고기 그림은 그 아래로.
- 겹침 감사: 결산 창(모달 · dim) × 집 방 RenderTexture만 잡힘 — 모달은 면제 대상.

## 6. 잔여

- **실제 오디오 에셋 · BGM** — 합성음은 자리표시. 에셋이 오면 `Sfx.ts` 몸통 교체.
- **결산 카드 아이콘** — 지금은 색 표지만. 16px 픽셀 아이콘 9종(돈 · 낚시 · 이야기 …)은 아이콘 작업 때.
- **NPC 개별 목소리 미세 조정** — 지금은 성별 · 나이대 + 해시. 주요 인물 몇 명은 손으로 지정할 여지.
- **멀티 피어 장부** — 자기 것만 기록. 거래(trade) 사유만 연결.
- **결산 「내일 할 만한 것」 한 줄**(물때 · 날씨 예보) — 라디오 방송 로직 재사용으로 쉽게 붙일 수 있다.

## 7. 위험 · 부작용

- 장부 기록 훅이 스토어 변경 지점 다수에 붙었다 — 시드 백필 · 불러오기 중 대량 변경은 `suspend`로 막는다.
  새 스토어 초기화 경로를 만들면 같은 정지를 걸 것(안 걸면 불러올 때마다 「오늘 얻은 것」이 부풀어 오른다).
- 소리는 첫 사용자 입력 전에는 나지 않는다(브라우저 자동 재생 정책) — 의도.
- 성능: 블립 하나 = 오실레이터 1 + 게인 1(≤ 50ms) · 글자 간격 48ms 이상(초당 ≤ 21개).

## 8. 후속 반영

- [x] 워크로그(이 파일) · 색인
- [x] 시스템 페이지 — [ui-framework](../02-SYSTEMS/ui-framework.md) §4 · §6 / [home-base](../02-SYSTEMS/home-base.md) §4 · §6
- [x] 백로그 · AGENTS §9 · PLAN · CLAUDE.md
