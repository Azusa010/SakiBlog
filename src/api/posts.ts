/**
 * SakiBlog 公开文章 API 客户端。
 *
 * 字段名保持与后端 JSON 一致(snake_case),不做转换层。
 * 默认走同源(开发期由 Vite 代理 /api 到后端);可用 VITE_API_BASE_URL 覆盖。
 */

export interface CategoryBrief {
  id: number
  name: string
}

export interface TagBrief {
  id: number
  name: string
}

export interface PostSummary {
  id: number
  title: string
  summary: string
  cover_image: string | null
  reading_minutes: number | null
  published_at: string
  category: CategoryBrief | null
  tags: TagBrief[]
}

export interface PostNeighbor {
  id: number
  title: string
}

export interface PostDetail extends PostSummary {
  content: string
  updated_at: string
  /** 上一篇(更早)/下一篇(更新);为 null 时前端不渲染无效链接 */
  prev: PostNeighbor | null
  next: PostNeighbor | null
}

export interface PostList {
  items: PostSummary[]
  total: number
  page: number
  page_size: number
}

/** 后端返回非 2xx 时抛出;status 用于区分 404,message 优先采用后端 detail。 */
export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail?: unknown) {
    super(typeof detail === 'string' ? detail : `API request failed with status ${status}`)
    this.status = status
    this.detail = detail
  }
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`)
  } catch {
    throw new Error('网络错误,无法连接服务器')
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const detail = (body as { detail?: unknown } | null)?.detail
    throw new ApiError(response.status, detail)
  }
  return (await response.json()) as T
}

export function fetchPosts(page = 1, pageSize = 10): Promise<PostList> {
  return request<PostList>(`/api/posts?page=${page}&page_size=${pageSize}`)
}

export function fetchPost(id: number | string): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${id}`)
}

export interface CategoryWithCount {
  id: number
  name: string
  article_count: number
}

export interface TagWithCount {
  id: number
  name: string
  article_count: number
}

export interface SearchResult {
  query: string
  total: number
  items: PostSummary[]
}

export function fetchCategories(): Promise<CategoryWithCount[]> {
  return request<CategoryWithCount[]>('/api/categories')
}

export function fetchCategory(id: number | string): Promise<CategoryWithCount> {
  return request<CategoryWithCount>(`/api/categories/${id}`)
}

export function fetchTags(): Promise<TagWithCount[]> {
  return request<TagWithCount[]>('/api/tags')
}

export function fetchTag(id: number | string): Promise<TagWithCount> {
  return request<TagWithCount>(`/api/tags/${id}`)
}

export function fetchPostsOfCategory(id: number | string, page = 1, pageSize = 50): Promise<PostList> {
  return request<PostList>(`/api/posts?category_id=${id}&page=${page}&page_size=${pageSize}`)
}

export function fetchPostsOfTag(id: number | string, page = 1, pageSize = 50): Promise<PostList> {
  return request<PostList>(`/api/posts?tag_id=${id}&page=${page}&page_size=${pageSize}`)
}

export function fetchSearch(query: string): Promise<SearchResult> {
  return request<SearchResult>(`/api/search?q=${encodeURIComponent(query)}`)
}
