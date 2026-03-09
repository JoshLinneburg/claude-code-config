# Skills Reference

Complete reference for all Claude Code skills in this configuration. Each skill is a slash command backed by a `SKILL.md` prompt file.

## Table of Contents

- [Context Persistence](#context-persistence)
  - [`/init-planning`](#init-planning) — Set up `.planning/` in a project
  - [`/load-context`](#load-context) — Resume where you left off
  - [`/checkpoint`](#checkpoint) — Save current state
  - [`/save-decision`](#save-decision) — Record an architectural decision
  - [`/log-lesson`](#log-lesson) — Record a correction
  - [`/cleanup-planning`](#cleanup-planning) — Remove stale state files
- [Code Quality](#code-quality)
  - [`/review`](#review) (aka [`/josh-test`](#josh-test)) — Branch diff code review
  - [`/review-project`](#review-project) — Full codebase health check
  - [`/test-gap`](#test-gap) — Test coverage analysis
  - [`/doc-drift`](#doc-drift) — Documentation staleness detector
- [Workflow](#workflow)
  - [`/ship`](#ship) — PR prep and submission
  - [`/worktree`](#worktree) — Parallel workspace setup
  - [`/status-report`](#status-report) — Cross-branch dashboard
  - [`/spike`](#spike) — Structured technical investigation

---

## Context Persistence

These skills manage the `.planning/` directory that preserves context across sessions. Run `/init-planning` once per project, then use the rest as needed.

### `/init-planning`

**Usage:** `/init-planning`
**Invocation:** Manual only (`disable-model-invocation: true`)

Initialize the `.planning/` directory in the current project. Creates the directory structure, `.gitignore` (state files and sessions are gitignored; decisions and research are tracked), and an initial state file for the current branch. Run once on main, then commit.

[Full spec](init-planning/SKILL.md)

### `/load-context`

**Usage:** `/load-context`

Read the branch-specific state file, recent decisions, session logs, and lessons learned. Uses dynamic context injection to pre-load branch, state file, lessons, decision/research listings, and git status before Claude even starts — cutting 5-8 tool calls down to 1-2. Outputs a brief summary of where you left off, what decisions are in effect, and recommended next steps. Run at the start of every session.

[Full spec](load-context/SKILL.md)

### `/checkpoint`

**Usage:** `/checkpoint [description]`

Save the current branch's state to `.planning/STATE-<branch-slug>.md`. Claude also invokes this proactively when decisions are made, dead ends are hit, scope changes, or sessions wrap up. State files stay under 80 lines.

[Full spec](checkpoint/SKILL.md)

### `/save-decision`

**Usage:** `/save-decision [title]`

Record an architectural or design decision as an ADR in `.planning/decisions/YYYY-MM-DD-slug.md`. Decision records are tracked in git and shared across branches on merge. Use for meaningful technical choices, not trivial implementation details.

[Full spec](save-decision/SKILL.md)

### `/log-lesson`

**Usage:** `/log-lesson [description]`

Append a concise, actionable rule to `.planning/lessons.md` after a user correction. Lessons are re-loaded at session start and re-injected after compaction so the same mistake doesn't recur.

[Full spec](log-lesson/SKILL.md)

### `/cleanup-planning`

**Usage:** `/cleanup-planning`
**Invocation:** Manual only (`disable-model-invocation: true`)

Find state files for branches that no longer exist locally. Shows a summary of each, asks if anything should be promoted to a decision record, then deletes with confirmation.

[Full spec](cleanup-planning/SKILL.md)

---

## Code Quality

Skills for reviewing code, finding test gaps, and keeping documentation honest.

### `/review`

**Usage:** `/review [focus area]`
**Alias:** `/josh-test`

Critical self-review of the current branch's changes (diff against main). Uses dynamic context injection to pre-load changed files, diff stats, and recent commits before analysis begins. For diffs touching 3+ files, reads [`agents.md`](review/agents.md) and spawns 4 parallel read-only analysis agents — (1) correctness, scalability & security, (2) testability & readability, (3) naming & pattern adherence, (4) documentation & dead code. For smaller diffs, reads [`criteria.md`](review/criteria.md) and runs all 9 criteria in a single pass. Auto-fixes critical and moderate findings; lists minor findings for the user to decide on. Iteration-aware: on follow-up runs, gives extra scrutiny to files touched by recent review-fix commits. Designed to be run 2-3 times iteratively.

Review criteria: correctness, testability, readability, naming & conventions, documentation, scalability, security, observability, pattern adherence.

Supporting files:
- [`agents.md`](review/agents.md) — Parallel agent prompts (loaded only for 3+ file diffs)
- [`criteria.md`](review/criteria.md) — Sequential review criteria (loaded only for small diffs)

[Full spec](review/SKILL.md)

### `/review-project`

**Usage:** `/review-project [module or directory]`

Full codebase health check in three phases: (1) architecture/structure evaluation, (2) module-by-module review using [`module-checklist.md`](review-project/module-checklist.md) with parallel subagents per module (consistency, testability, naming, dead code, documentation, error handling, type safety, security, observability), (3) cross-cutting concerns via 4 parallel agents defined in [`cross-cutting-agents.md`](review-project/cross-cutting-agents.md) — dependency health, test coverage gaps, pattern consistency & security, and documentation drift. All analysis agents are read-only; fixes are applied sequentially after aggregation. Scoped to a module if specified.

Supporting files:
- [`module-checklist.md`](review-project/module-checklist.md) — Per-module review criteria
- [`cross-cutting-agents.md`](review-project/cross-cutting-agents.md) — Cross-cutting analysis agent prompts

[Full spec](review-project/SKILL.md)

### `/test-gap`

**Usage:** `/test-gap [write]`

Analyzes the current branch's diff to find functions and code paths that lack test coverage. Uses dynamic context injection to pre-load changed files and diff stats. Categorizes each as covered, partially covered, uncovered, or untestable-as-written. Prioritizes by severity. Pass `write` to auto-generate missing tests following the project's conventions. Explicitly rejects mock-only assertions as "covered."

[Full spec](test-gap/SKILL.md)

### `/doc-drift`

**Usage:** `/doc-drift [file or directory]`
**Execution:** Runs in a forked subagent (`context: fork`)

Compares documentation against actual code to find: dead file paths and command references, outdated setup instructions and architecture descriptions, missing docs for new features and env vars, and inconsistencies across README/CLAUDE.md/CONTRIBUTING.md. Fixes high and medium severity issues directly. Runs in a forked context to keep the main conversation clean. Also integrated into `/ship` (targeted check) and `/review-project` (cross-cutting concerns).

[Full spec](doc-drift/SKILL.md)

---

## Workflow

Skills that automate multi-step development sequences.

### `/ship`

**Usage:** `/ship [base branch]`
**Invocation:** Manual only (`disable-model-invocation: true`)

The "I'm done" button. In sequence: runs lint, type checks, tests, and build. Checks for uncommitted `.planning/decisions/`. Runs a report-only test-gap check and a targeted doc-drift check on changed files. Checkpoints the branch. Pushes and creates a PR via `gh` with a generated description that includes commit summary, decisions, test coverage gaps, and test plan. Will not skip verification.

[Full spec](ship/SKILL.md)

### `/worktree`

**Usage:** `/worktree <branch-name> [--from <base>]`
**Invocation:** Manual only (`disable-model-invocation: true`)

Spin up a parallel workspace. Creates a git worktree in the project's `-worktrees/` sibling directory (e.g., `wembly-worktrees/feat-my-thing`). Detects the package manager and installs dependencies. Symlinks `.env*` files from the main repo. Checkpoints the current branch before switching context.

[Full spec](worktree/SKILL.md)

### `/status-report`

**Usage:** `/status-report`
**Execution:** Runs in a forked subagent (`context: fork`)

Read-only cross-branch dashboard. Uses dynamic context injection to pre-load worktree list, branch info, and remote tracking before analysis. Runs in a forked context to avoid polluting the main conversation with diagnostic output. Shows all local branches and worktrees with: last commit and age, uncommitted changes, one-line summary from each branch's `.planning/` state file, and CI status (if `gh` is available). Flags branches with no activity in 30+ days and stale state files.

[Full spec](status-report/SKILL.md)

### `/spike`

**Usage:** `/spike <topic or question>`

Structured technical investigation. Creates a research document in `.planning/research/YYYY-MM-DD-slug.md`. Investigates using web search, codebase analysis, and parallel subagents. Produces a decision-ready document with options, trade-offs, comparison table, and recommendation. Commits the research. Optionally hands off to `/save-decision` if a conclusion is reached.

[Full spec](spike/SKILL.md)
