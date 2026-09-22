# 165차 — 컷씬 런타임 재작성 · 얼음 나르기 실플레이 · 「지금 할 일」 메인/서브 · 일지 고정 · 지도 툴팁 · 에셋 정합

| | |
|---|---|
| **날짜** | 2026-09-22 |
| **시스템** | `스토리(S22)` `UI(S9)` `필드(S2)` `인벤(S5)` `데이터` `i18n` |
| **트리거** | 사용자 지시 — Codex 163·164차 산출물 점검 후 "농장 제외하고 전부 순차적으로" |
| **선행 커밋** | `16fba2a` (Codex — `feat: render story quests as field cinematics`) |
| **현재 변경** | 미커밋 → 이 차수에서 커밋·푸시(브랜치 + main) |
| **빌드·타입체크** | core build 통과 · client `tsc --noEmit` 0 · 루트 빌드 3/3 |

---

## 1. 배경 — 왜 했나

사용자가 Codex 작업본(ec19538·16fba2a)을 검토한 뒤 지시했다. 핀트가 어긋난 지점을 원문으로 남긴다.

> "대충 검정색 배경에 이상한 도형 몇 개 그려놓고, 그게 무슨 컷씬이야. 내 의도를 전혀 파악하지 못하고,
> 정말 '컷씬'이라는 단어만 수행했구나?"

> "'실제 속초 필드 위에서 플레이어·정옥선·주변 NPC가 이동하고 머리 위 말풍선과 하단 대사가 순서대로
> 나오는 인게임 연출'이긴 하지만, 그 연출 안에서 유저(플레이어)가 조작할 수 없도록 하고,
> 정말 컷씬이므로 종료된 이후에는 다시 인게임 모드로 돌아와야 해."

> "퀘스트 고정하기 기능을 기획자 의도를 파악하지 못한 채로 작업됨(퀘스트 가장 왼쪽에 고정하기 체크기능,
> 우측 순서대로 의뢰자 이름, 등등 컬럼 순서대로 기능과 그 요구사항에 맞게 반영할 것)"

그 밖에 지정된 것: 얼음 나르기(M1-02)를 인벤 퀘스트 아이템 → 경매장 지정 위치 [F] → 실시간 완료 표기의
실플레이로 · 「지금 할 일」 창에 메인/서브 카테고리(Ⓜ/Ⓢ · 메인 → 서브 순) · 일지 고정은 메인 1 · 서브 1 ·
전체 지도(M) NPC·랜드마크 호버 이름 · 탑다운 팝업은 선택한 창이 최상단 · 일지 겹침 전수점검·가독성 ·
아이템 에셋 3건(지렁이 핑크 롤백 · 가짜 웜 분류 · 트레블훅 · 묶음추 25호).

## 2. 원인 — 무엇이 문제였나

**컷씬** — `StoryCinematicPanel`이 `fieldActors`가 없으면 `drawStage()`로 검은 사각형 무대와
사각형+원 배우를 그렸다(폴백). 필드 경로도 대사창이 `paintHudPanel`이 아닌 평면 사각형·본문 14px이었고,
ESC가 씬의 일시정지 메뉴를 열어(`popupStack` 밖) 컷씬 위에 메뉴가 떴다(직전 QA `{paused:true, cine:true}` 실측).

**일지 고정 컬럼** — Codex는 표 **머리글에만** `고정` 열(34px)을 추가하고 `drawRow`에는 칸을 넣지 않아
본문 전 컬럼이 머리글보다 38px 왼쪽으로 밀려 있었다. 첫 행 밴드(hy+22−20 = hy+2)가 구분선(hy+10)과
머리글 텍스트를 덮어 "겹침·밀림"이 났다(스크린샷으로 확정).

**추적기** — `RegionFieldScene.updateQuestGuide`가 `q.id === 'M1-02'` 하드코딩으로 완료 문구를
직접 적었고, `custom` 목표의 「방법」이 종류별 기본 문장(`대화로 진행한다`)으로 떨어족다.

**행동 계통 중복 매칭** — `emitActionSource`가 같은 계통의 활성 actionKey를 전부 모아 발행해
한 사건에 여러 할 일이 함께 올랐다(164차 §7이 스스로 적어 둔 위험).

**아이템** — 핑크 지렁이 롤백·트레블훅 배선·묶음추 텍스처는 Codex 16fba2a에서 이미 되어 있었다.
남아 있던 것은 `inv_ragworm`(갯지렁이)의 이모지 `🪱`(§8-8 위반 · 아이콘 없음으로 보임)과
가짜 웜의 분류 표기 부재였다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 재작성 | `client/ui/StoryCinematicPanel.ts` | 스텝 타임라인(`say`·`move`·`face`·`emote`·`focus`·`wait`) · 머리 위 말풍선(월드 추종) · 배우·이름표 이동 · 카메라 팬 · 레터박스 · `paintHudPanel` 대사창(본문 20px) · `[ESC] 건너뛰기` · 종료 시 원위치 복원. 검은 폴백 무대 **삭제** |
| 신설 | `client/data/StoryCinematics.ts` | 각본 6종(M1 영금정·좌판·얼음 하역 / N18-6 목격·대조·보고) + EN 짝 + `allCinematicLines()` |
| 수정 | `client/scenes/RegionFieldScene.ts` | `playCinematic(script, roles)` 공용 진입(카메라 stopFollow → 복귀 · HUD 숨김 · 활동 `cinematic`) · `cineActor()`(플레이어 `charSprite.setDir` · NPC 시트 프레임 · 이름표 follower) · ESC = `skipCinematic()` 우선 · `storyNpcs.label` 보관 · 추적기 메인/서브 2건 산출(`buildTrackerEntry`) · M1-02 하드코딩 회수 · 마커 `label` 채움 |
| 수정 | `core/types/Story.ts` · `core/rules/QuestGuide.ts` | `StoryObjective.howToKo/En`(방법 문장 직접 지정) · `afterKo/En`(완료 직후 안내) · `guidePlaceKey`(화살표 목표) |
| 수정 | `core/db-schema/StoryQuestDatabase.ts` | M1-02 목표 4건에 방법 문장·`guidePlaceKey`·완료 안내 · `descKo/En`을 사용자 지정 문장으로 |
| 수정 | `client/store/StoryStore.ts` | `pinned {main, sub}`(구 `tracked` 승계) · `setTracked` 종류별 토글 · `isPinned` · `emitActionSource` 중복 매칭 가드(출처 지정 목표는 출처 일치 · 일반 목표는 가장 앞선 1건) |
| 수정 | `client/ui/RegionHud.ts` | `QuestTrackerData = { entries }` · 메인 → 서브 2블록 · `· 고정` 표기 · `MiniMarker.label` |
| 수정 | `client/ui/JournalPanel.ts` | 첫 컬럼 고정 체크박스(진행 중만 활성 · 클릭 = `setTracked`) · 행 밴드 hy+34로 내려 머리글 침범 해소 · 상세의 중복 체크박스 → 상태 칩(흐름 배치) · 본문 13→14px·머리글 10→11px |
| 수정 | `client/ui/FullMapPanel.ts` | 마커 히트 + `showMarkerTip`(지도 안쪽 클램프) |
| 수정 | `client/ui/ItemDetailPanel.ts` | `루어` 분기 — 소프트 = 「가짜 웜 (소프트 루어) · 고무·실리콘 — 신선도 영향 없음 · 지그헤드」 / 하드 = 바늘 일체형 |
| 수정 | `client/store/InventoryStore.ts` · `client/data/ShopCatalog.ts` | `inv_ragworm` 🪱 → `item_worm` |
| 신설 | `tools/gen_pixel_icons.py` → `PixelIconArt.ts` | `it_ice_crate` 16x16 (84종) · `quest_ice_crate` 🧊 → `px:it_ice_crate` |
| 수정 | `client/store/StoryActionRegistry.ts` | `StoryActionScene`에 `titleEn/placeEn/linesEn` 27종 |
| 수정 | `client/i18n/I18n.ts` · `en_panels.ts` · `en.ts` | 런타임 사전에 각본·행동 절차/선택지/장면·목표 방법/완료 안내 합류 · 정확 일치 60여 건 · 규칙 5건(Ⓜ/Ⓢ 배지 · `(완료!)` · `준비 완료!` · 진행 n/3) |

원격지(다른 지역) 컷씬은 **각본이 지역을 몰라야 한다**는 원칙으로 API를 나눴다 — 각본은 배우 키만 갖고,
어느 필드에서 재생할지는 씬이 정한다. 그래서 같은 각본을 다른 지역 씬이 그대로 재생할 수 있다.
다만 사용자 예시(속초 대화 중 인천 장면으로 전환)의 무대인 **인천 필드 데이터가 아직 없다**(§6).

## 4. 구조상 위치

`S22 스토리 → 연출 층(컷씬 런타임) + 안내 층(추적기·일지)` · `S9 UI → 패널 규격` · `S5 인벤 → 아이콘`.
계약(core `StoryObjective` 3필드) · 데이터(퀘 DB · 각본 · 아이콘) · 판정(`emitActionSource` 가드 · 고정 슬롯) ·
렌더(컷씬 · 추적기 · 일지 · 지도 툴팁 · 상세보기) 네 층을 다 건드렸다. 세이브는 `story.pinned` 추가(구 `tracked` 승계).

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 컷씬 재생 | 실렌더(Playwright) 영금정·좌판 각본 | 실제 필드 위 레터박스·자막·HUD 대사창 20px · 플레이어 이동·방향 전환 · depth 20,000 · pageerror 0 |
| ESC 봉쇄 | 재생 중 ESC | `{paused:false, cine:false}` — 일시정지 메뉴가 열리지 않고 건너뛰기만 |
| M1-02 흐름 | 실 스토어 `__INV` + `StoryStore` | 수락 즉시 `quest_ice_crate` 지급 · obj0 자동 완료 · 운반 방법 문장 데이터 표시 · 하역 후 상자 소모 · 추적기 `얼음 나르기 (완료!)` + 「…이제 정옥선을 찾아가보자.」 + `정옥선에게 다가가 [F]` |
| 일지 고정 | 실렌더 + `auditBottom()` | 첫 컬럼 체크 · `pinned.main = 'M1-02'` · 상세 칩 · 하단 침범 **0** · `[TextOverflow]` 0 |
| 추적기 메인/서브 | `hud.trackerData` | `entries[{kind:'main'…}]` 구조 · 메인 → 서브 정렬 · `· 고정` |
| 지도 툴팁 | `FullMapPanel` 마커 `pointerover` | 라벨 보유 194/194 · 툴팁 `정옥선` |
| 아이템 아이콘 | `__INV` + `textures.exists` | `item_worm`(핑크)·`item_soft_worm`(은색)·`item_treble`·`sinker_bundle` 전부 로드 · 지렁이/갯지렁이 = 핑크 · 소프트 루어 `condition` 없음(신선도 무영향) |
| 행동 가드 | 코드 경로 | 출처 지정(`eventOrigins`) 목표는 출처 일치만 · 일반 목표는 앞선 1건 · 앞 목표 미완료면 제외 |
| EN | 실렌더 en 로케일 (dev 서버 재시작 후) | 추적기 7건·컷씬 4건 텍스트 **한국어 잔존 0** — `Ⓜ Hauling Ice (Done!)` · `Approach Jeong Ok-seon and press [F]` · `[ESC] Skip` |

재현 절차(회귀 테스트): 새 게임 → `StoryStore.accept('M1-01')` → `obj=[1,1,1]` → `complete` → `accept('M1-02')` →
`event visit poi:auction-ice-drop` → `scene.tryPlaceQuestIceCrate()` → `hud.trackerData.entries[0].title`이 `얼음 나르기 (완료!)`.

## 6. 잔여 — 이번에 안 한 것

- **원격지 컷씬 실발화** — 사용자 예시의 무대인 **인천 필드 맵이 없다**(`public/data/`에 busan·hometown·sokcho만).
  런타임은 각본·배우를 분리해 어느 씬에서든 재생할 수 있게 만들었지만, 씬 전환(페이드 → 다른 지역 `scene.restart` →
  재생 → 복귀) 배선은 인천 맵이 생긴 뒤 `RegionFieldScene`에 `playRemoteCinematic`으로 얹는다.
  지금 N18-6 3부작은 Codex가 옮겨 둔 속초 도매시장 후문 좌표에서 재생된다(장소 자막도 그에 맞춤).
- **말풍선 실사 확인** — 헤드리스에서 NPC 대사 프레임을 정확히 잡지 못해 말풍선은 코드 경로·좌표 계산만 확인했다.
  정옥선 `...` 한 줄과 N18-6 `watcher/courier` 대사가 실플레이 확인 대상.
- **농장** — 사용자 지시로 제외.
- 문서 사본 드리프트(루트 `AGENTS.md` · `.agents/skills/`)·전체 위키 아티팩트 반영은 다음 차수.

## 7. 위험·부작용

- `StoryStore.trackedId`는 getter로 남겼다(메인 → 서브 폴백). 구세이브 `tracked`는 해당 할 일 종류 칸으로 승계된다.
- `emitActionSource` 가드로 **동시에 활성인 같은 계통 일반 목표는 하나만 오른다** — 의도된 축소다.
  둘을 함께 올려야 하는 설계가 생기면 그 목표에 `eventOrigins`를 달아 출처로 구분한다.
- 컷씬 중 카메라 `stopFollow` → 종료 시 `startFollow(playerBody)` 복귀. `skip()`이 트윈을 죽여도 `destroy()`가
  배우·이름표를 원위치로 되돌리므로 필드 배치는 바뀌지 않는다.
- ⚠ 하네스 함정 재확인: i18n 파일을 고친 뒤 dev 서버를 **포트 기준으로**(`fuser -k 5173/tcp`) 죽이고 다시 띄운다.
  `pkill -f "run dev"`는 하네스를 띄운 내 셸까지 잡아 검증이 중간에 끊긴다(이번 차수 2회).

## 8. 후속 반영

- [x] 워크로그(이 문서) · [x] `03-WORKLOG/README.md` 인덱스 · [x] S22·S9 시스템 페이지 · [x] `04-BACKLOG.md` ·
  [x] AGENTS §9 · [x] PLAN · [x] CLAUDE.md · [ ] 커밋·푸시(브랜치 + main)
