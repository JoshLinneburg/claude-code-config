---
name: worktree
description: >
  Spin up a new git worktree for parallel development. Creates the worktree
  in the project's -worktrees/ sibling directory, installs dependencies,
  copies environment files, and optionally checkpoints the current branch
  before switching context.
argument-hint: <branch-name> [--from <base-branch>]
disable-model-invocation: false
user-invocable: true
allowed-tools: Bash(git *), Bash(uv *), Bash(pnpm *), Bash(npm *), Bash(cp *), Bash(ln *), Bash(ls *), Bash(mkdir *), Read, Glob, Grep, Skill
---

# Worktree

Create a new git worktree for parallel development work.

## Arguments

- `$ARGUMENTS` should contain the branch name (e.g., `feat/my-feature`)
- If `--from <base>` is provided, create the branch from that base
  (default: current HEAD of `main` or `master`)

If no arguments are provided, ask the user what branch to create.

## Phase 1: Pre-flight

### 1a. Resolve project layout
Determine the project root (`git rev-parse --show-toplevel`).
Determine the project name (basename of the root directory).

### 1b. Find or create the worktrees directory
The convention is a sibling directory named `<project>-worktrees/`.
For example, if the project is at `~/projects/wembly`, worktrees go in
`~/projects/wembly-worktrees/`.

Check if it exists. If not, create it with `mkdir -p`.

### 1c. Checkpoint current work
If `.planning/` exists in the current worktree, run a quick checkpoint
to save state before context-switching. Use the Skill tool to invoke
`/checkpoint` with description "Pre-worktree checkpoint before creating
<branch-name>".

### 1d. Check branch state
- If the branch already exists locally, verify it doesn't already have
  a worktree. If it does, tell the user and give them the path.
- If the branch doesn't exist, it will be created from the base branch.

## Phase 2: Create Worktree

### 2a. Create the worktree
Derive a directory name from the branch: replace `/` with `-`, drop
common prefixes if the name is very long.

```
git worktree add <worktrees-dir>/<dir-name> -b <branch-name> <base>
```

If the branch already exists (no `-b`):
```
git worktree add <worktrees-dir>/<dir-name> <branch-name>
```

### 2b. Verify
Confirm the worktree was created by running `git worktree list`.

## Phase 3: Environment Setup

Run these steps inside the new worktree directory.

### 3a. Detect and install dependencies
Look for dependency files and install accordingly:

| File | Command |
|------|---------|
| `uv.lock` or `pyproject.toml` (with `[tool.uv]`) | `uv sync` |
| `pnpm-lock.yaml` | `pnpm install` |
| `package-lock.json` | `npm install` |
| `yarn.lock` | `yarn install` |

For monorepos, run the root-level install (which typically handles all
packages).

### 3b. Copy environment files
Find `.env*` files in the original project root that are gitignored.
Common patterns: `.env`, `.env.local`, `.env.development`.

For each one found in the source but not in the new worktree:
- **Symlink** if possible (`ln -s`), so changes propagate automatically
- Fall back to copy if symlinks aren't practical

Also check for `.env*` files in subdirectories (e.g.,
`packages/backend/.env`, `packages/web/.env.local`). Handle these too.

Report what was linked/copied so the user can verify.

### 3c. Handle encrypted env files
If the project uses encrypted env files (`.env.*.gpg`), note that the
user may need to run the decrypt script manually. Don't attempt
decryption automatically.

## Phase 4: Report

Output a summary:
- Worktree path
- Branch name and base
- Dependencies installed (which package managers ran)
- Env files linked/copied
- Suggested next step: `cd <worktree-path>`

## Important

- Never delete existing worktrees. This skill only creates.
- If the worktrees directory convention doesn't fit (e.g., the project
  isn't in a standard location), ask the user where to put it.
- If dependency installation fails, report the error but don't block —
  the worktree itself is still usable.
- Do NOT run `git worktree add` inside an existing worktree's path.
  Always run it from the main repo.
