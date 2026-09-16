---
id: p-20260915-hermes-local-multiuser
title: 헤르메스 로컬 컴퓨터에서 여러 명이 함께 쓰기 (프로필 세팅 가이드)
rank: Zy
category: agent
tags:
  - hermes
  - profiles
  - local-install
  - windows
  - multi-user
  - family
sources:
  - url: https://hermes-agent.nousresearch.com/docs/user-guide/profiles
    type: link
    title: Profiles — Running Multiple Agents (공식 문서)
  - url: https://hermes-agent.nousresearch.com/docs/user-guide/multi-profile-gateways
    type: link
    title: Running Many Gateways at Once (공식 문서)
  - url: https://hermes-agent.nousresearch.com/docs/user-guide/windows-native
    type: link
    title: Windows (Native) Guide (공식 문서)
post_url: null
researched_at: '2026-09-15T13:00:00.000Z'
executed_at: null
published_at: '2026-09-16T05:10:16.708Z'
---

## 🎯 핵심 요약

헤르메스는 **"프로필(Profile)"** 이라는 기능으로 한 대의 컴퓨터 안에서 완전히 독립된 여러 개의 에이전트를 동시에 돌릴 수 있다. 나(석원님)와 와이프가 같은 로컬 PC에서 각자의 텔레그램 봇, 각자의 기억, 각자의 API 키로 동시에 헤르메스를 쓰려면 — **프로필 하나씩을 만들고, 각자 세팅하고, 각자의 게이트웨이를 자동 실행되게 등록**하면 끝난다. VPS나 Docker 없이도 집에 있는 PC 한 대로 충분히 가능하다.

## 💡 핵심 인사이트

- **프로필 = 완전히 독립된 "헤르메스 홈 디렉토리"**: 설정(`config.yaml`), API 키(`.env`), 성격(`SOUL.md`), 기억, 세션, 스킬, 크론잡, 상태DB(`state.db`) 전부 프로필마다 따로 저장된다. 서로의 대화 내용이나 기억이 절대 섞이지 않는다.
- **절대 하지 말아야 할 것 — 같은 홈 디렉토리 공유**: 두 개의 에이전트 프로세스가 같은 프로필(같은 `~/.hermes/`)을 가리키게 하면, 둘 다 자동으로 메모리에 쓰고 서로 상대방이 쓴 내용을 다음 세션 시작 시 그대로 읽어들여서 — 설정한 적 없는 상태로 계속 꼬여간다. **한 사람당 반드시 프로필 하나**가 원칙.
- **프로필을 만들면 그 이름이 곧 명령어가 된다**: `hermes profile create wife`를 실행하면 그 순간부터 `wife setup`, `wife chat`, `wife gateway start` 같은 명령어가 바로 생긴다. 매번 `hermes -p wife ...`라고 안 써도 됨.
- **각 프로필은 자기만의 텔레그램 봇 토큰이 필요하다**: 같은 텔레그램 봇 토큰을 두 프로필이 동시에 쓰려고 하면 두 번째 프로필의 게이트웨이가 아예 시작을 거부한다(에러로 명확히 알려줌). 반드시 봇을 2개 만들어서 각자 하나씩 배정해야 한다.
- **메신저 채널(봇 토큰)은 clone해도 안 딸려온다**: `--clone`/`--clone-all`로 프로필을 복제해도 텔레그램/디스코드/슬랙 봇 토큰과 허용목록은 의도적으로 복사되지 않는다 — 한 봇이 두 프로세스에 동시에 붙으면 충돌하기 때문. 새 프로필의 메신저는 항상 새로 설정해야 한다.
- **OAuth 로그인(Claude Pro/Max 등)은 "공유"되지 복사되지 않는다**: Anthropic/OpenAI Codex/xAI의 OAuth 로그인은 1회용 리프레시 토큰이라, 복제해도 실제로는 같은 자격증명을 공유하는 것 — 한쪽에서 갱신하면 다른 쪽도 그 갱신을 그대로 따라간다. 와이프에게 완전히 독립된 로그인을 주려면 와이프 프로필 안에서 `hermes auth add <provider>`로 별도 로그인을 새로 받아야 한다(또는 API 키 방식을 각자 쓰면 이 문제 자체가 없음).
- **"멀티플렉싱"은 지금 상황엔 불필요**: 프로필이 아주 많거나 컨테이너 환경일 때만 쓰는 고급 옵션(하나의 게이트웨이 프로세스가 여러 프로필을 대신 서빙). 가정에서 2~3명이 쓰는 정도라면 프로필별로 게이트웨이 프로세스를 하나씩 따로 띄우는 **기본 방식(one-process-per-profile)** 이 훨씬 단순하고 안전(한 프로필에 문제가 생겨도 다른 프로필에 영향 없음).

## 🛠️ 적용법 가이드

### 0단계 — 헤르메스 설치 (아직 안 했다면, 로컬 PC 기준)

**Windows (관리자 권한 불필요)**: PowerShell을 열고
```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```
설치는 `%LOCALAPPDATA%\hermes\`에 들어가고, `hermes` 명령어가 자동으로 PATH에 등록된다. 설치 끝나면 **새 PowerShell 창을 다시 열어야** `hermes` 명령어가 인식된다.

**Mac/Linux**:
```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc   # 또는 source ~/.zshrc
```

Windows는 GUI 설치도 있다 — 비개발자용으로는 이쪽이 더 익숙할 수 있음: Hermes Desktop 인스톨러를 다운로드해서 더블클릭 실행하면 됨(내부적으로 위와 같은 PowerShell 스크립트를 대신 실행해줌).

### 1단계 — 나(기본 프로필) 먼저 세팅 확인

이미 쓰고 있다면 건너뛰어도 됨. 처음이라면:
```
hermes setup
hermes chat -q "테스트"
```
정상 응답이 오면 기본 프로필은 준비 완료.

### 2단계 — 와이프용 프로필 만들기

```
hermes profile create wife
```
이 한 줄로 `wife`라는 이름의 독립된 에이전트가 즉시 생성된다(설정·기억·세션이 전부 빈 상태로 시작). 이름은 원하는 대로(`ara`, `mywife` 등) 지어도 됨 — 영문·소문자·하이픈 권장.

> 💡 나의 기존 설정(모델, 스킬, 성격)을 베이스로 시작하고 싶다면 `--clone` 옵션을 붙인다:
> ```
> hermes profile create wife --clone
> ```
> 이건 `config.yaml`, `.env`, `SOUL.md`, 스킬, 그리고 **정리된 기억 파일(MEMORY.md/USER.md)** 만 복사한다. 세션 기록, 크론잡, 상태DB는 복사되지 않음(각자 새로 시작). 만약 기억까지 완전히 빈 상태로 시작하고 싶으면 `--clone` 없이 만들거나, 만든 뒤 `memories/MEMORY.md`·`memories/USER.md` 두 파일만 지우면 된다.

### 3단계 — 와이프 프로필 개별 세팅

```
wife setup
```
(`hermes profile create wife` 실행 직후부터 `wife`라는 명령어가 바로 작동한다)

세팅 마법사에서:
- **모델/제공자**: 별도 API 키를 쓸 건지, 같은 계정을 공유할 건지 선택. **가장 쉬운 방법은 Nous Portal**(`wife setup --portal`) — OAuth 로그인 한 번으로 모델 + 웹검색/이미지생성/TTS까지 한 번에 세팅됨. Anthropic API 키를 따로 쓰고 싶다면 `wife config set ANTHROPIC_API_KEY sk-ant-...`처럼 직접 넣어도 됨.
- **메신저**: 반드시 **와이프 전용 새 텔레그램 봇**을 만들어야 한다 (`@BotFather`에게 `/newbot`으로 두 번째 봇 생성 → 토큰 저장 → `@userinfobot`으로 와이프 본인 텔레그램 숫자ID 확인 → 세팅 화면에 입력). 내 봇 토큰을 그대로 쓰면 안 됨.

### 4단계 — 첫 대화 확인

```
wife chat -q "안녕, 잘 세팅됐어?"
```
정상 응답이 오면 완료.

### 5단계 — 로그인/부팅할 때 자동으로 켜지게 등록 (둘 다)

이 단계를 해야 컴퓨터를 켤 때마다 텔레그램 봇이 자동으로 살아난다.

```
hermes gateway install       # 내 프로필
wife gateway install         # 와이프 프로필
```

- **Windows**: 관리자 권한 없이 로그인 시 자동 실행되는 예약 작업(Scheduled Task)으로 등록됨. 로그아웃하면 꺼지고, 다시 로그인하면 자동으로 켜짐.
- **Mac**: LaunchAgent(`~/Library/LaunchAgents/ai.hermes.gateway-wife.plist`)로 등록.
- **Linux**: systemd user service(`~/.config/systemd/user/hermes-gateway-wife.service`)로 등록. 로그아웃 후에도 계속 돌게 하려면 `sudo loginctl enable-linger $USER`도 함께 실행.

각자 관리 명령어:
```
wife gateway start / stop / restart / status
wife gateway uninstall   # 자동시작 해제
```

### 6단계 — 여러 프로필을 한 번에 관리하는 스크립트 (선택, 편의용)

프로필이 2~3개를 넘어가면 하나하나 치기 귀찮으니 아래 스크립트를 만들어두면 편함 (Mac/Linux 기준, `~/.local/bin/hermes-gateways`로 저장 후 `chmod +x`):

```sh
#!/bin/sh
set -eu
profiles="default wife"   # 프로필 이름을 여기에 나열
run_for_profile() {
  profile="$1"; action="$2"
  if [ "$profile" = "default" ]; then hermes gateway "$action"
  else hermes -p "$profile" gateway "$action"; fi
}
action="${1:-}"
case "$action" in
  start|stop|restart|status)
    for profile in $profiles; do echo "==> $action $profile"; run_for_profile "$profile" "$action"; done ;;
  list) hermes gateway list ;;
  *) echo "Usage: hermes-gateways {start|stop|restart|status|list}"; exit 2 ;;
esac
```
사용: `hermes-gateways start` / `hermes-gateways status` 등으로 전체 일괄 제어.

### 7단계 — 로그 확인 (문제 생겼을 때)

```
tail -f ~/.hermes/logs/gateway.log                       # 내 프로필
tail -f ~/.hermes/profiles/wife/logs/gateway.log          # 와이프 프로필
# 또는 헤르메스 내장 로그 뷰어
hermes logs -f
wife logs -f
```

### 8단계 (선택) — 컴퓨터가 안 잠들게 유지하기

24시간 봇이 응답하려면 PC가 잠들면 안 된다.
- **Mac**: `caffeinate -dis` (백그라운드로: `nohup caffeinate -dis >/dev/null 2>&1 & disown`). 단, 노트북 뚜껑을 닫으면 이건 못 막는다 — 에너지 설정에서 "덮개 닫아도 절전 안 함"을 켜야 함.
- **Windows**: 제어판 → 전원 옵션에서 "절전 모드로 전환 안 함"으로 설정하거나, 화면 잠금과 별개로 시스템 절전만 끄면 됨.
- **Linux**: `sudo loginctl enable-linger $USER` (로그아웃 후에도 서비스 유지) + 필요시 `systemd-inhibit --what=idle:sleep sleep infinity &`.

## 💼 활용 예시

- **나 + 와이프가 각자 텔레그램에서 말 걸면 각자의 봇이 응답** — 내 기억엔 회사 업무·인사 데이터, 와이프 기억엔 와이프의 개인 스케줄·관심사만 쌓인다. 서로 안 섞임.
- **가족 구성원별로 역할을 다르게**: 예) 내 프로필은 SR바이오텍 업무용, 와이프 프로필은 개인 스케줄·집안일 관리용, (나중에) 아이 계정을 추가하면 학습 도우미용 — 프로필마다 다른 스킬·다른 성격(SOUL.md)을 줄 수 있음.
- **공용 PC 한 대로 비용 절감**: VPS 없이 집 PC 한 대에서 여러 명이 각자의 에이전트를 무료로(전기세 제외) 운영 가능. Nous Portal이나 각자 API 키만 있으면 됨.
- **한쪽만 잠깐 꺼두고 싶을 때**: `wife gateway stop`으로 와이프 프로필만 개별 중지 가능 — 내 프로필은 영향 없음(프로세스가 완전히 분리되어 있으므로).

## ⚠️ 주의사항

- **절대 두 프로세스가 같은 프로필(같은 홈 디렉토리)을 가리키게 하지 말 것** — 반드시 `hermes profile create`로 별도 프로필을 만들 것. 이게 이 세팅의 핵심 규칙.
- **텔레그램/디스코드/슬랙 봇 토큰은 프로필마다 반드시 새로 발급** — 같은 토큰을 두 프로필에 쓰면 두 번째 프로필의 게이트웨이가 시작을 거부한다(에러 메시지로 알려주니 당황하지 말 것).
- **`--clone-all`로 완전 복제해도 메신저 채널·크론잡은 안 따라온다** — 의도된 동작. 메신저는 항상 새로 세팅, 크론잡은 필요하면 프로필별로 다시 만들어야 함(`hermes cron create ...` 등).
- **Claude Pro/Max OAuth 로그인은 "각자 독립"이 아니라 "공유"** — 정말 독립된 인증을 원하면 와이프 프로필 안에서 `hermes auth add <provider>`로 새로 로그인하거나, 각자 별도의 API 키(과금은 개별)를 쓸 것.
- **컴퓨터를 끄거나 재부팅하면 자동시작 등록(`gateway install`)이 안 되어 있는 프로필은 다시 안 켜진다** — 반드시 5단계를 두 프로필 모두에 대해 진행할 것.
- **로그아웃(특히 Windows 원격 로그아웃)하면 게이트웨이가 꺼질 수 있다** — Windows는 로그인 시 예약작업으로 재기동되지만, Mac/Linux는 세션 유지(linger) 설정을 해줘야 로그아웃 후에도 계속 돈다.
- **Windows 사용자는 헤르메스 설치 후 반드시 새 터미널 창을 다시 열 것** — 같은 창에서 계속 `hermes` 명령어가 없다고 나오면 PATH가 아직 갱신 안 된 것.

## 📚 원본 링크

- Profiles 공식 문서: https://hermes-agent.nousresearch.com/docs/user-guide/profiles
- 여러 게이트웨이 동시 운영 공식 문서: https://hermes-agent.nousresearch.com/docs/user-guide/multi-profile-gateways
- Windows 네이티브 설치 가이드: https://hermes-agent.nousresearch.com/docs/user-guide/windows-native
- 빠른 시작 가이드: https://hermes-agent.nousresearch.com/docs/getting-started/quickstart
