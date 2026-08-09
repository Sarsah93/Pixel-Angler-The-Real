# Pixel Angler The Real — 프로젝트 위키

> **이 위키의 목적**: 날짜·차수 순으로만 쌓이던 작업 기록을 **구조(시스템) 기준**으로 다시 배열해,
> "지금 무엇이 어디까지 되어 있고 / 무엇이 남았고 / 어디가 위험한가"를 한 화면에서 판별한다.
> 최종 업데이트: 2026-08-09 (87차 반영)

---

## 0. 문서 역할 분담 (중복 기록 금지)

| 문서 | 역할 | 성격 |
|---|---|---|
| `CLAUDE.md` | 세션 진입점 — 필수 선행 문서·스킬 목록·현재 위치 요약 | 짧게 유지 |
| `.agents/AGENTS.md` | **불변 규칙**(§1~§8) + **차수 원장**(§9, append-only 원문 기록) | 규칙은 여기서만 바뀐다 |
| `.agents/IMPLEMENTATION_PLAN.md` | 로드맵(Phase) · 다음 착수 · 완료 목록 | 계획 축 |
| **`docs/wiki/`** (이 문서) | **구조화 뷰** — 시스템별 현황·세부과제·잔여·위험 | 판단·탐색 축 |
| `.claude/skills/*/SKILL.md` | 반복 작업 절차·함정 노하우 | 방법 축 |

**작업 후 기록 규칙** → [`03-WORKLOG/README.md`](03-WORKLOG/README.md) · 스킬 `work-log`
새 작업의 **본문 기록은 워크로그 1건**에 쓰고, AGENTS/PLAN에는 **요약 3~5줄 + 링크**만 남긴다.

---

## 1. 위키 구성 (4층)

| 층 | 문서 | 답하는 질문 |
|---|---|---|
| **1. 구조** | [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md) | 게임이 어떤 화면·모듈로 이루어져 있나? 데이터는 어디로 흐르나? |
| **2. 시스템별 과제** | [`02-SYSTEMS/`](02-SYSTEMS/README.md) | 이 시스템은 어디까지 됐고 세부과제/잔여는 무엇인가? |
| **3. 작업 기록** | [`03-WORKLOG/`](03-WORKLOG/README.md) | 그 변경은 언제·왜·무엇을 건드렸고 어떻게 검증했나? |
| **4. 잔여·위험** | [`04-BACKLOG.md`](04-BACKLOG.md) | 지금 남은 것·깨질 수 있는 것·최적화 여지는? |

---

## 2. 시스템 상태 대시보드

상태 범례 — ✅ 완결(변경 계획 없음) · 🟢 운영(안정, 확장만) · 🔶 부분 구현 · 🚧 진행 중 · ⬜ 미착수 · ⚠ 위험 동반

| # | 시스템 | 상태 | 핵심 소스 | 잔여 요약 |
|---|---|---|---|---|
| S1 | [낚시 루프 (1인칭)](02-SYSTEMS/fishing-loop.md) | 🟢 | `FirstPersonFishingScene` · core 물리 9종 | 어탐 레이더, 가이드 삽화 실사화 |
| S2 | [필드·캐스팅 (탑다운)](02-SYSTEMS/world-field.md) | 🟢 | `RegionFieldScene` | POI 세분화, 사운드 |
| S3 | [**손질 (회뜨기)**](02-SYSTEMS/butchery.md) | 🚧 | `ButcheryProcess` · `ButcheryPanel` · `CephalopodStages` | 두족류 **무늬오징어 개방**(87차) · 나머지 3종 · 광어 F9 잔여 |
| S4 | [회썰기·플레이팅](02-SYSTEMS/sashimi-cooking.md) | 🟢 | `SashimiPanel` · `UtilizationPanel` | 스시, 불요리(화구·용기) |
| S5 | [인벤토리·장비·보관](02-SYSTEMS/inventory-equipment.md) | 🟢 | `InventoryStore` · `CoolerStore` · `FridgeStore` | 예약 슬롯 6종 아이템 대기 |
| S6 | [경제·상점·시세](02-SYSTEMS/economy-data.md) | 🟢 | `MarketPriceEvaluator` · `ShopPanel` | 낚시점 전용 상점 |
| S7 | [월드맵·지역 타일맵](02-SYSTEMS/world-field.md) | 🔶 | `WorldMapScene` · `tools/build_region_maps.py` | 속초·부산·홈타운만 개방 |
| S8 | [홈베이스 (집)](02-SYSTEMS/home-base.md) | 🔶 | `HomeInteriorScene` · `types/HomeBase.ts` | 하우스 Tier 1~3, 수조 패널, 농사 |
| S9 | [외부 실데이터](02-SYSTEMS/economy-data.md#외부-api) | 🟢⚠ | `core/api-client/*` | **배포 시 CORS 프록시 필수** |
| S10 | [UI 프레임워크](02-SYSTEMS/ui-framework.md) | 🟢 | `DraggablePanel` · `TextFit` · `SceneFade` | 저순위 팝업 검수 잔여 |
| S11 | [가이드·온보딩](02-SYSTEMS/ui-framework.md#가이드-허브) | 🟢 | `GuidePanel` · `GuideContent` | 삽화 실게임 스크린샷 교체 |
| S12 | [세이브·슬롯](02-SYSTEMS/inventory-equipment.md#세이브) | 🟢 | `GameState` | 저장은 집 침대 전용 |
| S13 | [튜닝·dev 도구](02-SYSTEMS/ui-framework.md#dev-도구) | 🟢 | `config/tuning.ts` · `DevTuningPanel`(F8) | fight/rod/yield 테이블 소비 전환 |
| S14 | 해루질·통발 | ⬜ | `NightHuntingEngine` · `TrapSystem` | **다음 대과제(3순위)** |
| S15 | 요리(불요리)·CookScene | ⬜ | `CookScene` · `RecipeDatabase` | 화구·용기 시스템부터 |
| S16 | 제작 `CraftScene` | ⬜ | — | 예약(U 키) |
| S17 | 퀘스트·스토리 | ⬜ | `QuestDatabase` | **모든 컴포넌트 구현 후 도입**(사용자 방침) |
| S18 | 멀티플레이 | ⬜ | `packages/server` | Phase 8 |
| S19 | Tauri 패키징 | ⬜ | `apps/tauri-wrapper` | Phase 9 (아이콘만 준비됨) |

---

## 3. 지금 위치 (2026-08-09)

- **Phase 6** (게임플레이 심화) 내부, **손질 시스템(S3)** 확장 중.
- **두족류 잠금 해제(87차)** — 무늬오징어 14스테이지 완주 가능. 한치·갑오징어·문어는 미착수(스펙 §4.2~§4.4).
- ⏸ **다음 세션 재개 지점 = 무늬오징어 수동 실플레이 검증** — 87차는 자동 검증만 통과했다(사람 조작 미확인).
  재현 절차 → [워크로그 087 §5](03-WORKLOG/2026-08-09-087-cephalopod-squid-tree.md).
  렌더는 파라메트릭 플레이스홀더 — 시트 도트 추출(`gen_ceph_stages.cjs`)이 잔여.
- **광어 잔여**: F9 좌표 4종(`upSep1/2`·`dnSep1/2`·`dnScore` — 엔가와·박피는 반영 완료) · 등쪽 단면 실사 투명본 대기.
  칼 연출은 **현행 확정**(사용자 2026-08-09).
- 상세: [`04-BACKLOG.md`](04-BACKLOG.md) · [`02-SYSTEMS/butchery.md`](02-SYSTEMS/butchery.md)

## 4. 새 세션 읽는 순서

1. `CLAUDE.md` (규칙·스킬 목록)
2. 이 파일 §2 대시보드 → §3 지금 위치
3. 건드릴 시스템의 [`02-SYSTEMS/*.md`](02-SYSTEMS/README.md)
4. 최근 관련 [`03-WORKLOG/`](03-WORKLOG/README.md) 항목 1~2건
5. 작업 → 검증 → **워크로그 기록**(스킬 `work-log`)
