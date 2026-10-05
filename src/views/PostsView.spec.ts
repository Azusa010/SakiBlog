import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { fetchPosts, type PostList, type PostSummary } from '@/api/posts'
import PostsView from './PostsView.vue'

vi.mock('@/api/posts', () => ({
  fetchPosts: vi.fn<() => Promise<PostList>>(),
}))

const samplePost: PostSummary = {
  id: 1,
  title: '第一篇文章',
  summary: '这是摘要',
  cover_image: null,
  reading_minutes: 5,
  published_at: '2026-03-01T10:00:00',
  category: { id: 1, name: '技术' },
  tags: [{ id: 1, name: 'fastapi' }],
}

function makePayload(overrides: Partial<PostList> = {}): PostList {
  return { items: [samplePost], total: 1, page: 1, page_size: 10, ...overrides }
}

async function mountView(): Promise<ReturnType<typeof mount>> {
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/posts', component: PostsView },
      { path: '/posts/:id', component: { template: '<div />' } },
    ],
  })
  router.push('/posts')
  await router.isReady()
  return mount(PostsView, { global: { plugins: [router] } })
}

describe('PostsView', () => {
  beforeEach(() => {
    vi.mocked(fetchPosts).mockReset()
  })

  it('renders loaded posts with date, category and tags', async () => {
    vi.mocked(fetchPosts).mockResolvedValue(makePayload())
    const wrapper = await mountView()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('第一篇文章')
    expect(text).toContain('2026-03-01')
    expect(text).toContain('技术')
    expect(text).toContain('fastapi')
    expect(fetchPosts).toHaveBeenCalledWith(1, 10)
  })

  it('shows the empty state when no posts exist', async () => {
    vi.mocked(fetchPosts).mockResolvedValue(makePayload({ items: [], total: 0 }))
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('还没有已发布的文章')
  })

  it('shows an error state and reloads on retry', async () => {
    vi.mocked(fetchPosts).mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('文章加载失败')

    vi.mocked(fetchPosts).mockResolvedValueOnce(makePayload())
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('第一篇文章')
  })
})
