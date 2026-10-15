/**
 * @file FarmActions.ts
 * @description 247차 — 텃밭 칸 하나의 작업 장면 열기(텃밭 창 · 필드 칸 공용)
 *
 * 사용자 「미니게임으로 구현된 부분은 해당 칸에서 상호작용 시 팝업」 — 텃밭 창의 할 일 단추와 필드에서 칸을 겨눈 [F]가
 * 같은 장면 · 같은 결과(`FarmStore.doCareGroup` · `finishProcess` · `pullSeedlings`)를 쓰도록 여기 한 벌만 둔다.
 *  - 관리 작업(지주 · 유인 · 곁순 · 약 …) — `openCareTask`
 *  - 거둔 뒤 밭 손질: 털기(꼬투리 따기 · 묶어 거두기) → 키가 있으면 키질 → 가방 — `openProcess`
 *  - 육묘 트레이 꺼내기 — `openTray`
 */

import Phaser from 'phaser';
import {
  cultivationOf, getCrop, startOf, PROCESS_WORK_DEFS, FLAIL_ID, WINNOW_ID,
  type CareStatus, type CareTaskDef, type CareTaskId, type CropDef,
} from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { FarmWorkPanel } from './FarmWorkPanel.js';
import { TrayPullPanel } from './TrayPullPanel.js';
import { FarmStore, careGroupSeconds, type FarmActionResult } from '../store/FarmStore.js';
import { playSfx, type SfxName } from '../audio/SfxBank.js';

/** 252차 — 돌봄 일을 마쳤을 때 소리(일 이름으로 고른다) */
function careSfx(task: string): SfxName {
  if (/spray|mist/.test(task)) return 'farm_spray';
  if (/water|flood/.test(task)) return 'farm_water';
  if (/weed|thin|sucker|prune|pinch|leaf|deadhead/.test(task)) return 'farm_weed';
  if (/top|fert|feed|compost|lime|acid|dress/.test(task)) return 'farm_fertilize';
  if (/dig|hill|till|ridge/.test(task)) return 'farm_till';
  return 'work_step';
}

export interface FarmActionHost {
  scene: Phaser.Scene;
  /** 하위 창을 씬의 팝업 스택에 올린다(없으면 직접 띄운다) */
  openPopup?: (build: (close: () => void) => DraggablePanel) => void;
  /** 작업 장면 왼쪽 위 */
  at: () => { x: number; y: number };
  /** 끝난 뒤 — 결과 한 줄 · 그림 갱신. `what` = 무엇을 했나(필드 연출이 고른다) */
  after: (r: FarmActionResult, what: FarmActionWhat) => void;
}

/** 필드 연출이 고르는 「무엇을 했나」 */
export type FarmActionWhat = { kind: 'care'; task: CareTaskId; cells: number[] } | { kind: 'process' } | { kind: 'tray' };

/** 작업 장면에 넘길 상태(거둔 뒤 손질 · 키질은 관리 표의 일이 아니라 그때만 여는 장면이다) */
export function sceneStatus(def: CareTaskDef): CareStatus {
  return { def, status: 'due', round: 0, total: 1, dueDay: 0, daysLeft: 0, done: 0, skipped: 0 };
}

/** 하위 창 하나를 올린다 */
export function openChild(host: FarmActionHost, build: (close: () => void) => DraggablePanel): void {
  if (host.openPopup) host.openPopup(build);
  else {
    let p: DraggablePanel | null = null;
    p = build(() => { p?.destroy(); p = null; });
    host.scene.add.existing(p);
  }
}

/** 작업 장면 하나(관리 작업 · 거둔 뒤 손질 · 키질 공용) — 이어지는 장면은 다음 프레임에(닫히는 창의 입력이 새 창에 새지 않게) */
export function openWorkScene(host: FarmActionHost, crop: CropDef, status: CareStatus,
  o: { plants?: number; cells?: number; seconds: number; uses?: string[]; onDone: (score: number) => void }): void {
  const at = host.at();
  const build = (close: () => void): DraggablePanel => new FarmWorkPanel(host.scene, at.x, at.y, {
    crop, status, plants: o.plants ?? 3, cells: o.cells, seconds: o.seconds, uses: o.uses,
    onDone: o.onDone, onClose: close,
  });
  host.scene.time.delayedCall(0, () => openChild(host, build));
}

/**
 * 관리 작업 장면을 연다 — `cells`가 있으면 그 칸들을 한 번에(텃밭 창 묶음), 없으면 이 칸만(필드).
 * 못 하면 까닭을 돌려준다(장면을 열지 않는다).
 */
export function openCareTask(host: FarmActionHost, plotId: string, idx: number, task: CareTaskId, cells?: number[]): string | null {
  const chk = FarmStore.careCheck(plotId, idx, task);
  if (!chk.ok || !chk.row) return chk.reasonKo ?? '지금 할 수 없다';
  const c = FarmStore.plot(plotId).cells[idx];
  const crop = c?.cropId ? getCrop(c.cropId) : undefined;
  if (!c || !crop) return '할 일이 없다';
  const st = startOf(crop, c.start);
  const plants = c.nursery ? 1 : Math.max(1, Math.min(4, st?.kind === 'seedling' ? st.perCell : 3));
  const group = cells ?? [idx];
  const row = chk.row;
  openWorkScene(host, crop, row.st, {
    plants, cells: group.length, seconds: careGroupSeconds(row.st.def.seconds, group.length),
    onDone: (score) => { playSfx(careSfx(task)); host.after(FarmStore.doCareGroup(plotId, group, task, score), { kind: 'care', task, cells: group }); },
  });
  return null;
}

/** 다 마른 칸: 털기(꼬투리 따기 · 묶어 거두기) 장면 → 키가 있으면 키질 장면 → 가방. 못 하면 까닭 */
export function openProcess(host: FarmActionHost, plotId: string, idx: number): string | null {
  const why = FarmStore.processBlock(plotId, idx);
  if (why) return why;
  const c = FarmStore.plot(plotId).cells[idx];
  const crop = getCrop(c.cropId!)!;
  const def = cultivationOf(crop).process!;
  const id = def.last === 'thresh' ? 'thresh' : def.last === 'pick' ? 'pick_pods' : 'gather_bundle';
  const work = PROCESS_WORK_DEFS[id];
  const flail = def.last === 'thresh' && FarmStore.hasItem(FLAIL_ID);
  openWorkScene(host, crop, sceneStatus(work), {
    seconds: flail ? Math.round(work.seconds * 0.6) : work.seconds, uses: flail ? ['도리깨'] : [],
    onDone: (score) => {
      if (def.winnow && FarmStore.hasItem(WINNOW_ID)) {
        openWorkScene(host, crop, sceneStatus(PROCESS_WORK_DEFS.winnow), {
          seconds: PROCESS_WORK_DEFS.winnow.seconds, uses: ['키'],
          onDone: (ws) => { playSfx('farm_harvest'); host.after(FarmStore.finishProcess(plotId, idx, score, ws), { kind: 'process' }); },
        });
      } else { playSfx('farm_harvest'); host.after(FarmStore.finishProcess(plotId, idx, score), { kind: 'process' }); }
    },
  });
  return null;
}

/** 육묘 트레이 꺼내기 창 — 꺼낼 때마다 `after`(가방 · 그림) · 닫히면 `onClosed` */
export function openTray(host: FarmActionHost, plotId: string, idx: number, onClosed?: () => void): void {
  const at = host.at();
  openChild(host, (close) => new TrayPullPanel(host.scene, at.x + 40, at.y + 40, {
    plotId, idx,
    onPulled: (r) => host.after(r, { kind: 'tray' }),
    onClose: () => { close(); onClosed?.(); },
  }));
}
