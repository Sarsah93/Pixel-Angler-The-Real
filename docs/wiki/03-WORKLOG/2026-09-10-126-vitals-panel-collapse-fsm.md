# 126차 — 성장·생존 P3·P4: 상태 패널 개편 + 기절·사망 FSM + UI 이모지 금지 규칙

> 2026-09-10 · 스펙 `.agents/PROGRESSION_SURVIVAL_SPEC.md` §6·§7 (구현 순서 P3·P4)
> 선행: [125차 생존 지표·상태이상](2026-09-10-125-vitals-status-effects.md)

---

## 1. 배경

125차(P2)에서 허기·수분·상태이상이 core와 세이브까지 들어갔지만 **화면에 나오는 곳이 없었다**.
`tickVitals`가 반환하는 `fainted` 신호도 소비처가 없어 피로도가 최대치에 닿아도 아무 일이 없었다.

사용자 지시(원문):

> 계속해서 P3와 P4 진행해줘. 아 그리고, UI 디자인 및 아이콘 같은 경우,
> 너무 클로드 특유의 특수문자 같은 걸 절대 넣지 않았으면 해. 개발 규칙에도 포함시켜.

즉 이번 차수는 **P3(상태 패널) + P4(기절·사망) + UI 특수문자 금지 규칙 문서화** 3건이다.

---

## 2. 원인 / 판단 근거

### 2-1. UI 이모지 — 규칙 범위가 좁았다

15차 규칙은 "**텍스트 접두사** 이모지 금지"였다. 그래서 125차에 신설한
`StatusEffects.ts`의 `icon` 필드가 그 규칙을 우회해 이모지 11개(🤢☠️💦🩸🦴🥶🤧🌡️🔥💤😵)로 들어갔다.

이모지는 OS 폰트가 그리는 **컬러 벡터**라 2px 그레인 도트 톤과 섞이지 않는다(106차 입자 정합 실측과 같은 이유).
규칙을 **아이콘·디자인 전체**로 확대하는 것이 맞다.

### 2-2. 상태 패널 — '대' 단계에 넣을 자리는 있었다

실측: '대' 레이아웃 컨텐츠 높이 176px 중 배지 첫 행이 `CONTENT_Y + 106`(= y 142)에서 시작,
시계 하단이 `CONTENT_Y + 92`(= y 128)라 그 사이 14px만 여백이었다.

경험치 바(6px)를 피로도 아래(+52)에 끼우면 날짜·시계가 각 14px씩 밀리고,
배지 첫 행을 `+122`로 내리면 시계 하단(+106) ↔ 배지 상단(+109)에 3px 여유가 남는다 →
**패널 높이(196px)를 늘리지 않고 수용 가능**. 허기·수분은 좌측이 아니라 **우측 컬럼**(날짜·시계 오른쪽 빈 자리)에 둔다.

---

## 3. 변경

### 3-1. 신설

| 파일 | 내용 |
|---|---|
| `packages/client-pc/src/ui/CollapseOverlay.ts` | 기절·사망 연출 오버레이 (`playCollapse` · 눕기 · 비네트 · 팝업) |

### 3-2. 수정 — 규칙 문서

| 파일 | 내용 |
|---|---|
| `.agents/AGENTS.md` §4 | 「UI 특수문자·이모지 금지」 절 신설 — 허용 대안 3종 · 예외 4종 · 레거시 잔재 명시 |
| `.agents/AGENTS.md` §8 | 금지 사항 8번 신설(기존 8번 `git commit` 금지는 9번으로) |
| `CLAUDE.md` | 절대 규칙 요약 7번 추가 |
| `.claude/skills/ui-panel/SKILL.md` | 검수 체크리스트 5번을 아이콘 전체로 확대 |

### 3-3. 수정 — core

| 파일 | 내용 |
|---|---|
| `types/StatusEffects.ts` | `icon: string`(이모지) → **`badge: StatusBadge`**(`{ ko 1자, en 2자, color }`) 11종 · `STATUS_CURE_LABEL`(Ko/En) · `statusRemainMs()` 신설 |
| `config/tuning.ts` | **`collapse` 섹션 신설** — dimMs 500 · popupDelayMs 2000 · faintFatiguePct 80 · deathCoinLossRate 0.15 · deathDropInventory 0 · deathReviveHpPct 50 · deathReviveVitalsPct 50 (하드코어 프리셋은 주석으로 보존) |
| `index.ts` | `StatusBadge`·`STATUS_CURE_LABEL`·`statusRemainMs` export |

### 3-4. 수정 — client (P3 상태 패널)

`packages/client-pc/src/ui/RegionHud.ts`

- **`barRects()` 신설** — 게이지 rect **단일 소스**. 렌더(`updateStatus`)와 호버 히트(`createVitalHits`)가 공유해
  레이아웃을 고쳐도 툴팁 판정이 어긋나지 않는다.
- '대' 배치: 체력 `+12` / 피로도 `+32` / **경험치 `+52`(6px, 좌측 라벨 `Lv.n`)** /
  우측 컬럼 **허기 `+68`·수분 `+84`**(라벨 38px + 바 84px → 우측 끝 324 ≤ 패널 안쪽 326).
- 날짜 `+52→+66` · 시계 `+68→+82` · `BADGE_ROW0_Y` `+106→+122` ('대' 전용 — '중/소'는 분기로 무변경).
- **호버 팝업**(`showValueTip`) — 라벨(사전 대상 Text)과 수치(숫자만 Text)를 **분리 생성**(119차 i18n 규칙).
- **상태이상 스트립**(`refreshStatusStrip`) — 패널 밖 하단 좌정렬 · 20px 색 칩 + 1~2자 라벨 ·
  4개 초과 시 둘째 줄 · 호버 툴팁(이름 · 남은 시간 또는 치료 수단 · 설명, Ko/En) · 목록 변화 시에만 재생성.
- 허기·수분 임계(20%) 미만이면 바·라벨 경고색 — **상시 숫자 없이 색으로 알린다**.

`packages/client-pc/src/i18n/en.ts` — 게이지 라벨 4 + 126차 문자열 11 + 규칙 4종.

### 3-5. 수정 — client (P4 기절·사망)

| 파일 | 내용 |
|---|---|
| `store/GameState.ts` | `tickVitals` 반환에 **`dead`** 추가 · `reviveFromFaint()`(피로도 80% 캡 + 탈진) · `reviveFromDeath()`(재화 15% · 상태 전부 해제 · **탈진 먼저 부여 후** HP 50% 산출) |
| `scenes/RegionFieldScene.ts` | `beginCollapse(kind)` · `goHomeAfterDeath()` · `collapsing`/`collapseCleanup` 필드 · `uiBlocked`에 `collapsing` 편입 · create/shutdown 리셋 |
| `scenes/FirstPersonFishingScene.ts` | 낚시 중 `fainted`/`dead` → `failAndExit` 후 **필드 씬이 연출 전담** |

연출: 스프라이트 90° 회전 + 호흡 스케일 → **방사형 그라데이션 텍스처 1장 + 주변 검은 사각 4장**으로 비네트(0.5초)
→ 2초 후 팝업 → 버튼 1개.

---

## 4. 구조상 위치

- 시스템 **S21 성장·생존** → 세부과제 **P3 상태 패널 UI** / **P4 기절·사망 FSM**.
- 층: **렌더(HUD·오버레이)** + **판정 일부**(`GameState.reviveFrom*` = 페널티 규칙).
  core 계산식은 건드리지 않았다 — `Vitals.ts`는 무변경, `StatusEffects.ts`는 표현 필드만 교체.
- 파급: `StatusEffectDef.icon` 제거는 **소비처가 없었으므로**(P3에서 처음 소비) 회귀 없음.

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 게이지·툴팁·스트립·기절·사망 | 실렌더 하네스 `scratchpad/verify_p3p4.mjs` | **29/29 PASS** · pageerror 0 |
| '대' 게이지 5종 패널 수용 | rect 우측 끝 실측 | hp/fatigue/xp 326 · hunger/hydration 324 ≤ 326 |
| 타이틀바 규칙 | 첫 컨텐츠 y | 48 ≥ 36(밴드 하단) |
| 시계 ↔ 배지 겹침 | 실측 | 시계 하단 140 ≤ 배지 상단 145 |
| '중/소' 회귀 | barRects 키 | 두 단계 모두 `hp,fatigue` (경험치·허기·수분 없음) |
| 영문 | `setLocale('en')` 후 라벨·칩 | 한국어 잔존 0 · 칩 `BL FR CH FP EX` |
| 기절 | 피로도 최대 → beginCollapse | 조작 차단 · angle −90 · 2초 후 팝업 · 일으키기 = 피로도 80.0/100 · 탈진 부여 |
| 사망 | `reviveFromDeath` | 100,000 → 85,000(−15,000) · HP 45/90(=50%) · 허기·수분 50 · 인벤 103종 유지 |
| 빌드·타입 | `pnpm run build` / `typecheck` | **3/3** · **0 오류** |

스크린샷(육안 확인): `scratchpad/p3_status_full_ko.png` · `p3_status_full_en.png` ·
`p3_status_min_ko.png` · `p4_faint_dim.png` · `p4_faint_popup.png`.

⚠ 육안 확인에서 **영문 'Hunger'가 바를 침범**하는 것을 발견(라벨 폭을 한국어 2자 기준 30px로 잡았다) →
38px로 확대해 재검증(119차 "영어가 길어지면 한국어에서 안 겹치던 것도 겹친다" 규칙 재현).

---

## 6. 잔여

- **눕기 전용 스프라이트**(눈 감은 2프레임 man/girl) — 에셋 대기.
  현재는 기존 idle을 90° 회전 + 호흡 스케일한 **플레이스홀더**(`CollapseOverlay.ts` 주석 명시).
- **레거시 이모지 아이콘 정리** — `InventoryStore` 시드·`ShopCatalog` 아이템의 `icon` 이모지는
  `iconTexture` 폴백으로 남아 있다(수백 건). 백로그 A로 등록, 새 아이템은 텍스처 키로만 등록한다.
- 사망 시 **씬 전환 부활**은 홈타운 필드 재시작으로 처리 — 침대 앞 실내 스폰은 P5 이후 병원·치료와 함께.

---

## 7. 위험 · 부작용

- **부활은 저장하지 않는다** — `markDirty()`만 호출. 침대 저장 정책(`TUNING.save.allowedTags`)을 건드리지 않았다.
  사망 페널티를 세이브 재로드로 되돌릴 수 있으나 이는 기존 저장 정책의 성질이다.
- `collapsing`이 `uiBlocked`에 들어가므로 **연출 중에는 `tickVitals`도 멈춘다**(update의 가드 뒤에 있다) —
  의식 없는 동안 허기·수분이 진행하지 않는 것은 의도.
- 씬 재시작·shutdown에서 `collapseCleanup`을 부르지 않으면 **조작이 영구 잠긴다** → create/shutdown 양쪽에 리셋.
- ERASE 블렌드로 비네트 구멍을 뚫으면 **게임 화면까지 지워진다** → 그라데이션 텍스처 + 사각 4장 방식으로 우회.

---

## 8. 후속 반영

- [x] 워크로그 신설(이 문서) · `03-WORKLOG/README.md` §3.1 인덱스
- [x] `02-SYSTEMS/progression.md` §4 P3·P4 상태 · §5 잔여 · §6 함정 2건
- [x] `04-BACKLOG.md` — H 진행 갱신 · 레거시 이모지 정리 항목 추가
- [x] `.agents/AGENTS.md` §4·§8(규칙) · §9(요약) · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] `.claude/skills/ui-panel/SKILL.md` 검수 항목 확대
