<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  createAdminPost,
  fetchAdminCategories,
  fetchAdminPost,
  fetchAdminTags,
  updateAdminPost,
} from '@/api/admin'
import { ApiError, type CategoryBrief, type TagBrief } from '@/api/posts'
import AdminNavBar from '@/components/AdminNavBar.vue'
import { renderMarkdown } from '@/markdown'

/**
 * 文章新建/编辑页(FR-ADMIN-ARTICLE-002/003/004/005/010):
 * Markdown 编辑与实时预览;编辑时携带版本号,后端检测并发冲突返回 409。
 */
const route = useRoute()

const postId = computed(() => (route.params.id ? String(route.params.id) : null))
const isEdit = computed(() => postId.value !== null)

const form = reactive({
  title: '',
  summary: '',
  content: '',
  category_id: null as number | null,
  tag_ids: [] as number[],
  version: 0,
})

const categories = ref<CategoryBrief[]>([])
const tags = ref<TagBrief[]>([])
const status = ref<'loading' | 'ready' | 'error' | 'not-found'>('loading')
const saving = ref(false)
const message = ref('')
const errorMessage = ref('')
const showPreview = ref(false)

async function load() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    const [categoryList, tagList] = await Promise.all([fetchAdminCategories(), fetchAdminTags()])
    categories.value = categoryList
    tags.value = tagList

    if (postId.value) {
      const post = await fetchAdminPost(postId.value)
      form.title = post.title
      form.summary = post.summary
      form.content = post.content
      form.category_id = post.category?.id ?? null
      form.tag_ids = post.tags.map((tag) => tag.id)
      form.version = post.version
    } else {
      form.title = ''
      form.summary = ''
      form.content = ''
      form.category_id = null
      form.tag_ids = []
      form.version = 0
    }
    status.value = 'ready'
  } catch (error) {
    status.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'error'
  }
}

watch(postId, load, { immediate: true })

const previewHtml = computed(() => renderMarkdown(form.content))

function toggleTag(id: number, checked: boolean) {
  form.tag_ids = checked
    ? [...form.tag_ids, id]
    : form.tag_ids.filter((existing) => existing !== id)
}

async function save() {
  if (saving.value) return
  saving.value = true
  message.value = ''
  errorMessage.value = ''
  try {
    if (postId.value) {
      const saved = await updateAdminPost(postId.value, { ...form, version: form.version })
      form.version = saved.version
      message.value = '已保存'
    } else {
      const created = await createAdminPost({ ...form })
      // 转到编辑页继续完善,再发布
      history.replaceState(null, '', `/admin/posts/${created.id}/edit`)
      message.value = '已保存为草稿,完善后可发布'
      await load()
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '保存失败,请重试'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <AdminNavBar />

    <p v-if="status === 'loading'">加载中…</p>

    <div v-else-if="status === 'not-found'" class="state-box">
      <p>文章不存在。</p>
      <p><RouterLink to="/admin/posts">返回文章管理</RouterLink></p>
    </div>

    <div v-else-if="status === 'error'" class="state-box">
      <p>加载失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <template v-else>
      <div class="head">
        <h1>{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
        <RouterLink to="/admin/posts">返回列表</RouterLink>
      </div>

      <form class="editor" @submit.prevent="save">
        <label>
          标题
          <input v-model="form.title" type="text" name="title" required maxlength="200" />
        </label>
        <label>
          摘要
          <textarea v-model="form.summary" name="summary" rows="2" required maxlength="500"></textarea>
        </label>

        <div class="row">
          <label>
            分类
            <select v-model="form.category_id" name="category">
              <option :value="null">无分类</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </label>
        </div>

        <fieldset>
          <legend>标签</legend>
          <label v-for="tag in tags" :key="tag.id" class="checkbox">
            <input
              type="checkbox"
              :checked="form.tag_ids.includes(tag.id)"
              @change="toggleTag(tag.id, ($event.target as HTMLInputElement).checked)"
            />
            {{ tag.name }}
          </label>
          <p v-if="tags.length === 0" class="hint">还没有标签,可先到「标签」页创建。</p>
        </fieldset>

        <label>
          正文(Markdown)
          <textarea
            v-model="form.content"
            name="content"
            rows="16"
            class="mono"
            required
          ></textarea>
        </label>

        <div class="toolbar">
          <button type="button" @click="showPreview = !showPreview">
            {{ showPreview ? '收起预览' : '预览' }}
          </button>
          <button type="submit" :disabled="saving">
            {{ saving ? '保存中…' : '保存' }}
          </button>
          <span v-if="message" class="ok" role="status">{{ message }}</span>
          <span v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</span>
        </div>
      </form>

      <article v-if="showPreview" class="preview" aria-label="预览">
        <h2>预览</h2>
        <!-- renderMarkdown 输出已转义原始 HTML,这里安全 -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="previewHtml"></div>
      </article>
    </template>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.editor label {
  display: block;
  margin-bottom: var(--space-4);
  color: var(--color-text-muted);
}

.editor input[type='text'],
.editor textarea,
.editor select {
  display: block;
  width: 100%;
  margin-top: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

.editor .mono {
  font-family: var(--font-mono);
}

fieldset {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin: 0 0 var(--space-4);
  color: var(--color-text-muted);
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin: var(--space-1) var(--space-3) var(--space-1) 0;
}

.hint {
  font-size: 0.875rem;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.toolbar button {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.toolbar button:hover:not(:disabled) {
  border-color: var(--color-accent);
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ok {
  color: var(--color-accent);
  font-size: 0.875rem;
}

.error {
  color: #c0392b;
  font-size: 0.875rem;
}

.preview {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.state-box {
  color: var(--color-text-muted);
}

.state-box button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}
</style>
