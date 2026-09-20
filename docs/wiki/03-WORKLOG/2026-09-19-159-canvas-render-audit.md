# 159차 — CanvasTexture 렌더 오류 전수조사

## 증상

캐릭터 생성 화면 또는 지역 전환 뒤 전역 오류 배너가 표시되며 게임이 멈췄다.

`Cannot read properties of null (reading 'drawImage')`

## 확인된 공통 원인

게임은 Phaser `CanvasTexture`를 게임 레벨 텍스처로 등록한다. 씬 전환·재시작 시 Phaser가 backing canvas/context를 먼저 해제할 수 있는데, 늦게 실행된 UI/베이킹 콜백이 다음 중 하나를 직접 호출하고 있었다.

- 해제된 context의 `drawImage`
- 해제된 CanvasTexture의 `refresh`
- TextureManager에 키만 남은 텍스처의 source image 사용

따라서 단일 NPC나 단일 지역의 문제가 아니라, 캔버스 텍스처를 만드는 모든 경로에서 같은 오류가 재발할 수 있는 구조였다. 캐릭터 생성 화면의 `ensureCharSheet`도 이 취약한 경로 중 하나였고, 심리스 지역의 재베이킹 및 이전 씬의 늦은 UI 갱신이 재현 가능성을 높였다.

## 적용한 변경

1. `ui/CanvasTextureGuard.ts`를 추가했다.
   - context/source 유효성 확인
   - `refresh()` 예외 흡수 및 진단 로그
   - 이미 파괴된 텍스처 정리
2. 캐릭터 시트·얼굴 초상 생성은 backing canvas가 무효하면 `__DEFAULT`로 폴백한다. 죽은 텍스처 키를 재사용하지 않는다.
3. 심리스 지형/타일/장식 텍스처의 모든 refresh 경로를 안전 갱신으로 통일했다.
4. 미니맵, 건물 변형, 해양생물, 픽셀 아이콘, 기절 오버레이, 손질/사시미 캔버스에도 같은 방어를 적용했다.
5. 전역 오류 배너는 사용자에게 짧게 표시하되, 콘솔과 `globalThis.__PIXEL_ANGLER_LAST_ERROR`에 오류 메시지·파일 위치·활성 씬·stack을 기록하도록 보강했다.

## 검증

- `npx pnpm --filter @tra/core run build` 통과
- `npx pnpm --filter @tra/client-pc run typecheck` 통과
- `git diff --check` 통과
- 브라우저에서 메인 메뉴 → 새 게임 → 저장 슬롯 → 캐릭터 생성 화면 진입 및 외형 변경 확인
- 해당 경로에서 새 `error` 로그 없음

## 별도 경고

`InventoryStore`의 “시드가 기본 용량(25)을 초과” 경고 1건은 기존 데이터 용량 정책 경고이며 이번 `drawImage` 예외와는 별개다. 아이템 누락/표시 정책을 정할 때 별도 처리한다.

