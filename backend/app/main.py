import os
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel, field_validator
from fastapi.middleware.cors import CORSMiddleware
import httpx
from app.chains.guardrail import analyze_security
from litellm import completion

# Map our provider ids to LiteLLM model prefix (so api_key is used, not Vertex/Cloud defaults)
LITELLM_PROVIDER_PREFIX = {
    "google": "gemini",  
    "gemini": "gemini",  
    "grok": "xai",        
    "meta": "meta-llama", 
    "together": "together_ai",
    "openai": "openai",   
    "anthropic": "anthropic",
    "mistral": "mistral",
    "cohere": "cohere",
    "other": None,
}
# All other providers (openai, anthropic, deepseek, gemini, openrouter, mistral, cohere) use same id

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache; if key missing (e.g. after restart), we resolve from Next.js DB via resolve-key
API_KEY_MAPPING: dict[str, dict] = {}
FRONTEND_URL = (os.getenv("FRONTEND_URL") or "http://localhost:3000").rstrip("/")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "")

class ScanRequest(BaseModel):
    text: str
    # Optional full chat messages for future use
    messages: list = None


class ScanOnlyRequest(BaseModel):
    """Body for /scan – text only; used by MCP agent and other clients."""
    text: str

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("text must be non-empty")
        return v

# Request body for registering a new key (from Next.js dashboard)
class RegisterKeyRequest(BaseModel):
    gateway_key: str
    provider: str
    model: str
    target_api_key: str  # Customer's actual API key

class UnregisterKeyRequest(BaseModel):
    gateway_key: str


class ListModelsRequest(BaseModel):
    """Body for /list-models: list models from provider using user's API key."""
    provider: str
    api_key: str


async def get_user_config(x_api_key: str = Header(None)):
    """Resolve gateway key: in-memory cache first, then Next.js resolve-key (DB)."""
    if x_api_key is None:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    user_config = API_KEY_MAPPING.get(x_api_key)
    if user_config:
        out = dict(user_config)
        out["_gateway_key"] = x_api_key
        return out
    # Fallback: resolve from Redacted DB (set INTERNAL_API_SECRET + FRONTEND_URL for this)
    if not INTERNAL_API_SECRET:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{FRONTEND_URL}/api/internal/resolve-key",
                params={"key": x_api_key},
                headers={"Internal-Secret": INTERNAL_API_SECRET},
            )
        if r.status_code != 200:
            raise HTTPException(status_code=403, detail="Invalid API Key")
        data = r.json()
        user_config = {
            "provider": data.get("provider", ""),
            "model": data.get("model") or "",
            "api_key": data.get("customerApiKey", ""),
        }
        if not user_config["api_key"]:
            raise HTTPException(status_code=403, detail="Invalid API Key")
        API_KEY_MAPPING[x_api_key] = {k: v for k, v in user_config.items()}
        user_config["_gateway_key"] = x_api_key
        return user_config
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid API Key")


def _send_log(gateway_key: str, status: str, violation_reason: str | None = None, provider: str | None = None, model: str | None = None):
    """Fire-and-forget: POST to Next.js internal log so dashboard Logs page can show activity."""
    if not INTERNAL_API_SECRET or not FRONTEND_URL:
        return
    payload = {"gatewayKey": gateway_key, "status": status}
    if violation_reason:
        payload["violationReason"] = violation_reason
    if provider:
        payload["provider"] = provider
    if model:
        payload["model"] = model
    try:
        import threading
        def _post():
            httpx.post(
                f"{FRONTEND_URL}/api/internal/log",
                json=payload,
                headers={"Internal-Secret": INTERNAL_API_SECRET},
                timeout=5.0,
            )
        threading.Thread(target=_post, daemon=True).start()
    except Exception:
        pass


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Server is running 🚀"}


def _list_models_gemini(api_key: str) -> list[dict]:
    """GET Google Gemini v1beta models; returns [{ id, label }]."""
    r = httpx.get(
        "https://generativelanguage.googleapis.com/v1beta/models",
        params={"key": api_key},
        timeout=15.0,
    )
    r.raise_for_status()
    data = r.json()
    out = []
    for m in data.get("models") or []:
        name = m.get("name", "")
        if name.startswith("models/"):
            name = name[7:]
        if not name or "embedding" in name.lower():
            continue
        methods = m.get("supportedGenerationMethods") or []
        if methods and "generateContent" not in methods:
            continue
        out.append({"id": name, "label": m.get("displayName") or name})
    return out


def _list_models_openai(api_key: str) -> list[dict]:
    """GET OpenAI /v1/models; returns [{ id, label }]."""
    r = httpx.get(
        "https://api.openai.com/v1/models",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=15.0,
    )
    r.raise_for_status()
    data = r.json()
    out = []
    for m in data.get("data") or []:
        mid = m.get("id", "")
        if not mid:
            continue
        out.append({"id": mid, "label": mid})
    return out


@app.post("/list-models")
def list_models(req: ListModelsRequest):
    """Return models for the given provider using the user's API key (for dashboard dropdown)."""
    if not req.api_key or not req.provider:
        return {"models": []}
    provider = req.provider.lower()
    try:
        if provider == "gemini":
            models = _list_models_gemini(req.api_key.strip())
        elif provider == "openai":
            models = _list_models_openai(req.api_key.strip())
        else:
            # Anthropic etc. don't have a simple list endpoint; Redacted will use OpenRouter + custom
            return {"models": []}
        return {"models": models}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Provider returned {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# Register key endpoint (called by Next.js when user connects a provider)
@app.post("/register-key")
def register_key(req: RegisterKeyRequest):
    """Stores mapping from gateway key to customer API key."""
    if not req.gateway_key.startswith("sk-redacted-"):
        raise HTTPException(status_code=400, detail="Invalid gateway key format")
    
    API_KEY_MAPPING[req.gateway_key] = {
        "provider": req.provider,
        "model": req.model,
        "api_key": req.target_api_key
    }
    return {"status": "registered"}

# Scan-only endpoint: run guardrail on text, return safe/blocked (no LLM call).
# Used by MCP agent (Claude Desktop tool) and any client that only needs security check.
@app.post("/scan")
def scan_text(req: ScanOnlyRequest, user_config: dict = Depends(get_user_config)):
    """Scans text for PII, prompt injection, policy violations. Returns is_safe, violated_rule, reason, risk_score."""
    result = analyze_security(req.text)
    return {
        "is_safe": result["is_safe"],
        "violated_rule": result.get("violated_rule", ""),
        "reason": result.get("reason", ""),
        "risk_score": result.get("risk_score", 0),
    }


# Demo scan: public endpoint for homepage demo (no auth required, guardrail only)
@app.post("/demo-scan")
def demo_scan(req: ScanOnlyRequest):
    """Public guardrail check for the landing page demo. No API key needed."""
    result = analyze_security(req.text)
    return {
        "is_safe": result["is_safe"],
        "violated_rule": result.get("violated_rule", ""),
        "reason": result.get("reason", ""),
        "risk_score": result.get("risk_score", 0),
    }


# Unregister key (called by Next.js when user deletes a connection)
@app.post("/unregister-key")
def unregister_key(req: UnregisterKeyRequest):
    """Removes gateway key from in-memory mapping."""
    if req.gateway_key in API_KEY_MAPPING:
        del API_KEY_MAPPING[req.gateway_key]
    return {"status": "unregistered"}

# Main proxy: runs security check then forwards to LLM
@app.post("/v1/chat/completions")
def chat_proxy(request: ScanRequest, user_config: dict = Depends(get_user_config)):
    user_input = request.text
    gateway_key = user_config.get("_gateway_key", "")

    # 1. Security check
    security_result = analyze_security(user_input)

    if not security_result["is_safe"]:
        _send_log(
            gateway_key,
            "blocked",
            violation_reason=security_result.get("reason") or security_result.get("violated_rule"),
            provider=user_config.get("provider"),
            model=user_config.get("model"),
        )
        return {
            "error": {
                "message": "Request blocked by Redacted Security Gateway",
                "violation": security_result["violated_rule"],
                "reason": security_result["reason"]
            }
        }

    print("  → Guardrail passed, calling LLM...")
    
    # 2. בניית שם המודל בצורה בטוחה 🛠️
    try:
        provider = user_config.get("provider", "").lower()
        raw_model = user_config["model"]
        
        # מציאת הקידומת הנכונה ל-LiteLLM (למשל: gemini, openai, xai)
        target_prefix = LITELLM_PROVIDER_PREFIX.get(provider) or provider
        
        # לוגיקה לתיקון המודל:
        # אם אנחנו יודעים מה הקידומת הנכונה, אנחנו נכפה אותה.
        if target_prefix and target_prefix != "other":
            
            # אם המודל מגיע עם לוכסן (למשל google/gemini-pro), ננקה את הקידומת הישנה
            if "/" in raw_model:
                _, model_suffix = raw_model.split("/", 1)
            else:
                model_suffix = raw_model
                
            # הרכבה מחדש: gemini/gemini-2.5-pro
            final_model = f"{target_prefix}/{model_suffix}"
        else:
            # במקרה של 'other' או openrouter, משאירים כמו שזה
            final_model = raw_model

        print(f"  → Calling LLM: {final_model} (timeout 90s)")
        
        response = completion(
            model=final_model,
            api_key=user_config["api_key"],
            messages=[{"role": "user", "content": user_input}],
            timeout=90,
        )
        print("  → LLM response received")
        _send_log(
            gateway_key,
            "passed",
            provider=user_config.get("provider"),
            model=user_config.get("model"),
        )
        return {
            "security_check": "passed",
            "risk_score": security_result["risk_score"],
            "data": response
        }
    except Exception as e:
        print(f"  → LLM error: {e}")
        raise HTTPException(status_code=500, detail=f"Upstream LLM Error: {str(e)}")
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)