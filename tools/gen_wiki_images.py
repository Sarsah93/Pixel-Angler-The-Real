#!/usr/bin/env python3
"""
@file gen_wiki_images.py
@description 전체 위키(아티팩트)용 썸네일 이미지 생성기.

게임이 쓰는 텍스처 키를 그대로 파일명으로 삼아, 위키 카드/상세에 붙일 축소본을 굽는다.
 - 실사/도트 PNG: `BootScene.ts`의 `load.image('key','path')` + `KEY: 'path'` 맵을 파싱해
   `packages/client-pc/public/<path>` 를 읽고 긴 축 기준 축소(기본 360px) + 256색 양자화.
 - 어종 그림(246차): 게임은 카드(410×166)만 싣으므로 `FishTextures.ts`의 `FISH_IMAGE_FILES` 표로
   원본 `food assets/fish/<file>`을 읽는다(세로가 긴 어종도 360px을 채운다).
 - 갯것 · 생미끼 그림(248차): 같은 까닭으로 `ForageTextures.ts`의 `FORAGE_IMAGE_FILES` 표 → `food assets/forage/art/<file>`.
 - 낚시 장비 그림(249차): 같은 까닭으로 `TackleTextures.ts`의 `TACKLE_IMAGE_FILES` 표 → `food assets/tackle/<file>`
   (코드로 그린 임시 그림을 쓰던 `art_*` 장비도 이 표가 이긴다 — 아래 순서상 나중에 덮는다).
 - 절차 픽셀 아이콘(`px:<key>`): `data/PixelIconArt.ts`의 팔레트·행 매트릭스를 읽어
   정수 배율(기본 6배)로 렌더. 게임 런타임(PixelIcon.ts)과 같은 도트를 쓴다.

실행:
  py tools/gen_wiki_images.py [--out <dir>] [--max 360]
출력: <dir>/<texture_key>.png + <dir>/manifest.json
"""
import argparse
import json
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'packages/client-pc/public')
BOOT = os.path.join(ROOT, 'packages/client-pc/src/scenes/BootScene.ts')
FISH_TEX = os.path.join(ROOT, 'packages/client-pc/src/data/FishTextures.ts')
FISH_SRC = os.path.join(ROOT, 'food assets/fish')
# 248차 — 갯것 · 생미끼 그림도 카드만 싣는다 → 원본 표(`ForageTextures.ts` FORAGE_IMAGE_FILES)로 food assets/forage/art/를 읽는다
FORAGE_TEX = os.path.join(ROOT, 'packages/client-pc/src/data/ForageTextures.ts')
FORAGE_SRC = os.path.join(ROOT, 'food assets/forage/art')
# 249차 — 낚시 장비 그림도 카드만 싣는다 → 원본 표(`TackleTextures.ts` TACKLE_IMAGE_FILES)로 food assets/tackle/를 읽는다
TACKLE_TEX = os.path.join(ROOT, 'packages/client-pc/src/data/TackleTextures.ts')
TACKLE_SRC = os.path.join(ROOT, 'food assets/tackle')
# 255차 — 장비 밖 아이템 그림(Gemini · 씨앗 봉투 합성)도 카드만 싣는다 → `ItemImages.ts` ITEM_IMAGE_FILES로 food assets/items/를 읽는다
ITEM_IMG_TEX = os.path.join(ROOT, 'packages/client-pc/src/data/ItemImages.ts')
ITEM_IMG_SRC = os.path.join(ROOT, 'food assets/items')
# 255차 — 불요리 완성 요리 그림(`food_<레시피>`) — BootScene이 반복문으로 싣는 것까지 public/food/를 직접 훑는다
FOOD_DIR = os.path.join(PUBLIC, 'food')
ICON_ART = os.path.join(ROOT, 'packages/client-pc/src/data/PixelIconArt.ts')
# 197차 — 스킬 아이콘(16x16 · 같은 형식). 위키 「스킬」 탭 카드에 쓴다 → `sk_<id>.png` · manifest 키 `sk:<id>`
SKILL_ART = os.path.join(ROOT, 'packages/client-pc/src/data/SkillIconArt.ts')
# 코드로 그린 아이템 그림(`tools/item_art/build.py` 생성) — BootScene이 이 표를 돌며 로드한다
ITEM_ART = os.path.join(ROOT, 'packages/client-pc/src/data/ItemArtManifest.ts')

# 위키에 싣지 않는 계열 (캐릭터 시트·타일셋·가이드 시트 등 — 카드에 쓸 그림이 아니다)
SKIP_PREFIX = ('man-', 'girl-', 'ts_', 'tile_', 'help_', 'guide_', 'kn_', 'smx_', 'sg_')
SKIP_KEYS = {'korea_pixel_map', 'title_logo'}


def parse_boot_map() -> dict:
    """BootScene에서 텍스처 키 → public 상대 경로 맵을 뽑는다."""
    src = open(BOOT, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"load\.image\(\s*'([^']+)'\s*,\s*'([^']+\.png)'\s*\)", src):
        out[m.group(1)] = m.group(2)
    # `KEY: 'path.png',` 형태의 맵 리터럴 (ITEM_ICON_ASSETS 등)
    for m in re.finditer(r"^\s{4,}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*'([^']+\.png)'\s*,", src, re.M):
        out.setdefault(m.group(1), m.group(2))
    # 코드로 그린 아이템 그림(ITEM_ART_ASSETS 블록) — `art_<이름>` · `forage_<생물>` · `fish_<어종>` 키
    if os.path.isfile(ITEM_ART):
        art = open(ITEM_ART, encoding='utf-8').read()
        art = art[art.index('ITEM_ART_ASSETS'):]
        art = art[:art.index('};')]
        for m in re.finditer(r"^\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*'([^']+\.png)'\s*,", art, re.M):
            out.setdefault(m.group(1), m.group(2))
    return out


def parse_fish_files() -> dict:
    """246차 — FishTextures.ts `FISH_IMAGE_FILES`(텍스처 키 → 원본 파일). 값은 `food assets/fish/` 기준 절대 경로."""
    src = open(FISH_TEX, encoding='utf-8').read()
    body = src[src.index('export const FISH_IMAGE_FILES'):]
    body = body[:body.index('};')]
    return {m.group(1): os.path.join(FISH_SRC, m.group(2))
            for m in re.finditer(r"^\s+(fish_[a-z0-9_]+):\s*'([^']+\.png)'", body, re.M)}


def parse_forage_files() -> dict:
    """248차 — ForageTextures.ts `FORAGE_IMAGE_FILES`(텍스처 키 → 원본 파일). 값은 `food assets/forage/art/` 기준 절대 경로."""
    src = open(FORAGE_TEX, encoding='utf-8').read()
    body = src[src.index('export const FORAGE_IMAGE_FILES'):]
    body = body[:body.index('};')]
    return {m.group(1): os.path.join(FORAGE_SRC, m.group(2))
            for m in re.finditer(r"^\s+([a-z_]+):\s*'([^']+\.png)'", body, re.M)}


def parse_tackle_files() -> dict:
    """249차 — TackleTextures.ts `TACKLE_IMAGE_FILES`(텍스처 키 → 원본 파일). 값은 `food assets/tackle/` 기준 절대 경로."""
    src = open(TACKLE_TEX, encoding='utf-8').read()
    body = src[src.index('export const TACKLE_IMAGE_FILES'):]
    body = body[:body.index('};')]
    return {m.group(1): os.path.join(TACKLE_SRC, m.group(2))
            for m in re.finditer(r"^\s+([a-z0-9_]+):\s*'([^']+\.png)'", body, re.M)}


def parse_icon_art(path: str = ICON_ART, marker: str = 'PIXEL_ICON_ART') -> dict:
    """PixelIconArt.ts · SkillIconArt.ts의 {w,h,pal,rows}를 파싱한다 (자동 생성 파일 — 형식 고정)."""
    src = open(path, encoding='utf-8').read()
    body = src[src.index(marker):]
    out = {}
    for m in re.finditer(
        r"\n  ([A-Za-z_][A-Za-z0-9_]*):\s*\{\s*\n\s*w:\s*(\d+),\s*h:\s*(\d+),\s*\n"
        r"\s*pal:\s*\{([^}]*)\},\s*\n\s*rows:\s*\[([^\]]*)\]", body):
        key, w, h = m.group(1), int(m.group(2)), int(m.group(3))
        pal = {pm.group(1): int(pm.group(2), 16)
               for pm in re.finditer(r"'([^']+)':\s*0x([0-9a-fA-F]{6})", m.group(4))}
        rows = [rm.group(1) for rm in re.finditer(r"'([^']*)'", m.group(5))]
        if len(rows) == h:
            out[key] = {'w': w, 'h': h, 'pal': pal, 'rows': rows}
    return out


def render_icon(art: dict, scale: int) -> Image.Image:
    img = Image.new('RGBA', (art['w'] * scale, art['h'] * scale), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(art['rows']):
        for x, ch in enumerate(row[:art['w']]):
            if ch == '.':
                continue
            rgb = art['pal'].get(ch)
            if rgb is None:
                continue
            color = ((rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255, 255)
            for dy in range(scale):
                for dx in range(scale):
                    px[x * scale + dx, y * scale + dy] = color
    return img


def shrink(img: Image.Image, max_px: int) -> Image.Image:
    img = img.convert('RGBA')
    long_side = max(img.width, img.height)
    if long_side > max_px:
        ratio = max_px / long_side
        img = img.resize((max(1, round(img.width * ratio)), max(1, round(img.height * ratio))),
                         Image.LANCZOS)
    return img


def save(img: Image.Image, path: str) -> int:
    """알파 보존 + 256색 양자화 저장 (용량 절감)."""
    q = img.quantize(colors=256, method=Image.FASTOCTREE)
    q.save(path, optimize=True)
    return os.path.getsize(path)


def parse_item_image_files() -> dict:
    """255차 — ItemImages.ts `ITEM_IMAGE_FILES`(텍스처 키 → 원본 파일). 값은 `food assets/items/` 기준 절대 경로."""
    if not os.path.isfile(ITEM_IMG_TEX):
        return {}
    src = open(ITEM_IMG_TEX, encoding='utf-8').read()
    body = src[src.index('export const ITEM_IMAGE_FILES'):]
    body = body[:body.index('};')]
    return {m.group(1): os.path.join(ITEM_IMG_SRC, m.group(2))
            for m in re.finditer(r"^\s+([a-z0-9_]+):\s*'([^']+\.png)'", body, re.M)}


def parse_food_files() -> dict:
    """255차 — public/food/*.png → `food_<이름>`(불요리 레시피 그림 · 모둠회)."""
    if not os.path.isdir(FOOD_DIR):
        return {}
    return {f'food_{n[:-4]}': os.path.join(FOOD_DIR, n) for n in os.listdir(FOOD_DIR) if n.endswith('.png')}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(ROOT, 'tools/wiki_img'))
    ap.add_argument('--max', type=int, default=360)
    ap.add_argument('--icon-scale', type=int, default=6)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    manifest, total, missing = {}, 0, []

    sources = {k: os.path.join(PUBLIC, rel) for k, rel in parse_boot_map().items()}
    sources.update(parse_fish_files())
    sources.update(parse_forage_files())
    sources.update(parse_tackle_files())
    for k, v in parse_food_files().items():
        sources.setdefault(k, v)
    sources.update(parse_item_image_files())   # 옛 코드 그림 키(`art_*`)를 Gemini 그림으로 바꾼 것도 이 표가 이긴다
    for key, src in sorted(sources.items()):
        if key in SKIP_KEYS or key.startswith(SKIP_PREFIX):
            continue
        if not os.path.isfile(src):
            missing.append(key)
            continue
        img = shrink(Image.open(src), args.max)
        name = f'{key}.png'
        total += save(img, os.path.join(args.out, name))
        manifest[key] = {'f': name, 'w': img.width, 'h': img.height}

    for key, art in sorted(parse_icon_art().items()):
        img = render_icon(art, args.icon_scale)
        name = f'px_{key}.png'
        total += save(img, os.path.join(args.out, name))
        manifest[f'px:{key}'] = {'f': name, 'w': img.width, 'h': img.height}

    for key, art in sorted(parse_icon_art(SKILL_ART, 'SKILL_ICON_ART').items()):
        img = render_icon(art, args.icon_scale)
        name = f'sk_{key}.png'
        total += save(img, os.path.join(args.out, name))
        manifest[f'sk:{key}'] = {'f': name, 'w': img.width, 'h': img.height}

    with open(os.path.join(args.out, 'manifest.json'), 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, ensure_ascii=False)

    print(f'images {len(manifest)} · {total / 1024 / 1024:.2f} MB · out={args.out}')
    if missing:
        print(f'  (파일 없음 {len(missing)}: {", ".join(missing[:8])})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
