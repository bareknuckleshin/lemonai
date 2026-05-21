# LemonAI AI 전문가 온보딩 가이드 (빠른 이해판)

> 목적: AI/에이전트 시스템 전문가가 LemonAI 코드베이스를 처음 볼 때, **어디부터 읽고 무엇을 검증하면 되는지**를 빠르게 파악하도록 돕는 문서.

---

## 1) LemonAI를 한 줄로 요약하면

LemonAI는 **Koa API + Agentic 실행 엔진 + Runtime 샌드박스 + SQLite 영속 계층**으로 구성된, 
"계획(Planning) → 실행(Code-Act) → 반성(Reflection) → 요약(Summary)" 루프 기반의 에이전트 시스템입니다.

핵심 포인트는 모델 재학습이 아니라, **프롬프트/메모리/지식 주입 최적화**를 통한 Self-Evolving입니다.

---

## 2) 10분 온보딩 경로 (권장 읽기 순서)

AI 전문가 관점에서 가장 빠른 접근 순서:

1. **서비스 엔트리 확인**: `bin/www`, `src/app.js`
2. **에이전트 실행 진입 확인**: Agent 라우터/서비스에서 `AgenticAgent.run()` 호출 지점
3. **계획 단계 확인**: `src/agent/planning/*`, `src/template/planning.txt`
4. **실행 단계 확인**: `src/agent/code-act/*`, `src/template/thinking.txt`
5. **반성 단계 확인**: `src/agent/reflection/index.js`
6. **장기 진화 확인**: `src/knowledge/feedback.js`, `src/template/knowledge.txt`
7. **데이터 계층 확인**: `src/models/*`, 특히 Conversation/Message/Task/Knowledge/FileVersion

이 순서로 보면 “요청이 들어와서 결과가 저장되기까지”를 코드 레벨에서 선형적으로 추적할 수 있습니다.

---

## 3) 시스템 아키텍처를 전문가 관점으로 해석

- **UI 계층**: Electron Renderer
- **부트스트랩 계층**: Electron Main Process (`main.js`)
- **API 계층**: Koa (`src/app.js`, `bin/www`)
- **에이전트 계층**: Planning + Code-Act + Reflection + Summary
- **실행 계층**: LocalRuntime / DockerRuntime / LocalDockerRuntime
- **기억 계층**:
  - 단기: LocalMemory (task 단위)
  - 장기: Knowledge (SQLite)
- **영속 계층**: Sequelize + SQLite

즉, LemonAI는 "**행동 루프를 중심으로 지식을 재주입하는 정책 엔진**"에 가깝습니다.

---

## 4) 핵심 실행 루프: 실제로 무엇이 반복되나?

`AgenticAgent.run()` 기준 고수준 흐름:

1. 초기 설정/자동 응답
2. Planning으로 task 분해
3. Task별 Code-Act 루프 진입
4. Reflection 기반 성공/실패 판정
5. 실패 시 피드백을 메모리에 주입해 재시도
6. 모든 task 종료 후 summary/파일 버전/상태 업데이트

### Code-Act 미시 루프

- `thinking()`이 **단일 XML action** 생성
- action 파싱 후 runtime 실행
- reflection 평가
- 실패면 LocalMemory에 오류 코멘트 재주입
- retry 제한 내에서 재실행

이 구조 때문에 LemonAI의 품질은 “기저 모델 성능”뿐 아니라,
**프롬프트 엄격성 + 도구 실행 신뢰성 + 피드백 품질**에 매우 민감합니다.

---

## 5) Self-Evolving의 정확한 의미

LemonAI에서 Self-Evolving은 다음 2개 축의 결합입니다.

## 5.1 단기 진화 (실행 중)

- 저장소: LocalMemory
- 목적: 현재 task 실패를 즉시 교정
- 방식: 실패 메시지/코멘트를 다음 turn 입력으로 재주입

## 5.2 장기 진화 (세션 간)

- 저장소: SQLite Knowledge
- 목적: 사용자/전략/실행 정책 축적
- 방식: feedback 기반 Knowledge Reflection(ADD/MODIFY/DELETE/NO_ACTION)

정리하면,
- 단기는 "지금 이 작업"을 고치고,
- 장기는 "다음 작업들"의 정책을 바꿉니다.

---

## 6) 프롬프트 체계에서 꼭 봐야 할 것

### planning 프롬프트 (`planning.txt`)

- Goal, 파일 목록, 이전 요약, best-practice knowledge를 입력으로 받음
- 출력은 파싱 가능한 Markdown task list
- 산출물은 TaskManager와 `todo.md`로 연결됨

### thinking 프롬프트 (`thinking.txt`)

- 출력 형식 제약이 강함(유효 XML 단일 action)
- 도구 우선 사용, 상대 경로, finish/revise/pause 프로토콜 포함
- 실행 신뢰성과 retry 효율에 직접 영향

### knowledge 프롬프트 (`knowledge.txt`)

- 사용자 피드백 기반 지식 변경 연산을 제어
- 장기 기억 정책의 품질을 결정

---

## 7) 전문가가 초기에 검증해야 하는 8가지 체크리스트

1. **Planning 출력 안정성**: 파싱 실패/모호한 task 비율
2. **Action XML 유효성**: thinking 출력 파싱 실패율
3. **Tool-call 성공률**: runtime action 실패 유형 분포
4. **Retry 효율**: 재시도로 실제 성공 전환되는 비율
5. **Reflection 정책**: status 기반 즉시 판정이 충분한지
6. **Knowledge 오염 방지**: 잘못된 rule이 장기 저장되는지
7. **카테고리 주입 품질**: planning/execution 카테고리 분리 효과
8. **최종 산출 정합성**: summary, file version, DB 상태 일치 여부

이 8개를 지표화하면 LemonAI 품질을 빠르게 진단할 수 있습니다.

---

## 8) 성능/품질 개선 포인트 (우선순위)

- 1순위: thinking XML 출력 안정화(스키마 검증, 에러 복구)
- 2순위: reflection 고도화(중간 상태 평가 정밀도 강화)
- 3순위: knowledge 반영의 정밀 필터링(카테고리/신뢰도)
- 4순위: task granularity 최적화(과도하게 큰 task 분해)
- 5순위: runtime 관측성(도구 실행 로그/실패 taxonomy)

---

## 9) “코드 읽기 시작점” 제안 (실무형)

처음 분석할 때 아래 순서로 실제 함수 단위 트레이싱을 권장합니다.

1. API 요청이 Agent 실행으로 연결되는 함수
2. `AgenticAgent.run()` 본문
3. `plan()` 호출부와 파싱 로직
4. `completeCodeAct()` 루프
5. `resolveActions()`와 runtime `execute_action`
6. reflection 판정 함수
7. summary 생성 + file version 기록
8. knowledge feedback 반영 함수

이렇게 보면 "입력-정책-행동-평가-기억" 폐루프가 명확히 보입니다.

---

## 10) 결론

LemonAI는 범용 LLM 래퍼가 아니라,
**에이전트 실행 제어(Planning/Code-Act)와 기억 주입(LocalMemory/Knowledge)을 결합한 정책 시스템**입니다.

따라서 전문가 관점의 핵심은 다음입니다.

- 모델 자체보다 **루프 설계**를 먼저 본다.
- 기능 추가보다 **실패 피드백 경로**를 먼저 본다.
- 성능 개선보다 **지식 주입 품질**을 먼저 본다.

이 관점으로 접근하면 코드베이스 전체를 훨씬 짧은 시간 안에 구조적으로 이해할 수 있습니다.
