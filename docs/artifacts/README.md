# claude.ai 아티팩트 4개 — 주소 · 원본 · 갱신 규칙

> **규칙(2026-10-17 · 260차 사용자 지시)**: 「이제부터 인게임 내 설계 변경이 이뤄지면 아티팩트 4개;
> 남은 과업 설계, 구현 라이브러리, 채비모딩순서도, wiki 전부 업데이트」.
> 절차는 스킬 `work-log` §2의 7번이고, 이 문서는 주소와 원본을 모아 둔 곳이다.

## 1. 네 아티팩트

| 아티팩트 | 주소 | 원본 | 지금 판 |
|---|---|---|---|
| 남은 과업 설계 | https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 | [`tasks.html`](tasks.html) | Version 48 — 300 C(§07 300 C ✅ 만들기 초상 미리보기) · 47 — 300 B(지역 텃밭 1단계) · 46 — 300 A(도감 실루엣 한 벌) |
| 구현 라이브러리 | https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 | [`library.html`](library.html) | Version 47 — 300차 C(「캐릭터 만들기」 항목에 초상 미리보기 · 호버 확대) · 46 — 300차 B(「지역 빌린 밭」) · 45 — 300차 A(「도감은 발견한 것만」) |
| 채비 모딩 순서도 | https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 | [`rig_flow.html`](rig_flow.html) | Version 42 — 300차 기준 · 채비 문법은 258차(「300차 기준」 줄만) |
| 전체 위키 | https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c | 생성기 `tools/gen_game_wiki_data.mjs --html` | Version 100 — 300(템플릿 「특산」 절 `,` → `+` 고침 — **95~99판은 본문이 안 그려졌다** · 생성기 문법 자가 검사) · 99 — 300 B(시스템 「지역 빌린 밭」 · 텃밭 구획 줄 · 새 그림 없음) · 98 — 300 A(시스템 「도감은 발견한 것만 — 실루엣 한 벌」 · 새 그림 없음) · 97 — 299(2)(「산나물 캐기」 「필드에서」 포기 도트 · 새 그림 없음) · 96 — 299차(시스템 「산나물 캐기」 · 갯것 카드에 산나물 8(작물 초상) · 선물 칭호 글 · 파일 456) · 95 — 298차(시스템 「지역 축제 달력」 · 출조 지역 카드 「축제」 표 · 새 그림 없음 · 파일 456) · 94 — 297차(선물) · 93 — 296차(시스템 「집 앞 우편함」 · 「섬 어종 다섯 · 명산지 꼬리표 · 산지 매대 · 가공장 · 지역 레시피」 · 새 그림 3(옥돔 · 도화새우 · 반건조 옥돔)을 `files`로 · 파일 456) |

- 275차 발행 결과에는 넷 모두 「링크가 있는 사람」 공유로 나온다(남은 과업 설계는 전에 비공개였다). 공유 설정은 페이지의 공유 메뉴에서 사용자가 바꾼다.
- 원본 HTML은 아티팩트 서비스가 발행 때 씌우는 뼈대(doctype · head · body) 없이 `<title>`부터 시작한다.

## 2. 언제 · 무엇을

**인게임 설계가 바뀐 차수**(게임 규칙 · 시스템 · 콘텐츠 · 화면 동작)마다 넷을 모두 갱신한다.
문서 · 도구만 고친 차수는 해당하지 않는다.

| 아티팩트 | 고칠 것 |
|---|---|
| 전체 위키 | 생성기를 다시 돌려 발행(바뀐 그림만 `files`) — 절차는 CLAUDE.md 「타일맵 · 배포」. **지도 탭(264)**: 지형 · 가게 자리 · 인물 자리가 바뀐 지역은 `node tools/capture_wiki_maps.cjs <폴더> <지역>`(dev 서버)으로 다시 찍고 `node tools/dump_wiki_map_data.mjs` → 생성기 → 그 지역 `maps/<지역>/*.webp`만 `files`로. 파일 수(상한 511)는 `tools/wiki_img/used.txt` 줄 수 + 지도 파일 + 1로 센다 |
| 구현 라이브러리 | `DATA` 항목의 상태(`ok · part · todo`) · 차수(`w`) · 설명 · 수치, 머리 숫자(`HEAD`), 바닥 줄, 첫 줄의 「N차 기준 · 날짜」 |
| 남은 과업 설계 | §01 현황 표 · §03 농장 단계 · §04 무대 · §05 수동 목표 수 · §06 사용자 대기 큐 · §07 착수 순서 · 머리 「N차 기준」 |
| 채비 모딩 순서도 | `RigTree.childrenOf`가 바뀌었으면 `nodes` · `edges` · `kits` · 규칙 카드 · 경로 예시 · 「바뀐 것」 상자. 그대로면 첫 문단의 「N차 기준」만 |

### 머리 숫자 실측(구현 라이브러리)

core를 빌드한 뒤 `packages/core/dist/index.js`에서 센다 — 손으로 옮기지 말고 매번 잰다.

```bash
node -e "import('./packages/core/dist/index.js').then((c)=>{const n=(v)=>Array.isArray(v)?v.length:Object.keys(v).length;
console.log('어종',n(c.FISH_DATABASE),'작물',n(c.CROP_DATABASE),'퀘스트',n(c.STORY_QUESTS),'스킬',n(c.SKILL_DATABASE),'예산',c.SKILL_TREE_TOTAL_PT)})"
```

- 게임 씬 = `packages/client-pc/src/game.ts`의 `scene: [...]` 수.
- 창 · 대화상자 = `grep -rhoE "class \w+(Panel|Dialog)\b" packages/client-pc/src | sort -u | wc -l`.
- 아이템 = `tools/wiki_items.json` 항목 수(위키 생성 때 덤프).
- 모듈 이름은 `grep -rlw <이름> packages tools`로 실재를 확인한다(260차에 지어낸 이름 1건을 이렇게 잡았다).

## 3. 발행 절차

1. 원본 `docs/artifacts/<이름>.html`을 고친다.
2. 점검 — `node tools/check_artifact_page.cjs docs/artifacts/<이름>.html <출력 접두사> ['#flow']`
   (본문 가로 넘침 · SVG 글자 넘침 · 상자 겹침 · pageerror 0 → `PASS`). 스크린샷(밝음 · 어두움 · 폰)을 눈으로 본다.
2-b. **위키는 생성한 HTML을 헤드리스로 열어 본다**(300차 — 298차에 템플릿 스크립트 한 글자가 틀려 95~99판이 본문을 못 그렸다. `check_artifact_page.cjs`는 위키를 안 돌린다).
   생성기(`gen_game_wiki_data.mjs --html`)가 템플릿 스크립트 문법을 검사해 틀리면 종료하지만, 발행 전에 Playwright로 `file://…/index.html`을 열어
   **pageerror 0 · `document.body.innerText.length`가 수천 자 이상 · 탭 하나를 눌러 카드가 뜨는지**까지 본다(scratchpad `wikicheck2.cjs` 패턴).
3. Artifact 도구 `publish` — `file_path` = 원본, `url` = 위 표의 주소. 다른 대화에서 처음 발행하면 먼저 `read`로 읽는다.
   ⚠ 위키(3MB)는 `read`에 `path: 'index.html'`을 주면 파일로만 떨어지고 **발행 자격으로 치지 않는다**(261차 실측) — `path` 없이 읽어야 한다.
4. 워크로그 §8에 네 주소와 새 판(Version)을 적고, 이 표의 「지금 판」을 고친다.
