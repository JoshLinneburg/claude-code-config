# Module Review Checklist

For each module or major directory, evaluate:

- **Consistency** — Do all files in the module follow the same patterns?
  Same naming, same error handling, same test structure?
- **Testability** — Is business logic separated from I/O? Are there
  untested code paths? Are tests testing behavior or just mocks?
- **Naming** — Leading underscores only on genuinely private/internal
  items. No magic strings. Descriptive names.
- **Dead code** — Unused imports, unreachable branches, commented-out
  code, orphaned files.
- **Documentation** — Public APIs documented. Non-obvious logic explained.
  Stale docs that no longer match the code.
- **Error handling** — Consistent patterns. No silently swallowed errors.
  Validation at boundaries.
- **Type safety** — Full use of the language's type system. No `any`,
  no untyped public functions, no raw dicts where data classes belong.

Return a list of findings (file, line, severity, issue, suggested fix).
Do NOT apply fixes — report only.
