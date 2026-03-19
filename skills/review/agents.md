# Parallel Review Agents

Spawn these 6 agents in parallel. Each receives the list of changed files,
the full diff, and the project's CLAUDE.md/CONTRIBUTING.md content. Each
performs a **read-only** analysis — no edits, no fixes. Each returns a list
of findings.

---

## Agent 1: Correctness & Security

**Question: "Is the logic right and safe?"**

This agent traces execution paths line-by-line, looking for bugs and
vulnerabilities. It reads source code deeply — not skimming for patterns,
but following data through functions.

Evaluate:
- **Correctness** — Does it actually work? Trace the logic. Look for
  off-by-one errors, unhandled edge cases, incorrect assumptions. Are
  there race conditions, resource leaks, or error paths that silently
  fail? For async code: are promises/futures properly awaited? Are
  cancellation and timeout paths handled?
- **Security** — At system boundaries (user input, external APIs, file
  I/O), is data validated before use in SQL queries, shell commands,
  file paths, or HTML output? Are secrets hardcoded or logged? Is
  untrusted data deserialized without validation (`pickle.loads`,
  `eval`, unvalidated `JSON.parse`)? Do not flag internal calls
  between trusted modules.
- **Authorization completeness** — Don't stop at "is there an auth
  check?" Enumerate ALL operations on a resource and verify EACH one
  enforces authorization. If a resource has restricted access (shared
  links, read-only views, role-based visibility), trace every action
  (edit, delete, rename, export) and confirm they're all guarded — not
  just the primary action. Frontend-only enforcement (hiding a button
  without a server-side check) is not authorization — flag it.

Return findings as a list, each with: file path, line number, severity
(critical/moderate/minor), what's wrong (one sentence), and suggested fix.

---

## Agent 2: Code Quality

**Question: "Does this code belong in this codebase?"**

This agent evaluates whether the code is well-written by the standards of
its language and its project. These four criteria are evaluated together
because they're different facets of the same judgment — read each file once
and assess all four dimensions.

Evaluate:
- **Readability** — Can a human reason through this code without
  consulting three other files? Is there unnecessary cleverness? Are
  complex operations broken into well-named steps? Does the code use
  idiomatic constructs for its language (`.map()`/`.filter()` in JS,
  list comprehensions in Python, modern APIs like `pathlib`/`fetch`
  over older equivalents)? Code that fights the language's grain is
  harder to read even when correct.
- **Naming & Conventions** — Project conventions take precedence —
  check surrounding code first. Where the project is silent, follow
  the language's community standards: `snake_case` for Python/Rust,
  `camelCase` for JS/TS, `PascalCase` for classes/types. Are leading
  underscores used correctly (only genuinely private/internal items)?
  Are there magic numbers or strings that should be named constants
  or enums?
- **Type Safety** — Is the type system used fully? No `any` in
  TypeScript, no untyped public functions in Python, no raw dicts
  where data classes belong. Flag unsafe casts/assertions (`as
  unknown as Foo`, `# type: ignore`, force-unwraps) and verify each
  is justified. Are generics and discriminated unions used where
  appropriate?
- **Pattern Adherence** — Does the code follow the patterns
  established in this project (from CLAUDE.md, CONTRIBUTING.md, and
  surrounding code)? If the code deviates, is there a good reason?
  **Actively compare against siblings**: for any new or changed file,
  read 1-2 other files in the same directory to learn the established
  pattern. For example, a new file in `services/` should be compared
  against existing services — does it use the same class structure,
  constructor injection, lifecycle methods (`close()`), error handling
  conventions? A module of loose functions in a directory of classes
  is a pattern violation. A file that reaches into global state
  (`getattr(app.state, ...)`) when siblings use dependency injection
  is a pattern violation. Don't just check CLAUDE.md — check the
  actual code around it.

Return findings in the same format as Agent 1.

---

## Agent 3: Test Quality

**Question: "Can you prove this code works?"**

This agent is unique: it reads BOTH source files AND their corresponding
test files. No other agent needs test files as primary input.

For each changed source file, find its corresponding test file(s) using
the project's naming convention. If no test file exists, that's a finding.

Evaluate:
- **Coverage** — Are there new functions or code paths without test
  coverage? Map each changed function to the tests that exercise it.
  If none exist, flag it.
- **Test substance** — Are tests testing actual behavior with real
  inputs and real outputs? A test that only verifies "the right method
  was called on a mock" proves nothing about correctness. Mock-only
  assertions do NOT count as coverage.
- **I/O separation** — Is business logic mixed with I/O (database,
  API calls, file system)? If so, flag it: the I/O layer should fetch
  data, a pure function should process it. Pure functions are trivially
  testable.
- **Error paths** — Do tests cover error cases and edge cases, not
  just the happy path? What happens with empty input, null values,
  boundary conditions, malformed data?

Return findings in the same format as Agent 1.

---

## Agent 4: Production Readiness

**Question: "Will this survive production?"**

This agent evaluates whether the code will perform well under load and
whether you can tell when it's not. Performance without observability
is a ticking bomb; observability without performance consideration is
monitoring a slow system.

Evaluate:
- **Scalability & Efficiency** — Are there unnecessary loops, redundant
  computations, or O(n²) operations that could be O(n)? Are there
  opportunities to use built-in language features instead of hand-rolled
  logic? Will this code work correctly with 10x the current data volume?
  Are there N+1 query patterns, unnecessary network calls, or repeated
  disk I/O in hot paths?
- **Observability** — Can you debug this code in production? Are errors
  logged with enough context to diagnose (what was attempted, what
  input triggered it, why it failed)? Are log levels appropriate
  (ERROR/WARN/INFO/DEBUG)? Is sensitive data kept out of logs (PII,
  tokens, passwords, auth headers, full LLM prompts)? For LLM/AI API
  calls, are token usage, latency, and model version observable?
  Silent catch blocks that swallow exceptions without logging are bugs.
  Focus on production code paths, not tests or scripts.

Return findings in the same format as Agent 1.

---

## Agent 5: Documentation & Maintenance

**Question: "Can someone maintain this?"**

This agent cross-references documentation files with source code, and
identifies cruft that makes the codebase harder to understand.

Evaluate:
- **Inline documentation** — Do public functions have docstrings/comments
  explaining what they do, their parameters, and return values? Are
  non-obvious design decisions explained with comments?
- **Project documentation** — Do the changes affect behavior described in
  READMEs, `docs/` files, CLAUDE.md, or CONTRIBUTING.md? If so, are those
  docs still accurate? Check for: new env vars or config not documented,
  changed CLI commands or API endpoints not reflected in docs, renamed or
  moved files referenced in READMEs, new features with no documentation.
  Apply the same checks as `/doc-drift` but scoped to files relevant to
  the branch's changes.
- **Dead code** — Is there dead code, commented-out code, or TODO
  comments that should be resolved? Unused imports? Unreachable branches?

Return findings in the same format as Agent 1.

---

## Agent 6: Architecture & Responsibility Boundaries

**Question: "Is this code in the right place, and are the boundaries right?"**

This agent evaluates module-level design: whether responsibilities are
correctly distributed, whether abstractions are at the right level, and
whether the dependency graph makes sense. Code quality agents check *how*
code is written; this agent checks *where* it lives and *what* it knows
about.

Evaluate:
- **Module cohesion** — Does each module/file do one thing well? Are
  there functions that would be more at home in a different module?
  For example: business logic in a route handler (should be extracted),
  I/O in a utility module (should be in a service), formatting logic in
  a service (should be in a formatter/serializer). Read the module's
  docstring and ask: does every function in this file serve that stated
  purpose?
- **Service extraction** — Are there patterns that should be a service
  but aren't? Signs: a function that mixes coordination logic with data
  access, a module that holds state or manages connections, a utility
  that wraps an external API. Conversely: is something a service that
  should just be a function? Not everything needs a class — if it has
  no state and no lifecycle, a plain function is simpler.
- **Dependency direction** — Do modules depend on things at the right
  level of abstraction? Routes should depend on services, not on
  implementation details. Services should not import from routes. Pure
  functions should not import I/O modules. Check import statements:
  does the dependency graph flow downward (routes → services → external
  APIs), or are there circular or upward dependencies?
- **API surface** — Are module boundaries clean? What's exported vs
  internal? Are there functions with leading underscores that are
  actually part of the public API (imported elsewhere, tested directly)?
  Conversely, are there public functions that should be private? Check
  `__all__`, imports from other modules, and test files to determine
  the real API surface.
- **Cross-cutting concerns** — Are concerns like logging, tracing,
  error handling, and configuration threaded through in a consistent
  way, or are they handled ad-hoc in each module? Look for parameters
  being passed through 3+ function calls just to reach their
  destination — this "parameter threading" may indicate a missing
  abstraction (context object, middleware, dependency injection).

Return findings in the same format as Agent 1.
