# S20. 도감 · 발견 · dev 도구

> 상태 **🟢 운영** — 발견 게이트 도감(어종/해양생물/아이템 위키) + dev 크리에이티브 콘솔(F10).
> 신설 099 (2026-08-14) · 관련 차수 **156**(요리 도감)

---

## 1. 목적·범위

"**한 번이라도 조우한 것만 공개**"의 단일 기준(DiscoveryStore)과 그 소비자들:

- **도감 & 조과첩**(AnglerLogScene **5탭**) — 어종·해양생물·아이템 위키·**요리**(156차) + 조과 기록.
- **dev 크리에이티브 콘솔**(F10) — 아이템/어종 지급·무적·도감 해금 (localhost 전용).

## 2. 구성

| 계층 | 파일 | 역할 |
|---|---|---|
| core | `types/Discovery.ts` | `DiscoveryKind`(fish/creature/item/**dish**) · `DiscoverySource`(catch/trap/night_hunting/inventory/legacy/dev) · 라벨 |
| client | `store/DiscoveryStore.ts` | 발견 기록 싱글톤 — record(최초 1회)·isDiscovered·세이브·`onNew` 훅·dev 해금. `__DISC` 노출 |
| client | `data/WikiCatalog.ts` | 아이템 위키 정적 카탈로그 — 시드+상점 dedup·판매처 힌트·`tpl`(실지급용) |
| client | `core/db-schema/DishDiscovery.ts` | 요리 도감 id·이름·변형 후보(`discovery_<레시피>_<어종>`) |
| client | `scenes/AnglerLogScene.ts` | 5탭 도감 — 미발견 실루엣/???/힌트 · 발견 카드(경로·일시) |
| tools | `gen_game_wiki_data.mjs` · `game_wiki_template.html` | 퀘스트·요리·어종·제작·아이템·시스템 문서를 합친 `Pixel Angler The Real Wiki` 발행본 |
| client | `dev/DevMode.ts` · `dev/DevConsolePanel.ts` | god 상태 + F10 콘솔 |

## 3. 동작 구조

```
발견 기록(각 1곳): addCaughtFish → 'catch'  ·  addTrapCatchToCooler → 'trap'
                   addHarvestToCooler → 'night_hunting'  ·  InventoryStore.addItem → 'inventory'
세이브: SaveData.discoveries — 구세이브(필드 없음)는 caughtFishHistory에서 'legacy' 백필
시드 동기: initialize/applySaveData/newGame 3경로 모두 syncInventoryDiscoveries (멱등·onNew 억제)
알림: DiscoveryStore.onNew → RegionFieldScene HUD 토스트 ("N 키로 확인")
진입: 메인 메뉴 '도감' + RegionFieldScene N 키 (pause+launch → stop+resume)
```

**도감 카드 규칙**: 발견 = 전체 정보 + "🔍 {발견 경로} · M/D" / 미발견 = 실루엣(`setTintFill`) +
??? + **조우 힌트만**(어종 = 수심대·수층·야행성 / 생물 = 주야·면허 / 아이템 = 판매처).

**dev 콘솔(F10)**: ①무적(신선도 동결·채비/미끼 손실 없음·줄터짐 없음) ②재화·회복
③아이템 검색 지급/제거 ④어종 어획물 지급(`devGrantFish`) ⑤도감 전체 해금/초기화.
god 가드 소비처 = `refreshCondition`·`loseRigParts`·`loseLureRig`·`consumeRigItem`·`forceLineBreak`.

## 4. 세부과제 현황

| 과제 | 상태 | 차수 |
|---|---|---|
| DiscoveryStore + 세이브 + legacy 백필 | ✅ | 099 |
| 발견 소스 4곳 배선 (catch/trap/night_hunting/inventory) | ✅ | 099 |
| 도감 4탭 + 미발견 실루엣/힌트 | ✅ | 099 |
| 아이템 위키 카탈로그(시드+상점) | ✅ | 099 |
| HUD 신규 발견 토스트 + N 키 진입 | ✅ | 099 |
| dev 콘솔(F10) + god 모드 | ✅ | 099 |
| **요리 도감 탭** — 레시피 목록 + (레시피 × 주재료) 변형 카드 · 미발견 `??? 매운탕` | ✅ | **156~157** — 서더리/통생선 매운탕 분리 · 전체 위키 생성기 |
| 위키 카드 상세 팝업(클릭 확대) | ⬜ | — |
| FP 씬 발견 토스트 (현재 RegionField HUD만) | ⬜ | — |
| 해양생물 전용 스프라이트 (현재 이모지 — S14 D4와 공유) | ⬜ | 에셋 대기 |

## 5. 잔여·차기

- ~~요리 레시피 도감~~ ✅156. 잔여 = 나머지 7개 레시피가 변형을 갖게 되면 후보 수(현재 57)가 늘어난다.
- 위키 확장 후보: 통발/장비 스펙 페이지 · 지역/스팟 도감.
- 발견 통계(전체 진행률 %)를 메인 메뉴/저장 슬롯에 표기.

## 6. 함정·불변조건

1. **발견 기록은 세이브 필수 경로** — 새 리셋/로드 경로를 만들면 DiscoveryStore
   resetAll/serialize/deserialize 배선을 잊지 말 것(부산물 지급 3경로 함정과 동류).
2. **`record`는 onNew 훅을 발화한다** — 로드·일괄 동기에서는 훅을 억제하고 호출
   (`syncInventoryDiscoveries` 패턴). 안 하면 로드 시 토스트 폭탄.
3. **아이템 발견은 raw id** — 개체형(`inv_catch_*`)도 기록되지만 카탈로그에 없어 자연 무시.
   카운트 UI는 반드시 **카탈로그 교집합**으로(099에서 126/113 실측 후 수정).
4. **시드 동기는 3경로 전부** — 첫 부팅(세이브 없음)은 applySaveData·newGame을 안 거친다.
   initialize 말미의 멱등 동기를 지우면 신규 프로필의 아이템 위키가 전부 잠긴다(099 실측 FAIL 2건).
5. `isGod()`은 `import.meta.env.DEV` 게이트 — 프로덕션에서 상수 false로 데드코드 제거된다.
   god 소비처를 추가할 때 이 함수만 쓰고 `DevMode.god`을 직접 읽지 말 것.

6. **카탈로그에 없는 아이템 발견은 알리지 않는다**(156차 — §8-9). 개체형 id(`inv_dish_*`·`inv_catch_*`)는
   위키 카탈로그에 없어 `displayNameOf`가 **id를 그대로 돌려주고**, 그대로 HUD에 찍히면 내부 id 노출이다
   (실측 `[도감] 새로운 아이템 발견 — inv_dish_stew_red_1`). `onNew`에서 카탈로그 교집합으로 거른다.
7. **요리는 전부 `kind: 'dish'`** — 변형이 없는 레시피도 `discovery_<레시피>_generic` 1건을 갖는다.
   아이템 kind로 기록하면 위 ⑥에 걸려 조용히 사라지거나 내부 id가 새어 나온다.
8. **도감 기록은 (레시피 × 주재료) 1건** — 개체(`instanceId`)마다 등록하면 도감이 로그가 된다.

