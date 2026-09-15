# superhuman-sw

리서치 → 실행 → 콘텐츠로 이어지는 학습 과정을 추적하는 개인 지식 아카이브.
**이 레포가 곧 데이터베이스다.** 프로젝트 1건 = `content/projects/` 아래 마크다운 1파일.

## 프로젝트를 추가하거나 고칠 때

반드시 먼저 읽는다:

- [`content/CONTRACT.md`](content/CONTRACT.md) — 파일 형식 명세. frontmatter 필드와 칸반 규칙
- [`content/RESEARCH-PIPELINE.md`](content/RESEARCH-PIPELINE.md) — 인스타 링크를 리서치 문서로 바꾸는 절차

커밋 전에 `npm run validate`로 형식을 확인한다. 어기면 CI가 실패한다.

## 기억할 것

- 칸반 컬럼은 저장하지 않는다. `researched_at` / `executed_at` / `published_at`에서 유도한다. `status` 필드를 만들지 마라
- `id`는 파일명과 같아야 하고 영구히 바꾸지 않는다
- frontmatter에 주석을 쓰지 마라. 사이트에서 편집·저장하면 사라진다
- 토큰·쿠키·세션 값은 절대 커밋하지 않는다. 퍼블릭 레포다. 깃허브 토큰은 `worker/` 서버에만 둔다
- `category`는 정해진 다섯 개 중 하나다. 새 값을 지어내면 CI가 실패한다

## 편집 서버

사이트에서 글을 고치면 `worker/` (Cloudflare Worker)를 거쳐 커밋된다. 설정은 [`worker/README.md`](worker/README.md).

## 개발

```bash
npm run dev       # 콘텐츠를 굽고 개발 서버
npm test          # 단위 테스트
npm run validate  # 콘텐츠 계약 검증
```
