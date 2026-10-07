import re

with open('src/views/admin/AdminPostEditView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

new_script = '''<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
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

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker()
  }
}

/**
 * 文章新建/编辑页(FR-ADMIN-ARTICLE-002/003/004/005/010):
 * Monaco Editor Markdown 编辑与实时预览;编辑时携带版本号,后端检测并发冲突返回 409。
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
const showPreview = ref(true)

const monacoContainer = ref<HTMLElement | null>(null)
const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

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
    
    if (editorInstance.value) {
      if (editorInstance.value.getValue() !== form.content) {
        editorInstance.value.setValue(form.content)
      }
    }
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
      history.replaceState(null, '', /admin/posts/\/edit)
      message.value = '已保存为草稿,完善后可发布'
      await load()
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '保存失败,请重试'
  } finally {
    saving.value = false
  }
}

// 注册 Markdown 语法片段提示 (Snippets)
monaco.languages.registerCompletionItemProvider('markdown', {
  provideCompletionItems: (model, position) => {
    const suggestions: monaco.languages.CompletionItem[] = [
      {
        label: 'h2',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '## \',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Heading 2'
      },
      {
        label: 'h3',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '### \',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Heading 3'
      },
      {
        label: 'bold',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '**\**',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Bold Text'
      },
      {
        label: 'italic',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '*\*',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Italic Text'
      },
      {
        label: 'link',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '[\](\)',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Hyperlink'
      },
      {
        label: 'image',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '![\](\)',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Image'
      },
      {
        label: 'codeblock',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '`\\\n\\\n`',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Code Block'
      },
      {
        label: 'quote',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '> \',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Blockquote'
      }
    ]
    return { suggestions }
  }
})

onMounted(() => {
  if (monacoContainer.value) {
    editorInstance.value = monaco.editor.create(monacoContainer.value, {
      value: form.content,
      language: 'markdown',
      theme: 'vs-dark',
      wordWrap: 'on',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: 'var(--font-mono, monospace)',
      lineHeight: 1.6,
      padding: { top: 16, bottom: 16 },
      scrollBeyondLastLine: false,
      quickSuggestions: { other: true, comments: true, strings: true },
      suggestOnTriggerCharacters: true,
      snippetSuggestions: 'inline',
    })

    editorInstance.value.onDidChangeModelContent(() => {
      const val = editorInstance.value?.getValue() || ''
      if (form.content !== val) {
        form.content = val
      }
    })
  }
})

watch(() => form.content, (newVal) => {
  if (editorInstance.value && editorInstance.value.getValue() !== newVal) {
    editorInstance.value.setValue(newVal)
  }
})

onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.dispose()
  }
})
</script>'''

content = re.sub(r'<script setup lang="ts">.*?</script>', new_script, content, flags=re.DOTALL)

with open('src/views/admin/AdminPostEditView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print("Script replaced")
