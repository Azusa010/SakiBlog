<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  fetchAdminCategories,
  fetchAdminTags,
  renameCategory,
  renameTag,
} from '@/api/admin'
import AdminNavBar from '@/components/AdminNavBar.vue'

/**
 * 分类/标签管理(FR-ADMIN-CATEGORY-001..004 / FR-ADMIN-TAG-001..004)。
 * 两个页面逻辑一致,用 kind 区分走哪组接口。
 */
const props = defineProps<{
  kind: 'category' | 'tag'
}>()

interface TaxonomyItem {
  id: number
  name: string
  article_count: number
}

const LABELS = {
  category: { title: '分类管理', singular: '分类', create: createCategory, rename: renameCategory, remove: deleteCategory, list: fetchAdminCategories },
  tag: { title: '标签管理', singular: '标签', create: createTag, rename: renameTag, remove: deleteTag, list: fetchAdminTags },
} as const

const api = computed(() => LABELS[props.kind])

const items = ref<TaxonomyItem[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')
const newName = ref('')
const actionError = ref('')
const editingId = ref<number | null>(null)
const editingName = ref('')

async function load() {
  status.value = 'loading'
  try {
    items.value = (await api.value.list()) as TaxonomyItem[]
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)

async function add() {
  const name = newName.value.trim()
  if (!name) return
  actionError.value = ''
  try {
    await api.value.create(name)
    newName.value = ''
    await load()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '创建失败,请重试'
  }
}

function startRename(item: TaxonomyItem) {
  editingId.value = item.id
  editingName.value = item.name
}

async function saveRename() {
  if (editingId.value === null) return
  const name = editingName.value.trim()
  if (!name) return
  actionError.value = ''
  try {
    await api.value.rename(editingId.value, name)
    editingId.value = null
    await load()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '重命名失败,请重试'
  }
}

async function remove(item: TaxonomyItem) {
  actionError.value = ''
  const notice =
    props.kind === 'category'
      ? `确定删除分类「${item.name}」?`
      : `确定删除标签「${item.name}」?文章与它的关联会被移除,文章本身不受影响。`
  if (!confirm(notice)) return
  try {
    await api.value.remove(item.id)
    await load()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '删除失败,请重试'
  }
}
</script>

<template>
  <section>
    <AdminNavBar />
    <h1>{{ api.title }}</h1>

    <p v-if="status === 'loading'">加载中…</p>

    <div v-else-if="status === 'error'" class="state-box">
      <p>加载失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <template v-else>
      <form class="add-form" @submit.prevent="add">
        <input
          v-model="newName"
          type="text"
          :placeholder="`新的${api.singular}名称`"
          :aria-label="`新的${api.singular}名称`"
          maxlength="50"
        />
        <button type="submit">添加</button>
      </form>

      <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>
      <p v-if="items.length === 0" class="state-box">还没有任何{{ api.singular }}。</p>

      <ul class="taxonomy-list">
        <li v-for="item in items" :key="item.id">
          <template v-if="editingId === item.id">
            <input
              v-model="editingName"
              type="text"
              class="rename-input"
              maxlength="50"
              @keyup.enter="saveRename"
            />
            <span class="row-actions">
              <button type="button" @click="saveRename">保存</button>
              <button type="button" @click="editingId = null">取消</button>
            </span>
          </template>
          <template v-else>
            <span class="name">{{ item.name }}</span>
            <span class="row-actions">
              <span class="count">{{ item.article_count }} 篇</span>
              <button type="button" @click="startRename(item)">重命名</button>
              <button type="button" class="danger" @click="remove(item)">删除</button>
            </span>
          </template>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.add-form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.add-form input {
  width: 16rem;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

.add-form button,
.row-actions button,
.state-box button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.add-form button:hover,
.row-actions button:hover,
.state-box button:hover {
  border-color: var(--color-accent);
}

.row-actions .danger:hover,
.danger {
  color: inherit;
}

.row-actions .danger:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.taxonomy-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.taxonomy-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.rename-input {
  flex: 1;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.count {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.state-box {
  color: var(--color-text-muted);
}

.error {
  color: var(--color-danger);
  font-size: 0.875rem;
}
</style>
