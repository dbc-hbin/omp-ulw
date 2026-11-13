# 변경 이력

[English](CHANGELOG.md) | 한국어

### 2026-11-13 프롬프트 중복만 축소

- Sonic 배정 조건과 ULW 모델·호스트 소유권 재설명을 제거하되, 같은 주입 블록의 기존 요구는 유지합니다.
- native todo/sh 설명은 원문을 인식하고 실제 현재 프리셋에 동등한 요구가 있을 때만 중복을 제거합니다. 모델 규칙·고유한 도구 동작·커스텀 설명·미지원 모델 동작은 보존합니다.
- Delivery, 복원한 조사·추론 조건, 모델 예산·응답 언어·child 경계와 메인·자식 Terra 연결은 유지합니다.

native 계약: [todo](https://github.com/can1357/oh-my-pi/blob/v18.19.0/packages/coding-agent/src/prompts/tools/todo.md), [eval/sh](https://github.com/can1357/oh-my-pi/blob/v18.19.0/packages/coding-agent/src/prompts/tools/eval.md).

### 2026-11-13 GPT-6.1 Terra 메인·자식 프리셋 연결

- GPT-6.1 Terra를 메인과 자식 세션 모두에서 `gpt-6-astra`에 연결하고, 자식 전용 제한과 Sol 경유를 제거합니다.
- 업스트림 매칭 우선순위, provider·Fast·표시 이름 별칭, 버전 경계와 실제 요청 모델·provider를 유지합니다.
- 기존 라우팅·provider fallback·실제 호스트 프리셋 검증에 메인 Terra를 포함합니다.

### 2026-11-13 전달 지침 롤백 및 라우팅 요구 복원

- 아래 프롬프트 책임 중복 축소 항목의 Delivery 제거를 롤백합니다. native 전달 지침은 라이브 추가·변경을 포함해 원문 그대로 보존하며, 편집 전 중복 지침만 조건부로 제거·복원합니다.
- external research의 scout 문장(라이브러리/버전 명시, 공식 출처 우선, 출처 링크 요구)과 추론 전용 과제의 요구(목표, 제약, 근거, 반례, 기각된 대안, 실행 가능한 권고 하나이며 규정된 결론이 아님)를 복원합니다.

### 2026-11-13 프롬프트 책임 중복 축소

- task 역할 라우팅을 축약하되 전문 역할 경계·미해결 판단·근거 요구와 native 도구 권한을 유지합니다.
- ULW의 활성화 문법·키워드 매핑 설명은 호스트 책임으로 축소하고, 브라우저 상세는 필요할 때 읽는 스킬 참조로 바꿉니다. 실제 활성화·목표 소유권·저장된 상태·이어하기 동작은 유지합니다.
- 남아 있는 native 편집 전·전달 지침은 활성 프리셋이나 보존된 Runtime이 같은 규칙을 소유할 때만 제거합니다. 모델 전환으로 해당 근거가 없어지거나 미지원 모델로 fallback하면 복원합니다.
- 일반 도입부·handoff 주기·보고 형식 설명을 축약하고 모델별 실행·재독해·검증 단계·도구 예산과 upstream 생성 번들은 변경하지 않습니다. Kimi K2의 명시적 routing 계약은 유지합니다.
- 권한·거절 확정·프로젝트 문맥·자식 Hand-off·native mode와 직전 브라우저·컴퓨터·세션 검색 도입을 보존합니다.

### 2026-11-13 Native 계약 보정과 다중 제품 세션 검색

- 브라우저 참조에 OMP 18.20의 진단 반환 형식·증분 로그 커서·Eval timeout 상속을 반영하고, WebKit 선택과 Chromium 전용 증거 수집의 차이를 명시합니다.
- 이전 호스트에 새 capability 필드가 있다고 가정하지 않고 macOS secure input의 중단 감지 한계를 추가합니다. native 권한·사용자 개입·foreground 제어 경계는 유지합니다.
- `/coding-agent-sessions`와 native 스킬 경로로 Python 3.11+ 다중 제품 세션 검색을 제공합니다. 제한된 검색 미리보기, 플랫폼·기간·프로젝트 필터와 하위 세션 범위는 유지하고 upstream read/get 명령은 제외합니다. 특정 OMP 세션의 상담은 native `seance`가 담당합니다.
- 출처·라이선스를 보존합니다. OMP 업그레이드·선택 backend 활성화·DAG 런타임·프롬프트 디블로트는 포함하지 않습니다.

출처: [OMP 18.20 브라우저 계약](https://github.com/can1357/oh-my-pi/blob/v18.20.0/packages/coding-agent/src/prompts/tools/browser.md), [OMP secure input](https://github.com/can1357/oh-my-pi/blob/v18.20.0/packages/coding-agent/src/prompts/tools/computer-secure-input.md), [OMO 793cb219 세션 검색](https://github.com/code-yeongyu/oh-my-openagent/tree/793cb219586ff517762221aba0671bcf2d63ab86/packages/shared-skills/skills/coding-agent-sessions).

### 2026-11-11 브라우저 워크플로 연동 전수조사

- 공통 ULW 지침이 활성화되지 않는 native 스킬 호출까지 포함해, research와 mass-research에 정적·동적·인증·차단 출처 접근 계약을 직접 연결합니다.
- 수집·확장 작업자에게 browser·ultimate-browsing 참조, 실제 도구 조건, 승인된 상태와 필요한 증거를 명시해 전달합니다. 스킬이나 브라우저 핸들이 부모에게서 상속된다고 가정하지 않습니다.
- 동적 참조 추출, HTML 보고서 layout probe 평가와 캡처를 native 브라우저 계약에 연결합니다. 문서 head 스타일, 필요한 캡처 범위, 출처 기록과 지원 한계를 보존합니다.
- core Atlas·ULW 변형과 첨부 절차를 포함한 브라우저 관련 업스트림 문서 69개를 대조합니다. 직접 계획·토론·실행·루프, frontend 근거 수집, 대시보드 확인, native PDF 인쇄와 기존 프로젝트 성능 감사 경로를 보완합니다. 내부 CSRF·업로드 정책 조작 대신 승인된 일반 첨부 UI를 사용하며 외부 게시를 자동 실행하지 않습니다.

출처: [OMO 42d5746e 리서치 수집](https://github.com/code-yeongyu/oh-my-openagent/blob/42d5746e72bfcfb782db6b5182b70a3e9c55f1cc/packages/shared-skills/skills/ulw-research/references/research-collection.md), [Senpi 리서치 작업 지시](https://github.com/code-yeongyu/oh-my-openagent/blob/42d5746e72bfcfb782db6b5182b70a3e9c55f1cc/packages/omo-senpi/skills/ulw-research/references/research-collection.md). 명령·스킬 연결은 OMP 18.18.7에서 확인하며, 기존 브라우저 API의 버전별 근거는 attribution을 유지합니다.

### 2026-11-11 Native 브라우저 스킬 재이식

- `browser` 스킬을 `/web-browser`로 호출해 OMP 자체 `/browser` 모드 명령을 보존하고, 탭·연결 소유권, relay·CDP·native backend, ref·프레임·좌표, JSON·route·HAR·trace, 사람 인계와 탭에 묶인 vault 상태 참조를 추가합니다. OmOWright 작업 지침을 OMP Eval prelude로 옮기며 별도 런타임이나 필수 릴레이를 가정하지 않습니다.
- `/ultimate-browsing`에서 업스트림 reader 참조 21개의 출처 검증·아카이브·공개 API·소셜·한국 플랫폼·미디어·피드·개발·채용·선택 외부 reader 지식을 모두 대응합니다. 정적 접근은 native `read`·`web_search`가 소유하고 별도 추출 엔진·쿠키 내보내기·서비스 자동 설치는 포함하지 않습니다.
- debugging·visual-qa·frontend·review·execute·loop·ULW·visualize의 브라우저 지침을 구체적인 native API에 연결합니다. 캡처 범위·권한·거부 확정·실제 인증 상태 조건을 보존합니다. 기기 변경의 재로드, 반환된 캡처 경로와 backend별 한계를 명시합니다.
- 원본 라이선스와 전체 대응표를 보존합니다. cooperation token·사람 호출 배너·프레임 병합 ref·고정 stealth identity·OCR/CAPTCHA helper는 가짜 native 메서드 대신 지원 차이로 기록합니다.

출처: [OMO 42d5746e 브라우저 관련 스킬](https://github.com/code-yeongyu/oh-my-openagent/tree/42d5746e72bfcfb782db6b5182b70a3e9c55f1cc/packages/shared-skills/skills), [OMP 18.18.6 브라우저 계약](https://github.com/can1357/oh-my-pi/blob/v18.18.6/packages/coding-agent/src/prompts/tools/browser.md).

### 2026-11-11 Fable 5.2와 관찰 근거 중심 스킬 이식

- 33개 프리셋 번들을 Senpi `f75b592c51239c4baf30e3f5cb4d200f088205b1`에 고정합니다. 임시 Fable 5.5를 Fable / Mythos 5.2 전용 코어와 라우팅으로 교체하고, 갱신기에서 폐기된 launch 모듈의 import 예외를 제거합니다. 임의 외부 의존성은 계속 거부합니다.
- OMP의 blocking 질문·권한·거부 확정·자식 역할·도구 계약을 보존합니다. Fable 5.2의 새 장애물 처리는 원인 진단과 제한된 복구로 보정하고, 필요한 승인은 장애물이 드러나는 시점에 해결합니다.
- 기존 research journal과 mass-ulw 인계에 주장별 `OBSERVED`, DEAD END와 수렴 판단의 `PROBED` 근거를 유지합니다. 기억은 조사 단서로 취급하고 추론을 구분하며, 유효한 기존 근거나 통과한 검사를 일괄 재실행하지 않습니다.
- 벤치마크·A/B·holdout·LLM 평가의 독립성을 감사하는 읽기 전용 `eval-integrity` 스킬과 `/eval-integrity` 명령을 추가합니다. 도구 접근·native mode·승인은 OMP가 소유합니다.
- 번들에는 Haiku 5.5의 native 검색 조건 수정도 포함됩니다. OMP의 검색 안내는 계속 실제 활성 `web_search` 도구에서 결정하며, Senpi의 native 검색 확장이나 브라우저 런타임은 추가하지 않습니다.

출처: [Fable 5.2 코어](https://github.com/code-yeongyu/senpi/commit/9b13230fd26315ea96c42a1d351a894905e5e853), [Haiku 검색 조건](https://github.com/code-yeongyu/senpi/commit/9ada5ad17e4646070012df063d15d235717da26d), [리서치 관찰 근거](https://github.com/code-yeongyu/oh-my-openagent/commit/14265efca5dfe162419e568bd140ff26a98e0b9d), [data-first 계약](https://github.com/code-yeongyu/oh-my-openagent/commit/41308e3f6877ba252f9687256705e025b33b4920), [eval-integrity](https://github.com/code-yeongyu/oh-my-openagent/blob/42d5746e72bfcfb782db6b5182b70a3e9c55f1cc/packages/shared-skills/skills/eval-integrity/SKILL.md).

### 2026-11-09 Frontend 외부 참조 생성 전환

- OMO의 원본 관리 방식을 따라 frontend 외부 참조 본문의 직접 추적을 네 고정 Git 서브모듈과 명시적 로컬 생성 명령으로 대체합니다. 기존 런타임 경로와 OMP용 안내문은 유지하고 생성 파일은 Git에서 제외합니다.
- 설치·배포 전에 디자인·taste·UI/UX·designpowers 참조를 생성합니다. 라이선스 고지, 범위가 정해진 OMP 참조 보정, designpowers 설명 필드 정규화와 Python 형제 모듈의 바이트코드 생성 억제를 보존합니다. taste 참조는 과거 캡처 생략문 대신 고정 원본의 전체 본문을 유지합니다.
- 사용자 선택에 따라 기존 확장 UI/UX 자료 대신 고정된 UI/UX Pro Max 원본을 사용합니다. 로컬 데이터 보정·motion dial·추가 데스크톱 스택·원본에 없는 참조는 제거하고, 고정 검색 엔진의 레지스트리에 있는 데이터와 스택은 유지합니다.
- 재귀 clone·원본 초기화·재생성·오프라인 배포용 생성 완료 스킬 트리 복사를 문서화합니다. OMP 런타임에는 네트워크나 생성 작업을 추가하지 않습니다.

출처: [OMO 참조 목록](https://github.com/code-yeongyu/oh-my-openagent/blob/511dc35e22a7c4e2cebb8f0c5bab74b8660dc430/packages/shared-skills/scripts/frontend-refs-manifest.mjs), [OMO 생성기](https://github.com/code-yeongyu/oh-my-openagent/blob/511dc35e22a7c4e2cebb8f0c5bab74b8660dc430/packages/shared-skills/scripts/materialize-frontend-refs.mjs).

### 2026-11-09 모델별 지침 우선과 충돌 정리

- 지원 모델의 일반 작업 방식을 모델 프리셋이 소유하도록 정리합니다. 겹치는 native 계획·재읽기·위임·검증 지침을 제거하되 도구·권한·프로젝트·자식 계약은 보존하며, 미지원 모델 fallback에서는 native 기본 행동을 복원합니다.
- 요청 직전에 활성 도구를 갱신하고, 지원 프리셋에서 eval·todo의 중복 병렬 실행 강제와 bash의 상충하는 리다이렉션 금지 문구를 제거합니다. eval의 workpool 결과 전달·대기 계약은 유지하며, 미지원 모델은 native 도구 설명과 병렬 실행 기본 지침을 유지합니다. native orchestration 알림도 변경 없는 원문·검사를 다시 수행하도록 강제하지 않습니다.
- 원본 생성 번들을 바꾸지 않고 프리셋 내부의 도입부 주기, blocking 질문, 없는 도구 요구, 설명 요청, 복구 범위와 async·서비스 계약의 불일치를 정리합니다.
- ULW 명령·별칭은 입력 맨 앞에서만 활성화합니다. 설명 문장의 언급은 무시하고 전문 워크플로의 중복 native goal을 방지하며, paused·budget-limited goal의 소유권을 유지합니다.
- 계획은 native local-plan·propose 권한에 맞추고, research 재개는 기존 소유자를 유지합니다. visual-qa는 한 번의 제한된 수리 루프와 해당 캡처 범위를 공유하며, 워크플로 문서의 중복 dispatch 규칙을 제거합니다.
- 승인된 native local 계획을 명시적으로 선택한 실행 워크플로에 직접 인계합니다. 승인 원본은 유지하고 기존 Boulder 작업에서 계획의 과제 참조와 재개 상태를 추적합니다.

### 2026-11-09 병렬 실행 지침 중복 제거

- 인식된 OMP Tool Policy에서 일반적인 병렬 호출 지침 두 곳을 제거합니다. 독립 호출의 실행 방식은 활성 도구에 맞춘 기존 모델별 프리셋이 결정합니다.
- 선행 조건 확인, 나머지 호스트 정책, 도구 설명·스키마, 프로젝트 문맥과 자식 할당은 보존합니다. 사용자 정의 시스템 템플릿은 변경하지 않습니다.

### 2026-11-09 셸 실행 지침

- 활성 도구에 맞춰 지원 모델 프리셋에 공통 셸 지침을 추가합니다. 셸 상태에 의존하는 bash 호출은 순서대로 실행합니다. 복사본으로 실행됐다고 보고된 중첩 호출은 직전 완료 명령 경계의 상태를 보며, 변경은 원래 셸에 남지 않습니다.
- `sh()`는 실제 eval 설명에 제공될 때만 사용합니다. 짧은 명령이 끝날 때까지 자동 백그라운드 전환 없이 기다리며, bash 도구와 별도의 셸 상태를 유지합니다. 긴 작업·감시는 사용 가능한 native async bash로 실행합니다.
- data-scientist 실행 환경 문서에도 같은 경계를 반영합니다. OMP 소유의 도구 설명·스키마를 보존하며 런타임 업그레이드나 생성 프리셋 번들 변경은 포함하지 않습니다. 셸 복사 동작은 OMP 18.18.2에 포함됐고, `sh()`는 조사한 main 기준 미출시입니다.

출처: [OMP 중첩 셸 복사](https://github.com/can1357/oh-my-pi/commit/1e2fbfd2e24f1f40a15e58dae90b7d6d2e2dac8a), [OMP eval 셸 헬퍼](https://github.com/can1357/oh-my-pi/commit/d013a0a2695cd3fa2fd494b12d99bc93c30a0915).

### 2026-11-09 OMP 표식 호환성과 OMO 스킬 갱신

- **OMP 어댑터:** 안정판의 `§`와 차기 `⁂` 시스템 섹션 표식을 모두 인식하며, 한 템플릿 안에서는 같은 표식만 허용합니다. 사용자 정의 템플릿, 호스트 기능, 프로젝트 규칙과 자식 할당은 보존합니다. 기존 역할 치환 회귀 검사와 native 자식 smoke를 두 표식에 맞췄습니다.
- **차트 정확성:** 데이터가 있는 곳에서 집계하고 보고 시간대를 명시하며, 미완료 구간은 해당 막대에 표시하고 핵심 수치를 이름을 밝힌 두 번째 출처로 교차검증합니다. 브라우저 HTML 결과물과 독립 PNG 전달 경로를 OMP의 실제 표시 도구에 맞춰 구분합니다.
- **Visualize·frontend:** CSS 클래스 범위를 분리하고 기존 네 가지 테마·화면 폭 캡처에서 막대 치수·범례 색을 측정하며 양끝 축 라벨을 정렬합니다. 단순 차트·표·다이어그램 결과물은 명시적 요구가 없으면 디자인 시스템·Lighthouse·리서치 게이트를 생략하지만 빌드·lint·접근성·동작·시각 검증은 유지합니다.
- **스킬 정합성:** 시각 리뷰 지시에 페이지 레이아웃의 1920 px 캡처를 포함하고, programming의 refactor 조건과 frontend의 주 행동 하나 강조 규칙을 맞췄습니다. 도구에서 확인한 ast-grep의 lazy `$$$` 캡처를 설명하고, 충돌하는 native goal은 차단하며 루프 상태는 리드 세션이 소유하도록 명시합니다.
- **비교 기준:** OMO `dev` `adddd17004076e799c2de18ccfdee29e12525ace`, 설치본·최신 안정판 OMP `18.18.1` (`24439066040e006eb08da7b204f0ac41c79d2de9`)을 기준으로 미출시 main `9f603337c893bb29530bed6ad1c267cd88519275`의 표식 변경에 대비합니다. Senpi `e7b059887ea797fc71ef457f5df52156e5705235`는 고정된 33개 프리셋의 132개 생성 결과와 같아 번들을 유지합니다.

출처: [OMO 차트 정책](https://github.com/code-yeongyu/oh-my-openagent/commit/0472192d549b861abfc5c1d6f1c3f12caf6c12c8), [OMO 스킬 감사](https://github.com/code-yeongyu/oh-my-openagent/commit/e313b72ba1901544453e529ecbf9a22eec2ea4d7), [OMP 표식 변경](https://github.com/can1357/oh-my-pi/commit/1c241750ae247d1c43678d68a2eec0c1bd853e2b), [OMP 18.18.1](https://github.com/can1357/oh-my-pi/releases/tag/v18.18.1).

### 2026-11-06 스킬 참조 경로와 OMP 18.17 대기 계약 갱신

- **프로그래밍 참조:** Python·Rust 참조 문서의 스킬 상대 경로 7곳에 누락된 언어별 하위 디렉터리를 복원했습니다. Python 규칙 검사 스크립트 경로도 포함합니다.
- **Native 대기:** 새 완료 결과 없이 반환되거나, 여러 결과·메시지를 함께 받거나, 사용자 개입으로 중단될 수 있도록 대기 설명을 갱신했습니다. 자신이 시작한 작업이나 진행을 막는 요청의 답변만 기다리고, 받은 결과를 처리한 뒤 다시 대기합니다. 실제 작업 ID 대조와 종료된 작업만 의존성 완료로 인정하는 규칙은 유지합니다.
- **OMP:** 설치본·최신 안정판 `18.17.0` (`75e7801e247d4e3263439d4cc08ccad60dc64bdd`)을 확인했습니다. 이전에 보류했던 사용자 지정 effort와 호출별 model 충돌 규칙은 이제 안정판에 포함되며 기존 어댑터가 그대로 보존하므로 중복 지침이나 어댑터 수정은 필요 없습니다.
- **업스트림 비교:** OMO `dev` `f2a520fff532b30223c9ca785bf845c11898f58a`의 코어 프롬프트·에이전트 트리는 동일합니다. Senpi `f90d22da976a65083a699fa9fa70988d7c438095`의 모델·공통 프롬프트 트리도 동일하며, 132개 생성 결과(33개 프리셋, terminal/app, eval 유무)가 고정 리비전과 일치해 프리셋 번들을 유지했습니다.

출처: [OMO 참조 경로 수정](https://github.com/code-yeongyu/oh-my-openagent/commit/ab2c2d538e650cd1182aa20854dee837de1362c1), [OMP 대기 결과 전달](https://github.com/can1357/oh-my-pi/commit/adcb8800b6409c649a622b45170192b439459c89), [OMP 유휴 대기](https://github.com/can1357/oh-my-pi/commit/4565560e2876723f924ad988a402e1421d5b1d67), [OMP 18.17.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.17.0).

### 2026-11-04 모델 프리셋과 OMP 보정 갱신

- **프리셋:** Senpi `9815495b8ee5e936e48d1ba5e293eea7642a0529`로 갱신했습니다. 등록 수는 33개이며 새 모델 추가는 없습니다. GPT-6 Astra는 근본 원인 진단, 간결한 코어, 완료 조건에 통합한 검증, 새 문체 지침을 사용합니다.
- **모델별 공통 지침:** 업스트림의 `sharedSections: "full" | "diet"` 선택을 모델 코어와 기본 조립 경로에 전달합니다. Opus·Fable 9개 프리셋은 축약 전 원문을 유지하고, 나머지 24개는 새 공통 지침 또는 Astra 코어 개정을 적용합니다. 도구·프로젝트·스킬·워크스테이션 영역은 계속 OMP가 소유합니다.
- **OMP 보정:** 전체형·축약형 양쪽의 보고 형식과 요청 의도 분류를 보정합니다. 활성 `ask`는 업스트림 질문 규칙의 조건을 충족한 뒤 OMP의 blocking 계약으로 변환됩니다. Astra는 `eval` 유무 모두에서 Senpi `monitor` 대신 async bash와 native `wait`를 사용합니다. 승인 없는 외부·유료 작업과 사용자 변경 복원을 허용하지 않으며, DeepSeek V4.1의 축약된 지침 우선순위·백그라운드 대기도 OMP 계약에 맞췄습니다.
- **OMO:** `dev` `8c087588677b63ccb80affb46f2c485625f929b1`의 모델 프롬프트·에이전트 트리는 이전 `8bda141b` 기준과 동일합니다. 기존 거부 확정 규칙을 유지하며 추가 이식은 없습니다.
- **OMP:** 설치본과 최신 정식 릴리스 `18.16.0` (`650f3a108229ee11bf68ba3377f4e8c3391cd424`)을 기준으로 시스템 프롬프트 경계, task 지침, 부모·자식 세션 및 provider 훅 계약을 확인했습니다. 호스트 보정 코드는 그대로 호환됩니다. 미출시 main `ff0a986b`의 user-chosen effort와 per-call model 충돌 규칙은 정식 버전의 계약으로 이식하지 않습니다.

출처: [Senpi 고정 리비전](https://github.com/code-yeongyu/senpi/tree/9815495b8ee5e936e48d1ba5e293eea7642a0529), [Astra 코어 개정](https://github.com/code-yeongyu/senpi/commit/d92272573fc01f38d8798d20391d77dc3853778a), [Opus·Fable 원문 복원](https://github.com/code-yeongyu/senpi/commit/71845495e8bb0362cac2f44a6a11a961be9af659), [OMO 비교 기준](https://github.com/code-yeongyu/oh-my-openagent/commit/8c087588677b63ccb80affb46f2c485625f929b1), [OMP 18.16.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.16.0).

### 2026-11-03 ULW 책임 축소

- 명령 이름·별칭·템플릿·비활성화 플래그와 goal 연결·상태 복원·계속 실행 훅은 보존했습니다.
- 모델별 장문 ULW 정책을 단일 정책으로 통합하고, 공통 실행·위임·검증 규칙은 OMP에 맡겼습니다.
- 계획·실행·루프·DAG·리서치 문서와 관련 참조는 각 기능의 산출물·상태 계약 중심으로 축소했습니다.
- 실제 호스트 검증은 명령별 포인터, 세션 지속·goal 보존, 상태 기반 계속 실행과 명시적 native 키워드의 독립 동작을 확인합니다.
- 전문 명령·별칭은 적합한 native 키워드에 자동 연결합니다. 명시적 선택, OMP 비활성화 설정과 도구 조건을 보존하고, native 알림을 중복 구현하지 않습니다.

### 2026-11-01 OMO 워크플로 스킬 후속 반영

- **`ulw-plan`:** 리뷰 라운드 5회 상한을 없애고 진행 기반 종료로 바꿨습니다. 직전 라운드가 새 blocker를 찾거나 기존 blocker를 닫았을 때만 다음 라운드를 열고, 둘 다 없으면 미해결 blocker를 보고하고 사용자에게 묻습니다. 수렴 계약 JSON(`max_rounds: null`, `continue_while`, `stop_on`)도 같이 바꿨습니다.
- **`visualize`:** 미리보기 전에 `frontend`의 `check-draft-guard.ts` lint를 통과해야 합니다.
- **`mass-ulw`:** 앞 wave 전체에 의존하는 다음 wave는 리뷰 노드 하나로 연결합니다(n×m 대신 n+m 의존성).
- 출처: [OMO `9ddcfaac`](https://github.com/code-yeongyu/oh-my-openagent/commit/9ddcfaac8), [`bbd125e3`](https://github.com/code-yeongyu/oh-my-openagent/commit/bbd125e3c), [`634b4ed9`](https://github.com/code-yeongyu/oh-my-openagent/commit/634b4ed9c), OMO `8bda141b`의 `mass-ulw/references/planning.md`.

### 2026-11-01 OMO 테스트 정리·프론트엔드 검사 이식

- **`programming` 스킬 신규:** OMO `8bda141b`의 언어별 규칙, 테스트 작성 게이트(`references/testing/`), Bun 스크립트를 가져왔습니다. 스크립트 경로는 `$SKILL_DIR` 기준이며, 업스트림 단위 테스트는 포함하지 않습니다.
- **`remove-ai-slops`:** 9번 범주를 "누락 또는 junk 테스트"로 바꿨습니다. 테스트 선언은 R/F/C/D로 표시하고, 기준 상태에서 이미 실패하던 테스트는 버그로 기록합니다. `check-test-junk.ts`로 정적 검사를 하고, 삭제 전에는 루트가 `mutation-proof.ts`로 한 건씩 증명합니다.
- **`frontend`:** grounding(이상 상태·gap ledger), craft-floor 수치 기준, 상태별 크기 고정, 결과물별 WCAG 2.2 AA 결과표를 추가했습니다. 렌더 후 lint로 detect SDK(`scripts/detect/`)와 소스 lint `check-draft-guard.ts`를 함께 제공합니다. detect는 `Bun.WebView`를 쓰며, Bun 1.4.2에서 `--reflow` 스크립트가 평가되지 않던 문제(끝의 `;`)를 고쳤습니다. 라이선스 고지는 `ATTRIBUTION.md` 6·7절에 있습니다.
- **`visual-qa`:** 리뷰어 전에 detect 사전 검사를 돌리고, 체크리스트 A13·B8·E7·F8·F9를 추가했습니다(A3 측정 기준 갱신). `verdict-schema.json` id 목록도 함께 늘렸습니다.

### 2026-11-01 OMP 18.14.2 계약 반영

- **프리셋 갱신:** Senpi `b6f8bd72ffe6c9f8e754e466fa54970c6002fbc8`로 고정했습니다. 33개 프리셋의 terminal/app 렌더 중 바뀐 것은 DeepSeek V4.1 Flash 전체 코어 재작성뿐이며, 모델 선택 규칙은 동일합니다.
- **per-call `model`:** OMP 18.13+의 `task`는 운영자가 승인한 정확한 모델 ID를 spawn·`tasks[]` 항목 단위로 받습니다. 스킬은 live 스키마가 승인 목록을 광고할 때만 그 정확한 ID를 쓰고, category와 OMO 추론 등급 이름은 계속 보내지 않습니다. `sourceSession`은 seance 전용입니다.
- **Visual QA:** 두 리뷰어 프롬프트에 화면 brief와 필수 콘텐츠 목록을 이름 단위로 전달하고, TUI 증거의 `expectedColumns`를 주요 필드로 명시합니다.
- **OMP:** 설치본과 최신 정식 릴리스 `18.14.2`를 기준으로 합니다. `host.ts`·`payload.ts`의 치환 대상 문구는 이 릴리스에서도 일치합니다. opt-in `taskFile`은 기본 비활성이라 문서화하지 않습니다.
- 출처: [Senpi DeepSeek V4.1 Flash 변경](https://github.com/code-yeongyu/senpi/blob/b6f8bd72ffe6c9f8e754e466fa54970c6002fbc8/packages/coding-agent/src/core/extensions/builtin/prompt-preset/changes.md), [OMP task 도구 설명](https://github.com/can1357/oh-my-pi/blob/v18.14.2/packages/coding-agent/src/prompts/tools/task.md), [OMO visual-qa](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/packages/shared-skills/skills/visual-qa/SKILL.md).

### 2026-10-29 거부는 최종

- 모든 모델 프리셋 끝에 OMO의 거부 규칙을 붙입니다. 권한·승인 거부나 사용자 거절은 그 호출이 하려던 일에 대해 최종이며, 다른 도구·명령·경로·호스트로 같은 결과를 내지 않습니다. 독립적인 작업은 계속하고, 메인 세션은 거부된 단계를 사용자에게 묻고 서브에이전트는 부모에게 막힌 항목으로 보고합니다.
- 출처: [OMO `192c1138` 거부 규칙](https://github.com/code-yeongyu/oh-my-openagent/commit/192c1138).

### 2026-10-26 선별 이식

- **프리셋 갱신:** Senpi `a854e7acffa90aba674b9454279035a2fb7140f4`로 고정했습니다. 갱신기는 새 `@earendil-works/pi-ai/utils/fable55-launch` 의존성만 명시적으로 허용하고, 다른 소스와 같은 SHA에서 내려받아 번들에 포함합니다. 임의 패키지 import와 허용 범위 밖 소스는 계속 거부합니다.
- **모델 선택:** Kimi Code의 `k3.1-pro`와 K3.1 별칭은 전용 `kimi-k3-1`로, Fable/Mythos 5.5는 구형 Fable 5 대신 5.1 프롬프트를 재사용하는 `claude-fable-5-5`로 선택됩니다. 이 SHA에서 Fable 5.5는 아직 출시 준비 상태이며, 모델 기본값·제공자·권한을 변경하지 않습니다.
- **Frontend:** 일반 UI는 주 행동과 정보 위계를 우선하며, 고급 연출을 무조건 요구하지 않습니다. 불필요한 장식·반복 정보·꾸며낸 사회적 증거는 줄이되 필수 입력·데이터·문구와 사용자 레퍼런스는 보존합니다.
- **Visual QA:** 기존 UI 수정은 가능한 경우 수정 전 baseline을 확보해 같은 상태의 결과와 비교합니다. 실제 결함과 취향 차이를 구분하며, 취향만으로 수정 루프를 반복하지 않습니다. 명시적 레퍼런스 불일치와 필수 콘텐츠 손실은 결함입니다.
- **리서치 교정:** 교정 후 영향을 받은 사실·숫자·한정어·출처 연결을 원본과 재대조하고 무효화된 검증만 다시 수행합니다. 별도 fact-ledger 실행 도구나 새 검증 명령은 도입하지 않습니다.
- **OMP:** 설치본과 최신 정식 릴리스 `18.12.6`의 계약을 유지합니다. 미출시 main의 `/resume` background-job 취소 동작은 아직 현재 런타임의 보장으로 문서화하지 않습니다.

출처: [Senpi 프리셋 변경 기록](https://github.com/code-yeongyu/senpi/blob/a854e7acffa90aba674b9454279035a2fb7140f4/packages/coding-agent/src/core/extensions/builtin/prompt-preset/changes.md), [OMO frontend·visual-qa 변경](https://github.com/code-yeongyu/oh-my-openagent/commit/9d731da51c1ee9bee8a337851263ce7d2d26a1d4), [OMO 리서치 교정 계약](https://github.com/code-yeongyu/oh-my-openagent/commit/637d524ba33c1631e5e7d2e245e64077dd733aa7).

### 2026-10-23 위임 역할 대조와 이식

OMO의 specialist와 실행 카테고리는 서로 다른 축입니다. 아래는 OMO `541c6029`와 설치된 OMP `18.12.6`의 실제 역할 계약을 대조한 결과이며, 이름이나 모델의 등가표가 아닙니다.

| OMO 역할·카테고리 | OMP 대응 | 이식한 선택 기준과 한계 |
| --- | --- | --- |
| `explore` | `scout` | 낯선 코드의 위치·흐름·근거 탐색. 이미 아는 파일의 단일 조회는 직접 수행합니다. |
| `librarian` | `scout`의 부분 대응 | 도구가 지원하는 외부 근거 수집. 라이브러리·버전·공식 출처·링크 요구를 assignment에 명시하며, 전문 역할 전체가 같다고 가정하지 않습니다. |
| `quick` | `sonic`의 부분 대응 | 명시된 단계·금지 범위·성공 기준을 따르는 기계적 수정과 정해진 데이터 수집. 파일 수가 많아도 변환이 확정돼 있으면 후보이며, 짧은 코드라도 원인·계약 판단이 필요하면 제외합니다. |
| `deep-low` | 기본 worker (`agent` 생략) | 코드·테스트·히스토리로 결정을 해결할 수 있는 한 목표의 조사·구현. OMP sonic의 low-reasoning 계약 때문에 `deep-low` 전체를 sonic으로 치환하지 않습니다. |
| `deep-high` | 직접 대응 없음 | 미정 trade-off·경계 계약·새 메커니즘·불변식 판단을 부모 또는 적합한 추론 worker에 배정합니다. 역할 이름만으로 모델·추론 수준을 보장하지 않습니다. |
| `ultrabrain`, `oracle`의 설계·디버깅 자문 | 직접 대응 없음 | 부모 또는 명시적 추론 assignment를 받은 worker. 추론 자체가 산출물이면 근거·반례·버린 대안·실행 가능한 추천을 요구하며, 자문에는 수정 금지를 명시합니다. |
| `metis` / `plan-consultant`, `momus` / `plan-reviewer` | 직접 대응 없음 | 요구·계획 분석은 해당 역할이 실제로 광고될 때만 사용하고, 아니면 수정 금지 기본 worker에 맡깁니다. OMP의 diff 전용 `reviewer`로 강제 치환하지 않습니다. |
| `code-reviewer`, 구현 후 검토 | `reviewer` | 새 diff가 도입한 구체적 버그 검토만 대응합니다. 원본 응답 형식을 보존하며 구현·실행 QA·일반 계획 검토와 구분합니다. |
| `oracle`의 보안 우려 중 저장소 취약점 분석 | `security-reviewer`의 부분 대응 | 입력에서 제어·위험 지점으로 이어지는 취약점 근거 확인. 일반 반론 역할, 공격 실행, 네트워크 조사는 맡기지 않습니다. |
| 직접 대응 없음 | `seance` | `sourceSession`으로 지정한 과거 세션과 하위 기록의 읽기 전용 자문입니다. |
| `unspecified-low/high` | 별도 역할 없음 | 전문 역할이 맞지 않을 때의 fallback 판단만 가져옵니다. 작업 범위와 미해결 추론을 구분하고 실제 OMP worker 계약으로 선택합니다. |

`host.ts`의 기존 routing adapter를 통해 기본 호스트 Tool Policy와 지원 provider의 native `task` 설명에 같은 선택 기준을 적용합니다. 결정이 열려 있으면 영향받는 수정 전에 읽은 근거·미결정 사항·대안을 부모에게 반환하고, 부모가 해결하거나 같은 brief와 근거를 적합한 worker로 넘깁니다. sonic을 쓰기 위한 불필요한 분할이나, 일반 worker에 대한 무조건적인 선호를 모두 피합니다. 모델 배정·도구 권한·자식 프리셋 주입 조건은 이 변경의 대상이 아닙니다.

출처: [OMO Senpi 실행 카테고리·선택 조건](https://github.com/code-yeongyu/oh-my-openagent/blob/541c6029eac63033fd7b76e7244be5d3f37e4024/packages/senpi-task/src/category/openai-categories.ts), [OMO 탐색·외부 조사·자문 구분](https://github.com/code-yeongyu/oh-my-openagent/blob/541c6029eac63033fd7b76e7244be5d3f37e4024/packages/omo-opencode/src/agents/dynamic-agent-core-sections.ts), [OMP 기본 worker·sonic 정의](https://github.com/can1357/oh-my-pi/blob/v18.12.6/packages/coding-agent/src/task/agents.ts), [OMP 역할 프롬프트](https://github.com/can1357/oh-my-pi/tree/v18.12.6/packages/coding-agent/src/prompts/agents).

### 2026-10-22 선별 이식

- **탐색과 추론 분리:** scout는 위치 탐색·근거 수집에 사용하고, 원인 분석·경쟁 가설·계약 트레이드오프·불변식 판단은 부모 또는 적합한 일반 작업자에게 맡깁니다. 읽기 전용은 작업 권한이지 추론 난도가 아닙니다. 탐색으로 해결하지 못한 판단은 근거와 미해결 선택지를 반환해 부모가 처리하거나 다시 배정합니다. 일반 작업자의 수정 금지는 명시하되 읽기 전용 샌드박스로 오인하지 않습니다.
- `host.ts`는 기본 호스트 템플릿의 Tool Policy에서 알려진 탐색 강제 문구만 보정합니다. `payload.ts`는 지원 provider 요청의 native `task` 설명에 같은 보정을 적용합니다. 도구 이름·인자 스키마·실행·모델 배정은 변경하지 않으며, 프로젝트 지침·사용자 메시지·커스텀 시스템 프롬프트·자식 역할은 보존합니다. OMO의 `deep-high`·`ultrabrain` 카테고리를 OMP 도구 인자로 추가하지 않습니다.
- 이 보정은 현재 알려진 OMP 문구에 한정됩니다. OpenAI Responses/Codex/Completions, Anthropic, Google 및 Bedrock 도구 설명 경로를 지원하며, provider hook을 거치지 않는 전송과 미지원 요청 형식은 변경하지 않습니다. 역할 이름만으로 큰 모델이 선택된다고 보장하지 않으며, 필요한 모델을 배정할 수 없으면 부모가 추론하거나 해당 제한을 보고합니다.
- **`wait` 계약:** 시작한 작업뿐 아니라 이번 실행에서 보낸 메시지의 답장을 기다릴 수 있고, 실행 중인 작업과 대기 중인 답장이 모두 없으면 즉시 반환한다는 OMP 18.12.4+ 의미를 공통 계약에 반영했습니다.
- **시각 재현:** 요청된 스크린샷·영상·3D·도표 재현은 실제 원본과 렌더를 같은 상태·시점·뷰포트에서 비교합니다. 대표 상태는 원본에서 선택하며 고정 프레임 수·새 비교 manifest·별도 반복 횟수를 강제하지 않습니다. 약속한 보고서는 데모와 함께 전달하고, HTML을 선택했을 때만 실제 브라우저 표시와 artifact 링크를 사용합니다.
- **frontend 범위:** HTML/CSS/SVG 보고서·그림·슬라이드·인쇄 산출물을 포함합니다. 일반 텍스트 답변에는 적용하지 않습니다.
- **전용 리뷰어 (10월 23일 역할 계약으로 정정):** code diff 검토는 `tasks[].agent: "reviewer"`, 저장소 취약점 분석은 `security-reviewer`로 보냅니다. 요구·계획·일반 산출물 평가는 실제 지원하는 전문 역할 또는 명시적 수정 금지 기본 worker에 맡깁니다. specialist가 맞는 작업을 자체 JSON 형식 때문에 일반 task로 우회하지 않습니다. 부모가 원본 리뷰를 보존하고 필요한 결과 형식으로 변환하며, 누락된 근거·검토 범위·승인·신뢰도를 만들어 채우지 않습니다.
- 출처: [OMO `d98fe7ac`의 추론 라우팅](https://github.com/code-yeongyu/oh-my-openagent/blob/d98fe7ac1aeb2355fd6ef416310e24ff3ae0dd21/packages/senpi-task/src/category/openai-categories.ts), [시각 비교 변경](https://github.com/code-yeongyu/oh-my-openagent/blob/d98fe7ac1aeb2355fd6ef416310e24ff3ae0dd21/changes/unreleased/10812.md), [OMP wait 계약](https://github.com/can1357/oh-my-pi/blob/v18.12.6/packages/coding-agent/src/prompts/tools/wait.md). Senpi `71e88e1`은 기존 pin과 31개 프리셋의 terminal/app 렌더 62개가 동일해 원본 번들을 갱신하지 않았습니다.

### 2026-10-19 호환성 점검

- upstream 프리셋 후보 `83d3ea5`는 리비전 헤더를 제외하면 기존 프리셋 번들과 동일해 원본 pin을 유지했습니다. `--check`의 `changed:true`는 헤더 변경도 포함하므로 새 프롬프트가 있다는 뜻은 아닙니다.
- upstream `8593083`의 accent-stripe 디자인 지침은 사용자 레퍼런스와 기존 디자인을 우선하는 조건으로 선별 반영합니다. 별도 스타일 검사기·고정 감사 절차는 가져오지 않습니다.
- OMP 보정은 blocking `ask`와 명시적 승인 경계를 유지하고, 요청한 정리·리팩터링에 불필요한 재승인을 요구하지 않습니다. 고정 진행 보고 양식 대신 결과·검증·막힌 항목을 전달하며, 복구 시 사용자·다른 작업자의 변경을 보존합니다.
- Astra 비동기 지침은 원문 단위 변환을 먼저 수행해 일반 문구 치환이 watcher의 `async: true`, `timeout: 0` 보정을 무효화하지 않도록 했습니다.
- OMP 18.12.x의 native goal과 전문 워크플로의 durable state를 구분합니다. 일반 UI 변경에는 새 `DESIGN.md`나 Lighthouse 감사를 강제하지 않고, review는 고정 시나리오 수 대신 변경 경로와 실제 위험을 검증합니다. 전역 `AGENTS.md`는 변경하지 않습니다.
