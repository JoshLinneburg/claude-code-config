---
name: cleanup-planning
description: >
  Find and remove stale .planning/ state and session files for branches
  that no longer exist locally. Checks for important unsaved context
  before deleting anything.
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Glob, Bash(git *), Bash(rm *), Write
---

# Cleanup Planning

Find state and session files for branches that have been merged/deleted
and clean them up.

## How Staleness Is Detected

1. List all `.planning/STATE-*.md` files.
2. Get all local branch names: `git branch --format='%(refname:short)'`
3. Convert each branch name to its slug (replace `/` with `-`).
4. Any `STATE-<slug>.md` file whose slug doesn't match a current local
   branch is stale.

Also check `.planning/sessions/` for files containing branch slugs that
no longer match any local branch.

## Steps

1. Run the staleness detection above. If no stale files are found, tell
   the user everything is clean and stop.

2. For each stale state file:
   a. Read it and present a **brief summary** (3-4 lines) of what it
      contains — the branch name, last focus area, and any key decisions
      or open questions listed.
   b. Flag anything that looks like it should be preserved — open questions
      that were never resolved, decisions referenced but not found in
      `.planning/decisions/`, research conclusions not captured elsewhere.

3. Ask the user:
   - "Any of these contain context that should be saved to a decision
     record before I delete them?"
   - Wait for their response. Do NOT delete anything until they confirm.

4. If the user identifies something to preserve, write it to the
   appropriate place (decision record, research file, etc.) first.

5. Only after the user confirms, delete the stale state files and any
   matching stale session files.

6. Report what was deleted.

## Important

This skill deletes files. Always show the user exactly what will be
deleted and get explicit confirmation before removing anything.
