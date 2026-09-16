import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  poster?: string
  /** 스크롤 길이. 길수록 영상이 천천히 넘어간다. 화면 높이의 배수. */
  runway?: number
  children?: React.ReactNode
}

type Status = 'loading' | 'ready' | 'missing'

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/**
 * 스크롤에 영상을 물려 놓는다. 내려갈수록 영상이 앞으로 감긴다.
 *
 * 스크롤 이벤트마다 currentTime을 직접 꽂으면 화면이 튄다.
 * 스크롤은 목표 시각만 적어 두고, 실제 이동은 매 프레임 조금씩 따라가게 해 부드럽게 만든다.
 *
 * 영상이 없거나(아직 안 올렸거나) 브라우저가 못 읽으면 글자만으로 된 히어로로 조용히 내려앉는다.
 */
export function ScrollVideo({ src, poster, runway = 3, children }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [progress, setProgress] = useState(0)

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    let raf = 0
    let target = 0
    let current = 0

    const readScroll = () => {
      const rect = stage.getBoundingClientRect()
      const total = stage.offsetHeight - window.innerHeight
      const p = total > 0 ? clamp01(-rect.top / total) : 0
      setProgress(p)
      const video = videoRef.current
      if (video?.duration) target = p * video.duration
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const video = videoRef.current
      if (!video || !video.duration) return
      // 목표까지 한 번에 가지 않고 조금씩 따라간다. 감기는 느낌이 나고 디코더도 덜 힘들다.
      current += (target - current) * 0.18
      if (Math.abs(target - current) < 0.005) current = target
      if (Math.abs(video.currentTime - current) > 0.01) {
        if ('fastSeek' in video && typeof video.fastSeek === 'function') video.fastSeek(current)
        else video.currentTime = current
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
            src={src}
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
          className={
            status === 'missing'
              ? 'absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#2c2519,#17140f_60%)]'
              : 'absolute inset-0 bg-gradient-to-b from-shell/70 via-shell/30 to-shell/80'
          }
        />

        <div className="relative z-10 w-full px-6">{children}</div>

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
