---
name: review
description: >
  Critical code review of the current branch's changes. Run after completing
  a significant chunk of work. Spawns 4 parallel analysis agents (correctness,
  testability, naming, documentation) then aggregates findings and applies
  fixes. Designed to be run 2-3 times iteratively.
argument-hint: [optional focus area]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(git *), Read, Write, Edit, Glob, Grep, Bash(uv run *), Bash(pnpm *), Bash(npm run *), Agent
---

# Code Review

Perform a thorough, critical review of the changes on this branch. This is
not a feel-good exercise. Code that doesn't meet the bar gets fixed.

## Pre-loaded Diff Context

**Changed files:**
!`git diff main --name-only 2>/dev/null || git diff master --name-only 2>/dev/null || echo "(could not diff against main or master)"`

**Diff stats:**
!`git diff main --stat 2>/dev/null || git diff master --stat 2>/dev/null || echo ""`

**Recent commits:**
!`git log --oneline -10 2>/dev/null`

## Setup

1. Review the pre-loaded diff context above to understand the scope.
   If the diff failed (no main/master branch), ask the user what base
   branch to use, or use `git diff HEAD~N --name-only` for recent commits.

2. Read the project's CLAUDE.md and CONTRIBUTING.md if they exist — they
   define project-specific patterns and conventions that this review must
   respect.

3. If `$ARGUMENTS` was provided, use it to focus the review (e.g.,
   "review tests only", "review the extraction module").

4. Get the full diff: `git diff main` (for the analysis agents).

## Iteration Awareness

Check the pre-loaded recent commits for review-fix patterns:
- Look for commits with `fix:`, `refactor:`, or `style:` messages
  (especially commits made in the last few minutes)
- If found, note which files were touched by those fix commits
- During analysis, give extra scrutiny to those files — verify the fixes
  are correct and didn't introduce new issues
- This avoids treating every run as a blank slate when the skill is
  designed to be run 2-3 times iteratively

## Analysis Strategy

**If the diff touches fewer than 3 files**, read
`${CLAUDE_SKILL_DIR}/criteria.md` for the 10 review criteria and evaluate
all of them in a single sequential pass.

**If the diff touches 3 or more files**, read
`${CLAUDE_SKILL_DIR}/agents.md` for the 5 parallel agent prompts. Spawn
them in parallel — each agent receives the changed files, full diff, and
project conventions. Each performs a **read-only** analysis and returns
a list of findings.

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
2. Fix it — edit the file

For minor findings:
1. List them with file, line, and a one-sentence description
2. Do NOT auto-fix — present them for the user to decide on

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
fixed anything, tell the user they should consider running `/review` again.
