import { createRouter, createWebHistory } from 'vue-router'

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
      path: '/categories',
      name: 'categories',
      component: () => import('@/views/CategoriesView.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('@/views/TagsView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
