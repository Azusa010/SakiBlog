import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchPost, fetchPosts } from './posts'

describe('posts api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetchPosts builds the query string and parses the response', async () => {
    const payload = { items: [], total: 0, page: 1, page_size: 10 }
    const fetchMock = vi.fn<(input: string) => Promise<Response>>()
    fetchMock.mockResolvedValue(new Response(JSON.stringify(payload)))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPosts(2, 20)).resolves.toEqual(payload)
    expect(fetchMock).toHaveBeenCalledWith('/api/posts?page=2&page_size=20')
  })

  it('wraps network failures in a readable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')))

    await expect(fetchPosts()).rejects.toThrow('无法连接服务器')
  })

  it('throws ApiError carrying the HTTP status for non-2xx responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })))

    const error = await fetchPost(999).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
  })
})
