/**
 * @file SessionRegistry.ts
 * @description 멀티플레이 세션 보관소 (143차 신설 — 인메모리)
 *
 * 세션 = 한 세계. 호스트가 코드를 뽑아 열고, 같은 코드로 들어온 사람들이 맵을 공유한다.
 * **캐릭터 이름은 세션 안에서 유일**하다 — 이름을 먼저 선점(claim)해야 들어올 수 있다.
 *
 * 저장하지 않는다(프로세스 메모리). 서버가 내려가면 세션도 사라진다 —
 * 진행 상황은 각자의 저장 슬롯에 남으므로 세션을 다시 열면 같은 캐릭터로 들어올 수 있다.
 */

import {
  SESSION_CODE_LEN, SESSION_CODE_ALPHABET, MP_PRESENCE_TIMEOUT_MS,
  characterNameKey, validateCharacterName,
  type MpPeer,
} from '@tra/core';

interface SessionPlayer extends MpPeer {
  nameKey: string;
  lastSeenMs: number;
}

interface Session {
  code: string;
  createdMs: number;
  players: Map<string, SessionPlayer>;
}

/** 아무도 없는 세션을 얼마나 붙들고 있을지 (호스트가 잠깐 나갔다 와도 코드가 살아 있게) */
const EMPTY_SESSION_TTL_MS = 10 * 60_000;

export class SessionRegistry {
  private sessions = new Map<string, Session>();
  private seq = 0;

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
    this.sessions.set(code, { code, createdMs: Date.now(), players: new Map() });
    return code;
  }

  get(code: string): Session | undefined {
    this.sweep();
    return this.sessions.get(code.toUpperCase());
  }

  /** 이름이 이미 쓰이는지 — 형식 오류도 여기서 함께 걸러 클라이언트가 한 번만 물어도 되게 한다 */
  checkName(code: string, name: string): { ok: boolean; duplicate?: boolean; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const v = validateCharacterName(name);
    if (!v.ok) return { ok: false, reasonKo: v.reasonKo };
    const key = characterNameKey(name);
    for (const p of s.players.values()) {
      if (p.nameKey === key) return { ok: false, duplicate: true };
    }
    return { ok: true };
  }

  /** 이름 선점 + 입장 — 성공하면 playerId를 돌려준다 */
  join(code: string, name: string): { ok: boolean; playerId?: string; duplicate?: boolean; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const chk = this.checkName(code, name);
    if (!chk.ok) return { ok: false, duplicate: chk.duplicate, reasonKo: chk.reasonKo };
    const playerId = `p${Date.now().toString(36)}${(this.seq++).toString(36)}`;
    s.players.set(playerId, {
      playerId, name: name.trim(), nameKey: characterNameKey(name),
      regionId: '', x: 0, y: 0, facing: 'down', moving: false,
      lastSeenMs: Date.now(),
    });
    return { ok: true, playerId };
  }

  /** 위치 알림 + 다른 사람 목록 회신 */
  presence(
    code: string, playerId: string,
    pos: { regionId: string; x: number; y: number; facing: MpPeer['facing']; moving: boolean },
  ): { ok: boolean; peers?: MpPeer[]; reasonKo?: string } {
    const s = this.get(code);
    if (!s) return { ok: false, reasonKo: '세션을 찾을 수 없습니다.' };
    const me = s.players.get(playerId);
    if (!me) return { ok: false, reasonKo: '세션에서 나간 상태입니다. 다시 접속하세요.' };
    me.regionId = pos.regionId;
    me.x = pos.x; me.y = pos.y;
    me.facing = pos.facing; me.moving = pos.moving;
    me.lastSeenMs = Date.now();

    const peers: MpPeer[] = [];
    for (const p of s.players.values()) {
      if (p.playerId === playerId) continue;
      peers.push({
        playerId: p.playerId, name: p.name, regionId: p.regionId,
        x: p.x, y: p.y, facing: p.facing, moving: p.moving,
      });
    }
    return { ok: true, peers };
  }

  leave(code: string, playerId: string): void {
    this.sessions.get(code.toUpperCase())?.players.delete(playerId);
  }

  /** 자리 비운 사람·빈 세션 정리 — 모든 조회 앞에서 한 번씩 돈다(별도 타이머 없음) */
  private sweep(): void {
    const now = Date.now();
    for (const [code, s] of this.sessions) {
      for (const [id, p] of s.players) {
        if (now - p.lastSeenMs > MP_PRESENCE_TIMEOUT_MS) s.players.delete(id);
      }
      if (s.players.size === 0 && now - s.createdMs > EMPTY_SESSION_TTL_MS) this.sessions.delete(code);
    }
  }

  /** 세션 요약 (참가 화면에서 "지금 N명" 표시용) */
  info(code: string): { playerCount: number; names: string[] } | null {
    const s = this.get(code);
    if (!s) return null;
    return { playerCount: s.players.size, names: [...s.players.values()].map((p) => p.name) };
  }
}
