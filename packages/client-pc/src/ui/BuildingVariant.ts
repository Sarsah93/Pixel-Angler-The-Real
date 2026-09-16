/**
 * @file BuildingVariant.ts
 * @description 건물 프리팹 변형 굽기 (138차) — 같은 그림 5장이 도시 전체를 채우던 문제.
 *
 * `gem/building_1~5`·`popup_1~4`·`sashimi_1~2` 11장이 속초 POI 310곳을 돌려막는다.
 * 그림을 새로 그리는 대신 **POI마다 결정적 변형**을 굽는다.
 *   ① 벽 색 색상환 회전 (외곽선·유리·흰색은 보존 — 채도/명도 범위로 가린다)
 *   ② 문 위 **차양 줄무늬**(2px 그레인)
 *   ③ 간판 띠 — 상호 색이 POI마다 다르다
 *
 * ⚠ 원본 그레인이 2px이므로 변형도 **2px 단위로만** 그린다. 1px 장식을 넣으면 그 건물만
 *   해상도가 달라 보인다(구 캐릭터가 맵과 어긋나 보이던 것과 같은 원인).
 */
import Phaser from 'phaser';

/** 2px 그레인 — 아트 격자 1칸 */
const G = 2;

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h: number;
  if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (mx === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number): number => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

/** 차양·간판 색 팔레트 (2px 그레인 장식) */
const AWNING = [0xc4553f, 0x3d5a80, 0x5b6637, 0xd1a72f, 0x2f8377, 0x8a5a8f];

/**
 * POI별 건물 변형 텍스처를 굽고 키를 돌려준다. 실패하면 원본 키를 그대로 돌려준다
 * (텍스처가 아직 없거나 캔버스를 못 만들면 변형 없이 진행 — 렌더가 멈추지 않게).
 */
export function ensureBuildingVariant(scene: Phaser.Scene, baseKey: string, seed: number): string {
  const s = Math.abs(Math.imul(seed | 0, 2654435761) >>> 0);
  const variant = s % 6;
  const key = `bvar_${baseKey}_${variant}`;
  if (scene.textures.exists(key)) return key;
  if (!scene.textures.exists(baseKey)) return baseKey;

  const src = scene.textures.get(baseKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const w = (src as HTMLImageElement).width, h = (src as HTMLImageElement).height;
  if (!w || !h) return baseKey;

  const cv = scene.textures.createCanvas(key, w, h);
  if (!cv) return baseKey;
  const ctx = cv.getContext();
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src as CanvasImageSource, 0, 0);

  // ① 벽 색 회전 — 채도 있는 중간 명도만 돌린다(외곽선·유리·흰벽 보존).
  //   회전 폭은 **좁게** 잡는다. 색상환을 크게 돌리면 횟집이 마젠타가 되는 식으로
  //   건물 종류의 의미(사용자 규칙 "편의점에 팝업스토어/횟집 금지")가 색에서부터 깨진다.
  const HUE_STEPS = [0, 0.045, 0.09, -0.05, 0.13, -0.095];
  const hueShift = (HUE_STEPS[variant] + 1) % 1;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const [hh, ss, ll] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (ss < 0.12 || ll < 0.18 || ll > 0.88) continue;
    const [r, g, b] = hslToRgb((hh + hueShift) % 1, Math.min(1, ss * 1.05), ll);
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);

  // ② 차양 — 건물 하단에서 위로 8칸 지점에 2px 줄무늬 띠
  const aw = AWNING[(s >>> 3) % AWNING.length];
  const aw2 = AWNING[(s >>> 7) % AWNING.length];
  const bandH = G * 3;
  const bandY = Math.max(0, h - G * 10);
  const x0 = Math.round(w * 0.16 / G) * G;
  const x1 = Math.round(w * 0.84 / G) * G;
  for (let x = x0; x < x1; x += G) {
    ctx.fillStyle = `#${(((x / G) % 2 === 0 ? aw : aw2) >>> 0).toString(16).padStart(6, '0')}`;
    ctx.fillRect(x, bandY, G, bandH);
  }
  // 차양 그림자 한 줄
  ctx.fillStyle = 'rgba(20,24,34,0.35)';
  ctx.fillRect(x0, bandY + bandH, x1 - x0, G);

  // ③ 간판 — 차양 위 작은 색 블록
  const signW = G * 6, signH = G * 2;
  const signX = Math.round((w / 2 - signW / 2) / G) * G;
  ctx.fillStyle = `#${(aw2 >>> 0).toString(16).padStart(6, '0')}`;
  ctx.fillRect(signX, bandY - G * 4, signW, signH);
  ctx.fillStyle = 'rgba(245,238,220,0.85)';
  ctx.fillRect(signX + G, bandY - G * 4 + (G >> 1), signW - G * 2, G);

  cv.refresh();
  return key;
}
