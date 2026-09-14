"""Iteration 10 tests: rate limit (X-Real-IP), copy menu images."""
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

# Use a fake X-Real-IP so we bypass rate-limit sharing with ingress pods
QA_IP = "203.0.113.77"
HEADERS_IP = {"X-Real-IP": QA_IP}


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


# --- Rate limit chat ---
def test_chat_rate_limit_20_then_429():
    session_id = "qa-rl-session-0002"
    codes = []
    for i in range(21):
        r = requests.post(
            f"{BASE_URL}/api/chat",
            json={"session_id": session_id, "message": "ok", "site": "malaga", "lang": "it"},
            headers={**HEADERS_IP, "Accept": "text/event-stream"},
            stream=True,
            timeout=20,
        )
        codes.append(r.status_code)
        # close immediately to avoid consuming SSE stream
        r.close()
    print("Chat codes:", codes)
    assert codes[:20].count(200) == 20, f"Expected first 20 = 200, got {codes[:20]}"
    assert codes[20] == 429, f"Expected 21st = 429, got {codes[20]}"


# --- Rate limit contact ---
def test_contact_rate_limit_3_then_429():
    # Use different IP to avoid mixing with chat scope but same scope "contact"
    ip_hdr = {"X-Real-IP": "203.0.113.88"}
    codes = []
    payload = {"name": "QA RateLimit Test", "email": "delivered@resend.dev", "message": "test anti-abuso, ignorare"}
    for i in range(4):
        r = requests.post(f"{BASE_URL}/api/contact", json=payload, headers=ip_hdr, timeout=15)
        codes.append(r.status_code)
    print("Contact codes:", codes)
    assert codes[:3] == [200, 200, 200], f"Expected first 3 = 200, got {codes}"
    assert codes[3] == 429, f"Expected 4th = 429, got {codes}"
    if codes[3] == 429:
        # Just verify header present in a fresh request? Already consumed. Skip.
        pass


# --- Copy images endpoint ---
def test_copy_images_unauthorized():
    r = requests.post(f"{BASE_URL}/api/admin/menu/copy-images?source=malaga&target=malta", timeout=15)
    assert r.status_code == 401


def test_copy_images_invalid_params(admin_token):
    r = requests.post(
        f"{BASE_URL}/api/admin/menu/copy-images?source=malta&target=malta",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=15,
    )
    assert r.status_code == 422


def test_copy_images_ok(admin_token):
    r = requests.post(
        f"{BASE_URL}/api/admin/menu/copy-images?source=malaga&target=malta",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "copied" in data and isinstance(data["copied"], int)
    print("copied:", data["copied"])


def test_menu_malta_images_match_malaga():
    r = requests.get(f"{BASE_URL}/api/menu", timeout=15)
    assert r.status_code == 200
    items = r.json()
    by_id = {i["id"]: i for i in items}
    pairs = [
        ("malta-calamari-piccoli", "malaga-calamari-piccoli"),
        ("malta-melanzane-classica", "malaga-melanzane-classica"),
        ("malta-fish-chips", "malaga-fish-chips"),
    ]
    for malta_id, malaga_id in pairs:
        assert malta_id in by_id, f"Missing {malta_id}"
        assert malaga_id in by_id, f"Missing {malaga_id}"
        assert by_id[malta_id].get("image"), f"{malta_id} has no image"
        assert by_id[malta_id]["image"] == by_id[malaga_id]["image"], (
            f"{malta_id} image differs from {malaga_id}"
        )
