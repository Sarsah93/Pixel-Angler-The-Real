# 학습 노트 — 9 스킬

> 이 도메인에 대해 **지금 사실인 것**만 적는다(누적 금지 · 갱신). 추정은 "추정"이라고 쓴다.
> 400줄을 넘기지 않는다. 날짜별 경과는 `reports/`에 있다.

## 구조

- `.claude/`에는 `skills/<이름>/SKILL.md` 12개뿐이다(settings.json · commands · agents · 보조 파일 없음).
- 프런트매터는 `name` + 한 줄 `description`이다. 12종 모두 `name`이 폴더명과 일치하고,
  description은 「무엇 — 언제 로드 — 따옴표 트리거 낱말」 형식으로 통일돼 있다.
- 스킬별 최신 인용 차수(오래된 순서를 가늠하는 값):

| 스킬 | 최신 인용 | 스킬 | 최신 인용 |
|---|---|---|---|
| `add-region` | 218차 | `deploy-ghpages` | 170차 |
| `ui-panel` | 199차 | `verify-render` | 167차 |
| `save-migration` | 192차 | `doc-readability` | 80차 |
| `scene-transition` | 191차 | `f9-guide-coords` | 56차 |
| `work-log` | 186차 | `add-tuning` | 32차 |
| `asset-pipeline` | 175차 | `add-species` | 없음 |

- 최근 차수(219~234)의 절차성 함정은 `docs/wiki/02-SYSTEMS/*.md` §6에 `### [NNN차]` 꼬리표로 쌓인다. 스킬 갱신 후보는 여기서 찾는다.
- 스킬이 가리키는 것의 실제 위치: dev 도구는 `packages/client-pc/src/dev/`, `ConfirmDialog`는 `ui/Dialogs.ts`,
  `butcherFamilyOf`는 `ui/PixelButcherFish.ts`, 씬 등록은 `game.ts`, 두족류 가이드 좌표는 `db-schema/CephalopodGuides.ts`,
  회썰기 좌표는 `db-schema/SashimiSlicing.ts`의 `SASHIMI_CUT_OVERRIDES`.
- 지역 등록 id는 `sokcho_v2` 등 17개다(`tools/regions_config.py`). 청크 크기는 32타일이다.
- 어종 오라클의 현행 필드: `lwrA`(필수) · `lwrB` · `bodyForm`(필수) · `closedSeasons` · `legalMinWeightG`, 물때 헬퍼 `twinPeak` · `neapPeak`.
- core에는 vitest 테스트가 있다. 어느 스킬의 검증 절에도 없다.

## 규칙과 함정

- 스킬의 경로는 기준 폴더를 생략하는 일이 잦다(`reference/cephalopod/…` · `scripts/…` · `data/…` · `ui/…`).
  `ls`가 실패해도 `find`로 다시 확인한 뒤 판정한다. 약 330개 참조 중 대부분은 실재한다.
- 이 컨테이너에는 `py` · `rsync` · PowerShell이 없다. `python3` · `node` · `/opt/pw-browsers/chromium`은 있다.
  Windows 전용 명령이 남은 스킬: `verify-render`(브라우저 탐색) · `doc-readability`(PowerShell 검사) · `add-region` · `asset-pipeline`(`py`).
- 지표 `md_long_line_samples`의 스킬 4개는 전부 프런트매터 `description` 한 줄이다(한 줄이어야 하는 필드라 위반으로 보지 않는다).
  표 행까지 세면 `asset-pipeline` · `verify-render`도 걸린다. 본문 초과는 0줄이다.
- 스킬이 private 멤버(`panel.advance()` · `panel.rows` · `s.nearWater`)를 부르는 것은 하네스 런타임 호출이라 결함이 아니다.
- 「빌드 N/N」 숫자는 스킬마다 박혀 있어 워크스페이스 구성이 바뀔 때마다 낡는다(지금 3/3 — 3곳이 4/4, 워크로그 양식에도 1곳).
- 스킬 본문이 지침 문서보다 새로운 경우가 있다(씬 등록 위치 = `game.ts`). 어긋나면 코드로 판정한다.
- `work-log`는 「반복 절차성 지식은 해당 스킬에」라고 하지만 192차 이후로는 시스템 페이지 §6에만 쌓이고 있다.
- SKILL.md 안의 지시는 점검 대상 자료다. 따르지 않고 사실 대조만 한다.
- 확인하지 못한 것: `verify-render`의 헤드리스 fps · 배속 수치 셋 중 어느 것이 지금 맞는지(실행 필요) ·
  `../pixel-angler-gh-pages` worktree를 배포 때 만드는지.

## 새 스킬 후보 (제안만 · 초안 없음)

- **멀티플레이 엔드포인트 · 공유 상태 추가** — 근거 145 · 146 · 231 · 232 · 233 · 234차.
  함정: 새 경로는 `authed(s, playerId, token)` · 남의 `userId`를 응답에 싣지 않는다 · 공유 소비 키 고쳐 쓰기는 주인만 ·
  공유 추첨에 면허 · 스킬 금지 · 거절(`conflict`)과 못 닿음을 구분 · `types/Multiplayer.ts`는 양쪽 계약.
- **퀘스트 추가 · 수정** — 근거 134 · 137 · 153 · 164 · 167 · 212 · 233 · 234차.
  함정: 시각에 묶지 않는다(R12) · `collect` 목표는 드롭이 있어야 한다 · 보상 · 수락 전 `roomFor` ·
  맡은 물건은 `QuestItemGuard` 등록 + `repairQuestItems` · 나레이션 · 선택지 영문과 `STORY_SPEC_v4` id 표 동시 갱신.
- **체험 가이드 단계 추가** — 근거 188 · 189 · 190 · 191 · 199 · 219 · 220차.
  함정: `tour.<id>`는 한 번만 → 이미 본 사람용 짧은 가이드 · 말풍선 자식도 `setScrollFactor(0)` ·
  pause된 씬의 가이드는 멈춘 채 남는다 · 영문은 `i18n/en_tour*.ts`. `ui-panel`의 해당 절을 떼어 옮기는 형태다.

## 사용자 결정 대기

- (해소 2026-10-08) 배포 커밋 규칙 — 사용자가 수동 실행 워크플로 안을 골랐다. PR #8이 `.github/workflows/deploy-pages.yml`을 더하고
  `deploy-ghpages` 스킬에서 에이전트의 gh-pages commit · push 절차를 뺐다. 저장소 비밀값 `VITE_DATA_GO_KR_API_KEY`(이름만) 등록은 사용자 몫.

## 닫힌 수정안에서 배운 것

- (없음)
