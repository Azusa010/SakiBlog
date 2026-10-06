/**
 * Markdown 渲染:文章详情页与管理端预览共用同一套配置。
 * html:false 让正文中的原始 HTML 被转义输出,是 NFR-SEC-001/007 的安全基线。
 * art direction:管理端用段落标记金句(> [!quote] 或单独一段以「」开头),
 * 前台渲染为拉引;首段自动首字下沉。
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

// 金句拉引:blockquote 首行以 [!quote] 标记 → <aside class="pull-quote">
const defaultBlockquoteOpen = md.renderer.rules.blockquote_open
md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
  const current = tokens[idx]
  const inlineToken = tokens[idx + 2]
  if (current && inlineToken && inlineToken.type === 'inline' && /^\[!quote\]\s*/i.test(inlineToken.content)) {
    inlineToken.content = inlineToken.content.replace(/^\[!quote\]\s*/i, '')
    const firstChild = inlineToken.children?.[0]
    if (firstChild) {
      firstChild.content = firstChild.content.replace(/^\[!quote\]\s*/i, '')
    }
    current.tag = 'aside'
    current.attrSet('class', 'pull-quote')
    let depth = 1
    for (let i = idx + 1; i < tokens.length; i++) {
      const tok = tokens[i]
      if (!tok) continue
      if (tok.type === 'blockquote_open') depth++
      if (tok.type === 'blockquote_close') {
        depth--
        if (depth === 0) {
          tok.tag = 'aside'
          break
        }
      }
    }
  }
  return defaultBlockquoteOpen
    ? defaultBlockquoteOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

export function renderMarkdown(source: string): string {
  const html = md.render(source)
  // 首段首字下沉:首字包裹 drop-cap
  return html.replace(/^<p>([\u4e00-\u9fa5A-Za-z])/u, (_match, first: string) => {
    return `<p class="drop-lead"><span class="drop-cap">${first}</span>`
  })
}

export function estimateReadingMinutes(content: string): number {
  // 中文约 350 字/分钟;剔除 markdown 语法字符
  const words = content.replace(/[#>*`\-[\]()!]/g, '').trim().length
  return Math.max(1, Math.round(words / 350))
}

