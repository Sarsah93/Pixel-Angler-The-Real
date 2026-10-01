"""도움말 라이브러리 실캡처 주석 오버레이 (116차 · 117차 선명화 · 187차 번호 콜아웃).

    node tools/capture_help_images.cjs <raw_dir> [--lang ko|en]      # 1) 실캡처 (dev 서버 필요)
    py tools/annotate_help_images.py <raw_dir> [--lang ko|en] [--out packages/client-pc/public/guide/help]

`raw_dir`의 `<name>.png`(Playwright 1280×720 실캡처)를 **패널 표시 폭(688px)으로 먼저 축소**(LANCZOS + 언샤프)한 뒤,
그 위에 테두리와 번호 배지를 **최종 픽셀 크기로** 그린다 → 게임이 1:1로 그리므로 뭉개지지 않는다.
187차부터는 **번호만** 그린다 — 뜻은 HelpContent.ts의 imageCaption(①②③…)이 말하므로 콜아웃 순서는 캡션 순서와 같아야 한다.
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

# name → [(x, y, w, h[, 배지 위치])]  (1280×720 화면 좌표) — 187차: **번호만** 그린다.
# 배지 위치 = 'above'(기본 · 박스 왼쪽 위 바깥) / 'left' / 'right' / 'below' / 'in'(안쪽 왼쪽 위) / 'inr'(안쪽 오른쪽 위)
# — 배지가 제목·탭·글자를 가리면 여기서 옮긴다(검수 = 축소본을 눈으로).
# 번호의 뜻은 HelpContent.ts의 imageCaption(①②③…)이 말한다 — 순서를 캡션과 똑같이 맞출 것.
# (131~136차의 라벨형 콜아웃은 좁은 곳에서 라벨끼리 겹쳤고, 영문판 라벨 사전도 따로 관리해야 했다.)
# 캡처 하네스 = tools/capture_help_images.cjs. 화면이 바뀌면 다시 찍고 좌표만 고친다.
CALLOUTS: dict[str, list[tuple]] = {
    # ── 시작하기 ──
    # 캐릭터 만들기 — ① 미리보기 ② 외형 항목 ③ 생성 버튼
    'char_create': [(42, 90, 426, 536, 'in'), (488, 120, 750, 350, 'inr'), (66, 652, 572, 40)],
    # ① 상태 ② 지도 ③ 지금 할 일 ④ 목표 화살표 ⑤ 지역 채널 ⑥ 퀵슬롯 ⑦ 도움말 버튼
    'hud': [(16, 16, 320, 196), (1110, 10, 158, 112), (1034, 138, 234, 124), (636, 272, 84, 44),
            (16, 552, 300, 148), (418, 646, 444, 62), (1196, 640, 64, 64)],
    # ① 집 문 ② 보건소 ③ 우물 ④ 선착장 ⑤ 출조 버스 정류장 ⑥ 지금 할 일
    'hometown': [(430, 110, 110, 96), (734, 166, 52, 58), (612, 184, 36, 36), (176, 258, 108, 26),
                 (822, 520, 58, 58), (1034, 156, 234, 124)],
    # ① 침대 메뉴 ② 침대 ③ 냉장고 ④ 개수대 · 가스레인지 ⑤ 문
    'home_interior': [(470, 268, 340, 184, 'in'), (786, 230, 92, 132), (358, 230, 36, 88), (402, 230, 140, 40),
                      (596, 570, 88, 44)],
    # 전국 지도 — ① 지역 목록 ② 지도 핀 ③ 범례 ④ 집으로 돌아가기
    'worldmap': [(14, 112, 344, 570, 'below'), (380, 60, 580, 580), (1130, 576, 132, 138), (16, 14, 150, 34, 'right')],
    # 환경설정 — ① 탭 ② 장소 이름표 ③ 할 일 위치 안내
    'settings': [(258, 134, 736, 40), (298, 208, 640, 110, 'left'), (298, 360, 640, 108, 'left')],
    # ── 조작 ──
    # ① 할 수 있는 일을 고르는 창 ② 바닥의 물건 줄
    'interact_choice': [(352, 222, 236, 116), (358, 290, 226, 40, 'left')],
    # ── 이야기 ──
    # ① 이름 · 나이 · 하는 일 ② 얼굴과 우호도 눈금 ③ 타이핑되는 대사 ④ 선택지
    'dialog': [(126, 336, 524, 24, 'left'), (138, 374, 204, 320, 'in'), (364, 374, 782, 166, 'inr'), (372, 548, 768, 110)],
    # ① 할 일 / 이야기 탭 ② 완료 · 잠긴 할 일 표시 ③ 고정 체크 ④ 목록 ⑤ 사연 · 목표 · 방법 · 보상
    'journal': [(112, 70, 112, 24, 'left'), (234, 70, 236, 24), (118, 134, 34, 26), (190, 124, 410, 44),
                (612, 100, 556, 390)],
    # ① 지금 할 일 ② 목표 화살표 ③ 미니맵 표시
    'tracker': [(1034, 138, 234, 124), (636, 272, 84, 44), (1110, 10, 158, 112)],
    # ── 낚시 ──
    # 수산물 직판장 — ① 탭 ② 상품 ③ 구매 / 판매 ④ 함께 열리는 인벤토리
    'shop': [(52, 118, 434, 36, 'left'), (78, 158, 384, 306, 'left'), (68, 594, 404, 44), (812, 62, 436, 590)],
    # ① 미끼 / 루어 전환 ② 소켓 9개 ③ 면사매듭 −/+ ④ 채비 제원 ⑤ 채비 고정 버튼
    'rig_bait': [(122, 132, 232, 30, 'right'), (122, 230, 1036, 136, 'left'), (250, 312, 86, 26, 'right'), (124, 376, 1032, 150),
                 (894, 480, 252, 40, 'left')],
    # 루어 채비 탭 — ① 미끼 / 루어 전환 ② 원줄 · 목줄 ③ 소프트 / 하드 → 종류 → 라인업 ④ 루어 제원 · 채비 고정
    'rig_lure': [(240, 132, 114, 30, 'right'), (122, 192, 224, 136, 'left'), (122, 340, 312, 150, 'in'), (124, 502, 1032, 150, 'inr')],
    # ① 파워 게이지 ② 조준선 · 착수 마커 · 산포 원 ③ 조작 안내
    'cast_aim': [(596, 310, 88, 16, 'left'), (632, 372, 92, 150), (420, 610, 440, 28, 'left')],
    # ① 상태 · 조작 요약 ② 정렬도 · 동조 · 입질 확률 ③ 수평뷰 ④ 수직뷰 ⑤ 쿨러 · 밑밥
    'fp_views': [(298, 16, 686, 26, 'left'), (16, 40, 174, 110, 'right'), (16, 408, 232, 212), (928, 44, 338, 288, 'left'),
                 (468, 610, 344, 82, 'left')],
    # ① 「지금 챔질!」 ② 초릿대 · 찌 ③ 입질 안내
    'bite_s3': [(566, 180, 148, 32), (620, 250, 180, 70), (310, 568, 660, 24)],
    # ① 텐션 · 하중/줄 · 랜딩 · 피로 ② 상태줄 ③ 텐션 바 ④ 대응 판정 · 패턴 안내 ⑤ 물고기 깊이
    # (대응 판정 배지는 랜딩·제압 바 위에 겹쳐 그려져 배지 자리가 없다 — 패턴 안내와 한 박스로)
    'fp_fight': [(16, 40, 262, 92, 'right'), (392, 16, 498, 26, 'left'), (430, 52, 420, 22, 'left'),
                 (376, 86, 528, 52, 'left'), (928, 44, 338, 288)],
    # ① 제압 완료 · 남은 거리 ② 방향 화살표
    'dragin_reel': [(448, 104, 384, 34), (576, 306, 130, 30)],
    # ① 제목 ② 길이 · 무게 · 성별 [배율×, 등급] ③ 쿨러 / 인벤토리 / 방생
    'catch_popup': [(520, 160, 240, 36), (500, 384, 280, 24), (414, 456, 452, 44)],
    # ① 스풀 행 ② R 유지 = 베일 개방 안내 ③ 수평뷰
    'spool': [(1146, 200, 120, 24, 'left'), (310, 568, 660, 24), (16, 408, 232, 212)],
    # ① 텐션 바 ② 슬랙 경고 ③ 줄 주기 중 안내
    'spool_fight': [(430, 52, 420, 22, 'left'), (508, 142, 264, 36, 'left'), (310, 568, 660, 24)],
    # 밑걸림 — ① 두 선택지의 결과 확률 ② 끌어당기기 / 끊기
    'snag': [(452, 320, 376, 50), (452, 390, 376, 44, 'left')],
    # U → 밑밥 품질 탭 — ① 재료 ② 밑밥 통 ③ 물 넣기 → 섞기 ④ 추천 배합
    'chum_tab': [(660, 146, 496, 470, 'inr'), (140, 170, 460, 240, 'in'), (128, 424, 484, 38), (136, 472, 500, 130)],
    # ── 손질 · 회 ──
    # ① 도마 위 어획물 ② 임베드 인벤토리 ③ [손질 시작]
    'board_fish': [(250, 236, 260, 140), (660, 146, 496, 470, 'inr'), (146, 196, 96, 28)],
    # ① 작업 목록 ② 도마 유도선 ③ 방향 · 회전 버튼
    'butchery': [(504, 78, 222, 84), (140, 196, 592, 262), (798, 230, 334, 78)],
    # ── 요리 · 제작 ──
    # ① 재료 · 양념 넣기 ② 단면 뷰 · 온도 적정대 ③ 불 세기 ④ 지금 내리면 받을 별 ⑤ 순서 안내 ⑥ 불 끄고 내리기
    'cook_panel': [(198, 130, 250, 476, 'left'), (560, 130, 300, 220), (504, 356, 326, 30, 'left'), (876, 130, 200, 134),
                   (876, 270, 200, 130, 'left'), (474, 584, 230, 30, 'left')],
    # ① 도면 목록 ② 산출 · 성공률 · 필요 재료 ③ 수량 → [제작] ④ 고급 품목 안내
    'craft_tab': [(120, 142, 340, 512, 'left'), (486, 170, 420, 140, 'inr'), (490, 316, 264, 32, 'left'), (486, 628, 380, 20)],
    # ① 고급 도면 6종 ② 필요 재료 ③ 스킬 잠김
    'workbench': [(226, 144, 282, 458, 'left'), (536, 250, 260, 80, 'left'), (538, 376, 196, 20, 'left')],
    # ── 가방 · 장비 ──
    # ① 탭 ② 칸(스크롤) ③ 선택 요약 ④ 보유 재화
    'inventory': [(432, 106, 416, 34, 'left'), (458, 146, 364, 364, 'left'), (440, 574, 400, 30, 'left'), (432, 610, 416, 36, 'left')],
    # 장비창 — ① 머리 ② 왼쪽 ③ 오른쪽 ④ 다리 ⑤ 착용 현황
    'equipment': [(936, 66, 230, 56, 'left'), (874, 128, 56, 346), (1172, 128, 56, 346), (994, 480, 114, 172, 'left'),
                  (938, 130, 226, 342, 'in')],
    # ① 고장 표시 ② 상태 · 수리 행
    'gear_fault': [(154, 148, 66, 66), (536, 286, 290, 48)],
    # 쿨러 — ① 매질 · 남은 시간 ② 3×3 어창 ③ 해수 · 얼음 · 비우기
    'cooler': [(464, 86, 352, 30), (484, 150, 312, 314, 'left'), (480, 472, 320, 40)],
    # ── 경제 · 세계 · 성장 ──
    # ① 상점 창 ② 함께 열리는 인벤토리
    'shop_trade': [(42, 62, 456, 592), (812, 62, 436, 590)],
    # 면허 · 허가 — ① 면허 목록 ② 상세 ③ 갱신
    'license': [(288, 138, 334, 450, 'left'), (630, 140, 356, 160), (694, 500, 228, 80)],
    # ① 지도 ② 범례 ③ 목표(금색 고리) ④ 조작 안내
    'fullmap': [(24, 52, 1232, 580, 'in'), (24, 640, 1232, 30), (722, 184, 34, 34), (850, 692, 410, 16)],
    # N 도감 — ① 탭 ② 발견 수 ③ 카드
    'codex': [(58, 92, 714, 36, 'left'), (1120, 130, 126, 22), (38, 158, 944, 494)],
    # 스킬 트리 — ① 카테고리 ② 남은 포인트 ③ 스킬 카드 ④ ??? ⑤ 상세와 [배우기]
    'skill_tree': [(112, 78, 240, 364, 'left'), (856, 76, 308, 20), (388, 112, 568, 446, 'left'), (978, 502, 172, 60, 'left'),
                   (376, 566, 790, 82)],
    # ① 상태 패널 ② 허기 · 수분 바 ③ 마우스를 올리면 뜨는 값 ④ 상태이상 칩
    'vitals_panel': [(18, 16, 318, 196, 'right'), (200, 92, 128, 44, 'left'), (332, 112, 94, 46), (14, 214, 80, 28, 'right')],
}

# BootScene HELP_IMAGE_KEYS와 같은 목록(help_<key>.png / help_<key>_en.png)
KEYS = list(CALLOUTS.keys())


FONT_CANDIDATES = (
    'C:/Windows/Fonts/malgunbd.ttf', 'C:/Windows/Fonts/malgun.ttf', 'C:/Windows/Fonts/NanumGothicBold.ttf',
    # Linux/CI — 한글 폰트가 있으면 쓴다. 없으면 라틴 폰트로 떨어지고 한국어 콜아웃은 건너뛴다.
    '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
    # 136차 — 이 컨테이너엔 한글 전용 폰트가 없지만 WenQuanYi Zen Hei가 한글 글리프를 갖고 있다.
    '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
    '/usr/share/fonts/opentype/unifont/unifont.otf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
)


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for cand in FONT_CANDIDATES:
        if os.path.exists(cand):
            return ImageFont.truetype(cand, size)
    return ImageFont.load_default()


def downscale(im: Image.Image) -> Image.Image:
    """표시 크기로 축소 + 약한 언샤프 — 도트·UI 텍스트 선명도 보존"""
    out = im.convert('RGB').resize((OUT_W, OUT_H), Image.LANCZOS)
    return out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=2))


def draw_callouts(im: Image.Image, items: list[tuple], k: float) -> None:
    """축소된 이미지 위에 최종 픽셀 크기로 그린다 — 테두리 + 번호 배지(뜻은 캡션의 ①②③)"""
    d = ImageDraw.Draw(im, 'RGBA')
    fb = font(12)
    B = 18   # 배지 한 변
    for i, it in enumerate(items, 1):
        x, y, w, h = (round(v * k) for v in it[:4])
        where = it[4] if len(it) > 4 else 'above'
        d.rectangle([x, y, x + w, y + h], outline=ACCENT, width=2)
        if where == 'left':
            bx, by = x - B - 2, y
        elif where == 'right':
            bx, by = x + w + 4, y
        elif where == 'below':
            bx, by = x, y + h + 2
        elif where == 'in':
            bx, by = x + 3, y + 3
        elif where == 'inr':
            bx, by = x + w - B - 3, y + 3
        else:   # above — 화면 위쪽에 붙어 있으면 안쪽으로
            bx, by = (x, y - B - 2) if y - B - 2 >= 2 else (x + 3, y + 3)
        bx = max(2, min(im.width - B - 2, bx))
        by = max(2, min(im.height - B - 2, by))
        d.rounded_rectangle([bx, by, bx + B, by + B], radius=4, fill=ACCENT, outline=(6, 14, 28), width=1)
        d.text((bx + B / 2, by + B / 2), str(i), fill=INK, font=fb, anchor='mm')


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
                    help='en이면 help_<key>_en.png로 저장(영문 UI 캡처 입력)')
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
            items = CALLOUTS.get(key, [])
            if items:
                draw_callouts(im, items, k)
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
