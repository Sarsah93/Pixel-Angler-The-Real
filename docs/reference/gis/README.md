# docs/reference/gis — GIS 원본 데이터 보관소

외부 공공 GIS 원본(SHP 등)은 **여기에 하위 폴더로** 둔다. 대용량(`*.shp/*.shx/*.dbf`)은 `.gitignore`
대상이라 **레포를 새로 받으면 없다** — 아래 출처에서 다시 받아 같은 폴더명으로 배치한다.
게임은 원본을 직접 읽지 않는다. `tools/` 도구가 지역별로 클립·변환한 **파생 JSON만** 커밋·로드한다.

| 폴더 | 출처 | 좌표계 | 도구 → 산출물 |
|---|---|---|---|
| `khoa_fishfarm_20250813/` | 공공데이터포털 [15130109](https://www.data.go.kr/data/15130109/fileData.do) "해양수산부 국립해양조사원_어장정보_20250813" (`TL_DIST_FSHFRM.*`, 114MB) | EPSG:5179 · DBF EUC-KR | `py tools/extract_fishfarms.py <region>` → `packages/client-pc/public/data/<region>/fishfarms.json` |

- 폴더명은 **ASCII**로 둔다 — 한글 경로는 Git Bash·콘솔 인코딩에서 깨져 도구 인자로 넘기기 어렵다(121차 실측).
- `09.수심.zip`(1.6MB)은 크기가 작아 상위 `docs/reference/`에 그대로 커밋돼 있다(`build_depth_profiles.py`).
- 지역 추가 시(`add-region` 스킬) `extract_fishfarms.py`를 등록 절차에 포함하고, 심리스 지역 정의에
  `hasFishFarms: true`를 켠다(없는 지역에서 로드하면 SPA 폴백 pageerror — `hasLights`와 같은 함정).
