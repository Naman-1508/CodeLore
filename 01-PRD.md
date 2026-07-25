# CodeLore — Product Requirements Document (PRD)

---

## 1. Vision

CodeLore helps a developer understand an unfamiliar codebase in minutes instead of days — not by drawing a prettier dependency graph, but by turning the codebase into something you can **read, watch, and be mentored through**, the way you'd learn a city from a local instead of a road map.

The graph is infrastructure. It is never the product.

---

## 2. Mission

Give every developer — new hire, open-source contributor, or a senior engineer parachuted into a legacy system — the same confidence a person who has worked in the codebase for two years already has, on day one.

---

## 3. Problem Statement

Understanding an unfamiliar codebase is one of the most expensive, least-tooled activities in software engineering:

- New hires take **weeks to months** to become productive, largely spent reading code, asking teammates, and mentally reconstructing how the system behaves.
- Documentation is chronically outdated or absent, because keeping it current has no automated feedback loop.
- Existing tools (IDEs, `grep`, dependency graphs) show **structure** — what calls what — but not **behavior**: what actually happens when a user logs in, or why the code looks the way it does.
- Nobody can confidently answer "what breaks if I change this?" without either an expert on hand or a risky trial-and-error commit.
- Codebases have *history* — decisions, refactors, dead ends — that is locked inside commit logs nobody reads.

Developers don't need another graph. They need a **narrator, a health inspector, and a time machine** for their code.

---

## 4. Existing Solutions

| Category | Examples | What they do |
|---|---|---|
| Dependency graph / code search | Sourcegraph, GitHub Code Search, CodeSee | Visualize file/module/symbol relationships; full-text and symbol search |
| AI coding assistants | Cursor, GitHub Copilot Chat | Inline code generation and Q&A scoped to open files or small context windows |
| Static analysis / quality tools | SonarQube, CodeClimate | Score code quality, flag smells, measure complexity/coverage |
| IDE navigation | JetBrains IDEs, VS Code | Go-to-definition, find references, call hierarchy — scoped to one developer's session |

---

## 5. Their Limitations

- **Structure without behavior.** A graph of imports doesn't tell you what happens when a request comes in. You still have to trace it manually.
- **No memory of time.** None of these tools treat git history as a first-class signal — they show the codebase as a static snapshot, discarding *why* it looks the way it does.
- **AI as a black box.** Chat-based tools generate plausible-sounding answers with no deterministic backing — "what breaks if I change this" gets a guess, not a computed answer, and the guess can't be audited.
- **Single-developer scope.** IDE tools solve "help me right now," not "help my team onboard, forever."
- **No engineering judgment.** Quality tools produce scores and rule violations, but rarely explain *why a rule matters here*, or suggest a concrete refactor path.
- **Full AI dependency.** Most AI-native tools go completely dark the moment the model is unavailable, rate-limited, or the user's quota is exhausted — because AI *is* the product, not a feature of it.

---

## 6. Why CodeLore Exists

CodeLore is built on two convictions:

1. **Most of what makes a codebase "understandable" is deterministic and already sitting in the repository** — call graphs, git history, test coverage, ownership patterns, coupling, complexity. This can be computed once, cached, and never hallucinates.
2. **AI's job is to narrate and mentor, not to decide.** It sits on top of computed facts and explains them in plain English. If it's unavailable, the facts are still there.

This split is what makes CodeLore differentiated (Section 8 features are largely impossible or untrustworthy in a pure-AI-chat product) and reliable (the product doesn't degrade to nothing when a model call fails).

---

## 7. User Personas

### 7.1 Priya — New Hire (Junior/Mid-level)
Joined a 200k-LOC monorepo last week. Needs to understand "how does a request become a database write" before she can make her first meaningful PR. Currently learns by pestering senior teammates on Slack.

### 7.2 Daniel — Senior Engineer, New Team
Transferred internally. Knows how to code; doesn't know *this* codebase's conventions, danger zones, or history. Wants to avoid breaking things silently.

### 7.3 Amara — Open Source Contributor
Wants to submit a first PR to a project she doesn't work on daily. Needs to find a low-risk, well-scoped place to start, fast, without reading the whole repo.

### 7.4 Marcus — Engineering Manager / Tech Lead
Owns a legacy service. Needs to answer "who understands this module," "how risky is this area," and "where is our technical debt concentrated" for planning and hiring decisions — without doing an audit by hand.

### 7.5 Elena — Staff Engineer / Architect
Reviews architecture across teams. Wants to see how a system evolved, catch structural drift (layering violations, growing coupling) before it becomes a rewrite, and justify refactors with data, not opinion.

---

## 8. User Stories

**Onboarding & Learning**
- As Priya, I want a guided narrative of "what happens when a user logs in" so I understand behavior, not just files.
- As Priya, I want a mentor I can ask "why is this pattern used here" and get a senior-engineer-style answer grounded in the actual code.

**Risk & Change**
- As Daniel, I want to know exactly what breaks — callers, tests, historically co-changed files — before I touch a function.
- As Daniel, I want this answer even if AI is unavailable, because it's a computed fact, not an opinion.

**Contribution**
- As Amara, I want a ranked list of good first-contribution files based on low complexity, decent test coverage, and recent activity.

**Management & Planning**
- As Marcus, I want a health score for the repository and each module so I can prioritize technical debt work with evidence.
- As Marcus, I want to know who actually owns/understands each part of the code, to plan for bus-factor risk.

**Architecture**
- As Elena, I want an automated architecture review that flags fat controllers, circular dependencies, and missing layers, with concrete suggested refactors.
- As Elena, I want to watch the architecture evolve over time to understand how we got here and whether we're drifting.

---

## 9. Functional Requirements

### 9.1 Core Engine (no AI required — always available)

| ID | Requirement |
|---|---|
| FR-1 | Parse supported languages into a structural fact store: symbols, files, imports, call graph, class hierarchy. |
| FR-2 | Compute **Blast Radius** for any symbol: direct/transitive callers, test coverage of those callers, and historically co-changed files. |
| FR-3 | Compute **Co-change Clustering** from git history: files/functions that change together across commits, independent of static imports. |
| FR-4 | Compute **Ownership Map**: per-file/module contributor share by commit frequency and recency; flag single-owner (bus-factor-1) areas. |
| FR-5 | Compute **Contribution Readiness Score** per file/module: function of complexity, test coverage, recent activity, and open-issue references. |
| FR-6 | Detect **Dead Code**: unreachable code from defined entry points, unused exports. |
| FR-7 | Detect **Layering / Boundary Violations** and **Circular Dependencies** via static rule checks (configurable per project). |
| FR-8 | Compute **Architecture Health Score** (0–100) from a deterministic rubric (coupling, cyclic deps, layering violations, controller/service size ratios, duplication). |
| FR-9 | Compute **Repository Health Dashboard** metrics: maintainability, complexity, test coverage, doc coverage, dependency health, dead code %, churn, coupling — each independently drillable. |
| FR-10 | Generate **Architecture Replay**: a reconstructable timeline of structural snapshots (folders, modules, dependency counts, complexity) at each significant git milestone. |
| FR-11 | Support symbol/regex/full-text search across the indexed repository. |
| FR-12 | Support manual authoring of **Code Stories** (step-sequenced walkthroughs) by any user with write access. |
| FR-13 | Auto-generate a baseline **Code Story** for common flow patterns (e.g., HTTP entry point → handler → data layer) purely from call-graph traversal, with no AI required. |

### 9.2 AI Enrichment Layer (optional, pluggable, degrades gracefully)

| ID | Requirement |
|---|---|
| FR-14 | **Engineering Mentor**: conversational interface, grounded in FR-1–FR-13 outputs, answering natural-language questions ("teach me authentication," "why is this pattern used"). Every answer must cite the structural facts it's based on. |
| FR-15 | AI-narrated **Code Stories**: turn a computed flow (FR-13) into natural-language narrative alongside the diagram. |
| FR-16 | AI explanations for **Architect Mode** suggestions: explain *why* a deterministic finding (FR-7, FR-8) matters and propose a specific refactor path. |
| FR-17 | Natural-language / semantic search layer on top of FR-11 (e.g., "where does password hashing happen"). |
| FR-18 | Every AI-layer feature MUST define and implement a **fallback state**: if the LLM provider is unavailable, rate-limited, or unconfigured, the UI shows the underlying computed facts directly (never a blank state or hard error). |
| FR-19 | AI provider must be swappable (interface-based) and independently configurable/disable-able per workspace without affecting FR-1–FR-13. |

---

## 10. Non-Functional Requirements

- **Reliability of core features**: FR-1 through FR-13 must have zero runtime dependency on any external AI provider.
- **Determinism & auditability**: Every Core Engine output must be reproducible from the same repo state and traceable to the specific commits/files/tests that produced it.
- **Performance**: Initial parse + index of a 500k-LOC repository completes in under 15 minutes on standard infrastructure; subsequent incremental updates (on new commits) complete in under 60 seconds for typical diffs.
- **Scalability**: Support concurrent indexing/analysis of repositories up to several million lines of code; horizontal scaling of parser/analysis workers.
- **Multi-language support**: Initial support for JavaScript/TypeScript, Python, and Java/Kotlin call-graph and structural analysis; architecture designed for adding languages via a parser plugin interface.
- **Security**: Repository source code and derived data are tenant-isolated; no code content is sent to any AI provider without explicit user/workspace consent and configuration.
- **Cost predictability**: AI-layer usage must be meterable and cappable per workspace, independent of Core Engine usage.
- **Accessibility**: WCAG 2.1 AA compliance across all primary views.

---

## 11. Success Metrics

| Metric | Target signal |
|---|---|
| Time-to-first-meaningful-PR for new hires (self-reported / measured via onboarding cohorts) | Reduction vs. baseline |
| % of users who complete a guided Code Story or Architecture Replay in first session | Activation indicator |
| Weekly active use of Blast Radius / Contribution Readiness by existing team members (not just onboarding) | Retention beyond onboarding use case |
| Core Engine feature usage as % of total feature usage | Validates "AI is a layer, not the product" — should remain substantial (target: majority of sessions use at least one Core feature without touching AI Mentor) |
| Architecture Health Score trend over time per repository | Evidence the tool drives real remediation, not just observation |

---

## 12. Future Scope

- Cross-repository / multi-service architecture mapping (for microservice fleets).
- IDE plugin surfacing Blast Radius and Ownership inline during code review.
- Automated PR risk annotation using Blast Radius + Ownership at review time.
- Team-authored Code Story libraries as living onboarding documentation, versioned with the repo.
- Slack/Teams bot exposing Engineering Mentor queries in context.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Parsing accuracy across diverse codebases/languages is inherently imperfect | Start with a small set of well-supported languages; make confidence levels visible; allow manual correction/annotation |
| Git-history-based signals (co-change, ownership) are noisy on repos with squash-merges or poor commit hygiene | Provide confidence scoring and allow disabling in workspace settings |
| AI Mentor answers being trusted as ground truth despite being an explanation layer | Always show and link the underlying computed facts alongside AI narrative; never let AI output stand alone |
| Large repos causing prohibitive indexing time/cost | Incremental indexing, background workers, tiered analysis (fast structural pass first, deep analysis async) |
| AI provider cost unpredictability | Hard per-workspace usage caps, clear fallback UX (FR-18) |

---

## 14. MVP Scope

**Included (Core Engine, no AI dependency):**
- Repository import + parsing for 1–2 languages
- Blast Radius (FR-2)
- Co-change Clustering (FR-3)
- Ownership Map (FR-4)
- Contribution Readiness Score (FR-5)
- Dead Code detection (FR-6)
- Architecture Health Score with deterministic findings (FR-8, without AI narration)
- Repository Health Dashboard, core metrics (FR-9)
- Basic search (FR-11)
- Auto-generated baseline Code Story for one common flow pattern (FR-13)

**Included (AI Layer, minimal):**
- Engineering Mentor, basic Q&A grounded in Core Engine facts (FR-14), with explicit fallback UX (FR-18)

**Explicitly excluded from MVP:** Architecture Replay (FR-10), manually authored Code Stories (FR-12), full semantic search (FR-17), multi-language beyond initial set.

---

## 15. Stretch Goals

- Architecture Replay with visual timeline scrubbing (FR-10)
- AI-narrated Code Stories (FR-15) and AI-explained Architect Mode suggestions (FR-16)
- Manual Code Story authoring UI (FR-12)
- Semantic/natural-language search (FR-17)
- Additional language support beyond MVP set
- Cross-repo architecture mapping
