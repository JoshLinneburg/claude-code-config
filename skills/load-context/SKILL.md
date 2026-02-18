---
name: load-context
description: >
  Load project planning context at the start of a session. Reads the
  branch-specific state file and recent decisions to quickly understand
  where we left off. Invoke this at session start or when resuming work.
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Glob, Bash(git *)
---

# Load Project Context

Read and summarize the current project state so we can pick up where we
left off.

## Branch Resolution

State files are branch-specific:

1. Get the current branch: `git rev-parse --abbrev-ref HEAD`
2. Create a slug by replacing `/` with `-`
3. The state file is `.planning/STATE-<slug>.md`

## Steps

1. Check if `.planning/` directory exists. If not, tell the user they can
   run `/init-planning` to set it up and stop here.

2. Resolve the current branch and state file path (see Branch Resolution).

3. Read the branch-specific state file if it exists. If it doesn't exist
   but `.planning/` does, note that this branch hasn't been checkpointed
   yet. Optionally check if other `STATE-*.md` files exist and mention
   which branches do have saved state.

4. List files in `.planning/decisions/` and read the 3 most recent (by
   filename date prefix).

5. List files in `.planning/sessions/` and read the most recent for
   this branch (matching the branch slug in the filename), if any exist.

6. List files in `.planning/research/` and mention what topics have been
   researched (don't read them all — just list them so the user knows
   what's available).

7. Check current git branch and whether there are uncommitted changes.

8. Provide a **brief** summary (not a wall of text) structured as:
   - What branch we're on
   - Where we left off (from state file, or "no prior state for this branch")
   - Key decisions that are in effect (from decisions/)
   - Available research topics (from research/)
   - What the recommended next steps are
   - Any open questions or blockers that need resolution

9. Check for stale state files: list all `STATE-*.md` files, compare
   their slugs against current local branches
   (`git branch --format='%(refname:short)'` with `/` → `-`). If any
   stale files are found, mention it at the end:
   "N stale state file(s) from merged branches. Run /cleanup-planning
   to review and remove them."
   Don't belabor it — just a one-line note.

Do not parrot the files back verbatim. Synthesize and summarize.
