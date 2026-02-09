<div align="center">

# <img src="Redacted/public/assets/logo.png" alt="Redacted" width="28" height="28" /> Redacted 

###  AI Security Gateway

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)
[![LangChain](https://img.shields.io/badge/🦜_LangChain-1C3C3C?style=for-the-badge)](https://langchain.com/)

<br/>

**A smart API gateway that sits between your apps and LLM providers.**
**Every request is inspected for threats before reaching the model.**

**Live product:** [redactedme.com](https://redactedme.com/)

<br/>

[🚀 Quick Start](#-getting-started) · [📐 Architecture](#-architecture-overview) · [🔑 API Docs](#-backend-api) · [🤖 MCP Integration](#-mcp-integration-claude-desktop)

<br/>
 <img src="Redacted/public/assets/dashboard-dark.png" alt="Redacted"  />

```
  Your App ──▶ 🔐 Redacted Gateway ──▶ OpenAI / Gemini / Claude / Grok / 100+ models
                       │
                 ┌─────┴──────┐
                 │  🛡️ Guardrail │
                 │    Engine    │
                 └─────────────┘
              Jailbreak · PII · Policy
```

</div>

---

## ✨ How It Works

> **Connect** your API key & model → **Get** a gateway key → **Use** it in your app. We handle the rest.

From the live product at [redactedme.com](https://redactedme.com/), the value prop is:

- **Secure your LLM traffic**: every prompt goes through a security gateway before it ever touches OpenAI, Gemini, Claude, Grok, etc.
- **Enforce your own policies**: use custom rules + policy documents to block things like investment advice, profanity, or data exfiltration.
- **Stay fast and cost‑efficient**: cached responses turn repeated questions into \~20 ms answers instead of another full LLM call.

| Step | What happens |
|:----:|:-------------|
| **1** | 👤 You log into the Dashboard, pick a provider (OpenAI, Gemini, Claude…) and enter your real API key |
| **2** | 🔑 Redacted generates a **gateway key** `sk-redacted-xyz...` — your real key is never exposed |
| **3** | 📱 Your app sends requests to Redacted with the gateway key |
| **4** | 🛡️ Every message is scanned — jailbreak, PII, policy violations — before it touches the LLM |
| **5** | ✅ Safe requests are forwarded to the provider. Threats are blocked instantly |

---

## 📐 Architecture Overview

The system is split into two planes:

> 🟢 **Control Plane** (Next.js) — configure providers, keys, and policies via the Dashboard
>
> 🟣 **Data Plane** (Python/FastAPI) — real-time traffic inspection, routing, and proxying

```mermaid
graph LR
    subgraph CP["🟢 Control Plane"]
        Dashboard["📊 Dashboard<br/><i>Next.js · Clerk</i>"]
        DB["🗄️ MongoDB<br/><i>Prisma ORM</i>"]
    end

    subgraph DP["🟣 Data Plane"]
        Gateway["🛡️ Security Gateway<br/><i>FastAPI</i>"]
        Guard["🔒 Guardrail Engine<br/><i>LangChain · ChromaDB</i>"]
        Router["🔌 LiteLLM Router<br/><i>100+ Models</i>"]
        Cache["⚡ Cache<br/><i>In-Memory → Redis</i>"]
    end

    Client["👨‍💻 Client App"] -->|"🔑 X-API-Key"| Gateway
    Gateway -->|"🔍 analyze"| Guard
    Guard -->|"📚 RAG query"| ChromaDB["📚 Policy Store<br/><i>ChromaDB</i>"]
    Gateway -->|"✅ if safe"| Router
    Router -->|"☁️ completion"| Providers["☁️ LLM Providers<br/><i>OpenAI · Gemini · Claude · Grok</i>"]
    Providers -->|"📨 response"| Client

    Dashboard -->|"📝 register-key"| Gateway
    Dashboard -->|"💾 CRUD"| DB
    Gateway -->|"⚡ resolve key"| Cache
    Cache -.->|"🔄 fallback"| DB

    MCP["🤖 MCP<br/><i>Claude Desktop</i>"] -->|"🔍 /scan"| Gateway

    style Gateway fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style Guard fill:#2d1515,stroke:#f87171,color:#e2e8f0
    style Router fill:#0c2d3e,stroke:#22d3ee,color:#e2e8f0
    style Dashboard fill:#0d2818,stroke:#34d399,color:#e2e8f0
    style Providers fill:#2d1a2e,stroke:#f472b6,color:#e2e8f0
    style Client fill:#1a2332,stroke:#60a5fa,color:#e2e8f0
    style DB fill:#2d2300,stroke:#fbbf24,color:#e2e8f0
    style Cache fill:#2d1a00,stroke:#fb923c,color:#e2e8f0
    style ChromaDB fill:#2d2300,stroke:#fbbf24,color:#e2e8f0
    style MCP fill:#1e1b4b,stroke:#a78bfa,color:#e2e8f0
```

---

## ⚙️ Setup Flow — Key Registration

> _This happens once, when a user logs into the Dashboard and connects a provider._

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant Dashboard as 📊 Dashboard<br/>Next.js
    participant DB as 🗄️ MongoDB<br/>Prisma
    participant Backend as ⚡ FastAPI<br/>Backend
    participant Mem as 🧠 In-Memory<br/>Cache

    User->>Dashboard: 1️⃣ Select provider + model + enter API key
    Dashboard->>Dashboard: 2️⃣ Generate sk-redacted-xyz...
    Dashboard->>DB: 3️⃣ Store gateway_key ↔ provider + model + real_key
    Dashboard->>Backend: 4️⃣ POST /register-key
    Backend->>Mem: 5️⃣ Cache mapping for instant lookup
    Dashboard-->>User: 6️⃣ Show gateway key (once! 🔐)

    Note over User,Mem: 🔒 The real API key is never exposed.<br/>User only sees sk-redacted-xyz.
```

<details>
<summary>📋 <b>Step by step breakdown</b></summary>

<br/>

| # | Component | What happens |
|:-:|:---------:|:-------------|
| 1️⃣ | 👤 **User** | Logs into Dashboard, selects a provider (e.g. Google Gemini), enters their real API key, chooses a model |
| 2️⃣ | ▲ **Next.js** | Generates a virtual gateway key `sk-redacted-xyz...` |
| 3️⃣ | 🗄️ **MongoDB** | Stores the mapping: `gateway_key ↔ provider + model + real_api_key` |
| 4️⃣ | ⚡ **FastAPI** | Receives `POST /register-key` from Next.js |
| 5️⃣ | 🧠 **Cache** | Key mapping saved in RAM for instant resolution |
| 6️⃣ | 🔑 **Gateway Key** | Shown once to the user — the real key is never exposed |

</details>

---

## ⚡ Runtime Flow — Request Processing

> _The critical path — what happens when your app sends a request. Must be fast._

```mermaid
sequenceDiagram
    actor Client as 📱 Client App
    participant GW as 🛡️ Gateway<br/>FastAPI
    participant Auth as 🔑 Auth<br/>Key Resolution
    participant Guard as 🔒 Guardrail<br/>LangChain
    participant Chroma as 📚 ChromaDB<br/>Policies
    participant Adapt as 🔌 LiteLLM<br/>Adapter
    participant LLM as ☁️ LLM Provider

    Client->>GW: POST /v1/chat/completions<br/>🔑 X-API-Key: sk-redacted-xyz
    GW->>Auth: Who is sk-redacted-xyz? 🤔
    Auth-->>GW: ✅ Google Gemini · gemini-2.5-pro

    rect rgb(45, 21, 21)
        Note over GW,Chroma: 🛡️ SECURITY CHECKPOINT
        GW->>Guard: 🔍 Analyze user message
        Guard->>Chroma: 📚 Similarity search (top 2 policies)
        Chroma-->>Guard: 📄 Relevant policy chunks
        Guard-->>GW: 📊 SecurityAssessment
    end

    alt 🔴 THREAT DETECTED
        GW-->>Client: ❌ 400 — Blocked by Redacted
    else 🟢 ALL CLEAR
        GW->>Adapt: 🔌 Translate model name
        Adapt->>LLM: ☁️ completion() with real API key
        LLM-->>Adapt: 💬 Model response
        Adapt-->>GW: 📨 Response
        GW-->>Client: ✅ Response + "Security Check: Passed"
    end
```

<details>
<summary>📋 <b>Step by step breakdown</b></summary>

<br/>

| # | Phase | What happens |
|:-:|:-----:|:-------------|
| 1️⃣ | 📥 **Ingress** | Client sends request to `/v1/chat/completions` with `X-API-Key: sk-redacted-xyz` |
| 2️⃣ | 🔑 **Auth** | FastAPI checks in-memory cache → resolves to provider + model + real API key |
| 3️⃣ | 🛡️ **Guardrail** | LangChain runs: prompt injection ⚠️ + PII detection 🔍 + policy check 📋 via RAG |
| 4️⃣ | ⚖️ **Decision** | 🔴 Unsafe → returns 400 (saves cost!) · 🟢 Safe → continues |
| 5️⃣ | 🔌 **Adapter** | Translates model name for LiteLLM (e.g. `google/gemini-2.5-pro` → `gemini/gemini-2.5-pro`) |
| 6️⃣ | ☁️ **Upstream** | LiteLLM sends request to the real provider with the customer's API key |
| 7️⃣ | 📨 **Response** | Provider returns → Gateway stamps ✅ "Security Check: Passed" → forwards to client |

</details>

---

## 🛡️ Security Engine — Guardrail Layer

> _The brain of the security system. Uses RAG to enforce company policies dynamically._

```mermaid
graph TB
    Input["📝 User Message"] --> Guard["🔒 Guardrail Engine"]

    Guard --> PII["🔍 PII Detection<br/><i>💳 Credit cards · 🔐 SSN · 🔑 Passwords</i>"]
    Guard --> Jailbreak["⚠️ Prompt Injection<br/><i>🚫 'Ignore all instructions'</i>"]
    Guard --> Policy["📋 Policy Check<br/><i>📚 RAG-based enforcement</i>"]

    Policy --> ChromaDB["📚 ChromaDB<br/><i>🔎 Vector similarity search</i>"]
    ChromaDB --> Policies["📄 Company Policies<br/><i>🔒 Data Privacy · 👥 HR · 🛡️ Security</i>"]

    PII --> Decision{"⚖️ Decision"}
    Jailbreak --> Decision
    Policy --> Decision

    Decision -->|"🔴 Risk > Threshold"| Block["❌ BLOCK<br/><i>400 + reason</i>"]
    Decision -->|"🟢 All Clear"| Pass["✅ FORWARD<br/><i>→ LLM Provider</i>"]

    style Guard fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style Block fill:#2d1515,stroke:#f87171,color:#e2e8f0
    style Pass fill:#0d2818,stroke:#34d399,color:#e2e8f0
    style Decision fill:#2d2300,stroke:#fbbf24,color:#e2e8f0
    style ChromaDB fill:#1a2332,stroke:#60a5fa,color:#e2e8f0
```

<details>
<summary>💡 <b>Example SecurityAssessment response</b></summary>

<br/>

```json
{
  "is_safe": false,
  "violated_rule": "PII Detection",
  "reason": "Message contains credit card number",
  "risk_score": 9
}
```

</details>

---

## 🤖 MCP Integration (Claude Desktop)

> _Redacted integrates with Claude Desktop via the Model Context Protocol — Claude can use the security scanner as a tool._

```mermaid
graph LR
    Claude["🤖 Claude Desktop"] -->|"🔗 MCP Protocol"| Agent["⚙️ agent_tool.py<br/><i>MCP Server</i>"]
    Agent -->|"📡 POST /scan<br/>🔑 X-API-Key"| Backend["🛡️ Redacted Gateway<br/><i>FastAPI</i>"]
    Backend -->|"🔍 analyze"| Guard["🔒 Guardrail"]
    Guard -->|"📊 result"| Backend
    Backend -->|"✅ SAFE / ❌ BLOCKED"| Agent
    Agent -->|"💬 result"| Claude

    style Claude fill:#1e1b4b,stroke:#a78bfa,color:#e2e8f0
    style Backend fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style Guard fill:#2d1515,stroke:#f87171,color:#e2e8f0
```

---

## 🧰 Tech Stack

```mermaid
graph TB
    subgraph "🖥️ Redacted"
        Next["▲ Next.js 14<br/><i>App Router · Server Actions</i>"]
        Clerk["🔐 Clerk<br/><i>Auth · OAuth</i>"]
        Tailwind["🎨 Tailwind + Radix UI<br/><i>60+ Components</i>"]
    end

    subgraph "⚙️ Backend"
        FastAPI["⚡ FastAPI<br/><i>Uvicorn · Async</i>"]
        LangChain["🛡️ LangChain<br/><i>Security Logic · RAG</i>"]
        LiteLLM["🔌 LiteLLM<br/><i>100+ Model Adapter</i>"]
    end

    subgraph "💾 Data"
        MongoDB["🗄️ MongoDB<br/><i>Prisma ORM</i>"]
        ChromaDB["📚 ChromaDB<br/><i>Vector Embeddings</i>"]
        Redis["🚀 Redis<br/><i>Caching Layer</i>"]
    end

    subgraph "🏗️ Infrastructure"
        Docker["🐳 Docker Compose<br/><i>4 Services</i>"]
        MCP["🤖 MCP<br/><i>Claude Desktop</i>"]
    end

    Next --> FastAPI
    FastAPI --> LangChain
    FastAPI --> LiteLLM
    Next --> MongoDB
    LangChain --> ChromaDB
    FastAPI --> Redis

    style Next fill:#0d2818,stroke:#34d399,color:#e2e8f0
    style FastAPI fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    style LangChain fill:#2d1515,stroke:#f87171,color:#e2e8f0
    style LiteLLM fill:#0c2d3e,stroke:#22d3ee,color:#e2e8f0
    style MongoDB fill:#2d2300,stroke:#fbbf24,color:#e2e8f0
    style ChromaDB fill:#2d2300,stroke:#fbbf24,color:#e2e8f0
    style Redis fill:#2d1a00,stroke:#fb923c,color:#e2e8f0
```

| | Component | Technology | Role |
|:-:|:----------|:----------|:-----|
| ▲ | **Redacted** | Next.js 14 + Tailwind + Radix UI | Dashboard, key management, analytics |
| 🔐 | **Auth** | Clerk | OAuth, user management, protected routes |
| ⚡ | **Backend** | Python (FastAPI + Uvicorn) | Real-time request processing |
| 🛡️ | **Security** | LangChain + ChromaDB | RAG-based guardrail, threat detection |
| 🔌 | **Routing** | LiteLLM | Universal adapter for 100+ LLM models |
| 🗄️ | **Database** | MongoDB + Prisma | Users, API keys, audit logs |
| 🚀 | **Cache** | In-Memory Dict → Redis | Sub-ms key resolution |
| 🐳 | **Infra** | Docker Compose | One-command local deployment |
| 🤖 | **Integration** | MCP (Model Context Protocol) | Claude Desktop tool |

---

## 📂 Repo Structure

```
🔐 redacted/
│
├── 🐍 backend/                       # FastAPI (Python)
│   ├── app/
│   │   ├── main.py                   # 🚀 Core: /health, /scan, /register-key, /v1/chat/completions
│   │   ├── chains/
│   │   │   ├── guardrail.py          # 🛡️ Security analysis (LangChain + RAG)
│   │   │   └── prompts.py            # 💬 System prompts for evaluation
│   │   ├── core/
│   │   │   └── config.py             # ⚙️ Settings (Pydantic)
│   │   └── services/
│   │       ├── llm_provider.py       # 🔌 Provider abstraction
│   │       └── vector_db.py          # 📚 ChromaDB / Pinecone
│   ├── data/policies/                # 📋 Company policy documents for RAG
│   ├── scripts/                      # 🧪 ingest.py, test_retrieval.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── ▲ Redacted/                       # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/          # 🌐 Landing, features, pricing, enterprise
│   │   │   ├── (main)/              # 📊 Dashboard: overview, api-keys, logs, activity, settings
│   │   │   ├── api/
│   │   │   │   ├── dashboard/        # 🔑 API keys CRUD, list-models
│   │   │   │   └── internal/         # 🔄 resolve-key (backend ↔ Redacted)
│   │   │   └── auth/                 # 🔐 Clerk sign-in, sign-up, callback
│   │   ├── components/               # 🎨 UI (60+ Radix), dashboard, navigation
│   │   ├── lib/                      # 💾 Prisma client
│   │   └── utils/                    # 📦 Constants: providers, pricing, nav
│   ├── prisma/schema.prisma          # 🗄️ MongoDB schema (User, ApiKey)
│   ├── package.json
│   └── Dockerfile
│
├── 📖 docs/
│   ├── MCP-SETUP.md                  # 🤖 Claude Desktop integration guide
│   └── claude_desktop_config.json.example
│
├── 🤖 agent_tool.py                  # MCP server for Claude Desktop
├── 🐳 docker-compose.yml             # backend, redacted, mongodb, redis
├── 📝 .env.example
└── 📘 README.md
```

---

## 🚀 Getting Started

### 📋 Prerequisites

> - 🐳 Docker and Docker Compose
> - _(Optional)_ 📗 Node 18+ and 🐍 Python 3.10+ for local dev without Docker

### 1️⃣ Clone and configure

```bash
git clone <repo-url>
cd llm-security-gateway
cp .env.example .env            # Set OPENROUTER_API_KEY, MODEL, EMBEDDING_MODEL
```

### 2️⃣ Run

```bash
docker-compose up --build
```

| | Service | URL |
|:-:|:--------|:----|
| 🖥️ | Redacted | http://localhost:3000 |
| ⚡ | Backend API | http://localhost:8000 |
| 📖 | API Docs (Swagger) | http://localhost:8000/docs |

### 3️⃣ First use

1. 🔐 Sign up at http://localhost:3000 (Clerk auth)
2. 📊 Go to **Dashboard → API Keys**
3. 🔌 Select provider → model → enter your API key → **Connect**
4. 📋 Copy the gateway key. Use it in your app:

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "X-API-Key: sk-redacted-xyz..." \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

---

## 🚀 Production Deployment

### Pre-deploy Build Check

Before deploying, run the build check script to catch TypeScript/Next.js errors early:

```bash
./scripts/check-build.sh
```

This script:
- Installs dependencies if needed
- Runs `npm run build` in the Redacted directory
- Exits with code 1 if build fails, 0 on success

**Recommended:** Add this to your CI/CD pipeline or run it locally before pushing to production.

### Docker Production Build

For production, use the hardened compose file that mirrors the live deployment:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This setup:

- **Exposes only nginx** on ports `80` and `443`, terminating TLS with Let's Encrypt certificates.
- **Keeps Next.js, FastAPI and MongoDB internal** to the Docker network (no direct public ports).
- **Runs multi-stage Docker builds** for both frontend and backend (small, production-only images).
- **Serves the dashboard + marketing site** at your domain (e.g. `https://redactedme.com`) and proxies all backend traffic through `/api` (e.g. `https://redactedme.com/api`).

### 🌐 Live Deployment (AWS)

In production this project runs on **AWS EC2** using:

- **Docker Compose** to orchestrate `nginx` + Next.js + FastAPI + MongoDB.
- **nginx** as a reverse proxy and TLS terminator (Let’s Encrypt certificates).
- **Custom domain** `redactedme.com` fronting both the marketing site and the authenticated dashboard.

This is the same architecture you can reproduce by running the commands above on your own EC2 instance.

---

## 🔑 Backend API

| | Endpoint | Method | Description |
|:-:|:---------|:------:|:------------|
| 💚 | `/health` | `GET` | Health check |
| 🛡️ | `/scan` | `POST` | Security scan — returns `is_safe`, `violated_rule`, `reason`, `risk_score` |
| 🔑 | `/register-key` | `POST` | Register gateway key mapping |
| 🗑️ | `/unregister-key` | `POST` | Remove gateway key |
| 🚀 | `/v1/chat/completions` | `POST` | **Main proxy** — guardrail check → forward to LLM |
| 📋 | `/list-models` | `POST` | List available models from a provider |

<details>
<summary>🔒 <b>Internal API (Redacted ↔ Backend)</b></summary>

<br/>

| Endpoint | Description |
|:---------|:------------|
| `GET /api/internal/resolve-key?key=<gateway_key>` | Resolve gateway key to provider + real API key + model. Protected by `Internal-Secret` header. |

</details>

---

## 🧪 Testing

Backend API tests live in `backend/tests/`. The guardrail (LLM + Chroma) is **mocked**, so no OpenRouter key or DB is required.

### Stack

| Tool | Purpose |
|:-----|:--------|
| **pytest** | Test runner |
| **pytest-asyncio** | Async support (for FastAPI) |
| **FastAPI `TestClient`** | HTTP client against the app (from `starlette.testclient`) |
| **unittest.mock.patch** | Mock `analyze_security` so tests don’t call the real guardrail |

### Tests included (`backend/tests/test_main.py`)

| Test | What it checks |
|:-----|:----------------|
| `test_health` | `GET /health` → 200, `status: ok` |
| `test_register_key_invalid_format` | `POST /register-key` with bad key format → 400 |
| `test_register_key_success` | Valid register → 200, key stored in `API_KEY_MAPPING` |
| `test_unregister_key` | `POST /unregister-key` removes key from cache |
| `test_demo_scan_safe` | `POST /demo-scan` with mocked safe result → 200, `is_safe: true` |
| `test_demo_scan_blocked` | `POST /demo-scan` with mocked block → 200, `is_safe: false`, violation |
| `test_demo_scan_missing_text` | `POST /demo-scan` without `text` → 422 |
| `test_demo_scan_empty_text` | `POST /demo-scan` with whitespace-only `text` → 422 |
| `test_scan_requires_api_key` | `POST /scan` without `X-API-Key` → 401 |
| `test_chat_completions_requires_api_key` | `POST /v1/chat/completions` without `X-API-Key` → 401 |
| `test_scan_with_valid_key` | `POST /scan` with registered key + mock → 200, guardrail result |
| `test_chat_completions_blocked_by_guardrail` | Guardrail returns block → response has `error` and blocked message |
| `test_list_models_missing_body` | `POST /list-models` with empty body → 422 |
| `test_list_models_requires_provider_and_key` | `POST /list-models` without provider/key → 422 |

Fixtures (in `conftest.py`): `TestClient(app)`, and reset of `API_KEY_MAPPING` between tests.

### How to run

**After the stack is up (or in CI):**

```bash
# Rebuild backend so pytest is installed (if you added tests after first build)
docker-compose build backend

# Run tests inside the backend container
docker-compose run --rm backend python -m pytest tests/ -v --tb=short
```

**Or from repo root:**

```bash
chmod +x scripts/run-tests.sh
./scripts/run-tests.sh
```

**Local (with backend venv):**

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v --tb=short
```

---

## 🔧 Environment Variables

| | Variable | Where | Description |
|:-:|:---------|:-----:|:------------|
| 🤖 | `OPENROUTER_API_KEY` | Root | API key for guardrail LLM (OpenRouter) |
| 🧠 | `MODEL` | Root | Model for security analysis |
| 📊 | `EMBEDDING_MODEL` | Root | Model for policy embeddings |
| 🔒 | `INTERNAL_API_SECRET` | Root | Secret for backend ↔ Redacted internal API |
| 🗄️ | `DATABASE_URL` | Redacted | MongoDB connection string |
| 🔗 | `NEXT_PUBLIC_API_URL` | Redacted | Backend URL (e.g. `http://localhost:8000`) |
| 🔐 | `CLERK_SECRET_KEY` | Redacted | Clerk authentication |
| 🔑 | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Redacted | Clerk public key |

---

<div align="center">

## 📜 License

MIT

---

**Built with ❤️ by [Lidor Pahima](https://linkedin.com/in/lidor-pahima)**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/lidor-pahima)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:lidorpahima28@gmail.com)

</div>
