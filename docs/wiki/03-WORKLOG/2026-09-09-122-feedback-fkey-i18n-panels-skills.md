# 122차 — 121차 피드백 5건: 상호작용 F 키 · 영문 잔여 · 팝업 ✕ 통일 · HUD 명패 · 면허/스킬/일지 패널 복원

| | |
|---|---|
| **날짜** | 2026-09-09 |
| **시스템** | `UI` `i18n` `해루질·통발` `진행(면허·스킬·일지)` `필드` |
| **트리거** | 사용자 피드백 5건(스크린샷 6장) — 121차 직후 |
| **커밋** | 미커밋 (커밋 대기 — 121차와 함께) |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

121차(인-맵 채집·통발) 직후 사용자가 스크린샷 6장과 함께 5건을 지시했다.

1. **상호작용 단축키 E → F** — "F 키에 할당된 액션이 없으며, E는 현재 장비창과 혼용되고 있으므로, 수정".
2. **영문화 미비** — 도감 조과기록 출조지 필터(거제 방파제 …) · 해양생물 카드 "야간 해루질·심화 면허" ·
   어종 카드 "야행성" · 월드맵 지역 선택 화면 설명(지역 설명·구역 desc·details·밑걸림 라벨).
3. **팝업 창 디테일**(출처 화면) — 엣지에 걸린 버튼 제거, 닫기는 **우측 상단 ✕로 통일**(다른 팝업도 비교 적용),
   창 맨 아래 글자 잘림·밀림 수정.
4. **영문 HUD 텍스트 이탈** — 타이틀 명패 "Hometown (Home)"이 명패 폭을 넘었다.
5. **면허창(L)·스킬창(K)·일지(J) 팝업 및 단축키 복원** — 5.1 면허 = 토지 이용(집·농지)·통발·어업(배 운전·수협 권한·
   인근 낚시 권한)·해루질 등 / 5.2 스킬 = 도움말 라이브러리처럼 카테고리 → 우측 확장 트리, low-cost 스킬 먼저 활성화 후
   확장, 루트 1~2개 독립/병렬, 레벨당 스킬 포인트, 카테고리 농사(활성화 막기)·낚시·경제·운전·생활·기타 /
   5.3 일지 = 스토리 라인 + 메인/서브 퀘스트, 도움말 라이브러리 구조를 따르되 합치지 말 것.

## 2. 원인 — 무엇이 문제였나

- **E 혼용**: `keydown-E` 한 핸들러가 오브젝트 > 건물 > 채집 > 통발 > **장비창** 순으로 분기해, 스팟·건물 옆에서는
  장비창이 열리지 않았다(121차 구조). F는 미할당.
- **명패 이탈**: `RegionFieldScene` 타이틀 명패가 **한국어 폭으로 1회만** 그려지고 `setLocale` 뒤 재배치되지 않았다.
  `Text.setText` 훅이 글자만 바꾸므로 명패 Graphics는 그대로였다.
- **영문 잔여**: 도감 라벨('야행성'·'주야 해루질'·'심화 면허'·스팟 필터)·지역/구역 설명(`RegionDef.description`,
  `RegionAreaNode.desc/details`)·밑걸림 라벨이 사전에도 데이터에도 없었다.
- **L/K/J**: 레거시 `FieldScene`에만 있던 `LicensePanel`(고정 목록 — 10개째부터 조용히 누락)이 유일했고,
  스킬·일지 패널은 존재하지 않았다.
- **검증 중 추가 발견 3건**(하네스 실측):
  - 채집 홀드가 `keyE.isDown`을 폴링해 **F로 시작한 홀드가 다음 프레임에 즉시 취소**됐다(E→F 변경 누락).
  - `openPopup`이 새 팝업을 밴드 최상단으로 올리지 않아 **스킬(892) 위에 일지(891)가 통째로 가려지고**, ESC가
    LIFO가 아니라 depth 순(K → J → L)으로 닫혔다.
  - 금액 규칙 `[/^(.+)원$/, '₩$1']`이 **'국립해양측위정보원' → '₩국립해양측위정보'** 로 잘랐다(출처 화면 실측).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/types/Skills.ts`](../../../packages/core/src/types/Skills.ts) | `SkillCategoryId`·`SkillEffectKey`·`SkillDef{tier,maxRank,costPerRank,requires,effect,wired}`·`SkillRanks`·`skillPointsForLevel`(레벨×1) |
| 신설 | [`core/db-schema/SkillDatabase.ts`](../../../packages/core/src/db-schema/SkillDatabase.ts) | 카테고리 6(낚시·채집/통발·경제·운전/이동·생활·**농사=잠김**) · 스킬 ~40(배선 13 · 나머지 `wired:false` '예정') · `skillMult/skillBonus/skillPrereqsMet` |
| 수정 | [`core/types/License.ts`](../../../packages/core/src/types/License.ts) | `LicenseCategory` 6군 + 신규 7종(원투·항만 제한구역·상업 통발·주택 부지·농지·선박 운전·어촌계원) · `nameEn/descriptionEn/plannedNote` |
| 수정 | `core/db-schema/RegionDatabase.ts` · `core/types/WorldMap.ts` · `db-schema/DataAttributions.ts` | `descriptionEn`(11지역) · `descEn/detailsEn`(6구역) · `providerEn/serviceEn/usageEn` + `LICENSE_LABEL_EN` |
| 수정 | [`core/simulation/ForagingEngine.ts`](../../../packages/core/src/simulation/ForagingEngine.ts) · `TrapSystem.ts` | `attemptForage(…, mods{escapeMult,injuryChance})` · `rollTrapLoss(…, riskMult)` — 스킬 배선용 |
| 수정 | [`client/store/GameState.ts`](../../../packages/client-pc/src/store/GameState.ts) | `skillTree` 세이브 · `skillPointsTotal/Available` · `canLearnSkill/learnSkill` · `skillMult/skillBonus/skillRank` |
| 신설 | [`client/ui/SkillTreePanel.ts`](../../../packages/client-pc/src/ui/SkillTreePanel.ts) | 1080×656 · 좌 카테고리 · 우 티어 열 트리(선행선) · 하단 상세 + [배우기] · 상태 5종(학습/가능/잠김/카테고리 잠김/최대) |
| 신설 | [`client/ui/JournalPanel.ts`](../../../packages/client-pc/src/ui/JournalPanel.ts) | 스토리(프롤로그 준비 중) / 메인 퀘스트(tutorial+license) / 서브 퀘스트(activity+achievement) 트리 + 상세(목표·보상·선행) |
| 재작성 | [`client/ui/LicensePanel.ts`](../../../packages/client-pc/src/ui/LicensePanel.ts) | DraggablePanel 720×500 · 카테고리 그룹 **윈도우드 목록 + 휠 + 스크롤바**(22행) · 요구사항(`checkUnlockRequirements`)·발급·`plannedNote` |
| 수정 | [`client/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | **E = 장비창 전용 · F = 상호작용**(오브젝트 > 건물 > 채집 > 통발) · L/K/J 토글 · `layoutTitlePlate` + `locale-changed` 재배치 · `openPopup`이 **새 팝업을 밴드 최상단으로**(`raiseToTop`) · 스킬 배율(달리기·자전거·캐스팅·흥정·판매가) |
| 수정 | `client/scenes/field/ForageSystem.ts` · `TrapFieldSystem.ts` | `[F 길게]`·`[F]` 힌트 · **홀드 폴링 키 E → F** · 스킬 배율(반경·균형·도주·분실) · `fishery_member` 조례 면제 · 홀드 라벨 y −52 → −80(플로팅 힌트와 겹침) |
| 수정 | `client/ui/DraggablePanel.ts` | `raiseToTop()` 공개 |
| 수정 | `client/scenes/CreditsScene.ts` · `AnglerLogScene.ts` | 하단 버튼 제거 → **우측 상단 ✕** · 푸터 여유(`FOOTER_H 70`, `maxScroll = contentH+24−viewH`) · 도감 ✕ + 스팟 필터 버튼 **폭 = 라벨 실측 + 14** |
| 수정 | `client/scenes/FirstPersonFishingScene.ts` · `HomeInteriorScene.ts` · `SettingsScene.ts` · `data/HelpContent.ts` | 입질 배율(`bite_chance`×악천후×야간) · 실내 F 키 · 단축키 표 F/E/L/K/J/T |
| 신설 | [`client/i18n/en_panels.ts`](../../../packages/client-pc/src/i18n/en_panels.ts) | 도감 라벨·밑걸림·면허/스킬/일지 UI·퀘스트 16종 이름/설명/보상·출처 화면 문구 |
| 수정 | `client/i18n/en.ts` · `I18n.ts` | `[E]`→`[F]` 전수 · 규칙 23건(스킬 포인트·배우기·퀘스트 카운트·`사용: …`·`라이선스  ·  URL`) · **금액 규칙 숫자만** · 런타임 사전에 면허/스킬/지역·구역/출처 데이터 합류 · `setLocale`이 `locale-changed` 발행 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- `S10 UI 프레임워크 → 팝업 공통 → ✕ 통일·새 팝업 최상단·i18n 명패 재배치` (렌더·입력 층)
- **`S21 진행(면허·스킬·일지)` 신설** → 계약(`Skills.ts`·`License.ts` 카테고리) · 데이터(`SkillDatabase`) · 판정(`GameState.canLearnSkill`) ·
  렌더(패널 3종). 스킬 효과는 **13종만 실배선**(`wired`) — 나머지는 데이터 정의만.
- `S14 해루질·통발 → 입력 F 키 · 스킬 배율 훅 · 어촌계원 면제` (판정 층 — `ForageMods`·`riskMult` 인자 추가, 기본값이 종전과 동일)
- `S20 도감` 라벨 · `S1 월드맵` 설명 EN — 데이터 필드(`descriptionEn/descEn/detailsEn`)가 정본, 사전은 라벨만.

## 5. 검증 — 무엇으로 확인했나

하네스 `scratchpad/verify_122.cjs`(Playwright · 설치 Chrome · dev 서버 재시작 후) — **41/41 PASS · pageerror 0**.

| 대상 | 방법 | 결과 |
|---|---|---|
| E 키 | 필드·스팟 옆에서 E | 장비창만 열림 · 홀드 없음 · 재입력 닫힘 |
| F 홀드 | 스팟 텔레포트 → `keyboard.down('F')` | 홀드 시작(900ms·집게) · **유지 중 지속**(keyF 폴링) · 떼면 취소 · `devResolveNow` 완료 |
| L/K/J | 키 토글 · 3개 동시 → ESC×3 | popupStack 편입 · **LIFO J→K→L**(수정 전 K→J→L) · 일시정지 미열림 |
| 스킬 | `__GS` Lv5 → `learnSkill('fish_cast')` | 포인트 5 → 4 · 랭크 1 · `skillMult('cast_distance')` 1.06 · 농사 `이 카테고리는 아직 잠겨 있습니다` |
| 면허 | 휠 스크롤 | `scroll 0 → 1` · 표기 `2–16 / 22` |
| HUD 명패 | `setLocale('en', game)` | '속초'(32px) → 'Sokcho'(62px) · 명패 폭 120 재배치 |
| EN 잔여 스캔 | 씬/패널 Text 전수(한글 정규식) | 면허·스킬·일지·도감 3탭·출처·월드맵 지역/구역 카드 **전부 0** |
| ✕ 위치 | 컨테이너 좌표 | 도감 (1240,34) · 출처 (1162,66 = 패널 우상단) · 출처 하단 버튼 없음 · `scrollY = maxScroll` 에서 푸터 미침범 |
| 육안 | 스크린샷 12장 | 트리 선행선·'예정' 태그·면허 그룹·일지 🔒·홀드 라벨↔경고 분리·출처 EN 전문 확인 |
| 빌드 | `npx pnpm run build` · typecheck | 3/3 · 0 |

재현: `node scratchpad/verify_122.cjs` (dev 서버 5173 필요. **`| head`로 파이프하면 vite가 죽는다** — 로그는 파일로).

## 6. 잔여 — 이번에 안 한 것

- **스킬 효과 실배선 27종**(`wired:false`) — 낚시(라인·드랙·밑밥·조석·루어·대물·보관·챔질)·채집(랜턴·야간·통발 미끼·산란)·
  경제(시세·대량·수협·토지·주식)·운전(자동차·보트·연비)·생활(체력·피로·요리·수면)·농사 전부. 대상 시스템이 생길 때 `effect.key`로 소비.
- **농사 카테고리 잠금 해제** — 농장 경영(S8) 착수 시 `locked:false`.
- **스토리/메인 퀘스트 본편** — 일지는 골격(프롤로그 준비 중 + 기존 QuestDatabase 16종). 사용자 방침 "모든 컴포넌트 후 도입" 유지.
- 신규 면허 7종의 **효과 배선** — `plannedNote`로 '예정' 표기(주택 부지·농지·선박 운전·항만 제한구역·상업 통발). 어촌계원만 조례 면제 실동작.
- 레거시 `FieldScene`/`SpotFieldLayouts`의 `[E]` 힌트는 **무수정**(레거시 씬 — 폐기 후보, 본 흐름 아님).
- 설정 화면 **키 리맵**은 여전히 미지원(표만 갱신).

## 7. 위험·부작용

- `openPopup`이 모든 팝업을 여는 순간 `raiseToTop`한다 — 상점+인벤 동시 오픈처럼 **겹치지 않는 조합은 영향 없음**, 겹치는 조합은
  "방금 연 것이 위"로 바뀐다(76차 "정적 depth = 초기 서열" 규칙이 "정적 depth = 밴드 내 초기값"으로 축소).
- 금액 규칙이 숫자만 받는다 — `약 3만 원` 같은 비숫자 금액 표기가 있다면 원문으로 남는다(현재 스캔 0).
- 스킬 배율은 `skillMult` 기본 1.0이라 **배우기 전 수치는 종전과 동일**. 세이브 `skillTree` 없는 구세이브는 빈 랭크로 로드.
- `SettingsScene` 단축키 표·`HelpContent` 본문의 E/F 표기는 갱신했으나 도움말 **캡처 이미지**(21장)에 E 표기가 남아 있을 수 있음 — 재촬영 미실시.

## 8. 후속 반영

- [x] 시스템 페이지 — [`ui-framework.md`](../02-SYSTEMS/ui-framework.md) §4·§5·§6 ·
  [`night-hunting-trap.md`](../02-SYSTEMS/night-hunting-trap.md) F 키·§6 ·
  **[`progression.md`](../02-SYSTEMS/progression.md) 신설(S21)**
- [x] `04-BACKLOG.md` — A1 스킬 배선 잔여 · A1-F 갱신
- [x] `AGENTS.md` §9 요약 + §6 단축키 표 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` · `docs/wiki/README.md`
- [x] 스킬 — `verify-render`(vite 파이프 함정 · `/@id/@tra/core` · `__DISC.devUnlockAll(kind, ids)`) · `ui-panel`(새 팝업 최상단 · ✕ 통일)
