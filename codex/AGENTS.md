# LLM Assistant Config

## Ground Rules

- Do not be a Yes-Man. Push back on bad ideas. Your priority is the health of the codebase, not agreeing with me.
- Do not guess. When unsure, seek information: official documentation first, public forums second, gut feel last.
- Do not jump to implementation. Understand the problem, constraints, and risks before writing code.
- Deviations from best practice require a good reason. If we're doing something non-standard, call it out.
- NEVER execute a destructive action without explicit confirmation. Database changes, data loss, force pushes, irreversible operations: ask first, every time.

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

- Validate at system boundaries: user input, external APIs, and file I/O. Trust internal code.
- For non-critical operations, log the error and degrade gracefully rather than crashing.
- Use standard/built-in exception types. Don't create custom exception hierarchies unless there's a clear reason.
- Never silently swallow errors. At minimum, log them.

### Testing

- New functionality gets tests. Bug fixes get a regression test.
- Unit tests are the baseline. Integration tests are marked/separated so they can be run independently.
- Mock external dependencies: APIs, databases, network services. Do not mock internal logic as a substitute for testing behavior.
- Use data-driven/parametrized tests when testing the same logic with multiple inputs.
- Group related tests by feature or class under test.
- Design for testability: push logic into pure functions. If a function mixes I/O with business logic, split it. The I/O layer fetches data; the pure function processes it.

### Implementation Discipline

- Extract pure functions first. Parsing, formatting, and transformation logic must live in testable utility modules, not inline in route handlers, components, or controllers.
- Write tests with the implementation, not after. If you can't point to a test file, the work isn't done.
- Don't ship code you wouldn't want to debug at 2am. If error handling requires a comment to explain, it's too clever.
- Don't duplicate data "just in case." If the protocol guarantees delivery, trust it.

### Verification

- Before considering work done, check if the project has lint, test, and build commands. Run them.
- If a project has CI, the code should pass locally before it's pushed.

## Git Workflow

- Branch naming: `feat/`, `fix/`, `hotfix/` prefixes with descriptive kebab-case slugs.
- Commit messages: Conventional Commits format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`. Use scope when the project is a monorepo.
- Commits should be atomic: one logical change per commit.
- Commit after every completed unit of work when the environment and user permissions allow commits. Do not wait until the end of a session or until asked.

## Context Persistence

This machine uses a `.planning/` directory pattern to preserve important context across assistant sessions. Use the planning skills in `~/.codex/skills` when this configuration is installed.

These are requirements, not suggestions:
- Load context at the start of every session when `.planning/` exists. Do not begin work without reading the branch state file, decisions, research, and lessons.
- Checkpoint proactively when a meaningful decision is made, a dead end is hit, scope is clarified, a bug root cause is found, a complex investigation concludes, or the session is wrapping up.
- Save architectural or design decisions as decision records. Do not only mention them in conversation.
- Log lessons after user corrections. Record what went wrong and the rule that prevents it recurring.
- Clean up stale planning files when branch state no longer maps to live branches.

### Branch & Worktree Behavior

- State files are per-branch: `.planning/STATE-<branch-slug>.md`.
- Branch slug is the branch name with `/` replaced by `-`.
- State files and `sessions/` are gitignored so each branch tracks its own state independently.
- `decisions/` and `research/` are tracked in git and shared across branches/worktrees on merge.
- If `.planning/` exists but no state file exists for the current branch, that branch just has not been checkpointed yet.

### When To Checkpoint Proactively

Checkpoint without waiting to be asked when any of these occur:
- An architectural or design decision was made or changed.
- A non-obvious trade-off was discussed and a direction was chosen.
- A bug root cause was identified after meaningful investigation.
- A feature's scope or requirements were clarified or narrowed.
- A dead end was hit and the work pivoted.
- A session is wrapping up with meaningful progress.
- A complex research question was resolved with a clear conclusion.

### When Not To Checkpoint

- Routine code changes that are self-evident from the diff/commit.
- Decisions already captured in code comments, commit messages, or project docs.
- Trivial fixes or formatting changes.
- Mid-task when nothing has been decided yet.

### Rules

- State files must stay under 80 lines. They are a summary, not a journal.
- Decision records in `.planning/decisions/` are the detailed record. State files just reference them.
- Decision records should be committed with the feature branch work.
- When resuming a session, resolve the current branch and read its state file before starting work.
- After compaction, re-read the branch state file to recover context.
- State files are ephemeral working memory. Anything worth keeping long-term belongs in a decision record or research file before the branch is merged.

## Tactical

- Don't prefix shell commands with `cd /path &&` when already in the project directory.
- Don't chain git commands with `&&`. Use separate tool calls instead.
- Don't use `$(cat <<'EOF')` for commit messages. Use a plain quoted string: `git commit -m "subject line"` or `git commit -m "subject" -m "body paragraph"`.
