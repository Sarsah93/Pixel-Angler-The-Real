/**
 * @file PixelButcherFish.ts
 * @description 도마 위 픽셀 생선 렌더러 — 가이드 시트(sashimi_pixel_guide)와 동일한 도트 생선.
 *
 * 데이터 = data/PixelFishSprites.ts (SVG에서 추출한 도트 매트릭스 3종: 온마리/손질 몸통/필렛).
 * FSM 상태에 따라 스프라이트를 골라 방향(미러)·상태 오버레이(비늘 반짝임/내장/박피 껍질층)를
 * 얹는다. 구 파라메트릭 타원 생선(FishTemplateRenderer)을 도마에서 대체 (사용자 지시
 * 2026-07-29 — "svg 가이드 이미지의 회색 생선처럼 똑같이").
 *
 * 렌더 규칙: 정수 셀 스케일(크리스프) + 행 런 병합 fillRect. 돔류 외 어종은 팔레트를
 * 어종 색으로 약하게 틴트.
 */

import Phaser from 'phaser';
import type { OrientationState } from '@tra/core';
import {
  PixelFishSprite, FISH_WHOLE, FISH_DRESSED, FISH_FILLET,
  FISH_WHOLE_AMBERJACK, FISH_DRESSED_AMBERJACK,
} from '../data/PixelFishSprites.js';
import { HALIBUT_DARK, HALIBUT_WHITE } from '../data/PixelFishFlat.js';
import { FISH_STAGE_SPRITES } from '../data/PixelFishStages.js';
import { FISH_VIEW_SPRITES } from '../data/PixelFishViews.js';

/** 단계 스프라이트 조회 — 실사 사진 레지스트리 우선, 없으면 파라메트릭 뷰 폴백 */
function stageSpr(key: string): PixelFishSprite | undefined {
  return FISH_STAGE_SPRITES[key] ?? FISH_VIEW_SPRITES[key];
}

const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

export interface PixelFishGeom { x: number; y: number; w: number; h: number; }

/**
 * 그려진 생선 rect (원형 틀) — **기준 스프라이트 1장으로 산출해 고정**한다.
 *
 * ⚠ 구 구현은 스프라이트마다 `min(geom.w/spr.w, geom.h/spr.h)`로 셀 크기를 따로 잡고
 * 각자 중앙정렬해서, 같은 도마인데도 **온마리 384px → 머리 제거 192px → 지느러미 제거 472px**로
 * 생선이 확대·축소·이동했다. 유도선은 도마 rect에 고정 매핑(toPanelPx)이라 자유 순서에서
 * 작업 순서마다 선이 전부 틀어졌다 (사용자 리포트 2026-07-31).
 */
export interface PixelFishFrame { cell: number; ox: number; oy: number; dw: number; dh: number; }

/** 프레임 정규화 좌표(그려진 생선 rect 기준 0~1) 다각형 — 부분 삭제 영역 */
export type FishPoly = { x: number; y: number }[];

/** 기준 스프라이트로 프레임 산출 — 스테이지가 바뀌어도 이 값은 불변 */
export function computeFishFrame(ref: PixelFishSprite, geom: PixelFishGeom): PixelFishFrame {
  const cell = Math.max(2, Math.floor(Math.min(geom.w / ref.w, geom.h / ref.h)));
  const dw = ref.w * cell, dh = ref.h * cell;
  return {
    cell,
    ox: geom.x + Math.floor((geom.w - dw) / 2),
    oy: geom.y + Math.floor((geom.h - dh) / 2),
    dw, dh,
  };
}

/** 다각형 내부 판정 (레이 캐스팅) */
function pointInPoly(px: number, py: number, poly: FishPoly): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * 지느러미 삭제 영역 (BASE 기준 프레임 정규화 — FLIP은 x를 좌우 반전해서 사용).
 * 몸통 실루엣은 남기고 **밖으로 돌출한 지느러미만** 지운다:
 *  등지느러미(가시열 위쪽 띠) / 배지느러미(아래 앞쪽 돌출) / 뒷지느러미(아래 뒤쪽 돌출).
 * 가슴지느러미는 몸통 표면에 겹쳐 그려져 있어 지우면 몸통에 구멍이 나므로 제외한다.
 */
const FIN_ERASE: Record<string, FishPoly[]> = {
  bream: [
    [{ x: 0.24, y: -0.05 }, { x: 0.65, y: -0.05 }, { x: 0.65, y: 0.17 }, { x: 0.24, y: 0.17 }],
    [{ x: 0.37, y: 0.90 }, { x: 0.55, y: 0.90 }, { x: 0.55, y: 1.05 }, { x: 0.37, y: 1.05 }],
    [{ x: 0.56, y: 0.88 }, { x: 0.73, y: 0.88 }, { x: 0.73, y: 1.05 }, { x: 0.56, y: 1.05 }],
  ],
  // 방어류 — 사용자 실측 지느러미 밑동 선(등 선2 / 배 선3)이 **몸통 윤곽을 그대로 따라가므로**,
  //  그 선의 바깥쪽(위/아래)이 곧 지느러미다. 선을 그대로 경계로 삼아 폴리곤을 닫는다.
  //  (꼬리지느러미는 u > 0.78 구간을 건드리지 않아 보존된다 — 사용자 지시 2026-08-04)
  amberjack: [
    // 등지느러미 — 선2 위쪽 전부 (1·2등지느러미 + 꼬리쪽 잔가시)
    [
      { x: 0.231, y: 0.130 }, { x: 0.344, y: 0.122 }, { x: 0.449, y: 0.157 }, { x: 0.538, y: 0.229 },
      { x: 0.622, y: 0.309 }, { x: 0.695, y: 0.402 }, { x: 0.763, y: 0.499 },
      { x: 0.763, y: -0.15 }, { x: 0.231, y: -0.15 },
    ],
    // 배(뒷)지느러미 — 선3 아래쪽 전부 (뱃살~꼬리로 이어지는 라인)
    [
      { x: 0.217, y: 0.847 }, { x: 0.319, y: 0.906 }, { x: 0.433, y: 0.919 }, { x: 0.542, y: 0.877 },
      { x: 0.647, y: 0.826 }, { x: 0.728, y: 0.735 }, { x: 0.784, y: 0.626 },
      { x: 0.784, y: 1.15 }, { x: 0.217, y: 1.15 },
    ],
  ],
};

/**
 * 머리 제거 시 **절단선 너머로 추가 제거**할 영역 (어종군별).
 * 방어류는 머리와 함께 아가미 뒤 목덜미·가슴지느러미 자리까지 떨어져 나간다
 * (사용자 캡처의 좌측 빨간 점선 영역 — "앞에 제거된 머리 부분보다 더 영역까지").
 * 경계는 사용자 실측 가슴지느러미 밑동 선(선1)을 따른다.
 */
const HEAD_EXTRA_ERASE: Record<string, FishPoly[]> = {
  amberjack: [
    [
      { x: 0.232, y: 0.300 }, { x: 0.233, y: 0.439 }, { x: 0.243, y: 0.488 }, { x: 0.257, y: 0.535 },
      { x: 0.269, y: 0.582 }, { x: 0.290, y: 0.625 }, { x: 0.330, y: 0.690 },
      // 아래로 내려가며 다시 좁아진다 — 수직으로 닫으면 뱃살이 네모나게 잘린다
      { x: 0.300, y: 0.800 }, { x: 0.248, y: 0.900 }, { x: 0.215, y: 1.15 },
      { x: -0.15, y: 1.15 }, { x: -0.15, y: 0.300 },
    ],
  ],
};

/** 절단선을 따라 머리 쪽 전체를 덮는 삭제 다각형 (선 바깥으로 연장 후 머리 방향 모서리로 폐합) */
function headErasePoly(path: FishPoly, headLeft: boolean): FishPoly | null {
  if (!path || path.length < 2) return null;
  // 선분 방향으로 위/아래 바깥까지 연장 — 세로로만 늘리면 절단선이 기울어진 만큼 살이 남는다
  const extendTo = (a: { x: number; y: number }, b: { x: number; y: number }, ty: number) => {
    const dy = b.y - a.y;
    if (Math.abs(dy) < 1e-4) return { x: b.x, y: ty };
    const t = (ty - a.y) / dy;
    return { x: a.x + (b.x - a.x) * t, y: ty };
  };
  const top = extendTo(path[1], path[0], -0.4);
  const bot = extendTo(path[path.length - 2], path[path.length - 1], 1.4);
  const edge = headLeft ? -0.4 : 1.4;
  return [top, ...path, bot, { x: edge, y: 1.4 }, { x: edge, y: -0.4 }];
}

/** 도마 스프라이트 세트 (온마리/손질 몸통/필렛) + 틴트 여부 + 어종군 키 */
export interface ButcherSpriteSet {
  whole: PixelFishSprite; dressed: PixelFishSprite; fillet: PixelFishSprite;
  /** true = 스프라이트가 어종 실색을 가짐(틴트 금지) — 방어류 전용 잿방어 스프라이트 */
  nativeColor: boolean;
  /** 단계 스프라이트 조회 키 (`{family}_vessel` / `{family}_fillet1~3` — FISH_STAGE_SPRITES) */
  familyKey: 'amberjack' | 'bream' | 'halibut';
  /**
   * 넙치류(다섯장뜨기) — 렌더가 통째로 다르다:
   *  BASE = 등면(어두운 면, whole) / FLIP = 배면(흰 면, flatWhite) — **좌우 미러 없음**
   *  (납작한 생선을 장축 기준으로 뒤집으므로 머리는 항상 왼쪽).
   */
  flat?: boolean;
  /** 넙치류 배면(흰 면) 스프라이트 */
  flatWhite?: PixelFishSprite;
}

const AMBERJACK_SPECIES = new Set<string>(['yellowtail', 'amberjack', 'greater_amberjack']);
/** 넙치류 (다섯장뜨기 — 광어 형태 공유. 2026-08-05) */
const FLAT_SPECIES = new Set<string>(['flatfish', 'flounder', 'frog_flounder', 'starry_flounder']);

/**
 * 어종 → 손질/회썰기 스프라이트 어종군 ('amberjack' = 방어류 / 'halibut' = 넙치류 / 'bream' = 돔류·기본).
 * SashimiPanel·UtilizationPanel 조각 아이콘/필렛 뷰 선택도 이 판정을 공유한다 (중복 셋 금지).
 */
export function butcherFamilyOf(speciesId: string): 'amberjack' | 'bream' | 'halibut' {
  if (AMBERJACK_SPECIES.has(speciesId)) return 'amberjack';
  if (FLAT_SPECIES.has(speciesId)) return 'halibut';
  return 'bream';
}

/**
 * 어종별 도마 스프라이트 세트 — 방어류(방어/부시리/잿방어)는 잿방어 형태(방추형 실색),
 * 넙치류(광어·도다리)는 광어 탑뷰(등면/배면 — halibut.png 추출), 그 외는 감성돔 가이드 형태.
 */
export function butcherSpritesFor(speciesId: string): ButcherSpriteSet {
  if (AMBERJACK_SPECIES.has(speciesId)) {
    return { whole: FISH_WHOLE_AMBERJACK, dressed: FISH_DRESSED_AMBERJACK, fillet: FISH_FILLET, nativeColor: true, familyKey: 'amberjack' };
  }
  if (FLAT_SPECIES.has(speciesId)) {
    return {
      whole: HALIBUT_DARK, dressed: HALIBUT_DARK, fillet: FISH_FILLET,
      // 광어 = 실색 그대로 / 도다리류 = 어종 색 약한 틴트
      nativeColor: speciesId === 'flatfish',
      familyKey: 'halibut', flat: true, flatWhite: HALIBUT_WHITE,
    };
  }
  return { whole: FISH_WHOLE, dressed: FISH_DRESSED, fillet: FISH_FILLET, nativeColor: false, familyKey: 'bream' };
}

/**
 * 진행도별 몸통 스프라이트 (사용자 리포트 2026-07-30 — "내장 제거 전인데 배가 정리돼 있고
 * 지느러미 3종이 다 없는 그림"). 구 구현은 headOff만 보고 곧장 `dressed`(본편1 = 머리·
 * 지느러미·내장 **전부** 제거 상태)를 써서 아직 안 한 작업까지 끝난 것처럼 보였다.
 *  온마리 → 머리만 제거(지느러미·내장 有) → 지느러미 제거(내장 有) → 내장 제거(dressed)
 * 어종군 전용 중간 스프라이트가 없으면(방어류 — 사진 대기) dressed로 폴백한다.
 */
function bodySpriteFor(sprites: ButcherSpriteSet, state: PixelFishState): PixelFishSprite {
  if (!state.headOff) return sprites.whole;
  const S = FISH_STAGE_SPRITES;
  const fam = sprites.familyKey;
  if (state.gutted) return S[`${fam}_gutted`] ?? sprites.dressed;
  if (state.finsOff) return S[`${fam}_finless`] ?? sprites.dressed;
  return S[`${fam}_headless`] ?? sprites.dressed;
}

/**
 * 손질 단계 스프라이트 선택 — 세장뜨기 구조는 어종군 공통 (사용자 지시 2026-07-30):
 *  BELLY_UP 배따기·내장 = `{fam}_ventral`(**뱃살을 정면으로 바라보는 복면 뷰**) /
 *  BELLY_UP 핏줄·세척 = `{fam}_vessel`(사진) → `{fam}_cavity`(**내장 꺼낸 체강 탑뷰**) /
 *  BACK_DOWN 등쪽 장뜨기 = `{fam}_dorsal0~3`(등을 카메라 쪽으로 눕힌 뷰 — 머리 오른쪽) /
 *  BELLY_UP 배쪽 장뜨기 = `{fam}_belly0~3`(배를 카메라 쪽으로 — 꼬리 오른쪽).
 *  단계 = 칼집 회차(0 닫힘 / 1 붉은 살 조금 / 2 뼈 노출 / 3 반대쪽까지 벌어짐),
 *  2면(fillet_1_*)은 좌우 미러. 방향이 안 맞으면 null → 측면 몸통(뒤집기 유도).
 */
function pickStageSprite(
  fam: string, state: PixelFishState,
): { spr: PixelFishSprite; mirrorX: boolean; view?: 'ventral' | 'cavity' | 'dorsal' | 'belly' } | null {
  const o = state.orientation;
  // 갈빗대 제거 — 실사 사진 픽셀화(`fillet_ribs` = 껍질 벗긴 갈빗대 붙은 필렛).
  //  구 파라메트릭 FISH_FILLET 폴백은 갈빗대가 안 보였다 (사용자 지시 2026-07-31).
  if (o === 'FLESH_UP' && !state.finished
    && (state.stageId === 'rib_a' || state.stageId === 'rib_b')) {
    const spr = stageSpr('fillet_ribs');
    if (spr) return { spr, mirrorX: state.stageId === 'rib_b' };
  }
  // 지아이뼈 분리·완료 뷰 = **실사 순수 필렛**(pure_pillet 픽셀화) — 구 파라메트릭
  //  FISH_FILLET 폴백이 지아이 단계와 완료 안내 창 뒤에 "구 이미지"로 남아 있었다
  //  (사용자 지시 2026-08-04). 박피 단계는 전용 렌더(drawPeelTop 등)가 담당.
  if (state.finished || o === 'FLESH_UP') {
    const spr = stageSpr(`pure_fillet_${fam}`);
    if (spr) return { spr, mirrorX: !state.finished && state.stageId === 'pin_b' };
    return null;
  }
  if (o === 'BELLY_UP' && (state.stageId === 'gut_open' || state.stageId === 'gut_scoop')) {
    const spr = stageSpr(`${fam}_ventral`);
    return spr ? { spr, mirrorX: false, view: 'ventral' } : null;
  }
  if (o === 'BELLY_UP' && (state.stageId === 'vessel_scrub' || state.stageId === 'gut_wash')) {
    // 체강 탑뷰 우선 — 구 `{fam}_vessel`(시트 추출 측면 그림)은 "내장 꺼낸 공간을 위에서
    // 들여다보는" 뷰가 아니어서 폴백으로만 둔다 (사용자 지시 2026-07-30).
    const spr = stageSpr(`${fam}_cavity`) ?? FISH_STAGE_SPRITES[`${fam}_vessel`];
    return spr ? { spr, mirrorX: false, view: 'cavity' } : null;
  }
  // ── 장뜨기 — 등/배를 카메라 쪽으로 눕힌 뷰 + 칼집 벌어짐 단계 ──
  //  등쪽(BACK_DOWN) = `{fam}_dorsal0~3`(머리 우) / 배쪽(BELLY_UP) = `{fam}_belly0~3`(꼬리 우).
  //  단계 = 칼집 회차(strokesDone) — 0 닫힘 / 1 붉은 살 조금 / 2 뼈 노출 / 3 반대쪽까지.
  //  스테이지가 넘어간 직후엔 호출측이 openOverride로 마지막 벌어짐을 잠시 유지한다.
  const ov = state.openOverride;
  const isFillet = !!state.stageId?.startsWith('fillet_');
  if (ov || isFillet) {
    // 배쪽(sever·ribsever·bellyribcut)=belly / 등쪽(score·ribcut)=dorsal
    //  ⚠ 'sever' 포함 여부만 보면 `fillet_1_bellyribcut`을 놓쳐 등쪽으로 잘못 판정된다
    //    (방향 불일치 → null → 온마리 측면 폴백. 사용자 리포트 2026-07-31)
    const sever = ov ? ov.view === 'belly'
      : (!!state.stageId?.includes('sever') || !!state.stageId?.includes('belly'));
    // 방향이 아직 안 맞으면 뷰를 바꾸지 않는다 — 현재 자세(측면)를 보여주고 뒤집기를 유도
    const oriOk = !!ov || (sever ? o === 'BELLY_UP' : o === 'BACK_DOWN');
    if (!oriOk) return null;
    const view = sever ? 'belly' : 'dorsal';
    const isF1 = ov ? !!ov.mirrorX : (state.stageId ?? '').startsWith('fillet_1');
    // ribsever(갈비뼈·척추 끊기)는 배쪽이 이미 완전히 열린 상태에서 진행 — 벌어짐 3 고정(재닫힘 방지)
    //  2면 등쪽은 **작업 누적 진행(spineOpen)** 기준 — 3단계로 나뉘어 스테이지마다 strokesDone이
    //  리셋되므로 그것만 보면 벌어졌던 살이 다시 닫힌다 (사용자 지시 2026-07-31).
    const n = ov ? ov.state
      : isF1 ? Math.min(3, (sever ? (state.bellyOpen ?? 0) : (state.spineOpen ?? 0)) + (state.strokesDone ?? 0))
        : (state.stageId?.includes('ribsever') ? 3 : Math.min(3, state.strokesDone ?? 0));
    // **2면(fillet_1)은 1면이 이미 분리돼 [척추뼈+2면 살] 덩어리** — 양쪽 살 붙은 뷰가 아니라:
    //  등쪽/갈비뼈끊기(dorsal) = 척추 붙은 덩어리 **측면 spine 뷰**(머리 우) /
    //  배쪽 분리(sever·belly) = **정면 배쪽 뷰**(머리 좌·미러 없음). (사용자 지시 2026-07-30~31)
    if (isF1) {
      // 2면 = [척추뼈 + 2면 살] 한 덩어리 —
      //  등쪽 1·2회차 = 측면 spine 뷰 / **연결부 끊기 = 갈비뼈 노출 전용 뷰** /
      //  배쪽 분리 = **2면 전용 배쪽 뷰**(양쪽 살 붙은 장뜨기 belly 뷰 재활용 금지 — 사용자 지시).
      const sid = state.stageId ?? '';
      const key = view === 'belly'
        ? (sid === 'fillet_1_bellyribcut' ? `${fam}_bellyspineribs` : `${fam}_bellyspine${n}`)
        : (sid === 'fillet_1_ribcut' ? `${fam}_spineribs` : `${fam}_spine${n}`);
      const spr2 = stageSpr(key)
        ?? stageSpr(view === 'belly' ? `${fam}_belly${n}` : `${fam}_spine${n}`);
      if (spr2) return { spr: spr2, mirrorX: false, view };
    }
    const spr = stageSpr(`${fam}_${view}${n}`) ?? stageSpr(`${fam}_fillet${Math.max(1, n)}`);
    // 2면(fillet_1)은 반대쪽 살 — 좌우 미러. **벌어짐 연출 중(ov)엔 방금 자른 필렛
    //  기준(ov.mirrorX)** — 진행 스테이지가 다음 필렛으로 넘어가도 좌우가 뒤집히지 않는다
    //  (사용자 리포트 2026-07-30 — 잘린 직후 좌우 전환 플래시).
    const mirrorX = ov ? !!ov.mirrorX : (state.stageId ?? '').startsWith('fillet_1');
    return spr ? { spr, mirrorX, view } : null;
  }
  return null;
}

/**
 * 밑손질 삭제 영역 조립 — 완료된 작업의 부위만 지운다.
 *  머리 = 실제 절단선(현재 표시 방향의 head 스테이지 guidePath)을 따라 머리 쪽 전체 /
 *  지느러미 = 어종군 지느러미 영역 테이블 (FLIP이면 좌우 반전).
 */
function buildPrepErase(fam: string, state: PixelFishState, o: OrientationState): FishPoly[] {
  const out: FishPoly[] = [];
  /** BASE 기준 폴리곤 — FLIP이면 좌우 반전 */
  const oriented = (polys: FishPoly[]): FishPoly[] => (o === 'FLIP'
    ? polys.map((p) => p.map((q) => ({ x: 1 - q.x, y: q.y })))
    : polys);
  if (state.headOff) {
    const poly = state.headCutPath ? headErasePoly(state.headCutPath, o === 'BASE') : null;
    // 절단선 좌표가 없으면(구 세이브·데이터 누락) 머리 비율 근사로 폴백
    out.push(poly ?? (o === 'BASE'
      ? [{ x: -0.4, y: -0.4 }, { x: 0.26, y: -0.4 }, { x: 0.26, y: 1.4 }, { x: -0.4, y: 1.4 }]
      : [{ x: 0.74, y: -0.4 }, { x: 1.4, y: -0.4 }, { x: 1.4, y: 1.4 }, { x: 0.74, y: 1.4 }]));
    // 절단선 너머 추가 제거 (방어류 목덜미·가슴지느러미 자리)
    if (HEAD_EXTRA_ERASE[fam]) out.push(...oriented(HEAD_EXTRA_ERASE[fam]));
  }
  if (state.finsOff) out.push(...oriented(FIN_ERASE[fam] ?? FIN_ERASE.bream));
  return out;
}

/**
 * 박피 칼 (탑뷰 — **세로**: 칼끝 위·손잡이 아래). 캡처의 "칼은 x축 anchor, y로 위아래 움직임".
 * 에셋 이미지 전 플레이스홀더 글리프.
 */
function drawPeelKnife(g: Phaser.GameObjects.Graphics, cx: number, tipY: number, len: number): void {
  const bladeL = len * 0.58, handleL = len * 0.42, w = Math.max(7, len * 0.085);
  g.fillStyle(0xd8e2ea, 1);                        // 블레이드 (끝이 뾰족)
  g.beginPath();
  g.moveTo(cx, tipY);
  g.lineTo(cx - w * 0.5, tipY + bladeL * 0.2);
  g.lineTo(cx - w * 0.5, tipY + bladeL);
  g.lineTo(cx + w * 0.5, tipY + bladeL);
  g.lineTo(cx + w * 0.5, tipY + bladeL * 0.2);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x9fb0bd, 1);                        // 날 우측 그늘
  g.fillRect(cx + w * 0.12, tipY + bladeL * 0.2, w * 0.38, bladeL * 0.8);
  g.fillStyle(0x3a2c1e, 1);                        // 손잡이
  g.fillRoundedRect(cx - w * 0.72, tipY + bladeL, w * 1.44, handleL, 3);
  g.fillStyle(0x241a10, 1);
  g.fillRect(cx - w * 0.72, tipY + bladeL + handleL * 0.45, w * 1.44, 2);
}

/**
 * 박피 탑뷰 (사용자 캡처 2 + 지시 2026-07-31) — z순서: [도마] → [얇은 회색 껍질 바] → [칼] → [살코기].
 *  `peelProgress`만큼 **껍질 바가 도마 왼쪽으로 이동**하고, 살코기도 동시에 왼쪽으로 살짝 밀린다.
 *  ①꼬리 손잡이(peel_grip) 단계에서는 회색 바를 그리지 않는다 (살코기만).
 */
function drawPeelTop(
  g: Phaser.GameObjects.Graphics, geom: PixelFishGeom,
  sprites: ButcherSpriteSet, state: PixelFishState, tint: number | null,
): void {
  const fam = sprites.familyKey;
  // 박피 대상 = **껍질이 붙어있는 필렛**(skinned_pillet 실사 픽셀화). 없으면 순수 필렛 폴백.
  const flesh = stageSpr(`skin_fillet_${fam}`) ?? stageSpr(`pure_fillet_${fam}`) ?? sprites.fillet;
  const frame = computeFishFrame(flesh, geom);
  const prog = Math.max(0, Math.min(1, state.peelProgress ?? 0));
  const pulling = state.stageId === 'peel_pull';

  if (pulling) {
    // z순서 = [도마] → [회색 껍질 바] → [칼] → [살코기] (사용자 지시 2026-07-31)
    // ── ① 얇은 회색 껍질 바 — 도마 왼쪽으로 **이동** (도마 밖으로 나가지 않게 클램프) ──
    const travel = Math.min(frame.dw * 0.34 * prog, Math.max(0, frame.ox - (geom.x + 10)));
    const sh = Math.max(8, frame.dh * 0.34);       // 얇게
    const sx = frame.ox + frame.dw * 0.04 - travel;
    const sy = frame.oy + frame.dh * 0.5 - sh / 2;
    const sw = frame.dw * 0.9;
    g.fillStyle(0x8a8f92, 1);
    g.fillRoundedRect(sx, sy, sw, sh, 4);
    g.fillStyle(0xa9aeb1, 1);                      // 상단 하이라이트
    g.fillRect(sx + 3, sy + 2, sw - 6, Math.max(2, sh * 0.2));
    if (prog > 0.02) {
      g.fillStyle(0x5f6467, 0.9);                  // 당겨지는 결 주름
      for (let i = 0; i < 5; i++) {
        g.fillRect(sx + 6 + sw * 0.3 * (i / 5), sy + sh * 0.25, 2, sh * 0.5);
      }
    }
    // ── ② 칼 — 껍질 바 위·살코기 **아래**. x는 anchor(고정), y만 위아래로 움직인다 ──
    //  손잡이가 살코기 아래쪽 밖으로 나오므로 살에 가려져도 위치가 보인다.
    //  톱질 = 제자리에서 위아래 왕복 (드래그하는 동안 `peelSawPhase`가 시간으로 돈다)
    const knifeLen = frame.dh * 1.05;
    const yOsc = Math.sin((state.peelSawPhase ?? 0) * Math.PI * 2) * frame.dh * 0.16;
    drawPeelKnife(g, frame.ox + frame.dw * 0.2, frame.oy + frame.dh * 0.08 + yOsc, knifeLen);
    // ── ③ 살코기 — 껍질이 이동하기 시작하면 **동시에** 왼쪽으로 조금씩 밀린다 ──
    const shift = frame.dw * 0.12 * prog;
    drawSprite(g, flesh, geom, false, false, sprites.nativeColor ? null : tint, 0.18, {
      frame: { ...frame, ox: frame.ox - shift },
    });
    return;
  }

  // ── 꼬리 손잡이 단계 — 회색 바 없이 살코기만 (사용자 지시) ──
  drawSprite(g, flesh, geom, false, false, sprites.nativeColor ? null : tint, 0.18, { frame });
  if (state.peelGripDone) {
    g.lineStyle(2.5, 0x2b1a1c, 0.9);
    const gx = frame.ox + frame.dw * 0.09;
    g.lineBetween(gx, frame.oy + frame.dh * 0.32, gx - frame.dw * 0.04, frame.oy + frame.dh * 0.58);
  }
}

export interface PixelFishState {
  orientation: OrientationState;
  headOff: boolean;
  /**
   * 머리 절단선 (현재 표시 방향 기준, **그려진 생선 rect 정규화**) — 머리 삭제 영역 산출용.
   * 패널이 head 스테이지의 guidePath를 프레임 좌표로 변환해 넘긴다 (F9로 선을 재측정하면
   * 삭제 영역도 자동으로 따라온다).
   */
  headCutPath?: FishPoly;
  /** 지느러미 제거 완료 (finectomy) — 몸통 스프라이트 분기 */
  finsOff?: boolean;
  gutted: boolean;
  scaledSides: number;
  hasScales: boolean;
  finished: boolean;
  currentPullsLeft: number;
  /** 머리(0)~꼬리(1) 항문 위치 — BACK_DOWN 마커 */
  anusRatio: number;
  stageId?: string;
  /** 현재 스테이지 완료 스트로크 수 (장뜨기 길내기 진행 — 단계 스프라이트 선택) */
  strokesDone?: number;
  /**
   * 2면 등쪽 벌어짐 누적 단계 — 완료된 등쪽 스테이지 수(척추까지 1·2회차).
   * 3단계로 나뉘어 스테이지마다 strokesDone이 리셋되므로 별도로 넘긴다.
   */
  spineOpen?: number;
  /** 2면 배쪽 벌어짐 누적 단계 — 완료된 배쪽 스테이지(꼬리→배 긋기·연결부 끊기) 기준 */
  bellyOpen?: number;
  /** 박피 당기기 진행 (0~1) — 껍질이 왼쪽으로 늘어나는 정도 */
  peelProgress?: number;
  /** 박피 톱질 위상 (0~1 반복) — 칼이 제자리에서 위아래로 움직이는 연출 */
  peelSawPhase?: number;
  /** 박피 ① 꼬리 손잡이 칼집 완료 */
  peelGripDone?: boolean;
  /**
   * 장뜨기 벌어짐 강제 표시 — 칼질 성공 직후 스테이지가 넘어가도 마지막 벌어짐을
   * 연출 동안 유지하기 위한 오버라이드 (ButcheryPanel가 액션 애니 중에만 설정).
   */
  openOverride?: { view: 'dorsal' | 'belly'; state: number; mirrorX?: boolean };
  /** 넙치류 — **현재 표시 면**의 다섯장뜨기 진행 상태 (패널이 doneStages에서 파생) */
  flatSide?: FlatSideState;
  /**
   * 넙치류 엔가와 분리 슬랩 — 현재 작업 중인 반쪽 필렛의 종류 (2026-08-07 사용자 지시).
   * upper = 내장 없는 쪽 / under = 내장쪽 (skinned_upper/under_pillet 도트화 — 각 2장씩).
   * 미설정 = 기존 순수 필렛 슬랩 폴백 (구세이브 재장착 등 반쪽 불명 케이스).
   */
  flatFilletKind?: 'upper' | 'under';
}

/**
 * 넙치류 다섯장뜨기 — 한쪽 면(등/배)의 진행 상태 (2026-08-06 공정 재정의):
 * 포 뜨기 = 반쪽마다 3단계(경계 칼길 → 분리1 → 분리2). **벌어짐 힌지가 지느러미
 * 경계에서 중앙선으로 이동**하며, 자유로워진 살은 힌지 너머로 젖혀진다.
 * 반대쪽 면의 포는 위에서 보이지 않으므로 면별로 독립 렌더된다 (물리적으로 정확).
 */
export interface FlatSideState {
  /** 중앙선(척추선) 칼집 완료 */
  center: boolean;
  /** 위쪽 반의 벌어짐 깊이 (0~1 — 힌지가 지느러미 경계→중앙선까지 이동한 비율) */
  upDepth: number;
  /** 아래쪽 반의 벌어짐 깊이 */
  dnDepth: number;
  /** 위/아래 필렛 회수 완료 (3/3 지급 후 — 플랩 소멸·뼈 노출 유지) */
  upTaken: boolean;
  dnTaken: boolean;
  /**
   * 칼 팔로우 라이브 엔벌로프 — **칼이 지나간 길이 구간만** 다음 깊이로 열린다
   * (두더지가 지나가듯. 사용자 지시 2026-08-06). 좌표는 가이드(도마 정규화) 길이축 x.
   */
  live?: { half: 'up' | 'dn'; fromDepth: number; toDepth: number; xFrom: number; xKnife: number };
  /** 이 면의 비늘치기 완료 여부 (반짝임 오버레이 소거) */
  scaled: boolean;
}

/**
 * 넙치류(다섯장뜨기) 도마 렌더 (2026-08-05) — 탑뷰 고정:
 *  BASE = 등면(어두운 면) / FLIP = 배면(흰 면) — 머리 항상 왼쪽 (좌우 미러 없음).
 *  머리 S자 절단은 headCutPath(erase)로 실제 절단선을 따라 지워진다 (55차 메커니즘 재사용).
 *  포 뜨기 진행은 오버레이 — 중앙선/경계 칼길(어두운 선) → 떠낸 자리(분홍 살+갈비살 결) 노출.
 */
function drawFlatFish(
  g: Phaser.GameObjects.Graphics, geom: PixelFishGeom,
  sprites: ButcherSpriteSet, state: PixelFishState, tint: number | null,
): void {
  const o = state.orientation;

  // ── FLESH_UP(엔가와 분리 등) / 완료 = 필렛 슬랩 뷰 ──
  if (state.finished || o === 'FLESH_UP') {
    // 엔가와 분리 = **반쪽 필렛 실사** (skinned_upper/under_pillet 도트화 — 2026-08-07 사용자 지시:
    //  upper = 내장 없는 쪽 / under = 내장쪽, 필렛 4장 = 각 2장씩). 사진에 엔가와가 이미 붙어 있다.
    //  완료(finished)/반쪽 불명은 순수 필렛(엔가와 제거본) 슬랩 폴백 — 물리 상태 정합.
    const kindSpr = state.flatFilletKind
      ? stageSpr(`fillet_${state.flatFilletKind}_halibut`) : undefined;
    const slab = kindSpr ?? stageSpr('pure_fillet_halibut') ?? stageSpr('pure_fillet_bream') ?? sprites.fillet;
    const dr = drawSprite(g, slab, geom, false, false, tint, 0.12);
    // 엔가와 스트립 — 필렛 아래 가장자리의 지느러미살 (분리 대상 표시).
    //  반쪽 실사 슬랩은 사진 자체에 엔가와가 있어 파라메트릭 스트립을 겹쳐 그리지 않는다.
    if (!state.finished && !kindSpr && state.stageId?.startsWith('engawa_')) {
      const sy = dr.y + dr.h * 0.78;
      g.fillStyle(0xd8b878, 0.95);
      g.fillRoundedRect(dr.x + dr.w * 0.06, sy, dr.w * 0.88, Math.max(6, dr.h * 0.14), 4);
      g.fillStyle(0xc09858, 0.9);
      for (let i = 0; i < 9; i++) {
        g.fillRect(dr.x + dr.w * (0.10 + i * 0.09), sy + 2, 2, Math.max(3, dr.h * 0.10));
      }
    }
    return;
  }

  // ⚠ 실사 사진을 도마에 직접 그리지 않는다 (사용자 지시 2026-08-06 — "실사 사진을 그대로
  //   박아넣는 게 아니라, 실사를 바탕으로 자체 픽셀 그림 + 연출로"). 82차의 포 뜨기 실사
  //   스테이지 선택(fin_score/lift_a·b/done/gut_lift)은 폐기 — 사진은 해부 참고자료로만 남긴다
  //   (food assets/butchery/reference/). 벌어짐은 아래 이동 힌지 파라메트릭이 전담한다.

  // ── 몸통 탑뷰 — 등면(dark)/배면(white). 프레임은 등면 기준 고정 ──
  const spr = o === 'FLIP' ? (sprites.flatWhite ?? sprites.whole) : sprites.whole;
  const frame = computeFishFrame(sprites.whole, geom);
  const erase: FishPoly[] = [];
  if (state.headOff) {
    // 넙치류는 뒤집어도 머리가 왼쪽 그대로 — 미러 없이 같은 S 절단선을 쓴다
    const poly = state.headCutPath ? headErasePoly(state.headCutPath, true) : null;
    erase.push(poly ?? [{ x: -0.4, y: -0.4 }, { x: 0.30, y: -0.4 }, { x: 0.30, y: 1.4 }, { x: -0.4, y: 1.4 }]);
  }
  const drawn = drawSprite(g, spr, geom, false, false, sprites.nativeColor ? null : tint, 0.22,
    { frame, erase: erase.length ? erase : undefined });

  // 비늘 반짝임 — 표시 면이 아직 비늘치기 전일 때
  const fs = state.flatSide;
  if (state.hasScales && fs && !fs.scaled) {
    g.fillStyle(0xffffff, 0.3);
    const PHI = 0.6180339887, G2 = 0.7548776662;
    for (let i = 0; i < 26; i++) {
      const fx = ((i + 1) * PHI) % 1, fy = ((i + 1) * G2) % 1;
      g.fillCircle(drawn.x + drawn.w * (0.3 + fx * 0.45), drawn.y + drawn.h * (0.2 + fy * 0.6), 1.5);
    }
  }
  if (!fs) return;

  // ── 다섯장뜨기 오버레이 (프레임 정규화 좌표 → 화면 px) ──
  const px = (x: number): number => drawn.x + x * drawn.w;
  const py = (y: number): number => drawn.y + y * drawn.h;
  /**
   * 머리쪽 개방 한계 = **머리 S컷 절단면 곡선** (사용자 지시 2026-08-07 — "열려지는 부분을
   * 조금 더 위(머리쪽)까지, 전체 포 뜨기 공통으로"). 구 구현은 세로선 x=0.28에서 잘라
   * S컷과의 사이 쐐기 구간이 안 열렸다. headCutPath(프레임 정규화·y 단조)를 그대로 경계로
   * 삼고, 각 컬럼의 y 스팬을 절단면 몸통 쪽(cutX(y) ≤ x)으로 클리핑한다 — 4개 포 전부 공통.
   */
  const hcp = state.headOff && state.headCutPath && state.headCutPath.length >= 2
    ? state.headCutPath : null;
  const hcpMinX = hcp ? Math.min(...hcp.map((p) => p.x)) : 0;
  const hcpMaxX = hcp ? Math.max(...hcp.map((p) => p.x)) : 0;
  /** S컷 절단면의 y→x (경로는 위→아래 y 단조 — FLAT_GUIDE.headScut) */
  const cutXatY = (y: number): number => {
    if (!hcp) return 0;
    if (y <= hcp[0].y) return hcp[0].x;
    for (let i = 1; i < hcp.length; i++) {
      if (y <= hcp[i].y) {
        const a = hcp[i - 1], b = hcp[i];
        return a.x + ((y - a.y) / (b.y - a.y || 1)) * (b.x - a.x);
      }
    }
    return hcp[hcp.length - 1].x;
  };
  /**
   * 컬럼 x의 y 스팬 [a,b]를 절단면 몸통 쪽으로 자른다 — 허용 구간 중 가장 긴 런을 취하고
   * 경계는 선형 보간으로 다듬는다. null = 이 컬럼은 전부 머리 쪽(그리지 않음).
   */
  const clipSpan = (x: number, a: number, b: number): [number, number] | null => {
    if (!hcp || x >= hcpMaxX || b - a < 1e-6) return [a, b];
    const K = 16;
    const f = (y: number): number => cutXatY(y) - x;   // ≤ 0 = 몸통 쪽(허용)
    const yAt = (k: number): number => a + ((b - a) * k) / K;
    let bestLo = 0, bestHi = 0, best = -1;
    let i = 0;
    while (i <= K) {
      if (f(yAt(i)) <= 0) {
        let j = i;
        while (j < K && f(yAt(j + 1)) <= 0) j++;
        if (j - i > best) { best = j - i; bestLo = i; bestHi = j; }
        i = j + 1;
      } else i++;
    }
    if (best < 0) return null;
    let lo = yAt(bestLo), hi = yAt(bestHi);
    if (bestLo > 0) {
      const y0 = yAt(bestLo - 1), f0 = f(y0), f1 = f(lo);
      if (f0 > 0 && f0 !== f1) lo = y0 + (lo - y0) * (f0 / (f0 - f1));
    }
    if (bestHi < K) {
      const y1 = yAt(bestHi + 1), f1 = f(y1), f0 = f(hi);
      if (f1 > 0 && f1 !== f0) hi = hi + (y1 - hi) * (-f0 / (f1 - f0));
    }
    return [lo, hi];
  };
  // 필렛 시작 = S컷 절단면 최전방(곡선 최소 x)까지 확장 — 실제 클리핑은 clipSpan이 담당
  const bodyL = state.headOff ? (hcp ? Math.max(0.19, hcpMinX) : 0.28) : 0.36;
  const centerL = state.headOff ? 0.28 : 0.36;  // 중앙선 칼집 자국 시작 (F9 실측 landmark — 불변)
  const bodyR = 0.732;                          // 꼬리 칼집 위치 (F9 실측)
  /** 중앙선(척추선) — F9 실측 {0.280,0.500}→{0.732,0.488} 선형 보간 */
  const cyAt = (x: number): number => 0.500 + ((x - 0.280) / (0.732 - 0.280)) * (0.488 - 0.500);
  // 위 경계 곡선 = F9 실측 upScore 7점 보간 (지느러미/엔가와 밑동) / 아래 = 중앙선 대칭 미러
  //  (dnScore 실측 전 근사 — 실측 반영 시 별도 테이블로 교체)
  const UP_PTS = [
    { x: 0.262, y: 0.283 }, { x: 0.329, y: 0.177 }, { x: 0.428, y: 0.100 }, { x: 0.541, y: 0.107 },
    { x: 0.619, y: 0.206 }, { x: 0.667, y: 0.323 }, { x: 0.737, y: 0.421 },
  ];
  const upEdge = (x: number): number => {
    if (x <= UP_PTS[0].x) return UP_PTS[0].y;
    for (let i = 1; i < UP_PTS.length; i++) {
      if (x <= UP_PTS[i].x) {
        const a = UP_PTS[i - 1], b = UP_PTS[i];
        return a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
      }
    }
    return UP_PTS[UP_PTS.length - 1].y;
  };
  const dnEdge = (x: number): number => 2 * cyAt(x) - upEdge(x);

  const N = 16;                                 // S컷 곡선 경계를 따라가도록 컬럼 증설 (12→16)
  const xs: number[] = [];
  for (let i = 0; i <= N; i++) xs.push(bodyL + ((bodyR - bodyL) * i) / N);

  /**
   * 포 뜨기 진행 — **이동 힌지 모델** (사용자 공정 재정의 2026-08-06 캡처 3장):
   *  칼은 지느러미 경계에서 시작해 3단계에 걸쳐 중앙선 쪽으로 파고든다. 자유로워진 살은
   *  현재 절단선(힌지)을 축으로 반대편으로 젖혀진다 — 힌지가 경계→중앙선으로 이동:
   *   깊이 d(x): 힌지 = 경계 + (중앙선−경계)·d
   *   ① 노출(뼈) = [경계 .. 힌지] — 갈비뼈 빗살 + (깊어지면) 척추 마디
   *   ② 플랩(젖힌 살) = 힌지 기준 미러 [힌지 .. 2·힌지−경계] — 분홍 절단면이 위로
   *  live 엔벌로프: **칼이 지나간 길이 구간만** 다음 깊이로 열린다 (두더지 연출) +
   *  칼 위치에 국소 들림(bump).
   */
  const live = fs.live;
  const depthAt = (upper: boolean, x: number): number => {
    let d = upper ? fs.upDepth : fs.dnDepth;
    if (live && (live.half === 'up') === upper) {
      const dir = Math.sign(live.xKnife - live.xFrom) || 1;
      const TRANS = 0.05;                                   // 칼 주변 전이 폭 (길이축)
      const passed = Math.max(0, Math.min(1, ((live.xKnife - x) * dir) / TRANS + 0.5));
      d = live.fromDepth + (live.toDepth - live.fromDepth) * passed;
      // 두더지 융기 — 칼 바로 앞뒤 국소 들림
      const bump = Math.exp(-(((x - live.xKnife) / 0.045) ** 2)) * 0.10;
      d = Math.min(1, d + bump * (live.toDepth > live.fromDepth ? 1 : 0));
    }
    return Math.max(0, Math.min(1, d));
  };
  const hingeY = (upper: boolean, x: number): number => {
    const edge = upper ? upEdge(x) : dnEdge(x);
    return edge + (cyAt(x) - edge) * depthAt(upper, x);
  };

  const boneRegion = (upper: boolean): void => {
    const dMax = Math.max(...xs.map((x) => depthAt(upper, x)));
    if (dMax <= 0.01) return;
    // 노출 폴리곤: 경계 → (되짚어) 힌지 — 컬럼별로 S컷 절단면에 클리핑
    const eTop: { x: number; y: number }[] = [];   // 경계 쪽 (클립 반영)
    const eBot: { x: number; y: number }[] = [];   // 힌지 쪽 (클립 반영)
    for (const x of xs) {
      const e = upper ? upEdge(x) : dnEdge(x);
      const h = hingeY(upper, x);
      const sp = clipSpan(x, Math.min(e, h), Math.max(e, h));
      if (!sp) continue;
      // upper = 경계가 위(작은 y) / dn = 경계가 아래(큰 y)
      eTop.push({ x, y: upper ? sp[0] : sp[1] });
      eBot.push({ x, y: upper ? sp[1] : sp[0] });
    }
    if (eTop.length < 2) return;
    g.fillStyle(0xefe0d6, 0.96);
    g.beginPath();
    g.moveTo(px(eTop[0].x), py(eTop[0].y));
    for (const p of eTop) g.lineTo(px(p.x), py(p.y));
    for (let i = eBot.length - 1; i >= 0; i--) g.lineTo(px(eBot[i].x), py(eBot[i].y));
    g.closePath();
    g.fillPath();
    // 갈비뼈 부챗살 — 중앙선(척추)에서 경계로 뻗는 빗살의 **노출 구간만** 보인다
    g.lineStyle(1.2, 0xcaa89a, 0.9);
    for (let i = 1; i < 13; i++) {
      const x = bodyL + ((bodyR - bodyL) * i) / 13;
      const d = depthAt(upper, x);
      if (d <= 0.02) continue;
      const edge = upper ? upEdge(x) : dnEdge(x);
      const h = hingeY(upper, x);
      const sp = clipSpan(x, Math.min(edge, h), Math.max(edge, h));
      if (!sp) continue;
      const clampY = (y: number): number => Math.max(sp[0], Math.min(sp[1], y));
      const y1 = clampY(edge + (h - edge) * 0.06);
      const y2 = clampY(h - (h - edge) * 0.04);
      if (Math.abs(y2 - y1) < 0.01) continue;
      g.lineBetween(px(x + 0.014), py(y1), px(x), py(y2));
    }
    // 척추 마디 — 힌지가 중앙선에 거의 닿은 구간만 (캡처 3 — 드러난 척추뼈)
    g.lineStyle(2, 0xcfbab4, 0.95);
    let run: number[] = [];
    const flush = (): void => {
      if (run.length >= 2) {
        g.beginPath();
        g.moveTo(px(run[0]), py(cyAt(run[0])));
        for (const x of run) g.lineTo(px(x), py(cyAt(x)));
        g.strokePath();
      }
      run = [];
    };
    for (const x of xs) {
      // 절단면 너머(머리 쪽) 컬럼은 척추 마디도 그리지 않는다
      if (depthAt(upper, x) >= 0.9 && (!hcp || cutXatY(cyAt(x)) <= x)) run.push(x); else flush();
    }
    flush();
  };

  const flapOverlay = (upper: boolean, taken: boolean): void => {
    if (taken) return;                            // 필렛 회수(지급) — 플랩 소멸
    const dMax = Math.max(...xs.map((x) => depthAt(upper, x)));
    if (dMax <= 0.01) return;
    // 플랩 = 노출 폭만큼 **힌지 기준 미러** [힌지 .. 2·힌지−경계] — 반대편 쪽으로 젖혀짐.
    //  컬럼별 S컷 클리핑 — 힌지 쪽/플랩 끝 쪽 경계를 각각 잘라 배열로 모은다.
    const flapY = (x: number): number => {
      const edge = upper ? upEdge(x) : dnEdge(x);
      const h = hingeY(upper, x);
      return h + (h - edge);
    };
    const hingePts: { x: number; y: number }[] = [];
    const flapPts: { x: number; y: number }[] = [];
    for (const x of xs) {
      const h = hingeY(upper, x);
      const fy = flapY(x);
      const sp = clipSpan(x, Math.min(h, fy), Math.max(h, fy));
      if (!sp) continue;
      // upper = 플랩이 아래(큰 y)로 젖혀짐 / dn = 위(작은 y)로
      hingePts.push({ x, y: upper ? sp[0] : sp[1] });
      flapPts.push({ x, y: upper ? sp[1] : sp[0] });
    }
    if (hingePts.length < 2) return;
    g.fillStyle(0xe8a89e, 0.96);                 // 분홍 절단면 (살 — 뒤집혀 껍질은 안 보임)
    g.beginPath();
    g.moveTo(px(hingePts[0].x), py(hingePts[0].y));
    for (const p of hingePts) g.lineTo(px(p.x), py(p.y));
    for (let i = flapPts.length - 1; i >= 0; i--) g.lineTo(px(flapPts[i].x), py(flapPts[i].y));
    g.closePath();
    g.fillPath();
    // 플랩 가장자리(젖힌 살 끝 = 원래 경계였던 자리) — 어두운 절단면 라인
    g.lineStyle(1.6, 0xb0685e, 0.9);
    g.beginPath();
    let first = true;
    for (const p of flapPts) {
      if (first) { g.moveTo(px(p.x), py(p.y)); first = false; } else g.lineTo(px(p.x), py(p.y));
    }
    g.strokePath();
    // 살결 몇 줄 (플랩 위 — 결 방향 = 길이축과 평행)
    g.lineStyle(1, 0xd8968c, 0.7);
    for (let k = 1; k <= 2; k++) {
      g.beginPath();
      first = true;
      for (let i = 0; i < hingePts.length; i++) {
        const y = hingePts[i].y + (flapPts[i].y - hingePts[i].y) * (k / 3);
        if (first) { g.moveTo(px(hingePts[i].x), py(y)); first = false; } else g.lineTo(px(hingePts[i].x), py(y));
      }
      g.strokePath();
    }
  };

  // 중앙선 칼집 자국 — 오버레이 아래에 먼저 (플랩이 덮으면 가려진다)
  //  ⚠ 지느러미 경계 칼길은 **자국을 그리지 않는다** (사용자 지시 2026-08-05 — 판정만).
  if (fs.center) {
    g.lineStyle(2, 0x3a2226, 0.9);
    g.lineBetween(px(centerL), py(cyAt(centerL)), px(bodyR), py(cyAt(bodyR)));
  }

  // 렌더 순서: 노출 뼈(양쪽) → 플랩(양쪽 — 힌지 너머를 덮으므로 나중에)
  boneRegion(true);
  boneRegion(false);
  flapOverlay(true, fs.upTaken);
  flapOverlay(false, fs.dnTaken);
}

/** 팔레트 색 → 어종 틴트 블렌드 (k=0 원본 유지) */
function tintColor(color: number, tint: number, k: number): number {
  if (k <= 0) return color;
  const r = ((color >> 16) & 0xff) * (1 - k) + ((tint >> 16) & 0xff) * k;
  const g = ((color >> 8) & 0xff) * (1 - k) + ((tint >> 8) & 0xff) * k;
  const b = (color & 0xff) * (1 - k) + (tint & 0xff) * k;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

/**
 * 스프라이트 1장을 행 런 병합으로 그린다 (정수 셀 — 크리스프).
 * 반환 = 실제 그린 영역 (오버레이 배치용).
 */
function drawSprite(
  g: Phaser.GameObjects.Graphics, spr: PixelFishSprite, geom: PixelFishGeom,
  mirrorX: boolean, mirrorY: boolean, tint: number | null, tintK: number,
  opts?: { frame?: PixelFishFrame; erase?: FishPoly[] },
): PixelFishGeom {
  // 프레임이 주어지면 그 셀 크기를 그대로 쓴다 = 스테이지가 바뀌어도 확대/축소 없음.
  const cell = opts?.frame?.cell
    ?? Math.max(2, Math.floor(Math.min(geom.w / spr.w, geom.h / spr.h)));
  const dw = spr.w * cell, dh = spr.h * cell;
  const ox = opts?.frame ? opts.frame.ox + Math.floor((opts.frame.dw - dw) / 2) : geom.x + Math.floor((geom.w - dw) / 2);
  const oy = opts?.frame ? opts.frame.oy + Math.floor((opts.frame.dh - dh) / 2) : geom.y + Math.floor((geom.h - dh) / 2);
  // 팔레트 사전 변환 (틴트 1회)
  const pal = spr.palette.map((c) => (tint !== null ? tintColor(c, tint, tintK) : c));
  const erase = opts?.erase?.length ? opts.erase : null;
  /** 셀 중심이 삭제 영역 안인가 — 좌표는 **그려진 rect 정규화(미러 적용 후 화면 기준)** */
  const erased = (drawnX: number, ry: number): boolean => {
    if (!erase) return false;
    const px = (drawnX + cell / 2 - ox) / dw;
    const py = (ry + cell / 2 - oy) / dh;
    return erase.some((poly) => pointInPoly(px, py, poly));
  };

  for (let r = 0; r < spr.h; r++) {
    const row = spr.rows[r];
    const ry = oy + (mirrorY ? spr.h - 1 - r : r) * cell;
    let c = 0;
    while (c < spr.w) {
      const ch = row[c];
      if (ch === '.') { c++; continue; }
      let run = 1;
      while (c + run < spr.w && row[c + run] === ch) run++;
      const idx = AB.indexOf(ch);
      g.fillStyle(pal[idx] ?? 0x000000, 1);
      const cx = mirrorX ? spr.w - c - run : c;
      if (!erase) {
        g.fillRect(ox + cx * cell, ry, run * cell, cell);
      } else {
        // 삭제 영역과 겹치면 런을 쪼개 남는 부분만 그린다 (원형 틀 유지 부분 제거)
        let s = -1;
        for (let k = 0; k <= run; k++) {
          const keep = k < run && !erased(ox + (cx + k) * cell, ry);
          if (keep && s < 0) s = k;
          if (!keep && s >= 0) { g.fillRect(ox + (cx + s) * cell, ry, (k - s) * cell, cell); s = -1; }
        }
      }
      c += run;
    }
  }
  return { x: ox, y: oy, w: dw, h: dh };
}

/**
 * 도마 위 생선 렌더 — FSM 상태로 스프라이트 선택 + 방향 미러 + 상태 오버레이.
 *  BASE = 원본(머리 왼쪽) / FLIP = 좌우 미러.
 *  ⚠ 상하 미러는 쓰지 않는다 — **뱃살은 항상 아래쪽**이고, "배 위로"·"등 위로"는
 *  전용 뷰 스프라이트(복면/체강/장뜨기)로 표현한다 (사용자 지시 2026-07-30).
 */
export function drawPixelButcherFish(
  g: Phaser.GameObjects.Graphics, geom: PixelFishGeom,
  tint: number | null, state: PixelFishState,
  sprites: ButcherSpriteSet = { whole: FISH_WHOLE, dressed: FISH_DRESSED, fillet: FISH_FILLET, nativeColor: false, familyKey: 'bream' },
): void {
  const o = state.orientation;

  // ── 박피 (2단계 — 사용자 지시 2026-07-31) ──
  //  ①꼬리 손잡이·③당기기 = 탑뷰(껍질 위에 살코기) / ②경계 칼 넣기 = 측면 단면 뷰
  if (!state.finished && (state.stageId === 'peel_grip' || state.stageId === 'peel_pull')) {
    drawPeelTop(g, geom, sprites, state, tint);
    return;
  }
  if (!state.finished && state.stageId === 'peel_insert') {
    // 넙치류는 전용 단면 뷰 미제작 — 돔류 단면으로 폴백 (경계 위치 동일 컨벤션)
    const cross = stageSpr(`${sprites.familyKey}_peelcross`)
      ?? (sprites.flat ? stageSpr('bream_peelcross') : undefined);
    if (cross) { drawSprite(g, cross, geom, false, false, null, 0); return; }
  }

  // ── 넙치류(다섯장뜨기) — 탑뷰 전용 렌더 (박피 단계는 위 공용 경로가 처리) ──
  if (sprites.flat) {
    drawFlatFish(g, geom, sprites, state, tint);
    return;
  }

  // ── 손질 단계 스프라이트 (복면 뷰 / 체강 탑뷰 / 장뜨기 길내기 1~3) — 있으면 우선 사용 ──
  const stagePick = pickStageSprite(sprites.familyKey, state);
  if (stagePick) {
    const dr = drawSprite(g, stagePick.spr, geom, stagePick.mirrorX, false,
      sprites.nativeColor ? null : tint, 0.22);
    // 복면 뷰 — 개복 전에는 정중선을 따라 아직 부푼 배(내장) 음영, 개복 후엔 붉은 내장 노출
    if (stagePick.view === 'ventral' && !state.gutted && state.stageId === 'gut_scoop') {
      // 가른 정중선 사이로 드러난 내장 덩어리 (간·위·장) — 좁고 길게
      g.fillStyle(0x8a3040, 0.92);
      g.fillEllipse(dr.x + dr.w * 0.38, dr.y + dr.h * 0.5, dr.w * 0.26, dr.h * 0.13);
      g.fillStyle(0x6a2030, 0.92);
      g.fillEllipse(dr.x + dr.w * 0.28, dr.y + dr.h * 0.5, dr.w * 0.1, dr.h * 0.1);
      g.fillStyle(0x9c4a4a, 0.85);
      g.fillEllipse(dr.x + dr.w * 0.48, dr.y + dr.h * 0.5, dr.w * 0.09, dr.h * 0.07);
    }
    // 체강 탑뷰 — 세척 단계는 고인 피가 씻겨나간 상태 (밝은 물기 오버레이)
    if (stagePick.view === 'cavity' && state.stageId === 'gut_wash') {
      g.fillStyle(0xbfe0ff, 0.16);
      g.fillEllipse(dr.x + dr.w * 0.45, dr.y + dr.h * 0.5, dr.w * 0.7, dr.h * 0.4);
    }
    return;
  }

  const filletView = state.finished || o === 'FLESH_UP';
  const mirrorX = !filletView && o === 'FLIP';
  /**
   * **밑손질 구간(개복 전 측면 뷰) = 원형 틀 고정 + 부분 삭제** (사용자 지시 2026-07-31).
   * 머리/지느러미/비늘은 자유 순서라, 스프라이트를 통째로 갈아끼우면 작업 순서마다 생선이
   * 확대·축소·이동해 유도선(도마 rect 고정 매핑)이 전부 틀어졌다. 항상 온마리를 기준 틀로
   * 그리고 **없어진 부위 영역만 지운다** → 어떤 순서로 해도 좌표가 불변.
   * 개복(gutted) 이후는 전용 뷰(복면/체강/장뜨기)가 담당하므로 기존 동작 유지.
   */
  const useBaseFrame = !filletView && (o === 'BASE' || o === 'FLIP') && !state.gutted;
  const spr = filletView ? sprites.fillet
    : useBaseFrame ? sprites.whole : bodySpriteFor(sprites, state);
  const frame = useBaseFrame ? computeFishFrame(sprites.whole, geom) : undefined;
  const erase = useBaseFrame ? buildPrepErase(sprites.familyKey, state, o) : undefined;
  // ⚠ 상하 미러 금지 — **뱃살은 항상 아래쪽**에 오도록 배치한다 (사용자 지시 2026-07-30).
  //  "배 위로(BELLY_UP)"는 미러가 아니라 전용 복면 뷰 스프라이트로 표현한다.
  const drawn = drawSprite(g, spr, geom, mirrorX, false, tint, 0.22,
    frame ? { frame, erase } : undefined);

  if (filletView) {
    // 박피 단계 — 구 오버레이(회색 껍질층 바 + 갈색 꼬리 손잡이 블럭)는 제거
    //  (사용자 지시 2026-07-31 — 실제 필렛 형태와 맞지 않아 둘 다 삭제. 박피 연출은 추후 재설계)
    return;
  }

  // 비늘 반짝임 (비늘치기 전 — "아직 비늘이 남아 있다" 상태 표시. BASE/FLIP 측면에서만).
  //  ⚠ 구 배치는 (i*73)%100 / (i*37)%100 모듈러라 주기가 겹쳐 **점 3개가 일직선**으로 찍히는
  //  격자 아티팩트가 있었다(사용자 리포트). 황금비 무리수 산포로 교체해 균일 분포로.
  if (state.hasScales && state.scaledSides < 2 && (o === 'BASE' || o === 'FLIP')
    && !(state.scaledSides >= 1 && o === 'BASE')) {
    g.fillStyle(0xffffff, 0.3);
    const PHI = 0.6180339887, G2 = 0.7548776662;
    for (let i = 0; i < 30; i++) {
      const fx = ((i + 1) * PHI) % 1, fy = ((i + 1) * G2) % 1;
      const sx = drawn.x + drawn.w * (0.16 + fx * 0.62);
      const sy = drawn.y + drawn.h * (0.22 + fy * 0.5);
      g.fillCircle(sx, sy, 1.5);
    }
  }

  // 내장 오버레이 (BELLY_UP 개복 후·제거 전 — 복면 뷰 미보유 폴백. 뱃살 = 아래쪽)
  if (o === 'BELLY_UP' && !state.gutted && state.stageId === 'gut_scoop') {
    g.fillStyle(0x8a3040, 0.92);
    g.fillEllipse(drawn.x + drawn.w * 0.42, drawn.y + drawn.h * 0.7, drawn.w * 0.34, drawn.h * 0.2);
    g.fillStyle(0x6a2030, 0.9);
    g.fillEllipse(drawn.x + drawn.w * 0.3, drawn.y + drawn.h * 0.72, drawn.w * 0.14, drawn.h * 0.12);
  }

  // 항문 마커 (BACK_DOWN — 장뜨기 기준점. 배쪽 = 아래 가장자리)
  if (o === 'BACK_DOWN') {
    const ax = mirrorX
      ? drawn.x + drawn.w * (1 - state.anusRatio)
      : drawn.x + drawn.w * state.anusRatio;
    g.fillStyle(0xffd257, 1);
    g.fillCircle(ax, drawn.y + drawn.h * 0.9, 3.5);
  }
  if (o === 'BACK_DOWN' && state.stageId?.startsWith('fillet_') && (state.strokesDone ?? 0) > 0) {
    // 장뜨기 길내기 진행 — 등 경계 절개선이 점점 깊어짐 (1=가는 선 → 3=벌어진 분홍 살)
    const n = Math.min(3, (state.strokesDone ?? 0) + (state.stageId.endsWith('_sever') ? 1 : 0));
    if (n >= 2) {
      g.fillStyle(0xe8b8b0, 0.9);
      g.fillRect(drawn.x + drawn.w * 0.14, drawn.y + drawn.h * 0.14, drawn.w * 0.68, 2 + n * 2);
    }
    g.lineStyle(1.5 + n, 0x2a1214, 0.9);
    g.lineBetween(drawn.x + drawn.w * 0.12, drawn.y + drawn.h * 0.15, drawn.x + drawn.w * 0.85, drawn.y + drawn.h * 0.13);
  }
}
