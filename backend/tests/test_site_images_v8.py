"""Iteration 8: site-images (hero/bg/videos per site) + Range video streaming."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_PW = os.environ.get("ADMIN_PASSWORD", "")


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def site_images():
    r = requests.get(f"{BASE_URL}/api/site-images", timeout=15)
    assert r.status_code == 200
    return r.json()


def test_site_images_contains_required_keys(site_images):
    for k in ["hero-malaga", "hero-malta", "bg-malaga", "bg-malta", "hero-video-malta"]:
        assert k in site_images, f"missing key {k}"
        assert site_images[k], f"empty value for {k}: {site_images[k]!r}"
    # hero-video-malaga must be present, and per request expected empty string
    assert "hero-video-malaga" in site_images
    assert site_images["hero-video-malaga"] == "", f"hero-video-malaga should be '', got {site_images['hero-video-malaga']!r}"


def test_put_bg_malaga_idempotent_rewrite(site_images, admin_token):
    current = site_images["bg-malaga"]
    r = requests.put(
        f"{BASE_URL}/api/admin/site-images/bg-malaga",
        json={"value": current},
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    # verify persistence unchanged
    r2 = requests.get(f"{BASE_URL}/api/site-images", timeout=15)
    assert r2.json()["bg-malaga"] == current


def test_put_invalid_key_returns_404(admin_token):
    r = requests.put(
        f"{BASE_URL}/api/admin/site-images/bg-roma",
        json={"value": "/api/files/kalama/whatever.jpg"},
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=15,
    )
    assert r.status_code == 404, f"expected 404, got {r.status_code}: {r.text}"


def test_video_range_request(site_images):
    video_url = site_images["hero-video-malta"]
    assert video_url.startswith("/api/files/"), video_url
    full = f"{BASE_URL}{video_url}"
    # Range request
    r = requests.get(full, headers={"Range": "bytes=0-99"}, timeout=15)
    assert r.status_code == 206, f"expected 206, got {r.status_code}"
    assert "Content-Range" in r.headers, r.headers
    assert r.headers.get("Accept-Ranges") == "bytes"
    # Non-range
    r2 = requests.get(full, timeout=30)
    assert r2.status_code == 200
    assert r2.headers.get("Content-Type", "").startswith("video/mp4"), r2.headers.get("Content-Type")
