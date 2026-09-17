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
  type GameMode, type MpPeer, type MpActivity, type MpPlacedTrap, type MpChatLine, type MpResume,
  type MpProfile, type MpTradeState, type MpTradeItem,
  type MpCreateSessionRes, type MpSessionInfoRes, type MpNameCheckRes, type MpJoinRes, type MpPresenceRes,
} from '@tra/core';

/** 로비 설정은 브라우저에 남긴다 — 다음에 켤 때 서버 주소를 다시 치지 않게 */
const STORAGE_KEY = 'pixelAngler_mp';

interface StoredMp { server: string; lastCode: string; userId?: string; applied?: string[] }

/** 재접속 열쇠 — 이 브라우저(=이 사람)를 가리키는 고정 id. 한 번 만들면 바뀌지 않는다 */
function makeUserId(): string {
  return `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

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

  /** 재접속 열쇠 (145차) — 이어하기는 이름이 아니라 이 id로 알아본다 */
  userId = '';
  /**
   * 세션 공용 난수 시드 (145차). 싱글이면 0 — 그래도 맵·시간으로 결정적이라
   * 호출측은 분기 없이 `mpWorldSeed(MultiplayerClient.worldSeed, ...)`로 쓰면 된다.
   */
  worldSeed = 0;
  /** 세션에 깔려 있는 통발 전부 (내 것 포함 — 필드가 남의 것만 걸러 그린다) */
  traps: MpPlacedTrap[] = [];
  /** 아직 화면이 가져가지 않은 채팅 줄 */
  chatInbox: MpChatLine[] = [];
  /** 이어하기로 받은 이전 자리 — 필드 씬이 한 번 쓰고 비운다 */
  resume: MpResume | null = null;
  /** 내가 얽힌 거래 (146차) — 서버가 돌려준 진실. 없으면 거래 중이 아니다 */
  trade: MpTradeState | null = null;
  /** 이미 내 인벤토리에 적용한 확정 거래 id (146차 — 이중 적용 방지, localStorage 영속) */
  private appliedTrades = new Set<string>();
  /** 남에게 보이는 프로필 — 바뀔 때만 다시 올린다 */
  private profile?: MpProfile;
  private profileKey = '';
  private profileSent = true;

  private timer: number | null = null;
  private pos = {
    regionId: '', x: 0, y: 0, facing: 'down' as MpPeer['facing'], moving: false,
    activity: 'field' as MpActivity,
  };
  /** 내 외형 — 한 번 보내고 나면 서버가 들고 있으므로 다시 보내지 않는다 */
  private look: MpPeer['look'];
  private lookSent = false;
  /** 마지막으로 받은 채팅 줄 번호 */
  private chatSeq = 0;
  /** 다음 폴링에 실어 보낼 말 */
  private pendingSay = '';

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw) as Partial<StoredMp>;
        if (v.server) this.server = v.server;
        if (v.userId) this.userId = v.userId;
        if (v.applied) this.appliedTrades = new Set(v.applied);
      }
    } catch (_e) {/* 저장본이 깨졌으면 기본값 */}
    if (!this.userId) { this.userId = makeUserId(); this.persist(); }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        server: this.server, lastCode: this.code, userId: this.userId,
        applied: [...this.appliedTrades].slice(-50),
      } satisfies StoredMp));
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
    const res = await this.post<MpNameCheckRes>(
      `/mp/session/${encodeURIComponent(this.code)}/name-check`, { name, userId: this.userId });
    return res ?? { ok: false, reasonKo: '서버에 연결할 수 없습니다.' };
  }

  /**
   * 이름 선점 + 입장. 같은 `userId`로 전에 들어왔던 세션이면 **이어하기** —
   * 서버가 마지막 자리(`resume`)를 돌려주고 필드 씬이 거기서 시작한다.
   */
  async claimName(name: string, look?: MpPeer['look']): Promise<MpJoinRes> {
    const res = await this.post<MpJoinRes>(`/mp/session/${encodeURIComponent(this.code)}/join`, {
      name, userId: this.userId, look,
    });
    if (res?.ok && res.playerId) {
      this.playerId = res.playerId;
      this.name = name.trim();
      this.worldSeed = res.seed ?? 0;
      this.resume = res.resume ?? null;
      if (look) { this.look = look; this.lookSent = true; }
    }
    return res ?? { ok: false, reasonKo: '서버에 연결할 수 없습니다.' };
  }

  /** 내 외형을 갱신한다 (캐릭터 만들기 직후·장비 변경 시) — 다음 폴링에 한 번 실린다 */
  setLook(look: MpPeer['look']): void {
    this.look = look;
    this.lookSent = false;
  }

  /** 남에게 보이는 프로필 — 내용이 같으면 다시 올리지 않는다 (146차) */
  setProfile(p: MpProfile): void {
    const key = JSON.stringify(p);
    if (key === this.profileKey) return;
    this.profileKey = key;
    this.profile = p;
    this.profileSent = false;
  }

  // ── 위치 알림 ─────────────────────────────────────
  /** 필드 씬이 매 프레임 넣어주는 내 위치 (실제 전송은 주기 타이머가 한다) */
  reportPosition(
    regionId: string, x: number, y: number, facing: MpPeer['facing'], moving: boolean,
    activity: MpActivity = 'field',
  ): void {
    this.pos = { regionId, x, y, facing, moving, activity };
  }

  /** 씬을 떠날 때(1인칭·상점·실내) 활동만 갱신 — 좌표는 마지막 자리에 남는다 */
  setActivity(activity: MpActivity): void {
    this.pos.activity = activity;
  }

  startPresence(): void {
    if (!this.isConnected || this.timer !== null) return;
    const tick = async (): Promise<void> => {
      const say = this.pendingSay; this.pendingSay = '';
      // ⚠ "보냈다"는 **이 요청에 실은 객체**로 판정한다. 플래그만 보면 요청이 날아가는 사이에
      //   setLook/setProfile이 불려도 응답 시점에 "보냈다"로 찍혀 **영영 안 올라간다**(실측 — 씬 생성 중
      //   첫 틱의 응답이 늦게 처리되는 동안 setProfile이 먼저 돌았다).
      const sentLook = this.lookSent ? undefined : this.look;
      const sentProfile = this.profileSent ? undefined : this.profile;
      const res = await this.post<MpPresenceRes>('/mp/presence', {
        code: this.code, playerId: this.playerId, ...this.pos,
        ...(sentLook ? { look: sentLook } : {}),
        ...(sentProfile ? { profile: sentProfile } : {}),
        ...(say ? { say } : {}),
        chatSince: this.chatSeq,
      });
      if (!res?.ok) { this.peers = []; return; }
      if (sentLook && sentLook === this.look) this.lookSent = true;
      if (sentProfile && sentProfile === this.profile) this.profileSent = true;
      this.peers = res.peers ?? [];
      this.traps = res.traps ?? [];
      this.trade = res.trade ?? null;
      for (const line of res.chat ?? []) {
        if (line.seq <= this.chatSeq) continue;
        this.chatSeq = line.seq;
        this.chatInbox.push(line);
      }
    };
    void tick();
    this.timer = window.setInterval(() => void tick(), MP_PRESENCE_INTERVAL_MS);
  }

  stopPresence(): void {
    if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
    this.peers = [];
    this.traps = [];
  }

  // ── 채팅 ──────────────────────────────────────────
  /** 다음 폴링에 실어 보낸다 (별도 왕복 없음) */
  say(text: string): void {
    const t = text.trim();
    if (!t || !this.isConnected) return;
    this.pendingSay = t;
  }

  /** 받아둔 줄을 가져가고 비운다 — HUD가 매 프레임 훑는다 */
  drainChat(): MpChatLine[] {
    if (!this.chatInbox.length) return [];
    const out = this.chatInbox;
    this.chatInbox = [];
    return out;
  }

  // ── 유저 간 거래 (146차) ─────────────────────────────
  private tradePost(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; reasonKo?: string }> {
    if (!this.isConnected) return Promise.resolve({ ok: false, reasonKo: '멀티플레이 중이 아닙니다.' });
    return this.post<{ ok: boolean; reasonKo?: string }>(path, { code: this.code, playerId: this.playerId, ...body })
      .then((r) => r ?? { ok: false, reasonKo: '서버에 연결할 수 없습니다.' });
  }
  proposeTrade(targetPlayerId: string): Promise<{ ok: boolean; reasonKo?: string }> {
    return this.tradePost('/mp/trade/propose', { targetPlayerId });
  }
  respondTrade(tradeId: string, accept: boolean): Promise<{ ok: boolean; reasonKo?: string }> {
    return this.tradePost('/mp/trade/respond', { tradeId, accept });
  }
  setTradeOffer(tradeId: string, items: MpTradeItem[], coins: number): Promise<{ ok: boolean; reasonKo?: string }> {
    return this.tradePost('/mp/trade/offer', { tradeId, items, coins });
  }
  lockTrade(tradeId: string, confirm: boolean): Promise<{ ok: boolean; reasonKo?: string }> {
    return this.tradePost('/mp/trade/lock', { tradeId, confirm });
  }
  cancelTrade(tradeId: string): Promise<{ ok: boolean; reasonKo?: string }> {
    return this.tradePost('/mp/trade/cancel', { tradeId });
  }
  /** 확정 거래를 적용했다 — 같은 id를 두 번 적용하지 않도록 기억한다 */
  markTradeApplied(tradeId: string): void {
    this.appliedTrades.add(tradeId);
    this.persist();
    void this.tradePost('/mp/trade/applied', { tradeId });
  }
  hasAppliedTrade(tradeId: string): boolean { return this.appliedTrades.has(tradeId); }
  /** 이 거래에서 내 쪽 / 상대 쪽 */
  tradeSides(t: MpTradeState): { me: MpTradeState['from']; other: MpTradeState['from'] } {
    return t.from.userId === this.userId ? { me: t.from, other: t.to } : { me: t.to, other: t.from };
  }

  // ── 설치물 (통발) ─────────────────────────────────
  /** 통발을 놓았다고 알린다 — 실패해도 내 통발은 로컬에 남는다(싱글과 같은 상태) */
  async placeTrap(trap: Omit<MpPlacedTrap, 'ownerId' | 'ownerName'>): Promise<{ ok: boolean; reasonKo?: string }> {
    if (!this.isConnected) return { ok: true };
    const res = await this.post<{ ok: boolean; reasonKo?: string }>('/mp/trap/place', {
      code: this.code, playerId: this.playerId, trap,
    });
    return res ?? { ok: true };
  }

  /** 통발을 거뒀다고 알린다 */
  async removeTrap(instanceId: string): Promise<void> {
    if (!this.isConnected) return;
    await this.post('/mp/trap/remove', { code: this.code, playerId: this.playerId, instanceId });
  }

  /** 남이 놓은 통발만 (내 것은 내 세이브가 그린다) */
  peerTraps(mapKey: string): MpPlacedTrap[] {
    return this.traps.filter((t) => t.mapKey === mapKey && t.ownerId !== this.userId);
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
    this.worldSeed = 0; this.chatSeq = 0; this.chatInbox = []; this.resume = null;
    this.lookSent = false; this.trade = null; this.profileKey = ''; this.profileSent = true;
  }
}

export const MultiplayerClient = new MultiplayerClientImpl();

// dev 검증 하네스용 노출 — 프로덕션 번들에서는 통째로 제거된다
if (import.meta.env.DEV) {
  (globalThis as unknown as { __MP?: unknown }).__MP = MultiplayerClient;
}
