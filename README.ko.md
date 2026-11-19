# omp-ulw

[English](README.md) | 한국어 | [简体中文](README.zh-CN.md)

[Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi)용 모델 프롬프트·코드모드·native ULW 워크플로 확장입니다. 도구·권한·실행은 OMP가 관리하고, 확장은 모델별 작업 방식과 계획·리서치·전문 스킬을 제공합니다.

## 시작하기

Git·Bun·OMP가 설치된 환경에서 실행합니다.

```bash
git clone --recurse-submodules https://github.com/dbc-hbin/omp-ulw.git
bun ./omp-ulw/upstream/materialize-frontend-refs.mjs
omp -e ./omp-ulw
```

대화형 TUI에서 `/ulw <작업>` 또는 `ulw <작업>`을 입력하면 ULW와 native goal을 활성화합니다. 일시정지·예산 제한 상태를 포함해 기존 goal은 유지합니다. RPC 클라이언트는 native goal을 별도로 생성해야 합니다.

명령은 입력 맨 앞에 놓습니다. `Explain /ulw` 같은 언급만으로는 활성화되지 않습니다. 일반 ULW는 전문 워크플로를 자동으로 활성화하지 않습니다. 설치된 확장을 변경한 뒤에는 OMP를 재시작합니다.

## 워크플로와 스킬

| 명령 | 용도 | 기본 OMP 키워드 |
| --- | --- | --- |
| `/ulw` | 세션에서 ULW 활성화 | — |
| `/ulw-plan` | 구현 없이 검토된 계획 작성 | `ultrathink` |
| `/ulw-execute` | 계획 실행과 진행 추적 | `orchestrate` |
| `/ulw-loop` | 목표·의존성·증거 추적 | `orchestrate` |
| `/mass-ulw` | 영속 의존성 그래프 실행 | `workflowz` |
| `/ulw-research` | 출처와 반론을 포함한 조사 | `workflowz` |

전문 명령은 이미 지정한 키워드가 없을 때 기본 키워드를 추가하며, OMP의 키워드 설정과 도구 조건을 따릅니다. RPC에서는 `prompt`와 적절한 `streamingBehavior`를 사용합니다. 별도 `steer`·`follow_up` 요청은 키워드 처리를 건너뜁니다. 입력 훅을 거치지 않는 `/skill:` 직접 호출이나 초기 CLI 텍스트에는 키워드를 명시해야 합니다.

그 밖의 진입점:

- **코드·리뷰:** `/debugging`, `/programming`, `/review-work`, `/ast-grep`, `/lsp-setup`, `/refactor`
- **UI·평가:** `/frontend`, `/visual-qa`, `/visualize`, `/data-scientist`, `/eval-integrity`
- **브라우저·데스크톱:** `/web-browser`, `/ultimate-browsing`, `/computer-use`는 OMP의 native Eval API와 권한을 사용합니다. 기존 `/browser`·`/computer` 제어 명령은 유지합니다.
- **세션·메모리:** `/coding-agent-sessions`, `/init-deep`, `/reflection`, `/memory-advisor`

상세 지침은 [skills/](skills/)에서 확인합니다. 여러 제품의 세션 탐색에는 Python 3.11+가 필요하며, 특정 OMP 세션 상담은 native `seance`를 사용합니다.

## 프롬프트와 코드모드

지원 모델의 프롬프트를 OMP에 맞게 보정하고, 메인과 지원되는 자식 세션에 각각 적용합니다. 전문 역할·프로젝트 지침·권한·완료 프로토콜은 보존합니다. 커스텀 템플릿과 미지원 모델은 native 동작을 유지합니다. 명시적인 조사·계획 전용 요청에서는 prewalk를 잠시 억제하고, 구현 요청으로 전환하면 이 확장이 소유한 override만 복원합니다.

모든 Gemini 모델은 OMP에 맞춘 AGY(Antigravity CLI) 프롬프트를 사용하고 네이티브 도구를 직접 호출합니다. 그 외 모델의 코드모드는 요청의 기능 조건에 따라 적용합니다.

- 일반 작업 도구는 직접 호출 스키마 대신 native JavaScript eval에 `tool.<name>(args)` 형태로 안내합니다.
- 세션 제어, `write`, `apply_patch`, bridge 예약 이름(`defined`, `undefine`), 매핑할 수 없는 도구와 강제 선택된 도구는 직접 호출로 남깁니다.
- 독립적인 읽기·검색·조회는 병렬 실행합니다. 코드모드에서는 `Promise.allSettled`를 사용하고, 변경·승인·대기·의존 호출은 순차 실행합니다.
- JavaScript를 지원하는 활성 eval과 지원되는 provider 요청 훅이 필요합니다. 제한된 에이전트에 도구·권한을 추가하지 않으며, 미지원 요청은 알림과 함께 그대로 유지합니다.

Kiro·Cursor Agent·GitLab Duo Agent·Apple Foundation Models는 요청 훅에 제약이 있어 코드모드 적용을 보장하지 않습니다. 카탈로그 캐시는 세션별로 관리하며 현재 도구 메타데이터를 반영합니다. **코드모드는 모델의 호출 방식을 유도하는 정책이지 실행 보안 경계가 아닙니다.**

구현 위치: [모델 보정](presets.ts), [코드모드](code-mode.ts), [세션 통합](index.ts), [native 지침](host-guidance.ts).

## 업데이트와 테스트

저장소를 갱신한 뒤 고정된 서브모듈에서 frontend 참조를 다시 생성합니다.

```bash
git submodule update --init --recursive
bun upstream/materialize-frontend-refs.mjs
```

GitHub 소스 압축 파일에는 서브모듈과 생성 참조가 없습니다. Git 없이 배포할 때는 생성이 완료된 `skills/` 트리 전체를 복사합니다. 초기화와 upstream 갱신에는 네트워크가 필요하며, 참조 생성은 로컬에서 수행합니다.

모델 프리셋 갱신:

```bash
bun upstream/update.mjs --ref main --check
bun upstream/update.mjs --ref main
```

`--ref`에는 브랜치·태그·커밋 SHA를 지정할 수 있습니다. 검증이 성공한 뒤 생성 프리셋만 교체하며, 로컬 보정 코드와 스킬은 유지합니다. `--check`는 변경 없음에 0, 변경 또는 오류에 1을 반환합니다. API 호출 제한 시 `GITHUB_TOKEN`을 사용할 수 있습니다.

```bash
bun test
bun run typecheck
bun run test:host
```

호스트 검증은 설치된 OMP를 격리된 상태와 로컬 응답기로 실행합니다. 통합·전송 경로를 확인하며, 외부 모델의 지침 준수까지 검증하지는 않습니다.

## 변경 이력과 출처

[변경 이력](CHANGELOG.ko.md). 원본 리비전·출처·라이선스는 [upstream/](upstream/)과 각 스킬의 attribution 파일에 보존합니다.
