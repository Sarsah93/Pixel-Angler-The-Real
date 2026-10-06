/**
 * @file PrologueCoach.ts
 * @description 프롤로그 「떠나는 날 아침」 말풍선 코치 (191차 — 사용자 지시)
 *
 * 사용자 지시: 화면 위에 「지금 할 일 · 목표 · 방법」을 글자로 나열하지 말고(규칙 R11),
 * 처음부터 끝까지 **말풍선으로 이어서** 안내하라. 일지 펼치기 이후 단계도 계속.
 *
 * 동작:
 *  - 씬이 매 프레임 `update()`에 **지금 단계**(`CoachStage`)를 넘긴다. 단계는 상태(플래그·열린 창)로 판정한다.
 *  - 단계가 바뀌면 떠 있던 말풍선을 접고 새 단계의 말풍선을 연다(한 번에 하나 — `GuideTour` 하나뿐 규칙).
 *  - 다른 체험 가이드(가방·장비창·일지 첫 열기 등)가 떠 있거나 열릴 차례면 **끼어들지 않는다**(`GuideTour.busy`).
 *  - 코치 말풍선은 세상 안 체험(passive) — 화면을 어둡게 하지 않고 입력도 막지 않는다. 짚을 자리가 있으면 금색 테만.
 *  - 플래그를 남기지 않는다(`ephemeral`) — 단계는 늘 현재 상태로 다시 계산한다(세이브 왕복·재입장에도 이어진다).
 */

import Phaser from 'phaser';
import { GuideTour, maybeStartTour, type TourRect } from './GuideTour.js';

export interface CoachStage {
  /** 단계 키 — 같은 키면 같은 말풍선을 유지한다(문장이 바뀌면 키도 바꿀 것) */
  key: string;
  text: string;
  target?: () => TourRect | null | undefined;
  anchor?: () => TourRect | null | undefined;
  side?: 'left' | 'right' | 'auto';
  dockY?: number;
  /** 219차 — 이 단계에서 허용하는 세상 행동 id(`TourStep.focus`) — 없으면 막지 않는다 */
  focus?: string[];
}

export class PrologueCoach {
  private scene: Phaser.Scene;
  private shownKey: string | null = null;
  private tour: GuideTour | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // 씬이 멈추면(pause + launch로 하위 씬이 뜨면) 말풍선을 접는다 — 멈춘 씬의 update가 돌지 않아
    //   말풍선이 하위 씬 위에 남고, `GuideTour.active`를 쥔 채 하위 씬의 가이드를 막는다.
    const fold = (): void => this.destroy();
    scene.events.on('pause', fold);
    scene.events.on('sleep', fold);
    scene.events.once('shutdown', () => {
      scene.events.off('pause', fold);
      scene.events.off('sleep', fold);
      this.destroy();
    });
  }

  /**
   * @param stage 지금 보여 줄 단계 (없으면 null)
   * @param blocked 대화·혼잣말·메뉴처럼 말풍선이 끼면 안 되는 순간
   */
  update(stage: CoachStage | null, blocked: boolean): void {
    const act = GuideTour.active;
    // 요청은 다음 프레임에 열린다 — 열린 뒤 인스턴스를 잡는다
    if (!this.tour && this.shownKey && act?.opts.id === `coach_${this.shownKey}`) this.tour = act;
    // 내가 띄운 말풍선이 이미 사라졌으면(씬 전환·하네스 finish) 기록을 비운다
    if (this.tour && act !== this.tour) { this.tour = null; this.shownKey = null; }
    const want = blocked ? null : stage;
    if (!want || want.key !== this.shownKey) {
      if (this.tour) { this.tour.dismiss(); this.tour = null; }
      // 아직 열리지 않은 요청은 build가 null을 돌려 스스로 접힌다
      this.shownKey = null;
    }
    // 열리지 못한 요청(다른 가이드에 밀려 버려진 경우)은 다시 건다
    if (!this.tour && this.shownKey && !GuideTour.busy) this.shownKey = null;
    if (!want || this.shownKey || GuideTour.busy) return;
    const key = want.key;
    this.shownKey = key;
    maybeStartTour(this.scene, () => {
      if (this.shownKey !== key) return null;
      return {
        id: `coach_${key}`,
        ephemeral: true,
        anchor: want.anchor,
        alive: () => this.scene.sys.isActive() && this.shownKey === key,
        steps: [{
          text: want.text,
          passive: true,
          target: want.target,
          side: want.side,
          dockY: want.dockY,
          focus: want.focus,
          // 단계가 바뀌면 update()가 접는다 — 스스로는 끝나지 않는다
          wait: () => false,
        }],
      };
    });
  }

  /** 씬을 떠날 때 */
  destroy(): void {
    if (this.tour && GuideTour.active === this.tour) this.tour.dismiss();
    this.tour = null;
    this.shownKey = null;
  }
}
