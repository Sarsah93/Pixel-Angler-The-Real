# 127차 — 성장·생존 P5·P6: 날씨 캐스팅 물리 + 스킬 실배선 13종 + 조준 홀드 가이드

- **날짜**: 2026-09-10
- **시스템**: S21 진행·성장(스킬 배선) · S1 낚시 루프(캐스팅·조류·밑걸림) · S10 UI 프레임워크
- **스펙**: `.agents/PROGRESSION_SURVIVAL_SPEC.md` §3-1~§3-3 (P5·P6)
- **검증**: core 28/28 · 실렌더 19/19 · 빌드 3/3 · typecheck 0 · pageerror 0

---

## 1. 배경

사용자 지시(원문):

> 계속해서 P5와 P6 진행해줘.
> 아 그리고, 캐스팅 산포 관련해서 추가하고 싶은 부분이 있어.
> 1) 3m/s 이상 바람 많이 부는 날 등 날씨 조건에 따라 투척 거리 줄어들고 투척 지점 부정확하게 바람 방향에 밀리도록 물리 구현.
> 2) 그걸 스킬로 어느 정도 보완할 수 있도록 하되, 단, 과하게 하는 건 아니고 **아주 미비한 정도**
> 3) 또한, 비오는 날은 급류가 많으니 채비 손실 확률 올리거나 바다 유속 빨라서 채비가 평소보다 더 자주 이동하는 물리 등 고려.
> 이런 부분은 인게임 내 반영된 요소와 게임성을 최대한 고려하되, 너가 생각했을 때, 합리적인 판단으로 진행해줘.

스펙 P5 = 스킬 효과 실배선 1차(생존 지표·상태이상 키 + 캐스팅 산포·바람),
P6 = 캐스팅 개편(카메라 팔로우 · 조준 홀드 가이드 · 산포 모델).
사용자 지시 3건이 P6의 "산포"를 **날씨 물리**로 확장하는 형태라 한 차수로 묶었다.

---

## 2. 원인·설계 판단

버그 수정이 아닌 신규 구현이지만, 구현 중 **실측으로 확정한 설계 오류 1건**이 있다.

**날씨 비거리 배율을 `strength`(완력)에 곱하면 거의 효과가 없다.**
`launchCast`의 초기 수평 속도는 `170 + power×230 + strength×6`이라
완력 12의 기여는 72 / 472 = **15%뿐**이다. `distanceMult 0.73`을 완력에만 곱하면
실제 비거리는 **466px → 431px(−7%)** 로만 줄어, HUD 로그의 "맞바람 — 비거리 27% 감소"가 거짓말이 된다(실측).

→ `CastLaunchParams.speedMult`를 신설해 **수평 속도 전체**에 곱하도록 교체.
재측정 **466px → 332px(−29%)** 로 표시 배율과 실제가 일치한다.

---

## 3. 변경

### 신설

| 파일 | 내용 |
|---|---|
| `packages/core/src/simulation/CastWeather.ts` | 날씨 → 캐스팅/조류/밑걸림 계수 단일 소스. `computeCastWeather` · `castScatterRadius` · `applyCastScatter` · `windUnitFromBearing` · `rainIntensityOf` · 라벨 2종 |
| `packages/core/src/config/tuning.ts` `castWeather` | 13키(임계 3m/s · 비거리·산포·횡풍 계수 · 보정 상한 · 강수 게인) + **F8 슬라이더 8종** |
| `packages/core/src/simulation/CastingPhysicsEngine.ts` | `CastLaunchParams.speedMult` · **`solveCastPower`**(비행 시뮬 이분 탐색으로 목표 거리 → 파워 역산) |
| `ShopCatalog.ts` `GUILD_CORNER` | 리스펙 아이템 **'조업 재교육 이수증'**(20만원 · icon `'증'` — 이모지 없음) |

### 수정

| 파일 | 내용 |
|---|---|
| `SkillDatabase.ts` | `fish_scatter` `cast_scatter −22%/랭크`(선형 엔진 재표현 — 3랭크 0.34) · `fish_wind` `wind_comp +0.10/랭크`(**0.40 → 0.10, 사용자 "아주 미비"**) · 생활/채집 9종 `wired: true` → **실배선 13 → 24/83** |
| `GameState.ts` | `tickVitals`에 스킬 배율 합류(허기·갈증·피로 회복·면역·내한) · `sleepRecover` × `sleep_recovery` · **`rollStatus`**(상태이상 확률 × 면역력) · **`resetSkills`**(리스펙) |
| `RegionFieldScene.ts` | `castWeather()`/`windForce()` · 발사·미리보기·역산 **동일 계수** · 착수 무작위 산포 · **조준 홀드 400ms 가이드**(필요 파워 눈금 / 사거리 초과 블록) · 산포 링 · 바람 화살표 · **비행 카메라 팔로우/복귀** |
| `FirstPersonFishingScene.ts` | `castWx` → `tideBase`·`tideStrength`(유속) · `snagMult` 2곳(밑걸림·채비 손실) |
| `ForageSystem.ts` | 부상 3종 → `rollStatus` · 채집 홀드 시간 ÷ `forage_speed` |
| `InventoryPanel.ts` | `skillReset` 아이템 사용 → 확인창 → `resetSkills` · 식중독 롤 `rollStatus` 경유 |
| `ButcheryPanel.ts` | 회뜨기 수율에 `fillet_yield` 반영 |
| `i18n/en.ts` | 리스펙 아이템·바람/강수 라벨 + 규칙 5종(맞바람 % 캡처 재번역 포함) |
| `HelpContent.ts` · `i18n/en_help.ts` | 낚시 `cast-scatter` 토픽 **planned → ready**(3페이지 — 산포·조준 가이드 / 바람 3m/s / 비 오는 날) + 영문 10문구 |

---

## 4. 구조상 위치

`S21 진행 → 스킬 효과 실배선` + `S1 낚시 루프 → 캐스팅` 두 시스템에 걸친다.

- **계약층**: `CastWeatherEffect`(날씨 → 게임 계수) · `CastLaunchParams.speedMult`
- **판정층**: `computeCastWeather`/`applyCastScatter`(core, 순수) — 씬은 소비만
- **렌더층**: 조준 가이드·산포 링·바람 화살표·카메라 팔로우(RegionFieldScene)

날씨 원본은 기상청 단기예보(`ExternalDataStore.getKmaWeather`)이고,
해양기상은 폴백이다. **씬은 계수를 직접 만들지 않는다** — 전부 core 한 함수를 통과한다.

---

## 5. 검증

### core 28/28 (`scratchpad/verify_p5p6_core.mjs`)

| 항목 | 결과 |
|---|---|
| 3m/s 이하 = 무영향 | 2.9m/s → `distanceMult 1 · scatterMult 1 · active false` |
| 맞바람 / 뒷바람 / 옆바람 (9m/s) | ×0.73 / ×1.12 / ×1.00(산포 ×1.6) |
| 풍속 단조성 | 3→12m/s: 1 → 0.91 → 0.82 → 0.73 → 0.60 (하한 0.55 준수) |
| **바람 읽기 만렙 보정** | 손실의 **20%**만 회복 (0.73 → 0.78) — "아주 미비" 충족 |
| 보정 상한 | `windComp 5` 입력 = `windCompCap 0.30`과 동일 결과 |
| 비 / 소나기(8mm) | 유속 ×1.27·밑걸림 ×1.33 / ×1.45·×1.55 |
| 정투 3랭크 | 산포 60px → 20.4px (34%) · 2000/2000 반경 내 |
| 파워 역산 | 200/350/450px 오차 <3% · 사거리 초과 = `null` |
| 스킬 실효과 | 소식가 2랭크 허기 90 → 91.6 · 쾌면 2랭크 침대 회복 60 → 70 · 면역 3랭크 ×0.76 |
| 트리 Σ | **200pt 불변**(perRank만 조정) |

### 실렌더 19/19 (`scratchpad/verify_p5p6_render.mjs`)

| 항목 | 결과 |
|---|---|
| **실비행 비거리** | 무풍 466px → **맞바람 332px(−29%)** · 뒷바람 507px |
| 씬 계수 경로 | 기상청 스텁 → `castWeather()` → ×0.73 (실데이터 배선 확인) |
| 조준 가이드 | 홀드 400ms → 필요 파워 눈금(게이지 cmd 16 → 24) |
| 산포 링·바람 화살표 | 바람 읽기 1랭크에서 화살표 추가(aimG cmd 118 → 146) |
| 카메라 | 뷰포트 밖 이탈 시 `scrollX 0 → 1000` 추적 · 복귀 시 `startFollow` 재장착 |
| 비 | 유속 ×1.27 · 밑걸림 ×1.33 · **`tideBase` 0.33 → 0.41**(1인칭 실조류) |
| 리스펙 | 상점 등재 · icon `'증'`(이모지 0) · 랭크합 5 → 0, 5pt 환급 |
| 로케일 | ko/en 4문구 정합 (`Headwind — distance 27% shorter` 캡처 재번역) |
| 도움말 | `cast-scatter` ready 3페이지 6줄 · en 미번역 **0/10** · F1 패널 실렌더(ko/en) |

스크린샷 육안 확인: `scratchpad/p6_aim_zoom.png` — 차지 게이지 위 **노란 필요-파워 눈금**,
착수 마커(육지 = 빨강) + **산포 링**, 마커에서 **바람 진행 방향 화살표**(120°에서 불어옴 → 좌상단). 이모지 0.

---

## 6. 잔여

- **바람 실데이터 편차** — 홈타운은 기상청 격자가 없어 풍속 0으로 떨어진다(랜덤 날씨만 사용).
  지역 필드(속초 등)에서는 실측 풍속이 그대로 들어간다. 홈타운 풍속 랜덤화는 필요해지면 별도 과제.
- 파고(`waveHeightM`)와 캐스팅의 연동 없음 — 현재 파고는 채집 차단에만 쓰인다.
- `TUNING.castWeather` 13키는 **mockup 초기값** — 실플레이 체감 조율은 F8 슬라이더로.
- 스킬 배선 24/83 — 제작 12종은 P7, 농사는 농장 단계, 요리 계열은 불요리 단계.
- 리스펙 아이템은 상점 판매만 — 퀘스트 보상 지급 경로는 P8.

---

## 7. 위험·부작용

- **`speedMult` 도입으로 캐스팅 비거리 산식이 바뀌었다.** 무풍(`distanceMult 1`)에서는 완전히 동일하지만,
  바람이 부는 지역 필드에서는 종전보다 비거리 변화폭이 커진다(의도 — 사용자 지시 1).
- 강수 시 조류(`tideBase`)가 최대 ×1.45까지 오른다 → 드리프트가 빨라지고 밑걸림 타이머도 빨라진다.
  1인칭 난이도가 비 오는 날 실제로 올라간다(의도). 과하면 `rainCurrentGain`/`rainSnagGain` 슬라이더로.
- 조준 홀드 가이드는 **정투 1랭크 해금** — 미습득 플레이어의 화면은 종전과 동일(회귀 0).
- 카메라 팔로우는 `stopFollow` → `startFollow` 왕복이라, 복귀를 빠뜨리면 카메라가 플레이어를 놓친다.
  `clearCastFlight`·resume 핸들러·착수 후 딜레이 3경로에서 `restoreCamFollow()`를 부른다.
- ⚠ **검증 함정 2건(스킬 `verify-render`에 반영)**: ① core를 다시 빌드해도 **vite dev 사전 번들**
  (`node_modules/.vite`)이 옛 core를 물고 있어 "배선은 맞는데 수치가 안 바뀐다"로 보인다(실제로 1회 오진).
  ② 실비행 측정은 **앞 캐스팅 회수 트윈의 `onComplete`가 새 비행 오브젝트를 지운다** — 측정 전 `tweens.killAll()`.

---

## 8. 후속 반영

- [x] 워크로그 1건(이 문서)
- [x] `03-WORKLOG/README.md` 인덱스
- [x] `02-SYSTEMS/progression.md` §4·§5·§6 · `02-SYSTEMS/fishing-loop.md` §4·§6
- [x] `04-BACKLOG.md` H(성장·생존) 갱신
- [x] `.agents/AGENTS.md` §9 · `.agents/IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 요약
- [x] `.agents/PROGRESSION_SURVIVAL_SPEC.md` P5·P6 완료 표기 + ⚖ 결정 3건
