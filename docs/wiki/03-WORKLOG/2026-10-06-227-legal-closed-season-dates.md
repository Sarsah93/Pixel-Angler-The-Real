# 227차 — 법정 수치 반영: 날짜 단위 금어기 · 제주 규정 · 대문어 금지체중 · 벌금 상한

| | |
|---|---|
| **날짜** | 2026-10-06 |
| **시스템** | `해루질` `통발` `낚시(오라클)` `도감` `튜닝` `위키` |
| **트리거** | 사용자가 금어기 · 금지체장 · 금지체중 정본을 대조해 표로 보내 옴(225 · 226차 요청분) |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 테스트 75/75(새 7건) |

---

## 1. 배경 — 왜 했나

225 · 226차에 「게임이 실제로 막는 값」 7종의 대조를 부탁했고, 사용자가 출처와 함께 표로 보내 왔다(요지).

| 생물 | 사용자 대조값 |
|---|---|
| 전복 | 9.1~10.31 · 제주 10.1~12.31 · 제주 각장 10cm |
| 참문어(동해 「돌문어」) | 5.16~6.30(강원 적용) · 금지체중 국가 기준 없음 |
| 대문어 | 금어기 없음 · 금지체중 600g |
| 해삼 | 7월 |
| 꽃게 | 6.21~8.20 · 두흉갑장 6.4cm |
| 낙지 | 6월 |
| 소라 | 국가 없음 · 제주 6.1~8.31 · 각고 7cm |
| 오분자기 | 국가 없음 · 제주 7.1~8.31 · 4cm |

함께 온 것:

- 성게 · 홍합 · 바지락 · 굴 · 민꽃게는 국가 금어기 · 체장 없음. 홍합 · 바지락 · 굴은 마을어장 관리 +
  **봄철 패류독소 채취 금지** — 식중독 상태 게임 아이디어로 제안.
- 꽃게 규정은 민꽃게에 해당하지 않는다. 제주는 마을어장 채집 조례가 따로 있다(나중에 재확인).
- 벌금 기준: **비어업인 과태료 최대 80만원**(2020.9~). 소라 금어기 위반은 1,000만원까지 나온 사례가 있다.
- 참문어와 대문어는 따로 둘 것.

---

## 2. 방법 — 판단한 것

**달 단위로는 「5.16」을 못 적는다** — 금어기를 날짜 구간으로 바꿨다.

- 새 타입 `ClosedSeason { from: [월, 일], to: [월, 일] }`(해 넘김 허용) · 판정 `isClosedOn(seasons, month, day?)`.
- `day`를 모르면 **그 달에 하루라도 걸치면 닫힘**(보수적). 날짜를 안 넘기는 옛 호출부는 예전처럼 달 단위로 막는다.
- 옛 필드 `closedSeasonMonths`는 남긴다(산란기 비만도 계산 · 세이브 호환). 날짜 구간이 있으면 그쪽이 정본이다.

**지역 규정은 덮어쓰기** — `regional.jeju { closedSeasons?, minLegalSizeCm?, minLegalWeightG? }`.

- `resolveLegal(base, regionId)`가 국가 기본 + 지역 덮어쓰기를 합쳐 준다. 지역 키는 `legalRegionOf`(id가 `jeju`로 시작하거나 「제주」 포함).
- 지금 지역은 속초 · 부산뿐이라 제주 규정은 **도감 · 위키 표기와 테스트로만** 살아 있다. 제주 지역이 생기면 그대로 적용된다.

**참문어 · 대문어는 이미 다른 종이다** — 어종 DB `octopus`(돌문어 · 참문어) / `giant_octopus`(대문어). 채집 DB `octopus_vulgaris`는 참문어.

- 참문어: 금어기 5.16~6.30(어종 오라클 · 채집 DB 둘 다).
- 대문어: 금어기 없음 · **금지체중 600g** — 오라클 `legalMinWeightG` → 600g 미만이면 `isUndersized` + 보호 사유 「금지체중 600g 미만」.
  1인칭 낚시의 기존 방류 경로를 그대로 탄다.
- 188차 「산란기 8kg 이상 대문어」(강원 조례)는 그대로 둔다.

**벌금 상한** — `TUNING.forage.fineCapWon` 300,000 → **800,000**(비어업인 과태료 최대). 비율(보유 재화 30%)은 그대로.

**채집 쪽은 위반이 일어나지 않는다** — 금어기 생물은 스팟에 안 나오고, 체장 미달은 자동 방류된다.
그래서 벌금은 지금처럼 조례 위반(어장 안 5종)에만 걸린다.

---

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | [`core/types/LegalSeason.ts`](../../../packages/core/src/types/LegalSeason.ts) | `MonthDay` · `ClosedSeason` · `LegalRegionKey` · `RegionalLegalRule` · `ResolvedLegalRule` |
| 신설 | [`core/rules/ClosedSeason.ts`](../../../packages/core/src/rules/ClosedSeason.ts) | `inSeason` · `isClosedOn` · `formatSeasons`(「5.16~6.30」) · `legalRegionOf` · `resolveLegal` · `closedFor` |
| 신설 | `core/rules/ClosedSeason.test.ts` | 참문어 5.15/5.16 · 달 단위 폴백 · 꽃게 경계 · 제주 전복 · 소라/오분자기 · 해 넘김 · 대문어 600g (7건) |
| 수정 | [`core/db-schema/ShoreCreatureDatabase.ts`](../../../packages/core/src/db-schema/ShoreCreatureDatabase.ts) | `closedSeasons` · `regional` 필드 + 7종 값(오분자기 국가 체장 3.5 → 0 · 제주 4cm) |
| 수정 | [`core/simulation/FishSpawningOracle.ts`](../../../packages/core/src/simulation/FishSpawningOracle.ts) | `closedSeasons` · `legalMinWeightG` · `SpawnContext.day` · 참문어 5.16~6.30 · 대문어 600g |
| 수정 | `core/simulation/{NightHuntingEngine,TrapSystem,ForagingEngine}.ts` | 문맥에 `day?` · `regionId?` → `closedFor` · 체장은 `resolveLegal` |
| 수정 | `core/rules/FisheryLaw.ts` | `landingLegalFlags` — 날짜 구간 · 금지체중 |
| 수정 | `core/config/tuning.ts` | 벌금 상한 80만원 |
| 수정 | `client/scenes/field/{ForageSystem,TrapFieldSystem}.ts` · `NightHuntingScene` · `TrapScene` · `FirstPersonFishingScene` | 오늘 날짜(`day`) · 지역 넘기기 · 체장 문구는 지역 규정 |
| 수정 | `client/scenes/AnglerLogScene.ts` · `i18n/en.ts` | 도감 「금어기 5.16~6.30」 · EN `Closed 5.16~6.30` · 「금지체중 Ng 미만」 |
| 수정 | [`tools/gen_game_wiki_data.mjs`](../../../tools/gen_game_wiki_data.mjs) | 어종 카드 금어기 · 금지 체중 · 생물 카드 금어기(날짜) · 「제주 규정」 줄 |

---

## 4. 구조상 위치

`해루질 · 통발 · 낚시 → 법 규칙(판정 층)` — 새 규칙 모듈 하나(`ClosedSeason`)를 세 엔진이 같이 쓴다.
데이터 층(생물 · 어종 수치)과 판정 층(날짜 · 지역)이 함께 바뀌었고, 렌더는 도감 문구 한 줄뿐이다.

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 날짜 경계 | core 테스트 | 참문어 5.15 열림 · 5.16 닫힘 · 7.1 열림 / 꽃게 6.20 · 8.21 열림 |
| 지역 규정 | core 테스트 | 제주 전복 10.1~12.31 · 10cm · 9.15는 제주 열림 / 속초 닫힘 |
| 대문어 | 오라클 400회 | `isUndersized === (weightG < 600)` 전부 일치 |
| 도감 | 하네스 `r227.cjs ko|en` | 「금어기 9.1~10.31 · 6.21~8.20 · 6.1~6.30 · 5.16~6.30 · 7.1~7.31」 · EN `Closed …` · TextOverflow 0 · pageerror 0 |
| 위키 | 생성기 출력 | 제주 규정 3줄 · 대문어 「600 g 미만 방류」 |
| 빌드 | `pnpm run build` · typecheck | 3/3 · 0 오류 |

---

## 6. 잔여

- **패류독소 봄철 채취 금지 → 식중독 상태** — 사용자 제안. 홍합 · 바지락 · 굴. 사용자 확인 후(백로그 BG).
- **꽃게 외포란(알 밴 암컷) 보호** — 채집 생물에 암수가 없다. 개체 성별을 넣을 때 같이(백로그 BG).
- **제주 마을어장 채집 조례** — 사용자가 다시 확인하기로 함. 제주 지역이 생길 때.
- 떼기 판 그림(전복 · 삿갓) 사진 · 청갯지렁이 한 마리 사진은 BF 그대로.

---

## 7. 위험 · 부작용

- 꽃게 · 참문어의 `closedSeasonMonths`가 넓어졌다(6~8월 · 5~6월) —
  날짜를 안 넘기는 호출부는 그 달 전체를 막는다(5.1~5.15 참문어도 막힘). 지금 호출부는 전부 `day`를 넘긴다.
- 산란기 비만도(`conditionFactorFor`)는 달 목록을 본다 — 참문어는 5월도 알 밴 무게가 붙는다(의도와 맞음).
- 오분자기 국가 체장 3.5cm → 0 — 속초에서 작은 오분자기도 남긴다(동해엔 거의 안 나온다).
- 벌금 상한 80만원 — 재화가 267만원 이상일 때만 상한이 걸린다(30%). 초반 체감은 같다.

---

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 §3.1
- [x] `02-SYSTEMS/night-hunting-trap.md` §4 · §5 · §6
- [x] `04-BACKLOG.md` BF 갱신 · BG 신설
- [x] AGENTS §9 · PLAN · CLAUDE.md 요약(227 넣고 224 뺌) · 배포 63차
