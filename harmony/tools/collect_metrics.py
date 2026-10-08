#!/usr/bin/env python3
"""하모니 지표 수집기 — 저장소의 현재 상태를 숫자로 뽑는다.

- 표준 라이브러리만 쓴다(설치 없음). 어느 저장소에서든 그대로 돈다.
- 프로젝트 전용 검사는 config.json 의 "rules"(경로 범위 + 정규식)로 넣는다.
- 비밀값은 절대 출력하지 않는다. 환경 변수는 "이름"만 다룬다.
  비밀값으로 의심되는 줄은 JSON 에 건수만 쓰고, 위치(경로:줄)는 표준 오류로만 내보낸다.

사용:
  python3 collect_metrics.py --repo <점검할 체크아웃> --config <config.json> --out <결과.json>
          [--since <이전 점검 커밋>]
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import re
import struct
import subprocess
import sys

CODE_EXTS = {"ts", "tsx", "js", "jsx", "cjs", "mjs", "py", "rs"}
TEXT_EXTS = CODE_EXTS | {"json", "html", "css", "md", "yaml", "yml", "toml", "svg", "txt"}
IMAGE_EXTS = {"png", "jpg", "jpeg", "gif", "webp", "svg"}
TEST_RE = re.compile(r"(\.test\.|\.spec\.|__tests__/)")
MARKER_RE = re.compile(r"\b(TODO|FIXME|HACK|XXX)\b")
ANY_RE = re.compile(r"(:\s*any\b|\bas\s+any\b|<any>|\bany\[\])")
TS_SUPPRESS_RE = re.compile(r"@ts-(ignore|expect-error|nocheck)")
ESLINT_DISABLE_RE = re.compile(r"eslint-disable")
CONSOLE_LOG_RE = re.compile(r"\bconsole\.log\(")
ENV_USE_RES = [
    re.compile(r"process\.env\.([A-Z][A-Z0-9_]+)"),
    re.compile(r"process\.env\[['\"]([A-Z][A-Z0-9_]+)['\"]\]"),
    re.compile(r"import\.meta\.env\.([A-Z][A-Z0-9_]+)"),
    re.compile(r"os\.environ(?:\.get)?[\[(]\s*['\"]([A-Z][A-Z0-9_]+)['\"]"),
    re.compile(r"os\.getenv\(\s*['\"]([A-Z][A-Z0-9_]+)['\"]"),
]
ENV_BUILTIN = {"NODE_ENV", "MODE", "DEV", "PROD", "SSR", "BASE_URL", "CI", "HOME", "PATH", "TAURI_ENV_PLATFORM"}
ENV_DEF_RE = re.compile(r"^\s*(?:export\s+)?([A-Z][A-Z0-9_]+)\s*=")
# 비밀값 의심 패턴 — 값은 어디에도 남기지 않는다.
SECRET_RES = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{24,}\b"),
    re.compile(
        r"(?i)\b[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_?KEY)[A-Z0-9_]*\b\s*[:=]\s*['\"][A-Za-z0-9+/_=-]{24,}['\"]"
    ),
]


def run_git(repo: str, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", repo, *args], check=True, capture_output=True, text=True
    ).stdout


def glob_to_re(glob: str) -> re.Pattern[str]:
    """`**` 를 지원하는 단순 글롭 → 정규식."""
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


def make_matcher(globs: list[str]):
    pats = [glob_to_re(g) for g in globs]
    return lambda path: any(p.match(path) for p in pats)


def ext_of(path: str) -> str:
    base = os.path.basename(path)
    return base.rsplit(".", 1)[1].lower() if "." in base else ""


def area_of(path: str) -> str:
    parts = path.split("/")
    if parts[0] in ("packages", "apps") and len(parts) > 2:
        return "/".join(parts[:2])
    return parts[0] if len(parts) > 1 else "(루트)"


def png_size(full: str):
    try:
        with open(full, "rb") as fh:
            head = fh.read(24)
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            return struct.unpack(">II", head[16:24])
    except OSError:
        pass
    return None


def read_text(full: str) -> str | None:
    try:
        with open(full, "r", encoding="utf-8", errors="strict") as fh:
            return fh.read()
    except (OSError, UnicodeDecodeError):
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--since", default="")
    args = ap.parse_args()

    with open(args.config, encoding="utf-8") as fh:
        cfg = json.load(fh)
    limits = cfg.get("limits", {})
    long_file_lines = int(limits.get("long_file_lines", 1500))
    md_line_chars = int(limits.get("md_line_chars", 200))

    # 1) 추적 파일 목록 (경로에 공백이 있어도 안전하게 -z)
    files = []
    for rec in run_git(args.repo, "ls-files", "-s", "-z").split("\0"):
        if not rec:
            continue
        meta, path = rec.split("\t", 1)
        mode, sha, _stage = meta.split()
        if mode == "160000":  # 서브모듈
            continue
        full = os.path.join(args.repo, path)
        if not os.path.isfile(full) or os.path.islink(full):
            continue
        files.append({"path": path, "sha": sha, "size": os.path.getsize(full), "ext": ext_of(path)})

    by_ext: dict[str, dict] = collections.defaultdict(lambda: {"files": 0, "bytes": 0})
    for f in files:
        by_ext[f["ext"] or "(없음)"]["files"] += 1
        by_ext[f["ext"] or "(없음)"]["bytes"] += f["size"]

    # 2) 텍스트 훑기
    area_loc: dict[str, int] = collections.Counter()
    line_counts: dict[str, int] = {}
    markers = collections.Counter()
    hygiene = collections.Counter()
    env_used: dict[str, int] = collections.Counter()
    md_long_line_files: list[str] = []
    md_lines = 0
    secret_hits: list[str] = []
    corpus_parts: list[str] = []
    texts: dict[str, str] = {}

    for f in files:
        if f["ext"] not in TEXT_EXTS or f["size"] > 3_000_000:
            continue
        text = read_text(os.path.join(args.repo, f["path"]))
        if text is None:
            continue
        texts[f["path"]] = text
        lines = text.count("\n") + (0 if text.endswith("\n") or not text else 1)
        if f["ext"] in CODE_EXTS:
            line_counts[f["path"]] = lines
            area_loc[area_of(f["path"])] += lines
            for m in MARKER_RE.finditer(text):
                markers[m.group(1)] += 1
            for rx in ENV_USE_RES:
                for m in rx.finditer(text):
                    env_used[m.group(1)] += 1
            if f["ext"] in ("ts", "tsx"):
                hygiene["any_usage"] += len(ANY_RE.findall(text))
                hygiene["ts_suppress"] += len(TS_SUPPRESS_RE.findall(text))
                hygiene["eslint_disable"] += len(ESLINT_DISABLE_RE.findall(text))
                if not TEST_RE.search(f["path"]):
                    hygiene["console_log"] += len(CONSOLE_LOG_RE.findall(text))
        if f["ext"] == "md":
            md_lines += lines
            if any(len(ln) > md_line_chars and not ln.lstrip().startswith("|") for ln in text.split("\n")):
                md_long_line_files.append(f["path"])
        if f["ext"] in CODE_EXTS | {"json", "html", "css"}:
            corpus_parts.append(text)
        for no, ln in enumerate(text.split("\n"), 1):
            if len(ln) < 4000 and any(rx.search(ln) for rx in SECRET_RES):
                secret_hits.append(f"{f['path']}:{no}")

    corpus = "\n".join(corpus_parts)

    # 3) 큰 파일 · 긴 파일 · 중복
    largest = sorted(files, key=lambda f: -f["size"])[:20]
    longest = sorted(line_counts.items(), key=lambda kv: -kv[1])[:20]
    dup_groups = collections.defaultdict(list)
    for f in files:
        if f["size"] >= 1024:
            dup_groups[f["sha"]].append(f)
    dups = [g for g in dup_groups.values() if len(g) > 1]
    dups.sort(key=lambda g: -(g[0]["size"] * (len(g) - 1)))
    dup_wasted = sum(g[0]["size"] * (len(g) - 1) for g in dups)

    # 4) 테스트 · 문서 · 스킬
    src_files = [p for p in line_counts if not TEST_RE.search(p)]
    test_files = [p for p in line_counts if TEST_RE.search(p)]
    skills = sorted(
        f["path"].split("/")[-2]
        for f in files
        if f["path"].startswith(".claude/skills/") and f["path"].endswith("/SKILL.md")
    )
    claude_md = texts.get("CLAUDE.md", "")
    skills_unlisted = [s for s in skills if f"`{s}`" not in claude_md] if claude_md else []
    listed = set(re.findall(r"\*\*`([a-z0-9][a-z0-9-]+)`\*\*", claude_md))
    skills_missing = sorted(s for s in listed if s not in skills and "/" not in s) if skills else []

    # 5) 환경 변수 (이름만)
    env_defined: set[str] = set()
    env_template_files = []
    tracked_secret_files = []
    for f in files:
        base = os.path.basename(f["path"])
        if base in (".env.example", ".env.sample", ".env.template", ".env.defaults"):
            env_template_files.append(f["path"])
            for ln in (texts.get(f["path"]) or read_text(os.path.join(args.repo, f["path"])) or "").split("\n"):
                m = ENV_DEF_RE.match(ln)
                if m:
                    env_defined.add(m.group(1))
        elif base == ".env" or (base.startswith(".env.") and base.endswith(".local")):
            tracked_secret_files.append(f["path"])
    used_names = set(env_used) - ENV_BUILTIN
    env = {
        "template_files": env_template_files,
        "defined": sorted(env_defined),
        "used_in_code": sorted(used_names),
        "defined_not_used": sorted(env_defined - set(env_used)),
        "used_not_defined": sorted(used_names - env_defined),
        "tracked_secret_files": tracked_secret_files,
    }

    # 6) 이미지 에셋
    images = [f for f in files if f["ext"] in IMAGE_EXTS]
    img_area = collections.defaultdict(lambda: {"files": 0, "bytes": 0})
    png_dims = collections.Counter()
    for f in images:
        a = area_of(f["path"])
        img_area[a]["files"] += 1
        img_area[a]["bytes"] += f["size"]
        if f["ext"] == "png":
            wh = png_size(os.path.join(args.repo, f["path"]))
            if wh:
                png_dims[f"{wh[0]}x{wh[1]}"] += 1
    consumed_match = make_matcher(cfg.get("asset_consumed_globs", []))
    unref = []
    consumed_total = 0
    for f in images:
        if not consumed_match(f["path"]):
            continue
        consumed_total += 1
        stem = os.path.basename(f["path"]).rsplit(".", 1)[0]
        if stem not in corpus:
            unref.append(f["path"])

    # 7) 프로젝트 전용 규칙
    rule_results = []
    for rule in cfg.get("rules", []):
        match = make_matcher(rule.get("globs", []))
        skip = make_matcher(rule.get("exclude", []))
        rx = re.compile(rule["pattern"])
        skip_comment = bool(rule.get("skip_comment_lines"))
        hits = []
        for path, text in texts.items():
            if not match(path) or skip(path):
                continue
            for no, ln in enumerate(text.split("\n"), 1):
                if skip_comment and ln.lstrip().startswith(("//", "*", "/*", "#")):
                    continue
                if rx.search(ln):
                    hits.append(f"{path}:{no}")
        rule_results.append(
            {
                "id": rule["id"],
                "domain": rule.get("domain", ""),
                "desc": rule.get("desc", ""),
                "severity": rule.get("severity", "보통"),
                "count": len(hits),
                "samples": hits[:10],
            }
        )

    # 8) 의존성
    deps = {}
    for f in files:
        if os.path.basename(f["path"]) == "package.json":
            try:
                pj = json.loads(texts.get(f["path"]) or "{}")
            except json.JSONDecodeError:
                continue
            deps[f["path"]] = {
                "name": pj.get("name", ""),
                "version": pj.get("version", ""),
                "dependencies": len(pj.get("dependencies", {})),
                "devDependencies": len(pj.get("devDependencies", {})),
            }

    # 9) 깃
    head = run_git(args.repo, "rev-parse", "HEAD").strip()
    git_info = {"head": head, "head_date": run_git(args.repo, "log", "-1", "--format=%cI").strip()}
    if args.since:
        try:
            git_info["since"] = args.since
            git_info["commits_since"] = int(run_git(args.repo, "rev-list", "--count", f"{args.since}..HEAD").strip())
            changed = run_git(args.repo, "diff", "--name-only", "-z", args.since, "HEAD").split("\0")
            git_info["files_changed_since"] = len([c for c in changed if c])
        except subprocess.CalledProcessError:
            git_info["since_error"] = "이전 커밋이 이 클론에 없다(얕은 클론) — 히스토리를 더 받아 다시 실행"

    result = {
        "schema": 1,
        "git": git_info,
        "totals": {
            "files": len(files),
            "bytes": sum(f["size"] for f in files),
            "code_files": len(line_counts),
            "code_lines": sum(line_counts.values()),
        },
        "by_ext": dict(sorted(by_ext.items(), key=lambda kv: -kv[1]["files"])[:25]),
        "code_lines_by_area": dict(sorted(area_loc.items(), key=lambda kv: -kv[1])),
        "largest_files": [{"path": f["path"], "bytes": f["size"]} for f in largest],
        "longest_code_files": [{"path": p, "lines": n} for p, n in longest],
        "code_files_over_limit": {"limit": long_file_lines, "count": sum(1 for n in line_counts.values() if n > long_file_lines)},
        "duplicates": {
            "groups": len(dups),
            "wasted_bytes": dup_wasted,
            "top": [{"bytes_each": g[0]["size"], "paths": [x["path"] for x in g]} for g in dups[:30]],
        },
        "markers": dict(markers),
        "ts_hygiene": dict(hygiene),
        "tests": {
            "test_files": len(test_files),
            "source_files": len(src_files),
            "ratio": round(len(test_files) / len(src_files), 4) if src_files else None,
        },
        "docs": {
            "md_files": by_ext.get("md", {}).get("files", 0),
            "md_lines": md_lines,
            "md_long_line_limit": md_line_chars,
            "md_files_with_long_lines": len(md_long_line_files),
            "md_long_line_samples": md_long_line_files[:15],
        },
        "skills": {"count": len(skills), "names": skills, "not_listed_in_claude_md": skills_unlisted, "listed_but_missing": skills_missing},
        "env": env,
        "secret_suspects": {"count": len(secret_hits)},
        "images": {
            "files": len(images),
            "bytes": sum(f["size"] for f in images),
            "by_area": dict(sorted(img_area.items(), key=lambda kv: -kv[1]["bytes"])),
            "png_dimensions_top": dict(png_dims.most_common(15)),
            "consumed_total": consumed_total,
            "possibly_unreferenced": {"count": len(unref), "samples": unref[:30], "note": "파일 이름이 코드·데이터에 글자로 없을 때만 잡는다. 키를 조립해 쓰는 에셋은 오탐일 수 있다."},
        },
        "rules": rule_results,
        "packages": deps,
    }
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)
        fh.write("\n")

    if secret_hits:
        print("[비밀값 의심 위치 — 공개 브랜치·PR에 쓰지 말 것]", file=sys.stderr)
        for h in secret_hits[:50]:
            print("  " + h, file=sys.stderr)
    print(f"지표 수집 완료: 파일 {len(files)}개, 코드 {sum(line_counts.values())}줄 → {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
