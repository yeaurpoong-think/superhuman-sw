# superhuman-sw

리서치 → 실행 → 콘텐츠로 이어지는 학습 과정을 추적하는 개인 지식 아카이브.
**이 레포가 곧 데이터베이스다.** 프로젝트 1건 = `content/projects/` 아래 마크다운 1파일.

## 리서치를 등록할 때 (주 경로)

대표님은 인스타 릴스·캐러셀이나 링크를 던지고, 에이전트가 정리해 이 레포에 커밋한다.
그게 이 사이트에 글이 들어오는 기본 경로다.

먼저 읽는다:

- [`content/RESEARCH-PIPELINE.md`](content/RESEARCH-PIPELINE.md) — 링크에서 내용을 뽑아 리서치 문서로 가공하는 절차
- [`content/CONTRACT.md`](content/CONTRACT.md) — 파일 형식 명세

**frontmatter를 손으로 짜지 마라.** 이 명령이 `id`·`rank`·`researched_at` 을 계산하고 계약도 미리 검사한다:

```bash
npm run new -- --title "제목" --url "https://www.instagram.com/reel/XXXX/" --category content
```

가공한 본문은 파이프로 넘긴다:

```bash
cat 리서치.md | npm run new -- --title "제목" --url "https://..."
```

커밋 전에 `npm run validate` 로 확인한다. 어기면 CI가 실패한다.

## 기억할 것

- 칸반 컬럼은 저장하지 않는다. `researched_at` / `executed_at` / `published_at` 에서 유도한다. `status` 필드를 만들지 마라
- `id`는 파일명과 같아야 하고 영구히 바꾸지 않는다
- `category`는 `agent` · `automation` · `content` · `business` · `market` · `marketing` 여섯 중 하나다. 애매하면 비운다. 새 값을 지어내면 CI가 실패한다
- frontmatter에 주석을 쓰지 마라. 사이트에서 편집·저장하면 사라진다
- 토큰·쿠키·세션 값은 절대 커밋하지 않는다. 퍼블릭 레포다. 깃허브 토큰은 비밀번호로 잠근 `public/vault.json` 에만 둔다

## 사이트에서 직접 편집

비밀번호로 금고를 열어 편집한다. 설정은 [`docs/EDITING.md`](docs/EDITING.md).

## 개발

```bash
npm run dev       # 콘텐츠를 굽고 개발 서버
npm test          # 단위 테스트
npm run validate  # 콘텐츠 계약 검증
npm run new       # 리서치 카드 만들기
npm run seal      # 깃허브 토큰을 비밀번호로 잠그기
```
