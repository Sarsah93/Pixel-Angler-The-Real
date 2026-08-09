# 087차 — 두족류 손질 잠금 해제: 무늬오징어 14스테이지 완주 (+ 어종별 도마 스프라이트 · 돌돔 성별 배선)

| | |
|---|---|
| **날짜** | 2026-08-09 |
| **시스템** | `손질`(S3) · `에셋` · `인벤토리`(S5) |
| **트리거** | 사용자 지시 3건 — ① "돔류·방어류 도마 그림을 각 어종 사진으로 교체" ② "돌돔 성별 배선 추가 + 두족류 4종 dev 지급" ③ **"두족류 손질이 막혀 있네? 잠금을 풀자"** |
| **커밋** | 미커밋 |
| **빌드·타입체크** | 4/4 · 0 오류 |
| **검증 상태** | 자동 검증(core 실판정 + Playwright 실렌더) 완료 · **수동 실플레이 미완** — 2026-08-09 시간 부족으로 익일 재개 |

---

## 1. 배경

세 갈래가 한 세션에 이어졌다.

1. **어종별 도마 스프라이트** — *"돔류와 방어류는 각각 하나의 생선 그림으로 통일(감성돔, 잿방어)했는데, 지금 적용된 그림이 픽셀 그래픽이 너무 낮아서, 현재 적용중인 각 어종들의 사진으로 대체해서 적용하려고 해. 우선 손질 과정에 보여지는 픽셀 이미지만 전부 각 어종별로 교체해 줄 수 있어? (시메, 머리따기, 비늘치기, 지느러미 제거까지만)"*
2. **돌돔 성별 + 두족류 지급** — *"돌돔 암/수간 이미지 크기가 큰 차이가 없을 것으로 판단되는데, 성별 배선을 추가해줘. 그리고 두족류 가이드 검증을 해야하니 … 문어 1, 무늬오징어 1, 한치 1, 갑오징어 1 지급해줘."*
3. **잠금 해제** — *"두족류는 현재 손질이 불가능하도록 막혀있네? 구현했다면 확인할 수 있어야 하는데? 그럼 이제 잠금을 풀자."*

③의 전제가 사실과 달랐다. 80차가 한 것은 **재료 준비**(타입·프로필·가이드·부산물·에셋·tuning)이고 **트리 본체는 착수된 적이 없다.** 착수 범위를 물어 **"무늬오징어 1종 완주"**(스펙 §11.3 권장 순서)로 확정했다.

## 2. 원인 / 실측

| # | 확인한 것 | 근거 |
|---|---|---|
| ① | **잠금은 플래그가 아니었다** — `buildCephStages`·`ButcheryProcess` 두족류 분기·`CephalopodTemplateRenderer` 전부 **검색 결과 0건** | `grep -rn "buildCeph\|CephStages"` = 0 · `ls ui/Cephalopod*` = 없음 |
| ② | 스텁만 풀면 **오징어가 어류 트리를 탄다** (시메→방혈→비늘치기→세장뜨기) + 도마엔 감성돔 그림 | `getButcheryFamily` → `'finfish'` 반환 시 `buildButcheryStages(round)` 경로 |
| ③ | **긴꼬리벵에돔 원본만 머리 오른쪽** | 등지느러미 대역이 x 0.44~0.77(타 돔류 0.23~0.55) → 미러 후 **0.23~0.55로 정렬** |
| ④ | `InvItem`에 **`sex` 필드가 없어** 쿨러→인벤 이송에서 성별이 유실 | `CoolerSlotItem.sex`는 존재(`CoolerStore.ts:33`), `InvItem`엔 없음 |
| ⑤ | `advanceSection`의 체크포인트가 **어류 섹션 id 하드코딩** → 두족류는 항상 `'none'` | dev 4섹션 진행 후 `checkpoint: 'none'` 실측 (수정 후 `'fillets'`) |

## 3. 변경

### A. 두족류 손질 트리 (신규 — 잠금 해제 본체)

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `core/db-schema/CephalopodStages.ts` | **무늬오징어 14스테이지**(§1.1 13 + §0.5.6 부리) + `buildCephalopodStages(speciesId)` · `isCephalopodTreeReady`. 미구현 3종은 `undefined` |
| 신설 | `core/db-schema/CephalopodGuides.ts` | 스펙 §4.6에 없던 경로 9종 추가 — 시메 2선·펼치기·내장·펜·껍질 들춤·아가미 영역/스윕·날개 2선·머리 3분할 2컷. **전부 근사값 · F9 실측 대상** 명기 |
| 신설 | `core/types/Butchery.ts` | **`primitiveInput(p)` → `'tap'\|'path'\|'fill'\|'peel'\|'button'`**. 프리미티브는 19종인데 조작은 5가지 — 패널 분기 15곳이 종류마다 늘어나던 구조를 여기서 끊는다 |
| 신설 | `core/db-schema/ButcherySections.ts` | **`SQUID_SECTIONS`** 6섹션 14작업 (§0.5.4: 스테이지 1개 = 작업 1개 · 전부 `anyOrder: false`) + `sectionsForCephalopod` · `sectionsForSpecies`. `ButcherySectionYield`에 `CephByproductId` 편입(중간 매핑 층 신설 안 함) |
| 수정 | `core/simulation/ButcheryProcess.ts` | 생성자에서 두족류 트리 우선 분기 + `cephalopod` 플래그 · `advance()`가 두족류면 **항상 뷰 스냅**(전이가 공정 자체라 뒤집기로 도달 불가) · `submitCut`/`submitFill`/`submitWash`를 `primitiveInput` 기준으로 확장 · **`evalNerveCut`**(중점 반경 + 스트로크 길이 0.03~0.12 — §3.1) |
| 신설 | `core/db-schema/ButcheryProfiles.ts` | **`canButcherSpecies(speciesId)`** — 분류(`getButcheryFamily`)와 **구현 여부**를 분리. 두족류가 종별 순차 개방이라 필요 |
| 신설 | `client/ui/CephalopodFish.ts` | **`drawCephalopodFish`** — 6뷰(DORSAL/VENTRAL/OPEN/SKIN_UP/FLESH_UP/PARTS) 파라메트릭 렌더 + `CEPH_VIEW_LABEL`. 시메 색전환(갈색+청록 발색점 → 유백색) · 박리선 연결 유지 · 내장/펜/아가미 레이어 |
| 수정 | `client/ui/ButcheryPanel.ts` | 프리미티브 분기 15곳 `primitiveInput` 정규화 · 두족류 렌더 분기 + `cephState()`(완료 스테이지에서 파생) · `buildYieldRows` 두족류 branch + `cephRatio`(프로필 부위 비율) · `result` = [확인] 버튼 · 두족류는 뒤집기 버튼 숨김/뷰 표기 · **`advanceSection` 체크포인트를 `exitAfter` 기준으로 일반화** |
| 수정 | `client/ui/UtilizationPanel.ts` | 도마 [손질 시작] 게이트 `family === 'finfish'` → **`canButcherSpecies()`** |

### B. 어종별 도마 스프라이트

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `tools/gen_species_sprites.cjs` | `public/fish/*.png` → bbox 크롭 → 128폭 다운샘플 → 44색 → `data/PixelFishSpecies.ts`. **머리 방향 검수용 프리뷰 시트**(`--preview`) 동반 |
| 신설 | `client/data/PixelFishSpecies.ts` | **10키**(돔류 6 + 돌돔 수컷 + 방어류 3) + `SPECIES_WHOLE` (참돔 야간은 참돔 공용) |
| 수정 | `client/ui/PixelButcherFish.ts` | `butcherSpritesFor(speciesId, indiv?)` — 어종 전용 온마리 우선 + **`wholeNative`**(온마리만 실색 → 틴트 금지. 개복 이후 어종군 공용 뷰는 틴트 유지) |

### C. 돌돔 성별 배선 · 두족류 dev 지급

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `client/data/FishTextures.ts` | **`isStripelessMale()`** — 40cm↑ 수컷 판정을 텍스처/도마가 공유(규칙 중복 제거) |
| 신설 | `client/store/InventoryStore.ts` | **`InvItem.sex`** + dev 어획물에 성별 저장 + **두족류 4종 dev 지급**(무늬오징어·한치·갑오징어·참문어 — 외투장 기준) |
| 수정 | `CoolerPanel.ts`(2) · `FirstPersonFishingScene.ts`(2) | 쿨러→인벤 이송·어획 직행 4경로에 `sex` 전달 |

## 4. 구조상 위치

`S3 손질 → B2 두족류` — **계약(타입)·데이터(트리·섹션·좌표)·판정(프리미티브)·렌더 4층 전부**를 새로 놓았다.
어류 경로와의 접점은 3곳뿐이라 파급이 좁다: ① `ButcheryProcess` 생성자 분기 ② `primitiveInput` 정규화(어류는 의미 불변) ③ 게이트 함수 교체.
B·C는 각각 **렌더 층만** / **데이터 층만**이라 손질 로직과 독립이다.

## 5. 검증

### core 실판정 (`verify_squid_tree.mjs`) — **12/12 ALL PASS**

| 대상 | 결과 |
|---|---|
| 14스테이지 · 사진 대응 순서 | S1~S14 id·프리미티브·뷰 전부 일치 |
| 섹션 정합 | 6섹션 14작업 · 미참조 0 · 고아 0 · **1:1 true** · 전부 순서강제 |
| **14스테이지 완주** | 프리미티브별 실제 제출로 `finished: true` |
| nerve_cut 실패 케이스 | 빗나감 `passed:false` · 과길이 `passed:false` · 정타 `passed:true` |
| 게이트 | squid 개방 / 한치·갑오징어·문어 **잠금 유지** / 복어 잠금 |
| 어류 회귀 | 돔류 30스테이지 · 광어 30스테이지 · `cephalopod:false` |

### 실렌더 (`verify_squid_render.cjs` · `verify_squid_yields.cjs`)

| 대상 | 결과 |
|---|---|
| 6뷰 컨택트 시트 | 전 뷰 구분 렌더 — 박리 중 껍질/살이 **박리선에서 이어져** 보임(§9 요구) `squid_views.png` |
| 패널 완주 | 진입 `CEPH_DORSAL` → 14/14 진행 → `finished` |
| **부산물 실지급** | 10종 — 덩어리 338g · 연골 · 껍질 · 아가미 ×2 · 날개살 · 다리부 · 머리부 · 먹물주머니 · 부리 · **몸통 순살 362g**(786g × mantleRatio 0.46 ✓) · 원물 소모 |
| **중도 이탈**(껍질 섹션 후) | checkpoint `fillets` · 부산물 3종 유지 · 원물 소모 |
| 공통 | pageerror 0 |

### 재현 절차 (다음 세션 수동 검증용)

```
1. npx pnpm --filter @tra/client-pc run dev --port 5175 --strictPort
   (core를 건드렸으면 npx pnpm --filter @tra/core run build 선행 — dist가 stale이면 옛 트리를 본다)
2. 게임 로드 → 세이브 불러오기   ← dev 두족류 4종은 **로드 시점에 주입**된다
3. 인벤(I) → 회칼 우클릭 → 오른손 착용    (미착용이면 [손질 시작]이 안 열린다)
4. U → 요리 탭 → 무늬오징어를 도마로 드래그 → [손질 시작]
5. 시메 ① 부터 14스테이지. 뒤집기 버튼은 없다(뷰가 공정에 따라 자동 전환).
   result 스테이지(분리 결과 확인 / 껍질 분리 완료)는 사이드바 [확인] 버튼 1탭.
6. dev 좌하단 [dev: 개별 작업(확장)]으로 특정 스테이지 점프 가능.
```

**중점적으로 볼 것**: ① 유도선이 오징어 몸 위 맞는 자리인가(9경로가 근사값) ② nerve_cut이 "짧고 정확히"로
체감되는가(길이 밴드 0.03~0.12) ③ 껍질 박리 연출에서 두 조각이 이어져 보이는가 ④ 부산물 팝업 문구·수량.

### B·C 검증

- 어종 스프라이트: 9종 굽기 · **서로 다른 크기 8가지**(어종군 대표였다면 2) · 머리 방향 전수 확인(긴꼬리벵에돔만 미러) · 지느러미 삭제율 6.4~9.2%
- 돌돔 성별: 45cm 수컷 128×68 / 암컷·35cm수컷·성별미상·인자없음 전부 128×76(안전 기본값) · 실렌더 무늬 유무 확인
- 두족류 dev 4종: 텍스처 4/4 로드 · 분류 전부 `cephalopod`

## 6. 잔여

| 항목 | 왜 | 착수 조건 |
|---|---|---|
| **⏸ 무늬오징어 수동 실플레이 검증** | 자동 검증(하네스)은 통과했으나 **사람이 실제로 조작해 본 적이 없다.** 유도선 위치·드래그 체감·연출 타이밍·안내 문구는 하네스로 판정할 수 없다 | **다음 세션 최우선** — 아래 재현 절차 |
| **한치 15 · 갑오징어 13 · 문어 11** | 1종 완주 후 확장(스펙 §11.3 ④~⑥) | **위 수동 검증 통과 후** |
| 소모품 2종(`coarse_salt`·`kitchen_towel`) | 갑오징어 속껍질·문어 소금에서 필요 | ⑤⑥ 착수 시 |
| 전용 에셋 3종(`ceph_skin`·`ceph_gill`·`ceph_inner_skin`) | 아이콘 공백(텍스트 표기로 동작) | 사용자 제공 |
| 두족류 가이드 좌표 F9 실측 | 신규 9경로가 근사값 | 사용자 측정 |
| 시트 도트 추출(`gen_ceph_stages.cjs`) | 현재 렌더는 파라메트릭 플레이스홀더 | SVG 4장이 정본 — 도구 신설 |
| 두족류 수율·등급 · 슬라이싱(`whole` 모드) | §8·§6 미착수 | ⑦⑧ |
| 어종별 `FIN_ERASE` | 어종군 단위라 강담돔 등 끝부분 잔여 가능 | 실플레이에서 거슬리면 |

## 7. 위험·부작용

- **`primitiveInput` 정규화가 어류 15곳을 건드렸다.** 의미는 보존(`guided_cut`→`path`, `drag_fill|scoop`→`fill`)했고 어류 회귀(돔 30·광어 30스테이지 · 실판정)로 확인했으나, **새 프리미티브를 추가할 때 분류를 빠뜨리면 조용히 `path`로 떨어진다**(default 절).
- **두족류는 뷰를 자동 스냅한다** — 어류의 "수동 뒤집기" 원칙과 반대다. `advance()`의 `cephalopod ||` 조건을 지우면 두족류가 첫 전이에서 입력 차단으로 멈춘다.
- 체크포인트 일반화(`exitAfter && 'none'` → `'fillets'`)는 **어류에도 적용**되지만, 어류 `exitAfter` 섹션은 전부 앞선 if에서 이미 값이 잡히므로 실동작 변화 없음(검증: 돔·광어 회귀 통과).
- `ButcherySectionYield`에 `CephByproductId`를 union으로 넣었다 — 두 집합에 **같은 문자열이 생기면 조용히 오매칭**된다. 어류 키는 카멜케이스, 두족류는 `ceph_`/`octo_` 접두라 현재 충돌 없음.
- 구세이브: `InvItem.sex`는 옵셔널이라 마이그레이션 불필요(없으면 암컷 기준). 두족류 dev 지급은 로드 시 주입되므로 **세이브를 다시 불러와야** 보인다.

## 8. 후속 반영
- [x] `02-SYSTEMS/butchery.md` §4 B2 · §5 · §6
- [x] `04-BACKLOG.md` A1 · A2
- [x] `03-WORKLOG/README.md` 인덱스
- [x] `AGENTS.md` §9 요약
- [x] `IMPLEMENTATION_PLAN.md` 직전 완료 · 다음 착수
- [x] `docs/wiki/README.md` §3 지금 위치
