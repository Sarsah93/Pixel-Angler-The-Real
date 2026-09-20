# 161차 — Phaser Frame 수명주기 회귀 수정

| | |
|---|---|
| **날짜** | 2026-09-19 |
| **시스템** | `필드` `UI` `씬 전환` `인프라` |
| **트리거** | 사용자 버그 리포트 — 속초 이동 후 `Cannot read properties of null (reading 'drawImage')` |
| **커밋** | 미커밋 |
| **빌드·타입체크** | core build PASS · client typecheck PASS · root build 3/3 PASS |

---

## 1. 배경 — 왜 했나

초상화 수정 후 사용자가 속초로 이동할 때 브라우저에 다음 오류가 반복된다고 보고했다.

> `Cannot read properties of null (reading 'drawImage')`

게임은 씬 전환 직후 멈추며, 이전의 `sourceImage`/Canvas 컨텍스트 존재 여부만 검사하는 방어선으로는 회귀를 막지 못했다.

## 2. 원인 — 무엇이 문제였나

Phaser 번들 `Frame.updateUVs()`의 실제 실패 지점은 `this.data.drawImage`였다. 즉 캔버스의
`CanvasRenderingContext2D`만 null인 문제가 아니라, TextureManager에 키가 남아 있어도 해당
`Frame`이 이미 `destroy()`되어 `Frame.data === null`인 상태였다.

확정된 위험 경로는 세 가지다.

1. `SeamlessChunks`가 청크 언로드·재베이크 때 `TextureManager.remove()`로 지붕 텍스처를 즉시 삭제했다.
   전환 중 한 프레임 남은 Image/RenderTexture가 같은 Frame을 계속 참조할 수 있었다.
2. `CharacterSprite`가 같은 동적 캐릭터·초상 키를 `remove → recreate`했다. 이전 씬의 Image가
   폐기된 Frame을 들고 있는 동안 같은 키가 재사용될 수 있었다.
3. 같은 `RegionFieldScene` 인스턴스가 `init()`과 `create()` 사이에 있을 때 `update()`가 먼저 실행되면,
   이전 player/chunk 참조를 새 지역 데이터와 함께 만질 수 있었다.

따라서 단순히 `drawImage` 호출을 try/catch하는 것이 아니라, live Texture를 파괴하지 않고 세대 키를
분리하며, 새 `create()`가 준비될 때까지 필드 루프를 잠그는 것이 근본 수정이다.

## 3. 변경 — 어디를 어떻게

| 구분 | 위치 | 내용 |
|---|---|---|
| 수정 | `packages/client-pc/src/ui/CanvasTextureGuard.ts` | source/context뿐 아니라 요청한 Frame의 존재·`data.drawImage`·`source.image`까지 검증. 존재하지 않는 프레임명이 첫 프레임으로 fallback되는 것도 차단. |
| 수정 | `packages/client-pc/src/ui/CharacterSprite.ts` | 동적 키를 삭제하지 않고, 폐기된 키가 있으면 세대 suffix 키를 발급해 재생성. |
| 수정 | `packages/client-pc/src/scenes/SeamlessChunks.ts` | 청크 언로드·재베이크의 `textures.remove()` 제거. 씬 인스턴스 namespace를 포함한 지붕 텍스처 키를 사용하고 display object만 해제. |
| 수정 | `packages/client-pc/src/ui/SashimiPanel.ts` | 손질 패널 destroy 시 베이크 텍스처를 즉시 삭제하던 마지막 live Frame 제거 경로도 차단. |
| 수정 | `packages/client-pc/src/scenes/RegionFieldScene.ts` | `init → create` 및 shutdown 직전의 stale `update`를 `bootFailed`/`playerBody.active` 가드로 차단. |
| 수정 | `docs/wiki/02-SYSTEMS/ui-framework.md` | Phaser Frame 수명주기 불변조건과 검증 순서 기록. |
| 수정 | `docs/wiki/04-BACKLOG.md` | 반복된 씬 전환 `drawImage` 회귀를 완료 항목으로 반영. |

## 4. 구조상 위치 — 어느 계층의 무엇인가

`S2/S7 필드 → 심리스 청크 스트리밍 → 동적 CanvasTexture 수명주기`와
`S10 UI → 캐릭터·초상 동적 텍스처`에 걸친 렌더·씬 수명주기 작업이다.
게임 규칙이나 저장 스키마는 건드리지 않았고, Phaser TextureManager와 Scene update 순서만 수정했다.

## 5. 검증 — 무엇으로 확인했나

| 대상 | 방법 | 결과 |
|---|---|---|
| Frame guard | `hasUsableTexture()`가 실제 Frame과 지정 frame name을 검사하는지 정적 확인 | 통과 |
| 삭제 경로 | `packages/client-pc/src`에서 texture remove 전수 검색 | 실행 코드 0건 (주석의 원인 설명만 잔존) |
| core | `pnpm --filter @tra/core run build` | PASS |
| client | `pnpm --filter @tra/client-pc run typecheck` | PASS |
| 전체 | `pnpm run build` | 3/3 PASS; Vite 번들 크기 경고만 기존대로 표시 |
| 브라우저 | dev 서버 새 게임 → 캐릭터 생성 → 혼잣말 → 필드 복귀, 초상화 렌더 | PASS; 오류 배너 없음. 속초 전환은 사용자 재현 경로로 후속 수동 확인 필요 |

## 6. 잔여 — 이번에 안 한 것

속초 이동을 자동으로 끝까지 재현하는 전용 하네스는 이번 범위에 만들지 않았다. 사용자 세션에서
실제 이동 동작을 다시 확인할 수 있도록, 다음 수동 검증에서는 `홈타운 → 속초` 전환 직후
오류 배너와 콘솔 `pageerror`가 없는지 확인한다.

## 7. 위험·부작용

동적 지붕·캐릭터·초상 텍스처를 TextureManager에서 즉시 삭제하지 않으므로 장시간 플레이 시
텍스처 캐시가 증가할 수 있다. 대신 키는 씬 인스턴스·생성 세대로 분리되어 stale Frame 재사용을
막는다. 향후 Phaser의 안전한 texture GC 시점을 도입할 때는 display list와 GPU batch가 완전히
비워진 뒤 별도 큐에서 처리해야 한다.

## 8. 후속 반영

- [x] 시스템 페이지 `02-SYSTEMS/ui-framework.md` §6 갱신
- [x] `04-BACKLOG.md` 갱신
- [x] `AGENTS.md` §9 요약 3~5줄 + 링크
- [x] `IMPLEMENTATION_PLAN.md` 최근 차수 갱신
- [x] 새 함정 — live Frame 사용 중 `TextureManager.remove()` 금지 — 시스템 페이지 §6 기록
