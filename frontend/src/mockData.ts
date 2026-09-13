import type { BlogRun, Source, PlanSection, AdminUser, SecurityEvent, WorkflowStep } from './types'

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'guardrail', label: 'Topic Guardrail', description: 'Checking topic safety and educational relevance' },
  { id: 'outline', label: 'Outline Generator', description: 'Creating a structured blog outline with sections' },
  { id: 'outline-review', label: 'Outline Review', description: 'Awaiting your review before research begins', isHITL: true },
  { id: 'safety', label: 'Safety Check', description: 'Validating approved outline for safe content' },
  { id: 'research', label: 'Web Research', description: 'Gathering evidence from trusted technical sources' },
  { id: 'research-plan', label: 'Research Planning', description: 'Organizing evidence by section and relevance' },
  { id: 'writing', label: 'Section Writing', description: 'Parallel AI agents writing each section' },
  { id: 'merge', label: 'Content Merge', description: 'Combining all sections into a unified draft' },
  { id: 'image-plan', label: 'Image Planning', description: 'Identifying diagrams and visual assets needed' },
  { id: 'image-gen', label: 'Image Generation', description: 'Creating technical diagrams and illustrations' },
  { id: 'final-review', label: 'Final Review', description: 'AI quality validation and fact-checking' },
  { id: 'final-blog', label: 'Final Blog', description: 'Your blog is ready for final approval', isHITL: true },
]

export const MOCK_RUNS: BlogRun[] = [
  {
    id: 'run_9f3a1b2c',
    topic: 'Retrieval-Augmented Generation in Production: Architecture and Best Practices',
    status: 'completed',
    created: '2026-09-12T14:23:00Z',
    updated: '2026-09-12T15:10:00Z',
    user: 'alex.chen',
  },
  {
    id: 'run_7d2e4f5a',
    topic: 'Kubernetes Observability with OpenTelemetry',
    status: 'waiting',
    created: '2026-09-13T09:05:00Z',
    updated: '2026-09-13T09:18:00Z',
    user: 'alex.chen',
  },
  {
    id: 'run_3b8c9d1e',
    topic: 'Building Type-Safe APIs with TypeScript and Zod',
    status: 'failed',
    created: '2026-09-11T11:40:00Z',
    updated: '2026-09-11T11:52:00Z',
    user: 'alex.chen',
    error: 'Research agent timeout after 3 retries',
  },
]

export const MOCK_SOURCES: Source[] = [
  {
    id: 's1',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    url: 'https://arxiv.org/abs/2005.11401',
    publisher: 'arXiv / Facebook AI Research',
    type: 'paper',
    section: 'Introduction to RAG',
    snippet: 'RAG combines parametric and non-parametric memory for language generation, achieving state-of-the-art results on knowledge-intensive NLP tasks without fine-tuning.',
    date: '2020-05-22',
  },
  {
    id: 's2',
    title: 'LangChain RAG — Retrieval-Augmented Generation',
    url: 'https://python.langchain.com/docs/use_cases/question_answering/',
    publisher: 'LangChain',
    type: 'documentation',
    section: 'Implementation Patterns',
    snippet: 'LangChain provides first-class support for RAG pipelines with pluggable retrievers, vector stores, and LLM backends including OpenAI, Anthropic, and local models.',
    date: '2026-08-15',
  },
  {
    id: 's3',
    title: 'Choosing a Vector Database: Pinecone vs Weaviate vs Chroma vs pgvector',
    url: 'https://www.datastax.com/blog/vector-database-comparison',
    publisher: 'DataStax Engineering',
    type: 'publication',
    section: 'Vector Store Selection',
    snippet: 'A systematic comparison of embedding dimensions, query latency at scale, filtering capabilities, and total cost of ownership across leading vector database solutions.',
    date: '2026-06-30',
  },
  {
    id: 's4',
    title: 'AWS Well-Architected Framework: Machine Learning Lens',
    url: 'https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/',
    publisher: 'Amazon Web Services',
    type: 'documentation',
    section: 'Production Deployment',
    snippet: 'The ML Lens describes key concepts, design principles, and architectural best practices for designing and operating machine learning workloads on AWS.',
    date: '2026-01-10',
  },
]

export const MOCK_PLAN_SECTIONS: PlanSection[] = [
  {
    id: 1,
    title: 'What is Retrieval-Augmented Generation?',
    goal: 'Explain RAG architecture and why it solves hallucination and knowledge cutoff problems in LLMs',
    researchFocus: 'Original RAG paper (Lewis et al., 2020), recent LLM hallucination studies, industry adoption statistics',
  },
  {
    id: 2,
    title: 'Core Components of a RAG Pipeline',
    goal: 'Detail the document loader, chunker, embedder, vector store, retriever, and generator components',
    researchFocus: 'LangChain docs, LlamaIndex architecture guide, Haystack framework documentation',
  },
  {
    id: 3,
    title: 'Vector Database Selection Guide',
    goal: 'Compare Pinecone, Weaviate, Chroma, and pgvector for production workloads with concrete benchmarks',
    researchFocus: 'Benchmark studies, vendor documentation, ANN Benchmarks, community production reports',
  },
  {
    id: 4,
    title: 'Production Deployment Patterns',
    goal: 'Cover caching strategies, monitoring, A/B testing retrieval quality, and cost optimization at scale',
    researchFocus: 'AWS Well-Architected ML Lens, production case studies from Notion, Quora, and Shopify engineering blogs',
  },
  {
    id: 5,
    title: 'Common Failure Modes and Mitigation Strategies',
    goal: 'Address retrieval quality degradation, context window overflow, and latency issues with concrete solutions',
    researchFocus: 'GitHub issues from major RAG libraries, MLOps conference talks, engineering postmortems',
  },
]

export const MOCK_USERS: AdminUser[] = [
  { id: 'u1', username: 'alex.chen', role: 'user', joined: '2026-07-15', blogsCreated: 12, lastActive: '2026-09-13' },
  { id: 'u2', username: 'sarah.kim', role: 'admin', joined: '2026-05-01', blogsCreated: 28, lastActive: '2026-09-13' },
  { id: 'u3', username: 'marcus.obi', role: 'user', joined: '2026-08-22', blogsCreated: 5, lastActive: '2026-09-12' },
  { id: 'u4', username: 'priya.sharma', role: 'user', joined: '2026-06-10', blogsCreated: 19, lastActive: '2026-09-11' },
  { id: 'u5', username: 'ben.foster', role: 'user', joined: '2026-09-01', blogsCreated: 3, lastActive: '2026-09-10' },
  { id: 'u6', username: 'liu.wei', role: 'user', joined: '2026-08-05', blogsCreated: 8, lastActive: '2026-09-09' },
]

export const ALL_RUNS: BlogRun[] = [
  { id: 'run_9f3a1b2c', topic: 'RAG in Production: Architecture and Best Practices', status: 'completed', created: '2026-09-12T14:23:00Z', updated: '2026-09-12T15:10:00Z', user: 'alex.chen' },
  { id: 'run_7d2e4f5a', topic: 'Kubernetes Observability with OpenTelemetry', status: 'waiting', created: '2026-09-13T09:05:00Z', updated: '2026-09-13T09:18:00Z', user: 'alex.chen' },
  { id: 'run_3b8c9d1e', topic: 'Building Type-Safe APIs with TypeScript and Zod', status: 'failed', created: '2026-09-11T11:40:00Z', updated: '2026-09-11T11:52:00Z', user: 'alex.chen', error: 'Research agent timeout after 3 retries' },
  { id: 'run_2a7f0e4b', topic: 'Service Mesh Architecture with Istio 1.22', status: 'completed', created: '2026-09-10T08:30:00Z', updated: '2026-09-10T09:45:00Z', user: 'sarah.kim' },
  { id: 'run_1c5d9a3f', topic: 'Zero-Trust Network Security for Cloud-Native Workloads', status: 'completed', created: '2026-09-09T16:00:00Z', updated: '2026-09-09T17:20:00Z', user: 'priya.sharma' },
  { id: 'run_8e2b6f0c', topic: 'GraphQL vs REST: A 2026 Architectural Perspective', status: 'running', created: '2026-09-13T10:00:00Z', updated: '2026-09-13T10:32:00Z', user: 'marcus.obi' },
]

export const SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'sec_001',
    runId: 'run_8a3b1c2d',
    username: 'guest_user42',
    attempted: 'How to hack into corporate networks',
    result: 'How to understand corporate network security architecture',
    timestamp: '2026-09-13T08:15:00Z',
  },
  {
    id: 'sec_002',
    runId: 'run_5f9e2a1b',
    username: 'new_user99',
    attempted: 'Write malware that steals passwords',
    result: 'Understanding password security and credential protection best practices',
    timestamp: '2026-09-12T16:42:00Z',
  },
  {
    id: 'sec_003',
    runId: 'run_3c7d4e8f',
    username: 'dev_user07',
    attempted: 'How to exploit SQL injection vulnerabilities in production systems',
    result: 'Understanding and preventing SQL injection vulnerabilities',
    timestamp: '2026-09-11T11:30:00Z',
  },
]

export const BLOG_DRAFT = `# Retrieval-Augmented Generation in Production
## Architecture and Best Practices

Retrieval-Augmented Generation (RAG) has emerged as the dominant pattern for building production-grade AI applications that require factual accuracy and domain-specific knowledge. Unlike pure generation approaches that rely solely on parametric memory, RAG systems dynamically retrieve relevant documents at inference time, grounding model output in verifiable sources.

---

## What is Retrieval-Augmented Generation?

RAG was formally introduced by Lewis et al. (2020) in their paper *"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks."* The core insight is elegant: instead of expecting a language model to memorize everything it needs to know, give it a dynamic memory system it can query at runtime.

A RAG pipeline consists of two primary phases:

- **Indexing** — Documents are loaded, chunked, embedded into vectors, and stored in a vector database.
- **Retrieval + Generation** — At query time, the input is embedded, semantically similar chunks are retrieved, and the LLM generates a response conditioned on those chunks.

\`\`\`python
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA

embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4o"),
    retriever=retriever,
    return_source_documents=True,
)
\`\`\`

---

## Core Components of a RAG Pipeline

### Document Loading and Chunking

The quality of your RAG system is heavily influenced by how you split documents. Common strategies include:

| Strategy | Best For | Chunk Size |
|---|---|---|
| Fixed-size chunking | Simple documents | 512–1024 tokens |
| Semantic chunking | Technical documentation | Variable |
| Recursive character splitting | Mixed content | 256–512 tokens |

### Vector Store Selection

For production workloads, your vector store choice significantly impacts query latency, cost, and operational complexity.

\`\`\`
Provider    Hosted  Filtering  Max Vectors  P95 Latency
Pinecone    Yes     Advanced   Unlimited    ~10ms
Weaviate    Both    Advanced   Unlimited    ~15ms
Chroma      No      Basic      Millions     ~5ms
pgvector    Both    Full SQL   Millions     ~20ms
\`\`\`

---

## Production Deployment Patterns

### Caching Strategy

Implement a two-layer caching system to reduce both latency and cost:

1. **Embedding cache** — Cache embeddings for frequently queried documents using Redis with TTL policies
2. **Response cache** — Cache complete responses for identical or semantically similar queries using cosine similarity thresholds

### Monitoring and Observability

Production RAG systems require specialized monitoring beyond standard API metrics:

- **Retrieval quality** — Track MRR, NDCG, and recall@k for your retrieval step
- **Generation faithfulness** — Use LLM-as-a-judge to detect hallucinations relative to retrieved context
- **Context utilization** — Monitor how much of the retrieved context the model actually uses
- **End-to-end latency** — Track P50, P95, P99 across the full pipeline

---

## Common Failure Modes and Mitigations

### Retrieval Quality Degradation

The most common production failure is retrieval drift — your vector store accumulates stale embeddings as your document corpus evolves. Mitigate this by implementing:

- Automated re-indexing pipelines triggered by document updates
- Retrieval quality regression tests in your CI/CD pipeline
- A/B testing infrastructure to compare retrieval strategies

### Context Window Overflow

As retrieved chunks grow, you risk exceeding the model's context window. Solutions include:

- **Reranking** — Use a cross-encoder reranker to select the most relevant k chunks after initial retrieval
- **Compression** — Apply LLM-based context compression to reduce chunk size while preserving semantics
- **Map-reduce** — Process long documents in parallel chunks and synthesize results
`

export const MOCK_ACTIVITY = [
  { id: 'a1', event: 'Blog generation started', time: '2026-09-12T14:23:00Z', detail: 'Topic submitted for processing' },
  { id: 'a2', event: 'Topic guardrail passed', time: '2026-09-12T14:23:08Z', detail: 'No safety concerns detected' },
  { id: 'a3', event: 'Outline generated', time: '2026-09-12T14:24:15Z', detail: '5 sections planned by Outline Generator agent' },
  { id: 'a4', event: 'Outline approved by user', time: '2026-09-12T14:31:40Z', detail: 'No modifications made' },
  { id: 'a5', event: 'Web research started', time: '2026-09-12T14:31:45Z', detail: 'Searching 5 sections across technical sources' },
  { id: 'a6', event: 'Research completed', time: '2026-09-12T14:44:20Z', detail: '24 sources collected, 4 high-quality selected' },
  { id: 'a7', event: 'Section writing started', time: '2026-09-12T14:44:25Z', detail: '5 parallel writer agents initialized' },
  { id: 'a8', event: 'Content merged', time: '2026-09-12T15:02:10Z', detail: 'All sections combined — 4,200 words' },
  { id: 'a9', event: 'Final review completed', time: '2026-09-12T15:09:45Z', detail: 'Quality score: 94/100' },
  { id: 'a10', event: 'Blog approved by user', time: '2026-09-12T15:10:00Z', detail: 'Published to My Blogs' },
]
