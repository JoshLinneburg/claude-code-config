# Sequential Review Criteria

Evaluate against ALL of the following. Do not skim. Read the code carefully.

## 1. Correctness
- Does it actually work? Trace the logic. Look for off-by-one errors,
  unhandled edge cases, incorrect assumptions.
- Are there race conditions, resource leaks, or error paths that silently
  fail?

## 2. Testability
- Are tests testing **actual behavior** or just asserting that mocks were
  called correctly? A test that only verifies "the right method was called
  on a mock" proves nothing about correctness.
- Is business logic mixed with I/O? If so, it should be split: the I/O
  layer fetches data, a pure function processes it. Pure functions are
  trivially testable with real inputs and real outputs.
- Are there new functions or code paths without test coverage?
- Do tests cover error paths and edge cases, not just the happy path?

## 3. Readability
- Can a human reason through this code without consulting three other files?
- Are variable and function names descriptive and unambiguous?
- Is there unnecessary cleverness that could be written more plainly?
- Are complex operations broken into well-named steps?
- Does the code use the language's idiomatic constructs? Prefer `.map()`,
  `.filter()`, `.reduce()` over manual loops in JS/TS. Prefer list
  comprehensions and generators over explicit accumulation in Python. Prefer
  modern standard library APIs (`pathlib` over `os.path`, `fetch` over
  `XMLHttpRequest`, `structuredClone` over `JSON.parse(JSON.stringify(...))`).
  Code that fights the language's grain is harder to read even when correct.

## 4. Naming & Conventions
- **Leading underscores**: Are `_foo()` functions genuinely private/internal,
  or is the underscore being used reflexively? A function that is only called
  within its own module is private. A function that is tested directly, imported
  elsewhere, or part of a module's API should NOT have a leading underscore.
  Fix any misuse.
- **Convention hierarchy**: project conventions take precedence — check
  surrounding code first. Where the project is silent, follow the language's
  community standards: `snake_case` for Python/Rust, `camelCase` for JS/TS,
  `PascalCase` for classes/types everywhere. Code that uses the wrong casing
  for its language looks foreign and slows down readers.
- Are there magic numbers or strings that should be named constants or enums?

## 5. Documentation
- Do public functions have docstrings/comments explaining what they do,
  their parameters, and return values?
- Are non-obvious design decisions explained with comments?
- Do the changes affect behavior described in READMEs, `docs/` files,
  CLAUDE.md, or CONTRIBUTING.md? If so, are those docs still accurate?
- Are there new env vars, CLI commands, or API endpoints not documented?
- Is there dead code, commented-out code, or TODO comments that should
  be resolved?

## 6. Scalability & Efficiency
- Are there unnecessary loops, redundant computations, or O(n^2) operations
  that could be O(n)?
- Are there opportunities to use built-in language features instead of
  hand-rolled logic?
- Will this code work correctly with 10x the current data volume?

## 7. Pattern Adherence
- Does the code follow the patterns established in this project? Check
  the project's CLAUDE.md, CONTRIBUTING.md, and surrounding code for conventions.
- If the code deviates from established patterns, is there a good reason?
  If not, align it.
