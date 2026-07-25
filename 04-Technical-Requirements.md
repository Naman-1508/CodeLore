# CodeLore — Technical Requirements Document

---

## 1. Overall Architecture

CodeLore is split into two independently deployable planes, matching the product split defined in the PRD:

```
                         ┌─────────────────────────────┐
                         │        Frontend (SPA)        │
                         └───────────────┬──────────────┘
                                          │ REST / WebSocket
                         ┌───────────────▼──────────────┐
                         │        API Gateway / BFF      │
                         └───────────────┬──────────────┘
                 ┌────────────────────────┼────────────────────────┐
                 ▼                        ▼                        ▼
     ┌───────────────────┐   ┌───────────────────────┐   ┌──────────────────────┐
     │   Core Engine      │   │   AI Enrichment Layer  │   │   Platform Services   │
     │  (always available)│   │  (optional, pluggable) │   │ (auth, billing, teams)│
     ├─────────────────────┤   ├───────────────────────┤   ├──────────────────────┤
     │ Parser Service      │   │ LLM Provider Adapter   │   │ Auth Service          │
     │ Analysis Service     │   │ Mentor Orchestrator    │   │ Workspace Service     │
     │  (blast radius,      │   │ Narration Service      │   │ Billing/Usage Service │
     │   co-change, health,  │   │ Semantic Search Service│   └──────────────────────┘
     │   architect findings) │   └───────────────────────┘
     │ Git Ingestion Service │
     │ Search Indexing Service│
     └───────────┬───────────┘
                  │
     ┌────────────▼─────────────┐
     │  PostgreSQL │ Elastic │   │
     │  Redis      │ Object Store│
     └───────────────────────────┘
```

**Governing rule**: the AI Enrichment Layer calls into the Core Engine (to read facts), never the reverse. The Core Engine has no compile-time or runtime dependency on the AI layer's services or SDKs. This is enforced by:
- Separate deployable services (own repos or clearly bounded modules in a monorepo).
- The AI layer being entirely removable via a feature flag / workspace setting without redeploying the Core Engine.

---

## 2. Frontend

- **Framework**: React (TypeScript), single-page application.
- **State/data layer**: Server state via a query/cache library (e.g., TanStack Query) — matches the read-heavy, cache-friendly nature of Core Engine data. Local UI state kept minimal and component-local.
- **Diagramming**: Custom rendering for Code Story step-cards and Module Map (not a generic off-the-shelf graph library for the primary views — needed for the "flow diagram," "vertical card stack," and Architecture Replay-specific interactions from the UI/UX brief). A graph library (e.g., a WebGL-based renderer) is used specifically for the Dependency Explorer, where a true force-directed/hierarchical graph is appropriate.
- **Real-time updates**: WebSocket connection for indexing progress and long-running analysis jobs (parsing status, Architect Mode recompute).
- **Rendering strategy**: Client-rendered SPA is sufficient (authenticated, tool-like product — no SEO requirement for the app itself; marketing/landing page can be a separate statically generated site).

---

## 3. Backend

- **Language/runtime**: A statically typed backend language suited to both CPU-bound analysis work and I/O-bound API serving. Recommended: **Go** for the Core Engine analysis/indexing services (concurrency model fits parallel parsing/analysis well; easy to distribute as workers), and **Node.js/TypeScript** for the API Gateway/BFF and AI Enrichment Layer (shares types with frontend, and most LLM provider SDKs are first-class in this ecosystem).
- **Service boundaries**: Parser Service, Analysis Service, Git Ingestion Service, Search Indexing Service (Core Engine); LLM Provider Adapter, Mentor Orchestrator, Narration Service, Semantic Search Service (AI layer); Auth, Workspace, Billing (Platform).
- **Inter-service communication**: gRPC or internal REST between services; async work (indexing, analysis, AI narration generation) goes through the message broker (§ 12), not synchronous service-to-service calls, to keep the API responsive.

---

## 4. Database

- **PostgreSQL** as system of record (see Database Schema document for full detail) — chosen over a NoSQL primary store because the data is genuinely relational (files → functions → call edges → commits) and the product depends heavily on join-heavy, ranked, and windowed queries (Blast Radius, Contribution Readiness, trend history) that a relational engine handles far more reliably than a document store.
- Connection pooling via PgBouncer; read replicas for dashboard/search-adjacent read traffic as described in the schema doc's scalability section.

---

## 5. Search Engine

- **Elasticsearch/OpenSearch** for symbol, file, and (optional) semantic search.
- Two logical indexes per repository: `symbols` (functions, classes — structural, always populated) and `semantic` (embeddings-backed, only populated/queried if the AI layer is enabled for the workspace).
- Symbol index updates incrementally on each re-index; full reindex only on parser version upgrades or explicit user request.

---

## 6. Graph Engine

- Call graph and dependency graph are stored relationally (Postgres, per schema doc) rather than in a dedicated graph database. Rationale: query patterns are shallow-depth (1–3 hop traversals for Blast Radius, module-level aggregation for Architecture View) rather than deep/arbitrary graph traversal — Postgres with proper indexing handles this efficiently and avoids operating a second specialized database for the MVP.
- **Re-evaluation trigger**: if usage data shows demand for deep multi-hop traversal queries (e.g., "all paths between A and B") at a scale Postgres recursive CTEs can't serve performantly, introduce a dedicated graph store (e.g., Neo4j) as an additional read-optimized index fed by the same Postgres source of truth — not a replacement for it.

---

## 7. Parser Engine

- **Tree-sitter** based parsing for initial language support (JavaScript/TypeScript, Python, Java/Kotlin) — chosen for its incremental parsing performance, broad language grammar availability, and error tolerance on real-world (not perfectly valid) code.
- Parser output is normalized into a language-agnostic intermediate representation (files, symbols, imports, call sites) before being written to Postgres — this is the seam that makes adding new languages a matter of writing a new parser adapter, not touching the Analysis Service.
- Parsing runs as isolated worker jobs (one per repository per indexing run), horizontally scalable, with resource limits (memory/time) per job to contain runaway parses on pathological files.

---

## 8. LLM Integration

- **Provider-agnostic adapter interface**: `LLMProvider` with methods like `generateNarration(context)`, `answerMentorQuery(context, history)`, `embedText(text)`. Concrete implementations for Anthropic, OpenAI, Azure OpenAI, etc.
- **Grounding, not freeform generation**: every call to the LLM Provider Adapter is constructed with a context payload built entirely from Core Engine query results (the specific `call_edge`, `architect_finding`, `commit_file_change` rows relevant to the question) — the adapter never has open-ended access to raw source code beyond what's explicitly included for the current query, keeping context bounded and answers auditable via `fact_reference` rows.
- **Fallback contract**: every AI-layer service method has a defined, tested fallback path returning Core Engine data directly when the provider call fails, times out, or the workspace's quota (`ai_provider_config.monthly_token_cap`) is exceeded. Fallback is a first-class return type, not an exception swallowed silently.
- **Cost control**: token usage recorded per `ai_message`/`ai_narration` row (per schema doc); Billing/Usage Service enforces `monthly_token_cap` before dispatching a request, not after.

---

## 9. Authentication

- OAuth-based sign-in (GitHub OAuth as primary, given the developer-tool audience and natural repository-import flow) plus standard email/password as a fallback.
- Session tokens as short-lived JWTs with refresh tokens; refresh tokens stored server-side (revocable) rather than purely stateless, since revocation (e.g., on suspicious activity or offboarding) matters for a product with repository access.

---

## 10. Authorization

- Role-based access control at the workspace level (`owner`, `admin`, `member`, `viewer` per the schema's `membership.role`), with repository-level visibility optionally restricted for larger workspaces (future scope, not MVP).
- AI layer configuration (provider credentials, quota) is `admin`/`owner`-only; standard members can use the Mentor but cannot view or change provider credentials.
- Authorization checks are centralized in the API Gateway/BFF layer, not duplicated per downstream service, to keep policy in one place.

---

## 11. Caching

Covered in detail in the Database Schema document (§6 Caching Strategy). Technical summary: Redis for computed-result caching (keyed and invalidated per repository re-index) and job/queue metadata; object storage + CDN for large, infrequently-changing artifacts (module graph payloads, Architecture Replay snapshots).

---

## 12. Queues / Message Broker

- **Message broker**: A durable queue (e.g., Redis Streams for simpler deployments, or Kafka/RabbitMQ at larger scale) coordinates the indexing pipeline: `repository.import.requested` → `clone.completed` → `parse.completed` → `analysis.completed` → `search_index.completed`.
- Each stage is an independently scalable worker pool. A repository's indexing status (`repository.indexing_status`) is updated as each stage completes, and pushed to the frontend via WebSocket.
- AI enrichment jobs (bulk narration generation for a newly created Code Story library, for example) are queued separately from the Core Engine pipeline, so AI-layer backlog or slowness never delays Core Engine indexing completion.

---

## 13. Real-Time Features / WebSockets

- WebSocket channel per repository for indexing/analysis progress (parsing %, current stage, errors).
- WebSocket channel per active Mentor conversation for streaming AI responses token-by-token (standard chat UX expectation); falls back to a single polled response if streaming isn't supported by the configured provider.

---

## 14. File Storage

- **Object storage** (S3-compatible) for: cloned repository working copies (temporary, cleaned up post-parse or retained per a configurable retention policy), Architecture Replay snapshot artifacts, cached large diagram payloads.
- Repository source code content itself (beyond what's needed for parsing) is **not** duplicated into the database — Postgres stores structural facts (symbol names, line ranges, signatures), not full file contents, keeping the primary database size proportional to structure, not to raw LOC.

---

## 15. Repository Cloning / Git Integration

- Shallow clone by default (sufficient for structural parsing); full clone with history fetched separately and specifically for the Git Ingestion Service (needed for co-change, ownership, churn, and Architecture Replay).
- Support for GitHub and GitLab via OAuth-scoped access tokens for private repository import; public repositories importable via URL without connecting an account (supports the frictionless landing-page trial flow from the UI/UX brief).
- Incremental re-indexing: on webhook-triggered push events (or scheduled poll fallback), only new commits since `repository.last_indexed_commit_sha` are ingested and analyzed — avoids full re-parse on every change for large repositories.

---

## 16. Performance Goals

| Operation | Target |
|---|---|
| Initial index (500k LOC repo) | < 15 minutes end-to-end |
| Incremental re-index (typical push) | < 60 seconds |
| Blast Radius query (API response) | < 300ms p95 |
| Health Dashboard load | < 1s p95 (served from precomputed snapshots, not live computation) |
| Mentor response (first token, when AI enabled) | < 2s p95 |
| Search (symbol/file) | < 200ms p95 |

These targets directly justify the precomputation/snapshotting strategy in the schema (health scores, contribution scores, co-change pairs are all materialized ahead of query time, not computed on request).

---

## 17. Horizontal Scaling

- Stateless API Gateway/BFF and AI layer services scale horizontally behind a load balancer with no special considerations.
- Parser and Analysis Service workers scale horizontally per queue depth (standard worker-pool autoscaling on queue backlog).
- PostgreSQL scales vertically first, then via read replicas; workspace/repository-scoped sharding is the identified long-term path (per schema doc §9) if a single primary becomes a bottleneck.

---

## 18. Security

- Repository source code and derived structural data are strictly tenant-isolated by `workspace_id`/`repository_id` at the query layer (enforced in a shared data-access layer, not left to individual endpoint implementations).
- AI provider credentials encrypted at rest (`ai_provider_config.encrypted_credentials`), never logged, never included in error reports.
- **No code content is sent to any AI provider without the workspace's AI layer being explicitly enabled** — this is both a product principle and a security/compliance requirement, enforced at the LLM Provider Adapter's entry point (a hard check against `workspace.ai_layer_enabled` before any outbound call).
- Standard web application security practices: input validation, parameterized queries (no raw SQL string interpolation), dependency vulnerability scanning in CI, secrets management via a dedicated secrets store (not environment files in source control).

---

## 19. Logging

- Structured (JSON) logging across all services, correlated by a request/trace ID propagated through the API Gateway into downstream service calls and async job processing.
- AI layer logs explicitly tag `provider_status` (`success`/`fallback_used`/`error`) on every AI-involving request — this is the operational signal for how often users are experiencing the fallback path, feeding directly into the PRD's success metric around Core Engine usage.

---

## 20. Monitoring / Observability

- Metrics (e.g., via Prometheus): queue depth and processing latency per pipeline stage, API latency per endpoint (especially the performance-goal-bound ones in §16), AI provider error/timeout rate, cache hit rate.
- Distributed tracing across the indexing pipeline (clone → parse → analyze → index) to identify bottlenecks on large repositories.
- Alerting on: indexing pipeline stall/failure rate, AI provider error rate exceeding threshold (signals to warn workspace admins proactively, before their users hit the fallback UX unexpectedly), database replication lag.

---

## 21. CI/CD

- Standard trunk-based development with CI running on every PR: linting, type-checking, unit tests, integration tests against ephemeral database instances.
- Separate CI pipelines for Core Engine services and AI Enrichment Layer services — reinforces the architectural separation and allows independent release cadence (e.g., shipping a new LLM provider integration without touching or re-deploying the Parser/Analysis services).
- Deployment via containerized builds (Docker) to a container orchestration platform (Kubernetes, or a managed equivalent) enabling independent scaling per service as described in §17.

---

## 22. Deployment Strategy

- Blue/green or rolling deployments per service, with the Core Engine and AI layer deployed independently.
- Database migrations run as a separate, gated CI/CD step (never bundled automatically with application deployment) given the append-only/versioning strategy defined in the schema doc.
- Feature-flagged rollout for new Architect Mode rule types and new AI providers, allowing gradual enablement per workspace.

---

## 23. Cloud Architecture

- Cloud-agnostic where reasonably possible (containerized services, S3-compatible storage interface, standard Postgres/Redis/Elasticsearch) to avoid hard lock-in, while pragmatically using a single major cloud provider (AWS, GCP, or Azure) for managed database, object storage, and Kubernetes offerings to reduce operational overhead for a small initial team.
- Multi-AZ deployment for the primary database and core services from day one (indexing pipeline failures or downtime directly undermine the "reliable even without AI" value proposition — the Core Engine's own availability matters as much as its independence from AI).

---

## 24. Cost Considerations

- **Compute**: Parser/Analysis workers are the largest variable compute cost, scaling with number and size of indexed repositories — mitigated by incremental re-indexing (§15) rather than full re-parses.
- **AI provider cost**: fully isolated to the AI layer and metered per workspace (`ai_provider_config.monthly_token_cap`), so cost is never a Core Engine concern and is directly attributable/billable per workspace.
- **Storage**: object storage costs scale with repository size and Architecture Replay snapshot retention; a configurable retention/pruning policy for older replay snapshots and cloned working copies keeps this bounded.
- **Search**: Elasticsearch/OpenSearch cluster sized primarily for symbol search (always-on); semantic search indexing (AI-dependent) only provisioned for workspaces with the AI layer enabled, avoiding paying for embedding storage/compute that isn't used.

---

## 25. Technology Choices — Summary Table

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | React + TypeScript | Team familiarity, ecosystem maturity for complex data-viz UI |
| Core Engine backend | Go | Strong concurrency for parallel parsing/analysis workers |
| API/AI layer backend | Node.js/TypeScript | Shared types with frontend; mature LLM SDK ecosystem |
| Primary database | PostgreSQL | Relational, join-heavy access patterns dominate the product |
| Search | Elasticsearch/OpenSearch | Mature, well-understood symbol + optional semantic search |
| Cache | Redis | Standard, supports both caching and lightweight queue needs |
| Object storage | S3-compatible | Cheap, standard for large/infrequent-access artifacts |
| Parser | Tree-sitter | Incremental, error-tolerant, broad language grammar support |
| Message broker | Redis Streams → Kafka/RabbitMQ at scale | Start simple, defined upgrade path |

---

## 26. Trade-offs

- **Postgres for graph data instead of a graph database**: simpler operations and one fewer system to run, at the cost of needing to re-evaluate if deep-traversal query patterns emerge (explicitly flagged in §6 as a monitored decision, not a permanent one).
- **Precomputed/snapshotted scores over live computation**: faster reads and predictable dashboard performance, at the cost of scores being slightly stale between re-index runs — acceptable because "how healthy is this repo right now" doesn't need sub-minute freshness, and staleness bound is tied to (and visible via) `last_indexed_at`.
- **Two backend languages (Go + Node/TS) instead of one**: better fit per workload (CPU-bound parsing vs. I/O-bound API/AI orchestration) at the cost of some cross-team context switching — mitigated by the clean service boundary meaning most engineers work primarily in one or the other.
- **AI layer architecturally separated even at extra engineering cost**: slower to ship the first AI feature than a tightly-coupled "just call OpenAI from the main app" approach, but this is the trade-off that directly delivers the "70-80% still works without AI" requirement — treated as non-negotiable, not a nice-to-have.

---

## 27. API Design Philosophy

- REST for standard CRUD and query endpoints (repositories, files, findings, scores); WebSocket for streaming/progress use cases (§13) rather than forcing everything through polling or over-using GraphQL subscriptions.
- Every endpoint that returns AI-influenced content includes a `provider_status` field in its response payload (mirroring the database's `provider_status` columns), so the frontend can render the correct fallback state without a separate "is AI available" check — the data itself carries that signal.
- Versioned API (`/v1/...`) from the outset, given the product's early architectural changes are expected (per §6's graph-engine re-evaluation note) and breaking changes should never silently affect existing API consumers (including CodeLore's own frontend during rolling deploys).
- Pagination and field-selection (sparse fieldsets) supported on all list endpoints from day one — Function/File/Finding lists can be large on bigger repositories, and this is cheap to build early and expensive to retrofit later.
