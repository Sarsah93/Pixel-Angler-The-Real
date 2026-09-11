# 131차 — 도움말 라이브러리 현행화 (제작 카테고리 신설 · 생존 ready 전환 · 스킬 확장 반영) + 제작 UI 영문화

- **날짜**: 2026-09-11
- **차수**: 131
- **시스템**: S21 성장·생존 / S15 UI 프레임워크(도움말·i18n) / 제작(129차 P7)
- **선행**: [129차 제작·구급품·피로 회복 음식](2026-09-11-129-crafting-firstaid-fatigue-food.md) ·
  [130차 스킬 트리 확장](2026-09-11-130-skill-tree-expansion.md)

---

## 1. 배경

사용자 지시(원문):

> main에 커밋하기 전에, 반영된 모든 내용을 도움말 라이브러리에 내포되도록 구현해줘.
> 그 작업이 끝나면 곧바로 main에 커밋해줘.

129차(제작·구급품·보건소·피로 회복 음식)와 130차(스킬 트리 확장·Σ 215 등식)는 **코드는 들어갔는데
게임 안 도움말은 123차 상태에 멈춰 있었다**. 구체적으로:

- '성장 · 생존' 섹션 라벨이 여전히 **'생존 (예정)'** 이고 토픽 6종이 전부 `status: 'planned'`
  (생존 지표·음식·상태이상·기절/사망·병원·상태 패널 — **125~129차에 이미 구현된 것들**).
- '준비 중 콘텐츠'에 **'제작 (계획)'** 스텁이 남아 있었다(129차에 실구현됨).
- 스킬 설명이 "레벨당 1포인트 · 44노드"(124차 이전 문구) — 면허 보너스·215 등식·해금 조건·시너지 히든이 없다.
- 단축키 표의 `U`(탭 3개)·`K`(레벨당 포인트)가 낡았고 `Shift+F`(설치물 회수)가 빠져 있었다.

## 2. 원인

도움말은 **데이터(`data/HelpContent.ts`) 한 곳**이라 기능 구현 차수와 자동으로 동기화되지 않는다.
123차가 스펙 기준으로 `planned` 토픽을 **선반영**해 둔 것이 오히려 "구현 후 ready 전환" 작업을
남겼는데, 125~130차가 그 전환을 하지 않았다.

부수적으로 **129차 제작 UI는 영문 사전에 전혀 등록되지 않았다**(실렌더로 확인 — 도면 이름·그룹
헤더·재료·버튼·로그가 en 로케일에서 전부 한국어). 도움말에 제작을 넣는 순간 "설명은 영어인데
가리키는 화면은 한국어"가 되므로 함께 처리했다.

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`data/HelpContent.ts`](../../../packages/client-pc/src/data/HelpContent.ts) | **제작 카테고리 신설**(토픽 2 · 페이지 3) · 성장 3토픽 재작성(페이지 6) · **생존 6토픽 planned → ready 전면 재작성** · `p-craft` 스텁 제거 · `p-farm` → '농사 · 광질' · 단축키 3건 현행화 · `HELP_IMAGE_KEYS` 4종 추가 |
| 신설 | `public/guide/help/help_{craft_tab,workbench,skill_tree,vitals_panel}.png` (+`_en`) | 실캡처 8장 |
| 수정 | [`tools/annotate_help_images.py`](../../../tools/annotate_help_images.py) | 신규 4키 `CALLOUTS`(20콜아웃)·`LABEL_EN` · **Linux 폰트 후보 + `hangul_ok()` 가드** |
| 수정 | [`i18n/I18n.ts`](../../../packages/client-pc/src/i18n/I18n.ts) | `buildRuntimeDict`에 `CRAFT_BLUEPRINTS`(nameKo/En·descKo/En)·`CRAFT_GROUP_LABEL` 합류 |
| 수정 | [`i18n/en_help.ts`](../../../packages/client-pc/src/i18n/en_help.ts) | 구 성장·생존 블록·제작 스텁 제거 후 **113항목 신규**(제작·성장·생존·채집/통발 잔여) |
| 수정 | [`i18n/en_panels.ts`](../../../packages/client-pc/src/i18n/en_panels.ts) | 제작 보드 UI 14 + 스킬 트리 라벨 4 |
| 수정 | [`i18n/en_items.ts`](../../../packages/client-pc/src/i18n/en_items.ts) | 제작 재료·구급품·설치형 25 |
| 수정 | [`i18n/en.ts`](../../../packages/client-pc/src/i18n/en.ts) | 규칙 16종(제작 결과·재료 줄·스킬 잠김·해금 조건·설치/보건소 로그·**130차 스킬 포인트 헤더**) |
| 수정 | [`ui/HelpLibraryPanel.ts`](../../../packages/client-pc/src/ui/HelpLibraryPanel.ts) | 팁 렌더 `Tip · ${tr(tip)}` — 선번역 |
| 수정 | [`core/types/Progression.ts`](../../../packages/core/src/types/Progression.ts) | 헤더 주석 Σ=200 → **215(레벨 200 + 면허 15)** (130차 잔재) |

### 3-1. 도움말 구조 변화

```
손질 · 요리
제작 ← 신설            만들기 › 기본 제작 (U 제작 탭) · 고급 제작대 [F]
인벤토리 · 장비 · 쿨러
...
성장 · 생존            성장 › 레벨 · 스킬 트리(3페이지) · 면허 · 일지
                       생존 ← '생존 (예정)' 에서 개명 · 6토픽 전부 ready
준비 중 콘텐츠          농사 · 광질 / 불요리 · 스시 / 배 출조 · 멀티  (제작 스텁 제거)
```

카테고리 11 · 토픽 44(신규 2 · ready 전환 6 · 재작성 3 · 삭제 1).

### 3-2. 수치는 전부 코드에서 확인해 적었다

문서가 코드와 어긋나면 없느니만 못하므로, 본문 수치는 실제 소스에서 읽어 넣었다 —
희귀도 XP 10~400·체장계수 0.5~3.0·첫 발견 ×5·준법 방생 ×0.5(`TUNING.xp`) ·
Lv2 100/Lv100 24,701/Lv200 70,256·누적 5,636,469(`xpToNext`) · Σ 215 = 200 + 15
(`SKILL_TREE_TOTAL_PT`) · 도면 14종 = hand 8 / workbench 6(`CRAFT_BLUEPRINTS`) ·
성공률 상한 0.99·실패 시 재료 절반(`craftSuccessRate`/`TUNING.craft.failMaterialPct`) ·
제작대 180,000원 / 진료비 45,000원(`ShopCatalog`/`TUNING.craft.hospitalFee`) ·
임계 20%·이동 −20%·피로 ×1.3·0%에서 HP −2/분·28℃ 수분 ×1.5·5℃ 허기 ×1.3(`TUNING.vitals`) ·
사망 재화 −15%·HP/허기/수분 50%·기절 후 피로 80%(`TUNING.collapse`) ·
피로 회복 국물 15~20 / 보양식 30~40 + 드레인 −25~32%(`ItemVitals`) · 재발 출혈 30%·골절 25%(`TUNING.status`).

## 4. 구조상 위치

`시스템 S21 성장·생존 / S15 UI(도움말·i18n) → 도움말 데이터 + 사전`.
**렌더 층이 아니라 데이터·사전 층**이다 — 패널 코드는 팁 선번역 1줄만 바뀌었고,
나머지는 전부 `HelpContent`(데이터)와 `i18n/*`(사전)이다. 게임 판정·세이브 영향 0.

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 사전 커버리지 | 도움말 문자열 전수 스캔(한글 리터럴 ↔ en 사전 키) | **356개 중 미번역 0** (착수 시 98개) |
| 도움말 구조 | 실렌더 하네스 `verify131.mjs` ko | **10/10 PASS** · pageerror 0 |
| 도움말 영문 | 같은 하네스 en | **13/13 PASS** · pageerror 0 |
| 신규 토픽 렌더 | craft-basic 31 · craft-workbench 27 · skill-tree 37 · vitals 34 · food-recovery 31 · status-effects 32 · faint-death 31 · hospital 30 · status-panel 31 · level-xp 31 (텍스트 개수) | 전 토픽 렌더 |
| 제작 보드 영문 | 텍스트 31개 한글 잔존 | **0** |
| 스킬 트리 영문 | 텍스트 122개 한글 잔존 | **0** |
| 캡처 | ko/en 각 4장 실게임 촬영 → 축소·콜아웃 | 8장 · pageerror 0 |
| 빌드 | `pnpm run build` / `typecheck` | **3/3** · **0 오류** |

재현: dev 서버 기동 후
`node <scratchpad>/verify131.mjs ko` · `… en` (캡처는 `capture131.mjs <locale> <outdir>` → `py tools/annotate_help_images.py <outdir> --only craft_tab workbench skill_tree vitals_panel [--lang en]`).

## 6. 잔여

- **한국어판 콜아웃 라벨**(4장) — 이 컨테이너에 **한글 폰트가 없고 egress가 막혀 설치도 불가**.
  `hangul_ok()` 가드가 두부(□)를 그리는 대신 **축소본만 저장**한다(영문판은 라틴 폰트로 정상 생성).
  착수 조건: 한글 폰트가 있는 환경에서
  `py tools/annotate_help_images.py <raw_ko> --only craft_tab workbench skill_tree vitals_panel` 재실행.
- **호버 팝업이 캡처에 안 잡힌다** — 헤드리스에서 `scene.time` 타이머가 안 돌아 재-hover 후에도
  팝업이 남지 않는다(128차 함정의 연장). 콜아웃 문구를 "호버 팝업이 뜨는 자리"로 바꿔 오해를 없앴다.
- **일지(J) 토픽**은 여전히 "확장 예정" — P8 퀘스트 XP가 들어가면 다시 쓴다.
- 나머지 `planned` 3토픽(농사·광질 / 불요리·스시 / 배 출조·멀티)은 실제로 미구현이라 유지.

## 7. 위험·부작용

- **세이브·판정 무영향** — 데이터/사전만 바뀌었다.
- `i18n` 사전에 **중복 키가 생기면 TS 객체 리터럴 오류**라 빌드가 막는다(추가 시 기존 키 검사 후 삽입했다).
- 구 `en_help.ts`의 성장·생존 블록을 지웠으므로, **본문 문구를 되돌리면 번역이 함께 사라진다**
  (키 = 한국어 원문이므로 원문을 바꾸면 항상 사전도 같이 고쳐야 한다).
- `buildRuntimeDict`에 제작 DB가 합류하면서 **도면·재료 이름이 전역 사전에 들어간다** — 같은 글자를
  쓰는 다른 UI도 이 번역을 받는다(의도. `put()`은 기존 키를 덮지 않는다).

## 8. 후속 반영

- [x] 워크로그 1건(이 문서) + `03-WORKLOG/README.md` 인덱스
- [x] `02-SYSTEMS/progression.md` §4·§5·§6
- [x] `02-SYSTEMS/ui-framework.md` §4·§6 (도움말·i18n)
- [x] `04-BACKLOG.md`
- [x] `.agents/AGENTS.md` §9 · `.agents/IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
