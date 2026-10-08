# 하모니 — 일일 점검 상태 브랜치

이 브랜치(`harmony-state`)는 **Pixel Angler The Real**의 일일 자동 점검이 남기는 기록이다.
게임 코드는 들어 있지 않고, 기본 브랜치(`main`)와 합쳐지지 않는다.

## 무엇을 하나

매일 새벽 예약 작업이 저장소를 받아 아홉 도메인을 점검한다.

1. 엔지니어링
2. 코드
3. 파일·문서
4. 디자인·미디어
5. 파이프라인
6. 티켓·경제
7. API·환경 설정
8. 노트·메모리
9. 스킬

결과는 세 곳에 남는다.

- **보고서** — `harmony/reports/<날짜>.md` (전/후 비교)
- **수정안** — `harmony/<날짜>` 브랜치의 풀 리퀘스트. 병합할지는 사용자가 정한다.
- **점수** — `harmony/scores/latest.json` · `history.jsonl`

## 어디를 보면 되나

| 궁금한 것 | 파일 |
|---|---|
| 오늘 무엇이 바뀌었나 | `harmony/reports/` 최신 파일 |
| 지금 점수 | `harmony/scores/latest.json` |
| 열려 있는 문제 | `harmony/ledger/findings.json` (`status`가 `열림`) |
| 올라온 수정안의 결과 | `harmony/ledger/proposals.json` |
| 에이전트가 이 프로젝트에 대해 아는 것 | `harmony/knowledge/` |
| 에이전트가 따르는 지침 | `harmony/agents/` · `harmony/PROTOCOL.md` |
| 범위 · 한도 · 점수 가중치 | `harmony/config.json` |

## 점수의 뜻

| 항목 | 계산 |
|---|---|
| 상태 | 100 − 열린 발견 사항 감점 합(심각 15 · 보통 6 · 경미 2) |
| 숙련 | 범위 안 파일 중, 지금 내용 그대로 검토 · 기록된 파일의 비율 |
| 실행 | 최근 30일 동안 결정된 수정안 중 병합된 비율(결정 3건 미만이면 표시하지 않음) |
| 종합 | 상태 0.5 · 숙련 0.3 · 실행 0.2 가중 평균 |
| 하모니 지수 | 도메인 종합의 평균 |
| 조화도 | 100 − (가장 높은 도메인 − 가장 낮은 도메인) |

모델 자체가 학습되는 것이 아니다. 숙련은 **이 브랜치에 쌓인 기록의 범위**를 잰 값이고,
실행은 **사용자가 수정안을 받아들인 비율**이다. 파일이 바뀌면 그 파일의 숙련은 다시 0이 된다.

## 사용자가 조절하는 법

- **수정안을 받아들인다 / 거절한다** — PR을 병합하거나 닫는다. 닫을 때 이유를 댓글로 남기면 다음부터 반영한다.
- **"이건 의도된 것"** — `ledger/findings.json`에서 그 항목의 `status`를 `보류`로 바꾸거나, PR 댓글로 알린다.
- **범위 · 한도 · 가중치** — `config.json`을 고친다(이 브랜치에 직접 커밋).
- **절차** — `PROTOCOL.md`를 고친다. 에이전트는 이 문서를 스스로 바꾸지 않는다.
- **멈춤** — 예약 작업을 끄면 된다. 이 브랜치와 `harmony/` 브랜치들을 지워도 `main`에는 영향이 없다.

## 지키는 선

- 쓰는 곳은 `harmony-state`와 `harmony/`로 시작하는 브랜치뿐이다. `main`과 `gh-pages`에는 쓰지 않는다.
- 병합 · 배포 · 태그는 하지 않는다.
- 비밀값은 기록하지 않는다. 환경 변수는 이름만 다룬다.

## 도구

```bash
# 지표 수집 (표준 라이브러리만 사용)
python3 harmony/tools/collect_metrics.py --repo <main 체크아웃> --config harmony/config.json --out harmony/metrics/<날짜>.json

# 점수 계산
python3 harmony/tools/score.py --repo <main 체크아웃> --state harmony --date <날짜>
```

두 도구와 `PROTOCOL.md`, `agents/`의 「공통 점검」은 프로젝트에 묶여 있지 않다.
다른 저장소에 하모니를 붙일 때는 이 브랜치를 본으로 삼아 `config.json`과 지침의 「이 프로젝트 전용」만 새로 쓴다.
