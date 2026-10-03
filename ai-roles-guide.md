# AI Roles Guide — From React Native Developer to AI Engineer

> **Your profile:** 3 YOE React Native developer, basic backend knowledge, interested in guardrails, token optimization, and building harnesses around LLMs.
> **Goal:** Choose the right AI role path and prepare from beginner to expert level.

---

## Table of Contents

1. [Roles Available in the Market](#roles-available-in-the-market)
2. [Role Comparison Matrix](#role-comparison-matrix)
3. [Recommended Path for Your Profile](#recommended-path-for-your-profile)
4. [Learning Roadmap by Role](#learning-roadmap-by-role)
5. [Key Skills Breakdown](#key-skills-breakdown)
6. [Portfolio Projects](#portfolio-projects)
7. [Certifications & Resources](#certifications--resources)

---

## Roles Available in the Market

### 1. AI/LLM Application Developer (Beginner → Intermediate)
**Also known as:** LLM Engineer, AI App Developer, Prompt Engineer (senior title)

**What you do:**
- Build applications that wrap LLMs (GPT, Claude, Gemini, open-source models) with business logic
- Design prompt pipelines, chain-of-thought workflows, and agent orchestration
- Implement guardrails (input validation, output filtering, safety checks, content moderation)
- Optimize token usage — prompt compression, caching, smart routing
- Build RAG (Retrieval-Augmented Generation) pipelines — connecting LLMs to your own data
- Integrate LLM APIs into existing apps (mobile, web, backend)

**Why it fits you:**
- Your React Native experience means you already understand app architecture, state management, and UI patterns
- Guardrails and token optimization are exactly the kind of engineering work that sits between "prompt engineering" and "full ML engineering"
- High demand in startups and enterprise teams building AI-powered products

**Typical tech stack:**
- Python or TypeScript/Node.js
- LangChain, LlamaIndex, or custom orchestration
- OpenAI API, Anthropic API, or open-source models (Ollama, vLLM)
- Vector databases (Pinecone, Weaviate, Qdrant, pgvector)
- Guardrails libraries (Guardrails AI, NeMo Guardrails, custom middleware)

**Salary range (US):** $90K–$160K | **India:** ₹8L–₹25L

---

### 2. AI Platform / Infrastructure Engineer (Intermediate → Senior)
**Also known as:** ML Platform Engineer, LLM Infrastructure Engineer, AI DevOps

**What you do:**
- Build and maintain the infrastructure that serves LLM models at scale
- Manage GPU clusters, model serving (Triton, vLLM, TensorRT-LLM, TGI)
- Implement caching layers (semantic cache, KV cache management, prefix caching)
- Set up monitoring, observability, and cost tracking for LLM inference
- Build token optimization pipelines (batch inference, streaming, model quantization)
- Design multi-model routing (send requests to the cheapest/fastest model that meets quality thresholds)

**Why it fits you:**
- Backend knowledge is essential here — you already have the foundation
- Token optimization is a core part of this role
- Less math/ML theory required, more systems engineering

**Typical tech stack:**
- Python, Go, or Rust
- Docker, Kubernetes, NVIDIA Triton, vLLM
- Prometheus, Grafana, LangSmith, Weights & Biases
- AWS/GCP/Azure GPU instances
- Redis, Kafka for caching and event streaming

**Salary range (US):** $130K–$220K | **India:** ₹15L–₹45L

---

### 3. AI Safety / Alignment Engineer (Intermediate → Senior)
**Also known as:** AI Safety Engineer, LLM Guardrails Engineer, AI Trust & Safety

**What you do:**
- Build guardrails that prevent LLMs from generating harmful, biased, or incorrect outputs
- Design content moderation pipelines (toxicity detection, PII redaction, hallucination filtering)
- Implement output validation — ensure LLM responses conform to schemas, don't leak data
- Red-teaming: actively try to break the model's safety constraints
- Build evaluation frameworks (benchmarks, human evaluation pipelines, automated scoring)
- Compliance: ensure AI outputs meet regulatory requirements (GDPR, HIPAA, etc.)

**Why it fits you:**
- Guardrails is explicitly your interest area
- Your React Native background means you understand app-level integration
- Growing field with regulatory tailwinds (EU AI Act, US Executive Order on AI)

**Typical tech stack:**
- Python, TypeScript
- Guardrails AI, NeMo Guardrails, Llama Guard, custom validators
- Pydantic, JSON Schema for output validation
- Evaluation tools (Ragas, DeepEval, Promptfoo)
- Security tools (OWASP AI Top 10, adversarial testing frameworks)

**Salary range (US):** $110K–$200K | **India:** ₹10L–₹35L

---

### 4. RAG (Retrieval-Augmented Generation) Engineer (Beginner → Intermediate)
**What you do:**
- Build systems that give LLMs access to your own documents, databases, or knowledge bases
- Chunk documents, embed them into vector stores, and retrieve relevant context at query time
- Optimize retrieval quality (hybrid search, re-ranking, query expansion)
- Handle document ingestion pipelines (PDFs, images, tables, databases)
- Manage context windows — decide what to include, what to compress, what to summarize

**Why it fits you:**
- RAG is the most in-demand LLM engineering skill right now
- Your app development experience means you can build end-to-end RAG features in a product
- Token optimization is critical in RAG (context window management, chunking strategies)

**Typical tech stack:**
- Python, TypeScript
- LangChain, LlamaIndex, Haystack
- Vector DBs: Pinecone, Weaviate, Qdrant, ChromaDB, pgvector
- Embedding models: OpenAI embeddings, Cohere, sentence-transformers
- Document parsing: Unstructured.io, LangChain document loaders

**Salary range (US):** $100K–$170K | **India:** ₹8L–₹22L

---

### 5. AI Agent Engineer (Intermediate → Senior)
**What you do:**
- Build autonomous AI agents that can reason, plan, use tools, and take actions
- Design multi-agent systems where different agents collaborate on complex tasks
- Implement tool-use patterns (APIs, databases, code execution, web browsing)
- Build memory systems for agents (short-term context, long-term knowledge)
- Handle agent orchestration — routing, delegation, error recovery
- Guardrails for agents (preventing infinite loops, cost caps, harmful actions)

**Why it fits you:**
- "Building harnesses around LLMs" is exactly what agent engineering is
- Your app development background helps you understand tool integration and API design
- High-growth area — every company building AI products needs agent engineers

**Typical tech stack:**
- Python, TypeScript
- LangGraph, AutoGen, CrewAI, LlamaIndex Agents
- OpenAI Assistants API, Anthropic Claude with tool use
- MCP (Model Context Protocol) — emerging standard
- Redis, PostgreSQL for agent state and memory

**Salary range (US):** $120K–$230K | **India:** ₹12L–₹40L

---

### 6. ML/AI Engineer (Full-Stack AI) (Intermediate → Senior)
**What you do:**
- End-to-end ML lifecycle: data collection → model training/fine-tuning → deployment → monitoring
- Fine-tune LLMs on domain-specific data (LoRA, QLoRA, full fine-tuning)
- Build training pipelines, evaluation frameworks, and A/B testing for model versions
- Deploy models to production (ONNX, TensorRT, GGUF for local inference)
- Optimize models for edge/mobile deployment (quantization, distillation, pruning)

**Why it fits you:**
- Broadest role — covers everything from data to deployment
- Requires more ML/math knowledge than the other roles listed here
- Your React Native experience is a differentiator for mobile ML deployment (on-device inference)

**Typical tech stack:**
- Python (PyTorch, TensorFlow, Hugging Face Transformers)
- Fine-tuning: PEFT, LoRA, Axolotl, Unsloth
- Deployment: ONNX Runtime, TensorRT, Ollama, vLLM
- MLOps: MLflow, Weights & Biases, Kubeflow, Airflow
- Mobile: Core ML (iOS), ML Kit (Android), ONNX Runtime Mobile

**Salary range (US):** $130K–$250K | **India:** ₹15L–₹50L

---

### 7. Prompt Engineer (Entry-Level → Intermediate)
**What you do:**
- Design and optimize prompts for specific tasks and models
- Build prompt libraries and templates for different use cases
- Evaluate prompt quality (consistency, accuracy, safety, cost)
- A/B test different prompt strategies
- Document prompt patterns and best practices for the team

**Why it fits you:**
- Easiest entry point into AI roles — no coding-heavy ML required
- Good starting point to learn how LLMs behave before moving to engineering roles
- However, it's often seen as a transitional role rather than a long-term career

**Typical tech stack:**
- Any language (Python preferred)
- Prompt engineering frameworks (Chain-of-Thought, ReAct, Few-Shot)
- Evaluation tools (Promptfoo, LangSmith)
- Version control for prompts (Git-based prompt management)

**Salary range (US):** $70K–$130K | **India:** ₹5L–₹15L

---

## Role Comparison Matrix

| Role | Difficulty | Math Required | Coding Required | Guardrails | Token Optimization | Harness Building | Demand (2026) |
|---|---|---|---|---|---|---|---|
| LLM App Developer | ⭐⭐ | Low | Medium | ✅ Core | ✅ Core | ✅ Core | 🔥 Very High |
| AI Platform Engineer | ⭐⭐⭐ | Low | High | ✅ | ✅ Core | ⚠️ Partial | 🔥 High |
| AI Safety Engineer | ⭐⭐⭐ | Medium | Medium | ✅ Core | ⚠️ Partial | ✅ Core | 📈 Growing |
| RAG Engineer | ⭐⭐ | Low | Medium | ✅ | ✅ Core | ⚠️ Partial | 🔥 Very High |
| AI Agent Engineer | ⭐⭐⭐ | Medium | High | ✅ Core | ✅ | ✅ Core | 🔥 Very High |
| ML/AI Engineer | ⭐⭐⭐⭐ | High | High | ⚠️ Partial | ✅ | ⚠️ Partial | 📈 High |
| Prompt Engineer | ⭐ | Low | Low | ⚠️ Partial | ⚠️ Partial | ❌ | 📉 Declining as a standalone role |

---

## Recommended Path for Your Profile

Given your background (3 YOE React Native, basic backend, interested in guardrails + token optimization + harnesses):

### Primary Path: LLM Application Developer → AI Agent Engineer

This is the most natural progression for you:

```
Phase 1 (Months 1–3):  LLM App Developer (Beginner)
Phase 2 (Months 4–6):  RAG Engineer (Intermediate)
Phase 3 (Months 7–12): AI Agent Engineer (Intermediate → Senior)
Phase 4 (Year 2+):     AI Platform Engineer or AI Safety Engineer (Senior)
```

### Why this path?
1. **LLM App Developer** leverages your existing app development skills — you'll build AI-powered features, not train models
2. **Guardrails** are a core part of app development (input validation, output filtering, safety checks)
3. **Token optimization** is critical in app development (cost control, latency)
4. **Harness building** naturally leads to agent engineering (building frameworks around LLMs)
5. Each phase builds on the previous one — you never start from zero

### Skills to leverage from your React Native background:
- **App architecture** → you already understand how to structure complex applications
- **State management** → LLM conversation state, agent memory, and context management are similar problems
- **API integration** → you've built HTTP clients, handled auth, managed tokens — same patterns apply to LLM APIs
- **Mobile performance** → token optimization and model quantization for mobile is a growing niche
- **Cross-platform development** → building AI features that work on iOS, Android, and web is valuable

---

## Learning Roadmap by Role

### Phase 1: LLM Application Developer (Months 1–3)

#### Week 1–2: Foundations
- [ ] Learn Python basics (if not already comfortable) — focus on APIs, async, data structures
- [ ] Understand how LLMs work: tokens, embeddings, attention, autoregressive generation
- [ ] Read: [Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)
- [ ] Read: [GPT-style autoregressive models explained](https://www.youtube.com/watch?v=kCc8FmEb1nY)

#### Week 3–4: LLM APIs & Basic Integration
- [ ] OpenAI API: chat completions, streaming, function calling
- [ ] Anthropic API: messages API, system prompts, tool use
- [ ] Build a simple chatbot with conversation history
- [ ] Implement token counting and cost tracking
- [ ] Learn: `tiktoken` library for tokenization

#### Week 5–6: Prompt Engineering
- [ ] Master prompt patterns: Zero-shot, Few-shot, Chain-of-Thought, ReAct
- [ ] Learn prompt chaining and prompt routing
- [ ] Build a prompt library with versioning
- [ ] Evaluate prompts for accuracy, consistency, and cost
- [ ] Tool: [Promptfoo](https://github.com/promptfoo/promptfoo)

#### Week 7–8: Guardrails (Your Core Interest)
- [ ] Input guardrails: validate user input before sending to LLM
- [ ] Output guardrails: validate LLM responses (schema validation, content filtering)
- [ ] Implement with [Guardrails AI](https://github.com/guardrails-ai/guardrails)
- [ ] Implement with [NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails)
- [ ] Build custom middleware for: PII detection, toxicity filtering, hallucination detection
- [ ] Learn: JSON Schema validation for LLM outputs

#### Week 9–10: Token Optimization (Your Core Interest)
- [ ] Understand token economics: input vs output costs, cache hits
- [ ] Implement prompt compression (remove redundancy, use shorter synonyms)
- [ ] Implement response caching (semantic cache with embeddings)
- [ ] Learn: KV cache, prefix caching, continuous batching
- [ ] Build a token budget manager (cap costs per user/session)
- [ ] Implement model routing (send simple queries to cheaper models)

#### Week 11–12: RAG Basics
- [ ] Understand embeddings and vector similarity search
- [ ] Build a simple RAG pipeline: ingest → embed → store → retrieve → augment → generate
- [ ] Use LangChain or LlamaIndex for orchestration
- [ ] Try vector databases: Pinecone (free tier), Qdrant (local), pgvector
- [ ] Evaluate retrieval quality (precision, recall, relevance)

---

### Phase 2: RAG Engineer (Months 4–6)

- [ ] Advanced document parsing (PDFs, images, tables, HTML)
- [ ] Chunking strategies (fixed-size, semantic, recursive, sentence-window)
- [ ] Hybrid search (sparse + dense retrieval, BM25 + vector)
- [ ] Re-ranking (Cohere Rerank, cross-encoder models)
- [ ] Query expansion and decomposition
- [ ] Multi-hop retrieval (answer questions that require multiple documents)
- [ ] Context window management (summarization, compression, sliding window)
- [ ] Evaluate RAG systems with [Ragas](https://github.com/explodinggradients/ragas) or [DeepEval](https://github.com/confident-ai/deepeval)
- [ ] Build a production-ready RAG system with caching, retry logic, and monitoring

---

### Phase 3: AI Agent Engineer (Months 7–12)

- [ ] Understand agent architectures: ReAct, Plan-and-Execute, Reflexion
- [ ] Build tools/function-calling schemas for agents
- [ ] Implement agent memory (short-term conversation + long-term knowledge base)
- [ ] Build multi-agent systems (supervisor agent, worker agents, routing)
- [ ] Learn [LangGraph](https://langchain-ai.github.io/langgraph/) for agent orchestration
- [ ] Implement guardrails for agents (cost caps, action limits, safety constraints)
- [ ] Build agent evaluation frameworks (task completion rate, cost per task, safety score)
- [ ] Learn MCP (Model Context Protocol) — emerging standard for agent-tool integration
- [ ] Build a production agent system with monitoring, logging, and error recovery

---

### Phase 4: Senior-Level Specialization (Year 2+)

#### Option A: AI Platform Engineer
- [ ] Model serving: Triton Inference Server, vLLM, TensorRT-LLM
- [ ] GPU optimization: quantization (GPTQ, AWQ, GGUF), batching, continuous batching
- [ ] Infrastructure: Kubernetes, autoscaling, cost optimization
- [ ] Observability: LangSmith, Weights & Biases, custom dashboards
- [ ] Multi-model routing and load balancing

#### Option B: AI Safety / Alignment Engineer
- [ ] Red-teaming methodologies
- [ ] Adversarial testing (jailbreaks, prompt injection, data poisoning)
- [ ] Bias detection and mitigation
- [ ] Evaluation frameworks (human evaluation, automated benchmarks)
- [ ] Regulatory compliance (EU AI Act, NIST AI RMF)
- [ ] Build safety evaluation pipelines

---

## Key Skills Breakdown

### Must-Have Skills (All AI Roles)
| Skill | Why | How to Learn |
|---|---|---|
| Python | Primary language for AI/ML ecosystem | Practice with APIs, LangChain, FastAPI |
| TypeScript/Node.js | Your existing strength; many AI tools use TS | Build AI integrations in your React Native apps |
| API Design | LLMs are consumed via APIs | Build REST APIs with FastAPI or Express |
| Prompt Engineering | Core skill for any LLM role | Practice, read papers, use Promptfoo |
| Token Awareness | Cost and performance optimization | Use tiktoken, build token budget tools |
| Vector Databases | RAG requires them | Pinecone, Qdrant, pgvector |
| Git & CI/CD | Standard engineering practice | Use in all projects |

### Guardrails-Specific Skills
| Skill | Tools/Libraries |
|---|---|
| Input validation | Pydantic, JSON Schema, Zod |
| Output validation | Guardrails AI, NeMo Guardrails, custom validators |
| Content moderation | Perspective API, Llama Guard, custom classifiers |
| PII detection | Presidio, custom regex + NER |
| Hallucination detection | Self-check prompts, fact-checking APIs, RAG-based verification |
| Safety evaluation | Red-teaming, adversarial testing, Promptfoo |

### Token Optimization-Specific Skills
| Skill | Details |
|---|---|
| Token counting | tiktoken, Anthropic's tokenizer, custom tokenizers |
| Prompt compression | Remove redundancy, use shorter synonyms, compress context |
| Semantic caching | Cache similar queries using embeddings (Redis + vector similarity) |
| KV cache management | Understand attention cache, prefix caching, continuous batching |
| Model routing | Route queries to cheapest model that meets quality threshold |
| Cost tracking | Per-user, per-session, per-feature cost attribution |

### Harness-Building Skills
| Skill | Details |
|---|---|
| Agent frameworks | LangGraph, AutoGen, CrewAI |
| Tool/function calling | OpenAI function calling, Anthropic tool use, MCP |
| Memory systems | Short-term (conversation), long-term (vector store), episodic |
| Orchestration | Workflow engines, state machines, error recovery |
| Evaluation | Ragas, DeepEval, custom benchmarks, A/B testing |

---

## Portfolio Projects

### Beginner Projects (Show You Can Build with LLMs)
1. **Smart Chatbot with Guardrails** — A chatbot that validates user input, filters harmful content, and enforces output schemas
2. **Token Cost Tracker** — A middleware that logs token usage per request, per user, per feature, with cost alerts
3. **RAG Document Q&A** — Upload PDFs, ask questions, get answers with source citations

### Intermediate Projects (Show Depth)
4. **AI Agent with Tool Use** — An agent that can search the web, query a database, and call APIs to answer complex questions
5. **Semantic Cache Layer** — A Redis-backed semantic cache that reduces LLM API calls by 60%+ for repeated/similar queries
6. **Multi-Model Router** — A routing layer that sends queries to the best model based on task type, cost, and latency requirements

### Advanced Projects (Show Senior-Level Thinking)
7. **Guardrails-as-a-Service** — A reusable middleware service that any app can plug in for input/output validation, content moderation, and PII redaction
8. **LLM Evaluation Platform** — A tool that runs automated evaluations on prompts/models, tracks regressions, and generates reports
9. **On-Device LLM for Mobile** — Run a quantized LLM on mobile (React Native + ONNX Runtime) for offline AI features with token optimization

---

## Certifications & Resources

### Certifications
| Certification | Provider | Relevance |
|---|---|---|
| AWS Machine Learning Specialty | AWS | Cloud ML deployment, inference optimization |
| TensorFlow Developer Certificate | TensorFlow | ML fundamentals (if going ML Engineer path) |
| Deep Learning Specialization | DeepLearning.AI (Coursera) | Neural network fundamentals |
| LangChain Certification | LangChain | LLM app development (in progress) |
| AI Engineering Professional Certificate | DeepLearning.AI | Comprehensive AI engineering path |

### Key Resources
| Resource | Type | Focus |
|---|---|---|
| [LLM Engineering Guide](https://github.com/daveebbelaar/llm-engineering-guide) | Book/GitHub | Comprehensive LLM engineering |
| [DeepLearning.AI Short Courses](https://www.deeplearning.ai/short-courses/) | Free courses | LangChain, prompt engineering, RAG, agents |
| [Hugging Face Course](https://huggingface.co/learn) | Free course | Transformers, fine-tuning, deployment |
| [NeMo Guardrails Docs](https://docs.nvidia.com/nemo-guardrails/) | Documentation | Building guardrails for LLMs |
| [Guardrails AI Docs](https://docs.guardrailsai.com/) | Documentation | Output validation framework |
| [LangChain Docs](https://python.langchain.com/) | Documentation | LLM orchestration framework |
| [LlamaIndex Docs](https://docs.llamaindex.ai/) | Documentation | RAG framework |
| [Prompt Engineering Guide](https://www.promptingguide.ai/) | Guide | Prompt patterns and techniques |
| [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/en/docs/prompt-engineering) | Guide | Claude-specific prompting |
| [Token Optimization Blog](https://platform.openai.com/docs/guides/chat/introduction) | Docs | OpenAI token best practices |

### Communities & Staying Updated
- **r/LocalLLaMA** — Reddit community for open-source LLMs
- **r/LLMDev** — Reddit for LLM application development
- **LangChain Discord** — Active community for LLM app builders
- **AI Engineer Discord** — Community for AI engineers
- **Twitter/X** — Follow Andrej Karpathy, Ian Goodfellow, Lilian Weng, Sebastian Raschka
- **Newsletters:** The Batch (DeepLearning.AI), AI News, MLOps Community

---

## Quick Start: Your First 30 Days

### Week 1: Set Up Environment
- Install Python 3.11+, Node.js 20+
- Get OpenAI API key and Anthropic API key
- Create a GitHub repo for AI projects
- Install: `pip install openai anthropic tiktoken langchain`

### Week 2: Build Your First LLM App
- Create a simple chatbot with conversation history
- Add token counting and cost tracking
- Implement basic prompt engineering (few-shot, CoT)
- Deploy to Vercel or Render

### Week 3: Add Guardrails
- Add input validation (Pydantic + Zod)
- Add output validation (JSON schema enforcement)
- Implement content filtering (toxicity check)
- Add PII detection and redaction

### Week 4: Optimize Tokens
- Implement prompt compression
- Add semantic caching (Redis + embeddings)
- Build a token budget manager
- Write a blog post or tweet about your learnings

---

## Summary: Your Career Path

```
React Native Developer (Current)
        │
        ▼
LLM Application Developer ←── Month 1–3 (leverage your app skills)
        │
        ▼
RAG Engineer ←────────────── Month 4–6 (token optimization is core here)
        │
        ▼
AI Agent Engineer ←───────── Month 7–12 (harness building is core here)
        │
        ├──→ AI Platform Engineer (Year 2+) — infrastructure, scaling
        ├──→ AI Safety Engineer (Year 2+) — guardrails, alignment, compliance
        └──→ Staff AI Engineer (Year 3+) — architecture, strategy, mentoring
```

**Your React Native + basic backend background is a genuine advantage** — you can build AI-powered products end-to-end, which is what most companies need. The guardrails, token optimization, and harness-building skills you're interested in are exactly what separates a "prompt tinkerer" from a production AI engineer.
