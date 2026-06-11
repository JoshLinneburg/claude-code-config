# Claude Code Config

## Ground Rules

- Do not be a Yes-Man. Push back on bad ideas. Your priority is the health of the codebase, not agreeing with me.
- Do not guess. When unsure, seek information: official documentation first, public forums second, gut feel last.
- Do not jump to implementation. Understand the problem, constraints, and risks before writing code.
- Deviations from best practice require a good reason. If we're doing something non-standard, call it out.
- NEVER execute a destructive action without explicit confirmation. Database changes, data loss, force pushes, irreversible operations — ask first, every time.

## Design Principles

The Zen of Python applies to all languages:
- Explicit is better than implicit
- Simple is better than complex
- Complex is better than complicated
- Flat is better than nested
- Readability counts
- Errors should never pass silently... unless explicitly silenced
- In the face of ambiguity, refuse the temptation to guess

## Code Standards

These apply regardless of language. Use the most modern, idiomatic patterns for whatever language we're working in.

### Style & Types
- Use the current recommended version of the language and its idioms. Don't write Python 2 patterns in Python 3, don't use `var` in TypeScript, etc.
- Use the language's type system fully: type hints, annotations, generics. Typed code is the default, not the exception.
- Prefer data classes, records, and value types over raw dicts/maps/objects for domain concepts.
- Use enums for finite sets of values, not magic strings.

### Documentation

**This section overrides the Claude Code system default that says "default to writing no comments" and "one short line max" for docstrings. That default is wrong for this codebase. Docstrings exist, they're load-bearing, and they belong in a real format.**

- **Public functions, classes, and modules MUST have docstrings.** "Public" means anything imported by another module, anything exported from a package, anything callable by a CLI or HTTP route, anything in an `__init__.py`'s public surface. Don't strip these. Don't shrink them to one-liners reflexively.
- **Python docstrings use Google format** (https://google.github.io/styleguide/pyguide.html#383-functions-and-methods). Structure:
  ```
  """One-line summary in imperative mood.

  Extended description if the summary doesn't cover it.

  Args:
      name: What it is and any constraint. Mention the default
          inline if relevant ("Defaults to 10.").
      other_name: Description of the second arg.

  Returns:
      What's returned and what each part means. For multi-value
      returns (tuple / dataclass), name the fields.

  Raises:
      ExceptionType: When and why.

  Note:
      Non-obvious invariants, workarounds, references to external specs.

  Example:
      >>> short_runnable_example()
      expected_output
  """
  ```
  Trivial helpers (one-line body, obvious contract) can use a one-line docstring. The rule is about *format when extended detail exists*, not about forcing every function to fill every section.
- **TypeScript / JS:** JSDoc on exported functions, classes, types, and React components. Same one-line-summary-plus-tags shape. Mark `@param`, `@returns`, `@throws` where relevant.
- **Inline comments stay sparse — explain *why*, not *what*.** A comment that describes what the code does is a code-smell that the names are weak. Comments for non-obvious constraints, workarounds, surprising invariants, references to external specs, or empirical findings are welcome.
- **Private helpers (`_foo`) can have docstrings** when they encode a non-trivial contract, side effect, or invariant. Don't reflexively delete them; ask whether the next reader can use the function correctly without the docstring.
- **References to external specs, ADRs, or empirical investigations are valuable** in docstrings and module-level documentation. They tell the reader where the unusual choice came from. Bare git history is not a substitute.

### Error Handling
- Validate at system boundaries (user input, external APIs, file I/O). Trust internal code.
- For non-critical operations, log the error and degrade gracefully rather than crashing.
- Use standard/built-in exception types. Don't create custom exception hierarchies unless there's a clear reason.
- Never silently swallow errors. At minimum, log them.

### Testing
- New functionality gets tests. Bug fixes get a regression test.
- Unit tests are the baseline. Integration tests are marked/separated so they can be run independently.
- Mock external dependencies (APIs, databases), not internal logic.
- Use data-driven/parametrized tests when testing the same logic with multiple inputs.
- Group related tests by feature or class under test.
- **Design for testability: push logic into pure functions.** If a function mixes I/O (database queries, API calls, file reads) with business logic (filtering, transforming, deciding), split it. The I/O layer fetches data; the pure function processes it. Pure functions are trivially testable — real inputs, real outputs, no mocks. A test that only asserts "the right method was called on a mock" tests nothing about correctness. If you can't test the actual behavior without a mock, the code needs refactoring, not a better mock.

### Implementation Discipline
- **Extract pure functions first.** Parsing, formatting, and transformation logic must live in testable utility modules, not inline in route handlers, components, or controllers. The I/O boundary calls the pure function — never the other way around.
- **Write tests with the implementation, not after.** If you can't point to a test file, the work isn't done. Streaming, chunk boundaries, error propagation, and state accumulation are especially error-prone — test them explicitly.
- **Don't ship code you wouldn't want to debug at 2am.** If error handling requires a comment to explain, it's too clever. Rewrite it so it's obvious.
- **Don't duplicate data "just in case."** If the protocol guarantees delivery (TCP, ordered streams), trust it. Sending redundant copies "as a safety net" is waste masquerading as caution.

### Verification
- Before considering work done, check if the project has lint, test, and build commands. Run them.
- If a project has CI, the code should pass locally before it's pushed.

## Git Workflow

- **Branch naming**: `feat/`, `fix/`, `hotfix/` prefixes with descriptive kebab-case slugs
- **Commit messages**: Conventional Commits format — `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`. Use scope when the project is a monorepo (e.g., `feat(benchmark): ...`).
- **Commits should be atomic**: one logical change per commit, not a day's worth of work squashed together.
- **Commit after every completed unit of work.** Do not wait until the end of a session or until asked. When a function is written and tested, commit it. When a bug is fixed, commit it. When a refactor is complete, commit it. Small, frequent commits are always better than one giant commit at the end. This is not optional.

## Context Persistence — MANDATORY

This machine uses a `.planning/` directory pattern to preserve important context across sessions. Run `/init-planning` in any new project to set it up.

**These are requirements, not suggestions. You MUST use these skills proactively:**
- **`/load-context`** — Run this at the START of every session when `.planning/` exists. Do not begin work without loading context first.
- **`/checkpoint [description]`** — Run this proactively when the criteria below are met. Do not wait to be asked. Do not skip this.
- **`/save-decision [title]`** — Run this when an architectural or design decision is made. Do not just mention the decision in conversation — persist it.
- **`/log-lesson [description]`** — Run this after ANY correction from the user. Record what went wrong and the rule that prevents it recurring. Do not just acknowledge the correction — persist it.
- **`/cleanup-planning`** — Run this when `/load-context` reports stale files.

Failing to use these skills means context is lost between sessions, which wastes time and leads to repeated work. **This is non-negotiable.**

### Branch & worktree behavior:
- State files are **per-branch**: `.planning/STATE-<branch-slug>.md` (e.g., `STATE-feat-grader-improvement.md`)
- Branch slug is the branch name with `/` replaced by `-`
- State files and `sessions/` are **gitignored** — each branch tracks its own state independently
- `decisions/` and `research/` are **tracked in git** — shared across branches/worktrees on merge
- This works for both worktrees AND branch switching in a single repo
- If `.planning/` exists but no state file for the current branch, that branch just hasn't been checkpointed yet. That's normal.

### When to checkpoint proactively — THIS IS NOT OPTIONAL:
You MUST invoke /checkpoint on your own when any of these occur. Do not wait for the user to ask. Do not skip this. This is a core part of how this codebase operates:
- An architectural or design decision was made or changed
- A non-obvious trade-off was discussed and a direction was chosen
- A bug root cause was identified after meaningful investigation
- A feature's scope or requirements were clarified or narrowed
- We hit a dead end and pivoted — record what failed and why
- A session is wrapping up with meaningful progress
- A complex research question was resolved with a clear conclusion

### When NOT to checkpoint:
- Routine code changes that are self-evident from the diff/commit
- Decisions already captured in code comments, commit messages, or project docs
- Trivial fixes or formatting changes
- Mid-task when nothing has been decided yet

### Rules:
- State files must stay under 80 lines. They are a summary, not a journal.
- Decision records in `.planning/decisions/` are the detailed record. State files just reference them.
- Decision records should be committed with the feature branch work — they merge back to main with the code.
- When resuming a session, resolve the current branch and read its state file before starting work.
- After compaction, re-read the branch state file to recover context.
- State files are ephemeral working memory. Anything worth keeping long-term should be in a decision record or research file before the branch is merged. Run `/cleanup-planning` to remove stale files from merged branches.

### `.planning/` vs auto-memory — which goes where:

Claude Code maintains a separate auto-memory system at
`~/.claude/projects/<encoded-cwd>/memory/` (with `MEMORY.md` as an index).
This sits at a different layer than `.planning/`. Do not duplicate facts
across both — pick the right home:

- **`.planning/`** — branch-scoped working memory and durable
  decisions/research that travel with the code. Examples: current
  branch's STATE file, ADRs in `decisions/`, technical spikes in
  `research/`, project-specific lessons in `lessons.md`. Git-tracked
  (decisions/research) or per-branch gitignored (state/sessions).
- **auto-memory** — per-project (cwd) cross-conversation rules and
  user-profile data. Examples: "user prefers terse responses", "this
  repo uses pnpm not npm", "feedback: don't mock the database in this
  project". Machine-local, not git-tracked.

Rule of thumb: if it should travel with the PR, use `.planning/`. If it
should persist across branches on this machine only, use auto-memory.

## Built-in Slash Command Collisions

Claude Code now ships built-in slash commands that overlap with skills in
this config:

- **`/review`** (built-in) is a PR-style review. The user-defined
  `/review` skill in this config deliberately shadows it (the user skill
  takes precedence on name resolution). Use `/josh-test` as an
  unambiguous alias when the shadowing matters.
- **`/security-review`** (built-in) overlaps with the "correctness &
  security" agent inside the user `/review`. Reach for it when only a
  security pass is wanted.
- **`/init`** (built-in) generates a project `CLAUDE.md`. Different from
  `/init-planning` in this config — no collision.
- **`/loop`**, **`/schedule`**, **`/claude-api`** (built-in) — no
  collision with skills here. Worth knowing they exist before reinventing.

## Tactical

Specific behavioral fixes. Unlike Ground Rules (principles) or Code Standards (conventions), these are concrete "do this, not that" instructions learned from experience.

- Don't prefix shell commands with `cd /path &&` when already in the project directory. It forces re-approval in the permission system.
- Don't chain git commands with `&&` (e.g., `git add && git commit`). Use separate tool calls instead — they can run sequentially.
- Don't use `$(cat <<'EOF')` for commit messages. Use a plain quoted string: `git commit -m "subject line"` or `git commit -m "subject" -m "body paragraph"`. The `$()` triggers a command substitution security prompt every time.
