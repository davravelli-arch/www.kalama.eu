"""Targeted retest of admin login flow (lockout-aware).

IMPORTANT: keeps wrong-password attempts to a minimum (max 2) and always ends
with a successful login so the per-IP counter is reset.
"""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="module")
def admin_password():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    m = re.search(r'(?im)^\s*-?\s*Password:\s*`?([^`\s]+)', content)
    if not m:
        pytest.skip("no admin password in test_credentials.md")
    return m.group(1)


class TestAdminLogin:
    def test_01_correct_password_returns_token(self, admin_password):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": admin_password}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data.get("token"), str) and data["token"].count(".") == 2

    def test_02_token_grants_admin_access(self, admin_password):
        token = requests.post(f"{BASE_URL}/api/admin/login", json={"password": admin_password},
                              timeout=30).json()["token"]
        r = requests.get(f"{BASE_URL}/api/admin/menu", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) > 0
        assert all("_id" not in it for it in items)

    def test_03_wrong_case_password_rejected(self, admin_password):
        # attempt #1 (wrong)
        r = requests.post(f"{BASE_URL}/api/admin/login",
                          json={"password": admin_password.lower()}, timeout=30)
        assert r.status_code == 401
        assert r.json().get("detail") == "Password errata"

    def test_04_untrimmed_password_rejected_by_backend(self, admin_password):
        # attempt #2 (wrong) - documents that trimming is frontend-only
        r = requests.post(f"{BASE_URL}/api/admin/login",
                          json={"password": f"  {admin_password}  "}, timeout=30)
        assert r.status_code == 401
        assert r.json().get("detail") == "Password errata"

    def test_05_missing_password_validation(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={}, timeout=30)
        assert r.status_code == 422

    def test_06_correct_password_still_works_and_resets_counter(self, admin_password):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": admin_password}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert "token" in r.json()
