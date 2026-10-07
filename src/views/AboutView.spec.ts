import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AboutView from './AboutView.vue'

describe('AboutView (Personal Profile & Identity)', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/about', component: AboutView },
        { path: '/projects', component: { template: '<div>Projects</div>' } },
        { path: '/posts', component: { template: '<div>Posts</div>' } },
      ],
    })
  })

  it('renders personal identity, skill groups, and timeline', () => {
    const wrapper = mount(AboutView, {
      global: {
        plugins: [router],
        directives: {
          reveal: () => {},
          spotlight: () => {},
        },
      },
    })

    expect(wrapper.text()).toContain('关于与工坊')
    expect(wrapper.text()).toContain('关于我 · Saki')
    expect(wrapper.text()).toContain('技术栈与设计底盘')
    expect(wrapper.text()).toContain('历程与航迹')
    expect(wrapper.text()).toContain('交流与交谈')
    expect(wrapper.text()).toContain('Full-Stack Software Engineer')
  })
})
