# 151차 — 영문 나레이션 186편 + 장비창 페이퍼돌 착용 반영 + 퀘스트 아티팩트 위키형 재발행

| | |
|---|---|
| **날짜** | 2026-09-17 |
| **시스템** | `스토리` `캐릭터 아트` `문서(아티팩트)` |
| **트리거** | 사용자 지시 3건 — "퀘스트 아티팩트 위키형으로 재발행 업데이트 / 영문 나레이션 186편 추가 / 장비창 페이퍼돌 착용 아이템 반영" |
| **커밋** | main |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

세 건 모두 **이미 알고 있던 빚**이다. 백로그에 이름이 올라 있었고, 사용자가 그 세 개를 집어 한 번에 끝내라고 했다.

- **O1 영문 나레이션** — 141차가 나레이션 186편을 쓰면서 헤더에 *"영문은 비워 둔다 … 영문 사전 편입은 후속"* 이라고 적어 두고 그대로 두었다.
  그래서 영어로 켜면 UI 라벨은 전부 영문인데 **이야기만 한국어**로 남았다.
- **O4 장비창 페이퍼돌** — 138차가 캐릭터를 페이퍼돌(레이어 14종)로 재작성했는데 **인벤토리의 착용 상태를 읽는 곳이 한 군데도 없었다.**
  `refreshCharacterLook()`는 있는데 호출측이 0이고, 모자를 써도 장비창 속 캐릭터는 맨머리였다.
- **아티팩트** — 150차에 사용자가 타르코프 위키 퀘스트 문서(PDF)를 주며
  *"퀘스트 정보 열람의 형태는 이 위키에서 보이는 것처럼 구성되어야 한다"* 고 지정했으나, 그 차수에서는 **인게임 일지만** 그 형태로 갔고
  아티팩트는 구 「항로도」(챕터 막대 + 접이식 목록) 그대로였다.

## 2. 원인 — 무엇이 문제였나

**O4만 버그성이다.** 기전은 "미구현"이 아니라 **끊어진 배선**이었다.

- `GameState.character.outfit`은 캐릭터 생성 시 `starterOutfit()`으로 한 번 정해지고 **그 뒤 아무도 바꾸지 않는다.**
- 인벤토리의 착용 상태(`InvItem.equipped` + `subCategory`)와 `CharOutfit`을 잇는 **매핑이 아예 없었다.**
- 그래서 `refreshCharacterLook()`를 불러도 같은 설정을 다시 구울 뿐이라, 호출측이 0인 것이 "증상"이 아니라 **당연한 결과**였다.

⚠ 처음에 생각한 "착용 장비에서 옷차림을 **전부 파생**시킨다"는 방향은 **틀렸다.**
시드 인벤토리의 옷(낚시 모자·조끼·방수 바지·갯바위 단화)은 **기본 미착용**이라, 전면 파생으로 만들면 새 캐릭터가 **벗고 시작한다**(실측: 파생 결과 `shirt/pants/shoes = none`).

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | `packages/core/src/db-schema/StoryNarrativeEn.ts` | 나레이션 영문 **186편**(intro·offer·progress·done·objectives·epilogue). 한국어 원고와 **같은 키를 쓰는 짝 파일** |
| 신설 | `packages/client-pc/src/data/EquipOutfit.ts` | 착용 장비 → `CharOutfit` 매핑 + `characterLook()`(기저 위에 덮은 결과) |
| 신설 | `tools/gen_quest_wiki_data.mjs` · `tools/quest_wiki_template.html` | 아티팩트 데이터·페이지 생성기. `--html`이면 완성 HTML을 뱉는다 |
| 수정 | `packages/core/src/types/Story.ts` | `QuestNarrative`에 `offerEn`/`progressEn`/`doneEn`/`objectivesEn`/`epilogueEn` 추가(`introEn`은 141차부터 있었다) |
| 수정 | `packages/core/src/db-schema/StoryNarrative.ts` | `mergedNarrative()` 캐시로 ko+en 합본 · `allNarrativeLines()`가 ko→en 쌍을 낸다 · `narrativeEnCoverage()` 점검기 신설 |
| 수정 | `packages/client-pc/src/i18n/I18n.ts` | `allNarrativeLines()`를 런타임 사전에 합류(원문이 곧 키 — **호출부는 한 줄도 안 바뀐다**) |
| 수정 | `EquipmentPanel` · `MonologuePanel` · `RegionFieldScene` · `MainMenuScene` | 렌더 호출측 5곳을 `GameState.character` → **`characterLook()`** 로 교체 |
| 수정 | `RegionFieldScene` | `inventory-changed`와 장비창 `onChanged`에서 `refreshCharacterLook()` 호출(착용 변경 → 즉시 재굽기) |

### ⚖ 결정 — 덮어쓰기지 대체가 아니다

`characterLook()`은 **기저(`GameState.character.outfit`)를 건드리지 않고** 착용분만 위에 덮은 **새 객체**를 돌려준다.

- 장비를 다 벗으면 생성 때 고른 옷차림으로 돌아갈 뿐 **알몸이 되지 않는다.**
- 기저를 갈아치우지 않으므로 **몇 번을 불러도 결과가 같다**(기저를 덮어쓰면 두 번째 호출부터 "벗은 장비가 안 벗겨진다").
- 세이브 스키마 변경이 없다 — 구세이브 마이그레이션 불요.

매핑은 **아이템 id 표**가 먼저고(표시명은 로케일·개명으로 흔들린다), 미등재 장비는 `subCategory` + 이름 낱말로 추론한다
(`비니|털모자` → beanie, `조끼|베스트` → outer vest, `장화|부츠` → boots …). 손 도구는 `tool`로 `held`를 정한다(rod/net).

## 4. 구조상 위치

- **영문 나레이션** = `S22 스토리 → 나레이션 층 → 로케일`. **데이터 층**만 늘렸다. 판정·진행 로직은 한 줄도 안 건드렸다.
  i18n은 원문이 곧 키인 훅 구조라 **UI 호출부 변경 0**.
- **페이퍼돌** = `S23 캐릭터 아트 → 페이퍼돌 → 입력(착용 상태)`. **뷰 파생 층** 신설.
  코어 아트(`CharacterArt.ts`)와 세이브(`SaveData.character`)는 불변.
- **아티팩트** = 문서 산출물. 코드 영향 없음(생성기는 `dist`를 읽기만 한다).

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 영문 커버리지 | `narrativeEnCoverage()`(빌드된 dist) | **829 / 829 줄 번역 · 누락 0** |
| 사전 합류 | `allNarrativeLines()` | 829쌍 · `en !== ko` **829** |
| 키 정합 | ko 186 ↔ en 186 대조 | 누락 0 · 잉여 0 |
| EN 실렌더 | dev 서버 + Playwright, `setLocale('en')` 후 `t()` | `I started crying in front of the stall…` / `If you're going to cry, carry the ice first…` |
| 페이퍼돌 | 실 스토어(`__INV`) 착용 5종 + `characterLook()` | hat `none→cap` · outer `none→vest` · shoes `sneakers→rubber` · gloves `false→true` · held `rod` |
| 페이퍼돌 되돌리기 | 모자 해제 | hat `cap→none` · **기저 `GameState.character.outfit.hat`은 내내 `none`**(불변 확인) |
| 페이퍼돌 실렌더 | 장비창 스크린샷 | 모자·조끼·장갑·고무화·손에 든 대가 그림에 나온다 (`scratchpad/151_equip_paperdoll.png`) |
| 아티팩트 | Playwright 1280×900 / 390×844 | 색인 186행 · 7절(대화·요구사항·목표·보상·안내·참고·여담) · 검색 `도현수` 14건 · 본 줄기 68건 · **가로 스크롤 0** · pageerror 0 |
| 재현성 | `node tools/gen_quest_wiki_data.mjs --html` | 발행본과 **바이트 동일**(`cmp` 0) |
| 빌드 | `npx pnpm run build` + `typecheck` | 3/3 · 0 오류 |

⚠ **실측으로 잡은 것 2건**

1. 아티팩트가 **390px에서 가로로 넘쳤다**(scrollWidth 510 > 390). 범인은 표가 아니라 **`.cols{grid-template-columns:1fr}`** —
   `1fr`은 `minmax(auto,1fr)`이라 색인의 min-content가 트랙을 밀어낸다. `minmax(0,1fr)`로 해소.
2. 첫 그림에서 **제호가 안 보였다** — `renderDoc()`이 초기 렌더에서도 `scrollIntoView`를 불렀다.
   **넘어갈 때만** 스크롤하도록 인자를 붙였다(썸네일·첫 인상이 문서 중간에서 시작하면 안 된다).

## 6. 잔여 — 이번에 안 한 것

- **선택지(`complete`/`offerChoices`) 영문** — 510개 라벨 + 응답. 이번 지시는 "나레이션"이고, 분량이 나레이션과 맞먹어 별도 차수로 둔다.
  현재는 `labelEn = labelKo` 폴백(미수록 규칙)이 그대로 유지된다.
- **장비 색 구분** — 미등재 장비는 기저 색을 물려받으므로 **다른 모자 둘이 같은 색**으로 보인다.
  등재 표(`ITEM_LOOK`)에 색을 적어 주면 해결되는 데이터 작업이라 신규 장비가 실제로 늘 때 채운다.
- **안경·시계·반지 레이어** — `CharOutfit`에 해당 레이어가 없다(아트 신설이 선행).
- **아티팩트의 인물·지역 색인** — 구 항로도에 있던 부가 뷰는 이번 위키형에서 뺐다. 임무 문서가 주인공이고,
  인물은 인포박스의 「같은 사람의 다른 의뢰」로 이어진다.

## 7. 위험·부작용

- **손에 든 대가 상시 표시된다** — 시드 낚싯대가 기본 착용이라 필드 캐릭터가 늘 대를 들고 다닌다.
  138차 `held` 레이어의 설계 의도대로지만 **눈에 띄는 전역 변화**이므로 육안 확인 대상.
- **멀티 외형** — `MainMenuScene.claimName`이 `characterLook()`을 보낸다(피어에게도 장비가 보인다).
  단 **이름 확정 시 한 번만** 보내므로, 그 뒤 갈아입은 것은 피어 화면에 반영되지 않는다.
- **영문 사전이 829줄 늘었다** — 런타임 사전은 Map 한 번 빌드라 비용은 무시할 수준(부팅 1회).
- 아티팩트는 데이터 467KB를 인라인한다(총 494KB) — 발행 상한 16MB에 한참 못 미친다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/story-quests.md`(S22) · `02-SYSTEMS/character-art.md`(S23) 갱신
- [x] `04-BACKLOG.md` — O1·O4 해소 표기, 신규 잔여 등록
- [x] `AGENTS.md` §9 요약 + 링크
- [x] `IMPLEMENTATION_PLAN.md` 직전 완료 갱신
- [x] 새 함정 → S23 §6(덮어쓰기 규칙) · S22 §6(영문 짝 파일 규칙)
