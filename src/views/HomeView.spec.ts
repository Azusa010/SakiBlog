import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { fetchPosts, type PostList } from '@/api/posts'
import HomeView from './HomeView.vue'

vi.mock('@/api/posts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/posts')>()
  return {
    ...actual,
    fetchPosts: vi.fn<() => Promise<PostList>>(),
  }
})

describe('HomeView (Personal Portfolio & Engineering Hub)', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomeView },
        { path: '/projects', component: { template: '<div>Projects</div>' } },
        { path: '/posts', component: { template: '<div>Posts</div>' } },
        { path: '/posts/:id', component: { template: '<div>Post Detail</div>' } },
        { path: '/about', component: { template: '<div>About</div>' } },
      ],
    })
  })

  it('renders personal identity hero, dual CTAs, and featured projects', async () => {
    vi.mocked(fetchPosts).mockResolvedValue({
      items: [
        {
          id: 1,
          title: '精选文章标题',
          summary: '精选文章摘要',
          cover_image: null,
          reading_minutes: 4,
          published_at: '2026-03-01T10:00:00',
          category: { id: 1, name: '全栈' },
          tags: [],
        },
      ],
      total: 1,
      page: 1,
      page_size: 5,
    })

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        directives: {
          reveal: () => {},
          spotlight: () => {},
        },
        stubs: {
          ParticleMountain: true,
        },
      },
    })

    await flushPromises()

    // 个人身份与标语
    expect(wrapper.text()).toContain('在文字与代码中')
    expect(wrapper.text()).toContain('遇见更大的世界')
    expect(wrapper.text()).toContain('Full-Stack')

    // 核心 CTA 链接
    const ctaProjects = wrapper.find('a.cta-primary')
    expect(ctaProjects.exists()).toBe(true)
    expect(ctaProjects.text()).toContain('探索作品集')

    // 精选作品集板块
    expect(wrapper.text()).toContain('精选作品集')
    expect(wrapper.text()).toContain('SakiBlog & Zen Terminal')

    // 最新文章板块
    expect(wrapper.text()).toContain('最新卷轴')
    expect(wrapper.text()).toContain('精选文章标题')

    // 工坊底盘与信条板块
    expect(wrapper.text()).toContain('工坊底盘与信条')
    expect(wrapper.text()).toContain('全栈工程化闭环')
  })

  it('does not render embedded terminal in hero section', async () => {
    vi.mocked(fetchPosts).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 5,
    })

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        directives: {
          reveal: () => {},
          spotlight: () => {},
        },
        stubs: {
          ParticleMountain: true,
        },
      },
    })
    await flushPromises()

    // 确保 Hero 区域中嵌入的终端视窗已被完全移除
    expect(wrapper.find('.zen-terminal-window').exists()).toBe(false)
  })

  it('opens modal CLI on double click in hero section', async () => {
    vi.mocked(fetchPosts).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 5,
    })

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        directives: {
          reveal: () => {},
          spotlight: () => {},
        },
        stubs: {
          ParticleMountain: true,
        },
      },
    })
    await flushPromises()

    const { useTerminalStore } = await import('@/stores/terminal')
    const terminal = useTerminalStore()
    terminal.close()
    expect(terminal.isOpen).toBe(false)

    // 在 Hero 区域双击
    await wrapper.find('section.hero').trigger('dblclick')
    expect(terminal.isOpen).toBe(true)
  })

  it('opens modal CLI when clicking Hero terminal CTA button or hint', async () => {
    vi.mocked(fetchPosts).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 5,
    })

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        directives: {
          reveal: () => {},
          spotlight: () => {},
        },
        stubs: {
          ParticleMountain: true,
        },
      },
    })
    await flushPromises()

    const { useTerminalStore } = await import('@/stores/terminal')
    const terminal = useTerminalStore()
    terminal.close()
    expect(terminal.isOpen).toBe(false)

    // 点击 Hero 交互控制台按钮
    const btn = wrapper.find('button.cta-terminal')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(terminal.isOpen).toBe(true)

    terminal.close()
    expect(terminal.isOpen).toBe(false)

    // 点击 Hero 提示条
    const hint = wrapper.find('.hero-hint')
    expect(hint.exists()).toBe(true)
    await hint.trigger('click')
    expect(terminal.isOpen).toBe(true)
  })
})
