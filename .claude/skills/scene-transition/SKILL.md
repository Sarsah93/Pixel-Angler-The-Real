---
name: scene-transition
description: Pixel Angler Phaser 씬 전환·페이드 규칙 (SceneFade 안전망·pause/launch·stop/resume). 씬 전환 코드를 추가·수정하거나 검은 화면/멈춤/이중 전환 버그를 다룰 때 반드시 로드. "씬 전환", "fadeOut", "검은 화면", "camerafadeoutcomplete", "scene.launch", "복귀" 작업이면 이 스킬을 따른다.
---

# 씬 전환·페이드 규칙

## 전환 패턴 (절대 규칙 — AGENTS §4·§8)

**FieldScene/RegionFieldScene → 하위 씬 진입**: `pause` + `launch` (start 금지)
**하위 씬 → 복귀**: `this.scene.stop()`(인자 없이) + `this.scene.resume('FieldScene')`
**절대 금지**: 하위 씬에서 `scene.start('FieldScene')` — 필드가 재생성돼 플레이어 위치·상태 전부 초기화.
**필드 씬 create()**: `this.events.on('resume', () => fadeIn)` 필수 + resume 핸들러에서 `isTransitioning = false` 안전망.

## 페이드아웃 대기는 반드시 안전망 경유 (73차 전수 적용)

`camerafadeoutcomplete` **단독 대기 금지** — 진입 fadeIn이 진행 중일 때 fadeOut을 요청하면 Phaser FadeEffect가 요청을 조용히 무시해 완료 이벤트가 영영 안 옴 → 검은 화면 멈춤 (46·52·71차에서 반복).

- **일반 씬**: 공용 `scenes/SceneFade.ts`의 `fadeOutThen(scene, action, fadeMs?, rgb?)` 사용 — 폴백 타이머(fadeMs+150) + WeakSet 씬 단위 이중 실행 가드 내장.
- **대형 씬**(RegionFieldScene/WorldMapScene/MainMenuScene)은 자체 상태 정리(isTransitioning·charging 등)가 얽힌 **각자의 fadeOutThen을 유지** — 공용으로 갈아타지 말 것.
- 새 전환 지점을 추가할 때 bare `cameras.main.once('camerafadeoutcomplete', …)`를 쓰면 안 된다.

## 이중 실행·재진입 가드

- 전환 시작 시 `isTransitioning = true` + 재클릭/연타 무시. **씬 create()에서 반드시 리셋** — Phaser 씬 인스턴스는 재사용되므로 미리셋 시 2회차 진입부터 먹통 (73차 WorldMapScene: 출조 1회 후 먹통 + **요금 이중 차감**).
- 비용 차감·아이템 소모 같은 부수효과는 **가드 통과 후** 실행 (연타 시 이중 차감 방지).
- pause+launch 진입도 fadeOutThen 경유 시 `keepTransitioning=false`류 해제 시점 주의 — 복귀 후 이동 잠김 잔존 방지.

## 기타 규칙

- 씬 키 = 파일명. 신규 씬은 `game.ts` 씬 등록 목록에 추가 (main.ts 아님).
- ESC LIFO: 팝업이 열려 있으면 팝업부터 (RegionFieldScene popupStack — depth 최고 우선), 팝업 없을 때만 일시정지 메뉴/씬 이탈.
- 팝업 닫힘 직후 클릭 관통: 같은 프레임 pointerdown이 씬으로 흘러 캐스팅 힌트 등이 뜬다 — `suppressClickUntil` 유예(250ms, 1인칭 복귀 400ms) 패턴 사용.
- 검증: 전환 연타·fadeIn 중 재진입·왕복 2회차까지 실렌더로 확인 (verify-render 스킬 — 73차 검증 시나리오 참조).
