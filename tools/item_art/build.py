# -*- coding: utf-8 -*-
"""
@file build.py
@description 아이템 그림 굽기 — icons_*.py 에 등록된 그림을 PNG 로 굽고 매니페스트(TS)를 다시 쓴다.

    py tools/item_art/build.py                 # 전부 굽기 + 매니페스트
    py tools/item_art/build.py --only cap,vest # 고른 것만(매니페스트는 그대로 전부)
    py tools/item_art/build.py --sheet out.png # 검수용 모아 보기 한 장도 같이(저장소 밖 경로 권장)

출력
  packages/client-pc/public/item-icons/drawn/<name>.png      512 × 512 투명 PNG
  packages/client-pc/src/data/ItemArtManifest.ts             자동 생성 — 수동 편집 금지

그림을 고치려면 icons_*.py 의 함수를 고치고 다시 돌린다. PNG 를 손으로 고치지 않는다(다시 구우면 덮인다).
"""
import argparse
import glob
import importlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT_DIR = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'item-icons', 'drawn')
BOARD_DIR = os.path.join(ROOT, 'packages', 'client-pc', 'public', 'forage-board')
BOARD_PX = 44   # 판 그림 긴 변 — 게임이 16px 기준으로 맞춰 3배로 그린다(ForageGamePanel)
MANIFEST = os.path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'ItemArtManifest.ts')
sys.path.insert(0, HERE)

import kit  # noqa: E402

# 그리지 않고 이미 있는 텍스처를 가리키는 것 — 아이템 id → 텍스처 키
EXISTING_BY_ID = {
    'shop_flatfish': 'fish_halibut',        # 직판장 활어 광어 — 어종 그림 그대로
    'shop_squid': 'fish_squid',             # 직판장 선어 오징어
    'inv_line_nylon3': 'line_spool_saiso',  # 원줄 스풀 — 다른 줄과 같은 그림
}


def load_all():
    for path in sorted(glob.glob(os.path.join(HERE, 'icons_*.py'))):
        importlib.import_module(os.path.splitext(os.path.basename(path))[0])
    names = [r['name'] for r in kit.REGISTRY]
    dup = {n for n in names if names.count(n) > 1}
    if dup:
        raise SystemExit(f'이름이 겹칩니다: {sorted(dup)}')
    seen = {}
    for r in kit.REGISTRY:
        for i in r['ids']:
            if i in seen:
                raise SystemExit(f'아이템 id {i} 가 두 그림({seen[i]} · {r["name"]})에 걸려 있습니다')
            seen[i] = r['name']
    return kit.REGISTRY


def render(rec):
    cv = kit.Canvas()
    rec['fn'](cv)
    return kit.finish(cv, colors=rec['colors'])


def board_name(rec):
    """판 그림 파일 이름(forage_<id> → <id>) — 판 그림이 없는 그림이면 None"""
    if not rec.get('board') or not rec['key'].startswith('forage_'):
        return None
    return rec['key'][len('forage_'):]


def bake_board(small):
    """논리 크기 그림 → 긴 변 BOARD_PX 판 그림(알파는 딱 끊는다 — 반투명 테두리가 바닥에 번지지 않게)"""
    from PIL import Image
    im = small.crop(small.getbbox())
    s = BOARD_PX / max(im.size)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    a = im.getchannel('A').point(lambda v: 255 if v >= 110 else 0)
    im.putalpha(a)
    return im


def write_manifest(reg):
    lines = [
        '/**',
        ' * @file ItemArtManifest.ts',
        ' * @description 코드로 그린 아이템 그림 목록 (자동 생성 — 수동 편집 금지)',
        ' *',
        ' * 생성기: `py tools/item_art/build.py` (그림 원본은 `tools/item_art/icons_*.py`).',
        ' * 굽기 · 해석은 `scenes/BootScene.ts`(로드)와 `ui/ItemIcon.ts`(아이템 id → 텍스처)가 맡는다.',
        ' */',
        '',
        '/** 텍스처 키 → `public/` 기준 상대 경로 (선행 `/` 금지 — 서브패스 배포) */',
        'export const ITEM_ART_ASSETS: Record<string, string> = {',
    ]
    for r in reg:
        lines.append(f"  {r['key']}: 'item-icons/drawn/{r['name']}.png',")
        if board_name(r):
            lines.append(f"  forageboard_{board_name(r)}: 'forage-board/{board_name(r)}.png',")
    lines += ['};', '', '/** 아이템 id → 텍스처 키 (세이브에 `iconTexture`가 없어도 그림이 나온다) */',
              'export const ITEM_ART_BY_ID: Record<string, string> = {']
    for r in reg:
        for i in r['ids']:
            lines.append(f"  {i}: '{r['key']}',")
    for i, key in EXISTING_BY_ID.items():
        lines.append(f"  {i}: '{key}',")
    lines += ['};', '', '/** 아이템 id 접두사 → 텍스처 키 (뒤에 번호 · 어종이 붙는 id — 앞에서부터 처음 맞는 것) */',
              'export const ITEM_ART_BY_PREFIX: ReadonlyArray<readonly [string, string]> = [']
    for r in reg:
        for p in r['prefixes']:
            lines.append(f"  ['{p}', '{r['key']}'],")
    lines += ['];', '', '/** 16×16 아이콘 키(`px:<키>`) → 텍스처 키 (id 로 못 찾았을 때의 대체 그림) */',
              'export const ITEM_ART_BY_PX: Record<string, string> = {']
    for r in reg:
        for p in r['px']:
            lines.append(f"  '{p}': '{r['key']}',")
    lines += ['};', '']
    with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))


def write_sheet(path, items, cols=6):
    from PIL import Image, ImageDraw, ImageFont
    cell, pad, cap = 200, 10, 34
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * (cell + pad) + pad, rows * (cell + cap + pad) + pad), (30, 40, 52, 255))
    d = ImageDraw.Draw(sheet)
    font = None
    for cand in ('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 'C:/Windows/Fonts/malgunbd.ttf'):
        if os.path.exists(cand):
            for idx in range(12):
                try:
                    f = ImageFont.truetype(cand, 13, index=idx)
                    if 'KR' in f.getname()[0] or cand.endswith('.ttf'):
                        font = f
                        break
                except Exception:
                    break
            if font:
                break
    for i, (rec, big) in enumerate(items):
        x = pad + (i % cols) * (cell + pad)
        y = pad + (i // cols) * (cell + cap + pad)
        d.rectangle((x, y, x + cell, y + cell), fill=(22, 30, 40, 255))
        sheet.alpha_composite(big.resize((192, 192), Image.LANCZOS), (x + 4, y + 4))
        # 가방 칸 크기(48px) 미리보기
        d.rectangle((x + cell - 54, y + cell + 2, x + cell - 2, y + cell + cap - 0), fill=(52, 66, 80, 255))
        sheet.alpha_composite(big.resize((30, 30), Image.BILINEAR), (x + cell - 43, y + cell + 3))
        d.text((x + 2, y + cell + 2), rec['name'], font=font, fill=(232, 244, 253, 255))
        d.text((x + 2, y + cell + 17), rec['label'][:22], font=font, fill=(150, 170, 188, 255))
    sheet.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--sheet', default='')
    ap.add_argument('--no-write', action='store_true', help='PNG · 매니페스트를 쓰지 않는다(모아 보기만)')
    a = ap.parse_args()
    reg = load_all()
    only = {s for s in a.only.split(',') if s}
    os.makedirs(OUT_DIR, exist_ok=True)
    done = []
    for rec in reg:
        if only and rec['name'] not in only and not any(rec['name'].startswith(o.rstrip('*')) for o in only if o.endswith('*')):
            continue
        small, big = render(rec)
        if not a.no_write:
            big.save(os.path.join(OUT_DIR, rec['name'] + '.png'), optimize=True)
            if board_name(rec):
                bake_board(small).save(os.path.join(BOARD_DIR, board_name(rec) + '.png'), optimize=True)
        done.append((rec, big))
    if not a.no_write:
        write_manifest(reg)
    if a.sheet:
        write_sheet(a.sheet, done)
    print(f'그림 {len(done)}장 구움 (등록 {len(reg)}장)' + ('' if a.no_write else f' → {os.path.relpath(OUT_DIR, ROOT)}'))


if __name__ == '__main__':
    main()
