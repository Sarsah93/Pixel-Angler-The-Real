#!/usr/bin/env python3
"""하모니 점수 계산기 v2 — 원장과 시나리오 기록에서 갈래별 점수를 계산한다.

2026-10-27 사용자 지시로 개편했다. v1은 「범위 안 파일을 몇 개 읽었나(숙련)」로 점수를 매겨
점검이 문서 정리로 쏠렸다. v2는 **플레이어가 겪을 문제를 얼마나 찾아 고쳤나**를 센다.

점수는 아래 공식으로만 나온다(같은 입력이면 같은 점수).

- 상태(health)      = 100 − Σ(그 갈래의 열린 발견 감점). 심각 15 · 보통 6 · 경미 2.
- 시나리오(scenarios) = 그 갈래 시나리오 중 최근 N일(기본 14일) 안에 돌린 비율 × 100.
                      시나리오가 하나도 없으면 「—」.
- 실행(agency)      = 최근 30일 동안 결정된 수정 PR 중 병합된 비율 × 100. 결정 3건 미만이면 「—」.
- 종합(overall)     = 가중 평균(없는 항목은 빼고 다시 정규화). 기본 가중 0.5 · 0.3 · 0.2.
- 하모니 지수       = **제품 갈래(①~⑥) 종합의 평균**. 기본 점검 · 문서 갈래는 표에만 나오고 지수에는 넣지 않는다.
- 오늘 찾음 / 고침  = first_seen · resolved_at이 오늘인 발견 수.

사용:
  python3 score.py --repo <점검한 체크아웃> --state <harmony 폴더> --date YYYY-MM-DD
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys


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


def parse_date(s):
    try:
        return dt.date.fromisoformat((s or "")[:10])
    except ValueError:
        return None


def lane_of(rec: dict, legacy: dict) -> str:
    """발견 · 수정안의 갈래 — v2 기록은 `lane`, v1 기록은 옛 `domain`을 옮김표로 바꾼다."""
    if rec.get("lane"):
        return rec["lane"]
    return legacy.get(rec.get("domain", ""), rec.get("domain", ""))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--state", required=True)
    ap.add_argument("--date", required=True)
    args = ap.parse_args()

    cfg = load(os.path.join(args.state, "config.json"), {})
    sc = cfg.get("scoring", {})
    penalties = sc.get("penalties", {"심각": 15, "보통": 6, "경미": 2})
    weights = sc.get("weights", {"health": 0.5, "scenarios": 0.3, "agency": 0.2})
    scen_window = int(sc.get("scenario_window_days", 14))
    window_days = int(sc.get("agency_window_days", 30))
    min_decisions = int(sc.get("agency_min_decisions", 3))
    legacy = cfg.get("legacy_domain_to_lane", {})

    findings = load(os.path.join(args.state, "ledger", "findings.json"), {"findings": []})["findings"]
    proposals = load(os.path.join(args.state, "ledger", "proposals.json"), {"proposals": []})["proposals"]
    scenarios = load(os.path.join(args.state, "knowledge", "scenarios.json"), {"lanes": {}}).get("lanes", {})

    head = subprocess.run(["git", "-C", args.repo, "rev-parse", "HEAD"], check=True, capture_output=True, text=True).stdout.strip()
    today = dt.date.fromisoformat(args.date)

    lanes_out = {}
    for lane in cfg.get("lanes", []):
        lid = lane["id"]
        mine = [f for f in findings if lane_of(f, legacy) == lid]
        open_f = [f for f in mine if f.get("status") == "열림"]
        health = max(0.0, 100.0 - sum(penalties.get(f.get("severity", "보통"), 6) for f in open_f))

        scen = scenarios.get(lid, [])
        recent = [s for s in scen if (d := parse_date(s.get("last_run"))) and (today - d).days <= scen_window]
        scen_pct = round(100.0 * len(recent) / len(scen), 1) if scen else None

        decided = []
        for p in proposals:
            if lane_of(p, legacy) != lid or p.get("kind") != "적용" or p.get("status") not in ("병합", "닫힘"):
                continue
            when = parse_date(p.get("decided_at"))
            if when and (today - when).days <= window_days:
                decided.append(p)
        merged = sum(1 for p in decided if p["status"] == "병합")
        agency = round(100.0 * merged / len(decided), 1) if len(decided) >= min_decisions else None

        parts = {"health": health, "scenarios": scen_pct, "agency": agency}
        wsum = sum(weights[k] for k, v in parts.items() if v is not None)
        overall = round(sum(weights[k] * v for k, v in parts.items() if v is not None) / wsum, 1) if wsum else None

        lanes_out[lid] = {
            "name": lane.get("name", lid),
            "kind": lane.get("kind", "product"),
            "health": health,
            "scenarios": scen_pct,
            "agency": agency,
            "overall": overall,
            "scenario_total": len(scen),
            "scenario_recent": len(recent),
            "open_findings": {s: sum(1 for f in open_f if f.get("severity") == s) for s in penalties},
            "found_today": sum(1 for f in mine if (f.get("first_seen") or "")[:10] == args.date),
            "fixed_today": sum(1 for f in mine if (f.get("resolved_at") or "")[:10] == args.date),
            "decisions": {"merged": merged, "closed": len(decided) - merged},
            "open_proposals": sum(1 for p in proposals if lane_of(p, legacy) == lid and p.get("status") == "열림"),
        }

    product = [d["overall"] for d in lanes_out.values() if d["kind"] == "product" and d["overall"] is not None]
    weakest = min(((k, d) for k, d in lanes_out.items() if d["kind"] == "product" and d["overall"] is not None),
                  key=lambda kv: kv[1]["overall"], default=(None, None))[0]
    summary = {
        "harmony_index": round(sum(product) / len(product), 1) if product else None,
        "balance": round(100.0 - (max(product) - min(product)), 1) if len(product) >= 2 else None,
        "weakest": weakest,
        "found_today": sum(d["found_today"] for d in lanes_out.values()),
        "fixed_today": sum(d["fixed_today"] for d in lanes_out.values()),
        "scoring_version": 2,
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

    snapshot = {"date": args.date, "audited_commit": head, "summary": summary, "lanes": lanes_out}
    history.append(snapshot)
    history.sort(key=lambda h: h["date"])
    with open(hist_path, "w", encoding="utf-8") as fh:
        for h in history:
            fh.write(json.dumps(h, ensure_ascii=False) + "\n")
    with open(os.path.join(scores_dir, "latest.json"), "w", encoding="utf-8") as fh:
        json.dump({**snapshot, "previous_date": prev["date"] if prev else None}, fh, ensure_ascii=False, indent=1)
        fh.write("\n")

    # 보고서에 그대로 붙일 표 — v1 기록(도메인)과는 갈래가 달라 첫 v2 실행의 「전일 대비」는 — 로 나온다
    pl = (prev or {}).get("lanes", {})
    psum = (prev or {}).get("summary", {})
    ps = psum if psum.get("scoring_version") == 2 else {}
    print(f"기준 커밋 {head[:7]} · 비교 대상 {prev['date'] if prev else '없음(첫 측정)'}")
    print()
    print("| 갈래 | 상태 | 시나리오(14일) | 실행 | 종합 | 전일 대비 | 열린 발견(심각/보통/경미) | 오늘 찾음 · 고침 |")
    print("|---|---|---|---|---|---|---|---|")
    for lid, d in lanes_out.items():
        b = pl.get(lid, {})
        of = d["open_findings"]
        counts = "/".join(str(of.get(s, 0)) for s in ("심각", "보통", "경미"))
        scen = f"{fmt(d['scenarios'])} ({d['scenario_recent']}/{d['scenario_total']})" if d["scenario_total"] else "—"
        print(
            f"| {d['name']} | {fmt(d['health'])} | {scen} | {fmt(d['agency'])} | {fmt(d['overall'])} "
            f"| {delta(d['overall'], b.get('overall'))} | {counts} | {d['found_today']} · {d['fixed_today']} |"
        )
    print()
    wname = lanes_out[summary["weakest"]]["name"] if summary["weakest"] else "—"
    print(
        f"하모니 지수(제품 갈래 ①~⑥) {fmt(summary['harmony_index'])} (전일 대비 {delta(summary['harmony_index'], ps.get('harmony_index'))})"
        f" · 조화도 {fmt(summary['balance'])} · 가장 약한 갈래 {wname}"
        f" · 오늘 찾음 {summary['found_today']} · 고침 {summary['fixed_today']}"
    )
    print("— = 시나리오 없음 또는 결정 표본 부족")
    return 0


if __name__ == "__main__":
    sys.exit(main())
