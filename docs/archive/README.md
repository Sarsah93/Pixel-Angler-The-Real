# docs/archive — 보관 문서

> 2026-09-30 문서 정리로 옮긴 **보관본**이다. 내용은 고치지 않고, **새 기록도 쓰지 않는다**.
> 현행 문서는 `CLAUDE.md` · `.agents/AGENTS.md` · `.agents/IMPLEMENTATION_PLAN.md` · `docs/wiki/`.

## 원장 · 구 계획서

| 파일 | 내용 |
|---|---|
| [AGENTS-LEDGER-001-186.md](AGENTS-LEDGER-001-186.md) | 구 `.agents/AGENTS.md` §9 전문 — 1~80차 원문 + 81~186차 요약 |
| [IMPLEMENTATION_PLAN-to-186.md](IMPLEMENTATION_PLAN-to-186.md) | 구 계획서 원문(차수별 "직전 완료" 누적 · 구 Phase 7~9 계획 · 다음 작업 큐) |

## specs/ — 완료되었거나 대체된 스펙

| 파일 | 상태 |
|---|---|
| [STORY_SPEC_v3.md](specs/STORY_SPEC_v3.md) | 원안 산문 보관 — 정본은 `.agents/STORY_SPEC_v4.md`(139차 승계) |
| [RASTER_UPLIFT_SPEC.md](specs/RASTER_UPLIFT_SPEC.md) | Sentinel-2 래스터 보강 스펙 — Phase 1·2 완료(109차) |
| [RASTER_UPLIFT_AMENDMENT.md](specs/RASTER_UPLIFT_AMENDMENT.md) | 위 스펙 개정안 — **§4 DEM 방침은 아직 유효**(낚시 확립 후 착수) |
| [CHARACTER_SPRITE_PROMPT_SPEC.md](specs/CHARACTER_SPRITE_PROMPT_SPEC.md) | GPT 이미지 프롬프트 스펙(140차) — 캐릭터는 코드 격자(`CharacterArt.ts`)로 확정 |
| [WIKI-ARTIFACT-CONTEXT-157.md](specs/WIKI-ARTIFACT-CONTEXT-157.md) | 157차 전체 위키 아티팩트 전달용 컨텍스트 — 생성기는 `tools/gen_game_wiki_data.mjs` |

## patches/

루트에 남아 있던 1회성 패치 파일 2개(99차 Dev F10 · 에이전트 커밋 금지 규칙). 이미 반영된 변경이다.
