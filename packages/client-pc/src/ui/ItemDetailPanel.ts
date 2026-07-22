/**
 * @file ItemDetailPanel.ts
 * @description 아이템 상세 정보 팝업 (우클릭 → 상세보기 / 상점 아이콘 우클릭)
 *
 * 상세 스펙은 모노레포 물리 설계(캐스팅/수중 물리, 채비 파라미터)와
 * 구현계획서 내용을 토대로 추론한 목업 값 — 추후 @tra/core DB 정식 연동 시 교체.
 */

import Phaser from 'phaser';
import { FISH_DATABASE } from '@tra/core';
import { DraggablePanel } from './DraggablePanel.js';
import { createItemIcon } from './ItemIcon.js';
import {
  InvItem, InventoryStore, CONDITION_LABEL, CONDITION_COLOR, CONDITION_DESC,
  CONDITION_NEXT, refreshCondition, conditionRemainMs, formatDhms,
} from '../store/InventoryStore.js';

/** 서식 수층 표기 */
const LAYER_LABEL: Record<'surface' | 'mid' | 'bottom', string> = {
  surface: '상층', mid: '중층', bottom: '바닥층',
};

export interface ItemDetailRow {
  label: string;
  value: string;
}

export interface ItemDetailData {
  title: string;
  subtitle: string;
  rows: ItemDetailRow[];
  desc: string;
}

/** 아이템 종류별 상세 스펙 추론 생성 (목업) — 어획물은 개체 실측치·어종 정보(FISH_DATABASE) 표시 */
export function buildItemDetail(item: Pick<InvItem, 'id' | 'name' | 'subCategory' | 'category' | 'qty' | 'basePrice' | 'condition' | 'conditionSinceMs' | 'speciesId' | 'lengthCm' | 'weightG' | 'floatBuoyG'>): ItemDetailData {
  const rows: ItemDetailRow[] = [];
  let desc = '';

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
      rows.push({ label: '섭취 효과', value: 'HP +10' }, { label: '보존성', value: '부패 없음' });
      desc = '오래 보관할 수 있는 비상 식량입니다.';
      break;
    case '어획물': {
      // ── 개체 실측치 — 무게 미저장 시 길이-체중식 W ≈ a·L³ 근사 (범용 계수) ──
      const lengthCm = item.lengthCm;
      const weightG = item.weightG ?? (lengthCm ? Math.round(0.015 * Math.pow(lengthCm, 3)) : undefined);
      if (lengthCm) rows.push({ label: '길이', value: `${lengthCm} cm` });
      if (weightG) {
        rows.push({ label: '무게', value: weightG >= 1000 ? `${(weightG / 1000).toFixed(2)} kg` : `${weightG} g` });
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
        { label: '재질', value: 'PE 합사' },
        { label: '호수', value: '1호' },
        { label: '인장 강도 (T_line)', value: '8.2 kg' },
      );
      desc = '드랙 장력을 이 한계보다 낮게 설정해야 줄 터짐 전에 릴이 풀려나갑니다.';
      break;
    case '목줄 스풀':
      rows.push(
        { label: '재질', value: item.id.includes('carbon') ? '카본 (내마모)' : '나일론 (신축)' },
        { label: '호수', value: item.id.includes('carbon') ? '1.5호' : '2호' },
        { label: '인장 강도', value: item.id.includes('carbon') ? '5.4 kg' : '6.1 kg' },
      );
      desc = '바닥 여밭 지형에서의 쓸림에 대비하는 목줄입니다.';
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

  constructor(
    scene: Phaser.Scene, item: InvItem, x: number, y: number, onClose: () => void,
    remainProvider?: () => number | null,
  ) {
    // 열람 시점에 신선도를 지연 갱신 (경과 시간만큼 단계 진행 — 외부 공급자 있으면 외부 규칙 우선)
    if (!remainProvider) refreshCondition(item);
    const detail = buildItemDetail(item);
    // 어획물은 실사 픽셀 생선 이미지를 크게 표시
    const hasFishImage = item.subCategory === '어획물'
      && !!item.iconTexture && scene.textures.exists(item.iconTexture);
    const imgH = hasFishImage ? 126 : 0;
    // 긴 어종 설명(습성)은 줄바꿈 줄 수만큼 패널을 늘린다 (판매가 표기와 겹침 방지)
    const descExtra = detail.desc.length > 60 ? Math.ceil((detail.desc.length - 60) / 28) * 14 : 0;
    // 신선도 실시간 블록 (상태 1행 + 남은 시간 라벨/값 2행)
    const condExtra = item.condition ? 66 : 0;
    const h = 176 + detail.rows.length * 24 + imgH + descExtra + condExtra;
    super(scene, { x, y, width: 320, height: h, title: '아이템 정보', onClose, depth: 880 });
    this.itemRef = item;
    this.remainProvider = remainProvider;

    // 아이콘 + 이름 + 소분류
    const icon = createItemIcon(scene, 42, this.contentTop + 22, item, 36);
    const name = scene.add.text(70, this.contentTop + 12, detail.title, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '14px', color: '#e8f4fd', fontStyle: 'bold',
      wordWrap: { width: 230 },
    });
    const sub = scene.add.text(70, this.contentTop + 32, detail.subtitle, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#8faabf',
    });
    this.add([icon, name, sub]);

    // 신선도 배지 (실시간 갱신 대상)
    if (item.condition) {
      this.badgeText = scene.add.text(this.panelW - 20, this.contentTop + 12, CONDITION_LABEL[item.condition], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', fontStyle: 'bold',
        color: CONDITION_COLOR[item.condition],
        backgroundColor: '#050f1e', padding: { x: 5, y: 2 },
      }).setOrigin(1, 0);
      this.add(this.badgeText);
    }

    // 구분선
    const div = scene.add.graphics();
    div.lineStyle(1, 0x1f3d5a, 0.8);
    div.lineBetween(16, this.contentTop + 52, this.panelW - 16, this.contentTop + 52);
    this.add(div);

    // 실사 픽셀 생선 이미지 (어획물)
    if (hasFishImage && item.iconTexture) {
      const src = scene.textures.get(item.iconTexture).getSourceImage() as HTMLImageElement;
      const scale = Math.min(280 / src.width, 110 / src.height);
      const fishImg = scene.add.image(this.panelW / 2, this.contentTop + 58 + imgH / 2 - 6, item.iconTexture)
        .setDisplaySize(src.width * scale, src.height * scale);
      this.add(fishImg);
    }

    // 스펙 행
    detail.rows.forEach((row, i) => {
      const ry = this.contentTop + 64 + imgH + i * 24;
      const lbl = scene.add.text(22, ry, row.label, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8a060', fontStyle: 'bold',
      });
      const val = scene.add.text(this.panelW - 22, ry, row.value, {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#e8f4fd',
      }).setOrigin(1, 0);
      this.add([lbl, val]);
    });

    // ── 신선도 실시간 블록 — 단일 상태 표기 + 초단위 카운트다운 ──
    if (item.condition) {
      const fy = this.contentTop + 64 + imgH + detail.rows.length * 24;
      const condLbl = scene.add.text(22, fy, '신선도 상태', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8a060', fontStyle: 'bold',
      });
      this.condValueText = scene.add.text(this.panelW - 22, fy, CONDITION_LABEL[item.condition], {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', fontStyle: 'bold',
        color: CONDITION_COLOR[item.condition],
      }).setOrigin(1, 0);
      const remainLbl = scene.add.text(22, fy + 24, '다음 상태로 변경되기까지 남은 시간', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#c8a060', fontStyle: 'bold',
      });
      this.remainValueText = scene.add.text(this.panelW - 22, fy + 40, '', {
        fontFamily: '"Noto Sans KR", sans-serif', fontSize: '11px', color: '#e8f4fd', fontStyle: 'bold',
      }).setOrigin(1, 0);
      this.add([condLbl, this.condValueText, remainLbl, this.remainValueText]);

      // 1초 주기 실시간 갱신 (호버/열람 중 숫자가 초단위로 줄어드는 것이 보인다)
      this.updateFreshness();
      this.freshTimer = scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateFreshness() });
    }

    // 설명
    const descY = this.contentTop + 68 + imgH + detail.rows.length * 24 + condExtra;
    const descText = scene.add.text(22, descY, detail.desc, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#9fc0d4',
      wordWrap: { width: this.panelW - 44 }, lineSpacing: 4,
    });
    this.add(descText);

    // 판매가 참고
    const sellText = scene.add.text(22, this.panelH - 24, `상점 매입가: ${InventoryStore.getSellPrice(item as InvItem).toLocaleString()} 원`, {
      fontFamily: '"Noto Sans KR", sans-serif', fontSize: '10px', color: '#ffe28a',
    });
    this.add(sellText);

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
    super.destroy(fromScene);
  }
}
