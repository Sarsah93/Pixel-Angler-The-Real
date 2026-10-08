# 학습 노트 — 7 API·환경 설정

> 이 도메인에 대해 **지금 사실인 것**만 적는다(누적 금지 · 갱신). 추정은 "추정"이라고 쓴다.
> 400줄을 넘기지 않는다. 날짜별 경과는 `reports/`에 있다. 환경 변수는 **이름만** 적는다.

## 구조 — 연동 목록

| 클라이언트 | 기관 · 용도 | 호스트 | 인증(쿼리 ← 환경 변수 이름) | 호출 · 빈도 | 폴백 | 상태 |
|---|---|---|---|---|---|---|
| `KmaVilageFcstApiClient` | 기상청 단기예보 · 초단기실황 | `apis.data.go.kr/1360000` (HTTPS · CORS 허용) | `serviceKey` ← `VITE_DATA_GO_KR_API_KEY` | 시작 1회 + 1시간마다 · 11지역 × 2 | 날짜 시드 mock(`mock: true` 표식) | 실사용 |
| `MarineWeatherApiClient` | 국립해양측위정보원 76개소 | `marineweather.nmpnt.go.kr:8001` (HTTP 전용) | `serviceKey` ← `VITE_NMPNT_API_KEY` | 시작 1회 + 1시간마다 | `mockAll`(표식 없음) | 실사용 · dev 프록시 필요 |
| `FishingIndexApiClient` | 국립해양조사원 바다낚시지수 | `apis.data.go.kr/1192136` | `serviceKey` ← `VITE_DATA_GO_KR_API_KEY` | 시작 1회 | mock 4지점 | 실사용 |
| `MafraAuctionApiClient` | 농정원 수산물 경락가(이력) | `211.237.50.150:7080` (HTTP) | **URL 경로에 키** ← `VITE_MAFRA_API_KEY` | 시작 1회 · 순차 1~7회 | 날짜 시드 mock | 실사용 · dev 프록시 필요 |
| `KosisCatchApiClient` | 통계청 시도 · 어종 어획량 | `kosis.kr` (CORS 없음) | `apiKey` ← `VITE_KOSIS_API_KEY` | 시작 1회 | mock 16행 | 실사용 · dev 프록시 필요 |
| `AuctionPriceApiClient` | 농정원 경락(구) | 자리표시 주소 | `serviceKey` | 생성 0 | — | 미사용 |
| `WeatherApiClient` | 기상청 API허브 | `apihub.kma.go.kr` | `authKey` ← 서버 `KMA_API_KEY` | 서버 `/api/weather` | mock | 뼈대 |
| `OceanApiClient` | 국립해양조사원 조위 | `www.khoa.go.kr` | `ServiceKey` ← 서버 `KHOA_API_KEY` | 서버 `/api/tide` | 계산 물때 | 뼈대(응답 버림) |
| `PublicDataClient` | 공공데이터 낚시터 | 자리표시 주소 | `serviceKey` | 호출 0 | mock | 뼈대 |

- `ExternalApiService`는 낚시지수 · 경락가 · 어획량 묶음이다. 해양기상과 기상청은 `ExternalDataStore`가 직접 든다.
- 호출 지점은 `ExternalDataStore`(실사용)와 `EnvironmentStore`(죽은 경로) 둘뿐이다. 씬이 클라이언트를 직접 import하는 곳은 0이다.
- `fetchAll()`은 `MainMenuScene`에서만 부른다(Promise 공유 · 스냅샷 있으면 즉시 반환).
  `refreshLiveWeather()`는 `net/WeatherSync`가 몇 초마다 부르지만 1시간 칸 가드가 있다.
- Vite 설정에 `define` · `envPrefix` · `loadEnv` · `envDir`가 없다(기본 `VITE_` · 기준 폴더 `packages/client-pc`).
  `ExternalDataStore`가 `import.meta.env`를 통째로 읽어 빌드 때 있던 `VITE_*`가 전부 번들에 들어간다.
- dev 프록시 3개(`vite.config.ts`)는 `import.meta.env.DEV`일 때만 쓰인다. `server.host: true`라 같은 네트워크에 열린다.
- 서버 `WeatherProxy`는 클라이언트가 부르지 않는다(`VITE_API_BASE_URL` 사용 0). 고정 호스트라 열린 프록시는 아니다.
- 서버 환경 변수 이름: `SERVER_PORT` · `KMA_API_KEY` · `KHOA_API_KEY` · `MP_SESSION_DIR`.
- 빌드 도구: `tools/fetch_region_raster.py`(CDSE OAuth · 루트 `.env` 자체 파서 · 값 로그 금지 · 시간 초과 60 · 300초) ·
  `tools/fetch_region_osm.py` · `tools/backfill_hospital_poi.py`(Overpass · 인증 없음). 전부 파이썬이라 번들에 들어가지 않는다.
- `.gitignore`: `.env` · `.env.local` · `.env.*.local` · `dist/` · `.turbo/` · `*.tsbuildinfo` · `.mp-sessions/` · `pixelazed/_rastercache/` 무시.
- 출처 표기 10건 = 기상청 · 해양측위정보원 · 해양조사원 2(낚시지수 · 수심) · 농정원 · 통계청 · OSM · Copernicus · Kenney · FisherG.
  `CreditsScene`이 그린다. 어장정보(해양조사원 · data.go.kr 15130109)는 빠져 있다.

## 규칙과 함정

- 지표 `env` 수집기는 `import.meta.env.X` · `process.env.X` 꼴만 잡는다.
  `envKey('X')` 문자열 조회와 파이썬 자체 파서는 놓친다 — 이름 대조는 grep으로 다시 한다.
  - 예시에만 있다던 10개: 오탐 3(`CDSE_CLIENT_ID` · `CDSE_CLIENT_SECRET` · `VITE_NMPNT_API_KEY`) · 진짜 미사용 7.
  - 코드에만 있다던 7개: 오탐 2(`LOCALAPPDATA` · `RATES`) · 죽은 경로 3 · 폐기 패키지 1(`VWORLD_API_KEY`) · 선택 항목 1(`MP_SESSION_DIR`).
  - 수집기가 놓친 실연동 이름 3개: `VITE_DATA_GO_KR_API_KEY` · `VITE_MAFRA_API_KEY` · `VITE_KOSIS_API_KEY`.
- 클라이언트는 실패해도 **던지지 않고 mock을 돌려준다**. 호출 쪽의 `.catch`와 `size > 0` 판정은 실패를 못 가른다.
  기상청만 `mock` 표식이 있다(234차).
- 시간 초과와 재시도는 **어느 클라이언트에도 없다**. MAFRA의 7회는 휴장일 역탐색이다. 실패한 시간대는 다시 시도하지 않는다(`_liveTriedSlot`).
- HTTPS 배포본 예상 조합(추정): 기상청과 낚시지수만 실데이터 가능, 나머지 셋은 mock.
- MAFRA는 키가 URL 경로에 들어간다. 주소를 로그로 찍으면 키가 샌다(지금은 찍지 않는다).
- 기상청은 오류를 HTTP 200 + `resultCode`로, 해양기상은 HTTP 400 + `result.status`로 준다. 두 클라이언트 모두 본문을 확인한다.
- `.env`는 소비자마다 위치가 다르다: 클라이언트 키 → `packages/client-pc/.env`, CDSE → 루트 `.env`, 서버 → 서버 실행 폴더.
- 날씨 수집은 서비스 지역(2곳)이 아니라 격자표 11지역 전부를 돈다(시간당 22회).
- `no-any` 중 `api-client/**` 13건은 전부 `eslint-disable-next-line`이 있다(위반 0). ESLint가 없어 주석은 표식일 뿐이다.
  `await response.json()` 7곳은 `unknown` + 기존 응답 인터페이스로 좁힐 수 있다.
- 비밀값 의심: 0건(지표 0 · 자체 grep 0). `.env.example`은 자리표시뿐이다.
- 외부 서비스 공지 확인은 주 1회 월요일이다. **2026-10-08(목)에는 확인하지 않았다** — 첫 확인은 2026-10-12(월).
- 확인하지 못한 것: 배포된 gh-pages 번들에 실제 키가 들어 있는지(로컬 `dist`에는 없다).

## 사용자 결정 대기 (문서에 적힌 것 — 발견 아님)

- `VITE_` 키가 번들에 그대로 들어가는 구조 — 백로그에 「사용자 승인 상태 · 공개 배포 시 재검토」.
- 배포본 서버 프록시 — 지금 배포본은 경락가 · 해양기상 · 어획량이 항상 mock이다(`economy-data.md`).

## 닫힌 수정안에서 배운 것

- (없음)
