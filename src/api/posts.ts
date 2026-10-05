/**
 * SakiBlog 公开文章 API 客户端。
 *
 * 字段名保持与后端 JSON 一致(snake_case),不做转换层。
 * 后端地址可用 VITE_API_BASE_URL 覆盖,默认本地开发地址。
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

export interface PostDetail extends PostSummary {
  content: string
  updated_at: string
}

export interface PostList {
  items: PostSummary[]
  total: number
  page: number
  page_size: number
}

/** 后端返回非 2xx 时抛出;status 可用于区分 404 与其他错误。 */
export class ApiError extends Error {
  status: number

  constructor(status: number) {
    super(`API request failed with status ${status}`)
    this.status = status
  }
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

async function request<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`)
  } catch {
    throw new Error('网络错误,无法连接服务器')
  }
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  return (await response.json()) as T
}

export function fetchPosts(page = 1, pageSize = 10): Promise<PostList> {
  return request<PostList>(`/api/posts?page=${page}&page_size=${pageSize}`)
}

export function fetchPost(id: number | string): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${id}`)
}
