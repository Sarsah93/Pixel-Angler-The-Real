# -*- coding: utf-8 -*-
"""
@file build_map.py
@description map-builder 패키지의 파이썬 파이프라인을 기동하는 루트 래퍼 스크립트
"""

import os
import sys

# 패키지 경로 탐색 추가
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "packages", "map-builder", "python"))

try:
    from pipeline import run_gis_pixel_pipeline
except ImportError:
    # 파이프라인 파일을 못찾을 경우 로컬 상대경로 보완
    sys.path.append(os.path.join(os.path.dirname(__file__), "../packages/map-builder/python"))
    from pipeline import run_gis_pixel_pipeline

if __name__ == "__main__":
    # 포항 영일만 맵을 해상도 2048px 도트맵으로 픽셀화 빌드 기동
    region = "pohang_yeongil_bay"
    res = 2048
    
    if len(sys.argv) > 1:
        region = sys.argv[1]
    if len(sys.argv) > 2:
        try:
            res = int(sys.argv[2])
        except ValueError:
            pass
            
    run_gis_pixel_pipeline(region_id=region, resolution=res)
