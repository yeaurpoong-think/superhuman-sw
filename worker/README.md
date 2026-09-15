# 편집 서버

깃허브 토큰을 대신 들고 있는 작은 서버다. 브라우저에는 비밀번호만 들어가고, 토큰은 여기서 한 발짝도 나가지 않는다.

- 쓰기는 `content/` 아래 마크다운으로만 제한한다. 세션이 새더라도 사이트 코드나 배포 설정은 건드릴 수 없다
- 세션은 90일짜리 서명 토큰이다. 서버에 아무것도 저장하지 않는다
- 비밀번호가 틀리면 1초 지연을 준다. 무료 플랜에는 상태 저장 제한 장치가 없어서 이 정도가 최선이다

## 처음 한 번만 하는 설정

### 1. 깃허브 토큰 만들기

[github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) 에서 **Fine-grained token**:

- Repository access → **Only select repositories → superhuman-sw**
- Repository permissions → **Contents: Read and write** 만
- **Workflows 권한은 주지 않는다**
- 만료 1년

### 2. 배포

```bash
cd worker
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

- `GITHUB_TOKEN` — 위에서 만든 토큰
- `ADMIN_PASSWORD` — 사이트에서 칠 비밀번호. 12자 이상으로 길게 잡는다
- `SESSION_SECRET` — 아무 긴 랜덤 문자열. 이걸 바꾸면 모든 기기의 로그인이 풀린다

배포가 끝나면 `https://superhuman-sw-api.<계정이름>.workers.dev` 같은 주소가 나온다.

### 3. 사이트에 주소 알려주기

[`src/config.ts`](../src/config.ts) 의 `API_BASE` 에 그 주소를 적고(끝에 슬래시 없이) 커밋·푸시한다.
이 값이 비어 있는 동안 사이트는 읽기 전용으로만 뜬다.

## 나중에

- 비밀번호 바꾸기: `npx wrangler secret put ADMIN_PASSWORD`
- 모든 기기 로그아웃: `npx wrangler secret put SESSION_SECRET` 으로 새 값 넣기
- 토큰 갈아 끼우기: `npx wrangler secret put GITHUB_TOKEN`
