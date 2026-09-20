/**
 * @file ItemDetailPanel.ts
 * @description 아이템 상세 정보 팝업 (우클릭 → 상세보기 / 상점 아이콘 우클릭)
 *
 * 상세 스펙은 모노레포 물리 설계(캐스팅/수중 물리, 채비 파라미터)와
 * 구현계획서 내용을 토대로 추론한 목업 값 — 추후 @tra/core DB 정식 연동 시 교체.
 */

import Phaser from 'phaser';
import { ensurePixelIcon } from './PixelIcon.js';
import { getNuisance, sashimiStarsAt, sashimiNutrition, foodNutritionOf, nutritionLineKo, restoreFromNutrition } from '@tra/core';
import { FISH_DATABASE, fishImageSizeScale, fishRarity, speciesStandardWeightG,
  GEAR_FAULTS, gearRepairFee, rodMaxCasts,
  getFireRecipe, getCookIngredient, dishStarsAt, dishVitalsMult, fmtUnits, SALT_LABEL_KO, SUGAR_LABEL_KO, STAR_NAME_KO,
  fatnessLabel, textureLabel, fishinessLabel, flavorLabel, FOOD_EFFECT_KIND_KO } from '@tra/core';
import { CookingStore } from '../store/CookingStore.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../PhaserConfig.js';
import { DraggablePanel } from './DraggablePanel.js';
import { clampTextWidth } from './TextFit.js';
import { createItemIcon } from './ItemIcon.js';
import { resolveFishTexture } from '../data/FishTextures.js';
import {
  InvItem, InventoryStore, CONDITION_LABEL, CONDITION_COLOR, CONDITION_DESC,
  CONDITION_NEXT, refreshCondition, conditionRemainMs, formatDhms, plateWipProgress,
} from '../store/InventoryStore.js';

/** 서식 수층 표기 */
const LAYER_LABEL: Record<'surface' | 'mid' | 'bottom', string> = {
  surface: '상층', mid: '중층', bottom: '바닥층',
};

export interface ItemDetailRow {
  label: string;
  value: string;
  /** 값 글자색 오버라이드 (희귀도 등급 등) */
  color?: string;
}

export interface ItemDetailData {
  title: string;
  subtitle: string;
  rows: ItemDetailRow[];
  desc: string;
}

/** 상세 정보에서 수치를 빠르게 읽을 수 있는 5칸 별 표시. */
const qualityStars = (value: number): string => {
  const n = Math.max(0, Math.min(5, Math.round(value)));
  return `${'★'.repeat(n)}${'☆'.repeat(5 - n)}`;
};

const scoreStars = (value: number): number => Math.max(0, Math.min(5, Math.round(value / 20)));

const LINE_MATERIAL_LABEL: Record<NonNullable<InvItem['lineMaterial']>, string> = {
  nylon: '나일론 모노', fluorocarbon: '카본(플루오로카본)', pe_braid: '합사(PE)', monofilament: '모노라인',
};
const LINE_FORM_LABEL: Record<NonNullable<InvItem['lineForm']>, string> = {
  float: 'Float (부유)', 'semi-float': 'Semi-Float (반부유)', suspend: 'Suspend (중층 유지)', sinking: 'Sinking (침강)',
};

/** 아이템 종류별 상세 스펙 추론 생성 (목업) — 어획물은 개체 실측치·어종 정보(FISH_DATABASE) 표시 */
export function buildItemDetail(item: Pick<InvItem, 'id' | 'name' | 'subCategory' | 'category' | 'qty' | 'basePrice' | 'condition' | 'conditionSinceMs' | 'speciesId' | 'lengthCm' | 'weightG' | 'floatBuoyG' | 'plateWip' | 'fault' | 'useCount' | 'tool' | 'bound' | 'dish' | 'dishInstance' | 'sashimi' | 'cutQuality' | 'hungerRestore' | 'hydrationRestore' | 'hpRestore' | 'fatigueRestore' | 'lineMaterial' | 'lineForm' | 'lineLengthM' | 'lineNo' | 'lineDiameterMm' | 'lineStrengthLb' | 'sinkerKind' | 'sinkerWeightG' | 'sinkerHo'>): ItemDetailData {
  const rows: ItemDetailRow[] = [];
  let desc = '';
  // 155차 — 완성 사시미 접시: 맛 별 5개(지금 / 담은 직후) — 불요리와 같은 문법
  if (item.sashimi) {
    const m = item.sashimi;
    const now = sashimiStarsAt(m, item.condition, Date.now());
    const base = sashimiStarsAt(m, 'fresh', m.madeAtMs);
    const ageMin = Math.max(0, Math.round((Date.now() - m.madeAtMs) / 60_000));
    const col = (n: number): string => (n >= 5 ? '#ffd257' : n >= 3 ? '#8affb0' : '#ff9a5a');
    rows.push({ label: '완성도 (지금)', value: `${qualityStars(now.stars)} · ${now.total}점`, color: col(now.stars) });
    rows.push({ label: '완성도 (담은 직후)', value: `${qualityStars(base.stars)} · ${base.total}점` });
    for (const pp of now.parts) rows.push({ label: pp.labelKo, value: qualityStars(scoreStars(pp.score * 100)), color: pp.earned ? '#8affb0' : '#ff9a5a' });
    rows.push({ label: '구성', value: `${m.mode === 'advanced' ? '고급' : '일반'} · ${m.species.length >= 2 ? '모듬' : '단품'} · ${m.pieces}점 · ${m.totalG}g` });
    rows.push({ label: '칼', value: m.knifeTier === 'yanagiba' ? '야나기바' : m.knifeTier === 'sashimi' ? '회칼' : '막칼' });
    rows.push({ label: '담은 뒤 경과', value: ageMin < 60 ? `${ageMin}분` : `${Math.floor(ageMin / 60)}시간 ${ageMin % 60}분` });
    const nut = sashimiNutrition(m.totalG);
    rows.push({ label: '영양', value: nutritionLineKo(nut) });
    const rs = restoreFromNutrition(nut);
    rows.push({ label: '섭취 효과', value: `허기 +${rs.hungerRestore} · 수분 +${rs.hydrationRestore}` });
    rows.push({ label: '판매가', value: `${InventoryStore.getSellPrice({ ...item, qty: 1 } as InvItem).toLocaleString()}원` });
    rows.push({ label: '보유 수량', value: `${item.qty}개` });
    desc = '신선도·식감은 담은 뒤 시간이 갈수록 떨어집니다. 다섯 항목 중 하나라도 모자라면 다섯째 별(완성도)은 켜지지 않습니다. 회는 바로 먹거나 파는 게 가장 좋습니다.';
    if (item.condition) desc += `\n[${CONDITION_LABEL[item.condition]}] ${CONDITION_DESC[item.condition]}`;
    return { title: item.name, subtitle: '요리(회) 접시', rows, desc };
  }
  // 155차 — 음식의 실질량·열량·수분 → 허기·수분 회복은 하루 필요량 대비 비율(2,400 kcal · 2,000 ml)
  const nutrition = foodNutritionOf(item.id);
  if (nutrition && item.category === 'food') {
    rows.push({ label: '영양', value: nutritionLineKo(nutrition) });
    const eff: string[] = [];
    if (item.hungerRestore) eff.push(`허기 ${item.hungerRestore > 0 ? '+' : ''}${item.hungerRestore}`);
    if (item.hydrationRestore) eff.push(`수분 ${item.hydrationRestore > 0 ? '+' : ''}${item.hydrationRestore}`);
    if (item.hpRestore) eff.push(`체력 +${item.hpRestore}`);
    if (item.fatigueRestore) eff.push(`피로 -${item.fatigueRestore}`);
    if (eff.length) rows.push({ label: '섭취 효과', value: eff.join(' · ') });
    rows.push({ label: '열량당 가격', value: `${Math.round(item.basePrice / Math.max(1, nutrition.kcal) * 100).toLocaleString()}원 / 100 kcal` });
  }
  // 141차 — 귀속 장비: 이야기가 준 물건. 판매·양도 불가를 맨 위에
  if (item.bound) rows.push({ label: '귀속', value: '이야기가 준 물건 — 판매·양도 불가' });

  // ── 136차 장비 상태 — 고장·파손과 내구도를 **최상단**에 (슬롯 우하단 경고 배지와 같은 사실) ──
  if (item.fault) {
    const def = GEAR_FAULTS[item.fault];
    rows.push({ label: '상태', value: `${def.labelKo}${def.usable ? '' : ' — 사용불가'}` });
    const fee = gearRepairFee(item.fault, item.basePrice ?? 0);
    rows.push({
      label: '수리',
      value: def.repair === 'none' ? '불가 (폐기)'
        : def.repair === 'self_or_shop' ? `자가 가능 · 수리점 ${fee.toLocaleString()}원`
          : `수리점 ${fee.toLocaleString()}원`,
    });
    if (def.biteMult) rows.push({ label: '입질 확률', value: `×${def.biteMult.toFixed(2)} (성능 저하)` });
  }
  if (item.tool === 'rod' || item.subCategory === '릴') {
    const mx = rodMaxCasts(item.basePrice ?? 12000);
    const used = item.useCount ?? 0;
    rows.push({ label: '내구도', value: `${Math.max(0, mx - used)} / ${mx} 회` });
    if (used >= mx) rows.push({ label: '마모', value: '한계 초과 — 고장이 잦아집니다' });
  }

  // 156차 — 요리 개체(변형 레시피): 주재료·프로필 라벨·영양·효과·조리 품질 (§29 템플릿 — 원 수치 노출 금지)
  if (item.dish && item.dishInstance) {
    const inst = item.dishInstance;
    const recipe = getFireRecipe(inst.recipeId);
    const stars = CookingStore.starsOfItem(item);
    if (recipe && stars) {
      const ip = inst.ingredientProfile;
      const q = inst.quality;
      const starsOf = (v: number): number => Math.max(1, Math.min(5, Math.round(v / 20)));
      const baseStars = dishStarsAt(item.dish, recipe, item.dish.cookedAtMs);
      const qColor = (v: number): string => v >= 80 ? '#8affb0' : v >= 50 ? '#ffd257' : '#ff9a5a';
      if (inst.modifier === 'burnt') rows.push({ label: '상태', value: '탔다 — 가치 없음', color: '#ff5a4a' });
      rows.push({ label: '주재료', value: ip.primaryNameKo ? `${ip.primaryNameKo} · ${ip.weightG}g` : `${ip.weightG}g` });
      rows.push({ label: '재료 신선도', value: qualityStars(starsOf(q.freshness)), color: qColor(q.freshness) });
      rows.push({ label: '지방감', value: fatnessLabel(ip.fatness) });
      rows.push({ label: '식감', value: textureLabel(ip.texture) });
      rows.push({ label: '비린 향', value: fishinessLabel(ip.fishiness) });
      rows.push({ label: '풍미', value: flavorLabel(ip.flavorStrength) });
      rows.push({ label: '영양', value: `허기 +${inst.result.hungerRestore} · 수분 +${inst.result.hydrationRestore}` });
      if (inst.result.effects.length) {
        for (const e of inst.result.effects) rows.push({ label: `효과 · ${e.nameKo}`, value: e.descKo, color: '#8fd4ff' });
      } else {
        rows.push({ label: '효과', value: inst.modifier === 'burnt' ? '없음 — 탄 요리' : '없음 — 품질이 낮습니다' });
      }
      rows.push({ label: '간', value: `${qualityStars(scoreStars(q.seasoning))} · ${q.seasoning}점` });
      rows.push({ label: '온도', value: `${qualityStars(scoreStars(q.temperature))} · ${q.temperature}점` });
      rows.push({ label: '식감', value: `${qualityStars(scoreStars(q.texture))} · ${q.texture}점` });
      rows.push({ label: '완성도', value: `${qualityStars(scoreStars(q.completion))} · ${q.completion}점`, color: qColor(q.completion) });
      rows.push({ label: '종합 완성도', value: `${qualityStars(stars.stars)} · ${Math.round(stars.total)}점`, color: qColor(q.overall) });
      rows.push({ label: '완성도 (완성 직후)', value: `${qualityStars(baseStars.stars)} · ${Math.round(baseStars.total)}점` });
      rows.push({ label: '판매가', value: inst.modifier === 'burnt' ? '0원' : `${InventoryStore.getSellPrice({ ...item, qty: 1 } as InvItem).toLocaleString()}원` });
      rows.push({ label: '보유 수량', value: `${item.qty}개` });
      const effKinds = inst.result.effects.map((e) => FOOD_EFFECT_KIND_KO[e.kind]).join(' · ');
      desc = inst.result.descriptionKo + (effKinds ? `\n먹으면 ${effKinds} 효과가 얼마간 이어집니다.` : '')
        + '\n온도·식감·신선도는 완성 직후부터 시간이 지날수록 떨어지고, 완성도와 판매가도 함께 내려갑니다.';
      if (item.condition) desc += `\n[${CONDITION_LABEL[item.condition]}] ${CONDITION_DESC[item.condition]}`;
      return { title: item.name, subtitle: '요리', rows, desc };
    }
  }

  // 154차 — 완성 요리: 맛 별 5개(간·온도·식감·신선도·완성도)와 시간 감쇠를 그대로 보여준다
  if (item.dish) {
    const dish = item.dish;
    const recipe = getFireRecipe(dish.recipeId);
    const stars = CookingStore.starsOfItem(item);
    if (recipe && stars) {
      const tempKo = stars.tempLabel === 'hot' ? '뜨겁다' : stars.tempLabel === 'warm' ? '미지근하다' : '식었다';
      const ageMin = Math.max(0, Math.round((Date.now() - dish.cookedAtMs) / 60_000));
      const baseStars = dishStarsAt(dish, recipe, dish.cookedAtMs);
      const ok = (i: number): string => stars.earned[i] ? '#8affb0' : '#ff9a5a';
      rows.push({ label: '요리', value: `${recipe.nameKo} · ${dish.servings}인분` });
      if (dish.burnt) rows.push({ label: '상태', value: '탔다 — 가치 없음', color: '#ff5a4a' });
      rows.push({ label: '완성도 (지금)', value: `${qualityStars(stars.stars)} · ${Math.round(stars.total)}점`, color: stars.stars >= 5 ? '#ffd257' : stars.stars >= 3 ? '#8affb0' : '#ff9a5a' });
      rows.push({ label: '완성도 (완성 직후)', value: `${qualityStars(baseStars.stars)} · ${Math.round(baseStars.total)}점` });
      const salt = SALT_LABEL_KO[dish.saltLabel];
      const sugar = SUGAR_LABEL_KO[dish.sugarLabel];
      rows.push({ label: STAR_NAME_KO[0], value: `${qualityStars(scoreStars(stars.scores.season * 100))} — ${salt}${sugar ? ` · ${sugar}` : ''}`, color: ok(0) });
      rows.push({ label: STAR_NAME_KO[1], value: `${qualityStars(scoreStars(stars.scores.temp * 100))} — ${tempKo} (${Math.round(stars.tempC)}°C)`, color: ok(1) });
      rows.push({ label: STAR_NAME_KO[2], value: qualityStars(scoreStars(stars.scores.texture * 100)), color: ok(2) });
      rows.push({ label: STAR_NAME_KO[3], value: qualityStars(scoreStars(stars.scores.fresh * 100)), color: ok(3) });
      rows.push({ label: STAR_NAME_KO[4], value: qualityStars(scoreStars(stars.scores.finish * 100)), color: ok(4) });
      const ingNames = dish.contents.map((c) => {
        const d = getCookIngredient(c.ing);
        return d ? `${d.nameKo} ${fmtUnits(d.unit, c.units)}` : c.ing;
      });
      // 재료가 많으면 한 행에 못 담는다 — 3개씩 끊어 이어지는 행으로(라벨은 첫 행만)
      if (ingNames.length === 0) rows.push({ label: '재료 구성', value: '없음' });
      for (let i = 0; i < ingNames.length; i += 3) rows.push({ label: i === 0 ? '재료 구성' : '', value: ingNames.slice(i, i + 3).join(', ') });
      rows.push({ label: '조리한 곳', value: dish.stoveKind === 'home' ? '집 주방' : '현장 화구' });
      rows.push({ label: '조리 후 경과', value: ageMin < 60 ? `${ageMin}분` : `${Math.floor(ageMin / 60)}시간 ${ageMin % 60}분` });
      rows.push({ label: '섭취 효과', value: `허기·수분 회복 ×${dishVitalsMult(dish, stars).toFixed(2)}` });
      rows.push({ label: '판매가', value: dish.burnt ? '0원' : `${InventoryStore.getSellPrice({ ...item, qty: 1 } as InvItem).toLocaleString()}원` });
      rows.push({ label: '보유 수량', value: `${item.qty}개` });
      desc = recipe.descKo + '\n온도·식감·신선도는 완성 직후부터 시간이 지날수록 떨어지고, 완성도와 판매가도 함께 내려갑니다. 뜨거울 때 먹거나 파는 게 가장 좋습니다.';
      if (item.condition) desc += `\n[${CONDITION_LABEL[item.condition]}] ${CONDITION_DESC[item.condition]}`;
      return { title: item.name, subtitle: '요리', rows, desc };
    }
  }

  // 미완성 사시미 접시 — 진행률을 최상단에 (135차). 이어 담기/판매 불가 안내는 desc로.
  if (item.plateWip) {
    const pr = plateWipProgress(item.plateWip);
    const species = new Set(item.plateWip.quads.flat().map((q) => q.speciesId).filter(Boolean));
    rows.push(
      { label: '접시 크기', value: `${item.plateWip.size} (방위당 ${pr.total / 4}점)` },
      { label: '플레이팅 진행', value: `${pr.placed} / ${pr.total}점 (${pr.pct}%)`, color: pr.pct >= 100 ? '#4af2a1' : '#ffd257' },
      { label: '담긴 어종', value: species.size ? `${species.size}종` : '없음' },
      { label: '판매', value: '불가 — 완성해야 값이 매겨집니다', color: '#ff9a5a' },
    );
    if (item.weightG) rows.push({ label: '담긴 중량', value: `${item.weightG} g` });
    rows.push({ label: '보관 환경', value: '상온 · 쿨러(해수/얼음)는 규칙별 정지' });
    rows.push({ label: '보유 수량', value: `${item.qty}개` });
    desc = '담다 만 사시미 접시입니다. 요리(U) 창 도마의 [사시미 만들기] 영역에 다시 올리면\n담던 자리에서 이어서 채울 수 있습니다. 조각만 되찾으려면 우클릭 [해체하기].\n신선도는 담긴 조각 중 가장 먼저 상하는 것을 그대로 따라갑니다.';
    if (item.condition) desc += `\n[${CONDITION_LABEL[item.condition]}] ${CONDITION_DESC[item.condition]}`;
    return { title: item.name, subtitle: '미완성 접시', rows, desc };
  }

  switch (item.subCategory) {
    case '손도구':
      if (item.id === 'inv_net' || item.name.includes('뜰채')) {
        rows.push(
          { label: '길이', value: '5.0 m' },
          { label: '랜딩 성공 보정', value: '+15%' },
          { label: '착용 방식', value: '왼손/오른손 선택 착용' },
        );
        desc = '파이팅 마무리 단계에서 대상어를 안전하게 끌어올립니다.';
      } else {
        rows.push(
          { label: '로드 탄성 계수 (k_rod)', value: '0.82' },
          { label: '길이', value: '5.3 m' },
          { label: '허용 추 부하', value: '최대 25 g' },
          { label: '착용 방식', value: '왼손/오른손 선택 착용' },
        );
        desc = '물고기의 인장력 벡터를 휨새로 분산합니다. 손에 착용해야 캐스팅할 수 있습니다.';
      }
      break;
    case '안경':
      rows.push(
        { label: '시각 벡터 필터', value: '수면 반사광 제거' },
        { label: '투영 정보', value: 'Zone 1~3 수심 경계선 / 여밭 영역' },
      );
      desc = '기상 일조량 기준 반사광을 걷어내고 바다 구역별 수심 경계와 물속 여밭 충돌 영역을 표시합니다.';
      break;
    case '신발':
      rows.push(
        { label: '접지 마찰 계수 (μ)', value: '0.85' },
        { label: '효과', value: '갯바위 미끄러짐 방지' },
      );
      desc = '파도가 들이치는 연안 갯바위에서 강풍/파도 디버프를 무효화합니다.';
      break;
    case '모자': case '상의': case '장갑': case '하의':
      rows.push(
        { label: '보온/보호', value: '+5' },
        { label: '피로도 누적 감소', value: '-3%' },
      );
      desc = '장시간 출조 시 체온 저하와 피로도 누적을 완화합니다.';
      break;
    case '시계':
      rows.push(
        { label: '기능', value: '물때 사이클 실시간 표시' },
        { label: '조석 해석 보조', value: '+2' },
      );
      desc = '현재 물때와 다음 조류 변화 시각을 손목에서 바로 확인합니다.';
      break;
    case '릴':
      rows.push(
        { label: '기어비', value: '5.2 : 1' },
        { label: '최대 드랙 장력 (T_drag)', value: '5.0 kg' },
        { label: '권사량', value: '나일론 2호 150m' },
      );
      desc = '드랙을 원줄 한계 장력보다 낮게 설정해야 줄 터짐 전에 릴이 풀려나갑니다.';
      break;
    case '집어제/밑밥':
      rows.push(
        { label: '집어 반경', value: '+2.5 m' },
        { label: '지속 시간', value: '90초' },
      );
      desc = '포인트 주변 어군 활성도를 일시적으로 끌어올립니다.';
      break;
    case '스프레이/오일':
      rows.push(
        { label: '효과', value: '라인/릴 마찰 감소' },
        { label: '지속 시간', value: '10분' },
      );
      desc = '캐스팅 비거리와 릴링 감도를 소폭 개선합니다.';
      break;
    case '장비 수리':
      rows.push({ label: '내구도 회복', value: '+30' });
      desc = '손상된 로드/릴의 내구도를 현장에서 회복합니다.';
      break;
    case '의약품':
      if (item.id === 'inv_potion') rows.push({ label: 'HP 회복', value: '+40' });
      else if (item.id === 'inv_seasick') rows.push({ label: '멀미 내성', value: '10분 (선상 낚시)' }, { label: '파도 저항력', value: '+20%' });
      else rows.push({ label: '출혈/상처 회복', value: '+상태이상 해제' });
      desc = '출조 중 신체 상태를 관리합니다.';
      break;
    case '야간 대비':
      rows.push({ label: '효과', value: '야간 모기 디버프 방지' }, { label: '지속 시간', value: '30분' });
      desc = '야간 낚시 시 집중력 저하 디버프를 차단합니다.';
      break;
    case '가공품':
      if (!nutrition) rows.push({ label: '섭취 효과', value: '허기·수분 회복' });
      rows.push({ label: '보존성', value: '부패 없음' });
      desc = nutrition ? '한 끼는 하루 필요 열량의 3분의 1(≈800 kcal)입니다. 간식은 그보다 훨씬 적습니다.' : '오래 보관할 수 있는 비상 식량입니다.';
      break;
    case '해파리':
    case '불가사리': {
      // 138차 — 과증식 해양생물. 어종 DB가 아니라 `MARINE_NUISANCES`를 읽는다.
      const nu = item.speciesId ? getNuisance(item.speciesId) : undefined;
      if (item.lengthCm) {
        rows.push({ label: nu?.kind === 'jellyfish' ? '우산 지름' : '크기', value: `${item.lengthCm} cm` });
      }
      if (item.weightG) {
        rows.push({ label: '무게', value: item.weightG >= 1000 ? `${(item.weightG / 1000).toFixed(2)} kg` : `${item.weightG} g` });
      }
      if (nu) {
        rows.push({ label: '학명', value: nu.scientificName });
        rows.push({ label: '영문명', value: nu.nameEn });
        rows.push({ label: '과증식', value: `${nu.bloomMonths.join('·')}월 (정점 ${nu.peakMonths.join('·')}월)` });
        rows.push({
          label: '독성',
          value: ['없음', '경미 — 따끔함', '통증·부종', '위험 — 통증과 부종이 오래 간다'][nu.venom],
          color: nu.venom >= 2 ? '#ff8a5a' : undefined,
        });
        rows.push({ label: '구별', value: nu.markKo });
        rows.push({ label: '서식', value: nu.habitatKo });
        rows.push({ label: '피해', value: nu.damageKo });
        rows.push({
          label: '구제 수매',
          value: nu.cullPricePerKg > 0 ? `${nu.cullPricePerKg.toLocaleString()}원/kg` : '수매 대상 아님 — 방생 권장',
          color: nu.cullPricePerKg > 0 ? '#ffd93b' : '#8fa3b8',
        });
        rows.push({ label: '식용', value: nu.edible ? '가능 (염장)' : '불가' });
        desc = nu.descKo;
      }
      break;
    }
    case '어획물': {
      // ── 개체 실측치 — 무게 미저장 시 **어종별 LWR**(W = a·L^b)로 추정 (133차) ──
      const lengthCm = item.lengthCm;
      const weightG = item.weightG
        ?? (lengthCm ? Math.round(speciesStandardWeightG(item.speciesId ?? '', lengthCm)) : undefined);
      // 희귀도(116차 ⑤) — 평균 개체 대비 길이 비율 6단계, 등급 색으로 표기
      if (lengthCm && item.speciesId) {
        const rr = fishRarity(item.speciesId, lengthCm);
        rows.push({ label: '희귀도', value: `${rr.ratio.toFixed(2)}×, ${rr.label}`, color: rr.color });
      }
      if (lengthCm) rows.push({ label: '길이', value: `${lengthCm} cm` });
      if (weightG) {
        rows.push({ label: '무게', value: weightG >= 1000 ? `${(weightG / 1000).toFixed(2)} kg` : `${weightG} g` });
      }
      // 비만도(133차) — 같은 길이의 표준 무게 대비. 계절(겨울 영양)·산란 상태·개체차로 갈린다
      if (item.weightG && lengthCm && item.speciesId) {
        const std = speciesStandardWeightG(item.speciesId, lengthCm);
        const pct = std > 0 ? item.weightG / std : 1;
        if (Math.abs(pct - 1) >= 0.04) {
          const fat = pct >= 1.12 ? '아주 통통함' : pct >= 1.04 ? '통통함'
            : pct <= 0.88 ? '많이 여윔' : '여윔';
          rows.push({
            label: '비만도',
            value: `${Math.round(pct * 100)}% · ${fat}`,
            color: pct >= 1.04 ? '#ffd93b' : '#8fa3b8',
          });
        }
      }
      // ── 어종 정보 (FISH_DATABASE 조회 — 학명/영문명/제철/서식) ──
      const sp = item.speciesId ? FISH_DATABASE.find((f) => f.id === item.speciesId) : undefined;
      if (sp) {
        if (lengthCm && sp.maxRecordCm > 0) {
          rows.push({ label: '최대어 대비', value: `${Math.min(100, Math.round((lengthCm / sp.maxRecordCm) * 100))}%` });
        }
        rows.push({ label: '학명', value: sp.scientificName });
        rows.push({ label: '영문명', value: sp.nameEn });
        if (sp.peakSeasonMonths.length > 0) {
          rows.push({ label: '제철', value: `${sp.peakSeasonMonths.join('·')}월` });
        }
        rows.push({ label: '서식', value: `${sp.preferredDepthM[0]}~${sp.preferredDepthM[1]}m · ${LAYER_LABEL[sp.swimmingLayer]}` });
      }
      rows.push(
        { label: '신선도 감쇄', value: '시간당 -4 (상온 기준)' },
        { label: '요리 버프', value: '고신선도 요리 시 근력 1.5배 (10분)' },
      );
      // 어종 습성 설명이 있으면 그것을 우선 표시
      desc = sp?.description
        ?? '보관 환경(쿨러/기온)에 따라 신선도가 실시간으로 깎입니다. 직판장에 판매하거나 요리에 사용하세요.';
      break;
    }
    case '식자재':
      rows.push({ label: '용도', value: '요리 재료' });
      desc = '요리하기(U)에서 어획물과 조합해 사용합니다.';
      break;
    case '생미끼':
      rows.push(
        { label: '집어력', value: 'A (감성돔/노래미)' },
        { label: '신선도 감쇄', value: '분당 -1 (활성 유지 시 입질 +25%)' },
      );
      desc = '살아있는 미끼는 입질 보정이 가장 높지만 신선도 관리가 필요합니다.';
      break;
    case '냉동미끼':
      rows.push(
        { label: '집어력', value: 'B (범용)' },
        { label: '입질 보정', value: '냉동 -50% (해동 후 회복)' },
      );
      desc = '보관이 쉬운 범용 미끼입니다. 해동 상태에 따라 입질이 달라집니다.';
      break;
    case '선어미끼':
      rows.push({ label: '집어력', value: 'B (갈치/우럭)' }, { label: '입질 보정', value: '냉장 기준 표준' });
      desc = '절단 생선 미끼 — 야간 갈치 낚시에 유효합니다.';
      break;
    case '원줄 스풀':
      rows.push(
        { label: '재질', value: item.lineMaterial ? LINE_MATERIAL_LABEL[item.lineMaterial] : 'PE 합사' },
        { label: '라인 형태', value: item.lineForm ? LINE_FORM_LABEL[item.lineForm] : 'Sinking (침강)' },
        { label: '호수', value: item.lineNo !== undefined ? `${item.lineNo}호` : '1호' },
        { label: '스풀 길이', value: item.lineLengthM !== undefined ? `${item.lineLengthM}m` : '-' },
        { label: '직경', value: item.lineDiameterMm !== undefined ? `${item.lineDiameterMm.toFixed(3)}mm` : '-' },
        { label: '인장 강도', value: item.lineStrengthLb !== undefined ? `${item.lineStrengthLb}lb` : '-' },
      );
      desc = item.lineMaterial === 'pe_braid'
        ? '늘어남이 적어 입질 전달과 바닥 감도가 좋지만, 쓸림과 매듭에 약하므로 카본 또는 나일론 쇼크리더와 함께 사용하세요.'
        : '라인의 신축성과 쓸림 내성을 고려해 낚시 장르에 맞는 형태를 선택하세요.';
      break;
    case '목줄 스풀':
      rows.push(
        { label: '재질', value: item.lineMaterial ? LINE_MATERIAL_LABEL[item.lineMaterial] : item.id.includes('carbon') ? '카본 (내마모)' : '나일론 (신축)' },
        { label: '라인 형태', value: item.lineForm ? LINE_FORM_LABEL[item.lineForm] : 'Suspend (중층 유지)' },
        { label: '호수', value: item.lineNo !== undefined ? `${item.lineNo}호` : item.id.includes('carbon') ? '1.5호' : '2호' },
        { label: '스풀 길이', value: item.lineLengthM !== undefined ? `${item.lineLengthM}m` : '-' },
        { label: '직경', value: item.lineDiameterMm !== undefined ? `${item.lineDiameterMm.toFixed(3)}mm` : '-' },
        { label: '인장 강도', value: item.lineStrengthLb !== undefined ? `${item.lineStrengthLb}lb` : '-' },
      );
      desc = '원줄의 감도와 대상어의 이빨·여밭 쓸림 사이를 조정하는 쇼크리더입니다.';
      break;
    case '바늘/훅':
      rows.push(
        { label: '규격', value: item.name.includes('3호') ? '감성돔 3호' : item.name },
        { label: '대상어 한계 중량', value: '5 kg' },
      );
      desc = '대상 어종과 미끼 크기에 맞는 바늘을 선택하세요.';
      break;
    case '채비 부속':
      if (item.name.includes('수중찌')) {
        rows.push(
          { label: '침력', value: item.floatBuoyG !== undefined ? `${item.floatBuoyG} g 상당` : '-0.8호' },
          { label: '역할', value: '조류 태우기 / 채비 하강 유도 (선택 부품)' },
        );
        desc = '부력찌의 부력에 마이너스로 작용해 찌는 수면에 세우고 채비만 내립니다.';
      } else if (item.name.includes('찌')) {
        rows.push(
          { label: '부력 (b)', value: item.floatBuoyG !== undefined ? `${item.floatBuoyG >= 0 ? '+' : ''}${item.floatBuoyG} g 상당` : '+0.8호' },
          { label: '역할', value: '어신 감지 / 채비 수심 유지' },
        );
        desc = item.name.includes('잠길찌')
          ? '잔존 부력이 마이너스인 찌 — 캐스팅 후 천천히 잠기며 흘립니다.'
          : item.name.includes('제로찌')
            ? '잔존 부력 0 — 수중찌 없이 상층을 천천히 공략하는 찌입니다.'
            : '면사매듭 위치까지 채비를 지탱하는 부력체입니다.';
      } else if (item.sinkerKind) {
        rows.push(
          { label: '형태', value: item.sinkerKind === 'ring' ? '원형 고리봉돌' : item.sinkerKind === 'hole' ? '기둥형 구멍봉돌' : '묶음추 봉돌' },
          { label: '호수', value: item.sinkerHo !== undefined ? `${item.sinkerHo}호` : '-' },
          { label: '무게', value: item.sinkerWeightG !== undefined ? `${item.sinkerWeightG}g` : '-' },
          { label: '침강 기여', value: '하강 벡터 V_z 증가' },
        );
        desc = item.sinkerKind === 'ring'
          ? '원투 채비의 표준 고리형 메인 싱커입니다. 무게별로 비거리와 바닥 안착감이 달라집니다.'
          : item.sinkerKind === 'hole'
            ? '원줄이 내부를 통과하는 기둥형 구멍 봉돌입니다. 물고기가 느끼는 이물감을 줄입니다.'
            : '여러 편납을 묶은 형태의 메인 싱커입니다.';
      } else if (item.name.includes('봉돌')) {
        rows.push({ label: '무게 (g)', value: 'G2 (약 0.31 g)' }, { label: '침강 기여', value: '하강 벡터 V_z 증가' });
        desc = '채비의 침강 속도와 목줄 정렬을 조정합니다.';
      } else if (item.name.includes('도래')) {
        rows.push({ label: '역할', value: '원줄-목줄 연결 / 줄꼬임 방지' });
        desc = '회전 구조로 채비 꼬임을 방지합니다.';
      } else {
        rows.push({ label: '역할', value: '매듭 보호 / 찌 고정' });
        desc = '채비 완충과 매듭 보호용 소품입니다.';
      }
      break;
    default:
      rows.push({ label: '분류', value: item.subCategory });
      desc = '용도 미상 — 상점에 판매할 수 있습니다.';
      break;
  }

  // ── 신선도 부가 정보 (상태/남은 시간은 실시간 갱신 블록에서 별도 렌더 — 단일 상태 표기) ──
  if (item.condition) {
    rows.push({ label: '보관 환경', value: '상온 · 쿨러(해수/얼음)는 규칙별 정지' });
    if (item.subCategory.includes('미끼') || item.subCategory === '생미끼') {
      rows.push({ label: '입질 보정', value: '활어 +25% · 냉동 -50% · 부패 -85%' });
    } else if (item.subCategory === '어획물') {
      rows.push({ label: '활용 보정', value: '경락 등급·요리 품질에 반영 (활어>신선>냉장>보통)' });
    }
  }
  rows.push({ label: '보유 수량', value: `${item.qty}개` });
  rows.push({ label: '기준가', value: `${item.basePrice.toLocaleString()} 원` });

  // 신선도 상태 설명은 줄바꿈되는 본문(desc)에 덧붙인다 (행 값은 한 줄 고정이라 넘침)
  if (item.condition) {
    desc = `${desc}\n[${CONDITION_LABEL[item.condition]}] ${CONDITION_DESC[item.condition]}`;
  }

  if (item.fault) {
    const def = GEAR_FAULTS[item.fault];
    desc = `${def.descKo}\n${def.fixKo}${desc ? `\n\n${desc}` : ''}`;
  }
  return { title: item.name, subtitle: item.subCategory, rows, desc };
}

/** 아이템 상세 정보 팝업 — 신선도 상태/남은 시간은 1초 주기 실시간 갱신 */
export class ItemDetailPanel extends DraggablePanel {
  private itemRef: InvItem;
  /** 쿨러 개체 등 외부 규칙의 남은 시간 공급자 (null = '무제한' 표기) */
  private remainProvider?: () => number | null;
  private badgeText?: Phaser.GameObjects.Text;
  private condValueText?: Phaser.GameObjects.Text;
  private remainValueText?: Phaser.GameObjects.Text;
  private freshTimer?: Phaser.Time.TimerEvent;
  // ── 본문 스크롤 (내용이 화면보다 길 때) ──
  private maskShape?: Phaser.GameObjects.Graphics;
  private maskSync?: () => void;
  private wheelHandler?: (p: Phaser.Input.Pointer, go: unknown, dx: number, dy: number) => void;

  constructor(
    scene: Phaser.Scene, item: InvItem, x: number, y: number, onClose: () => void,
    remainProvider?: () => number | null,
  ) {
    // 열람 시점에 신선도를 지연 갱신 (경과 시간만큼 단계 진행 — 외부 공급자 있으면 외부 규칙 우선)
    if (!remainProvider) refreshCondition(item);
    const detail = buildItemDetail(item);
    // **픽셀아트가 제공된 모든 아이템은 확대 이미지를 크게 표시** (사용자 지시 2026-07-31 —
    //  어획물 실사 생선뿐 아니라 손질 부산물(trim_*)·필렛·가공식품 등 iconTexture 보유 전체).
    //  어획물은 iconTexture가 비어도(구세이브) speciesId로 텍스처를 폴백 해소.
    const fishTexKey: string | undefined = (() => {
      // 129차 — `px:` 픽셀 아이콘은 상세 확대용으로 크게 구워 쓴다(스케일 5 = 80px).
      if (item.iconTexture?.startsWith('px:')) {
        return ensurePixelIcon(scene, item.iconTexture.slice(3), 5) ?? undefined;
      }
      if (item.iconTexture && scene.textures.exists(item.iconTexture)) return item.iconTexture;
      if (item.subCategory === '어획물' && item.speciesId) {
        const r = resolveFishTexture(item.speciesId, item.lengthCm ?? 0, 'F');
        if (r && scene.textures.exists(r)) return r;
      }
      return undefined;
    })();
    const hasFishImage = !!fishTexKey;
    const imgH = hasFishImage ? 126 : 0;
    // 긴 어종 설명(습성)은 줄바꿈 줄 수만큼 패널을 늘린다 (판매가 표기와 겹침 방지)
    const descExtra = detail.desc.length > 60 ? Math.ceil((detail.desc.length - 60) / 28) * 14 : 0;
    // 신선도 실시간 블록 (상태 1행 + 남은 시간 라벨/값 2행)
    const condExtra = item.condition ? 66 : 0;
    const W = 320;
    // 긴 이름(중간 필렛 등)은 줄바꿈되므로 그 줄 수만큼 패널을 늘린다 (§4 오버플로 정책 —
    //  구 고정 레이아웃은 제목 2줄이 배지/소분류/구분선과 겹쳤다. 사용자 리포트 2026-08-03)
    const titleExtra = Math.max(0, Math.ceil(detail.title.length / 12) - 1) * 18;
    // 내용 전체 높이 추정 → 화면을 넘기지 않게 캡(초과분은 본문 스크롤), 위치도 화면 안으로 클램프
    const fullH = 176 + titleExtra + detail.rows.length * 24 + imgH + descExtra + condExtra;
    const maxH = Math.min(fullH, GAME_HEIGHT - 20);
    const px = Phaser.Math.Clamp(x, 8, GAME_WIDTH - W - 8);
    const py = Phaser.Math.Clamp(y, 8, GAME_HEIGHT - maxH - 8);
    super(scene, { x: px, y: py, width: W, height: maxH, title: '아이템 정보', onClose, depth: 880 });
    this.itemRef = item;
    this.remainProvider = remainProvider;

    // 헤더 아래 본문은 스크롤 컨테이너에 담는다 (내용이 화면보다 길면 휠/스크롤바로 이동)
    const body = scene.add.container(0, 0);
    this.add(body);

    // 아이콘 + 이름 + 소분류 — 이름은 **배지 열을 피해**(wrap 172) 줄바꿈하고,
    //  줄 수만큼 아래 요소 전체를 내린다(hShift — 흐름 배치. 겹침 수정 2026-08-03)
    const icon = createItemIcon(scene, 42, this.contentTop + 22, item, 36);
    const name = scene.add.text(70, this.contentTop + 12, detail.title, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#e8f4fd', fontStyle: 'bold',
      wordWrap: { width: 172 },
    });
    const sub = scene.add.text(70, this.contentTop + 12 + name.height + 4, detail.subtitle, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8faabf',
    });
    body.add([icon, name, sub]);
    /** 제목 줄바꿈으로 늘어난 만큼 이후 요소 전체가 내려간다 */
    const hShift = Math.max(0, (sub.y + sub.height + 8) - (this.contentTop + 52));

    // 신선도 배지 (실시간 갱신 대상)
    if (item.condition) {
      this.badgeText = scene.add.text(W - 20, this.contentTop + 12, CONDITION_LABEL[item.condition], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', fontStyle: 'bold',
        color: CONDITION_COLOR[item.condition],
        backgroundColor: '#050f1e', padding: { x: 5, y: 2 },
      }).setOrigin(1, 0);
      body.add(this.badgeText);
    }

    // 구분선
    const div = scene.add.graphics();
    div.lineStyle(1, 0x1f3d5a, 0.8);
    div.lineBetween(16, this.contentTop + 52 + hShift, W - 16, this.contentTop + 52 + hShift);
    body.add(div);

    // 실사 픽셀 생선 이미지 (어획물) — 개체 크기에 따라 확대/축소 (소형↓·보통·대형·특대↑ 단조)
    if (fishTexKey) {
      const src = scene.textures.get(fishTexKey).getSourceImage() as HTMLImageElement;
      const sizeMul = item.speciesId && item.lengthCm ? fishImageSizeScale(item.speciesId, item.lengthCm) : 1;
      // refBox = 보통 크기 기준(228×90), capBox = 특대에도 패널 폭·이미지 영역(imgH) 안에 들어오게
      const fitRef = Math.min(228 / src.width, 90 / src.height);
      const ds = Math.min(fitRef * sizeMul, 300 / src.width, 120 / src.height);
      const fishImg = scene.add.image(W / 2, this.contentTop + 58 + hShift + imgH / 2 - 6, fishTexKey)
        .setDisplaySize(src.width * ds, src.height * ds);
      body.add(fishImg);
    }

    // 스펙 행
    detail.rows.forEach((row, i) => {
      const ry = this.contentTop + 64 + hShift + imgH + i * 24;
      const lbl = scene.add.text(22, ry, row.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8a060', fontStyle: 'bold',
      });
      const val = scene.add.text(W - 22, ry, row.value, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: row.color ?? '#e8f4fd',
        fontStyle: row.color ? 'bold' : 'normal',
      }).setOrigin(1, 0);
      // 값이 라벨을 넘어 왼쪽 밖으로 나가지 않게 (154차 실측 — 요리 재료 구성 행이 패널 왼쪽으로 삐져나갔다)
      clampTextWidth(val, W - 22 - (22 + lbl.width + 8));
      body.add([lbl, val]);
    });

    // ── 신선도 실시간 블록 — 단일 상태 표기 + 초단위 카운트다운 ──
    if (item.condition) {
      const fy = this.contentTop + 64 + hShift + imgH + detail.rows.length * 24;
      const condLbl = scene.add.text(22, fy, '신선도 상태', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8a060', fontStyle: 'bold',
      });
      this.condValueText = scene.add.text(W - 22, fy, CONDITION_LABEL[item.condition], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', fontStyle: 'bold',
        color: CONDITION_COLOR[item.condition],
      }).setOrigin(1, 0);
      const remainLbl = scene.add.text(22, fy + 24, '다음 상태로 변경되기까지 남은 시간', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8a060', fontStyle: 'bold',
      });
      this.remainValueText = scene.add.text(W - 22, fy + 40, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#e8f4fd', fontStyle: 'bold',
      }).setOrigin(1, 0);
      body.add([condLbl, this.condValueText, remainLbl, this.remainValueText]);

      // 1초 주기 실시간 갱신 (호버/열람 중 숫자가 초단위로 줄어드는 것이 보인다)
      this.updateFreshness();
      this.freshTimer = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateFreshness() });
    }

    // 설명
    const descY = this.contentTop + 68 + hShift + imgH + detail.rows.length * 24 + condExtra;
    const descText = scene.add.text(22, descY, detail.desc, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fc0d4',
      wordWrap: { width: W - 44 }, lineSpacing: 4,
    });
    body.add(descText);

    // 판매가 참고 — 설명 아래로 흘려 배치(스크롤 시 함께 이동)
    const sellY = descY + descText.height + 10;
    const sellText = scene.add.text(22, sellY, `상점 매입가: ${InventoryStore.getSellPrice(item as InvItem).toLocaleString()} 원`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffe28a',
    });
    body.add(sellText);

    // ── 본문이 패널 높이를 넘기면 마스크 + 휠 스크롤 + 우측 스크롤바 ──
    const vpTop = this.contentTop - 4;
    const vpBottom = maxH - 6;
    const vpH = vpBottom - vpTop;
    const contentBottom = sellY + 16;
    const scrollRange = Math.max(0, contentBottom - vpBottom);
    if (scrollRange > 0) {
      const maskShape = scene.make.graphics({ x: this.x, y: this.y }, false);
      // 패널은 screen-fixed(scrollFactor 0)인데 마스크가 기본값(1)이면 카메라가 스크롤된
      // 씬(RegionFieldScene 상점 등)에서 마스크 지오메트리가 스크롤량만큼 어긋나
      // 콘텐츠가 엉뚱한 위치에서 잘린다 — 마스크도 반드시 화면 고정.
      maskShape.setScrollFactor(0);
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(4, vpTop, W - 8, vpH);
      body.setMask(new Phaser.Display.Masks.GeometryMask(scene, maskShape));
      this.maskShape = maskShape;
      // 마스크가 패널 드래그 이동을 따라오도록 매 프레임 동기화 (UI 열림 중 카메라는 정지 상태)
      this.maskSync = (): void => { maskShape.setPosition(this.x, this.y); };
      scene.events.on('update', this.maskSync);

      // 우측 스크롤바 (트랙 + 위치 비례 썸) — 마스크 밖(this)에 두어 스크롤/클립되지 않게
      const barX = W - 7;
      const bar = scene.add.graphics();
      this.add(bar);
      const drawBar = (): void => {
        bar.clear();
        bar.fillStyle(0x14324a, 0.9);
        bar.fillRoundedRect(barX, vpTop, 4, vpH, 2);
        const thumbH = Math.max(24, (vpH * vpH) / (contentBottom - vpTop));
        const prog = scrollRange === 0 ? 0 : -body.y / scrollRange;
        bar.fillStyle(0x5cd0ff, 0.95);
        bar.fillRoundedRect(barX, vpTop + (vpH - thumbH) * prog, 4, thumbH, 2);
      };
      drawBar();

      this.wheelHandler = (_p, _go, _dx, dy): void => {
        body.y = Phaser.Math.Clamp(body.y - Math.sign(dy) * 42, -scrollRange, 0);
        drawBar();
      };
      scene.input.on('wheel', this.wheelHandler);
    }

    this.applyFix();
  }

  /** 신선도 상태/남은 시간 실시간 갱신 — 상태 전이 시 라벨·색·배지 동기화 */
  private updateFreshness(): void {
    const item = this.itemRef;
    if (!item.condition || !this.condValueText || !this.remainValueText) return;
    // 인벤토리 아이템은 지연 갱신으로 상태 전이 반영 — 쿨러 개체는 외부 규칙(제공자)이 관리
    if (!this.remainProvider) refreshCondition(item);
    const cond = item.condition;
    this.condValueText.setText(CONDITION_LABEL[cond]).setColor(CONDITION_COLOR[cond]);
    this.badgeText?.setText(CONDITION_LABEL[cond]).setColor(CONDITION_COLOR[cond]);

    const remain = this.remainProvider ? this.remainProvider() : conditionRemainMs(item);
    let txt: string;
    if (remain === null) txt = '무제한';
    else if (!Number.isFinite(remain)) txt = CONDITION_NEXT[cond] ? '—' : '종착 상태 (변화 없음)';
    else txt = formatDhms(remain);
    this.remainValueText.setText(txt);
  }

  override destroy(fromScene?: boolean): void {
    this.freshTimer?.remove();
    if (this.wheelHandler) this.scene?.input?.off('wheel', this.wheelHandler);
    if (this.maskSync) this.scene?.events?.off('update', this.maskSync);
    this.maskShape?.destroy();
    super.destroy(fromScene);
  }
}
