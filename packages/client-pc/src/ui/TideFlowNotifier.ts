/**
 * @file TideFlowNotifier.ts
 * @description 패시브 스킬 「물때 감각」(fish_tide) — 물때 흐름이 바뀌면 지역 채널로 알린다 (204차).
 *
 * 사용자 지시: "낚시에 열중하느라 시간을 놓치지 않게 — 초들물입니다, 이런 식으로".
 *  - 단계가 바뀌는 순간 「[물때] 초들물입니다 — (관찰 한 줄)」.
 *  - 바뀌기 10분 전 「[물때] 10분 뒤 만조 물돌이」 예고(한 단계에 한 번).
 *  - 스킬을 배운 뒤 처음 도는 씬에서 지금 물때를 한 번 알린다.
 *
 * 필드 · 1인칭 · 집 씬이 각자 update에서 `pumpTideFlow(scene)`을 부른다(실시간 5초 간격 — 씬 타이머가 아니라 벽시계).
 * 줄은 필드 HUD 지역 채널에 쌓이고, 필드가 아닌 씬(1인칭 · 집)에서는 화면 위에 잠깐 띄운다.
 * 상태는 모듈 하나가 들고 있어 씬을 오가도 같은 알림이 두 번 뜨지 않는다.
 */

import Phaser from 'phaser';
import { GAME_WIDTH } from '../PhaserConfig.js';
import { TIDE_FLOW_LABEL_KO, TIDE_FLOW_NOTE_KO, tideFlowStateAt, type TideFlowPhase } from '@tra/core';
import { GameState } from '../store/GameState.js';

const POLL_MS = 5000;
const WARN_MIN = 10;

let lastPollMs = 0;
let lastPhase: TideFlowPhase | null = null;
let warnedPhase: TideFlowPhase | null = null;
/** 스킬을 배운 뒤 첫 안내를 했는가 */
let introduced = false;

/** 지금 이 스킬을 가졌는가 */
export function hasTideSense(): boolean {
  return GameState.skillRank('fish_tide') >= 1;
}

/** 필드 HUD 지역 채널에 한 줄 */
function channelLog(scene: Phaser.Scene, line: string): void {
  const field = scene.scene.get('RegionFieldScene') as unknown as { hud?: { pushLog(m: string): void } } | null;
  try { field?.hud?.pushLog(line); } catch { /* 필드 HUD 없음 */ }
}

/** 필드가 아닌 씬 — 화면 위 가운데에 잠깐 */
function toast(scene: Phaser.Scene, line: string, y: number): void {
  const t = scene.add.text(GAME_WIDTH / 2, y, line, {
    fontFamily: '"Noto Sans KR", sans-serif', fontSize: '13px', color: '#9fe8ff', fontStyle: 'bold',
    backgroundColor: '#0a1628e0', padding: { x: 12, y: 5 }, align: 'center',
    wordWrap: { width: Math.min(640, GAME_WIDTH - 80) },
  }).setOrigin(0.5, 0).setDepth(1170).setScrollFactor(0).setAlpha(0);
  scene.tweens.add({ targets: t, alpha: 1, duration: 220 });
  scene.tweens.add({ targets: t, alpha: 0, delay: 4200, duration: 400, onComplete: () => t.destroy() });
}

export interface TideFlowPumpOpts {
  /** 화면 위에도 띄운다(필드가 아닌 씬) */
  toastY?: number;
  /** 지금은 띄우지 않는다(파이팅 중 등) — 다음 펌프로 미룬다 */
  hold?: boolean;
  /** 테스트용 시각 */
  now?: Date;
}

const pending: string[] = [];

/** 매 프레임 불러도 된다 — 5초에 한 번 판정 */
export function pumpTideFlow(scene: Phaser.Scene, opts: TideFlowPumpOpts = {}): void {
  const wall = Date.now();
  if (!opts.now && wall - lastPollMs < POLL_MS) { flush(scene, opts); return; }
  lastPollMs = wall;
  const st = tideFlowStateAt(opts.now ?? new Date());
  const skilled = hasTideSense();
  if (!skilled) { lastPhase = st.phase; introduced = false; flush(scene, opts); return; }
  if (!introduced) {
    introduced = true;
    pending.push(`[물때] 지금은 ${TIDE_FLOW_LABEL_KO[st.phase]}입니다 — ${TIDE_FLOW_NOTE_KO[st.phase]}`);
  } else if (lastPhase && st.phase !== lastPhase) {
    pending.push(`[물때] ${TIDE_FLOW_LABEL_KO[st.phase]}입니다 — ${TIDE_FLOW_NOTE_KO[st.phase]}`);
  }
  lastPhase = st.phase;
  if (st.minutesToPhaseEnd <= WARN_MIN && warnedPhase !== st.phase) {
    warnedPhase = st.phase;
    pending.push(`[물때] ${Math.max(1, st.minutesToPhaseEnd)}분 뒤 ${TIDE_FLOW_LABEL_KO[st.nextPhase]}`);
  }
  if (warnedPhase && warnedPhase !== st.phase && st.minutesToPhaseEnd > WARN_MIN) warnedPhase = null;
  flush(scene, opts);
}

function flush(scene: Phaser.Scene, opts: TideFlowPumpOpts): void {
  if (pending.length === 0 || opts.hold) return;
  let y = opts.toastY ?? 0;
  for (const line of pending.splice(0)) {
    channelLog(scene, line);
    if (opts.toastY !== undefined) { toast(scene, line, y); y += 30; }
  }
}

/**
 * 205차 — 물때 공략 발견 한 줄을 알림 대기열에 넣는다(스킬과 무관 — 겪어서 안 것).
 * 다음 펌프가 필드 채널 + (필드 밖이면) 화면 위로 띄운다.
 */
export function queueTideLoreNote(noteKo: string): void {
  pending.push(`[물때 기록] ${noteKo}`);
}

/** 지금 물때 이름(스킬이 있을 때만 — 1인칭 수심 정보 줄) */
export function tideSenseLabel(): string | null {
  if (!hasTideSense()) return null;
  return TIDE_FLOW_LABEL_KO[tideFlowStateAt().phase];
}

/** 새 게임 · 로드 때 상태를 비운다 */
export function resetTideFlowNotifier(): void {
  lastPollMs = 0; lastPhase = null; warnedPhase = null; introduced = false; pending.length = 0;
}
