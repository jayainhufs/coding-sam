# coding-sam

단계 학습이 탑재된 AI 코딩 튜터 웹앱 (로컬 3000 → EC2 단일 인스턴스 전개 용이)

## 1) 설치 & 실행
```bash
npm i
cp .env.local.example .env.local  # OPENAI_API_KEY 입력
npm run dev                       # http://localhost:3000
```

## 2) 구조 핵심
- Next.js App Router + Route Handlers(API)로 프론트·백엔드 일원화
- `/app/api/ai/feedback` : OpenAI Responses API 호출
- `/app/api/problems` : 문제 목록/추천/단건 조회 (현재 JSON, 추후 DB)

## 3) 배포(단일 EC2)
- Node 20, `npm run build && npm start` or Dockerfile 사용
- 환경변수: `OPENAI_API_KEY`, (추후) `DATABASE_URL`

## 4) 개발 메모
- UI: Tailwind. 단계: 이해→분해→패턴→추상화→의사코드
- 리포지토리 레이어로 JSON→DB 전환 최소화