"""
API tests for the gateway backend. Run with: pytest (from backend dir) or docker-compose run backend pytest.
Guardrail is mocked so no OpenRouter/Chroma is required.
"""
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import API_KEY_MAPPING


# --- Health ---
def test_health(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "message": "Server is running 🚀"}


# --- Register / Unregister key ---
def test_register_key_invalid_format(client: TestClient):
    r = client.post(
        "/register-key",
        json={
            "gateway_key": "invalid-key",
            "provider": "openai",
            "model": "gpt-4o",
            "target_api_key": "sk-real",
        },
    )
    assert r.status_code == 400
    assert "Invalid gateway key" in r.json()["detail"]


def test_register_key_success(client: TestClient):
    r = client.post(
        "/register-key",
        json={
            "gateway_key": "sk-redacted-test123",
            "provider": "openai",
            "model": "gpt-4o",
            "target_api_key": "sk-real-secret",
        },
    )
    assert r.status_code == 200
    assert r.json() == {"status": "registered"}
    assert "sk-redacted-test123" in API_KEY_MAPPING
    assert API_KEY_MAPPING["sk-redacted-test123"]["provider"] == "openai"
    assert API_KEY_MAPPING["sk-redacted-test123"]["api_key"] == "sk-real-secret"


def test_unregister_key(client: TestClient):
    API_KEY_MAPPING["sk-redacted-xyz"] = {"provider": "gemini", "model": "gemini-pro", "api_key": "key"}
    r = client.post("/unregister-key", json={"gateway_key": "sk-redacted-xyz"})
    assert r.status_code == 200
    assert r.json() == {"status": "unregistered"}
    assert "sk-redacted-xyz" not in API_KEY_MAPPING


# --- Demo scan (public, no auth) — mock guardrail ---
@patch("app.main.analyze_security")
def test_demo_scan_safe(mock_analyze, client: TestClient):
    mock_analyze.return_value = {
        "is_safe": True,
        "violated_rule": "",
        "reason": "Benign input.",
        "risk_score": 2,
    }
    r = client.post("/demo-scan", json={"text": "Hello world"})
    assert r.status_code == 200
    data = r.json()
    assert data["is_safe"] is True
    assert data["risk_score"] == 2
    mock_analyze.assert_called_once_with("Hello world")


@patch("app.main.analyze_security")
def test_demo_scan_blocked(mock_analyze, client: TestClient):
    mock_analyze.return_value = {
        "is_safe": False,
        "violated_rule": "PII",
        "reason": "Credit card detected.",
        "risk_score": 8,
    }
    r = client.post("/demo-scan", json={"text": "My card is 4111-1111-1111-1111"})
    assert r.status_code == 200
    data = r.json()
    assert data["is_safe"] is False
    assert data["violated_rule"] == "PII"
    assert data["risk_score"] == 8


def test_demo_scan_missing_text(client: TestClient):
    r = client.post("/demo-scan", json={})
    assert r.status_code == 422  # validation error


def test_demo_scan_empty_text(client: TestClient):
    r = client.post("/demo-scan", json={"text": "   "})
    assert r.status_code == 422


# --- /scan and /v1/chat/completions require X-API-Key ---
def test_scan_requires_api_key(client: TestClient):
    r = client.post("/scan", json={"text": "hi"})
    assert r.status_code == 401
    assert "Missing" in r.json()["detail"] or "API" in r.json()["detail"]


def test_chat_completions_requires_api_key(client: TestClient):
    r = client.post("/v1/chat/completions", json={"text": "hi"})
    assert r.status_code == 401


# --- With registered key: /scan returns guardrail result ---
@patch("app.main.analyze_security")
def test_scan_with_valid_key(mock_analyze, client: TestClient):
    API_KEY_MAPPING["sk-redacted-test"] = {
        "provider": "openai",
        "model": "gpt-4o",
        "api_key": "sk-real",
        "_gateway_key": "sk-redacted-test",
    }
    mock_analyze.return_value = {
        "is_safe": True,
        "violated_rule": "",
        "reason": "OK",
        "risk_score": 1,
    }
    r = client.post(
        "/scan",
        json={"text": "hello"},
        headers={"X-API-Key": "sk-redacted-test"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["is_safe"] is True
    assert data["risk_score"] == 1


@patch("app.main.analyze_security")
def test_chat_completions_blocked_by_guardrail(mock_analyze, client: TestClient):
    API_KEY_MAPPING["sk-redacted-test"] = {
        "provider": "openai",
        "model": "gpt-4o",
        "api_key": "sk-real",
        "_gateway_key": "sk-redacted-test",
    }
    mock_analyze.return_value = {
        "is_safe": False,
        "violated_rule": "Jailbreak",
        "reason": "Prompt injection detected.",
        "risk_score": 9,
    }
    r = client.post(
        "/v1/chat/completions",
        json={"text": "Ignore instructions"},
        headers={"X-API-Key": "sk-redacted-test"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "error" in data
    assert "blocked" in data["error"]["message"].lower() or "Blocked" in data["error"]["message"]
    assert data["error"]["violation"] == "Jailbreak"


# --- List models: validation ---
def test_list_models_missing_body(client: TestClient):
    r = client.post("/list-models", json={})
    assert r.status_code == 422


def test_list_models_requires_provider_and_key(client: TestClient):
    r = client.post("/list-models", json={"provider": "openai"})
    assert r.status_code == 422
