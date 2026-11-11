# omp-ulw

[English](README.md) | 한국어 | [简体中文](README.zh-CN.md)

OMP용 모델 프롬프트와 Native ULW 워크플로 확장입니다. extension 표시 이름은 `omp-ulw`입니다. 모델별 프롬프트, 세션 단위 ULW 활성화, 계획·실행·리서치 및 작업 검증 스킬을 제공합니다.

## 사용

Git·Bun·OMP가 설치된 환경에서 실행합니다.

```bash
git clone --recurse-submodules https://github.com/dbc-hbin/omp-ulw.git
bun ./omp-ulw/upstream/materialize-frontend-refs.mjs
omp -e ./omp-ulw/index.ts
```

- `/ulw <작업>`: 대화형 TUI에서 ULW와 native goal을 함께 활성화합니다. 직접 `ulw <작업>` 또는 `/goal ulw <작업>`을 입력해도 됩니다.
- `/ulw-plan`, `/ulw-execute`, `/ulw-loop`, `/ulw-research`, `/mass-ulw`: 계획, 실행, 목표 루프, 리서치, 의존 작업 실행.
- `/debugging`, `/review-work`, `/visual-qa`, `/frontend`, `/ast-grep`, `/lsp-setup`, `/refactor` 등: 필요한 전문 스킬 호출.

일반 `/ulw`는 전문 워크플로를 자동으로 켜지 않습니다. 대화형 TUI의 입력 단계에서 `/ulw`와 `ulw`/`ultrawork`를 `/goal`로 변환하므로, 작업 실행 중 입력해도 native goal objective가 생성됩니다. 이미 활성 goal이 있으면 새 goal로 교체하지 않습니다. OMP 18.12.5에서 `/goal`은 TUI 전용 명령이므로 RPC·프로그램 호출은 ULW 지침만 활성화하며, RPC 클라이언트는 native `goal` 요청을 별도로 사용해야 합니다. `ulw-loop`와 `ulw-execute`는 다중 목표·증거 ledger를 사용하므로 native goal을 중복 생성하지 않습니다. 참조 문서는 필요한 시점에만 읽으며, 기존 프로젝트 지침과 권한 규칙을 보존합니다.

## OMP와 ULW의 책임

명령·별칭은 앞쪽 공백을 제외한 입력 맨 앞에서만 활성화됩니다. `Explain ulw`, `Explain /ulw`, `What does /ulw-plan do?`처럼 문장 안에서 언급하면 활성화하지 않습니다. 기존 호출을 옮길 때는 명령을 맨 앞으로 이동합니다. 이미 존재하는 paused·budget-limited goal도 소유권을 유지합니다.

일반적인 작업 방식은 선택된 모델 프리셋이 소유합니다. 재읽기, 작업 분해·위임, 검증 단계 등에서 OMP의 일반 지침과 겹치거나 충돌하면 모델 지침을 남기고 OMP 쪽 중복을 제거합니다. OMP의 실제 도구 스키마·권한·승인·native mode 기능과 자식의 전문 역할·반환 계약은 유지합니다. ULW는 별도 실행 정책을 추가하지 않고 워크플로 산출물과 소유권을 정의합니다. 전문 명령의 native 키워드 연결과 도구 조건·활성화 설정·thinking effort는 OMP가 처리합니다.

| 진입점 | 기본 native 연결 | ULW가 추가하는 기능 |
|---|---|---|
| `/ulw`, `ulw`, `ultrawork` | 기존 goal 연결만 유지 | 세션 활성화. 별도 notepad·ledger·검증 절차 없음 |
| `/ulw-plan` | `ultrathink` | 구현하지 않는 계획 작성, 결정·계획 검토 기록, 실행 가능한 계획 산출물 |
| `/ulw-execute` | `orchestrate` | 계획 선택, Boulder 소유권, 체크박스별 완료·차단·재개 기록 |
| `/ulw-loop` | `orchestrate` | 다중 목표·의존성·증거 체크포인트 |
| `/mass-ulw` | `workflowz` | 지속 가능한 의존성 그래프, 노드별 인계·무효화·복구 기록 |
| `/ulw-research` | `workflowz` | 조사 범위, 주장·출처·관찰 기록, 반론 검증과 인용된 산출물 |

TUI/RPC `prompt` 입력의 맨 앞에 놓인 전문 명령·별칭과 등록된 슬래시 명령 처리기에 적용됩니다. 예를 들어 `/ulw-execute 작업`은 `orchestrate`를 덧붙여 OMP에 전달합니다. `/ulw-execute workflowz 작업`처럼 사용자가 native 키워드를 지정하면 자동 선택을 생략합니다. 인수의 인용·부정 문장에 native 키워드가 있어도 보수적으로 자동 선택을 생략하고 실제 활성화 여부는 OMP matcher에 맡깁니다. 일반 언급·자식 입력·후속 `continue`에는 기본 키워드를 추가하지 않습니다. 초기 CLI의 일반 텍스트나 `/skill:` 직접 호출처럼 입력 훅·명령 처리기를 거치지 않는 경로에서는 native 키워드를 명시해야 합니다.

OMP 18.16의 별도 RPC `steer`·`follow_up` 요청은 native 키워드 처리를 건너뛰므로 자동 연결 대상이 아닙니다. RPC 클라이언트는 `{"type":"prompt","message":"ulw-loop 작업","streamingBehavior":"steer"}` 또는 `"followUp"`을 사용해야 native 키워드 처리와 큐 전달을 함께 거칩니다. 확장은 입력 이벤트에서 RPC 요청 종류를 알 수 없으므로, 이를 임의의 새 메시지로 재전송해 큐 순서·첨부를 바꾸지 않습니다.

`--omo-ulw-workflows-disabled`는 자동 연결도 끕니다. OMP의 `magicKeywords.enabled`와 개별 키워드 설정, 필요한 `task`/`eval` 도구 조건을 그대로 존중하며, 사용할 수 없는 모드를 복사한 지침으로 대체하지 않습니다. `jevify`는 대량 분류 전용이므로 자동 선택하지 않습니다.

단순 병렬 실행에는 OMP의 실행 기능을 사용하고, 저장된 그래프가 필요한 경우에만 `mass-ulw`를 추가합니다. 전문 워크플로의 산출물·상태 계약은 유지하지만, 기본 ULW와 각 참조 문서가 별도 실행 정책을 겹쳐 주입하지 않습니다. 모델 프리셋은 기존대로 유지하고, ULW 정책은 모든 모델에서 `skills/ultrawork/SKILL.md` 한 곳을 사용합니다.

## OMP skill set

- **Orchestration:** `ultrawork`, `ulw-plan`, `ulw-execute`, `ulw-loop`, `ulw-research`, `mass-ulw`, `hyperplan`
- **Code understanding:** `debugging`, `ast-grep`, `lsp-setup`, `refactor`, `programming`
- **Review and product work:** `review-work`, `eval-integrity`, `remove-ai-slops`, `frontend`, `visual-qa`, `visualize`, `data-scientist`
- **Browser and source access:** `browser`, `ultimate-browsing`
- **Project and memory workflows:** `init-deep`, `reflection`, `memory-advisor`

The three newly ported code skills use the native `xd://ast_grep` and
`xd://lsp` contracts. `programming` carries the per-language rules, the test
authoring gate and junk-test classes, and the Bun scripts that `remove-ai-slops`
calls (`check-test-junk.ts`, `mutation-proof.ts`). Session archaeology and git
history operations remain host-level concerns or project rules rather than
copied skill bundles. Persistent DAG records are lead-owned
files, not a separate orchestration runtime. Tip catalogues and first-run
onboarding were not ported.

`/eval-integrity`는 벤치마크·A/B·LLM 평가의 데이터 누출, 순환 평가와 평가자 독립성을 읽기 전용으로 감사합니다. 리서치와 mass-research의 인계에는 주장별 `OBSERVED` 근거와 종료한 단서의 `PROBED` 기록을 붙입니다. 기억에서 나온 주장은 확인 전까지 LEAD로 남기며, 유효한 기존 근거와 통과한 검사를 불필요하게 다시 수행하지 않습니다.

`/web-browser`는 `browser` 스킬과 `xd://eval/browser`를 읽고 OMP Eval의 native `browser` 객체로 관찰·입력·클릭·프레임·네트워크·캡처를 수행합니다. OMP 자체 `/browser`의 headless·visible 전환은 그대로 유지합니다. `/ultimate-browsing`은 불완전하거나 차단된 출처, 공식 플랫폼 API, 아카이브·미디어 경로를 `read`·`web_search`와 같은 브라우저로 처리합니다. 호스트의 브라우저 우선순위·권한은 유지하며, 일반 관리형 브라우저에는 릴레이가 필요하지 않습니다. 기존 Chrome 세션에 연결할 때만 승인된 릴레이·CDP 경로를 선택합니다. OmOWright 런타임·BrowserSkill daemon·쿠키 추출기·별도 크롤러는 설치하지 않으며, 각 스킬의 attribution에서 원본 전체 대응표와 라이선스를 확인할 수 있습니다.

리서치와 mass-research는 출처 접근 계약을 직접 포함하므로, 공통 ULW 지침이 없는 `/skill:ulw-research`와 `/mass-ulw research`에도 적용됩니다. 웹 수집 작업에는 브라우저·차단 출처 스킬 경로와 필요한 상태·권한·증거를 명시해 실제 도구를 가진 작업자에게 전달합니다. 동적 참조 페이지와 HTML 보고서의 layout probe도 같은 native 브라우저를 사용하며, 정적 자료는 계속 `read`로 읽습니다.

## 모델별 프롬프트 위치

- [`upstream/presets.js`](upstream/presets.js): GitHub 원본에서 생성한 모델별 프롬프트·선택 규칙입니다. Kimi K3.1과 Claude Fable / Mythos 5.2 전용 코어를 포함한 33개 프리셋과 원본 리비전·라이선스를 담습니다. 임시 Fable 5.5 항목은 제거됐으며, 프리셋 등록은 기본 모델 추천을 의미하지 않습니다.
- [`presets.ts`](presets.ts): 선택된 프롬프트의 도구 호출·비동기 실행 규칙을 OMP에 맞게 보정합니다.
- [`index.ts`](index.ts): 메인과 일반 서브에이전트의 턴 시작 시 각 세션의 모델 프롬프트를 적용하고, 지원 provider 요청 훅에서 모델 변경을 반영합니다.
- [`host-guidance.ts`](host-guidance.ts): 지원 모델의 작업 방식과 겹치는 OMP 기본 행동 지침을 제거하고, 도구·권한·프로젝트 경계를 보존합니다. 미지원 모델로 fallback하면 native 행동 지침을 복원합니다.
- [`upstream/update.mjs`](upstream/update.mjs): upstream 프롬프트 소스를 고정 SHA로 받아 로컬 프리셋을 생성합니다. 바이너리 추출이나 별도 에이전트 패키지 설치는 필요 없습니다.
- [`upstream/omp-build.mjs`](upstream/omp-build.mjs): OMP가 이미 제공하는 도구·프로젝트·스킬·워크스테이션 영역을 중복 주입하지 않는 조립 계층입니다.

`prompts/`의 Markdown 파일은 모델별 프롬프트가 아니라 ULW 워크플로 호출 템플릿입니다. 템플릿의 스킬 경로는 템플릿 파일 기준 상대경로이며, 확장은 실제 설치 위치에서 스킬 경로를 계산하므로 저장소를 다른 위치에 두어도 동작합니다.

서브에이전트는 부모의 프리셋을 복사하지 않고 **자신의 선택된 모델과 실제 활성 도구 목록**으로 프리셋을 생성합니다. 요청 직전에도 활성 도구 변경을 반영합니다. 지원 모델에서는 기본 역할을 교체하고 겹치는 일반 행동 지침을 제거하지만, 뒤에 붙는 자식 전문 역할·공유 context·할당 작업·반환 프로토콜은 보존합니다. 자식용 보정은 이 역할·권한·검증 제한이 일반 모델 지침보다 우선하도록 하며, 사용자 대상 시작 문구·진행 보고·todo를 부모처럼 수행하지 않게 합니다. 일반 worker와 sonic에 이미 노출된 `eval`은 모델 지침에 반영되지만, scout 등에 없는 도구를 새로 부여하지 않습니다.

2026-10-27 임시 보정: 업스트림에서 아직 매칭하지 않는 `gpt-6.1-terra`는 **서브에이전트에서만** `gpt-6.1-sol`과 동일한 `gpt-6-astra` 프리셋을 사용합니다. provider 접두사·Fast 접미사·`gpt-6-1-terra`·`gpt-61-terra`·표시 이름 `GPT 6.1 Terra`도 인식합니다. 실제 요청 모델은 Terra로 유지하고, 메인 세션의 선택 규칙은 변경하지 않습니다. 업스트림이 해당 모델의 프리셋을 제공하면 그 선택이 우선합니다.

명시적 커스텀/인식 불가 시스템 템플릿은 그대로 유지하고, 미지원 모델은 기본 OMP 역할을 사용합니다. 자식에서 ULW를 자동 활성화하지 않습니다. `seance`처럼 OMP가 확장 자체를 격리하는 세션은 이 주입 경로의 대상이 아닙니다. provider 요청 훅을 우회하는 전송은 메인과 마찬가지로 턴 시작 시점의 프리셋만 보장합니다. 설치된 확장 변경은 새 OMP 세션을 시작해야 반영됩니다.

실제 주입되는 프롬프트와 워크플로 포인터는 `omp-` 태그를 사용합니다. 기존 세션 복원과 CLI 호환성을 위해 저장된 `omo-ultrawork:*` 키와 `--omo-ultrawork-disabled`, `--omo-ulw-workflows-disabled`, `--omo-ulw-continuation-disabled` 플래그는 유지하며, 이전 `omo-` 프롬프트 태그도 읽을 수 있습니다. `upstream/`의 원본 지침은 `presets.ts`를 거쳐 OMP 도구 계약으로 변환된 뒤 전달됩니다.

## Frontend 외부 참조 생성

외부 디자인 참조, UI/UX 조사 데이터와 designpowers 참조 본문은 `upstream/skills/` 아래 네 Git 서브모듈의 고정 커밋에서 생성합니다. 생성 파일은 Git에서 제외하며, 기존 `skills/frontend/references/` 경로를 유지합니다. OMP용 안내문과 통합 규칙은 계속 추적합니다.

저장소를 갱신한 뒤 기록된 원본 리비전을 초기화하고 다시 생성합니다.

```bash
git submodule update --init --recursive
bun upstream/materialize-frontend-refs.mjs
```

서브모듈 초기화에는 네트워크가 필요하며, 생성과 일반 OMP 실행은 로컬에서 처리합니다. Git 없이 배포할 때는 생성이 끝난 `skills/` 트리 전체를 복사합니다. GitHub의 소스 압축 파일만 받으면 서브모듈 내용과 생성 참조는 포함되지 않습니다.

## GitHub에서 프리셋 갱신

기존 Bun만 사용합니다. 네트워크는 갱신 명령에서만 필요하며, OMP 실행 시에는 생성된 로컬 파일만 읽습니다.

```bash
# 태그, 커밋 SHA 또는 브랜치 지정
bun upstream/update.mjs --ref v2026.10.13

# 최신 main과 비교만 수행: 차이 없음 0, 변경 후보 있음 1, 오류 1
bun upstream/update.mjs --ref main --check

# 최신 원본으로 실제 갱신한 뒤 OMP 보정과 모델 선택 검증
bun upstream/update.mjs --ref main
bun test
```

명령은 먼저 ref를 커밋 SHA로 고정하고 그 SHA의 소스만 내려받습니다. 빌드·모든 프리셋 렌더링 검사가 성공한 뒤 `upstream/presets.js` 한 파일을 원자적으로 교체합니다. 다운로드·검증 실패 시 기존 파일은 유지합니다. `--ref`를 생략하면 `main`이며, GitHub API 제한이 있으면 `GITHUB_TOKEN`을 사용할 수 있습니다. 재현하려면 생성 파일 첫 줄의 SHA를 `--ref`로 전달합니다.

자동 갱신 대상은 모델 프리셋입니다. `presets.ts`와 스킬은 덮어쓰지 않습니다. 스킬의 상태 의미나 도구 계약 변경은 OMP 코드와 함께 선별 이식해야 합니다. 현재 스킬은 OMP 도구·task 계약에 맞춘 native 포트만 유지합니다.

변경 이력은 [CHANGELOG.ko.md](CHANGELOG.ko.md)를 참고하세요.

## 테스트

```bash
cd omp-ulw
bun test

# 설치된 OMP와 로컬 provider로 실제 호스트 경로 검증
bun tests/ulw-host-check.ts
bun tests/ulw-goal-host-check.ts

# 실제 task/sonic/scout의 모델 프리셋·역할 보존·eval/도구 제한 검증
bun tests/child-preset-host-check.ts
```

모델 프롬프트와 워크플로를 OMP에 맞게 이식했습니다. 원본 출처와 개별 리소스의 라이선스는 `upstream/` 및 각 스킬의 출처·라이선스 파일을 참고하세요.
