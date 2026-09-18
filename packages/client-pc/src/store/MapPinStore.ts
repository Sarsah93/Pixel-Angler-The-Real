/**
 * @file MapPinStore.ts
 * @description 전체 지도 **핀** (155차 — 사용자 지시 "퀘스트 추적과 별개로 핀 설정/제거 후 이동 시 가이드").
 *
 * 지역마다 핀 하나. 세션 메모리(세이브 무관) — 씬을 옮겨도 남고, 게임을 껐다 켜면 사라진다.
 * 필드는 핀을 향해 청록 화살표를 띄우고 미니맵·전체 지도에 같은 핀을 찍는다.
 */

export interface MapPin { x: number; y: number }

class MapPinStoreManager {
  private pins = new Map<string, MapPin>();
  /** 핀 변경 훅 — 필드가 미니맵을 다시 그린다 */
  onChange: (() => void) | null = null;

  get(regionId: string): MapPin | null { return this.pins.get(regionId) ?? null; }
  set(regionId: string, x: number, y: number): void { this.pins.set(regionId, { x, y }); this.onChange?.(); }
  clear(regionId: string): void { if (this.pins.delete(regionId)) this.onChange?.(); }
}

export const MapPinStore = new MapPinStoreManager();
