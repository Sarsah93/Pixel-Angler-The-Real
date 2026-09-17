# 149차 — 구멍치기(테트라포드·사석) + M1-04 장소 게이트

| | |
|---|---|
| **날짜** | 2026-09-17 |
| **시스템** | `낚시` `스토리·퀘스트` `월드·필드` |
| **트리거** | 로드맵 다음 단계 (147차 사용자 확정 — 위판 → 인벤/가방 → **구멍치기** → 불요리 → 농장) |
| **커밋** | `67a6bb9` |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

로드맵의 다음 칸이 **구멍치기 + M1-04 장소 게이트**였고, 착수 시점의 상태는 이랬다.

- **조법 자체가 없었다.** 학습 태그(`holeFishing`·`tetrapodSafety`)와 일지 라벨,
  사이소 저가 릴대·릴, 도현수의 대사("구멍치기는 부러져도 안 아까운 대로 하는 거야")까지
  다 있는데 **정작 그 조법으로 낚을 방법이 없었다**.
- **M1-04의 "방파제에서"가 라벨뿐이었다.** 목표는
  `fish(undefined, '방파제에서 물고기 1마리 낚기', …)` — 어디서 낚아도 통과한다.
- 반대로 **지형 판정은 이미 있었다.** 114차가 방파제 단면을
  `breakwaterClassAt` 0 안벽 / 1 상판 / 2 테트라포드 피복 / 3 사석으로 분류해 두었고,
  `TrapFieldSystem`·`ForageSystem`이 쓰는 **호스트 콜백 패턴**까지 배선돼 있었다.

즉 이번 차수는 "없는 것을 새로 만드는 일"이 아니라
**이미 깔린 지형 분류 위에 조법 하나와 조건 한 줄을 올리는 일**이었다.

## 2. 원인 — 무엇이 문제였나

버그 수정이 아니라 신규 구현이라 원인 절은 해당 없음. 다만 착수 조사에서
**라벨과 실제가 어긋난 항목**이 하나 나왔고 그것이 이번 범위를 정했다 —
M1-04는 "저가 장비로 테트라포드 구멍치기"라는 설명을 달고 있으면서
**구멍치기 없이, 방파제가 아니어도 통과**했다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `core/src/simulation/HoleFishing.ts` | `HoleSpotKind`(tetrapod/riprap) · `holeKindOfBreakwaterClass` |
| 신설 | 〃 | `evaluateHoleSpot`(깊이·거리·밑걸림·미끄러짐) · `HOLE_SPECIES_BIAS` |
| 신설 | 〃 | `holeSlipChance` · `holeGearWarning` |
| 신설 | `core/src/config/tuning.ts` | `TUNING.hole` 15키 + F8 슬라이더 5종 (mockup — 실플레이 조율 대기) |
| 신설 | `core/src/types/Story.ts` | `StorySpotKind`(breakwater/hole/shore/boat) · `spotKindSatisfies` · `SPOT_KIND_LABEL` · `StoryObjective.spotKind` |
| 수정 | `core/src/simulation/SeabedProfile.ts` | 생성자 5번째 인자 `{ floorRatio, alwaysRock }` — 구멍치기처럼 **발앞이 곧 바닥**인 지형 |
| 수정 | `core/src/db-schema/StoryQuestDatabase.ts` | M1-04 어획 목표에 `spotKind: 'breakwater'` |
| 수정 | `client-pc/src/scenes/RegionFieldScene.ts` | `updateHoleSpot`(구멍 판정·타일 캐시) · `enterHoleFishing`(미끄러짐·장비 안내·FP 진입) |
| 수정 | 〃 | `standingSpotKind` · 좌클릭 **탭/홀드 분기** · 프롬프트 · 차지 바 유예 |
| 수정 | `client-pc/src/scenes/FirstPersonFishingScene.ts` | `cfg.hole`·`cfg.spotKind` 수용 — 스폰 가중·구조물 성향·밑걸림 배율 |
| 수정 | 〃 | 암초 비율·바닥 프로필·조작 안내·결과 버튼·`spotKind()` |
| 수정 | `client-pc/src/store/GameState.ts` · `store/StoryStore.ts` | `addCaughtFish(..., spotKind)` → catch 이벤트 |
| 수정 | 〃 | `match`의 장소 조건 + **조건만 어긋났을 때 안내** |
| 수정 | `client-pc/src/data/HelpContent.ts` | 낚시 카테고리에 **구멍치기 토픽 4페이지**(조작·대상·저가 장비·안전) |
| 수정 | `client-pc/src/i18n/en.ts` · `en_panels.ts` · `en_help.ts` | 규칙 6 + 사전 항목 (EN 잔존 0) |

### 설계 결정

**⚖ 새 단축키를 만들지 않았다 — 좌클릭 탭/홀드로 가른다.**
구멍치기는 낚시 행위라 마우스에 있어야 하고, `F` 체인은 이미
NPC 대화 > 오브젝트 > 건물 > 불가사리 > 채집 > 통발로 꽉 차 있다(채집 스팟이
테트라포드 발밑에도 생기므로 넣으면 서로 잡아먹는다). 블록 위에서
**짧게 떼면 구멍치기 · 꾹 누르면 캐스팅**(`TUNING.hole.tapMs` 320ms) —
1인칭 호핑(탭) ↔ 릴링(홀드)과 같은 문법이다.
같은 자리에서 두 조법을 다 쓸 수 있으므로 **기존 캐스팅을 빼앗지 않는다**.

**⚖ 장소 게이트는 `breakwater`로 걸고, 구멍치기가 그것을 만족하게 했다.**
M1-04의 라벨이 "방파제에서"이므로 강제하는 것도 방파제다(`spotKindSatisfies`가
`hole → breakwater`를 참으로 본다). 구멍치기를 **강제**하지 않은 이유는 두 가지 —
① 라벨이 약속한 것보다 더 요구하면 계약 위반이고 ② 진행 중인 세이브가 막힌다.
구멍치기는 "여기서 하면 자연스러운 방법"이지 관문이 아니다.

**⚖ 조용히 안 채우지 않는다.** 장소 조건**만** 어긋난 어획은
`[퀘스트] 사이소 영수증 — 방파제에서 낚아야 인정됩니다`로 이유를 말한다.
안 그러면 "낚았는데 목표가 안 찬다"가 버그로 읽힌다.

**⚖ 밑걸림은 벌칙이 아니라 조법의 성질이다.** 테트라포드 ×2.2 · 사석 ×1.7.
그래서 저가 장비를 쓰는 것이고, 비싼 대를 들고 올라서면 **막지 않고 권하지 않는다**
(`holeGearWarning` — 60,000원 초과 시 로그 한 줄).

## 4. 구조상 위치

`S3 낚시 루프 → 조법 → 구멍치기` (계약·판정 = core / 진입·렌더 = client) ·
`S22 스토리 → 목표 판정 → 장소 조건`(계약 층 — 목표 스키마 확장).

파급: `StoryObjective`에 필드가 하나 늘었지만 **선택 필드**라 기존 185퀘는 무영향.
`SeabedProfile` 생성자 5번째 인자도 기본값이 종전 동작이라 캐스팅 경로 회귀 없음.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| core 판정 14항목 | 실렌더 하네스(`v149`) | 깊이 테트라포드 4.1m > 사석 2.9m · 결정적 · 하한 1.5 / 상한 9 |
| 〃 | 〃 | 거리 1.38m · 파고 3m에서 미끄러짐 0.06 → 0.60 |
| 필드 구멍 판정 | 속초 심리스 실주행 | 사석 타일 (503,152)에서 구멍 판정 · 블록 밖 = 구멍 없음 |
| 〃 | 〃 | 프롬프트 `사석 — 좌클릭 짧게 = 구멍치기 (수심 2.2m) · 길게 = 캐스팅` |
| 1인칭 hole 모드 | 실렌더 | Z_max 2.2m = 구멍 수심 · 거리 1.43m · 조작 안내 구멍치기 문구 |
| 〃 | 〃 | 스폰 가중 볼락 2.6 · 성향 reef+structure |
| 바닥 프로필 | 실측 | 구 프로필은 발앞을 깎아 **2.2m 구멍이 0.8m**로 그려졌다 |
| 〃 | 〃 | `floorRatio 0.94`·`alwaysRock` 적용 후 **바닥 2.08m · 전 구간 여 밭** |
| 탭/홀드 분기 | 실마우스 + 결정적 호출(`v149c`) | 실클릭이 `tryStartCharge`에 도달(over=0) · 유예 안 차지 바 미표시 |
| 〃 | 〃 | 탭 = 구멍치기 · 홀드 = 캐스팅 · 구멍 없으면 탭도 캐스팅 |
| 미끄러짐 | 실호출 | 체력 100 → 88 · 진입 무산(`castBusy` false) |
| M1-04 게이트 | StoryStore 실이벤트(`v149b`) | 뭍·미기록 어획 0 유지 + 안내 문구 · 방파제 1 · 구멍치기 1 |
| EN | `setLocale('en', game)` | 신규 16문자열 잔존 0 |
| 도움말 | 데이터 조회 | 구멍치기 토픽 4페이지 `ready` |
| 합계 | — | **47/47 PASS · pageerror 0 · 빌드 3/3 · typecheck 0** |

## 6. 잔여

- **도움말 실캡처 4장 없음** — 토픽은 `ready`지만 삽화가 없다(문구만).
  다음에 캡처 작업을 묶어서 할 때 `help_hole_*`로 추가한다.
- **`TUNING.hole` 15키는 mockup** — 깊이 배율·밑걸림 배율·미끄러짐 확률·탭 경계는
  실플레이 감으로 F8에서 조율해야 확정된다.
- **구멍치기 전용 연출이 없다** — 현재는 기존 1인칭 뷰에 거리만 1.4m다.
  블록 사이로 내려가는 전경(테트라포드 실루엣)은 아트 후속.
- **`spotKind: 'boat'`는 소비처가 없다** — 배 출조(Ch4)가 서면 그때 배선한다.

## 7. 위험·부작용

- **회귀 지점**: 좌클릭 경로에 분기가 하나 늘었다. 구멍 밖(`holeSpot === null`)에서는
  분기가 통째로 꺼지므로 기존 캐스팅은 그대로다(하네스로 확인).
- **`updateHoleSpot`는 매 프레임 돈다** — 초기 구현이 `resolveCastDepth`를 그대로 불러
  `[수심] …` 로그를 매 프레임 밀어 넣었다. **타일이 바뀔 때만 재계산 + `quiet` 인자**로 막았다.
- **`SeabedProfile` 시그니처 확장**은 기본값이 종전 값이라 구 호출부 무영향.
- 세이브 스키마 변경 없음. `spotKind`는 이벤트에만 실리고 저장되지 않는다
  (구세이브의 진행 중 M1-04는 다음 어획부터 장소 조건이 적용된다).

## 8. 후속 반영

- 워크로그 1건(이 문서) · `03-WORKLOG/README.md` 인덱스
- 시스템 페이지 `02-SYSTEMS/fishing-loop.md`(S3) · `story-quests.md`(S22)
- `04-BACKLOG.md` · `docs/wiki/README.md` 대시보드
- `.agents/AGENTS.md` §9 · `.agents/IMPLEMENTATION_PLAN.md` · `CLAUDE.md`

---

### 부록 — 검증 하네스 함정 (신규)

- **헤드리스는 "짧은 탭"을 실마우스로 만들 수 없다.** rAF 간격이 300ms를 넘어
  `mouse.down()` 직후 `mouse.up()`을 해도 씬 시각으로 333ms가 흐른다(실측).
  실입력은 **도달 여부**만 보고, 탭/홀드 경계는 `chargeDownAt`을 제어해 결정적으로 본다.
- **`Math.random`을 전역에 스텁으로 두면 Phaser가 깨진다.** 미끄러짐 난수를 없애려고
  페이지 전역에 `Math.random = () => 0.99`를 걸어 두자 1인칭 씬 생성이
  `Cannot read properties of null (reading 'context')`로 죽었다(제품과 무관).
  **호출 한 번 동안만 씌우고 즉시 되돌린다.**
- `StoryStore.status()`는 **id가 아니라 `StoryQuestDef`를 받는다.** 선행 퀘가
  대화·품삯을 요구하면 `accept/complete`로는 세울 수 없으니 게이트 판정만 볼 때는
  `quests[id]`를 직접 세운다.
