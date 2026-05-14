---
name: status-report
description: >
  Cross-branch situational awareness. Shows all local branches and worktrees
  for the current project with their last commit, age, uncommitted changes,
  and a one-line summary from each branch's .planning state file. The
  "where am I across all my parallel work" dashboard.
---

# Status Report

Show a quick dashboard of all branches and worktrees for the current
project.

## Context To Gather

Run these read-only commands before building the dashboard:

```bash
git rev-parse --show-toplevel
git rev-parse --abbrev-ref HEAD
git worktree list
git branch --format='%(refname:short)|%(committerdate:relative)|%(subject)'
git branch -vv --format='%(refname:short)|%(upstream:track)'
```

If any command fails, record the failure and continue with the information
that is available.

## Steps

### 1. Parse git data
Use the git data gathered above to build the dashboard. If any section
shows an error, skip that section.

### 2. Check for uncommitted changes
For the current worktree, run `git status --porcelain` to check for
uncommitted changes.

For other worktrees, run `git -C <worktree-path> status --porcelain`
to check each one. If a worktree path no longer exists, note it as stale.

### 3. Read state file summaries
If `.planning/` exists, read each `STATE-*.md` file's first 5-10 lines
to extract the summary/status. Map each state file to its branch using
the slug convention (branch name with `/` replaced by `-`).

### 4. Check CI status (optional)
If `gh` is available, run `gh pr list --head <branch> --json number,title,statusCheckRollup --limit 1`
for each branch that has a remote to see if there's an open PR and its
CI status. If `gh` isn't configured, skip this silently.

### 5. Output

Format as a clean dashboard. Example:

```
PROJECT: wembly (~/projects/wembly)

  CURRENT: feat/assistant-routing
    Last commit: 2h ago - "feat: add Hawthorn engine routing"
    Status: 3 files modified, 1 untracked
    State: Backend routing complete. Web frontend changes pending.
    PR: #92 (checks passing)

  WORKTREES:
    ~/projects/wembly-worktrees/fix-citation-lookup [fix/citation-lookup]
      Last commit: 1d ago - "fix: handle structural references in lookup"
      Status: clean
      State: Investigation complete. Fix ready for review.

  OTHER BRANCHES:
    feat/email-signup        3d ago   "feat: add Resend integration"
    fix/table-parsing        1w ago   "fix: pipe-delimited table extraction"
    main                     2h ago   "Merge PR #91"
```

Adapt the format to what information is actually available. Don't show
sections that have no content (e.g., skip WORKTREES if there are none).

### 6. Stale branch hint
If there are branches with no commits in the last 30 days, add a note
at the bottom: "N branches with no activity in 30+ days. Consider
cleaning up."

If `.planning/` has stale state files (for branches that no longer exist),
mention it: "N stale state files. Run $cleanup-planning to review."

## Important

- This is a READ-ONLY skill. It does not modify anything.
- Keep it fast. Don't read full state files - just the first few lines.
- Don't clutter the output. This is a glance, not a deep dive. If the
  user wants details on a specific branch, they should use `$load-context`.
- If git commands fail for other worktrees (e.g., permission issues or
  missing paths), report the error inline and continue with the rest.
