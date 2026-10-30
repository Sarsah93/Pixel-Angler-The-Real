/**
 * @file PlayerAddress.ts
 * @description 290차 — 호칭 규칙: **「OOO 씨」로 통일**한다(사용자 결정 2026-10-30 — 「호칭은 'OOO씨'로 통일하고 나머지 190편 대본 진행해줘」).
 *
 * 왜(288차 사용자 질문 원문): 「나이 및 성별에 따른 NPC를 부르는 호칭(형/형님/언니/누나/누님 등)이 달라질 것 같아.
 *  아니면 … 'OOO씨'로 통일하는 방법도 있고」. 주인공은 남자 · 여자이고 나이도 앞으로 고를 수 있게 된다 —
 *  「형님」 · 「언니」 · 「할머니」처럼 말하는 사람의 나이 · 성별로 갈리는 부름말을 대사에 박아 두면 언젠가 반드시 틀린다.
 *
 * 규칙
 *  1. 주인공 → 인물: 부를 때 · 그 사람을 가리킬 때 **이름 + 씨**(「정옥선 씨」 · 「바람 씨」). 영어는 이름만(`nameEn`).
 *     나이 · 성별 부름말(할머니 · 아저씨 · 형님 · 누나 · 언니 · 오빠 · 삼촌 · 이모 · 어르신)과 직함 부름말(사장님 · 선장님 · 선생님)을
 *     주인공 입에 올리지 않는다. 주인공 자기 집안(「우리 할머니」 · 「제 아버지」)은 그대로 쓴다.
 *  2. 인물 → 주인공: 이름을 부를 때는 자리 표시 `{player} 씨`(그리는 순간 주인공 이름이 들어간다) · 아니면 성별 없는 2인칭
 *     (자네 · 너 · 당신 · 그쪽 — 그 인물의 말투대로). 총각 · 아가씨 · 형 · 언니 · 학생처럼 성별 · 나이로 갈리는 말로 부르지 않는다.
 *  3. 인물 ↔ 인물: 그 사람들끼리의 사이(바람이 해녀를 「누님」이라 부른다)는 인물의 몫이라 그대로 둔다.
 *
 * 자리 표시는 대본 대사 · 고를 말에만 쓴다. 한국어는 늘 `{player} 씨`(조사가 이름 받침에 따라 바뀌지 않게) · 영어는 `{player}`.
 * 일지 글(주인공 1인칭)에는 쓰지 않는다.
 */

/** 주인공 이름 자리 표시(대본 대사 · 고를 말 — 한 · 영 같은 꼴) */
export const PLAYER_TOKEN = '{player}';

/** 그릴 때 자리 표시를 주인공 이름으로 바꾼다(이름이 비면 한국어 「당신」 · 영어 「you」 — 「씨」는 함께 걷는다) */
export function fillPlayerName(text: string, name: string | undefined): string {
  if (!text.includes(PLAYER_TOKEN)) return text;
  const n = (name ?? '').trim();
  if (n) return text.split(PLAYER_TOKEN).join(n);
  return text.replace(/\{player\} 씨/g, '당신').split(PLAYER_TOKEN).join('you');
}

/** 주인공이 입에 올리면 안 되는 부름말(나이 · 성별 · 직함) */
const KIN_WORDS = [
  '할머니', '할머님', '할아버지', '할아버님', '할매', '할배', '아저씨', '아주머니', '아줌마', '어르신',
  '형님', '누님', '누나', '언니', '오빠', '삼촌', '이모', '이모님', '고모', '아버님', '어머님',
  '사장님', '선장님', '선생님', '사모님', '반장님', '계장님', '조합장님', '이장님',
];
/** 「형」은 다른 낱말(지형 · 형편 · 모형) 속에도 있다 — 낱말로 설 때만 */
const HYEONG = /(^|[\s(…,.!?~])형(님)?(?=$|[\s,.!?…~)]|은|이|도|한테|께|이랑|아|이요|요)/;
/** 자기 집안 · 남의 집안을 가리키는 앞말 — 이 뒤의 부름말은 부르는 말이 아니다 */
const OWN = /(우리|제|저희|내|나의|저의|네|너희|댁의?|그쪽|그분의?|따님의|아드님의|손녀의|손주의|손자의|의)\s*$/;

export interface AddressIssue { word: string; at: number; vocative: boolean }

/**
 * 주인공의 말 · 글에서 부름말을 찾는다. `vocative` = 부르는 꼴(줄 머리 · 쉼표 · 느낌표 · 물음표 · 문장 끝 앞) — 틀림이 거의 확실하다.
 * 나머지는 가리키는 말(「할머니께서는 …」) — 그 사람을 이름으로 바꾸거나 「그분」으로 고친다.
 * 자기 집안(「우리 할머니」 · 「제 형」)은 잡지 않는다.
 */
export function playerAddressIssues(text: string): AddressIssue[] {
  const out: AddressIssue[] = [];
  const check = (word: string, at: number, end: number): void => {
    if (OWN.test(text.slice(Math.max(0, at - 8), at))) return;
    // 부르는 꼴 = 부름말 바로 뒤가 쉼표 · 느낌표 · 물음표 · 말줄임 · 문장 끝(마침표 · 글 끝)
    const vocative = /^(\s*$|[,!?~…]|\.(\s|$)|\))/.test(text.slice(end));
    out.push({ word, at, vocative });
  };
  for (const w of KIN_WORDS) {
    let i = text.indexOf(w);
    while (i >= 0) {
      check(w, i, i + w.length);
      i = text.indexOf(w, i + w.length);
    }
  }
  const m = HYEONG.exec(text);
  if (m) {
    const at = m.index + m[1].length;
    check(m[2] ? '형님' : '형', at, at + 1 + (m[2] ? 1 : 0));
  }
  // 같은 자리를 두 번 세지 않는다(형님 · 형)
  const seen = new Set<number>();
  return out.filter((x) => (seen.has(x.at) ? false : (seen.add(x.at), true)));
}

/** 인물이 주인공을 부를 때 쓰면 안 되는 말(성별 · 나이로 갈린다) — 부르는 꼴일 때만 잡는다 */
const TO_PLAYER = /(^|[\s"(])(총각|아가씨|아가|학생|젊은이|청년|색시|도련님|아씨)(\s*[,!?~…]|\s*$|아[,!?\s]|야[,!?\s])/;

/** 인물의 말에서 주인공을 성별 · 나이 부름말로 부르는 꼴을 찾는다 */
export function npcAddressIssue(text: string): string | undefined {
  const m = TO_PLAYER.exec(text);
  return m ? m[2] : undefined;
}

/** 자리 표시 꼴 검사 — 없는 자리 표시 · 한국어는 「{player} 씨」만 */
export function playerTokenIssue(ko: string, en: string): string | undefined {
  const other = /\{(?!player\})[^}]*\}/;
  if (other.test(ko) || other.test(en)) return '자리 표시는 {player}만';
  const k = ko.split(PLAYER_TOKEN).length - 1;
  const e = en.split(PLAYER_TOKEN).length - 1;
  if (k !== (ko.match(/\{player\} 씨/g) ?? []).length) return '한국어 자리 표시는 「{player} 씨」로만';
  if (k > 0 && e === 0) return '영어에도 {player}를 넣는다';
  return undefined;
}
