#!/usr/bin/env python3
"""하모니 실행별 토큰 사용량 기록 · 추세 판정.

기록 단위는 「실행 1회(차수)」다. 값은 세션이 보여 주는 토큰 계수기에서 읽는다.
- 예산(budget): 세션 시작 때 주어진 총 토큰 수(`total_tokens` — 예: 15,000,000)
- 남은 양(left): 도구 결과 뒤에 붙는 「N tokens left」 중 **보고서를 쓰기 직전** 마지막 값
- 하위 에이전트(Agent)는 자기 문맥을 따로 쓴다 — 결과에 찍히는 토큰 수를 합쳐 `--sub`로 넘긴다
- 사용량 = 예산 − 남은 양 + 하위 에이전트 합 (마지막 메시지 몇 천 토큰은 빠진다 — 매번 같은 방식이라 추세 비교에는 지장 없다)

사용:
  python3 harmony/tools/tokens.py record --state harmony --date 2026-10-13 \
      --budget 15000000 --left 14880000 --sub 0 --measures T1,T3 --note "심화 생략"
  python3 harmony/tools/tokens.py show --state harmony
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# 판정 기준 — 바꿀 때는 PROTOCOL §5와 함께 고친다.
TARGET_PCT = 1.0        # 실행 1회 목표: 예산의 1% 이하
GROWTH_ALERT = 0.15     # 직전 3회 평균보다 15% 넘게 늘면 「증가」
WINDOW = 3


def load(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def verdict(rows: list[dict]) -> str:
    """마지막 실행을 직전 WINDOW회와 비교해 판정 문자열을 낸다."""
    measured = [r for r in rows if r.get("used") is not None]
    if not measured:
        return "판정 없음 — 측정된 실행이 없다"
    last = measured[-1]
    prev = measured[-1 - WINDOW:-1]
    over = last["pct"] > TARGET_PCT
    if not prev:
        base = "기준 없음(첫 측정)"
        grow = False
    else:
        avg = sum(r["used"] for r in prev) / len(prev)
        ratio = (last["used"] - avg) / avg if avg else 0.0
        grow = ratio > GROWTH_ALERT
        base = f"직전 {len(prev)}회 평균 {avg / 1000:.0f}k 대비 {ratio * 100:+.0f}%"
    if over or grow:
        action = "절감책 1단계 채택 필요"
    else:
        action = "유지"
    return f"{base} · 목표 {TARGET_PCT:.1f}% {'초과' if over else '이내'} → {action}"


def cmd_record(a: argparse.Namespace) -> None:
    path = Path(a.state) / "metrics" / "tokens.jsonl"
    rows = load(path)
    used = a.budget - a.left + a.sub
    row = {
        "run": len(rows) + 1,
        "date": a.date,
        "budget": a.budget,
        "left": a.left,
        "sub": a.sub,
        "used": used,
        "pct": round(used / a.budget * 100, 3),
        "measures": [m for m in (a.measures or "").split(",") if m],
        "note": a.note or "",
    }
    rows.append(row)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    show(rows)


def show(rows: list[dict]) -> None:
    print("| 차수 | 날짜 | 사용량 | 예산 대비 | 적용 중인 절감책 | 비고 |")
    print("|---|---|---|---|---|---|")
    for r in rows[-7:]:
        if r.get("used") is None:
            print(f"| {r['run']} | {r['date']} | 미측정 | — | — | {r.get('note', '')} |")
            continue
        ms = " · ".join(r.get("measures") or []) or "없음"
        print(f"| {r['run']} | {r['date']} | {r['used'] / 1000:.0f}k | {r['pct']:.2f}% | {ms} | {r.get('note', '')} |")
    print()
    print("판정: " + verdict(rows))


def main() -> None:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("record")
    r.add_argument("--state", required=True)
    r.add_argument("--date", required=True)
    r.add_argument("--budget", type=int, required=True)
    r.add_argument("--left", type=int, required=True)
    r.add_argument("--sub", type=int, default=0)
    r.add_argument("--measures")
    r.add_argument("--note")
    s = sub.add_parser("show")
    s.add_argument("--state", required=True)
    a = p.parse_args()
    if a.cmd == "record":
        cmd_record(a)
    else:
        show(load(Path(a.state) / "metrics" / "tokens.jsonl"))


if __name__ == "__main__":
    sys.exit(main())
