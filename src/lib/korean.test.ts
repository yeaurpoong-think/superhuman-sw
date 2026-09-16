import { describe, expect, it } from 'vitest'
import { tie } from './korean'

const NBSP = '\u00A0'

describe('tie', () => {
  it('관형사 뒤에서 줄이 갈리지 않게 묶는다', () => {
    expect(tie('그래서 이 서고는')).toBe(`그래서 이${NBSP}서고는`)
    expect(tie('여러 명이 함께 씁니다')).toBe(`여러${NBSP}명이 함께${NBSP}씁니다`)
  })

  it('부사 뒤에서도 묶는다', () => {
    expect(tie('무엇을 다시 했는지')).toBe(`무엇을 다시${NBSP}했는지`)
    expect(tie('직접 만들어 봅니다')).toBe(`직접${NBSP}만들어${NBSP}봅니다`)
  })

  it('의존명사는 앞말에 붙인다', () => {
    expect(tie('읽기만 한 것은')).toBe(`읽기만 한${NBSP}것은`)
    expect(tie('들를 수 있습니다')).toBe(`들를${NBSP}수 있습니다`)
    expect(tie('생각날 때 들르세요')).toBe(`생각날${NBSP}때 들르세요`)
  })

  it('낱말 꼬리를 관형사로 착각하지 않는다', () => {
    // "많이"의 "이", "부단히"의 "히" 뒤에 붙이면 엉뚱한 곳이 묶인다
    expect(tie('많이 남았다')).toBe('많이 남았다')
    expect(tie('종이 한 장')).toBe(`종이 한${NBSP}장`)
  })

  it('의존명사로 시작하는 다른 낱말에는 걸리지 않는다', () => {
    expect(tie('그 수많은 책')).toBe(`그${NBSP}수많은 책`)
    expect(tie('한 건강한 습관')).toBe(`한${NBSP}건강한 습관`)
  })

  it('문장 맨 앞의 관형사도 묶는다', () => {
    expect(tie('이 서고는 공개입니다')).toBe(`이${NBSP}서고는 공개입니다`)
  })

  it('글자는 하나도 더하거나 빼지 않는다 — 공백의 종류만 바뀐다', () => {
    const samples = [
      '리서치를 끝낸 날과 실제로 해본 날을 다른 칸에 적습니다.',
      '앞서간 사람의 정리된 결론만 보고 싶으시다면 이 서고는 맞지 않습니다.',
      '헤르메스 로컬 컴퓨터에서 여러 명이 함께 쓰기 (프로필 세팅 가이드)',
    ]
    for (const s of samples) {
      expect(tie(s).replace(/\u00A0/g, ' ')).toBe(s)
    }
  })

  it('보조용언은 앞 동사에 붙인다', () => {
    expect(tie('그 과정에서 알게 되었습니다')).toBe(`그${NBSP}과정에서 알게${NBSP}되었습니다`)
    expect(tie('직접 만들어 보고')).toBe(`직접${NBSP}만들어${NBSP}보고`)
    // 합쇼체는 어간에 ㅂ 이 붙어 첫 음절이 달라진다 — 두다 → 둡니다
    expect(tie('적어 둡니다')).toBe(`적어${NBSP}둡니다`)
    expect(tie('만들어 봅니다')).toBe(`만들어${NBSP}봅니다`)
  })

  it('활용하며 종성이 붙어도 보조용언으로 알아본다', () => {
    // 되다 → 된·됩니다, 두다 → 둡니다. 종성을 떼고 어간으로 견준다.
    expect(tie('그 과정에서 알게 된 것')).toBe(`그${NBSP}과정에서 알게${NBSP}된${NBSP}것`)
    // '해'는 '하여'가 줄어든 꼴이라 연결어미로 친다 — "해 보다", "해 두다"
    expect(tie('해 둔 것')).toBe(`해${NBSP}둔${NBSP}것`)
  })

  it('보조용언이 길면 묶지 않는다 — 한 덩어리가 너무 커진다', () => {
    // '보관하였습니다'는 일곱 음절이라 후보에서 빠진다
    expect(tie('적어 보관하였습니다')).toBe('적어 보관하였습니다')
  })

  it('연결어미가 아니면 보조용언으로 보지 않는다', () => {
    // "학교 가자"의 "교"는 연결어미가 아니다
    expect(tie('학교 가자')).toBe('학교 가자')
    // 접속사 "그리고"는 -고 라서 애초에 규칙에 없다
    expect(tie('그리고 보내면')).toBe('그리고 보내면')
  })

  it('한글이 없는 글은 그대로 둔다', () => {
    expect(tie('Arcads Workflow — Claude MCP')).toBe('Arcads Workflow — Claude MCP')
  })

  it('빈 글자열도 받는다', () => {
    expect(tie('')).toBe('')
  })
})
