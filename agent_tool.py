#!/usr/bin/env python3
"""
MCP (Model Context Protocol) server: Redacted Security Shield.
Exposes check_security_risk to Claude Desktop (and other MCP clients).
Uses your gateway key to call the Redacted API /scan endpoint.
"""
from mcp.server.fastmcp import FastMCP
import httpx
import os

# Name of the tool as it appears in Claude
mcp = FastMCP("Redacted Security Shield")

# Config: read from env so you can set once (e.g. in shell or .env)
API_BASE_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000").rstrip("/")
API_KEY = os.getenv("REDACTED_API_KEY", "")  # Your gateway key from the dashboard


@mcp.tool()
async def check_security_risk(text: str) -> str:
    """
    Scans a piece of text for PII (Personal Identifiable Information), Prompt Injections,
    and policy violations. Returns 'SAFE' if the text is clean, or a blocking reason if dangerous.
    ALWAYS use this tool before sending user data to external systems.
    """
    preview = (text[:50] + "…") if len(text) > 50 else text
    print(f"🕵️ Agent is scanning text: {preview}")

    if not API_KEY:
        return "ERROR: REDACTED_API_KEY is not set. Add your gateway key from the dashboard."

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/scan",
                json={"text": text},
                headers={"X-API-Key": API_KEY},
                timeout=10.0,
            )

            if response.status_code == 401:
                return "ERROR: Invalid or missing API key. Check REDACTED_API_KEY."
            if response.status_code == 403:
                return "ERROR: API key not recognized. Create a key in the dashboard and try again."
            if response.status_code != 200:
                return f"ERROR: Could not connect to security gateway. Status: {response.status_code}"

            data = response.json()

            if data.get("is_safe"):
                return "✅ SAFE: No security risks detected. You may proceed."
            rule = data.get("violated_rule", "Unknown Rule")
            reason = data.get("reason", "No reason provided")
            return f"🛑 BLOCKED: Security Violation Detected!\nRule: {rule}\nReason: {reason}\nAction: DO NOT send this text."

        except httpx.ConnectError:
            return f"ERROR: Could not reach gateway at {API_BASE_URL}. Is the server running?"
        except Exception as e:
            return f"SYSTEM ERROR: {str(e)}"


if __name__ == "__main__":
    mcp.run()
