/**
 * @file en_mail.ts
 * @description 296차 — 집 앞 우편함(편지 · 첨부 · 받기) 영문. 창 문구 · 편지 제목 · 본문 · 채널 줄 · 도움말.
 *
 * 규칙은 수치가 섞인 문장(편지 N통 · 물건 N건 · 「[우편] …」 채널 줄)만 둔다.
 */

type Tr = (s: string) => string;
type MailRule = [RegExp, (m: RegExpExecArray, tr: Tr) => string];

const n = (k: string, one: string, many: string): string => `${k} ${k === '1' ? one : many}`;

export const EN_MAIL: Record<string, string> = {
  '우편함': 'Mailbox',
  '[F] 우편함 열기': '[F] Open mailbox',
  '편지가 없다.': 'No mail.',
  '편지를 고르면 여기에 내용이 보인다.': 'Pick a letter to read it here.',
  '붙어 온 물건은 다 받았다.': 'Everything attached has been taken.',
  '받기': 'Take',
  '모두 받기': 'Take all',
  '지우기': 'Delete',
  '새 편지': 'New mail',
  '가방에 자리가 없어 받지 못했다 — 한 칸 비우고 다시 받는다.': 'No room in the bag — free a slot and take again.',
  '가방에 자리가 없다 — 한 칸 비우고 회수한다': 'No room in the bag — free a slot before recovering.',
  '유찰된 물건을 돌려보냅니다': 'Returning your unsold goods',
  '회차가 서지 않아 돌려보냅니다': 'No auction was held — returning your goods',
  '회수한 용기를 집으로 보냈다': 'Recovered cookware sent home',
  '가방이 가득해 화구에서 내린 용기를 집 우편함으로 보냈다.': 'Your bag was full, so the cookware taken off the stove was sent to the mailbox at home.',
  '가방이 가득해 걷은 통발을 집 우편함으로 보냈다. 집 앞 우편함에서 받아 간다.': 'Your bag was full, so the hauled trap was sent to the mailbox at home. Pick it up there.',
  '화구': 'Stove',
  '위판장에서 연락이 왔다 — 맡긴 물건이 유찰돼 집 앞 우편함으로 돌아왔다.': 'Word from the auction hall — what I left went unsold and came back to the mailbox at home.',
  // 가이드
  '집 앞 우편함이다. 위판장에서 팔리지 않은 물건이나, 가방이 가득해 받지 못한 물건이 편지에 붙어 여기로 온다.':
    'This is the mailbox outside your home. Goods that went unsold at the auction hall, or things you could not receive because your bag was full, arrive here attached to letters.',
  '편지를 고르면 아래에 내용과 붙어 온 물건이 보인다. 붙어 온 물건은 든 동안 상하지 않는다.':
    'Pick a letter to see its text and attachments below. Attachments do not spoil while they sit in the mailbox.',
  '「받기」를 누르면 붙어 온 물건이 가방에 들어온다. 자리가 모자라면 남은 것은 우편함에 그대로 있다.':
    'Press “Take” to move the attachments into your bag. If there is not enough room, whatever is left stays in the mailbox.',
  '위판장에 맡겨 둔 물건이 여기 모인다. 다음 경매가 끝나면 값이 들어오고, 안 팔린 것은 집 우편함으로 돌아온다.':
    'Everything you left at the auction hall gathers here. When the next auction ends the money comes in, and whatever did not sell returns to the mailbox at home.',
  // 도움말
  '집 앞 우편함': 'The mailbox outside your home',
  '홈타운 집 문 앞 길 옆에 우편함이 서 있습니다. 앞에서 F를 누르면 편지함이 열립니다 — 편지마다 보낸 곳 · 제목 · 본문과 붙어 온 물건이 보입니다.':
    'A mailbox stands beside the path in front of your hometown house. Press F in front of it to open it — each letter shows the sender, title, text and attached goods.',
  '위판장에 맡긴 물건이 경매에서 팔리지 않으면(유찰) 위판장이 집 우편함으로 돌려보냅니다. 걷은 통발이나 화구에서 내린 용기처럼 자동으로 돌아오는 물건도 가방이 가득하면 사라지지 않고 우편함으로 옵니다.':
    'When goods you left at the auction hall go unsold, the hall sends them back to this mailbox. Things that come back on their own — a hauled trap, cookware taken off a stove — also go to the mailbox instead of vanishing when your bag is full.',
  '편지를 고르고 「받기」를 누르면 붙어 온 물건이 가방에 들어옵니다. 자리가 모자라면 들어간 것만 빠지고 남은 것은 우편함에 그대로 있습니다. 우편함에 든 동안 물건은 상하지 않습니다.':
    'Pick a letter and press “Take” to move the attachments into your bag. If there is not enough room, only what fits is removed and the rest stays. Goods do not spoil while they sit in the mailbox.',
  '편지가 오면 지역 채널에 「[우편]」 한 줄이 찍히고, 손목시계를 차고 있으면 알람이 울립니다. 우편함 깃발이 올라가고 머리 위 표시 · 미니맵에도 보입니다. 붙어 온 물건을 다 받은 편지는 「지우기」로 치웁니다.':
    'When mail arrives a “[Mail]” line is printed in the regional channel, and your wristwatch alarm rings if you wear one. The mailbox flag goes up and a marker shows above it and on the minimap. Delete a letter once its attachments are taken.',
};

export const EN_MAIL_RULES: MailRule[] = [
  [/^편지 (\d+)통(?: · 안 읽음 (\d+))?$/, (m) => `${n(m[1]!, 'letter', 'letters')}${m[2] ? ` · ${m[2]} unread` : ''}`],
  [/^물건 (\d+)$/, (m) => `${n(m[1]!, 'item', 'items')}`],
  [/^물건이 든 편지 (\d+)통$/, (m) => `${n(m[1]!, 'letter', 'letters')} with goods`],
  [/^물건 (\d+)건을 받았다 — 가방에 자리가 없어 (\d+)건은 남겨 두었다\.$/, (m) => `Took ${n(m[1]!, 'item', 'items')} — ${m[2]} left behind, no room in the bag.`],
  [/^물건 (\d+)건을 받았다\.$/, (m) => `Took ${n(m[1]!, 'item', 'items')}.`],
  [/^\[우편\] 우편함에서 물건 (\d+)건을 받았다(?: \(자리가 없어 (\d+)건은 남김\))?$/, (m) => `[Mail] Took ${n(m[1]!, 'item', 'items')} from the mailbox${m[2] ? ` (${m[2]} left, no room)` : ''}`],
  [/^맡기신 물건 (\d+)건이 이번 회차에 팔리지 않았습니다\. 그대로 돌려보내니 우편함에서 받아 가세요\. 다음 회차에 다시 맡기셔도 됩니다\.$/,
    (m) => `${n(m[1]!, 'item', 'items')} you left with us did not sell this round. We are returning them as they were — please collect them from your mailbox. You are welcome to leave them again for the next round.`],
  [/^맡기신 물건 (\d+)건을 올릴 회차가 서지 않았습니다\. 그대로 돌려보내니 우편함에서 받아 가세요\.$/,
    (m) => `No round was held for the ${n(m[1]!, 'item', 'items')} you left with us. We are returning them as they were — please collect them from your mailbox.`],
  [/^(\[우편\] )?집 우편함에 편지가 왔습니다 — (.+) 「(.+)」(?: · 물건 (\d+)건)?$/,
    (m, tr) => `${m[1] ? '[Mail] ' : ''}Mail arrived at home — ${tr(m[2]!)}, “${tr(m[3]!)}”${m[4] ? ` · ${n(m[4]!, 'item', 'items')}` : ''}`],
  [/^(.+) 위판장$/, (m, tr) => `${tr(m[1]!)} Auction Hall`],
  [/^(.+) · (\d{1,2}\/\d{1,2} \d{2}:\d{2}|\d{2}:\d{2})$/, (m, tr) => `${tr(m[1]!)} · ${m[2]}`],
  [/^걷은 (.+)을\(를\) 집으로 보냈다$/, (m, tr) => `Hauled ${tr(m[1]!)} sent home`],
  [/^\[통발\] 가방이 가득해 (.+)을\(를\) 집 우편함으로 보냈다$/, (m, tr) => `[Trap] Bag full — ${tr(m[1]!)} was sent to the mailbox at home`],
  [/^\[위판\] 맡겨 둔 물건이 유찰돼 집 우편함으로 돌아왔다 \((\d+)건\)$/, (m) => `[Auction] What you left went unsold and came back to the mailbox at home (${m[1]})`],
  [/^\[위판\] 맡겨 둔 물건 낙찰 (\d+)건 · 유찰 (\d+)건 — 실수령 ([\d,]+)원 \(수수료 ([\d,]+)원\) · 유찰품은 집 우편함으로$/,
    (m) => `[Auction] Lots you left: ${m[1]} sold · ${m[2]} unsold — net ₩${m[3]} (fee ₩${m[4]}) · unsold goods went to the mailbox at home`],
];
