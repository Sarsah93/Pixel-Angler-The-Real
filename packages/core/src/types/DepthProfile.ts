/**
 * @file DepthProfile.ts
 * @description 실측 연안 수심 프로필 타입 + 거리→수심 보간기
 *
 * 데이터 원천: 국립해양조사원 1/25,000 연안정보도 수심 SHP (2011)
 *  → tools/build_depth_profiles.py 가 항구 앵커별 "거리 구간 평균 수심" JSON으로 변환
 *  → public/data/depth/<region>.json (RegionFieldScene이 로드해 캐스팅 수심에 반영)
 *
 * 게임 규칙:
 *  - 캐스팅 거리(m) → 프로필 구간 선형 보간 수심
 *  - 프로필 제공 범위(maxDist)를 넘는 거리는 마지막 구간의 기울기로
 *    거리 비례 외삽 (인게임 위치가 실측 범위보다 멀리 있는 경우)
 *
 * 순수 TS — 렌더링/브라우저 API 없음.
 */

/** 항구 앵커별 거리 수심 프로필 */
export interface DepthAnchorProfile {
  /** 앵커 ID (예: 'sokchohang', 'dongmyeonghang') */
  id: string;
  /** 표시 이름 */
  name: string;
  /** 앵커 실좌표 (WGS84) */
  lat: number;
  lon: number;
  /** 거리 구간 폭 (m) */
  binSizeM: number;
  /** 구간별 평균 수심 (m) — index i = 거리 [i*bin, (i+1)*bin) */
  depthsM: number[];
}

/** 지역 수심 프로필 파일 스키마 */
export interface RegionDepthProfile {
  region: string;
  source: string;
  anchors: DepthAnchorProfile[];
}

/** 외삽 시 수심 상한 (m) */
const MAX_EXTRAPOLATED_DEPTH_M = 60;
/** 최소 수심 (m) */
const MIN_DEPTH_M = 0.5;

/**
 * 캐스팅 거리(m) → 실측 기반 수심(m).
 *  - 구간 내: 이웃 구간 선형 보간
 *  - 범위 초과: 마지막 3개 구간의 평균 기울기로 거리 비례 외삽 (상한 60m)
 */
export function depthAtDistance(anchor: DepthAnchorProfile, distM: number): number {
  const depths = anchor.depthsM;
  const bin = anchor.binSizeM;
  if (depths.length === 0) return MIN_DEPTH_M;
  if (depths.length === 1) return Math.max(MIN_DEPTH_M, depths[0]);

  const maxDist = depths.length * bin;
  if (distM <= 0) return Math.max(MIN_DEPTH_M, depths[0]);

  if (distM < maxDist) {
    // 구간 중심 기준 선형 보간
    const pos = distM / bin - 0.5;
    const i0 = Math.max(0, Math.min(depths.length - 1, Math.floor(pos)));
    const i1 = Math.min(depths.length - 1, i0 + 1);
    const t = Math.max(0, Math.min(1, pos - i0));
    return Math.max(MIN_DEPTH_M, depths[i0] + (depths[i1] - depths[i0]) * t);
  }

  // 범위 초과 — 마지막 구간들 평균 기울기로 거리 비례 외삽
  const tail = depths.slice(-4);
  let slopePerBin = 0;
  for (let i = 1; i < tail.length; i++) slopePerBin += tail[i] - tail[i - 1];
  slopePerBin = tail.length > 1 ? slopePerBin / (tail.length - 1) : 0;
  // 연안에서 멀어지면 대체로 깊어지므로 음의 기울기는 완만한 증가로 대체
  const slopePerMeter = Math.max(0.002, slopePerBin / bin);
  const extra = (distM - maxDist) * slopePerMeter;
  return Math.min(MAX_EXTRAPOLATED_DEPTH_M, Math.max(MIN_DEPTH_M, depths[depths.length - 1] + extra));
}

/** 앵커 ID 검색 (부분 일치 허용 — mapId 'sokcho_dongmyeonghang_1' 등) */
export function findDepthAnchor(profile: RegionDepthProfile, key: string): DepthAnchorProfile | undefined {
  return profile.anchors.find((a) => key.includes(a.id) || a.id.includes(key))
    ?? profile.anchors[0];
}
