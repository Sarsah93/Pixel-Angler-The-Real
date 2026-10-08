/**
 * @file ItemKeepGuard.ts
 * @description 「지금 잃으면 이야기가 막히는 물건인가」를 저장소들이 묻는 곳 (234차).
 *
 * 판정 본체는 `QuestItemGuard`가 채운다(진행 중인 퀘스트 · 프롤로그 단계를 본다).
 * 인벤토리 · 집 보관함 같은 낮은 층 저장소가 스토리 스토어를 직접 import하면 순환이 생기므로
 * 여기 함수 하나만 걸어 두고, 거래 · 보관 · 버리기 경로가 이것만 묻는다.
 */

type KeepFn = (itemId: string) => string | null;

let keep: KeepFn | null = null;

/** 판정 본체를 건다 (`QuestItemGuard`가 모듈을 읽을 때 한 번) */
export function setItemKeepGuard(fn: KeepFn | null): void { keep = fn; }

/** 잃으면 안 되는 물건이면 그 까닭(플레이어에게 보일 한 줄), 아니면 null */
export function itemKeepReason(itemId: string): string | null { return keep?.(itemId) ?? null; }
