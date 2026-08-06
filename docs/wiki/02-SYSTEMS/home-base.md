# S8. 홈베이스 (홈타운 · 집 · 설치)

> 상태 **🔶 부분** — Tier 0 원룸 + 칸 단위 설치까지. 관련 차수 44·46

---

## 1. 목적·범위
플레이어의 **거점**: 출조 출발지 · 유일한 저장 지점 · 보관(냉장고) · 배치(설치물) · 향후 농사/수조/제작.

## 2. 구성
| 계층 | 파일 | 역할 |
|---|---|---|
| core | `types/HomeBase.ts` | MapObject 인스턴스 스키마 · `WorldObjectState`(removed/moved/placed) · `canPlaceAt` 칸 판정 · `PLACEMENT_DEFS` · `HouseTier` · `computeTravelFare` · `HOMETOWN_OBJECTS`(초기 19개) |
| client | `RegionFieldScene`(hometown) | 오브젝트 렌더·충돌 반영·[E] 상호작용·**설치 모드**(그리드·프리뷰·회수) |
| client | `HomeInteriorScene` | Tier 0 원룸 — 침대(저장)·냉장고·주방·소파 등 |
| client | `FridgeStore` · `FridgePanel` | 냉동 8 / 냉장 16 |

## 3. 동작 구조
```
필드 오브젝트 = 초기(HOMETOWN_OBJECTS) − removed + moved + placed   → effectiveObjects()
설치: 인벤 '설치하기' → placement-request → 그리드 오버레이
      footprint 프리뷰(초록 가능 / 빨강 불가) → 클릭 설치(아이템 1 소모)
      [E] 회수 = 아이템 반환 (이동 = 회수 후 재설치)
저장: locationTag 'hometown_interior' 에서만 canSaveHere() → 침대 [저장하고 쉬기]
교통: 출조 = ₩10,000 차감 / 귀가 = 무료
```

## 4. 세부과제 현황
| 과제 | 상태 | 차수 |
|---|---|---|
| 홈타운 맵 + 오브젝트 19 + 스폰 | ✅ | 44 |
| 실내 Tier 0 + 침대 저장 게이트 | ✅ | 44 |
| 칸 단위 설치/회수 + 영속 | ✅ | 44 |
| 출조 요금·귀가 | ✅ | 44 |
| 냉장고 · 주방 오브젝트 · 실내 스프라이트 | ✅ | 46 |
| 홈타운 어획 규제(볼락류 6종) · 랜덤 날씨/물살 | ✅ | 46 |
| **하우스 Tier 1~3**(평수·주방·지하·2층) | ⬜ | 스키마만 |
| **수조 2종**(활어 상업용 / 관상) | ⬜ | 스키마·상태 골격 완비, 패널 미구현 |
| 텃밭 농사 · 벌목 · 채굴 · 보트 | ⬜ | 상호작용 스텁("추후") |
| 실내 가구 배치 모드 | ⬜ | 스키마 준비됨 |
| 주방 ↔ CookScene/도마 연결 | ⬜ | 불요리 선행 |

## 5. 잔여·차기
활어 수조는 **신선도 정지(freshnessMult 0.1) 루트**라 경제·손질과 직접 연결된다 — 불요리보다 먼저 붙일 가치가 있다.
침대 수면 = 날짜 진행/피로 회복 결합은 로드맵 4·5 단계.

## 6. 함정·불변조건
1. **초기 오브젝트는 core TS 데이터**(JSON 아님) — 타입 안전 + 파이프라인 재생성 없이 조정 가능. 타 지역으로 확산되면 JSON 스키마 이관 검토.
2. **저장은 집 침대뿐** — 새 씬을 만들 때 `locationTag`를 설정하지 않으면 저장 불가가 기본값(의도).
3. Phaser `Container.body`는 예약 프로퍼티 — 필드명 충돌 주의(`gridC` 사용).
4. 실내 캐릭터도 `PLAYER_FOOT_SINK` 접지 보정을 적용한다(스프라이트 하단 여백).
