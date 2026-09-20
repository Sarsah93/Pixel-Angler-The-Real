# Pixel Angler The Real Wiki 아티팩트 컨텍스트

이 문서는 기존 Claude 전용 `조행록 퀘스트 항로도` 아티팩트를 게임 전체 위키로 확장하기 위한 전달 문서다. 기존 퀘스트 데이터와 구조를 버리지 않고 `조행록`을 전체 위키의 한 섹션으로 편입한다.

## 목표

- 제호를 `Pixel Angler The Real Wiki`로 변경한다.
- 시작 화면에는 게임의 핵심 설계 원칙과 발견/미발견 상태를 설명한다.
- 좌측 또는 상단 네비게이션에 `개요 / 조행록 / 요리 / 회·손질 / 어종 / 제작 / 농사 / 아이템 / 장비·채비 / 생존 / 월드 / 캐릭터·대화`를 둔다.
- 기존 퀘스트 항목은 `조행록` 안에서 그대로 검색·필터링할 수 있어야 한다.
- 내부 id는 발견된 정보의 보조 데이터로만 사용하고, 유저에게는 한국어 이름을 우선 표시한다.
- 미발견 항목은 `???`로 가리고 입수 힌트만 보여 준다.

## 정본 데이터 연결

| 섹션 | 정본 코드/문서 |
|---|---|
| 조행록 | `tools/gen_quest_wiki_data.mjs`, `STORY_QUESTS`, `STORY_ARCS`, `STORY_CHAPTERS` |
| 요리 | `FIRE_RECIPES`, `COOK_INGREDIENTS`, `DishDiscovery`, `RecipeLore`, `DishInstance` |
| 회·손질 | `SashimiQuality`, `SashimiSlicing`, `SashimiPanel`, `UtilizationPanel` |
| 어종 | `FISH_DATABASE`, 어획물 상세 데이터, `docs/wiki/02-SYSTEMS/fishing*.md` |
| 제작 | `CRAFT_BLUEPRINTS`, `CraftingDatabase`, `docs/wiki/02-SYSTEMS/crafting.md` |
| 농사 | farming 스킬·퀘스트·홈베이스 문서, 관련 `docs/wiki/02-SYSTEMS` 페이지 |
| 아이템 | `packages/client-pc/src/data/WikiCatalog.ts`, `ShopCatalog.ts`, `QuestRewardItems.ts` |
| 장비·채비 | 장비/채비 DB와 `docs/wiki/02-SYSTEMS` 관련 페이지 |
| 생존·월드 | `GameState`, 지역·날씨·조례 시스템 문서 |
| 캐릭터·대화 | `StoryNpc`, `DialoguePanel`, `FacePortrait`, 스토리 문서 |

## 요리 표시 규칙

매운탕은 이름과 도감 항목을 다음처럼 분리한다.

- `감성돔 서더리 매운탕`: 머리·등뼈·갈비뼈 등 `seodeori` 주재료.
- `감성돔 매운탕`: 감성돔 한 마리를 통째로 넣는 `fish` 주재료.

둘은 같은 `stew_red` 계열이지만 서로 다른 레시피 id와 발견 id를 가진다. 요리 상세는 숫자만으로 `별 5/5`를 쓰지 않고 `완성도: ★★★★☆ · 84점` 패턴을 사용한다. 간·온도·식감·신선도·완성도도 같은 5칸 별 표현을 우선한다.

사시미·모듬회·숙회처럼 바로 먹는 산출물은 인벤토리의 `food` 카테고리 안에서 `요리(회)`, `요리(숙회)` 하위 분류로 묶는다. 필렛·회 조각처럼 아직 조리/플레이팅 전인 것은 재료 분류로 남긴다.

## 아티팩트 구현 메모

현재 저장소에는 위키 데이터를 정적으로 굽는 `tools/gen_game_wiki_data.mjs`와 화면 템플릿 `tools/game_wiki_template.html`이 추가되어 있다. 다음 명령으로 전체 위키 HTML을 만든다.

```text
pnpm --filter @tra/core run build
node tools/gen_game_wiki_data.mjs --html > outputs/pixel-angler-the-real-wiki.html
```

Claude 아티팩트에 반영할 때는 이 문서와 생성된 HTML을 기준으로 기존 퀘스트 화면을 `조행록` 탭으로 옮기고, 전체 위키의 나머지 탭을 연결한다. 새 시스템이 아직 코드로 구현되지 않은 경우에는 문서 페이지에 “설계 중/열람만 가능” 상태를 명시해 실제 플레이 가능 정보와 예정 정보를 섞지 않는다.
