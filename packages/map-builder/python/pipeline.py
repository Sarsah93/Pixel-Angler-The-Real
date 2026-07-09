# -*- coding: utf-8 -*-
"""
@file pipeline.py
@description GIS 지도 추출 및 픽셀 아트 변환, 충돌 JSON Export 통합 빌드 파이프라인
"""

import os
import sys

from download_tiles import download_map_tiles
from merge_tiles import merge_downloaded_tiles
from preprocess import simplify_map_colors
from pixelize import apply_pixel_art_filter
from export import export_map_assets

def run_gis_pixel_pipeline(region_id="pohang_yeongil_bay", resolution=2048):
    print("==================================================")
    print(f"GIS 픽셀 빌드 파이프라인 기동: {region_id} (목표 해상도 {resolution}px)")
    print("==================================================")

    # 1단계: 타일 지도 이미지 다운로드 (테스트용 위경도 임의 셋업)
    # Bounding Box: 포항 신항/송도 인근
    print("\n[STEP 1] 위성지도 TMS 타일 세그먼트 다운로드")
    download_map_tiles(
        min_lat=36.01,
        max_lat=36.05,
        min_lon=129.35,
        max_lon=129.41,
        zoom=14,
        output_dir="packages/map-builder/python/raw_tiles"
    )

    # 2단계: 조각 타일들을 대형 이미지로 결합
    print("\n[STEP 2] 타일 세그먼트 단일 맵으로 병합")
    merge_downloaded_tiles(
        input_dir="packages/map-builder/python/raw_tiles",
        output_path="packages/map-builder/python/merged_map.png"
    )

    # 3단계: 미디언 블러 및 색상 양자화 전처리
    print("\n[STEP 3] 복잡한 질감 단순화 및 16색 제한 전처리")
    simplify_map_colors(
        input_path="packages/map-builder/python/merged_map.png",
        output_path="packages/map-builder/python/preprocessed_map.png",
        num_colors=16
    )

    # 4단계: PixelOE 또는 도트화 다운샘플링 적용
    print("\n[STEP 4] 픽셀아트 텍스처 스타일 변환 필터 적용")
    apply_pixel_art_filter(
        input_path="packages/map-builder/python/preprocessed_map.png",
        output_path="packages/map-builder/python/pixel_map.png",
        target_resolution=resolution
    )

    # 5단계: 최종 에셋 폴더 배포 및 충돌 격자 JSON 추출
    print("\n[STEP 5] 픽셀 맵 복사 및 정밀 충돌/이벤트 타일 JSON 내보내기")
    export_map_assets(
        pixel_img_path="packages/map-builder/python/pixel_map.png",
        region_id=region_id,
        dest_dir="packages/client-pc/public/assets"
    )

    print("\n==================================================")
    print("파이프라인 빌드 완수! 게임 클라이언트에서 에셋 로드 준비 완료.")
    print("==================================================")

if __name__ == "__main__":
    run_gis_pixel_pipeline()
