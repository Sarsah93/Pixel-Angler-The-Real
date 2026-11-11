/**
 * @file EelStages.ts
 * @description 장어류 손질 스테이지 트리 (315차 — 사용자 지시 「장어류 손질 … 실제와 유사한 모습」)
 *
 * 세 어종의 실제 공정(도마 위 · 머리 왼쪽 · 송곳으로 머리를 박아 고정한 채):
 *  - 붕장어(conger_eel) — 등 가르기(바닷장어 구이 · 회 포): 송곳 → 점액(굵은소금) → 등 가르기 → 펼치기 →
 *    내장 → 중골 → 지느러미(양쪽 가장자리) → 머리
 *  - 갯장어(pike_conger · 하모) — 배 가르기: 송곳 → 점액 → 배 가르기 → 펼치기 → 내장 → 중골 → 지느러미 → 머리 →
 *    **뼈끊기**(껍질 한 겹만 남기고 잔뼈를 촘촘히 끊는다 — 하모 샤부샤부 · 유비키)
 *  - 먹장어(hagfish · 곰장어) — 송곳 → 목 둘레 칼집 → **껍질 통째로 벗기기** → 배 가르기 → 펼치기 → 내장 → 씻기 → 머리
 *    (단단한 뼈가 없다 — 중골 · 지느러미 단계가 없다)
 *
 * 유도선은 그림과 같은 몸 윤곽에서 구운 `EEL_GUIDE`(tools/gen_eel_views.cjs)다. 뷰는 늘 BASE(도마에 눕힌 그대로) —
 * 측면 → 펼친 살 전환은 「펼치기」 완료로 그림이 바뀐다(client `EelBoard`). 뒤집기가 없다.
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { ButcheryStage, CutPoint, CutSpec } from '../types/Butchery.js';
import { EEL_GUIDE } from './EelGuideGeometry.js';

function eelCut(id: string, path: CutPoint[], o: { tolerance?: number; minCoverage?: number; strong?: boolean; guidePaths?: CutPoint[][] } = {}): CutSpec {
  return {
    id, orientationRequired: 'BASE', tool: 'knife', guidePath: path,
    tolerance: o.tolerance ?? 0.06, minCoverage: o.minCoverage ?? 0.6,
    strong: o.strong, guidePaths: o.guidePaths,
  };
}

/** 장어류 공정이 있는 어종인가(유도선 기하가 구워져 있어야 한다) */
export function isEelButcherySpecies(speciesId: string): boolean {
  return !!EEL_GUIDE[speciesId];
}

/** 장어류 스테이지 — 기하가 없는 어종이면 null */
export function buildEelStages(speciesId: string): ButcheryStage[] | null {
  const g = EEL_GUIDE[speciesId];
  if (!g) return null;
  const st: ButcheryStage[] = [];
  const B = 'BASE' as const;

  st.push({
    id: 'eel_pin', label: '송곳 고정', orientation: B, primitive: 'tap',
    guide: '눈 바로 뒤를 송곳으로 찔러 머리를 도마에 박아 고정하세요',
    tapPoint: g.pin, tapRadius: 0.05,
  });

  if (g.skinPeel) {
    // 먹장어 — 목 칼집 → 껍질을 머리 쪽에서 잡아 꼬리 쪽으로 통째로 벗긴다(점액도 껍질과 함께 나간다)
    st.push({
      id: 'eel_neck_cut', label: '목 둘레 칼집', orientation: B, primitive: 'guided_cut',
      guide: '머리 바로 뒤를 한 바퀴 돌려 껍질에만 칼집을 내세요',
      cut: eelCut('eel_neck_cut', g.neck, { tolerance: 0.05 }),
    });
    st.push({
      id: 'eel_skin_peel', label: '껍질 벗기기', orientation: B, primitive: 'peel', pullsRequired: 1,
      guide: '칼집 낸 껍질 끝을 잡고 꼬리 쪽으로 통째로 벗겨 내세요',
      tapPoint: g.peelGrip, tapRadius: 0.06, sweepPath: g.peel,
    });
  } else {
    st.push({
      id: 'eel_slime', label: '점액 빼기', orientation: B, primitive: 'drag_fill', fillTarget: 0.9,
      guide: '굵은소금을 뿌리고 머리에서 꼬리까지 훑어 미끈한 점액을 빼세요',
      sweepPath: g.slime,
    });
  }

  if (g.open === 'back') {
    st.push({
      id: 'eel_back_cut', label: '등 가르기', orientation: B, primitive: 'guided_cut',
      guide: '머리 뒤에서 칼을 넣어 등뼈 위를 따라 꼬리까지 가르세요 (배 쪽은 붙여 둡니다)',
      cut: eelCut('eel_back_cut', g.backCut, { tolerance: 0.05, strong: true }),
    });
  } else {
    st.push({
      id: 'eel_belly_cut', label: '배 가르기', orientation: B, primitive: 'guided_cut',
      guide: '목 아래에서 칼을 넣어 배를 따라 꼬리까지 가르세요 (등 쪽은 붙여 둡니다)',
      cut: eelCut('eel_belly_cut', g.bellyCut, { tolerance: 0.05, strong: true }),
    });
  }
  st.push({
    id: 'eel_spread', label: '펼치기', orientation: B, primitive: 'lift_flap',
    guide: '갈라 놓은 살을 손으로 벌려 껍질이 도마에 닿게 꼬리까지 펼치세요',
    cut: eelCut('eel_spread', g.spread, { tolerance: 0.09 }),
  });
  st.push({
    id: 'eel_gut_out', label: '내장 빼기', orientation: B, primitive: 'drag_out',
    guide: '내장을 항문 쪽에서 잡아 목 쪽으로 끌어내세요',
    cut: eelCut('eel_gut_out', g.gutOut, { tolerance: 0.08 }),
  });

  if (g.skinPeel) {
    st.push({
      id: 'eel_wash', label: '씻기', orientation: B, primitive: 'wash',
      guide: '흐르는 물에 남은 핏물과 점액을 씻어 내세요',
    });
  } else {
    st.push({
      id: 'eel_spine_cut', label: '중골 발라내기', orientation: B, primitive: 'guided_cut',
      guide: '중골 밑으로 칼을 눕혀 넣고 머리에서 꼬리로 뼈를 발라내세요',
      cut: eelCut('eel_spine_cut', g.spine, { tolerance: 0.05, strong: true }),
    });
    st.push({
      id: 'eel_fin_trim', label: '지느러미 떼기', orientation: B, primitive: 'guided_cut',
      guide: '양쪽 가장자리에 붙은 지느러미를 따라 잘라 내세요 (위 · 아래 순서는 자유)',
      cut: eelCut('eel_fin_trim', g.finTop, { tolerance: 0.05, minCoverage: 0.5, guidePaths: [g.finTop, g.finBot] }),
    });
  }

  st.push({
    id: 'eel_head_off', label: '머리 떼기', orientation: B, primitive: 'guided_cut',
    guide: '목에서 머리를 잘라 내세요 (송곳도 함께 뽑습니다)',
    cut: eelCut('eel_head_off', g.head, { tolerance: 0.05, strong: true }),
  });

  if (g.boneCut) {
    st.push({
      id: 'eel_honekiri', label: '뼈끊기', orientation: B, primitive: 'guided_cut',
      guide: '칼을 세워 껍질 한 겹만 남기고 잔뼈를 촘촘히 끊으세요 (여덟 줄 · 순서 자유)',
      cut: eelCut('eel_honekiri', g.honekiri[0], { tolerance: 0.04, minCoverage: 0.55, guidePaths: g.honekiri }),
    });
  }
  // 마지막 단계에서 펼친 포 한 장이 나온다(프로필 filletCount 1)
  st[st.length - 1].yieldsFillet = true;
  return st;
}
