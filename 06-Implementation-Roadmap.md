# CodeLore — Implementation Roadmap

---

## Roadmap Principles

- **Core Engine before AI, always.** No phase introduces an AI-dependent feature before the deterministic feature it enriches already works end-to-end. This isn't just philosophy — it's the build order, because every AI feature's fallback path can only be tested honestly if the underlying facts already exist and are reliable.
- **Every phase ships something demoable and independently valuable.** No "invisible infrastructure-only" phases that produce nothing a user could look at.
- **Complexity ratings** are relative (Low / Medium / High / Very High) and reflect engineering effort + risk, not calendar time (team size varies).

---

## Phase 0 — Foundations

### Objectives
Stand up the platform skeleton: auth, workspace, repository import shell, and the deployable service boundary between Core Engine and AI layer (even before AI exists), so the architectural separation is structural from commit one, not retrofitted.

### Features
- User signup/login (GitHub OAuth + email/password)
- Workspace creation, membership, roles
- Repository import (URL/OAuth repo picker), shallow clone only (no parsing yet)
- Empty-state Repository Dashboard
- Basic Settings shell (workspace, repository, user sections — mostly stubs)

### Milestones
- M0.1: Auth + workspace CRUD live
- M0.2: Repository import creates a `repository` row and successfully clones (no analysis)
- M0.3: Service skeleton deployed — API Gateway, Core Engine service shell, AI layer service shell (empty, feature-flagged off) — running independently in CI/CD

### Dependencies
None (first phase).

### Estimated Complexity
Medium — mostly well-understood platform engineering, but the service-boundary decisions made here are foundational and worth getting right early.

### Risks
- Under-investing in the Core/AI service separation now makes it expensive to retrofit later (this is the single most important thing to get right in this phase, even though it produces no user-visible AI feature yet).

### Suggested Folder Structure
```
/codelore
  /apps
    /web                 (React frontend)
  /services
    /api-gateway
    /core-engine
      /parser-service
      /analysis-service
      /git-ingestion-service
      /search-indexing-service
    /ai-layer
      /llm-provider-adapter
      /mentor-orchestrator
      /narration-service
    /platform
      /auth-service
      /workspace-service
      /billing-service
  /packages
    /shared-types
    /ui-components
  /infra
    /terraform (or equivalent IaC)
    /k8s
```

### Suggested Git Branch Strategy
Trunk-based development: `main` always deployable; short-lived feature branches (`feat/...`, `fix/...`) merged via PR with required CI checks; release tags cut from `main` for deployment tracking (no long-lived `develop` branch — adds merge overhead without benefit at this stage).

### Suggested APIs
- `POST /v1/auth/oauth/github/callback`
- `POST /v1/workspaces`
- `POST /v1/repositories` (import)
- `GET /v1/repositories/:id` (status polling fallback if WebSocket unavailable)

### Testing Strategy
- **Unit**: auth token handling, role permission checks.
- **Integration**: full signup → workspace → import flow against ephemeral test DB.
- **Security**: OAuth flow tested against token leakage, session fixation.

### Deployment Milestones
- Staging environment live with all service shells deployed independently.

### Expected Deliverables
Working signup, login, workspace, and repository import (clone-only, no parsing) — deployed to staging.

---

## Phase 1 — Core Engine: Structural Parsing & Blast Radius

### Objectives
Get from "cloned repository" to a fully queryable structural fact store, and ship the first genuinely useful, AI-free feature: Blast Radius.

### Features
- Parser Service (Tree-sitter) for JavaScript/TypeScript (single language first, to validate the pipeline before expanding)
- Structural fact store population: `file`, `function`, `class`, `call_edge`
- Function Explorer UI (source view)
- Blast Radius panel (callers/callees) — no test coverage or co-change yet, just call-graph based
- Indexing pipeline status UI (staged progress, per Application Flow §3)

### Milestones
- M1.1: Parser Service correctly parses a real-world TS/JS repo end-to-end into structural tables
- M1.2: Blast Radius query returns correct callers/callees for a known test repository (validated manually against ground truth)
- M1.3: Function Explorer + Blast Radius panel shippable to internal dogfooding

### Dependencies
Phase 0 (repository import, service skeleton).

### Estimated Complexity
High — parser correctness and call-graph construction (including handling dynamic dispatch, re-exports, etc. within reasonable limits) is the hardest deterministic engineering in the whole product.

### Risks
- Parser accuracy on real-world (imperfect, large) codebases is the single biggest technical risk in the product — budget extra time here, and explicitly scope "good enough" accuracy (e.g., static/direct calls resolved reliably; highly dynamic patterns flagged as lower-confidence rather than silently wrong).

### Suggested Folder Structure (additions)
```
/services/core-engine/parser-service
  /adapters
    /typescript
  /ir                     (intermediate representation types)
  /workers
```

### Suggested Git Branch Strategy
Same as Phase 0; introduce a lightweight RFC/design-doc requirement for parser IR changes given how foundational they are.

### Suggested APIs
- `GET /v1/repositories/:id/functions/:functionId`
- `GET /v1/repositories/:id/functions/:functionId/blast-radius`
- `GET /v1/repositories/:id/files/:fileId`

### Testing Strategy
- **Unit**: parser adapter against a curated fixture set of tricky syntax patterns.
- **Integration**: full pipeline against 3–5 real open-source repositories of varying size/style, with manually verified expected call-graph samples.
- **Performance**: parse-time benchmarks against the Technical Requirements §16 targets, on a representative large repo.

### Deployment Milestones
- Feature-flagged rollout to internal team on real work repositories.

### Expected Deliverables
Blast Radius working end-to-end for TypeScript/JavaScript repositories — the first feature that could be shown to a design partner.

---

## Phase 2 — Git-Derived Signals & Architect Findings

### Objectives
Bring in git history as a data source and ship the deterministic versions of Architect Mode, Co-Change, Ownership, and Contribution Readiness — completing the "AI-free" feature set that differentiates CodeLore from graph tools.

### Features
- Git Ingestion Service (`git_commit`, `commit_file_change`)
- Co-Change Clustering (precomputed)
- Ownership Map + bus-factor flagging
- Contribution Readiness scoring + Contribution View UI
- Dead code detection
- Architect Mode: circular dependency, fat controller, high coupling findings (deterministic evidence + suggested refactor label, no AI narration yet)
- Architecture Health Score (deterministic)

### Milestones
- M2.1: Git Ingestion populates full commit history for a re-indexed repository
- M2.2: Co-Change and Ownership tables populated and queryable
- M2.3: Architect Mode screen live with real findings on internal repositories
- M2.4: Contribution View ranked list live

### Dependencies
Phase 1 (structural fact store must exist for findings to reference specific files/functions).

### Estimated Complexity
High — the analysis logic (coupling calculations, fat-controller heuristics, circular dependency detection at module granularity) requires careful tuning against real codebases to avoid noisy/low-value findings.

### Risks
- Deterministic "suggestions" that feel wrong or noisy on real repos will damage trust in the product early — plan for a tuning/feedback loop (e.g., an internal "mark finding as not useful" mechanism) even before AI narration exists, to calibrate thresholds.

### Suggested APIs
- `GET /v1/repositories/:id/architect-findings`
- `PATCH /v1/repositories/:id/architect-findings/:findingId` (status update)
- `GET /v1/repositories/:id/contribution-scores`
- `GET /v1/repositories/:id/ownership?fileId=...`
- `GET /v1/repositories/:id/health/architecture`

### Testing Strategy
- **Unit**: scoring formulas (contribution readiness weighting, coupling calculation) with known-input/known-output test cases.
- **Integration**: full analysis pipeline on the same benchmark repos from Phase 1, with manual review of finding quality.
- **Performance**: analysis pass timing against §16 targets as history size grows.

### Deployment Milestones
- Internal dogfooding expanded to include Architect Mode and Contribution View feedback collection.

### Expected Deliverables
The full deterministic MVP feature set (per PRD §14) is now complete and usable without any AI dependency — this is the point at which the "70–80% works without AI" claim becomes concretely demonstrable, not just architectural intent.

---

## Phase 3 — Repository & Health Dashboards, Code Stories (Baseline)

### Objectives
Turn the analysis output into the primary user-facing surfaces: Repository Overview, Health Dashboard, and the first version of Code Stories (deterministic baseline, per FR-13).

### Features
- Repository Overview screen (module map, entry-point summary)
- Repository Health Dashboard (all metrics, trend sparklines, drill-down)
- Auto-generated baseline Code Stories (from detected entry points, deterministic labels only)
- Code Story two-panel viewer UI + step navigation
- Search (symbol/file only — Elasticsearch integration)

### Milestones
- M3.1: Repository Overview live with module map
- M3.2: Health Dashboard live with real trend data (requires at least 2 snapshots — seed with synthetic/backfilled snapshot on first index if needed for demo purposes)
- M3.3: First auto-generated Code Story viewable end-to-end for a common flow pattern
- M3.4: Global search (`⌘K`) functional

### Dependencies
Phase 2 (health scores, findings) and Phase 1 (call graph, for Code Story generation).

### Estimated Complexity
Medium — mostly UI/data-presentation work at this point, with one meaningful algorithmic piece (auto-generating a sensible Code Story sequence from an entry point via call-graph traversal, with reasonable stopping heuristics).

### Risks
- Auto-generated Code Stories can be too long/noisy if traversal isn't bounded sensibly — plan explicit heuristics (max depth, skip trivial pass-through calls) and validate against real examples early.

### Suggested APIs
- `GET /v1/repositories/:id/overview`
- `GET /v1/repositories/:id/health`
- `GET /v1/repositories/:id/code-stories`
- `GET /v1/repositories/:id/code-stories/:storyId`
- `GET /v1/search?q=...&type=symbol|file`

### Testing Strategy
- **Unit**: Code Story generation heuristics.
- **Integration**: full user journey test (import → overview → health → first code story) as an end-to-end test suite.
- **Performance**: search latency against §16 targets.

### Deployment Milestones
- **First external design-partner beta** — this phase's completion is a reasonable point to bring in a small number of trusted external users, since the product is now demonstrably useful without AI.

### Expected Deliverables
A complete, coherent, demoable product — the "Google Maps for Software" experience is now real, entirely AI-free.

---

## Phase 4 — AI Enrichment Layer: Engineering Mentor

### Objectives
Introduce the AI layer for the first time, built entirely on top of the now-stable Core Engine, starting with the highest-value AI feature: Engineering Mentor.

### Features
- LLM Provider Adapter (single provider first — e.g., Anthropic — with the interface designed for multi-provider from day one per Technical Requirements §8)
- Mentor Orchestrator (context-grounding logic, fact_reference generation)
- Engineering Mentor UI (chat-style, Fact Chips, streaming responses)
- Fallback UX for all Mentor entry points (unavailable/error/quota states)
- AI Layer settings (provider config, quota, on/off toggle)
- Usage/token tracking and quota enforcement

### Milestones
- M4.1: LLM Provider Adapter live with fallback contract tested (simulate provider failure, verify graceful degradation)
- M4.2: Mentor answers grounded questions correctly, with accurate Fact Chips, on benchmark repos
- M4.3: Quota enforcement and admin settings live
- M4.4: Fallback UX verified across every Mentor entry point (Function Explorer, Search, standalone Mentor view)

### Dependencies
Phases 1–3 (Mentor is grounded entirely in their output).

### Estimated Complexity
High — not because calling an LLM is hard, but because building genuinely reliable grounding (avoiding hallucinated fact references) and a fallback path that's tested as rigorously as the happy path takes real discipline.

### Risks
- Teams often under-test fallback paths since they're "just the sad path" — treat fallback UX testing with the same rigor as the primary feature (explicit test cases simulating provider downtime, timeout, and quota exhaustion, per §10 of Technical Requirements).
- Cost overruns if quota enforcement has gaps — load-test the enforcement path, not just the happy path.

### Suggested APIs
- `POST /v1/repositories/:id/mentor/conversations`
- `POST /v1/repositories/:id/mentor/conversations/:id/messages` (streaming response)
- `GET /v1/workspaces/:id/ai-config`
- `PATCH /v1/workspaces/:id/ai-config`

### Testing Strategy
- **Unit**: context-building logic (correct facts selected for a given query type).
- **Integration**: full Mentor conversation flow, including forced-failure scenarios for fallback verification.
- **Security**: verify no code content leaves the system when AI layer is disabled (explicit negative test).
- **Performance**: first-token latency against §16 target.

### Deployment Milestones
- AI layer enabled for design-partner beta workspaces, opt-in.

### Expected Deliverables
Engineering Mentor live, with a verified, tested fallback experience — the architectural promise made in the PRD is now empirically true, not just designed-for.

---

## Phase 5 — AI Narration & Architecture Replay

### Objectives
Extend the AI layer to narrate existing deterministic content (Code Stories, Architect findings), and ship Architecture Replay — the most visually ambitious stretch feature.

### Features
- AI-narrated Code Stories (`ai_narration`, `target_type = code_story_step`)
- AI-explained Architect findings (`ai_narration`, `target_type = architect_finding`)
- Architecture Replay: snapshot generation at indexing time, timeline scrubber UI, transition detection, optional AI narration of significant transitions
- Manual Code Story authoring UI (author mode)
- Guided Tours (multi-story sequences)
- Execution Flow Viewer + "promote to Code Story" flow

### Milestones
- M5.1: AI narration live for Code Stories, with fallback verified (deterministic label always shown regardless)
- M5.2: Architecture Replay snapshot generation producing correct historical module maps on benchmark repos
- M5.3: Timeline scrubber UI functional with smooth interpolation between snapshots
- M5.4: Code Story authoring + Guided Tours live

### Dependencies
Phase 4 (AI narration infrastructure), Phase 2 (git history, for replay snapshots).

### Estimated Complexity
Very High — Architecture Replay in particular (reconstructing historical structural state accurately, and animating it meaningfully) is the single most technically ambitious feature in the roadmap.

### Risks
- Architecture Replay accuracy depends on git history quality (squash merges, force-pushes) — explicitly handle and communicate discontinuities (per Application Flow §8 edge case) rather than presenting misleading data.
- Scope risk: this phase bundles several substantial features — consider splitting Architecture Replay into its own sub-phase if timeline pressure emerges, since it's the most independent/separable piece.

### Suggested APIs
- `GET /v1/repositories/:id/architecture-replay/snapshots`
- `GET /v1/repositories/:id/architecture-replay/transitions?from=...&to=...`
- `POST /v1/repositories/:id/code-stories` (authoring)
- `POST /v1/repositories/:id/guided-tours`
- `POST /v1/repositories/:id/execution-flows/:traceId/promote`

### Testing Strategy
- **Unit**: snapshot diffing/transition-detection logic.
- **Integration**: full replay generation on benchmark repos with known historical milestones (e.g., a repo where a module split is a matter of public record) to validate correctness.
- **Performance**: snapshot generation time as part of the indexing pipeline, ensuring it doesn't blow the §16 indexing time budget.

### Deployment Milestones
- Beta expanded to a larger design-partner group with Replay and authoring enabled.

### Expected Deliverables
The full feature set from the PRD's stretch goals is now live.

---

## Phase 6 — Scale, Multi-Language, Semantic Search & Hardening

### Objectives
Broaden language support, add semantic search, and take the product from "works well for design partners" to "production-ready for general availability."

### Features
- Additional language parser adapters (Python, Java/Kotlin)
- Semantic search (embeddings-backed, AI-layer-dependent, graceful absence when AI disabled)
- Multi-provider LLM support (validate the adapter interface with a second real provider)
- Read replica rollout, partitioning for high-volume tables (`analytics_event`, `commit_file_change`) per Database Schema §9
- Full accessibility audit (WCAG 2.1 AA) across all views
- Load testing at target scale (large monorepos, high concurrent workspace count)
- Security review / penetration testing
- Billing/usage reporting polish

### Milestones
- M6.1: Python and Java/Kotlin parsing at parity with TypeScript/JavaScript feature support
- M6.2: Semantic search live and evaluated for relevance quality
- M6.3: Second LLM provider integrated, confirming the adapter abstraction holds
- M6.4: Load test targets met at production scale
- M6.5: Security review completed, findings remediated
- M6.6: Accessibility audit passed

### Dependencies
All prior phases (this is a hardening/breadth phase, not a new architectural layer).

### Estimated Complexity
High — mostly breadth-of-effort (parser adapters, scale testing) rather than novel architectural risk, since the architecture was designed for this extension from Phase 0.

### Risks
- Multi-language parity is easy to under-scope — each new language adapter tends to surface language-specific quirks (e.g., Python's dynamic typing complicating call-graph resolution) that weren't visible with TypeScript alone; budget accordingly.

### Testing Strategy
- **Unit**: new parser adapters against curated fixtures (mirroring Phase 1's approach).
- **Integration**: full pipeline re-validated across all supported languages.
- **Performance**: full-scale load testing against concurrent workspace/repository targets.
- **Security**: formal penetration test, dependency audit, secrets-handling review.
- **Accessibility**: automated (axe-core or equivalent) + manual screen-reader testing across primary flows.

### Deployment Milestones
- General availability launch readiness review.
- Production deployment with multi-AZ, monitoring, and alerting fully live per Technical Requirements §20–23.

### Expected Deliverables
**Production-ready CodeLore v1.0**: multi-language support, full deterministic Core Engine feature set, complete AI Enrichment Layer with verified graceful degradation, hardened for security/accessibility/scale, ready for general availability.

---

## Roadmap Summary

| Phase | Focus | AI Dependency |
|---|---|---|
| 0 | Platform foundations | None |
| 1 | Structural parsing, Blast Radius | None |
| 2 | Git signals, Architect Mode, Contribution Readiness | None |
| 3 | Overview, Health Dashboard, baseline Code Stories | None |
| 4 | Engineering Mentor | First AI feature — isolated layer |
| 5 | AI narration, Architecture Replay, authoring | AI enrichment on top of stable Core Engine |
| 6 | Multi-language, semantic search, scale, hardening | AI breadth (multi-provider) + Core Engine breadth |

The product is genuinely useful — and demoable to real users — from the end of **Phase 3**, before a single line of AI integration code is written. That sequencing is itself the strongest possible validation of the "AI as plugin, not foundation" requirement: it's not just a claim in the architecture document, it's the literal order in which the product gets built.
