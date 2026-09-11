"""도움말 라이브러리 실캡처 주석 오버레이 (116차 · 117차 선명화).

    py tools/annotate_help_images.py <raw_dir> [--out packages/client-pc/public/guide/help]

`raw_dir`의 `<name>.png`(Playwright 1280×720 실캡처)를 **패널 표시 폭(688px)으로 먼저 축소**(LANCZOS + 언샤프)한 뒤,
그 위에 번호 박스·라벨을 **최종 픽셀 크기로** 그린다 → 게임이 1:1로 그리므로 라벨이 뭉개지지 않는다
(116차는 1280 원본에 그리고 960으로 줄여 텍스트가 재샘플링돼 흐렸다 — 117차 피드백 8.2).
콜아웃 좌표는 CALLOUTS(1280×720 화면 좌표)로 두고 축소 배율만 곱한다 — 레이아웃이 바뀌면 여기만 고친다.
캡처가 없는 키는 안내 문구만 있는 플레이스홀더를 만든다(BootScene 404 방지).
"""
from __future__ import annotations

import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACCENT = (255, 206, 84)
INK = (10, 22, 40)
# HelpLibraryPanel IMG_W = 1080 − 316 − 16 − 60 = 688 → 1280×720 캡처의 표시 크기
OUT_W = 688
OUT_H = round(720 * OUT_W / 1280)   # 387

# name → [(x, y, w, h, label)]  (1280×720 좌표)
CALLOUTS: dict[str, list[tuple[int, int, int, int, str]]] = {
    'hud': [
        (16, 16, 320, 176, '상태 — HP·피로·시계·날씨 (크기/투명 버튼)'),
        (1110, 10, 158, 100, '미니맵 (M 크기)'),
        (420, 646, 440, 62, '퀵슬롯 1~8'),
        (16, 552, 300, 148, '지역 채널 (크기/투명 버튼)'),
        (1196, 640, 64, 64, '단축키 → 도움말'),
    ],
    'rig_bait': [
        (124, 134, 230, 28, '미끼 / 루어 채비 전환'),
        (124, 232, 1032, 134, '소켓 체인 — 원줄→면사매듭→부력찌→수중찌→도래→목줄→봉돌→바늘→미끼'),
        (250, 316, 84, 30, '면사매듭 -/+ = 최대 공략 수심'),
        (124, 378, 1032, 148, '채비 물리 스펙 (총무게·부력·침강·C_d)'),
    ],
    'rig_lure': [
        (256, 134, 96, 28, '루어 채비 탭'),
        (124, 196, 222, 132, '루어 전용 원줄·목줄 소켓'),
        (360, 250, 300, 22, '라인 인장강도 = 텐션 분모'),
        (124, 342, 270, 60, '소프트/하드 → 종류'),
        (124, 432, 310, 58, '라인업 (인벤 보유 루어)'),
        (124, 503, 1032, 150, '루어 제원 · 총무게 (지그헤드 포함)'),
    ],
    'cast_aim': [
        (598, 310, 90, 16, '파워 게이지 (좌클릭 유지)'),
        (640, 340, 430, 60, '조준선 → 착수 마커 (초록 = 바다)'),
        (466, 610, 356, 26, '조작 안내'),
    ],
    'fp_views': [
        (410, 16, 462, 24, '상태 · 조작 요약'),
        (16, 40, 170, 116, '정렬도·동조·입질 확률·피딩·수심'),
        (16, 408, 232, 212, '수평뷰 — 위에서 본 위치·조류'),
        (930, 44, 336, 288, '수심 정보 — 찌·매듭·채비·바닥·조류 존'),
        (596, 250, 240, 40, '찌 · 원줄 (정면)'),
        (470, 620, 340, 68, '쿨러(어창) · 밑밥 C'),
        (1220, 340, 40, 110, '가이드 · 밑밥 버튼'),
    ],
    # ── 131차 — 제작 탭 · 고급 제작대 · 스킬 트리 · 상태 패널 ──
    'craft_tab': [
        (684, 94, 180, 34, '제작 탭 — 조건 없이 어디서나'),
        (121, 143, 338, 520, '도면 목록 — 그룹별 · 칩 색 = 가능/재료 부족/잠김'),
        (488, 224, 300, 18, '산출 · 성공률 · 재료 절약'),
        (485, 248, 400, 60, '필요 재료 — 보유 / 필요'),
        (492, 318, 270, 30, '수량 −/+/최대 → [제작]'),
        (488, 630, 380, 18, '고급 품목은 설치한 제작대에서 [F]'),
    ],
    'workbench': [
        (215, 96, 220, 34, '고급 제작대 — 근접 [F] · 회수는 Shift+F'),
        (228, 145, 280, 470, '고급 도면 6종 — 루어·에기 / 통발 / 로드·릴'),
        (535, 250, 420, 78, '전용 자재 — 식자재마트에서 구매'),
        (538, 378, 300, 20, '제작 스킬 랭크가 모자라면 잠김'),
        (20, 612, 300, 62, '설치 로그'),
    ],
    'skill_tree': [
        (108, 78, 252, 340, '카테고리 7 — 제작 포함'),
        (856, 80, 324, 20, '포인트 = 레벨 + 면허 (합계 215)'),
        (588, 166, 44, 16, '예정 배지 = 효과 배선 전'),
        (978, 500, 176, 62, '??? = 시너지 히든 (조합 완성 시 자동)'),
        (378, 558, 790, 72, '하단 상세 → [배우기]'),
    ],
    'vitals_panel': [
        (18, 16, 322, 200, '상태 패널 대'),
        (200, 92, 132, 40, '허기 · 수분 컴팩트 바'),
        (334, 44, 132, 44, '호버 팝업이 뜨는 자리'),
        (14, 216, 88, 28, '상태이상 스트립 (패널 바깥)'),
    ],
    # 파이팅 (117차 실캡처 — devForceFight)
    'fp_fight': [
        (16, 40, 172, 122, '텐션·하중/줄·랜딩·피로'),
        (410, 16, 462, 24, '상태줄 — 조작'),
        (430, 86, 420, 22, '대응 판정 배지'),
        (420, 110, 440, 26, '패턴 안내'),
        (930, 44, 336, 288, '수심 — 물고기 깊이'),
    ],
    'inventory': [
        (420, 60, 440, 40, '카테고리 탭 (장비/소모품/음식/낚시용품/기타)'),
        (430, 110, 420, 380, '5×5 소켓 — 드래그 이동 · 우클릭 메뉴'),
        (430, 500, 420, 60, '선택 요약 (신선도·남은 시간·희귀도)'),
        (430, 620, 420, 30, '보유 재화'),
    ],
    'equipment': [
        (860, 22, 382, 40, '장비창 (E)'),
        (880, 70, 340, 60, '머리 4칸'),
        (880, 140, 90, 250, '좌측 6칸 — 어깨·상의·팔토시·장갑·손(좌)·반지'),
        (1150, 140, 90, 250, '우측 6칸 — 릴·시계·장갑·손(우)·반지'),
        (980, 140, 160, 250, '캐릭터 (인벤에서 드래그 장착)'),
        (990, 420, 120, 200, '다리 — 하의·양말·신발'),
    ],
    'shop': [
        (40, 60, 460, 40, '상점 (구매/판매 탭)'),
        (50, 110, 440, 380, '상품 그리드 — 호버 툴팁 · 추천 배지'),
        (50, 560, 440, 60, '구매/판매 버튼 → 수량 팝업'),
        (810, 60, 440, 596, '함께 열리는 인벤토리'),
    ],
    # 117차 추가 — 상점 문 앞 E → 상점(좌) + 인벤토리(우)
    'shop_trade': [
        (40, 60, 460, 40, '상점 (구매/판매 탭)'),
        (50, 110, 440, 380, '상품 그리드 — 추천 배지 · 우클릭 상세'),
        (810, 60, 440, 596, '캐릭터 인벤토리 (판매 = 여기서 선택)'),
        (560, 250, 200, 200, '문 앞 캐릭터 — E로 거래 시작'),
    ],
    'cooler': [
        (462, 84, 356, 40, '쿨러 (매질 · 남은 시간)'),
        (484, 150, 312, 316, '3×3 어창 — 우클릭 메뉴 · 밖으로 드래그 = 인벤 이송'),
        (482, 472, 316, 38, '해수 넣기 / 얼음 넣기 / 비우기'),
    ],
    'board': [
        (118, 94, 184, 34, '요리하기 탭'),
        (124, 140, 560, 380, '도마 — 어획물을 드래그해 올린다'),
        (720, 140, 436, 480, '임베드 인벤토리 (음식 탭)'),
        (124, 530, 560, 100, '손질 시작 / 회뜨기 버튼'),
    ],
    'board_fish': [
        (124, 140, 560, 380, '도마 위 어획물 (드래그로 올림 · 내리기 버튼)'),
        (720, 140, 436, 480, '임베드 인벤토리 — 다음 생선 대기'),
        (124, 530, 560, 100, '[손질 시작] — 손에 회칼 착용 필수'),
    ],
    'butchery': [
        (700, 60, 470, 160, '작업 목록 — 섹션 순서 · 작업은 자유'),
        (120, 150, 560, 300, '도마 — 유도선을 따라 드래그'),
        (700, 250, 470, 200, '방향·회전 버튼 / 진행 / 스킬'),
    ],
    'chum_tab': [
        (118, 94, 200, 34, '밑밥 품질 탭'),
        (124, 150, 480, 380, '밑밥 통 — 재료를 드래그해 투입'),
        (640, 150, 516, 380, '재료 인벤토리 (파우더·크릴·곡물)'),
        (124, 540, 480, 60, '물 넣기 → 섞기 = 100 충전'),
    ],
    'codex': [
        (40, 60, 1200, 60, '탭 — 어종 / 해양생물 / 아이템 위키 / 조과 기록'),
        (40, 140, 1200, 480, '발견한 종만 공개 — 미발견은 실루엣 + 서식 힌트'),
    ],
    'bite_s3': [
        (700, 160, 200, 140, '초릿대 3단계 — 크게 휘어 유지 (지금 우클릭)'),
        (560, 240, 160, 60, '찌 잠김'),
        (410, 16, 462, 24, '입질 안내'),
    ],
    'dragin_reel': [
        (440, 300, 400, 120, '큰 화살표 = 이 방향 ←/→ 키 + 릴링'),
        (410, 16, 462, 24, '제압 완료 — 남은 거리'),
    ],
    'catch_popup': [
        (408, 200, 464, 150, '어획 팝업 — 제목 색 = 희귀도 · 본문 끝 [1.16×, 평균]'),
        (420, 392, 440, 56, '쿨러 보관 / 인벤토리 / 방생'),
        (300, 20, 680, 28, '결과 안내 · 계속(SPACE) / 그만(ESC)'),
    ],
    'worldmap': [
        (300, 60, 680, 600, '전국 지도 — 핀 클릭 → 구역 → 출조'),
        (20, 20, 220, 40, '집으로 돌아가기 (무료)'),
    ],
    'home': [
        (400, 60, 162, 100, '집 — E 로 실내 (침대 저장·냉장고·주방)'),
        (836, 520, 40, 60, '출조 버스 — 전국 지도'),
        (180, 262, 110, 20, '선착장 (배 출조 예정)'),
        (1110, 10, 158, 110, '미니맵'),
    ],
}

# 콜아웃 라벨 영문판 (119차) — 영어 로케일용 주석 이미지(help_<key>_en.png)에 쓴다.
# 새 콜아웃을 추가하면 여기에도 한 줄 추가할 것(없으면 한국어 그대로 그려진다).
LABEL_EN: dict[str, str] = {
    # ── 131차 ──
    '제작 탭 — 조건 없이 어디서나': 'Crafting tab — anywhere, no requirements',
    '도면 목록 — 그룹별 · 칩 색 = 가능/재료 부족/잠김': 'Blueprints by group · chip colour = ready / short on materials / locked',
    '산출 · 성공률 · 재료 절약': 'Output · success rate · material saving',
    '필요 재료 — 보유 / 필요': 'Materials — held / needed',
    '수량 −/+/최대 → [제작]': 'Quantity −/+/Max → [Craft]',
    '고급 품목은 설치한 제작대에서 [F]': 'Advanced items need a placed workbench ([F])',
    '고급 제작대 — 근접 [F] · 회수는 Shift+F': 'Advanced workbench — [F] to use · Shift+F to pick up',
    '고급 도면 6종 — 루어·에기 / 통발 / 로드·릴': 'Six advanced blueprints — lures & egi / traps / rod & reel',
    '전용 자재 — 식자재마트에서 구매': 'Dedicated materials — sold at the grocery mart',
    '제작 스킬 랭크가 모자라면 잠김': 'Locked until the crafting skill rank is met',
    '설치 로그': 'Placement log',
    '카테고리 7 — 제작 포함': 'Seven categories — Crafting included',
    '포인트 = 레벨 + 면허 (합계 215)': 'Points = levels + licences (215 total)',
    '예정 배지 = 효과 배선 전': 'Planned badge = effect not wired yet',
    '??? = 시너지 히든 (조합 완성 시 자동)': '??? = hidden synergy (granted on completing the combo)',
    '하단 상세 → [배우기]': 'Detail pane → [Learn]',
    '상태 패널 대': 'Large status panel',
    '허기 · 수분 컴팩트 바': 'Compact hunger / hydration bars',
    '호버 팝업이 뜨는 자리': 'The hover popup appears here',
    '상태이상 스트립 (패널 바깥)': 'Status effect strip (outside the panel)',
    '상태 — HP·피로·시계·날씨 (크기/투명 버튼)': 'Status — HP · fatigue · clock · weather (size / opacity buttons)',
    '미니맵 (M 크기)': 'Minimap (M = size)',
    '퀵슬롯 1~8': 'Quickslots 1–8',
    '지역 채널 (크기/투명 버튼)': 'Region channel (size / opacity buttons)',
    '단축키 → 도움말': 'Help button',
    '미끼 / 루어 채비 전환': 'Bait / lure rig toggle',
    '소켓 체인 — 원줄→면사매듭→부력찌→수중찌→도래→목줄→봉돌→바늘→미끼': 'Socket chain — main line → stopper → float → sinking float → swivel → leader → sinker → hook → bait',
    '면사매듭 -/+ = 최대 공략 수심': 'Stopper knot -/+ = max working depth',
    '채비 물리 스펙 (총무게·부력·침강·C_d)': 'Rig physics (weight · buoyancy · sink · C_d)',
    '루어 채비 탭': 'Lure rig tab',
    '루어 전용 원줄·목줄 소켓': 'Lure-only main line & leader sockets',
    '라인 인장강도 = 텐션 분모': 'Line strength = tension divisor',
    '소프트/하드 → 종류': 'Soft / hard → type',
    '라인업 (인벤 보유 루어)': 'Lineup (lures you own)',
    '루어 제원 · 총무게 (지그헤드 포함)': 'Lure specs · total weight (incl. jig head)',
    '파워 게이지 (좌클릭 유지)': 'Power gauge (hold left-click)',
    '조준선 → 착수 마커 (초록 = 바다)': 'Aim line → splashdown marker (green = water)',
    '조작 안내': 'Control hints',
    '상태 · 조작 요약': 'State · control summary',
    '정렬도·동조·입질 확률·피딩·수심': 'Alignment · chum sync · bite chance · feeding · depth',
    '수평뷰 — 위에서 본 위치·조류': 'Plan view — position & current from above',
    '수심 정보 — 찌·매듭·채비·바닥·조류 존': 'Depth panel — float · stopper · rig · bottom · current zone',
    '찌 · 원줄 (정면)': 'Float · main line (front view)',
    '쿨러(어창) · 밑밥 C': 'Cooler (fish box) · chum (C)',
    '가이드 · 밑밥 버튼': 'Guide · chum buttons',
    '텐션·하중/줄·랜딩·피로': 'Tension · load/line · landing · fatigue',
    '상태줄 — 조작': 'Status bar — controls',
    '대응 판정 배지': 'Response verdict badge',
    '패턴 안내': 'Pattern prompt',
    '수심 — 물고기 깊이': 'Depth — fish depth',
    '카테고리 탭 (장비/소모품/음식/낚시용품/기타)': 'Category tabs (Gear / Consumables / Food / Tackle / Misc)',
    '5×5 소켓 — 드래그 이동 · 우클릭 메뉴': '5×5 sockets — drag to move · right-click menu',
    '선택 요약 (신선도·남은 시간·희귀도)': 'Selection summary (condition · time left · rarity)',
    '보유 재화': 'Money',
    '장비창 (E)': 'Equipment (E)',
    '머리 4칸': 'Head — 4 slots',
    '좌측 6칸 — 어깨·상의·팔토시·장갑·손(좌)·반지': 'Left 6 — shoulder · top · sleeve · glove · hand (L) · ring',
    '우측 6칸 — 릴·시계·장갑·손(우)·반지': 'Right 6 — reel · watch · glove · hand (R) · ring',
    '캐릭터 (인벤에서 드래그 장착)': 'Character (drag from inventory to equip)',
    '다리 — 하의·양말·신발': 'Legs — bottoms · socks · shoes',
    '상점 (구매/판매 탭)': 'Shop (Buy / Sell tabs)',
    '상품 그리드 — 호버 툴팁 · 추천 배지': 'Item grid — hover tooltip · recommended badge',
    '구매/판매 버튼 → 수량 팝업': 'Buy / Sell → quantity dialog',
    '함께 열리는 인벤토리': 'Inventory opens alongside',
    '상품 그리드 — 추천 배지 · 우클릭 상세': 'Item grid — recommended badge · right-click details',
    '캐릭터 인벤토리 (판매 = 여기서 선택)': 'Your inventory (pick here to sell)',
    '문 앞 캐릭터 — E로 거래 시작': 'At the door — press E to trade',
    '쿨러 (매질 · 남은 시간)': 'Cooler (medium · time left)',
    '3×3 어창 — 우클릭 메뉴 · 밖으로 드래그 = 인벤 이송': '3×3 fish box — right-click menu · drag out = move to inventory',
    '해수 넣기 / 얼음 넣기 / 비우기': 'Add seawater / Add ice / Empty',
    '요리하기 탭': 'Cooking tab',
    '도마 — 어획물을 드래그해 올린다': 'Board — drag a catch onto it',
    '임베드 인벤토리 (음식 탭)': 'Embedded inventory (Food tab)',
    '손질 시작 / 회뜨기 버튼': 'Start butchery / slice sashimi',
    '도마 위 어획물 (드래그로 올림 · 내리기 버튼)': 'Catch on the board (drag on · Remove button)',
    '임베드 인벤토리 — 다음 생선 대기': 'Embedded inventory — next fish waiting',
    '[손질 시작] — 손에 회칼 착용 필수': '[Start butchery] — a sashimi knife must be in hand',
    '작업 목록 — 섹션 순서 · 작업은 자유': 'Task list — sections in order · tasks in any order',
    '도마 — 유도선을 따라 드래그': 'Board — drag along the guide line',
    '방향·회전 버튼 / 진행 / 스킬': 'Flip / rotate buttons · progress · skill',
    '밑밥 품질 탭': 'Chum quality tab',
    '밑밥 통 — 재료를 드래그해 투입': 'Chum bucket — drag ingredients in',
    '재료 인벤토리 (파우더·크릴·곡물)': 'Ingredients (powder · krill · grain)',
    '물 넣기 → 섞기 = 100 충전': 'Add water → mix = 100 charge',
    '탭 — 어종 / 해양생물 / 아이템 위키 / 조과 기록': 'Tabs — Fish / Sea life / Item wiki / Catch log',
    '발견한 종만 공개 — 미발견은 실루엣 + 서식 힌트': 'Only discovered species are shown — the rest stay silhouettes with habitat hints',
    '초릿대 3단계 — 크게 휘어 유지 (지금 우클릭)': 'Rod tip stage 3 — deep bend held (right-click now)',
    '찌 잠김': 'Float pulled under',
    '입질 안내': 'Bite prompt',
    '큰 화살표 = 이 방향 ←/→ 키 + 릴링': 'Big arrow = press this ←/→ key while reeling',
    '제압 완료 — 남은 거리': 'Fish subdued — distance left',
    '어획 팝업 — 제목 색 = 희귀도 · 본문 끝 [1.16×, 평균]': 'Catch popup — title colour = rarity · line ends with [1.16×, Average]',
    '쿨러 보관 / 인벤토리 / 방생': 'Keep in cooler / inventory / release',
    '결과 안내 · 계속(SPACE) / 그만(ESC)': 'Result · Continue (SPACE) / Stop (ESC)',
    '전국 지도 — 핀 클릭 → 구역 → 출조': 'National map — click a pin → area → set out',
    '집으로 돌아가기 (무료)': 'Go home (free)',
    '집 — E 로 실내 (침대 저장·냉장고·주방)': 'Home — press E to enter (bed save · fridge · kitchen)',
    '출조 버스 — 전국 지도': 'Fishing bus — national map',
    '선착장 (배 출조 예정)': 'Jetty (boat trips coming)',
    '미니맵': 'Minimap',
}

KEYS = ['hud', 'worldmap', 'inventory', 'equipment', 'shop', 'shop_trade', 'rig_bait', 'rig_lure', 'cast_aim',
        'fp_views', 'fp_fight', 'board', 'board_fish', 'butchery', 'cooler', 'home', 'chum_tab', 'codex',
        'bite_s3', 'dragin_reel', 'catch_popup',
        'craft_tab', 'workbench', 'skill_tree', 'vitals_panel']


FONT_CANDIDATES = (
    'C:/Windows/Fonts/malgunbd.ttf', 'C:/Windows/Fonts/malgun.ttf', 'C:/Windows/Fonts/NanumGothicBold.ttf',
    # Linux/CI — 한글 폰트가 있으면 쓴다. 없으면 라틴 폰트로 떨어지고 한국어 콜아웃은 건너뛴다.
    '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
)


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for cand in FONT_CANDIDATES:
        if os.path.exists(cand):
            return ImageFont.truetype(cand, size)
    return ImageFont.load_default()


def hangul_ok() -> bool:
    """찾은 폰트가 한글을 **실제로** 그릴 수 있는가.

    ⚠ `getmask('가')`가 비어 있지 않은 것만으로는 판정할 수 없다 — 글리프가 없으면
    FreeType이 `.notdef`(두부 □)를 그려 주기 때문에 마스크가 항상 채워져 나온다.
    그래서 **사용자 영역 문자(글리프가 있을 리 없는 것)와 비교**해 같으면 두부로 본다.
    """
    f = font(16)
    try:
        a = f.getmask('가').tobytes()
        b = f.getmask('\ue000').tobytes()
        return a != b
    except Exception:
        return False


def downscale(im: Image.Image) -> Image.Image:
    """표시 크기로 축소 + 약한 언샤프 — 도트·UI 텍스트 선명도 보존"""
    out = im.convert('RGB').resize((OUT_W, OUT_H), Image.LANCZOS)
    return out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=2))


def draw_callouts(im: Image.Image, items: list[tuple[int, int, int, int, str]], k: float,
                  lang: str = 'ko') -> None:
    """축소된 이미지 위에 최종 픽셀 크기로 그린다 — 라벨 13px 볼드 + 어두운 외곽선(가독)"""
    d = ImageDraw.Draw(im, 'RGBA')
    f = font(13)
    fb = font(12)
    for i, (x, y, w, h, label) in enumerate(items, 1):
        if not label:
            continue
        if lang == 'en':
            label = LABEL_EN.get(label, label)
        x, y, w, h = round(x * k), round(y * k), round(w * k), round(h * k)
        d.rectangle([x, y, x + w, y + h], outline=ACCENT, width=2)
        bx, by = x, max(2, y - 20)
        d.rounded_rectangle([bx, by, bx + 18, by + 18], radius=4, fill=ACCENT)
        d.text((bx + 9, by + 9), str(i), fill=INK, font=fb, anchor='mm')
        tw = d.textlength(label, font=f)
        lx = bx + 22
        if lx + tw + 8 > im.width:
            lx = max(3, x + w - tw - 8)
        d.rounded_rectangle([lx - 4, by, lx + tw + 5, by + 18], radius=4, fill=(6, 14, 28, 235))
        # 외곽선(stroke)으로 작은 글자 가독 확보
        d.text((lx, by + 9), label, fill=ACCENT, font=f, anchor='lm', stroke_width=1, stroke_fill=(6, 14, 28))


def placeholder(key: str, text: str, out: str) -> None:
    im = Image.new('RGB', (OUT_W, 220), (12, 30, 48))
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, OUT_W - 3, 217], outline=(28, 61, 90), width=2)
    d.text((OUT_W / 2, 95), text, fill=(159, 192, 212), font=font(17), anchor='mm')
    d.text((OUT_W / 2, 130), '(실플레이 캡처로 교체 예정 — tools/annotate_help_images.py)', fill=(84, 106, 124), font=font(12), anchor='mm')
    im.save(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('raw_dir')
    ap.add_argument('--out', default=os.path.join(ROOT, 'packages', 'client-pc', 'public', 'guide', 'help'))
    ap.add_argument('--only', nargs='*', default=None, help='특정 키만 재생성')
    ap.add_argument('--lang', default='ko', choices=['ko', 'en'],
                    help='en이면 라벨을 영문으로 그리고 help_<key>_en.png로 저장')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    made = []
    k = OUT_W / 1280
    for key in (a.only or KEYS):
        src = os.path.join(a.raw_dir, f'{key}.png')
        suffix = '_en' if a.lang == 'en' else ''
        out = os.path.join(a.out, f'help_{key}{suffix}.png')
        if os.path.exists(src):
            im = downscale(Image.open(src))
            items = [c for c in CALLOUTS.get(key, []) if c[4]]
            if items and a.lang == 'ko' and not hangul_ok():
                print(f'  ! {key}: 한글 폰트가 없어 콜아웃을 건너뜁니다 (축소본만 저장)')
                items = []
            if items:
                draw_callouts(im, items, k, a.lang)
            im.save(out, optimize=True)
            made.append(f'{key} ({len(items)} callouts)')
        elif not os.path.exists(out):
            placeholder(key, {'fp_fight': '파이팅 화면 — 텐션바 · 하중/줄 · 대응 판정 배지'}.get(key, f'{key} 캡처 준비 중'), out)
            made.append(f'{key} (placeholder)')
        else:
            made.append(f'{key} (kept)')
    print('\n'.join(made))


if __name__ == '__main__':
    sys.exit(main())
