# ③ 플레이 흐름·예외 처리

## 목적

창 · 씬 · 놀이를 **어떤 순서로 열고 닫고 끊어도** 멈추거나 상태가 꼬이지 않게 한다.

## 왜 이 갈래가 있나 (사용자 예시)

- 278차: 채집 놀이 도중 ESC를 누르자 오류 문구가 뜨고 화면이 멈췄다(닫힌 창의 가이드가 `build()`를 다시 불렀다).
- 266차: 탭을 오래 비웠다 돌아오면 화면이 검었다(WebGL 컨텍스트 유실 뒤 다시 굽지 않음).
- 267차: 집 안에서 ESC가 밖으로 내보냈다 · 대화창 글이 겹쳤다.

## 보는 것 (질문)

1. 창을 열고 닫고 다시 여는 것을 되풀이하면 **오류 · 남은 입력 잠김 · 겹친 창**이 생기는가?
2. 페이드 · 전환 중에 **다시 누르면** 검은 화면 · 이중 차감 · 이동 잠김이 생기는가?
3. 놀이 · 작업 장면 · 가이드가 **서로 겹치거나 끊기면** 어떻게 되는가?
4. 시간 경계(자정 · 말일 · 계절 · 꺼 둔 시간 · 기기 시간대)에서 판정이 튀는가?
5. 외부 데이터가 **실패 · 지연 · 이상한 응답**이면 게임이 버티는가?
6. 세이브가 **깨졌거나 비었을 때** 알려 주는가, 조용히 빈 슬롯이 되는가?

## 방법

- **하네스 우선**: `tools/harness_start.cjs`. 창 목록은 `.agents/REFERENCE.md` §2(필드 단축키).
  ESC · 닫기는 패널 메서드나 씬 `popupStack`으로 부른다(`page.keyboard`는 아래 씬까지 움직인다).
- 네트워크 실패는 Playwright `page.route`로 흉내 낸다 — **외부 호스트에 실제 부하를 주지 않는다**.
- 시간은 게임 시계 필드를 되감거나(`lastTickMs` 등) Date를 흉내 낸다. 기다리지 않는다(헤드리스 rAF는 느리다).
- 규칙: 스킬 `scene-transition` · `ui-panel` · `verify-render`의 함정 목록이 이 갈래의 기준표다.

## 이 프로젝트 전용

- 큰 씬: `scenes/RegionFieldScene.ts`(필드) · `HomeInteriorScene` · `FirstPersonFishingScene` · `WorldMapScene` · 가게 실내 씬들.
- 창: `ui/*Panel.ts`(DraggablePanel) · `ui/GuideTour.ts` · `ui/PrologueCoach.ts` · `ui/PauseMenu.ts` · `scenes/SceneFade.ts`.
- 외부 데이터: core `api-client/*` · `store/ExternalDataStore.ts`(Mock 폴백).
- 규칙 정규식: `no-bare-fadeout-wait` · `no-scene-start-field`(⚠ 지금 패턴은 `'FieldScene'`만 잡는다 — 정본 이름은 `RegionFieldScene`).

## 고칠 수 있는 것 (재현 + verify 통과 시 PR)

- 닫힌 창 · 파괴된 객체를 부르는 콜백 막기, 재진입 가드 리셋
- 실패 시 폴백 · 시간 초과 추가(동작이 「멈춤 → 버팀」으로만 바뀌는 것)
- 세이브 파싱 실패 알림

## 제안만 하는 것

- 씬 구조 · 전환 방식 변경, 큰 파일 분할
- 「완료된 시스템」의 설계 변경(의도한 동작으로 되돌리는 결함 수정은 된다)

## 다음 실행 중점

- (2026-10-27 v2 첫 판) S3-01(창 전부 열고 닫기) — 기준선을 만든다(창 수 · 오류 수 · 남는 잠김).
- 열린 발견: F-0007 · F-0016 · F-0054 · F-0055 · F-0059.
