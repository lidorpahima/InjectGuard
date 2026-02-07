# MCP (Model Context Protocol) – חיבור Claude Desktop ל-Redacted

הסקריפט `agent_tool.py` משמש כ"מתווך": הוא יושב על המחשב שלך, מקשיב ל-Claude Desktop, וכשהסוכן צריך בדיקת אבטחה – שולח את הטקסט ל-API של Redacted ומחזיר SAFE או BLOCKED.

## שלב 1: התקנת תלויות

```bash
cd /path/to/llm-security-gateway
pip install -r requirements-mcp.txt
```

(או: `pip install mcp httpx`)

## שלב 2: הרצת ה-Backend

וודא שה-API רץ (Docker או מקומי):

```bash
docker compose up -d backend
# או: cd backend && uvicorn app.main:app --reload
```

## שלב 3: מפתח Gateway

1. היכנס לדשבורד: `http://localhost:3000/dashboard/api-keys`
2. צור חיבור (Provider + Model + API Key שלך) וקבל **Gateway Key** (מתחיל ב-`sk-redacted-...`).
3. תשתמש במפתח הזה ב-`REDACTED_API_KEY` (למטה).

## שלב 4: קונפיגורציה של Claude Desktop

- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

העתק את התוכן מ-`docs/claude_desktop_config.json.example` והתאם:

1. **args:** הנתיב **המלא** ל-`agent_tool.py` בפרויקט שלך (במקום `/ABSOLUTE/PATH/TO/...`).
2. **REDACTED_API_KEY:** המפתח שיצרת בדשבורד.
3. **REDACTED_API_URL:** אם ה-backend רץ על פורט אחר או על מכונה אחרת – עדכן בהתאם (ברירת מחדל `http://localhost:8000`).

אם אתה משתמש ב-venv, אפשר להגדיר:

```json
"command": "/path/to/your/venv/bin/python",
"args": ["/path/to/llm-security-gateway/agent_tool.py"],
```

במקום `python` ו-args עם הנתיב.

## איך לבדוק

1. הפעל את Claude Desktop.
2. בדוק שיש אייקון "תקע" (🔌) ושה-server `redacted-shield` מופיע.
3. שלח ל-Claude למשל:

   *"I want to check if this draft is safe to share: We are launching Project X soon!"*

4. Claude אמור להפעיל את הכלי `check_security_risk`; הבקשה תישלח ל-`/scan`, והתשובה (SAFE או BLOCKED) תחזור דרך ה-MCP.

## משתני סביבה (אופציונלי)

אם לא מעבירים ב-`env` בקובץ הקונפיגורציה, אפשר להגדיר במערכת או ב-`.env`:

- `REDACTED_API_URL` – כתובת ה-API (ברירת מחדל: `http://localhost:8000`)
- `REDACTED_API_KEY` – Gateway Key מהדשבורד
