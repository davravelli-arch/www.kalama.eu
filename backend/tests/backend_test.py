import io
import os
import re
import struct
import zlib
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")


def tiny_png() -> bytes:
    """Generate a valid 1x1 PNG in-memory (no external deps)."""
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = b"\x00\xff\xcc\x17"
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


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


# --- health / public menu (105 items, per-location) ---
class TestPublic:
    def test_root(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_menu_105_items_with_location(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/menu")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        seeded = [i for i in data if not i["id"].startswith(("test-", "TEST_"))]
        assert len(seeded) == 105, f"expected 105 seeded dishes, got {len(seeded)}"
        assert all("_id" not in i for i in data)
        assert all(i.get("location") in {"malaga", "malta"} for i in seeded)
        malaga = [i for i in seeded if i["location"] == "malaga"]
        malta = [i for i in seeded if i["location"] == "malta"]
        assert len(malaga) == 61, f"malaga={len(malaga)}"
        assert len(malta) == 44, f"malta={len(malta)}"

    def test_wine_price_max(self, api_client):
        data = api_client.get(f"{BASE_URL}/api/menu").json()
        by_id = {i["id"]: i for i in data}
        w = by_id.get("malaga-chardonnay-cavit")
        assert w is not None, "malaga-chardonnay-cavit missing"
        assert w["price"] == 4.5
        assert w["price_max"] == 22.0
        assert isinstance(w["price_max"], (int, float))
        w2 = by_id.get("malta-chardonnay-casalforte")
        assert w2 is not None
        assert (w2["price"], w2["price_max"]) == (5.0, 22.0)
        for i in data:
            if i["category"] == "vini":
                assert i.get("price_max") is None or isinstance(i["price_max"], (int, float))

    def test_empty_images_accepted(self, api_client):
        data = api_client.get(f"{BASE_URL}/api/menu").json()
        empty = [i for i in data if i.get("image", "") == ""]
        assert len(empty) > 0, "expected some items with empty image"
        for i in data:
            assert isinstance(i.get("image", ""), str)

    def test_categories_per_location(self, api_client):
        data = api_client.get(f"{BASE_URL}/api/menu").json()
        mal = {i["category"] for i in data if i["location"] == "malaga"}
        mlt = {i["category"] for i in data if i["location"] == "malta"}
        for c in ("cucina", "fritti", "grill", "panini", "dolci", "bevande", "birre", "vini"):
            assert c in mal, f"{c} missing in malaga"
            assert c in mlt, f"{c} missing in malta"
        assert {"pasta", "insalate", "salse", "cocktail"} <= mal
        assert not ({"pasta", "insalate", "salse", "cocktail"} & mlt), f"unexpected malta cats: {mlt}"

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

    def test_menu_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/menu")
        assert r.status_code == 401

    def test_bad_token_401(self):
        r = requests.get(f"{BASE_URL}/api/admin/menu", headers={"Authorization": "Bearer not.a.jwt"})
        assert r.status_code == 401


# --- admin menu CRUD (malta / birre / price_max null) ---
class TestAdminCRUD:
    ITEM_ID = "test-e2e-birra-qa"

    def test_list_menu(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/menu", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 105

    def test_create_read_update_delete(self, auth_headers):
        payload = {"id": self.ITEM_ID, "location": "malta", "category": "birre",
                   "name_it": "TEST_ Birra", "name_en": "TEST_ Beer", "desc_it": "d", "desc_en": "d",
                   "price": 3.5, "price_max": None, "tag_it": "", "tag_en": "", "image": ""}
        requests.delete(f"{BASE_URL}/api/admin/menu/{self.ITEM_ID}", headers=auth_headers)

        r = requests.post(f"{BASE_URL}/api/admin/menu", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text[:300]

        pub = requests.get(f"{BASE_URL}/api/menu").json()
        created = next((i for i in pub if i["id"] == self.ITEM_ID), None)
        assert created is not None, "created item not visible on public menu"
        assert created["price"] == 3.5
        assert created["location"] == "malta"
        assert created["category"] == "birre"
        assert created["price_max"] is None
        assert created["image"] == ""

        r = requests.post(f"{BASE_URL}/api/admin/menu", json=payload, headers=auth_headers)
        assert r.status_code == 409

        payload["price"] = 4.0
        payload["price_max"] = 9.0
        r = requests.put(f"{BASE_URL}/api/admin/menu/{self.ITEM_ID}", json=payload, headers=auth_headers)
        assert r.status_code == 200
        pub = requests.get(f"{BASE_URL}/api/menu").json()
        upd = next(i for i in pub if i["id"] == self.ITEM_ID)
        assert upd["price"] == 4.0 and upd["price_max"] == 9.0

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


# --- upload + file serving (Emergent Object Storage) ---
class TestUpload:
    uploaded_urls = []

    def test_upload_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/admin/upload",
                          files={"file": ("a.png", io.BytesIO(tiny_png()), "image/png")})
        assert r.status_code == 401

    def test_upload_rejects_text_415(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/admin/upload", headers=auth_headers,
                          files={"file": ("a.txt", io.BytesIO(b"hello"), "text/plain")})
        assert r.status_code == 415, r.text[:300]

    def test_upload_png_and_serve(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/admin/upload", headers=auth_headers,
                          files={"file": ("qa.png", io.BytesIO(tiny_png()), "image/png")})
        assert r.status_code == 200, r.text[:400]
        url = r.json()["url"]
        assert re.match(r"^/api/files/kalama/uploads/[0-9a-f-]{36}\.png$", url), url
        TestUpload.uploaded_urls.append(url)

        g = requests.get(f"{BASE_URL}{url}")
        assert g.status_code == 200, g.text[:200]
        assert g.headers.get("Content-Type", "").startswith("image/")
        # App sets 'public, max-age=31536000, immutable' (verified on :8001);
        # the preview ingress/CDN rewrites Cache-Control to no-store, so accept either.
        cc = g.headers.get("Cache-Control", "")
        assert cc, "Cache-Control header missing"
        assert g.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_upload_jpeg(self, auth_headers):
        # minimal but real content bytes; endpoint validates content-type only
        r = requests.post(f"{BASE_URL}/api/admin/upload", headers=auth_headers,
                          files={"file": ("qa.jpg", io.BytesIO(tiny_png()), "image/jpeg")})
        assert r.status_code == 200, r.text[:400]
        assert r.json()["url"].endswith(".jpg")
        TestUpload.uploaded_urls.append(r.json()["url"])

    def test_serve_unknown_file_404(self):
        r = requests.get(f"{BASE_URL}/api/files/kalama/uploads/does-not-exist.png")
        assert r.status_code == 404


# --- site images ---
class TestSiteImages:
    def test_get_site_images_shape(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/site-images")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict)
        assert isinstance(d.get("hero", ""), str) and d.get("hero"), "hero must be a non-empty string"
        assert isinstance(d.get("gallery", []), list), "gallery must be a list"

    def test_put_about_and_restore(self, api_client, auth_headers):
        original = api_client.get(f"{BASE_URL}/api/site-images").json().get("about", "")
        up = requests.post(f"{BASE_URL}/api/admin/upload", headers=auth_headers,
                           files={"file": ("about.png", io.BytesIO(tiny_png()), "image/png")})
        assert up.status_code == 200, up.text[:300]
        url = up.json()["url"]

        r = requests.put(f"{BASE_URL}/api/admin/site-images/about",
                         json={"value": url}, headers=auth_headers)
        assert r.status_code == 200, r.text[:300]
        assert api_client.get(f"{BASE_URL}/api/site-images").json()["about"] == url

        # restore
        r = requests.put(f"{BASE_URL}/api/admin/site-images/about",
                         json={"value": original}, headers=auth_headers)
        assert r.status_code == 200
        assert api_client.get(f"{BASE_URL}/api/site-images").json().get("about", "") == original

    def test_invalid_key_404(self, auth_headers):
        r = requests.put(f"{BASE_URL}/api/admin/site-images/bogus-key",
                         json={"value": "x"}, headers=auth_headers)
        assert r.status_code == 404

    def test_gallery_wrong_type_422(self, auth_headers):
        r = requests.put(f"{BASE_URL}/api/admin/site-images/gallery",
                         json={"value": "not-a-list"}, headers=auth_headers)
        assert r.status_code == 422

    def test_hero_wrong_type_422(self, auth_headers):
        r = requests.put(f"{BASE_URL}/api/admin/site-images/hero",
                         json={"value": ["a", "b"]}, headers=auth_headers)
        assert r.status_code == 422

    def test_site_images_requires_auth(self):
        r = requests.put(f"{BASE_URL}/api/admin/site-images/about", json={"value": ""})
        assert r.status_code == 401

    def test_gallery_append_then_restore(self, api_client, auth_headers):
        original = api_client.get(f"{BASE_URL}/api/site-images").json().get("gallery", [])
        assert isinstance(original, list)
        up = requests.post(f"{BASE_URL}/api/admin/upload", headers=auth_headers,
                           files={"file": ("g.png", io.BytesIO(tiny_png()), "image/png")})
        url = up.json()["url"]
        r = requests.put(f"{BASE_URL}/api/admin/site-images/gallery",
                         json={"value": original + [url]}, headers=auth_headers)
        assert r.status_code == 200
        now = api_client.get(f"{BASE_URL}/api/site-images").json()["gallery"]
        assert len(now) == len(original) + 1 and now[-1] == url

        r = requests.put(f"{BASE_URL}/api/admin/site-images/gallery",
                         json={"value": original}, headers=auth_headers)
        assert r.status_code == 200
        assert api_client.get(f"{BASE_URL}/api/site-images").json()["gallery"] == original
