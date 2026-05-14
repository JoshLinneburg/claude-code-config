---
name: review
description: >
  Critical code review of the current branch's changes. Run after completing
  a significant chunk of work. Maps the blast radius of each change
  (consumer files outside the diff) before analysis, then spawns 6 parallel
  analysis agents (correctness & security, code quality, test quality,
  production readiness, documentation & maintenance, architecture &
  responsibility boundaries) over the diff plus its consumers, then
  aggregates findings and applies fixes. Designed to be run 2-3 times
  iteratively.
argument-hint: [optional focus area]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(git *), Read, Write, Edit, Glob, Grep, Bash(uv run *), Bash(pnpm *), Bash(npm run *), Agent
---

# Code Review

Perform a thorough, critical review of the changes on this branch. This is
not a feel-good exercise. Code that doesn't meet the bar gets fixed.

## Pre-loaded Diff Context

**Changed files:**
!`git diff main --name-only 2>/dev/null || git diff master --name-only 2>/dev/null || echo "(could not diff against main or master)"`

**Diff stats:**
!`git diff main --stat 2>/dev/null || git diff master --stat 2>/dev/null || echo ""`

**Recent commits:**
!`git log --oneline -10 2>/dev/null`

## Setup

1. Review the pre-loaded diff context above to understand the scope.
   If the diff failed (no main/master branch), ask the user what base
   branch to use, or use `git diff HEAD~N --name-only` for recent commits.

2. Read the project's CLAUDE.md and CONTRIBUTING.md if they exist — they
   define project-specific patterns and conventions that this review must
   respect.

3. If `$ARGUMENTS` was provided, use it to focus the review (e.g.,
   "review tests only", "review the extraction module").

4. Get the full diff: `git diff main` (or `master`, matching whichever
   base the pre-loaded context found). The agents need the full diff.

## Blast Radius Mapping

The diff is the **starting point** of the review, not its boundary. Code
that changed in the diff often affects code that didn't — callers,
importers, downstream consumers, dependent docs, migrations, configs.
A signature change that compiles is not necessarily a signature change
that works. A schema change with no migration is a runtime bomb. A
constant whose semantic meaning changed silently can be wrong at every
call site.

Map the blast radius **before** branching into agent or criteria
analysis. The output of this phase is a **Consumer Files** list that is
passed into every agent (or threaded through the sequential pass) so
the review scope is the diff *plus* its consumers.

### Step 1: Identify the exported surface that changed

For each modified file in the diff, list everything it exports or
declares that crosses a file boundary:
- Functions, classes, methods, type aliases, interfaces, enums
- Constants, configuration keys, environment variables
- React/Vue components, hooks, composables
- Route handlers, API endpoints, RPC methods
- Database schema (tables, columns, indexes, migrations)
- GraphQL/protobuf types, OpenAPI schemas
- Public error/exception classes
- CLI commands, scripts, package entry points

Ignore symbols that are private to the file (no leading underscore for
internal-only items if the language uses that convention, no `export`
keyword in TS/JS, no `__all__` entry in Python public surface, etc.).

### Step 2: Classify each change

For each symbol identified above, decide whether the change in the diff
is **behavior-affecting** or **internal-only**:

- **Behavior-affecting** (consumers MUST be reviewed):
  - Signature changed: params added, removed, reordered, or retyped;
    return type changed
  - Return shape changed (same type signature, different fields/keys/
    structure inside)
  - Semantics changed: same name, different meaning or contract (e.g.,
    a "retry count" that used to mean total attempts now means
    additional attempts)
  - Error behavior changed: new exception raised, exception type
    changed, previously-silent failure now raises, vice versa
  - Side effects changed: function used to write to DB and now
    doesn't, or vice versa
  - Constant value with semantic meaning changed (timeouts, limits,
    keys, version strings, env var names)
  - Symbol renamed, removed, or moved to a different module
  - Visibility narrowed (public → private) or widened
  - Schema migrations: column added/removed/renamed/retyped; required
    fields changed
  - Required environment variable added or renamed

- **Internal-only** (consumers do NOT need review):
  - Body rewrite that preserves signature, return shape, semantics,
    side effects, and error behavior
  - Local variable renames
  - Comment, docstring, and formatting edits
  - Dead-code removal inside a function
  - Test-only changes

If you cannot confidently classify a change as internal-only, treat it
as behavior-affecting.

### Step 3: Find consumers of each behavior-affecting change

For each behavior-affecting symbol, use **Grep** and **Glob** to find
every file that imports or references it. Build a deduplicated
**Consumer Files** list.

- Exclude tests of the symbol's own module — Agent 3 (Test Quality)
  already covers those.
- **Include** tests of consumer modules — they may exercise the
  integration that just broke.
- Include READMEs, docs, and CLAUDE.md/CONTRIBUTING.md if they
  mention the symbol by name (Agent 5 will verify the docs).
- For schema/migration changes, include any code that reads from or
  writes to the affected table/column.
- For environment variables, include deployment configs, `.env.example`,
  CI files, and docs.

### Step 4: Cap the depth

Reading every consumer of a heavily-used symbol is impractical. Apply
these caps:

- If a symbol has more than ~10 consumers, sample representatively:
  one from each top-level directory, plus one for each distinct call
  pattern you can identify from the grep results. Report the total
  count alongside the sample.
- If the total Consumer Files list exceeds ~30 files, summarize the
  distribution by top-level directory and stop expanding. The agents
  will work on the sampled set.

### Step 5: Produce the Consumer Files list

The Consumer Files list is structured as:

```
Symbol: <name> (file:line in diff)
  Change type: signature | semantics | return-shape | error | schema | rename | other
  Consumer count: <N total, M sampled>
  Consumers reviewed:
    - path/to/consumer1.ts
    - path/to/consumer2.py
    ...
```

If the diff contains only internal-only changes, doc-only changes, or
test-only changes, skip blast-radius mapping and proceed directly to
analysis. State explicitly that no consumer review is needed and why.

## Iteration Awareness

Check the pre-loaded recent commits for review-fix patterns:
- Look for commits with `fix:`, `refactor:`, or `style:` messages
  (especially commits made in the last few minutes)
- If found, note which files were touched by those fix commits
- During analysis, give extra scrutiny to those files — verify the fixes
  are correct and didn't introduce new issues
- This avoids treating every run as a blank slate when the skill is
  designed to be run 2-3 times iteratively

## Analysis Strategy

**If the diff touches fewer than 3 files**, read
`${CLAUDE_SKILL_DIR}/criteria.md` for the 11 review criteria and evaluate
all of them in a single sequential pass. The Consumer Files list from
Blast Radius Mapping is in-scope for every criterion.

**If the diff touches 3 or more files**, read
`${CLAUDE_SKILL_DIR}/agents.md` for the 6 parallel agent prompts. Spawn
them in parallel — each agent receives the changed files, the full diff,
project conventions, **and the Consumer Files list from Blast Radius
Mapping**. Each agent's review scope is the diff *plus* the consumer
files. Each performs a **read-only** analysis and returns a list of
findings.

## Aggregation & Fixes

After all agents return (or after the sequential pass):

### 1. Deduplicate
Multiple agents may flag the same issue from different angles. Merge
duplicates, keeping the most specific description and the highest
severity.

### 2. Sort by severity
Order: critical first, then moderate, then minor.

### 3. Apply fixes
For critical and moderate findings:
1. State what's wrong and why it matters (one sentence)
2. Fix it — edit the file

For minor findings:
1. List them with file, line, and a one-sentence description
2. Do NOT auto-fix — present them for the user to decide on

### 4. Verify
After all fixes are applied:
1. Run the project's lint command if it exists
2. Run the project's test suite if it exists
3. Report a summary: what was found, what was fixed, what passed

If the review finds nothing substantive, say so. Do not manufacture
issues to look thorough.

## Re-running

This review is designed to be run 2-3 times iteratively. Each pass may
surface issues that were masked by the previous round's fixes. If you
fixed anything, tell the user they should consider running `/review` again.
