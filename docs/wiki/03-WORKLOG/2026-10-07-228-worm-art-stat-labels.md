# 228차 — 갯지렁이 그림 4장(한 갑 · 한 마리) · 상태 창 스탯 이름 한국어만

| | |
|---|---|
| **날짜** | 2026-10-07 |
| **시스템** | `해루질` `에셋` `상점` `UI` `i18n` `위키` |
| **트리거** | 사용자 도트 그림 4장 + 상태 창(S) 스탯 이름에 영문이 섞인다는 지적 |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 · core 테스트 75/75 |

---

## 1. 배경 — 왜 했나

사용자 원문:

> 에셋 추가해줄테니 반영해. 순서대로, 1) 청갯지렁이 한 갑 2) 청갯지렁이 한 마리 3) 참갯지렁이(혼무시) 한 갑 4) 참갯지렁이(혼무시) 한 마리

> 인게임 내 스탯창(S)를 눌렀을 때, 보이는 힘/민첩 등 스탯이 한글+영문으로 표시되고 있어.
> settings에서 한글 설정 시, 한글로만 보이게 하자.

같은 날 사용자 지시로 「사용자에게 하는 설명·보고는 전부 한국어」를 `CLAUDE.md` 절대 규칙 12번에 넣었다(별도 커밋).

---

## 2. 방법 — 판단한 것

**그림 4장의 쓰임**

| 그림 | 어디에 |
|---|---|
| 청갯지렁이 한 갑 | 상점 묶음 「청갯지렁이 1갑」 아이콘(`item_ragworm_pack`) |
| 청갯지렁이 한 마리 | 생미끼 `inv_ragworm` · 도감 · 잡은 것 아이콘(`forage_perinereis_aibuhitensis` = `item_ragworm`) + **파기 판 그림(새로)** |
| 혼무시 한 갑 | 상점 묶음 「참갯지렁이(혼무시) 1갑」 아이콘(`item_honmushi_pack`) |
| 혼무시 한 마리 | 생미끼 `inv_honmushi`(`item_honmushi`) · 도감 · 잡은 것 아이콘 + 파기 판 그림 |

- 묶음은 사면 바로 8마리로 풀린다(188차 구조) — 가방에 「갑」이 남지 않으므로 구세이브 백필이 필요 없다.
- 원본이 이미 투명 도트 그림이라 다시 굽지 않는다(226차와 같은 「원본 그대로」).
  다만 2000px 원본을 그대로 실으면 한 장이 수 MB라 **긴 변 720 이하로 정수배 축소**(`HIRES_MAX`).
- 상자 그림은 납작해서 정사각 칸에서 작아 보였다 → 여백 0으로 꽉 채움.
- 옛 사진 원본(`ragworm.png` · `honmushi.png`)과 167차 혼무시 아이콘(`it_honmushi.png`)은 지우지 않고 보존만 한다.

**상태 창 스탯 이름** — core `ANGLER_STAT_INFO`의 라벨이 `근력 (Strength)`처럼 영문을 병기하고 있었다.

- 라벨을 한국어만으로(`근력` · `민첩` · `평형감각` · `조석 해석력`) · 설명의 `(Sweet Spot)`도 뺐다.
- 영어 설정은 i18n 사전(`en_ui.ts`)이 맡는다 — 키를 새 한국어 라벨로 바꿨다.

---

## 3. 변경

| 구분 | 파일 | 내용 |
|---|---|---|
| 신설 | `food assets/forage/{ragworm,honmushi}_{pack,single}.png` | 사용자 그림 원본(수정 금지) |
| 신설 | `public/item-icons/pack_{ragworm,honmushi}.png` · `public/forage-board/perinereis_aibuhitensis.png` | 생성물 |
| 수정 | `public/item-icons/forage_{perinereis_aibuhitensis,marphysa_sanguinea}.png` · `public/forage-board/marphysa_sanguinea.png` | 새 「한 마리」 그림으로 |
| 수정 | [`tools/pixelize_forage_photos.py`](../../../tools/pixelize_forage_photos.py) | `save_hires`(정수배 축소 · 226차 그림은 원본 크기 유지) · `PACKS` 표 · 갯지렁이 두 종 원본 교체 |
| 수정 | [`client/scenes/BootScene.ts`](../../../packages/client-pc/src/scenes/BootScene.ts) | `item_ragworm_pack` · `item_honmushi_pack` · `forageboard_perinereis_aibuhitensis` · `item_honmushi` 경로 |
| 수정 | `client/data/ShopCatalog.ts` | 묶음 두 개 아이콘 키 |
| 수정 | [`core/types/AnglerStats.ts`](../../../packages/core/src/types/AnglerStats.ts) · `client/i18n/en_ui.ts` | 스탯 라벨 한국어만 · 영어 사전 키 |

---

## 4. 구조상 위치

`해루질 → 에셋(아이콘 · 판 그림)` · `상점 → 데이터(아이콘 키)` · `상태 창 → 데이터(라벨) + i18n`.
판정 · 계산은 바뀌지 않았다.

---

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 텍스처 | 하네스 `r228.cjs` | 8키 전부 있음(아이콘 507~713px · 판 36×42 · 38×42) |
| 상태 창 | 한국어 · 영어 Text 수집 + 스크린샷 | ko 「근력 · 민첩 · 평형감각 · 조석 해석력」(영문 0) · en 「Strength · Dexterity · Balance · Tide reading」 |
| 상점 | 직판장 스크린샷 | 6,000원 · 15,000원 칸에 상자 그림 |
| 파기 판 | 청갯지렁이 · 혼무시 놀이 창 | 판 그림 사용(배율 0.99) |
| 화면 오류 | ko/en | pageerror 0 · TextOverflow 0 |

---

## 6. 잔여

- 상태 창의 `HP` · `Lv.` · `EXP`는 그대로 두었다 — 게임 전반(HUD 등)에서 같은 약어를 쓰므로 바꾸려면 한 번에 바꿔야 한다. 사용자 확인 후.
- 전복 · 삿갓 떼기 판 그림 사진(BF ②)은 그대로 남음.

---

## 7. 위험 · 부작용

- 혼무시 생미끼 아이콘이 167차 그림에서 새 그림으로 바뀐다(같은 키 `item_honmushi` — 구세이브도 바로 새 그림).
- 도구를 다시 돌리면 226차 그림(해삼 · 보라성게)은 `max_px=None`이라 원본 크기 그대로 — 축소 규칙을 그 둘에 걸면 그림이 바뀐다.

---

## 8. 후속 반영

- [x] 워크로그(이 문서) · 색인 §3.1
- [x] `02-SYSTEMS/night-hunting-trap.md` §4 · §6
- [x] `04-BACKLOG.md` BF
- [x] AGENTS §9 · PLAN · CLAUDE.md 요약(228 넣고 225 뺌) · 배포 64차
