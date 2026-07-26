# CodeLore — UI / UX Design Brief

---

## 1. Overall Design Philosophy

CodeLore should feel like **a well-written explanation, not a control panel**. Most developer tools default to dense, IDE-style chrome (panels, tabs, trees) because that's what "technical" is assumed to look like. CodeLore deliberately avoids that default wherever the content is narrative (Code Stories, Engineering Mentor, Architecture Replay) and only leans into dense, information-rich UI where the content is genuinely data-heavy (Health Dashboard, Dependency Explorer).

Three principles govern every screen:

1. **Narrative first, data on demand.** Every deterministic fact (a coupling score, a churn number) should be one click away from its plain-English meaning — but never forced into prose if the user just wants the number.
2. **Never a dead end.** If AI is unavailable, disabled, or over quota, the screen still shows the underlying computed facts. No blank states caused by a missing API key.
3. **Confidence over cleverness.** Motion and visuals should build the user's mental model of the codebase, not decorate the page. If an animation doesn't teach something, cut it.

**Tone**: calm, precise, quietly confident — closer to a well-designed reference product (e.g. a good technical documentation site or a flight-tracking app) than a flashy AI-demo product. No gratuitous gradients, no "magic sparkle" AI iconography.

---

## 2. Primary User Journey

```
Landing Page
     ↓
Sign Up / Log In
     ↓
Import Repository
     ↓
Parsing & Indexing (progress state)
     ↓
Repository Dashboard  ──────────────┐
     ↓                              │
Repository Overview                 │
     ↓                              │
   ┌─────────────┬──────────────┬───┴────────────┬───────────────┬───────────────┐
   ↓             ↓              ↓                ↓               ↓               ↓
Code Stories  Architect     Architecture     Dependency      Engineering     Health
              Mode          Replay           Explorer        Mentor          Dashboard
```

New users are funneled toward **Code Stories** or **Repository Overview** first — these are the fastest path to an "aha" moment. Power users (Marcus, Elena personas) will more often land directly on Health Dashboard or Architect Mode via saved views.

---

## 3. Navigation Structure

Persistent **left rail** (collapsible), not a top nav — codebases are deep, not wide, and a left rail scales better as more repos/views are added:

```
[Repo Switcher]
──────────────
Overview
Code Stories
Architect Mode
Architecture Replay
Dependency Explorer
Function Explorer
Search               (⌘K also opens this anywhere)
──────────────
Engineering Mentor
──────────────
Health Dashboard
Contribution Finder
──────────────
Settings
```

The rail visually separates **explore/learn** (top group), **ask** (mentor, middle), and **assess/plan** (bottom group) — reflecting the three modes a user is in.

---

## 4. Landing Page

- Single, clear value statement above the fold: not "AI-powered code intelligence" (generic), but something closer to *"Understand any codebase in an afternoon, not a sprint."*
- Below the fold: three short proof panels, each showing a real (or illustrative) screenshot — a Code Story flow, an Architect Mode score card, and a Blast Radius result — not generic feature-icon-plus-text blocks.
- No AI branding dominates the page. AI is mentioned once, briefly, as an enhancement — the headline sells understanding, not chat.
- Primary CTA: "Import a repository" (supports public GitHub URL for a frictionless first try before requiring signup).

---

## 5. Repository Dashboard

The user's home base across all imported repositories.

- Grid or list of repo cards, each showing: repo name, last indexed time, **Architecture Health score** (badge), **Repository Health grade** (badge), primary language, indexing status.
- Cards are the fastest "state of my repos" glance — a manager persona (Marcus) should be able to scan this and immediately spot the repo in worst shape.
- Empty state (no repos yet): large, single "Import your first repository" action, no clutter.
- Sort/filter by health score, last activity, language.

---

## 6. Repository Overview

The front door to a single repository — answers "what am I looking at" in one screen.

- Top: repo name, description (pulled from README if present), primary language(s), size (files/LOC), last commit.
- A **module map** — a simplified, high-level structural diagram (top-level folders/services and their relationships), intentionally *not* the full dependency graph. This is the "city skyline," not the "every street" view.
- Three surfaced entry points: "Start a Code Story," "Run Architect Mode," "Ask the Engineering Mentor" — presented as three equally-weighted cards, not AI-first.
- Sidebar snippets: Architecture Health score, top 3 risk areas, suggested first Code Story.

---

## 7. Architecture View

- Renders the module map at adjustable zoom levels: system → module → file. Uses progressive disclosure — never render the full symbol-level graph by default; that's the classic "hairball" failure mode of every competing tool.
- Nodes sized/colored by a selectable metric (complexity, churn, coupling, test coverage) — one metric at a time, with a clear legend, never multiple metrics overlaid simultaneously (avoids visual noise).
- Clicking a node opens a side panel with that module's facts (owners, health sub-scores, recent commits) without leaving the diagram.

---

## 8. Learning Mode (Code Stories)

The flagship "wow" screen. Two synchronized panels:

**Left: the flow diagram** — vertical step sequence (per your example: React Login Form → POST /login → Express Route → Auth Controller → …), rendered as connected cards, not a generic graph layout. Each step is clickable.

**Right: the narrative pane** — plain-English explanation of the currently selected step. If AI is enabled, this is AI-narrated prose; if not, it's the deterministic description (function name, file, signature, and one-line docstring/comment if present) — same layout, different depth of text, so the fallback doesn't look broken.

- A **scrub bar / step controls** at the bottom (prev/next, autoplay) — makes this feel like a guided walkthrough, not a static diagram.
- Users can jump from any step directly into the actual source file (Function Explorer).
- **Author mode**: any user with write access can create/edit a Code Story manually — reorder steps, add commentary, publish as a saved tour for teammates. Clearly distinguished (a small "Community" or "Team-authored" badge) from auto-generated stories.
- Repository-level **Guided Tour**: a curated sequence of multiple Code Stories, positioned as the recommended onboarding path (distinct list, e.g. "Start Here" section at the top of the Code Stories index).

---

## 9. Function Explorer

- Source code view (syntax highlighted) for a single function/file.
- Side panel: **Blast Radius** summary for the selected symbol — callers, tests covering it, historically co-changed files — always visible, always computed, never AI-gated.
- "Explain this function" button opens the Mentor in context (optional AI layer), but the Blast Radius facts remain visible regardless.

---

## 10. Dependency Explorer

- Traditional graph view lives here — intentionally the *least* prominent surface in the product, reached from Architecture View drill-down or direct navigation, never the landing experience.
- Filters: by module, by dependency type (runtime/dev/circular only), by coupling strength.
- Circular dependency and boundary-violation findings are highlighted directly on the graph (colored edges), linking to their Architect Mode entries.

---

## 11. Execution Flow Viewer

- Distinct from Code Stories: this is the raw, auto-traced call sequence for a specific entry point (e.g., an API route), shown as a sequence diagram (swimlanes: Client → Route → Controller → Service → DB).
- Code Stories can be "promoted" from an Execution Flow Viewer trace — i.e., a user finds a flow here, then clicks "Turn into a Code Story" to add narrative and publish it.

---

## 12. AI Chat → **Engineering Mentor**

- Deliberately not styled as a generic chat bubble UI. Framed as a conversation with a colleague: mentor's responses are structured (a short direct answer, then "based on:" with linked facts — files, blast radius data, commit references), not a wall of prose.
- Every Mentor answer that references a structural fact links directly to that fact's source view (e.g., mentions blast radius → link to Function Explorer with that symbol pre-loaded). This is the core trust mechanic: AI never asserts something the user can't verify with one click.
- If AI is disabled/unavailable: the Mentor entry point shows a clear, calm state — "Engineering Mentor is unavailable right now. Here's what you can still do:" with direct links to Blast Radius, Architect Mode, and Search. Never a red error banner.

---

## 13. Search Experience

- Global, via `⌘K` / `Ctrl+K` from anywhere.
- Three result tabs: **Symbols** (exact/regex), **Files**, **Ask Mentor** (semantic — only shown if AI layer enabled). Symbols/Files always available regardless of AI status.
- Recent searches and "suggested starting points" (from Contribution Readiness scoring) shown on empty query.

---

## 14. Timeline View (Architecture Replay)

- Horizontal scrubber across the repo's history (by year/quarter/major version, auto-detected from commit density and tags/releases).
- Scrubbing animates the module map: nodes/folders fade in as they're created, edges appear/disappear as dependencies change, node size shifts with complexity change.
- A synchronized side panel lists what changed at the current scrub position (modules added/removed/split, major dependency changes) — pulled from commit metadata, not AI-generated, though AI can optionally narrate significant transition points ("this is when the payment module was extracted").
- Play/pause/speed controls, similar interaction language to Code Stories' scrub bar for consistency.

---

## 15. Contribution View

- Ranked list (not a graph) of suggested files/modules to start contributing in, each showing its Contribution Readiness sub-scores (complexity, coverage, recent activity, linked open issues) as small inline bars — transparent ranking, not a black-box score.
- Filter by area of interest (module/folder) and by "good first issue" linkage if issue tracker is connected.

---

## 16. Settings

- **AI Layer** section is a distinct, clearly labeled settings panel (not buried): provider selection, API key/connection status, usage/quota meter, and a master on/off toggle — reinforcing that this is an add-on layer, architecturally and visually.
- Repository settings: language parser config, ignored paths, layering rules (for Architect Mode boundary checks), re-index trigger.
- Team/workspace settings: members, roles, shared Code Story library.

---

## 17. Dark Mode

- Default to system preference. Full parity — no feature or diagram should be light-mode-only.
- Health/status colors (green/amber/red for scores) must maintain sufficient contrast and distinguishability in both modes; pair color with icon/shape, not color alone (accessibility, see §21).

---

## 18. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open global search |
| `G` then `O` | Go to Overview |
| `G` then `C` | Go to Code Stories |
| `G` then `A` | Go to Architect Mode |
| `G` then `M` | Go to Engineering Mentor |
| `→` / `←` | Next/previous step (in Code Story or Timeline scrub) |
| `Esc` | Close panel / modal |

A discoverable shortcut cheat-sheet is available via `?`.

---

## 19. Animations

Animation is used only where it builds understanding of *change over time* or *sequence* — the two things static screenshots can't convey:

- Code Story step transitions (card highlight + connecting line draw as you advance)
- Architecture Replay scrubbing (node/edge fade and resize)
- Health score changes over time (animated number/gauge transition when viewing trend)

Explicitly avoided: decorative loading animations beyond simple, honest progress indicators; hover "flourish" effects; parallax.

---

## 20. Micro Interactions

- Hovering any score/badge shows its computed sub-factors in a tooltip (no click required) — reinforces "this number is explainable."
- Copying a code reference (function name, file path) from any panel includes a "copy link to this view" option, so facts are shareable (e.g., in a Slack message to a teammate).
- Fallback states (AI unavailable) use a neutral, informational tone icon — not a warning/error icon — since it's an expected, non-broken state.

---

## 21. Accessibility

- WCAG 2.1 AA minimum across all views.
- All diagrams (module map, dependency graph, flow diagrams) must have a non-visual equivalent — a structured list/table view toggle — so screen reader users and keyboard-only users have full access to the same information.
- Color is never the sole indicator of status/health (pair with icon, label, or pattern).
- Full keyboard navigability for Code Story stepping, Timeline scrubbing, and search.

---

## 22. Responsive Behaviour

- Primary product is desktop/wide-screen first (deep diagrams and side-by-side panels genuinely need the space) — this is stated explicitly rather than pretending full parity is realistic.
- Tablet: Code Stories, Health Dashboard, Engineering Mentor, and Search remain fully usable (these are the "read/ask" surfaces). Dependency Explorer and Architecture Replay degrade to a "best viewed on desktop" notice with a simplified summary view still available.
- Mobile: read-only support for Code Stories, Mentor conversations, and Health Dashboard scores only — positioned as "check in on the go," not a full editing/exploration surface.

---

## 23. Design Inspiration

Referenced for interaction patterns and tone, not visual copying:
- **Linear** — calm, fast, keyboard-first interaction model
- **Notion** — progressive disclosure, narrative-first content blocks
- **Flighty / flight trackers** — timeline scrubbing and live status framing (informs Architecture Replay)
- **Figma prototyping mode** — step-through, guided walkthrough interaction (informs Code Stories)

---

## 24. Component Library

Build on a headless component foundation (e.g., Radix primitives) with a custom design layer — avoid an out-of-the-box "AI product" UI kit look. Core custom components: Step Card (Code Stories), Score Gauge (Health/Architecture scores), Fact Chip (linked, clickable structural fact reference used throughout Mentor and detail panels), Timeline Scrubber, Module Node.

---

## 25. Typography

- A single, highly legible sans-serif for UI text (e.g., Inter or similar) paired with a monospace font for all code/symbol references (e.g., JetBrains Mono).
- Clear type scale: narrative/prose text sized generously (16px+ base) since Code Stories and Mentor responses are meant to be *read*, not scanned like a data table.

---

## 26. Spacing System

- 8px base grid throughout, consistent across dense views (Health Dashboard, Dependency Explorer) and narrative views (Code Stories, Mentor) — density itself should differ intentionally between these two view types (narrative views get more whitespace), but the underlying grid stays consistent.

---

## 27. Color Palette

- Neutral base (near-black/near-white with a slight cool undertone), avoiding pure black/white for reduced eye strain in long reading sessions.
- One accent color for primary actions and active states.
- A distinct, consistent semantic triad for health/status (e.g., calm green / amber / red) used identically across Architecture Health, Repository Health, and Contribution Readiness — so a score always means the same thing everywhere in the product.
- AI-layer surfaces (Mentor, AI-narrated content) get a subtle, distinct but not garish visual marker (e.g., a thin accent border or small icon) so users always know when they're reading AI-generated vs. deterministic content.

---

## 28. Icons

- Single consistent icon set (e.g., Lucide/Phosphor) throughout.
- No "sparkle/magic wand" icon overuse for AI features — use a simple, calm icon (e.g., a small chat/mentor glyph) to avoid the generic "AI product" visual cliché.

---

## 29. Illustration Style

- Minimal — prefer real generated diagrams (Code Stories, module maps) over decorative illustration. Where illustration is needed (empty states, onboarding), use simple geometric/line-art style consistent with the product's calm, precise tone — not cartoonish mascots.

---

## 30. Wireframe Suggestions

**Code Story screen** — two-column layout: left 40% flow diagram (vertical card stack), right 60% narrative pane; bottom-fixed scrub/step bar spanning full width.

**Architect Mode screen** — top: large score gauge + summary; middle: two-column list (Problems | Suggestions), each item expandable to show affected files and (if AI enabled) explanation; bottom: "Recheck" action to re-run analysis after fixes.

**Health Dashboard** — grid of metric cards (2–3 per row), each with a mini trend sparkline; clicking a card expands into a drill-down panel with historical trend graph and contributing factors.

**Architecture Replay** — full-width module map canvas on top; fixed-position horizontal scrubber with year/quarter markers at the bottom; collapsible side panel for "what changed here" detail.
