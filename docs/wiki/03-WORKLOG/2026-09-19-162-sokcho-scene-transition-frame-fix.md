# 162차 — 속초 씬 전환 Phaser Frame 오류 근본 수정

| | |
|---|---|
| **날짜** | 2026-09-19 |
| **시스템** | `필드` `UI` `씬 전환` `인프라` |
| **트리거** | 사용자 실검증 — 홈타운에서 이동수단을 타고 속초로 출조할 때 `drawImage` 오류 반복 |
| **커밋** | 미커밋 |
| **빌드·타입체크** | core build PASS · client typecheck PASS · root build 3/3 PASS |

---

## 1. 배경 — 왜 했나

161차에서 TextureManager의 live Frame 삭제와 `init → create` 구간의 stale update를 정리했지만,
사용자 경로로 실제 `홈타운 → 이동수단 → 전국 지도 → 강원 속초 → 속초항`을 밟으면 같은
`Cannot read properties of null (reading 'drawImage')`가 남아 있었다. 따라서 속초 진입을 생략한
정적 확인이 아니라 실제 이동수단과 출조 확정까지 재현해 원인을 다시 좁혔다.

## 2. 원인 — 무엇이 문제였나

이번 오류의 직접 원인은 `RegionFieldScene` 인스턴스가 재사용될 때 퀘스트 방향표시용 UI 참조가
초기화되지 않은 것이었다.

1. 홈타운에서 `drawQuestArrow()`가 `questGuideG`, `questGuideLbl`, `pinArrowG`, `pinArrowLbl`을
   지연 생성한다.
2. 지역 전환의 display list shutdown에서 해당 Text의 CanvasTexture/Frame은 파괴된다.
3. 같은 Scene 인스턴스가 속초로 `restart`되지만 클래스 필드의 참조는 truthy로 남는다.
4. 속초 첫 `updateQuestGuide()`가 새 Text를 만들지 않고 이전 `questGuideLbl.setText()`를 호출한다.
5. 파괴된 Frame의 `data`가 null인 상태에서 Phaser `Frame.updateUVs()`가 `data.drawImage`를 읽어
   전역 런타임 오류와 멈춤을 일으킨다.

즉 161차에서 막은 TextureManager 삭제 경로와 별개로, **파괴된 Phaser GameObject 참조 자체를
다음 씬이 재사용하는 UI 세대 수명 버그**가 남아 있었다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` | `init()`에서 퀘스트 화살표·핀·타이틀·캐스팅·편집기 등 지연 GameObject 참조와 관련 상태를 새 세대 기준으로 초기화. |
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` | 필드 이벤트·과증식 시스템·채집/통발/화구 시스템 shutdown을 현재 필드가 아닌 생성 시점의 owned 객체만 정리하도록 변경. |
| 정리 | `packages/client-pc/src/game.ts` | 원인 추적을 위해 임시로 넣었던 Phaser Frame prototype 진단 래퍼를 제거. 일반 오류 배너와 런타임 방어만 유지. |
| 문서 | `docs/wiki/02-SYSTEMS/ui-framework.md` | Scene 재사용 시 지연 생성 UI 참조를 세대 초기화해야 한다는 함정과 검증 순서를 추가. |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S2/S7 필드 → RegionFieldScene restart → 지연 생성 HUD Text → Phaser CanvasTexture/Frame`에 걸친
씬 수명주기 작업이다. 게임 규칙·저장 데이터·지도 데이터는 변경하지 않았다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 실제 이동 | 홈타운에서 방향키로 집 앞에서 버스까지 이동 | PASS; 버스 상호작용 `[F] 출조 버스 (전국 지도)` 확인 |
| 출조 흐름 | 전국 지도 → 강원 속초 → 속초항 → `예, 출조하기` | PASS |
| 속초 진입 | 속초 타이틀·상태 HUD·미니맵·플레이어·퀘스트 화살표 렌더 | PASS; 오류 배너 없음 |
| 전환 후 update | 속초 진입 후 추가 이동 및 1초 이상 대기 | PASS; `drawImage` 재발생 없음 |
| client | `pnpm.cmd --filter @tra/client-pc run typecheck` | PASS |
| core | `pnpm.cmd --filter @tra/core run build` | PASS |
| 전체 | `pnpm.cmd run build` | PASS; 3/3 성공, Vite chunk-size 경고만 표시 |
| diff | `git diff --check` | PASS; CRLF 변환 안내만 표시 |

## 6. 잔여 — 이번에 안 한 것

브라우저 콘솔을 사용자에게 노출하는 진단 래퍼는 최종 코드에서 제거했다. 이후 유사 회귀가 생기면
오류 배너에 내부 진단을 상시 붙이는 대신, 재현 시점의 Scene별 owned reference와 늦은 callback을
먼저 점검한다.

## 7. 위험·부작용

`init()`에서 이전 GameObject를 직접 destroy하지 않고 참조만 끊는다. 실제 display list 정리는
Phaser Scene shutdown이 담당하므로 이중 destroy와 다음 세대 객체를 이전 콜백이 파괴하는 위험을
줄인다. 지연 생성 UI는 새 `create()`에서 다시 만들어진다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/ui-framework.md` §6 갱신
- [x] `04-BACKLOG.md`의 반복 `drawImage` 회귀 항목과 정합 확인
- [x] `AGENTS.md` §9 요약 + 링크 갱신
- [x] `IMPLEMENTATION_PLAN.md` 최신 차수 갱신
- [x] 실제 이동수단 경유 속초 씬 전환 검증 완료
