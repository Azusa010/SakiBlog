import { describe, expect, it } from 'vitest'
import { estimateReadingMinutes, renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders standard markdown with drop cap on the first paragraph', () => {
    const rendered = renderMarkdown('这是第一段文章内容。\n\n这是第二段内容。')
    expect(rendered).toContain('<p class="drop-lead"><span class="drop-cap">这</span>是第一段文章内容。</p>')
    expect(rendered).toContain('<p>这是第二段内容。</p>')
  })

  it('transforms [!quote] blockquote into pull-quote aside', () => {
    const rendered = renderMarkdown('> [!quote] 这是一个重要金句\n\n> 这是一个普通引用')
    expect(rendered).toContain('<aside class="pull-quote">')
    expect(rendered).toContain('这是一个重要金句')
    expect(rendered).toContain('<blockquote>')
    expect(rendered).toContain('这是一个普通引用')
  })

  it('adds target="_blank" and rel to external links while keeping relative links intact', () => {
    const rendered = renderMarkdown('[外部链接](https://example.com) 和 [内部链接](/posts)')
    expect(rendered).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">外部链接</a>')
    expect(rendered).toContain('<a href="/posts">内部链接</a>')
  })

  it('estimates reading minutes based on content length', () => {
    const shortText = '简短内容'
    expect(estimateReadingMinutes(shortText)).toBe(1)

    const longText = '文字'.repeat(350)
    expect(estimateReadingMinutes(longText)).toBe(2)
  })
})
