# -*- coding: utf-8 -*-
"""지역 레지스트리 v3 — fetch_region_osm.py / build_osm_tilemap.py 공용.

bbox    : (남, 서, 북, 동). OSM Export(상하좌우) → 남서북동 정렬.
seaEdges: flood fill 시드를 놓는 "실제 바다인" 캔버스 가장자리('N','S','E','W' 조합).
          육지 가장자리에 시드를 놓으면 내륙이 침수된다. 빌드 후 sea ratio 경고로 검증.
spawn   : 리스폰 지점 (위도, 경도). ★대략값 — build가 최근접 이동가능 타일로 스냅해
          meta.json에 기록. 최종 위치는 terrain.txt에서 검수.
          [설계 메모] 후속: 지역당 리스폰 다중화(낚시터별·대중교통 정류장 인접) →
          meta.spawns[] 배열로 확장 예정. 현재는 1지점 선구현.
boundaryMask/adminLevel: 지정 행정구역 경계 밖 육지를 바다로 마스킹(시 구분 확실화).
          광역시·도 = admin_level 4, 시·군·구 = 6.

v3 변경: 초대형 6지역(거제·여수·제주·인천·태안·포항)을 물가 중심 서브지역으로 분할.
         busan3 동쪽 경계를 128.91529로 당겨 busan1과의 다대포 겹침 제거 +
         부산광역시 경계 마스킹으로 진해(창원)측 육지 제거.
         전 지역 ≤ 3.3M타일, 합계 28.2M (분할 전 214.7M 대비 -87%).
원본(분할 전) bbox 백업: 인천(37.2984,126.2230,37.5318,126.7620) 태안(36.6285,125.9112,
36.8640,126.4502) 포항(35.9527,129.2030,36.1903,129.7420) 거제(34.5773,128.1315,35.0598,
129.2095) 여수(34.3939,127.1214,34.8775,128.1995) 제주(33.1324,126.0818,33.6232,127.1599)
"""

REGIONS = {
    # ── 동해 ──
    'sokcho_v2': dict(bbox=(38.18858, 128.56789, 38.21745, 128.63527), seaEdges='E',
                      spawn=(38.2117, 128.5980), spawnName='동명항 방파제 입구'),
    'ulleung': dict(bbox=(37.44284, 130.74966, 37.55941, 131.01917), seaEdges='NSEW',
                    spawn=(37.4835, 130.9070), spawnName='도동항'),
    'dokdo': dict(bbox=(37.23540, 131.85280, 37.25002, 131.88649), seaEdges='NSEW',
                  spawn=(37.2394, 131.8686), spawnName='동도 접안시설'),
    # 포항 → 구룡포·호미곶 해안 분할
    'pohang_guryongpo': dict(bbox=(35.940, 129.500, 36.090, 129.600), seaEdges='E',
                             spawn=(35.9900, 129.5560), spawnName='구룡포항'),
    'ulsan': dict(bbox=(35.39479, 129.25587, 35.51448, 129.52538), seaEdges='SE',
                  spawn=(35.4870, 129.4300), spawnName='방어진항'),

    # ── 부산 (남해 동부) ──
    'busan2': dict(bbox=(35.14279, 129.11459, 35.26286, 129.38410), seaEdges='SE',
                   spawn=(35.1560, 129.1250), spawnName='민락수변공원'),
    'busan1': dict(bbox=(35.01973, 128.91529, 35.13998, 129.18480), seaEdges='S',
                   spawn=(35.0460, 128.9680), spawnName='다대포항'),
    # busan3: 동쪽을 128.91529로 컷(busan1 겹침 제거) + 부산광역시 마스킹(진해측 제거)
    'busan3': dict(bbox=(34.98388, 128.73041, 35.10418, 128.91529), seaEdges='SE',
                   spawn=(35.0280, 128.8290), spawnName='가덕도 천성항',
                   boundaryMask='부산광역시', adminLevel=4),

    # ── 거제 (물가 분할 + 거제시 마스킹) ──
    'geoje_east': dict(bbox=(34.770, 128.660, 34.920, 128.760), seaEdges='E',
                       spawn=(34.8330, 128.6990), spawnName='지세포항',
                       boundaryMask='거제시', adminLevel=6),
    'geoje_south': dict(bbox=(34.660, 128.550, 34.770, 128.700), seaEdges='S',
                        spawn=(34.7060, 128.6070), spawnName='저구항',
                        boundaryMask='거제시', adminLevel=6),

    # ── 여수 (시내·돌산도 — 남해도(남해군)는 별도 지역으로 추후) ──
    'yeosu_city': dict(bbox=(34.580, 127.680, 34.780, 127.800), seaEdges='SE',
                       spawn=(34.7420, 127.7440), spawnName='여수 구항'),

    # ── 서해 ──
    'incheon_yeonan': dict(bbox=(37.430, 126.570, 37.500, 126.650), seaEdges='W',
                           spawn=(37.4520, 126.6010), spawnName='인천 연안부두'),
    'taean_anheung': dict(bbox=(36.640, 126.100, 36.710, 126.200), seaEdges='W',
                          spawn=(36.6740, 126.1300), spawnName='신진도항(안흥외항)'),
    'taean_manripo': dict(bbox=(36.770, 126.130, 36.840, 126.220), seaEdges='W',
                          spawn=(36.7860, 126.1430), spawnName='만리포항'),

    # ── 제주 (3권역) ──
    'jeju_city': dict(bbox=(33.470, 126.400, 33.570, 126.600), seaEdges='N',
                      spawn=(33.5080, 126.4670), spawnName='도두항'),
    'jeju_moseulpo': dict(bbox=(33.180, 126.230, 33.260, 126.340), seaEdges='SW',
                          spawn=(33.2140, 126.2510), spawnName='모슬포 운진항'),
    'jeju_seogwipo': dict(bbox=(33.210, 126.510, 33.280, 126.620), seaEdges='S',
                          spawn=(33.2400, 126.5620), spawnName='서귀포항'),
}

FETCH_SPLIT_DEG = 0.25
