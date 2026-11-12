# 322차 — F9 확정 3종 반영 · 전갱이류 모비늘 제거 · 새 어종 9(청어과 셋 · 조기류 둘 · 바리류 넷)

| | |
|---|---|
| **날짜** | 2026-11-12 |
| **시스템** | `손질` · `낚시` · `경제 데이터` · `도감 · 위키` · `에셋` |
| **트리거** | 사용자 첨부(`captures.json` · `log.jsonl`) + 요구 둘 |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` — `7afe3a4`(확정 3종) · `ed4979b`(모비늘 · 새 어종 · 문서) |
| **빌드·타입체크** | §5 |

---

## 1. 배경 — 왜 했나

> 「어제 벵에돔에 이어, 오늘은 전갱이, 긴꼬리벵에돔, 감성돔까지 손질 가이드 수정을 완료했어. 다른 생선들은 시간 있을 때 똑같은 PC에서 작업하던지해서,
> 여기 첨부할 게. 확인하고 main 반영 & gh-pages 재배포까지 해줘.」

> 「1) 전갱이 종류에는 손질 2단계인 '밑손질' 단계에서 모비늘 제거 과정을 하나 더 추가하고 싶어. 몸통에서 꼬리 쪽으로 가는 부분에 모비늘이라는 게
> 모든 전갱이 종류에는 다 있어서(고등어 및 다랑어류에는 없음) 웹 검색 등을 통해 너가 잘 구현해줄 수 있을까?」

> 「2) 어종 전어, 청어, 멸치, 참조기, 백조기, 붉바리, 자바리(표준명 자바리/제주 다금바리; 가끔 잡히며, 제주도에서는 다금바리라 부름 …),
> 다금바리(표준명 다금바리; 태평양 서부 쪽 서식지라 잘 안잡히긴 하지만 몸길이 평균 1m 정도에 5월부터 8월까지 가끔 발견됨, 아주 맛있는 고급 생선),
> 능성어(구문쟁이) 얘네도 어종 DB에 추가(Gemini Image Generation)해줘. 손질 배선도 지금 형태에서 잘 분류해봐.」

## 2. 원인 — 무엇을 확인했나

| 항목 | 확인한 것 · 근거 |
|---|---|
| 첨부 확정분이 그어진 화면 | 기록 시각이 2026-11-12 13:28 ~ 13:54Z다. 321차(지아이뼈 단계 그림을 한 면 필렛으로) 커밋은 14:51Z — 확정은 320차 화면에서 했다. 그래서 **지아이뼈 분리 선(`pin_a` · `pin_b`) 6개는 옛 「한 덩어리」 그림 위의 선**이다(321 워크로그 §6 예고 그대로) |
| 나머지 단계 | 시메 ~ 꼬리 칼집 · 장뜨기 · 갈빗대 · 박피는 320 ~ 321 사이에 그림이 바뀌지 않았다 → 그대로 유효 |
| 모비늘 손질법 | 웹 조사(일본 「ぜいご」 손질 — 여러 조리 안내가 일치): 꼬리 자루에서 칼을 눕혀 넣고 위아래로 톱질하듯 머리 쪽으로 저민다 · 앞 · 뒤 양면 · 비늘을 먼저 친다. 모비늘은 옆줄 뒤쪽(꼬리 자루 → 몸 가운데)의 가시 비늘 줄이고 전갱이과 전갱이류만 가진다 |
| 전갱이 그림의 모비늘 자리 | `food assets/fish/jack_mackerel.png`에 좌표 격자를 얹어 잼 — 누런 빗살 줄이 그림 rect (0.855, 0.49) → (0.55, 0.44), 옆줄은 (0.40, 0.385)까지 휘어 오른다 |
| 새 어종 9 | 어종 표 61종에 없음(id · 이름 대조). 등록 층 = 오라클 · 도감 · 경락 기본값 · 품목 매핑 2 · 바다 가중 · 조리 프로필(295차 섬 어종과 같은 층) |
| Gemini | `HTTP 402 Your prepayment credits are depleted` — 작업 시작 · 중간 · 끝 세 번 다 같다. **그림은 그리지 못했다**(§6) |
| 드문 어종이 흔하게 나옴 | 처음 넣은 값으로 가장 알맞은 자리(제주 깊은 암초 · 제철 · 밤 · 생미끼)에서 자바리 28% · 다금바리 15% — 그 자리에 사는 다른 어종이 적어 몫이 컸다. 바다 가중만으로는 못 누른다 |

## 3. 변경 — 어디를 어떻게

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`tools/f9_merge_captures.cjs`](../../../tools/f9_merge_captures.cjs) | 받은 확정분을 정본에 합친다 — 단계마다 늦은 시각이 이김 · 군 공통값 유지 · **그림이 바뀌기 전 선 버림**(`STALE` 표) · 기록 합침 · 표 굽기 |
| 수정 | `tools/f9_captures/*` · `ButcheryGuideOverrides.ts` | 전갱이 · 긴꼬리벵에돔 · 감성돔 각 25단계(새 단계 75 · 기록 106줄) — 6개 키 113단계 |
| 수정 | [`types/Butchery.ts`](../../../packages/core/src/types/Butchery.ts) · [`ButcheryProfiles.ts`](../../../packages/core/src/db-schema/ButcheryProfiles.ts) | `hasScutes`(전갱이) · 새 9종 프로필 · `BUTCHERY_WIRED_SPECIES` · `BUTCHERY_ART_PENDING_SPECIES` · 해체 기준에 큰 바리 셋(80cm) · 어종군 방추형 |
| 수정 | [`ButcheryProcess.ts`](../../../packages/core/src/simulation/ButcheryProcess.ts) | 단계 `scute_base` · `scute_flip`(비늘 다음 · 머리 앞) · 선 = 어종군 세트 `scuteBase`(그림 자리로 옮김) · 뒷면 = 앞면의 좌우 대칭 · 앞면만 확정하면 뒷면이 따라옴 |
| 수정 | [`ButcherySections.ts`](../../../packages/core/src/db-schema/ButcherySections.ts) | 밑손질에 작업 「모비늘 제거」(원형어 · 해체 · 작은 생선) — 단계가 없는 어종은 `resolveButcherySections`가 뺀다 |
| 수정 | [`PixelButcherFish.ts`](../../../packages/client-pc/src/ui/PixelButcherFish.ts) · [`ButcheryPanel.ts`](../../../packages/client-pc/src/ui/ButcheryPanel.ts) | 저민 면만 선을 따라 띠를 속살 빛으로 다시 칠한다(`paintScuteStrip` — 꼬리 쪽 굵게) · `scuteCutPathForFrame` |
| 수정 | [`FishSpawningOracle.ts`](../../../packages/core/src/simulation/FishSpawningOracle.ts) | 9종 · `closedSeasonExemptRegions`(전어 — 강원 · 경북 제외) · `abundance`(개체 수가 적은 어종 배수) |
| 수정 | `FishDatabase.ts` · `Economy.ts` · `MafraAuctionApiClient.ts` · `ExternalDataStore.ts` · `SpeciesPresence.ts` · `FishCookingProfiles.ts` · `FishRarity.ts` · `FishTemplateRenderer.ts` | 9종의 도감 · 값 · 품목 매핑 · 바다 가중 · 조리 프로필 · 파이팅 어종군 · 그림 없을 때 색 |
| 수정 | `tools/gemini_fish_art.cjs` · `tools/gen_species_sprites.cjs` | 9종 생김새 설명 · 도마 그림 굽기 표(원본이 생기면 굽는다) |
| 수정 | `tools/capture_butchery_wiki.cjs` · `tools/gen_game_wiki_data.mjs` · `tools/game_wiki_template.html` | 공정 시트 「전갱이」(21단계) · 방어류 · 돔류 다시 찍음 · 「그림 준비 중」 어종 줄 · 시스템 줄 |
| 수정 | `HelpContent.ts` · `i18n/en*.ts` | 도움말 손질 흐름 한 줄 · 단계 · 작업 이름 영어 |
| 신설 | [`ButcheryFlow322.test.ts`](../../../packages/core/src/simulation/ButcheryFlow322.test.ts) | 확정 표 전수 완주 · 모비늘 6 · 새 어종 20 — 33건 |
| 수정 | `ButcheryFlow304.test.ts` · `ButcheryFlow317.test.ts` | 트리에 작업이 하나 늘어 「같은 객체」 기준 어종을 전갱이로 · 해체 기준 표 |

### 손질 분류(사용자 「지금 형태에서 잘 분류해봐」)

| 어종 | 공정 | 근거 |
|---|---|---|
| 전어 · 청어 · 멸치 | 작은 생선 공정(`tree: 'small'`) | 눈퉁멸과 같은 청어과 — 비늘 → 머리 · 내장 → 검은 막 → 삼장뜨기 → 갈비뼈 · 잔뼈. 멸치는 10cm부터 |
| 참조기 · 백조기 | 방어류 흐름 삼장뜨기 | 체고가 몸길이의 0.27 ~ 0.30 — 농어 · 숭어와 같은 길쭉한 몸 |
| 붉바리 | 방어류 흐름 삼장뜨기 | 우럭과 같은 둥근 몸통. 80cm까지 크지 않는다 |
| 자바리 · 다금바리 · 능성어 | 같은 삼장뜨기 · **80cm부터 4덩어리 해체** | 10kg 안팎부터는 반쪽을 등살 · 뱃살로 갈라 다룬다(일본 「쿠에」 · 「아라」) |

## 4. 구조상 위치 — 어느 계층의 무엇인가

```
손질 > B1 어류 손질 > 밑손질 > 모비늘 제거            ← 데이터(프로필) · 계약(단계 · 작업) · 렌더(띠)
손질 > F9 [확정] > 받은 확정분 합치기                 ← 도구 · 데이터
낚시 > 스폰 오라클 > 어종 9 · 금어기 지역 예외 · 드문 어종 배수   ← 데이터 · 판정
경제 > 경락 기본값 · 품목 매핑                        ← 데이터
도감 · 위키 > 어종 9 · 어종 손질 탭                   ← 데이터 · 문서
```

- **계약이 바뀐 것**: 손질 단계 id 둘(`scute_base` · `scute_flip`) · 작업 id 하나(`t_scute`) · 프로필 필드 `hasScutes` · 오라클 필드 둘.
  섹션 트리를 직접 읽는 코드는 `resolveButcherySections`를 거쳐야 한다(모비늘 없는 어종의 빈 작업).
- **세이브**: 새 필드는 전부 정적 데이터다(세이브에 없다). 진행 중이던 전갱이 손질은 창을 닫으면 원물로 돌아오므로 중간 상태가 남지 않는다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 확정 좌표 | core 시험 — 확정 표의 어종마다 확정 선 그대로 그어 완주 · 좌표가 표 그대로 | 4종 통과 |
| 모비늘 — 공정 | core 시험 6건(전갱이만 · 순서 · 대칭 · 그림 자리 · 작업 목록 · 통과/실패 · 확정 대칭) | 통과 |
| 모비늘 — 화면 | 하네스 `r322scute`(실제 마우스 — 시메 → 밑손질 넷 → 내장 → 꼬리 칼집) | 4 / 4(마지막 꼬리 칼집 뒷면에서 시간 초과 — 모비늘 앞 · 뒤는 통과) · pageerror 0 |
| 모비늘 — 눈 | 캡처: 작업 목록 넷 · 유도선이 누런 빗살 줄 위 · 저민 면만 옅은 띠 · 꼬리 칼집 단계에도 띠 | 확인 |
| 고등어 | 같은 하네스 — 단계 · 작업 없음 | 통과 |
| 새 어종 — 층 정합 | core 시험(이름 · 규제 · 체장-체중 · 품목 매핑 · 존재 · 어종군 · 손질 분류 · 그림 대기 · 완주 9 + 해체 3) | 통과 |
| 새 어종 — 스폰 | 하네스 `r322new` — 제 바다 · 제철 문맥 4,000번 | 9종 다 나옴 · 자바리 약 5% · 다금바리 0.7% |
| 새 어종 — 화면 | 도감 6쪽 · 가방 · 상세 창(그림 없음) | 9종 이름 · 「이미지 없음」 9칸 · pageerror 0 |
| 위키 공정 시트 | `capture_butchery_wiki.cjs jack,amberjack,bream` | 21 · 20 · 20단계 · pageerror 0 |
| 빌드 | `npx pnpm run build` · 루트 `typecheck` · core 시험 | 3/3 · 4/4 · 615 / 615 |

재현(모비늘): dev → 가방에 전갱이 → 활용(U) → 손질 → 방혈 뒤 「밑손질」 작업 목록에서 「모비늘 제거」.

## 6. 잔여 — 이번에 안 한 것

- **새 어종 9종의 그림**(어획 카드 · 아이콘 · 도마 그림 · 필렛 그림) — Gemini 선불 크레딧 소진(402). 크레딧이 채워지면:
  1. `NODE_USE_ENV_PROXY=1 node tools/gemini_fish_art.cjs --out <폴더>` → 검수 시트 → `--install`
  2. `FishTextures.ts`의 `FISH_TEXTURE` · `FISH_IMAGE_FILES`에 9줄 → `node tools/fish_cards.cjs`
  3. `node tools/gen_species_sprites.cjs`(도마 그림) → core `BUTCHERY_ART_PENDING_SPECIES`에서 빼기 → 손질이 열린다
  4. 필렛 그림은 `gemini_fillet_art.cjs` 표에 추가하거나 닮은 어종 별칭(`FILLET_SPECIES_ALIAS`)
  5. 위키 그림(`gen_wiki_images.py`) · 아티팩트
- **지아이뼈 선 다시 확정** — 전갱이 · 긴꼬리벵에돔 · 감성돔. 지금은 그림의 혈합육 줄을 따라 자동으로 놓인다 — 어긋난 어종만.
- **모비늘 선 F9 확정** — 지금 선은 그림에서 잰 근사다. 앞면만 확정하면 뒷면은 대칭으로 따라온다.
- **다른 전갱이류**(줄전갱이 · 갈전갱이 · 가라지) — 어종 표에 없다. 넣을 때 프로필에 `hasScutes: true`.
- **멸치 손질의 실제 손맛** — 멸치는 칼보다 손으로 머리 · 뼈를 바르는 생선이다. 지금은 작은 생선 공정으로 분류만 했다.
- **새 어종의 이야기 · 요리 · 특산 연결** — 등록만 했다(굴비 가공 · 다금바리 맑은탕 같은 지역 레시피는 요청이 오면).

## 7. 위험·부작용

- **섹션 트리의 「같은 객체」 가정이 깨졌다** — 비늘 있는 어종도 이제 밑손질 섹션이 새 객체다(모비늘 작업이 빠진 사본). 객체 동일성으로 캐시하는 코드는 없었다(전수 확인 — 시험 하나만 기준 어종을 바꿈).
- **`abundance`는 스폰 가중 전체에 곱한다** — 입질 몫 · 미끼 친화도 계산도 같은 가중을 쓴다. 값이 없는 기존 60종은 1이라 그대로다(시험으로 고정).
- **금어기 지역 예외는 지역 id 글자 맞춤이다** — 새 강원 · 경북 지역을 넣으면 id에 `gangwon` · `gyeongbuk`이 들어가거나 목록에 더해야 한다(전어뿐).
- **품목 매핑 「조기」** — 품종 없는 「조기」는 참조기로 본다. 부세 · 수조기가 들어오면 품종 줄을 더한다.
- **그림 없는 어종이 배포에 들어간다** — 도감 칸은 「이미지 없음」, 가방 칸은 대체 그림이다. 손질은 닫혀 있어 다른 어종 그림이 대신 나오는 일은 없다.

## 8. 후속 반영

- [x] 워크로그 색인 · 시스템 페이지(`butchery` · `fishing-loop` · `economy-data` · `discovery-wiki`) · 백로그(DR)
- [x] AGENTS §9 · PLAN · CLAUDE.md
- [x] 스킬 `add-species`(그림 대기 · 드문 어종 · 금어기 지역 예외) · `f9-guide-coords`(받은 확정분 합치기 · 모비늘 선)
- [x] 아티팩트 4개 — 남은 과업 설계 [Version 73](https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4) · 구현 라이브러리 [72](https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5) ·
  채비 모딩 순서도 [65](https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1)(「322차 기준」 줄만) · 위키 [125](https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c)(헤드리스 10 / 10 · 공정 시트 3장)
- [x] main 반영 `ed4979b`(빨리 감기) · **118차 배포** gh-pages `2a64dd7`(Actions 「테스트 배포」 47번째 실행 — 320 ~ 322 포함)
  - 배포본 점검(gh-pages를 로컬 4173으로): 기동 11.4초 · 4xx 0(바깥 1 = KAMIS 스냅샷) · pageerror 0 · 소스맵 0 · 정적 2,237 · `public/` 2,234개 바이트 같음
  - 번들: `scute_base` · `scute_flip` · 「모비늘 제거」 · `gizzard_shad` · `sawedged_perch` · 확정 시각 둘(전갱이 · 감성돔) · `trimsp_side_` · `closedSeasonExemptRegions`
