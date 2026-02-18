# Claude Code Config

Personal [Claude Code](https://docs.anthropic.com/en/docs/claude-code) configuration with a lightweight context persistence system. No frameworks, no ceremony — just skills, hooks, and rules that help Claude remember things across sessions.

## What's In Here

| File | Purpose |
|---|---|
| `CLAUDE.md` | Working philosophy, ground rules, and criteria for when Claude should proactively save context |
| `settings.json` | Permission allowlist, deny list, and session lifecycle hooks |
| `skills/` | Slash commands for context persistence (see below) |

## Setup

```bash
# Clone into ~/.claude (the directory Claude Code uses for user-level config)
git clone git@github.com:JoshLinneburg/claude-code-config.git ~/.claude
```

If you already have a `~/.claude` directory, back it up first — this will replace it.

### After Cloning

- **Review `settings.json`** — it includes `"defaultMode": "dontAsk"` and a broad set of pre-approved commands. Adjust to your own comfort level.
- `supabase db reset` is explicitly denied. Add other destructive commands to the `deny` list as needed.

## Skills

Run `/init-planning` once per project (on your main branch, then commit). After that:

| Command | When to use |
|---|---|
| `/load-context` | Start of a session — summarizes where you left off |
| `/checkpoint [description]` | Save current state — Claude also invokes this on its own when it recognizes something important happened |
| `/save-decision [title]` | Record an architectural decision (ADR format) |
| `/cleanup-planning` | Remove stale state files from merged branches |

## How It Works

### The `.planning/` Directory

Each project gets a `.planning/` directory (created by `/init-planning`) that persists context across sessions:

```
.planning/
  STATE-<branch-slug>.md   # Current state (per-branch, gitignored)
  decisions/                # ADRs (tracked in git, shared across branches)
  research/                 # Research findings (tracked in git, shared)
  sessions/                 # Session logs (per-branch, gitignored)
```

**State files are per-branch.** `feat/my-feature` gets `STATE-feat-my-feature.md`. This works correctly whether you use git worktrees or switch branches in a single repo.

**Decisions and research are tracked in git.** They merge with your code and propagate across branches naturally.

### Hooks

Three hooks fire automatically on session lifecycle events:

- **Session start** — nudges Claude to read the branch's state file
- **Session resume** — same as start
- **After compaction** — re-injects the state file contents into the new context window (this is the critical one that prevents context loss on `/compact`)

### Proactive Checkpointing

`CLAUDE.md` defines criteria for when Claude should checkpoint without being asked: architectural decisions, dead-end pivots, scope clarifications, bug root cause discoveries, and end-of-session. It also defines when *not* to checkpoint (routine changes, trivial fixes).

## What This Is Not

This is not a framework. There are no phases, no gates, no agent personas. It's a persistent memory layer that sits underneath however you already work with Claude Code.
