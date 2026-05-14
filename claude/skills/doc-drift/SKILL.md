---
name: doc-drift
description: >
  Detect stale documentation. Compares README, CLAUDE.md, CONTRIBUTING.md,
  and other docs against actual code to find outdated instructions, missing
  docs for new features, dead references, and inconsistencies. Run
  periodically or before shipping.
argument-hint: [optional file or directory to scope]
disable-model-invocation: false
user-invocable: true
context: fork
allowed-tools: Bash(git *), Read, Write, Edit, Glob, Grep, Agent
---

# Doc Drift

Find documentation that no longer matches the code it describes.

## Scoping

1. If `$ARGUMENTS` specifies a file or directory, scope the check to
   docs relevant to that area only.

2. If no arguments, check all documentation in the project.

## Phase 1: Inventory

### 1a. Find all documentation files
Glob for:
- `README.md`, `README.*` (any level)
- `CLAUDE.md` (any level — monorepos often have per-package copies)
- `CONTRIBUTING.md`
- `docs/**/*.md`
- `*.md` in the project root
- Inline doc comments in config files (`pyproject.toml`, `package.json`)

List what was found so the user knows the scope.

### 1b. Read project structure
Run `git ls-files` to get the current tracked file list. This is the
source of truth for "what exists in the project."

## Phase 2: Check Each Document

For each documentation file, read it and check for the following issues.
Use subagents for independent documents to parallelize.

### 2a. Dead references
- **File paths** mentioned in docs that don't exist in the repo
  (e.g., "see `src/utils/helpers.py`" when that file was renamed or deleted)
- **Commands** that reference scripts, binaries, or npm scripts that
  don't exist (e.g., "run `npm run dev`" when the script is `pnpm dev`)
- **URLs** that point to internal project paths or anchors that moved
- **Environment variables** documented but not referenced in any code,
  or referenced in code but not documented
- **Import paths** or module names that changed

### 2b. Outdated instructions
- **Setup steps** that reference old tools or versions
  (e.g., "install with pip" when the project uses uv)
- **Configuration** that describes settings or files that no longer exist
- **Architecture descriptions** that don't match the current directory
  structure (e.g., docs say "the API lives in `functions/`" but it
  moved to `packages/backend/`)
- **API endpoints** or CLI commands documented with wrong signatures,
  flags, or behavior

### 2c. Missing documentation
- **New directories or packages** that have no README
- **Public functions, classes, or endpoints** added since the last doc
  update that aren't documented anywhere
- **New environment variables** required by code but not listed in docs
- **New CLI commands or scripts** not mentioned in any README
- **Changed behavior** — if `git log` shows recent changes to a module
  but its docs haven't been touched, flag it as potentially stale

### 2d. Inconsistencies across docs
- **Conflicting instructions** between README and CONTRIBUTING.md
  (e.g., one says `npm test`, the other says `pnpm test`)
- **CLAUDE.md vs reality** — project-specific CLAUDE.md files that
  describe patterns the code no longer follows
- **Duplicated instructions** that have diverged (same setup steps
  in two places but one was updated and the other wasn't)

## Phase 3: Report

For each finding:
1. **Location** — file path and line number
2. **Severity**:
   - **High** — Will actively mislead someone (wrong commands, dead
     paths, incorrect architecture description)
   - **Medium** — Missing docs for new features, undocumented env vars
   - **Low** — Minor inconsistencies, slightly outdated version numbers
3. **What's wrong** — one sentence
4. **Fix** — what the doc should say instead

## Phase 4: Fix

Fix all High and Medium severity issues directly. Edit the documentation
files. For each fix:
- Change only what's wrong — don't rewrite sections that are fine
- Match the existing tone and style of the document
- If a section needs substantial rewriting (more than a few lines),
  flag it for the user rather than guessing at intent

After fixing:
- Run `git diff` to show what changed
- List any Low severity issues left for the user to decide on

## Important

- This is a documentation-focused skill. Do NOT modify source code.
  If the code is wrong and the docs are right, flag it as a bug rather
  than "fixing" the docs to match broken code.
- Don't flag version numbers in lockfiles or generated files.
- Don't flag docs in `node_modules/`, `.venv/`, or other dependency
  directories.
- For monorepos, check that per-package docs are consistent with the
  root-level docs but don't require them to be identical.
- If a project has no documentation at all, say so and suggest starting
  points rather than generating a full set of docs from scratch.
