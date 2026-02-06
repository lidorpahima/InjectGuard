# Changelog

All notable changes and refactoring decisions for this project.

---

## Refactoring Summary (Latest Version)

### ❌ What Was Removed

#### 1. ML Classifier Layer (Layer 2)
**Reason:** Over-engineering for a portfolio project
- Removed DistilBERT fine-tuning
- Removed model training scripts
- Removed heavy ML dependencies (PyTorch, transformers)

**Impact:**
- Simpler architecture
- Faster development
- Still demonstrates RAG + LLM capabilities

#### 2. Complex 4-Layer Architecture
**Reason:** Simplified to a cleaner, more focused flow
- Old: Pattern → ML → RAG → LLM (4 layers)
- New: Pattern → RAG → LLM (3 steps, 1 chain)

**Impact:**
- Easier to understand
- Easier to maintain
- Focus on the RAG aspect (the key differentiator)

#### 3. CLI-First Approach
**Reason:** Modern web-first UX is more impressive
- De-emphasized curl/terminal examples
- Prioritized React dashboard
- Better for demos and presentations

---

### ✅ What Was Added

#### 1. React Dashboard (Split-Screen UI)
**Why:** Visual demonstration is more impactful
- Left: Chat interface for testing prompts
- Right: Real-time analysis visualization
- Shows "what's happening under the hood"

**Technologies:**
- React + TypeScript
- Tailwind CSS (dark mode)
- Zustand (state management)
- Framer Motion (animations - planned)

#### 2. Dynamic RAG Rules
**Why:** This is the core innovation
- Policies stored in Vector DB
- Real-time retrieval based on prompt
- Context-aware evaluation

**Example:**
```
Prompt: "Can I share customer data?"
→ Retrieves: Data Privacy Policy Section 4.2
→ LLM evaluates against THAT SPECIFIC section
→ Blocks with explanation
```

#### 3. Explainability Focus
**Why:** Transparency builds trust
- Shows which policy was violated
- Displays confidence scores
- Shows each step's timing
- Retrieved documents visible to user

#### 4. AWS Lambda Ready
**Why:** Production deployment matters
- Dockerized backend
- Serverless architecture
- Cost-effective scaling

---

## Design Decisions

### Why RAG Instead of Fine-Tuned Model?

**RAG Advantages:**
1. **Dynamic:** Policies can be updated without retraining
2. **Explainable:** Shows exactly which document caused the decision
3. **Flexible:** Works with any domain (HR, Security, Compliance, etc.)
4. **Practical:** Real-world companies need this adaptability

**Fine-Tuned Model Disadvantages:**
1. Requires large dataset (expensive to create)
2. Black box (hard to explain decisions)
3. Static (policy changes require retraining)
4. Domain-specific (doesn't generalize)

### Why LangChain?

**Pros:**
- Industry standard for LLM applications
- Built-in RAG components
- Easy to swap LLM providers
- Good for orchestration

**Alternative considered:** Build custom pipeline
- Rejected: Reinventing the wheel
- LangChain shows knowledge of modern AI stack

### Why TypeScript + React?

**Pros:**
- Type safety prevents bugs
- Modern, in-demand stack
- Great for complex state management
- Professional frontend look

### Why Pinecone + ChromaDB?

**ChromaDB (Development):**
- Free, local
- No API keys needed
- Fast iteration

**Pinecone (Production):**
- Managed, scalable
- Better performance at scale
- Industry standard

---

## File Organization Principles

### Backend Structure
```
app/
├── api/          # HTTP layer (endpoints)
├── core/         # Configuration
├── chains/       # Business logic (THE BRAIN)
├── services/     # External integrations
```

**Why this structure?**
- Separation of concerns
- Easy to test
- Clear responsibility boundaries

### Frontend Structure
```
src/
├── components/   # UI components
├── stores/       # State management
├── api/          # Backend communication
├── types/        # TypeScript definitions
```

**Why this structure?**
- Standard React pattern
- Easy to find things
- Scalable

---

## Future Enhancements (Not Implemented Yet)

### Phase 2 (Nice to Have)
- [ ] Admin dashboard for policy management
- [ ] Analytics and reporting
- [ ] Multi-tenant support
- [ ] A/B testing for different judge prompts

### Phase 3 (Advanced)
- [ ] Custom policy language (DSL)
- [ ] Active learning from false positives
- [ ] Integration with Slack/Teams
- [ ] Enterprise SSO

---

## Lessons Learned

### What Worked Well
1. **Simplification:** Removing ML layer made project clearer
2. **RAG Focus:** This is the differentiator, doubled down on it
3. **Visual Demo:** Split-screen UI shows the system's intelligence
4. **Real Examples:** Using actual policy documents makes it concrete

### What Could Be Improved
1. **Test Coverage:** Need more unit tests
2. **Performance:** Could optimize RAG retrieval
3. **Caching:** Redis integration incomplete
4. **Documentation:** More inline code comments

---

## Version History

### v0.2.0 (Current - Refactored)
- Simplified architecture (removed ML layer)
- Added React frontend
- Focus on RAG + LLM judge
- Added explainability features
- AWS Lambda ready

### v0.1.0 (Initial - Over-Engineered)
- 4-layer architecture
- ML classifier with DistilBERT
- CLI-first approach
- Complex but impressive

---

## Migration Notes

If you're updating from v0.1.0 to v0.2.0:

1. **Remove ML dependencies:**
   ```bash
   pip uninstall torch transformers
   ```

2. **Update architecture:**
   - Remove `ml_detector.py`
   - Simplify `decision_engine.py`

3. **Setup frontend:**
   ```bash
   cd frontend && npm install
   ```

4. **Update environment variables:**
   - Remove HUGGINGFACE_TOKEN
   - Add PINECONE_API_KEY (optional)

---

## Credits & Inspiration

- Inspired by: Deepchecks, LangChain, Anthropic Claude
- Built by: Lidor Pahima
- Purpose: Portfolio project + Real-world utility
