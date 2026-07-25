# CodeLore — Database Schema

---

## 1. Design Principles

Two architectural decisions from the PRD drive this schema directly:

1. **Core Engine data (structural facts, git-derived signals, scores) is normalized, relational, and has zero dependency on AI tables.** These tables must be fully populated and queryable even if the AI layer is never configured.
2. **AI-generated content is always stored separately from, and with a foreign key back to, the deterministic fact(s) it explains.** This is what powers "Fact Chips" (§10, UI/UX Brief) — every AI sentence must be traceable to a row in the Core Engine tables.

We use a **polyglot persistence** approach:
- **PostgreSQL** — primary store for all structural, relational, and scoring data (source of truth).
- **Elasticsearch / OpenSearch** — search index for symbols, files, and (optionally) semantic search.
- **Redis** — caching layer and job/queue state.
- **Object storage (S3-compatible)** — raw cloned repository data, large diagram/graph payload caches, architecture snapshot artifacts.

---

## 2. ER Diagram (textual)

```
Workspace ──< Membership >── User
   │
   └──< Repository
             │
             ├──< File ──< Function
             │       │        │
             │       │        └──< BlastRadiusEdge (caller/callee)
             │       └──< Class ──< Method
             │
             ├──< GitCommit ──< CommitFileChange >── File
             │
             ├──< Dependency (Repository/Module level)
             │
             ├──< CoChangeCluster >── File (many-to-many via join table)
             │
             ├──< OwnershipRecord >── File, User(contributor identity)
             │
             ├──< ContributionScore >── File
             │
             ├──< DeadCodeFinding >── Function/File
             │
             ├──< ArchitectFinding (Architect Mode: fat controller, circular dep, etc.)
             │
             ├──< ArchitectureHealthSnapshot ──< ArchitectureHealthSubScore
             │
             ├──< RepositoryHealthSnapshot ──< RepositoryHealthMetric
             │
             ├──< ArchitectureReplaySnapshot (timeline points)
             │
             ├──< CodeStory ──< CodeStoryStep >── Function/File
             │       └──< CodeStoryStep >── AINarration (optional)
             │
             ├──< GuidedTour ──< GuidedTourItem >── CodeStory
             │
             ├──< ExecutionFlowTrace ──< ExecutionFlowStep
             │
             ├──< AIConversation ──< AIMessage ──< FactReference >── (polymorphic: BlastRadiusEdge, ArchitectFinding, CommitFileChange, etc.)
             │
             ├──< LearningProgress >── User, CodeStory/GuidedTour
             │
             ├──< SearchIndexJob
             │
             └──< AnalyticsEvent >── User
```

---

## 3. Entities

### 3.1 Identity & Workspace

**`workspace`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| ai_layer_enabled | boolean | master toggle, referenced by every AI-dependent query path |
| ai_provider_config_id | uuid FK → `ai_provider_config`, nullable | |
| created_at | timestamptz | |

**`user`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| name | text | |
| auth_provider | text | e.g. `github`, `google`, `password` |
| created_at | timestamptz | |

**`membership`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| user_id | uuid FK | |
| role | enum(`owner`,`admin`,`member`,`viewer`) | |

**`ai_provider_config`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| provider | text | `anthropic`, `openai`, `azure_openai`, `none` |
| encrypted_credentials | bytea | encrypted at rest |
| monthly_token_cap | integer, nullable | enforces cost predictability (NFR) |
| status | enum(`active`,`quota_exceeded`,`disabled`,`error`) | drives fallback UX directly |

---

### 3.2 Repository Model

**`repository`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| name | text | |
| remote_url | text | |
| default_branch | text | |
| primary_language | text | |
| loc_total | integer | |
| indexing_status | enum(`pending`,`cloning`,`parsing`,`analyzing`,`ready`,`error`) | |
| last_indexed_commit_sha | text | drives incremental re-index |
| last_indexed_at | timestamptz | |
| created_at | timestamptz | |

**Indexes**: `(workspace_id)`, unique `(workspace_id, remote_url)`.

---

### 3.3 File Model

**`file`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| path | text | relative path |
| language | text | |
| loc | integer | |
| complexity_score | numeric | cyclomatic or equivalent, computed |
| test_coverage_pct | numeric, nullable | from ingested coverage report, nullable if none provided |
| is_test_file | boolean | |
| is_deleted | boolean | soft-delete on re-index if file removed |
| updated_at | timestamptz | |

**Indexes**: `(repository_id, path)` unique, `(repository_id, complexity_score)`, `(repository_id, is_deleted)`.

---

### 3.4 Function Model

**`function`** (also covers standalone functions; methods link via `class_id`)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| file_id | uuid FK | |
| class_id | uuid FK, nullable | |
| name | text | |
| signature | text | |
| start_line | integer | |
| end_line | integer | |
| complexity_score | numeric | |
| is_entry_point | boolean | detected (HTTP route handler, CLI command, etc.) — critical for FR-13 flow generation |
| docstring | text, nullable | |

**Indexes**: `(file_id)`, `(repository_id via file join, is_entry_point)`, full-text index on `name`.

---

### 3.5 Class Model

**`class`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| file_id | uuid FK | |
| name | text | |
| parent_class_id | uuid FK, nullable | self-referencing, for inheritance chains |

---

### 3.6 Blast Radius / Call Graph

**`call_edge`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | denormalized for query performance |
| caller_function_id | uuid FK | |
| callee_function_id | uuid FK | |
| call_count | integer | number of call sites (same caller→callee pair) |

**Indexes**: `(caller_function_id)`, `(callee_function_id)` — this is the pair of indexes that makes Blast Radius (FR-2) a fast lookup in both directions.

**`test_coverage_edge`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| function_id | uuid FK | |
| test_function_id | uuid FK | |
| coverage_source | text | e.g. `lcov`, `jacoco` |

---

### 3.7 Dependency Model

**`dependency`** (module/package-level, not symbol-level)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| source_module | text | |
| target_module | text | |
| dependency_type | enum(`runtime`,`dev`,`internal`) | |
| is_circular | boolean | flagged by analysis pass |
| coupling_strength | numeric | derived from edge count between modules |

**Indexes**: `(repository_id, source_module)`, `(repository_id, is_circular)`.

---

### 3.8 Git Commit Model

**`git_commit`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| sha | text | |
| author_email | text | |
| author_name | text | |
| committed_at | timestamptz | |
| message | text | |
| additions | integer | |
| deletions | integer | |

**Indexes**: unique `(repository_id, sha)`, `(repository_id, committed_at)`.

**`commit_file_change`** (join table — this is the raw material for co-change clustering and churn)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| git_commit_id | uuid FK | |
| file_id | uuid FK | |
| change_type | enum(`added`,`modified`,`deleted`,`renamed`) | |
| lines_added | integer | |
| lines_removed | integer | |

**Indexes**: `(file_id, git_commit_id)`, `(git_commit_id)` — supports both "what changed in this commit" and "history of this file" queries.

---

### 3.9 Co-Change Clustering (derived/materialized)

**`co_change_pair`** (precomputed, refreshed on re-index — avoids expensive recomputation per query)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| file_a_id | uuid FK | |
| file_b_id | uuid FK | |
| co_change_count | integer | number of shared commits |
| confidence_score | numeric | co_change_count normalized against each file's total change count |

**Indexes**: `(file_a_id)`, `(file_b_id)`, `(repository_id, confidence_score)`.

---

### 3.10 Ownership Model

**`ownership_record`** (precomputed per file per contributor)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| file_id | uuid FK | |
| author_email | text | |
| commit_count | integer | |
| last_commit_at | timestamptz | |
| ownership_share_pct | numeric | this author's % of total commits to this file |
| is_primary_owner | boolean | highest share |
| bus_factor_risk | boolean | flagged if single-owner beyond threshold |

**Indexes**: `(file_id)`, `(repository_id via file join, bus_factor_risk)`.

---

### 3.11 Contribution Readiness

**`contribution_score`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| file_id | uuid FK | |
| complexity_component | numeric | |
| coverage_component | numeric | |
| activity_component | numeric | |
| issue_linkage_component | numeric, nullable | if issue tracker connected |
| total_score | numeric | weighted composite |
| computed_at | timestamptz | |

**Indexes**: `(repository_id via file join, total_score desc)` — powers the ranked Contribution View directly.

---

### 3.12 Dead Code & Architect Findings

**`dead_code_finding`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| function_id | uuid FK, nullable | |
| file_id | uuid FK, nullable | |
| finding_type | enum(`unreachable_function`,`unused_export`,`unused_file`) | |
| detected_at | timestamptz | |

**`architect_finding`** (Architect Mode: fat controller, circular dep, missing service layer, etc.)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| finding_type | enum(`fat_controller`,`circular_dependency`,`missing_service_layer`,`business_logic_in_route`,`duplicate_auth_logic`,`high_coupling`, ...) | extensible enum / lookup table in practice |
| severity | enum(`low`,`medium`,`high`) | |
| target_file_id | uuid FK, nullable | |
| target_module | text, nullable | |
| evidence_json | jsonb | deterministic evidence (e.g. LOC count, edge count) supporting the finding — this is what the "Suggestions" panel shows without AI |
| suggested_refactor | text, nullable | short deterministic label, e.g. "Extract Repository Pattern" — AI narration (separate table) expands on this |
| status | enum(`open`,`acknowledged`,`resolved`) | |
| detected_at | timestamptz | |

**Indexes**: `(repository_id, severity)`, `(repository_id, finding_type)`.

---

### 3.13 Architecture Health & Repository Health

**`architecture_health_snapshot`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| score | numeric | 0–100 |
| computed_at | timestamptz | |
| commit_sha | text | ties score to exact repo state |

**`architecture_health_subscore`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| snapshot_id | uuid FK | |
| dimension | enum(`coupling`,`cyclic_deps`,`layering_violations`,`controller_size_ratio`,`duplication`) | |
| value | numeric | |
| weight | numeric | |

**`repository_health_snapshot`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| grade | text | e.g. `A-` |
| computed_at | timestamptz | |
| commit_sha | text | |

**`repository_health_metric`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| snapshot_id | uuid FK | |
| metric_type | enum(`maintainability`,`complexity`,`test_coverage`,`technical_debt`,`documentation_coverage`,`dependency_health`,`dead_code`,`security_issues`,`churn`,`coupling`) | |
| value | numeric | |
| trend_direction | enum(`up`,`down`,`flat`), nullable | vs. previous snapshot |

**Indexes**: both snapshot tables indexed on `(repository_id, computed_at desc)` — powers trend sparklines directly.

---

### 3.14 Architecture Replay

**`architecture_replay_snapshot`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| snapshot_label | text | e.g. `2023-Q2`, or tag/release name |
| commit_sha | text | |
| snapshot_date | timestamptz | |
| module_graph_ref | text | pointer to object storage artifact (serialized module graph at this point) — large payloads not stored in Postgres directly |
| complexity_total | numeric | |
| module_count | integer | |

**`architecture_replay_transition`** (notable changes between two consecutive snapshots — feeds the "what changed here" side panel)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| from_snapshot_id | uuid FK | |
| to_snapshot_id | uuid FK | |
| transition_type | enum(`module_added`,`module_removed`,`module_split`,`module_merged`,`dependency_added`,`dependency_removed`) | |
| detail_json | jsonb | |

**Indexes**: `(repository_id, snapshot_date)`.

---

### 3.15 Code Stories & Guided Tours

**`code_story`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| title | text | e.g. "User Login" |
| source_type | enum(`auto_generated`,`author_written`) | |
| author_user_id | uuid FK, nullable | null if auto-generated |
| entry_point_function_id | uuid FK, nullable | |
| published | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`code_story_step`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| code_story_id | uuid FK | |
| step_order | integer | |
| function_id | uuid FK, nullable | |
| file_id | uuid FK, nullable | |
| deterministic_label | text | e.g. "Express Route", generated from structural facts — always present |
| custom_note | text, nullable | author-written commentary if `source_type = author_written` |

**`guided_tour`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| title | text | e.g. "Start Here" |
| description | text | |

**`guided_tour_item`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| guided_tour_id | uuid FK | |
| code_story_id | uuid FK | |
| item_order | integer | |

---

### 3.16 Execution Flow Traces

**`execution_flow_trace`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| entry_point_function_id | uuid FK | |
| generated_at | timestamptz | |

**`execution_flow_step`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| trace_id | uuid FK | |
| step_order | integer | |
| function_id | uuid FK | |
| swimlane_label | text | e.g. `Client`, `Route`, `Controller`, `DB` |

---

### 3.17 AI Conversation Model (Engineering Mentor)

**`ai_conversation`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| user_id | uuid FK | |
| started_at | timestamptz | |

**`ai_message`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| conversation_id | uuid FK | |
| role | enum(`user`,`assistant`) | |
| content | text | |
| tokens_used | integer, nullable | |
| provider_status | enum(`success`,`fallback_used`,`error`) | records whether this response is genuine AI output or a Core-Engine-facts fallback |
| created_at | timestamptz | |

**`fact_reference`** (polymorphic link — powers Fact Chips)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| ai_message_id | uuid FK | |
| fact_type | enum(`call_edge`,`co_change_pair`,`ownership_record`,`architect_finding`,`commit_file_change`,`contribution_score`, ...) | |
| fact_id | uuid | polymorphic reference, resolved application-side per `fact_type` |

**`ai_narration`** (AI-generated prose attached to deterministic content — Code Story narration, Architect finding explanation, Replay transition narration)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| target_type | enum(`code_story_step`,`architect_finding`,`replay_transition`) | |
| target_id | uuid | polymorphic |
| content | text | |
| provider_status | enum(`success`,`error`) | |
| generated_at | timestamptz | |

This separation is deliberate: `code_story_step.deterministic_label` always exists; `ai_narration` is an optional enrichment row that may simply not exist for a given step, and the UI degrades to showing the deterministic label alone.

---

### 3.18 Documentation Model

**`documentation_source`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| source_type | enum(`readme`,`inline_comment`,`docstring`,`external_link`) | |
| file_id | uuid FK, nullable | |
| content | text | |
| extracted_at | timestamptz | |

Feeds `documentation_coverage` metric (§3.13) and grounds Mentor/Overview content without requiring AI generation.

---

### 3.19 Learning Progress Model

**`learning_progress`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| repository_id | uuid FK | |
| code_story_id | uuid FK, nullable | |
| guided_tour_id | uuid FK, nullable | |
| status | enum(`not_started`,`in_progress`,`completed`) | |
| last_step_completed | integer, nullable | |
| updated_at | timestamptz | |

**Indexes**: `(user_id, repository_id)`.

---

### 3.20 Search Index Model

Search is served from Elasticsearch/OpenSearch, not Postgres, but Postgres tracks indexing state:

**`search_index_job`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| repository_id | uuid FK | |
| index_type | enum(`symbol`,`file`,`semantic`) | `semantic` only runs if AI layer enabled |
| status | enum(`queued`,`running`,`completed`,`failed`) | |
| started_at | timestamptz | |
| completed_at | timestamptz, nullable | |

Elasticsearch document shape (symbol index, illustrative):
```json
{
  "repository_id": "uuid",
  "type": "function",
  "id": "uuid",
  "name": "authenticateUser",
  "file_path": "src/auth/controller.ts",
  "signature": "authenticateUser(req, res)",
  "is_entry_point": true
}
```

---

### 3.21 Analytics Model

**`analytics_event`**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| user_id | uuid FK, nullable | |
| event_type | text | e.g. `code_story_viewed`, `blast_radius_queried`, `mentor_message_sent`, `ai_fallback_shown` |
| event_properties | jsonb | |
| occurred_at | timestamptz | |

`event_type = 'ai_fallback_shown'` is tracked explicitly — this directly measures the Success Metric of Core Engine usage independent of AI availability (PRD §11).

**Indexes**: `(workspace_id, event_type, occurred_at)` — append-only, high volume; candidate for partitioning by month (see §7).

---

## 4. Relationships Summary

- `repository` is the central aggregate root; nearly every table hangs off `repository_id` (directly or via `file_id`/`function_id`).
- `file` → `function`/`class` is one-to-many; `function` → `call_edge` is many-to-many (self-referencing through the join-like `call_edge` table).
- `git_commit` → `commit_file_change` → `file` is the raw signal source for **three** derived tables (`co_change_pair`, `ownership_record`, churn metrics in `repository_health_metric`) — these are computed/refreshed, not queried live from raw commits, for performance.
- `ai_message` and `ai_narration` never hold facts themselves — they hold prose plus pointers (`fact_reference`, `target_id`) into the deterministic tables. This is the schema-level enforcement of "AI explains, never decides."

---

## 5. Indexes (consolidated key strategy)

Beyond the per-table indexes above, three cross-cutting index strategies matter most for the product's core interactions:

1. **Blast Radius lookups** must be O(log n) in both directions — covered by the dual indexes on `call_edge (caller_function_id)` and `call_edge (callee_function_id)`.
2. **Timeline/trend queries** (Health snapshots, Replay) are always ordered by time within a repository — covered by composite `(repository_id, computed_at/snapshot_date desc)` indexes.
3. **Ranking queries** (Contribution Readiness, Architect findings by severity) are covered by composite indexes with the sort column included, avoiding a separate sort pass.

---

## 6. Caching Strategy

Redis is used for three distinct purposes, kept separate by key prefix:

- **Computed-result cache** (`cache:blast_radius:{function_id}`, `cache:health_dashboard:{repository_id}`): short-to-medium TTL (minutes to hours), invalidated explicitly on re-index completion rather than relying purely on TTL expiry.
- **Session/auth cache**: standard session token storage.
- **Job/queue state**: BullMQ/Sidekiq-style job metadata for the indexing pipeline (see Technical Requirements doc).

Large, rarely-changing payloads (module graph JSON for Architecture Replay snapshots, full Code Story diagrams) are **not** kept in Redis — they're generated once, written to object storage, and referenced by URL/key (`architecture_replay_snapshot.module_graph_ref`), with Redis/CDN caching the object storage response instead.

---

## 7. Versioning Strategy

- Every score/finding table (`architecture_health_snapshot`, `repository_health_snapshot`, `architect_finding`, `contribution_score`) is **append-only with a timestamp**, never updated in place. This gives trend history for free and matches the "Health Dashboard drill-down with trend" UX requirement directly.
- `architect_finding.status` (`open`/`acknowledged`/`resolved`) is the one mutable field, since findings need a lifecycle independent of re-analysis runs.
- `file`, `function`, `class` rows are updated in place on re-index (not append-only) since they represent current structural state, not history — history lives in `git_commit`/`commit_file_change` and the snapshot tables.

---

## 8. Migration Strategy

- Standard forward-only migrations (e.g., via Prisma Migrate, Flyway, or Alembic depending on backend language choice — see Technical Requirements doc).
- Enum-like columns (`finding_type`, `metric_type`, etc.) are implemented as Postgres native enums where the set is stable, but **lookup tables** are used instead wherever new types are expected to be added post-launch (e.g., `architect_finding_type` as its own table rather than a hard enum) — avoids painful enum-alteration migrations as Architect Mode's rule set grows.
- Large backfills (e.g., recomputing `co_change_pair` after a scoring algorithm change) run as background jobs writing to a new snapshot batch, never as blocking in-place migrations.

---

## 9. Scalability Considerations

- **Partitioning**: `analytics_event` and `git_commit`/`commit_file_change` (for very large, long-lived repositories) are the highest-volume tables — partition by month/quarter and by `repository_id` range respectively as data grows.
- **Read replicas**: Dashboard and Search-adjacent read traffic (Health Dashboard, Architecture Overview) is heavy-read/light-write — route to read replicas; write-heavy paths (indexing pipeline) stay on primary.
- **Repository isolation**: All queries are always scoped by `repository_id`/`workspace_id` — this is both a security boundary and a natural sharding key if/when a single Postgres instance needs to be split by workspace at scale.
- **Object storage over blob columns**: Any payload over a few KB (module graphs, diagram JSON) goes to object storage, never a `bytea`/`jsonb` blob in Postgres — keeps the primary database lean and backup/restore fast.
