"""管理端测试:认证(FR-AUTH)+ 文章管理(FR-ADMIN-ARTICLE)+ 分类/标签管理。"""

from urllib.parse import quote


# ---------- 认证 ----------


def test_me_requires_login(client, admin_user):
    assert client.get("/api/admin/me").status_code == 401


def test_login_wrong_password_is_generic_401(client, admin_user):
    resp = client.post("/api/admin/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "用户名或密码错误"


def test_login_me_logout_roundtrip(client, admin_user):
    resp = client.post("/api/admin/login", json={"username": "admin", "password": "correct-horse"})
    assert resp.status_code == 200
    assert client.get("/api/admin/me").json() == {"username": "admin"}

    client.post("/api/admin/logout")
    assert client.get("/api/admin/me").status_code == 401


def test_login_locks_after_repeated_failures(client, admin_user):
    for _ in range(5):
        client.post("/api/admin/login", json={"username": "admin", "password": "wrong"})
    # 第 6 次即使密码正确也拒绝,但不是永久锁死(窗口过后可重试)
    resp = client.post("/api/admin/login", json={"username": "admin", "password": "correct-horse"})
    assert resp.status_code == 429


# ---------- 文章管理 ----------


def test_admin_create_post_defaults_to_draft_invisible_publicly(admin_client, admin_user):
    payload = {
        "title": "新文章",
        "summary": "摘要",
        "content": "# 正文",
        "category_id": None,
        "tag_ids": [],
    }
    resp = admin_client.post("/api/admin/posts", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "draft"
    assert body["version"] == 1

    assert admin_client.get("/api/admin/posts").json()[0]["title"] == "新文章"
    assert admin_client.get("/api/admin/posts", params={"status": "draft"}).json()[0]["id"] == body["id"]
    public = admin_client.get("/api/posts")
    assert public.json()["total"] == 0


def test_admin_create_post_validates_required_fields(admin_client, admin_user):
    resp = admin_client.post(
        "/api/admin/posts",
        json={"title": "", "summary": "s", "content": "c"},
    )
    assert resp.status_code == 422


def test_admin_update_conflicts_on_stale_version(admin_client, admin_user):
    created = admin_client.post(
        "/api/admin/posts", json={"title": "t", "summary": "s", "content": "c"}
    ).json()

    stale = dict(title="t2", summary="s2", content="c2", version=created["version"] - 1)
    assert admin_client.put(f"/api/admin/posts/{created['id']}", json=stale).status_code == 409

    fresh = dict(title="t2", summary="s2", content="c2", version=created["version"])
    resp = admin_client.put(f"/api/admin/posts/{created['id']}", json=fresh)
    assert resp.status_code == 200
    assert resp.json()["version"] == created["version"] + 1


def test_publish_then_withdraw_roundtrip(admin_client, admin_user):
    created = admin_client.post(
        "/api/admin/posts", json={"title": "发布我", "summary": "s", "content": "c"}
    ).json()

    resp = admin_client.post(f"/api/admin/posts/{created['id']}/publish")
    assert resp.status_code == 200
    assert resp.json()["status"] == "published"
    assert resp.json()["published_at"] is not None
    assert admin_client.get("/api/posts").json()["total"] == 1
    assert admin_client.get(f"/api/posts/{created['id']}").status_code == 200

    admin_client.post(f"/api/admin/posts/{created['id']}/withdraw")
    assert admin_client.get("/api/posts").json()["total"] == 0
    assert admin_client.get(f"/api/posts/{created['id']}").status_code == 404


def test_delete_post_removes_it_everywhere(admin_client, admin_user):
    created = admin_client.post(
        "/api/admin/posts", json={"title": "删我", "summary": "s", "content": "c"}
    ).json()
    assert admin_client.delete(f"/api/admin/posts/{created['id']}").status_code == 204
    assert admin_client.get(f"/api/admin/posts/{created['id']}").status_code == 404


def test_admin_post_endpoints_require_auth(client, admin_user):
    assert client.get("/api/admin/posts").status_code == 401
    assert client.post("/api/admin/posts", json={"title": "t", "summary": "s", "content": "c"}).status_code == 401
    assert client.delete("/api/admin/posts/1").status_code == 401


# ---------- 分类/标签管理 ----------


def test_category_crud_rules(admin_client, admin_user):
    assert admin_client.post("/api/admin/categories", json={"name": "技术"}).status_code == 201
    # 重名冲突(FR-ADMIN-CATEGORY-002)
    assert admin_client.post("/api/admin/categories", json={"name": "技术"}).status_code == 409
    # 空列表也返回(与公开接口不同,管理端看到所有分类)
    categories = admin_client.get("/api/admin/categories").json()
    assert [c["name"] for c in categories] == ["技术"]
    category_id = categories[0]["id"]

    # 有文章关联时禁止删除(FR-ADMIN-CATEGORY-004)
    article = admin_client.post(
        "/api/admin/posts", json={"title": "t", "summary": "s", "content": "c", "category_id": category_id}
    ).json()
    assert admin_client.delete(f"/api/admin/categories/{category_id}").status_code == 409

    # 重命名同步生效(FR-ADMIN-CATEGORY-003)
    admin_client.put(f"/api/admin/categories/{category_id}", json={"name": "开发"})
    assert admin_client.get(f"/api/admin/posts/{article['id']}").json()["category"]["name"] == "开发"


def test_tag_delete_keeps_articles(admin_client, admin_user):
    tag = admin_client.post("/api/admin/tags", json={"name": "fastapi"}).json()
    article = admin_client.post(
        "/api/admin/posts", json={"title": "t", "summary": "s", "content": "c", "tag_ids": [tag["id"]]}
    ).json()

    assert admin_client.delete(f"/api/admin/tags/{tag['id']}").status_code == 204
    detail = admin_client.get(f"/api/admin/posts/{article['id']}").json()
    assert detail["tags"] == []  # 关联被清理,文章保留(FR-ADMIN-TAG-004)


def test_taxonomy_rename_conflicts(admin_client, admin_user):
    admin_client.post("/api/admin/categories", json={"name": "甲"})
    second = admin_client.post("/api/admin/categories", json={"name": "乙"}).json()
    resp = admin_client.put(f"/api/admin/categories/{second['id']}", json={"name": "甲"})
    assert resp.status_code == 409


def test_publish_makes_post_reachable_via_search_and_category(admin_client, admin_user):
    category = admin_client.post("/api/admin/categories", json={"name": "教程"}).json()
    tag = admin_client.post("/api/admin/tags", json={"name": "fastapi"}).json()
    created = admin_client.post(
        "/api/admin/posts",
        json={"title": "FastAPI 教程", "summary": "步骤", "content": "# 步骤", "category_id": category["id"], "tag_ids": [tag["id"]]},
    ).json()
    admin_client.post(f"/api/admin/posts/{created['id']}/publish")

    assert admin_client.get(f"/api/search?q={quote('FastAPI')}").json()["total"] == 1
    assert admin_client.get("/api/categories").json() == [
        {"id": category["id"], "name": "教程", "article_count": 1}
    ]
    assert admin_client.get(f"/api/posts?category_id={category['id']}").json()["total"] == 1
    assert admin_client.get(f"/api/posts?tag_id={tag['id']}").json()["total"] == 1
