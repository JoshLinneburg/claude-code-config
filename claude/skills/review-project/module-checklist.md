# Module Review Checklist

For each module or major directory, evaluate against all of the following.
These mirror the 11 review criteria from `/review`, applied at module scope.

- **Correctness** — Trace logic in key functions. Off-by-one errors,
  unhandled edge cases, race conditions, resource leaks, silent failures.
  For async code: proper await, cancellation, timeout handling.
- **Security** — At system boundaries (user input, external APIs, file
  I/O): is data validated before use in queries, commands, or output?
  Secrets hardcoded or logged? Untrusted data deserialized without
  validation? Do not flag internal trusted calls. For authorization:
  enumerate ALL operations on each resource and verify EACH one enforces
  access control — not just the primary action. Flag frontend-only
  enforcement (hiding UI elements without server-side checks).
- **Readability** — Can you follow the code without jumping between
  files? Idiomatic constructs used (`.map()`/`.filter()` in JS, list
  comprehensions in Python, modern APIs)? Unnecessary cleverness?
- **Naming & Conventions** — Follow the language's community standards
  where the project doesn't override (`snake_case` for Python/Rust,
  `camelCase` for JS/TS, `PascalCase` for classes/types). Leading
  underscores only on genuinely private items. No magic strings.
- **Type Safety** — Full use of the language's type system. No `any`,
  no untyped public functions, no raw dicts where data classes belong.
  Unsafe casts justified. Generics and discriminated unions where
  appropriate.
- **Pattern Adherence** — Do all files in the module follow the same
  patterns? Same error handling, same structure, same conventions as
  the rest of the project?
- **Testability** — Is business logic separated from I/O? Are there
  untested code paths? Are tests testing behavior or just mocks?
  Do tests cover error paths?
- **Scalability** — O(n²) operations, N+1 queries, unnecessary network
  calls, repeated disk I/O in hot paths.
- **Observability** — Are errors logged with enough context to diagnose
  in production? Appropriate log levels? Sensitive data kept out of
  logs? For LLM/AI calls: token usage, latency, model version tracked?
  Silent catch blocks without logging are bugs.
- **Documentation & Maintenance** — Public APIs documented. Non-obvious
  logic explained. Stale docs that no longer match the code. Dead code,
  unused imports, unreachable branches, commented-out code.
- **Architecture & Responsibility Boundaries** — Inside this module:
  does each file do one thing well, or are responsibilities tangled?
  Business logic in route handlers or components? I/O mixed into
  utility modules? Formatting logic inside services? Is the module's
  public surface (its exports / `__init__.py` / `index.ts`) intentional,
  or is everything implicitly public? Are leading-underscore functions
  genuinely internal, or imported across files? Within-module
  dependency direction sensible (e.g., handlers → services →
  repositories, not the reverse)? Parameters threaded through 3+ calls
  to reach their destination (missing abstraction)? Module-level
  architecture is distinct from cross-module concerns evaluated in
  Phase 1 — flag both this module's internal cohesion and any
  responsibilities it has taken on that belong elsewhere.

Return a list of findings (file, line, severity, issue, suggested fix).
Do NOT apply fixes — report only.
