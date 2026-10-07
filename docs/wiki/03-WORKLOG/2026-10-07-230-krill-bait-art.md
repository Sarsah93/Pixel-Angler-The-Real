# 230차 — 「미끼용 크릴」 그림 (미끼용 크릴 · 미끼용 백크릴 공통)

| | |
|---|---|
| **날짜** | 2026-10-07 |
| **시스템** | `인벤토리` `에셋` `해루질(미끼)` |
| **트리거** | 사용자가 229차에 빠진 「미끼용 크릴」 한 마리 그림을 다시 첨부 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

229차에 사용자가 「'미끼용 크릴' 1개짜리 이미지야. (미끼용 백크릴, 미끼용 크릴 두 가지 모두 해당 같은 그림을 사용)」라고 보냈지만
파일이 들어오지 않았다. 그동안은 픽셀 아이콘 `px:krill`(새우 한 마리)이 자리를 채웠다.
이번에 「'미끼용 크릴' 한 마리 이미지 첨부했어.」와 함께 그림(737x714 · 투명 배경)이 왔다.

---

## 2. 방법 — 판단한 것

- 투명 배경의 사용자 도트 그림이라 다시 굽지 않는다 — 다른 「한 갑」 그림과 같은 `PACKS` 경로(`save_hires` · 긴 변 720 넘으면 정수배 축소).
- 텍스처 키 하나(`item_krill_bait`)를 두 아이템이 같이 쓴다. 설명 · 보정(+2% / 기준)은 229차대로 아이템마다 다르다.
- 상세보기의 일반 미끼 행(「활어 +25% · 냉동 −50% · 부패 −85%」)이 크릴 행(「+2% · 부패 −20%」)과 숫자가 어긋났다 —
  크릴 프로필(`krill_bait` · `krill_block`)에서는 일반 행을 뺐다.

---

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | `food assets/forage/krill_bait_single.png` | 사용자 원본 |
| 신설 | `client-pc/public/item-icons/it_krill_bait.png` | 490x490(2배 축소 + 여백) |
| 수정 | [`tools/pixelize_forage_photos.py`](../../../tools/pixelize_forage_photos.py) | `PACKS`에 `krill_bait_single → it_krill_bait` |
| 수정 | [`client/scenes/BootScene.ts`](../../../packages/client-pc/src/scenes/BootScene.ts) | `item_krill_bait` 로드 |
| 수정 | [`client/store/InventoryStore.ts`](../../../packages/client-pc/src/store/InventoryStore.ts) | `inv_krill` 시드 · `inv_krill_bag` 템플릿 → `item_krill_bait` · 구세이브 백필(`px:krill` · 이모지 크릴 → 새 그림, 이모지 지움) |
| 수정 | [`client/ui/ItemDetailPanel.ts`](../../../packages/client-pc/src/ui/ItemDetailPanel.ts) | 크릴 프로필은 일반 미끼 「입질 보정」 행 생략 |

---

## 4. 구조상 위치

`인벤토리 → 아이템 정적 필드(iconTexture)` + `세이브 백필` + `상세보기 렌더`. 판정(입질 배율)은 바뀌지 않았다.

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 텍스처 | 하네스 `r230.cjs` | `item_krill_bait` 490x490 로드 |
| 두 아이템 | 하네스 | 칸 · 상세보기 모두 `item_krill_bait`(36px 칸 · 90px 확대) · 이모지 "" |
| 구세이브 | 하네스(직렬화 → 조작 → `deserialize`) | 이모지 「크릴 (냉동)」 → 「미끼용 크릴」 + 새 그림 · `px:krill` 백크릴 → 새 그림 |
| 상세 행 | 하네스 | 「입질 보정」 한 줄씩(크릴 「기준 · 부패 −20%」 · 백크릴 「+2% · 부패 −20%」) |
| ko/en | 두 번 | TextOverflow 0 · pageerror 0 |
| 빌드 | `pnpm run build` · typecheck | 3/3 · 0 오류 |

---

## 6. 잔여

- 229차 잔여(백로그 BH) 중 ①은 해소. 나머지(파산 뒤 타이틀 저장분 · 종별 외포란 시기 · 바칸 차별 · 독소 해역)는 그대로.
- 1인칭 낚시 바늘 끝 미끼 그림은 여전히 절차 그래픽이다 — 미끼 종류별 그림을 바늘에 달 때 이 텍스처를 쓸 수 있다.

---

## 7. 위험 · 부작용

없음 — 텍스처 키만 바뀌었고 입질 판정 · 신선도 프로필은 그대로다.
백필은 `inv_krill` · `inv_krill_bag` 두 id에만 걸리고, 이미 다른 그림을 단 경우(`px:krill`이 아닌 값)는 건드리지 않는다.

---

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 §3.1
- [x] `02-SYSTEMS/night-hunting-trap.md` §4 · §5
- [x] `04-BACKLOG.md` BH ① 해소
- [x] AGENTS §9 · PLAN · CLAUDE.md 요약(230 넣고 227 뺌) · 배포 66차 · 위키 재발행
