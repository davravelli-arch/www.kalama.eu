"""Backend tests for booking (table-requests) + AI chat.

CONSTRAINTS:
- Each POST /api/table-requests sends a real email → max 2 valid POST total.
- Each /api/chat call consumes LLM credits → max 3 total.
"""
import json
import os
import re
from datetime import date, timedelta
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    p = Path("/app/memory/test_credentials.md").read_text()
    m = re.search(r'(?im)password\s*:\s*`?([^`\s]+)', p)
    r = api.post(f"{BASE_URL}/api/admin/login", json={"password": m.group(1)})
    assert r.status_code == 200, r.text[:200]
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def next_weekday(target):  # target: 0=Mon
    today = date.today()
    for i in range(1, 15):
        d = today + timedelta(days=i)
        if d.weekday() == target:
            return d
    raise RuntimeError


# --- SLOTS ---
class TestSlots:
    def test_malaga_monday_closed(self, api):
        d = next_weekday(0)
        r = api.get(f"{BASE_URL}/api/table-requests/slots", params={"site": "malaga", "date": d.isoformat()})
        assert r.status_code == 200
        j = r.json()
        assert j["closed"] is True
        assert j["lunch"] == [] and j["dinner"] == []

    def test_malaga_tuesday_open(self, api):
        d = next_weekday(1)
        r = api.get(f"{BASE_URL}/api/table-requests/slots", params={"site": "malaga", "date": d.isoformat()})
        assert r.status_code == 200
        j = r.json()
        assert j["closed"] is False
        assert j["lunch"][0] == "12:00" and j["lunch"][-1] == "15:30"
        assert j["dinner"][0] == "19:00" and j["dinner"][-1] == "22:30"

    def test_malta_monday_open(self, api):
        d = next_weekday(0)
        r = api.get(f"{BASE_URL}/api/table-requests/slots", params={"site": "malta", "date": d.isoformat()})
        assert r.status_code == 200
        j = r.json()
        assert j["closed"] is False
        assert j["dinner"][0] == "18:30" and j["dinner"][-1] == "22:00"

    def test_bad_site_422(self, api):
        r = api.get(f"{BASE_URL}/api/table-requests/slots", params={"site": "roma", "date": "2026-06-01"})
        assert r.status_code == 422

    def test_bad_date_422(self, api):
        r = api.get(f"{BASE_URL}/api/table-requests/slots", params={"site": "malaga", "date": "not-a-date"})
        assert r.status_code == 422


# --- Validation (no POST needed) ---
def _base_payload(**over):
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    p = {"site": "malta", "date": tomorrow, "time": "13:00", "guests": 2,
         "zone": "indoor", "occasion": "couple", "accessibility": False,
         "name": "QA Test", "email": "qa@example.com", "phone": "",
         "notes": "test automatico", "lang": "it"}
    p.update(over)
    return p


class TestValidation422:
    @pytest.mark.parametrize("override", [
        {"guests": 0}, {"guests": 21}, {"zone": "roof"}, {"occasion": "party"},
        {"email": "x"}, {"name": "A"},
        {"date": (date.today() - timedelta(days=1)).isoformat()},
        {"site": "roma"},
    ])
    def test_invalid_payload(self, api, override):
        r = api.post(f"{BASE_URL}/api/table-requests", json=_base_payload(**override))
        assert r.status_code == 422, f"payload={override} got {r.status_code}: {r.text[:200]}"


# --- Real POSTs (max 2) + admin flow ---
created_ids = []


class TestCreateAndAdmin:
    def test_create_malta(self, api):
        r = api.post(f"{BASE_URL}/api/table-requests", json=_base_payload(site="malta", name="TEST_QA_malta"))
        assert r.status_code == 200, r.text[:300]
        j = r.json()
        assert "id" in j
        assert j["site_email"] == "kalama.international@gmail.com"
        assert j["whatsapp_url"].startswith("https://wa.me/35679900819?text=")
        created_ids.append(j["id"])

    def test_create_malaga(self, api):
        tomorrow = date.today() + timedelta(days=1)
        # ensure not monday for malaga
        if tomorrow.weekday() == 0:
            tomorrow += timedelta(days=1)
        r = api.post(f"{BASE_URL}/api/table-requests", json=_base_payload(
            site="malaga", date=tomorrow.isoformat(), time="20:00", name="TEST_QA_malaga"))
        assert r.status_code == 200, r.text[:300]
        j = r.json()
        assert j["site_email"] == "info@kalama.eu"
        assert j["whatsapp_url"].startswith("https://wa.me/34610755695?text=")
        created_ids.append(j["id"])

    def test_admin_list_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/admin/table-requests")
        assert r.status_code == 401

    def test_admin_list_and_order(self, api, auth):
        r = api.get(f"{BASE_URL}/api/admin/table-requests", headers=auth)
        assert r.status_code == 200
        rows = r.json()
        ids = [x["id"] for x in rows]
        for cid in created_ids:
            assert cid in ids
        # First created (malta) is older → should appear AFTER malaga in desc order
        if len(created_ids) == 2:
            assert ids.index(created_ids[1]) < ids.index(created_ids[0])

    def test_patch_status_confirmed(self, api, auth):
        assert created_ids, "need created id"
        rid = created_ids[0]
        r = api.patch(f"{BASE_URL}/api/admin/table-requests/{rid}",
                      json={"status": "confirmed"}, headers=auth)
        assert r.status_code == 200
        rows = api.get(f"{BASE_URL}/api/admin/table-requests", headers=auth).json()
        row = next(x for x in rows if x["id"] == rid)
        assert row["status"] == "confirmed"

    def test_patch_invalid_status_422(self, api, auth):
        rid = created_ids[0]
        r = api.patch(f"{BASE_URL}/api/admin/table-requests/{rid}",
                      json={"status": "foo"}, headers=auth)
        assert r.status_code == 422

    def test_patch_missing_404(self, api, auth):
        r = api.patch(f"{BASE_URL}/api/admin/table-requests/does-not-exist",
                      json={"status": "confirmed"}, headers=auth)
        assert r.status_code == 404

    def test_zzz_delete_all_and_missing_404(self, api, auth):
        for rid in list(created_ids):
            r = api.delete(f"{BASE_URL}/api/admin/table-requests/{rid}", headers=auth)
            assert r.status_code == 200
        # re-delete → 404
        if created_ids:
            r = api.delete(f"{BASE_URL}/api/admin/table-requests/{created_ids[0]}", headers=auth)
            assert r.status_code == 404


# --- CHAT (max 3 calls total) ---
CHAT_SESSION = "qa-session-12345"


def _consume_sse(resp):
    deltas = []
    done = False
    for raw in resp.iter_lines(decode_unicode=True):
        if not raw:
            continue
        if not raw.startswith("data: "):
            continue
        payload = raw[6:]
        if payload == "[DONE]":
            done = True
            break
        try:
            obj = json.loads(payload)
        except Exception:
            continue
        if "delta" in obj:
            deltas.append(obj["delta"])
    return "".join(deltas), done


class TestChat:
    def test_chat_validation_short_session(self, api):
        r = api.post(f"{BASE_URL}/api/chat",
                     json={"session_id": "abc", "message": "hi", "site": "malaga", "lang": "it"})
        assert r.status_code == 422

    def test_chat_validation_bad_site(self, api):
        r = api.post(f"{BASE_URL}/api/chat",
                     json={"session_id": "qa-session-99999", "message": "hi", "site": "roma", "lang": "it"})
        assert r.status_code == 422

    def test_chat_stream_and_history(self, api):
        # cleanup existing history for this session (no direct API; ok if not empty)
        r = requests.post(f"{BASE_URL}/api/chat", stream=True,
                          json={"session_id": CHAT_SESSION,
                                "message": "Quanto costano i calamari fritti grandi e a che ora aprite?",
                                "site": "malaga", "lang": "it"})
        assert r.status_code == 200
        assert "text/event-stream" in r.headers.get("Content-Type", "")
        text, done = _consume_sse(r)
        assert done, "no [DONE] marker"
        assert text.strip(), "empty streaming response"
        # Should mention price 14 and opening hours 12
        assert "14" in text, f"expected 14 in response: {text[:400]}"
        assert re.search(r"12", text), f"expected 12(:00) in response: {text[:400]}"

        # history
        h = api.get(f"{BASE_URL}/api/chat/{CHAT_SESSION}")
        assert h.status_code == 200
        msgs = h.json()
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles
        assert len(msgs) >= 2

    def test_chat_multiturn(self, api):
        r = requests.post(f"{BASE_URL}/api/chat", stream=True,
                          json={"session_id": CHAT_SESSION, "message": "E a Sliema?",
                                "site": "malta", "lang": "it"})
        assert r.status_code == 200
        text, done = _consume_sse(r)
        assert done
        assert text.strip(), "empty second-turn response"

    def test_zzz_cleanup_chat_history(self, api):
        # not exposed via API; leave a marker
        pass
