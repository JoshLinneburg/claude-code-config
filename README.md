# LLM Assistant Config

Personal AI assistant configuration for development workflows. This repo keeps
provider-specific configs side by side instead of pretending every assistant
uses the same file layout.

## What Is Here

| Path | Purpose |
|---|---|
| `claude/` | Claude Code user config: `CLAUDE.md`, `settings.json`, and Claude skill commands |
| `codex/` | Codex user config: `AGENTS.md`, `config.toml`, rules, and Codex skills |
| `install.sh` | Installer for `~/.claude` or `~/.codex` |

The workflow is the same across providers: preserve project context in
`.planning/`, record decisions, keep lessons from corrections, review code
against a high bar, and verify changes before shipping.

## Install

Clone this repo anywhere outside the assistant config directories:

```bash
git clone git@github.com:JoshLinneburg/coding-agent-config.git ~/projects/coding-agent-config
cd ~/projects/coding-agent-config
```

Install Claude Code config:

```bash
./install.sh claude
```

Install Codex config:

```bash
./install.sh codex
```

Preview either install without changing files:

```bash
./install.sh codex --dry-run
```

By default, the installer only replaces managed files and moves existing
versions into `~/.assistant-config-backups/<target>-<timestamp>/`.

For a clean target directory:

```bash
./install.sh codex --replace
```

Use `--replace` carefully. For Codex it moves auth, logs, sessions, caches,
and system skills into the backup directory. The default install preserves
those runtime files and only replaces this repo's managed config.

## Provider Layout

### Claude Code

Claude Code reads:

- `~/.claude/CLAUDE.md`
- `~/.claude/settings.json`
- `~/.claude/skills/*/SKILL.md`

The Claude skill copies stay close to the original slash-command design and
may include Claude-specific fields such as `allowed-tools`,
`disable-model-invocation`, `argument-hint`, and `context`.

### Codex

Codex reads:

- `~/.codex/AGENTS.md`
- `~/.codex/config.toml`
- `~/.codex/rules/default.rules`
- `~/.codex/skills/*/SKILL.md`
- `~/.codex/skills/*/agents/openai.yaml`

The Codex skills are adapted for Codex conventions rather than copied
verbatim from Claude. They use Codex skill metadata, `$skill-name` invocation
language, optional `agents/openai.yaml` UI metadata, and avoid Claude-only
dynamic prompt syntax.

The installer copies Codex skill directories one at a time so existing
system-managed skills under `~/.codex/skills/.system` are preserved.

## Skills

Both providers include the same workflow concepts:

### Context Persistence

| Skill | Purpose |
|---|---|
| `init-planning` | Set up `.planning/` in a project |
| `load-context` | Resume from branch state, decisions, research, sessions, and lessons |
| `checkpoint` | Save current branch state |
| `save-decision` | Record an architectural decision |
| `log-lesson` | Record a correction as a durable rule |
| `cleanup-planning` | Review stale state files |

### Code Quality

| Skill | Purpose |
|---|---|
| `review` | Branch diff code review |
| `josh-test` | Alias for the rigorous branch review |
| `review-project` | Full codebase health check |
| `test-gap` | Test coverage analysis |
| `doc-drift` | Documentation staleness check |

### Workflow

| Skill | Purpose |
|---|---|
| `ship` | Verification and PR prep |
| `worktree` | Parallel workspace setup |
| `status-report` | Cross-branch/worktree dashboard |
| `spike` | Structured technical investigation |

## Planning Directory

`init-planning` creates this project-local structure:

```text
.planning/
  STATE-<branch-slug>.md
  decisions/
  research/
  sessions/
  lessons.md
```

State files and sessions are per-branch working memory. Decisions and
research are tracked in git so they move with the code. Lessons are
project-specific rules learned from corrections.

## Maintenance Notes

- Keep provider-specific behavior in provider-specific directories.
- Do not add runtime files, credentials, sessions, logs, caches, or local
  trust entries to this repo.
- When updating a Claude skill, decide whether the Codex skill needs a
  provider-native adaptation rather than a direct copy.
- Validate Codex skill frontmatter with the local Codex skill validator when
  possible:

```bash
uv run --with pyyaml python ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py codex/skills/review
```
