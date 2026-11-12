/**
 * @file MillNotifier.ts
 * @description 285차 — 방앗간에 맡긴 일이 다 되면 알린다(사용자 지시 — 284차 「뒤로 미룬 것」 1번).
 *
 * 사용자 말(원문 요지): 「기본적으로 채팅창에 이벤트 발생 로그 중 하나로 추가해서 알리기 · 시계 착용 시, 시계 알림 효과음 소리(삐빅-삐빅-삐빅)로
 *  알리고 팝업 메시지 띄우기 — 타이머 설정해둔 것처럼 · 가게 근처나 표지판 쪽에 느낌표 아이콘으로 알림(맵에도 표시)」.
 *
 *  ① 지역 채널(채팅 기록)에 한 줄 — 언제나.
 *  ② 손목시계(장비 「시계」 칸)를 차고 있으면 알람음 「삐빅 · 삐빅 · 삐빅」 + 작은 알림 창(누르거나 9초 뒤 닫힘).
 *     시계가 없으면 필드 밖(1인칭 · 집)에서는 화면 위에 글 한 줄만 잠깐 띄운다(채널을 볼 수 없으니).
 *  ③ 방앗간 문 위 초록 느낌표 · 미니맵 · 전체 지도 표시는 필드가 그린다(`RegionFieldScene.refreshQuestMarkers` — 다 된 일이 있는 동안 내내).
 *
 * 필드 · 1인칭 · 집 씬이 update에서 `pumpMillReady(scene)`을 부른다(벽시계 5초 간격 — 씬 타이머가 아니다).
 * 한 번 알린 일은 `MillOrder.notified`로 세이브에 남는다 — 불러온 뒤 같은 알림을 다시 내지 않는다.
 * 게임을 끈 사이에 다 된 일은 다음에 켰을 때 처음 도는 씬이 알린다.
 * 285차 — 텃밭 걸대 · 장독의 갈무리(`CureQueue`)도 같은 길로 알린다(채널 「[갈무리]」 · 시계 알람). 텃밭 창 설비 칩에는 초록 점.
 * 296차 — 집 우편함에 편지가 오면(`MailboxStore`) 같은 길(채널 「[우편]」 · 시계 알람). 우편함 깃발 · 미니맵은 홈타운 필드가 그린다.
 * 312차 — 축제 알림은 프롤로그 집 안 단계가 끝난 뒤(집을 나설 때)부터 낸다(`festivalNoticesDue`).
 */

import Phaser from 'phaser';
import { millService, cureRecipe, CURE_STATION_LABEL, FESTIVALS, festivalPhase, festivalPeriodLabel, kstYmdOf, isRegionOpenAtChapter, REGIONAL_SPECIALTIES, particle, type FestivalDef } from '@tra/core';
import { festivalNow } from '../data/FestivalClock.js';   // 298차
import { StoryStore } from '../store/StoryStore.js';
import { prologueStepDone } from '../store/Prologue.js';   // 312차 — 집 안 튜토리얼 동안 축제 알림 미룸
import { isAllRegionsOpen } from '../dev/DevMode.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { MillQueue, type MillOrder } from '../store/MillQueue.js';
import { CureQueue, type CureBatch } from '../store/CureQueue.js';
import { ProcessQueue, type ProcessOrder } from '../store/ProcessQueue.js';   // 295차
import { MailboxStore, type MailLetter } from '../store/MailboxStore.js';   // 296차
import { processRecipe } from '@tra/core';
import { InventoryStore } from '../store/InventoryStore.js';
import { GameState } from '../store/GameState.js';
import { playSfx } from '../audio/SfxBank.js';
import { paintHudPanel } from './HudPanelStyle.js';
import { clampTextWidth } from './TextFit.js';
import { columnGap, fieldReserved, tagUiRect } from './ScreenReserve.js';
import { createItemIcon } from './ItemIcon.js';
import { screenToast } from './ScreenToast.js';   // 300 D — 화면 위 한 줄(겹침 · 중복 없이)

const POLL_MS = 5000;
const HOLD_MS = 9000;
const W = 400;
const FONT = '"Noto Sans KR", sans-serif';

let lastPollMs = 0;
/** 지금 떠 있는 알람 창(씬과 함께 파괴되면 다음 알림이 새로 띄운다) */
let active: Phaser.GameObjects.Container | null = null;

/** 받침이 있으면 앞 조사, 없으면 뒤 조사 — 「…」 뒤에 붙는 조사는 안쪽 마지막 글자로 고른다 */
function josa(word: string, withB: string, withoutB: string): string {
  const inner = word.replace(/[」』)\s]+$/, '');
  const c = inner.charCodeAt(inner.length - 1);
  const b = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  return `${word}${b ? withB : withoutB}`;
}

/** 알림 한 줄(태그 없이) — 「설악기름방앗간에 맡긴 「참기름 짜기」가 다 됐습니다 — 찾으러 가세요.」 */
export function millReadyLine(o: MillOrder): string {
  const what = `「${millService(o.service)?.nameKo ?? '맡긴 일'}」`;
  return `${o.shopName}에 맡긴 ${josa(what, '이', '가')} 다 됐습니다 — 찾으러 가세요.`;
}

/** 285차 — 갈무리 알림 한 줄 — 「텃밭 건조 걸대의 「무청 엮어 걸기」가 다 됐습니다 — 거두러 가세요.」 */
/** 295차 — 가공장 알림 한 줄 */
export function processReadyLine(o: ProcessOrder): string {
  const what = `「${processRecipe(o.recipeId)?.nameKo ?? '맡긴 것'}」`;
  return `${o.shopName}의 ${josa(what, '이', '가')} 다 됐습니다 — 찾으러 가세요.`;
}

/** 296차 — 우편함 알림 한 줄 — 「집 우편함에 편지가 왔습니다 — 속초 위판장 「유찰된 물건을 돌려보냅니다」 · 물건 2건」 */
export function mailArrivedLine(l: MailLetter): string {
  return `집 우편함에 편지가 왔습니다 — ${l.from} 「${l.title}」${l.items.length ? ` · 물건 ${l.items.length}건` : ''}`;
}

export function cureReadyLine(b: CureBatch): string {
  const what = `「${cureRecipe(b.recipeId)?.nameKo ?? '걸어 둔 것'}」`;
  return `텃밭 ${CURE_STATION_LABEL[b.station].ko}의 ${josa(what, '이', '가')} 다 됐습니다 — 거두러 가세요.`;
}

/** 손목시계를 찼는가(장비 「시계」 칸) */
/**
 * 298차 — 축제 절정 첫 알림(열린 지역 · 해마다 한 번 — 세이브 플래그 `fest.<id>.<해>`).
 * 312차 — 프롤로그 집 안 단계(상자 · 대 · 릴 · 사진 · 일지 · 오징어 · 저장)에는 내지 않는다
 *  (사용자 리포트 「튜토리얼 중에, 시즌 축제에 대한 고지가 떠버리고 있어 … 집에서 나갈 때(오징어 챙겨서 나갈 때), 뜨게」).
 *  플래그를 켜지 않고 미뤘다가 집을 나서면(`leave`) 마당의 첫 펌프가 낸다 — 지역 채널 한 줄(+ 손목시계 알람).
 */
export function festivalNoticesDue(): { def: FestivalDef; key: string }[] {
  if (StoryStore.isActive('M1-01') && !prologueStepDone('leave')) return [];
  const now = festivalNow();
  const { y } = kstYmdOf(now);
  const ch = StoryStore.currentChapter();
  const out: { def: FestivalDef; key: string }[] = [];
  for (const def of FESTIVALS) {
    if (!(isAllRegionsOpen() || isRegionOpenAtChapter(def.regionId, ch))) continue;
    if (festivalPhase(def, now) !== 'peak') continue;
    const key = `fest.${def.id}.${y}`;
    if (GameState.getFlag(key)) continue;
    out.push({ def, key });
  }
  return out;
}

export function festivalOpenLine(def: FestivalDef): string {
  const specs = def.specialtyIds.map((id) => REGIONAL_SPECIALTIES.find((d) => d.id === id)?.nameKo ?? id).join(' · ');
  return `${def.nameKo}가 열렸다 — ${def.placeKo} · ${festivalPeriodLabel(def)}. 축제장 매대에서 ${specs}${particle(specs, '을', '를')} 더 쳐준다.`;
}

export function wearingWatch(): boolean {
  return !!InventoryStore.getEquipped('시계');
}

/** 필드 HUD 지역 채널에 한 줄 */
function channelLog(scene: Phaser.Scene, line: string): void {
  const field = scene.scene.get('RegionFieldScene') as unknown as { hud?: { pushLog(m: string): void } } | null;
  try { field?.hud?.pushLog(line); } catch { /* 필드 HUD 없음 */ }
}


export interface MillPumpOpts {
  /** 필드가 아닌 씬 — 시계가 없을 때 화면 위 글 줄의 높이 */
  toastY?: number;
  /** 지금은 띄우지 않는다(파이팅 중 · 컷씬) — 다음 펌프로 미룬다 */
  hold?: boolean;
}

/** 매 프레임 불러도 된다 — 5초에 한 번 본다 */
export function pumpMillReady(scene: Phaser.Scene, opts: MillPumpOpts = {}): void {
  const now = Date.now();
  if (now - lastPollMs < POLL_MS) return;
  lastPollMs = now;
  if (opts.hold) return;
  const fresh = MillQueue.unnotified(now);
  const cured = CureQueue.unnotified(now);
  const proc = ProcessQueue.unnotified(now);   // 295차 — 가공장
  const mail = MailboxStore.unnotified();      // 296차 — 우편함
  const fests = festivalNoticesDue();          // 298차 — 축제 절정 첫날
  if (fresh.length === 0 && cured.length === 0 && proc.length === 0 && mail.length === 0 && fests.length === 0) return;
  const millLines = fresh.map(millReadyLine);
  const cureLines = cured.map(cureReadyLine);
  const procLines = proc.map(processReadyLine);
  const mailLines = mail.map(mailArrivedLine);
  const festLines = fests.map((f) => festivalOpenLine(f.def));
  const lines = [...millLines, ...cureLines, ...procLines, ...mailLines, ...festLines];
  for (const o of fresh) MillQueue.markNotified(o.id);
  for (const b of cured) CureQueue.markNotified(b.id);
  for (const o of proc) ProcessQueue.markNotified(o.id);
  for (const l of mail) MailboxStore.markNotified(l.id);
  for (const f of fests) GameState.setFlag(f.key);
  GameState.markDirty();
  for (const l of millLines) channelLog(scene, `[방앗간] ${l}`);
  for (const l of cureLines) channelLog(scene, `[갈무리] ${l}`);
  for (const l of procLines) channelLog(scene, `[가공장] ${l}`);
  for (const l of mailLines) channelLog(scene, `[우편] ${l}`);
  for (const l of festLines) channelLog(scene, `[축제] ${l}`);
  if (wearingWatch()) {
    playSfx('watch_alarm');
    showWatchAlarm(scene, lines);
  } else if (opts.toastY !== undefined) {
    screenToast(scene, lines.join('\n'), opts.toastY, 4800);
  }
  // 필드 표시(문 위 느낌표 · 미니맵)를 바로 다시 그린다
  scene.game.events.emit('mill-ready');
}

/** 손목시계 알람 창 — 타이머가 울린 것처럼(하네스에서도 직접 부른다) */
export function showWatchAlarm(scene: Phaser.Scene, lines: readonly string[]): Phaser.GameObjects.Container {
  if (active?.active) active.destroy();
  const padL = 64, padR = 16;
  const d = new Date();
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const head = scene.add.text(padL, 12, `시계 알람 · ${hhmm}`, { fontFamily: FONT, fontSize: '11px', color: '#7ff0a8', fontStyle: 'bold' });
  clampTextWidth(head, W - padL - padR);
  const body = scene.add.text(padL, head.y + head.height + 4, lines.join('\n'), {
    fontFamily: FONT, fontSize: '13px', color: '#e8f4fd', lineSpacing: 3, wordWrap: { width: W - padL - padR },
  });
  // 확인 단추 — 본문 아래 흐름 배치(R6)
  const btnW = 64, btnH = 22;
  const btnY = Math.ceil(body.y + body.height + 8);
  const H = Math.max(74, btnY + btnH + 10);
  const x = Math.round((GAME_WIDTH - W) / 2);
  const gap = columnGap(x, W, fieldReserved(scene), 8, GAME_HEIGHT * 0.6);
  const y = gap && gap.h >= H ? Math.round(gap.y) : 72;

  const c = scene.add.container(x, y - 10).setDepth(1185).setScrollFactor(0);
  const bg = scene.add.graphics();
  paintHudPanel(bg, 0, 0, W, H, { alpha: 0.96 });
  bg.lineStyle(2, 0x5fe08a, 0.95); bg.strokeRect(1, 1, W - 2, H - 2);
  tagUiRect(bg, 'watch-alarm', x, y, W, H);
  const icon = createItemIcon(scene, 32, Math.round(H / 2), { id: 'inv_watch', icon: '', iconTexture: 'art_watch' }, 40);
  const btnBg = scene.add.rectangle(W - padR - btnW / 2, btnY + btnH / 2, btnW, btnH, 0x1f5a3a, 1).setStrokeStyle(1, 0x5fe08a, 1);
  const btnT = scene.add.text(btnBg.x, btnBg.y, '확인', { fontFamily: FONT, fontSize: '12px', color: '#e8fff0', fontStyle: 'bold' }).setOrigin(0.5);
  const hit = scene.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  c.add([bg, icon, head, body, btnBg, btnT, hit]);
  for (const o of c.list) (o as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor?.(0);
  c.setAlpha(0);
  active = c;

  let closing = false;
  const close = (): void => {
    if (closing || !c.active) return;
    closing = true;
    scene.tweens.add({ targets: c, alpha: 0, y: y - 10, duration: 220, ease: 'Sine.easeIn', onComplete: () => c.destroy() });
  };
  hit.on('pointerdown', close);
  scene.tweens.add({ targets: c, alpha: 1, y, duration: 240, ease: 'Back.easeOut' });
  // 시계가 흔들린다(알람이 울리는 동안)
  if (icon instanceof Phaser.GameObjects.Image) {
    scene.tweens.add({ targets: icon, angle: { from: -9, to: 9 }, duration: 70, yoyo: true, repeat: 9, onComplete: () => icon.setAngle(0) });
  }
  scene.tweens.add({ targets: c, scale: 1, duration: HOLD_MS, onComplete: close });
  return c;
}

if (import.meta.env.DEV) {
  (globalThis as unknown as { __MILLNOTE: unknown }).__MILLNOTE = {
    pump: (s: Phaser.Scene) => { lastPollMs = 0; pumpMillReady(s); },
    showWatchAlarm, millReadyLine, cureReadyLine, wearingWatch, festivalNoticesDue,   // 312차 — 프롤로그 축제 알림 미룸 검증
  };
}
