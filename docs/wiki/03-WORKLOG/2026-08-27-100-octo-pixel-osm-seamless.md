# 100차 — 문어 픽셀 에셋 10장 매핑 + OSM 실지형 심리스 맵 v2 (속초 청크 스트리밍)

| | |
|---|---|
| **날짜** | 2026-08-27 |
| **시스템** | `손질(S3)` `필드·타일맵(S2·S7)` |
| **트리거** | 사용자 지시 2건 — ① 문어 픽셀 에셋 적용 ② OSM 심리스 맵 대규모 변경(전달 파일 4종) |
| **커밋** | 미커밋 (커밋 대기) |
| **빌드·타입체크** | 4/4 · 0 오류 |

---

## 1. 배경 — 왜 했나

**① 문어 에셋**: 사용자가 커밋 `5efdd95`(08-14)로 "손질 가이드에 적용할 픽셀 투명 에셋 이미지"
10장(0~9.png)을 업로드 — 대기 항목 "④ 문어 중간 스테이지 완성본"의 해소. 098차의 싱크대 실사
KEEP_POLY 추출본(특히 품질 하위였던 `octo_scrub`)을 대체한다.

**② OSM 심리스**: 사용자 전달 스펙 `OSM_TILEMAP_SPEC.md` + 스크립트 3종(regions_config /
fetch_region_osm / build_osm_tilemap). "손그림 추정 지형 폐기, OpenStreetMap 벡터를 10m/타일로
래스터라이즈해 심리스 단일 맵" — 속초 v2를 §13-2 순서로 완주하라는 지시.
지역 레지스트리는 17개(초대형 6곳 물가 분할·행정경계 마스킹·리스폰 스냅) 확정본.

## 2. 원인 — 잠복 실버그 1건 (심리스에서 발현)

- **`pointer.worldX/Y` 미변환**: 스크롤된 카메라에서 포인터 world 좌표가 갱신되지 않아
  **스크린 좌표가 그대로 들어온다**. 실측 — 카메라 scroll (4630, 930)에서
  `pointer.worldX = 900` vs `camera.getWorldPoint = 5530`. 레거시 부산 맵에서도 동일 재현.
- 기존에 안 드러난 이유: 홈타운(960×640)·레거시 맵은 스크롤 ≈ 0~수백 px라
  worldX == 스크린이 **우연히 근사 정답**이었다. 심리스(월드 11,780px·스크롤 4,000+)에서
  캐스팅 조준이 정반대 방향으로 나가며 발현 (하네스 실측: 동쪽 조준 → 서쪽 착수).

## 3. 변경 — 어디를 어떻게

### ① 문어 픽셀 에셋 (S3)

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `tools/pixelize_butchery.cjs` | `OCTO_SRC` → 픽셀 에셋 0~9 매핑(신규 키 `octo_invert1`) · octo용 KEEP_POLY/BG_TOL 전량 폐기(알파 경로 자동) · `OCTO_TRIM_SRC`에서 octo_live 제거(0.png이 정본) |
| 수정 | `tools/pixelize_butchery.cjs` | **`CEPH_SRC_DIR` 이동 경로 정정** — 사용자 정리로 오징어 레퍼런스가 `무늬오징어 레퍼런스/` 하위로 이동. 구 경로면 재생성 시 오징어 전 키가 "입력 없음"으로 **소실**되는 함정 |
| 수정 | [CephalopodFish.ts](../../packages/client-pc/src/ui/CephalopodFish.ts) | `octo_invert` 드래그 3프레임화(`octo_live→invert1→invert2`, 임계 0.35/0.7) · 주석 100차 갱신 |
| 수정 | `tools/gen_octo_assets.cjs` | 부리 아이콘 잡 추가 — 7.png → `public/trimmings/octo_beak.png`(구 1078px 원본 직접 복사본 대체) |
| 재생성 | `data/PixelFishStages.ts` | octo 8키 갱신 + `octo_invert1` 추가 — **타 키(오징어·어류) 바이트 변화 0** (키별 md5 비교 실측) |

**매핑 확정** (이미지 전수 판독): 0=활어 통마리 → 1=외번 시작(신규) → 2=외번 진행 → 3=외번 완료
→ 4=내장 분리 → 5=부리 보임 → 6=부리 돌출(뽑기 완료 프레임) → **7=뽑힌 부리 단독(부산물 아이콘 전용)**
→ 8=소금 → 9=거품 문지르기. 완료본(octo_clean)은 픽셀 세트에 없어 098-b 투명본 유지.

### ② OSM 심리스 (S2·S7)

| 구분 | 위치 | 내용 |
|---|---|---|
| 배치 | `tools/regions_config.py` `fetch_region_osm.py` `build_osm_tilemap.py` | 전달본 그대로 (지역 17개 레지스트리 · Overpass 수집기 · 10m/타일 래스터라이저) |
| 배치 | `.agents/OSM_TILEMAP_SPEC.md` | 스펙 + **§0.5 코드 정합 노트 신설**(TR 20px · 캐스팅 규칙 조정 · POI 개방 범위 · 지역 등록 판정 · worldX 버그) |
| 산출 | `pixelazed/sokcho_v2/` · `public/data/sokcho_v2/` | fetch(15,030 elements) → build(589×321 · sea 52.96% · POI 310 · 스폰 (263,64) 스냅) → seamless.json + pois.json + meta.json |
| 수정 | `tools/build_region_maps.py` | **심리스 분기 신설** — `pixelazed/<region>/meta.json` 존재 = OSM 지역. terrain.png(손수정 정본) → 최근접 팔레트 분류 → seamless.json + 걷기 컴포넌트/스폰 검증 리포트 |
| 수정 | [RegionMap.ts](../../packages/core/src/types/RegionMap.ts) | `RegionTerrain`에 `road/sand/pier` · `TERRAIN_BY_CHAR` r/s/b · `RegionMeta`/`PoiType`/`RegionPoi` · `ACTIVE_REGION_MODE`('seamless') · `SEAMLESS_REGIONS`(gangwon_sokcho→sokcho_v2) · `isWalkableTerrain`/`isFishableStandTerrain`. index.ts export |
| 신설 | [SeamlessChunks.ts](../../packages/client-pc/src/scenes/SeamlessChunks.ts) | **청크 스트리밍 관리자** — 64타일(1280px) 청크 · RT 풀 12 LRU · 카메라 3×3 상주 · 시각 베이킹 프레임당 1청크 · **충돌 바디는 상주 즉시**(행 병합) · 수심 BFS Uint16 · 청크 로드/언로드 훅 |
| 수정 | [RegionFieldScene.ts](../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 심리스 분기(init/preload/create) · meta.spawn 스폰 · 엣지 전환 비활성 · OSM POI(문 자동 배치 BFS·청크 상주 마커·거래 매핑 → 기존 [E] 흐름) · shoreKind s/b 반영 · 수심 앵커 위치 휴리스틱 · **`pointerWorld()` 신설**(조준·설치 3곳 getWorldPoint 교체) |
| 수정 | [RegionHud.ts](../../packages/client-pc/src/ui/RegionHud.ts) | MINI_COL 3색 추가 · 대형 맵(6만 타일+) 미니맵 = CanvasTexture ImageData 직접 기록(Graphics 37만 커맨드 회피) |
| 수정 | [DataAttributions.ts](../../packages/core/src/db-schema/DataAttributions.ts) | `ODbL` 라이선스 + "© OpenStreetMap contributors" 크레딧 (CreditsScene 자동 반영) |

## 4. 구조상 위치

- ① `S3 손질 → 두족류 → 문어 스테이지 스프라이트` — **데이터 층만**(레지스트리 교체 + 드래그 프레임 1건).
  판정·트리·수율 무변경.
- ② `S2·S7 필드 → 지형 파이프라인 + 렌더/충돌` — **계약(타입)·데이터·렌더·판정 전 층**.
  legacy 경로(부산·홈타운·속초 7맵 그래프)는 **보존** — `SEAMLESS_REGIONS` 미등록 지역은 기존 그대로.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 문어 스프라이트 10키 | 레지스트리 디코드 프리뷰 시트(098차 패턴) 육안 | 투명 배경·잔재 0 · 공정 순서 정합 |
| 생성물 회귀 | HEAD↔재생성 키별 md5 | 변경 = octo 8키 + invert1 추가뿐 — **오징어/어류 0건** |
| 심리스 지형 | seamless.json 분석 스크립트 | 스폰 (263,64) = 최대 걷기 컴포넌트(72,194타일) 내부 · 조도 고립(도보 불가 — §9 요구사항) · sea 59.7% |
| 심리스 진입 | 실렌더(Playwright·설치 Chrome) | 상주 9청크 · RT 생성 9(≤12) · 벽 바디 877 · POI 310/청크 6로드 · 거래 POI 165 · 미니맵 텍스처 OK |
| 원거리 이동 | 텔레포트 (150,250) 후 재상주 | 상주 9 유지 · **RT 재사용(created 9 불변)** · 베이킹 잔여 0 |
| POI 거래 | 최근접 마트 문 앞 → E | `[E] 식자재마트 — 거래하기` 힌트 + 확인창 오픈 |
| 캐스팅→1인칭 | 물가(234,79) 실마우스 차지·릴리즈 | FP 진입 · 실측 수심 소비(바닥 1.4m·동명항 앵커) · ESC 복귀 정상 |
| 성능 | 이동 중 FPS 6샘플 | **60~61 FPS** 유지 · 베이킹 스파이크 없음 |
| 회귀 | 부산(legacy)·홈타운 부팅 스모크 | 씬 활성·스폰 정상 · pageerror 0 |
| 전체 | 빌드 + typecheck | 4/4 · 0 오류 · 전 하네스 pageerror 0 |

재현: scratchpad `verify_seamless.cjs`(진입·청크·이동·물가) / `verify_seamless2.cjs`(거래·FPS) /
`verify_seamless3.cjs`(캐스팅→FP). 스크린샷 `seam_1~7*.png`.

## 6. 잔여 — 이번에 안 한 것

- **나머지 16개 지역 fetch→build** — 지역당 수집이 수백 MB·수십 분까지 가능(공용 서버 예의 5초 대기)
  + terrain.png ↔ OSM 육안 대조·스폰 검수(사용자 몫). 절차는 코드 변경 없이 반복만 하면 된다.
  ⚠ 서해 2곳(taean)은 seaEdges W — sea ratio 경고 시 조정 필요(사용자 재차 당부).
- **§11 비주얼 4레이어**(오토타일·프리팹·프롭·NPC) — 에셋 세트(타일셋 7군·프리팹 8종·프롭 6종·NPC 4종)
  제작/발주 대기.
- 스폰 다중화(`meta.spawns[]` — §12-2) · 비거래 POI 전용 상호작용(화장실·파출소 등) ·
  지역 실상점 카탈로그(현재 SHOP_CATALOG 6종 프리셋 재사용) · legacy 7맵 제거 시점(사용자 결정).
- 문어 신규 스프라이트 기준 **가이드 좌표 F9 실측**(기존 계획 그대로 — subjectRect가 바뀌어 재실측 대상).
- `NightHuntingScene`의 `pointer.worldX` 1건(패럴랙스 미세 연출) — 소형 씬이라 영향 미미, 후속 일괄.

## 7. 위험·부작용

- **`ACTIVE_REGION_MODE = 'seamless'` 고정** — 속초는 이제 항상 심리스로 열린다. legacy 속초 7맵으로
  돌아가려면 이 상수 하나를 'legacy'로 (코드·데이터 모두 보존됨).
- WorldMap 속초 구역 2곳(속초항/동명항)은 **같은 심리스 맵의 같은 스폰**으로 진입한다(스폰 다중화 전).
- 미니맵 텍스처 키는 `rhud_mini_<mapId>` 캐시 — 지형 재생성 후엔 브라우저 풀 리로드 필요(기존 규칙 동일).
- 캐스팅 조준 체감이 **정확해진 방향으로 변한다**(worldX 교정) — 레거시 맵에서도 스크롤이 있던 위치라면
  이전과 조준이 다르게 느껴질 수 있으나 그쪽이 정답.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/world-field.md` · `butchery.md` 갱신
- [x] `04-BACKLOG.md` 갱신
- [x] `AGENTS.md` §9 요약 + 링크
- [x] `IMPLEMENTATION_PLAN.md` 다음 착수 갱신
- [x] 새 함정(레퍼런스 폴더 이동·worldX·심리스 캐스팅 규칙) → 시스템 페이지 §6 + 스펙 §0.5

---

## 후속 (같은 날) — 스케일 2배 + 비주얼 L1·L3 절차 구현 + HUD 픽셀 패널 (사용자 피드백 2건)

**사용자 리포트 원문 요지**: ① "건물이나 지형 타일 자체가 캐릭터보다 커야 해 … 맵의 크기를 2배 정도
늘리는 것이 맞는 것 같아. 차도로는 캐릭터 최소 4명 길이" + mock_styled 수준 "픽셀 그래픽 고도화"
② "HUD 창들이 전부 남색 단색의 단순 사각형 … '속초' 뒷 배경박스가 없고 … 안개? 구름? 너무 단순한 도형".

**변경**:

- **스케일**: `TILE_M 10 → 5`(맵 선형 2배 — 속초 1179×642) · `ROAD_W` 타일 수 → **미터 기준**
  (`ROAD_W_M` — 주간선 22~28m ≈ 차도 4~6타일) · **보도 타일 `w` 신설**(보행로 + 차도 양옆
  프린지 +2타일 자동) — 래스터라이저/변환기/core(`sidewalk`)/미니맵 배선.
- **L1·L3 절차 구현**(`SeamlessChunks.bakeChunk` 전면 재작성): 잔디·맨땅·모래 스페클/들꽃 ·
  차선 점선(도로 진행축 스팬 판정 `roadAxis`) · 연석('r'↔'w') · 보도/부두 신축이음 · 계선주 ·
  해안 포말 · 파도 대시 · 배(결정적 희소) · 젖은 모래 띠 · 잔디↔맨땅 디더 경계 ·
  **건물 = 전맵 연결요소 라벨링 → 박공 2사면 지붕(팔레트 5종 해시)/대형(≥120타일) 패널 지붕 +
  건물 그림자(남·동측)** · **나무 = 청크 수명 스프라이트**(잔디 해시 산포 · 플레이어와 y-sort).
- **HUD**: 신설 [HudPanelStyle.ts](../../packages/client-pc/src/ui/HudPanelStyle.ts)
  (`paintHudPanel`/`paintHudSlot`/`paintTitlePlate` — 그림자·베벨 프레임·2톤 필·브론즈 스터드) →
  상태/로그/퀵슬롯/미니맵 프레임 + **'속초' 타이틀 명패** + 우하단 힌트 바.
  **야간 발광 수정** — 심리스는 파사드가 없어 창문/네온/대형 글로우가 허공 halo였다(리포트의
  "구름?" 절반) → 문 앞 소형 램프만. **안개 = 픽셀 구름 텍스처 2종**(원 클러스터 4px 스텝 베이크,
  구 단순 타원 폐기). 방파제 가로등 규칙 = 심리스 전용(물가 'b' 8타일 간격)으로 분기.
- **물 렌더 폴리시**: 암초 노이즈 임계 0.74→0.82·거리 5~18·1버킷 융기(구 얼룩 패치 해소) ·
  바다 체커 격자 → 해시 랜덤 2톤.

**검증**: 실렌더 4지점 스크린샷(스폰 도심·직판장 광장·부두·해변 — scratchpad `v2_*.png`) ·
차도 폭 ≈ 캐릭터 4명 · 지붕/나무/보도/연석/차선 정합 · **이동 중 60 FPS 고정** · RT 생성 9(≤12) ·
빌드 4/4 · typecheck 0 · pageerror 0.

**잔여**: L4 NPC 스폰(§11) · 에셋 타일셋 도착 시 절차 렌더 교체 · 다른 지역 반영은
**속초 확정 후**(사용자 지시). ⚠ TILE_M 변경으로 **전 지역 재생성 시 4배 타일** — 대형 지역
(ulleung 등)은 §12 표 수치 ×4로 재검토(청크 스트리밍은 그대로 감당).
