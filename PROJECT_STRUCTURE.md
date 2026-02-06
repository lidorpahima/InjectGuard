# Project Structure Guide

This document explains what each file in the project does and how they fit together.

## 📂 Backend Structure

### `/backend/app/main.py`
**Purpose:** Entry point for the FastAPI application
**Contains:**
- FastAPI app initialization
- CORS middleware setup
- Route registration
- Startup/shutdown events

### `/backend/app/core/config.py`
**Purpose:** Configuration management
**Contains:**
- Environment variable loading
- API keys configuration
- Database settings
- Application settings (log level, timeouts, etc.)

### `/backend/app/api/router.py`
**Purpose:** Main API router that combines all endpoints
**Contains:**
- Router aggregation
- Route prefixes and tags

### `/backend/app/api/endpoints/analyze.py`
**Purpose:** Main analysis endpoint
**Contains:**
- `/analyze` POST endpoint - the core API
- Request/response models (Pydantic)
- Analysis orchestration

### `/backend/app/chains/guardrail.py`
**Purpose:** THE BRAIN - Main security analysis logic
**Contains:**
- GuardrailChain class
- Pattern matching (Step 1)
- RAG retrieval (Step 2)
- LLM judge (Step 3)
- Decision aggregation

**How it works:**
```python
chain = GuardrailChain()
result = await chain.analyze("Can I share customer data?")

# Result contains:
# - is_safe: bool
# - confidence: float
# - explanation: str
# - violated_policies: List[str]
# - steps: List[AnalysisStep]
```

### `/backend/app/chains/prompts.py`
**Purpose:** System prompts for the LLM Judge
**Contains:**
- JUDGE_SYSTEM_PROMPT: Main prompt that tells the LLM how to evaluate
- STRICT_JUDGE_PROMPT: More conservative version
- EXPLANATION_PROMPT: For generating user-friendly explanations

**Critical for:** Determining how the LLM judges whether a prompt violates policies

### `/backend/app/services/vector_db.py`
**Purpose:** Vector database abstraction
**Contains:**
- ChromaDBService (for local development)
- PineconeService (for production)
- Abstract VectorDBService interface

**Key methods:**
- `search(query, top_k)` - Find similar documents
- `add_documents(documents)` - Add policy documents

### `/backend/app/services/llm_provider.py`
**Purpose:** LLM provider abstraction
**Contains:**
- OpenAIProvider (default)
- AWSBedrockProvider (alternative)
- Abstract LLMProvider interface

**Key method:**
- `generate(system_prompt, user_prompt)` - Get LLM response

### `/backend/scripts/ingest.py`
**Purpose:** Load policy documents into Vector DB
**Usage:**
```bash
python scripts/ingest.py --policies-dir ./data/policies
```

**What it does:**
1. Reads all PDF/TXT files from `data/policies/`
2. Splits them into chunks
3. Creates embeddings
4. Stores in Vector DB

**When to run:** Once at setup, or whenever policies are updated

### `/backend/data/policies/`
**Purpose:** Store organizational policy documents
**Supported formats:** PDF, TXT
**Example files:**
- EXAMPLE_Data_Privacy_Policy.txt
- EXAMPLE_HR_Policy.txt

**Important:** Replace these example files with your actual company policies!

---

## 📂 Frontend Structure

### `/frontend/src/main.tsx`
**Purpose:** React application entry point
**Contains:**
- React root rendering
- App component mount

### `/frontend/src/App.tsx`
**Purpose:** Main application component
**Contains:**
- Split-screen layout
- Header and footer
- Chat and Analysis components

### `/frontend/src/types/index.ts`
**Purpose:** TypeScript type definitions
**Contains:**
- AnalysisRequest
- AnalysisResponse
- ChatMessage
- AnalysisStep
- SecurityStoreState

**Why important:** Type safety across the entire frontend

### `/frontend/src/api/client.ts`
**Purpose:** API communication layer
**Contains:**
- Axios instance with interceptors
- `analyzePrompt()` function
- `healthCheck()` function
- Error handling

**How to use:**
```typescript
import { analyzePrompt } from '@/api/client'

const result = await analyzePrompt({
  prompt: "Can I share customer data?",
  context: { user_id: "123" }
})
```

### `/frontend/src/stores/useSecurityStore.ts`
**Purpose:** Global state management (Zustand)
**Contains:**
- Current analysis state
- Chat message history
- `analyzePrompt()` action
- `clearAnalysis()` action

**How to use:**
```typescript
import { useSecurityStore } from '@/stores/useSecurityStore'

function MyComponent() {
  const { analyzePrompt, currentAnalysis } = useSecurityStore()

  const handleSubmit = async () => {
    await analyzePrompt("My prompt here")
  }

  return <div>{currentAnalysis?.explanation}</div>
}
```

### `/frontend/src/components/Chat/ChatInterface.tsx`
**Purpose:** Chat UI (left side of split screen)
**Contains:**
- Message display
- Prompt input
- Example prompts
- Clear chat button

### `/frontend/src/components/Analysis/AnalysisView.tsx`
**Purpose:** Analysis visualization (right side of split screen)
**Contains:**
- Step-by-step progress display
- Retrieved documents view
- Final verdict (Safe/Unsafe)
- Confidence and timing metrics

---

## 🔄 How It All Fits Together

### End-to-End Flow

1. **User types prompt in ChatInterface.tsx**
   ```typescript
   await analyzePrompt("Can I share customer data?")
   ```

2. **Store (useSecurityStore.ts) calls API**
   ```typescript
   const result = await apiAnalyzePrompt({ prompt: "..." })
   ```

3. **API client (client.ts) sends POST request**
   ```typescript
   POST /api/v1/analyze/
   Body: { prompt: "...", context: {...} }
   ```

4. **Backend endpoint (analyze.py) receives request**
   ```python
   @router.post("/")
   async def analyze_prompt(request: AnalyzeRequest):
   ```

5. **GuardrailChain (guardrail.py) processes prompt**
   ```python
   chain = GuardrailChain()
   result = await chain.analyze(prompt)

   # Steps:
   # 1. Pattern matching (regex)
   # 2. RAG retrieval (vector search)
   # 3. LLM judge (GPT-4 evaluation)
   ```

6. **Response flows back to frontend**
   ```json
   {
     "is_safe": false,
     "confidence": 0.92,
     "explanation": "Violates Data Privacy Policy Section 4.2",
     "steps": [...]
   }
   ```

7. **AnalysisView.tsx displays results**
   - Shows each step
   - Displays verdict
   - Shows violated policies

---

## 🚀 Development Workflow

### First Time Setup

1. **Install Backend Dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Ingest Policy Documents**
   ```bash
   python scripts/ingest.py
   ```

4. **Start Backend**
   ```bash
   uvicorn app.main:app --reload
   # Running on http://localhost:8000
   ```

5. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

6. **Start Frontend**
   ```bash
   npm run dev
   # Running on http://localhost:5173
   ```

### Daily Development

**Backend changes:**
- Modify files in `backend/app/`
- FastAPI auto-reloads on save
- Test at http://localhost:8000/docs

**Frontend changes:**
- Modify files in `frontend/src/`
- Vite auto-reloads on save
- View at http://localhost:5173

---

## 📝 Next Steps (Implementation TODOs)

### Backend
- [ ] Implement actual Vector DB initialization in `vector_db.py`
- [ ] Implement actual LLM calls in `llm_provider.py`
- [ ] Complete the `ingest.py` script with real PDF parsing
- [ ] Add Redis caching layer
- [ ] Add proper error handling and logging
- [ ] Write unit tests

### Frontend
- [ ] Add Framer Motion animations to AnalysisView
- [ ] Implement markdown rendering for chat messages
- [ ] Add export chat history feature
- [ ] Add collapsible step details
- [ ] Improve mobile responsiveness
- [ ] Add dark/light theme toggle (currently only dark)

### Deployment
- [ ] Setup AWS Lambda for backend
- [ ] Deploy frontend to S3 + CloudFront
- [ ] Setup CI/CD with GitHub Actions
- [ ] Add monitoring and alerting

---

## 🤔 Common Questions

**Q: Where do I add new policy documents?**
A: Place PDF or TXT files in `backend/data/policies/`, then run `python scripts/ingest.py`

**Q: How do I change the LLM provider?**
A: Update `LLM_PROVIDER` in `.env` to either "openai" or "aws-bedrock"

**Q: Where is the actual AI logic?**
A: In `backend/app/chains/guardrail.py` - that's the brain of the system

**Q: How do I modify the judge's behavior?**
A: Edit the system prompts in `backend/app/chains/prompts.py`

**Q: Where do I add new API endpoints?**
A: Create new files in `backend/app/api/endpoints/` and register them in `router.py`

---

## 🎯 Key Files for Understanding the Project

If you're new to the project, read these files in order:

1. `README.md` - High-level overview
2. `backend/app/chains/guardrail.py` - Core logic
3. `backend/app/api/endpoints/analyze.py` - Main API endpoint
4. `frontend/src/stores/useSecurityStore.ts` - State management
5. `frontend/src/App.tsx` - UI layout

These 5 files will give you a complete understanding of how the system works!
