/**
 * @file WeatherSync.ts
 * @description 세션 정본 날씨 맞추기 (234차) — 같은 세션이면 같은 시간대에 같은 하늘 · 같은 보일링.
 *
 * 필드 씬이 몇 초마다 `tick(지역)`을 부른다.
 * 1. **실황 갱신** — 기상청 · 해양기상 실황을 한 시간에 한 번 다시 받는다(싱글도. 구: 켤 때 한 번뿐).
 * 2. **정본 따르기** — 멀티면 공유 채널의 `w:<지역>|<슬롯>` 카드를 찾는다. 있으면 그것이 그 시간의 날씨다.
 * 3. **정본 올리기** — 아직 없고 내가 이번 시간 실황을 갖고 있으면 내 카드를 올린다(먼저 닿은 사람이 임자 —
 *    거의 동시에 올렸으면 서버가 돌려준 남의 카드를 따른다).
 * 4. **홈타운** — 실데이터가 없다. 세션 공용 시드 × 1시간 슬롯으로 굴리고, 머무는 동안 시간이 바뀌면 다시 굴린다
 *    (구: 들어올 때 한 번만 굴려 오래 머문 사람과 나중에 온 사람의 하늘이 갈렸다).
 *
 * 날씨가 바뀌면 `onChange(지역)` — 필드가 비 · 안개 연출과 보일링 스케줄을 다시 그린다.
 */

import {
  mpTimeSlot, mpWorldSeed, SESSION_WEATHER_SLOT_MS, sessionWeatherKey, encodeWeatherCard, decodeWeatherCard,
} from '@tra/core';
import { ExternalDataStore } from '../store/ExternalDataStore.js';
import { MultiplayerClient } from './MultiplayerClient.js';

class WeatherSyncImpl {
  /** 날씨가 바뀌었다(정본 도착 · 새 시간 실황 · 홈타운 재추첨) — 필드 씬이 세운다 */
  onChange: ((regionId: string) => void) | null = null;
  /** 홈타운 날씨를 마지막으로 굴린 슬롯 */
  private homeSlot = -1;
  /** 올리는 중인 키 · 이미 올린 키(같은 시간에 두 번 올리지 않게) */
  private pending = new Set<string>();
  private published = new Set<string>();

  /**
   * 필드에 들어올 때 — 연출을 그리기 **전에** 부른다. 이미 와 있는 정본이 있으면 바로 따르고,
   * 홈타운이면 지금 슬롯으로 굴린다. 여기서는 `onChange`를 부르지 않는다(아직 아무것도 그리지 않았다).
   */
  enter(regionId: string, now = Date.now()): void {
    if (regionId === 'hometown') {
      this.homeSlot = mpTimeSlot(now, SESSION_WEATHER_SLOT_MS);
      ExternalDataStore.rerollHometownWeather(this.homeSeed(now));
      return;
    }
    this.step(regionId, now, false);
  }

  /** 몇 초마다 — 바뀐 것이 있으면 `onChange` */
  tick(regionId: string, now = Date.now()): void {
    if (regionId === 'hometown') {
      const slot = mpTimeSlot(now, SESSION_WEATHER_SLOT_MS);
      if (slot === this.homeSlot) return;
      this.homeSlot = slot;
      ExternalDataStore.rerollHometownWeather(this.homeSeed(now));
      this.onChange?.(regionId);
      return;
    }
    this.step(regionId, now, true);
  }

  /** 홈타운 날씨 시드 — 145차 규칙 그대로(세션 공용 시드 × 1시간 슬롯) */
  private homeSeed(now: number): number {
    return mpWorldSeed(MultiplayerClient.worldSeed, 'weather', 'hometown', mpTimeSlot(now, SESSION_WEATHER_SLOT_MS));
  }

  private step(regionId: string, now: number, notify: boolean): void {
    const changed = (): void => { if (notify) this.onChange?.(regionId); };
    // 1) 실황은 한 시간에 한 번 — 정본이 없을 때만 내 실황 변화가 화면을 바꾼다
    void ExternalDataStore.refreshLiveWeather(now).then((diff) => {
      if (diff && !this.cardIn(regionId)) this.onChange?.(regionId);
    });
    // 멀티가 아니면 정본이 없다 — 남아 있던 카드는 걷는다(내 실황으로 돌아간다)
    if (!MultiplayerClient.isConnected) {
      this.pending.clear(); this.published.clear();
      if (ExternalDataStore.clearSessionWeather()) changed();
      return;
    }
    const slot = mpTimeSlot(now, SESSION_WEATHER_SLOT_MS);
    const key = sessionWeatherKey(regionId, slot);
    // 2) 이미 정본이 있으면 따른다(남이 올렸든 내가 올렸든)
    const theirs = decodeWeatherCard(MultiplayerClient.worldTakenInfo(key)?.val);
    if (theirs) {
      if (ExternalDataStore.setSessionWeather(regionId, slot, theirs)) changed();
      return;
    }
    // 3) 아직 없으면 — 이번 시간 실황을 가진 내가 올린다
    if (this.pending.has(key) || this.published.has(key)) return;
    const mine = ExternalDataStore.localWeatherCard(regionId, now);
    if (!mine) return;
    this.pending.add(key);
    // 다음 두 시간까지 남긴다 — 보일링 스케줄이 직전 슬롯까지 계산하고, 늦게 온 사람도 받아야 한다
    const ttlMs = (slot + 3) * SESSION_WEATHER_SLOT_MS - now;
    void MultiplayerClient.takeWorld(key, { ttlMs, val: encodeWeatherCard(mine) }).then((r) => {
      this.pending.delete(key);
      this.published.add(key);
      const card = decodeWeatherCard(r.val) ?? mine;
      if (ExternalDataStore.setSessionWeather(regionId, slot, card)) this.onChange?.(regionId);
    });
  }

  /** 지금 시간의 정본 카드가 있나 */
  private cardIn(regionId: string): boolean {
    return MultiplayerClient.isConnected
      && !!decodeWeatherCard(MultiplayerClient.worldTakenInfo(sessionWeatherKey(regionId, mpTimeSlot(Date.now(), SESSION_WEATHER_SLOT_MS)))?.val);
  }
}

export const WeatherSync = new WeatherSyncImpl();

// 홈타운 날씨는 시드만 알면 어느 슬롯이든 다시 계산된다 — 보일링 스케줄(직전 슬롯)도 같은 값을 쓰게
ExternalDataStore.hometownSeedFor = (slot) => mpWorldSeed(MultiplayerClient.worldSeed, 'weather', 'hometown', slot);
