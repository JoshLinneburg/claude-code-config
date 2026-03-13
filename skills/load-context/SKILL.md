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

## Pre-loaded Data

**Branch:** !`git rev-parse --abbrev-ref HEAD 2>/dev/null`
**Git status:** !`git status --porcelain 2>/dev/null`
**Local branches:** !`git branch 2>/dev/null`

## Steps

1. Determine the branch slug: take the branch name from above and replace
   `/` with `-` (e.g., `feat/foo` becomes `feat-foo`).

2. Use the **Read** tool to read `.planning/STATE-<branch-slug>.md`.
   If it doesn't exist, note "no state file for this branch."

3. Use the **Read** tool to read `.planning/lessons.md`.
   If it doesn't exist, note "no lessons file."

4. Use **Glob** to find files matching `.planning/decisions/*.md`.
   Read the 3 most recent ones. These are tracked in git and represent
   project-wide decisions.

5. Use **Glob** to find files matching `.planning/research/*`.
   List them (don't read them all — just show what's available).

6. Use **Glob** to find files matching `.planning/sessions/*-<branch-slug>.md`.
   If any exist, read the most recent one to recover session context.

7. Use **Glob** to find all `.planning/STATE-*.md` files.
   Compare their slugs against the local branch list (with `/` replaced
   by `-`). Flag any that don't match a current branch as stale.

8. If the branch/git-status data above shows errors or `.planning/`
   doesn't exist, tell the user they can run `/init-planning` and stop.

9. Provide a **brief** summary (not a wall of text) structured as:
   - What branch we're on
   - Where we left off (from state file, or "no prior state")
   - Key decisions in effect (from the decision files you read)
   - Available research topics (from the listing)
   - Recommended next steps
   - Open questions or blockers
   - Lessons learned (list them so they're in context)
   - Stale state files (one-line note if any: "N stale state file(s).
     Run /cleanup-planning to review.")

Do not parrot the files back verbatim. Synthesize and summarize.
