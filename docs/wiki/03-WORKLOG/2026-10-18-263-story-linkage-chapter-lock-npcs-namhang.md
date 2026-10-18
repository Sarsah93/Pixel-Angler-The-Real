# 263차 — 지역 장 순서 잠금 · 속초 밖 인물 25명 배치 · 감천 bbox 확장(남항 · 부산공동어시장) · N18-6 인천 무대

| | |
|---|---|
| **날짜** | 2026-10-18 |
| **시스템** | `스토리` `지도` `필드` `도구` `위키` |
| **트리거** | 사용자 결정 「지역은 장 순서대로 잠그고, 부산 위판장은 bbox 확장으로 해줘.」(262 이야기 연계 점검의 두 물음에 대한 답) |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` — 요청 5 `c067539` + 러너 `617885a` + 263 본 커밋(아래 §8) |
| **빌드·타입체크** | 3/3 · 0 오류 · core 시험 325/325(+3) |

---

## 1. 배경 — 왜 했나

262차 끝에 「다른 지역 전부 구웠다면 퀘스트 연계까지 점검했나」라는 물음에 코드로 답한 결과(262 §6), 지도 층만 열려 있었다.
인물 29명은 지역만 있고 칸이 없어 새 필드에 아무도 서지 않았고, 지역 잠금은 「구역 노드가 있으면 열림」이라 9지역이 처음부터 열려 있었고,
2장 「위판」의 무대인 부산 위판장은 감천 bbox 밖이었다. 사용자가 두 가지를 정했다 — **지역은 장 순서대로 잠그고, 부산 위판장은 bbox 확장으로.**
나머지(인물 배치 · N18-6 인천 이동)는 262 §6에서 「바로 할 수 있다」고 적은 대로 함께 했다.

## 2. 원인 — 무엇이 문제였나

- `isRegionUnlocked(regionId)`는 `REGION_AREA_NODES[regionId]`가 비어 있지 않은가만 봤다. 262차에 노드 11개가 생기면서 울산 · 포항 · 거제 · 여수 · 태안 · 제주 · 인천이
  1장부터 열렸다(장 데이터 `STORY_CHAPTERS.regionIds`는 있었지만 아무도 읽지 않았다).
- `STORY_NPC_PLACEMENTS`는 178차에 「지역 안내 전용」으로 29명을 지역만 적어 두었다(칸 없음 = 세우지 않는다). 데이터 지역이 여럿인 지역(부산 · 거제 · 태안 · 제주)은 칸만으로는
  어느 필드인지 알 수 없어 `dataRegion`이 필요했다.
- 부산공동어시장(35.0884, 129.0252)은 감천 bbox 북쪽 35.082 밖(약 700 m)이었다. OSM에는 `shop=supermarket`으로 올라와 있어 `poiBuildingKind`가 마트(`mart`)로 읽었다 —
  위판장 실내(`auction`)가 되려면 종류 `market` + `AUCTION_NAME` 이름이어야 한다.
- N18-6 ①·② 현장 트리거와 각본 칸은 속초 동명항 경매장 임시 무대(167차)였고, N13-3 난로는 자리표시 칸 (40,40)이었다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`packages/core/src/db-schema/StoryChapters.ts`](../../../packages/core/src/db-schema/StoryChapters.ts) | `chapterOfRegion(regionId)` · `isRegionOpenAtChapter(regionId, chapter)`(노드 있음 + 여는 장 ≤ 지금 장) · `index.ts` export |
| 신설 | [`packages/core/src/db-schema/StoryChapters.test.ts`](../../../packages/core/src/db-schema/StoryChapters.test.ts) | 장 ↔ 지역 1:1 · 장별 열림 · 191편 무대 지역이 그 편의 장에서 열려 있는가(0 위반) · `visit region:*`도 |
| 수정 | [`packages/client-pc/src/scenes/WorldMapScene.ts`](../../../packages/client-pc/src/scenes/WorldMapScene.ts) | `regionOpen()` = `isRegionOpenAtChapter(id, StoryStore.currentChapter())` 세 곳 · 잠긴 줄 「아직 갈 수 없는 곳」 · 알림 「아직 갈 수 없습니다. 지금 갈 수 있는 곳: …」(장 번호 안 냄 — R2) |
| 수정 | [`packages/client-pc/src/i18n/en.ts`](../../../packages/client-pc/src/i18n/en.ts) | 두 문구 영어 |
| 수정 | [`packages/client-pc/src/data/StoryNpcs.ts`](../../../packages/client-pc/src/data/StoryNpcs.ts) | `dataRegion?`(배치 · 장소 · 트리거) · 인물 25명 칸 · 행동(제자리 갱신) · N18-6 ①·② → 인천 `(480,354)` `(479,357)` · N13-3 → 안흥 `(448,352)` `(449,352)` |
| 수정 | [`packages/client-pc/src/data/StoryCinematics.ts`](../../../packages/client-pc/src/data/StoryCinematics.ts) | N18-6 ① 각본 6칸을 인천 종합어시장 동쪽 벽 기준으로(플레이어 482,351 · s1 481,354 · s2 483,354 → 490,354 · s1 퇴장 482,349 → 482,345) |
| 수정 | [`packages/client-pc/src/scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 배치 · 트리거 · 장소를 `dataRegion`으로 거름 · 안내 화살표 「다른 구역 — ○○」(`areaNameOfDataRegion`) · `poiBuildingKind`: 공동어시장 · 수협 · 위판 · 어판장 · 공판장 · 활어센터 이름의 `shop`은 `market` |
| 수정 | [`packages/client-pc/src/data/InteriorLayouts.ts`](../../../packages/client-pc/src/data/InteriorLayouts.ts) | `AUCTION_NAME`에 `공동어시장` |
| 수정 | [`packages/core/src/types/WorldMap.ts`](../../../packages/core/src/types/WorldMap.ts) · [`RegionMap.ts`](../../../packages/core/src/types/RegionMap.ts) | 출조 구역 `busan_area_namhang`(남항 · 공동어시장 — `spawnLatLon` 35.0878, 129.0262 · 핀 62,196) · `SEAMLESS_AREA_REGIONS['busan_namhang_1'] = BUSAN_GAMCHEON` |
| 수정 | [`tools/regions_config.py`](../../../tools/regions_config.py) · `pixelazed/_osm_request.txt` | 감천 bbox 북쪽 35.082 → 35.095(1,093 × 1,067 ≈ 1.17M 타일) · 요청 5(refetch) |
| 데이터 | `pixelazed/busan_gamcheon/` · `public/data/busan_gamcheon/` · `_osmcache/` | 러너 `617885a` — 바다 50.6% · POI 215 · 건물 782 · 걷기 성분 46(최대 99.6% — 항 머리가 들어와 감천동 쪽과 반도 쪽이 이어졌다) · 상호 자동 변환 +440줄 |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) · [`tools/game_wiki_template.html`](../../../tools/game_wiki_template.html) | 출조 지역 탭에 「N장부터 열림」 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S22 스토리 → 무대 연계 → 이 작업` + `S7 월드맵 → 지역 잠금 · 출조 구역`. 계약(`isRegionOpenAtChapter` · 배치 `dataRegion`) · 데이터(인물 25 칸 · 트리거 4 · 구역 노드 1 · 감천 bbox) ·
판정(월드맵 잠금 · 배치/트리거 필드 선택 · 위판장 종류) 층을 건드렸고 렌더는 그대로다. 세이브 스키마 변화 없음.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 장 잠금 판정 | core 시험 `StoryChapters.test.ts` | 장별 열림 1→속초 · 2→+부산 · 3→+울산 · 포항 · 4→+거제 · 여수 · 태안 · 5→+제주 · 6→+인천(울릉은 노드 없음) · 7→독도 노드 없음 · 191편 위반 0 |
| 장 잠금 화면 | 하네스 `harness_263.cjs` — 새 게임(1장) → 월드맵 | 열린 지역 속초뿐 · 「아직 갈 수 없는 곳」 8 · 「준비중」 2(울릉 · 독도) · M1-11을 끝내면 2장 → 부산 열림(「아직 갈 수 없는 곳」 7) |
| 인물 배치 | 하네스 — 지역 · 구역 15곳 필드 재시작 → `storyNpcs` | 울산 2 · 포항 3 · 지세포 2(해금강 0) · 여수 2 · 안흥 2(만리포 0) · 도두 1 · 서귀포 2(모슬포 0) · 인천 2 · 감천 필드(남항 · 암남) 7 · 백운포 2 · 속초 11 — 전부 걷는 칸 |
| N18-6 · N13-3 | 하네스 — 인천 · 안흥 필드 `storyTriggers` · 각본 8칸 `isWalkable` | 인천 트리거 2 · 각본 칸 8/8 걷기 가능 · 안흥 트리거 2 |
| 남항 · 위판장 | 하네스 — `busan_namhang_1` 진입 · `poiBuildingKind` · `interiorTemplateOf` | 스폰 (750,160) · 부산공동어시장 (732,146) = `market` · `auction` |
| 감천 재수집 | `check_building_reach.py` 씨앗 (750,160) | 윤곽 765 · 잃은 문 0 · 문 이동 3 |
| 빌드 · 시험 | `npx pnpm run build` · typecheck · core 시험 | 3/3 · 0 · 325/325 · 하네스 pageerror 0 · http 오류 0 |

- 2장 확인은 `__STORY.quests['M1-11'].status = 'done'`(dev 전용 손질)으로 했다 — `complete()`는 목표가 남아 있어 거절한다.
- 스크린샷: `scratchpad/shots263b/worldmap_ch2.png`(잠금 목록) · `busan_namhang_1.png` 등 15장.

## 6. 잔여 — 이번에 안 한 것

- **울릉 4명**(오세라 · 연태오 · 석대양 · 석독구) — 배 출조 콘텐츠 뒤(노드 없음).
- **새 인물의 집 · 일과 · 물어보기** — 25명은 늘 밖에 있다. 집(`home`) · 일과(`NPC_ROUTINES`) · 조사 대화는 지역별 콘텐츠 차수에.
- **N18-4 선체 검수 현장**(거제)은 속초 옛 조선소 대체 그대로 — 지세포 · 해금강 bbox에 조선소가 없다. **N20 유하랑 방어진 장면**은 울산 필드에서 열지 않아도 되는지(지금 부산 백운포).
- **호미곶 대신 사라말등대**(한봄 · 이수연) — 구룡포 bbox에 호미곶이 없다. 사용자 육안 뒤 포항 bbox를 북쪽으로 늘릴지 결정.
- **감천 1.17M 타일**(속초 규칙 1.05M 초과) — 실플레이 성능 확인. 자갈치는 POI가 아니다(충무시장만 `market`).
- **장 잠금과 옛 세이브** — 잠긴 지역 필드에 저장해 둔 세이브는 그대로 들어간다(잠금은 월드맵 출조만 막는다).
- **남항 핀 자리**(62,196)는 어림 — 핀 편집 Dev Tool.
- 인물 자리 25곳 사용자 육안(80차 배포본에는 없다 — 81차 배포 뒤).

## 7. 위험·부작용

- 장 잠금은 월드맵 출조에만 걸린다 — `scene.start('RegionFieldScene', …)`를 직접 부르는 길(이어하기 · 세이브 · dev 콘솔)은 막지 않는다. 의도.
- `dataRegion`이 없는 배치는 그 지역 모든 필드에 선다(속초 11명 그대로). 지역에 데이터 지역을 더 쪼개면 그 지역 배치에 `dataRegion`을 붙여야 한다.
- 안내 화살표는 배치표의 **첫 항목**을 본다 — 같은 인물을 두 데이터 지역에 겹쳐 적지 않는다(이번에 지역만 있던 줄을 제자리 갱신한 까닭).
- `shop` 종류의 위판장 이름 규칙은 이름 기준이라 `○○수협 마트` 같은 가게도 위판장이 된다(지금 데이터에는 없음).
- 감천 bbox가 바뀌어 암남 · 동 · 서방파제 구역의 스폰 칸이 전부 바뀌었다(위도 · 경도 기준이라 자리는 같다 — 하네스 dist 0.0).

## 8. 후속 반영

- [x] 시스템 페이지 — [스토리](../02-SYSTEMS/story-quests.md) §4 · §5 · §6 · [필드 · 지도](../02-SYSTEMS/world-field.md) §2 · §4 · §5 · §6
- [x] [`04-BACKLOG.md`](../04-BACKLOG.md) CK(해소분 · 잔여)
- [x] `AGENTS.md` §9 요약 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` · 스킬 `add-region`(장 잠금 · `dataRegion`) · `STORY_SPEC_v4.md` §13
- [x] 아티팩트 4개(절대 규칙 15) — 남은 과업 설계 Version 5 · 구현 라이브러리 Version 5 · 채비 모딩 순서도 Version 5(「263차 기준」 줄만) · 전체 위키 Version 60(출조 지역 탭 「N장부터 열림」)
