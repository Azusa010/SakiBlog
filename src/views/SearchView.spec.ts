import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { fetchSearch, type SearchResult } from '@/api/posts'
import SearchView from './SearchView.vue'

vi.mock('@/api/posts', () => ({
  fetchSearch: vi.fn<() => Promise<SearchResult>>(),
}))

function makePayload(overrides: Partial<SearchResult> = {}): SearchResult {
  return { query: '关键词', total: 0, items: [], ...overrides }
}

async function mountView(query: Record<string, string> = {}): Promise<ReturnType<typeof mount>> {
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/search', component: SearchView },
    ],
  })
  router.push({ path: '/search', query })
  await router.isReady()
  return mount(SearchView, { global: { plugins: [router] } })
}

describe('SearchView', () => {
  beforeEach(() => {
    vi.mocked(fetchSearch).mockReset()
  })

  it('stays idle without issuing a request when the query is blank', async () => {
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('输入关键词')
    expect(fetchSearch).not.toHaveBeenCalled()
  })

  it('renders matched results for the query', async () => {
    vi.mocked(fetchSearch).mockResolvedValue({
      query: 'vue',
      total: 1,
      items: [
        {
          id: 7,
          title: '搜索命中的文章',
          summary: '摘要',
          cover_image: null,
          reading_minutes: null,
          published_at: '2026-04-01T09:00:00',
          category: null,
          tags: [],
        },
      ],
    })
    const wrapper = await mountView({ q: 'vue' })
    await flushPromises()

    expect(wrapper.text()).toContain('「vue」')
    expect(wrapper.text()).toContain('搜索命中的文章')
  })

  it('shows the no-result state with a way back to all posts', async () => {
    vi.mocked(fetchSearch).mockResolvedValue(makePayload({ query: '不存在', total: 0 }))
    const wrapper = await mountView({ q: '不存在' })
    await flushPromises()

    expect(wrapper.text()).toContain('没有找到匹配的文章')
    expect(wrapper.find('a[href="/posts"]').exists()).toBe(true)
  })
})
