import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  fetchPosts,
  type CategoryWithCount,
  type PostDetail,
  type PostList,
  type SearchResult,
  type TagWithCount,
} from '@/api/posts'
import { useTerminalStore } from '@/stores/terminal'
import ZenTerminalModal from './ZenTerminalModal.vue'

vi.mock('@/api/posts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/posts')>()
  return {
    ...actual,
    fetchPosts: vi.fn<() => Promise<PostList>>(),
    fetchPost: vi.fn<() => Promise<PostDetail>>(),
    fetchSearch: vi.fn<() => Promise<SearchResult>>(),
    fetchTags: vi.fn<() => Promise<TagWithCount[]>>(),
    fetchCategories: vi.fn<() => Promise<CategoryWithCount[]>>(),
  }
})

describe('ZenTerminalModal', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/posts', component: { template: '<div>Posts</div>' } },
        { path: '/posts/:id', component: { template: '<div>Detail</div>' } },
      ],
    })
  })

  it('is hidden when terminal.isOpen is false', () => {
    const wrapper = mount(ZenTerminalModal, {
      global: { plugins: [router] },
    })
    expect(wrapper.find('.terminal-backdrop').exists()).toBe(false)
  })

  it('renders and responds to help command when opened', async () => {
    const terminal = useTerminalStore()
    terminal.open()

    const wrapper = mount(ZenTerminalModal, {
      global: { plugins: [router] },
    })
    expect(wrapper.find('.terminal-backdrop').exists()).toBe(true)

    const input = wrapper.find('input.cli-field')
    await input.setValue('help')
    await wrapper.find('form.cli-input-row').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('AVAILABLE COMMANDS')
    expect(wrapper.text()).toContain('ls / posts')
  })

  it('renders articles when ls command is executed', async () => {
    vi.mocked(fetchPosts).mockResolvedValue({
      items: [
        {
          id: 1,
          title: '测试终端文章',
          summary: '测试摘要',
          cover_image: null,
          reading_minutes: 3,
          published_at: '2026-03-01T10:00:00',
          category: { id: 1, name: '技术' },
          tags: [],
        },
      ],
      total: 1,
      page: 1,
      page_size: 10,
    })

    const terminal = useTerminalStore()
    terminal.open()

    const wrapper = mount(ZenTerminalModal, {
      global: { plugins: [router] },
    })

    const input = wrapper.find('input.cli-field')
    await input.setValue('ls')
    await wrapper.find('form.cli-input-row').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('测试终端文章')
  })

  it('closes on exit command', async () => {
    const terminal = useTerminalStore()
    terminal.open()

    const wrapper = mount(ZenTerminalModal, {
      global: { plugins: [router] },
    })

    const input = wrapper.find('input.cli-field')
    await input.setValue('exit')
    await wrapper.find('form.cli-input-row').trigger('submit')
    await flushPromises()

    expect(terminal.isOpen).toBe(false)
  })

  it('renders Hallmark studied DNA welcome banner and responds to quick capsule click', async () => {
    vi.mocked(fetchPosts).mockResolvedValue({
      items: [
        {
          id: 1,
          title: '胶囊直达测试文章',
          summary: '测试摘要',
          cover_image: null,
          reading_minutes: 3,
          published_at: '2026-03-01T10:00:00',
          category: { id: 1, name: '技术' },
          tags: [],
        },
      ],
      total: 1,
      page: 1,
      page_size: 10,
    })

    const terminal = useTerminalStore()
    terminal.open()

    const wrapper = mount(ZenTerminalModal, {
      global: { plugins: [router] },
    })

    // 检查核心 DNA 标语
    expect(wrapper.text()).toContain('Welcome to the Zen Terminal v1.0.0')
    expect(wrapper.text()).toContain('自然与代码在此交汇')
    expect(wrapper.text()).toContain('Talk is cheap. Show me the code')

    // 检查快捷胶囊行
    const pills = wrapper.findAll('button.capsule')
    expect(pills.length).toBe(4)
    expect(pills[0]!.text()).toBe('projects')
    expect(pills[1]!.text()).toBe('ls')
    expect(pills[2]!.text()).toBe('cat about.md')
    expect(pills[3]!.text()).toBe('clear')

    // 点击 ls 胶囊
    await pills[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('胶囊直达测试文章')
  })

  it('renders projects when projects command is executed', async () => {
    const terminal = useTerminalStore()
    terminal.open()

    const wrapper = mount(ZenTerminalModal, {
      global: { plugins: [router] },
    })

    const input = wrapper.find('input.cli-field')
    await input.setValue('projects')
    await wrapper.find('form.cli-input-row').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('精选作品集')
    expect(wrapper.text()).toContain('SakiBlog & Zen Terminal')
  })
})
