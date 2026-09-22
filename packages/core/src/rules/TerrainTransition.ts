/**
 * @file TerrainTransition.ts
 * @description 지형 어휘 · 칠하기 순서 · 쌍(pair) 전이 규칙 — 172차.
 *
 * ## 왜 필요했나 (사용자 지적)
 *
 * "실제 지형이라고 생각했을 때, 뜬금없이 벽돌 지형에서 모래 지형으로 바뀐다 …
 *  지형 경계간의 이음 부분이 전혀 고려되어 있지 않은 것 같아."
 *
 * 원인은 셋이었다.
 *
 * **① 어휘가 8글자뿐이고 `'.'`이 쓰레기통이다.** 주차장·마당·공터·광장·자갈밭·갯벌이
 *    전부 `'.'` 하나로 뭉개졌다. 사이에 있어야 할 재료가 어휘에 없으니 포장 옆에 모래가
 *    곧바로 붙는다.
 *
 * **② 접경이 "쌍"이 아니라 "내 바깥 테두리"로 모델링돼 있었다.** 구현은 `edgeTex`를
 *    **내 지형 하나**로 키를 잡고, 잔디는 "나 아닌 전부", 나머지는 "잔디거나 물일 때만"
 *    테두리를 그렸다. 포장↔모래, 흙↔잔디, 자갈↔모래는 **각각 다른 전이**인데 표현할
 *    방법이 없었고, 그래서 106차에 모래를 아예 규칙에서 빼야 했다(검은 계단 윤곽 때문).
 *
 * **③ 사진 셀이 파이프라인 밖으로 빠져나간다.** 물·갯바위·테트라포드·사석·상판은 그려
 *    놓고 접경 로직 **도달 전에 continue** 한다. 질감이 가장 센 재료가 가장 딱딱한 경계를 갖는다.
 *
 * ## 이 모듈이 하는 일
 *
 * 지형마다 **분류(class)와 칠하기 순서(paint)** 를 주고, 두 지형이 만났을 때의 전이를
 * **비대칭 표**로 답한다. "누가 누구 위로 번지는가"를 하드코딩이 아니라 순서에서 유도한다.
 * 렌더러는 이 답을 그림으로 옮기기만 한다.
 *
 * ⚖ **실측(OSM) 기반이라는 제약은 그대로다.** 지형의 경계와 종류는 여전히 실제 지도가 준다.
 *   우리가 보태는 것은 "그 경계가 실제로는 어떻게 생겼는가" 하나뿐이다 — 포장과 모래가
 *   맞닿으면 사이에 흙이 드러나고, 방파제 발치에는 사석이 깔리고, 잔디는 흙 림을 물고 번진다.
 */

// ─────────────────────────────────────────────
// 1. 지형 어휘
// ─────────────────────────────────────────────

/**
 * 지형 분류.
 *  - `water`     물
 *  - `organic`   풀·나무·농경 — 가장자리가 불규칙하게 번진다
 *  - `granular`  모래·갯벌·자갈 — 알갱이가 이웃 위로 흘러나온다
 *  - `bare`      흙·맨땅 — 다른 재료 사이에 끼는 중간 지형
 *  - `built`     포장·차도·보도·광장 — 경계가 연석처럼 날카롭다
 *  - `structure` 방파제·부두 — 물과 만나면 발치(사석)가 생긴다
 *  - `blocked`   건물
 */
export type TerrainClass = 'water' | 'organic' | 'granular' | 'bare' | 'built' | 'structure' | 'blocked';

export interface TerrainDef {
  ch: string;
  nameKo: string;
  nameEn: string;
  cls: TerrainClass;
  /**
   * 칠하기 순서. **큰 값이 작은 값 위로 번진다.**
   * 자연은 인공을 덮고(모래가 포장 위로 흘러나온다), 인공은 자연을 자른다(연석).
   */
  paint: number;
  walkable: boolean;
}

/**
 * 어휘 표.
 * 앞 8종은 기존(101~109차)이고, 뒤 5종이 172차 신설이다 — 전부 OSM 태그에서 직접 나온다
 * (주차장·광장 / 공터·맨땅 / 숲·관목 / 갯벌·습지 / 농경지). 래스터 없이도 결정적으로 나뉜다.
 */
export const TERRAIN_DEFS: readonly TerrainDef[] = Object.freeze([
  { ch: '~', nameKo: '바다', nameEn: 'Water', cls: 'water', paint: 0, walkable: false },
  { ch: '#', nameKo: '건물', nameEn: 'Building', cls: 'blocked', paint: 90, walkable: false },
  { ch: 'r', nameKo: '차도', nameEn: 'Road', cls: 'built', paint: 62, walkable: true },
  { ch: 'w', nameKo: '보도', nameEn: 'Sidewalk', cls: 'built', paint: 58, walkable: true },
  { ch: 'p', nameKo: '포장 광장', nameEn: 'Paved yard', cls: 'built', paint: 54, walkable: true },
  { ch: 'b', nameKo: '방파제', nameEn: 'Pier', cls: 'structure', paint: 66, walkable: true },
  { ch: '.', nameKo: '맨땅', nameEn: 'Ground', cls: 'bare', paint: 40, walkable: true },
  { ch: 'd', nameKo: '흙바닥', nameEn: 'Dirt', cls: 'bare', paint: 38, walkable: true },
  { ch: 's', nameKo: '모래사장', nameEn: 'Sand', cls: 'granular', paint: 30, walkable: true },
  { ch: 't', nameKo: '갯벌', nameEn: 'Tidal flat', cls: 'granular', paint: 26, walkable: true },
  { ch: ',', nameKo: '잔디', nameEn: 'Grass', cls: 'organic', paint: 20, walkable: true },
  { ch: 'c', nameKo: '농경지', nameEn: 'Farmland', cls: 'organic', paint: 18, walkable: true },
  { ch: 'f', nameKo: '숲', nameEn: 'Woodland', cls: 'organic', paint: 16, walkable: true },
]);

const BY_CH = new Map<string, TerrainDef>(TERRAIN_DEFS.map((d) => [d.ch, d]));

export function terrainDef(ch: string): TerrainDef | undefined { return BY_CH.get(ch); }
export function terrainClass(ch: string): TerrainClass { return BY_CH.get(ch)?.cls ?? 'bare'; }
export function terrainPaint(ch: string): number { return BY_CH.get(ch)?.paint ?? 40; }

/** 172차 신설 문자 (구 8글자 맵에는 없다 — 파이프라인 재생성 후 나타난다) */
export const TERRAIN_CHARS_V2 = ['p', 'd', 't', 'c', 'f'] as const;

// ─────────────────────────────────────────────
// 2. 전이 종류
// ─────────────────────────────────────────────

/**
 * 접경 1변의 처리 방식.
 *  - `none`   아무것도 안 한다 (같은 계열끼리 — 밴드·시설이 잇는다)
 *  - `blob`   유기 블롭 오토타일 (흙 림이 곡선 경계를 만든다)
 *  - `curb`   연석 — 크고 또렷한 테두리 셀
 *  - `spill`  알갱이가 이웃 타일 위로 흘러나온다
 *  - `revet`  발치 — 구조물이 물에 잠기는 사면(사석)
 *  - `foam`   포말 — 물가
 */
export type SeamKind = 'none' | 'blob' | 'curb' | 'spill' | 'revet' | 'foam';

export interface SeamRule {
  kind: SeamKind;
  /**
   * 사이에 끼는 중간 지형 문자 (없으면 undefined).
   * 포장과 모래처럼 **서로 붙을 일이 없는 재료**가 맞닿으면 사이에 흙이 드러난다.
   * 렌더러는 주 전이를 그리기 **전에** 이 재료의 얇은 띠를 깐다.
   */
  seamCh?: string;
  /** 번짐 세기 0~1 — 알갱이 띠 폭·밀도의 배율 */
  strength: number;
}

const NONE: SeamRule = { kind: 'none', strength: 0 };

/**
 * `self` 타일이 `other` 이웃과 만났을 때, **self가 그려야 할** 접경 처리.
 *
 * 비대칭이다 — 모래가 포장을 덮지, 포장이 모래를 덮지 않는다. 그래서 한 변의 두 방향이
 * 서로 다른 답을 낸다(`seamBetween('.', 's')` = 알갱이를 받는다 / `seamBetween('s', '.')` = 없다).
 * 이게 106차에 모래를 규칙에서 통째로 빼야 했던 문제의 정면 해결이다.
 */
export function seamBetween(self: string, other: string): SeamRule {
  if (self === other) return NONE;
  const a = BY_CH.get(self), b = BY_CH.get(other);
  if (!a || !b) return NONE;

  // ── 물가 ──
  if (b.cls === 'water') {
    if (a.cls === 'structure') return { kind: 'revet', strength: 1 };
    if (a.cls === 'granular') return { kind: 'foam', strength: 1 };
    if (a.cls === 'organic' || a.cls === 'bare') return { kind: 'foam', strength: 0.65 };
    return { kind: 'curb', strength: 0.8 };          // 안벽
  }
  if (a.cls === 'water') return NONE;                 // 물 타일은 사진 셀이 전담한다
  if (a.cls === 'blocked' || b.cls === 'blocked') return NONE;

  // ── 유기 지형은 스스로 번진다 (블롭이 곡선 경계를 만든다) ──
  if (a.cls === 'organic') return { kind: 'blob', strength: 1 };

  // ── 알갱이 지형은 낮은 쪽으로 흘러나온다 ──
  //   내가 알갱이고 상대가 나보다 "위"(인공)면 내가 흘러가는 쪽이 아니라 상대가 받는 쪽이다.
  if (a.cls === 'granular') {
    if (b.cls === 'organic') return NONE;             // 잔디 블롭이 이미 곡선을 만든다
    return NONE;                                       // 흘러나가는 그림은 받는 타일이 그린다
  }

  // ── 인공·맨땅이 받는 쪽 ──
  if (b.cls === 'granular') {
    // 포장과 모래는 서로 붙을 일이 없는 재료다 — 사이에 흙이 드러난다.
    const gap = a.paint - b.paint;
    const seamCh = a.cls === 'built' && gap >= 20 ? 'd' : undefined;
    return { kind: 'spill', seamCh, strength: 1 };
  }
  if (b.cls === 'organic') {
    // 밭·숲·풀밭 가장자리에서는 **흙과 잎이 딸려 나온다**. 잔디는 블롭 셀이 곡선을 만들므로
    // 그 위에 옅게만 얹고, 블롭 셀이 없는 숲·농경지는 이 띠가 경계 전부를 맡는다.
    return { kind: 'spill', strength: other === ',' ? 0.45 : 0.8 };
  }
  if (a.cls === 'built' && b.cls === 'bare') return { kind: 'curb', strength: 0.6 };
  if (a.cls === 'bare' && b.cls === 'built') return NONE;
  if (a.cls === 'structure' || b.cls === 'structure') return NONE;  // 상판끼리·시설이 잇는다

  return NONE;                                          // 인공끼리 = 무테 (벡터 밴드가 잇는다)
}

/**
 * 두 지형이 맞닿아도 **되는가**. false면 사이에 중간 지형이 끼어야 한다.
 * 파이프라인(맵 빌더)이 실측 경계를 유지한 채 한 줄만 삽입할 때 쓴다.
 */
export function needsInterstitial(a: string, b: string): string | null {
  return seamBetween(a, b).seamCh ?? seamBetween(b, a).seamCh ?? null;
}

// ─────────────────────────────────────────────
// 3. 렌더 그룹 — 접경 판정을 묶는 단위
// ─────────────────────────────────────────────

/**
 * 접경 판정용 그룹.
 * 차도·보도·광장은 **벡터 밴드가 위에 곡선으로 그리므로** 래스터 단계에서는 맨땅과 한 군으로
 * 취급한다(101차 후속 5). 그 밖에는 문자가 곧 군이다.
 */
export function terrainGroup(ch: string): string {
  return ch === 'r' || ch === 'w' || ch === 'p' ? '.' : ch;
}
