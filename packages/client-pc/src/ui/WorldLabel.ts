/**
 * @file WorldLabel.ts
 * @description 247차 — 필드 위 안내 글자 한 벌(머리 위 [F] 안내 · 떠오르는 안내 · 퀘스트 거리 · 이름표 · 설치물 꼬리표)
 *
 * 사용자 QA 공통 의견 「노란 글자에 남색 사각형 배경이 지저분하고, 캐릭터 주변에 상호작용할 것이 많을수록 더 지저분하다」 →
 * 사용자 결정 「배경 없이, 글자는 검정에 흰 테두리 — 탑다운 게임이 바닥에 떨어진 아이템을 하이라이트하는 방식」.
 * 바탕 상자를 쓰지 않으니 풀밭 · 바다 · 밤 어디에서도 글자만 또렷하다. 새 필드 글자는 이 함수로 만든다.
 *
 * 257차 — **떠오르는 안내 글 전부**(저장 알림 · 토스트 · 경고 띠 · 결과 띠 · 머리 위 말)도 이 한 벌을 쓴다.
 * 사용자 지시 「'슬롯 1에 저장했다' … 다른 팝업 텍스트들도 … 배경 직사각형 없이 텍스트 자체에 흰 테두리」.
 * 경고는 글자색만 짙은 빨강(`WORLD_LABEL_WARN`). 창 · 단추 · 칸 안 배지 · HUD 상시 칸은 해당하지 않는다.
 * 259차 — 지도 표시 이름(전체 지도 표식 · 핀 · 다른 사람 · 「나」 · 세계 지도 지점)도 이 한 벌이다(사용자 결정).
 */

import type Phaser from 'phaser';

const FONT = '"Noto Sans KR", sans-serif';
/** 글자 · 테 색 */
export const WORLD_LABEL_INK = '#121418';
export const WORLD_LABEL_EDGE = '#ffffff';
/** 경고 · 실패 안내 글자색(257차) — 흰 테 위에서 읽히는 짙은 빨강 */
export const WORLD_LABEL_WARN = '#8a1a0c';

/**
 * 필드 안내 글자 스타일 — 검은 글자 + 흰 테(배경 없음).
 * `size` px · 테 두께는 글자 크기에 맞춘다(작은 글자는 2px, 11px 이상은 3px).
 */
export function worldLabelStyle(size = 11, opts: { bold?: boolean; ink?: string; align?: 'left' | 'center' | 'right'; wrap?: number } = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color: opts.ink ?? WORLD_LABEL_INK,
    stroke: WORLD_LABEL_EDGE,
    strokeThickness: size >= 11 ? 3 : 2,
    fontStyle: opts.bold === false ? 'normal' : 'bold',
    ...(opts.align ? { align: opts.align } : {}),
    ...(opts.wrap ? { wordWrap: { width: opts.wrap } } : {}),
  };
}
