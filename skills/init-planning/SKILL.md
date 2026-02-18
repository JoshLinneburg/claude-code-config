---
name: init-planning
description: >
  Initialize the .planning/ directory structure in the current project.
  Run this once on the main branch, then commit. Worktrees inherit it.
  Branch switching is handled automatically via branch-named state files.
argument-hint: [optional project description]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(mkdir *), Bash(git *), Write, Read, Glob
---

# Initialize Planning Directory

Set up the `.planning/` directory in the current project root for context
persistence across sessions.

## Branch & Worktree Awareness

State files are named per-branch: `STATE-<branch-slug>.md` where the slug
is the branch name with `/` replaced by `-` (e.g., `feat/grader-improvement`
becomes `STATE-feat-grader-improvement.md`).

This means:
- Switching branches in a single repo preserves each branch's state
- Worktrees (which are always on a specific branch) also work correctly
- `decisions/` and `research/` are tracked in git — shared across everything

## Steps

1. Determine if we are in a git repo. Run `git rev-parse --show-toplevel`
   to find the repo root. If this fails, we're not in a git repo — just
   create the directory without the git-specific setup.

2. Get the current branch: `git rev-parse --abbrev-ref HEAD`
   Create the branch slug by replacing `/` with `-`.

3. Create the directory structure:
   ```
   .planning/
     decisions/
     research/
     sessions/
   ```

4. Create `.planning/.gitignore` with:
   ```
   # Per-branch state — not shared via git
   STATE-*.md
   sessions/
   ```

5. Create a `.planning/README.md` with:
   ```markdown
   # .planning/

   Context persistence for Claude Code sessions.

   ## Structure
   - `STATE-<branch>.md` — Current working state (per-branch, gitignored)
   - `decisions/` — Architectural decision records (tracked in git, shared)
   - `research/` — Research findings (tracked in git, shared)
   - `sessions/` — Session summaries (per-branch, gitignored)

   ## Usage
   - `/checkpoint [description]` — Save current state
   - `/load-context` — Load state at session start
   - `/save-decision [title]` — Record an architectural decision

   State files are named by branch (`STATE-main.md`, `STATE-feat-my-feature.md`)
   so switching branches in a single repo or using worktrees both work correctly.
   Decisions and research are tracked in git and propagate across branches on merge.
   ```

6. Create `.planning/decisions/.gitkeep` (empty) so git tracks the directory.

7. Create `.planning/research/.gitkeep` (empty) so git tracks the directory.

8. Initialize the state file for the current branch
   (`.planning/STATE-<branch-slug>.md`) with:

   ```markdown
   # Project State

   **Last updated:** [today's date]
   **Branch:** [current branch]

   ## Current Focus
   [What we're working on right now — fill in after first session]

   ## Recent Progress
   - [nothing yet]

   ## Open Questions
   - [nothing yet]

   ## Next Steps
   - [nothing yet]
   ```

9. If `$ARGUMENTS` was provided, use it as the project description in the
   state file under a `## Project` heading at the top.

10. Tell the user:
    - The directory is ready
    - They should **commit** `.planning/` to the main branch (the .gitignore
      inside it handles the per-branch files automatically)
    - Existing worktrees will pick up the directory on next merge/rebase
    - Each branch creates its own state file on first `/checkpoint`
    - Switching branches preserves each branch's state independently
