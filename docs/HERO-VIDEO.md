# 홈 히어로 영상

홈 화면 맨 위 영상은 **스크롤에 물려 있다.** 내려갈수록 영상이 앞으로 감기고, 올리면 되감긴다.
재생 버튼이 없고 소리도 없다. 스크롤이 곧 재생 손잡이다.

영상은 마지막에 펼친 종이가 화면을 덮으며 끝나고, **그 마지막 프레임이 그대로 페이지 배경으로 이어진다.**

## 파일

| 파일 | 역할 |
|---|---|
| `public/hero.mp4` | 1920×1080, 데스크톱 |
| `public/hero-720.mp4` | 1280×720, 좁은 화면 (900px 미만) |
| `public/hero-poster.jpg` | 영상이 뜨기 전 첫 장면 |
| `public/hero-page.png` | **영상의 마지막 프레임.** 영상이 끝난 뒤의 페이지 배경 |

현재 영상: 12.5초 / 24fps / 300프레임 / 무음 / 컷 없는 단일 테이크.

## 장면과 스크롤 위치

`src/config.ts` 의 `HERO_BEATS` 가 이 표를 그대로 담고 있고, 글자를 넣고 빼는 시점이 여기에 맞춰져 있다.

| 장면 | 시각 | 스크롤 |
|---|---|---|
| 시작 (통로) | 0초 | 0% |
| 책 한 권이 앞을 스쳐 지나감 | 2.1초 | 17% |
| 조용한 통로 | 4~7초 | 32~56% |
| 마지막 책이 다가오기 시작 | 7.0초 | 56% |
| 펼친 종이가 화면을 덮음 | 11.9초 | 95% |

연출은 `src/lib/hero.ts` 의 `heroCues()` 한 곳에서 정한다. 표제는 22~30%에 물러나고, 통로 구간에 문장이 들어왔다가 56%부터 비켜난다. **덮이는 구간에는 글자도 어두운 막도 남기지 않는다** — 남으면 정지 배경으로 넘어갈 때 밝기가 튄다. 이 규칙들은 `src/lib/hero.test.ts` 가 지키고 있다.

## 영상을 바꿀 때 반드시 지킬 것

### 1. 키프레임을 촘촘하게

스크롤 스크럽은 아무 지점으로나 건너뛴다. 키프레임이 드물면 그때마다 처음부터 디코딩해서 심하게 끊긴다.
생성 도구의 원본은 보통 10초에 키프레임이 **1개**뿐이다. 반드시 다시 인코딩한다.

```bash
ffmpeg -i IN.mp4 -an -c:v libx264 -preset slow -crf 23 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart public/hero.mp4

ffmpeg -i IN.mp4 -an -vf scale=1280:720 -c:v libx264 -preset slow -crf 24 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart public/hero-720.mp4
```

확인:

```bash
ffprobe -v error -select_streams v:0 -show_frames -show_entries frame=key_frame -of csv=p=0 public/hero.mp4 | grep -c '^1'
```

12.5초면 50 내외가 나와야 한다. 1이면 스크럽이 끊긴다.

### 2. 배경 이미지는 그 영상에서 다시 뽑을 것

`hero-page.png` 는 `hero.mp4` 의 **마지막 프레임과 픽셀이 같아야 한다.** 다시 인코딩하면 픽셀이 미세하게 바뀌므로 배경도 다시 뽑는다.

```bash
ffmpeg -sseof -0.05 -i public/hero.mp4 -frames:v 1 public/hero-page.png -y
```

확인 (두 해시가 같아야 한다):

```bash
ffmpeg -sseof -0.05 -i public/hero.mp4 -frames:v 1 /tmp/last.png -y && md5sum /tmp/last.png public/hero-page.png
```

### 3. 장면 시각을 `HERO_BEATS` 에 옮겨 적을 것

영상이 바뀌면 `src/config.ts` 의 숫자도 바꾼다. 안 바꾸면 글자가 엉뚱한 데서 뜨고 진다.

## 알아 둘 것

**마지막 구간에 프리즈는 없다.** 인수인계 문서에는 마지막 12프레임이 고정돼 있다고 적혀 있었지만, 실제 파일을 프레임 단위로 확인해 보니 마지막 12프레임 중 서로 다른 화면이 10가지였고 배경 이미지와 정확히 같은 프레임은 2장뿐이었다.

그래서 코드가 대신 막는다. 스크롤이 **97%를 넘으면 보간을 멈추고 마지막 프레임으로 바로 붙인다**(`ScrollVideo.tsx` 의 `SNAP_AFTER`). 스크롤이 끝에 살짝 못 미쳐 멈춰도 정지 배경과 어긋나지 않는다.

**배경 위에는 밝은 글씨만 쓴다.** 배경 평균 RGB (126,98,78) 기준으로 흰색 5.61:1, `paper` 4.84:1 로 본문 기준(4.5:1)을 넘지만, `ink` 는 2.96:1 로 한참 못 미친다.

**책등 주름이 화면 가운데에서 살짝 오른쪽에 있다.** 배경 위 글을 가운데 정렬하면 주름에 걸린다. 지금은 왼쪽 면에 몰아 두었다.

## 손볼 수 있는 것

- **스크롤 길이** — `src/pages/Home.tsx` 의 `runway={4}`. 화면 네 개 높이만큼 스크롤해야 영상이 끝난다. 키우면 더 천천히 감긴다
- **따라오는 속도** — `src/components/ScrollVideo.tsx` 의 `FOLLOW_PER_FRAME`. 키우면 스크롤에 딱 붙고, 줄이면 더 미끄러진다. 프레임률과 무관하게 같은 속도가 나오도록 흐른 시간으로 계산한다

## 접근성

`prefers-reduced-motion` 을 켠 사람에게는 감기를 하지 않고 첫 장면만 보여준 뒤 바로 다음 내용으로 넘긴다. 스크롤 연동 영상은 어지러움을 호소하는 사람에게 특히 부담이 크다.
