# 183차 — 고도 층·계단 + 지형 어휘 k/K/D + 영금정 GIS 파일럿 + 방파제 피복 방위 + 도로 정리 + [F] 힌트 중복 제거

| | |
|---|---|
| **날짜** | 2026-09-28 |
| **시스템** | `필드` `타일 렌더` `지형 데이터` `편집기` `도로` |
| **트리거** | 사용자 지시 (영금정·조도·테트라포드·힌트 중복·도로 미관·오브젝트 통과·어장 점선) |
| **커밋** | 미커밋 (브랜치 `claude/project-review-task-planning-yopbck`) |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 지시(원문 요지, 2026-09-28):

- "OSM 실측 기반 맵 구성은 위성에서 육지/도로/바다로의 구분만으로 이루어져 있음. … **영금정은 절대 평지가 아님**.
  … 최대한 GIS 느낌으로 잘 바꿀 것."
- "플레이어가 다니는 길보다 위쪽 길일 경우, **오르는 계단**(왼쪽 대각선·우측 대각선·수직)을 만들고, **한 층 위로
  올라가는 것으로 레이어 층**을 구현하자. … 정자 전망대 = 계단 ↑ → 평지 → 왼쪽 대각선 계단 → 평지 → 우측 대각선
  위 계단 → 정자 / 해돋이 전망대 = 우측으로 → 동명해교 → 쭉 → 우측 대각선 위 계단 → 전망대."
- "지금 모든 바다 경계면에 테트라포드를 적용시켰는데 … **테트라포드 방파제인 경우에만** 한정해서 방파제 좌/우로
  배치해야 해. … 속초 동명항 방파제의 경우, 지도상 **우측에만** 테트라포드가 배치되어 있어. … 갯바위 암석이나
  절벽(직벽) 등으로 이루어진 지형이 있을 수도 있어."
- "갯바위에서 절벽 바위나 레이어가 한 층 높은 곳으로는 특정 장비가 없는 한 이동하지 못하도록."
- 출조 버스 캡처 — "상호작용 가능한 게 1개일 경우도 이렇게 중복으로 두 개를 띄우는 게 맞을까? … 이전 내용을 제거."
- "도로가 아직도 미적으로 지저분한 곳들이 많이 보이고 있어. 전체적으로 깔끔하게 보이도록 수정해줘."
- 캡처 2장 — "1) 오브젝트 통과하는 것 방지해야 함. 2) 맵에 보이는 노란색 점선 경계선이 뭔지 모르겠음. 삭제."

## 2. 원인 — 무엇이 문제였나

- **테트라포드가 전 해안에 깔린 기전** = 103차 방파제 추론(양끝-바다 런 ≤ 10타일 → `'b'`)이 **영금정 갯바위 해안선**까지
  `'b'`로 칠했고, 114차 성분 분류가 그 `'b'`와 동명항 방파제의 `'.'` 상판을 **한 성분(id 5 · 3,003타일 · y 61~317)** 으로
  묶어 181차 규모 추정(≥ 60타일 ∧ 외해 비율 ≥ 0.5)이 전체를 테트라포드로 판정했다.
  실측 덤프(`bwlist.cjs`): 속초 방파제 성분 16개 중 7개가 테트라포드 판정 — 그중 성분 5·3·1은 자연 해안이 섞여 있다.
- **[F] 힌트 두 개** = 44차 `objHintText`(오브젝트 근접 · y−20)와 178차 머리 위 `npcHintText`(`collectInteractOptions`)가
  같은 오브젝트를 각각 알렸다. 하단 `promptText`의 `[F] 건물 — 거래하기`도 178차 목록과 중복.
- **노란 점선 경계선** = 121차 `ForageSystem.drawFarms`의 **어촌계 어장 폴리곤**(반투명 면 + 주황 점선 + 라벨).
  영금정 갯바위 위 "주황 이음선"으로 보이던 것도 같은 선이다(어장 `마을어업속초9`가 영금정 앞바다에서 뭍까지 걸친다).
- **오브젝트 통과** = 173차가 가로 시설물(나무·가로등·벤치)을 전부 `free`(바디 없음)로 두었다.
- **도로 지저분함**(회전교차로 449,152 실렌더) = ① 일방통행 쌍 사이 **분리섬이 두 밴드 사이를 통째로 채워** 큰 회색 쐐기
  ② 마킹 클리핑 부스러기 하한 0.8타일 → 교차부 색종이 ③ 횡단보도가 선보다 먼저 그려져 다른 도로 중앙선이 줄무늬를
  가로지름 ④ 아스팔트 클립으로 반쪽만 남은 횡단보도.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`core/rules/Elevation.ts`](../../../packages/core/src/rules/Elevation.ts) | 층·계단 규칙 — `RegionStair{tx,ty,dir(8방위),from,to}` · `levelAtEdge`(계단 = 높은 변 to / 낮은 변 from / 옆벽 null) · `canStep(a,b,edge,opts)`(대칭 · `climbLevels` 장비 게이트 자리 — 기본 0) · `levelSeam` · `RegionArmor{tx,ty,kind,sides}` |
| 수정 | [`core/rules/TerrainTransition.ts`](../../../packages/core/src/rules/TerrainTransition.ts) | 어휘 `k` 갯바위(걷기 가능·paint 44) · `K` 암반 절벽(불가·46) · `D` 데크(물 위 보행·68) · cls `rock` · 전이(rock→물 foam · built→rock curb 0.5) · `reliefHeight('k')=2` |
| 수정 | [`core/types/RegionMap.ts`](../../../packages/core/src/types/RegionMap.ts) | `RegionTerrain` += rock/cliff/deck · `BLOCKED` += cliff · `RegionPatch.levels/stairs/armor` · `PoiType 'pavilion'` |
| 수정 | [`SeamlessChunks.ts`](../../../packages/client-pc/src/scenes/SeamlessChunks.ts) | `levelGrid`·`stairMap`·`levelCell`·`stepOk`·**`buildLevelWalls`**(canStep false인 변마다 6px 정적 벽) · `drawLevelLayer/drawLevelRelief/drawStair/drawDeck/drawCliffTop` · 암반 아틀라스를 `k/K`에 · 정자 프롭 `smx_pavilion` · **피복 방위**(`armorSpec` → `bwArm` 셀 단위 · 미지정 변 = 안벽 quay) · `breakwaterCompAt` · 자유 배치 나무/가로등/벤치에 **10×8 줄기 바디** · 도로 마킹 3패스(횡단보도 자리 → 선(사각형 클립) → 줄무늬) · 부스러기 하한 실선 2.5·점선 3.0 · 조각 2.0 · 60% 미만 횡단보도 생략 · 분리섬 반폭 ≤ 0.55 물방울 |
| 수정 | [`RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | patch `levels/stairs/armor` 로드·저장 · `blocked` += cliff · 편집기 모드 `level`(±1 브러시)·`stair`(8방향 · 우클릭 제거)·`armor`(종류·방위 · 성분당 1건 · 우클릭 해제) + 되돌리기 · **`objHintText` 삭제** · 하단 `promptText` 건물 문구 삭제 |
| 수정 | [`dev/MapEditorPanel.ts`](../../../packages/client-pc/src/dev/MapEditorPanel.ts) | 팔레트 += 172차 5자 + k/K/D · 도구 탭 층/계단/피복 버튼 |
| 수정 | [`field/ForageSystem.ts`](../../../packages/client-pc/src/scenes/field/ForageSystem.ts) | 어장 경계 오버레이 **기본 미표시**(`devFarmOverlay` 훅 없으면 안 그림 — 판정은 그대로) |
| 수정 | [`ui/RegionHud.ts`](../../../packages/client-pc/src/ui/RegionHud.ts) | 미니맵 색 rock/cliff/deck |
| 수정 | [`tools/build_osm_tilemap.py`](../../../tools/build_osm_tilemap.py) · [`build_region_maps.py`](../../../tools/build_region_maps.py) | PALETTE/OSM_PALETTE k/K/D(쌍거리² ≥ 360 유지) · WALKABLE += k,D · `amenity=shelter` → POI `pavilion`(건물 채움 제외) · `bridge=yes` 보행로·선형 `pier` → `D` |
| 신설 | [`tools/author_yeonggeumjeong.py`](../../../tools/author_yeonggeumjeong.py) | 영금정 patch 작성기(멱등) — 타일 484 · 층 168 · 계단 5 · 정자 2 · 피복 1(동명항 = 테트라포드 · `['e']`) |
| 데이터 | `pixelazed/sokcho_v2/patch.json` · `public/data/sokcho_v2/patch.json` | 위 작성기 결과 (기존 tileTex 1,074 보존) |

영금정 배치(타일): 정자 언덕 L1 `585~591 × 122~125` · L2 `586~591 × 117~121` · L3 정자 마당 9칸 · 계단 (586,126)`n` →
(590,121)`nw` → (590,117)`ne` · 갯바위 `k` `583~603 × 118~133` · 물길 `x 594~595` · 데크 `D` (594~595,125) ·
해돋이 바위섬 L1 `597~601 × 118~121` + 계단 (598,122)`ne` · 북면 절벽 `K` `596~603 × 115~117` · 등대 언덕 L1
`562~570 × 80~88` + 계단 (566,89)`n` · 북쪽 해안 오독 `'b'` → `k`.

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S8 월드 필드 → 심리스 지형 → 고도 층(신설) / 방파제 피복 / 도로 마킹 / 편집기`.
계약(`Elevation.ts` · `RegionPatch`) + 데이터(patch·빌더 팔레트) + 판정(층 벽 충돌 · `canStep`) + 렌더(단차·계단·데크·피복 방위·마킹).
힌트 중복·어장 오버레이·프롭 바디는 필드 UI/충돌 층.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 층 규칙 | node 단위 테스트(core dist) | 평지 같은 층 true·다른 층 false · 계단 `n` 남→북 true·옆 false · `ne` 서/남 진입 true · 대칭 true |
| 영금정 도달성 | 실렌더 BFS(`ygj_check.cjs` — 씬의 `stepOk`) 시작 (583,125) | 언덕 L1·L2·정자 마당·해돋이 정자 **계단 있으면 도달 / 계단 무시하면 미도달** · 절벽 K·물 미도달 · 등대 언덕 도달(보도 편입 후) |
| 층 벽 | 청크 충돌 | `buildLevelWalls`가 canStep false 변에 6px 벽 — 실플레이 확인은 사용자 |
| 피복 방위 | `bwlist.cjs`·probe | 성분 16개 → 동명항 방파제 = 성분 #7(547셀) 테트라포드 · 서측 `bwArmAt` false(안벽) · 실렌더 우측만 테트라포드 |
| 힌트 중복 | 코드 | `objHintText` 참조 0 · 건물 하단 문구 0 |
| 프롭 통과 | `propbody.cjs` | 회전교차로 3×3 청크 바디 218 중 줄기 바디 78 · 나무 왼쪽 24px에서 → 이동 0.7s 후 12px 전진(바디 앞 정지) |
| 도로 | 실렌더 449,152 전/후 | 큰 회색 쐐기 → 가는 섬 · 색종이 마킹 감소 · 횡단보도 위에 선 없음 |
| 어장 점선 | 실렌더 영금정·동명항 | 주황 점선 0 |
| 빌드 | `pnpm run build` · typecheck | 3/3 · 0 오류 · pageerror 0 |

재현: `DAY=14 node scratchpad/shots182.cjs ygj '[["hill",588,122],["outcrop",598,124],["bw",596,165]]'`.

## 6. 잔여 — 이번에 안 한 것

- **방파제 피복 표** — 사용자 위성 캡처 대조 대기. 현재 성분 목록(중심 타일·크기·현 판정):

| # | 중심 | 크기 | 현 판정 | 근처 |
|---|---|---|---|---|
| 5 | (602,182) → 183차 분리 후 #7 (598,162) 동명항 방파제 | 547 | 테트라포드 **동쪽만**(지정) | 동명항 |
| 10 | (533,356) | 1,011 | 테트라포드(추정) | 청호동방파제 |
| 8 | (539,257) | 581 | 테트라포드(추정) | 속초항 크루즈터미널 |
| 12 | (323,379) | 526 | 테트라포드(추정) | 씨크루즈호텔 앞 |
| 3 | (270,43) | 378 | 테트라포드(추정) | 영랑호 하구 북측 |
| 9 | (488,334) | 113 | 테트라포드(추정) | 5구도선장 |
| 1 | (101,26) | 75 | 테트라포드(추정) | 영랑호CC 북 |
| 0·4·11·13·14·7·2·6·15 | — | 12~53 | 사석(추정) | 소형 |

- 갯바위 **걷기 가능/불가 경계**(사용자 2번) — `k`(가능)/`K`(불가) 두 문자로 표현 가능하나 영금정 밖은 미지정.
- 사다리류 장비 게이트 — `canStep(opts.climbLevels)` 자리만.
- 계단·단차 그림은 절차 1차(6px 디딤·옆면·림) — 아트 후속. 층 벽은 **변 단위**라 대각 이동 시 모서리 끼임 가능성.
- 조도 재설계(184차) · 속초 전역 GIS 스윕 · 건물 타일 키트 · 다른 지역 정자 POI 프롭 자동 배치(빌더 태그만 신설).
- 도로: 대시 조각이 아직 몇 개 남는다(3타일 이상) · 아스팔트 색과 콘크리트 상판 톤 차이 미세.

## 7. 위험·부작용

- 자유 배치 가로 시설물에 바디가 생겨 **1타일 보도 한 칸이 막힐 수 있다**(차도·맨땅으로 돌아간다). 173차 함정 항목 갱신.
- 층 벽은 patch에 `levels/stairs`가 있는 지역에서만 생긴다 — 다른 지역 회귀 0.
- `blocked` += cliff — 기존 지역엔 `K`가 없어 회귀 0.
- 어장 오버레이 미표시 — 조례 판정·채널 로그는 그대로.
- 마킹 하한 상향으로 짧은 골목의 중앙선(2.5타일 미만 조각)이 사라질 수 있다.

## 8. 후속 반영

- [x] 워크로그 · [x] `03-WORKLOG/README.md` 색인 · [x] `02-SYSTEMS/world-field.md` §4·§5·§6 · [x] `04-BACKLOG.md` AF ·
  [x] AGENTS §9 · [x] PLAN · [x] CLAUDE.md
