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

### Verification
- Before considering work done, check if the project has lint, test, and build commands. Run them.
- If a project has CI, the code should pass locally before it's pushed.

## Git Workflow

- **Branch naming**: `feat/`, `fix/`, `hotfix/` prefixes with descriptive kebab-case slugs
- **Commit messages**: Conventional Commits format — `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`. Use scope when the project is a monorepo (e.g., `feat(benchmark): ...`).
- **Commits should be atomic**: one logical change per commit, not a day's worth of work squashed together.

## Context Persistence

This machine uses a `.planning/` directory pattern to preserve important context across sessions. Run `/init-planning` in any new project to set it up.

### Branch & worktree behavior:
- State files are **per-branch**: `.planning/STATE-<branch-slug>.md` (e.g., `STATE-feat-grader-improvement.md`)
- Branch slug is the branch name with `/` replaced by `-`
- State files and `sessions/` are **gitignored** — each branch tracks its own state independently
- `decisions/` and `research/` are **tracked in git** — shared across branches/worktrees on merge
- This works for both worktrees AND branch switching in a single repo
- If `.planning/` exists but no state file for the current branch, that branch just hasn't been checkpointed yet. That's normal.

### When to checkpoint proactively (don't wait to be asked):
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
