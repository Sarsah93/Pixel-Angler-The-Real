/**
 * @file CephalopodStages.ts
 * @description 두족류 손질 스테이지 트리 (CEPHALOPOD_BUTCHERY_SPEC §4)
 *
 * 097차 현재: **무늬오징어 20 · 한치(트리 공유) · 문어 8** 구현. 갑오징어 13은 트리 미작성이라
 * `undefined`를 돌려주고, 게이트(`isCephalopodTreeReady`)가 준비 중 안내를 유지한다.
 *
 * ⚠ 스테이지 ↔ 사진 대응은 §1.1 표 기반 (`①`~`⑪` = 실사 컷) — 단 사용자 공정 재정의 4건:
 *   - **제거 2** (2026-08-11): 펼치기(개복 완료 화면이 곧 펼쳐진 화면) · 분리 결과 확인(부산물 팝업 대체)
 *   - **추가 2** (2026-08-12): 껍질 뜯기 ②(아래로 마무리 — 가로 뜯기 뒤 잔여 껍질) ·
 *     날개 뜯기 ①(껍질째 분리 — 필렛에서 날개+껍질을 먼저 뜯고, 기존 스테이지가 날개살 분리 ②가 된다)
 *   - **날개 2단 분할 ×2** (2026-08-13): 껍질째/날개살 각 단을 날개 하나씩 2스테이지로
 *     (2/2는 좌우 반전 뷰 — 양쪽 날개를 각각 뜯는다)
 *   - **내장 분리 2분할 + 날개 순서 재정의** (094차): 내장 = 드래그 2회(뽑기 1 → 뽑기 2 미러) ·
 *     날개는 **날개살 분리 → 껍질째 뜯기** 순
 *   - **껍질 뜯기(가로) 4분할** (095차): 라이브 프레임 전환 폐기 — 짧은 당김 4단계, 각 완료 시
 *     다음 사진(0-1 → 1-2 → 2 → 3 → 4.1)
 *   총 14 → 12 → 14 → 16 → 17 → **20스테이지**. 아가미·닦기는 날개 뒤(완료본 실사와 진행 정합).
 * ⚠ 구조 규약(§0.5.4): **스테이지 1개 = 작업 1개**, 섹션은 전부 `anyOrder: false`.
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { ButcheryStage, CutPoint, CutSpec, ButcheryOrientation } from '../types/Butchery.js';
import {
  CEPH_SHIME_1, CEPH_SHIME_2, CEPH_SHIME_1_PATH, CEPH_SHIME_2_PATH,
  CEPH_SLIT_PATH, CEPH_VISCERA_PATH, CEPH_VISCERA_PATH_2, CEPH_PEN_PATH,
  CEPH_SKIN_LIFT_TAP, CEPH_PEEL_STEP_SWEEPS, CEPH_PEEL_FINISH_SWEEP,
  CEPH_GILL_REGION, CEPH_GILL_SWEEP, CEPH_FIN_PATHS, CEPH_FINSKIN_PATHS,
  CEPH_HEAD_SPLIT_PATHS, CEPH_BEAK_CENTER, CEPH_BEAK_PATH,
  OCTO_INVERT_PATH, OCTO_VISCERA_GRIP, OCTO_VISCERA_PATH,
  OCTO_BEAK_CENTER, OCTO_BEAK_PATH, OCTO_SALT_REGION, OCTO_SCRUB_REGION,
} from './CephalopodGuides.js';

/** 컷 스펙 헬퍼 — 두족류는 tolerance가 어류보다 후하다(덩어리를 다루는 동작이 많다) */
function cCut(
  id: string, orientation: ButcheryOrientation, guidePath: readonly CutPoint[],
  opts: Partial<CutSpec> = {},
): CutSpec {
  return {
    id, orientationRequired: orientation, tool: 'knife',
    guidePath: guidePath as CutPoint[],
    tolerance: opts.tolerance ?? 0.11,
    minCoverage: opts.minCoverage ?? 0.6,
    strokesRequired: opts.strokesRequired,
    strong: opts.strong,
    guidePaths: opts.guidePaths,
  };
}

/**
 * 무늬오징어 — **20스테이지**
 * (§1.1 13 + 부리 − 제거 2(08-11) + 껍질②·날개① 추가 2(08-12) + 날개 2단 분할 ×2 +
 *  내장 2분할(094차) + 껍질 가로 4분할(095차)).
 *
 * 제거 2건: 펼치기(개복 완료 = 곧 펼쳐진 화면이라 별도 조작 불필요) ·
 * 분리 결과 확인(머리+다리 덩어리 부산물 팝업이 결과 이미지를 겸한다).
 * 내장 = 드래그 2회(뽑기 1 → 뽑기 2 미러) · 껍질 = **가로 4단계**(조금씩 당겨 사진이 넘어감)
 * → 상→하 마무리 · 날개 = **[날개살 분리 → 껍질째 뜯기]** 각 날개별 2스테이지.
 * `ceph_beak_out`은 실사에 없는 추가 공정 — 명시적 예외(§0.5.6).
 */
function buildSquidStages(): ButcheryStage[] {
  return [
    // ── 시메 (사진 시메①②) — 신경 차단. 색소포 발색이 유백색으로 전환된다 ──
    {
      id: 'ceph_shime_mantle', label: '시메 ① — 갑–눈 사이', orientation: 'CEPH_DORSAL',
      primitive: 'nerve_cut',
      guide: '몸통과 눈 사이 중심선을 짧고 정확하게 끊으세요 (선도 유지)',
      tapPoint: CEPH_SHIME_1, tapRadius: 0.06,
      cut: cCut('ceph_shime_mantle', 'CEPH_DORSAL', CEPH_SHIME_1_PATH, { tolerance: 0.07 }),
    },
    {
      id: 'ceph_shime_arms', label: '시메 ② — 눈–다리 사이', orientation: 'CEPH_DORSAL',
      primitive: 'nerve_cut',
      guide: '눈과 다리 사이를 끊으세요 — 먹물 분출 위험이 크게 줄어듭니다',
      tapPoint: CEPH_SHIME_2, tapRadius: 0.06,
      cut: cCut('ceph_shime_arms', 'CEPH_DORSAL', CEPH_SHIME_2_PATH, { tolerance: 0.07 }),
    },
    // ── 개복 (실사 ①②) ──
    {
      id: 'ceph_mantle_open', label: '몸통 절개', orientation: 'CEPH_VENTRAL',
      primitive: 'mantle_slit',
      guide: '외투막 입구에 칼을 넣어 몸통 끝까지 한 번에 갈라주세요',
      cut: cCut('ceph_mantle_open', 'CEPH_VENTRAL', CEPH_SLIT_PATH, { tolerance: 0.09 }),
    },
    // ── 내장 분리 (실사 ② + 뽑기 1/2 미러 — 094차 2스테이지 분할: 사용자 지시
    //    "연결 프레임처럼 보이게 하는 건 에셋이 안 맞으므로 따로따로 단계를 나누자") ──
    {
      id: 'ceph_viscera_pull_1', label: '내장 분리 1/2', orientation: 'CEPH_OPEN',
      primitive: 'drag_out',
      guide: '머리·다리 덩어리를 잡고 내장과 함께 뜯어 올리세요',
      cut: cCut('ceph_viscera_pull_1', 'CEPH_OPEN', CEPH_VISCERA_PATH, { tolerance: 0.13 }),
    },
    {
      id: 'ceph_viscera_pull_2', label: '내장 분리 2/2', orientation: 'CEPH_OPEN',
      primitive: 'drag_out',
      guide: '들린 덩어리를 잡고 끝까지 마저 뽑아내세요',
      cut: cCut('ceph_viscera_pull_2', 'CEPH_OPEN', CEPH_VISCERA_PATH_2, { tolerance: 0.13 }),
    },
    // ── 연골 (실사 ⑤) ──
    {
      id: 'ceph_pen_out', label: '오징어뼈(연골) 제거', orientation: 'CEPH_OPEN',
      primitive: 'drag_out',
      guide: '중심선의 투명한 연골을 몸통 끝에서 잡아 당겨 빼내세요',
      cut: cCut('ceph_pen_out', 'CEPH_OPEN', CEPH_PEN_PATH, { tolerance: 0.09 }),
    },
    // ── 껍질 (실사 + detail 시퀀스 — 093차 사용자 공정 재정의) ──
    //  섹션 전체가 **좌 90° 회전 뷰(270) 유지** — detail 사진들이 전부 이 방향으로 촬영됐다.
    //  들추기(탭 → 손잡이 플랩 연출) → 뜯기 ①(우→좌 곡선 · 진행 프레임 5장:
    //  들춤→1-2→2→3→4.1) → 마무리(상→하 당김 · 4.1→합성B, 완료 연출 4.2) → 분리 완료(실사 6).
    {
      id: 'ceph_flip_skin', label: '뒤집어 껍질 잡기', orientation: 'CEPH_SKIN_UP',
      // 클릭 1회(tap) — 성공 시 껍질이 살짝 들리며 손잡이가 되는 연출(squid_skin_lift 프레임).
      primitive: 'tap', flipBefore: 'longAxis180', rotationRequired: 270,
      guide: '몸통 가장자리의 표시 지점을 클릭해 껍질을 들춰 잡으세요',
      tapPoint: CEPH_SKIN_LIFT_TAP, tapRadius: 0.08,
    },
    // 껍질 뜯기(가로) — 095차 **4단계 분할** (사용자: "조금씩 드래깅해서 다음 사진으로").
    //  각 단계 = 시작 사진 위에서 짧은 당김 → 완료 시 다음 사진 (프레임 라이브 전환 폐기).
    {
      id: 'ceph_skin_peel_1', label: '껍질 뜯기(가로) 1/4', orientation: 'CEPH_SKIN_UP',
      primitive: 'peel', pullsRequired: 1, rotationRequired: 270,
      guide: '들춰 잡은 껍질 손잡이를 조금씩 당겨 뜯기 시작하세요',
      tapPoint: CEPH_PEEL_STEP_SWEEPS[0][0], tapRadius: 0.14,
      sweepPath: CEPH_PEEL_STEP_SWEEPS[0] as CutPoint[],
    },
    {
      id: 'ceph_skin_peel_2', label: '껍질 뜯기(가로) 2/4', orientation: 'CEPH_SKIN_UP',
      primitive: 'peel', pullsRequired: 1, rotationRequired: 270,
      guide: '딸려 나온 껍질을 잡고 조금 더 당기세요',
      tapPoint: CEPH_PEEL_STEP_SWEEPS[1][0], tapRadius: 0.14,
      sweepPath: CEPH_PEEL_STEP_SWEEPS[1] as CutPoint[],
    },
    {
      id: 'ceph_skin_peel_3', label: '껍질 뜯기(가로) 3/4', orientation: 'CEPH_SKIN_UP',
      primitive: 'peel', pullsRequired: 1, rotationRequired: 270,
      guide: '절반까지 왔습니다 — 계속 당기세요',
      tapPoint: CEPH_PEEL_STEP_SWEEPS[2][0], tapRadius: 0.14,
      sweepPath: CEPH_PEEL_STEP_SWEEPS[2] as CutPoint[],
    },
    {
      id: 'ceph_skin_peel_4', label: '껍질 뜯기(가로) 4/4', orientation: 'CEPH_SKIN_UP',
      primitive: 'peel', pullsRequired: 1, rotationRequired: 270,
      guide: '가로 방향 마지막 — 껍질을 끝까지 당겨 뜯으세요',
      tapPoint: CEPH_PEEL_STEP_SWEEPS[3][0], tapRadius: 0.14,
      sweepPath: CEPH_PEEL_STEP_SWEEPS[3] as CutPoint[],
    },
    {
      id: 'ceph_skin_finish', label: '껍질 뜯기 ② — 아래로 마무리', orientation: 'CEPH_SKIN_UP',
      primitive: 'peel', pullsRequired: 1, rotationRequired: 270,
      guide: '남은 껍질을 잡고 아래로 끝까지 당겨 뜯으세요',
      tapPoint: CEPH_PEEL_FINISH_SWEEP[0], tapRadius: 0.14,
      sweepPath: CEPH_PEEL_FINISH_SWEEP as CutPoint[],
    },
    {
      // 뷰·회전을 이어받는 결과 확인 (같은 도마 그림 — 뒤집기/회전 연출이 끼면 마무리 연출이 생략된다)
      id: 'ceph_skin_done', label: '껍질 분리 완료', orientation: 'CEPH_SKIN_UP',
      primitive: 'result', rotationRequired: 270,
      guide: '껍질이 통째로 벗겨져 순살만 남았습니다',
    },
    // ── 마무리 — **날개살 분리 → 날개 뜯기(껍질째)** → 아가미·닦기 ──
    //  092차 날개별 2스테이지 분할 유지. **094차 순서 재정의**(사용자 2026-08-13):
    //  "날개살 분리가 먼저고, 날개뜯기(껍질째)가 그 다음". 좌표는 F9 실측(수평 우→좌 2선).
    {
      id: 'ceph_fin_off_1', label: '날개살 분리 1/2', orientation: 'CEPH_FLESH_UP',
      // 칼 절삭이 아니라 손으로 뜯는 동작 — 당김 연출 계열
      primitive: 'drag_out',
      guide: '첫째 날개의 날개살을 우측에서 왼쪽으로 벗겨 분리하세요',
      cut: cCut('ceph_fin_off_1', 'CEPH_FLESH_UP', CEPH_FIN_PATHS[0], { tolerance: 0.10 }),
    },
    {
      id: 'ceph_fin_off_2', label: '날개살 분리 2/2', orientation: 'CEPH_FLESH_UP',
      primitive: 'drag_out',
      guide: '반대쪽 날개의 날개살도 벗겨 분리하세요',
      cut: cCut('ceph_fin_off_2', 'CEPH_FLESH_UP', CEPH_FIN_PATHS[1], { tolerance: 0.10 }),
    },
    {
      id: 'ceph_finskin_off_1', label: '날개 뜯기(껍질째) 1/2', orientation: 'CEPH_FLESH_UP',
      primitive: 'drag_out',
      guide: '첫째 날개를 껍질째 잡고 몸통 살에서 뜯어내세요',
      cut: cCut('ceph_finskin_off_1', 'CEPH_FLESH_UP', CEPH_FINSKIN_PATHS[0], { tolerance: 0.12 }),
    },
    {
      id: 'ceph_finskin_off_2', label: '날개 뜯기(껍질째) 2/2', orientation: 'CEPH_FLESH_UP',
      primitive: 'drag_out',
      guide: '반대쪽 날개도 껍질째 잡고 뜯어내세요',
      cut: cCut('ceph_finskin_off_2', 'CEPH_FLESH_UP', CEPH_FINSKIN_PATHS[1], { tolerance: 0.12 }),
    },
    {
      id: 'ceph_gill_wash', label: '아가미 제거 · 내장면 닦기', orientation: 'CEPH_FLESH_UP',
      primitive: 'hold_scrub', fillTarget: 0.85,
      guide: '몸통 안쪽을 왕복으로 훑어 아가미와 잔막을 걷어내세요',
      regionPoly: CEPH_GILL_REGION as CutPoint[],
      sweepPath: CEPH_GILL_SWEEP as CutPoint[],
    },
    {
      id: 'ceph_head_split', label: '머리부 3분할', orientation: 'CEPH_PARTS',
      primitive: 'vessel_cut',
      guide: '덩어리를 다리 / 머리 / 먹물주머니 3조각으로 가르세요 (2곳)',
      cut: cCut('ceph_head_split', 'CEPH_PARTS', CEPH_HEAD_SPLIT_PATHS[0], {
        tolerance: 0.10, guidePaths: CEPH_HEAD_SPLIT_PATHS.map((p) => p as CutPoint[]),
      }),
    },
    // ── 부리 (§0.5.6 — 실사에 없는 유일한 추가 스테이지) ──
    {
      id: 'ceph_beak_out', label: '부리 빼내기', orientation: 'CEPH_PARTS',
      primitive: 'drag_out',
      guide: '다리 밑동 가운데의 부리를 눌러 밀어 올린 뒤 통째로 뽑으세요',
      tapPoint: CEPH_BEAK_CENTER,
      cut: cCut('ceph_beak_out', 'CEPH_PARTS', CEPH_BEAK_PATH, { tolerance: 0.10 }),
    },
  ];
}

/**
 * 두족류 스테이지 트리 — speciesId로 분기 (§4).
 * `kind`가 아니라 **speciesId**로 고르는 이유: 무늬오징어와 한치는 둘 다 `kind: 'squid'`인데
 * 트리가 다르다(뼈·아가미 분리 여부 · 껍질 중단 · 날개 · 3분할).
 *
 * @returns 미구현 종이면 `undefined` — 호출부가 게이트를 유지한다.
 */
export function buildCephalopodStages(speciesId: string): ButcheryStage[] | undefined {
  switch (speciesId) {
    case 'squid': return buildSquidStages();
    // 한치 = **무늬오징어 트리 공유** (097차 사용자 지시 — 부산물·회뜨기 규칙 공통.
    //  스펙 §4.2의 껍질 중단(peelStopBand)·촉완 전용 스테이지는 실사 확보 시 분화)
    case 'swordtip_squid': return buildSquidStages();
    // 참문어·대문어 = 칼 없는 8스테이지 (097차 — 스펙 §4.4 기반 축약)
    case 'octopus': case 'giant_octopus': return buildOctopusStages();
    // TODO: cuttlefish 13 (§4.3 — 갑 들어내기·속껍질. 날개살 미지급 규칙 적용할 것)
    default: return undefined;
  }
}

/**
 * 참문어 — **8스테이지** (칼을 쓰지 않는 유일한 트리 — §4.4 기반).
 * 외번(머리 뒤집기) → 내장 떼기 → 되돌리기 → 굵은소금 치대기 → 거품 문지르기 → 세척 →
 * 악판 뽑기 → 완주(통마리 순살). 소금 단계는 client가 '굵은소금' 아이템을 소모 게이트로 건다.
 */
function buildOctopusStages(): ButcheryStage[] {
  return [
    {
      id: 'octo_invert', label: '머리 뒤집기 (외번)', orientation: 'OCTO_WHOLE',
      primitive: 'invert',
      guide: '머리(외투막)를 목에서 끝 방향으로 밀어 속이 밖으로 나오게 뒤집으세요',
      cut: cCut('octo_invert', 'OCTO_WHOLE', OCTO_INVERT_PATH, { tolerance: 0.13 }),
    },
    {
      id: 'octo_viscera_pull', label: '내장 떼어내기', orientation: 'OCTO_INVERTED',
      primitive: 'drag_out',
      guide: '드러난 내장 덩어리를 잡고 통째로 떼어내세요 (먹물주머니 조심)',
      tapPoint: OCTO_VISCERA_GRIP, tapRadius: 0.12,
      cut: cCut('octo_viscera_pull', 'OCTO_INVERTED', OCTO_VISCERA_PATH, { tolerance: 0.13 }),
    },
    {
      // 되돌리기 = 버튼 1탭 (flip 프리미티브 — 조작 난이도가 아니라 공정 순서 표현)
      id: 'octo_revert', label: '머리 되돌리기', orientation: 'OCTO_INVERTED',
      primitive: 'flip', flipKind: 'headRestore',
      guide: '뒤집었던 머리를 원래대로 되돌리세요',
    },
    {
      id: 'octo_salt', label: '굵은소금 치대기', orientation: 'OCTO_WHOLE',
      primitive: 'salt_apply', fillTarget: 0.85,
      guide: '굵은소금을 뿌리고 몸 전체를 왕복으로 치대세요 (굵은소금 1개 소모)',
      regionPoly: OCTO_SALT_REGION as CutPoint[],
      // 몸 전체 왕복 지그재그 (근사 — 파라메트릭 렌더 기준. 실사 도입 시 F9 재실측)
      sweepPath: [
        { x: 0.14, y: 0.34 }, { x: 0.86, y: 0.40 },
        { x: 0.18, y: 0.55 }, { x: 0.84, y: 0.64 },
      ],
    },
    {
      id: 'octo_scrub', label: '거품 · 점액 문지르기', orientation: 'OCTO_WHOLE',
      primitive: 'hold_scrub', fillTarget: 0.9,
      guide: '다리와 빨판 쪽을 집중적으로 문질러 점액과 이물을 걷어내세요',
      regionPoly: OCTO_SCRUB_REGION as CutPoint[],
      // 다리·빨판(좌측) 집중 스윕 (근사)
      sweepPath: [
        { x: 0.05, y: 0.32 }, { x: 0.42, y: 0.40 },
        { x: 0.06, y: 0.56 }, { x: 0.40, y: 0.68 },
      ],
    },
    {
      id: 'octo_wash', label: '흐르는 물 세척', orientation: 'OCTO_WHOLE',
      primitive: 'wash',
      guide: '거품과 소금기를 흐르는 물에 깨끗이 씻어내세요',
    },
    {
      id: 'octo_beak_out', label: '악판(입) 뽑아내기', orientation: 'OCTO_ORAL',
      primitive: 'drag_out',
      guide: '다리 가운데(입)를 눌러 악판을 밀어낸 뒤 통째로 뽑으세요',
      tapPoint: OCTO_BEAK_CENTER, tapRadius: 0.1, radialSpace: true,
      cut: cCut('octo_beak_out', 'OCTO_ORAL', OCTO_BEAK_PATH, { tolerance: 0.12 }),
    },
    {
      id: 'octo_done', label: '손질 완료', orientation: 'OCTO_WHOLE',
      primitive: 'result',
      guide: '손질이 끝났습니다 — 통마리 순살 (숙회 · 슬라이싱 입력)',
    },
  ];
}

/** 손질 트리가 실제로 구현된 두족류인가 — 프로필만 있고 트리가 없는 종과 구분한다 */
export function isCephalopodTreeReady(speciesId: string): boolean {
  return buildCephalopodStages(speciesId) !== undefined;
}
