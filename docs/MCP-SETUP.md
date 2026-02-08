# MCP (Model Context Protocol) – Connecting Claude Desktop to Redacted

The `agent_tool.py` script acts as a "broker": it runs on your computer, listens to requests from Claude Desktop, and when the agent requires a security check, it sends the text to Redacted's API and returns either SAFE or BLOCKED.

## Step 1: Install dependencies

```bash
cd /path/to/llm-security-gateway
pip install -r requirements-mcp.txt
```

(Or: `pip install mcp httpx`)

## Step 2: Start the Backend

Make sure the API is running (Docker or local):

```bash
docker compose up -d backend
# Or: cd backend && uvicorn app.main:app --reload
```

## Step 3: Get Your Gateway Key

1. Go to the dashboard: `http://localhost:3000/dashboard/api-keys`
2. Create a new connection (Provider + Model + your API Key) and get your **Gateway Key** (starts with `sk-redacted-...`).
3. You will use this key for `REDACTED_API_KEY` (see below).

## Step 4: Configure Claude Desktop

- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Copy the contents from `docs/claude_desktop_config.json.example` and update them:

1. **args:** The **full path** to your `agent_tool.py` in your project (replace `/ABSOLUTE/PATH/TO/...` with your actual path).
2. **REDACTED_API_KEY:** The key you created in the dashboard.
3. **REDACTED_API_URL:** If your backend runs on a different port or machine, update this value accordingly (default is `http://localhost:8000`).

If you are using a virtual environment (venv), you can set:

```json
"command": "/path/to/your/venv/bin/python",
"args": ["/path/to/llm-security-gateway/agent_tool.py"],
```

instead of just `"python"` and the args with the path.

## How to test

1. Start Claude Desktop.
2. Make sure you see the "plug" icon (🔌) and that the server `redacted-shield` appears.
3. Send the following message to Claude, for example:

   *"I want to check if this draft is safe to share: We are launching Project X soon!"*

4. Claude should trigger the tool `check_security_risk`. The request will be sent to `/scan`, and the answer (SAFE or BLOCKED) will come back via MCP.

## Environment Variables (Optional)

If you don't pass them via the `env` section in the configuration file, you may set them as system environment variables or in a `.env` file:

- `REDACTED_API_URL` – API address (default: `http://localhost:8000`)
- `REDACTED_API_KEY` – Gateway Key from the dashboard
