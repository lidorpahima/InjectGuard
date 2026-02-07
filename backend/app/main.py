import secrets
import os
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app.chains.guardrail import analyze_security

# LiteLLM: unified interface to call any LLM provider
from litellm import completion 

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory key mapping (use Redis/DB in production)
# Shape: { "sk-redacted-XYZ": { "provider": "openai", "model": "gpt-4o", "api_key": "sk-..." } }
API_KEY_MAPPING = {}

class ScanRequest(BaseModel):
    text: str
    # Optional full chat messages for future use
    messages: list = None


class ScanOnlyRequest(BaseModel):
    """Body for /scan – text only; used by MCP agent and other clients."""
    text: str

# Request body for registering a new key (from Next.js dashboard)
class RegisterKeyRequest(BaseModel):
    gateway_key: str
    provider: str
    model: str
    target_api_key: str  # Customer's actual API key

class UnregisterKeyRequest(BaseModel):
    gateway_key: str

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Server is running 🚀"}

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


# Unregister key (called by Next.js when user deletes a connection)
@app.post("/unregister-key")
def unregister_key(req: UnregisterKeyRequest):
    """Removes gateway key from in-memory mapping."""
    if req.gateway_key in API_KEY_MAPPING:
        del API_KEY_MAPPING[req.gateway_key]
    return {"status": "unregistered"}

# Validate API key and load user config
async def get_user_config(x_api_key: str = Header(None)):
    if x_api_key is None:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    
    user_config = API_KEY_MAPPING.get(x_api_key)
    if not user_config:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    
    return user_config

# Main proxy: runs security check then forwards to LLM
@app.post("/v1/chat/completions")  # OpenAI-compatible path
def chat_proxy(request: ScanRequest, user_config: dict = Depends(get_user_config)):
    user_input = request.text

    # 1. Security check (guardrail)
    security_result = analyze_security(user_input)

    # Block request if unsafe; do not call LLM
    if not security_result["is_safe"]:
        return {
            "error": {
                "message": "Request blocked by Redacted Security Gateway",
                "violation": security_result["violated_rule"],
                "reason": security_result["reason"]
            }
        }

    # 2. If safe, forward to upstream LLM
    try:
        # LiteLLM supports OpenAI, Claude, Gemini, etc.
        response = completion(
            model=user_config["model"],   # Model chosen by user
            api_key=user_config["api_key"],  # User's API key
            messages=[{"role": "user", "content": user_input}]
        )

        # Return model response plus security-passed stamp
        return {
            "security_check": "passed",
            "risk_score": security_result["risk_score"],
            "data": response  # Raw response from upstream LLM
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upstream LLM Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)