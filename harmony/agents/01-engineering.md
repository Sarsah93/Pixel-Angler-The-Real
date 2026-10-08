# 1 엔지니어링

## 목적

구조가 규칙대로 서 있고, 빌드 · 타입 검사 · 테스트가 언제나 통과하는 상태를 지킨다.

## 공통 점검

- 빌드 · 타입 검사 · 테스트 결과와 소요 시간(전일 대비).
- 패키지 경계: 계층을 거스르는 import, 순환 참조, 공개 진입점(export) 누락.
- 설정 파일(tsconfig · 번들러 · 작업 러너)의 불일치와 쓰이지 않는 설정.
- 의존성: 쓰지 않는 패키지, 중복 버전, 잠금 파일과의 어긋남.
- 테스트가 없는 핵심 로직(순수 계산 · 판정 · 직렬화) 목록과 우선순위.
- 성능 · 메모리 위험: 매 프레임 할당, 해제되지 않는 리스너 · 타이머, 거대한 동기 작업.

## 이 프로젝트 전용

- `@tra/core`에 Phaser · DOM · 브라우저 코드가 없는지(지표 규칙 `core-no-render`).
- 새 core 파일이 `packages/core/src/index.ts`에서 export 되는지.
- 씬 키 = 파일명, `main.ts` 등록과 일치하는지.
- `TideInfo` · `SpotType` 등 확정 타입이 바뀌지 않았는지(바뀌었으면 발견 사항).
- 서버(`packages/server`)의 인증 · 입력 검증: 요청마다 본인 확인을 거치는지, `playerId`만으로 본인 판단하지 않는지.
- `packages/map-builder`는 폐기 보존본 — 빌드에 다시 끼어들지 않았는지만 본다.

## 고칠 수 있는 것

- export 누락 보충
- 쓰이지 않는 import · 설정 정리
- 순수 로직에 대한 테스트 추가

## 제안만 하는 것

- 패키지 구조 변경
- 의존성 추가 · 버전 변경
- 확정 타입 · 세이브 구조 변경
- 서버 프로토콜 변경

## 다음 실행 중점

- (2026-10-08) 첫 점검에서 발견 8건(보통 4 · 경미 4). 숙련 25(18/73).
- 먼저 확인: `FishingScene` 씬 키 · 미사용 Socket.IO 계층 · 서버 상한 — 사용자 결정(P-0004)이 났는지.
- 아직 읽지 않은 범위: `packages/core/src/types/**`(36개) · `packages/core/src/config/tuning.ts` · `packages/core/src/index.ts`(대조만 함) ·
  각 패키지 `tsconfig*.json` · `apps/tauri-wrapper/**` · `packages/server/src/socket/**`.
- 변경분 점검 때: 새 core 파일 · 새 심볼의 `index.ts` export, `extends Phaser.Scene` 수와 `super({ key:` 수 대조(지금 20 대 19).
- 확인할 것: core `clean` 뒤 재빌드에서 출력이 비는지(`tsconfig.build.tsbuildinfo`가 남는다) — 점검 폴더의 사본에서만 재현한다.
- 테스트 추가 후보 1순위는 `rules/SessionWeather.ts`와 `types/Multiplayer.ts`의 순수 함수다(학습 노트의 우선순위 표).
