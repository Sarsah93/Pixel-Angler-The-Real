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
import {
  SESSION_CODE_LEN, SESSION_CODE_ALPHABET, MP_PRESENCE_TIMEOUT_MS,
  MP_CHAT_KEEP, MP_CHAT_MAX_LEN,
  characterNameKey, validateCharacterName,
  type MpPeer, type MpActivity, type MpPlacedTrap, type MpChatLine,
  type MpSavedSession, type MpResume,
} from '@tra/core';

interface SessionPlayer extends MpPeer {
  /** 재접속 열쇠 — 게임을 껐다 켜도 이 id로 같은 자리에 돌아온다 */
  userId: string;
  nameKey: string;
  lastSeenMs: number;
  /** 접속이 끊긴 뒤에도 자리를 기억해 두는가 (이어하기용 껍데기) */
  offline: boolean;
}

interface Session {
  code: string;
  seed: number;
  createdMs: number;
  players: Map<string, SessionPlayer>;
  traps: MpPlacedTrap[];
  chat: MpChatLine[];
  chatSeq: number;
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
      players: new Map(), traps: [], chat: [], chatSeq: 0, savedMs: 0, dirty: true,
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
    ok: boolean; playerId?: string; duplicate?: boolean; seed?: number; resume?: MpResume; reasonKo?: string;
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
        look: look ?? prior.look, lastSeenMs: Date.now(), offline: false,
      };
      s.players.set(playerId, revived);
      s.dirty = true; this.save(code);
      const resume = prior.regionId
        ? { regionId: prior.regionId, x: prior.x, y: prior.y }
        : undefined;
      return { ok: true, playerId, seed: s.seed, resume };
    }

    const playerId = this.newPlayerId();
    s.players.set(playerId, {
      playerId, userId: userId || playerId, name: name.trim(), nameKey: characterNameKey(name),
      regionId: '', x: 0, y: 0, facing: 'down', moving: false, activity: 'field', look,
      lastSeenMs: Date.now(), offline: false,
    });
    s.dirty = true; this.save(code);
    return { ok: true, playerId, seed: s.seed };
  }

  private newPlayerId(): string {
    return `p${Date.now().toString(36)}${(this.seq++).toString(36)}`;
  }

  // ═══════════════════════════════════════════════════
  // 위치 알림 (+ 통발 · 채팅 편승)
  // ═══════════════════════════════════════════════════

  presence(
    code: string, playerId: string,
    pos: {
      regionId: string; x: number; y: number; facing: MpPeer['facing'];
      moving: boolean; activity?: MpActivity; look?: MpPeer['look'];
    },
    opts?: { say?: string; chatSince?: number },
  ): { ok: boolean; peers?: MpPeer[]; traps?: MpPlacedTrap[]; chat?: MpChatLine[]; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = s.players.get(playerId);
    if (!me) return { ok: false, reasonKo: '세션에서 나간 상태입니다. 다시 접속하세요.' };
    me.regionId = pos.regionId;
    me.x = pos.x; me.y = pos.y;
    me.facing = pos.facing; me.moving = pos.moving;
    me.activity = pos.activity ?? 'field';
    if (pos.look) me.look = pos.look;
    me.lastSeenMs = Date.now();
    me.offline = false;

    if (opts?.say) this.say(s, me, opts.say);

    const peers: MpPeer[] = [];
    for (const p of s.players.values()) {
      if (p.playerId === playerId || p.offline) continue;
      peers.push({
        playerId: p.playerId, name: p.name, regionId: p.regionId,
        x: p.x, y: p.y, facing: p.facing, moving: p.moving,
        activity: p.activity, look: p.look,
      });
    }
    const since = opts?.chatSince ?? -1;
    const chat = since < 0 ? [] : s.chat.filter((l) => l.seq > since);
    s.dirty = true;
    this.save(code);
    return { ok: true, peers, traps: s.traps, chat };
  }

  private say(s: Session, me: SessionPlayer, textRaw: string): void {
    const text = textRaw.trim().slice(0, MP_CHAT_MAX_LEN);
    if (!text) return;
    s.chat.push({ seq: ++s.chatSeq, playerId: me.playerId, name: me.name, text, atMs: Date.now() });
    if (s.chat.length > MP_CHAT_KEEP) s.chat.splice(0, s.chat.length - MP_CHAT_KEEP);
  }

  /** 접속 종료 — 자리는 남겨 둔다(이어하기). 완전 삭제는 `sweep`이 기한으로 한다 */
  leave(code: string, playerId: string): void {
    const s = this.sessions.get(code.toUpperCase());
    const p = s?.players.get(playerId);
    if (!s || !p) return;
    p.offline = true;
    p.lastSeenMs = Date.now();
    s.dirty = true;
    this.save(code, true);
  }

  // ═══════════════════════════════════════════════════
  // 설치 통발 — 놓는 순간 남에게도 보인다
  // ═══════════════════════════════════════════════════

  /** 통발 설치 알림. 같은 칸에 이미 있으면 거절한다(먼저 놓은 사람이 임자) */
  placeTrap(code: string, playerId: string, trap: Omit<MpPlacedTrap, 'ownerId' | 'ownerName'>):
  { ok: boolean; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = s.players.get(playerId);
    if (!me) return { ok: false, reasonKo: '세션에서 나간 상태입니다.' };
    const taken = s.traps.some((t) =>
      t.mapKey === trap.mapKey && t.tileX === trap.tileX && t.tileY === trap.tileY);
    if (taken) return { ok: false, reasonKo: '그 자리에는 이미 통발이 있습니다.' };
    s.traps.push({ ...trap, ownerId: me.userId, ownerName: me.name });
    s.dirty = true; this.save(code, true);
    return { ok: true };
  }

  /** 통발 회수 — 놓은 사람만 지울 수 있다 */
  removeTrap(code: string, playerId: string, instanceId: string): { ok: boolean; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = s.players.get(playerId);
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
        if (p.offline && now - p.lastSeenMs > OFFLINE_KEEP_MS) { s.players.delete(id); s.dirty = true; }
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
            activity: 'menu', lastSeenMs: p.lastSeenMs, offline: true,
          });
        }
        this.sessions.set(d.code, {
          code: d.code, seed: d.seed >>> 0, createdMs: d.createdMs,
          players, traps: d.traps ?? [], chat: [], chatSeq: 0,
          savedMs: d.savedMs, dirty: false,
        });
      } catch (e) {
        console.warn('[mp] 세션 불러오기 실패', f, e);
      }
    }
    if (this.sessions.size) console.log(`[mp] 저장된 세션 ${this.sessions.size}개 복원`);
  }
}
