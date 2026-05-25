# Evolving Agent Test Plan

이 문서는 LemonAI의 `Self-Evolving` 개념(단기 기억 + Reflection 기반 수정 + 장기 지식 업데이트)을 검증하기 위한 시나리오/테스트 데이터/테스트 코드 설계를 정의합니다.

## 범위

- 단기 메모리: `src/agent/memory/LocalMemory.js`
- 실행 루프와 reflection 재주입: `src/agent/code-act/code-act.js`
- reflection 판정: `src/agent/reflection/index.js`
- 장기 지식 피드백: `src/knowledge/feedback.js`, `src/knowledge/knowledge.util.js`, `src/knowledge/FileStorage.js`

## 시나리오

### S1. 단기 진화 (Session Memory Carry-over)
- **목표**: 같은 대화에서 사용자의 제약/선호가 다음 턴에도 반영되는지 확인
- **입력 패턴**:
  1. Turn1: "항상 한국어, bullet 3개 이하"
  2. Turn2: 독립 과업 요청
- **기대값**:
  - Turn2 출력에서도 동일한 제약 유지
  - LocalMemory에 해당 제약 메시지와 실행 결과가 누적

### S2. Reflection 기반 자기수정
- **목표**: 실패 판정 후 reflection 코멘트가 메모리에 주입되고, 재시도에서 개선되는지 확인
- **입력 패턴**:
  1. 불충분한 중간 결과를 만들기 쉬운 요청
  2. Reflection mock이 `status=failure`와 개선 코멘트 반환
  3. 재시도 요청
- **기대값**:
  - 실패 코멘트가 memory에 user message로 주입
  - 다음 생각/실행 단계에서 해당 코멘트가 prompt 컨텍스트에 포함

### S3. 장기 진화 (Knowledge Reflection Operations)
- **목표**: 사용자 피드백이 ADD/MODIFY/DELETE/NO_ACTION으로 반영되는지 검증
- **입력 패턴**:
  - "앞으로 코드 예시는 TypeScript로" (ADD)
  - "짧게 답해 규칙은 취소" (DELETE/MODIFY)
- **기대값**:
  - 파일 스토리지에 knowledge 문서가 기대 액션대로 생성/수정/삭제
  - 새 세션에서도 반영 가능

### S4. 카테고리 분리 정책
- **목표**: user_profile vs planning/execution 지식이 혼합 저장되지 않는지 확인
- **입력 패턴**:
  - 개인 프로필 정보 + 실행 규칙 피드백 동시 제공
- **기대값**:
  - category 별로 분리 저장

## 테스트 실행 전략

1. **API Integration (권장)**: Docker로 실행한 서비스(`http://localhost:5005`)에 직접 요청
2. **Scenario Validation**: conversation/query + knowledge + platform 엔드포인트 조합으로 S1~S4 베이스라인 점검
3. **확장**: 필요시 스트리밍 agent run 엔드포인트를 별도 E2E 잡에서 검증

## 테스트 실행 방법 (로컬 PC + Docker)

### 1) 서비스 실행 확인

```bash
curl -sS http://localhost:5005/api/platform
```

- JSON 응답이 오면 테스트 준비 완료입니다.

### 2) 의존성 설치

```bash
pnpm install
```

### 3) Evolving API 테스트만 실행

```bash
pnpm run test:evolving:api
```

또는

```bash
npx mocha ./test/evolving/evolving.api.integration.test.js
```

### 4) 결과 해석

- `passing`: localhost:5005 서비스와 API 연동 테스트 성공
- `pending`: 테스트 시작 전 서버 연결 체크 실패(대부분 Docker 미기동/포트 미노출)

### 5) 다른 호스트/포트로 테스트하고 싶을 때

```bash
LEMON_API_BASE_URL=http://127.0.0.1:5005 pnpm run test:evolving:api
```

## 자동화 우선순위

1. S1 + S2
2. S3
3. S4

## 로컬 관찰 포인트 (WSL)

- Docker 앱 기동 후 `http://localhost:5005` 응답 여부
- `/api/platform`, `/api/knowledge`, `/api/conversation/query` 응답 스키마
- (확장) `/api/agent` 계열을 붙여 실제 evolving 흐름의 end-to-end 검증
