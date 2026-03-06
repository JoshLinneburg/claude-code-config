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

## Setup

1. Determine what changed. Run `git diff main --name-only` (or the
   appropriate base branch) to get the list of modified files.
   If this is not a feature branch (e.g., working on `main`), ask the
   user what to review, or use `git diff HEAD~N --name-only` for recent
   commits.

2. Read the project's CLAUDE.md and CONTRIBUTING.md if they exist — they
   define project-specific patterns and conventions that this review must
   respect.

3. If `$ARGUMENTS` was provided, use it to focus the review (e.g.,
   "review tests only", "review the extraction module").

4. Get the full diff: `git diff main` (for the analysis agents).

## Parallel Analysis

**If the diff touches fewer than 3 files**, skip the parallel agents and
run all criteria sequentially in a single pass (the overhead of spawning
4 agents isn't worth it for a small diff). Jump to the Review Criteria
section below and evaluate all 7 criteria inline.

**If the diff touches 3 or more files**, spawn 4 analysis agents in
parallel. Each agent receives the list of changed files, the full diff,
and the project's CLAUDE.md/CONTRIBUTING.md content. Each agent performs
a **read-only** analysis — no edits, no fixes. Each returns a list of
findings.

### Agent 1: Correctness & Scalability
Evaluate:
- **Correctness** — Does it actually work? Trace the logic. Look for
  off-by-one errors, unhandled edge cases, incorrect assumptions. Are
  there race conditions, resource leaks, or error paths that silently fail?
- **Scalability & Efficiency** — Are there unnecessary loops, redundant
  computations, or O(n²) operations that could be O(n)? Are there
  opportunities to use built-in language features instead of hand-rolled
  logic? Will this code work correctly with 10x the current data volume?

Return findings as a list, each with: file path, line number, severity
(critical/moderate/minor), what's wrong (one sentence), and suggested fix.

### Agent 2: Testability & Readability
Evaluate:
- **Testability** — Are tests testing actual behavior or just asserting
  that mocks were called correctly? Is business logic mixed with I/O?
  Are there new functions or code paths without test coverage? Do tests
  cover error paths and edge cases, not just the happy path?
- **Readability** — Can a human reason through this code without
  consulting three other files? Are variable and function names
  descriptive and unambiguous? Is there unnecessary cleverness? Are
  complex operations broken into well-named steps?

Return findings in the same format as Agent 1.

### Agent 3: Naming & Pattern Adherence
Evaluate:
- **Naming & Conventions** — Are leading underscores used correctly
  (only genuinely private/internal items)? Do names follow the project's
  existing conventions? Are there magic numbers or strings that should
  be named constants or enums?
- **Pattern Adherence** — Does the code follow the patterns established
  in this project (from CLAUDE.md, CONTRIBUTING.md, and surrounding
  code)? If the code deviates from established patterns, is there a good
  reason? If not, it should be aligned.

Return findings in the same format as Agent 1.

### Agent 4: Documentation & Dead Code
Evaluate:
- **Inline Documentation** — Do public functions have docstrings/comments
  explaining what they do, their parameters, and return values? Are
  non-obvious design decisions explained with comments?
- **Project Documentation** — Do the changes affect behavior described in
  READMEs, `docs/` files, CLAUDE.md, or CONTRIBUTING.md? If so, are those
  docs still accurate? Check for: new env vars or config not documented,
  changed CLI commands or API endpoints not reflected in docs, renamed or
  moved files referenced in READMEs, new features with no documentation.
  Apply the same checks as `/doc-drift` but scoped to files relevant to
  the branch's changes.
- **Dead Code** — Is there dead code, commented-out code, or TODO
  comments that should be resolved? Unused imports? Unreachable branches?

Return findings in the same format as Agent 1.

## Review Criteria (sequential fallback)

If running sequentially (< 3 files), evaluate against ALL of the
following. Do not skim. Read the code carefully.

### 1. Correctness
- Does it actually work? Trace the logic. Look for off-by-one errors,
  unhandled edge cases, incorrect assumptions.
- Are there race conditions, resource leaks, or error paths that silently
  fail?

### 2. Testability
- Are tests testing **actual behavior** or just asserting that mocks were
  called correctly? A test that only verifies "the right method was called
  on a mock" proves nothing about correctness.
- Is business logic mixed with I/O? If so, it should be split: the I/O
  layer fetches data, a pure function processes it. Pure functions are
  trivially testable with real inputs and real outputs.
- Are there new functions or code paths without test coverage?
- Do tests cover error paths and edge cases, not just the happy path?

### 3. Readability
- Can a human reason through this code without consulting three other files?
- Are variable and function names descriptive and unambiguous?
- Is there unnecessary cleverness that could be written more plainly?
- Are complex operations broken into well-named steps?

### 4. Naming & Conventions
- **Leading underscores**: Are `_foo()` functions genuinely private/internal,
  or is the underscore being used reflexively? A function that is only called
  within its own module is private. A function that is tested directly, imported
  elsewhere, or part of a module's API should NOT have a leading underscore.
  Fix any misuse.
- Do names follow the project's existing conventions? Check surrounding code.
- Are there magic numbers or strings that should be named constants or enums?

### 5. Documentation
- Do public functions have docstrings/comments explaining what they do,
  their parameters, and return values?
- Are non-obvious design decisions explained with comments?
- Do the changes affect behavior described in READMEs, `docs/` files,
  CLAUDE.md, or CONTRIBUTING.md? If so, are those docs still accurate?
- Are there new env vars, CLI commands, or API endpoints not documented?
- Is there dead code, commented-out code, or TODO comments that should
  be resolved?

### 6. Scalability & Efficiency
- Are there unnecessary loops, redundant computations, or O(n²) operations
  that could be O(n)?
- Are there opportunities to use built-in language features instead of
  hand-rolled logic?
- Will this code work correctly with 10x the current data volume?

### 7. Pattern Adherence
- Does the code follow the patterns established in this project? Check
  the project's CLAUDE.md, CONTRIBUTING.md, and surrounding code for conventions.
- If the code deviates from established patterns, is there a good reason?
  If not, align it.

## Aggregation & Fixes

After all agents return (or after the sequential pass):

### 1. Deduplicate
Multiple agents may flag the same issue from different angles. Merge
duplicates, keeping the most specific description and the highest
severity.

### 2. Sort by severity
Order: critical first, then moderate, then minor.

### 3. Apply fixes
For each finding, starting with critical:
1. State what's wrong and why it matters (one sentence)
2. Fix it immediately — edit the file

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
