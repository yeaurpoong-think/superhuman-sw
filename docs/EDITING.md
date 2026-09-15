# 사이트에서 직접 편집하기

서버도 계정도 없이 비밀번호 하나로 편집한다.

깃허브 토큰을 비밀번호로 암호화해 `public/vault.json` 으로 만들어 사이트에 같이 올린다.
비밀번호를 치면 브라우저 안에서 풀어 그 토큰으로 커밋한다.

**이 방식의 전부는 비밀번호다.** 금고 파일은 누구나 내려받을 수 있으므로, 비밀번호가 짧으면 시간을 들여 열 수 있다.
그래서 16자 이상을 강제하고, 키 유도를 600,000회 돌려 한 번 시도하는 비용 자체를 비싸게 만들었다.
뚫리더라도 피해는 "이 공개 레포가 훼손된다"까지고, 토큰을 폐기하면 끝난다. 다른 레포나 계정에는 닿지 않는다.

## 처음 한 번

### 1. 깃허브 토큰 만들기

[github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) → **Fine-grained token**

- Repository access → **Only select repositories → superhuman-sw**
- Repository permissions → **Contents: Read and write** 만
- **Workflows 권한은 주지 않는다**
- 만료 1년

### 2. 금고 만들기

```bash
npm run seal
```

토큰과 비밀번호를 물어본다. 둘 다 화면에 찍히지 않고, 토큰이 평문으로 디스크에 남지도 않는다.
비밀번호는 **16자 이상**이어야 한다. 짧은 단어 하나보다 긴 문장 하나가 낫다.

### 3. 커밋

```bash
git add public/vault.json && git commit -m "chore: 금고 갱신" && git push
```

1~2분 뒤부터 사이트 우측 상단 **편집하기**에 비밀번호를 치면 편집 모드가 켜진다.
'이 기기에서 기억하기'를 켜두면 다음부터 바로 들어간다.

## 나중에

| 하고 싶은 일 | 방법 |
|---|---|
| 비밀번호 바꾸기 | `npm run seal` 을 다시 돌리고 커밋한다 |
| 토큰 갈아 끼우기 | 새 토큰을 만들고 `npm run seal` 을 다시 돌린다 |
| 급히 막기 | 깃허브에서 토큰을 **Revoke**. 금고가 열려도 아무것도 못 한다 |
| 이 기기에서 지우기 | 사이트에서 **잠그기** |

토큰을 폐기하는 것이 가장 확실한 차단이다. 금고 파일을 지우는 것보다 먼저 할 일이다.
