---
name: deploy-ghpages
description: Pixel Angler 테스트 빌드 gh-pages 배포 절차. GitHub Pages 재배포, QA 테스트 URL 갱신, 배포본 라이브 검증 작업이면 반드시 로드. "배포", "gh-pages", "테스트 빌드", "QA URL", "재배포" 작업이면 이 스킬을 따른다.
---

# gh-pages 테스트 배포

**라이브 URL**: https://sarsah93.github.io/Pixel-Angler-The-Real/
⚠ **원격 컨테이너에서는 이 배포가 유일한 실플레이 경로다**(170차) — dev 서버는 `host: true`여도
사용자 PC의 `localhost:5173`에 닿지 않는다(포트 포워딩 없음). "테스트해보게 서버 열어줘" 요청에는 작업 브랜치 이름과 함께
「테스트 배포」 워크플로를 실행해 달라고 답한다.

## 절차 — 깃허브가 빌드해서 올린다 (2026-10-08부터)

배포는 **수동 실행 워크플로** `.github/workflows/deploy-pages.yml`(이름 「테스트 배포」)가 한다.
에이전트는 `gh-pages` 브랜치에 커밋 · 푸시하지 않는다 — 절대 규칙 0 그대로이고, 배포를 위한 예외는 없다.

1. 배포할 내용이 원격 브랜치에 올라가 있어야 한다(`main` 또는 작업 브랜치).
2. 깃허브 Actions → 「테스트 배포」 → Run workflow 에서 두 칸을 채운다.
   - 배포할 브랜치: 브랜치 이름(기본 `main`). 태그나 커밋도 된다.
   - 한 줄 요약: 이번 배포에 든 변경(예 — `235차 …`). 커밋 메시지에 들어간다.
3. 워크플로가 빌드 → 배포본 검사(절대 경로 · 소스맵) → `gh-pages`를 비우고 복사 → 커밋 · 푸시까지 한다.
   커밋 제목은 `Deploy: N차 테스트 빌드 (날짜) — 브랜치@커밋 · 요약`이고, N은 직전 배포 번호 + 1로 자동 계산된다.
4. 1~2분 뒤 라이브 URL에 반영된다. 아래 「배포 후 라이브 검증」을 한다.

- **워크플로 실행은 외부 공개 행위다.** 실행 단추는 사용자가 누른다.
  에이전트는 배포할 브랜치 이름과 요약 문구를 알려 주고, 사용자가 그 자리에서 배포하라고 했을 때만 대신 실행한다.
- 공공 API 키는 저장소 비밀값 `VITE_DATA_GO_KR_API_KEY`에서 읽는다(이름만 — 값은 어디에도 적지 않는다).
  비밀값이 없으면 날씨가 가상 데이터로 채워진다(오류 아님 · 아래 「경로·API 제약」).
- 워크플로는 지난 배포의 남은 파일을 지운다(`.nojekyll`만 남김) — 손 절차에서 쌓이던 옛 번들이 정리된다.

### 손으로 하는 절차 (워크플로를 쓸 수 없을 때 · 사용자만)

**배포 worktree**: `../pixel-angler-gh-pages` (orphan `gh-pages` 브랜치 — Pages 소스는 브랜치 루트, `.nojekyll` 포함)

```bash
npx pnpm run build                                  # 3/3 성공 확인
git -C ../pixel-angler-gh-pages fetch origin        # ⚠ 로컬 worktree가 origin/gh-pages보다
git -C ../pixel-angler-gh-pages status              #    뒤처져 있을 수 있음 — 먼저 동기화 (73차 노트)
# dist → worktree 루트로 복사 (소스맵 제외!)
#   ⚠ rsync는 이 컨테이너에 없다 — tar 파이프를 쓴다(170차)
#   (cd packages/client-pc/dist && tar cf - --exclude='*.map' .) | (cd ../pixel-angler-gh-pages && tar xf -)
#   구 파일 정리가 필요하면 .git/.nojekyll만 남기고 먼저 비운다
git -C ../pixel-angler-gh-pages add -A
git -C ../pixel-angler-gh-pages commit -m "Deploy: N차 테스트 빌드 (YYYY-MM-DD) — 요약"
git -C ../pixel-angler-gh-pages push origin gh-pages
```

- 커밋 메시지 규칙: `Deploy: N차 테스트 빌드 (날짜) — 포함 변경 요약` (직전 차수는 `git -C ../pixel-angler-gh-pages log -1 --oneline`으로 확인해 +1).
- **소스맵(`*.map`) 절대 포함 금지** — 복사 단계에서 제외.

## 경로·API 제약 (재배포 시 재확인)

- `vite base: './'` + 전 에셋 상대 경로 전제 — **새 에셋 로드에 선행 `/`가 있으면 배포에서만 404** (dev에서는 멀쩡히 동작하므로 조용히 깨진다). 배포 전 `grep`으로 `load.image('…', '/` 패턴 검사 권장.
- 정적 호스팅이라 vite dev 프록시 없음 → NMPNT/MAFRA/KOSIS는 **Mock 폴백**, 기상청(apis.data.go.kr)만 라이브 실데이터 (CORS 허용). 정상 동작이며 버그 아님.
- 번들에 공공 API 키 인라인 노출은 사용자 기승인 사항. 워크플로는 실제로 닿는 기상청 키 하나만 넘긴다.

## 배포 후 라이브 검증 (필수)

Playwright로 라이브 URL 접속 (verify-render 스킬 하네스 재사용, goto만 라이브 URL로):
1. **리소스 404 = 0건** (response 리스너로 4xx 수집)
2. **pageerror = 0건**
3. 메인 메뉴 기동 + 게임 시작 → 필드 진입 스모크
4. QA에게 전달할 변경 요약 정리 (이번 배포에 포함된 차수 범위 명시)
