/**
 * @file WorldDepletionStore.ts
 * @description 세계 자원 고갈 기록 (233차) — 채집 자리 · 과증식 개체가 **언제 다시 나타나는지**.
 *
 * - 채집: 잡은 자리(타일)는 1~2일(`TUNING.forage.depleteMinHours~MaxHours`) 동안 어떤 생물도 뜨지 않는다.
 *   놓치거나 숨어 버린 것은 그 시간 슬롯 끝까지만 사라진다.
 * - 과증식: 거둔 개체는 그 대발생 슬롯(6시간) 끝까지 다시 나오지 않는다.
 *
 * 키는 멀티 공유 채널(`MultiplayerClient.takeWorld`)과 같다 — 혼자 할 때는 이 기록만, 멀티에서는 서버 기록과 합쳐 본다.
 * **세이브에 남는다**(`GameState` SaveData `worldDepleted`) — 게임을 껐다 켜도 고갈은 이어진다.
 */

class WorldDepletionStoreImpl {
  private until = new Map<string, number>();

  /** 이 키가 지금 고갈 중인가 */
  isDepleted(key: string, now = Date.now()): boolean {
    const t = this.until.get(key);
    return t !== undefined && t > now;
  }

  /** 고갈 기록 — 이미 더 긴 기한이 있으면 그대로 둔다 */
  mark(key: string, untilMs: number): void {
    const cur = this.until.get(key) ?? 0;
    if (untilMs > cur) this.until.set(key, untilMs);
  }

  /** 세이브용 — 지난 기록은 버린다 */
  serialize(now = Date.now()): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, t] of this.until) if (t > now) out[k] = t;
    return out;
  }

  deserialize(rec: Record<string, number> | undefined): void {
    this.until.clear();
    const now = Date.now();
    for (const [k, t] of Object.entries(rec ?? {})) if (typeof t === 'number' && t > now) this.until.set(k, t);
  }

  reset(): void { this.until.clear(); }
}

export const WorldDepletionStore = new WorldDepletionStoreImpl();
