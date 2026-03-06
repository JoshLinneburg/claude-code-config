---
name: review
description: >
  Critical code review of the current branch's changes. Run after completing
  a significant chunk of work. Evaluates testability, scalability, readability,
  documentation, pattern adherence, and correctness. Finds deficiencies and
  fixes them — does not just report.
argument-hint: [optional focus area]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(git *), Read, Write, Edit, Glob, Grep, Bash(uv run *), Bash(pnpm *), Bash(npm run *)
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

2. Read the project's CLAUDE.md and CONTRIBUTING.md if they exist — they define project-specific
   patterns and conventions that this review must respect.

3. If `$ARGUMENTS` was provided, use it to focus the review (e.g.,
   "review tests only", "review the extraction module").

## Review Criteria

For every changed file, evaluate against ALL of the following. Do not
skim. Read the code carefully.

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

## Output

For each issue found:
1. State what's wrong and why it matters (one sentence)
2. Fix it immediately — edit the file

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
