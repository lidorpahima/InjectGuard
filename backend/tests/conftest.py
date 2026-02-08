"""
Pytest fixtures: shared client and mocks so tests don't call real LLM/Chroma.
"""
import pytest
from fastapi.testclient import TestClient

# Import app after env is set so guardrail doesn't fail on missing OPENROUTER_API_KEY
from app.main import app, API_KEY_MAPPING


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_api_key_mapping():
    """Clear in-memory key cache before each test so tests don't leak state."""
    before = dict(API_KEY_MAPPING)
    yield
    API_KEY_MAPPING.clear()
    API_KEY_MAPPING.update(before)
