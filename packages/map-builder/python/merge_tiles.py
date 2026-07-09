# -*- coding: utf-8 -*-
"""
@file merge_tiles.py
@description 다운로드된 조각 타일들을 단일 대형 지도 파일로 병합하는 유틸리티
"""

import os
import re
from PIL import Image

def merge_downloaded_tiles(input_dir="packages/map-builder/python/raw_tiles", output_path="packages/map-builder/python/merged_map.png"):
    """
    타일 디렉토리의 {zoom}_{x}_{y}.png 파일들을 분석하여 격자 형태로 합쳐 단일 이미지를 빌드합니다.
    """
    if not os.path.exists(input_dir):
        print(f"오류: 입력 디렉토리 {input_dir}가 존재하지 않습니다.")
        return

    files = [f for f in os.listdir(input_dir) if f.endswith(".png") or f.endswith(".jpeg")]
    if not files:
        print("경고: 병합할 타일 파일이 없습니다.")
        return

    # 파일명 분석 ({zoom}_{x}_{y}.png)
    pattern = re.compile(r"(\d+)_(\d+)_(\d+)\.(png|jpeg)")
    tiles = []
    for f in files:
        m = pattern.match(f)
        if m:
            zoom, x, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
            tiles.append((x, y, os.path.join(input_dir, f)))

    if not tiles:
        print("오류: 타일 규격과 일치하는 파일이 없습니다.")
        return

    # X, Y 인덱스 범위 산출
    xs = [t[0] for t in tiles]
    ys = [t[1] for t in tiles]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    cols = max_x - min_x + 1
    rows = max_y - min_y + 1

    # 첫 타일을 열어 타일당 규격 해상도 구하기 (일반적으로 256x256)
    sample_img = Image.open(tiles[0][2])
    tile_w, tile_h = sample_img.size

    merged_w = cols * tile_w
    merged_h = rows * tile_h

    print(f"지도 결합 중: {cols}x{rows} 격자 -> 총 해상도 {merged_w}x{merged_h} px")
    new_map = Image.new("RGBA", (merged_w, merged_h))

    # 타일 순회하며 그리기
    for x, y, path in tiles:
        grid_x = x - min_x
        grid_y = y - min_y
        tile_img = Image.open(path)
        new_map.paste(tile_img, (grid_x * tile_w, grid_y * tile_h))

    # 결과물 저장
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    new_map.save(output_path)
    print(f"지도 결합 완료: {output_path} 로 저장되었습니다.")

if __name__ == "__main__":
    merge_downloaded_tiles()
