# 098차 — 문어 실사 스프라이트 + 삶기 · 다리 분리 · 숙회 회뜨기 · 플레이팅 (2026-08-13)

## 1. 배경

사용자 지시(원문 요지):

- `food assets/butchery/reference/cephalopod/octopus/`에 **문어 손질 실사 사진을 순서대로 넘버링**해
  넣어놨음. "손, 도마, 배경 등 다 제거하고 손질 대상인 문어에 해당하는 영역만" 추론 추출 후
  픽셀화해 도마 작업 형태로 적용할 것 — "지금 현재 적용 중인 이미지는 너무 퀄리티가 떨어져."
- "순서와 단계 그런 것들도 알아서 잘 배치해줘."
- '문어 손질 완료' 사진의 문어를 픽셀로 따서 **통마리 인벤토리 아이콘**으로.
- '삶기 준비 완료'는 무시. 문어는 **불을 이용한 요리로 삶아진 후 '삶은 문어'** —
  조리 이후 '활어'가 아닌 **'신선'**, 아이콘은 삶은 문어 실사. **삶은 문어만 도마에 올릴 수 있다.**
- 삶은 문어 도마 = 이미지 그대로 표시 + 다리 부분 **가이드 3개**로 절단 →
  '삶은 문어 머리' ×1 + '삶은 문어 다리' ×8 (에셋 동봉).
- 다리 도마 = **사선 7컷** 숙회 썰기 + 기존 "잘려서 옆으로 밀리는 연출".
- 플레이팅: 접시 배치 가능, 중도 하차 시 인벤토리 아이콘 = '문어 숙회 한점',
  접시 위 조각 이미지도 기존 '생선회 한 점'이 아니라 **숙회 한 점 이미지**로.

## 2. 원인

버그 수정이 아니라 기능 확장 차수. 단 진행 중 잠복 결함 2건을 확정·정정:

- **공정 순서 뒤바뀜** — 097차 트리는 악판(부리) 제거가 세척 **뒤**였는데, 사용자 실사 넘버링
  (부리 제거 5~7 → 소금세척 8~9)이 실제 공정이다. 부리를 소금 **앞**으로 재배열.
- **ceph 부산물 전부에 `byproductKind: 'viscera'`** — `buildYieldRows` 두족류 분기가 전 부산물에
  viscera를 박아, 몸통살·문어 통마리에 인벤 우클릭 **'만들기'(내장→밑밥 전환)**가 떠서
  메인 수율을 밑밥으로 갈아버릴 수 있었다(097차 유래). 내장류 3종(octo_viscera·octo_ink_sac·
  ceph_gonad)에만 한정.

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [tools/pixelize_butchery.cjs](../../../tools/pixelize_butchery.cjs) | **`KEEP_POLY` 메커니즘 신설**(피사체 폴리곤 바깥 전부 제거 — ERASE와 별도) + `OCTO_SRC` 9장 매핑 + 키별 폴리곤(그리드 오버레이 실측) + `BG_TOL` octo 8키 = 4 + `FIT_LONG_PREFIX`에 `octo_` |
| 신설 | [tools/gen_octo_assets.cjs](../../../tools/gen_octo_assets.cjs) | 투명 PNG 4종 다운스케일(삶은 문어/머리/다리/숙회 한점 → public) + `octo_clean` 도트 → `trimmings/octo_whole.png`(통마리 아이콘 교체) |
| 재생성 | `data/PixelFishStages.ts` | `octo_*` 9키 추가 (기존 47키 바이트 동일 — 회귀 0) |
| 신설 | `public/trimmings/octo_boiled{,_head,_leg}.png` · `public/sashimi/piece_octopus.png` | 직접 로드 에셋 4종 |
| 수정 | [CephalopodStages.ts](../../../packages/core/src/db-schema/CephalopodStages.ts) | 문어 8스테이지 **재배열**(외번→내장→되돌림→**악판**→소금→문지르기→세척→완료) + scrub 스윕 재근사 |
| 수정 | [ButcherySections.ts](../../../packages/core/src/db-schema/ButcherySections.ts) | OCTOPUS_SECTIONS 3섹션 재편(invert→beak(exitAfter)→clean+done) |
| 수정 | [CephalopodGuides.ts](../../../packages/core/src/db-schema/CephalopodGuides.ts) | OCTO_* 좌표 전면 재근사(실사 subjectRect 기준 — 부리 중심 = 사진 5의 검은 부리 위치) |
| 수정 | [CephalopodFish.ts](../../../packages/client-pc/src/ui/CephalopodFish.ts) | `OCTO_STAGE_SPRITE` 8매핑 + `CEPH_DRAG_FRAMES`에 외번(1→2)·내장(3→4)·악판(5→7) 진행 프레임 + finished octopus = `octo_clean` |
| 수정 | [BootScene.ts](../../../packages/client-pc/src/scenes/BootScene.ts) | 신규 텍스처 4키 로드 |
| 수정 | [InventoryStore.ts](../../../packages/client-pc/src/store/InventoryStore.ts) | **`boilOctopus()`** — 통마리 → 삶은 문어(×0.8g · '신선' 시작 · 실사 아이콘). 불요리 시스템 전까지의 간이 경로 |
| 수정 | [InventoryPanel.ts](../../../packages/client-pc/src/ui/InventoryPanel.ts) | 통마리 우클릭 **[삶기]** 액션 |
| 수정 | [ButcheryPanel.ts](../../../packages/client-pc/src/ui/ButcheryPanel.ts) | ceph 부산물 `byproductKind` viscera 한정(§2) |
| 수정 | [SashimiPanel.ts](../../../packages/client-pc/src/ui/SashimiPanel.ts) | ceph 모드 2종 추가 — **octoWhole**(3컷 → 머리 ×1 + 다리 ×8 지급·진동 연출) / **octoLeg**(사선 7컷 → '문어 숙회 한 점' ×8 — 기본 팬아웃(밀림) 연출 공유·전용 아이콘·다리 1개만 소모) |
| 수정 | [UtilizationPanel.ts](../../../packages/client-pc/src/ui/UtilizationPanel.ts) | `cephSliceKind` octoWhole/octoLeg + 도마 버튼·안내(생 통마리 = 도마 불가 안내) + 도마 진열·**접시 조각 = 숙회 실사 이미지** 분기 |

삭제 없음. 사진 6(부리 제거2)은 손가락이 피사체 대부분을 가려 스프라이트 미채택(매핑 주석에 명기).

## 4. 구조상 위치

`손질(회뜨기) 시스템 → 두족류 확장 → 문어`.

- **에셋층**: KEEP_POLY 파이프라인(실사 → 도트) + gen_octo_assets(직접 로드 PNG)
- **데이터층**: 스테이지 재배열·섹션·가이드 좌표 (core)
- **판정층**: 신규 판정 없음 — 기존 프리미티브·evaluateCut 재사용
- **렌더층**: OCTO_STAGE_SPRITE(사진 = 도마 그림 — 89차 두족류 정책) + SashimiPanel 모드 2종
- **경제층**: 삶은 문어 = 통마리가 ×1.15 승계, 숙회 조각 = 접시 완성 시 가치 실현(기존 철학)

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 전체 | `scratchpad/verify_octo98.cjs` (Playwright 실마우스) | **32/32 PASS** |
| 스프라이트·텍스처 | 레지스트리 9키 + 드래그 프레임 분기 + finished 분기 + 직접 로드 5종 | PASS (오징어 완료 회귀 포함) |
| core 트리 | 스테이지 순서(부리가 소금 앞)·섹션 3개·yields·1:1 정합 | PASS |
| 손질 완주 | ButcheryPanel dev 스킵 완주 — 통마리 지급(`trim_octo_whole` 실사)·악판·원물 소모 | PASS + 스크린샷 3장(외번/악판/소금 — 실사 렌더) |
| 삶기 | `__INV.boilOctopus` — '삶은 문어' 지급·**'신선' 시작**·통마리 소모 | PASS |
| 다리 분리 | 실마우스 3컷 — 머리 ×1 + 다리 ×8·삶은 문어 소모 | PASS |
| 숙회 | 실마우스 7사선컷 — 3컷 시점 조각 3개 밀림 스크린샷·완주 시 '문어 숙회 한 점' ×8(전용 아이콘)·다리 1개만 소모 | PASS |
| 생성물 회귀 | `git diff` PixelFishStages.ts — **octo_* 9키 추가만, 기존 키 삭제 0줄** | PASS |
| 빌드 | `npx pnpm run build` + typecheck | 4/4 · 0 오류 |

스크린샷: scratchpad `o98_*.png` (stage_invert/beak/salt · octowhole_board/result · octoleg_board/mid/result).

## 6. 잔여

- **가이드 좌표 전부 근사** — 실사 기준으로 재근사했으나 F9 실측 대상:
  외번·내장·악판 경로, 소금/문지르기 스윕, octoWhole 3컷(오버라이드 키 `ceph_octoWhole`),
  octoLeg 7컷(`ceph_octoLeg`).
- **불요리 실구현 시 삶기 이관** — 현재 인벤 우클릭 [삶기]는 간이 경로. 화구·용기 시스템이 서면
  CookScene 실조리(삶기)로 옮기고 우클릭 경로는 제거.
- `octo_scrub` 추출 품질 하위(원본이 손·거품 위주) — 갱신 사진 입수 시 KEEP_POLY만 재조정.
- 삶은 문어 머리·다리·숙회의 요리 소비처(숙회 무침·통찜)는 불요리 시스템에서.
- 대문어(giant_octopus)는 같은 트리·스프라이트 공유 — 전용 실사 입수 시 분화.

## 7. 위험·부작용

- 문어 8스테이지 **순서가 바뀌어**(부리↔소금·세척) 구세이브의 진행 중 문어 손질 세션은 없던 전제
  (손질 진행은 세이브에 저장되지 않음 — 세션 메모리)라 영향 없음.
- 통마리 `byproductKind` 제거로 기존에 지급된 통마리·몸통살 아이템(구세이브)은 여전히 viscera가
  박혀 있어 '만들기'가 뜬다 — 신규 지급분부터 정상. 구세이브 소급 정정은 하지 않음(파괴적 변경 회피).
- KEEP_POLY는 원본 해상도 무관 정규화 좌표 — 사용자가 같은 구도의 고해상 사진으로 교체해도 유효.
  **다른 구도로 교체하면 폴리곤 재실측 필요**.

## 8. 후속 반영

- [x] 워크로그 098 (이 문서) + `03-WORKLOG/README.md` 인덱스
- [x] `02-SYSTEMS/butchery.md` §4·§5·§6 갱신
- [x] `04-BACKLOG.md`
- [x] AGENTS §9 · IMPLEMENTATION_PLAN · CLAUDE.md 요약 갱신
- [x] asset-pipeline 스킬 — KEEP_POLY·gen_octo_assets 반영
