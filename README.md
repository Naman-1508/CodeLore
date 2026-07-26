# 🌌 CodeLore

<div align="center">
  <img src="https://via.placeholder.com/1200x300/0f172a/38bdf8?text=CodeLore+|+Understand+Codebases+in+Minutes" alt="CodeLore Banner">
</div>

<p align="center">
  <strong>The ultimate codebase visualization, structural parsing, and AI mentoring platform.</strong><br>
  <em>Turn your codebase into something you can read, watch, and be mentored through.</em>
</p>

---

## 📑 Table of Contents

1. [Vision & Problem Statement](#-vision--problem-statement)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [System Architecture](#-system-architecture)
5. [Database Schema](#-database-schema)
6. [Project Structure (Monorepo)](#-project-structure-monorepo)
7. [Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Environment Variables](#environment-variables)
    - [Installation](#installation)
    - [Running Locally](#running-locally)
8. [API Documentation](#-api-documentation)
9. [UI/UX Philosophy](#-uiux-philosophy)
10. [Implementation Roadmap](#-implementation-roadmap)
11. [Testing & Quality Assurance](#-testing--quality-assurance)
12. [Contributing](#-contributing)
13. [License](#-license)

---

## 🔭 Vision & Problem Statement

### The Problem
Understanding an unfamiliar codebase is one of the most expensive, least-tooled activities in software engineering:
- **New hires** take weeks to months to become productive, largely spent reading code, asking teammates, and mentally reconstructing how the system behaves.
- **Documentation** is chronically outdated or absent.
- **Existing tools** (IDEs, `grep`, dependency graphs) show *structure* but not *behavior*. They tell you what calls what, but not what actually happens when a user logs in, or why the code looks the way it does.
- **AI Chat tools** act as black boxes with no deterministic backing, often hallucinating when asked about large architectural changes.

### The Solution: CodeLore
CodeLore helps a developer understand an unfamiliar codebase in minutes instead of days. It doesn't just draw a pretty dependency graph; it turns the codebase into a city you can explore with a local guide. 

CodeLore is built on two convictions:
1. **Deterministic Foundations:** Most of what makes a codebase understandable is deterministic (call graphs, git history, test coverage, coupling). We compute this once using Tree-Sitter, cache it, and never hallucinate.
2. **AI as a Narrator:** AI sits on top of computed facts and explains them in plain English. If the AI is unavailable, the deterministic facts remain.

---

## ✨ Key Features

### 1. Structural Parsing & Blast Radius 💥
See the architectural blast radius of every pull request before it gets merged. Using our underlying AST parsers, we build a highly accurate graph of functions, classes, and dependencies.
- **Call Graphs:** Understand exactly which functions call other functions.
- **Dependency Mapping:** Instantly map out tight coupling and internal dependencies.

### 2. Semantic Code Search 🔍
Stop using regex. Ask questions in plain English and find exact architectural patterns. CodeLore uses Gemini's vector embeddings combined with pgvector to perform highly accurate semantic searches across your entire codebase.
- Example: *"Where is the JWT authentication token validated?"*

### 3. Architecture Health & Signals 🏥
Continuously monitor modularity and coupling indexes to prevent technical debt.
- **Repository Health Scores:** Automated scoring based on cyclomatic complexity, coupling, and test coverage.
- **Ownership Maps:** See who truly owns which parts of the codebase based on historical git commit patterns.

### 4. Interactive Code Stories 📖
Auto-generated, interactive walkthroughs of complex user flows and database transactions. Navigate step-by-step through a specific transaction to understand the exact execution path without setting breakpoints.

### 5. Engineering Mentor (AI) 🤖
A deeply contextual AI assistant that doesn't just read the current file, but understands the entire AST graph. Ask it to explain decisions, summarize blast radii, or mentor you through a refactor.

---

## 💻 Technology Stack

CodeLore is a modern, decoupled, monorepo architecture built for scale.

**Frontend:**
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + Vanilla CSS Modules
- **Animations:** Framer Motion
- **Visualizations:** React Flow (for node-based dependency graphs)
- **Authentication:** Clerk (React SDK)
- **Routing:** React Router v6

**Backend (API Gateway):**
- **Framework:** Express.js (Node.js)
- **Language:** TypeScript
- **Security:** Helmet, CORS
- **Communication:** REST APIs

**Core Engine (Parser Service):**
- **Queue System:** BullMQ + IORedis
- **Parsers:** Tree-Sitter (JS/TS support)
- **AI Integration:** Google GenAI SDK (Gemini)

**Database Layer:**
- **Database:** PostgreSQL
- **Vector DB:** pgvector (for Semantic Search)
- **ORM:** Drizzle ORM

**Infrastructure:**
- **Monorepo Manager:** Turborepo
- **Package Manager:** npm

---

## 🏗 System Architecture

The application is built using a highly decoupled service-oriented architecture.

```mermaid
graph TD
    User((User)) --> |HTTPS| WebApp[React Web App]
    WebApp --> |REST APIs| Gateway[API Gateway Express]
    
    Gateway --> |Read/Write| DB[(PostgreSQL + pgvector)]
    Gateway --> |Push Jobs| Redis[(Upstash Redis)]
    
    Redis --> |Consume Jobs| ParserService[Parser Service Worker]
    
    ParserService --> |Clone & Parse| Git[Git Clone]
    ParserService --> |AST Parsing| TreeSitter[Tree-Sitter]
    ParserService --> |Embeddings| Gemini[Google Gemini API]
    ParserService --> |Write Facts| DB
```

### Decoupling Strategy
1. **API Gateway:** Strictly handles serving UI requests, reading from the database, and pushing heavy tasks to the queue.
2. **Parser Service:** Operates asynchronously in the background. It handles the CPU-intensive tasks of cloning repositories, parsing ASTs, and communicating with external AI APIs.

---

## 🗄 Database Schema

Our Drizzle ORM schema is highly relational and designed to store deep structural code facts.

### Core Tables:
- **`workspaces`:** Multi-tenant workspace configurations.
- **`users`:** Clerk-synced user records.
- **`repositories`:** Linked git repositories, including indexing status and metadata.
- **`files`:** Tracked files within a repository.
- **`functions` / `classes`:** AST-extracted structural elements with start/end lines and cyclomatic complexity scores.
- **`call_edges`:** Represents deterministic connections (A calls B).
- **`dependencies`:** Represents module-level runtime/dev dependencies.
- **`git_commits`:** Historical context for calculating codebase ownership.

### AI & Vector Tables:
- The `functions` table utilizes `vector(1536)` columns to store embeddings generated by Gemini, enabling cosine-distance similarity searches.

---

## 📁 Project Structure (Monorepo)

```text
codelore/
├── apps/
│   └── web/                   # React frontend application
│       ├── src/
│       │   ├── components/    # Reusable UI widgets & ReactFlow nodes
│       │   ├── pages/         # Dashboard, CodeStory, ArchitectureReplay, etc.
│       │   └── layouts/       # Main app layout with floating island navigation
├── services/
│   ├── api-gateway/           # Express server for REST endpoints
│   └── core-engine/
│       └── parser-service/    # Background worker for parsing/AST extraction
├── packages/
│   ├── database/              # Drizzle ORM schema, migrations, and connections
│   ├── shared-types/          # TS interfaces shared across apps/services
│   └── testing/               # E2E and Load testing scripts
├── docs/                      # Architectural PRDs and Design Briefs
├── turbo.json                 # Turborepo build pipeline configuration
├── package.json               # Root workspace dependencies
└── .env                       # Environment variables
```

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v20+ recommended)
- npm (v10+)
- Git
- Access to a PostgreSQL instance (e.g., Neon DB)
- Access to a Redis instance (e.g., Upstash)
- A Gemini API Key (Google AI Studio)
- A Clerk Account (for authentication)

### Environment Variables

Create a `.env` file in the root of the repository and populate it with the following keys:

```env
# Database (PostgreSQL with pgvector)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Redis Queue (Must use rediss:// for secure TLS connection)
REDIS_URL="rediss://default:password@host:port"

# AI Integration
GEMINI_API_KEY="your-google-gemini-api-key"

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/codelore.git
   cd codelore
   ```

2. **Install all workspace dependencies:**
   ```bash
   npm install
   ```

3. **Database Setup:**
   Ensure the `pgvector` extension is enabled on your Postgres database, then run the database migrations:
   ```bash
   # Push schema to database
   npm run db:push --workspace=packages/database
   ```

### Running Locally

CodeLore uses Turborepo to orchestrate starting multiple services simultaneously.

1. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This command will concurrently start:
   - The Vite frontend (`localhost:5173`)
   - The API Gateway (`localhost:4000`)
   - The Parser Service (Listens for BullMQ Jobs)

2. **Access the application:**
   Open your browser and navigate to `http://localhost:5173`.

---

## 📡 API Documentation

The `api-gateway` exposes several RESTful endpoints. All endpoints are prefixed with `/v1`.

### Workspaces
- `POST /v1/workspaces`: Create a new workspace.
- `GET /v1/workspaces`: List all workspaces for the authenticated user.

### Repositories
- `POST /v1/repositories`: Import a new repository. Kicks off a BullMQ `parse-repo` job.
- `GET /v1/repositories`: List all imported repositories in a workspace.
- `GET /v1/repositories/:id`: Get detailed repository metadata.
- `GET /v1/repositories/:id/status`: Poll for AST indexing progress.

### Code Intelligence
- `GET /v1/repositories/:id/functions`: Retrieve a list of parsed functions (AST nodes) for exploration.
- `POST /v1/repositories/:id/search`: Perform a semantic vector search across the repository.
- `GET /v1/repositories/:id/architect-findings`: Retrieve architectural drift anomalies.
- `GET /v1/repositories/:id/health`: Retrieve complexity and coupling health scores.
- `GET /v1/repositories/:id/ownership`: Retrieve the historical ownership map.

---

## 🎨 UI/UX Philosophy

CodeLore abandons the boring, grid-heavy enterprise SaaS aesthetic in favor of a sleek, immersive, and highly animated interface designed to induce "flow state."

### Key Principles:
1. **Dark Mode Native:** Deep slate and charcoal backgrounds (`#0f172a`), accented with electric cyan, neon coral, and mint greens for high-contrast syntax highlighting.
2. **Glassmorphism:** Navigation islands, sidebars, and modals use translucent blurs and subtle borders to create a sense of depth and hierarchy without relying on harsh drop shadows.
3. **Fluid Motion:** Every interaction—from logging in via the rotary layout, to expanding a function node in the React Flow graph—is smoothed out using Framer Motion spring physics.
4. **Context over Clutter:** The floating command island ensures navigation is always accessible but never takes up valuable screen real estate from the code visualizations.

---

## 🗺 Implementation Roadmap

- [x] **Phase 0 (Foundations):** Monorepo setup, Clerk Auth, Database Schema, and API Gateway scaffolding.
- [x] **Phase 1 (Core Engine):** Tree-sitter integration, git ingestion, BullMQ worker queue, and the primary ReactFlow Dashboard visualizer.
- [ ] **Phase 2 (AI Mentor & Semantic Depth):** Full Gemini chat integration, automated "Blast Radius" narrative summaries, and exact edge mapping.
- [ ] **Phase 3 (Guided Tours):** Code Stories, Replay Mode for PR reviews, and complex transaction flow mappings.

---

## 🧪 Testing & Quality Assurance

CodeLore is thoroughly tested at the integration boundary to ensure complete resilience:
- **Test Suite:** `test-suite.ts` performs a full synthetic sweep of the API Gateway, ensuring zero 500 errors and validating all JSON schemas.
- **Resilience:** The backend handles Queue disconnections (via `maxRetriesPerRequest` limits) and database constraint violations (via `onConflictDoUpdate` logic) gracefully.

To run the automated API verification:
```bash
npx tsx test-suite.ts
```

---

## 🤝 Contributing

We welcome contributions to CodeLore! Since this is a monorepo, please adhere to the following guidelines:

1. **Branching:** Use descriptive branch names (`feat/parser-improvements`, `fix/ui-layout-bug`).
2. **Commits:** Follow conventional commits format.
3. **Adding Packages:** If adding a new tool or microservice, ensure it is properly registered in `turbo.json` and follows the existing ESLint/TypeScript configs.
4. **Testing:** Never push code without manually running the `test-suite.ts` against a local database environment.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<p align="center">Built with 🧠 and 💻 for developers everywhere.</p>
