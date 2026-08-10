# S2·S7. 월드맵 · 지역 타일맵 · 필드(이동·환경)

> 상태 **🔶 부분**(지역 3곳 개방). 관련 차수 3·17·18·19·44·46·73

---

## 1. 목적·범위
전국 지도에서 **출조 지역 선택** → 실지형 타일맵 필드에서 **이동·상호작용·캐스팅**. 낚시 자체는 [S1](fishing-loop.md).

## 2. 구성
| 계층 | 파일 | 역할 |
|---|---|---|
| core | `types/WorldMap.ts` | 노드 11곳 · `REGION_AREA_NODES`(출조 구역) · 잠금 판정 |
| core | `types/RegionMap.ts` | 타일맵 계약 + **맵 그래프**(속초 7 · 부산 8 · 홈타운 1) |
| core | `types/DepthProfile.ts` | 실측 연안 수심(거리→수심 보간·외삽) |
| tools | `build_region_maps.py` · `build_depth_profiles.py` | 지형 PNG → 타일 JSON / 수심 ZIP → 프로필 |
| client | `WorldMapScene` | 핀·툴팁·줌인 진입·교통비 결제·귀가 |
| client | `RegionFieldScene` | 타일 렌더 베이킹 · 병합 충돌 · 맵 전환 · 캐스팅 · 조명/날씨 · 설치 모드 |
| client | `RegionHud` · `MiniMap` · `FieldEventManager` · `HydroCurrentRenderer` | HUD·미니맵·이벤트·조류 시각화 |

## 3. 동작 구조
```
pixelazed/<region>/*.png ──build_region_maps.py──► public/data/<region>/<mapId>.json
   타일 문자: '.' 육지/도로  '~' 바다(이동불가·낚시)  '#' 건물(충돌)  ',' 잔디
RegionFieldScene: JSON → generateTexture 1회 베이킹(맵당 캐시) + 행 병합 정적 바디
맵 전환: 엣지 접근 → 그래프 링크 → scene.restart({entryEdge, entryT}) → 반대편 엣지 스폰
출조 진입(entryEdge 없음) = 맵 중앙 nearestWalkable
```
- **바다 타일은 육지 거리 BFS로 6단계 수심 그라데이션** + 결정적 노이즈 암초.
- 조명: KST 야간/황혼 명암 오버레이 + 건물 창·네온·가로등(파사드 요소는 플레이어 아래 depth).
- 날씨: 기상청 실데이터 → 비 2레이어·물파문 / 소나기 / 진눈깨비 / 눈 / 안개.

## 4. 세부과제 현황
| 과제 | 상태 | 차수 |
|---|---|---|
| 실지형 타일맵 파이프라인 + 속초 7맵 | ✅ | 6-5e |
| 부산 8맵 + 컴포넌트 자동 연결(`connect_components`) | ✅ | 17·19 |
| 홈타운 단일 맵 + 오브젝트 스키마 | ✅ | 44 |
| 실측 수심 프로필(속초) | ✅ | 8차 |
| 수심 타일 렌더 + 낮/밤 조명 + 날씨 | ✅ | 3 |
| 자전거(R) + 접지/크기 + 배타 액션 게이트 | ✅ | 17·18 |
| 씬 전환 안전망(SceneFade 17곳) | ✅ | 73 |
| 교통비·귀가·잠금 지역 | ✅ | 44 |
| **타 지역 확장**(여수 등) | ⬜ | 파이프라인 준비됨 |
| POI 세분화(건물별 진입 씬) | ⬜ | 현재 제네릭 마커 |
| 사운드 이펙트 | ⬜ | |

## 5. 잔여·차기
지역 추가는 절차화되어 있다 → 스킬 `add-region`. POI 상호작용·사운드는 콘텐츠 확장 단계에서.

## 6. 함정·불변조건
1. **타일 텍스처는 맵당 캐시(`rmaptex_`)** — 렌더 알고리즘을 바꾸면 브라우저 풀 리로드가 필요하다.
2. **카브(통로 연결) 직선은 4-연결**이어야 한다 — 대각 Bresenham은 걷기 판정에서 끊긴다(19차).
3. `RegionMapGraph.depthProfileUrl`은 **등록된 지역만** — 없는 URL을 로드하면 dev SPA 폴백이 index.html을 반환해 JSON 파싱 pageerror.
4. **`isTransitioning`은 create()에서 리셋** — Phaser 씬은 재사용되므로 필드 초기값이 재진입에 적용되지 않는다(73차 먹통 원인).
5. 비용 차감은 **전환 가드 통과 후**(더블클릭 이중 차감 방지).
6. **"에러 표시 없는 검은 화면" 3계열과 방어선**(088차): ① WebGL 컨텍스트 유실(JS 에러 0 — GPU 부하) →
   `game.ts installCrashGuards` 오버레이 ② 씬 create 중 예외(그리다 만 채 멈춤) → 전역 에러 배너
   ③ 맵 JSON 캐시 미스 → `RegionFieldScene.create` 가드(`bootFailed`) + 메인 메뉴 복귀.
   새 씬의 create가 외부 데이터를 소비하면 **캐시 미스 가드부터** 넣는다.
7. **WebGL 캔버스 픽셀 직접 샘플(drawImage) 금지** — `preserveDrawingBuffer=false`라 항상 검정.
   밝기 검증은 Playwright 스크린샷 버퍼를 디코드한다(088차 하네스 오판 사례).
