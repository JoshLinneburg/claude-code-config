---
name: ship-issue
description: End-to-end issue pipeline — analyze the problem (via the analyze-issue workflow for non-trivial work), create the GitHub issue if missing, dispatch a worktree-isolated implementation agent, review with josh-test per a scope-tiered rubric, push, open a PR, and watch checks to green. Use when asked to "ship", "knock out", or fully handle one or more issues/problems end-to-end, including batches.
---

# Ship Issue

Pipeline for taking a problem from "described" to "open PR with green checks". You (the main session) are the dispatcher: you do recon, write the brief, and supervise. Implementation happens in an isolated worktree agent. PRs are always left open for the user — never merge.

## Step 0 — Triage

Classify before anything else. Escalate a tier when in doubt.

| Tier | Signals | Analysis | Worker model | josh-test passes |
|------|---------|----------|--------------|------------------|
| trivial | one-liner, docs-only, file-an-issue-from-a-draft | inline recon by dispatcher | haiku or sonnet | 0 (self-review) |
| small | single concern, few files, fix already known | inline recon: verify facts at file:line | sonnet | 1 |
| standard | multi-file, behavior change, or root cause unclear | `analyze-issue` workflow | per brief (default opus) | 1–2 |
| large | schema / CI / release-pipeline / cross-component | `analyze-issue` workflow; read the dissent log | opus | 2–3 |

Review passes stop early when a pass returns only nits. Running extra passes on a tiny diff is waste, not rigor.

## Step 1 — Analyze

- **standard / large:** invoke `Workflow({name: "analyze-issue", args: {problem: "...", context: "<verified facts you already have>", issue: <number if one exists>}})`. The result contains `brief` (approach, scope, acceptance, guardrails, workerModel, reviewTier) and `dissent`. Sustained objections and `openQuestions` are YOUR decisions — resolve them (or surface them to the user) before dispatching; never forward an unresolved blocking objection to the worker.
- **trivial / small:** build the brief yourself: verified facts with file:line evidence, constraints from the project's CLAUDE.md and `.planning/lessons.md`, exact verification commands, explicit out-of-scope list.

The brief is the contract. A vague brief is the #1 cause of agent underperformance — facts must be *verified*, not assumed.

## Step 2 — Issue first

Every shipped change traces to an issue. If none exists, create it before any code: `gh issue create --repo <owner>/<repo>` (ALWAYS explicit `--repo` on mutating gh calls). Single-line Markdown paragraphs. Apply the repo's priority/type labels. Skip if an issue already exists — read it instead.

## Step 3 — Dispatch the worker

Spawn one implementation agent via the Agent tool with `isolation: "worktree"`, `run_in_background: true`, and the tier's model. The prompt must contain, verbatim where possible:

1. The brief (facts, approach, in/out of scope, acceptance criteria, guardrails).
2. The protocol: create branch (repo's naming convention) → implement → run the repo's lint/typecheck/tests → josh-test loop per tier (invoke the Skill tool, skill `josh-test`; fix real findings, re-run only if the pass produced substantive changes) → push → `gh pr create --repo ...` with `Closes #N` → **watch checks in the FOREGROUND to a terminal state** (`gh pr checks --watch`); fix and push if red.
3. Standing guardrails (below) plus any repo-specific ones from the brief.
4. Required final report: issue #, branch, PR URL, verification results, CI state, findings deliberately not fixed.

## Step 4 — Supervise

You stay responsible after dispatch:

- When a worker's completion notification arrives, verify its claims independently: PR exists, checks green (`gh pr checks`), diff sane.
- **Known failure mode:** a worker ends its turn while a checks-watch is still pending and never files its report. If that happens, pick up the watch yourself and write the report from the live state. Don't re-dispatch.
- Record outcomes wherever the session is tracking work (session plan file, task list).

## Standing guardrails (bake into every worker prompt)

- Never touch the user's main checkout, shared env files, or running local services (databases, dev servers); destructive resets of shared state are forbidden — if verification needs one, ship without it and say so in the PR.
- Mutating `gh` calls always pass `--repo` explicitly.
- Conventional Commits; atomic commits; respect path-based release tooling (e.g. release-please: never mix one component's paths into another component's commit).
- Markdown prose is one line per paragraph — no hard wrapping. No internal codenames.
- Workers cannot ask the user questions: make the reasonable call, surface it in the PR body and final report.
- Open the PR; never merge it.

## Batch mode

For N independent issues, run Step 0–2 for all of them first, then dispatch all workers in a single message (parallel tool calls). Check branch/file overlap before dispatching — two workers touching the same files get serialized, not parallelized. Supervise as notifications arrive.
