# Parallel Review Agents

Spawn these 4 agents in parallel. Each receives the list of changed files,
the full diff, and the project's CLAUDE.md/CONTRIBUTING.md content. Each
performs a **read-only** analysis — no edits, no fixes. Each returns a list
of findings.

## Agent 1: Correctness & Scalability

Evaluate:
- **Correctness** — Does it actually work? Trace the logic. Look for
  off-by-one errors, unhandled edge cases, incorrect assumptions. Are
  there race conditions, resource leaks, or error paths that silently fail?
- **Scalability & Efficiency** — Are there unnecessary loops, redundant
  computations, or O(n^2) operations that could be O(n)? Are there
  opportunities to use built-in language features instead of hand-rolled
  logic? Will this code work correctly with 10x the current data volume?

Return findings as a list, each with: file path, line number, severity
(critical/moderate/minor), what's wrong (one sentence), and suggested fix.

## Agent 2: Testability & Readability

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

## Agent 3: Naming & Pattern Adherence

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

## Agent 4: Documentation & Dead Code

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
