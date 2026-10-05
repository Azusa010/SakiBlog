/**
 * 管理端 API 客户端(NFR-SEC-006:所有变更操作走 /api/admin,由后端会话保护)。
 * 会话凭据是签名 Cookie,同源请求自动携带。
 */
import { ApiError } from './posts'
import type { CategoryBrief, TagBrief } from './posts'

export type PublishStatus = 'draft' | 'published' | 'withdrawn'

export interface AdminPostSummary {
  id: number
  title: string
  summary: string
  status: PublishStatus
  version: number
  created_at: string
  updated_at: string
  published_at: string | null
  category: CategoryBrief | null
  tags: TagBrief[]
}

export interface AdminPostDetail extends AdminPostSummary {
  content: string
}

export interface AdminPostPayload {
  title: string
  summary: string
  content: string
  category_id: number | null
  tag_ids: number[]
  version?: number
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new Error('网络错误,无法连接服务器')
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const detail = (body as { detail?: unknown } | null)?.detail
    throw new ApiError(response.status, detail)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

// ---------- 会话(FR-AUTH) ----------

export function login(username: string, password: string): Promise<{ username: string }> {
  return request('/api/admin/login', { method: 'POST', body: { username, password } })
}

export function fetchMe(): Promise<{ username: string }> {
  return request('/api/admin/me')
}

export function logout(): Promise<{ status: string }> {
  return request('/api/admin/logout', { method: 'POST' })
}

// ---------- 文章管理 ----------

export function fetchAdminPosts(status?: PublishStatus): Promise<AdminPostSummary[]> {
  const query = status ? `?status=${status}` : ''
  return request(`/api/admin/posts${query}`)
}

export function fetchAdminPost(id: number | string): Promise<AdminPostDetail> {
  return request(`/api/admin/posts/${id}`)
}

export function createAdminPost(payload: AdminPostPayload): Promise<AdminPostDetail> {
  return request('/api/admin/posts', { method: 'POST', body: payload })
}

export function updateAdminPost(id: number | string, payload: AdminPostPayload): Promise<AdminPostDetail> {
  return request(`/api/admin/posts/${id}`, { method: 'PUT', body: payload })
}

export function publishAdminPost(id: number): Promise<AdminPostDetail> {
  return request(`/api/admin/posts/${id}/publish`, { method: 'POST' })
}

export function withdrawAdminPost(id: number): Promise<AdminPostDetail> {
  return request(`/api/admin/posts/${id}/withdraw`, { method: 'POST' })
}

export function deleteAdminPost(id: number): Promise<void> {
  return request(`/api/admin/posts/${id}`, { method: 'DELETE' })
}

// ---------- 分类/标签管理 ----------

export function fetchAdminCategories(): Promise<(CategoryBrief & { article_count: number })[]> {
  return request('/api/admin/categories')
}

export function createCategory(name: string): Promise<CategoryBrief> {
  return request('/api/admin/categories', { method: 'POST', body: { name } })
}

export function renameCategory(id: number, name: string): Promise<CategoryBrief> {
  return request(`/api/admin/categories/${id}`, { method: 'PUT', body: { name } })
}

export function deleteCategory(id: number): Promise<void> {
  return request(`/api/admin/categories/${id}`, { method: 'DELETE' })
}

export function fetchAdminTags(): Promise<(TagBrief & { article_count: number })[]> {
  return request('/api/admin/tags')
}

export function createTag(name: string): Promise<TagBrief> {
  return request('/api/admin/tags', { method: 'POST', body: { name } })
}

export function renameTag(id: number, name: string): Promise<TagBrief> {
  return request(`/api/admin/tags/${id}`, { method: 'PUT', body: { name } })
}

export function deleteTag(id: number): Promise<void> {
  return request(`/api/admin/tags/${id}`, { method: 'DELETE' })
}
