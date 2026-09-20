# 158차 — 초상화 클리핑 · 퀵 퀘스트 독립 크기 · 심리스 렌더 가드

| | |
|---|---|
| **날짜** | 2026-09-19 |
| **시스템** | `대화 UI` `HUD` `필드` `씬 전환` |
| **트리거** | 실검증 캡처 3건 · 사용자 지시 |
| **커밋** | 미커밋 |
| **빌드·타입체크** | core build 통과 · client-pc typecheck 통과 |

---

## 1. 배경 — 왜 했나

실검증에서 대화 초상이 프레임 아래 우호도·이름 영역을 침범했고, 미니맵을 키우면 우측 하단의 「지금 할 일」 패널도 함께 커졌다. 심리스 맵 재진입 뒤 `Cannot read properties of null (reading 'drawImage')`가 전역 예외 배너로 노출되어 필드가 멈추는 문제도 확인됐다.

## 2. 원인 — 무엇이 문제였나

- 초상 이미지는 32×32 전용 래스터를 표시했지만 프레임 내부 클리핑이 없어 투명 여백·어깨 영역이 인접 UI로 번질 수 있었다.
- 퀵 퀘스트 폭을 `miniDispW + 10`으로 계산해 미니맵 크기와 같은 폭 체인을 탔다.
- 심리스 청크의 CanvasTexture 원본/2D 컨텍스트가 씬 전환 중 해제된 뒤에도 늦은 베이크가 실행될 수 있었고, `getSourceImage()`·`getContext()` null 방어가 부족했다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `packages/client-pc/src/ui/DialoguePanel.ts` | 초상 전용 GeometryMask를 프레임 안에 적용하고 우호도 바와 분리선을 추가 |
| 수정 | `packages/client-pc/src/ui/RegionHud.ts` | 퀵 퀘스트를 미니맵 폭과 분리하고 자체 `−`/`+` 3단계 폭 조절 버튼 추가 |
| 수정 | `packages/client-pc/src/scenes/SeamlessChunks.ts` | 해제된 이미지·Canvas 2D 컨텍스트·RenderTexture 접근 가드와 idempotent destroy 추가 |
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` | 재진입 시 이전 심리스 청크·교통·충돌 그룹을 참조 해제 전 실제 정리 |

## 4. 구조상 위치 — 어느 계층의 무엇인가

초상화 자체(`FacePortrait.ts`)는 157차에 이미 업데이트된 32px 전용 픽셀 렌더러다. 이번 158차는 그 렌더러를 교체하지 않고 소비처인 대화창 레이아웃과 클리핑을 고쳤다. HUD는 미니맵과 퀵 퀘스트를 서로 다른 컨테이너·크기 상태로 관리한다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| 코드 | `git diff --check` | 통과 |
| core | `pnpm --filter @tra/core run build` | 통과 |
| client | `pnpm --filter @tra/client-pc run typecheck` | 통과 |
| 브라우저 | Vite dev 서버에서 신규 세이브 → 홈타운 필드 → 혼잣말 대화창 진입 | 초상 프레임 안 클리핑 확인 · 오류 로그 없음 |
| 브라우저 콘솔 | `error`/`warn` 확인 | 기존 `InventoryStore` 시드 용량 경고만 존재, `drawImage` 오류 없음 |

## 6. 잔여 — 이번에 안 한 것

- 사용자가 캡처한 속초 심리스 맵까지의 실제 이동 경로는 새 세이브 QA에서 재현하지 않았다. 속초 진입·홈타운 재진입을 수동으로 한 번 더 확인할 것.
- 초상 PNG를 GPT Image로 교체하지 않았다. 현재 문제는 이미지 생성 품질보다 프레임 경계·클리핑 문제였고, 기존 동일 `CharConfig` 픽셀 렌더러를 유지했다.

## 7. 위험·부작용

- 퀵 퀘스트 패널은 현재 씬 세션 동안만 자체 폭 단계를 유지하며, 별도 세이브 설정에는 저장하지 않는다.
- CanvasTexture를 사용할 수 없는 순간에는 해당 청크 베이크만 건너뛰고 필드 전체 렌더 루프는 계속된다. 일시적으로 청크가 비어 보이면 씬 재진입으로 복구된다.

## 8. 후속 반영

- [x] 초상화 프레임 클리핑
- [x] 퀵 퀘스트 독립 크기 버튼
- [x] `drawImage` null·씬 재진입 방어
- [ ] 속초 심리스 맵 왕복 수동 재검증

## 9. 속초 멈춤 후속 패치

사용자 재검증에서 속초 진입 멈춤이 계속되어 방어 범위를 확장했다.

- `RegionFieldScene` 재진입 시 이전 `npcHintText`도 폐기해, 이전 씬의 파괴된 Text/CanvasTexture에 `setText()`가 호출되지 않게 했다.
- `SeamlessChunks`의 `CanvasTexture.refresh()`를 `safeRefresh()`로 감싸 backing canvas가 사라진 경우 해당 텍스처만 폐기한다.
- 텍스처 준비 단계(`ensureDecoTextures`, `ensureGroundTextures`)의 예외를 씬 생성 밖으로 전파하지 않게 했다.
- 청크 `clear/batchDraw`를 포함한 전체 베이크를 최종 방어 래퍼로 감싸 문제가 난 청크만 건너뛰고 필드 업데이트를 계속한다.
- 수정 후 `client-pc typecheck` 통과. 속초 실제 왕복은 사용자의 로컬 수동 경로에서 재확인 필요.
