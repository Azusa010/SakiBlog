"""分类 / 标签 / 搜索等发现类接口测试(SRS FR-CATEGORY / FR-TAG / FR-SEARCH)。"""

from urllib.parse import quote


def test_categories_exclude_empty_and_count_published(client, seed):
    resp = client.get("/api/categories")
    assert resp.status_code == 200
    categories = resp.json()
    # 只有「技术」有已发布文章;空分类「生活」不出现
    assert [(c["name"], c["article_count"]) for c in categories] == [("技术", 1)]


def test_tags_counts_only_published(client, seed):
    resp = client.get("/api/tags")
    assert resp.status_code == 200
    tags = {t["name"]: t["article_count"] for t in resp.json()}
    assert tags == {"fastapi": 1, "vue": 1}


def test_category_detail_and_404(client, seed):
    resp = client.get(f"/api/categories/{seed['category_id']}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "技术"

    missing = client.get("/api/categories/99999")
    assert missing.status_code == 404


def test_tag_detail_and_404(client, seed):
    resp = client.get(f"/api/tags/{seed['tag_ids'][0]}")
    assert resp.status_code == 200
    assert resp.json() == {"id": seed["tag_ids"][0], "name": "fastapi", "article_count": 1}

    assert client.get("/api/tags/99999").status_code == 404


def test_posts_filter_by_category(client, seed):
    resp = client.get("/api/posts", params={"category_id": seed["category_id"]})
    body = resp.json()
    assert body["total"] == 1
    assert [item["id"] for item in body["items"]] == [seed["published"][0]]


def test_posts_filter_by_tag(client, seed):
    resp = client.get("/api/posts", params={"tag_id": seed["tag_ids"][1]})
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == seed["published"][0]


def test_search_matches_title_summary_category_and_tag(client, seed):
    # (关键词, 预期总数, 预期第一篇 id) — 种子文章摘要均含「摘要」,标题/分类/标签各命中一篇
    cases = [
        ("第二篇", 1, seed["published"][1]),  # 标题匹配
        ("摘要", 3, None),  # 摘要匹配
        ("技术", 1, seed["published"][0]),  # 分类名匹配
        ("vue", 1, seed["published"][0]),  # 标签名匹配
    ]
    for keyword, expected_total, first_id in cases:
        resp = client.get(f"/api/search?q={quote(keyword)}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == expected_total, f"关键词 {keyword} 应命中 {expected_total} 篇"
        assert body["query"] == keyword
        if first_id is not None:
            assert body["items"][0]["id"] == first_id


def test_search_hides_draft_and_withdrawn(client, seed):
    for keyword in ("草稿", "撤回"):
        resp = client.get(f"/api/search?q={quote(keyword)}")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0


def test_search_trims_whitespace_and_rejects_empty(client, seed):
    resp = client.get("/api/search?q=%20%20你好%20")
    assert resp.status_code == 200
    assert resp.json()["query"] == "你好"

    assert client.get("/api/search?q=%20%20").status_code == 422
    assert client.get("/api/search").status_code == 422
