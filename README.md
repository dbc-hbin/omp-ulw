# omp-ulw

OMP용 모델 프롬프트와 Native ULW 워크플로 확장입니다. 모델별 프롬프트, 세션 단위 ULW 활성화, 계획·실행·리서치 및 작업 검증 스킬을 제공합니다.

## 사용

OMP가 설치된 환경에서 실행합니다.

```bash
git clone https://github.com/dbc-hbin/omp-ulw.git
omp -e ./omp-ulw/index.ts
```

- `/ulw <작업>`: OMP native goal mode로 ULW를 활성화합니다. 목표가 완료될 때까지 native goal continuation이 유지됩니다.
- `/ulw-plan`, `/ulw-execute`, `/ulw-loop`, `/ulw-research`, `/mass-ulw`: 계획, 실행, 목표 루프, 리서치, 의존 작업 실행.
- `/debugging`, `/review-work`, `/visual-qa`, `/frontend` 등: 필요한 전문 스킬 호출.

일반 `/ulw`는 전문 워크플로를 자동으로 켜지 않습니다. 직접 입력한 `ulw`/`ultrawork`도 `/goal`로 변환되어 native goal objective로 시작합니다. `ulw-loop`와 `ulw-execute`는 다중 목표·증거 ledger를 사용하므로 native goal을 중복 생성하지 않습니다. 참조 문서는 필요한 시점에만 읽으며, 기존 프로젝트 지침과 권한 규칙을 보존합니다.

## 모델별 프롬프트 위치

- [`upstream/presets.js`](upstream/presets.js): GitHub 원본에서 생성한 모델별 프롬프트·선택 규칙입니다. Haiku 5.5와 Gemini 4 Argon을 포함한 31개 프리셋과 원본 리비전·라이선스를 담습니다.
- [`presets.ts`](presets.ts): 선택된 프롬프트의 도구 호출·비동기 실행 규칙을 OMP에 맞게 보정합니다.
- [`index.ts`](index.ts): 세션 시작과 모델 변경 시 해당 프롬프트를 적용합니다.
- [`upstream/update.mjs`](upstream/update.mjs): GitHub 소스를 고정 SHA로 받아 로컬 프리셋을 생성합니다. 바이너리 추출이나 Senpi 패키지 설치는 필요 없습니다.
- [`upstream/omp-build.mjs`](upstream/omp-build.mjs): OMP가 이미 제공하는 도구·프로젝트·스킬·워크스테이션 영역을 중복 주입하지 않는 조립 계층입니다.

`prompts/`의 Markdown 파일은 모델별 프롬프트가 아니라 ULW 워크플로 호출 템플릿입니다. 템플릿의 스킬 경로는 템플릿 파일 기준 상대경로이며, 확장은 실제 설치 위치에서 스킬 경로를 계산하므로 저장소를 다른 위치에 두어도 동작합니다.

실제 주입되는 프롬프트와 워크플로 포인터는 `omp-` 태그를 사용합니다. 기존 세션 복원과 CLI 호환성을 위해 저장된 `omo-ultrawork:*` 키와 `--omo-ultrawork-disabled`, `--omo-ulw-workflows-disabled`, `--omo-ulw-continuation-disabled` 플래그는 유지하며, 이전 `omo-` 프롬프트 태그도 읽을 수 있습니다. `upstream/`의 원본 지침은 `presets.ts`를 거쳐 OMP 도구 계약으로 변환된 뒤 전달됩니다.

## GitHub에서 프리셋 갱신

기존 Bun만 사용합니다. 네트워크는 갱신 명령에서만 필요하며, OMP 실행 시에는 생성된 로컬 파일만 읽습니다.

```bash
# 태그, 커밋 SHA, 브랜치 또는 해당 GitHub 링크 지정
bun upstream/update.mjs --ref https://github.com/code-yeongyu/senpi/tree/v2026.10.13

# 최신 main과 비교만 수행: 차이 없음 0, 변경 후보 있음 1, 오류 1
bun upstream/update.mjs --ref main --check

# 최신 원본으로 실제 갱신한 뒤 OMP 보정과 모델 선택 검증
bun upstream/update.mjs --ref main
bun test
```

명령은 먼저 ref를 커밋 SHA로 고정하고 그 SHA의 소스만 내려받습니다. 빌드·모든 프리셋 렌더링 검사가 성공한 뒤 `upstream/presets.js` 한 파일을 원자적으로 교체합니다. 다운로드·검증 실패 시 기존 파일은 유지합니다. `--ref`를 생략하면 `main`이며, GitHub API 제한이 있으면 `GITHUB_TOKEN`을 사용할 수 있습니다. 재현하려면 생성 파일 첫 줄의 SHA를 `--ref`로 전달합니다.

자동 갱신 대상은 모델 프리셋입니다. `presets.ts`와 스킬은 덮어쓰지 않습니다. 스킬의 상태 의미나 도구 계약 변경은 OMP 코드와 함께 선별 이식해야 합니다. 기존 스킬 반영 기준은 [OMO v5.1.33](https://github.com/code-yeongyu/oh-my-openagent/tree/5275771d8b38b70ac6e6c737f587abbb4dd36b86)이며, 이번 리서치 시각 검증 보강은 [OMO v5.1.35](https://github.com/code-yeongyu/oh-my-openagent/tree/v5.1.35)에서 선별 이식했습니다.

## 테스트

```bash
cd omp-ulw
bun test
```

OMO 프롬프트와 워크플로를 OMP에 맞게 이식했습니다. 원본 출처와 개별 리소스의 라이선스는 `upstream/` 및 각 스킬의 출처·라이선스 파일을 참고하세요.
