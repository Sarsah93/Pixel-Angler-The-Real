# The Real Angler — 구현 계획서 (IMPLEMENTATION_PLAN)

> **최종 업데이트**: 2026-07-07 (Phase 4 완료, Phase 5 진행 중)
> **작업 기준**: 원래 설계 문서 기반. 이 계획서가 모든 구현의 기준입니다.

---

## 전체 구현 단계

```
Phase 1: Core 엔진 & 타입 정의          ✅ 완료
Phase 2: DB 스키마 & 데이터              ✅ 완료
Phase 3: Phaser 씬 초기 구조             ✅ 완료
Phase 4: 빌드 검증 & 오류 수정           ✅ 완료
Phase 5: 게임플레이 연결 & 심화          🚧 진행 중 (60%)
Phase 5B: 탑다운 필드 & 씬 전환 개선    🚧 진행 중 (50%)
Phase 6: 서버 & 멀티플레이               ⬜ 대기
Phase 7: Tauri v2 통합 & 패키징          ⬜ 대기
```

---

## Phase 4 완료 요약 (참고용)

| 작업 | 결과 |
|------|------|
| 빌드 오류 전면 수정 | ✅ `tsc --noEmit` 통과 |
| GameState 확장 (deployedTraps, coolerInventory, licenses) | ✅ 완료 |
| TrapScene ↔ GameState 연동 | ✅ 완료 |
| CookScene ↔ GameState 연동 (coolerInventory) | ✅ 완료 |
| NightHuntingScene ↔ GameState 연동 | ✅ 완료 |
| LicensePanel ↔ GameState 연동 | ✅ 완료 |
| FieldScene 퀵 액션 버튼 & 단축키 (H/T/C/L) | ✅ 완료 |
| EnvironmentHUD 타입 오류 수정 | ✅ 완료 |

---

## Phase 5B: 탑다운 필드 & 씬 전환 개선 (현재 진행 중)

### 핵심 아키텍처 결정

> **씬 전환 방식**: `scene.pause('FieldScene')` + `scene.launch(subScene)` 방식 채택
> - FieldScene을 멈추고 하위 씬을 위에 올림
> - 하위 씬 종료 시 `this.scene.stop()` + `this.scene.resume('FieldScene')` 호출
> - FieldScene은 `events.on('resume')` 에서 `cameras.main.fadeIn(300)` 처리

### 완료된 작업 ✅

- **FieldScene.ts 전면 재작성**: 바람의나라 스타일 탑다운 4방향 이동
  - 월드 크기: 2048×1536 (중형)
  - WASD + 방향키 동시 지원
  - 카메라 팔로우 (`startFollow` + 월드 바운드)
  - 구역별 배치: 수역/방파제/마을/갯벌/통발구역
  - 건물 6개 (낚시점/마트/식당/면허사무소/민박/어판장)
  - 픽셀 캐릭터 Graphics로 직접 드로우 (4방향 표정 변환)
  - `[E]` 키 건물 상호작용 + 근접 힌트 팝업
  - `pause + launch` 방식 씬 전환
  - `[H/T/C/L/ESC/SPACE]` 단축키 완전 재구성

- **TrapScene.ts 씬 복귀 수정**:
  - 나가기 버튼 → `fadeOut` → `scene.stop()` + `scene.resume('FieldScene')`

### 남은 작업 🚧

#### 5B-1. CookScene 씬 복귀 수정
**파일**: `packages/client-pc/src/scenes/CookScene.ts`
- 나가기 버튼에서 `scene.stop()` + `scene.resume('FieldScene')` 적용
- `create()` 상단에 `cameras.main.fadeIn(250)` 추가

#### 5B-2. NightHuntingScene 씬 복귀 수정
**파일**: `packages/client-pc/src/scenes/NightHuntingScene.ts`
- 나가기/종료 버튼에서 `scene.stop()` + `scene.resume('FieldScene')` 적용
- `create()` 상단에 `cameras.main.fadeIn(250)` 추가

#### 5B-3. FishingScene 씬 복귀 수정
**파일**: `packages/client-pc/src/scenes/FishingScene.ts`
- 결과 팝업 후 `scene.start('FieldScene')` → `scene.stop()` + `scene.resume('FieldScene')`으로 교체

#### 5B-4. MainMenuScene 개선
**파일**: `packages/client-pc/src/scenes/MainMenuScene.ts`
- 게임 타이틀 로고 별도 블록으로 강화 (픽셀 폰트 + 하이라이트 효과)
- 메뉴에 `▶ 가이드 & 스토리` 항목 추가
- 가이드 오버레이: 조작법 안내 (방향키/WASD, SPACE, E, H/T/C/L, ESC)
- 스토리 오버레이: 게임 인트로 스토리라인

#### 5B-5. WorldMapScene spotId 전달 개선
**파일**: `packages/client-pc/src/scenes/WorldMapScene.ts`
- 스팟 클릭 시 `this.scene.start('FieldScene', { spotId })` 로 data 전달 방식 통일
- FieldScene의 `init(data: { spotId?: string })` 수신 부분 검증

---

## Phase 5: 게임플레이 연결 (나머지)

### 5-3. 퀘스트/목표 시스템 (기본)

**신규 파일**: `packages/core/src/types/Quest.ts`
- 튜토리얼 퀘스트 5개
- 라이선스 해금 퀘스트 5개

### 5-4. AnglerLogScene 실데이터 연동
**파일**: `packages/client-pc/src/scenes/AnglerLogScene.ts`
- `GameState.player.caughtFishHistory`와 연동

### 5-5. TournamentScene 신규 구현
**신규 파일**: `packages/client-pc/src/scenes/TournamentScene.ts`

---

## Phase 6: 서버 & 멀티플레이

### 6-1. 실시간 낚시터 공유
**파일**: `packages/server/src/socket/PlayerSync.ts` (확장 필요)
- 같은 낚시터 플레이어 도트 표시

### 6-2. 날씨/물때 공유
- 서버에서 API 호출 후 소켓으로 브로드캐스트

### 6-3. 토너먼트 실시간
**파일**: `packages/server/src/socket/TournamentManager.ts`

---

## Phase 7: Tauri v2 통합 & 패키징

### 7-1. Tauri v2 앱 설정
- `packages/tauri-wrapper/` 완성
- 윈도우 1280×720 고정

### 7-2. 로컬 파일 세이브
- `localStorage` → Tauri `fs` 플러그인으로 전환
- `%APPDATA%/TheRealAngler/save.json`

### 7-3. Steam SDK 연동 (미래)

---

## 씬 전환 아키텍처 (기준)

```
MainMenuScene
    ↓ scene.start (페이드)
WorldMapScene
    ↓ scene.start (페이드)
FieldScene  ← 탑다운 월드 허브 (pause 상태 유지)
    ↓ scene.pause + scene.launch (페이드)
    ├─ FishingScene       → stop + resume('FieldScene')
    ├─ NightHuntingScene  → stop + resume('FieldScene')
    ├─ TrapScene          → stop + resume('FieldScene')
    ├─ CookScene          → stop + resume('FieldScene')
    ├─ TackleRoomScene    → stop + resume('FieldScene')
    ├─ AnglerLogScene     → stop + resume('FieldScene')
    └─ RestaurantScene    → stop + resume('FieldScene')
```

---

## 현재 빌드 상태

```bash
# 마지막 확인: 2026-07-07
npx pnpm run build → ✅ 3/3 패키지 성공
npx pnpm --filter @tra/client-pc run typecheck → ✅ 0 오류
```

---

## 파일 작성 템플릿

### 새 Phaser 씬 파일 구조
```typescript
/**
 * @file XxxScene.ts
 * @description [씬 설명 — 한국어]
 */

import Phaser from 'phaser';
import { GameState } from '../store/GameState.js';

export class XxxScene extends Phaser.Scene {
  constructor() {
    super({ key: 'XxxScene' }); // 파일명과 동일
  }

  create(): void {
    this.cameras.main.fadeIn(250, 0, 10, 20); // 항상 페이드인
    // 구현
  }

  // 나가기 버튼 패턴
  private createBackButton(): void {
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(220, 0, 10, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop();
        this.scene.resume('FieldScene');
      });
    });
  }
}
```

---

## 주요 참고 자료

- **어신앱 기반 물때 정보**: `core/src/db-schema/AnglerAppSpots.ts`
- **KHOA (해양조사원) API**: `core/src/api-client/OceanApiClient.ts`
- **기상청 API**: `core/src/api-client/WeatherApiClient.ts`
- **공공데이터포털**: `core/src/api-client/PublicDataClient.ts`
