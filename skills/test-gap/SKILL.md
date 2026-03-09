---
name: test-gap
description: >
  Targeted test coverage analysis for the current branch's changes.
  Identifies new or modified functions and code paths that lack test
  coverage. More focused than /review — laser-targeted at untested code.
  Optionally writes the missing tests.
argument-hint: [optional: "write" to auto-write missing tests]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(git *), Bash(uv run *), Bash(pnpm *), Bash(npm run *), Read, Write, Edit, Glob, Grep, Agent
---

# Test Gap

Analyze the current branch's changes and identify code that lacks test
coverage.

## Pre-loaded Diff Context

**Changed files:**
!`git diff main --name-only 2>/dev/null || git diff master --name-only 2>/dev/null || echo "(could not diff against main or master)"`

**Diff stats:**
!`git diff main --stat 2>/dev/null || git diff master --stat 2>/dev/null || echo ""`

## Setup

### 1. Review the diff
Use the pre-loaded context above to understand the scope. If the diff
failed (no main/master branch), ask the user what base branch to use.

Filter to source files only (exclude configs, docs, migrations, lock
files, generated code). Focus on files that contain logic.

### 2. Read project test conventions
Check for test configuration:
- `pyproject.toml` — pytest config, coverage settings
- `package.json` — test scripts, vitest/jest config
- `jest.config.*`, `vitest.config.*`, `pytest.ini`
- Read the project's CLAUDE.md and CONTRIBUTING.md for test conventions

Understand:
- Where tests live (e.g., `tests/`, `__tests__/`, colocated `*.test.*`)
- Test file naming convention (e.g., `test_<module>.py`, `<module>.test.ts`)
- Markers or tags for test categories (e.g., `@pytest.mark.integration`)
- Coverage thresholds if enforced

### 3. Map changed code to test files
For each changed source file, find its corresponding test file(s).
Use the project's naming convention. If no corresponding test file
exists, that's a gap.

## Analysis

For each changed file, read both the source and its test file(s).

### 4. Identify gaps

Categorize each changed function/method/class into one of:

**Covered** — Has tests that exercise its actual behavior with real
inputs and real outputs. Tests that only assert mock calls do NOT count
as covered.

**Partially covered** — Has tests for the happy path but is missing:
- Error/exception paths
- Edge cases (empty inputs, boundary values, null/None)
- Branch coverage (if/else paths, match arms, early returns)

**Uncovered** — No tests at all, or tests only exist for a wrapper/caller
that doesn't exercise this function's logic directly.

**Untestable as written** — Logic is tangled with I/O in a way that
can't be tested without mocking internals. Flag this and suggest a
refactor: extract the pure logic into a separate function.

### 5. Prioritize

Rank gaps by severity:

1. **Critical** — Public API functions, business logic, security-sensitive
   code with no tests
2. **High** — Functions with complex branching or error handling that
   have partial coverage
3. **Medium** — Helper functions or straightforward logic without tests
4. **Low** — Simple delegating functions, trivial wrappers, config setup

## Output

### 6. Report

For each gap, output:

```
[SEVERITY] file:line — function_name
  Gap: <what's missing — one sentence>
  Suggested test: <brief description of what the test should verify>
```

Group by file. Order by severity within each file.

End with a summary:
- N functions analyzed
- N covered / N partially covered / N uncovered
- Top 3 highest-priority gaps

### 7. Write tests (if requested)

If `$ARGUMENTS` contains "write" or "fix":

For each gap (starting with Critical, then High):
1. Write the test in the appropriate test file, following the project's
   conventions exactly (naming, imports, fixtures, parametrize patterns)
2. Run the test to verify it passes
3. If the test reveals a bug, report it but do NOT fix the source code —
   that's a separate task

After writing tests:
1. Run the full test suite to ensure nothing broke
2. Run lint on the new test files
3. Commit: `test: add coverage for <summary>`

### 8. Re-run hint

If tests were written, suggest running `/test-gap` again — writing tests
sometimes reveals additional gaps in adjacent code.

## Important

- Do NOT count mock-heavy tests as coverage. A test that only verifies
  "supabase.table().select() was called with X" proves nothing about
  correctness. Real coverage means: given real input, the function
  produces the correct output.
- For I/O-heavy code (API clients, database wrappers), the right answer
  is often "extract the logic, test the logic, trust the I/O layer."
  Flag the refactoring opportunity rather than writing a mock-heavy test.
- Don't suggest tests for trivial code (property accessors, simple
  re-exports, type definitions).
- Match the project's test style exactly. Read existing tests before
  writing new ones. Use the same fixtures, assertion patterns, and
  file organization.
- For monorepos, scope to the packages that actually changed. Don't
  analyze the entire repo.
