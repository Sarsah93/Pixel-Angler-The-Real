# 260차 — 아티팩트 3개 현행화 · 아티팩트 4개 갱신 규칙 · 원본 `docs/artifacts/`

| | |
|---|---|
| **날짜** | 2026-10-17 |
| **시스템** | `문서` `위키` `채비` `도구` |
| **트리거** | 사용자 지시 |
| **커밋** | 작업 브랜치 `claude/project-review-task-planning-yopbck` |
| **빌드·타입체크** | 코드 변경 없음 — 259차 기준 3/3 · 0 오류 그대로 |

---

## 1. 배경 — 왜 했나

사용자(259차 보고 뒤):

> 「남은 과업 설계, 구현 라이브러리, 채비모딩순서도 까지도 업데이트도 해줘.
> (이제부터 인게임 내 설계 변경이 이뤄지면 아티팩트 4개; 남은 과업 설계, 구현 라이브러리, 채비모딩순서도, wiki 전부 업데이트) 규칙으로 정해놔.」

요청은 둘이다 — ① 낡은 세 아티팩트를 지금 게임에 맞추기 ② 앞으로 인게임 설계가 바뀌면 넷을 함께 고치는 규칙.

## 2. 원인 — 왜 낡았나

규칙이 위키에만 있었다. 위키는 생성기(`tools/gen_game_wiki_data.mjs --html`)와 재발행이 차수 절차에 들어 있었지만,
나머지 셋은 만든 차수 뒤로 어떤 절차에도 없었다. 읽어 보니 이만큼 어긋나 있었다.

| 아티팩트 | 마지막 갱신 | 기준 | 어긋난 예 |
|---|---|---|---|
| 남은 과업 설계 | 2026-08-14 | 98차 | 「해루질 · 통발 = 배선 미완」 「불요리 미착수」 「농사 스키마만」 — 셋 다 섰다(121 · 154 · 235) |
| 구현 라이브러리 | 2026-09-17 | 146차 | 「요리(불요리) 예정」 「농사 예정」 「사운드 예정」 「경매 예정」 「기한 벌칙 예정」 · 씬 20(지금 11) · 퀘스트 186(지금 191) · 스킬 92(지금 95) |
| 채비 모딩 순서도 | 2026-10-02 | 192차 | 목줄 중간이 없고 좁쌀봉돌이 「목줄 끝 → 바늘」 갈래 안 · 카드 채비 = 단수 고르기(193부터 물건이 정함) · 미끼 1 필수(193부터 하나 이상) |
| 위키 | 2026-10-16 | 259차 | 현행(Version 57) |

곁가지로 하나 더 찾았다. 위키 이야기 페이지 §5의 「추적기 없는 목표 6종 승격 대기 — `cook`(불요리) …」는 낡은 표기였다.
core dist 실측으로 요리 목표는 1개이고 `manual`이 아니다. 남은 수동 목표는 대화 85 · 장면 custom 27을 빼면
`boatTrip` 9 · `furnish` 3 · `mine` 2 · `survive` 2 · `holdPosition` 2 · `deliverFree` 1이다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | 아티팩트 남은 과업 설계 `9o9DgLfRi7q1USjMDoBWh4` | Version 2 — 259차 기준 다시 쓰기. 7절(현황 15행 · 3축 · 농장 E1~E5 · 무대 · 수동 목표 · 사용자 대기 큐 10행 · 착수 순서 0~8) |
| 수정 | 아티팩트 구현 라이브러리 `1UqPfahu3yZZ7ByDbZdge5` | Version 2 — 12갈래 157항목(운영 131 · 부분 11 · 예정 15) · 새 갈래 「텃밭」 「집 · 생활」 · 항목마다 들어간 차수 · 머리 숫자 8개 실측 |
| 수정 | 아티팩트 채비 모딩 순서도 `GGaW2dw9JsrxhDqrhDhLK1` | Version 2 — 258 문법(목줄 → 목줄 중간 → 목줄 끝 네 갈래 · 끝 도래와 바늘은 형제) · 카드 채비 물건 · 미끼 최소 하나 · 규칙 카드 5 · 경로 예시 9 · 「258차에 바뀐 것」 상자 · 새 칸 점선 테 |
| 신설 | [`docs/artifacts/tasks.html`](../../artifacts/tasks.html) · [`library.html`](../../artifacts/library.html) · [`rig_flow.html`](../../artifacts/rig_flow.html) | 세 아티팩트 원본(발행본과 같다 — 세션 scratchpad는 사라지므로 저장소에 둔다) |
| 신설 | [`docs/artifacts/README.md`](../../artifacts/README.md) | 네 주소 · 원본 · 지금 판 · 차수마다 고칠 것 · 머리 숫자 재는 명령 · 발행 절차 |
| 신설 | [`tools/check_artifact_page.cjs`](../../../tools/check_artifact_page.cjs) | 발행 전 점검 — 본문 가로 넘침 · SVG 글자 넘침 · 상자 겹침 · 갈래 이름 덮임 · pageerror · 스크린샷(밝음 · 어두움 · 폰 · SVG 전체) |
| 수정 | [`.agents/AGENTS.md`](../../../.agents/AGENTS.md) | §4 작업 기록 정책에 규칙 · §8-18 · §9 260 요약(257 내림) |
| 수정 | [`CLAUDE.md`](../../../CLAUDE.md) | 절대 규칙 15 · 아티팩트 4개 주소 · `docs/artifacts/` · 260 요약(257 내림) |
| 수정 | [`.claude/skills/work-log/SKILL.md`](../../../.claude/skills/work-log/SKILL.md) | §1 표에 아티팩트 4개 · §2 절차 7번 |
| 수정 | [`02-SYSTEMS/story-quests.md`](../02-SYSTEMS/story-quests.md) | §5 수동 목표 줄 정정(요리 목표는 이미 자동 · 남은 수동 목표 수) |
| 수정 | [`docs/wiki/README.md`](../README.md) · [`03-WORKLOG/README.md`](README.md) · [`04-BACKLOG.md`](../04-BACKLOG.md) · [`IMPLEMENTATION_PLAN.md`](../../../.agents/IMPLEMENTATION_PLAN.md) | 문서 역할 표 · 색인 · 잔여 CH · 요약 |

규칙의 문구(AGENTS §4 · §8-18 · CLAUDE 15 · 스킬 §2-7 — 같은 내용):

- **대상** = 그 차수에 게임 규칙 · 시스템 · 콘텐츠 · 화면 동작이 바뀌었을 때. 문서 · 도구만 고친 차수는 제외.
- **넷 모두** 같은 URL에 다시 발행한다. 채비 문법(`RigTree.childrenOf`)이 그대로면 순서도는 「N차 기준」 줄만 올린다.
- 원본은 `docs/artifacts/*.html`을 고쳐 발행하고, 워크로그 §8에 네 주소와 판(Version)을 적는다.

## 4. 구조상 위치 — 어느 계층의 무엇인가

`기록 체계 → 바깥 공유 뷰 → 아티팩트 4개`. 문서 층만 건드렸다 — 게임의 계약 · 데이터 · 판정 · 렌더는 그대로다.
work-log 4층(구조 / 시스템 / 워크로그 / 백로그) 밖에 있던 사용자용 페이지 넷을 차수 절차에 묶은 것이다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 세 페이지 레이아웃 | `tools/check_artifact_page.cjs` — 밝음 · 어두움 1280px · 폰 400px | 본문 넘침 0 · pageerror 0(세 페이지 × 세 화면) · 스크린샷 육안 |
| 채비 SVG | 같은 도구 `'#flow'` | 상자 안 글자 넘침 0 · 상자 겹침 0 · 갈래 이름 덮임 0 · 크기 3,528 × 884 |
| 채비 문법 | core `RigTree.ts` `childrenOf` · `RIG_SLOTS` · `missingParts` · `baitBiteBonus` 대조 | 칸 20 · 선 25 · 세트 띠 6이 `childrenOf` 갈래와 1:1 · 끌어당기기 10/10/30/50 · 끊기 50/50(`GearDurability`) |
| 라이브러리 수치(core) | `packages/core/dist/index.js` 실측 | 어종 56(오라클 55) · 작물 86 · 퀘스트 191(메인 68 · 서브 123) · 아크 24 · 대화 36 · 결말 6 · 스킬 95(예산 216 = 200 + 15 + 1) · 면허 21 · 해양생물 21 · 통발 8 · 도면 40 · 조리 프로필 58 · 관리 표 86 · 병해충 16 |
| 라이브러리 수치(client) | 소스 · 데이터 셈 | 씬 11 · 창 · 대화상자 46 · 도움말 15갈래 101토픽 · 실캡처 49 · 손그림 아이콘 386 · 아이템 854 · 건물 546 · POI 560 · 속초 1179 × 642 |
| 모듈 이름 | `grep -rlw <이름> packages tools` | 인용 40여 개 중 지어낸 이름 1개(`CinematicRunner` → `RegionFieldScene`) · 뜻을 잘못 짚은 1개(`ShopStock` = 하루 재고 규칙 → 되팔기 출처는 `ShopStore` · `ShopPanel`) |
| 발행 | Artifact `publish`(`url`) | 세 URL 모두 Version 2 |

재현: `node tools/check_artifact_page.cjs docs/artifacts/rig_flow.html <접두사> '#flow'` → `PASS`.

## 6. 잔여 — 이번에 안 한 것

- **남은 과업 설계 페이지는 비공개**다(나머지 셋은 「링크가 있는 사람」). 공유는 페이지 공유 메뉴에서 사용자가 연다.
- **위키(넷째)는 259차 Version 57 그대로** — 이번 차수는 인게임 설계 변경이 없어 규칙 대상이 아니다.
- **머리 숫자 · 상태는 손으로 옮긴다** — `docs/artifacts/README.md` §2에 재는 명령을 두었다. 다시 어긋나면 core dist에서 뽑아
  HTML에 넣는 작은 생성기를 만든다(백로그 CH ②).
- **위키 대시보드**(`docs/wiki/README.md` §2 · §3)의 「지금 위치」는 149차(2026-09-17) 서술에 머물러 있다 — 이번 범위 밖(요청 시).
- 라이브러리의 상태 판정(운영 · 부분 · 예정)은 시스템 페이지 §4 · §5를 읽고 내린 것이라 사용자 시각과 다를 수 있다.

## 7. 위험·부작용

게임 코드 변경 없음. 위험은 규칙 운용 쪽이다 — 다음 인게임 설계 차수에 넷 중 하나를 빠뜨리면 다시 어긋난다.
그래서 같은 규칙을 AGENTS §4 · §8-18 · CLAUDE 15 · 스킬 `work-log` §2-7 네 곳에 걸었다.
`docs/artifacts/` 원본과 발행본이 갈라질 수 있다 — 발행은 언제나 원본 파일로 하고, 다른 대화에서 처음 발행하면 먼저 `read`로 읽는다.

## 8. 후속 반영

- [x] 시스템 페이지 — `story-quests.md` §5 정정
- [x] `04-BACKLOG.md` — CH(260 잔여)
- [x] `AGENTS.md` §4 · §8-18 · §9 요약
- [x] `IMPLEMENTATION_PLAN.md` — 최종 업데이트 · §2-3 · §3
- [x] `CLAUDE.md` — 절대 규칙 15 · 주소 · 260 요약
- [x] 스킬 `work-log` §1 · §2-7
- [x] `03-WORKLOG/README.md` 색인 · `docs/wiki/README.md` 문서 역할 표

아티팩트 4개(이 차수 뒤):

| 아티팩트 | 주소 | 판 |
|---|---|---|
| 남은 과업 설계 | https://claude.ai/artifact/9o9DgLfRi7q1USjMDoBWh4 | Version 2(259차 기준) |
| 구현 라이브러리 | https://claude.ai/artifact/1UqPfahu3yZZ7ByDbZdge5 | Version 2(259차 기준) |
| 채비 모딩 순서도 | https://claude.ai/artifact/GGaW2dw9JsrxhDqrhDhLK1 | Version 2(258차 문법) |
| 위키 | https://claude.ai/artifact/LjRbKC298biFPzgZdfXB3c | Version 57(259차 — 변경 없음) |
