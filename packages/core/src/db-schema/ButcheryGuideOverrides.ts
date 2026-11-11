/**
 * ButcheryGuideOverrides — dev F9 **[확정]**으로 저장한 손질 유도선 좌표 (315차).
 *
 * ⚠ 자동 생성 — 손으로 고치지 않는다. 원본은 `tools/f9_captures/captures.json`이고
 *   `node tools/apply_f9_captures.cjs`가 이 파일을 다시 쓴다(dev 서버의 [확정]도 저장 직후 같은 도구를 부른다).
 * 키 = 어종 id 또는 `@<어종군>` → 스테이지 id → 좌표. 스테이지를 다 지은 뒤 좌표만 바꿔 끼운다(`applyGuideOverrides`).
 */
import type { ButcheryGuideOverrideTable } from '../types/Butchery.js';

export const BUTCHERY_GUIDE_OVERRIDES: ButcheryGuideOverrideTable = {};
