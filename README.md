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
- [`index.ts`](index.ts): 세션 시작과 모델 변경 시 해당 프롬프트를 적용합니다.
- [`upstream/update.mjs`](upstream/update.mjs): upstream 프롬프트 소스를 고정 SHA로 받아 로컬 프리셋을 생성합니다. 바이너리 추출이나 별도 에이전트 패키지 설치는 필요 없습니다.
- [`upstream/omp-build.mjs`](upstream/omp-build.mjs): OMP가 이미 제공하는 도구·프로젝트·스킬·워크스테이션 영역을 중복 주입하지 않는 조립 계층입니다.

`prompts/`의 Markdown 파일은 모델별 프롬프트가 아니라 ULW 워크플로 호출 템플릿입니다. 템플릿의 스킬 경로는 템플릿 파일 기준 상대경로이며, 확장은 실제 설치 위치에서 스킬 경로를 계산하므로 저장소를 다른 위치에 두어도 동작합니다.

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
```

모델 프롬프트와 워크플로를 OMP에 맞게 이식했습니다. 원본 출처와 개별 리소스의 라이선스는 `upstream/` 및 각 스킬의 출처·라이선스 파일을 참고하세요.
