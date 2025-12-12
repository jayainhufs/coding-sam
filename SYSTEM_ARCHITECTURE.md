# Coding-Sam 시스템 아키텍처

## 1. 개요

**Coding-Sam**은 사용자의 코딩 학습을 돕기 위해 설계된 AI 기반 튜터링 플랫폼입니다. Next.js App Router를 기반으로 구축되었으며, 별도의 백엔드 데이터베이스 없이 브라우저의 `LocalStorage`를 활용하여 사용자 데이터를 관리하는 **Client-First** 아키텍처를 채택하고 있습니다. 복잡한 추론과 생성 작업은 OpenAI API를, 코드 실행은 외부 샌드박스 API(Piston)를 활용합니다.

---

## 2. 시스템 아키텍처 다이어그램

```mermaid
graph TD
    User[사용자 (User)] -->|웹 브라우저 접속| Client[Next.js Client]

    subgraph "Frontend (Client-Side)"
        Client -->|상태 관리| Auth[AuthContext]
        Client -->|데이터 저장/로드| LS[(LocalStorage)]
        Note_LS[사용자 진행도, 점수, <br/>코드 스타일 등 저장] -.-> LS
    end

    Client -->|API 요청| Server[Next.js Server (API Routes)]

    subgraph "Backend (Serverless Functions)"
        direction TB
        Route_Quiz["/api/quiz/generate<br/>(퀴즈 생성)"]
        Route_Feedback["/api/ai/feedback<br/>(5단계 튜터링/힌트)"]
        Route_Eval["/api/ai/evaluate<br/>(학습 평가 리포트)"]
        Route_Style["/api/ai/analyze-style<br/>(코드 스타일 분석)"]
        Route_Run["/api/run<br/>(코드 실행)"]
    end

    Server --> Route_Quiz
    Server --> Route_Feedback
    Server --> Route_Eval
    Server --> Route_Style
    Server --> Route_Run

    subgraph "External Services"
        OpenAI[OpenAI API (GPT-4o)]
        Piston[Piston API (Code Sandbox)]
    end

    Route_Quiz -->|프롬프트 전송| OpenAI
    Route_Feedback -->|프롬프트 전송| OpenAI
    Route_Eval -->|통계 데이터 + 프롬프트| OpenAI
    Route_Style -->|코드 + JSON 모드 요청| OpenAI
    
    Route_Run -->|코드 + 입력값| Piston

    OpenAI -->|JSON/텍스트 응답| Server
    Piston -->|실행 결과 (Stdout/Error)| Route_Run
```

---

## 3. 주요 컴포넌트 및 데이터 흐름

### 3.1. 프론트엔드 (Next.js Client)
*   **상태 관리**: `AuthContext`를 통해 사용자 인증(이름 기반) 및 전역 상태를 관리합니다.
*   **데이터 지속성**: `utils/progress.ts` 등의 헬퍼를 통해 사용자의 문제 풀이 기록, XP, 레벨, 코드 스타일 프로필 등을 브라우저의 `LocalStorage`에 JSON 형태로 저장합니다. 이를 통해 별도 DB 없이도 개인화된 경험을 제공합니다.
*   **UI 컴포넌트**: `LearnWizard`(학습 단계 진행), `AiTutorPanel`(AI 피드백 표시), `EditorRunPanel`(코드 편집 및 실행) 등 기능별로 모듈화되어 있습니다.

### 3.2. 백엔드 (Next.js API Routes)
서버리스 함수 형태로 동작하며, 클라이언트의 요청을 받아 외부 API와 통신하고 결과를 가공하여 반환합니다.

#### A. AI 튜터링 및 피드백 (`/api/ai/feedback`)
*   **기능**: 사용자의 5단계 사고 과정(이해-분해-패턴-추상화-의사코드)에 대해 실시간 피드백이나 힌트를 제공합니다.
*   **흐름**:
    1.  클라이언트가 현재 단계(`step`), 사용자 입력(`userInput`), 모드(`hint` 등)를 전송.
    2.  서버는 해당 단계의 **루브릭(Rubric)**과 역할(Role)이 정의된 시스템 프롬프트를 구성.
    3.  OpenAI API에 요청하여 맞춤형 텍스트 생성.
    4.  `hint` 모드일 경우, 모델이 형식을 지키지 않으면 서버에서 강제로 형식을 정규화(Normalization)하여 반환.

#### B. 퀴즈 생성 (`/api/quiz/generate`)
*   **기능**: 사용자가 푼 문제의 문맥과 약점을 파악하여 6개의 객관식 퀴즈를 동적으로 생성합니다.
*   **흐름**:
    1.  문제 메타데이터와 사용자의 풀이 내용을 프롬프트에 포함.
    2.  OpenAI에게 JSON 배열 형식의 출력을 요청.
    3.  생성된 퀴즈가 부족하거나 중복될 경우, 서버 내장 **Fallback Bank**에서 난이도별(`medium`, `hard`, `applied`) 예비 문제를 보충하여 6개를 채움.

#### C. 코드 실행 (`/api/run`)
*   **기능**: Python, C, Java 코드를 샌드박스 환경에서 실행합니다.
*   **흐름**:
    1.  클라이언트가 언어, 코드, 표준 입력(stdin)을 전송.
    2.  서버는 이를 **Piston API** (오픈소스 코드 실행 엔진) 규격에 맞춰 포워딩.
    3.  Piston의 실행 결과(stdout, stderr)를 받아 클라이언트에 반환.

#### D. 스타일 분석 (`/api/ai/analyze-style`)
*   **기능**: 사용자의 코드를 분석하여 코딩 스타일 프로필을 생성합니다.
*   **흐름**:
    1.  사용자 코드를 전송.
    2.  OpenAI API에 `response_format: { type: 'json_object' }` 옵션을 사용하여 구조화된 JSON 응답을 강제.
    3.  분석된 스타일(변수 명명법, 자료구조 선호도 등)을 클라이언트에 저장하여, 이후 AI 튜터가 이 스타일을 모방하여 코칭하도록 함.

#### E. 학습 평가 (`/api/ai/feedback/evaluate`)
*   **기능**: 학습 데이터를 종합하여 리포트를 생성하고 패널티를 적용한 점수를 계산합니다.
*   **흐름**:
    1.  클라이언트가 `LocalStorage`에 저장된 전체 학습 통계(`summary`) 전송.
    2.  서버는 AI 요청 횟수, 힌트 사용 횟수에 따른 패널티를 계산하여 최종 점수 산출.
    3.  통계 데이터를 바탕으로 OpenAI가 "이번 주 과제", "연습 드릴" 등을 포함한 텍스트 리포트 생성.

---

## 4. OpenAI 프롬프트 엔지니어링 전략

Coding-Sam은 LLM의 환각(Hallucination)을 줄이고 일관된 출력을 얻기 위해 다음과 같은 전략을 사용합니다:

1.  **구조화된 출력 강제**: 대부분의 API에서 JSON 형식의 출력을 명시적으로 요구하거나 `json_object` 모드를 사용합니다.
2.  **명확한 페르소나 부여**: "너는 코딩 스타일을 분석하는 AI 리뷰어다", "너는 소크라테스식 문답법을 사용하는 튜터다" 등 역할을 구체적으로 정의합니다.
3.  **루브릭(Rubric) 제공**: 채점이나 피드백 생성 시, 구체적인 채점 기준표(Rubric)를 프롬프트 컨텍스트로 제공하여 일관된 평가를 유도합니다.
4.  **Fallback 메커니즘**: AI 응답이 실패하거나 형식이 올바르지 않을 경우를 대비해, 로컬에 정의된 기본 데이터(Fallback data)나 규칙 기반 로직이 항상 준비되어 있습니다.

---

## 5. 데이터 저장소 (LocalStorage)

별도의 백엔드 DB 없이 아래와 같은 키(Key) 구조로 데이터를 브라우저에 저장합니다.

*   `coding-sam:user`: 현재 로그인한 사용자명
*   `coding-sam:prefs:{user}`: 사용자 설정 (레벨, 목표, 코드 스타일 등)
*   `coding-sam:progress:{user}`: 문제별 진행 상황, 점수, 시도 횟수
*   `coding-sam:xp:{user}`: 획득한 경험치(XP)
*   `coding-sam:streak`: 연속 학습 일수 정보

