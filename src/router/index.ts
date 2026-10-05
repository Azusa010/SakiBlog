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
  routes: [
    {
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
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
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

export default router
