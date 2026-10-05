import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { fetchPost, type PostDetail } from '@/api/posts'
import PostDetailView from './PostDetailView.vue'

vi.mock('@/api/posts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/posts')>()
  return {
    ...actual,
    fetchPost: vi.fn<() => Promise<PostDetail>>(),
  }
})

const sample: PostDetail = {
  id: 2,
  title: '中间那篇',
  summary: '摘要',
  cover_image: null,
  reading_minutes: null,
  published_at: '2026-03-01T10:00:00',
  updated_at: '2026-03-01T10:00:00',
  category: null,
  tags: [],
  content: '## 第一节\n\n正文\n\n### 小节\n\n更多正文',
  prev: { id: 1, title: '最早那篇' },
  next: { id: 3, title: '最新那篇' },
}

async function mountView(): Promise<ReturnType<typeof mount>> {
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/posts', name: 'posts', component: { template: '<div />' } },
      { path: '/posts/:id', component: PostDetailView },
    ],
  })
  router.push('/posts/2')
  await router.isReady()
  return mount(PostDetailView, { global: { plugins: [router] } })
}

describe('PostDetailView', () => {
  beforeEach(() => {
    vi.mocked(fetchPost).mockReset()
  })

  it('renders markdown headings into a clickable table of contents', async () => {
    vi.mocked(fetchPost).mockResolvedValue(sample)
    const wrapper = await mountView()
    await flushPromises()

    const toc = wrapper.find('nav[aria-label="文章目录"]')
    expect(toc.exists()).toBe(true)
    expect(toc.text()).toContain('第一节')
    expect(toc.text()).toContain('小节')
    expect(wrapper.find('#heading-0').exists()).toBe(true)
    expect(wrapper.find('#heading-1').exists()).toBe(true)
  })

  it('hides the toc for posts without h2+ headings', async () => {
    vi.mocked(fetchPost).mockResolvedValue({ ...sample, content: '只有段落' })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('nav[aria-label="文章目录"]').exists()).toBe(false)
  })

  it('renders neighbor links only when they exist', async () => {
    vi.mocked(fetchPost).mockResolvedValue(sample)
    const wrapper = await mountView()
    await flushPromises()

    const nav = wrapper.find('nav[aria-label="上下篇"]')
    expect(nav.text()).toContain('最早那篇')
    expect(nav.text()).toContain('最新那篇')

    vi.mocked(fetchPost).mockResolvedValue({ ...sample, prev: null, next: null })
    const solo = await mountView()
    await flushPromises()
    expect(solo.find('nav[aria-label="上下篇"]').exists()).toBe(false)
  })
})
