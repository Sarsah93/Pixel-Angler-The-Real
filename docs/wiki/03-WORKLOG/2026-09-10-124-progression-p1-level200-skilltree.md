# 124차 — 성장·생존 P1: 레벨 200 곡선 + 활동 XP + 스킬 트리 83노드(Σ=200) + 제작 설계 정정

| | |
|---|---|
| **날짜** | 2026-09-10 |
| **시스템** | `진행` `데이터` `UI` `튜닝` |
| **트리거** | 사용자 지시 — 스펙 선행 구현 착수 + 제작 설계 정정 2건 |
| **커밋** | 미커밋 (123차분과 함께 사용자 직접 커밋 예정) |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

123차에서 `.agents/PROGRESSION_SURVIVAL_SPEC.md` v2를 확정했고, 사용자가 착수를 지시했다.

사용자 지시(원문 요지):

- "제작대는 U가 아니라 [F]"라고 했던 123차 결정 ⚖#8은 **오독** — "F가 상호작용 키로 고정이고
  내가 말한 제작대는 **핸드크래프팅 보드(조건 없이)**를 말하는 거고, **U 창에서 구현**되어야 함.
  만약 제작 탭이 없다면 신설할 것. 라이브러리 구조처럼 인벤토리에 보유하고 있다면 제작 활성화
  (양 조절도 가능). **고급 제작**은 설치된 고급 제작대(조건)에서 상호작용 키를 눌러 팝업창을 띄우는 형태"
- "우선 먼저 선행적으로 진행해주고(= 스펙 P1~), 그 이후에 **통발 → 불요리 → 농장**.
  농장은 같이 구현하는 게 바람직하면 농장 관련은 뒤로 미루는 것이 좋아 보임"

이번 차수 = 스펙 **P1**(레벨 200 곡선 + 어획/활동 XP + 스킬 트리 39노드 증설 Σ=200) + 스펙 정정.

## 2. 원인 — *(버그 아님 — 신규 구현)*

기존 레벨 시스템의 한계(구 코드 실측):

- `addCaughtFish`의 XP가 어종 하드코딩 소맵 + 임계 `level × 100` — 희귀도·체장 무반영, 상한 없음.
- 스킬 트리 44노드 Σ=116pt ↔ 레벨당 1pt 구조에서 "만렙 = 전 스킬 마스터" 등식이 성립하지 않았다.
- 활동(손질·회뜨기·채집)은 손질 스킬 XP만 올리고 **플레이어 레벨 XP는 0**이었다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `.agents/PROGRESSION_SURVIVAL_SPEC.md` | ⚖#8 재작성(2단 제작 구조) · §2-0-6 · §2-5 전면 재작성 · §11 P7 + 착수 순서 확정 블록 |
| 신설 | `packages/core/src/types/Progression.ts` | `MAX_LEVEL 200` · `xpToNext(n) = round(25·n^1.5)+75` · `cumulativeXp` · `catchXp`(희귀도 기본 × 체장/평균 0.5~3.0 클램프) · `activityXp`(5종) · `GRADE_XP_MULT`(하0.6/중1.0/상1.5/특2.5) |
| 수정 | `packages/core/src/config/tuning.ts` | `TUNING.xp` 섹션 신설(희귀도 5단 기본 XP·체장 클램프·첫 발견 ×5·활동 기본 5종·준법 방생 ×0.5) |
| 수정 | `packages/core/src/types/Skills.ts` | `SkillCategoryId` += `'crafting'` · `SkillEffectKey` += 39종 |
| 수정 | `packages/core/src/db-schema/SkillDatabase.ts` | 39노드 증설(전부 `wired:false` 예정 배지) + 제작 카테고리(잠금·열람만) + `SKILL_TREE_TOTAL_PT = 200` + 무결성 검사(Σ·고아 requires·티어 0~3·티어당 ≤6 — console.warn) |
| 수정 | `packages/core/src/index.ts` | Progression 심볼 + `SKILL_TREE_TOTAL_PT` export |
| 수정 | `client-pc/src/store/GameState.ts` | `grantXp`(while 오버플로·만렙 캡·잔여 XP 저장 유지) · `addActivityXp` · `addLawfulReleaseXp` · `addCaughtFish`가 `catchXp` + 첫 발견 ×5(`DiscoveryStore.record` 반환값) 소비 |
| 수정 | `client-pc/src/ui/SkillTreePanel.ts` | `nodePos` 행 간격 동적 압축(티어 6노드 시 dy 92→≈78 — 상세 스트립 침범 방지) |
| 수정 | `client-pc/src/ui/ButcheryPanel.ts` · `SashimiPanel.ts` | 완료 시 `addActivityXp('butcher'/'sashimi', GRADE_XP_MULT[grade])` |
| 수정 | `client-pc/src/scenes/field/ForageSystem.ts` | 수확 시 `addActivityXp('forage')` |
| 수정 | `client-pc/src/scenes/FirstPersonFishingScene.ts` | 금지체장·금어기 자동 방생 시 `addLawfulReleaseXp`(무음 — 방생 문구는 EN 규칙 번역 보존 위해 무변경) |
| 수정 | `client-pc/src/data/HelpContent.ts` · `i18n/en_help.ts` | `p-craft` 스텁을 2단 제작 구조로 재작성 + 영문 사전 정합 |

### 스킬 트리 증설 내역 (44 → 83노드, Σ 116 → 200pt)

| 카테고리 | 노드 | 포인트 | 증설 |
|---|---|---|---|
| 낚시 | 19 | 50 | +7노드 +18pt (롱캐스트·정투·바람 읽기·스풀 컨트롤·지깅/에깅 숙련·원투 숙련·원줄 절약 등) |
| 채집·통발 | 10 | 24 | +4노드 +9pt |
| 경제 | 10 | 26 | +3노드 +6pt |
| 운전·이동 | 10 | 22 | +4노드 +7pt |
| 생활 | 13 | 34 | +6노드 +14pt (허기/갈증 절감·수면 회복·면역·응급처치·위생 — P2 생존 지표 예약) |
| 농사 | 9 | 20 | +3노드 +6pt (잠금 유지) |
| **제작(신설)** | 12 | 24 | 전부 신규 — 카테고리 잠금(열람만), P7 제작 탭 구현 시 활성화 |

기존 44노드의 id·비용·requires는 **전부 보존**(세이브 호환 — 배운 스킬 유실 없음).

## 4. 구조상 위치

`S21 진행(성장·생존) → P1 레벨·XP·스킬 확장`.

- **계약(타입)**: `Progression.ts` 신설 · `SkillEffectKey`/`SkillCategoryId` 위드닝(추가만 — 기존 값 불변).
- **데이터**: SkillDatabase 39노드 · TUNING.xp.
- **판정**: `grantXp` 곡선/캡 · `catchXp` 산식.
- **렌더**: SkillTreePanel 행 간격만(레이아웃층 — 판정 무관).

배선 4곳(손질·회·채집·준법 방생)은 기존 완료 지점에 1줄 추가라 파급 없음.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 곡선 마일스톤 10개 + Σ=200 등식 + 트리 무결성 + XP 스팟 | core 수치 스크립트(`scratchpad/verify_p1_core.mjs`, dist 소비) | **42/42 PASS** (Lv200 누적 5,636,469 · 83노드 200pt · 고아 0 · 티어당 ≤6 · 전 노드 nameEn/descEn) |
| XP 곡선 실동작 | 실렌더(Playwright) — `__GS.grantXp` | 99 XP 유지 → +1로 Lv2 → +3352로 Lv10(잔여 0) → 만렙 200 캡 무시. **9/9 PASS** |
| 스킬 트리 렌더 ko/en | 실렌더 스크린샷 4장 육안 | 낚시 19노드 6행 티어가 상세 스트립 미침범 · 제작 카테고리 7행째 잠금 표시 · **en 재렌더 전 노드 영어**(Long Cast·Rig Salvage·Planned·Locked — view only) · pageerror 0 |
| 빌드 | `pnpm run build` + client typecheck | 3/3 · 0 오류 (1차 빌드에서 `this._player` nullable TS2531 10건 → `this.player` getter 경유로 수정) |

재현: `node scratchpad/verify_p1_core.mjs` + `node scratchpad/verify_p1_render.mjs`(dev 서버 필요).

## 6. 잔여 — 이번에 안 한 것

- **P2~P9 미착수** — 다음 차수부터 스펙 §11 순서대로: P2 생존 4지표(core `Vitals.ts`) → P3 상태 패널 →
  P4 기절/사망 → P5/P6 스킬 실배선(신설 39노드는 전부 `wired:false` — 효과 소비처가 생겨야 배선) →
  P7 제작(U '제작' 탭 + 고급 제작대 [F] 팝업) → P8 퀘스트 → P9 도움말 ready 전환.
- **요리(cook) 활동 XP 미배선** — `activityXp('cook')` 산식은 있으나 CookScene 실조리가 미구현(불요리 대과제).
- 스펙 이후 순서(사용자 확정): **통발 심화 → 불요리 → 농장**. 농사 스킬 실배선·타입은 농장 단계로 이연.

## 7. 위험·부작용

- **구세이브 XP**: 저장 구조는 "레벨 내 잔여 XP" 그대로라 마이그레이션 불요. 임계만 교체 —
  구 `level×100` 대비 새 곡선은 **Lv14까지 더 낮고 Lv15부터 더 높다**(Lv5: 500→354 / Lv15: 1,500→1,527 /
  Lv30: 3,000→4,183). 잔여 XP가 새 임계를 넘으면 로드 후 첫 지급에서 while이 정리. 데이터 손실 없음.
- **첫 발견 ×5**: `DiscoveryStore.record` 반환값(신규 여부)을 소비 — 도감 리셋 시 XP 재수령 가능(dev 전용 경로라 허용).
- **레벨업 알림 없음**: `grantXp`는 console.log + markDirty만 — 토스트/연출은 P3(상태 패널)에서. 회귀 아님(구 코드도 무알림).
- SkillTreePanel 행 압축은 티어 7노드부터 겹침(dy < NODE_H) — DB 무결성 검사가 ≤6을 강제(초과 시 console.warn).

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/progression.md` §4·§5 갱신
- [x] `04-BACKLOG.md` H 항목 갱신(P1 완료 + 제작 설계 정정 반영)
- [x] `AGENTS.md` §9 요약 + 링크
- [x] `IMPLEMENTATION_PLAN.md` · `CLAUDE.md` 이어받기 갱신
- [x] 새 함정 → `progression.md` §6 (티어당 ≤6 배치 제약)
