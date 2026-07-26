<div align="center">
  <br />
  <h1>🌌 CodeLore</h1>
  <p><strong>Advanced Codebase Architecture Mapping & Dependency Engine</strong></p>
  <br />
</div>

## 📖 Overview

CodeLore is an enterprise-grade repository intelligence platform. The core foundation of this application is a **Deterministic Abstract Syntax Tree (AST) Parser and Dependency Graph Engine**. It autonomously maps out complex codebases, revealing structural dependencies, blast radiuses, and modularity metrics.

While many tools rely heavily on AI to guess how a codebase works, CodeLore uses rigid, exact parsing (via Tree-sitter) to build a mathematically accurate graph of your code. **AI is utilized strictly as a secondary functionality**—specifically to narrate the parsed data (Code Stories) and generate semantic search embeddings. The foundation of the application is purely deterministic static analysis.

## ✨ Core Functionalities

### 1. Deterministic AST Parsing & Indexing
- **Tree-sitter Integration**: CodeLore uses `tree-sitter` to parse code into ASTs with exact precision, supporting TypeScript, JavaScript, Python, and Java.
- **Dependency Graph Construction**: Every function, class, and method call is extracted and linked, building a complete `CallEdges` graph in the database.
- **Blast Radius Analysis**: Before modifying a function, developers can traverse the graph to see exactly which downstream services and upstream callers will be impacted.

### 2. AI-Powered Enhancements (Secondary Features)
- **Code Stories**: Once the AST graph is built, CodeLore traces execution paths (entry point to database layer) and uses Google Gemini to generate human-readable "narratives" of the flow.
- **Semantic Search**: Code snippets are embedded using `text-embedding-004` (via Gemini) and stored in PostgreSQL using `pgvector`, allowing natural language queries against the codebase.

### 3. Architecture Health Scoring
- **Modularity Score**: Evaluates the ratio of internal module calls versus cross-module dependencies.
- **Coupling Index**: Detects "God Classes" and tightly coupled services based on the density of the call graph.

---

## 🏗 Architecture & Tech Stack

CodeLore is architected as a high-performance **Turborepo** monorepo, separating concerns into discrete, scalable microservices.

### Tech Stack Deep-Dive
- **Frontend (`apps/web`)**: 
  - React, Vite, Tailwind CSS, Framer Motion for a premium, hardware-accelerated "Midnight Aurora" UI.
- **API Gateway (`services/api-gateway`)**: 
  - Node.js/Express service that securely routes requests between the client and the core engine.
- **Core Engine (`services/core-engine/parser-service`)**: 
  - The heavy-lifting backend worker. It clones git repositories, invokes Tree-sitter parsers, runs graph traversal algorithms, and manages background jobs.
- **Database (`packages/database`)**: 
  - PostgreSQL hosted on Neon.tech.
  - Interfaced via Drizzle ORM.
  - Utilizes `pgvector` for high-dimensional semantic search.

### Database Schema Highlights
- `repositories`: Tracks indexed Git repositories.
- `files`, `functions`, `classes`: The structural hierarchy of the parsed code.
- `callEdges`: The many-to-many relationship mapping which function calls which other function.
- `architectureSnapshots`: Point-in-time metrics (Health, Modularity).

---

## 🚀 Getting Started

Follow these steps to set up a local development environment.

### 1. Prerequisites
- **Node.js** v18+
- **npm** v9+
- A [Neon.tech](https://neon.tech/) PostgreSQL Database (with `pgvector` extension enabled)
- A [Clerk](https://clerk.com/) Account (for Authentication)
- A [Google Gemini API Key](https://aistudio.google.com/)

### 2. Environment Variables
Create a `.env` file in the root of the project. **CodeLore uses a single, global `.env` file to manage secrets across all microservices.**

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI Config (Global Instance Key)
GEMINI_API_KEY="your_gemini_api_key"

# Service Routing
PARSER_SERVICE_URL="http://localhost:4001"
```

### 3. Installation

Install all dependencies using npm workspaces (Turborepo):

```bash
npm install
```

### 4. Database Initialization

Push the Drizzle schema to your live database and seed the default workspace:

```bash
# Apply the schema to the remote database
npm run migrate --workspace=packages/database

# Seed the initial mock data (Optional)
npx tsx seed.ts
```

*Important: You must execute `CREATE EXTENSION IF NOT EXISTS vector;` on your Neon database before running migrations.*

### 5. Running the Platform

Run all services concurrently:

```bash
npm run dev
```

The services will start at the following endpoints:
- **Web UI**: `http://localhost:5173`
- **API Gateway**: `http://localhost:4000`
- **Core Engine**: `http://localhost:4001`

---

## 🤝 Contributing Guidelines

1. **Architecture First**: Any new feature must respect the boundary between the Core Engine (heavy lifting/parsing) and the API Gateway (client serving).
2. **Deterministic Processing**: Do not rely on LLMs to parse or structure code. AI is strictly for natural language generation and embeddings. All logic must be deterministic.
3. **Pull Requests**: Follow the standard branching model (`feature/your-feature`), ensure tests pass, and submit a PR for review.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
