/**
 * @file MailboxStore.ts
 * @description 296차 — 집 앞 우편함(사용자 결정 2026-11-02 — 「집 앞에 '우편함' 그래픽 … 유찰 아이템 및 거래 과정에서
 *  가방이 가득 차 대기열로 빠져야 하는 물건들 등 유실 경로를 우편함(메일함)으로」).
 *
 *  편지 한 통 = 보낸 곳 · 제목 · 본문 · 첨부(물건). 자동으로 돌아오는 물건(위판 유찰품 · 가방이 가득해 받지 못한 것)은
 *  사라지지 않고 여기로 온다. 플레이어는 홈타운 집 앞 우편함에서 [F]로 열어 첨부를 「받기」로 가방에 옮긴다.
 *  첨부가 든 동안 신선도는 멈춘다(받을 때 `conditionSinceMs`를 든 시간만큼 뒤로 민다 — `store/MailDeliver.ts`).
 *
 *  세이브 키 `mailbox`(`GameState`). 가방 · 돈을 건드리는 일은 `MailDeliver.ts`가 한다 —
 *  GameState가 이 파일을 세이브로 import하므로 여기서 GameState · InventoryStore를 부르지 않는다.
 */

import type { InvItemTemplate } from './InventoryStore.js';

/** 편지 갈래 — consign = 위판 유찰 · overflow = 가방이 가득해 받지 못한 것 · notice = 물건 없는 알림 */
export type MailKind = 'consign' | 'overflow' | 'notice';

/** 첨부 한 줄 — 가방 칸 하나와 같다(묶음이면 수량) */
export interface MailAttachment {
  tpl: InvItemTemplate;
  qty: number;
}

export interface MailLetter {
  id: string;
  kind: MailKind;
  /** 보낸 곳(화면 이름 — 「속초 위판장」 · 「통발」) */
  from: string;
  title: string;
  body: string;
  /** 온 시각(ms) — 첨부 신선도는 이때부터 멈춘다 */
  atMs: number;
  read: boolean;
  /** 남은 첨부(받으면 빠진다) */
  items: MailAttachment[];
  /** 「편지가 왔다」 알림을 보냈는가 */
  notified?: boolean;
}

export interface MailboxSave {
  letters: MailLetter[];
  counter: number;
  /** 305차 — 이 우편함의 주인(집 id). `GameState`가 저장할 때 적는다 — 구세이브는 없다(본인 것) */
  ownerHomeId?: string;
}

export interface MailDraft {
  kind: MailKind;
  from: string;
  title: string;
  body: string;
  items?: MailAttachment[];
  atMs?: number;
}

class MailboxStoreImpl {
  private letters: MailLetter[] = [];
  private counter = 0;

  /** 편지를 넣는다(최신이 앞) */
  send(d: MailDraft): MailLetter {
    const l: MailLetter = {
      id: `mail_${++this.counter}`, kind: d.kind, from: d.from, title: d.title, body: d.body,
      atMs: d.atMs ?? Date.now(), read: false, items: (d.items ?? []).map((a) => ({ tpl: { ...a.tpl }, qty: a.qty })),
    };
    this.letters.unshift(l);
    return l;
  }

  /** 전부(최신이 앞) */
  get all(): readonly MailLetter[] { return this.letters; }

  byId(id: string): MailLetter | undefined { return this.letters.find((l) => l.id === id); }

  get unreadCount(): number { return this.letters.filter((l) => !l.read).length; }

  /** 첨부가 남은 편지 수 */
  get withItemsCount(): number { return this.letters.filter((l) => l.items.length > 0).length; }

  /** 우편함 깃발 — 안 읽은 편지나 받지 않은 첨부가 있으면 올린다 */
  get flagUp(): boolean { return this.letters.some((l) => !l.read || l.items.length > 0); }

  /** 아직 알리지 않은 편지(온 순서) */
  unnotified(): MailLetter[] { return this.letters.filter((l) => !l.notified).slice().reverse(); }

  markNotified(id: string): void { const l = this.byId(id); if (l) l.notified = true; }

  markRead(id: string): void { const l = this.byId(id); if (l) l.read = true; }

  /** 첨부 하나를 뗀다(가방에 들어간 뒤 부른다) */
  detach(id: string, index: number): void {
    const l = this.byId(id);
    if (!l) return;
    l.items.splice(index, 1);
  }

  /** 첨부가 없는 편지만 지울 수 있다 */
  remove(id: string): boolean {
    const l = this.byId(id);
    if (!l || l.items.length > 0) return false;
    this.letters = this.letters.filter((x) => x !== l);
    return true;
  }

  serialize(): MailboxSave {
    return { letters: this.letters.map((l) => ({ ...l, items: l.items.map((a) => ({ tpl: { ...a.tpl }, qty: a.qty })) })), counter: this.counter };
  }

  /** 구세이브(필드 없음) = 빈 우편함 */
  deserialize(s: MailboxSave | undefined): void {
    this.letters = (s?.letters ?? []).map((l) => ({ ...l, items: (l.items ?? []).map((a) => ({ tpl: { ...a.tpl }, qty: Math.max(1, a.qty || 1) })) }));
    this.counter = s?.counter ?? this.letters.length;
  }

  resetAll(): void { this.letters = []; this.counter = 0; }
}

export const MailboxStore = new MailboxStoreImpl();
if (import.meta.env.DEV) (globalThis as unknown as { __MAIL: MailboxStoreImpl }).__MAIL = MailboxStore;
