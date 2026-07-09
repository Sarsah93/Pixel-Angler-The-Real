# -*- coding: utf-8 -*-
"""
@file pixelize.py
@description webglmap.png 이미지를 512px 도트 스타일로 변환하는 단독 실행용 스크립트
"""

import os
import sys
from PIL import Image

INPUT = "webglmap.png"
OUTPUT = "webglmap_pixel.png"

def run_pixelize():
    if not os.path.exists(INPUT):
        print(f"오류: 입력 파일 '{INPUT}'이 존재하지 않습니다.")
        print("최상위 폴더에 'webglmap.png'가 존재하는지 확인해주세요.")
        return

    print("Loading image...")
    img = Image.open(INPUT)
    w, h = img.size
    print(f"Original size: {w}x{h}")

    # 가로 1000, 세로 500 한계로 비율(Aspect Ratio) 고정 계산
    max_w, max_h = 1000, 500
    ratio = min(max_w / w, max_h / h)
    new_w = int(w * ratio)
    new_h = int(h * ratio)
    print(f"Target size (Aspect Ratio Locked): {new_w}x{new_h}")

    # 1. PyTorch 기반 PixelOE 시도
    try:
        from pixeloe.torch.pixelize import pixelize
        from pixeloe.torch.utils import pre_resize, to_numpy
        
        print("Pixelizing with PixelOE...")
        img_resized = pre_resize(
            img,
            target_size=max(new_w, new_h),
            patch_size=4
        )
        # 비율 유지를 위해 강제 크기 조절
        img_resized = img_resized.resize((new_w, new_h), Image.Resampling.BILINEAR)
        result = pixelize(
            img_resized,
            pixel_size=4,
            thickness=3
        )
        Image.fromarray(
            to_numpy(result)[0]
        ).save(OUTPUT)
        print(f"Success! Output saved as '{OUTPUT}'")
        return
    except Exception as e:
        print(f"PixelOE 구동 실패 ({e}). 고전적 도트 변환(Nearest-Neighbor)으로 Fallback을 시도합니다.")

    # 2. Fallback: PIL 이미지 다운샘플링 픽셀화
    try:
        # 다운스케일
        small = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
        # 도트 부각을 위해 4배 작게 다운샘플링 후 Nearest Neighbor 복원
        pixel_size = 4
        scaled_w = max(16, new_w // pixel_size)
        scaled_h = max(16, new_h // pixel_size)
        
        small_pixel = small.resize((scaled_w, scaled_h), Image.Resampling.BILINEAR)
        pixelated = small_pixel.resize((new_w, new_h), Image.Resampling.NEAREST)
        
        pixelated.save(OUTPUT)
        print(f"Fallback Success! Output saved as '{OUTPUT}' (Size: {new_w}x{new_h})")
    except Exception as fallback_err:
        print(f"도트 픽셀화 변환 전체 실패: {fallback_err}")

if __name__ == "__main__":
    run_pixelize()
