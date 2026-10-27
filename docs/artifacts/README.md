# claude.ai 아티팩트 4개 — 주소 · 원본 · 갱신 규칙

> **규칙(2026-10-17 · 260차 사용자 지시)**: 「이제부터 인게임 내 설계 변경이 이뤄지면 아티팩트 4개;
> 남은 과업 설계, 구현 라이브러리, 채비모딩순서도, wiki 전부 업데이트」.
> 절차는 스킬 `work-log` §2의 7번이고, 이 문서는 주소와 원본을 모아 둔 곳이다.

## 1. 네 아티팩트

| 아티팩트 | 주소 | 원본 | 지금 판 |
|---|---|---|---|
| 남은 과업 설계 | https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 | [`tasks.html`](tasks.html) | Version 26 — 283차 기준 · 92차 배포(「기준」 줄 · 머리 · §06 「283차 실플레이 확인」 줄) |
| 구현 라이브러리 | https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 | [`library.html`](library.html) | Version 27 — 283차 기준(조행록(일지) 줄 — 진행 레일 · 그림 얼굴 줄 — 빈 의뢰인 `\|\|`). 26 = 282 장비 · 루어 개체 |
| 채비 모딩 순서도 | https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 | [`rig_flow.html`](rig_flow.html) | Version 25 — 283차 기준 · 채비 문법은 258차(「283차 기준」 줄) |
| 전체 위키 | https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c | 생성기 `tools/gen_game_wiki_data.mjs --html` | Version 79 — 283차(시스템 탭 「일지 초상 · 목표 진행 레일」). 78 = 282(2) 채소 그림 복구 |

- 275차 발행 결과에는 넷 모두 「링크가 있는 사람」 공유로 나온다(남은 과업 설계는 전에 비공개였다). 공유 설정은 페이지의 공유 메뉴에서 사용자가 바꾼다.
- 원본 HTML은 아티팩트 서비스가 발행 때 씌우는 뼈대(doctype · head · body) 없이 `<title>`부터 시작한다.

## 2. 언제 · 무엇을

**인게임 설계가 바뀐 차수**(게임 규칙 · 시스템 · 콘텐츠 · 화면 동작)마다 넷을 모두 갱신한다.
문서 · 도구만 고친 차수는 해당하지 않는다.

| 아티팩트 | 고칠 것 |
|---|---|
| 전체 위키 | https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c | 생성기 `tools/gen_game_wiki_data.mjs --html` | Version 79 — 283차(시스템 탭 「일지 초상 · 목표 진행 레일」). 78 = 282(2) 채소 그림 복구 |
| 구현 라이브러리 | https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 | [`library.html`](library.html) | Version 27 — 283차 기준(조행록(일지) 줄 — 진행 레일 · 그림 얼굴 줄 — 빈 의뢰인 `\|\|`). 26 = 282 장비 · 루어 개체 |
| 남은 과업 설계 | https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 | [`tasks.html`](tasks.html) | Version 26 — 283차 기준 · 92차 배포(「기준」 줄 · 머리 · §06 「283차 실플레이 확인」 줄) |
| 채비 모딩 순서도 | https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 | [`rig_flow.html`](rig_flow.html) | Version 25 — 283차 기준 · 채비 문법은 258차(「283차 기준」 줄) |

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
3. Artifact 도구 `publish` — `file_path` = 원본, `url` = 위 표의 주소. 다른 대화에서 처음 발행하면 먼저 `read`로 읽는다.
   ⚠ 위키(3MB)는 `read`에 `path: 'index.html'`을 주면 파일로만 떨어지고 **발행 자격으로 치지 않는다**(261차 실측) — `path` 없이 읽어야 한다.
4. 워크로그 §8에 네 주소와 새 판(Version)을 적고, 이 표의 「지금 판」을 고친다.
