# 155차 — 인지 UX 전면: 퀘스트 화살표·추적 + 전체 지도(M)·핀 + 채비 고정 + 획득 토스트 + 사시미 별 5개 + 3끼 생존 재보정 + 초상 정합 + 혼잣말 퀘 우호도 정정

| | |
|---|---|
| **날짜** | 2026-09-18 |
| **시스템** | `스토리(S22)` `낚시 루프(S1)` `필드(S2)` `인벤(S5)` `요리(S4)` `진행·생존(S21)` `캐릭터 아트(S23)` `UI` `i18n` `멀티(S24)` |
| **트리거** | 사용자 지시 10건 + 캡처 2장 추가 지시 3건 (실검증·테스터 피드백) |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 지시 10건(원문 요지):

1. *"내 얼굴 수정, 초상화와 캐릭터가 안맞음"* — 대화창 초상이 필드 스프라이트와 다른 사람처럼 보인다.
2. *"채비확정 / 채비수정 / 취소"* — 캐스팅 전에 채비를 확인·확정하는 단계가 있어야 한다.
3. 어획·결과·실패 뒤에는 **항상 1인칭을 나와 탑다운으로** 돌아온다(같은 자리 재캐스팅 폐지).
4. 탑다운에서 캐릭터로부터 **활성 퀘스트 목표 방향으로 화살표** 가이드.
5. **M = 전체 지도** 오버레이(휠 줌·아이콘) · 미니맵 타이틀바에 [+][−] 크기 버튼.
6. 사시미도 불요리처럼 **별 5개 완성도** 모델이 있어야 한다.
7. 허기·수분 소모를 **하루 3끼** 기준으로 보정 · 음식 회복치·가치는 **실제 질량·열량**에서.
8. 테스터: *"얼음 운반 퀘스트 시작했는데 얼음을 어떻게 운반해야 하는 지 모르겠다"* —
   아이템·보상 수령이 **보이게**(우측 페이드 토스트 + 아이콘·수량 · 인벤 퀘스트 아이템 강조),
   "코드 내부 로그만"으로 끝내지 말 것. 다른 인지 공백도 전수 점검.
9. *"속초 영금정으로 이동하는 첫 퀘스트에서, 혼자하는 일인데, 왜 우호도+0.03이 적용되고 있지?"* —
   전수 감사로 이질적인 것을 전부 찾아 고칠 것.
10. 인게임 반영 → 아티팩트 갱신 → `main` 커밋·푸시.

중간 추가 지시(캡처 2장):

- **전체 지도**는 「Ground Zero」식 큰 창 — 상단에 지역 맵 이름 · 랜드마크·상점·식당·퀘스트 인물 표시 ·
  현위치 **빨간 점멸 원**(멀티 피어는 다른 색·근방일 때) · 퀘스트 추적과 **별개의 핀 설정/제거** + 이동 가이드 ·
  좌하단 **범례** + 범례 아이콘을 지도 위에 배치.
- 일지의 **「퀘스트 추적하기」 체크** → 탑다운에서 NPC 방향으로 **계속 점멸하는 화살표**.
- 채비창 우측 하단 **[채비 확정하기]**(설정 고정 · 미끼 같은 소모품만 소모) / **[채비 변경하기]**(잠금 해제).
  두 번째 캡처 = 채비하기 탭 우측 제원 상자 위에 [채비확정] [취 소].
- **후속 정정 2건**(같은 턴): *"큰 지도에서 마우스 휠 위/아래 시, 유저 현재 위치(가운데로) 기준으로 확대/축소"* ·
  *"좌->우 방향으로 드래그하면, 왼쪽으로 지도가 밀리도록"* / *"채비확정 요구사항이 이상하게 적용됨. … 채비하기(U) 창에서,
  우측 하단에 채비 고정 및 고정 해제가 있어야 해"* → 캐스팅 전 확정 팝업을 걷어내고 U 창 우측 하단 [채비 고정]/[고정 해제]로.

## 2. 원인 — 무엇이 문제였나

| 현상 | 확정 기전 | 근거 |
|---|---|---|
| 혼잣말 퀘 M1-01에서 **우호도 +0.03** | `choicesFor()`가 나레이션에 발주 선택지가 없으면 `toneOfferChoices(q.kind)`(메인 톤 세트)로 폴백했다. 그 두 번째 답에 `affinity: 0.03`이 실려 있고 `StoryStore.applyOutcome`은 발주자 유무를 보지 않아 **`affinity['']`**(빈 키)에 누적됐다 | 발행 중이던 아티팩트 v8의 M1-01 발주 선택지에 `우호도 +0.03` 표기 · 세이브에 `affinity['']` 키 |
| 같은 계통의 **데이터 오류 3건** | 검증기를 새로 걸자 `affinityOther`가 **발주자 본인**을 가리키는 완료 선택지가 셋 나왔다 — 발주자 우호도를 두 번 더한다: N13-3 `decline`(송기백) · N05-5 `full`(나기범) · N09-2 `decline`(이수연) | `validateStoryChoices()` 3건 → 0건 |
| N09-2의 **발주자 오기** | 발주 대사가 *"언니가 잡고 제가 조리할게요. 손질은 아저씨가요"* — 한봄의 말인데 DB 행은 `lee_suyeon`. 완료 답 *"(이수연 우호도가 처음 움직인다)"*는 **다른 이(이수연)** 효과가 맞다 | 발주자를 `han_bom`으로 정정하면 `affinityOther lee_suyeon`이 그대로 유효 |
| 초상이 필드 캐릭터와 **다른 사람** | 초상 렌더러(152차)가 필드 시트와 **다른 문법**을 썼다 — 앞머리가 이마를 덮는 스타일(142차 `HAIR_CAP_ROWS`)인데 **눈썹을 항상** 그렸고, 눈은 흰자+홍채 2행인데 필드는 **동공 바 + 홍채** 배치, 수염은 콧수염까지, 모자는 왕관이 머리 행을 덮지 않았다 | 같은 `CharConfig`로 필드/초상 나란히 렌더(`portrait_cmp.mjs` → `portrait_before/after.png`) |
| *"얼음을 어떻게 운반해야 하는지 모르겠다"* | M1-02 첫 목표 라벨은 *"만복상회 얼음 상자를 경매장까지 나른다"*인데 실제 닫는 조작은 **정옥선 대화 → 「일손이 필요하진 않으세요?」 → 일감 「얼음 나르기」**. 어디에도 그 경로가 적혀 있지 않았고, 품삯·보상 아이템은 HUD 로그 한 줄로만 들어왔다 | `StoryStore.work()` 경로 · 보상 지급이 `pushLog`뿐 |
| 1인칭 결과 화면 SPACE = **같은 자리 재캐스팅** | `recast()`가 결과 화면에 남아 있었다(사용자: 항상 탑다운으로) | `FirstPersonFishingScene.recast` |
| 채비 확정이 *"이상하게 적용됨"* | 첫 구현이 **캐스팅 순간 모달**(확정/수정/취소)을 띄웠다. 사용자가 그린 것은 U 창 안 우측 하단의 고정/해제 버튼이었고, 고정은 관문이 아니라 실수 방지 장치다 | 캡처 2장 + 후속 지시 · 모달 삭제 |

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `packages/core/src/db-schema/StoryChoices.ts` | **혼잣말 선택지** `selfOfferChoices()`/`selfCompleteChoices()`(효과 없음) — `choicesFor`가 `!q.giver`면 톤 세트 대신 이것 · 무발주는 `once/event` 거절도 안 붙임. **검증기 확장** — 발주자가 NPC 등록부에 있어야 함 · 무발주 = 우호도/신뢰/거절/재화/아이템/숙련/SP 금지 · `affinityOther` npc 존재 + **발주자와 달라야 함** |
| 수정 | `packages/core/src/db-schema/StoryNarrative.ts` | M1-01·M7-08 혼잣말 발주 선택지(플래그만) · N13-3 `decline` → `affinity 0.18 + harborRep 2` · N05-5 `full` `affinityOther` → `seo_harin` |
| 수정 | `packages/core/src/db-schema/StoryQuestDatabase.ts` | N09-2 발주자 `lee_suyeon` → **`han_bom`** |
| 수정 | `packages/core/src/art/FacePortrait.ts` | 눈썹 = `buzz|topknot`만 · 눈 = 동공 바 / 홍채+하이라이트 / 홍채+밑그늘 · 수염 = 턱선만 · 앞머리 하단·옆머리 깊이 스타일별 · 모자 `crown(bot)` 재작성 |
| 신설 | `packages/core/src/simulation/SashimiQuality.ts` | `SashimiPlateMeta` · `sashimiStarsAt`(신선·컷·식감·구성·완성도 — 임계 0.8 · 완성도는 넷 다 + 평균 ≥ 0.85) · `sashimiStarPriceMult` [0.45…1.2] · `sashimiPlateName` · `quadBalanceOf` |
| 신설 | `packages/core/src/db-schema/FoodNutrition.ts` | `FOOD_NUTRITION`(g·kcal·ml·mlNet — 상점 음식·삶은 문어·불요리 8) · `DAILY_KCAL 2400` · `DAILY_WATER_ML 2000` · `restoreFromNutrition` · `sashimiNutrition(weightG)` |
| 신설 | `packages/core/src/rules/QuestGuide.ts` | `objectiveTarget(q,o)`(npc/place/shop/region/bed/none) · `objectiveHowToKo(q,o,names)`(종류별 조작 문장) · `nextObjectiveIndex` |
| 수정 | `packages/core/src/config/tuning.ts` | `vitals.drainIdle [3.2,4,0]` · `drainSit` · `drainWalk [6,8,12]` · `drainRun [14,18,44]` · `drainBike [9,12,20]` · `drainForage [9,12,32]` |
| 수정 | `packages/core/src/db-schema/FireRecipeDatabase.ts` · `index.ts` | 요리 8종 허기/수분을 영양에서 파생 · 신규 export |
| 수정 | `packages/client-pc/src/store/StoryStore.ts` | `applyOutcome` 우호도는 발주자 있을 때만 · 로드 시 `affinity['']` 제거 · `onCoins` 훅(선택지 재화·완료 보상·품삯) · `trackedId`/`setTracked` + 세이브 `story.tracked` |
| 수정 | `packages/client-pc/src/store/InventoryStore.ts` | `onGained` 훅 + `newIds`/`markSeen`/`hasNewIn` · `cutQuality`/`knifeTier`/`sashimi` 필드 · **채비 고정** `rigLocked`/`lockRig`/`unlockRig` + `setRigPart`·`setLure`·`setJigHead`·`setRigMode` 가드 · 세이브(`consumeRigItem`·`loseRigParts`는 `_rig` 직접 갱신 — 고정과 무관) |
| 신설 | `packages/client-pc/src/store/MapPinStore.ts` | 지역당 핀 1개 · `onChange` |
| 신설 | `packages/client-pc/src/ui/FullMapPanel.ts` | 전면 오버레이(895) — 휠 줌(맞춤~×8)·드래그·더블클릭 중심 · 마커(12px 화면 고정) · 범례 16종 · 빨간 점멸 현위치 · 피어(파랑) · 목표 금테 · **우클릭 핀 설정/제거** · 헤더 [핀 제거] · **휠 = 내 위치를 가운데 두고 확대/축소** · `DRAG_DIR`(좌→우 드래그 = 지도 왼쪽으로) |
| 수정 | `packages/client-pc/src/ui/RegionHud.ts` | 미니맵 **타이틀바**(`MINI_HDR 18` · [−][+] · 'M 전체 지도') · `setQuestTracker`(미니맵 아래 패널 — 제목·목표·방법·거리) · `showItemToast`(우측 250×46 · 아이콘 · 귀속/퀘 금테 · ≤4 스택) · 핀 마커 |
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` | `M` → `toggleFullMap` · 훅 배선(`onNotify`·`onGained`·`onCoins`·`MapPinStore.onChange`) · `pickGuideQuest`(추적 → 활성 메인→서브 → 수령 가능) · `updateQuestGuide`(400ms) · 점멸 화살표(퀘 금 r46 · 핀 청록 r60) |
| 수정 | `packages/client-pc/src/scenes/FirstPersonFishingScene.ts` | 결과·후속 화면 버튼 = 「필드로 돌아가기 (SPACE)」 단일 · `recast()` **삭제**(사용자 지시 — 재캐스팅은 탑다운에서 다시) |
| 수정 | `packages/client-pc/src/ui/UtilizationPanel.ts` | 채비 탭 **우측 하단** `renderRigLockButtons`([채비 고정] / [고정 해제] — 뜻 없는 쪽은 흐리게 · 배지는 버튼 위) · 고정 중 소켓·루어·지그헤드·편대·모드 클릭 가드 · `finalizePlate`가 `SashimiPlateMeta` 저장 + 별 배율 가격 + `(별 N개)` 이름 |
| 수정 | `packages/client-pc/src/ui/SashimiPanel.ts` · `ItemDetailPanel.ts` | 조각에 `cutQuality`·`knifeTier` · 상세보기 사시미 별점(지금/담은 직후 · 5축 · 구성 · 칼 · 경과) + 음식 영양·섭취 효과·열량당 가격 행 · '가공품' 가짜 `HP +10` 제거 |
| 수정 | `packages/client-pc/src/ui/InventoryPanel.ts` · `JournalPanel.ts` · `DialoguePanel.ts` | 탭 금점 · 셀 NEW 점(호버 시 해제) · 귀속 금테 / 첫 미완 목표에 `방법 · …` 줄 + 「이 할 일 추적하기」 체크 / 대화창 목표 줄에 방법 |
| 신설 | `packages/client-pc/src/data/QuestGuideNames.ts` | `GUIDE_NAMES`(NPC·아이템·지역·일감·장소 이름 조회 — 내부 id 미노출) |
| 수정 | `packages/client-pc/src/data/ItemVitals.ts` · `ShopCatalog.ts` · `HelpContent.ts` · `i18n/en.ts` | 음식 회복치 전부 `nut(id)` 파생 · 설명문의 손수 적은 허기/수분 수치 6곳 제거 · M 키 설명 · 155차 EN 사전·규칙 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

- **S22 스토리 → 선택지·우호도**: 계약(검증기)·데이터(선택지 3건·발주자 1건)·판정(`applyOutcome` 가드) 세 층.
- **S22 → 목표 안내**: core 규칙층(`QuestGuide`)이 "어디로·어떻게"를 내고, client는 대화창·일지·추적기·화살표 네 표면이 같은 함수를 소비한다.
- **S2 필드 → 지도**: 렌더층만(`FullMapPanel`·미니맵 타이틀바). 핀은 client 스토어(세션 메모리).
- **S1 낚시 → 채비 고정**: 상태(`InventoryStore.rigLocked` — 세이브)·UI(U 탭 우측 하단 버튼)·1인칭 종료 흐름. 고정은 관문이 아니다 — 캐스팅은 고정 여부와 무관.
- **S4 회썰기 → 접시 가치**: core 판정(`SashimiQuality`)·데이터(`InvItem.sashimi`)·렌더(상세보기).
- **S21 생존 → 소모·회복**: 튜닝값 + core 데이터 테이블(`FoodNutrition`) — client `ItemVitals`는 파생만.
- **S23 캐릭터 아트 → 초상**: core 렌더 문법만(필드 시트 불변 · 표시 크기 불변).

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 선택지 무결성 | `validateStoryChoices()` · `validateStoryQuests()` (dist) | 착수 시 3건 적발 → 수정 후 **0 · 0** |
| M1-01 · M7-08 선택지 | dist `choicesFor` | 발주 2·완료 2 전부 `describeOutcomeKo` = 빈 문자열(효과 없음) |
| 목표 방법 문장 | core `objectiveHowToKo` | M1-02 일감: `정옥선에게 [F] → 「일손이 필요하진 않으세요?」 → 일감 「얼음 나르기」` |
| 사시미 별 | core `sashimiStarsAt` | 정석 접시 **5/92** → 5시간 뒤 '보통' **2/51** · 막칼 접시 2별 |
| 영양 회복 | core `restoreFromNutrition` | 정식 30/8 · 생수 0/25 · 소주 17/−12 · 초코바 8/−1(허기/수분) |
| 하루 소모 | 전형 하루(대기·걷기·낚시 혼합) 적분 | 허기 **105** / 수분 **134** ≈ 3끼 + 물 |
| 초상 정합 | `portrait_cmp.mjs` — 필드 시트 vs 초상 나란히 | 앞머리·눈·수염·모자 문법 일치(육안) |
| 필드 가이드 | 실렌더 `c155.cjs` | 목표 영금정(18320,2832) · 화살표 표시 · 라벨 `영금정 · 299m` · 추적기 3줄 |
| 미니맵 [−][+] | 실렌더 | 0→1→2→2(상한 클램프) · 추적기 y 246.6 = 미니맵 하단 |
| 전체 지도 | 실렌더 | 열림(줌 2.2) · 휠 → 2.596 · **휠 뒤 내 위치 = 뷰 중앙(616,290)** · 좌→우 120px 드래그 → panX −753 → −873(지도 왼쪽으로) · 마커 62~71 · 닫힘 후 스택 0 |
| 캐스팅 게이트 | 실렌더 | 고정 안 된 채비로 `tryStartCharge` → 팝업 없이 `charging true` |
| U 탭 고정 버튼 | 실렌더 | 우측 하단 [채비 고정](x 856 · y 450) / [고정 해제] · 상태에 따라 alpha 1 ↔ 0.45 교차 · 배지 문구 교체 · 고정 중 `setRigPart` 무시 · 해제 후 반영 |
| 핀 · 추적 | 실렌더 | 우클릭 핀 → 화살표 `핀 · 156m` + 미니맵 핀 · 체크 → 추적기 제목 `[추적 중] 막차` |
| 토스트 · NEW | 실렌더 | 토스트 3 · `newIds` 2 · 탭 금점(기타·음식) |
| 상세보기 | `buildItemDetail` | `영양: 120 g · 210 kcal · 수분 30 ml` · `섭취 효과: 허기 +9 · 수분 +2` · `열량당 가격` |
| 영문 | dev 재시작 후 `en` 스캔 | U 채비 탭 한국어 잔존 **0**(Lock rig / Unlock rig) · 추적기 5줄 전부 영문 |
| 경계·오류 | 전 Text 우/하단 · pageerror | overflow **0** · pageerror **0** |
| 아티팩트 | `verify_wiki_155.mjs`(1280 · 390px) | 가로 스크롤 0 · pageerror 0 · **v9 발행**(M1-01 혼잣말 선택지 · N09-2 의뢰인 한봄) |

재현: `NODE_PATH=/opt/node22/lib/node_modules NO_PROXY='*' node <scratchpad>/c155.cjs` (dev 서버 선행).

## 6. 잔여 — 이번에 안 한 것

- **핀은 세션 메모리** — 세이브에 넣지 않았다. 지역당 1개라 다시 찍는 비용이 작다. 요청 시 `SaveData.mapPins`.
- **화살표는 위치를 아는 목표만** — `objectiveTarget`이 `none`을 내는 종류(catch·craft·sell 등)는 방법 문구만 준다.
  "가까운 물가"처럼 장소를 추정해 가리키는 것은 오도 위험이 있어 하지 않았다.
- **고정 중 부품 손실** — 소모·손실은 `_rig`를 직접 쓰므로 고정과 무관하게 진행되고, 빈 소켓은 기존 캐스팅 게이트가 막는다.
  다시 채우려면 [고정 해제]가 필요하다 — 체감 불편이 나오면 손실 시 자동 해제 한 줄.
- 사시미 **식감 축은 칼 등급·컷 품질**에서만 온다 — 두께 균일성 판정(65차 잔여)은 그대로.
- 영양 테이블은 **상점 음식 + 불요리 8 + 삶은 문어**. 새 음식은 테이블에 g·kcal·ml 한 줄이면 회복치가 따라온다.
- 도움말 「음식」 토픽의 예시 수치는 129차 값 그대로일 수 있다 — 다음 도움말 현행화 차수에서 재캡처.
- 레거시 맵(홈타운·부산 7맵)에서의 전체 지도는 하네스로 돌리지 않았다(속초 심리스만).

## 7. 위험·부작용

- **생존 밸런스가 즉시 바뀐다** — 튜닝값이라 세이브 이관은 없고, 구세이브도 로드 직후부터 새 소모율.
  음식 회복치도 129차 백필 규칙으로 로드 시 테이블 값으로 덮인다.
- **N09-2 의뢰인 이동** — 진행 중 세이브는 목표 진행이 보존되고(발주자는 저장 안 함), 마커·대화 상대만 한봄으로 바뀐다.
- **`affinity['']` 삭제** — 구세이브에 남은 빈 키를 로드 시 지운다. 실제 NPC 우호도는 손대지 않는다.
- **1인칭 재캐스팅 폐지** — SPACE가 곧 종료다. 같은 자리 반복은 탑다운에서 다시 던진다(사용자 결정).
- **고정은 관문이 아니다** — 캐스팅 흐름은 155차 이전과 같다(팝업 없음). 구세이브는 `rigLocked` 기본 false.
- 전체 지도(895)는 일반 밴드 최상단 — 확인창(950)이 위에 온다. ESC는 팝업 스택 LIFO 그대로.

## 8. 후속 반영

- [x] 시스템 페이지 S22·S4·S21·S23·S24·S1·S2·S5·UI §4·§5·§6 갱신
- [x] `04-BACKLOG.md` 155차 잔여
- [x] `AGENTS.md` §9 요약 + 링크 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 스킬 `verify-render` 함정 3건(헤드리스 rAF·`nearWater` 재계산·EN HMR)
- [x] 아티팩트 v9 재발행
