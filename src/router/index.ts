import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Route table for the public site.
 *
 * Paths mirror the navigation required by SRS FR-NAV-001:
 * home / posts / categories / tags / about.
 *
 * The last entry is a catch-all that renders the not-found view
 * (SRS FR-STATE-004).
 *
 * Every view is loaded lazily so the initial bundle only contains the
 * home page.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/posts',
      name: 'posts',
      component: () => import('@/views/PostsView.vue'),
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: () => import('@/views/PostDetailView.vue'),
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('@/views/CategoriesView.vue'),
    },
    {
      path: '/categories/:id',
      name: 'category-posts',
      component: () => import('@/views/CategoryArticlesView.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('@/views/TagsView.vue'),
    },
    {
      path: '/tags/:id',
      name: 'tag-posts',
      component: () => import('@/views/TagArticlesView.vue'),
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLoginView.vue'),
    },
    {
      path: '/admin',
      redirect: { name: 'admin-posts' },
    },
    {
      path: '/admin/posts',
      name: 'admin-posts',
      component: () => import('@/views/admin/AdminPostsView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/posts/new',
      name: 'admin-post-new',
      component: () => import('@/views/admin/AdminPostEditView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/posts/:id/edit',
      name: 'admin-post-edit',
      component: () => import('@/views/admin/AdminPostEditView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: () => import('@/views/admin/AdminTaxonomyView.vue'),
      props: { kind: 'category' as const },
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/tags',
      name: 'admin-tags',
      component: () => import('@/views/admin/AdminTaxonomyView.vue'),
      props: { kind: 'tag' as const },
      meta: { requiresAdmin: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  // 前进到新页面回到顶部;后退/前进时恢复浏览器记住的滚动位置(FR-LIST-006)
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

// 管理端路由守卫:未登录或会话失效时引导到登录页(FR-AUTH-003/005)
router.beforeEach(async (to) => {
  if (to.meta.requiresAdmin !== true) return true
  const auth = useAuthStore()
  if (!auth.checked) await auth.restore()
  if (auth.username === null) {
    return { name: 'admin-login', query: to.fullPath ? { redirect: to.fullPath } : {} }
  }
  return true
})

// ---------- 路由过渡编排(项目定位:前端设计展示) ----------
// - 进入文章详情:共享元素形变(卡片标题飞成详情页标题,View Transitions API)
// - 其余导航:新视图从右向左擦入(纸飞机的航线飞行由 PlaneSprite 完成)
// 不支持 VT 或 prefers-reduced-motion 时全部退化为普通导航。

type VTDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    ready: Promise<void>
    finished: Promise<void>
  }
}

function supportsViewTransition(): boolean {
  if (typeof document === 'undefined') return false
  const doc = document as VTDocument
  if (typeof doc.startViewTransition !== 'function') return false
  return !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
}

const originalPush = router.push.bind(router)
let vtBusy = false

router.push = async function pushWithTransition(to) {
  const doc = document as VTDocument
  if (vtBusy || !supportsViewTransition()) {
    return originalPush(to)
  }
  const target = router.resolve(to)
  const from = router.currentRoute.value
  // 同页重复导航直接走原逻辑
  if (target.path === from.path && target.query && JSON.stringify(target.query) === JSON.stringify(from.query)) {
    return originalPush(to)
  }

  // 共享元素形变:新旧页面都渲染 `post-title-{id}`,浏览器自动完成飞入/飞出
  if (/^\/posts\/\d+$/.test(target.path)) {
    await doc.startViewTransition(async () => {
      await originalPush(to)
      await nextTick()
    }).finished.catch(() => {})
    return
  }

  // 其余导航:擦入过渡
  vtBusy = true
  const transition = doc.startViewTransition(async () => {
    await originalPush(to)
    await nextTick()
  })
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'] },
        { duration: 450, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})
  await transition.finished.catch(() => {})
  vtBusy = false
} as typeof router.push

export default router
