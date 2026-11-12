# 316차 — 어종별 필렛 그림(Gemini) · 배를 가른 뒤에도 그 어종 · main 반영 · 114차 배포

| | |
|---|---|
| **날짜** | 2026-11-11 |
| **시스템** | `손질` · `회썰기` · `에셋` · `위키` |
| **트리거** | 사용자 지시(315 보고 뒤) |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` `5fc9b77` · main 빨리 감기 `5fc9b77` · gh-pages 114차 `0e55556`(Actions 「테스트 배포」 #43 — 사용자 지시 「main & gh-pages 재배포까지」) |
| **빌드·타입체크** | 3/3 · 루트 typecheck 4/4 · core 572 · r316 8/8 · 위키 6/6 · pageerror 0 |

---

## 1. 배경 — 왜 했나

사용자 원문:

> 「어종별 필렛 그림 Gemini로 전부 진행해줘.
> 그리고 main & gh-pages 재배포까지.
> 실검증은 내가 집 pc에서 진행해볼게. (dev로)」

315차 보고에서 시범 4장(농어 · 우럭 · 참돔 · 고등어 순수 필렛)을 보이고 「전 어종(순수 · 껍질 · 갈빗대 필렛 × 28종, 약 84장) 약 3달러」를 제안했다 — 그 진행 지시다.

## 2. 원인 — 무엇이 문제였나

| 항목 | 기전 |
|---|---|
| 개복 뒤 필렛 그림 | 도마의 갈빗대(`fillet_ribs` — 공용 사진) · 지아이뼈 · 손질 끝(`pure_fillet_<군>`) · 박피(`skin_fillet_<군>`) 그림이 어종군 한 벌 — 잿방어 로인 · 감성돔 필렛에 어종 색을 22% 입혔다. 살이 흰 농어 · 우럭도 분홍 · 붉은 살 |
| 가방 아이콘 | 「껍질과 갈빗대가 붙어있는 필렛」(`trim_fillet_ribs`) · 「껍질이 붙어있는 필렛」(`trim_fillet_skin`) · 순살(`trim_fillet_skinonly_<군>`)이 어종 무관 |
| 회썰기 | 탑뷰 · 측면 · 한 점(`sashimi_*_<군>`)이 군 셋뿐 — 농어 회를 썰어도 잿방어 살 |

## 3. 변경 — 어디를 어떻게

**그림(Gemini · 74장)**

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`tools/gemini_fillet_art.cjs`](../../../tools/gemini_fillet_art.cjs) | 생성 · `--install` · `--bake` · `--sheet` · `--wiki-sheets` 한 도구. 어종 표 `SPECIES`(온마리 원본 · 살 · 껍질 · 모양 · `keep` · `alias`) |
| 신설 | `food assets/trimmings/species/<어종>_{pure,skin,ribs}.png` | 설치본 74장(긴 변 192칸 × 4px 격자 · 2.4MB) |
| 신설 | [`data/PixelFilletSpecies.ts`](../../../packages/client-pc/src/data/PixelFilletSpecies.ts) | 도마 스프라이트 74(긴 변 128칸 · 팔레트 ≤ 48 · 자동 생성) + `FILLET_SPECIES_ALIAS`(참돔 야간 → 참돔) |
| 신설 | `public/sashimi/sp/<어종>_{top,side,piece}.png` · [`data/SashimiSpeciesProfiles.ts`](../../../packages/client-pc/src/data/SashimiSpeciesProfiles.ts) | 회썰기 24종 × 3(3.8MB) · 실루엣 프로필(자동 생성) |
| 수정 | [`tools/gen_sashimi_fillet.cjs`](../../../tools/gen_sashimi_fillet.cjs) | `--species`(어종 그림 → `public/sashimi/sp/` · 군 표는 건드리지 않는다) · 윈도 크롬 없으면 Playwright 크로미움 |

그리는 순서(어종마다): ① 순수 필렛(화풍 참고 = 잿방어 로인 + 그 어종 온마리 — 315 시범과 같은 식 · 꼬리 왼쪽)
→ ② 껍질 붙은 필렛 = **①을 고쳐서**(모양 · 자리 그대로 · 윤곽 둘레에 그 어종 껍질 띠) → ③ 갈빗대 붙은 필렛 = **공용 갈빗대 그림의 구도** + ①의 화풍 · 살색.
②는 ①과, ③은 구도 참고와 실루엣 IoU를 재서 낮으면 다시 뽑는다(②≥0.85 · ③≥0.93).
잿방어 · 감성돔은 순수 · 껍질 붙은 필렛이 원래 그림(그 어종이 원본) — 갈빗대만 새로.

**게임 배선**

| 구분 | 파일 | 내용 |
|---|---|---|
| 수정 | [`ButcheryProcess.ts`](../../../packages/core/src/simulation/ButcheryProcess.ts) | `filletFrames`(뷰 셋 — ribs · pure · skin) · `FILLET_VIEW_STAGES` · `stageGuideRemap` · `invertGuideRemap` · 열 실루엣(`GuideColumnProfile` — 세로는 살 높이 비례 · 0~100%로 묶음) · 필렛 B(rib_b · pin_b)는 실루엣 뒤집음 · 군 확정 좌표도 필렛 뷰를 옮김 |
| 수정 | [`PixelButcherFish.ts`](../../../packages/client-pc/src/ui/PixelButcherFish.ts) | `speciesFilletSprite` · `butcherFilletFrames`(군 그림 ↔ 어종 그림 rect + 열 실루엣 — 이웃 ±2열로 묶음) · 갈빗대 · 지아이 · 손질 끝 · 박피 뷰가 어종 그림(틴트 없음) · 박피 ① 칼집 자국 = 실제 유도선 |
| 수정 | [`ButcheryPanel.ts`](../../../packages/client-pc/src/ui/ButcheryPanel.ts) | `filletFrames` 넘김 · 가방 아이콘 셋 어종 그림 · F9 「군 확정」 필렛 뷰도 역변환 |
| 신설 | [`FilletSpeciesIcons.ts`](../../../packages/client-pc/src/ui/FilletSpeciesIcons.ts) | 아이콘 = 스프라이트를 캔버스로 굽기(`trimsp_<종류>_<어종>` — PNG를 따로 안 싣는다) · `ensureTrimTexture`(다시 불러온 뒤 처음 그릴 때 굽기 — 315 장어 결과물 `trim_eel_*`도) |
| 수정 | [`ItemIcon.ts`](../../../packages/client-pc/src/ui/ItemIcon.ts) | `createItemIcon` 머리에서 `ensureTrimTexture` |
| 신설 | [`SashimiSpeciesArt.ts`](../../../packages/client-pc/src/ui/SashimiSpeciesArt.ts) | 한 점은 부팅에 · 탑뷰 · 측면은 회썰기 창을 열 때 그 어종 것만(`ensureSashimiSpeciesArt` · 6초 넘으면 군 그림으로) |
| 수정 | [`SashimiPanel.ts`](../../../packages/client-pc/src/ui/SashimiPanel.ts) · [`UtilizationPanel.ts`](../../../packages/client-pc/src/ui/UtilizationPanel.ts) · `BootScene.ts` | 실린 어종 그림이면 그 텍스처 · 프로필 · 회 조각 아이콘 · 오버라이드 키 `<어종>_<모드>` · 창 열기는 싣고 나서(`sashimiLoading` 연타 막기) · 도마 진열 조각도 어종 한 점 |
| 신설 | [`ButcheryFlow316.test.ts`](../../../packages/core/src/simulation/ButcheryFlow316.test.ts) | 6건 — 뷰 표 · 뷰별 옮기기(박피 ② 단면 · 장뜨기 그대로) · 한 뷰만 · 작은 생선 핀셋 · 군/어종 확정 · 열 실루엣 · 필렛 B 뒤집기 · 역변환 |

**위키**: 「어종 손질」 탭에 갈래마다 「어종별 필렛 그림」 절(방어류 13 · 작은 생선류 5 · 돔류 8 — 시트 webp 3장) · 방어류 · 작은 생선 · 돔류 공정 그림 다시 찍기 · 시스템 316 항목.

## 4. 구조상 위치 — 어느 계층의 무엇인가

- `손질 → 도마 그림 → 필렛 뷰` — **렌더 층**(어종 스프라이트) + **판정 좌표 층**(유도선을 그림 자리로 옮기는 식).
- 옮기는 식은 core(`remapGuidePoint` · 숫자 배열만 받는다 — 그림을 모른다), 실루엣은 client가 스프라이트에서 잰다(313 `guideFrame`과 같은 나눔).
- 아이콘 · 회썰기는 **에셋 층**(굽는 텍스처 · 늦게 싣기) — 세이브에는 텍스처 키 문자열만 남는다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 생성 | `_log.jsonl` | 74번 첫 시도 74/74 · 갈빗대 IoU 0.96~0.99 · 껍질 IoU 0.95~1.00 · 재생성 4(눈퉁멸 · 보리멸 · 청볼락 갈빗대 — 갈빗대가 안 보였다 · 문절망둑 껍질 — 꼬리 껍질이 떨어진 조각처럼). 토큰 입력 21.6만 · 출력 12.3만 |
| 검수 시트 | 어두운 바탕 · 26줄 | 흰 테 없음 · 방향(꼬리 왼쪽) 26/26 |
| 유도선 ↔ 살 | r316 ① — 27종 × 필렛 뷰 6(rib_a/b · pin_a/b · peel_grip · peel_pull) · 표본 24점 | 최저 0.88(돌돔 박피 ③) · 군 그림 기준보다 0.1 넘게 낮은 곳 0. 1차(rect만)는 열기 박피 ① 0.21 · 참돔 0.46 — 열 실루엣으로 고침. 2차는 잿방어 껍질 그림 첫 열(둥근 모서리 0.08~0.29)에서 농어 당기기 끝이 살 밖 — 이웃 열 묶기 + 0~100% 묶기로 고침 |
| 도마 화면 | r316 ② — 8종 × 갈빗대 · 지아이 · 박피 ① · ③ 30장 | 어종 그림 · 틴트 없음 · 선이 살 위(육안) |
| 아이콘 | r316 ③ — 텍스처를 지운 뒤 `createItemIcon` | 굽는 키 5(장어 결과물 포함) 다시 구움 · 참돔 야간 → 참돔 · 잿방어 = 원래 그림 |
| 회썰기 | r316 ④ — 농어(일반) · 고등어(고급) · 참돔 · 잿방어 | 실은 뒤 열림(0.7~1.1초 · 헤드리스) · 어종 텍스처 · 컷 14 · 16 · 잿방어는 군 그림 · 회 조각 = 어종 한 점 |
| 위키 | wikicheck316 6/6 | 필렛 칸 13 · 5 · 8 · 시트 720×1248 · 「농어」 → 도감 · 폰 폭 400 넘침 없음 |
| 빌드 | `npx pnpm run build` · 루트 typecheck · core vitest | 3/3 · 4/4 · 61 파일 572건 |

재현: dev 서버 → `node $SP/r316.cjs $SP/r316/`(scratchpad — 구조는 315 r315eel과 같다).

**배포본(114차)** — gh-pages를 로컬(4173)로 띄워 확인(컨테이너에서 라이브 주소는 닿지 않는다):
기동 8.3초 · 로컬 4xx 0(바깥 1 = KAMIS 시세 스냅샷 — 키 대기) · pageerror 0 · 소스맵 0 · 정적 2,237 · `sashimi/sp/` 72(탑뷰 · 측면 200) ·
한 점 텍스처는 부팅에 실리고 탑뷰는 안 실림 · 번들에 어종 필렛 스프라이트 키 · `trimsp_` · `sashimi_sp_` · `filletFrames`.

## 6. 잔여 — 이번에 안 한 것

- **장뜨기 벌어짐 · 복면 · 체강 뷰**는 아직 어종군 그림(어종 색 22%) — 칼집 회차마다 벌어짐 4단계가 유도선과 묶여 있어 한 장씩 그리면 단계가 어긋난다. 착수 조건: 사용자 결정(뷰 수 약 20 × 어종).
- **넙치류 4종**(도다리 · 문치가자미 · 강도다리 · 개서대) 필렛은 광어 그림 그대로(흰 살이라 차이가 작다).
- 참다랑어 · 대방어급 4덩어리 해체 · 장어 포 회썰기 — 315 제안 그대로(사용자 결정 뒤).
- 옛 세이브의 필렛 아이템은 옛 아이콘 키(군 그림 · 틴트 캔버스 `trimfillet_*`)를 들고 있다 — 새로 손질한 것부터 어종 그림.

## 7. 위험·부작용

- 번들: `PixelFilletSpecies.ts` 516KB(소스) — gzip이 행 문자열을 잘 줄인다. 회썰기 그림 3.8MB는 부팅에 싣지 않는다(한 점 24장만).
- F9 「군 확정」을 필렛 뷰에서 누르면 어종 그림 자리 → 군 그림 자리로 되옮겨 저장한다(열 실루엣 역변환 — 살 밖 점은 경계로 묶인다).
- 회썰기 창 열기가 비동기가 됐다 — 싣는 사이 창이 닫히면 열지 않는다(`!this.scene || !this.active`) · 연타는 `sashimiLoading`.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/butchery.md` §4 · §5 · §6(43 · 44)
- [x] `04-BACKLOG.md` DO
- [x] AGENTS §9 · PLAN · CLAUDE.md(진행 줄 · 316 · 배포 줄 · 아티팩트 판)
- [x] 스킬 `asset-pipeline` ⑨ · `f9-guide-coords`(필렛 뷰 군 확정)
- [x] 아티팩트 4개 — 남은 과업 V67 · 구현 라이브러리 V66 · 채비 순서도 V59 · 위키 V119
