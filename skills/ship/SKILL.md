---
name: ship
description: >
  PR prep and submission. Runs lint, tests, and build. Verifies .planning
  decisions are committed. Generates a PR description from branch commits
  and planning context. Creates the PR via gh. The "I'm done" button.
argument-hint: [optional base branch, defaults to main]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(git *), Bash(gh *), Bash(uv run *), Bash(pnpm *), Bash(npm run *), Bash(npx *), Read, Glob, Grep, Skill
---

# Ship

Prepare and submit a pull request for the current branch. This is the
final gate before code leaves the branch.

## Prerequisites

1. Confirm we're NOT on `main` or `master`. If we are, stop and tell the
   user — there's nothing to ship.
2. Determine the base branch. Use `$ARGUMENTS` if provided, otherwise
   default to `main`. Verify the base branch exists.
3. Get the current branch name.

## Phase 1: Verification

Run ALL of the following. Do not skip steps. If any step fails, stop and
fix the issue before continuing.

### 1a. Uncommitted changes
Run `git status`. If there are uncommitted changes, ask the user whether
to commit them or stash them before proceeding. Do not silently ignore
dirty state.

### 1b. Detect project tooling
Read `package.json`, `pyproject.toml`, `Makefile`, or equivalent to find:
- **Lint command** (e.g., `ruff check`, `eslint`, `pnpm lint`)
- **Test command** (e.g., `pytest`, `vitest`, `pnpm test`)
- **Build command** (e.g., `next build`, `vite build`, `docker build`)
- **Type check command** (e.g., `mypy`, `tsc --noEmit`)

For monorepos, detect and run checks for each affected package (use the
diff to determine which packages changed).

### 1c. Run lint
Run the lint command(s). Fix any issues that can be auto-fixed. If manual
fixes are needed, make them and commit.

### 1d. Run type checks
Run the type check command(s) if the project has them. Fix issues.

### 1e. Run tests
Run the test command(s). Do NOT run integration tests unless the user
explicitly asked for them. If tests fail, diagnose and fix.

### 1f. Run build
Run the build command if it exists. This catches import errors and
build-time issues that lint and tests miss.

## Phase 2: Planning Hygiene

### 2a. Decisions committed
Check if `.planning/decisions/` has any uncommitted or untracked files.
If so, stage and commit them — they should travel with the PR.

### 2b. State file current
If `.planning/` exists, run `/checkpoint` to capture final state before
the PR is created.

## Phase 3: PR Creation

### 3a. Push the branch
Run `git push -u origin HEAD`. If the branch already tracks a remote,
just `git push`.

### 3b. Generate PR description
Gather context from:
- `git log <base>..HEAD --oneline` — all commits on the branch
- `git diff <base> --stat` — files changed summary
- `.planning/decisions/` — any decision records created on this branch
- `.planning/STATE-<branch-slug>.md` — current state summary
- The diff itself for key changes

Write a PR description with this structure:
```
## Summary
<2-5 bullet points describing what this PR does and why>

## Changes
<grouped by area/package if monorepo, otherwise by logical change>

## Decisions
<reference any ADRs created, with one-line summaries>

## Test Plan
- [ ] <what to verify>
```

### 3c. Create the PR
Use `gh pr create` with the generated title and body. Use a HEREDOC for
the body to preserve formatting.

### 3d. Report
Output the PR URL and a one-line summary of what was shipped.

## Important

- If verification fails (lint, tests, build), fix the issues. Do not
  skip verification to create the PR.
- If the user has already pushed and a PR exists, detect this with
  `gh pr view` and offer to update the existing PR instead.
- Do not force push. Do not amend published commits.
- The PR title should follow Conventional Commits format when possible
  (e.g., `feat: add grader message history`).
