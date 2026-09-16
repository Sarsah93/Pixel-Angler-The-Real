# 캐릭터 스프라이트 생성 프롬프트 스펙 (GPT Image용) — 140차

> **용도**: 현재 코드가 절차 생성하는 바닐라 캐릭터(`packages/core/src/art/CharacterArt.ts`)를
> **외부 이미지 생성기(GPT Image)** 로 다른 디자인·스타일로 뽑아 보기 위한 조건 정리.
> 아래 값은 전부 코드에서 읽은 실제 설정값이다(추정 없음). 프롬프트에 그대로 붙일 수 있게
> §1은 문장형, §2~§7은 표·수치, §8은 복붙용 프롬프트 초안이다.

---

## 0. 확정 시안 (141차 채택 · **142차 반영 완료**)

- 사용자가 이 스펙으로 뽑은 **시안 시트**(Male/Female Vanilla Skeleton · Idle + Walk 1~4 × Down/Left/Right/Up ·
  Head/Face Close-up · Body Proportion · Shared Palette · Notes)의 **기본 생김새를 채택**했다.
- 지시: "이 디자인/스타일에서 조금씩 다르게 변형하는 게 좋을 것 같다."

**142차 결론 — 시트 임포트가 아니라 절차 렌더러 재튜닝으로 반영했다.**

생성 시트를 실측했더니 열 피치 97.5px / 행 피치 100px에 스프라이트 49 × 91px — **열 3.05배 ↔ 행 3.5배**로
격자가 서로 맞지 않고, 프레임마다 형태가 미세하게 달라 걷기가 떨린다. 무엇보다 구운 그림에는
**옷을 입힐 수 없고**(페이퍼돌 상실) NPC 41인 결정적 분화가 불가능하다.

→ 시안이 시안처럼 보이는 네 가지(**이마를 덮는 머리카락 · 둥근 정수리 · 검은 세로 눈 · 부위색 아웃라인**)를
`CharacterArt.ts`의 그리기 규칙으로 옮겼다. 상세 = `docs/wiki/02-SYSTEMS/character-art.md` §3.1 · 워크로그 142.

이 문서의 §2~§7 수치는 **여전히 유효하다** — 계약(셀·앵커·프레임 규칙)은 한 글자도 바뀌지 않았다.

---

## 1. 한 문단 요약 (프롬프트 도입부에 그대로)

32×32 픽셀 셀에 들어가는 탑다운 2D 픽셀아트 인간 캐릭터 시트. 4방향(정면·좌·우·후면) × 5프레임
(대기 1 + 걷기 4). 머리는 셀 y=3에서 시작, 발바닥은 y=28에 닿는다(몸 전체 26행). 머리 9행×10px(정면),
몸통 7행, 골반 3행, 다리 10행. **2px 그레인**(같은 색 2×2 블록 느낌)으로 지면 타일과 입자 통일.
바닐라는 **나체 + 언더웨어**이고 상의·하의·신발·모자·장갑·가방·손 도구는 **별도 레이어**로 얹힌다.
외곽선은 아주 어두운 남보라(#2a2435) 1px. 배경 투명.

---

## 2. 격자·앵커 (변경 금지 — 게임 레이아웃이 이 값으로 잡혀 있다)

| 항목 | 값 | 비고 |
|---|---|---|
| 셀 | **32 × 32 px** | 아트 픽셀. 게임은 정수 ×2 = 64px로 배치 |
| 시트 | 5열 × 4행 = **160 × 128 px** | 열 = 프레임 0~4, 행 = down / left / right / up |
| 머리 위 | y = **3** | `CHAR_HEAD_TOP` |
| 발바닥 | y = **28** | `CHAR_FOOT_Y` — 이 줄이 발 그림자와 맞는다 |
| 몸 높이 | 26행 | 3 ~ 28 |
| 좌우 중심 | x = **16** (정면/후면) | 측면은 얼굴 방향으로 +1 이동 |
| 배율 | 정수만 | `setScale(2)` — 비정수 확대 금지(그레인 붕괴) |

### 2.1 부위 사각형 (정면 기준, [x0, y0, x1, y1] 포함 범위)

| 부위 | 남성 | 여성 | 측면(공통) |
|---|---|---|---|
| 머리 | [11, 3, 20, 11] = 10×9 | 동일 | 9×9, 앞쪽으로 1px 튀어나옴 |
| 몸통 | [11, 12, 20, 18] = 10×7 | [12, 12, 19, 18] = 8×7 | 6×7 |
| 골반 | [12, 19, 19, 21] = 8×3 | [12, 19, 20, 21] = 9×3 | 6×3 |
| 다리(각) | 3~4px 폭 × 10행 | 동일 | 겹쳐서 4px 폭, 먼 다리는 어둡게 |
| 팔(각) | 3px 폭 × 7행 | 동일 | 앞팔 1개만 |

### 2.2 얼굴형 3종 (턱선에서 읽힌다 — 정수리는 머리카락이 덮는다)

| 얼굴형 | 상단 0~1행 깎기 | 하단 2행 깎기 |
|---|---|---|
| 계란형 oval | 1 / 0 | 1 / 2 |
| 둥근형 round | 2 / 1 | 0 / 1 |
| 사각형 square | 1 / 0 | 0 / 0 |

---

## 3. 걷기 프레임 규칙

| 프레임 | 의미 | 다리 | 팔 |
|---|---|---|---|
| 0 | 대기 | 양발 접지 | 내림 |
| 1 | 접지 A (체중 왼쪽) | 앞·뒤 벌림 (측면: 발끝 ±2px 기울기) | 앞뒤 스윙 |
| 2 | 통과 A | 한 발 **2px 들림** | 스윙 반대 |
| 3 | 접지 B (체중 오른쪽) | 1의 좌우 반전 | |
| 4 | 통과 B | 다른 발 들림 | |

- 측면 걷기는 다리 사각형을 **통째로 옮기지 않는다** — 골반 접점은 고정, 발끝만 기울인다(행별 skew).
- 접지 2프레임은 **좌우 체중 이동(sway 1px)** 으로 구분한다. 없으면 같은 그림이 된다.
- 프레임 간격 150ms.

---

## 4. 얼굴 (9행 머리 기준, 위에서 상대 행)

| 행 | 내용 |
|---|---|
| 0~1 | 머리카락 캡 |
| 2~3 | 이마 |
| 4 | 눈꺼풀 줄(어두운 1행) — **눈썹 겸용**, 눈썹 켜면 바깥 1px 연장 |
| 5 | 눈 — 흰자 1px + 홍채 1px (정면 두 눈, 측면 한 눈 2×2) |
| 6 | 볼 홍조 1px / 측면은 **코 1px 돌출**(콧대는 눈높이) |
| 7 | 입 — 미소(2px + 양끝 살빛 섞인 1px 위) / 무표정 2px / 작은 1px / 벌림 2행 |
| 8 | 턱 (얼굴형 깎기) |

- 측면: 코 아래 1행을 1px 들여 "이마벽 → 코 → 인중 → 턱" 옆선을 만든다. 코를 2px 빼면 부리가 된다.
- 여성은 눈꺼풀 바깥에 **속눈썹 1px** 추가 — 같은 도트 예산에서 성별이 가장 크게 읽히는 신호.
- 수염(있으면) 입 위 1행부터 턱까지 살 위에 덮는다.

---

## 5. 팔레트 (hex — 셰이드 3단: 밝음/기본/어두움은 코드가 자동 생성)

| 군 | 값 |
|---|---|
| 피부 5 | #f6d3b0 · #e8b489 · #d19a6e · #ac7550 · #8a5a3c |
| 머리 10 | #2e2833 · #4a3426 · #7a5232 · #b98a4e · #e0c78a · #9a4a3a · #8d8f9a · #e8e6e0 · #4d6b8a · #7a5a8f |
| 눈동자 6 | #3a2a22 · #5a3b26 · #2f5a6e · #3f6b3a · #6a3f6e · #8a4a3a |
| 의류 10 | #e8e2d4 · #3d5a80 · #c4553f · #5b6637 · #2f8377 · #d1a72f · #8a5a8f · #9a9ea6 · #4a4550 · #c47430 |
| 외곽선 | #2a2435 |
| 눈꺼풀 | #3a3145 · 흰자 #fdfbff · 입 #8a4a4a · 홍조 #f09a9a |
| 언더웨어 | 남 #5a6b8a · 여 #d88aa0 (여성은 상의 속옷 포함) |

---

## 6. 레이어 (아래 → 위) — 장비는 전부 별도 레이어

`hairBack → skin → underwear → pants → shirt → outer → shoes → gloves → edges(음영·외곽) → pack → face → hairFront → hat → headShape(얼굴형 깎기) → held`

| 레이어 | 종류(kind) |
|---|---|
| 머리 모양 8 | short · bob · pony · long · buzz · curly · braid · topknot |
| 상의 | tee · shirt · hoodie · knit |
| 하의 | jeans · shorts · waders(가슴장화, 멜빵) · skirt |
| 신발 | sneakers · boots · rubber |
| 모자 | cap · beanie · sun · bandana · visor |
| 겉옷 | vest · apron · jacket |
| 손 도구 | rod · net · crate · gaff |
| 기타 | gloves(불) · pack(불) |

- 게임은 이 레이어를 **코드로 합성**하므로, 외부 생성 시에는 (a) 바닐라 시트 1장 + (b) 장비별 **투명 오버레이 시트**로
  나눠 뽑는 것이 정합에 유리하다. 오버레이는 같은 32×32 격자·같은 앵커에 맞춘다.

---

## 7. 스타일 제약 (게임 세계관 정합)

- 픽셀 퍼펙트, 안티에일리어싱 없음, 그라데이션 없음(3단 셰이드만).
- 2px 그레인 — 지면 타일(Kenney 16px ×2)과 같은 입자.
- 이모지·장식 특수문자 없음. 배경 투명 PNG.
- 실사 텍스처 금지(어종 실사는 예외지만 캐릭터는 도트).
- 색은 위 팔레트 안에서. 새 색이 필요하면 팔레트 표에 먼저 추가.

---

## 8. 복붙용 프롬프트 초안 (영문 — 이미지 생성기용)

```
Top-down 2D pixel-art character sprite sheet for a Korean coastal fishing life-sim.
Sheet: 5 columns × 4 rows of 32×32 px cells (160×128 px total), transparent background.
Rows = facing down, left, right, up. Columns = idle, walk-A contact, walk-A pass, walk-B contact, walk-B pass.
Body occupies y=3 (top of head) to y=28 (sole) inside each cell; horizontal center x=16.
Proportions: head 9 rows × 10 px (oval jaw: bottom two rows inset 1 then 2), torso 7 rows × 10 px,
hips 3 rows, legs 10 rows (3–4 px wide each). Side view: head 9 px wide, protrudes 1 px forward of torso,
single 2×2 eye near the front, 1-px nose at eye level, mouth 1–2 px at the front edge, back of skull fully covered by hair.
Walk cycle: contact frames spread legs with 1-px weight sway; pass frames lift one foot by 2 px. Hips stay fixed; only feet swing.
Style: strict pixel-perfect, no anti-aliasing, 2-px grain, 3-step shading only, 1-px dark outline #2a2435.
Base ("vanilla") = nude with underwear only (male briefs #5a6b8a; female bra+briefs #d88aa0). No clothes, no shoes.
Skin #e8b489 (light #f6d3b0 / shadow #d19a6e). Hair short, #2e2833. Eyes: 1-px dark lid line, 1 white + 1 iris (#3a2a22) pixel.
Cute, friendly, Stardew-Valley-like proportions but smaller head (head narrower than shoulders).
Deliver as PNG, exact 160×128, cells aligned to the grid, no border, no labels.
```

변형 프롬프트 팁: 성별(`female: add 1-px lashes, narrower torso 8 px, hips 9 px`), 얼굴형(`round jaw`/`square jaw`),
피부·머리 색은 §5 팔레트 hex를 그대로 바꿔 넣는다. 장비는 `same grid, transparent overlay only: denim jeans #3d5a80 …`로 별도 요청.
