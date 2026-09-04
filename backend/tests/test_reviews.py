"""Backend tests: Reviews CRUD (admin-curated) + Google Places settings."""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_password():
    p = Path("/app/memory/test_credentials.md")
    if not p.exists():
        pytest.skip("missing test_credentials.md")
    m = re.search(r'(?im)^\s*[-*]?\s*Password:\s*`?([^`\s]+)', p.read_text(encoding="utf-8"))
    if not m:
        pytest.skip("no password in test_credentials.md")
    return m.group(1)


@pytest.fixture(scope="session")
def token(api_client, admin_password):
    r = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": admin_password})
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code}: {r.text[:300]}")
    t = r.json().get("token")
    assert isinstance(t, str) and t
    return t


@pytest.fixture(scope="session")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def created_ids():
    return []


@pytest.fixture(scope="session", autouse=True)
def cleanup(api_client, auth, created_ids):
    yield
    for rid in created_ids:
        api_client.delete(f"{BASE_URL}/api/admin/reviews/{rid}", headers=auth)
    # restore google places
    api_client.put(f"{BASE_URL}/api/admin/google-places", json={"malaga": "", "malta": ""}, headers=auth)


# --- GET /api/reviews initial state
class TestReviewsList:
    def test_initial_list_is_empty(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/reviews")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert data == [], f"expected empty reviews list, got {len(data)} items"


# --- POST/PUT/DELETE /api/admin/reviews
class TestReviewsCrud:
    payload = {"author": "TEST_QA", "rating": 5, "text": "Ottimo",
               "location": "malaga", "source": "google", "date": "Giugno 2026", "featured": True}

    def test_create_requires_auth(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/admin/reviews", json=self.payload)
        assert r.status_code == 401

    def test_create_and_persist(self, api_client, auth, created_ids):
        r = api_client.post(f"{BASE_URL}/api/admin/reviews", json=self.payload, headers=auth)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert UUID_RE.match(d["id"]), d["id"]
        assert d["created_at"] and isinstance(d["created_at"], str)
        for k, v in self.payload.items():
            assert d[k] == v, f"{k}: {d[k]} != {v}"
        created_ids.append(d["id"])

        g = api_client.get(f"{BASE_URL}/api/reviews")
        assert g.status_code == 200
        found = [x for x in g.json() if x["id"] == d["id"]]
        assert len(found) == 1
        assert found[0]["author"] == "TEST_QA"
        assert "_id" not in found[0]

    @pytest.mark.parametrize("bad,field", [
        ({"rating": 6}, "rating>5"),
        ({"rating": 0}, "rating<1"),
        ({"location": "roma"}, "bad location"),
        ({"source": "yelp"}, "bad source"),
        ({"author": ""}, "empty author"),
        ({"text": "  "}, "blank text"),
    ])
    def test_validation_errors(self, api_client, auth, bad, field):
        body = {**self.payload, **bad}
        r = api_client.post(f"{BASE_URL}/api/admin/reviews", json=body, headers=auth)
        assert r.status_code == 422, f"{field}: got {r.status_code} {r.text[:200]}"

    def test_update_reflects_in_get(self, api_client, auth, created_ids):
        rid = created_ids[0]
        upd = {**self.payload, "rating": 4, "featured": False, "text": "Aggiornato"}
        r = api_client.put(f"{BASE_URL}/api/admin/reviews/{rid}", json=upd, headers=auth)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["rating"] == 4 and d["featured"] is False and d["text"] == "Aggiornato"
        assert d["id"] == rid
        g = [x for x in api_client.get(f"{BASE_URL}/api/reviews").json() if x["id"] == rid][0]
        assert g["rating"] == 4 and g["featured"] is False and g["text"] == "Aggiornato"

    def test_update_requires_auth(self, api_client, created_ids):
        r = api_client.put(f"{BASE_URL}/api/admin/reviews/{created_ids[0]}", json=self.payload)
        assert r.status_code == 401

    def test_update_missing_404(self, api_client, auth):
        r = api_client.put(f"{BASE_URL}/api/admin/reviews/does-not-exist", json=self.payload, headers=auth)
        assert r.status_code == 404

    def test_ordering_featured_first_then_recent(self, api_client, auth, created_ids):
        ids = []
        for i, feat in enumerate([False, True, False]):
            body = {**self.payload, "author": f"TEST_ORD_{i}", "featured": feat}
            r = api_client.post(f"{BASE_URL}/api/admin/reviews", json=body, headers=auth)
            assert r.status_code == 200
            ids.append(r.json()["id"])
            created_ids.append(r.json()["id"])
        data = api_client.get(f"{BASE_URL}/api/reviews").json()
        feats = [x["featured"] for x in data]
        assert feats == sorted(feats, reverse=True), f"featured not first: {feats}"
        non_feat = [x for x in data if not x["featured"]]
        created = [x["created_at"] for x in non_feat]
        assert created == sorted(created, reverse=True), "non-featured not sorted by created_at desc"

    def test_delete_and_second_delete_404(self, api_client, auth):
        r = api_client.post(f"{BASE_URL}/api/admin/reviews",
                            json={**self.payload, "author": "TEST_DEL"}, headers=auth)
        rid = r.json()["id"]
        d1 = api_client.delete(f"{BASE_URL}/api/admin/reviews/{rid}", headers=auth)
        assert d1.status_code == 200 and d1.json() == {"ok": True}
        d2 = api_client.delete(f"{BASE_URL}/api/admin/reviews/{rid}", headers=auth)
        assert d2.status_code == 404
        assert all(x["id"] != rid for x in api_client.get(f"{BASE_URL}/api/reviews").json())

    def test_delete_requires_auth(self, api_client):
        r = api_client.delete(f"{BASE_URL}/api/admin/reviews/whatever")
        assert r.status_code == 401


# --- Google Places (key intentionally absent)
class TestGooglePlaces:
    def test_public_google_reviews_disabled(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/reviews/google")
        assert r.status_code == 200
        assert r.json() == {"enabled": False, "places": []}

    def test_get_settings(self, api_client, auth):
        r = api_client.get(f"{BASE_URL}/api/admin/google-places", headers=auth)
        assert r.status_code == 200
        d = r.json()
        assert d["hasKey"] is False
        assert d["placeIds"] == {"malaga": "", "malta": ""}

    def test_put_settings_roundtrip(self, api_client, auth):
        r = api_client.put(f"{BASE_URL}/api/admin/google-places",
                           json={"malaga": "ChIJtest", "malta": ""}, headers=auth)
        assert r.status_code == 200 and r.json() == {"ok": True}
        g = api_client.get(f"{BASE_URL}/api/admin/google-places", headers=auth).json()
        assert g["placeIds"] == {"malaga": "ChIJtest", "malta": ""}
        # public endpoint still disabled (no API key)
        pub = api_client.get(f"{BASE_URL}/api/reviews/google")
        assert pub.json() == {"enabled": False, "places": []}
        # restore
        api_client.put(f"{BASE_URL}/api/admin/google-places",
                       json={"malaga": "", "malta": ""}, headers=auth)
        g2 = api_client.get(f"{BASE_URL}/api/admin/google-places", headers=auth).json()
        assert g2["placeIds"] == {"malaga": "", "malta": ""}

    def test_search_conflict_without_key(self, api_client, auth):
        r = api_client.post(f"{BASE_URL}/api/admin/google-places/search",
                            json={"query": "Kalama"}, headers=auth)
        assert r.status_code == 409, r.text[:200]

    @pytest.mark.parametrize("method,path,body", [
        ("get", "/api/admin/google-places", None),
        ("put", "/api/admin/google-places", {"malaga": "", "malta": ""}),
        ("post", "/api/admin/google-places/search", {"query": "x"}),
    ])
    def test_admin_endpoints_require_auth(self, api_client, method, path, body):
        r = getattr(api_client, method)(f"{BASE_URL}{path}", json=body)
        assert r.status_code == 401


# --- quick regression
class TestRegression:
    def test_menu_still_available(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/menu")
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 50
        assert {i["location"] for i in items} >= {"malaga", "malta"}

    def test_site_images(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/site-images")
        assert r.status_code == 200
        assert "hero" in r.json()
