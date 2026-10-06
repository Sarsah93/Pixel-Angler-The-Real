/**
 * @file en_pois.ts
 * @description OSM POI 상호명 영문 사전 (120차 ②) — `name:en` 이 없거나 품질이 낮은 것만.
 *
 * ## 왜 사전이 필요한가
 * 상호명은 실제 간판이라 **한국어 `name` 이 정본**이고, 영어 로케일 표시만 이 사전/`nameEn` 을 쓴다.
 * OSM 원본에는 공식 영문명(`name:en`)이 상당수 들어 있어(속초 실측: 라벨 렌더 133건 중 91건)
 * `tools/backfill_poi_nameen.py` 가 그걸 `pois.json.nameEn` 으로 채운다.
 * 여기 있는 것은 **그 나머지 42건 + 원본이 부정확한 소수**다.
 *
 * ## 표기 규칙 (사용자 확정 2026-09-08)
 * 고유명(상호 이름)은 **로마자 음차**, 업종 접미(횟집·식당·주유소·편의점 …)만 **의미역**.
 *   함경냉면옥 → Hamheung Naengmyeon House · 짬뽕일등지 → Jjamppong Ilbeonji
 * 218차 — 가게 상호는 게임 상호로 바뀌었다(`pixelazed/<region>/name_alias.json` — 실제 상호를 조금씩 바꾼 것).
 * 가게의 영어 표기는 그 표가 `pois.json.nameEn`으로 내보내므로 **여기에 가게 이름을 다시 적지 않는다**(실제 상호가 번들에 남는다).
 * 이 사전에는 공공 시설 · 지명 · 협동조합(수협)처럼 이름을 바꾸지 않는 것만 둔다.
 * 지명이 섞이면 국립국어원 로마자 표기법을 따른다(속초 → Sokcho).
 *
 * ## 우선순위
 * `EN_PLACES`(지명) > **이 사전** > OSM `nameEn` > 원문(한국어).
 * `I18n.buildRuntimeDict` 가 이 순서로 넣고, 나중에 오는 `registerNames`(OSM)는 덮지 않는다.
 * 즉 여기 키를 적으면 OSM 값을 **덮어쓸 수 있다** — 아래 '보정' 절이 그 용도다.
 */
export const EN_POIS: Record<string, string> = {
  // ── 보정: OSM name:en 이 있으나 정확하지 않은 것 ──
  // 두 지구대가 똑같이 'Sokcho Police Station' 이라 지도에서 구분이 안 된다
  '속초경찰서 영랑지구대': 'Sokcho Police – Yeongnang Substation',
  '속초경찰서 청초지구대': 'Sokcho Police – Cheongcho Substation',

  // ── 협동조합 (이름을 바꾸지 않는다) ──
  '속초시 수협 동명활어센터': 'Sokcho Suhyup Dongmyeong Live Fish Center',

  // ── 시설·표지 ──
  '동명항': 'Dongmyeong Port',                       // EN_PLACES 와 동일 — POI info 로도 나온다
  '동명항활어': 'Dongmyeong Port Live Fish',
  '속초항': 'Sokcho Port',
  '속초항만지원센터 주차장': 'Sokcho Port Support Center Parking',
  '속초항여객선터미널': 'Sokcho Port Ferry Terminal',
  '영랑호CC': 'Yeongnangho CC',
  '조도등대': 'Jodo Lighthouse',
  '중앙치안센터': 'Jungang Police Post',
  '청호동방파제': 'Cheongho-dong Breakwater',
};
