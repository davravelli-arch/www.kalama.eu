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
    m = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?password(?:\*\*)?\s*:\s*`?([^`\s]+)', p.read_text())
    if not m:
        pytest.skip("no password in test_credentials.md")
    return m.group(1)


@pytest.fixture(scope="session")
def admin_token(api_client, admin_password):
    r = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": admin_password})
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("token")
    assert isinstance(tok, str) and len(tok) > 20
    return tok


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# --- health / public menu ---
class TestPublic:
    def test_root(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_menu_26_items(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/menu")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 26, f"expected 26 dishes, got {len(data)}"
        assert all("_id" not in i for i in data)
        ids = {i["id"] for i in data}
        for expected in ("gozo", "gran-fritto", "calamari-piccolo"):
            assert expected in ids
        gozo = next(i for i in data if i["id"] == "gozo")
        assert gozo["name_it"] == "Gozo Sandwich"
        assert gozo["price"] == 15.0
        assert gozo["category"] == "panini"
        cats = {i["category"] for i in data}
        assert cats == {"cucina", "pasta", "fritti", "grill", "insalate", "panini", "dolci"}
        for i in data:
            assert i["image"].startswith("https://")

    def test_contact_form(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST_QA", "email": "qa@example.test", "message": "TEST_ messaggio automatico"})
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["ok"] is True and isinstance(d["id"], str)

    def test_franchising_form(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/franchising", json={
            "name": "TEST_QA", "email": "qa@example.test", "phone": "+39000",
            "city": "TEST_City", "message": "TEST_"})
        assert r.status_code == 200, r.text[:300]
        assert r.json()["ok"] is True

    def test_contact_validation(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/contact", json={"name": "x"})
        assert r.status_code == 422


# --- admin auth ---
class TestAdminAuth:
    def test_wrong_password_401(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/admin/login", json={"password": "definitely-wrong-once"})
        assert r.status_code == 401
        assert r.json()["detail"] == "Password errata"

    def test_correct_password_resets_and_returns_token(self, admin_token):
        assert admin_token

    def test_menu_requires_auth(self, api_client):
        r = requests.get(f"{BASE_URL}/api/admin/menu")
        assert r.status_code == 401

    def test_bad_token_401(self, api_client):
        r = requests.get(f"{BASE_URL}/api/admin/menu", headers={"Authorization": "Bearer not.a.jwt"})
        assert r.status_code == 401


# --- admin menu CRUD ---
class TestAdminCRUD:
    ITEM_ID = "test-polpo-qa"

    def test_list_menu(self, api_client, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/menu", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 26

    def test_create_read_update_delete(self, auth_headers):
        payload = {"id": self.ITEM_ID, "category": "cucina", "name_it": "TEST_ Polpo",
                   "name_en": "TEST_ Octopus", "desc_it": "d", "desc_en": "d",
                   "price": 10.0, "tag_it": "", "tag_en": "", "image": "https://example.com/a.jpg"}
        requests.delete(f"{BASE_URL}/api/admin/menu/{self.ITEM_ID}", headers=auth_headers)

        r = requests.post(f"{BASE_URL}/api/admin/menu", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text[:300]

        pub = requests.get(f"{BASE_URL}/api/menu").json()
        created = next((i for i in pub if i["id"] == self.ITEM_ID), None)
        assert created is not None, "created item not visible on public menu"
        assert created["price"] == 10.0

        # duplicate id
        r = requests.post(f"{BASE_URL}/api/admin/menu", json=payload, headers=auth_headers)
        assert r.status_code == 409

        payload["price"] = 16.5
        r = requests.put(f"{BASE_URL}/api/admin/menu/{self.ITEM_ID}", json=payload, headers=auth_headers)
        assert r.status_code == 200
        pub = requests.get(f"{BASE_URL}/api/menu").json()
        assert next(i for i in pub if i["id"] == self.ITEM_ID)["price"] == 16.5

        r = requests.delete(f"{BASE_URL}/api/admin/menu/{self.ITEM_ID}", headers=auth_headers)
        assert r.status_code == 200
        pub = requests.get(f"{BASE_URL}/api/menu").json()
        assert all(i["id"] != self.ITEM_ID for i in pub)

        r = requests.delete(f"{BASE_URL}/api/admin/menu/{self.ITEM_ID}", headers=auth_headers)
        assert r.status_code == 404

    def test_update_missing_item_404(self, auth_headers):
        payload = {"id": "nope-qa", "category": "cucina", "name_it": "a", "name_en": "a", "price": 1.0}
        r = requests.put(f"{BASE_URL}/api/admin/menu/nope-qa", json=payload, headers=auth_headers)
        assert r.status_code == 404

    def test_create_invalid_payload_422(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/admin/menu", json={"id": "x"}, headers=auth_headers)
        assert r.status_code == 422
