#!/usr/bin/env python3
"""
278차 — 꼭짓점으로만 맞닿은 걷기 칸(대각 1칸 데크 · 보도 · 방파제 선)을 이미 구운 seamless.json 위에서 바로 잇는다.

보통은 `build_region_maps.py <region>`이 굽는 길에 같은 보정(`bridge_osm_pinches`)을 건다.
이 도구는 **seamless.json을 굽고 나서 따로 손본 지역**(속초 `sokcho_v2` — `author_sokcho_coast.py` ·
`author_yeonggeumjeong.py`가 seamless.json을 직접 고친다)에 쓴다. 그런 지역을 `build_region_maps`로 다시 구우면
손본 칸 1,600여 개가 terrain.png 상태로 되돌아간다(278차 실측) — 그래서 굽지 않고 제자리에서 고친다.

사용: python3 tools/fix_walk_pinches.py <region> [--dry]
  - 물('~') 모서리 한 칸씩만 채운다. 이미 이어진 곳은 그대로(멱등 — 두 번 돌려도 0칸).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_region_maps import bridge_osm_pinches  # noqa: E402


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry' in sys.argv
    if not args:
        raise SystemExit('사용: python3 tools/fix_walk_pinches.py <region> [--dry]')
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for region in args:
        path = os.path.join(root, 'packages', 'client-pc', 'public', 'data', region, 'seamless.json')
        with open(path, encoding='utf-8') as f:
            doc = json.load(f)
        grid = [list(r) for r in doc['terrain']]
        h, w = len(grid), len(grid[0])
        added = bridge_osm_pinches(w, h, grid)
        kinds: dict = {}
        for _, _, k in added:
            kinds[k] = kinds.get(k, 0) + 1
        print(f'[{region}] 대각 이음 보정 {len(added)}칸 ' + ' '.join(f'{k}:{n}' for k, n in sorted(kinds.items())))
        if dry or not added:
            continue
        doc['terrain'] = [''.join(r) for r in grid]
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    main()
