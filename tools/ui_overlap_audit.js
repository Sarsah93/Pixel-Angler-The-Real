/**
 * @file ui_overlap_audit.js
 * @description 화면 고정 UI 겹침 감사 (198차 — 사용자 지시 「겹치거나 방해하지 않게. 전수조사·규칙 추가」)
 *
 * 쓰는 법(Playwright 하네스 — 스킬 verify-render):
 *   await page.evaluate(fs.readFileSync('tools/ui_overlap_audit.js', 'utf8'));
 *   const r = await page.evaluate((keys) => globalThis.__uiAudit(keys), ['RegionFieldScene', 'HomeInteriorScene']);
 *   // r.hits = 부분 겹침 목록(0이어야 한다) · r.items = 검사한 사각형
 *
 * 대상:
 *  - 필드 HUD는 `RegionFieldScene.screenReserved()`(= `RegionHud.occupiedRects()` + 도움말 단추 + 지역 명패)로 읽는다.
 *  - 그 밖의 씬 객체는 화면 고정(scrollFactor 0 · 카메라가 안 움직이는 씬의 Container/Text/RenderTexture/입력 객체)만.
 *    화면 12% 넘는 컨테이너는 자식으로 펼친다.
 *  - **부분 겹침만** 보고한다 — 한쪽이 다른 쪽에 완전히 들어가면(단추 안 글자, 패널 안 칸) 정상 구성이다.
 * ⚠ Graphics는 경계를 모른다 — 그림만으로 된 판(범례 배경 등)은 이 감사가 못 본다. 스크린샷을 눈으로 함께 본다.
 */
// 198차 — 화면 고정 UI 겹침 감사(페이지 안에서 실행). 부분 겹침만 보고(완전 포함 = 단추 안 글자 등 정상 구성)
globalThis.__uiAudit = (keys) => {
  const g = globalThis.__PIXEL_ANGLER_GAME; const W = g.scale.width, H = g.scale.height;
  const items = [];
  const push = (scene, o, owner) => {
    if (!o.visible || o.alpha === 0 || !o.getBounds) return;
    let b; try { b = o.getBounds(); } catch (e) { return; }
    if (b.width < 6 || b.height < 6) return;
    if (b.right <= 0 || b.bottom <= 0 || b.x >= W || b.y >= H) return;
    const area = b.width * b.height;
    if (o.list && area > W * H * 0.12 && o.list.length > 1) { for (const c of o.list) push(scene, c, owner + '>' + (o.constructor?.name ?? o.type)); return; }
    if (area > W * H * 0.5) return;   // 화면 전체 딤·입력 흡수판
    if (o.type === 'Rectangle' && o.fillAlpha <= 0.01 && !o.input) return;
    const txt = (o.list ? o.list.find((c) => c.type === 'Text' && c.text)?.text : o.text) ?? '';
    items.push({ scene, owner, type: o.type, x: Math.round(b.x), y: Math.round(b.y), r: Math.round(b.right), b: Math.round(b.bottom), txt: String(txt).replace(/\n/g, ' ').slice(0, 18) });
  };
  for (const key of keys) {
    const s = g.scene.getScene(key);
    if (!s || !s.sys.settings.visible || !(s.scene.isActive() || s.scene.isPaused())) continue;
    const camScroll = s.cameras.main.scrollX !== 0 || s.cameras.main.scrollY !== 0;
    if (typeof s.screenReserved === 'function') for (const v of s.screenReserved()) items.push({ scene: key, owner: v.name, type: 'HUD', x: v.rect.x, y: v.rect.y, r: v.rect.right, b: v.rect.bottom, txt: v.name });
    for (const o of s.children.list) {
      if (o.constructor?.name === 'RegionHud') continue;   // 위 screenReserved가 대신한다
      const kids = o.list ?? [];
      const sf0 = o.scrollFactorX === 0 || (kids.length > 0 && kids.every((c) => c.scrollFactorX === 0));
      // 필드는 카메라가 움직이므로 scrollFactor 0만 UI. 고정 카메라 씬은 그림(이미지·도형)을 빼고 UI형만
      const fixed = sf0 || (!camScroll && key !== 'RegionFieldScene' && (['Container', 'Text', 'RenderTexture'].includes(o.type) || !!o.input?.enabled));
      if (!fixed) continue;
      push(key, o, key.replace('Scene', '') + ':' + (o.constructor?.name ?? o.type));
    }
  }
  const hits = [];
  const inside = (a, c) => a.x >= c.x - 1 && a.y >= c.y - 1 && a.r <= c.r + 1 && a.b <= c.b + 1;
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], c = items[j];
    if (a.owner === c.owner && a.type !== 'HUD') continue;
    const ox = Math.min(a.r, c.r) - Math.max(a.x, c.x), oy = Math.min(a.b, c.b) - Math.max(a.y, c.y);
    if (ox <= 2 || oy <= 2 || inside(a, c) || inside(c, a)) continue;
    hits.push(`${a.owner}[${a.txt}] (${a.x},${a.y},${a.r},${a.b})  ×  ${c.owner}[${c.txt}] (${c.x},${c.y},${c.r},${c.b})  ${ox}x${oy}`);
  }
  return { items, hits };
};
