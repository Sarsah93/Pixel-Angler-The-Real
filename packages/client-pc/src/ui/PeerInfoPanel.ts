/**
 * @file PeerInfoPanel.ts
 * @description 다른 플레이어 정보 보기 (146차).
 *
 * 보여 주는 것은 `MpProfile`뿐이다 — 이름·레벨·착용 장비·면허·최대어·출조 횟수.
 * 재화·인벤토리·퀘스트·생존 지표·스킬·우호도는 **서버에 올라가지도 않는다**(계약 §MpProfile).
 */
import Phaser from 'phaser';
import { DraggablePanel } from './DraggablePanel.js';
import { LICENSE_DATABASE, FISH_DATABASE, type MpProfile, type MpPeer } from '@tra/core';
import { clampTextWidth } from './TextFit.js';

const W = 360;
const FONT = '"Noto Sans KR", sans-serif';

export class PeerInfoPanel extends DraggablePanel {
  constructor(scene: Phaser.Scene, x: number, y: number, peer: MpPeer, onClose: () => void) {
    const p: MpProfile = peer.profile ?? { level: 1, gear: [], licenses: [], records: [], trips: 0 };
    const rows = 4 + Math.max(1, p.gear.length) + Math.max(1, p.licenses.length) + Math.max(1, p.records.length);
    const h = 96 + rows * 18;
    super(scene, { x, y, width: W, height: h, title: `${peer.name} 님의 정보`, onClose, depth: 830 });

    let cy = this.contentTop + 10;
    const line = (text: string, color = '#d8ecff', size = 12, bold = false): void => {
      const t = scene.add.text(16, cy, text, { fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal' });
      clampTextWidth(t, W - 32);
      this.add(t);
      cy += 18;
    };
    const head = (text: string): void => { cy += 4; line(text, '#ffe28a', 12, true); };

    line(`${peer.name} · Lv.${p.level} · 출조 ${p.trips}회`, '#e8f4fd', 13, true);
    head('착용 장비');
    if (!p.gear.length) line('  (착용 중인 장비 없음)', '#8fa9bd');
    for (const g of p.gear) line(`  ${g.slot} — ${g.name}`);
    head('면허');
    if (!p.licenses.length) line('  (보유 면허 없음)', '#8fa9bd');
    for (const id of p.licenses) {
      const def = LICENSE_DATABASE.find((l) => l.type === id);
      line(`  ${def?.nameKo ?? id}`);
    }
    head('최대어');
    if (!p.records.length) line('  (기록 없음)', '#8fa9bd');
    for (const r of p.records) {
      const f = FISH_DATABASE.find((x) => x.id === r.speciesId);
      line(`  ${f?.nameKo ?? r.speciesId} ${r.cm}cm`);
    }
    cy += 2;
    line('재화·가방·퀘스트는 본인만 볼 수 있습니다', '#607b8e', 10);
  }
}
