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

The following data was gathered automatically. If any section shows an
error or "not found", that data is unavailable.

**Branch:** !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(not a git repo)"`

**Git status:**
!`git status --porcelain 2>/dev/null | head -20 || echo "(not a git repo)"`

**State file:**
!`cat ".planning/STATE-$(git rev-parse --abbrev-ref HEAD 2>/dev/null | tr '/' '-').md" 2>/dev/null || echo "(no state file for this branch)"`

**Lessons:**
!`cat .planning/lessons.md 2>/dev/null || echo "(no lessons file)"`

**Decision files:**
!`ls -1t .planning/decisions/ 2>/dev/null | grep -v .gitkeep | head -10 || echo "(no decisions)"`

**Research files:**
!`ls -1 .planning/research/ 2>/dev/null | grep -v .gitkeep || echo "(no research)"`

**Recent session for this branch:**
!`ls -1t .planning/sessions/*-$(git rev-parse --abbrev-ref HEAD 2>/dev/null | tr '/' '-').md 2>/dev/null | head -1 | xargs cat 2>/dev/null || echo "(no session files for this branch)"`

**All state files (for stale check):**
!`ls -1 .planning/STATE-*.md 2>/dev/null || echo "(none)"`

**Local branches:**
!`git branch --format='%(refname:short)' 2>/dev/null || echo "(not a git repo)"`

## Steps

1. If the pre-loaded data shows "(not a git repo)" or `.planning/`
   doesn't exist, tell the user they can run `/init-planning` and stop.

2. Review the pre-loaded state file. If it shows "(no state file for this
   branch)", note that this branch hasn't been checkpointed yet. Mention
   which other branches have state (from the state files listing).

3. Read the 3 most recent decision files listed above. These are tracked
   in git and represent project-wide decisions.

4. If a session file was loaded above, incorporate its context.

5. Check for stale state files: compare the state file slugs against the
   local branch list (with `/` replaced by `-`). If any don't match a
   current branch, note it.

6. Provide a **brief** summary (not a wall of text) structured as:
   - What branch we're on
   - Where we left off (from state file, or "no prior state")
   - Key decisions in effect (from the decision files you read)
   - Available research topics (from the listing)
   - Recommended next steps
   - Open questions or blockers
   - Lessons learned (from the pre-loaded lessons — list them so they're
     in context)
   - Stale state files (one-line note if any: "N stale state file(s).
     Run /cleanup-planning to review.")

Do not parrot the files back verbatim. Synthesize and summarize.
