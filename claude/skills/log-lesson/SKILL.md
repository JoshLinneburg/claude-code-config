---
name: log-lesson
description: >
  Record a lesson learned after a user correction. Write a concise,
  actionable rule to .planning/lessons.md that prevents the same mistake
  from recurring. Invoke this immediately after any correction — do not
  wait to be asked.
argument-hint: [what went wrong and the rule to follow]
disable-model-invocation: false
user-invocable: true
allowed-tools: Write, Read, Glob, Bash(date *)
---

# Log Lesson

Record a lesson learned so the same mistake is not repeated.

## Where lessons live

- If `.planning/` exists in the current project, write to
  `.planning/lessons.md` (project-specific lessons, gitignored).
- If `.planning/` does not exist, tell the user and suggest they run
  `/init-planning`. Do not create a lessons file outside `.planning/`.

## Steps

1. Read `.planning/lessons.md` if it exists — check for duplicates.
   Do not log the same lesson twice. If a similar lesson already exists,
   either skip it or strengthen the existing wording.

2. Append the new lesson to `.planning/lessons.md`. Each entry must be:
   - **One line** — a concrete, actionable rule, not a story
   - **Dated** — `[YYYY-MM-DD]` prefix
   - **Specific** — "always run `uv run pytest` before committing" not
     "remember to test"

   Format:
   ```
   - [2026-03-03] Always run tests before committing in this project.
   - [2026-03-03] Use `@pytest.mark.integration` for tests that need DB access.
   - [2026-03-03] Do not modify migration files that have already been applied.
   ```

3. If the file doesn't exist yet, create it with a header:
   ```markdown
   # Lessons Learned

   Rules derived from corrections during development. Reviewed at session
   start by /load-context. Do not repeat these mistakes.

   ```
   Then append the lesson.

4. Briefly confirm to the user what was logged. One sentence, not a paragraph.

**Lesson to log:** $ARGUMENTS
