# Claude Code Config

Personal [Claude Code](https://docs.anthropic.com/en/docs/claude-code) configuration with a lightweight context persistence system and code quality workflow. No frameworks, no ceremony — just skills, hooks, and rules that help Claude remember things across sessions and maintain code quality.

## What's In Here

| File | Purpose |
|---|---|
| `CLAUDE.md` | Working philosophy, code standards, implementation discipline, git workflow, and context persistence rules |
| `settings.json` | Permission allowlist, deny list, and session lifecycle hooks |
| `skills/` | Slash commands for context persistence, self-improvement, and code review |

## Setup

```bash
# Clone into ~/.claude (the directory Claude Code uses for user-level config)
git clone git@github.com:JoshLinneburg/claude-code-config.git ~/.claude
```

If you already have a `~/.claude` directory, back it up first — this will replace it.

### After Cloning

- **Review `settings.json`** — it uses `"defaultMode": "default"` (prompts for unrecognized commands). The allow list covers common dev tools. Adjust to your own comfort level.
- `supabase db reset` is explicitly denied. Add other destructive commands to the `deny` list as needed.

## Skills

### Context Persistence

Run `/init-planning` once per project (on your main branch, then commit). After that:

| Command | When to use |
|---|---|
| `/load-context` | Start of a session — summarizes where you left off |
| `/checkpoint [description]` | Save current state — Claude also invokes this on its own when it recognizes something important happened |
| `/save-decision [title]` | Record an architectural decision (ADR format) |
| `/log-lesson [description]` | Record a lesson after a correction — prevents the same mistake across sessions |
| `/cleanup-planning` | Remove stale state files from merged branches |

### Code Quality

| Command | When to use |
|---|---|
| `/review [focus area]` | Critical self-review of the current branch's changes. Run after completing a chunk of work. Evaluates testability, scalability, readability, documentation, pattern adherence, and correctness. Fixes issues directly. Designed to be run 2-3 times iteratively. |
| `/review-project [module]` | Full codebase health check. Evaluates architecture, consistency, and adherence to project standards. Scoped to a module or directory if specified. Use for periodic health checks or after major refactors. |
| `/test-gap [write]` | Targeted test coverage analysis for the current branch's diff. Identifies untested functions and code paths. Pass "write" to auto-generate missing tests. Complements `/review` by focusing exclusively on coverage gaps. |
| `/doc-drift [scope]` | Detect stale documentation. Compares README, CLAUDE.md, CONTRIBUTING.md against actual code. Finds dead references, outdated instructions, missing docs for new features, and cross-doc inconsistencies. Fixes high/medium issues directly. Also runs as a targeted check within `/ship`. |

### Workflow

| Command | When to use |
|---|---|
| `/ship [base branch]` | PR prep and submission. Runs lint, tests, build. Verifies `.planning/decisions/` are committed. Generates a PR description from commits and planning context. Creates the PR via `gh`. The "I'm done" button. |
| `/worktree <branch>` | Spin up a parallel workspace. Creates a worktree in the project's `-worktrees/` sibling directory, installs dependencies, copies/symlinks env files. Checkpoints current branch before switching context. |
| `/status-report` | Cross-branch dashboard. Shows all local branches and worktrees with last commit, uncommitted changes, and `.planning/` state summaries. The "where am I" glance. |
| `/spike <topic>` | Structured technical investigation. Researches a topic, evaluates options, and produces a decision-ready document in `.planning/research/`. Use for Friday explorations, tool evaluations, or architectural questions. |

## How It Works

### The `.planning/` Directory

Each project gets a `.planning/` directory (created by `/init-planning`) that persists context across sessions:

```
.planning/
  STATE-<branch-slug>.md   # Current state (per-branch, gitignored)
  decisions/                # ADRs (tracked in git, shared across branches)
  research/                 # Research findings (tracked in git, shared)
  sessions/                 # Session logs (per-branch, gitignored)
  lessons.md               # Corrections and rules learned (per-project, gitignored)
```

**State files are per-branch.** `feat/my-feature` gets `STATE-feat-my-feature.md`. This works correctly whether you use git worktrees or switch branches in a single repo.

**Decisions and research are tracked in git.** They merge with your code and propagate across branches naturally.

**Lessons are per-project.** They accumulate corrections specific to that project and get re-loaded at session start and after compaction.

### Hooks

Three hooks fire automatically on session lifecycle events:

- **Session start** — nudges Claude to read the branch's state file
- **Session resume** — same as start
- **After compaction** — re-injects mandatory behavioral rules, the state file, and lessons.md into the new context window. This is the critical one: compaction compresses conversation history and can lose behavioral instructions. The hook restores them fresh.

### Self-Improvement Loop

When you correct Claude, it logs the correction to `.planning/lessons.md` as a concise, actionable rule. These lessons are:
- Read by `/load-context` at session start
- Re-injected by the compact hook when context is compressed
- Project-specific (different projects accumulate different lessons)

### Proactive Behavior

`CLAUDE.md` defines mandatory behaviors that Claude must perform without being asked:
- **Commit** after every completed unit of work
- **Checkpoint** when decisions are made, dead ends are hit, scope changes, or sessions wrap up
- **Log lessons** after any correction
- **Run verification** (lint, test, build) before considering work done

## What This Is Not

This is not a framework. There are no phases, no gates, no agent personas. It's a persistent memory layer and quality workflow that sits underneath however you already work with Claude Code.
