# -*- coding: utf-8 -*-
"""
@file export.py
@description 변환 완료된 도트 이미지와 지형/충돌 타일 메타데이터를 게임 클라이언트 에셋 폴더로 내보내는 스크립트
"""

import os
import json
import shutil
from PIL import Image

def export_map_assets(
    pixel_img_path="packages/map-builder/python/pixel_map.png",
    region_id="pohang_yeongil_bay",
    dest_dir="packages/client-pc/public/assets"
):
    """
    1. pixel_map.png -> public/assets/maps/{region_id}.png 복사
    2. 픽셀 색상 기반 자동 타일 분류 및 충돌 레이어 JSON 생성 -> public/assets/collision/{region_id}.json 저장
    """
    if not os.path.exists(pixel_img_path):
        print(f"오류: 픽셀화 맵 {pixel_img_path}가 없습니다. 내보내기를 중단합니다.")
        return False

    os.makedirs(os.path.join(dest_dir, "maps"), exist_ok=True)
    os.makedirs(os.path.join(dest_dir, "collision"), exist_ok=True)

    # 1. 픽셀 이미지 복사
    dest_img_path = os.path.join(dest_dir, "maps", f"{region_id}.png")
    shutil.copy(pixel_img_path, dest_img_path)
    print(f"이미지 복사 완료: {dest_img_path}")

    # 2. 이미지 색상 분석을 통한 타일 메타데이터 및 충돌 레이어 생성
    img = Image.open(pixel_img_path).convert("RGB")
    width, height = img.size
    
    # 16px 타일 기준
    tile_size = 16
    cols = width // tile_size
    rows = height // tile_size

    tiles_data = []

    print(f"충돌 및 지형 타일 맵 분석 중... ({cols}x{rows} 격자)")

    for r_idx in range(rows):
        for c_idx in range(cols):
            # 타일 중심의 픽셀 색상 추출 (블록 내 평균 혹은 중심 샘플링)
            cx = c_idx * tile_size + tile_size // 2
            cy = r_idx * tile_size + tile_size // 2
            
            if cx < width and cy < height:
                r, g, b = img.getpixel((cx, cy))
            else:
                r, g, b = 0, 0, 0

            # 단순 RGB 기반 자동 분류
            terrain = "land"
            is_collision = False

            # 바다 (B 성분 우세)
            if b > 115 and r < 90 and g < 110:
                terrain = "water"
                is_collision = True
            # 녹지/밭 (G 성분 우세)
            elif g > 110 and r < 95 and b < 95:
                terrain = "safe_zone"
                is_collision = False
            # 테트라포드, 장벽 (회색조 높은 값)
            elif r > 150 and g > 150 and b > 150 and abs(r - g) < 15 and abs(g - b) < 15:
                terrain = "obstacle"
                is_collision = True
            # 방파제 직벽 경계선 (R, G 우세 조화)
            elif r > 110 and g > 100 and b < 85:
                terrain = "breakwater_edge"
                is_collision = False

            tile_meta = {
                "tileX": c_idx,
                "tileY": r_idx,
                "terrain": terrain,
                "isCollision": is_collision
            }
            tiles_data.append(tile_meta)

    export_json = {
        "regionId": region_id,
        "resolution": width,
        "columns": cols,
        "rows": rows,
        "tiles": tiles_data
    }

    # 3. JSON 저장
    dest_json_path = os.path.join(dest_dir, "collision", f"{region_id}.json")
    with open(dest_json_path, "w", encoding="utf-8") as f:
        json.dump(export_json, f, ensure_ascii=False, indent=2)

    print(f"타일 메타데이터 저장 완료: {dest_json_path}")
    print("내보내기 파이썬 파이프라인 최종 완료! 🚀")
    return True

if __name__ == "__main__":
    export_map_assets()
