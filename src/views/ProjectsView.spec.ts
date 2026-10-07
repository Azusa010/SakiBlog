import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useTerminalStore } from '@/stores/terminal'
import ProjectsView from './ProjectsView.vue'

describe('ProjectsView', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/projects', component: ProjectsView },
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/posts', component: { template: '<div>Posts</div>' } },
      ],
    })
  })

  it('renders page header and default project cards', () => {
    const wrapper = mount(ProjectsView, {
      global: {
        plugins: [router],
        directives: {
          reveal: () => {},
          spotlight: () => {},
        },
      },
    })

    expect(wrapper.text()).toContain('作品集与工坊')
    expect(wrapper.text()).toContain('全部作品')
    expect(wrapper.text()).toContain('SakiBlog & Zen Terminal')
  })

  it('filters projects when a category pill is clicked', async () => {
    const wrapper = mount(ProjectsView, {
      global: {
        plugins: [router],
        directives: {
          reveal: () => {},
          spotlight: () => {},
        },
      },
    })

    const pills = wrapper.findAll('button.filter-pill')
    // pills: [all, fullstack, creative, tool]
    expect(pills.length).toBe(4)

    // Click '先锋交互 & 3D · CREATIVE'
    await pills[2]!.trigger('click')

    expect(wrapper.text()).toContain('Zen CLI Terminal Kit')
    expect(wrapper.text()).toContain('Mountain Dust WebGL Engine')
  })

  it('triggers terminal open when easter egg button is clicked', async () => {
    const terminal = useTerminalStore()
    expect(terminal.isOpen).toBe(false)

    const wrapper = mount(ProjectsView, {
      global: {
        plugins: [router],
        directives: {
          reveal: () => {},
          spotlight: () => {},
        },
      },
    })

    const terminalBtn = wrapper.find('.btn-open-terminal')
    expect(terminalBtn.exists()).toBe(true)
    await terminalBtn.trigger('click')

    expect(terminal.isOpen).toBe(true)
  })
})
