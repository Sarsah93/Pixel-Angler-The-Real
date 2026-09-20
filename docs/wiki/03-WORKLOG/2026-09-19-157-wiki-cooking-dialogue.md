# 157차 — 전체 위키 확장 · 요리 분류 정리 · 대화창 리디자인

| | |
|---|---|
| **날짜** | 2026-09-19 |
| **시스템** | `요리` `도감` `인벤` `UI` `캐릭터 아트` `문서` |
| **트리거** | 사용자 지시 · 다음 차수 작업 |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 의존성 설치 정책 오류로 미실행 |

---

## 1. 배경 — 왜 했나

사용자는 기존 조행록 퀘스트 아티팩트를 “요리, 제작, 농사, 아이템 등 모든 인게임 요소를 포함하는 Pixel Angler The Real Wiki”로 묶고, 서더리 매운탕과 통생선 매운탕을 별도 요리로 구분하며, 사시미를 요리 분류로 묶고, 상세 별점을 `완성도: ★★★★☆` 형태로 개선하고, NPC 대화창과 초상을 더 귀엽고 읽기 좋게 바꾸도록 요청했다.

## 2. 원인 — 무엇이 문제였나

- 기존 `stew_red`는 생선·손질 생선·서더리를 하나의 주재료 조건으로 받아 결과가 하나의 매운탕 이름으로 합쳐졌다.
- 요리 상세와 사시미 상세가 숫자형 `별 N / 5`를 우선해 시각적 등급을 즉시 읽기 어려웠다.
- 완성 사시미는 `회(사시미)` 하위 분류에 남아 불요리·숙회와 요리 목록이 분리됐다.
- 대화 초상은 32px 전용 얼굴 텍스처를 16px 아트 기준 상수로 배치해 실제 표시 크기와 프레임이 어긋났다.
- Claude 아티팩트는 현재 세션에서 직접 파일로 편집할 수 있는 저장소 자원이 아니므로, 재생성 가능한 전체 위키 템플릿과 전달 컨텍스트를 저장소에 둔다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `packages/core/src/db-schema/FireRecipeDatabase.ts` | `stew_red`를 서더리 전용으로 좁히고 `stew_red_whole` 추가 |
| 수정 | `packages/core/src/db-schema/DishDiscovery.ts` | 두 매운탕을 변형 레시피로 등록하고 긴 recipe id 우선 파싱 |
| 수정 | `packages/core/src/db-schema/RecipeLore.ts` | 서더리/통생선 이름과 설명·어종별 로어 분리 |
| 수정 | `packages/core/src/db-schema/FoodNutrition.ts`, `FoodEffects.ts` | 통생선 매운탕 영양·효과 등록 |
| 수정 | `packages/client-pc/src/ui/ItemDetailPanel.ts` | 사시미·불요리 상세를 5칸 별과 완성도 라벨로 표시 |
| 수정 | `packages/client-pc/src/ui/SashimiPanel.ts`, `UtilizationPanel.ts`, `ShopCatalog.ts`, `InventoryStore.ts` | 완성 회·숙회 산출물을 `요리(회)`·`요리(숙회)`로 분류 |
| 수정 | `packages/client-pc/src/ui/DialoguePanel.ts` | 얼굴 전용 32px 텍스처와 프레임 크기를 맞추고 둥근 픽셀 카드·우호도 바 적용 |
| 신설 | `tools/gen_game_wiki_data.mjs`, `tools/game_wiki_template.html` | 퀘스트·요리·어종·제작·아이템·시스템 문서를 한 HTML 위키로 생성 |
| 신설 | `docs/wiki/PIXEL-ANGLER-THE-REAL-WIKI-ARTIFACT-CONTEXT.md` | Claude 아티팩트에 전체 위키를 반영하기 위한 데이터 연결·표시 규칙 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S4 회·불요리 → 레시피/요리 개체/인벤 표시`와 `S20 도감 → 전체 위키 발행`, `캐릭터 대화 → 초상·패널 렌더`에 걸친 작업이다. core에는 레시피·발견·영양·효과 데이터만 두고, 별 glyph와 패널 프레임은 client UI에 두었다. 기존 `stew_red` id는 보존해 저장된 일반 서더리 매운탕과의 호환을 유지한다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 레시피 조건 | 정적 데이터·참조 검색 | 서더리 `seodeori`와 통생선 `fish` 조건 분리 확인 |
| 도감 id | `parseDishDiscoveryId` 경로 점검 | `stew_red_whole`이 `stew_red`로 잘못 파싱되지 않도록 긴 id 우선 |
| UI 문자열 | `rg` 참조 검색 | 완성 사시미·상점 모듬회·숙회 분류 변경 확인 |
| 빌드 | `pnpm --filter ... build/typecheck` | 패키지 의존성 설치가 pnpm의 EACCES/ignored-build 정책에 걸려 미실행 |

## 6. 잔여 — 이번에 안 한 것

- GPT Image 기반 신규 PNG 초상은 사용하지 않았다. 현재 얼굴은 동일 `CharConfig`에서 생성되는 픽셀 렌더러이므로, 이번 차수는 프레임·배율·레이아웃을 먼저 고쳤다. 실제 렌더 확인 후 표정·색감이 여전히 부족하면 ImageGen 에셋 교체를 별도 차수로 잡는다.
- Claude 페이지의 기존 아티팩트에 직접 입력하는 대신 재생성 가능한 HTML과 컨텍스트 파일을 남겼다. 사용자가 아티팩트에 붙여 넣거나 다음 Claude 세션에서 파일을 읽히면 전체 위키로 전환할 수 있다.
- 요리 도감의 모든 레시피를 어종별 변형으로 확장하지 않았다. 이번 요청 범위는 매운탕의 두 조리 방식과 전체 위키 뼈대다.

## 7. 위험·부작용

- `stew_red`의 기존 다중 주재료 허용을 제거했으므로, 저장된 진행 중 세션이 통생선 주재료였다면 새 `stew_red_whole` 세션으로 다시 선택해야 한다. 완성된 기존 아이템은 `dishInstance`와 recipe id를 그대로 보존한다.
- `요리(회)` 하위 분류를 소비하는 외부 필터가 있다면 `회(사시미)` exact match를 점검해야 한다.
- `★`·`☆`는 사용자 요청에 따른 등급 표시이며, 기존 내부 수치 계산은 변경하지 않았다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/*.md`에 분리 규칙·전체 위키 생성기 반영
- [x] `04-BACKLOG.md`에 Claude 아티팩트 직접 반영 및 ImageGen 후속 조건 기록
- [ ] `AGENTS.md` §9 요약 링크 추가
- [ ] `IMPLEMENTATION_PLAN.md` 다음 착수 항목 링크 추가
- [x] 새 함정 — discovery id는 긴 recipe id부터 파싱
