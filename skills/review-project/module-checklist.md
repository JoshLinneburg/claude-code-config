# Module Review Checklist

For each module or major directory, evaluate:

- **Consistency** — Do all files in the module follow the same patterns?
  Same naming, same error handling, same test structure?
- **Testability** — Is business logic separated from I/O? Are there
  untested code paths? Are tests testing behavior or just mocks?
- **Naming & Idioms** — Leading underscores only on genuinely private/internal
  items. No magic strings. Descriptive names. Follow the language's community
  conventions where the project doesn't override (`snake_case` for Python/Rust,
  `camelCase` for JS/TS, `PascalCase` for classes/types). Prefer idiomatic
  constructs: `.map()`/`.filter()` in JS, list comprehensions in Python,
  modern APIs (`pathlib`, `fetch`) over older equivalents.
- **Dead code** — Unused imports, unreachable branches, commented-out
  code, orphaned files.
- **Documentation** — Public APIs documented. Non-obvious logic explained.
  Stale docs that no longer match the code.
- **Error handling** — Consistent patterns. No silently swallowed errors.
  Validation at boundaries.
- **Type safety** — Full use of the language's type system. No `any`,
  no untyped public functions, no raw dicts where data classes belong.
- **Security** — At system boundaries (user input, external APIs, file
  I/O): is data validated before use in queries, commands, or output?
  Secrets hardcoded or logged? Auth checks in place? Untrusted data
  deserialized without validation? Do not flag internal trusted calls.
- **Observability** — Are errors logged with enough context to diagnose
  in production? Appropriate log levels? Sensitive data kept out of
  logs? For LLM/AI calls: token usage, latency, model version tracked?
  Silent catch blocks without logging are bugs.

Return a list of findings (file, line, severity, issue, suggested fix).
Do NOT apply fixes — report only.
