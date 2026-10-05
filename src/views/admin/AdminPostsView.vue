<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  deleteAdminPost,
  fetchAdminPosts,
  publishAdminPost,
  withdrawAdminPost,
  type AdminPostSummary,
  type PublishStatus,
} from '@/api/admin'
import AdminNavBar from '@/components/AdminNavBar.vue'

/**
 * 管理文章列表(FR-ADMIN-ARTICLE-001/006/007/008/009):
 * 展示全部状态文章、按状态筛选,并提供发布/撤回/删除操作与结果反馈。
 */
const STATUS_TABS: { value: PublishStatus | undefined; label: string }[] = [
  { value: undefined, label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'withdrawn', label: '已撤回' },
]

const STATUS_LABELS: Record<PublishStatus, string> = {
  draft: '草稿',
  published: '已发布',
  withdrawn: '已撤回',
}

const route = useRoute()
const router = useRouter()

const posts = ref<AdminPostSummary[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')
const actionError = ref('')

const activeStatus = computed<PublishStatus | undefined>(() => {
  const raw = route.query.status
  return raw === 'draft' || raw === 'published' || raw === 'withdrawn' ? raw : undefined
})

async function load() {
  status.value = 'loading'
  try {
    posts.value = await fetchAdminPosts(activeStatus.value)
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

watch(activeStatus, load, { immediate: true })

function switchTab(value: PublishStatus | undefined) {
  router.push({ query: value ? { status: value } : {} })
}

async function act(post: AdminPostSummary, action: 'publish' | 'withdraw' | 'delete') {
  actionError.value = ''
  try {
    if (action === 'publish') {
      await publishAdminPost(post.id)
    } else if (action === 'withdraw') {
      await withdrawAdminPost(post.id)
    } else if (confirm(`确定删除「${post.title}」?此操作不可恢复。`)) {
      await deleteAdminPost(post.id)
    } else {
      return
    }
    await load()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '操作失败,请重试'
  }
}
</script>

<template>
  <section>
    <AdminNavBar />
    <div class="head">
      <h1>文章管理</h1>
      <RouterLink class="new" to="/admin/posts/new">+ 新建文章</RouterLink>
    </div>

    <nav class="tabs" aria-label="状态筛选">
      <button
        v-for="tab in STATUS_TABS"
        :key="tab.label"
        type="button"
        :class="{ active: activeStatus === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <p v-if="status === 'loading'">加载中…</p>

    <div v-else-if="status === 'error'" class="state-box">
      <p>文章加载失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <p v-else-if="posts.length === 0" class="state-box">暂无文章。</p>

    <template v-else>
      <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>
      <ul class="post-list">
        <li v-for="post in posts" :key="post.id">
          <div class="info">
            <RouterLink :to="`/admin/posts/${post.id}/edit`" class="title">{{ post.title }}</RouterLink>
            <span class="meta">
              <span class="badge" :data-status="post.status">{{ STATUS_LABELS[post.status] }}</span>
              更新于 {{ post.updated_at.slice(0, 10) }}
              <template v-if="post.category"> · {{ post.category.name }}</template>
            </span>
          </div>
          <div class="actions">
            <button
              v-if="post.status !== 'published'"
              type="button"
              @click="act(post, 'publish')"
            >
              发布
            </button>
            <button
              v-if="post.status === 'published'"
              type="button"
              @click="act(post, 'withdraw')"
            >
              撤回
            </button>
            <button type="button" class="danger" @click="act(post, 'delete')">删除</button>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.new {
  text-decoration: none;
}

.tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.tabs button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.tabs button.active {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.post-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.post-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.title {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
}

.title:hover {
  color: var(--color-accent);
}

.meta {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.badge {
  display: inline-block;
  margin-right: var(--space-2);
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.75rem;
}

.badge[data-status='published'] {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.actions button,
.state-box button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.actions button:hover {
  border-color: var(--color-accent);
}

.actions .danger:hover {
  border-color: #c0392b;
  color: #c0392b;
}

.state-box {
  color: var(--color-text-muted);
}

.error {
  color: #c0392b;
  font-size: 0.875rem;
}
</style>
