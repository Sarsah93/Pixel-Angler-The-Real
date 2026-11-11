/**
 * DevGuideCaptures — dev 손질 유도선 [확정] 좌표 주고받기 (315차).
 *
 * 사용자 지시(2026-11-11): 「좌표값을 내가 일일이 복사 붙여넣기 해야하는데, 그렇지 않아도 확정시킬 수 있도록
 * 인게임 내에서 확정 버튼 같은 걸 누르고 … 너가 해당 로그나 기록을 실시간으로 읽어서 반영」.
 *  - [확정]은 dev 서버(`vite.config.ts` `devButcheryGuidePlugin`)에 POST — 서버가 `tools/f9_captures/`에 쓰고 core 표를 굽는다.
 *  - 이 판에서 다시 연 손질 창도 확정 좌표를 쓰도록 받아 둔 표(`devGuideOverrides`)를 core에 넘긴다(`guideOverrides`).
 *  - 배포본(정적 빌드)에는 dev 서버가 없다 — 이 파일은 dev에서만 돈다(`import.meta.env.DEV`).
 */
import type { ButcheryGuideOverride, ButcheryGuideOverrideTable } from '@tra/core';

/** dev 서버에서 받아 둔 확정 좌표(어종 · `@어종군` → 스테이지 → 좌표) — [확정]하면 바로 고친다 */
export const devGuideOverrides: ButcheryGuideOverrideTable = {};

const URL_PATH = '/__dev/butchery-guide';
let loading: Promise<void> | null = null;

/** dev 서버의 정본을 한 번 받아 둔다(게임을 켤 때 — 손질 창 모듈을 읽는 순간) */
export function loadDevGuideOverrides(): Promise<void> {
  if (!import.meta.env.DEV) return Promise.resolve();
  loading ??= fetch(URL_PATH)
    .then((r) => (r.ok ? r.json() as Promise<ButcheryGuideOverrideTable> : {}))
    .then((t: ButcheryGuideOverrideTable) => {
      for (const [k, v] of Object.entries(t ?? {})) devGuideOverrides[k] = { ...v, ...(devGuideOverrides[k] ?? {}) };
    })
    .catch(() => { /* dev 서버가 없는 판(미리보기 빌드) — 저장된 표만 쓴다 */ });
  return loading;
}

/** 확정 하나를 dev 서버에 보낸다 — 돌려받는 count = 정본의 확정 스테이지 수 */
export async function postDevGuideOverride(
  key: string, stageId: string, override: ButcheryGuideOverride, meta: Record<string, string>,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  (devGuideOverrides[key] ??= {})[stageId] = override;
  try {
    const r = await fetch(URL_PATH, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, stageId, override, meta }),
    });
    const j = await r.json() as { ok?: boolean; count?: number; error?: string };
    return { ok: !!j.ok, count: j.count, error: j.error };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
