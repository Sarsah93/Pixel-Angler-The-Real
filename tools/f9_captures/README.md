# F9 [확정] 기록 (315차)

손질 창 dev 가이드 편집기(F9)의 **[확정] · [군 확정]** 단추가 dev 서버(`vite.config.ts` `devButcheryGuidePlugin`)로 보낸 좌표가 여기 쌓인다.

| 파일 | 무엇 |
|---|---|
| `captures.json` | 정본 — 어종 id 또는 `@어종군`(`@amberjack` · `@bream` · `@halibut`) → 스테이지 id → 좌표 |
| `log.jsonl` | 확정할 때마다 한 줄(때 · 어종 · 단계 이름 · 좌표) — 에이전트가 이 줄을 보고 반영 · 검증한다 |

- 서버가 저장하자마자 `node tools/apply_f9_captures.cjs`로 core 표(`packages/core/src/db-schema/ButcheryGuideOverrides.ts`)를 다시 굽는다.
- 좌표만 바꾼다 — 판정 옵션(strong · tolerance …)은 core 스테이지가 그대로 가진다(옛 [복사] 스니펫의 opts 누락 함정이 없다).
- dev 서버는 이 표를 지켜보지 않는다(굽는 순간 화면이 새로 고쳐져 손질이 끊긴다). 같은 판에서 다시 연 손질 창은 서버 정본(GET)을 받아 쓴다.
- 사용자 PC에서 dev 서버를 돌렸다면 이 폴더와 core 표가 그 PC 저장소에 생긴다 — 커밋 · 푸시하면 에이전트가 읽는다.
