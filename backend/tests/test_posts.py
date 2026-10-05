def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["database"] == "up"


def test_list_returns_only_published_newest_first(client, seed):
    resp = client.get("/api/posts")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert [item["title"] for item in body["items"]] == ["第三篇", "第二篇", "第一篇"]


def test_list_item_fields(client, seed):
    resp = client.get("/api/posts")
    item = resp.json()["items"][2]  # 最早发布的第一篇,带全部分类/标签
    assert item["category"]["name"] == "技术"
    assert [t["name"] for t in item["tags"]] == ["fastapi", "vue"]
    assert item["reading_minutes"] == 5
    assert "content" not in item  # 列表不泄露正文


def test_list_pagination(client, seed):
    page1 = client.get("/api/posts", params={"page": 1, "page_size": 2}).json()
    assert len(page1["items"]) == 2
    assert page1["total"] == 3
    page2 = client.get("/api/posts", params={"page": 2, "page_size": 2}).json()
    assert [item["title"] for item in page2["items"]] == ["第一篇"]


def test_list_rejects_invalid_params(client, seed):
    assert client.get("/api/posts", params={"page": 0}).status_code == 422
    assert client.get("/api/posts", params={"page_size": 51}).status_code == 422


def test_get_post_detail(client, seed):
    resp = client.get(f"/api/posts/{seed['published'][0]}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "第一篇"
    assert body["content"].startswith("# 第一篇")
    assert body["published_at"].startswith("2026-01-01")


def test_draft_withdrawn_and_missing_are_404(client, seed):
    for post_id in (seed["draft"], seed["withdrawn"], 99999):
        resp = client.get(f"/api/posts/{post_id}")
        assert resp.status_code == 404


def test_post_detail_has_published_neighbors(client, seed):
    # 种子发布顺序:第一篇(1月) < 第二篇(2月) < 第三篇(3月)
    middle = client.get(f"/api/posts/{seed['published'][1]}").json()
    assert middle["prev"]["id"] == seed["published"][0]
    assert middle["next"]["id"] == seed["published"][2]

    oldest = client.get(f"/api/posts/{seed['published'][0]}").json()
    assert oldest["prev"] is None  # 没有更早的就不渲染无效链接
    assert oldest["next"]["id"] == seed["published"][1]
