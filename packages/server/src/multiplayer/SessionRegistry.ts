/**
 * @file SessionRegistry.ts
 * @description 멀티플레이 세션 보관소 (143차 신설 · 145차 세계 상태·영속 확장)
 *
 * 세션 = 한 세계. 호스트가 코드를 뽑아 열고, 같은 코드로 들어온 사람들이 맵을 공유한다.
 * **캐릭터 이름은 세션 안에서 유일**하다 — 이름을 먼저 선점(claim)해야 들어올 수 있다.
 *
 * ## 145차 — 세션이 들고 있는 것
 * - **공용 시드**: 보일링·과증식·차량·홈타운 날씨처럼 "함께 겪는" 무작위의 기준점.
 *   세션이 사는 동안 바뀌지 않으므로 클라이언트는 join 때 한 번 받아 두고 서버에 다시 묻지 않는다.
 * - **설치 통발**: 놓는 순간 남에게도 보여야 한다(같은 물 타일을 두 사람이 쓰기 때문).
 *   안에 무엇이 들었는지는 보관하지 않는다 — 포획물·분실 롤·조례 적발은 놓은 사람 클라이언트의 몫.
 * - **지역 채널 채팅**: 최근 `MP_CHAT_KEEP`줄만.
 *
 * ## 145차 — 영속(이어하기)
 * 사람을 **이름이 아니라 `userId`로** 알아본다. 게임을 껐다 켜도 같은 id로 들어오면
 * 마지막 자리와 이름을 돌려준다(`MpResume`). 세션은 `MP_SESSION_DIR`(기본 `.mp-sessions/`)에
 * 세션마다 JSON 한 장으로 남는다 — **호스트-클라이언트 P2P 전제**라 이 파일은 방을 연 사람의
 * PC에 있는 "세계 파일"이고, 각자의 캐릭터(퀘스트·인벤·돈)는 여전히 각자의 저장 슬롯에 있다.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import {
  SESSION_CODE_LEN, SESSION_CODE_ALPHABET, MP_PRESENCE_TIMEOUT_MS,
  MP_CHAT_KEEP, MP_CHAT_MAX_LEN, MP_TAKEN_KEEP, MP_TAKEN_TTL_MAX_MS, MP_TAKEN_TTL_MIN_MS, MP_TAKEN_KEY_MAX,
  MP_TRADE_PROPOSE_TIMEOUT_MS, MP_TRADE_RANGE_PX, MP_TRADE_MAX_ITEMS, MP_TRADE_REASON_KO,
  characterNameKey, validateCharacterName, isFieldActive,
  type MpPeer, type MpActivity, type MpPlacedTrap, type MpChatLine,
  type MpSavedSession, type MpResume,
  type MpTradeState, type MpTradeOffer, type MpTradeItem, type MpProfile, type MpRetireRes, type MpTakenLine,
} from '@tra/core';

interface SessionPlayer extends MpPeer {
  /** 재접속 열쇠 — 게임을 껐다 켜도 이 id로 같은 자리에 돌아온다 */
  userId: string;
  nameKey: string;
  lastSeenMs: number;
  /** 접속이 끊긴 뒤에도 자리를 기억해 두는가 (이어하기용 껍데기) */
  offline: boolean;
  /** 남에게 보이는 프로필 (146차) */
  profile?: MpProfile;
  /**
   * 접속 비밀값 (232차) — join 때 발급, 변경 요청마다 대조한다. 디스크에 남기지 않는다
   * (서버를 다시 켜면 모두 다시 join한다 — 되살린 자리는 `offline`이라 어차피 join이 깨운다).
   */
  token: string;
}

interface Session {
  code: string;
  seed: number;
  createdMs: number;
  players: Map<string, SessionPlayer>;
  traps: MpPlacedTrap[];
  chat: MpChatLine[];
  chatSeq: number;
  /**
   * 거래 (146차). committed는 **양쪽이 applied할 때까지** 남는다 — 한쪽이 적용 전에 튕겨도
   * 이어하기로 돌아오면 서버가 다시 내려주므로 "준 것만 사라지는" 일이 없다.
   */
  trades: MpTradeState[];
  /**
   * 공유 세계 자원 소비 기록 (232차 — 채집 자리 · 과증식 개체). 메모리에만 둔다 — 시간 슬롯 키라
   * 서버를 다시 켜면 길어야 한 슬롯 동안 「이미 가져간 것」이 다시 보일 뿐이다.
   */
  taken: (MpTakenLine & { owner: string })[];
  takenSeq: number;
  /** 마지막으로 디스크에 쓴 시각 — 잦은 쓰기를 막는다 */
  savedMs: number;
  dirty: boolean;
}

/** 아무도 없는 세션을 얼마나 붙들고 있을지 (호스트가 잠깐 나갔다 와도 코드가 살아 있게) */
const EMPTY_SESSION_TTL_MS = 10 * 60_000;
/** 접속이 끊긴 사람의 자리를 얼마나 기억할지 — 이 뒤에 오면 새로 시작한다 */
const OFFLINE_KEEP_MS = 7 * 24 * 3_600_000;
/** 디스크 쓰기 최소 간격 */
const SAVE_THROTTLE_MS = 5_000;

const SESSION_DIR = process.env.MP_SESSION_DIR ?? '.mp-sessions';

/** 232차 — 접속 비밀값 (추측 불가 128비트) */
function newToken(): string { return randomBytes(16).toString('hex'); }

export class SessionRegistry {
  private sessions = new Map<string, Session>();
  private seq = 0;

  constructor() {
    this.loadAll();
  }

  // ═══════════════════════════════════════════════════
  // 세션 열기 · 조회
  // ═══════════════════════════════════════════════════

  private newCode(): string {
    for (let attempt = 0; attempt < 64; attempt++) {
      let c = '';
      for (let i = 0; i < SESSION_CODE_LEN; i++) {
        c += SESSION_CODE_ALPHABET[Math.floor(Math.random() * SESSION_CODE_ALPHABET.length)];
      }
      if (!this.sessions.has(c)) return c;
    }
    // 극히 드문 충돌 연속 — 순번을 붙여 반드시 유일하게
    return `${SESSION_CODE_ALPHABET[0]}${(this.seq++).toString(36).toUpperCase().padStart(SESSION_CODE_LEN - 1, '0')}`;
  }

  create(): string {
    this.sweep();
    const code = this.newCode();
    this.sessions.set(code, {
      code, seed: (Math.random() * 0xffffffff) >>> 0, createdMs: Date.now(),
      players: new Map(), traps: [], chat: [], chatSeq: 0, trades: [], taken: [], takenSeq: 0, savedMs: 0, dirty: true,
    });
    this.save(code);
    return code;
  }

  get(code: string): Session | undefined {
    this.sweep();
    return this.sessions.get(code.toUpperCase());
  }

  /** 이름이 이미 쓰이는지 — 형식 오류도 여기서 함께 걸러 클라이언트가 한 번만 물어도 되게 한다 */
  checkName(code: string, name: string, userId?: string): { ok: boolean; duplicate?: boolean; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const v = validateCharacterName(name);
    if (!v.ok) return { ok: false, reasonKo: v.reasonKo };
    const key = characterNameKey(name);
    for (const p of s.players.values()) {
      // 내가 전에 쓰던 이름이면 중복이 아니다 (이어하기)
      if (p.nameKey === key && p.userId !== userId) return { ok: false, duplicate: true };
    }
    return { ok: true };
  }

  /**
   * 이름 선점 + 입장. `userId`가 이미 이 세션에 있었다면 **이어하기** —
   * 같은 자리·같은 이름으로 되살리고 `resume`을 돌려준다.
   */
  join(code: string, name: string, userId: string, look?: MpPeer['look']): {
    ok: boolean; playerId?: string; duplicate?: boolean; seed?: number; resume?: MpResume; token?: string; reasonKo?: string;
  } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };

    const prior = userId ? [...s.players.values()].find((p) => p.userId === userId) : undefined;
    const chk = this.checkName(code, name, userId);
    if (!chk.ok) return { ok: false, duplicate: chk.duplicate, reasonKo: chk.reasonKo };

    if (prior) {
      // 이어하기 — 자리는 그대로 두고 접속만 되살린다
      s.players.delete(prior.playerId);
      const playerId = this.newPlayerId();
      const revived: SessionPlayer = {
        ...prior, playerId, name: name.trim(), nameKey: characterNameKey(name),
        look: look ?? prior.look, lastSeenMs: Date.now(), offline: false, token: newToken(),
      };
      s.players.set(playerId, revived);
      s.dirty = true; this.save(code);
      const resume = prior.regionId
        ? { regionId: prior.regionId, x: prior.x, y: prior.y }
        : undefined;
      return { ok: true, playerId, seed: s.seed, resume, token: revived.token };
    }

    const playerId = this.newPlayerId();
    const token = newToken();
    s.players.set(playerId, {
      playerId, userId: userId || playerId, name: name.trim(), nameKey: characterNameKey(name),
      regionId: '', x: 0, y: 0, facing: 'down', moving: false, activity: 'field', look,
      lastSeenMs: Date.now(), offline: false, token,
    });
    s.dirty = true; this.save(code);
    return { ok: true, playerId, seed: s.seed, token };
  }

  /**
   * 232차 — 본인 확인. `playerId`는 공개 id(이름표 · 거래 대상)라 **비밀값까지 맞아야** 그 사람이다.
   * 틀리면 「없는 사람」과 같은 응답을 준다(어느 쪽이 틀렸는지 알려 주지 않는다).
   */
  private authed(s: Session, playerId: string, token: string | undefined): SessionPlayer | undefined {
    const p = s.players.get(playerId);
    return p && token && p.token === token ? p : undefined;
  }

  private newPlayerId(): string {
    return `p${Date.now().toString(36)}${(this.seq++).toString(36)}`;
  }

  // ═══════════════════════════════════════════════════
  // 위치 알림 (+ 통발 · 채팅 편승)
  // ═══════════════════════════════════════════════════

  presence(
    code: string, playerId: string, token: string | undefined,
    pos: {
      regionId: string; x: number; y: number; facing: MpPeer['facing'];
      moving: boolean; activity?: MpActivity; look?: MpPeer['look']; profile?: MpProfile;
    },
    opts?: { say?: string; chatSince?: number; takenSince?: number },
  ): {
    ok: boolean; peers?: MpPeer[]; traps?: MpPlacedTrap[]; chat?: MpChatLine[];
    trade?: MpTradeState; taken?: MpTakenLine[]; reasonKo?: string;
  } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = this.authed(s, playerId, token);
    if (!me) return { ok: false, reasonKo: '세션에서 나간 상태입니다. 다시 접속하세요.' };
    me.regionId = pos.regionId;
    me.x = pos.x; me.y = pos.y;
    me.facing = pos.facing; me.moving = pos.moving;
    me.activity = pos.activity ?? 'field';
    if (pos.look) me.look = pos.look;
    if (pos.profile) me.profile = pos.profile;
    me.lastSeenMs = Date.now();
    me.offline = false;

    if (opts?.say) this.say(s, me, opts.say);
    this.sweepTrades(s);

    const peers: MpPeer[] = [];
    for (const p of s.players.values()) {
      if (p.playerId === playerId || p.offline) continue;
      peers.push({
        playerId: p.playerId, name: p.name, regionId: p.regionId,
        x: p.x, y: p.y, facing: p.facing, moving: p.moving,
        activity: p.activity, look: p.look, profile: p.profile,
        trading: this.activeTradeOf(s, p.userId) !== undefined,
      });
    }
    const since = opts?.chatSince ?? -1;
    const chat = since < 0 ? [] : s.chat.filter((l) => l.seq > since);
    s.dirty = true;
    this.save(code);
    // 232차 — 남의 userId(재접속 열쇠)는 내려보내지 않는다 — 그걸로 남의 자리를 이어받을 수 있었다
    const traps = s.traps.map((t) => (t.ownerId === me.userId ? t : { ...t, ownerId: '' }));
    const ts = opts?.takenSince ?? -1;
    this.pruneTaken(s);
    // 233차 — 기한 · 잠금 · 이름을 실어 보낸다. 주인(userId)은 내보내지 않는다(재접속 열쇠)
    const taken = ts < 0 ? [] : s.taken.filter((l) => l.seq > ts).map(({ seq, key, untilMs, busy, by }) => ({ seq, key, untilMs, busy, by }));
    return { ok: true, peers, traps, chat, trade: this.maskTrade(this.tradeFor(s, me.userId), me.userId), taken };
  }

  /** 232차 — 거래 상태에서 상대의 userId를 지운다(내 쪽 판별에는 내 id만 있으면 된다) */
  private maskTrade(t: MpTradeState | undefined, myUserId: string): MpTradeState | undefined {
    if (!t) return t;
    const mask = (side: MpTradeState['from']): MpTradeState['from'] => (side.userId === myUserId ? side : { ...side, userId: '' });
    return { ...t, from: mask(t.from), to: mask(t.to) };
  }

  private say(s: Session, me: SessionPlayer, textRaw: string): void {
    // 232차 — 줄바꿈 · 제어 문자를 지운다(「이름: 말」 줄 뒤에 가짜 「[단속] …」 줄을 끼워 넣지 못하게)
    // eslint-disable-next-line no-control-regex
    const text = textRaw.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').trim().slice(0, MP_CHAT_MAX_LEN);
    if (!text) return;
    s.chat.push({ seq: ++s.chatSeq, playerId: me.playerId, name: me.name, text, atMs: Date.now() });
    if (s.chat.length > MP_CHAT_KEEP) s.chat.splice(0, s.chat.length - MP_CHAT_KEEP);
  }

  /** 접속 종료 — 자리는 남겨 둔다(이어하기). 완전 삭제는 `sweep`이 기한으로 한다 */
  leave(code: string, playerId: string, token: string | undefined): void {
    const s = this.sessions.get(code.toUpperCase());
    const p = s ? this.authed(s, playerId, token) : undefined;
    if (!s || !p) return;
    p.offline = true;
    p.lastSeenMs = Date.now();
    s.dirty = true;
    this.save(code, true);
  }

  /**
   * 231차 — 캐릭터 소멸(파산). `leave`와 달리 **자리를 남기지 않는다**:
   * - 이름 선점을 바로 푼다(7일 잠금 없이 — 그 캐릭터는 다시 돌아오지 않는다).
   * - 그 사람이 놓은 통발을 세계에서 걷는다(주인이 없는 통발은 아무도 못 거둔다).
   * - 제안·편집 중 거래는 `gone`으로 취소한다. 이미 도장 찍힌 거래는 **소멸한 쪽만 적용 완료로**
   *   돌린다 — 상대는 받을 것을 그대로 받는다(줄 사람의 인벤토리는 이미 사라졌으니 차감할 것도 없다).
   * 같은 userId로 다시 들어오면 이어하기가 아니라 **새 사람**이다.
   */
  retire(code: string, who: { playerId?: string; token?: string; userId?: string }): MpRetireRes {
    const s = this.sessions.get(code.toUpperCase());
    // 접속 중이면 playerId + 비밀값, 파산 때 서버가 꺼져 있어 나중에 다시 보내는 경우엔 userId(재접속 열쇠 — 본인만 안다)로 찾는다
    const p = s && ((who.playerId ? this.authed(s, who.playerId, who.token) : undefined)
      ?? (who.userId ? this.playerByUser(s, who.userId) : undefined));
    if (!s || !p) return { ok: true, removedTraps: 0 };
    const before = s.traps.length;
    s.traps = s.traps.filter((t) => t.ownerId !== p.userId);
    for (const t of s.trades) {
      const mine = this.sideOf(t, p.userId);
      if (!mine) continue;
      if (t.phase === 'proposed' || t.phase === 'open') this.cancelTrade(t, MP_TRADE_REASON_KO.gone);
      else if (t.phase === 'committed') { mine.offer.applied = true; t.updatedMs = Date.now(); }
    }
    s.players.delete(p.playerId);
    this.sweepTrades(s);
    s.dirty = true;
    this.save(code, true);
    return { ok: true, removedTraps: before - s.traps.length };
  }

  // ═══════════════════════════════════════════════════
  // 유저 간 거래 (146차) — 공증 상태 머신
  //   제안 → (수락) 편집 → 양쪽 잠금 → 양쪽 확정 → committed(도장) → 각자 적용 → applied
  //   서버는 인벤토리를 모른다(각자 로컬). 도장 찍힌 기록을 양쪽이 적용할 때까지 들고 있는 것이 전부다.
  // ═══════════════════════════════════════════════════

  private emptyOffer(): MpTradeOffer {
    return { items: [], coins: 0, locked: false, confirmed: false, applied: false };
  }

  /** 아직 살아 있는(제안·편집·미적용 확정) 거래 */
  private activeTradeOf(s: Session, userId: string): MpTradeState | undefined {
    return s.trades.find((t) =>
      (t.from.userId === userId || t.to.userId === userId)
      && (t.phase === 'proposed' || t.phase === 'open'
        || (t.phase === 'committed' && !this.sideOf(t, userId)!.offer.applied)));
  }

  /** 내 화면에 보여 줄 거래 — 살아 있는 것, 없으면 방금 끝난 것(취소 사유 전달용) */
  private tradeFor(s: Session, userId: string): MpTradeState | undefined {
    const live = this.activeTradeOf(s, userId);
    if (live) return live;
    // 취소된 지 10초 안이면 한 번 더 보여 준다 — 클라이언트가 사유를 띄우고 닫게
    return s.trades.find((t) =>
      (t.from.userId === userId || t.to.userId === userId)
      && t.phase === 'cancelled' && Date.now() - t.updatedMs < 10_000);
  }

  private sideOf(t: MpTradeState, userId: string): MpTradeState['from'] | undefined {
    return t.from.userId === userId ? t.from : t.to.userId === userId ? t.to : undefined;
  }
  private otherOf(t: MpTradeState, userId: string): MpTradeState['from'] | undefined {
    return t.from.userId === userId ? t.to : t.to.userId === userId ? t.from : undefined;
  }

  private cancelTrade(t: MpTradeState, reasonKo: string): void {
    t.phase = 'cancelled';
    t.reasonKo = reasonKo;
    t.updatedMs = Date.now();
  }

  /** 시간 초과·이탈 정리 + 끝난 기록 버리기 */
  private sweepTrades(s: Session): void {
    const now = Date.now();
    for (const t of s.trades) {
      if (t.phase === 'proposed' && now - t.createdMs > MP_TRADE_PROPOSE_TIMEOUT_MS) {
        this.cancelTrade(t, MP_TRADE_REASON_KO.timeout);
      } else if (t.phase === 'open') {
        const a = this.playerByUser(s, t.from.userId), b = this.playerByUser(s, t.to.userId);
        if (!a || !b || a.offline || b.offline) this.cancelTrade(t, MP_TRADE_REASON_KO.gone);
      }
    }
    s.trades = s.trades.filter((t) => {
      if (t.phase === 'cancelled') return now - t.updatedMs < 60_000;
      if (t.phase === 'committed' && t.from.offer.applied && t.to.offer.applied) return false;
      if (t.phase === 'committed') return now - t.updatedMs < 7 * 24 * 3_600_000;
      return true;
    });
  }

  private playerByUser(s: Session, userId: string): SessionPlayer | undefined {
    return [...s.players.values()].find((p) => p.userId === userId);
  }

  private tradeCtx(code: string, playerId: string, token: string | undefined):
  { ok: true; s: Session; me: SessionPlayer } | { ok: false; reasonKo: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = this.authed(s, playerId, token);
    if (!me) return { ok: false, reasonKo: '세션에서 나간 상태입니다.' };
    this.sweepTrades(s);
    return { ok: true, s, me };
  }

  /** 거래 제안 — 둘 다 필드에 있고, 둘 다 거래 중이 아니고, 한 칸 안일 때만 */
  proposeTrade(code: string, playerId: string, token: string | undefined, targetPlayerId: string): { ok: boolean; reasonKo?: string } {
    const c = this.tradeCtx(code, playerId, token);
    if (!c.ok) return c;
    const { s, me } = c;
    const target = s.players.get(targetPlayerId);
    if (!target || target.offline) return { ok: false, reasonKo: MP_TRADE_REASON_KO.gone };
    if (this.activeTradeOf(s, me.userId)) return { ok: false, reasonKo: MP_TRADE_REASON_KO.meTrading };
    if (this.activeTradeOf(s, target.userId)) return { ok: false, reasonKo: MP_TRADE_REASON_KO.trading };
    if (!isFieldActive(target.activity) || !isFieldActive(me.activity)) return { ok: false, reasonKo: MP_TRADE_REASON_KO.busy };
    if (target.regionId !== me.regionId
      || Math.hypot(target.x - me.x, target.y - me.y) > MP_TRADE_RANGE_PX) {
      return { ok: false, reasonKo: MP_TRADE_REASON_KO.far };
    }
    const now = Date.now();
    s.trades.push({
      tradeId: `t${now.toString(36)}${(this.seq++).toString(36)}`, phase: 'proposed',
      from: { userId: me.userId, playerId: me.playerId, name: me.name, offer: this.emptyOffer() },
      to: { userId: target.userId, playerId: target.playerId, name: target.name, offer: this.emptyOffer() },
      createdMs: now, updatedMs: now,
    });
    s.dirty = true; this.save(code, true);
    return { ok: true };
  }

  /** 받은 쪽의 응답 */
  respondTrade(code: string, playerId: string, token: string | undefined, tradeId: string, accept: boolean): { ok: boolean; reasonKo?: string } {
    const c = this.tradeCtx(code, playerId, token);
    if (!c.ok) return c;
    const t = c.s.trades.find((x) => x.tradeId === tradeId);
    if (!t || t.phase !== 'proposed') return { ok: false, reasonKo: MP_TRADE_REASON_KO.cancelled };
    if (t.to.userId !== c.me.userId) return { ok: false, reasonKo: '내게 온 요청이 아닙니다.' };
    if (accept) { t.phase = 'open'; t.updatedMs = Date.now(); }
    else this.cancelTrade(t, MP_TRADE_REASON_KO.declined);
    c.s.dirty = true; this.save(code, true);
    return { ok: true };
  }

  /** 내 제안 갱신 — 고치면 **양쪽 잠금이 풀린다**(상대가 본 것과 다른 것에 동의하는 일이 없게) */
  setTradeOffer(
    code: string, playerId: string, token: string | undefined, tradeId: string, items: MpTradeItem[], coins: number,
  ): { ok: boolean; reasonKo?: string } {
    const c = this.tradeCtx(code, playerId, token);
    if (!c.ok) return c;
    const t = c.s.trades.find((x) => x.tradeId === tradeId);
    if (!t || t.phase !== 'open') return { ok: false, reasonKo: MP_TRADE_REASON_KO.cancelled };
    const mine = this.sideOf(t, c.me.userId);
    if (!mine) return { ok: false, reasonKo: '내 거래가 아닙니다.' };
    if (items.length > MP_TRADE_MAX_ITEMS) return { ok: false, reasonKo: `아이템은 ${MP_TRADE_MAX_ITEMS}줄까지입니다.` };
    mine.offer.items = items;
    mine.offer.coins = Math.max(0, Math.floor(coins));
    t.from.offer.locked = t.to.offer.locked = false;
    t.from.offer.confirmed = t.to.offer.confirmed = false;
    t.updatedMs = Date.now();
    c.s.dirty = true; this.save(code, true);
    return { ok: true };
  }

  /** 잠금(1단계) → 양쪽 잠금 뒤 확정(2단계) → 양쪽 확정이면 committed */
  lockTrade(code: string, playerId: string, token: string | undefined, tradeId: string, confirm: boolean): { ok: boolean; reasonKo?: string } {
    const c = this.tradeCtx(code, playerId, token);
    if (!c.ok) return c;
    const t = c.s.trades.find((x) => x.tradeId === tradeId);
    if (!t || t.phase !== 'open') return { ok: false, reasonKo: MP_TRADE_REASON_KO.cancelled };
    const mine = this.sideOf(t, c.me.userId);
    const other = this.otherOf(t, c.me.userId);
    if (!mine || !other) return { ok: false, reasonKo: '내 거래가 아닙니다.' };
    if (!confirm) mine.offer.locked = true;
    else {
      if (!mine.offer.locked || !other.offer.locked) return { ok: false, reasonKo: '양쪽이 먼저 잠가야 합니다.' };
      mine.offer.confirmed = true;
      if (other.offer.confirmed) t.phase = 'committed';
    }
    t.updatedMs = Date.now();
    c.s.dirty = true; this.save(code, true);
    return { ok: true };
  }

  cancelTradeReq(code: string, playerId: string, token: string | undefined, tradeId: string): { ok: boolean; reasonKo?: string } {
    const c = this.tradeCtx(code, playerId, token);
    if (!c.ok) return c;
    const t = c.s.trades.find((x) => x.tradeId === tradeId);
    if (!t) return { ok: true };
    if (t.phase === 'committed') return { ok: false, reasonKo: '이미 성사된 거래는 취소할 수 없습니다.' };
    if (t.phase !== 'cancelled') this.cancelTrade(t, MP_TRADE_REASON_KO.cancelled);
    c.s.dirty = true; this.save(code, true);
    return { ok: true };
  }

  /** 확정 거래를 내 인벤토리에 적용했다 — 양쪽 다 적용하면 기록이 사라진다 */
  tradeApplied(code: string, playerId: string, token: string | undefined, tradeId: string): { ok: boolean } {
    const c = this.tradeCtx(code, playerId, token);
    if (!c.ok) return { ok: false };
    const t = c.s.trades.find((x) => x.tradeId === tradeId);
    const mine = t && t.phase === 'committed' ? this.sideOf(t, c.me.userId) : undefined;
    if (mine) { mine.offer.applied = true; t!.updatedMs = Date.now(); this.sweepTrades(c.s); c.s.dirty = true; this.save(code, true); }
    return { ok: true };
  }

  // ═══════════════════════════════════════════════════
  // 공유 세계 자원 소비 (232차) — 채집 자리 · 과증식 개체
  // ═══════════════════════════════════════════════════

  /**
   * 누군가 가져갔다(또는 채집 중이다)고 알린다. **먼저 알린 사람이 임자** — 살아 있는 남의 키면 `already`로 답해
   * 거의 동시에 둘이 잡은 경우 늦은 쪽이 「다른 사람이 먼저 …」를 띄울 수 있게 한다.
   * 233차 — 같은 사람은 자기 키를 **고쳐 쓸 수 있다**(채집 중 잠금 → 잡음 1~2일 / 놓침 슬롯 끝). 고치면 새 번호가 붙어
   * 다른 사람에게 다시 내려간다. `release`면 자기 잠금을 지운다(놀이를 열지 못한 경우).
   */
  takeWorld(
    code: string, playerId: string, token: string | undefined, key: string,
    opts: { ttlMs?: number; busy?: boolean; release?: boolean } = {},
  ): { ok: boolean; already?: boolean; busy?: boolean; by?: string; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = this.authed(s, playerId, token);
    if (!me) return { ok: false, reasonKo: '세션에서 나간 상태입니다.' };
    const k = String(key ?? '').slice(0, MP_TAKEN_KEY_MAX);
    if (!k) return { ok: false, reasonKo: '요청이 올바르지 않습니다.' };
    this.pruneTaken(s);
    const now = Date.now();
    const cur = s.taken.find((l) => l.key === k);
    // 기한이 지난 줄(풀린 잠금 · 다시 찬 자리)은 막지 않는다
    if (cur && cur.untilMs > now && cur.owner !== me.userId) return { ok: false, already: true, busy: !!cur.busy, by: cur.by };
    if (opts.release) {
      if (!cur) return { ok: true };
      // 지운 것도 알려야 남의 화면에서 잠금이 풀린다 — 기한을 지금으로 고친 줄을 새 번호로 남긴다
      s.taken = s.taken.filter((l) => l !== cur);
      s.taken.push({ seq: ++s.takenSeq, key: k, untilMs: now, owner: me.userId });
      s.dirty = true;
      return { ok: true };
    }
    const ttl = Math.max(MP_TAKEN_TTL_MIN_MS, Math.min(MP_TAKEN_TTL_MAX_MS, Math.floor(opts.ttlMs ?? 3_600_000)));
    if (cur) s.taken = s.taken.filter((l) => l !== cur);
    s.taken.push({ seq: ++s.takenSeq, key: k, untilMs: now + ttl, busy: !!opts.busy, by: me.name, owner: me.userId });
    if (s.taken.length > MP_TAKEN_KEEP) s.taken.splice(0, s.taken.length - MP_TAKEN_KEEP);
    s.dirty = true;
    if (!opts.busy) this.save(code);   // 잠금은 잦다 — 진짜 소비만 디스크로
    return { ok: true };
  }

  /** 기한이 지난 소비 기록 정리 (지운 줄도 1분은 남겨 남이 「풀렸다」를 받게 한다) */
  private pruneTaken(s: Session): void {
    const now = Date.now();
    const before = s.taken.length;
    s.taken = s.taken.filter((l) => l.untilMs > now - 60_000);
    if (s.taken.length !== before) s.dirty = true;
  }

  // ═══════════════════════════════════════════════════
  // 설치 통발 — 놓는 순간 남에게도 보인다
  // ═══════════════════════════════════════════════════

  /** 통발 설치 알림. 같은 칸에 이미 있으면 거절한다(먼저 놓은 사람이 임자) */
  placeTrap(code: string, playerId: string, token: string | undefined, trap: Omit<MpPlacedTrap, 'ownerId' | 'ownerName'>):
  { ok: boolean; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = this.authed(s, playerId, token);
    if (!me) return { ok: false, reasonKo: '세션에서 나간 상태입니다.' };
    const taken = s.traps.some((t) =>
      t.mapKey === trap.mapKey && t.tileX === trap.tileX && t.tileY === trap.tileY);
    if (taken) return { ok: false, reasonKo: '그 자리에는 이미 통발이 있습니다.' };
    s.traps.push({ ...trap, ownerId: me.userId, ownerName: me.name });
    s.dirty = true; this.save(code, true);
    return { ok: true };
  }

  /** 통발 회수 — 놓은 사람만 지울 수 있다 */
  removeTrap(code: string, playerId: string, token: string | undefined, instanceId: string): { ok: boolean; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = this.authed(s, playerId, token);
    if (!me) return { ok: false, reasonKo: '세션에서 나간 상태입니다.' };
    const i = s.traps.findIndex((t) => t.instanceId === instanceId);
    if (i < 0) return { ok: true };   // 이미 없다 — 조용히 성공
    if (s.traps[i]!.ownerId !== me.userId) return { ok: false, reasonKo: '남의 통발입니다.' };
    s.traps.splice(i, 1);
    s.dirty = true; this.save(code, true);
    return { ok: true };
  }

  // ═══════════════════════════════════════════════════
  // 정리 · 요약
  // ═══════════════════════════════════════════════════

  /** 자리 비운 사람·빈 세션 정리 — 모든 조회 앞에서 한 번씩 돈다(별도 타이머 없음) */
  private sweep(): void {
    const now = Date.now();
    for (const [code, s] of this.sessions) {
      let live = 0;
      for (const [id, p] of s.players) {
        if (!p.offline && now - p.lastSeenMs > MP_PRESENCE_TIMEOUT_MS) {
          // 접속만 끊긴 것으로 본다 — 자리는 이어하기용으로 남긴다
          p.offline = true;
          s.dirty = true;
        }
        if (p.offline && now - p.lastSeenMs > OFFLINE_KEEP_MS) {
          s.players.delete(id);
          // 231차 — 자리가 사라지면 그 사람의 설치물도 걷는다(주인 없는 통발은 아무도 못 거둔다)
          s.traps = s.traps.filter((t) => t.ownerId !== p.userId);
          s.dirty = true;
        }
        else if (!p.offline) live++;
      }
      if (live === 0 && s.players.size === 0 && now - s.createdMs > EMPTY_SESSION_TTL_MS) {
        this.sessions.delete(code);
        this.erase(code);
      }
    }
  }

  /** 세션 요약 (참가 화면에서 "지금 N명" 표시용) */
  info(code: string): { playerCount: number; names: string[] } | null {
    const s = this.get(code);
    if (!s) return null;
    const live = [...s.players.values()].filter((p) => !p.offline);
    return { playerCount: live.length, names: live.map((p) => p.name) };
  }

  // ═══════════════════════════════════════════════════
  // 영속 — 세션마다 JSON 한 장
  // ═══════════════════════════════════════════════════

  private pathOf(code: string): string { return join(SESSION_DIR, `${code}.json`); }

  private save(code: string, force = false): void {
    const s = this.sessions.get(code.toUpperCase());
    if (!s || !s.dirty) return;
    const now = Date.now();
    if (!force && now - s.savedMs < SAVE_THROTTLE_MS) return;
    const data: MpSavedSession = {
      code: s.code, seed: s.seed, createdMs: s.createdMs, savedMs: now,
      players: [...s.players.values()].map((p) => ({
        userId: p.userId, name: p.name, nameKey: p.nameKey,
        regionId: p.regionId, x: p.x, y: p.y, lastSeenMs: p.lastSeenMs,
      })),
      traps: s.traps,
      // 146차 — 미적용 확정 거래는 이어하기 복구용으로 남긴다
      trades: s.trades.filter((t) => t.phase === 'committed'),
      // 233차 — 채집 고갈(1~2일)은 서버를 다시 켜도 남는다. 잠금은 짧아서 버린다
      taken: s.taken.filter((l) => !l.busy && l.untilMs > Date.now()),
    };
    try {
      mkdirSync(SESSION_DIR, { recursive: true });
      writeFileSync(this.pathOf(s.code), JSON.stringify(data), 'utf-8');
      s.savedMs = now;
      s.dirty = false;
    } catch (e) {
      console.warn('[mp] 세션 저장 실패', s.code, e);
    }
  }

  private erase(code: string): void {
    try { unlinkSync(this.pathOf(code.toUpperCase())); } catch (_e) { /* 없으면 그만 */ }
  }

  /**
   * 서버가 켜질 때 저장본을 되살린다.
   * 되살아난 사람은 전부 `offline` — 실제 접속은 `join`(같은 userId)이 살린다.
   */
  private loadAll(): void {
    let files: string[] = [];
    try { files = readdirSync(SESSION_DIR).filter((f) => f.endsWith('.json')); } catch (_e) { return; }
    for (const f of files) {
      try {
        const d = JSON.parse(readFileSync(join(SESSION_DIR, f), 'utf-8')) as MpSavedSession;
        const players = new Map<string, SessionPlayer>();
        for (const p of d.players ?? []) {
          const playerId = `r${p.userId}`;
          players.set(playerId, {
            playerId, userId: p.userId, name: p.name, nameKey: p.nameKey,
            regionId: p.regionId, x: p.x, y: p.y, facing: 'down', moving: false,
            activity: 'menu', lastSeenMs: p.lastSeenMs, offline: true, token: '',
          });
        }
        this.sessions.set(d.code, {
          code: d.code, seed: d.seed >>> 0, createdMs: d.createdMs,
          players, traps: d.traps ?? [], chat: [], chatSeq: 0, trades: d.trades ?? [],
          taken: (d.taken ?? []).map((l, i) => ({ ...l, seq: i + 1 })), takenSeq: (d.taken ?? []).length,
          savedMs: d.savedMs, dirty: false,
        });
      } catch (e) {
        console.warn('[mp] 세션 불러오기 실패', f, e);
      }
    }
    if (this.sessions.size) console.log(`[mp] 저장된 세션 ${this.sessions.size}개 복원`);
  }
}
