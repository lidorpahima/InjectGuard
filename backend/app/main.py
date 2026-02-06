from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app.chains.guardrail import analyze_security
app = FastAPI()

# This allows the server to accept requests from anywhere (great for development)
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Define request structure (Input Schema) ---
# React will send us JSON that looks like: { "text": "Some text" }
class ScanRequest(BaseModel):
    text: str

# --- Simple health check endpoint ---
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Server is running 🚀"}

# --- Main endpoint: Security scanning ---
@app.post("/scan")
def scan_text(request: ScanRequest):
    try:
        # Here we call the security analysis function we built earlier
        result = analyze_security(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)