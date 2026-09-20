/** 대화창 공통 초상화 카드 레이아웃.
 *
 * 혼잣말과 NPC 대화는 표시 내용은 달라도 초상화 → (호감도 슬롯) → 이름
 * 순서를 공유한다. 이 간격을 한 곳에서 관리해 한 화면만 고쳐 다른 화면이
 * 다시 겹치는 회귀를 막는다.
 */
export const PORTRAIT_LAYOUT = {
  /** mother 패널의 좌우 테두리에서 카드까지의 여백 */
  outerInset: 18,
  /** 카드 안에서 초상 프레임의 좌우 여백을 포함한 폭 차이 */
  frameSideInset: 40,
  frameRadius: 8,
  nameGap: 8,
  nameHeight: 24,
  /** 주인공 혼잣말에서도 비워 두는 호감도 슬롯 높이 */
  affinityReservedHeight: 24,
} as const;
