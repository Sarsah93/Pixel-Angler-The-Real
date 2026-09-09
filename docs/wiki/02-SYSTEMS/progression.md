# S21 진행 — 면허 · 스킬 · 일지 (L / K / J)

> 신설 2026-09-09 (122차). 상태 🔶 — 패널·데이터·판정은 있고, **스킬 효과 실배선은 13/40**·면허 효과는 기존 9종만.

## 1. 목적·범위

- **책임**: 플레이어 성장의 세 축 — 면허(허가·권한 게이트) · 스킬(레벨 포인트로 사는 수치 배율) · 일지(스토리·퀘스트 열람).
- **책임 아님**: 퀘스트 진행 판정(`QuestDatabase` 조건은 S17이 소비 예정) · 레벨업 자체(`GameState.player.level`은 낚시 XP 쪽).

## 2. 구성

| 층 | 파일 | 역할 | 상태 |
|---|---|---|---|
| core 계약 | `types/Skills.ts` | `SkillDef{tier,maxRank,costPerRank,requires,effect{key,perRank,mode},wired}` · `SkillRanks` · `skillPointsForLevel(level)` = 레벨×1 | ✅ 122 |
| core 데이터 | `db-schema/SkillDatabase.ts` | 카테고리 6(낚시 12 · 채집/통발 6 · 경제 7 · 운전/이동 6 · 생활 7 · **농사 6 = `locked`**) · `skillMult/skillBonus/skillPrereqsMet/skillPointsSpent` | ✅ 122 |
| core 계약 | `types/License.ts` | `LicenseCategory` 6군(낚시·해루질·통발·토지/주거·선박/어업·사업) · 16종(122차 +7) · `nameEn/descriptionEn/plannedNote` | ✅ 122 |
| client 상태 | `store/GameState.ts` | `skillTree` 세이브 · `skillPointsTotal/Available` · `canLearnSkill(id) → {ok, reason}` · `learnSkill` · `skillMult/skillBonus/skillRank` | ✅ 122 |
| client UI | `ui/LicensePanel.ts` | 720×500 · 카테고리 그룹 윈도우드 목록(휠·스크롤바·`n–m / N`) · 요구사항(`checkUnlockRequirements`) · 발급 · `plannedNote` | ✅ 122 재작성 |
| client UI | `ui/SkillTreePanel.ts` | 1080×656 · 좌 카테고리 · 우 티어 열 트리(선행선·Lv 라벨) · 하단 상세 + [배우기] · 상태 5종 | ✅ 122 |
| client UI | `ui/JournalPanel.ts` | 스토리(프롤로그 준비 중) / 메인(tutorial+license) / 서브(activity+achievement) · 상세(목표·보상·선행·상태 칩) | ✅ 122 골격 |
| client 입력 | `scenes/RegionFieldScene.ts` | `keydown-L/K/J` → `togglePanel` · ESC LIFO 편입 | ✅ 122 |

## 3. 동작 구조

```
레벨 N ──skillPointsForLevel──▶ 총 포인트 N
                                  − skillPointsSpent(ranks) = 사용 가능
canLearnSkill(id): 알 수 없음 → 카테고리 잠김 → 최대 랭크 → 선행(requires {id,rank}) → 포인트 부족 → ok
learnSkill(id): ranks[id]++ · markDirty   (세이브 `skillTree`)
소비: GameState.skillMult('cast_distance') 등 — 배우기 전 1.0 (기존 수치 불변)
```

**실배선 13종** (`wired: true`): `fish_cast`(캐스팅 완력) · `fish_bite` · `fish_weather` · `fish_night`(FP 입질 배율) ·
`gath_eye`(스팟 반경) · `gath_knot`(통발 분실) · `gath_hands`(맨손 부상) · `gath_octo`(문어 도주) ·
`eco_haggle`(구매가 −3%/랭크) · `eco_regular`(판매가) · `drv_run` · `drv_bike`(이동 속도) · `life_balance`(미끄러짐).
나머지는 `wired: false` — 패널에 '예정' 태그, 배우기는 가능(포인트 소모).

면허: `LICENSE_CATEGORY_ORDER`로 그룹 · `fishery_member`(어촌계원)만 122차 실효과(조례 면제) · 나머지 신규 6종은 `plannedNote`.

## 4. 세부과제 현황

| 과제 | 상태 | 차수 |
|---|---|---|
| 스킬 계약·DB·포인트·학습 판정·세이브 | ✅ | 122 |
| 스킬 패널(트리·선행선·상세·배우기) | ✅ | 122 |
| 스킬 효과 실배선 | 🔶 13/40 | 122 — 나머지는 대상 시스템 착수 시 `effect.key` 소비 |
| 면허 카테고리화 + 신규 7종 + 패널 재작성(스크롤) | ✅ | 122 |
| 신규 면허 효과 배선 | 🔶 1/7 | 어촌계원만 · 나머지 '예정' |
| 일지 패널 골격(스토리·메인/서브) | ✅ | 122 |
| 스토리·퀘스트 본편 | ⬜ | S17 — 사용자 방침 "모든 컴포넌트 후" |
| 농사 카테고리 해제 | ⬜ | 농장 경영(S8 E1~) 착수 시 `locked: false` |

## 5. 잔여·차기

- 스킬 27종 배선 — 낚시(라인·드랙·밑밥·조석·루어·대물·보관·챔질) · 채집(랜턴·야간·통발 미끼·산란) ·
  경제(시세·대량·수협·토지·주식) · 운전(자동차·보트·연비) · 생활(체력·피로·요리·수면) · 농사 전부.
- 스킬 포인트 환급(리스펙)·스킬 툴팁 실효과 수치 표기 — 사용자 요청 시.
- 퀘스트 진행 판정 + 일지 상태 실갱신(현재 `GameState.quests` 상태만 읽음).

## 6. 함정·불변조건

1. **효과 소비처는 `GameState.skillMult/skillBonus`만** — 랭크를 직접 읽어 계산하지 말 것(배선 여부·mode를 한 곳에서 관리).
2. **`wired: false` 스킬은 배우기가 막히지 않는다**(포인트만 소모) — 실배선 전에 툴팁 '예정'을 지우지 말 것.
3. `skillPointsForLevel`을 바꾸면 기존 세이브의 사용 포인트가 총량을 넘을 수 있다 — `skillPointsAvailable`은 0 하한이지만 환급 로직은 없음.
4. 면허 `category`는 필수 — 빠지면 패널 그룹에서 조용히 사라진다(`LICENSE_CATEGORY_ORDER` 순회).
5. 패널 3종은 `openPopup` 경유 → **새 팝업이 밴드 최상단**(122차 `raiseToTop`) · ESC LIFO. 직접 `add.existing`으로 띄우지 말 것.
