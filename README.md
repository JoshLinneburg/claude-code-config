# Claude Code Config

Personal [Claude Code](https://docs.anthropic.com/en/docs/claude-code) configuration with a lightweight context persistence system and code quality workflow. No frameworks, no ceremony — just skills, hooks, and rules that help Claude remember things across sessions and maintain code quality.

## Table of Contents

- [Philosophy](#philosophy)
- [What's In Here](#whats-in-here)
- [Setup](#setup)
- [Skills](#skills)
  - [Context Persistence](#context-persistence)
  - [Code Quality](#code-quality)
  - [Workflow](#workflow)
- [How It Works](#how-it-works)
  - [The `.planning/` Directory](#the-planning-directory)
  - [Hooks](#hooks)
  - [Self-Improvement Loop](#self-improvement-loop)
  - [Proactive Behavior](#proactive-behavior)

## Philosophy

This config treats AI as a tool for automating the development of software that meets the same bar a world-class human team would set. The goal is code that humans can read, extend, debug, and maintain without ever knowing an LLM wrote it. Not AI doing things humans never could — AI doing things how the best teams of humans previously operated, but faster and more consistently.

The human sets the architecture, the quality bar, and the process. The AI writes code, but operates within a system of standards, review skills, and persistent context that enforces discipline. Every change gets tested, linted, and reviewed against 10 criteria before it ships. Decisions are recorded. Lessons accumulate. Context survives across sessions.

If the AI disappeared tomorrow, you'd be left with a clean codebase, comprehensive tests, documented decisions, and code that any competent engineer could pick up and run with. That's the point.

This is not vibe coding — there's no "hey AI, build me a thing" and shipping whatever comes out. It's also not a framework — there are no phases, gates, or agent personas. It's a persistent memory layer and quality workflow that sits underneath however you already work with Claude Code.

## What's In Here

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Working philosophy, code standards, git workflow, and context persistence rules |
| `settings.json` | Permission allowlist, deny list, and session lifecycle hooks |
| [`skills/`](skills/README.md) | 15 slash commands for context persistence, code quality, and workflow automation |

## Setup

> **⚠️ This replaces your entire `~/.claude` directory.** If you already use Claude Code, you almost certainly have existing config there — `CLAUDE.md`, `settings.json`, `keybindings.json`, memory files, etc. **Back it up before cloning or you will lose it.**
>
> ```bash
> # Back up your existing config first
> cp -r ~/.claude ~/.claude-backup
> ```

```bash
# Clone into ~/.claude (the directory Claude Code uses for user-level config)
git clone git@github.com:JoshLinneburg/claude-code-config.git ~/.claude
```

### After Cloning

- **Review `settings.json`** — it uses `"defaultMode": "default"` (prompts for unrecognized commands). The allow list covers common dev tools. Adjust to your own comfort level.
- `supabase db reset` is explicitly denied. Add other destructive commands to the `deny` list as needed.

## Skills

Run `/init-planning` once per project (on your main branch, then commit) to enable context persistence. All other skills work immediately.

For detailed documentation on each skill, see the [Skills Reference](skills/README.md).

### Context Persistence

| Command | Purpose |
|---|---|
| `/init-planning` | Set up `.planning/` in a project |
| `/load-context` | Resume where you left off at session start |
| `/checkpoint` | Save current branch state |
| `/save-decision` | Record an architectural decision (ADR format) |
| `/log-lesson` | Record a correction to prevent recurrence |
| `/cleanup-planning` | Remove stale state files from merged branches |

### Code Quality

| Command | Purpose |
|---|---|
| `/review` (aka `/josh-test`) | Branch diff code review (10 criteria, 5 agents, iterative) |
| `/review-project` | Full codebase health check |
| `/test-gap` | Test coverage analysis for branch changes |
| `/doc-drift` | Documentation staleness detector |

### Workflow

| Command | Purpose |
|---|---|
| `/ship` | PR prep: lint, test, build, doc check, `gh pr create` |
| `/worktree` | Parallel workspace with dep install and env setup |
| `/status-report` | Cross-branch/worktree dashboard |
| `/spike` | Structured technical investigation |

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
