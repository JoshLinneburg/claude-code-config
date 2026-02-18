---
name: save-decision
description: >
  Record an architectural or design decision as an ADR in .planning/decisions/.
  Use when a meaningful technical choice has been made — architecture, library
  selection, schema design, trade-off resolution, etc. Do not use for trivial
  implementation details. Decision records are tracked in git and shared
  across branches on merge.
argument-hint: [decision title]
disable-model-invocation: false
user-invocable: true
allowed-tools: Write, Read, Glob, Bash(date *), Bash(git *)
---

# Save Decision

Record an architectural decision record (ADR). Decision records are tracked
in git (not gitignored), so they will propagate to other branches when
merged. This is intentional — decisions are project-wide.

## Steps

1. Check that `.planning/decisions/` exists. If not, tell the user to run
   `/init-planning` first and stop here.

2. Generate a filename: `.planning/decisions/[YYYY-MM-DD]-[slug].md`
   where `[slug]` is a lowercase-hyphenated version of the decision title.

3. Write the decision record:

   ```markdown
   # [Decision Title]

   **Date:** [YYYY-MM-DD]
   **Status:** Accepted

   ## Context
   [What prompted this decision? What problem were we solving?
    Reference specific files, issues, or conversations if relevant.]

   ## Options Considered
   1. **[Option A]** — [brief description]
      - Pros: [...]
      - Cons: [...]
   2. **[Option B]** — [brief description]
      - Pros: [...]
      - Cons: [...]
   [Add more options as needed]

   ## Decision
   [What we chose and the reasoning behind it.]

   ## Consequences
   [What follows from this decision — what changes, what constraints
    does it introduce, what does it enable?]
   ```

4. Resolve the current branch and its state file path:
   - Get branch: `git rev-parse --abbrev-ref HEAD`
   - Slug: replace `/` with `-`
   - State file: `.planning/STATE-<slug>.md`

5. Update the branch state file if it exists — add or update the
   "Key Decisions in Effect" section to reference this new decision.
   Keep it concise. If the state file doesn't exist (branch not yet
   checkpointed), that's fine — the decision record stands on its own.

6. Confirm to the user what was saved and where. Remind them that
   decision records are tracked in git and should be committed with
   their feature branch work.

**Decision title:** $ARGUMENTS
