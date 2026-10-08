#!/usr/bin/env python3
"""하모니 점수 계산기 — 원장과 검토 기록에서 도메인별 점수를 계산한다.

점수는 모델의 "느낌"이 아니라 아래 공식으로만 나온다(같은 입력이면 같은 점수).

- 상태(health)   = 100 − Σ(열린 발견 사항의 감점). 그 도메인을 한 번도 점검하지 않았으면 "미측정".
- 숙련(mastery)  = 범위 안 파일 중 "지금 내용 그대로 검토·기록된" 파일의 비율 × 100.
                   검토한 뒤 파일이 바뀌면 다시 미검토로 돌아간다(블롭 해시 비교).
- 실행(agency)   = 최근 N일 동안 결정된 수정안 중 병합된 비율 × 100. 결정이 3건 미만이면 "표본 부족".
- 종합(overall)  = 가중 평균(없는 항목은 빼고 다시 정규화).
- 하모니 지수    = 도메인 종합의 평균.  조화도 = 100 − (최고 − 최저).

사용:
  python3 score.py --repo <점검한 체크아웃> --state <harmony 폴더> --date YYYY-MM-DD
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys


def glob_to_re(glob: str) -> re.Pattern[str]:
    out, i = [], 0
    while i < len(glob):
        if glob.startswith("**/", i):
            out.append("(?:.*/)?")
            i += 3
        elif glob.startswith("**", i):
            out.append(".*")
            i += 2
        elif glob[i] == "*":
            out.append("[^/]*")
            i += 1
        elif glob[i] == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(glob[i]))
            i += 1
    return re.compile("^" + "".join(out) + "$")


def load(path: str, default):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def fmt(v) -> str:
    return "—" if v is None else f"{v:.0f}"


def delta(now, before) -> str:
    if now is None or before is None:
        return "—"
    d = now - before
    return "0" if abs(d) < 0.5 else f"{d:+.0f}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--state", required=True)
    ap.add_argument("--date", required=True)
    args = ap.parse_args()

    cfg = load(os.path.join(args.state, "config.json"), {})
    sc = cfg.get("scoring", {})
    penalties = sc.get("penalties", {"심각": 15, "보통": 6, "경미": 2})
    weights = sc.get("weights", {"health": 0.5, "mastery": 0.3, "agency": 0.2})
    window_days = int(sc.get("agency_window_days", 30))
    min_decisions = int(sc.get("agency_min_decisions", 3))

    findings = load(os.path.join(args.state, "ledger", "findings.json"), {"findings": []})["findings"]
    proposals = load(os.path.join(args.state, "ledger", "proposals.json"), {"proposals": []})["proposals"]
    coverage = load(os.path.join(args.state, "knowledge", "coverage.json"), {"domains": {}})["domains"]

    tracked = {}
    out = subprocess.run(["git", "-C", args.repo, "ls-files", "-s", "-z"], check=True, capture_output=True, text=True).stdout
    for rec in out.split("\0"):
        if rec:
            meta, path = rec.split("\t", 1)
            tracked[path] = meta.split()[1][:12]
    head = subprocess.run(["git", "-C", args.repo, "rev-parse", "HEAD"], check=True, capture_output=True, text=True).stdout.strip()

    today = dt.date.fromisoformat(args.date)
    domains_out = {}
    for dom in cfg.get("domains", []):
        did = dom["id"]
        inc = [glob_to_re(g) for g in dom.get("scope", [])]
        exc = [glob_to_re(g) for g in dom.get("exclude", [])]
        scope = [p for p in tracked if any(r.match(p) for r in inc) and not any(r.match(p) for r in exc)]
        cov = coverage.get(did, {})
        reviewed = cov.get("files", {})
        current = sum(1 for p in scope if reviewed.get(p) == tracked[p])
        stale = sum(1 for p in scope if p in reviewed and reviewed[p] != tracked[p])
        mastery = round(100.0 * current / len(scope), 1) if scope else None

        open_f = [f for f in findings if f.get("domain") == did and f.get("status") == "열림"]
        health = None
        if cov.get("passes"):
            health = max(0.0, 100.0 - sum(penalties.get(f.get("severity", "보통"), 6) for f in open_f))

        decided = []
        for p in proposals:
            if p.get("domain") != did or p.get("kind") != "적용" or p.get("status") not in ("병합", "닫힘"):
                continue
            try:
                when = dt.date.fromisoformat(p.get("decided_at") or "")
            except ValueError:
                continue
            if (today - when).days <= window_days:
                decided.append(p)
        merged = sum(1 for p in decided if p["status"] == "병합")
        agency = round(100.0 * merged / len(decided), 1) if len(decided) >= min_decisions else None

        overall = None
        if health is not None:
            parts = {"health": health, "mastery": mastery, "agency": agency}
            wsum = sum(weights[k] for k, v in parts.items() if v is not None)
            overall = round(sum(weights[k] * v for k, v in parts.items() if v is not None) / wsum, 1)

        domains_out[did] = {
            "name": dom.get("name", did),
            "health": health,
            "mastery": mastery,
            "agency": agency,
            "overall": overall,
            "scope_files": len(scope),
            "reviewed_current": current,
            "reviewed_stale": stale,
            "open_findings": {s: sum(1 for f in open_f if f.get("severity") == s) for s in penalties},
            "decisions": {"merged": merged, "closed": len(decided) - merged},
            "open_proposals": sum(1 for p in proposals if p.get("domain") == did and p.get("status") == "열림"),
        }

    overalls = [d["overall"] for d in domains_out.values() if d["overall"] is not None]
    summary = {
        "harmony_index": round(sum(overalls) / len(overalls), 1) if overalls else None,
        "balance": round(100.0 - (max(overalls) - min(overalls)), 1) if len(overalls) >= 2 else None,
        "weakest": min((d for d in domains_out.items() if d[1]["overall"] is not None), key=lambda kv: kv[1]["overall"], default=(None,))[0],
        "measured_domains": len(overalls),
    }

    scores_dir = os.path.join(args.state, "scores")
    os.makedirs(scores_dir, exist_ok=True)
    hist_path = os.path.join(scores_dir, "history.jsonl")
    history = []
    if os.path.exists(hist_path):
        with open(hist_path, encoding="utf-8") as fh:
            history = [json.loads(ln) for ln in fh if ln.strip()]
    history = [h for h in history if h.get("date") != args.date]  # 같은 날 다시 돌리면 덮어쓴다
    prev = max((h for h in history if h.get("date", "") < args.date), key=lambda h: h["date"], default=None)

    snapshot = {"date": args.date, "audited_commit": head, "summary": summary, "domains": domains_out}
    history.append(snapshot)
    history.sort(key=lambda h: h["date"])
    with open(hist_path, "w", encoding="utf-8") as fh:
        for h in history:
            fh.write(json.dumps(h, ensure_ascii=False) + "\n")
    with open(os.path.join(scores_dir, "latest.json"), "w", encoding="utf-8") as fh:
        json.dump({**snapshot, "previous_date": prev["date"] if prev else None}, fh, ensure_ascii=False, indent=1)
        fh.write("\n")

    # 보고서에 그대로 붙일 표 (전일 대비)
    pd = prev["domains"] if prev else {}
    ps = prev["summary"] if prev else {}
    print(f"기준 커밋 {head[:7]} · 비교 대상 {prev['date'] if prev else '없음(첫 측정)'}")
    print()
    print("| 도메인 | 상태 | 숙련 | 실행 | 종합 | 전일 대비(종합) | 열린 발견(심각/보통/경미) |")
    print("|---|---|---|---|---|---|---|")
    for did, d in domains_out.items():
        b = pd.get(did, {})
        of = d["open_findings"]
        counts = "/".join(str(of.get(s, 0)) for s in ("심각", "보통", "경미"))
        print(
            f"| {d['name']} | {fmt(d['health'])} | {fmt(d['mastery'])} | {fmt(d['agency'])} | {fmt(d['overall'])} "
            f"| {delta(d['overall'], b.get('overall'))} | {counts} |"
        )
    print()
    print(
        f"하모니 지수 {fmt(summary['harmony_index'])} (전일 대비 {delta(summary['harmony_index'], ps.get('harmony_index'))})"
        f" · 조화도 {fmt(summary['balance'])} · 가장 약한 도메인 {domains_out[summary['weakest']]['name'] if summary['weakest'] else '—'}"
    )
    print("— = 미측정 또는 표본 부족")
    return 0


if __name__ == "__main__":
    sys.exit(main())
