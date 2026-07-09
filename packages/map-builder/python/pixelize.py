# -*- coding: utf-8 -*-
"""
@file pixelize.py
@description PixelOE(PyTorch 기반)를 활용해 전처리된 지도를 2D 픽셀 아트 맵으로 변환하는 변환기
"""

import os
from PIL import Image

def apply_pixel_art_filter(input_path="packages/map-builder/python/preprocessed_map.png", output_path="packages/map-builder/python/pixel_map.png", target_resolution=1024):
    """
    지도를 도트 스타일 픽셀 아트로 변환합니다.
    - PixelOE 라이브러리가 로드되면 사용자의 Torch 고성능 픽셀화를 사용합니다.
    - 만약 설치되지 않았거나 PyTorch 구동에 실패하면, 고품질 Nearest-Neighbor 픽셀 리사이징 필터로 Fallback합니다.
    """
    if not os.path.exists(input_path):
        print(f"오류: {input_path} 가 존재하지 않아 픽셀화 필터를 적용할 수 없습니다.")
        return False

    print(f"픽셀 아트화 시도 중: {input_path} -> 해상도 {target_resolution}px")
    
    # 1. PixelOE (PyTorch) 사용 시도
    try:
        from pixeloe.torch.pixelize import pixelize
        from pixeloe.torch.utils import pre_resize, to_numpy
        
        img = Image.open(input_path)
        print("PixelOE 모델 구동...")
        img_resized = pre_resize(img, target_size=target_resolution, patch_size=4)
        result = pixelize(img_resized, pixel_size=4, thickness=2)
        
        out_img = Image.fromarray(to_numpy(result)[0])
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        out_img.save(output_path)
        print("PixelOE를 활용한 픽셀 변환 성공!")
        return True
    except Exception as e:
        print(f"PixelOE 라이브러리 사용 실패 ({e}). 고전적 도트 다운샘플링 필터로 대체 진행합니다.")

    # 2. Fallback: 고품질 Nearest-Neighbor 하향 샘플링을 통한 픽셀 아트 변환
    try:
        img = Image.open(input_path)
        # 타일 규격 맞춤을 위해 16픽셀 격자 단위로 스케일 계산
        pixel_block_size = 4
        width, height = img.size
        
        # 다운스케일 후 Nearest Neighbor 업스케일로 도트 형태 완성
        small_w = max(16, width // pixel_block_size)
        small_h = max(16, height // pixel_block_size)
        
        small = img.resize((small_w, small_h), Image.Resampling.BILINEAR)
        # 색상 대비 및 포스터라이제이션 가선
        pixelated = small.resize((width, height), Image.Resampling.NEAREST)
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        pixelated.save(output_path)
        print("도트 다운샘플링 필터를 활용한 픽셀 변환 성공!")
        return True
    except Exception as fallback_err:
        print(f"도트 변환 Fallback 실패: {fallback_err}")
        return False

if __name__ == "__main__":
    apply_pixel_art_filter()
