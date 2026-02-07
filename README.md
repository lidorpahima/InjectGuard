# LLM Security Gateway

**A gateway that sits between your app and LLM providers. You connect your API key and model; we give you a gateway key. Every request is checked (jailbreak, PII, your policies) before we forward it to the chosen model.**

- **Product:** Connect a provider (OpenAI, OpenRouter, Gemini, Anthropic, Grok, etc.), choose a model, add your API key → get a **gateway key**. Use the gateway key in your app; we validate requests and proxy to your provider.
- **Stack:** Next.js (frontend + dashboard), FastAPI (backend), MongoDB (Prisma), Redis, Clerk (auth). Run with Docker Compose.

---

## What it does

1. **Dashboard (logged-in):** You select a **provider** (e.g. OpenAI), pick a **model** (e.g. gpt-4o), and enter **your API key**. We create a **gateway key** and store the mapping (gateway key → provider + model + your key).
2. **Your app** sends requests to our gateway with header `X-API-Key: <gateway key>`.
3. **Backend** validates the key, runs security checks (guardrail/scan), then forwards the request to the chosen model using your stored API key.
4. **Result:** One gateway key = one provider + one model. All traffic is inspected before it hits the LLM.

---

## Repo structure

```
llm-security-gateway/
├── backend/                 # FastAPI (Python)
│   ├── app/
│   │   ├── main.py          # /health, /scan, /generate-api-key, /register-key
│   │   ├── chains/          # Guardrail (security analysis)
│   │   ├── core/             # Config
│   │   └── services/        # LLM, vector DB (for policies)
│   ├── data/                # Policy documents (RAG)
│   ├── scripts/             # ingest, test_retrieval
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                # Next.js (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/ # Home, features, pricing, privacy, terms, changelog, enterprise, blog, help
│   │   │   ├── (main)/      # Dashboard (overview, API keys, logs, activity, settings)
│   │   │   ├── api/         # /api/dashboard/api-keys, /api/internal/resolve-key
│   │   │   └── auth/        # Clerk sign-in, sign-up, callback
│   │   ├── components/      # UI, navigation, dashboard
│   │   ├── lib/             # db (Prisma)
│   │   └── utils/           # constants (providers, pricing, nav, etc.)
│   ├── prisma/              # MongoDB schema (User, Link, ApiKey, …)
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml       # backend, frontend, mongodb, redis
├── .env.example             # Root env template
└── README.md
```

---

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | Next.js 14 (App Router), Tailwind, Radix UI, Clerk, Prisma |
| Backend  | FastAPI, LangChain (guardrail), OpenRouter/LLM |
| Data     | MongoDB (Prisma), Redis |
| Auth     | Clerk |
| Run      | Docker Compose |

---

## Getting started

### Prerequisites

- Docker and Docker Compose  
- (Optional) Node 18+ and Python 3.10+ for local dev without Docker  

### 1. Clone and env

```bash
git clone <repo-url>
cd llm-security-gateway
```

Copy env files and set variables:

- **Root:** `.env.example` → `.env` (e.g. `OPENROUTER_API_KEY`, `MODEL`, `EMBEDDING_MODEL` for backend).
- **Frontend:** `frontend/.env.example` → `frontend/.env` and set:
  - `DATABASE_URL` (e.g. `mongodb://mongodb:27017/frontend` for Docker)
  - `NEXT_PUBLIC_APP_DOMAIN`, `NEXT_PUBLIC_APP_NAME`
  - `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000` or backend URL)
  - Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - Optional: `INTERNAL_API_SECRET` (for backend → frontend resolve-key calls)

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:8000  
- **API docs:** http://localhost:8000/docs  

### 3. First use

1. Open http://localhost:3000 and sign up / sign in (Clerk).
2. Go to **Dashboard → API Keys**.
3. Choose a **provider** (e.g. OpenAI), select a **model** (e.g. gpt-4o), enter **your API key**, then **Connect & get gateway key**.
4. Copy the gateway key; use it in your app as `X-API-Key` when calling the gateway.

### 4. (Optional) Push Prisma schema to MongoDB

If the frontend runs outside Docker or you need to apply schema changes:

```bash
cd frontend
npx prisma db push
```

---

## MCP (Claude Desktop)

You can expose the gateway as a **tool** to Claude Desktop via the [Model Context Protocol](https://modelcontextprotocol.io/). The script `agent_tool.py` in the project root calls your backend `/scan` endpoint so Claude can check text for PII, prompt injection, and policy violations before using it.

1. Install: `pip install -r requirements-mcp.txt`
2. Set `REDACTED_API_KEY` to a gateway key from the dashboard (and optionally `REDACTED_API_URL` if the backend is not on `localhost:8000`).
3. Point Claude Desktop at `agent_tool.py` via `claude_desktop_config.json` (see **docs/MCP-SETUP.md** for step-by-step and the example config).

---

## Backend API (short)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /scan` | Security scan (guardrail) on text; header `X-API-Key` (gateway key). Returns `is_safe`, `violated_rule`, `reason`, `risk_score`. Used by MCP agent. |
| `POST /register-key` | Register a gateway key (body: `gateway_key`, `provider`, `model`, `target_api_key`) |
| `POST /unregister-key` | Remove a gateway key (body: `gateway_key`) |

Protected routes use header `X-API-Key` with a registered gateway key. The backend can resolve a gateway key to provider + customer API key + model by calling the frontend’s internal API (see below).

---

## Frontend internal API (for backend)

- **`GET /api/internal/resolve-key?key=<gateway_key>`**  
  Header: `Internal-Secret: <INTERNAL_API_SECRET>`  
  Returns: `{ provider, customerApiKey, model }` so the backend can forward requests to the right LLM.

---

## Features (product)

- **Threat prevention:** Jailbreak and prompt-injection detection at the gateway.
- **Custom policies:** Enforce rules (e.g. vector DB / Chroma) to allow or block by content.
- **Latency / cost:** Cached responses where applicable.
- **Integrations:** One gateway for multiple apps and providers.
- **Dashboard:** Connect providers, choose models, manage gateway keys; overview, logs, activity, settings.

---

## License

MIT

---

## Author

**Lidor Pahima**  
- Email: lidorpahima28@gmail.com  
- LinkedIn: [linkedin.com/in/lidor-pahima](https://linkedin.com/in/lidor-pahima)
