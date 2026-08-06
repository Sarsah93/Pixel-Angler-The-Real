# S10·S11·S13. UI 프레임워크 · 가이드 허브 · dev 도구

> 상태 **🟢 운영**. 관련 차수 13·26·27·31·33·54·71·73·76

---

## 1. 목적·범위
모든 팝업/HUD가 공유하는 **틀과 규칙**(드래그·z-order·스크롤·텍스트 안전), **온보딩 가이드**, **개발 도구**(튜닝·검증).

## 2. 구성
| 파일 | 역할 |
|---|---|
| `ui/DraggablePanel.ts` | 공통 베이스 — 헤더 드래그 · ✕ · **depth 기반 동적 최상단** · 모달 dim · `applyScreenFixed` |
| `ui/TextFit.ts` | `clampTextWidth`(한 줄 말줄임) · `fitTextHeight`(블록 축소) |
| `ui/Dialogs.ts` | 확인/수량 다이얼로그 |
| `scenes/SceneFade.ts` | `fadeOutThen` — 폴백 타이머 + WeakSet 이중 실행 가드 |
| `ui/GuidePanel.ts` · `data/GuideContent.ts` | 가이드 허브(4카테고리 19페이지, 데이터 추가만으로 확장) |
| `core/config/tuning.ts` · `dev/DevTuningPanel.ts` | TUNING/META → **F8 슬라이더** + 스냅샷 복사 |
| `ui/RegionHud.ts` · `HUD.ts` · `MiniMap.ts` | HUD 계열 |

## 3. 동작 구조

### z-order 밴드 (76차)
```
일반 [800,899)  인벤·장비·상점·쿨러·상세보기   클릭 = 피어 max+1 (캡 898)
모달 [900, ∞)  손질·회썰기·가이드·다이얼로그   dim = depth−1, 아래 입력 흡수
포커스 캡처: 씬 pointerdown에서 "패널 rect 안 + 위에 덮는 패널/모달 없음"이면 raise
ESC: depth 최고(시각적 최상단)부터 닫는다 (동률이면 LIFO)
```

### 목록 렌더 규칙
- **인터랙티브 목록 = 윈도우드 렌더**(보이는 행만 생성). 마스크는 **입력을 클립하지 않아** 팬텀 히트가 남는다.
- **비인터랙티브 본문 = 마스크 허용**, 단 `setScrollFactor(0)` 필수(카메라 스크롤 씬에서 어긋남).
- **드래그는 커스텀 포인터 방식** — `scrollFactor 0` 패널에서 Phaser 네이티브 `draggable`은 `drag` 이벤트가 죽는다.

### 텍스트 3항 검수
신규·수정 패널은 **오버플로 · 겹침 · 스크롤/클립**을 가장 긴 콘텐츠로 실렌더 확인한다(§AGENTS 4).

### 가이드 허브
`GUIDES[{key,label,pages[]}]` 데이터 → 탭 + 삽화 카드 + ◀▶/점 네비. 카테고리별 **최초 1회 자동 표시**(`GameState.flags 'guideSeen.<cat>'`).

### dev 도구
| 도구 | 키 | 용도 |
|---|---|---|
| 튜닝 슬라이더 | `F8` | TUNING_META 자동 생성 · 즉시 반영 · 스냅샷 → tuning.ts 확정 |
| 손질 좌표 편집기 | `F9` | 유도선 끝점/곡선 드래그 · [복사] 스니펫 (⚠ opts 미포함) |
| 손질 항법 | 패널 좌하단 | 섹션 건너뛰기 / 개별 작업 점프(앞 단계 완료 처리) |
| 검증 하네스 | — | Playwright(**설치 Chrome channel**) + dev 서버 + `__INV`/`__GS` |

## 4. 세부과제 현황
| 과제 | 상태 | 차수 |
|---|---|---|
| DraggablePanel 공통화 + 화면 고정 히트 보정 | ✅ | 13 |
| 팝업 z-order 포커스 + ESC 정합 | ✅ | 76 |
| 텍스트 상한 헬퍼 + 고순위 4건 수정 | ✅ | 54 |
| 도감 페이징·헤더 겹침 | ✅ | 71 |
| SceneFade 공용 안전망(17곳) | ✅ | 73 |
| 가이드 허브(19페이지·자동 표시) | ✅ | 27 |
| 튜닝 중앙화 + F8 | ✅ | 26 |
| 텍스트 선명도(present 스무딩) | ✅ | 31 |
| **저순위 팝업 전수 검수** | 🔶 | 잔여 목록은 BACKLOG |
| `LicensePanel` 목록 스크롤 | ⬜ | 10개째부터 조용히 누락 |
| fight/rod/yield 테이블 TUNING 소비 전환 | ⬜ | 선언만 이전됨 |

## 5. 잔여·차기
저순위 팝업 검수 · LicensePanel 스크롤 · 튜닝 소비 전환 · 가이드 삽화 실사화 · i18n 키 분리.

## 6. 함정·불변조건
1. **화면 고정 UI는 트리 전체에 `scrollFactor 0`** — 자식은 자기 scrollFactor로 히트 판정한다(`applyScreenFixed` 필수).
2. **마스크는 입력을 클립하지 않는다** — 인터랙티브 목록에 쓰지 말 것.
3. **네이티브 draggable 금지**(위 §3).
4. **UI 텍스트에 이모지 접두사 금지** — 아이콘이 콘텐츠인 경우만 예외(사용자 지시).
5. 측정 시 **origin 보정**(`x + width*(1−originX)`) — origin 0.5 라벨을 `x+width`로 재면 오버플로로 오판한다.
6. 하네스: `DraggablePanel`은 `scene.add.existing()` 필요 · `page.goto`는 `domcontentloaded` + 씬 활성 대기(외부 API 폴링 때문에 `networkidle` 불가) · 가이드 자동표시 플래그 프리시드.
