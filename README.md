# 슈퍼휴먼 SW

리서치 → 실행 → 콘텐츠로 이어지는 학습 과정을 추적하는 개인 지식 아카이브.

- 사이트: https://yeaurpoong-think.github.io/superhuman-sw/
- 프로젝트 1건 = `content/projects/` 아래 마크다운 1파일. 이 레포가 곧 데이터베이스다.
- 에이전트(클로드·헤르메스)가 프로젝트를 추가할 때는 `content/CONTRACT.md`를 읽고 그 형식대로 파일을 만든다.

## 개발

```bash
npm install
npm run dev
```

사이트에서 직접 편집하려면 [`worker/README.md`](worker/README.md)대로 편집 서버를 한 번 띄운다.

`main`에 푸시하면 GitHub Actions가 빌드해 GitHub Pages로 배포한다.
