"""Tests for table booking reminder feature (POST /admin/table-requests/{id}/remind and run-reminders)."""
import os
import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

LOCAL_TZ = ZoneInfo("Europe/Madrid")


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


@pytest.fixture(scope="module")
def seed(db):
    today = datetime.now(LOCAL_TZ).date().isoformat()
    now_iso = datetime.now(timezone.utc).isoformat()
    base = dict(site="malta", time="20:00", guests=2, zone="any", occasion="",
                accessibility=False, name="TEST Reminder", phone="", notes="",
                lang="fr", created_at=now_iso, date=today)
    ids = {
        "A": str(uuid.uuid4()),
        "B": str(uuid.uuid4()),
        "C": str(uuid.uuid4()),
    }
    docs = [
        {**base, "id": ids["A"], "status": "confirmed", "email": "delivered@resend.dev"},
        {**base, "id": ids["B"], "status": "new", "email": "delivered@resend.dev"},
        {**base, "id": ids["C"], "status": "confirmed", "email": "qa@example.com"},
    ]
    db.table_requests.insert_many(docs)
    yield ids
    db.table_requests.delete_many({"id": {"$in": list(ids.values())}})


def _get(db, req_id):
    return db.table_requests.find_one({"id": req_id}, {"_id": 0})


# --- POST /admin/table-requests/{id}/remind ---

def test_remind_no_token():
    r = requests.post(f"{BASE_URL}/api/admin/table-requests/anything/remind", timeout=15)
    assert r.status_code == 401


def test_remind_not_found(headers):
    r = requests.post(f"{BASE_URL}/api/admin/table-requests/{uuid.uuid4()}/remind",
                      headers=headers, timeout=15)
    assert r.status_code == 404


def test_remind_confirmed_A_sends(headers, db, seed):
    r = requests.post(f"{BASE_URL}/api/admin/table-requests/{seed['A']}/remind",
                      headers=headers, timeout=30)
    assert r.status_code == 200, r.text
    assert r.json() == {"sent": True}
    doc = _get(db, seed["A"])
    assert doc and doc.get("reminder_sent_at"), "reminder_sent_at should be set on A"
    # ISO format check
    datetime.fromisoformat(doc["reminder_sent_at"])


def test_remind_new_B_409(headers, seed):
    r = requests.post(f"{BASE_URL}/api/admin/table-requests/{seed['B']}/remind",
                      headers=headers, timeout=15)
    assert r.status_code == 409


def test_remind_unreachable_C_returns_false(headers, db, seed):
    r = requests.post(f"{BASE_URL}/api/admin/table-requests/{seed['C']}/remind",
                      headers=headers, timeout=30)
    assert r.status_code == 200, r.text
    assert r.json() == {"sent": False}
    doc = _get(db, seed["C"])
    assert doc and not doc.get("reminder_sent_at"), "C must not have reminder_sent_at"


# --- POST /admin/table-requests/run-reminders ---

def test_run_reminders_idempotent_and_time_aware(headers, db, seed):
    # Reset A's reminder flag
    db.table_requests.update_one({"id": seed["A"]}, {"$unset": {"reminder_sent_at": ""}})
    now = datetime.now(LOCAL_TZ)
    r = requests.post(f"{BASE_URL}/api/admin/table-requests/run-reminders",
                      headers=headers, timeout=60)
    assert r.status_code == 200, r.text
    sent = r.json()["sent"]
    doc_a = _get(db, seed["A"])
    doc_b = _get(db, seed["B"])
    doc_c = _get(db, seed["C"])

    if now.hour < 9:
        # Case: before 9 local -> should NOT send
        assert sent == 0, f"Expected 0 sent before 9AM Madrid, got {sent}"
        assert not doc_a.get("reminder_sent_at")
        print(f"[reminders] verified BEFORE 9AM branch (Madrid={now.isoformat()})")
    else:
        assert sent >= 1
        assert doc_a.get("reminder_sent_at")
        # Second call idempotent
        r2 = requests.post(f"{BASE_URL}/api/admin/table-requests/run-reminders",
                           headers=headers, timeout=60)
        assert r2.status_code == 200
        assert r2.json()["sent"] == 0
        print(f"[reminders] verified AFTER 9AM branch (Madrid={now.isoformat()})")

    # B (new) and C (unreachable) must never receive reminder_sent_at
    assert not doc_b.get("reminder_sent_at")
    assert not doc_c.get("reminder_sent_at")


def test_cleanup_via_delete_endpoint(headers, db, seed):
    """Cleanup the 3 seeded requests using the admin DELETE endpoint."""
    for k in ("A", "B", "C"):
        r = requests.delete(f"{BASE_URL}/api/admin/table-requests/{seed[k]}",
                            headers=headers, timeout=15)
        assert r.status_code == 200, f"Delete {k} failed: {r.text}"
    for k in ("A", "B", "C"):
        assert _get(db, seed[k]) is None
