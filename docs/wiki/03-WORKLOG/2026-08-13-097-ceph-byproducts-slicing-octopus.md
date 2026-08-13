# 097차 — 두족류 부산물 개편 + 회뜨기 3모드 + 한치 개방 + 문어 트리 (2026-08-13)

## 1. 배경

사용자 지시(원문 요지):

- **손질 부산물 변경**: ① 오징어 껍질은 부산물에서 제외 ② 날개살은 갑오징어 제외(실제로 거의 없음)
  ③ 아가미 부산물 제외 ④ 뼈 = 갑오징어 '갑오징어 뼈' / 그 외 '무늬오징어 뼈'
  ⑤ 몸통살 = '무늬오징어, 한치 몸통살 (mantle, body tube)' / '갑오징어 몸통살' ⑥ '순수 필렛' 최종 지급 제거(몸통살이 곧 필렛)
- **오징어 회뜨기**: 부산물을 도마에 올릴 수 있어야 함 —
  몸통살 = 가운데 1컷(두 덩어리) 후 세로 ~10컷이 양 덩어리를 관통 = **총 22점** /
  다리부 = 1컷으로 **촉완 ×2 + 촉완이 제거된 다리부**(회 아님 — 요리 재료) /
  날개살 = **좌우 날개 둘 다 렌더**, 각각 반으로 = **4점**
- "위 내용까지 잘 반영되면 **한치에도 적용**되도록 하자. 그 다음 바로 이어서 **문어 구현**해줘."

## 2. 원인

버그 수정이 아니라 기능 확장 차수. 단 하네스에서 함정 1건 확정:

- **`page.keyboard.press('Enter')`가 패널 밑 MainMenuScene 메뉴 선택까지 구동** — NEW GAME이 시작되며
  `InventoryStore.resetAll()`이 중간 지급분을 지웠고(먹물주머니 0 실측), 이후 생성한 패널이
  비활성 씬에 붙어 입력이 전부 죽었다. 마우스는 topOnly 게이트가 있지만 **키보드에는 없다** —
  버튼류 확정은 `panel.onKey({ code: 'Enter' })` 직접 호출로.

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | `packages/core/src/db-schema/CephalopodProfiles.ts` | 부산물 개명(`ceph_pen` '무늬오징어 뼈' · `ceph_cuttlebone` '갑오징어 뼈' · `ceph_mantle_fillet` '몸통살 (body tube)') + `ceph_skin`/`ceph_gill` 미지급 표기 |
| 수정 | `packages/core/src/db-schema/ButcherySections.ts` | SQUID yields에서 `ceph_skin`·`ceph_gill` 제거 · **OCTOPUS_SECTIONS 신설**(3섹션 8작업) · `sectionsForCephalopod` 라우팅(squid·swordtip → SQUID / octopus·giant → OCTOPUS) |
| 수정 | `packages/core/src/db-schema/CephalopodStages.ts` | `swordtip_squid` = 무늬오징어 트리 공유 · **`buildOctopusStages()` 8스테이지 신설**(외번→내장→되돌림→소금→문지르기→세척→악판→완료) + salt/scrub sweepPath(근사) |
| 수정 | `packages/client-pc/src/ui/ButcheryPanel.ts` | 두족류 showResult **순수 필렛 미지급** · 몸통살/문어 통마리 = **원물 판매가 ×0.75 승계** · `octo_salt` 굵은소금 1개 소모 게이트(`octoSaltPaid`) · cephRatio octo 2종 · cephState octo 파생 + `octopus` 플래그 |
| 수정 | `packages/client-pc/src/ui/CephalopodFish.ts` | **문어 파라메트릭 렌더** `drawOctopus`(OCTO_WHOLE/INVERTED/ORAL — 다리 좌·머리 돔 우, 외번 속면+내장, 방사 입면+악판, 소금 거품 오버레이) · `CephStageRef.octopus`(완료 시 squid_clean 폴백 차단) · OCTO 뷰 라벨 3종 |
| 수정 | `packages/client-pc/src/ui/UtilizationPanel.ts` | `cephSliceKind`(몸통살/날개살/다리부 id 판별) — 도마 드래그·드롭·버튼([오징어 회뜨기 (22점)]/[날개살 회뜨기 (4점)]/[촉완 분리] — 회칼 손 장착 게이트)·선택 안내·사시미 영역 관련성 |
| 수정 | `packages/client-pc/src/ui/SashimiPanel.ts` | **두족류 3모드**: mantle(가로 1 + 세로 10 = 22점 — 위/아래 덩어리 캔버스 분리 + 관통 조각), fin(좌우 날개 2장 · 각 1컷 = 4점 — 반쪽 교체 팬아웃), arms(1컷 → 촉완 ×2 + `inv_ceph_arms_only_*`, 회 조각 없음) + `buildResultOverlay` 공용 추출(최소 폭 520) |
| 수정 | `packages/client-pc/src/store/InventoryStore.ts` · `data/ShopCatalog.ts` | **굵은소금**(`inv_coarse_salt`) 시드 3 + 식자재마트 판매 2,500원 + **dev 구세이브 주입**(deserialize — dev 어획 주입 블록에 편입. 시드는 신규 게임에만 들어가 기존 세이브로는 소금 없이 문어 검증이 막히던 것) |
| 신설 | `scratchpad/verify_octopus97.mjs` · `verify_octo97_render.cjs` | core 38 어서션 + 실렌더 32 어서션 하네스 |

삭제 없음. 갑오징어 트리는 미착수(fin 제외 규칙은 데이터에 표기 — 트리 작성 시 소비).

## 4. 구조상 위치

`손질(회뜨기) 시스템 → 두족류 확장`.

- **데이터층**: 부산물 테이블·섹션 yields·문어 스테이지 트리 (core)
- **판정층**: 기존 프리미티브 재사용(invert=path·salt_apply=fill·flip=button) — 신규 판정 없음
- **렌더층**: 문어 파라메트릭 3뷰(실사 없음 — 사진 입수 시 stage-id 키로 자동 교체) + SashimiPanel 조각 연출
- **경제층**: 몸통살/통마리 = 원물가 승계(어류 필렛과 동일 철학 — 가치 상승은 접시에서)

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 한치·부산물·문어 core | `node scratchpad/verify_octopus97.mjs` | **38/38 PASS** (한치 20스테이지 공유 · 껍질/아가미 yields 0 · 문어 완주 cov 1.00) |
| 무늬오징어 회귀 | `verify_squid16.mjs` | 61/61 PASS |
| 실렌더 | `verify_octo97_render.cjs` (실마우스) | **32/32 PASS** — 문어 8스테이지 완주(3뷰 스크린샷) · 소금 게이트 차단/소모 1 · 통마리 1092g 지급 · **순수 필렛 미지급** · 한치 진입(오징어 스프라이트 128×50 공유) · 몸통살 22점(가로 분리 스크린샷) · 날개 2장/4점/스택 1만 소모 · 촉완 ×2 + 다리부 · pageerror 0 |
| dev 세팅 (구세이브) | `verify_salt_inject.cjs` — 직렬화본에서 소금·문어 제거 후 재로드 | 굵은소금 3 · 참문어·한치 dev 어획 · 회칼 전부 주입/복원 확인 |
| 빌드 | `npx pnpm run build` + typecheck | 4/4 · 0 오류 |

스크린샷: `scratchpad/o97_*.png` (octo_whole/inverted/scrub_foam/oral/result · swordtip_stage1 · mantle_split/done · fin_wings/done · arms_done).

## 6. 잔여

- **갑오징어 트리 13스테이지** (스펙 §4.3 — 갑 들어내기·속껍질. 날개살 미지급·'갑오징어 뼈' 규칙은 데이터 완비) — 속껍질 에셋 대기와 함께.
- **문어 실사 에셋** — 현재 파라메트릭 플레이스홀더. 사진 입수 시 `pixelize_butchery.cjs` stage-id 키로 자동 교체.
- 문어 가이드 좌표(OCTO_*)·다리부 컷 위치(0.70 근사)·salt/scrub 스윕 = **근사값** — 사용자 F9 실측 대상 (SashimiPanel 오버라이드 키 `ceph_mantle`/`ceph_fin`/`ceph_arms`).
- 한치는 무늬오징어 실사·좌표를 그대로 공유 — 한치 전용 실사(가늘고 긴 체형) 입수 시 분화.
- 촉완이 제거된 다리부·촉완의 요리(숙회·통찜) 소비처는 불요리 시스템에서.

## 7. 위험·부작용

- 구세이브에 이미 지급된 '오징어 껍질'·'아가미' 아이템은 그대로 남는다(판매 가능 — 신규 지급만 중단).
- 몸통살 가격이 원물가 승계로 상향 — 기존 def.price(0) 대비 밸런스 변화는 의도(어류 필렛 정합).
- `page.keyboard` 하네스 함정(§2)은 verify-render 스킬에 반영.

## 8. 후속 반영

- [x] 워크로그 097 (이 문서) + `03-WORKLOG/README.md` 인덱스
- [x] `02-SYSTEMS/butchery.md` §4·§5·§6 갱신
- [x] `04-BACKLOG.md`
- [x] AGENTS §9 · IMPLEMENTATION_PLAN · CLAUDE.md 요약 갱신
- [x] verify-render 스킬 — 키보드 입력 함정 추가
