# omp-ulw

OMP용 모델 프롬프트와 Native ULW 워크플로 확장입니다. extension 표시 이름은 `omp-ulw`입니다. 모델별 프롬프트, 세션 단위 ULW 활성화, 계획·실행·리서치 및 작업 검증 스킬을 제공합니다.

## 사용

OMP가 설치된 환경에서 실행합니다.

```bash
git clone https://github.com/dbc-hbin/omp-ulw.git
omp -e ./omp-ulw/index.ts
```

- `/ulw <작업>`: 대화형 TUI에서 ULW와 native goal을 함께 활성화합니다. 직접 `ulw <작업>` 또는 `/goal ulw <작업>`을 입력해도 됩니다.
- `/ulw-plan`, `/ulw-execute`, `/ulw-loop`, `/ulw-research`, `/mass-ulw`: 계획, 실행, 목표 루프, 리서치, 의존 작업 실행.
- `/debugging`, `/review-work`, `/visual-qa`, `/frontend`, `/ast-grep`, `/lsp-setup`, `/refactor` 등: 필요한 전문 스킬 호출.

일반 `/ulw`는 전문 워크플로를 자동으로 켜지 않습니다. 대화형 TUI의 입력 단계에서 `/ulw`와 `ulw`/`ultrawork`를 `/goal`로 변환하므로, 작업 실행 중 입력해도 native goal objective가 생성됩니다. 이미 활성 goal이 있으면 새 goal로 교체하지 않습니다. OMP 18.12.5에서 `/goal`은 TUI 전용 명령이므로 RPC·프로그램 호출은 ULW 지침만 활성화하며, RPC 클라이언트는 native `goal` 요청을 별도로 사용해야 합니다. `ulw-loop`와 `ulw-execute`는 다중 목표·증거 ledger를 사용하므로 native goal을 중복 생성하지 않습니다. 참조 문서는 필요한 시점에만 읽으며, 기존 프로젝트 지침과 권한 규칙을 보존합니다.

## OMP skill set

- **Orchestration:** `ultrawork`, `ulw-plan`, `ulw-execute`, `ulw-loop`, `ulw-research`, `mass-ulw`, `hyperplan`
- **Code understanding:** `debugging`, `ast-grep`, `lsp-setup`, `refactor`
- **Review and product work:** `review-work`, `remove-ai-slops`, `frontend`, `visual-qa`, `visualize`, `data-scientist`
- **Project and memory workflows:** `init-deep`, `reflection`, `memory-advisor`

The three newly ported code skills use the native `xd://ast_grep` and
`xd://lsp` contracts. Browser automation, session archaeology, git history
operations and generic programming guidance remain host-level concerns or
project rules rather than copied skill bundles. DAG persistence, tip catalogues
and first-run onboarding were not ported because this repository has no
equivalent OMP runtime API for them.

## 모델별 프롬프트 위치

- [`upstream/presets.js`](upstream/presets.js): GitHub 원본에서 생성한 모델별 프롬프트·선택 규칙입니다. Haiku 5.5와 Gemini 4 Argon을 포함한 31개 프리셋과 원본 리비전·라이선스를 담습니다.
- [`presets.ts`](presets.ts): 선택된 프롬프트의 도구 호출·비동기 실행 규칙을 OMP에 맞게 보정합니다.
- [`index.ts`](index.ts): 메인과 일반 서브에이전트의 턴 시작 시 각 세션의 모델 프롬프트를 적용하고, 지원 provider 요청 훅에서 모델 변경을 반영합니다.
- [`upstream/update.mjs`](upstream/update.mjs): upstream 프롬프트 소스를 고정 SHA로 받아 로컬 프리셋을 생성합니다. 바이너리 추출이나 별도 에이전트 패키지 설치는 필요 없습니다.
- [`upstream/omp-build.mjs`](upstream/omp-build.mjs): OMP가 이미 제공하는 도구·프로젝트·스킬·워크스테이션 영역을 중복 주입하지 않는 조립 계층입니다.

`prompts/`의 Markdown 파일은 모델별 프롬프트가 아니라 ULW 워크플로 호출 템플릿입니다. 템플릿의 스킬 경로는 템플릿 파일 기준 상대경로이며, 확장은 실제 설치 위치에서 스킬 경로를 계산하므로 저장소를 다른 위치에 두어도 동작합니다.

서브에이전트는 부모의 프리셋을 복사하지 않고 **자신의 선택된 모델과 실제 활성 도구 목록**으로 프리셋을 생성합니다. OMP 기본 시스템 블록의 역할 영역만 교체하고, 뒤에 붙는 자식 전문 역할·공유 context·할당 작업·반환 프로토콜은 보존합니다. 자식용 보정은 이 역할·권한·검증 제한이 일반 모델 지침보다 우선하도록 하며, 사용자 대상 시작 문구·진행 보고·todo를 부모처럼 수행하지 않게 합니다. 일반 worker와 sonic에 이미 노출된 `eval`은 모델 지침에 반영되지만, scout 등에 없는 도구를 새로 부여하지 않습니다.

명시적 커스텀/인식 불가 시스템 템플릿은 그대로 유지하고, 미지원 모델은 기본 OMP 역할을 사용합니다. 자식에서 ULW를 자동 활성화하지 않습니다. `seance`처럼 OMP가 확장 자체를 격리하는 세션은 이 주입 경로의 대상이 아닙니다. provider 요청 훅을 우회하는 전송은 메인과 마찬가지로 턴 시작 시점의 프리셋만 보장합니다. 설치된 확장 변경은 새 OMP 세션을 시작해야 반영됩니다.

실제 주입되는 프롬프트와 워크플로 포인터는 `omp-` 태그를 사용합니다. 기존 세션 복원과 CLI 호환성을 위해 저장된 `omo-ultrawork:*` 키와 `--omo-ultrawork-disabled`, `--omo-ulw-workflows-disabled`, `--omo-ulw-continuation-disabled` 플래그는 유지하며, 이전 `omo-` 프롬프트 태그도 읽을 수 있습니다. `upstream/`의 원본 지침은 `presets.ts`를 거쳐 OMP 도구 계약으로 변환된 뒤 전달됩니다.

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
