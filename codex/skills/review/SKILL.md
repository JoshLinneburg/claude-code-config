---
name: review
description: >
  Critical code review of the current branch's changes. Run after completing
  a significant chunk of work. Spawns 6 parallel analysis agents (correctness
  & security, code quality, test quality, production readiness, documentation
  & maintenance, architecture & responsibility boundaries) then aggregates
  findings and applies fixes. Designed to be run 2-3 times iteratively.
---

# Code Review

Perform a thorough, critical review of the changes on this branch. This is
not a feel-good exercise. Code that doesn't meet the bar gets fixed.

## Diff Context To Gather

Run these commands before reviewing:

```bash
git diff main --name-only
git diff main --stat
git log --oneline -10
```

If `main` is not available, try `master`. If neither base branch exists,
ask the user what base branch to use or inspect recent commits with
`git diff HEAD~N`.

## Setup

1. Review the diff context to understand the scope.
   If the diff failed (no main/master branch), ask the user what base
   branch to use, or use `git diff HEAD~N --name-only` for recent commits.

2. Read the project's `AGENTS.md`, `CLAUDE.md`, and `CONTRIBUTING.md` if
   they exist. They define project-specific patterns and conventions that
   this review must respect.

3. If `$ARGUMENTS` was provided, use it to focus the review (e.g.,
   "review tests only", "review the extraction module").

4. Get the full diff: `git diff main` or `git diff master`, matching
   whichever base exists.

5. Build an impact map from the diff before analysis:
   - Identify changed exported functions/classes/types, component props,
     API endpoints, route handlers, event names, database schemas,
     config keys, env vars, CLI flags, serialized payload shapes, and
     other contracts.
   - For each changed symbol or contract, search for consumers outside
     the changed files with `rg`, import/reference searches, route/client
     lookups, and test references.
   - Read the relevant unchanged consumer files. Verify they still call
     the changed code with the right arguments, handle the returned shape,
     preserve required invariants, and still satisfy authorization,
     validation, error-handling, and observability expectations.
   - Include the impact map in the review input: changed item, consumer
     files checked, and any consumers intentionally skipped with the reason.
   - If references are dynamic or hard to search, inspect likely entry
     points manually and report the residual risk instead of assuming the
     diff is self-contained.

## Iteration Awareness

Check recent commits for review-fix patterns:
- Look for commits with `fix:`, `refactor:`, or `style:` messages
  (especially commits made in the last few minutes)
- If found, note which files were touched by those fix commits
- During analysis, give extra scrutiny to those files - verify the fixes
  are correct and didn't introduce new issues
- This avoids treating every run as a blank slate when the skill is
  designed to be run 2-3 times iteratively

## Analysis Strategy

**If the diff touches fewer than 3 files**, read this skill's
`criteria.md` for the review criteria and evaluate all of them in a
single sequential pass. The sequential pass must include unchanged
consumers from the impact map.

**If the diff touches 3 or more files**, read
this skill's `agents.md` for the 6 parallel agent prompts. Spawn
them in parallel - each agent receives the changed files, full diff,
impact map, relevant unchanged consumer files, and project conventions.
Each performs a **read-only** analysis and returns a list of findings.

## Aggregation & Fixes

After all agents return (or after the sequential pass):

### 1. Deduplicate
Multiple agents may flag the same issue from different angles. Merge
duplicates, keeping the most specific description and the highest
severity.

### 2. Sort by severity
Order: critical first, then moderate, then minor.

### 3. Apply fixes
For critical and moderate findings:
1. State what's wrong and why it matters (one sentence)
2. Fix it - edit the file

For minor findings:
1. List them with file, line, and a one-sentence description
2. Do NOT auto-fix - present them for the user to decide on

### 4. Verify
After all fixes are applied:
1. Run the project's lint command if it exists
2. Run the project's test suite if it exists
3. Report a summary: what was found, what was fixed, what passed

If the review finds nothing substantive, say so. Do not manufacture
issues to look thorough.

## Re-running

This review is designed to be run 2-3 times iteratively. Each pass may
surface issues that were masked by the previous round's fixes. If you
fixed anything, tell the user they should consider running `$review` again.
