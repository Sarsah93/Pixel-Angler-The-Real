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

- (2026-10-08) 첫 점검에서 발견 11건(보통 6 · 경미 5). 숙련 65(15/23).
- **2026-10-12(월)에 외부 서비스 공지를 처음 확인한다**(기상청 단기예보 · 해양측위정보원 · 해양조사원 낚시지수 · 농정원 경락가 · 통계청 KOSIS).
  확인하지 못하면 그렇게 적는다.
- 아직 읽지 않은 범위: `WeatherApiClient.ts` · `OceanApiClient.ts` · `PublicDataClient.ts` · `api-client/mock/*` · `MarineStations.ts` ·
  `KmaGridPoints.ts` · `store/EnvironmentStore.ts` · `tools/fetch_*.py`의 나머지.
- 대기열에 있는 수정: `.env.example` 이름 보강(값은 비운다). 시간 초과 방어와 mock 덮어쓰기 방지는 동작이 바뀌므로 제안(P-0005).
- 환경 변수는 이름만 적는다. 지표의 `env` 목록은 오탐이 섞이므로 grep으로 다시 대조한다(학습 노트의 분류).
