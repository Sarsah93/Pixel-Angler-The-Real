/**
 * @file en_skill.ts
 * @description 영어 사전 — 188차 스킬 창 재설계(호버 설명 · 다음 레벨 · 체험 가이드).
 *
 * ⚠ 키 = 코드에 적힌 한국어 원문 그대로. 원문을 고치면 여기 키도 같이 고친다.
 * 스킬 이름·설명은 core 데이터(nameEn/descEn)가 정본이라 여기 없다(I18n 런타임 사전).
 * 「다음 레벨」 효과 문구는 영어 설정이면 패널이 descEn으로 직접 만든다 — 규칙은 머리말만 옮긴다.
 */

export const EN_SKILL: Record<string, string> = {
  // ── 호버 팝업 ──
  '최대 레벨': 'Max level',
  '스킬 포인트': 'Skill points',
  '함께 익혀야 할 스킬들을 모두 배우면 저절로 열린다. 포인트는 들지 않는다.':
    'Opens by itself once you have learned the skills that go with it. It costs no points.',
  '준비 중인 스킬이다 — 지금 배워 두면 효과는 나중에 난다.':
    'This skill is still being prepared — learn it now and the effect arrives later.',
  '이 분야는 아직 배울 수 없다.': 'This field cannot be learned yet.',
  '포인트가 모자란다.': 'Not enough points.',
  '이야기를 더 진행하면 열린다.': 'Opens as the story goes on.',
  // 숙련도 행위 이름 (사전에 없던 것만 — 캐스팅·채집·손질·회뜨기·요리·제작은 다른 사전에 있다)
  '랜딩': 'Landing', '파이팅': 'Fighting', '지깅': 'Jigging', '에깅': 'Egging', '원투': 'Surf casting',
  '밑밥 투척': 'Chumming', '통발 수거': 'Trap hauling', '자전거 주행': 'Cycling', '흥정': 'Haggling',
  // ── 체험 가이드 (id: skill) ──
  '스킬 창이다. 낚시하고 줍고 사고팔다 보면 레벨이 오르고, 레벨이 오를 때마다 스킬을 하나씩 더 배울 수 있다.':
    'This is the skill window. Fishing, gathering, buying and selling raise your level, and every level lets you learn one more skill.',
  '왼쪽은 분야다. 분야를 고르면 그 분야의 스킬이 오른쪽에 펼쳐진다. 선으로 이어진 스킬은 앞의 것을 배워야 열린다.':
    'On the left are the fields. Pick a field and its skills spread out on the right. A skill joined by a line opens once you learn the one before it.',
  '스킬 칸 위에 마우스를 올려 보자. 그 스킬이 무엇을 하는지 바로 옆에 뜬다.':
    'Hover the mouse over a skill slot. What the skill does appears right beside it.',
  '맨 아래 줄은 한 레벨 더 올리면 어떻게 달라지는지다. 끝까지 배운 스킬에는 「최대 레벨」이라고 뜬다.':
    'The bottom line shows what changes if you raise it one more level. A fully learned skill says "Max level".',
  '남은 스킬 포인트는 여기에 보인다. 레벨이 오르거나 면허를 따면 늘어난다.':
    'Your remaining skill points show here. They grow when you level up or earn a licence.',
  '금색 테두리 칸은 지금 배울 수 있는 스킬이다. 칸 귀퉁이의 단추를 눌러 하나 배워 보자.':
    'A gold-framed slot is a skill you can learn now. Press the button on its corner to learn one.',
  '포인트가 생기면 배울 수 있는 칸에 금색 테두리와 단추가 나타난다. 그 단추를 누르면 스킬을 배운다.':
    'When you have points, learnable slots get a gold frame and a button. Press that button to learn the skill.',
};

type SkillRule = [RegExp, (m: RegExpExecArray, tr: (s: string) => string) => string];

/** 수치·이름이 끼는 스킬 창 문장 — en.ts `EN_RULES`에 합류한다 */
export const EN_SKILL_RULES: SkillRule[] = [
  [/^스킬 포인트 (\d+)$/, (m) => `Skill points ${m[1]}`],
  [/^레벨 (\d+) \/ (\d+)$/, (m) => `Level ${m[1]} / ${m[2]}`],
  [/^다음 레벨: (.+)$/s, (m, tr) => `Next level: ${tr(m[1])}`],
  [/^필요 포인트 (\d+)$/, (m) => `Costs ${m[1]} points per level`],
  [/^(남은|쓴|레벨로 얻은|면허로 얻은|그 밖에 얻은) 포인트 (\d+)$/, (m) => {
    const label: Record<string, string> = {
      '남은': 'Points left', '쓴': 'Points spent', '레벨로 얻은': 'From levels',
      '면허로 얻은': 'From licences', '그 밖에 얻은': 'Other rewards',
    };
    return `${label[m[1]] ?? m[1]} ${m[2]}`;
  }],
  [/^먼저 배울 스킬: (.+)$/s, (m, tr) => `Learn first: ${m[1].split(', ').map((p) => {
    const lv = /^(.+) Lv\.(\d+)$/.exec(p);
    return lv ? `${tr(lv[1])} Lv.${lv[2]}` : tr(p);
  }).join(', ')}`],
  [/^열리는 조건: (.+)$/s, (m, tr) => `Opens when: ${m[1].split(' · ').map((p) => tr(p)).join(' · ')}`],
  [/^배운 뒤 (.+)\(으\)로 손에 익혀야 효과가 난다\.$/, (m, tr) => `After learning, it only works once practised through ${m[1].split('·').map((p) => tr(p)).join(', ')}.`],
  [/^숙련 (\d+) \/ (\d+) · 효과 ×([\d.]+)$/, (m) => `Proficiency ${m[1]} / ${m[2]} · effect ×${m[3]}`],
  [/^손에 익히는 법: (.+)$/, (m, tr) => `Practise by: ${m[1].split('·').map((p) => tr(p)).join(', ')}`],
  [/^시너지 해금 — (.+)$/, (m, tr) => `Synergy unlocked — ${m[1].split(' · ').map((p) => tr(p)).join(' · ')}`],
];
