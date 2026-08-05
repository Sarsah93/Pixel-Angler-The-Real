---
name: deploy-ghpages
description: Pixel Angler 테스트 빌드 gh-pages 배포 절차. GitHub Pages 재배포, QA 테스트 URL 갱신, 배포본 라이브 검증 작업이면 반드시 로드. "배포", "gh-pages", "테스트 빌드", "QA URL", "재배포" 작업이면 이 스킬을 따른다.
---

# gh-pages 테스트 배포

**라이브 URL**: https://sarsah93.github.io/Pixel-Angler-The-Real/
**배포 worktree**: `../pixel-angler-gh-pages` (orphan `gh-pages` 브랜치 — Pages 소스는 브랜치 루트, `.nojekyll` 포함)

## 절차

```bash
npx pnpm run build                                  # 4/4 성공 확인
git -C ../pixel-angler-gh-pages fetch origin        # ⚠ 로컬 worktree가 origin/gh-pages보다
git -C ../pixel-angler-gh-pages status              #    뒤처져 있을 수 있음 — 먼저 동기화 (73차 노트)
# dist → worktree 루트로 복사 (소스맵 제외!)
#   packages/client-pc/dist/* 를 복사하되 *.map 파일은 제외한다
git -C ../pixel-angler-gh-pages add -A
git -C ../pixel-angler-gh-pages commit -m "Deploy: N차 테스트 빌드 (YYYY-MM-DD) — 요약"
git -C ../pixel-angler-gh-pages push origin gh-pages
```

- 커밋 메시지 규칙: `Deploy: N차 테스트 빌드 (날짜) — 포함 변경 요약` (직전 차수는 `git -C ../pixel-angler-gh-pages log -1 --oneline`으로 확인해 +1).
- **소스맵(`*.map`) 절대 포함 금지** — 복사 단계에서 제외.
- 배포는 외부 공개 행위 — **사용자 확인 후 push**.

## 경로·API 제약 (재배포 시 재확인)

- `vite base: './'` + 전 에셋 상대 경로 전제 — **새 에셋 로드에 선행 `/`가 있으면 배포에서만 404** (dev에서는 멀쩡히 동작하므로 조용히 깨진다). 배포 전 `grep`으로 `load.image('…', '/` 패턴 검사 권장.
- 정적 호스팅이라 vite dev 프록시 없음 → NMPNT/MAFRA/KOSIS는 **Mock 폴백**, 기상청(apis.data.go.kr)만 라이브 실데이터 (CORS 허용). 정상 동작이며 버그 아님.
- 번들에 공공 API 키 인라인 노출은 사용자 기승인 사항.

## 배포 후 라이브 검증 (필수)

Playwright로 라이브 URL 접속 (verify-render 스킬 하네스 재사용, goto만 라이브 URL로):
1. **리소스 404 = 0건** (response 리스너로 4xx 수집)
2. **pageerror = 0건**
3. 메인 메뉴 기동 + 게임 시작 → 필드 진입 스모크
4. QA에게 전달할 변경 요약 정리 (이번 배포에 포함된 차수 범위 명시)
