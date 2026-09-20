# 163차 — 지도·HUD·튜토리얼 심부름·해루질 확장

## 1. 요청 범위

전체 지도 드래그 방향, HUD 독립 드래그·퀵 퀘스트 크기, M1-01→M1-02 연결성, 심부름 아이템 탭, 해루질 종 추가와 장비 착용 안내 제거를 반영했다. 이번 차수의 검증은 사용자가 요청한 대로 실플레이 없이 타입체크까지만 수행했다.

## 2. 핵심 변경

| 영역 | 반영 |
|---|---|
| 전체 지도 | 지도를 잡아 끄는 방향으로 변경. 위로 드래그하면 지도도 위로 이동해 남쪽이 드러난다. |
| HUD | 상태·채널·미니맵·지금 할 일을 각각 드래그. 퀵 퀘스트는 미니맵 크기와 분리된 폭/높이 단계와 헤더 버튼을 사용한다. |
| 퀘스트 | 영금정 도착 후 부모와의 수산시장 기억 → 동명항 방파제 → 정옥선 상담 → 얼음 심부름으로 이어지는 KO/EN 나레이션을 추가했다. |
| 심부름 아이템 | 인벤토리에 `퀘스트` 탭과 `심부름용 얼음` 카탈로그를 추가했다. 새 흐름의 첫 얼음 일감은 아이템을 지급하고, 정옥선 완료 대화에서 차감한다. 구세이브의 기존 진행은 보존한다. |
| 해루질 | 오분자기, 말똥성게, 참군소, 쫄장게를 추가하고, 기존 꽃게를 조간대 후보(웅덩이·항만 벽)에 연결했다. 기존 문어는 갯바위·방파제·조수웅덩이 해루질 종으로 유지했다. 대게는 추가하지 않았다. |
| 안내 | 필드에서 반복되던 ‘낚싯대를 손에 착용하세요’ 강제 안내 호출을 제거했다. |

## 3. 수정 파일

- `packages/client-pc/src/ui/FullMapPanel.ts`
- `packages/client-pc/src/ui/RegionHud.ts`
- `packages/client-pc/src/ui/InventoryPanel.ts`
- `packages/client-pc/src/store/InventoryStore.ts`
- `packages/client-pc/src/store/StoryStore.ts`
- `packages/client-pc/src/ui/DialoguePanel.ts`
- `packages/client-pc/src/data/QuestRewardItems.ts`
- `packages/client-pc/src/scenes/AnglerLogScene.ts`
- `packages/core/src/db-schema/StoryQuestDatabase.ts`
- `packages/core/src/db-schema/StoryNarrative.ts`
- `packages/core/src/db-schema/StoryNarrativeEn.ts`
- `packages/core/src/db-schema/ShoreCreatureDatabase.ts`
- `packages/core/src/types/Foraging.ts`

## 4. 검증

통과:

- `pnpm --filter @tra/core run build`
- `pnpm --filter @tra/client-pc run typecheck`

실브라우저 이동·씬 전환·HUD 드래그·해루질 스폰 검증은 이번 차수에서 수행하지 않았다.

## 5. 남은 범위

- `JournalPanel`의 상세 목표·보상·스토리 체계 전체를 독립 스크롤 흐름으로 재작성하는 작업.
- 모든 팝업/알림의 공통 디자인 토큰 통합.
- 얼음 배달을 별도 전달 NPC/목적지 이벤트로 세분화하는 확장. 현재는 일감 지급 → 퀘스트 아이템 보유 → 정옥선 완료 대화 차감까지 연결되어 있다.
- 전체 186개 퀘스트의 사건 연결성 문장에 대한 문학적 전수 감수.
- 해루질 도트 스프라이트를 전용 아트 에셋으로 교체하는 작업. 이번 차수는 기존 코드 렌더 경로에서 사용할 수 있는 데이터·스폰 배선만 추가했다.

## 6. 위키 아티팩트

전체 위키 생성기는 `tools/gen_game_wiki_data.mjs`와 `tools/game_wiki_template.html`이다. Windows Node의 ESM 절대경로 문제도 `pathToFileURL`로 수정했다. 현재 생성본은 `outputs/pixel-angler-the-real-wiki.html`이며 Claude 전용 아티팩트 API는 이 저장소 작업 환경에서 직접 갱신할 수 없으므로, 이 파일을 Claude에 업로드·교체하면 된다. 연결 규칙은 `docs/wiki/PIXEL-ANGLER-THE-REAL-WIKI-ARTIFACT-CONTEXT.md`에 있다.

## 7. 세이브·호환성

기존 퀘스트 진행 구조와 기존 `M1-02` 완료값은 변경하지 않는다. 새 얼음 아이템은 새 일감 흐름에서만 지급되며, 기존 진행이 이미 완료 조건을 충족한 세이브는 아이템 없이도 기존처럼 완료된다.

## 8. 다음 차수 인계

실검증에서 우선 확인할 순서는 `M` 지도 남쪽 드래그 → `M1-01` 영금정 도착 나레이션 → 정옥선 대화 → `E` 인벤 퀘스트 탭 → 얼음 일감 → 완료 보고 및 차감이다. 이후 Journal/UI 통합과 186편 서사 전수 감수를 별도 차수로 진행한다.
