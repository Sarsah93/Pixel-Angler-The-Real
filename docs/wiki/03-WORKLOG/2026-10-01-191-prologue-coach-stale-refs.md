# 191차 — 프롤로그 말풍선 코치 · 상단 「지금 할 일」 띠 폐지 · 씬 재사용 파괴 객체 참조 전수 정리

| | |
|---|---|
| **날짜** | 2026-10-01 |
| **시스템** | `UI` `가이드` `스토리` `홈` `씬 전환` |
| **트리거** | 사용자 실검증 리포트 (190차 배포 26차) |
| **커밋** | 이 워크로그와 같은 커밋 |
| **빌드·타입체크** | 3/3 · 0 오류 |

---

## 1. 배경 — 왜 했나

사용자 실검증 리포트(원문 요약 인용):

1. 「순차적으로 말풍선 진행되는데, 가방에 하이라이트 테두리가 두 개 겹쳐서 그려지고 있어. 뭔가 순서가 안맞는 것 같아.」
   - 걷기·뛰기 단계는 상호작용할 대상이 없으니 **말풍선 꼬리(화살표)가 필요 없다**.
   - 소파 앉기 단계에서 **침대 발치 낚시 상자도 노란 테두리**로 보인다 — 다른 단계가 진행 중인데 동시에 뜨는 것은 버그.
   - 앉기 단계 문안을 「앉아 있을 때, 실시간으로 고를 수 있는 다른 행동을 취할 수 있다. 계속 쉬려면 그대로 두면 된다.
     [일어나기]를 선택해서, 다시 일어나자.」로 바꾸고, 소파가 화면 왼편이니 **말풍선도 왼편**에.
   - 상자 열기: 테두리 중복 정리 · 상자를 열고 나면 **가방이 사라지거나, 계속 쓰는 도구(= 인벤토리를 이 가방으로 얻는 형태)** 로.
     이어서 **오른편에 꼬리 없는 말풍선**으로 「단축키 [I] 키를 눌러, 인벤토리를 열어 보자. 가방에서 얻은 아버지의 장비를 확인해보자.」
   - 「오른손 착용 · 왼손 착용」 단계의 말풍선을 **아이템 높이까지** 올릴 것.
   - 낚싯대 착용 뒤 **「나머지 릴도 장착해 보자」** 까지 매듭지을 것.
   - **일지 펼치기부터 뒤 과정까지도 계속 말풍선으로** 가이드할 것.
2. 「화면 상단에 '지금 할 일 · 아버지의 낚시 상자를 연다 / 집 안 침대 발치의 낚시 상자 앞에서 [F]' 나열하듯이
   … 이런 UI/UX 표현형은 안쓰기로 했잖아. … 저걸 차라리 없애는 게 나을 것 같다.」
3. 「진행하다가 중간에 esc를 누르고 나가니까, 방 밖(마당)으로 나가졌어. 그 상태에서 게임을 끈 뒤에, 새로하기로
   기존 세이브 데이터를 지우고, 캐릭터 만들기로 넘어왔더니 캐릭터 생성 화면에서 멈추고 Image 에러가 생겼어.
   (아마 세션 간 차단 로직의 경로 설계가 타이트하지 않은 것 같으니 한 번 전수 조사해서 찾아내)」
   — 배너 문구: `Cannot read properties of null (reading 'drawImage')`.

## 2. 원인 — 무엇이 문제였나

**(가) 테두리 두 겹** — 첫 걸음 가이드(`GuideTour`)의 금색 테두리와, 188차 「지금 할 일」 자리 표시(`drawObjectiveSpot` —
프롤로그 첫 목표가 상자면 **어느 가이드 단계든** 상자를 짚었다)가 따로 그렸다. 상자 단계에서는 둘이 겹쳐 이중 테두리,
소파 단계에서는 상자 쪽 표시가 혼자 떠 「다른 요구가 동시에 뜨는」 것으로 보였다.

**(나) 캐릭터 만들기 멈춤** — 확정. 재현 하네스(`repro191.cjs`)로 사용자 경로를 그대로 밟아 같은 스택을 얻었다.

```
TypeError: Cannot read properties of null (reading 'drawImage')
  at Frame.updateUVs → Frame.setCutPosition → Frame.setSize → Text.updateText
  at TextStyle.setColor → Text.setColor → CharacterCreateScene.setProgress
```

- Phaser 씬 인스턴스는 **재사용**된다. `CharacterCreateScene.progressText`는 `if (!this.progressText)`로 지연 생성되는데
  `create()`가 비우지 않았다. 같은 탭에서 두 번째로 캐릭터를 만들면 [이대로 생성하기] → `setProgress`가
  **직전 세대의 파괴된 Text**를 갱신 → 위 스택으로 멈춘다(`starting = true`로 남아 버튼도 다시 안 먹는다).
- ESC로 집을 나간 것 자체는 원인이 아니다 — 「첫 생성 → 타이틀 → 새로하기 → 생성」이면 어느 경로로든 재현된다
  (하네스: 수정 전 1/1 재현, 수정 후 0).

**(다) 같은 부류 전수 조사** — 모든 씬의 GameObject 필드를 「create/init에서 다시 대입되는가」로 정적 스캔(스크립트)한 뒤
지연 생성(`if (!this.x)`)·옵셔널 사용(`this.x?.`)인 것만 손으로 확인했다. 실제로 걸린 것:

| 씬 | 필드 | 증상 |
|---|---|---|
| `CharacterCreateScene` | `progressText` (+ 프리뷰·라벨 참조) | 위 (나) — 멈춤 |
| `WorldMapScene` | `areaConfirmContainer` | 출조 [예] 뒤 비우지 않음 → 월드맵 재진입 시 `if (this.areaConfirmContainer) return`으로 **구역 확인 카드가 다시 안 열림** |
| `RegionFieldScene` | 면허·스킬·일지·도움말·쿨러·거래·상호작용 창, 얼음 하역 표식, 컷씬, 채팅 입력 | 창을 연 채 씬이 재시작되면 다음 단축키가 파괴된 창을 「닫기」로 처리(두 번 눌러야 열림) · 컷씬 참조가 남으면 `startCinematic` 거부 |
| `FieldScene`(레거시) | 미끄럼 경고·채집 창·면허 창 | 남으면 입력 게이트가 영구히 닫힘 |
| `GuideTour` 대기열 | 다른 가이드 뒤에 줄 선 요청 · 다음 프레임 열기 리스너 | 씬이 내려가도 남아, **다음 세대에서 파괴된 창을 붙잡은 build**가 실행될 수 있었다 |

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 신설 | [`ui/PrologueCoach.ts`](../../../packages/client-pc/src/ui/PrologueCoach.ts) | 프롤로그 말풍선 코치 — 씬이 매 프레임 「지금 단계」(`CoachStage`)를 넘기면 그 말풍선 하나를 띄우고, 단계가 바뀌면 접는다. passive(세상 안 체험) · `ephemeral`(플래그 없음) · 다른 가이드가 떠 있으면 끼어들지 않음(`GuideTour.busy`) · 씬 pause/sleep에 접힘 |
| 수정 | [`ui/GuideTour.ts`](../../../packages/client-pc/src/ui/GuideTour.ts) | 단계 옵션 `side`('left'/'right'/'auto') · `alignTo`(말풍선 세로 기준) · `dockY` · 옵션 `ephemeral` · `busy`/`blocking`/`dismiss()` · **짚는 대상이 없으면 꼬리 없음** · 한 단계짜리는 쪽수(1/1) 숨김 · 대기열·다음 프레임 리스너를 씬 shutdown에 정리 |
| 수정 | [`scenes/HomeInteriorScene.ts`](../../../packages/client-pc/src/scenes/HomeInteriorScene.ts) | 상단 「지금 할 일」 띠·금색 자리 표시 **삭제** → 코치 단계(상자 → [I] → 대 → [E]·릴 → 사진 → [J] → 냉동고 오징어 → 침대 저장 → 현관 매트) · 앉기 문안 교체 + 말풍선을 소파 쪽에 · 상자 = 가방(연 뒤 방에서 치움, 구세이브는 입장 때 정리) · **저장 전에는 ESC·매트로 나가지 않음**(「아직 집에서 챙길 것이 남았다.」) |
| 수정 | [`scenes/RegionFieldScene.ts`](../../../packages/client-pc/src/scenes/RegionFieldScene.ts) | 코치 단계(우물 → [S] → [M] → 막차 → 직판장 구매(남은 품목) → 오징어 판매) · `uiBlocked`·Enter 채팅 게이트를 `GuideTour.blocking`으로(세상 안 말풍선은 캐릭터를 멈추지 않는다) · init에서 토글 창·컷씬·표식·채팅 입력 참조 리셋 |
| 수정 | [`ui/InventoryPanel.ts`](../../../packages/client-pc/src/ui/InventoryPanel.ts) | `itemGuideRect(id)`(그 칸 또는 그 탭) · 착용 단계 말풍선을 아이템 높이에(`alignTo`) |
| 수정 | [`ui/EquipmentPanel.ts`](../../../packages/client-pc/src/ui/EquipmentPanel.ts) | `slotGuideRect(key)` 공개 |
| 수정 | [`store/HomeStore.ts`](../../../packages/client-pc/src/store/HomeStore.ts) | `discard(id)` + 세이브 `discarded` — 방에서 아주 치운다(로드가 기본 배치로 되살리지 않는다 · 구세이브는 `prologue.box` 플래그로 입장 때 정리) |
| 수정 | [`scenes/CharacterCreateScene.ts`](../../../packages/client-pc/src/scenes/CharacterCreateScene.ts) · [`WorldMapScene.ts`](../../../packages/client-pc/src/scenes/WorldMapScene.ts) · [`FieldScene.ts`](../../../packages/client-pc/src/scenes/FieldScene.ts) | create에서 지연 생성 참조 리셋 (2절 표) |
| 수정 | [`game.ts`](../../../packages/client-pc/src/game.ts) | `installStaleTextGuard` — 마지막 방어선: 파괴된 Text의 `updateText`는 건너뛰고 경고(스택)만 남긴다 |
| 수정 | `tools/capture_help_images.cjs` · `tools/annotate_help_images.py` | `help_prologue` 촬영에서 구 띠 갱신 호출 제거 · 콜아웃 ① 띠 삭제(③개로) — ko/en 재촬영 |
| 수정 | `i18n/en_home.ts` · `en_help.ts` · `data/HelpContent.ts` | 코치 문장 영문 25줄 + 구매 남은 품목 규칙 2 · 도움말 프롤로그 쪽 「지금 할 일 띠」 서술 교체 |

## 4. 구조상 위치

`UI 프레임워크 → 체험 가이드(188차) → 프롤로그 코치(상태 구동 단일 말풍선)` — **렌더·흐름 층**. 판정(프롤로그 목표 · `Prologue.ts`)은 그대로다.
파괴 객체 참조 정리는 `씬 전환 → 씬 재사용 수명` 층(계약 변경 없음).

## 5. 검증

| 대상 | 방법 | 결과 |
|---|---|---|
| 캐릭터 만들기 멈춤 | `repro191.cjs` — 새 게임 → 생성 → 집 → ESC → 타이틀 → 새로하기(덮어쓰기) → [이대로 생성하기] | 수정 전: 사용자 스택 그대로 재현 · 수정 후: pageerror 0 · 필드·집 진입 |
| 첫 걸음 말풍선 | `pro191.cjs` 실렌더 | 걷기·뛰기 꼬리 없음 · 소파 단계 테두리 1개(상자 표시 없음) · 앉기 말풍선 x=14(왼편) · 상자 단계 테두리 1개 |
| 상자 = 가방 | 같은 하네스 | 연 뒤 `HomeStore.find('father_box')` = 없음 · 오른편 꼬리 없는 [I] 말풍선 |
| 코치 흐름(집·마당) | `pro191.cjs` — 새 게임부터 실제 단계 진행 | M1-01 목표 1→10 순서대로 닫힘 · 단계마다 해당 말풍선(`coach_bag` → 인벤 가이드 → `reel_open` → `reel_fit`(「릴」 칸 테두리) → `photo`(사진 칸) → `journal` → `squid` → `squid_take` → `save` → `save_menu` → `leave` → `well` → `status` → `map`) · pageerror 0 |
| 코치 흐름(속초) | `coach2.cjs` ko/en | 직판장 앞 왼편 말풍선 · 직판장 열면 상점 창과 가방 사이(x 506)에 남은 품목(「봉돌 · 찌 · 미끼」) · 창이 열리고 닫히면 자리 이동(`journal@70:510` ↔ `journal`) · 영문 규칙 적용 |
| 190차 회귀 | `home190.cjs` | 전 항목 통과 · 세이브 왕복 동일(`discarded` 포함) |
| 도움말 | `help_prologue` ko/en 재촬영 + 콜아웃 ①②③ | 띠 없음 · 테두리 1개 |
| 집 나가기 잠금 | ESC (저장 전) | 집에 남음 + 「아직 집에서 챙길 것이 남았다.」 |
| 빌드 | `pnpm run build` · `typecheck` | 3/3 · 0 오류 |

## 6. 잔여

- 필드의 「지금 할 일」 **창**(165차 사용자 요청 — HUD 오른편)은 그대로 둔다. 이번 지시는 집 안 화면 위쪽 띠였다.
  코치 말풍선과 같은 목표를 함께 보여 주는 중복이 거슬리면 프롤로그 동안 창을 접는 선택지가 있다(사용자 확인 대기).
- 월드맵(버스로 속초 고르기) 단계는 월드맵의 첫 열기 가이드가 맡는다 — 코치는 필드에서만 뜬다.

## 7. 위험·부작용

- 코치 말풍선은 `GuideTour.active`를 쥔다. 다른 창의 첫 열기 가이드는 코치가 접힌 뒤 열린다(단계가 바뀌면 바로 접힘).
  코치 단계 판정이 「창이 열렸다」에 반응하지 않는 단계에서 창 가이드가 오래 대기할 수 있다 — 각 단계는 창 열림에 맞춰 단계 키를 바꾼다.
- `installStaleTextGuard`는 원인을 숨길 수 있다 — 경고(`[StaleTextGuard]` + 스택)는 남기므로 콘솔로 출처를 찾는다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/ui-framework.md`·`story-quests.md` 갱신
- [x] `04-BACKLOG.md` 갱신
- [x] `AGENTS.md` §9 요약 + 링크 · `IMPLEMENTATION_PLAN.md` · `CLAUDE.md`
- [x] 새 함정 → `ui-framework.md` §6 · 스킬 `scene-transition`
