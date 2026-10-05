/**
 * Markdown 渲染:文章详情页与管理端预览共用同一套配置。
 * html:false 让正文中的原始 HTML 被转义输出,是 NFR-SEC-001/007 的安全基线。
 */
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false, linkify: true })

// 外部链接新窗口打开并剥离 opener(FR-ARTICLE-004 / NFR-SEC-002)
const defaultLinkOpen = md.renderer.rules.link_open
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const href = String(token?.attrGet('href') ?? '')
  if (token && /^https?:\/\//i.test(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

export function renderMarkdown(source: string): string {
  return md.render(source)
}
