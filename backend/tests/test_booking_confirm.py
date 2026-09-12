"""Test 'Conferma con un tap' feature: PATCH table-requests notifies guest via email."""
import os
import uuid
from datetime import date, timedelta, datetime, timezone

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kalama-web.preview.emergentagent.com').rstrip('/')
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
ADMIN_PASSWORD = 'KalamaMare2026!'

mongo = MongoClient(MONGO_URL)
db = mongo[DB_NAME]


def _future_date():
    return (date.today() + timedelta(days=14)).isoformat()


def _make_req(site, lang, email, name):
    return {
        "id": str(uuid.uuid4()),
        "site": site,
        "date": _future_date(),
        "time": "20:00",
        "guests": 2,
        "zone": "any",
        "occasion": "",
        "accessibility": False,
        "name": name,
        "email": email,
        "phone": "",
        "notes": "",
        "lang": lang,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def seeded():
    """Seed 2 test requests directly in Mongo with delivered@resend.dev + 1 with qa@example.com."""
    docs = [
        _make_req("malaga", "es", "delivered@resend.dev", "TEST_ES_Delivered"),
        _make_req("malta",  "de", "delivered@resend.dev", "TEST_DE_Delivered"),
        _make_req("malaga", "it", "qa@example.com",       "TEST_IT_Unreachable"),
    ]
    db.table_requests.insert_many([dict(d) for d in docs])
    ids = [d["id"] for d in docs]
    yield ids
    # Cleanup via API (uses DELETE endpoint)
    # (Also deleting via db as safety fallback)
    db.table_requests.delete_many({"id": {"$in": ids}})


def _get_req(token, req_id):
    r = requests.get(f"{BASE_URL}/api/admin/table-requests",
                     headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    for x in r.json():
        if x["id"] == req_id:
            return x
    return None


# ---- Auth / error path tests ----
def test_patch_requires_auth():
    r = requests.patch(f"{BASE_URL}/api/admin/table-requests/nope", json={"status": "confirmed"})
    assert r.status_code == 401


def test_patch_404_unknown_id(headers):
    r = requests.patch(f"{BASE_URL}/api/admin/table-requests/does-not-exist",
                       json={"status": "confirmed"}, headers=headers)
    assert r.status_code == 404


def test_patch_422_bad_status(headers, seeded):
    r = requests.patch(f"{BASE_URL}/api/admin/table-requests/{seeded[0]}",
                       json={"status": "foo"}, headers=headers)
    assert r.status_code == 422


# ---- Confirm path (delivered@resend.dev, lang=es) ----
def test_confirm_delivered_es(headers, seeded, admin_token):
    rid = seeded[0]
    r = requests.patch(f"{BASE_URL}/api/admin/table-requests/{rid}",
                       json={"status": "confirmed"}, headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body == {"ok": True, "guest_notified": True}, body

    got = _get_req(admin_token, rid)
    assert got["status"] == "confirmed"
    assert got.get("guest_notified_status") == "confirmed"
    assert "guest_notified_at" in got
    # ISO format check
    datetime.fromisoformat(got["guest_notified_at"])


# ---- Decline path (delivered@resend.dev, lang=de) ----
def test_decline_delivered_de(headers, seeded, admin_token):
    rid = seeded[1]
    r = requests.patch(f"{BASE_URL}/api/admin/table-requests/{rid}",
                       json={"status": "declined"}, headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body == {"ok": True, "guest_notified": True}, body

    got = _get_req(admin_token, rid)
    assert got["status"] == "declined"
    assert got.get("guest_notified_status") == "declined"
    assert "guest_notified_at" in got


# ---- Status back to 'new' does NOT send email ----
def test_patch_new_does_not_notify(headers, seeded, admin_token):
    rid = seeded[0]  # already confirmed; keep old notified_at
    before = _get_req(admin_token, rid)
    prev_notified_at = before.get("guest_notified_at")
    prev_notified_status = before.get("guest_notified_status")

    r = requests.patch(f"{BASE_URL}/api/admin/table-requests/{rid}",
                       json={"status": "new"}, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body == {"ok": True, "guest_notified": False}, body

    after = _get_req(admin_token, rid)
    assert after["status"] == "new"
    # notified fields should remain unchanged (not overwritten / not removed)
    assert after.get("guest_notified_at") == prev_notified_at
    assert after.get("guest_notified_status") == prev_notified_status


# ---- Unreachable email (provider 422) → guest_notified: false, endpoint still ok ----
def test_confirm_unreachable_email(headers, seeded, admin_token):
    rid = seeded[2]
    r = requests.patch(f"{BASE_URL}/api/admin/table-requests/{rid}",
                       json={"status": "confirmed"}, headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    assert body.get("guest_notified") is False, body

    got = _get_req(admin_token, rid)
    assert got["status"] == "confirmed"
    # Since email failed, notified fields should NOT be set
    assert "guest_notified_at" not in got or got.get("guest_notified_at") is None


# ---- Cleanup via API DELETE ----
def test_cleanup_via_delete(headers, seeded):
    for rid in seeded:
        r = requests.delete(f"{BASE_URL}/api/admin/table-requests/{rid}", headers=headers)
        assert r.status_code == 200, r.text
        assert r.json() == {"ok": True}
