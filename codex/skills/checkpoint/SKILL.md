---
name: checkpoint
description: >
  Save current project state and recent decisions to .planning/. Invoke this
  proactively when significant progress has been made, an important decision
  was reached, a complex investigation concluded, or before wrapping up a
  session. Do not wait to be asked.
---

# Checkpoint

Save a snapshot of where we are. This must be concise - the entire point is
surviving context limits, so do not write novels.

## Branch Resolution

State files are branch-specific. Before reading or writing state:

1. Get the current branch: `git rev-parse --abbrev-ref HEAD`
2. Create a slug by replacing `/` with `-` (e.g., `feat/grader-improvement`
   -> `feat-grader-improvement`)
3. The state file is `.planning/STATE-<slug>.md`

This allows switching branches in a single repo without losing state, and
also works correctly with worktrees.

## Preconditions

- If `.planning/` does not exist at all, tell the user to run `$init-planning`.
- If the branch-specific state file doesn't exist, that's normal - create it.
- If `.planning/sessions/` does not exist, create it with `mkdir -p`.

## Steps

1. Resolve the current branch and state file path (see Branch Resolution above).
2. Read the state file if it exists to understand last known state.
3. Gather current git context (branch, recent commits).
4. **Overwrite** the state file. This file is always "right now" - not an
   append log. Keep it under 80 lines. Structure:

   ```markdown
   # Project State

   **Last updated:** [date]
   **Branch:** [branch]
   **Recent commits:**
   - [1-liner for each of last 3-5 commits]

   ## Current Focus
   [1-2 sentences on what we're actively working on]

   ## Recent Progress
   - [bulleted list of what was accomplished since last checkpoint]

   ## Key Decisions in Effect
   - [short list of active architectural/design decisions, with references
     to .planning/decisions/ files if they exist]

   ## Open Questions / Blockers
   - [anything unresolved]

   ## Next Steps
   - [what should happen next, in priority order]
   ```

5. If `.planning/ROADMAP.md` exists, check whether any roadmap items should
   move between sections based on work done this session:
   - **Now -> Done**: If a "Now" item was completed, move it to "Done" with
     a date and PR/commit reference.
   - **Next -> Now**: If a "Next" item was started (branch created, work begun),
     move it to "Now" with a `branch:` reference.
   - Keep the Done section trimmed to the last ~2 months. Remove older entries.
   - Do not rewrite items that haven't changed.

6. If a specific architectural or design decision was made during this work,
   use the save-decision skill with the decision title. Do not duplicate
   the ADR template here - save-decision owns that format.

7. If this is an end-of-session checkpoint, also write a brief session summary
   to `.planning/sessions/[date]-[branch-slug].md` capturing what was
   accomplished and any loose threads. Include the branch name in the filename
   so session logs don't collide across branches.

**Checkpoint reason:** $ARGUMENTS
