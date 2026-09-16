/**
 * @file MultiplayerClient.ts
 * @description 싱글/멀티 접속 상태 보관 + 서버 통신 (143차 신설)
 *
 * 게임 전체에서 하나만 산다(`MultiplayerClient` 싱글턴). 씬은 이 객체에
 *  - 지금 어느 방식으로 노는지(`mode`)
 *  - 멀티라면 어느 세션에 어떤 이름으로 들어와 있는지
 * 를 묻고, 필드 씬은 `peers`(같은 세계의 다른 사람들)를 읽어 이름표를 띄운다.
 *
 * 통신은 서버 `/mp/*` REST. 위치는 1초 주기로 올리고 같은 응답으로 남의 위치를 받는다.
 * 서버가 없거나 응답이 없으면 **조용히 싱글로 계속 논다** — 접속이 끊겼다고 게임이 멈추지 않는다.
 */

import {
  MP_DEFAULT_SERVER, MP_PRESENCE_INTERVAL_MS,
  type GameMode, type MpPeer,
  type MpCreateSessionRes, type MpSessionInfoRes, type MpNameCheckRes, type MpJoinRes, type MpPresenceRes,
} from '@tra/core';

/** 로비 설정은 브라우저에 남긴다 — 다음에 켤 때 서버 주소를 다시 치지 않게 */
const STORAGE_KEY = 'pixelAngler_mp';

interface StoredMp { server: string; lastCode: string }

class MultiplayerClientImpl {
  mode: GameMode = 'single';
  server: string = MP_DEFAULT_SERVER;
  /** 들어와 있는 세션 코드 (멀티일 때만) */
  code = '';
  /** 서버가 발급한 내 id (이름 선점 성공 시) */
  playerId = '';
  /** 내 캐릭터 이름 */
  name = '';
  /** 같은 세션의 다른 사람들 — 매 폴링마다 갈린다 */
  peers: MpPeer[] = [];
  /** 마지막 통신이 실패했는가 (HUD 표시용) */
  offline = false;

  private timer: number | null = null;
  private pos = { regionId: '', x: 0, y: 0, facing: 'down' as MpPeer['facing'], moving: false };

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw) as Partial<StoredMp>;
        if (v.server) this.server = v.server;
      }
    } catch (_e) {/* 저장본이 깨졌으면 기본값 */}
  }

  get isMulti(): boolean { return this.mode === 'multi'; }
  /** 세션에 실제로 들어와 있는 상태 (이름 선점까지 끝남) */
  get isConnected(): boolean { return this.mode === 'multi' && this.code !== '' && this.playerId !== ''; }

  setServer(url: string): void {
    this.server = url.replace(/\/+$/, '');
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ server: this.server, lastCode: this.code } satisfies StoredMp));
    } catch (_e) {/* 저장 실패는 무시 */}
  }

  private async post<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const r = await fetch(`${this.server}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      this.offline = false;
      return (await r.json()) as T;
    } catch (_e) {
      this.offline = true;
      return null;
    }
  }

  private async get<T>(path: string): Promise<T | null> {
    try {
      const r = await fetch(`${this.server}${path}`);
      this.offline = false;
      return (await r.json()) as T;
    } catch (_e) {
      this.offline = true;
      return null;
    }
  }

  // ── 로비 ──────────────────────────────────────────
  async createSession(): Promise<MpCreateSessionRes> {
    const res = await this.post<MpCreateSessionRes>('/mp/session', {});
    if (!res?.ok || !res.code) return res ?? { ok: false, reasonKo: '서버에 연결할 수 없습니다.' };
    this.mode = 'multi';
    this.code = res.code;
    this.persist();
    return res;
  }

  async joinSession(code: string): Promise<MpSessionInfoRes> {
    const c = code.trim().toUpperCase();
    const res = await this.get<MpSessionInfoRes>(`/mp/session/${encodeURIComponent(c)}`);
    if (!res?.ok) return res ?? { ok: false, reasonKo: '서버에 연결할 수 없습니다.' };
    this.mode = 'multi';
    this.code = c;
    this.persist();
    return res;
  }

  async checkName(name: string): Promise<MpNameCheckRes> {
    const res = await this.post<MpNameCheckRes>(`/mp/session/${encodeURIComponent(this.code)}/name-check`, { name });
    return res ?? { ok: false, reasonKo: '서버에 연결할 수 없습니다.' };
  }

  /** 이름 선점 + 입장 */
  async claimName(name: string): Promise<MpJoinRes> {
    const res = await this.post<MpJoinRes>(`/mp/session/${encodeURIComponent(this.code)}/join`, { name });
    if (res?.ok && res.playerId) {
      this.playerId = res.playerId;
      this.name = name.trim();
    }
    return res ?? { ok: false, reasonKo: '서버에 연결할 수 없습니다.' };
  }

  // ── 위치 알림 ─────────────────────────────────────
  /** 필드 씬이 매 프레임 넣어주는 내 위치 (실제 전송은 주기 타이머가 한다) */
  reportPosition(regionId: string, x: number, y: number, facing: MpPeer['facing'], moving: boolean): void {
    this.pos = { regionId, x, y, facing, moving };
  }

  startPresence(): void {
    if (!this.isConnected || this.timer !== null) return;
    const tick = async (): Promise<void> => {
      const res = await this.post<MpPresenceRes>('/mp/presence', { code: this.code, playerId: this.playerId, ...this.pos });
      this.peers = res?.ok ? (res.peers ?? []) : [];
    };
    void tick();
    this.timer = window.setInterval(() => void tick(), MP_PRESENCE_INTERVAL_MS);
  }

  stopPresence(): void {
    if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
    this.peers = [];
  }

  /** 같은 지역에 있는 사람만 (이름표를 띄울 대상) */
  peersInRegion(regionId: string): MpPeer[] {
    return this.peers.filter((p) => p.regionId === regionId);
  }

  /** 싱글로 되돌리기 — 세션에서 나가고 폴링을 멈춘다 */
  leave(): void {
    if (this.isConnected) void this.post('/mp/leave', { code: this.code, playerId: this.playerId });
    this.stopPresence();
    this.mode = 'single';
    this.code = ''; this.playerId = ''; this.name = '';
  }
}

export const MultiplayerClient = new MultiplayerClientImpl();

// dev 검증 하네스용 노출 — 프로덕션 번들에서는 통째로 제거된다
if (import.meta.env.DEV) {
  (globalThis as unknown as { __MP?: unknown }).__MP = MultiplayerClient;
}
