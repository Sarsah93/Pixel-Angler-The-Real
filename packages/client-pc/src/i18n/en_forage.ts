/**
 * @file en_forage.ts
 * @description 인-맵 채집(해루질)·어장·통발 영어 사전 (121차). 키 = 코드 원문. `en.ts` EN_DICT에 합쳐진다.
 * 수치가 끼는 문장(스팟 힌트·단속·침지 라벨)은 `en.ts` EN_RULES의 121차 규칙이 캡처 재번역한다.
 */
export const EN_FORAGE: Record<string, string> = {
  // ── 도구·아이템 ──
  '헤드랜턴 (800lm)': 'Headlamp (800 lm)', '채집 집게': 'Foraging Tongs', '채집 갈고리': 'Foraging Gaff',
  '해루질 도구': 'Foraging Tools', '통발': 'Trap', '채집물': 'Foraged',
  '맨손': 'bare hands', '집게': 'tongs', '뜰채': 'dip net', '갈고리': 'gaff',
  // ── 어장 ──
  '마을어장': 'village fishery', '협동양식장': 'co-op farm', '정치망': 'set net', '패류 양식장': 'shellfish farm',
  '가두리 양식장': 'cage farm', '어장': 'fishery',
  '(채취 금지)': '(no gathering)',
  // ── 힌트·상태 ──
  '던질 자리를 물 위에서 클릭하세요': 'Click on the water where you want to throw it',
  '여기에는 놓을 수 없습니다': 'You cannot place it here',
  '물 위에만 놓을 수 있습니다': 'Only on water', '너무 멉니다 — 물가에 더 가까이': 'Too far — get closer to the water',
  '뭍에서 너무 먼 물입니다': 'Too far from shore', '이미 통발이 있습니다': 'There is already a trap here',
  '통발이 없습니다 — 직판장에서 구매': 'No traps — buy one at the fish market', '통발이 없습니다': 'No traps',
  '미끼가 없습니다': 'No bait', '설치 불가': 'Cannot deploy',
  '통발 조업 기본 면허가 필요합니다 — L 면허 창': 'Basic trap licence required — press L',
  '해루질 입문 허가가 필요합니다 — L 면허 창': 'Basic gleaning permit required — press L',
  '지금은 위험합니다': 'Too dangerous right now',
  '너울에 미끄러졌다! 갯바위 주의': 'Slipped on the swell! Mind the rocks', '이끼에 미끄러졌다!': 'Slipped on the algae!',
  '쿨러와 인벤토리가 가득 찼습니다 — 놓아주었습니다': 'Cooler and inventory are full — released',
  '통발이 조류에 쓸려 사라졌다…': 'The trap was swept away by the current…', '빈 통발…': 'Empty trap…',
  '낮에는 야행성 생물이 숨는다 — 야간(일몰 후)이 적기': 'Nocturnal creatures hide by day — after sunset is best',
  '조위가 높다 — 간조 전후가 적기': 'Tide is high — around low tide is best',
  '통발 놓기': 'Set a Trap', '통발 (보유)': 'Traps (owned)', '미끼': 'Bait', '없음 — 직판장에서 구매': 'None — buy at the fish market',
  '통발과 미끼를 고르세요': 'Choose a trap and bait', '설치 위치 고르기': 'Choose a spot', '심화': 'adv.', '기본': 'basic',
  '설치 = 통발 1 + 미끼 1 소모 · 수거 시 통발 반환(분실·파손 제외) · 침지는 실시간 · 산란기 도루묵(10~12월) 포획은 조례 위반':
    'Deploy = 1 trap + 1 bait · trap returned on retrieval (unless lost/broken) · soak time is real time · sandfish caught in spawning season (Oct–Dec) violates the ordinance',
  '분실/파손': 'lost/broken', '수거 적기': 'ready', '수거 없음': 'no catch', '수확 없음': 'no catch',
  '[통발] 분실된 통발을 정리했습니다': '[Trap] Cleared the lost trap',
  '갯바위 채집은 추후 개방됩니다': 'Rock gathering opens later',
  // ── 도움말 ──
  '채집 · 통발': 'Gleaning · Traps', '해루질 (인-맵 채집)': 'Gleaning (in-map foraging)', '강원 조례 규제': 'Gangwon ordinance',
  '통발 조업': 'Trap fishing',
};
