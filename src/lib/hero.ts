import { HERO_BEATS } from '../config'

/**
 * 히어로 영상의 어느 지점에서 무엇을 보여줄지.
 *
 * 영상은 통로를 지나 마지막에 책 한 권이 다가와 펼친 종이가 화면을 덮으며 끝난다.
 * 그 종이가 그대로 페이지 배경이 되므로, 덮이는 구간에는 글자도 어두운 막도 남기면 안 된다.
 */

/** from~to 구간에서 0에서 1로 올라가는 값. 구간 밖은 0 또는 1로 붙는다. */
export const ramp = (value: number, from: number, to: number) =>
  Math.min(Math.max((value - from) / (to - from), 0), 1)

export type HeroCues = {
  /** 표제 */
  title: number
  /** 통로 구간에 한 줄 띄우는 문장 */
  line: number
  /** 펼쳐진 종이 위에 쓰이는 글. 책이 열리고 거기 글이 있는 것이 이 화면의 요점이다. */
  paper: number
  /** 글 읽으라고 깔아 둔 어두운 막 */
  overlay: number
}

export function heroCues(progress: number): HeroCues {
  return {
    // 책이 스쳐 지나간 뒤 표제를 물린다.
    title: 1 - ramp(progress, 0.22, 0.3),
    // 조용한 통로 구간에만 있다가, 마지막 책이 다가오기 시작하면 비켜 준다.
    line: ramp(progress, 0.34, 0.42) * (1 - ramp(progress, HERO_BEATS.finaleStarts, 0.64)),
    // 종이가 거의 다 덮인 뒤에 글이 나타난다. 백지가 아니라 쓰인 지면이 되도록.
    paper: ramp(progress, 0.86, HERO_BEATS.covered),
    // 종이가 화면을 덮을 때까지 걷어낸다. 남아 있으면 정지 배경으로 넘어갈 때 밝기가 튄다.
    overlay: 1 - ramp(progress, HERO_BEATS.finaleStarts, HERO_BEATS.covered),
  }
}
