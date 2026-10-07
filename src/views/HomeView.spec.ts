import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomeView from './HomeView.vue'

describe('HomeView (Editorial Layout & Blue Melancholy)', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomeView },
        { path: '/posts', component: { template: '<div>Posts</div>' } },
        { path: '/projects', component: { template: '<div>Projects</div>' } },
        { path: '/about', component: { template: '<div>About</div>' } },
      ],
    })
  })

  it('renders editorial typography, volume label, and explore notes link', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        stubs: {
          FullscreenScenicStage: true,
          ParticleMountain: true,
        },
      },
    })

    await flushPromises()

    // Editorial Volume & Heading
    expect(wrapper.text()).toContain('Volume IV — Serenity')
    expect(wrapper.text()).toContain('Into the')
    expect(wrapper.text()).toContain('Blue.')

    // Editorial Description
    expect(wrapper.text()).toContain('Quiet observations on design')

    // Explore Notes CTA
    const exploreLink = wrapper.find('a')
    expect(exploreLink.exists()).toBe(true)
    expect(exploreLink.text()).toContain('Explore Notes')

    // Right Column Image Wrapper & Overlay
    expect(wrapper.find('.gs-hero-img-wrap').exists()).toBe(true)
    expect(wrapper.find('.melancholy-overlay').exists()).toBe(true)
  })

  it('opens modal CLI on double click in home container', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        stubs: {
          FullscreenScenicStage: true,
          ParticleMountain: true,
        },
      },
    })
    await flushPromises()

    const { useTerminalStore } = await import('@/stores/terminal')
    const terminal = useTerminalStore()
    terminal.close()
    expect(terminal.isOpen).toBe(false)

    // 在页面双击触发终端
    await wrapper.find('#home').trigger('dblclick')
    expect(terminal.isOpen).toBe(true)
  })

  it('contains gs-hero-el stagger animation classes and image wrapper', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        stubs: {
          FullscreenScenicStage: true,
          ParticleMountain: true,
        },
      },
    })
    await flushPromises()

    const animatedEls = wrapper.findAll('.gs-hero-el')
    expect(animatedEls.length).toBeGreaterThanOrEqual(4)

    const imgWrap = wrapper.find('.gs-hero-img-wrap')
    expect(imgWrap.exists()).toBe(true)
  })
})
