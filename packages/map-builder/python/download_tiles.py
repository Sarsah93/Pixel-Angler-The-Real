# -*- coding: utf-8 -*-
"""
@file download_tiles.py
@description VWorld/KHOA TMS 타일 다운로드 파이프라인
"""

import os
import math
import urllib.request

def latlon_to_tile(lat, lon, zoom):
    """
    위경도를 OpenStreetMap/VWorld 규격 타일 좌표(X, Y)로 변환
    """
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    xtile = int((lon + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return xtile, ytile

def download_map_tiles(min_lat, max_lat, min_lon, max_lon, zoom, output_dir="raw_tiles"):
    """
    지정된 Bounding Box 범위의 위경도 타일을 다운로드
    """
    os.makedirs(output_dir, exist_ok=True)
    
    x_min, y_min = latlon_to_tile(max_lat, min_lon, zoom)
    x_max, y_max = latlon_to_tile(min_lat, max_lon, zoom)
    
    print(f"다운로드 시작: Zoom {zoom}, X: {x_min}~{x_max}, Y: {y_min}~{y_max}")
    
    # 예시 VWorld 위성지도 타일 URL (사용자 인증키 필요, 없는 경우 OpenStreetMap 대체 가능)
    # 실제 기획 시는 환경변수 등에서 API KEY를 추출하여 동작하도록 함
    api_key = os.environ.get("VWORLD_API_KEY", "MOCK_KEY")
    
    download_count = 0
    for x in range(x_min, x_max + 1):
        for y in range(y_min, y_max + 1):
            url = f"https://api.vworld.kr/req/wmts/1.0.0/{api_key}/Satellite/{zoom}/{y}/{x}.jpeg"
            # API 키가 가짜일 경우 OpenStreetMap 오픈 타일로 폴백
            if api_key == "MOCK_KEY":
                url = f"https://tile.openstreetmap.org/{zoom}/{x}/{y}.png"
                
            file_path = os.path.join(output_dir, f"{zoom}_{x}_{y}.png")
            
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req) as response:
                    with open(file_path, 'wb') as out_file:
                        out_file.write(response.read())
                download_count += 1
            except Exception as e:
                print(f"타일 다운로드 실패 ({x}, {y}): {e}")
                
    print(f"다운로드 완료: 총 {download_count}개의 타일 이미지가 {output_dir}에 저장되었습니다.")

if __name__ == "__main__":
    # 포항 영일만 부근 위경도 Bounding Box 테스트
    download_map_tiles(
        min_lat=36.01,
        max_lat=36.05,
        min_lon=129.35,
        max_lon=129.41,
        zoom=14,
        output_dir="packages/map-builder/python/raw_tiles"
    )
