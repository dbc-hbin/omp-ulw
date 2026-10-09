# omp-ulw

OMP용 모델 프롬프트와 Native ULW 워크플로 확장입니다. 모델별 프롬프트, 세션 단위 ULW 활성화, 계획·실행·리서치 및 작업 검증 스킬을 제공합니다.

## 사용

OMP가 설치된 환경에서 실행합니다.

```bash
git clone https://github.com/dbc-hbin/omp-ulw.git
omp -e ./omp-ulw/index.ts
```

- `/ulw <작업>`: ULW 활성화. 이후 같은 세션에서도 유지됩니다.
- `/ulw-plan`, `/ulw-execute`, `/ulw-loop`, `/ulw-research`, `/mass-ulw`: 계획, 실행, 목표 루프, 리서치, 의존 작업 실행.
- `/debugging`, `/review-work`, `/visual-qa`, `/frontend` 등: 필요한 전문 스킬 호출.

일반 `/ulw`는 전문 워크플로를 자동으로 켜지 않습니다. 참조 문서는 필요한 시점에만 읽으며, 기존 프로젝트 지침과 권한 규칙을 보존합니다.

## 테스트

```bash
cd omp-ulw
bun test
```

OMO 프롬프트와 워크플로를 OMP에 맞게 이식했습니다. 원본 출처와 개별 리소스의 라이선스는 `upstream/` 및 각 스킬의 출처·라이선스 파일을 참고하세요.
