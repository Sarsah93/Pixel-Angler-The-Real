# 배경음 후보 초안 (253차 · Lyria)

- 생성기: `tools/gemini_bgm.cjs` — 장면 9곳 표(`TRACKS`) + 공통 꼬리(보컬 없음 · 반복 재생 · 큰 클라이맥스 없음).
- 모델: `lyria-3-pro-preview`(응답 기록상 `lyria-3.5`) — 곡마다 약 2분 14초 ~ 2분 58초, 44.1kHz 스테레오 192kbps MP3.
- `_log.jsonl` = 곡마다 모델 · 걸린 시간 · 길이 · 구간 표시 · 한국어 설명 · 영어 프롬프트(다시 뽑을 때 그대로 쓴다).
- **MP3 파일은 저장소에 넣지 않았다**(9곡 약 34MB). 253차 대화에서 사용자에게 보냈고, 고른 곡만 반복 이음매 · 음량을 맞춰
  `packages/client-pc/public/audio/`로 넣는다(백로그 BZ).

다시 뽑기:

```bash
NODE_USE_ENV_PROXY=1 node tools/gemini_bgm.cjs --out <폴더> --only menu,rain --tag v2
```
