"""Budget Yatra backend regression + contact-reveal bug-fix tests."""
import os
import time
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_token():
    """Seed a fresh user + session directly in mongo via pymongo."""
    from pymongo import MongoClient
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'budget_yatra')
    mc = MongoClient(mongo_url)
    db = mc[db_name]
    user_id = f"test-user-{uuid.uuid4().hex[:10]}"
    token = f"test_session_{uuid.uuid4().hex}"
    db.users.insert_one({
        "user_id": user_id,
        "phone_number": "+91 98765 43210",
        "name": "Test Yatri",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    yield {"token": token, "user_id": user_id}
    # cleanup
    db.user_sessions.delete_one({"session_token": token})
    db.users.delete_one({"user_id": user_id})


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token['token']}", "Content-Type": "application/json"}


# ---------- Image fix tests ----------
class TestHeroImages:
    def test_sikkim_hero_image_reachable(self, api_client):
        r = api_client.get(f"{API}/destinations/sikkim", timeout=15)
        assert r.status_code == 200, r.text
        hero = r.json().get("hero_image")
        assert hero, "hero_image missing"
        assert "pexels.com/photos/2662116" in hero
        img = requests.get(hero, timeout=20, allow_redirects=True)
        assert img.status_code == 200, f"Sikkim hero image returned {img.status_code}"

    def test_tawang_hero_image_reachable(self, api_client):
        r = api_client.get(f"{API}/destinations/tawang", timeout=15)
        assert r.status_code == 200, r.text
        hero = r.json().get("hero_image")
        assert hero, "hero_image missing"
        assert "pexels.com/photos/417173" in hero
        img = requests.get(hero, timeout=20, allow_redirects=True)
        assert img.status_code == 200, f"Tawang hero image returned {img.status_code}"


# ---------- Contact-strip tests ----------
class TestContactStrip:
    def test_ladakh_no_phone_in_partners(self, api_client):
        r = api_client.get(f"{API}/destinations/ladakh", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for r_item in d.get("rentals", []):
            assert "phone" not in r_item, f"Rental leaked phone: {r_item}"
        for g_item in d.get("guides", []):
            assert "phone" not in g_item, f"Guide leaked phone: {g_item}"

    def test_list_destinations_no_phone_anywhere(self, api_client):
        r = api_client.get(f"{API}/destinations", timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) >= 11, f"expected 11+ destinations, got {len(arr)}"
        for d in arr:
            for item in d.get("rentals", []) + d.get("guides", []):
                assert "phone" not in item, f"{d['slug']} leaked phone in {item.get('name')}"


# ---------- Reveal endpoint tests ----------
class TestPartnerReveal:
    def test_reveal_without_auth_returns_401(self, api_client):
        r = api_client.post(f"{API}/partners/reveal", json={
            "destination_slug": "ladakh",
            "partner_type": "rental",
            "partner_name": "Ladakh Bike House, Fort Road",
        })
        assert r.status_code == 401, r.text

    def test_reveal_with_auth_returns_phone(self, api_client, auth_headers):
        r = api_client.post(f"{API}/partners/reveal",
                            headers=auth_headers,
                            json={
                                "destination_slug": "ladakh",
                                "partner_type": "rental",
                                "partner_name": "Ladakh Bike House, Fort Road",
                            })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "Ladakh Bike House, Fort Road"
        assert isinstance(data.get("phone"), str)
        assert data["phone"].startswith("+91"), f"phone format wrong: {data['phone']}"

    def test_reveal_count_incremented(self, api_client, auth_headers):
        # ensure at least one reveal exists (call again)
        api_client.post(f"{API}/partners/reveal", headers=auth_headers, json={
            "destination_slug": "ladakh", "partner_type": "rental",
            "partner_name": "Ladakh Bike House, Fort Road"})
        r = api_client.get(f"{API}/partners/reveal-count/ladakh", timeout=10)
        assert r.status_code == 200
        counts = r.json()
        assert "Ladakh Bike House, Fort Road" in counts
        assert counts["Ladakh Bike House, Fort Road"] >= 1

    def test_reveal_invalid_partner_type(self, api_client, auth_headers):
        r = api_client.post(f"{API}/partners/reveal", headers=auth_headers, json={
            "destination_slug": "ladakh",
            "partner_type": "invalid",
            "partner_name": "Ladakh Bike House, Fort Road",
        })
        assert r.status_code == 400, r.text

    def test_reveal_partner_not_found(self, api_client, auth_headers):
        r = api_client.post(f"{API}/partners/reveal", headers=auth_headers, json={
            "destination_slug": "ladakh",
            "partner_type": "rental",
            "partner_name": "Nonexistent Partner XYZ",
        })
        assert r.status_code == 404, r.text


# ---------- Partner ratings regression ----------
class TestPartnerRatings:
    def test_rate_partner_and_read_aggregated(self, api_client, auth_headers):
        r = api_client.post(f"{API}/partners/rate", headers=auth_headers, json={
            "destination_slug": "ladakh",
            "partner_type": "rental",
            "partner_name": "Ladakh Bike House, Fort Road",
            "rating": 5,
            "comment": "TEST_great",
        })
        assert r.status_code == 200, r.text
        r2 = api_client.get(f"{API}/destinations/ladakh/partner-ratings", timeout=10)
        assert r2.status_code == 200
        agg = r2.json()
        entry = agg.get("Ladakh Bike House, Fort Road")
        assert entry is not None
        assert "avg" in entry and "count" in entry and "recent" in entry
        assert entry["count"] >= 1
        assert isinstance(entry["recent"], list)


# ---------- Regression tests ----------
class TestRegressionEndpoints:
    def test_list_destinations_count(self, api_client):
        r = api_client.get(f"{API}/destinations", timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert len(arr) >= 11

    def test_meghalaya_full_no_phone(self, api_client):
        r = api_client.get(f"{API}/destinations/meghalaya", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == "meghalaya"
        for item in d.get("rentals", []) + d.get("guides", []):
            assert "phone" not in item

    def test_stories_list(self, api_client):
        r = api_client.get(f"{API}/stories", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_trip_plan_generates(self, api_client):
        r = api_client.post(f"{API}/trip/plan", timeout=45, json={
            "destination_slug": "meghalaya", "days": 2, "budget": 3000, "travel_style": "chill"
        })
        # allow either 200 (Gemini success) or 500 (transient AI failure). Prefer 200.
        assert r.status_code == 200, f"trip/plan failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        assert "days" in data and isinstance(data["days"], list) and len(data["days"]) >= 1

    def test_chat_stream_sse(self, api_client):
        payload = {"session_id": f"test_{uuid.uuid4().hex[:8]}", "message": "hi", "destination_slug": "ladakh"}
        r = api_client.post(f"{API}/chat/stream", json=payload, stream=True, timeout=30)
        assert r.status_code == 200
        got_delta = False
        got_done = False
        start = time.time()
        for line in r.iter_lines(decode_unicode=True):
            if time.time() - start > 25:
                break
            if not line:
                continue
            if line.startswith("data: "):
                if '"delta"' in line:
                    got_delta = True
                if '"done": true' in line or '"done":true' in line:
                    got_done = True
                    break
        r.close()
        assert got_delta or got_done, "no SSE deltas or done event received"


# ---------- Phone OTP Auth Tests ----------
class TestPhoneOtpAuth:
    def test_send_otp_success(self, api_client):
        r = api_client.post(f"{API}/auth/send-otp", json={"phone_number": "9876543210"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "debug_otp" in data
        assert len(data["debug_otp"]) == 6

    def test_verify_otp_success(self, api_client):
        phone = "9876543210"
        r_send = api_client.post(f"{API}/auth/send-otp", json={"phone_number": phone})
        otp = r_send.json()["debug_otp"]
        
        r_verify = api_client.post(f"{API}/auth/verify-otp", json={
            "phone_number": phone,
            "otp": otp,
            "name": "Test Yatri"
        })
        assert r_verify.status_code == 200, r_verify.text
        user = r_verify.json()["user"]
        assert user["name"] == "Test Yatri"
        assert user["phone_number"] == "+91 98765 43210"

