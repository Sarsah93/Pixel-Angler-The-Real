/**
 * 씬 전환 공용 안전망 — 페이드아웃 후 action 실행 (QA 검은 화면 전수조사 2026-08-05).
 *
 * `camerafadeoutcomplete` 단독 대기는 알려진 멈춤 경로가 있다:
 * 진입 fadeIn이 아직 진행 중일 때 fadeOut을 요청하면 Phaser FadeEffect가
 * (forceRestart=false라) **요청을 조용히 무시**해 완료 이벤트가 영영 오지 않는다
 * → 화면이 검게/그대로 멈춘다 (46차 RegionFieldScene · 52차 WorldMapScene ·
 * 71차 MainMenuScene에서 개별 수정해 온 패턴의 공용화).
 *
 * - 폴백 타이머(fadeMs + 150ms)로 이벤트 미발화 시에도 action 보장 실행.
 * - 호출 단위 + 씬 단위 이중 가드 — ESC 연타 등으로 같은 씬에서 전환이 두 번
 *   발동해 pause+launch가 이중 실행되는 것을 방지. 씬 가드는 action 실행 시점에
 *   해제되므로 (씬이 나중에 재사용될 때) 다음 전환은 정상 동작한다.
 *
 * 자체 상태(isTransitioning·charging 정리 등)가 필요한 대형 씬
 * (RegionFieldScene/WorldMapScene/MainMenuScene)은 각자의 fadeOutThen을 유지한다.
 */
import type Phaser from 'phaser';

/** 전환 진행 중인 씬 집합 — 같은 씬의 중복 전환 발동 차단 */
const inFlight = new WeakSet<Phaser.Scene>();

export function fadeOutThen(
  scene: Phaser.Scene,
  action: () => void,
  fadeMs = 240,
  rgb: [number, number, number] = [0, 10, 20],
): void {
  if (inFlight.has(scene)) return;
  inFlight.add(scene);
  let done = false;
  const run = (): void => {
    if (done) return;
    done = true;
    inFlight.delete(scene);
    action();
  };
  scene.cameras.main.once('camerafadeoutcomplete', run);
  scene.cameras.main.fadeOut(fadeMs, rgb[0], rgb[1], rgb[2]);
  scene.time.delayedCall(fadeMs + 150, run);   // 폴백 — 이벤트 미발화 방어
}
