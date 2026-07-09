# -*- coding: utf-8 -*-
"""
@file preprocess.py
@description 위성지도의 복잡한 세부사항을 제거하고 바다/숲/도시/산 등의 색상을 단순화하는 전처리 필터
"""

import os
from PIL import Image, ImageFilter

def simplify_map_colors(input_path="packages/map-builder/python/merged_map.png", output_path="packages/map-builder/python/preprocessed_map.png", num_colors=24):
    """
    위성지도에서 노이즈(나무 질감, 물결 파도 등)를 지우기 위해 단순화 전처리를 적용합니다.
    1. 미디언 필터(Median Filter) 또는 양방향 필터로 자잘한 텍스처 뭉개기
    2. 색상 제한(Color Quantization)을 통한 16~32색 대표색 추출
    3. 해안선 대비 강화를 위한 선명화
    """
    if not os.path.exists(input_path):
        print(f"오류: {input_path} 가 존재하지 않습니다. 전처리를 취소합니다.")
        return False

    print(f"지도 전처리 시작: {input_path} -> 대표색 {num_colors}개 단순화")
    img = Image.open(input_path).convert("RGB")

    # 1단계: 강한 미디언 블러를 적용해 질감과 디테일 노이즈(나무 잎사귀, 테트라포드 무늬 등) 제거
    # Bilateral 필터 대용으로 여러 차례 MedianFilter를 돌립니다.
    for _ in range(3):
        img = img.filter(ImageFilter.MedianFilter(size=5))
    
    # 2단계: 양자화(Quantize)를 통해 16~32색 팔레트로 단순화
    # Adaptive palette를 구하여 포스터라이즈(Posterize) 효과 생성
    quantized = img.quantize(colors=num_colors, method=Image.Quantize.MAXCOVERAGE)
    
    # 다시 RGB로 환원하여 저장 가능한 이미지 포맷으로 변환
    result = quantized.convert("RGB")

    # 3단계: 해안선과 방파제 경계 강화를 위해 가볍게 엣지 향상
    result = result.filter(ImageFilter.EDGE_ENHANCE_MORE)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    result.save(output_path)
    print(f"지도 전처리 성공: {output_path} (색상 단순화 및 경계선 향상 완료)")
    return True

if __name__ == "__main__":
    simplify_map_colors()
