import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  /** 좁은 화면용 가벼운 판. 없으면 기본 영상을 쓴다. */
  srcSmall?: string
  poster?: string
  /** 스크롤 길이. 길수록 영상이 천천히 넘어간다. 화면 높이의 배수. */
  runway?: number
  /** 진행률(0~1)을 받아 그릴 내용. 영상 속 특정 순간에 맞춰 글을 넣고 뺄 수 있다. */
  children?: (progress: number) => React.ReactNode
  /**
   * 글 읽으라고 깔아 둔 어두운 막의 진하기를 진행률로 정한다.
   * 영상 끝 화면이 그대로 페이지 배경으로 이어질 때, 막이 남아 있으면 밝기가 튄다.
   */
  overlayOpacity?: (progress: number) => number
}

type Status = 'loading' | 'ready' | 'missing'

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)


/** 60Hz 한 프레임에 목표까지 남은 거리의 몇 할을 따라갈지. 키우면 스크롤에 딱 붙고, 줄이면 미끄러진다. */
const FOLLOW_PER_FRAME = 0.18

/**
 * 이 지점을 넘으면 보간을 그만두고 마지막 프레임으로 바로 붙인다.
 * 영상이 조금이라도 뒤처진 채 정지 배경으로 넘어가면 이음매가 보인다.
 */
const SNAP_AFTER = 0.97

/**
 * 스크롤에 영상을 물려 놓는다. 내려갈수록 영상이 앞으로 감긴다.
 *
 * 스크롤 이벤트마다 currentTime을 직접 꽂으면 화면이 튄다.
 * 스크롤은 목표 시각만 적어 두고, 실제 이동은 매 프레임 조금씩 따라가게 해 부드럽게 만든다.
 *
 * 영상이 없거나(아직 안 올렸거나) 브라우저가 못 읽으면 글자만으로 된 히어로로 조용히 내려앉는다.
 */
export function ScrollVideo({ src, srcSmall, poster, runway = 3, children, overlayOpacity }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [progress, setProgress] = useState(0)

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /**
   * 소스는 처음 한 번만 고른다. 중간에 바꾸면 영상이 처음부터 다시 받아진다.
   * 화면 폭과 기기 화소밀도를 같이 본다 — 휴대폰은 폭이 좁아도 화소가 촘촘하다.
   */
  const [source] = useState(() => {
    if (!srcSmall || typeof window === 'undefined') return src
    return window.innerWidth < 900 ? srcSmall : src
  })

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    let raf = 0
    let target = 0
    let current = 0
    let snap = false

    const readScroll = () => {
      const rect = stage.getBoundingClientRect()
      const total = stage.offsetHeight - window.innerHeight
      const p = total > 0 ? clamp01(-rect.top / total) : 0
      setProgress(p)
      snap = p >= SNAP_AFTER
      const video = videoRef.current
      if (video?.duration) target = p * video.duration
    }

    let last = performance.now()

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(now - last, 100)
      last = now

      const video = videoRef.current
      if (!video || !video.duration) return

      if (snap) {
        // 끝자락에서는 미끄러뜨리지 않는다. 마지막 프레임이 곧 페이지 배경이다.
        current = video.duration
      } else {
        // 목표까지 한 번에 가지 않고 조금씩 따라간다. 감기는 느낌이 나고 디코더도 덜 힘들다.
        // 프레임 수가 아니라 흐른 시간으로 재야 60Hz·120Hz·저사양 기기에서 같은 속도로 따라온다.
        const k = 1 - (1 - FOLLOW_PER_FRAME) ** (dt / 16.67)
        current += (target - current) * k
        if (Math.abs(target - current) < 0.005) current = target
      }

      if (Math.abs(video.currentTime - current) > 0.01) {
        // fastSeek 은 가까운 키프레임으로 붙는다. 키프레임이 촘촘해야 티가 안 난다.
        // 마지막 프레임은 정확해야 하므로 그때만 정밀 탐색을 쓴다.
        if (!snap && 'fastSeek' in video && typeof video.fastSeek === 'function') {
          video.fastSeek(current)
        } else {
          video.currentTime = current
        }
      }
    }

    readScroll()
    window.addEventListener('scroll', readScroll, { passive: true })
    window.addEventListener('resize', readScroll)
    if (!reduced) raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('scroll', readScroll)
      window.removeEventListener('resize', readScroll)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  const tall = status === 'ready' && !reduced

  return (
    <div
      ref={stageRef}
      className="relative"
      style={{ height: tall ? `${runway * 100}dvh` : '100dvh' }}
    >
      <div className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden">
        {status !== 'missing' && (
          <video
            ref={videoRef}
            src={source}
            poster={poster}
            muted
            playsInline
            preload="auto"
            aria-hidden
            onLoadedMetadata={() => setStatus('ready')}
            onError={() => setStatus('missing')}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              status === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* 영상이 없을 때의 바탕. 있을 때는 글자가 읽히도록 어둡게 깔아 준다. */}
        <div
          aria-hidden
          style={
            overlayOpacity && status !== 'missing'
              ? { opacity: overlayOpacity(progress) }
              : undefined
          }
          className={
            status === 'missing'
              ? 'absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#2c2519,#17140f_60%)]'
              : 'absolute inset-0 bg-gradient-to-b from-shell/70 via-shell/30 to-shell/80'
          }
        />

        <div className="relative z-10 w-full px-6">{children?.(progress)}</div>

        {tall && (
          <div
            aria-hidden
            className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500"
            style={{ opacity: progress > 0.05 ? 0 : 1 }}
          >
            <span className="label text-paper/70">아래로</span>
            <span className="mx-auto mt-2 block h-8 w-px bg-paper/40" />
          </div>
        )}
      </div>
    </div>
  )
}
