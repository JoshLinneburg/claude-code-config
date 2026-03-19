# Sequential Review Criteria

Evaluate against ALL 11 criteria. Do not skim. Read the code carefully.

---

## 1. Correctness
- Does it actually work? Trace the logic. Look for off-by-one errors,
  unhandled edge cases, incorrect assumptions.
- Are there race conditions, resource leaks, or error paths that silently
  fail?
- For async code: are promises/futures properly awaited? Are there
  fire-and-forget calls that should be awaited? Are cancellation and
  timeout paths handled?

## 2. Security
- Is user input validated and sanitized before use in SQL queries, shell
  commands, file paths, or HTML output? Look for injection vectors:
  SQL injection (use parameterized queries), command injection (avoid
  shell interpolation of user data), XSS (encode output), path traversal
  (canonicalize and restrict paths).
- Are API keys, tokens, credentials, or secrets hardcoded or logged?
  Check string literals, environment variable defaults, and log/print
  statements.
- **Authorization completeness** — Don't just check if auth exists.
  Enumerate ALL operations on a resource (view, edit, delete, share,
  export, etc.) and verify EACH one enforces authorization. A shared
  chat link that hides the message input but still exposes delete and
  rename is broken authorization. When access control is applied to one
  action, trace every other action on the same resource and verify
  they're equally guarded.
- **Server-side enforcement** — Is authorization enforced at the
  API/backend layer, or only in the UI? A frontend that conditionally
  hides a button is not access control — the backend must reject
  unauthorized requests regardless of what the frontend renders. If you
  see a permission check only in a component's render logic, flag it.
- Is untrusted data deserialized without validation (e.g., `pickle.loads`,
  `eval`, `JSON.parse` into executable contexts)?
- Only flag issues at system boundaries — user input, external API
  responses, file I/O. Do not flag internal function calls between
  trusted modules.

---

## 3. Readability
- Can a human reason through this code without consulting three other
  files? Are complex operations broken into well-named steps?
- Is there unnecessary cleverness that could be written more plainly?
- Does the code use the language's idiomatic constructs? Prefer `.map()`,
  `.filter()`, `.reduce()` over manual loops in JS/TS. Prefer list
  comprehensions and generators over explicit accumulation in Python.
  Prefer modern standard library APIs (`pathlib` over `os.path`, `fetch`
  over `XMLHttpRequest`, `structuredClone` over
  `JSON.parse(JSON.stringify(...))`). Code that fights the language's
  grain is harder to read even when correct.

## 4. Naming & Conventions
- **Convention hierarchy**: project conventions take precedence — check
  surrounding code first. Where the project is silent, follow the
  language's community standards: `snake_case` for Python/Rust,
  `camelCase` for JS/TS, `PascalCase` for classes/types everywhere.
  Code that uses the wrong casing for its language looks foreign and
  slows down readers.
- **Leading underscores**: Are `_foo()` functions genuinely private/
  internal, or is the underscore being used reflexively? A function
  that is tested directly, imported elsewhere, or part of a module's
  API should NOT have a leading underscore. Fix any misuse.
- Are there magic numbers or strings that should be named constants or
  enums?

## 5. Type Safety
- Is the language's type system used fully? No `any` in TypeScript, no
  untyped public functions in Python, no raw dicts/objects where data
  classes or interfaces belong.
- Are there unsafe type assertions or casts that bypass the compiler's
  checks? Every `as unknown as Foo`, every `# type: ignore`, every
  force-unwrap is a bet that the runtime matches your assumption —
  verify each one is justified.
- Are generics used where appropriate? A function that works on multiple
  types should use generics, not accept `any` or `object`.
- For state machines and finite sets of values: are discriminated unions
  or enums used instead of bare strings? `status: "active" | "inactive"`
  is better than `status: string`.

## 6. Pattern Adherence
- Does the code follow the patterns established in this project? Check
  the project's CLAUDE.md, CONTRIBUTING.md, and surrounding code for
  conventions.
- **Actively compare against siblings**: for any new or changed file,
  read 1-2 other files in the same directory to learn the established
  pattern. A new file in `services/` should match existing services in
  structure (class vs functions, constructor injection, lifecycle
  methods, error conventions). A module of loose functions in a
  directory of classes is a pattern violation. A file that reaches
  into global state when siblings use dependency injection is a
  pattern violation. Don't just check docs — check the actual
  neighboring code.
- If the code deviates from established patterns, is there a good reason?
  If not, align it.

---

## 7. Testability
- Are tests testing **actual behavior** or just asserting that mocks were
  called correctly? A test that only verifies "the right method was called
  on a mock" proves nothing about correctness.
- Is business logic mixed with I/O? If so, it should be split: the I/O
  layer fetches data, a pure function processes it. Pure functions are
  trivially testable with real inputs and real outputs.
- Are there new functions or code paths without test coverage?
- Do tests cover error paths and edge cases, not just the happy path?
  What happens with empty input, null values, boundary conditions?

---

## 8. Scalability & Efficiency
- Are there unnecessary loops, redundant computations, or O(n²)
  operations that could be O(n)?
- Are there opportunities to use built-in language features instead of
  hand-rolled logic?
- Will this code work correctly with 10x the current data volume?
- Are there N+1 query patterns, unnecessary network calls, or repeated
  disk I/O in hot paths?

## 9. Observability
- Can you debug this code in production without attaching a debugger?
  If something goes wrong, will the logs tell you what happened?
- Are errors logged with enough context to diagnose? An error log
  that says "failed" is useless — include what was attempted, what
  input triggered it, and why it failed.
- Are log levels appropriate? ERROR for failures needing attention,
  WARN for recoverable issues, INFO for significant business events,
  DEBUG for development detail. Don't log happy-path noise at INFO.
- Is sensitive data kept out of logs? PII, tokens, passwords, auth
  headers, and full LLM prompts/completions should be redacted or
  omitted.
- For LLM/AI API calls: are token usage, latency, and model version
  observable? Untracked LLM calls make cost overruns invisible.
- Silent catch blocks that swallow exceptions without logging are bugs.
  At minimum, log the error.
- Don't flag logging gaps in test code, scripts, or one-off utilities.
  Focus on production code paths.

---

## 10. Documentation & Maintenance
- Do public functions have docstrings/comments explaining what they do,
  their parameters, and return values?
- Are non-obvious design decisions explained with comments?
- Do the changes affect behavior described in READMEs, `docs/` files,
  CLAUDE.md, or CONTRIBUTING.md? If so, are those docs still accurate?
- Are there new env vars, CLI commands, or API endpoints not documented?
- Is there dead code, commented-out code, or TODO comments that should
  be resolved? Unused imports? Unreachable branches?

---

## 11. Architecture & Responsibility Boundaries
- **Module cohesion** — Does each module/file do one thing well? Are
  there functions that would be more at home in a different module?
  Business logic in a route handler should be extracted. I/O in a utility
  module should be in a service. Formatting logic in a service should be
  in a formatter/serializer.
- **Service extraction** — Are there patterns that should be a service
  but aren't? Signs: a function mixes coordination logic with data
  access, a module holds state, a utility wraps an external API.
  Conversely: is something a service that should just be a function?
- **Dependency direction** — Do modules depend at the right abstraction
  level? Routes → services → external APIs. Pure functions should not
  import I/O modules. Check for circular or upward dependencies.
- **API surface** — Are module boundaries clean? Are there functions with
  leading underscores that are actually public (imported elsewhere,
  tested directly)? Are there public functions that should be private?
- **Parameter threading** — Are parameters passed through 3+ calls just
  to reach their destination? This may indicate a missing abstraction
  (context object, middleware, dependency injection).
