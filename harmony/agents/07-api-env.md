# 7 API·환경 설정

## 목적

연동 중인 외부 서비스와 설정값의 목록이 정확하고, 키 없이도 돌며, 비밀값이 새지 않게 한다.

## 공통 점검

- 연동 목록: 서비스 · 용도 · 호출하는 곳 · 인증 방식 · 실패 시 폴백 · 호출 빈도와 캐시.
- 환경 변수(이름만): 예시 파일에 있는데 안 쓰는 것, 쓰는데 예시에 없는 것(지표 `env`).
- 비밀값: 추적 중인 비밀 파일, 코드에 박힌 키(지표 `secret_suspects`) — 위치는 공개 기록에 쓰지 않는다.
- 클라이언트 번들에 들어가는 키(브라우저에 노출되는 접두사)의 적절성.
- 오류 처리: 시간 초과 · 재시도 · 한도 초과 · 응답 형식 변화에 대한 방어.
- 변경 · 종료 예고: 주 1회(월요일) 연동 서비스의 공지를 웹에서 확인한다. 확인하지 못했으면 그렇게 적는다.
- 추가 · 교체 후보: 지금 모의 데이터로 버티는 기능에 쓸 수 있는 공개 서비스.

## 이 프로젝트 전용

- 클라이언트: `packages/core/src/api-client/` 10개 파일(`KmaVilageFcstApiClient` · `MarineWeatherApiClient` · `MafraAuctionApiClient` ·
  `KosisCatchApiClient` · `FishingIndexApiClient` · `OceanApiClient` 등) — 첫 실행에서 서비스별 표로 정리한다.
- 키가 없으면 모의 데이터로 폴백하는지(`mock/` · `ExternalApiService`).
- `ExternalDataStore`는 시작 시 1회 `fetchAll()` 캐시 — 게임 루프에서 직접 호출하는 곳이 없는지.
- 배포본은 CORS 프록시가 필요하다(시스템 페이지 `economy-data.md`의 경고) — 서버 `api/WeatherProxy.ts` 상태.
- `VITE_` 접두사 키는 브라우저에 노출된다 — 예시 파일과 코드 사용 이름의 어긋남(`VITE_KMA_API_KEY` 등).
- Copernicus(CDSE) 인증은 빌드 도구(`tools/fetch_region_raster.py`) 전용 — 게임 번들에 들어가지 않는지.
- 공공데이터 출처 표기(`DataAttributions.ts`)가 연동 목록과 일치하는지.

## 고칠 수 있는 것

- `.env.example`의 변수 이름 · 설명 보강(값은 비워 둔다)
- 출처 표기 누락 보충
- 빠진 시간 초과 · 폴백 방어

## 제안만 하는 것

- 새 서비스 연동 · 교체
- 키 재발급 · 계정 설정(사용자만 할 수 있다)
- 프록시 · 서버 구성 변경

## 다음 실행 중점

- (조율자가 매일 갱신한다. 첫 실행 전이라 비어 있다.)
