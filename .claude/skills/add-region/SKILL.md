---
name: add-region
description: Pixel Angler 신규 지역(타일맵 필드) 추가 절차 — 실지형 PNG → 타일 JSON → 맵 그래프 → 출조 개방. 새 지역/맵 추가, 타일맵 재생성, 맵 연결·스폰 문제 작업이면 반드시 로드. "지역 추가", "타일맵", "build_region_maps", "출조 구역", "맵 연결" 작업이면 이 스킬을 따른다.
---

# 신규 지역(타일맵) 추가

## 파이프라인

```
pixelazed/<region>/<mapId>.png  (실지형 픽셀 지도 — 파일명 = mapId)
  → tools/build_region_maps.py REGIONS 딕셔너리에 지역 등록
  → py tools/build_region_maps.py <region>
  → packages/client-pc/public/data/<region>/<mapId>.json
  → core/src/types/RegionMap.ts 맵 그래프 등록
  → RegionFieldScene 자동 렌더 (타일 베이킹 + 병합 충돌 + 엣지 전환)
```

- 타일 문자: `.`=육지/도로 `~`=바다(이동불가·낚시) `#`=건물(충돌) `,`=잔디
- 지형 분류 색 팔레트 변경 = `classify()` 수정 후 재생성.
- 후처리 순서(스크립트 내장): `bridge_diagonals` → `connect_components` → `bridge_diagonals` 재보정.
  - **connect_components**: 끊긴 걷기 컴포넌트를 최근접 쌍 직선 카브로 자동 연결 — **연결선은 반드시 4-연결**(대각 스텝은 걷기 판정에서 끊김 — 19차 실측), 대형 육지(300+)는 임의 다리 방지로 연결 안 함. 재생성 후 잔여 컴포넌트 수 확인(고립 바위 몇 개는 정상).

## core 등록 (`core/src/types/RegionMap.ts`)

1. `<REGION>_MAP_GRAPH` 작성 — 맵 체인·엣지 링크(방향별 인접 맵). 엣지 없음 = 4방 경계 이동 불가(홈타운 패턴).
2. `REGION_MAP_GRAPHS`에 등록.
3. **`depthProfileUrl`은 실측 수심 JSON이 있는 지역만** 지정 — 미등록 지역에 무조건 로드시키면 Vite SPA 폴백이 index.html을 돌려줘 **JSON 파싱 pageerror** (17차 부산 검증에서 실측). 수심 JSON은 `tools/build_depth_profiles.py`.
4. 출조 개방 = `WorldMap.ts`의 `REGION_AREA_NODES`에 구역 노드 추가 (핀 좌표·fieldMapId·details·depthRangeM·snagRisk). **노드 존재 = `isRegionUnlocked` 자동 해제** / 타일맵 미완성이면 `enterable: false`(핀·설명만 표시, 진입 차단).

## 스폰·검증

- 출조 진입(entryEdge 없음) = 맵 중앙 `nearestWalkable` 자동 / 맵 간 이동 = 진입 엣지 밴드 한정 스폰(entryT 유지) — 신규 코드 불필요, 기존 로직이 처리.
- 검증: 실렌더로 ① 스폰 위치 정상(걷기 가능) ② 바다/건물 충돌 ③ 엣지 전환 왕복 ④ pageerror 0 (verify-render 스킬). 방파제 맵은 바다 비율(70%+)과 통로 연결성 확인.
- 지역 실측 데이터 연동(선택): `REGION_TO_MMSI`(해양기상 관측소) · `REGION_TO_SIDO`(KOSIS) · `REGION_TO_INDEX_KEYWORDS`(낚시지수) — 매칭 가능한 것만.
