# S14. 해루질 · 통발

> 상태 **🟢 운영(인-맵 1차)** — 121차에 **속초 심리스 맵 위에서** 채집·어장 규제·통발이 동작한다.
> 레거시 별도 씬(`NightHuntingScene`/`TrapScene`)은 FieldScene 경로에만 남아 있고 폐기 후보.
> 관련 차수 099(조사·결함 2건) · **121(인-맵 채집·어장·조례·통발)** · **224(현실화 1차 — 얕은 물 · 장화 · 손놀림 놀이 5종 · 갯것 미끼)** — 세부 로드맵은 §5.

---

## 1. 목적·범위

낚시와 병렬인 **채집 생산 축**. 동해안 실태(리서치 121차 §2)를 그대로 옮긴다 —
갯바위·방파제 발밑·암반 조간대에서 소라·홍합·성게·해삼·문어를 **줍거나 뜰채·갈고리로 건지는** 해루질과,
물가에서 던져 두고 실시간 침지 후 수거하는 **통발**. 산출물은 쿨러 → 인벤 → 요리/자가 소비
(**채집물은 판매·유통 금지** — 강원 조례).

## 2. 구성

| 계층 | 파일 | 역할 | 상태 |
|---|---|---|---|
| core | `types/Foraging.ts` | 도구·접근·스팟·어장 폴리곤 타입 · `farmAt` · 조례 상수 · 판매 금지 상수 | ✅ 121 |
| core | `simulation/ForagingEngine.ts` | 시드 스팟 롤링(동해 배율 · 여름잠 · 바닥 일치) · 안전 판정 · 사는 모양 → 놀이 갈래 · 수확 · 다침(장갑) · 얕은 물 수심 · 조례 | ✅ 224 |
| core | `simulation/ForageMinigame.ts` | 손놀림 놀이 5종(덮치기 · 줍기 · 떼기 · 파기 · 당기기) 상태 머신 + 난이도 테스트 | ✅ 224 |
| core | `db-schema/ShoreCreatureDatabase.ts` | 생물 21종 — 웹 조사 반영(서식 · 금어기 · 체장 · 동해 출현 · 여름잠) · 갈래 · 바닥 · 미끼 아이템 | ✅ 224 |
| core | `simulation/TrapSystem.ts` · `db-schema/TrapDatabase.ts` | 수거·효율 곡선·분실 롤·면허 등급·가격 · 통발 8종(+도루묵) | ✅ |
| core | `config/tuning.ts` `forage`·`trap` | 밀도·성공·도주·적발·벌금·분실 배율 (F8 11종 — **mockup**) | 🔶 조율 대기 |
| data | `public/data/<region>/fishfarms.json` ← `tools/extract_fishfarms.py` | 어촌계 어장 폴리곤(EPSG:5179 SHP 클립 · 타일 좌표) | ✅ 속초 3개 |
| client | `scenes/field/ForageSystem.ts` | 후보 타일(테트라포드 제외 · 얕은 물) → 스팟 · 달아나기 · 랜턴 가시성 · [F] → 놀이 · 놓침 = 사라짐 · 수확/미끼 · 단속 · 미끄러짐 | ✅ 224 |
| client | `ui/ForageGamePanel.ts` | 놀이 판 그리기 · 마우스/Space · ESC = 포기 · 갈래별 첫 열기 가이드 | ✅ 224 |
| client | `SeamlessChunks.computeWade` · `RegionFieldScene.updateWading` | 얕은 물 칸 · 따로 굽는 충돌(`wadeWalls`) · 장화면 그 collider만 끔 · 1m · 물결 | ✅ 224 |
| client | `scenes/field/TrapFieldSystem.ts` · `ui/TrapDeployPanel.ts` | 통발 선택 → 물 위 설치 · 부표 · [F] 수거 · 반환 | ✅ 121 |
| client | `RegionFieldScene` 배선 | E 우선순위 · T 키 · 설치 클릭/ESC · `depthAtWaterTile` · `__FIELD`(dev) | ✅ 121 |
| client(legacy) | `scenes/NightHuntingScene.ts` · `TrapScene.ts` · `GameState.addHarvestToCooler` | 별도 씬(이모지 클릭) · 화면에 없는 legacy 쿨러 | ⚠ 폐기 후보 |

## 3. 동작 구조

```
채집: 지형 규칙(섬/암초 · 갯바위=rock_shore/웅덩이 · 사석=발밑 · 상판+항만=안벽 · 테트라포드 ✕ · 얕은 물 칸=shallows)
      → 후보(속초 1,910) → rollForageSpots(시드 · 밀도 · 간조 · 시장가 역가중 · 동해 배율 · 여름잠 · 바닥) − 고갈(타일 키) → 스팟
      → 가시성(낮: 랜턴 0 생물 / 밤: 헤드랜턴 반경) · 달아나는 녀석은 어슬렁 · 뛰어오면 튐(2회 뒤 사라짐)
      → [F](남의 잠금 · 허가 · 장화로 물에 섰나 · 안전 · 미끄러짐) → 잠금 → ForageGamePanel(core 놀이) → 이김 = 24~48h 고갈 + 퀘스트 드롭 / 놓침·포기 = 슬롯 끝까지
      → 이김: 다침 롤(맨손 · 장갑) → rollForageHarvest(법정 크기) → 미끼 갯것이면 가방 미끼 / 아니면 쿨러 · 인벤 '채집물'
      → 도감 → 어장 안 보호종이면 rollEnforcement → 압수+벌금
통발: T / 인벤 '통발 놓기' → TrapDeployPanel(통발×미끼) → 물 타일(플레이어 4타일·육지 거리 ≤3) 클릭
      → validateTrapDeployment(면허 등급·개수·수심) → 통발 1 + 미끼 1 소모 → DeployedTrap(mapId·depthM·durability)
      → wall-clock 침지 → [E] 확인 → rollTrapLoss 1회 → harvestTrap → 쿨러/인벤 → 통발 반환(내구도 0 = 파손)
```

- 어장 폴리곤은 실데이터(마을어업속초9·협동양식속초5·6). 조례 보호 5종 = 전복·해삼·성게·홍합·문어.
- 발견(도감) 기록: 채집 = `night_hunting` · 통발 = `trap` — [S20](discovery-wiki.md).

## 4. 세부과제 현황

| 과제 | 상태 | 차수 |
|---|---|---|
| 해루질 엔진·생물 DB · 통발 엔진·DB | ✅ | (초기) |
| D1 통발 결함 2건(`shellfish`·어종 타깃) | ✅ | 099 |
| D2a 통발 종류·미끼 선택 UI | ✅ `TrapDeployPanel` | 121 |
| D2b 통발 분실 배선 | ✅ `rollTrapLoss` 1회(수거 시) | 121 |
| D2c 안전 판정 배선 | ✅ `forageSafety` — 실데이터 풍속/파고(파고 2.1m 실측 차단) | 121 |
| D2d 수심·침지 실연동 | ✅ `depthAtWaterTile`(육지 거리×수심 프로필) · `baitDurationHours` | 121 |
| D3 확률 튜닝 중앙화 | 🔶 신규 시스템은 `TUNING.forage/trap` · 레거시 `NightHuntingEngine` 매직넘버 잔존 | 121 |
| D4 생물 스프라이트 | 🔶 사진 · 그림 도트 7종(갯강구 · 청갯지렁이 · 혼무시 · 해삼 · 보라성게 — `tools/pixelize_forage_photos.py`) + 미끼 한 갑 2종 + 놀이 판 그림 5종 · 나머지는 절차 도트 | 225 · 226 · 228 — [워크로그](../03-WORKLOG/2026-10-07-228-worm-art-stat-labels.md) |
| D5 RegionFieldScene 진입 동선 | ✅ 인-맵 [F]·T (122차 E→F) — 별도 씬 없음 | 121 |
| **통발 어획물의 sink(위판)** | ✅ 직판장 위판 창구 — 계원 자격 시 경매 출품 | 147 — [S6](economy-data.md) |
| 스킬 배율 훅(스팟 반경·균형·맨손 부상·문어 도주·통발 분실) + 어촌계원(`fishery_member`) 조례 면제 | ✅ | 122 — `attemptForage(…, mods)` · `rollTrapLoss(…, riskMult)` 기본값은 종전과 동일 |
| F1 어촌계 어장 실폴리곤 | ✅ `extract_fishfarms.py` → 오버레이·진입 안내 | 121 |
| F2 강원 조례 재현 | ✅ 5종 금지·적발/압수/벌금·판매 금지·산란기 도루묵·스쿠버 없음 | 121 |
| F3 야간 실검증 | ⬜ 실시간 시계라 낮에만 검증 — 야간 생물·랜턴 반경 미검증 | — |
| 물때 시간창 · 물살 | ✅ 해루질 = 간조 2시간 전 ~ 1시간 뒤 스팟·성공 가산 + 들물 경고(동해 제외) · 수위 = 물때 흐름 기반 · 통발 = 침지 평균 물살 0.85~1.15 · 동해 감쇠 | 205 — [워크로그](../03-WORKLOG/2026-10-04-205-tide-species-genre.md) |
| F4 접근 확장 — wade | ✅ 장화 · 완만한 물가 한 칸 · 1m · 물 생물은 그곳만 (dive는 ⬜) | 224 — [워크로그](../03-WORKLOG/2026-10-06-224-foraging-realism-bait-economy.md) |
| 현실화 P1 — 갈래 · 놀이 5종 · 놓침 = 사라짐 · 달아나기 · 다침(장갑) · 갯것 미끼 · 웹 조사 반영 | ✅ — 225 피드백: 갯강구 > 쫄장게 난이도 · 성게 맨손 75% · 떼기 판 위에서 본 껍데기 그림 | 224 · 225 |
| 법정 수치(금어기 · 금지체장 · 금지체중) 정본 대조 | ✅ 날짜 단위 금어기(`ClosedSeason`) · 제주 덮어쓰기(`resolveLegal`) · 대문어 600g · 벌금은 229차에 정액 1천만원 | 227 — [워크로그](../03-WORKLOG/2026-10-06-227-legal-closed-season-dates.md) |
| 패류독소 봄철 채취 금지 → 식중독 | ✅ 해역별 봄 발령(`ShellfishToxin`) · 아이템 `toxin` 보라 물방울 · 익혀도 식중독 60% · 냄비 · 요리 승계 · 라디오 · 표지판 · 채널 고지 | 229 — [워크로그](../03-WORKLOG/2026-10-07-229-law-feedback-krill-economy-board-art.md) |
| 벌금 1천만원 · 파산 엔딩 · 어촌계 표지판 · 게 암수 · 외포란 자동 방생 | ✅ `rollEnforcement` 정액 · `beginBankruptcy`(혼잣말 → 암전 → 처음부터) · 보호 어장마다 표지판([F] 읽기 · 첫 읽기 가이드 · `sign.farm_read`) · `ForageHarvest.sex/berried` | 229 |
| 놀이 판 그림 고급화 · 그림 가이드 | ✅ 구운 바닥 4종(`ForageBoardArt`) · 손 도구 24x24 도트 5종 · 1자형 혼무시 · 이김 연출 · `TourStep.picture` | 229 |
| 단서 보기(숨구멍 · 배설 둔덕) | ⬜ 기획 §2 A — 동해엔 갯벌이 거의 없어 후순위 | — |

## 5. 잔여·차기 (착수 로드맵)

> ⚠ **"통발 D2"는 이미 끝난 라벨이다**(147차 확인). §4 표의 D2a~D2d는 전부 **✅ 121차**이고,
> PLAN·CLAUDE.md에 남아 있던 `통발 심화(D2) ← 현재 지점`은 121차 이전에 쓰인 스테일 표기였다.
> 통발에서 막혀 있던 유일한 것(잡은 것을 팔 데가 없다)은 **147차 위판**으로 해소됐다.
> 아래 1~5가 통발·해루질 계통의 실제 잔여다.

1. **야간 검증 + F8 조율**(밀도·성공·적발·벌금) — 야간 세션 또는 시각 오버라이드 dev 훅.
2. **D4 실사 스프라이트** 12종(스킬 `asset-pipeline`) — 키 `forage_<id>` 교체만.
3. **dive 접근** — 수경/스노클·스쿠버 + 스쿠버 = 조례상 비어업인 금지라 면허/어업인 루트 설계 필요(wade는 224 ✅).
4. 레거시 씬·legacy 쿨러 폐기(사용자 결정) · HUD 로그 영어 규칙 재수집(120차 전수 하네스) · 미니맵 스팟/어장 표시.
5. 채집물 sink = 불요리 대과제(S15) — 섭국·보말죽·성게알 등 레시피.
6. **해루질 현실화 남은 것** — 단서 보기 · 생물 그림(놀이 판용 큰 몸 — 224 §6) · ~~패류독소 봄철 금지 · 꽃게 외포란(성별)~~ 229 ✅ ·
   생물별 크기 밴드 · 「조용한 걸음」(`drv_nightride`) 자물쇠를 풀어 달아나기 놀람 반경에 연결.
7. **232 · 233차 멀티 공유** — 채집 스팟은 같은 세션에서 모두 같고(면허는 표시에서만 거름), 누가 손대면 **채집 중 잠금**(남 화면 반투명 · [F] 거부),
   잡으면 그 자리가 **24~48시간** 빈다(`WorldDepletionStore` 세이브 + 서버 세션 저장) · 놓치면 그 슬롯 끝까지 · 과증식은 재입장해도 수거분이 안 살아난다.
   남은 것: 달아나는 생물 움직임 동기화 · 채집 드롭 퀘스트 물건은 4건(N13-2 · N18-5 · N02-5 · N22-3).
8. **229차 잔여** — ~~「미끼용 크릴」 그림~~ 230 ✅ · ~~파산 뒤 「타이틀로」의 마지막 저장분~~ 231 ✅(파산 즉시 세이브 삭제) ·
   종별 외포란 시기 · 바칸의 쿨러 대비 차별(해수 · 산소).

## 6. 함정·불변조건

0. **필드 스팟 텍스처 키와 아이템 아이콘 키를 겹치지 않는다**(168차) — 166차가 사진 5장을 `forage_<id>`로 싣자 `ensureTextures`가
   같은 키의 절차 도트를 건너뛰고 `setScale(1.5)`가 1254px 사진을 **1881px**로 필드에 그렸다. 스팟은 `forage_dot_<id>` + `SPOT_MAX_PX` 안전망.
1. **`targetCategories`와 생물 DB 카테고리는 같은 유니온이어도 매칭은 데이터가 결정한다**(099) — 새 통발·생물 추가 시 실존 확인.
2. **통발 침지는 wall-clock**(`Date.now() - deployedAt`) — 오프라인 정지 규칙(쿨러류)과 반대. 마이그레이션 시 밀지 말 것.
3. `TrapCatchItem.isFishSpecies`가 쿨러 type 분기(099). 어종인데 빠뜨리면 판매가·도감이 끊긴다.
4. **`hasFishFarms` 없는 지역에서 `fishfarms.json` 로드 금지** — SPA 폴백 pageerror(`hasLights`와 같은 함정). 지역 추가 시 `extract_fishfarms.py` 실행 + 플래그.
5. **실데이터 파고가 채집을 막는다** — 파고 ≥1.5m·풍속 ≥12m/s면 `[F]`가 거부된다(정상). 하네스는 `__FIELD.tuning.forage.maxWaveM`을 올려 진행(121차 실측 2.1m).
6. **채집물 판매 금지는 3경로** — `InventoryStore.getSellPrice`(0) · `ShopPanel` 필터 · `CoolerPanel` 이송(`forageCatch`). 새 판매 경로엔 `forageCatch` 확인.
7. `TrapSpec.licenseTier/priceWon` **필수** — 통발 추가 시 누락하면 typecheck 오류(의도). 상점 아이템 id = `inv_trap_<specId>`(구세이브 백필도 이 규칙).
8. 구세이브 통발은 `mapId`가 없어 `mapId ?? spotId`로 비교 — 심리스 맵에 부표가 안 뜬다(레거시 TrapScene에서만).
9. **스팟 상한이 작으면 맵에 흩어져 안 보인다** — 후보 3,836타일에 40개면 조도 화면에 0개(실측). 상한 220·밀도 5/100.
10. i18n 규칙은 `(m, tr)`의 **`tr()`로 캡처를 재번역**해야 런타임 사전(생물 `nameEn`·지명)이 먹는다 — `EN_DICT[...]` 직접 조회는 정적 사전만.
11. **홀드 폴링 키 = 시작 키** — 122차 E→F 전환 때 `keyE.isDown` 폴링이 남아 F 홀드가 다음 프레임에 취소됐다(하네스 실측). 키를 바꾸면 `addKey`도 함께.
12. **홀드 라벨은 y−80** — 플로팅 힌트(y−40 → −62 트윈)·홀드 바(y−66)와 겹치지 않게(122차 스크린샷 실측).
13. **얕은 물은 바다 벽(`walls`)에서 빠지고 `wadeWalls`로 따로 굽힌다**(224) — `isBlockedAt`이 얕은 칸을 false로 돌려준다.
   청크를 다시 굽는 경로(생성 · `invalidateTiles` · `setArmor`)는 전부 `computeWade`를 다시 불러야 한다(안 부르면 얕은 칸이 벽도 물도 아닌 구멍이 된다).
14. **놀이 창이 닫히면 반드시 `onEnd`가 한 번 불린다**(224) — 끝나기 전에 닫히면(ESC · ✕) 「포기 = 놓침」으로 친다. 놀이 상태(`playing`)가 남으면 [F]가 영영 막힌다.
15. **시간이 밤이면 하네스가 스팟을 못 본다**(224) — 헤드랜턴이 없으면 가시성 0 → `nearSpot` null. 하네스는 `inv_headlamp`를 쥐여 줄 것.
16. **날랜 녀석은 작다**(225) — 덮치기 난이도는 `agility` 하나로 빠르기 · 덮을 자리(`sizeByAgility`) · 이어 뛰기(0.8 이상)가 함께 움직인다.
   빠르기를 올리면 셋이 같이 어려워지므로 반응 지연 봇 테스트(`RATES=1`)로 숫자를 다시 본다.
17. **놀이 판 그림은 그래픽 위에 그려진다**(225) — 떼기 틈 · 가장자리 호를 그림 안쪽에 그리면 가려진다. 호는 그림 바깥 타원으로.
18. **판 그림은 머리가 왼쪽**(225) — `forageboard_*`가 있으면 달리는 쪽(`dir > 0`)으로 `setFlipX`. 필드 도트는 뒤집지 않는다.
19. **금어기는 `day`를 넘겨야 날짜로 잰다**(227) — 문맥에 `day`가 없으면 `isClosedOn`이 **그 달에 하루라도 걸치면 닫힘**으로 본다
   (참문어 5.1~5.15도 막힘). 새 호출부는 `day: new Date().getDate()` · `regionId`를 함께 넘긴다.
   판정은 `closedFor` / `resolveLegal`만 쓴다 — `closedSeasonMonths`를 직접 읽으면 날짜 · 지역 규정이 빠진다(비만도 계산만 예외).
20. **그림 원본은 정수배로만 줄인다**(228) — `save_hires`가 긴 변 720을 넘으면 BOX 정수배 축소. 226차 그림(해삼 · 보라성게)은
   `max_px=None`으로 원본 크기를 지킨다 — 도구를 다시 돌릴 때 이 예외를 지우면 그 둘의 아이콘이 바뀐다.
21. **벌금은 정액이고 호출부가 파산을 가른다**(229) — `rollEnforcement`는 돈을 깎지 않는다. 적발 경로를 새로 만들면
   `coins < fineWon` → `host.bankrupt()` 분기를 같이 둬야 한다(안 두면 재화가 음수로 내려간다).
22. **독 표식은 아이템 필드 하나로 흐른다**(229) — `toxin`이 쿨러(`CoolerFish.toxin`) · 냄비(`DeployedStove.toxin`) · 완성 요리까지 승계된다.
   새 보관 · 변환 경로(수조 · 건조 등)를 만들면 그 필드를 잇지 않는 한 독이 사라진다.
23. **언 크릴은 두 군데서 막는다**(229) — `InventoryStore.unpack`(포장 뜯기)과 `UtilizationPanel.finishChumDrag`(밑밥 투입).
   판정 키는 `chumKind === 'krill' && condition === 'frozen'` — 곽크릴은 `chumKind`가 없어 언 채로 뜯힌다(의도).
24. **표지판은 어장 꼭짓점 3칸 안의 걷는 뭍에만 선다**(229) — 뭍이 없으면 그 어장은 표지판이 없다. 지역 추가 시 `forage.signs.length`를
   어장 수와 대조할 것(속초 3/3).
25. **가이드 그림은 단계마다 새로 만든다**(229) — `TourStep.picture` 콜백은 가벼워야 한다(바닥은 `ensureForageBed`가 한 번 굽고 캐시).
   `GuideTour.go()`가 전 단계 그림을 파괴하므로 콜백이 같은 객체를 돌려주면 안 된다.
