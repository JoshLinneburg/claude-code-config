---
name: review-project
description: >
  Full project health check. Unlike /review (which diffs against main),
  this evaluates the entire codebase or a specific module for code quality,
  consistency, and adherence to project standards. Use for periodic health
  checks, onboarding onto an unfamiliar codebase, or after major refactors.
argument-hint: [optional module or directory to focus on]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(git *), Bash(find *), Bash(wc *), Read, Write, Edit, Glob, Grep, Bash(uv run *), Bash(pnpm *), Bash(npm run *), Agent
---

# Project Review

Perform a thorough health check of the entire project (or a specific
module). This is a broader evaluation than `/review`, which only looks
at branch changes.

## Scoping

1. If `$ARGUMENTS` specifies a module or directory, scope the review to
   that area only.

2. If no arguments, map the project structure first:
   - List top-level directories and identify source directories vs. config
   - Count lines per directory to understand relative size
   - Read the project's CLAUDE.md, CONTRIBUTING.md, and README for conventions and structure
   - Identify the primary language(s) and frameworks in use

3. For projects with multiple modules (monorepos), review one module at a
   time using subagents to keep context clean. Do NOT try to read the
   entire codebase into a single context.

## Review Strategy

### Phase 1: Architecture & Structure
Evaluate before reading individual files:
- Is the project structure clear and navigable?
- Are responsibilities well-separated (e.g., data access, business logic,
  presentation)?
- Are there circular dependencies or tangled imports?
- Does the directory structure match the project's CLAUDE.md and CONTRIBUTING.md descriptions?

### Phase 2: Module-by-Module Review

For each module or major directory, launch a subagent. Independent modules
should be reviewed in **parallel** (e.g., `packages/backend` and
`packages/web` can be reviewed simultaneously).

Each module subagent evaluates:
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

Each subagent returns a list of findings (file, line, severity, issue,
suggested fix). Subagents do NOT apply fixes — they report only.

### Phase 3: Cross-Cutting Concerns

After module reviews complete, launch **4 parallel agents** for
cross-cutting analysis. Each agent receives the module findings and
project context.

#### Agent A: Dependency Health
- Are dependencies up to date? Any known vulnerabilities?
- Any unused dependencies (declared but not imported)?
- Are there duplicate dependencies at different versions?
- Check for deprecated packages or packages with known CVEs

#### Agent B: Test Coverage Gaps
- Are there entire modules or features with no tests?
- Are integration tests properly separated from unit tests?
- Are test utilities and fixtures well-organized or duplicated?
- Do test files follow consistent naming and structure?

#### Agent C: Pattern Consistency
- Does module A handle errors differently from module B without a
  good reason?
- Are naming conventions consistent across modules?
- Are configuration patterns (env vars, settings objects) consistent?
- Is there duplicated logic across modules that should be shared?

#### Agent D: Documentation Drift
- Do README, CLAUDE.md, and CONTRIBUTING.md still match the code?
- Are there dead file paths, outdated commands, or missing docs for
  new features?
- Use the same checks as `/doc-drift` (dead references, outdated
  instructions, missing documentation, cross-doc inconsistencies)
- Are there new env vars, CLI commands, or scripts not documented?

Each agent returns findings in the same format. Agents do NOT apply
fixes — they report only.

## Aggregation & Fixes

After all agents return:

### 1. Compile findings
Merge results from Phase 2 module agents and Phase 3 cross-cutting
agents into a single report. Deduplicate findings that multiple agents
flagged from different angles.

### 2. Report
For each finding:
1. **Location** — file and line number
2. **Severity** — critical (breaks things), moderate (code smell),
   minor (style/consistency)
3. **What's wrong** — one sentence
4. **Fix** — either fix it directly or describe what needs to change

### 3. Apply fixes
- Fix all critical and moderate issues directly, sequentially
- List minor issues for the user to decide on

### 4. Verify
- Run lint and tests after all fixes
- Provide a summary: overall health assessment, top 3 areas needing
  attention, and what was fixed

## Important

This review can be expensive on large projects. Prefer scoping to a
specific module when the user knows where to look. Use subagents for
parallel review of independent modules. Do not read every file in a
1000-file project into a single context — that defeats the purpose.
